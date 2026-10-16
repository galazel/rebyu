"""Builds a chat-format fine-tuning dataset for generating ORIGINAL exam
questions, for every certification that has a question bank.

    python scripts/finetune_dataset/build.py

Reads the live database (read-only) through fe_expansion/dbsession.py, which
works with Docker up or down. Writes to scripts/finetune_dataset/out/
(gitignored -- it carries ITPEC/IPA text, reusable for teaching but not ours
to redistribute):

    train.jsonl       {"messages": [system, user, assistant], "meta": {...}}
    val.jsonl         same shape
    reference.jsonl   every source stem, for check_copy.py
    stats.json

Each example asks for a NEW question of one type on one lesson, and shows two
OTHER questions of the same type and topic as style references. The target is
never one of the references, so the model learns "imitate the style, write
different content" rather than "repeat what you were shown".

Question types, and what the assistant turn contains:
    MCQ                question, choices{a..}, answer, explanation
    SHORT_ANSWER       question, answer, accepted_variations
    DESCRIPTIVE        question, model_answer, rubric[{criterion, max_points}]
    CRITICAL_THINKING  question, language, starter_code, test_cases

Skipped on purpose:
  * anything with an image on the stem or a choice -- a text model cannot see
    it, and a stem saying "in the figure below" teaches it to cite figures
    that do not exist;
  * the "Source: (...)" citation on imported past papers is stripped from the
    TARGET, so the model never learns to fabricate an official citation for a
    question it invented. The citation is kept in `meta.source`.
"""

import hashlib
import json
import os
import random
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "fe_expansion"))

from dbsession import open_session  # noqa: E402
from sqlalchemy import text  # noqa: E402

N_REFS = 2
SEED = 14
VAL_EVERY = 10          # 1 in 10 non-past-paper questions goes to val
VAL_YEARS = ("2025", "2026")  # past papers from these sittings are held out whole

CITATION = re.compile(r"\s*Source:\s*\(([^)]*)\)\s*")

# Rows the model must not learn from: seeded test fixtures ("[Q23] ...",
# explanation "Correct."), and stems that point at a figure the text does not
# contain. A table or code shown "below" is usually inline text and is kept.
FIXTURE_STEM = re.compile(r"^\[Q\d+\]")
PLACEHOLDER_EXPL = {"correct.", "correct", "this is the correct answer."}
MISSING_VISUAL = re.compile(
    r"\b(your|the|this|following|above|below) (diagram|figure|chart|graph|exhibit)\b", re.I)

TYPE_LABEL = {
    "MCQ": "multiple choice (exactly one correct choice)",
    "SHORT_ANSWER": "short answer (a word or short phrase, auto-graded by exact match)",
    "DESCRIPTIVE": "descriptive / essay (graded against a model answer and rubric)",
    "CRITICAL_THINKING": "programming task (graded by test cases)",
}

SYSTEM = (
    "You are an expert item writer for professional certification exams. "
    "Write ONE original exam question of the requested type for the given "
    "certification and topic. Match the official exam's scope, difficulty "
    "and wording style. MCQ distractors must be plausible and exactly one "
    "choice correct; short answers must be unambiguous with realistic "
    "accepted variations; descriptive questions need a complete model answer "
    "and a rubric; programming tasks need starter code and test cases. Never "
    "copy or lightly reword a past-paper question or the reference questions "
    "you are shown: change the scenario, the numbers and the angle. Never "
    "invent a source citation. Reply with JSON only."
)


def clean(s):
    return re.sub(r"[ \t]+", " ", (s or "").strip())


def fetch(s):
    qs = s.execute(text("""
        select q.question_id, q.question_type, q.difficulty_level, q.question_text,
               c.certification_id, c.title cert, mj.title major, mc.title middle, l.name lesson
        from questions q
        join lessons l on l.lesson_id = q.lesson_id
        join middle_categories mc on mc.middle_category_id = l.middle_category_id
        join major_categories mj on mj.major_category_id = mc.major_category_id
        join certifications c on c.certification_id = mj.certification_id
        where q.image_key is null
          and not exists (select 1 from choices x where x.question_id = q.question_id
                          and x.image_key is not null)
        order by q.question_id""")).mappings().all()

    choices = defaultdict(list)
    for r in s.execute(text("select question_id, choice_text, is_correct, explanation "
                            "from choices order by question_id, choice_id")).mappings():
        choices[r["question_id"]].append(r)
    textcfg = {r["question_id"]: r for r in s.execute(text(
        "select question_id, correct_answer, accepted_variations from text_question_configs")).mappings()}
    rubric = defaultdict(list)
    for r in s.execute(text("select question_id, name, max_points from question_rubric_criteria "
                            "order by question_id, display_order")).mappings():
        rubric[r["question_id"]].append({"criterion": r["name"], "max_points": float(r["max_points"])})
    prog = {r["question_id"]: r for r in s.execute(text(
        "select question_id, programming_question_config_id pid, language, starter_code "
        "from programming_question_configs")).mappings()}
    tests = defaultdict(list)
    for r in s.execute(text("select programming_question_config_id pid, input_data, expected_output, is_sample "
                            "from programming_test_cases order by programming_test_case_id")).mappings():
        tests[r["pid"]].append({"input": r["input_data"], "expected_output": r["expected_output"],
                                "sample": bool(r["is_sample"])})
    return qs, choices, textcfg, rubric, prog, tests


def to_item(q, choices, textcfg, rubric, prog, tests):
    """Returns the training item, or None when the row is incomplete."""
    stem = q["question_text"] or ""
    m = CITATION.search(stem)
    source = m.group(1) if m else None
    stem = clean(CITATION.sub("\n", stem))
    if len(stem) < 15 or FIXTURE_STEM.match(stem) or MISSING_VISUAL.search(stem):
        return None
    t = q["question_type"]
    out = {"question": stem}

    if t == "MCQ":
        cs = choices.get(q["question_id"], [])
        if len(cs) < 2 or sum(bool(c["is_correct"]) for c in cs) != 1:
            return None
        letters = "abcdefghij"
        out["choices"] = {letters[i]: clean(c["choice_text"]) for i, c in enumerate(cs)}
        out["answer"] = next(letters[i] for i, c in enumerate(cs) if c["is_correct"])
        expl = next((clean(c["explanation"]) for c in cs if c["is_correct"] and c["explanation"]), "")
        if expl.lower() in PLACEHOLDER_EXPL:
            return None
        if expl:
            out["explanation"] = expl
    elif t == "SHORT_ANSWER":
        cfg = textcfg.get(q["question_id"])
        if not cfg or not cfg["correct_answer"]:
            return None
        out["answer"] = clean(cfg["correct_answer"])
        out["accepted_variations"] = [v.strip() for v in (cfg["accepted_variations"] or "").split("\n") if v.strip()]
    elif t == "DESCRIPTIVE":
        cfg = textcfg.get(q["question_id"])
        if not cfg or not cfg["correct_answer"]:
            return None
        out["model_answer"] = clean(cfg["correct_answer"])
        if rubric.get(q["question_id"]):
            out["rubric"] = rubric[q["question_id"]]
    elif t == "CRITICAL_THINKING":
        p = prog.get(q["question_id"])
        if not p or not tests.get(p["pid"]):
            return None
        out["language"] = p["language"]
        out["starter_code"] = p["starter_code"] or ""
        out["test_cases"] = tests[p["pid"]]
    else:
        return None

    if source:
        split = "val" if any(y in source for y in VAL_YEARS) else "train"
    else:
        h = int(hashlib.sha256(stem.encode()).hexdigest()[:8], 16)
        split = "val" if h % VAL_EVERY == 0 else "train"
    return {
        "type": t, "cert": q["cert"], "cert_id": q["certification_id"],
        "topic": "%s > %s > %s" % (q["major"], q["middle"], q["lesson"]),
        "difficulty": q["difficulty_level"], "target": out,
        "source": source or "bank:%d" % q["question_id"], "split": split,
    }


def render_ref(it):
    t = it["target"]
    lines = [t["question"]]
    if "choices" in t:
        lines += ["%s) %s" % kv for kv in t["choices"].items()]
        lines.append("Answer: %s" % t["answer"])
    elif "accepted_variations" in t:
        lines.append("Answer: %s" % t["answer"])
    elif "model_answer" in t:
        lines.append("Model answer: %s" % t["model_answer"][:600])
    return "\n".join(lines)


def build_example(it, pool, rng):
    # References come from the same split only, so val never leaks into
    # train through a prompt.
    others = [p for p in pool if p is not it and p["split"] == it["split"]]
    refs = rng.sample(others, min(N_REFS, len(others)))
    t = it["target"]
    user = ["Certification: %s" % it["cert"],
            "Topic: %s" % it["topic"],
            "Question type: %s" % TYPE_LABEL[it["type"]]]
    if it["difficulty"]:
        user.append("Difficulty: %s" % it["difficulty"])
    if "choices" in t:
        user.append("Number of choices: %d" % len(t["choices"]))
        user.append("Include explanation: %s" % ("yes" if "explanation" in t else "no"))
    if it["type"] == "CRITICAL_THINKING":
        user.append("Language: %s" % t["language"])
    if refs:
        user.append("\nStyle references (do NOT copy):")
        for i, r in enumerate(refs, 1):
            user.append("--- Reference %d ---\n%s" % (i, render_ref(r)))
    user.append("\nWrite a new question.")
    return {
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": "\n".join(user)},
            {"role": "assistant", "content": json.dumps({"type": it["type"], **t}, ensure_ascii=False)},
        ],
        "meta": {"source": it["source"], "cert": it["cert"], "type": it["type"], "topic": it["topic"]},
    }


def main():
    rng = random.Random(SEED)
    s = open_session()
    try:
        rows, *cfg = fetch(s)
    finally:
        s.close()

    items, seen, dropped = [], set(), {"incomplete": 0, "duplicate": 0}
    for q in rows:
        it = to_item(q, *cfg)
        if it is None:
            dropped["incomplete"] += 1
            continue
        key = (it["type"], re.sub(r"\W+", "", it["target"]["question"].lower()))
        if key in seen:
            dropped["duplicate"] += 1
            continue
        seen.add(key)
        items.append(it)

    # Same-type references from the same lesson; fall back to the same
    # certification when a lesson has too few of that type.
    by_lesson, by_cert = defaultdict(list), defaultdict(list)
    for it in items:
        by_lesson[(it["cert_id"], it["topic"], it["type"])].append(it)
        by_cert[(it["cert_id"], it["type"])].append(it)

    os.makedirs(OUT, exist_ok=True)
    splits = {"train": [], "val": []}
    for it in items:
        pool = by_lesson[(it["cert_id"], it["topic"], it["type"])]
        if len(pool) <= N_REFS:
            pool = by_cert[(it["cert_id"], it["type"])]
        splits[it["split"]].append(build_example(it, pool, rng))
    for name, rows_ in splits.items():
        rng.shuffle(rows_)
        with open(os.path.join(OUT, name + ".jsonl"), "w", encoding="utf-8") as f:
            for r in rows_:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")

    with open(os.path.join(OUT, "reference.jsonl"), "w", encoding="utf-8") as f:
        for it in items:
            f.write(json.dumps({"source": it["source"], "question": it["target"]["question"]},
                               ensure_ascii=False) + "\n")

    counts = defaultdict(lambda: defaultdict(int))
    for it in items:
        counts[it["cert"]][it["type"]] += 1
    stats = {"train": len(splits["train"]), "val": len(splits["val"]), "dropped": dropped,
             "by_certification": {k: dict(v) for k, v in counts.items()}}
    json.dump(stats, open(os.path.join(OUT, "stats.json"), "w", encoding="utf-8"), indent=2)
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()

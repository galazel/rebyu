"""Rewrites the 84 non-CodeStrike Python programming questions into every editor language.

Each multilang/lang_*.py module maps question id -> entry. For a code language the entry has
`rules` and `ref`, a complete program whose learner part sits between a `//<<` (or `#<<`) line
and a `//>> <stub>` (or `#>> <stub>`) line. From it:

* reference = ref without the marker lines -- run on Judge0; its stdout is the expected output;
* starter   = ref with each marked part replaced by "Your code here" and the stub line -- it
              must compile and must not already print the answer.

A SQL entry has `intro`, `rules`, `tables` and `statement`: the statement is executed on the tables
(in-memory SQLite) and must return `rows`; the learner never runs SQL (see SqlStatementGrading).

The question text keeps its scenario (language words removed, or `intro` replaces it), then gets the
new rules and a note saying which language and that the starter holds the data and the printing.
In-progress attempt snapshots are refreshed; submitted attempts keep what was answered. One
transaction; dry run by default.

    PYTHONPATH=. .venv/Scripts/python scripts/programming_expected_output/rebuild_multilang.py [--apply] [--only 1,2] [--lang C]
"""
import argparse
import asyncio
import json
import re
import sqlite3
import sys
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).parent / "multilang"))

from explanations import EXPLANATIONS  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402

SUB_WORDING = [("this program", "this query"), ("your program", "your query"), ("your code", "your query"),
               ("your function", "your query"), ("your implementation", "your query")]
from app.services.code_runner import CodeRunnerUnavailable, run_tests  # noqa: E402

MODULES = {"lang_c": "C", "lang_cpp": "C++", "lang_java": "JAVA", "lang_csharp": "C#",
           "lang_js": "JAVASCRIPT", "lang_python": "PYTHON", "lang_sql": "SQL"}
LABEL = {"C": "C", "C++": "C++", "JAVA": "Java", "C#": "C#", "JAVASCRIPT": "JavaScript", "PYTHON": "Python",
         "SQL": "SQL"}

NOTE = re.compile(r"\n*(Your program reads no input\.|Language: \w).*\Z", re.S)
RULES = re.compile(r"\n*Rules for this question:.*\Z", re.S)
SCRUB = [
    (re.compile(r"Write the code for the `(\w+)` class in Python\."), r"Write the `\1` class."),
    (re.compile(r"\s*Implement (?:this|it) in Python\."), ""),
    (re.compile(r"\s*\(?in a language of your choice\)?", re.I), ""),
    (re.compile(r"\s*in your preferred programming language", re.I), ""),
    (re.compile(r"\bin Python\b"), ""),
    (re.compile(r"\b[Aa] Python (function|program|script|class)"), r"a \1"),
    (re.compile(r"\bPython (function|program|script|class)"), r"\1"),
]
MARK_START = re.compile(r"^\s*(//|#)<<\s*$")
MARK_END = re.compile(r"^(\s*)(//|#)>>\s?(.*)$")


def load():
    entries = {}
    for module, language in MODULES.items():
        try:
            questions = __import__(module).QUESTIONS
        except ModuleNotFoundError:
            continue
        for qid, entry in questions.items():
            if qid in entries:
                raise SystemExit(f"#{qid} is in two language files")
            entries[qid] = dict(entry, language=language)
    return entries


def split(ref):
    """(reference, starter) from a marked program."""
    reference, starter, inside = [], [], False
    for line in ref.strip("\n").split("\n"):
        if MARK_START.match(line):
            inside = True
            continue
        end = MARK_END.match(line)
        if end:
            indent, comment, stub = end.groups()
            starter.append(f"{indent}{comment} Your code here")
            if stub.strip():
                starter.append(indent + stub.strip())
            inside = False
            continue
        reference.append(line)
        if not inside:
            starter.append(line)
    if inside:
        raise ValueError("unclosed marker")
    return "\n".join(reference) + "\n", "\n".join(starter) + "\n"


def question_text(old, entry):
    language = entry["language"]
    rules = entry.get("rules")
    if not rules:
        found = re.search(r"Rules for this question:\s*(.*?)(?:\n\n(?:Your program reads no input|Language: )|\Z)",
                          old, re.S)
        if not found:
            raise ValueError("no rules given and none in the question")
        rules = found.group(1).strip()
    if entry.get("intro"):
        body = entry["intro"].strip()
    else:
        body = RULES.sub("", NOTE.sub("", old)).rstrip()
        for pattern, replacement in SCRUB:
            body = pattern.sub(replacement, body)
        for before, after in entry.get("replace", []):
            body = body.replace(before, after)
    body += "\n\nRules for this question: " + rules
    if language == "SQL":
        body += ("\n\nLanguage: SQL. Write ONE SQL statement (SQLite dialect) using the tables shown with the "
                 "problem. You cannot run it: when you submit, it is compared with the correct statement, so it "
                 "must return exactly the result described. Formatting, letter case and aliases do not matter.")
    else:
        body += (f"\n\nLanguage: {LABEL[language]}. Your program reads no input: the starter code already holds "
                 "the data and prints the result. Complete the parts marked \"Your code here\" and keep "
                 "everything else as it is -- the printed output must match the expected output exactly "
                 "(trailing spaces ignored).")
    return body


async def judge(code, language):
    for attempt in range(4):
        try:
            return (await run_tests(code, [""], language))[0]
        except CodeRunnerUnavailable:
            if attempt == 3:
                raise
            await asyncio.sleep(5 * (attempt + 1))


def check_sql(entry):
    db = sqlite3.connect(":memory:")
    try:
        db.executescript(entry["tables"])
        rows = db.execute(entry["statement"].rstrip().rstrip(";")).fetchall()
    finally:
        db.close()
    if not rows:
        return None, "statement returns no rows"
    if "rows" in entry and rows != entry["rows"]:
        return None, f"statement returns {rows!r}, expected {entry['rows']!r}"
    return rows, None


async def build(qid, entry):
    """(starter, expected, note) or raises ValueError with the reason."""
    language = entry["language"]
    if language == "SQL":
        rows, problem = check_sql(entry)
        if problem:
            raise ValueError(problem)
        return entry["tables"].strip() + "\n", entry["statement"].strip(), f"{len(rows)} row(s): {rows[:2]!r}"
    reference, starter = split(entry["ref"])
    ran = await judge(reference, language)
    if not ran.ok or not ran.stdout.strip():
        raise ValueError("reference failed: " + (ran.error or "printed nothing")[:400])
    stub = await judge(starter, language)
    error = stub.error or ""
    if not stub.ok and re.search(r"error|Error:|cannot find symbol|expected", error) and "Exception" not in error \
            and "Traceback" not in error and "Segmentation" not in error and "Runtime" not in error:
        if re.search(r"(error:|error CS|SyntaxError|cannot find symbol|IndentationError)", error):
            raise ValueError("starter does not compile: " + error[:400])
    if stub.stdout.rstrip() == ran.stdout.rstrip():
        raise ValueError("the empty starter already prints the answer")
    return starter, ran.stdout, ran.stdout.rstrip()[:110].replace("\n", " / ")


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--only")
    parser.add_argument("--lang")
    args = parser.parse_args()
    entries = load()
    if args.only:
        wanted = {int(x) for x in args.only.split(",")}
        entries = {k: v for k, v in entries.items() if k in wanted}
    if args.lang:
        entries = {k: v for k, v in entries.items() if v["language"] == args.lang.upper()}

    session = SessionLocal()
    failed, done = [], 0
    try:
        rows = dict(session.execute(text("select question_id, question_text from questions where question_id = any(:i)"),
                                    {"i": list(entries)}).all())
        missing = sorted(set(entries) - set(rows))
        if missing:
            raise SystemExit(f"not in the database: {missing}")
        for qid in sorted(entries):
            entry = entries[qid]
            try:
                starter, expected, note = await build(qid, entry)
            except ValueError as error:
                failed.append(qid)
                print(f"#{qid} {entry['language']}: FAILED {error}", flush=True)
                continue
            new_text = question_text(rows[qid], entry)
            leftover = re.findall(r"[^.\n]*\bPython\b[^.\n]*", new_text) if entry["language"] != "PYTHON" else []
            print(f"#{qid} {entry['language']}: ok -> {note!r}" + (f"  [mentions Python: {leftover[:2]}]" if leftover else ""),
                  flush=True)
            done += 1
            if args.apply:
                approach, mistake = EXPLANATIONS[qid]
                session.execute(text("update questions set question_text = :t, explanation = :e where question_id = :q"),
                                {"t": new_text, "e": approach + "\n\nCommon mistake: " + mistake, "q": qid})
                if entry["language"] == "SQL":
                    for sub_id, sub_text in session.execute(text(
                            "select question_id, question_text from questions where parent_question_id = :q"), {"q": qid}).all():
                        new_sub = sub_text
                        for before, after in SUB_WORDING:
                            new_sub = new_sub.replace(before, after).replace(before.capitalize(), after.capitalize())
                        if new_sub != sub_text:
                            session.execute(text("update questions set question_text = :t where question_id = :q"),
                                            {"t": new_sub, "q": sub_id})
                session.execute(text("update programming_question_configs set language = :l, starter_code = :s, "
                                     "expected_output = :e where question_id = :q"),
                                {"l": entry["language"], "s": starter, "e": expected, "q": qid})
                snaps = session.execute(text("""
                    select aq.attempt_question_id, aq.question_data_snapshot from assessment_attempt_questions aq
                    join assessment_attempts a on a.assessment_attempt_id = aq.assessment_attempt_id
                    where aq.source_question_id = :q and a.submitted_at is null"""), {"q": qid}).all()
                for aqid, snapshot in snaps:
                    data = json.loads(snapshot or "{}")
                    data["starterCode"] = starter
                    data["programmingLanguage"] = entry["language"]
                    if "questionText" in data:
                        data["questionText"] = new_text
                    session.execute(text("update assessment_attempt_questions set question_data_snapshot = :d, "
                                         "question_text_snapshot = :t where attempt_question_id = :a"),
                                    {"d": json.dumps(data), "t": new_text, "a": aqid})
        print(f"\nok: {done}, failed: {len(failed)} {failed}")
        if args.apply and not failed:
            session.commit()
            print("committed")
        else:
            session.rollback()
            print("rolled back" + (" (failures)" if args.apply else " (dry run)"))
    finally:
        session.close()


asyncio.run(main())

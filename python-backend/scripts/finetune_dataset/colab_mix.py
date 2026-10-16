"""Colab: mixes the REBYU question dataset with three public datasets.

Upload out/train.jsonl and out/val.jsonl next to this file, then:

    !pip install -q datasets
    !huggingface-cli login        # verifiable-coding-problems needs it
    %run colab_mix.py

Writes mixed_train.jsonl / mixed_val.jsonl (same {"messages": [...]} shape).

Why the mix, and why these proportions:
  * REBYU questions are the task. They stay the majority -- about 70% of the
    mix -- or the model drifts toward generic chat.
  * Open-Orca/OpenOrca is general instruction data. A small slice (~15%)
    keeps reasoning and instruction-following from collapsing while the
    model specialises; this is regularisation, not new exam knowledge.
  * PrimeIntellect/verifiable-coding-problems is converted into the SAME
    CRITICAL_THINKING target the bank uses (question, language, starter_code,
    test_cases). The bank has only ~150 programming tasks, far too few to
    learn the format from; these supply volume (~15%). They are tagged as a
    generic "Programming" certification so they never pose as an exam's
    official content.
  * sequelbox/UML-Generator-Dataset-DeepSeek-V3.2 becomes DIAGRAM questions
    (scenario + reference XMI diagram), ~8%. The bank has none of its own.

Ratios are knobs: change ORCA_SHARE / CODE_SHARE below.
"""

import ast
import json
import random
import re

from datasets import load_dataset

ORCA_SHARE = 0.15
CODE_SHARE = 0.12       # set to 0 to skip the coding dataset entirely
UML_SHARE = 0.08        # set to 0 to skip the UML dataset entirely
MAX_TESTS = 6
SEED = 14
rng = random.Random(SEED)


def read(path):
    return [json.loads(l) for l in open(path, encoding="utf-8")]


train, val = read("train.jsonl"), read("val.jsonl")
SYSTEM = train[0]["messages"][0]["content"]
n_rebyu = len(train)
total = int(n_rebyu / (1 - ORCA_SHARE - CODE_SHARE - UML_SHARE))
n_orca, n_code, n_uml = (int(total * x) for x in (ORCA_SHARE, CODE_SHARE, UML_SHARE))


def chat(system, user, assistant, source):
    msgs = ([{"role": "system", "content": system}] if system else []) + [
        {"role": "user", "content": user}, {"role": "assistant", "content": assistant}]
    return {"messages": msgs, "meta": {"source": source}}


# --- OpenOrca: one ~1 GB file, downloaded once, sampled by index ------------
# Streaming with a shuffle read through gigabytes before yielding a row and
# looked hung. The GPT-4 half is the better-quality half anyway, and a
# downloaded Arrow file is memory-mapped, so sampling it costs no RAM.
print("[1/3] OpenOrca: downloading the 1M GPT-4 file (~1 GB, about a minute)...", flush=True)
orca_ds = load_dataset("Open-Orca/OpenOrca", data_files="1M-GPT4-Augmented.parquet", split="train")
orca = []
for i in rng.sample(range(len(orca_ds)), min(len(orca_ds), (n_orca + n_orca // 10) * 2)):
    r = orca_ds[i]
    if r["question"] and r["response"] and len(r["response"]) < 4000:
        orca.append(chat(r["system_prompt"], r["question"], r["response"], "openorca"))
    if len(orca) >= n_orca + n_orca // 10:
        break
print("  orca: %d rows" % len(orca), flush=True)
del orca_ds


# --- Verifiable coding problems -> CRITICAL_THINKING -----------------------
CODE_PREAMBLE = re.compile(r"^Solve the following coding problem using the programming language \w+:\s*")


def tests_of(info):
    # Stored as a Python dict repr (single quotes), not JSON.
    if isinstance(info, str):
        try:
            info = json.loads(info)
        except ValueError:
            info = ast.literal_eval(info)
    cases = info.get("test_cases") or []
    out = []
    for c in cases[:MAX_TESTS]:
        i, o = c.get("input"), c.get("output")
        if isinstance(i, str) and isinstance(o, str) and len(i) < 500 and len(o) < 500:
            out.append({"input": i, "expected_output": o, "sample": not out})
    return out, info.get("language", "python")


print("[2/3] verifiable-coding-problems: opening stream...", flush=True)
code = []
ds = load_dataset("PrimeIntellect/verifiable-coding-problems", split="train", streaming=True)
print("coding dataset columns:", ds.column_names)  # check if the schema changes
# Rows carry their full test-case JSON (often MBs) and the reference solution.
# Even a 500-row shuffle buffer ran Colab out of RAM, so: read only the two
# columns used, no shuffle buffer, and take every 7th row for variety instead.
ds = ds.select_columns(["prompt", "verification_info"])
for n_seen, r in enumerate(ds if n_code else []):
    if n_seen % 7:
        continue
    try:
        tests, lang = tests_of(r["verification_info"])
    except (ValueError, KeyError, TypeError, SyntaxError):
        continue
    # The preamble is an instruction to a solver, not part of the question.
    prompt = CODE_PREAMBLE.sub("", (r.get("prompt") or "").strip())
    if not tests or not (200 < len(prompt) < 3500):
        continue
    target = {"type": "CRITICAL_THINKING", "question": prompt, "language": lang,
              "starter_code": "", "test_cases": tests}
    user = ("Certification: Programming (general practice)\n"
            "Topic: Algorithms and problem solving\n"
            "Question type: programming task (graded by test cases)\n"
            "Language: %s\n\nWrite a new question." % lang)
    code.append(chat(SYSTEM, user, json.dumps(target, ensure_ascii=False), "verifiable-coding"))
    if len(code) % 500 == 0:
        print("  code: %d rows" % len(code), flush=True)
    if len(code) >= n_code + n_code // 10:
        break
print("  code: %d rows" % len(code), flush=True)


# --- UML generator -> DIAGRAM ----------------------------------------------
# The bank has no DIAGRAM questions to learn from, so this set supplies the
# whole format: a scenario the candidate must model, plus the reference
# diagram (PlantUML text) a grader compares against.
UML_TYPES = ["class", "sequence", "use case", "activity", "state", "component",
             "deployment", "object", "entity relationship", "erd"]


def pick(r, keys):
    for k in keys:
        v = r.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return None


def diagram_of(text):
    # Completions are "<think>reasoning</think>" then raw XMI (UML's XML form),
    # unfenced. The reasoning is dropped: the target is the diagram alone.
    text = text.split("</think>", 1)[-1].strip()
    m = re.search(r"<\?xml.*?</xmi:XMI>", text, re.S)
    if m:
        return m.group(0).replace("\r\n", "\n")
    m = re.search(r"@startuml.*?@enduml", text, re.S)
    if m:
        return m.group(0)
    m = re.search(r"```(?:plantuml|puml|mermaid|xml)?\s*(.*?)```", text, re.S)
    return m.group(1).strip() if m else None


print("[3/3] UML generator: opening stream...", flush=True)
uml = []
ds = load_dataset("sequelbox/UML-Generator-Dataset-DeepSeek-V3.2", split="train", streaming=True)
print("uml dataset columns:", ds.column_names)  # adjust pick() keys if these differ
for n_seen, r in enumerate(ds if n_uml else []):
    if n_seen % 3:
        continue
    prompt = pick(r, ["prompt", "instruction", "question", "input"])
    reply = pick(r, ["response", "output", "answer", "completion"])
    diagram = diagram_of(reply or "")
    if not prompt or not diagram or len(prompt) > 3000 or len(diagram) > 5000:
        continue
    low = prompt.lower()
    kind = next((t for t in UML_TYPES if t in low), "class")
    target = {"type": "DIAGRAM", "question": prompt, "diagram_type": kind.upper().replace(" ", "_"),
              "reference_diagram": diagram}
    user = ("Certification: Software design (general practice)\n"
            "Topic: UML modelling\n"
            "Question type: diagram (candidate draws a %s diagram, graded against a reference)\n"
            "\nWrite a new question." % kind)
    uml.append(chat(SYSTEM, user, json.dumps(target, ensure_ascii=False), "uml-generator"))
    if len(uml) % 500 == 0:
        print("  uml: %d rows" % len(uml), flush=True)
    if len(uml) >= n_uml + n_uml // 10:
        break
print("  uml: %d rows" % len(uml), flush=True)


def split(rows, n):
    rng.shuffle(rows)
    return rows[:n], rows[n:]


orca_tr, orca_va = split(orca, n_orca)
code_tr, code_va = split(code, n_code)
uml_tr, uml_va = split(uml, n_uml)
mixed_train = train + orca_tr + code_tr + uml_tr
mixed_val = val + orca_va + code_va + uml_va
rng.shuffle(mixed_train)
rng.shuffle(mixed_val)

for name, rows in (("mixed_train.jsonl", mixed_train), ("mixed_val.jsonl", mixed_val)):
    with open(name, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

print("train: %d rebyu + %d orca + %d code + %d uml = %d" % (n_rebyu, len(orca_tr), len(code_tr), len(uml_tr), len(mixed_train)))
print("val:   %d" % len(mixed_val))

# Then:
#   ds = load_dataset("json", data_files={"train": "mixed_train.jsonl",
#                                         "validation": "mixed_val.jsonl"})
#   ds = ds.remove_columns("meta")
#   ...apply tokenizer.apply_chat_template to "messages" and train.

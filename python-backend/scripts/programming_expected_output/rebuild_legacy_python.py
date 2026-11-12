"""Rebuilds the 74 legacy Python programming questions from verified reference solutions.

For every question in legacy_python_fixes.FIXES:

* starter  = the reference with every function body emptied (same names and signatures,
             no logic), ending with the lines that run it on the question's data and print
             the result -- the learner only implements the code above them;
* expected = what reference + those lines print when run on Judge0 (not a guess);
* question = the old "Your program reads no input..." note is replaced by the exact lines
             the starter runs, and rules are replaced where the old ones were missing;
* language = PYTHON (these had none, so the editor opened in Java and grading assumed Java).

Each reference must run cleanly, the empty starter must run without a syntax error and must
not already print the answer. Attempt snapshots of IN-PROGRESS attempts are refreshed so a
learner mid-attempt sees the new starter; submitted attempts keep what they answered.
One transaction; dry run by default.

    PYTHONPATH=. .venv/Scripts/python scripts/programming_expected_output/rebuild_legacy_python.py [--apply] [--only 2241,2293]
"""
import argparse
import ast
import asyncio
import json
import re
import sys
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).parent))

from legacy_python_fixes import FIXES, STDIN_SENTENCE  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.services.code_runner import CodeRunnerUnavailable, run_tests  # noqa: E402

NOTE = re.compile(r"\n*Your program reads no input\..*\Z", re.S)
RULES = re.compile(r"\n*Rules for this question:.*\Z", re.S)
RUN_HEADER = "# Runs your code on the question's data and prints the result -- keep these lines."


def stub_of(reference: str) -> str:
    """The reference with each function body replaced by a placeholder."""
    source = reference.strip("\n")
    lines = source.split("\n")
    tree = ast.parse(source)
    functions = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
    for fn in sorted(functions, key=lambda n: n.lineno, reverse=True):
        first, last = fn.body[0].lineno, fn.body[-1].end_lineno
        indent = re.match(r"\s*", lines[first - 1]).group(0)
        lines[first - 1:last] = [indent + "# Your code here", indent + "pass"]
    stub = "\n".join(lines)
    ast.parse(stub)
    return stub


def question_text(old: str, fix: dict) -> str:
    body = NOTE.sub("", old).replace(STDIN_SENTENCE, "").rstrip()
    for before, after in fix.get("replace", []):
        body = body.replace(before, after)
    rules = fix.get("rules")
    if rules:
        body = RULES.sub("", body).rstrip() + "\n\nRules for this question: " + rules
    return (body + "\n\nYour program reads no input. The starter code ends with the lines that run your code on "
            "the question's data and print the result:\n" + fix["run"].strip() + "\n\nKeep those lines as they "
            "are, complete the code above them, and make the printed output match exactly.")


async def run(code: str):
    """One Judge0 run, retried when the runner is slow or unreachable."""
    for attempt in range(4):
        try:
            return (await run_tests(code, [""], "PYTHON"))[0]
        except CodeRunnerUnavailable:
            if attempt == 3:
                raise
            await asyncio.sleep(5 * (attempt + 1))


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--only")
    args = parser.parse_args()
    only = {int(x) for x in args.only.split(",")} if args.only else None

    session = SessionLocal()
    report = {"same": [], "changed": [], "failed": []}
    try:
        rows = session.execute(text(
            "select q.question_id, q.question_text, p.expected_output from questions q "
            "join programming_question_configs p on p.question_id = q.question_id "
            "where q.question_id = any(:ids)"), {"ids": list(FIXES)}).all()
        found = {r[0] for r in rows}
        missing = sorted(set(FIXES) - found)
        if missing:
            print("not in the database:", missing)

        for qid, old_text, old_expected in sorted(rows):
            if only and qid not in only:
                continue
            fix = FIXES[qid]
            reference = fix["ref"].strip("\n") + "\n\n\n" + fix["run"].strip() + "\n"
            starter = stub_of(fix["ref"]) + "\n\n\n" + RUN_HEADER + "\n" + fix["run"].strip() + "\n"

            ref_result = await run(reference)
            if not ref_result.ok or not (ref_result.stdout or "").strip():
                report["failed"].append(qid)
                print(f"#{qid}: REFERENCE FAILED: {(ref_result.error or ref_result.stdout or '')[:400]}")
                continue
            stub_result = await run(starter)
            if "SyntaxError" in (stub_result.error or "") or "IndentationError" in (stub_result.error or ""):
                report["failed"].append(qid)
                print(f"#{qid}: STARTER DOES NOT PARSE: {stub_result.error[:300]}")
                continue
            expected = ref_result.stdout
            if (stub_result.stdout or "").rstrip() == expected.rstrip():
                report["failed"].append(qid)
                print(f"#{qid}: the empty starter already prints the answer")
                continue

            same = (old_expected or "").rstrip() == expected.rstrip()
            report["same" if same else "changed"].append(qid)
            print(f"#{qid}: {'same answer' if same else 'new data/answer'} -> {expected.rstrip()[:120]!r}")

            if args.apply:
                new_text = question_text(old_text, fix)
                session.execute(text("update questions set question_text = :t where question_id = :q"),
                                {"t": new_text, "q": qid})
                session.execute(text("update programming_question_configs set language = 'PYTHON', "
                                     "starter_code = :s, expected_output = :e where question_id = :q"),
                                {"s": starter, "e": expected, "q": qid})
                snaps = session.execute(text("""
                    select aq.attempt_question_id, aq.question_data_snapshot
                    from assessment_attempt_questions aq
                    join assessment_attempts a on a.assessment_attempt_id = aq.assessment_attempt_id
                    where aq.source_question_id = :q and a.submitted_at is null"""), {"q": qid}).all()
                for aqid, snapshot in snaps:
                    data = json.loads(snapshot or "{}")
                    data["starterCode"] = starter
                    data["programmingLanguage"] = "PYTHON"
                    if "questionText" in data:
                        data["questionText"] = new_text
                    session.execute(text("update assessment_attempt_questions set question_data_snapshot = :d, "
                                         "question_text_snapshot = :t where attempt_question_id = :a"),
                                    {"d": json.dumps(data), "t": new_text, "a": aqid})

        print(f"\nsame answer: {len(report['same'])}, new data/answer: {len(report['changed'])}, "
              f"failed: {len(report['failed'])} {report['failed']}")
        if args.apply and not report["failed"]:
            session.commit()
            print("committed")
        else:
            session.rollback()
            print("rolled back" + (" (failures above)" if args.apply else " (dry run)"))
    finally:
        session.close()


asyncio.run(main())

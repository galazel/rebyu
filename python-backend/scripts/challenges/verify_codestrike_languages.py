"""Runs every language port of the live CodeStrike problems on Judge0 and checks that it
prints exactly the live expected output, and that its starter does not already print it.

    PYTHONPATH=. .venv/Scripts/python scripts/challenges/verify_codestrike_languages.py
"""
import asyncio
import sys
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).parent))

from codestrike_languages import build  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.services.code_runner import run_tests  # noqa: E402


def live_problems():
    session = SessionLocal()
    try:
        return session.execute(text("""
            select eq.display_order, q.question_id, p.starter_code, p.expected_output
            from exam_questions eq join questions q on q.question_id = eq.question_id
            join programming_question_configs p on p.question_id = q.question_id
            where eq.exam_id = 609 order by eq.display_order""")).all()
    finally:
        session.close()


async def main():
    ok = True
    for number, qid, starter, expected in live_problems():
        language, port_starter, reference = build(number, starter)
        if reference is None:
            print(f"p{number} #{qid} PYTHON  unchanged")
            continue
        run_as = "PYTHON" if language == "PSEUDOCODE" else language
        result = (await run_tests(reference, [""], run_as))[0]
        got = (result.stdout or "").rstrip()
        match = result.ok and got == expected.rstrip()
        starter_prints = None
        if language != "PSEUDOCODE":
            stub = (await run_tests(port_starter, [""], language))[0]
            starter_prints = (stub.stdout or "").rstrip()
        stub_ok = starter_prints != expected.rstrip()
        ok &= match and stub_ok
        print(f"p{number} #{qid} {language:10} match={match} starter_not_answer={stub_ok}"
              + ("" if match else f"\n   got={got!r}\n   want={expected!r}\n   err={(result.error or '')[:400]}"))
    print("ALL OK" if ok else "FAILURES ABOVE")


asyncio.run(main())

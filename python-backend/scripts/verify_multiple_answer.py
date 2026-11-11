"""Generates a few MULTIPLE_ANSWER questions with the configured model, writes them
through the real persistence code and reads the rows back -- inside a transaction
that is rolled back, so nothing is left in the database.

    docker compose exec -T python-api python scripts/verify_multiple_answer.py
"""
import asyncio
import json

from sqlalchemy import text

from app.ai.invocation import invoke_question_agent, questions_as_dicts
from app.db.session import SessionLocal
from app.services.assessment_persistence import _persist_one_question

CONTEXT = """Lesson: Ethernet switching and MAC addresses.
A switch learns source MAC addresses into its MAC address table and forwards frames
by destination MAC. Unknown unicast, broadcast and multicast frames are flooded out
every port in the VLAN except the one they arrived on. Each switch port is its own
collision domain; all ports in one VLAN form a single broadcast domain. A MAC address
is 48 bits: the first 24 bits are the OUI assigned to the vendor. The broadcast MAC is
FF:FF:FF:FF:FF:FF. Entries age out of the table after 300 seconds by default."""


async def main() -> None:
    batch = await invoke_question_agent(
        "Verification: CCNA Ethernet switching",
        CONTEXT,
        "Generate exactly 3 questions. Use these question types: MULTIPLE_ANSWER.",
        count=3,
    )
    questions = questions_as_dicts(batch)
    print(f"generated {len(questions)} question(s)")

    session = SessionLocal()
    try:
        lesson_id = session.execute(text("select lesson_id from lessons order by lesson_id limit 1")).scalar()
        for number, question in enumerate(questions, 1):
            print(f"\n--- {number}. {question['question_type']} ---")
            print(question["question"])
            for index, choice in enumerate(question.get("choices") or []):
                mark = "RIGHT" if index in (question.get("correct_choice_indices") or []) else "wrong"
                print(f"  [{mark}] {choice}")
                print(f"          why: {(question.get('choice_explanations') or [''] * 99)[index]}")

            question["_lesson_id"] = lesson_id
            question_id = _persist_one_question(session, question)
            stored = session.execute(
                text("select question_type from questions where question_id = :id"), {"id": question_id}
            ).scalar()
            rows = session.execute(
                text("select choice_text, is_correct, explanation is not null as explained "
                     "from choices where question_id = :id order by choice_id"),
                {"id": question_id},
            ).all()
            expected = sorted(question["choices"][i] for i in question["correct_choice_indices"])
            stored_right = sorted(row.choice_text for row in rows if row.is_correct)
            print(json.dumps({
                "stored_type": stored,
                "stored_choices": len(rows),
                "stored_right": stored_right,
                "right_matches_generated": stored_right == expected,
                "every_choice_explained": all(row.explained for row in rows),
            }, indent=2))
    finally:
        session.rollback()
        session.close()
        print("\nrolled back -- nothing was kept")


asyncio.run(main())

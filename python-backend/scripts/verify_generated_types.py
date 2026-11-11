"""Generates every question type the certification generator can write, using the
configured model, saves each through the real persistence code and reads the rows
back -- inside one transaction that is rolled back, so nothing is kept.

    docker compose exec -T python-api python - < python-backend/scripts/verify_generated_types.py
"""
import asyncio
import json

from sqlalchemy import text

from app.ai.invocation import invoke_question_agent, questions_as_dicts
from app.db.session import SessionLocal
from app.graphs.certification.nodes import blank_format_rule
from app.services.assessment_persistence import _persist_one_question

CONTEXT = """Lesson: Databases and programming basics for a library system.
A relational database stores data in tables. A primary key uniquely identifies each row;
a foreign key references the primary key of another table and enforces referential
integrity. A library has Members, Books and Loans: one member can have many loans, each
loan is for exactly one book, and a book can be loaned many times over its life. An ER
diagram shows entities, attributes and the cardinality of relationships. Normalisation to
third normal form removes transitive dependencies. SQL SELECT reads rows, JOIN combines
tables on matching keys, GROUP BY with COUNT aggregates. In Python, a function receives
arguments and returns a value; a for loop iterates over a list; sum(values) / len(values)
gives the mean, and an empty list must be handled to avoid ZeroDivisionError."""

CASES = [
    ("MCQ", "Generate exactly 2 questions. Use these question types: MCQ."),
    ("MULTIPLE_ANSWER", "Generate exactly 2 questions. Use these question types: MULTIPLE_ANSWER."),
    ("SHORT_ANSWER", "Generate exactly 2 questions. Use these question types: SHORT_ANSWER."),
    ("FILL_IN_BLANK", "Generate exactly 2 questions. Use these question types: SHORT_ANSWER."
     + blank_format_rule({"requested_question_types": ["FILL_IN_BLANK"]})),
    ("DESCRIPTIVE", "Generate exactly 1 question. Use these question types: DESCRIPTIVE."),
    ("PROGRAMMING", "Generate exactly 1 question. Use these question types: PROGRAMMING. "
     "Use Python."),
    ("DIAGRAM", "Generate exactly 1 question. Use these question types: DIAGRAM. "
     "Make it an ERD."),
]


def read_back(session, question_id):
    q = session.execute(text(
        "select question_type, question_text from questions where question_id = :id"),
        {"id": question_id}).one()
    choices = session.execute(text(
        "select choice_text, is_correct, explanation is not null as explained "
        "from choices where question_id = :id order by choice_id"), {"id": question_id}).all()
    tconf = session.execute(text(
        "select correct_answer, checking_method, accepted_variations "
        "from text_question_configs where question_id = :id"), {"id": question_id}).all()
    subs = session.execute(text(
        "select q.question_id, q.question_type, q.question_text, t.correct_answer, t.checking_method "
        "from questions q left join text_question_configs t on t.question_id = q.question_id "
        "where q.parent_question_id = :id order by q.question_id"), {"id": question_id}).all()
    prog = session.execute(text(
        "select starter_code is not null as has_starter, expected_output "
        "from programming_question_configs where question_id = :id"), {"id": question_id}).all()
    diag = session.execute(text(
        "select diagram_type, length(reference_diagram_xml) as xml_chars "
        "from diagram_question_configs where question_id = :id"), {"id": question_id}).all()
    return {
        "stored_type": q.question_type,
        "choices": [f"{'RIGHT' if c.is_correct else 'wrong'}{'' if c.explained else ' (no explanation)'}: {c.choice_text}"
                    for c in choices],
        "text_config": [dict(r._mapping) for r in tconf],
        "sub_questions": [dict(r._mapping) for r in subs],
        "programming_config": [dict(r._mapping) for r in prog],
        "diagram_config": [dict(r._mapping) for r in diag],
    }


async def generate(label, instruction):
    try:
        batch = await invoke_question_agent(f"Verification: {label}", CONTEXT, instruction)
        return label, questions_as_dicts(batch), None
    except Exception as error:  # noqa: BLE001 -- report every type, even when one fails
        return label, [], f"{type(error).__name__}: {error}"


async def main() -> None:
    results = await asyncio.gather(*(generate(label, instruction) for label, instruction in CASES))
    session = SessionLocal()
    try:
        lesson_id = session.execute(text("select lesson_id from lessons order by lesson_id limit 1")).scalar()
        for label, questions, error in results:
            print(f"\n================ {label} ================")
            if error:
                print("GENERATION FAILED:", error[:600])
                continue
            for question in questions:
                print(f"\n[generated as {question['question_type']}] {question['question']}")
                question["_lesson_id"] = lesson_id
                question_id = _persist_one_question(session, question)
                print(json.dumps(read_back(session, question_id), indent=2, default=str)[:2500])
    finally:
        session.rollback()
        session.close()
        print("\nrolled back -- nothing was kept")


asyncio.run(main())

"""One question of every generated type, shaped exactly as the model returns it, run
through the same validation (QuestionDraft) and shuffling as real generation, then
saved by the real persistence code and read back. No AI call; everything is rolled
back, so nothing is kept.

    docker compose exec -T python-api python -u - < python-backend/scripts/verify_question_persistence.py
"""
import json

from sqlalchemy import text

from app.domain.choice_order import shuffle_choices
from app.db.session import SessionLocal
from app.schemas.certification.question_schema import QuestionDraft
from app.services.assessment_persistence import _persist_one_question

WHY = "Explained so a learner sees why this option is right or wrong."
EXPLAIN = "Explains what the item tests and why the right answer is right."

DRAFTS = {
    "MCQ": dict(
        question_type="MCQ", question="Which key uniquely identifies a row in a table?",
        explanation=EXPLAIN, common_mistake="A frequent wrong answer, and why it is wrong.", choices=["Primary key", "Foreign key", "Index", "View"],
        correct_choice_index=0, choice_explanations=[WHY] * 4),
    "MULTIPLE_ANSWER": dict(
        question_type="MULTIPLE_ANSWER",
        question="Which two statements about foreign keys are true? (Choose two.)",
        explanation=EXPLAIN, common_mistake="A frequent wrong answer, and why it is wrong.",
        choices=["It references another table's primary key", "It must be unique in its table",
                 "It enforces referential integrity", "It can only be numeric",
                 "It replaces the primary key"],
        correct_choice_indices=[0, 2], choice_explanations=[WHY] * 5),
    "SHORT_ANSWER": dict(
        question_type="SHORT_ANSWER", question="What does SQL stand for?", explanation=EXPLAIN, common_mistake="A frequent wrong answer, and why it is wrong.",
        correct_answer="Structured Query Language", accepted_variations=["structured query language"]),
    "FILL_IN_BLANK": dict(
        question_type="SHORT_ANSWER",
        question=("A column that uniquely identifies each row is the (A). A column that points "
                  "at another table's row is the (B).\n\nCandidates: index, primary key, view, "
                  "foreign key"),
        explanation=EXPLAIN, common_mistake="A frequent wrong answer, and why it is wrong.", correct_answer="(A) primary key; (B) foreign key",
        sub_questions=[{"question": "(A)", "rubric_answer": "primary key", "points": 0.5},
                       {"question": "(B)", "rubric_answer": "foreign key", "points": 0.5}]),
    "DESCRIPTIVE": dict(
        question_type="DESCRIPTIVE", question="Explain why third normal form removes update anomalies.",
        explanation=EXPLAIN, common_mistake="A frequent wrong answer, and why it is wrong.", rubric_answer="Removing transitive dependencies stores each fact once."),
    "PROGRAMMING": dict(
        question_type="PROGRAMMING", question="Write a program that prints the mean of [2, 4, 6].",
        explanation=EXPLAIN, common_mistake="A frequent wrong answer, and why it is wrong.", programming_language="Python", starter_code="values = [2, 4, 6]\n",
        rules="Print the mean as a float, e.g. 4.0, on one line.",
        reference_solution="values = [2, 4, 6]\nprint(sum(values) / len(values))\n",
        expected_output="4.0",
        sub_questions=[{"question": "What happens with an empty list?",
                        "rubric_answer": "ZeroDivisionError unless handled."}]),
    "DIAGRAM": dict(
        question_type="DIAGRAM", question="Draw the ERD for Members, Books and Loans.",
        explanation=EXPLAIN, common_mistake="A frequent wrong answer, and why it is wrong.", diagram_type="ERD",
        instructions="Show the three entities, their keys and the cardinalities."),
}


def read_back(session, question_id):
    one = lambda sql: [dict(r._mapping) for r in session.execute(text(sql), {"id": question_id}).all()]
    return {
        "question": one("select question_type, to_jsonb(q)->>'explanation' as explanation "
                       "from questions q where question_id = :id"),
        "choices": one("select choice_text, is_correct, explanation is not null as explained "
                       "from choices where question_id = :id order by choice_id"),
        "text_config": one("select correct_answer, checking_method, accepted_variations "
                           "from text_question_configs where question_id = :id"),
        "sub_questions": one("select q.question_type, q.question_text, t.correct_answer, t.checking_method "
                             "from questions q left join text_question_configs t on t.question_id = q.question_id "
                             "where q.parent_question_id = :id order by q.question_id"),
        "programming_config": one("select starter_code, expected_output "
                                  "from programming_question_configs where question_id = :id"),
        "diagram_config": one("select diagram_type from diagram_question_configs where question_id = :id"),
    }


session = SessionLocal()
try:
    lesson_id = session.execute(text("select lesson_id from lessons order by lesson_id limit 1")).scalar()
    for label, fields in DRAFTS.items():
        print(f"\n================ {label} ================")
        try:
            question = shuffle_choices(QuestionDraft(**fields).model_dump())
        except Exception as error:  # noqa: BLE001 -- report each type
            print("VALIDATION FAILED:", error)
            continue
        question["_lesson_id"] = lesson_id
        try:
            with session.begin_nested():
                question_id = _persist_one_question(session, question)
                print(json.dumps(read_back(session, question_id), indent=1, default=str))
        except Exception as error:  # noqa: BLE001
            print("SAVE FAILED:", type(error).__name__, str(error)[:500])
finally:
    session.rollback()
    session.close()
    print("\nrolled back -- nothing was kept")

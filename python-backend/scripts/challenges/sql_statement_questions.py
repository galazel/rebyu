"""Turns every SQL question into a statement question.

A SQL question describes a business system, gives its tables with their data, and asks
"Write a SQL statement to ..." -- it tests which statement a practitioner writes (the
clauses, joins and conditions), in the style of the TOPCIT database tasks. The learner
cannot run it: on submit the statement is compared with the correct statement (backend
`SqlStatementGrading`), which a SQL item keeps in `programming_question_configs.expected_output`.
`starter_code` holds only the tables -- CREATE TABLE and INSERT statements the learner
sees rendered as tables.

The only SQL question live on 2026-11-12 was CodeStrike problem 5 (#23632), an algorithm
puzzle (critical path via WITH RECURSIVE) graded by printed output. It is replaced by a
statement question. Each revision's correct statement is executed on its tables and must
return exactly the rows written down here, so the stored key is known to be right.

A SQL question this script has no revision for stops the run (write one here first).
Attempt snapshots are refreshed so a learner who already opened the problem sees the new
statement and tables. One transaction.

    PYTHONPATH=. .venv/Scripts/python scripts/challenges/sql_statement_questions.py [--dry-run]
"""
import json
import sqlite3
import sys

from sqlalchemy import text

from app.db.session import SessionLocal

ROOM_REVENUE_TABLES = """CREATE TABLE room (
  room_no TEXT PRIMARY KEY,
  room_type TEXT NOT NULL,
  floor INTEGER NOT NULL,
  hourly_rate INTEGER NOT NULL
);
CREATE TABLE booking (
  booking_id INTEGER PRIMARY KEY,
  room_no TEXT NOT NULL,
  member_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  hours INTEGER NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE extra_charge (
  charge_id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  item TEXT NOT NULL,
  amount INTEGER NOT NULL
);

INSERT INTO room (room_no, room_type, floor, hourly_rate) VALUES
  ('R101', 'Small', 1, 40000),
  ('R102', 'Small', 1, 40000),
  ('R201', 'Medium', 2, 70000),
  ('R202', 'Medium', 2, 70000),
  ('R301', 'Boardroom', 3, 120000);

INSERT INTO booking (booking_id, room_no, member_id, start_date, hours, status) VALUES
  (1, 'R301', 11, '2026-10-02', 4, 'CONFIRMED'),
  (2, 'R301', 12, '2026-10-09', 3, 'CONFIRMED'),
  (3, 'R301', 13, '2026-10-20', 5, 'CANCELLED'),
  (4, 'R301', 11, '2026-10-27', 2, 'CONFIRMED'),
  (5, 'R201', 14, '2026-09-30', 3, 'CONFIRMED'),
  (6, 'R201', 15, '2026-10-05', 8, 'CONFIRMED'),
  (7, 'R201', 14, '2026-10-22', 6, 'CONFIRMED'),
  (8, 'R202', 16, '2026-10-01', 10, 'CONFIRMED'),
  (9, 'R202', 12, '2026-10-15', 5, 'CONFIRMED'),
  (10, 'R101', 17, '2026-10-06', 10, 'CONFIRMED'),
  (11, 'R101', 18, '2026-10-19', 15, 'CONFIRMED'),
  (12, 'R101', 17, '2026-11-01', 4, 'CONFIRMED'),
  (13, 'R102', 19, '2026-10-03', 12, 'CONFIRMED'),
  (14, 'R102', 13, '2026-10-14', 10, 'CONFIRMED'),
  (15, 'R102', 19, '2026-10-31', 8, 'CONFIRMED');

INSERT INTO extra_charge (charge_id, booking_id, item, amount) VALUES
  (1, 6, 'Catering', 50000),
  (2, 8, 'Projector', 30000),
  (3, 8, 'Catering', 45000),
  (4, 11, 'Whiteboard kit', 20000);
"""

ROOM_REVENUE_TEXT = """October meeting-room revenue

Language: SQL. Write ONE SQL statement (SQLite dialect) in the editor. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described below. Formatting, letter case and aliases inside the query do not matter.

A coworking company is replacing its spreadsheet of meeting-room bookings with a booking management system. The tables are shown with the problem:

- `room` -- every meeting room, its type, floor and hourly rate in KRW.
- `booking` -- each booking of a room: the date it starts (`start_date`, YYYY-MM-DD), how many hours it was booked for, and its `status` (CONFIRMED or CANCELLED).
- `extra_charge` -- additional items billed on a booking (catering, equipment).

The room charge of a booking is hours x the room's hourly rate. Cancelled bookings earn nothing.

Write a SQL statement to list the rooms whose total room charges for October 2026, based on the booking start date, came to more than 1,000,000 KRW. Exclude additional costs (extra charges).

Return one row per room with these columns, in this order: `room_no`, `room_type`, `total_revenue` (the total room charge). Order the rows by `total_revenue` from highest to lowest, and by `room_no` on a tie."""

ROOM_REVENUE_STATEMENT = """SELECT r.room_no,
       r.room_type,
       SUM(b.hours * r.hourly_rate) AS total_revenue
FROM booking b
JOIN room r ON r.room_no = b.room_no
WHERE b.status = 'CONFIRMED'
  AND b.start_date >= '2026-10-01'
  AND b.start_date < '2026-11-01'
GROUP BY r.room_no, r.room_type
HAVING SUM(b.hours * r.hourly_rate) > 1000000
ORDER BY total_revenue DESC, r.room_no;"""

ROOM_REVENUE_RESULT = [
    ("R102", "Small", 1200000),
    ("R301", "Boardroom", 1080000),
    ("R202", "Medium", 1050000),
]

ROOM_REVENUE_EXPLANATION = (
    "Join booking to room to price each booking (hours x hourly_rate), keep only CONFIRMED "
    "bookings whose start_date falls in October 2026 (>= '2026-10-01' and < '2026-11-01'), "
    "group by room, and filter the groups with HAVING SUM(...) > 1000000 -- a condition on a "
    "total belongs in HAVING, not WHERE. extra_charge is not joined at all: the question "
    "excludes additional costs, and joining it would also repeat a booking once per charge. "
    "R101 totals exactly 1,000,000 and is not 'more than'; R201 only passes if its September "
    "booking or its catering charge is wrongly counted.\n\n"
    "Common mistake: Putting the SUM condition in WHERE, forgetting to drop CANCELLED bookings, "
    "using BETWEEN '2026-10-01' AND '2026-11-01' (which takes in the 1 November booking), or "
    "joining extra_charge and so double-counting bookings with several charges."
)

# question_id -> (question text, tables, correct statement, rows it must return, explanation)
REVISIONS = {
    23632: (ROOM_REVENUE_TEXT, ROOM_REVENUE_TABLES, ROOM_REVENUE_STATEMENT,
            ROOM_REVENUE_RESULT, ROOM_REVENUE_EXPLANATION),
}


def run(tables: str, statement: str):
    db = sqlite3.connect(":memory:")
    try:
        db.executescript(tables)
        return db.execute(statement.rstrip().rstrip(";")).fetchall()
    finally:
        db.close()


def main():
    session = SessionLocal()
    try:
        rows = session.execute(text("""
            select q.question_id
            from questions q join programming_question_configs p on p.question_id = q.question_id
            where upper(p.language) = 'SQL' or p.starter_code ilike '%create table%'
            order by q.question_id""")).scalars().all()
        missing = [qid for qid in rows if qid not in REVISIONS]
        if missing:
            raise SystemExit(f"No revision written for SQL question(s) {missing}; add them to REVISIONS.")

        for qid in rows:
            stem, tables, statement, want, explanation = REVISIONS[qid]
            got = run(tables, statement)
            if got != want:
                raise SystemExit(f"#{qid}: correct statement returns {got!r}, expected {want!r}")
            print(f"#{qid}: correct statement returns {got!r}")

            session.execute(text("update questions set question_text = :t, explanation = :e "
                                 "where question_id = :q"), {"t": stem, "e": explanation, "q": qid})
            session.execute(text("update programming_question_configs set starter_code = :s, "
                                 "expected_output = :o, language = 'SQL' where question_id = :q"),
                            {"s": tables, "o": statement, "q": qid})
            snaps = session.execute(text("select attempt_question_id, question_data_snapshot from "
                                         "assessment_attempt_questions where source_question_id = :q"),
                                    {"q": qid}).all()
            for aqid, snapshot in snaps:
                data = json.loads(snapshot or "{}")
                data["starterCode"] = tables
                data["programmingLanguage"] = "SQL"
                if "questionText" in data:
                    data["questionText"] = stem
                session.execute(text("update assessment_attempt_questions set question_data_snapshot = :d, "
                                     "question_text_snapshot = :t where attempt_question_id = :a"),
                                {"d": json.dumps(data), "t": stem, "a": aqid})
            print(f"#{qid}: revised ({len(snaps)} attempt snapshot(s))")

        if "--dry-run" in sys.argv:
            session.rollback()
            print("dry run -- rolled back")
        else:
            session.commit()
            print("committed")
    finally:
        session.close()


if __name__ == "__main__":
    main()

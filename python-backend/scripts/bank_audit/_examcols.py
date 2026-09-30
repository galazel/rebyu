import sys
sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")
from dbsession import open_session
from sqlalchemy import text

db = open_session()
for t in ("exams", "exam_types"):
    print("==", t)
    rows = db.execute(text(
        "select column_name, data_type from information_schema.columns "
        "where table_name = :t order by ordinal_position"), {"t": t}).fetchall()
    for r in rows:
        print("   %-28s %s" % (r[0], r[1]))

print("== exam_types rows")
for r in db.execute(text("select * from exam_types order by 1")).fetchall():
    print("   ", r)

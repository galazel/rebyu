import sys
sys.path.insert(0, "/app"); sys.path.insert(0, "/app/scripts/fe_expansion")
from dbsession import open_session
from sqlalchemy import text
s = open_session()
for t in ("assessment_attempt_questions","exam_questions"):
    print(t, [c[0] for c in s.execute(text("select column_name from information_schema.columns where table_name=:t order by ordinal_position"),{"t":t})])
print("FKs referencing questions:")
for r in s.execute(text("""
 select tc.table_name, kcu.column_name
 from information_schema.table_constraints tc
 join information_schema.key_column_usage kcu on kcu.constraint_name=tc.constraint_name
 join information_schema.constraint_column_usage ccu on ccu.constraint_name=tc.constraint_name
 where tc.constraint_type='FOREIGN KEY' and ccu.table_name='questions'""")):
    print("  ", r[0], r[1])
s.close()

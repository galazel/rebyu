import sys
sys.path.insert(0, "/app"); sys.path.insert(0, "/app/scripts/fe_expansion")
from dbsession import open_session
from sqlalchemy import text
s = open_session()
for t in ("question_options","question_answers","choices","question_choices","answers"):
    cols = s.execute(text("select column_name,data_type from information_schema.columns where table_name=:t order by ordinal_position"),{"t":t}).fetchall()
    if cols:
        print(f"== {t} ==\n   " + ", ".join(f"{c[0]}:{c[1][:9]}" for c in cols))
print("\n== sample question 4478 ==")
for r in s.execute(text("select question_id,question_text,question_type,difficulty_level,lesson_id from questions where question_id=4478")):
    print(" ", r)
s.close()

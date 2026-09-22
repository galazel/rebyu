import sys
sys.path.insert(0, "/app"); sys.path.insert(0, "/app/scripts/fe_expansion")
from dbsession import open_session
from sqlalchemy import text
s = open_session()
for t in ("certifications", "questions", "lessons"):
    cols = s.execute(text("select column_name, data_type from information_schema.columns where table_name=:t order by ordinal_position"), {"t": t}).fetchall()
    print(f"== {t} ==")
    print("   " + ", ".join(f"{c[0]}" for c in cols))
s.close()

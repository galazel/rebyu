import sys
sys.path.insert(0, "/app"); sys.path.insert(0, "/app/scripts/fe_expansion")
from dbsession import open_session
from sqlalchemy import text
s = open_session()
for t in ("middle_categories","major_categories"):
    print(t, [c[0] for c in s.execute(text("select column_name from information_schema.columns where table_name=:t order by ordinal_position"),{"t":t})])
s.close()

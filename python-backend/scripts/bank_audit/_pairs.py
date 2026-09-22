import sys
sys.path.insert(0, "/app"); sys.path.insert(0, "/app/scripts/fe_expansion")
from dbsession import open_session
from sqlalchemy import text
s = open_session()
for qid in (398,408,529,549,4497,4501,345,418,396,4478):
    r = s.execute(text("select question_id, question_text from questions where question_id=:q"), {"q": qid}).fetchone()
    print(f"--- {r[0]} ---\n{r[1]}")
    for c in s.execute(text("select choice_text, is_correct from choices where question_id=:q order by choice_id"), {"q": qid}):
        print(("  * " if c[1] else "    ") + c[0][:95])
s.close()

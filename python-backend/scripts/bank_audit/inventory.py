"""Read-only inventory of every certification's question bank."""
import sys
sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")
from dbsession import open_session
from sqlalchemy import text

s = open_session()
rows = s.execute(text("""
    select c.certification_id, c.title,
           (select count(*) from lessons l
              join middle_categories mc on mc.middle_category_id=l.middle_category_id
              join major_categories m on m.major_category_id=mc.major_category_id
             where m.certification_id=c.certification_id) lessons,
           (select count(*) from questions q
              join lessons l on l.lesson_id=q.lesson_id
              join middle_categories mc on mc.middle_category_id=l.middle_category_id
              join major_categories m on m.major_category_id=mc.major_category_id
             where m.certification_id=c.certification_id) questions
    from certifications c order by c.certification_id""")).fetchall()
for r in rows:
    print(f"id={r[0]:<4} {r[1][:44]:<46} lessons={r[2]:<5} questions={r[3]}")
s.close()

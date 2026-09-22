import sys
sys.path.insert(0, "/app"); sys.path.insert(0, "/app/scripts/fe_expansion")
from dbsession import open_session
from sqlalchemy import text
s = open_session()
rows = s.execute(text("""
 select m.major_category_id, m.title, mc.middle_category_id, mc.title,
        l.lesson_id, l.name, (select count(*) from questions q where q.lesson_id=l.lesson_id)
 from major_categories m
 left join middle_categories mc on mc.major_category_id=m.major_category_id
 left join lessons l on l.middle_category_id=mc.middle_category_id
 where m.certification_id=4
 order by m.major_category_id, mc.middle_category_id, l.lesson_id""")).fetchall()
cur_m = cur_mc = None
for r in rows:
    if r[0] != cur_m: print(f"MAJOR {r[0]}: {r[1]}"); cur_m = r[0]; cur_mc = None
    if r[2] != cur_mc: print(f"   MIDDLE {r[2]}: {r[3]}"); cur_mc = r[2]
    if r[4]: print(f"      L{r[4]:<4} q={r[6]:<4} {r[5]}")
s.close()

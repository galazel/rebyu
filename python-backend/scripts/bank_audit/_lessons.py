import sys, json
sys.path.insert(0, "/app"); sys.path.insert(0, "/app/scripts/fe_expansion")
from dbsession import open_session
from sqlalchemy import text
s = open_session()
print("total_points on questions?",
      s.execute(text("select count(*) from information_schema.columns where table_name='questions' and column_name='total_points'")).scalar())
out = {}
for cert in (4, 13, 14):
    rows = s.execute(text("""
        select l.lesson_id, l.name, mc.title, m.title,
               (select count(*) from questions q where q.lesson_id=l.lesson_id)
        from lessons l
        join middle_categories mc on mc.middle_category_id=l.middle_category_id
        join major_categories m on m.major_category_id=mc.major_category_id
        where m.certification_id=:c order by m.major_category_id, mc.middle_category_id, l.lesson_id"""), {"c": cert}).fetchall()
    out[cert] = [{"id": r[0], "lesson": r[1], "middle": r[2], "major": r[3], "q": r[4]} for r in rows]
with open("/app/scripts/bank_audit/lessons.json", "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
print({k: len(v) for k, v in out.items()})
s.close()

import sys
sys.path.insert(0,"/app"); sys.path.insert(0,"/app/scripts/fe_expansion")
from sqlalchemy import text
from dbsession import open_session
db=open_session()

print("past-paper imported questions (stem carries a Source citation):")
rows=db.execute(text("""
  select c.certification_id, c.title,
         count(*) filter (where q.question_text like '%Source: (%') as imported,
         count(*) as total
    from questions q
    join lessons l on l.lesson_id=q.lesson_id
    join middle_categories m on m.middle_category_id=l.middle_category_id
    join major_categories j on j.major_category_id=m.major_category_id
    join certifications c on c.certification_id=j.certification_id
   where q.parent_question_id is null
   group by c.certification_id, c.title
   order by 3 desc""")).fetchall()
for cid,title,imported,total in rows:
    print("   cert %-3s %-28s imported=%-6s of total=%s" % (cid, (title or "")[:28], imported, total))

print()
print("by citation kind:")
for kind, pat in (("IT Passport (IP)", "%, IP, %"), ("FE Subject-A", "%, FE, Subject-A,%"), ("FE Subject-B", "%, FE, Subject-B,%"), ("FE other", "%, FE, Q%")):
    n=db.execute(text("select count(*) from questions where parent_question_id is null and question_text like :p"), {"p": pat}).scalar()
    print("   %-18s %s" % (kind, n))
db.close()


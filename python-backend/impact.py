import sys
sys.path.insert(0,"/app"); sys.path.insert(0,"/app/scripts/fe_expansion")
from sqlalchemy import text
from dbsession import open_session
db=open_session()
for cid, label in ((4,"IT Passport"), (14,"FE Exam")):
    rows=db.execute(text("""
      select l.lesson_id,
             count(q.question_id) as now_,
             count(q.question_id) filter (where q.question_text not like '%Source: (%') as after_
        from lessons l
        join middle_categories m on m.middle_category_id=l.middle_category_id
        join major_categories j on j.major_category_id=m.major_category_id
        left join questions q on q.lesson_id=l.lesson_id and q.parent_question_id is null
       where j.certification_id=:cid
       group by l.lesson_id"""), {"cid": cid}).fetchall()
    total=len(rows)
    empty_now=sum(1 for r in rows if r[1]==0)
    empty_after=sum(1 for r in rows if r[2]==0)
    thin_after=sum(1 for r in rows if 0 < r[2] < 5)
    print("%s: %d lessons" % (label, total))
    print("   lessons with NO questions   now: %-4d  after removal: %d" % (empty_now, empty_after))
    print("   lessons with 1-4 questions  after removal: %d" % thin_after)
    print("   lessons with 5+ questions   after removal: %d" % sum(1 for r in rows if r[2]>=5))
    print()
db.close()


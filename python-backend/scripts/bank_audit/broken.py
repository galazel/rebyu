"""Structurally broken questions: wrong choice count, no correct answer, or several."""
import sys
sys.path.insert(0, "/app"); sys.path.insert(0, "/app/scripts/fe_expansion")
from dbsession import open_session
from sqlalchemy import text
s = open_session()
for cert in (4, 13, 14):
    title = s.execute(text("select title from certifications where certification_id=:c"), {"c": cert}).scalar()
    rows = s.execute(text("""
        select q.question_id, q.question_type, l.lesson_id, l.name,
               count(c.choice_id) total,
               coalesce(sum(case when c.is_correct then 1 else 0 end), 0) correct
          from questions q
          join lessons l on l.lesson_id = q.lesson_id
          join middle_categories mc on mc.middle_category_id = l.middle_category_id
          join major_categories m on m.major_category_id = mc.major_category_id
          left join choices c on c.question_id = q.question_id
         where m.certification_id = :c
         group by q.question_id, q.question_type, l.lesson_id, l.name"""), {"c": cert}).fetchall()
    no_choice = [r for r in rows if r[1] == 'MCQ' and r[4] == 0]
    bad_count = [r for r in rows if r[1] == 'MCQ' and 0 < r[4] != 4]
    no_correct = [r for r in rows if r[1] == 'MCQ' and r[4] > 0 and r[5] == 0]
    many = [r for r in rows if r[1] == 'MCQ' and r[5] > 1]
    print(f"\n=== [{cert}] {title} ({len(rows)} questions) ===")
    print(f"  MCQ with NO choices at all : {len(no_choice)}  {[r[0] for r in no_choice][:20]}")
    print(f"  MCQ with != 4 choices      : {len(bad_count)}  {[(r[0], r[4]) for r in bad_count][:20]}")
    print(f"  MCQ with NO correct choice : {len(no_correct)}  {[r[0] for r in no_correct][:20]}")
    print(f"  MCQ with >1 correct choice : {len(many)}  {[(r[0], r[5]) for r in many][:20]}")
    types = s.execute(text("""
        select q.question_type, count(*) from questions q
          join lessons l on l.lesson_id=q.lesson_id
          join middle_categories mc on mc.middle_category_id=l.middle_category_id
          join major_categories m on m.major_category_id=mc.major_category_id
         where m.certification_id=:c group by q.question_type"""), {"c": cert}).fetchall()
    print(f"  types: {dict(types)}")
s.close()

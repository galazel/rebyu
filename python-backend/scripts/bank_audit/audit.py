"""Per-certification bank audit: lesson coverage, exact and near duplicates.

Read-only. Nothing here writes.
"""
import re
import sys
from collections import defaultdict

sys.path.insert(0, "/app"); sys.path.insert(0, "/app/scripts/fe_expansion")
from dbsession import open_session
from sqlalchemy import text

CERTS = [4, 13, 14, 20]

STOP = {
    "a","an","and","are","as","at","be","been","by","can","for","from","has",
    "have","in","into","is","it","its","of","on","or","that","the","their",
    "them","then","there","these","they","this","to","was","were","what",
    "when","which","while","who","why","will","with","would","you","your",
    "following","best","most","correct","describes","statement","true","about",
}

def norm(text_):
    words = re.findall(r"[a-z0-9]+", (text_ or "").lower())
    return frozenset(w for w in words if w not in STOP)

s = open_session()
for cert in CERTS:
    title = s.execute(text("select title from certifications where certification_id=:c"), {"c": cert}).scalar()
    rows = s.execute(text("""
        select q.question_id, q.question_text, q.question_type, l.lesson_id, l.name
        from questions q
        join lessons l on l.lesson_id = q.lesson_id
        join middle_categories mc on mc.middle_category_id = l.middle_category_id
        join major_categories m on m.major_category_id = mc.major_category_id
        where m.certification_id = :c
        order by l.lesson_id, q.question_id"""), {"c": cert}).fetchall()

    per_lesson = defaultdict(list)
    for r in rows:
        per_lesson[(r[3], r[4])].append(r)

    all_lessons = s.execute(text("""
        select l.lesson_id, l.name from lessons l
        join middle_categories mc on mc.middle_category_id = l.middle_category_id
        join major_categories m on m.major_category_id = mc.major_category_id
        where m.certification_id = :c order by l.lesson_id"""), {"c": cert}).fetchall()

    # exact duplicate stems
    by_text = defaultdict(list)
    for r in rows:
        by_text[re.sub(r"\s+", " ", (r[1] or "").strip().lower())].append(r[0])
    exact = {k: v for k, v in by_text.items() if len(v) > 1}
    exact_extra = sum(len(v) - 1 for v in exact.values())

    # near duplicates (jaccard >= .75) within the certification
    sigs = [(r[0], norm(r[1])) for r in rows]
    near = 0
    seen = set()
    for i in range(len(sigs)):
        qid_i, a = sigs[i]
        if not a or qid_i in seen:
            continue
        for j in range(i + 1, len(sigs)):
            qid_j, b = sigs[j]
            if not b or qid_j in seen:
                continue
            inter = len(a & b)
            if inter and inter / len(a | b) >= 0.75:
                near += 1
                seen.add(qid_j)

    empty = [l for l in all_lessons if (l[0], l[1]) not in per_lesson]
    thin = sorted(((len(v), k[1]) for k, v in per_lesson.items()))[:5]

    print(f"\n=== [{cert}] {title} ===")
    print(f"  lessons={len(all_lessons)}  questions={len(rows)}")
    print(f"  lessons with NO questions: {len(empty)}")
    for l in empty[:12]:
        print(f"      - {l[1][:60]}")
    if len(empty) > 12:
        print(f"      ... and {len(empty)-12} more")
    print(f"  thinnest lessons: " + ", ".join(f"{n}x {name[:30]}" for n, name in thin))
    print(f"  exact duplicate stems: {len(exact)} groups / {exact_extra} removable rows")
    print(f"  near duplicates (>=0.75 overlap): {near} removable rows")
s.close()

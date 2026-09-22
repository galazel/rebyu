"""The IT Passport duplicate groups, in full. Read-only."""
import re, sys
from collections import defaultdict
sys.path.insert(0, "/app"); sys.path.insert(0, "/app/scripts/fe_expansion")
from dbsession import open_session
from sqlalchemy import text

STOP = {"a","an","and","are","as","at","be","been","by","can","for","from","has","have","in","into","is","it","its","of","on","or","that","the","their","them","then","there","these","they","this","to","was","were","what","when","which","while","who","why","will","with","would","you","your","following","best","most","correct","describes","statement","true","about"}
def norm(t):
    return frozenset(w for w in re.findall(r"[a-z0-9]+", (t or "").lower()) if w not in STOP)

s = open_session()
rows = s.execute(text("""
    select q.question_id, q.question_text, l.name
    from questions q join lessons l on l.lesson_id=q.lesson_id
    join middle_categories mc on mc.middle_category_id=l.middle_category_id
    join major_categories m on m.major_category_id=mc.major_category_id
    where m.certification_id=4 order by q.question_id"""), ).fetchall()

by_text = defaultdict(list)
for r in rows:
    by_text[re.sub(r"\s+"," ",(r[1] or "").strip().lower())].append(r)
print("== EXACT ==")
for k, v in by_text.items():
    if len(v) > 1:
        print(f"  [{', '.join(str(x[0]) for x in v)}] {v[0][1][:100]}")

print("\n== NEAR (>=0.75) ==")
sigs = [(r[0], norm(r[1]), r) for r in rows]
seen = set()
for i in range(len(sigs)):
    qa, a, ra = sigs[i]
    if not a or qa in seen: continue
    for j in range(i+1, len(sigs)):
        qb, b, rb = sigs[j]
        if not b or qb in seen: continue
        inter = len(a & b)
        if inter and inter/len(a|b) >= 0.75:
            seen.add(qb)
            print(f"  {qa} vs {qb}  ({inter/len(a|b):.2f})")
            print(f"     A: {ra[1][:95]}")
            print(f"     B: {rb[1][:95]}")
s.close()

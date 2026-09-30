"""How many parsed IP past-paper questions exist, and how many reached the DB.

Read-only.
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")
from dbsession import open_session
from sqlalchemy import text

PARSED = "/app/scripts/fe_papers/parsed"

total = 0
per_paper = []
for path in sorted(glob.glob(os.path.join(PARSED, "*_IP.json"))):
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    items = data.get("questions", data) if isinstance(data, dict) else data
    n = len(items) if isinstance(items, list) else 0
    total += n
    per_paper.append((os.path.basename(path), n))

print("parsed IP papers: %d   questions: %d" % (len(per_paper), total))
for name, n in per_paper:
    print("   %-18s %3d" % (name, n))

db = open_session()
rows = db.execute(text("""
    select q.question_text
      from questions q
      join lessons l on l.lesson_id = q.lesson_id
      join middle_categories mc on mc.middle_category_id = l.middle_category_id
      join major_categories m on m.major_category_id = mc.major_category_id
     where m.certification_id = 4 and q.parent_question_id is null""")).fetchall()

# The licence citation is appended to question_text as "(YearSeason, ...)",
# so a past-paper question is identifiable without a source column.
cited = [r[0] for r in rows if r[0] and re.search(r"\((19|20)\d{2}[AS]\s*,", r[0])]
seasons = {}
for t in cited:
    m = re.search(r"\((19|20)\d{2}[AS]", t)
    key = m.group(0)[1:] if m else "?"
    seasons[key] = seasons.get(key, 0) + 1

print("\ncert 4 top-level questions in DB: %d" % len(rows))
print("  carrying a past-paper citation:  %d" % len(cited))
print("  hand-written / other:            %d" % (len(rows) - len(cited)))
print("\nimported per paper season:")
for k in sorted(seasons):
    print("   %-8s %3d" % (k, seasons[k]))

"""Balances every certification's mock exam to the real paper's official split.

A mock is only worth sitting if it has the real paper's length AND its weighting:
the old builders filled a paper round-robin over lessons in unit order, so the
units listed last (FE's whole Strategy field) never made it in, and TOPCIT leaned
on Network and Security.

Official splits (the parts of one paper, in sitting order):

  IT Passport  100 -- IPA: Strategy ~35, Management ~20, Technology ~45
  FE            80 -- IPA: Subject A 60 (Technology 41, Management 7,
                       Strategy 12), Subject B 20 (Algorithms and
                       programming 16, Information security 4)
  TOPCIT        75 -- topcit.or.kr: M1 21, M2 19, M3 18, M4 17

Each part is a set of units (major categories), optionally narrowed to some
middle categories. Inside a part an item already in the mock is kept where it
can be; extras are dropped from the lesson with the most items and gaps are
filled from the lesson with the fewest, so coverage spreads across lessons and
re-running changes nothing. Only MCQ is ever dropped or added -- written and
performance items stay. The paper is re-ordered part by part, and each
certification's exam format records the split as `domains`, which is what the
certification workflow reads when it generates a mock.

Dry run by default; --apply writes.
"""

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fe_expansion"))

from sqlalchemy import text

from dbsession import open_session

STRATEGY = ["Corporate and Legal Affairs", "Business Strategy", "System Strategy"]
MANAGEMENT = ["Development Technology", "Project Management", "Service Management"]
TECHNOLOGY = ["Basic Theory", "Computer System", "Technology Element"]
SUBJECT_B = ["Algorithm and Programming", "Security"]

IPA = "https://www.ipa.go.jp/shiken/ (IT Passport / FE question distribution)"

PAPERS = [
    {
        "certification": "IT Passport Exam", "mock": "Mock Exam", "source": IPA,
        "parts": [
            ("Strategy", 35, STRATEGY, None),
            ("Management", 20, MANAGEMENT, None),
            ("Technology", 45, TECHNOLOGY, None),
        ],
    },
    {
        "certification": "FE Exam", "mock": "FE Exam Mock Paper", "source": IPA,
        "parts": [
            ("Subject A: Technology", 41, TECHNOLOGY, None),
            ("Subject A: Management", 7, MANAGEMENT, None),
            ("Subject A: Strategy", 12, STRATEGY, None),
            ("Subject B: Algorithms and programming", 16, ["Basic Theory"], ["Algorithm and Programming"]),
            ("Subject B: Information security", 4, ["Technology Element"], ["Security"]),
        ],
    },
    {
        "certification": "TOPCIT", "mock": "TOPCIT Mock Exam",
        "source": "https://www.topcit.or.kr (Introduction > Overview > Test Structure)",
        "parts": [
            ("M1 Software Development", 21, ["Software Development"], None),
            ("M2 Data Management", 19, ["Database Construction and Management"], None),
            ("M3 System Architecture and Information Security", 18,
             ["Understanding of Network", "Understanding of Security"], None),
            ("M4 IT Business", 17,
             ["Understanding of IT Business", "Technical Communications", "Project Management"], None),
        ],
    },
]


def _norm(value):
    return (value or "").strip().lower()


def _in_part(part, major, middle):
    _name, _items, majors, middles = part
    if _norm(major) not in {_norm(m) for m in majors}:
        return False
    return middles is None or _norm(middle) in {_norm(m) for m in middles}


def balance(db, paper, apply_changes):
    found = db.execute(text("""
        select e.exam_id, c.certification_id from public.exams e
          join public.certifications c on c.certification_id = e.certification_id
         where c.title = :c and e.title = :t and e.owner_department_id is null"""),
        {"c": paper["certification"], "t": paper["mock"]}).fetchone()
    if not found:
        print("%s: %r not found, skipped" % (paper["certification"], paper["mock"]))
        return
    exam_id, certification_id = found
    parts = paper["parts"]
    total = sum(p[1] for p in parts)

    rows = db.execute(text("""
        select q.question_id, q.lesson_id, q.question_type, q.parent_question_id,
               mj.title, mi.title, eq.exam_question_id, eq.points
          from public.questions q
          join public.lessons l on l.lesson_id = q.lesson_id
          join public.middle_categories mi on mi.middle_category_id = l.middle_category_id
          join public.major_categories mj on mj.major_category_id = mi.major_category_id
          left join public.exam_questions eq on eq.question_id = q.question_id and eq.exam_id = :e
         where mj.certification_id = :c and mj.owner_department_id is null
           and q.owner_department_id is null
         order by q.question_id"""),
        {"e": exam_id, "c": certification_id}).fetchall()

    mcq_points = [r[7] for r in rows if r[6] is not None and r[2] == "MCQ" and r[7] is not None]
    points = max(set(mcq_points), key=mcq_points.count) if mcq_points else 1

    # A mock item belongs to the first part that claims it; Subject B parts are
    # narrower than Subject A, so claim the narrow parts first.
    claim_order = sorted(range(len(parts)), key=lambda i: parts[i][3] is None)
    in_mock = {i: [] for i in range(len(parts))}
    unplaced = []
    for question_id, lesson_id, qtype, parent, major, middle, eq_id, _pts in rows:
        if eq_id is None:
            continue
        home = next((i for i in claim_order if _in_part(parts[i], major, middle)), None)
        (unplaced if home is None else in_mock[home]).append((eq_id, question_id, lesson_id, qtype))

    used = {r[0] for r in rows if r[6] is not None}
    removals, additions = [e for e, *_ in unplaced], {i: [] for i in range(len(parts))}
    report = []
    for i in claim_order:
        name, target, _majors, _middles = parts[i]
        items = in_mock[i]
        before = len(items)
        per_lesson = {}
        for item in items:
            per_lesson[item[2]] = per_lesson.get(item[2], 0) + 1
        while len(items) > target:
            mcq = [it for it in items if it[3] == "MCQ"]
            if not mcq:
                break
            victim = max(mcq, key=lambda it: (per_lesson[it[2]], it[0]))
            items.remove(victim)
            per_lesson[victim[2]] -= 1
            removals.append(victim[0])
        pool = [(r[0], r[1]) for r in rows
                if r[6] is None and r[2] == "MCQ" and r[3] is None and r[0] not in used
                and _in_part(parts[i], r[4], r[5])
                and not any(_in_part(parts[j], r[4], r[5]) for j in claim_order[:claim_order.index(i)])]
        while len(items) < target and pool:
            pick = min(pool, key=lambda p: (per_lesson.get(p[1], 0), p[0]))
            pool.remove(pick)
            used.add(pick[0])
            per_lesson[pick[1]] = per_lesson.get(pick[1], 0) + 1
            items.append((None, pick[0], pick[1], "MCQ"))
            additions[i].append(pick[0])
        report.append((i, name, before, len(items), target))

    after = sum(len(v) for v in in_mock.values())
    print("%s -- %s" % (paper["certification"], paper["mock"]))
    for _i, name, before, now, target in sorted(report):
        print("  %-46s %3d -> %3d (target %d)" % (name, before, now, target))
    if unplaced:
        print("  %d item(s) outside every part, removed" % len(unplaced))
    print("  %d removed, %d added -> %d item(s) (real paper %d)"
          % (len(removals), sum(len(a) for a in additions.values()), after, total))
    if after != total:
        print("  NOT applied: could not reach the real paper's size")
        return
    if not apply_changes:
        return

    for exam_question_id in removals:
        db.execute(text("delete from public.exam_questions where exam_question_id = :i"),
                   {"i": exam_question_id})
    for i, question_ids in additions.items():
        for question_id in question_ids:
            new_id = db.execute(text("""
                insert into public.exam_questions (exam_id, question_id, display_order, points)
                values (:e, :q, 0, :p) returning exam_question_id"""),
                {"e": exam_id, "q": question_id, "p": points}).scalar()
            in_mock[i] = [(new_id, q, l, t) if (e is None and q == question_id) else (e, q, l, t)
                          for e, q, l, t in in_mock[i]]

    current = {eq: order for eq, order in db.execute(text(
        "select exam_question_id, display_order from public.exam_questions where exam_id = :e"),
        {"e": exam_id})}
    order = 1
    for i in range(len(parts)):
        for eq_id, *_rest in sorted(in_mock[i], key=lambda it: (current.get(it[0], 10**6), it[0])):
            db.execute(text("update public.exam_questions set display_order = :o where exam_question_id = :i"),
                       {"o": order, "i": eq_id})
            order += 1
    db.execute(text("update public.exams set total_questions = :n, updated_at = now() where exam_id = :e"),
               {"n": total, "e": exam_id})

    domains = [{"name": name, "weight_percent": round(100.0 * items / total, 1), "total_items": items,
                "major_categories": majors}
               for name, items, majors, _middles in parts]
    coverage = ", ".join("%s (%d items)" % (d["name"], d["total_items"]) for d in domains)
    db.execute(text("""
        update public.certification_exam_formats
           set total_items = :n, coverage = :cov, source = :src, origin = 'MANUAL', updated_at = now()
         where certification_id = :c"""),
        {"n": total, "cov": coverage, "src": paper["source"], "c": certification_id})
    structure = db.execute(text("select exam_structure from public.certifications where certification_id = :c"),
                           {"c": certification_id}).scalar() or {}
    if isinstance(structure, str):
        structure = json.loads(structure)
    structure.update({"total_items": total, "coverage": coverage, "domains": domains,
                      "source": paper["source"], "origin": "MANUAL"})
    db.execute(text("update public.certifications set exam_structure = cast(:s as jsonb) where certification_id = :c"),
               {"s": json.dumps(structure), "c": certification_id})
    print("  applied")


def main():
    apply_changes = "--apply" in sys.argv
    db = open_session()
    for paper in PAPERS:
        balance(db, paper, apply_changes)
    if apply_changes:
        db.commit()
    else:
        print("\ndry run -- re-run with --apply")
    db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

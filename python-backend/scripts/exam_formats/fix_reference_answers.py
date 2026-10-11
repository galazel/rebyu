"""Corrects model answers that contradict their own question.

Q2193 ("Meridian University Library" Catalogue): requirement (c) says "A title exists
in the catalogue whether or not any branch holds it", so a title has ZERO or more
copies. The reference drew Title -> Copy as 1..*, marking every learner who read the
question correctly as wrong on that relationship.

Each fix replaces one exact piece of the reference XML, so it is a no-op once applied.
Dry run by default; --apply writes.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fe_expansion"))

from sqlalchemy import text

from dbsession import open_session

FIXES = [
    (2193, 'value="is realised as 1..*"', 'value="is realised as 0..*"'),
]


def main():
    apply_changes = "--apply" in sys.argv
    db = open_session()
    for question_id, old, new in FIXES:
        xml = db.execute(text("select reference_diagram_xml from public.diagram_question_configs where question_id = :q"),
                         {"q": question_id}).scalar() or ""
        if new in xml and old not in xml:
            print("Q%d: already fixed" % question_id)
            continue
        if xml.count(old) != 1:
            print("Q%d: expected exactly one %r, found %d -- skipped" % (question_id, old, xml.count(old)))
            continue
        print("Q%d: %s -> %s" % (question_id, old, new))
        if apply_changes:
            db.execute(text("update public.diagram_question_configs set reference_diagram_xml = :x where question_id = :q"),
                       {"x": xml.replace(old, new), "q": question_id})
    if apply_changes:
        db.commit()
        print("applied")
    else:
        print("dry run -- re-run with --apply")
    db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

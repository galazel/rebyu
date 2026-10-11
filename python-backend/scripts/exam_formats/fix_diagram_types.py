"""Corrects diagram questions filed under the wrong diagram type.

The type decides two things: which shape library the learner's editor opens with,
and which notation rules grade the answer. Q2470 ("Halden Campus - Network Service
Quality Records") asks for entities, primary and foreign keys and cardinalities, and
its reference is captioned "Entity-relationship diagram (model answer)" -- but it was
stored as UML_COMPONENT, so an ERD answer was graded as a component diagram.

Dry run by default; --apply writes.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fe_expansion"))

from sqlalchemy import text

from dbsession import open_session

CORRECTIONS = {2470: ("UML_COMPONENT", "ERD")}


def main():
    apply_changes = "--apply" in sys.argv
    db = open_session()
    for question_id, (wrong, right) in CORRECTIONS.items():
        current = db.execute(text("select diagram_type from public.diagram_question_configs where question_id = :q"),
                             {"q": question_id}).scalar()
        print("Q%d: %s -> %s" % (question_id, current, right))
        if current != wrong:
            print("  skipped: expected %s" % wrong)
            continue
        if apply_changes:
            db.execute(text("update public.diagram_question_configs set diagram_type = :t where question_id = :q"),
                       {"t": right, "q": question_id})
    if apply_changes:
        db.commit()
        print("applied")
    else:
        print("dry run -- re-run with --apply")
    db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

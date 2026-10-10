"""Records the real exam format of the hand-built certifications.

`certification_exam_formats` and `certification_exam_sections` are filled by
the generation run, but IT Passport, FE and TOPCIT were built by hand, so their
formats are written here, checked against the sources named below (2026-10-10).

Only the numbers are set -- item counts, time, pass mark, sections, source.
The question types, coverage and notes already on `certifications.exam_structure`
are kept: they drive what generation writes for that certification.

Usage:
    python scripts/exam_formats/backfill.py            # write
    python scripts/exam_formats/backfill.py --report   # show, write nothing
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(HERE, "..", "fe_expansion"))

from sqlalchemy import text

from app.repositories import java_backend as repo
from dbsession import open_session

FORMATS = {
    "IT Passport Exam": {
        "total_items": 100,
        "duration_minutes": 120,
        "passing_score": 60,
        "sections": [
            {"name": "Strategy", "total_items": 35, "question_types": ["MCQ"]},
            {"name": "Management", "total_items": 20, "question_types": ["MCQ"]},
            {"name": "Technology", "total_items": 45, "question_types": ["MCQ"]},
        ],
        "source": "https://atsoho.com/certifications/it-passport",
    },
    "FE Exam": {
        "total_items": 80,
        "duration_minutes": 190,
        "passing_score": 60,
        "sections": [
            {"name": "Subject A", "total_items": 60, "duration_minutes": 90,
             "question_types": ["MCQ"]},
            {"name": "Subject B", "total_items": 20, "duration_minutes": 100,
             "question_types": ["MCQ"]},
        ],
        "source": "https://www.itpec.org/about/Outline_of_ITPEC_Common_Examination-fromApril2024.pdf",
    },
    "TOPCIT": {
        "total_items": 65,
        "duration_minutes": 150,
        "passing_score": 0,
        "source": "https://en.wikipedia.org/wiki/TOPCIT",
    },
}


def main():
    report_only = "--report" in sys.argv
    db = open_session()
    for title, known in FORMATS.items():
        row = db.execute(text(
            "select certification_id, exam_structure from public.certifications where title = :t"),
            {"t": title}).fetchone()
        if not row:
            print("  ! %s not found" % title)
            continue
        certification_id, stored = row
        structure = {**(stored or {}), **known, "origin": "MANUAL"}
        print("  %-18s %3d items  %3d min  pass %s  %d section(s)"
              % (title, structure["total_items"], structure["duration_minutes"],
                 structure.get("passing_score") or "-", len(structure.get("sections") or [])))
        if not report_only:
            repo.update_certification_exam_structure(db, certification_id, structure)

    if report_only:
        print("report only -- nothing written")
    else:
        db.commit()
        print("written")
    db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

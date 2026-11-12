"""Re-lays out use case model answers so they obey UML: use cases inside the system boundary,
actors outside it.

Two references (#23578 hospital appointments, #23638 Blueprint EHR) were drawn on a plain
grid: the "system" box sat among the shapes, holding actors and leaving use cases outside.
The grader now checks the boundary (every use case inside, every actor outside), so these
model answers failed their own question -- and learners are shown them after submitting.

Only positions change: the boundary is resized around a two-column grid of the use cases,
actors stand in columns to its left and right, notes go underneath. Every shape, label and
connector (attached by id) is kept. Any reference whose use cases already sit inside its
boundary is left alone.

    PYTHONPATH=. .venv/Scripts/python scripts/exam_formats/fix_use_case_boundaries.py [--dry-run] [--out DIR]
"""
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

from sqlalchemy import text

from app.db.session import SessionLocal


def label(cell):
    return re.sub(r"<[^>]+>", "", cell.get("value") or "").strip()


def style(cell):
    return cell.get("style") or ""


def is_vertex(cell):
    return cell.get("vertex") == "1"


def kind(cell):
    s = style(cell)
    if "umlActor" in s:
        return "actor"
    if s.startswith("ellipse") or ";ellipse" in s:
        return "usecase"
    if s.startswith("text") or "shape=note" in s:
        return "note"
    return "box"


def geo(cell):
    return cell.find("mxGeometry")


def centre_inside(outer, inner):
    o, i = geo(outer), geo(inner)
    ox, oy, ow, oh = (float(o.get(k, 0)) for k in ("x", "y", "width", "height"))
    cx = float(i.get("x", 0)) + float(i.get("width", 0)) / 2
    cy = float(i.get("y", 0)) + float(i.get("height", 0)) / 2
    return ox <= cx <= ox + ow and oy <= cy <= oy + oh


def relayout(xml: str):
    root = ET.fromstring(xml)
    cells = [c for c in root.iter("mxCell") if is_vertex(c) and geo(c) is not None]
    usecases = [c for c in cells if kind(c) == "usecase"]
    actors = [c for c in cells if kind(c) == "actor"]
    boxes = [c for c in cells if kind(c) == "box" and label(c)]
    if not usecases or not boxes:
        return None, "no boundary or no use cases"
    boundary = boxes[0]
    if all(centre_inside(boundary, u) for u in usecases) and not any(centre_inside(boundary, a) for a in actors):
        return None, "already correct"

    # Title/subtitle text stays where it is (top); notes go under the boundary.
    top = 90.0
    uw, uh, gap_x, gap_y = 210.0, 60.0, 30.0, 34.0
    left = 230.0
    rows = (len(usecases) + 1) // 2
    bx, by = left, top
    bw = 2 * uw + 3 * gap_x
    bh = rows * (uh + gap_y) + 60.0
    g = geo(boundary)
    g.set("x", str(bx)); g.set("y", str(by)); g.set("width", str(bw)); g.set("height", str(bh))
    s = style(boundary)
    if "verticalAlign" not in s:
        boundary.set("style", s.rstrip(";") + ";verticalAlign=top;")

    for i, u in enumerate(usecases):
        g = geo(u)
        g.set("x", str(bx + gap_x + (i % 2) * (uw + gap_x)))
        g.set("y", str(by + 45 + (i // 2) * (uh + gap_y)))
        g.set("width", str(uw)); g.set("height", str(uh))

    # Actors alternate: left column, right column.
    for i, a in enumerate(actors):
        g = geo(a)
        side_x = 60.0 if i % 2 == 0 else bx + bw + 90.0
        g.set("x", str(side_x)); g.set("y", str(top + 30 + (i // 2) * 150))

    notes_y = by + bh + 40
    for n in [c for c in cells if kind(c) == "note" and float(geo(c).get("y", 0)) > 80]:
        geo(n).set("y", str(notes_y)); geo(n).set("x", "40")
        notes_y += float(geo(n).get("height", 40)) + 20

    out = ET.tostring(root, encoding="unicode")
    check = ET.fromstring(out)
    cells2 = {c.get("id"): c for c in check.iter("mxCell")}
    b2 = cells2[boundary.get("id")]
    assert all(centre_inside(b2, cells2[u.get("id")]) for u in usecases)
    assert not any(centre_inside(b2, cells2[a.get("id")]) for a in actors)
    return out, "re-laid out"


def main():
    dry = "--dry-run" in sys.argv
    out_dir = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None
    session = SessionLocal()
    try:
        rows = session.execute(text(
            "select question_id, reference_diagram_xml from diagram_question_configs "
            "where diagram_type = 'USE_CASE' and reference_diagram_xml is not null order by 1")).all()
        for qid, xml in rows:
            fixed, note = relayout(xml)
            print(f"#{qid}: {note}")
            if fixed is None:
                continue
            if out_dir:
                (out_dir / f"{qid}.xml").write_text(fixed, encoding="utf-8")
            session.execute(text("update diagram_question_configs set reference_diagram_xml = :x "
                                 "where question_id = :q"), {"x": fixed, "q": qid})
        if dry:
            session.rollback()
            print("dry run -- rolled back")
        else:
            session.commit()
            print("committed")
    finally:
        session.close()


if __name__ == "__main__":
    main()

"""Re-crops already-parsed past-paper figures so none cuts through a text line.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/resnap_figures.py 2010A_IP [...] [--commit]

Why this rather than re-parsing: the crop fix lives in `figure_rects`, which
runs at PARSE time. Re-parsing would rewrite every stem in the parsed JSON,
and those stems are what the imported questions were built from -- a stem that
comes back one character different is a question that no longer matches the
row in the database. The figures are the only thing wrong, so the figures are
the only thing touched.

What it does, per paper: takes each figure rect the parse already stored,
re-applies `_whole_lines_only` against that page's real text lines, and
re-renders any rect that moved. The S3 key is unchanged -- same paper, same
question number -- so the database needs no update at all: the questions keep
pointing where they pointed, and the bytes behind the key get better.

`_whole_lines_only` resolves every text line the crop merely overlaps: mostly
inside, taken in whole; mostly outside, the edge retreats to clear it. So the
band of half-glyphs along a crop edge -- the top halves of the row above, the
bottoms of the row below -- cannot survive it.

Without --commit nothing is uploaded and nothing is written: the plan is
printed and the re-rendered PNGs are left in the render directory to look at.
"""

import argparse
import json
import os
import sys

sys.path.insert(0, "/app")

import pymupdf

from app.papers.figures import _pixmap, _s3, _stack, split_figures
from app.papers.subject_a import PDF_DIR, _whole_lines_only, page_lines

PARSED_DIR = os.environ.get("PAPERS_PARSED_DIR", "/app/scripts/fe_papers/parsed/")
RENDER_DIR = os.environ.get("PAPERS_RENDER_DIR", "/app/scripts/fe_papers/rendered/")

#: A rect that moves less than this is the same crop; re-uploading it would
#: spend a request to change nothing anyone can see.
MOVED_EPSILON = 0.5


def snap(doc, lines_by_page, figure):
    """The figure's rect with no text line bisected, and whether it moved."""
    page = figure["page"]
    if page not in lines_by_page:
        lines_by_page[page] = page_lines(doc[page])
    before = pymupdf.Rect(figure["rect"])
    after = _whole_lines_only(pymupdf.Rect(before), lines_by_page[page])
    # Clamped to the page: a snap that grew over the edge would render a
    # band of blank paper rather than more of the figure.
    after = after & doc[page].rect
    moved = max(abs(after.x0 - before.x0), abs(after.y0 - before.y0),
                abs(after.x1 - before.x1), abs(after.y1 - before.y1))
    return list(after), moved >= MOVED_EPSILON


def run(name, commit):
    path = PARSED_DIR + name + ".json"
    if not os.path.exists(path):
        print("%-12s no parsed file -- skipped" % name)
        return 0, 0

    with open(path, encoding="utf-8") as handle:
        records = json.load(handle)

    doc = pymupdf.open(PDF_DIR + name + "_Questions.pdf")
    os.makedirs(RENDER_DIR + name, exist_ok=True)
    client = bucket = (None, None) if not commit else None
    if commit:
        client, bucket = _s3()

    lines_by_page = {}
    changed_records = 0
    rerendered = 0

    for record in records:
        figures = record.get("figures") or []
        if not figures:
            continue

        moved_any = False
        for figure in figures:
            rect, moved = snap(doc, lines_by_page, figure)
            if moved:
                figure["rect"] = rect
                moved_any = True
        if not moved_any:
            continue
        changed_records += 1

        # Re-render exactly the way the original render split them, so a
        # question whose options are pictures keeps its per-choice keys.
        stem_figures, choice_figures = split_figures(record)

        if stem_figures and record.get("image_key"):
            data = _stack([_pixmap(doc, f) for f in stem_figures])
            filename = "q%02d.png" % record["number"]
            with open(RENDER_DIR + name + "/" + filename, "wb") as handle:
                handle.write(data)
            if commit:
                client.put_object(Bucket=bucket, Key=record["image_key"],
                                  Body=data, ContentType="image/png")
            rerendered += 1

        for letter, figure in choice_figures.items():
            key = (record.get("choice_images") or {}).get(letter)
            if not key:
                continue
            data = _stack([_pixmap(doc, figure)])
            filename = "q%02d%s.png" % (record["number"], letter)
            with open(RENDER_DIR + name + "/" + filename, "wb") as handle:
                handle.write(data)
            if commit:
                client.put_object(Bucket=bucket, Key=key, Body=data,
                                  ContentType="image/png")
            rerendered += 1

    doc.close()

    if commit and changed_records:
        with open(path, "w", encoding="utf-8") as handle:
            json.dump(records, handle, indent=1, ensure_ascii=False)

    print("%-12s figures re-cropped on %-4d questions, %-4d images re-rendered %s"
          % (name, changed_records, rerendered,
             "and uploaded" if commit else "(dry run)"))
    return changed_records, rerendered


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("papers", nargs="*")
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    papers = args.papers or sorted(
        entry[:-5] for entry in os.listdir(PARSED_DIR)
        if entry.endswith(".json") and "_IP" in entry
    )

    totals = [0, 0]
    for name in papers:
        changed, rendered = run(name, args.commit)
        totals[0] += changed
        totals[1] += rendered

    print("\n%d questions re-cropped, %d images re-rendered across %d papers"
          % (totals[0], totals[1], len(papers)))
    if not args.commit:
        print("DRY RUN -- nothing uploaded, nothing written back")


if __name__ == "__main__":
    main()

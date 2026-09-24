"""Re-cuts the figures of already-imported past-paper questions.

    python scripts/fe_papers/repair_imported_figures.py [PAPER...] [--commit] [--sheets DIR]

Applies `split_figures_on_page` to what was imported before it existed:

  * option pictures cut from overlapping stroke clusters -- halves of two
    graphs per option -- are re-cut at their printed letters, and every
    picture option loses its letter so shuffled buttons cannot contradict it;
  * a section banner stored as a question's figure is dropped (the question's
    image_key is cleared when it was the only figure);
  * a printed answer list inside a stem figure is cut off;
  * choice text: the banner glued onto the last choice is removed, and a
    picture option's scraped axis labels are blanked.

Keys are reused (same paper, question, letter), so a re-cut image replaces
the bytes behind the key the database already holds. A question whose
options will not divide is reported and left alone.

Without --commit nothing is uploaded or written. `--sheets DIR` writes one
contact sheet per changed question -- the page as printed beside the new
crops -- to look at before committing. With --commit every database value
changed is first saved to backup-<timestamp>.json in the render directory.
"""

import argparse
import datetime
import glob
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, "/app")
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..")))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "fe_expansion")))

import pymupdf
from sqlalchemy import text

from app.papers.figures import (
    BANNER_RE, _pixmap, _s3, _stack, label_cut, split_figures, split_figures_on_page,
)

PARSED_DIR = os.environ.get("PAPERS_PARSED_DIR", os.path.join(HERE, "parsed") + "/")
RENDER_DIR = os.environ.get("PAPERS_RENDER_DIR", os.path.join(HERE, "rendered") + "/")
PDF_DIR = os.environ.get("PAPERS_PDF_DIR", os.path.join(HERE, "pdf") + "/")

BANNER_TAIL_RE = re.compile(
    r"\s*Answer (?:the )?questions? Q\d+ through Q\d+ concerning [\w ]+\.?\s*$", re.I)


def citation_of(paper, number):
    season, category = paper.split("_", 1)
    category = "FE" if category.startswith("FE") else "IP"
    return "(%s, %s, Q%d)" % (season, category, number)


def find_question(db, paper, number):
    rows = db.execute(text("""
        select question_id, image_key from questions
         where parent_question_id is null and position(:cite in question_text) > 0
         limit 2"""), {"cite": citation_of(paper, number)}).fetchall()
    if len(rows) != 1:
        return None
    question_id, image_key = rows[0]
    choices = db.execute(text("""
        select choice_id, choice_text, image_key from choices
         where question_id = :q order by choice_id"""), {"q": question_id}).fetchall()
    return question_id, image_key, [tuple(c) for c in choices]


def rects(figures):
    return [[round(v, 1) for v in f["rect"]] + [f["page"]] for f in figures]


def plan(doc, record):
    """What this question needs: new stem/option figures and text fixes."""
    letters = [l for l in "abcdefgh" if l in record["choices"]]
    old_stem, old_options = split_figures(record)
    stem, options = split_figures_on_page(doc, record)
    had_options = bool(record.get("choice_images"))

    if had_options and not options:
        # Options found by the vision agent, which split_figures never sees:
        # cut the whole figure region at its letters.
        figures = record.get("figures") or []
        pages = {f["page"] for f in figures}
        if len(pages) == 1 and figures:
            region = pymupdf.Rect(figures[0]["rect"])
            for f in figures[1:]:
                region |= pymupdf.Rect(f["rect"])
            cut = label_cut(doc[figures[0]["page"]], region, letters)
            if cut:
                options = {l: {"page": figures[0]["page"], "rect": list(r)} for l, r in cut.items()}
                stem = []
                old_stem = []
        if not options:
            return {"skip": "picture options will not divide at their letters"}

    if had_options and set(options) != set(record["choice_images"]):
        return {"skip": "re-cut options do not match the stored letters"}

    return {
        "stem": stem,
        "stem_changed": rects(stem) != rects(old_stem),
        "options": options if had_options else {},
        "options_changed": had_options and rects(options.values()) != rects(old_options.values()),
    }


def contact_sheet(doc, record, change, path):
    from PIL import Image, ImageDraw

    figures = record.get("figures") or []
    by_page = {}
    for f in figures:
        by_page.setdefault(f["page"], []).append(pymupdf.Rect(f["rect"]))
    originals = []
    for page, rs in by_page.items():
        region = rs[0]
        for r in rs[1:]:
            region |= r
        region = pymupdf.Rect(region.x0 - 15, region.y0 - 15, region.x1 + 15, region.y1 + 15) & doc[page].rect
        originals.append(Image.open(io.BytesIO(doc[page].get_pixmap(
            matrix=pymupdf.Matrix(1.5, 1.5), clip=region).tobytes("png"))))
    new = []
    if change["stem"]:
        new.append(("STEM", Image.open(io.BytesIO(_stack([_pixmap(doc, f) for f in change["stem"]])))))
    elif record.get("image_key"):
        new.append(("STEM REMOVED", Image.new("RGB", (160, 40), "white")))
    for letter, f in sorted(change["options"].items()):
        new.append((letter.upper(), Image.open(io.BytesIO(_stack([_pixmap(doc, f)])))))
    new = [(n, i.resize((max(1, i.width // 2), max(1, i.height // 2)))) for n, i in new]

    width = sum(i.width for i in originals) + sum(i.width + 30 for _, i in new) + 40
    height = max([i.height for i in originals] + [i.height + 20 for _, i in new] + [60]) + 20
    sheet = Image.new("RGB", (width, height), "#bbbbbb")
    draw = ImageDraw.Draw(sheet)
    draw.text((4, 2), "%s Q%d  (left: paper, right: new)" % (record["paper"], record["number"]), fill="black")
    x = 0
    for image in originals:
        sheet.paste(image, (x, 18))
        x += image.width + 10
    x += 30
    for name, image in new:
        draw.text((x, 4), name, fill="red")
        sheet.paste(image, (x, 18))
        x += image.width + 30
    sheet.save(path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("papers", nargs="*")
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--sheets")
    args = parser.parse_args()

    from dbsession import open_session

    names = args.papers or sorted(
        os.path.basename(p)[:-5] for p in glob.glob(PARSED_DIR + "*.json"))
    db = open_session()
    client = bucket = None
    if args.commit:
        client, bucket = _s3()
    if args.sheets:
        os.makedirs(args.sheets, exist_ok=True)

    backup, counts = [], {"options": 0, "stem": 0, "stem_removed": 0, "text": 0, "skipped": 0}
    for name in names:
        path = PARSED_DIR + name + ".json"
        with open(path, encoding="utf-8") as handle:
            records = json.load(handle)
        doc = pymupdf.open(PDF_DIR + name + "_Questions.pdf")
        os.makedirs(RENDER_DIR + name, exist_ok=True)
        dirty = False

        for record in records:
            banner_choice = any(BANNER_TAIL_RE.search(v or "") for v in record["choices"].values())
            if not (record.get("figures") or banner_choice):
                continue
            change = plan(doc, record) if record.get("figures") else {
                "stem": [], "stem_changed": False, "options": {}, "options_changed": False}
            label = "%s Q%d" % (name, record["number"])
            if "skip" in change:
                print("%-16s SKIPPED: %s" % (label, change["skip"]))
                counts["skipped"] += 1
                continue

            # Text: the banner tail, and scraped labels on picture options.
            text_fixes = {}
            for letter, value in record["choices"].items():
                cleaned = BANNER_TAIL_RE.sub("", value or "")
                if record.get("choice_images", {}).get(letter):
                    cleaned = ""
                if cleaned != (value or ""):
                    text_fixes[letter] = cleaned
            stem_removed = change["stem_changed"] and not change["stem"] and record.get("image_key")

            if not (change["options_changed"] or change["stem_changed"] or text_fixes):
                continue

            found = find_question(db, name, record["number"])
            if not found:
                print("%-16s SKIPPED: not matched to one imported question" % label)
                counts["skipped"] += 1
                continue
            question_id, db_image_key, db_choices = found
            letters = [l for l in "abcdefgh" if l in record["choices"]]
            if len(db_choices) != len(letters):
                print("%-16s SKIPPED: %d stored choices, %d on the paper" % (label, len(db_choices), len(letters)))
                counts["skipped"] += 1
                continue
            by_letter = dict(zip(letters, db_choices))

            what = []
            if change["options_changed"] or change["options"]:
                what.append("options re-cut")
            if stem_removed:
                what.append("stem figure removed")
            elif change["stem_changed"]:
                what.append("stem figure re-cut")
            if text_fixes:
                what.append("choice text %s" % ",".join(sorted(text_fixes)))
            print("%-16s q=%-6d %s" % (label, question_id, "; ".join(what)))

            if args.sheets and (change["options"] or change["stem_changed"]):
                contact_sheet(doc, record, change,
                              os.path.join(args.sheets, "%s_q%02d.png" % (name, record["number"])))

            if change["options"]:
                counts["options"] += 1
                for letter, figure in change["options"].items():
                    data = _stack([_pixmap(doc, figure)])
                    with open(RENDER_DIR + name + "/q%02d%s.png" % (record["number"], letter), "wb") as h:
                        h.write(data)
                    if args.commit:
                        client.put_object(Bucket=bucket, Key=record["choice_images"][letter],
                                          Body=data, ContentType="image/png")

            if stem_removed:
                counts["stem_removed"] += 1
                backup.append({"question_id": question_id, "image_key": db_image_key})
                if args.commit:
                    db.execute(text("update questions set image_key = null where question_id = :q"),
                               {"q": question_id})
                record["image_key"] = None
                dirty = True
            elif change["stem_changed"] and change["stem"] and db_image_key:
                counts["stem"] += 1
                data = _stack([_pixmap(doc, f) for f in change["stem"]])
                with open(RENDER_DIR + name + "/q%02d.png" % record["number"], "wb") as h:
                    h.write(data)
                if args.commit:
                    client.put_object(Bucket=bucket, Key=db_image_key, Body=data,
                                      ContentType="image/png")

            for letter, cleaned in text_fixes.items():
                choice_id, db_text, _ = by_letter[letter]
                counts["text"] += 1
                backup.append({"choice_id": choice_id, "choice_text": db_text})
                if args.commit:
                    db.execute(text("update choices set choice_text = :t where choice_id = :c"),
                               {"t": BANNER_TAIL_RE.sub("", db_text or "") if cleaned else "",
                                "c": choice_id})
                record["choices"][letter] = cleaned
                dirty = True

        doc.close()
        if args.commit and dirty:
            with open(path, "w", encoding="utf-8") as handle:
                json.dump(records, handle, indent=1, ensure_ascii=False)

    if args.commit:
        stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        with open(RENDER_DIR + "backup-%s.json" % stamp, "w", encoding="utf-8") as handle:
            json.dump(backup, handle, indent=1, ensure_ascii=False)
        db.commit()
    db.close()
    print(counts, "committed" if args.commit else "(dry run)")


if __name__ == "__main__":
    main()

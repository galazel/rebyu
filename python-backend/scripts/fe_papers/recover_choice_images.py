"""Finds the questions whose answer options are pictures, using the vision agent.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/recover_choice_images.py 2011A_IP [--commit]

THE PROBLEM

`split_figures` decides that a question's pictures are its ANSWER OPTIONS by
arithmetic: as many trailing figures as there are choices, all within 20% of
one another in size, each at least 60x60. Four option graphs drawn at slightly
different heights fail that test, and all four are then composited into ONE
tall stem image. The learner sees a single picture containing every option,
and four buttons whose text is whatever the parser scraped out of the drawing
-- which is the word salad ("Person in voucher | charge of settlement Voucher
file | aggregates the...") seen on 2016S Q42.

It found choice images on 22 of 3,018 IT Passport questions. On a paper full
of "which of the following diagrams" items, that is far too few.

WHAT THIS DOES

For every question the geometry did NOT call picture-options, and that has at
least two figures and at least two choices, it renders the question's own
patch of the page and asks the vision agent whether those pictures are the
options. Where the agent says yes, the figures are re-split: the trailing ones
become per-choice images and the rest stay with the stem.

The agent is also asked whether the stem refers to something not on the page
at all -- the "shown below" questions with no figure -- and those are reported
for authoring rather than silently altered, because nothing here can recover a
figure that was never in the PDF.

WHAT --commit CHANGES

  * renders and uploads one PNG per option, and a new stem image (or removes
    it, when every figure turned out to be an option);
  * sets `choices.image_key` and BLANKS `choices.choice_text` for those
    options, in choice_id order -- the text there is scraped drawing labels,
    not an option anyone wrote;
  * updates `questions.image_key`;
  * rewrites the parsed JSON so a later re-render keeps the new split.

Blanking choice text is destructive if the agent is wrong, so nothing is
written without --commit and the dry run prints what each question would lose.
"""

import argparse
import asyncio
import json
import os
import re
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")

import pymupdf
from sqlalchemy import text

from app.papers.figures import _pixmap, _s3, _stack, split_figures_assisted
from app.papers.subject_a import PDF_DIR
from dbsession import open_session

PARSED_DIR = os.environ.get("PAPERS_PARSED_DIR", "/app/scripts/fe_papers/parsed/")
RENDER_DIR = os.environ.get("PAPERS_RENDER_DIR", "/app/scripts/fe_papers/rendered/")

#: How many questions may be in flight at the agent at once. The provider is
#: rate limited and an import is not urgent; this keeps a paper to a steady
#: trickle rather than a burst that gets throttled and retried.
CONCURRENCY = 4


def citation_of(paper, number):
    """The `Source: (...)` line this paper's question N was imported with."""
    season = paper.split("_")[0]
    return "(%s, IP, Q%d)" % (season, number)


def find_question(db, paper, number):
    """(question_id, [choice_id...]) for an imported paper question, or None.

    Matched on the citation in the stem, which is the only durable link back
    to the paper -- the import stores no paper id, and the stem text itself
    has been edited by the dedupe pass.
    """
    row = db.execute(text("""
        select q.question_id from questions q
         where q.parent_question_id is null
           and position(:cite in q.question_text) > 0
         limit 2"""), {"cite": citation_of(paper, number)}).fetchall()
    # Two matches means the citation is ambiguous; changing either is a guess.
    if len(row) != 1:
        return None
    question_id = row[0][0]
    choice_ids = [r[0] for r in db.execute(text("""
        select choice_id from choices where question_id = :q order by choice_id"""),
        {"q": question_id}).fetchall()]
    return question_id, choice_ids


async def examine(doc, record, semaphore):
    async with semaphore:
        return record, await split_figures_assisted(doc, record)


async def run(paper, commit):
    path = PARSED_DIR + paper + ".json"
    if not os.path.exists(path):
        print("%-12s no parsed file -- skipped" % paper)
        return

    with open(path, encoding="utf-8") as handle:
        records = json.load(handle)

    doc = pymupdf.open(PDF_DIR + paper + "_Questions.pdf")
    os.makedirs(RENDER_DIR + paper, exist_ok=True)
    db = open_session()
    client = bucket = None
    if commit:
        client, bucket = _s3()

    # Only the candidates: several figures, several choices, and the geometry
    # did not already call them options. Everything else costs nothing.
    candidates = [
        record for record in records
        if len(record.get("figures") or []) >= 2
        and len(record.get("choices") or {}) >= 2
        and not (record.get("choice_images") or {})
    ]
    print("%-12s %d candidate questions" % (paper, len(candidates)))
    if not candidates:
        doc.close()
        db.close()
        return

    semaphore = asyncio.Semaphore(CONCURRENCY)
    results = await asyncio.gather(
        *(examine(doc, record, semaphore) for record in candidates)
    )

    recovered = missing = 0
    for record, (stem_figures, choice_figures, verdict) in results:
        if verdict.stem_figure_missing:
            missing += 1
            print("   Q%-3d stem refers to something not on the page"
                  % record["number"])
        if not choice_figures:
            continue

        found = find_question(db, paper, record["number"])
        if not found:
            print("   Q%-3d options are pictures, but the imported question "
                  "could not be matched -- skipped" % record["number"])
            continue
        question_id, choice_ids = found
        if len(choice_ids) < len(choice_figures):
            print("   Q%-3d %d option pictures but %d stored choices -- skipped"
                  % (record["number"], len(choice_figures), len(choice_ids)))
            continue

        recovered += 1
        letters = sorted(choice_figures)
        print("   Q%-3d -> %d option pictures (question %d)"
              % (record["number"], len(letters), question_id))

        for index, letter in enumerate(letters):
            data = _stack([_pixmap(doc, choice_figures[letter])])
            filename = "q%02d%s.png" % (record["number"], letter)
            with open(RENDER_DIR + paper + "/" + filename, "wb") as handle:
                handle.write(data)
            key = "fe-past-papers/%s/%s" % (paper, filename)
            record.setdefault("choice_images", {})[letter] = key
            if commit:
                client.put_object(Bucket=bucket, Key=key, Body=data,
                                  ContentType="image/png")
                # The text here is scraped drawing labels, never an option
                # anyone wrote -- it is what made the choices unreadable.
                db.execute(text("""
                    update choices set image_key = :key, choice_text = ''
                     where choice_id = :cid"""),
                    {"key": key, "cid": choice_ids[index]})

        if stem_figures:
            data = _stack([_pixmap(doc, f) for f in stem_figures])
            filename = "q%02d.png" % record["number"]
            with open(RENDER_DIR + paper + "/" + filename, "wb") as handle:
                handle.write(data)
            key = "fe-past-papers/%s/%s" % (paper, filename)
            record["image_key"] = key
            if commit:
                client.put_object(Bucket=bucket, Key=key, Body=data,
                                  ContentType="image/png")
                db.execute(text("update questions set image_key = :key where question_id = :q"),
                           {"key": key, "q": question_id})
        else:
            # Every figure turned out to be an option: the stem has no figure
            # of its own, and leaving the old composite would show the learner
            # all four answers above the four answers.
            record["image_key"] = None
            if commit:
                db.execute(text("update questions set image_key = null where question_id = :q"),
                           {"q": question_id})

    doc.close()
    if commit:
        db.commit()
        with open(path, "w", encoding="utf-8") as handle:
            json.dump(records, handle, indent=1, ensure_ascii=False)
    db.close()

    print("   recovered %d questions with picture options, %d missing figures flagged %s"
          % (recovered, missing, "and committed" if commit else "(dry run)"))


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("papers", nargs="*")
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    papers = args.papers or sorted(
        entry[:-5] for entry in os.listdir(PARSED_DIR)
        if entry.endswith(".json") and "_IP" in entry
    )
    for paper in papers:
        await run(paper, args.commit)
    if not args.commit:
        print("\nDRY RUN -- nothing uploaded, nothing written")


if __name__ == "__main__":
    asyncio.run(main())

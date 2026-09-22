"""Renders each parsed question's figures to PNG and uploads them to S3.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/render_figures.py 2025A_FE-A [--upload]

Without --upload it renders to /app/scripts/fe_papers/rendered/ only, so the
crops can be looked at before anything leaves the machine.

Two kinds of figure are produced, because the database models them
differently:

  * A QUESTION figure -- the diagram, table or program listing the stem
    refers to. All of a question's figures are composited into one image,
    stacked in reading order, because `questions.image_key` holds one key.

  * CHOICE figures -- for the questions whose options are themselves
    pictures (four graphs, four circuit fragments, four stacked fractions).
    These go to `choices.image_key`, one per choice, and are recognised by
    the question having as many unexplained figures as it has empty choices.

Rendered at 3x so that a diagram's smallest label is still legible when the
image is scaled down into the attempt runner's 40-unit-high box.
"""

import io
import json
import os
import sys

import pymupdf

sys.path.insert(0, "/app")

PDF_DIR = os.environ.get("PAPERS_PDF_DIR", "/app/scripts/fe_papers/pdf/")
PARSED_DIR = os.environ.get("PAPERS_PARSED_DIR", "/app/scripts/fe_papers/parsed/")
RENDER_DIR = os.environ.get("PAPERS_RENDER_DIR", "/app/scripts/fe_papers/rendered/")

ZOOM = 3.0
GAP = 18  # white space between stacked figures in a composite


def _pixmap(doc, figure):
    page = doc[figure["page"]]
    rect = pymupdf.Rect(figure["rect"])
    return page.get_pixmap(matrix=pymupdf.Matrix(ZOOM, ZOOM), clip=rect, alpha=False)


def _stack(pixmaps):
    """Composites several crops into one tall PNG on a white background."""
    from PIL import Image

    images = [Image.open(io.BytesIO(p.tobytes("png"))) for p in pixmaps]
    if len(images) == 1:
        buffer = io.BytesIO()
        images[0].save(buffer, format="PNG")
        return buffer.getvalue()

    width = max(image.width for image in images)
    height = sum(image.height for image in images) + GAP * (len(images) - 1)
    canvas = Image.new("RGB", (width, height), "white")
    y = 0
    for image in images:
        canvas.paste(image, ((width - image.width) // 2, y))
        y += image.height + GAP
    buffer = io.BytesIO()
    canvas.save(buffer, format="PNG")
    return buffer.getvalue()


def _s3():
    import boto3

    return boto3.client(
        "s3",
        endpoint_url=os.environ.get("AWS_S3_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_S3_REGION", "auto"),
    ), os.environ["AWS_S3_BUCKET_NAME"]


def split_figures(record):
    """Decides which figures belong to the question and which to its choices.

    A question whose options are pictures has no usable text for them, so the
    signal is: at least two choices came out empty, and the figures at the end
    of the question number at least as many as the choices. Those trailing
    figures are the options, in reading order; anything before them belongs to
    the stem.
    """
    figures = record["figures"]
    letters = [letter for letter in "abcd" if letter in record["choices"]]
    empty = [letter for letter in letters if not record["choices"][letter].strip()]

    if len(empty) >= 2 and len(figures) >= len(letters) >= 2:
        tail = figures[-len(letters):]
        return figures[:-len(letters)], dict(zip(letters, tail))

    # A question whose options are pictures does not always LOOK empty: the
    # labels drawn inside each picture (axis marks, "C=2") extract as text and
    # land in the choice, so emptiness alone misses it. The reliable signal is
    # geometric -- the trailing figures are a grid of near-identical boxes,
    # one per option, which ordinary illustrations never are.
    if len(figures) >= len(letters) >= 2:
        tail = figures[-len(letters):]
        widths = [f["rect"][2] - f["rect"][0] for f in tail]
        heights = [f["rect"][3] - f["rect"][1] for f in tail]
        uniform = (max(widths) - min(widths) <= 0.2 * max(widths)
                   and max(heights) - min(heights) <= 0.2 * max(heights))
        if uniform and min(widths) >= 60 and min(heights) >= 60:
            return figures[:-len(letters)], dict(zip(letters, tail))
    return figures, {}


def run(name, upload):
    with open(PARSED_DIR + name + ".json", encoding="utf-8") as handle:
        records = json.load(handle)

    doc = pymupdf.open(PDF_DIR + name + "_Questions.pdf")
    os.makedirs(RENDER_DIR + name, exist_ok=True)
    client = bucket = None
    if upload:
        client, bucket = _s3()

    question_images = choice_images = 0
    for record in records:
        stem_figures, choice_figures = split_figures(record)
        record["choice_images"] = {}

        if stem_figures:
            data = _stack([_pixmap(doc, f) for f in stem_figures])
            filename = "q%02d.png" % record["number"]
            with open(RENDER_DIR + name + "/" + filename, "wb") as handle:
                handle.write(data)
            key = "fe-past-papers/%s/%s" % (name, filename)
            if upload:
                client.put_object(Bucket=bucket, Key=key, Body=data,
                                  ContentType="image/png")
            record["image_key"] = key
            question_images += 1
        else:
            record["image_key"] = None

        for letter, figure in choice_figures.items():
            data = _stack([_pixmap(doc, figure)])
            filename = "q%02d%s.png" % (record["number"], letter)
            with open(RENDER_DIR + name + "/" + filename, "wb") as handle:
                handle.write(data)
            key = "fe-past-papers/%s/%s" % (name, filename)
            if upload:
                client.put_object(Bucket=bucket, Key=key, Body=data,
                                  ContentType="image/png")
            record["choice_images"][letter] = key
            choice_images += 1

    doc.close()
    with open(PARSED_DIR + name + ".json", "w", encoding="utf-8") as handle:
        json.dump(records, handle, indent=1, ensure_ascii=False)

    print("%-18s question images=%-4d choice images=%-4d %s"
          % (name, question_images, choice_images,
             "uploaded" if upload else "(local only)"))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name in args:
        run(name, "--upload" in sys.argv)

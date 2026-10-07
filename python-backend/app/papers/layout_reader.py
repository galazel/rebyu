"""Reads questions out of any exam or reviewer PDF, not only ITPEC papers.

Two stages, neither of them a generative model:

1. LAYOUT -- Docling (MIT, local) turns each page into blocks in reading
   order: paragraphs, list items with their markers ("a)", "B."), section
   headings, and regions that are not running text -- pictures, tables,
   formulas, code. Two-column pages come back in reading order, and every
   block carries its position on the page, so a figure can be cropped exactly
   from the page image the browser already renders.

2. PROFILES -- a document numbers its questions one way ("Q12.", "Question 12",
   "12.") and letters its choices one way ("a)", "A.", "a."). Every pairing is
   tried and the one that reads the most complete questions -- consecutive
   numbers, two or more choices, an answer -- wins. A new layout is a new
   pattern here, not new code.

Figures are assigned by position: a picture, table, formula or code block
belongs to the question it appears in, and to a choice when it appears
between that choice's letter and the next. Answers come from an "Answer: B"
line inside a question or an "Answer key" section at the end; a separate key
file is matched in the browser as before.

Nothing is invented. A question that does not read cleanly is returned with
its problems named, for the reviewer or the AI page reader to deal with.
"""

from __future__ import annotations

import logging
import os
import re
import tempfile
import threading

logger = logging.getLogger(__name__)

#: How a question's number is printed. Each is tried in turn.
QUESTION_STYLES = [
    ("Q12.", re.compile(r"^Q\s?(\d{1,3})\s?[.:)]\s*")),
    ("Question 12", re.compile(r"^(?:Question|Item|No\.?)\s+(\d{1,3})\s*[.:)\-]?\s*", re.I)),
    ("12.", re.compile(r"^(\d{1,3})\s?[.)]\s+(?=\S)")),
]

#: A heading printed without its stop -- "19 The following ..." -- taken only
#: at the start of a block and only for the exact number due next.
BARE_HEADING = re.compile(r"^(\d{1,3})\s+(?=[A-Z])")

#: How the choices are lettered: (name, marker pattern, case).
CHOICE_STYLES = [
    ("a)", re.compile(r"(?:^|(?<=\s))\(?([a-h])\)(?=\s|$)"), "lower"),
    ("A.", re.compile(r"(?:^|(?<=\s))\(?([A-H])[.)](?=\s|$)"), "upper"),
    ("a.", re.compile(r"(?:^|(?<=\s))([a-h])\.(?=\s)"), "lower"),
]

#: "Answer: B", "Ans. c", "Correct answer - (d)" inside a question.
INLINE_ANSWER = re.compile(
    r"(?:^|\s)(?:correct\s+)?ans(?:wer)?\s*[:.\-=]\s*\(?([A-Ha-h])\)?(?=[\s.,;]|$)", re.I)

#: The heading of an answer-key section at the end of the document.
KEY_HEADING = re.compile(
    # "answer\w{0,2}": OCR reads "ANSWER KEY" as "ANSWERI KEY" often enough.
    r"^\s*(?:answer\w{0,2}\s*key|answers?(?:\s+(?:and|&)\s+explanations?)?|key\s+to\s+correction|"
    r"answer\s+sheet|correct\s+answers?)\s*[:.]?\s*$", re.I)
#: The same heading at the start of a block that goes on with the answers.
KEY_OPENING = re.compile(KEY_HEADING.pattern.replace(r"\s*[:.]?\s*$", r"\s*[:.\-]?"), re.I)
#: An unmistakable key heading partway through a block, directly before a
#: number-letter pair. Not a bare "Answers": "Answer: B" is an inline answer.
KEY_MID = re.compile(r"(?<=\s)(?=(?:answer\w{0,2}\s*key|key\s+to\s+correction|answer\s+sheet)\s*[:.\-]?\s*"
                     r"\d{1,3}\s*[.):\-=]?\s*\(?[A-Ha-h]\)?(?:\s|$))", re.I)
KEY_PAIR = re.compile(r"(?:^|\s)(\d{1,3})\s*[.):\-=]?\s*\(?([A-Ha-h])\)?(?=[\s.,;]|$)")

#: Docling labels that are running text, and those cropped as figures.
TEXT_LABELS = {"text", "paragraph", "list_item", "section_header", "title", "caption",
               "checkbox_selected", "checkbox_unselected", "footnote", "reference"}
FIGURE_LABELS = {"picture", "table", "formula", "code", "chart"}
SKIPPED_LABELS = {"page_header", "page_footer"}
#: A page number as printed: "7", "- 12 -", "Page 7", "Page 7 of 40", "7/40".
#: Dropped only in the top or bottom eighth of the page (see `_is_page_number`),
#: where Docling sometimes labels it plain text rather than a footer.
PAGE_NUMBER = re.compile(r"^(?:[–—-]\s*)?(?:page\s*)?\d{1,4}(?:\s*(?:/|of)\s*\d{1,4})?(?:\s*[–—-])?$", re.I)


def _is_page_number(text, fraction):
    """A page-number line in the margin. A bare-number choice ("20") sits in
    the body and is kept; in the margin it would join the last choice."""
    return bool(PAGE_NUMBER.match(text)) and (fraction[3] < 0.12 or fraction[1] > 0.88)

_converter = None
_converter_ocr = None
_lock = threading.Lock()


def _make_converter(ocr: bool):
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions
    from docling.document_converter import DocumentConverter, PdfFormatOption

    options = PdfPipelineOptions(do_ocr=ocr, do_table_structure=False)
    options.accelerator_options.num_threads = os.cpu_count() or 4
    return DocumentConverter(format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=options)})


def _converter_for(ocr: bool):
    """Docling converters, built once -- loading the layout model takes seconds."""
    global _converter, _converter_ocr
    with _lock:
        if ocr:
            if _converter_ocr is None:
                _converter_ocr = _make_converter(True)
            return _converter_ocr
        if _converter is None:
            _converter = _make_converter(False)
        return _converter


def _needs_ocr(pdf_bytes: bytes) -> bool:
    """True when any page has no text layer -- a scan, or a scanned insert."""
    import pymupdf

    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
        return any(len(page.get_text().strip()) < 20 for page in doc)


def layout_blocks(pdf_bytes: bytes) -> tuple[list[dict], int, bool]:
    """(blocks in reading order, page count, whether OCR was used).

    Each block: {kind: "text"|"figure", text, page, box: [left, top, right,
    bottom] as fractions of the page, top-left origin}.
    """
    ocr = _needs_ocr(pdf_bytes)
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as handle:
        handle.write(pdf_bytes)
        path = handle.name
    try:
        result = _converter_for(ocr).convert(path)
    finally:
        os.unlink(path)
    doc = result.document

    import pymupdf

    source = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    blocks = []
    # Regions Docling read and deliberately left out (running headers and
    # footers, page numbers), so the text-layer check does not put them back.
    ignored = {}
    for item, _level in doc.iterate_items():
        label = str(getattr(item, "label", "")).split(".")[-1].lower()
        if not getattr(item, "prov", None):
            continue
        prov = item.prov[0]
        size = doc.pages[prov.page_no].size
        box = prov.bbox.to_top_left_origin(page_height=size.height)
        fraction = [
            max(0.0, box.l / size.width), max(0.0, box.t / size.height),
            min(1.0, box.r / size.width), min(1.0, box.b / size.height),
        ]
        if label in SKIPPED_LABELS:
            ignored.setdefault(prov.page_no, []).append(fraction)
            continue
        if len({p.page_no for p in item.prov}) > 1 and all(
                len(source[p.page_no - 1].get_text().strip()) >= 20 for p in item.prov):
            # One item running across a page break: its box is the first
            # page's, its text both pages', so the second page's lines would
            # be read twice. Left out; the text-layer check puts each page's
            # lines back on that page.
            continue
        text = (getattr(item, "text", "") or "").strip()
        marker = (getattr(item, "marker", "") or "").strip()
        if label in TEXTUAL_FIGURES | {"table"} and any(
                QUESTION_LINE.match(line) or (label != "table" and CHOICE_LINE.match(line))
                for line, _ in _region_lines(source[prov.page_no - 1], fraction)):
            # A "code" or "formula" region holding a question heading or a
            # choice is running text the layout model misjudged (a title and
            # "1. Which ..." taken as code); a "table" holding a question
            # heading is the paper's own layout (a reviewer typed in a Word
            # table). Left out here; the text-layer check below puts its
            # lines back as text, in order.
            continue
        if label in FIGURE_LABELS:
            figure, choice_lines = _split_choices_out(source[prov.page_no - 1], fraction)
            if figure is not None:
                blocks.append({"kind": "figure", "label": label, "text": text,
                               "page": prov.page_no, "box": figure})
            for line_text, line_box in choice_lines:
                blocks.append({"kind": "text", "label": "list_item", "text": line_text,
                               "page": prov.page_no, "box": line_box})
        elif label in TEXT_LABELS or text:
            # Docling strips a list item's marker into its own field; the
            # profiles need it back in the text to find the choices.
            if marker and not text.startswith(marker):
                text = f"{marker} {text}".strip()
            if _is_page_number(text, fraction):
                ignored.setdefault(prov.page_no, []).append(fraction)
            elif text:
                blocks.append({"kind": "text", "label": label, "text": text,
                               "page": prov.page_no, "box": fraction})
    blocks = _check_against_text_layer(blocks, ignored, source)
    source.close()
    blocks = _without_running_lines(blocks, len(doc.pages))
    return _attach_lone_headings(blocks), len(doc.pages), ocr


def _attach_lone_headings(blocks):
    """A question number printed apart from its question -- the number cell
    of a reviewer typed in a table, a hanging number in a box of its own --
    joined to the text that starts on the same row to its right, so the
    profiles see "2. Which ..." rather than a "2." and, much later, a stem.
    The joined text keeps its own place in the order: in a table the
    numbers may all have been read first."""
    joined, dropped = {}, set()
    for block in blocks:
        if block["kind"] != "text" or not LONE_HEADING.match(block["text"]):
            continue
        box = block["box"]
        height = max(box[3] - box[1], 1e-6)
        row = [b for b in blocks
               if b is not block and b["kind"] == "text" and b["page"] == block["page"]
               and id(b) not in joined and not LONE_HEADING.match(b["text"])
               and b["box"][0] >= box[2] - 0.005
               and (min(box[3], b["box"][3]) - max(box[1], b["box"][1])) / height >= 0.5]
        if not row:
            continue
        right = min(row, key=lambda b: b["box"][0])
        joined[id(right)] = {**right, "text": f"{block['text']} {right['text']}",
                             "box": [box[0], min(box[1], right["box"][1]), right["box"][2],
                                     max(box[3], right["box"][3])]}
        dropped.add(id(block))
    return [joined.get(id(b), b) for b in blocks if id(b) not in dropped]


#: Left edge from which a block counts as in the right-hand column.
GUTTER = 0.48


def _two_column(page_blocks):
    """Several blocks wholly left of the gutter and several wholly right."""
    left = sum(1 for b in page_blocks if b["box"][2] <= 1 - GUTTER)
    right = sum(1 for b in page_blocks if b["box"][0] >= GUTTER)
    return left >= 3 and right >= 3


def _straddles(box):
    return box[0] < GUTTER - 0.03 and box[2] > 1 - GUTTER + 0.03


def _covered(box, others):
    """Whether another box already holds this line: they share some width
    and at least half the line's height."""
    height = max(box[3] - box[1], 1e-6)
    for other in others:
        if min(box[2], other[2]) - max(box[0], other[0]) <= 0:
            continue
        if (min(box[3], other[3]) - max(box[1], other[1])) / height >= 0.5:
            return True
    return False


def _page_lines(page):
    """[(text, box)] for the upright lines of a page's own text layer. A
    rotated line -- a diagonal watermark, a stamp -- is never content."""
    width, height = page.rect.width, page.rect.height
    lines = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            if abs(line["dir"][1]) > 0.05:
                continue
            text = _line_text(line)
            if not text:
                continue
            x0, y0, x1, y1 = line["bbox"]
            lines.append((text, [max(0.0, x0 / width), max(0.0, y0 / height),
                                 min(1.0, x1 / width), min(1.0, y1 / height)]))
    return lines


def _line_text(line):
    """A text-layer line's text, with a space wherever the page shows a gap.

    A tab, or text placed by position, is a gap with no space character
    behind it: "A. Primary netw<tab>B. Secondary" comes out of the text
    layer as "netwB." and the choice letter is lost. Spans are joined
    without inventing a space either -- a word set half in bold is still one
    word."""
    out, previous = [], None
    for span in line["spans"]:
        size = span.get("size") or 10
        for char in span["chars"]:
            c = char["c"]
            if previous is not None and not c.isspace() and not previous[0].isspace():
                if char["bbox"][0] - previous[1] > 0.25 * size:
                    out.append(" ")
            out.append(c)
            previous = (c, char["bbox"][2])
    return re.sub(r"\s+", " ", "".join(out)).strip()


def _words(text):
    return re.findall(r"[a-z0-9]+", text.lower())


def _real_blocks(page_blocks, lines):
    """The page's blocks less two kinds of text Docling reports that the page
    does not print upright where it says:

    - PHANTOMS: a watermark's or stamp's rotated letters ("SAMPLE", "ONLY")
      read as a text block lying across a column. Kept, it would hide the
      real lines beneath it from the text-layer check. A text block counts as
      real when most of its words are in the upright lines inside its box.
    - DUPLICATES: the same text at the same place twice ("A Secondary ..."
      and "A. Secondary ...").

    A real block dropped by mistake costs nothing: its lines are uncovered
    and the text-layer check puts them back.
    """
    kept = []
    for block in page_blocks:
        if block["kind"] == "text":
            words = _words(block["text"])
            box = block["box"]
            inside = set()
            for text, line_box in lines:
                cx, cy = (line_box[0] + line_box[2]) / 2, (line_box[1] + line_box[3]) / 2
                if box[0] - 0.01 <= cx <= box[2] + 0.01 and box[1] - 0.01 <= cy <= box[3] + 0.01:
                    inside.update(_words(text))
            if words and sum(1 for w in words if w in inside) < 0.6 * len(words):
                continue
            same = "".join(words)
            if any(other["kind"] == "text" and "".join(_words(other["text"])) == same
                   and all(abs(a - b) <= 0.01 for a, b in zip(other["box"], box))
                   for other in kept):
                continue
        kept.append(block)
    return kept


def _column_of(box, two_column):
    return two_column and box[0] >= GUTTER


def _insert_in_order(page_blocks, block, two_column):
    """Puts a block after the lowest block above it in its column, keeping
    the order of everything else as it is."""
    box = block["box"]
    column = _column_of(box, two_column)
    same_column = [i for i, b in enumerate(page_blocks) if _column_of(b["box"], two_column) == column]
    above = [i for i in same_column if page_blocks[i]["box"][1] <= box[1]]
    if above:
        at = max(above, key=lambda i: (page_blocks[i]["box"][1], i)) + 1
    else:
        below = [i for i in same_column if page_blocks[i]["box"][1] > box[1]]
        at = min(below) if below else len(page_blocks)
    page_blocks.insert(at, block)


def _two_column_order(blocks):
    """Reading order of a two-column page from where things are printed.

    Something spanning the gutter -- a title, a wide figure, a full-width
    question -- divides the page into bands; within a band the left column
    is read top to bottom, then the right. The layout model's own order
    fails here in practice (a right-column block before the left column's
    last question), and the geometry does not.
    """
    ordered, band = [], []
    for block in sorted(blocks, key=lambda b: b["box"][1]):
        if _straddles(block["box"]):
            ordered.extend(sorted(band, key=lambda b: (b["box"][0] >= GUTTER, b["box"][1])))
            ordered.append(block)
            band = []
        else:
            band.append(block)
    ordered.extend(sorted(band, key=lambda b: (b["box"][0] >= GUTTER, b["box"][1])))
    return ordered


def _merged_slice(block, page_blocks):
    """A text block lying over other blocks of its column -- the layout
    model's merge of lines from several questions that happen to share a
    left edge ("Answer: D Answer: C Answer: C", every question's "D.")."""
    if block["kind"] != "text":
        return False
    box = block["box"]
    for other in page_blocks:
        if other is block:
            continue
        ob = other["box"]
        if min(box[2], ob[2]) - max(box[0], ob[0]) <= 0:
            continue
        if (min(box[3], ob[3]) - max(box[1], ob[1])) / max(ob[3] - ob[1], 1e-6) >= 0.5:
            return True
    return False


def _ruled_tables(page):
    """Boxes of tables drawn with ruled lines that hold no question heading
    or choice -- content to crop as a figure. A ruled table holding
    questions is the paper's own layout (a reviewer typed in a Word table)
    and stays text."""
    try:
        found = page.find_tables()
    except Exception:  # noqa: BLE001 -- no table finder, no tables
        return []
    width, height = page.rect.width, page.rect.height
    boxes = []
    for table in found.tables:
        if table.row_count < 2 or table.col_count < 2:
            continue
        cells = [line.strip() for row in table.extract() for cell in row if cell
                 for line in str(cell).splitlines()]
        if any(QUESTION_LINE.match(c) or CHOICE_LINE.match(c) or LONE_HEADING.match(c) for c in cells):
            continue
        x0, y0, x1, y1 = table.bbox
        boxes.append([x0 / width, y0 / height, x1 / width, y1 / height])
    return boxes


def _check_against_text_layer(blocks, ignored, source):
    """Holds Docling's reading of each page to the PDF's own text layer.

    The layout model is a guess at the page; the text layer is what the PDF
    actually prints, and where. The guess goes wrong in a handful of ways,
    none particular to one document:

    - PHANTOM AND DUPLICATE BLOCKS -- see `_real_blocks`.
    - DROPPED TEXT. Lines no block covers: choices under a watermark, a page
      read as one "code" region. Each is put back after the block above it
      in its column.
    - MERGED SLICES. One block holding lines from several questions that
      share a left edge -- see `_merged_slice` -- replaced by its own lines,
      each placed where it is printed.
    - LOST COLUMN ORDER. On a two-column page, a block spanning the gutter (a
      watermark plus the column text it crosses), with everything around it
      ordered wrongly. It is replaced by its lines and the page re-read left
      column, then right.
    - FIGURES OUT OF PLACE. Pictures listed after the text around them (all
      four choice letters, then all four pictures). Each figure is placed
      after the block above it in its column, so a choice's picture follows
      its letter.
    - MISSED TABLES. A ruled table the layout model read as loose cells --
      see `_ruled_tables` -- kept as a figure.

    Pages without a text layer (scans, read by OCR) keep Docling's reading.
    """
    # Every page, not only those Docling found blocks on: a page it read as
    # one misjudged region, or skipped, is all text-layer lines.
    pages = {page_no: [] for page_no in range(1, len(source) + 1)}
    for block in blocks:
        pages.setdefault(block["page"], []).append(block)
    out = []
    for page_no, page_blocks in pages.items():
        page = source[page_no - 1]
        lines = _page_lines(page)
        if sum(len(text) for text, _ in lines) < 20:
            out.extend(page_blocks)
            continue
        page_blocks = _real_blocks(page_blocks, lines)
        two_column = _two_column([{"box": box} for _, box in lines])

        figures = [b for b in page_blocks if b["kind"] == "figure"]
        for box in _ruled_tables(page):
            if not _covered(box, [f["box"] for f in figures]):
                figures.append({"kind": "figure", "label": "table", "text": "", "page": page_no, "box": box})
        def in_figure(block):
            cx = (block["box"][0] + block["box"][2]) / 2
            cy = (block["box"][1] + block["box"][3]) / 2
            return any(f["box"][0] <= cx <= f["box"][2] and f["box"][1] <= cy <= f["box"][3] for f in figures)
        texts = [b for b in page_blocks if b["kind"] == "text" and not in_figure(b)]

        straddling = [b for b in texts if two_column and _straddles(b["box"])]
        broken = straddling + [b for b in texts if b not in straddling and _merged_slice(b, texts)]
        kept = [b for b in texts if b not in broken]
        taken = [b["box"] for b in kept + figures] + ignored.get(page_no, [])
        missing = [{"kind": "text", "label": "text", "text": text, "page": page_no, "box": box}
                   for text, box in lines
                   if not _covered(box, taken) and not _is_page_number(text, box)]
        if two_column:
            out.extend(_two_column_order(kept + missing + figures))
            continue
        for block in sorted(missing + figures, key=lambda b: b["box"][1]):
            _insert_in_order(kept, block, two_column)
        out.extend(kept)
    return out


def _in_margin(box):
    return box[3] < 0.12 or box[1] > 0.88


def _without_running_lines(blocks, page_count):
    """Drops running headers and footers: text in the top or bottom margin
    that repeats on several pages -- the exam's name, a school's header, a
    copyright line. Left in, one joins the last choice before each page
    break. Digits are ignored when comparing, so "Page 3" and "Page 4" are
    one line."""
    if page_count < 2:
        return blocks
    pages_with = {}
    for block in blocks:
        if block["kind"] == "text" and _in_margin(block["box"]):
            key = re.sub(r"\d+", "#", block["text"].lower()).strip()
            pages_with.setdefault(key, set()).add(block["page"])
    running = {key for key, pages in pages_with.items() if len(pages) >= max(2, page_count // 2)}
    return [
        block for block in blocks
        if not (block["kind"] == "text" and _in_margin(block["box"])
                and re.sub(r"\d+", "#", block["text"].lower()).strip() in running)
    ]


#: A printed line that begins with a choice letter: "(a) ...", "b) ...", "C. ..."
CHOICE_LINE = re.compile(r"^\(?[a-hA-H][.)]\s+\S")
#: A printed line that begins with a question heading in any of the styles.
QUESTION_LINE = re.compile(r"^(?:Q\s?\d{1,3}\s?[.:)]|(?:Question|Item|No\.?)\s+\d{1,3}|\d{1,3}\s?[.)]\s+\S)", re.I)
#: A question heading standing alone: "2.", "Q2.", "Question 2:".
LONE_HEADING = re.compile(r"^(?:Q\s?\d{1,3}\s?[.:)]?|(?:Question|Item|No\.?)\s+\d{1,3}\s*[.:)]?|\d{1,3}\s?[.)])$", re.I)
#: Figure labels the layout model also gives running text it misjudges.
TEXTUAL_FIGURES = {"code", "formula"}


def _region_lines(page, fraction):
    """[(text, box)] for the PDF text lines inside a region, top to bottom."""
    width, height = page.rect.width, page.rect.height
    clip = pymupdf_rect(fraction, width, height)
    rows = {}
    for x0, y0, x1, y1, word, *_ in page.get_text("words", clip=clip):
        key = round((y0 + y1) / 2 / 3)
        rows.setdefault(key, []).append((x0, y0, x1, y1, word))
    lines = []
    for key in sorted(rows):
        words = sorted(rows[key])
        text = " ".join(w[4] for w in words)
        box = [min(w[0] for w in words) / width, min(w[1] for w in words) / height,
               max(w[2] for w in words) / width, max(w[3] for w in words) / height]
        lines.append((text, box))
    return lines


def _split_choices_out(page, fraction):
    """(figure box or None, [(choice line text, box)]) for one figure region.

    The layout model sometimes takes a table and the lettered choices printed
    under it as one region; cropped whole, the choices would be lost from the
    question's text. The PDF's own text inside the region says where they
    start: the figure ends above the first line that begins with a choice
    letter, and those lines are returned as text.
    """
    lines = _region_lines(page, fraction)
    first = next((i for i, (text, _) in enumerate(lines) if CHOICE_LINE.match(text)), None)
    if first is None:
        return fraction, []
    top = lines[first][1][1]
    figure = None
    if top - fraction[1] > 0.02:  # something drawn above the choices to keep
        figure = [fraction[0], fraction[1], fraction[2], max(fraction[1], top - 0.004)]
    return figure, lines[first:]


def pymupdf_rect(fraction, width, height):
    import pymupdf

    return pymupdf.Rect(fraction[0] * width, fraction[1] * height,
                        fraction[2] * width, fraction[3] * height)


def _answer_key(blocks: list[dict]) -> tuple[list[dict], dict]:
    """(blocks before the answer-key section, {question number: letter}).

    The heading may stand alone or open the block that holds the answers
    ("ANSWER KEY 1. B 2. D ..."), as the layout model often joins them.

    A heading counts only when what follows it reads as a key -- most of its
    blocks hold number-letter pairs -- and the last such heading wins: a
    title that wraps to leave "answer." on a line of its own, at the top of
    the paper, is not the key section at the end of it.

    A key heading in the middle of a block, straight before its answers
    ("D. Manual irrigation ANSWER KEY 1. B 2. D"), splits the block there:
    the layout model joined the last choice and the key."""
    split = []
    for block in blocks:
        mid = KEY_MID.search(block["text"]) if block["kind"] == "text" else None
        if mid:
            split.append({**block, "text": block["text"][:mid.start()].strip()})
            split.append({**block, "text": block["text"][mid.start():].strip()})
        else:
            split.append(block)
    blocks = split
    for index in range(len(blocks) - 1, -1, -1):
        block = blocks[index]
        if block["kind"] != "text":
            continue
        opening = KEY_OPENING.match(block["text"])
        if not opening or not (KEY_HEADING.match(block["text"])
                               or KEY_PAIR.match(block["text"][opening.end():])):
            continue
        texts = [block["text"][opening.end():]] + [later["text"] for later in blocks[index + 1:]
                                                  if later["kind"] == "text"]
        texts = [text for text in texts if text.strip()]
        with_pairs = [text for text in texts if KEY_PAIR.search(text)]
        if len(with_pairs) < 0.6 * len(texts):
            continue
        answers = {}
        for text in with_pairs:
            for number, letter in KEY_PAIR.findall(text):
                answers.setdefault(number, letter.lower())
        if len(answers) >= 3:
            return blocks[:index], answers
    return blocks, {}


def _read_with(blocks, question_re, choice_re, case):
    """Questions under one numbering and one choice style."""
    questions = []
    current = None
    expected = None
    # The same heading found partway through a block: Docling sometimes
    # joins a question's last choice and the next question into one
    # paragraph ("(d) Neo4j Question 7: Which ...").
    mid_re = re.compile(r"(?<=\s)" + question_re.pattern.lstrip("^"), question_re.flags)

    def accept(number):
        # A heading only counts as the next question when its number is the
        # next one -- "3." inside a stem's own numbered list is not.
        return (expected is None and number <= 5) or number == expected

    def heading_at_start(text):
        """The question heading a block opens with, or None. Looser than
        mid-block: a misprinted "19 The following..." (no stop) is taken
        when 19 is exactly the number due, and a block opening with the
        number after it is taken too, so one heading the profile cannot read
        costs that question, not every question after it."""
        match = question_re.match(text)
        if match:
            number = int(match.group(1))
            if accept(number) or (expected is not None and number == expected + 1):
                return match
            return None
        bare = BARE_HEADING.match(text)
        if bare and expected is not None and int(bare.group(1)) == expected:
            return bare
        return None

    def cover(question, block):
        # The part of each page the question occupies -- its "Show original".
        top, bottom = block["box"][1], block["box"][3]
        low, high = question["regions"].get(block["page"], (top, bottom))
        question["regions"][block["page"]] = (min(low, top), max(high, bottom))

    for block in blocks:
        if block["kind"] != "text":
            if current is not None:
                cover(current, block)
                current["pages"].add(block["page"])
                current["tokens"].append(("figure", {"page": block["page"], "box": block["box"],
                                                     "label": block["label"]}))
            continue
        text = block["text"]
        at_start = True
        while text:
            if at_start:
                match = heading_at_start(text)
                at_start = False
            else:
                match = question_re.match(text)
                match = match if match and accept(int(match.group(1))) else None
            if match:
                number = int(match.group(1))
                current = {"num": str(number), "tokens": [], "pages": {block["page"]}, "regions": {}}
                questions.append(current)
                cover(current, block)
                expected = number + 1
                text = text[match.end():].strip()
                continue
            split = next((m.start() for m in mid_re.finditer(text)
                          if m.start() > 0 and accept(int(m.group(1)))), None)
            head = (text if split is None else text[:split]).strip()
            if head and current is not None:
                current["pages"].add(block["page"])
                cover(current, block)
                current["tokens"].append(("text", head))
            if split is None:
                break
            text = text[split:]

    out = []
    for question in questions:
        stem_parts, figures, options, answer = [], [], [], None
        target = None  # None = the stem; otherwise an option dict
        want = first = "a" if case == "lower" else "A"
        restarted = False
        for kind, value in question["tokens"]:
            if kind == "figure":
                if target is None:
                    figures.append(value)
                elif target["figure"] is None and not target["text"]:
                    target["figure"] = value
                else:
                    figures.append(value)
                continue
            text = value
            found = INLINE_ANSWER.search(text)
            if found:
                answer = found.group(1).lower()
                text = (text[:found.start()] + text[found.end():]).strip()
            cursor = 0
            for mark in choice_re.finditer(text):
                if mark.group(1) != want:
                    # A line opening a fresh "A." after this question has its
                    # choices: the next question's number could not be read
                    # (a smudged scan, an unreadable heading). Named rather
                    # than silently folded into this question.
                    if (mark.group(1) == first and len(options) >= 2
                            and not text[:mark.start()].strip()):
                        restarted = True
                    continue
                piece = text[cursor:mark.start()].strip()
                if piece and target is None:
                    stem_parts.append(piece)
                elif piece:
                    target["text"] = (target["text"] + " " + piece).strip()
                target = {"key": want.lower(), "text": "", "figure": None}
                options.append(target)
                cursor = mark.end()
                want = chr(ord(want) + 1)
            piece = text[cursor:].strip()
            if piece:
                if target is None:
                    stem_parts.append(piece)
                else:
                    target["text"] = (target["text"] + " " + piece).strip()

        issues = []
        if len(options) < 2:
            issues.append("choices were not found")
        elif any(not o["text"] and not o["figure"] for o in options):
            issues.append("a choice is empty")
        if restarted:
            issues.append("another question's choices follow it -- its number may be unreadable")
        out.append({
            "num": question["num"],
            "stem": re.sub(r"[ \t]+", " ", "\n".join(stem_parts)).strip(),
            "options": options,
            "figures": figures,
            "answer": answer,
            "pages": sorted(question["pages"]),
            "regions": [{"page": page, "top": top, "bottom": bottom}
                        for page, (top, bottom) in sorted(question["regions"].items())],
            "issues": issues,
        })
    return out


def _score(questions, answers):
    if len(questions) < 2:
        return 0.0
    good = sum(1 for q in questions if not q["issues"])
    answered = sum(1 for q in questions if q["answer"] or answers.get(q["num"]))
    return good + 0.3 * answered


def read_document(pdf_bytes: bytes) -> dict:
    """Every question in the PDF under its best-reading profile.

    Returns {profile, questions, answers, pages, ocr, complete, total}; each
    question {num, stem, options: [{key, text, figure}], figures: [{page,
    box}], answer, pages, issues}. Boxes are fractions of the page, top-left
    origin, so the browser can crop them from its own render at any scale.
    """
    blocks, page_count, ocr = layout_blocks(pdf_bytes)
    body, key = _answer_key(blocks)

    best = None
    for q_name, q_re in QUESTION_STYLES:
        for c_name, c_re, case in CHOICE_STYLES:
            questions = _read_with(body, q_re, c_re, case)
            score = _score(questions, key)
            if best is None or score > best[0]:
                best = (score, f"{q_name} / {c_name}", questions)

    score, profile, questions = best or (0.0, None, [])
    for question in questions:
        if not question["answer"] and key.get(question["num"]):
            question["answer"] = key[question["num"]]
    complete = sum(1 for q in questions if not q["issues"])
    logger.info("Layout reader: %s, %d questions, %d complete, %d pages%s",
                profile, len(questions), complete, page_count, " (OCR)" if ocr else "")
    return {
        "profile": profile,
        "questions": questions,
        "answers": key,
        "pages": page_count,
        "ocr": ocr,
        "total": len(questions),
        "complete": complete,
    }

"""Extracts the IT Passport syllabus tree from the IPA syllabus PDF.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/extract_ip_syllabus.py

Writes ip_syllabus.json: major category -> middle category -> topics, in the
order the syllabus prints them.

Read from the BODY rather than the contents page. In the contents the item
number and its title are separate text runs joined by a dot leader, and the
leader is what carries the association; in the body each topic is introduced
by a single heading line, which is unambiguous.

The result is the authority for what IT Passport lessons should exist. The
certification currently holds twelve, all of them Strategy and Management --
the whole Technology field, which is nine of the syllabus's twenty-three
middle categories, has no lessons at all.
"""

import json
import re
import sys

import pymupdf

sys.path.insert(0, "/app/scripts/fe_papers")
from parse_subject_a import page_lines  # noqa: E402

PDF = "/app/scripts/fe_papers/pdf/IT_PASSPORT_SYLLABUS.pdf"
OUT = "/app/scripts/fe_papers/ip_syllabus.json"

MAJOR_RE = re.compile(r"^MAJOR CATEGORY\s*(\d+)\s*:\s*(.+?)\s*$", re.I)
MIDDLE_RE = re.compile(r"^MIDDLE CATEGORY\s*(\d+)\s*:\s*(.+?)\s*$", re.I)
#: A topic heading is a bare number followed by its title, and the title is
#: frequently broken across several text runs -- one syllabus heading arrives
#: as nine separate lines, a word each. The number is therefore matched alone
#: and the title assembled from the rows that follow it, up to the "[Goal]"
#: line that every topic body opens with.
TOPIC_NUMBER_RE = re.compile(r"^(\d{1,2})\.\s*(.*)$")
BODY_MARKERS = ("[Goal]", "[Description]", "Sample terms")


def main():
    doc = pymupdf.open(PDF)
    lines = []
    for index in range(doc.page_count):
        # Row-grouped rather than raw, so a heading split across text runs is
        # reassembled before anything tries to read it.
        rows, current, last_centre = [], [], None
        for value, rect in page_lines(doc[index]):
            centre = (rect.y0 + rect.y1) / 2
            if last_centre is not None and abs(centre - last_centre) > 4:
                rows.append(" ".join(current))
                current = []
            current.append(value.strip())
            last_centre = centre
        if current:
            rows.append(" ".join(current))
        for row in rows:
            value = re.sub(r"\s+", " ", row.replace("|", " ")).strip()
            if value:
                lines.append((index + 1, value))
    doc.close()

    tree = []
    major = middle = None
    seen_topics = set()

    for page, line in lines:
        # The contents pages repeat every heading; skip them.
        if page < 9:
            continue
        match = MAJOR_RE.match(line)
        if match:
            number, title = int(match.group(1)), match.group(2).title()
            if not tree or tree[-1]["number"] != number:
                tree.append({"number": number, "title": title, "middles": []})
            major = tree[-1]
            middle = None
            continue
        match = MIDDLE_RE.match(line)
        if match and major is not None:
            number, title = int(match.group(1)), match.group(2).title()
            existing = next((m for m in major["middles"] if m["number"] == number), None)
            if existing is None:
                existing = {"number": number, "title": title, "topics": []}
                major["middles"].append(existing)
            middle = existing
            continue
        match = TOPIC_NUMBER_RE.match(line)
        if match and middle is not None:
            number, title = int(match.group(1)), match.group(2).strip()
            if not title:
                # Title is on the following rows; take them until the body
                # starts.
                position = lines.index((page, line))
                parts = []
                for _, following in lines[position + 1:position + 6]:
                    if any(following.startswith(m) for m in BODY_MARKERS):
                        break
                    parts.append(following)
                title = " ".join(parts).strip()
            if not title or len(title) > 110:
                continue
            # Topic numbers run as one continuous sequence across the whole
            # syllabus, so the only acceptable next heading is exactly one
            # more than the last. Anything else is a numbered list inside a
            # topic's own body, of which there are many.
            expected = (max(seen_topics) + 1) if seen_topics else 1
            if number != expected:
                continue
            seen_topics.add(number)
            middle["topics"].append({"number": number, "title": title})

    with open(OUT, "w", encoding="utf-8") as handle:
        json.dump(tree, handle, indent=1, ensure_ascii=False)

    topics = sum(len(m["topics"]) for maj in tree for m in maj["middles"])
    middles = sum(len(maj["middles"]) for maj in tree)
    print("majors=%d middles=%d topics=%d" % (len(tree), middles, topics))
    for maj in tree:
        print("\nMAJOR %d: %s" % (maj["number"], maj["title"]))
        for mid in maj["middles"]:
            print("  MIDDLE %d: %s" % (mid["number"], mid["title"]))
            for topic in mid["topics"]:
                print("     %2d. %s" % (topic["number"], topic["title"]))


if __name__ == "__main__":
    main()

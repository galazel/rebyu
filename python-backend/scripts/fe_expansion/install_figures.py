"""Writes every registered FE figure into the frontend's public directory.

There is no database step here, unlike `topcit_expansion/install_diagrams.py`.
That script exists because the TOPCIT lessons were authored with hotlinked
URLs and had to be repointed at local files afterwards; these lessons carry
`fig("slug")` from the start, so the path in the database is already correct
and only the file has to exist beside it.

Run it after adding a figure, and before seeding lessons that reference one.

    python scripts/fe_expansion/install_figures.py
    python scripts/fe_expansion/install_figures.py --check
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from figures import FIGURES, PREFIX  # noqa: E402

_HERE = os.path.dirname(os.path.abspath(__file__))
#: python-backend/scripts/fe_expansion -> repository root -> frontend/public
OUTPUT_DIR = os.path.normpath(os.path.join(
    _HERE, "..", "..", "..", "frontend", "public", "lesson-media"))


def main():
    check_only = "--check" in sys.argv
    if not os.path.isdir(OUTPUT_DIR):
        print("no such directory: %s" % OUTPUT_DIR)
        return 1

    written = unchanged = 0
    for slug, svg in sorted(FIGURES.items()):
        path = os.path.join(OUTPUT_DIR, "%s%s.svg" % (PREFIX, slug))
        current = None
        if os.path.exists(path):
            with open(path, encoding="utf-8") as handle:
                current = handle.read()
        if current == svg:
            unchanged += 1
            continue
        if check_only:
            print("  would write  %s%s.svg" % (PREFIX, slug))
            written += 1
            continue
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(svg)
        print("  %s  %s%s.svg  (%d bytes)"
              % ("+" if current is None else "~", PREFIX, slug, len(svg)))
        written += 1

    # Prune figures that are no longer registered. Several were drawn as SVG
    # tables before the renderer gained a real `table` block, and leaving the
    # files behind means the next person cannot tell which representation a
    # lesson actually uses.
    #
    # Scoped strictly to the `fe-` prefix: this directory also holds the 37
    # TOPCIT figures, and those are owned by a different module that this
    # script knows nothing about.
    live = {"%s%s.svg" % (PREFIX, slug) for slug in FIGURES}
    removed = 0
    for name in sorted(os.listdir(OUTPUT_DIR)):
        if not name.startswith(PREFIX) or not name.endswith(".svg"):
            continue
        if name in live:
            continue
        if check_only:
            print("  would remove  %s" % name)
        else:
            os.remove(os.path.join(OUTPUT_DIR, name))
            print("  -  %s  (no longer registered)" % name)
        removed += 1

    print("\n%d figure(s) %s, %d unchanged, %d removed -> %s"
          % (written, "to write" if check_only else "written",
             unchanged, removed, OUTPUT_DIR))
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Drawn diagrams for IT Passport lessons 734-747.

Same kit and output directory as `ip_diagrams.py`; see that module for why
these are drawn rather than hotlinked.
"""

import os
import sys

sys.path.insert(0, "/app/scripts/topcit_expansion")

import diagram_kit as dk  # noqa: E402

OUTPUT_DIR = "/app/../frontend/public/lesson-media"


def _structures():
    return dk.compare(
        "Four ways to hold a collection",
        [("Array", "index straight to it", ["Fixed size, contiguous",
                                            "Reading position n is instant",
                                            "Inserting means shifting the rest"]),
         ("List", "follow the links", ["Grows and shrinks freely",
                                       "Insert is cheap once you are there",
                                       "Finding position n means walking"]),
         ("Stack", "last in, first out", ["Push and pop at one end only",
                                          "Undo, and call return addresses",
                                          "Only the top is reachable"]),
         ("Queue", "first in, first out", ["Add at the back, remove at the front",
                                           "Print jobs, message buffers",
                                           "Order of arrival is preserved"])],
        caption="Choose by the access the task needs, not by which is most familiar.",
    )


def _stack_queue():
    return dk.flow(
        "The same four items, taken out in different orders",
        [("Put in", "A, B, C, D"),
         ("Stack (LIFO)", "out: D, C, B, A"),
         ("Queue (FIFO)", "out: A, B, C, D")],
        caption="LIFO reverses the order; FIFO preserves it.",
    )


def _search():
    return dk.compare(
        "Linear against binary search",
        [("Linear search", "check each in turn", ["Works on unsorted data",
                                                  "Up to n comparisons",
                                                  "Fine for short lists"]),
         ("Binary search", "halve the range", ["Requires the data to be SORTED",
                                               "About log2(n) comparisons",
                                               "1,000 items in about 10 checks"])],
        caption="Binary search is far faster, but sorting first has its own cost.",
    )


def _flowchart():
    return dk.flow(
        "The three control structures every program is built from",
        [("Sequence", "one step after another"),
         ("Selection", "if the condition holds, do this"),
         ("Iteration", "repeat while the condition holds")],
        caption="Any algorithm can be expressed with these three alone.",
    )


def _languages():
    return dk.tiers(
        "From source code to something the processor runs",
        [("High-level language", ["Java, Python, C -- written by people"]),
         ("Compiler or interpreter", ["Translates to machine instructions"]),
         ("Machine language", ["Binary instructions the processor decodes"]),
         ("Hardware", ["The processor executes them"])],
        caption="A compiler translates the whole program first; an interpreter translates as it runs.",
    )


def _markup():
    return dk.table(
        "Languages that describe rather than compute",
        ["Language", "Describes", "Typical use"],
        [["HTML", "Structure of a page", "Headings, paragraphs, links"],
         ["CSS", "Presentation", "Colour, spacing, layout"],
         ["XML", "Data, with your own tags", "Exchange between systems"],
         ["JSON", "Data, as objects and arrays", "Web APIs"],
         ["SQL", "What data to fetch", "Querying a database"]],
        caption="Markup and query languages state what, not how.",
    )


def _processor():
    return dk.cycle(
        "The instruction cycle",
        [("Fetch", "Read the next instruction from memory"),
         ("Decode", "Work out what it asks for"),
         ("Execute", "Carry it out"),
         ("Store", "Write the result back")],
        caption="Clock speed is how many of these steps run per second.",
    )


def _memory_hierarchy():
    return dk.tiers(
        "The memory hierarchy: faster and smaller toward the top",
        [("Register", ["Inside the processor; fastest, tiny"]),
         ("Cache", ["A few MB; holds what was used recently"]),
         ("Main memory (RAM)", ["GB; volatile -- lost when power goes"]),
         ("SSD / hard disk", ["TB; keeps its contents without power"])],
        caption="Each level down is larger, cheaper per byte and markedly slower.",
    )


def _raid():
    return dk.compare(
        "What each arrangement buys",
        [("RAID 0", "striping", ["Data split across disks",
                                 "Faster, more capacity",
                                 "NO protection -- one failure loses everything"]),
         ("RAID 1", "mirroring", ["Every disk holds the same data",
                                  "Survives one disk failing",
                                  "Half the capacity is redundancy"]),
         ("RAID 5", "striping with parity", ["Parity spread across disks",
                                             "Survives one failure",
                                             "Needs three disks or more"])],
        caption="RAID protects against a disk failing. It is not a backup.",
    )


def _availability():
    return dk.fields(
        "Availability = MTBF / (MTBF + MTTR)",
        [("MTBF -- mean time between failures", "480 hours", 6, dk.BLUE),
         ("MTTR -- mean time to repair", "20 hours", 2, dk.ORANGE)],
        caption="480 / (480 + 20) = 0.96, or 96% availability.",
        footer="Halving repair time raises availability just as effectively as "
               "doubling the time between failures -- and is usually cheaper.",
    )


def _os_roles():
    return dk.hub_spoke(
        "What an operating system manages",
        "Operating system",
        [("Processes", "Which program runs, and when"),
         ("Memory", "Who gets which part, and protection between them"),
         ("Files", "Names, folders, permissions"),
         ("Devices", "Talking to disks, screens, networks"),
         ("Users", "Accounts, logins, rights")],
        caption="Applications ask the OS for resources rather than touching hardware.",
    )


def _backup():
    return dk.compare(
        "Three backup strategies",
        [("Full", "everything, every time", ["Simplest restore -- one set",
                                             "Slowest to take",
                                             "Uses the most space"]),
         ("Differential", "changes since the last FULL", ["Restore needs full + latest one",
                                                          "Grows until the next full",
                                                          "A middle course"]),
         ("Incremental", "changes since the last BACKUP", ["Fastest to take, least space",
                                                           "Restore needs full + EVERY one since",
                                                           "A broken link breaks the chain"])],
        caption="The trade is always backup speed against restore complexity.",
    )


DIAGRAMS = {
    "ip-data-structures": _structures,
    "ip-stack-queue": _stack_queue,
    "ip-search-compare": _search,
    "ip-control-structures": _flowchart,
    "ip-language-levels": _languages,
    "ip-markup-languages": _markup,
    "ip-instruction-cycle": _processor,
    "ip-memory-hierarchy": _memory_hierarchy,
    "ip-raid-levels": _raid,
    "ip-availability": _availability,
    "ip-os-roles": _os_roles,
    "ip-backup-types": _backup,
}


def main():
    target = os.path.normpath(OUTPUT_DIR)
    os.makedirs(target, exist_ok=True)
    for slug, build in DIAGRAMS.items():
        svg = build()
        with open(os.path.join(target, slug + ".svg"), "w", encoding="utf-8") as handle:
            handle.write(svg)
        print("  wrote %-30s %6d bytes" % (slug + ".svg", len(svg)))
    print("\n%d diagrams written to %s" % (len(DIAGRAMS), target))


if __name__ == "__main__":
    main()

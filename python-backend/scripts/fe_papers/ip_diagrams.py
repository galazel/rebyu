"""Drawn diagrams for the IT Passport Technology lessons.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/ip_diagrams.py

Writes SVG files into `frontend/public/lesson-media/`, which is where every
other drawn lesson figure in the product lives and is served from. Lessons
reference them as `/lesson-media/<slug>.svg`.

Drawn rather than hotlinked. The twelve IT Passport lessons that existed
before point `imageKey` at third-party blogs and CDNs, which is fragile -- the
image disappears when someone reorganises their site -- and is a copyright
question nobody answered. A figure drawn here is correct, stable, styled like
the rest of the product, and ours.

Uses `topcit_expansion.diagram_kit`, the same kit the TOPCIT figures use, so
the line weights, palette and text wrapping match.
"""

import os
import sys

sys.path.insert(0, "/app/scripts/topcit_expansion")

import diagram_kit as dk  # noqa: E402

OUTPUT_DIR = "/app/../frontend/public/lesson-media"
PUBLIC_PATH = "/lesson-media/%s.svg"


def _radix_places():
    return dk.table(
        "Place value in four radixes",
        ["Radix", "Places (high to low)", "1011 means"],
        [["Binary (2)", "8  4  2  1", "8 + 2 + 1 = 11"],
         ["Octal (8)", "512  64  8  1", "512 + 8 + 1 = 521"],
         ["Decimal (10)", "1000  100  10  1", "1011"],
         ["Hex (16)", "4096  256  16  1", "4096 + 16 + 1 = 4113"]],
        caption="The same digits mean different values in different radixes.",
    )


def _twos_complement():
    return dk.flow(
        "Forming -5 in eight-bit two's complement",
        [("Write +5", "0000 0101"),
         ("Invert every bit", "1111 1010"),
         ("Add one", "1111 1011"),
         ("Read the sign", "Leading 1 = negative")],
        caption="The leading bit carries a negative place value, so no sign symbol is needed.",
    )


def _logic_gates():
    return dk.compare(
        "What each logic operation answers",
        [("AND", "mask bits off", ["True only when BOTH inputs are true",
                                   "1 AND 1 = 1; every other pair gives 0",
                                   "Used to clear selected bits"]),
         ("OR", "switch bits on", ["True when EITHER input is true",
                                   "0 OR 0 = 0; every other pair gives 1",
                                   "Used to set selected bits"]),
         ("XOR", "detect a difference", ["True only when the inputs DIFFER",
                                         "Applying it twice restores the original",
                                         "Used for parity and simple ciphers"])],
        caption="XOR is the one candidates confuse with OR.",
    )


def _mean_median():
    return dk.compare(
        "Why the average you choose matters",
        [("Mean", "total / count", ["Pulled upward by one large salary",
                                    "Higher than almost everyone earns",
                                    "Use when values are evenly spread"]),
         ("Median", "the middle value", ["Unmoved by the extreme value",
                                         "Describes a typical employee",
                                         "Use when the data is skewed"]),
         ("Mode", "most frequent", ["May not exist usefully",
                                    "Best for categories, not amounts",
                                    "Several values can tie"])],
        caption="Same data, three defensible 'averages', three different stories.",
    )


def _chart_choice():
    return dk.table(
        "Choosing a chart for the question being asked",
        ["Question", "Chart", "Watch for"],
        [["How do categories compare?", "Bar chart", "An axis that does not start at zero"],
         ["How has it changed over time?", "Line graph", "Uneven spacing on the time axis"],
         ["What share is each part?", "Pie chart", "Slices that do not total 100%"],
         ["Do two measures move together?", "Scatter diagram", "Reading cause into correlation"]],
        caption="The chart type decides which comparison the reader can make easily.",
    )


def _digitising():
    return dk.flow(
        "Digitising a continuous signal",
        [("Sample", "Measure the wave at fixed intervals"),
         ("Quantise", "Round each sample to the nearest level"),
         ("Encode", "Store each level as a binary number"),
         ("Result", "Approximate, but copies perfectly")],
        caption="Every digitisation approximates; the gain is exact copying and processing.",
    )


def _compression():
    return dk.compare(
        "Lossless against lossy compression",
        [("Lossless", "nothing is discarded", ["The original is restored exactly",
                                               "Required for programs and archives",
                                               "ZIP, PNG, FLAC"]),
         ("Lossy", "detail is thrown away", ["Discarded detail never comes back",
                                             "Acceptable for photos, music, video",
                                             "JPEG, MP3, MP4"])],
        caption="Re-saving a lossy file compounds the loss each time.",
        footer="Edit in a lossless format; export to a lossy one once.",
    )


def _parity():
    return dk.fields(
        "A parity bit, and what it misses",
        [("Data bits", "1 0 1 1 0 0 1", 7, dk.BLUE),
         ("Parity", "0", 2, dk.TEAL)],
        caption="The parity bit is chosen so the count of 1s is even.",
        footer="One flipped bit makes the count odd and is DETECTED. Two flipped bits "
               "make it even again and are MISSED -- parity detects an odd number of "
               "errors, and corrects none.",
    )


DIAGRAMS = {
    "ip-radix-places": _radix_places,
    "ip-twos-complement": _twos_complement,
    "ip-logic-operations": _logic_gates,
    "ip-mean-median-mode": _mean_median,
    "ip-chart-choice": _chart_choice,
    "ip-digitising": _digitising,
    "ip-compression": _compression,
    "ip-parity-bit": _parity,
}


def main():
    target = os.path.normpath(OUTPUT_DIR)
    os.makedirs(target, exist_ok=True)
    for slug, build in DIAGRAMS.items():
        svg = build()
        path = os.path.join(target, slug + ".svg")
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(svg)
        print("  wrote %-28s %6d bytes" % (slug + ".svg", len(svg)))
    print("\n%d diagrams written to %s" % (len(DIAGRAMS), target))


if __name__ == "__main__":
    main()

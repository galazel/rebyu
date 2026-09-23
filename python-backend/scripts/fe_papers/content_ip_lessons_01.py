"""IT Passport lesson content: Basic Theory (731-737).

Written to the same shape as the twelve lessons the certification already had
-- `lesson_structure` supplies the title, Introduction, Learning Objectives,
Key Terms and Summary, and the body sections here carry the teaching.

These are Technology-field lessons, which the certification had none of, so
there is no existing lesson in the same area to imitate for tone. The
reference point is the IPA syllabus entry for each topic and the level the
real IP paper asks at: concrete, worked where a calculation is involved, and
stopping short of the depth the FE paper would want.
"""

import sys

sys.path.insert(0, "/app/scripts/fe_expansion")

from builders import (  # noqa: E402
    accordion, compare_grid, content_tabs, desc, flip_cards, image,
    image_text, lesson_structure, media_text, ol, review_cards, sub, table,
    tabs, ul,
)

#: Drawn for these lessons by `ip_diagrams.py` and served from
#: frontend/public/lesson-media. Drawn rather than hotlinked: the twelve
#: pre-existing IT Passport lessons point at third-party blogs, which break
#: when someone reorganises a site and were never cleared for reuse.
FIG = "/lesson-media/%s.svg"

CERTIFICATION_ID = 4

LESSONS = {}


# ---------------------------------------------------------------- 731 discrete
LESSONS[731] = lesson_structure(
    name="Discrete mathematics",
    intro=(
        "Computers store everything -- numbers, text, pictures, sound -- as patterns "
        "of two symbols. This lesson covers how those patterns are written and read: "
        "the radixes a value can be expressed in, how negative numbers and fractions "
        "are represented, and the logic operations that combine bits. These are the "
        "foundations the rest of the Technology field rests on, and the IT Passport "
        "examination asks about them directly."
    ),
    objectives=[
        "Convert whole numbers between binary, octal, decimal and hexadecimal.",
        "Explain why binary is the radix computers use.",
        "Describe how negative integers are represented in two's complement.",
        "Apply the AND, OR, NOT and XOR operations to bit patterns.",
        "Recognise where rounding error comes from in a stored fraction.",
        "Use set and logic notation to describe simple conditions.",
    ],
    minutes=45,
    sections=[
        ("Why computers count in twos", [
            desc(
                "A digital circuit distinguishes two states reliably: current flowing or "
                "not, a voltage above a threshold or below it. Distinguishing ten states "
                "would demand ten voltage bands and tolerate far less noise, so binary is "
                "chosen for engineering reasons rather than mathematical ones."
            ),
            desc(
                "One binary digit is a bit. Eight bits make a byte, which is the smallest "
                "unit most systems address individually. Because each added bit doubles "
                "the range, n bits distinguish 2^n different values -- 8 bits give 256, "
                "16 bits give 65,536."
            ),
            table(
                ["Bits", "Distinct values", "Unsigned range"],
                [["4", "16", "0 to 15"],
                 ["8", "256", "0 to 255"],
                 ["16", "65,536", "0 to 65,535"],
                 ["32", "4,294,967,296", "0 to about 4.29 billion"]],
                caption="Each additional bit doubles what can be represented.",
            ),
        ]),
        ("Radix and place value", [
            desc(
                "A radix, or base, is how many symbols a numbering system uses. Decimal "
                "uses ten (0-9), binary two (0-1), octal eight (0-7) and hexadecimal "
                "sixteen (0-9 then A-F). In every one of them a digit's value depends on "
                "its position, and each position is worth the radix times the one to its "
                "right."
            ),
            image(FIG % "ip-radix-places"),
            sub("Reading a binary number"),
            desc(
                "The binary number 1011 has place values 8, 4, 2 and 1 from the left. "
                "Only the positions holding a 1 contribute, so the value is 8 + 2 + 1 = "
                "11 in decimal."
            ),
            sub("Why hexadecimal appears everywhere"),
            desc(
                "Hexadecimal is not a third way of counting so much as a shorthand for "
                "binary. Exactly four bits fit in one hex digit, so a byte is always two "
                "hex digits -- 1111 1010 is FA. That is why colour codes, memory "
                "addresses and MAC addresses are written in hex: it is binary that a "
                "person can read aloud."
            ),
        ]),
        ("Converting between radixes", [
            sub("Binary to decimal"),
            ol([
                "Write the place value above each bit, doubling from right to left.",
                "Add the place values wherever the bit is 1.",
                "The total is the decimal value.",
            ]),
            sub("Decimal to binary"),
            ol([
                "Divide the number by 2 and record the remainder.",
                "Repeat with the quotient until it reaches 0.",
                "Read the remainders bottom to top.",
            ]),
            desc(
                "Converting 13: 13/2 = 6 remainder 1, 6/2 = 3 remainder 0, 3/2 = 1 "
                "remainder 1, 1/2 = 0 remainder 1. Read upward, that is 1101 -- and "
                "checking, 8 + 4 + 1 = 13."
            ),
            sub("Binary to hexadecimal"),
            desc(
                "Group the bits into fours from the RIGHT, padding the left group with "
                "zeros if it is short, then replace each group with its hex digit. "
                "Grouping from the left instead is the usual mistake and it changes the "
                "value."
            ),
            table(
                ["Binary", "Hex", "Decimal"],
                [["0000", "0", "0"], ["0101", "5", "5"], ["1001", "9", "9"],
                 ["1010", "A", "10"], ["1100", "C", "12"], ["1111", "F", "15"]],
                caption="Every four-bit group maps to exactly one hex digit.",
            ),
        ]),
        ("Representing negative numbers", [
            desc(
                "With only two symbols there is no minus sign to write, so the sign has "
                "to live in the bits. The representation in universal use is two's "
                "complement, in which the leftmost bit carries a negative place value."
            ),
            ol([
                "Write the positive value in binary.",
                "Invert every bit.",
                "Add one to the result.",
            ]),
            desc(
                "For -5 in eight bits: 5 is 0000 0101, inverting gives 1111 1010, adding "
                "one gives 1111 1011. A leading 1 always means the value is negative."
            ),
            image_text(
                FIG % "ip-twos-complement",
                "Three steps, and a sign you can read at a glance",
                "Invert and add one is the whole procedure. Reading it back is even "
                "quicker: if the leftmost bit is 1 the value is negative, without any "
                "arithmetic at all.",
                side="right"),
            desc(
                "Two's complement is used because subtraction becomes addition: the "
                "same adder circuit handles both, and there is only one pattern for "
                "zero. The cost is an asymmetric range -- eight bits hold -128 to +127, "
                "one more negative value than positive."
            ),
        ]),
        ("Fractions and rounding error", [
            desc(
                "Binary fractions work the same way as whole numbers, with place values "
                "of 1/2, 1/4, 1/8 to the right of the point. The difficulty is that "
                "many decimal fractions have no exact binary form."
            ),
            desc(
                "0.1 in binary is 0.0001100110011... repeating forever. Stored in a "
                "fixed number of bits it must be cut short, so the stored value is very "
                "slightly wrong. Add it ten times and the total is not exactly 1."
            ),
            desc(
                "This is why money is usually held in whole units -- cents rather than "
                "dollars -- or in a decimal type, and why two floating-point values "
                "should be compared for closeness rather than exact equality."
            ),
        ]),
        ("Logic operations on bits", [
            desc(
                "Logic operations combine bits position by position. They are the "
                "arithmetic of conditions, and they appear in everything from subnet "
                "masks to permission flags."
            ),
            table(
                ["A", "B", "A AND B", "A OR B", "A XOR B", "NOT A"],
                [["0", "0", "0", "0", "0", "1"],
                 ["0", "1", "0", "1", "1", "1"],
                 ["1", "0", "0", "1", "1", "0"],
                 ["1", "1", "1", "1", "0", "0"]],
                caption="The truth table for the four operations the examination uses.",
            ),
            ul([
                "AND is 1 only when both inputs are 1 -- used to mask bits off.",
                "OR is 1 when either input is 1 -- used to switch bits on.",
                "XOR is 1 only when the inputs DIFFER -- used for parity and for simple ciphers.",
                "NOT inverts a single input.",
            ]),
            image(FIG % "ip-logic-operations"),
            desc(
                "XOR has a property worth remembering: applying the same value twice "
                "returns the original. That is why it appears in both error checking "
                "and elementary encryption."
            ),
            review_cards(
                "Check yourself",
                "Work each one out before reading the answer.",
                [("1011 in decimal?", "11", "8 + 2 + 1; the 4 place holds a 0."),
                 ("Decimal 13 in binary?", "1101", "Divide by two repeatedly and read the remainders upward."),
                 ("-3 in eight-bit two's complement?", "1111 1101",
                  "0000 0011, invert to 1111 1100, add one."),
                 ("1100 XOR 1010?", "0110", "1 only where the bits differ.")],
            ),
        ]),
        ("Worked conversions", [
            desc(
                "Four conversions, each shown the way the examination expects them to "
                "be done under time pressure."
            ),
            content_tabs(
                "Work through each one",
                "Cover the answer, attempt it, then check the method rather than only the result.",
                [("1101 to decimal", "Binary to decimal",
                  "Place values 8 4 2 1. The 4 place is 0, so 8 + 4 + 1 = 13."),
                 ("25 to binary", "Decimal to binary",
                  "25/2=12 r1, 12/2=6 r0, 6/2=3 r0, 3/2=1 r1, 1/2=0 r1. Upward: 11001."),
                 ("1010 1100 to hex", "Binary to hexadecimal",
                  "Group from the right: 1010 and 1100, which are A and C, so AC."),
                 ("2F to decimal", "Hexadecimal to decimal",
                  "2 x 16 + 15 = 47. F is 15, and the 2 sits in the sixteens place.")],
            ),
        ]),
        ("Sets and simple probability", [
            desc(
                "Set notation describes groups and how they overlap, and the "
                "examination uses it for search conditions and for counting problems."
            ),
            ul([
                "Union (OR) -- everything in either set.",
                "Intersection (AND) -- only what is in both.",
                "Difference (NOT) -- what is in one set and not the other.",
            ]),
            desc(
                "A search for \"Sapporo OR Hakodate\" AND \"Japanese restaurant\" is set "
                "notation in plain sight: the union of two cities, intersected with a "
                "category. Reading the brackets in the right order is what the question "
                "actually tests."
            ),
            desc(
                "Probability questions at this level are counting: the probability of an "
                "outcome is the number of ways it can happen divided by the total number "
                "of equally likely outcomes."
            ),
        ]),
        ("Units and quantities", [
            desc(
                "Data sizes and times use standard prefixes, and the examination expects "
                "them to be converted without hesitation."
            ),
            table(
                ["Prefix", "Symbol", "Factor", "Typical use"],
                [["kilo", "k", "10^3", "kilobyte, kbit/s"],
                 ["mega", "M", "10^6", "megabyte, MHz"],
                 ["giga", "G", "10^9", "gigabyte, GHz"],
                 ["tera", "T", "10^12", "terabyte"],
                 ["milli", "m", "10^-3", "millisecond"],
                 ["micro", "u", "10^-6", "microsecond"],
                 ["nano", "n", "10^-9", "nanosecond"]],
            ),
            desc(
                "Storage is sometimes counted in powers of two instead: 1 KB may mean "
                "1,024 bytes rather than 1,000. A question that says \"1 MB = 1,024 kB\" "
                "is telling you which convention to use, and it is saying so because it "
                "changes the answer."
            ),
        ]),
        ("Recall practice", [
            desc("Cover the back of each card before turning it over."),
            flip_cards([
                ("How many values do 8 bits hold?", "256",
                 "2^8. The unsigned range is 0 to 255, because zero takes one of them."),
                ("Why is hexadecimal used?", "One hex digit is exactly four bits",
                 "It makes binary readable without changing what it means."),
                ("Which operation is true only when inputs differ?", "XOR",
                 "OR is also true when both are true; XOR is not."),
                ("Why can 0.1 not be stored exactly?", "Its binary expansion repeats",
                 "It must be truncated, so repeated addition drifts from the expected total."),
            ]),
        ]),
    ],
    key_terms=[
        ("Radix (base)", "How many distinct symbols a numbering system uses -- 2 for binary, 16 for hexadecimal."),
        ("Bit", "One binary digit, holding 0 or 1. Eight bits make a byte."),
        ("Two's complement", "The standard representation for signed integers; invert the bits of the positive value and add one."),
        ("XOR", "Exclusive OR: true only when the two inputs differ. Applying it twice restores the original value."),
        ("Floating point", "A representation for fractions that trades exactness for range, which is why 0.1 cannot be stored precisely."),
        ("Set", "A collection of items; union, intersection and difference correspond to OR, AND and NOT."),
    ],
    summary=(
        "Computers represent every value as bits because two states can be "
        "distinguished reliably in hardware. Positional notation lets the same value "
        "be written in binary, octal, decimal or hexadecimal, and hexadecimal is "
        "used as readable shorthand for binary. Negative integers use two's "
        "complement so that subtraction reuses the addition circuit, and fractions "
        "are approximated, which is the origin of rounding error. Logic operations "
        "combine bits position by position and underpin masking, parity and simple "
        "encryption."
    ),
    exam_notes=[
        desc(
            "Conversion questions are worth practising until they are automatic -- they "
            "are quick marks. Expect at least one item on two's complement and one that "
            "turns on whether 1 KB means 1,000 or 1,024 bytes; the question always "
            "states which, and the statement is there because it matters."
        ),
        ul([
            "Group bits from the RIGHT when converting to hexadecimal.",
            "A leading 1 in two's complement means the value is negative.",
            "XOR, not OR, is the one that is false when both inputs are true.",
        ]),
    ],
)


# ---------------------------------------------------------------- 732 applied
LESSONS[732] = lesson_structure(
    name="Applied mathematics",
    intro=(
        "Business decisions are made from numbers, and the IT Passport examination "
        "expects you to read them correctly. This lesson covers the statistics used "
        "to summarise data, the probability used to weigh uncertain outcomes, and the "
        "graphs and charts that present both -- including the ways a chart can mislead."
    ),
    objectives=[
        "Calculate and distinguish the mean, median and mode.",
        "Describe what a standard deviation says about a set of values.",
        "Work out the probability of simple combined events.",
        "Choose the chart type that suits a given question.",
        "Interpret a correlation without assuming causation.",
        "Apply expected value to a decision under uncertainty.",
    ],
    minutes=45,
    sections=[
        ("Summarising a set of values", [
            desc(
                "Three different numbers are all called an average, and they answer "
                "different questions. Choosing the wrong one is the commonest way to "
                "mislead with a true statistic."
            ),
            table(
                ["Measure", "What it is", "When it misleads"],
                [["Mean", "The total divided by the count",
                  "A few extreme values drag it away from the typical case"],
                 ["Median", "The middle value when sorted",
                  "Ignores how far away the extremes are"],
                 ["Mode", "The most frequently occurring value",
                  "There may be several, or none useful"]],
            ),
            image(FIG % "ip-mean-median-mode"),
            desc(
                "For salaries in a small company where one director earns ten times the "
                "rest, the mean is higher than almost everybody's pay. The median "
                "answers \"what does a typical employee earn\" far better."
            ),
        ]),
        ("Spread and standard deviation", [
            desc(
                "Two sets of values can share a mean and be nothing alike. The spread "
                "says how tightly the values cluster around it."
            ),
            desc(
                "A small standard deviation means most values sit close to the mean; a "
                "large one means they are scattered. For a response time, a low mean "
                "with a large deviation describes a system that is usually fast and "
                "occasionally terrible -- which users notice far more than the average."
            ),
            ul([
                "Range -- the simplest measure: highest minus lowest.",
                "Standard deviation -- the typical distance from the mean.",
                "Both are needed alongside an average, never instead of one.",
            ]),
        ]),
        ("Probability", [
            desc(
                "A probability is a number from 0 (impossible) to 1 (certain), and at "
                "this level it is found by counting: favourable outcomes divided by all "
                "equally likely outcomes."
            ),
            sub("Combining probabilities"),
            ul([
                "Independent events happening together -- MULTIPLY the probabilities.",
                "Mutually exclusive alternatives -- ADD the probabilities.",
                "The chance something does NOT happen -- subtract from 1.",
            ]),
            desc(
                "Two fair coins both landing heads is 1/2 x 1/2 = 1/4. At least one "
                "head is easier the other way round: the only excluded case is two "
                "tails, so it is 1 - 1/4 = 3/4."
            ),
        ]),
        ("Expected value", [
            desc(
                "Expected value multiplies each outcome by its probability and adds the "
                "results. It converts an uncertain situation into a single number that "
                "can be compared with another."
            ),
            desc(
                "A risk with a 20% chance of costing 500,000 has an expected cost of "
                "100,000. That figure is what a control against it can reasonably be "
                "compared with -- while remembering no single occurrence ever costs the "
                "expected value; it costs nothing or the full amount."
            ),
        ]),
        ("Choosing a chart", [
            desc(
                "A chart is an argument about data, and the type chosen decides which "
                "comparison the reader can make easily."
            ),
            tabs([
                ("Bar chart", "Comparing quantities across categories",
                 "Lengths are easy to compare precisely. Start the axis at zero -- "
                 "cutting it exaggerates small differences, which is the most common "
                 "way a chart deceives."),
                ("Line graph", "Change over time",
                 "The slope carries the meaning, so the horizontal axis must be evenly "
                 "spaced in time."),
                ("Pie chart", "Parts of a single whole",
                 "Only works when the slices total 100% and there are few of them; "
                 "angles are hard to compare, so a bar chart is usually clearer."),
                ("Scatter diagram", "Relationship between two variables",
                 "Each point is one observation measured twice. Shows correlation, "
                 "never causation."),
            ]),
            media_text(
                FIG % "ip-chart-choice",
                "Match the chart to the question",
                "Before choosing a chart, say out loud what the reader should be able "
                "to compare. The answer names the chart.",
                "The most common mistake",
                "A bar chart whose axis does not start at zero. The bars still differ "
                "correctly in value, but the eye compares their LENGTHS, and those now "
                "exaggerate the difference.",
                layout="image-right"),
        ]),
        ("Correlation is not causation", [
            desc(
                "A scatter diagram may show that two quantities rise together. That is "
                "correlation. It does not establish that one causes the other, and the "
                "examination tests this distinction deliberately."
            ),
            ul([
                "The relationship may run the other way round.",
                "A third factor may drive both -- ice cream sales and sunburn both follow hot weather.",
                "With enough variables, some will correlate by chance alone.",
            ]),
        ]),
        ("Charts used in quality and management", [
            desc(
                "Several charts appear in the management topics and are worth knowing by "
                "the shape of their answer."
            ),
            accordion([
                ("Pareto chart",
                 "Bars ordered by frequency with a cumulative line. Shows the few causes "
                 "responsible for most of the problem, so effort can be aimed at them."),
                ("Fishbone (Ishikawa) diagram",
                 "Candidate causes grouped as branches off a spine pointing at the "
                 "effect. Structures a cause hunt; proves nothing on its own."),
                ("Control chart",
                 "Measurements over time between control limits. Separates ordinary "
                 "variation from a special cause worth investigating."),
                ("Histogram",
                 "How often values fall into each range. Shows the shape of a "
                 "distribution, which an average alone hides."),
                ("Radar chart",
                 "Several measures on axes from a common centre. Compares a profile "
                 "across dimensions rather than a single quantity."),
            ]),
        ]),
        ("Recall practice", [
            desc("Answer each before turning the card."),
            flip_cards([
                ("Mean, median or mode for skewed salaries?", "Median",
                 "The mean is dragged up by the few very high values."),
                ("Two independent events both happening?", "Multiply",
                 "Add only when the events are mutually exclusive alternatives."),
                ("Chance of at least one head in two tosses?", "3/4",
                 "Easier as 1 minus the chance of no heads, which is 1/4."),
                ("What does a scatter diagram prove?", "Correlation only",
                 "A third factor may drive both variables, or the causation may run the other way."),
            ]),
        ]),
        ("Reading a table of figures", [
            desc(
                "Many examination questions present a small table and ask for one "
                "derived number. The arithmetic is never hard; the care is in reading "
                "which row and column the question means."
            ),
            ol([
                "Read the question before the table, so you know what to look for.",
                "Check the units and any note about them.",
                "Identify the row and column that matter and ignore the rest.",
                "Calculate, then sanity-check the magnitude against the options.",
            ]),
        ]),
    ],
    key_terms=[
        ("Mean", "The arithmetic average; sensitive to extreme values."),
        ("Median", "The middle value when the data is sorted; resistant to extremes."),
        ("Mode", "The most frequently occurring value."),
        ("Standard deviation", "A measure of how far values typically sit from the mean."),
        ("Expected value", "Each outcome multiplied by its probability, summed."),
        ("Correlation", "A relationship between two variables; not evidence of cause."),
    ],
    summary=(
        "Mean, median and mode summarise a set of values differently and are chosen "
        "according to what the data looks like, with spread reported alongside. "
        "Probabilities multiply for independent events and add for exclusive ones, "
        "and expected value reduces an uncertain outcome to a comparable number. "
        "Chart type decides which comparison a reader can make, a truncated axis "
        "exaggerates differences, and a correlation never by itself establishes a "
        "cause."
    ),
    exam_notes=[
        desc(
            "Expect a question where the mean and median differ and the right answer "
            "turns on which is appropriate, and at least one chart question where the "
            "distractors are plausible chart types for a different purpose."
        ),
        ul([
            "Multiply for 'both happen', add for 'either happens'.",
            "'At least one' is usually easiest as 1 minus the chance of none.",
            "A scatter diagram shows correlation; it never shows causation.",
        ]),
    ],
)


# ---------------------------------------------------------------- 733 information
LESSONS[733] = lesson_structure(
    name="Theory of information",
    intro=(
        "Everything a computer stores must first be turned into numbers. This lesson "
        "covers how characters, images, sound and colour are encoded, how compression "
        "makes them smaller, and how errors in stored or transmitted data are detected. "
        "It explains why a file has the size it does and why some formats lose quality."
    ),
    objectives=[
        "Explain how characters are represented by character codes.",
        "Describe the difference between lossy and lossless compression.",
        "Calculate the size of a simple image or audio file.",
        "Explain how a parity bit detects an error and what it misses.",
        "Distinguish analogue from digital representation.",
        "Identify common file formats and what each suits.",
    ],
    minutes=45,
    sections=[
        ("Analogue and digital", [
            desc(
                "An analogue quantity varies continuously -- the angle of a clock hand, "
                "a voltage, the pressure of a sound wave. A digital representation uses "
                "discrete values, so it must sample the original at intervals and round "
                "each sample to the nearest available level."
            ),
            desc(
                "Digitising therefore always approximates. The compensation is that "
                "digital data can be copied perfectly, checked for errors and processed "
                "by a computer, none of which is true of an analogue signal that "
                "degrades a little with every copy."
            ),
            image(FIG % "ip-digitising"),
            compare_grid(
                "Analogue against digital",
                "The trade that every recording, photograph and telephone call makes.",
                [("Analogue",
                  "Continuous; captures every gradation, but noise accumulates with each "
                  "copy and it cannot be processed directly."),
                 ("Digital",
                  "Discrete samples; approximates the original, but copies are exact and "
                  "the data can be compressed, checked and computed on.")],
            ),
        ]),
        ("Character codes", [
            desc(
                "A character code assigns a number to each character. Text is stored as "
                "those numbers, and two systems must agree on the code or the text "
                "arrives as nonsense."
            ),
            table(
                ["Code", "Covers", "Notes"],
                [["ASCII", "English letters, digits, punctuation", "7 bits, 128 characters"],
                 ["Shift-JIS", "Japanese", "An older encoding still found in legacy files"],
                 ["EUC", "Japanese and other East Asian scripts", "Common on older Unix systems"],
                 ["Unicode (UTF-8)", "Essentially every script in use", "Variable width; ASCII-compatible"]],
                caption="Garbled text is almost always a disagreement about which of these is in use.",
            ),
        ]),
        ("How images are stored", [
            desc(
                "A bitmap image is a grid of pixels, each holding a colour. The file "
                "size follows directly from the number of pixels and the bits per pixel."
            ),
            desc(
                "Size in bits = width x height x bits per pixel. A 1,000 by 800 image at "
                "24 bits per pixel is 1,000 x 800 x 24 = 19,200,000 bits, which is "
                "2,400,000 bytes, or roughly 2.4 MB before any compression."
            ),
            sub("Colour depth"),
            ul([
                "1 bit -- two colours.",
                "8 bits -- 256 colours.",
                "24 bits -- about 16.7 million colours, eight bits each for red, green and blue.",
            ]),
            sub("Raster and vector"),
            desc(
                "A raster image stores pixels and becomes blocky when enlarged. A vector "
                "image stores shapes and their coordinates, so it can be scaled to any "
                "size without loss -- which is why logos and diagrams are drawn as "
                "vectors and photographs are not."
            ),
        ]),
        ("How sound is stored", [
            desc(
                "Sound is digitised by sampling the wave many times a second and "
                "recording each sample's amplitude. Two settings decide the fidelity "
                "and the size: the sampling rate and the bit depth."
            ),
            desc(
                "Size = sampling rate x bit depth x channels x seconds. One second of "
                "CD-quality audio is 44,100 x 16 x 2 = 1,411,200 bits, about 176 KB -- "
                "which is why uncompressed audio files are large."
            ),
        ]),
        ("Compression", [
            desc(
                "Compression reduces size by removing redundancy. Which kind is "
                "acceptable depends entirely on what the data is."
            ),
            compare_grid(
                "Lossless against lossy",
                "The question is whether the discarded information is ever needed again.",
                [("Lossless",
                  "The original is recovered exactly. Required for programs, documents, "
                  "spreadsheets and archives. Formats: ZIP, PNG, FLAC."),
                 ("Lossy",
                  "Detail judged imperceptible is discarded and cannot be recovered. "
                  "Acceptable for photographs, music and video. Formats: JPEG, MP3, MP4.")],
            ),
            image_text(
                FIG % "ip-compression",
                "Which loss is acceptable?",
                "The question is never which is better. It is whether the discarded "
                "information will ever be needed again -- and for a program, a "
                "spreadsheet or an archive, the answer is always yes.",
                side="left"),
            desc(
                "Re-saving a lossy file repeatedly compounds the loss, because each save "
                "discards detail from an already-degraded copy. Editing should be done "
                "in a lossless format and exported to a lossy one once."
            ),
        ]),
        ("Common file formats", [
            accordion([
                ("JPEG", "Lossy, for photographs. Small files, but poor for sharp edges and text."),
                ("PNG", "Lossless, supports transparency. Suits screenshots, logos and line art."),
                ("GIF", "256 colours, supports simple animation. Largely superseded for still images."),
                ("MP3 / AAC", "Lossy audio. Sized by bit rate, which trades quality against space."),
                ("MP4", "A container for compressed video and audio together."),
                ("PDF", "Preserves layout across devices; intended for reading and printing rather than editing."),
                ("CSV", "Plain text, one record per line, fields separated by commas. Exchanged easily; holds no formatting."),
            ]),
        ]),
        ("Detecting errors", [
            desc(
                "Data can be corrupted in storage or in transit. A check digit or parity "
                "bit adds redundancy so that corruption is noticed rather than silently "
                "accepted."
            ),
            desc(
                "A parity bit is set so the total number of 1s is even (or odd, by "
                "agreement). If one bit flips, the count no longer matches and the error "
                "is detected. If TWO bits flip, the count matches again and the error "
                "passes unnoticed -- parity detects an odd number of errors only, and "
                "corrects none."
            ),
            image(FIG % "ip-parity-bit"),
            ul([
                "Parity bit -- detects a single bit error; cheap, and limited.",
                "Check digit -- a digit computed from the others, catching typing errors in codes and account numbers.",
                "Checksum / hash -- a value computed over a whole file, used to confirm a download arrived intact.",
            ]),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Size of a 100x200 image at 24 bits per pixel?", "About 60 KB",
                 "100 x 200 x 24 = 480,000 bits = 60,000 bytes, before compression."),
                ("Which format for a screenshot with text?", "PNG",
                 "Lossless, so the text edges stay sharp; JPEG blurs them."),
                ("Two bits flip in a parity-checked byte", "The error is missed",
                 "The count of 1s is even again, so parity is satisfied."),
                ("Why is re-saving a JPEG repeatedly bad?", "Loss compounds",
                 "Each save discards detail from an already-degraded copy."),
            ]),
        ]),
        ("Information as a quantity", [
            desc(
                "Information can be measured. A choice between two equally likely "
                "options carries one bit; between four, two bits. This is why n bits "
                "distinguish 2^n possibilities, and it sets a floor on how far data can "
                "be compressed."
            ),
            desc(
                "Data becomes information when it is given context, and information "
                "becomes knowledge when it is combined with experience and used to act. "
                "The figure 38 is data; '38 degrees, patient temperature' is information."
            ),
        ]),
    ],
    key_terms=[
        ("Character code", "A mapping from characters to numbers, such as ASCII or Unicode."),
        ("Pixel", "One dot of a bitmap image; colour depth is the bits used per pixel."),
        ("Sampling rate", "How many times per second an analogue signal is measured when digitising."),
        ("Lossless compression", "Reduces size while allowing the original to be restored exactly."),
        ("Lossy compression", "Discards detail permanently in exchange for a smaller file."),
        ("Parity bit", "An extra bit making the count of 1s even or odd, detecting a single-bit error."),
    ],
    summary=(
        "Digitising approximates a continuous signal in exchange for data that copies "
        "perfectly and can be processed. Characters are stored through an agreed "
        "character code, images as pixels with a colour depth, and sound as samples "
        "with a rate and bit depth -- each giving a file size that can be calculated "
        "directly. Compression is lossless where the original must be recoverable and "
        "lossy where some detail can be sacrificed, and parity or checksums add "
        "redundancy so corruption is detected."
    ),
    exam_notes=[
        desc(
            "File-size calculations appear regularly and are straightforward once the "
            "formula is remembered: multiply the dimensions by the bits per unit, then "
            "convert bits to bytes by dividing by eight."
        ),
        ul([
            "A parity bit detects an ODD number of flipped bits and corrects nothing.",
            "Lossy compression is unacceptable for programs, documents and archives.",
            "Vector images scale without loss; raster images do not.",
        ]),
    ],
)

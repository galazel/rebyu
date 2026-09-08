"""Drawn figures for the FE lessons, and the path helper that references them.

Every picture in this curriculum is an SVG generated here and shipped from
`frontend/public/lesson-media/`. None is hotlinked. The TOPCIT bank tried
hotlinking first and all 37 of its figures eventually 403'd, which cost a
whole repair pass -- searching for replacements only moves the problem, since
the next host can withdraw just as easily and a keyword search will cheerfully
return something that merely shares a word with the topic.

Drawing them removes all of it at once: the figures cannot rot, need no
attribution, and are guaranteed to depict the thing the section is about,
because we decide what they contain.

The primitives come from `topcit_expansion.diagram_kit` rather than being
rewritten -- it already draws in the REBYU palette, and a second kit would
mean FE figures that sit visibly differently on the page from TOPCIT's.

`fig("radix-positional")` returns the path a lesson block should carry, and
raises if no figure of that slug is registered, so a typo in a content module
fails at import rather than shipping a broken image to a learner.
"""

import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(_HERE), "topcit_expansion"))

import diagram_kit as dk  # noqa: E402

#: Prefixed so FE figures never collide with the TOPCIT ones already in the
#: same public directory.
PREFIX = "fe-"
PUBLIC_PATH = "/lesson-media/%s%s.svg"

FIGURES = {}


def register(slug, svg):
    if slug in FIGURES:
        raise ValueError("duplicate figure slug %r" % slug)
    FIGURES[slug] = svg
    return slug


def fig(slug):
    """The public path for a registered figure. Raises on an unknown slug."""
    if slug not in FIGURES:
        raise KeyError("no figure %r registered in figures.py" % slug)
    return PUBLIC_PATH % (PREFIX, slug)


# --------------------------------------------------------- overflow guard
#
# `fields` draws its segment labels as single-line text at a fixed position and
# does NOT wrap, so an over-long label silently runs under the neighbouring
# segment. That is invisible in the generated markup and shows up only in the
# rendered figure, which nobody opens for ninety-five lessons -- so it is
# measured here and fails at import instead.
#
# There is deliberately no equivalent guard for `diagram_kit.table`. Nothing in
# this curriculum draws a table as an SVG any more: the lesson renderer gained
# a real `table` block, and real table markup is selectable, searchable,
# reflows to the reader's font size and scrolls sensibly on a phone, none of
# which a picture of a table does. Tabular material uses `builders.table`.
#
# The width estimate is deliberately crude. These are system-font sans labels
# at 12-13.5px, where an average glyph is close to 0.55em; a real measurement
# would need a font engine, and the point is only to catch the label that is
# obviously too long, not to typeset.

_CHAR_EM = 0.56


def _text_width(body, size):
    return len(str(body)) * size * _CHAR_EM


def fields(title, segments, caption=None, footer=None):
    """`diagram_kit.fields`, with the segment labels measured against them."""
    total = dk.WIDTH - 56
    units = sum(weight for _n, _s, weight, _c in segments)
    for name, sample, weight, _colour in segments:
        width = total * weight / units
        if _text_width(name, 12) > width - 8:
            raise ValueError("fields %r: label %r overflows its %.0fpx segment"
                             % (title, name, width))
        if _text_width(sample, 13.5) > width - 8:
            raise ValueError("fields %r: sample %r overflows its %.0fpx segment"
                             % (title, sample, width))
    return dk.fields(title, segments, caption, footer)


# ====================================================================
# Basic Theory -> Basic Theory
# ====================================================================

register("radix-conversion", dk.flow(
    "Converting decimal 45 to binary by repeated division",
    [("45 / 2", "= 22 r 1"),
     ("22 / 2", "= 11 r 0"),
     ("11 / 2", "= 5 r 1"),
     ("5 / 2", "= 2 r 1"),
     ("2 / 2", "= 1 r 0"),
     ("1 / 2", "= 0 r 1")],
    caption="Divide by the target base; the remainders are the digits.",
    note="Read the remainders BOTTOM to TOP: 101101. Reading them the other "
         "way gives 101101 reversed, which is the single most common slip."))

register("twos-complement", dk.flow(
    "Forming -5 in two's complement, 8 bits",
    [("+5", "0000 0101"),
     ("Invert every bit", "1111 1010"),
     ("Add 1", "1111 1011"),
     ("-5", "1111 1011")],
    caption="One rule, and it works in both directions.",
    note="Applying the same two steps to 1111 1011 returns 0000 0101, so the "
         "procedure is its own inverse. The leading bit is the sign."))

# The sign field is one bit of thirty-two, so a proportional segment for it is
# about 26px wide -- too narrow for any real label, which is why the field
# names here are single letters and the expansion lives in the footer. Naming
# them in full inside the boxes overflows into the neighbouring segment.
register("float-layout", fields(
    "IEEE 754 single precision: 32 bits, three fields",
    [("S", "1", 1, dk.RED),
     ("Exponent", "8 bits", 8, dk.ORANGE),
     ("Mantissa (fraction)", "23 bits", 23, dk.BLUE)],
    caption="Value = (-1)^sign x 1.mantissa x 2^(exponent - 127)",
    footer="S is the sign bit; the exponent is biased by 127; the mantissa's "
           "leading 1 is implied, giving 24 bits of precision from 23 stored."))

register("float-errors", dk.compare(
    "Three ways floating-point arithmetic loses information",
    [("Cancellation", "significant digits lost",
      ["Subtracting two nearly equal numbers",
       "The leading digits cancel out",
       "What remains is mostly rounding noise",
       "1.000001 - 1.000000 keeps one good digit"]),
     ("Loss of trailing digit", "small value swallowed",
      ["Adding numbers of very different size",
       "The small one is shifted off the end",
       "The result equals the larger operand",
       "Summing a long list worst-to-best"]),
     ("Rounding error", "accumulates silently",
      ["Every operation rounds to the nearest representable value",
       "Errors compound over many operations",
       "0.1 has no exact binary form",
       "Never compare two floats with ="])],
    caption="All three are properties of finite precision, not bugs.",
    footer="The examination asks which effect a given calculation suffers "
           "from, so learn to recognise the shape of each."))

register("shift-operations", dk.compare(
    "Logical shift versus arithmetic shift, on 1011 0000",
    [("Logical shift right", "vacated bits filled with 0",
      ["1011 0000 becomes 0101 1000",
       "Treats the pattern as unsigned",
       "The sign bit is destroyed",
       "Use for bit fields and flags"]),
     ("Arithmetic shift right", "sign bit is replicated",
      ["1011 0000 becomes 1101 1000",
       "Treats the pattern as a signed number",
       "Preserves the sign, so -80 stays negative",
       "Right shift by n divides by 2^n"])],
    caption="Left shifts are identical; the difference is only on the right.",
    footer="Shifting left by n multiplies by 2^n until a significant bit is "
           "pushed off the top, at which point the result is simply wrong."))

register("de-morgan", dk.split_planes(
    "De Morgan's laws: negation turns the operator over",
    ("not (A . B)", "Not both of them", [
        ("equals", "the law"),
        ("(not A) + (not B)", "at least one is false"),
        ("NAND becomes OR of negations", "operator flips")]),
    ("not (A + B)", "Neither of them", [
        ("equals", "the law"),
        ("(not A) . (not B)", "both are false"),
        ("NOR becomes AND of negations", "operator flips")]),
    caption="Push the negation inward and the operator inverts.",
    footer="This is the rule behind rewriting a condition such as "
           "not (x > 0 and y > 0) as x <= 0 or y <= 0."))

register("set-operations", dk.compare(
    "Set operations and the propositions they correspond to",
    [("Union  A u B", "logical sum",
      ["Every element in A, in B, or in both",
       "Corresponds to OR",
       "|A u B| = |A| + |B| - |A n B|"]),
     ("Intersection  A n B", "logical product",
      ["Only the elements in both",
       "Corresponds to AND",
       "Empty when the sets are disjoint"]),
     ("Complement  not A", "negation",
      ["Everything in the universal set that is not in A",
       "Corresponds to NOT",
       "not (not A) = A"])],
    caption="Sets and propositional logic are the same algebra twice.",
    footer="Counting a union by adding the two sizes double-counts the "
           "overlap; subtracting the intersection is the inclusion-exclusion "
           "principle, and it is examined."))


# ====================================================================
# Basic Theory -> Basic Theory, lesson 2: applied mathematics
# ====================================================================

register("distributions", dk.compare(
    "The three distributions the syllabus names",
    [("Normal", "the bell curve",
      ["Symmetric about the mean",
       "Describes measurement error and natural variation",
       "About 68% within one standard deviation",
       "About 95% within two"]),
     ("Poisson", "counts in an interval",
      ["Number of events in a fixed window",
       "Arrivals at a server, defects per module",
       "Mean and variance are equal",
       "Discrete, not continuous"]),
     ("Exponential", "waiting times",
      ["Time until the next event",
       "The gap between Poisson arrivals",
       "Memoryless: waiting longer does not help",
       "The service-time model in queueing"])],
    caption="Poisson counts the events; exponential times the gaps between them.",
    footer="These three appear together because a Poisson arrival process has "
           "exponentially distributed inter-arrival times."))

register("queueing-model", dk.flow(
    "The M/M/1 queueing model",
    [("Arrivals", "rate (lambda)"),
     ("Queue", "waiting line"),
     ("Server", "rate (mu)"),
     ("Departures", "served")],
    caption="One server, one queue, random arrivals and random service times.",
    note="Utilisation is lambda / mu. Mean queue length is rho / (1 - rho), so "
         "at 90% utilisation the queue holds nine jobs, and at 95% it holds "
         "nineteen -- the cost of load rises far faster than the load does."))

register("graph-basics", dk.compare(
    "Reading a graph",
    [("Undirected graph", "edges have no direction",
      ["An edge joins two vertices symmetrically",
       "Degree is the number of edges at a vertex",
       "Models a network link or a friendship"]),
     ("Directed graph", "edges have direction",
      ["An arc goes from one vertex to another",
       "In-degree and out-degree differ",
       "Models a dependency or a one-way flow"]),
     ("Weighted graph", "edges carry a cost",
      ["Each edge has a distance, time or price",
       "Shortest path minimises total weight",
       "The basis of routing and of PERT"])],
    caption="The same three ideas underlie routing, scheduling and dependency analysis.",
    footer="An adjacency matrix stores a graph as a table of vertex pairs; an "
           "adjacency list stores each vertex's neighbours and is far smaller "
           "for a sparse graph."))

# ====================================================================
# Basic Theory -> Basic Theory, lesson 3: theory of information
# ====================================================================

register("ad-conversion", dk.flow(
    "Analogue to digital conversion",
    [("Sampling", "measure at intervals"),
     ("Quantisation", "round to a level"),
     ("Encoding", "write as bits"),
     ("Digital signal", "a stream of values")],
    caption="Three steps, and two of them throw information away.",
    note="Sampling discards the moments between samples; quantisation "
         "discards the values between levels; only encoding is lossless. "
         "Nyquist: sample at more than twice the highest frequency present."))

register("compiler-phases", dk.flow(
    "What a compiler does to your source",
    [("Lexical analysis", "text to tokens"),
     ("Syntax analysis", "tokens to a tree"),
     ("Semantic analysis", "check meaning"),
     ("Optimisation", "improve the code"),
     ("Code generation", "emit machine code")],
    caption="Each phase consumes the previous phase's output.",
    note="A stray character is caught by lexical analysis, a missing "
         "semicolon by syntax analysis, a type mismatch by semantic "
         "analysis. Which phase reports an error tells you its kind."))

register("automaton-states", dk.flow(
    "A finite automaton accepting binary strings ending in 01",
    [("S0", "start / no match"),
     ("S1", "seen a 0"),
     ("S2", "accept: 01")],
    caption="State plus input decides the next state, and nothing else does.",
    note="From S0 a 0 moves to S1 and a 1 stays at S0. From S1 a 1 moves to "
         "the accepting S2 and a 0 stays at S1. From S2 a 0 returns to S1 "
         "and a 1 returns to S0. Only the current state is remembered."))

# ====================================================================
# Basic Theory -> Basic Theory, lesson 4: theory of communications
# ====================================================================

register("modulation-schemes", dk.compare(
    "Modulating a carrier: three properties can be varied",
    [("Amplitude (ASK)", "vary the height",
      ["The carrier's strength encodes the data",
       "Simple to implement and to decode",
       "Highly vulnerable to noise, which is itself amplitude"]),
     ("Frequency (FSK)", "vary the rate",
      ["Different frequencies encode different symbols",
       "Far more resistant to amplitude noise",
       "Needs more bandwidth than ASK"]),
     ("Phase (PSK)", "vary the timing offset",
      ["Shifts in phase encode the data",
       "Efficient and noise-resistant",
       "The basis of modern high-rate links"])],
    caption="A sine wave has exactly three properties available to carry data.",
    footer="QAM combines amplitude and phase to carry several bits per "
           "symbol, which is how a modern link reaches a high rate inside a "
           "fixed bandwidth."))

register("transmission-modes", dk.compare(
    "How the two ends take turns",
    [("Simplex", "one direction only",
      ["Data flows one way and never the other",
       "Broadcast radio, a one-way sensor feed",
       "There is no reverse channel at all"]),
     ("Half duplex", "both ways, alternately",
      ["Each end transmits in turn",
       "A walkie-talkie, legacy shared Ethernet",
       "Collisions are possible and must be managed"]),
     ("Full duplex", "both ways at once",
      ["Both ends transmit simultaneously",
       "A telephone call, switched Ethernet",
       "Needs separate paths or separate frequencies"])],
    caption="Ask whether both ends may talk, and then whether at the same time.",
    footer="Switched Ethernet gives every host its own collision domain, "
           "which is what made full duplex the default."))

# ====================================================================
# Basic Theory -> Basic Theory, lesson 5: measurement and control
# ====================================================================

register("control-loop", dk.cycle(
    "The feedback control loop",
    ["Measure", "Compare", "Decide", "Actuate"],
    caption="Feedback corrects what has already happened.",
    centre="Setpoint"))

register("control-comparison", dk.split_planes(
    "Feedforward and feedback control",
    ("Feedforward", "Acts before the error appears", [
        ("Measure the disturbance", "not the output"),
        ("Predict its effect", "from a model"),
        ("Adjust in advance", "no error needed")]),
    ("Feedback", "Acts after the error appears", [
        ("Measure the output", "the actual result"),
        ("Compare to the setpoint", "compute the error"),
        ("Adjust to reduce it", "error drives the response")]),
    caption="One anticipates, the other reacts. Real systems use both.",
    footer="Feedforward is fast but only as good as its model. Feedback "
           "corrects anything, including what the model never predicted, but "
           "cannot act until the error already exists."))

register("sensor-actuator", dk.flow(
    "A control system end to end",
    [("Sensor", "physical to signal"),
     ("A/D converter", "signal to number"),
     ("Controller", "compute a response"),
     ("D/A converter", "number to signal"),
     ("Actuator", "signal to physical")],
    caption="The digital part sits between two conversions.",
    note="Sensors and actuators are the boundary between the computer and "
         "the world. Everything between them is arithmetic on numbers that "
         "are already approximations of a continuous quantity."))


# ====================================================================
# Basic Theory -> Algorithm and Programming
# ====================================================================

register("array-vs-list", dk.compare(
    "Contiguous storage against linked storage",
    [("Array", "one block, indexed",
      ["Elements sit next to each other in memory",
       "Any element reached in one step from its index",
       "Inserting in the middle shifts everything after it",
       "Size is fixed when it is created"]),
     ("Linked list", "nodes plus pointers",
      ["Each node holds its value and the address of the next",
       "Reaching element n means walking n links",
       "Inserting is rewiring two pointers, wherever it happens",
       "Grows and shrinks freely"])],
    caption="The same sequence, stored two ways, with opposite strengths.",
    footer="Arrays win on reading by position; linked lists win on inserting "
           "and removing. Almost every structure below is one of these two "
           "with a rule added."))

register("stack-queue", dk.split_planes(
    "The two orderings",
    ("Stack -- LIFO", "Last in, first out", [
        ("push", "add to the top"),
        ("pop", "remove from the top"),
        ("Both ends are the same end", "so the newest leaves first")]),
    ("Queue -- FIFO", "First in, first out", [
        ("enqueue", "add to the rear"),
        ("dequeue", "remove from the front"),
        ("Opposite ends", "so the oldest leaves first")]),
    caption="One rule each, and that rule is the whole structure.",
    footer="A stack models nesting -- call frames, undo history, bracket "
           "matching. A queue models waiting -- print jobs, message "
           "buffers, breadth-first traversal."))

register("tree-anatomy", dk.tiers(
    "The parts of a tree",
    [("Root", ["A"]),
     ("Internal", ["B", "C"]),
     ("Leaves", ["D", "E", "F", "G"])],
    caption="Depth is measured from the root; height is measured to the "
            "deepest leaf.",
    footer="A binary tree gives each node at most two children. A tree of "
           "height h holds at most 2^(h+1) - 1 nodes, which is why a balanced "
           "tree of a million nodes is only about twenty levels deep."))

register("bst-search", dk.flow(
    "Searching a binary search tree for 7",
    [("At 8", "7 < 8, go left"),
     ("At 3", "7 > 3, go right"),
     ("At 6", "7 > 6, go right"),
     ("At 7", "found")],
    caption="Every comparison discards a whole subtree.",
    note="The ordering rule -- everything left of a node is smaller, "
         "everything right is larger -- is what makes this possible. Lose the "
         "balance and the tree degenerates into a linked list, and the search "
         "degrades from logarithmic to linear."))

register("hash-collision", dk.flow(
    "A hash table lookup",
    [("Key", "\"order-4471\""),
     ("Hash function", "compute an index"),
     ("Bucket 12", "one or more entries"),
     ("Compare keys", "find the exact match")],
    caption="The hash finds the bucket; the comparison finds the entry.",
    note="Two keys hashing to the same bucket is a COLLISION, and it is "
         "unavoidable: there are more possible keys than buckets. Chaining "
         "keeps a list per bucket; open addressing probes for the next free "
         "slot. Both degrade towards linear time as the table fills."))

register("binary-search", dk.flow(
    "Binary search for 23 in a sorted array of 16",
    [("Middle = 30", "23 < 30, keep the left half"),
     ("Middle = 15", "23 > 15, keep the right half"),
     ("Middle = 23", "found in 3 comparisons")],
    caption="Each comparison halves what remains.",
    note="Sixteen elements need at most four comparisons, and a million need "
         "at most twenty. The array MUST already be sorted -- binary search "
         "on unsorted data does not run slowly, it returns wrong answers."))

register("recursion-frames", dk.stack(
    "The call stack during factorial(4)",
    [("factorial(1) returns 1", "innermost, returns first"),
     ("factorial(2) waits for factorial(1)", "2 x 1 = 2"),
     ("factorial(3) waits for factorial(2)", "3 x 2 = 6"),
     ("factorial(4) waits for factorial(3)", "4 x 6 = 24")],
    caption="Each call keeps a frame until the one below it returns.",
    numbered=False,
    right_note="A missing or unreachable base case means frames are pushed "
               "for ever, which is what a stack overflow is."))

register("compile-vs-interpret", dk.split_planes(
    "Two ways to run source code",
    ("Compiled", "Translated once, ahead of time", [
        ("Source", "written by the programmer"),
        ("Compiler", "translates the whole program"),
        ("Machine code", "run directly, repeatedly")]),
    ("Interpreted", "Translated each time, as it runs", [
        ("Source", "written by the programmer"),
        ("Interpreter", "reads and executes statement by statement"),
        ("Effects", "produced as it goes")]),
    caption="The trade is when translation happens, and how often.",
    footer="Compiling costs time once and buys speed for ever after; "
           "interpreting starts instantly and pays the translation cost on "
           "every run. A JIT compiler does both: interpret at first, then "
           "compile the parts that turn out to be hot."))

register("paradigms", dk.compare(
    "Three ways to organise a program",
    [("Procedural", "sequences of steps",
      ["Data and the procedures on it are separate",
       "Organised around what happens, in order",
       "C, Pascal, COBOL"]),
     ("Object-oriented", "objects owning their data",
      ["Data and behaviour bundled together",
       "Organised around what things are",
       "Java, C++, Python, C#"]),
     ("Functional", "expressions and values",
      ["Functions avoid changing state",
       "Organised around transforming data",
       "Haskell, Lisp, and features in most modern languages"])],
    caption="Not exclusive: most working languages support more than one.",
    footer="The examination asks which paradigm a described approach "
           "belongs to, so learn each by its organising principle rather "
           "than by its language list."))

register("markup-family", dk.flow(
    "From notation to meaning",
    [("Plain text", "characters only"),
     ("Markup", "structure added around it"),
     ("Parser", "reads the structure"),
     ("Data or display", "meaning acted on")],
    caption="Markup adds structure that a program can rely on.",
    note="HTML marks up a document for display; XML and JSON mark up data "
         "for exchange. All three separate what the content IS from how it "
         "is presented, which is why the same data can feed a page, an app "
         "and a report."))


# ====================================================================
# Computer System -> Computer Component
# ====================================================================

register("cpu-blocks", dk.flow(
    "The processor's functional units",
    [("Control unit", "fetch and decode"),
     ("Registers", "the fastest storage"),
     ("ALU", "arithmetic and logic"),
     ("Result", "back to a register")],
    caption="The control unit directs; the ALU computes; registers hold.",
    note="The control unit does no arithmetic and the ALU makes no decisions "
         "about what to do next. Separating the two is what allows the same "
         "ALU to serve every instruction in the set."))

register("instruction-cycle", dk.cycle(
    "The instruction cycle",
    ["Fetch", "Decode", "Execute", "Store"],
    caption="Repeated for every instruction, for the life of the machine.",
    centre="Program counter"))

register("pipeline", dk.tiers(
    "A four-stage pipeline: four instructions in flight at once",
    [("Cycle 3", ["I1 store", "I2 execute", "I3 decode", "I4 fetch"]),
     ("Cycle 2", ["I1 execute", "I2 decode", "I3 fetch", ""]),
     ("Cycle 1", ["I1 decode", "I2 fetch", "", ""])],
    caption="Each stage works on a different instruction in the same cycle.",
    footer="Throughput rises towards one instruction per cycle without any "
           "single instruction finishing sooner. A branch whose outcome is "
           "not yet known forces the partly filled stages to be discarded, "
           "which is why branch prediction matters so much."))

register("memory-hierarchy", dk.stack(
    "The memory hierarchy",
    [("Registers", "under 1 ns, bytes"),
     ("L1 cache", "about 1 ns, tens of KB"),
     ("L2 / L3 cache", "3-30 ns, MB"),
     ("Main memory (DRAM)", "about 100 ns, GB"),
     ("SSD", "tens of microseconds, TB"),
     ("Hard disk", "milliseconds, TB")],
    caption="Faster is smaller and dearer; larger is slower and cheaper.",
    numbered=False,
    right_note="Each level is roughly ten times slower and ten times larger "
               "than the one above. The whole design assumes locality: that "
               "what was just used will be used again."))

register("cache-mapping", dk.compare(
    "Where a memory block may sit in the cache",
    [("Direct mapped", "exactly one place",
      ["The address decides the line",
       "Lookup is a single check -- fastest",
       "Two hot blocks mapping to one line evict each other repeatedly"]),
     ("Fully associative", "any place",
      ["A block may go in any line",
       "No conflict misses at all",
       "Every line must be checked, which is expensive"]),
     ("Set associative", "any place within a set",
      ["The address chooses a set; the block sits anywhere in it",
       "The practical compromise -- 4-way or 8-way is typical",
       "Most of the benefit for a fraction of the cost"])],
    caption="The trade is lookup cost against conflict misses.",
    footer="Set associativity is what almost every real cache uses, because "
           "direct mapping thrashes and full associativity does not scale."))

register("raid-levels", dk.compare(
    "The RAID levels the syllabus names",
    [("RAID 0 -- striping", "no redundancy",
      ["Data split across every disk",
       "Fastest, and full capacity",
       "One disk fails and everything is lost"]),
     ("RAID 1 -- mirroring", "full duplication",
      ["Every block written to two disks",
       "Survives one disk failing",
       "Half the capacity is redundancy"]),
     ("RAID 5 -- parity", "one disk of overhead",
      ["Data and parity striped across all disks",
       "Survives one disk failing",
       "Writes cost extra: parity must be recalculated"])],
    caption="Capacity, speed and survival, traded three ways.",
    footer="RAID 6 carries two parity blocks and survives two failures, "
           "which matters because rebuilding a large RAID 5 array stresses "
           "the remaining disks for hours."))

register("io-methods", dk.compare(
    "Three ways to move data to a device",
    [("Programmed I/O", "the CPU does everything",
      ["The processor transfers each unit itself",
       "Simple, and it consumes the CPU entirely",
       "Only sensible for tiny transfers"]),
     ("Interrupt-driven", "the device asks for attention",
      ["The CPU works elsewhere until interrupted",
       "One interrupt per unit of data",
       "Far better, and still costly at high rates"]),
     ("DMA", "a controller moves it",
      ["A DMA controller transfers directly to memory",
       "One interrupt for the whole block",
       "How disks and networks actually work"])],
    caption="Each step removes the processor further from the transfer.",
    footer="DMA is why a large file copy does not consume a core. The CPU "
           "sets up the transfer, does other work, and is told once when the "
           "whole block has landed."))

# ====================================================================
# Computer System -> System Component
# ====================================================================

register("system-configurations", dk.compare(
    "Arranging more than one machine",
    [("Duplex / hot standby", "one works, one waits",
      ["A standby takes over on failure",
       "Fast recovery, and half the hardware is idle",
       "Used where downtime is expensive"]),
     ("Load sharing (cluster)", "all work together",
      ["Requests spread across every node",
       "Capacity and availability at once",
       "Needs a way to distribute and to detect failure"]),
     ("Dual system", "both compute, results compared",
      ["Two machines run the same work",
       "Disagreement reveals a fault immediately",
       "The most expensive, for safety-critical work"])],
    caption="Redundancy buys availability; the question is what the spare "
            "capacity does meanwhile.",
    footer="Availability is what fraction of the time the system is usable. "
           "Reliability is how long it runs before failing. A system can be "
           "highly available and unreliable, if it fails often and recovers "
           "instantly."))

register("availability-timeline", dk.timeline(
    "MTBF, MTTR and availability",
    "Working -- MTBF",
    "Repairing -- MTTR",
    caption="Availability = MTBF / (MTBF + MTTR).",
    footer="Two ways to raise availability: fail less often, or recover "
           "faster. Recovering faster is usually the cheaper of the two, "
           "which is why redundancy and automated failover beat chasing the "
           "last few failures."))

# ====================================================================
# Computer System -> Software
# ====================================================================

register("process-states", dk.flow(
    "The states a process moves between",
    [("New", "being created"),
     ("Ready", "waiting for a processor"),
     ("Running", "executing now"),
     ("Waiting", "blocked on I/O"),
     ("Terminated", "finished")],
    caption="Only one process per core is Running at any instant.",
    note="Ready to Running is dispatching; Running to Ready is pre-emption "
         "when the time slice expires; Running to Waiting is blocking on "
         "I/O, and the completed I/O returns it to Ready -- never straight "
         "to Running."))

register("virtual-memory", dk.split_planes(
    "Virtual memory",
    ("What the program sees", "One contiguous address space", [
        ("Page 0", "logical address"),
        ("Page 1", "logical address"),
        ("Page 2", "logical address")]),
    ("Where it actually is", "Scattered, and partly on disk", [
        ("Frame 7 in RAM", "resident"),
        ("On disk", "paged out"),
        ("Frame 2 in RAM", "resident")]),
    caption="A page table translates one to the other on every access.",
    footer="A reference to a page that is not resident is a PAGE FAULT: the "
           "process blocks, the page is read from disk, and execution "
           "resumes. Excessive faulting is thrashing, where the system "
           "spends its time paging rather than computing."))

register("filesystem-tree", dk.tiers(
    "A hierarchical file system",
    [("Root", ["/"]),
     ("Directories", ["home", "etc", "var"]),
     ("Files", ["report.txt", "config", "app.log", "data.csv"])],
    caption="Directories contain files and other directories, without limit.",
    footer="An ABSOLUTE path names a file from the root and means the same "
           "thing anywhere. A RELATIVE path names it from the current "
           "directory and means different things depending on where you "
           "are."))

# ====================================================================
# Computer System -> Hardware
# ====================================================================

register("logic-gates-circuit", dk.flow(
    "A half adder, built from two gates",
    [("A, B", "two input bits"),
     ("XOR", "gives the Sum"),
     ("AND", "gives the Carry"),
     ("S, C", "two output bits")],
    caption="Two bits in, a sum and a carry out.",
    note="A FULL adder takes a carry in as well, so full adders chained "
         "together add numbers of any width. This is the whole of binary "
         "addition in hardware, and it is why the ALU is built from gates."))

register("flip-flop", dk.compare(
    "Combinational and sequential circuits",
    [("Combinational", "output depends only on input",
      ["Adders, decoders, multiplexers",
       "No memory of what came before",
       "The same inputs always give the same outputs"]),
     ("Sequential", "output depends on input AND state",
      ["Flip-flops, registers, counters",
       "Holds a value until told to change",
       "A clock decides when state may change"])],
    caption="Memory is what separates the two.",
    footer="A flip-flop stores one bit. Registers, caches and main memory "
           "are all built from arrays of storage elements, which is why "
           "state and clocking are the heart of sequential design."))


# ====================================================================
# Computer System -> Computer Component, buses and I/O
# ====================================================================

register("bus-structure", dk.hub_spoke(
    "The system bus connects everything",
    "System bus",
    ["Processor", "Main memory", "Disk controller", "Network adapter",
     "Graphics", "USB controller"],
    caption="A shared path, so only one transfer may occupy it at a time.",
    hub_note="address + data + control"))

register("bus-lines", dk.fields(
    "The three groups of lines in a bus",
    [("Address bus", "which location", 32, dk.BLUE),
     ("Data bus", "the value itself", 64, dk.DEEP),
     ("Control", "read/write, timing", 16, dk.ORANGE)],
    caption="Width matters differently for each group.",
    footer="Address width bounds how much memory can be addressed: 32 lines "
           "reach 4 GiB. Data width bounds how much moves per transfer. "
           "Control lines carry direction, timing and interrupt signals."))

register("io-device-classes", dk.compare(
    "Devices grouped by how data moves",
    [("Character devices", "one unit at a time",
      ["Keyboard, mouse, serial port, terminal",
       "A stream with no addressable positions",
       "Small transfers, often interrupt-driven"]),
     ("Block devices", "fixed-size blocks",
      ["Disk, SSD, tape",
       "Addressable: any block can be requested",
       "Large transfers, almost always DMA"]),
     ("Network devices", "framed packets",
      ["Ethernet and wireless adapters",
       "Neither a stream nor addressable storage",
       "High rates, so interrupt coalescing matters"])],
    caption="The class decides how the operating system talks to it.",
    footer="This grouping is why a driver interface has so few shapes: read "
           "and write a stream, read and write a numbered block, or send and "
           "receive a frame."))


# ====================================================================
# Computer System -> Software
# ====================================================================

register("os-layers", dk.stack(
    "Where the operating system sits",
    [("Applications", "what the user runs"),
     ("System call interface", "the only way in"),
     ("Kernel: processes, memory, files, devices", "privileged"),
     ("Device drivers", "hardware-specific"),
     ("Hardware", "processor, memory, devices")],
    caption="Each layer uses only the one below it.",
    numbered=False,
    right_note="The system call interface is the security boundary. Above it "
               "code runs unprivileged; below it, code can do anything."))

register("context-switch", dk.flow(
    "A context switch",
    [("Process A running", "using the CPU"),
     ("Save A's state", "registers, PC, flags"),
     ("Load B's state", "from B's control block"),
     ("Process B running", "using the CPU")],
    caption="The processor is never doing useful work in the middle two steps.",
    note="Context switching is pure overhead. Switching too often spends the "
         "machine on bookkeeping; too rarely and interactive processes wait. "
         "The time slice is the compromise between those two failures."))

register("deadlock-cycle", dk.cycle(
    "Deadlock: a cycle of waiting",
    ["P1 holds R1", "P1 wants R2", "P2 holds R2", "P2 wants R1"],
    caption="Nothing has crashed; everything is waiting, for ever.",
    centre="Circular wait"))

register("fragmentation", dk.split_planes(
    "Two kinds of wasted memory",
    ("External fragmentation", "Free space, but scattered", [
        ("Used 40K", "allocated"),
        ("Free 20K", "too small for the request"),
        ("Used 60K", "allocated"),
        ("Free 30K", "also too small")]),
    ("Internal fragmentation", "Space inside an allocation", [
        ("Requested 33K", "what was needed"),
        ("Allocated 40K", "fixed block size"),
        ("Wasted 7K", "inside the block"),
        ("Unusable", "by anyone else")]),
    caption="Total free memory can exceed a request that still cannot be met.",
    footer="Paging eliminates external fragmentation by making every block "
           "the same size, and accepts a little internal fragmentation in the "
           "last page of each allocation as the price."))

register("build-pipeline", dk.flow(
    "From source to a running system",
    [("Source control", "the single truth"),
     ("Build", "compile and package"),
     ("Test", "automated checks"),
     ("Artifact", "one versioned output"),
     ("Deploy", "to an environment")],
    caption="Each stage either passes the artifact on or stops the line.",
    note="Build ONCE and promote the same artifact through every environment. "
         "Rebuilding per environment means what you tested is not what you "
         "shipped, which is the defect this pipeline exists to prevent."))

register("licence-spectrum", dk.compare(
    "Open source licences, by what they require of you",
    [("Permissive", "MIT, BSD, Apache",
      ["Use it in anything, including closed products",
       "Keep the copyright notice",
       "No obligation to publish your changes"]),
     ("Weak copyleft", "LGPL, MPL",
      ["Changes to the LIBRARY must be published",
       "Your own code may stay closed",
       "The boundary is the file or the library"]),
     ("Strong copyleft", "GPL, AGPL",
      ["Derived works must be released under the same licence",
       "Linking generally makes your work derived",
       "AGPL extends this to software offered over a network"])],
    caption="The obligation rises left to right; the freedom to combine falls.",
    footer="Open source is a licence, not an absence of one. Ignoring its "
           "terms is copyright infringement in exactly the way ignoring a "
           "commercial licence would be."))


# ====================================================================
# Technology Element -> Human Interface
# ====================================================================

register("interaction-styles", dk.compare(
    "Ways a person can drive a system",
    [("Command language", "type an instruction",
      ["Precise, scriptable, repeatable",
       "Nothing is visible until you know it",
       "Fast for experts, opaque for everyone else"]),
     ("Direct manipulation", "act on what you see",
      ["Objects are visible and respond immediately",
       "Discoverable by exploration",
       "Slow for repetitive bulk work"]),
     ("Form and menu", "choose from what is offered",
      ["The valid options are shown",
       "Little to remember and little to mistype",
       "Cumbersome once the option list grows long"])],
    caption="Each suits a different user and a different task.",
    footer="The recurring answer is BOTH: a discoverable interface for "
           "learning and occasional use, plus a command or scripting path for "
           "the expert doing the same thing a hundred times."))

register("usability-model", dk.stack(
    "What usability is made of",
    [("Satisfaction", "does it feel acceptable to use?"),
     ("Error tolerance", "can mistakes be avoided and undone?"),
     ("Memorability", "is it still usable after a month away?"),
     ("Efficiency", "how fast once learned?"),
     ("Learnability", "how quickly can a new user start?")],
    caption="Five measurable components, not a matter of taste.",
    numbered=False,
    right_note="Each can be tested with real users and stated as a target, "
               "which is what makes usability a requirement rather than an "
               "opinion."))

register("feedback-loop-ui", dk.flow(
    "What a user needs at every step",
    [("Affordance", "what can I do here?"),
     ("Action", "the user does it"),
     ("Feedback", "what happened?"),
     ("Next state", "where am I now?")],
    caption="Break any link and the interface feels broken.",
    note="Missing feedback is the commonest fault: a button that does not "
         "acknowledge a press gets pressed again, which is how duplicate "
         "orders and double payments are created."))

# ====================================================================
# Technology Element -> Multimedia
# ====================================================================

register("colour-models", dk.compare(
    "Two ways to specify a colour",
    [("RGB -- additive", "light, for screens",
      ["Red, green and blue light combine",
       "All three at full gives white",
       "None gives black -- the screen is off"]),
     ("CMY(K) -- subtractive", "ink, for print",
      ["Cyan, magenta and yellow absorb light",
       "All three gives a muddy near-black, so K adds true black",
       "None gives white -- the paper shows through"]),
     ("HSV / HSB", "how people describe colour",
      ["Hue, saturation, value",
       "Matches how a person picks a colour",
       "Converted to RGB or CMYK for output"])],
    caption="Screens emit light; paper reflects it. The models differ "
            "accordingly.",
    footer="This is why a colour on screen cannot always be printed: the two "
           "gamuts do not coincide, and the vivid ones are usually the ones "
           "that do not survive."))

register("media-pipeline", dk.flow(
    "Getting media from the world into a file",
    [("Capture", "sample and quantise"),
     ("Process", "correct and edit"),
     ("Compress", "reduce the size"),
     ("Container", "package with metadata"),
     ("Deliver", "stream or download")],
    caption="Each stage has its own losses and its own choices.",
    note="The CODEC decides how the media is compressed; the CONTAINER "
         "decides how the compressed streams and their metadata are packaged "
         "together. One file format may hold several different codecs, which "
         "is why a file can be recognised and still not play."))

register("compression-tradeoff", dk.split_planes(
    "The same image, two ways",
    ("Lossless -- PNG", "Nothing discarded", [
        ("Original restored exactly", "bit for bit"),
        ("Modest reduction", "2-4x on typical images"),
        ("Safe to re-save", "no accumulating damage")]),
    ("Lossy -- JPEG", "Detail judged imperceptible removed", [
        ("Original NOT recoverable", "approximation only"),
        ("Large reduction", "10-20x at acceptable quality"),
        ("Damage accumulates", "each re-save loses more")]),
    caption="The choice follows from whether the data must survive intact.",
    footer="Lossy for photographs and audio a person will perceive; lossless "
           "for text, diagrams, screenshots, medical images and anything that "
           "will be edited and re-saved."))


register("screen-zones", dk.tiers(
    "Where the eye goes on a screen",
    [("Scanned first", ["Top left", "Headline"]),
     ("Scanned next", ["Left column", "Emphasised items"]),
     ("Scanned last", ["Lower right", "Body text", "Footers"])],
    caption="For left-to-right scripts. The important thing belongs where the "
            "eye already is.",
    footer="An element nobody finds is usually present, unemphasised, and "
           "below the fold -- three separate ways of putting it where nobody "
           "looks."))

register("error-handling-order", dk.flow(
    "The order to attack an input error",
    [("Prevent", "a control that cannot be wrong"),
     ("Constrain", "reject at the point of entry"),
     ("Explain", "what, why, what to do"),
     ("Recover", "let the user undo")],
    caption="Each step is cheaper than the one after it.",
    note="A date picker prevents an impossible date; field validation catches "
         "it as it is typed; a message explains it after submission; and undo "
         "repairs it afterwards. Most designs start at step three."))

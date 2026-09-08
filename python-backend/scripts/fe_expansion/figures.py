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


register("graphics-pipeline", dk.flow(
    "The 3D graphics pipeline",
    [("Model", "vertices in object space"),
     ("Transform", "position, rotate, scale"),
     ("Project", "3D to a 2D viewpoint"),
     ("Rasterise", "shapes to pixels"),
     ("Shade", "colour, light, texture")],
    caption="Every stage runs for every frame, sixty times a second.",
    note="The workload is enormous and highly parallel -- the same operation "
         "applied to millions of independent vertices and pixels -- which is "
         "exactly what a GPU is built for and what a general processor is "
         "not."))

register("raster-vs-vector", dk.split_planes(
    "Two ways to describe a picture",
    ("Raster", "A grid of coloured pixels", [
        ("Size follows dimensions", "not complexity"),
        ("Can show anything", "including a photograph"),
        ("Enlarging interpolates", "no new detail appears")]),
    ("Vector", "A description of shapes", [
        ("Size follows complexity", "not dimensions"),
        ("Scales without loss", "redrawn, not stretched"),
        ("Cannot show a photograph", "there are no shapes in one")]),
    caption="The size behaviour runs in opposite directions.",
    footer="A logo is tiny as a vector at any size and large as a raster at "
           "a big one. A photograph is impossible as a vector and ordinary "
           "as a raster."))


# ====================================================================
# Technology Element -> Database
# ====================================================================

register("three-schema", dk.stack(
    "The three-schema architecture",
    [("External schema", "what each application sees"),
     ("Conceptual schema", "the whole logical design, once"),
     ("Internal schema", "how it is physically stored")],
    caption="Two mappings between three levels, and each buys an independence.",
    numbered=False,
    right_note="LOGICAL independence: change the conceptual schema without "
               "touching applications. PHYSICAL independence: change the "
               "storage without touching the logical design."))

register("normalisation-steps", dk.flow(
    "Normalising a table",
    [("Unnormalised", "repeating groups"),
     ("1NF", "atomic values only"),
     ("2NF", "no partial dependency"),
     ("3NF", "no transitive dependency")],
    caption="Each form removes one specific kind of redundancy.",
    note="2NF only differs from 1NF when the key is COMPOSITE -- a partial "
         "dependency needs more than one key column to be partial to. With a "
         "single-column key, any table in 1NF is already in 2NF."))

register("join-types", dk.compare(
    "What each join keeps",
    [("Inner join", "matches only",
      ["Rows present on BOTH sides",
       "Unmatched rows disappear silently",
       "The commonest join, and the commonest way to lose rows"]),
     ("Left outer join", "everything on the left",
      ["Every left row, matched or not",
       "Unmatched right columns come back null",
       "Use when the left side is the population you are reporting on"]),
     ("Full outer join", "everything on both",
      ["Every row from either side",
       "Nulls wherever there was no match",
       "Used to find what is missing from each side"])],
    caption="The choice decides which rows vanish.",
    footer="A count that comes out lower than expected is an inner join "
           "discarding unmatched rows far more often than it is missing "
           "data."))

register("transaction-states", dk.flow(
    "The life of a transaction",
    [("Active", "executing"),
     ("Partially committed", "final statement done"),
     ("Committed", "durable, and visible"),
     ("Failed / aborted", "rolled back")],
    caption="Only a committed transaction is guaranteed to survive.",
    note="COMMIT waits for the log to reach persistent storage before "
         "returning, which is what makes durability real -- and is why a "
         "commit is slower than the writes it confirms."))

register("concurrency-anomalies", dk.compare(
    "What goes wrong without isolation",
    [("Dirty read", "reading uncommitted data",
      ["T2 reads a value T1 has written but not committed",
       "T1 then rolls back",
       "T2 acted on something that never happened"]),
     ("Non-repeatable read", "the same row changes",
      ["T2 reads a row twice within one transaction",
       "T1 updates and commits in between",
       "The two reads disagree"]),
     ("Phantom read", "new rows appear",
      ["T2 runs the same query twice",
       "T1 inserts a matching row in between",
       "The second result set is larger"])],
    caption="Three anomalies, in increasing order of what it costs to "
            "prevent them.",
    footer="Isolation levels are named for which of these they permit. "
           "Higher isolation means fewer anomalies and less concurrency, "
           "which is a throughput decision rather than a correctness one."))

register("deadlock-db", dk.split_planes(
    "Two transactions, opposite lock order",
    ("Transaction A", "Locks in this order", [
        ("Lock ACCOUNTS", "acquired"),
        ("Lock ORDERS", "waiting for B"),
        ("Blocked", "indefinitely")]),
    ("Transaction B", "Locks in the other order", [
        ("Lock ORDERS", "acquired"),
        ("Lock ACCOUNTS", "waiting for A"),
        ("Blocked", "indefinitely")]),
    caption="Neither can proceed, and neither will give way.",
    footer="A consistent lock ORDER across the application prevents this "
           "entirely and costs nothing at run time. Detection and victim "
           "rollback is the fallback, not the design."))

register("db-recovery", dk.timeline(
    "Recovering after a crash",
    "Before the crash -- log written ahead",
    "After restart -- redo and undo",
    caption="Write-ahead logging: the log reaches disk before the data does.",
    footer="REDO committed transactions whose data had not yet been written. "
           "UNDO uncommitted ones whose data had. The log makes both possible "
           "because it records the intention before the change."))

register("distributed-db", dk.hub_spoke(
    "A distributed database",
    "One logical database",
    ["Site A", "Site B", "Site C", "Site D"],
    caption="Data is partitioned or replicated across sites and presented as "
            "one.",
    hub_note="transparency to the application"))

register("warehouse-flow", dk.flow(
    "From operational systems to analysis",
    [("Source systems", "day-to-day operations"),
     ("Extract", "pull the data out"),
     ("Transform", "clean and conform it"),
     ("Load", "into the warehouse"),
     ("Analyse", "reports and mining")],
    caption="ETL, and the reason a warehouse is separate from the systems it "
            "draws on.",
    note="Analytical queries scan enormous ranges and would cripple the "
         "operational systems they run against. Separating them lets each be "
         "designed for its own access pattern -- normalised for writes, "
         "denormalised for reads."))


# ====================================================================
# Technology Element -> Network
# ====================================================================

register("network-scale", dk.compare(
    "Networks by the ground they cover",
    [("LAN", "one site",
      ["A building or a floor",
       "Owned and cabled by the organisation",
       "Fast, and cheap per metre"]),
     ("WAN", "between sites",
       ["Cities, countries, continents",
        "Carrier-provided links, rented",
        "Slower, dearer, and outside your control"]),
     ("The consequence", "design differently",
      ["Chatty protocols work on a LAN",
       "The same design over a WAN is unusable",
       "Latency, not bandwidth, is what changed"])],
    caption="Scale changes what a design can assume.",
    footer="Bandwidth can be bought. Latency is bounded by distance and the "
           "speed of light, which is why a protocol that makes many small "
           "round trips fails on a WAN however wide the link."))

register("topologies", dk.compare(
    "Four ways to wire a network",
    [("Star", "everything to a centre",
      ["One central device, one link each",
       "A failed link takes out one node",
       "A failed centre takes out everything"]),
     ("Bus", "one shared medium",
      ["Every node on one cable",
       "Cheap, and a break splits the network",
       "Collisions rise sharply with traffic"]),
     ("Ring", "each to the next",
      ["Traffic circulates in one direction",
       "One break stops it, unless doubled",
       "Access is orderly rather than contended"])],
    caption="Star is what almost every modern LAN actually is.",
    footer="A MESH connects nodes to several others, so any single link can "
           "fail without partitioning the network -- which is why the "
           "internet's core is meshed and the office floor is not."))

register("osi-layers", dk.stack(
    "The OSI reference model",
    [("7 Application", "what the program actually wants"),
     ("6 Presentation", "encoding, encryption, compression"),
     ("5 Session", "conversations and their state"),
     ("4 Transport", "end to end, reliable or not"),
     ("3 Network", "addressing and routing between networks"),
     ("2 Data link", "frames on one link, and local addressing"),
     ("1 Physical", "signals on a medium")],
    caption="Seven layers, each using the one below and serving the one "
            "above.",
    numbered=False,
    right_note="TCP/IP collapses these into four. Layers 5 to 7 become one "
               "application layer, which is why the OSI numbers survive as "
               "vocabulary rather than as an implemented stack."))

register("encoding-schemes", dk.compare(
    "Getting bits onto a medium",
    [("Baseband", "the signal itself",
      ["Digital pulses straight onto the wire",
       "The whole medium carries one signal",
       "Normal on a LAN"]),
     ("Broadband", "modulated onto a carrier",
      ["A carrier wave altered to carry data",
       "Many channels share one medium",
       "How cable and radio carry data"]),
     ("Why encoding matters", "not just ones and zeroes",
      ["A long run of one value loses timing",
       "Encodings guarantee transitions",
       "Which is what keeps receiver and sender in step"])],
    caption="Two ways of using a medium, and why the encoding is not "
            "arbitrary.",
    footer="A receiver recovers its clock from the transitions in the signal. "
           "An encoding with no guaranteed transitions lets a long run of "
           "identical bits drift the receiver out of step."))

register("multiplexing", dk.compare(
    "Sharing one medium",
    [("Frequency division", "different frequencies",
      ["Each channel gets a frequency band",
       "All transmit simultaneously",
       "Radio and cable television"]),
     ("Time division", "different moments",
      ["Each channel gets a repeating time slot",
       "Slots are wasted if a channel is idle",
       "Classic telephone trunks"]),
     ("Statistical", "slots on demand",
      ["Capacity given to whoever has data",
       "No waste on idle channels",
       "How packet networks actually work"])],
    caption="Three ways several conversations share one link.",
    footer="Statistical multiplexing is more efficient and offers no "
           "guarantee: when everyone transmits at once there is not enough "
           "for all, which is congestion rather than a fault."))

register("switching-methods", dk.split_planes(
    "Circuit against packet switching",
    ("Circuit switching", "A path reserved end to end", [
        ("Setup", "a path is established first"),
        ("Transfer", "capacity is yours, idle or not"),
        ("Teardown", "the path is released")]),
    ("Packet switching", "Each packet routed independently", [
        ("No setup", "send whenever ready"),
        ("Per packet", "each finds its own way"),
        ("Reassembly", "order restored at the far end")]),
    caption="Guaranteed capacity, against efficient sharing.",
    footer="Circuit switching wastes a reserved channel during silence and "
           "guarantees quality. Packet switching wastes nothing and "
           "guarantees nothing, which is the trade the internet made."))

register("tcp-ip-stack", dk.tiers(
    "The TCP/IP model, and what runs where",
    [("Application", ["HTTP", "DNS", "SMTP", "SSH"]),
     ("Transport", ["TCP -- reliable, ordered", "UDP -- fast, unchecked"]),
     ("Internet", ["IP -- addressing and routing", "ICMP", "ARP"]),
     ("Link", ["Ethernet", "Wi-Fi", "the physical medium"])],
    caption="Four layers, and the protocols the examination names at each.",
    footer="Knowing the LAYER a protocol sits at answers most protocol items "
           "without recalling anything else about it."))

register("tcp-vs-udp", dk.compare(
    "Two transports, two contracts",
    [("TCP", "reliable and ordered",
      ["Connection established before data",
       "Lost segments retransmitted",
       "Order restored, flow controlled",
       "Costs round trips and header space"]),
     ("UDP", "send and hope",
      ["No connection, no state",
       "Losses are not detected or repaired",
       "No ordering guarantee at all",
       "Minimal overhead, minimal delay"]),
     ("Choosing", "what does loss mean here",
      ["A file transfer cannot lose a byte",
       "A live voice packet arriving late is useless",
       "Retransmission helps one and harms the other"])],
    caption="Reliability is not free, and it is not always wanted.",
    footer="For real-time media a retransmitted packet arrives after the "
           "moment it was needed, so TCP's reliability costs delay and buys "
           "nothing -- which is why streaming and voice use UDP."))

register("ip-addressing", dk.fields(
    "An IPv4 address and its mask",
    [("Network part", "which network", 18, dk.BLUE),
     ("Host part", "which machine on it", 14, dk.ORANGE)],
    caption="The subnet mask says where the boundary falls.",
    footer="Moving the boundary right makes more hosts per network and fewer "
           "networks; moving it left does the reverse. Two addresses in every "
           "subnet are unusable -- the network address and the broadcast."))

register("routing-decision", dk.flow(
    "How a packet is forwarded",
    [("Packet arrives", "with a destination address"),
     ("Mask applied", "find the destination network"),
     ("Table consulted", "longest matching prefix wins"),
     ("Next hop chosen", "or the default route"),
     ("Forwarded", "and the process repeats there")],
    caption="Each router makes this decision independently.",
    note="No router knows the whole path. It knows only the next hop, which "
         "is why a routing loop is possible and why the TTL field exists to "
         "stop one running forever."))

register("tcp-handshake", dk.flow(
    "Establishing and ending a TCP connection",
    [("SYN", "client proposes, with its sequence number"),
     ("SYN-ACK", "server agrees, and proposes its own"),
     ("ACK", "client confirms -- the connection is open"),
     ("Data", "flows in both directions"),
     ("FIN exchange", "each side closes its direction")],
    caption="Three messages to open, and each direction closed separately.",
    note="The three-way handshake costs a full round trip before any data "
         "moves, which is why connection setup dominates the cost of many "
         "small requests and why connections are reused."))

register("network-devices", dk.compare(
    "Devices, by the layer they work at",
    [("Hub -- layer 1", "repeats electricity",
      ["Copies every signal to every port",
       "One collision domain for everybody",
       "Obsolete, and still examined"]),
     ("Switch -- layer 2", "learns local addresses",
      ["Forwards a frame to the right port only",
       "Each port is its own collision domain",
       "What an office LAN is actually built from"]),
     ("Router -- layer 3", "connects networks",
      ["Forwards between different IP networks",
       "Stops broadcasts from crossing",
       "Where a network's boundary really is"])],
    caption="A device's layer determines what it can see and decide on.",
    footer="A switch reads addresses on one link; a router reads addresses "
           "that mean something between networks. That is why a router and "
           "not a switch is what separates two networks."))

register("net-troubleshooting", dk.flow(
    "Isolating a network fault",
    [("Check the link", "is the interface up at all"),
     ("Check the address", "correct address, mask, gateway"),
     ("Ping the gateway", "does the local network work"),
     ("Ping beyond it", "does routing work"),
     ("Resolve a name", "or is it only DNS"),
     ("Test the port", "the path works, does the service")],
    caption="Work up the layers -- each step assumes the ones below "
            "passed.",
    note="Testing an application before confirming the link inverts this and "
         "wastes the effort, because a failure at the top has a dozen causes "
         "below it and each lower test eliminates a whole class at once."))

register("dns-resolution", dk.flow(
    "Resolving a name",
    [("Local cache", "answered instantly if known"),
     ("Resolver", "asked on the cache's behalf"),
     ("Root server", "which server knows this suffix"),
     ("Authoritative server", "holds the actual record"),
     ("Answer cached", "for as long as the TTL allows")],
    caption="A hierarchy, walked once and remembered.",
    note="The cached TTL explains why a changed record does not take effect "
         "everywhere at once -- resolvers keep answering from cache until it "
         "expires, which is why a TTL is lowered BEFORE a planned change."))

register("web-request", dk.flow(
    "What one page request involves",
    [("Name resolved", "DNS returns an address"),
     ("Connection opened", "TCP handshake, then TLS"),
     ("Request sent", "a method, a path, headers"),
     ("Response returned", "a status code and a body"),
     ("Resources fetched", "each image and script in turn")],
    caption="One click, and every layer of the stack in sequence.",
    note="A page 'loading slowly' can fail at any of these steps, and they "
         "have entirely different remedies -- which is why measuring WHICH "
         "step is slow comes before changing anything."))


# ====================================================================
# Technology Element -> Security
# ====================================================================

register("cia-triad", dk.compare(
    "The three properties security protects",
    [("Confidentiality", "only the right people see it",
      ["Broken by disclosure",
       "Protected by encryption and access control",
       "The property people think of first"]),
     ("Integrity", "it has not been altered",
      ["Broken by unauthorised modification",
       "Protected by hashes and signatures",
       "Often more damaging to lose than confidentiality"]),
     ("Availability", "it is there when needed",
      ["Broken by denial of service, or by a failed disk",
       "Protected by redundancy and capacity",
       "The one an outage breaks without any attacker"])],
    caption="Every control serves one or more of these three.",
    footer="Naming which property an incident broke is the first step in "
           "nearly every security item, because it determines which controls "
           "were the relevant ones."))

register("threat-sources", dk.compare(
    "Where threats come from",
    [("External attackers", "no legitimate access",
      ["Must first get in",
       "Opportunistic, or targeted",
       "The threat most defences are aimed at"]),
     ("Insiders", "already trusted",
      ["Access is legitimate; the use is not",
       "Malicious, or simply careless",
       "Harder to detect, and more common"]),
     ("Accidents and failures", "nobody attacking",
      ["Deleted files, failed hardware, floods",
       "No intent, and the same consequences",
       "Availability and integrity both at risk"])],
    caption="Not every loss involves an attacker.",
    footer="Designs aimed only at external attackers leave the two more "
           "likely sources unaddressed, which is why controls are chosen "
           "against a risk assessment rather than against an image of a "
           "burglar."))

register("attack-surface", dk.stack(
    "Layers an attack can target",
    [("People", "phishing, pretexting, coercion"),
     ("Application", "injection, broken authentication, logic flaws"),
     ("Host", "unpatched software, weak configuration"),
     ("Network", "interception, spoofing, denial of service"),
     ("Physical", "access to the machine itself")],
    caption="Five layers, each needing its own controls.",
    numbered=False,
    right_note="DEFENCE IN DEPTH means every layer has controls, so a single "
               "failure does not become a breach. The top layer is the one "
               "technical measures address least well."))

register("malware-types", dk.compare(
    "Malicious software, by how it spreads",
    [("Virus", "attaches to something",
      ["Needs a host file or program",
       "Spreads when that host is run or shared",
       "Requires a user action somewhere"]),
     ("Worm", "spreads by itself",
      ["Self-propagating across a network",
       "Needs no user action at all",
       "Which is why it spreads so fast"]),
     ("Trojan", "pretends to be wanted",
      ["Installed willingly, under a false description",
       "Does not self-replicate",
       "Defeats technical controls via the user"])],
    caption="Three families, distinguished by propagation.",
    footer="Ransomware, spyware and bots describe what malware DOES; virus, "
           "worm and trojan describe how it ARRIVES. An item usually asks "
           "about one axis, and the two are frequently confused."))

register("symmetric-asymmetric", dk.split_planes(
    "Two kinds of encryption",
    ("Symmetric", "One shared secret key", [
        ("Encrypt", "with the shared key"),
        ("Decrypt", "with the same key"),
        ("Problem", "distributing it safely")]),
    ("Asymmetric", "A public and a private key", [
        ("Encrypt", "with the recipient's public key"),
        ("Decrypt", "with their private key"),
        ("Problem", "far slower to compute")]),
    caption="Fast but hard to distribute, against slow but distributable.",
    footer="Real systems use BOTH: asymmetric encryption to agree a symmetric "
           "key, then symmetric encryption for the data. Each covers exactly "
           "the other's weakness."))

register("digital-signature", dk.flow(
    "Signing and verifying",
    [("Hash the message", "a fixed-size digest"),
     ("Encrypt the hash", "with the SENDER's private key"),
     ("Send both", "message and signature"),
     ("Recipient hashes", "the message they received"),
     ("Decrypt the signature", "with the sender's public key"),
     ("Compare", "equal means genuine and unaltered")],
    caption="Confidentiality is not what this provides.",
    note="Signing uses the sender's PRIVATE key -- the reverse of encryption "
         "-- because only the sender holds it, and anyone with the public key "
         "can check. That reversal is what makes the signature proof of "
         "origin."))

register("hash-properties", dk.compare(
    "What a cryptographic hash guarantees",
    [("One-way", "cannot be reversed",
      ["The input cannot be recovered from the digest",
       "Which is why passwords are stored as hashes",
       "Guessing and hashing is still possible"]),
     ("Fixed length", "any input, same size out",
      ["A file and a word both hash to the same length",
       "So the digest is not a compression",
       "Comparison is always cheap"]),
     ("Collision resistant", "no two inputs match",
      ["Finding two inputs with one digest is infeasible",
       "Which is what makes it evidence of integrity",
       "A broken hash is broken exactly here"])],
    caption="Three properties, and each is relied on somewhere.",
    footer="A hash proves INTEGRITY and not identity: anyone can hash an "
           "altered file. Proving who produced it needs a signature, which is "
           "a hash plus a private key."))

register("authentication-factors", dk.compare(
    "Three kinds of evidence of identity",
    [("Something you know", "a secret",
      ["Passwords, PINs, answers",
       "Cheap, and guessable and reusable",
       "The weakest factor on its own"]),
     ("Something you have", "a token",
      ["A phone, a card, a hardware key",
       "Stolen rather than guessed",
       "Lost tokens need a recovery route"]),
     ("Something you are", "a measurement",
      ["Fingerprint, face, iris",
       "Cannot be forgotten, and cannot be changed",
       "A compromised biometric is compromised forever"])],
    caption="Multi-factor means factors from DIFFERENT rows.",
    footer="A password and a security question are both things you know, so "
           "requiring both is not multi-factor authentication -- one theft "
           "of a secret gets both."))

register("access-control-models", dk.compare(
    "Who decides what is permitted",
    [("Discretionary", "the owner decides",
      ["Whoever owns a resource grants access to it",
       "Flexible, and inconsistent across an estate",
       "How ordinary file sharing works"]),
     ("Mandatory", "the system decides",
      ["Labels and clearances, centrally set",
       "Owners cannot override the policy",
       "Used where classification is legally required"]),
     ("Role-based", "your job decides",
      ["Permissions attach to roles, users to roles",
       "Scales, and audits well",
       "The usual answer in a business system"])],
    caption="Three models, in increasing order of manageability at scale.",
    footer="Role-based control is what makes LEAST PRIVILEGE administrable: "
           "granting a role rather than a list of permissions is the only "
           "version anybody maintains correctly over years."))

register("risk-process", dk.cycle(
    "Managing information risk",
    [("Identify assets", "what matters"),
     ("Assess risk", "likelihood x impact"),
     ("Select controls", "treat, transfer, accept, avoid"),
     ("Implement", "and document"),
     ("Monitor and review", "conditions change")],
    caption="A cycle, because the threat landscape does not hold still.",
    centre="ISMS"))

register("risk-treatment", dk.compare(
    "Four things to do about a risk",
    [("Mitigate", "reduce it",
      ["Add controls that lower likelihood or impact",
       "The default response",
       "Costs money, and never reaches zero"]),
     ("Transfer", "make it someone else's",
      ["Insurance, or a contracted provider",
       "The financial loss moves; the reputation does not",
       "Accountability cannot be outsourced"]),
     ("Accept", "live with it",
      ["A deliberate, documented decision",
       "Correct when the control costs more than the risk",
       "Only valid if somebody with authority accepted it"])],
    caption="Avoidance -- not doing the risky thing at all -- is the fourth.",
    footer="ACCEPTANCE is a legitimate treatment and is not the same as "
           "ignoring a risk. The difference is whether anybody with authority "
           "knowingly made the decision."))

register("defence-layers", dk.tiers(
    "Controls by when they act",
    [("Preventive", ["Access control", "Encryption", "Patching", "Training"]),
     ("Detective", ["Monitoring", "Logging", "Intrusion detection", "Audit"]),
     ("Corrective", ["Backups", "Incident response", "Patch after the fact"])],
    caption="Three timings: before, during, and after.",
    footer="A programme of only preventive controls cannot tell you when one "
           "failed. Detection is what converts an undetected breach into an "
           "incident somebody handles."))

register("incident-response", dk.flow(
    "Responding to an incident",
    [("Prepare", "before anything happens"),
     ("Detect and analyse", "is this real, and what is it"),
     ("Contain", "stop it spreading"),
     ("Eradicate", "remove the cause"),
     ("Recover", "restore service, and watch"),
     ("Review", "what should change")],
    caption="Six phases, and the first happens long before the incident.",
    note="CONTAINMENT precedes eradication for a reason: stopping the spread "
         "is urgent, while identifying and removing every trace is slow. "
         "Reversing the order lets the incident grow during analysis."))

register("firewall-placement", dk.hub_spoke(
    "Segmenting a network",
    "Firewall",
    ["Internet", "DMZ -- public servers", "Internal network", "Management"],
    caption="Public services sit apart from internal systems.",
    hub_note="policy between every pair"))

register("crypto-uses", dk.tiers(
    "What each cryptographic tool is FOR",
    [("Confidentiality", ["Symmetric encryption", "Asymmetric encryption"]),
     ("Integrity", ["Hash functions", "Message authentication codes"]),
     ("Authenticity and non-repudiation", ["Digital signatures",
                                           "Certificates"])],
    caption="Matching the tool to the property is most of the category.",
    footer="A hash gives integrity and not authenticity, since anyone can "
           "hash. Encryption gives confidentiality and not integrity, since "
           "ciphertext can be altered. Only a signature gives origin."))


register("cc-terms", dk.stack(
    "How the Common Criteria terms relate",
    [("Protection profile", "requirements for a CLASS of product"),
     ("Security target", "what THIS product claims to do"),
     ("Target of evaluation", "the exact product, version, configuration"),
     ("Assurance level", "how rigorously the claim was checked")],
    caption="Four terms, and only the last is a measure of anything.",
    numbered=False,
    right_note="The security target is written by the DEVELOPER, so a "
               "certificate says the product does what it claimed. That is a "
               "different statement from saying it is secure."))

register("eal-scale", dk.tiers(
    "The assurance levels, grouped by what they mean",
    [("EAL1-3", ["Functionally tested", "Structurally tested",
                 "Methodically checked"]),
     ("EAL4", ["Methodically designed, tested and reviewed",
               "The commercial ceiling"]),
     ("EAL5-7", ["Semi-formally designed", "Semi-formally verified",
                 "Formally verified"])],
    caption="Seven levels of examination depth, not of product strength.",
    footer="EAL4 is where commercial evaluation stops because higher levels "
           "require formal methods whose cost rises far faster than the "
           "confidence gained -- an economic boundary, not a technical one."))


# ====================================================================
# Development Technology
# ====================================================================

register("development-lifecycle", dk.flow(
    "The development life cycle",
    [("System requirements", "what the business needs"),
     ("System architecture", "hardware and software allocated"),
     ("Software requirements", "what the software must do"),
     ("Software design", "how it will do it"),
     ("Construction", "code, review, unit test"),
     ("Integration and testing", "put together, and proved"),
     ("Operation and maintenance", "most of the total cost")],
    caption="Each stage takes the previous one as its input.",
    note="The last stage costs more than everything before it combined over a "
         "system's life, which is why decisions taken early are judged by "
         "what they do to maintenance rather than to the build."))

register("requirements-types", dk.compare(
    "Two kinds of requirement",
    [("Functional", "what it must do",
      ["Specific behaviours and calculations",
       "Testable by exercising the function",
       "What users describe when asked"]),
     ("Non-functional", "how well it must do it",
      ["Performance, availability, security, usability",
       "Testable only against a stated figure",
       "What users assume without saying"]),
     ("Constraints", "what is fixed regardless",
      ["Platforms, standards, budgets, deadlines",
       "Not negotiable within the project",
       "Shapes the design before it begins"])],
    caption="Three things a requirements document must separate.",
    footer="Non-functional requirements are the ones omitted and the ones "
           "that cause redesign. 'Fast' is not a requirement; 'a response "
           "within two seconds for 95% of requests at 500 concurrent users' "
           "is one that can be tested."))

register("cost-of-defect", dk.tiers(
    "What a defect costs, by when it is found",
    [("Requirements", ["Change a sentence"]),
     ("Design", ["Change a document, and the sentence"]),
     ("Construction", ["Change code, design and requirement"]),
     ("Testing", ["All of the above, plus retesting"]),
     ("Production", ["All of it, plus the damage already done"])],
    caption="The same defect, found at five different moments.",
    footer="The cost rises by roughly an order of magnitude per stage, which "
           "is the entire economic argument for reviews, static analysis and "
           "early testing -- all of which look like delay and are not."))

register("v-model", dk.split_planes(
    "Each specification has a matching test",
    ("Specifying -- going down", "Each level defines the next", [
        ("System requirements", "what the business needs"),
        ("Software requirements", "what the software must do"),
        ("Design", "how it is structured")]),
    ("Verifying -- coming up", "Each level tested against its own spec", [
        ("Unit test", "against the design"),
        ("Integration test", "against the software requirements"),
        ("Acceptance test", "against the business need")]),
    caption="The V-model, and the pairing that makes it useful.",
    footer="The pairing is the point rather than the shape: acceptance "
           "testing checks the BUSINESS requirement and unit testing checks "
           "the design, so a test at the wrong level proves the wrong thing."))

register("coupling-cohesion", dk.split_planes(
    "The two measures of a good decomposition",
    ("Coupling -- want it LOW", "Between modules", [
        ("Tight", "a change here forces a change there"),
        ("Loose", "modules can be changed alone"),
        ("Test", "can you understand one without the others")]),
    ("Cohesion -- want it HIGH", "Within a module", [
        ("Weak", "unrelated things bundled together"),
        ("Strong", "everything serves one purpose"),
        ("Test", "can you name what it does in one phrase")]),
    caption="Low coupling and high cohesion, always in that pairing.",
    footer="They tend to move together. Splitting a module by PURPOSE raises "
           "cohesion and usually lowers coupling; splitting it arbitrarily "
           "does the reverse of both."))

register("uml-diagram-families", dk.compare(
    "UML diagrams, by what they show",
    [("Structure", "what exists",
      ["Class -- types and their relationships",
       "Object -- one snapshot of instances",
       "Component and deployment -- the parts, and where they run"]),
     ("Behaviour", "what happens",
      ["Use case -- who wants what from the system",
       "Activity -- the flow of a process",
       "State machine -- how one object reacts over time"]),
     ("Interaction", "who says what to whom",
      ["Sequence -- messages in time order",
       "Communication -- the same, arranged by structure"])],
    caption="Three families, and the question each answers.",
    footer="An item usually gives a purpose and asks which diagram. Match the "
           "QUESTION: what exists, what happens over time, or who calls "
           "whom."))

register("class-relationships", dk.compare(
    "How classes relate",
    [("Association", "knows about",
      ["A plain relationship between two classes",
       "Neither owns the other",
       "The default, and the weakest"]),
     ("Aggregation", "has, loosely",
      ["A whole with parts",
       "The parts survive the whole",
       "A team and its members"]),
     ("Composition", "has, and owns",
      ["A whole with parts it controls",
       "The parts do not outlive the whole",
       "An order and its order lines"]),
     ("Generalisation", "is a kind of",
      ["Inheritance -- a subtype of a supertype",
       "Everything true of the parent is true of the child",
       "A saving account and an account"])],
    caption="Four relationships in increasing order of commitment.",
    footer="Aggregation against composition is the examined pair, and the "
           "test is lifetime: delete the whole, and ask whether the parts "
           "still make sense on their own."))

register("test-levels", dk.stack(
    "Testing, level by level",
    [("Acceptance testing", "does it meet the business need"),
     ("System testing", "does the whole system work as specified"),
     ("Integration testing", "do the parts work together"),
     ("Unit testing", "does each part work alone")],
    caption="Each level assumes the one below it passed.",
    numbered=False,
    right_note="Levels are about SCOPE. Types -- functional, performance, "
               "security, usability -- are about what is being checked, and "
               "any type can be applied at any level."))

register("blackbox-whitebox", dk.split_planes(
    "Two ways of designing test cases",
    ("Black box", "From the specification", [
        ("Sees", "inputs and outputs only"),
        ("Techniques", "equivalence classes, boundary values"),
        ("Misses", "untested paths inside")]),
    ("White box", "From the code", [
        ("Sees", "the internal structure"),
        ("Techniques", "statement and branch coverage"),
        ("Misses", "requirements never implemented")]),
    caption="Neither finds what the other finds.",
    footer="White box testing cannot find a MISSING function, because there "
           "is no code to cover. Black box testing cannot find an untested "
           "path. This is why both are used rather than one."))

register("boundary-values", dk.fields(
    "Where defects actually cluster",
    [("Below", "invalid", 20, dk.ORANGE),
     ("At the boundary", "the risky values", 12, dk.DEEP),
     ("Above", "valid", 20, dk.BLUE)],
    caption="Test at the boundary, just below it, and just above.",
    footer="Off-by-one errors and wrong comparison operators are among the "
           "commonest defects, and both live exactly at the boundary -- so "
           "testing the middle of a range finds almost nothing."))

register("integration-strategies", dk.compare(
    "Putting the parts together",
    [("Big bang", "all at once",
      ["Everything combined, then tested",
       "No stubs or drivers needed",
       "A failure could be anywhere"]),
     ("Top-down", "from the top",
      ["High levels first, with STUBS below",
       "The overall design is proved early",
       "Low-level defects surface late"]),
     ("Bottom-up", "from the bottom",
      ["Low levels first, with DRIVERS above",
       "Foundations proved early",
       "Design problems surface late"])],
    caption="Three strategies, and what each defers.",
    footer="A STUB stands in for something not yet written BELOW; a DRIVER "
           "calls something not yet integrated ABOVE. Top-down needs stubs, "
           "bottom-up needs drivers -- which is the pairing items ask for."))

register("regression-risk", dk.flow(
    "Why a working system breaks",
    [("A change is made", "for a good reason"),
     ("Something else depended on the old behaviour", "unnoticed"),
     ("That path is not retested", "it was not what changed"),
     ("The defect ships", "in a part nobody touched")],
    caption="Regression: breaking what already worked.",
    note="This is what makes an automated test suite worth its cost. Manual "
         "regression testing of a whole system after every change is not "
         "affordable, so in practice it is not done -- and the defects arrive "
         "exactly here."))

register("process-models", dk.compare(
    "Three ways of arranging the work",
    [("Waterfall", "stages, in order",
      ["Each stage completed before the next",
       "Predictable when requirements are stable",
       "Change late is very expensive"]),
     ("Iterative and incremental", "repeated cycles",
      ["Something working, early and often",
       "Feedback changes what comes next",
       "Needs an engaged customer"]),
     ("Agile", "short cycles, adaptive",
      ["Working software over documentation",
       "Requirements expected to change",
       "Scope varies; time and team do not"])],
    caption="Not a progression -- three answers to different situations.",
    footer="The choice follows the REQUIREMENTS. Stable and well understood "
           "favours a plan-driven approach; uncertain or contested favours "
           "iteration, because discovering the requirement is the project's "
           "main risk."))

register("agile-cycle", dk.cycle(
    "One agile iteration",
    [("Plan", "select from the backlog"),
     ("Build", "a working increment"),
     ("Review", "with the customer"),
     ("Reflect", "improve the process")],
    caption="A short fixed period, repeated.",
    centre="1-4 weeks"))

register("configuration-management", dk.flow(
    "Controlling what changes",
    [("Identify", "which items are controlled"),
     ("Baseline", "an approved, known state"),
     ("Control changes", "request, assess, approve"),
     ("Account for status", "what version is where"),
     ("Audit", "does the record match reality")],
    caption="Five activities, and the middle one is what people notice.",
    note="A BASELINE is the point of the whole exercise: a known state to "
         "return to, and the thing every change is measured against. Without "
         "one, 'what changed' has no answer."))

register("branching-merge", dk.split_planes(
    "Working in parallel",
    ("Branching", "Work isolated from the mainline", [
        ("Start", "take a copy of the baseline"),
        ("Work", "changes affect nobody else"),
        ("Risk", "diverging further every day")]),
    ("Merging", "Bringing it back", [
        ("Combine", "both sets of changes"),
        ("Conflict", "where both touched the same lines"),
        ("Cost", "grows with how long the branch lived")]),
    caption="Isolation has a price, and it is paid at the merge.",
    footer="The longer a branch lives, the more expensive the merge -- which "
           "is the whole argument for integrating frequently rather than "
           "working alone for weeks and reconciling at the end."))

register("licence-obligations", dk.compare(
    "What a licence requires in return",
    [("Proprietary", "use, under terms",
      ["Source usually not provided",
       "Redistribution normally prohibited",
       "Obligations are contractual"]),
     ("Permissive open source", "use freely, attribute",
      ["Source available, few conditions",
       "Usable in closed products",
       "Attribution is the main obligation"]),
     ("Copyleft open source", "use, and share alike",
      ["Derived works must carry the same licence",
       "Which can reach the whole product",
       "The obligation the examination asks about"])],
    caption="Three families, distinguished by what they demand back.",
    footer="COPYLEFT is the one with a business consequence: including such a "
           "component in a product can oblige the whole derived work to be "
           "licensed the same way, which is why component licences are "
           "reviewed before use rather than after."))

register("dev-environments", dk.flow(
    "From a developer's machine to production",
    [("Development", "where it is written"),
     ("Test", "where it is proved"),
     ("Staging", "as close to production as possible"),
     ("Production", "where it matters")],
    caption="Four environments, each closer to reality than the last.",
    note="Staging exists because differences between environments are "
         "themselves a defect source. 'It worked in test' usually means test "
         "differed from production in a way nobody had written down."))


# ====================================================================
# Project Management
# ====================================================================

register("project-constraints", dk.split_planes(
    "The constraints, and what happens when one moves",
    ("The three that are traded", "Fix any two; the third follows", [
        ("Scope", "how much is delivered"),
        ("Time", "by when"),
        ("Cost", "for how much")]),
    ("What absorbs the pressure", "When none is allowed to move", [
        ("Quality", "silently reduced"),
        ("Risk", "silently accepted"),
        ("People", "silently exhausted")]),
    caption="Something always gives.",
    footer="The right-hand column is what happens when a project refuses to "
           "move any of the left-hand three. None of those three is a "
           "decision anybody made, and all of them are discovered late."))

register("process-groups", dk.cycle(
    "The project process groups",
    [("Initiating", "authorise it"),
     ("Planning", "work out how"),
     ("Executing", "do the work"),
     ("Monitoring and controlling", "compare and correct"),
     ("Closing", "finish it properly")],
    caption="Groups, not stages -- they repeat and overlap.",
    centre="the project"))

register("stakeholder-grid", dk.compare(
    "Stakeholders, by influence and interest",
    [("High influence, high interest", "manage closely",
      ["Involve in decisions",
       "Consult before acting",
       "The people whose objection stops the project"]),
     ("High influence, low interest", "keep satisfied",
      ["Not interested until something affects them",
       "Then extremely interested",
       "Brief enough that they are never surprised"]),
     ("Low influence, high interest", "keep informed",
      ["Care a great deal and cannot compel",
       "Often the actual users",
       "A valuable source of information"])],
    caption="Effort matched to influence and interest.",
    footer="The second group is the one projects mishandle. Somebody with "
           "authority who has not been kept informed becomes an obstacle at "
           "the worst moment, purely because the first thing they heard was "
           "a problem."))

register("wbs-tree", dk.tiers(
    "Decomposing the work",
    [("Project", ["The whole deliverable"]),
     ("Major deliverables", ["Subsystem A", "Subsystem B", "Training"]),
     ("Components", ["Design", "Build", "Test"]),
     ("Work packages", ["Estimable, assignable, trackable"])],
    caption="Down to the level where a package can be estimated and owned.",
    footer="A WORK PACKAGE is the bottom: small enough to estimate with "
           "confidence and to assign to one owner. Decomposing further "
           "produces tracking overhead without improving control."))

register("critical-path", dk.flow(
    "Finding the critical path",
    [("List activities", "and their durations"),
     ("Establish dependencies", "what must precede what"),
     ("Forward pass", "earliest each can start and finish"),
     ("Backward pass", "latest each can start without delaying the end"),
     ("Float = latest - earliest", "the slack in each activity"),
     ("Critical path", "the activities with zero float")],
    caption="Six steps, and the last one names the activities that matter.",
    note="An activity on the critical path delays the whole project if it "
         "slips by a day. An activity with five days of float can slip four "
         "days and change nothing -- which is why the two are managed "
         "completely differently."))

register("pert-estimate", dk.fields(
    "A three-point estimate",
    [("Optimistic", "everything goes well", 14, dk.BLUE),
     ("Most likely", "the realistic case", 22, dk.DEEP),
     ("Pessimistic", "things go wrong", 18, dk.ORANGE)],
    caption="PERT weights the most likely case four times.",
    footer="(O + 4M + P) / 6 gives an expected duration that accounts for "
           "the pessimistic tail without letting it dominate -- which a "
           "simple average would not do."))

register("gantt-view", dk.timeline(
    "A schedule, seen two ways",
    "Network diagram -- what depends on what",
    "Gantt chart -- what happens when",
    caption="The same schedule, answering different questions.",
    footer="A network diagram shows DEPENDENCIES and reveals the critical "
           "path. A Gantt chart shows CALENDAR TIME and reveals overlaps and "
           "resource clashes. Neither replaces the other."))

register("earned-value", dk.compare(
    "Three numbers, and what each pair tells you",
    [("Planned value", "what should have been done",
      ["The budgeted cost of the work scheduled",
       "Where the plan said you would be",
       "The baseline everything is measured against"]),
     ("Earned value", "what has been done",
      ["The budgeted cost of the work actually completed",
       "Progress measured in money, not in opinion",
       "The number that makes the others meaningful"]),
     ("Actual cost", "what it cost",
      ["What was really spent to get there",
       "Compared with earned value, gives efficiency",
       "Alone, it says nothing about progress"])],
    caption="Progress and spending, separated.",
    footer="SCHEDULE variance is earned value minus planned value; COST "
           "variance is earned value minus actual cost. Negative is behind, "
           "or over. Both need EARNED value, which is why 'percent complete' "
           "by opinion cannot substitute."))

register("risk-matrix", dk.compare(
    "Ranking risks",
    [("High probability, high impact", "act now",
      ["Mitigate, or avoid the activity",
       "Where the effort goes first",
       "Escalate if it cannot be reduced"]),
     ("Low probability, high impact", "prepare",
      ["A contingency plan, and a trigger",
       "Transfer where that is possible",
       "The category most often ignored"]),
     ("High probability, low impact", "absorb",
      ["Expect it and plan around it",
       "Frequently accepted deliberately",
       "Watch for accumulation"])],
    caption="Probability times impact, and the response each combination "
            "argues for.",
    footer="The second column is where projects are actually damaged. A "
           "rare, severe event ignored because it is unlikely is what "
           "contingency planning exists for -- and unlikely is not never."))

register("risk-process-pm", dk.flow(
    "Managing a project risk",
    [("Identify", "what could go wrong"),
     ("Analyse", "how likely, how bad"),
     ("Plan a response", "avoid, mitigate, transfer, accept"),
     ("Assign an owner", "somebody watching it"),
     ("Monitor", "has it changed, has it happened"),
     ("Act", "when the trigger occurs")],
    caption="A cycle repeated throughout the project, not an opening "
            "exercise.",
    note="A risk register written once and never revisited describes the "
         "project as it was imagined. New risks appear and old ones change "
         "as the work proceeds, which is why review is scheduled."))

register("quality-cost", dk.split_planes(
    "What quality costs",
    ("Cost of conformance", "Spent to prevent defects", [
        ("Prevention", "training, reviews, good process"),
        ("Appraisal", "testing, inspection, audit"),
        ("Both", "chosen, and predictable")]),
    ("Cost of non-conformance", "Spent because of defects", [
        ("Internal failure", "rework before delivery"),
        ("External failure", "rework, and the damage done"),
        ("Both", "unplanned, and far larger")]),
    caption="Every project pays one or the other.",
    footer="External failure is the most expensive box by a wide margin, "
           "because it includes the harm caused before anybody noticed. "
           "Prevention is cheap in comparison, and it is what gets cut."))

register("procurement-contracts", dk.compare(
    "Contract types, by who carries the risk",
    [("Fixed price", "the supplier carries it",
      ["One price for a defined scope",
       "Needs the scope to be genuinely defined",
       "Change is expensive, by design"]),
     ("Time and materials", "the buyer carries it",
      ["Paid for effort actually expended",
       "Suits uncertain or evolving work",
       "Needs active management, or it drifts"]),
     ("Cost reimbursable", "shared, with a fee",
      ["Costs repaid, plus an agreed fee",
       "Used where the work cannot be scoped",
       "The buyer must control the costs"])],
    caption="Risk does not disappear; it is allocated.",
    footer="A fixed price with an undefined scope is the worst of both: the "
           "supplier prices the uncertainty, and every clarification becomes "
           "a change request."))

register("communication-channels", dk.hub_spoke(
    "Why communication cost grows",
    "n(n-1)/2",
    ["5 people = 10 channels", "10 people = 45", "20 people = 190",
     "50 people = 1,225"],
    caption="Channels grow with the SQUARE of the team size.",
    hub_note="which is why large teams need structure"))

register("team-development", dk.flow(
    "How a team comes together",
    [("Forming", "polite, and unsure"),
     ("Storming", "disagreement surfaces"),
     ("Norming", "ways of working settle"),
     ("Performing", "productive, and self-managing")],
    caption="Four stages every new team passes through.",
    note="STORMING is a stage rather than a failure. A team that never "
         "disagrees has not settled how it works; it is deferring the "
         "conversation, usually until something is at stake."))


# ====================================================================
# Service Management
# ====================================================================

register("service-lifecycle", dk.cycle(
    "The service lifecycle",
    [("Strategy", "which services, and why"),
     ("Design", "how they will work"),
     ("Transition", "into live operation"),
     ("Operation", "day-to-day delivery"),
     ("Continual improvement", "measured, and adjusted")],
    caption="A cycle, since a service outlives every project that built it.",
    centre="the service"))

register("project-vs-service", dk.split_planes(
    "Two ways of thinking about the same system",
    ("A project", "Temporary, and finishes", [
        ("Succeeds by", "delivering the objective"),
        ("Measured at", "the end"),
        ("Ends", "and the team disperses")]),
    ("A service", "Continuing, and does not", [
        ("Succeeds by", "meeting agreed levels, every day"),
        ("Measured", "continuously"),
        ("Ends", "only when it is retired")]),
    caption="Delivery is a moment; service is a state.",
    footer="Most of a system's life is the right-hand column, and most of "
           "its cost. A project that hands over something unrunnable has "
           "optimised the smaller half."))

register("incident-vs-problem", dk.compare(
    "Four processes that are constantly confused",
    [("Incident management", "restore service NOW",
      ["An unplanned interruption or degradation",
       "Success is service restored, by any means",
       "A workaround is a complete success here"]),
     ("Problem management", "find the CAUSE",
      ["Why did that incident happen",
       "Success is the cause removed",
       "Works on the incidents that already happened"]),
     ("Change management", "control WHAT CHANGES",
      ["Assess, authorise, schedule, review",
       "Success is change without disruption",
       "Most incidents follow a change"])],
    caption="Restore, understand, control.",
    footer="INCIDENT and PROBLEM is the pair examined most. Restoring "
           "service with a workaround closes the incident and leaves the "
           "problem open -- and treating them as one process means causes "
           "are never investigated."))

register("incident-flow", dk.flow(
    "An incident, end to end",
    [("Detect and log", "monitoring, or a user"),
     ("Categorise and prioritise", "impact x urgency"),
     ("Investigate and diagnose", "what is actually wrong"),
     ("Resolve and recover", "service restored"),
     ("Close", "with the user agreeing it is resolved"),
     ("Feed to problem management", "if the cause is unknown")],
    caption="Restoration is the goal; the cause is somebody else's process.",
    note="PRIORITY comes from impact multiplied by urgency, not from who is "
         "asking. Impact is how much of the business is affected; urgency is "
         "how fast the damage grows."))

register("sla-structure", dk.stack(
    "Three layers of service agreement",
    [("SLA", "with the business -- what they receive"),
     ("OLA", "with internal teams -- what each contributes"),
     ("Underpinning contract", "with suppliers -- what they must provide")],
    caption="Each layer must support the one above it.",
    numbered=False,
    right_note="An SLA promising four-hour restoration, supported by a "
               "supplier contract offering next-business-day, cannot be met. "
               "The layers are checked against each other or the top one is "
               "fiction."))

register("availability-measures", dk.fields(
    "Where the time goes",
    [("Uptime", "service available", 40, dk.BLUE),
     ("Planned downtime", "agreed maintenance", 6, dk.DEEP),
     ("Unplanned downtime", "incidents", 4, dk.ORANGE)],
    caption="Availability is uptime over the agreed service period.",
    footer="Whether PLANNED downtime counts against availability is a "
           "definition in the agreement rather than a fact -- and it is the "
           "commonest source of two parties disagreeing about whether a "
           "target was met."))

register("continuity-measures", dk.timeline(
    "Recovering from a disaster",
    "RPO -- how much data may be lost",
    "RTO -- how quickly service must return",
    caption="Two objectives, measured backwards and forwards from the "
            "incident.",
    footer="RPO looks BACKWARD from the failure to the last usable backup; "
           "RTO looks FORWARD to service resuming. They buy different things "
           "-- replication frequency, and standby capacity."))

register("data-centre-facilities", dk.compare(
    "What a data centre actually provides",
    [("Power", "and its continuity",
      ["Dual feeds, from separate substations where possible",
       "Uninterruptible supply for the seconds before generators start",
       "Generators, and fuel for them"]),
     ("Cooling", "because equipment produces heat",
      ["Capacity matched to the load, with redundancy",
       "Hot and cold aisle separation",
       "The commonest cause of an unplanned shutdown"]),
     ("Physical security", "and environmental protection",
      ["Access control, logged and reviewed",
       "Fire detection and suppression that spares equipment",
       "Water detection, since leaks come from cooling"])],
    caption="Three facilities every other control assumes.",
    footer="COOLING failure takes a data centre down faster than power "
           "failure does, because equipment overheats in minutes while "
           "batteries last longer than that. It is also the failure people "
           "plan for least."))

register("audit-process", dk.flow(
    "Conducting an audit",
    [("Plan", "scope, objectives, criteria"),
     ("Gather evidence", "observe, test, inspect, interview"),
     ("Evaluate", "against the stated criteria"),
     ("Report", "findings, with evidence"),
     ("Follow up", "was anything actually done")],
    caption="Five stages, and the last is what makes the others matter.",
    note="An audit whose findings are never followed up has documented "
         "problems rather than corrected them -- and it teaches everybody "
         "that findings can be safely ignored, which makes the next audit "
         "worth less than this one."))

register("internal-control", dk.tiers(
    "Layers of internal control",
    [("Control environment", ["Tone, culture, and whether rules are "
                              "enforced"]),
     ("Risk assessment", ["What could go wrong, and how much it matters"]),
     ("Control activities", ["Authorisation", "Separation of duties",
                             "Reconciliation", "Access control"]),
     ("Information and communication", ["Who knows what, and when"]),
     ("Monitoring", ["Does any of it still work"])],
    caption="Five components, of which the first determines the rest.",
    footer="The CONTROL ENVIRONMENT is the layer that decides whether the "
           "others are real. Controls that senior people routinely bypass "
           "are documented rather than operating, and an auditor tests "
           "operation rather than documentation."))

# ====================================================================
# System Strategy
# ====================================================================

register("enterprise-architecture", dk.stack(
    "The layers of enterprise architecture",
    [("Business architecture", "what the organisation does"),
     ("Data architecture", "what information it needs"),
     ("Application architecture", "what systems support that"),
     ("Technology architecture", "what they run on")],
    caption="Each layer exists to serve the one above it.",
    numbered=False,
    right_note="Reading downward is the discipline. A technology decision "
               "taken without reference to the business it serves is the "
               "commonest architectural failure, and it is invisible until "
               "the business changes."))

register("as-is-to-be", dk.split_planes(
    "Planning a change",
    ("AS-IS", "How things work now", [
        ("Established by", "observing what actually happens"),
        ("Reveals", "the workarounds nobody mentions"),
        ("Risk", "documenting the official process instead")]),
    ("TO-BE", "How they should work", [
        ("Designed from", "the business objective"),
        ("Reveals", "what must change to get there"),
        ("Risk", "designing for an as-is that was wrong")]),
    caption="The gap between them is the work.",
    footer="Skipping the as-is analysis produces a to-be design that solves "
           "an imagined problem. The workarounds people no longer notice are "
           "requirements in disguise."))

register("process-modelling", dk.flow(
    "Modelling a business process",
    [("Identify the process", "and where it starts and ends"),
     ("Identify the actors", "who does each step"),
     ("Map the steps", "in the order they really happen"),
     ("Find the decisions", "and what determines each"),
     ("Measure", "time, cost and volume at each step"),
     ("Analyse", "delays, duplication, and steps adding nothing")],
    caption="Six steps, and the fifth is what makes the sixth possible.",
    note="Without measurement, process improvement is opinion. The step "
         "everybody complains about is frequently not the one consuming the "
         "time, and only measuring distinguishes them."))

register("cloud-service-models", dk.tiers(
    "Who manages what",
    [("On premises", ["You manage everything"]),
     ("Infrastructure as a service", ["You manage the OS and above",
                                      "Provider manages the hardware"]),
     ("Platform as a service", ["You manage the application and data",
                                "Provider manages the platform"]),
     ("Software as a service", ["You manage your data and users",
                                "Provider manages everything else"])],
    caption="A ladder of responsibility transferred to the provider.",
    footer="Responsibility for the DATA never transfers. Whatever the model, "
           "the organisation remains accountable for the information it "
           "holds -- which is the row every one of these items turns on."))

register("investment-appraisal", dk.compare(
    "Comparing investments",
    [("Payback period", "how long until it repays",
      ["Simple, and widely understood",
       "Ignores everything after the payback point",
       "Favours short-term projects systematically"]),
     ("Return on investment", "gain against cost",
      ["A ratio, so different sizes compare",
       "Ignores WHEN the returns arrive",
       "Easy to compute and easy to misuse"]),
     ("Net present value", "future money, valued today",
      ["Accounts for the timing of returns",
       "Requires a discount rate somebody chose",
       "The technically correct comparison"])],
    caption="Three measures, in increasing order of correctness and effort.",
    footer="NET PRESENT VALUE accounts for the fact that money arriving in "
           "five years is worth less than money arriving now. Payback and "
           "ROI both ignore timing, which is why they favour the wrong "
           "projects in predictable ways."))


# ====================================================================
# Business Strategy
# ====================================================================

register("swot-grid", dk.compare(
    "Analysing a position",
    [("Internal", "strengths and weaknesses",
      ["What the organisation is good and bad at",
       "Within its own control to change",
       "Assessed relative to competitors, not absolutely"]),
     ("External", "opportunities and threats",
      ["What the environment offers or presents",
       "Outside the organisation's control",
       "The same fact can be either, depending on capability"]),
     ("The point", "matching them",
      ["Strengths applied to opportunities",
       "Weaknesses shielded from threats",
       "A list without that matching has analysed nothing"])],
    caption="Internal against external, and why the pairing matters.",
    footer="A SWOT that lists four columns and stops has produced a "
           "description. The value is in the matching -- which strength "
           "addresses which opportunity, and which weakness is exposed to "
           "which threat."))

register("competitive-forces", dk.hub_spoke(
    "What determines an industry's profitability",
    "Rivalry among existing firms",
    ["Threat of new entrants", "Threat of substitutes",
     "Bargaining power of buyers", "Bargaining power of suppliers"],
    caption="Five forces shaping how much profit an industry can sustain.",
    hub_note="the intensity of competition"))

register("product-portfolio", dk.compare(
    "Products by growth and share",
    [("High growth", "invest or exit",
      ["High share -- fund it, it is the future",
       "Low share -- decide: invest heavily, or leave",
       "Both consume cash"]),
     ("Low growth", "harvest or divest",
      ["High share -- the cash generator funding the rest",
       "Low share -- little prospect, releasing resources",
       "Both are decisions, not descriptions"]),
     ("The purpose", "allocate between them",
      ["Cash from mature products funds growing ones",
       "A portfolio of only one kind is unbalanced",
       "The grid is a prompt to decide, not an answer"])],
    caption="Growth against share, and what each combination argues for.",
    footer="The grid's value is forcing a DECISION about each product. Its "
           "weakness is treating market share as the only measure of "
           "position, which is why it prompts analysis rather than "
           "concluding it."))

register("marketing-mix", dk.tiers(
    "The marketing mix",
    [("Product", ["What is offered, and what it does for the buyer"]),
     ("Price", ["What is charged, and how that positions it"]),
     ("Place", ["How it reaches the buyer"]),
     ("Promotion", ["How the buyer learns it exists"])],
    caption="Four decisions that must be consistent with one another.",
    footer="Consistency is what the mix is for. A premium product sold "
           "cheaply through discount channels contradicts itself, and buyers "
           "read the contradiction as a signal about quality."))

register("value-chain", dk.flow(
    "Where value is added",
    [("Inbound logistics", "getting materials in"),
     ("Operations", "making the thing"),
     ("Outbound logistics", "getting it out"),
     ("Marketing and sales", "selling it"),
     ("Service", "supporting it afterwards")],
    caption="Primary activities, supported by procurement, technology, human "
            "resources and infrastructure.",
    note="The purpose is finding where the organisation adds value that "
         "competitors do not -- which is where investment belongs, and which "
         "is rarely where costs are highest."))

register("business-systems", dk.compare(
    "Four enterprise system families",
    [("ERP", "one set of records",
      ["Finance, manufacturing, HR and more, integrated",
       "One version of each fact across the organisation",
       "Implementation means changing processes to fit"]),
     ("SCM and CRM", "outward-facing",
      ["SCM coordinates suppliers, inventory and distribution",
       "CRM records every interaction with a customer",
       "Both connect the organisation to somebody outside it"]),
     ("BI", "understanding what happened",
      ["Draws on the others' data",
       "Reporting and analysis rather than transactions",
       "Depends entirely on the quality of what feeds it"])],
    caption="Four families, distinguished by what they are for.",
    footer="ERP's defining property is INTEGRATION: one record, used by "
           "every function. That is its value and its difficulty, since it "
           "requires the whole organisation to agree how things are "
           "recorded."))

register("ec-models", dk.compare(
    "Electronic commerce by who trades with whom",
    [("B2C", "business to consumer",
      ["Many small transactions",
       "Consumer protection law applies",
       "Marketing and payment convenience dominate"]),
     ("B2B", "business to business",
      ["Fewer, larger transactions",
       "Negotiated terms and credit arrangements",
       "Integration between systems matters more"]),
     ("C2C and others", "consumers and government",
      ["C2C -- a platform enabling consumers to trade",
       "The platform's role is trust rather than supply",
       "G2C and G2B describe government services"])],
    caption="Four models, distinguished by the parties.",
    footer="The party determines the law. Consumer protection rules apply to "
           "B2C and generally not to B2B, which is why the same transaction "
           "carries different obligations depending on who is buying."))

register("production-systems", dk.compare(
    "Approaches to production",
    [("Make to stock", "produce, then sell",
      ["Products available immediately",
       "Inventory carried, and it may not sell",
       "Suits predictable demand"]),
     ("Make to order", "sell, then produce",
      ["No finished inventory risk",
       "The customer waits",
       "Suits variety and unpredictable demand"]),
     ("Just in time", "produce as needed",
      ["Inventory minimised throughout",
       "Requires reliable supply and stable processes",
       "A disruption propagates immediately"])],
    caption="Three approaches trading inventory against responsiveness.",
    footer="JUST IN TIME removes the inventory that was absorbing "
           "variability, so it requires the variability to have been removed "
           "first. Applied to an unstable process, it converts a hidden "
           "problem into a visible stoppage."))

register("or-techniques", dk.compare(
    "Techniques for deciding under constraint",
    [("Linear programming", "optimise within limits",
      ["Maximise or minimise something",
       "Subject to stated constraints",
       "Suits allocation with measurable trade-offs"]),
     ("Queueing and simulation", "understand waiting",
      ["Arrival and service rates determine queues",
       "Simulation where the mathematics is intractable",
       "Suits capacity and staffing decisions"]),
     ("Decision analysis", "choose under uncertainty",
      ["Decision trees and expected values",
       "Requires probabilities somebody must estimate",
       "Makes the reasoning visible even when the numbers are soft"])],
    caption="Three families of technique.",
    footer="Every one of these produces an answer conditional on its inputs. "
           "The technique is sound and the probabilities and constraints were "
           "chosen by somebody, which is where the judgement actually sits."))

register("financial-statements", dk.compare(
    "Three statements, three questions",
    [("Balance sheet", "what is owned and owed",
      ["Assets, liabilities and equity",
       "At one moment in time",
       "Assets equal liabilities plus equity, always"]),
     ("Income statement", "did it make money",
      ["Revenue less costs over a period",
       "Profit is an accounting result",
       "Not the same as cash received"]),
     ("Cash flow statement", "did money move",
      ["Cash in and out over a period",
       "A profitable business can run out of cash",
       "Which is what this statement exists to reveal"])],
    caption="Three statements answering three different questions.",
    footer="PROFIT and CASH are different. A sale made on credit is profit "
           "now and cash later, and a business growing quickly can be "
           "profitable and unable to pay its bills -- which is why the third "
           "statement exists."))

register("break-even", dk.split_planes(
    "Break-even analysis",
    ("Below break-even", "Revenue does not cover total cost", [
        ("Fixed costs", "incurred regardless of volume"),
        ("Variable costs", "rise with each unit"),
        ("Result", "a loss on the period")]),
    ("Above break-even", "Contribution exceeds fixed cost", [
        ("Each unit", "contributes price minus variable cost"),
        ("Fixed cost", "already covered"),
        ("Result", "profit on every further unit")]),
    caption="Break-even volume is fixed cost divided by contribution per "
            "unit.",
    footer="CONTRIBUTION is price minus VARIABLE cost, not price minus total "
           "cost. Fixed costs are covered by the accumulated contribution "
           "rather than allocated to each unit, which is the step people get "
           "wrong."))

register("ip-rights-it", dk.tiers(
    "Intellectual property in information technology",
    [("Copyright", ["Programs, documentation, databases as compilations"]),
     ("Patent", ["Technical inventions, where the regime permits"]),
     ("Trademark", ["Product and service names, and logos"]),
     ("Trade secret", ["Algorithms and methods kept confidential"]),
     ("Database rights", ["Investment in compiling a database, in some "
                          "regimes"])],
    caption="Five rights, protecting five different things.",
    footer="Software is normally protected by COPYRIGHT, which arises "
           "automatically and covers the expression rather than the idea. "
           "Everything else in this list applies to specific circumstances "
           "rather than generally."))

register("engineer-ethics", dk.stack(
    "What a professional owes, in order of precedence",
    [("The public", "safety, health and welfare come first"),
     ("The client or employer", "faithful service within that"),
     ("The profession", "its standing and its standards"),
     ("Oneself", "competence, honesty and continued learning")],
    caption="A hierarchy, and the order is what makes it usable.",
    numbered=False,
    right_note="The ORDER decides the hard cases. Where an employer's "
               "instruction endangers the public, the hierarchy says which "
               "obligation gives way -- which is the whole purpose of "
               "ranking them."))


register("adoption-timing", dk.split_planes(
    "When to adopt a technology",
    ("Early", "Advantage, bought with instability", [
        ("Gains", "capability competitors lack"),
        ("Pays", "immature tools, scarce skills"),
        ("Suits", "what the product competes on")]),
    ("Late", "Certainty, bought with parity", [
        ("Gains", "proven, supported, staffed"),
        ("Pays", "no advantage -- everybody has it"),
        ("Suits", "everything that merely supports")]),
    caption="A trade rather than a preference.",
    footer="The CHASM sits between them: a technology early users valued can "
           "fail to reach a mainstream that wants reliability and support "
           "rather than possibility."))

register("invention-innovation", dk.flow(
    "From idea to something people use",
    [("Idea", "somebody thinks of it"),
     ("Invention", "it is made to work"),
     ("Development", "made producible and supportable"),
     ("Launch", "priced, distributed, explained"),
     ("Innovation", "somebody actually adopts it")],
    caption="Invention is the second step; innovation is the last.",
    note="Everything between them -- production, distribution, support, "
         "pricing, persuasion -- is non-technical, which is why "
         "organisations strong at invention are so frequently weak at "
         "innovation."))

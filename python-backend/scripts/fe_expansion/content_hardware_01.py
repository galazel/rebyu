"""Computer System -> Hardware.

Syllabus minor category 1, the only one in this middle category.

The examination's hardware questions are mostly logic: given a circuit or a
truth table, what is the output? So the gates and their combinations are
worked through rather than described, and the Discrete Mathematics lesson's
Boolean algebra is applied here as circuit simplification.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Computer System"
MIDDLE = "Hardware"

_hw_sections = [
    ("From Logic to Machinery", [
        desc(
            "Everything the earlier lessons described -- the ALU adding, the "
            "control unit sequencing, memory holding a value -- is built from "
            "one kind of component. A logic gate takes one or two binary "
            "inputs and produces a binary output according to a fixed rule, "
            "and there is nothing else in the machine."
        ),
        desc(
            "That is worth sitting with, because it is the point at which the "
            "certification's abstractions bottom out. The Boolean algebra of "
            "the Discrete Mathematics lesson is not an analogy for what the "
            "hardware does; it is a description of it, and simplifying an "
            "expression there removes actual gates here."
        ),
        table(
            ["Gate", "Output is 1 when", "Notation"],
            [["AND", "Both inputs are 1", "A . B"],
             ["OR", "At least one input is 1", "A + B"],
             ["NOT", "The single input is 0", "not A"],
             ["XOR", "The inputs differ", "A (+) B"],
             ["NAND", "NOT both inputs are 1", "not (A . B)"],
             ["NOR", "Neither input is 1", "not (A + B)"]],
            caption="The six gates, and when each produces a 1.",
            footer="NAND and NOR are each FUNCTIONALLY COMPLETE: any circuit "
                   "whatever can be built from one of them alone, which is "
                   "why a fabrication process optimised for one gate type is "
                   "not a limitation."),
    ]),

    ("Combinational Circuits", [
        desc(
            "A combinational circuit's output depends only on its current "
            "inputs. It has no memory: the same inputs always give the same "
            "outputs, whatever happened before."
        ),
        image(fig("flip-flop")),
        desc(
            "This is the simpler of the two circuit families and it covers a "
            "great deal -- arithmetic, selection, encoding and decoding are "
            "all combinational. Examination items give a small circuit and "
            "ask for its output, which is answered by working from the inputs "
            "forward, gate by gate, writing down each intermediate value."
        ),
        content_accordion(
            "THE COMBINATIONAL BUILDING BLOCKS",
            "Four standard circuits the syllabus names, each solving a "
            "problem that recurs everywhere in a processor.",
            [("Half adder and full adder",
              "A HALF adder takes two bits and produces a sum and a carry: "
              "the sum is A XOR B and the carry is A AND B. A FULL adder also "
              "accepts a carry IN, so full adders chained together add "
              "numbers of any width -- which is the whole of binary addition "
              "in hardware."),
             ("Decoder",
              "Takes an n-bit input and activates exactly one of 2^n output "
              "lines. This is how an address selects one memory location out "
              "of many, and how an opcode selects one operation."),
             ("Encoder",
              "The reverse: given one active input among many, produce its "
              "number in binary. Used where a set of signals must be reduced "
              "to an identifier, such as an interrupt line to an interrupt "
              "number."),
             ("Multiplexer and demultiplexer",
              "A multiplexer selects ONE of several inputs to pass to its "
              "single output, chosen by select lines -- which is how a "
              "processor chooses between operand sources. A demultiplexer "
              "routes one input to one of several outputs.")]),
    ]),

    ("Building an Adder", [
        desc(
            "The adder is worth constructing explicitly, because it "
            "demonstrates how arithmetic emerges from logic with nothing "
            "added."
        ),
        image(fig("logic-gates-circuit")),
        table(
            ["A", "B", "Sum", "Carry"],
            [["0", "0", "0", "0"],
             ["0", "1", "1", "0"],
             ["1", "0", "1", "0"],
             ["1", "1", "0", "1"]],
            caption="The half adder's truth table.",
            footer="Read the Sum column: it is 1 exactly when the inputs "
                   "differ, which is XOR. Read the Carry column: it is 1 only "
                   "when both are 1, which is AND. The circuit is those two "
                   "gates and nothing else."),
        desc(
            "A full adder handles the carry from the previous position, "
            "taking three inputs and producing a sum and a carry out. Chaining "
            "n of them gives a RIPPLE-CARRY adder that adds n-bit numbers -- "
            "and its name describes its weakness: each stage must wait for "
            "the carry from the one below, so the delay grows with the width."
        ),
        desc(
            "A CARRY-LOOKAHEAD adder computes the carries in parallel from "
            "the inputs rather than waiting for them to propagate, which is "
            "faster and uses considerably more gates. That is the recurring "
            "trade in hardware design -- speed bought with area and power -- "
            "and it is the same shape as every trade in the earlier lessons."
        ),
    ]),

    ("Sequential Circuits and Flip-Flops", [
        desc(
            "A sequential circuit's output depends on its inputs AND on its "
            "current state. It remembers, and that single difference is what "
            "separates a calculator from a computer."
        ),
        compare_grid(
            "THE TWO CIRCUIT FAMILIES",
            "The examination asks which family a described circuit belongs "
            "to, and memory is the whole test.",
            [("Combinational",
              "Output is a function of the present inputs alone. Adders, "
              "decoders, multiplexers. The same inputs always give the same "
              "outputs."),
             ("Sequential",
              "Output depends on the inputs and on stored state. Flip-flops, "
              "registers, counters, state machines. The same inputs may give "
              "different outputs depending on what came before.")]),
        desc(
            "A FLIP-FLOP is the basic storage element, holding one bit until "
            "told to change. Several types are named: the SR flip-flop with "
            "set and reset inputs, the D flip-flop which stores whatever is "
            "on its data input when clocked, the JK which resolves the SR's "
            "forbidden input combination, and the T which toggles."
        ),
        desc(
            "The D flip-flop is the one to understand, because it is what "
            "registers and memory are built from: on each clock edge it "
            "captures its input and holds it until the next. An n-bit "
            "register is n D flip-flops sharing a clock, and everything from "
            "a processor register to a cache line is an array of them."
        ),
    ]),

    ("The Clock", [
        desc(
            "Sequential circuits need to agree on WHEN state changes, and "
            "that is the clock's job: a square wave whose edges mark the "
            "moments at which every storage element updates together."
        ),
        ol([
            "Between clock edges, combinational logic computes and its "
            "outputs settle.",
            "At the next edge, every flip-flop captures whatever its input "
            "has settled to.",
            "So the clock period must be at least as long as the slowest "
            "combinational path between two flip-flops.",
            "That slowest path is the CRITICAL PATH, and it sets the maximum "
            "clock frequency for the whole circuit.",
        ]),
        desc(
            "This explains a fact from the Processor lesson from the other "
            "direction. Pipelining raises the clock rate by dividing the work "
            "into shorter stages, which shortens the critical path between "
            "storage elements -- and the reason deeper pipelines eventually "
            "stop helping is that the flip-flops between stages consume a "
            "growing share of each shorter period."
        ),
        desc(
            "PROPAGATION DELAY is the time a gate takes to respond to a "
            "change at its input, and it is why any of this is constrained at "
            "all. A signal crossing twenty gates takes twenty propagation "
            "delays, so a circuit is not fast because electricity is fast -- "
            "it is fast because the path is short."
        ),
    ]),

    ("Registers, Counters and State Machines", [
        desc(
            "Flip-flops combine into the structures the earlier lessons "
            "assumed existed."
        ),
        table(
            ["Structure", "Built from", "Does"],
            [["Register", "n D flip-flops on a shared clock",
              "Holds an n-bit value"],
             ["Shift register", "Flip-flops chained output to input",
              "Moves bits sideways -- the shift operations of Discrete "
              "Mathematics"],
             ["Counter", "Flip-flops that toggle in sequence",
              "Counts clock pulses; the basis of timers and the program "
              "counter"],
             ["State machine", "A register holding the state, plus logic",
              "Moves between states on inputs -- the automaton of Theory of "
              "Information, in silicon"]],
            caption="Four structures, all flip-flops with different wiring.",
            footer="The last row closes a loop the certification opened early: "
                   "a finite automaton is not a metaphor for hardware, it is "
                   "a description of how sequential circuits are designed."),
        desc(
            "A shift register also makes the serial-to-parallel conversion of "
            "the Communications lesson concrete. Bits arriving one at a time "
            "are clocked in and read out together, which is exactly what a "
            "serial interface's receiver does -- so the reason serial links "
            "work at all is a chain of flip-flops."
        ),
    ]),

    ("Simplifying a Circuit", [
        desc(
            "Fewer gates means less area, less power, less delay and less "
            "cost, so simplification is an engineering activity rather than "
            "an academic one -- and it is exactly the Boolean algebra of the "
            "Discrete Mathematics lesson."
        ),
        ol([
            "Write the required behaviour as a truth table.",
            "Derive an expression from it -- one term per row producing a 1.",
            "Simplify using the laws: absorption, distribution, De Morgan, "
            "and the complement laws.",
            "Build the circuit from the simplified expression.",
        ]),
        desc(
            "The absorption law does most of the work and is the hardest to "
            "spot: A + (A . B) simplifies to A, removing a whole gate and an "
            "input. De Morgan's laws are the other workhorse, because they "
            "convert between AND and OR forms -- which matters when a "
            "fabrication process implements one more cheaply than the other."
        ),
        desc(
            "A KARNAUGH MAP is the graphical method the syllabus names for "
            "doing this systematically on small circuits. Adjacent cells "
            "differ by one variable, so grouping adjacent 1s identifies terms "
            "that can be combined -- it is the algebra performed by pattern "
            "recognition rather than by manipulation, and it is reliable up "
            "to about four variables."
        ),
    ]),

    ("Reading a Truth Table", [
        desc(
            "Most hardware items on the paper reduce to a truth table, and "
            "the technique for building one is worth stating explicitly "
            "because it removes all the guesswork."
        ),
        ol([
            "Count the inputs. With n inputs there are exactly 2^n rows -- "
            "four for two inputs, eight for three.",
            "List the input combinations by counting up in binary, so none is "
            "missed and none repeated.",
            "Add a column for each intermediate signal in the circuit, "
            "working from the inputs forward.",
            "Fill each column completely before starting the next, rather "
            "than tracing one row all the way through.",
            "Read the final column against the four options.",
        ]),
        table(
            ["A", "B", "A AND B", "NOT (A AND B)", "A XOR B"],
            [["0", "0", "0", "1", "0"],
             ["0", "1", "0", "1", "1"],
             ["1", "0", "0", "1", "1"],
             ["1", "1", "1", "0", "0"]],
            caption="One table, filled column by column.",
            footer="Step four matters more than it looks. Filling by column "
                   "means applying one rule four times, which is far more "
                   "reliable than applying four different rules once each "
                   "while tracking a row."),
        desc(
            "The same table also demonstrates the point about NAND. Its "
            "column is the complement of AND's, and tying both inputs "
            "together -- taking only the first and last rows -- gives 1 then "
            "0, which is NOT. That is functional completeness shown rather "
            "than asserted."
        ),
    ]),

    ("Semiconductors and Integrated Circuits", [
        desc(
            "Gates are built from transistors, and transistors are built from "
            "semiconductor material whose conductivity can be controlled. The "
            "syllabus wants the vocabulary rather than the physics."
        ),
        table(
            ["Term", "Means"],
            [["Semiconductor", "A material whose conductivity is between a "
                               "conductor's and an insulator's, and can be "
                               "controlled"],
             ["Transistor", "A switch with no moving parts: a small signal "
                            "controls a larger one"],
             ["Integrated circuit", "Many transistors fabricated together on "
                                    "one piece of silicon"],
             ["LSI / VLSI", "Large and very large scale integration -- "
                            "increasing numbers of components per chip"],
             ["Wafer", "The disc of silicon many chips are made on together"],
             ["Yield", "The proportion of chips on a wafer that work"]],
            caption="The fabrication vocabulary the examination uses.",
            footer="Yield is the commercially decisive figure. A defect "
                   "anywhere on a chip usually ruins it, so larger chips are "
                   "disproportionately more expensive -- a chip twice the "
                   "area is far more than twice the cost."),
        desc(
            "MOORE'S LAW is the observation, made in 1965, that the number of "
            "transistors on a chip roughly doubles every two years. It is an "
            "economic observation rather than a physical law, and the "
            "examination expects awareness that it has slowed: transistors "
            "have approached sizes where physical effects make further "
            "shrinking difficult, which is a substantial part of why "
            "performance gains moved from clock speed to core count."
        ),
    ]),

    ("Custom and Programmable Logic", [
        desc(
            "Not every circuit is designed from gates by hand. The syllabus "
            "names the spectrum from fully custom silicon to a general "
            "processor running software, and the trade along it is "
            "consistent."
        ),
        table(
            ["Approach", "Flexibility", "Performance and efficiency",
             "Unit cost at volume"],
            [["Software on a general processor", "Total", "Lowest",
              "Lowest -- the chip is already there"],
             ["FPGA", "Reprogrammable after manufacture", "Good",
              "High per unit"],
             ["ASIC", "Fixed at manufacture", "Highest",
              "Lowest at very high volume, huge to develop"]],
            caption="Three ways to implement a function.",
            footer="Read it as a volume decision. An ASIC's development cost "
                   "is enormous and its per-unit cost minimal, so it pays "
                   "only above a large quantity -- which is why FPGAs serve "
                   "prototyping and low-volume products."),
        desc(
            "The general principle is one the examination applies in the "
            "management papers too: fixing a design earlier buys efficiency "
            "and costs the ability to change. Software can be altered after "
            "shipping, an FPGA can be reprogrammed in the field, and an ASIC "
            "cannot be changed at all -- which is why a defect in one is "
            "catastrophically expensive and why they are verified so "
            "exhaustively before fabrication."
        ),
    ]),

    ("Power, Heat and Physical Constraints", [
        desc(
            "A working circuit that cannot be powered or cooled is not a "
            "usable one, and these constraints shape design more than they "
            "once did."
        ),
        ul([
            "Essentially all the electrical power a chip consumes becomes "
            "HEAT, so cooling must remove roughly what the supply delivers.",
            "Switching a transistor consumes energy, so power rises with both "
            "clock frequency and the number of transistors switching -- which "
            "is why raising the clock became impractical and adding cores did "
            "not.",
            "LEAKAGE current is consumed even when nothing switches, and it "
            "grew as transistors shrank, which is why idle power became a "
            "design concern rather than an afterthought.",
            "Heat must leave through a physical path, so the limit is often "
            "the surface area and airflow available rather than anything "
            "electrical.",
        ]),
        desc(
            "This is why the Processor lesson's history went the way it did. "
            "Clock rates stopped rising around the mid-2000s not because "
            "faster circuits were impossible but because the power and heat "
            "at those frequencies were unmanageable -- so the transistors "
            "Moore's law kept providing went into cores, caches and "
            "specialised units instead."
        ),
    ]),

    ("Embedded Hardware", [
        desc(
            "Most processors are not in computers. They are in vehicles, "
            "appliances, instruments and industrial equipment, and the "
            "syllabus expects the distinctions."
        ),
        compare_grid(
            "MICROPROCESSOR AND MICROCONTROLLER",
            "The difference is what is on the chip, and it follows from what "
            "each is for.",
            [("Microprocessor",
              "A processor, requiring external memory, storage and "
              "peripherals. Designed for general-purpose computing where "
              "capability matters more than integration."),
             ("Microcontroller",
              "A processor together with memory, storage and peripherals on "
              "ONE chip. Designed for embedded control, where cost, size and "
              "power matter more than raw capability -- and where a complete "
              "system on one component is worth far more than speed.")]),
        desc(
            "A SYSTEM ON CHIP takes this further, integrating a processor, "
            "graphics, memory controllers, network interfaces and specialised "
            "accelerators into one device -- which is what a phone runs on, "
            "and why its capability arrives in a package a general-purpose "
            "design could not match on power."
        ),
        desc(
            "FIRMWARE is the software held in a device's own non-volatile "
            "memory, and it sits awkwardly between hardware and software in "
            "exactly the way the examination likes to probe. It can be "
            "updated, so it is software; it is required for the hardware to "
            "function at all, so a failed update can render a device "
            "permanently unusable -- which is why firmware updates are "
            "treated as changes requiring planning rather than as routine "
            "patches."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where hardware items are lost."),
        ul([
            "Confusing combinational with sequential circuits. The test is "
            "whether the output depends on stored state.",
            "Misreading XOR as OR. XOR is 1 when the inputs DIFFER, so it is "
            "0 when both are 1.",
            "Forgetting that NAND and NOR are each functionally complete.",
            "Assuming the clock frequency can be raised freely. The critical "
            "path sets the ceiling.",
            "Treating Moore's law as a physical law rather than an economic "
            "observation that has slowed.",
            "Confusing a microprocessor with a microcontroller. The "
            "microcontroller integrates memory and peripherals on the chip.",
            "Reading a half adder's sum as AND. The sum is XOR; the CARRY is "
            "AND.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A circuit has inputs A and B. The output is 1 when exactly one "
            "input is 1, and 0 otherwise. Which single gate implements this, "
            "and what is the output for A=1, B=1?\""
        ),
        ol([
            "Write the required truth table: 0,0 gives 0; 0,1 gives 1; 1,0 "
            "gives 1; 1,1 gives 0.",
            "Compare with the gate table. AND gives 1 only for 1,1 -- wrong. "
            "OR gives 1 for 1,1 -- wrong.",
            "XOR gives 1 exactly when the inputs differ, which matches every "
            "row.",
            "For A=1, B=1 the inputs do NOT differ, so the output is 0.",
            "Note in passing that this is a half adder's SUM output, which is "
            "why the half adder needs XOR rather than OR.",
        ]),
        desc(
            "The distractor to expect is OR, because 'exactly one' and 'at "
            "least one' read similarly in a hurried scan and differ on "
            "precisely one row of the table. Writing the table out is four "
            "lines of work and removes the ambiguity entirely."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Hardware is where several earlier lessons bottom out."),
        ul([
            "Boolean algebra and De Morgan's laws from Discrete Mathematics "
            "are circuit simplification here.",
            "The ALU of the Processor lesson is adders and logic gates.",
            "Registers and the program counter are arrays of flip-flops.",
            "Shift registers are the shift operations of Discrete "
            "Mathematics, and the serial conversion of Communications.",
            "State machines are the finite automata of Theory of Information, "
            "in silicon.",
            "Power and heat are the Facility Management lesson's data centre "
            "constraints at their source.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("A half adder's two outputs",
              "Sum is XOR, Carry is AND",
              "Reading the truth table's two columns gives the two gates "
              "directly. The sum is emphatically not OR."),
             ("Combinational against sequential",
              "No memory against stored state",
              "The same inputs always give the same outputs in a "
              "combinational circuit; a sequential one depends on what came "
              "before."),
             ("Functionally complete gates",
              "NAND and NOR, each alone",
              "Any circuit whatever can be built from one of them, which is "
              "why a process optimised for one gate type is no limitation."),
             ("What sets the maximum clock frequency",
              "The critical path",
              "The slowest combinational path between two flip-flops. "
              "Pipelining raises the clock by shortening it."),
             ("Microprocessor against microcontroller",
              "Needs external memory against integrates it",
              "The microcontroller puts processor, memory and peripherals on "
              "one chip, for cost, size and power rather than speed."),
             ("Why larger chips cost disproportionately more",
              "Yield",
              "A defect anywhere usually ruins a chip, so doubling the area "
              "far more than doubles the cost.")]),
    ]),
]

_hw_quiz = [
    mcq("EASY",
        "A circuit produces an output of 1 when exactly one of its two inputs "
        "is 1, and 0 otherwise.\n\nWhich gate is this?",
        [("OR", False),
         ("XOR", True),
         ("NAND", False),
         ("AND", False)],
        "XOR produces 1 exactly when the inputs differ, so 0,1 and 1,0 give 1 "
        "while 0,0 and 1,1 give 0. OR is the tempting distractor because "
        "'exactly one' and 'at least one' read similarly, and they differ on "
        "precisely one row: OR gives 1 for 1,1 and XOR gives 0. This is also "
        "why a half adder's sum output is XOR rather than OR."),

    mcq("AVERAGE",
        "In a half adder, which gates produce the sum and the carry?",
        [("OR for the sum, AND for the carry", False),
         ("XOR for the sum, AND for the carry", True),
         ("AND for the sum, XOR for the carry", False),
         ("XOR for the sum, OR for the carry", False)],
        "The truth table settles it. The sum column is 1 for 0,1 and 1,0 and "
        "0 for 1,1 -- which is XOR. The carry column is 1 only for 1,1 -- "
        "which is AND. Two gates constitute the entire circuit, and chaining "
        "full adders built the same way is how binary addition of any width "
        "is performed in hardware."),

    mcq("AVERAGE",
        "Which characteristic distinguishes a sequential circuit from a "
        "combinational one?",
        [("It uses more gates to achieve the same function", False),
         ("Its output depends on stored state as well as current inputs",
          True),
         ("It operates without requiring a power supply", False),
         ("It can only be implemented using NAND gates", False)],
        "A combinational circuit's output is a function of its present inputs "
        "alone, so the same inputs always give the same outputs. A sequential "
        "circuit also depends on stored state, so the same inputs may give "
        "different outputs depending on what preceded them -- and that "
        "difference is what separates a calculator from a computer. Gate "
        "count and gate type are unrelated to the classification."),

    mcq("EASY",
        "NAND and NOR gates are each described as functionally complete.\n\n"
        "What does this mean?",
        [("They are the fastest gates to fabricate", False),
         ("Any logic circuit can be built using only that one gate type",
          True),
         ("They require fewer transistors than other gates", False),
         ("They can accept any number of inputs", False)],
        "Functional completeness means one gate type suffices to construct "
        "every logic function: tying a NAND's inputs together gives NOT, "
        "negating a NAND gives AND, and De Morgan's laws then give OR. This "
        "matters practically because a fabrication process optimised for a "
        "single gate type loses no capability at all. Transistor count and "
        "speed are separate considerations."),

    mcq("HARD",
        "What determines the maximum clock frequency at which a synchronous "
        "circuit can operate?",
        [("The number of flip-flops the circuit contains", False),
         ("The longest combinational path between two storage elements",
          True),
         ("The total number of gates in the circuit", False),
         ("The speed at which electricity travels through the "
          "conductors", False)],
        "Every flip-flop captures its input at the clock edge, so the period "
        "must be at least as long as the slowest path a signal takes between "
        "one storage element and the next -- the critical path. Total gate "
        "count is irrelevant if the gates are on parallel paths, and "
        "propagation delay through individual gates rather than the "
        "propagation of electricity is what accumulates along that path. This "
        "is also why pipelining, which shortens the path between stages, "
        "permits a higher clock."),

    mcq("AVERAGE",
        "A single chip contains a processor together with memory, storage and "
        "input/output peripherals.\n\nWhat is this device?",
        [("A microprocessor", False),
         ("A microcontroller", True),
         ("An FPGA", False),
         ("A wafer", False)],
        "A microcontroller integrates the whole system on one chip, which "
        "suits embedded control where cost, size and power matter more than "
        "raw capability. A microprocessor is the processor alone and requires "
        "external memory and peripherals. An FPGA is reprogrammable logic "
        "rather than a fixed processor, and a wafer is the disc of silicon "
        "many chips are fabricated on together."),

    mcq("HARD",
        "A function will be implemented in a product expected to sell in very "
        "large quantities, and no design changes are anticipated after "
        "release.\n\nWhich implementation is most appropriate?",
        [("Software running on a general-purpose processor", False),
         ("An ASIC designed specifically for the function", True),
         ("An FPGA reprogrammed as requirements evolve", False),
         ("A microcontroller with the function written in firmware", False)],
        "An ASIC has an enormous development cost and the lowest per-unit "
        "cost, together with the best performance and power efficiency, so it "
        "pays only above a large volume -- which the stem supplies, along "
        "with the assurance that its inability to change afterwards is "
        "acceptable. An FPGA suits prototyping and low volume where "
        "reprogrammability is worth its higher unit cost, and software offers "
        "the most flexibility and the least efficiency."),

    mcq("AVERAGE",
        "Why does a chip of twice the area typically cost considerably more "
        "than twice as much to produce?",
        [("Larger chips require proportionally more design effort", False),
         ("A defect anywhere ruins the chip, so yield falls sharply with "
          "area", True),
         ("Silicon wafers are priced by area at an increasing rate", False),
         ("Larger chips must be fabricated on separate wafers", False)],
        "Defects occur at random positions on a wafer, and one defect "
        "generally ruins the entire chip containing it -- so a larger chip is "
        "more likely to contain at least one, and the proportion of working "
        "chips falls faster than the area grows. Yield is therefore the "
        "commercially decisive figure in fabrication, and it is why chip area "
        "is guarded so carefully during design."),

    mcq("AVERAGE",
        "Which structure is produced by chaining D flip-flops so that each "
        "one's output feeds the next one's input?",
        [("A decoder", False),
         ("A shift register", True),
         ("A multiplexer", False),
         ("A full adder", False)],
        "Chaining flip-flops output to input moves each stored bit one "
        "position along on every clock pulse, which is a shift register -- "
        "the hardware behind the shift operations of the Discrete Mathematics "
        "lesson and behind the serial-to-parallel conversion a serial "
        "interface performs. Decoders, multiplexers and adders are all "
        "combinational and store nothing."),

    mcq("HARD",
        "Processor clock frequencies largely stopped increasing in the "
        "mid-2000s, and additional transistors went into multiple cores "
        "instead.\n\nWhat drove this change?",
        [("Moore's law ceased to hold, so fewer transistors were "
          "available", False),
         ("Power consumption and heat at higher frequencies became "
          "unmanageable", True),
         ("Software could no longer be written for higher clock rates", False),
         ("Semiconductor materials reached their maximum switching "
          "speed", False)],
        "Switching a transistor consumes energy, and essentially all of it "
        "becomes heat, so power rises with clock frequency -- until removing "
        "the heat becomes impractical within any reasonable cooling budget. "
        "Faster circuits remained possible; powering and cooling them did "
        "not. Moore's law continued supplying transistors for some years "
        "afterwards, which is precisely why they could be spent on cores "
        "instead."),
]

LESSON_HARDWARE = lesson(
    MAJOR, MIDDLE,
    "Hardware: Logic Circuits, Semiconductors and Physical Design",
    _hw_quiz,
    lesson_structure(
        "Hardware: Logic Circuits, Semiconductors and Physical Design",
        "This is where the certification's abstractions bottom out. Every "
        "operation the earlier lessons described -- adding, sequencing, "
        "remembering -- is built from logic gates, and the Boolean algebra of "
        "the Discrete Mathematics lesson is not an analogy for that hardware "
        "but a description of it. The lesson works through the gates and the "
        "combinational circuits built from them, constructs an adder "
        "explicitly, introduces the flip-flops that give a circuit memory and "
        "the clock that coordinates them, applies Boolean simplification as a "
        "way of removing real gates, and closes on the fabrication, power and "
        "packaging constraints that decide what can actually be built.",
        [
            "State each logic gate's behaviour and explain functional "
            "completeness",
            "Distinguish combinational from sequential circuits",
            "Construct and trace a half adder and explain how full adders "
            "chain",
            "Identify decoders, encoders and multiplexers from a described "
            "function",
            "Explain flip-flops, registers, counters and the critical path",
            "Simplify a logic expression to reduce gate count",
            "Compare software, FPGA and ASIC implementation by volume",
            "Explain why power and heat ended clock frequency scaling",
        ],
        60,
        _hw_sections,
        [
            ("Logic gate",
             "A component producing a binary output from one or two binary "
             "inputs by a fixed rule. Everything in a processor is built from "
             "these."),
            ("Functional completeness",
             "The property that any logic circuit can be built from one gate "
             "type alone. NAND and NOR each have it."),
            ("Combinational circuit",
             "A circuit whose output depends only on its present inputs. "
             "Adders, decoders, multiplexers."),
            ("Sequential circuit",
             "A circuit whose output depends on its inputs and on stored "
             "state. Flip-flops, registers, counters, state machines."),
            ("Half adder",
             "A circuit adding two bits: the sum is A XOR B and the carry is "
             "A AND B."),
            ("Full adder",
             "An adder also accepting a carry in, so chaining n of them adds "
             "n-bit numbers."),
            ("Decoder",
             "A circuit activating exactly one of 2^n outputs from an n-bit "
             "input. How an address selects a memory location."),
            ("Multiplexer",
             "A circuit passing one of several inputs to a single output, "
             "chosen by select lines."),
            ("Flip-flop",
             "The basic one-bit storage element. A D flip-flop captures its "
             "input on each clock edge, and registers are arrays of them."),
            ("Critical path",
             "The slowest combinational path between two storage elements, "
             "which sets the maximum clock frequency."),
            ("Propagation delay",
             "The time a gate takes to respond to a change at its input. What "
             "accumulates along the critical path."),
            ("Karnaugh map",
             "A graphical method of Boolean simplification in which adjacent "
             "cells differ by one variable, so grouping adjacent 1s "
             "identifies combinable terms."),
            ("Yield",
             "The proportion of chips on a wafer that work. A defect anywhere "
             "usually ruins a chip, so larger chips cost disproportionately "
             "more."),
            ("Moore's law",
             "The observation that transistors per chip roughly double every "
             "two years. An economic observation rather than a physical law, "
             "and it has slowed."),
            ("ASIC",
             "An integrated circuit designed for one function. Best "
             "performance and lowest unit cost, with an enormous development "
             "cost and no ability to change afterwards."),
            ("FPGA",
             "Logic that can be reprogrammed after manufacture. Suits "
             "prototyping and low volume, at a higher unit cost than an "
             "ASIC."),
            ("Microcontroller",
             "A processor with memory, storage and peripherals on one chip, "
             "for embedded control where cost, size and power matter more "
             "than capability."),
            ("Firmware",
             "Software held in a device's own non-volatile memory. Updatable "
             "like software, and required for the hardware to function -- so "
             "a failed update can render a device unusable."),
        ],
        "Every operation in a computer is built from logic gates, and NAND or "
        "NOR alone suffices to build any of them -- which is why a "
        "fabrication process optimised for one gate type loses nothing. "
        "Circuits divide into combinational, whose output depends only on the "
        "present inputs, and sequential, which also depends on stored state; "
        "that difference is the whole distance between a calculator and a "
        "computer. A half adder is two gates -- XOR for the sum and AND for "
        "the carry -- and chaining full adders performs binary addition of "
        "any width, with the choice between ripple-carry and carry-lookahead "
        "being the familiar trade of speed against area. Flip-flops supply "
        "the memory, registers and counters and state machines are flip-flops "
        "wired differently, and the clock coordinates them all -- so the "
        "maximum frequency is set by the critical path, the slowest "
        "combinational route between two storage elements, which is exactly "
        "what pipelining shortens. Simplifying an expression by the Boolean "
        "laws or a Karnaugh map removes real gates, real area and real power. "
        "Below that, transistors are fabricated on wafers where a single "
        "defect ruins a chip, making yield the decisive commercial figure and "
        "large chips disproportionately expensive; Moore's law is an economic "
        "observation that has slowed; and implementation runs from flexible "
        "inefficient software through reprogrammable FPGAs to fixed, "
        "efficient, unchangeable ASICs, chosen by volume. Finally, power "
        "becomes heat, which is why clock frequencies stopped rising and the "
        "transistors went into cores instead.",
        exam_notes=[
            desc(
                "Hardware items on Subject A are predominantly logic: a truth "
                "table to complete, a gate to identify, or a small circuit to "
                "trace."
            ),
            ul([
                "Identifying a gate from a described behaviour or a truth "
                "table.",
                "Determining a circuit's output for given inputs.",
                "Distinguishing combinational from sequential circuits.",
                "Naming the gates of a half adder.",
                "Explaining functional completeness.",
                "Choosing between software, FPGA and ASIC given a volume.",
                "Distinguishing a microprocessor from a microcontroller.",
            ]),
            desc(
                "Write the truth table out. Nearly every logic item is four "
                "or eight lines of mechanical work that is almost impossible "
                "to get wrong on paper and easy to get wrong by reasoning -- "
                "particularly the OR against XOR distinction, which differs "
                "on exactly one row."
            ),
        ],
    ))

LESSONS = [LESSON_HARDWARE]

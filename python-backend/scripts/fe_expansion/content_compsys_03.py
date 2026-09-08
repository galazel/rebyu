"""Computer System -> Computer Component, lessons 3 to 5.

Syllabus minor categories 3 (bus), 4 (input/output interface) and 5
(input/output device).

Three shorter minor categories that share one subject: how the parts of a
computer are connected, and how data crosses between them. They are examined
mostly by identification and by small bandwidth calculations, so the emphasis
here is on the distinctions the examination actually draws -- serial against
parallel, memory-mapped against isolated I/O, and the three transfer methods
in ascending order of how little the processor has to do.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Computer System"
MIDDLE = "Computer Component"

# ==========================================================================
# Lesson 3: Buses and interconnects
# ==========================================================================

_bus_sections = [
    ("What a Bus Is For", [
        desc(
            "A processor, memory and half a dozen controllers all need to "
            "exchange data. Connecting every pair with its own wires would "
            "need an impossible number of connections, so instead they share "
            "a common set -- a bus."
        ),
        image(fig("bus-structure")),
        desc(
            "Sharing is the whole design and the whole limitation at once. It "
            "keeps the wiring tractable and means only one transfer may "
            "occupy the bus at a time, so every device competes for the same "
            "capacity. Everything else in this lesson follows from that "
            "trade."
        ),
        desc(
            "The consequence worth carrying is that a bus is a shared "
            "resource with a queue, exactly as the Applied Mathematics "
            "lesson's server was. As demand approaches its capacity, waiting "
            "rises sharply rather than gradually -- which is why a bus at 90% "
            "utilisation is a bottleneck long before it is full."
        ),
    ]),

    ("The Three Groups of Lines", [
        desc(
            "A bus is not one wire but three groups of them, each carrying a "
            "different kind of information."
        ),
        image(fig("bus-lines")),
        table(
            ["Group", "Carries", "What its width determines"],
            [["Address bus", "Which location is being accessed",
              "How much memory can be addressed: n lines reach 2^n locations"],
             ["Data bus", "The value being transferred",
              "How many bits move per transfer"],
             ["Control bus", "Read or write, timing, interrupt and bus "
                             "request signals",
              "Which operations and coordination are possible"]],
            caption="Three groups, three different consequences of width.",
            footer="A 32-line address bus reaches 4 GiB and no more, however "
                   "much memory is installed. That limit is a property of the "
                   "bus width, not of the memory."),
        desc(
            "The address calculation is examined directly and is simple "
            "arithmetic: n address lines address 2^n locations, and if each "
            "location holds one byte that is the capacity in bytes. Twenty "
            "lines reach 1 MiB, thirty reach 1 GiB, thirty-two reach 4 GiB "
            "and forty reach 1 TiB."
        ),
        desc(
            "Note that the address bus and the data bus are independent. A "
            "machine can have a 32-bit address bus and a 64-bit data bus, "
            "which means it addresses four gigabytes and moves eight bytes "
            "per transfer. Conflating the two is the standard mistake on "
            "these items."
        ),
    ]),

    ("Bus Bandwidth", [
        desc(
            "Bus throughput is the second calculable thing here, and it is a "
            "product of width and rate."
        ),
        ol([
            "Bandwidth = data bus width in bytes x bus clock frequency.",
            "A 64-bit data bus is 8 bytes wide. At 800 MHz: 8 x 800,000,000.",
            "That is 6,400,000,000 bytes per second -- 6.4 GB/s.",
        ]),
        desc(
            "Two refinements the examination sometimes adds. A DOUBLE DATA "
            "RATE bus transfers on both the rising and falling edge of the "
            "clock, doubling the figure for the same clock frequency -- which "
            "is why memory is quoted at an effective rate roughly twice its "
            "actual clock. And the theoretical bandwidth is a ceiling: "
            "protocol overhead, refresh cycles and contention mean a real bus "
            "delivers meaningfully less."
        ),
        desc(
            "This is where the bus becomes an architectural constraint rather "
            "than a detail. If the processor can consume data faster than the "
            "bus can supply it, adding processor speed changes nothing -- the "
            "machine is bus-bound. Recognising which resource is the "
            "bottleneck before optimising anything is the general lesson, and "
            "it recurs in System Evaluation."
        ),
    ]),

    ("Internal and External Buses", [
        desc(
            "Buses are classified by what they connect, and the terms appear "
            "in examination items without explanation."
        ),
        content_accordion(
            "A HIERARCHY OF BUSES",
            "A modern machine has several buses of different speeds rather "
            "than one, precisely because a single shared path could not serve "
            "both a processor and a keyboard sensibly.",
            [("Internal (system) bus",
              "Connects the processor to main memory and to the closest "
              "controllers. The fastest and shortest, because signal quality "
              "and clock skew both worsen with distance."),
             ("Expansion bus",
              "Connects add-in cards -- graphics, storage controllers, "
              "network adapters. PCI Express is the current standard, and it "
              "is serial and point-to-point rather than a shared parallel "
              "bus, which is how it scaled when parallel PCI could not."),
             ("External (peripheral) bus",
              "Connects devices outside the case: USB, Thunderbolt, SATA for "
              "drives. Slower, longer, and usually hot-pluggable."),
             ("Why a hierarchy rather than one bus",
              "Every device on a shared bus is limited by its slowest "
              "participant and competes for its capacity. Separating fast "
              "traffic from slow lets each run at a rate that suits it, and "
              "bridges connect the levels.")]),
    ]),

    ("Serial and Parallel Transmission Inside the Machine", [
        desc(
            "The Communications lesson covered this for links between "
            "machines. The same reversal happened inside them, and it is "
            "examined here."
        ),
        compare_grid(
            "WHY INTERNAL BUSES WENT SERIAL",
            "The reasoning is identical to the external case and worth "
            "seeing twice, because it is a genuine engineering reversal "
            "rather than a fashion.",
            [("The parallel argument",
              "Sixty-four wires carrying a bit each moves sixty-four bits per "
              "clock. Obviously faster than one wire, and it was, for "
              "decades."),
             ("Why it stopped scaling",
              "As clock rates rose, tiny differences in wire length made bits "
              "arrive at slightly different times -- SKEW. Once the skew "
              "approached one clock period, the bits no longer arrived "
              "together and the clock could not be raised further."),
             ("The serial answer",
              "One pair of wires, clocked far faster, with the clock recovered "
              "from the data itself. No skew to solve, so the rate kept "
              "rising past what any parallel bus could reach."),
             ("Where it left us",
              "PCI gave way to PCI Express, parallel ATA to SATA, and "
              "parallel ports to USB -- each time because the fastest "
              "achievable serial link overtook the fastest manageable "
              "parallel one.")]),
        desc(
            "The general principle is one the examination likes in its "
            "management papers too: a design advantage can expire when the "
            "numbers around it change, and continuing to reason from the old "
            "numbers is how organisations get stranded on obsolete "
            "architectures."
        ),
    ]),

    ("Bus Arbitration", [
        desc(
            "If several devices may initiate a transfer, something must "
            "decide which one holds the bus. That decision is arbitration, "
            "and the syllabus names the schemes."
        ),
        table(
            ["Scheme", "How it decides", "Property"],
            [["Daisy chain", "A grant signal passes device to device",
              "Simple; devices nearer the controller always win"],
             ["Polling", "The arbiter asks each device in turn",
              "Fair if the order rotates; slow with many devices"],
             ["Independent request", "Each device has its own request line",
              "Fastest and fairest; needs the most wiring"],
             ["Centralised", "One arbiter decides for everyone",
              "Simple to reason about; a single point of failure"],
             ["Distributed", "Devices resolve among themselves",
              "No central arbiter; more complex protocol"]],
            caption="Who gets the bus, and how that is settled.",
            footer="Daisy chaining is the one to remember for its flaw: "
                   "priority is fixed by physical position, so a device far "
                   "down the chain can be starved indefinitely by busy "
                   "devices ahead of it."),
        desc(
            "STARVATION is the general hazard, and it is worth naming because "
            "it recurs in process scheduling and in lock acquisition. A "
            "scheme with strict fixed priorities is simple and can leave a "
            "low-priority participant waiting for ever; a scheme that rotates "
            "or ages priorities is more complex and guarantees eventual "
            "service."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where bus items are lost."),
        ul([
            "Confusing address bus width with data bus width. One bounds how "
            "much memory can be addressed, the other how much moves per "
            "transfer.",
            "Computing addressable memory as 2 x n rather than 2 to the power "
            "n.",
            "Forgetting that a double-data-rate bus transfers twice per clock "
            "cycle.",
            "Treating theoretical bandwidth as achievable. Overhead and "
            "contention take a real share.",
            "Assuming parallel is faster than serial. Skew ended that at high "
            "clock rates.",
            "Overlooking that a shared bus permits only one transfer at a "
            "time, so devices compete rather than adding capacity.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A system bus has 30 address lines and a 32-bit data bus, and "
            "runs at 500 MHz. What is the maximum addressable memory in "
            "bytes, and the theoretical bandwidth?\""
        ),
        ol([
            "Addressable locations: 2^30, which is 1,073,741,824 -- one "
            "gibibyte, assuming each location holds one byte.",
            "Data bus width in bytes: 32 bits is 4 bytes.",
            "Bandwidth: 4 bytes x 500,000,000 transfers per second = "
            "2,000,000,000 bytes per second, so 2 GB/s.",
            "Note that the two answers used different lines and are "
            "independent of each other.",
        ]),
        desc(
            "The distractor to expect is an answer that uses the data bus "
            "width to compute addressable memory, or the address width to "
            "compute bandwidth. Reading which group of lines the question is "
            "asking about is most of the work, and the arithmetic is "
            "deliberately clean once that is settled."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("The bus is where several constraints meet."),
        ul([
            "Address bus width is why 32-bit systems could not use more than "
            "4 GiB of memory.",
            "Bus contention is a queueing problem of exactly the kind Applied "
            "Mathematics modelled.",
            "DMA in the next lesson works by a controller taking the bus from "
            "the processor.",
            "Serial replacing parallel repeats the Communications lesson's "
            "reasoning inside the machine.",
            "Starvation in arbitration is the same hazard as in process "
            "scheduling.",
            "Identifying the bottleneck before optimising is the method of "
            "System Evaluation.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Five results this lesson expects immediately.",
            [("Addressable memory from n address lines",
              "2 to the power n locations",
              "Thirty-two lines reach 4 GiB, and no amount of installed "
              "memory changes that."),
             ("Bus bandwidth",
              "Data width in bytes x clock frequency",
              "Double it for a double-data-rate bus, which transfers on both "
              "clock edges."),
             ("Why internal buses went serial",
              "Skew ended parallel scaling",
              "Wire-length differences made bits arrive at different times "
              "once clocks rose. PCI to PCI Express, ATA to SATA."),
             ("The flaw in daisy-chain arbitration",
              "Priority is fixed by physical position",
              "A device far down the chain can be starved indefinitely by "
              "busy devices ahead of it."),
             ("What a shared bus cannot do",
              "Carry two transfers at once",
              "So devices compete for one capacity, and waiting rises sharply "
              "as utilisation approaches it.")]),
    ]),
]

_bus_quiz = [
    mcq("EASY",
        "A processor has 30 address lines.\n\n"
        "What is the maximum number of byte-addressable memory locations it "
        "can reach?",
        [("30 megabytes", False),
         ("1 gibibyte", True),
         ("60 megabytes", False),
         ("4 gibibytes", False)],
        "Each address line doubles the number of distinguishable addresses, "
        "so n lines reach 2^n locations: 2^30 is 1,073,741,824, one gibibyte "
        "when each location holds a byte. Answering 4 GiB uses 32 lines "
        "rather than 30, and the two megabyte figures treat the relationship "
        "as multiplication rather than exponentiation."),

    mcq("AVERAGE",
        "A bus has a 64-bit data path and operates at 400 MHz, transferring "
        "once per clock cycle.\n\n"
        "What is its theoretical bandwidth?",
        [("400 MB/s", False),
         ("3.2 GB/s", True),
         ("25.6 GB/s", False),
         ("6.4 GB/s", False)],
        "A 64-bit path is 8 bytes wide, so 8 x 400,000,000 = 3,200,000,000 "
        "bytes per second, or 3.2 GB/s. The figure 25.6 GB/s comes from "
        "leaving the width in bits, and 6.4 GB/s would apply to a "
        "double-data-rate bus transferring on both clock edges -- which this "
        "one is stated not to do. Real throughput is always somewhat below "
        "this ceiling because of protocol overhead and contention."),

    mcq("AVERAGE",
        "Internal interconnects such as PCI and ATA were replaced by serial "
        "successors, PCI Express and SATA.\n\n"
        "What made the parallel designs stop scaling?",
        [("Serial links can carry more wires in the same physical space",
          False),
         ("Differences in wire length made bits arrive at different times",
          True),
         ("Parallel buses cannot support hot-plugging of devices", False),
         ("Serial protocols require less error checking than parallel ones",
          False)],
        "As clock rates rose, the tiny differences in the physical length of "
        "the parallel wires -- skew -- grew comparable to one clock period, "
        "so the bits of a single transfer no longer arrived together and the "
        "clock could not be raised further. A serial link has no skew to "
        "solve, so its rate kept climbing until it overtook the fastest "
        "manageable parallel bus. Serial links use FEWER wires, not more."),

    mcq("HARD",
        "In daisy-chain bus arbitration, a grant signal is passed from one "
        "device to the next along a physical chain.\n\n"
        "Which weakness does this design have?",
        [("It requires a separate request line for every device", False),
         ("Devices further along the chain can be starved indefinitely",
          True),
         ("It cannot be used when more than one device requests the bus",
          False),
         ("It requires every device to run at the same clock rate", False)],
        "The grant passes down the chain in order, so a device only receives "
        "it if every device ahead of it declines. Priority is therefore fixed "
        "by physical position, and a device far down the chain can wait "
        "indefinitely while busier devices ahead of it keep taking the bus. "
        "Needing a request line per device describes independent-request "
        "arbitration, which is the scheme that solves this at the cost of "
        "wiring."),

    mcq("AVERAGE",
        "Which statement correctly describes the relationship between the "
        "address bus and the data bus?",
        [("Their widths are independent: one bounds addressable memory, the "
          "other bounds transfer size", True),
         ("They must be the same width, since an address and its data travel "
          "together", False),
         ("The data bus must be at least as wide as the address bus", False),
         ("The address bus width determines how many bytes move per "
          "transfer", False)],
        "The two groups of lines serve different purposes and are sized "
        "independently: a machine may have a 32-bit address bus reaching 4 "
        "GiB and a 64-bit data bus moving 8 bytes per transfer. Conflating "
        "them is the standard error on these items, and it produces answers "
        "that are wrong in both the capacity calculation and the bandwidth "
        "calculation."),

    mcq("EASY",
        "Which group of bus lines carries read and write signals, timing and "
        "interrupt requests?",
        [("The address bus", False),
         ("The data bus", False),
         ("The control bus", True),
         ("The expansion bus", False)],
        "The control bus carries the signals that coordinate a transfer -- "
        "its direction, its timing, and requests such as interrupts and bus "
        "grants. The address bus carries only which location is involved and "
        "the data bus only the value. An expansion bus is a whole bus "
        "connecting add-in cards, not a group of lines within one."),

    mcq("HARD",
        "A system's processor is upgraded to one twice as fast, but "
        "measurements show almost no improvement in a data-intensive "
        "workload.\n\n"
        "What does this most likely indicate?",
        [("The new processor has a worse CPI than the old one", False),
         ("The workload is bus-bound rather than processor-bound", True),
         ("The address bus is too narrow for the installed memory", False),
         ("The operating system has not been configured for the new "
          "processor", False)],
        "If the bus cannot deliver data faster, a processor that can consume "
        "it faster spends the extra capacity waiting, and doubling its speed "
        "changes nothing measurable. Identifying which resource is actually "
        "the bottleneck before optimising is the general lesson, and it is "
        "why upgrading one component in isolation so often disappoints. A "
        "narrow address bus would limit usable memory rather than throughput."),

    mcq("AVERAGE",
        "Modern machines use a hierarchy of several buses rather than one "
        "shared bus for everything.\n\n"
        "What is the principal reason?",
        [("A single bus cannot carry both addresses and data", False),
         ("Fast and slow devices would otherwise compete for one capacity",
          True),
         ("Each device requires its own dedicated address range", False),
         ("Bus arbitration is impossible with more than eight devices",
          False)],
        "Every device on a shared bus competes for the same capacity and is "
        "constrained by the design compromises its slowest participants "
        "require. Separating high-speed processor-to-memory traffic from "
        "slow peripheral traffic lets each run at a rate that suits it, with "
        "bridges connecting the levels. A single bus carries addresses and "
        "data perfectly well on separate line groups, and arbitration scales "
        "well past eight devices."),

    mcq("AVERAGE",
        "Memory is described as DDR, transferring data on both the rising and "
        "falling edges of the clock.\n\n"
        "What is the effect on bandwidth for a given clock frequency?",
        [("It is unchanged, since the clock frequency is the same", False),
         ("It is doubled, since two transfers occur per cycle", True),
         ("It is halved, since each transfer carries half a word", False),
         ("It is quadrupled, since both edges carry two words each", False)],
        "Transferring on both clock edges gives two transfers per cycle "
        "instead of one, so bandwidth doubles at the same clock frequency and "
        "the same data width. This is why memory is commonly quoted at an "
        "effective rate roughly twice its actual clock, and why using the "
        "quoted figure as a clock frequency in a bandwidth calculation "
        "double-counts the effect."),

    mcq("HARD",
        "A shared bus is measured at 90% utilisation during peak processing.\n\n"
        "How should this be interpreted?",
        [("It is well utilised, with 10% of capacity still in reserve",
          False),
         ("Waiting for the bus is already substantial and will worsen "
          "sharply", True),
         ("The bus is the fastest component and needs no attention", False),
         ("Utilisation above 80% indicates a hardware fault", False)],
        "A shared bus carries one transfer at a time, so it is a single-server "
        "queue and the M/M/1 relationship from Applied Mathematics applies: "
        "at 90% utilisation the mean queue is about nine transfers deep, and "
        "at 95% it is nineteen. Waiting rises without bound as utilisation "
        "approaches one, so the remaining 10% is not comfortable headroom -- "
        "it is the region where a small increase in demand produces a large "
        "increase in delay."),
]

LESSON_BUS = lesson(
    MAJOR, MIDDLE,
    "Buses and Interconnects",
    _bus_quiz,
    lesson_structure(
        "Buses and Interconnects",
        "Connecting every component to every other would need an impossible "
        "number of wires, so a computer's parts share a common set instead -- "
        "which keeps the wiring tractable and means only one transfer can "
        "happen at a time. This lesson covers the three groups of lines and "
        "what each one's width determines, the two calculations the "
        "examination asks for, why a modern machine has a hierarchy of buses "
        "rather than one, why internal interconnects abandoned parallel "
        "transmission for serial, and how a bus decides which device may use "
        "it next.",
        [
            "Explain why a shared bus is used and what it costs",
            "Distinguish the address, data and control lines and what each "
            "width determines",
            "Compute addressable memory from the address bus width",
            "Compute bus bandwidth from data width and clock rate, including "
            "double data rate",
            "Explain why a hierarchy of buses is used rather than one",
            "Explain why serial interconnects replaced parallel ones inside "
            "the machine",
            "Compare bus arbitration schemes and identify starvation",
        ],
        55,
        _bus_sections,
        [
            ("Bus",
             "A shared set of lines connecting components, carrying one "
             "transfer at a time. Keeps wiring tractable at the cost of making "
             "capacity a contended resource."),
            ("Address bus",
             "The lines carrying which location is being accessed. n lines "
             "reach 2^n locations, which is a hard limit whatever memory is "
             "installed."),
            ("Data bus",
             "The lines carrying the value transferred. Its width sets how "
             "many bits move per transfer, independently of the address bus."),
            ("Control bus",
             "The lines carrying direction, timing, interrupt requests and "
             "bus grants."),
            ("Bus bandwidth",
             "Data width in bytes multiplied by transfer rate. A theoretical "
             "ceiling, since overhead and contention consume part of it."),
            ("Double data rate",
             "Transferring on both the rising and falling clock edges, "
             "doubling bandwidth at the same clock frequency."),
            ("System (internal) bus",
             "The fastest and shortest bus, connecting the processor to main "
             "memory and the nearest controllers."),
            ("Expansion bus",
             "The bus connecting add-in cards. PCI Express is the current "
             "standard, and it is serial and point-to-point rather than a "
             "shared parallel bus."),
            ("Skew",
             "The arrival-time difference between bits travelling parallel "
             "wires of slightly different length. What ended parallel bus "
             "scaling as clock rates rose."),
            ("Bus arbitration",
             "Deciding which of several devices may drive the bus next. "
             "Centralised or distributed, by daisy chain, polling or "
             "independent request lines."),
            ("Starvation",
             "A participant never receiving service because higher-priority "
             "ones keep taking the resource. The characteristic risk of fixed "
             "priority, in bus arbitration and in scheduling alike."),
        ],
        "A bus exists because connecting every component to every other is "
        "impossible, and it carries one transfer at a time -- so capacity is "
        "contended and, like any single-server queue, waiting rises sharply "
        "as utilisation approaches full. Its lines fall into three groups "
        "whose widths mean different things: the address lines bound how much "
        "memory can be reached at 2^n locations, the data lines bound how "
        "much moves per transfer, and the control lines coordinate direction, "
        "timing and interrupts. Bandwidth is data width times transfer rate, "
        "doubled where a bus transfers on both clock edges, and it is always "
        "a ceiling rather than a delivery. Machines use a hierarchy of buses "
        "because fast and slow devices sharing one path would each be "
        "constrained by the other's requirements. Inside the machine, "
        "parallel interconnects gave way to serial ones for exactly the "
        "reason external links did -- skew between wires of unequal length "
        "capped the clock rate, while a serial link had no skew to solve and "
        "kept climbing past it. And when several devices may drive the bus, "
        "arbitration decides between them, with fixed-priority schemes such "
        "as daisy chaining risking indefinite starvation of whatever sits "
        "last in line.",
        exam_notes=[
            desc(
                "Bus items on Subject A are short and largely arithmetic, "
                "which makes them among the most reliable marks available."
            ),
            ul([
                "Computing addressable memory from a number of address "
                "lines.",
                "Computing bandwidth from data width and clock rate.",
                "Identifying which group of lines carries a described "
                "signal.",
                "Explaining why serial replaced parallel internally.",
                "Naming an arbitration scheme or its weakness.",
                "Recognising a bus-bound rather than processor-bound "
                "workload.",
            ]),
            desc(
                "Read carefully which bus the question is asking about. Using "
                "the data width in a capacity calculation, or the address "
                "width in a bandwidth calculation, is the error every "
                "distractor set on this topic is built around."
            ),
        ],
    ))

# ==========================================================================
# Lesson 4: Input/output interfaces and device control
# ==========================================================================

_io_sections = [
    ("The Problem an Interface Solves", [
        desc(
            "A processor operates on nanosecond timescales in a fixed word "
            "size. A disk operates in milliseconds, a keyboard in tenths of a "
            "second, a network adapter in framed packets of variable length. "
            "An interface is what bridges those mismatches."
        ),
        table(
            ["Mismatch", "What the interface does about it"],
            [["Speed", "Buffers data so neither side waits on the other"],
             ["Data format", "Converts between the device's units and the "
                             "system's words"],
             ["Electrical", "Matches voltages and signalling between two "
                            "different technologies"],
             ["Control", "Presents a uniform register interface whatever the "
                         "device actually is"],
             ["Error handling", "Detects and reports device conditions the "
                                "processor cannot see directly"]],
            caption="Five mismatches, and the interface's job in each.",
            footer="The fourth row is the one with the widest consequences: "
                   "because every device presents a similar register "
                   "interface, an operating system can drive an enormous "
                   "variety of hardware through a small number of driver "
                   "shapes."),
        desc(
            "A DEVICE CONTROLLER is the hardware implementing this, and a "
            "DEVICE DRIVER is the software that knows how to operate a "
            "particular controller. The division matters: the driver is the "
            "only part of the operating system that must understand this "
            "specific device, which is what confines hardware knowledge to a "
            "replaceable component."
        ),
    ]),

    ("How the Processor Addresses a Device", [
        desc(
            "Before data can move, the processor needs a way to name the "
            "device's registers. Two schemes exist, and the examination asks "
            "you to distinguish them."
        ),
        compare_grid(
            "MEMORY-MAPPED AND ISOLATED I/O",
            "The question is whether device registers share the memory "
            "address space or occupy a separate one.",
            [("Memory-mapped I/O",
              "Device registers appear at ordinary memory addresses, so the "
              "same load and store instructions reach them. No special "
              "instructions are needed and any addressing mode works -- at "
              "the cost of consuming part of the address space, which mattered "
              "when address spaces were small."),
             ("Isolated (port-mapped) I/O",
              "Devices occupy a separate address space reached by dedicated "
              "IN and OUT instructions. The full memory space stays available "
              "for memory, and the instruction set must carry the extra "
              "instructions and a control line to say which space is meant.")]),
        desc(
            "Memory-mapped I/O has largely won, for a reason worth "
            "understanding: with a 64-bit address space there is no shortage "
            "to conserve, and reusing the memory instructions means device "
            "access benefits automatically from every addressing mode, "
            "protection mechanism and compiler optimisation the machine "
            "already has."
        ),
        desc(
            "One consequence catches people out. Memory-mapped device "
            "registers must NOT be cached, because reading the same address "
            "twice may legitimately give different values and writing to it "
            "has an effect beyond storing a value. The page containing them "
            "is marked uncacheable, which is why device access is slow even "
            "though it looks like an ordinary memory reference."
        ),
    ]),

    ("Three Ways to Transfer Data", [
        desc(
            "Once the device can be addressed, the data has to move. The "
            "three methods differ in how much of the processor's time the "
            "transfer consumes, and the syllabus expects all three in order."
        ),
        image(fig("io-methods")),
        content_accordion(
            "FROM MOST TO LEAST PROCESSOR INVOLVEMENT",
            "Each step removes the processor further from the transfer, and "
            "each costs more hardware.",
            [("Programmed I/O with polling",
              "The processor asks the device whether it is ready, repeatedly, "
              "and moves each unit of data itself. Simple, needs no extra "
              "hardware, and consumes the processor entirely -- a disk read "
              "would occupy it for milliseconds doing nothing but asking. "
              "Sensible only for very small or very simple transfers."),
             ("Interrupt-driven I/O",
              "The processor starts the transfer and goes elsewhere; the "
              "device raises an interrupt when it is ready. Far better use of "
              "the processor, and it still pays a context switch per unit of "
              "data, which at high rates becomes the dominant cost."),
             ("Direct memory access (DMA)",
              "A DMA controller transfers the whole block directly between "
              "the device and memory, without the processor touching the "
              "data. The processor sets up the transfer, does other work, and "
              "receives ONE interrupt when the entire block has landed. This "
              "is how disks and network adapters actually work."),
             ("Channel and I/O processor",
              "The extreme form: a dedicated processor executes a program of "
              "I/O operations independently, so the main processor issues a "
              "whole sequence and is told once at the end. Characteristic of "
              "mainframes, and the ancestor of today's storage and network "
              "offload engines.")]),
        desc(
            "The examination asks which method a described situation implies. "
            "The tells are consistent: 'the processor repeatedly checks' is "
            "polling, 'the device signals when ready' is interrupt-driven, "
            "and 'the data moves without processor involvement' or 'one "
            "interrupt per block' is DMA."
        ),
    ]),

    ("How DMA Actually Works", [
        desc(
            "DMA deserves its own section because its mechanism explains "
            "several things that otherwise look surprising."
        ),
        ol([
            "The processor programs the DMA controller: source, destination, "
            "length and direction.",
            "The processor continues with other work.",
            "The DMA controller requests the bus, and the processor grants "
            "it.",
            "The controller transfers data directly between the device and "
            "memory, one bus transaction at a time.",
            "When the block is complete, the controller raises a single "
            "interrupt.",
            "The processor's handler notes the completion and, if the data "
            "was written by the device, invalidates any cached copies.",
        ]),
        desc(
            "Steps three and four are why DMA is not entirely free. The "
            "controller and the processor compete for the same bus, so a "
            "large transfer slows the processor's own memory accesses -- "
            "CYCLE STEALING, in the syllabus's term. The processor is not "
            "stopped, but it waits more often. The gain is still enormous, "
            "because waiting occasionally for a bus cycle costs far less than "
            "executing an instruction per byte."
        ),
        desc(
            "Step six explains a real class of defect. If the device wrote "
            "directly to memory, any cached copy of those addresses is now "
            "stale, and a processor reading them would see the old data. "
            "Modern systems keep caches coherent in hardware; where they do "
            "not, the driver must invalidate explicitly, and forgetting to is "
            "a bug that appears only under specific timing."
        ),
    ]),

    ("Interface Standards", [
        desc(
            "The syllabus names specific interfaces, and they are examined by "
            "identification rather than by detail."
        ),
        table(
            ["Interface", "Connects", "Character"],
            [["USB", "Peripherals of all kinds", "Serial, hot-pluggable, "
                                                 "supplies power, tiered hubs"],
             ["SATA", "Internal drives", "Serial, point-to-point, replaced "
                                         "parallel ATA"],
             ["PCI Express", "Expansion cards", "Serial lanes, scalable by "
                                                "adding lanes"],
             ["HDMI / DisplayPort", "Displays", "Digital video and audio "
                                                "together"],
             ["Bluetooth", "Short-range wireless peripherals",
              "Low power, paired devices"],
             ["Thunderbolt", "High-speed external devices",
              "Carries PCI Express and video over one cable"]],
            caption="The interfaces the syllabus lists.",
            footer="Notice how many say 'serial' and 'point-to-point'. That "
                   "is the same reversal the bus lesson described, visible in "
                   "every standard designed since it happened."),
        desc(
            "Two general properties are worth more than the list. HOT-"
            "PLUGGING means a device may be connected and disconnected while "
            "the system runs, which requires the interface to detect arrival "
            "and departure and the operating system to load and unload "
            "drivers dynamically. PLUG AND PLAY means the system identifies "
            "the device and configures it without manual intervention, which "
            "requires the device to describe itself when asked."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where I/O interface items are lost."),
        ul([
            "Confusing memory-mapped with isolated I/O. The question is "
            "whether device registers share the memory address space.",
            "Thinking DMA involves no processor time at all. It competes for "
            "the bus, which is cycle stealing.",
            "Expecting one interrupt per byte under DMA. There is one per "
            "block, which is the entire point.",
            "Treating polling as always wrong. For a very short transfer it "
            "avoids the cost of an interrupt entirely.",
            "Forgetting that memory-mapped device registers must not be "
            "cached.",
            "Assuming a device controller and a device driver are the same "
            "thing. One is hardware, the other software.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A network adapter receives 10,000 packets per second. Under "
            "interrupt-driven I/O each packet raises an interrupt costing "
            "5 microseconds of processor time. What proportion of the "
            "processor is consumed, and what would reduce it?\""
        ),
        ol([
            "Compute the total interrupt cost per second: 10,000 x 5 "
            "microseconds = 50,000 microseconds.",
            "Convert: 50,000 microseconds is 0.05 seconds.",
            "So 5% of one processor second is spent purely on interrupt "
            "overhead, before any packet is actually processed.",
            "Reducing it means fewer interrupts for the same data: DMA "
            "transferring blocks, or interrupt coalescing, where the adapter "
            "raises one interrupt for several packets.",
        ]),
        desc(
            "Scale that reasoning up and the design pressure becomes obvious. "
            "At 100,000 packets per second the same arithmetic gives 50% of a "
            "processor consumed by overhead alone -- which is precisely why "
            "high-rate network adapters coalesce interrupts and use DMA, and "
            "why 'one interrupt per unit of data' stops being viable long "
            "before the link is saturated."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("I/O is where hardware and operating system meet."),
        ul([
            "Interrupt handling is the mechanism from the Processor lesson, "
            "applied.",
            "Device drivers are an operating system component covered in the "
            "Software lessons.",
            "DMA competing for the bus is the contention the previous lesson "
            "described.",
            "Cache coherence after a DMA write is the stale-copy problem from "
            "the Memory lesson.",
            "Interrupt coalescing is a batching trade: throughput up, latency "
            "up, exactly as in queueing.",
            "Hot-plugging and plug and play reappear in Operating System "
            "device management.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Five distinctions this lesson establishes.",
            [("Memory-mapped against isolated I/O",
              "Shared address space against a separate one",
              "Memory-mapped needs no special instructions and consumes "
              "address space; isolated needs IN and OUT instructions."),
             ("The three transfer methods, in order",
              "Polling, interrupt-driven, DMA",
              "Each removes the processor further from the transfer. DMA "
              "gives one interrupt per block rather than per unit."),
             ("Cycle stealing",
              "DMA taking bus cycles from the processor",
              "So DMA is not free: the processor waits more often, and still "
              "gains enormously over moving each byte itself."),
             ("Why device registers are uncacheable",
              "Reading twice may give different values",
              "And writing has an effect beyond storing. The page is marked "
              "uncacheable, which is why device access is slow."),
             ("Controller against driver",
              "Hardware against software",
              "The driver is the only part of the operating system that must "
              "know this specific device.")]),
    ]),
]

_io_quiz = [
    mcq("EASY",
        "Device registers are placed at ordinary memory addresses, so the "
        "processor reaches them with the same load and store instructions it "
        "uses for memory.\n\n"
        "What is this scheme called?",
        [("Isolated I/O", False),
         ("Memory-mapped I/O", True),
         ("Direct memory access", False),
         ("Programmed I/O", False)],
        "Memory-mapped I/O places device registers in the memory address "
        "space, so no special instructions are needed and every addressing "
        "mode works on them. Isolated, or port-mapped, I/O gives devices a "
        "separate address space reached by dedicated IN and OUT instructions. "
        "DMA and programmed I/O describe how data is TRANSFERRED rather than "
        "how a device is addressed."),

    mcq("AVERAGE",
        "Under direct memory access, how many interrupts does the processor "
        "receive for a single block transfer?",
        [("One per byte transferred", False),
         ("One for the whole block", True),
         ("One per bus cycle used", False),
         ("None, since DMA requires no processor involvement at all", False)],
        "The DMA controller moves the entire block and raises one interrupt "
        "when it is complete, which is the whole point: interrupt-driven I/O "
        "pays a context switch per unit of data, and DMA reduces that to one "
        "per block. The processor is still involved at both ends -- it "
        "programs the transfer and handles the completion -- so 'no "
        "involvement at all' overstates it."),

    mcq("AVERAGE",
        "A DMA controller and the processor both need the system bus during a "
        "large transfer, so the processor's own memory accesses are delayed.\n\n"
        "What is this effect called?",
        [("Thrashing", False),
         ("Cycle stealing", True),
         ("Interrupt coalescing", False),
         ("Bus arbitration failure", False)],
        "Cycle stealing is the DMA controller taking bus cycles the processor "
        "would otherwise have used, so the processor is not stopped but waits "
        "more often. It is why DMA is not entirely free -- though the cost is "
        "far below moving each byte with instructions. Thrashing is excessive "
        "paging in virtual memory, and interrupt coalescing is combining "
        "several notifications into one."),

    mcq("HARD",
        "A network adapter receives 20,000 packets per second, and each "
        "interrupt costs 5 microseconds of processor time.\n\n"
        "What proportion of one processor is consumed by interrupt overhead "
        "alone?",
        [("2%", False),
         ("10%", True),
         ("20%", False),
         ("50%", False)],
        "20,000 interrupts at 5 microseconds each is 100,000 microseconds, "
        "which is 0.1 seconds -- 10% of one processor second, before a single "
        "packet has actually been processed. Scaling this is exactly why "
        "high-rate adapters coalesce interrupts and use DMA: at 100,000 "
        "packets per second the same arithmetic would consume half a "
        "processor on overhead."),

    mcq("AVERAGE",
        "Memory-mapped device registers are marked as uncacheable.\n\n"
        "Why is this necessary?",
        [("Device registers change size depending on the device attached",
          False),
         ("Reading the same register twice may legitimately give different "
          "values", True),
         ("Caches cannot store values narrower than a full word", False),
         ("The address space reserved for devices is too small to cache "
          "efficiently", False)],
        "A device register is not storage: reading a status register twice may "
        "correctly return different values as the device's state changes, and "
        "writing to a control register has an effect beyond recording a "
        "value. A cache would serve a stale value on the second read and "
        "might not perform the write at all. This is also why memory-mapped "
        "device access is slow despite looking like an ordinary memory "
        "reference."),

    mcq("EASY",
        "Which transfer method has the processor repeatedly check whether a "
        "device is ready, and move each unit of data itself?",
        [("Programmed I/O with polling", True),
         ("Interrupt-driven I/O", False),
         ("Direct memory access", False),
         ("Channel I/O", False)],
        "Polling occupies the processor entirely for the duration of the "
        "transfer, doing nothing but asking and copying. It needs no extra "
        "hardware and is genuinely appropriate for very small transfers, "
        "where setting up an interrupt would cost more than the transfer. "
        "Interrupt-driven I/O lets the device signal readiness, and DMA "
        "removes the processor from the data path entirely."),

    mcq("AVERAGE",
        "What is the relationship between a device controller and a device "
        "driver?",
        [("The controller is hardware; the driver is software that operates "
          "it", True),
         ("The controller is part of the operating system; the driver is part "
          "of the device", False),
         ("They are two names for the same component", False),
         ("The driver is hardware that translates signals for the "
          "controller", False)],
        "The controller is the hardware implementing a device's interface -- "
        "its registers, buffering and signalling -- and the driver is the "
        "software module that knows how to operate that particular "
        "controller. Confining device-specific knowledge to the driver is "
        "what lets one operating system support an enormous variety of "
        "hardware through a small number of driver shapes."),

    mcq("HARD",
        "After a DMA controller writes received data directly into main "
        "memory, the processor reads those addresses and sees outdated "
        "values.\n\n"
        "What has happened?",
        [("The DMA controller wrote to the wrong physical addresses", False),
         ("Cached copies of those addresses were not invalidated", True),
         ("The interrupt for the completed transfer was lost", False),
         ("The memory management unit translated the addresses "
          "incorrectly", False)],
        "The DMA controller wrote to main memory without going through the "
        "processor's cache, so any cached copy of those addresses still holds "
        "the values from before the transfer, and the processor is served the "
        "stale copy. Modern systems maintain cache coherence in hardware; "
        "where they do not, the driver must invalidate the affected lines "
        "explicitly, and omitting that produces a defect visible only under "
        "particular timing."),

    mcq("AVERAGE",
        "Isolated I/O gives devices an address space separate from main "
        "memory.\n\n"
        "What does this require of the processor?",
        [("A wider address bus than memory-mapped I/O needs", False),
         ("Dedicated instructions and a control line to select the space",
          True),
         ("That device registers be cached like ordinary memory", False),
         ("That all devices be connected to the same physical bus", False)],
        "With two address spaces, the processor needs a way to say which one "
        "an access refers to -- dedicated IN and OUT instructions, and a "
        "control line indicating the space -- because the address alone is "
        "now ambiguous. The benefit is that the whole memory address space "
        "stays available for memory, which mattered far more when address "
        "spaces were 16 or 20 bits than it does at 64."),

    mcq("HARD",
        "For a transfer of only a few bytes to a device that is already "
        "ready, polling can outperform interrupt-driven I/O.\n\n"
        "Why?",
        [("Polling transfers more bytes per bus cycle", False),
         ("The cost of taking and returning from an interrupt exceeds the "
          "transfer itself", True),
         ("Interrupts cannot be used for transfers below one block", False),
         ("Polling allows the processor to continue other work meanwhile",
          False)],
        "Handling an interrupt means saving state, dispatching to a handler, "
        "and restoring state -- a fixed cost of microseconds that does not "
        "shrink with the transfer. Moving four bytes from a device that is "
        "already ready takes a few instructions, so the overhead dominates "
        "and polling is simply cheaper. Polling is the method that does NOT "
        "let the processor do other work, which is exactly why it stops being "
        "appropriate as soon as waiting is involved."),
]

LESSON_IO_INTERFACE = lesson(
    MAJOR, MIDDLE,
    "Input/Output Interfaces and Device Control",
    _io_quiz,
    lesson_structure(
        "Input/Output Interfaces and Device Control",
        "A processor works in nanoseconds and fixed word sizes; a disk works "
        "in milliseconds and a keyboard in tenths of a second. An interface "
        "bridges those mismatches, and this lesson covers how. It sets out "
        "what a controller and a driver each do, the two ways a processor can "
        "address a device, and the three transfer methods in ascending order "
        "of how little of the processor's time they consume -- ending with "
        "DMA, which is how disks and networks actually work, and whose "
        "mechanism explains both cycle stealing and a whole class of "
        "stale-cache defects.",
        [
            "Explain the mismatches an I/O interface exists to bridge",
            "Distinguish a device controller from a device driver",
            "Compare memory-mapped with isolated I/O and state what each "
            "costs",
            "Explain why memory-mapped device registers must not be cached",
            "Compare polling, interrupt-driven I/O and DMA, and identify each "
            "from a description",
            "Describe how a DMA transfer proceeds and what cycle stealing is",
            "Calculate interrupt overhead and explain why coalescing exists",
        ],
        60,
        _io_sections,
        [
            ("Device controller",
             "The hardware implementing a device's interface -- its "
             "registers, buffering and signalling."),
            ("Device driver",
             "The software module that knows how to operate a particular "
             "controller. The only part of an operating system that must "
             "understand a specific device."),
            ("Memory-mapped I/O",
             "Placing device registers in the memory address space, so "
             "ordinary load and store instructions reach them. Consumes "
             "address space and needs no special instructions."),
            ("Isolated (port-mapped) I/O",
             "Giving devices a separate address space reached by dedicated IN "
             "and OUT instructions, leaving the memory space intact."),
            ("Programmed I/O",
             "The processor moving each unit of data itself, usually while "
             "polling for readiness. Simple, and it consumes the processor "
             "entirely."),
            ("Interrupt-driven I/O",
             "The device signalling readiness so the processor can work "
             "elsewhere meanwhile. Pays a context switch per unit of data."),
            ("Direct memory access (DMA)",
             "A controller transferring a whole block between device and "
             "memory without the processor touching the data, raising one "
             "interrupt at completion."),
            ("Cycle stealing",
             "A DMA controller taking bus cycles the processor would "
             "otherwise use, so the processor waits more often without being "
             "stopped."),
            ("Channel / I/O processor",
             "A dedicated processor executing a program of I/O operations "
             "independently. The ancestor of modern offload engines."),
            ("Interrupt coalescing",
             "Raising one interrupt for several events, trading a little "
             "latency for a large reduction in overhead at high rates."),
            ("Hot-plugging",
             "Connecting or disconnecting a device while the system runs, "
             "requiring dynamic driver loading."),
            ("Plug and play",
             "A device describing itself so the system can identify and "
             "configure it without manual intervention."),
        ],
        "An interface exists to bridge mismatches in speed, format, "
        "electrical characteristics and control between a processor and a "
        "device -- with the controller as the hardware and the driver as the "
        "software that operates it, which is what confines device-specific "
        "knowledge to one replaceable component. The processor reaches a "
        "device either through memory-mapped I/O, where registers occupy "
        "ordinary memory addresses and any load or store reaches them, or "
        "through isolated I/O, where a separate space needs dedicated "
        "instructions; memory-mapped has largely won, and its registers must "
        "be marked uncacheable because reading one twice may correctly give "
        "different values. Data then moves by one of three methods in "
        "ascending order of processor economy: polling, where the processor "
        "does everything and is consumed entirely; interrupt-driven transfer, "
        "where the device signals readiness but each unit costs a context "
        "switch; and DMA, where a controller moves the whole block and raises "
        "a single interrupt at the end. DMA is not quite free -- it competes "
        "for the bus, which is cycle stealing, and it writes to memory behind "
        "the cache, so stale cached copies must be invalidated. And the "
        "arithmetic of interrupt overhead, a few microseconds multiplied by "
        "tens of thousands of events per second, is exactly why high-rate "
        "devices coalesce interrupts rather than raising one per packet.",
        exam_notes=[
            desc(
                "I/O items on Subject A are mostly identification, with the "
                "occasional overhead calculation."
            ),
            ul([
                "Naming the transfer method from a description of who does "
                "the work.",
                "Distinguishing memory-mapped from isolated I/O.",
                "Explaining what cycle stealing is.",
                "Computing interrupt overhead from a rate and a per-interrupt "
                "cost.",
                "Distinguishing a controller from a driver.",
                "Explaining why device registers are not cached.",
            ]),
            desc(
                "The reliable tells for the transfer method: 'the processor "
                "repeatedly checks' is polling, 'the device signals when "
                "ready' is interrupt-driven, and 'without processor "
                "involvement' or 'one interrupt per block' is DMA."
            ),
        ],
    ))

LESSONS = [LESSON_BUS, LESSON_IO_INTERFACE]

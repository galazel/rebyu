"""IT Passport lesson content: Computer System, part one (738-742)."""

import sys

sys.path.insert(0, "/app/scripts/fe_expansion")

from builders import (  # noqa: E402
    accordion, compare_grid, content_tabs, desc, flip_cards, image, image_text,
    lesson_structure, media_text, ol, review_cards, sub, table, tabs, ul,
)

FIG = "/lesson-media/%s.svg"

CERTIFICATION_ID = 4

LESSONS = {}


LESSONS[738] = lesson_structure(
    name="Processor",
    intro=(
        "The processor is the part of a computer that actually carries out "
        "instructions. This lesson covers what it does on every cycle, what clock "
        "speed and core count really mean for performance, and why the fastest "
        "processor is not always the one that makes a system faster."
    ),
    objectives=[
        "Describe the fetch-decode-execute cycle.",
        "Explain what the control unit and arithmetic logic unit each do.",
        "State what clock frequency measures and what it does not.",
        "Explain what multi-core and multi-threading provide.",
        "Describe what a cache is for.",
        "Identify when the processor is not the bottleneck.",
    ],
    minutes=35,
    sections=[
        ("What the processor is made of", [
            desc(
                "A processor -- the CPU -- contains a control unit that decides what "
                "happens next, an arithmetic logic unit that performs calculations and "
                "comparisons, and registers, which are a handful of extremely fast "
                "storage locations inside the chip itself."
            ),
            ul([
                "Control unit -- fetches instructions and directs the other parts.",
                "Arithmetic logic unit (ALU) -- adds, subtracts, compares, applies logic.",
                "Registers -- hold the values currently being worked on.",
            ]),
        ]),
        ("The instruction cycle", [
            desc(
                "Everything a computer does reduces to this loop, repeated billions of "
                "times a second."
            ),
            image(FIG % "ip-instruction-cycle"),
            ol([
                "Fetch -- read the next instruction from memory.",
                "Decode -- work out what operation it requires.",
                "Execute -- carry it out, usually in the ALU.",
                "Store -- write the result back to a register or to memory.",
            ]),
        ]),
        ("Clock speed", [
            desc(
                "The clock is a pulse that synchronises the processor's steps, measured "
                "in hertz. A 3 GHz processor ticks three billion times a second."
            ),
            desc(
                "Clock speed only compares like with like. Two processors of different "
                "designs can do different amounts of work per tick, so a 3 GHz chip of "
                "one family may be slower than a 2.5 GHz chip of another. Comparing "
                "figures across families is the classic mistake."
            ),
        ]),
        ("Cores and threads", [
            compare_grid(
                "More cores against a faster clock",
                "Which helps depends entirely on the work.",
                [("More cores",
                  "Several instruction streams truly run at once. Helps when the work "
                  "splits -- video encoding, many simultaneous users, background tasks."),
                 ("Faster clock",
                  "Each single stream runs quicker. Helps when the work cannot be "
                  "divided, which is true of a great deal of ordinary software.")],
            ),
            desc(
                "Doubling the cores rarely halves the time. Part of almost any task "
                "cannot be parallelised, and that part sets a floor on how fast the "
                "whole job can finish however many cores are added."
            ),
        ]),
        ("Cache", [
            desc(
                "Main memory is far slower than the processor, so a small amount of very "
                "fast memory sits between them holding recently used data. When the "
                "processor finds what it needs there, it avoids the wait."
            ),
            desc(
                "This works because programs reuse the same data and instructions "
                "repeatedly -- a loop touches the same variables on every pass. Cache "
                "levels are numbered by distance: L1 is smallest and fastest, L3 larger "
                "and slower."
            ),
        ]),
        ("When the processor is not the problem", [
            desc(
                "A system feels slow for whichever reason is worst, and it is often not "
                "the processor. Replacing the CPU when the disk is the constraint "
                "changes nothing a user can notice."
            ),
            table(
                ["Symptom", "Likely constraint", "What helps"],
                [["Constant disk activity, slow to open files", "Storage", "An SSD"],
                 ["Slow when many programs are open", "Memory", "More RAM"],
                 ["Slow downloads, fine locally", "Network", "Bandwidth or latency"],
                 ["One calculation takes a long time", "Processor", "A faster or newer CPU"]],
                caption="Diagnose before upgrading; the fastest component is not always the busy one.",
            ),
        ]),
        ("Kinds of processor", [
            accordion([
                ("CPU", "The general-purpose processor that runs the operating system and applications."),
                ("GPU", "Designed for many simple calculations at once; used for graphics, and for AI training."),
                ("Embedded processor", "Built into an appliance or a vehicle to do one job reliably."),
                ("32-bit and 64-bit", "How much data the processor handles at once, and how much memory it can address. A 32-bit system is limited to about 4 GB."),
            ]),
        ]),
        ("Recall practice", [
            desc("Cover the answers first."),
            flip_cards([
                ("What are the four steps of the instruction cycle?", "Fetch, decode, execute, store",
                 "Repeated billions of times a second."),
                ("Does 3 GHz always beat 2.5 GHz?", "No",
                 "Only within the same design; different families do different work per tick."),
                ("What does cache exploit?", "Programs reuse the same data",
                 "A loop touches the same variables on every pass."),
                ("Why is 32-bit limited to about 4 GB?", "The address size",
                 "2^32 distinct addresses is roughly four billion bytes."),
            ]),
        ]),
    ],
    key_terms=[
        ("CPU", "The processor: control unit, arithmetic logic unit and registers."),
        ("Instruction cycle", "Fetch, decode, execute, store -- repeated continuously."),
        ("Clock frequency", "Pulses per second, in hertz; comparable only within a processor family."),
        ("Core", "An independent processing unit; several allow true simultaneous execution."),
        ("Cache", "Small fast memory holding recently used data, between CPU and main memory."),
        ("GPU", "A processor built for many simple parallel calculations."),
    ],
    summary=(
        "The processor repeats fetch, decode, execute and store, synchronised by a "
        "clock whose frequency is comparable only within a design family. Multiple "
        "cores run separate streams simultaneously and help only when work divides, "
        "while cache hides the gap between fast processor and slow memory by "
        "exploiting reuse. A slow system is often constrained by disk, memory or "
        "network rather than by the processor, so diagnosis should precede any "
        "upgrade."
    ),
    exam_notes=[
        desc(
            "Expect a question contrasting clock speed with core count, and one on "
            "which component to upgrade for a described symptom. The answer to the "
            "latter is rarely the CPU."
        ),
        ul([
            "Clock speeds compare only within the same processor family.",
            "More cores help only when the work can be divided.",
            "Registers are inside the processor; cache sits between it and RAM.",
        ]),
    ],
)


LESSONS[739] = lesson_structure(
    name="Memory",
    intro=(
        "Storage in a computer is arranged as a hierarchy, from a few very fast bytes "
        "inside the processor to terabytes of slow, permanent storage. This lesson "
        "covers what sits at each level, the difference between volatile and "
        "non-volatile memory, and why the arrangement exists at all."
    ),
    objectives=[
        "Describe the memory hierarchy and why it is shaped that way.",
        "Distinguish RAM from ROM and volatile from non-volatile.",
        "Explain what virtual memory does and what it costs.",
        "Compare a hard disk with an SSD.",
        "Calculate simple storage requirements.",
        "Explain why adding memory can speed a system up dramatically.",
    ],
    minutes=35,
    sections=[
        ("The hierarchy", [
            desc(
                "No single technology is both fast and cheap, so computers use several "
                "and move data between them. Each level down is larger, cheaper per byte "
                "and markedly slower."
            ),
            image(FIG % "ip-memory-hierarchy"),
            desc(
                "The arrangement works for the same reason cache works: programs use a "
                "small part of their data most of the time, so keeping that part high in "
                "the hierarchy gives most of the speed at a fraction of the cost."
            ),
        ]),
        ("Volatile and non-volatile", [
            compare_grid(
                "What survives losing power",
                "This single property decides what each kind of memory is used for.",
                [("Volatile -- RAM",
                  "Contents vanish when power is removed. Fast, and used for whatever "
                  "the machine is working on right now."),
                 ("Non-volatile -- ROM, SSD, disk",
                  "Contents persist without power. Slower, and used for anything that "
                  "must still be there tomorrow.")],
            ),
            desc(
                "This is why unsaved work is lost in a power cut: it existed only in "
                "RAM. Saving copies it to non-volatile storage."
            ),
        ]),
        ("RAM and ROM", [
            table(
                ["", "RAM", "ROM"],
                [["Stands for", "Random Access Memory", "Read Only Memory"],
                 ["Written by", "The running system, constantly", "Written once (or rarely)"],
                 ["Survives power off", "No", "Yes"],
                 ["Typical contents", "Running programs and their data", "Firmware that starts the machine"]],
            ),
            desc(
                "Flash memory blurs the line: it is non-volatile like ROM but can be "
                "rewritten. It is what USB drives, memory cards and SSDs are built from."
            ),
        ]),
        ("Virtual memory", [
            desc(
                "When programs need more memory than physically exists, the operating "
                "system moves parts that are not being used out to disk and brings them "
                "back when required. To the program, memory simply appears larger than "
                "it is."
            ),
            desc(
                "The cost is speed. Disk is thousands of times slower than RAM, so a "
                "system doing this constantly -- thrashing -- becomes unusable while "
                "appearing busy. That is why adding RAM to a machine that was swapping "
                "heavily produces a dramatic improvement, and why adding it to one that "
                "was not produces almost none."
            ),
        ]),
        ("Storage devices", [
            accordion([
                ("Hard disk drive (HDD)", "Spinning magnetic platters with a moving head. Cheap per terabyte; the head movement makes random access slow."),
                ("Solid-state drive (SSD)", "Flash memory with no moving parts. No seek time, so random access is dramatically faster; finite write endurance, managed by its firmware."),
                ("Optical disc", "CD, DVD, Blu-ray. Read by laser; largely superseded for everyday storage."),
                ("USB flash drive / memory card", "Portable flash storage; convenient, and easily lost, which is why encryption matters."),
                ("Cloud storage", "Held by a provider and reached over a network. Available anywhere, dependent on connectivity."),
            ]),
        ]),
        ("Working out how much is needed", [
            desc(
                "Storage questions are arithmetic. Multiply the size of one item by how "
                "many, then convert."
            ),
            content_tabs(
                "Two worked examples",
                "Attempt each before reading the working.",
                [("2,000 photos at 4 MB each", "About 8 GB",
                  "2,000 x 4 MB = 8,000 MB, which is roughly 8 GB."),
                 ("One hour of CD-quality audio", "About 600 MB",
                  "44,100 x 16 x 2 bits per second is 1,411,200 bits = 176.4 KB. "
                  "Times 3,600 seconds is about 635 MB.")],
            ),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Why is unsaved work lost in a power cut?", "It was only in RAM",
                 "RAM is volatile; saving writes to non-volatile storage."),
                ("What is thrashing?", "Constant swapping to disk",
                 "The system is busy moving memory in and out rather than doing work."),
                ("Biggest practical advantage of an SSD?", "No seek time",
                 "Random access is dramatically faster than a spinning disk."),
                ("Which is faster: cache or RAM?", "Cache",
                 "It is closer to the processor and smaller; that is the trade."),
            ]),
        ]),
    ],
    key_terms=[
        ("Memory hierarchy", "Levels from registers to disk, each larger, cheaper and slower."),
        ("Volatile", "Loses its contents when power is removed, as RAM does."),
        ("RAM", "Fast volatile memory holding what the machine is working on."),
        ("ROM", "Non-volatile memory holding firmware; written once or rarely."),
        ("Virtual memory", "Using disk to extend apparent memory; slow when relied on heavily."),
        ("SSD", "Flash-based storage with no moving parts and no seek time."),
    ],
    summary=(
        "Memory is arranged as a hierarchy because no technology is both fast and "
        "cheap, and it works because programs concentrate on a small part of their "
        "data. RAM is volatile and holds current work; ROM and flash persist without "
        "power. Virtual memory extends capacity using disk and collapses performance "
        "when overused, which is why adding RAM helps a swapping machine enormously "
        "and a comfortable one hardly at all."
    ),
    exam_notes=[
        desc(
            "Storage calculations appear regularly. Watch whether the question defines "
            "1 MB as 1,000 KB or 1,024 KB -- it always says, and it changes the answer."
        ),
        ul([
            "Volatile means lost on power off. RAM is volatile; ROM and flash are not.",
            "Virtual memory trades speed for capacity.",
            "Cache is faster and smaller than RAM; registers are faster still.",
        ]),
    ],
)


LESSONS[740] = lesson_structure(
    name="Input/output devices",
    intro=(
        "Input devices turn something in the world into data; output devices turn data "
        "back into something a person can perceive. This lesson covers the devices the "
        "examination names, the interfaces that connect them, and the characteristics "
        "that decide which device suits a task."
    ),
    objectives=[
        "Classify devices as input, output or both.",
        "Describe common input devices and what each suits.",
        "Compare display and printer types.",
        "Explain what resolution and colour depth mean.",
        "Identify common interfaces and what they connect.",
        "Explain what a device driver does.",
    ],
    minutes=35,
    sections=[
        ("Input, output, or both", [
            desc(
                "The direction is relative to the computer. A keyboard sends data in; a "
                "monitor takes data out; a touchscreen and a network interface do both."
            ),
            table(
                ["Input", "Output", "Both"],
                [["Keyboard, mouse", "Monitor", "Touchscreen"],
                 ["Scanner, camera", "Printer", "Network interface"],
                 ["Microphone", "Speakers", "Storage device"],
                 ["Barcode / RFID reader", "Projector", "Modem"]],
            ),
        ]),
        ("Input devices", [
            accordion([
                ("Keyboard and mouse", "The general-purpose pair; precise, and requiring a surface and attention."),
                ("Touchscreen", "Direct and intuitive, at the cost of precision and a screen covered in fingerprints."),
                ("Scanner", "Turns a physical document into an image; with OCR, into editable text."),
                ("Barcode reader", "Reads a printed code optically; needs line of sight and a clean label."),
                ("RFID reader", "Reads a tag by radio, without line of sight, and many tags at once."),
                ("Biometric reader", "Fingerprint, face or iris; identifies a person rather than a card they carry."),
                ("Sensor", "Temperature, motion, light; the input side of most IoT systems."),
            ]),
        ]),
        ("Displays", [
            desc(
                "Resolution is the number of pixels, written width by height. More "
                "pixels means a sharper image and more work for the graphics hardware."
            ),
            desc(
                "Colour depth is the bits per pixel: 24-bit gives about 16.7 million "
                "colours, eight bits each for red, green and blue. Resolution and colour "
                "depth together determine how much memory a single frame occupies."
            ),
            ul([
                "LCD -- the common flat panel, lit from behind.",
                "OLED -- each pixel emits its own light, so black is genuinely black.",
                "Projector -- throws the image onto a surface for an audience.",
                "Touch panel -- a display that is also an input device.",
            ]),
        ]),
        ("Printers", [
            compare_grid(
                "Choosing a printer",
                "The right choice follows from volume and from what is being printed.",
                [("Inkjet",
                  "Sprays droplets. Cheap to buy, good photographs, expensive per page, "
                  "and the ink dries out if unused."),
                 ("Laser",
                  "Fuses toner with heat. Fast, sharp text, economical at volume, and "
                  "costlier up front.")],
            ),
            ul([
                "3D printer -- builds an object in layers from a digital model.",
                "Dot matrix -- strikes through a ribbon; still used where carbon copies are needed.",
                "Resolution is measured in dots per inch (dpi); higher is finer.",
            ]),
        ]),
        ("Interfaces", [
            desc(
                "An interface is the connection and the agreed rules for using it. "
                "Choosing the wrong one usually shows up as a device that fits "
                "physically but does not work."
            ),
            table(
                ["Interface", "Typically connects", "Note"],
                [["USB", "Almost any peripheral", "Supplies power as well as data"],
                 ["HDMI", "Displays and projectors", "Carries video and audio together"],
                 ["Bluetooth", "Nearby wireless devices", "Short range, low power"],
                 ["Wi-Fi", "Networks", "Longer range, higher throughput"],
                 ["Ethernet", "Wired networks", "More reliable and consistent than wireless"]],
            ),
        ]),
        ("Device drivers", [
            desc(
                "A driver is software that lets the operating system talk to a specific "
                "device. Without the right one a device may be detected and still not "
                "work, or work with only basic features."
            ),
            desc(
                "Drivers run with high privilege, which is why they are a security "
                "concern: a malicious or vulnerable driver has deep access to the "
                "system. Installing them from the manufacturer rather than from a search "
                "result matters."
            ),
        ]),
        ("Accessibility", [
            desc(
                "Input and output choices decide who can use a system at all. "
                "Alternatives are not optional extras where the system must serve "
                "everyone."
            ),
            ul([
                "Screen readers turn text into speech -- which is why images need alt text.",
                "Keyboard-only operation matters to anyone who cannot use a mouse.",
                "Adjustable text size and contrast serve low vision.",
                "Captions serve deaf users, and anyone in a noisy room.",
            ]),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Which reader needs no line of sight?", "RFID",
                 "Barcodes and QR codes must be visible to the scanner."),
                ("What does colour depth measure?", "Bits per pixel",
                 "24-bit gives about 16.7 million colours."),
                ("Inkjet or laser for high-volume text?", "Laser",
                 "Faster, sharper text and cheaper per page at volume."),
                ("Why are drivers a security concern?", "They run with high privilege",
                 "A vulnerable driver has deep access to the system."),
            ]),
        ]),
    ],
    key_terms=[
        ("Input device", "Turns something in the world into data for the computer."),
        ("Output device", "Turns data into something a person can perceive."),
        ("Resolution", "The number of pixels, written width by height."),
        ("Colour depth", "Bits used per pixel; 24-bit is about 16.7 million colours."),
        ("Interface", "The physical connection and the rules for using it, such as USB or HDMI."),
        ("Device driver", "Software letting the operating system control a specific device."),
    ],
    summary=(
        "Input devices convert the world into data and output devices reverse it, with "
        "touchscreens, networks and storage doing both. Resolution and colour depth "
        "describe a display and together fix the size of a frame. Inkjet suits low "
        "volume and photographs while laser suits high-volume text. Interfaces such as "
        "USB, HDMI and Ethernet each carry particular traffic, and a driver is what "
        "lets the operating system use a device at all."
    ),
    exam_notes=[
        desc(
            "Classification questions are common -- given a device, say whether it is "
            "input, output or both. Remember that a touchscreen and a network interface "
            "are both."
        ),
        ul([
            "RFID reads without line of sight and reads many tags at once.",
            "Laser wins on volume; inkjet wins on photographs and purchase price.",
            "Drivers run privileged, so their source matters.",
        ]),
    ],
)


LESSONS[741] = lesson_structure(
    name="System configuration",
    intro=(
        "A single computer fails, and a business that depends on it stops. This lesson "
        "covers the ways systems are arranged so that a failure is survivable -- "
        "redundancy, clustering, RAID and backup -- and the trade each arrangement "
        "makes between cost, complexity and how quickly service returns."
    ),
    objectives=[
        "Describe redundancy and why it removes single points of failure.",
        "Distinguish hot, warm and cold standby.",
        "Explain what RAID 0, 1 and 5 each provide.",
        "State clearly why RAID is not a backup.",
        "Compare full, differential and incremental backup.",
        "Describe client-server and cloud arrangements.",
    ],
    minutes=40,
    sections=[
        ("Single points of failure", [
            desc(
                "A single point of failure is any component whose failure stops the "
                "whole service. Finding them is the first step in making a system "
                "dependable, and they are often not the obvious parts -- a single power "
                "feed or one network switch will do it."
            ),
            desc(
                "Redundancy removes them by providing more of a component than is "
                "strictly needed, so that one can fail while the service continues."
            ),
        ]),
        ("Standby arrangements", [
            desc(
                "Standby systems differ in how ready the spare is, which trades cost "
                "against how long recovery takes."
            ),
            table(
                ["Arrangement", "State of the spare", "Recovery", "Cost"],
                [["Hot standby", "Running and synchronised", "Seconds -- takes over automatically", "Highest"],
                 ["Warm standby", "Running, data periodically updated", "Minutes", "Middle"],
                 ["Cold standby", "Available but not running", "Hours", "Lowest"]],
                caption="The right rung is whichever meets the recovery time the business needs.",
            ),
            desc(
                "Two servers each 99% available give 99.99% together IF they fail "
                "independently. A shared power supply or switch breaks that assumption, "
                "and the pair is then no better than the thing they share."
            ),
        ]),
        ("Clustering and load balancing", [
            compare_grid(
                "Two reasons to run several servers",
                "The arrangements look similar and answer different needs.",
                [("Clustering for availability",
                  "Several machines present one service; if one fails the others carry "
                  "on. The goal is survival."),
                 ("Load balancing for capacity",
                  "Requests are distributed across machines so none is overwhelmed. The "
                  "goal is throughput, with availability as a side effect.")],
            ),
        ]),
        ("RAID", [
            desc(
                "RAID combines several disks so that the set behaves better than one "
                "disk -- faster, larger, or able to survive a failure."
            ),
            image(FIG % "ip-raid-levels"),
            desc(
                "RAID protects against a DISK failing. It does not protect against a "
                "file being deleted, a database being corrupted, ransomware encrypting "
                "everything, or the building burning down -- because every one of those "
                "is faithfully written to all the disks at once. RAID is not a backup, "
                "and treating it as one is a costly and common mistake."
            ),
        ]),
        ("Backup", [
            desc(
                "A backup is a separate copy that can restore data after loss. The "
                "strategies differ in what each run copies, which trades speed of "
                "backup against complexity of restore."
            ),
            image(FIG % "ip-backup-types"),
            ol([
                "Full -- everything, every time. Simplest restore, slowest to take.",
                "Differential -- everything changed since the last FULL. Restore needs the full plus the latest differential.",
                "Incremental -- everything changed since the last BACKUP of any kind. Fastest to take; restore needs the full plus every incremental since.",
            ]),
            desc(
                "A backup that has never been restored is an assumption rather than a "
                "protection. Testing the restore is the only thing that proves the "
                "strategy works, and it is the step most often skipped."
            ),
        ]),
        ("Where the work happens", [
            accordion([
                ("Client-server", "Clients request, a server provides. Central control and central failure."),
                ("Peer-to-peer", "Each machine is both client and server. No central point, harder to manage."),
                ("Thin client", "Almost all processing on the server; the device is a screen and keyboard. Easy to manage and replace."),
                ("Cloud", "Resources consumed as a service from a provider, scaling with demand and billed by use."),
                ("Edge", "Processing near where the data is produced, to avoid the delay of a round trip."),
            ]),
        ]),
        ("Virtualisation", [
            desc(
                "Virtualisation runs several logical machines on one physical one, each "
                "with its own operating system. It raises utilisation -- most servers "
                "are idle most of the time -- and makes a machine something that can be "
                "created, copied and destroyed in minutes."
            ),
            desc(
                "The trade is concentration: a physical host failing takes every virtual "
                "machine on it, which is why virtualised estates are clustered."
            ),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Is RAID a backup?", "No",
                 "It survives a disk failing. Deletion, corruption and ransomware are written to every disk."),
                ("Which backup restores from full + latest only?", "Differential",
                 "Incremental needs the full plus every incremental since."),
                ("Fastest recovery standby?", "Hot standby",
                 "Running and synchronised, so it takes over in seconds -- at the highest cost."),
                ("Why might two 99% servers not give 99.99%?", "Shared dependency",
                 "A common power feed or switch means the failures are not independent."),
            ]),
        ]),
    ],
    key_terms=[
        ("Single point of failure", "A component whose failure stops the entire service."),
        ("Redundancy", "Providing more of a component than needed so one can fail."),
        ("Hot standby", "A spare already running and synchronised, taking over in seconds."),
        ("RAID", "Combining disks for speed, capacity or survival of a disk failure."),
        ("Incremental backup", "Copies what changed since the last backup of any kind."),
        ("Virtualisation", "Running several logical machines on one physical machine."),
    ],
    summary=(
        "Dependability begins with finding single points of failure and adding "
        "redundancy, with hot, warm and cold standby trading cost against recovery "
        "time. Clustering pursues availability and load balancing pursues capacity. "
        "RAID survives a failed disk and is not a backup, because deletion, corruption "
        "and ransomware reach every disk equally. Backup strategies trade the speed of "
        "taking a copy against the complexity of restoring one, and an untested "
        "restore proves nothing."
    ),
    exam_notes=[
        desc(
            "\"RAID is not a backup\" is examined directly and often. So is the "
            "difference between differential and incremental -- the tell is what a "
            "restore requires."
        ),
        ul([
            "Differential: full + the latest one. Incremental: full + ALL since.",
            "Redundancy only helps if the failures are genuinely independent.",
            "Hot standby is fastest and dearest; cold is cheapest and slowest.",
        ]),
    ],
)


LESSONS[742] = lesson_structure(
    name="System evaluation indexes",
    intro=(
        "Choosing between systems, or judging whether one is performing, needs numbers. "
        "This lesson covers the measures used -- throughput, response time, "
        "availability, MTBF and MTTR -- how they are calculated, and how a system can "
        "look healthy on one and fail its users on another."
    ),
    objectives=[
        "Distinguish throughput from response time.",
        "Calculate availability from MTBF and MTTR.",
        "Explain what RASIS covers.",
        "Describe total cost of ownership and why purchase price misleads.",
        "Explain why an average response time can hide a problem.",
        "Interpret a benchmark result sensibly.",
    ],
    minutes=35,
    sections=[
        ("Throughput and response time", [
            compare_grid(
                "Two different questions about speed",
                "They can move in opposite directions, which is why both are reported.",
                [("Throughput",
                  "How much work completes per unit of time -- transactions per second, "
                  "jobs per hour. A capacity measure."),
                 ("Response time",
                  "How long ONE request takes from submission to answer. An experience "
                  "measure.")],
            ),
            desc(
                "Batching requests together raises throughput and lengthens each "
                "individual response. A system tuned purely for throughput can feel "
                "slow to every person using it."
            ),
        ]),
        ("Availability", [
            desc(
                "Availability is the proportion of time a system is usable, and it is "
                "computed from how often it fails and how long repairs take."
            ),
            image(FIG % "ip-availability"),
            ul([
                "MTBF -- mean time between failures. Higher is better.",
                "MTTR -- mean time to repair. Lower is better.",
                "Availability = MTBF / (MTBF + MTTR).",
            ]),
            desc(
                "Both levers work. Halving repair time improves availability exactly as "
                "much as doubling the time between failures, and is usually far cheaper "
                "to achieve."
            ),
        ]),
        ("What the nines mean", [
            table(
                ["Availability", "Downtime per year", "Downtime per month"],
                [["99%", "about 3.65 days", "about 7.2 hours"],
                 ["99.9%", "about 8.8 hours", "about 43 minutes"],
                 ["99.99%", "about 53 minutes", "about 4.3 minutes"],
                 ["99.999%", "about 5 minutes", "about 26 seconds"]],
                caption="Each additional nine costs roughly an order of magnitude more.",
            ),
        ]),
        ("RASIS", [
            accordion([
                ("Reliability", "How rarely it fails -- measured by MTBF."),
                ("Availability", "How much of the time it is usable."),
                ("Serviceability", "How quickly it can be repaired -- measured by MTTR."),
                ("Integrity", "Whether the data stays correct and uncorrupted."),
                ("Security", "Whether it is protected from unauthorised access."),
            ]),
            desc(
                "The five are not independent. Improving serviceability raises "
                "availability directly, and a security failure usually costs integrity "
                "as well."
            ),
        ]),
        ("Averages hide the tail", [
            desc(
                "A mean response time of 0.8 seconds sounds good and may describe a "
                "system where one request in twenty takes eight seconds. Users remember "
                "the eight."
            ),
            desc(
                "Reporting a percentile instead answers the useful question: at the 95th "
                "percentile, 95% of requests were faster than the stated figure. That is "
                "what a service level agreement should be written against."
            ),
        ]),
        ("Total cost of ownership", [
            desc(
                "The purchase price is the visible part of a multi-year commitment, and "
                "usually the smaller part."
            ),
            table(
                ["Cost", "Included in TCO", "Often forgotten"],
                [["Purchase or licence", "Yes", "No -- it is the obvious one"],
                 ["Installation and migration", "Yes", "Frequently"],
                 ["Training", "Yes", "Almost always"],
                 ["Support and maintenance", "Yes", "Sometimes"],
                 ["Power, cooling, space", "Yes", "Usually"],
                 ["Disposal at end of life", "Yes", "Nearly always"]],
            ),
            desc(
                "Deciding on purchase price alone systematically favours options that "
                "are cheap to buy and expensive to keep."
            ),
        ]),
        ("Benchmarks", [
            desc(
                "A benchmark is a standard workload run on different systems so their "
                "results can be compared. It is only meaningful if the workload "
                "resembles what the system will actually do."
            ),
            ul([
                "Compare benchmarks only where the same test was run the same way.",
                "A vendor's own figures describe the conditions they chose.",
                "A trial on your own data answers the question a benchmark approximates.",
            ]),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("MTBF 480h, MTTR 20h -- availability?", "96%",
                 "480 / (480 + 20) = 0.96."),
                ("Throughput or response time for one user's experience?", "Response time",
                 "Throughput measures total work completed, not any single wait."),
                ("What does the S in RASIS stand for, twice?", "Serviceability and Security",
                 "Reliability, Availability, Serviceability, Integrity, Security."),
                ("Why report a percentile instead of a mean?", "The mean hides the tail",
                 "A good average can conceal a minority of very slow requests."),
            ]),
        ]),
    ],
    key_terms=[
        ("Throughput", "Work completed per unit of time; a capacity measure."),
        ("Response time", "How long one request takes; an experience measure."),
        ("MTBF", "Mean time between failures."),
        ("MTTR", "Mean time to repair."),
        ("Availability", "MTBF / (MTBF + MTTR); the proportion of time a system is usable."),
        ("TCO", "Total cost of ownership across the whole life, not the purchase price."),
    ],
    summary=(
        "Throughput and response time answer different questions and can move in "
        "opposite directions. Availability follows from MTBF and MTTR, and reducing "
        "repair time is usually the cheaper lever; each additional nine costs an order "
        "of magnitude more. RASIS gathers reliability, availability, serviceability, "
        "integrity and security. Averages conceal slow tails, so percentiles belong in "
        "service agreements, and total cost of ownership rather than purchase price is "
        "the honest basis for a decision."
    ),
    exam_notes=[
        desc(
            "The availability formula is examined directly -- memorise MTBF / (MTBF + "
            "MTTR). Expect also a TCO question where the cheapest purchase price is the "
            "wrong answer."
        ),
        ul([
            "Availability = MTBF / (MTBF + MTTR).",
            "Throughput is total work; response time is one request's wait.",
            "RASIS: Reliability, Availability, Serviceability, Integrity, Security.",
        ]),
    ],
)

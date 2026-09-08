"""Computer System -> Computer Component, lessons 1 and 2.

Syllabus minor categories 1 (processor) and 2 (memory).

These two carry most of the Computer System weight on Subject A, and both are
examined numerically: instruction cycles, clock rates, cache hit ratios and
effective access times are all small calculations done without a calculator.
The prose therefore works each formula through on real numbers rather than
stating it.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Computer System"
MIDDLE = "Computer Component"

# ==========================================================================
# Lesson 1: The processor
# ==========================================================================

_cpu_sections = [
    ("What a Processor Actually Does", [
        desc(
            "A processor does one thing, endlessly: fetch an instruction, "
            "work out what it means, carry it out, and move to the next. "
            "Everything else -- pipelines, caches, multiple cores, branch "
            "prediction -- exists to make that loop run faster without "
            "changing what it does."
        ),
        image(fig("cpu-blocks")),
        desc(
            "Three units divide the work. The CONTROL UNIT fetches each "
            "instruction, decodes it, and issues the signals that make the "
            "rest of the machine carry it out; it computes nothing itself. "
            "The ARITHMETIC AND LOGIC UNIT performs the actual operations -- "
            "add, subtract, compare, AND, OR, shift -- and decides nothing "
            "about what to do next. REGISTERS are the small, extremely fast "
            "storage the ALU works on directly."
        ),
        desc(
            "Keeping direction and computation separate is what allows one "
            "ALU to serve every instruction in the set, and it is why "
            "examination items about 'which unit performs X' have "
            "unambiguous answers: if it is arithmetic or a comparison it is "
            "the ALU, and if it is about sequencing or interpreting an "
            "instruction it is the control unit."
        ),
    ]),

    ("Registers", [
        desc(
            "Registers are the fastest storage in the machine and the "
            "scarcest -- a few dozen locations of a word each. Several have "
            "defined jobs, and the examination expects those by name."
        ),
        table(
            ["Register", "Holds", "Why it matters"],
            [["Program counter (PC)", "The address of the NEXT instruction",
              "Changing it is what a jump or branch does"],
             ["Instruction register (IR)", "The instruction being executed",
              "Filled by fetch, read by decode"],
             ["Accumulator", "An operand and the result of an operation",
              "The ALU's working value in simple architectures"],
             ["General-purpose registers", "Whatever the program puts there",
              "More registers means fewer trips to memory"],
             ["Status / flag register", "Condition bits set by the last "
                                        "operation",
              "Zero, carry, sign and overflow -- what a conditional branch "
              "tests"],
             ["Stack pointer", "The address of the top of the stack",
              "Moves as call frames are pushed and popped"],
             ["Memory address register", "The address being accessed",
              "The interface to the address bus"]],
            caption="The registers named in the syllabus.",
            footer="The program counter is the one to understand deeply. "
                   "Every jump, call, return, branch and interrupt works by "
                   "changing it, and nothing else about control flow is "
                   "mysterious once that is clear."),
        desc(
            "The flag register deserves a second look because it explains how "
            "a comparison becomes a decision. An arithmetic instruction sets "
            "the flags as a side effect -- zero if the result was zero, carry "
            "if it overflowed the width, sign from the leading bit. A "
            "conditional branch then tests one of those flags and either "
            "changes the program counter or does not. Comparing two values is "
            "literally subtracting them and inspecting the flags."
        ),
    ]),

    ("The Instruction Cycle", [
        desc(
            "The fetch-decode-execute cycle is the machine's heartbeat, and "
            "the examination asks what happens in each phase and in what "
            "order."
        ),
        image(fig("instruction-cycle")),
        ol([
            "FETCH. The address in the program counter is placed on the "
            "address bus and the instruction at it is read into the "
            "instruction register. The program counter is then incremented to "
            "point at the following instruction.",
            "DECODE. The control unit interprets the instruction: which "
            "operation, which operands, which addressing mode.",
            "EXECUTE. The operation is carried out -- the ALU computes, or a "
            "value moves, or the program counter is changed.",
            "STORE. The result is written to its destination register or "
            "memory location, and the flags are updated.",
        ]),
        desc(
            "One detail in step one matters more than it looks. The program "
            "counter is incremented during FETCH, before the instruction has "
            "executed. That is why a jump instruction works by OVERWRITING "
            "the already-incremented value rather than by suppressing the "
            "increment, and why a subroutine call can save the return address "
            "simply by pushing the program counter as it stands."
        ),
    ]),

    ("Clock Speed and What It Does Not Tell You", [
        desc(
            "The clock is a square wave synchronising everything in the "
            "processor. Its frequency, in hertz, is how many cycles occur per "
            "second, and one cycle's duration is the reciprocal: a 2 GHz "
            "clock has a cycle time of 0.5 nanoseconds."
        ),
        desc(
            "Instructions do not all take one cycle. The average number of "
            "cycles an instruction needs is written CPI, cycles per "
            "instruction, and it is what turns a clock rate into a speed."
        ),
        ol([
            "Execution time = instruction count x CPI x cycle time.",
            "A program of 10 million instructions, averaging 2.5 cycles each, "
            "on a 2 GHz processor: 10,000,000 x 2.5 x 0.5ns.",
            "That is 25,000,000 cycles at 0.5 nanoseconds, which is 12.5 "
            "milliseconds.",
        ]),
        desc(
            "This formula is why comparing processors by clock rate alone is "
            "meaningless, and the examination tests exactly that. A 3 GHz "
            "processor with a CPI of 3 is SLOWER than a 2 GHz one with a CPI "
            "of 1.5 on the same instruction count -- 1 nanosecond per "
            "instruction against 0.75. Architecture moves CPI, and CPI is a "
            "term in the product just as the clock is."
        ),
        desc(
            "MIPS, millions of instructions per second, is the derived figure "
            "the syllabus names. It has the same weakness one level up: "
            "instructions from different instruction sets do different "
            "amounts of work, so a machine executing more of them may be "
            "achieving less. FLOPS, floating-point operations per second, "
            "measures a narrower thing more honestly, which is why scientific "
            "computing quotes it."
        ),
    ]),

    ("Pipelining", [
        desc(
            "If fetch, decode, execute and store use different parts of the "
            "processor, then leaving three of them idle while the fourth "
            "works is waste. Pipelining overlaps them, so that while one "
            "instruction executes, the next is decoding and the one after is "
            "being fetched."
        ),
        image(fig("pipeline")),
        desc(
            "The gain is in THROUGHPUT rather than latency. No individual "
            "instruction finishes any sooner -- it still passes through all "
            "four stages -- but once the pipeline is full, one instruction "
            "COMPLETES every cycle instead of every four. A deeper pipeline "
            "splits the work into more, shorter stages, which allows a higher "
            "clock rate."
        ),
        content_accordion(
            "WHAT STALLS A PIPELINE",
            "Each hazard is a reason the next instruction cannot simply "
            "follow the last, and each has a standard mitigation.",
            [("Control hazard -- a branch",
              "The processor does not know which instruction follows a "
              "conditional branch until the branch executes, by which time "
              "several wrong instructions have entered the pipeline. Those "
              "must be discarded and the pipeline refilled, costing as many "
              "cycles as it is deep. BRANCH PREDICTION guesses the outcome "
              "and proceeds; a good predictor is right well over 90% of the "
              "time, and a deep pipeline makes each miss expensive."),
             ("Data hazard -- a dependency",
              "An instruction needs the result of one still in the pipeline. "
              "The simple answer is to stall until it is available; "
              "FORWARDING is better, routing the result directly from the "
              "stage that produced it to the stage that needs it, without "
              "waiting for it to reach a register."),
             ("Structural hazard -- contention",
              "Two stages need the same hardware in the same cycle -- both "
              "wanting memory access, say. Resolved by duplicating the "
              "resource, which is one reason instruction and data caches are "
              "usually separate."),
             ("Why deeper is not always better",
              "A deeper pipeline permits a higher clock but makes every "
              "misprediction cost more cycles, and the stages become short "
              "enough that the latches between them consume a real share of "
              "the cycle. Designs converged on a moderate depth for exactly "
              "this reason.")]),
    ]),

    ("Beyond Pipelining", [
        desc(
            "Once one instruction per cycle is reached, further speed must "
            "come from doing more than one thing at a time. The syllabus "
            "names the approaches."
        ),
        table(
            ["Technique", "The idea", "The limit it runs into"],
            [["Superscalar", "Several execution units issue several "
                             "instructions per cycle",
              "Instructions must be genuinely independent"],
             ["Out-of-order execution", "Run later instructions while an "
                                        "earlier one waits",
              "Complex hardware to track dependencies and restore order"],
             ["Multi-core", "Several complete processors on one chip",
              "The software must be written to use them"],
             ["Hyper-threading", "One core presents two logical processors",
              "They share execution units, so the gain is partial"],
             ["SIMD", "One instruction applied to many data items at once",
              "Only helps regular, uniform data"]],
            caption="Five ways to do more per cycle.",
            footer="Every row after the first depends on finding independent "
                   "work. That is why single-threaded performance stopped "
                   "improving quickly and why concurrency became a "
                   "programming concern rather than a hardware one."),
        desc(
            "AMDAHL'S LAW is the sober counterweight and it is examined. The "
            "speed-up from parallelising a program is bounded by the fraction "
            "that CANNOT be parallelised: if a tenth of a program is "
            "inherently sequential, then even with infinite processors it can "
            "never run more than ten times faster. Adding cores to a workload "
            "that is mostly sequential buys very little, however many are "
            "added."
        ),
    ]),

    ("Instruction Sets and Addressing", [
        desc(
            "An instruction names an operation and says where its operands "
            "are. How it says where is the addressing mode, and the syllabus "
            "names several."
        ),
        table(
            ["Mode", "The operand is", "Example meaning"],
            [["Immediate", "In the instruction itself", "Add the literal 5"],
             ["Direct", "At the address in the instruction",
              "Add what is at address 200"],
             ["Indirect", "At the address STORED at the address given",
              "Address 200 holds 350; add what is at 350"],
             ["Register", "In the named register", "Add what is in R3"],
             ["Indexed", "At a base address plus an index register",
              "Add element i of an array"],
             ["Relative", "At the program counter plus an offset",
              "Jump forward 12 instructions"]],
            caption="Six addressing modes and what each one resolves to.",
            footer="Indexed addressing is what makes array access a single "
                   "instruction, and relative addressing is what makes code "
                   "relocatable -- both are the hardware answering a need "
                   "that came from software."),
        compare_grid(
            "CISC AND RISC",
            "Two philosophies about how much one instruction should do. "
            "Modern processors have converged, but the distinction is still "
            "examined.",
            [("CISC -- complex instruction set",
              "Many instructions, some doing a great deal, of varying length. "
              "Fewer instructions per program, and hard to pipeline because "
              "they take differing numbers of cycles."),
             ("RISC -- reduced instruction set",
              "Few, simple, fixed-length instructions, each usually one "
              "cycle. More instructions per program, and far easier to "
              "pipeline -- which is why the idea won even inside processors "
              "presenting a CISC interface.")]),
    ]),

    ("Interrupts", [
        desc(
            "An interrupt is a signal that makes the processor suspend what "
            "it is doing and attend to something else. Without it, a machine "
            "could only discover that a device needed attention by "
            "repeatedly asking -- polling -- which wastes the processor "
            "entirely."
        ),
        ol([
            "The device raises an interrupt signal.",
            "The processor finishes the current instruction -- never part of "
            "one.",
            "It saves the program counter and the flags, so the interrupted "
            "work can resume exactly.",
            "It looks up the handler's address in the interrupt vector table "
            "and jumps there.",
            "The handler runs, services the device, and returns.",
            "The saved state is restored and the interrupted program "
            "continues, unaware anything happened.",
        ]),
        desc(
            "Interrupts have PRIORITIES, so a more urgent one can interrupt a "
            "handler already running, and they can be MASKED -- temporarily "
            "disabled -- during a critical section that must not be "
            "interrupted. A non-maskable interrupt cannot be disabled at all "
            "and is reserved for conditions such as imminent power failure."
        ),
        desc(
            "The syllabus distinguishes their sources. An EXTERNAL interrupt "
            "comes from a device or a timer. An INTERNAL interrupt, also "
            "called a trap or exception, is raised by the currently executing "
            "instruction -- division by zero, an invalid opcode, a page "
            "fault. A SOFTWARE interrupt is deliberately raised by an "
            "instruction, and it is how a program asks the operating system "
            "for a service."
        ),
    ]),

    ("Measuring Processor Performance Honestly", [
        desc(
            "Every single-number measure of processor speed misleads in some "
            "way, and the syllabus expects you to know how each one does."
        ),
        table(
            ["Measure", "What it reports", "How it misleads"],
            [["Clock frequency", "Cycles per second",
              "Says nothing about work done per cycle"],
             ["MIPS", "Millions of instructions per second",
              "Instructions from different sets do different amounts of work"],
             ["FLOPS", "Floating-point operations per second",
              "Irrelevant to workloads that are not numeric"],
             ["Benchmark suite", "Performance on a fixed set of programs",
              "Only predicts YOUR workload if it resembles the suite"],
             ["Your own workload", "What you actually care about",
              "Costs effort to measure, and is the only honest answer"]],
            caption="Five measures, in ascending order of honesty and cost.",
            footer="The last row is the point. A benchmark is a proxy, and "
                   "the value of a proxy depends entirely on how closely it "
                   "resembles the thing it stands for."),
        desc(
            "Two distinctions the examination draws are worth holding. "
            "THROUGHPUT is how much work completes per unit time; RESPONSE "
            "TIME is how long one piece of work takes. They are improved by "
            "different things and can move in opposite directions -- batching "
            "raises throughput and worsens response time, which is exactly "
            "the trade a queue makes."
        ),
        desc(
            "And a benchmark is only meaningful alongside the conditions it "
            "was run under. The same processor measured with a warm cache and "
            "a cold one, or with and without other load, gives numbers that "
            "differ by more than the gap between competing products -- which "
            "is why a figure quoted without its conditions is not evidence."
        ),
    ]),

    ("How an Instruction Is Encoded", [
        desc(
            "An instruction is a bit pattern like any other value, and the "
            "processor reads it by fields at fixed positions. Knowing the "
            "shape explains several constraints that otherwise look "
            "arbitrary."
        ),
        table(
            ["Field", "Holds", "Consequence of its width"],
            [["Opcode", "Which operation to perform",
              "n bits allow at most 2^n distinct instructions"],
             ["Operand / address", "Where the data is",
              "n bits can address at most 2^n locations directly"],
             ["Addressing mode", "How to interpret the operand field",
              "Lets one opcode serve several modes"],
             ["Register selector", "Which register to use",
              "4 bits selects among 16 registers, 5 among 32"]],
            caption="The fields of a typical instruction word.",
            footer="Every field competes for the same fixed word width, which "
                   "is the trade at the centre of instruction set design: "
                   "more opcodes means a shorter address field, and more "
                   "registers means fewer bits for everything else."),
        desc(
            "This is why direct addressing has a reach limit. If the address "
            "field is sixteen bits, a direct address can name only 65,536 "
            "locations however much memory is installed -- which is exactly "
            "the problem indirect, indexed and relative addressing were "
            "invented to solve, by computing a full-width address from a "
            "narrow field."
        ),
        desc(
            "It also explains the CISC and RISC divide from the other "
            "direction. Fixed-length instructions waste bits on operations "
            "that need few fields and constrain those that need many; "
            "variable-length instructions use exactly what each needs and "
            "make the next instruction's position unknown until the current "
            "one is decoded -- which is precisely what a pipeline cannot "
            "tolerate."
        ),
    ]),

    ("Parallelism in Practice", [
        desc(
            "Multi-core processors are now universal, so the interesting "
            "question is no longer whether parallelism is available but what "
            "software must do to benefit from it."
        ),
        compare_grid(
            "WHERE THE PARALLELISM COMES FROM",
            "The first two are the hardware's own work; the last two require "
            "the program to be written for them.",
            [("Instruction-level parallelism",
              "The processor finds independent instructions within one "
              "thread and overlaps them -- pipelining, superscalar issue, "
              "out-of-order execution. Free to the programmer, and bounded "
              "by how much independence exists in the code."),
             ("Data-level parallelism (SIMD)",
              "One instruction applied to many values at once. Helps regular "
              "uniform data such as images and matrices; compilers "
              "sometimes generate it automatically."),
             ("Thread-level parallelism",
              "Separate threads on separate cores. The programmer must divide "
              "the work and manage shared state, which is where race "
              "conditions and deadlocks come from."),
             ("Process-level parallelism",
              "Separate processes, possibly on separate machines. No shared "
              "memory to corrupt, and communication costs far more.")]),
        desc(
            "The shift that matters historically is worth stating. Until "
            "roughly the mid-2000s, a program got faster every year without "
            "being changed, because clock rates rose. Power and heat ended "
            "that, and the extra transistors went into cores instead -- so "
            "further speed now requires the program to be written to use "
            "them. That is why concurrency moved from a specialist concern to "
            "a general one, and why the Operating System lesson's material on "
            "threads and synchronisation matters to every developer."
        ),
    ]),

    ("The Memory Wall", [
        desc(
            "Processor speed and memory speed did not improve at the same "
            "rate. Processors got far faster; memory got somewhat faster and "
            "much larger. The gap between them is called the memory wall, and "
            "it shapes the whole next lesson."
        ),
        table(
            ["Access", "Roughly how long", "In processor cycles at 3 GHz"],
            [["Register", "Under 1 ns", "Under 1"],
             ["L1 cache", "About 1 ns", "About 3"],
             ["L3 cache", "About 15 ns", "About 45"],
             ["Main memory", "About 100 ns", "About 300"],
             ["SSD", "About 100 microseconds", "About 300,000"]],
            caption="What the processor waits through, in its own cycles.",
            footer="A main-memory access costs roughly three hundred cycles. "
                   "In that time a modern processor could have executed "
                   "several hundred instructions, which is why the machine "
                   "spends so much design effort avoiding the trip."),
        desc(
            "Read that table as an engineering priority rather than as "
            "trivia. If a memory access costs three hundred cycles, then a "
            "program's speed is governed far more by how often it goes to "
            "memory than by how many instructions it executes -- and an "
            "algorithm doing more arithmetic on data already in cache can "
            "comfortably beat one doing less arithmetic on scattered data."
        ),
        desc(
            "This is the concrete reason the Data Structures lesson's remark "
            "about locality holds. An array walked in order pulls each cache "
            "line in once and uses all of it; a linked list of the same "
            "length may pay the full memory latency at every node. The "
            "operation counts are identical and the running times are not "
            "close."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where processor items are lost."),
        ul([
            "Comparing processors by clock rate alone. Execution time is "
            "instruction count times CPI times cycle time, and CPI varies "
            "with the architecture.",
            "Thinking pipelining makes an instruction finish sooner. It "
            "raises throughput, not latency.",
            "Forgetting that the program counter is incremented during fetch, "
            "before execution.",
            "Confusing the control unit with the ALU. Sequencing and decoding "
            "are the control unit; arithmetic and comparison are the ALU.",
            "Assuming more cores means proportionally more speed. Amdahl's "
            "law bounds it by the sequential fraction.",
            "Mixing up indirect with indexed addressing. Indirect follows a "
            "stored address; indexed adds a register to a base.",
            "Believing an interrupt can occur part-way through an "
            "instruction. The current instruction always completes first.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"Processor A runs at 2.4 GHz with an average CPI of 1.2. "
            "Processor B runs at 3.0 GHz with an average CPI of 1.8. Which "
            "executes the same program faster, and by how much?\""
        ),
        ol([
            "Compute each cycle time. A: 1 / 2.4 GHz = 0.4167 ns. B: 1 / 3.0 "
            "GHz = 0.3333 ns.",
            "Time per instruction is CPI times cycle time. A: 1.2 x 0.4167 = "
            "0.5 ns. B: 1.8 x 0.3333 = 0.6 ns.",
            "The instruction count is the same program, so it cancels: A "
            "takes 0.5ns per instruction and B takes 0.6ns.",
            "A is faster by a ratio of 0.6 / 0.5 = 1.2, so 20% faster despite "
            "its lower clock rate.",
        ]),
        desc(
            "The item exists to punish the shortcut. B has the higher clock "
            "and the intuitive answer is B, which is why it will be the most "
            "attractive distractor. Only working the product exposes that the "
            "CPI difference more than cancels the clock advantage."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("The processor is the base several later lessons build on."),
        ul([
            "Memory hierarchy and cache, in the next lesson, exist because "
            "the processor outran memory.",
            "Interrupts are how the Operating System lesson's scheduler and "
            "device drivers work.",
            "The call stack from Programming is the stack pointer register in "
            "hardware.",
            "Two's complement, flags and shifts come straight from Discrete "
            "Mathematics.",
            "Amdahl's law reappears in System Evaluation and in performance "
            "testing.",
            "Logic gates in the Hardware lesson are what the ALU is built "
            "from.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results the examination expects immediately.",
            [("Execution time formula",
              "Instructions x CPI x cycle time",
              "Which is why clock rate alone compares nothing. A higher clock "
              "with a worse CPI can be slower."),
             ("What pipelining improves",
              "Throughput, not latency",
              "Each instruction still passes through every stage. Once full, "
              "one completes per cycle."),
             ("The cost of a mispredicted branch",
              "Refilling the whole pipeline",
              "So a deeper pipeline permits a higher clock and makes each "
              "miss more expensive."),
             ("Amdahl's law",
              "Speed-up is bounded by the sequential fraction",
              "A tenth sequential caps the speed-up at ten times, however "
              "many processors are added."),
             ("Indirect against indexed addressing",
              "Follow a stored address against base plus index register",
              "Indexed is what makes array element access one instruction."),
             ("When an interrupt is serviced",
              "After the current instruction completes",
              "Never part-way through one. The program counter and flags are "
              "saved so the interrupted work resumes exactly.")]),
    ]),
]

_cpu_quiz = [
    mcq("AVERAGE",
        "Processor A runs at 2.4 GHz with an average CPI of 1.2. Processor B "
        "runs at 3.0 GHz with an average CPI of 1.8.\n\n"
        "Which executes a given program faster?",
        [("Processor A, because its lower CPI outweighs its lower clock "
          "rate", True),
         ("Processor B, because its clock rate is 25% higher", False),
         ("They perform identically, since the products are equal", False),
         ("Processor B, because CPI affects only floating-point work", False)],
        "Time per instruction is CPI multiplied by cycle time. Processor A: "
        "1.2 x (1/2.4 GHz) = 0.5 ns. Processor B: 1.8 x (1/3.0 GHz) = 0.6 ns. "
        "A is 20% faster despite the lower clock, because the 50% worse CPI "
        "more than cancels the 25% clock advantage. This is exactly why clock "
        "rate alone compares nothing, and CPI applies to all instructions "
        "rather than to floating-point work specifically."),

    mcq("EASY",
        "During the fetch phase of the instruction cycle, what happens to the "
        "program counter?",
        [("It is incremented to point at the following instruction", True),
         ("It is cleared, ready to receive the next address", False),
         ("It is copied into the accumulator for arithmetic", False),
         ("It remains unchanged until the execute phase completes", False)],
        "The program counter is incremented during fetch, once the current "
        "instruction's address has been used. That is why a jump works by "
        "OVERWRITING the already-incremented value rather than suppressing "
        "the increment, and why a subroutine call can save its return address "
        "simply by pushing the program counter as it stands."),

    mcq("AVERAGE",
        "A four-stage pipeline is introduced into a processor.\n\n"
        "What is the effect on a single instruction's execution?",
        [("It completes in one quarter of the time", False),
         ("It completes in the same time, but throughput rises", True),
         ("It completes more slowly because of stage overhead", False),
         ("It completes faster only if no branches are present", False)],
        "Pipelining overlaps the stages of DIFFERENT instructions, so any one "
        "instruction still passes through all four stages and takes just as "
        "long from start to finish. What changes is that once the pipeline is "
        "full, one instruction COMPLETES every cycle rather than every four. "
        "The distinction between latency and throughput is precisely what "
        "this item tests."),

    mcq("HARD",
        "A program spends 20% of its execution time in code that cannot be "
        "parallelised.\n\n"
        "What is the maximum possible speed-up from adding processors?",
        [("Five times", True),
         ("Twenty times", False),
         ("Eighty percent faster", False),
         ("Unbounded, given enough processors", False)],
        "By Amdahl's law, the sequential fraction bounds the speed-up: even "
        "if the parallel 80% took no time at all, the 20% remains, so the "
        "program can run at most 1 / 0.2 = 5 times faster. This is why adding "
        "cores to a mostly sequential workload buys so little, and why "
        "identifying the sequential fraction matters more than counting "
        "processors."),

    mcq("AVERAGE",
        "An instruction specifies a memory address, and the value at that "
        "address is itself the address of the operand.\n\n"
        "Which addressing mode is this?",
        [("Immediate addressing", False),
         ("Direct addressing", False),
         ("Indirect addressing", True),
         ("Indexed addressing", False)],
        "Indirect addressing follows the address twice: the instruction gives "
        "an address, that location holds another address, and the operand is "
        "there. Direct addressing stops after one step, immediate addressing "
        "carries the value in the instruction itself, and indexed addressing "
        "adds an index register to a base address -- which is what makes "
        "array element access a single instruction."),

    mcq("AVERAGE",
        "Which processor component sets the zero, carry and overflow flags "
        "after an arithmetic operation?",
        [("The control unit", False),
         ("The arithmetic and logic unit", True),
         ("The program counter", False),
         ("The memory address register", False)],
        "The ALU performs the operation and sets the condition flags as a "
        "side effect of doing so, which is what allows a subsequent "
        "conditional branch to test the result without recomputing anything. "
        "The control unit sequences and decodes but performs no arithmetic; "
        "the program counter holds the next instruction's address; and the "
        "memory address register interfaces to the address bus."),

    mcq("HARD",
        "A device signals an interrupt while the processor is part-way "
        "through executing an instruction.\n\n"
        "What happens?",
        [("The instruction is abandoned and the handler runs immediately",
          False),
         ("The current instruction completes, then the handler runs", True),
         ("The interrupt is discarded and the device must signal again",
          False),
         ("The instruction completes only if the interrupt is maskable",
          False)],
        "Interrupts are recognised at instruction boundaries, so the current "
        "instruction always runs to completion before the processor saves its "
        "state and jumps to the handler. Abandoning an instruction mid-way "
        "would leave the machine in a state that could not be resumed "
        "correctly. Whether an interrupt is maskable determines if it can be "
        "temporarily disabled, not whether it can split an instruction."),

    mcq("AVERAGE",
        "RISC architectures use few, simple, fixed-length instructions.\n\n"
        "Which advantage follows most directly from this choice?",
        [("Programs occupy less memory than on a CISC machine", False),
         ("Instructions are easier to pipeline efficiently", True),
         ("Fewer registers are needed to execute a program", False),
         ("Each instruction performs more work than a CISC instruction",
          False)],
        "Fixed-length instructions taking a predictable number of cycles fit "
        "a pipeline naturally, because each stage takes the same time and the "
        "next instruction's position is known immediately. RISC programs "
        "typically need MORE instructions and therefore more memory, each "
        "instruction does LESS work by design, and RISC machines usually "
        "provide MORE registers rather than fewer, precisely to reduce trips "
        "to memory."),

    mcq("EASY",
        "Which unit within the processor is responsible for fetching and "
        "decoding instructions and issuing control signals?",
        [("The control unit", True),
         ("The arithmetic and logic unit", False),
         ("The accumulator", False),
         ("The status register", False)],
        "The control unit directs the machine: it fetches each instruction, "
        "interprets it, and issues the signals that make the other components "
        "carry it out, without performing any computation itself. The ALU "
        "computes but decides nothing about sequencing. The accumulator and "
        "status register are storage locations rather than units."),

    mcq("HARD",
        "A processor's branch predictor is correct 95% of the time. The "
        "pipeline depth is then increased substantially.\n\n"
        "What happens to the cost of the remaining 5%?",
        [("It falls, because a deeper pipeline recovers more quickly", False),
         ("It rises, because more partly executed stages must be discarded",
          True),
         ("It is unchanged, since prediction accuracy has not altered", False),
         ("It rises only if the clock rate is also increased", False)],
        "A misprediction means every instruction already in the pipeline "
        "behind the branch is wrong and must be discarded, and the pipeline "
        "refilled from the correct address. A deeper pipeline holds more such "
        "instructions, so each miss costs more cycles. This tension -- deeper "
        "pipelines permit a higher clock but make every miss more expensive "
        "-- is why pipeline depths converged on a moderate value rather than "
        "continuing to grow."),
]

LESSON_PROCESSOR = lesson(
    MAJOR, MIDDLE,
    "The Processor: Architecture, Instruction Execution and Performance",
    _cpu_quiz,
    lesson_structure(
        "The Processor: Architecture, Instruction Execution and Performance",
        "A processor does one thing endlessly -- fetch an instruction, decode "
        "it, execute it, move on -- and everything else in its design exists "
        "to make that loop faster without changing what it does. This lesson "
        "covers the units that divide the work and the registers they act on, "
        "the instruction cycle step by step, why comparing processors by "
        "clock rate alone is meaningless, how pipelining raises throughput "
        "and what stalls it, the techniques that go further and the law that "
        "bounds them, how an instruction says where its operands are, and how "
        "an interrupt suspends and resumes work without the interrupted "
        "program noticing.",
        [
            "Identify which processor unit performs a described function",
            "Name the registers the syllabus lists and state what each holds",
            "Describe the instruction cycle and explain when the program "
            "counter changes",
            "Compute execution time from instruction count, CPI and clock "
            "rate",
            "Explain what pipelining improves and identify the hazards that "
            "stall it",
            "Apply Amdahl's law to bound a parallel speed-up",
            "Identify an addressing mode from a description",
            "Describe interrupt handling and distinguish external, internal "
            "and software interrupts",
        ],
        75,
        _cpu_sections,
        [
            ("Control unit",
             "The processor unit that fetches and decodes instructions and "
             "issues control signals. It sequences and interprets; it "
             "computes nothing."),
            ("Arithmetic and logic unit (ALU)",
             "The unit performing arithmetic, comparison and logical "
             "operations, and setting the condition flags as a side effect."),
            ("Program counter",
             "The register holding the address of the next instruction. "
             "Incremented during fetch, and overwritten by every jump, branch, "
             "call and interrupt."),
            ("Status (flag) register",
             "Condition bits -- zero, carry, sign, overflow -- set by the last "
             "operation and tested by conditional branches. Comparison is "
             "subtraction plus flag inspection."),
            ("Instruction cycle",
             "Fetch, decode, execute, store: the loop a processor repeats for "
             "the life of the machine."),
            ("CPI (cycles per instruction)",
             "The average cycles an instruction consumes. Execution time is "
             "instruction count times CPI times cycle time, which is why "
             "clock rate alone compares nothing."),
            ("MIPS",
             "Millions of instructions per second. Weak as a comparison "
             "because instructions from different sets do different amounts "
             "of work."),
            ("Pipelining",
             "Overlapping the stages of consecutive instructions so one "
             "completes per cycle. Raises throughput; leaves any single "
             "instruction's latency unchanged."),
            ("Control hazard",
             "A branch whose outcome is unknown when the following "
             "instructions must be fetched. Mitigated by branch prediction, "
             "at the cost of a full pipeline refill on a miss."),
            ("Data hazard",
             "An instruction needing a result still in the pipeline. "
             "Mitigated by forwarding the value directly between stages "
             "rather than stalling."),
            ("Superscalar",
             "Issuing several instructions per cycle to multiple execution "
             "units. Limited by how much genuinely independent work exists."),
            ("Amdahl's law",
             "The speed-up from parallelising is bounded by the fraction that "
             "cannot be parallelised. A tenth sequential caps it at ten "
             "times."),
            ("Immediate addressing",
             "The operand is in the instruction itself."),
            ("Indirect addressing",
             "The instruction gives an address whose contents are the address "
             "of the operand -- the address is followed twice."),
            ("Indexed addressing",
             "A base address plus an index register, which is what makes "
             "array element access a single instruction."),
            ("CISC and RISC",
             "Many complex variable-length instructions against few simple "
             "fixed-length ones. RISC pipelines far more easily, which is why "
             "the idea prevailed."),
            ("Interrupt",
             "A signal causing the processor to suspend execution after the "
             "current instruction, save its state, and run a handler. "
             "External from devices, internal from the executing instruction, "
             "or software-raised to request an operating system service."),
        ],
        "A processor repeats one loop -- fetch, decode, execute, store -- and "
        "divides the work between a control unit that sequences and decodes, "
        "an ALU that computes and sets the flags, and registers that hold "
        "what it works on. The program counter is the register worth "
        "understanding deeply, because every jump, call, branch and interrupt "
        "operates by changing it, and it is incremented during fetch rather "
        "than after execution. Speed is instruction count times CPI times "
        "cycle time, so a higher clock with a worse CPI can be slower, and "
        "quoting clock rate alone compares nothing. Pipelining overlaps the "
        "stages of consecutive instructions to complete one per cycle -- "
        "raising throughput while leaving any single instruction's latency "
        "untouched -- and is stalled by branches, by dependencies and by "
        "contention, each with a standard mitigation. Beyond it, superscalar "
        "issue, out-of-order execution and multiple cores all depend on "
        "finding independent work, and Amdahl's law bounds what they can "
        "achieve by the fraction that is inherently sequential. Addressing "
        "modes decide where an operand lives, with indirect following a "
        "stored address and indexed adding a register to a base. And "
        "interrupts let a device claim the processor's attention without "
        "polling: the current instruction always completes first, the state "
        "is saved, a handler runs, and the interrupted program resumes "
        "unaware.",
        exam_notes=[
            desc(
                "Processor items are among the most calculable on Subject A, "
                "which makes them reliable marks for anyone who has practised "
                "the arithmetic."
            ),
            ul([
                "Computing execution time or comparing two processors from "
                "clock rate and CPI.",
                "Stating what happens in a named phase of the instruction "
                "cycle.",
                "Explaining what pipelining improves, and what a "
                "misprediction costs.",
                "Applying Amdahl's law to a stated sequential fraction.",
                "Identifying an addressing mode from a description.",
                "Naming the unit that performs a described function.",
                "Describing the order of events when an interrupt occurs.",
            ]),
            desc(
                "The recurring trap is the item that offers the "
                "higher-clocked processor as the obvious answer. Work the "
                "product every time; the item exists because the intuitive "
                "answer is wrong."
            ),
        ],
    ))

LESSONS = [LESSON_PROCESSOR]

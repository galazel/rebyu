"""FE Exam: new questions for Basic Theory and Computer System.

Lessons 427-449, two items each. The FE bank sits at exactly ten questions
per lesson, all MCQ, which matches the real paper -- so these are MCQ too, and
lean toward the calculation and trace-the-execution items the FE morning paper
is built from rather than toward definition recall.
"""

import sys

sys.path.insert(0, "/app/scripts/bank_expansion")
from builders import mcq  # noqa: E402

CERTIFICATION_ID = 14

QUESTIONS = {

    # 427 -- Discrete Mathematics: Radix, Numeric Representation and Precision
    427: [
        mcq("MEDIUM",
            "What is the decimal value of the 8-bit two's complement number 11110110?",
            [("-10", True),
             ("246", False),
             ("-6", False),
             ("-118", False)],
            "The leading 1 marks it negative. Inverting gives 00001001 and adding one gives 00001010, which is 10 -- so the value is -10."),
        mcq("HARD",
            "Why can the decimal value 0.1 not be represented exactly in binary floating point?",
            [("Its binary expansion is infinitely repeating, so it must be truncated", True),
             ("Floating point cannot represent any value below 1", False),
             ("The exponent field is too small to hold it", False),
             ("Binary can only represent integers", False)],
            "0.1 in binary is 0.0001100110011... recurring. The stored value is the nearest representable one, which is why repeated addition of 0.1 drifts from the expected total."),
    ],

    # 428 -- Applied Mathematics: Probability, Statistics and Optimisation
    428: [
        mcq("MEDIUM",
            "Two fair dice are thrown. What is the probability that the total is 7?",
            [("6/36", True),
             ("5/36", False),
             ("7/36", False),
             ("1/12", False)],
            "Six of the 36 equally likely ordered pairs sum to 7: (1,6) through (6,1). Seven is the most likely total precisely because it has the most combinations."),
        mcq("HARD",
            "A system has two components in series, each with reliability 0.9. What is the reliability of the system?",
            [("0.81", True),
             ("0.90", False),
             ("0.99", False),
             ("1.80", False)],
            "Series components must all work, so reliabilities multiply: 0.9 x 0.9 = 0.81. The same two components in parallel would give 1 - 0.1 x 0.1 = 0.99."),
    ],

    # 429 -- Theory of Information, Coding and Automata
    429: [
        mcq("MEDIUM",
            "How many distinct symbols can be represented using 7 bits?",
            [("128", True),
             ("127", False),
             ("64", False),
             ("256", False)],
            "2^7 = 128 distinct patterns, numbered 0 to 127. ASCII uses exactly this range, which is why its code points stop at 127."),
        mcq("HARD",
            "A finite automaton accepts strings over {a, b} that end in 'ab'. What is the minimum number of states required?",
            [("3", True),
             ("2", False),
             ("4", False),
             ("5", False)],
            "The machine must distinguish three situations: nothing useful seen, an 'a' just seen, and 'ab' just completed. Fewer states cannot tell those cases apart."),
    ],

    # 430 -- Theory of Communications
    430: [
        mcq("MEDIUM",
            "A parity bit can detect which kind of error?",
            [("An odd number of bit errors in the protected unit", True),
             ("Any number of bit errors, and correct them", False),
             ("Only errors in the parity bit itself", False),
             ("Exactly two bit errors", False)],
            "Parity fails silently when an even number of bits flip, because the parity is restored. It detects rather than corrects, which is why stronger codes exist."),
        mcq("HARD",
            "A channel uses 4 signal levels and a symbol rate of 2400 baud. What is the data rate?",
            [("4800 bit/s", True),
             ("2400 bit/s", False),
             ("9600 bit/s", False),
             ("1200 bit/s", False)],
            "Four levels carry log2(4) = 2 bits per symbol, so 2400 symbols per second gives 4800 bit/s. Baud and bit rate coincide only when each symbol carries one bit."),
    ],

    # 431 -- Theory of Measurement and Control Systems
    431: [
        mcq("MEDIUM",
            "What characterizes feedback control as distinct from feedforward control?",
            [("The measured output is compared with the target and the difference drives the correction", True),
             ("Disturbances are measured before they affect the output", False),
             ("No measurement of any kind is required", False),
             ("The controller runs open-loop by design", False)],
            "Feedback reacts to the resulting error and therefore handles disturbances it never modelled. Feedforward anticipates a measured disturbance but cannot correct what it did not foresee."),
        mcq("HARD",
            "In a sampled control system, what does the Nyquist criterion require of the sampling rate?",
            [("It must exceed twice the highest frequency present in the signal", True),
             ("It must equal the highest frequency present", False),
             ("It must be at least ten times the signal frequency", False),
             ("It is independent of the signal's frequency content", False)],
            "Sampling below twice the highest frequency causes aliasing, where a high frequency is indistinguishable from a lower one -- an error no later processing can undo."),
    ],

    # 432 -- Data Structures
    432: [
        mcq("MEDIUM",
            "Which operation is O(1) on a singly linked list but O(n) on an array?",
            [("Inserting an element after a node already held", True),
             ("Accessing the element at a given index", False),
             ("Finding the maximum value", False),
             ("Traversing every element once", False)],
            "With the node in hand, a list insert is pointer reassignment. An array insert must shift the elements after it, which is what the linear cost pays for."),
        mcq("HARD",
            "Values 5, 3, 8, 1 are pushed onto a stack in that order. Two are popped, then 7 is pushed and one more is popped. What is the top of the stack?",
            [("3", True),
             ("8", False),
             ("7", False),
             ("5", False)],
            "After the pushes the stack is 5,3,8,1 with 1 on top. Popping twice removes 1 and 8; pushing 7 and popping it leaves 3 on top."),
    ],

    # 433 -- Algorithms
    433: [
        mcq("MEDIUM",
            "What is the worst-case time complexity of binary search on a sorted array of n elements?",
            [("O(log n)", True),
             ("O(n)", False),
             ("O(n log n)", False),
             ("O(1)", False)],
            "Each comparison halves the remaining range, so the number of steps is the number of halvings needed to reach one element. The array must already be sorted for this to hold."),
        mcq("HARD",
            "Which sorting algorithm has O(n log n) worst-case time and is stable?",
            [("Merge sort", True),
             ("Quicksort", False),
             ("Heap sort", False),
             ("Selection sort", False)],
            "Quicksort degrades to O(n^2) in the worst case; heap sort is O(n log n) but not stable; selection sort is O(n^2). Merge sort is both, at the cost of extra space."),
    ],

    # 434 -- Programming: Structure, Style, Data Types
    434: [
        mcq("MEDIUM",
            "What does passing an argument by reference allow that passing by value does not?",
            [("The called function can modify the caller's variable", True),
             ("The argument is copied before the call", False),
             ("The function executes faster in all cases", False),
             ("The argument type is checked at runtime only", False)],
            "By value the function works on a copy, so the caller is insulated. By reference it works on the original, which is powerful and is also the source of a whole class of surprising bugs."),
        mcq("HARD",
            "A variable declared inside a function retains its value between calls. Which storage class does this indicate?",
            [("Static", True),
             ("Automatic", False),
             ("Register", False),
             ("External linkage", False)],
            "A static local has function scope but program lifetime. An automatic local is created and destroyed on each call, which is why it cannot carry state forward."),
    ],

    # 435 -- Programming Languages: Compilation and Paradigms
    435: [
        mcq("MEDIUM",
            "Which phase of compilation detects that a variable is used before it is declared?",
            [("Semantic analysis", True),
             ("Lexical analysis", False),
             ("Code generation", False),
             ("Linking", False)],
            "Lexical analysis produces tokens and syntax analysis checks structure. Whether a name is in scope is a meaning question, which belongs to semantic analysis."),
        mcq("HARD",
            "What distinguishes an interpreter from a compiler in execution terms?",
            [("An interpreter executes the source directly each run; a compiler produces a separate executable first", True),
             ("An interpreter always produces faster code", False),
             ("A compiler cannot report syntax errors", False),
             ("An interpreter requires the source to be error-free before starting", False)],
            "The trade is startup speed and flexibility against execution speed. Interpreters can also begin executing before reaching a later syntax error, which compilers never do."),
    ],

    # 436 -- Markup and Other Languages
    436: [
        mcq("MEDIUM",
            "Which statement about XML and JSON is correct?",
            [("XML supports attributes and namespaces; JSON has a simpler value-oriented model", True),
             ("JSON supports schemas while XML does not", False),
             ("XML cannot represent nested structures", False),
             ("JSON requires a closing tag for every value", False)],
            "XML's richer document model suits mixed content and validation-heavy exchange; JSON's smaller model maps directly onto common programming data types, which is why APIs favour it."),
        mcq("HARD",
            "In HTML, what is the effect of omitting the alt attribute on an informative image?",
            [("Screen reader users lose the information the image conveys", True),
             ("The image fails to load in every browser", False),
             ("The page becomes invalid XML", False),
             ("The image is displayed at the wrong size", False)],
            "The alt text is the image's textual equivalent. Omitting it on an informative image removes the content entirely for anyone not seeing the image."),
    ],

    # 437 -- The Processor
    437: [
        mcq("MEDIUM",
            "A 5-stage pipeline with no stalls processes instructions at what steady-state rate?",
            [("One instruction completed per clock cycle", True),
             ("One instruction completed every five cycles", False),
             ("Five instructions completed per cycle", False),
             ("One instruction completed every two cycles", False)],
            "Pipelining does not reduce the latency of a single instruction; it raises throughput so that one completes each cycle once the pipeline is full."),
        mcq("HARD",
            "Which hazard occurs when an instruction needs a result that a preceding instruction has not yet produced?",
            [("Data hazard", True),
             ("Control hazard", False),
             ("Structural hazard", False),
             ("Cache miss", False)],
            "Data hazards are resolved by forwarding or by stalling. Control hazards come from branches and structural hazards from a resource two stages need at once."),
    ],

    # 438 -- Memory
    438: [
        mcq("HARD",
            "A cache has a 95% hit rate, 2 ns hit time, and 100 ns miss penalty. What is the average access time?",
            [("7 ns", True),
             ("5 ns", False),
             ("2 ns", False),
             ("100 ns", False)],
            "Average = 2 + 0.05 x 100 = 7 ns. The miss penalty dominates even at a high hit rate, which is why the last few percentage points of hit rate matter so much."),
        mcq("MEDIUM",
            "Why does a memory hierarchy improve average performance?",
            [("Programs exhibit locality, so a small fast level serves most accesses", True),
             ("The slowest level is never accessed after startup", False),
             ("Each level stores entirely different data with no overlap", False),
             ("Faster memory is cheaper per byte than slower memory", False)],
            "Temporal and spatial locality are what make the hierarchy work. Fast memory is more expensive per byte, which is exactly why there is only a little of it."),
    ],

    # 439 -- Buses and Interconnects
    439: [
        mcq("MEDIUM",
            "What does bus arbitration resolve?",
            [("Which of several devices may drive the shared bus at a given moment", True),
             ("How wide each data transfer must be", False),
             ("Which memory address a device may access", False),
             ("How the bus is physically routed on the board", False)],
            "A shared bus can carry one transfer at a time, so arbitration prevents two masters driving it simultaneously."),
        mcq("HARD",
            "A parallel bus runs at 200 MHz with a 64-bit data path. What is its theoretical peak bandwidth?",
            [("1.6 GB/s", True),
             ("200 MB/s", False),
             ("12.8 GB/s", False),
             ("800 MB/s", False)],
            "64 bits is 8 bytes, so 8 x 200 x 10^6 = 1.6 GB/s. This is the ceiling before protocol overhead and arbitration, not an achievable sustained figure."),
    ],

    # 440 -- Input/Output Interfaces and Device Control
    440: [
        mcq("MEDIUM",
            "What advantage does DMA provide over programmed I/O?",
            [("Data moves between device and memory without the processor handling each word", True),
             ("Transfers no longer require any memory bandwidth", False),
             ("The device no longer needs a controller", False),
             ("Interrupts become unnecessary in the system", False)],
            "DMA frees the processor to do other work during the transfer. It still consumes memory bandwidth and still signals completion, usually by interrupt."),
        mcq("HARD",
            "Why is polling generally less efficient than interrupt-driven I/O for a slow device?",
            [("The processor consumes cycles repeatedly checking a device that is rarely ready", True),
             ("Polling cannot detect when a device is ready", False),
             ("Interrupts complete transfers without using the bus", False),
             ("Polling requires additional hardware in every device", False)],
            "Polling wastes cycles proportional to how rarely the device is ready. For a very fast device the interrupt overhead can invert this, which is why polling is not always wrong."),
    ],

    # 441 -- Input/Output Devices and Peripherals
    441: [
        mcq("MEDIUM",
            "Which characteristic distinguishes an SSD from a hard disk drive in performance terms?",
            [("No seek time, so random access is dramatically faster", True),
             ("Higher capacity per device in every case", False),
             ("Immunity to all forms of data loss", False),
             ("Unlimited write endurance", False)],
            "Removing mechanical seek is the decisive difference, and it is why random-access workloads gain most. Flash cells have finite write endurance, which SSD firmware manages rather than eliminates."),
        mcq("HARD",
            "A display of 1920x1080 at 24-bit colour requires how much frame buffer memory for one frame?",
            [("About 6.2 MB", True),
             ("About 2.1 MB", False),
             ("About 24 MB", False),
             ("About 1.0 MB", False)],
            "1920 x 1080 = 2,073,600 pixels, at 3 bytes each gives about 6.2 MB. Double buffering doubles the requirement."),
    ],

    # 442 -- System Configuration
    442: [
        mcq("HARD",
            "Two servers each with availability 0.99 are configured in parallel with automatic failover. What is the combined availability?",
            [("0.9999", True),
             ("0.99", False),
             ("0.98", False),
             ("1.98", False)],
            "Both must fail for the service to fail: 1 - (0.01 x 0.01) = 0.9999. This assumes the failures are independent, which shared power or a shared switch would break."),
        mcq("MEDIUM",
            "What distinguishes a hot standby from a cold standby configuration?",
            [("A hot standby runs continuously and can take over immediately", True),
             ("A cold standby processes half the workload at all times", False),
             ("A hot standby is powered off until needed", False),
             ("They differ only in the hardware vendor used", False)],
            "The ladder runs cold, warm, hot, with recovery time falling and cost rising at each step. The right choice follows from the recovery time objective."),
    ],

    # 443 -- System Evaluation Indexes
    443: [
        mcq("HARD",
            "A system has an MTBF of 480 hours and an MTTR of 20 hours. What is its availability?",
            [("96%", True),
             ("99%", False),
             ("94%", False),
             ("24%", False)],
            "Availability = MTBF / (MTBF + MTTR) = 480 / 500 = 0.96. Halving repair time raises availability as effectively as doubling time between failures."),
        mcq("MEDIUM",
            "What does throughput measure in system evaluation?",
            [("The amount of work completed per unit of time", True),
             ("The delay experienced by a single request", False),
             ("The proportion of time the system is available", False),
             ("The total cost of ownership per year", False)],
            "Throughput and response time are distinct and can move in opposite directions: batching raises throughput while making each individual response slower."),
    ],

    # 444 -- Operating Systems
    444: [
        mcq("HARD",
            "Four processes arrive together with burst times 6, 2, 8 and 4. Under shortest-job-first on one processor, what is the average waiting time?",
            [("5 units", True),
             ("6 units", False),
             ("4 units", False),
             ("10 units", False)],
            "SJF runs them in the order 2, 4, 6, 8. The waits are 0, 2, 6 and 12, summing to 20 over four processes, so the average is 5. First-come-first-served on the original order would give 8.5."),
        mcq("MEDIUM",
            "What condition must hold for a deadlock to be possible?",
            [("Mutual exclusion, hold and wait, no preemption, and circular wait together", True),
             ("Only that two processes share a resource", False),
             ("Only that the scheduler uses round-robin", False),
             ("Only that virtual memory is enabled", False)],
            "All four Coffman conditions must hold simultaneously, which is why deadlock prevention works by breaking any single one of them."),
    ],

    # 445 -- Middleware, Runtimes and Shared Services
    445: [
        mcq("MEDIUM",
            "What problem does message-oriented middleware primarily solve?",
            [("Decoupling sender and receiver in time and availability", True),
             ("Reducing the size of transmitted messages", False),
             ("Removing the need for a network", False),
             ("Guaranteeing that no message is ever delivered twice", False)],
            "A queue lets a producer continue when the consumer is down. At-least-once delivery is the common default, which is why consumers are usually made idempotent."),
        mcq("HARD",
            "Why does a runtime with automatic garbage collection still allow memory leaks?",
            [("Objects still referenced are never collected, even if the program will not use them again", True),
             ("Garbage collectors cannot free objects larger than a page", False),
             ("Collection only runs when memory is already exhausted", False),
             ("Reference counting is mathematically impossible", False)],
            "Reachability is not the same as usefulness. A cache or listener list holding references indefinitely leaks despite the collector working exactly as designed."),
    ],

    # 446 -- File Systems, Directories and Backup
    446: [
        mcq("HARD",
            "A full backup runs weekly and incremental backups daily. To restore Thursday's state, what is required?",
            [("The last full backup plus every incremental up to Thursday", True),
             ("Only Thursday's incremental backup", False),
             ("Only the last full backup", False),
             ("The last full backup plus Thursday's incremental only", False)],
            "Each incremental holds only what changed since the previous backup, so the chain must be replayed in order. Differential backups would need only the full plus Thursday's."),
        mcq("MEDIUM",
            "What does journaling provide in a file system?",
            [("A record of pending changes so the file system can recover consistently after a crash", True),
             ("Compression of stored file contents", False),
             ("Encryption of file metadata", False),
             ("A log of which users accessed each file", False)],
            "The journal is written before the change so an interrupted operation can be completed or discarded on restart, rather than leaving the structure half-updated."),
    ],

    # 447 -- Development Tools, Build Chains and Testing Environments
    447: [
        mcq("MEDIUM",
            "What does a linker do that a compiler does not?",
            [("Resolves references between separately compiled units and libraries", True),
             ("Checks the syntax of the source code", False),
             ("Translates source statements into machine instructions", False),
             ("Allocates memory at program runtime", False)],
            "The compiler handles one translation unit at a time and leaves external references unresolved. The linker binds them into a single image."),
        mcq("HARD",
            "Why is a reproducible build valuable for a released product?",
            [("The same source reliably yields the same binary, so the artefact can be verified", True),
             ("It makes the build run faster each time", False),
             ("It removes the need for version control", False),
             ("It guarantees the software contains no defects", False)],
            "Reproducibility lets anyone confirm that a shipped binary corresponds to the published source, which is what makes supply-chain verification possible at all."),
    ],

    # 448 -- Open Source Software, Licensing and Adoption
    448: [
        mcq("HARD",
            "What obligation does a strong copyleft licence typically impose when modified software is distributed?",
            [("The modified source must be offered under the same licence terms", True),
             ("All use of the software must be free of charge", False),
             ("The software may not be used commercially", False),
             ("The original author must approve each modification", False)],
            "Copyleft attaches to distribution, not to use, and does not forbid charging. Confusing 'free software' with 'zero price' is the usual source of licence error."),
        mcq("MEDIUM",
            "Which risk should an organization assess before adopting an open source component?",
            [("Licence compatibility, maintenance activity, and security update practice", True),
             ("Whether the code compiles on the first attempt", False),
             ("The number of contributors' countries of residence", False),
             ("The colour scheme of the project website", False)],
            "An abandoned dependency with an incompatible licence is a liability regardless of how good the code is today."),
    ],

    # 449 -- Hardware: Logic Circuits and Semiconductors
    449: [
        mcq("MEDIUM",
            "What is the output of a two-input XOR gate when both inputs are 1?",
            [("0", True),
             ("1", False),
             ("Undefined", False),
             ("High impedance", False)],
            "XOR outputs 1 only when its inputs differ. That property is what makes it the basis of both addition and simple parity circuits."),
        mcq("HARD",
            "A combinational circuit implements the function F = A AND (NOT A). What is its output?",
            [("Always 0, regardless of A", True),
             ("Always 1, regardless of A", False),
             ("Equal to A", False),
             ("Equal to NOT A", False)],
            "A and its complement are never both 1, so the AND can never be satisfied. This is the complement law, and recognizing it collapses whole expressions during simplification."),
    ],
}

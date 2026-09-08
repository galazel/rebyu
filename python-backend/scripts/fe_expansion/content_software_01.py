"""Computer System -> Software, lesson 1: Operating systems.

Syllabus minor category 1, and the largest single entry in this middle
category. Scheduling, deadlock and virtual memory are all examined
numerically or by trace, so each is worked through on specific numbers rather
than described.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Computer System"
MIDDLE = "Software"

_os_sections = [
    ("What an Operating System Is For", [
        desc(
            "An operating system exists to solve one problem twice over. "
            "Programs need resources -- processor time, memory, files, "
            "devices -- and there are more programs than resources, so "
            "something must allocate them. And programs should not have to "
            "know what hardware they are running on, so something must hide "
            "it behind a uniform interface."
        ),
        image(fig("os-layers")),
        table(
            ["Responsibility", "What it decides"],
            [["Process management",
              "Which program runs on which processor, and when"],
             ["Memory management",
              "Where each program's data lives, and what happens when memory "
              "runs out"],
             ["File management", "How data is named, stored and protected"],
             ["Device management", "How programs reach hardware uniformly"],
             ["Protection", "What each program is permitted to touch"],
             ["User interface", "How a person starts and controls work"]],
            caption="Six responsibilities, each a whole section below.",
            footer="Every one of them is a form of the same question: who "
                   "gets a scarce thing, and how are the others prevented "
                   "from taking it."),
        desc(
            "The security boundary in the figure is worth understanding "
            "early. Code above the system call interface runs UNPRIVILEGED "
            "and can only ask; code below it runs in KERNEL MODE and can do "
            "anything to the machine. A program reaches the kernel only by "
            "making a system call, which is a controlled entry point rather "
            "than a jump -- and that controlled entry is what makes isolation "
            "possible at all."
        ),
    ]),

    ("Processes and Threads", [
        desc(
            "A program is a file on disk. A PROCESS is that program running: "
            "it has its own memory, its own open files, its own place in the "
            "code and its own state."
        ),
        compare_grid(
            "PROCESS AND THREAD",
            "A thread is a path of execution inside a process. The "
            "distinction is entirely about what is shared.",
            [("Process",
              "Owns its own address space, files and resources. Two processes "
              "cannot read each other's memory, which makes them safe and "
              "makes communication between them expensive."),
             ("Thread",
              "Shares its process's address space and files with the other "
              "threads in it, and has only its own stack, registers and "
              "program counter. Communication is free -- they share variables "
              "-- and so is corrupting each other's data.")]),
        desc(
            "That trade decides which to use. Threads are cheaper to create "
            "and to switch between, and they can cooperate directly on shared "
            "data, which is exactly why they need the synchronisation the "
            "later sections cover. Processes are heavier and isolated, so a "
            "crash in one cannot corrupt another -- which is why a browser "
            "puts each tab in its own process rather than its own thread."
        ),
        desc(
            "The PROCESS CONTROL BLOCK is what the operating system keeps "
            "about each process: its identifier, its state, the saved "
            "contents of its registers and program counter, its memory map, "
            "its open files and its accounting information. Everything a "
            "context switch saves and restores lives here."
        ),
    ]),

    ("Process States", [
        desc(
            "A process moves between a small number of states, and the "
            "transitions between them are what a scheduler actually does."
        ),
        image(fig("process-states")),
        table(
            ["Transition", "Called", "Caused by"],
            [["Ready to Running", "Dispatch", "The scheduler selecting it"],
             ["Running to Ready", "Pre-emption",
              "Its time slice expiring, or a higher-priority process arriving"],
             ["Running to Waiting", "Block", "Requesting I/O or a resource"],
             ["Waiting to Ready", "Wake-up", "The I/O completing"],
             ["Running to Terminated", "Exit", "Finishing, or being killed"]],
            caption="Five transitions, each with a name the examination "
                    "uses.",
            footer="Note what is missing: there is no Waiting to Running "
                   "transition. A process whose I/O completes becomes READY "
                   "and must still be selected by the scheduler, because "
                   "something else may be running."),
        desc(
            "That absent transition is examined directly, and it matters "
            "practically too: completing an I/O does not give a process the "
            "processor back, so a system with many ready processes can leave "
            "a woken one waiting for a long time even though its data is "
            "sitting there."
        ),
    ]),

    ("Context Switching", [
        desc(
            "Switching from one process to another means saving everything "
            "about the first and restoring everything about the second. The "
            "processor does no useful work while this happens."
        ),
        image(fig("context-switch")),
        desc(
            "The cost is not only the register copying. The new process's "
            "working set is not in the cache, so it runs slowly until the "
            "cache refills -- and if the memory management unit's translation "
            "cache must also be flushed, the penalty is larger still. A "
            "context switch measured in microseconds can cost far more than "
            "that in lost cache performance."
        ),
        desc(
            "This is what makes the TIME SLICE a genuine compromise rather "
            "than an arbitrary number. Too short and the machine spends its "
            "time switching rather than computing; too long and an "
            "interactive process waits behind a compute-bound one and the "
            "system feels unresponsive. Threads switch more cheaply than "
            "processes precisely because they share an address space, so "
            "there is less to swap."
        ),
    ]),

    ("Scheduling Algorithms", [
        desc(
            "When several processes are ready, the scheduler chooses. The "
            "syllabus names the algorithms and the examination asks you to "
            "compute turnaround or waiting times under each."
        ),
        content_accordion(
            "THE ALGORITHMS THE SYLLABUS NAMES",
            "Each optimises something different, and each fails in a "
            "characteristic way.",
            [("First come, first served (FCFS)",
              "Runs processes in arrival order until each completes. Simple "
              "and fair in one sense, and it suffers the CONVOY EFFECT: one "
              "long process at the front makes every short one behind it "
              "wait, which is disastrous for average waiting time."),
             ("Shortest job first (SJF)",
              "Runs the process with the shortest remaining burst. Provably "
              "gives the minimum average waiting time -- and requires knowing "
              "the burst lengths in advance, which is rarely possible, and "
              "STARVES long processes if short ones keep arriving."),
             ("Round robin",
              "Each ready process gets a fixed time slice in turn. Fair and "
              "responsive, which is why interactive systems use it. Its "
              "behaviour depends entirely on the slice: very long and it "
              "degenerates to FCFS, very short and context switching "
              "dominates."),
             ("Priority scheduling",
              "The highest-priority ready process runs. Expresses what "
              "matters, and starves low-priority work indefinitely unless "
              "AGEING is used -- gradually raising the priority of a process "
              "that has waited a long time."),
             ("Multilevel feedback queues",
              "Several queues at different priorities, with processes moving "
              "between them based on behaviour: a process that uses its whole "
              "slice is demoted as compute-bound, one that blocks early is "
              "promoted as interactive. This approximates shortest-job-first "
              "without needing to know burst lengths, and is what real "
              "general-purpose systems use.")]),
    ]),

    ("Working a Scheduling Calculation", [
        desc(
            "Examination items give arrival times and burst times and ask for "
            "average waiting or turnaround time. The definitions matter more "
            "than the arithmetic."
        ),
        table(
            ["Term", "Definition"],
            [["Burst time", "How long the process needs the processor"],
             ["Arrival time", "When it became ready"],
             ["Completion time", "When it finished"],
             ["Turnaround time", "Completion time minus arrival time"],
             ["Waiting time", "Turnaround time minus burst time"],
             ["Response time", "First time it ran, minus arrival time"]],
            caption="Six definitions that must not be confused.",
            footer="Turnaround includes the burst; waiting excludes it. "
                   "Response time matters for interactive work and is often "
                   "much better than waiting time under round robin."),
        ol([
            "Three processes all arrive at time 0 with bursts of 24, 3 and 3, "
            "scheduled first come first served in that order.",
            "P1 completes at 24, P2 at 27, P3 at 30.",
            "Waiting times: P1 waited 0, P2 waited 24, P3 waited 27.",
            "Average waiting time = (0 + 24 + 27) / 3 = 17.",
            "Now run the same three shortest-job-first: order becomes P2, P3, "
            "P1. Waiting times are 0, 3 and 6, averaging 3.",
        ]),
        desc(
            "Seventeen against three, from nothing but the order. That gap is "
            "the convoy effect measured, and it is why the examination "
            "returns to this comparison: the algorithms are not "
            "near-equivalent choices, and one long job at the head of a "
            "first-come queue dominates the average completely."
        ),
    ]),

    ("Concurrency and the Critical Section", [
        desc(
            "When two threads share data, the order in which their "
            "individual steps interleave is decided by the scheduler rather "
            "than by the code. That is what makes concurrency hard."
        ),
        desc(
            "The canonical failure: two threads each read a balance of 100, "
            "each add 50, each write back 150. Two deposits have occurred and "
            "one has vanished. Nothing crashed, no error was reported, and "
            "the code looks correct when read on its own -- which is why a "
            "RACE CONDITION is so much harder to find than a crash."
        ),
        ul([
            "A CRITICAL SECTION is the region of code that touches shared "
            "data and must not be executed by two threads at once.",
            "MUTUAL EXCLUSION is the guarantee that it is not, and it is the "
            "requirement every synchronisation mechanism exists to provide.",
            "The read-modify-write sequence above is the shape to recognise: "
            "any operation that reads a value, computes from it, and writes "
            "it back is a critical section unless something makes it "
            "ATOMIC.",
        ]),
        desc(
            "Race conditions are intermittent by nature, because they depend "
            "on a specific interleaving that may occur rarely. That is why "
            "they survive testing, appear only under production load, and "
            "cannot be reproduced on demand -- and why reasoning about the "
            "code matters more here than any amount of running it."
        ),
    ]),

    ("Synchronisation Mechanisms", [
        desc(
            "The syllabus names the mechanisms that enforce mutual exclusion, "
            "and the differences between them are examined."
        ),
        content_tabs(
            "THREE MECHANISMS",
            "Each is a different answer to the same question: how does one "
            "thread make others wait?",
            [("Semaphore", "A counter with two atomic operations",
              "P (wait) decrements the counter and blocks if it would go "
              "below zero; V (signal) increments it and wakes a waiter. A "
              "BINARY semaphore, counting 0 or 1, provides mutual exclusion; "
              "a COUNTING semaphore allows a fixed number of concurrent "
              "holders, which is how a pool of n connections is managed."),
             ("Mutex", "A lock with an owner",
              "Simpler than a semaphore and stricter: it is locked and "
              "unlocked by the SAME thread, which lets the system detect "
              "misuse and support priority inheritance. Where a binary "
              "semaphore would do, a mutex is usually the better choice "
              "because its ownership rule catches errors."),
             ("Monitor", "Mutual exclusion built into the module",
              "A construct in which only one thread may be executing any of "
              "the module's procedures at a time, with condition variables "
              "for waiting inside it. The advantage is that the locking is "
              "part of the structure rather than something every caller must "
              "remember, which removes a whole class of mistake.")]),
        desc(
            "The general lesson behind the third option is worth carrying: a "
            "mechanism that must be used correctly at every call site will "
            "eventually be used incorrectly at one of them. Making the "
            "protection structural rather than conventional is the more "
            "reliable design, and it is the same argument the Programming "
            "lesson made about narrow interfaces."
        ),
    ]),

    ("Deadlock", [
        desc(
            "Mutual exclusion solves one problem and creates another. If two "
            "threads each hold something the other needs, neither can "
            "proceed and neither will give way."
        ),
        image(fig("deadlock-cycle")),
        table(
            ["Condition", "What it means", "How it can be removed"],
            [["Mutual exclusion", "A resource cannot be shared",
              "Rarely removable -- it is usually the requirement"],
             ["Hold and wait", "A holder may request more",
              "Require all resources to be requested at once"],
             ["No pre-emption", "A resource cannot be taken back",
              "Allow the system to reclaim it"],
             ["Circular wait", "A cycle of processes each waiting on the next",
              "Impose a global ordering on resource acquisition"]],
            caption="Deadlock needs all four conditions at once.",
            footer="Because all four are required, breaking ANY ONE prevents "
                   "deadlock -- which is why consistent lock ordering, "
                   "attacking circular wait, is the practical remedy: it "
                   "costs nothing and needs no runtime machinery."),
        desc(
            "The syllabus distinguishes three strategies. PREVENTION removes "
            "one of the four conditions by design. AVOIDANCE examines each "
            "request at run time and refuses any that could lead to deadlock, "
            "which requires knowing future resource needs and is rarely "
            "practical. DETECTION AND RECOVERY allows deadlock to occur, "
            "notices the cycle, and breaks it by killing a process or forcing "
            "it to release something."
        ),
        desc(
            "Distinguish deadlock from LIVELOCK and from STARVATION, since "
            "the examination does. In deadlock nothing moves. In livelock "
            "processes are active but making no progress, each politely "
            "yielding to the other. In starvation the system progresses but "
            "one particular process never gets its turn."
        ),
    ]),

    ("Memory Management and Fragmentation", [
        desc(
            "Several processes must share physical memory, and how it is "
            "divided determines what gets wasted."
        ),
        image(fig("fragmentation")),
        desc(
            "EXTERNAL fragmentation is free memory scattered in pieces too "
            "small to use: the total free space may exceed a request that "
            "still cannot be satisfied. INTERNAL fragmentation is space "
            "wasted INSIDE an allocation, when a fixed block is larger than "
            "what was asked for."
        ),
        table(
            ["Allocation scheme", "Suffers from", "Notes"],
            [["Fixed partitions", "Internal fragmentation",
              "Simple; a small process wastes the rest of its partition"],
             ["Variable partitions", "External fragmentation",
              "Fits the request exactly, leaving awkward gaps over time"],
             ["Paging", "A little internal fragmentation",
              "Fixed-size pages eliminate external fragmentation entirely"],
             ["Segmentation", "External fragmentation",
              "Variable-size segments matching program structure"]],
            caption="Four schemes and the waste each one accepts.",
            footer="Paging's trade is the one that won: making every block "
                   "identical removes external fragmentation completely, and "
                   "the cost is a partly used final page per allocation."),
        desc(
            "COMPACTION is the remedy for external fragmentation -- moving "
            "allocations together to consolidate the free space. It works and "
            "it is expensive, since everything must be copied and every "
            "reference updated, which is why paging's structural fix is "
            "preferred to periodically tidying up."
        ),
    ]),

    ("Virtual Memory", [
        desc(
            "Virtual memory gives each process an address space that is "
            "larger than physical memory and entirely its own. The addresses "
            "a program uses are translated to physical ones on every access."
        ),
        image(fig("virtual-memory")),
        desc(
            "Three benefits follow, and they are worth separating because "
            "examination items ask about them individually. A process may use "
            "more memory than is installed, since inactive pages live on "
            "disk. Processes are ISOLATED, because each has its own "
            "translation and cannot name another's memory at all. And "
            "programs are RELOCATABLE, because their addresses are virtual "
            "and can map anywhere physical."
        ),
        desc(
            "A reference to a page that is not resident causes a PAGE FAULT: "
            "the process blocks, the operating system finds the page on disk, "
            "reads it into a free frame, updates the page table and resumes "
            "the instruction. A page fault is not an error -- it is the "
            "mechanism working as designed -- and it costs a disk access, "
            "which is why the fault RATE matters so much more than the "
            "concept."
        ),
    ]),

    ("Page Replacement and Thrashing", [
        desc(
            "When a page must be brought in and no frame is free, something "
            "must be evicted. Which one is the page replacement policy, and "
            "the syllabus names several."
        ),
        table(
            ["Policy", "Evicts", "Weakness"],
            [["FIFO", "The page resident longest",
              "May evict a heavily used page; suffers Belady's anomaly"],
             ["LRU", "The page unused for longest",
              "Approximates optimal well; expensive to track exactly"],
             ["LFU", "The page used least often",
              "A page heavily used once and never again lingers"],
             ["Optimal (OPT)", "The page next needed furthest ahead",
              "Requires knowing the future; a benchmark, not implementable"],
             ["Clock (second chance)", "An approximation of LRU",
              "What real systems use, being cheap and nearly as good"]],
            caption="Five policies, from simplest to most practical.",
            footer="Belady's anomaly is the counter-intuitive result that "
                   "FIFO can produce MORE page faults when given MORE frames. "
                   "LRU cannot, which is one reason it is preferred."),
        desc(
            "THRASHING is the pathological state where the system spends more "
            "time paging than computing. It arises when the processes "
            "resident need more pages than there are frames, so every process "
            "constantly evicts pages another is about to need."
        ),
        desc(
            "Its signature is diagnostic and worth memorising: processor "
            "utilisation collapses while disk activity is at maximum. The "
            "instinctive response -- the processor looks idle, so admit more "
            "work -- makes it dramatically worse, which is exactly why the "
            "symptom is examined. The correct responses are to reduce the "
            "degree of multiprogramming, or to add physical memory."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where operating system items are lost."),
        ul([
            "Believing a process moves from Waiting straight to Running. It "
            "becomes Ready and must be scheduled.",
            "Confusing turnaround time with waiting time. Turnaround includes "
            "the burst; waiting excludes it.",
            "Treating a page fault as an error. It is the mechanism operating "
            "normally.",
            "Confusing internal with external fragmentation. Internal is "
            "waste inside a block, external is scattered free space.",
            "Responding to thrashing by admitting more processes because the "
            "processor looks idle.",
            "Assuming all four deadlock conditions must be attacked. Breaking "
            "any one suffices.",
            "Confusing deadlock with starvation. In deadlock nothing "
            "progresses; in starvation the system progresses and one process "
            "never does.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"Four processes arrive at time 0 with burst times 8, 4, 9 and "
            "5. Under shortest-job-first scheduling, what is the average "
            "waiting time?\""
        ),
        ol([
            "Order by burst: 4, 5, 8, 9.",
            "The first waits 0. The second waits 4. The third waits 4 + 5 = "
            "9. The fourth waits 4 + 5 + 8 = 17.",
            "Total waiting = 0 + 4 + 9 + 17 = 30.",
            "Average = 30 / 4 = 7.5.",
            "Compare with first-come-first-served in the given order 8, 4, 9, "
            "5: waits of 0, 8, 12, 21, averaging 10.25.",
        ]),
        desc(
            "Two habits make these reliable. Build the cumulative running "
            "total rather than computing each wait independently, since each "
            "process waits for everything before it. And check that the LAST "
            "waiting time equals the sum of all the other bursts -- if it "
            "does not, an arithmetic slip has occurred somewhere earlier."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("The operating system is the hinge between hardware and "
             "applications."),
        ul([
            "Interrupts, context switching and the MMU are the Processor and "
            "Memory lessons' mechanisms being used.",
            "Race conditions and deadlock reappear in Database as concurrency "
            "control and locking.",
            "Virtual memory's locality argument is the Memory lesson's "
            "hierarchy extended onto disk.",
            "Scheduling reappears in Project Time Management as resource "
            "levelling, with the same trade-offs.",
            "Kernel mode and the system call boundary are the basis of the "
            "Security lessons' privilege model.",
            "Thrashing is a queueing collapse of exactly the kind Applied "
            "Mathematics described.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results the examination expects immediately.",
            [("The missing process transition",
              "There is no Waiting to Running",
              "A woken process becomes Ready and must still be selected by "
              "the scheduler."),
             ("Turnaround against waiting time",
              "Turnaround includes the burst; waiting does not",
              "Waiting = turnaround - burst. Confusing them is the commonest "
              "error on scheduling items."),
             ("The four deadlock conditions",
              "Mutual exclusion, hold and wait, no pre-emption, circular wait",
              "All four are required, so breaking any ONE prevents it. "
              "Consistent lock ordering attacks circular wait for free."),
             ("Internal against external fragmentation",
              "Waste inside a block against scattered free space",
              "Paging eliminates external fragmentation by making every block "
              "identical, and accepts a partly used last page."),
             ("The signature of thrashing",
              "Processor utilisation collapses, disk activity maximal",
              "Admitting more work because the processor looks idle makes it "
              "far worse. Reduce multiprogramming or add memory."),
             ("Belady's anomaly",
              "FIFO can fault MORE with MORE frames",
              "LRU cannot, which is one reason it is preferred despite "
              "costing more to track.")]),
    ]),
]

_os_quiz = [
    mcq("AVERAGE",
        "Four processes arrive simultaneously with burst times of 8, 4, 9 and "
        "5.\n\nUnder shortest-job-first scheduling, what is the average "
        "waiting time?",
        [("6.5", False),
         ("7.5", True),
         ("10.25", False),
         ("13.0", False)],
        "Ordered by burst the sequence is 4, 5, 8, 9, giving waits of 0, 4, 9 "
        "and 17 -- a total of 30 and an average of 7.5. The value 10.25 is "
        "the first-come-first-served result for the order as given, and the "
        "gap between the two is the convoy effect measured. A useful check is "
        "that the last process's wait, 17, equals the sum of the three bursts "
        "ahead of it."),

    mcq("EASY",
        "A process is waiting for a disk read to complete, and the read "
        "finishes.\n\nWhich state does the process enter?",
        [("Running, since its data is now available", False),
         ("Ready, where it awaits selection by the scheduler", True),
         ("Terminated, since its request has been satisfied", False),
         ("New, since it must be re-admitted to the system", False)],
        "There is no transition from Waiting directly to Running. A completed "
        "I/O makes the process READY, and it must still be selected by the "
        "scheduler -- because another process is very likely running at that "
        "moment and cannot simply be displaced. This is why a system with "
        "many ready processes can leave a woken one waiting despite its data "
        "being available."),

    mcq("AVERAGE",
        "System monitoring shows processor utilisation near zero while disk "
        "activity is continuous and at maximum.\n\n"
        "What is happening, and what is the correct response?",
        [("The processor has failed; replace it", False),
         ("Thrashing; reduce multiprogramming or add memory", True),
         ("The disk has failed; the processor is waiting on errors", False),
         ("The system is idle; admit more processes to use the capacity",
          False)],
        "Low processor utilisation with saturated disk activity is the "
        "signature of thrashing: the resident processes need more pages than "
        "there are frames, so each constantly evicts pages another is about "
        "to want, and almost all time goes into paging. The instinctive "
        "response -- the processor looks idle, so admit more work -- adds "
        "processes competing for the same frames and makes it dramatically "
        "worse, which is precisely why this symptom is examined."),

    mcq("HARD",
        "Deadlock requires four conditions to hold simultaneously.\n\n"
        "What follows for prevention?",
        [("All four must be eliminated for prevention to succeed", False),
         ("Eliminating any single one is sufficient to prevent deadlock",
          True),
         ("Only mutual exclusion can practically be eliminated", False),
         ("Prevention is impossible; detection is the only option", False)],
        "Because the four conditions are jointly necessary, removing any one "
        "makes deadlock impossible -- which is why the practical remedy is "
        "usually to attack circular wait through consistent lock ordering: it "
        "costs nothing at run time and needs no special machinery. Mutual "
        "exclusion is generally the LEAST removable condition, since it is "
        "usually the requirement rather than an implementation choice."),

    mcq("AVERAGE",
        "Memory is allocated in fixed-size blocks, and a process requesting "
        "33 KB is given a 40 KB block.\n\n"
        "What is the 7 KB of unused space called?",
        [("External fragmentation", False),
         ("Internal fragmentation", True),
         ("Thrashing overhead", False),
         ("Compaction loss", False)],
        "Space wasted INSIDE an allocation, because the block is larger than "
        "the request, is internal fragmentation. External fragmentation is "
        "the opposite situation: free memory scattered in pieces too small to "
        "satisfy a request, so the total free space can exceed a request that "
        "still cannot be met. Paging accepts a little internal fragmentation "
        "in each allocation's final page in exchange for eliminating external "
        "fragmentation entirely."),

    mcq("HARD",
        "Two threads each read a shared balance of 100, each add 50, and each "
        "write the result back.\n\n"
        "What is the final balance, and what is the fault called?",
        [("200, with no fault -- both updates were applied", False),
         ("150, and the fault is a race condition", True),
         ("150, and the fault is a deadlock", False),
         ("100, and the fault is starvation", False)],
        "Both threads read 100 before either writes, so both compute 150 and "
        "both store it -- one deposit is silently lost. This is a race "
        "condition: the outcome depends on how the threads' steps interleave "
        "rather than on the code, and nothing crashes or reports an error. "
        "Deadlock is mutual waiting with no progress, and starvation is one "
        "process never getting its turn while the system continues."),

    mcq("AVERAGE",
        "Which scheduling algorithm gives provably minimal average waiting "
        "time, and why is it rarely usable directly?",
        [("Round robin, because the time slice cannot be tuned", False),
         ("Shortest job first, because burst times are not known in "
          "advance", True),
         ("First come first served, because arrival order is arbitrary",
          False),
         ("Priority scheduling, because priorities change over time", False)],
        "Shortest job first minimises average waiting time provably, by "
        "clearing short work before long. It requires knowing each process's "
        "burst length before running it, which is generally impossible -- and "
        "it starves long processes if short ones keep arriving. Multilevel "
        "feedback queues approximate it from observed behaviour, promoting "
        "processes that block early and demoting those that use a full "
        "slice."),

    mcq("EASY",
        "What distinguishes a thread from a process?",
        [("A thread shares its process's address space with other threads",
          True),
         ("A thread runs at a higher priority than a process", False),
         ("A thread cannot be pre-empted once it starts running", False),
         ("A thread has no program counter of its own", False)],
        "Threads within one process share its address space, open files and "
        "resources, holding only their own stack, registers and program "
        "counter -- which is what makes them cheap to switch between and able "
        "to cooperate on shared data, and also what makes them able to "
        "corrupt one another. Separate processes cannot read each other's "
        "memory at all, which is why a browser isolates tabs into processes "
        "rather than threads."),

    mcq("HARD",
        "Under FIFO page replacement, increasing the number of frames "
        "available to a process sometimes increases the number of page "
        "faults.\n\nWhat is this called?",
        [("Thrashing", False),
         ("Belady's anomaly", True),
         ("The convoy effect", False),
         ("Priority inversion", False)],
        "Belady's anomaly is the counter-intuitive result that FIFO can fault "
        "MORE with more frames, because evicting by age takes no account of "
        "how recently a page was used and a larger frame set can change the "
        "eviction order for the worse. Stack-based algorithms such as LRU "
        "cannot exhibit it, which is one argument for preferring them. "
        "Thrashing is excessive paging overall, and the convoy effect is a "
        "scheduling phenomenon."),

    mcq("AVERAGE",
        "Which synchronisation construct is locked and unlocked by the same "
        "thread, allowing misuse to be detected?",
        [("A counting semaphore", False),
         ("A mutex", True),
         ("A condition variable", False),
         ("A spinlock in the kernel", False)],
        "A mutex has an owner: the thread that locks it is the thread that "
        "must unlock it, which lets the system detect incorrect use and "
        "support priority inheritance. A semaphore has no ownership at all -- "
        "any thread may signal it, which is what makes it suitable for "
        "signalling between threads and less suitable than a mutex where "
        "simple mutual exclusion is wanted."),
]

LESSON_OS = lesson(
    MAJOR, MIDDLE,
    "Operating Systems: Processes, Scheduling and Memory Management",
    _os_quiz,
    lesson_structure(
        "Operating Systems: Processes, Scheduling and Memory Management",
        "An operating system solves one problem twice: there are more "
        "programs than resources, so something must allocate them, and "
        "programs should not have to know what hardware they run on, so "
        "something must hide it. This lesson works through both. It covers "
        "processes and threads and what each shares, the states a process "
        "moves between and the transition that does not exist, the scheduling "
        "algorithms and the arithmetic the examination asks of them, the race "
        "conditions that arise when threads share data and the mechanisms "
        "that prevent them, deadlock and its four conditions, and the memory "
        "management that ends in virtual memory, page replacement and "
        "thrashing.",
        [
            "Describe what an operating system manages and where the "
            "privilege boundary lies",
            "Distinguish processes from threads by what each shares",
            "Trace the process state transitions and explain the one that is "
            "absent",
            "Compare the scheduling algorithms and compute waiting and "
            "turnaround times",
            "Explain race conditions, critical sections and the mechanisms "
            "enforcing mutual exclusion",
            "State the four deadlock conditions and the strategies against "
            "them",
            "Distinguish internal from external fragmentation and explain how "
            "paging addresses each",
            "Explain virtual memory, page replacement policies and the "
            "signature of thrashing",
        ],
        90,
        _os_sections,
        [
            ("Kernel mode",
             "The privileged mode in which operating system code runs, "
             "reached from an application only through a system call. The "
             "boundary that makes isolation possible."),
            ("Process",
             "A program in execution, owning its own address space, open "
             "files and resources. Two processes cannot read each other's "
             "memory."),
            ("Thread",
             "A path of execution sharing its process's address space and "
             "files, holding only its own stack, registers and program "
             "counter. Cheap to switch, and able to corrupt shared data."),
            ("Process control block",
             "The record holding everything the system knows about a process "
             "-- state, saved registers, memory map, open files. What a "
             "context switch saves and restores."),
            ("Context switch",
             "Saving one process's state and restoring another's. Pure "
             "overhead, and costlier than it looks because the new process's "
             "working set is not in cache."),
            ("Convoy effect",
             "One long process at the head of a first-come queue making every "
             "short process behind it wait, wrecking the average waiting "
             "time."),
            ("Round robin",
             "Giving each ready process a fixed time slice in turn. Fair and "
             "responsive; degenerates to FCFS with a long slice and to pure "
             "overhead with a very short one."),
            ("Ageing",
             "Gradually raising the priority of a long-waiting process, which "
             "is what prevents priority scheduling from starving low-priority "
             "work."),
            ("Turnaround time",
             "Completion time minus arrival time. Includes the burst, unlike "
             "waiting time."),
            ("Race condition",
             "An outcome that depends on how concurrent operations "
             "interleave. Intermittent by nature, which is why it survives "
             "testing."),
            ("Critical section",
             "The region of code touching shared data that must not be "
             "executed by two threads at once."),
            ("Semaphore",
             "A counter with atomic wait and signal operations. Binary for "
             "mutual exclusion, counting for a pool of n resources."),
            ("Mutex",
             "A lock with an owner: locked and unlocked by the same thread, "
             "which allows misuse to be detected."),
            ("Deadlock",
             "Processes each holding a resource another needs, so none "
             "proceeds. Requires mutual exclusion, hold and wait, no "
             "pre-emption and circular wait together -- so breaking any one "
             "prevents it."),
            ("Internal fragmentation",
             "Memory wasted inside an allocation because the block is larger "
             "than the request."),
            ("External fragmentation",
             "Free memory scattered in pieces too small to use, so the total "
             "free space can exceed an unsatisfiable request."),
            ("Page fault",
             "A reference to a page not currently resident, causing the "
             "operating system to fetch it from disk. Normal operation, not "
             "an error."),
            ("Thrashing",
             "Spending more time paging than computing. Its signature is "
             "collapsed processor utilisation with maximal disk activity, and "
             "admitting more work makes it worse."),
            ("Belady's anomaly",
             "FIFO page replacement producing more faults when given more "
             "frames. LRU cannot exhibit it."),
        ],
        "An operating system allocates scarce resources and hides the "
        "hardware, and the system call interface between unprivileged and "
        "kernel code is what makes isolation possible at all. A process owns "
        "its address space while threads inside it share one -- which is why "
        "threads are cheap and dangerous in the same breath. A process moves "
        "between Ready, Running and Waiting, and the transition that does not "
        "exist is Waiting to Running: completed I/O makes a process ready, "
        "not running. Scheduling chooses between ready processes, and the "
        "algorithms are far from equivalent -- three processes with bursts of "
        "24, 3 and 3 wait an average of 17 under first-come-first-served and "
        "3 under shortest-job-first, which is the convoy effect measured. "
        "Where threads share data the interleaving is the scheduler's to "
        "decide, so any read-modify-write is a critical section and a race "
        "condition follows from leaving it unprotected -- intermittent, "
        "silent, and invisible to testing. Mutual exclusion introduces "
        "deadlock, which needs four conditions at once and is therefore "
        "prevented by breaking any single one, most cheaply by ordering lock "
        "acquisition consistently. Memory divided into variable pieces "
        "fragments externally and into fixed pieces fragments internally, and "
        "paging chooses the second deliberately because identical blocks "
        "eliminate the first. Virtual memory then gives every process a "
        "private oversized address space at the cost of page faults, and when "
        "resident processes need more frames than exist the system thrashes "
        "-- processor idle, disk saturated, and every instinct to admit more "
        "work making it worse.",
        exam_notes=[
            desc(
                "Operating systems contribute heavily to Subject A, with both "
                "conceptual items and scheduling arithmetic."
            ),
            ul([
                "Computing average waiting or turnaround time under a named "
                "algorithm.",
                "Identifying a process state transition or the one that is "
                "absent.",
                "Naming the four deadlock conditions or the strategy against "
                "one.",
                "Distinguishing internal from external fragmentation.",
                "Recognising thrashing from processor and disk utilisation.",
                "Distinguishing a race condition from deadlock and from "
                "starvation.",
                "Comparing semaphores, mutexes and monitors.",
            ]),
            desc(
                "On scheduling items, write the completion time of each "
                "process in order and derive waiting time from it rather than "
                "computing each independently. Then check the last process's "
                "wait against the sum of the bursts ahead of it -- that check "
                "catches nearly every arithmetic slip."
            ),
        ],
    ))

LESSONS = [LESSON_OS]

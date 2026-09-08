"""Computer System -> Computer Component, lessons 2 to 5.

Syllabus minor categories 2 (memory), 3 (bus), 4 (input/output interface) and
5 (input/output device).

Memory is the heavyweight here and is examined numerically -- cache hit
ratios, effective access times and capacity calculations are all small
arithmetic done without a calculator. The three that follow are shorter and
are examined by identification, so they are combined into one lesson covering
how components are connected and how data reaches them.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Computer System"
MIDDLE = "Computer Component"

# ==========================================================================
# Lesson 2: Memory
# ==========================================================================

_mem_sections = [
    ("Why Memory Is a Hierarchy", [
        desc(
            "There is no memory technology that is simultaneously fast, "
            "large and cheap. Fast memory is expensive per byte and therefore "
            "small; cheap memory is large and slow. Rather than choosing one, "
            "a computer uses several at once and arranges them so that most "
            "accesses are served by the fast ones."
        ),
        image(fig("memory-hierarchy")),
        desc(
            "Each level down is roughly ten times slower, ten times larger "
            "and ten times cheaper per byte than the one above. The "
            "arrangement only works because of LOCALITY, which is an "
            "observation about real programs rather than a design decision."
        ),
        compare_grid(
            "THE TWO KINDS OF LOCALITY",
            "Both are empirical facts about how programs behave, and the "
            "entire hierarchy is a bet on them.",
            [("Temporal locality",
              "A location just accessed is likely to be accessed again "
              "shortly. A loop counter, a frequently called function, a "
              "record being updated. This is what makes caching anything "
              "worthwhile at all."),
             ("Spatial locality",
              "Locations near one just accessed are likely to be accessed "
              "soon. Walking an array, reading fields of a record, executing "
              "consecutive instructions. This is why memory is fetched in "
              "BLOCKS rather than single bytes.")]),
    ]),

    ("Main Memory: RAM and ROM", [
        desc(
            "Main memory is where a running program and its data live. Two "
            "families, distinguished by whether they survive a power loss."
        ),
        table(
            ["Type", "Volatile?", "Built from", "Speed and cost", "Used for"],
            [["SRAM", "Yes", "Flip-flops, several transistors per bit",
              "Fastest, dearest", "Cache"],
             ["DRAM", "Yes", "One transistor and a capacitor per bit",
              "Slower, far cheaper", "Main memory"],
             ["ROM", "No", "Fixed at manufacture", "Read only", "Firmware"],
             ["Flash / EEPROM", "No", "Electrically erasable cells",
              "Slow to write, limited write cycles", "SSDs, firmware"]],
            caption="The memory types the syllabus names.",
            footer="The SRAM and DRAM difference explains the hierarchy's "
                   "top: SRAM holds its value as long as power is applied, "
                   "while DRAM's capacitors leak and must be REFRESHED "
                   "thousands of times a second -- which is where the "
                   "'dynamic' comes from and why it is slower."),
        desc(
            "That refresh requirement is worth understanding rather than "
            "memorising. Each DRAM bit is a tiny capacitor that loses its "
            "charge in milliseconds, so the memory controller reads and "
            "rewrites every row continuously. Refresh consumes bandwidth the "
            "processor cannot use, and it is the price of the density that "
            "makes DRAM affordable in gigabytes."
        ),
    ]),

    ("Cache Memory", [
        desc(
            "Cache is a small, fast memory holding recently used data, sitting "
            "between the processor and main memory. When the processor asks "
            "for an address, the cache is checked first: a HIT is served in a "
            "few cycles, and a MISS means fetching from main memory at "
            "hundreds."
        ),
        desc(
            "Data moves between cache and memory in fixed-size BLOCKS, or "
            "cache lines, typically 64 bytes -- never single bytes. That is "
            "spatial locality being exploited directly: fetching a whole line "
            "costs barely more than fetching one byte and usually brings in "
            "several the program is about to want."
        ),
        image(fig("cache-mapping")),
        desc(
            "Where a block may sit is the mapping question. DIRECT MAPPING "
            "gives each memory block exactly one possible line, so lookup is "
            "a single check -- and two frequently used blocks that map to the "
            "same line evict each other repeatedly, however empty the rest of "
            "the cache is. FULLY ASSOCIATIVE mapping allows any block "
            "anywhere, eliminating that entirely at the cost of checking every "
            "line. SET ASSOCIATIVE mapping is the compromise every real cache "
            "uses: the address selects a set, and the block sits anywhere "
            "within it."
        ),
    ]),

    ("Cache Performance", [
        desc(
            "Cache effectiveness is measured by the HIT RATIO -- the "
            "proportion of accesses served without going to main memory -- "
            "and the examination asks you to compute an effective access time "
            "from it."
        ),
        ol([
            "Effective access time = (hit ratio x cache time) + (miss ratio x "
            "memory time).",
            "With a 95% hit ratio, a 2ns cache and a 100ns memory: "
            "(0.95 x 2) + (0.05 x 100).",
            "That is 1.9 + 5.0 = 6.9 nanoseconds.",
        ]),
        desc(
            "Read that result carefully, because it is the whole point of the "
            "topic. Five percent of accesses miss, and those five percent "
            "contribute 5.0 of the 6.9 nanoseconds -- nearly three quarters "
            "of the total time is spent on one twentieth of the accesses. "
            "Raising the hit ratio from 95% to 99% would bring the effective "
            "time to 2.98ns, less than half. Small changes in hit ratio "
            "produce large changes in speed, which is why cache-friendly data "
            "layout matters so much."
        ),
        content_accordion(
            "THE THREE KINDS OF CACHE MISS",
            "Each has a different cause and a different remedy, and the "
            "examination distinguishes them.",
            [("Compulsory (cold) miss",
              "The first reference to a block, which cannot be in a cache "
              "that has never seen it. Unavoidable, though prefetching can "
              "move the cost earlier."),
             ("Capacity miss",
              "The working set is larger than the cache, so blocks are "
              "evicted before being reused. Remedied by a larger cache, or by "
              "making the program touch less data."),
             ("Conflict miss",
              "Blocks that would have fitted are evicted because they mapped "
              "to the same line or set. Remedied by higher associativity, and "
              "the reason direct-mapped caches are rare."),
             ("Replacement policy",
              "When a set is full, something must be evicted. LRU -- least "
              "recently used -- is the usual choice, because temporal "
              "locality says the least recently used is the least likely to "
              "be wanted next. FIFO and random are cheaper to implement and "
              "slightly worse.")]),
    ]),

    ("Write Policies", [
        desc(
            "Reads are the easy half. When the processor WRITES to a cached "
            "location, main memory now disagrees with the cache, and the "
            "policy for resolving that is examined."
        ),
        compare_grid(
            "TWO WRITE POLICIES",
            "The trade is between write bandwidth and the risk of losing "
            "data that only the cache holds.",
            [("Write-through",
              "Every write goes to both cache and main memory immediately. "
              "The two never disagree, so recovery after a failure is simple "
              "and other devices reading memory see current data. Consumes "
              "memory bandwidth on every write."),
             ("Write-back",
              "The write goes only to the cache, and the line is marked "
              "dirty; main memory is updated when the line is eventually "
              "evicted. Far less memory traffic, especially where the same "
              "location is written repeatedly -- and a power loss destroys "
              "everything not yet written back.")]),
        desc(
            "The same choice, under the same names, appears again in disk "
            "controllers and in database buffer management. It is the general "
            "form of a trade that recurs throughout computing: writing "
            "eagerly is slower and safer, writing lazily is faster and risks "
            "the window between the write and its persistence."
        ),
    ]),

    ("Memory Interleaving and Bandwidth", [
        desc(
            "Latency is how long one access takes; BANDWIDTH is how much data "
            "can move per second. They are improved by different means, and "
            "the syllabus names the technique for bandwidth."
        ),
        desc(
            "MEMORY INTERLEAVING divides memory into banks that can be "
            "accessed concurrently, with consecutive addresses assigned to "
            "different banks. A sequential read then starts the next bank's "
            "access while the previous one is still completing, so the "
            "accesses overlap and effective bandwidth rises even though no "
            "single access got any faster."
        ),
        ul([
            "Interleaving raises BANDWIDTH and leaves LATENCY untouched: no "
            "single access completes any sooner.",
            "The benefit depends on consecutive requests landing in different "
            "banks, which sequential access produces naturally.",
            "A program striding at exactly the bank interval hits one bank "
            "every time and gains nothing at all.",
        ]),
        desc(
            "Note which programs this helps. Interleaving rewards SEQUENTIAL "
            "access, because that is what spreads consecutive requests across "
            "different banks. A program striding through memory at exactly "
            "the bank interval hits the same bank every time and gets no "
            "benefit at all -- another instance of access pattern mattering "
            "as much as access count."
        ),
    ]),

    ("Auxiliary Storage", [
        desc(
            "Below main memory sits storage that survives power loss and "
            "holds far more, at latencies measured in microseconds or "
            "milliseconds rather than nanoseconds."
        ),
        table(
            ["Medium", "Access", "Typical latency", "Characteristic"],
            [["Hard disk (HDD)", "Mechanical, rotating platters",
              "5-10 milliseconds", "Cheap per byte; seek time dominates"],
             ["Solid state drive (SSD)", "Electronic, flash cells",
              "50-100 microseconds", "No moving parts; limited write cycles"],
             ["Optical disc", "Mechanical, laser",
              "Around 100 milliseconds", "Removable, slow, archival"],
             ["Magnetic tape", "Sequential only",
              "Seconds to minutes to position", "Cheapest per byte; archival"]],
            caption="Auxiliary storage, and what distinguishes each.",
            footer="Tape survives because sequential streaming throughput is "
                   "excellent and cost per byte is unbeatable. For a backup "
                   "read once a decade, terrible latency costs nothing."),
        desc(
            "Disk access time has three components the examination asks "
            "about. SEEK TIME moves the head to the right track and dominates "
            "on random access. ROTATIONAL LATENCY waits for the sector to "
            "come round, averaging half a revolution. TRANSFER TIME is "
            "reading the data itself. On a 7,200 rpm disk one revolution "
            "takes 8.33 milliseconds, so average rotational latency is about "
            "4.17ms -- which is why sequential reads are so much faster than "
            "random ones."
        ),
    ]),

    ("RAID", [
        desc(
            "One disk is a single point of failure and a bandwidth limit. "
            "RAID combines several into an array that is faster, more "
            "reliable, or both."
        ),
        image(fig("raid-levels")),
        table(
            ["Level", "Technique", "Survives", "Usable capacity of n disks"],
            [["RAID 0", "Striping", "No failures", "All n"],
             ["RAID 1", "Mirroring", "One disk", "Half"],
             ["RAID 5", "Striping with distributed parity", "One disk",
              "n minus one"],
             ["RAID 6", "Striping with two parity blocks", "Two disks",
              "n minus two"],
             ["RAID 10", "Mirrored pairs, then striped", "One per pair",
              "Half"]],
            caption="The levels the syllabus names.",
            footer="RAID 0 is the trap: it has a number and no redundancy at "
                   "all, and its failure probability is WORSE than a single "
                   "disk because any one of the n failing loses everything."),
        desc(
            "Two points the examination returns to. First, RAID protects "
            "against DISK failure and nothing else -- it is not a backup, "
            "because it faithfully replicates a deletion, a corruption or an "
            "encryption by ransomware to every disk instantly. Second, RAID 5 "
            "carries a write penalty: changing one block requires reading the "
            "old data and parity and writing both back, so a write costs "
            "several disk operations."
        ),
    ]),

    ("Where Caching Appears Again", [
        desc(
            "The cache idea is not specific to processors. The same argument "
            "-- keep recently used things in something faster and smaller -- "
            "is applied at nearly every level of a system, and recognising "
            "the pattern makes several later lessons easier."
        ),
        table(
            ["Cache", "Sits between", "Holds", "What a miss costs"],
            [["CPU cache", "Processor and main memory", "Memory blocks",
              "Hundreds of cycles"],
             ["Translation lookaside buffer", "Processor and the page table",
              "Recent address translations", "An extra memory access"],
             ["Disk buffer cache", "Programs and the disk", "File blocks",
              "A disk access, milliseconds"],
             ["Database buffer pool", "Queries and the data files",
              "Table and index pages", "A disk access"],
             ["Web and DNS cache", "Client and a remote server",
              "Responses and lookups", "A network round trip"]],
            caption="One idea, applied at five different scales.",
            footer="Every row faces the same three questions: what to keep, "
                   "what to evict when full, and how to know when a cached "
                   "copy has gone stale."),
        desc(
            "That third question is the one processor caches largely escape "
            "and the others do not. A CPU cache's underlying memory changes "
            "only when the processor or a DMA transfer changes it, and the "
            "hardware tracks that. A cached web response or DNS record can "
            "become wrong without anybody telling the cache, which is why "
            "those caches carry expiry times and why cache invalidation is a "
            "genuinely hard problem rather than a joke about one."
        ),
    ]),

    ("Capacity Arithmetic", [
        desc(
            "Storage capacity questions are among the most predictable on the "
            "paper, and they turn on units that are deliberately ambiguous."
        ),
        table(
            ["Prefix", "Decimal meaning", "Binary meaning", "Difference"],
            [["Kilo / kibi", "10^3 = 1,000", "2^10 = 1,024", "2.4%"],
             ["Mega / mebi", "10^6", "2^20 = 1,048,576", "4.9%"],
             ["Giga / gibi", "10^9", "2^30", "7.4%"],
             ["Tera / tebi", "10^12", "2^40", "10.0%"]],
            caption="Two meanings for the same prefixes, diverging as they "
                    "grow.",
            footer="Drive manufacturers quote decimal and operating systems "
                   "often report binary, which is the entire explanation for "
                   "a '1 TB' disk showing as about 931 GB. Nothing is "
                   "missing."),
        desc(
            "The other recurring calculation is sizing uncompressed data, and "
            "it is always the same shape: multiply the quantity by the size "
            "of each item. An image of 1,024 by 768 pixels at 24 bits per "
            "pixel needs 1,024 x 768 x 3 bytes, which is 2,359,296 -- about "
            "2.25 MiB. A minute of CD audio needs 44,100 samples x 16 bits x "
            "2 channels x 60 seconds, which is about 10.6 MB."
        ),
        desc(
            "Work these in the units the question uses and convert only at "
            "the end. Converting part-way through is where the arithmetic "
            "goes wrong, and the examiner chooses the numbers so the final "
            "division is clean."
        ),
    ]),

    ("Memory Management by the Hardware", [
        desc(
            "Between the processor's addresses and the memory chips sits "
            "hardware that translates and protects. The operating system "
            "lesson covers the policy; the mechanism belongs here."
        ),
        ul([
            "The MEMORY MANAGEMENT UNIT translates the addresses a program "
            "uses into physical addresses, consulting a page table. Because "
            "it is in the path of every access, it has its own cache of "
            "recent translations -- the translation lookaside buffer -- "
            "without which every memory access would cost two.",
            "PROTECTION is enforced in the same step. Each translation "
            "carries permissions, so an attempt to write a read-only page or "
            "to reach another process's memory is refused by the hardware "
            "rather than trusted to the program.",
            "RELOCATION falls out of it for free. Because the program's "
            "addresses are translated, the same program can be loaded at any "
            "physical location without being rewritten, which is what makes "
            "multiprogramming practical.",
        ]),
        desc(
            "The point worth carrying is that memory protection is a HARDWARE "
            "guarantee. An operating system cannot enforce isolation between "
            "processes by checking addresses in software -- it would have to "
            "check every access, at ruinous cost. The MMU checks each one as "
            "a side effect of a translation it was performing anyway, which "
            "is why isolation is affordable."
        ),
    ]),

    ("Solid State Storage and Its Peculiarities", [
        desc(
            "An SSD is not simply a fast disk. Its underlying flash behaves "
            "differently enough that several of its properties surprise "
            "people, and the syllabus names them."
        ),
        compare_grid(
            "WHAT MAKES FLASH DIFFERENT",
            "Each of these follows from flash cells having to be erased in "
            "large blocks before they can be rewritten.",
            [("Asymmetric read and write",
              "Reads are fast and uniform; writes are slower, and a write to "
              "a partly used block may require reading, erasing and "
              "rewriting the whole block."),
             ("Write amplification",
              "One logical write can cause several physical writes because of "
              "that erase cycle -- so the drive wears faster than the write "
              "volume alone suggests."),
             ("Limited endurance",
              "Each cell tolerates a finite number of erase cycles. WEAR "
              "LEVELLING spreads writes across the whole drive so no small "
              "region is exhausted while the rest is untouched."),
             ("No seek penalty",
              "There is no head to move, so random access costs essentially "
              "the same as sequential -- which removes the reason many "
              "disk-era optimisations existed.")]),
        desc(
            "That last row has the widest consequences. A great deal of "
            "software design -- database index layout, file system placement, "
            "defragmentation -- exists to convert random access into "
            "sequential access on a mechanical disk. On flash the premise is "
            "gone, and defragmenting an SSD achieves nothing except consuming "
            "some of its finite write endurance."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where memory items are lost."),
        ul([
            "Confusing SRAM with DRAM. SRAM is faster and is used for cache; "
            "DRAM is denser, needs refreshing, and is used for main memory.",
            "Computing effective access time as an average of the two times "
            "rather than weighting by the hit ratio.",
            "Assuming a larger cache always helps. It fixes capacity misses "
            "and does nothing for conflict misses, which need associativity.",
            "Treating RAID as a backup. It replicates deletions and "
            "corruption faithfully and instantly.",
            "Forgetting that RAID 0 has no redundancy and is less reliable "
            "than one disk.",
            "Ignoring rotational latency in a disk access calculation, or "
            "using a full revolution instead of half.",
            "Expecting memory interleaving to help a program that does not "
            "access memory sequentially.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A system has a cache with a 3ns access time and main memory "
            "with a 60ns access time. The cache hit ratio is 90%. What is the "
            "effective memory access time?\""
        ),
        ol([
            "Identify the two terms. Hits are 90% at 3ns; misses are 10% at "
            "60ns.",
            "Weight each by its share: (0.9 x 3) + (0.1 x 60).",
            "That is 2.7 + 6.0 = 8.7 nanoseconds.",
            "Sanity check the shape: the answer must lie between 3 and 60, "
            "and much nearer 3 than 60 because most accesses hit. 8.7 fits.",
        ]),
        desc(
            "The distractors on such an item are predictable and worth "
            "recognising. 31.5 is the unweighted average of 3 and 60. 6.0 is "
            "the miss term alone. 63 adds the two access times as though a "
            "miss cost both. Each is one specific misunderstanding, and the "
            "sanity check in step four eliminates all three."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Memory decisions propagate a long way."),
        ul([
            "Virtual memory in the Operating System lesson extends the "
            "hierarchy onto disk with the same locality argument.",
            "Cache-friendly layout is why the Data Structures lesson's "
            "locality remark holds.",
            "Write-through and write-back reappear in disk controllers and "
            "database buffers.",
            "RAID reappears in System Configuration as a reliability "
            "technique and in Service Management as part of continuity "
            "planning.",
            "Disk seek and rotational latency reappear in Database as the "
            "reason indexes exist.",
            "The memory wall from the previous lesson is what this whole "
            "hierarchy answers.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results the examination expects immediately.",
            [("Effective access time",
              "(hit x cache time) + (miss x memory time)",
              "Weighted, never a plain average. Check the answer lies between "
              "the two times and nearer the faster one."),
             ("SRAM against DRAM",
              "Faster and dearer against denser and refreshed",
              "SRAM holds its value while powered; DRAM's capacitors leak and "
              "must be refreshed thousands of times a second."),
             ("The two kinds of locality",
              "Temporal: used again soon. Spatial: neighbours used soon",
              "Temporal justifies caching at all; spatial justifies fetching "
              "whole blocks rather than bytes."),
             ("Write-through against write-back",
              "Both immediately against cache now, memory later",
              "Write-back cuts memory traffic sharply and loses dirty lines "
              "on a power failure."),
             ("Average rotational latency",
              "Half a revolution",
              "At 7,200 rpm a revolution is 8.33ms, so the average wait is "
              "about 4.17ms -- before any transfer has begun."),
             ("What RAID does not protect against",
              "Deletion, corruption and ransomware",
              "It replicates all three instantly and faithfully. RAID is "
              "availability, not backup.")]),
    ]),
]

_mem_quiz = [
    mcq("AVERAGE",
        "Cache access takes 3ns, main memory access takes 60ns, and the cache "
        "hit ratio is 90%.\n\n"
        "What is the effective memory access time?",
        [("8.7 ns", True),
         ("31.5 ns", False),
         ("6.0 ns", False),
         ("63.0 ns", False)],
        "Weight each path by how often it is taken: (0.9 x 3) + (0.1 x 60) = "
        "2.7 + 6.0 = 8.7 ns. The value 31.5 is the unweighted average of the "
        "two times, which ignores that most accesses hit; 6.0 is the miss "
        "term on its own; and 63.0 adds both access times as though every "
        "miss also paid the cache time. A useful check is that the answer "
        "must lie between 3 and 60 and much closer to 3."),

    mcq("EASY",
        "Which characteristic distinguishes DRAM from SRAM?",
        [("DRAM retains data without power, while SRAM does not", False),
         ("DRAM requires periodic refreshing, while SRAM does not", True),
         ("DRAM is faster per access, while SRAM is denser", False),
         ("DRAM is used for cache, while SRAM is used for main memory",
          False)],
        "DRAM stores each bit as charge on a tiny capacitor, and that charge "
        "leaks away in milliseconds, so every row must be read and rewritten "
        "thousands of times a second -- the 'dynamic' in the name. SRAM uses "
        "flip-flops that hold their value as long as power is applied. Both "
        "are volatile; SRAM is faster and less dense, and the roles are the "
        "reverse of the last option: SRAM for cache, DRAM for main memory."),

    mcq("AVERAGE",
        "Two frequently accessed memory blocks map to the same cache line and "
        "repeatedly evict one another, while most of the cache sits "
        "unused.\n\n"
        "Which kind of miss is occurring, and what is the standard remedy?",
        [("A capacity miss, remedied by a larger cache", False),
         ("A conflict miss, remedied by higher associativity", True),
         ("A compulsory miss, remedied by prefetching", False),
         ("A capacity miss, remedied by a longer cache line", False)],
        "The cache has spare room, so capacity is not the constraint -- the "
        "problem is that the mapping gives these blocks only one possible "
        "line, which is a conflict miss. Raising associativity lets each "
        "block sit anywhere within a set, so both can be resident at once. "
        "This is exactly why direct-mapped caches are rare in practice. A "
        "compulsory miss is a first reference and cannot be avoided by "
        "layout."),

    mcq("AVERAGE",
        "Under a write-back cache policy, when is main memory updated?",
        [("Immediately on every write to the cache", False),
         ("When the modified cache line is evicted", True),
         ("At fixed intervals determined by the memory controller", False),
         ("Only when the processor explicitly flushes the cache", False)],
        "Write-back defers the memory update: the write goes to the cache, "
        "the line is marked dirty, and main memory is brought up to date only "
        "when that line is evicted to make room for another. This greatly "
        "reduces memory traffic where a location is written repeatedly, and "
        "it means a power failure loses every dirty line. Writing immediately "
        "to both is write-through, the other policy."),

    mcq("HARD",
        "Four disks are combined in a RAID 0 array.\n\n"
        "How does the array's reliability compare with that of a single "
        "disk?",
        [("Better, because data is spread across several disks", False),
         ("Worse, because any one disk failing loses all the data", True),
         ("Identical, because striping does not affect reliability", False),
         ("Better for reads and worse for writes", False)],
        "RAID 0 stripes data across the disks with no redundancy whatever, so "
        "every disk holds part of every file and the failure of any one "
        "destroys the array. With four disks there are four times as many "
        "components that can fail, making the array roughly four times more "
        "likely to fail than a single disk. RAID 0 buys speed and full "
        "capacity, and its number misleads people into assuming it offers "
        "protection."),

    mcq("EASY",
        "The observation that a memory location recently accessed is likely "
        "to be accessed again soon is known as what?",
        [("Spatial locality", False),
         ("Temporal locality", True),
         ("Memory interleaving", False),
         ("Write amplification", False)],
        "Temporal locality concerns time -- the same location being reused -- "
        "and it is what makes caching anything worthwhile at all. Spatial "
        "locality concerns nearby ADDRESSES being accessed soon, and it is "
        "why memory is fetched in blocks rather than single bytes. "
        "Interleaving is a bandwidth technique, and write amplification is a "
        "flash-memory effect."),

    mcq("AVERAGE",
        "A hard disk rotates at 7,200 revolutions per minute.\n\n"
        "What is its average rotational latency?",
        [("About 8.33 ms", False),
         ("About 4.17 ms", True),
         ("About 16.7 ms", False),
         ("About 2.08 ms", False)],
        "One revolution takes 60 / 7,200 seconds, which is 8.33 milliseconds. "
        "On average the required sector is half a revolution away, so the "
        "expected wait is about 4.17 ms. Answering 8.33 uses a full "
        "revolution rather than the average, and this latency is incurred "
        "AFTER the seek and before any data transfer begins -- which is why "
        "random access on a mechanical disk is so much slower than sequential "
        "access."),

    mcq("HARD",
        "An organisation runs its file server on a RAID 5 array and treats "
        "this as its data protection strategy.\n\n"
        "What is the principal flaw?",
        [("RAID 5 cannot survive a disk failure without downtime", False),
         ("RAID 5 replicates deletion and corruption as faithfully as it "
          "replicates valid data", True),
         ("RAID 5 arrays cannot be expanded once created", False),
         ("RAID 5 offers no performance benefit over a single disk", False)],
        "RAID protects against the failure of a DISK and against nothing "
        "else. A deleted file, a corrupted database or a ransomware "
        "encryption is written across the array instantly and correctly, "
        "because from the array's point of view those are simply valid "
        "writes. A backup exists to recover from a point in the past, which "
        "RAID cannot do at all. RAID 5 does survive one disk failing while "
        "remaining online, and it does improve read performance."),

    mcq("AVERAGE",
        "Memory is divided into banks so that consecutive addresses fall in "
        "different banks and their accesses can overlap.\n\n"
        "What does this technique improve, and for which access pattern?",
        [("Latency, for random access", False),
         ("Bandwidth, for sequential access", True),
         ("Capacity, for any access pattern", False),
         ("Reliability, for write-heavy workloads", False)],
        "Interleaving starts the next bank's access while the previous one is "
        "still completing, so more data moves per second even though no "
        "single access completes any sooner -- bandwidth improves and latency "
        "does not. The benefit depends on consecutive requests landing in "
        "different banks, which is what sequential access does; a program "
        "striding at exactly the bank interval hits one bank repeatedly and "
        "gains nothing."),

    mcq("HARD",
        "Raising a cache hit ratio from 95% to 99% is described as producing "
        "a disproportionately large speed-up.\n\n"
        "With a 2ns cache and a 100ns memory, why is this?",
        [("Because the cache access time falls as the hit ratio rises",
          False),
         ("Because the misses dominate the total time, and their share is "
          "cut fivefold", True),
         ("Because a higher hit ratio reduces the number of memory accesses "
          "the program makes", False),
         ("Because the effect is linear, so a 4% gain gives a 4% "
          "improvement", False)],
        "At 95% the effective time is (0.95 x 2) + (0.05 x 100) = 6.9ns, of "
        "which 5.0ns comes from the 5% that miss. At 99% it is (0.99 x 2) + "
        "(0.01 x 100) = 2.98ns. Cutting the miss rate from 5% to 1% removes "
        "four fifths of the term that dominated the total, so the effective "
        "time more than halves for a four-point change. The relationship is "
        "emphatically not linear, and neither access time nor the program's "
        "access count changes."),
]

LESSON_MEMORY = lesson(
    MAJOR, MIDDLE,
    "Memory: Hierarchy, Cache, Main Memory and Storage Devices",
    _mem_quiz,
    lesson_structure(
        "Memory: Hierarchy, Cache, Main Memory and Storage Devices",
        "No memory technology is fast, large and cheap at once, so a computer "
        "uses several at different points on that trade and arranges them so "
        "most accesses reach the fast ones. This lesson covers the hierarchy "
        "and the locality it bets on, the difference between the memory types "
        "the syllabus names, how a cache decides where a block may sit and "
        "how to compute what it saves, the two write policies and what each "
        "risks, and the auxiliary storage below -- including why a mechanical "
        "disk's seek and rotation dominate its access time, and why RAID "
        "protects against a failed disk and not against anything else.",
        [
            "Explain the memory hierarchy and the two forms of locality it "
            "depends on",
            "Distinguish SRAM, DRAM, ROM and flash by their properties and "
            "uses",
            "Compare direct-mapped, fully associative and set-associative "
            "caches",
            "Compute an effective access time from a hit ratio",
            "Identify compulsory, capacity and conflict misses and their "
            "remedies",
            "Compare write-through with write-back and state what each risks",
            "Compute the components of a disk access time",
            "Compare the RAID levels on capacity, survival and write cost",
        ],
        75,
        _mem_sections,
        [
            ("Memory hierarchy",
             "Levels of storage arranged fastest and smallest at the top to "
             "slowest and largest at the bottom, each roughly ten times "
             "slower, larger and cheaper per byte than the one above."),
            ("Temporal locality",
             "The tendency of a recently accessed location to be accessed "
             "again soon. What makes caching worthwhile at all."),
            ("Spatial locality",
             "The tendency of locations near a recently accessed one to be "
             "accessed soon. Why memory moves in blocks rather than bytes."),
            ("SRAM",
             "Static RAM, built from flip-flops. Fast, expensive and less "
             "dense; holds its value while powered, with no refresh. Used for "
             "cache."),
            ("DRAM",
             "Dynamic RAM, one transistor and capacitor per bit. Dense and "
             "cheap; its charge leaks, so it must be refreshed thousands of "
             "times a second. Used for main memory."),
            ("Cache line (block)",
             "The fixed-size unit moved between cache and memory, typically "
             "64 bytes. Fetching a whole line exploits spatial locality."),
            ("Hit ratio",
             "The proportion of accesses served by the cache. Effective "
             "access time is (hit ratio x cache time) + (miss ratio x memory "
             "time)."),
            ("Direct mapping",
             "Each memory block has exactly one possible cache line. Fastest "
             "lookup, and prone to conflict misses."),
            ("Set-associative mapping",
             "The address selects a set and the block sits anywhere within "
             "it. The compromise every real cache uses."),
            ("Compulsory miss",
             "The first reference to a block, unavoidable except by "
             "prefetching."),
            ("Capacity miss",
             "A miss because the working set exceeds the cache. Remedied by a "
             "larger cache."),
            ("Conflict miss",
             "A miss because blocks contended for the same line or set "
             "despite spare room elsewhere. Remedied by higher "
             "associativity."),
            ("Write-through",
             "Writing to cache and main memory together. Consistent and "
             "bandwidth-hungry."),
            ("Write-back",
             "Writing to cache only and updating memory on eviction. Far less "
             "traffic, and dirty lines are lost on a power failure."),
            ("Memory interleaving",
             "Dividing memory into banks whose accesses overlap, raising "
             "bandwidth for sequential access without reducing latency."),
            ("Seek time and rotational latency",
             "Moving the head to the track, and waiting for the sector to "
             "arrive -- averaging half a revolution. Together they dominate "
             "random access on a mechanical disk."),
            ("RAID",
             "Combining disks for speed, redundancy or both. RAID 0 stripes "
             "with no redundancy; 1 mirrors; 5 stripes with distributed "
             "parity and survives one failure; 6 survives two."),
        ],
        "The memory hierarchy exists because nothing is fast, large and cheap "
        "at once, and it works only because real programs show locality -- "
        "reusing what they just touched, and touching what sits beside it. "
        "SRAM is fast and sparse and serves as cache; DRAM is dense and cheap "
        "and must be refreshed because its charge leaks; ROM and flash keep "
        "their contents without power. A cache holds fixed-size lines and "
        "decides where a block may sit, with set-associative mapping the "
        "universal compromise between a direct map that thrashes and full "
        "associativity that does not scale. Its value is computed as a "
        "weighted effective access time, and the arithmetic reveals the point "
        "worth carrying: at a 95% hit ratio the missing 5% consume most of "
        "the total time, so small improvements in hit ratio produce large "
        "improvements in speed. Misses divide into compulsory, capacity and "
        "conflict, each with its own remedy, and writes divide into "
        "write-through, which is consistent and costly in bandwidth, and "
        "write-back, which is cheap and loses dirty lines on a power failure. "
        "Below main memory, mechanical disks are dominated by seek time and "
        "by a rotational latency averaging half a revolution, which is the "
        "whole reason sequential access outperforms random. And RAID combines "
        "disks for speed and survival -- with RAID 0 offering neither "
        "redundancy nor even the reliability of a single disk, and every "
        "level alike offering no protection at all against a deletion, a "
        "corruption or a ransomware encryption, each of which it replicates "
        "instantly and faithfully.",
        exam_notes=[
            desc(
                "Memory is one of the most calculable topics on Subject A, "
                "and its arithmetic is small enough to be done reliably by "
                "hand."
            ),
            ul([
                "Computing an effective access time from a hit ratio.",
                "Distinguishing SRAM from DRAM by a stated property.",
                "Classifying a described cache miss and naming its remedy.",
                "Comparing write-through with write-back.",
                "Computing rotational latency or a total disk access time.",
                "Comparing RAID levels on capacity and on what each "
                "survives.",
                "Identifying temporal or spatial locality from a described "
                "access pattern.",
            ]),
            desc(
                "On any effective-access-time item, check that your answer "
                "lies between the two access times and nearer the faster one. "
                "Every standard distractor -- the unweighted average, the "
                "miss term alone, the sum of both -- fails that check."
            ),
        ],
    ))

LESSONS = [LESSON_MEMORY]

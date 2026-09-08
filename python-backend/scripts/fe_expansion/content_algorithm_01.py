"""Basic Theory -> Algorithm and Programming, lessons 1 and 2.

Syllabus minor categories 1 (data structure) and 2 (algorithm).

These two carry more weight than anything else in the certification. Subject B
is twenty long items in a hundred minutes and is dominated by
algorithm-and-programming questions built on pseudocode the candidate must
trace, so a learner who cannot follow an array index or a loop invariant
cannot pass, whatever else they know. Everything here is therefore taught by
being traced rather than described.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Basic Theory"
MIDDLE = "Algorithm and Programming"

# ==========================================================================
# Lesson 1: Data structures
# ==========================================================================

_ds_sections = [
    ("Why the Structure Decides the Speed", [
        desc(
            "A data structure is an arrangement of data chosen so that the "
            "operations you perform most often are cheap. That is the whole "
            "idea, and it is worth stating plainly because it explains why "
            "there are so many of them: no single arrangement makes "
            "everything cheap, so each one trades some operations away to "
            "make others fast."
        ),
        desc(
            "The consequence is that choosing a structure is choosing which "
            "operations you are willing to make slow. A program that looks up "
            "records by key thousands of times a second and inserts one an "
            "hour wants a completely different structure from one that "
            "appends constantly and reads in order. Getting this wrong does "
            "not produce a bug; it produces a system that works perfectly in "
            "testing and collapses at production volume."
        ),
        table(
            ["Structure", "Find by position", "Find by value", "Insert",
             "Ordered?"],
            [["Array", "Instant", "Scan every element", "Costly in the middle",
              "By position"],
             ["Sorted array", "Instant", "Halve repeatedly",
              "Costly -- shifts elements", "Yes"],
             ["Linked list", "Walk from the start", "Walk from the start",
              "Cheap anywhere", "By links"],
             ["Binary search tree", "Not directly", "Halve repeatedly",
              "Cheap, if balanced", "Yes"],
             ["Hash table", "Not directly", "Usually one step",
              "Usually cheap", "No"]],
            caption="What each structure makes cheap, and what it makes "
                    "expensive.",
            footer="Read the last column carefully. A hash table gives the "
                   "fastest lookup of anything here and cannot produce its "
                   "contents in order at all, which is why it is the wrong "
                   "choice for a leaderboard however fast it is."),
    ]),

    ("Arrays", [
        desc(
            "An array is a fixed number of elements of the same type stored "
            "in one contiguous block of memory. Because the elements are the "
            "same size and adjacent, the address of element i is the address "
            "of the first element plus i times the element size -- an "
            "arithmetic calculation, not a search."
        ),
        desc(
            "That single fact is why array access is instant regardless of "
            "the array's size, and it is also the source of every other "
            "property arrays have. Contiguity is what makes insertion in the "
            "middle expensive: there is no gap, so everything after the "
            "insertion point must shift up by one to make room."
        ),
        content_accordion(
            "WHAT THE EXAMINATION ASKS ABOUT ARRAYS",
            "Almost all of it is index arithmetic, and almost all of the lost "
            "marks are off-by-one errors.",
            [("Zero-based versus one-based indexing",
              "Most languages number the first element 0, so an array of n "
              "elements has valid indices 0 to n-1 and the LAST index is "
              "n-1, not n. FE pseudocode has used both conventions, so the "
              "question will state which it means -- read that line before "
              "tracing anything."),
             ("Two-dimensional arrays",
              "A grid, addressed by row and column. Stored either row by row "
              "(row-major) or column by column (column-major), which matters "
              "because traversing against the storage order is dramatically "
              "slower on real hardware. The element at row i, column j of an "
              "m-column row-major array sits at offset i x m + j."),
             ("Bounds",
              "An index outside the valid range reads or writes memory that "
              "belongs to something else. Some languages check and raise an "
              "error; others do not and simply corrupt whatever is there, "
              "which is the root of a whole class of security "
              "vulnerabilities covered in the Security lessons."),
             ("Why a fixed size is not always a limitation",
              "A dynamic array keeps a larger block than it needs and "
              "reallocates when it fills, typically doubling. Each "
              "reallocation copies everything, but doubling makes those "
              "copies rare enough that the average cost per append stays "
              "small.")]),
    ]),

    ("Linked Lists", [
        desc(
            "A linked list stores each element in a node that also holds the "
            "address of the next node. The nodes need not be adjacent in "
            "memory, and that is the entire difference from an array -- every "
            "other property follows from it."
        ),
        image(fig("array-vs-list")),
        desc(
            "Because nodes are found by following links rather than by "
            "arithmetic, reaching the nth element means walking n links: "
            "there is no shortcut. But because nothing needs to be adjacent, "
            "inserting an element is simply making the previous node point to "
            "the new one and the new one point to what came next -- two "
            "assignments, regardless of where in the list it happens or how "
            "long the list is."
        ),
        content_tabs(
            "THREE FORMS OF LINKED LIST",
            "Each adds a link, and each buys a specific capability with the "
            "memory that link costs.",
            [("Singly linked", "Each node points forward only",
              "The simplest and smallest. You can traverse in one direction, "
              "and deleting a node requires a reference to the one BEFORE it "
              "-- which is why deletion routines usually track two pointers, "
              "current and previous."),
             ("Doubly linked", "Each node points forward and back",
              "Traversal in both directions, and deletion given only the node "
              "itself, because its predecessor is reachable. Costs one extra "
              "pointer per node and one more assignment per update -- and "
              "one more chance to leave the two directions inconsistent."),
             ("Circular", "The last node points back to the first",
              "No end to fall off, so a traversal continues indefinitely. "
              "Suits round-robin scheduling and buffers that wrap. The "
              "hazard is the obvious one: a loop looking for a null "
              "terminator never finds one.")]),
    ]),

    ("Stacks and Queues", [
        desc(
            "A stack and a queue are not really new arrangements of data -- "
            "either can be built on an array or a linked list. What defines "
            "them is a RESTRICTION on where elements may be added and "
            "removed, and that restriction is what makes them useful."
        ),
        image(fig("stack-queue")),
        desc(
            "A STACK is last-in, first-out. Items are pushed onto the top and "
            "popped from the top, so the most recently added is the first to "
            "leave. This models nesting: the innermost thing started is the "
            "first thing that must finish. Function calls, undo history, "
            "bracket matching and expression evaluation are all stacks."
        ),
        desc(
            "A QUEUE is first-in, first-out. Items are added at the rear and "
            "removed from the front, so the oldest leaves first. This models "
            "waiting and fairness: print jobs, message buffers, request "
            "handling, and the breadth-first traversal in the next lesson."
        ),
        compare_grid(
            "TWO VARIANTS WORTH KNOWING",
            "Each relaxes one part of the queue's rule for a specific reason.",
            [("Circular queue (ring buffer)",
              "A fixed array whose front and rear indices wrap around to the "
              "beginning. Reuses space that a plain array queue would leak as "
              "the front advances, which is why it is the standard structure "
              "for a hardware or network buffer."),
             ("Priority queue",
              "Removal takes the highest-priority item rather than the "
              "oldest. No longer FIFO, and usually built on a heap. It is "
              "what an operating system scheduler and Dijkstra's algorithm "
              "both need.")]),
        desc(
            "The examination's favourite stack question gives a sequence of "
            "pushes and pops and asks what is left, or what comes off. Trace "
            "it by writing the stack down after every single operation -- "
            "left to right with the top marked. Holding it in your head is "
            "where the marks go."
        ),
    ]),

    ("Trees", [
        desc(
            "A tree is a hierarchy: one root, and every other node with "
            "exactly one parent. It models anything nested -- a file system, "
            "an organisation chart, a parsed expression, a decision "
            "procedure."
        ),
        image(fig("tree-anatomy")),
        table(
            ["Term", "Meaning"],
            [["Root", "The single node with no parent"],
             ["Leaf", "A node with no children"],
             ["Internal node", "A node with at least one child"],
             ["Depth of a node", "The number of edges from the root to it"],
             ["Height of the tree", "The depth of its deepest leaf"],
             ["Subtree", "A node together with all its descendants"],
             ["Degree", "The number of children a node has"]],
            caption="The vocabulary the examination uses without explaining.",
            footer="Depth is counted downward from the root and height "
                   "upward from the leaves, which is why the two are so "
                   "easily swapped under time pressure."),
        desc(
            "A BINARY tree limits each node to at most two children. That "
            "restriction seems arbitrary until you see what it buys: a binary "
            "tree of height h can hold up to 2^(h+1) - 1 nodes, so the number "
            "of nodes grows exponentially with depth. A balanced binary tree "
            "holding a million items is about twenty levels deep, which is "
            "why twenty comparisons can find any one of them."
        ),
    ]),

    ("Binary Search Trees", [
        desc(
            "A binary search tree adds one ordering rule to a binary tree: "
            "everything in a node's left subtree is smaller than the node, "
            "and everything in its right subtree is larger. One rule, and it "
            "makes searching almost free."
        ),
        image(fig("bst-search")),
        desc(
            "Searching compares the target with the current node and moves "
            "left or right accordingly, discarding an entire subtree at every "
            "step. If the tree is balanced, each step halves what remains, so "
            "the search takes about log n comparisons -- the same behaviour "
            "as binary search on a sorted array, but with cheap insertion."
        ),
        desc(
            "The words 'if the tree is balanced' carry the whole caveat. "
            "Inserting already-sorted data into a plain binary search tree "
            "produces a tree where every node has only a right child -- which "
            "is a linked list wearing a tree's clothing, and searching it "
            "takes n steps rather than log n. This is not a rare edge case: "
            "loading records in id order does it."
        ),
        content_accordion(
            "TRAVERSING A TREE",
            "Three orderings, distinguished only by WHEN the node itself is "
            "visited relative to its subtrees. Examination items give a tree "
            "and ask for the output sequence.",
            [("In-order: left, node, right",
              "Visit the whole left subtree, then the node, then the whole "
              "right subtree. On a binary search tree this emits the values "
              "in SORTED order, which is both the most useful property and "
              "the most examined one."),
             ("Pre-order: node, left, right",
              "Visit the node before its subtrees. Produces a sequence from "
              "which the tree can be rebuilt, so it is what serialisation "
              "and copying use."),
             ("Post-order: left, right, node",
              "Visit the node after both subtrees. Used where children must "
              "be handled before their parent -- freeing memory, deleting a "
              "directory tree, or evaluating an expression tree bottom-up."),
             ("Level-order (breadth-first)",
              "Visit every node at depth 0, then every node at depth 1, and "
              "so on. Unlike the other three it is not naturally recursive; "
              "it is implemented with a QUEUE, which is the clearest example "
              "of why queues matter.")]),
    ]),

    ("Hash Tables", [
        desc(
            "A hash table computes a storage position directly from the key. "
            "A hash function turns the key into a number, that number selects "
            "a bucket, and the entry is found there -- no searching, no "
            "comparisons along the way."
        ),
        image(fig("hash-collision")),
        desc(
            "The result is lookup that does not slow down as the table grows, "
            "which no comparison-based structure can offer. It is why hash "
            "tables underlie dictionaries, caches, symbol tables, database "
            "indexes and routing tables."
        ),
        desc(
            "The complication is collisions. There are always more possible "
            "keys than buckets, so two keys will eventually hash to the same "
            "place, and this is a mathematical certainty rather than a sign "
            "of a poor hash function. Two strategies handle it."
        ),
        table(
            ["", "Chaining", "Open addressing"],
            [["What a bucket holds", "A list of all entries hashing there",
              "At most one entry"],
             ["On collision", "Append to that bucket's list",
              "Probe for the next free slot"],
             ["Extra memory", "Pointers for the lists", "None beyond the table"],
             ["Behaviour when full", "Lists lengthen gradually",
              "Degrades sharply as it approaches full"],
             ["Deletion", "Straightforward",
              "Awkward -- needs a tombstone marker"]],
            caption="Two ways to handle two keys landing in the same bucket.",
            footer="Both degrade towards a linear scan as the load factor "
                   "rises, which is why a hash table is resized and rehashed "
                   "well before it fills."),
        desc(
            "A good hash function distributes keys evenly across the buckets. "
            "A poor one -- hashing on a field where most records share a "
            "value, say -- puts everything in a few buckets, and the table's "
            "performance collapses to that of a linked list while still "
            "looking like a hash table in the code."
        ),
    ]),

    ("Choosing a Structure", [
        desc(
            "The examination poses this as a scenario: here is what the "
            "program does most often, which structure suits it? The "
            "reasoning is always the same -- name the dominant operation, "
            "then pick the structure that makes it cheap."
        ),
        table(
            ["The program mostly...", "Use", "Because"],
            [["Reads by numeric position", "Array",
              "Position arithmetic is instant"],
             ["Looks up by key", "Hash table",
              "The key computes its own location"],
             ["Needs items in sorted order", "Balanced tree or sorted array",
              "A hash table has no order at all"],
             ["Inserts and deletes constantly", "Linked list",
              "Rewiring beats shifting"],
             ["Handles the newest item first", "Stack",
              "LIFO is the requirement"],
             ["Handles the oldest item first", "Queue",
              "FIFO is the requirement"],
             ["Always needs the most urgent item", "Priority queue",
              "Order of arrival is irrelevant"]],
            caption="Match the dominant operation to the structure.",
            footer="When two operations compete, count them. A structure "
                   "read a thousand times per write should be optimised for "
                   "reading, however awkward that makes the writes."),
    ]),

    ("Two-Dimensional Arrays and Index Arithmetic", [
        desc(
            "A two-dimensional array is a grid addressed by row and column, "
            "and it is one of the few places the examination asks for genuine "
            "arithmetic rather than reasoning."
        ),
        desc(
            "Memory is one-dimensional, so the grid has to be flattened. "
            "ROW-MAJOR order stores each complete row before the next, which "
            "is what C, Java and Python use. COLUMN-MAJOR stores each "
            "complete column first, which is what Fortran and MATLAB use. For "
            "a row-major array with m columns, the element at row i, column j "
            "sits at offset i x m + j from the start, counting both from "
            "zero."
        ),
        table(
            ["Array", "Element", "Row-major offset", "Column-major offset"],
            [["3 rows x 4 columns", "row 0, col 0", "0", "0"],
             ["3 rows x 4 columns", "row 1, col 2", "1 x 4 + 2 = 6",
              "2 x 3 + 1 = 7"],
             ["3 rows x 4 columns", "row 2, col 3", "2 x 4 + 3 = 11",
              "3 x 3 + 2 = 11"],
             ["m rows x n columns", "row i, col j", "i x n + j",
              "j x m + i"]],
            caption="Where an element actually lives, under each storage "
                    "order.",
            footer="The two agree only at the corners, which is why a "
                   "wrong assumption about storage order produces output "
                   "that looks nearly right."),
        desc(
            "There is a performance consequence worth knowing beyond the "
            "arithmetic. Traversing a row-major array row by row reads memory "
            "sequentially, which the processor's cache is built for; "
            "traversing it column by column jumps a whole row between "
            "accesses and defeats the cache entirely. The same loops in the "
            "other order can run several times slower on identical data, "
            "which is a favourite illustration in the Memory lesson."
        ),
    ]),

    ("Heaps", [
        desc(
            "A heap is a binary tree with one property: every node is at "
            "least as large as both of its children, in a max-heap, or at "
            "most as large, in a min-heap. That is a much weaker rule than a "
            "binary search tree's, and the weakness is deliberate."
        ),
        compare_grid(
            "WHY A WEAKER RULE IS USEFUL",
            "A heap does not order its elements fully -- it only guarantees "
            "where the extreme one is.",
            [("What it guarantees",
              "The largest (or smallest) element is always at the root, "
              "reachable instantly. Nothing is promised about the ordering "
              "between siblings."),
             ("What that buys",
              "Insertion and removal of the extreme element both cost about "
              "log n, and the tree stays balanced automatically because it is "
              "always filled level by level."),
             ("Where it is used",
              "Priority queues, and therefore operating system schedulers, "
              "Dijkstra's shortest path, and event simulation."),
             ("How it is stored",
              "Usually in a plain array, not with pointers. The children of "
              "index i sit at 2i+1 and 2i+2, so the tree structure is "
              "arithmetic and costs no memory at all.")]),
        desc(
            "That last point is the elegant one. Because a heap is always "
            "complete -- filled left to right, level by level -- it can be "
            "packed into an array with no gaps and no pointers, and the "
            "parent-child relationships computed from the indices. Heap sort "
            "exploits exactly this to sort in place with no extra memory."
        ),
    ]),

    ("Graphs as a Data Structure", [
        desc(
            "A tree insists that every node has exactly one parent. Remove "
            "that restriction and you have a graph: any node may connect to "
            "any other, cycles are permitted, and there need be no root. Most "
            "real relationships are graphs rather than trees."
        ),
        table(
            ["", "Adjacency matrix", "Adjacency list"],
            [["Storage", "An n x n grid of yes/no or weights",
              "Each vertex's neighbours in a list"],
             ["Space used", "Always n squared", "Proportional to the edges"],
             ["\"Is there an edge i to j?\"", "Instant", "Scan i's list"],
             ["\"List i's neighbours\"", "Scan a whole row of n",
              "Read the list directly"],
             ["Best for", "Dense graphs, or many edge lookups",
              "Sparse graphs, which is nearly all real ones"]],
            caption="Two ways to store the same graph.",
            footer="A network of 10,000 devices each connected to a handful "
                   "of others needs 100 million matrix cells and a few tens "
                   "of thousands of list entries, which is why routing tables "
                   "are lists."),
        desc(
            "Two traversals matter, and they differ only in the structure "
            "holding the nodes still to visit. DEPTH-FIRST search uses a "
            "STACK and follows one path as far as it goes before backing up, "
            "which suits exhaustive exploration and cycle detection. "
            "BREADTH-FIRST search uses a QUEUE and visits everything one hop "
            "away before anything two hops away, which is why it finds the "
            "shortest path in an unweighted graph."
        ),
        desc(
            "That symmetry is worth holding onto: swap the stack for a queue "
            "in the same traversal code and depth-first becomes breadth-"
            "first. It is the clearest demonstration in the syllabus that "
            "choosing a data structure is choosing a behaviour."
        ),
    ]),

    ("Memory, Locality and Why Theory Is Not the Whole Story", [
        desc(
            "Complexity analysis counts operations and treats every memory "
            "access as equally cheap. Real hardware does not, and the gap "
            "occasionally reverses a conclusion that looked settled."
        ),
        desc(
            "A processor reads memory in blocks into a cache, and an access "
            "to data already cached is roughly a hundred times faster than "
            "one that is not. Contiguous structures benefit enormously: "
            "walking an array pulls in each block once and uses every element "
            "in it. A linked list scatters its nodes across memory, so each "
            "step may cost a fresh fetch even though the operation count is "
            "identical."
        ),
        ul([
            "An array is often faster than a linked list for insertion at "
            "moderate sizes, despite the shifting, because the shift is a "
            "sequential block copy and the list's traversal is not.",
            "Traversing a two-dimensional array against its storage order can "
            "cost several times more than traversing with it, for exactly "
            "the same operation count.",
            "A hash table's constant-time promise assumes the bucket is "
            "cached; on a large table scattered across memory the constant is "
            "not small.",
        ]),
        desc(
            "None of this invalidates complexity analysis -- an O(n^2) "
            "algorithm still loses to an O(n log n) one at scale, whatever "
            "the cache does. It qualifies it at the sizes where the orders "
            "are close, and it explains measurements that otherwise look "
            "impossible. The discipline is to reason with complexity and then "
            "MEASURE, rather than to pick one and trust it."
        ),
    ]),

    ("Common Mistakes", [
        desc("The errors that cost marks on data-structure items."),
        ul([
            "Reading the last index of an n-element zero-based array as n "
            "rather than n-1.",
            "Assuming a hash table can produce its contents in order. It has "
            "no order.",
            "Expecting a binary search tree to stay balanced. Inserting "
            "sorted data degrades it into a linked list.",
            "Confusing depth, counted from the root, with height, counted to "
            "the deepest leaf.",
            "Mixing up in-order and pre-order traversal. In-order visits the "
            "node BETWEEN its two subtrees, which is what sorts a BST.",
            "Tracing a stack or queue mentally. Write the contents down after "
            "every operation.",
            "Treating a collision as a bug. Collisions are certain; how they "
            "are handled is the design decision.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"Values are pushed onto and popped from an initially empty "
            "stack in this order: push 3, push 7, pop, push 1, push 9, pop, "
            "pop, push 4. What value is at the top of the stack at the end?\""
        ),
        ol([
            "push 3. Stack (top on the right): 3",
            "push 7. Stack: 3, 7",
            "pop. Removes 7, the most recent. Stack: 3",
            "push 1. Stack: 3, 1",
            "push 9. Stack: 3, 1, 9",
            "pop. Removes 9. Stack: 3, 1",
            "pop. Removes 1. Stack: 3",
            "push 4. Stack: 3, 4 -- so the top is 4.",
        ]),
        desc(
            "Eight lines of arithmetic-free work, and it is nearly impossible "
            "to get wrong once written down and nearly impossible to get "
            "right consistently in your head. The same discipline is what "
            "Subject B rewards, where the traces are longer and the "
            "distractors are built from the values you would reach by "
            "slipping one step."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Data structures underpin more of the certification than any "
             "other single topic."),
        ul([
            "The call stack in the next lesson's recursion, and in the "
            "Processor lesson, is a stack.",
            "A database index is a B-tree, a balanced tree generalised to "
            "many children per node.",
            "A routing table and an ARP cache are hash tables.",
            "Breadth-first traversal with a queue is how a network discovers "
            "topology.",
            "Buffer overflow in the Security lessons is an array bounds "
            "failure.",
            "Subject B pseudocode is overwhelmingly array and list "
            "manipulation.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six facts that must be immediate.",
            [("Array against linked list",
              "Instant read, costly insert; costly read, cheap insert",
              "An array computes an element's address; a list walks to it. "
              "Everything else about them follows from contiguity."),
             ("Stack and queue orderings",
              "LIFO and FIFO",
              "A stack models nesting -- call frames, undo. A queue models "
              "waiting -- buffers, breadth-first traversal."),
             ("In-order traversal of a BST",
              "Emits the values in sorted order",
              "Left, node, right. Pre-order visits the node first and "
              "rebuilds the tree; post-order visits it last and frees it."),
             ("What breaks a binary search tree",
              "Inserting sorted data",
              "It degenerates to a linked list, and search goes from log n "
              "to n. Balancing is what prevents it."),
             ("Why hash collisions happen",
              "More possible keys than buckets",
              "Certain, not a defect. Chaining keeps a list per bucket; open "
              "addressing probes for the next free slot."),
             ("The one thing a hash table cannot do",
              "Return its contents in order",
              "The hash deliberately scatters keys. Ordered output needs a "
              "tree or a sorted array.")]),
    ]),
]

_ds_quiz = [
    mcq("EASY",
        "Elements are added to and removed from a structure such that the "
        "most recently added element is always the first one removed.\n\n"
        "Which structure behaves this way?",
        [("A queue", False),
         ("A stack", True),
         ("A binary search tree", False),
         ("A hash table", False)],
        "Last in, first out is the defining rule of a stack, which is why it "
        "models nesting: function calls, undo history, bracket matching. A "
        "queue is the opposite, first in first out. A binary search tree "
        "orders by value rather than by arrival, and a hash table imposes no "
        "ordering on removal at all."),

    mcq("EASY",
        "Values are pushed onto and popped from an initially empty stack in "
        "this order: push 5, push 8, push 2, pop, push 6, pop.\n\n"
        "Which value is on top of the stack afterwards?",
        [("2", False),
         ("6", False),
         ("8", True),
         ("5", False)],
        "Trace it: 5, then 5 8, then 5 8 2, then pop removes 2 leaving 5 8, "
        "then push 6 gives 5 8 6, then pop removes 6 leaving 5 8. The top is "
        "8. Answering 6 or 2 comes from losing track of which pop removed "
        "which value, which is exactly why the contents should be written "
        "down after every operation rather than held in mind."),

    mcq("AVERAGE",
        "Compared with an array holding the same sequence, what does a "
        "singly linked list make cheaper, and what does it make more "
        "expensive?",
        [("Cheaper to read element n; more expensive to insert in the middle",
          False),
         ("Cheaper to insert in the middle; more expensive to read element n",
          True),
         ("Cheaper for both operations, at the cost of extra memory", False),
         ("More expensive for both, but it can grow without limit", False)],
        "An array computes an element's address arithmetically from its "
        "index, so reading element n is instant, while inserting in the "
        "middle must shift everything after it. A linked list reverses both: "
        "reaching element n means walking n links, but inserting is two "
        "pointer assignments wherever it happens. The pointers do cost memory, "
        "but the read cost is a real loss rather than a free lunch."),

    mcq("AVERAGE",
        "Records are inserted into an initially empty binary search tree in "
        "ascending key order.\n\n"
        "What is the effect on search performance?",
        [("Search stays logarithmic, since the ordering rule is preserved.",
          False),
         ("Search improves, because the tree is built in a predictable "
          "order.", False),
         ("Search degrades to linear, because the tree becomes a chain.",
          True),
         ("The insertions are rejected, since duplicate paths are not "
          "allowed.", False)],
        "Every new key is larger than all existing keys, so it becomes the "
        "right child of the rightmost node. The tree has no left branches at "
        "all -- structurally a linked list -- and searching it must walk "
        "every node, giving linear rather than logarithmic time. The ordering "
        "rule is still satisfied, which is why nothing is rejected and why "
        "the fault is invisible until the data volume exposes it. Self-"
        "balancing trees exist precisely for this case."),

    mcq("AVERAGE",
        "Which traversal of a binary search tree produces its values in "
        "ascending sorted order?",
        [("Pre-order", False),
         ("In-order", True),
         ("Post-order", False),
         ("Level-order", False)],
        "In-order visits the entire left subtree, then the node, then the "
        "entire right subtree. Because a binary search tree holds smaller "
        "values on the left and larger on the right, this emits every value "
        "in ascending order. Pre-order visits the node before its subtrees "
        "and is used for serialising the structure; post-order visits it "
        "afterwards and is used for freeing it; level-order works down by "
        "depth using a queue."),

    mcq("HARD",
        "Two different keys in a hash table produce the same hash value and "
        "therefore map to the same bucket.\n\n"
        "How should this be understood?",
        [("As a defect in the hash function that a better one would "
          "eliminate", False),
         ("As an unavoidable event that the table's design must handle",
          True),
         ("As a sign the table is full and must be resized immediately",
          False),
         ("As data corruption, since two keys cannot share a location", False)],
        "The key space is larger than the bucket space, so by the pigeonhole "
        "principle collisions are certain no matter how good the hash "
        "function is. A good function only spreads keys evenly and makes them "
        "rare. Handling them is a design decision: chaining keeps a list per "
        "bucket, and open addressing probes for the next free slot. Nothing "
        "is corrupted, and the table need not be full."),

    mcq("AVERAGE",
        "An application must retrieve records by a unique identifier as fast "
        "as possible, and never needs to list them in order.\n\n"
        "Which structure is most appropriate?",
        [("A sorted array searched by halving", False),
         ("A doubly linked list", False),
         ("A balanced binary search tree", False),
         ("A hash table", True)],
        "A hash table computes the storage location directly from the key, so "
        "lookup takes roughly constant time regardless of how many records "
        "there are -- faster than the logarithmic time a sorted array or "
        "balanced tree gives. Its inability to return records in order costs "
        "nothing here, since the requirement explicitly rules that out. A "
        "linked list would have to be walked from the beginning."),

    mcq("HARD",
        "A fixed-size array is used as a queue, with a front index that "
        "advances as items are removed and a rear index that advances as "
        "items are added.\n\n"
        "What problem does a circular queue solve in this design?",
        [("It prevents two items being added at the same position.", False),
         ("It allows items to be removed from either end of the queue.",
          False),
         ("It reclaims the space left behind the advancing front index.",
          True),
         ("It guarantees items are removed in priority order.", False)],
        "In a plain array queue both indices only ever move forward, so the "
        "space in front of the front index is abandoned and the queue reports "
        "itself full while most of the array is unused. A circular queue wraps "
        "both indices back to the beginning, reusing that space -- which is "
        "why it is the standard structure for a fixed hardware or network "
        "buffer. Removal from both ends is a deque, and priority ordering is a "
        "priority queue; neither is what circularity provides."),

    mcq("AVERAGE",
        "In a binary tree, what is the difference between the depth of a node "
        "and the height of the tree?",
        [("Depth counts edges from the root to the node; height is the depth "
          "of the deepest leaf.", True),
         ("Depth counts edges from the node to its deepest leaf; height "
          "counts them from the root.", False),
         ("Depth counts a node's children; height counts its descendants.",
          False),
         ("They are the same measurement expressed from opposite ends.",
          False)],
        "Depth is measured downward from the root and belongs to a particular "
        "node; height is measured to the deepest leaf and describes the whole "
        "tree, which is the same as the greatest depth of any node. They are "
        "genuinely different quantities rather than two views of one, and "
        "swapping them is among the most common slips on tree questions."),

    mcq("HARD",
        "A program appends to a collection constantly and reads it back only "
        "as a complete sequence from beginning to end, never by position.\n\n"
        "Which consideration argues AGAINST using a fixed-size array here?",
        [("Reading the sequence in order is slower on an array than on a "
          "linked list.", False),
         ("The array must be resized and copied whenever it fills.", True),
         ("Appending to an array requires shifting the existing elements.",
          False),
         ("An array cannot store elements of the same type efficiently.",
          False)],
        "A fixed-size array has no room to grow, so each time it fills it must "
        "be reallocated larger and every element copied across. Appending "
        "itself is cheap -- it writes at the end and shifts nothing, unlike "
        "inserting in the middle -- and sequential reading is if anything "
        "faster on an array than on a linked list because the elements are "
        "adjacent in memory. Growth is the only real objection, and doubling "
        "on each reallocation is the standard answer to it."),
]

LESSON_DATA_STRUCTURES = lesson(
    MAJOR, MIDDLE,
    "Data Structures: Arrays, Lists, Stacks, Queues, Trees and Hashes",
    _ds_quiz,
    lesson_structure(
        "Data Structures: Arrays, Lists, Stacks, Queues, Trees and Hashes",
        "A data structure is an arrangement of data chosen to make the "
        "operations you perform most often cheap, and every structure in this "
        "lesson buys speed on some operations by giving it up on others. You "
        "will learn what each one makes fast and what it makes slow, how to "
        "trace a stack or a queue reliably, why a binary search tree can "
        "collapse into a linked list, why hash collisions are certain rather "
        "than accidental, and how to pick a structure from a description of "
        "what a program actually does. This material is the foundation of "
        "Subject B, where pseudocode manipulating arrays and lists is most of "
        "the paper.",
        [
            "Explain why array access is instant and why middle insertion is "
            "not",
            "Compare arrays with singly, doubly and circular linked lists",
            "Trace a sequence of stack and queue operations reliably",
            "Use the vocabulary of trees: root, leaf, depth, height, subtree",
            "Search a binary search tree and explain how sorted input "
            "degrades it",
            "Produce in-order, pre-order, post-order and level-order "
            "traversals",
            "Explain hashing, why collisions are unavoidable, and how "
            "chaining and open addressing differ",
            "Select a structure from the dominant operation in a described "
            "workload",
        ],
        75,
        _ds_sections,
        [
            ("Array",
             "A fixed number of same-typed elements in one contiguous block. "
             "An element's address is computed from its index, so access is "
             "instant; insertion in the middle must shift everything after "
             "it."),
            ("Linked list",
             "A sequence of nodes each holding a value and the address of the "
             "next. Insertion anywhere is two assignments; reaching element n "
             "means walking n links."),
            ("Doubly linked list",
             "A linked list whose nodes also point backwards, allowing "
             "traversal in both directions and deletion given only the node "
             "itself."),
            ("Stack",
             "A structure restricted to last-in, first-out access via push "
             "and pop. Models nesting: call frames, undo history, bracket "
             "matching."),
            ("Queue",
             "A structure restricted to first-in, first-out access. Models "
             "waiting: buffers, print jobs, breadth-first traversal."),
            ("Circular queue (ring buffer)",
             "A fixed array queue whose indices wrap to the beginning, "
             "reclaiming the space abandoned behind the advancing front."),
            ("Priority queue",
             "A queue from which the highest-priority item is removed rather "
             "than the oldest. Used by schedulers and by Dijkstra's "
             "algorithm."),
            ("Tree",
             "A hierarchy with one root in which every other node has exactly "
             "one parent."),
            ("Depth and height",
             "Depth is a node's distance in edges from the root; height is "
             "the depth of the tree's deepest leaf."),
            ("Binary search tree",
             "A binary tree in which every value in a node's left subtree is "
             "smaller than the node and every value on the right is larger. "
             "Search discards a subtree per comparison -- while it stays "
             "balanced."),
            ("In-order traversal",
             "Left subtree, node, right subtree. On a binary search tree this "
             "emits the values in ascending order."),
            ("Level-order traversal",
             "Visiting every node at each depth before moving deeper. "
             "Implemented with a queue rather than recursion."),
            ("Hash function",
             "A function turning a key into a bucket index, so an entry's "
             "location is computed rather than searched for."),
            ("Collision",
             "Two keys hashing to the same bucket. Certain rather than "
             "accidental, since there are more possible keys than buckets."),
            ("Chaining",
             "Collision handling in which each bucket holds a list of all "
             "entries hashing there."),
            ("Open addressing",
             "Collision handling in which a colliding entry probes for the "
             "next free slot. Uses no extra memory and degrades sharply as "
             "the table fills."),
        ],
        "Every data structure trades some operations away to make others "
        "cheap, so choosing one means deciding what you are willing to make "
        "slow. An array stores elements contiguously, which is why its "
        "address arithmetic makes access instant and why inserting in the "
        "middle must shift everything after it; a linked list stores nodes "
        "anywhere and links them, reversing both properties exactly. Stacks "
        "and queues are not new arrangements but restrictions -- last-in "
        "first-out for nesting, first-in first-out for waiting -- and "
        "examination items about them are traced, not reasoned about, which "
        "means writing the contents down after every operation. A tree is a "
        "hierarchy whose depth is counted from the root and whose height is "
        "counted to the deepest leaf; a binary search tree adds the rule that "
        "smaller values go left and larger go right, which lets each "
        "comparison discard a whole subtree -- until sorted input builds a "
        "tree with no left branches at all and search degrades from "
        "logarithmic to linear. In-order traversal emits a binary search "
        "tree's values in sorted order, pre-order rebuilds the structure, "
        "post-order frees it, and level-order needs a queue. A hash table "
        "computes an entry's location from its key, which is the fastest "
        "lookup available and the reason it cannot produce anything in order; "
        "collisions are a certainty rather than a defect, handled by chaining "
        "a list per bucket or probing for a free slot.",
        exam_notes=[
            desc(
                "Data structures appear throughout Subject A and are "
                "unavoidable in Subject B, where every pseudocode item "
                "manipulates one."
            ),
            ul([
                "Tracing a sequence of stack or queue operations to a final "
                "state.",
                "Identifying the traversal that produced a given output "
                "sequence.",
                "Reasoning about how sorted input affects a binary search "
                "tree.",
                "Explaining what a collision is and how a strategy resolves "
                "it.",
                "Choosing a structure from a described workload.",
                "Index arithmetic on one- and two-dimensional arrays.",
            ]),
            desc(
                "Write every trace down. Stack and queue items are free "
                "marks on paper and coin-flips in your head, and the "
                "distractors are always the values you reach by slipping one "
                "operation."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Algorithms
# ==========================================================================

_algo_sections = [
    ("What Makes an Algorithm", [
        desc(
            "An algorithm is a finite, unambiguous procedure that transforms "
            "an input into an output. Each of those words excludes something "
            "real: finite rules out a procedure that never stops, "
            "unambiguous rules out a step that could be carried out two ways, "
            "and the input-to-output framing rules out a procedure with no "
            "defined result."
        ),
        table(
            ["Property", "What it requires", "What violates it"],
            [["Finiteness", "It terminates after a bounded number of steps",
              "A loop whose condition never becomes false"],
             ["Definiteness", "Every step is unambiguous",
              "\"Choose a suitable value\" with no rule for choosing"],
             ["Input", "Zero or more well-defined inputs",
              "Depending on data the procedure never receives"],
             ["Output", "At least one well-defined result",
              "A procedure that computes nothing observable"],
             ["Effectiveness", "Each step is basic enough to be carried out",
              "\"Solve the halting problem for this input\""]],
            caption="The five properties every algorithm must have.",
            footer="The examination rarely asks these directly, but it does "
                   "ask which of four described procedures fails to be an "
                   "algorithm -- and the answer is always the one that may "
                   "not terminate."),
        desc(
            "Two algorithms solving the same problem can differ enormously in "
            "cost, and comparing them is what most of this lesson is about. "
            "The comparison must be independent of the machine, the language "
            "and the day's load, which is what complexity notation provides."
        ),
    ]),

    ("Measuring Cost: Order of Growth", [
        desc(
            "Timing an algorithm on one machine says nothing portable. What "
            "matters is how its cost GROWS as the input grows, because that "
            "is the property a faster processor cannot fix."
        ),
        table(
            ["Order", "Name", "n = 10", "n = 1,000", "n = 1,000,000"],
            [["O(1)", "Constant", "1", "1", "1"],
             ["O(log n)", "Logarithmic", "3", "10", "20"],
             ["O(n)", "Linear", "10", "1,000", "1,000,000"],
             ["O(n log n)", "Linearithmic", "33", "10,000", "20,000,000"],
             ["O(n^2)", "Quadratic", "100", "1,000,000", "10^12"],
             ["O(2^n)", "Exponential", "1,024", "beyond astronomical",
              "beyond astronomical"]],
            caption="Roughly how many basic operations each order implies.",
            footer="Read the last column. Between quadratic and linearithmic "
                   "there is a factor of fifty thousand at a million items -- "
                   "the difference between a report that runs overnight and "
                   "one that never finishes."),
        desc(
            "Big-O notation states an upper bound on growth and deliberately "
            "discards two things: constant factors and lower-order terms. An "
            "algorithm taking 3n + 50 steps is O(n), and so is one taking "
            "1,000n. That looks careless until you see the point -- constants "
            "depend on the machine and the compiler, while the ORDER is a "
            "property of the algorithm itself and survives every hardware "
            "upgrade."
        ),
        desc(
            "The practical corollary is worth stating. For small inputs a "
            "constant factor can dominate completely, which is why real "
            "sorting libraries switch to insertion sort for short "
            "sub-arrays despite it being quadratic. Asymptotic notation "
            "describes what happens as n grows, and says nothing whatever "
            "about n = 12."
        ),
    ]),

    ("Best, Average and Worst Case", [
        desc(
            "The same algorithm can behave very differently on different "
            "inputs of the same size, so a single figure is not enough. The "
            "syllabus expects all three cases, and the examination is "
            "specific about which it wants."
        ),
        compare_grid(
            "THREE QUESTIONS ABOUT THE SAME ALGORITHM",
            "Each answers a different practical concern, and confusing them "
            "produces confident wrong answers.",
            [("Best case",
              "The luckiest input. Usually the least useful figure -- linear "
              "search finds the target first try, which tells you nothing "
              "about a real workload."),
             ("Average case",
              "What to expect over typical inputs. The most useful for "
              "capacity planning, and the hardest to establish because it "
              "depends on what 'typical' means for your data."),
             ("Worst case",
              "The guarantee. The only figure that holds under adversarial "
              "input, which is why security-sensitive code is judged on it -- "
              "an attacker will find the worst case deliberately.")]),
        desc(
            "Quicksort is the standard illustration. Its average case is "
            "linearithmic and excellent; its worst case is quadratic and "
            "occurs when the pivot is consistently the smallest or largest "
            "remaining element -- which happens on already-sorted data under a "
            "naive pivot choice. An attacker who can influence the input can "
            "therefore trigger the worst case on purpose, which is why "
            "production sorts randomise the pivot."
        ),
    ]),

    ("Searching", [
        desc(
            "Two search algorithms, and the difference between them is the "
            "clearest demonstration in the syllabus of what preparation buys."
        ),
        content_tabs(
            "TWO WAYS TO FIND A VALUE",
            "One works on anything; the other is far faster and demands "
            "something in return.",
            [("Linear search", "Examine each element in turn",
              "Start at the beginning and compare every element until the "
              "target is found or the data runs out. Requires nothing of the "
              "data -- it need not be sorted, indexed or in memory. Costs n/2 "
              "comparisons on average and n in the worst case, so it is O(n). "
              "For small collections, or data that changes constantly, this "
              "is genuinely the right choice."),
             ("Binary search", "Halve the remaining range each time",
              "Compare the target with the middle element; if it is smaller "
              "keep the left half, if larger keep the right, and repeat. Each "
              "comparison discards half of what remains, giving O(log n) -- "
              "twenty comparisons for a million elements against half a "
              "million for linear search. The data MUST be sorted."),
             ("The condition that decides it", "Is the data sorted, and does it stay so?",
              "Sorting costs O(n log n), so a single binary search over "
              "unsorted data is slower than just scanning it. Binary search "
              "pays off when the same sorted collection is searched many "
              "times -- which is exactly the case a database index is built "
              "for.")]),
        image(fig("binary-search")),
        desc(
            "Binary search on unsorted data does not run slowly. It returns "
            "WRONG ANSWERS, silently, because it discards the half the target "
            "was actually in. That failure mode -- correct-looking output from "
            "a violated precondition -- is worth more attention than the "
            "performance difference."
        ),
    ]),

    ("Sorting", [
        desc(
            "Sorting is examined more than any other algorithm family, partly "
            "because it is genuinely important and partly because it is the "
            "ideal vehicle for comparing approaches on the same problem."
        ),
        table(
            ["Algorithm", "How it works", "Average", "Worst", "Stable?"],
            [["Bubble sort", "Repeatedly swap adjacent out-of-order pairs",
              "O(n^2)", "O(n^2)", "Yes"],
             ["Selection sort", "Repeatedly move the smallest to the front",
              "O(n^2)", "O(n^2)", "No"],
             ["Insertion sort", "Insert each element into a sorted prefix",
              "O(n^2)", "O(n^2)", "Yes"],
             ["Merge sort", "Split, sort each half, merge the two",
              "O(n log n)", "O(n log n)", "Yes"],
             ["Quicksort", "Partition around a pivot, recurse on each side",
              "O(n log n)", "O(n^2)", "No"],
             ["Heap sort", "Build a heap, then extract the largest repeatedly",
              "O(n log n)", "O(n log n)", "No"]],
            caption="The six sorts the syllabus names.",
            footer="Note the two columns that differ. Quicksort is usually "
                   "fastest in practice despite a quadratic worst case, "
                   "because its constant factors are small and its bad case "
                   "is avoidable by choosing the pivot carefully."),
        desc(
            "STABILITY means equal elements keep their original relative "
            "order. It sounds academic and is not: sorting a table by "
            "department and then by name gives a useful result only if the "
            "second sort is stable, because an unstable sort will scramble "
            "the ordering the first one established. This is why stability "
            "appears in the table at all, and why it is examined."
        ),
        content_accordion(
            "HOW EACH SORT ACTUALLY PROCEEDS",
            "Examination items give a partially sorted array and ask which "
            "algorithm produced it, so recognising each one's characteristic "
            "intermediate state matters more than memorising its complexity.",
            [("Bubble sort",
              "Compares adjacent pairs and swaps them if out of order, "
              "passing over the array repeatedly. After k passes the k "
              "largest elements are in their final positions at the END. "
              "Its recognisable signature is a sorted tail growing "
              "leftwards."),
             ("Selection sort",
              "Scans the unsorted portion for the smallest element and swaps "
              "it into the next position. After k passes the k smallest are "
              "final at the FRONT and the rest is untouched original order. "
              "It performs the fewest swaps of any of these."),
             ("Insertion sort",
              "Takes each element and slides it back into its place among "
              "the already-sorted prefix. After k passes the first k "
              "elements are sorted among themselves but not necessarily in "
              "final position. Excellent on nearly-sorted data, where it "
              "approaches linear time -- which is why libraries use it for "
              "small sub-arrays."),
             ("Merge sort",
              "Divides the array in half, sorts each half recursively, then "
              "merges the two sorted halves. Its worst case equals its "
              "average because the division never depends on the data. The "
              "cost is memory: the merge needs a second array."),
             ("Quicksort",
              "Chooses a pivot, partitions the array so smaller elements are "
              "left of it and larger right, then recurses on each side. The "
              "pivot lands in its final position immediately. Fast in "
              "practice and vulnerable to a consistently poor pivot, which "
              "randomisation prevents."),
             ("Heap sort",
              "Builds the array into a heap, then repeatedly removes the "
              "largest element and rebuilds. Guarantees linearithmic time "
              "with no extra memory -- the combination merge sort and "
              "quicksort each miss.")]),
    ]),

    ("Recursion", [
        desc(
            "A recursive procedure calls itself on a smaller version of the "
            "same problem. It needs exactly two parts, and omitting either is "
            "the only way recursion goes wrong."
        ),
        ol([
            "A BASE CASE: an input small enough to answer directly, without "
            "recursing.",
            "A RECURSIVE CASE that calls itself on strictly smaller input and "
            "combines the result.",
        ]),
        image(fig("recursion-frames")),
        desc(
            "Every pending call keeps a stack frame holding its local "
            "variables and where to resume. The frames unwind only when the "
            "innermost call returns, which is why recursion depth costs "
            "memory and why a missing or unreachable base case produces a "
            "stack overflow rather than an infinite loop."
        ),
        compare_grid(
            "RECURSION AND ITERATION",
            "Anything one can do the other can, so the choice is about "
            "clarity and cost rather than capability.",
            [("Recursion suits",
              "Naturally nested problems -- tree traversal, parsing, "
              "divide-and-conquer sorts, directory walking. The code mirrors "
              "the structure of the data, which makes it markedly easier to "
              "get right."),
             ("Iteration suits",
              "Flat, sequential problems, and anywhere depth could grow "
              "large. It uses constant stack space and avoids call overhead, "
              "which matters in embedded and real-time code where a stack "
              "overflow is unacceptable.")]),
        desc(
            "The examination's recursion items are traces: given a definition "
            "and an argument, what is returned? Work them from the base case "
            "upward, writing each level's result down. Attempting to reason "
            "top-down about what the whole call 'does' is how candidates talk "
            "themselves into a wrong answer."
        ),
    ]),

    ("Divide and Conquer, and Other Strategies", [
        desc(
            "Beyond individual algorithms, the syllabus expects the general "
            "strategies -- the shapes of solution that recur across problems."
        ),
        table(
            ["Strategy", "The idea", "Example"],
            [["Divide and conquer", "Split, solve the parts, combine",
              "Merge sort, quicksort, binary search"],
             ["Greedy", "Take the best-looking option at each step",
              "Making change with the largest coins first"],
             ["Dynamic programming",
              "Solve overlapping sub-problems once and store the results",
              "Knapsack, shortest path"],
             ["Backtracking", "Try an option, undo it if it fails, try another",
              "Solving a maze or a constraint puzzle"],
             ["Brute force", "Try every possibility",
              "Feasible only when the space is small"]],
            caption="Five strategies, and where each one fits.",
            footer="Greedy is the one to be careful with: it is fast and "
                   "often optimal, but not always. Largest-coin-first fails "
                   "on coin sets where a smaller first choice would have done "
                   "better, and proving a greedy choice safe is real work."),
        desc(
            "Dynamic programming is worth a second look because its name "
            "hides what it is. It applies when a problem breaks into "
            "sub-problems that OVERLAP -- the same sub-problem arising many "
            "times -- and it simply stores each answer instead of recomputing "
            "it. Computing Fibonacci numbers recursively without storing "
            "results recomputes the same values exponentially many times; "
            "storing them makes it linear. Same algorithm, one table, an "
            "astronomically different cost."
        ),
    ]),

    ("Flowcharts and Pseudocode", [
        desc(
            "An algorithm has to be written down before it can be discussed, "
            "and the syllabus uses two notations. Subject B is built entirely "
            "on the second."
        ),
        table(
            ["Flowchart symbol", "Means"],
            [["Rounded rectangle", "Start or end"],
             ["Rectangle", "A process step"],
             ["Parallelogram", "Input or output"],
             ["Diamond", "A decision, with one branch per outcome"],
             ["Arrow", "Flow of control"]],
            caption="The symbols an FE flowchart item uses.",
            footer="A diamond always has one entry and two or more exits, "
                   "which is what makes a loop visible: an arrow returning to "
                   "an earlier point in the chart."),
        desc(
            "Pseudocode is structured text: assignment, conditionals, loops "
            "and procedure calls written in a language-neutral notation. "
            "Since the 2024 revision the FE examination uses its own "
            "pseudocode rather than any real language, which levels the field "
            "between candidates from different programming backgrounds and "
            "means the skill being tested is tracing rather than syntax "
            "recall."
        ),
        desc(
            "The technique for Subject B is a trace table, and it is the "
            "single most valuable habit for that paper: a column per "
            "variable, a row per iteration, filled in as you step through. It "
            "is slower than reading and comparing to the options, and it is "
            "the only method that reliably survives a twenty-line procedure "
            "with two nested loops."
        ),
    ]),

    ("A Worked Trace", [
        desc(
            "A Subject B-style item, worked with a trace table. The procedure "
            "takes an integer n and repeatedly divides it by 10 while "
            "accumulating digits."
        ),
        ol([
            "Initial state: n = 4,271, result = 0.",
            "Iteration 1: digit = n mod 10 = 1. result = result x 10 + digit "
            "= 1. n = n div 10 = 427.",
            "Iteration 2: digit = 7. result = 1 x 10 + 7 = 17. n = 42.",
            "Iteration 3: digit = 2. result = 17 x 10 + 2 = 172. n = 4.",
            "Iteration 4: digit = 4. result = 172 x 10 + 4 = 1,724. n = 0.",
            "The loop condition n > 0 now fails, so the procedure returns "
            "1,724 -- the digits of the input reversed.",
        ]),
        desc(
            "Two habits made that reliable. Every variable was written down "
            "after every iteration, and the loop CONDITION was checked "
            "explicitly at the end rather than assumed. Distractors on items "
            "like this are built from stopping one iteration early, stopping "
            "one late, and applying the operations in the wrong order within "
            "an iteration -- so all three wrong answers look like the "
            "workings of someone who nearly did it right."
        ),
    ]),

    ("Why Comparison Sorting Cannot Beat n log n", [
        desc(
            "The table of sorts above has a suspicious gap: nothing beats "
            "O(n log n). That is not a failure of imagination but a proven "
            "limit, and the argument is short enough to be worth "
            "understanding."
        ),
        desc(
            "A sort that decides everything by comparing pairs is choosing "
            "between orderings. There are n factorial possible orderings of n "
            "items, and each comparison has two outcomes, so k comparisons "
            "can distinguish at most 2^k possibilities. To separate n "
            "factorial orderings you therefore need at least log2(n!) "
            "comparisons, which grows as n log n. No cleverness inside the "
            "comparison model can get below it."
        ),
        compare_grid(
            "HOW THE FASTER SORTS ESCAPE THE BOUND",
            "They do not break the proof; they step outside the model it "
            "assumes by using the VALUES rather than only comparing them.",
            [("Counting sort",
              "Counts how many times each value occurs and rebuilds the "
              "sequence from the counts. Linear in the number of items plus "
              "the size of the value range -- excellent for small integer "
              "ranges, useless for arbitrary values."),
             ("Radix sort",
              "Sorts by one digit or byte at a time, from least significant "
              "to most, using a stable sort at each pass. Linear in items "
              "times digits, which is why it suits fixed-width keys such as "
              "identifiers and dates.")]),
        desc(
            "The examination is unlikely to ask for the proof, but it does "
            "ask why no comparison sort achieves linear time, and the "
            "one-line answer is that there are too many orderings to "
            "distinguish with fewer comparisons."
        ),
    ]),

    ("Loop Invariants and Getting a Loop Right", [
        desc(
            "Most defects in Subject B-style code are in loops, and nearly "
            "all of them are boundary defects. A loop invariant is the "
            "discipline that prevents them: a statement true before the loop "
            "starts, true after every iteration, and therefore true when it "
            "ends."
        ),
        desc(
            "For linear search the invariant is 'the target is not among the "
            "elements already examined'. If that holds at every step, then "
            "when the loop ends without a match the target is genuinely "
            "absent, and the algorithm is correct. Stating the invariant is "
            "often enough to expose an error immediately -- if you cannot say "
            "what stays true, the loop is not yet understood."
        ),
        table(
            ["Boundary question", "The error it prevents"],
            [["Does the loop run zero times when it should?",
              "Processing an empty collection as if it had one element"],
             ["Does the loop run one time too many?",
              "Reading past the last element"],
             ["Does the loop run one time too few?",
              "Silently skipping the final element"],
             ["Is the counter updated on every path?",
              "An infinite loop when a branch skips the increment"],
             ["Is the condition checked before or after the body?",
              "A body that always executes at least once when it should not"]],
            caption="The five questions to ask of any loop before trusting "
                    "it.",
            footer="Off-by-one errors survive casual reading because the "
                   "output is nearly right. They do not survive a trace "
                   "table run on the smallest possible input."),
        desc(
            "The most valuable habit for the examination follows from this: "
            "trace the EDGE inputs, not a comfortable middle one. An empty "
            "collection, a single element, and the very last element are "
            "where the distractors are built, because that is where real code "
            "goes wrong."
        ),
    ]),

    ("String Algorithms", [
        desc(
            "Strings are arrays of characters, so everything from the "
            "previous lesson applies -- but their operations come up often "
            "enough in examination items to be worth naming separately."
        ),
        table(
            ["Operation", "What it does", "Typical cost"],
            [["Length", "Count the characters",
              "Constant, or linear if terminated by a marker"],
             ["Concatenation", "Join two strings",
              "Linear in the combined length -- a new string is built"],
             ["Substring", "Extract a range", "Linear in the length extracted"],
             ["Comparison", "Decide ordering or equality",
              "Linear, but stops at the first difference"],
             ["Naive search", "Find a pattern inside a string",
              "Length of text times length of pattern, in the worst case"]],
            caption="String operations and what they actually cost.",
            footer="Concatenation being linear is why building a long string "
                   "by repeated concatenation in a loop is quadratic overall, "
                   "and why every language provides a builder or buffer for "
                   "the purpose."),
        desc(
            "That last footnote is a genuine performance trap rather than "
            "trivia. Appending to a string a thousand times copies the whole "
            "accumulated string on each append, so the total work grows with "
            "the square of the result's length. It is invisible at ten "
            "iterations and dominant at ten thousand, which is exactly the "
            "shape of defect that survives testing."
        ),
    ]),

    ("Choosing an Algorithm in Practice", [
        desc(
            "The examination asks which algorithm suits a described "
            "situation, and the reasoning follows a short sequence."
        ),
        ol([
            "Establish the scale. At a hundred items almost anything works "
            "and clarity wins; at ten million, the order of growth decides "
            "everything.",
            "Establish what the data is already like. Nearly-sorted data "
            "makes insertion sort near-linear; a fixed small range of "
            "integers makes counting sort applicable.",
            "Establish which operation dominates. Optimise for the thing done "
            "a thousand times a second, not the thing done nightly.",
            "Establish whether the worst case matters. If the input comes "
            "from outside, it does, and the average case is the wrong figure.",
            "Establish the constraints. Available memory rules out merge "
            "sort's extra array; a hard deadline rules out anything whose "
            "worst case is unbounded.",
        ]),
        desc(
            "One general principle sits behind all five, and it is the "
            "single most useful thing in this lesson: prefer the simplest "
            "algorithm that meets the requirement. A quadratic sort on a "
            "list that will never exceed fifty items is correct engineering, "
            "not a compromise, and replacing it with something clever adds "
            "risk for a benefit nobody will measure."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where algorithm items are lost."),
        ul([
            "Using binary search on unsorted data. It does not fail slowly; "
            "it returns wrong answers.",
            "Quoting an average case where the question asked for the worst, "
            "particularly with quicksort.",
            "Assuming a lower order is always faster. Constants dominate at "
            "small n, which is why libraries switch to insertion sort for "
            "short runs.",
            "Forgetting that stability matters when sorting by one key after "
            "another.",
            "Writing a recursive procedure whose base case is unreachable, "
            "which overflows the stack rather than looping.",
            "Reasoning top-down about a recursive call instead of tracing it "
            "from the base case up.",
            "Trusting a greedy strategy without checking that the locally "
            "best choice is globally safe.",
            "Tracing a loop without a trace table.",
        ]),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("This is the most reused lesson in the certification."),
        ul([
            "Subject B is largely this lesson applied under time pressure.",
            "Sorting and searching underpin database query execution and "
            "index design.",
            "Divide and conquer reappears as the structure of merge joins and "
            "of parallel processing.",
            "Complexity analysis is what capacity planning and performance "
            "testing rest on.",
            "Recursion and the call stack reappear in the Processor and "
            "Operating System lessons.",
            "Graph algorithms in Applied Mathematics are the same strategies "
            "applied to networks and schedules.",
        ]),
    ]),

    ("Recall Check", [
        desc("Produce each answer before checking it."),
        review_cards(
            "TEST YOURSELF",
            "Six results that must be immediate.",
            [("Binary search complexity and precondition",
              "O(log n), and the data must be sorted",
              "Twenty comparisons for a million elements. On unsorted data it "
              "returns wrong answers rather than running slowly."),
             ("Quicksort average and worst case",
              "O(n log n) average, O(n^2) worst",
              "The worst case comes from a consistently extreme pivot, which "
              "already-sorted input triggers under a naive choice. "
              "Randomising the pivot prevents it."),
             ("What a stable sort preserves",
              "The relative order of equal elements",
              "Needed whenever you sort by one key after another; an unstable "
              "sort scrambles the previous ordering."),
             ("The two parts of any recursion",
              "A base case and a smaller recursive call",
              "Missing or unreachable base case means frames pile up until "
              "the stack overflows."),
             ("What big-O discards",
              "Constant factors and lower-order terms",
              "3n + 50 and 1000n are both O(n). Constants depend on the "
              "machine; the order is a property of the algorithm."),
             ("The Subject B technique",
              "A trace table: a column per variable, a row per iteration",
              "Slower than reading the code, and the only method that "
              "survives nested loops.")]),
    ]),
]

_algo_quiz = [
    mcq("EASY",
        "Binary search is applied to a collection of one million sorted "
        "elements.\n\n"
        "Approximately how many comparisons are needed in the worst case?",
        [("20", True),
         ("1,000", False),
         ("500,000", False),
         ("1,000,000", False)],
        "Each comparison halves the range that remains, so the worst case is "
        "roughly the base-2 logarithm of the collection size, and 2^20 is "
        "just over a million -- so about 20 comparisons. The value 500,000 is "
        "the AVERAGE for linear search and 1,000,000 its worst case, which is "
        "the comparison that makes binary search worth its sorting "
        "precondition."),

    mcq("EASY",
        "Which precondition must hold before binary search can be used?",
        [("The collection must be stored in a linked list.", False),
         ("The collection must be sorted.", True),
         ("The collection must contain no duplicate values.", False),
         ("The collection size must be a power of two.", False)],
        "Binary search discards half the range based on a comparison with the "
        "middle element, and that reasoning is valid only if the data is in "
        "order. On unsorted data it does not run slowly -- it silently "
        "returns wrong answers, because it throws away the half the target "
        "was in. Duplicates are harmless, any size works, and a linked list "
        "would actually defeat it by making the middle element expensive to "
        "reach."),

    mcq("AVERAGE",
        "Quicksort is described as having O(n log n) average-case complexity "
        "but O(n^2) in the worst case.\n\n"
        "What causes the worst case?",
        [("Input containing many duplicate values", False),
         ("A pivot that is consistently the smallest or largest remaining "
          "element", True),
         ("Insufficient memory for the recursion to complete", False),
         ("Input arriving in random rather than sorted order", False)],
        "Quicksort partitions around a pivot, and it is efficient when the "
        "pivot splits the data roughly in half. If the pivot is always the "
        "extreme value, one partition is empty and the other holds everything "
        "but one element, so the recursion depth becomes n rather than log n. "
        "With a naive choice such as 'always take the first element', "
        "ALREADY-SORTED input triggers exactly this, which is why production "
        "implementations randomise the pivot."),

    mcq("AVERAGE",
        "Records already sorted by employee name are then sorted by "
        "department.\n\n"
        "What property must the second sort have for employees to remain in "
        "name order within each department?",
        [("It must be an in-place sort.", False),
         ("It must have O(n log n) worst-case complexity.", False),
         ("It must be stable.", True),
         ("It must be a comparison sort.", False)],
        "Stability means equal elements keep their original relative order. "
        "Sorting by department compares only departments, so employees in the "
        "same department are 'equal' to the sort -- and only a stable sort "
        "leaves them in the name order the first pass established. Sorting "
        "in place concerns memory, complexity concerns speed, and being "
        "comparison-based says nothing about ordering equal elements."),

    mcq("AVERAGE",
        "Big-O notation describes an algorithm as O(n), discarding both "
        "constant factors and lower-order terms.\n\n"
        "Why is this a useful simplification rather than a careless one?",
        [("Constant factors are always negligible in practice.", False),
         ("The order of growth is a property of the algorithm rather than of "
          "the machine.", True),
         ("Lower-order terms grow faster than the leading term for large n.",
          False),
         ("It makes every algorithm comparable to every other by a single "
          "number.", False)],
        "Constants depend on the processor, the compiler and the language, so "
        "they change with every hardware upgrade; the order of growth belongs "
        "to the algorithm and survives all of that, which is what makes it "
        "the portable comparison. Constants are emphatically NOT always "
        "negligible -- they dominate at small n, which is why libraries switch "
        "to insertion sort for short sub-arrays -- and lower-order terms grow "
        "more slowly, not faster, which is precisely why they are dropped."),

    mcq("HARD",
        "A recursive procedure is written with a recursive case but no "
        "reachable base case.\n\n"
        "What happens when it runs?",
        [("It loops for ever without consuming additional memory.", False),
         ("The compiler rejects it before it can run.", False),
         ("Stack frames accumulate until the stack is exhausted.", True),
         ("It returns an undefined value immediately.", False)],
        "Each call allocates a stack frame for its local variables and return "
        "address, and that frame is released only when the call returns. With "
        "no reachable base case nothing ever returns, so frames accumulate "
        "until the stack space runs out -- a stack overflow. This is the key "
        "difference from an infinite loop, which repeats without consuming "
        "memory. No compiler can detect the fault in general, since deciding "
        "whether an arbitrary procedure terminates is undecidable."),

    mcq("AVERAGE",
        "Consider a procedure that repeatedly sets digit to n mod 10, then "
        "result to result times 10 plus digit, then n to n div 10, looping "
        "while n is greater than 0. It starts with n = 4,271 and result = 0."
        "\n\nWhat does it return?",
        [("4,271", False),
         ("1,724", True),
         ("14", False),
         ("172", False)],
        "Trace it one iteration at a time. digit = 1, result = 1, n = 427. "
        "Then digit = 7, result = 17, n = 42. Then digit = 2, result = 172, "
        "n = 4. Then digit = 4, result = 1,724, n = 0, and the condition "
        "fails. The procedure reverses the digits. Answering 172 stops one "
        "iteration early and 14 sums the digits rather than accumulating "
        "them positionally -- both are exactly what a slipped trace "
        "produces."),

    mcq("HARD",
        "Computing Fibonacci numbers by naive recursion recalculates the same "
        "sub-results an exponential number of times. Storing each result the "
        "first time it is computed reduces this to linear time.\n\n"
        "Which strategy does that describe?",
        [("Divide and conquer", False),
         ("Greedy selection", False),
         ("Backtracking", False),
         ("Dynamic programming", True)],
        "Dynamic programming applies where a problem decomposes into "
        "OVERLAPPING sub-problems, and it works by solving each one once and "
        "storing the answer -- trading memory for time. Divide and conquer "
        "also splits a problem, but its sub-problems are independent and do "
        "not repeat, so storing them would gain nothing. Greedy selection "
        "makes a locally best choice at each step, and backtracking undoes "
        "choices that fail; neither describes caching repeated results."),

    mcq("AVERAGE",
        "After several passes of a sorting algorithm, the first k elements of "
        "an array are the k smallest values in their final positions, while "
        "the remainder is untouched in its original order.\n\n"
        "Which algorithm is running?",
        [("Selection sort", True),
         ("Bubble sort", False),
         ("Insertion sort", False),
         ("Merge sort", False)],
        "Selection sort scans the unsorted portion for the smallest remaining "
        "element and swaps it into the next position, so after k passes "
        "exactly the k smallest are final at the front and nothing else has "
        "moved. Bubble sort builds its sorted region at the END, from the "
        "largest values inward. Insertion sort leaves its first k elements "
        "sorted among themselves but not in final position. Merge sort "
        "produces sorted runs that are progressively merged, not a finished "
        "prefix."),

    mcq("HARD",
        "An algorithm must guarantee acceptable performance on input supplied "
        "by an untrusted external party.\n\n"
        "Which complexity figure should the decision be based on?",
        [("Best case, since it establishes the algorithm's potential", False),
         ("Average case, since it reflects typical workloads", False),
         ("Worst case, since the input may be chosen adversarially", True),
         ("Any of them, since they converge for large inputs", False)],
        "An untrusted party can construct the input deliberately, so the "
        "worst case is not a rare accident but something an attacker will aim "
        "for -- a hash table fed colliding keys, or a naive quicksort fed "
        "sorted data. The average case describes benign traffic and is the "
        "right basis for capacity planning, not for security. The three cases "
        "do not converge; for quicksort they differ by a whole order of "
        "growth."),
]

LESSON_ALGORITHMS = lesson(
    MAJOR, MIDDLE,
    "Algorithms: Searching, Sorting, Recursion and Complexity",
    _algo_quiz,
    lesson_structure(
        "Algorithms: Searching, Sorting, Recursion and Complexity",
        "This lesson is the heart of Subject B and a steady presence on "
        "Subject A. It establishes what an algorithm is, how to compare two of "
        "them independently of any machine, and why the difference between "
        "quadratic and linearithmic growth decides whether a report finishes "
        "overnight or never. It then works through searching, the six sorting "
        "algorithms the syllabus names, recursion and the call stack, and the "
        "general strategies -- divide and conquer, greedy, dynamic "
        "programming, backtracking -- before turning to the notation the "
        "examination actually uses and the trace-table technique that makes "
        "its items reliable.",
        [
            "State the properties an algorithm must have and identify a "
            "procedure that fails them",
            "Interpret big-O notation and rank the common orders of growth",
            "Distinguish best, average and worst case and choose the right "
            "one for a purpose",
            "Compare linear and binary search, including binary search's "
            "precondition",
            "Describe the six named sorts, their complexities and their "
            "stability",
            "Write and trace a recursive procedure and explain the role of "
            "the call stack",
            "Identify which general strategy a described approach uses",
            "Trace pseudocode reliably using a trace table",
        ],
        85,
        _algo_sections,
        [
            ("Algorithm",
             "A finite, unambiguous procedure transforming input into output. "
             "Must terminate, define every step, and produce an observable "
             "result."),
            ("Big-O notation",
             "An upper bound on how an algorithm's cost grows with input "
             "size, discarding constant factors and lower-order terms because "
             "those depend on the machine rather than the algorithm."),
            ("O(log n)",
             "Logarithmic growth: cost rises by one step each time the input "
             "doubles. Binary search and balanced tree lookup."),
            ("O(n log n)",
             "Linearithmic growth, the best any comparison-based sort can "
             "achieve. Merge sort, heap sort, and quicksort on average."),
            ("O(n^2)",
             "Quadratic growth: cost multiplies by four when the input "
             "doubles. The simple sorts, and any pair of nested loops over "
             "the same data."),
            ("Worst case",
             "The cost on the least favourable input. The only figure that "
             "holds under adversarial input, and therefore the right basis "
             "for security-sensitive decisions."),
            ("Linear search",
             "Examining elements in turn until the target is found. O(n), and "
             "requires nothing of the data."),
            ("Binary search",
             "Halving a sorted range at each comparison. O(log n), and on "
             "unsorted data it returns wrong answers rather than running "
             "slowly."),
            ("Stability",
             "The property that a sort preserves the relative order of equal "
             "elements. Required whenever data is sorted by one key after "
             "another."),
            ("Merge sort",
             "Divide, sort each half recursively, merge. Linearithmic in "
             "every case because the division never depends on the data; "
             "costs extra memory for the merge."),
            ("Quicksort",
             "Partition around a pivot and recurse on each side. Linearithmic "
             "on average and quadratic when the pivot is consistently "
             "extreme, which sorted input triggers under a naive choice."),
            ("Recursion",
             "A procedure calling itself on smaller input. Requires a base "
             "case and a recursive case; a missing base case exhausts the "
             "stack rather than looping."),
            ("Call stack",
             "The stack of frames holding each pending call's local variables "
             "and return address. Its depth is why recursion costs memory."),
            ("Divide and conquer",
             "Splitting a problem into independent sub-problems, solving "
             "each, and combining the results."),
            ("Greedy algorithm",
             "Taking the locally best option at each step. Fast, sometimes "
             "optimal, and not safe without an argument that the local choice "
             "cannot be regretted."),
            ("Dynamic programming",
             "Solving overlapping sub-problems once and storing the results, "
             "trading memory for time."),
            ("Backtracking",
             "Trying an option, abandoning it when it fails, and trying "
             "another. The approach for constraint problems and mazes."),
            ("Trace table",
             "A column per variable and a row per iteration, filled in while "
             "stepping through code. The technique Subject B rewards."),
        ],
        "An algorithm must terminate, define every step and produce a result, "
        "and two algorithms for one problem are compared by how their cost "
        "GROWS rather than by how long they take on one machine -- which is "
        "what big-O captures by discarding the constants and lower-order "
        "terms that belong to the hardware rather than the method. The gap "
        "matters: between quadratic and linearithmic there is a factor of "
        "fifty thousand at a million items. Best, average and worst case "
        "answer different questions, and only the worst case survives an "
        "adversary. Linear search needs nothing of its data and costs n; "
        "binary search halves the range each comparison and costs log n, but "
        "on unsorted data it returns wrong answers rather than running "
        "slowly. Among the sorts, the three simple ones are quadratic, merge "
        "and heap sort are linearithmic in every case, and quicksort is "
        "usually fastest yet degrades to quadratic when its pivot is "
        "consistently extreme -- which already-sorted input causes under a "
        "naive choice. Stability, meaning equal elements keep their order, is "
        "what makes sorting by successive keys work at all. Recursion needs a "
        "base case and a smaller recursive call, and each pending call holds "
        "a stack frame, so a missing base case exhausts the stack rather than "
        "looping for ever. Above individual algorithms sit the strategies: "
        "divide and conquer splits into independent parts, dynamic "
        "programming stores the answers to overlapping ones, greedy takes the "
        "locally best option and is not always safe, and backtracking undoes "
        "choices that fail. And for the examination itself, the technique "
        "that decides Subject B is the trace table.",
        exam_notes=[
            desc(
                "No topic in the certification is examined more heavily. "
                "Subject A takes complexity and algorithm-identification "
                "items; Subject B is sixteen of twenty questions built on "
                "pseudocode drawn from this material."
            ),
            ul([
                "Stating the complexity of a named algorithm, in a specified "
                "case.",
                "Identifying an algorithm from a partially sorted array.",
                "Tracing pseudocode with loops to a returned value.",
                "Tracing a recursive definition to its result.",
                "Explaining why quicksort's worst case arises.",
                "Recognising when stability is required.",
                "Matching a described approach to a general strategy.",
                "Reading a flowchart to determine its output.",
            ]),
            desc(
                "Build the trace-table habit before the examination rather "
                "than during it. A hundred minutes for twenty long items is "
                "five minutes each, which is ample for a careful trace and "
                "nowhere near enough to recover from a confident wrong guess."
            ),
        ],
    ))

LESSONS = [LESSON_DATA_STRUCTURES, LESSON_ALGORITHMS]

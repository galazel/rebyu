"""IT Passport lesson content: Algorithm and Programming (734-737)."""

import sys

sys.path.insert(0, "/app/scripts/fe_expansion")

from builders import (  # noqa: E402
    accordion, compare_grid, content_tabs, desc, flip_cards, image, image_text,
    lesson_structure, media_text, ol, review_cards, sub, table, tabs, ul,
)

FIG = "/lesson-media/%s.svg"

CERTIFICATION_ID = 4

LESSONS = {}


LESSONS[734] = lesson_structure(
    name="Data structure",
    intro=(
        "A data structure is a decision about how a collection is held in memory, and "
        "it decides what the program can do quickly. This lesson covers the structures "
        "the IT Passport examination asks about -- arrays, lists, stacks, queues and "
        "trees -- and, more importantly, when each one is the right choice."
    ),
    objectives=[
        "Describe how an array, a list, a stack and a queue each store data.",
        "Explain the difference between LIFO and FIFO order.",
        "Choose a suitable structure for a described task.",
        "Recognise a tree and describe what a node, root and leaf are.",
        "Explain why inserting into an array is expensive.",
        "Identify everyday features built on a stack or a queue.",
    ],
    minutes=40,
    sections=[
        ("Why the structure matters", [
            desc(
                "Every collection can be stored more than one way, and the choice is "
                "not cosmetic. The same operation -- add an item, find an item, take "
                "the next item -- can be instant in one structure and slow in another."
            ),
            desc(
                "The question to ask is never \"which structure is best\" but \"what "
                "will this program do most often\". A structure that makes the common "
                "operation fast is the right one, even if it makes a rare operation "
                "slower."
            ),
            image(FIG % "ip-data-structures"),
        ]),
        ("Arrays", [
            desc(
                "An array holds its items in consecutive memory positions, each "
                "reachable by an index. Because the positions are consecutive, the "
                "computer can calculate exactly where item n sits and jump straight to "
                "it, however long the array is."
            ),
            ul([
                "Reading or writing by index is immediate.",
                "The size is usually fixed when the array is created.",
                "Inserting in the middle means shifting every item after it along.",
                "Deleting leaves a gap that must be closed the same way.",
            ]),
            desc(
                "An array suits data that is read far more often than it is "
                "rearranged -- a lookup table, a fixed set of scores, the pixels of an "
                "image."
            ),
        ]),
        ("Lists", [
            desc(
                "A list stores each item together with a pointer to the next one. The "
                "items need not sit next to each other in memory, so the list can grow "
                "and shrink as needed."
            ),
            desc(
                "Inserting into a list means changing two pointers, with no shifting -- "
                "but only once you have reached the right place, and reaching position "
                "n means following n pointers from the start. The list trades fast "
                "indexing for cheap insertion, which is exactly the opposite trade from "
                "an array."
            ),
            compare_grid(
                "Array against list",
                "The two answer opposite questions well.",
                [("Array", "Instant access by position; expensive to insert or delete "
                           "anywhere but the end."),
                 ("List", "Cheap to insert or delete once located; must be walked from "
                          "the start to find a position.")],
            ),
        ]),
        ("Stacks and queues", [
            desc(
                "A stack and a queue both restrict where items go in and come out, and "
                "that restriction is the point: it matches how certain problems behave."
            ),
            image(FIG % "ip-stack-queue"),
            sub("Stack -- last in, first out"),
            desc(
                "Items are pushed onto the top and popped from the top, so the most "
                "recent item leaves first. Undo works this way, and so does the list of "
                "return addresses a program keeps while one function calls another."
            ),
            sub("Queue -- first in, first out"),
            desc(
                "Items join at the back and leave from the front, preserving the order "
                "of arrival. Print jobs, message buffers and anything described as "
                "\"first come, first served\" is a queue."
            ),
        ]),
        ("Working through an example", [
            desc(
                "Examination questions on stacks and queues are traces: apply the "
                "operations in order and report what is left."
            ),
            content_tabs(
                "Trace each one",
                "Write the structure down and update it operation by operation.",
                [("Push 5, 3, 8 then pop twice", "Stack",
                  "After the pushes the stack reads 5, 3, 8 with 8 on top. Popping "
                  "removes 8, then 3. The 5 is left."),
                 ("Enqueue 5, 3, 8 then dequeue twice", "Queue",
                  "Items leave in arrival order, so 5 goes then 3. The 8 is left."),
                 ("Push 1, 2, pop, push 3, pop", "Stack",
                  "Push 1 and 2; pop removes 2; push 3; pop removes 3. The 1 is left."),
                 ("Which suits an undo feature?", "Stack",
                  "The action to undo is always the most recent one.")],
            ),
        ]),
        ("Trees", [
            desc(
                "A tree stores items in a branching hierarchy. It has one root at the "
                "top, and each node may have children; a node with no children is a "
                "leaf."
            ),
            ul([
                "Folder structures on a disk are trees.",
                "Organisation charts are trees.",
                "A decision process, where each answer leads to further questions, is a tree.",
            ]),
            desc(
                "Trees matter because searching one can discard whole branches at a "
                "time. That is the same idea as binary search, applied to a structure "
                "that is built for it."
            ),
        ]),
        ("Choosing a structure", [
            desc("Match the structure to the access the task actually needs."),
            table(
                ["The task", "Suitable structure", "Why"],
                [["Look items up by number", "Array", "Index access is immediate"],
                 ["Insert and remove often, order unimportant", "List", "No shifting required"],
                 ["Undo the most recent action", "Stack", "Last in, first out"],
                 ["Serve requests in arrival order", "Queue", "First in, first out"],
                 ["Represent folders inside folders", "Tree", "Natural hierarchy"]],
            ),
        ]),
        ("Records and files", [
            desc(
                "Beyond single collections, data is grouped into records -- a set of "
                "related fields describing one thing -- and files, which are collections "
                "of records."
            ),
            accordion([
                ("Field", "One item of data, such as a surname or a price."),
                ("Record", "All the fields describing one entity -- one customer, one order."),
                ("File", "A set of records of the same kind."),
                ("Key", "The field that identifies a record uniquely, such as a customer number."),
            ]),
        ]),
        ("Recall practice", [
            desc("Cover each answer before turning the card."),
            flip_cards([
                ("Push A, B, C then pop once -- what is on top?", "B",
                 "C was the last in, so it is the first out."),
                ("Which structure preserves arrival order?", "Queue",
                 "First in, first out. A stack reverses the order."),
                ("Why is array insertion expensive?", "Everything after it must shift",
                 "The items sit in consecutive memory positions."),
                ("A node with no children is called?", "A leaf",
                 "The single node at the top is the root."),
            ]),
        ]),
    ],
    key_terms=[
        ("Array", "A fixed-size collection in consecutive memory, accessed by index."),
        ("List", "A collection where each item points to the next, so it can grow freely."),
        ("Stack", "Last in, first out: items are pushed and popped at one end."),
        ("Queue", "First in, first out: items join at the back and leave from the front."),
        ("Tree", "A branching hierarchy with one root; childless nodes are leaves."),
        ("Record", "A group of related fields describing one entity."),
    ],
    summary=(
        "A data structure decides which operations are cheap. Arrays give instant "
        "access by index and expensive insertion; lists reverse that trade. Stacks "
        "return the most recent item first, which suits undo and call returns, while "
        "queues preserve arrival order, which suits print jobs and buffers. Trees "
        "represent hierarchies and allow whole branches to be discarded while "
        "searching. The right structure is the one that makes the most frequent "
        "operation fast."
    ),
    exam_notes=[
        desc(
            "Expect a trace question: a sequence of pushes and pops, or enqueues and "
            "dequeues, with the answer being what remains. Write the structure down "
            "and update it one operation at a time rather than trying to hold it in "
            "your head."
        ),
        ul([
            "LIFO is a stack; FIFO is a queue. Mixing these up is the common error.",
            "An array is fast to read by index and slow to insert into.",
            "The root is at the top of a tree; leaves have no children.",
        ]),
    ],
)


LESSONS[735] = lesson_structure(
    name="Algorithm",
    intro=(
        "An algorithm is a finite sequence of unambiguous steps that solves a problem. "
        "This lesson covers how algorithms are expressed, the three control structures "
        "every one is built from, the searching and sorting methods the examination "
        "asks about, and why two correct algorithms can differ enormously in speed."
    ),
    objectives=[
        "State what makes a procedure an algorithm.",
        "Read a simple flowchart and follow it to a result.",
        "Identify sequence, selection and iteration in a described process.",
        "Compare linear and binary search and say when each applies.",
        "Explain in outline how a simple sort works.",
        "Explain why efficiency matters as data grows.",
    ],
    minutes=40,
    sections=[
        ("What makes an algorithm", [
            desc(
                "An algorithm must finish, must be unambiguous at every step, and must "
                "produce the intended result for every valid input. A recipe that says "
                "\"season to taste\" is not an algorithm; one that says \"add 5 grams of "
                "salt\" is."
            ),
            ul([
                "Finite -- it terminates rather than running forever.",
                "Definite -- every step means exactly one thing.",
                "Has input and output -- it takes data and produces a result.",
                "Effective -- each step can actually be carried out.",
            ]),
        ]),
        ("Ways to write one down", [
            desc(
                "The same algorithm can be expressed in several notations, chosen by "
                "who has to read it."
            ),
            tabs([
                ("Flowchart", "Boxes and arrows",
                 "Shapes carry meaning: a rectangle is a process, a diamond a decision, "
                 "a parallelogram input or output. Good for showing a decision path to "
                 "a non-programmer."),
                ("Pseudocode", "Structured English",
                 "Reads like a program without belonging to any language. Compact, and "
                 "what the examination usually shows."),
                ("Program code", "A real language",
                 "Unambiguous to a computer, but obscures the idea behind syntax."),
            ]),
        ]),
        ("The three control structures", [
            desc(
                "Every algorithm, however long, is built from three structures. That is "
                "not a simplification -- it is a proven result, and it is why learning "
                "these three is enough to read most pseudocode."
            ),
            image(FIG % "ip-control-structures"),
            ol([
                "Sequence -- steps carried out one after another.",
                "Selection -- a condition chooses between alternatives (if / else).",
                "Iteration -- a block repeats while a condition holds (while / for).",
            ]),
            desc(
                "A loop that never changes the condition it tests runs forever. That is "
                "the infinite loop, and it is the most common fault in a hand-written "
                "algorithm."
            ),
        ]),
        ("Searching", [
            desc(
                "Searching is finding whether a value is present, and where. Two methods "
                "are examinable, and the difference between them is dramatic."
            ),
            image(FIG % "ip-search-compare"),
            sub("Linear search"),
            desc(
                "Check each item in turn until the target is found or the data runs "
                "out. It works on any data in any order, and on average it checks half "
                "the items."
            ),
            sub("Binary search"),
            desc(
                "Look at the middle item. If the target is smaller, discard the upper "
                "half; if larger, discard the lower half; repeat. Each comparison halves "
                "what is left, so a thousand items take about ten comparisons instead of "
                "five hundred."
            ),
            desc(
                "Binary search has one absolute requirement: the data must already be "
                "sorted. Applying it to unsorted data does not merely run slowly, it "
                "returns wrong answers."
            ),
        ]),
        ("Sorting", [
            desc(
                "Sorting arranges data into order, usually so that it can then be "
                "searched quickly or presented sensibly. The examination asks what "
                "sorting achieves and roughly how a simple method works, not for code."
            ),
            accordion([
                ("Bubble sort",
                 "Repeatedly compare neighbouring items and swap them if they are out "
                 "of order. Simple to describe, slow on large data; the largest value "
                 "'bubbles' to the end on each pass."),
                ("Selection sort",
                 "Find the smallest remaining item and move it to the front, then "
                 "repeat with the rest."),
                ("Insertion sort",
                 "Take each item in turn and slide it back into its correct place among "
                 "the items already sorted -- the way most people sort a hand of cards."),
                ("Merge sort",
                 "Split the data in half, sort each half, then merge the two sorted "
                 "halves. Much faster on large data, at the cost of extra working space."),
            ]),
        ]),
        ("Why efficiency matters", [
            desc(
                "Two algorithms can both be correct and yet be minutes apart on real "
                "data. What matters is how the work grows as the data grows."
            ),
            table(
                ["Items", "Linear search (avg)", "Binary search"],
                [["100", "about 50 checks", "about 7 checks"],
                 ["1,000", "about 500 checks", "about 10 checks"],
                 ["1,000,000", "about 500,000 checks", "about 20 checks"]],
                caption="A thousandfold more data costs binary search three more comparisons.",
            ),
            desc(
                "This is why the choice of algorithm is a design decision rather than a "
                "detail. Faster hardware cannot rescue an approach whose work grows "
                "faster than the data does."
            ),
        ]),
        ("Reading a flowchart", [
            desc(
                "Examination questions often give a small flowchart and a starting "
                "value and ask for the output. The method is mechanical."
            ),
            ol([
                "Write down the variables and their starting values.",
                "Follow the arrows one box at a time.",
                "Update the variables on paper at every step -- never in your head.",
                "At a decision diamond, test the condition and take the matching branch.",
                "Stop at the end symbol and read the output.",
            ]),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("What must be true before a binary search?", "The data is sorted",
                 "On unsorted data it returns wrong answers, not just slow ones."),
                ("Which structure repeats a block?", "Iteration",
                 "Selection chooses between branches; sequence is one step after another."),
                ("Roughly how many checks for 1,000 sorted items?", "About 10",
                 "Each comparison halves the range; 2^10 is 1,024."),
                ("What causes an infinite loop?", "The condition never becomes false",
                 "Usually the variable the condition tests is never updated."),
            ]),
        ]),
    ],
    key_terms=[
        ("Algorithm", "A finite, unambiguous sequence of steps that solves a problem."),
        ("Flowchart", "A diagram of an algorithm; diamonds are decisions, rectangles processes."),
        ("Pseudocode", "Structured English describing an algorithm without a specific language."),
        ("Linear search", "Checking each item in turn; works on unsorted data."),
        ("Binary search", "Halving a SORTED range at each comparison."),
        ("Iteration", "Repeating a block of steps while a condition holds."),
    ],
    summary=(
        "An algorithm is finite, definite and effective, and can be written as a "
        "flowchart, as pseudocode or as code. All of them are built from sequence, "
        "selection and iteration. Linear search works on any data and checks about "
        "half of it; binary search halves the range each time but requires sorted "
        "data. Sorting exists largely to make that possible. How the work grows with "
        "the data is what separates an algorithm that scales from one that does not."
    ),
    exam_notes=[
        desc(
            "Flowchart-tracing questions are worth slowing down for: track every "
            "variable on paper. Most wrong answers come from holding one value in your "
            "head and losing it, not from misunderstanding the algorithm."
        ),
        ul([
            "Binary search REQUIRES sorted data -- that is the usual trap.",
            "A diamond in a flowchart is a decision, not a process.",
            "Efficiency is about how work grows with data, not raw speed.",
        ]),
    ],
)


LESSONS[736] = lesson_structure(
    name="Programming and programming languages",
    intro=(
        "A program is an algorithm written so a computer can carry it out. This lesson "
        "covers how source code becomes something a processor executes, what "
        "distinguishes the main families of language, and the vocabulary -- variable, "
        "function, parameter, bug -- that the examination expects."
    ),
    objectives=[
        "Explain the difference between source code and machine language.",
        "Distinguish a compiler from an interpreter.",
        "Describe what variables, functions and parameters are for.",
        "Name common languages and what each is typically used for.",
        "Explain what debugging and testing achieve.",
        "Describe what a library or framework contributes.",
    ],
    minutes=40,
    sections=[
        ("From source code to execution", [
            desc(
                "A processor only executes machine language: binary instructions it "
                "decodes directly. People write in high-level languages, which are far "
                "easier to read and must therefore be translated."
            ),
            image(FIG % "ip-language-levels"),
            desc(
                "The higher the language, the more it hides -- memory addresses, "
                "register allocation, instruction encoding -- and the more portable it "
                "becomes, because the same source can be translated for different "
                "processors."
            ),
        ]),
        ("Compilers and interpreters", [
            compare_grid(
                "Two ways to translate",
                "Both produce the same behaviour; they differ in when the translation happens.",
                [("Compiler",
                  "Translates the whole program in advance into an executable file. "
                  "Runs fast, reports every syntax error before it ever runs, and must "
                  "be recompiled after each change."),
                 ("Interpreter",
                  "Translates and executes line by line as the program runs. Starts "
                  "immediately and is easy to experiment with, but runs slower and may "
                  "reach a syntax error only when that line is finally executed.")],
            ),
            desc(
                "The practical consequence is worth remembering: a compiled program "
                "cannot start at all with a syntax error anywhere in it, whereas an "
                "interpreted program can run happily for an hour and then fail on a "
                "line it had not reached."
            ),
        ]),
        ("The vocabulary of a program", [
            accordion([
                ("Variable", "A named place that holds a value which may change as the program runs."),
                ("Constant", "A named value that does not change; used so a figure appears once."),
                ("Data type", "What kind of value a variable holds -- integer, real, string, boolean."),
                ("Function (procedure)", "A named block of steps that can be called from elsewhere."),
                ("Parameter (argument)", "A value passed into a function when it is called."),
                ("Return value", "The result a function hands back to whatever called it."),
                ("Comment", "A note for human readers that the computer ignores."),
            ]),
        ]),
        ("Why functions exist", [
            desc(
                "A function lets a piece of logic be written once and used many times. "
                "That is not only about typing less: when the logic has to change, it "
                "changes in one place, and everywhere that uses it is corrected at once."
            ),
            desc(
                "A function also gives a name to an idea. A block of arithmetic labelled "
                "`calculateTax` tells a reader what it is for, which the arithmetic "
                "itself does not."
            ),
        ]),
        ("Families of language", [
            table(
                ["Language", "Commonly used for", "Note"],
                [["Java", "Business systems, Android apps", "Compiled to run on a virtual machine, so it is portable"],
                 ["Python", "Scripting, data analysis, AI", "Interpreted; short and readable"],
                 ["C / C++", "Operating systems, embedded devices", "Close to the hardware, fast, demanding"],
                 ["JavaScript", "Behaviour in web pages", "Runs inside the browser"],
                 ["SQL", "Querying databases", "Describes what data is wanted, not how to fetch it"],
                 ["COBOL", "Older financial systems", "Still running in banking and government"]],
            ),
        ]),
        ("Libraries and frameworks", [
            desc(
                "Almost no program is written from nothing. A library is a collection of "
                "ready-made functions a program can call; a framework goes further and "
                "provides the overall structure, calling your code at the points it "
                "defines."
            ),
            ul([
                "Using a library saves time and avoids re-introducing solved bugs.",
                "It also creates a dependency, which must be kept updated for security.",
                "An abandoned library is a liability regardless of how good the code is.",
            ]),
        ]),
        ("Finding and fixing faults", [
            desc(
                "A bug is a fault in a program that makes it behave wrongly. Debugging "
                "is finding and removing it -- a distinct activity from testing, which "
                "is how the fault is discovered in the first place."
            ),
            accordion([
                ("Syntax error", "The code breaks the language's rules. A compiler refuses to translate it."),
                ("Runtime error", "The program starts but fails while running -- dividing by zero, for instance."),
                ("Logic error", "The program runs and produces the WRONG answer. The hardest kind, because nothing complains."),
            ]),
            desc(
                "Logic errors are why testing exists. A program that compiles and runs "
                "has proved only that it is well formed, not that it is right."
            ),
        ]),
        ("Recall practice", [
            desc("Cover the answers first."),
            flip_cards([
                ("Compiler or interpreter: runs line by line?", "Interpreter",
                 "A compiler translates the whole program before any of it runs."),
                ("Which error type produces a wrong answer silently?", "Logic error",
                 "Syntax errors stop translation; runtime errors stop execution."),
                ("What is a parameter?", "A value passed into a function",
                 "The function works on it and may return a result."),
                ("Why use a constant rather than a number?", "It appears in one place",
                 "Changing it later is one edit instead of a search."),
            ]),
        ]),
    ],
    key_terms=[
        ("Source code", "A program as written by a person in a high-level language."),
        ("Machine language", "Binary instructions the processor decodes and executes directly."),
        ("Compiler", "Translates a whole program in advance into an executable."),
        ("Interpreter", "Translates and runs a program line by line."),
        ("Variable", "A named place holding a value that may change."),
        ("Bug", "A fault that makes a program behave incorrectly."),
    ],
    summary=(
        "Processors execute machine language, so high-level source code must be "
        "translated -- by a compiler in advance, or by an interpreter as it runs, with "
        "consequences for speed, start-up and when errors surface. Programs are built "
        "from variables, functions and parameters, with functions letting logic be "
        "written once and named. Libraries supply solved problems at the cost of a "
        "dependency. Syntax and runtime errors announce themselves; logic errors do "
        "not, which is why testing exists."
    ),
    exam_notes=[
        desc(
            "The compiler-versus-interpreter distinction appears almost every sitting, "
            "usually as a consequence rather than a definition -- which one can start "
            "before the whole program is valid, which produces a separate executable."
        ),
        ul([
            "A logic error is the one that produces a wrong answer without complaint.",
            "SQL describes WHAT data is wanted, not how to get it.",
            "A framework calls your code; a library is called BY your code.",
        ]),
    ],
)


LESSONS[737] = lesson_structure(
    name="Other languages",
    intro=(
        "Not every computer language is for writing programs. Markup languages describe "
        "the structure of a document, stylesheet languages describe its appearance, and "
        "data formats describe information so that two systems can exchange it. This "
        "lesson covers the ones the IT Passport examination names."
    ),
    objectives=[
        "Explain what a markup language does.",
        "Distinguish HTML, CSS and JavaScript by their roles in a page.",
        "Describe what XML and JSON are for and how they differ.",
        "Explain what a character encoding is and why it matters.",
        "Recognise CSV and state what it can and cannot carry.",
        "Describe what a URL identifies.",
    ],
    minutes=35,
    sections=[
        ("Describing rather than computing", [
            desc(
                "A programming language says what to DO. A markup language says what "
                "something IS: this is a heading, this is a paragraph, this is a table "
                "cell. The distinction matters because markup carries no instructions "
                "and cannot loop or calculate."
            ),
            image(FIG % "ip-markup-languages"),
        ]),
        ("HTML", [
            desc(
                "HTML marks up the structure of a web page using tags in angle brackets, "
                "usually in pairs that open and close around their content."
            ),
            ul([
                "Headings, paragraphs, lists, tables, links and images each have a tag.",
                "A browser reads the tags and decides how to present them.",
                "The tags describe MEANING; appearance is left to CSS.",
            ]),
            desc(
                "An image tag carries alt text -- a short description read aloud by a "
                "screen reader and shown if the image fails to load. Omitting it on an "
                "informative image removes that information entirely for anyone not "
                "seeing the picture."
            ),
        ]),
        ("CSS and JavaScript", [
            media_text(
                FIG % "ip-markup-languages",
                "Three languages, three jobs",
                "A modern page is built from three languages that deliberately do not "
                "overlap, so that any one of them can change without disturbing the "
                "others.",
                "Why they are kept separate",
                "Keeping structure, appearance and behaviour apart means a site can be "
                "restyled without touching its content, and its content edited without "
                "understanding its styling.",
                layout="image-left"),
            table(
                ["Language", "Controls", "Example of its job"],
                [["HTML", "Structure", "This text is a level-2 heading"],
                 ["CSS", "Presentation", "Level-2 headings are dark blue and 24px"],
                 ["JavaScript", "Behaviour", "Show the menu when this button is clicked"]],
            ),
        ]),
        ("XML and JSON", [
            desc(
                "Both describe data so that one system can hand it to another without "
                "the two sharing any code. They differ in shape and in how much "
                "ceremony they carry."
            ),
            compare_grid(
                "XML against JSON",
                "Both are text, both are readable, and both are widely supported.",
                [("XML",
                  "Tags you define yourself, with attributes and namespaces. Verbose, "
                  "but supports validation against a schema, which suits document-heavy "
                  "and regulated exchange."),
                 ("JSON",
                  "Objects and arrays of simple values. Compact, and maps directly onto "
                  "the data types of most programming languages, which is why web APIs "
                  "favour it.")],
            ),
        ]),
        ("CSV and plain data", [
            desc(
                "CSV is the simplest exchange format: one record per line, fields "
                "separated by commas. Almost every spreadsheet and database can read and "
                "write it, which is precisely its value."
            ),
            ul([
                "It carries values only -- no formatting, formulas or colours.",
                "A comma inside a value must be quoted or the fields shift.",
                "There is no type information; everything is text until something interprets it.",
            ]),
        ]),
        ("Character encodings", [
            desc(
                "A character encoding maps characters to numbers. If a file is written "
                "in one encoding and read in another, the text arrives as nonsense -- "
                "which is what garbled characters on a page almost always mean."
            ),
            desc(
                "Unicode, usually as UTF-8, covers essentially every script in use and "
                "is the sensible default. Older encodings such as Shift-JIS and EUC are "
                "still met in legacy files and are the usual cause of the problem."
            ),
        ]),
        ("Addresses on the web", [
            desc(
                "A URL identifies where a resource is and how to ask for it."
            ),
            accordion([
                ("Scheme", "https -- the protocol to use. The 's' means the connection is encrypted."),
                ("Host", "www.example.com -- the server, resolved to an address by DNS."),
                ("Path", "/products/item -- which resource on that server."),
                ("Query string", "?id=42 -- parameters passed with the request."),
            ]),
            desc(
                "Personal or sensitive data should never be placed in a query string: it "
                "appears in browser history, in server logs and in the referrer sent to "
                "the next site."
            ),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Which language controls appearance?", "CSS",
                 "HTML carries structure and JavaScript behaviour."),
                ("Why does text arrive garbled?", "Encoding mismatch",
                 "Written in one encoding, read as another -- often Shift-JIS read as UTF-8."),
                ("What does CSV not carry?", "Formatting and formulas",
                 "It holds values only, one record per line."),
                ("What does the 's' in https mean?", "The connection is encrypted",
                 "It says nothing about whether the site itself is trustworthy."),
            ]),
        ]),
    ],
    key_terms=[
        ("Markup language", "A language that describes what content IS rather than what to do."),
        ("HTML", "Marks up the structure of a web page."),
        ("CSS", "Describes how marked-up content should look."),
        ("XML", "A self-describing data format using tags you define."),
        ("JSON", "A compact data format of objects and arrays, common in web APIs."),
        ("Character encoding", "The mapping from characters to numbers, such as UTF-8."),
    ],
    summary=(
        "Markup and data languages describe rather than compute. HTML carries a page's "
        "structure, CSS its appearance and JavaScript its behaviour, kept separate so "
        "each can change independently. XML and JSON both move data between systems, "
        "XML with schema validation and JSON with compactness. CSV exchanges plain "
        "values and nothing else. An encoding mismatch is the usual cause of garbled "
        "text, and a URL's query string is the wrong place for anything sensitive."
    ),
    exam_notes=[
        desc(
            "Questions here are usually recognition: given a role, name the language. "
            "The one that catches people is assuming JavaScript styles a page -- that "
            "is CSS."
        ),
        ul([
            "HTML = structure, CSS = appearance, JavaScript = behaviour.",
            "JSON maps onto programming data types; XML supports schema validation.",
            "Garbled text means an encoding mismatch, not a corrupt file.",
        ]),
    ],
)

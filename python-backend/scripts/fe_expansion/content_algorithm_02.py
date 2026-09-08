"""Basic Theory -> Algorithm and Programming, lessons 3 to 5.

Syllabus minor categories 3 (programming), 4 (programming languages) and
5 (other languages).

Minor category 4 is the largest single entry in the whole syllabus -- 319
lines, because the 2016 document enumerated the syntax of specific languages.
That enumeration is obsolete: since the 2024 revision Subject B uses a
language-independent pseudocode and no real language appears on the paper. So
this lesson teaches what survived the change and is still examined -- how
languages are classified, how source becomes something that runs, and the
concepts every language expresses differently -- rather than the syntax of any
one of them.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Basic Theory"
MIDDLE = "Algorithm and Programming"

# ==========================================================================
# Lesson 3: Programming
# ==========================================================================

_prog_sections = [
    ("From Algorithm to Program", [
        desc(
            "An algorithm is a method; a program is that method written so a "
            "machine can carry it out. The gap between them is where most "
            "defects live, because the algorithm was correct and the program "
            "expressing it was not."
        ),
        desc(
            "This lesson is about that gap: the constructs every language "
            "provides, the types values carry, how a program is organised so "
            "it can be understood, and the behaviours -- scope, parameter "
            "passing, side effects -- that decide what a piece of code "
            "actually does as opposed to what it appears to do."
        ),
        table(
            ["Concern", "The question it answers"],
            [["Control structures", "In what order do the steps run?"],
             ["Data types", "What values may a name hold, and what may be "
                            "done with them?"],
             ["Scope and lifetime", "Where is a name visible, and how long "
                                    "does its value last?"],
             ["Parameter passing", "Does a called procedure see a copy or the "
                                   "original?"],
             ["Modularity", "How is a large program divided so each part can "
                            "be understood alone?"]],
            caption="The five concerns this lesson covers.",
            footer="Every one of them is examined by being traced. The "
                   "question is never 'what is scope' but 'what does this "
                   "print'."),
    ]),

    ("The Three Control Structures", [
        desc(
            "Structured programming rests on a result that is stronger than "
            "it looks: any computable procedure can be written using only "
            "three control structures. Nothing else is needed, and the "
            "discipline of using only these three is what makes a program "
            "readable."
        ),
        content_tabs(
            "SEQUENCE, SELECTION, ITERATION",
            "Every program is a composition of exactly these, nested inside "
            "one another.",
            [("Sequence", "One statement after another",
              "Statements execute in written order, each completing before "
              "the next begins. The default, and the only structure that "
              "needs no keyword. Its correctness usually depends on order -- "
              "swapping two lines that look independent is a classic source "
              "of defects when one quietly depends on the other's effect."),
             ("Selection", "Choose between alternatives",
              "if-then, if-then-else, and the multi-way case or switch. The "
              "condition is evaluated and exactly one branch runs. An "
              "if-then with no else has a silent second branch -- do nothing "
              "-- and forgetting that branch exists is a common oversight, "
              "because the code does not show it."),
             ("Iteration", "Repeat while a condition holds",
              "while, for, and repeat-until. The essential distinction is "
              "WHERE the condition is tested: a while loop tests before the "
              "body and may run zero times; a repeat-until loop tests after "
              "and always runs at least once. On an empty collection those "
              "two behave completely differently, which is exactly what "
              "examination items exploit.")]),
        desc(
            "The historical argument behind this is worth a sentence. "
            "Programs written with unrestricted jumps -- goto -- could route "
            "control anywhere, so understanding one line required "
            "understanding every line that might have jumped to it. "
            "Restricting control flow to structures with a single entry and a "
            "single exit means a block can be understood on its own, which is "
            "the only way large programs become tractable."
        ),
    ]),

    ("Loops in Detail", [
        desc(
            "Loops account for most Subject B items and most real defects, "
            "so they deserve their own treatment."
        ),
        table(
            ["Form", "Condition tested", "Minimum runs", "Suits"],
            [["while", "Before the body", "0",
              "Unknown count; may need to do nothing"],
             ["repeat-until", "After the body", "1",
              "Something that must happen at least once"],
             ["for (counted)", "Before the body, on a counter", "0",
              "A known number of repetitions"],
             ["for-each", "Per element of a collection", "0",
              "Visiting every element without index arithmetic"]],
            caption="Four loop forms and the one property that separates "
                    "them.",
            footer="The minimum-runs column is the whole examination. Given "
                   "an empty collection, a while loop does nothing and a "
                   "repeat-until loop runs its body once on data that is not "
                   "there."),
        desc(
            "Three ways a loop goes wrong, and all three survive casual "
            "reading because the output is nearly right."
        ),
        ul([
            "The condition never becomes false, because a variable it depends "
            "on is not updated on every path through the body.",
            "The loop runs one time too many or too few -- an off-by-one, "
            "usually from confusing 'less than' with 'less than or equal' at "
            "the array bound.",
            "The body modifies the collection being iterated over, so "
            "elements are skipped or visited twice.",
        ]),
        desc(
            "The defence is the trace table from the previous lesson, applied "
            "to the smallest input rather than a comfortable one. A loop "
            "traced on a five-element array proves very little; the same loop "
            "traced on an empty array and a one-element array proves nearly "
            "everything."
        ),
    ]),

    ("Data Types", [
        desc(
            "A type is a set of possible values together with the operations "
            "valid on them. It exists to catch nonsense early: adding a "
            "length to a date is meaningless, and a type system is what "
            "notices."
        ),
        table(
            ["Type", "Holds", "Typical size", "Watch for"],
            [["Integer", "Whole numbers", "16, 32 or 64 bits",
              "Silent overflow at the range boundary"],
             ["Floating point", "Approximate real numbers", "32 or 64 bits",
              "Rounding; never compare with equality"],
             ["Boolean", "True or false", "1 bit, usually padded",
              "Different languages coerce differently"],
             ["Character", "One symbol", "1 to 4 bytes",
              "Depends entirely on the encoding"],
             ["String", "A sequence of characters", "Variable",
              "Concatenation in a loop is quadratic"],
             ["Array", "Fixed-size same-typed sequence", "n x element size",
              "Index bounds"],
             ["Record / structure", "Named fields of mixed types", "Varies",
              "Copy semantics differ by language"],
             ["Pointer / reference", "The location of a value",
              "Address width", "Null, and unintended sharing"]],
            caption="The types the syllabus expects, and what each one costs "
                    "you if you are careless.",
            footer="Integer overflow and floating-point comparison are the "
                   "two that produce wrong answers rather than errors, which "
                   "is why the Discrete Mathematics lesson spent so long on "
                   "them."),
        compare_grid(
            "TWO AXES ON WHICH TYPE SYSTEMS DIFFER",
            "The examination asks which category a described language falls "
            "into, so learn the axes rather than the language names.",
            [("Static against dynamic typing",
              "Static: a variable's type is fixed and checked at compile "
              "time, so type errors are found before the program runs. "
              "Dynamic: the type travels with the value and is checked as it "
              "runs, so the same errors surface only when that line "
              "executes."),
             ("Strong against weak typing",
              "Strong: the language refuses to silently reinterpret one type "
              "as another. Weak: it converts implicitly, which is convenient "
              "and produces surprises -- a string quietly becoming a number, "
              "or the reverse, in a comparison.")]),
    ]),

    ("Variables, Scope and Lifetime", [
        desc(
            "A variable is a named location holding a value. Two questions "
            "about it are examined constantly and are genuinely different: "
            "WHERE the name can be used, and HOW LONG the value survives."
        ),
        table(
            ["", "Scope -- where visible", "Lifetime -- how long it exists"],
            [["Local variable", "Inside its block or procedure only",
              "From entry to exit of that procedure"],
             ["Global variable", "Everywhere in the program",
              "The whole run of the program"],
             ["Static local variable", "Inside its procedure only",
              "The whole run -- it survives between calls"],
             ["Parameter", "Inside the procedure",
              "From entry to exit of that call"]],
            caption="Scope and lifetime are independent, which the static "
                    "local proves.",
            footer="A static local is visible in one procedure and remembers "
                   "its value between calls -- narrow scope, long lifetime. "
                   "That combination is exactly what makes it useful and what "
                   "makes it surprising."),
        desc(
            "SHADOWING is where scope questions get their teeth. When a local "
            "variable has the same name as a global one, the local hides the "
            "global inside its block: assignments there change the local and "
            "leave the global untouched. The examination gives a short program "
            "with a repeated name and asks what is printed, and the answer "
            "turns on which declaration is in scope at each line."
        ),
        desc(
            "The practical guidance behind the trivia is that global "
            "variables are avoided precisely because scope and lifetime are "
            "both maximal: any part of the program can change one, at any "
            "time, so understanding a value's history means reading "
            "everything. Narrow scope is what makes a piece of code "
            "understandable in isolation."
        ),
    ]),

    ("Parameter Passing", [
        desc(
            "When a procedure is called with an argument, does it receive a "
            "copy or the original? This single question decides whether the "
            "caller's variable can be changed, and it is examined by giving a "
            "short program and asking what is printed afterwards."
        ),
        table(
            ["Mechanism", "What is passed",
             "Can the caller's variable change?"],
            [["Call by value", "A copy of the value",
              "No -- the procedure has its own copy"],
             ["Call by reference", "The location of the variable",
              "Yes -- assignment inside changes the original"],
             ["Call by value with a reference value",
              "A copy of a reference to a shared object",
              "The variable cannot be rebound, but the object it points to "
              "can be modified"]],
            caption="Three mechanisms, and what each permits.",
            footer="The third row causes most of the confusion in modern "
                   "languages. Passing an array or object usually copies the "
                   "REFERENCE, so the callee cannot make the caller's "
                   "variable point elsewhere but can freely change the "
                   "contents it points at."),
        desc(
            "That third case is worth stating twice because it looks like a "
            "contradiction. Assigning a whole new array inside the procedure "
            "leaves the caller's array untouched -- only the local copy of the "
            "reference was rebound. Assigning to one ELEMENT of the array "
            "changes what the caller sees, because both references point at "
            "the same storage. Examination items are built on exactly this "
            "distinction."
        ),
    ]),

    ("Modularity and Structured Design", [
        desc(
            "A program of any size must be divided, and how it is divided "
            "determines whether it can be changed later. The syllabus names "
            "two measures of a good division, and they pull in opposite "
            "directions from the same goal."
        ),
        compare_grid(
            "COHESION AND COUPLING",
            "Aim for high cohesion within a module and low coupling between "
            "modules. This pair is examined here and again in Software "
            "Design.",
            [("Cohesion -- want it HIGH",
              "How strongly the things inside one module belong together. A "
              "module doing one well-defined job is highly cohesive; one "
              "holding whatever did not fit elsewhere is not, and cannot be "
              "named, tested or reused as a unit."),
             ("Coupling -- want it LOW",
              "How much modules depend on each other's internals. Two modules "
              "communicating only through a small defined interface are "
              "loosely coupled, and either can be rewritten alone. Two "
              "sharing global variables are tightly coupled, and neither can "
              "be changed safely.")]),
        desc(
            "The test for both is a question about change: if this "
            "requirement altered, how many modules would I have to open? High "
            "cohesion means the answer is usually one. Low coupling means the "
            "change does not leak into modules that had nothing to do with "
            "it."
        ),
        desc(
            "Modularity also gives the practical benefits the examination "
            "lists: a module can be tested on its own, developed by a "
            "different person in parallel, reused in another program, and "
            "replaced without disturbing its callers -- all of which depend on "
            "the interface being narrower than the implementation."
        ),
    ]),

    ("Program Style and Readability", [
        desc(
            "Code is read far more often than it is written, including by the "
            "person who wrote it six months later. Style is not decoration; "
            "it is what makes the second reading possible."
        ),
        ul([
            "Names should say what a thing IS or DOES. A variable called "
            "`remainingCredit` needs no comment; one called `x` needs one on "
            "every line it appears.",
            "Indentation should reflect nesting exactly, because a reader "
            "uses it to find the end of a block faster than they can count "
            "braces.",
            "Comments should explain WHY, not what. A comment restating the "
            "code adds a second thing to keep in step and goes stale the "
            "first time the code changes.",
            "A procedure should do one thing. If its name needs an 'and', it "
            "is two procedures.",
            "Magic numbers should be named constants, so the value can be "
            "changed in one place and its meaning is visible where it is "
            "used.",
            "Consistency beats personal preference. A codebase with one "
            "imperfect convention is easier to read than one with three good "
            "ones.",
        ]),
        desc(
            "The examination touches this through coding standards and "
            "reviews rather than by judging style directly, but the "
            "underlying claim is one it does test: maintainability is a "
            "quality attribute with real cost consequences, and most of a "
            "system's total cost is incurred after it first works."
        ),
    ]),

    ("Errors and Exceptions", [
        desc(
            "Things go wrong at run time that no amount of care eliminates: a "
            "file is missing, a network call fails, a user types a letter "
            "where a number was expected. How a program responds is a design "
            "decision."
        ),
        content_accordion(
            "THREE KINDS OF ERROR, AND WHEN EACH IS FOUND",
            "The examination asks which category a described fault belongs "
            "to, and the discriminating question is when it becomes visible.",
            [("Syntax error",
              "The source does not conform to the language's grammar -- a "
              "missing bracket or semicolon. Caught by the compiler before "
              "the program runs, and the cheapest kind of error there is "
              "because it cannot reach a user."),
             ("Runtime error",
              "The program is well formed but attempts something impossible "
              "while running: dividing by zero, reading past an array's end, "
              "following a null reference. Detected as it happens, and only "
              "on the input that triggers it."),
             ("Logic error",
              "The program runs to completion and produces the wrong answer. "
              "No tool reports it, because nothing is technically wrong -- "
              "the machine did exactly what was written. Found only by "
              "testing against expected results, which is why testing exists "
              "as a discipline."),
             ("Exception handling",
              "The structured mechanism for runtime errors: a try block "
              "containing code that might fail, a catch block deciding what "
              "to do, and often a finally block that releases resources "
              "whether or not anything failed. Its value is separating the "
              "normal path from the error path, so the main logic stays "
              "readable.")]),
        desc(
            "One rule about exception handling is worth stating because it is "
            "violated so often: catching an exception and doing nothing is "
            "worse than not catching it. The failure still happened, the "
            "program continues on corrupt assumptions, and the evidence has "
            "been destroyed. Either handle it meaningfully or let it "
            "propagate to somewhere that can."
        ),
    ]),

    ("A Worked Subject B Trace", [
        desc(
            "A procedure receives an array of integers and an integer target. "
            "It returns the number of pairs of DISTINCT positions whose values "
            "sum to the target."
        ),
        ol([
            "Set count to 0. The outer loop runs i from the first index to "
            "the second-to-last; the inner loop runs j from i+1 to the last.",
            "Starting j at i+1 rather than 0 is the whole design: it visits "
            "each unordered pair exactly once, so nothing is counted twice "
            "and no element is paired with itself.",
            "For the array [2, 4, 3, 5, 1] with target 6: i=0 (value 2) pairs "
            "with j=1 (4) -- sum 6, count 1. Then 2+3, 2+5, 2+1: no more.",
            "i=1 (value 4): 4+3, 4+5, 4+1 -- none sum to 6.",
            "i=2 (value 3): 3+5, 3+1 -- none.",
            "i=3 (value 5): 5+1 = 6, count 2.",
            "The answer is 2. The inner loop ran 4+3+2+1 = 10 times, which is "
            "n(n-1)/2 -- quadratic, as any pair of nested loops over the same "
            "data must be.",
        ]),
        desc(
            "Two things that item is really testing. First, whether you "
            "noticed that j starts at i+1: starting it at 0 counts every pair "
            "twice and gives 4, which will be an option. Second, whether you "
            "can state the complexity from the loop shape without counting, "
            "which is the skill Subject A asks for separately."
        ),
    ]),

    ("Procedures, Functions and the Call Stack", [
        desc(
            "Dividing a program into named units is the mechanism modularity "
            "actually uses, and the syllabus distinguishes two kinds by "
            "whether a value comes back."
        ),
        compare_grid(
            "PROCEDURE AND FUNCTION",
            "The distinction is sharper in some languages than others, but "
            "the concepts are always separate.",
            [("Procedure",
              "Called for its EFFECT: it changes state, writes output, "
              "updates a record. Returns nothing, so it cannot appear inside "
              "an expression."),
             ("Function",
              "Called for its VALUE: it computes a result and returns it, so "
              "it can appear wherever a value is expected. A PURE function "
              "returns the same result for the same arguments and changes "
              "nothing, which makes it trivially testable.")]),
        image(fig("recursion-frames")),
        desc(
            "Every call in progress occupies a stack frame holding its "
            "parameters, its local variables and the address to resume at "
            "when it returns. Frames are pushed on call and popped on return, "
            "which is precisely why locals vanish when a procedure exits and "
            "why recursion depth costs memory."
        ),
        desc(
            "SIDE EFFECTS are anything a unit does beyond returning a value: "
            "modifying a global, writing a file, changing a parameter's "
            "contents. They are not wrong -- a program with no side effects "
            "does nothing observable -- but they are what makes a unit "
            "impossible to understand in isolation, because its behaviour now "
            "depends on state the reader cannot see from the call."
        ),
    ]),

    ("Program Structure in Memory", [
        desc(
            "A running program's memory is divided into regions with quite "
            "different behaviour, and several examination items turn on "
            "knowing which region something lives in."
        ),
        table(
            ["Region", "Holds", "Managed by", "Lifetime"],
            [["Code (text)", "The machine instructions", "The loader",
              "The whole run; usually read-only"],
             ["Static / global", "Globals and static locals", "The compiler",
              "The whole run"],
             ["Stack", "Call frames: parameters and locals", "Automatically",
              "Until the procedure returns"],
             ["Heap", "Dynamically allocated data", "The programmer or a "
                                                    "garbage collector",
              "Until explicitly freed or collected"]],
            caption="The four regions of a running program's memory.",
            footer="The stack is fast and automatic but bounded, which is why "
                   "deep recursion overflows it. The heap is large and "
                   "flexible and must be managed, which is why it is where "
                   "memory leaks happen."),
        desc(
            "Two failure modes follow directly from this table. A STACK "
            "OVERFLOW is recursion or allocation exceeding the stack's fixed "
            "bound. A MEMORY LEAK is heap allocation that is never released, "
            "so a long-running process grows until it is killed -- which is "
            "why a leak is often invisible in testing and fatal in "
            "production."
        ),
    ]),

    ("Concurrency, Briefly", [
        desc(
            "When two parts of a program run at once and share data, the "
            "order in which their steps interleave is no longer determined by "
            "the code. The syllabus introduces the vocabulary here and "
            "returns to it in Operating Systems."
        ),
        content_accordion(
            "THE THREE TERMS TO RECOGNISE",
            "Each names a specific hazard, and examination items describe the "
            "symptom and ask for the name.",
            [("Race condition",
              "The result depends on the timing of two operations rather than "
              "on the program. Two processes each read a balance of 100, each "
              "add 50, each write back 150 -- and one update has vanished "
              "with nothing having failed. It is intermittent by nature, "
              "which is what makes it so hard to reproduce."),
             ("Critical section",
              "The region of code that touches shared data and must not be "
              "entered by two threads at once. Protecting it is what "
              "mutual exclusion means, and it is the answer to a race "
              "condition."),
             ("Deadlock",
              "Two or more parties each holding a resource the other needs, "
              "so none can proceed. Nothing has crashed; everything is "
              "waiting for ever. Consistent lock ordering is the standard "
              "prevention.")]),
        desc(
            "The lesson to carry forward is that concurrent code cannot be "
            "verified by reading it in one order, because the order is not "
            "yours to choose. That is why shared mutable state is minimised "
            "wherever possible, and why pure functions -- which have no state "
            "to share -- are so much easier to reason about."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where programming items are lost."),
        ul([
            "Assuming a repeat-until loop may run zero times. It always runs "
            "its body at least once.",
            "Confusing scope with lifetime. A static local has narrow scope "
            "and long lifetime.",
            "Expecting call by value to change the caller's variable, or "
            "expecting a passed array's contents to be safe from "
            "modification.",
            "Comparing floating-point values with equality.",
            "Treating a logic error as something a compiler could have "
            "caught.",
            "Swallowing an exception without handling it, which hides the "
            "failure and continues on bad assumptions.",
            "Modifying a collection while iterating over it.",
            "Reading nested loops over the same data as anything other than "
            "quadratic.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing."),
        review_cards(
            "TEST YOURSELF",
            "Six distinctions this lesson exists to fix.",
            [("while against repeat-until",
              "Tested before the body against after it",
              "A while loop may run zero times; repeat-until always runs at "
              "least once. On empty input they behave completely "
              "differently."),
             ("Scope against lifetime",
              "Where a name is visible against how long its value lasts",
              "Independent: a static local variable is visible in one "
              "procedure and keeps its value between calls."),
             ("Call by value against by reference",
              "A copy against the original's location",
              "By value, the caller's variable cannot change. Passing an "
              "object usually copies a REFERENCE -- the variable cannot be "
              "rebound, but the contents can be changed."),
             ("Cohesion and coupling",
              "High cohesion within, low coupling between",
              "Ask what a change would cost: high cohesion means one module "
              "opens, low coupling means the change does not leak."),
             ("Syntax, runtime and logic errors",
              "Compile time, run time, and never",
              "Only a logic error produces a program that completes and is "
              "wrong. No tool finds it; only testing does."),
             ("Static against dynamic typing",
              "Checked at compile time against at run time",
              "A separate axis from strong against weak, which is about "
              "whether the language silently converts between types.")]),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Programming is the vocabulary later lessons assume."),
        ul([
            "Subject B is this lesson plus the algorithms one, under time "
            "pressure.",
            "Cohesion and coupling return as the central criteria of Software "
            "Architecture Design.",
            "Exception handling returns in Software Construction and in "
            "reliability design.",
            "Type systems and compilation return in the next lesson.",
            "Array bounds and null references return in Security as whole "
            "vulnerability classes.",
            "Coding standards and reviews return in Software Construction and "
            "in Project Quality Management.",
        ]),
    ]),
]

_prog_quiz = [
    mcq("EASY",
        "Structured programming holds that any procedure can be expressed "
        "using three control structures.\n\n"
        "Which three?",
        [("Sequence, selection, iteration", True),
         ("Assignment, comparison, jump", False),
         ("Input, processing, output", False),
         ("Declaration, definition, invocation", False)],
        "Sequence executes statements in order, selection chooses between "
        "branches, and iteration repeats while a condition holds. The claim "
        "is that these three suffice for any computable procedure, which is "
        "why unrestricted jumps can be dispensed with -- and dispensing with "
        "them is what lets a block be understood without reading everything "
        "that might have jumped into it. Input-processing-output describes a "
        "program's overall shape rather than its control flow."),

    mcq("AVERAGE",
        "A repeat-until loop and a while loop are both given a condition that "
        "is false before the loop begins.\n\n"
        "How many times does each body execute?",
        [("Both execute zero times", False),
         ("The while body zero times, the repeat-until body once", True),
         ("The while body once, the repeat-until body zero times", False),
         ("Both execute once", False)],
        "A while loop tests its condition BEFORE the body, so a condition "
        "already false means the body never runs. A repeat-until loop tests "
        "AFTER the body, so the body has already executed once by the time "
        "the condition is examined. On an empty collection this is the "
        "difference between doing nothing and processing an element that is "
        "not there, which is why the distinction is examined so often."),

    mcq("AVERAGE",
        "Inside a procedure, a local variable is declared with the same name "
        "as an existing global variable, and a value is assigned to it.\n\n"
        "What is the effect on the global variable?",
        [("It is updated, since the names refer to the same storage.", False),
         ("It is unchanged, because the local declaration shadows it.", True),
         ("The program fails to compile because the name is duplicated.",
          False),
         ("It is unchanged, but only until the procedure returns.", False)],
        "A local declaration shadows an outer one of the same name for the "
        "duration of its block, so every reference inside the procedure "
        "resolves to the local and the global is untouched. Duplicating a "
        "name across scopes is legal in essentially every language, which is "
        "exactly why shadowing is a source of confusion rather than a "
        "compile error. The global is unaffected permanently, not "
        "temporarily."),

    mcq("HARD",
        "An array is passed to a procedure in a language that passes "
        "arguments by value. Inside, the procedure assigns a completely new "
        "array to the parameter, and separately assigns a new value to "
        "element 0 of the original parameter before doing so.\n\n"
        "What does the caller observe?",
        [("Both changes are visible to the caller.", False),
         ("Neither change is visible to the caller.", False),
         ("The element assignment is visible; the whole-array assignment is "
          "not.", True),
         ("The whole-array assignment is visible; the element assignment is "
          "not.", False)],
        "What is copied is the REFERENCE to the array, not the array itself. "
        "Assigning to element 0 reaches through that reference to the shared "
        "storage, so the caller sees it. Assigning a whole new array rebinds "
        "only the procedure's local copy of the reference, leaving the "
        "caller's variable pointing where it always did. This is the single "
        "most misunderstood aspect of parameter passing in modern languages, "
        "and it is why 'pass by value' and 'the callee cannot change my data' "
        "are not the same statement."),

    mcq("EASY",
        "A program compiles without error, runs to completion, and produces "
        "an incorrect result.\n\n"
        "What kind of error is this?",
        [("A syntax error", False),
         ("A runtime error", False),
         ("A logic error", True),
         ("A type error", False)],
        "The program is grammatically valid, so no syntax error exists, and "
        "it completed without attempting anything impossible, so no runtime "
        "error occurred. The machine did precisely what was written; what was "
        "written was wrong. No compiler or runtime can detect this, because "
        "nothing distinguishes an intended result from an unintended one "
        "without a statement of what was expected -- which is what a test is."),

    mcq("AVERAGE",
        "Two modules communicate only through a small, well-defined "
        "interface, and each performs a single clearly named job.\n\n"
        "How would this design be described?",
        [("High cohesion and tight coupling", False),
         ("Low cohesion and loose coupling", False),
         ("High cohesion and loose coupling", True),
         ("Low cohesion and tight coupling", False)],
        "Cohesion measures how strongly the contents of one module belong "
        "together, and a module doing a single clearly named job has high "
        "cohesion. Coupling measures dependence between modules, and "
        "communicating only through a narrow interface is loose coupling. "
        "High cohesion with loose coupling is the goal in both structured and "
        "object-oriented design, because it means a change usually opens one "
        "module and does not leak into others."),

    mcq("HARD",
        "Consider nested loops where the outer index i runs over every "
        "position of an n-element array and the inner index j runs from i+1 "
        "to the last position.\n\n"
        "How many times does the inner body execute in total?",
        [("n", False),
         ("n squared", False),
         ("n(n-1)/2", True),
         ("n log n", False)],
        "The inner loop runs n-1 times when i is 0, n-2 times when i is 1, "
        "and so on down to once -- the sum of the integers from 1 to n-1, "
        "which is n(n-1)/2. That is quadratic growth, so the algorithm is "
        "O(n^2) even though it does only half the work of a full nested pair. "
        "Starting j at i+1 rather than 0 is what halves it, and it is also "
        "what makes each unordered pair be visited exactly once rather than "
        "twice."),

    mcq("AVERAGE",
        "A variable declared inside a procedure retains its value between "
        "successive calls to that procedure, but cannot be referred to "
        "anywhere else in the program.\n\n"
        "How are its scope and lifetime described?",
        [("Global scope and program lifetime", False),
         ("Local scope and program lifetime", True),
         ("Local scope and procedure lifetime", False),
         ("Global scope and procedure lifetime", False)],
        "This is a static local variable, and it is the clearest evidence "
        "that scope and lifetime are independent properties. Its scope is "
        "local -- visible only inside the procedure -- while its lifetime "
        "spans the whole program, which is why its value survives between "
        "calls. An ordinary local has local scope and procedure lifetime, and "
        "would be reinitialised on every call."),

    mcq("AVERAGE",
        "In which situation does a language's type system catch an error "
        "BEFORE the program is run?",
        [("When the language is dynamically typed", False),
         ("When the language is statically typed", True),
         ("When the language is weakly typed", False),
         ("Whenever the error involves a numeric type", False)],
        "Static typing fixes each variable's type at compile time and checks "
        "operations against it, so a type mismatch is reported before "
        "execution. Dynamic typing attaches the type to the value and checks "
        "as the code runs, so the same mistake surfaces only when that line "
        "executes -- possibly in production. Strong versus weak is a separate "
        "axis entirely, describing whether the language converts between "
        "types implicitly rather than when it checks."),

    mcq("HARD",
        "During code review, a block is found that catches an exception and "
        "then does nothing with it.\n\n"
        "What is the principal objection?",
        [("Catching exceptions is slower than allowing them to propagate.",
          False),
         ("The failure still occurred, but the program continues as though "
          "it had not.", True),
         ("An empty catch block prevents the finally block from running.",
          False),
         ("Exceptions should only ever be caught in the outermost "
          "procedure.", False)],
        "Swallowing an exception discards the evidence that something failed "
        "while allowing execution to continue on assumptions that are now "
        "wrong -- so the eventual symptom appears far from the cause, and the "
        "information needed to diagnose it is gone. It is worse than not "
        "catching at all. Performance is irrelevant here, a finally block "
        "still runs, and catching close to where a failure can be handled "
        "meaningfully is good practice rather than bad."),
]

LESSON_PROGRAMMING = lesson(
    MAJOR, MIDDLE,
    "Programming: Structure, Style, Data Types and Program Behaviour",
    _prog_quiz,
    lesson_structure(
        "Programming: Structure, Style, Data Types and Program Behaviour",
        "This lesson covers the gap between an algorithm and a program that "
        "expresses it, which is where most defects live. It works through the "
        "three control structures every program is built from and the loop "
        "forms that differ only in where the condition is tested, the data "
        "types values carry and what each costs you when handled carelessly, "
        "the independent questions of scope and lifetime, what a called "
        "procedure can and cannot change about its caller's data, and how a "
        "program is divided so that a later change opens one module rather "
        "than ten. It closes on errors -- and on the one kind no tool will "
        "ever find for you.",
        [
            "Express any procedure using sequence, selection and iteration",
            "Choose between loop forms by where the condition is tested and "
            "predict behaviour on empty input",
            "Identify the data types the syllabus names and the failure each "
            "invites",
            "Distinguish static from dynamic and strong from weak typing",
            "Distinguish scope from lifetime and predict the effect of "
            "shadowing",
            "Predict what a procedure can change about its caller's data "
            "under each parameter-passing mechanism",
            "Apply cohesion and coupling to judge a modular design",
            "Classify a fault as a syntax, runtime or logic error",
        ],
        75,
        _prog_sections,
        [
            ("Sequence, selection, iteration",
             "The three control structures sufficient to express any "
             "computable procedure. Restricting control flow to them is what "
             "makes a block understandable without reading the whole "
             "program."),
            ("while loop",
             "A loop testing its condition before the body, so it may execute "
             "zero times."),
            ("repeat-until loop",
             "A loop testing its condition after the body, so it always "
             "executes at least once -- including on data that is not there."),
            ("Data type",
             "A set of possible values together with the operations valid on "
             "them. Its purpose is to make nonsense detectable."),
            ("Static typing",
             "Types fixed and checked at compile time, so mismatches are "
             "found before the program runs."),
            ("Dynamic typing",
             "Types carried by values and checked as the program runs, so "
             "mismatches surface only when that line executes."),
            ("Strong and weak typing",
             "Whether the language refuses to reinterpret one type as "
             "another, or converts implicitly. A separate axis from static "
             "versus dynamic."),
            ("Scope",
             "The region of a program in which a name is visible."),
            ("Lifetime",
             "The period during which a variable's storage and value exist. "
             "Independent of scope: a static local has narrow scope and full "
             "program lifetime."),
            ("Shadowing",
             "A local declaration hiding an outer one of the same name, so "
             "assignments inside the block leave the outer variable "
             "untouched."),
            ("Call by value",
             "Passing a copy, so the callee cannot change the caller's "
             "variable. When the value copied is a reference, the object it "
             "points to can still be modified."),
            ("Call by reference",
             "Passing the location of the caller's variable, so assignment "
             "inside the procedure changes the original."),
            ("Cohesion",
             "How strongly the contents of one module belong together. Wanted "
             "high: a module doing one nameable job."),
            ("Coupling",
             "How much modules depend on each other's internals. Wanted low: "
             "communication through a narrow defined interface."),
            ("Syntax error",
             "Source that violates the language's grammar. Caught by the "
             "compiler, and therefore the cheapest error to have."),
            ("Runtime error",
             "A well-formed program attempting something impossible while "
             "running -- division by zero, an out-of-range index, a null "
             "reference."),
            ("Logic error",
             "A program that completes and produces the wrong answer. No tool "
             "detects it, because nothing is technically wrong; only testing "
             "against expected results finds it."),
            ("Exception handling",
             "The structured mechanism separating the normal path from the "
             "error path -- try, catch, finally. Catching without handling is "
             "worse than not catching."),
        ],
        "A program is an algorithm written so a machine can run it, and the "
        "gap between the two is where defects live. Every program composes "
        "just three control structures, and the loop forms differ in one "
        "respect that decides their behaviour on empty input: a while loop "
        "tests before the body and may run zero times, a repeat-until tests "
        "after and always runs once. Types define what values a name may hold "
        "and what may be done with them, with two independent axes worth "
        "keeping apart -- static against dynamic is about WHEN types are "
        "checked, strong against weak about whether the language converts "
        "silently. Scope and lifetime are likewise independent, which a static "
        "local proves by being visible in one procedure and remembering its "
        "value for the whole run; shadowing follows from scope, and is why a "
        "local assignment can leave an identically named global untouched. "
        "Parameter passing decides what a callee can change, and the case "
        "that catches everyone is passing a reference by value: the variable "
        "cannot be rebound, but the object it points at can be freely "
        "modified. A program is divided well when cohesion is high inside "
        "modules and coupling low between them, tested by asking how many "
        "modules a change would open. And of the three kinds of error, only a "
        "logic error produces a program that runs to completion and is wrong "
        "-- which no compiler will ever catch, and is the entire reason "
        "testing is a discipline.",
        exam_notes=[
            desc(
                "Programming appears on Subject A as short conceptual items "
                "and IS Subject B, where every question traces code built "
                "from these constructs."
            ),
            ul([
                "Predicting loop behaviour, especially on empty or "
                "single-element input.",
                "Tracing a short program with shadowed names to its output.",
                "Determining what a procedure changed about its caller's "
                "data.",
                "Classifying a described fault as syntax, runtime or logic.",
                "Judging a design by cohesion and coupling.",
                "Identifying a type system as static or dynamic, strong or "
                "weak.",
                "Stating the complexity implied by a loop structure.",
            ]),
            desc(
                "Trace with the edge input, not a convenient one. Empty, "
                "single-element, and last-element cases are where the "
                "distractors come from, because that is where real code goes "
                "wrong."
            ),
        ],
    ))

LESSONS = [LESSON_PROGRAMMING]

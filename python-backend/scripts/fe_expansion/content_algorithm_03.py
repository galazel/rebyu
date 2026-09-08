"""Basic Theory -> Algorithm and Programming, lessons 4 and 5.

Syllabus minor categories 4 (programming languages) and 5 (other languages).

Minor category 4 is the longest entry in the whole 2016 syllabus because it
enumerated the syntax of named languages. That enumeration is now obsolete:
since the 2024 revision Subject B uses a language-independent pseudocode and
no real programming language appears on the paper at all. What survives, and
is still examined, is the classification -- how languages differ, how source
becomes something that runs, and which concepts every language expresses in
its own way. This lesson teaches that and does not teach anyone's syntax.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Basic Theory"
MIDDLE = "Algorithm and Programming"

# ==========================================================================
# Lesson 4: Programming languages
# ==========================================================================

_lang_sections = [
    ("Why Languages Differ At All", [
        desc(
            "Every programming language expresses the same three control "
            "structures and the same data types, so it is reasonable to ask "
            "why there are hundreds of them. The answer is that a language is "
            "a set of decisions about what to make easy, and different work "
            "wants different things made easy."
        ),
        table(
            ["Decision", "One way", "The other way"],
            [["When types are checked", "Compile time -- errors found early",
              "Run time -- more flexible, later failures"],
             ["Who manages memory", "The programmer -- predictable, "
                                    "error-prone",
              "A collector -- safe, with unpredictable pauses"],
             ["How code is organised", "Around procedures and data",
              "Around objects, or around expressions"],
             ["When translation happens", "Once, ahead of time -- fast to run",
              "Each run -- fast to start, portable"],
             ["How close to the hardware", "Close -- control and speed",
              "Distant -- portability and safety"]],
            caption="Five decisions, and the trade each one makes.",
            footer="No column is correct. An operating system kernel and a "
                   "reporting script want opposite answers to nearly every "
                   "row, which is why both kinds of language persist."),
        desc(
            "The examination does not ask you to prefer a language. It asks "
            "you to classify one from a description of its behaviour, which "
            "means the categories below are what matters and nobody's syntax "
            "is."
        ),
    ]),

    ("Generations of Language", [
        desc(
            "The oldest classification, and still examined. Each generation "
            "moves further from the machine and closer to the problem."
        ),
        table(
            ["Generation", "What it is", "Written as", "Portable?"],
            [["First (1GL)", "Machine code", "Binary the processor executes",
              "No -- tied to one processor"],
             ["Second (2GL)", "Assembly language",
              "Mnemonics for machine instructions",
              "No -- tied to one processor"],
             ["Third (3GL)", "Procedural high-level languages",
              "Statements describing HOW", "Yes, once recompiled"],
             ["Fourth (4GL)", "Problem-oriented languages",
              "Statements describing WHAT -- SQL, report generators",
              "Yes"],
             ["Fifth (5GL)", "Declarative and logic languages",
              "Constraints and rules, with the system finding the method",
              "Yes"]],
            caption="Each generation raises the level of abstraction.",
            footer="The dividing line worth remembering is between third and "
                   "fourth: a 3GL says HOW to compute the result, a 4GL says "
                   "WHAT result is wanted. SQL is the canonical 4GL, and it "
                   "is why nobody writes a join algorithm by hand."),
        desc(
            "Assembly language deserves a note because it is the only "
            "generation where the mapping is one instruction to one machine "
            "operation. That makes it exact and unproductive: an assembler "
            "translates it mechanically, with no optimisation and no "
            "portability, which is why it survives only where the last "
            "percent of control genuinely matters -- boot code, device "
            "drivers, and a few tight loops."
        ),
    ]),

    ("How Source Becomes Something That Runs", [
        desc(
            "Source code is text. Getting from that text to a running process "
            "happens in one of three ways, and the difference is when "
            "translation occurs and how often."
        ),
        image(fig("compile-vs-interpret")),
        content_tabs(
            "THREE EXECUTION MODELS",
            "The trade throughout is start-up cost against running speed.",
            [("Compiled", "Translated once, ahead of time",
              "A compiler translates the whole program to machine code before "
              "it runs. Translation costs time once; every subsequent run is "
              "at full speed with no translation overhead. Errors are found "
              "before the program is shipped. The output is tied to one "
              "processor and operating system, so a separate build is needed "
              "for each."),
             ("Interpreted", "Translated as it runs",
              "An interpreter reads and executes the source statement by "
              "statement. Nothing is built, so the edit-run cycle is "
              "immediate and the same source runs anywhere an interpreter "
              "exists. The cost is speed -- every statement is analysed each "
              "time through, so a loop's body is re-translated on every "
              "iteration -- and errors appear only when the faulty line is "
              "reached."),
             ("Intermediate code and JIT", "Both, in stages",
              "The source is compiled to a portable intermediate form -- "
              "bytecode -- which a virtual machine then executes. This gives "
              "compile-time checking AND portability, since only the virtual "
              "machine is platform-specific. A just-in-time compiler goes "
              "further: it interprets at first, watches which code is "
              "actually hot, and compiles those parts to machine code while "
              "running. Java and C# work this way.")]),
        desc(
            "The examination asks which model a described situation implies. "
            "The reliable tells: 'the same file runs on every platform "
            "unchanged' means interpreted or intermediate; 'errors are found "
            "before delivery' means compiled; 'runs slowly at first and "
            "speeds up' means JIT."
        ),
    ]),

    ("The Compilation Pipeline", [
        desc(
            "Compilation was introduced in the Theory of Information lesson "
            "as a sequence of phases. The reason to know them is diagnostic: "
            "the phase that reports an error tells you what kind of error it "
            "is."
        ),
        image(fig("compiler-phases")),
        table(
            ["Phase", "Input to output", "Catches"],
            [["Lexical analysis", "Characters to tokens",
              "A character belonging to no token"],
             ["Syntax analysis", "Tokens to a parse tree",
              "A missing bracket, a malformed statement"],
             ["Semantic analysis", "Parse tree to annotated tree",
              "Type mismatch, undeclared name, wrong argument count"],
             ["Optimisation", "Intermediate code to better intermediate code",
              "Nothing -- it changes performance, not meaning"],
             ["Code generation", "Intermediate code to target code",
              "Nothing that earlier phases did not"]],
            caption="Five phases, each consuming the previous one's output.",
            footer="An error naming a line and column is lexical or "
                   "syntactic; one naming a type or an identifier is "
                   "semantic. Nothing after semantic analysis reports a "
                   "fault in your program."),
        desc(
            "Two further steps sit outside the compiler proper and are "
            "examined by name. A LINKER combines the compiled units and the "
            "libraries they use into one executable, resolving each reference "
            "to a name defined elsewhere -- an unresolved reference is a "
            "linker error, not a compiler error, which is why it appears "
            "after everything compiled cleanly. A LOADER then places the "
            "executable into memory and starts it."
        ),
        desc(
            "Linking is either STATIC, copying the library's code into the "
            "executable so it is self-contained and larger, or DYNAMIC, "
            "recording a reference resolved when the program runs -- smaller, "
            "shareable between processes, and dependent on the right library "
            "being present at run time. That last dependency is the source of "
            "an entire genre of deployment failure."
        ),
    ]),

    ("Programming Paradigms", [
        desc(
            "A paradigm is a way of organising a program. The syllabus names "
            "four, and they are not mutually exclusive -- most working "
            "languages support several, and most real programs mix them."
        ),
        image(fig("paradigms")),
        content_accordion(
            "FOUR PARADIGMS",
            "Learn each by its organising principle, since the examination "
            "describes an approach rather than naming a language.",
            [("Procedural",
              "The program is a sequence of steps grouped into procedures, "
              "with data passed between them. Data and the code acting on it "
              "are separate. Organised around WHAT HAPPENS, in order. C, "
              "Pascal and COBOL."),
             ("Object-oriented",
              "The program is a set of objects, each bundling data with the "
              "operations on that data. Organised around WHAT THINGS ARE. Its "
              "four principles -- encapsulation, inheritance, polymorphism "
              "and abstraction -- get a full treatment in the Object-Oriented "
              "Design lesson."),
             ("Functional",
              "The program is the evaluation of expressions, with functions "
              "avoiding changes to state. The same call with the same "
              "arguments always gives the same answer, which makes reasoning "
              "and parallelising far easier. Haskell and Lisp are pure "
              "examples; most modern languages have absorbed the features."),
             ("Logic and declarative",
              "The program states facts and rules, and an engine derives the "
              "answers. You describe WHAT is true rather than HOW to compute "
              "it. Prolog is the classic case, and SQL is the one everybody "
              "actually uses.")]),
        desc(
            "The clearest way to hold the difference: procedural code says do "
            "this, then this; object-oriented code says ask this thing to do "
            "it; functional code says this value is the result of "
            "transforming that one; declarative code says this is what I want "
            "and does not say how."
        ),
    ]),

    ("Language Families in Practice", [
        desc(
            "The 2016 syllabus enumerated specific languages at length. The "
            "current paper does not test their syntax, but it does expect the "
            "broad territory each family occupies."
        ),
        table(
            ["Family", "Typical use", "Notable property"],
            [["C and C++", "Systems, embedded, performance-critical",
              "Manual memory management; close to the hardware"],
             ["Java and C#", "Enterprise applications, Android",
              "Compiled to bytecode, run on a virtual machine"],
             ["Python and Ruby", "Scripting, data work, web back ends",
              "Dynamically typed and interpreted"],
             ["JavaScript", "Browsers, and increasingly servers",
              "The only language browsers execute natively"],
             ["COBOL", "Long-lived financial and administrative systems",
              "Decimal arithmetic; still runs enormous transaction volumes"],
             ["SQL", "Querying relational databases",
              "Declarative: describes the result, not the method"]],
            caption="Where each family sits.",
            footer="The two extremes are worth noticing. C gives control and "
                   "demands correctness; SQL gives neither control nor the "
                   "chance to get the algorithm wrong, because you do not "
                   "write one."),
        desc(
            "One idea explains more of this table than any other: the further "
            "a language is from the hardware, the more it does for you and "
            "the less you can decide. Manual memory management is a burden "
            "and a capability at the same time -- a garbage collector removes "
            "a whole class of defects and introduces pauses you cannot "
            "schedule, which is exactly why hard real-time systems avoid it."
        ),
    ]),

    ("Libraries, APIs and Frameworks", [
        desc(
            "Almost no program is written from nothing, and the syllabus "
            "expects the vocabulary of what gets reused."
        ),
        compare_grid(
            "THREE KINDS OF REUSE",
            "The distinction that matters is who calls whom.",
            [("Library",
              "A collection of routines you call when you want them. YOUR "
              "code is in charge and the library is passive."),
             ("Framework",
              "A structure that calls YOUR code at defined points. The "
              "framework is in charge, and you fill in the gaps -- often "
              "called inversion of control."),
             ("API",
              "The published interface to any of these, or to a remote "
              "service: the set of operations available, their parameters "
              "and their results. It is a contract, not an "
              "implementation."),
             ("Software Development Kit",
              "A bundle of libraries, tools, documentation and examples for "
              "building on a particular platform.")]),
        desc(
            "The library-versus-framework distinction is examined because it "
            "has a real consequence: you can adopt a library incrementally "
            "and drop it later, whereas a framework shapes the whole "
            "structure of the program and is correspondingly hard to leave. "
            "Choosing one is a much larger commitment than choosing the "
            "other."
        ),
    ]),

    ("Scripting and Glue Languages", [
        desc(
            "A category the syllabus names separately, and the distinction is "
            "about purpose rather than about any technical property."
        ),
        desc(
            "A scripting language is used to automate and to connect: driving "
            "a build, processing a batch of files, wiring existing components "
            "together. The priorities that follow are consistent -- start "
            "instantly with no build step, express common operations in very "
            "little code, and accept slower execution because the script "
            "spends most of its time waiting for the programs it is "
            "orchestrating anyway."
        ),
        compare_grid(
            "WHY SCRIPTING LANGUAGES LOOK THE WAY THEY DO",
            "Each characteristic follows from the work rather than from "
            "fashion.",
            [("Interpreted, not compiled",
              "A script is edited and run constantly, often once. A build "
              "step would cost more than the run saves."),
             ("Dynamically typed",
              "The script glues components whose types it did not define, and "
              "declaring them all would be most of the work."),
             ("Rich built-in text and file handling",
              "Because the work is overwhelmingly moving, filtering and "
              "reshaping text and files."),
             ("Tolerant of failure at run time",
              "A script that stops on the twentieth of a hundred files can "
              "simply be fixed and re-run, which is not true of a deployed "
              "application.")]),
        desc(
            "The point worth taking from this is that 'scripting language' "
            "describes a role, and languages move between roles. Several "
            "languages that began as glue now run substantial applications, "
            "at which point the tolerances above stop being advantages and "
            "start being the reason such systems acquire type annotations and "
            "test suites."
        ),
    ]),

    ("Preprocessing, Macros and Build Configuration", [
        desc(
            "Some languages run a stage before compilation proper, "
            "transforming the source text itself. It is worth knowing because "
            "its errors are reported against code the programmer never "
            "wrote."
        ),
        ul([
            "A MACRO is a named piece of text substituted wherever its name "
            "appears. It is a textual replacement rather than a call, so it "
            "has no type checking and no stack frame -- fast, and capable of "
            "surprising results when its arguments have side effects.",
            "CONDITIONAL COMPILATION includes or excludes regions of source "
            "depending on a flag, so one codebase can build for several "
            "platforms or with debugging code omitted from a release.",
            "FILE INCLUSION pastes one file's text into another, which is how "
            "declarations are shared before modules were a language feature.",
        ]),
        desc(
            "The characteristic failure is that the preprocessor is not part "
            "of the language and does not understand it. A macro expanded in "
            "an unexpected context produces code that is syntactically valid "
            "and semantically wrong, and the compiler's error message refers "
            "to the expanded text rather than the line as written -- which is "
            "why languages designed later replaced macros with typed "
            "constructs wherever they could."
        ),
    ]),

    ("How a Language Handles Memory", [
        desc(
            "Of all the decisions in the opening table, memory management "
            "produces the sharpest practical differences, and it is examined "
            "in several later lessons."
        ),
        table(
            ["Approach", "Who frees memory", "Risk", "Predictability"],
            [["Manual", "The programmer, explicitly",
              "Leaks, and use of memory already freed", "Fully predictable"],
             ["Reference counting", "Automatically, at zero references",
              "Cycles are never freed", "Predictable, with steady overhead"],
             ["Tracing garbage collection", "A collector, periodically",
              "Very few -- at the cost of control", "Pauses at unpredictable "
                                                    "moments"],
             ["Ownership rules", "The compiler, from static analysis",
              "Rejected programs rather than runtime faults",
              "Fully predictable"]],
            caption="Four answers to the same question.",
            footer="Manual management and ownership rules both give a "
                   "predictable worst case, which is why hard real-time and "
                   "embedded work lives in that half of the table."),
        desc(
            "The two failure modes worth naming are opposites. A MEMORY LEAK "
            "is memory never released, so a long-running process grows until "
            "it is killed -- invisible in a short test and fatal in "
            "production. A DANGLING REFERENCE is memory released while "
            "something still points at it, so a later access reads whatever "
            "now occupies that address; it is the more dangerous of the two, "
            "because the program usually continues with corrupt data rather "
            "than stopping."
        ),
        desc(
            "It is worth being precise about what a collector removes. It "
            "eliminates leaks caused by FORGETTING to free and dangling "
            "references entirely, which is a large class of defects. It does "
            "not eliminate leaks caused by holding a reference you no longer "
            "need -- a cache that never evicts leaks just as surely under a "
            "collector as without one."
        ),
    ]),

    ("Cross-Compilation and Target Platforms", [
        desc(
            "Compiled output is specific to a processor architecture and an "
            "operating system, which raises an obvious problem for anything "
            "that does not run where it was built."
        ),
        compare_grid(
            "BUILDING FOR SOMEWHERE ELSE",
            "The embedded and mobile worlds run almost entirely on the second "
            "of these.",
            [("Native compilation",
              "The build machine and the target are the same kind of machine, "
              "so the compiler's output runs where it was produced. The "
              "ordinary case for desktop and server software."),
             ("Cross-compilation",
              "The build machine produces code for a DIFFERENT architecture "
              "-- a desktop building for a microcontroller or a phone. "
              "Necessary whenever the target is too small to host a compiler "
              "at all, and it means the build cannot be tested by simply "
              "running it.")]),
        desc(
            "The examination asks for the term rather than the mechanics. The "
            "recognisable description is always the same: code is built on "
            "one kind of machine to run on another, usually because the "
            "target is an embedded device with no development environment of "
            "its own."
        ),
    ]),

    ("Language Choice as an Engineering Decision", [
        desc(
            "Choosing a language for a project is examined in System "
            "Development Technology, but the criteria belong here because "
            "they follow from what this lesson has established."
        ),
        table(
            ["Criterion", "The question to ask"],
            [["Fit for the domain",
              "Does the language and its ecosystem already solve most of "
              "this problem?"],
             ["Performance requirements",
              "Is a managed runtime's unpredictability acceptable here?"],
             ["Team competence",
              "Who will maintain this, and do they already know it?"],
             ["Ecosystem and libraries",
              "How much of what we need exists already and is maintained?"],
             ["Longevity",
              "Will this language still be supported when the system is "
              "fifteen years old?"],
             ["Interoperability",
              "Must it call, or be called by, systems already written?"]],
            caption="Six criteria for a language decision.",
            footer="Team competence is the one most often underweighted. A "
                   "theoretically superior language nobody on the team knows "
                   "produces worse software than a mediocre one they do."),
        desc(
            "The point worth carrying is that language choice is rarely "
            "decided by the language's merits in isolation. Existing systems, "
            "available people and the maintenance horizon usually dominate, "
            "which is why COBOL still processes an enormous share of the "
            "world's financial transactions despite nobody choosing it for a "
            "new project."
        ),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A development team reports that their application starts "
            "slowly and becomes noticeably faster after running for a minute, "
            "that the same build runs unchanged on Windows and Linux, and "
            "that type errors are reported before deployment. Which execution "
            "model is in use?\""
        ),
        ol([
            "Take the clues one at a time rather than guessing from the "
            "first.",
            "'Type errors reported before deployment' means there is a "
            "compilation step, which rules out pure interpretation.",
            "'The same build runs unchanged on two operating systems' rules "
            "out compilation to native machine code, which would need a "
            "separate build for each.",
            "'Starts slowly and speeds up' is the signature of a just-in-time "
            "compiler: interpreting at first, then compiling the code that "
            "turns out to be hot.",
            "All three together describe compilation to bytecode executed by "
            "a virtual machine with a JIT compiler.",
        ]),
        desc(
            "Notice that no single clue settles it. Each one eliminates a "
            "different option, and the answer is what survives all three -- "
            "which is how most classification items on this paper are built, "
            "and why reading the whole stem before looking at the options is "
            "worth the seconds it costs."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where language items are lost."),
        ul([
            "Treating compiled and interpreted as a property of the LANGUAGE. "
            "It is a property of the implementation -- most languages have "
            "both.",
            "Confusing a compiler error with a linker error. An unresolved "
            "reference means everything compiled and something was missing at "
            "link time.",
            "Assuming a 4GL is simply a newer 3GL. The difference is "
            "describing WHAT rather than HOW.",
            "Reading paradigms as exclusive. Most languages support several.",
            "Expecting static linking to solve a missing-library problem "
            "without noticing it also freezes the version.",
            "Confusing a library with a framework. The question is which one "
            "calls the other.",
            "Believing a garbage collector makes memory problems impossible. "
            "It removes leaks from forgotten frees, not from references you "
            "keep holding.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six classifications the examination asks for.",
            [("3GL against 4GL",
              "HOW to compute against WHAT is wanted",
              "SQL is the canonical 4GL. You describe the result and the "
              "system chooses the method."),
             ("Compiled against interpreted",
              "Translated once ahead of time against each time it runs",
              "Compiling buys speed and early error detection; interpreting "
              "buys portability and an instant edit-run cycle."),
             ("What a JIT compiler does",
              "Interprets first, then compiles the hot parts",
              "Which is why such a program starts slowly and speeds up. "
              "Bytecode on a virtual machine is what makes it possible."),
             ("Compiler error against linker error",
              "Bad source against a missing definition",
              "An unresolved reference means every unit compiled and "
              "something it referred to was not found."),
             ("Static against dynamic linking",
              "Library copied in against resolved at run time",
              "Static is self-contained, larger, and version-frozen. Dynamic "
              "is smaller and shareable, and depends on the right library "
              "being present."),
             ("Library against framework",
              "You call it against it calls you",
              "Inversion of control. A library can be dropped later; a "
              "framework shapes the whole program.")]),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Language concepts recur throughout the technology majors."),
        ul([
            "Compilation phases came from Theory of Information and return in "
            "Development Tools.",
            "Object orientation gets a full lesson in Development Technology.",
            "Virtual machines and bytecode reappear in Software and in "
            "virtualisation.",
            "Static and dynamic linking reappear in Configuration Management "
            "as a versioning problem.",
            "SQL as a 4GL is the whole Data Manipulation lesson.",
            "Garbage collection pauses reappear as the reason hard real-time "
            "systems avoid managed runtimes.",
        ]),
    ]),
]

_lang_quiz = [
    mcq("EASY",
        "SQL lets a user state which rows are wanted without specifying how "
        "to find them, leaving the method to the database.\n\n"
        "Which language generation does this characterise?",
        [("Second generation", False),
         ("Third generation", False),
         ("Fourth generation", True),
         ("First generation", False)],
        "A fourth-generation language describes WHAT result is wanted and "
        "leaves the method to the system, which is exactly what SQL does -- "
        "nobody writes the join algorithm. A third-generation language "
        "specifies HOW, step by step. The first and second generations are "
        "machine code and assembly language, both tied to a particular "
        "processor and about as far from declarative as it is possible to "
        "get."),

    mcq("AVERAGE",
        "Source code is translated into a portable intermediate form, which a "
        "virtual machine then executes, compiling the frequently used parts "
        "to machine code as the program runs.\n\n"
        "What is this last step called?",
        [("Static linking", False),
         ("Just-in-time compilation", True),
         ("Cross-compilation", False),
         ("Macro expansion", False)],
        "Just-in-time compilation translates code to machine code DURING "
        "execution, targeting the parts that turn out to be executed often. "
        "It gives the portability of bytecode with much of the speed of "
        "ahead-of-time compilation, and it is why such programs are slower "
        "at first and speed up. Static linking combines libraries into an "
        "executable, and cross-compilation builds on one platform for "
        "another -- neither happens while the program runs."),

    mcq("AVERAGE",
        "Every source file compiles without error, but the build fails with a "
        "message that a referenced name could not be found.\n\n"
        "Which stage reported this?",
        [("Lexical analysis", False),
         ("Semantic analysis", False),
         ("The linker", True),
         ("The loader", False)],
        "Each unit compiled successfully, so all three compiler phases passed "
        "on the source they were given. The linker's job is to combine the "
        "compiled units and libraries and resolve every reference to a name "
        "defined elsewhere, and it is the only stage that can discover that a "
        "definition exists nowhere in the whole program. The loader runs "
        "later still, placing a finished executable into memory."),

    mcq("HARD",
        "An application is built with dynamic linking rather than static "
        "linking.\n\n"
        "Which consequence follows?",
        [("The executable is larger but has no external dependencies.",
          False),
         ("The executable is smaller but depends on the library being "
          "present at run time.", True),
         ("The library version is frozen at build time and cannot change.",
          False),
         ("The application will run without an operating system loader.",
          False)],
        "Dynamic linking records a reference that is resolved when the "
        "program starts, so the library's code is not copied in -- the "
        "executable is smaller and several processes can share one loaded "
        "copy, at the cost of requiring a compatible library to be installed. "
        "Static linking gives the opposite trade: self-contained, larger, and "
        "with the version fixed at build time, which is both its safety and "
        "its inflexibility."),

    mcq("AVERAGE",
        "In one approach, application code is called by a surrounding "
        "structure at defined points rather than calling that structure "
        "itself.\n\n"
        "What is being described?",
        [("A library", False),
         ("A framework", True),
         ("A software development kit", False),
         ("An application programming interface", False)],
        "The defining question is which side is in control. A framework calls "
        "your code at points it defines -- inversion of control -- and "
        "therefore shapes the whole structure of the program. A library is "
        "passive and waits to be called, which is why it can be adopted "
        "incrementally and abandoned later. An SDK is a bundle of tools, and "
        "an API is the published interface to any of these."),

    mcq("EASY",
        "Which paradigm organises a program around objects that bundle data "
        "together with the operations performed on that data?",
        [("Procedural", False),
         ("Object-oriented", True),
         ("Functional", False),
         ("Logic", False)],
        "Bundling state with the behaviour that acts on it is the defining "
        "characteristic of object orientation, and it is what encapsulation "
        "means. Procedural programming deliberately keeps data and procedures "
        "separate; functional programming organises around evaluating "
        "expressions while avoiding changes to state; and logic programming "
        "states facts and rules for an engine to derive answers from."),

    mcq("HARD",
        "An engineer claims that Python is an interpreted language and C is a "
        "compiled language, and that this is an intrinsic property of "
        "each.\n\n"
        "What is wrong with the claim?",
        [("Nothing -- these are defined properties of the two languages.",
          False),
         ("Compilation and interpretation are properties of an "
          "implementation, not of a language.", True),
         ("Both languages are in fact interpreted on modern hardware.",
          False),
         ("The distinction applies only to fourth-generation languages.",
          False)],
        "A language is a specification of syntax and semantics; how it is "
        "executed is decided by whoever writes the implementation. There are "
        "compilers for Python and interpreters for C, and several languages "
        "are routinely used both ways. The association of a language with one "
        "model is a matter of which implementation became popular, not a "
        "property the language itself possesses."),

    mcq("AVERAGE",
        "Assembly language is described as second generation, with each "
        "statement corresponding to one machine instruction.\n\n"
        "What follows from this correspondence?",
        [("It is portable between processor architectures.", False),
         ("It is optimised automatically when assembled.", False),
         ("It is tied to one processor architecture.", True),
         ("It is easier to maintain than a third-generation language.",
          False)],
        "One statement mapping to one machine instruction means the "
        "statements ARE that processor's instruction set with readable names, "
        "so the code cannot run on a processor with a different instruction "
        "set. An assembler translates mechanically without optimising, which "
        "is precisely why the mapping stays one to one. Maintainability is "
        "considerably worse than a third-generation language's, which is why "
        "assembly survives only where the last percent of control matters."),

    mcq("HARD",
        "A hard real-time control system must guarantee that every response "
        "completes within a fixed deadline.\n\n"
        "Why is a language runtime with automatic garbage collection usually "
        "unsuitable?",
        [("Garbage collection consumes more total processor time than manual "
          "management.", False),
         ("Collection may pause execution at a moment the program does not "
          "control.", True),
         ("Garbage-collected languages cannot access hardware registers.",
          False),
         ("Automatic collection prevents memory from being freed at all.",
          False)],
        "A hard deadline is a statement about the WORST case, and a collector "
        "may stop the program to reclaim memory at a time determined by "
        "allocation history rather than by the schedule. Even a rare pause "
        "longer than the deadline is a failure, however good the average. "
        "Total processor time is not the objection -- collection is often "
        "competitive there -- and hardware access is a matter of the runtime's "
        "facilities rather than of collection itself."),

    mcq("AVERAGE",
        "Which statement correctly distinguishes an API from a library?",
        [("An API is the published interface; a library is an "
          "implementation behind such an interface.", True),
         ("An API runs remotely, while a library always runs locally.",
          False),
         ("An API is written by the platform vendor; a library is written by "
          "the application developer.", False),
         ("An API can be called from any language, while a library cannot.",
          False)],
        "An API is a contract -- the set of operations available, their "
        "parameters and their results -- and says nothing about how those "
        "operations are carried out. A library is one kind of thing that can "
        "sit behind such a contract. The distinction is interface against "
        "implementation, not local against remote or vendor against "
        "developer; a local library has an API just as a web service does."),
]

LESSON_LANGUAGES = lesson(
    MAJOR, MIDDLE,
    "Programming Languages: Compilation, Paradigms and Language Families",
    _lang_quiz,
    lesson_structure(
        "Programming Languages: Compilation, Paradigms and Language Families",
        "Every language expresses the same control structures, so this lesson "
        "is about why there are hundreds of them: a language is a set of "
        "decisions about what to make easy, and different work wants "
        "different answers. It covers the generations from machine code to "
        "declarative languages, the three ways source becomes something that "
        "runs and how to recognise each from a description, the compilation "
        "pipeline together with the linking and loading that follow it, the "
        "four paradigms, and the vocabulary of reuse. It deliberately teaches "
        "no syntax: since the 2024 revision the examination uses its own "
        "pseudocode and no real language appears on the paper.",
        [
            "Explain the trade-offs a language design makes and classify a "
            "language from a description of its behaviour",
            "Distinguish the language generations, particularly HOW against "
            "WHAT",
            "Compare compiled, interpreted and intermediate-code execution",
            "Explain what a just-in-time compiler does and why such programs "
            "speed up",
            "Name the compilation phases and distinguish a compiler error "
            "from a linker error",
            "Compare static with dynamic linking and state what each risks",
            "Identify the paradigm behind a described approach",
            "Distinguish a library, a framework, an API and an SDK",
        ],
        70,
        _lang_sections,
        [
            ("Machine code (1GL)",
             "The binary instructions a processor executes directly. Tied to "
             "one architecture."),
            ("Assembly language (2GL)",
             "Mnemonics mapping one to one onto machine instructions. Exact, "
             "unportable, and translated mechanically by an assembler with no "
             "optimisation."),
            ("Third-generation language",
             "A procedural high-level language describing HOW to compute a "
             "result. Portable once recompiled."),
            ("Fourth-generation language",
             "A problem-oriented language describing WHAT result is wanted, "
             "leaving the method to the system. SQL is the canonical case."),
            ("Compiler",
             "A translator producing machine code from source before "
             "execution. Costs time once, and buys speed and early error "
             "detection."),
            ("Interpreter",
             "A translator reading and executing source statement by "
             "statement. Instant to start, portable, and slower to run since "
             "translation repeats."),
            ("Bytecode and virtual machine",
             "A portable intermediate form executed by a platform-specific "
             "virtual machine, giving compile-time checking and portability "
             "together."),
            ("Just-in-time compiler",
             "A compiler translating code to machine code while the program "
             "runs, targeting the parts executed often. Why such programs "
             "start slowly and speed up."),
            ("Linker",
             "The stage combining compiled units and libraries and resolving "
             "references to names defined elsewhere. An unresolved reference "
             "is a linker error, not a compiler error."),
            ("Loader",
             "The stage placing a finished executable into memory and "
             "starting it."),
            ("Static linking",
             "Copying a library's code into the executable. Self-contained "
             "and larger, with the version frozen at build time."),
            ("Dynamic linking",
             "Resolving library references when the program runs. Smaller and "
             "shareable, and dependent on a compatible library being "
             "installed."),
            ("Procedural paradigm",
             "Organising a program as sequences of steps in procedures, with "
             "data kept separate from the code acting on it."),
            ("Object-oriented paradigm",
             "Organising a program as objects bundling data with the "
             "operations on that data."),
            ("Functional paradigm",
             "Organising a program as the evaluation of expressions, with "
             "functions avoiding changes to state -- which makes reasoning "
             "and parallelising easier."),
            ("Declarative and logic paradigm",
             "Stating facts, rules or desired results and leaving the method "
             "to an engine. Prolog and SQL."),
            ("Library",
             "A collection of routines your code calls. Passive, and "
             "adoptable incrementally."),
            ("Framework",
             "A structure that calls your code at defined points -- inversion "
             "of control. It shapes the whole program and is hard to leave."),
            ("API",
             "The published interface to a library or service: available "
             "operations, their parameters and their results. A contract "
             "rather than an implementation."),
        ],
        "Languages differ because each is a set of decisions about what to "
        "make easy -- when types are checked, who manages memory, how close "
        "to the hardware, when translation happens -- and no set of answers "
        "is correct for every kind of work. The generations run from machine "
        "code and assembly, both tied to one processor, through "
        "third-generation languages that say HOW, to fourth-generation ones "
        "such as SQL that say WHAT and leave the method to the system. Source "
        "becomes something that runs in one of three ways: compiled once "
        "ahead of time for speed and early error detection, interpreted each "
        "run for portability and an instant edit cycle, or compiled to "
        "portable bytecode that a virtual machine executes -- with a "
        "just-in-time compiler translating the hot parts as it goes, which is "
        "why such programs start slowly and speed up. Note that compiled and "
        "interpreted describe an IMPLEMENTATION rather than a language. After "
        "the compiler's five phases come the linker, which resolves "
        "references to names defined elsewhere and is where an unresolved "
        "reference is reported, and the loader; linking is static, giving a "
        "self-contained and version-frozen executable, or dynamic, giving a "
        "smaller shareable one that depends on the right library being "
        "present. Four paradigms organise programs around ordered steps, "
        "around objects owning their data, around expressions that avoid "
        "state, or around declared facts and desired results -- and most "
        "real languages support several. Reuse comes as a library you call, a "
        "framework that calls you, or an API that is only a contract, and the "
        "first two differ in a way that matters: a library can be dropped "
        "later and a framework cannot.",
        exam_notes=[
            desc(
                "Subject A takes classification items from this material. "
                "Nothing here requires knowing any language's syntax, and the "
                "2024 revision removed the language-specific questions that "
                "once did."
            ),
            ul([
                "Placing a described language in a generation.",
                "Identifying compiled, interpreted or JIT execution from a "
                "described behaviour.",
                "Naming the stage that reports a described build error.",
                "Comparing static and dynamic linking.",
                "Matching an approach to a paradigm.",
                "Distinguishing a library, framework, API and SDK.",
            ]),
            desc(
                "Watch for items that treat execution model as a property of "
                "the language. It is a property of the implementation, and "
                "that distinction is itself examined."
            ),
        ],
    ))

# ==========================================================================
# Lesson 5: Markup and other languages
# ==========================================================================

_markup_sections = [
    ("Languages That Describe Rather Than Compute", [
        desc(
            "Everything in the previous lesson computes. The languages here "
            "do not: they describe structure, so that a program reading the "
            "text knows what each part of it means. That difference is why "
            "they are grouped separately in the syllabus."
        ),
        image(fig("markup-family")),
        desc(
            "The problem they solve is worth stating plainly. Plain text "
            "carries no indication of which part is a heading, which is a "
            "price and which is a customer name -- a human infers it from "
            "layout and context, and a program cannot. Markup adds that "
            "information explicitly, so the text becomes machine-readable "
            "without ceasing to be human-readable."
        ),
        table(
            ["Notation", "Describes", "Primary use"],
            [["HTML", "A document's structure and semantics", "Web pages"],
             ["CSS", "How that structure should be presented", "Styling"],
             ["XML", "Arbitrary structured data, self-describing",
              "Data exchange, configuration, documents"],
             ["JSON", "Structured data, compactly", "Web APIs, configuration"],
             ["SGML", "The ancestor: a language for defining markup "
                      "languages", "Historical; HTML and XML descend from it"]],
            caption="The notations the syllabus names.",
            footer="The recurring principle is separation of concerns: what "
                   "the content IS is kept apart from how it is displayed, so "
                   "the same data can feed a page, a mobile app and a printed "
                   "report."),
    ]),

    ("HTML", [
        desc(
            "HTML marks up a document with tags describing what each part IS "
            "-- a heading, a paragraph, a list, a table, a link. A browser "
            "then decides how to render each kind."
        ),
        ul([
            "An element is normally an opening tag, content, and a closing "
            "tag. Some elements have no content and are written as a single "
            "tag.",
            "Elements NEST and must not overlap: an element opened inside "
            "another must be closed before that outer one closes.",
            "ATTRIBUTES on the opening tag carry additional information -- "
            "the destination of a link, the source of an image, the "
            "alternative text a screen reader announces.",
            "The document has a defined shape: a head holding metadata that "
            "is not displayed, and a body holding what is.",
        ]),
        desc(
            "SEMANTIC markup is the point, and it is examined. Marking a "
            "heading as a heading rather than as large bold text tells the "
            "browser, the search engine and the screen reader what the text "
            "IS -- which is what lets a reader navigate by heading and a "
            "search engine weight it. Using presentational markup to achieve "
            "an appearance discards that information, and it is why styling "
            "belongs in CSS."
        ),
        desc(
            "That separation has a practical consequence the examination "
            "likes: because appearance lives in a stylesheet, one change "
            "there restyles every page that references it, and the same "
            "document can be presented differently on a phone, on a desktop "
            "and in print without the content being touched."
        ),
    ]),

    ("XML", [
        desc(
            "XML uses the same tag syntax as HTML for an entirely different "
            "purpose. HTML has a fixed set of tags with agreed meanings; XML "
            "lets you define your own, so it describes any structured data "
            "rather than documents specifically."
        ),
        compare_grid(
            "WHAT XML BUYS",
            "It is verbose, and each of these is what the verbosity pays "
            "for.",
            [("Self-describing",
              "The tag names travel with the data, so a document can be read "
              "without a separate specification of its layout -- unlike a "
              "positional format such as CSV, where column 3 means nothing "
              "without documentation."),
             ("Validatable",
              "A schema (DTD or XML Schema) states which elements may appear, "
              "where, and what they may contain. A document can then be "
              "checked mechanically before anything tries to process it."),
             ("Hierarchical",
              "Elements nest arbitrarily, so genuinely nested data -- an "
              "order containing lines containing options -- is represented "
              "directly rather than flattened."),
             ("Vendor-neutral",
              "Plain text with a published structure, so any platform can "
              "read it. This is what made it the default for business "
              "document exchange.")]),
        desc(
            "The syllabus distinguishes WELL-FORMED from VALID, and the "
            "distinction is examined. A well-formed document obeys XML's "
            "syntax rules: one root element, every tag closed, correct "
            "nesting, attributes quoted. A valid document is well-formed AND "
            "conforms to a schema. So every valid document is well-formed, "
            "and a well-formed one may be entirely invalid -- correct syntax "
            "carrying elements the schema does not permit."
        ),
    ]),

    ("JSON", [
        desc(
            "JSON represents the same kinds of structured data as XML with "
            "far less notation. It has objects of name-value pairs, ordered "
            "arrays, and four primitive kinds of value: strings, numbers, "
            "booleans and null."
        ),
        table(
            ["", "XML", "JSON"],
            [["Syntax", "Opening and closing tags", "Braces, brackets, colons"],
             ["Verbosity", "High -- every element named twice", "Low"],
             ["Attributes", "Yes, distinct from child elements",
              "No -- everything is a name-value pair"],
             ["Comments", "Supported", "Not supported"],
             ["Schema validation", "Mature: DTD and XML Schema",
              "Available: JSON Schema"],
             ["Typical use", "Documents, enterprise exchange, configuration",
              "Web APIs, configuration, logging"]],
            caption="The two data formats compared on what the examination "
                    "asks about.",
            footer="JSON's dominance in web APIs comes from being smaller on "
                   "the wire and mapping directly onto the data structures "
                   "most languages already have -- an object is a dictionary "
                   "and an array is a list."),
        desc(
            "Neither is better in general. XML's schema tooling and comment "
            "support suit long-lived documents that people edit and "
            "organisations must agree on. JSON's compactness suits high-volume "
            "machine-to-machine traffic where nobody reads the payload. "
            "Choosing by fashion rather than by which of those describes the "
            "situation is the actual mistake."
        ),
    ]),

    ("Other Notations", [
        desc(
            "The syllabus's 'other languages' category collects several "
            "notations that are not programming languages but appear in every "
            "engineer's work."
        ),
        content_accordion(
            "NOTATIONS WORTH RECOGNISING",
            "Each is named in the syllabus and each may appear as a "
            "one-line identification item.",
            [("CSS",
              "Rules pairing a selector, which says which elements are "
              "affected, with declarations that say how they should look. "
              "Cascading means several rules may apply to one element and a "
              "defined precedence decides which wins."),
             ("SGML",
              "The ancestor: a standard for DEFINING markup languages rather "
              "than a markup language itself. HTML was defined using it and "
              "XML is a simplified subset of it. Historical, and examined for "
              "the lineage."),
             ("YAML",
              "A data format using indentation instead of brackets, designed "
              "to be comfortable for people to write. Widely used for "
              "configuration -- and its reliance on significant whitespace "
              "makes it unusually easy to break invisibly."),
             ("CSV",
              "Comma-separated values: rows of fields, with no types, no "
              "nesting and no self-description. Ubiquitous because every tool "
              "reads it, and fragile because a comma or newline inside a "
              "field must be quoted and frequently is not."),
             ("Regular expressions",
              "A notation for describing patterns in text, compiled into the "
              "finite automaton of the Theory of Information lesson -- which "
              "is exactly why a regular expression cannot correctly match "
              "arbitrarily nested structures such as HTML."),
             ("Markdown",
              "A lightweight markup notation converted to HTML, using plain "
              "punctuation for structure so the source stays readable as "
              "text.")]),
    ]),

    ("Parsing and Exchange in Practice", [
        desc(
            "A structured format is only useful because a program can read it "
            "back reliably, and that reading is called parsing. Two "
            "strategies are worth distinguishing."
        ),
        compare_grid(
            "TWO WAYS TO READ A DOCUMENT",
            "The trade is memory against convenience, and it decides which "
            "one a large file forces on you.",
            [("Tree-based (DOM-style)",
              "The whole document is read into memory as a tree that can be "
              "navigated in any direction and modified. Convenient, and it "
              "needs memory proportional to the document -- so a "
              "multi-gigabyte file is simply not an option."),
             ("Event-based (streaming)",
              "The parser reads sequentially and reports elements as it "
              "encounters them, holding almost nothing. Handles files far "
              "larger than memory, and you cannot look backwards or "
              "modify -- the program must do its work in one pass.")]),
        desc(
            "One warning belongs here because it is examined in the Security "
            "lessons and originates in this one: never build a structured "
            "document by concatenating strings, and never parse one with "
            "pattern matching. Both work on the examples and fail on the edge "
            "cases -- a quotation mark inside a value, an unexpected nesting "
            "-- and the failure is frequently a security vulnerability rather "
            "than a crash. Use the format's own library."
        ),
    ]),

    ("Accessibility, and What Semantic Markup Is Really For", [
        desc(
            "Semantic markup was introduced above as a good practice. It is "
            "worth seeing what actually depends on it, because that turns a "
            "style preference into a requirement -- and it is examined again "
            "in the Human Interface lessons."
        ),
        table(
            ["Depends on semantic markup", "What it does with the structure"],
            [["Screen readers",
              "Offer navigation by heading, list and landmark, so a blind "
              "user can skim rather than hear everything"],
             ["Keyboard navigation",
              "Move focus between real interactive elements in a sensible "
              "order"],
             ["Search engines",
              "Weight headings and identify a page's subject and outline"],
             ["Reader and print modes",
              "Extract the article and discard navigation and advertising"],
             ["Automated testing",
              "Locate elements by role and label rather than by fragile "
              "position"]],
            caption="Five things that read the structure rather than the "
                    "appearance.",
            footer="A heading styled to look like a heading serves exactly "
                   "one of these -- the sighted reader looking at it -- and "
                   "silently fails the other four."),
        desc(
            "ALTERNATIVE TEXT on an image is the same idea at the level of a "
            "single element: it states what the image conveys, for anyone or "
            "anything that cannot see it. The useful test is what you would "
            "say aloud to describe the image to someone on the telephone, "
            "which is neither the file name nor the word 'image'."
        ),
        desc(
            "The connection back to this lesson's opening claim is direct. "
            "Markup exists so a program can tell which part of the text is a "
            "heading; accessibility is simply the case where the program "
            "acting on that information is serving a person who cannot use "
            "the layout to work it out for themselves."
        ),
    ]),

    ("Transforming and Querying Structured Documents", [
        desc(
            "Once data is in a structured format, two operations recur so "
            "often that each has its own notation: selecting parts of a "
            "document, and converting one document into another."
        ),
        table(
            ["Notation", "What it does", "Applies to"],
            [["XPath", "Selects nodes by a path expression", "XML"],
             ["XSLT", "Transforms one XML document into another form", "XML"],
             ["CSS selectors", "Select elements to style, or to extract",
              "HTML and XML"],
             ["JSONPath and similar", "Select values by a path expression",
              "JSON"]],
            caption="Selecting from and transforming structured documents.",
            footer="Each of these is declarative -- you describe which parts "
                   "you want rather than writing a traversal -- which makes "
                   "them fourth-generation notations in the sense the "
                   "previous lesson defined."),
        desc(
            "XSLT is worth a moment because it demonstrates the whole point "
            "of separating structure from presentation. One XML document plus "
            "different transformations produces a web page, a printable "
            "report and a data feed, with the source untouched in each case. "
            "That is the same argument HTML and CSS make, generalised beyond "
            "documents."
        ),
    ]),

    ("Character Encoding in Documents", [
        desc(
            "Every one of these formats is text, so every one of them depends "
            "on the character encoding question from the Theory of "
            "Information lesson -- and each has its own way of answering it."
        ),
        table(
            ["Format", "How the encoding is stated", "Default if absent"],
            [["XML", "A declaration on the first line",
              "UTF-8 is assumed"],
             ["HTML", "A meta element in the head, or an HTTP header",
              "UTF-8 in modern practice"],
             ["JSON", "Not stated in the document at all",
              "UTF-8 is required by the specification"],
             ["CSV", "Nowhere -- there is no place to put it",
              "Whatever the reader guesses"]],
            caption="Where each format records the encoding its bytes are in.",
            footer="The last row is the whole problem with CSV as an "
                   "interchange format: two systems can agree on every column "
                   "and still exchange corrupted text."),
        desc(
            "The practical rule follows directly. A format that carries its "
            "own encoding declaration can be read correctly by anyone; one "
            "that does not depends on an out-of-band agreement that is "
            "usually verbal and frequently wrong. This is why a CSV export "
            "opened in a spreadsheet on another continent shows mojibake, and "
            "why the fix is an agreed encoding rather than a repair to the "
            "data."
        ),
    ]),

    ("Namespaces and Evolving a Format", [
        desc(
            "Two documents from different authors may both use an element "
            "called `title` meaning different things, and a format used for "
            "years will need to change. XML addresses both problems "
            "explicitly, and the ideas generalise."
        ),
        ul([
            "A NAMESPACE qualifies element names with a URI identifying who "
            "defined them, so two vocabularies can be combined in one "
            "document without their names colliding. The URI is an "
            "identifier, not an address -- nothing is fetched from it, which "
            "surprises people the first time they look.",
            "VERSIONING is the harder problem, because existing readers must "
            "keep working. The workable rule is that adding an optional "
            "element is safe, since old readers ignore what they do not "
            "recognise, while removing an element or changing what one means "
            "is not.",
            "A schema can be written PERMISSIVELY, allowing unknown elements "
            "in defined places, which is what makes the additive path "
            "possible at all.",
        ]),
        desc(
            "The general principle underneath is the one every interface "
            "eventually teaches: adding is cheap and removing is expensive, "
            "because you do not control the readers. It reappears in the "
            "Network lessons as protocol versioning and in Software "
            "Maintenance as backward compatibility, and it is why long-lived "
            "formats accumulate fields nobody uses any more."
        ),
    ]),

    ("Escaping and Why Concatenation Fails", [
        desc(
            "Every one of these formats reserves some characters for its own "
            "syntax, which raises the question of how a value containing one "
            "of them is written."
        ),
        table(
            ["Format", "Reserved in a value", "How it is written instead"],
            [["XML and HTML", "< and & (and \" inside attributes)",
              "Entity references such as &lt; and &amp;"],
             ["JSON", "\" and backslash, plus control characters",
              "Backslash escapes"],
             ["CSV", "Comma, quote and newline",
              "The field is quoted, and quotes are doubled"],
             ["SQL", "The quote character",
              "Doubled -- or better, a parameter placeholder"]],
            caption="What each format reserves, and how a value carrying it "
                    "is encoded.",
            footer="Every row is a rule that a library applies correctly and "
                   "that hand-written string concatenation forgets on the "
                   "value nobody tested with."),
        desc(
            "This is the origin of injection, which the Security lessons "
            "treat at length. A program that builds a document or a query by "
            "gluing strings together works on every value tried during "
            "development and misbehaves the first time a value contains a "
            "reserved character -- and whether that misbehaviour is a crash "
            "or an exploit depends only on who supplied the value."
        ),
        desc(
            "The rule is unconditional and worth stating as one: build "
            "structured text with the format's own library, and read it with "
            "the format's own parser. Not because concatenation is inelegant, "
            "but because the escaping rules above are exactly the cases a "
            "hand-rolled version omits."
        ),
    ]),

    ("Documents, Data and the Boundary Between Them", [
        desc(
            "A recurring examination theme is which format suits which "
            "purpose, and the useful axis is whether people or machines are "
            "the primary audience."
        ),
        compare_grid(
            "WHO IS THE DOCUMENT FOR?",
            "The answer decides which properties are worth paying for.",
            [("Written and read by people",
              "Comments, readable structure and schema validation earn their "
              "cost, because humans edit the file and organisations must "
              "agree on its shape. XML and YAML sit here."),
             ("Exchanged between machines in volume",
              "Compactness and parse speed dominate, and nobody reads the "
              "payload. JSON sits here, which is why web APIs adopted it "
              "almost universally."),
             ("Presented to a person by a program",
              "Semantic structure matters most, so the presentation can be "
              "decided separately and adapted per device. HTML with CSS."),
             ("Loaded into a tool that already exists",
              "Whatever that tool reads, which is usually CSV -- accepting "
              "its fragility as the price of universal support.")]),
        desc(
            "The mistake this framing prevents is choosing a format by "
            "fashion. JSON is not better than XML; it is better for "
            "high-volume machine traffic and worse for a document a committee "
            "must agree on and annotate, and the situation decides which of "
            "those you are in."
        ),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A configuration file must be edited by operations staff, "
            "annotated with explanatory notes, and validated automatically "
            "against an agreed structure before deployment. Which format best "
            "meets these requirements?\""
        ),
        ol([
            "Extract the requirements rather than the topic: human editing, "
            "annotation, and mechanical validation.",
            "'Annotated with explanatory notes' means comments are required, "
            "which eliminates JSON immediately -- it has none.",
            "'Validated automatically against an agreed structure' means "
            "schema support, which eliminates CSV and plain text, neither of "
            "which can express a structure to validate against.",
            "'Edited by operations staff' favours something readable, which "
            "both XML and YAML satisfy.",
            "XML meets all three with the most mature validation tooling; "
            "YAML is a defensible answer where its schema support suffices, "
            "and an FE item would offer only one of them.",
        ]),
        desc(
            "The technique generalises across the whole paper: read the stem "
            "for REQUIREMENTS, then eliminate options that fail one outright. "
            "Comments and validation each rule out a different candidate here, "
            "and the answer is simply what survives -- which is far more "
            "reliable than deciding which format you like."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where these items are lost."),
        ul([
            "Confusing well-formed with valid. Well-formed is correct syntax; "
            "valid is well-formed AND conforming to a schema.",
            "Treating XML and HTML as the same thing. HTML has a fixed "
            "vocabulary for documents; XML lets you define your own for any "
            "data.",
            "Expecting comments in JSON. It has none.",
            "Using presentational markup where semantic markup was needed, "
            "which discards the meaning assistive technology and search "
            "engines rely on.",
            "Assuming CSV is a safe interchange format. It has no types, no "
            "nesting and no agreed quoting.",
            "Parsing structured text with regular expressions. A regular "
            "expression cannot match arbitrary nesting.",
            "Reading a very large document into a tree when a streaming "
            "parser was required.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Five distinctions this lesson establishes.",
            [("Well-formed against valid",
              "Correct syntax against conforming to a schema",
              "Every valid document is well-formed; a well-formed one can be "
              "entirely invalid."),
             ("HTML against XML",
              "Fixed document vocabulary against your own for any data",
              "Same tag syntax, different purpose. HTML describes documents; "
              "XML describes structured data of any kind."),
             ("XML against JSON",
              "Verbose and validatable against compact and direct",
              "XML has attributes, comments and mature schema tooling. JSON "
              "maps straight onto the dictionaries and lists a language "
              "already has, and has no comments."),
             ("Semantic against presentational markup",
              "What the content IS against how it should look",
              "Semantic markup is what lets a screen reader navigate and a "
              "search engine weight a heading. Appearance belongs in CSS."),
             ("Tree parsing against streaming",
              "Whole document in memory against one pass, holding nothing",
              "A tree can be navigated and modified freely; streaming handles "
              "files larger than memory and cannot look back.")]),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("These notations appear throughout the later majors."),
        ul([
            "HTML and CSS return in Human Interface as accessibility and "
            "responsive design.",
            "XML and JSON return in Network as the payload formats of web "
            "services and REST APIs.",
            "Schema validation returns in Database and in Software "
            "Requirements as a form of contract.",
            "Regular expressions return as the finite automata of Theory of "
            "Information.",
            "String concatenation into structured documents returns in "
            "Security as injection.",
            "Configuration formats return in Development Environment "
            "Management and in Configuration Management.",
        ]),
    ]),
]

_markup_quiz = [
    mcq("EASY",
        "An XML document has one root element, every tag correctly closed and "
        "properly nested, and all attribute values quoted. It has not been "
        "checked against any schema.\n\n"
        "How is this document described?",
        [("Valid but not well-formed", False),
         ("Well-formed but not necessarily valid", True),
         ("Both well-formed and valid, since the syntax rules are the "
          "schema", False),
         ("Neither, because validity must be established before "
          "well-formedness", False)],
        "Well-formed means the document obeys XML's own syntax rules, which "
        "is exactly what is described. Valid means well-formed AND conforming "
        "to a schema that states which elements may appear where -- and with "
        "no schema checked, validity is simply not established. The reverse "
        "combination is impossible: a document cannot conform to a schema "
        "while breaking the syntax the schema is expressed in terms of."),

    mcq("AVERAGE",
        "Both HTML and XML use angle-bracket tags.\n\n"
        "What is the essential difference between them?",
        [("HTML is compiled by the browser, while XML is interpreted by "
          "the receiving application.", False),
         ("HTML has a fixed vocabulary for documents; XML lets you define "
          "your own for any data.", True),
         ("HTML supports nested elements, whereas XML documents must be "
          "a flat sequence.", False),
         ("HTML is intended to be machine-readable, whereas XML is "
          "intended to be read by people.", False)],
        "HTML defines a fixed set of tags with agreed meanings, aimed at "
        "describing documents so a browser knows how to present each part. "
        "XML supplies the syntax and lets the author define the vocabulary, "
        "so it can describe orders, configurations or measurements equally "
        "well. Neither is compiled, both nest, and both are readable by "
        "people and machines alike."),

    mcq("AVERAGE",
        "Which characteristic of JSON contributes most directly to its "
        "dominance in web APIs?",
        [("It supports inline comments, so a payload documents its own "
          "fields as it is transmitted.", False),
         ("It maps directly onto the data structures languages already "
          "have.", True),
         ("It validates every document against a schema automatically, "
          "without extra tooling.", False),
         ("It permits attributes on elements as well as nested values, "
          "as XML does.", False)],
        "A JSON object corresponds to a dictionary and a JSON array to a "
        "list, so parsing produces structures a program can use immediately "
        "with no translation layer -- and the format is compact on the wire. "
        "JSON notably does NOT support comments, enforces nothing without a "
        "separately applied JSON Schema, and has no notion of attributes; "
        "everything is a name-value pair."),

    mcq("HARD",
        "A processing job must read an XML file several times larger than the "
        "available memory.\n\n"
        "Which parsing approach is required?",
        [("Tree-based parsing, since the whole structure must be available",
          False),
         ("Event-based streaming, since it processes the document in one "
          "pass", True),
         ("Schema validation, which reduces the memory needed", False),
         ("Converting the document to JSON first to reduce its size", False)],
        "A tree-based parser builds the entire document in memory, so a file "
        "larger than memory cannot be handled that way at all. An event-based "
        "parser reports elements as it encounters them and retains almost "
        "nothing, so file size is irrelevant -- at the cost of not being able "
        "to look backwards or modify the document. Validation adds work "
        "rather than removing it, and converting formats would require "
        "reading the file first, which is the very problem."),

    mcq("EASY",
        "Marking a line of text as a heading element rather than styling it "
        "as large bold text is an example of which practice?",
        [("Presentational markup, which fixes the appearance directly",
          False),
         ("Semantic markup, which states what the content is", True),
         ("Schema validation, which checks the document structure",
          False),
         ("Streaming serialisation, which writes output in one pass",
          False)],
        "Semantic markup states what content IS rather than how it should "
        "look, which is what lets a browser build a document outline, a "
        "screen reader offer navigation by heading, and a search engine weight "
        "the text appropriately. Styling text to merely resemble a heading "
        "discards all of that information -- it is presentational markup, and "
        "it is why appearance belongs in a stylesheet instead."),

    mcq("AVERAGE",
        "SGML is described in the syllabus as an ancestor of both HTML and "
        "XML.\n\n"
        "What kind of standard is it?",
        [("A markup language for technical and scientific documents",
          False),
         ("A standard for defining markup languages", True),
         ("A stylesheet language for controlling document "
          "presentation", False),
         ("A protocol for exchanging marked-up documents between "
          "systems", False)],
        "SGML is a meta-language: it specifies how a markup language may be "
        "defined, rather than defining one itself. HTML was originally "
        "specified using it, and XML is a deliberately simplified subset of "
        "it. Presentation is CSS's concern, and exchanging documents between "
        "systems is a transport question rather than a markup one."),

    mcq("HARD",
        "An engineer proposes extracting values from an HTML document using "
        "regular expressions rather than an HTML parser.\n\n"
        "What is the fundamental objection?",
        [("Regular expressions execute too slowly on large documents.",
          False),
         ("A regular expression cannot correctly match arbitrarily nested "
          "structures.", True),
         ("Regular expressions cannot be applied to text containing angle "
          "brackets.", False),
         ("HTML documents must be validated before any text processing.",
          False),
         ],
        "A regular expression compiles to a finite automaton, which remembers "
        "only its current state and therefore cannot count nesting depth "
        "without bound -- and HTML nests arbitrarily. The approach works on "
        "the examples tried and fails on the structures that matter, often "
        "silently. Speed is not the issue, angle brackets are ordinary "
        "characters, and validity is beside the point: a valid document "
        "still nests arbitrarily."),

    mcq("AVERAGE",
        "Why is separating content from presentation, as HTML and CSS do, "
        "described as a benefit rather than merely a convention?",
        [("The same content can be presented differently without being "
          "changed.", True),
         ("The browser downloads fewer files, so the page renders more "
          "quickly.", False),
         ("The content becomes valid according to its declared schema.",
          False),
         ("The content can be compiled ahead of time rather than parsed "
          "on each request.", False)],
        "With appearance held separately, one stylesheet change restyles "
        "every page that references it, and the same document can be "
        "rendered for a phone, a desktop and print without the content being "
        "touched. It typically increases the number of files rather than "
        "reducing it, has nothing to do with schema conformance, and neither "
        "content nor stylesheet is compiled."),

    mcq("AVERAGE",
        "Which limitation of CSV makes it a poor choice for exchanging "
        "complex structured data?",
        [("It cannot represent numeric values without an explicit "
          "conversion step.", False),
         ("It has no types, no nesting and no self-description.", True),
         ("It cannot be read by spreadsheet applications without a "
          "dedicated import tool.", False),
         ("It requires an agreed schema to be supplied before it can be "
          "parsed at all.", False)],
        "CSV is rows of fields and nothing more: a column's meaning lives in "
        "documentation rather than in the file, values carry no type "
        "information, and there is no way to express a record containing a "
        "list of sub-records. It is ubiquitous precisely because it is so "
        "simple that every tool reads it, and fragile for the same reason -- "
        "a comma or newline inside a field must be quoted, and frequently is "
        "not."),

    mcq("HARD",
        "A team must exchange long-lived business documents that people will "
        "review and edit, and that must be checked mechanically against an "
        "agreed structure before processing.\n\n"
        "Which format best fits, and why?",
        [("CSV, because every tool can read it without special software",
          False),
         ("XML, because it supports comments and mature schema validation",
          True),
         ("JSON, because it is compact and parses quickly at high "
          "volume", False),
         ("Plain text, because it imposes no structural constraints on "
          "the authors", False)],
        "The requirements name exactly what XML's verbosity pays for: mature "
        "schema tooling for mechanical checking against an agreed structure, "
        "and comment support for documents people read and edit. JSON's "
        "compactness and parse speed matter for high-volume machine traffic "
        "where nobody reads the payload, which is not this situation, and it "
        "has no comments. CSV cannot express structure at all, and plain text "
        "cannot be validated."),
]

LESSON_MARKUP = lesson(
    MAJOR, MIDDLE,
    "Markup and Other Languages: HTML, XML, JSON and Notation",
    _markup_quiz,
    lesson_structure(
        "Markup and Other Languages: HTML, XML, JSON and Notation",
        "The languages in this lesson do not compute anything. They describe "
        "structure, so that a program reading the text knows which part is a "
        "heading and which is a price -- information a human infers from "
        "layout and a machine cannot. You will learn how HTML marks up "
        "documents and why semantic markup matters beyond appearance, how XML "
        "generalises the same syntax to any data and what well-formed and "
        "valid each mean, how JSON trades XML's verbosity for a direct "
        "mapping onto the structures languages already have, the other "
        "notations an engineer meets daily, and how these documents are "
        "safely read back.",
        [
            "Explain what markup adds to plain text and why that matters",
            "Describe HTML's structure and distinguish semantic from "
            "presentational markup",
            "Explain the separation of content from presentation and its "
            "practical consequence",
            "Distinguish well-formed from valid XML",
            "Compare XML and JSON and choose between them for a stated "
            "situation",
            "Identify CSS, SGML, YAML, CSV, regular expressions and Markdown "
            "from a description",
            "Choose between tree-based and streaming parsing",
        ],
        60,
        _markup_sections,
        [
            ("Markup",
             "Notation added around text to describe what each part is, "
             "making the text machine-readable without ceasing to be "
             "human-readable."),
            ("HTML",
             "A markup language with a fixed vocabulary describing a "
             "document's structure -- headings, paragraphs, lists, links -- "
             "so a browser can present each part appropriately."),
            ("Semantic markup",
             "Marking content by what it IS rather than how it should look. "
             "What lets a screen reader navigate by heading and a search "
             "engine weight text."),
            ("CSS",
             "A stylesheet language pairing selectors with declarations. "
             "Cascading means several rules may apply and a defined "
             "precedence decides."),
            ("XML",
             "A markup syntax in which the author defines the vocabulary, so "
             "it describes arbitrary structured data. Verbose, "
             "self-describing and validatable."),
            ("Well-formed",
             "An XML document obeying the syntax rules: one root, every tag "
             "closed, correct nesting, quoted attributes."),
            ("Valid",
             "Well-formed AND conforming to a schema. Every valid document is "
             "well-formed; a well-formed one may be entirely invalid."),
            ("Schema (DTD, XML Schema)",
             "A statement of which elements may appear, where, and what they "
             "may contain, allowing a document to be checked mechanically."),
            ("JSON",
             "A compact data format of objects, arrays, strings, numbers, "
             "booleans and null. Maps directly onto the dictionaries and "
             "lists languages already have; supports no comments."),
            ("SGML",
             "A standard for DEFINING markup languages rather than a markup "
             "language itself. HTML was defined with it; XML is a simplified "
             "subset."),
            ("YAML",
             "A data format using significant indentation instead of "
             "brackets. Comfortable to write and unusually easy to break "
             "invisibly."),
            ("CSV",
             "Rows of comma-separated fields, with no types, no nesting and "
             "no self-description. Universally readable and fragile."),
            ("Regular expression",
             "A notation for text patterns, compiled to a finite automaton -- "
             "which is why it cannot correctly match arbitrarily nested "
             "structures."),
            ("Tree-based parsing",
             "Reading a whole document into memory as a navigable, modifiable "
             "tree. Convenient, and bounded by memory."),
            ("Event-based (streaming) parsing",
             "Reading sequentially and reporting elements as they appear, "
             "holding almost nothing. Handles files larger than memory, in "
             "one direction only."),
        ],
        "These languages describe rather than compute, and what they add to "
        "plain text is the one thing a program cannot infer: which part is a "
        "heading and which is a price. HTML supplies a fixed vocabulary for "
        "documents, and marking content by what it IS rather than how it "
        "should look is what lets a screen reader navigate and a search "
        "engine weight a heading -- with appearance held separately in CSS, "
        "so one stylesheet change restyles every page and the same content "
        "serves a phone, a desktop and print. XML takes the same syntax and "
        "lets the author define the vocabulary, making it self-describing, "
        "hierarchical and checkable against a schema; well-formed means "
        "correct syntax and valid means well-formed AND schema-conforming, so "
        "every valid document is well-formed and a well-formed one may be "
        "entirely invalid. JSON gives up XML's attributes, comments and "
        "verbosity for a compact form that maps straight onto the "
        "dictionaries and lists a language already has, which is why web APIs "
        "use it -- neither format is better in general, and the choice "
        "follows from whether people will read and agree on the document or "
        "machines will exchange it in volume. Around these sit the other "
        "notations: SGML as the meta-language both descend from, YAML and CSV "
        "as configuration and interchange formats with their own fragilities, "
        "and regular expressions, which are finite automata and therefore "
        "cannot match arbitrary nesting -- which is exactly why parsing HTML "
        "with one fails on the structures that matter.",
        exam_notes=[
            desc(
                "This is a small but reliable Subject A topic, examined by "
                "identification and by short comparisons."
            ),
            ul([
                "Distinguishing well-formed from valid XML.",
                "Comparing XML with JSON for a stated requirement.",
                "Identifying semantic against presentational markup.",
                "Explaining the benefit of separating content from "
                "presentation.",
                "Naming a notation from a description of what it does.",
                "Choosing tree-based or streaming parsing from a constraint.",
            ]),
            desc(
                "The well-formed against valid distinction is the single most "
                "reliably examined point here, and the trap is the option "
                "offering 'valid but not well-formed' -- a combination that "
                "cannot exist."
            ),
        ],
    ))

LESSONS = [LESSON_LANGUAGES, LESSON_MARKUP]

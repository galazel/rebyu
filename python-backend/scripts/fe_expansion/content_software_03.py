"""Computer System -> Software, lessons 4 and 5.

Syllabus minor categories 4 (development tools) and 5 (open source software).

The open source lesson is legal as much as technical, and the examination
treats it that way: the licence obligations are the examinable content, and
the recurring error is believing that "open source" means "no conditions".
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Computer System"
MIDDLE = "Software"

# ==========================================================================
# Lesson 4: Development tools
# ==========================================================================

_tools_sections = [
    ("What a Toolchain Is For", [
        desc(
            "Software is written by people who forget, make mistakes and work "
            "in parallel. A development toolchain exists to make those facts "
            "survivable: to remember what changed and why, to catch mistakes "
            "before a user meets them, and to let several people change the "
            "same system without destroying each other's work."
        ),
        image(fig("build-pipeline")),
        table(
            ["Tool", "The human failing it compensates for"],
            [["Source control", "We forget what we changed, and why"],
             ["Automated build", "We do it differently each time by hand"],
             ["Automated tests", "We do not re-check what we did not touch"],
             ["Static analysis", "We do not notice the patterns we always get "
                                 "wrong"],
             ["Continuous integration", "We put off merging until it is "
                                        "painful"],
             ["Issue tracking", "We lose the things nobody is working on "
                                "today"]],
            caption="Six tools, each answering something people reliably do.",
            footer="Read the right-hand column as the justification. A tool "
                   "adopted without a clear answer there is process for its "
                   "own sake, and it will be abandoned."),
    ]),

    ("Source Control", [
        desc(
            "A version control system records every change to every file, who "
            "made it, when and why. That single capability underlies "
            "everything else in this lesson, because a build, a test result "
            "or a deployment is only meaningful if it can be tied to an exact "
            "state of the source."
        ),
        content_accordion(
            "WHAT SOURCE CONTROL ACTUALLY PROVIDES",
            "Five capabilities, each of which teams reimplement badly when "
            "they lack it.",
            [("History",
              "Every previous state is recoverable, so a change that turns out "
              "to be wrong can be reverted precisely rather than "
              "reconstructed from memory."),
             ("Attribution",
              "Each line can be traced to the change that introduced it and "
              "the reason given at the time -- which is why a commit message "
              "explaining WHY is worth far more than one restating what the "
              "diff already shows."),
             ("Parallel work",
              "Several people can change the same codebase simultaneously, "
              "with the system identifying and helping resolve conflicts "
              "rather than silently losing one person's work."),
             ("Branching",
              "Independent lines of development, so unfinished work does not "
              "destabilise what is being released."),
             ("A single source of truth",
              "One authoritative answer to 'what is the current code?', which "
              "is what makes a reproducible build possible at all.")]),
        desc(
            "The syllabus distinguishes CENTRALISED systems, where there is "
            "one repository and clients hold a working copy, from "
            "DISTRIBUTED ones, where every clone is a full repository with "
            "the whole history. The practical differences follow: a "
            "distributed system permits committing and branching offline and "
            "makes every clone a backup, at the cost of a more demanding "
            "model to learn."
        ),
    ]),

    ("Branching and Merging", [
        desc(
            "A branch is an independent line of change. Branching is trivial; "
            "merging is where the cost is, and the cost grows with how long "
            "the branch lived."
        ),
        compare_grid(
            "WHY LONG-LIVED BRANCHES HURT",
            "The difficulty of a merge is roughly proportional to how much "
            "both sides changed, which compounds with time.",
            [("A short branch",
              "A day or two of work. Few conflicting changes, each easy to "
              "reason about, and the merge takes minutes."),
             ("A long branch",
              "Weeks of work while the main line also moved. Conflicts are "
              "numerous and interact, the original reasoning has been "
              "forgotten, and the merge itself becomes a risky change "
              "nobody tested.")]),
        desc(
            "This is the whole argument for CONTINUOUS INTEGRATION as a "
            "practice rather than a tool: merging frequently keeps every "
            "individual merge small, and the alternative is not avoiding the "
            "work but deferring it into one painful and error-prone event. "
            "The tooling that runs a build on every merge is the enforcement "
            "mechanism, not the idea."
        ),
        desc(
            "A CONFLICT arises when two branches change the same lines. The "
            "system cannot decide which is correct -- that requires knowing "
            "the intent of both -- so it marks the region and requires a "
            "human decision. What it CANNOT detect is a SEMANTIC conflict: "
            "two changes that merge cleanly and are together wrong, because "
            "one renamed something the other started using. Only tests find "
            "those."
        ),
    ]),

    ("Build Tools and Dependency Management", [
        desc(
            "A build turns source into something runnable. Doing it by hand "
            "is reliable exactly once, which is why the sequence is written "
            "down and executed by a tool."
        ),
        ul([
            "A build tool records the STEPS and their ORDER, and skips work "
            "whose inputs have not changed -- which is what makes an "
            "incremental build fast.",
            "A dependency manager fetches the libraries a project needs, and "
            "the libraries THOSE need, resolving version conflicts between "
            "them.",
            "A LOCK FILE records the exact versions actually used, so the "
            "same build tomorrow produces the same result. Without one, a "
            "dependency published overnight changes your build silently.",
            "A REPRODUCIBLE build gives byte-identical output from the same "
            "source, which is what lets you verify that a shipped artifact "
            "came from the source you think it did.",
        ]),
        desc(
            "TRANSITIVE dependencies are where this becomes difficult. A "
            "project directly using ten libraries may pull in three hundred, "
            "most of which nobody chose, reviewed or knows about -- and each "
            "carries its own licence and its own vulnerabilities. That is the "
            "supply chain problem the open source lesson returns to, and it "
            "originates here in the convenience of automatic resolution."
        ),
    ]),

    ("Testing Tools", [
        desc(
            "Automated tests are what let a system be changed without "
            "re-examining all of it. The tooling is examined by level, and "
            "each level answers a different question."
        ),
        table(
            ["Level", "Tests", "Speed", "What a failure tells you"],
            [["Unit", "One component in isolation", "Milliseconds",
              "Exactly which component is wrong"],
             ["Integration", "Components working together", "Seconds",
              "That the interaction is wrong, not which side"],
             ["System", "The whole assembled system", "Minutes",
              "That something is wrong somewhere"],
             ["Acceptance", "That it meets the requirement", "Varies",
              "That the requirement is unmet, whatever the cause"]],
            caption="Four levels, each slower and less precise than the one "
                    "above.",
            footer="The precision column explains the usual shape: many fast "
                   "unit tests, fewer integration tests, and a small number "
                   "of end-to-end tests -- because a failing unit test names "
                   "the defect and a failing system test only announces it."),
        desc(
            "TEST COVERAGE measures how much of the code the tests exercise, "
            "and it is examined with a caveat the syllabus takes seriously: "
            "coverage shows what was RUN, not what was CHECKED. Code executed "
            "by a test that asserts nothing counts as covered and is not "
            "tested at all, which is why a high coverage figure is weak "
            "evidence of quality and a low one is strong evidence of its "
            "absence."
        ),
    ]),

    ("Static Analysis and Code Quality Tools", [
        desc(
            "Static analysis examines source code without running it, "
            "reporting patterns that are usually defects. It complements "
            "testing rather than replacing it: tests check what the code "
            "does, and static analysis checks what it looks like it will do."
        ),
        table(
            ["Tool type", "Finds", "Characteristic weakness"],
            [["Linter", "Style violations and suspicious constructs",
              "Noisy until configured to the team's conventions"],
             ["Type checker", "Type errors before execution",
              "Only as good as the type declarations"],
             ["Security scanner", "Known vulnerable patterns and dependencies",
              "False positives, and blindness to novel flaws"],
             ["Complexity analyser", "Functions too involved to reason about",
              "Measures shape, not correctness"],
             ["Dependency scanner", "Known vulnerabilities in libraries used",
              "Depends entirely on the vulnerability database"]],
            caption="Five kinds of static analysis and what each misses.",
            footer="All of them share one failure mode: findings nobody acts "
                   "on. A tool reporting four hundred warnings that are never "
                   "addressed trains the team to ignore it, and then it "
                   "detects nothing."),
        desc(
            "That last point is the operationally important one. The value of "
            "static analysis lies almost entirely in whether its output is "
            "kept at zero -- because a clean report makes a new warning "
            "visible, and a report with hundreds of warnings hides one "
            "perfectly. Adopting a tool therefore means either fixing the "
            "backlog or explicitly baselining it, not simply switching it on."
        ),
    ]),

    ("Debugging and Diagnostic Tools", [
        desc(
            "When something is wrong and reading the code has not revealed "
            "it, the tools narrow where to look."
        ),
        content_tabs(
            "FOUR DIAGNOSTIC APPROACHES",
            "Each suits a different kind of problem, and reaching for the "
            "wrong one wastes considerable time.",
            [("Debugger", "Stop and inspect",
              "Set a breakpoint, examine variables, step through statements. "
              "Ideal for a reproducible fault in code you can run locally. "
              "Nearly useless for a fault that appears only under production "
              "load or only intermittently, because stopping the program "
              "changes its timing."),
             ("Logging", "Record what happened",
              "The only technique that works on a fault you cannot reproduce, "
              "because it captures the failure when it occurs. Its weakness "
              "is deciding in advance what to record: the information you "
              "need is the information you did not think to log."),
             ("Profiler", "Measure where time goes",
              "For performance problems rather than correctness. It answers "
              "which code consumes the time, which is almost never where "
              "people guess -- the whole reason to measure before "
              "optimising."),
             ("Tracing", "Follow one request through many components",
              "For distributed systems, where no single machine's logs "
              "contain the whole story. A trace identifier travels with the "
              "request so its path can be reassembled afterwards.")]),
        desc(
            "The general discipline is worth stating because it is what "
            "separates fast debugging from slow. Form a hypothesis about what "
            "is wrong, decide what observation would DISPROVE it, and make "
            "that observation. Changing things to see what happens is the "
            "alternative, and it produces changes nobody can later justify."
        ),
    ]),

    ("Continuous Integration and Delivery", [
        desc(
            "The pipeline in the opening figure automates the path from a "
            "change to a running system, and the syllabus distinguishes three "
            "levels of it."
        ),
        table(
            ["Practice", "Automated as far as", "The decision left to people"],
            [["Continuous integration", "Build and test on every change",
              "Everything about releasing"],
             ["Continuous delivery", "A release-ready artifact, always",
              "When to deploy it"],
             ["Continuous deployment", "Deployment to production", "Nothing "
                                                                   "routine"]],
            caption="Three levels, distinguished by where automation stops.",
            footer="Delivery and deployment differ by exactly one manual "
                   "step, and organisations frequently claim the second while "
                   "practising the first."),
        desc(
            "One rule matters more than the tooling: BUILD ONCE and promote "
            "the same artifact through every environment. Rebuilding for each "
            "environment means the thing tested is not the thing shipped, "
            "however identical the source -- a dependency may have moved, a "
            "compiler flag may differ, the build machine may have changed. "
            "Configuration is supplied to the artifact rather than compiled "
            "into it, which is what allows one artifact to serve every "
            "environment."
        ),
        desc(
            "ENVIRONMENTS are the stages an artifact passes through -- "
            "development, testing, staging, production -- and their value "
            "depends on how closely each resembles production. A staging "
            "environment with a tenth of the data and none of the integrations "
            "tests very little, which is why differences between environments "
            "are themselves worth tracking."
        ),
    ]),

    ("Environment and Configuration Management", [
        desc(
            "The classic failure is a system that works on one machine and "
            "not another, and the tools in this section exist to remove the "
            "differences that cause it."
        ),
        ul([
            "CONTAINERISATION packages an application with its runtime and "
            "libraries, so the same image runs identically wherever it is "
            "started -- which removes most of the 'works on my machine' "
            "class of problem.",
            "INFRASTRUCTURE AS CODE describes servers, networks and services "
            "in files held in source control, so an environment can be "
            "recreated exactly rather than adjusted by hand until it works.",
            "CONFIGURATION MANAGEMENT tools bring machines to a declared "
            "state and keep them there, so drift between supposedly identical "
            "machines is corrected rather than accumulating.",
            "SECRETS -- passwords, keys, tokens -- must be supplied at run "
            "time from a secure store, never committed to source control, "
            "because a repository is copied widely and its history is "
            "permanent.",
        ]),
        desc(
            "The idea common to all four is that an environment should be "
            "DESCRIBED rather than constructed. A described environment can "
            "be reviewed, versioned, recreated and compared; a constructed one "
            "exists only in the state someone left it in, and nobody can say "
            "how it differs from the one beside it."
        ),
    ]),

    ("Issue Tracking and Traceability", [
        desc(
            "Work that nobody is doing today is work that is forgotten, and "
            "an issue tracker is where it is kept instead. Its more valuable "
            "property, though, is the trail it leaves."
        ),
        table(
            ["Linked to", "Answers"],
            [["An issue and a commit", "Why was this line changed?"],
             ["An issue and a test", "What proves this was fixed?"],
             ["An issue and a release", "Which version contains the fix?"],
             ["An issue and a requirement", "Why does this feature exist?"],
             ["An issue and an incident", "What caused the outage, and what "
                                          "closed it?"]],
            caption="Five links, and the question each one answers later.",
            footer="Traceability is the ability to follow a change from the "
                   "requirement that prompted it to the release that carried "
                   "it. It costs a little discipline and is what makes an "
                   "audit, a post-incident review or a maintenance decision "
                   "possible at all."),
        desc(
            "The examination treats traceability as a quality attribute, and "
            "it recurs in Configuration Management and in System Audit for "
            "the same reason. A system whose changes cannot be traced to "
            "their reasons can still be operated; it cannot be safely "
            "modified, because nobody can establish what a piece of behaviour "
            "was for."
        ),
    ]),

    ("Integrated Development Environments", [
        desc(
            "An IDE bundles the tools in this lesson into one interface, and "
            "the syllabus expects the capabilities rather than any particular "
            "product."
        ),
        ul([
            "An EDITOR that understands the language, offering completion, "
            "navigation to a definition, and immediate reporting of errors "
            "the compiler would otherwise catch minutes later.",
            "REFACTORING operations that change structure without changing "
            "behaviour -- renaming a symbol everywhere, extracting a method -- "
            "performed by the tool rather than by search and replace, which "
            "cannot distinguish a name from a similar word in a comment.",
            "An integrated DEBUGGER, TEST RUNNER and version control client, "
            "so the whole cycle happens without leaving the tool.",
            "Project and BUILD configuration, which is where an IDE can "
            "mislead: a build that works in the IDE and fails on the build "
            "server usually means the IDE's configuration diverged from the "
            "build script.",
        ]),
        desc(
            "That last point is worth stating as a rule. The BUILD SCRIPT is "
            "the definition of how the software is built, and the IDE's "
            "configuration must derive from it rather than the reverse -- "
            "because the build server has no IDE, and a project that only "
            "builds on a developer's machine is not reproducible in the sense "
            "the earlier section required."
        ),
    ]),

    ("Documentation Tools", [
        desc(
            "Documentation goes stale because it lives apart from what it "
            "describes. The tooling that survives is the tooling that reduces "
            "that distance."
        ),
        compare_grid(
            "WHY SOME DOCUMENTATION SURVIVES AND SOME DOES NOT",
            "The pattern is consistent: documentation kept beside the thing "
            "it describes is updated, and documentation kept elsewhere is "
            "not.",
            [("Generated from source",
              "API documentation extracted from annotated code, and diagrams "
              "generated from a definition. Cannot drift far from reality, "
              "because it is produced from it."),
             ("Documentation as code",
              "Written in a plain text format, held in the same repository, "
              "reviewed in the same change. It moves with the code and is "
              "seen by the same reviewers."),
             ("Executable specification",
              "Examples written so they can be run as tests, so a "
              "specification that has drifted from the behaviour fails "
              "visibly rather than misleading quietly."),
             ("A separate document store",
              "A wiki or shared drive updated by whoever remembers. Accurate "
              "at the moment of writing and progressively less so, with "
              "nothing to signal when it stopped being true.")]),
        desc(
            "The examination's angle on this is maintainability, and the "
            "principle generalises past documentation: anything that must be "
            "kept consistent with something else should be as close to it as "
            "possible, and ideally derived from it. Two copies of a fact will "
            "diverge; the question is only how quickly and how visibly."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where development tool items are lost."),
        ul([
            "Treating high test coverage as evidence of quality. Coverage "
            "shows what was executed, not what was checked.",
            "Rebuilding an artifact per environment, so what was tested is "
            "not what ships.",
            "Letting long-lived branches accumulate, which does not avoid "
            "merge work but concentrates it.",
            "Expecting version control to detect a semantic conflict. It "
            "detects textual ones; only tests find the rest.",
            "Committing secrets to a repository, whose history is permanent "
            "and widely copied.",
            "Adopting a static analysis tool without addressing or "
            "baselining its existing findings.",
            "Reaching for a debugger on an intermittent production fault, "
            "where only logging and tracing can help.",
            "Confusing continuous delivery with continuous deployment. They "
            "differ by one manual step.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A defect appears in production roughly once a day, cannot be "
            "reproduced in the test environment, and leaves no obvious trace. "
            "Which diagnostic approach is appropriate, and why not the "
            "others?\""
        ),
        ol([
            "A debugger requires reproducing the fault while attached, and "
            "the fault is not reproducible on demand -- so it cannot be "
            "used.",
            "A profiler measures where time is spent, which addresses "
            "performance rather than a correctness defect.",
            "Reading the code has already failed, and will keep failing if "
            "the cause depends on data or timing not visible in the source.",
            "Logging captures the state at the moment of failure whenever it "
            "next occurs, which is the only approach that works on something "
            "rare and unreproducible.",
            "In a distributed system, distributed tracing extends this by "
            "reassembling the request's whole path across components.",
        ]),
        desc(
            "The item is really testing whether you match the tool to the "
            "REPRODUCIBILITY of the fault. Reproducible and local means a "
            "debugger; rare and remote means logging and tracing; slow rather "
            "than wrong means a profiler. Those three cases cover nearly "
            "every diagnostic question the paper asks."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("The toolchain reappears throughout Development Technology."),
        ul([
            "Source control and branching are Configuration Management's "
            "subject in full.",
            "Test levels are Software Integration and Qualification Testing.",
            "Static analysis and reviews are Software Construction.",
            "Environments and deployment are Installation and Acceptance "
            "Support.",
            "Containerisation comes from System Configuration and returns in "
            "Solution Business as cloud deployment.",
            "Dependency management is where the open source supply chain "
            "problem of the next lesson begins.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What test coverage measures",
              "What was executed, not what was checked",
              "Code run by a test that asserts nothing counts as covered. "
              "High coverage is weak evidence; low coverage is strong."),
             ("Build once, promote the artifact",
              "So what was tested is what ships",
              "Rebuilding per environment means the tested thing and the "
              "shipped thing differ, however identical the source."),
             ("Why long branches hurt",
              "Merge cost grows with divergence",
              "Merging frequently does not avoid the work; it keeps each "
              "merge small. That is the argument for continuous "
              "integration."),
             ("What version control cannot detect",
              "A semantic conflict",
              "Two changes that merge cleanly and are together wrong. Only "
              "tests find those."),
             ("Delivery against deployment",
              "One manual step",
              "Continuous delivery keeps an artifact release-ready; "
              "continuous deployment releases it automatically."),
             ("Matching a tool to a fault",
              "Reproducible: debugger. Rare: logging. Slow: profiler",
              "Attaching a debugger to an intermittent production fault is "
              "the standard wasted afternoon.")]),
    ]),
]

_tools_quiz = [
    mcq("AVERAGE",
        "A defect occurs in production about once a day, cannot be reproduced "
        "on demand, and the test environment never exhibits it.\n\n"
        "Which diagnostic approach is appropriate?",
        [("Attaching a debugger and stepping through the code", False),
         ("Adding logging that records state when the condition occurs", True),
         ("Running a profiler to find where time is being spent", False),
         ("Increasing test coverage until the defect is caught", False)],
        "A debugger requires reproducing the fault while attached, which is "
        "precisely what cannot be done -- and stopping the program alters the "
        "timing that may be causing it. Logging captures the state at the "
        "moment of failure whenever it next occurs, which is the only "
        "approach that works on something rare and unreproducible. A profiler "
        "addresses performance rather than correctness, and coverage measures "
        "execution rather than finding defects."),

    mcq("HARD",
        "A project reports 95% test coverage.\n\n"
        "What does this establish about quality?",
        [("That 95% of defects would be caught by the test suite", False),
         ("Very little, since coverage measures execution rather than "
          "assertion", True),
         ("That the code is 95% free of defects", False),
         ("That 95% of the requirements have been verified", False)],
        "Coverage records which lines the tests EXECUTED, not whether "
        "anything was checked about the result. Code run by a test that "
        "asserts nothing counts as fully covered and is not tested at all. "
        "The asymmetry is what makes the figure worth having: high coverage "
        "is weak evidence of quality, while low coverage is strong evidence "
        "of its absence. Requirements verification is acceptance testing, a "
        "different question entirely."),

    mcq("AVERAGE",
        "Why is it recommended to build an artifact once and promote the same "
        "artifact through every environment?",
        [("Because building is slow and repeating it wastes time", False),
         ("Because rebuilding means the tested artifact is not the shipped "
          "one", True),
         ("Because build tools cannot produce identical output twice", False),
         ("Because each environment requires different source code", False)],
        "Rebuilding for each environment introduces the possibility that "
        "something differed -- a dependency version resolved differently, a "
        "compiler flag, the state of the build machine -- so what was tested "
        "is not demonstrably what reaches production. Promoting one artifact "
        "removes that gap, with configuration supplied at run time rather "
        "than compiled in. Build speed is a secondary benefit, and the source "
        "should be identical across environments."),

    mcq("AVERAGE",
        "Two developers change different parts of the same file on separate "
        "branches, and the merge completes without conflict. The resulting "
        "code is nevertheless wrong.\n\nWhat has occurred?",
        [("A textual conflict the tool failed to detect", False),
         ("A semantic conflict, which version control cannot detect", True),
         ("Corruption of the repository history", False),
         ("A failure of the branching strategy rather than of the merge",
          False)],
        "Version control compares text. If two changes touch different lines "
        "it merges them cleanly, and it has no way to know that one renamed "
        "something the other began using, or that one changed an assumption "
        "the other relies on. Only running the tests reveals a semantic "
        "conflict, which is a substantial part of why continuous integration "
        "runs a build on every merge rather than merely performing it."),

    mcq("EASY",
        "What distinguishes continuous delivery from continuous deployment?",
        [("Delivery automates testing; deployment automates building", False),
         ("Delivery keeps an artifact release-ready; deployment releases it "
          "automatically", True),
         ("Delivery applies to internal systems; deployment to "
          "customer-facing ones", False),
         ("Delivery requires containers; deployment does not", False)],
        "Both automate the pipeline; they differ by exactly one step. "
        "Continuous delivery produces an artifact that COULD be released at "
        "any time, with a human deciding when. Continuous deployment removes "
        "that decision and releases every change that passes the pipeline. "
        "Organisations frequently claim the second while practising the "
        "first, which is why the examination draws the line explicitly."),

    mcq("HARD",
        "A team adopts a static analysis tool, which reports four hundred "
        "existing warnings. The team continues working without addressing "
        "them.\n\nWhat is the likely outcome?",
        [("The tool will gradually reduce the count as code is rewritten",
          False),
         ("New warnings become invisible among the existing ones", True),
         ("The build will fail until the warnings are resolved", False),
         ("The tool will automatically baseline the existing findings", False)],
        "The value of static analysis is almost entirely in whether its "
        "output is kept at zero, because a clean report makes a new warning "
        "conspicuous and a report with hundreds hides one perfectly. A team "
        "that learns to ignore the output has a tool that detects nothing. "
        "Adoption therefore means fixing the backlog or explicitly baselining "
        "it so only new findings are reported -- a deliberate step rather "
        "than something that happens by itself."),

    mcq("AVERAGE",
        "Which practice most directly reduces the difficulty of merging?",
        [("Using a distributed rather than a centralised version control "
          "system", False),
         ("Integrating changes frequently so each merge stays small", True),
         ("Requiring every merge to be performed by a senior developer",
          False),
         ("Prohibiting more than one developer from editing a file", False)],
        "Merge difficulty grows with how far the two lines have diverged, so "
        "merging often keeps each individual merge small and comprehensible. "
        "Deferring integration does not avoid the work -- it concentrates it "
        "into one large, risky event whose original reasoning has been "
        "forgotten. This is the argument for continuous integration as a "
        "practice; the tooling that builds on every merge is the enforcement "
        "rather than the idea."),

    mcq("AVERAGE",
        "What is the purpose of a lock file in dependency management?",
        [("To prevent two developers modifying dependencies "
          "simultaneously", False),
         ("To record the exact versions used so the build is reproducible",
          True),
         ("To restrict which libraries a project is permitted to use", False),
         ("To cache downloaded libraries so builds run faster", False)],
        "A dependency declaration usually permits a range of versions, so "
        "without a lock file a library published overnight can change your "
        "build silently. The lock file records exactly what was resolved, so "
        "the same source produces the same build tomorrow and on someone "
        "else's machine. It is about reproducibility rather than concurrency, "
        "policy or caching."),

    mcq("HARD",
        "A project directly declares ten library dependencies, and the "
        "resolved dependency tree contains over three hundred packages.\n\n"
        "What is the principal risk this creates?",
        [("Build times will increase in proportion to the package count",
          False),
         ("Code nobody chose or reviewed runs with the application's "
          "privileges", True),
         ("The lock file will become too large to store in version control",
          False),
         ("Transitive dependencies cannot be updated independently", False)],
        "Transitive dependencies are pulled in automatically, so the vast "
        "majority were never selected, reviewed or even noticed -- and each "
        "executes with the application's full privileges and carries its own "
        "licence obligations and vulnerabilities. This is the software supply "
        "chain problem, and it originates in exactly the convenience that "
        "makes dependency managers valuable. Build time and file size are "
        "real but minor by comparison."),

    mcq("EASY",
        "Which tool is appropriate for determining why a program is slower "
        "than expected?",
        [("A debugger", False),
         ("A profiler", True),
         ("A linter", False),
         ("A dependency scanner", False)],
        "A profiler measures where execution time is actually spent, which is "
        "almost never where people expect -- and that mismatch is the entire "
        "reason to measure before optimising rather than after. A debugger "
        "addresses incorrect behaviour, a linter reports style and suspicious "
        "constructs without running the code, and a dependency scanner checks "
        "libraries against known vulnerabilities."),
]

LESSON_TOOLS = lesson(
    MAJOR, MIDDLE,
    "Development Tools, Build Chains and Testing Environments",
    _tools_quiz,
    lesson_structure(
        "Development Tools, Build Chains and Testing Environments",
        "Software is written by people who forget, make mistakes and work in "
        "parallel, and a toolchain exists to make those facts survivable. "
        "This lesson covers what source control provides and why branching is "
        "cheap while merging is not, how builds and dependency management "
        "produce a reproducible artifact and where the supply chain problem "
        "begins, the levels of automated testing and what a coverage figure "
        "does and does not establish, static analysis and the reason its "
        "value collapses if findings go unaddressed, matching a diagnostic "
        "tool to the reproducibility of a fault, and the pipeline that "
        "carries one artifact from a change to a running system.",
        [
            "State what source control provides and distinguish centralised "
            "from distributed systems",
            "Explain why merge cost grows with divergence and what a semantic "
            "conflict is",
            "Explain reproducible builds, lock files and transitive "
            "dependencies",
            "Compare the levels of automated testing and interpret a coverage "
            "figure",
            "Identify the kinds of static analysis and why unaddressed "
            "findings destroy their value",
            "Match a diagnostic tool to the reproducibility of a fault",
            "Distinguish continuous integration, delivery and deployment",
            "Explain why an environment should be described rather than "
            "constructed",
        ],
        65,
        _tools_sections,
        [
            ("Version control",
             "A system recording every change to every file with its author, "
             "time and reason. What makes a build, a test result or a "
             "deployment traceable to an exact source state."),
            ("Distributed version control",
             "A system in which every clone holds the full history, allowing "
             "offline commits and making each clone a backup."),
            ("Branch",
             "An independent line of change. Cheap to create; the cost is in "
             "the merge, and it grows with how long the branch lived."),
            ("Semantic conflict",
             "Two changes that merge cleanly and are together wrong. Version "
             "control cannot detect it; only tests can."),
            ("Lock file",
             "A record of the exact dependency versions resolved, so the same "
             "source builds the same way tomorrow."),
            ("Transitive dependency",
             "A library pulled in by another library rather than chosen "
             "directly. The majority of a dependency tree, unreviewed and "
             "running with full privileges."),
            ("Reproducible build",
             "A build producing identical output from identical source, which "
             "is what allows a shipped artifact to be verified against its "
             "source."),
            ("Test coverage",
             "The proportion of code executed by the tests. Measures "
             "execution, not assertion -- so high coverage is weak evidence "
             "of quality and low coverage strong evidence against it."),
            ("Static analysis",
             "Examining source without running it, to report patterns that "
             "are usually defects. Its value depends on the findings being "
             "kept at zero."),
            ("Profiler",
             "A tool measuring where execution time is spent. For "
             "performance problems, and it routinely contradicts where people "
             "expect the time to go."),
            ("Distributed tracing",
             "Following one request across many components using an "
             "identifier that travels with it, since no single machine's logs "
             "hold the whole story."),
            ("Continuous integration",
             "Building and testing automatically on every change, so that "
             "merges stay small and semantic conflicts surface immediately."),
            ("Continuous delivery",
             "Keeping a release-ready artifact at all times, with a human "
             "deciding when to deploy."),
            ("Continuous deployment",
             "Automatically releasing every change that passes the pipeline. "
             "One step beyond delivery."),
            ("Infrastructure as code",
             "Describing servers and services in files held in version "
             "control, so an environment is recreated rather than adjusted by "
             "hand."),
        ],
        "A toolchain compensates for what people reliably do: forget, err and "
        "work in parallel. Source control supplies history, attribution, "
        "parallel work and one authoritative answer to what the code is -- "
        "without which no build or test result means anything. Branching is "
        "cheap and merging is not, and merge cost grows with divergence, "
        "which is the whole argument for integrating often: the work is not "
        "avoided by waiting, only concentrated. What version control cannot "
        "catch is a semantic conflict, where two changes merge cleanly and "
        "are together wrong. Builds must be reproducible, which needs a lock "
        "file recording exactly what was resolved, and the automatic "
        "resolution that makes dependency managers useful is also where the "
        "supply chain problem starts -- ten declared libraries commonly "
        "become three hundred, unreviewed and fully privileged. Tests run "
        "from fast precise unit tests to slow imprecise end-to-end ones, and "
        "a coverage figure records what was EXECUTED rather than what was "
        "checked. Static analysis complements them and collapses in value the "
        "moment its findings go unaddressed, since a report of hundreds hides "
        "a new one perfectly. Diagnostics are chosen by the fault's "
        "reproducibility -- debugger when it reproduces, logging and tracing "
        "when it does not, profiler when the problem is speed. And the "
        "pipeline that ties it together must build the artifact ONCE and "
        "promote it, because anything rebuilt per environment is not the "
        "thing that was tested.",
        exam_notes=[
            desc(
                "Development tools appear on Subject A as identification and "
                "judgement items, and the material returns throughout "
                "Development Technology."
            ),
            ul([
                "Choosing a diagnostic approach for a described fault.",
                "Interpreting what a test coverage figure establishes.",
                "Distinguishing continuous integration, delivery and "
                "deployment.",
                "Explaining the purpose of a lock file or a reproducible "
                "build.",
                "Identifying a semantic conflict.",
                "Explaining why merge cost grows with branch age.",
            ]),
            desc(
                "The most reliable single discriminator here is "
                "reproducibility. Almost every diagnostic item can be "
                "answered by asking whether the fault can be made to happen "
                "on demand, and in what environment."
            ),
        ],
    ))

# ==========================================================================
# Lesson 5: Open source software
# ==========================================================================

_oss_sections = [
    ("What Open Source Actually Means", [
        desc(
            "Open source software is software whose source code is available "
            "and which is licensed to permit use, modification and "
            "redistribution. The critical word is LICENSED: open source is a "
            "licence granting permissions on conditions, not an absence of "
            "copyright."
        ),
        desc(
            "That distinction is the most examined point in this minor "
            "category, and the most consequential in practice. Source code "
            "being visible grants nothing by itself -- code published for "
            "reference with no licence at all may not lawfully be reused, and "
            "using open source software while ignoring its conditions is "
            "copyright infringement in exactly the way ignoring a commercial "
            "licence would be."
        ),
        table(
            ["Term", "Means", "Not the same as"],
            [["Open source", "Licensed for use, modification and "
                             "redistribution",
              "Free of charge"],
             ["Free software", "Emphasises the user's freedoms",
              "Zero price -- 'free' as in liberty"],
             ["Freeware", "Free of charge, source usually closed",
              "Open source"],
             ["Shareware", "Free to try, payment expected for continued use",
              "Either of the above"],
             ["Source-available", "Source visible, redistribution restricted",
              "Open source, despite the visible code"]],
            caption="Five terms the examination deliberately confuses.",
            footer="Price and openness are independent axes. Open source "
                   "software may be sold, and free-of-charge software may be "
                   "entirely closed."),
    ]),

    ("The Licence Spectrum", [
        desc(
            "Open source licences differ in one main respect: what they "
            "require of you when you distribute software that includes or "
            "derives from theirs."
        ),
        image(fig("licence-spectrum")),
        desc(
            "PERMISSIVE licences -- MIT, BSD, Apache -- ask very little. Keep "
            "the copyright notice and the licence text, and you may use the "
            "software in anything at all, including a closed commercial "
            "product, without publishing your own changes."
        ),
        desc(
            "COPYLEFT licences -- the GPL family -- require that derived works "
            "be released under the same licence. The intent is that software "
            "released as open source remains so, including after somebody "
            "else improves it, and the mechanism is a condition attached to "
            "the permission to redistribute."
        ),
        desc(
            "WEAK COPYLEFT licences -- LGPL, MPL -- sit between: changes to "
            "the licensed component itself must be published, while software "
            "that merely uses it may remain closed. The boundary is drawn at "
            "the file or the library rather than at the whole program, which "
            "is what makes them usable inside commercial products."
        ),
    ]),

    ("What Copyleft Actually Obliges", [
        desc(
            "The GPL's requirements are frequently misstated, and the "
            "examination tests the actual conditions rather than the folklore "
            "around them."
        ),
        content_accordion(
            "THE CONDITIONS, STATED CAREFULLY",
            "Each of these is a point where the common belief and the licence "
            "differ.",
            [("The obligation is triggered by DISTRIBUTION",
              "Not by use. An organisation may modify GPL software and run it "
              "internally for ever without publishing anything, because it "
              "has distributed nothing. This surprises people in both "
              "directions."),
             ("The AGPL closes that gap deliberately",
              "It extends the obligation to software made available over a "
              "network, so offering a modified AGPL program as a web service "
              "counts as distribution. This is exactly why organisations "
              "review AGPL components far more carefully than GPL ones."),
             ("Linking generally creates a derived work",
              "Under the GPL, linking your program against a GPL library "
              "usually makes your program subject to the licence. The LGPL "
              "exists precisely to permit linking without that consequence, "
              "which is why libraries intended for wide use often choose "
              "it."),
             ("The source must be OFFERED to recipients",
              "Not published to the world. The obligation runs to whoever "
              "received the binary, who must be able to obtain the "
              "corresponding source."),
             ("You may charge money",
              "The GPL restricts neither price nor commercial use. What it "
              "requires is that recipients get the source and the same "
              "rights, which in practice limits what a copy can be sold "
              "for.")]),
    ]),

    ("Compliance Obligations", [
        desc(
            "Using open source creates obligations that are administrative "
            "rather than technical, and an organisation that ignores them "
            "accumulates a legal problem invisibly."
        ),
        ul([
            "Maintain an INVENTORY of every open source component in use, "
            "including transitive dependencies -- which, as the previous "
            "lesson noted, is where most of them are.",
            "Record each component's LICENCE and the obligations it creates, "
            "since these differ substantially and a single incompatible "
            "component can constrain a whole product.",
            "Include required NOTICES in the distributed product: copyright "
            "statements, licence texts and attribution, which most permissive "
            "licences require and most products omit.",
            "Provide SOURCE where copyleft requires it, in the form the "
            "licence specifies.",
            "Check licence COMPATIBILITY when combining components, because "
            "two licences can each be perfectly acceptable and impossible to "
            "satisfy simultaneously.",
        ]),
        desc(
            "Compatibility deserves the emphasis. Combining code under two "
            "copyleft licences with differing terms can produce something "
            "that cannot lawfully be distributed under either -- and the "
            "problem is discovered at release, after the engineering is done, "
            "which is why licence review belongs at component SELECTION "
            "rather than at shipping."
        ),
    ]),

    ("Evaluating an Open Source Component", [
        desc(
            "Adopting a component is a long-term dependency, and the "
            "examination expects the criteria by which one is judged."
        ),
        table(
            ["Criterion", "The question", "A poor answer looks like"],
            [["Licence", "Can we use it as we intend?",
              "A copyleft licence in a closed product"],
             ["Activity", "Is it maintained?",
              "No commits or releases for two years"],
             ["Community", "Is maintenance concentrated in one person?",
              "A single maintainer with no successor"],
             ["Security", "Are vulnerabilities found and fixed?",
              "Open advisories with no response"],
             ["Documentation", "Can we use it without reading the source?",
              "A README and nothing else"],
             ["Dependencies", "What else does it drag in?",
              "A large tree of unmaintained transitive packages"],
             ["Exit cost", "How hard would replacing it be?",
              "Its types spread throughout our code"]],
            caption="Seven criteria for adopting a component.",
            footer="The last row is the one teams skip. A component confined "
                   "behind an interface of your own can be replaced; one "
                   "whose types appear in every file cannot."),
        desc(
            "The 'single maintainer' risk is worth naming as such, because it "
            "is common and under-appreciated. An enormous amount of widely "
            "used infrastructure is maintained by one unpaid person, and the "
            "component's future depends on their continued interest, health "
            "and goodwill -- which is a dependency no contract covers."
        ),
    ]),

    ("Supply Chain Risk", [
        desc(
            "Because dependencies are resolved automatically and transitively, "
            "an organisation runs a great deal of code nobody chose. That is "
            "the software supply chain, and it is a security concern the "
            "syllabus now treats seriously."
        ),
        content_tabs(
            "HOW A SUPPLY CHAIN IS ATTACKED",
            "Each of these has occurred repeatedly in practice, which is why "
            "the examination expects them.",
            [("Compromised package", "The real package, altered",
              "An attacker obtains the maintainer's credentials and publishes "
              "a version containing malicious code, which is then pulled "
              "automatically into every project that updates. The package is "
              "genuine and the signature may be valid."),
             ("Typosquatting", "A package with a nearly identical name",
              "A malicious package named to resemble a popular one, catching "
              "anyone who mistypes it or copies a wrong instruction. It is "
              "trivial to publish and it works."),
             ("Dependency confusion", "A public package shadowing a private "
                                      "one",
              "If a build tool checks a public registry before an internal "
              "one, an attacker publishing a public package with an internal "
              "name at a higher version can have it chosen instead."),
             ("Abandoned package takeover", "A neglected package transferred",
              "A maintainer who has lost interest hands the package to "
              "someone offering to help, who then publishes a malicious "
              "release into everything that depends on it.")]),
        desc(
            "The defences are proportionate rather than absolute: pin exact "
            "versions so an update is a deliberate act, use a lock file, scan "
            "dependencies against vulnerability databases, prefer an internal "
            "mirror over pulling directly from a public registry, and review "
            "what a new dependency brings with it before adding it."
        ),
    ]),

    ("Support and Business Models", [
        desc(
            "Open source software has no vendor obliged to help you, which is "
            "a real difference from a commercial licence and is examined as a "
            "selection criterion."
        ),
        compare_grid(
            "WHERE SUPPORT COMES FROM",
            "The examination asks which model suits an organisation with a "
            "stated requirement.",
            [("Community support",
              "Documentation, forums and issue trackers, answered by "
              "volunteers when they choose to. Free, often excellent, and "
              "carries no obligation and no response time."),
             ("Commercial support for open software",
              "A vendor sells support, certification and long-term "
              "maintenance for software that remains open. The common "
              "enterprise answer, since it buys accountability without "
              "surrendering the code."),
             ("Open core",
              "A free open core with proprietary paid additions. The "
              "essential question is whether the free part is genuinely "
              "sufficient or is designed not to be."),
             ("In-house support",
              "The organisation reads the source and fixes its own problems, "
              "which the licence permits. Genuinely viable, and it requires "
              "capability that must be maintained.")]),
        desc(
            "The point worth taking is that 'no licence fee' is not 'no "
            "cost'. Someone must still evaluate, integrate, patch, upgrade "
            "and support the component, and that effort appears in the total "
            "cost of ownership whether or not anybody budgets for it. "
            "Comparing an open source option against a commercial one on "
            "licence fee alone is the same error the System Evaluation lesson "
            "warned about."
        ),
    ]),

    ("Choosing a Licence for Your Own Work", [
        desc(
            "The syllabus expects the decision from the other side too: an "
            "organisation releasing software as open source must choose what "
            "it is asking of everyone downstream."
        ),
        ol([
            "Decide the GOAL first. Widest possible adoption, ensuring "
            "improvements come back, or building a business around the "
            "software are three different aims and they select different "
            "licences.",
            "For widest adoption, choose PERMISSIVE. Nothing deters a "
            "commercial adopter less, which is why languages, protocols and "
            "foundational libraries overwhelmingly use MIT, BSD or Apache.",
            "To ensure improvements return, choose COPYLEFT -- and accept "
            "that some organisations will decline to adopt it for exactly "
            "that reason.",
            "For a library intended to be embedded in closed products, choose "
            "WEAK COPYLEFT, which protects the library itself without "
            "reaching into its users.",
            "Check that you HAVE the right to license it: code written by "
            "employees, incorporated from elsewhere, or covered by a "
            "contract may not be yours to release.",
        ]),
        desc(
            "Step five is where organisations get into difficulty, and it is "
            "why a CONTRIBUTOR LICENCE AGREEMENT exists. A project accepting "
            "outside contributions needs the right to distribute them under "
            "its licence, and without an explicit agreement each contributor "
            "retains their own copyright -- which makes relicensing later "
            "impossible without tracing every one of them."
        ),
    ]),

    ("Why Organisations Use Open Source at All", [
        desc(
            "The examination expects the reasons and the counter-arguments, "
            "because both appear in procurement scenarios."
        ),
        table(
            ["Reason given", "How far it holds"],
            [["No licence fee", "True, and it is the least important reason "
                                "once total cost is counted"],
             ["The source can be inspected",
              "True, and only valuable if someone actually inspects it"],
             ["It can be modified to fit",
              "True, and every local modification must then be maintained "
              "against future versions"],
             ["No vendor lock-in",
              "Partly: you keep the source, though a component nobody else "
              "maintains is its own trap"],
             ["Wide adoption means fewer defects",
              "Often true for popular components, and no guarantee -- "
              "widely used code has had widely exploited flaws"],
             ["Open standards and interoperability",
              "A property of the standard rather than of the source, and the "
              "two are separate"]],
            caption="Six common justifications, honestly assessed.",
            footer="Every row is qualified, which is the point. Open source "
                   "is a normal engineering choice with normal trade-offs, "
                   "not a category that escapes them."),
        desc(
            "The strongest genuine argument is usually the third combined "
            "with the fourth: possessing the source means a problem can "
            "always be fixed by someone, even if the original maintainer "
            "disappears. That is a real form of continuity insurance, and it "
            "is worth something even to an organisation that never intends to "
            "exercise it."
        ),
    ]),

    ("Open Source in an Organisation", [
        desc(
            "Adopting open source at scale is a governance question as much "
            "as a technical one, and the syllabus expects the controls an "
            "organisation puts around it."
        ),
        table(
            ["Control", "What it prevents"],
            [["An approved component list",
              "Every team independently adopting a different library for the "
              "same job"],
             ["Licence review before adoption",
              "Discovering an incompatible obligation at release"],
             ["An internal package mirror",
              "Builds depending on a public registry's availability, and "
              "some supply chain attacks"],
             ["Automated dependency scanning",
              "Known vulnerabilities persisting because nobody was watching"],
             ["A contribution policy",
              "Uncertainty about whether staff may contribute, and who owns "
              "what they write"]],
            caption="Five controls, each answering a way open source adoption "
                    "goes wrong.",
            footer="Note that none of these is about whether to use open "
                   "source. That question was settled long ago; these are "
                   "about using it deliberately rather than by accumulation."),
        desc(
            "A CONTRIBUTION POLICY is the one organisations most often lack. "
            "Staff fixing a bug in a component they use benefits everyone -- "
            "and raises questions about who owns work produced in company "
            "time, what may be disclosed about internal systems, and whether "
            "a contributor licence agreement may be signed. Answering those "
            "in advance is what allows contribution to happen at all."
        ),
        desc(
            "The argument FOR contributing back is practical rather than "
            "altruistic. A local fix must be reapplied to every future "
            "version indefinitely, while an accepted fix is maintained by the "
            "project from then on -- so contributing is usually the cheaper "
            "option over any reasonable horizon."
        ),
    ]),

    ("Keeping Components Current", [
        desc(
            "An adopted component is not a decision made once. Versions "
            "arrive, vulnerabilities are disclosed, and the cost of upgrading "
            "rises with every version skipped."
        ),
        compare_grid(
            "TWO UPGRADE STRATEGIES",
            "The examination frames this as a maintenance decision, and the "
            "arithmetic favours one of them clearly.",
            [("Upgrade continuously",
              "Take each release soon after it appears. Each step is small, "
              "the changes are documented and recent, and a problem is "
              "attributable to one upgrade. Requires regular effort that is "
              "never urgent."),
             ("Upgrade when forced",
              "Wait until a vulnerability or an incompatibility compels it. "
              "No effort meanwhile, and the eventual jump crosses many "
              "versions at once -- so breaking changes accumulate, the "
              "upgrade becomes a project, and it happens under time "
              "pressure.")]),
        desc(
            "This is the branching argument from the previous lesson in "
            "another costume: deferring integration does not avoid work, it "
            "concentrates it and adds risk. The difference is that here the "
            "forcing event is often a published vulnerability, so the delayed "
            "upgrade must be done urgently and while exposed."
        ),
        desc(
            "SEMANTIC VERSIONING is what makes continuous upgrading "
            "tractable. A version numbered major.minor.patch promises that a "
            "patch fixes without changing behaviour, a minor release adds "
            "compatibly, and only a major release may break existing use -- "
            "so patch and minor updates can be taken with little "
            "investigation. It is a convention rather than a guarantee, and "
            "it is followed often enough to be worth relying on with tests."
        ),
    ]),

    ("Open Source and Open Standards", [
        desc(
            "The two are routinely confused and are entirely independent, "
            "which the examination tests directly."
        ),
        compare_grid(
            "TWO DIFFERENT KINDS OF OPENNESS",
            "One is about a specification; the other is about an "
            "implementation.",
            [("An open standard",
              "A published specification anyone may implement, usually "
              "maintained by a standards body. It says nothing about whether "
              "any implementation is open source -- HTTP and SQL are open "
              "standards with both open and closed implementations."),
             ("Open source software",
              "An implementation licensed for use, modification and "
              "redistribution. It may implement an open standard, a "
              "proprietary one, or nothing standardised at all.")]),
        desc(
            "The distinction matters for procurement, and it is where the "
            "portability argument actually lives. An open STANDARD is what "
            "protects against lock-in, because it means an alternative "
            "implementation exists or could -- whereas adopting an open "
            "source product that implements nothing standard leaves you with "
            "the source and no alternative to move to, which is a weaker "
            "position than it appears."
        ),
        desc(
            "Standardisation is treated properly in the Corporate and Legal "
            "Affairs major. What belongs here is simply that the two "
            "properties are orthogonal: software can be open source and "
            "proprietary in its formats, or closed source and scrupulously "
            "standards-compliant."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where open source items are lost."),
        ul([
            "Treating open source as meaning free of charge. Price and "
            "openness are independent.",
            "Treating visible source as open source. Without a licence "
            "granting reuse, it is not.",
            "Believing the GPL is triggered by use. It is triggered by "
            "distribution -- and the AGPL extends that to network services.",
            "Assuming a permissive licence imposes nothing. Attribution and "
            "licence notices are still required.",
            "Ignoring transitive dependencies in a licence inventory, where "
            "most components actually are.",
            "Assuming two acceptable licences can always be combined. "
            "Compatibility is a separate question.",
            "Comparing an open source option to a commercial one on licence "
            "fee rather than total cost of ownership.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An organisation modifies a GPL-licensed application and runs it "
            "on its own internal servers for its own staff. It distributes "
            "nothing. What are its obligations?\""
        ),
        ol([
            "Identify what triggers the GPL's source obligation: "
            "DISTRIBUTION of the software, not use of it.",
            "Establish whether distribution has occurred. Running software "
            "internally for your own staff is use, not distribution -- no "
            "copy leaves the organisation.",
            "So under the GPL, no source need be published, however "
            "extensively the software was modified.",
            "Check whether the licence is in fact the AGPL, which "
            "deliberately extends the obligation to software offered over a "
            "network -- in which case making it available to users over a "
            "network WOULD trigger it.",
            "Answer: under the GPL, no obligation arises; the answer changes "
            "entirely under the AGPL.",
        ]),
        desc(
            "This item is a favourite because both common beliefs are wrong. "
            "One group assumes any use of GPL software forces disclosure, and "
            "the other assumes internal modification is always safe -- and "
            "the second is exactly what the AGPL was written to address. The "
            "specific licence, not the family, decides it."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Open source reaches into the legal and management majors."),
        ul([
            "Licensing is copyright law, treated fully in Intellectual "
            "Property Rights.",
            "Supply chain attacks are a Security topic and a Configuration "
            "Management concern.",
            "Component selection is a make-or-buy decision from Software "
            "Development Management.",
            "Support models and total cost of ownership come from System "
            "Evaluation and Procurement Planning.",
            "Dependency inventories are configuration items in Configuration "
            "Management.",
            "Open standards reappear in Standardisation as a separate idea "
            "from open source.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What open source actually is",
              "A licence granting rights on conditions",
              "Not an absence of copyright, and not a statement about price. "
              "Visible source without a licence grants nothing."),
             ("What triggers the GPL's source obligation",
              "Distribution, not use",
              "Internal modification and use requires publishing nothing. The "
              "AGPL extends the trigger to network services."),
             ("Permissive against copyleft",
              "Keep the notice against release derived works alike",
              "MIT and BSD ask for attribution; the GPL requires the same "
              "licence downstream; the LGPL permits linking without it."),
             ("Why licence compatibility matters",
              "Two acceptable licences may be impossible to satisfy together",
              "Discovered at release, after the engineering, which is why "
              "review belongs at selection."),
             ("The commonest supply chain attacks",
              "Compromised packages and typosquatting",
              "Both exploit automatic transitive resolution. Pinning "
              "versions and using a lock file make an update deliberate."),
             ("Why 'no licence fee' is not 'no cost'",
              "Evaluation, integration, patching and support remain",
              "The comparison against a commercial product must be on total "
              "cost of ownership.")]),
    ]),
]

_oss_quiz = [
    mcq("HARD",
        "GPL-licensed software is modified and run on an organisation's "
        "internal servers for its own employees, with no copies distributed.\n\n"
        "What must it publish?",
        [("The full source of its modifications, because the software was "
          "changed", False),
         ("Nothing, because the GPL obligation is triggered by distribution",
          True),
         ("A notice describing the modifications, though not the source "
          "code itself", False),
         ("Nothing, provided the modifications amount to under half of the "
          "code", False)],
        "The GPL's source obligation arises when software is DISTRIBUTED, and "
        "running it internally distributes nothing -- so an organisation may "
        "modify and use GPL software indefinitely without publishing "
        "anything. The AGPL was written specifically to close this gap by "
        "treating network availability as distribution, so the answer would "
        "reverse under that licence. The proportion of code modified is "
        "irrelevant to the trigger."),

    mcq("EASY",
        "Source code for a product is published on a public website with no "
        "licence terms attached.\n\n"
        "May it be reused in another product?",
        [("Yes, because publishing source code places it in the public "
          "domain", False),
         ("No, because copyright is reserved without a licence", True),
         ("Yes, provided the original author is credited in the derived "
          "product", False),
         ("Yes, but for non-commercial purposes only", False)],
        "Copyright exists automatically, and a licence is what grants "
        "permission to use, copy or modify a work. Publishing source makes it "
        "VISIBLE and grants nothing, so reusing it would infringe. This is "
        "why open source is defined by its licence rather than by the "
        "availability of the code, and why a repository without a licence "
        "file is effectively unusable however public it is."),

    mcq("AVERAGE",
        "Which obligation does a permissive licence such as MIT typically "
        "impose?",
        [("Derived works must be released under the same licence terms",
          False),
         ("The copyright notice and licence text must be kept", True),
         ("Source must be offered to anyone receiving the binary form",
          False),
         ("The software may not be included in commercial products",
          False)],
        "Permissive licences ask very little: retain the copyright notice and "
        "licence text, and the software may be used in anything including a "
        "closed commercial product. Requiring derived works to carry the same "
        "licence is copyleft, and offering source to recipients is the GPL's "
        "condition. Note that 'very little' is not 'nothing' -- omitting the "
        "required attribution is the most common open source compliance "
        "failure there is."),

    mcq("AVERAGE",
        "How does the AGPL differ from the GPL?",
        [("It permits linking from proprietary software without any "
          "restriction at all", False),
         ("It treats network availability as distribution", True),
         ("It removes the requirement to provide source to those who "
          "receive it", False),
         ("It prohibits commercial use of the licensed software "
          "entirely", False)],
        "The AGPL exists to close what its authors saw as a loophole: an "
        "organisation could modify GPL software, offer it as a web service, "
        "and never distribute a copy -- so no source obligation arose. Under "
        "the AGPL, network availability counts, which is precisely why "
        "organisations review AGPL components far more carefully. Permitting "
        "linking is the LGPL, and neither licence restricts commercial use."),

    mcq("AVERAGE",
        "An attacker publishes a package whose name closely resembles a "
        "widely used library, hoping developers will mistype or copy an "
        "incorrect instruction.\n\nWhat is this attack called?",
        [("Dependency confusion", False),
         ("Typosquatting", True),
         ("Package takeover", False),
         ("Licence contamination", False)],
        "Typosquatting relies on the name alone: a package deliberately "
        "similar to a popular one, catching anyone who mistypes it or copies "
        "a wrong command. Dependency confusion is the related but distinct "
        "attack in which a public package shadows an internal one of the same "
        "name at a higher version. Package takeover is acquiring an abandoned "
        "package from its maintainer, and licence contamination is not an "
        "attack at all."),

    mcq("HARD",
        "Two open source components are each individually acceptable for a "
        "product, but the product cannot lawfully be distributed when both "
        "are included.\n\nWhat has occurred?",
        [("One of the components has been abandoned by its original "
          "maintainer", False),
         ("The two licences impose conditions that conflict", True),
         ("The components have overlapping transitive dependency "
          "trees", False),
         ("One component's licence has been revoked by its author",
          False)],
        "Licence compatibility is a separate question from whether each "
        "licence is acceptable alone: two sets of conditions can each be "
        "satisfiable and impossible to satisfy simultaneously, particularly "
        "where both are copyleft with differing terms. Because the problem "
        "surfaces at release, after all the engineering is done, licence "
        "review belongs at component SELECTION rather than at shipping."),

    mcq("EASY",
        "Which statement about the relationship between open source and price "
        "is correct?",
        [("Open source software is by definition free of charge", False),
         ("Open source concerns licensing rights, and such software may be "
          "sold", True),
         ("Open source software may be sold only if it has been modified",
          False),
         ("Software distributed free of charge is by definition open "
          "source", False)],
        "Openness and price are independent. An open source licence grants "
        "rights to use, modify and redistribute; it says nothing about "
        "charging, and open source software is routinely sold with support "
        "and certification. Conversely freeware is free of charge with closed "
        "source. Confusing the two is the most common misconception in this "
        "topic and the examination tests it directly."),

    mcq("AVERAGE",
        "Assessment is under way of an open source library maintained by a "
        "single unpaid individual.\n\n"
        "What is the principal risk?",
        [("The licence terms are likely to change without any notice "
          "given", False),
         ("Maintenance depends on one person's availability", True),
         ("Single-maintainer projects may not be used commercially at "
          "all", False),
         ("The code will contain more defects than a comparable "
          "corporate project", False)],
        "A great deal of widely used infrastructure rests on one unpaid "
        "maintainer, and the component's future then depends on their "
        "continued interest, health and goodwill -- a dependency no contract "
        "covers, and one that also makes the project vulnerable to a takeover "
        "attack if they hand it on. Licences on existing releases cannot "
        "simply be revoked, commercial use is a licence question, and code "
        "quality does not follow from project size."),

    mcq("HARD",
        "Comparison is being made between an open source database costing "
        "nothing to licence and a commercial product carrying a substantial "
        "annual fee.\n\nWhat makes this comparison misleading as stated?",
        [("Open source products are generally less capable than their "
          "commercial equivalents", False),
         ("It omits the effort the open option still requires", True),
         ("Open source licences prohibit use within commercial "
          "organisations", False),
         ("The commercial product's annual fee will decrease over "
          "time", False)],
        "No licence fee is not no cost. Someone must still evaluate, "
        "integrate, patch, upgrade, monitor and support the component, and "
        "that effort belongs in the total cost of ownership whether or not it "
        "is budgeted -- which is precisely the error the System Evaluation "
        "lesson warned about when comparing on purchase price. Commercial "
        "support for open source exists to convert that effort back into a "
        "fee where an organisation prefers it."),

    mcq("AVERAGE",
        "Which measure most directly reduces the risk that a compromised "
        "package release is pulled automatically into a build?",
        [("Pinning exact versions and using a lock file", True),
         ("Increasing automated test coverage across the whole "
          "application", False),
         ("Choosing only permissively licensed dependencies where "
          "possible", False),
         ("Building and releasing the application more frequently",
          False)],
        "Pinning exact versions and recording them in a lock file means an "
        "update becomes a deliberate act rather than something that happens "
        "when a build runs -- which removes the automatic path a compromised "
        "release depends on. Tests are unlikely to detect deliberately "
        "concealed malicious code, licence type is unrelated to compromise, "
        "and building more frequently increases exposure rather than reducing "
        "it."),
]

LESSON_OPENSOURCE = lesson(
    MAJOR, MIDDLE,
    "Open Source Software, Licensing and Adoption",
    _oss_quiz,
    lesson_structure(
        "Open Source Software, Licensing and Adoption",
        "Open source is a licence granting rights on conditions, not an "
        "absence of copyright and not a statement about price -- and almost "
        "every examinable point in this lesson follows from taking that "
        "seriously. It covers the licence spectrum from permissive through "
        "weak copyleft to the GPL, what copyleft actually obliges and what "
        "triggers it, the compliance obligations an organisation accumulates "
        "invisibly, how a component is evaluated before adoption, the supply "
        "chain attacks that automatic dependency resolution makes possible, "
        "and why no licence fee is very far from no cost.",
        [
            "Define open source and distinguish it from freeware, shareware "
            "and source-available software",
            "Compare permissive, weak copyleft and strong copyleft licences",
            "State what triggers a copyleft obligation and how the AGPL "
            "differs",
            "List the compliance obligations open source use creates",
            "Apply selection criteria when evaluating a component",
            "Identify supply chain attacks and the measures against them",
            "Compare support models and reason about total cost of ownership",
        ],
        60,
        _oss_sections,
        [
            ("Open source software",
             "Software licensed to permit use, modification and "
             "redistribution. A licence granting rights on conditions, not an "
             "absence of copyright and not a statement about price."),
            ("Permissive licence",
             "MIT, BSD, Apache. Requires the copyright notice and licence "
             "text to be retained, and permits use in closed products."),
            ("Copyleft",
             "A condition requiring derived works to be released under the "
             "same licence, so that software released as open source remains "
             "so."),
            ("Weak copyleft",
             "LGPL, MPL. Changes to the licensed component must be published; "
             "software merely using it may stay closed."),
            ("AGPL",
             "A copyleft licence treating network availability as "
             "distribution, so offering a modified program as a web service "
             "triggers the source obligation."),
            ("Licence compatibility",
             "Whether two licences' conditions can both be satisfied at once. "
             "Each may be individually acceptable and the combination "
             "undistributable."),
            ("Software supply chain",
             "The full set of components a product depends on, most of them "
             "transitive and unchosen, each running with the application's "
             "privileges."),
            ("Typosquatting",
             "Publishing a malicious package named to resemble a popular one, "
             "catching mistyped or miscopied references."),
            ("Dependency confusion",
             "A public package shadowing an internal one of the same name at "
             "a higher version, chosen by a build tool that checks the public "
             "registry first."),
            ("Open core",
             "A free open source core with proprietary paid additions. The "
             "question to ask is whether the free part is genuinely "
             "sufficient."),
            ("Freeware",
             "Software distributed free of charge, usually with closed "
             "source. Not open source."),
        ],
        "Open source is defined by a LICENCE granting rights on conditions -- "
        "not by visible code, which grants nothing on its own, and not by "
        "price, since open source software may be sold and free-of-charge "
        "software is often entirely closed. The licences form a spectrum by "
        "what they demand when you distribute: permissive ones ask for the "
        "notice to be retained and nothing more, weak copyleft requires "
        "changes to the component itself be published while your own code "
        "stays closed, and strong copyleft requires derived works to carry the "
        "same licence. What triggers that obligation is DISTRIBUTION rather "
        "than use, so internal modification publishes nothing -- and the AGPL "
        "was written precisely to extend the trigger to software offered over "
        "a network. Compliance is administrative: inventory every component "
        "including the transitive majority, record its licence, ship the "
        "required notices, and check compatibility at selection rather than at "
        "release, since two individually acceptable licences can be "
        "impossible to satisfy together. Adoption is a long-term dependency "
        "judged on licence, maintenance, community, security, documentation, "
        "what else it drags in, and how hard it would be to remove. And the "
        "automatic transitive resolution that makes all this convenient is "
        "also the attack surface -- compromised releases, typosquatting and "
        "dependency confusion all exploit it, which is why pinned versions "
        "and a lock file matter. No licence fee is not no cost.",
        exam_notes=[
            desc(
                "Open source items on Subject A are predominantly about "
                "licence obligations, and the material returns in "
                "Intellectual Property Rights."
            ),
            ul([
                "Determining what a copyleft licence obliges in a described "
                "situation.",
                "Distinguishing the GPL from the AGPL by what triggers them.",
                "Distinguishing open source from freeware and shareware.",
                "Identifying a supply chain attack from its description.",
                "Applying selection criteria to a described component.",
                "Recognising that licence fee is not total cost.",
            ]),
            desc(
                "On any licence item, establish first whether DISTRIBUTION "
                "has occurred and then which specific licence applies. Both "
                "common beliefs -- that any use of GPL software forces "
                "disclosure, and that internal use is always safe -- are "
                "wrong, and the item is usually built on one of them."
            ),
        ],
    ))

LESSONS = [LESSON_TOOLS, LESSON_OPENSOURCE]

"""Development Technology -> System Development Technology, lessons 7 and 8.

Syllabus stages: software integration and qualification testing, and system
integration, system testing and installation.

The examination's questions here are about LEVELS -- which test proves what,
and against which specification -- so both lessons keep the V-model pairing
in view rather than treating testing as one undifferentiated activity.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Development Technology"
MIDDLE = "System Development Technology"

# ==========================================================================
# Lesson 7: Software integration and qualification testing
# ==========================================================================

_int_sections = [
    ("Putting the Parts Together", [
        desc(
            "Unit testing proved each module works alone. Integration asks "
            "whether they work together, which is a different question with "
            "its own characteristic failures."
        ),
        image(fig("test-levels")),
        desc(
            "Modules that each satisfy their own specification can still fail "
            "in combination, because each was built against an "
            "INTERPRETATION of the interface between them. Integration is "
            "where the two interpretations meet, and where the difference "
            "becomes visible."
        ),
        table(
            ["Level", "Tests", "Against"],
            [["Unit", "One module alone", "Its detailed design"],
             ["Integration", "Modules working together",
              "The interface specifications"],
             ["Qualification", "The software as a whole",
              "The software requirements"],
             ["System", "The whole system including hardware",
              "The system requirements"],
             ["Acceptance", "Fitness for the business",
              "The original business need"]],
            caption="Five levels, each with its own specification to test "
                    "against.",
            footer="The third column is what the examination asks about. A "
                   "test at the wrong level proves the wrong thing, and the "
                   "specification each level is checked against is what "
                   "distinguishes them."),
    ]),

    ("The V-Model", [
        desc(
            "The pairing of specification with test is the idea the syllabus "
            "uses to organise all of this."
        ),
        image(fig("v-model")),
        desc(
            "Each specification produced going down has a matching "
            "verification coming up. Unit tests check the detailed design, "
            "integration tests check the interfaces, qualification tests "
            "check the software requirements, and acceptance testing checks "
            "the business need."
        ),
        desc(
            "The practical value is that each test level is planned when its "
            "specification is written, not when the code arrives. Writing "
            "acceptance criteria while capturing requirements exposes "
            "requirements that cannot be tested -- which is the testability "
            "check from the requirements lesson, applied systematically."
        ),
    ]),

    ("Integration Strategies", [
        desc(
            "Modules can be combined in several orders, and the choice "
            "decides what is proved early and what is deferred."
        ),
        image(fig("integration-strategies")),
        table(
            ["Strategy", "Needs", "Proves early", "Defers"],
            [["Big bang", "Nothing", "Nothing",
              "Everything, and locating a failure"],
             ["Top-down", "Stubs", "The overall control structure",
              "Low-level defects"],
             ["Bottom-up", "Drivers", "The foundations",
              "Design-level problems"],
             ["Sandwich", "Both", "Both ends",
              "The middle, which meets last"]],
            caption="Four strategies with what each requires and what each "
                    "delays.",
            footer="STUBS stand in for modules BELOW that are not written "
                   "yet; DRIVERS call modules ABOVE that are not integrated "
                   "yet. Top-down needs stubs and bottom-up needs drivers, "
                   "which is the pairing items ask for."),
        desc(
            "BIG BANG integration is examined as a cautionary case. Combining "
            "everything at once requires no scaffolding and means a failure "
            "could originate anywhere -- so the effort saved on stubs and "
            "drivers is spent many times over on diagnosis."
        ),
    ]),

    ("What Integration Testing Finds", [
        desc(
            "Integration defects have a recognisable character, and knowing "
            "it makes them easier to anticipate."
        ),
        ul([
            "Data passed in a format one side did not expect -- units, "
            "encodings, date formats, null against empty.",
            "Assumptions about ORDER: one module expecting to be called "
            "before another that calls it first.",
            "Failure handling neither side implemented, each assuming the "
            "other did.",
            "Resources acquired by one module and expected to be released by "
            "another.",
            "Timing and concurrency problems that appear only when real "
            "components run together.",
        ]),
        desc(
            "The third item is the one the design lessons predicted. An "
            "interface specification that omitted failure behaviour produces "
            "two modules each assuming the other handles it -- and the gap is "
            "invisible in unit testing, because each module's own tests "
            "confirmed only its own assumption."
        ),
    ]),

    ("Qualification Testing", [
        desc(
            "Once the software is integrated, it is tested as a whole against "
            "the software requirements -- which is the first level at which "
            "the requirements themselves are checked."
        ),
        table(
            ["Checked", "By"],
            [["Every functional requirement",
              "Exercising it through the software's own interfaces"],
             ["Every quality requirement",
              "Measuring against the stated figure"],
             ["Every interface requirement",
              "Exercising the exchanges with other systems"],
             ["Behaviour in exceptional cases",
              "Deliberately supplying bad input and failing dependencies"]],
            caption="Four things qualification testing must cover.",
            footer="The second row is only possible because the requirements "
                   "were quantified. 'The system shall be fast' cannot appear "
                   "in a test report, which is why the requirements lesson "
                   "insisted on figures."),
        desc(
            "TRACEABILITY is what makes this level manageable. Each "
            "requirement should map to the tests covering it, so the coverage "
            "question -- has everything been tested -- has an answer rather "
            "than an estimate."
        ),
    ]),

    ("Kinds of Testing", [
        desc(
            "Levels are about SCOPE; types are about what is being checked. "
            "Any type can be applied at any level, which is the distinction "
            "items turn on."
        ),
        content_accordion(
            "SIX TYPES OF TESTING",
            "What each is looking for.",
            [("Functional",
              "Does it do what was specified. The default, and what most "
              "test cases are."),
             ("Performance",
              "Does it meet its timing requirements at the stated load. "
              "Requires a quantified requirement and a realistic load."),
             ("Load and stress",
              "Load testing runs the expected volume; stress testing exceeds "
              "it deliberately to see HOW it fails -- gracefully, or "
              "catastrophically."),
             ("Security",
              "Can the controls be bypassed. Includes deliberately invalid "
              "and malicious input."),
             ("Usability",
              "Can real users accomplish the task. Measured by observation "
              "rather than opinion."),
             ("Regression",
              "Does everything that worked before still work. The type that "
              "must be repeated after every change.")]),
        desc(
            "STRESS testing is distinguished from load testing for a specific "
            "reason. Knowing a system copes with expected volume is useful; "
            "knowing what it does when volume is exceeded -- degrade, queue, "
            "reject cleanly, or corrupt data -- is what determines whether an "
            "unusual day becomes an incident."
        ),
    ]),

    ("Regression Testing", [
        desc(
            "The most-repeated testing activity, and the one whose economics "
            "decide whether a system stays maintainable."
        ),
        image(fig("regression-risk")),
        desc(
            "A change made for a good reason breaks something that depended "
            "on the old behaviour, in a part nobody touched and therefore "
            "nobody retested. That is regression, and it is the reason a "
            "working system deteriorates as it is improved."
        ),
        ol([
            "Every change requires confirming that unchanged behaviour still "
            "works.",
            "Doing that manually across a whole system is unaffordable after "
            "the first few releases.",
            "So in practice it is not done, and defects arrive exactly "
            "there.",
            "An automated suite makes the confirmation cheap enough to run on "
            "every change.",
            "Which is why the suite's cost is justified by change frequency "
            "rather than by defect count.",
        ]),
        desc(
            "That last point is the argument worth carrying. An automated "
            "suite is not primarily a way of finding defects; it is what "
            "makes CHANGING the system affordable, and a system that cannot "
            "be changed affordably is one that stops being changed."
        ),
    ]),

    ("Managing the Testing", [
        desc(
            "Testing has to be planned, recorded and reported, or its results "
            "cannot be relied upon."
        ),
        table(
            ["Artefact", "Records"],
            [["Test plan", "Scope, approach, resources and schedule"],
             ["Test case", "Inputs, preconditions and expected results"],
             ["Test data", "The values used, including the awkward ones"],
             ["Test log", "What was run, when, on which version"],
             ["Defect report", "What happened, how to reproduce, severity"],
             ["Test summary", "What was covered, what passed, what "
                              "remains"]],
            caption="Six artefacts and what each preserves.",
            footer="The EXPECTED RESULT is what makes a test case a test. "
                   "Running software and observing it is exploration; running "
                   "it against a stated expectation is testing, and only the "
                   "second can fail."),
        desc(
            "A defect report's value is in its reproduction steps. A report "
            "nobody can reproduce cannot be diagnosed or confirmed fixed, so "
            "the effort spent making it reproducible is repaid by everybody "
            "who touches it afterwards."
        ),
    ]),

    ("When to Stop", [
        desc(
            "Testing cannot prove the absence of defects, so stopping is a "
            "judgement that has to be made explicitly."
        ),
        ul([
            "All planned tests have been run, and the requirement coverage is "
            "complete.",
            "The remaining known defects are understood and accepted by "
            "somebody with authority.",
            "The rate at which new defects are being found has fallen and "
            "stayed low.",
            "The quality requirements have been measured and met.",
            "The risk of releasing is understood and judged acceptable "
            "against the risk of delaying.",
        ]),
        desc(
            "The last point is what actually decides it. Releasing with known "
            "defects is normal and is a decision; releasing without knowing "
            "what the defects are is not a decision at all, which is the "
            "distinction the syllabus draws."
        ),
    ]),

    ("Test Environments and Test Data", [
        desc(
            "Tests need somewhere to run and something to run against, and "
            "both are sources of misleading results."
        ),
        table(
            ["Concern", "Consequence if ignored"],
            [["The environment differs from production",
              "Defects hide until deployment"],
             ["Test data is too clean",
              "The awkward real cases are never exercised"],
             ["Test data is real production data",
              "Personal data has been copied outside its controls"],
             ["The environment is shared",
              "One team's change explains another team's failure"],
             ["State persists between runs",
              "Tests pass or fail depending on what ran before"]],
            caption="Five environment concerns and what each produces.",
            footer="The third row is a genuine conflict. Realistic data finds "
                   "more defects and copying production data spreads personal "
                   "information outside its protections -- which is why "
                   "masked or generated data is the usual answer."),
        desc(
            "The last row explains a specific frustration: tests that pass "
            "individually and fail together, or pass in one order and not "
            "another. Each test should establish the state it needs and leave "
            "nothing behind, which is the independence property from the "
            "construction lesson."
        ),
    ]),

    ("Deciding What to Test First", [
        desc(
            "There is never time to test everything equally, so effort is "
            "directed by risk rather than spread evenly."
        ),
        ol([
            "Identify what would cause the most harm if it failed -- money, "
            "safety, legal obligation, reputation.",
            "Identify what is most likely to fail -- newly written, recently "
            "changed, complex, or previously defective code.",
            "Combine the two: high impact and high likelihood is where effort "
            "goes first.",
            "Cover everything to some depth, since an untested area is an "
            "unknown rather than a known-good one.",
            "Revisit as testing proceeds, since found defects indicate where "
            "more are likely.",
        ]),
        desc(
            "The fifth step reflects a reliable observation: defects cluster. "
            "Areas producing defects tend to keep producing them, so "
            "discovering several in one module is a reason to test that "
            "module harder rather than to consider it now clean."
        ),
    ]),

    ("Automating Tests", [
        desc(
            "Not every test is worth automating, and the syllabus expects the "
            "judgement rather than an assumption either way."
        ),
        compare_grid(
            "WORTH AUTOMATING, AGAINST BETTER RUN BY A PERSON",
            "The decision is how often it will be repeated.",
            [("Automate",
              ["Regression tests, run on every change",
               "Anything requiring precision or volume",
               "Tests with an unambiguous expected result",
               "Anything a person would find tedious and so skip"]),
             ("Keep manual",
              ["Exploratory testing, where the point is judgement",
               "Usability, which needs a human reaction",
               "One-off checks that will not be repeated",
               "Anything whose expected result requires interpretation"])]),
        desc(
            "Automated tests are code, with the maintenance cost code has. A "
            "suite nobody maintains produces failures nobody investigates, "
            "and a suite whose failures are routinely ignored is worse than "
            "none -- because it consumes effort and provides false assurance."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where integration and testing items are lost."),
        ul([
            "Confusing stubs with drivers. Stubs stand in below; drivers call "
            "from above.",
            "Confusing test LEVELS with test TYPES. Levels are scope; types "
            "are what is checked.",
            "Expecting unit testing to find interface mismatches. Each "
            "module's tests confirmed only its own assumption.",
            "Treating load testing and stress testing as the same. Stress "
            "exceeds the limit deliberately.",
            "Assuming a manual regression suite will be run. It is "
            "unaffordable and so it is not.",
            "Writing a test case without an expected result, which cannot "
            "fail and is therefore not a test.",
            "Treating 'no defects found' as evidence of quality rather than "
            "of the tests run.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"Two modules each passed their unit tests. Integrated, one "
            "sends a date as text in one format and the other expects "
            "another. Why did unit testing not find this?\""
        ),
        ol([
            "Establish what a unit test does: exercises one module in "
            "isolation against its own specification.",
            "Each module's tests supplied or expected data according to that "
            "module's OWN interpretation of the interface.",
            "So each module passed, because each was tested against the "
            "assumption it was built on.",
            "The defect exists in the difference between two interpretations, "
            "which no test of either module alone can expose.",
            "Integration testing is the level that finds it, and a precise "
            "interface specification agreed by both sides is what would have "
            "prevented it.",
        ]),
        desc(
            "Step three is the general result. A unit test cannot detect a "
            "wrong assumption about an interface, because the test was "
            "written from the same assumption -- which is exactly why "
            "integration is a distinct level rather than more unit testing."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Integration testing depends on earlier stages."),
        ul([
            "Interface specifications come from the architecture and design "
            "lessons.",
            "Quantified quality requirements from the requirements lesson are "
            "what qualification testing measures.",
            "Traceability makes coverage answerable rather than estimated.",
            "The automated suite depends on the testable design of the "
            "construction lesson.",
            "Stress testing informs the capacity planning of System "
            "Evaluation.",
            "Accepted known defects become the risk decisions of the "
            "management lessons.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Stubs against drivers",
              "Stand in below; call from above",
              "Top-down integration needs stubs, bottom-up needs drivers."),
             ("Why unit tests miss interface mismatches",
              "Each test was written from the same assumption as its module",
              "The defect lives in the difference between two "
              "interpretations."),
             ("Levels against types",
              "Scope, against what is being checked",
              "Any type can be applied at any level, which is what items turn "
              "on."),
             ("Load against stress testing",
              "Expected volume, against deliberately exceeding it",
              "The second tells you HOW it fails, which decides whether an "
              "unusual day becomes an incident."),
             ("Why an automated regression suite is justified",
              "It makes changing the system affordable",
              "Not primarily defect-finding -- manual regression is simply "
              "not done after a few releases."),
             ("What makes a test case a test",
              "A stated expected result",
              "Without one it is exploration, and it cannot fail.")]),
    ]),
]

_int_quiz = [
    mcq("HARD",
        "Two modules pass their unit tests. Integrated, one sends a date in a "
        "format the other does not expect.\n\nWhy did unit testing not find "
        "this?",
        [("Each module's tests were written from that module's own "
          "interpretation of the interface", True),
         ("Unit tests do not exercise data conversion logic within a "
          "module", False),
         ("The date format was determined at run time rather than "
          "compiled in", False),
         ("Unit testing covers only the normal path and not data "
          "formats", False)],
        "A unit test exercises one module against its own specification, "
        "supplying and expecting data according to how that module's author "
        "understood the interface. Both modules therefore pass while "
        "disagreeing with each other, because the defect lives in the "
        "difference between two interpretations -- which no test of either "
        "one alone can expose. Integration is the level that finds it."),

    mcq("AVERAGE",
        "In top-down integration, what stands in for modules that have not "
        "been written yet?",
        [("Stubs", True),
         ("Drivers, which invoke the modules under test", False),
         ("Mocks, which record the calls made to them", False),
         ("Harnesses, which supply the test data", False)],
        "Top-down integration starts at the high-level modules, so the "
        "lower-level ones they call must be represented by STUBS returning "
        "fixed answers. Bottom-up integration starts at the foundations and "
        "needs DRIVERS to call them from above. That pairing -- stubs below, "
        "drivers above -- is what these items ask for."),

    mcq("AVERAGE",
        "Stress testing and load testing are distinguished by one "
        "thing.\n\nWhich?",
        [("Stress testing deliberately exceeds the expected volume", True),
         ("Stress testing runs for a longer period than load "
          "testing", False),
         ("Stress testing is performed in production rather than a test "
          "environment", False),
         ("Stress testing measures response time while load testing measures "
          "throughput", False)],
        "Load testing confirms the system copes with the volume it was "
        "specified for. Stress testing goes past that limit on purpose, to "
        "discover HOW it fails -- degrading gracefully, queueing, rejecting "
        "cleanly, or corrupting data. That answer determines whether an "
        "unusually busy day becomes an incident, which is why the two are "
        "distinguished."),

    mcq("HARD",
        "Why is big bang integration considered a poor strategy?",
        [("A failure could originate anywhere, so diagnosis costs more than "
          "the scaffolding saved", True),
         ("It requires more stubs and drivers than incremental "
          "approaches", False),
         ("It cannot be applied to systems with more than a few "
          "modules", False),
         ("It defers unit testing until all modules are complete", False)],
        "Combining everything at once needs no stubs or drivers, which is its "
        "only advantage. When something fails, the fault could be in any "
        "module or any interface between them, so the effort saved on "
        "scaffolding is spent many times over on locating the problem. "
        "Incremental strategies mean each failure appears when a known small "
        "addition was made."),

    mcq("AVERAGE",
        "In the V-model, which specification is acceptance testing checked "
        "against?",
        [("The original business need", True),
         ("The software requirements specification", False),
         ("The detailed design of each module", False),
         ("The system architecture and its interfaces", False)],
        "Each level of testing pairs with the specification produced at the "
        "matching level going down. Acceptance testing sits opposite the "
        "business need, which is why it asks whether the system is fit for "
        "purpose rather than whether it matches a document. Unit testing "
        "pairs with detailed design and qualification testing with the "
        "software requirements."),

    mcq("HARD",
        "What is the principal justification for automating a regression "
        "suite?",
        [("It makes changing the system affordable, since manual regression "
          "is not run in practice", True),
         ("Automated tests find defects that manual testing cannot "
          "detect", False),
         ("Automation reduces the number of testers a project "
          "requires", False),
         ("Automated tests achieve higher coverage than manually designed "
          "ones", False)],
        "Every change requires confirming that unchanged behaviour still "
        "works, and doing that manually across a whole system becomes "
        "unaffordable after a few releases -- so it stops happening and "
        "regressions ship. Automation makes the confirmation cheap enough to "
        "run every time, which is what keeps the system changeable. The suite "
        "finds the same defects a person would."),

    mcq("AVERAGE",
        "What distinguishes a test level from a test type?",
        [("A level is the scope tested; a type is what is being "
          "checked", True),
         ("A level applies to software and a type to the whole "
          "system", False),
         ("A level is defined by the test plan and a type by the "
          "tester", False),
         ("A level indicates formality and a type indicates "
          "technique", False)],
        "Unit, integration, system and acceptance are LEVELS, defined by how "
        "much is under test and which specification it is checked against. "
        "Functional, performance, security, usability and regression are "
        "TYPES, defined by what is being examined -- and any type can be "
        "applied at any level, which is exactly what items about this "
        "distinction turn on."),

    mcq("HARD",
        "Two integrated modules each assume the other handles a failed "
        "external call.\n\nWhat does this indicate about an earlier stage?",
        [("The interface specification omitted failure behaviour", True),
         ("Unit testing did not cover the exception paths in either "
          "module", False),
         ("The modules were assigned to teams that did not "
          "communicate", False),
         ("The architecture placed the external dependency at the wrong "
          "layer", False)],
        "Parameters and formats get specified because they are needed to make "
        "the call at all; failure behaviour is the part left out, and both "
        "sides then assume something. Each module's own tests confirmed its "
        "own assumption, so the gap survives to integration. It is a "
        "specification defect rather than a testing one, and it is the "
        "commonest interface omission."),

    mcq("AVERAGE",
        "One element makes a documented test case a test rather than an "
        "exploration.\n\nWhich?",
        [("A stated expected result that the actual behaviour is compared "
          "against", True),
         ("A defined set of input values covering the equivalence "
          "classes", False),
         ("A record of which version of the software was exercised", False),
         ("Approval of the case by somebody other than its author", False)],
        "Running software and observing what happens produces information and "
        "cannot fail. A test states in advance what should happen, so the "
        "comparison has an outcome -- pass or fail -- that means something "
        "without further judgement. Inputs, versions and review all matter "
        "and none of them turns an observation into a verdict."),

    mcq("HARD",
        "A project releases software with several known, documented "
        "defects.\n\nHow should this be regarded?",
        [("As a legitimate decision, provided somebody with authority "
          "accepted the risk", True),
         ("As a process failure, since testing should continue until no "
          "defects remain", False),
         ("As acceptable only when the defects are of low severity by "
          "definition", False),
         ("As equivalent to releasing untested software, since defects "
          "remain either way", False)],
        "Testing cannot prove the absence of defects, so every release ships "
        "with unknown ones and the question is whether the KNOWN ones are "
        "understood and accepted. Releasing with documented defects somebody "
        "authorised is a decision weighing release risk against delay risk; "
        "releasing without knowing what they are is not a decision at all."),
]

LESSON_DEV_INT = lesson(
    MAJOR, MIDDLE,
    "Software Integration and Qualification Testing",
    _int_quiz,
    lesson_structure(
        "Software Integration and Qualification Testing",
        "Modules that each satisfy their own specification can still fail "
        "together, because each was built against an interpretation of the "
        "interface between them -- and integration is where the two "
        "interpretations meet. This lesson covers the V-model pairing that "
        "gives every specification a matching test, the integration "
        "strategies with their stubs and drivers, the characteristic shape of "
        "an integration defect, qualification testing against the software "
        "requirements, the distinction between test LEVELS and test TYPES "
        "that items reliably turn on, and the regression suite whose real "
        "justification is making change affordable rather than finding "
        "defects.",
        [
            "Explain why integration finds defects unit testing cannot",
            "State the test levels and the specification each is checked "
            "against",
            "Explain the V-model and what pairing each level with a "
            "specification buys",
            "Compare integration strategies and identify where stubs and "
            "drivers are needed",
            "Recognise the characteristic integration defects",
            "Describe qualification testing and the role of traceability",
            "Distinguish test levels from test types and describe each type",
            "Explain the economics of regression testing and when to stop "
            "testing",
        ],
        85,
        _int_sections,
        [
            ("Integration testing",
             "Checks modules working together against the interface "
             "specifications, which unit tests cannot."),
            ("V-model",
             "Each specification going down has a matching verification "
             "coming up, planned when the specification is written."),
            ("Stub",
             "Stands in for a module BELOW that is not written yet. Needed by "
             "top-down integration."),
            ("Driver",
             "Calls a module from ABOVE when the caller is not integrated "
             "yet. Needed by bottom-up integration."),
            ("Big bang integration",
             "Everything combined at once. No scaffolding, and a failure "
             "could originate anywhere."),
            ("Qualification testing",
             "The integrated software checked as a whole against the software "
             "requirements."),
            ("Test level",
             "The scope under test -- unit, integration, qualification, "
             "system, acceptance."),
            ("Test type",
             "What is being checked -- functional, performance, security, "
             "usability, regression. Any type at any level."),
            ("Stress testing",
             "Deliberately exceeding expected volume to discover HOW the "
             "system fails."),
            ("Regression testing",
             "Confirming what worked still works. Its automation is justified "
             "by change frequency."),
            ("Expected result",
             "What makes a test case a test rather than an exploration -- "
             "without it nothing can fail."),
            ("Exit criteria",
             "Coverage complete, defect discovery rate low, quality figures "
             "met, and remaining risk accepted by somebody with authority."),
        ],
        "Integration asks whether modules work TOGETHER, and its defects live "
        "in the difference between two interpretations of one interface -- "
        "which no unit test can expose, since each module's tests were "
        "written from the same assumption the module was. The V-model pairs "
        "every specification with a test that checks it, so unit tests check "
        "the detailed design, integration tests the interfaces, qualification "
        "tests the software requirements and acceptance tests the business "
        "need. Integration strategies trade scaffolding against diagnosis: "
        "top-down needs STUBS standing in below, bottom-up needs DRIVERS "
        "calling from above, and big bang needs neither and makes every "
        "failure a search. The characteristic integration defects are format "
        "mismatches, order assumptions, and failure handling neither side "
        "implemented because the interface specification omitted it. Levels "
        "are about scope and TYPES are about what is checked, with any type "
        "applicable at any level -- and among the types, stress testing "
        "matters because knowing HOW a system fails past its limit decides "
        "whether a busy day becomes an incident. Regression testing is the "
        "most repeated activity, and automating it is justified not by "
        "defect-finding but by making change affordable, since manual "
        "regression across a whole system stops being run after a few "
        "releases. And stopping is a decision: releasing with known accepted "
        "defects is normal, while releasing without knowing them is not a "
        "decision at all.",
        exam_notes=[
            desc(
                "Items describe a defect that escaped and ask which level "
                "should have found it, or which scaffolding a strategy needs."
            ),
            ul([
                "Explaining why unit testing missed an interface mismatch.",
                "Identifying stubs or drivers for a strategy.",
                "Naming the specification a test level checks against.",
                "Distinguishing load from stress testing.",
                "Distinguishing test levels from test types.",
                "Justifying an automated regression suite.",
                "Judging a release with known defects.",
            ]),
            desc(
                "For any escaped-defect item, ask what the level used is "
                "structurally unable to see. A unit test cannot see across an "
                "interface and an integration test cannot see a missing "
                "requirement -- and naming that limit answers the item "
                "directly."
            ),
        ],
    ))

# ==========================================================================
# Lesson 8: System integration, system testing and installation
# ==========================================================================

_sys_sections = [
    ("The Whole System", [
        desc(
            "Software qualification proved the software meets its "
            "requirements. System integration adds the hardware, the network, "
            "the other systems and the operational environment."
        ),
        desc(
            "This is the first level at which the system as the business will "
            "actually use it exists, and consequently the first at which a "
            "whole class of problem can appear -- anything arising from the "
            "environment rather than from the code."
        ),
        table(
            ["Appears only here", "Because"],
            [["Configuration differences",
              "Test environments are never identical to production"],
             ["Capacity limits", "Real volumes were not present before"],
             ["Interactions with other systems",
              "Those systems were stubbed until now"],
             ["Operational procedures failing",
              "Nobody exercised backup or restart before"],
             ["Security controls interfering",
              "Firewalls and permissions were relaxed in test"]],
            caption="Five problems that cannot appear earlier.",
            footer="Every row is a difference between the test environment "
                   "and reality. Making the two as similar as possible is "
                   "what a staging environment is for, and each remaining "
                   "difference is a defect waiting for its moment."),
    ]),

    ("System Testing", [
        desc(
            "The whole system is checked against the SYSTEM requirements -- "
            "the ones stated before software was even mentioned."
        ),
        image(fig("v-model")),
        ul([
            "Functional behaviour end to end, across components rather than "
            "within one.",
            "The quality requirements measured on realistic hardware at "
            "realistic volume.",
            "Interfaces to other systems exercised for real.",
            "Failure and recovery: what happens when a component dies, and "
            "whether it comes back.",
            "Operational procedures: backup, restore, restart, and monitoring "
            "actually performed.",
        ]),
        desc(
            "The fourth and fifth items are what distinguish system testing "
            "from more functional testing. A system that works when "
            "everything works has not been tested for the conditions it will "
            "eventually meet -- and the recovery procedure nobody has "
            "exercised is the one that fails when it matters."
        ),
    ]),

    ("Data Migration", [
        desc(
            "Most new systems inherit data from an old one, and this is "
            "reliably the most underestimated work in a project."
        ),
        ol([
            "PROFILE the existing data to find out what is actually there, "
            "rather than what the old system was supposed to contain.",
            "MAP each old field to a new one, deciding what happens where "
            "there is no equivalent.",
            "CLEANSE the values that the new system's rules would reject, "
            "which requires business decisions rather than technical ones.",
            "MIGRATE, in a rehearsal first, timing it against the available "
            "window.",
            "VERIFY by reconciling counts and totals, and by checking a "
            "sample in detail.",
        ]),
        desc(
            "Step three is where the schedule goes. Old data contains values "
            "the old system permitted and the new one forbids -- missing "
            "fields, impossible dates, duplicates -- and each requires "
            "somebody in the business to decide what it should become. That "
            "is a workstream, not a task."
        ),
        desc(
            "Step four's rehearsal is what makes the real migration safe. It "
            "establishes how long the migration takes, which decides whether "
            "it fits in the planned outage -- and discovering it does not, on "
            "the night, is the classic cause of a failed cutover."
        ),
    ]),

    ("Choosing a Transition Approach", [
        desc(
            "How the new system takes over from the old one is a risk "
            "decision, and the syllabus names four approaches."
        ),
        compare_grid(
            "FOUR WAYS TO CHANGE OVER",
            "Each trades risk against cost differently.",
            [("Direct and parallel",
              ["DIRECT: old stops, new starts -- cheapest, no fallback",
               "Any serious defect is met with no alternative running",
               "PARALLEL: both run on the same work, results compared",
               "Safest, and doubles operational effort for the duration"]),
             ("Phased and pilot",
              ["PHASED: one part at a time, limiting each failure's damage",
               "Requires the two systems to interoperate meanwhile",
               "PILOT: one site or group first, on real work",
               "Finds real problems on a small population"])]),
        desc(
            "PARALLEL running is the safest and the one most often abandoned "
            "halfway, because doing every piece of work twice is genuinely "
            "exhausting. A plan that depends on it needs the extra effort "
            "resourced rather than assumed, or it degrades into direct "
            "changeover with the decision never having been made."
        ),
    ]),

    ("Installation and Cutover", [
        desc(
            "The cutover itself is planned in detail, because it happens once "
            "under time pressure with everybody watching."
        ),
        ul([
            "Write the sequence down, with each step's owner and expected "
            "duration.",
            "Define the GO/NO-GO decision points, and who makes them.",
            "Define the BACK-OUT plan -- how to return to the old system, and "
            "by when the decision must be taken.",
            "Rehearse it, including the back-out, since an untested rollback "
            "is not a rollback.",
            "Agree how success will be confirmed before the system is "
            "declared live.",
        ]),
        desc(
            "The BACK-OUT deadline is the item worth understanding. Beyond a "
            "certain point -- once new transactions exist only in the new "
            "system -- returning becomes impractical, so the decision to "
            "continue must be made deliberately BEFORE that point rather than "
            "discovered afterwards."
        ),
    ]),

    ("Preparing the Production Environment", [
        desc(
            "The environment the system will live in is built and proved "
            "before the system arrives in it."
        ),
        ul([
            "Size the hardware and capacity against the measured figures "
            "rather than the estimates made at requirements time.",
            "Apply the security controls the design specified, since a "
            "relaxed test configuration is not what should reach "
            "production.",
            "Establish monitoring BEFORE go-live, so the first days are "
            "observed rather than reported by users.",
            "Prove the backup and restore path on the real configuration, "
            "not merely configure it.",
            "Document the environment as it actually is, since this is what "
            "the next change will be planned against.",
        ]),
        desc(
            "Monitoring installed before go-live is what turns the first "
            "week from anecdote into measurement. Without it, the only "
            "evidence of how the system is behaving comes from people "
            "complaining -- which under-reports everything short of an "
            "outage."
        ),
    ]),

    ("Deployment Environments", [
        desc(
            "Software passes through several environments on its way to "
            "production, and each exists to catch something the previous one "
            "could not."
        ),
        image(fig("dev-environments")),
        table(
            ["Environment", "Exists to", "Differs from production in"],
            [["Development", "Let code be written and tried",
              "Almost everything"],
             ["Test", "Prove the software against its specifications",
              "Scale, data, and connected systems"],
             ["Staging", "Rehearse against production-like conditions",
              "As little as can be afforded"],
             ["Production", "Do the actual work", "Nothing, by definition"]],
            caption="Four environments and the gap each still leaves.",
            footer="The third column is the point. Every difference is "
                   "something no test in that environment can reveal, which "
                   "is why 'it worked in test' nearly always means test "
                   "differed in a way nobody had written down."),
        desc(
            "Promoting the SAME artefact through the environments rather than "
            "rebuilding at each stage removes one whole class of surprise. If "
            "what reaches production was built separately from what was "
            "tested, then nothing tested is quite what is running."
        ),
    ]),

    ("Deploying Without an Outage", [
        desc(
            "Some systems cannot stop, and the syllabus names the techniques "
            "that release changes to them."
        ),
        content_accordion(
            "THREE APPROACHES",
            "Each keeps the service available while the version changes.",
            [("Rolling deployment",
              "Instances are replaced a few at a time while the rest serve "
              "traffic. Requires the two versions to coexist, since both are "
              "live during the roll."),
             ("Blue-green deployment",
              "A complete second environment is prepared, traffic is switched "
              "to it, and the old one is kept ready. Switching back is "
              "immediate, which makes it the safest -- and it costs a second "
              "environment."),
             ("Canary release",
              "The new version takes a small share of real traffic first, and "
              "the share grows if it behaves. Finds problems on a small "
              "population, using real usage rather than test cases.")]),
        desc(
            "All three require the new version to tolerate the old version's "
            "data and vice versa, at least briefly. That constraint is what "
            "makes a database change harder than a code change -- and it is "
            "why such changes are usually made in compatible steps rather "
            "than one incompatible leap."
        ),
    ]),

    ("Acceptance Preparation", [
        desc(
            "System testing is the developer's last check. What follows is "
            "the customer's, and preparing for it is part of this stage."
        ),
        ul([
            "Confirm the acceptance criteria agreed at requirements time are "
            "still the criteria, since both the system and the business have "
            "moved since.",
            "Ensure the environment the customer will test in is available "
            "and populated.",
            "Ensure the documentation they need exists -- how to operate it, "
            "not merely how it was built.",
            "Fix what system testing found before handing over, since defects "
            "the customer finds first cost credibility as well as effort.",
            "Agree how defects found during acceptance will be classified and "
            "handled, before any are found.",
        ]),
        desc(
            "The last point prevents a specific and predictable argument. "
            "Once acceptance is under way, whether something is a defect or a "
            "change request determines who pays -- and settling the "
            "classification rule in advance is far easier than settling it "
            "with a disputed item in front of everybody."
        ),
    ]),

    ("Training and Documentation", [
        desc(
            "A system nobody knows how to use has not been delivered, and the "
            "syllabus treats preparation of people as part of installation."
        ),
        table(
            ["Audience", "Needs", "Commonly given"],
            [["End users", "How to do their job with it",
              "A tour of the screens"],
             ["Operations", "How to run, monitor, back up and restart it",
              "Almost nothing"],
             ["Support staff", "What goes wrong and what to do about it",
              "The user documentation"],
             ["Administrators", "How to configure and maintain it",
              "Access, and good luck"]],
            caption="Four audiences with different needs.",
            footer="The gap between the second and third columns is where "
                   "post-delivery cost accumulates. Each audience needing "
                   "something they were not given generates support calls "
                   "that somebody pays for indefinitely."),
        desc(
            "Training timing matters as much as content. Delivered too early "
            "it is forgotten before the system arrives; delivered during "
            "cutover it competes with everything else -- so shortly before "
            "go-live, with support available afterwards, is what works."
        ),
    ]),

    ("Post-Installation Support", [
        desc(
            "The period immediately after go-live has a character of its own "
            "and is planned for separately."
        ),
        ol([
            "Expect a spike in questions and incidents, since everybody meets "
            "the system at once.",
            "Have more support available than steady state requires, for a "
            "defined period.",
            "Keep the project team involved rather than dispersing it "
            "immediately, since they know what changed.",
            "Monitor the quality figures against the requirements, on real "
            "usage rather than test load.",
            "Hold a review once things settle, capturing what should be done "
            "differently next time.",
        ]),
        desc(
            "Dispersing the project team at go-live is the common error. The "
            "people who understand what was built and why are needed most in "
            "the fortnight afterwards, and reassigning them on the delivery "
            "date guarantees the first problems are diagnosed by people "
            "meeting the system for the first time."
        ),
    ]),

    ("Confirming Success", [
        desc(
            "'It is live' is not the same as 'it worked', and the difference "
            "is decided by what was agreed in advance."
        ),
        compare_grid(
            "TECHNICAL SUCCESS AGAINST BUSINESS SUCCESS",
            "A project can achieve one without the other.",
            [("Technical",
              ["The system runs and meets its specifications",
               "Performance figures are met at real load",
               "Defect levels are within what was accepted",
               "Measurable within days"]),
             ("Business",
              ["The outcome the project was funded for is achieved",
               "People actually use it as intended",
               "The old costs or delays genuinely reduced",
               "Measurable only after months"])]),
        desc(
            "The second column is what the project was for, and it is "
            "measured long after the team has moved on -- which is why the "
            "benefits somebody promised at the outset need an owner who "
            "remains, and a date on which they will be checked. Without that, "
            "the question is simply never asked."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where system integration items are lost."),
        ul([
            "Treating data migration as a task rather than a workstream, and "
            "discovering the cleansing decisions late.",
            "Not rehearsing the migration, so its duration is unknown against "
            "the outage window.",
            "Planning parallel running without resourcing the doubled "
            "effort.",
            "Having a back-out plan that was never tested.",
            "Leaving the back-out deadline undefined, so the decision is made "
            "by default.",
            "Testing only the case where everything works, leaving recovery "
            "procedures unexercised.",
            "Assuming the test environment resembles production closely "
            "enough.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A cutover begins at midnight with a six-hour window. The data "
            "migration is still running at six in the morning and the old "
            "system is needed for business at eight. What was the planning "
            "failure?\""
        ),
        ol([
            "Identify what was unknown: how long the migration would actually "
            "take on production volumes.",
            "That is established by a REHEARSAL on representative data, which "
            "evidently was not performed.",
            "The second failure is the back-out decision. It should have had "
            "a deadline -- a time by which, if migration were incomplete, the "
            "cutover would be abandoned.",
            "Without that deadline, the decision is made by the clock running "
            "out rather than by anybody choosing.",
            "So two planning steps were missing: rehearsing to establish "
            "duration, and defining the point of no return.",
        ]),
        desc(
            "The second failure is the more serious and the less obvious. "
            "Even an unrehearsed migration is survivable if somebody decides "
            "at four in the morning to stop and restore -- what makes this a "
            "crisis is that nobody was empowered or scheduled to make that "
            "call."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("System integration touches operations and management."),
        ul([
            "The environment differences it exposes are the staging concerns "
            "of the environment lesson.",
            "Recovery testing verifies the RTO and RPO of Service "
            "Management.",
            "Cutover planning and back-out are change management.",
            "Migrated personal data carries the obligations of Legal "
            "Affairs.",
            "Capacity confirmation at real volumes is System Evaluation.",
            "Operational procedure testing addresses the operations "
            "stakeholders the requirements lesson named.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What system testing checks against",
              "The system requirements",
              "The ones stated before software was mentioned -- which is the "
              "V-model pairing."),
             ("Why data migration overruns",
              "Cleansing needs business decisions, not technical work",
              "Old data holds values the new system forbids, and each needs "
              "somebody to rule on it."),
             ("What a migration rehearsal establishes",
              "How long it takes against the outage window",
              "Discovering it does not fit, on the night, is the classic "
              "failed cutover."),
             ("Why parallel running gets abandoned",
              "Doing every piece of work twice is exhausting",
              "It must be resourced rather than assumed, or it degrades into "
              "direct changeover by default."),
             ("What a back-out deadline is for",
              "So continuing is a decision rather than the clock running out",
              "Beyond a certain point returning is impractical, and that "
              "point must be named in advance."),
             ("What only system testing can find",
              "Anything arising from the environment rather than the code",
              "Configuration, capacity, real interfaces, and procedures "
              "nobody had exercised.")]),
    ]),
]

_sys_quiz = [
    mcq("HARD",
        "A cutover's data migration is still running when the outage window "
        "ends and the business needs the system.\n\n"
        "What were the planning failures?",
        [("No rehearsal established the duration, and no back-out deadline "
          "was defined", True),
         ("The outage window was scheduled at the wrong time of "
          "day", False),
         ("The migration should have been performed incrementally rather than "
          "in one operation", False),
         ("Insufficient hardware was provisioned for the migration to "
          "complete in time", False)],
        "A rehearsal on representative data establishes how long the "
        "migration actually takes against the window available -- without it, "
        "the duration is a guess. The second and more serious failure is the "
        "absence of a back-out deadline: a time by which an incomplete "
        "migration means abandoning the cutover. Without it, the outcome is "
        "decided by the clock rather than by anybody choosing."),

    mcq("AVERAGE",
        "Which transition approach carries the lowest risk and the highest "
        "operational cost?",
        [("Parallel running", True),
         ("Direct changeover, since it is completed quickly", False),
         ("Phased introduction, since each phase is verified", False),
         ("Pilot operation at a single site", False)],
        "Running both systems on the same work and comparing results means "
        "any discrepancy is visible before it matters and the old system is "
        "always available -- which is the lowest risk available. It also "
        "means every piece of work is done twice, which is why it is the "
        "approach most often abandoned partway and why the doubled effort "
        "must be resourced rather than assumed."),

    mcq("HARD",
        "Why does data cleansing typically consume more of the schedule than "
        "planned?",
        [("Each rejected value needs a business decision about what it should "
          "become", True),
         ("Cleansing tools must be developed specifically for each "
          "migration", False),
         ("The volume of data to be examined is larger than "
          "anticipated", False),
         ("Cleansed data must be re-verified after every subsequent "
          "change", False)],
        "Old data contains values the old system permitted and the new one "
        "forbids -- missing fields, impossible dates, duplicate records -- "
        "and resolving each requires somebody in the business to rule on what "
        "it means, not a developer to write a conversion. That makes it a "
        "workstream depending on other people's availability rather than a "
        "technical task."),

    mcq("AVERAGE",
        "System testing checks the system against which specification?",
        [("The system requirements", True),
         ("The software requirements specification", False),
         ("The detailed design of each component", False),
         ("The interface specifications between modules", False)],
        "Following the V-model pairing, system testing sits opposite the "
        "system requirements -- the ones stated before software was mentioned "
        "-- and exercises the whole system including hardware, network and "
        "the other systems it works with. Software requirements are checked "
        "by qualification testing, one level below."),

    mcq("HARD",
        "A back-out plan needs a deadline attached to it.\n\nFor what "
        "reason?",
        [("Beyond a point returning becomes impractical, so continuing must "
          "be a deliberate decision", True),
         ("Back-out procedures expire if the system has been running for "
          "some time", False),
         ("The deadline determines how much rollback data must be "
          "retained", False),
         ("Regulatory requirements limit how long a system may run in a "
          "provisional state", False)],
        "Once new transactions exist only in the new system, restoring the "
        "old one means losing them, so returning stops being available. "
        "Naming the time by which the decision must be taken means somebody "
        "chooses to continue; without it, the option quietly disappears and "
        "the project discovers it is committed rather than having decided "
        "to be."),

    mcq("AVERAGE",
        "Which category of problem can only appear at system integration?",
        [("Anything arising from the environment rather than from the "
          "code", True),
         ("Defects in the logic of individual software modules", False),
         ("Mismatches between the interfaces of two software "
          "modules", False),
         ("Requirements that were captured incorrectly at the "
          "outset", False)],
        "Configuration differences, real capacity limits, genuine interfaces "
        "to other systems, security controls that were relaxed in test, and "
        "operational procedures nobody had exercised all require the actual "
        "environment to exist. Module logic and interface mismatches are "
        "found at earlier levels, and a wrong requirement can be found at any "
        "level or none."),

    mcq("HARD",
        "A system passes all functional testing but its recovery procedure "
        "fails when a component dies in production.\n\n"
        "What was omitted?",
        [("System testing of failure and recovery, not just of correct "
          "operation", True),
         ("Stress testing to establish the system's capacity "
          "limits", False),
         ("Integration testing between the failed component and its "
          "callers", False),
         ("Regression testing after the most recent change to the "
          "component", False)],
        "Testing that a system works when everything works leaves the "
        "conditions it will eventually meet unexercised -- and a recovery "
        "procedure nobody has ever performed is one nobody knows works. "
        "Deliberately failing components and confirming the system returns is "
        "part of system testing, and it is the part most often left out "
        "because it is awkward to arrange."),

    mcq("AVERAGE",
        "What is the purpose of rehearsing a data migration?",
        [("To establish its actual duration against the available outage "
          "window", True),
         ("To train the operations staff who will perform it", False),
         ("To confirm the migrated data satisfies the new system's "
          "validation", False),
         ("To identify which records require cleansing before the "
          "cutover", False),
         ],
        "The rehearsal's primary output is the timing: how long the migration "
        "takes on production-scale data, which decides whether it fits the "
        "planned window. Discovering on the night that it does not is the "
        "classic failed cutover. Validation and cleansing are established by "
        "profiling and testing the migration logic, earlier and separately."),

    mcq("HARD",
        "Direct changeover is the riskiest of the transition "
        "approaches.\n\nWhat makes it so?",
        [("There is no running alternative if a serious defect "
          "appears", True),
         ("It requires the migration to complete faster than other "
          "approaches", False),
         ("Users receive no opportunity to learn the new system "
          "gradually", False),
         ("It prevents the two systems from being compared against each "
          "other", False)],
        "Stopping the old system and starting the new one is the cheapest "
        "approach and leaves nothing to fall back to -- a defect serious "
        "enough to prevent operation is met with no alternative available and "
        "no time to build one. The other approaches all preserve some form of "
        "fallback, which is precisely what they are paying their extra cost "
        "for."),

    mcq("AVERAGE",
        "Why is a staging environment made as similar to production as "
        "possible?",
        [("Each remaining difference is a potential defect that testing "
          "cannot find", True),
         ("Production data can then be copied into it without "
          "modification", False),
         ("It allows performance figures to be published to "
          "stakeholders", False),
         ("Regulatory standards require testing in an identical "
          "environment", False)],
        "Configuration, capacity, permissions and connected systems that "
        "differ from production are differences no test in that environment "
        "will reveal, and each becomes a surprise at cutover. 'It worked in "
        "test' almost always means test differed from production in a way "
        "nobody had written down, which is exactly what staging exists to "
        "reduce."),
]

LESSON_DEV_SYS = lesson(
    MAJOR, MIDDLE,
    "System Integration, System Testing and Installation",
    _sys_quiz,
    lesson_structure(
        "System Integration, System Testing and Installation",
        "System integration is the first point at which the system exists as "
        "the business will actually use it, which is why a whole class of "
        "problem can appear only here -- configuration, real capacity, genuine "
        "interfaces, security controls that were relaxed in test, and "
        "operational procedures nobody had exercised. This lesson covers "
        "system testing against the SYSTEM requirements including the failure "
        "and recovery cases most often omitted, data migration as the "
        "workstream it actually is, the four transition approaches and why "
        "the safest is the one most often abandoned, and cutover planning "
        "with the back-out deadline that turns continuing into a decision "
        "rather than a default.",
        [
            "Explain what can only be discovered at system integration",
            "Describe system testing, including failure and recovery cases",
            "Describe the data migration process and why cleansing dominates "
            "it",
            "Explain what a migration rehearsal establishes",
            "Compare the four transition approaches by risk and cost",
            "Plan a cutover including go/no-go points and back-out",
            "Explain why a back-out deadline is necessary",
            "Explain the purpose of a staging environment",
        ],
        80,
        _sys_sections,
        [
            ("System integration",
             "Adding hardware, network, other systems and the operational "
             "environment to the qualified software."),
            ("System testing",
             "The whole system checked against the SYSTEM requirements, "
             "including failure and recovery."),
            ("Data profiling",
             "Finding out what the existing data actually contains, rather "
             "than what it was supposed to."),
            ("Data cleansing",
             "Resolving values the new system forbids -- a workstream "
             "requiring business decisions, not a technical task."),
            ("Migration rehearsal",
             "Establishes the real duration against the outage window, which "
             "is what prevents the classic failed cutover."),
            ("Direct changeover",
             "Old stops, new starts. Cheapest, and with no fallback if "
             "something serious appears."),
            ("Parallel running",
             "Both systems on the same work, results compared. Safest, and "
             "doubles operational effort."),
            ("Phased and pilot",
             "One part at a time, or one site first -- each limiting the "
             "population a failure reaches."),
            ("Back-out plan",
             "How to return to the old system, rehearsed, since an untested "
             "rollback is not a rollback."),
            ("Back-out deadline",
             "The time by which continuing must be chosen, since beyond it "
             "returning becomes impractical."),
            ("Staging environment",
             "As close to production as possible, because every remaining "
             "difference is a defect testing cannot find."),
        ],
        "System integration produces the system as the business will use it, "
        "and a whole class of problem waits until that moment: configuration "
        "differences, capacity limits at real volume, interfaces to systems "
        "that were stubbed, security controls relaxed in test, and "
        "operational procedures nobody exercised. System testing checks "
        "against the SYSTEM requirements and must include failure and "
        "recovery, because a system tested only when everything works has not "
        "been tested for the conditions it will meet. Data migration is the "
        "most underestimated work in most projects, and CLEANSING is why: old "
        "data holds values the new system forbids and each needs a business "
        "decision, which makes it a workstream depending on other people "
        "rather than a task. A rehearsal establishes the real duration "
        "against the outage window, and skipping it produces the classic "
        "failed cutover. The transition approaches trade risk against cost -- "
        "direct is cheapest with no fallback, parallel is safest and doubles "
        "the work, phased and pilot limit the population a failure reaches -- "
        "and parallel running must be resourced or it degrades into direct "
        "changeover with nobody having decided. Finally the cutover itself "
        "needs a written sequence, go/no-go points, a REHEARSED back-out, and "
        "a deadline by which continuing is chosen deliberately rather than "
        "settled by the clock running out.",
        exam_notes=[
            desc(
                "Items describe a cutover or migration that went wrong and "
                "ask which planning step was missing."
            ),
            ul([
                "Identifying the missing rehearsal or back-out deadline.",
                "Comparing transition approaches by risk.",
                "Explaining why cleansing dominates migration effort.",
                "Naming what only system integration can reveal.",
                "Explaining why recovery must be tested deliberately.",
                "Explaining the purpose of a staging environment.",
                "Stating what system testing is checked against.",
            ]),
            desc(
                "When a cutover fails, look for two things rather than one: "
                "what was not established in advance, and who was supposed to "
                "decide when it went wrong. The second is missing more often "
                "and matters more, because an unrehearsed step is survivable "
                "when somebody is empowered to stop."
            ),
        ],
    ))

LESSONS = [LESSON_DEV_INT, LESSON_DEV_SYS]

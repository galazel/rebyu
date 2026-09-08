"""Development Technology -> System Development Technology, lessons 3 and 4.

Syllabus stages: software requirements definition, and software architecture
and detailed design.

The design lesson carries the pair the examination returns to most often --
low coupling and high cohesion -- so it is treated as one idea with a
practical test rather than as two definitions to recall.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Development Technology"
MIDDLE = "System Development Technology"

# ==========================================================================
# Lesson 3: Software requirements definition
# ==========================================================================

_sreq_sections = [
    ("What the Software Must Do", [
        desc(
            "System requirements said what the whole system must achieve, and "
            "the architecture allocated parts of that to software. Software "
            "requirements state precisely what those parts must do."
        ),
        image(fig("development-lifecycle")),
        desc(
            "The distinction matters because the examination tests it. A "
            "system requirement describes an outcome the business needs; a "
            "software requirement describes behaviour a program must exhibit, "
            "and it exists because the architecture decided software would "
            "deliver that outcome."
        ),
        table(
            ["System requirement", "Software requirement derived from it"],
            [["Orders must be despatched within one working day",
              "The system shall flag an order unallocated after four hours"],
             ["Customer data must be protected",
              "The application shall record every access to a customer "
              "record"],
             ["The service must survive a site failure",
              "The application shall hold no state between requests"]],
            caption="Three system requirements and one derived software "
                    "requirement each.",
            footer="Each right-hand entry is testable against the software "
                   "alone. That is the point of the derivation: a business "
                   "outcome cannot be verified by a unit test, and a derived "
                   "behaviour can."),
    ]),

    ("Specifying Behaviour Precisely", [
        desc(
            "A software requirement has to be precise enough that two "
            "developers reading it produce the same behaviour."
        ),
        ul([
            "State the trigger: what causes this behaviour to happen.",
            "State the condition: when it applies, and when it does not.",
            "State the outcome: what changes, and what the user or caller "
            "sees.",
            "State the exceptions: what happens when the inputs are wrong, "
            "the data is missing, or a dependency fails.",
            "State the constraints: how quickly, how many at once, under what "
            "authorisation.",
        ]),
        desc(
            "The EXCEPTIONS are where specifications are thinnest and defects "
            "are densest. The normal path is the one everybody imagines while "
            "writing, and the exceptional paths are where a system spends its "
            "difficult moments -- so a requirement covering only the happy "
            "case has specified the easy part."
        ),
    ]),

    ("Use Cases and Scenarios", [
        desc(
            "The syllabus uses use cases to bridge from what people want to "
            "what software must do."
        ),
        table(
            ["Part", "Records"],
            [["Actor", "Who or what interacts with the system"],
             ["Goal", "What the actor is trying to achieve"],
             ["Preconditions", "What must be true before it starts"],
             ["Main flow", "The steps when everything goes well"],
             ["Alternative flows", "The other ways it can legitimately go"],
             ["Exception flows", "What happens when it goes wrong"],
             ["Postconditions", "What is true afterwards"]],
            caption="Seven parts of a use case, and what each captures.",
            footer="The alternative and exception flows are the reason to "
                   "write use cases in this form at all. Prose describing a "
                   "feature almost never enumerates them; this template will "
                   "not let you skip them without it being visible."),
        desc(
            "A SCENARIO is one concrete path through a use case, with real "
            "values. It is what a test case is derived from, and it is also "
            "what makes a requirement discussable with somebody who does not "
            "think in abstractions."
        ),
    ]),

    ("Modelling Data and State", [
        desc(
            "Two models recur in software requirements because two kinds of "
            "gap keep appearing."
        ),
        compare_grid(
            "DATA MODELS AGAINST STATE MODELS",
            "What exists, against how it changes.",
            [("Data model",
              ["The entities, their attributes and relationships",
               "Reveals facts stored in more than one place",
               "Reveals relationships nobody specified the rules for",
               "Becomes the database design later"]),
             ("State model",
              ["The states an entity passes through, and the transitions",
               "Reveals transitions nobody defined",
               "Reveals states with no way out",
               "Becomes validation logic later"])]),
        desc(
            "The state model earns its place through a specific failure it "
            "prevents. An order that can be cancelled, despatched or refunded "
            "has combinations somebody must rule on -- can a despatched order "
            "be cancelled? -- and a system with no answer will pick one by "
            "accident, in whichever order the code happens to check."
        ),
    ]),

    ("Interface Requirements", [
        desc(
            "Software rarely stands alone, so what it exchanges with "
            "everything else is specified as carefully as what it does."
        ),
        ul([
            "USER interfaces: what the user must be able to do, and any "
            "accessibility or usability requirement, stated testably.",
            "HARDWARE interfaces: what devices are read from or driven, and "
            "with what timing.",
            "SOFTWARE interfaces: which other systems are called, what is "
            "sent, what comes back, and what happens when it does not.",
            "COMMUNICATION interfaces: protocols, formats and volumes.",
        ]),
        desc(
            "The third item is where projects lose time. An interface to "
            "another team's system is a negotiation as much as a "
            "specification, and agreeing it late means both sides have "
            "already assumed something -- usually different things, and "
            "usually about failure handling."
        ),
    ]),

    ("Requirements for Qualities", [
        desc(
            "The non-functional requirements from the system stage become "
            "specific obligations on the software here."
        ),
        table(
            ["Quality", "Stated as", "Verified by"],
            [["Performance", "A time limit at a stated load",
              "Load testing against the figure"],
             ["Reliability", "A failure rate or availability figure",
              "Measurement over time"],
             ["Usability", "A task completion rate or time",
              "Observation of real users"],
             ["Security", "Specific controls and their coverage",
              "Testing, and review"],
             ["Maintainability", "Structural properties, and documentation",
              "Review, and measurement of change effort"]],
            caption="Five qualities, each with a form that can be checked.",
            footer="Usability is the one most often left as an adjective. "
                   "'Intuitive' is not verifiable; 'a new user completes the "
                   "booking task within three minutes without assistance' is, "
                   "and it can be designed towards."),
        desc(
            "Writing these as figures is unpopular because the figures have "
            "to be chosen, and choosing means somebody can later be shown to "
            "have been wrong. The alternative is a requirement nobody can "
            "fail, which is also a requirement nobody can meet."
        ),
    ]),

    ("Validating the Specification", [
        desc(
            "Validation asks whether the right thing has been specified, "
            "which is a different question from whether it has been specified "
            "correctly."
        ),
        compare_grid(
            "VERIFICATION AGAINST VALIDATION",
            "Two questions asked at every stage, and reliably confused.",
            [("Verification",
              ["Are we building the thing RIGHT",
               "Checks work against its own specification",
               "Reviews, inspections, testing against requirements",
               "Can pass while the product is useless"]),
             ("Validation",
              ["Are we building the RIGHT thing",
               "Checks the specification against the actual need",
               "Prototypes, demonstrations, user involvement",
               "Can only be answered by whoever needs it"])]),
        desc(
            "The distinction is examined directly and it matters "
            "practically. A perfectly verified system built from a "
            "misunderstood requirement is a correct implementation of the "
            "wrong thing, and every verification activity in the project will "
            "have passed."
        ),
    ]),

    ("Baselining the Specification", [
        desc(
            "At some point the specification is agreed and becomes the thing "
            "everything else is built and tested against."
        ),
        ol([
            "The specification is reviewed and approved by those "
            "accountable.",
            "It becomes a BASELINE -- a known, recorded state.",
            "Construction, test design and planning all work from that "
            "baseline.",
            "Later changes go through change control against it, rather than "
            "being absorbed.",
            "The baseline is updated when a change is approved, and everybody "
            "works from the new one.",
        ]),
        desc(
            "Without a baseline, 'the requirement changed' and 'the "
            "requirement was always that' cannot be distinguished, and "
            "neither can be resolved. The baseline's value is not "
            "bureaucratic control but simply having an answer to what was "
            "agreed."
        ),
    ]),

    ("Business Rules", [
        desc(
            "Much of what software must do is a rule the organisation "
            "follows, and where those rules live is a design-affecting "
            "requirements decision."
        ),
        table(
            ["Rule kind", "Example", "Changes"],
            [["Calculation", "How a discount is computed", "Frequently"],
             ["Constraint", "An order must have at least one line", "Rarely"],
             ["Derivation", "A customer's category from their spend",
              "Occasionally"],
             ["Authorisation", "Who may approve above a threshold",
              "With the organisation"]],
            caption="Four kinds of business rule, and how volatile each is.",
            footer="The last column is what the specification should record "
                   "alongside the rule itself. A rule expected to change "
                   "monthly and one fixed by law are the same sentence in a "
                   "document and entirely different design problems."),
        desc(
            "Stating a rule's VOLATILITY is what lets design isolate the "
            "changeable ones. It costs a phrase in the specification and "
            "saves the far larger cost of a frequently-changing rule "
            "scattered through code that has to be found and edited each "
            "time."
        ),
    ]),

    ("Requirements That Are Really Solutions", [
        desc(
            "Stakeholders often describe a solution rather than a need, and "
            "recording it unchallenged forecloses better answers."
        ),
        compare_grid(
            "SOLUTION AGAINST NEED",
            "The same conversation, recorded two ways.",
            [("As stated -- a solution",
              ["'Add a button that exports to a spreadsheet'",
               "Specific and easy to write down",
               "Constrains the design to one answer",
               "May be a workaround for something else"]),
             ("As a need -- after asking why",
              ["'Managers must reconcile these figures monthly'",
               "Opens several possible answers",
               "May reveal the reconciliation is unnecessary",
               "Harder to elicit, and far more useful"])]),
        desc(
            "The technique is simply asking why until the answer stops being "
            "about the software. It is not a challenge to the stakeholder's "
            "judgement; it is recovering the requirement that their proposed "
            "solution was addressing, which is what the specification should "
            "have recorded."
        ),
    ]),

    ("Documenting the Specification", [
        desc(
            "The specification is read by developers, testers, users and "
            "whoever maintains the system years later, and its organisation "
            "has to serve all of them."
        ),
        ul([
            "Give every requirement a unique identifier, since traceability "
            "and change control both depend on being able to name one.",
            "Separate requirements from explanation, so the obligations can "
            "be found among the context.",
            "State each requirement once, since the same rule written twice "
            "will eventually disagree with itself.",
            "Record the rationale where it is not obvious, because the "
            "maintainer years later cannot ask.",
            "Keep it under version control, so what was agreed at each point "
            "remains answerable.",
        ]),
        desc(
            "Stating a requirement once matters more than it sounds. "
            "Duplicated statements are updated in one place and not the "
            "other, and the resulting contradiction is discovered by whoever "
            "implemented the stale copy -- usually after the code is "
            "written."
        ),
    ]),

    ("Assumptions and Dependencies", [
        desc(
            "A specification rests on things nobody stated, and recording "
            "them is what makes a later surprise traceable rather than "
            "inexplicable."
        ),
        ul([
            "An ASSUMPTION is something believed true and not verified -- "
            "that volumes will stay within a range, that another system will "
            "remain available, that a regulation will not change.",
            "A DEPENDENCY is something the project needs from outside it: a "
            "supplier's interface, another team's delivery, a decision "
            "somebody has yet to make.",
            "Both belong in the specification, because both can invalidate "
            "requirements built on them.",
            "Each needs an owner who will notice if it stops being true.",
        ]),
        desc(
            "The value is not the list but the review of it. An assumption "
            "written down can be checked periodically and challenged by "
            "somebody who knows better; one held silently is discovered to "
            "have been wrong at the point where something built on it "
            "fails."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where software requirements items are lost."),
        ul([
            "Confusing verification with validation. Right thing against "
            "thing right.",
            "Specifying only the normal path, leaving exceptions to be "
            "invented during construction.",
            "Leaving a quality requirement as an adjective rather than a "
            "figure.",
            "Deferring an interface agreement with another team, so both "
            "sides assume different failure behaviour.",
            "Omitting the state model, so illegal transitions are decided by "
            "whichever check the code runs first.",
            "Treating a system requirement as a software requirement without "
            "deriving something testable.",
            "Changing the specification without updating the baseline, so "
            "nobody can say what was agreed.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A project's testing found no defects against the "
            "specification, and users rejected the delivered software as not "
            "doing what they needed. What activity was missing?\""
        ),
        ol([
            "Note what succeeded: testing against the specification -- which "
            "is VERIFICATION, and it passed.",
            "Note what failed: the specification itself did not describe what "
            "users needed.",
            "So the missing activity is VALIDATION -- checking the "
            "specification against the actual need before building from it.",
            "Verification cannot detect this, by definition: it compares the "
            "product to the specification, and both agreed.",
            "The techniques that would have caught it are prototypes, "
            "demonstrations and user involvement during specification, since "
            "only the people with the need can answer the question.",
        ]),
        desc(
            "Step four is the reasoning the item rewards. Every verification "
            "activity passing is not evidence that anything is right -- it is "
            "evidence of internal consistency, which a wrong specification "
            "has just as easily as a right one."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Software requirements sit between two other stages."),
        ul([
            "System requirements and architecture supply the inputs, from the "
            "previous lessons.",
            "Data models here become the E-R design of the Database "
            "category.",
            "State models become validation logic in construction.",
            "Quality figures become the acceptance criteria of the testing "
            "lessons.",
            "Baselining is the configuration management discipline covered "
            "later.",
            "Usability requirements come from the Human Interface lessons.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Verification against validation",
              "Building it right, against building the right thing",
              "Every verification activity can pass on a specification that "
              "describes the wrong system."),
             ("Where specifications are thinnest",
              "The exception paths",
              "The normal path is what everybody imagines while writing; "
              "exceptions are where systems spend difficult moments."),
             ("What a state model prevents",
              "Illegal transitions decided by accident",
              "Can a despatched order be cancelled? Somebody must rule, or "
              "the code rules by which check runs first."),
             ("How a quality requirement must be written",
              "As a figure that can be checked",
              "'Intuitive' cannot be failed and therefore cannot be met."),
             ("What a baseline provides",
              "An answer to what was agreed",
              "Without one, 'it changed' and 'it was always that' cannot be "
              "distinguished."),
             ("System against software requirement",
              "A business outcome, against testable program behaviour",
              "The second is derived from the first once architecture "
              "allocated it to software.")]),
    ]),
]

_sreq_quiz = [
    mcq("HARD",
        "Testing found no defects against the specification, and users "
        "rejected the software as not meeting their needs.\n\n"
        "Which activity was missing?",
        [("Validation -- checking the specification against the actual "
          "need", True),
         ("Verification -- checking the software against its "
          "specification", False),
         ("Regression testing -- confirming existing behaviour still "
          "worked", False),
         ("Acceptance testing -- confirming the software met the contracted "
          "terms", False)],
        "Testing against the specification is verification, and it passed -- "
        "so the product matches the specification and the specification is "
        "wrong. Verification cannot detect that by definition, since it "
        "compares two things that agree. Validation asks whether the right "
        "thing is being built and can only be answered by the people with the "
        "need, through prototypes, demonstrations and involvement."),

    mcq("AVERAGE",
        "Which part of a use case is most often omitted and most valuable?",
        [("The exception and alternative flows", True),
         ("The main flow describing the successful path", False),
         ("The actor initiating the interaction", False),
         ("The goal the actor is pursuing", False)],
        "The successful path is what everybody imagines while writing, so it "
        "gets recorded whatever format is used. The other ways an interaction "
        "can legitimately go, and what happens when it fails, are the parts "
        "prose omits and where defects concentrate -- which is the entire "
        "reason for using a template that makes their absence visible."),

    mcq("AVERAGE",
        "How should a usability requirement be stated so that it can be "
        "verified?",
        [("As a measurable task outcome, such as completion time or success "
          "rate", True),
         ("As a description of the interface layout the developers should "
          "produce", False),
         ("As a reference to the organisation's user interface style "
          "guide", False),
         ("As a statement that the interface shall be intuitive for new "
          "users", False)],
        "'A new user completes the booking task within three minutes without "
        "assistance' can be tested by observing users, can be designed "
        "towards, and can be failed. 'Intuitive' can be none of those, which "
        "makes it a requirement nobody can meet because nobody can fail it. A "
        "style guide constrains the solution rather than stating the need."),

    mcq("HARD",
        "An order can be cancelled, despatched or refunded, and the "
        "specification does not say whether a despatched order may be "
        "cancelled.\n\nWhat is the consequence?",
        [("The behaviour is decided by whichever validation the code checks "
          "first", True),
         ("The operation is rejected by default, since it was not "
          "specified", False),
         ("The database's referential integrity rules will prevent the "
          "transition", False),
         ("Developers will raise the ambiguity before implementing the "
          "operation", False)],
        "An unspecified transition does not become forbidden; it becomes "
        "accidental, resolved by the order in which checks happen to run and "
        "differing between the places the operation is invoked. A state model "
        "forces somebody to rule on each combination, which is exactly the "
        "class of gap it exists to expose."),

    mcq("AVERAGE",
        "What distinguishes a software requirement from the system "
        "requirement it derives from?",
        [("It describes program behaviour that can be tested against the "
          "software alone", True),
         ("It is written by developers rather than by business "
          "analysts", False),
         ("It concerns non-functional qualities rather than "
          "functions", False),
         ("It applies to one module rather than to the whole "
          "application", False)],
        "A system requirement states a business outcome, which no unit test "
        "can verify. The derivation produces behaviour the software must "
        "exhibit -- flagging an unallocated order after four hours, recording "
        "every access to a record -- which is testable against the software "
        "by itself. That testability is the purpose of deriving it at all."),

    mcq("HARD",
        "Two teams defer agreeing the interface between their systems until "
        "integration.\n\nWhat typically goes wrong?",
        [("Each has assumed different failure behaviour, and both built to "
          "their assumption", True),
         ("The data formats prove incompatible and one system must be "
          "rewritten", False),
         ("Neither team has allocated time to implement the interface at "
          "all", False),
         ("The interface performs poorly because neither team optimised "
          "for it", False)],
        "Both teams need something to build against, so both assume "
        "something, and formats and parameters are the parts they think to "
        "confirm. What each quietly assumes is the failure behaviour -- "
        "timeouts, retries, who handles a partial result -- and integration "
        "is where the two assumptions meet. Agreeing an interface is a "
        "negotiation, and deferring it does not defer the assumptions."),

    mcq("AVERAGE",
        "What is a scenario in relation to a use case?",
        [("One concrete path through it, with real values", True),
         ("The set of preconditions that must hold before it begins", False),
         ("An alternative use case covering an exceptional "
          "situation", False),
         ("The business process the use case forms part of", False)],
        "A scenario walks one specific path with actual data, which is what a "
        "test case is derived from and what makes a requirement discussable "
        "with somebody who does not think in abstractions. The use case "
        "describes every path; the scenario is one journey through it, made "
        "concrete."),

    mcq("HARD",
        "Why does a specification baseline matter beyond bureaucratic "
        "control?",
        [("Without one, 'the requirement changed' and 'it was always that' "
          "cannot be distinguished", True),
         ("It prevents stakeholders from requesting changes after "
          "approval", False),
         ("It is required before construction may begin under most "
          "development standards", False),
         ("It establishes which team is accountable for each part of the "
          "specification", False)],
        "A baseline is a recorded, agreed state, so a later disagreement "
        "about what was specified has an answer rather than two recollections. "
        "It does not prevent change -- changes are assessed against it and it "
        "is updated when one is approved. Its value is having something to "
        "measure change against at all."),

    mcq("AVERAGE",
        "Which part of a specification is most closely associated with a high "
        "density of defects in the delivered software?",
        [("The exception and error handling paths", True),
         ("The calculations performed on validated input", False),
         ("The reports generated from stored data", False),
         ("The screens through which users enter information", False)],
        "The normal path is imagined by everybody who reads or writes the "
        "specification, so it is specified, built and tested. The exceptional "
        "paths are thinly specified, built from assumption and exercised "
        "rarely -- and they are where a system spends its difficult moments, "
        "which is why a requirement covering only the happy case has "
        "specified the easy part."),

    mcq("HARD",
        "A state model of an entity reveals a state with no outgoing "
        "transitions that was not intended to be final.\n\n"
        "What has been found?",
        [("A specification gap where the entity can become permanently "
          "stuck", True),
         ("A redundant state that should be removed from the model", False),
         ("A modelling error, since every state requires an exit by "
          "definition", False),
         ("A performance concern, since the entity will accumulate in that "
          "state", False)],
        "An entity reaching that state can never leave it, so whatever it "
        "represents is stranded and somebody will eventually correct it by "
        "hand. It is a genuine gap in the specification rather than a "
        "modelling artefact -- final states legitimately have no exit, and "
        "this one was not meant to be final, which is precisely what drawing "
        "the model exposed."),
]

LESSON_DEV_SREQ = lesson(
    MAJOR, MIDDLE,
    "Software Requirements Definition and Specification",
    _sreq_quiz,
    lesson_structure(
        "Software Requirements Definition and Specification",
        "System requirements state a business outcome and software "
        "requirements state behaviour a program must exhibit, derived from "
        "them once the architecture allocated the outcome to software -- and "
        "the derivation exists so that what is written can actually be "
        "tested. This lesson covers specifying behaviour precisely including "
        "the exception paths where specifications are thinnest and defects "
        "densest, use cases and the flows a template will not let you skip, "
        "data and state models and the accidental transitions the second "
        "prevents, interface requirements and the failure behaviour both "
        "sides assume differently, quality requirements written as figures, "
        "and the verification-against-validation distinction the examination "
        "tests directly.",
        [
            "Distinguish a software requirement from the system requirement "
            "it derives from",
            "Specify behaviour including triggers, conditions, outcomes and "
            "exceptions",
            "Structure a use case and identify what its template forces",
            "Explain what data and state models each expose",
            "Specify interface requirements including failure behaviour",
            "Write a quality requirement in a verifiable form",
            "Distinguish verification from validation",
            "Explain what a specification baseline provides",
        ],
        80,
        _sreq_sections,
        [
            ("Derived software requirement",
             "Testable program behaviour derived from a business outcome the "
             "architecture allocated to software."),
            ("Exception paths",
             "What happens when inputs are wrong or a dependency fails -- the "
             "thinnest part of most specifications."),
            ("Use case",
             "Actor, goal, preconditions, main flow, alternative and "
             "exception flows, postconditions."),
            ("Scenario",
             "One concrete path through a use case with real values, from "
             "which a test case is derived."),
            ("Data model",
             "Entities, attributes and relationships. Exposes duplicated "
             "facts and unspecified rules."),
            ("State model",
             "States and transitions. Exposes transitions nobody defined and "
             "states with no way out."),
            ("Interface requirement",
             "What is exchanged with users, hardware, other software and "
             "networks -- including what happens on failure."),
            ("Verification",
             "Are we building the thing right -- checking work against its "
             "own specification."),
            ("Validation",
             "Are we building the right thing -- checking the specification "
             "against the actual need."),
            ("Baseline",
             "An agreed, recorded state that later changes are assessed "
             "against and that answers what was agreed."),
        ],
        "Software requirements are derived from system requirements once the "
        "architecture has allocated an outcome to software, and the point of "
        "the derivation is testability: a business outcome cannot be checked "
        "by a unit test and a required program behaviour can. Specifying "
        "behaviour means stating the trigger, condition, outcome, EXCEPTIONS "
        "and constraints -- with the exceptions being where specifications "
        "are thinnest and defects densest, because the normal path is what "
        "everybody imagines while writing. Use cases capture the alternative "
        "and exception flows that prose omits, and scenarios make one path "
        "concrete enough to become a test. Data models expose duplicated "
        "facts and state models expose transitions nobody ruled on -- and an "
        "unspecified transition does not become forbidden, it becomes "
        "accidental. Interface requirements must include failure behaviour, "
        "which is exactly what two teams deferring an agreement each assume "
        "differently. Quality requirements have to be figures, since "
        "'intuitive' cannot be failed and therefore cannot be met. And the "
        "distinction the examination presses is VERIFICATION against "
        "VALIDATION: building the thing right against building the right "
        "thing, with every verification activity capable of passing on a "
        "specification that describes the wrong system entirely.",
        exam_notes=[
            desc(
                "Items describe a project outcome and ask which activity was "
                "missing, or ask what a model exposed."
            ),
            ul([
                "Distinguishing verification from validation.",
                "Identifying the omitted part of a use case.",
                "Explaining what an unspecified state transition causes.",
                "Rewriting a quality requirement so it is verifiable.",
                "Explaining what deferring an interface agreement costs.",
                "Distinguishing a system from a software requirement.",
                "Explaining what a baseline provides.",
            ]),
            desc(
                "When an item says testing passed and users rejected the "
                "result, the answer is validation. Verification comparing a "
                "product to its specification proves internal consistency "
                "only, which a wrong specification has as readily as a right "
                "one."
            ),
        ],
    ))

# ==========================================================================
# Lesson 4: Software design
# ==========================================================================

_design_sections = [
    ("From What to How", [
        desc(
            "Design decides how the software will meet its requirements: what "
            "modules exist, what each is responsible for, and how they fit "
            "together."
        ),
        desc(
            "The syllabus divides it into ARCHITECTURAL design, which fixes "
            "the module structure and the interfaces between them, and "
            "DETAILED design, which specifies the internals of each module. "
            "The first constrains everything; the second is local, and can be "
            "revised without disturbing anything else."
        ),
        table(
            ["", "Architectural design", "Detailed design"],
            [["Decides", "What modules exist, and their interfaces",
              "How each module works inside"],
             ["Reach of a mistake", "The whole system",
              "One module"],
             ["Revised", "Expensively, and rarely", "Freely"],
             ["Reviewed by", "Everyone who depends on it",
              "Whoever maintains that module"]],
            caption="Two levels of design, distinguished by reach.",
            footer="The second row is the whole distinction. A decision whose "
                   "mistakes are contained can be made quickly and corrected "
                   "later; one whose mistakes propagate deserves the scrutiny "
                   "architectural decisions receive."),
        desc(
            "That division is itself the first lesson in good design. "
            "Decisions are placed where their consequences are contained, so "
            "that as much as possible can be changed later without "
            "disturbing the rest."
        ),
    ]),

    ("Coupling and Cohesion", [
        desc(
            "One pair of ideas does more work than anything else in this "
            "category, and the examination returns to it repeatedly."
        ),
        image(fig("coupling-cohesion")),
        table(
            ["", "Coupling", "Cohesion"],
            [["Concerns", "Relationships BETWEEN modules",
              "Relationships WITHIN a module"],
             ["Want it", "Low", "High"],
             ["Bad looks like",
              "Changing one module forces changes in several",
              "A module doing several unrelated things"],
             ["Practical test",
              "Can this module be understood without reading the others",
              "Can its purpose be named in one phrase"]],
            caption="Two measures, always stated together.",
            footer="The practical tests in the last row are what make these "
                   "usable rather than slogans. A module needing three other "
                   "files open to understand is tightly coupled; one whose "
                   "name has to include 'and' is weakly cohesive."),
        desc(
            "They move together because both follow from the same decision. "
            "Splitting by PURPOSE puts related things inside one module and "
            "leaves little for it to say to the others; splitting by "
            "convenience -- everything a screen needs, everything written on "
            "one day -- lowers cohesion and raises coupling at once."
        ),
    ]),

    ("Kinds of Coupling", [
        desc(
            "The syllabus grades coupling, and the ordering is worth knowing "
            "because it converts a vague preference into a specific "
            "judgement."
        ),
        table(
            ["Coupling", "Modules share", "Grade"],
            [["Data", "Parameters, passed explicitly", "Best"],
             ["Stamp", "A whole record, when only part is needed",
              "Acceptable"],
             ["Control", "A flag telling one module what to do",
              "Poor"],
             ["Common", "Global data", "Bad"],
             ["Content", "One module reaching inside another", "Worst"]],
            caption="Five kinds of coupling, from best to worst.",
            footer="CONTROL coupling is the one worth recognising in real "
                   "code: a boolean parameter deciding which of two behaviours "
                   "a function performs means the caller is directing the "
                   "callee's logic, and the two behaviours usually want to be "
                   "two functions."),
        desc(
            "COMMON coupling through global data is graded harshly for a "
            "practical reason: any module can change the value, so "
            "understanding what a module does requires knowing what every "
            "other module might have done first -- which is the property that "
            "makes a system unreasonable to reason about."
        ),
    ]),

    ("Kinds of Cohesion", [
        desc(
            "Cohesion is graded the same way, and the grades describe "
            "recognisable situations."
        ),
        ul([
            "FUNCTIONAL -- everything contributes to one well-defined task. "
            "The goal.",
            "SEQUENTIAL -- the output of one part is the input to the next.",
            "COMMUNICATIONAL -- the parts work on the same data.",
            "PROCEDURAL -- the parts happen in sequence, without being "
            "otherwise related.",
            "TEMPORAL -- the parts happen at the same TIME, such as "
            "everything done at start-up.",
            "LOGICAL -- similar things bundled together and selected by a "
            "flag.",
            "COINCIDENTAL -- no relationship at all, which is usually a "
            "utilities module that grew.",
        ]),
        desc(
            "TEMPORAL cohesion is worth recognising because it looks "
            "reasonable. An initialisation routine doing eight unrelated "
            "things is grouped only by when it runs, so a change to any one "
            "of them touches a module that has nothing else to do with it -- "
            "and the eight will need to change for eight different reasons."
        ),
    ]),

    ("Structured Design", [
        desc(
            "The classical approach decomposes a program by function, and its "
            "vocabulary appears in examination items."
        ),
        ol([
            "Start from what the software must do, taken from the "
            "requirements.",
            "Decompose it into major functions, each a module.",
            "Decompose each of those until a module does one thing at a level "
            "somebody can implement.",
            "Define the data passed between them, keeping it to what each "
            "actually needs.",
            "Check the result against coupling and cohesion, and redraw where "
            "either is poor.",
        ]),
        desc(
            "TOP-DOWN decomposition works from the whole towards the parts "
            "and risks discovering late that a low-level assumption was "
            "wrong. BOTTOM-UP builds from known-available pieces and risks "
            "discovering that they do not assemble into what was needed. Real "
            "designs work in both directions and meet in the middle."
        ),
    ]),

    ("Design Patterns", [
        desc(
            "Some design problems recur often enough to have named solutions, "
            "and the syllabus expects the idea rather than a catalogue."
        ),
        content_tabs(
            "WHAT A PATTERN IS FOR",
            "Three things a shared vocabulary of patterns provides.",
            [("A tested solution",
              "somebody already made the mistakes",
              "A pattern records a solution and its consequences, including "
              "when it is the wrong choice -- which is the part usually "
              "ignored when patterns are applied enthusiastically."),
             ("A shared vocabulary",
              "one word instead of a paragraph",
              "Saying a component is a facade communicates a structure and an "
              "intent in a word, which is most of a pattern's day-to-day "
              "value."),
             ("A warning",
              "patterns have costs",
              "Every pattern adds indirection, and indirection applied where "
              "the problem does not exist makes code harder to follow while "
              "solving nothing.")]),
        desc(
            "The examinable judgement is that a pattern is an answer to a "
            "specific problem. Applying one because it is good practice, "
            "rather than because the problem it solves is present, adds cost "
            "and no benefit -- which is the most common way patterns are "
            "misused."
        ),
    ]),

    ("Detailed Design", [
        desc(
            "Once modules and interfaces are fixed, each module's internals "
            "are specified in enough detail to be coded."
        ),
        table(
            ["Specified", "So that"],
            [["The algorithm or logic",
              "The implementation is a translation rather than an invention"],
             ["The data structures used",
              "Performance characteristics are known before coding"],
             ["The error handling",
              "Failures are handled deliberately rather than locally "
              "improvised"],
             ["The interfaces the module offers and requires",
              "It can be developed and tested independently"]],
            caption="Four things detailed design fixes.",
            footer="The third row is what distinguishes a designed module "
                   "from a written one. Error handling decided line by line "
                   "during coding is inconsistent by construction, since each "
                   "decision is made without seeing the others."),
        desc(
            "Detailed design is also where the unit tests become writable. A "
            "module with a specified interface and defined behaviour can have "
            "its tests designed before it is implemented -- which is what "
            "makes test-driven approaches possible rather than merely "
            "fashionable."
        ),
    ]),

    ("Designing for Change", [
        desc(
            "Software's advantage over hardware is that it can be changed, "
            "and a design either preserves that advantage or spends it."
        ),
        ul([
            "Identify what is LIKELY to change -- rules, rates, formats, "
            "external interfaces -- and isolate each behind something "
            "stable.",
            "Hide decisions inside modules, so a decision can be revisited "
            "without anything outside noticing.",
            "Prefer explicit parameters to shared state, since the second "
            "makes every change's reach unknowable.",
            "Do not generalise for changes nobody expects, which costs "
            "complexity now against a benefit that may never arrive.",
        ]),
        desc(
            "The tension between the first and last points is real and is the "
            "judgement being tested. Designing for anticipated change is "
            "prudent; designing for every conceivable change produces a "
            "configurable system nobody can understand, which is itself hard "
            "to change."
        ),
    ]),

    ("Information Hiding", [
        desc(
            "The principle underlying every coupling rule, stated on its own "
            "because it explains all of them at once."
        ),
        desc(
            "A module should expose WHAT it does and conceal HOW. Anything "
            "hidden can be changed without anything outside noticing, and "
            "anything exposed becomes something others may depend on -- so "
            "the interface is a promise and everything behind it stays "
            "negotiable."
        ),
        table(
            ["Hide", "So that"],
            [["The data structure used",
              "It can be replaced when volumes change"],
             ["The algorithm chosen",
              "A better one can be substituted silently"],
             ["Whether data is cached or fetched",
              "The decision can be revisited without callers changing"],
             ["The format stored on disk",
              "It can be migrated without touching every caller"]],
            caption="Four things worth hiding, and what hiding each buys.",
            footer="Each row is a decision that WILL be revisited. Hiding it "
                   "makes that revision a local change; exposing it makes the "
                   "same revision a negotiation with everybody who depended "
                   "on the exposed detail."),
        desc(
            "This also explains why content coupling is graded worst. A "
            "module reaching inside another has depended on something that "
            "was never promised, so the owning module can no longer change it "
            "-- and nobody wrote down that it had become part of the "
            "interface."
        ),
    ]),

    ("Designing the Module Boundaries", [
        desc(
            "The single decision that most determines coupling and cohesion "
            "is where the lines between modules are drawn."
        ),
        ol([
            "List the things the software must do, from the requirements.",
            "Group them by what they are ABOUT -- the subject matter -- "
            "rather than by when they run or which screen uses them.",
            "For each candidate module, state its purpose in one phrase and "
            "discard any grouping that needs 'and'.",
            "Trace a likely change through the result and check it lands "
            "inside one module.",
            "Look at what the modules must tell each other, and redraw if any "
            "pair needs constant conversation.",
        ]),
        desc(
            "Step four is the check worth doing before construction rather "
            "than discovering afterwards. If adding a new product type "
            "touches seven modules, the boundaries follow the wrong lines "
            "however reasonable the diagram looks -- and redrawing a diagram "
            "is considerably cheaper than restructuring code."
        ),
    ]),

    ("Designing for Testability", [
        desc(
            "A design decides how easily the result can be tested, which is "
            "why testability is treated as a design property rather than a "
            "testing concern."
        ),
        ul([
            "A module with an explicit interface and no hidden dependencies "
            "can be tested alone; one reaching out to a database, a clock or "
            "a network cannot.",
            "Passing dependencies in rather than creating them internally is "
            "what lets a test supply a substitute.",
            "Deterministic behaviour is testable; behaviour depending on the "
            "current time or a random value needs those supplied from "
            "outside.",
            "Small, single-purpose modules need few test cases each; a module "
            "doing several things needs their combinations.",
        ]),
        desc(
            "The last point is the arithmetic that makes this matter. A "
            "module with three independent binary conditions has eight paths; "
            "splitting it into three modules gives six cases in total. "
            "Cohesion is not only a clarity argument -- it decides how much "
            "testing the design will require."
        ),
    ]),

    ("Reviewing a Design", [
        desc(
            "A design is reviewed before construction, because it is the last "
            "point at which a structural mistake is cheap to correct."
        ),
        ol([
            "Check each requirement can actually be met by the design, "
            "particularly the quality requirements.",
            "Check the module boundaries against coupling and cohesion, using "
            "the two practical tests.",
            "Walk a likely change through it and see how many modules it "
            "touches.",
            "Walk a failure through it -- what happens when a dependency is "
            "unavailable -- since that is what detailed design most often "
            "leaves vague.",
            "Check that anything unfamiliar or unproven has been prototyped "
            "rather than assumed.",
        ]),
        desc(
            "Step three is the one that finds the mistakes worth finding. A "
            "design can satisfy every requirement as stated and still be "
            "drawn along lines that make ordinary future changes expensive -- "
            "and nothing in the requirements will reveal that, because "
            "requirements describe today."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where design items are lost."),
        ul([
            "Reversing the goals. Coupling LOW, cohesion HIGH.",
            "Treating a boolean parameter selecting behaviour as harmless. It "
            "is control coupling.",
            "Accepting global data as convenient, when it makes every module "
            "depend on every other.",
            "Grouping code by when it runs rather than by what it does, which "
            "is temporal cohesion.",
            "Applying a pattern because it is good practice rather than "
            "because its problem exists.",
            "Leaving error handling to be decided during coding, which makes "
            "it inconsistent by construction.",
            "Generalising for changes nobody expects, producing something "
            "harder to change.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A module receives a boolean parameter which selects between "
            "two entirely different behaviours. Classify the coupling, and "
            "state what should be done.\""
        ),
        ol([
            "Identify what is passed: not data the module operates on, but an "
            "instruction about which logic to run.",
            "That is CONTROL coupling -- the caller is directing the callee's "
            "internal decisions.",
            "It means the caller must know how the callee is structured "
            "inside, which is exactly what modularity exists to prevent.",
            "It also means the module has two unrelated behaviours in one "
            "place, so its cohesion is poor as well.",
            "The remedy is two functions, each doing one thing, with the "
            "caller choosing which to call -- which removes both the control "
            "coupling and the weak cohesion at once.",
        ]),
        desc(
            "Step five illustrates why the two measures are always taught "
            "together. The same restructuring fixed both, because they were "
            "two symptoms of one decision: putting two purposes in one module "
            "and needing a flag to choose between them."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Design ideas recur throughout the certification."),
        ul([
            "Low coupling and high cohesion are the same argument the network "
            "lessons made for layering.",
            "Hiding decisions inside modules is encapsulation, from the "
            "object-oriented lesson that follows.",
            "Global data's hazards are the shared-state race conditions of "
            "Operating Systems.",
            "Data structure choice in detailed design comes from the "
            "Algorithms category.",
            "Designed error handling becomes the fault tolerance of System "
            "Configuration.",
            "Designing for anticipated change reduces the maintenance cost "
            "covered later in this category.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("The pairing, with directions",
              "Coupling low, cohesion high",
              "And they move together, because both follow from splitting by "
              "purpose."),
             ("The practical test for each",
              "Understandable alone; nameable in one phrase",
              "Needing three other files open means tight coupling; a name "
              "containing 'and' means weak cohesion."),
             ("What a boolean behaviour flag is",
              "Control coupling, plus weak cohesion",
              "Two functions fix both at once, which is why the measures are "
              "taught together."),
             ("Why global data is graded so badly",
              "Understanding one module requires knowing what every other "
              "might have done",
              "Which is precisely what makes a system unreasonable to reason "
              "about."),
             ("Temporal cohesion",
              "Grouped by WHEN it runs, not what it does",
              "An initialisation routine doing eight things that change for "
              "eight different reasons."),
             ("When a pattern is the wrong choice",
              "When the problem it solves is not present",
              "Every pattern adds indirection, which costs clarity and buys "
              "nothing if unneeded.")]),
    ]),
]

_design_quiz = [
    mcq("HARD",
        "A function takes a boolean parameter that selects between two "
        "entirely different behaviours.\n\nHow is this classified, and what "
        "is the remedy?",
        [("Control coupling, remedied by splitting it into two "
          "functions", True),
         ("Data coupling, which is acceptable and needs no change", False),
         ("Common coupling, remedied by removing the shared global "
          "state", False),
         ("Stamp coupling, remedied by passing only the fields "
          "needed", False)],
        "The parameter is not data the function operates on but an "
        "instruction about which logic to run, so the caller is directing the "
        "callee's internal decisions -- control coupling. It also indicates "
        "weak cohesion, since one module holds two unrelated behaviours. "
        "Splitting into two functions removes both at once, which is why the "
        "two measures are always taught together."),

    mcq("AVERAGE",
        "What are the goals for coupling and cohesion in a modular design?",
        [("Low coupling and high cohesion", True),
         ("High coupling and high cohesion", False),
         ("Low coupling and low cohesion", False),
         ("High coupling and low cohesion", False)],
        "Coupling measures dependence BETWEEN modules and should be low, so a "
        "change lands in one place. Cohesion measures how well the contents "
        "of one module belong together and should be high, so its purpose can "
        "be named and understood. They tend to move together, because "
        "splitting a system by purpose improves both simultaneously."),

    mcq("HARD",
        "An initialisation routine performs eight unrelated tasks that all "
        "happen when the program starts.\n\nWhat kind of cohesion is this?",
        [("Temporal", True),
         ("Functional, since all the tasks serve program start-up", False),
         ("Sequential, since each task follows the previous one", False),
         ("Communicational, since the tasks operate on shared state", False)],
        "The tasks are grouped only by WHEN they run, which is temporal "
        "cohesion -- and it looks reasonable, which is what makes it worth "
        "recognising. The eight tasks will need to change for eight different "
        "reasons, each change touching a module that otherwise has nothing to "
        "do with them. Functional cohesion means everything serves one "
        "well-defined task."),

    mcq("AVERAGE",
        "Why is common coupling through global data graded so poorly?",
        [("Understanding one module requires knowing what every other might "
          "have done", True),
         ("Global data consumes memory for the whole life of the "
          "program", False),
         ("Access to global data is slower than access to "
          "parameters", False),
         ("Global data cannot be given meaningful names in most "
          "languages", False)],
        "Any module can change the value, so reasoning about one module's "
        "behaviour requires reasoning about every other module that might "
        "have run first. That destroys the property modularity exists to "
        "provide -- being able to understand a part without the whole -- and "
        "it is the same hazard shared mutable state creates in concurrent "
        "programming."),

    mcq("AVERAGE",
        "What is the practical test for whether a module has good cohesion?",
        [("Its purpose can be stated in a single phrase without 'and'", True),
         ("It contains fewer than a stated number of lines of code", False),
         ("It can be compiled without reference to other modules", False),
         ("Its interface exposes a small number of operations", False)],
        "A module whose name or description requires 'and' is doing more than "
        "one thing, which is weak cohesion made visible. Size and interface "
        "width correlate loosely with cohesion and do not measure it -- a "
        "short module can do two unrelated things and a long one can do a "
        "single complicated thing well."),

    mcq("HARD",
        "A design applies a pattern because it is considered good practice, "
        "although the problem the pattern addresses is not present.\n\n"
        "What is the effect?",
        [("Added indirection that costs clarity and provides no "
          "benefit", True),
         ("Improved maintainability, since the pattern anticipates future "
          "needs", False),
         ("No effect, since patterns are neutral structural "
          "choices", False),
         ("Reduced performance, which is the pattern's principal "
          "cost", False)],
        "Every pattern introduces indirection, and indirection is what buys "
        "the flexibility a pattern offers. Where the problem is absent, the "
        "cost is paid and nothing is bought -- code becomes harder to follow "
        "in exchange for a flexibility nobody needs. A pattern is an answer "
        "to a specific problem rather than a standard of quality."),

    mcq("AVERAGE",
        "What distinguishes architectural design from detailed design?",
        [("Architectural design fixes modules and interfaces; detailed design "
          "specifies internals", True),
         ("Architectural design concerns hardware and detailed design "
          "software", False),
         ("Architectural design is documented while detailed design is "
          "not", False),
         ("Architectural design is performed before requirements are "
          "complete", False)],
        "Architectural design decides what modules exist and how they meet, "
        "which constrains everything afterwards. Detailed design specifies "
        "each module's internals, which is local and revisable without "
        "disturbing anything else. Placing decisions where their consequences "
        "are contained is itself the first principle of good design."),

    mcq("HARD",
        "Why should error handling be settled during detailed design rather "
        "than during coding?",
        [("Decided line by line, it is inconsistent by construction", True),
         ("Coding standards prohibit developers from designing error "
          "handling", False),
         ("Error handling cannot be tested unless it was specified in "
          "advance", False),
         ("Compilers cannot verify error handling written without a "
          "specification", False)],
        "Each decision made while coding is made without visibility of the "
        "others, so the result is inconsistent whatever the individual "
        "judgements -- one path logs and continues, another throws, a third "
        "returns a default. Deciding it as a design question makes the "
        "handling uniform and deliberate, which is what distinguishes a "
        "designed module from a written one."),

    mcq("AVERAGE",
        "In the grading of coupling, which form is considered best?",
        [("Data coupling, where parameters are passed explicitly", True),
         ("Stamp coupling, where a whole record is passed", False),
         ("Control coupling, where a flag directs the callee's "
          "behaviour", False),
         ("Content coupling, where one module accesses another's "
          "internals", False)],
        "Passing exactly the data a module needs, explicitly, makes the "
        "dependency visible and minimal. Stamp coupling passes more than is "
        "needed and is acceptable; control coupling has the caller directing "
        "internal logic; content coupling, where one module reaches inside "
        "another, is the worst because it depends on the other's "
        "implementation rather than its interface."),

    mcq("HARD",
        "A design is made highly configurable to accommodate changes nobody "
        "has requested.\n\nWhat is the risk?",
        [("The configurability itself becomes complexity that is hard to "
          "change", True),
         ("Configuration options will be set incorrectly by operations "
          "staff", False),
         ("The additional code paths cannot be adequately tested", False),
         ("Performance degrades because options are evaluated at "
          "runtime", False)],
        "Designing for anticipated change is prudent, and designing for every "
        "conceivable change produces a system whose flexibility is itself the "
        "obstacle -- nobody can follow what it does, so changing it is hard "
        "in exactly the way the generality was meant to prevent. The "
        "judgement being tested is where the line falls between the two."),
]

LESSON_DEV_DESIGN = lesson(
    MAJOR, MIDDLE,
    "Software Architecture Design and Detailed Design",
    _design_quiz,
    lesson_structure(
        "Software Architecture Design and Detailed Design",
        "Design decides how software will meet its requirements, and it "
        "divides into architectural design fixing modules and interfaces and "
        "detailed design specifying each module's internals -- a division "
        "that is itself the first principle, since decisions belong where "
        "their consequences are contained. The lesson's centre is the pair "
        "the examination returns to most: coupling low, cohesion high, both "
        "with practical tests and both graded, so a vague preference becomes "
        "a specific judgement about a boolean flag or a global variable. It "
        "closes with structured decomposition, what design patterns are "
        "actually for, what detailed design must fix, and the real tension in "
        "designing for change.",
        [
            "Distinguish architectural from detailed design",
            "Define coupling and cohesion and apply the practical test for "
            "each",
            "Grade the kinds of coupling and identify control coupling in "
            "code",
            "Grade the kinds of cohesion and recognise temporal cohesion",
            "Apply structured decomposition, top-down and bottom-up",
            "Explain what a design pattern provides and when it is "
            "inappropriate",
            "State what detailed design must fix and why error handling is "
            "among it",
            "Reason about designing for anticipated change without "
            "over-generalising",
        ],
        85,
        _design_sections,
        [
            ("Architectural design",
             "Fixes what modules exist and how they meet. Constrains "
             "everything afterwards."),
            ("Detailed design",
             "Specifies each module's internals -- logic, data structures, "
             "error handling, interfaces. Local and revisable."),
            ("Coupling",
             "Dependence between modules. Want it LOW. Test: can this be "
             "understood without reading the others."),
            ("Cohesion",
             "How well one module's contents belong together. Want it HIGH. "
             "Test: can its purpose be named in one phrase."),
            ("Data coupling",
             "Parameters passed explicitly, carrying only what is needed. The "
             "best form."),
            ("Control coupling",
             "A flag directing the callee's internal logic. Usually two "
             "functions wanting to be separated."),
            ("Common coupling",
             "Shared global data, so understanding one module needs knowledge "
             "of every other."),
            ("Content coupling",
             "One module reaching inside another, depending on implementation "
             "rather than interface. The worst."),
            ("Functional cohesion",
             "Everything contributes to one well-defined task. The goal."),
            ("Temporal cohesion",
             "Grouped by when it runs -- an initialisation routine of "
             "unrelated tasks changing for unrelated reasons."),
            ("Design pattern",
             "A recorded solution with its consequences. Adds indirection, so "
             "it costs and buys nothing where its problem is absent."),
            ("Designing for change",
             "Isolating what is likely to change, without generalising for "
             "changes nobody expects."),
        ],
        "Design divides into architectural design, which fixes modules and "
        "interfaces and constrains everything after it, and detailed design, "
        "which specifies internals and can be revised locally -- and placing "
        "decisions where their consequences are contained is itself the first "
        "principle. The pair that does most of the work is COUPLING low and "
        "COHESION high, with practical tests that make them usable: can this "
        "module be understood without reading three others, and can its "
        "purpose be named in one phrase without 'and'. Both are graded. Data "
        "coupling passes exactly what is needed; control coupling has a flag "
        "directing the callee's logic and usually indicates two functions "
        "wanting separation; common coupling through globals means "
        "understanding one module requires knowing what every other might "
        "have done; content coupling reaches inside another module and is "
        "worst. Cohesion runs from functional down to coincidental, with "
        "TEMPORAL worth recognising because it looks reasonable -- eight "
        "start-up tasks that will change for eight different reasons. Beyond "
        "that: structured decomposition works top-down and bottom-up and "
        "meets in the middle; a design pattern is an answer to a specific "
        "problem and pure cost where that problem is absent; detailed design "
        "must fix error handling, because decided line by line it is "
        "inconsistent by construction; and designing for change means "
        "isolating what is likely to change without building a "
        "configurability nobody can understand.",
        exam_notes=[
            desc(
                "Items describe a piece of structure and ask for its "
                "classification, or ask what should be done about it."
            ),
            ul([
                "Classifying coupling from a described parameter or "
                "dependency.",
                "Classifying cohesion from a described module.",
                "Stating the goal directions for both.",
                "Explaining why global data is poor practice.",
                "Explaining when a design pattern is inappropriate.",
                "Distinguishing architectural from detailed design.",
                "Explaining the risk of over-generalising.",
            ]),
            desc(
                "When an item describes a structural problem, check both "
                "measures rather than one. Poor coupling and poor cohesion "
                "usually appear together because they are two symptoms of the "
                "same decision, and the answer that fixes both is the one "
                "being looked for."
            ),
        ],
    ))

LESSONS = [LESSON_DEV_SREQ, LESSON_DEV_DESIGN]

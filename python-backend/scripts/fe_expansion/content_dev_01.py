"""Development Technology -> System Development Technology, lessons 1 and 2.

Syllabus stages: system requirements definition, and system architecture
design.

These are the two stages before software is discussed at all, and the
examination tests exactly that boundary -- what belongs to the system and
what has been delegated to the software.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Development Technology"
MIDDLE = "System Development Technology"

# ==========================================================================
# Lesson 1: System requirements definition
# ==========================================================================

_reqs_sections = [
    ("Where a System Begins", [
        desc(
            "A development project begins with somebody wanting something to "
            "be different, and the first stage's job is turning that into a "
            "statement precise enough to build against."
        ),
        image(fig("development-lifecycle")),
        desc(
            "The stages that follow each take the previous one as input, "
            "which is why an error here propagates through everything. It is "
            "also why this stage receives attention out of proportion to its "
            "duration: it is short and it constrains all the rest."
        ),
    ]),

    ("Why Requirements Errors Are Expensive", [
        desc(
            "The examination reliably tests the economics, because they "
            "justify practices that otherwise look like delay."
        ),
        image(fig("cost-of-defect")),
        desc(
            "A misunderstood requirement caught while writing the "
            "requirements costs a conversation. Caught in production it costs "
            "the code, the design, the documents, the retesting and whatever "
            "harm the wrong behaviour already did -- and the ratio is roughly "
            "an order of magnitude per stage."
        ),
        desc(
            "This is the whole argument for reviews, prototypes and early "
            "customer involvement. Each spends time now to avoid spending far "
            "more later, and each looks like a delay to anyone measuring "
            "progress by how much code exists."
        ),
    ]),

    ("Stakeholders", [
        desc(
            "Requirements come from people, and identifying which people is a "
            "distinct activity that projects skip and then regret."
        ),
        table(
            ["Stakeholder", "Wants", "Easy to overlook because"],
            [["Users", "The work to be easier",
              "They may not be the ones paying"],
             ["The sponsor", "A business outcome",
              "They rarely use the system"],
             ["Operations", "Something maintainable and monitorable",
              "They are not consulted until handover"],
             ["Compliance and audit", "Evidence and controls",
              "Their requirements are stated as law, not features"],
             ["External parties", "Interfaces that keep working",
              "They are not in the building"]],
            caption="Five stakeholder groups and why each gets missed.",
            footer="OPERATIONS is the omission with the longest tail. A "
                   "system nobody can monitor, back up or restart cleanly "
                   "meets its functional requirements and costs far more to "
                   "run than it needed to."),
        desc(
            "Stakeholders conflict, and that is normal rather than a sign of "
            "poor analysis. A finance department wanting controls and a sales "
            "team wanting speed are both right about their own concerns -- so "
            "the analyst's job includes surfacing the conflict and getting it "
            "decided by somebody with the authority to."
        ),
    ]),

    ("Eliciting Requirements", [
        desc(
            "Requirements are rarely written down waiting to be collected. "
            "They are drawn out, and the syllabus names the techniques."
        ),
        content_accordion(
            "FIVE ELICITATION TECHNIQUES",
            "Each is good at something the others are not.",
            [("Interviews",
              "Depth from one person at a time. Good for understanding "
              "reasoning and exceptions; slow, and limited to what the "
              "interviewee thinks to mention."),
             ("Workshops",
              "Several stakeholders together, which surfaces conflicts "
              "immediately rather than months later. Needs facilitation or "
              "the loudest voice wins."),
             ("Observation",
              "Watching the work as it is actually done. Reveals the "
              "workarounds and exceptions nobody describes, because people "
              "report the official process rather than their own."),
             ("Document analysis",
              "Existing forms, reports and procedures. Cheap, and describes "
              "the current system rather than the needed one."),
             ("Prototyping",
              "Something to react to. People are far better at criticising a "
              "concrete thing than at specifying an abstract one, which is "
              "the entire reason it works.")]),
        desc(
            "OBSERVATION earns its place because of a specific and reliable "
            "gap: what people say they do and what they do differ, not "
            "through dishonesty but because the workarounds have become "
            "invisible to them. A system built from the described process "
            "fails on the real one."
        ),
    ]),

    ("Functional and Non-Functional", [
        desc(
            "The single most useful distinction in requirements work, and one "
            "the examination tests directly."
        ),
        image(fig("requirements-types")),
        table(
            ["", "Functional", "Non-functional"],
            [["States", "What the system must do",
              "How well it must do it"],
             ["Example", "Calculate the monthly interest",
              "Respond within two seconds"],
             ["Elicited by", "Asking",
              "Asking specifically, because nobody volunteers them"],
             ["Failure looks like", "A missing feature",
              "A feature that exists and is unusable"],
             ["Cost of late discovery", "Adding code",
              "Frequently redesigning the architecture"]],
            caption="Two kinds of requirement, and why one is riskier.",
            footer="The last row is why non-functional requirements matter "
                   "disproportionately. Performance, availability and "
                   "security are properties of the ARCHITECTURE, so "
                   "discovering them late means revisiting decisions "
                   "everything was built on."),
        desc(
            "Non-functional requirements must be QUANTIFIED to be usable. "
            "'The system shall be fast' cannot be tested, cannot be designed "
            "for and cannot be argued about productively; 'ninety-five per "
            "cent of searches shall return within two seconds at five hundred "
            "concurrent users' can be all three."
        ),
    ]),

    ("What Makes a Requirement Good", [
        desc(
            "The syllabus lists the properties a requirement should have, and "
            "each corresponds to a specific way projects go wrong."
        ),
        ul([
            "UNAMBIGUOUS -- it has exactly one reading. Two readings means "
            "two systems were agreed to.",
            "TESTABLE -- somebody can decide objectively whether it is met.",
            "COMPLETE -- it says what happens in the exceptional cases as "
            "well as the normal one.",
            "CONSISTENT -- it does not contradict another requirement, which "
            "is what review across the whole set finds.",
            "TRACEABLE -- it can be followed forward into design, code and "
            "tests, and backwards to whoever needed it.",
            "NECESSARY -- somebody actually needs it, rather than it having "
            "seemed like a good idea.",
        ]),
        desc(
            "TESTABILITY is the most useful of these as a working check, "
            "because it catches ambiguity as a side effect. If nobody can "
            "describe the test that would prove a requirement met, the "
            "requirement does not yet say enough -- which turns a vague "
            "quality criterion into a concrete question."
        ),
    ]),

    ("Modelling What Was Found", [
        desc(
            "Prose alone hides gaps, so requirements are also expressed as "
            "models -- and the examination expects the common ones by "
            "purpose."
        ),
        table(
            ["Model", "Shows", "Reveals"],
            [["Use case", "Who wants what from the system",
              "Actors nobody had considered"],
             ["Business process model", "The flow of work",
              "Steps with no owner, and loops"],
             ["Data model", "What information exists and how it relates",
              "Facts recorded in two places"],
             ["State model", "How something changes over its life",
              "Transitions nobody specified"],
             ["Context diagram", "The system's boundary and its neighbours",
              "Interfaces nobody had scoped"]],
            caption="Five models, valued by what each exposes.",
            footer="The third column is why modelling is worth the effort. A "
                   "model's value is not the picture but the questions "
                   "drawing it forces somebody to answer."),
        desc(
            "The CONTEXT diagram deserves particular attention at this stage "
            "because it fixes the SCOPE. Everything inside the boundary is "
            "being built or changed; everything outside is a given -- and "
            "disagreements about that line are far cheaper to resolve now "
            "than during integration."
        ),
    ]),

    ("Prioritising", [
        desc(
            "Not everything can be delivered at once, so requirements are "
            "ranked -- and the ranking has to be done by the people who bear "
            "the consequences."
        ),
        desc(
            "The MoSCoW classification is the one the syllabus names: MUST "
            "have, SHOULD have, COULD have, and WON'T have this time. Its "
            "value is the last category, which records a decision rather than "
            "leaving an omission to be rediscovered as a surprise."
        ),
        ul([
            "Priority must come from the business, not from whoever finds a "
            "requirement interesting to build.",
            "If everything is a MUST, nothing has been prioritised and the "
            "exercise has failed.",
            "A MUST is genuinely must: the delivery is worthless without it, "
            "which is a high bar deliberately.",
            "Priorities change as the project learns, and are revisited "
            "rather than fixed once.",
        ]),
    ]),

    ("Managing Change", [
        desc(
            "Requirements change during a project, and pretending otherwise "
            "produces either a rigid system nobody wants or an uncontrolled "
            "one nobody can finish."
        ),
        ol([
            "A change is requested, and recorded rather than absorbed "
            "informally.",
            "Its impact is assessed -- on design, code, tests, schedule and "
            "cost.",
            "Somebody with authority decides, knowing that impact.",
            "The decision is recorded, and the baseline updated if it was "
            "accepted.",
            "Everything traceable to the changed requirement is revisited.",
        ]),
        desc(
            "SCOPE CREEP is what happens without step two. Individually each "
            "small addition seems reasonable and refusing it seems "
            "obstructive; collectively they consume the schedule, and because "
            "no single one was ever assessed, nobody can say where it went."
        ),
    ]),

    ("Reviewing the Requirements", [
        desc(
            "Requirements are reviewed before anything is built, which is the "
            "cheapest defect removal available anywhere in the life cycle."
        ),
        ol([
            "Circulate the document with enough time to read it properly.",
            "Have each stakeholder group check the parts they are answerable "
            "for, rather than everybody skimming everything.",
            "Look for the specific defects: ambiguity, missing exception "
            "cases, contradictions between requirements, and anything "
            "untestable.",
            "Record every finding, since an issue raised and forgotten is "
            "worse than one never raised.",
            "Resolve each finding explicitly, and re-review the parts that "
            "changed materially.",
        ]),
        desc(
            "Step two is what makes a review productive rather than "
            "ceremonial. A room of people all reading the whole document "
            "finds far less than the same people each checking what they know "
            "about, because expertise is what turns a plausible sentence into "
            "an obvious error."
        ),
    ]),

    ("Traceability in Practice", [
        desc(
            "Traceability is listed as a property of a good requirement, and "
            "it is worth seeing what it buys once a project is under way."
        ),
        table(
            ["Question", "Answered by tracing"],
            [["Why does this code exist",
              "Backwards, to the requirement and its originator"],
             ["What must change if this requirement changes",
              "Forwards, into design, code and tests"],
             ["Have we built everything asked for",
              "Forwards, checking each requirement reaches code"],
             ["Is anything built that nobody asked for",
              "Backwards, from code that traces to nothing"],
             ["What must be retested after this change",
              "Forwards, to the tests covering it"]],
            caption="Five questions, all unanswerable without traceability.",
            footer="The fourth row catches gold plating -- functionality "
                   "somebody added because it seemed useful. It costs "
                   "maintenance forever and was never requested by anyone, "
                   "and nothing but tracing finds it."),
        desc(
            "The last row is the one that pays continuously. Deciding what to "
            "retest after a change is otherwise guesswork, and guessing "
            "produces either an unaffordable full regression run or a gap "
            "that ships a defect."
        ),
    ]),

    ("Requirements in an Iterative Project", [
        desc(
            "Not every project settles its requirements before building, and "
            "the syllabus expects the difference to be understood rather than "
            "judged."
        ),
        compare_grid(
            "SPECIFIED UP FRONT AGAINST DISCOVERED ITERATIVELY",
            "Two ways of handling the same uncertainty.",
            [("Specified first",
              ["The whole set agreed before construction",
               "Predictable, and easy to contract for",
               "Assumes the requirements are knowable now",
               "Change late is expensive"]),
             ("Discovered iteratively",
              ["A prioritised backlog, refined as it is approached",
               "Feedback from working software shapes what follows",
               "Assumes the requirements will change",
               "Needs an engaged customer throughout"])]),
        desc(
            "The choice follows from how well the requirements are actually "
            "understood. Where they are stable and well known, specifying "
            "first is cheaper; where discovering them IS the project's main "
            "risk, building something and reacting to it addresses that risk "
            "directly and specifying first merely documents the guess."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where requirements items are lost."),
        ul([
            "Confusing functional with non-functional. What it does against "
            "how well it does it.",
            "Leaving a non-functional requirement unquantified, so it cannot "
            "be tested or designed for.",
            "Omitting operations and compliance from the stakeholder list.",
            "Taking the described process as the real one, which observation "
            "exists to correct.",
            "Treating stakeholder conflict as an analysis failure rather than "
            "a decision to be escalated.",
            "Classifying everything as a MUST, which is not "
            "prioritisation.",
            "Absorbing small changes without assessment, which is how scope "
            "creep happens invisibly.",
            "Believing a requirement is complete when it covers only the "
            "normal case.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A delivered system performs all its specified functions "
            "correctly but is abandoned by users, who say it is too slow to "
            "use during busy periods. What was the failure, and at which "
            "stage?\""
        ),
        ol([
            "Note what worked: every FUNCTIONAL requirement was met, which "
            "the item states.",
            "Note what failed: response time under load, which is a "
            "NON-FUNCTIONAL requirement.",
            "So either it was never elicited, or it was stated without a "
            "figure and therefore never testable.",
            "The failure belongs to the requirements stage, not to "
            "construction -- the developers built what was specified.",
            "The consequence is severe because performance is an "
            "architectural property, so correcting it now means revisiting "
            "design decisions everything rests on.",
        ]),
        desc(
            "Step five is what the item is really testing. A missing "
            "function can be added; a missing performance requirement "
            "frequently cannot be retrofitted without redesign, which is why "
            "the syllabus treats non-functional requirements as the "
            "higher-risk category."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Requirements work reaches across the certification."),
        ul([
            "Non-functional performance requirements become the capacity "
            "figures of System Evaluation.",
            "Availability requirements become the RTO and RPO of Service "
            "Management.",
            "Security requirements come from the risk assessment of the "
            "Security category.",
            "Data models here become the E-R models of the Database "
            "lessons.",
            "Stakeholder identification is a Project Management activity.",
            "Change control is the configuration management discipline "
            "covered later in this category.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Functional against non-functional",
              "What it does, against how well",
              "The second is riskier, because it is a property of the "
              "architecture rather than of a feature."),
             ("Why defect cost rises by stage",
              "Each later stage has more built on the error",
              "Roughly an order of magnitude per stage, which is the argument "
              "for early review."),
             ("What observation finds that interviews do not",
              "The workarounds people no longer notice",
              "Described process and actual process differ without anybody "
              "being dishonest."),
             ("The most useful test of a requirement",
              "Can somebody describe the test that proves it met",
              "Untestable means it does not yet say enough, which catches "
              "ambiguity as a side effect."),
             ("What MoSCoW's fourth category is for",
              "Recording what was deliberately excluded",
              "So an omission is a decision rather than a later surprise."),
             ("How scope creep happens",
              "Small changes absorbed without impact assessment",
              "Each seems reasonable alone; collectively they consume the "
              "schedule untraceably.")]),
    ]),
]

_reqs_quiz = [
    mcq("HARD",
        "A delivered system performs every specified function correctly but "
        "is abandoned because it is too slow during busy periods.\n\n"
        "Where did the failure occur?",
        [("In construction, since the developers implemented the functions "
          "inefficiently", False),
         ("In requirements, where a quantified performance requirement was "
          "never captured", True),
         ("In testing, since performance under load was not exercised before "
          "release", False),
         ("In deployment, because the production environment was sized "
          "incorrectly", False)],
        "Every functional requirement was met, so the developers built what "
        "was specified -- which places the failure at the stage where the "
        "performance requirement should have been elicited and quantified. It "
        "is the costly kind, because response under load is a property of the "
        "ARCHITECTURE, so correcting it means revisiting decisions everything "
        "was built on rather than adding code."),

    mcq("AVERAGE",
        "Which of these is a non-functional requirement?",
        [("The system shall calculate monthly interest on each account", False),
         ("The system shall respond to a search within two seconds", True),
         ("The system shall allow an administrator to create user "
          "accounts", False),
         ("The system shall produce a monthly statement for each "
          "customer", False)],
        "A non-functional requirement states how WELL the system must "
        "perform rather than what it must do -- performance, availability, "
        "security, usability. The other three describe functions. Note also "
        "that the correct option is quantified: 'shall be fast' would be "
        "non-functional and useless, since nothing could test, design for, or "
        "argue about it."),

    mcq("HARD",
        "Why is observing users at work valuable even after they have been "
        "interviewed?",
        [("Observation reveals workarounds and exceptions people no longer "
          "notice", True),
         ("Interview responses are frequently inaccurate because staff "
          "conceal inefficiencies", False),
         ("Observation captures timing data that interviews cannot provide "
          "at all", False),
         ("Interviews cannot cover enough people to be representative of a "
          "department", False)],
        "People describe the official process because the workarounds have "
        "become invisible to them through repetition -- there is no "
        "dishonesty involved. A system built from the described process fails "
        "on the real one, which is why observation catches a class of "
        "requirement that no amount of asking produces."),

    mcq("AVERAGE",
        "What is the most practical test of whether a requirement is well "
        "written?",
        [("Whether somebody can describe the test that would prove it "
          "met", True),
         ("Whether it is written in the language the stakeholders "
          "use", False),
         ("Whether it can be implemented within the project's "
          "budget", False),
         ("Whether it has been approved by the project sponsor", False)],
        "Testability is a requirement of its own and doubles as a check on "
        "ambiguity: if nobody can state the test, the requirement does not "
        "yet say enough. It turns a vague quality criterion into a concrete "
        "question anybody can apply, which is why it is the most useful of "
        "the properties in practice."),

    mcq("HARD",
        "A project accepts a series of small additional requirements during "
        "development, each assessed by nobody.\n\nWhat is the "
        "characteristic result?",
        [("Scope creep, with schedule consumed and no record of where", True),
         ("Requirements conflict, as the additions contradict the original "
          "specification", False),
         ("Gold plating, where developers add features nobody "
          "requested", False),
         ("Requirements volatility, as stakeholders change their minds "
          "repeatedly", False)],
        "Each addition seems small and refusing it seems obstructive, so they "
        "are absorbed individually; collectively they consume the schedule, "
        "and because none was ever assessed nobody can account for the "
        "overrun. Gold plating is developers adding what nobody asked for, "
        "which is a related failure with a different origin -- here the "
        "requests were genuine."),

    mcq("AVERAGE",
        "Which stakeholder group is most often omitted, with consequences "
        "lasting the system's whole life?",
        [("Operations staff, who must run and monitor it", True),
         ("End users, who perform the work the system supports", False),
         ("The project sponsor, who funds the development", False),
         ("Developers, who build and maintain the code", False)],
        "Operations are typically not consulted until handover, so a system "
        "can meet every functional requirement and be difficult to monitor, "
        "back up or restart cleanly -- costs paid every day for years "
        "afterwards. Users and sponsors are visible by their nature; the "
        "group that inherits a system is the one nobody thinks to invite."),

    mcq("AVERAGE",
        "What does the context diagram establish at the requirements stage?",
        [("The system's boundary and the external parties it "
          "interacts with", True),
         ("The sequence in which the system's functions are "
          "performed", False),
         ("The information the system stores and how it relates", False),
         ("The states an entity passes through during its life", False)],
        "A context diagram fixes SCOPE: what is being built or changed, and "
        "what is a given outside it. Disagreements about that line are "
        "considerably cheaper to resolve at this stage than during "
        "integration, when an interface nobody scoped becomes everybody's "
        "problem. Sequence, data and state are shown by other models."),

    mcq("HARD",
        "In MoSCoW prioritisation, what is the purpose of the 'won't have' "
        "category?",
        [("It records what was deliberately excluded, as a decision", True),
         ("It lists requirements that were found to be technically "
          "infeasible", False),
         ("It holds requirements deferred until a later project "
          "phase", False),
         ("It identifies requirements the sponsor declined to fund", False)],
        "Recording an exclusion turns it into a decision that was made and "
        "communicated, rather than an omission somebody discovers later and "
        "treats as an oversight. It is the category that gives the "
        "classification its practical value -- and the classification fails "
        "entirely if everything is placed in 'must have', which is not "
        "prioritisation at all."),

    mcq("AVERAGE",
        "Two stakeholder groups state requirements that contradict each "
        "other.\n\nWhat should the analyst do?",
        [("Surface the conflict and have it decided by somebody with "
          "authority", True),
         ("Select the requirement from the group that funds the project", False),
         ("Implement both, with a configuration option selecting "
          "between them", False),
         ("Re-elicit from both groups until a consistent statement "
          "emerges", False)],
        "Conflict is normal rather than a sign of poor analysis -- a finance "
        "department wanting controls and a sales team wanting speed are each "
        "right about their own concerns. The analyst's job is making the "
        "conflict visible and getting a decision from somebody empowered to "
        "make it, not resolving it privately by preferring one group."),

    mcq("HARD",
        "Why does the cost of correcting a defect rise sharply the later it "
        "is found?",
        [("Later stages have progressively more work built on the "
          "error", True),
         ("Later stages involve more people, so coordination costs "
          "rise", False),
         ("Defects found late are inherently more complex than those found "
          "early", False),
         ("Testing effort must be repeated from the beginning after any "
          "correction", False)],
        "A misunderstood requirement caught while writing requirements costs "
        "a conversation. Caught in production it costs the code, the design, "
        "the documents, the retesting and whatever harm the wrong behaviour "
        "already did -- roughly an order of magnitude per stage. That ratio "
        "is the entire economic case for reviews and early testing, which "
        "otherwise look like delay."),
]

LESSON_DEV_REQS = lesson(
    MAJOR, MIDDLE,
    "System Requirements Definition and Stakeholder Needs",
    _reqs_quiz,
    lesson_structure(
        "System Requirements Definition and Stakeholder Needs",
        "Every later stage takes this one as its input, which is why an error "
        "here propagates through everything and why the cost of correcting a "
        "defect rises by roughly an order of magnitude per stage. This lesson "
        "covers identifying stakeholders -- including the operations and "
        "compliance groups projects reliably omit -- the elicitation "
        "techniques and what each finds that the others do not, the "
        "functional and non-functional distinction the examination tests "
        "directly, the properties that make a requirement usable, the models "
        "that expose gaps by forcing questions, and the change control "
        "without which small reasonable additions consume a schedule "
        "untraceably.",
        [
            "Explain why requirements errors are disproportionately "
            "expensive",
            "Identify stakeholder groups, including those commonly omitted",
            "Select an elicitation technique for a stated situation",
            "Distinguish functional from non-functional requirements",
            "Explain why non-functional requirements must be quantified",
            "State the properties of a good requirement and apply the "
            "testability check",
            "Choose a model for what needs to be exposed",
            "Explain prioritisation and how scope creep occurs",
        ],
        80,
        _reqs_sections,
        [
            ("Functional requirement",
             "What the system must do. Failure looks like a missing "
             "feature."),
            ("Non-functional requirement",
             "How well it must do it -- performance, availability, security. "
             "A property of the architecture, so costly to discover late."),
            ("Constraint",
             "Something fixed regardless -- a platform, a standard, a "
             "deadline. Shapes the design before it starts."),
            ("Stakeholder",
             "Anyone affected by the system, including operations and "
             "compliance, who are the ones normally omitted."),
            ("Elicitation",
             "Drawing requirements out, since they are rarely written down "
             "waiting to be collected."),
            ("Observation",
             "Watching work as done, which reveals the workarounds people "
             "have stopped noticing."),
            ("Prototyping",
             "Giving people something concrete to react to, since criticism "
             "is easier than specification."),
            ("Testability",
             "The most useful requirement property, because being unable to "
             "state the test proves the requirement says too little."),
            ("Traceability",
             "Following a requirement forward into design, code and tests, "
             "and back to whoever needed it."),
            ("Context diagram",
             "Fixes the system boundary and its external neighbours -- which "
             "is what settles scope."),
            ("MoSCoW",
             "Must, should, could, won't. The last category records an "
             "exclusion as a decision."),
            ("Scope creep",
             "Small additions absorbed without impact assessment, consuming "
             "the schedule with no record of where."),
        ],
        "Requirements definition constrains every later stage, and a defect "
        "found in production costs the code, the design, the documents, the "
        "retesting and the damage already done -- roughly an order of "
        "magnitude more per stage, which is the whole economic argument for "
        "reviews and prototypes that look like delay. Requirements come from "
        "stakeholders, and the ones omitted are consistently OPERATIONS and "
        "compliance, whose absence produces a system that meets every stated "
        "requirement and costs more to run for years. Elicitation techniques "
        "each find something the others miss, with observation catching the "
        "workarounds people no longer notice and prototyping working because "
        "criticising something concrete is easier than specifying something "
        "abstract. The central distinction is FUNCTIONAL against "
        "NON-FUNCTIONAL: what it does against how well, with the second "
        "riskier because performance, availability and security are "
        "properties of the architecture rather than features that can be "
        "added -- and useless unless quantified, since 'fast' cannot be "
        "tested. A good requirement is unambiguous, testable, complete, "
        "consistent, traceable and necessary, and testability is the "
        "practical check because it catches ambiguity as a side effect. "
        "Models earn their cost through the questions drawing them forces, "
        "and the context diagram in particular settles scope. Finally, "
        "priorities come from the business and changes are assessed before "
        "acceptance -- because each small unassessed addition seems "
        "reasonable and collectively they consume the schedule invisibly.",
        exam_notes=[
            desc(
                "Items describe a project outcome and ask which stage failed, "
                "or classify a requirement."
            ),
            ul([
                "Classifying a requirement as functional or non-functional.",
                "Identifying which stage a described failure belongs to.",
                "Choosing an elicitation technique for a situation.",
                "Explaining why a requirement is not testable.",
                "Identifying scope creep from a description.",
                "Explaining the cost curve for defect correction.",
                "Naming the omitted stakeholder group.",
            ]),
            desc(
                "When a system 'works but is unusable', the failure is nearly "
                "always a non-functional requirement that was never "
                "quantified. That single pattern accounts for a large share "
                "of the items in this lesson, and it places the fault at the "
                "requirements stage rather than at construction."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: System architecture design
# ==========================================================================

_arch_sections = [
    ("Deciding the Shape Before the Detail", [
        desc(
            "System architecture design takes the requirements and decides "
            "the overall structure: what components exist, what each is "
            "responsible for, and which are hardware and which are software."
        ),
        image(fig("development-lifecycle")),
        desc(
            "It is a small number of decisions with disproportionate "
            "consequences, because everything afterwards is built inside "
            "them. Architecture is precisely the set of decisions that are "
            "expensive to reverse later, which is a more useful definition "
            "than any list of diagram types."
        ),
        table(
            ["Decided here", "Consequence if wrong"],
            [["How the system is divided into components",
              "Every change touches several of them"],
             ["Which functions are hardware and which software",
              "A rebuild rather than a rewrite"],
             ["How components communicate",
              "Performance and coupling both suffer"],
             ["Where data lives", "Integration difficulties throughout"],
             ["How it scales and survives failure",
              "Non-functional requirements unmeetable"]],
            caption="Five architectural decisions and their reach.",
            footer="Every row's consequence is structural rather than local, "
                   "which is what distinguishes architecture from design. A "
                   "poor detailed design costs one module; a poor "
                   "architecture costs the project."),
    ]),

    ("Allocating Between Hardware and Software", [
        desc(
            "The syllabus places this decision at the system stage precisely "
            "because it must be settled before either can be specified."
        ),
        compare_grid(
            "IMPLEMENTING A FUNCTION IN HARDWARE OR SOFTWARE",
            "The same function, two realisations.",
            [("Hardware",
              ["Faster for the specific task",
               "Lower power for the same work",
               "Fixed once manufactured",
               "Expensive to develop, cheap per unit at volume"]),
             ("Software",
              ["Slower for the same task",
               "Changeable after deployment",
               "Cheap to develop, and to correct",
               "Runs on general-purpose hardware"])]),
        desc(
            "The deciding question is usually whether the function will need "
            "to CHANGE. A stable, performance-critical function suits "
            "hardware; anything expected to evolve belongs in software, "
            "because correcting hardware after deployment means recalling or "
            "replacing it."
        ),
        desc(
            "Firmware occupies the middle position, being software stored in "
            "the device and updatable in place -- which is why so much of "
            "what was once hardware is now firmware, and why a device's "
            "update mechanism has become a security concern in its own "
            "right."
        ),
    ]),

    ("Architectural Styles", [
        desc(
            "A handful of recurring arrangements answer most problems, and "
            "the syllabus expects them with their trade-offs."
        ),
        image(fig("coupling-cohesion")),
        content_tabs(
            "FOUR ARCHITECTURAL STYLES",
            "What each is good at, and what each costs.",
            [("Layered",
              "each layer uses the one below",
              "Presentation, logic and data separated so each can change "
              "independently. Easy to understand and to divide between teams. "
              "A request crosses every layer, which costs performance and is "
              "usually worth it."),
             ("Client-server",
              "requests and responses",
              "One party asks, another provides. Central management and "
              "control, with the server as a limit and a single point of "
              "failure unless it is pooled."),
             ("Service-oriented and microservices",
              "independently deployable pieces",
              "Each service owns its area and is deployed separately, so "
              "teams work independently. The cost is that everything becomes "
              "a network call, with the latency and partial failure that "
              "implies."),
             ("Event-driven",
              "components react to what happened",
              "Producers emit events and consumers react, so neither knows "
              "the other. Extremely loose coupling, and correspondingly hard "
              "to trace what caused what.")]),
        desc(
            "None is correct in general. The examinable judgement is that "
            "each buys a property -- independence, manageability, "
            "scalability -- and pays in complexity somewhere else, so the "
            "question is always which property this system's requirements "
            "actually demand."
        ),
    ]),

    ("Designing for the Non-Functional Requirements", [
        desc(
            "The previous lesson said non-functional requirements are "
            "architectural properties. This is the stage at which that "
            "becomes concrete."
        ),
        table(
            ["Requirement", "Architectural response"],
            [["Availability", "Redundancy, and no single point of failure"],
             ["Performance", "Caching, and minimising round trips"],
             ["Scalability", "Statelessness, so instances can be added"],
             ["Security", "Segmentation, and controls at each boundary"],
             ["Maintainability", "Low coupling, and clear responsibilities"]],
            caption="Five requirements and the structures that deliver them.",
            footer="Each response constrains the others. Redundancy "
                   "complicates consistency, caching complicates freshness, "
                   "segmentation complicates communication -- so architecture "
                   "is a negotiation among these rather than a checklist."),
        desc(
            "This is why the requirements stage matters so much to this one. "
            "An architecture can be designed to meet stated figures; it "
            "cannot be designed to meet figures nobody stated, and "
            "discovering them afterwards means revisiting the decisions "
            "everything was built on."
        ),
    ]),

    ("Interfaces", [
        desc(
            "Once a system is divided, the divisions become interfaces -- and "
            "interfaces are where integration problems come from."
        ),
        ul([
            "An interface specifies what one component may ask of another, "
            "and what it will get back.",
            "It must state the exceptional cases too, since 'what happens "
            "when this fails' is the part omitted and the part that "
            "matters.",
            "Once published, changing it breaks everything that uses it -- so "
            "interface stability is worth more than interface elegance.",
            "Interfaces to external parties are the least controllable and "
            "should be isolated behind something the project does control.",
        ]),
        desc(
            "That last point is a design pattern worth stating plainly: "
            "wrapping an external interface in an internal one means a change "
            "outside the project's control affects one component rather than "
            "many. It costs a layer of indirection and buys containment of a "
            "risk nobody can manage otherwise."
        ),
    ]),

    ("Build, Buy or Compose", [
        desc(
            "Not every component is written, and the syllabus expects the "
            "choice to be reasoned rather than assumed."
        ),
        table(
            ["Option", "Suits", "Costs"],
            [["Build", "Something distinctive to the organisation",
              "Development, and maintenance forever"],
             ["Buy a package", "A standard, well-understood need",
              "Fitting the business to the product"],
             ["Use a service", "Capacity and capability without ownership",
              "Dependence on a supplier's decisions"],
             ["Compose from components", "Common functions within a build",
              "Licence obligations, and inherited vulnerabilities"]],
            caption="Four options and what each really costs.",
            footer="The rule of thumb is to build what DIFFERENTIATES the "
                   "organisation and buy what does not. Writing a payroll "
                   "system spends distinctive effort on something every "
                   "competitor also has."),
        desc(
            "Fitting the business to a package is treated as a cost above, "
            "and it is frequently a benefit. A packaged process reflecting "
            "how the industry generally works may be better than the process "
            "the organisation accumulated -- so the question is whether the "
            "difference is a competitive advantage or merely a habit."
        ),
    ]),

    ("Recording the Architecture", [
        desc(
            "An architecture that lives in one person's head is not an "
            "architecture, and what gets written down has to serve several "
            "audiences."
        ),
        ol([
            "Record the components and what each is responsible for.",
            "Record the interfaces between them, including failure "
            "behaviour.",
            "Record how the architecture meets each non-functional "
            "requirement, since that is what will be questioned.",
            "Record the DECISIONS taken, with the alternatives considered and "
            "why they were rejected.",
            "Record what the architecture assumes, since assumptions are what "
            "quietly stop being true.",
        ]),
        desc(
            "Step four is the one most often skipped and most valuable later. "
            "Somebody two years from now will propose the rejected "
            "alternative, and without the record the discussion is held again "
            "from the beginning -- or the change is made without knowing why "
            "it was avoided."
        ),
    ]),

    ("Dividing the System Well", [
        desc(
            "Whatever style is chosen, the components have to be drawn "
            "somewhere, and two measures decide whether the division was a "
            "good one."
        ),
        image(fig("coupling-cohesion")),
        desc(
            "COUPLING is how much components depend on one another, and it "
            "should be LOW: a change in one should not force changes in "
            "several others. COHESION is how well everything inside one "
            "component belongs together, and it should be HIGH: a component "
            "whose purpose can be named in a phrase is one somebody can "
            "reason about."
        ),
        desc(
            "The two move together, which is what makes the pairing useful "
            "rather than two separate goals. Dividing a system by PURPOSE "
            "raises cohesion and usually lowers coupling at the same time, "
            "because things that serve one purpose tend to talk to each other "
            "and not to everything else."
        ),
        desc(
            "The practical test at this stage is whether a likely change "
            "lands inside one component. If adding a new product type touches "
            "seven components, the division was drawn along the wrong lines "
            "however tidy the diagram looks -- and that is a question worth "
            "asking before construction rather than after."
        ),
    ]),

    ("Distributing the System", [
        desc(
            "Where components run is an architectural decision in its own "
            "right, and the syllabus lists the arrangements."
        ),
        table(
            ["Arrangement", "Processing happens", "Suits"],
            [["Centralised", "On one machine, at one site",
              "Simplicity, and workloads that fit"],
             ["Distributed", "Across several machines or sites",
              "Scale, and resilience against one site failing"],
             ["Client-server", "Split between requester and provider",
              "Central control with local presentation"],
             ["Cloud-hosted", "On rented capacity elsewhere",
              "Variable demand, and avoiding owning hardware"]],
            caption="Four arrangements, with what each is chosen for.",
            footer="Distribution is not free. The moment components run on "
                   "separate machines, every call between them can fail "
                   "independently and slowly -- so it is chosen for a reason "
                   "rather than adopted by default."),
        desc(
            "The FALLACY worth naming is assuming a distributed call behaves "
            "like a local one. It can be slow, it can fail while the caller "
            "waits, it can succeed while the reply is lost, and it can "
            "succeed twice. Designs that ignore this work in testing and fail "
            "in production, which is exactly when the network is busiest."
        ),
    ]),

    ("Evaluating an Architecture Before Building It", [
        desc(
            "Architectural decisions are expensive to reverse, so they are "
            "worth examining before construction rather than after."
        ),
        ul([
            "Walk each significant requirement through the architecture and "
            "check it can actually be met -- particularly the non-functional "
            "ones.",
            "Walk each likely CHANGE through it, since a good architecture is "
            "one where expected changes are cheap.",
            "Identify the single points of failure explicitly, and decide "
            "about each rather than discovering them later.",
            "Prototype anything genuinely unknown -- an unfamiliar "
            "technology, an unproven throughput figure -- before the design "
            "depends on it.",
            "Have somebody outside the team review it, since the people who "
            "designed it share its blind spots.",
        ]),
        desc(
            "The second point is the most useful and the least obvious. "
            "Architectures are usually judged against requirements, and they "
            "are LIVED against changes -- so asking what happens when the "
            "product line doubles, or when a second country is added, tests "
            "the thing that will actually be demanded of it."
        ),
    ]),

    ("Migration and Transition", [
        desc(
            "Most systems replace something, and how the change happens is "
            "designed alongside the system itself."
        ),
        content_accordion(
            "FOUR TRANSITION APPROACHES",
            "Each trades risk against cost differently.",
            [("Direct changeover",
              "The old system stops and the new one starts. Cheapest and "
              "riskiest -- there is nothing to fall back to, and any serious "
              "defect is discovered with no alternative running."),
             ("Parallel running",
              "Both systems run on the same work and the results are "
              "compared. Safest, and doubles the operational effort for the "
              "duration -- which people underestimate and then abandon "
              "halfway."),
             ("Phased introduction",
              "The new system takes over one part at a time. Limits the "
              "damage of a failure, and requires the two systems to "
              "interoperate during the transition."),
             ("Pilot",
              "One site or group uses the new system first. Finds real-world "
              "problems on a small population, and the pilot group may not "
              "represent the rest.")]),
        desc(
            "DATA MIGRATION is the part that consumes the schedule. Old data "
            "was captured under different rules, contains values the new "
            "system considers invalid, and has to be cleaned, mapped and "
            "verified -- which is discovered late by every project that "
            "treats it as a task rather than a workstream."
        ),
    ]),

    ("Non-Functional Trade-offs in Practice", [
        desc(
            "The architectural responses to non-functional requirements pull "
            "against one another, and the examination asks about the "
            "tensions."
        ),
        table(
            ["Pursuing", "Costs"],
            [["Availability through redundancy",
              "Consistency between the copies"],
             ["Performance through caching", "Freshness of what is served"],
             ["Security through segmentation",
              "Simplicity of communication"],
             ["Scalability through statelessness",
              "Somewhere else to keep the state"],
             ["Maintainability through indirection",
              "Directness, and often speed"]],
            caption="Five pursuits and what each gives up.",
            footer="Every row is a real decision somebody must make "
                   "deliberately. An architecture claiming all five "
                   "properties at their maximum has not resolved the "
                   "tensions; it has postponed them."),
        desc(
            "This is why architecture cannot be produced from a checklist. "
            "The requirements say which properties matter most for THIS "
            "system, and the architecture is the resolution of those tensions "
            "in that particular direction -- which is also why an "
            "architecture copied from a different system so often "
            "disappoints."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where architecture items are lost."),
        ul([
            "Treating an architectural style as universally better. Each buys "
            "one property and pays in complexity.",
            "Deciding hardware against software on performance alone, when "
            "changeability usually decides it.",
            "Leaving failure behaviour out of an interface specification.",
            "Assuming microservices are simply an improvement, when they "
            "convert local calls into network calls.",
            "Building what does not differentiate the organisation.",
            "Recording the architecture without recording the decisions "
            "behind it.",
            "Expecting to add availability or performance after the structure "
            "is fixed.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A team proposes replacing a layered application with "
            "microservices to improve performance. Evaluate the proposal.\""
        ),
        ol([
            "Establish what microservices provide: independent deployment, "
            "independent scaling, and team autonomy.",
            "Establish what they cost: calls that were local become network "
            "calls, with latency and partial failure.",
            "So for a single request crossing several services, performance "
            "typically gets WORSE, not better.",
            "The proposal has matched a structure to the wrong requirement -- "
            "microservices address deployment and scaling independence, not "
            "raw speed.",
            "If performance is the actual problem, measure where the time "
            "goes first: caching, query optimisation or reducing round trips "
            "address it far more directly.",
        ]),
        desc(
            "Step five generalises to every architecture item. An "
            "architectural change is a large, expensive, structural response, "
            "so establishing that the problem is structural comes first -- "
            "and a performance problem is usually not."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Architecture draws on much of the earlier material."),
        ul([
            "Hardware and software allocation revisits the Computer System "
            "category.",
            "Redundancy for availability is System Configuration.",
            "Statelessness for scaling is the network applications lesson.",
            "Segmentation for security is the Security implementation "
            "lesson.",
            "Buy-against-build is a procurement decision from Corporate "
            "Activities.",
            "Component licences are covered later in this category.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What makes a decision architectural",
              "It is expensive to reverse later",
              "More useful than any list of diagrams, and it explains why "
              "these decisions get the scrutiny they do."),
             ("What decides hardware against software",
              "Whether the function will need to change",
              "Hardware is faster and fixed; correcting it after deployment "
              "means replacing it."),
             ("What microservices actually buy",
              "Independent deployment and scaling",
              "Not speed -- local calls become network calls, so a request "
              "crossing several is usually slower."),
             ("Why non-functional requirements must be known now",
              "They are properties of the structure",
              "An architecture can meet stated figures and cannot be "
              "retrofitted to meet unstated ones."),
             ("The part of an interface most often omitted",
              "What happens when it fails",
              "Which is exactly the part integration discovers."),
             ("What to build and what to buy",
              "Build what differentiates; buy what does not",
              "Writing a payroll system spends distinctive effort on "
              "something every competitor also has.")]),
    ]),
]

_arch_quiz = [
    mcq("HARD",
        "A team proposes replacing a layered application with microservices "
        "to improve response times.\n\nWhat is the likely effect?",
        [("Response times improve, since each service can be scaled "
          "independently to meet demand", False),
         ("Response times worsen, since calls that were local become network "
          "calls", True),
         ("Response times are unchanged, because the same code performs the "
          "same work", False),
         ("Response times improve only if each service is deployed on "
          "separate hardware", False)],
        "Microservices buy independent deployment, independent scaling and "
        "team autonomy, and they pay for it by converting in-process calls "
        "into network calls with latency and partial failure. A request "
        "crossing several services is therefore usually slower. The proposal "
        "matches a structural remedy to a problem that is probably not "
        "structural -- measuring where the time actually goes comes first."),

    mcq("AVERAGE",
        "What most usefully distinguishes an architectural decision from a "
        "detailed design decision?",
        [("Architectural decisions are expensive to reverse later", True),
         ("Architectural decisions are recorded in diagrams rather than "
          "prose", False),
         ("Architectural decisions are made by senior staff rather than "
          "developers", False),
         ("Architectural decisions concern hardware while design concerns "
          "software", False)],
        "The reach of the consequence is what matters: a poor detailed design "
        "costs one module and a poor architecture costs the project, because "
        "everything afterwards is built inside those decisions. That "
        "definition also explains why they receive scrutiny out of proportion "
        "to how long they take, and it is more useful than any list of "
        "artefacts."),

    mcq("HARD",
        "A function is performance-critical and is expected to change as "
        "regulations evolve.\n\nShould it be implemented in hardware or "
        "software?",
        [("Software, because changeability outweighs the performance "
          "gain", True),
         ("Hardware, because performance-critical functions always belong "
          "there", False),
         ("Hardware, with the regulatory parameters supplied as "
          "configuration", False),
         ("Either, since the two perform equivalently for regulated "
          "calculations", False)],
        "Hardware is faster and fixed once manufactured, so correcting it "
        "after deployment means recalling or replacing devices. A function "
        "expected to change therefore belongs in software despite the "
        "performance cost -- changeability is usually what decides this "
        "allocation rather than speed. Firmware is the middle position, being "
        "software stored in the device and updatable in place."),

    mcq("AVERAGE",
        "Which architectural property most directly supports adding capacity "
        "by adding instances?",
        [("Statelessness, so any instance can serve any request", True),
         ("Layering, so presentation and logic are separated", False),
         ("Redundancy, so no single component is a point of "
          "failure", False),
         ("Event-driven communication, so components do not know each "
          "other", False)],
        "If an instance holds no context between requests, a load balancer "
        "may send any request to any instance and instances can be added or "
        "removed freely -- which is what horizontal scaling requires. "
        "Redundancy supports availability, which is a related but distinct "
        "property: surviving a failure is not the same as absorbing more "
        "load."),

    mcq("HARD",
        "What part of an interface specification is most often omitted, and "
        "most often causes integration problems?",
        [("What happens when the call fails or times out", True),
         ("The data types of the parameters being passed", False),
         ("The identity of the component providing the interface", False),
         ("The performance expected of each operation", False)],
        "Parameters and types get specified because they are needed to write "
        "the call at all. Failure behaviour -- timeouts, retries, partial "
        "results, what the caller should do -- is what nobody writes down and "
        "what integration then discovers, at the point where two teams "
        "each assumed the other was handling it."),

    mcq("AVERAGE",
        "Under the usual rule of thumb, what should an organisation build "
        "rather than buy?",
        [("Whatever differentiates it from its competitors", True),
         ("Whatever no packaged product currently covers well", False),
         ("Whatever handles the organisation's most sensitive data", False),
         ("Whatever its development team has the skills to produce", False)],
        "Build effort is finite and maintenance lasts forever, so it belongs "
        "where it creates advantage. Writing a payroll system spends "
        "distinctive effort reproducing something every competitor also has, "
        "while buying it frees that effort for the work only this "
        "organisation needs -- which is the reasoning behind the rule rather "
        "than the rule itself."),

    mcq("HARD",
        "Why should an interface to an external party be wrapped in an "
        "internal one?",
        [("A change outside the project's control then affects one component "
          "rather than many", True),
         ("It allows the external interface to be tested without the external "
          "party's involvement", False),
         ("It permits the external party's data formats to be stored "
          "unchanged", False),
         ("It removes the need to specify the external interface's failure "
          "behaviour", False)],
        "An external interface can change on somebody else's schedule for "
        "somebody else's reasons, which is a risk the project cannot manage. "
        "Isolating it behind an interface the project does control means such "
        "a change is absorbed in one place. It costs a layer of indirection "
        "and buys containment of an otherwise unmanageable dependency."),

    mcq("AVERAGE",
        "In a layered architecture, what is the cost of the arrangement?",
        [("A request must cross every layer, which costs performance", True),
         ("Layers cannot be developed by separate teams "
          "simultaneously", False),
         ("Changing one layer requires changes in every other layer", False),
         ("Data must be duplicated at each layer to remain "
          "accessible", False)],
        "Separation of presentation, logic and data means each can change "
        "independently and teams can divide the work -- and every request "
        "passes through the whole stack, which is a real cost usually worth "
        "paying. Requiring changes to propagate across layers would mean the "
        "layering had failed, since avoiding exactly that is its purpose."),

    mcq("HARD",
        "Why should an architecture document record the alternatives that "
        "were rejected?",
        [("Otherwise the same discussion is repeated later without the "
          "original reasoning", True),
         ("Auditors require evidence that alternatives were formally "
          "evaluated", False),
         ("Rejected alternatives may become viable as technology "
          "changes", False),
         ("It demonstrates that the architecture was designed rather than "
          "assumed", False)],
        "Somebody two years from now will propose the rejected option, and "
        "without the record either the discussion is held again from nothing "
        "or the change is made without knowing what it was avoiding. "
        "Recording decisions with their alternatives is the most valuable and "
        "most often skipped part of architecture documentation."),

    mcq("AVERAGE",
        "An event-driven architecture achieves very loose coupling.\n\n"
        "What is the corresponding difficulty?",
        [("Tracing what caused what becomes hard", True),
         ("Components must be deployed together to remain "
          "synchronised", False),
         ("Events cannot carry enough data for consumers to act on", False),
         ("Producers must know which consumers are listening", False)],
        "Producers emit events without knowing who reacts, which is precisely "
        "what makes the coupling loose -- and it means no single place "
        "describes the flow of a business process, so following a cause "
        "through its effects requires reconstructing it from several "
        "components' behaviour. Producers knowing their consumers would "
        "eliminate the property the style exists for."),
]

LESSON_DEV_ARCH = lesson(
    MAJOR, MIDDLE,
    "Systems Architecture Design and Hardware/Software Allocation",
    _arch_quiz,
    lesson_structure(
        "Systems Architecture Design and Hardware/Software Allocation",
        "Architecture is the set of decisions that are expensive to reverse, "
        "which is a more useful definition than any list of diagrams and "
        "explains why a small number of choices receive so much scrutiny. "
        "This lesson covers dividing a system into components, allocating "
        "functions between hardware and software -- where changeability "
        "rather than speed usually decides -- the recurring architectural "
        "styles and what each buys and costs, designing for the "
        "non-functional requirements that cannot be retrofitted, specifying "
        "interfaces including the failure behaviour everybody omits, the "
        "build-or-buy decision, and recording the DECISIONS rather than "
        "merely the result.",
        [
            "Explain what distinguishes an architectural decision",
            "Allocate a function between hardware and software with reasons",
            "Describe the architectural styles and their trade-offs",
            "Map non-functional requirements onto architectural responses",
            "Specify an interface, including its failure behaviour",
            "Reason about build, buy, service and component options",
            "Explain why external interfaces are isolated",
            "Explain what architecture documentation must record",
        ],
        80,
        _arch_sections,
        [
            ("Architectural decision",
             "One that is expensive to reverse, because everything afterwards "
             "is built inside it."),
            ("Hardware/software allocation",
             "Decided chiefly by whether the function will need to change, "
             "not by speed alone."),
            ("Firmware",
             "Software stored in a device and updatable in place -- the "
             "middle position between the two."),
            ("Layered architecture",
             "Each layer uses the one below. Independent change and team "
             "division, at the cost of crossing every layer."),
            ("Microservices",
             "Independently deployable services. Buys deployment and scaling "
             "independence; converts local calls into network calls."),
            ("Event-driven architecture",
             "Producers emit, consumers react, neither knows the other. Very "
             "loose coupling, and hard to trace causation."),
            ("Statelessness",
             "Holding no context between requests, which is what lets "
             "instances be added freely."),
            ("Interface specification",
             "What may be asked and what comes back -- including failure "
             "behaviour, which is the omitted part."),
            ("External interface isolation",
             "Wrapping a dependency outside the project's control so its "
             "changes affect one component."),
            ("Build against buy",
             "Build what differentiates the organisation; buy what every "
             "competitor also has."),
            ("Architecture decision record",
             "The alternatives considered and why they were rejected -- the "
             "most valuable and most skipped documentation."),
        ],
        "Architecture is the set of decisions expensive to reverse, so a poor "
        "detailed design costs one module and a poor architecture costs the "
        "project. Allocating functions between hardware and software is "
        "settled here, and CHANGEABILITY rather than speed usually decides "
        "it: hardware is faster and fixed, so correcting it after deployment "
        "means replacing it, with firmware occupying the middle. The "
        "recurring styles each buy one property and pay in complexity "
        "elsewhere -- layered separation costs a traversal per request, "
        "microservices buy deployment independence by turning local calls "
        "into network calls, and event-driven architectures buy very loose "
        "coupling at the price of nobody being able to trace what caused "
        "what. Non-functional requirements are met structurally, through "
        "redundancy, caching, statelessness and segmentation, and these "
        "constrain one another, so architecture is a negotiation rather than "
        "a checklist -- and none of it can be retrofitted to figures nobody "
        "stated. Interfaces are where integration problems come from, and the "
        "part omitted is always failure behaviour; external interfaces are "
        "isolated behind internal ones so that somebody else's change lands "
        "in one place. Components are built where they differentiate the "
        "organisation and bought where they do not. And the documentation "
        "that matters records the DECISIONS with their rejected alternatives, "
        "or the same discussion is held again two years later with nothing to "
        "go on.",
        exam_notes=[
            desc(
                "Items propose an architectural change and ask whether it "
                "addresses the stated problem. Usually it does not."
            ),
            ul([
                "Evaluating a proposed change against the actual problem.",
                "Allocating a function to hardware or software.",
                "Naming what a style buys and what it costs.",
                "Mapping a non-functional requirement to a structure.",
                "Identifying what an interface specification omits.",
                "Reasoning about build against buy.",
                "Explaining why decisions are recorded with alternatives.",
            ]),
            desc(
                "Before accepting an architectural remedy, ask whether the "
                "problem is structural. Performance problems usually are not, "
                "and an architectural change is the largest and most "
                "expensive response available -- which is exactly why it is "
                "the attractive distractor."
            ),
        ],
    ))

LESSONS = [LESSON_DEV_REQS, LESSON_DEV_ARCH]

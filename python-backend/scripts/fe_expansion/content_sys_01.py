"""System Strategy, lessons 1 to 3.

Information systems strategy and enterprise architecture, business process
analysis and modelling, and solution business.

The strategy lesson establishes the direction of reasoning the whole category
depends on -- business first, technology last -- since the commonest failure
it describes is a technology decision taken without reference to what it
serves.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "System Strategy"
MIDDLE = "System Strategy"

# ==========================================================================
# Lesson 1: Information systems strategy
# ==========================================================================

_strat_sections = [
    ("Technology in Service of Something", [
        desc(
            "An information systems strategy decides what technology the "
            "organisation will have and why, and its defining property is "
            "that it derives from the business strategy rather than existing "
            "alongside it."
        ),
        image(fig("enterprise-architecture")),
        desc(
            "The layers are read DOWNWARD. What the organisation does "
            "determines what information it needs, which determines what "
            "systems support that, which determines what technology they run "
            "on -- and a decision taken at the bottom without reference to "
            "the top is the commonest architectural failure there is."
        ),
        table(
            ["Layer", "Answers"],
            [["Business architecture",
              "What the organisation does, and how"],
             ["Data architecture", "What information that requires"],
             ["Application architecture",
              "What systems hold and process it"],
             ["Technology architecture", "What those systems run on"]],
            caption="Four layers of enterprise architecture.",
            footer="Each layer exists to serve the one above it. The failure "
                   "is invisible while the business is stable and becomes "
                   "expensive the moment it changes, which is why it is "
                   "discovered late."),
    ]),

    ("Alignment", [
        desc(
            "The syllabus's central concern is whether technology investment "
            "serves the organisation's objectives, which is harder to achieve "
            "than to state."
        ),
        ul([
            "Every significant system should be traceable to a business "
            "objective it supports.",
            "Investment should be prioritised by contribution to those "
            "objectives rather than by which department asked loudest.",
            "The strategy must be revisited as the business changes, since "
            "alignment is a moving target rather than an achievement.",
            "Business people must be involved in the decisions, since "
            "alignment cannot be established by a technology function on its "
            "own.",
        ]),
        desc(
            "MISALIGNMENT is rarely deliberate. It accumulates through "
            "individually reasonable decisions -- a system bought for one "
            "department, a technology chosen because the team knew it, an "
            "initiative continued past the point its justification "
            "evaporated -- and the result is an estate serving the "
            "organisation's history rather than its intentions."
        ),
    ]),

    ("Enterprise Architecture", [
        desc(
            "Enterprise architecture is the discipline of describing the "
            "organisation's systems as a whole and planning how they change."
        ),
        table(
            ["Provides", "Which prevents"],
            [["A description of what exists",
              "Decisions taken without knowing what is affected"],
             ["A target description of what is wanted",
              "Changes that individually make sense and collectively do "
              "not"],
             ["Principles constraining decisions",
              "Each project choosing differently for good local reasons"],
             ["A plan for moving from one to the other",
              "A target nobody knows how to reach"]],
            caption="Four things enterprise architecture provides.",
            footer="The third row is what architecture actually does day to "
                   "day. A principle that data has one authoritative source "
                   "constrains a hundred decisions nobody will consult an "
                   "architect about."),
        desc(
            "Its characteristic failure is producing an elaborate description "
            "nobody uses. An architecture is useful when it constrains and "
            "informs real decisions, and a model maintained for its own sake "
            "consumes effort and changes nothing."
        ),
    ]),

    ("Current State and Target State", [
        desc(
            "Planning any change requires knowing where things are and where "
            "they should be, and the gap between them is the work."
        ),
        image(fig("as-is-to-be")),
        desc(
            "The AS-IS description is established by looking rather than by "
            "asking, because the official description of how things work and "
            "how they actually work diverge -- which is the same observation "
            "the requirements lesson makes about workarounds."
        ),
        desc(
            "The TO-BE description is designed from the business objective. "
            "It is not the current state with improvements; it is what would "
            "serve the objective, which may differ considerably from anything "
            "that currently exists."
        ),
        desc(
            "The GAP between them is what has to be planned, funded and "
            "sequenced -- and it is normally larger than anybody expects, "
            "which is why the transition is a programme rather than a "
            "project."
        ),
    ]),

    ("Standardisation and Consolidation", [
        desc(
            "Organisations accumulate systems, and reducing the variety is a "
            "recurring strategic theme."
        ),
        compare_grid(
            "WHAT STANDARDISING BUYS AND COSTS",
            "Uniformity against fit.",
            [("Buys",
              ["Fewer things to support, patch and understand",
               "Skills transferable between areas",
               "Better purchasing terms through volume",
               "Integration that is possible rather than bespoke"]),
             ("Costs",
              ["A standard fitting most needs fits none perfectly",
               "Local optimisations are given up",
               "A single supplier dependency where one is chosen",
               "Migration effort for whatever is displaced"])]),
        desc(
            "The judgement is where variety adds VALUE rather than merely "
            "existing. Two departments using different systems because their "
            "work genuinely differs is variety worth keeping; two using "
            "different systems because they bought separately is variety "
            "costing money for nothing."
        ),
    ]),

    ("Technology Trends and Strategy", [
        desc(
            "New technologies appear continuously, and a strategy has to "
            "decide which of them matter to this organisation."
        ),
        table(
            ["Question", "Why it comes first"],
            [["What business problem would this address",
              "A technology with no problem attached is a solution "
              "looking for one"],
             ["How mature is it",
              "Early adoption buys advantage and pays in instability"],
             ["What would adopting it commit us to",
              "Some choices are extremely difficult to reverse"],
             ["Do we have or can we obtain the skills",
              "A technology nobody can operate is not available to us"],
             ["What happens if we wait",
              "Sometimes nothing, and sometimes the position closes"]],
            caption="Five questions before adopting anything new.",
            footer="The first question rules out most candidates. A "
                   "technology is adopted because it addresses something the "
                   "organisation needs, and adopting it to be current is how "
                   "an estate accumulates things nobody can explain."),
        desc(
            "The syllabus expects the recurring themes rather than any "
            "particular technology: increasing use of external services "
            "rather than owned infrastructure, data being treated as an asset "
            "in its own right, automation of work previously done by people, "
            "and connectivity extending to devices that were never "
            "networked."
        ),
    ]),

    ("Data as a Strategic Asset", [
        desc(
            "The data layer sits directly beneath the business layer for a "
            "reason: what an organisation knows is increasingly what "
            "distinguishes it."
        ),
        ul([
            "Data outlives the systems holding it, which is why the data "
            "architecture is more stable than the application one.",
            "The same fact held in several systems will eventually disagree "
            "with itself, which is why a single authoritative source is an "
            "architectural principle.",
            "Data accumulated without a purpose is cost and legal exposure "
            "rather than an asset.",
            "Its value frequently comes from combining sources, which "
            "requires them to be combinable -- a design decision taken long "
            "beforehand.",
        ]),
        desc(
            "The last point is what makes data architecture strategic rather "
            "than technical. Whether two systems' data can be combined "
            "usefully is decided when they are designed, and discovering "
            "years later that it cannot is not a problem anybody can solve "
            "quickly."
        ),
    ]),

    ("Strategy and the Organisation", [
        desc(
            "A strategy affects how the technology function is arranged and "
            "who decides what, which is part of the strategy rather than a "
            "consequence of it."
        ),
        compare_grid(
            "CENTRALISED AGAINST DEVOLVED TECHNOLOGY DECISIONS",
            "Two arrangements with opposite failure modes.",
            [("Centralised",
              ["Consistent decisions and shared standards",
               "Purchasing power, and skills concentrated",
               "Slower to respond to any particular unit",
               "Fails by serving nobody's actual needs well"]),
             ("Devolved",
              ["Each unit gets what it needs, quickly",
               "Decisions made close to the work",
               "Duplication, incompatibility and no leverage",
               "Fails by producing an estate nobody can integrate"])]),
        desc(
            "Most organisations sit between the two, which is a deliberate "
            "position rather than a failure to choose: standards and shared "
            "infrastructure centrally, application choices locally within "
            "them. What matters is that the boundary is stated, since an "
            "unstated one is contested continuously."
        ),
    ]),

    ("Measuring Whether the Strategy Works", [
        desc(
            "A strategy nobody assesses is a document, and the assessment "
            "has to be against something stated in advance."
        ),
        ol([
            "State what the strategy is meant to achieve, in terms that could "
            "be observed.",
            "Establish the current position on each, before the strategy is "
            "executed.",
            "Review at defined intervals rather than when somebody "
            "remembers.",
            "Distinguish 'we did what we planned' from 'it produced what we "
            "expected' -- these are different findings.",
            "Change the strategy when the evidence says so, rather than "
            "defending it.",
        ]),
        desc(
            "Step four is where reviews become useful. A programme delivering "
            "everything it promised and producing none of the expected "
            "benefit has succeeded as a project and failed as a strategy, and "
            "only asking both questions separately reveals that."
        ),
    ]),

    ("Legacy and the Estate", [
        desc(
            "A strategy inherits whatever the organisation already has, which "
            "constrains it more than any technology choice does."
        ),
        table(
            ["Inherited", "Constrains by"],
            [["Systems that work and cannot be changed",
              "Fixing what new systems must interoperate with"],
             ["Data in formats and structures already chosen",
              "Limiting what can be combined without conversion"],
             ["Skills the organisation actually has",
              "Making some options available and others theoretical"],
             ["Contracts with years to run",
              "Deferring decisions until they expire"],
             ["Processes people know how to perform",
              "Making change a training problem as well as a technical "
              "one"]],
            caption="Five inheritances that bound a strategy.",
            footer="The third row is the constraint most often ignored in "
                   "planning. A technically ideal option requiring skills the "
                   "organisation cannot obtain or retain is not an option, "
                   "however sound the evaluation."),
        desc(
            "A strategy is therefore a route from where the organisation "
            "actually is rather than a description of where it would like to "
            "be. One that ignores the estate produces a target nobody can "
            "reach and a plan nobody follows."
        ),
    ]),

    ("Communicating a Strategy", [
        desc(
            "A strategy affects decisions made by people who will never read "
            "it, which determines how it must be expressed."
        ),
        ul([
            "State the few things that matter, since a document nobody "
            "finishes influences nothing.",
            "Express principles people can apply themselves, rather than "
            "decisions requiring interpretation.",
            "Say what the organisation will NOT do, since that is what "
            "prevents effort going in every direction.",
            "Explain the reasoning, because a rule people understand survives "
            "situations its author did not anticipate.",
            "Repeat it, since the people making decisions change and the "
            "strategy does not announce itself.",
        ]),
        desc(
            "The third point is the one that gives a strategy its force. A "
            "strategy listing only what the organisation will pursue permits "
            "everything, and one stating what is out of scope actually "
            "decides something."
        ),
    ]),

    ("Portfolio and Prioritisation", [
        desc(
            "More initiatives are proposed than can be funded, and choosing "
            "between them is where a strategy becomes operative."
        ),
        ol([
            "Assess each against the objectives the strategy stated, rather "
            "than on its own merits alone.",
            "Assess the capacity to deliver it, since an organisation can "
            "fund more change than it can absorb.",
            "Consider the dependencies, since some initiatives are worthless "
            "until another completes.",
            "Balance the portfolio between keeping things running, improving "
            "them, and doing something new.",
            "Review continuously, since a proposal that was right last year "
            "may not be.",
        ]),
        desc(
            "Step two is the constraint organisations most often exceed. "
            "Approving more change than the business can absorb produces "
            "initiatives that all run slowly, compete for the same people, "
            "and deliver later than any of them would have alone."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where strategy items are lost."),
        ul([
            "Deciding technology without reference to the business it "
            "serves.",
            "Treating alignment as an achievement rather than as something "
            "requiring continuous maintenance.",
            "Producing an architecture description nobody uses to make "
            "decisions.",
            "Documenting the as-is from how the process is supposed to work "
            "rather than how it does.",
            "Designing the to-be as the current state with improvements "
            "rather than from the objective.",
            "Standardising variety that was adding value.",
            "Continuing an initiative after its business justification "
            "disappeared.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A technology function selects a platform on strong technical "
            "grounds. Two years later the business has changed direction and "
            "the platform obstructs it. What was the strategic failure?\""
        ),
        ol([
            "Note what was done well: the platform was evaluated "
            "technically and chosen competently.",
            "Note what was absent: any reference to what the business "
            "intended to do, and to how that might change.",
            "The architecture layers are read downward, so a technology "
            "decision taken without the business layer above it is "
            "unanchored.",
            "The failure is therefore in alignment rather than in the "
            "selection -- the platform answered a question nobody had asked "
            "in business terms.",
            "It was invisible for two years because the business was stable, "
            "which is precisely when misalignment costs nothing and is "
            "therefore not noticed.",
        ]),
        desc(
            "The item works because the technical work was sound. A "
            "well-executed decision at the wrong layer is the characteristic "
            "strategic failure, and it becomes visible only when the layer "
            "above it moves."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Strategy sets the direction the other categories work within."),
        ul([
            "The architecture layers extend the system architecture of "
            "Development Technology upward.",
            "As-is analysis is the requirements elicitation of that "
            "category.",
            "Portfolio selection is the level above project management.",
            "Standardisation constrains the build-or-buy decision.",
            "Alignment is what the governance lesson holds management "
            "accountable for.",
            "Benefits realisation connects to the investment appraisal "
            "lesson.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("How the architecture layers are read",
              "Downward -- business, data, application, technology",
              "A technology decision without the business layer above it is "
              "unanchored."),
             ("Why misalignment is hard to see",
              "It costs nothing while the business is stable",
              "And becomes expensive the moment the business changes."),
             ("How misalignment accumulates",
              "Through individually reasonable decisions",
              "Producing an estate serving the organisation's history rather "
              "than its intentions."),
             ("How the as-is is established",
              "By looking, not by asking",
              "The official process and the actual one diverge, which is what "
              "observation catches."),
             ("What the to-be is designed from",
              "The business objective",
              "Not the current state with improvements, which anchors it to "
              "what already exists."),
             ("When variety is worth keeping",
              "When it reflects work that genuinely differs",
              "Variety from separate purchasing costs money for nothing.")]),
    ]),
]

_strat_quiz = [
    mcq("HARD",
        "A platform chosen on strong technical grounds obstructs the business "
        "two years later after a change of direction.\n\n"
        "What failed?",
        [("Alignment -- the decision was taken without reference to the "
          "business layer above it", True),
         ("The technical evaluation, which should have anticipated the "
          "change of business direction", False),
         ("Change management, since the platform was not adapted as the "
          "business changed", False),
         ("Supplier selection, which tied the organisation to one "
          "platform", False)],
        "The architecture layers are read downward -- business, data, "
        "application, technology -- so a technology decision taken without "
        "the business layer is unanchored however competent the evaluation. "
        "It was invisible for two years because the business was stable, "
        "which is exactly when misalignment costs nothing and is therefore "
        "not noticed."),

    mcq("AVERAGE",
        "In which direction are the enterprise architecture layers read?",
        [("Downward, from business through data and applications to "
          "technology", True),
         ("Upward, since the available technology constrains what "
          "applications are possible at all", False),
         ("Outward from the data layer, which the others depend "
          "on", False),
         ("In no fixed order, since the layers are interdependent", False)],
        "Each layer exists to serve the one above it: what the organisation "
        "does determines what information it needs, which determines what "
        "systems hold it, which determines what they run on. Reading upward "
        "produces decisions justified by what happens to be available rather "
        "than by what the business requires."),

    mcq("HARD",
        "How does misalignment between technology and business objectives "
        "usually arise?",
        [("Through an accumulation of individually reasonable "
          "decisions", True),
         ("Through a deliberate decision to prioritise technical "
          "considerations", False),
         ("Through the technology function operating without a "
          "budget", False),
         ("Through business objectives being stated too "
          "vaguely", False)],
        "A system bought for one department, a technology chosen because the "
        "team knew it, an initiative continued past its justification -- each "
        "is defensible alone, and together they produce an estate serving the "
        "organisation's history rather than its intentions. That is why "
        "alignment requires continuous maintenance rather than being achieved "
        "once."),

    mcq("AVERAGE",
        "How should the current state of a business process be established?",
        [("By observing what actually happens", True),
         ("By reading the documented procedures", False),
         ("By interviewing the process owner", False),
         ("By examining the systems that support it", False)],
        "The official description and the actual practice diverge, because "
        "workarounds accumulate and become invisible to the people using "
        "them. A target state designed from the documented process solves a "
        "problem nobody has, which is why the as-is is established by looking "
        "-- the same reasoning the requirements category applies to "
        "elicitation."),

    mcq("HARD",
        "Enterprise architecture has a characteristic failure as a "
        "discipline.\n\nWhich?",
        [("Producing an elaborate description that no decision actually "
          "uses", True),
         ("Constraining individual projects so tightly that delivery "
          "across the organisation slows", False),
         ("Describing a target state that is technically "
          "unachievable", False),
         ("Requiring more architects than an organisation can "
          "employ", False)],
        "An architecture earns its cost by constraining and informing real "
        "decisions -- a principle that data has one authoritative source "
        "shapes a hundred choices nobody consults an architect about. A model "
        "maintained for its own sake consumes effort and changes nothing, "
        "which is the failure mode the discipline is criticised for."),

    mcq("AVERAGE",
        "What should the target state be designed from?",
        [("The business objective it is meant to serve", True),
         ("The current state, with its known problems corrected", False),
         ("The capabilities of currently available technology", False),
         ("The architectures adopted by comparable organisations", False)],
        "Designing from the current state anchors the result to what already "
        "exists, so the target becomes an improved version of today rather "
        "than what would actually serve the objective. Those can be very "
        "different, and the difference is the point of doing the exercise at "
        "all."),

    mcq("HARD",
        "When is variety between systems worth preserving rather than "
        "standardising?",
        [("When it reflects work that genuinely differs between the "
          "areas", True),
         ("When the migration costs would exceed the savings that "
          "standardising produces", False),
         ("When the systems concerned are approaching end of "
          "life", False),
         ("When the departments concerned prefer their existing "
          "systems", False)],
        "Two departments using different systems because their work genuinely "
        "differs are getting value from the variety; two using different "
        "systems because they bought separately are paying for it and getting "
        "nothing. Migration cost is a real consideration and settles the "
        "timing rather than the principle."),

    mcq("AVERAGE",
        "What does standardisation cost an organisation?",
        [("A standard fitting most needs fits none of them "
          "perfectly", True),
         ("The organisation's ability to negotiate favourable purchasing "
          "terms with suppliers", False),
         ("The capacity to integrate systems with one another", False),
         ("The transferability of skills between different areas", False)],
        "Uniformity buys supportability, transferable skills, purchasing "
        "power and feasible integration, and it pays for them by fitting "
        "everybody approximately rather than anybody exactly. Recognising "
        "that as a real cost rather than resistance is what makes the "
        "decision a judgement rather than a policy."),

    mcq("HARD",
        "Why must an information systems strategy be revisited rather than "
        "set once?",
        [("Alignment is a moving target, since the business it serves "
          "changes", True),
         ("Technology options change considerably faster than strategies "
          "can be written and approved", False),
         ("Strategies lose authority unless they are periodically "
          "reissued", False),
         ("Investment decisions require an annually approved "
          "strategy", False),
         ],
        "A strategy aligned to the business as it was is misaligned to the "
        "business as it becomes, and nothing announces the drift -- the "
        "systems continue working while serving objectives that have moved. "
        "Technology change matters and is the lesser reason; the business "
        "moving is what makes alignment continuous work."),

    mcq("AVERAGE",
        "What does an architectural principle such as 'data has one "
        "authoritative source' actually achieve?",
        [("It constrains many decisions nobody would consult an architect "
          "about", True),
         ("It documents the organisation's current data architecture "
          "accurately and completely", False),
         ("It prevents departments from holding their own "
          "data", False),
         ("It satisfies data governance requirements", False)],
        "Most decisions affecting an architecture are made by people who will "
        "never speak to an architect, so a principle they can apply "
        "themselves shapes far more than any review process could. That is "
        "what enterprise architecture does day to day, as distinct from the "
        "descriptions it also produces."),
]

LESSON_SYS_STRAT = lesson(
    MAJOR, MIDDLE,
    "Information Systems Strategy and Enterprise Architecture",
    _strat_quiz,
    lesson_structure(
        "Information Systems Strategy and Enterprise Architecture",
        "An information systems strategy derives from the business strategy "
        "rather than existing alongside it, which is why the architecture "
        "layers are read DOWNWARD -- business, data, application, technology "
        "-- and why a technically excellent decision taken without the layer "
        "above it is the characteristic strategic failure. This lesson covers "
        "alignment as continuous maintenance rather than an achievement, "
        "enterprise architecture and its own characteristic failure of "
        "producing descriptions nobody uses, the as-is established by "
        "LOOKING and the to-be designed from the objective, and the "
        "standardisation judgement about which variety is actually earning "
        "its cost.",
        [
            "Explain why systems strategy derives from business strategy",
            "State the architecture layers and the direction they are read",
            "Explain how misalignment accumulates and why it is invisible",
            "Describe what enterprise architecture provides and its failure "
            "mode",
            "Establish an as-is state correctly",
            "Design a to-be state from the objective rather than from today",
            "Judge when variety between systems is worth preserving",
            "Explain why strategy is revisited rather than set once",
        ],
        75,
        _strat_sections,
        [
            ("Enterprise architecture layers",
             "Business, data, application, technology -- read downward, each "
             "serving the one above."),
            ("Alignment",
             "Technology investment serving business objectives. A moving "
             "target requiring continuous maintenance."),
            ("Architectural principle",
             "A constraint applied by people who will never consult an "
             "architect. What architecture does day to day."),
            ("As-is state",
             "Established by observing what actually happens, since the "
             "official process and the real one diverge."),
            ("To-be state",
             "Designed from the business objective rather than as the current "
             "state improved."),
            ("The gap",
             "What must be planned, funded and sequenced -- normally a "
             "programme rather than a project."),
            ("Standardisation",
             "Buys supportability, skills and purchasing power; costs fit, "
             "since a standard suiting most suits none exactly."),
        ],
        "An information systems strategy derives from the business rather "
        "than sitting beside it, which is why enterprise architecture's "
        "layers are read DOWNWARD: what the organisation does decides what "
        "information it needs, which decides what systems hold it, which "
        "decides what they run on. A technology decision taken without the "
        "business layer above it is unanchored however competent the "
        "evaluation -- and invisible while the business is stable, which is "
        "why it surfaces two years later as an obstruction. Misalignment "
        "accumulates through individually reasonable decisions and produces "
        "an estate serving the organisation's history rather than its "
        "intentions, so ALIGNMENT is continuous maintenance rather than an "
        "achievement. Enterprise architecture provides descriptions of what "
        "exists and what is wanted, a plan between them, and -- most usefully "
        "day to day -- PRINCIPLES that constrain the many decisions nobody "
        "consults an architect about; its own failure mode is an elaborate "
        "model no decision uses. The AS-IS is established by looking rather "
        "than asking, since documented and actual practice diverge, and the "
        "TO-BE is designed from the objective rather than as today improved. "
        "And standardisation is judged by whether the variety it removes was "
        "earning its cost.",
        exam_notes=[
            desc(
                "Items describe a decision that proved wrong later and ask "
                "which strategic step was missing."
            ),
            ul([
                "Diagnosing a technology decision taken without business "
                "reference.",
                "Stating the direction the architecture layers are read.",
                "Explaining how misalignment accumulates.",
                "Establishing an as-is state correctly.",
                "Explaining what the to-be is designed from.",
                "Judging a standardisation proposal.",
                "Explaining what an architectural principle achieves.",
            ]),
            desc(
                "When a competent technical decision produces a strategic "
                "problem, look for the layer above it. These items are "
                "constructed so the technical work is sound, and the failure "
                "is that nobody asked what business question it was "
                "answering."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Business process analysis
# ==========================================================================

_bpa_sections = [
    ("Understanding How Work Happens", [
        desc(
            "Before a system can support a process, somebody must understand "
            "the process -- which is harder than it sounds, because nobody "
            "sees all of it."
        ),
        image(fig("process-modelling")),
        desc(
            "Each participant knows their own steps and what they receive and "
            "hand on. The whole process, including the waiting between steps "
            "and the work that exists only to correct earlier work, is "
            "visible to nobody until somebody maps it."
        ),
        table(
            ["Mapping reveals", "Which nobody sees because"],
            [["Waiting between steps",
              "Each participant sees only their own activity"],
             ["Duplicated effort",
              "The duplication is in two different departments"],
             ["Steps adding nothing",
              "They were needed once, and the reason has gone"],
             ["Rework loops",
              "They are treated as normal rather than as failure"],
             ["Undefined decisions",
              "Everybody assumes somebody applies a rule"]],
            caption="Five things a process map exposes.",
            footer="WAITING is usually the largest component of elapsed time "
                   "and the smallest component of effort, which is why "
                   "processes improve dramatically when the queues between "
                   "steps are attacked rather than the steps themselves."),
    ]),

    ("Mapping a Process", [
        desc(
            "Process analysis follows a sequence, and each step depends on "
            "the previous one being done honestly."
        ),
        ol([
            "Define the boundaries: where the process starts, where it ends, "
            "and what triggers it.",
            "Identify the actors, including those outside the organisation.",
            "Map the steps in the order they REALLY happen, including the "
            "informal ones.",
            "Identify the decision points, and what determines each.",
            "Measure: time, cost and volume at each step.",
            "Analyse: where the time goes, what is duplicated, what adds "
            "nothing.",
        ]),
        desc(
            "Step five is what makes step six possible. Without measurement, "
            "improvement is opinion -- and the step everybody complains about "
            "is frequently not the one consuming the time, which only "
            "measuring distinguishes."
        ),
    ]),

    ("Notation", [
        desc(
            "Process models use notation so that everybody reads them the "
            "same way, and the syllabus expects the common elements."
        ),
        table(
            ["Element", "Represents"],
            [["Activity", "Something being done"],
             ["Decision", "A point where the path branches on a condition"],
             ["Flow", "The sequence, from one element to the next"],
             ["Start and end events",
              "What triggers the process and what concludes it"],
             ["Swimlane", "Who performs each activity"],
             ["Parallel paths", "Work that happens simultaneously"]],
            caption="Six elements of a process model.",
            footer="SWIMLANES do more analytical work than anything else in "
                   "the notation. Every crossing between lanes is a handover "
                   "-- a delay, a possible misunderstanding, and a point "
                   "where responsibility can be dropped."),
        desc(
            "Counting the lane crossings is a useful analysis in itself. A "
            "process crossing between departments eight times has eight "
            "queues and eight opportunities for something to be lost, and "
            "reducing the crossings frequently improves it more than "
            "optimising any individual step."
        ),
    ]),

    ("Analysing for Improvement", [
        desc(
            "A mapped and measured process can be examined systematically "
            "rather than by intuition."
        ),
        ul([
            "ELIMINATE steps that add nothing -- checks nobody uses, "
            "approvals nobody reads.",
            "SIMPLIFY steps that are more complicated than the outcome "
            "requires.",
            "COMBINE steps performed separately for historical reasons.",
            "AUTOMATE what is repetitive and rule-based, AFTER the previous "
            "three.",
            "REORDER so that work is not performed on cases that will be "
            "rejected later.",
        ]),
        desc(
            "The ordering matters. Automating a wasteful process makes waste "
            "happen faster and entrenches it in software, which is "
            "considerably harder to remove than a habit -- so elimination and "
            "simplification come first, always."
        ),
        desc(
            "REORDERING is the least obvious and frequently the most "
            "valuable. A process validating eligibility at the end has done "
            "all its work on cases that were never eligible, and moving that "
            "check to the front eliminates the effort entirely rather than "
            "speeding it up."
        ),
    ]),

    ("Measuring a Process", [
        desc(
            "The measurements chosen determine what can be improved and what "
            "remains invisible."
        ),
        table(
            ["Measure", "Reveals"],
            [["Cycle time", "How long a case takes end to end"],
             ["Processing time",
              "How much actual work a case requires"],
             ["The difference between them", "How much time is WAITING"],
             ["Volume by step", "Where the load actually is"],
             ["First-time-right rate", "How much rework the process "
                                       "contains"]],
            caption="Five process measurements.",
            footer="The third row is the analysis that changes decisions. A "
                   "process taking two weeks of elapsed time and four hours "
                   "of work has thirteen and a half days of queue, and "
                   "attacking the four hours addresses almost none of it."),
        desc(
            "FIRST-TIME-RIGHT is the measure that exposes rework. Work "
            "returned to be corrected is usually invisible in the process "
            "documentation, since it was never designed in -- and it "
            "frequently accounts for a large share of the total effort."
        ),
    ]),

    ("Roles in Process Work", [
        desc(
            "Process improvement involves several parties, and confusing "
            "their roles produces analysis nobody acts on."
        ),
        table(
            ["Role", "Provides"],
            [["Process owner",
              "Accountability for the process end to end, across "
              "departments"],
             ["Participants", "What actually happens, including the "
                              "informal"],
             ["Analyst", "The mapping, the measurement and the analysis"],
             ["Sponsor", "Authority to change how departments work"],
             ["Customer of the process",
              "Whether the output is what they needed"]],
            caption="Five roles in process work.",
            footer="The PROCESS OWNER is the role organisations most often "
                   "lack. A process crossing four departments has four "
                   "managers each accountable for their part and nobody "
                   "accountable for the whole -- which is why the gaps "
                   "between them are nobody's problem."),
        desc(
            "The sponsor matters because process improvement changes how "
            "departments work, and no analyst can require that. An analysis "
            "with no sponsor produces a report describing what should change "
            "and nothing that does."
        ),
    ]),

    ("Standardising Processes", [
        desc(
            "The same process performed differently in different places is a "
            "recurring finding, and whether that matters depends on why."
        ),
        compare_grid(
            "VARIATION WORTH KEEPING AND VARIATION TO REMOVE",
            "The same symptom, two different causes.",
            [("Worth keeping",
              ["Local circumstances genuinely differ",
               "Regulation differs between jurisdictions",
               "Customers in different segments need different handling",
               "The variation was designed, and somebody can explain it"]),
             ("Worth removing",
              ["Each site developed independently",
               "The variation reflects who happened to set it up",
               "Nobody can explain why the difference exists",
               "It prevents work being moved or people being shared"])]),
        desc(
            "The practical test is the third entry: asking why the difference "
            "exists. A designed variation has a reason somebody can state, "
            "and an accumulated one has an origin nobody remembers -- which "
            "is the distinction that decides whether standardising removes "
            "value or waste."
        ),
    ]),

    ("Processes and Systems", [
        desc(
            "Systems support processes, and the relationship between them "
            "runs in a direction organisations frequently reverse."
        ),
        ul([
            "The process should determine what the system must do, rather "
            "than the system determining how the work is performed.",
            "Where a packaged product is adopted, its process may be better "
            "than the organisation's own -- which is a reason to change the "
            "process rather than to configure the product.",
            "Customising a product to match an existing process is expensive "
            "at purchase and expensive at every upgrade.",
            "A system enforcing a process makes it consistent and makes "
            "changing it a software change.",
        ]),
        desc(
            "The last point is a genuine trade. Enforcing a process in "
            "software guarantees it is followed and converts every subsequent "
            "process change into a development project -- so processes "
            "expected to evolve are enforced more lightly than those that "
            "must not vary."
        ),
    ]),

    ("Continuous Process Improvement", [
        desc(
            "A process improved once drifts, exactly as a control does, so "
            "improvement is arranged as a cycle."
        ),
        ol([
            "Measure the process as it currently runs.",
            "Identify the largest opportunity from the measurements rather "
            "than from opinion.",
            "Change one thing, so its effect is attributable.",
            "Measure again, and confirm the effect was what was expected.",
            "Repeat, since removing one constraint reveals the next.",
        ]),
        desc(
            "Step five describes something worth expecting rather than being "
            "surprised by. Removing the bottleneck does not make the process "
            "fast; it makes something else the bottleneck -- and a programme "
            "planning for one improvement rather than a sequence stops at the "
            "first."
        ),
    ]),

    ("Modelling Notations in Practice", [
        desc(
            "Several notations exist, and choosing between them is a question "
            "about the audience rather than about expressiveness."
        ),
        table(
            ["Notation", "Suits", "Costs"],
            [["A simple flowchart",
              "Communicating with anybody, immediately",
              "Cannot express parallelism or roles clearly"],
             ["A swimlane diagram",
              "Showing who does what, and the handovers",
              "Becomes crowded on a large process"],
             ["A formal process notation",
              "Precision, and generating executable definitions",
              "Requires training to read as well as to write"],
             ["A written procedure",
              "Detail a diagram cannot carry",
              "Nobody sees the shape of the process"]],
            caption="Four ways of recording a process.",
            footer="The audience decides. A precise model nobody in the "
                   "business can read has recorded the process for the "
                   "analyst and communicated it to nobody -- which defeats "
                   "the purpose of mapping it."),
        desc(
            "Most process work uses more than one: a simple diagram for "
            "discussion, a swimlane model for analysis, and written procedure "
            "for the detail. They describe the same process at different "
            "resolutions rather than competing."
        ),
    ]),

    ("Process Ownership Across Departments", [
        desc(
            "The processes that matter most cross departmental boundaries, "
            "which is exactly where accountability is weakest."
        ),
        compare_grid(
            "WHAT DEPARTMENTAL AND PROCESS ACCOUNTABILITY EACH COVER",
            "Two different things called responsibility.",
            [("Departmental",
              ["Each manager answers for their own steps",
               "Local efficiency is measured and rewarded",
               "The handovers belong to nobody",
               "Optimising locally can worsen the whole"]),
             ("Process",
              ["One owner answers for the end-to-end outcome",
               "The measure is what the customer receives",
               "The handovers are explicitly somebody's concern",
               "Local sacrifice for the whole becomes possible"])]),
        desc(
            "The last entry on each side is the practical difference. A "
            "department asked to do something slower or dearer so that the "
            "whole process improves will not agree to it unless somebody is "
            "accountable for the whole -- and without that, every local "
            "optimisation is rational and the process stays poor."
        ),
    ]),

    ("When Not to Change a Process", [
        desc(
            "Improvement is not always the answer, and the syllabus expects "
            "the judgement rather than an assumption."
        ),
        ul([
            "A process consuming little effort and causing no problems is "
            "not where attention belongs, however untidy it looks.",
            "A process about to be replaced by a new system should not be "
            "optimised first, since the effort is discarded.",
            "A process whose participants are already absorbing significant "
            "change may not be able to take more.",
            "A process working badly because of a resource shortage needs "
            "resources rather than redesign.",
            "Change has a cost in disruption and retraining that has to be "
            "exceeded by the benefit.",
        ]),
        desc(
            "The fourth point is the diagnosis most often skipped. Redesigning "
            "a process that is slow because two people do the work of four "
            "produces a better process that is still slow -- and the "
            "redesign will be blamed for not having helped."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where process items are lost."),
        ul([
            "Mapping the documented process rather than the actual one.",
            "Analysing without measuring, so improvement follows whichever "
            "step people complain about.",
            "Attacking processing time when waiting is most of the elapsed "
            "time.",
            "Automating before eliminating, which entrenches waste in "
            "software.",
            "Ignoring lane crossings, which are where delays and dropped "
            "responsibility live.",
            "Treating rework loops as normal rather than as measurable "
            "failure.",
            "Optimising one step at the expense of the process as a whole.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A process takes ten working days end to end. Measurement finds "
            "it contains six hours of actual work. Where should improvement "
            "effort go?\""
        ),
        ol([
            "Compute the difference: ten working days is roughly eighty "
            "hours, of which six are work.",
            "So approximately seventy-four hours -- more than ninety per cent "
            "of the elapsed time -- is WAITING.",
            "Halving the processing time would save three hours from eighty, "
            "which is under four per cent.",
            "Removing queues, batching or handovers addresses the "
            "seventy-four, which is where the time actually is.",
            "The lane crossings are the place to look, since each one is a "
            "queue -- and reducing the number of handovers attacks the "
            "dominant term directly.",
        ]),
        desc(
            "The item rewards computing rather than assuming. Effort "
            "naturally goes to the work, because that is what people can see "
            "themselves doing -- and the measurement shows that the work is "
            "almost irrelevant to how long the process takes."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Process analysis feeds several other categories."),
        ul([
            "The as-is and to-be framing comes from the previous lesson.",
            "Process models are the requirements models of Development "
            "Technology.",
            "Waiting dominating elapsed time is queueing behaviour from "
            "Basic Theory.",
            "Automating after eliminating is the same discipline the "
            "development category applies to tooling.",
            "Handover losses parallel the interface problems of system "
            "integration.",
            "Measured processes support the investment appraisal of System "
            "Planning.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Why nobody sees the whole process",
              "Each participant sees only their own steps",
              "The waiting between them is visible to nobody until it is "
              "mapped."),
             ("What usually dominates elapsed time",
              "Waiting, not working",
              "Which is why attacking processing time frequently changes "
              "almost nothing."),
             ("What a swimlane crossing represents",
              "A handover -- a queue, and a chance to drop something",
              "Counting the crossings is an analysis in itself."),
             ("Why automation comes after elimination",
              "Automating waste entrenches it in software",
              "Which is harder to remove than a habit."),
             ("The most valuable reordering",
              "Moving eligibility checks to the front",
              "So work is not performed on cases that will be rejected."),
             ("What first-time-right exposes",
              "Rework, which the documentation never shows",
              "It was never designed in, and frequently dominates the "
              "effort.")]),
    ]),
]

_bpa_quiz = [
    mcq("HARD",
        "A process takes ten working days end to end and contains six hours "
        "of actual work.\n\nWhere should improvement effort go?",
        [("The waiting between steps, which is over ninety per cent of the "
          "elapsed time", True),
         ("The six hours of processing, by making each individual step "
          "more efficient", False),
         ("Automating the steps, since they are evidently "
          "repetitive", False),
         ("Adding staff, since ten days indicates insufficient "
          "capacity", False)],
        "Ten working days is roughly eighty hours, of which six are work -- "
        "so about seventy-four hours are queue. Halving the processing time "
        "saves under four per cent of the elapsed time. Removing handovers "
        "and batching attacks the dominant term, and the lane crossings are "
        "where to look, since each is a queue."),

    mcq("AVERAGE",
        "What does a swimlane crossing in a process model represent?",
        [("A handover between parties, and therefore a queue", True),
         ("A decision point at which the process branches on a "
          "condition", False),
         ("A step performed by an external organisation", False),
         ("A point at which the process may terminate", False)],
        "Each crossing is work passing from one party to another, which "
        "introduces a delay, a possible misunderstanding and a point where "
        "responsibility can be dropped. Counting the crossings is a useful "
        "analysis by itself -- a process crossing departments eight times has "
        "eight queues, and reducing them often beats optimising any step."),

    mcq("HARD",
        "Why should automation come after elimination and simplification?",
        [("Automating a wasteful process entrenches the waste in "
          "software", True),
         ("Automation is considerably more expensive than the other "
          "improvement techniques", False),
         ("Automated steps cannot subsequently be eliminated", False),
         ("Elimination reduces the volume automation must "
          "handle", False)],
        "Automating waste makes it happen faster and embeds it in a system, "
        "which is considerably harder to remove than a habit somebody could "
        "simply stop. Eliminating what adds nothing and simplifying what is "
        "over-complicated first means the automation applies to a process "
        "worth having, rather than making a bad one permanent."),

    mcq("AVERAGE",
        "Which improvement technique removes work rather than making it "
        "faster?",
        [("Elimination of steps that add nothing to the outcome", True),
         ("Automation of the steps that are repetitive and "
          "rule-based", False),
         ("Simplification of steps more complicated than the outcome "
          "requires", False),
         ("Combination of steps currently performed separately", False)],
        "Simplifying, combining and automating all make work cheaper to "
        "perform; eliminating means it is not performed at all, which is "
        "why it comes first in the sequence. Checks nobody uses and "
        "approvals nobody reads are the usual candidates -- steps that were "
        "needed once and whose reason has since gone."),

    mcq("HARD",
        "A process validates eligibility at its final step.\n\n"
        "What improvement does this suggest?",
        [("Moving the check to the front, so ineligible cases consume no "
          "work", True),
         ("Automating the check, since it is rule-based and performed on "
          "every case", False),
         ("Combining it with the preceding step to reduce "
          "handovers", False),
         ("Sampling rather than checking every case", False)],
        "All the work on a case that is finally rejected was wasted entirely, "
        "and moving the check to the front eliminates it rather than speeding "
        "it up. Reordering is the least obvious improvement and frequently "
        "the most valuable, since it removes work rather than making it more "
        "efficient."),

    mcq("AVERAGE",
        "What does the difference between cycle time and processing time "
        "reveal?",
        [("How much of the elapsed time is spent waiting", True),
         ("How much rework the process contains", False),
         ("How efficiently each individual step is performed", False),
         ("How the volume is distributed across the steps", False)],
        "Cycle time is how long a case takes end to end and processing time "
        "is how much work it requires, so the difference is queue. It is the "
        "analysis that redirects improvement effort, because a process taking "
        "two weeks and four hours of work has thirteen and a half days of "
        "waiting that nobody is looking at."),

    mcq("HARD",
        "Why is rework frequently invisible in process documentation?",
        [("It was never designed in, so no document describes it", True),
         ("Staff conceal it to avoid appearing inefficient", False),
         ("It occurs outside the process's defined boundaries", False),
         ("Documentation is updated less often than the process "
          "changes", False),
         ],
        "A documented process describes the intended path, and work returned "
        "for correction is a failure of that path rather than a step in it -- "
        "so nothing records it. Measuring the first-time-right rate is what "
        "exposes it, and it frequently turns out to account for a large share "
        "of the total effort."),

    mcq("AVERAGE",
        "Why must a process be measured before it is analysed for "
        "improvement?",
        [("Otherwise effort follows whichever step people complain "
          "about", True),
         ("Measurement is required in order to justify the improvement "
          "budget to management", False),
         ("Analysis techniques require numeric inputs to be "
          "applied", False),
         ("Without measurement the process boundaries cannot be "
          "defined", False)],
        "The step everybody finds frustrating is frequently not the one "
        "consuming time or causing errors, and only measurement "
        "distinguishes them. Without it, improvement is opinion, and effort "
        "goes to what is most visible rather than to what is most costly."),

    mcq("AVERAGE",
        "Which participant in a process can see the whole of it?",
        [("None -- each sees only their own steps and what they "
          "receive", True),
         ("The process owner, who is accountable for the process from end "
          "to end", False),
         ("The department performing the most steps", False),
         ("Whoever operates the supporting system", False)],
        "Each participant knows their own activity and what arrives and "
        "departs, and the waiting between steps and the rework loops belong "
        "to nobody's view. That is precisely why mapping produces surprises "
        "for everybody involved, including the person nominally accountable "
        "for the process."),

    mcq("HARD",
        "What is the risk of optimising one step of a process in "
        "isolation?",
        [("The improvement may shift the constraint rather than remove "
          "it", True),
         ("The step may become inconsistent with the documented "
          "procedure", False),
         ("Other departments may object to the change", False),
         ("The measurement baseline becomes invalid for later "
          "comparison", False)],
        "Speeding up a step that feeds a queue simply produces a longer "
        "queue, and the process's total time is unchanged -- the constraint "
        "has moved rather than gone. Improvements are therefore judged "
        "against the end-to-end measure rather than against the step, which "
        "is what the mapping exists to make possible."),
]

LESSON_SYS_BPA = lesson(
    MAJOR, MIDDLE,
    "Business Process Analysis and Modelling",
    _bpa_quiz,
    lesson_structure(
        "Business Process Analysis and Modelling",
        "Nobody sees a whole process -- each participant knows their own "
        "steps and what they receive -- so the waiting between steps, the "
        "duplicated effort and the rework loops are visible to nobody until "
        "somebody maps it. This lesson covers mapping what REALLY happens "
        "rather than what is documented, the notation whose swimlane "
        "crossings do most of the analytical work, measurement without which "
        "improvement is opinion, and the improvement sequence in which "
        "automation comes LAST -- since automating a wasteful process "
        "entrenches the waste in software, which is harder to remove than a "
        "habit.",
        [
            "Explain why no participant sees a whole process",
            "Map a process including its boundaries, actors and real steps",
            "Read process notation and interpret swimlane crossings",
            "Measure cycle time, processing time and their difference",
            "Apply the improvement sequence in the correct order",
            "Explain why automation follows elimination",
            "Identify reordering opportunities",
            "Explain why rework is invisible in documentation",
        ],
        75,
        _bpa_sections,
        [
            ("Process mapping",
             "Recording what really happens, including informal steps, since "
             "documented and actual practice diverge."),
            ("Swimlane",
             "Shows who performs each activity. Every crossing is a handover, "
             "a queue and a chance to drop something."),
            ("Cycle time",
             "How long a case takes end to end."),
            ("Processing time",
             "How much actual work a case requires. The difference from cycle "
             "time is WAITING."),
            ("Improvement sequence",
             "Eliminate, simplify, combine, reorder -- and automate LAST."),
            ("Reordering",
             "Moving checks earlier so work is not performed on cases that "
             "will be rejected."),
            ("First-time-right rate",
             "Exposes rework, which documentation never shows because it was "
             "never designed in."),
        ],
        "No participant sees a whole process, since each knows only their own "
        "steps and what arrives and departs -- so the WAITING between steps, "
        "the duplication across departments and the rework loops belong to "
        "nobody's view until somebody maps them. Mapping records what really "
        "happens rather than what is documented, since workarounds accumulate "
        "and become invisible to the people using them. The notation's "
        "SWIMLANES do most of the analytical work, because every crossing is "
        "a handover carrying a queue, a possible misunderstanding and a point "
        "where responsibility can be dropped. Measurement then makes analysis "
        "possible rather than opinionated, and its most redirecting result is "
        "the gap between CYCLE TIME and PROCESSING TIME: a process taking two "
        "weeks and containing four hours of work has thirteen and a half days "
        "of queue, so attacking the work addresses almost none of it. "
        "Improvement runs eliminate, simplify, combine, reorder and only then "
        "AUTOMATE -- since automating waste makes it faster and embeds it in "
        "software, which is far harder to remove than a habit. And "
        "reordering is the least obvious and often the most valuable, because "
        "moving an eligibility check to the front removes work rather than "
        "accelerating it.",
        exam_notes=[
            desc(
                "Items give process measurements and ask where improvement "
                "effort belongs."
            ),
            ul([
                "Computing waiting from cycle and processing time.",
                "Interpreting a swimlane crossing.",
                "Ordering the improvement techniques.",
                "Explaining why automation comes last.",
                "Identifying a reordering opportunity.",
                "Explaining why rework is undocumented.",
                "Explaining why measurement precedes analysis.",
            ]),
            desc(
                "Whenever an item gives an elapsed time and a work time, "
                "subtract them first. The difference is nearly always most of "
                "the elapsed time, and it points the improvement somewhere "
                "different from where instinct sends it."
            ),
        ],
    ))

LESSONS = [LESSON_SYS_STRAT, LESSON_SYS_BPA]

"""Development Technology -> Software Development Management Techniques,
lessons 1 and 2.

Syllabus minor categories: development processes and methods, and
intellectual property in software development.

The process lesson refuses to treat agile as a successor to waterfall,
because the examination asks which suits a described situation -- and the
answer follows from how well the requirements are understood.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Development Technology"
MIDDLE = "Software Development Management Techniques"

# ==========================================================================
# Lesson 1: Development processes and methods
# ==========================================================================

_proc_sections = [
    ("Arranging the Work", [
        desc(
            "The previous lessons described the activities a project "
            "performs. A process model decides how they are ARRANGED -- in "
            "sequence, in cycles, or continuously."
        ),
        image(fig("process-models")),
        desc(
            "No model is correct in general, and the examination asks which "
            "suits a described situation. The answer follows from one "
            "question: how well are the requirements actually understood?"
        ),
    ]),

    ("Waterfall", [
        desc(
            "Each stage is completed and approved before the next begins, "
            "which is the arrangement every other model is described against."
        ),
        compare_grid(
            "WHAT SEQUENTIAL DEVELOPMENT BUYS AND COSTS",
            "The properties follow from completing each stage before "
            "starting the next.",
            [("Buys",
              ["Predictability -- the plan is known in advance",
               "Contractable -- scope and price can be fixed",
               "Clear progress against defined milestones",
               "Documentation produced as a matter of course"]),
             ("Costs",
              ["Nothing works until very late",
               "Change after a stage is approved is expensive",
               "Requirements errors survive until testing",
               "Assumes requirements are knowable up front"])]),
        desc(
            "The last cost is the assumption everything else rests on. Where "
            "the requirements genuinely are stable and well understood -- a "
            "regulated calculation, a replacement for something that already "
            "works -- the assumption holds and the predictability is real."
        ),
        desc(
            "Where it does not hold, the model's strengths turn against it: "
            "the plan is precise about the wrong thing, and the first "
            "opportunity to discover that is the first time anybody sees "
            "working software."
        ),
    ]),

    ("Iterative and Incremental", [
        desc(
            "The middle position: the whole process is repeated in cycles, "
            "each producing something that works."
        ),
        table(
            ["", "Iterative", "Incremental"],
            [["Means", "Refining the same thing repeatedly",
              "Delivering it a piece at a time"],
             ["Each cycle produces", "A better version of the whole",
              "Another working part"],
             ["Addresses", "Uncertainty about what is wanted",
              "The need to deliver value early"],
             ["Usually", "Combined -- most real processes do both",
              "Combined"]],
            caption="Two words used interchangeably that mean different "
                    "things.",
            footer="ITERATIVE is about REVISION and INCREMENTAL is about "
                   "PIECES. Building a rough version of everything and then "
                   "improving it is iterative; delivering a finished quarter "
                   "at a time is incremental."),
        desc(
            "The SPIRAL model is the risk-driven form the syllabus names. "
            "Each cycle begins by identifying the biggest remaining risk and "
            "does the work that resolves it -- so the most dangerous "
            "uncertainty is addressed first rather than whatever is most "
            "convenient."
        ),
    ]),

    ("Agile", [
        desc(
            "Agile treats change as expected rather than as a failure of "
            "planning, and organises around short cycles that deliver working "
            "software."
        ),
        image(fig("agile-cycle")),
        ul([
            "Working software is the measure of progress, rather than "
            "documents produced.",
            "The customer is involved continuously rather than at the "
            "beginning and the end.",
            "Requirements are expected to change, and the process is arranged "
            "to make that affordable.",
            "The team reflects regularly and adjusts how it works.",
            "Scope varies within a fixed time and team, rather than time "
            "varying to fit a fixed scope.",
        ]),
        desc(
            "The last point is the structural difference and the one items "
            "turn on. A plan-driven project fixes scope and lets time and "
            "cost move; an agile project fixes time and team and lets scope "
            "move -- which is why 'agile' does not mean 'faster' and does "
            "mean 'the least valuable things may not be built'."
        ),
    ]),

    ("Agile Practices", [
        desc(
            "The syllabus names specific practices, and each addresses a "
            "particular risk."
        ),
        content_accordion(
            "SIX PRACTICES AND WHAT EACH IS FOR",
            "Each is a response to something that goes wrong otherwise.",
            [("Short iterations",
              "A fixed period ending in working software, so feedback arrives "
              "while it is still cheap to act on."),
             ("A prioritised backlog",
              "Everything wanted, in value order, so that stopping at any "
              "point leaves the most valuable things built."),
             ("Daily coordination",
              "A brief regular meeting surfacing obstacles within a day "
              "rather than at the end of a phase."),
             ("Continuous integration",
              "Every change merged and tested immediately, so a break is "
              "attributable to one small change."),
             ("Retrospectives",
              "Regular reflection on the process itself, which is what makes "
              "the method adapt rather than merely repeat."),
             ("Pair work and review",
              "Continuous review as code is written, and knowledge shared "
              "across more than one person.")]),
        desc(
            "The prioritised backlog is the practice that makes fixed-time "
            "delivery safe. If work is genuinely done in value order, running "
            "out of time removes the least valuable items -- whereas an "
            "unordered backlog means running out of time removes whatever "
            "happened to be last."
        ),
    ]),

    ("Choosing a Process", [
        desc(
            "The examination gives a situation and asks which approach suits "
            "it, and the reasoning is short."
        ),
        table(
            ["When", "Prefer", "Because"],
            [["Requirements are stable and well understood",
              "Plan-driven", "The predictability is real and worth having"],
             ["Requirements are uncertain or contested",
              "Iterative", "Discovering them is the main risk"],
             ["The customer cannot be involved continuously",
              "Plan-driven", "Iteration depends on feedback"],
             ["Early partial delivery has real value",
              "Incremental", "Value arrives before completion"],
             ["The consequences of failure are severe and regulated",
              "Plan-driven, with heavy verification",
              "Evidence and traceability are themselves requirements"]],
            caption="Five situations and what each argues for.",
            footer="The third row is the constraint people forget. Iterative "
                   "development depends on somebody being available to react "
                   "to each increment, and without that it becomes "
                   "waterfall with extra meetings."),
        desc(
            "HYBRID approaches are common and legitimate. A project may fix "
            "an architecture and a regulated interface up front and develop "
            "the rest iteratively -- which applies each model where its "
            "assumption actually holds rather than choosing one for the whole."
        ),
    ]),

    ("Estimating", [
        desc(
            "Every process needs estimates, and the syllabus expects the "
            "approaches and their limits."
        ),
        ul([
            "EXPERT judgement: asking people who have done similar work. "
            "Fast, and only as good as the similarity.",
            "ANALOGY: comparing against a completed project. Grounded in "
            "evidence, if a comparable one exists.",
            "DECOMPOSITION: estimating the parts and summing. More accurate, "
            "and it omits whatever was not decomposed.",
            "PARAMETRIC models: deriving effort from a size measure using "
            "historical data. Objective, and dependent on that data being "
            "relevant.",
            "RELATIVE sizing: comparing items to each other rather than "
            "estimating hours, which people do far more consistently.",
        ]),
        desc(
            "Every method shares one limitation: an estimate is a "
            "prediction under uncertainty, and stating it as a single number "
            "conceals that. A range with the assumptions attached is more "
            "honest and more useful, and it is what allows the plan to "
            "respond when an assumption proves wrong."
        ),
    ]),

    ("Roles in an Agile Team", [
        desc(
            "Iterative processes distribute decisions differently from "
            "plan-driven ones, and the syllabus names the roles that result."
        ),
        table(
            ["Role", "Decides", "Does not decide"],
            [["Product owner", "What is built, and in what order",
              "How it is built, or how much fits"],
            ["Development team", "How much fits in an iteration, and how",
              "What is most valuable"],
            ["Facilitator or scrum master", "How the process runs",
              "What is built, or how"],
            ["Stakeholders", "What they need, and whether it delivered",
              "The team's day-to-day work"]],
            caption="Four roles, defined as much by what each does not "
                    "decide.",
            footer="The third column is what makes the arrangement work. A "
                   "product owner deciding how much fits, or a team deciding "
                   "what is valuable, collapses the separation that lets each "
                   "decision be made by whoever knows most about it."),
        desc(
            "The separation also explains a common failure. When the same "
            "person sets both the priorities and the capacity, the capacity "
            "quietly becomes whatever the priorities require -- which is "
            "how a fixed-time process turns back into an overcommitted "
            "plan-driven one."
        ),
    ]),

    ("Measuring Progress", [
        desc(
            "Each process model measures progress differently, and measuring "
            "the wrong thing produces confident reporting of nothing."
        ),
        compare_grid(
            "STAGE COMPLETION AGAINST WORKING SOFTWARE",
            "Two measures, one of which can be met while nothing works.",
            [("Plan-driven measures",
              ["Stages completed and approved",
               "Documents delivered against the plan",
               "Effort spent against effort budgeted",
               "Can report 80% with nothing executable"]),
             ("Iterative measures",
              ["Working functionality actually delivered",
               "Value delivered against value planned",
               "Rate of delivery over recent iterations",
               "Cannot be met without something that runs"])]),
        desc(
            "The 'ninety per cent done' problem is what the second column "
            "addresses. Progress measured by effort spent reports steady "
            "advancement until integration, where the remaining ten per cent "
            "turns out to contain most of the difficulty -- whereas working "
            "software delivered is a claim nobody can make prematurely."
        ),
    ]),

    ("Process Improvement", [
        desc(
            "An organisation's process is itself something to be improved, "
            "and the syllabus expects the idea of maturity."
        ),
        ol([
            "At the lowest level, results depend on individuals, and success "
            "is not repeatable.",
            "Then processes are defined for a project, so the same project "
            "can repeat what worked.",
            "Then they are defined across the organisation, so a new project "
            "starts from what was learned.",
            "Then they are measured, so decisions about them rest on evidence "
            "rather than opinion.",
            "Then measurement drives deliberate improvement, continuously.",
        ]),
        desc(
            "The value of the model is diagnostic rather than a target. "
            "Knowing that an organisation's success currently depends on "
            "particular individuals tells you exactly what will happen when "
            "they leave -- which is a more useful thing to know than which "
            "level it has been assessed at."
        ),
    ]),

    ("Documentation Across Processes", [
        desc(
            "Every process produces documentation, and the models differ in "
            "when it is produced rather than in whether it is."
        ),
        ul([
            "Plan-driven processes produce documents as stage outputs, which "
            "is where their predictability and their contractability come "
            "from.",
            "Iterative processes prefer working software to documents, which "
            "is a statement about PRIORITY rather than about value.",
            "The documentation a system needs to be operated and maintained "
            "is required whichever process built it.",
            "Regulated environments may require specific evidence, which "
            "makes documentation a requirement rather than a preference.",
        ]),
        desc(
            "The second point is where agile is most often misread. "
            "Preferring working software over comprehensive documentation "
            "ranks two valuable things; it does not say the second is "
            "worthless -- and a maintainer inheriting an undocumented system "
            "pays for the misreading rather than the principle."
        ),
    ]),

    ("Distributed and Outsourced Development", [
        desc(
            "Teams are frequently spread across sites, organisations and time "
            "zones, and every process model is harder under those "
            "conditions."
        ),
        table(
            ["Difficulty", "Effect", "Response"],
            [["Time zone separation", "A question costs a day",
              "Overlap hours, and write things down"],
             ["No informal communication",
              "What was never stated stays unshared",
              "Explicit interfaces and decisions"],
             ["Different organisations", "Contracts replace goodwill",
              "Agree scope and change handling precisely"],
             ["Uneven context", "One side knows why, the other does not",
              "Deliberate knowledge sharing, not documents alone"]],
            caption="Four difficulties of distributed work.",
            footer="The first row is what pushes distributed projects towards "
                   "written specification. When a clarifying question costs a "
                   "day, the cost of ambiguity rises sharply -- so the "
                   "iterative reliance on conversation becomes expensive."),
        desc(
            "That does not make iteration impossible, and it does change what "
            "it requires: overlapping hours where real conversation can "
            "happen, and far more deliberate recording of decisions than a "
            "co-located team would need."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where process items are lost."),
        ul([
            "Treating agile as a successor to waterfall rather than a "
            "different answer to a different situation.",
            "Confusing iterative with incremental. Revision against pieces.",
            "Assuming agile means faster. It means scope varies rather than "
            "time.",
            "Adopting iteration without the customer involvement it depends "
            "on.",
            "Believing an unordered backlog gives fixed-time delivery its "
            "safety. Value order is what does.",
            "Presenting an estimate as a single number, concealing the "
            "uncertainty it contains.",
            "Choosing one model for a whole project when its assumptions hold "
            "for only part of it.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A project has uncertain requirements and a customer "
            "representative available only at the start and the end. An "
            "iterative approach is proposed. Evaluate it.\""
        ),
        ol([
            "Note the argument FOR iteration: uncertain requirements make "
            "discovery the main risk, which iteration addresses directly.",
            "Note what iteration depends on: somebody reacting to each "
            "increment, which is what turns a delivery into feedback.",
            "The customer is unavailable between the start and the end, so "
            "that feedback cannot happen.",
            "Without it, the iterations produce working software nobody "
            "evaluates -- which is waterfall with extra ceremony and none of "
            "its documentation discipline.",
            "The real problem is the customer's availability, so the answer "
            "is either securing a genuinely available representative, or "
            "accepting a plan-driven approach and investing heavily in "
            "up-front validation such as prototypes.",
        ]),
        desc(
            "Step five is what the item rewards. The proposal is not simply "
            "wrong; it is unsupported by a precondition, and the useful "
            "answer identifies which precondition and what could be done "
            "about it rather than merely rejecting the method."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Process choice touches most of the certification."),
        ul([
            "Requirements volatility is what the requirements lesson was "
            "assessing.",
            "Continuous integration and automated tests come from the "
            "construction lesson.",
            "Fixed time with varying scope is a Project Management "
            "constraint.",
            "Estimating feeds project planning and cost control.",
            "Regulated verification requirements come from Legal Affairs and "
            "the Security category.",
            "Retrospectives are the process improvement of the quality "
            "lessons.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What decides the process choice",
              "How well the requirements are understood",
              "Stable and known favours plan-driven; uncertain or contested "
              "favours iteration."),
             ("Iterative against incremental",
              "Revision, against pieces",
              "Refining the whole repeatedly, against delivering finished "
              "parts one at a time."),
             ("What agile actually fixes",
              "Time and team, letting scope vary",
              "So it does not mean faster -- it means the least valuable "
              "items may not be built."),
             ("What iteration depends on",
              "A customer available to react to each increment",
              "Without it, iteration is waterfall with extra meetings."),
             ("What makes fixed-time delivery safe",
              "A backlog in genuine VALUE order",
              "Running out of time then removes the least valuable items "
              "rather than whatever was last."),
             ("What the spiral model orders work by",
              "The biggest remaining risk",
              "So the most dangerous uncertainty is resolved first rather "
              "than the most convenient work.")]),
    ]),
]

_proc_quiz = [
    mcq("HARD",
        "A project has uncertain requirements, and the customer "
        "representative is available only at the start and the end.\n\n"
        "What is wrong with proposing an iterative approach?",
        [("Iteration depends on somebody reacting to each increment, which "
          "cannot happen", True),
         ("Iterative approaches require requirements to be stable before "
          "cycles begin", False),
         ("Uncertain requirements are better addressed by more detailed "
          "up-front analysis", False),
         ("Iterative approaches cannot produce the documentation such a "
          "project needs", False)],
        "Uncertain requirements are exactly what iteration addresses, so the "
        "instinct is right and the precondition is absent. Delivering "
        "increments nobody evaluates produces no feedback, which makes it "
        "waterfall with extra ceremony and without its documentation "
        "discipline. The real problem is the customer's availability -- so "
        "secure a genuine representative, or go plan-driven with heavy "
        "up-front validation."),

    mcq("AVERAGE",
        "What is the difference between iterative and incremental "
        "development?",
        [("Iterative refines the same thing repeatedly; incremental delivers "
          "it a piece at a time", True),
         ("Iterative applies to requirements while incremental applies to "
          "construction", False),
         ("Iterative produces working software each cycle while incremental "
          "does not", False),
         ("Iterative is used in agile methods and incremental in plan-driven "
          "ones", False)],
        "Iteration is about REVISION -- building a rough version of the whole "
        "and improving it -- while increments are about PIECES, each "
        "finished. They address different problems: uncertainty about what is "
        "wanted, and the value of delivering early. Most real processes do "
        "both, which is why the words end up used interchangeably."),

    mcq("HARD",
        "In an agile project, what varies when the work turns out to be "
        "larger than expected?",
        [("The scope delivered, since time and team are fixed", True),
         ("The delivery date, which moves to accommodate the "
          "work", False),
         ("The size of the team, which grows to meet the deadline", False),
         ("The quality standards applied, which are relaxed", False)],
        "Fixing time and team and letting scope vary is the structural "
        "difference from plan-driven development, which fixes scope and lets "
        "time and cost move. It is also why agile does not mean faster: the "
        "same work takes the same effort, and what changes is that the least "
        "valuable items may not be built -- which the prioritised backlog is "
        "what makes safe."),

    mcq("AVERAGE",
        "Under what circumstances is a plan-driven sequential approach the "
        "better choice?",
        [("When the requirements are stable and genuinely well "
          "understood", True),
         ("When the delivery deadline is fixed and cannot be "
          "moved", False),
         ("When the development team is inexperienced with the "
          "domain", False),
         ("When the system is large enough to require several teams", False)],
        "Sequential development assumes requirements are knowable up front, "
        "and where that assumption holds the predictability it buys is real "
        "and valuable. Where it does not, the plan is precise about the wrong "
        "thing and the error survives until somebody first sees working "
        "software. A fixed deadline actually argues for varying scope, which "
        "is the agile arrangement."),

    mcq("HARD",
        "Why does a prioritised backlog make fixed-time delivery safe?",
        [("Running out of time removes the least valuable items rather than "
          "arbitrary ones", True),
         ("It allows the team to estimate how much can be completed in the "
          "time", False),
         ("It ensures every item is small enough to finish within one "
          "iteration", False),
         ("It prevents new items being added after the work has "
          "begun", False)],
        "If work is genuinely done in value order, stopping at any point "
        "leaves the most valuable things built and drops the least valuable. "
        "Without that ordering, running out of time drops whatever happened "
        "to be scheduled last, which may be essential -- so the ordering is "
        "what converts a fixed deadline from a risk into a controlled "
        "outcome."),

    mcq("AVERAGE",
        "What orders the work in the spiral model?",
        [("The biggest remaining risk", True),
         ("The value each item delivers to the customer", False),
         ("The dependencies between the system's components", False),
         ("The order of the stages in the sequential life cycle", False)],
        "Each cycle begins by identifying the largest remaining risk and "
        "doing the work that resolves it, so the most dangerous uncertainty "
        "is addressed while there is still time to act on what is learned. "
        "Ordering by value is the agile backlog's principle, which answers a "
        "different question about what to build rather than what to "
        "de-risk."),

    mcq("HARD",
        "Why is presenting an estimate as a single number misleading?",
        [("It conceals the uncertainty a prediction necessarily "
          "contains", True),
         ("Single numbers cannot be compared against actual effort "
          "afterwards", False),
         ("Estimation methods produce ranges that must be averaged to "
          "combine", False),
         ("A single number implies a commitment the estimator cannot "
          "make", False)],
        "An estimate is a prediction made under uncertainty, and a single "
        "figure presents it as knowledge. A range with the assumptions "
        "attached is both more honest and more useful, because it tells "
        "whoever is planning what would have to change for the estimate to be "
        "wrong -- which is what lets the plan respond when an assumption "
        "fails."),

    mcq("AVERAGE",
        "What does a retrospective contribute that the other agile practices "
        "do not?",
        [("Regular reflection on the process itself, so the method "
          "adapts", True),
         ("Confirmation that the iteration's committed work was "
          "completed", False),
         ("Feedback from the customer on what was delivered", False),
         ("Early detection of obstacles blocking individual team "
          "members", False)],
        "Short iterations, backlogs and daily coordination all improve the "
        "work; the retrospective improves the WAY the work is done, which is "
        "what makes a method adaptive rather than merely repetitive. "
        "Customer feedback comes from the review of the increment, and "
        "obstacles surface at daily coordination."),

    mcq("HARD",
        "A project fixes its architecture and a regulated external interface "
        "up front, then develops the remaining functionality "
        "iteratively.\n\nHow should this be regarded?",
        [("As legitimate, applying each approach where its assumptions "
          "hold", True),
         ("As a compromise that loses the benefits of both "
          "approaches", False),
         ("As plan-driven development, since the architecture was fixed "
          "first", False),
         ("As inappropriate, since a project should follow one process "
          "model", False)],
        "The architecture and a regulated interface are genuinely stable and "
        "expensive to change, so up-front definition suits them; the "
        "remaining functionality is uncertain, so iteration suits it. Hybrid "
        "approaches are common and correct precisely because the assumptions "
        "behind each model hold for different parts of the same project."),

    mcq("AVERAGE",
        "Which estimation approach compares a proposed piece of work against "
        "a completed project?",
        [("Estimation by analogy", True),
         ("Expert judgement, drawing on experience", False),
         ("Decomposition into constituent tasks", False),
         ("A parametric model derived from historical data", False)],
        "Analogy grounds the estimate in something that actually happened, "
        "which is its strength -- and it requires a genuinely comparable "
        "project to exist. Expert judgement asks people who have done similar "
        "work without a specific comparison, decomposition estimates the "
        "parts and sums them, and a parametric model derives effort from a "
        "size measure."),
]

LESSON_DEV_PROC = lesson(
    MAJOR, MIDDLE,
    "Development Processes and Methods: Waterfall, Agile and Beyond",
    _proc_quiz,
    lesson_structure(
        "Development Processes and Methods: Waterfall, Agile and Beyond",
        "A process model decides how the development activities are arranged, "
        "and no model is correct in general -- so the examination asks which "
        "suits a described situation, and the answer follows from how well "
        "the requirements are actually understood. This lesson covers "
        "sequential development and the assumption everything else it offers "
        "rests on, the iterative and incremental distinction that is usually "
        "blurred, agile as a different answer rather than a successor -- "
        "fixing time and team while scope varies -- the practices and the risk "
        "each addresses, the situations that argue for each approach, and "
        "estimation with the limitation every method shares.",
        [
            "Explain what a process model decides and what determines the "
            "choice",
            "State what sequential development buys and what it assumes",
            "Distinguish iterative from incremental development",
            "Explain the spiral model's risk-driven ordering",
            "Describe agile's structural difference and its practices",
            "Match a described situation to an appropriate approach",
            "Explain what iterative development depends on",
            "Compare estimation approaches and state their shared limitation",
        ],
        80,
        _proc_sections,
        [
            ("Waterfall",
             "Stages completed and approved in sequence. Predictable, and it "
             "assumes requirements are knowable up front."),
            ("Iterative development",
             "Refining the same thing across repeated cycles. Addresses "
             "uncertainty about what is wanted."),
            ("Incremental development",
             "Delivering finished pieces one at a time. Addresses the value "
             "of delivering early."),
            ("Spiral model",
             "Risk-driven iteration -- each cycle resolves the largest "
             "remaining risk first."),
            ("Agile",
             "Short cycles delivering working software, with time and team "
             "fixed and SCOPE varying."),
            ("Prioritised backlog",
             "Work in value order, so running out of time removes the least "
             "valuable items."),
            ("Retrospective",
             "Reflection on the process itself, which is what makes a method "
             "adapt rather than repeat."),
            ("Hybrid approach",
             "Applying each model where its assumptions hold -- fixed "
             "architecture, iterative functionality."),
            ("Estimation by analogy",
             "Comparing against a completed project, which requires a "
             "comparable one to exist."),
            ("Parametric estimation",
             "Deriving effort from a size measure using historical data, "
             "which must be relevant."),
        ],
        "A process model arranges the activities, and the choice follows from "
        "how well the requirements are understood rather than from which "
        "method is fashionable. Sequential development buys predictability "
        "and contractability by assuming requirements are knowable up front "
        "-- an assumption that holds for a regulated calculation and fails "
        "for a contested one, where the plan becomes precise about the wrong "
        "thing. Iterative and incremental are distinct: REVISION of the whole "
        "against finished PIECES, addressing uncertainty and early value "
        "respectively, with the spiral model ordering cycles by the largest "
        "remaining risk. Agile is a different answer rather than a successor, "
        "and its structural difference is fixing TIME and TEAM while scope "
        "varies -- which is why it does not mean faster and does mean the "
        "least valuable items may go unbuilt, made safe by a backlog in "
        "genuine value order. Its practices each address a specific risk, and "
        "the whole approach depends on a customer available to react to each "
        "increment; without that it is waterfall with extra meetings. Hybrid "
        "approaches are legitimate, applying each model where its assumption "
        "holds. And every estimation method shares one limitation: a "
        "prediction under uncertainty presented as a single number conceals "
        "exactly the thing a planner needs to know.",
        exam_notes=[
            desc(
                "Items describe a project situation and ask which process "
                "suits it, or ask what a method actually requires."
            ),
            ul([
                "Matching a situation to a process model.",
                "Distinguishing iterative from incremental.",
                "Stating what varies in an agile project.",
                "Identifying a missing precondition for iteration.",
                "Explaining what a prioritised backlog provides.",
                "Naming what orders spiral model cycles.",
                "Comparing estimation approaches.",
            ]),
            desc(
                "When a method is proposed, check its PRECONDITION rather "
                "than arguing about the method. Iteration needs available "
                "feedback and plan-driven work needs stable requirements -- "
                "and naming the absent precondition is a better answer than "
                "rejecting the approach."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Intellectual property
# ==========================================================================

_ip_sections = [
    ("What Can Be Owned", [
        desc(
            "Software development produces things that can be owned, and the "
            "syllabus distinguishes the forms of protection because they "
            "protect different things."
        ),
        table(
            ["Right", "Protects", "Arises"],
            [["Copyright", "The EXPRESSION -- the code as written",
              "Automatically, on creation"],
             ["Patent", "An INVENTION -- a novel technical method",
              "Only by application and grant"],
             ["Trade secret", "Information kept confidential",
              "By keeping it secret"],
             ["Trademark", "Names and marks identifying a source",
              "By use, and strengthened by registration"]],
            caption="Four rights protecting four different things.",
            footer="The first two rows carry the distinction items turn on. "
                   "Copyright protects HOW something was written and not the "
                   "idea behind it -- so somebody writing their own code for "
                   "the same purpose has not infringed it."),
        desc(
            "That copyright limit is worth stating plainly. Two independent "
            "programs solving the same problem in the same obvious way do not "
            "infringe each other, because the idea is not owned. Copying the "
            "code is what infringes, which is why the question is always "
            "whether the expression was taken."
        ),
    ]),

    ("Copyright in Software", [
        desc(
            "Copyright is the right that applies to almost all software, and "
            "its details matter in practice."
        ),
        ul([
            "It arises automatically when the code is written, with no "
            "registration required.",
            "It covers the source and the compiled form, and normally the "
            "documentation too.",
            "It lasts for a long period -- decades beyond the author's life "
            "in most regimes.",
            "It is infringed by copying, adapting or distributing without "
            "permission.",
            "It does not prevent somebody independently creating something "
            "similar.",
        ]),
        desc(
            "The question of WHO holds it is where disputes arise. Work "
            "created by an employee in the course of employment normally "
            "belongs to the employer; work by a contractor normally belongs "
            "to the CONTRACTOR unless the contract says otherwise -- which is "
            "the reverse of what people assume and the reason it must be "
            "written into the agreement."
        ),
    ]),

    ("Licences", [
        desc(
            "A licence is permission to use something somebody else owns, on "
            "stated terms -- and reading the terms is the whole of the "
            "discipline."
        ),
        image(fig("licence-obligations")),
        table(
            ["Family", "Permits", "Requires"],
            [["Proprietary", "Use, under the terms bought",
              "Payment, and usually no redistribution"],
             ["Permissive open source", "Use, modification, redistribution",
              "Attribution, and little else"],
             ["Copyleft open source", "The same freedoms",
              "Derived works carry the SAME licence"],
             ["Public domain or equivalent", "Anything", "Nothing"]],
            caption="Four licence families and what each demands in return.",
            footer="COPYLEFT is the row with a business consequence. "
                   "Incorporating such a component can oblige the whole "
                   "derived work to be licensed the same way -- which is why "
                   "component licences are reviewed BEFORE use rather than "
                   "discovered afterwards."),
        desc(
            "Open source does not mean unowned. The author holds copyright "
            "and grants permissions on conditions, so failing the conditions "
            "-- omitting attribution, or not releasing a derived work -- is "
            "infringement in the ordinary way."
        ),
    ]),

    ("Managing Component Licences", [
        desc(
            "Modern software is assembled from components, and each carries "
            "obligations that become the assembler's."
        ),
        ol([
            "Know what the software actually includes, including the "
            "dependencies of the dependencies.",
            "Record the licence of each, since obligations cannot be met "
            "unknowingly.",
            "Review licences against how the product will be distributed, "
            "because obligations often depend on distribution.",
            "Comply: include the notices, provide the attributions, release "
            "what must be released.",
            "Re-check when components are added or upgraded, since a licence "
            "can change between versions.",
        ]),
        desc(
            "Step one is what makes the rest possible and is where "
            "organisations are weakest. A team that cannot list what its "
            "software includes cannot state its obligations -- and the same "
            "gap prevents answering whether a newly published vulnerability "
            "affects them, which is the Security lesson's point arriving from "
            "a different direction."
        ),
    ]),

    ("Patents and Software", [
        desc(
            "Patents protect inventions rather than expression, and their "
            "application to software varies considerably between "
            "jurisdictions."
        ),
        compare_grid(
            "PATENT AGAINST COPYRIGHT",
            "Two rights that protect different aspects of the same product.",
            [("Patent",
              ["Protects the technical method itself",
               "Requires novelty and an inventive step",
               "Must be applied for, examined and granted",
               "Shorter term, and it prevents independent invention"]),
             ("Copyright",
              ["Protects the particular expression",
               "Requires only that it was created",
               "Arises automatically",
               "Long term, and independent creation is permitted"])]),
        desc(
            "The last line of each column is the practical difference. A "
            "patent can be infringed by somebody who never saw the original "
            "and invented the same method independently; copyright cannot, "
            "because it prohibits copying rather than the idea."
        ),
    ]),

    ("Trade Secrets and Confidentiality", [
        desc(
            "Some valuable information is protected by not disclosing it, "
            "which is a different mechanism with different consequences."
        ),
        ul([
            "Protection lasts as long as the secret does, and ends completely "
            "once it is public.",
            "It requires active measures -- access control, agreements, "
            "handling procedures -- to be maintained at all.",
            "It does not prevent independent discovery, or lawful reverse "
            "engineering where that is permitted.",
            "Non-disclosure agreements are the contractual form, and they "
            "bind the people who signed them rather than the world.",
        ]),
        desc(
            "The choice between patenting and secrecy is a real strategic "
            "one. A patent grants protection in exchange for PUBLICATION, so "
            "the method becomes public and protection expires; a secret lasts "
            "indefinitely and is lost entirely the moment it escapes."
        ),
    ]),

    ("Reverse Engineering", [
        desc(
            "Examining somebody else's software to understand how it works "
            "occupies a position the syllabus treats carefully."
        ),
        table(
            ["Purpose", "Position"],
            [["Achieving interoperability with the product",
              "Frequently permitted, within limits"],
             ["Studying how something works, for understanding",
              "Often permitted, and jurisdiction-dependent"],
             ["Producing a competing copy",
              "Not permitted -- it produces a derived work"],
             ["Circumventing technical protection",
              "Restricted, and separately regulated"]],
            caption="Four purposes, and how each is generally treated.",
            footer="The PURPOSE is what determines the position, which is "
                   "why the same technical activity can be lawful or not. "
                   "Licence terms may also prohibit it contractually, "
                   "independently of what the law permits."),
        desc(
            "The practical point for a development team is that permission "
            "depends on purpose and jurisdiction, and licence terms may "
            "restrict what the law would otherwise allow -- so it is a "
            "question to ask before starting rather than a technical "
            "decision."
        ),
    ]),

    ("Protecting the Organisation's Own Work", [
        desc(
            "The rights covered here also apply in the other direction, and "
            "protecting what an organisation produces takes deliberate "
            "measures."
        ),
        ul([
            "Ensure employment and contractor agreements assign ownership "
            "explicitly rather than relying on defaults.",
            "Mark and record what is confidential, since a trade secret "
            "requires active protection to exist at all.",
            "Decide deliberately whether to patent or keep secret, since the "
            "two are alternatives rather than complements.",
            "Register trademarks for names the organisation will rely on.",
            "Keep records of when work was created and by whom, since "
            "ownership disputes turn on evidence.",
        ]),
        desc(
            "The first item is the one that is cheap in advance and "
            "impossible retrospectively. An assignment clause costs nothing "
            "at the point of signing and cannot be added after a dispute has "
            "begun -- by which time the default position, which is often not "
            "the assumed one, governs."
        ),
    ]),

    ("Open Source as a Strategy", [
        desc(
            "Organisations release their own software under open licences "
            "deliberately, and the reasoning is examined."
        ),
        compare_grid(
            "WHY AN ORGANISATION PUBLISHES ITS OWN CODE",
            "Reasons on both sides of the decision.",
            [("Reasons to",
              ["Contributions and defect reports from outside",
               "Adoption as a standard, benefiting the wider product",
               "Credibility, and easier recruitment",
               "Shared maintenance of something not differentiating"]),
             ("Reasons not to",
              ["It may be exactly what differentiates the organisation",
               "Published code invites scrutiny of its quality",
               "Community expectations become obligations",
               "It cannot be unpublished"])]),
        desc(
            "The last item on the right is decisive and easily overlooked. A "
            "licence granted cannot be withdrawn from copies already "
            "distributed, so the decision is irreversible for everything "
            "released -- which makes it a strategic choice rather than an "
            "experiment."
        ),
    ]),

    ("Escrow and Supplier Failure", [
        desc(
            "A customer depending on software they do not own faces a risk "
            "the syllabus names a specific remedy for."
        ),
        desc(
            "SOURCE CODE ESCROW places the source with an independent third "
            "party, released to the customer if defined events occur -- the "
            "supplier ceasing to trade, or failing to meet support "
            "obligations. It addresses the risk that a business depends on "
            "software nobody remaining can maintain."
        ),
        ul([
            "The triggering events must be defined precisely, or the "
            "arrangement is unusable when it is needed.",
            "The deposit must be verified and kept current, since obsolete "
            "source is no protection.",
            "Build instructions and dependencies matter as much as the "
            "source, because code that cannot be built is not usable.",
            "The customer must have, or be able to obtain, the skills to "
            "maintain it.",
        ]),
        desc(
            "The third point is where escrow arrangements typically fail. A "
            "deposit of source alone, without the build environment and "
            "instructions, leaves a customer holding something they cannot "
            "turn into a running system -- which is the same completeness "
            "problem handover has."
        ),
    ]),

    ("Software Piracy and Licence Compliance", [
        desc(
            "The obligations run in the ordinary direction too: an "
            "organisation must use only what it is licensed to use."
        ),
        table(
            ["Situation", "Position"],
            [["More installations than licences bought",
              "Infringement, whether deliberate or accidental"],
             ["A licence bought for one purpose used for another",
              "Depends entirely on the terms -- development, test and "
              "production are often licensed separately"],
             ["Software copied between employees",
              "Infringement, and a common informal practice"],
             ["A licence tied to hardware, moved to new hardware",
              "Frequently prohibited without a transfer"]],
            caption="Four common situations and how each stands.",
            footer="The second row is the one that catches organisations "
                   "acting in good faith. A licence permitting production use "
                   "may not cover the test and development copies, and the "
                   "difference is in the terms rather than in anybody's "
                   "intention."),
        desc(
            "Compliance therefore needs the same foundation as everything "
            "else here: a record of what is installed, where, and under which "
            "licence. Organisations discover shortfalls during an audit far "
            "more often than through any deliberate decision to under-buy."
        ),
    ]),

    ("Attribution and Notices", [
        desc(
            "Almost every licence requires something to be included with the "
            "distributed product, and it is the obligation most often "
            "overlooked."
        ),
        ul([
            "Most licences require the copyright notice and the licence text "
            "to accompany the product.",
            "Attribution requirements name who must be credited and "
            "sometimes where.",
            "Notices apply to distributed BINARIES too, not only to source "
            "distributions.",
            "A generated notices file, produced from the component inventory, "
            "is how this is kept correct as dependencies change.",
        ]),
        desc(
            "This is the low-effort obligation that produces the most "
            "avoidable non-compliance. Nothing about it is difficult; it "
            "simply requires knowing what the product contains, which returns "
            "to the inventory that everything else in this lesson also "
            "depends on."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where intellectual property items are lost."),
        ul([
            "Believing copyright protects the idea. It protects the "
            "expression, so independent creation is permitted.",
            "Assuming a contractor's work belongs to the client by default. "
            "It usually does not.",
            "Treating open source as unowned. The author holds copyright and "
            "grants conditional permissions.",
            "Missing that copyleft obligations can reach the whole derived "
            "work.",
            "Not knowing which components the software actually includes.",
            "Assuming a patent works like copyright. A patent is infringed by "
            "independent invention.",
            "Relying on a trade secret without the measures that keep it "
            "secret.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A company incorporates a copyleft-licensed component into a "
            "product it intends to sell without releasing its source. What is "
            "the position?\""
        ),
        ol([
            "Establish what copyleft requires: derived works must be "
            "distributed under the same licence.",
            "Establish that distribution is what triggers most such "
            "obligations -- selling the product is distributing it.",
            "So the product may be obliged to be released under that licence, "
            "including its source.",
            "That conflicts directly with the commercial intention, and it is "
            "an obligation rather than a preference.",
            "The options are: comply and release; replace the component with "
            "a permissively licensed or proprietary equivalent; or negotiate "
            "a different licence with the copyright holder if one is "
            "available.",
        ]),
        desc(
            "The general lesson is that component licences are a design "
            "constraint discovered cheaply at selection time and expensively "
            "at release. Checking before adopting a component costs minutes; "
            "replacing one the product has been built around costs a great "
            "deal more."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Intellectual property reaches into several categories."),
        ul([
            "Component inventories serve both licence compliance and "
            "vulnerability management, from the Security category.",
            "Contract terms about ownership are Corporate Activities "
            "procurement.",
            "Licence obligations constrain the build-or-buy decision of the "
            "architecture lesson.",
            "Trade secret protection uses the access controls of the Security "
            "lessons.",
            "Patent strategy appears in Technological Strategy Management.",
            "The wider legal framework is developed in Legal Affairs.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What copyright protects",
              "The expression, not the idea",
              "So independent creation of something similar does not "
              "infringe."),
             ("Who owns a contractor's work",
              "Normally the contractor, unless the contract says otherwise",
              "The reverse of what people assume, which is why it must be "
              "written down."),
             ("What copyleft requires",
              "Derived works carry the same licence",
              "Which can reach a whole product, and is triggered by "
              "distribution."),
             ("Whether open source is unowned",
              "No -- copyright is held, and permissions are conditional",
              "Failing the conditions is infringement in the ordinary way."),
             ("Patent against copyright on independent creation",
              "A patent is infringed by it; copyright is not",
              "Because a patent protects the method and copyright prohibits "
              "copying."),
             ("The patent-or-secret trade",
              "Protection in exchange for publication, against indefinite "
              "protection lost on disclosure",
              "A strategic choice rather than a legal technicality.")]),
    ]),
]

_ip_quiz = [
    mcq("HARD",
        "A company incorporates a copyleft-licensed component into a product "
        "it intends to sell without releasing source.\n\n"
        "What is the position?",
        [("The derived work may be obliged to carry the same licence, "
          "including its source", True),
         ("The obligation applies only if the component's source was "
          "modified", False),
         ("No obligation arises, since the product is sold rather than "
          "distributed freely", False),
         ("Attribution in the documentation satisfies the licence's "
          "requirements", False)],
        "Copyleft requires derived works to be distributed under the same "
        "licence, and selling a product is distributing it -- so the "
        "commercial intention conflicts with an obligation rather than a "
        "preference. The options are complying, replacing the component, or "
        "negotiating a different licence with the holder. Attribution alone "
        "satisfies PERMISSIVE licences, not copyleft ones."),

    mcq("AVERAGE",
        "Copyright in software protects one thing specifically.\n\n"
        "Which?",
        [("The particular expression -- the code as written", True),
         ("The idea or algorithm the software implements", False),
         ("The technical method, provided it is novel", False),
         ("The name under which the software is distributed", False)],
        "Copyright protects HOW something was written rather than what it "
        "does, so two independent programs solving the same problem the same "
        "obvious way do not infringe each other. Protecting the method itself "
        "requires a PATENT, which must be applied for and granted; names are "
        "protected by trademark."),

    mcq("HARD",
        "Who normally holds copyright in software written by an external "
        "contractor?",
        [("The contractor, unless the contract assigns it otherwise", True),
         ("The client, since the work was commissioned and paid for", False),
         ("Both parties jointly, in proportion to their "
          "contribution", False),
         ("The client, provided the specification was theirs", False)],
        "Employee work in the course of employment normally belongs to the "
        "employer; contractor work normally belongs to the contractor. That "
        "is the reverse of what most people assume, and it is why the "
        "assignment must be written into the agreement -- paying for work "
        "does not by itself transfer the copyright in it."),

    mcq("AVERAGE",
        "How does patent protection differ from copyright with respect to "
        "independent creation?",
        [("A patent is infringed by independent invention; copyright is "
          "not", True),
         ("Copyright is infringed by independent creation; a patent is "
          "not", False),
         ("Neither is infringed by genuinely independent work", False),
         ("Both are infringed regardless of how the work arose", False)],
        "A patent protects the technical method itself, so somebody who never "
        "saw the original and invented the same thing still infringes it. "
        "Copyright prohibits copying, so independent creation of something "
        "similar is permitted. That difference is why patents are the "
        "stronger and rarer right, granted only after examination for novelty "
        "and an inventive step."),

    mcq("AVERAGE",
        "Maintaining a trade secret has one essential "
        "requirement.\n\nWhich?",
        [("Active measures keeping the information confidential", True),
         ("Registration of the information with a national "
          "authority", False),
         ("A non-disclosure agreement signed by every employee", False),
         ("Publication of the method after a defined period", False)],
        "Protection exists only while the information remains secret, and "
        "keeping it so requires access controls, agreements and handling "
        "procedures actively maintained. Once it becomes public, protection "
        "ends completely and permanently. Non-disclosure agreements are one "
        "of the measures and bind only those who signed them, not the world."),

    mcq("HARD",
        "Why should an organisation maintain an inventory of the components "
        "its software includes?",
        [("Obligations cannot be met unknowingly, and vulnerability exposure "
          "cannot be assessed", True),
         ("Component licences must be registered with the relevant "
          "authorities", False),
         ("Build tools require an explicit list to resolve dependencies "
          "correctly", False),
         ("Auditors require evidence that all components were "
          "purchased", False)],
        "A team that cannot list what its software includes cannot state its "
        "licence obligations or determine whether a newly published "
        "vulnerability affects it -- one gap producing two different "
        "failures. Dependencies of dependencies are where the unknown "
        "components usually are, which is why the inventory must reach the "
        "whole tree."),

    mcq("AVERAGE",
        "What does a permissive open source licence typically require in "
        "return?",
        [("Attribution, and little else", True),
         ("That derived works carry the same licence", False),
         ("Payment of a fee proportional to distribution", False),
         ("Publication of the source of any modifications made", False)],
        "Permissive licences allow use, modification and redistribution "
        "including in closed products, asking chiefly for attribution -- "
        "which is what makes them straightforward to adopt commercially. "
        "Requiring derived works to carry the same licence is COPYLEFT, the "
        "family whose obligations can reach a whole product."),

    mcq("HARD",
        "What is given up in exchange for patent protection?",
        [("The method becomes public, and protection expires after a "
          "term", True),
         ("The right to license the invention to other parties", False),
         ("The ability to protect the same work by copyright", False),
         ("Ownership of improvements made by others to the "
          "method", False)],
        "A patent grants protection in return for PUBLICATION, so the "
        "invention is disclosed and after the term anybody may use it. A "
        "trade secret gives the opposite bargain -- indefinite protection, "
        "lost entirely the moment the information escapes. Choosing between "
        "them is a genuine strategic decision rather than a legal "
        "technicality."),

    mcq("AVERAGE",
        "Two teams independently write programs that solve the same problem "
        "using the same well-known approach.\n\nHas copyright been "
        "infringed?",
        [("No, since copyright protects expression rather than the "
          "approach", True),
         ("Yes, since the resulting programs perform the same "
          "function", False),
         ("Yes, if the second team was aware of the first team's "
          "product", False),
         ("Only if the two implementations are of similar length and "
          "structure", False)],
        "Copyright is infringed by copying the expression, so independent "
        "creation is permitted however similar the result -- the idea and the "
        "approach are not owned. Awareness of another product does not "
        "change that; what would matter is evidence that the code itself was "
        "taken. Protecting the method requires a patent."),

    mcq("HARD",
        "A component's licence changes between the version in use and the "
        "version being upgraded to.\n\nWhat follows?",
        [("The obligations must be reviewed again before the upgrade is "
          "adopted", True),
         ("The original licence continues to apply, since it was accepted "
          "first", False),
         ("The change has no effect provided the component's function is "
          "unchanged", False),
         ("The new licence applies retrospectively to the existing "
          "deployment", False)],
        "Each version is licensed under the terms attached to it, so "
        "upgrading means accepting whatever the new version requires -- which "
        "may include obligations the previous licence did not impose. This is "
        "why licence review belongs in the upgrade process rather than only "
        "at initial adoption, and it is a genuine and easily missed source of "
        "non-compliance."),
]

LESSON_DEV_IP = lesson(
    MAJOR, MIDDLE,
    "Intellectual Property in Software Development",
    _ip_quiz,
    lesson_structure(
        "Intellectual Property in Software Development",
        "Software development produces things that can be owned, and the four "
        "rights protect different things -- copyright the EXPRESSION, patents "
        "the METHOD, trade secrets whatever stays confidential, trademarks "
        "the name. This lesson works through each with the practical "
        "consequences the examination asks about: that copyright permits "
        "independent creation while a patent does not, that a contractor "
        "normally keeps copyright unless the contract says otherwise, that "
        "open source is owned and merely licensed conditionally, and that "
        "copyleft obligations can reach an entire product -- which makes "
        "component licence review a design-time activity rather than a "
        "release-time discovery.",
        [
            "Distinguish copyright, patent, trade secret and trademark by "
            "what each protects",
            "State how copyright arises and what it does not prevent",
            "Determine who holds copyright in employee and contractor work",
            "Distinguish the licence families and what each requires",
            "Explain copyleft's reach and when it is triggered",
            "Manage component licences across a dependency tree",
            "Contrast patents with copyright on independent creation",
            "Explain the strategic choice between patenting and secrecy",
        ],
        75,
        _ip_sections,
        [
            ("Copyright",
             "Protects the expression, arises automatically, and permits "
             "independent creation of something similar."),
            ("Patent",
             "Protects a novel technical method, must be granted, and is "
             "infringed by independent invention."),
            ("Trade secret",
             "Protected by confidentiality, lasting as long as the secret and "
             "ending completely on disclosure."),
            ("Trademark",
             "Protects names and marks identifying a source."),
            ("Employee against contractor work",
             "Employee work normally belongs to the employer; contractor work "
             "normally to the contractor."),
            ("Permissive licence",
             "Use, modify and redistribute including commercially, asking "
             "chiefly for attribution."),
            ("Copyleft licence",
             "The same freedoms, requiring derived works to carry the same "
             "licence -- which can reach a whole product."),
            ("Distribution trigger",
             "Most licence obligations are triggered by distributing the "
             "work, and selling a product is distributing it."),
            ("Component inventory",
             "Knowing what the software includes, down the dependency tree. "
             "Serves licence compliance and vulnerability assessment alike."),
        ],
        "Four rights protect four different things, and the distinction items "
        "turn on is copyright against patent: copyright protects the "
        "EXPRESSION, arises automatically, and permits somebody to "
        "independently write similar code; a patent protects the METHOD, must "
        "be applied for and granted, and is infringed even by an inventor who "
        "never saw the original. Ownership follows employment status in a way "
        "people get backwards -- an employee's work normally belongs to the "
        "employer, a contractor's normally to the contractor unless the "
        "contract assigns it. Licences grant conditional permission, and open "
        "source is owned rather than unowned, so failing a condition is "
        "ordinary infringement. Permissive licences ask chiefly for "
        "attribution; COPYLEFT requires derived works to carry the same "
        "licence, an obligation triggered by DISTRIBUTION and capable of "
        "reaching an entire product -- which is why component licences are "
        "reviewed before adoption rather than discovered at release, and why "
        "an upgrade needs the review repeated. All of it depends on knowing "
        "what the software actually includes, down the dependency tree, which "
        "is the same inventory that answers whether a published vulnerability "
        "affects you. Finally, patenting and secrecy are a genuine strategic "
        "choice: protection in exchange for publication and a fixed term, "
        "against indefinite protection lost the moment the secret escapes.",
        exam_notes=[
            desc(
                "Items describe a use of somebody else's work and ask what "
                "the position is."
            ),
            ul([
                "Applying copyleft obligations to a commercial product.",
                "Determining who holds copyright in commissioned work.",
                "Distinguishing what copyright and patents protect.",
                "Identifying what a permissive licence requires.",
                "Explaining why a component inventory is needed.",
                "Explaining the patent-or-secret trade-off.",
                "Judging whether independent creation infringes.",
            ]),
            desc(
                "For a licence item, ask two questions: what does this "
                "licence require in return, and does distribution trigger it. "
                "Most obligations that surprise organisations are copyleft "
                "requirements activated by shipping a product, which is "
                "exactly the situation these items describe."
            ),
        ],
    ))

LESSONS = [LESSON_DEV_PROC, LESSON_DEV_IP]

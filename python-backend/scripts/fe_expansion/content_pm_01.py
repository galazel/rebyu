"""Project Management, lessons 1 to 3.

Foundations and process groups, integration management, and stakeholder
management.

The foundations lesson establishes the constraint triangle the rest of the
category keeps returning to, and states the consequence the examination
actually tests: when none of scope, time or cost is allowed to move,
something else gives and nobody decided which.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Project Management"
MIDDLE = "Project Management"

# ==========================================================================
# Lesson 1: Foundations
# ==========================================================================

_found_sections = [
    ("What Makes Something a Project", [
        desc(
            "The syllabus defines a project precisely, because the definition "
            "determines which management approach applies."
        ),
        table(
            ["", "A project", "Ongoing operations"],
            [["Duration", "Temporary -- a defined start and end",
              "Continuing indefinitely"],
             ["Output", "A unique product, service or result",
              "The same output repeatedly"],
             ["Objective", "To be completed", "To be sustained"],
             ["Success is", "Delivering the objective within constraints",
              "Meeting service levels consistently"]],
            caption="Two kinds of work, managed differently.",
            footer="UNIQUENESS is what makes projects hard. Repeated work "
                   "improves through practice; a project does something "
                   "nobody has done in quite this way, so estimates are "
                   "predictions rather than measurements."),
        desc(
            "PROGRAMME management coordinates related projects to obtain "
            "benefits unavailable from managing them separately, and "
            "PORTFOLIO management selects which projects and programmes to "
            "undertake at all. The distinction is scope of decision: a "
            "project delivers, a programme coordinates, a portfolio chooses."
        ),
    ]),

    ("The Constraints", [
        desc(
            "Every project is bounded by what it must deliver, by when, and "
            "for how much -- and these are related rather than independent."
        ),
        image(fig("project-constraints")),
        desc(
            "Fixing any two determines the third. More scope in the same time "
            "costs more; the same scope in less time costs more; less money "
            "means less scope or more time. This is arithmetic rather than "
            "negotiation, and treating it as negotiable is where projects "
            "begin to fail."
        ),
        desc(
            "The examinable consequence is what happens when all three are "
            "fixed. Something still gives -- quality falls, risks are "
            "accepted without being assessed, or people are worked "
            "unsustainably -- and none of those is a decision anybody made, "
            "which is why they are discovered late and cost more than the "
            "trade-off would have."
        ),
        ul([
            "Adding people to a late project usually makes it later, because "
            "existing staff spend time bringing them up to speed.",
            "Reducing scope is the fastest legitimate response to a schedule "
            "problem, and requires somebody empowered to choose what to drop.",
            "Extending the deadline is honest and often unavailable for "
            "reasons outside the project.",
            "Reducing quality is the response nobody proposes and every "
            "over-constrained project makes.",
        ]),
    ]),

    ("The Process Groups", [
        desc(
            "The syllabus organises project work into five groups of "
            "processes, and they are groups rather than sequential stages."
        ),
        image(fig("process-groups")),
        table(
            ["Group", "Establishes", "Principal output"],
            [["Initiating", "That the project should exist and who leads it",
              "A charter, and identified stakeholders"],
             ["Planning", "How the objective will be achieved",
              "A plan covering scope, schedule, cost, risk and the rest"],
             ["Executing", "The deliverables themselves",
              "The work, and the coordination of people"],
             ["Monitoring and controlling",
              "Whether reality matches the plan", "Corrective action"],
             ["Closing", "That it is genuinely finished",
              "Acceptance, handover and lessons recorded"]],
            caption="Five process groups and what each produces.",
            footer="They OVERLAP and REPEAT. Planning continues while "
                   "executing, monitoring runs throughout, and a phase of a "
                   "large project may go through all five -- which is why "
                   "they are not stages."),
        desc(
            "MONITORING AND CONTROLLING is the group most often reduced to "
            "reporting. Its purpose is corrective ACTION: comparing reality "
            "with the plan and doing something about the difference, which "
            "means a report nobody acts on has performed half the process."
        ),
    ]),

    ("The Project Charter", [
        desc(
            "Initiating produces the document that authorises the project, "
            "and its authority is what makes the rest possible."
        ),
        ul([
            "It states the objective and the business justification -- why "
            "this is worth doing.",
            "It names the project manager and states their authority, "
            "including over what resources.",
            "It records the high-level scope, the constraints, and the "
            "assumptions being made.",
            "It identifies the sponsor, who is accountable for the project "
            "delivering its benefits.",
            "It is issued by somebody with the authority to commit the "
            "organisation's resources.",
        ]),
        desc(
            "The second point is the one whose absence causes trouble. A "
            "project manager responsible for delivery without authority over "
            "the resources is accountable for something they cannot control "
            "-- which is a structural failure rather than a personal one, and "
            "the charter is where it is either fixed or created."
        ),
    ]),

    ("Life Cycles", [
        desc(
            "Projects are arranged into phases, and how the phases relate is "
            "itself a choice."
        ),
        compare_grid(
            "PREDICTIVE AGAINST ADAPTIVE LIFE CYCLES",
            "The same process groups, arranged differently.",
            [("Predictive",
              ["Scope determined early and held",
               "Phases largely sequential",
               "Change managed formally through control",
               "Suits well-understood work"]),
             ("Adaptive",
              ["Scope elaborated as the project proceeds",
               "Short repeated cycles",
               "Change expected rather than controlled",
               "Suits uncertain or evolving work"])]),
        desc(
            "This is the process model choice from the Development "
            "Technology category, seen from the management side -- and the "
            "deciding question is the same: how well is the work actually "
            "understood before it begins?"
        ),
    ]),

    ("Where Projects Fail", [
        desc(
            "The syllabus expects the recurring causes, and they are "
            "management failures far more often than technical ones."
        ),
        table(
            ["Cause", "Appears as"],
            [["Unclear or changing objectives",
              "Work that cannot be judged complete"],
             ["Inadequate sponsorship",
              "Decisions nobody makes, and resources nobody releases"],
             ["Unrealistic estimates accepted as commitments",
              "A plan that was never achievable"],
             ["Risks identified and not managed",
              "Surprises that were written down months earlier"],
             ["Stakeholders not engaged",
              "Objections arriving at the worst possible moment"],
             ["Scope growing without assessment",
              "A schedule consumed with nothing to point at"]],
            caption="Six causes and how each becomes visible.",
            footer="Note how few are technical. A project's technical "
                   "difficulty is usually the part that is best understood, "
                   "which is precisely why it is not what most often goes "
                   "wrong."),
        desc(
            "The third row deserves separate attention. An estimate is a "
            "prediction; a commitment is a promise. Converting one into the "
            "other by asking for it more firmly changes nothing about how "
            "long the work takes, and it removes the information the estimate "
            "was carrying."
        ),
    ]),

    ("The Project Manager's Role", [
        desc(
            "The syllabus is specific about what the role involves, because "
            "it is frequently misunderstood as technical leadership."
        ),
        table(
            ["Responsibility", "Means"],
            [["Delivering the objective",
              "Within the agreed constraints, or renegotiating them"],
             ["Planning and replanning",
              "Not producing one plan but keeping it current"],
             ["Deciding, or escalating",
              "Making the decisions within their authority promptly"],
             ["Removing obstacles",
              "Most of what stops a team is not technical"],
             ["Communicating",
              "Which occupies most of the time, and is not overhead"]],
            caption="Five responsibilities of the role.",
            footer="The last row is measured rather than asserted: the "
                   "majority of a project manager's time goes on "
                   "communication, and treating that as time taken from real "
                   "work misunderstands what the job is."),
        desc(
            "AUTHORITY varies with the organisation's structure. In a "
            "functional organisation the project manager coordinates people "
            "who report elsewhere; in a projectised one they report to the "
            "project manager directly; a matrix sits between, and the "
            "resulting divided loyalty is a structural feature rather than a "
            "personal difficulty."
        ),
    ]),

    ("Organisational Structures", [
        desc(
            "Where a project sits in an organisation determines how much "
            "authority its manager actually has."
        ),
        compare_grid(
            "FUNCTIONAL AGAINST PROJECTISED",
            "Two ends of a range, with matrix structures between them.",
            [("Functional",
              ["Staff report to department managers",
               "The project manager coordinates and cannot direct",
               "Deep specialist expertise is retained",
               "Project priorities compete with departmental ones"]),
             ("Projectised",
              ["Staff report to the project manager",
               "Clear authority and undivided attention",
               "Specialists have no departmental home",
               "People need somewhere to go when it ends"])]),
        desc(
            "A MATRIX structure gives people two managers, which is the "
            "common arrangement and the one producing the characteristic "
            "conflict: the project wants somebody full time and their "
            "department has other commitments. That is resolved by "
            "negotiation and by explicit agreements, not by either manager "
            "asserting priority."
        ),
    ]),

    ("Governance", [
        desc(
            "Somebody outside the project has to decide whether it should "
            "continue, and governance is that arrangement."
        ),
        ul([
            "A STEERING GROUP or board takes decisions beyond the project "
            "manager's authority.",
            "STAGE GATES are defined points at which continuing is decided "
            "deliberately rather than assumed.",
            "Reporting gives that group what it needs to decide, which is not "
            "the same as everything the project knows.",
            "TOLERANCES define how far the project may vary before it must "
            "escalate, which is what makes delegation workable.",
            "The decision to STOP a project must be genuinely available, or "
            "the gates are ceremonial.",
        ]),
        desc(
            "The last point is what distinguishes governance from reporting. "
            "A project nobody would ever cancel passes every gate regardless "
            "of what it reports, which means the gates cost time and decide "
            "nothing -- and the sunk cost already spent is not a reason to "
            "continue, however strongly it feels like one."
        ),
    ]),

    ("Feasibility and Business Case", [
        desc(
            "Before a project is authorised, somebody establishes that it is "
            "worth doing and possible."
        ),
        table(
            ["Assessed", "Asks"],
            [["Technical feasibility", "Can it be built with what exists"],
             ["Economic feasibility", "Do the benefits exceed the costs"],
             ["Operational feasibility",
              "Will it be used, and can it be run"],
             ["Schedule feasibility", "Can it be delivered in time to "
                                      "matter"],
             ["Legal and regulatory", "Is it permitted, and what does "
                                      "compliance cost"]],
            caption="Five dimensions of feasibility.",
            footer="OPERATIONAL feasibility is the one that sinks technically "
                   "successful projects. A system that works and that nobody "
                   "adopts has delivered nothing, and the reasons are "
                   "predictable enough to be assessed in advance."),
        desc(
            "The BUSINESS CASE states the expected benefits, the costs, and "
            "the assumptions the comparison rests on -- and it is revisited "
            "during the project, because a project whose justification has "
            "evaporated should stop regardless of how well it is being "
            "delivered."
        ),
    ]),

    ("Success and How It Is Judged", [
        desc(
            "A project can meet its constraints and be judged a failure, "
            "which is why the syllabus separates the measures."
        ),
        compare_grid(
            "PROJECT SUCCESS AGAINST PRODUCT SUCCESS",
            "Delivering well, against delivering something worth having.",
            [("Project success",
              ["Delivered within scope, time and cost",
               "Quality criteria met",
               "Stakeholders satisfied with the process",
               "Measurable at delivery"]),
             ("Product success",
              ["The benefits in the business case realised",
               "The system actually used as intended",
               "The problem it existed for genuinely reduced",
               "Measurable only months later"])]),
        desc(
            "The right-hand column is what the funding was for and is "
            "measured after the team has dispersed -- which is why benefits "
            "need a named owner who remains and a date on which they will be "
            "checked. Without those, nobody ever asks."
        ),
    ]),

    ("Ethics and Professional Conduct", [
        desc(
            "The syllabus expects a project manager to be answerable for how "
            "they work as well as for what they deliver."
        ),
        ul([
            "Report status HONESTLY, including when it is unwelcome -- a "
            "project reported green until the week it fails has been "
            "misreported for months.",
            "Declare conflicts of interest, particularly in procurement "
            "decisions.",
            "Respect confidentiality of information encountered through the "
            "role.",
            "Treat estimates and risks truthfully rather than adjusting them "
            "to what will be accepted.",
            "Refuse to accept a plan known to be impossible, since accepting "
            "it transfers a certainty into a later surprise.",
        ]),
        desc(
            "The first point is the one with the most practical "
            "consequence. Status reporting exists so that problems can be "
            "acted on while action is still possible, and a culture where bad "
            "news is unwelcome produces reports that arrive too late to be "
            "useful -- which is a management failure rather than a reporting "
            "one."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where foundation items are lost."),
        ul([
            "Treating the process groups as sequential stages. They overlap "
            "and repeat.",
            "Reducing monitoring and controlling to reporting, when its "
            "purpose is corrective action.",
            "Believing all three constraints can be fixed without "
            "consequence. Quality, risk or people absorb it.",
            "Adding people to a late project and expecting it to "
            "accelerate.",
            "Confusing project, programme and portfolio management.",
            "Making a project manager accountable without authority over "
            "resources.",
            "Treating an estimate as a commitment because it was requested "
            "firmly.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A project's scope, deadline and budget are all fixed and "
            "cannot be changed. The work is taking longer than planned. What "
            "will happen?\""
        ),
        ol([
            "Establish the relationship: scope, time and cost are related, so "
            "fixing all three leaves nothing to absorb a variance.",
            "The work is taking longer, which is a variance that must go "
            "somewhere.",
            "None of the three constraints may move, so the pressure "
            "transfers to what was not named.",
            "That is quality reduced, risks accepted without assessment, or "
            "people worked unsustainably -- typically all three.",
            "The critical point is that none of these is a decision anybody "
            "took, so they are discovered late, cost more than the trade-off "
            "would have, and cannot be attributed to any choice.",
        ]),
        desc(
            "Step five is what the item rewards. The management action "
            "available is making the trade EXPLICIT -- presenting the sponsor "
            "with the choice between scope, date and cost -- because the only "
            "alternative is the same trade made invisibly and worse."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("The foundations underpin the rest of the category."),
        ul([
            "Predictive against adaptive life cycles are the process models "
            "of Development Technology.",
            "The charter's authority question recurs in stakeholder "
            "management.",
            "Constraint trading is what scope, schedule and cost management "
            "each operate on.",
            "Risks written down and unmanaged are the subject of the risk "
            "lesson.",
            "Quality as the silent casualty is the quality lesson's cost of "
            "conformance argument.",
            "Benefits realisation belongs to System Strategy.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What defines a project",
              "Temporary, and producing something unique",
              "Uniqueness is what makes estimates predictions rather than "
              "measurements."),
             ("What happens when all three constraints are fixed",
              "Quality, risk or people absorb the variance",
              "And nobody decided that, which is why it is discovered late."),
             ("Project, programme, portfolio",
              "Delivers, coordinates, chooses",
              "The distinction is the scope of the decision being made."),
             ("Why the process groups are not stages",
              "They overlap and repeat throughout",
              "Planning continues during execution, and monitoring runs "
              "throughout."),
             ("What monitoring and controlling is for",
              "Corrective ACTION, not reporting",
              "A report nobody acts on has performed half the process."),
             ("Estimate against commitment",
              "A prediction against a promise",
              "Asking for it more firmly changes nothing about how long the "
              "work takes.")]),
    ]),
]

_found_quiz = [
    mcq("HARD",
        "A project's scope, deadline and budget are all fixed, and the work "
        "is taking longer than planned.\n\nWhat is the most likely outcome?",
        [("Quality, risk exposure or the team absorbs the variance, with "
          "nobody deciding it", True),
         ("The project will complete on time, since all constraints were "
          "agreed in advance", False),
         ("The deadline will move, since it is the constraint most easily "
          "adjusted", False),
         ("Additional staff will be assigned, restoring the original "
          "schedule", False)],
        "Scope, time and cost are related, so fixing all three leaves nothing "
        "to absorb a variance -- and the pressure transfers to what was not "
        "named: quality falls, risks are accepted unassessed, people are "
        "overworked. None of that is a decision anybody took, which is why it "
        "is discovered late. The available action is making the trade "
        "explicit for the sponsor to choose."),

    mcq("AVERAGE",
        "A project differs from ongoing operations in a specific "
        "way.\n\nWhich?",
        [("It is temporary and produces something unique", True),
         ("It is larger and involves more people", False),
         ("It is managed by a dedicated manager rather than a "
          "department", False),
         ("It has a defined budget rather than an annual "
          "allocation", False)],
        "A project has a defined start and end and produces a unique result; "
        "operations continue indefinitely producing the same output. "
        "Uniqueness is what makes projects difficult -- repeated work "
        "improves through practice, while a project does something nobody has "
        "done in quite this way, so its estimates are predictions rather than "
        "measurements."),

    mcq("HARD",
        "A late project adds several developers to recover the "
        "schedule.\n\nWhat typically happens?",
        [("It becomes later, since existing staff must bring the new ones up "
          "to speed", True),
         ("The schedule recovers in proportion to the number of additional "
          "staff assigned to the work", False),
         ("The schedule recovers, though the budget is exceeded", False),
         ("Quality falls while the schedule is met as planned", False)],
        "New people need to learn the system and the work, and the only "
        "people who can teach them are the ones already doing it -- so "
        "productive capacity falls before it rises, and on a project already "
        "late, the recovery may arrive after the deadline. Reducing scope is "
        "the faster legitimate response to a schedule problem."),

    mcq("AVERAGE",
        "Why are the five process groups not the same as project stages?",
        [("They overlap and repeat throughout the project", True),
         ("They apply only to predictive life cycles", False),
         ("They describe activities rather than deliverables", False),
         ("Each is performed by a different part of the "
          "organisation", False)],
        "Planning continues while work is executed, monitoring runs "
        "throughout, and a phase of a large project may pass through all five "
        "groups itself. Treating them as a sequence produces a project that "
        "plans once and never replans -- which is exactly the behaviour "
        "monitoring and controlling exists to prevent."),

    mcq("AVERAGE",
        "What is the purpose of the monitoring and controlling process "
        "group?",
        [("Comparing reality against the plan and taking corrective "
          "action", True),
         ("Producing regular status reports for the sponsor and the other "
          "project stakeholders", False),
         ("Verifying that deliverables meet their quality "
          "criteria", False),
         ("Recording lessons learned for future projects", False)],
        "The group exists to ACT on the difference between plan and reality. "
        "Reporting is how the difference becomes visible and is only half the "
        "process -- a variance identified, reported and not acted on has "
        "consumed the effort of monitoring without obtaining any of its "
        "benefit. Lessons learned belong to closing."),

    mcq("HARD",
        "What distinguishes programme management from project management?",
        [("A programme coordinates related projects for benefits none could "
          "deliver alone", True),
         ("A programme is simply a project that exceeds a certain size "
          "threshold set by the organisation", False),
         ("A programme selects which projects the organisation should "
          "undertake", False),
         ("A programme continues indefinitely rather than having an "
          "end", False)],
        "A programme coordinates projects whose combined outcome exceeds what "
        "managing them separately would achieve. Selecting which projects to "
        "undertake at all is PORTFOLIO management, a level above. The "
        "distinction throughout is the scope of the decision: delivering, "
        "coordinating, or choosing."),

    mcq("AVERAGE",
        "What does a project charter establish that matters most in "
        "practice?",
        [("The project manager's authority, including over resources", True),
         ("The detailed schedule and milestones against which the project's "
          "progress will be measured", False),
         ("The acceptance criteria the deliverables must meet", False),
         ("The communication plan for reporting to stakeholders", False)],
        "A project manager accountable for delivery without authority over "
        "the resources is responsible for something they cannot control, "
        "which is a structural failure rather than a personal one. The "
        "charter is where that authority is either granted or, by omission, "
        "withheld. Schedules and criteria are planning outputs produced "
        "later."),

    mcq("HARD",
        "An estimate is challenged and the team is asked to commit to a "
        "shorter figure.\n\nWhat does this achieve?",
        [("Nothing about the duration, while removing the information the "
          "estimate carried", True),
         ("A more efficient plan, since the team will organise its work to "
          "meet the committed figure", False),
         ("A realistic schedule, since original estimates include "
          "padding", False),
         ("Improved accountability, since the team has accepted the "
          "figure", False)],
        "An estimate is a prediction about how long work will take, and "
        "requesting a different number does not change the work. What it does "
        "change is the plan's relationship to reality: the schedule now "
        "reflects what was wanted rather than what was expected, and the "
        "variance appears later disguised as a delivery failure."),

    mcq("AVERAGE",
        "Which cause of project failure is most often underestimated relative "
        "to technical difficulty?",
        [("Stakeholders not engaged, producing objections at the worst "
          "moment", True),
         ("The chosen technology proving unsuitable for the requirements it "
          "must satisfy", False),
         ("Development staff lacking the necessary technical "
          "skills", False),
         ("Tools and infrastructure being inadequate for the work", False)],
        "A project's technical difficulty is usually the part the team "
        "understands best and estimates most carefully. The recurring failure "
        "causes are managerial -- unclear objectives, weak sponsorship, "
        "unmanaged risks, disengaged stakeholders, unassessed scope growth -- "
        "which is why this category exists alongside the technical ones."),

    mcq("HARD",
        "In which life cycle is scope elaborated progressively rather than "
        "fixed early?",
        [("Adaptive", True),
         ("Predictive, since planning continues throughout", False),
         ("Both equally, since all projects refine their scope", False),
         ("Neither -- scope is always fixed by the charter", False)],
        "An adaptive life cycle expects scope to be discovered as the work "
        "proceeds, using short repeated cycles and treating change as normal. "
        "A predictive life cycle determines scope early and manages change "
        "formally against it. The choice follows from how well the work is "
        "understood beforehand -- the same question the development process "
        "models answer."),
]

LESSON_PM_FOUND = lesson(
    MAJOR, MIDDLE,
    "Project Management Foundations: Processes and Process Groups",
    _found_quiz,
    lesson_structure(
        "Project Management Foundations: Processes and Process Groups",
        "A project is temporary and produces something unique, which is what "
        "makes its estimates predictions rather than measurements. This "
        "lesson establishes the constraint relationship the whole category "
        "returns to -- scope, time and cost determine one another, so fixing "
        "all three means quality, risk or people absorb the variance with "
        "nobody having decided it -- along with the five process groups that "
        "overlap rather than follow one another, the charter that grants a "
        "project manager the authority to match their accountability, the "
        "predictive and adaptive life cycles, and the recurring failure "
        "causes, which are managerial far more often than technical.",
        [
            "Define a project and distinguish it from operations, programmes "
            "and portfolios",
            "Explain the constraint relationship and what absorbs pressure "
            "when all three are fixed",
            "Name the five process groups and explain why they are not "
            "stages",
            "Explain what monitoring and controlling is actually for",
            "State what a project charter establishes",
            "Distinguish predictive from adaptive life cycles",
            "Identify the recurring causes of project failure",
            "Distinguish an estimate from a commitment",
        ],
        75,
        _found_sections,
        [
            ("Project",
             "Temporary work producing a unique result, as against ongoing "
             "operations producing the same output."),
            ("Programme and portfolio",
             "Coordinating related projects for combined benefit; selecting "
             "which to undertake at all."),
            ("The constraints",
             "Scope, time and cost determine one another -- fix two and the "
             "third follows."),
            ("The silent casualties",
             "Quality, risk and people, which absorb variance when all three "
             "constraints are fixed."),
            ("Process groups",
             "Initiating, planning, executing, monitoring and controlling, "
             "closing -- overlapping and repeating."),
            ("Monitoring and controlling",
             "Comparing reality with the plan and taking corrective ACTION, "
             "of which reporting is half."),
            ("Project charter",
             "Authorises the project and grants the manager authority, "
             "including over resources."),
            ("Predictive life cycle",
             "Scope fixed early, phases sequential, change managed formally."),
            ("Adaptive life cycle",
             "Scope elaborated progressively in short cycles, with change "
             "expected."),
            ("Estimate against commitment",
             "A prediction against a promise. Requesting a smaller number "
             "changes the plan, not the work."),
        ],
        "A project is temporary and produces something unique, which is why "
        "its estimates are predictions rather than measurements -- and why "
        "programme management coordinates projects while portfolio management "
        "chooses among them. Its constraints determine one another: fix scope "
        "and time and the cost follows, and fixing all three means the "
        "variance still has to go somewhere. It goes into QUALITY, into risks "
        "accepted without assessment, and into people -- none of which "
        "anybody decided, all of which are discovered late, and each costing "
        "more than the explicit trade would have. Work is organised into five "
        "process groups that overlap and repeat rather than following one "
        "another, and monitoring and controlling is about corrective ACTION, "
        "so a report nobody acts on has done half a process. The charter "
        "authorises the project and, critically, grants the manager authority "
        "matching their accountability. Life cycles are predictive or "
        "adaptive by the same test the development process models use -- how "
        "well the work is understood beforehand. And the recurring causes of "
        "failure are managerial rather than technical: unclear objectives, "
        "weak sponsorship, estimates converted into commitments by being "
        "asked for firmly, risks written down and unmanaged, stakeholders "
        "disengaged, and scope growing unassessed.",
        exam_notes=[
            desc(
                "Items describe a project situation and ask what will happen "
                "or what was missing."
            ),
            ul([
                "Predicting the consequence of over-constraining a project.",
                "Explaining why adding people to a late project fails.",
                "Distinguishing project, programme and portfolio.",
                "Explaining why process groups are not stages.",
                "Stating what monitoring and controlling requires.",
                "Identifying what a charter must establish.",
                "Distinguishing estimates from commitments.",
            ]),
            desc(
                "When a project is over-constrained, ask what will absorb the "
                "pressure. The answer is never 'nothing', and naming the "
                "silent casualty -- quality, risk or people -- is what these "
                "items are testing."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Integration management
# ==========================================================================

_integ_sections = [
    ("Holding the Parts Together", [
        desc(
            "Every other knowledge area optimises something specific. "
            "Integration management is the work of making those separate "
            "optimisations into one coherent project."
        ),
        image(fig("process-groups")),
        desc(
            "It is the project manager's own work, and it is what nobody else "
            "does: the schedule team wants time, the quality team wants "
            "thoroughness, procurement wants clear specifications, and each "
            "is right about their own concern. Reconciling them is "
            "integration."
        ),
        table(
            ["Activity", "Produces"],
            [["Develop the charter", "Authority to proceed"],
             ["Develop the plan", "One plan, from many subsidiary ones"],
             ["Direct and manage the work", "Deliverables, and decisions"],
             ["Manage knowledge", "What was learned, made usable"],
             ["Monitor and control the work",
              "Corrective action, coherently applied"],
             ["Perform integrated change control",
              "Changes assessed across every area"],
             ["Close the project", "A genuine ending"]],
            caption="Seven integration activities across the life cycle.",
            footer="INTEGRATED CHANGE CONTROL is the one that fails most "
                   "visibly. A change assessed only for its schedule impact, "
                   "with nobody checking its effect on cost, risk and "
                   "quality, has been approved on incomplete information."),
    ]),

    ("The Project Management Plan", [
        desc(
            "Planning produces many documents, and integration produces the "
            "single plan they combine into."
        ),
        ul([
            "It incorporates the subsidiary plans -- scope, schedule, cost, "
            "quality, resource, communication, risk, procurement and "
            "stakeholder.",
            "It records the BASELINES against which performance is measured: "
            "scope, schedule and cost.",
            "It states how the project will be executed, monitored and "
            "changed.",
            "It is approved, and it changes only through change control.",
            "It is a working document rather than an artefact produced to "
            "satisfy a process.",
        ]),
        desc(
            "The BASELINES are what make monitoring possible. Measuring "
            "progress requires something to measure against, and a plan "
            "revised silently whenever reality diverges from it has stopped "
            "being a baseline -- which means variance can no longer be "
            "detected at all."
        ),
    ]),

    ("Integrated Change Control", [
        desc(
            "A change affects more than the area it was raised against, which "
            "is why the assessment has to cross every area."
        ),
        ol([
            "The change is requested and recorded.",
            "Its impact is assessed on SCOPE, SCHEDULE, COST, QUALITY, RISK "
            "and RESOURCES -- all of them.",
            "The assessment goes to whoever is authorised to decide, which "
            "depends on the size of the impact.",
            "The decision is recorded, including a rejection and its "
            "reasons.",
            "An approved change updates the baselines and every affected "
            "plan.",
        ]),
        desc(
            "Step two is the whole point of calling it INTEGRATED. A change "
            "that adds a week to the schedule may also introduce a risk, "
            "require a resource nobody has, and invalidate a test plan -- and "
            "approving it on the schedule impact alone means approving three "
            "consequences nobody looked at."
        ),
        desc(
            "Step five is what people forget. An approved change with the "
            "baselines left unchanged means the project is now measured "
            "against a plan that no longer reflects what was agreed, so every "
            "subsequent variance report is wrong."
        ),
    ]),

    ("Managing Knowledge", [
        desc(
            "Projects generate knowledge continuously and lose most of it, "
            "which the syllabus treats as a managed activity."
        ),
        compare_grid(
            "EXPLICIT AGAINST TACIT KNOWLEDGE",
            "What can be written down, and what has to be shared "
            "differently.",
            [("Explicit",
              ["Facts, decisions, procedures, figures",
               "Can be documented and read",
               "Transferred by writing it down",
               "Survives people leaving"]),
             ("Tacit",
              ["Judgement, context, how things really work here",
               "Difficult to articulate at all",
               "Transferred by working alongside somebody",
               "Leaves with the person"])]),
        desc(
            "The distinction matters because the responses differ. Explicit "
            "knowledge needs documentation and a place to put it; tacit "
            "knowledge needs pairing, mentoring and overlap -- and a project "
            "attempting to capture the second by writing more documents will "
            "produce documents that miss the point."
        ),
    ]),

    ("Closing", [
        desc(
            "Closing is a process rather than an event, and skipping it "
            "costs the organisation rather than the project."
        ),
        ul([
            "Confirm the deliverables were accepted, formally and by somebody "
            "authorised.",
            "Complete the contractual and financial closure, including "
            "supplier obligations.",
            "Release the resources deliberately, rather than letting people "
            "drift away.",
            "Archive the records where the organisation can find them.",
            "Capture the LESSONS, and put them where the next project will "
            "encounter them.",
        ]),
        desc(
            "The last point is the one that is done badly almost everywhere. "
            "Lessons recorded in a document nobody reads have been captured "
            "and not learned -- which is why the useful question is not "
            "whether lessons were written but what will cause the next "
            "project to see them."
        ),
    ]),

    ("Directing and Managing the Work", [
        desc(
            "Executing is where most of the budget goes, and integration's "
            "part in it is keeping the work coherent while it happens."
        ),
        ul([
            "Authorise work to begin, so effort is spent on what the plan "
            "actually calls for.",
            "Make the decisions the work generates, promptly, since a "
            "blocked team is expensive.",
            "Apply approved changes, and only approved changes.",
            "Collect the data monitoring needs, as the work happens rather "
            "than retrospectively.",
            "Manage the interfaces between teams, which is where nobody's "
            "responsibility naturally falls.",
        ]),
        desc(
            "The last point is the recurring one. Work that sits between two "
            "teams belongs to neither by default, so it is not done and "
            "nobody notices until it is needed -- and identifying those gaps "
            "is precisely what integration means during execution."
        ),
    ]),

    ("Work Performance Data, Information and Reports", [
        desc(
            "The syllabus distinguishes three things that are all loosely "
            "called reporting, and the distinction is examined."
        ),
        table(
            ["", "Is", "Example"],
            [["Work performance DATA", "Raw observations",
              "Fourteen tasks complete; 320 hours spent"],
             ["Work performance INFORMATION",
              "Data analysed against the baselines",
              "Two weeks behind schedule; 8% over budget"],
             ["Work performance REPORTS",
              "Information assembled for a decision",
              "A status report recommending a scope reduction"]],
            caption="Three stages, from observation to a decision.",
            footer="DATA answers nothing on its own. 320 hours spent is "
                   "neither good nor bad until it is compared with what was "
                   "planned for the work actually completed -- which is the "
                   "step reporting most often skips."),
        desc(
            "The progression matters because each stage adds something. "
            "Circulating raw data leaves every recipient to analyse it "
            "themselves, usually inconsistently; a report that recommends "
            "nothing leaves the decision to be invented in a meeting."
        ),
    ]),

    ("Managing Assumptions and Constraints", [
        desc(
            "Every plan rests on things believed rather than known, and "
            "recording them is what makes a later surprise traceable."
        ),
        ol([
            "Record each assumption when the plan depends on it.",
            "Give each an owner who will notice if it stops being true.",
            "Review them periodically, since an assumption believed for six "
            "months is not thereby correct.",
            "Convert assumptions into facts where the cost of checking is "
            "less than the cost of being wrong.",
            "Treat a failed assumption as a change to be assessed, not as an "
            "unavoidable event.",
        ]),
        desc(
            "The fourth point is the one worth acting on. Many assumptions "
            "can simply be checked -- a supplier's lead time, a system's "
            "actual capacity, whether a team will really be available -- and "
            "checking early converts a risk into a fact at a fraction of the "
            "cost of discovering it late."
        ),
    ]),

    ("Project Records", [
        desc(
            "Integration produces documents whose value is mostly realised "
            "after the project ends."
        ),
        table(
            ["Record", "Used later by"],
            [["The plan and its baselines",
              "Anybody establishing what was agreed"],
             ["The change log", "Anybody asking why the scope differs"],
             ["The issue and risk logs",
              "The next project facing similar conditions"],
             ["Decisions and their reasons",
              "Whoever proposes the rejected alternative in two years"],
             ["Actual effort and duration",
              "Whoever estimates the next comparable project"]],
            caption="Five records and who eventually needs each.",
            footer="The last row is the one organisations most often fail to "
                   "keep. Estimating by analogy requires knowing what "
                   "comparable work actually took, and a project recording "
                   "only what it planned has preserved the guess and "
                   "discarded the measurement."),
        desc(
            "This is the same argument the development category makes about "
            "decision records: the cost of writing is small and immediate, "
            "the cost of not having it is large and deferred -- which is "
            "precisely the shape of thing that gets deprioritised."
        ),
    ]),

    ("Phases and Gates", [
        desc(
            "Larger projects are divided into phases, and the boundaries are "
            "where integration does some of its most valuable work."
        ),
        table(
            ["At a phase boundary", "Because"],
            [["Confirm the phase's deliverables are complete",
              "The next phase depends on them"],
             ["Re-examine the business case",
              "Circumstances change, and so does the justification"],
             ["Reassess the risks", "New ones appear with new work"],
             ["Update the plan for the next phase in detail",
              "Detail was impossible earlier and is available now"],
             ["Decide explicitly whether to continue",
              "Continuing should be a decision, not a default"]],
            caption="Five things a phase boundary is for.",
            footer="PROGRESSIVE ELABORATION is why the fourth row works. The "
                   "next phase can be planned in detail now because the "
                   "previous one produced the information that was missing -- "
                   "which is why planning the whole project in detail at the "
                   "start is precision without accuracy."),
        desc(
            "The last row is what makes a gate more than a milestone. If "
            "stopping is not genuinely available, the review costs time and "
            "changes nothing -- and the money already spent is not a reason "
            "to continue, however strongly it argues."
        ),
    ]),

    ("Issues", [
        desc(
            "An issue is something that has already gone wrong, as distinct "
            "from a risk, which might."
        ),
        table(
            ["", "Risk", "Issue"],
            [["Status", "Has not happened", "Has happened"],
             ["Managed by", "A response plan and a trigger",
              "Resolution, now"],
             ["Recorded in", "The risk register", "The issue log"],
             ["Owner does", "Watches, and acts if it occurs",
              "Resolves it, or escalates"]],
            caption="Two logs that are frequently merged and should not be.",
            footer="A risk that occurs BECOMES an issue and moves between the "
                   "logs, which is the relationship between them. Merging the "
                   "two loses the distinction between what needs watching and "
                   "what needs doing now."),
        desc(
            "Every issue needs an owner and a date, or the log becomes a list "
            "of things everybody has read and nobody is resolving. "
            "Escalation is part of the process rather than a failure of it: "
            "an issue beyond the project's authority belongs with whoever "
            "does have the authority."
        ),
    ]),

    ("Tailoring the Approach", [
        desc(
            "The processes described here are a superset, and applying all of "
            "them to every project would consume more than they return."
        ),
        ol([
            "Assess the project's size, risk, and how much is genuinely "
            "uncertain.",
            "Select the processes proportionate to that, rather than "
            "performing all of them lightly.",
            "Document what was tailored and why, so the omission is a "
            "decision rather than a gap.",
            "Keep the processes that manage the project's actual risks, "
            "whatever their formality elsewhere.",
            "Revisit if the project changes character, since a small project "
            "that grows needs more than it started with.",
        ]),
        desc(
            "The judgement being tested is that formality should match the "
            "stakes. Heavy process on a small project consumes its budget and "
            "teaches everybody that process is overhead; light process on a "
            "large one leaves the risks unmanaged -- and both errors are "
            "committed by organisations applying one standard uniformly."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where integration items are lost."),
        ul([
            "Assessing a change only against the area it was raised in.",
            "Approving a change without updating the baselines, so all later "
            "variance reporting is wrong.",
            "Revising a baseline silently when reality diverges, which "
            "removes the ability to detect variance.",
            "Treating the plan as a document produced to satisfy a process "
            "rather than as a working tool.",
            "Attempting to capture tacit knowledge by writing more "
            "documents.",
            "Letting a project end by attrition rather than closing it.",
            "Recording lessons somewhere the next project will never "
            "encounter them.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A change is approved on the basis of its schedule impact "
            "alone. Two months later the project is over budget and a test "
            "phase has been abandoned. What went wrong?\""
        ),
        ol([
            "Identify the process: integrated change control, which requires "
            "assessment across every knowledge area.",
            "The assessment covered schedule only, so cost, quality, risk and "
            "resource impacts were never examined.",
            "Those impacts did not disappear -- they arrived later, "
            "unattributed to the change that caused them.",
            "The budget overrun and the abandoned testing are those "
            "consequences, appearing as separate problems.",
            "The remedy is assessing every change across all areas before "
            "approval, and updating each affected baseline afterwards.",
        ]),
        desc(
            "The reason this item works is that the failure is invisible when "
            "it happens and unattributable when it surfaces. Nobody "
            "experiences the moment of approving three unexamined "
            "consequences; they experience a budget problem two months later "
            "that appears to have no cause."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Integration is what the other knowledge areas feed."),
        ul([
            "Every subsidiary plan comes from its own knowledge area lesson.",
            "Baselines are the configuration management discipline of "
            "Development Technology.",
            "Change control is the same process that category applies to "
            "software.",
            "Lessons captured at closing feed the process improvement of the "
            "quality lesson.",
            "Tacit knowledge loss is the maintenance concern of the "
            "development category.",
            "Benefits confirmation after closure belongs to System "
            "Strategy.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What integration management is",
              "Reconciling the other areas into one coherent project",
              "It is the project manager's own work, and nobody else does "
              "it."),
             ("What makes change control INTEGRATED",
              "Assessment across every area, not only the one raised",
              "A schedule-only assessment approves consequences nobody "
              "looked at."),
             ("What an approved change must update",
              "The baselines and every affected plan",
              "Otherwise all later variance reporting is measured against "
              "something superseded."),
             ("Why baselines must not be revised silently",
              "Variance can no longer be detected",
              "A plan that changes to match reality is not a baseline."),
             ("Explicit against tacit knowledge",
              "Writable down, against transferred by working alongside",
              "Trying to document the second produces documents that miss "
              "the point."),
             ("What makes a lesson learned rather than captured",
              "Something causing the next project to encounter it",
              "A document nobody reads has captured it and taught "
              "nobody.")]),
    ]),
]

_integ_quiz = [
    mcq("HARD",
        "A change is approved on its schedule impact alone. Later the project "
        "is over budget and a test phase has been abandoned.\n\n"
        "What failed?",
        [("Integrated change control -- the change was not assessed across "
          "all areas", True),
         ("Schedule management, since the estimated impact was "
          "wrong", False),
         ("Cost management, since the budget was not monitored "
          "closely", False),
         ("Quality management, since testing should not have been "
          "abandoned", False)],
        "A change affects scope, schedule, cost, quality, risk and resources "
        "together, and assessing only one means approving the others "
        "unexamined. Those consequences arrive later, appearing as separate "
        "problems with no visible cause -- which is what makes this failure "
        "so hard to see at the time and so hard to attribute afterwards."),

    mcq("AVERAGE",
        "What must happen after a change request is approved?",
        [("The baselines and every affected plan are updated", True),
         ("The original estimates are recalculated from scratch", False),
         ("The change is implemented before further changes are "
          "considered", False),
         ("The sponsor is notified that the scope has increased", False)],
        "An approved change that leaves the baselines unchanged means the "
        "project is now measured against a plan that no longer reflects what "
        "was agreed -- so every subsequent variance report is wrong, showing "
        "overruns that were actually authorised. Updating the baselines is "
        "what makes the approval real rather than notional."),

    mcq("HARD",
        "Why must a baseline not be quietly revised when reality diverges "
        "from it?",
        [("Variance can no longer be detected, since the reference moves with "
          "reality", True),
         ("Auditors require baselines to remain unchanged throughout the "
          "project", False),
         ("Revising a baseline invalidates the estimates the plan was built "
          "from", False),
         ("Stakeholders lose confidence when the plan is seen to "
          "change", False)],
        "A baseline is the fixed reference performance is measured against. "
        "One that moves to match whatever happened always shows zero variance "
        "and therefore reports nothing. Baselines DO change -- through change "
        "control, deliberately and visibly -- and the distinction between "
        "that and quiet revision is the whole of the discipline."),

    mcq("AVERAGE",
        "What is integration management principally concerned with?",
        [("Reconciling the other knowledge areas into one coherent "
          "project", True),
         ("Combining the deliverables of separate teams into one "
          "system", False),
         ("Integrating the project's outputs with existing operational "
          "systems", False),
         ("Coordinating several related projects within a "
          "programme", False)],
        "Each knowledge area optimises its own concern -- schedule wants "
        "time, quality wants thoroughness, procurement wants clear "
        "specifications -- and each is right about its own. Making those "
        "separate optimisations into one coherent project is integration, and "
        "it is the project manager's own work. Coordinating several projects "
        "is programme management."),

    mcq("HARD",
        "Knowledge about how things really work in a particular organisation "
        "is difficult to write down.\n\nWhat kind is it, and how does it "
        "transfer?",
        [("Tacit, transferred by working alongside somebody", True),
         ("Explicit, transferred by documenting it thoroughly", False),
         ("Tacit, transferred by recording it in lessons "
          "learned", False),
         ("Explicit, transferred through formal training courses", False)],
        "Tacit knowledge is judgement and context that resists articulation, "
        "so it moves by pairing, mentoring and overlapping work rather than "
        "by documentation. A project attempting to capture it by writing more "
        "documents produces documents that miss what mattered -- which is why "
        "the two kinds get different responses rather than more of the same "
        "one."),

    mcq("AVERAGE",
        "What distinguishes a lesson that has been learned from one that has "
        "been captured?",
        [("Something causes the next project to encounter it", True),
         ("It is recorded in the organisation's project "
          "repository", False),
         ("It was reviewed and agreed by the whole project team", False),
         ("It identifies a specific corrective action rather than an "
          "observation", False)],
        "Recording a lesson costs a meeting and achieves nothing by itself, "
        "since the next project's team will not go looking for it. The useful "
        "question is what mechanism -- a checklist, a standard, a review gate "
        "-- will put it in front of somebody who needs it, which is a "
        "different and harder problem than writing it down."),

    mcq("HARD",
        "Why is closing a project properly worth the effort when the "
        "deliverables are already accepted?",
        [("The organisation loses resources, records and learning if the "
          "project ends by attrition", True),
         ("Contracts cannot be terminated until formal closure is "
          "recorded", False),
         ("Acceptance is not legally binding without a closure "
          "document", False),
         ("The project manager's performance is assessed at "
          "closure", False)],
        "The project's own objective is met; what remains is the "
        "organisation's interest -- resources released deliberately rather "
        "than drifting, contracts and finances settled, records archived "
        "somewhere findable, and lessons placed where they will be "
        "encountered. A project that fades out leaves all of that undone and "
        "nobody accountable for it."),

    mcq("AVERAGE",
        "Which baselines does the project management plan record?",
        [("Scope, schedule and cost", True),
         ("Scope, quality and risk", False),
         ("Schedule, cost and resource", False),
         ("Scope, schedule and quality", False)],
        "The three performance baselines are scope, schedule and cost, "
        "because those are the dimensions against which progress is measured "
        "and variance calculated. Quality, risk and resources have management "
        "plans rather than baselines -- they are governed by criteria and "
        "processes rather than measured as variance from a fixed reference."),

    mcq("HARD",
        "A project's plan is produced to satisfy the organisation's process "
        "and then not consulted.\n\nWhat is lost?",
        [("The reference that makes variance visible and decisions "
          "consistent", True),
         ("Compliance with the organisation's project management "
          "standard", False),
         ("The stakeholder agreement the plan's approval "
          "represented", False),
         ("The estimates on which the schedule was based", False)],
        "A plan's value is operational: it is what current reality is "
        "compared against, and what decisions are made consistent with. "
        "Produced and shelved, it satisfies a process and provides none of "
        "that -- so variance goes undetected and each decision is made afresh "
        "on whatever seems reasonable that day."),

    mcq("AVERAGE",
        "Which integration activity produces the project charter?",
        [("Developing the charter, within the initiating group", True),
         ("Developing the project management plan, within "
          "planning", False),
         ("Directing and managing the work, within executing", False),
         ("Performing integrated change control, within "
          "monitoring", False)],
        "The charter is the output of initiating: it authorises the project, "
        "names the manager and states their authority, and is issued by "
        "somebody able to commit the organisation's resources. Everything "
        "else in integration management depends on it existing, since without "
        "authority the plan cannot be executed."),
]

LESSON_PM_INTEG = lesson(
    MAJOR, MIDDLE,
    "Project Integration Management",
    _integ_quiz,
    lesson_structure(
        "Project Integration Management",
        "Every other knowledge area optimises its own concern, and each is "
        "right about it -- so integration management is the work of "
        "reconciling them into one coherent project, which is the project "
        "manager's own job and which nobody else does. This lesson covers the "
        "single plan the subsidiary plans combine into and the baselines that "
        "make variance detectable, integrated change control and why "
        "assessing a change against one area alone approves consequences "
        "nobody examined, the explicit and tacit knowledge that need "
        "different responses, and closing as a process whose omission costs "
        "the organisation rather than the project.",
        [
            "Explain what integration management reconciles",
            "Describe the project management plan and the baselines it "
            "records",
            "Explain why baselines must not be revised silently",
            "Apply integrated change control across all knowledge areas",
            "Explain what must be updated after a change is approved",
            "Distinguish explicit from tacit knowledge and their transfer",
            "Describe project closing and what it protects",
            "Explain what makes a lesson learned rather than captured",
        ],
        75,
        _integ_sections,
        [
            ("Integration management",
             "Reconciling the knowledge areas into one coherent project. The "
             "project manager's own work."),
            ("Project management plan",
             "The subsidiary plans combined, with the scope, schedule and "
             "cost baselines."),
            ("Baseline",
             "The fixed reference performance is measured against. Changed "
             "through control, never quietly."),
            ("Integrated change control",
             "Assessing a change across scope, schedule, cost, quality, risk "
             "and resources together."),
            ("Explicit knowledge",
             "Facts and decisions that can be documented and survive people "
             "leaving."),
            ("Tacit knowledge",
             "Judgement and context, transferred by working alongside rather "
             "than by writing."),
            ("Project closing",
             "Formal acceptance, contractual and financial closure, resource "
             "release, archiving and lessons."),
            ("Lesson learned",
             "One that something will cause the next project to encounter -- "
             "as against merely recorded."),
        ],
        "Integration management reconciles knowledge areas that each optimise "
        "their own concern correctly, and it is the project manager's own "
        "work. Its central artefact is one plan combining the subsidiary "
        "ones, carrying the scope, schedule and cost BASELINES -- the fixed "
        "references that make variance visible, which is why a baseline "
        "quietly revised to match reality has stopped being one and reports "
        "nothing. Its central process is INTEGRATED change control, where a "
        "change is assessed across scope, schedule, cost, quality, risk and "
        "resources together: assessing only the area it was raised against "
        "approves consequences nobody examined, which then arrive months "
        "later as separate problems with no visible cause. An approved change "
        "must also update every affected baseline, or all subsequent variance "
        "reporting measures against something superseded. Knowledge divides "
        "into explicit, which documentation transfers, and TACIT, which moves "
        "only by working alongside somebody -- so attempting to document the "
        "second produces documents that miss the point. And closing protects "
        "the organisation rather than the project: resources released "
        "deliberately, records archived findably, and lessons put where the "
        "next project will actually encounter them, since a document nobody "
        "reads has captured a lesson and taught nobody.",
        exam_notes=[
            desc(
                "Items describe a consequence appearing later and ask which "
                "integration activity was inadequate."
            ),
            ul([
                "Diagnosing a change assessed against one area only.",
                "Stating what an approved change must update.",
                "Explaining why baselines must not move silently.",
                "Distinguishing explicit from tacit knowledge.",
                "Naming the three performance baselines.",
                "Explaining what closing protects.",
                "Distinguishing a captured lesson from a learned one.",
            ]),
            desc(
                "When a problem appears with no apparent cause, look for a "
                "decision taken earlier on partial information. Integration "
                "failures are invisible when they happen and unattributable "
                "when they surface, which is exactly the shape these items "
                "describe."
            ),
        ],
    ))

# ==========================================================================
# Lesson 3: Stakeholder management
# ==========================================================================

_stake_sections = [
    ("Who Can Affect the Project", [
        desc(
            "A stakeholder is anyone who affects the project or is affected "
            "by it, and the definition is deliberately wide."
        ),
        table(
            ["Stakeholder", "Cares about", "Overlooked because"],
            [["Sponsor", "The benefits, and the investment",
              "Assumed to be engaged, and often is not"],
             ["Users", "Whether their work becomes easier",
              "Consulted late, or represented by somebody else"],
             ["Operations", "Whether they can run it",
              "Not part of the delivery"],
             ["Suppliers", "Their own obligations and payment",
              "Treated as contracts rather than participants"],
             ["Regulators and auditors", "Compliance and evidence",
              "Their requirements arrive as constraints"],
             ["Those who lose from it", "Preventing or delaying it",
              "Nobody wants to name them"]],
            caption="Six groups, and why each gets missed.",
            footer="The last row matters and is uncomfortable. A project "
                   "changing how work is done affects people whose roles it "
                   "reduces, and pretending otherwise does not make their "
                   "influence go away."),
    ]),

    ("Identifying Them", [
        desc(
            "Stakeholder identification is a deliberate activity performed "
            "early and repeated, not a list written once."
        ),
        ol([
            "Start from the charter and the scope: who is affected by what "
            "this will change.",
            "Ask existing stakeholders who else is affected, which "
            "consistently finds people the project would not have.",
            "Include the organisations outside the project -- suppliers, "
            "customers, regulators.",
            "Record each with their interest, their influence, and what they "
            "need from the project.",
            "Revisit as the project proceeds, since new stakeholders appear "
            "with new phases.",
        ]),
        desc(
            "Step five is where the register goes stale. A deployment phase "
            "involves operations staff who were irrelevant during design, and "
            "a project that identified stakeholders once meets them for the "
            "first time when it needs their cooperation."
        ),
    ]),

    ("Analysing Influence and Interest", [
        desc(
            "Effort is finite, so it is directed by how much each stakeholder "
            "can affect the project and how much they care."
        ),
        image(fig("stakeholder-grid")),
        table(
            ["Influence", "Interest", "Approach"],
            [["High", "High", "Manage closely -- involve in decisions"],
             ["High", "Low", "Keep satisfied -- brief enough to avoid "
                             "surprise"],
             ["Low", "High", "Keep informed -- and use as a source"],
             ["Low", "Low", "Monitor -- with minimal effort"]],
            caption="Four quadrants and the approach each argues for.",
            footer="The HIGH INFLUENCE, LOW INTEREST quadrant is the one "
                   "projects mishandle. Somebody with authority who has heard "
                   "nothing becomes extremely interested the moment something "
                   "goes wrong -- and their first impression is a problem."),
        desc(
            "Influence and interest both change. A stakeholder who was "
            "peripheral becomes central when the project reaches their area, "
            "which is why the analysis is repeated rather than performed "
            "once."
        ),
    ]),

    ("Engagement", [
        desc(
            "Analysis is only useful if it changes what the project actually "
            "does with each group."
        ),
        content_accordion(
            "FIVE LEVELS OF ENGAGEMENT",
            "Where a stakeholder is, and where the project needs them to be.",
            [("Unaware",
              "They do not know the project exists. Common, and the easiest "
              "to remedy -- provided somebody notices."),
             ("Resistant",
              "Aware, and opposed. Requires understanding WHY, since "
              "resistance usually reflects a real interest rather than "
              "obstinacy."),
             ("Neutral",
              "Aware and neither supporting nor opposing. Acceptable for many "
              "stakeholders and insufficient for those whose active help is "
              "needed."),
             ("Supportive",
              "Aware and in favour, without being actively involved. Adequate "
              "for most."),
             ("Leading",
              "Actively working to make the project succeed. Needed from the "
              "sponsor and from key users, and rarely from anybody else.")]),
        desc(
            "The useful analysis compares CURRENT engagement with what the "
            "project NEEDS from each stakeholder. A resistant person whose "
            "cooperation is essential requires action; a neutral one whose "
            "cooperation is not needed requires nothing, and effort spent "
            "moving them is effort taken from elsewhere."
        ),
    ]),

    ("Working With Resistance", [
        desc(
            "Resistance is information rather than an obstacle, and treating "
            "it as an obstacle guarantees it persists."
        ),
        ul([
            "Find out WHY. Resistance usually reflects a genuine interest "
            "being threatened, which is a fact about the project.",
            "Some concerns are correct, and a project that treats every "
            "objection as opposition loses the ones worth acting on.",
            "Some reflect a loss the project genuinely imposes, which cannot "
            "be argued away and can be handled honestly.",
            "Some come from not being consulted, which is remedied by "
            "consulting.",
            "Escalate only where a resolution is genuinely beyond the "
            "project, since escalation spends credibility.",
        ]),
        desc(
            "The second point is the one worth carrying. The most costly "
            "response to resistance is dismissing it, because it discards the "
            "objections that were right along with the ones that were not -- "
            "and those tend to be the ones an informed stakeholder was best "
            "placed to see."
        ),
    ]),

    ("Expectations", [
        desc(
            "Stakeholders arrive with expectations that may differ from what "
            "the project agreed to deliver, and the gap is managed rather "
            "than assumed away."
        ),
        ul([
            "Expectations form from what people heard early, which may not "
            "have been accurate even then.",
            "They persist unless deliberately corrected, and correcting them "
            "early is far easier than at delivery.",
            "An expectation nobody stated cannot be met or corrected, so "
            "surfacing them is part of the work.",
            "The gap between expectation and agreed scope is a communication "
            "problem before it becomes a satisfaction problem.",
        ]),
        desc(
            "This is why a stakeholder can be disappointed by a project that "
            "delivered exactly what was agreed. Satisfaction is measured "
            "against expectation rather than against the specification -- so "
            "managing the expectation is as much a deliverable as the system "
            "is."
        ),
    ]),

    ("Building Agreement", [
        desc(
            "Where stakeholders want incompatible things, somebody has to "
            "produce a decision that holds."
        ),
        ol([
            "Establish what each party actually needs, as distinct from the "
            "solution each is proposing.",
            "Look for options meeting both underlying needs, which the stated "
            "positions frequently conceal.",
            "Where none exists, make the trade-off explicit and put it to "
            "somebody with the authority to decide.",
            "Record the decision and its reasoning, including what was not "
            "chosen.",
            "Communicate it to both parties directly rather than leaving one "
            "to discover it.",
        ]),
        desc(
            "Step one is the technique that resolves most apparent conflicts. "
            "Two departments arguing about a screen layout may both need "
            "something the layout was a proxy for, and the underlying needs "
            "are often compatible even when the proposals are not."
        ),
    ]),

    ("Communication and Culture", [
        desc(
            "Stakeholder engagement crosses organisational and sometimes "
            "national boundaries, and what works in one setting can fail in "
            "another."
        ),
        table(
            ["Difference", "Effect on engagement"],
            [["Directness of communication",
              "A clear 'no' in one culture is rudeness in another"],
             ["Attitude to hierarchy",
              "Whether a junior person will contradict a senior one"],
             ["Relationship to time",
              "Whether a deadline is a commitment or an aspiration"],
             ["Written against spoken agreement",
              "Whether a meeting or a document is what binds"],
             ["Individual against group decisions",
              "Who must be consulted before anything is agreed"]],
            caption="Five differences that affect how engagement works.",
            footer="The second row has a practical consequence for risk. "
                   "Where contradicting a senior person is difficult, bad "
                   "news travels slowly upward -- so it must be actively "
                   "sought rather than waited for."),
        desc(
            "The general principle is that silence is not agreement. In some "
            "settings it means assent, in others it means unwillingness to "
            "object publicly -- and a project that reads it uniformly as the "
            "first will be surprised."
        ),
    ]),

    ("Tracking Engagement", [
        desc(
            "Stakeholder work is easy to defer because nothing appears to go "
            "wrong until it does, which is why it is recorded and reviewed "
            "like anything else."
        ),
        ul([
            "Keep a register: who they are, their interest, their influence, "
            "their current and required engagement.",
            "Record what has been communicated to whom, so gaps are visible "
            "rather than assumed.",
            "Review it at each phase boundary, when both the stakeholders and "
            "their interests change.",
            "Treat a required engagement not being reached as an ISSUE with "
            "an owner, not as a background concern.",
        ]),
        desc(
            "The last point is what converts stakeholder management from "
            "intention into action. 'We should talk to them' has no owner and "
            "no date; an issue does, and it is reviewed until it is closed."
        ),
    ]),

    ("The Project Manager as a Stakeholder Channel", [
        desc(
            "Much stakeholder work is done by the project manager personally, "
            "and it has a shape worth naming."
        ),
        compare_grid(
            "TWO DIRECTIONS OF THE SAME ROLE",
            "Information flows both ways, and both need managing.",
            [("Outward -- to stakeholders",
              ["Status, honestly and at the right level of detail",
               "Decisions taken and what they mean for each group",
               "Early warning, so nothing is a surprise",
               "Requests for decisions the project cannot make"]),
             ("Inward -- from stakeholders",
              ["What they actually need, as distinct from what they ask for",
               "Changing circumstances the project has not seen",
               "Objections, while they are still cheap to address",
               "Knowledge the project does not have"])]),
        desc(
            "The inward direction is the one that gets neglected, because it "
            "produces no visible output. A project manager who only "
            "broadcasts has half a channel, and the half they are missing is "
            "the one that would have told them something in time."
        ),
    ]),

    ("Users as a Special Case", [
        desc(
            "Users are the stakeholder group whose engagement determines "
            "whether the delivered system is actually used."
        ),
        ul([
            "They have the most detailed knowledge of the work and the least "
            "formal influence over the project.",
            "They experience the change directly, which makes their concerns "
            "concrete rather than abstract.",
            "Their involvement in design produces better systems AND makes "
            "adoption easier, which are separate benefits.",
            "Involving them late is worse than not involving them, since it "
            "invites contributions nothing can act on.",
        ]),
        desc(
            "The last point is worth stating clearly. Asking for input the "
            "project cannot use spends the user's time and produces "
            "resentment, so consultation should either be early enough to "
            "change something or honest about what is already fixed."
        ),
    ]),

    ("Handover to Business as Usual", [
        desc(
            "A project's stakeholders become an operational service's users "
            "and owners, and the transition is a stakeholder event as much as "
            "a technical one."
        ),
        compare_grid(
            "WHAT CHANGES AT HANDOVER",
            "The same people, in a different relationship.",
            [("During the project",
              ["A project manager they can escalate to",
               "A team that knows why things are as they are",
               "Changes handled by the project's change control",
               "Attention proportionate to the project's priority"]),
             ("Afterwards",
              ["A support function with defined service levels",
              "People who inherited the system without the history",
               "Changes competing with everything else in the queue",
               "Attention proportionate to the incident's severity"])]),
        desc(
            "Setting that expectation before handover prevents the "
            "characteristic disappointment: a stakeholder accustomed to a "
            "responsive project team meets a support queue and reads it as a "
            "decline in service rather than as the normal operating "
            "arrangement it was always going to become."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where stakeholder items are lost."),
        ul([
            "Identifying stakeholders once and not revisiting as phases "
            "change.",
            "Neglecting the high influence, low interest group until "
            "something goes wrong.",
            "Omitting operations, regulators, or those who lose from the "
            "project.",
            "Treating resistance as obstruction rather than as information "
            "about a real interest.",
            "Spending engagement effort where the project does not actually "
            "need it.",
            "Assuming the sponsor is engaged because they approved the "
            "charter.",
            "Confusing a stakeholder representative with the stakeholders "
            "they represent.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"Late in a project, a senior manager who has received no "
            "communication raises objections that delay deployment. What was "
            "the failure?\""
        ),
        ol([
            "Identify the stakeholder's position: high influence, and "
            "previously low interest.",
            "That quadrant requires keeping them SATISFIED -- informed enough "
            "never to be surprised.",
            "They received nothing, so the first thing they heard about the "
            "project was at the point it affected them.",
            "Somebody with authority whose first impression is a surprise "
            "will exercise that authority, which is exactly what happened.",
            "The failure is in engagement planning rather than in the "
            "manager's behaviour -- periodic brief communication would have "
            "cost almost nothing and prevented it entirely.",
        ]),
        desc(
            "Step five is what these items reward. The stakeholder acted "
            "reasonably given what they knew, so attributing the delay to "
            "them misses the point: the project controlled what they knew, "
            "and did not use that control."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Stakeholder management touches most of the category."),
        ul([
            "Stakeholder identification is where requirements elicitation "
            "begins, in Development Technology.",
            "Operations as an overlooked group recurs in the acceptance and "
            "handover lesson.",
            "Communication planning is the next lesson but one.",
            "Sponsor engagement is what the charter's authority depends on.",
            "Resistance reflecting real interests is organisational change "
            "management, in Business Strategy.",
            "Regulatory stakeholders bring the obligations of Legal "
            "Affairs.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Who counts as a stakeholder",
              "Anyone who affects the project or is affected by it",
              "Deliberately wide, and it includes those who lose from it."),
             ("The quadrant projects mishandle",
              "High influence, low interest",
              "Brief them enough that their first impression is never a "
              "problem."),
             ("Why the register goes stale",
              "New phases bring new stakeholders",
              "Operations are irrelevant during design and essential at "
              "deployment."),
             ("What engagement analysis compares",
              "Current engagement against what the project NEEDS",
              "Moving somebody the project does not need is effort taken from "
              "elsewhere."),
             ("What resistance usually reflects",
              "A genuine interest being threatened",
              "Which makes it information about the project rather than an "
              "obstacle."),
             ("The costliest response to an objection",
              "Dismissing it",
              "It discards the objections that were right along with the "
              "others.")]),
    ]),
]

_stake_quiz = [
    mcq("HARD",
        "Late in a project, a senior manager who has received no "
        "communication raises objections that delay deployment.\n\n"
        "What was the failure?",
        [("Engagement planning -- a high-influence stakeholder was left "
          "uninformed", True),
         ("Scope management -- the manager's requirements were never "
          "captured", False),
         ("The manager's behaviour, in raising objections at the last "
          "moment", False),
         ("Risk management -- the objection should have been recorded as a "
          "risk", False)],
        "Somebody with high influence and previously low interest must be "
        "kept satisfied -- informed enough never to be surprised. Receiving "
        "nothing, their first encounter with the project was at the point it "
        "affected them, and somebody with authority whose first impression is "
        "a surprise uses that authority. The project controlled what they "
        "knew and did not use that control."),

    mcq("AVERAGE",
        "Which stakeholder group is most often mishandled?",
        [("High influence and low interest", True),
         ("High influence and high interest", False),
         ("Low influence and high interest", False),
         ("Low influence and low interest", False)],
        "High interest stakeholders make themselves known, and low influence "
        "ones cannot do much harm. Somebody with authority who is not "
        "currently interested receives nothing -- and becomes extremely "
        "interested the moment something affects them, at which point their "
        "first impression is a problem. Periodic brief communication prevents "
        "it almost free."),

    mcq("HARD",
        "A stakeholder is resistant to the project.\n\nWhat is the most "
        "productive first response?",
        [("Establish why, since resistance usually reflects a real interest "
          "being threatened", True),
         ("Escalate to the sponsor for a decision that overrides the "
          "resistance", False),
         ("Increase the frequency of communication until the concerns "
          "subside", False),
         ("Document the resistance as a risk and monitor its "
          "effect", False)],
        "Resistance is information about the project: sometimes a correct "
        "objection, sometimes a genuine loss the project imposes, sometimes "
        "simply the effect of not having been consulted -- and each needs a "
        "different response. Dismissing it discards the objections that were "
        "right, which tend to come from the people best placed to see them."),

    mcq("AVERAGE",
        "Why must stakeholder identification be repeated during a project?",
        [("New phases bring stakeholders who were irrelevant "
          "earlier", True),
         ("Stakeholders change roles within the organisation over "
          "time", False),
         ("The register must be reviewed to satisfy governance "
          "requirements", False),
         ("Initial identification is typically performed too "
          "quickly", False)],
        "Operations staff are irrelevant during design and essential at "
        "deployment; regulators become relevant when a particular feature "
        "appears. A project identifying stakeholders once meets several of "
        "them for the first time at the moment it needs their cooperation, "
        "which is the worst point at which to begin a relationship."),

    mcq("AVERAGE",
        "What does engagement analysis compare?",
        [("Each stakeholder's current engagement against what the project "
          "needs", True),
         ("Each stakeholder's influence against their level of "
          "interest", False),
         ("The communication planned against the communication "
          "delivered", False),
         ("Stakeholder expectations against the project's agreed "
          "scope", False)],
        "Knowing somebody is neutral is useful only against a judgement of "
        "what the project requires from them. A neutral stakeholder whose "
        "active help is unnecessary needs no action, and effort spent moving "
        "them is taken from a resistant stakeholder whose cooperation is "
        "essential. Influence against interest is the earlier analysis that "
        "prioritises attention."),

    mcq("HARD",
        "Which stakeholder group do projects most consistently omit "
        "entirely?",
        [("Those whose roles the project reduces or eliminates", True),
         ("The sponsor funding the project's delivery", False),
         ("End users of the delivered system", False),
         ("The development team building the system", False)],
        "A project that changes how work is done affects people who lose from "
        "it, and naming them is uncomfortable enough that projects often do "
        "not -- which does nothing to reduce their influence and leaves the "
        "project unprepared for opposition it could have anticipated. "
        "Operations is the other consistently omitted group."),

    mcq("AVERAGE",
        "What level of engagement is required from a project sponsor?",
        [("Leading -- actively working to make the project "
          "succeed", True),
         ("Supportive -- in favour without being actively "
          "involved", False),
         ("Neutral -- neither supporting nor opposing", False),
         ("Aware -- informed of progress at agreed intervals", False)],
        "The sponsor is accountable for the benefits and holds the authority "
        "to resolve what the project cannot, so passive support is "
        "insufficient. Leading engagement is needed from the sponsor and key "
        "users and rarely from anybody else -- and assuming a sponsor is "
        "engaged because they approved the charter is a common and costly "
        "error."),

    mcq("HARD",
        "A project consults a nominated user representative throughout, and "
        "the delivered system is rejected by users.\n\n"
        "What may have gone wrong?",
        [("The representative's view did not reflect the users they "
          "represented", True),
         ("The representative lacked the authority to approve "
          "requirements", False),
         ("Consultation was too frequent, producing inconsistent "
          "direction", False),
         ("The users were not identified as stakeholders in the "
          "register", False)],
        "A representative is a channel to stakeholders rather than a "
        "substitute for them, and one who is unrepresentative, out of touch "
        "with current practice, or expressing their own preferences gives the "
        "project a confident and wrong picture. Validating with actual users "
        "-- observation, demonstrations, a pilot -- is what catches it."),

    mcq("AVERAGE",
        "How should effort be allocated to a stakeholder with low influence "
        "and high interest?",
        [("Keep them informed, and use them as a source of "
          "information", True),
         ("Manage them closely, involving them in project "
          "decisions", False),
         ("Monitor them with minimal effort until their influence "
          "grows", False),
         ("Keep them satisfied with periodic high-level briefings", False)],
        "They care a great deal and cannot compel anything, which makes them "
        "worth informing and, more usefully, worth listening to -- they are "
        "frequently the actual users and know things the project does not. "
        "Close management is for high influence and high interest; minimal "
        "monitoring is for those with neither."),

    mcq("HARD",
        "Why is dismissing stakeholder objections the most costly response?",
        [("It discards the objections that were correct along with the "
          "rest", True),
         ("It causes stakeholders to escalate rather than raise concerns "
          "directly", False),
         ("It breaches the communication commitments in the project "
          "plan", False),
         ("It removes the project's ability to record concerns as "
          "risks", False),
         ],
        "Objections are a mixture: some reflect a real defect in the plan, "
        "some a genuine loss the project imposes, some the effect of not "
        "having been consulted. Treating all of them as opposition throws "
        "away the first category -- and those come from people who were often "
        "best placed to see what the project had missed."),
]

LESSON_PM_STAKE = lesson(
    MAJOR, MIDDLE,
    "Project Stakeholder Management",
    _stake_quiz,
    lesson_structure(
        "Project Stakeholder Management",
        "A stakeholder is anyone who affects the project or is affected by "
        "it, and the definition is deliberately wide enough to include the "
        "groups projects find uncomfortable -- operations, regulators, and "
        "the people whose roles the project reduces. This lesson covers "
        "identifying them repeatedly rather than once, analysing influence "
        "against interest with particular attention to the high-influence "
        "quadrant projects neglect until something goes wrong, comparing "
        "current engagement with what the project actually needs, and "
        "treating resistance as INFORMATION about a real interest rather than "
        "as obstruction -- since dismissing objections discards the ones that "
        "were right.",
        [
            "Define a stakeholder and identify the groups commonly omitted",
            "Identify stakeholders systematically and repeat it by phase",
            "Analyse stakeholders by influence and interest",
            "Explain why the high-influence, low-interest group is "
            "mishandled",
            "Compare current engagement with required engagement",
            "Respond productively to resistance",
            "Explain the limits of a stakeholder representative",
            "State the engagement level required from a sponsor",
        ],
        75,
        _stake_sections,
        [
            ("Stakeholder",
             "Anyone who affects the project or is affected by it -- "
             "including those who lose from it."),
            ("Influence and interest analysis",
             "Four quadrants directing effort: manage closely, keep "
             "satisfied, keep informed, monitor."),
            ("High influence, low interest",
             "The neglected quadrant. Brief them enough that their first "
             "impression is never a problem."),
            ("Engagement levels",
             "Unaware, resistant, neutral, supportive, leading."),
            ("Engagement gap",
             "Current engagement compared with what the project needs, which "
             "is what directs effort."),
            ("Resistance",
             "Usually a genuine interest being threatened, and therefore "
             "information rather than obstruction."),
            ("Stakeholder representative",
             "A channel to stakeholders rather than a substitute, and "
             "possibly unrepresentative."),
            ("Sponsor engagement",
             "Leading -- actively working for the project's success, not "
             "merely having approved the charter."),
        ],
        "A stakeholder is anyone who affects the project or is affected by "
        "it, and the wide definition matters because the omitted groups are "
        "predictable: operations, who are not part of delivery; regulators, "
        "whose requirements arrive as constraints; and the people whose roles "
        "the project reduces, whom nobody wants to name and whose influence "
        "is undiminished by that. Identification is repeated by phase, since "
        "a project that listed stakeholders once meets several of them first "
        "at the moment it needs their cooperation. Analysis by influence and "
        "interest directs effort, and the quadrant projects mishandle is HIGH "
        "INFLUENCE, LOW INTEREST -- somebody with authority who hears nothing "
        "until something affects them, at which point their first impression "
        "is a problem and they act on it. Engagement is then assessed as a "
        "GAP between where a stakeholder is and what the project needs, so "
        "effort goes where it changes an outcome. And resistance is treated "
        "as information: it usually reflects a real interest being "
        "threatened, sometimes a correct objection, sometimes simply not "
        "having been consulted -- so dismissing it is the costliest response, "
        "discarding the objections that were right along with the rest.",
        exam_notes=[
            desc(
                "Items describe a stakeholder problem appearing late and ask "
                "what should have been done."
            ),
            ul([
                "Diagnosing an uninformed high-influence stakeholder.",
                "Allocating effort by influence and interest.",
                "Responding to resistance productively.",
                "Explaining why identification is repeated.",
                "Identifying the commonly omitted groups.",
                "Explaining the limits of a representative.",
                "Stating the engagement level a sponsor requires.",
            ]),
            desc(
                "When a stakeholder causes a problem late, ask what they knew "
                "and when they learned it. These items are nearly always "
                "about somebody acting reasonably on information the project "
                "controlled and failed to provide."
            ),
        ],
    ))

LESSONS = [LESSON_PM_FOUND, LESSON_PM_INTEG, LESSON_PM_STAKE]

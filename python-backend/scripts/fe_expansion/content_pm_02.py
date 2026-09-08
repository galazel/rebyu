"""Project Management, lessons 4 to 6.

Scope management and the WBS, resource management, and time management.

The time lesson carries the category's arithmetic -- critical path, float and
PERT -- so it is worked rather than described, since those are the items most
reliably answerable by candidates who practised them.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Project Management"
MIDDLE = "Project Management"

# ==========================================================================
# Lesson 4: Scope management
# ==========================================================================

_scope_sections = [
    ("Defining What Is Included", [
        desc(
            "Scope management establishes what the project will deliver and, "
            "just as importantly, what it will not."
        ),
        table(
            ["Activity", "Produces"],
            [["Collect requirements", "What stakeholders need"],
             ["Define scope", "A statement of what is and is not included"],
             ["Create the WBS", "The work decomposed into manageable "
                                "packages"],
             ["Validate scope", "Formal acceptance of deliverables"],
             ["Control scope", "Changes assessed rather than absorbed"]],
            caption="Five scope activities across the life cycle.",
            footer="The EXCLUSIONS in the scope statement do as much work as "
                   "the inclusions. Something not mentioned is assumed by "
                   "somebody, and stating it as excluded converts a future "
                   "argument into a present decision."),
        desc(
            "PRODUCT scope is the features and functions of what is built; "
            "PROJECT scope is the work required to deliver it, including "
            "training, migration and documentation. Confusing them produces a "
            "plan covering the system and omitting everything needed to put "
            "it into use."
        ),
    ]),

    ("The Scope Statement", [
        desc(
            "The document that everything else is built against, and its "
            "contents are prescribed."
        ),
        ul([
            "The deliverables, described specifically enough to be "
            "recognised when complete.",
            "The ACCEPTANCE CRITERIA for each, which is what makes 'complete' "
            "a fact rather than an opinion.",
            "The exclusions -- what is explicitly not part of this project.",
            "The constraints the project must work within.",
            "The assumptions the scope rests on, since a failed assumption "
            "changes it.",
        ]),
        desc(
            "Acceptance criteria written at this point are what the V-model "
            "pairing of the development category requires, and they have the "
            "same effect: a deliverable whose completion criteria cannot be "
            "stated has not been defined well enough to be planned."
        ),
    ]),

    ("The Work Breakdown Structure", [
        desc(
            "The WBS decomposes everything the project must deliver into "
            "pieces small enough to estimate, assign and track."
        ),
        image(fig("wbs-tree")),
        desc(
            "It is decomposed by DELIVERABLE rather than by activity, which "
            "is the property the examination tests. A structure organised by "
            "phase or by department describes how the work will be done; one "
            "organised by deliverable describes what will exist, which is "
            "what the project is accountable for."
        ),
        ol([
            "Start from the major deliverables in the scope statement.",
            "Decompose each into components, and those into smaller ones.",
            "Stop at the WORK PACKAGE level -- small enough to estimate "
            "confidently and assign to one owner.",
            "Check the decomposition covers everything and duplicates "
            "nothing.",
            "Describe each package in a WBS dictionary, so its content is not "
            "a matter of interpretation.",
        ]),
    ]),

    ("The 100 Per Cent Rule", [
        desc(
            "The property that makes a WBS trustworthy, and the one items "
            "turn on."
        ),
        desc(
            "The children of any node must together constitute ALL of that "
            "node's work -- no more and no less. Applied throughout, the WBS "
            "contains the whole project and nothing outside it."
        ),
        table(
            ["Violation", "Consequence"],
            [["Something omitted from the decomposition",
              "Work that nobody planned, estimated or assigned"],
             ["Something included that is out of scope",
              "Effort spent on what the project was not funded for"],
             ["The same work in two branches",
              "Double counting in the estimate, and confusion in "
              "assignment"]],
            caption="Three violations and what each produces.",
            footer="The first row is the one that damages projects. Work "
                   "absent from the WBS is absent from the schedule and the "
                   "budget, and it appears later as an overrun with no "
                   "identifiable cause."),
        desc(
            "The rule also implies something practical: if work is not in the "
            "WBS, it is not in the project. That makes the WBS the reference "
            "for what has been agreed, which is what lets scope control "
            "function at all."
        ),
    ]),

    ("Sizing Work Packages", [
        desc(
            "How far to decompose is a judgement, and the syllabus gives the "
            "tests."
        ),
        ul([
            "Small enough that the effort can be estimated with reasonable "
            "confidence.",
            "Small enough that progress is meaningful -- a package spanning "
            "three months reports the same status for weeks.",
            "Large enough that tracking it does not cost more than it "
            "informs.",
            "Assignable to a single owner, since shared ownership is no "
            "ownership.",
            "Producing a verifiable output, so completion is observable "
            "rather than asserted.",
        ]),
        desc(
            "The second and third points are the trade. Decomposing further "
            "improves control and adds administrative cost, and past a point "
            "the project spends more time tracking work than doing it -- "
            "which is a real failure mode rather than a theoretical one."
        ),
    ]),

    ("Validating Scope", [
        desc(
            "Deliverables are formally accepted, and the syllabus "
            "distinguishes this from checking their quality."
        ),
        compare_grid(
            "QUALITY CONTROL AGAINST SCOPE VALIDATION",
            "Two checks performed by different people for different "
            "purposes.",
            [("Quality control",
              ["Performed by the project",
               "Asks whether the deliverable is correct",
               "Compares against the quality criteria",
               "Comes first"]),
             ("Scope validation",
              ["Performed with the customer",
               "Asks whether the deliverable is accepted",
               "Compares against the acceptance criteria",
               "Comes after quality control"])]),
        desc(
            "The ordering is examined. Presenting a deliverable for "
            "acceptance before checking it is correct wastes the customer's "
            "time and spends credibility -- so quality control precedes "
            "validation, and a project reversing them will be found out."
        ),
    ]),

    ("Controlling Scope", [
        desc(
            "Scope changes during projects, and control is what makes each "
            "change a decision rather than an accumulation."
        ),
        ol([
            "Every proposed change is recorded rather than absorbed "
            "informally.",
            "Its impact is assessed on schedule, cost, quality and risk.",
            "Somebody with authority decides, knowing that impact.",
            "An approved change updates the scope baseline, the WBS and the "
            "affected plans.",
            "The decision is communicated to everybody affected by it.",
        ]),
        desc(
            "SCOPE CREEP is this process not happening. Individually each "
            "small addition is reasonable and refusing it looks obstructive; "
            "collectively they consume the schedule, and since none was "
            "assessed, nobody can account for where it went."
        ),
        desc(
            "GOLD PLATING is the related failure with a different origin: the "
            "project adding functionality nobody requested, because it seemed "
            "valuable. It costs schedule and maintenance forever, and it was "
            "never in the business case."
        ),
    ]),

    ("Collecting Requirements", [
        desc(
            "Scope begins with what stakeholders need, which is the "
            "requirements work of the development category seen from the "
            "management side."
        ),
        ul([
            "Requirements come from every stakeholder group, including the "
            "ones the register might have missed.",
            "They are documented, prioritised and traced -- so each can be "
            "followed into the WBS and back to whoever needed it.",
            "Conflicts between them are surfaced and decided rather than "
            "reconciled privately.",
            "A REQUIREMENTS TRACEABILITY MATRIX links each requirement to the "
            "deliverable satisfying it and the test confirming it.",
        ]),
        desc(
            "The traceability matrix is what makes the coverage question "
            "answerable at the end. Without it, 'have we built everything "
            "asked for' is answered by recollection, and something omitted is "
            "found by the person who asked for it."
        ),
    ]),

    ("Progressive Elaboration", [
        desc(
            "Scope is not always knowable in full at the start, and the "
            "syllabus names the way that is handled."
        ),
        compare_grid(
            "ELABORATION AGAINST CREEP",
            "Both add detail; only one is controlled.",
            [("Progressive elaboration",
              ["Detail added as information becomes available",
               "Within the agreed scope boundary",
               "Planned, and expected",
               "The near term is detailed, the far term is outlined"]),
             ("Scope creep",
              ["Work added beyond the agreed boundary",
               "Unassessed and unauthorised",
               "Unplanned, and unnoticed until the schedule fails",
               "Every addition individually reasonable"])]),
        desc(
            "The distinction matters because they look similar from outside. "
            "Elaborating a work package into more detail is planning; adding "
            "a package nobody agreed to is creep -- and the test is whether "
            "the SCOPE BOUNDARY moved, not whether the plan got bigger."
        ),
    ]),

    ("Rolling Wave Planning", [
        desc(
            "The practical form of progressive elaboration, and the answer to "
            "planning a long project honestly."
        ),
        ol([
            "Plan the immediate period in full detail, since the information "
            "exists.",
            "Plan the following period in outline, at the level the "
            "information supports.",
            "Leave later periods at the deliverable level.",
            "As each period approaches, elaborate it using what the previous "
            "one produced.",
            "Keep the whole scope visible throughout, so the outline is a "
            "level of detail rather than an omission.",
        ]),
        desc(
            "The alternative -- planning eighteen months in daily detail at "
            "the outset -- produces precision without accuracy: a schedule "
            "that looks authoritative, is built on information nobody has, "
            "and is wrong in ways that will not be discovered until it "
            "matters."
        ),
    ]),

    ("Scope in an Adaptive Project", [
        desc(
            "Where a project uses an adaptive life cycle, scope is managed "
            "differently rather than not at all."
        ),
        compare_grid(
            "SCOPE UNDER PREDICTIVE AND ADAPTIVE APPROACHES",
            "Both control scope; they fix different things.",
            [("Predictive",
              ["Scope baselined early and changed through control",
               "The WBS covers the whole project",
               "Change is an exception requiring approval",
               "Time and cost adjust when scope changes"]),
             ("Adaptive",
              ["A prioritised backlog, refined continuously",
               "Detail exists only for the near term",
               "Change is expected and absorbed by reprioritising",
               "Scope adjusts because time and cost are fixed"])]),
        desc(
            "Neither is uncontrolled. The adaptive approach controls scope by "
            "fixing time and cost and requiring anything added to displace "
            "something else -- which is a stricter constraint than it "
            "appears, since the displacement is explicit and somebody must "
            "choose it."
        ),
    ]),

    ("Measuring Scope Delivery", [
        desc(
            "Progress against scope has to be measured objectively, and the "
            "WBS is what makes that possible."
        ),
        ul([
            "Report completion at the work package level, since a package is "
            "the smallest unit with a verifiable output.",
            "Count a package as complete only when its output has been "
            "verified, not when its effort is exhausted.",
            "Avoid percentage estimates within a package -- 'ninety per cent "
            "done' is an opinion that has been wrong for decades.",
            "Roll completed packages up through the WBS to give progress "
            "against each deliverable.",
        ]),
        desc(
            "The third point is why work packages are sized as they are. A "
            "package small enough to be either done or not done removes the "
            "judgement entirely, whereas a three-month package can only be "
            "reported as a proportion, and that proportion is guesswork."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where scope items are lost."),
        ul([
            "Confusing product scope with project scope, omitting training, "
            "migration and documentation.",
            "Organising a WBS by phase or department rather than by "
            "deliverable.",
            "Violating the 100 per cent rule, so unplanned work appears as an "
            "unexplained overrun.",
            "Decomposing so far that tracking costs more than it informs.",
            "Presenting deliverables for acceptance before quality control "
            "has checked them.",
            "Absorbing small scope changes without assessment.",
            "Adding unrequested functionality, which costs maintenance "
            "forever.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A project is delivered on schedule, and the customer cannot "
            "use the system because nobody was trained and the data was not "
            "migrated. What was the scope failure?\""
        ),
        ol([
            "Establish what was delivered: the product scope -- the system's "
            "features and functions.",
            "Establish what is missing: training and data migration, which "
            "are not features.",
            "They belong to PROJECT scope -- the work required to deliver the "
            "product into use.",
            "So the WBS decomposed the product and omitted the rest of the "
            "project, violating the 100 per cent rule.",
            "The consequence is exactly what the rule predicts: work absent "
            "from the WBS was absent from the schedule and the budget, and "
            "nobody was assigned to it.",
        ]),
        desc(
            "The generalisable point is that a project is accountable for "
            "the OUTCOME being usable rather than for the artefact existing. "
            "Training, migration, documentation and transition are project "
            "scope, and omitting them produces a system that meets its "
            "specification and delivers nothing."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Scope is the foundation the other areas build on."),
        ul([
            "Requirements collection is the requirements stage of Development "
            "Technology.",
            "The WBS is what the schedule and the cost estimate are both "
            "built from.",
            "Acceptance criteria are the V-model pairing of that category.",
            "Scope control is integrated change control from the previous "
            "lesson.",
            "Validation is the acceptance testing of the development "
            "category.",
            "Omitted transition work is the handover concern of that same "
            "category.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Product against project scope",
              "The features, against everything needed to deliver them",
              "Training, migration and documentation are project scope and "
              "are what gets omitted."),
             ("How a WBS is decomposed",
              "By DELIVERABLE, not by phase or department",
              "It describes what will exist rather than how the work will be "
              "organised."),
             ("The 100 per cent rule",
              "The children of a node are all of its work, and nothing else",
              "Work absent from the WBS is absent from the schedule and the "
              "budget."),
             ("Where decomposition stops",
              "At a package estimable, assignable and verifiable",
              "Further decomposition costs more tracking than it returns in "
              "control."),
             ("Quality control against scope validation",
              "Is it correct, against is it accepted",
              "Control comes first -- presenting unchecked work spends "
              "credibility."),
             ("Scope creep against gold plating",
              "Unassessed requests, against unrequested additions",
              "Both consume schedule; only one came from a stakeholder.")]),
    ]),
]

_scope_quiz = [
    mcq("HARD",
        "A system is delivered on schedule and cannot be used, because nobody "
        "was trained and the data was not migrated.\n\n"
        "What was the scope failure?",
        [("Project scope was decomposed as product scope, omitting the "
          "transition work", True),
         ("The acceptance criteria for each of the deliverables were "
          "never agreed with the customer", False),
         ("Scope changes during the project were absorbed without being "
          "assessed", False),
         ("The work breakdown structure was decomposed to too coarse a "
          "level", False)],
        "Training and migration are not features of the system; they are work "
        "required to put it into use, which is PROJECT scope. Omitting them "
        "from the WBS violates the 100 per cent rule, so they were absent "
        "from the schedule and the budget and nobody was assigned to them. A "
        "project is accountable for a usable outcome, not for an artefact "
        "existing."),

    mcq("AVERAGE",
        "How should a work breakdown structure be decomposed?",
        [("By deliverable", True),
         ("By project phase, following the life cycle", False),
         ("By the department responsible for each part", False),
         ("By the order in which the work will be performed", False)],
        "Decomposing by deliverable describes what will EXIST when the "
        "project finishes, which is what it is accountable for. Organising by "
        "phase or department describes how the work will be arranged, which "
        "can change without the deliverables changing -- and produces a "
        "structure that has to be redrawn whenever the organisation does."),

    mcq("HARD",
        "What does the 100 per cent rule require of a work breakdown "
        "structure?",
        [("The children of any node constitute all of that node's work and "
          "nothing more", True),
         ("Every work package must be estimated to within a defined "
          "tolerance before work begins", False),
         ("All project resources are allocated across the work "
          "packages", False),
         ("Each deliverable is decomposed to the same number of "
          "levels", False)],
        "Applied throughout, the rule means the WBS contains the whole "
        "project and nothing outside it. Its practical force is that work "
        "absent from the WBS is absent from the schedule and the budget, and "
        "appears later as an overrun nobody can attribute -- which is exactly "
        "how omitted transition work damages a project."),

    mcq("AVERAGE",
        "Why must quality control precede scope validation?",
        [("Presenting unchecked deliverables wastes the customer's time and "
          "spends credibility", True),
         ("Scope validation cannot be performed until the deliverable is "
          "complete and formally documented", False),
         ("Quality control identifies which acceptance criteria "
          "apply", False),
         ("Validation is performed by the customer and control by the "
          "project", False)],
        "Quality control asks whether the deliverable is correct and is done "
        "by the project; validation asks whether the customer accepts it. "
        "Reversing them means asking a customer to review work the project "
        "has not checked, which wastes their effort on defects that were "
        "already findable. The performer differs and is not the reason for "
        "the ordering."),

    mcq("HARD",
        "A project adds functionality nobody requested because the team "
        "considered it valuable.\n\nWhat is this, and why does it "
        "matter?",
        [("Gold plating -- it costs schedule and maintenance forever, and "
          "was never justified", True),
         ("Scope creep -- unassessed additions from stakeholders "
          "accumulating into a schedule overrun", False),
         ("Progressive elaboration -- refining scope as understanding "
          "improves", False),
         ("Value engineering -- improving the deliverable within the "
          "existing budget", False)],
        "Gold plating originates inside the project rather than with a "
        "stakeholder, which distinguishes it from scope creep. It consumes "
        "schedule now and maintenance for the system's whole life, and it "
        "appeared in no business case -- so nobody weighed the benefit "
        "against the cost, because nobody was asked to."),

    mcq("AVERAGE",
        "A work package is decomposed to the right size when several "
        "conditions hold.\n\nWhich?",
        [("It can be estimated confidently, assigned to one owner and "
          "verified", True),
         ("It represents approximately one week of effort for the team "
          "assigned to it", False),
         ("It corresponds to a single technical component", False),
         ("It can be completed by a single person working alone", False)],
        "The tests are practical: estimable, assignable, trackable and "
        "producing a verifiable output. A fixed duration is a rule of thumb "
        "rather than the criterion, and decomposing beyond the point where "
        "these hold adds administrative cost without improving control -- "
        "which is a real failure rather than a theoretical one."),

    mcq("HARD",
        "Why do the exclusions in a scope statement matter as much as the "
        "inclusions?",
        [("Anything unmentioned is assumed to be included by "
          "somebody", True),
         ("Exclusions determine which acceptance criteria "
          "apply", False),
         ("Contracts require excluded work to be listed "
          "explicitly", False),
         ("Exclusions establish the boundaries of the work breakdown "
          "structure", False)],
        "A stakeholder who assumed something was included will discover "
        "otherwise at delivery, when correcting it is most expensive and the "
        "disagreement is least resolvable. Stating an exclusion converts a "
        "future argument into a present decision somebody can object to while "
        "objecting is still cheap."),

    mcq("AVERAGE",
        "What distinguishes scope creep from an approved scope change?",
        [("Scope creep is absorbed without impact assessment or "
          "authorisation", True),
         ("Scope creep originates from the project stakeholders rather "
          "than from within the project team", False),
         ("Scope creep increases the scope while a change may reduce "
          "it", False),
         ("Scope creep occurs after the baseline is established", False)],
        "The difference is process rather than origin or direction. Each "
        "individual addition seems small and refusing it looks obstructive, "
        "so it is absorbed -- and because none was assessed, the accumulated "
        "schedule loss cannot be attributed to anything. An approved change "
        "has been assessed, decided and reflected in the baseline."),

    mcq("HARD",
        "Work required by the project is discovered during execution to be "
        "absent from the WBS.\n\nWhat follows?",
        [("It was absent from the schedule and budget, so it appears as an "
          "unexplained overrun", True),
         ("It can be absorbed within the existing work packages without "
          "affecting the baselines", False),
         ("The WBS dictionary must be updated, without affecting the "
          "baselines", False),
         ("It is by definition out of scope and should not be "
          "performed", False)],
        "The schedule and the cost estimate are both built from the WBS, so "
        "omitted work carries no time and no money and has no owner. It gets "
        "done anyway, consuming effort allocated elsewhere, and surfaces as a "
        "variance nobody can attribute -- which is precisely what the 100 per "
        "cent rule exists to prevent."),

    mcq("AVERAGE",
        "What does a WBS dictionary provide?",
        [("A description of each work package so its content is not a matter "
          "of interpretation", True),
         ("A glossary of the technical terms used throughout the project's "
          "documentation set", False),
         ("The mapping between work packages and the staff assigned to "
          "them", False),
         ("The estimated duration and cost of each work package", False)],
        "A package identified only by a short name is understood differently "
        "by whoever reads it, so the dictionary states what it includes and "
        "what completing it means. That precision is what lets somebody "
        "estimate it, own it and confirm it is finished without a "
        "conversation about what was intended."),
]

LESSON_PM_SCOPE = lesson(
    MAJOR, MIDDLE,
    "Project Scope Management and the WBS",
    _scope_quiz,
    lesson_structure(
        "Project Scope Management and the WBS",
        "Scope management establishes what the project delivers and, just as "
        "importantly, what it does not -- with the distinction between "
        "PRODUCT scope and PROJECT scope explaining the commonest failure, "
        "where a system is delivered and the training, migration and "
        "documentation needed to use it were never planned. This lesson "
        "covers the scope statement and its exclusions, the WBS decomposed by "
        "deliverable, the 100 per cent rule and what its violation produces, "
        "how far to decompose, validation as distinct from quality control, "
        "and the scope control without which small reasonable additions "
        "consume a schedule untraceably.",
        [
            "Distinguish product scope from project scope",
            "State what a scope statement contains, including exclusions",
            "Decompose work into a WBS by deliverable",
            "Apply the 100 per cent rule and explain violations",
            "Judge the right size for a work package",
            "Distinguish scope validation from quality control",
            "Apply scope control and identify scope creep",
            "Distinguish scope creep from gold plating",
        ],
        80,
        _scope_sections,
        [
            ("Product scope",
             "The features and functions of what is built."),
            ("Project scope",
             "All the work required to deliver it -- including training, "
             "migration and documentation."),
            ("Scope statement",
             "Deliverables, acceptance criteria, EXCLUSIONS, constraints and "
             "assumptions."),
            ("Work breakdown structure",
             "The work decomposed by DELIVERABLE into estimable, assignable "
             "packages."),
            ("100 per cent rule",
             "The children of a node are all of its work and nothing more. "
             "Omitted work is unplanned work."),
            ("Work package",
             "The bottom level: estimable, assignable to one owner, and "
             "producing a verifiable output."),
            ("WBS dictionary",
             "A description of each package, so its content is not a matter "
             "of interpretation."),
            ("Scope validation",
             "Formal acceptance by the customer, after quality control has "
             "confirmed correctness."),
            ("Scope creep",
             "Changes absorbed without assessment, consuming schedule with "
             "nothing to attribute it to."),
            ("Gold plating",
             "The project adding what nobody requested -- costing schedule "
             "now and maintenance forever."),
        ],
        "Scope management fixes what is delivered and what is excluded, and "
        "the exclusions do as much work as the inclusions since anything "
        "unmentioned is assumed included by somebody. The distinction that "
        "matters most is PRODUCT scope -- the features -- against PROJECT "
        "scope, which is everything required to deliver them into use: "
        "training, migration, documentation and transition, and precisely "
        "what gets omitted, producing a system that meets its specification "
        "and cannot be used. The WBS decomposes by DELIVERABLE rather than by "
        "phase or department, because it describes what will exist rather "
        "than how work is arranged, and it obeys the 100 PER CENT RULE: the "
        "children of a node are all of that node's work and nothing more. "
        "Work absent from the WBS is absent from the schedule and the budget "
        "and appears later as an overrun nobody can attribute. Decomposition "
        "stops where a package is estimable, assignable and verifiable, since "
        "going further costs more in tracking than it returns in control. "
        "Validation is the customer's acceptance and follows quality control, "
        "which is the project's own check. And scope control makes each "
        "change a decision -- without it, unassessed additions become scope "
        "creep, while unrequested additions from inside the project are gold "
        "plating, costing maintenance forever against a benefit nobody "
        "weighed.",
        exam_notes=[
            desc(
                "Items describe a delivery that failed and ask which scope "
                "activity was inadequate."
            ),
            ul([
                "Identifying omitted project scope.",
                "Stating how a WBS is decomposed.",
                "Applying the 100 per cent rule.",
                "Judging work package size.",
                "Ordering quality control and scope validation.",
                "Distinguishing scope creep from gold plating.",
                "Explaining why exclusions are stated.",
            ]),
            desc(
                "When a delivered system cannot be used, look for project "
                "scope that was never decomposed. Training, migration and "
                "documentation are the three that go missing, and they go "
                "missing together because the WBS was built from the product "
                "rather than from the project."
            ),
        ],
    ))

# ==========================================================================
# Lesson 5: Resource management
# ==========================================================================

_res_sections = [
    ("People and Everything Else", [
        desc(
            "Resource management covers the people, equipment, materials and "
            "facilities a project needs -- and the people are the part with "
            "the distinctive difficulties."
        ),
        table(
            ["Resource", "Planned by", "Distinctive problem"],
            [["People", "Skill, availability and time",
              "Productivity varies enormously between individuals"],
             ["Equipment", "Quantity and duration",
              "Lead times, and contention with other projects"],
             ["Materials", "Quantity and delivery date",
              "Consumed rather than returned"],
             ["Facilities", "Space and timing",
              "Fixed capacity, booked in advance"]],
            caption="Four resource types and what each demands.",
            footer="The first row's variation is the one estimates struggle "
                   "with. Effort in person-days assumes people are "
                   "interchangeable units, and they measurably are not -- "
                   "which is why an estimate should say who, not merely how "
                   "many."),
    ]),

    ("Estimating Resource Needs", [
        desc(
            "Resource planning starts from the WBS and works out what each "
            "package requires."
        ),
        ol([
            "For each work package, identify what skills and equipment it "
            "needs.",
            "Estimate the EFFORT required -- the amount of work, independent "
            "of who does it or when.",
            "Convert effort to DURATION using the resources actually "
            "available, which is a separate step.",
            "Aggregate across packages to find the total demand over time.",
            "Compare against what is available, and resolve the differences.",
        ]),
        desc(
            "Step three is where the arithmetic goes wrong. Ten person-days "
            "of effort is not two days for five people: coordination costs "
            "rise, some work cannot be parallelised, and a task with a "
            "sequential core does not divide at all -- which is the same "
            "reason adding people to a late project fails."
        ),
    ]),

    ("Acquiring the Team", [
        desc(
            "A plan requiring people the project does not have is not a plan, "
            "so acquisition is an activity rather than an assumption."
        ),
        ul([
            "Negotiate for named individuals where the work depends on "
            "specific expertise.",
            "Establish what proportion of their time the project actually "
            "gets, since 'available' rarely means full time.",
            "Agree it with whoever they report to, because in a matrix "
            "organisation that person controls it.",
            "Plan for the gap between when somebody joins and when they are "
            "productive.",
            "Record the agreement, since verbal availability commitments "
            "evaporate under competing pressure.",
        ]),
        desc(
            "The second point is where schedules quietly become wrong. "
            "Somebody 'on the project' who spends half their time on "
            "operational duties supplies half the capacity the plan assumed, "
            "and the shortfall is invisible until the work is late."
        ),
    ]),

    ("Levelling and Smoothing", [
        desc(
            "Aggregating resource demand across a schedule reveals peaks the "
            "organisation cannot supply, and two techniques address them."
        ),
        compare_grid(
            "RESOURCE LEVELLING AGAINST SMOOTHING",
            "Both flatten the demand; one accepts a later finish.",
            [("Levelling",
              ["Adjusts the schedule to fit available resources",
               "May move activities on the critical path",
               "The project end date can move as a result",
               "Used when resources are a hard limit"]),
             ("Smoothing",
              ["Adjusts only within available float",
               "Never moves a critical path activity",
               "The end date does not change",
               "Used when the date is a hard limit"])]),
        desc(
            "The distinction is examined and the test is simple: does the "
            "technique allow the end date to move? Levelling does and "
            "smoothing does not, which means smoothing can only flatten "
            "demand as far as the available float permits."
        ),
    ]),

    ("Developing the Team", [
        desc(
            "A group of individuals is not a team, and the syllabus expects "
            "the stages it passes through."
        ),
        image(fig("team-development")),
        desc(
            "FORMING is polite and tentative; STORMING is where disagreement "
            "about roles and approach surfaces; NORMING is where ways of "
            "working settle; PERFORMING is where the team becomes productive "
            "and largely self-managing."
        ),
        desc(
            "STORMING is a stage rather than a failure, which is the "
            "examinable point. A team that never disagrees has not resolved "
            "how it will work -- it has deferred the conversation, usually "
            "until something is at stake and the disagreement is expensive."
        ),
        ul([
            "Training addresses skill gaps identified during resource "
            "planning rather than discovered during execution.",
            "Co-location, where possible, dramatically reduces the cost of "
            "coordination.",
            "Ground rules agreed early prevent the storming stage from "
            "becoming personal.",
            "Recognition should reflect what the team values, which is not "
            "always what a manager assumes.",
        ]),
    ]),

    ("Managing the Team", [
        desc(
            "Once working, a team needs ongoing attention rather than "
            "periodic review."
        ),
        table(
            ["Situation", "Response"],
            [["Performance below expectation",
              "Establish why before acting -- capability, clarity, obstacles "
              "or motivation are different problems"],
             ["Conflict between members",
              "Address it, since unaddressed conflict does not "
              "dissipate"],
             ["Somebody consistently overloaded",
              "A planning problem presenting as a personal one"],
             ["A skill gap discovered late",
              "Training, reassignment, or a change to the plan"]],
            caption="Four situations and what each actually requires.",
            footer="The first row is the one handled worst. Somebody "
                   "performing poorly because their objective is unclear "
                   "needs a different response from somebody lacking the "
                   "skill, and treating both as motivation problems solves "
                   "neither."),
        desc(
            "CONFLICT is not inherently harmful -- disagreement about "
            "approach is how a team reaches better answers. What harms a "
            "project is conflict that becomes personal or that goes "
            "unresolved, and both are prevented by addressing it early rather "
            "than hoping it subsides."
        ),
    ]),

    ("Responsibility Assignment", [
        desc(
            "Knowing who does what is distinct from knowing who is "
            "accountable, and both need recording."
        ),
        table(
            ["Role", "Means"],
            [["Responsible", "Does the work"],
             ["Accountable", "Answerable for it being done -- exactly one "
                             "person"],
             ["Consulted", "Whose input is sought before it is done"],
             ["Informed", "Told about it afterwards"]],
            caption="Four distinct relationships to a piece of work.",
            footer="Exactly ONE person accountable is the rule that does the "
                   "work. Two accountable people means each may reasonably "
                   "assume the other is handling it, which is how something "
                   "with two owners ends up with none."),
        desc(
            "A responsibility matrix maps these against the work packages of "
            "the WBS, and its value is in the gaps it exposes -- a package "
            "with nobody accountable, or a person accountable for far more "
            "than they can attend to."
        ),
    ]),

    ("Motivation", [
        desc(
            "The syllabus expects the classical models, less for their "
            "detail than for what they imply about managing people."
        ),
        content_accordion(
            "THREE VIEWS OF WHAT MOTIVATES PEOPLE",
            "Each suggests a different management response.",
            [("Hierarchy of needs",
              "Needs are met in order, from physical and safety through "
              "belonging and esteem to self-actualisation. The implication is "
              "that higher motivators do not work while a lower need is "
              "unmet -- job security worries defeat appeals to "
              "achievement."),
             ("Hygiene and motivating factors",
              "Some factors cause dissatisfaction by their absence -- salary, "
              "conditions, policy -- without motivating by their presence. "
              "Motivation comes from achievement, recognition and "
              "responsibility. So fixing conditions removes dissatisfaction "
              "and does not produce enthusiasm."),
             ("Assumptions about people",
              "Managers who assume people avoid work manage by control and "
              "get behaviour confirming it; managers who assume people seek "
              "responsibility manage by delegation and get that. The "
              "assumption tends to produce its own evidence.")]),
        desc(
            "The practical extract is the second model's asymmetry: "
            "correcting a source of dissatisfaction stops people being "
            "unhappy and does not make them motivated, which are different "
            "outcomes requiring different actions."
        ),
    ]),

    ("Leadership and Influence", [
        desc(
            "A project manager frequently has responsibility without formal "
            "authority, so influence matters as much as position."
        ),
        ul([
            "Expertise and demonstrated competence produce willing "
            "cooperation that position alone does not.",
            "Reciprocity -- helping others when it costs little -- is what "
            "makes requests answerable later.",
            "Transparency about constraints and reasoning produces "
            "cooperation; instructions without reasons produce compliance.",
            "Credibility is spent by escalating, so it is used where the "
            "issue genuinely requires it.",
            "Consistency matters more than any individual decision, since it "
            "is what lets people predict what the project will do.",
        ]),
        desc(
            "The third point has a practical consequence. A team told WHY a "
            "constraint exists can find alternatives within it; a team given "
            "only the instruction can only comply or object -- and the "
            "alternatives were often what the project needed."
        ),
    ]),

    ("Virtual and Distributed Teams", [
        desc(
            "Teams spread across sites and time zones need deliberately what "
            "co-located teams get incidentally."
        ),
        table(
            ["Lost", "Replaced by"],
            [["Overhearing what others are working on",
              "Explicit, written status that everybody can see"],
             ["Asking a quick question",
              "Overlapping hours, and tolerance for asynchronous answers"],
             ["Noticing somebody is stuck",
              "Regular short check-ins, and asking directly"],
             ["Informal relationship building",
              "Deliberate time for it, since it will not happen "
              "otherwise"]],
            caption="Four things co-location provides invisibly.",
            footer="The last row is the one dismissed as unnecessary. Teams "
                   "that have never met communicate more cautiously and "
                   "escalate later, which costs more than the time it would "
                   "have taken to build the relationships."),
        desc(
            "The general principle is that distributed teams must make "
            "explicit what co-located teams leave implicit -- which is work, "
            "and which is why distributed working is not simply the same "
            "arrangement in different places."
        ),
    ]),

    ("Physical Resources", [
        desc(
            "Equipment, materials and facilities have their own planning "
            "characteristics, which people-focused planning tends to "
            "overlook."
        ),
        table(
            ["Concern", "Why it matters"],
            [["Lead time", "Ordering late delays work regardless of who is "
                           "available"],
             ["Contention", "Another project may hold what this one needs"],
             ["Capacity limits", "A facility takes a fixed number of people, "
                                 "whatever the plan says"],
             ["Consumption", "Materials are used up, so a shortfall stops "
                             "work entirely"],
             ["Disposal", "What happens to it afterwards is part of the "
                          "project"]],
            caption="Five characteristics of physical resources.",
            footer="LEAD TIME is the one that damages schedules quietly. A "
                   "six-week delivery ordered in week five of a six-week task "
                   "makes the task twelve weeks long, and no amount of staff "
                   "availability changes that."),
        desc(
            "The general lesson is that physical resources need planning "
            "BACKWARD from when they are required, allowing for procurement "
            "and delivery -- which means the procurement activity appears far "
            "earlier in the schedule than the work that consumes it."
        ),
    ]),

    ("Losing People During a Project", [
        desc(
            "People leave, are reassigned, or become unavailable, and a plan "
            "that assumed otherwise has a single point of failure."
        ),
        ol([
            "Identify where knowledge is held by one person only, which is a "
            "risk rather than an efficiency.",
            "Spread it deliberately -- pairing, review, rotation, and "
            "documentation of the things that can be documented.",
            "Plan for handover when somebody is leaving, as an event with "
            "time allocated rather than a favour.",
            "Expect a productivity cost when a replacement arrives, since the "
            "team must teach as well as work.",
            "Reassess the schedule, since a person's departure is a change to "
            "the resource plan and therefore to the dates.",
        ]),
        desc(
            "The first point is worth stating as a risk rather than as good "
            "practice. A project where one person alone understands a "
            "critical component is one whose schedule depends on that "
            "person's continued availability -- and nobody wrote that "
            "dependency down."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where resource items are lost."),
        ul([
            "Treating effort and duration as the same thing, so ten "
            "person-days becomes two days for five people.",
            "Assuming an assigned person is available full time.",
            "Confusing levelling with smoothing. Only levelling may move the "
            "end date.",
            "Treating the storming stage as a failure rather than as a stage "
            "every team passes through.",
            "Responding to poor performance without establishing whether it "
            "is capability, clarity, obstacles or motivation.",
            "Leaving conflict unaddressed in the hope it subsides.",
            "Failing to plan for the time between somebody joining and "
            "becoming productive.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A task is estimated at 20 person-days. The manager assigns 10 "
            "people, expecting it to take two days. What is wrong with this "
            "reasoning?\""
        ),
        ol([
            "Effort and duration are different quantities: effort is the "
            "amount of work, duration is the elapsed time.",
            "Converting one to the other assumes the work divides evenly and "
            "coordination is free.",
            "Neither assumption holds: coordination cost rises with team "
            "size, and channels grow with its square.",
            "Some of the work will be sequential and cannot be parallelised "
            "regardless of how many people are available.",
            "So duration will considerably exceed two days, and beyond some "
            "team size adding people increases duration rather than reducing "
            "it.",
        ]),
        desc(
            "This is the same reasoning as adding people to a late project, "
            "and it generalises: effort divided by headcount is an upper "
            "bound on the speed-up available, never an estimate of what will "
            "happen."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Resource management connects to several other areas."),
        ul([
            "Resource requirements come from the WBS of the previous "
            "lesson.",
            "The effort-duration distinction underlies the scheduling of the "
            "next one.",
            "Communication channel growth is the communications lesson.",
            "Matrix authority conflicts come from the foundations lesson.",
            "Acquiring people externally is procurement.",
            "Skill gaps and knowledge retention are the maintenance concerns "
            "of Development Technology.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Effort against duration",
              "The amount of work, against the elapsed time",
              "Converting one to the other is a separate step that assumes "
              "things that are not true."),
             ("Why 20 person-days is not 2 days for 10 people",
              "Coordination costs and sequential work",
              "Effort over headcount is an upper bound on speed-up, never an "
              "estimate."),
             ("Levelling against smoothing",
              "May move the end date, against may not",
              "Smoothing works only within available float."),
             ("What 'assigned to the project' usually means",
              "Some proportion of their time",
              "The shortfall is invisible until the work is late."),
             ("What storming is",
              "A stage, not a failure",
              "A team that never disagrees has deferred the conversation, not "
              "avoided it."),
             ("Before responding to poor performance",
              "Establish whether it is capability, clarity, obstacles or "
              "motivation",
              "Treating all four as motivation solves none of them.")]),
    ]),
]

_res_quiz = [
    mcq("HARD",
        "A task estimated at 20 person-days is assigned to 10 people, in the "
        "expectation that it takes two days.\n\nWhat is wrong?",
        [("Effort does not convert to duration by division, since "
          "coordination and sequencing intervene", True),
         ("The estimate should have been expressed in duration rather than in "
          "effort", False),
         ("Ten people cannot be assigned to one work package under normal "
          "planning rules", False),
         ("The estimate assumed a specific team size and must be "
          "recalculated", False)],
        "Effort is the amount of work and duration is elapsed time; "
        "converting between them assumes work divides evenly and coordination "
        "is free. Neither holds -- communication channels grow with the "
        "square of team size, and sequential work does not parallelise at "
        "all. Effort over headcount is an upper bound on the speed-up, never "
        "a prediction."),

    mcq("AVERAGE",
        "What distinguishes resource levelling from resource smoothing?",
        [("Levelling may move the project end date; smoothing may "
          "not", True),
         ("Levelling applies to people and smoothing to equipment", False),
         ("Levelling is performed during planning and smoothing during "
          "execution", False),
         ("Levelling reduces total resource demand while smoothing "
          "redistributes it", False)],
        "Both flatten peaks in resource demand. Levelling adjusts the "
        "schedule to fit available resources and may therefore move "
        "activities on the critical path, extending the project. Smoothing "
        "works only within existing float, so the end date is preserved and "
        "the flattening achievable is limited by how much float exists."),

    mcq("HARD",
        "A team member is 'assigned to the project' while retaining "
        "operational duties.\n\nWhat is the planning risk?",
        [("The plan assumes capacity the project does not actually "
          "receive", True),
         ("Their operational duties will be neglected during busy project "
          "periods", False),
         ("They cannot be held accountable for project deliverables", False),
         ("Their productivity will be lower than a dedicated team "
          "member's", False)],
        "A plan built on somebody being available supplies work at that rate, "
        "and if half their time goes elsewhere the project receives half what "
        "was assumed. The shortfall is invisible until the work is late, "
        "which is why the proportion of time must be established and agreed "
        "with whoever they report to rather than assumed."),

    mcq("AVERAGE",
        "In team development, what does the storming stage represent?",
        [("A normal stage where disagreement about roles and approach "
          "surfaces", True),
         ("A failure of team selection requiring intervention", False),
         ("The period before team members have been introduced", False),
         ("A decline in performance following a change of "
          "membership", False)],
        "Storming is where a group works out how it will operate, and the "
        "disagreement is the mechanism rather than a symptom. A team that "
        "never storms has deferred the conversation about roles and approach, "
        "typically until something is at stake -- at which point the same "
        "disagreement happens expensively."),

    mcq("HARD",
        "A team member's performance is below expectation.\n\n"
        "What should be established first?",
        [("Whether it is capability, clarity, obstacles or "
          "motivation", True),
         ("Whether their workload exceeds what was planned for "
          "them", False),
         ("Whether the estimate for their work was realistic", False),
         ("Whether they wish to remain assigned to the project", False)],
        "The four causes need entirely different responses -- training, "
        "clearer objectives, removing an obstacle, or a conversation about "
        "motivation -- and treating all of them as motivation solves none. "
        "Establishing which applies is the step that makes the response "
        "useful, and workload is one of the obstacles it may reveal."),

    mcq("AVERAGE",
        "Which resource planning step comes between estimating effort and "
        "producing a schedule?",
        [("Converting effort to duration using the resources actually "
          "available", True),
         ("Aggregating effort across all the work packages", False),
         ("Negotiating with functional managers for staff", False),
         ("Identifying the skills each work package requires", False)],
        "Effort is independent of who does the work and when; duration "
        "depends on the resources actually assigned. Keeping them as separate "
        "steps is what prevents the division error, and it makes visible that "
        "a duration figure is a consequence of a resourcing decision rather "
        "than a property of the task."),

    mcq("HARD",
        "Why does the syllabus warn against treating people as "
        "interchangeable units of effort?",
        [("Productivity varies enormously between individuals, so who matters "
          "as much as how many", True),
         ("Staff assigned late in a project cannot be as "
          "productive", False),
         ("Effort estimates are made before the team is known", False),
         ("Different individuals attract different cost rates", False)],
        "Person-day arithmetic assumes one person-day is equivalent to any "
        "other, and measured productivity differences between individuals "
        "doing the same work are large. An estimate is therefore considerably "
        "more reliable when it says WHO will do the work, which is also why "
        "negotiating for named individuals matters where expertise is "
        "critical."),

    mcq("AVERAGE",
        "What should be planned for when a new person joins a project team?",
        [("The period between joining and becoming productive", True),
         ("A reduction in the effort estimates for their work "
          "packages", False),
         ("Additional equipment and facilities for their use", False),
         ("A revised communication plan reflecting the larger team", False)],
        "Somebody joining must learn the system, the domain and the team's "
        "way of working, and during that time they consume the attention of "
        "people who were already productive. Planning as though capacity "
        "rises the day they arrive overstates it twice -- once for them and "
        "once for whoever is helping them."),

    mcq("HARD",
        "Conflict arises between two team members about the technical "
        "approach.\n\nHow should this be regarded?",
        [("As potentially productive, provided it is addressed rather than "
          "left", True),
         ("As harmful, requiring one approach to be mandated "
          "immediately", False),
         ("As a symptom that the team has not reached the norming "
          "stage", False),
         ("As a matter for their functional managers rather than the "
          "project", False)],
        "Disagreement about approach is how a team reaches a better answer "
        "than either person would have alone, so the conflict itself is not "
        "the problem. What harms the project is conflict that becomes "
        "personal or is left unresolved -- both of which are prevented by "
        "addressing it early rather than hoping it subsides."),

    mcq("AVERAGE",
        "Resource demand aggregated across a schedule shows a peak exceeding "
        "available staff, and the end date cannot move.\n\n"
        "Which technique applies?",
        [("Smoothing, which reschedules within available float", True),
         ("Levelling, which adjusts the schedule to available "
          "resources", False),
         ("Fast tracking, which overlaps activities that were "
          "sequential", False),
         ("Crashing, which adds resources to shorten the critical "
          "path", False)],
        "Smoothing moves activities only within their float, so no critical "
        "path activity moves and the end date is preserved -- which is "
        "exactly the constraint stated. Levelling would fit the resources and "
        "may extend the project. Crashing and fast tracking are schedule "
        "compression techniques for the opposite problem."),
]

LESSON_PM_RES = lesson(
    MAJOR, MIDDLE,
    "Project Resource Management",
    _res_quiz,
    lesson_structure(
        "Project Resource Management",
        "Resource management covers people, equipment, materials and "
        "facilities, and the people carry the distinctive difficulties -- "
        "chief among them that EFFORT and DURATION are different quantities, "
        "so twenty person-days is not two days for ten people however the "
        "arithmetic looks. This lesson covers estimating from the WBS, "
        "acquiring a team including the availability proportion that quietly "
        "invalidates schedules, levelling and smoothing distinguished by "
        "whether the end date may move, the development stages a team passes "
        "through with storming as a stage rather than a failure, and managing "
        "performance by first establishing which of four causes applies.",
        [
            "Describe the resource types and what each demands",
            "Distinguish effort from duration and explain the conversion",
            "Explain why effort divided by headcount overstates the speed-up",
            "Acquire a team, establishing real availability",
            "Distinguish resource levelling from smoothing",
            "Describe the team development stages and interpret storming",
            "Respond to poor performance by establishing its cause",
            "Regard conflict productively",
        ],
        80,
        _res_sections,
        [
            ("Effort",
             "The amount of work, independent of who performs it or when."),
            ("Duration",
             "Elapsed time, which depends on the resources actually "
             "assigned."),
            ("The division error",
             "Effort over headcount is an upper bound on speed-up, defeated "
             "by coordination cost and sequential work."),
            ("Availability proportion",
             "What share of somebody's time the project actually receives -- "
             "rarely all of it."),
            ("Resource levelling",
             "Adjusting the schedule to fit available resources. May move the "
             "end date."),
            ("Resource smoothing",
             "Adjusting only within float, so the end date is preserved and "
             "flattening is limited."),
            ("Team development stages",
             "Forming, storming, norming, performing -- with storming a stage "
             "rather than a failure."),
            ("Performance diagnosis",
             "Capability, clarity, obstacles or motivation -- four causes "
             "needing four different responses."),
        ],
        "Resource management covers people, equipment, materials and "
        "facilities, and its central arithmetic is that EFFORT and DURATION "
        "are different quantities. Converting one into the other assumes work "
        "divides evenly and coordination is free, and neither holds -- "
        "communication channels grow with the square of team size and "
        "sequential work does not parallelise -- so effort over headcount is "
        "an upper bound on the speed-up, never a prediction. Acquiring a team "
        "means establishing what PROPORTION of somebody's time the project "
        "actually receives, agreed with whoever they report to, since a plan "
        "assuming full availability from a half-available person is wrong in "
        "a way invisible until the work is late. Where aggregate demand "
        "exceeds supply, levelling adjusts the schedule to the resources and "
        "may move the end date, while smoothing works only within float and "
        "may not. Teams pass through forming, storming, norming and "
        "performing, with STORMING a stage rather than a failure -- a team "
        "that never disagrees has deferred the conversation rather than "
        "avoided it. And poor performance has four possible causes -- "
        "capability, clarity, obstacles, motivation -- which need four "
        "different responses, so establishing which applies precedes doing "
        "anything.",
        exam_notes=[
            desc(
                "Items give a resourcing decision and ask what is wrong with "
                "it, or ask which technique applies under a stated "
                "constraint."
            ),
            ul([
                "Identifying the effort-duration division error.",
                "Choosing between levelling and smoothing.",
                "Explaining the availability proportion risk.",
                "Interpreting the storming stage.",
                "Diagnosing poor performance before responding.",
                "Explaining why people are not interchangeable units.",
                "Planning for a new joiner's ramp-up.",
            ]),
            desc(
                "For a levelling-or-smoothing item, ask one question: may the "
                "end date move? If it may not, the answer is smoothing and "
                "the flattening is limited by available float -- which the "
                "item will usually have told you something about."
            ),
        ],
    ))

LESSONS = [LESSON_PM_SCOPE, LESSON_PM_RES]

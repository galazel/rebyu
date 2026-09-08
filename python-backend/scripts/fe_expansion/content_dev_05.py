"""Development Technology -> System Development Technology, lessons 9 and 10.

Syllabus stages: acceptance support and handover, and maintenance, evolution
and disposal.

The maintenance lesson carries the economic fact the whole category rests on
-- that most of a system's cost occurs after delivery -- so it is stated as a
consequence for design decisions rather than as a statistic.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Development Technology"
MIDDLE = "System Development Technology"

# ==========================================================================
# Lesson 9: Acceptance support and handover
# ==========================================================================

_acc_sections = [
    ("The Customer's Own Test", [
        desc(
            "Every test level so far was run by the people who built the "
            "system. Acceptance testing is run by the people who asked for "
            "it, and asks a different question."
        ),
        image(fig("v-model")),
        desc(
            "System testing asked whether the system meets its "
            "specifications. Acceptance testing asks whether it meets the "
            "BUSINESS NEED -- which is the question the specifications were "
            "an attempt to capture, and which only the customer can answer."
        ),
        table(
            ["", "System testing", "Acceptance testing"],
            [["Run by", "The development organisation", "The customer"],
             ["Against", "The system requirements", "The business need"],
             ["Uses", "Test cases derived from specifications",
              "Real business scenarios and real data"],
             ["Outcome", "Defects to fix",
              "A decision to accept or reject"]],
            caption="Two levels that look similar and answer different "
                    "questions.",
            footer="The last row is the practical difference. Acceptance is "
                   "a DECISION with contractual and financial consequences, "
                   "which is why its criteria are agreed long before it "
                   "begins."),
    ]),

    ("Acceptance Criteria", [
        desc(
            "Acceptance is only meaningful if what counts as acceptable was "
            "settled in advance."
        ),
        ul([
            "Criteria are agreed at requirements time, alongside the "
            "requirements themselves -- which is the V-model pairing.",
            "Each must be objective enough that both parties reach the same "
            "conclusion from the same evidence.",
            "Quality criteria carry the figures the requirements lesson "
            "insisted on, since 'acceptably fast' cannot be accepted or "
            "rejected.",
            "The criteria include what level of remaining defects is "
            "tolerable, because there will be some.",
            "Whoever may sign acceptance is named, since an accepted system "
            "nobody was authorised to accept settles nothing.",
        ]),
        desc(
            "Agreeing criteria late is the source of the disputes this stage "
            "is known for. Once a system exists, both sides read an ambiguous "
            "criterion in whichever direction favours them -- and neither is "
            "being unreasonable, which is what makes it hard to resolve."
        ),
    ]),

    ("Forms of Acceptance Testing", [
        desc(
            "The syllabus names several, distinguished by who tests and "
            "where."
        ),
        content_accordion(
            "FOUR FORMS",
            "Each answers a slightly different acceptance question.",
            [("User acceptance testing",
              "Business users work through real scenarios, deciding whether "
              "the system supports their actual work. The main event, and the "
              "one the contract usually turns on."),
             ("Operational acceptance testing",
              "Operations staff confirm they can run it -- backup, restore, "
              "monitoring, restart, and the documented procedures. The form "
              "most often skipped, and the omission whose cost lasts "
              "longest."),
             ("Contract and regulation acceptance",
              "Confirming the specific obligations of a contract or a legal "
              "requirement are met, which is a checklist rather than a "
              "judgement."),
             ("Alpha and beta testing",
              "For a product with many customers rather than one: alpha at "
              "the developer's site, beta with real users in their own "
              "environment.")]),
        desc(
            "OPERATIONAL acceptance deserves its emphasis. A system the "
            "business accepts and operations cannot run is accepted and "
            "unrunnable, and the cost appears every day thereafter -- which "
            "is the same stakeholder omission the requirements lesson named, "
            "arriving at the last possible moment to be fixed cheaply."
        ),
    ]),

    ("Supporting the Customer's Testing", [
        desc(
            "The development organisation does not run acceptance testing, "
            "and it has real work to do during it."
        ),
        ol([
            "Provide an environment that works, populated with data they can "
            "use.",
            "Provide the documentation and training they need to test at "
            "all.",
            "Be available to answer questions quickly, since a blocked tester "
            "stops testing.",
            "Triage what they report, distinguishing defects from "
            "misunderstandings from change requests.",
            "Fix and redeliver quickly, because acceptance has a schedule and "
            "slow fixes consume it.",
        ]),
        desc(
            "Step four is where the friction is. A report may be a genuine "
            "defect, a misunderstanding of how the system works, or a request "
            "for something never specified -- and the three have different "
            "owners and different funding, which is exactly why the "
            "classification rule is agreed before testing starts."
        ),
    ]),

    ("Defect or Change Request", [
        desc(
            "The most common dispute of this stage, and the syllabus expects "
            "the distinction to be principled."
        ),
        compare_grid(
            "TWO THINGS THAT LOOK IDENTICAL FROM A USER'S SEAT",
            "Both are 'the system does not do what I want'.",
            [("A defect",
              ["The system does not do what was SPECIFIED",
               "The specification is the evidence",
               "Fixed within the existing agreement",
               "Cost falls to the supplier"]),
             ("A change request",
              ["The system does what was specified, and the specification "
               "was wrong or has been overtaken",
               "The need is real and was not agreed",
               "Assessed for impact, then decided",
               "Cost has to be agreed"])]),
        desc(
            "The distinction is about the SPECIFICATION rather than about "
            "whether the user is right. A change request is not a rejected "
            "complaint -- it is a real need that was not part of what was "
            "agreed, and treating it respectfully as a decision to be funded "
            "is what keeps the relationship workable."
        ),
    ]),

    ("Handover", [
        desc(
            "Acceptance is a decision. Handover is the transfer of "
            "responsibility that follows it, and it needs to be explicit."
        ),
        table(
            ["Transferred", "To", "Without which"],
            [["The running system", "Operations",
              "Nobody is answerable for it being up"],
             ["Support responsibility", "The support function",
              "Users have nowhere to go"],
             ["The code and its documentation", "Whoever maintains it",
              "The next change costs a rediscovery"],
             ["Outstanding known defects", "The maintenance backlog",
              "They are quietly forgotten"],
             ["Accounts, keys and access", "The receiving teams",
              "The project team is needed forever"]],
            caption="Five things handed over, and the consequence of "
                    "omitting each.",
            footer="The last row is the practical failure. A system whose "
                   "administrative access exists only in a departed project "
                   "member's account is a system nobody can maintain, and "
                   "recovering from that is far harder than transferring it "
                   "would have been."),
        desc(
            "Handover is a date with named recipients, not a gradual fading "
            "of the project team. An ambiguous handover leaves everybody "
            "assuming somebody else is answerable, which is discovered during "
            "the first incident."
        ),
    ]),

    ("Documentation for the Receivers", [
        desc(
            "What was written for building is not what is needed for "
            "running, and the difference is examined."
        ),
        ul([
            "OPERATIONS need: how to start, stop, monitor, back up, restore "
            "and recover it.",
            "SUPPORT need: what commonly goes wrong, how to recognise it, and "
            "what to do.",
            "MAINTAINERS need: how it is structured, why the significant "
            "decisions were made, and how to build and deploy it.",
            "USERS need: how to accomplish their tasks, not a description of "
            "every screen.",
            "All of them need it to be CURRENT, since documentation trusted "
            "and wrong is worse than none.",
        ]),
        desc(
            "The maintainers' entry includes the decision record from the "
            "architecture lesson, and this is when it pays. Whoever changes "
            "the system in three years cannot ask why something was done -- "
            "and without the record, will either repeat the rejected approach "
            "or preserve a constraint that no longer applies."
        ),
    ]),

    ("Conditional Acceptance", [
        desc(
            "Acceptance is not always a plain yes or no, and the middle "
            "position needs to be handled deliberately."
        ),
        table(
            ["Outcome", "Means", "Requires"],
            [["Accepted", "The criteria are met", "Handover proceeds"],
             ["Conditionally accepted",
              "Met apart from named items, with dates",
              "A written list, owners and deadlines"],
             ["Rejected", "The criteria are not met",
              "A retest after the work is done"]],
            caption="Three outcomes, of which the middle one is the "
                    "commonest.",
            footer="Conditional acceptance is where obligations quietly "
                   "evaporate. Without written items, owners and dates, the "
                   "system is in service and the conditions are somebody's "
                   "recollection."),
        desc(
            "The risk is asymmetric and worth naming. Once a system is in "
            "use, the pressure to complete outstanding conditions falls "
            "sharply -- the urgent problem has gone -- so the conditions must "
            "carry dates agreed while the leverage still exists."
        ),
    ]),

    ("Planning the Acceptance Period", [
        desc(
            "Acceptance testing is business users doing a job that is not "
            "their job, for a fixed period, and it fails when that is not "
            "planned for."
        ),
        ul([
            "Agree who will test, and get them released from their normal "
            "duties for the period rather than expected to do both.",
            "Agree the window, and what happens if it overruns.",
            "Prepare the scenarios in advance, since users asked to 'try it "
            "and see' test the paths they already understand.",
            "Provide realistic data, because a system that works on clean "
            "data proves little about the real thing.",
            "Agree how progress will be reported, so the schedule is visible "
            "rather than discovered at the deadline.",
        ]),
        desc(
            "The first point decides the rest. Testers doing acceptance "
            "alongside a full workload test in the gaps, so coverage is thin "
            "and the schedule slips for reasons nobody planned -- and both "
            "are attributed to the system rather than to the arrangement."
        ),
    ]),

    ("Pilot Operation", [
        desc(
            "Between acceptance and full deployment, some systems run for "
            "real with a limited group -- which answers questions testing "
            "cannot."
        ),
        compare_grid(
            "WHAT A PILOT ADDS TO ACCEPTANCE TESTING",
            "Same system, different conditions.",
            [("Acceptance testing",
              ["Prepared scenarios, run deliberately",
               "Testers know they are testing",
               "Data is selected for the test",
               "Finds whether the specified behaviour is right"]),
             ("Pilot operation",
              ["Real work, with real consequences",
               "Users behave as they actually behave",
               "Data is whatever the day produces",
               "Finds what nobody thought to test"])]),
        desc(
            "A pilot is where the workarounds reappear. Users under real "
            "pressure do what is fastest rather than what the training "
            "described, and the resulting behaviour is the behaviour the "
            "system will actually meet -- which is the same gap observation "
            "closed at the requirements stage."
        ),
    ]),

    ("Warranty and Ongoing Obligations", [
        desc(
            "Acceptance rarely ends the supplier's involvement, and what "
            "follows is defined rather than assumed."
        ),
        table(
            ["Obligation", "Typically covers", "Needs agreeing"],
            [["Warranty period", "Defects found soon after acceptance",
              "How long, and what counts as a defect"],
             ["Support arrangement", "Answering questions and incidents",
              "Hours, response times, escalation"],
             ["Maintenance agreement", "Corrective and adaptive changes",
              "What is included and what is charged"],
             ["Enhancement work", "New functionality",
              "How it is requested, estimated and funded"]],
            caption="Four post-acceptance obligations.",
            footer="The second column of the warranty row is the one that "
                   "gets disputed. A warranty covering 'defects' returns "
                   "everybody to the defect-against-change-request question, "
                   "so the classification rule matters here too."),
        desc(
            "Agreeing these before acceptance rather than after is the same "
            "principle as agreeing the criteria: once something has gone "
            "wrong, both parties read an unwritten arrangement in the "
            "direction that suits them."
        ),
    ]),

    ("Closing the Project", [
        desc(
            "The project itself ends, and closing it properly is what makes "
            "the next one better."
        ),
        ol([
            "Confirm every deliverable was handed over and accepted, with "
            "nothing outstanding assumed.",
            "Close the contracts and the accounts, and release the people "
            "formally rather than by attrition.",
            "Record the outstanding defects and open change requests where "
            "the maintenance function will see them.",
            "Hold a review: what went well, what did not, and what should be "
            "done differently.",
            "Record the benefits promised and the date they will be measured, "
            "with somebody who remains owning that.",
        ]),
        desc(
            "Step five is the one that is almost never done. The benefits "
            "that justified the funding are measurable only months later, by "
            "which time the team has dispersed -- so unless a named person "
            "and a date exist, the question of whether the project achieved "
            "what it was for is simply never asked."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where acceptance items are lost."),
        ul([
            "Agreeing acceptance criteria after the system exists, when both "
            "sides read ambiguity in their own favour.",
            "Skipping operational acceptance, so a system the business "
            "accepts cannot actually be run.",
            "Treating every acceptance finding as a defect, or every one as a "
            "change request.",
            "Failing to name who may sign acceptance.",
            "Handing over without transferring accounts and access.",
            "Delivering build documentation where operational documentation "
            "was needed.",
            "Letting handover happen gradually, so nobody knows when "
            "responsibility moved.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"During acceptance testing a user reports that the system "
            "cannot produce a report they need monthly. The report was never "
            "in the specification. How should this be handled?\""
        ),
        ol([
            "Check the specification: the system does what was agreed, so "
            "this is not a defect.",
            "Recognise the need as real -- the user does require the report, "
            "and their work is evidence of that.",
            "Classify it as a CHANGE REQUEST, which is a statement about the "
            "agreement rather than about the user's judgement.",
            "Assess its impact on cost and schedule, and put the decision to "
            "whoever is empowered to fund it.",
            "Separate the decision from acceptance: the system may still be "
            "accepted against the agreed criteria while the change is decided "
            "on its own merits.",
        ]),
        desc(
            "Step five is what prevents this becoming a deadlock. Bundling "
            "unspecified needs into the acceptance decision holds the whole "
            "delivery hostage to items nobody agreed to build -- and "
            "separating them is what lets both questions be answered "
            "properly."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Acceptance closes the loop the requirements stage opened."),
        ul([
            "Acceptance criteria come from the requirements stage, which is "
            "the V-model pairing.",
            "Operational acceptance addresses the stakeholder group the "
            "requirements lesson identified as omitted.",
            "The defect-or-change distinction is change control from the "
            "configuration lesson.",
            "Handover to operations begins the service management life "
            "cycle.",
            "Decision records written at architecture time are what "
            "maintainers receive here.",
            "Outstanding defects become the maintenance backlog of the next "
            "lesson.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What acceptance testing asks",
              "Whether it meets the business NEED",
              "System testing asked about the specifications; only the "
              "customer can answer this one."),
             ("When acceptance criteria are agreed",
              "At requirements time, before the system exists",
              "Afterwards, both sides read ambiguity in their own favour and "
              "neither is being unreasonable."),
             ("Defect against change request",
              "Does the system do what was SPECIFIED",
              "A change request is a real need that was not agreed, not a "
              "rejected complaint."),
             ("Which acceptance form is most often skipped",
              "Operational acceptance",
              "So a system the business accepts cannot be run, and the cost "
              "appears every day after."),
             ("What handover must include besides the system",
              "Accounts, keys and access",
              "Access existing only in a departed member's account makes the "
              "system unmaintainable."),
             ("Why decision records matter at handover",
              "The maintainer cannot ask why",
              "Without them they repeat a rejected approach or preserve a "
              "dead constraint.")]),
    ]),
]

_acc_quiz = [
    mcq("HARD",
        "During acceptance testing a user needs a monthly report that was "
        "never specified.\n\nHow should it be handled?",
        [("As a change request, assessed and decided separately from the "
          "acceptance decision", True),
         ("As a defect, since the system does not support the user's actual "
          "work", False),
         ("As grounds for rejecting the system until the report is "
          "provided", False),
         ("As a requirement to be added without assessment, since acceptance "
          "is at risk", False)],
        "The system does what was specified, so this is not a defect -- and "
        "the need is genuine, so it is not a refusal either. Classifying it "
        "as a change request states something about the AGREEMENT rather than "
        "about the user's judgement. Keeping it separate from acceptance "
        "matters: bundling unspecified needs into that decision holds the "
        "delivery hostage to items nobody agreed to build."),

    mcq("AVERAGE",
        "What question does acceptance testing answer that system testing "
        "does not?",
        [("Whether the system meets the business need", True),
         ("Whether the system meets its documented system "
          "requirements", False),
         ("Whether the components work correctly together", False),
         ("Whether the system performs adequately under load", False)],
        "System testing checks the system against the specifications, which "
        "were an attempt to capture the need. Acceptance testing asks whether "
        "that attempt succeeded -- whether the system actually supports the "
        "work -- and only the customer can answer it. It is also a DECISION "
        "with contractual consequences rather than a source of defect "
        "reports."),

    mcq("HARD",
        "Which form of acceptance testing is most often omitted, with costs "
        "lasting the system's whole life?",
        [("Operational acceptance testing", True),
         ("User acceptance testing by business staff", False),
         ("Contract acceptance against the agreed obligations", False),
         ("Beta testing with a subset of real users", False)],
        "Operations staff confirming they can run, monitor, back up, restore "
        "and restart the system is the form projects skip, because the "
        "business is focused on whether it does the work. A system accepted "
        "by users and unrunnable by operations generates cost every day "
        "afterwards -- the same stakeholder omission the requirements stage "
        "makes, arriving at the last moment it could be corrected cheaply."),

    mcq("AVERAGE",
        "Why must acceptance criteria be agreed before the system is built?",
        [("Afterwards both parties read ambiguity in whichever direction "
          "favours them", True),
         ("Contracts cannot be signed without criteria being "
          "documented", False),
         ("Developers need the criteria to design their unit "
          "tests", False),
         ("Criteria written later cannot be traced to requirements", False)],
        "Once a system exists, an ambiguous criterion is read by the supplier "
        "as satisfied and by the customer as not -- and neither is being "
        "unreasonable, which is what makes the dispute hard to resolve. "
        "Agreeing them at requirements time, when neither side knows which "
        "reading will suit them, produces criteria both can live with."),

    mcq("AVERAGE",
        "What distinguishes a defect from a change request?",
        [("Whether the system does what was specified", True),
         ("Whether the user's need is genuine and reasonable", False),
         ("Whether the correction requires changing existing code", False),
         ("Whether the issue was found before or after acceptance", False)],
        "The specification is the evidence: failing to do what was agreed is "
        "a defect, and doing what was agreed while the agreement did not "
        "cover a real need is a change request. The distinction is about the "
        "AGREEMENT and not about whether the user is right, which matters "
        "because a change request is a decision to be funded rather than a "
        "complaint being dismissed."),

    mcq("HARD",
        "A project team disperses at handover, and administrative access to "
        "the system exists only in a departed member's account.\n\n"
        "What has gone wrong?",
        [("Accounts, keys and access were not transferred as part of "
          "handover", True),
         ("The system's documentation was insufficient for the maintenance "
          "team", False),
         ("Operational acceptance testing did not exercise administrative "
          "functions", False),
         ("The support function was not given a defined escalation "
          "route", False)],
        "Handover transfers the running system, support responsibility, the "
        "code and documentation, outstanding defects AND the credentials "
        "needed to act on any of it. A system whose administrative access "
        "left with somebody is one nobody can maintain, and recovering that "
        "access afterwards is considerably harder than transferring it would "
        "have been."),

    mcq("AVERAGE",
        "What do operations staff need from handover documentation that "
        "development documentation does not provide?",
        [("How to start, monitor, back up, restore and recover the "
          "system", True),
         ("The rationale behind the significant architectural "
          "decisions", False),
         ("The interfaces each module provides and requires", False),
         ("The test cases used to verify each requirement", False)],
        "Documentation written while building describes how the system is "
        "constructed. Running it requires an entirely different set of "
        "procedures, and a project delivering only the first has documented "
        "the system to developers alone. Architectural rationale is what "
        "MAINTAINERS need, which is a third audience with a third set of "
        "needs."),

    mcq("HARD",
        "Why should acceptance not be withheld pending items classified as "
        "change requests?",
        [("It holds the delivery hostage to work nobody agreed to "
          "build", True),
         ("Change requests are always less important than the delivered "
          "functionality", False),
         ("Acceptance criteria cannot be modified once testing has "
          "begun", False),
         ("Withheld acceptance prevents the supplier from fixing genuine "
          "defects", False)],
        "The system either meets the agreed criteria or it does not, and that "
        "question has an answer independent of needs discovered later. "
        "Bundling unagreed work into the decision means delivery cannot "
        "complete until unfunded work is done, which serves neither side. "
        "Both questions are answerable separately, and separating them is "
        "what lets each be answered properly."),

    mcq("AVERAGE",
        "Why must handover happen on a defined date with named recipients?",
        [("Otherwise everybody assumes somebody else is answerable, "
          "discovered during the first incident", True),
         ("Contracts require a documented transfer of ownership before "
          "payment", False),
         ("The project team cannot be reassigned until handover is "
          "recorded", False),
         ("Support statistics must be attributed to the correct "
          "team", False)],
        "A gradual fading of the project team leaves responsibility "
        "ambiguous, and ambiguity is not noticed while nothing is wrong. The "
        "first incident is when everybody discovers each of them believed "
        "another was answerable -- which is precisely the moment when "
        "establishing it is hardest and most costly."),

    mcq("HARD",
        "During acceptance testing, a tester is blocked awaiting an answer "
        "from the development team.\n\nWhy does this matter more than it "
        "appears?",
        [("Acceptance has a schedule, and a blocked tester stops testing "
          "entirely", True),
         ("Blocked testers report the delay as a defect against the "
          "system", False),
         ("The environment must be reset each time testing is "
          "interrupted", False),
         ("Testers cannot resume a scenario once it has been "
          "suspended", False)],
        "Acceptance runs to a schedule with contractual consequences, and "
        "business users testing are away from their normal work for a defined "
        "period. A tester waiting for an answer is not testing anything else "
        "meanwhile, so slow responses consume the window directly -- which is "
        "why prompt support during acceptance is real work for the "
        "development team rather than a courtesy."),
]

LESSON_DEV_ACC = lesson(
    MAJOR, MIDDLE,
    "Acceptance Support and Handover",
    _acc_quiz,
    lesson_structure(
        "Acceptance Support and Handover",
        "Every earlier test was run by the people who built the system. "
        "Acceptance is run by the people who asked for it, and asks whether "
        "the system meets the business NEED rather than the specifications "
        "that tried to capture it -- which makes it a decision with "
        "contractual consequences rather than a source of defect reports. "
        "This lesson covers criteria agreed before the system exists, the "
        "forms of acceptance including the operational one projects skip, the "
        "defect-against-change-request distinction that causes this stage's "
        "characteristic dispute, and handover as a dated transfer of "
        "responsibility -- including the accounts and access whose omission "
        "leaves a system nobody can maintain.",
        [
            "Distinguish acceptance testing from system testing",
            "Explain why acceptance criteria are agreed before construction",
            "Describe the forms of acceptance testing and identify the "
            "omitted one",
            "Support a customer's acceptance testing effectively",
            "Distinguish a defect from a change request on principle",
            "Explain why the two are decided separately from acceptance",
            "List what handover must transfer",
            "Match documentation to the audience receiving it",
        ],
        75,
        _acc_sections,
        [
            ("Acceptance testing",
             "Run by the customer against the business need. A decision, not "
             "a defect-finding exercise."),
            ("Acceptance criteria",
             "Agreed at requirements time, objective enough that both parties "
             "reach the same conclusion."),
            ("User acceptance testing",
             "Business users working real scenarios, deciding whether the "
             "system supports their actual work."),
            ("Operational acceptance testing",
             "Operations confirming they can run, monitor, back up and "
             "restore it. The form most often skipped."),
            ("Alpha and beta testing",
             "For a product with many customers: at the developer's site, and "
             "with real users in their own environment."),
            ("Defect",
             "The system does not do what was specified. Fixed within the "
             "existing agreement."),
            ("Change request",
             "A real need the agreement did not cover. Assessed, funded and "
             "decided -- not a rejected complaint."),
            ("Handover",
             "A dated transfer of the system, support, code, outstanding "
             "defects and ACCESS to named recipients."),
            ("Operational documentation",
             "How to run the system, which is a different document from how "
             "it was built."),
        ],
        "Acceptance testing is the customer's own test, asking whether the "
        "system meets the business NEED rather than the specifications that "
        "attempted to capture it -- and its outcome is a decision with "
        "contractual consequences. Criteria must be agreed at requirements "
        "time, because once a system exists both sides read an ambiguous "
        "criterion in whichever direction favours them and neither is being "
        "unreasonable. Among the forms, OPERATIONAL acceptance is the one "
        "projects skip, leaving a system the business accepts and operations "
        "cannot run -- the same stakeholder omission the requirements stage "
        "makes, arriving at the last moment it could be fixed cheaply. The "
        "characteristic dispute is DEFECT against CHANGE REQUEST, decided by "
        "the specification rather than by whether the user is right: a change "
        "request is a genuine need that was not agreed, and it is assessed "
        "and funded separately rather than bundled into the acceptance "
        "decision, which would hold delivery hostage to unagreed work. "
        "Handover then transfers the running system, support, code, "
        "outstanding defects and -- most practically -- the accounts and keys "
        "without which nobody can maintain it, on a defined date to named "
        "recipients, since an ambiguous handover is discovered during the "
        "first incident.",
        exam_notes=[
            desc(
                "Items describe something found during acceptance and ask how "
                "it should be classified or handled."
            ),
            ul([
                "Classifying a finding as a defect or a change request.",
                "Explaining why criteria are agreed in advance.",
                "Identifying the omitted acceptance form.",
                "Stating what acceptance testing asks.",
                "Identifying what handover failed to transfer.",
                "Matching documentation to its audience.",
                "Explaining why change requests are decided separately.",
            ]),
            desc(
                "For any acceptance finding, ask one question: does the "
                "system do what was SPECIFIED. If it does, the finding is a "
                "change request however reasonable the need -- and saying so "
                "is a statement about the agreement, not about the person "
                "raising it."
            ),
        ],
    ))

# ==========================================================================
# Lesson 10: Maintenance, evolution and disposal
# ==========================================================================

_maint_sections = [
    ("Where the Money Actually Goes", [
        desc(
            "Delivery feels like the end of a project and is closer to the "
            "beginning of the expenditure."
        ),
        image(fig("development-lifecycle")),
        desc(
            "Most of a system's total cost occurs AFTER it is delivered, "
            "across the years it is operated and changed. That single fact is "
            "what justifies nearly every practice in this category -- "
            "reviews, documentation, low coupling, automated tests -- because "
            "each spends effort during development to reduce effort during "
            "the far longer period afterwards."
        ),
        desc(
            "It also reframes what a good design is. A design optimised for "
            "how quickly it can be built, at the expense of how easily it can "
            "be changed, has optimised the smaller number -- which is the "
            "reasoning behind judging architectural decisions by their effect "
            "on maintenance."
        ),
    ]),

    ("The Kinds of Maintenance", [
        desc(
            "Maintenance is not one activity, and the syllabus's four "
            "categories are examined directly."
        ),
        table(
            ["Kind", "Responds to", "Example"],
            [["Corrective", "A defect found in operation",
              "Fixing a calculation that is wrong"],
             ["Adaptive", "A change in the environment",
              "A new operating system version, or a changed tax rate"],
             ["Perfective", "A request for improvement",
              "New functionality, or better performance"],
             ["Preventive", "A problem not yet experienced",
              "Restructuring code before it becomes unmaintainable"]],
            caption="Four kinds of maintenance and what prompts each.",
            footer="PERFECTIVE maintenance is typically the largest share, "
                   "which surprises people who assume maintenance means "
                   "fixing. Most post-delivery effort goes on making the "
                   "system do more, not on repairing what it does."),
        desc(
            "PREVENTIVE maintenance is the category hardest to fund, because "
            "it addresses a problem nobody has experienced yet. It is also "
            "the one whose absence produces the systems that eventually "
            "cannot be changed at all -- which is the argument that has to be "
            "made in advance to be worth anything."
        ),
    ]),

    ("Why Systems Deteriorate", [
        desc(
            "Software does not wear out, and it becomes harder to change "
            "anyway. The syllabus expects the reasons."
        ),
        ol([
            "Each change is made under time pressure, by somebody who "
            "understands part of the system.",
            "Structure erodes: the change that fits the design is slower than "
            "the one that works, and the second is chosen.",
            "The design and the code drift apart, so the documentation "
            "describes something that no longer exists.",
            "Knowledge leaves with people, and what remains is what was "
            "written down.",
            "Each subsequent change is therefore more expensive than the "
            "last, until estimates stop being reliable.",
        ]),
        desc(
            "This is why the maintainability practices are not optional "
            "refinements. Left alone, a system's changeability decreases "
            "monotonically -- so keeping it changeable requires deliberate "
            "effort applied continuously, not a decision taken once at design "
            "time."
        ),
    ]),

    ("Refactoring", [
        desc(
            "The deliberate effort has a name: improving a system's structure "
            "without changing what it does."
        ),
        ul([
            "The behaviour must be preserved exactly, which is what "
            "distinguishes it from a change.",
            "It requires tests, since without them nobody can confirm the "
            "behaviour was preserved.",
            "It is done in small steps, each verified, rather than as a "
            "rewrite.",
            "It is what pays down the technical debt of the construction "
            "lesson.",
            "It is safest immediately before a change, since restructuring "
            "the area about to be modified makes the modification easier.",
        ]),
        desc(
            "The second point is the dependency that decides whether "
            "refactoring is available at all. A system without tests cannot "
            "be safely restructured, so it cannot be kept maintainable, so it "
            "deteriorates -- which is how a missing test suite becomes a "
            "structural problem rather than a quality one."
        ),
    ]),

    ("Managing Change Requests", [
        desc(
            "Maintenance work arrives as requests, and handling them is a "
            "process rather than a queue."
        ),
        ol([
            "Record the request, with who wants it and why.",
            "Assess its impact -- what must change, what must be retested, "
            "what it costs.",
            "Decide, by somebody with authority over the priorities and the "
            "budget.",
            "Implement, with the same review and testing standards as "
            "original development.",
            "Release, and update the documentation and the baseline.",
        ]),
        desc(
            "Step four is where maintenance quality is decided. A change made "
            "with less review and less testing than the original code was "
            "given is a change that degrades the system's quality by "
            "construction -- and over years of such changes, that is exactly "
            "what happens."
        ),
    ]),

    ("Regression and Impact Analysis", [
        desc(
            "The characteristic risk of maintenance is breaking something "
            "that was working."
        ),
        image(fig("regression-risk")),
        desc(
            "IMPACT ANALYSIS establishes what a proposed change would affect "
            "before it is made -- which parts of the system depend on what is "
            "being altered, and therefore what must be retested. It is what "
            "traceability from the requirements lesson exists to support."
        ),
        desc(
            "Without it, the retesting scope is a guess, and guessing "
            "produces either a full regression run nobody can afford or a "
            "narrow one that misses the affected area. Both failures are "
            "common, and the second ships defects into parts of the system "
            "nobody touched."
        ),
    ]),

    ("Legacy Systems", [
        desc(
            "Some systems reach a state where ordinary maintenance is no "
            "longer sufficient, and the syllabus names the options."
        ),
        content_tabs(
            "FOUR OPTIONS FOR A LEGACY SYSTEM",
            "Ordered by cost and by how much is preserved.",
            [("Continue maintaining",
              "keep it running",
              "Correct as required and change as little as possible. Cheapest "
              "per year and increasingly expensive per change, and it works "
              "until the skills or the platform become unavailable."),
             ("Wrap it",
              "leave it, and give it a modern interface",
              "The old system continues to work behind a new interface, so "
              "new development can proceed without touching it. Buys time "
              "rather than solving anything."),
             ("Re-engineer",
              "rebuild it from what it does",
              "Reconstruct the system on a modern platform, preserving "
              "behaviour. Expensive, and the behaviour is often only "
              "documented by the code itself."),
             ("Replace",
              "buy or build something new",
              "A new system, with the migration and transition of the "
              "previous lesson. The largest change and the only one that "
              "escapes the original design's limits.")]),
        desc(
            "The reason legacy systems persist is worth naming plainly: they "
            "work, and what they do is frequently documented nowhere except "
            "in their own code. Replacing one means first discovering what it "
            "actually does, including the behaviour the business depends on "
            "and nobody remembers requesting."
        ),
    ]),

    ("Disposal", [
        desc(
            "Systems end, and the syllabus treats retirement as a stage with "
            "its own obligations rather than as switching something off."
        ),
        ul([
            "Decide what happens to the DATA: what must be retained, for how "
            "long, and in what form it will remain readable.",
            "Retain what legal and regulatory obligations require, which may "
            "outlast the system by years.",
            "Destroy the rest properly, since deletion leaves data "
            "recoverable.",
            "Revoke access, licences and interfaces that other systems still "
            "hold.",
            "Tell everyone who depended on it, including the systems that "
            "called it and the people who read its reports.",
        ]),
        desc(
            "The retention obligation is the one that catches projects. Data "
            "that must be kept for seven years cannot simply be left in a "
            "decommissioned system -- it must remain READABLE, which means "
            "migrating it somewhere that will still be running, or preserving "
            "the means to read it."
        ),
    ]),

    ("Measuring Maintainability", [
        desc(
            "Maintainability is a quality requirement like any other, which "
            "means it can be measured rather than merely hoped for."
        ),
        table(
            ["Measure", "Indicates"],
            [["Mean time to repair a defect",
              "How quickly the system can be understood and changed"],
             ["Proportion of changes causing a regression",
              "Whether the test suite and structure are holding"],
             ["Effort per change over time",
              "Whether changeability is improving or eroding"],
             ["Code complexity measures",
              "Where the difficult areas are concentrated"],
             ["Age and size of the change backlog",
              "Whether maintenance capacity matches demand"]],
            caption="Five measures of a system's maintainability.",
            footer="The third row is the one worth watching. A rising effort "
                   "per change is the erosion happening, visible early enough "
                   "to act on -- whereas the usual signal is estimates "
                   "becoming unreliable, which arrives far later."),
        desc(
            "These are measures of the SYSTEM rather than of the people "
            "working on it, which is what makes them usable. Effort per "
            "change rising over years says something about the codebase, and "
            "treating it as a productivity problem is what produces the wrong "
            "response entirely."
        ),
    ]),

    ("Documentation During Maintenance", [
        desc(
            "Documentation is written once and diverges continuously unless "
            "updating it is part of every change."
        ),
        ul([
            "Update the documentation in the same change as the code, since a "
            "separate task is a task that gets deferred.",
            "Prefer documentation close to what it describes, because "
            "distance is what lets the two drift apart.",
            "Record the reason for a non-obvious change, since the next "
            "maintainer will otherwise wonder and may undo it.",
            "Delete documentation that has become wrong rather than leaving "
            "it, because wrong documentation is trusted.",
            "Keep the operational documentation current above all, since it "
            "is read under pressure by people who cannot ask.",
        ]),
        desc(
            "The fourth point is counter-intuitive and correct. Documentation "
            "known to be unreliable still gets believed by somebody who does "
            "not know that, and removing it at least forces them to look at "
            "the system -- which is a slower and accurate answer instead of a "
            "fast and wrong one."
        ),
    ]),

    ("Deciding Whether to Replace", [
        desc(
            "The decision to retire a system is an economic one, and the "
            "syllabus expects the factors rather than a rule."
        ),
        ol([
            "Establish what maintaining it actually costs each year, "
            "including the changes it makes impossible.",
            "Establish what replacing it would cost, including migration, "
            "transition and the disruption of both.",
            "Establish the risk of continuing: unsupported platforms, "
            "unavailable skills, a supplier withdrawing.",
            "Establish what a new system would allow that the current one "
            "prevents, since that is usually the real driver.",
            "Compare over a period long enough to matter -- a replacement "
            "costing three years of maintenance is not expensive if the "
            "system will run for ten.",
        ]),
        desc(
            "Step four is what makes the case in practice. Replacement is "
            "rarely justified by maintenance cost alone; it is justified by "
            "the business opportunities a rigid system is quietly preventing, "
            "which never appear on any maintenance budget."
        ),
    ]),

    ("Knowledge and People", [
        desc(
            "Much of what maintains a system is knowledge held by people, "
            "which is the least durable asset a project produces."
        ),
        compare_grid(
            "WHAT LEAVES WITH A PERSON, AND WHAT REMAINS",
            "The difference is what was written down or shared.",
            [("Leaves",
              ["Why an odd-looking approach was necessary",
               "Which parts are fragile and why",
               "Who to ask about the interfacing system",
               "The history that explains current behaviour"]),
             ("Remains",
              ["The code, and what it does",
               "Whatever was documented and kept current",
               "Whatever a second person also learned",
               "Decision records, if anybody wrote them"])]),
        desc(
            "The practical measures are unglamorous: more than one person "
            "familiar with each area, decisions recorded when taken, and "
            "handover treated as an event when somebody leaves rather than an "
            "afterthought. Each is cheap in advance and impossible to arrange "
            "retrospectively."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where maintenance items are lost."),
        ul([
            "Assuming maintenance means fixing. Perfective maintenance is "
            "usually the largest share.",
            "Confusing adaptive with perfective. Adaptive responds to the "
            "environment; perfective to a request.",
            "Treating refactoring as changing behaviour. It preserves "
            "behaviour exactly.",
            "Attempting to refactor without tests, which makes it unsafe "
            "rather than merely undocumented.",
            "Applying lower review and testing standards to maintenance than "
            "to development.",
            "Guessing the retesting scope instead of performing impact "
            "analysis.",
            "Treating disposal as switching off, and leaving retained data "
            "unreadable.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An operating system upgrade requires changes to an application "
            "that is working correctly. Which kind of maintenance is this?\""
        ),
        ol([
            "Check for a defect: the application is working correctly, so it "
            "is not corrective.",
            "Check for a request for improvement: nobody asked for new "
            "behaviour, so it is not perfective.",
            "Check for anticipation of a future problem: the problem is "
            "present, not anticipated, so it is not preventive.",
            "The prompt is a change in the ENVIRONMENT the system runs in.",
            "That is ADAPTIVE maintenance -- the system must adapt to "
            "surroundings that changed, while what it does stays the same.",
        ]),
        desc(
            "The four categories are distinguished by what PROMPTED the work "
            "rather than by what the work involves, which is the reasoning "
            "these items reward. Identical code changes can fall into "
            "different categories depending on why they were requested."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Maintenance is where the whole category is judged."),
        ul([
            "Low coupling and testable design from the design lessons are "
            "what make maintenance affordable.",
            "The automated suite from the construction lesson is what makes "
            "refactoring possible.",
            "Impact analysis depends on the traceability of the requirements "
            "lesson.",
            "Change control is the configuration management discipline "
            "covered next.",
            "Incident handling and service levels are Service Management.",
            "Retention and disposal obligations come from Legal Affairs.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("The four maintenance kinds",
              "Corrective, adaptive, perfective, preventive",
              "Distinguished by what PROMPTED the work, not by what the work "
              "involves."),
             ("Which is the largest share",
              "Perfective",
              "Most post-delivery effort makes the system do more, rather "
              "than repairing what it does."),
             ("What refactoring preserves",
              "Behaviour, exactly",
              "Which is why it needs tests -- without them nobody can confirm "
              "the preservation."),
             ("Why systems become harder to change",
              "Structure erodes under time pressure, change by change",
              "Changeability decreases unless deliberate effort is applied "
              "continuously."),
             ("What impact analysis produces",
              "The retesting scope",
              "Without it the scope is a guess, and guessing ships defects "
              "into untouched code."),
             ("The disposal obligation people miss",
              "Retained data must stay READABLE",
              "Seven-year retention is not satisfied by data left in a "
              "decommissioned system.")]),
    ]),
]

_maint_quiz = [
    mcq("HARD",
        "An operating system upgrade requires changes to an application that "
        "is working correctly.\n\nWhich kind of maintenance is this?",
        [("Adaptive", True),
         ("Corrective, since the application will otherwise stop "
          "working", False),
         ("Perfective, since the change improves the application's "
          "platform", False),
         ("Preventive, since it avoids a future failure", False)],
        "The categories are distinguished by what PROMPTED the work. Nothing "
        "is defective, nobody requested an improvement, and the problem is "
        "present rather than anticipated -- the prompt is a change in the "
        "environment the system runs in, which is adaptive maintenance. "
        "Identical code changes fall into different categories depending on "
        "why they were requested."),

    mcq("AVERAGE",
        "Which category typically accounts for the largest share of "
        "maintenance effort?",
        [("Perfective maintenance", True),
         ("Corrective maintenance, since defects accumulate over "
          "time", False),
         ("Adaptive maintenance, since platforms change "
          "frequently", False),
         ("Preventive maintenance, since it is performed "
          "continuously", False)],
        "Most post-delivery effort goes on making the system do MORE -- new "
        "functionality, better performance, changed business rules -- rather "
        "than on repairing what it already does. This surprises people who "
        "equate maintenance with fixing, and it is why maintenance capacity "
        "is a business investment question rather than a quality one."),

    mcq("HARD",
        "Why can a system without automated tests not be kept maintainable?",
        [("Refactoring cannot be verified, so structure erodes without "
          "remedy", True),
         ("Defects cannot be reproduced reliably enough to be "
          "corrected", False),
         ("Impact analysis cannot determine which components are "
          "affected", False),
         ("Maintenance changes cannot be reviewed before they are "
          "released", False)],
        "Refactoring must preserve behaviour exactly, and without tests "
        "nobody can confirm that it did -- so restructuring becomes unsafe "
        "and is not done. Structure then erodes with every change made under "
        "time pressure, and the system's changeability decreases "
        "monotonically. That is how a missing test suite becomes a structural "
        "problem rather than a quality one."),

    mcq("AVERAGE",
        "What distinguishes refactoring from other maintenance work?",
        [("It changes the structure while preserving behaviour "
          "exactly", True),
         ("It is performed only when a defect has been reported", False),
         ("It is applied to the whole system rather than one "
          "area", False),
         ("It does not require the changes to be reviewed or "
          "tested", False)],
        "Refactoring improves how the code is organised without altering what "
        "it does, which is what makes it verifiable by the existing tests. It "
        "is how technical debt is repaid, it is done in small verified steps "
        "rather than as a rewrite, and it is safest immediately before a "
        "change to the area being restructured."),

    mcq("HARD",
        "What does impact analysis produce, and why does it matter?",
        [("The retesting scope, since guessing it either costs too much or "
          "misses the affected area", True),
         ("An estimate of the effort the change will require to "
          "implement", False),
         ("A list of the stakeholders who must approve the "
          "change", False),
         ("The order in which the affected modules should be "
          "modified", False)],
        "Establishing what depends on the thing being changed determines what "
        "must be retested. Without it, the scope is a guess -- and guessing "
        "produces either an unaffordable full regression run or a narrow one "
        "that misses the affected area and ships defects into parts nobody "
        "touched. Traceability is what makes the analysis possible."),

    mcq("AVERAGE",
        "Software systems become progressively harder to change over "
        "their lives.\n\nWhat causes this?",
        [("Structure erodes as changes are made under time "
          "pressure", True),
         ("Code physically degrades in storage over long "
          "periods", False),
         ("Programming languages evolve away from the constructs "
          "used", False),
         ("The volume of code inevitably grows beyond comprehension", False)],
        "Software does not wear out, and each change made quickly by somebody "
        "who understands part of the system erodes the structure a little -- "
        "the change that fits the design is slower than the one that works. "
        "Documentation drifts, knowledge leaves with people, and each "
        "subsequent change costs more. Keeping a system changeable requires "
        "continuous deliberate effort."),

    mcq("HARD",
        "A legacy system is given a modern interface while continuing to run "
        "unchanged behind it.\n\nWhat has been achieved?",
        [("Time, since new development can proceed without touching "
          "it", True),
         ("Re-engineering, since the system now runs on a modern "
          "platform", False),
         ("A reduction in the cost of maintaining the underlying "
          "system", False),
         ("Elimination of the risk that the original platform becomes "
          "unsupported", False)],
        "Wrapping lets new work proceed against a modern interface while the "
        "old system continues doing what it always did -- which buys time "
        "rather than solving anything. The underlying system still needs the "
        "same skills and the same platform, and both risks remain. "
        "Re-engineering rebuilds it; wrapping deliberately does not."),

    mcq("AVERAGE",
        "What obligation is most often overlooked when a system is disposed "
        "of?",
        [("Retained data must remain readable for as long as it must be "
          "kept", True),
         ("Users must be given notice before the system is withdrawn", False),
         ("The system's licences must be formally terminated", False),
         ("The hardware must be returned to the supplier", False)],
        "Data subject to a seven-year retention obligation is not retained by "
        "leaving it in a decommissioned system -- it must be migrated "
        "somewhere that will still be running, or the means to read it "
        "preserved. Disposal is a stage with its own obligations rather than "
        "switching something off, and this is the one that produces "
        "compliance failures years later."),

    mcq("HARD",
        "Why is preventive maintenance the hardest category to fund?",
        [("It addresses a problem nobody has experienced yet", True),
         ("It requires more effort than the other categories "
          "combined", False),
         ("Its benefits cannot be measured after it has been "
          "performed", False),
         ("It must be performed during periods of system "
          "unavailability", False),
         ],
        "Corrective work has a visible failure behind it and perfective work "
        "has somebody asking. Preventive work asks for effort against a "
        "deterioration nobody has yet felt, which makes the case hard to win "
        "-- and its absence is what produces systems that eventually cannot "
        "be changed at all. The argument has to be made in advance to be "
        "worth anything."),

    mcq("AVERAGE",
        "Why should maintenance changes be reviewed and tested to the same "
        "standard as original development?",
        [("A lower standard degrades the system's quality by "
          "construction", True),
         ("Maintenance changes are more likely to contain defects than new "
          "code", False),
         ("Auditors require consistent evidence across the "
          "lifecycle", False),
         ("Maintenance staff are typically less experienced than the "
          "original team", False)],
        "Applying weaker review and testing to changes means each change "
        "makes the system slightly worse than the code it joins -- and over "
        "years of such changes, that is exactly what happens. The standard is "
        "not about who is making the change but about what a lower standard "
        "does to the system cumulatively."),
]

LESSON_DEV_MAINT = lesson(
    MAJOR, MIDDLE,
    "Maintenance, Evolution and Disposal",
    _maint_quiz,
    lesson_structure(
        "Maintenance, Evolution and Disposal",
        "Most of a system's total cost occurs AFTER delivery, and that single "
        "fact justifies nearly every practice in this category -- reviews, "
        "documentation, low coupling, automated tests -- because each spends "
        "development effort to reduce the far larger effort that follows. "
        "This lesson covers the four kinds of maintenance distinguished by "
        "what PROMPTED the work, why systems become harder to change even "
        "though software does not wear out, refactoring and its absolute "
        "dependence on tests, impact analysis as the thing that makes "
        "retesting scope a fact rather than a guess, the options for a legacy "
        "system, and disposal as a stage with obligations of its own.",
        [
            "Explain why most of a system's cost occurs after delivery",
            "Classify maintenance as corrective, adaptive, perfective or "
            "preventive",
            "Explain why systems deteriorate and what arrests it",
            "Describe refactoring and why it depends on tests",
            "Manage change requests to the same standard as development",
            "Explain what impact analysis produces",
            "Compare the options available for a legacy system",
            "Describe disposal obligations including data retention",
        ],
        80,
        _maint_sections,
        [
            ("Corrective maintenance",
             "Responding to a defect found in operation."),
            ("Adaptive maintenance",
             "Responding to a change in the environment -- a platform "
             "version, a changed rate."),
            ("Perfective maintenance",
             "Responding to a request for improvement. Typically the largest "
             "share of the effort."),
            ("Preventive maintenance",
             "Addressing a problem not yet experienced. The hardest to fund, "
             "and its absence produces unchangeable systems."),
            ("Structural erosion",
             "Changes made under pressure drift from the design, so "
             "changeability decreases unless effort is applied continuously."),
            ("Refactoring",
             "Improving structure while preserving behaviour exactly. "
             "Impossible to do safely without tests."),
            ("Impact analysis",
             "Establishing what a change affects, and therefore what must be "
             "retested."),
            ("Legacy options",
             "Continue maintaining, wrap, re-engineer, or replace -- in "
             "increasing order of cost and of what is escaped."),
            ("Wrapping",
             "A modern interface over an unchanged system. Buys time rather "
             "than solving anything."),
            ("Disposal",
             "Data retention and readability, proper destruction, access "
             "revocation, and telling everyone who depended on it."),
        ],
        "Delivery is closer to the start of the expenditure than the end of "
        "it, since most of a system's cost occurs across the years it is "
        "operated and changed -- which is what justifies every maintainability "
        "practice in this category and what makes a design optimised for "
        "build speed an optimisation of the smaller number. Maintenance "
        "divides by what PROMPTED it: corrective for a defect, adaptive for a "
        "changed environment, perfective for a requested improvement, and "
        "preventive for a problem not yet felt -- with perfective the largest "
        "share and preventive the hardest to fund. Software does not wear out "
        "and systems become harder to change anyway, because each change made "
        "under pressure erodes structure a little and documentation and "
        "knowledge drift away. Refactoring arrests that by improving "
        "structure while preserving behaviour EXACTLY, which is why it "
        "depends absolutely on tests -- and why a system without them cannot "
        "be kept maintainable. Change requests are assessed, decided by "
        "somebody with authority, and implemented to the SAME standard as "
        "original development, since a lower standard degrades the system by "
        "construction. Impact analysis turns retesting scope from a guess "
        "into a fact. And disposal is a stage with obligations: retained data "
        "must remain READABLE, the rest must be destroyed rather than "
        "deleted, and everybody who depended on the system must be told.",
        exam_notes=[
            desc(
                "Items describe a maintenance situation and ask for its "
                "classification or its prerequisite."
            ),
            ul([
                "Classifying maintenance by what prompted it.",
                "Identifying the largest maintenance category.",
                "Explaining refactoring's dependence on tests.",
                "Explaining why systems deteriorate.",
                "Stating what impact analysis produces.",
                "Comparing legacy system options.",
                "Identifying an overlooked disposal obligation.",
            ]),
            desc(
                "For a maintenance classification item, ask what PROMPTED the "
                "work rather than what the work involves. The same code "
                "change is adaptive if a platform forced it and perfective if "
                "somebody requested it, which is exactly what the four "
                "categories distinguish."
            ),
        ],
    ))

LESSONS = [LESSON_DEV_ACC, LESSON_DEV_MAINT]

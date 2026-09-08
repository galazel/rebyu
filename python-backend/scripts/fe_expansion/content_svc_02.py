"""Service Management, lessons 3 and 4.

The operational processes -- incident, problem, change and service level --
and service operation with the service desk.

Incident against problem management is the distinction the examination
presses hardest in this category, so it is treated as two different questions
rather than two names for handling failures.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Service Management"
MIDDLE = "Service Management"

# ==========================================================================
# Lesson 3: The operational processes
# ==========================================================================

_proc_sections = [
    ("Four Processes, Four Questions", [
        desc(
            "The processes that keep a service running are constantly "
            "confused with one another, and each answers a different "
            "question."
        ),
        image(fig("incident-vs-problem")),
        table(
            ["Process", "Asks", "Succeeds when"],
            [["Incident management", "How do we restore service NOW",
              "Service is restored, by any acceptable means"],
             ["Problem management", "WHY did that happen",
              "The underlying cause is removed"],
             ["Change management", "Should this change be made, and how",
              "The change happens without causing disruption"],
             ["Service level management",
              "Are we delivering what was agreed",
              "Performance matches the agreement, or is corrected"]],
            caption="Four processes and the question each answers.",
            footer="The first two rows are what the examination presses "
                   "hardest. Restoring service with a workaround is a "
                   "COMPLETE success for incident management and leaves the "
                   "problem entirely unaddressed."),
    ]),

    ("Incident Management", [
        desc(
            "An incident is an unplanned interruption or reduction in the "
            "quality of a service, and the process exists to restore normal "
            "operation as quickly as possible."
        ),
        image(fig("incident-flow")),
        ol([
            "DETECT and LOG it, whether from monitoring or from a user.",
            "CATEGORISE and PRIORITISE it, so effort matches consequence.",
            "INVESTIGATE and DIAGNOSE enough to restore service, which is "
            "not the same as understanding it.",
            "RESOLVE and RECOVER, by fix or by workaround.",
            "CLOSE it, with the user agreeing service is restored.",
            "Pass it to PROBLEM management if the cause remains unknown.",
        ]),
        desc(
            "Step three carries the distinction. Incident management "
            "diagnoses only as far as restoration requires, and stopping "
            "there is correct rather than lazy -- a service restored in "
            "twenty minutes by a restart has succeeded, and the question of "
            "why it needed one belongs to a different process."
        ),
    ]),

    ("Prioritising Incidents", [
        desc(
            "Priority decides what gets attention first, and it is computed "
            "rather than negotiated."
        ),
        table(
            ["", "Low urgency", "High urgency"],
            [["High impact", "Important, and can be scheduled",
              "Highest priority -- act now"],
             ["Low impact", "Lowest priority",
              "Attend to it, and it affects few"]],
            caption="Priority as impact combined with urgency.",
            footer="IMPACT is how much of the business is affected; URGENCY "
                   "is how fast the damage grows. Deriving priority from "
                   "these rather than from who is asking is what makes it "
                   "defensible -- and it is why a senior person's minor "
                   "problem does not outrank an outage."),
        desc(
            "ESCALATION comes in two kinds. FUNCTIONAL escalation passes an "
            "incident to people with more specialist knowledge; HIERARCHICAL "
            "escalation informs somebody with more authority. They are used "
            "for different reasons and confusing them means summoning "
            "managers to a technical problem."
        ),
    ]),

    ("Problem Management", [
        desc(
            "Problem management asks why incidents happen and removes the "
            "causes, which is a slower and entirely different activity."
        ),
        ul([
            "A PROBLEM is the underlying cause of one or more incidents.",
            "It may be investigated REACTIVELY, after incidents occur, or "
            "PROACTIVELY, by analysing trends before anybody reports "
            "anything.",
            "A KNOWN ERROR is a problem whose cause is identified and whose "
            "workaround is documented, even if no permanent fix exists yet.",
            "The known error database is what lets incident management "
            "restore service quickly for a recurring fault.",
            "Resolution normally requires a CHANGE, which goes through change "
            "management like any other.",
        ]),
        desc(
            "The relationship between the processes is what makes them work "
            "together. Problem management produces workarounds that incident "
            "management applies, so the two combine into fast restoration "
            "now and fewer incidents later -- and an organisation running "
            "only incident management restores service indefinitely without "
            "the volume ever falling."
        ),
    ]),

    ("Finding the Cause", [
        desc(
            "Root cause analysis has a method, and the examination expects "
            "the discipline rather than a particular technique."
        ),
        ol([
            "Establish what actually happened, from evidence rather than "
            "recollection.",
            "Establish what changed, since most problems follow a change.",
            "Form a hypothesis explaining EVERY symptom, not the most "
            "prominent one.",
            "Test it, by prediction or by controlled change.",
            "Distinguish the CAUSE from the TRIGGER, since a change that "
            "exposed a weakness did not create it.",
        ]),
        desc(
            "Step five is the one that changes what gets fixed. Recording "
            "that a deployment caused an outage invites restricting "
            "deployments; recording that the deployment exposed a missing "
            "redundancy invites fixing the redundancy -- and only the second "
            "prevents the next outage from a different trigger."
        ),
    ]),

    ("Change Management", [
        desc(
            "Most incidents follow a change, which is why controlling changes "
            "is an operational discipline rather than an administrative one."
        ),
        ol([
            "The change is REQUESTED and recorded.",
            "Its impact and risk are ASSESSED, including what it affects "
            "beyond its own area.",
            "It is AUTHORISED by somebody with appropriate authority for its "
            "risk.",
            "It is SCHEDULED, considering what else is happening.",
            "It is IMPLEMENTED, with a tested way back.",
            "It is REVIEWED, to confirm it achieved what was intended and "
            "caused nothing else.",
        ]),
        desc(
            "The syllabus distinguishes three kinds. A STANDARD change is "
            "pre-authorised because it is routine and well understood. A "
            "NORMAL change goes through the full assessment. An EMERGENCY "
            "change is expedited because waiting would cause more harm than "
            "acting -- and is assessed retrospectively rather than not at "
            "all."
        ),
        desc(
            "Pre-authorising standard changes is what keeps the process "
            "usable. A control requiring a board's approval for a password "
            "reset is a control people bypass, and bypassing becomes the "
            "habit that then applies to changes that mattered."
        ),
    ]),

    ("Service Level Management in Operation", [
        desc(
            "Agreements are only useful if performance against them is "
            "measured and acted on."
        ),
        image(fig("sla-structure")),
        table(
            ["Layer", "Between", "Must support"],
            [["SLA", "Provider and customer",
              "What the business was promised"],
             ["OLA", "Provider and its internal teams",
              "What the SLA requires"],
             ["Underpinning contract", "Provider and its suppliers",
              "What the OLA and SLA require"]],
            caption="Three layers, each supporting the one above.",
            footer="The arithmetic must work downward. An SLA promising "
                   "four-hour restoration cannot be met on a component "
                   "supplied under a next-business-day contract, and no "
                   "operational effort compensates for that."),
        desc(
            "SERVICE REPORTING closes the loop, and it is useful only when it "
            "compares against the agreement, states what changed, and says "
            "what is being done about any shortfall -- rather than presenting "
            "figures the reader must interpret themselves."
        ),
    ]),

    ("Request Fulfilment", [
        desc(
            "Not every contact is a failure, and handling routine requests is "
            "a process of its own with different economics."
        ),
        ul([
            "A SERVICE REQUEST is something standard being asked for -- "
            "access, equipment, information, a routine change.",
            "Each has a defined procedure, since the same thing is requested "
            "repeatedly.",
            "Many are candidates for self-service, which deflects the contact "
            "entirely rather than handling it faster.",
            "Volume matters more than complexity: a thousand simple requests "
            "consume more effort than a handful of difficult incidents.",
            "Keeping them separate from incidents is what makes both sets of "
            "figures mean anything.",
        ]),
        desc(
            "Self-service is the response with the best return, because the "
            "cheapest contact is the one that never reaches anybody. It "
            "requires the request to be genuinely simple and the interface to "
            "be easier than asking a person -- and where it is not, users "
            "return to the desk and the investment achieves nothing."
        ),
    ]),

    ("Measuring the Processes", [
        desc(
            "Each process has measures, and choosing them badly changes "
            "behaviour in ways nobody intended."
        ),
        table(
            ["Measure", "Encourages", "Watch for"],
            [["Incidents closed per agent", "Throughput",
              "Closing contacts the user does not consider resolved"],
             ["Average resolution time", "Speed",
              "The long tail where users actually suffer"],
             ["First-line resolution rate", "Knowledge and capability",
              "Reluctance to escalate when escalation is right"],
             ["Repeat incident rate", "Problem management",
              "Nothing much -- this one is hard to game"],
             ["Changes causing incidents", "Careful assessment",
              "Reluctance to make necessary changes"]],
            caption="Five measures and the behaviour each produces.",
            footer="REPEAT INCIDENT RATE is the most honest of these, since "
                   "improving it requires actually removing causes. Most "
                   "activity measures can be improved without the service "
                   "getting better."),
        desc(
            "The general principle is that a measure becomes a target and "
            "then stops measuring what it did. Choosing measures that are "
            "hard to improve without genuinely improving the service is what "
            "limits the damage."
        ),
    ]),

    ("The Change Advisory Function", [
        desc(
            "Somebody assesses and authorises changes, and how that is "
            "arranged decides whether the control works."
        ),
        ol([
            "Assemble the people who can actually assess the change's effect "
            "-- technical, operational and business.",
            "Meet frequently enough not to become a bottleneck, since a "
            "weekly board delays every change by up to a week.",
            "Match the authority level to the risk, so routine changes are "
            "not waiting for senior approval.",
            "Consider the SCHEDULE as well as the change: two safe changes "
            "on the same evening may not be safe together.",
            "Review changes afterwards, particularly the ones that caused "
            "incidents.",
        ]),
        desc(
            "The fourth point is the one a board adds beyond individual "
            "assessment. Each change may be sound in isolation, and the "
            "combination -- several at once, or one during the business's "
            "busiest period -- is a risk only somebody seeing all of them can "
            "notice."
        ),
    ]),

    ("Release and Deployment", [
        desc(
            "Approved changes reach the live environment through a controlled "
            "process, which is distinct from authorising them."
        ),
        compare_grid(
            "CHANGE AGAINST RELEASE",
            "Deciding, against doing.",
            [("Change management",
              ["Decides whether a change should happen",
               "Assesses risk and impact",
               "Authorises and schedules",
               "Concerned with the decision"]),
             ("Release and deployment",
              ["Builds, tests and deploys what was authorised",
               "Ensures the environment is ready",
               "Verifies the deployment succeeded",
               "Concerned with the execution"])]),
        desc(
            "Grouping changes into a RELEASE reduces disruption by batching "
            "the interruptions, and increases the difficulty of diagnosing "
            "what caused a subsequent problem. It is the same trade the "
            "development category makes about release frequency, seen from "
            "the operational side."
        ),
    ]),

    ("Major Incidents", [
        desc(
            "Some incidents are severe enough to need a different handling "
            "arrangement rather than a higher priority."
        ),
        ul([
            "Define in advance what makes an incident MAJOR, so the category "
            "is not claimed under pressure.",
            "Name who leads, since a major incident with several teams "
            "working needs coordination rather than more effort.",
            "Separate communication from resolution -- the person "
            "coordinating the fix should not also be updating "
            "stakeholders.",
            "Record what is being done and what has been ruled out, since "
            "people join and leave during a long incident.",
            "Review it afterwards, always, since a major incident is the most "
            "informative thing that happens to a service.",
        ]),
        desc(
            "The third point is the one that changes outcomes. In a serious "
            "incident, the technical lead is repeatedly interrupted for "
            "updates, and each interruption costs more than the update is "
            "worth -- so a separate person handling communication is a "
            "resolution measure rather than a courtesy."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where process items are lost."),
        ul([
            "Treating incident and problem management as one process, so "
            "causes are never investigated.",
            "Regarding a workaround as an incomplete resolution. It is a "
            "complete success for incident management.",
            "Deriving incident priority from who reported it rather than from "
            "impact and urgency.",
            "Confusing functional with hierarchical escalation.",
            "Recording a trigger as a cause, so the next incident arrives "
            "from a different trigger.",
            "Requiring full change assessment for routine changes, which "
            "teaches people to bypass the process.",
            "Agreeing an SLA that the underpinning contracts cannot "
            "support.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A service fails weekly and is restored within thirty minutes "
            "each time by a documented restart. The service level agreement "
            "is being met. What is missing?\""
        ),
        ol([
            "Incident management is working: each occurrence is detected, "
            "restored quickly, and the agreed level is met.",
            "The restart is a documented WORKAROUND, which suggests the fault "
            "is recognised and its cause is not.",
            "What is missing is PROBLEM management -- nobody is investigating "
            "why the failure recurs.",
            "The consequence is that the incidents continue indefinitely, "
            "consuming effort every week and remaining one variation away "
            "from exceeding the agreement.",
            "A problem record should exist, with the recurrence as evidence, "
            "and its resolution would remove the incidents rather than "
            "handling them.",
        ]),
        desc(
            "The item works because everything visible is going well. Meeting "
            "the agreement while handling the same failure weekly is exactly "
            "what an organisation running incident management without problem "
            "management looks like from outside."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("The operational processes connect widely."),
        ul([
            "Change management is the configuration and change discipline of "
            "Development Technology.",
            "Most incidents following a change is why that category insists "
            "on impact assessment.",
            "Root cause analysis is the debugging method of the construction "
            "lesson.",
            "The SLA layers rest on the supplier contracts of Project "
            "Procurement.",
            "Security incidents follow the response process of the Security "
            "category.",
            "Incident trends feed the continual improvement of the previous "
            "lesson.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Incident against problem management",
              "Restore now, against find the cause",
              "A workaround is a complete success for the first and no "
              "progress for the second."),
             ("How incident priority is set",
              "Impact combined with urgency",
              "Not by who reported it, which is what makes it defensible."),
             ("Functional against hierarchical escalation",
              "More expertise, against more authority",
              "Confusing them summons managers to technical problems."),
             ("What a known error is",
              "A problem with an identified cause and a documented workaround",
              "It is what lets incidents be restored quickly while the fix is "
              "pending."),
             ("Cause against trigger",
              "The weakness, against what exposed it",
              "Recording the trigger invites banning the trigger and leaves "
              "the weakness."),
             ("Why standard changes are pre-authorised",
              "Otherwise people bypass the process",
              "And bypassing becomes the habit that applies to changes that "
              "mattered.")]),
    ]),
]

_proc_quiz = [
    mcq("HARD",
        "A service fails weekly and is restored in thirty minutes by a "
        "documented restart. The service level agreement is met.\n\n"
        "What is missing?",
        [("Problem management -- nobody is investigating why it "
          "recurs", True),
         ("Nothing, since the agreed service level is being met", False),
         ("Incident management, since the failures keep "
          "occurring", False),
         ("Capacity management, since the service is evidently under "
          "strain", False)],
        "Incident management is working: each occurrence is restored quickly "
        "and the agreement is met. The documented restart is a WORKAROUND, "
        "which means the fault is recognised and its cause is not. Problem "
        "management would remove the incidents rather than handling them -- "
        "and without it the weekly effort continues indefinitely, one "
        "variation away from breaching the agreement."),

    mcq("AVERAGE",
        "An incident is resolved by applying a workaround rather than a "
        "permanent fix.\n\nHow should this be regarded?",
        [("A complete success for incident management, whose goal is "
          "restoration", True),
         ("A partial resolution, since the incident may recur", False),
         ("A failure, since the underlying fault remains", False),
         ("A problem record rather than an incident resolution", False)],
        "Incident management exists to restore normal service as quickly as "
        "possible, by any acceptable means -- so a workaround achieves its "
        "objective completely. The underlying cause is PROBLEM management's "
        "concern, and treating the two as one process is what leaves causes "
        "permanently uninvestigated."),

    mcq("AVERAGE",
        "How should the priority of an incident be determined?",
        [("From its impact combined with its urgency", True),
         ("From the seniority of the person who reported it", False),
         ("From the time elapsed since it was first logged", False),
         ("From the technical complexity of the diagnosis "
          "required", False)],
        "Impact is how much of the business is affected and urgency is how "
        "fast the damage grows; combining them makes priority a computation "
        "rather than a negotiation. That is what lets a service desk decline "
        "to prioritise a senior person's minor problem above an outage "
        "without the decision being personal."),

    mcq("HARD",
        "What distinguishes functional escalation from hierarchical "
        "escalation?",
        [("Functional seeks more expertise; hierarchical seeks more "
          "authority", True),
         ("Functional occurs within the provider and hierarchical involves "
          "the customer", False),
         ("Functional applies to incidents and hierarchical to "
          "problems", False),
         ("Functional is automatic and hierarchical requires a "
          "decision", False)],
        "An incident nobody available can diagnose needs somebody more "
        "specialist, which is functional escalation. One requiring a decision "
        "or a resource beyond the responder's authority needs somebody more "
        "senior, which is hierarchical. Confusing them means summoning "
        "managers to technical problems they cannot help with."),

    mcq("AVERAGE",
        "What is a known error?",
        [("A problem whose cause is identified and whose workaround is "
          "documented", True),
         ("An incident that has occurred more than once", False),
         ("A defect that the supplier has acknowledged", False),
         ("A problem for which no resolution is possible", False)],
        "A known error records both the cause and how to restore service "
        "while a permanent fix is pending, which is what lets incident "
        "management resolve recurrences in minutes. It is the most useful "
        "product of problem management for day-to-day operation, and it "
        "exists precisely because the fix has not yet been made."),

    mcq("HARD",
        "An outage occurred immediately after a deployment, and analysis "
        "shows the deployment exposed a missing redundant path.\n\n"
        "What should be recorded as the cause?",
        [("The missing redundancy, with the deployment as the "
          "trigger", True),
         ("The deployment, since the outage followed it "
          "directly", False),
         ("Both equally, since neither alone caused the outage", False),
         ("The change process, for authorising the deployment", False)],
        "Recording the deployment as the cause invites restricting "
        "deployments, and the weakness remains for a different trigger to "
        "find. Recording the missing redundancy invites fixing it, which "
        "prevents the next outage regardless of what exposes it. "
        "Distinguishing cause from trigger is what makes problem management "
        "preventive rather than restrictive."),

    mcq("AVERAGE",
        "Why are standard changes pre-authorised?",
        [("A process requiring approval for routine work is bypassed, and "
          "bypassing becomes habitual", True),
         ("Standard changes carry no risk and require no "
          "assessment", False),
         ("Approval boards lack the technical knowledge to assess "
          "them", False),
         ("They are performed too frequently to be recorded "
          "individually", False)],
        "Requiring a board's approval for a password reset teaches everybody "
        "that the process obstructs work, and the habit of working around it "
        "then extends to changes that genuinely needed assessment. "
        "Pre-authorising the routine, well-understood ones keeps the control "
        "credible where it matters -- the assessment happened once, for the "
        "type."),

    mcq("HARD",
        "An SLA promises four-hour restoration for a service depending on a "
        "component under a next-business-day supplier contract.\n\n"
        "What is the position?",
        [("The SLA cannot be met, and no operational effort "
          "compensates", True),
         ("The SLA can be met if the provider holds spare components in "
          "stock", False),
         ("The supplier contract will be interpreted as supporting the "
          "SLA", False),
         ("The SLA applies only to failures not involving that "
          "component", False),
         ],
        "The three layers must support one another arithmetically: an SLA "
        "cannot promise what the underpinning contracts do not provide. "
        "Holding spares changes the supply chain and is a different "
        "arrangement requiring its own design; without such a change, the "
        "promise is fiction and the shortfall appears the first time that "
        "component fails."),

    mcq("AVERAGE",
        "What is proactive problem management?",
        [("Analysing trends to identify causes before incidents are "
          "reported", True),
         ("Applying known error workarounds before users notice a "
          "failure", False),
         ("Investigating a problem while the related incident is still "
          "open", False),
         ("Testing changes thoroughly to prevent problems arising", False)],
        "Reactive problem management investigates causes after incidents "
        "occur; proactive analysis examines patterns -- recurring minor "
        "faults, rising error rates, incidents clustering in one component -- "
        "to find causes before they produce something anybody reports. It is "
        "what turns incident data into something more useful than a "
        "workload."),

    mcq("HARD",
        "Why does change management belong among the operational processes "
        "rather than being purely administrative?",
        [("Most incidents follow a change, so controlling changes controls "
          "incidents", True),
         ("Changes must be recorded for audit and compliance "
          "purposes", False),
         ("Operational staff need advance notice of what will "
          "change", False),
         ("Changes consume capacity that must be planned for", False)],
        "The observation that most incidents follow a change makes change "
        "control the most direct lever on service stability available. "
        "Assessing, authorising, scheduling and reviewing changes is "
        "therefore operational work with a measurable effect, not a "
        "record-keeping obligation -- which is why the process is designed "
        "around risk rather than around documentation."),
]

LESSON_SVC_PROC = lesson(
    MAJOR, MIDDLE,
    "Service Management Processes: Incident, Problem, Change and SLA",
    _proc_quiz,
    lesson_structure(
        "Service Management Processes: Incident, Problem, Change and SLA",
        "Four processes keep a service running and each answers a different "
        "question, with the pair the examination presses hardest being "
        "INCIDENT against PROBLEM: restore now, against find out why. A "
        "workaround is a complete success for the first and no progress at "
        "all for the second, which is why an organisation running only "
        "incident management restores service indefinitely while the volume "
        "never falls. The lesson also covers priority computed from impact "
        "and urgency rather than from who is asking, the cause-against-trigger "
        "distinction that decides what actually gets fixed, change management "
        "as the most direct lever on stability, and the three agreement "
        "layers that must support one another arithmetically.",
        [
            "Distinguish the four operational processes by the question each "
            "answers",
            "Describe the incident lifecycle and what its diagnosis is for",
            "Compute incident priority and distinguish the escalation types",
            "Explain problem management, known errors and proactive analysis",
            "Distinguish a cause from a trigger",
            "Describe change management and the three change types",
            "Explain why standard changes are pre-authorised",
            "Explain the SLA, OLA and underpinning contract relationship",
        ],
        80,
        _proc_sections,
        [
            ("Incident",
             "An unplanned interruption or degradation. Managed by restoring "
             "service as quickly as possible."),
            ("Workaround",
             "A means of restoring service without fixing the cause. A "
             "complete success for incident management."),
            ("Priority",
             "Impact combined with urgency -- how much of the business is "
             "affected, and how fast the damage grows."),
            ("Functional escalation",
             "Passing an incident to greater expertise."),
            ("Hierarchical escalation",
             "Informing greater authority. Confused with the above at the "
             "cost of summoning managers to technical problems."),
            ("Problem",
             "The underlying cause of one or more incidents. Investigated "
             "reactively or proactively."),
            ("Known error",
             "A problem with an identified cause and a documented workaround, "
             "pending a permanent fix."),
            ("Cause against trigger",
             "The weakness, against what exposed it. Recording the trigger "
             "leaves the weakness for the next one."),
            ("Standard, normal and emergency changes",
             "Pre-authorised routine; fully assessed; expedited and assessed "
             "retrospectively."),
            ("SLA, OLA, underpinning contract",
             "Agreements with the business, internal teams and suppliers, "
             "each supporting the one above."),
        ],
        "Four processes keep a service running: incident management restores "
        "NOW, problem management finds out WHY, change management controls "
        "what changes, and service level management checks what was agreed is "
        "delivered. The first two are what the examination presses -- a "
        "workaround is a COMPLETE success for incident management and no "
        "progress for problem management, so an organisation running only the "
        "first restores service forever while the volume never falls. "
        "Priority is impact combined with urgency, which makes it a "
        "computation rather than a negotiation about who is asking; and "
        "escalation is FUNCTIONAL for expertise or HIERARCHICAL for "
        "authority. Problem management produces KNOWN ERRORS -- cause "
        "identified, workaround documented -- which is what lets incidents be "
        "resolved in minutes while the fix is pending. Its central discipline "
        "is separating CAUSE from TRIGGER, since recording a deployment as "
        "the cause invites banning deployments and leaves the weakness for "
        "the next trigger to find. Change management matters because most "
        "incidents follow a change, and pre-authorising standard changes is "
        "what keeps the control credible rather than bypassed. And the three "
        "agreement layers must support one another arithmetically: an SLA "
        "cannot promise what the underpinning contracts do not provide.",
        exam_notes=[
            desc(
                "Items describe an operational situation and ask which "
                "process is absent or misapplied."
            ),
            ul([
                "Identifying missing problem management behind recurring "
                "incidents.",
                "Judging whether a workaround is a successful resolution.",
                "Computing incident priority.",
                "Distinguishing the escalation types.",
                "Distinguishing a cause from a trigger.",
                "Explaining why standard changes are pre-authorised.",
                "Checking that agreement layers support each other.",
            ]),
            desc(
                "When incidents recur and each is handled well, the missing "
                "process is problem management. Everything visible is going "
                "right, which is exactly what that gap looks like from "
                "outside -- and it is the commonest item in this category."
            ),
        ],
    ))

# ==========================================================================
# Lesson 4: Service operation and the service desk
# ==========================================================================

_ops_sections = [
    ("Running the Service", [
        desc(
            "Service operation is where the value is actually delivered, and "
            "where a service either works or does not."
        ),
        table(
            ["Function", "Responsible for"],
            [["Service desk", "The single point of contact for users"],
             ["Technical management",
              "The expertise for the infrastructure"],
             ["Application management",
              "The expertise for the applications"],
             ["IT operations",
              "The routine activity that keeps things running"]],
            caption="Four operational functions.",
            footer="The SERVICE DESK is a function rather than a process, and "
                   "its defining property is being the SINGLE point of "
                   "contact -- which is what makes user contacts countable, "
                   "traceable and analysable at all."),
        desc(
            "Operation faces a permanent tension between STABILITY and "
            "RESPONSIVENESS. Every change threatens stability and every "
            "refusal to change frustrates the business, and the balance is "
            "managed rather than resolved."
        ),
    ]),

    ("The Service Desk", [
        desc(
            "The service desk is what users experience, which makes it the "
            "provider's reputation regardless of what happens behind it."
        ),
        image(fig("incident-flow")),
        ul([
            "It is the SINGLE point of contact, so nothing is reported "
            "somewhere it will not be recorded.",
            "It logs every contact, which is what makes incident volume and "
            "trends measurable.",
            "It resolves what it can immediately, which is the cheapest "
            "resolution available.",
            "It escalates what it cannot, functionally or hierarchically.",
            "It keeps users informed, which is what most complaints are "
            "actually about.",
        ]),
        desc(
            "The last point is worth taking seriously. Users tolerate an "
            "outage considerably better than an outage nobody has told them "
            "about, and a great deal of dissatisfaction with technically "
            "adequate services comes from silence rather than from downtime."
        ),
    ]),

    ("Structuring a Desk", [
        desc(
            "How a service desk is arranged follows from the organisation it "
            "serves."
        ),
        content_tabs(
            "THREE ARRANGEMENTS",
            "Each suits a different organisation.",
            [("Local",
              "close to the users",
              "Located with the people it serves. Understands their context "
              "and their systems, and costs more per user because expertise "
              "is duplicated at each site."),
             ("Centralised",
              "one desk for everybody",
              "A single desk serving all sites. Efficient, consistent, and "
              "further from any particular site's local knowledge."),
             ("Virtual",
              "distributed, appearing as one",
              "Staff in several locations appearing to users as a single "
              "desk, which permits follow-the-sun coverage and requires the "
              "tooling and process discipline to make it seamless.")]),
        desc(
            "FOLLOW THE SUN is the arrangement that provides continuous "
            "coverage without anybody working through the night: each region "
            "hands over to the next as its day ends. It works only if the "
            "handover is disciplined, since an incident passed on without "
            "context restarts in the receiving region."
        ),
    ]),

    ("Requests, Incidents and Access", [
        desc(
            "Not everything a user contacts the desk about is an incident, "
            "and separating them keeps the measurements meaningful."
        ),
        table(
            ["Contact type", "Is", "Handled by"],
            [["Incident", "Something is broken",
              "Incident management -- restore service"],
             ["Service request", "Something standard is wanted",
              "Request fulfilment -- a defined procedure"],
             ["Access request", "Permission to use something",
              "Access management -- verify entitlement, then grant"],
             ["Information", "A question",
              "Answered, ideally from a knowledge base"]],
            caption="Four kinds of contact needing four responses.",
            footer="Mixing REQUESTS into incident figures makes the service "
                   "appear to be failing constantly. A thousand password "
                   "resets are not a thousand incidents, and reporting them "
                   "as such conceals whatever the real incident trend is."),
        desc(
            "ACCESS MANAGEMENT is where service operation meets security. Its "
            "job is executing the access policy -- verifying that a requester "
            "is entitled and then granting it -- rather than deciding what "
            "anybody should be entitled to."
        ),
    ]),

    ("Event Management and Monitoring", [
        desc(
            "The best incident is one detected and handled before any user "
            "notices, which is what monitoring exists for."
        ),
        ol([
            "Instrument the service so its state is observable.",
            "Define what constitutes normal, so a departure can be "
            "recognised.",
            "Classify events: informational, warning, or exception.",
            "Respond automatically where the response is known and safe.",
            "Raise an incident where it is not.",
        ]),
        desc(
            "Step two is what most monitoring lacks. Without a baseline, "
            "thresholds are set from round numbers somebody chose, and they "
            "produce either alerts nobody acts on or silence while something "
            "degrades -- which is why baselining is a prerequisite rather "
            "than a refinement."
        ),
        desc(
            "ALERT FATIGUE is the failure to guard against. A monitoring "
            "system that cries wolf is reliably ignored, so the real outage "
            "arrives among noise nobody reads -- which makes tuning "
            "thresholds down a safety measure rather than a convenience."
        ),
    ]),

    ("Knowledge Management", [
        desc(
            "Operational knowledge is the difference between a desk that "
            "resolves a contact in two minutes and one that escalates it."
        ),
        ul([
            "A knowledge base records how recognised problems are handled, "
            "and it is what first-line resolution depends on.",
            "It is populated from resolved incidents and from problem "
            "management's known errors.",
            "It must be searchable by the words a user or an agent would "
            "actually use.",
            "It must be maintained, since an entry describing an obsolete "
            "system is worse than none.",
            "Making it available to USERS deflects contacts entirely, which "
            "is the cheapest resolution of all.",
        ]),
        desc(
            "FIRST-LINE resolution rate is the measure this drives, and it "
            "matters because every escalation costs more and takes longer. An "
            "investment in knowledge shows up as contacts resolved at the "
            "point of first contact rather than as anything more visible."
        ),
    ]),

    ("Operational Documentation", [
        desc(
            "The people running a service need documents written for running "
            "it, which is not what a project usually produces."
        ),
        table(
            ["Document", "Answers"],
            [["Operations manual",
              "How is it started, stopped, monitored and checked"],
             ["Recovery procedures",
              "What is done when each kind of failure occurs"],
             ["Known error records",
              "What does this symptom mean, and what restores service"],
             ["Escalation matrix",
              "Who is called, when, and with what authority"],
             ["Configuration records",
              "What is actually running, and where"]],
            caption="Five operational documents and the question each "
                    "answers.",
            footer="The ESCALATION MATRIX is the one whose absence is "
                   "discovered during an incident. Nobody looks for it until "
                   "somebody needs to know who can authorise a restart at "
                   "three in the morning."),
        desc(
            "All of them are read under pressure by somebody who cannot ask a "
            "question, which is why currency matters more than completeness. "
            "A procedure describing a system as it was two years ago is "
            "followed confidently and produces the wrong result."
        ),
    ]),

    ("Automating Operations", [
        desc(
            "Routine operational activity is repetitive, which makes it the "
            "natural candidate for automation."
        ),
        ul([
            "Automation is consistent, so the task is performed the same way "
            "every time.",
            "It is fast, and available at three in the morning without "
            "waking anybody.",
            "It is auditable, since what ran is recorded rather than "
            "remembered.",
            "It requires the procedure to be understood well enough to be "
            "specified, which is itself valuable.",
            "It fails silently if nobody monitors whether it ran, which is "
            "the characteristic new risk it introduces.",
        ]),
        desc(
            "The last point is the one automation creates. A backup performed "
            "manually is noticed when somebody does not do it; one automated "
            "and failing quietly is discovered when a restore is attempted -- "
            "so automating a task means also monitoring that the automation "
            "worked."
        ),
    ]),

    ("Shift Handover", [
        desc(
            "Services run continuously and people do not, so the handover "
            "between shifts is where continuity is preserved or lost."
        ),
        ol([
            "State what is currently broken or degraded, and what is being "
            "done about it.",
            "State what was tried and ruled out, which is what stops the "
            "next shift repeating it.",
            "State what is expected during the coming period -- planned "
            "changes, batch runs, known busy times.",
            "State what needs watching, and why.",
            "Confirm the receiving shift understood, rather than assuming a "
            "document was read.",
        ]),
        desc(
            "The second point is what distinguishes a handover from a status "
            "list. Knowing that a restart was already attempted saves the "
            "next shift from attempting it again, and that information exists "
            "nowhere except in the head of whoever is leaving."
        ),
    ]),

    ("Capacity and Performance in Operation", [
        desc(
            "Operation is where designed capacity meets actual demand, and "
            "where the difference becomes visible."
        ),
        table(
            ["Observed", "Usually means"],
            [["Steady growth in utilisation",
              "Ordinary business growth -- extrapolate and plan"],
             ["A sudden step change",
              "Something changed: a new user group, a new integration"],
             ["Growth with no business change",
              "Something is accumulating -- data, sessions, logs"],
             ["Utilisation normal, users complaining",
              "The bottleneck is somewhere nobody is measuring"]],
            caption="Four utilisation patterns and their usual explanations.",
            footer="The last row is the one that resists diagnosis. Every "
                   "monitored component looks healthy and users are right "
                   "that it is slow -- which means the constraint is in "
                   "something nobody instrumented."),
        desc(
            "The third row describes a specific and common failure. Data "
            "that is never archived, sessions never released and logs never "
            "rotated each grow without any business reason, and each "
            "eventually consumes something -- which is why growth without a "
            "business explanation is investigated rather than provisioned "
            "for."
        ),
    ]),

    ("Continual Improvement in Operation", [
        desc(
            "Operational data is the richest source of improvement "
            "opportunities an organisation has, and it is usually unread."
        ),
        ol([
            "Analyse incident trends by cause, since repeated causes are "
            "problem management candidates.",
            "Analyse request volumes, since high-volume requests are "
            "self-service candidates.",
            "Analyse changes that caused incidents, since they indicate where "
            "assessment is inadequate.",
            "Analyse escalations, since a high rate indicates a knowledge or "
            "capability gap at the first line.",
            "Act on one thing at a time, and measure whether it helped.",
        ]),
        desc(
            "Every item on that list uses data the service desk already "
            "collects. The improvement opportunity is not in gathering "
            "anything new but in reading what is being recorded -- which is "
            "why the categorisation discipline matters beyond tidiness."
        ),
    ]),

    ("Supporting Users Well", [
        desc(
            "Technical resolution and a good support experience are separate "
            "achievements, and users judge both."
        ),
        ul([
            "Acknowledge quickly, since a user who has heard nothing does not "
            "know their report was received.",
            "Set expectations honestly, because an accurate long estimate "
            "beats an optimistic one that is missed.",
            "Update at the intervals promised, particularly when there is no "
            "news -- silence reads as neglect.",
            "Explain in the user's terms rather than in the provider's, since "
            "an explanation nobody understands informs nobody.",
            "Confirm resolution with the user rather than assuming it, since "
            "the symptom they reported may not be what was fixed.",
        ]),
        desc(
            "The last point closes a specific gap. A technician who fixed "
            "what they found may have fixed something other than what the "
            "user experienced, and closing on the technician's judgement "
            "produces a resolved ticket and an unresolved problem -- which "
            "the user reports again, as a new incident."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where operation items are lost."),
        ul([
            "Allowing contacts to reach specialists directly, so nothing is "
            "recorded and volume is unknowable.",
            "Counting service requests as incidents, which conceals the real "
            "incident trend.",
            "Setting monitoring thresholds from round numbers rather than "
            "from a baseline.",
            "Tolerating alerts nobody acts on, which trains everybody to "
            "ignore the system.",
            "Treating access management as deciding entitlement rather than "
            "executing policy.",
            "Neglecting to inform users during an outage, which is what most "
            "complaints concern.",
            "Letting a knowledge base become stale, so it is trusted and "
            "wrong.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A provider's incident figures show a steady rise over two "
            "years. Investigation finds most of the increase is password "
            "resets and access requests. What should change?\""
        ),
        ol([
            "Establish what these contacts are: password resets and access "
            "grants are SERVICE and ACCESS requests, not incidents.",
            "They are being recorded as incidents, so the figures describe "
            "contact volume rather than service failures.",
            "The apparent trend therefore says nothing about whether service "
            "quality is deteriorating -- the real incident trend is concealed "
            "within it.",
            "Categorising them correctly separates request fulfilment from "
            "incident management, and makes both measurable.",
            "It also identifies the actual opportunity: high request volumes "
            "are candidates for self-service, which deflects them entirely "
            "rather than handling them faster.",
        ]),
        desc(
            "The item rewards knowing that a measurement can be accurate and "
            "meaningless. Nothing in the figures was wrong; they simply "
            "counted two different things together and reported the total as "
            "one of them."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Service operation touches several categories."),
        ul([
            "Incident and problem management are the previous lesson's "
            "processes.",
            "Access management executes the access control policy of the "
            "Security category.",
            "Monitoring and baselining come from the Network Management "
            "lesson.",
            "Alert fatigue is that lesson's warning, applied to services.",
            "Knowledge management is the tacit and explicit distinction of "
            "Project Integration.",
            "Self-service deflection is a demand management technique from "
            "service strategy.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Why the desk is a SINGLE point of contact",
              "So nothing is reported where it will not be recorded",
              "Which is what makes volume and trends measurable at all."),
             ("Incident against service request",
              "Something broken, against something standard wanted",
              "Counting requests as incidents conceals the real incident "
              "trend."),
             ("What monitoring needs before thresholds",
              "A baseline of normal",
              "Otherwise thresholds are round numbers producing noise or "
              "silence."),
             ("What access management decides",
              "Nothing -- it executes the policy",
              "Verifying entitlement and granting, rather than deciding who "
              "should have what."),
             ("What most outage complaints concern",
              "Not being told",
              "Users tolerate an outage far better than an unannounced one."),
             ("What a knowledge base drives",
              "First-line resolution rate",
              "Every escalation costs more, so knowledge shows up as contacts "
              "resolved at first contact.")]),
    ]),
]

_ops_quiz = [
    mcq("HARD",
        "Incident figures rise steadily for two years, and most of the "
        "increase is password resets and access grants.\n\n"
        "What should change?",
        [("Categorising those contacts as requests, so the real incident "
          "trend becomes visible", True),
         ("Increasing service desk staffing to handle the growing "
          "volume", False),
         ("Investigating the underlying cause of the rising incident "
          "count", False),
         ("Revising the service level agreement to reflect the higher "
          "volume", False)],
        "Password resets and access grants are service and access REQUESTS "
        "rather than incidents, so counting them together produces figures "
        "that measure contact volume and are reported as service failures. "
        "Separating them makes both measurable -- and identifies the real "
        "opportunity, which is deflecting high-volume requests to self-service "
        "rather than handling them faster."),

    mcq("AVERAGE",
        "Why must the service desk be a single point of contact?",
        [("Otherwise contacts go unrecorded and volume and trends cannot be "
          "known", True),
         ("Otherwise users receive inconsistent answers to the same "
          "question", False),
         ("Otherwise specialists are interrupted by routine "
          "queries", False),
         ("Otherwise service level agreements cannot be enforced", False),
         ],
        "A user who telephones a specialist they know gets help and leaves no "
        "record, so that contact is invisible to every measurement. Enough of "
        "them and the recorded figures describe a fraction of reality, which "
        "makes trend analysis, capacity planning and problem management all "
        "work from an unrepresentative sample."),

    mcq("AVERAGE",
        "One thing must be established before monitoring thresholds can "
        "be set sensibly.\n\nWhich?",
        [("A baseline of what normal looks like", True),
         ("The service level agreement's availability target", False),
         ("The escalation path for each type of alert", False),
         ("The capacity limits of the monitored components", False)],
        "A threshold without a baseline is a round number somebody chose, and "
        "it produces either alerts nobody acts on or silence while something "
        "degrades. Knowing what normal utilisation, latency and error rates "
        "look like is what makes a departure recognisable -- so baselining is "
        "a prerequisite rather than a refinement."),

    mcq("HARD",
        "What is access management's role?",
        [("Executing the access policy by verifying entitlement and "
          "granting", True),
         ("Deciding which users should be entitled to which "
          "systems", False),
         ("Reviewing existing access rights for appropriateness", False),
         ("Investigating unauthorised access attempts", False)],
        "Access management is an operational process that carries out a "
        "policy set elsewhere -- it confirms a requester is entitled under "
        "that policy and then grants access. Deciding entitlement is a "
        "security and business decision, and conflating the two puts a policy "
        "decision in the hands of whoever processes requests."),

    mcq("AVERAGE",
        "A follow-the-sun service desk hands an unresolved incident from one "
        "region to the next.\n\nWhat does the arrangement depend on?",
        [("Disciplined handover, since an incident passed without context "
          "restarts", True),
         ("Identical tooling in every participating region", False),
         ("Users being unaware which region is handling their "
          "contact", False),
         ("Each region having the same technical specialisms "
          "available", False),
         ],
        "The arrangement's value is continuous progress without night "
        "working, and that depends entirely on the receiving region "
        "continuing rather than beginning again. An incident handed over with "
        "what has been tried, ruled out and suspected continues; one handed "
        "over as a ticket number restarts, and the arrangement costs more "
        "than it saves."),

    mcq("HARD",
        "Why is alert fatigue treated as a safety problem rather than an "
        "annoyance?",
        [("A system routinely ignored means the real outage arrives among "
          "noise nobody reads", True),
         ("Excessive alerts consume the monitoring system's processing "
          "capacity", False),
         ("Staff responding to alerts have less time for planned "
          "work", False),
         ("Frequent alerts indicate the thresholds were set too "
          "high", False)],
        "Monitoring exists so that somebody acts, and a system that cries "
        "wolf teaches everybody not to. The genuine alert then arrives among "
        "dozens nobody reads, which is the failure mode the whole "
        "arrangement was meant to prevent -- so tuning thresholds down is a "
        "protective measure rather than a convenience."),

    mcq("AVERAGE",
        "A service desk's first-line resolution rate is driven chiefly "
        "by one factor.\n\nWhich?",
        [("The knowledge available to the agents taking the contacts", True),
         ("The number of agents assigned to the first line", False),
         ("The proportion of contacts arriving by telephone", False),
         ("The service level agreement's response time target", False)],
        "An agent who can find how a recognised problem is handled resolves "
        "it in minutes; one who cannot escalates it, which costs more and "
        "takes longer. Investment in a searchable, maintained knowledge base "
        "shows up as resolution at first contact rather than as anything more "
        "visible -- which is why it is the measure it drives."),

    mcq("HARD",
        "Users complain about service quality during outages that are within "
        "the agreed availability target.\n\nWhat is most likely lacking?",
        [("Communication during the outages", True),
         ("A shorter restoration target in the agreement", False),
         ("Additional redundancy to prevent the outages", False),
         ("A clearer definition of what availability covers", False)],
        "Users tolerate an outage considerably better than an outage nobody "
        "has told them about, and a great deal of dissatisfaction with "
        "technically compliant services comes from silence. Keeping users "
        "informed is a service desk responsibility and it is the cheapest "
        "available improvement to perceived quality."),

    mcq("AVERAGE",
        "What permanent tension does service operation manage?",
        [("Stability against responsiveness", True),
         ("Cost against quality", False),
         ("Centralisation against local knowledge", False),
         ("Automation against employment", False)],
        "Every change threatens stability and every refusal to change "
        "frustrates the business, so operation is permanently balancing the "
        "two rather than resolving them. It is why change management exists "
        "as a control on the pace of change rather than as an obstacle to it, "
        "and why standard changes are pre-authorised."),

    mcq("HARD",
        "A knowledge base entry describes a system that was replaced a year "
        "ago.\n\nWhy is this worse than having no entry?",
        [("It is trusted by somebody who does not know it is "
          "obsolete", True),
         ("It consumes storage and slows the knowledge base's "
          "search", False),
         ("It prevents a correct entry from being added for the "
          "replacement", False),
         ("It indicates the knowledge base is not being "
          "maintained", False)],
        "An agent finding an entry acts on it, and one describing a replaced "
        "system sends them down a path that cannot work -- costing more time "
        "than having found nothing, which would at least have prompted "
        "investigation. Removing obsolete entries is therefore a positive act "
        "rather than a loss of content."),
]

LESSON_SVC_OPS = lesson(
    MAJOR, MIDDLE,
    "Service Operation, Service Desk and Support",
    _ops_quiz,
    lesson_structure(
        "Service Operation, Service Desk and Support",
        "Service operation is where value is actually delivered, and where "
        "the permanent tension between stability and responsiveness is "
        "managed rather than resolved. This lesson covers the service desk as "
        "the SINGLE point of contact -- which is what makes volume and trends "
        "knowable at all -- the four kinds of contact whose conflation makes "
        "a service appear to be failing constantly, monitoring that needs a "
        "baseline before it can have thresholds, access management as "
        "executing a policy rather than deciding one, and the knowledge base "
        "that drives first-line resolution and is worse than useless when it "
        "goes stale.",
        [
            "Name the operational functions and the tension operation "
            "manages",
            "Explain why the service desk is a single point of contact",
            "Compare local, centralised and virtual desk structures",
            "Distinguish incidents, service requests, access requests and "
            "questions",
            "Describe event management and why baselining precedes "
            "thresholds",
            "Explain alert fatigue as a safety problem",
            "Describe access management's role precisely",
            "Explain what a knowledge base drives and why staleness is worse "
            "than absence",
        ],
        75,
        _ops_sections,
        [
            ("Service desk",
             "The single point of contact for users -- a function rather than "
             "a process."),
            ("Stability against responsiveness",
             "The permanent operational tension, managed rather than "
             "resolved."),
            ("Service request",
             "Something standard being wanted, handled by a defined "
             "procedure. Not an incident."),
            ("Access management",
             "Verifying entitlement under a policy and granting -- not "
             "deciding entitlement."),
            ("Follow the sun",
             "Regions handing over as each day ends, which depends entirely "
             "on disciplined handover."),
            ("Event management",
             "Instrumenting, baselining, classifying and responding -- with "
             "the baseline preceding any threshold."),
            ("Alert fatigue",
             "A monitoring system routinely ignored, so the genuine alert "
             "arrives among noise."),
            ("Knowledge base",
             "What drives first-line resolution. An obsolete entry is worse "
             "than none, because it is trusted."),
        ],
        "Service operation delivers the value and manages a permanent tension "
        "between STABILITY and RESPONSIVENESS, since every change threatens "
        "one and every refusal frustrates the other. The service desk is a "
        "function whose defining property is being the SINGLE point of "
        "contact -- a user telephoning a specialist they know gets help and "
        "leaves no record, and enough of those make every measurement "
        "unrepresentative. What arrives at the desk divides into incidents, "
        "service requests, access requests and questions, and counting "
        "requests as incidents makes a service appear to be failing "
        "constantly while concealing whatever the real trend is. Monitoring "
        "needs a BASELINE before it can have thresholds, or those thresholds "
        "are round numbers producing either noise or silence -- and a system "
        "producing noise is ignored, which makes ALERT FATIGUE a safety "
        "problem rather than an annoyance. Access management executes the "
        "access policy rather than deciding it. And the knowledge base is "
        "what drives first-line resolution, since every escalation costs more "
        "-- with a stale entry being worse than none, because somebody who "
        "does not know it is obsolete will act on it.",
        exam_notes=[
            desc(
                "Items describe an operational measurement or complaint and "
                "ask what is actually wrong."
            ),
            ul([
                "Diagnosing incident figures inflated by requests.",
                "Explaining why the desk must be a single point of contact.",
                "Explaining what monitoring needs before thresholds.",
                "Stating access management's role precisely.",
                "Explaining alert fatigue.",
                "Identifying missing communication behind outage "
                "complaints.",
                "Explaining why a stale knowledge entry is worse than none.",
            ]),
            desc(
                "When a service measurement looks alarming, check what is "
                "being counted before investigating the trend. A figure can "
                "be entirely accurate and meaningless because it combined two "
                "different things -- which is the commonest measurement "
                "failure in this lesson."
            ),
        ],
    ))

LESSONS = [LESSON_SVC_PROC, LESSON_SVC_OPS]

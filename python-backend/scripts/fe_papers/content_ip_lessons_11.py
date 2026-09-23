"""IT Passport lesson content: Project Management, Service Management, Audit
(727-730)."""

import sys

sys.path.insert(0, "/app/scripts/fe_expansion")

from builders import (  # noqa: E402
    accordion, compare_grid, content_tabs, desc, flip_cards, image, image_text,
    lesson_structure, media_text, ol, review_cards, sub, table, tabs, ul,
)

FIG = "/lesson-media/%s.svg"

CERTIFICATION_ID = 4

LESSONS = {}


LESSONS[727] = lesson_structure(
    name="Project management",
    intro=(
        "A project is temporary work producing a unique result, which makes it "
        "different from the ongoing operations around it. This lesson covers how "
        "projects are scoped, scheduled, resourced and controlled, and the trade-offs "
        "that every project manager spends their time on."
    ),
    objectives=[
        "Distinguish a project from operations.",
        "Describe the triple constraint and how it behaves.",
        "Build a work breakdown structure.",
        "Read a Gantt chart and identify the critical path.",
        "Describe risk management on a project.",
        "Explain why adding people to a late project rarely helps.",
    ],
    minutes=40,
    sections=[
        ("What makes it a project", [
            desc(
                "Two properties define a project: it is temporary, with a defined "
                "beginning and end, and it produces something unique. Running a service "
                "indefinitely is operations, however large it is."
            ),
            desc(
                "The distinction matters because projects need different management: a "
                "team assembled and disbanded, a budget with an end, and a definition of "
                "done."
            ),
        ]),
        ("The triple constraint", [
            desc(
                "Scope, time and cost are linked, with quality affected by all three. "
                "Fixing all of them simultaneously is not a plan but a wish."
            ),
            compare_grid(
                "What happens when one moves",
                "The manager's job is to make the consequence explicit, not to absorb it.",
                [("Scope increases",
                  "Time or cost must increase, or quality falls. If none is acknowledged, "
                  "quality falls silently -- which is the usual outcome."),
                 ("Time is shortened",
                  "Scope must reduce or cost must rise. Adding people has its own cost "
                  "and often its own delay.")],
            ),
        ]),
        ("Scope and the work breakdown", [
            desc(
                "A work breakdown structure decomposes the deliverables into pieces "
                "small enough to estimate, assign and track."
            ),
            ol([
                "Start from the deliverables, not from activities.",
                "Decompose until a package can be estimated with some confidence.",
                "Apply the 100% rule -- the children of an element together represent all of it and nothing more.",
                "Assign each package an owner.",
            ]),
            desc(
                "A scope statement should record what is EXCLUDED as well as included. "
                "Unrecorded assumptions about exclusion become disputes at acceptance."
            ),
        ]),
        ("Scheduling", [
            desc(
                "A schedule sequences the work, respecting what must finish before what, "
                "and shows when each thing happens."
            ),
            ul([
                "Gantt chart -- tasks as bars on a calendar; shows duration and overlap at a glance.",
                "Network diagram -- shows dependencies and reveals the critical path.",
                "Critical path -- the longest route through the network; it has zero float and sets the shortest possible duration.",
                "Milestone -- a zero-duration checkpoint marking that a defined state has been reached.",
            ]),
            desc(
                "Only shortening the critical path shortens the project. Accelerating "
                "anything off it consumes effort and changes the finish date not at all."
            ),
        ]),
        ("Resources and people", [
            desc(
                "A schedule that over-allocates someone is not a plan. Levelling "
                "resolves the conflict honestly, and the date that results is the one "
                "that was always real."
            ),
            desc(
                "Adding people to a late project usually makes it later: newcomers "
                "consume the productive team's time while being brought up to speed, and "
                "the number of communication paths grows faster than the headcount -- "
                "five people have ten paths, ten people have forty-five."
            ),
        ]),
        ("Risk", [
            table(
                ["Response", "Means", "Example"],
                [["Avoid", "Remove the exposure", "Drop the feature that requires the unproven technology"],
                 ["Mitigate", "Reduce probability or impact", "Prototype the risky part early"],
                 ["Transfer", "Move the financial consequence", "Insurance, or a fixed-price contract"],
                 ["Accept", "Carry it knowingly, with a reserve", "A small risk not worth acting on"]],
            ),
            desc(
                "A risk register without owners and responses is a list of worries. Each "
                "entry needs somebody accountable and a decided response."
            ),
        ]),
        ("Controlling and closing", [
            ol([
                "Track progress against the baseline, not against how busy people feel.",
                "Use evidence -- a completed deliverable -- rather than a reported percentage.",
                "Manage changes through change control so their cost is visible.",
                "Communicate honestly; problems concealed grow.",
                "Close properly: hand over, release the team, and record what was learned.",
            ]),
            desc(
                "'Ninety per cent complete' is the most expensive phrase in project "
                "management, because the last ten per cent frequently contains half the "
                "remaining work."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Scope grows, time and cost fixed -- what gives?", "Quality",
                 "Usually silently, which is why the trade must be made explicit."),
                ("Which activities have zero float?", "Those on the critical path",
                 "Any delay to them delays the project."),
                ("Team grows 5 to 10 -- communication paths?", "10 to 45",
                 "n(n-1)/2. They grow faster than headcount."),
                ("Track progress by what?", "Completed deliverables",
                 "Reported percentages are opinion; evidence is not."),
            ]),
        ]),
    ],
    key_terms=[
        ("Project", "Temporary work producing a unique result."),
        ("Triple constraint", "Scope, time and cost, with quality affected by all three."),
        ("WBS", "A hierarchical decomposition of deliverables into manageable packages."),
        ("Critical path", "The longest path through the network; zero float."),
        ("Milestone", "A zero-duration checkpoint marking a defined state."),
        ("Risk register", "Identified risks with owners, assessments and planned responses."),
    ],
    summary=(
        "A project is temporary and unique, which is what separates it from operations. "
        "Scope, time and cost cannot all be fixed at once, and when the trade is not "
        "made explicit quality absorbs it silently. A work breakdown decomposes "
        "deliverables for estimation, and only the critical path determines the "
        "achievable date. Over-allocation must be levelled, adding people to a late "
        "project usually delays it further, and progress should be tracked by completed "
        "deliverables rather than reported percentages."
    ),
    exam_notes=[
        desc(
            "Critical path and float questions appear regularly. Remember float is late "
            "start minus early start, and zero float means critical."
        ),
        ul([
            "Only the critical path limits the finish date.",
            "Communication paths = n(n-1)/2.",
            "Fixing scope, time and cost simultaneously sacrifices quality.",
        ]),
    ],
)


LESSONS[728] = lesson_structure(
    name="Facility management",
    intro=(
        "Facility management covers the physical environment systems depend on: power, "
        "cooling, space and physical security. This lesson covers what a data centre "
        "provides, how continuity of power is arranged, and why physical access control "
        "is part of information security."
    ),
    objectives=[
        "Describe what facility management covers.",
        "Explain how continuity of power is provided.",
        "Describe cooling and why it constrains capacity.",
        "Describe physical access controls.",
        "Explain what PUE measures.",
        "Describe environmental and disposal responsibilities.",
    ],
    minutes=30,
    sections=[
        ("What it covers", [
            desc(
                "Facility management is responsible for the building and services around "
                "the equipment: power, cooling, space, cabling, fire protection and "
                "physical access. None of it appears in an architecture diagram, and all "
                "of it can stop a service."
            ),
        ]),
        ("Power", [
            desc(
                "Electrical supply is the single most common cause of unplanned "
                "downtime, and it is addressed in layers."
            ),
            accordion([
                ("UPS", "Battery power covering the seconds to minutes before a generator starts, and smoothing sags and spikes."),
                ("Generator", "Sustains a long outage once running. It cannot start instantly, which is why the UPS exists."),
                ("Dual feed", "Two independent supplies, so one failing does not remove power."),
                ("PDU", "Distributes power within a rack and often meters consumption per outlet."),
            ]),
            desc(
                "UPS and generator are complementary rather than alternatives. Testing "
                "them matters as much as having them: a generator that has never been "
                "run under load is an assumption."
            ),
        ]),
        ("Cooling", [
            desc(
                "Equipment converts nearly all the power it draws into heat, and heat "
                "must be removed or components throttle and then fail."
            ),
            ul([
                "Hot and cold aisle arrangement -- racks face each other so hot and cold air do not mix.",
                "Raised floor or overhead ducting to deliver cold air where it is needed.",
                "Humidity control -- too dry invites static, too damp invites condensation.",
                "Cooling capacity frequently limits how much equipment a room can hold, before space does.",
            ]),
        ]),
        ("Physical security", [
            desc(
                "Access to the hardware defeats most logical controls. Someone at the "
                "console, or carrying a disk out of the building, is not stopped by a "
                "password policy."
            ),
            ol([
                "Control entry to the building, then to the room, then to the rack.",
                "Log who entered and when; review the log, not merely collect it.",
                "Use cameras and alarms as detection where prevention is impractical.",
                "Escort visitors, including contractors, throughout.",
                "Protect against fire with suppression suited to electronics, not water.",
            ]),
        ]),
        ("Efficiency", [
            desc(
                "PUE -- power usage effectiveness -- is total facility power divided by "
                "the power delivered to IT equipment. A PUE of 1.0 would mean every watt "
                "reached the servers."
            ),
            desc(
                "The excess above 1.0 is cooling, lighting and distribution loss. "
                "Reducing it is both an environmental and a cost objective, and is why "
                "large operators care about location and climate."
            ),
        ]),
        ("Environment and disposal", [
            ul([
                "Electronic equipment is regulated waste and must go to a licensed recycler.",
                "Drives must be securely erased or destroyed before disposal, with a record kept.",
                "Green IT reduces consumption through efficiency, virtualisation and sensible refresh cycles.",
                "Consolidating underused servers is usually the single largest saving available.",
            ]),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("What does a UPS do that a generator cannot?", "Cover the gap instantly",
                 "A generator takes time to start and stabilise."),
                ("What does PUE measure?", "Total facility power / IT power",
                 "1.0 would be perfect; the excess is cooling and losses."),
                ("Why hot and cold aisles?", "To stop hot and cold air mixing",
                 "Mixing wastes cooling capacity."),
                ("What usually limits a server room first?", "Cooling capacity",
                 "Often before physical space runs out."),
            ]),
        ]),
    ],
    key_terms=[
        ("UPS", "Battery supply bridging a short outage and conditioning power."),
        ("Generator", "Sustains supply during a prolonged outage once started."),
        ("Hot and cold aisle", "Rack arrangement preventing hot and cold air mixing."),
        ("PUE", "Total facility power divided by power delivered to IT equipment."),
        ("Physical access control", "Restricting and recording entry to equipment."),
        ("Secure disposal", "Erasing or destroying media and recycling equipment lawfully."),
    ],
    summary=(
        "Facility management covers the power, cooling, space and physical security that "
        "systems depend on and that no architecture diagram shows. Power continuity "
        "layers UPS, generator and dual feeds, with the UPS covering the gap a generator "
        "cannot. Cooling frequently limits capacity before space does. Physical access "
        "defeats logical controls, so entry is layered, logged and reviewed. PUE "
        "measures how much power reaches the equipment, and disposal carries both "
        "data-erasure and environmental obligations."
    ),
    exam_notes=[
        desc(
            "The UPS-versus-generator distinction is the most examined point here. PUE "
            "appears as a definition question."
        ),
        ul([
            "UPS bridges the gap; the generator sustains the outage.",
            "PUE = total facility power / IT equipment power.",
            "Physical access defeats logical controls.",
        ]),
    ],
)


LESSONS[729] = lesson_structure(
    name="System audit",
    intro=(
        "A system audit is an independent examination of whether controls over "
        "information systems are properly designed and actually working. This lesson "
        "covers why independence matters, how an audit proceeds, what counts as "
        "evidence, and what happens to the findings."
    ),
    objectives=[
        "Explain the purpose of a system audit.",
        "Explain why the auditor must be independent.",
        "Describe the stages of an audit.",
        "Distinguish design effectiveness from operating effectiveness.",
        "Describe what makes evidence sufficient.",
        "Explain what happens after the report.",
    ],
    minutes=30,
    sections=[
        ("Purpose", [
            desc(
                "An audit gives an independent opinion on whether controls are adequate "
                "and operating. Its value to management is assurance that what they "
                "believe is happening actually is."
            ),
            desc(
                "An audit is not a search for someone to blame, and it is not a "
                "consultancy engagement either. The auditor reports; management decides "
                "what to do."
            ),
        ]),
        ("Independence", [
            desc(
                "An auditor must be independent of what is being audited -- not "
                "reporting to the managers whose controls are examined, and not having "
                "designed or operated them."
            ),
            desc(
                "Without independence the opinion is worthless, because nobody reviewing "
                "their own work can give an objective view of it. This is why internal "
                "audit reports to the board or an audit committee rather than to the IT "
                "director."
            ),
        ]),
        ("How an audit proceeds", [
            ol([
                "Plan -- agree scope, objectives and timing based on risk.",
                "Understand -- document the process and the controls that are claimed.",
                "Test -- gather evidence about design and operation.",
                "Evaluate -- judge findings against the criteria.",
                "Report -- issue findings with recommendations.",
                "Follow up -- confirm agreed actions were actually taken.",
            ]),
            desc(
                "Follow-up is the stage most often skipped, and skipping it turns an "
                "audit into an annual ritual that changes nothing."
            ),
        ]),
        ("Two questions about every control", [
            compare_grid(
                "Design and operation",
                "A control can pass one and fail the other, and the distinction matters.",
                [("Design effectiveness",
                  "Would this control, as described, address the risk if it were "
                  "performed?"),
                 ("Operating effectiveness",
                  "Is it actually performed, consistently, throughout the period?")],
            ),
            desc(
                "A documented, approved control that nobody performs is suitably "
                "designed and not operating effectively -- and gives no assurance "
                "whatsoever."
            ),
        ]),
        ("Evidence", [
            desc(
                "An opinion must rest on evidence that is relevant, reliable and "
                "sufficient in quantity."
            ),
            table(
                ["Source", "Reliability", "Note"],
                [["Obtained directly by the auditor", "Highest", "Observation, re-performance"],
                 ["System-generated logs", "High", "If their integrity is itself assured"],
                 ["Documentation from the client", "Medium", "Verify a sample independently"],
                 ["Verbal assurance from staff", "Lowest", "A starting point, never a conclusion"]],
            ),
            desc(
                "Sampling is normal -- testing every transaction is impossible -- but "
                "the sample must be chosen so the conclusion is defensible."
            ),
        ]),
        ("Findings and afterwards", [
            desc(
                "Findings are usually ranked by risk, with recommendations. Management "
                "responds with what it will do and by when, or with a reasoned decision "
                "to accept the risk."
            ),
            ol([
                "Report to those who can act, with the risk explained in business terms.",
                "Agree actions, owners and dates.",
                "Record accepted risks explicitly, with who accepted them.",
                "Follow up and confirm, rather than assume.",
            ]),
            desc(
                "Accepting a risk is a legitimate answer when it is a decision taken by "
                "someone with the authority to carry the consequence. It is not "
                "legitimate as a way of avoiding work."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Why must an auditor be independent?", "Nobody can objectively review their own work",
                 "That is why internal audit reports to the board."),
                ("Documented control nobody performs -- how reported?", "Designed but not operating",
                 "It gives no assurance at all."),
                ("Most reliable evidence?", "Obtained directly by the auditor",
                 "Verbal assurance is the weakest."),
                ("Which audit stage is most often skipped?", "Follow-up",
                 "Without it the audit changes nothing."),
            ]),
        ]),
    ],
    key_terms=[
        ("System audit", "An independent examination of controls over information systems."),
        ("Independence", "Freedom from responsibility for what is being audited."),
        ("Design effectiveness", "Whether a control would address the risk if performed."),
        ("Operating effectiveness", "Whether it is actually performed consistently."),
        ("Audit evidence", "Relevant, reliable and sufficient material supporting an opinion."),
        ("Follow-up", "Confirming that agreed actions were carried out."),
    ],
    summary=(
        "A system audit gives management independent assurance that controls are "
        "adequate and operating, which requires the auditor to be free of "
        "responsibility for them. Audits plan by risk, document the controls claimed, "
        "test them, evaluate, report and follow up -- with follow-up the stage whose "
        "absence renders the rest ceremonial. Every control is judged on both design "
        "and operation, and evidence obtained directly by the auditor outranks anything "
        "supplied by the audited party."
    ),
    exam_notes=[
        desc(
            "Independence is the most examined idea here. The design-versus-operation "
            "distinction appears as a scenario where documentation exists and practice "
            "does not."
        ),
        ul([
            "Internal audit reports to the board, not to the audited function.",
            "Designed but not operating gives no assurance.",
            "Auditor-obtained evidence outranks client-supplied evidence.",
        ]),
    ],
)


LESSONS[730] = lesson_structure(
    name="Internal control",
    intro=(
        "Internal control is the set of processes giving reasonable assurance that "
        "operations are effective, reporting is reliable and laws are followed. This "
        "lesson covers what those controls look like in practice, how they relate to "
        "governance, and why no control system is ever complete."
    ),
    objectives=[
        "State the objectives of internal control.",
        "Distinguish preventive, detective and corrective controls.",
        "Explain segregation of duties and what it achieves.",
        "Describe IT general controls.",
        "Explain the limitations of internal control.",
        "Describe how control relates to governance and risk.",
    ],
    minutes=30,
    sections=[
        ("What internal control is for", [
            desc(
                "Internal control provides reasonable -- not absolute -- assurance "
                "toward three objectives."
            ),
            ul([
                "Effective and efficient operations.",
                "Reliable reporting, financial and otherwise.",
                "Compliance with applicable laws and regulations.",
            ]),
            desc(
                "Reasonable rather than absolute is a deliberate phrase. Absolute "
                "assurance is unattainable at any price, and pretending otherwise leads "
                "to controls that cost more than the risk."
            ),
        ]),
        ("Three kinds of control", [
            table(
                ["Type", "Acts", "Example"],
                [["Preventive", "Before the event", "Approval required before payment; access restricted by role"],
                 ["Detective", "After the event", "Reconciliation; log review; exception report"],
                 ["Corrective", "After detection", "Restoring from backup; correcting an entry; disciplinary process"]],
                caption="A sound system uses all three; prevention alone always fails eventually.",
            ),
        ]),
        ("Segregation of duties", [
            desc(
                "No individual should be able to initiate AND approve the same sensitive "
                "transaction, nor to both hold an asset and account for it."
            ),
            desc(
                "The point is not distrust. It is that a single person completing a "
                "sensitive process end to end can conceal an error as easily as a fraud, "
                "and splitting it means wrongdoing requires collusion -- a far higher "
                "bar."
            ),
            ul([
                "Separate authorisation from execution.",
                "Separate custody of assets from recording them.",
                "Where staffing makes separation impossible, compensate with review by a manager.",
            ]),
        ]),
        ("IT general controls", [
            accordion([
                ("Access control", "Who may reach which system and data, granted by role, reviewed regularly and removed on departure."),
                ("Change management", "Changes are requested, assessed, approved, tested and recorded -- not applied directly to production."),
                ("Operations", "Jobs run, backups taken and verified, incidents recorded and resolved."),
                ("Development", "Separation of development, test and production, with no developer deploying unreviewed to production."),
            ]),
            desc(
                "These controls underpin every application control above them. If "
                "anybody can change production directly, no control implemented inside "
                "an application can be relied on."
            ),
        ]),
        ("Limitations", [
            desc(
                "Internal control can be defeated, and an honest system acknowledges "
                "how."
            ),
            ol([
                "Collusion -- two people together can defeat segregation of duties.",
                "Management override -- those who set controls can bypass them.",
                "Human error -- controls performed by people are performed imperfectly.",
                "Cost -- a control costing more than the risk is not worth having.",
                "Novelty -- controls address anticipated risks, not unanticipated ones.",
            ]),
            desc(
                "Management override is the hardest, which is why governance sits above "
                "control and why audit reports outside the management line."
            ),
        ]),
        ("Control, risk and governance", [
            desc(
                "Governance sets direction and decides what risk is acceptable. Risk "
                "management identifies and assesses what could go wrong. Internal "
                "control is the set of processes that keep exposure within what "
                "governance accepted."
            ),
            desc(
                "Read in that order the three fit together: governance decides, risk "
                "management measures, control implements, and audit provides independent "
                "assurance that the chain is intact."
            ),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Reconciliation is which kind of control?", "Detective",
                 "It finds a problem after the fact; approval is preventive."),
                ("What defeats segregation of duties?", "Collusion",
                 "Which is why it raises the bar rather than removing the risk."),
                ("Absolute or reasonable assurance?", "Reasonable",
                 "Absolute is unattainable at any cost."),
                ("Why do ITGCs matter most?", "Application controls rest on them",
                 "If production can be changed freely, nothing above it is reliable."),
            ]),
        ]),
    ],
    key_terms=[
        ("Internal control", "Processes giving reasonable assurance over operations, reporting and compliance."),
        ("Preventive control", "Acts before the event to stop it happening."),
        ("Detective control", "Identifies that something has already happened."),
        ("Segregation of duties", "Splitting a sensitive process so no one person completes it."),
        ("ITGC", "General IT controls over access, change, operations and development."),
        ("Management override", "Those who set controls bypassing them; the hardest limitation."),
    ],
    summary=(
        "Internal control gives reasonable assurance over operations, reporting and "
        "compliance, using preventive, detective and corrective controls together. "
        "Segregation of duties requires wrongdoing to involve collusion rather than a "
        "single decision. IT general controls over access, change, operations and "
        "development underpin every application control above them. Control is limited "
        "by collusion, management override, human error, cost and novelty, which is why "
        "governance sits above it and audit reports outside the management line."
    ),
    exam_notes=[
        desc(
            "Classification questions are common: given a control, say whether it is "
            "preventive, detective or corrective. Approval is preventive; reconciliation "
            "is detective."
        ),
        ul([
            "Reasonable, never absolute, assurance.",
            "Segregation of duties makes collusion necessary.",
            "Management override is the limitation controls cannot solve alone.",
        ]),
    ],
)

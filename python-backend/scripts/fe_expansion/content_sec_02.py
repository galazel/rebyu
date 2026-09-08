"""Technology Element -> Security, lessons 3 and 4.

Syllabus minor categories 3 (information security management) and 4
(evaluation and certification schemes).

These are the management half of the security category, and the examination
treats them as process questions: which phase does this activity belong to,
who is accountable, what does a certificate actually assert.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Technology Element"
MIDDLE = "Security"

# ==========================================================================
# Lesson 3: Information security management
# ==========================================================================

_isms_sections = [
    ("Security as a Management System", [
        desc(
            "Buying controls does not produce security. The syllabus treats "
            "it as a management system -- a continuing process with "
            "ownership, decisions and review -- because the threats and the "
            "business both keep changing."
        ),
        image(fig("risk-process")),
        desc(
            "An INFORMATION SECURITY MANAGEMENT SYSTEM is that process: "
            "identifying what matters, assessing the risk to it, deciding "
            "what to do, implementing it, and reviewing whether it still "
            "works. ISO 27001 is the standard the syllabus names for it."
        ),
        desc(
            "The cycle is deliberate. A control chosen against last year's "
            "assessment may be irrelevant, insufficient or actively "
            "obstructive today -- and only a scheduled review discovers that, "
            "since nothing announces a control becoming obsolete."
        ),
    ]),

    ("Identifying What Matters", [
        desc(
            "Protecting everything equally means protecting the important "
            "things inadequately, so the process starts by finding out what "
            "there is."
        ),
        ul([
            "An ASSET INVENTORY records what information and systems exist "
            "and where. Nobody can protect what nobody has listed.",
            "Each asset needs an OWNER -- a person accountable for decisions "
            "about it, not merely the team that operates it.",
            "CLASSIFICATION grades information by how sensitive it is, so "
            "controls can be proportionate rather than uniform.",
            "Classification must have few enough levels to be applied "
            "consistently, since a scheme nobody applies correctly is worse "
            "than none.",
        ]),
        desc(
            "OWNERSHIP is the part that most often fails and most often "
            "matters. Risk decisions -- accepting a risk, funding a control, "
            "approving an exception -- require somebody with the authority to "
            "make them, and an asset with no owner accumulates unmade "
            "decisions until an incident forces one."
        ),
    ]),

    ("Assessing Risk", [
        desc(
            "Risk assessment turns a list of possible bad things into an "
            "ordered set of decisions, and the ordering is the point."
        ),
        table(
            ["Step", "Produces"],
            [["Identify threats to each asset",
              "What could go wrong, and how"],
             ["Identify vulnerabilities", "Where it could get in"],
             ["Estimate likelihood", "How often, or how probable"],
             ["Estimate impact", "What it would cost if it happened"],
             ["Combine into a risk level",
              "A comparable figure or band"],
             ["Rank", "The order in which to spend"]],
            caption="Six steps producing one thing worth having: an order.",
            footer="The output that matters is the RANKING. Precise absolute "
                   "figures are rarely achievable and rarely needed; knowing "
                   "which risks matter most is what a limited budget "
                   "requires."),
        compare_grid(
            "QUALITATIVE AGAINST QUANTITATIVE ASSESSMENT",
            "Bands and judgement, or figures and arithmetic.",
            [("Qualitative",
              ["High, medium, low -- or a numbered scale",
               "Fast, and workable with imperfect information",
               "Comparisons within it are subjective",
               "What most organisations actually use"]),
             ("Quantitative",
              ["Monetary values and expected annual loss",
               "Directly comparable with the cost of a control",
               "Requires data most organisations do not have",
               "Convincing, and only as good as its inputs"])]),
        desc(
            "A quantitative figure carries an authority its inputs often do "
            "not deserve, which is the trap. An expected annual loss computed "
            "from an invented probability is a guess wearing a currency "
            "symbol, and it is harder to challenge than the honest 'high' it "
            "replaced."
        ),
    ]),

    ("Treating Risk", [
        desc(
            "Once a risk is understood, four responses are available and the "
            "examination expects all four by name."
        ),
        image(fig("risk-treatment")),
        table(
            ["Treatment", "Means", "Appropriate when"],
            [["Mitigate", "Add controls that reduce it",
              "The risk matters and the control costs less than it"],
             ["Transfer", "Insure it, or contract it out",
              "The financial loss can be borne elsewhere"],
             ["Avoid", "Stop doing the risky activity",
              "The activity is not worth its risk"],
             ["Accept", "Knowingly live with it",
              "The control costs more than the risk"]],
            caption="Four treatments, each correct in different "
                    "circumstances.",
            footer="ACCEPTANCE is a legitimate decision and not a failure to "
                   "act -- provided somebody with the authority made it "
                   "knowingly and it is recorded. The difference between "
                   "accepting a risk and ignoring one is entirely that "
                   "record."),
        desc(
            "TRANSFER has a limit the syllabus emphasises. Insurance moves "
            "the financial consequence and outsourcing moves the work, and "
            "neither moves accountability: the organisation whose customers' "
            "data was lost answers for it regardless of which supplier "
            "operated the system."
        ),
        desc(
            "RESIDUAL RISK is what remains after treatment, and it is never "
            "zero. Recording it explicitly is what prevents 'we mitigated "
            "that' from being mistaken for 'that cannot happen', which is a "
            "misunderstanding that surfaces at the worst possible moment."
        ),
    ]),

    ("Policy", [
        desc(
            "Decisions have to be written down to be applied consistently, "
            "and the syllabus distinguishes the levels of document."
        ),
        table(
            ["Document", "States", "Changes"],
            [["Policy", "What the organisation requires, and why",
              "Rarely"],
             ["Standard", "Specific mandatory requirements",
              "Occasionally"],
             ["Procedure", "How a task is actually performed",
              "Often"],
             ["Guideline", "Recommended practice, not mandatory",
              "As advice improves"]],
            caption="Four levels, from intent down to instructions.",
            footer="Mixing the levels is why security documentation goes "
                   "unread. A policy containing configuration steps must be "
                   "reissued whenever the software changes, and each "
                   "reissue costs the approval a policy requires."),
        desc(
            "A policy that is not enforced trains people to ignore policy "
            "generally, which is worse than not having written it. So the "
            "examinable test of a policy is not whether it says the right "
            "thing but whether the organisation actually does it -- and where "
            "it does not, either the policy or the practice must change."
        ),
    ]),

    ("Controls by Timing", [
        desc(
            "Controls are classified by when they act relative to an "
            "incident, and a programme needs all three kinds."
        ),
        image(fig("defence-layers")),
        table(
            ["Type", "Acts", "Examples"],
            [["Preventive", "Before, to stop it",
              "Access control, encryption, patching, training"],
             ["Detective", "During or after, to notice it",
              "Monitoring, logging, intrusion detection, audit"],
             ["Corrective", "After, to limit and repair",
              "Backups, incident response, recovery plans"],
             ["Deterrent", "Before, by discouraging",
              "Visible cameras, stated penalties"]],
            caption="Four timings, and what belongs in each.",
            footer="A programme of only PREVENTIVE controls cannot tell you "
                   "when one has failed, which is how a breach goes "
                   "undiscovered for months. Detection is what turns a "
                   "silent compromise into an incident somebody handles."),
        desc(
            "The classification is also useful because it makes gaps "
            "visible. Listing an organisation's controls by timing typically "
            "shows a great many preventive ones, a few detective ones, and "
            "corrective measures that exist on paper and have never been "
            "tested."
        ),
    ]),

    ("Responding to an Incident", [
        desc(
            "Some controls will fail, so responding well is planned in "
            "advance rather than improvised."
        ),
        image(fig("incident-response")),
        ol([
            "PREPARE -- before anything happens: who is called, what "
            "authority they have, how systems are isolated.",
            "DETECT AND ANALYSE -- establish whether this is real and what it "
            "actually is.",
            "CONTAIN -- stop it spreading, which is urgent.",
            "ERADICATE -- remove the cause, which is slower.",
            "RECOVER -- restore service, and watch for recurrence.",
            "REVIEW -- decide what should change so it is less likely or less "
            "damaging next time.",
        ]),
        desc(
            "CONTAINMENT precedes eradication deliberately. Stopping the "
            "spread is urgent while identifying every trace is slow, and "
            "reversing the order lets an incident grow throughout the "
            "analysis -- which is the sequencing the examination asks about."
        ),
        desc(
            "PREPARATION is the phase most often skipped and the one that "
            "decides how the rest go. Deciding during an incident who may "
            "authorise disconnecting a production system wastes exactly the "
            "time containment needs."
        ),
    ]),

    ("Business Continuity", [
        desc(
            "Security's availability property becomes a planning discipline "
            "when the disruption is large, and the syllabus names two "
            "figures."
        ),
        table(
            ["Measure", "Answers", "Determines"],
            [["RTO -- recovery time objective",
              "How quickly must service return",
              "The standby arrangements needed"],
             ["RPO -- recovery point objective",
              "How much recent data may be lost",
              "How frequently backups are taken"]],
            caption="Two objectives that drive entirely different "
                    "investments.",
            footer="A four-hour RTO and a five-minute RPO are independent "
                   "requirements: the first buys standby capacity, the second "
                   "buys continuous replication. Confusing them produces a "
                   "plan that meets neither."),
        desc(
            "A BUSINESS IMPACT ANALYSIS is what sets these numbers, "
            "establishing which processes matter most and what an outage of "
            "each actually costs -- so the objectives come from the business "
            "rather than from what the technology happens to offer."
        ),
        desc(
            "And an untested plan is an assumption. Restoring from a backup "
            "nobody has ever restored, failing over to a site nobody has ever "
            "used, invoking a contract nobody has ever invoked -- each is "
            "discovered to be broken at precisely the moment it is needed, "
            "which is why testing is part of the plan rather than an "
            "optional extra."
        ),
    ]),

    ("Awareness and People", [
        desc(
            "The Threats lesson showed that attacks on people bypass "
            "technical controls, which makes training a control rather than a "
            "formality."
        ),
        ul([
            "Training must be specific about what to do, not merely what to "
            "avoid -- 'report anything suspicious to this address' is "
            "actionable and 'be careful' is not.",
            "Reporting must be blame-free, or people who clicked something "
            "conceal it, and concealment is what turns a contained incident "
            "into a serious one.",
            "Screening at recruitment, terms in contracts and a defined "
            "leaving process cover the employment life cycle the syllabus "
            "names.",
            "Access removal on departure is the control most often missed, "
            "and accounts belonging to people who left are a standing "
            "exposure.",
        ]),
        desc(
            "The blame-free point is worth stating as the design principle it "
            "is. A person who realises they made a mistake is the fastest "
            "detection mechanism available, and a culture that punishes the "
            "report converts that detector into a delay."
        ),
    ]),

    ("Compliance and Legal Obligation", [
        desc(
            "Some security requirements are not chosen from a risk assessment "
            "at all -- they are imposed, and the syllabus separates the two "
            "sources."
        ),
        table(
            ["Source", "Origin", "If not met"],
            [["Law and regulation", "Legislation applying to the activity",
              "Penalties, and personal liability in some regimes"],
             ["Contract", "Agreements with customers or partners",
              "Breach, and loss of the business"],
             ["Industry scheme", "A condition of participating",
              "Exclusion from the activity"],
             ["Internal policy", "The organisation's own decision",
              "Whatever it chooses to enforce"]],
            caption="Four sources of obligation, only one of them "
                    "voluntary.",
            footer="An imposed requirement is not open to the acceptance "
                   "treatment. A risk assessment concluding a control costs "
                   "more than the risk does not authorise breaking a law, "
                   "which is why compliance is tracked separately from "
                   "risk."),
        desc(
            "Compliance and security overlap and are not the same thing. A "
            "compliant organisation has met a defined checklist, which was "
            "written for a general case and not for its particular risks -- "
            "so being compliant and being poorly protected are entirely "
            "compatible states, and the reverse is possible too."
        ),
    ]),

    ("Measuring Whether It Works", [
        desc(
            "A management system that is never measured cannot be improved, "
            "and the syllabus expects the review half of the cycle to be as "
            "concrete as the implementation half."
        ),
        ul([
            "Track how long it takes to detect an incident, which is the "
            "figure that most directly reflects detective controls.",
            "Track how long it takes to contain one, which reflects "
            "preparation.",
            "Track patch latency -- how long between a fix being released and "
            "being installed -- since that interval is the exposure window.",
            "Track how many accounts belong to people who have left, which "
            "measures the leaving process rather than anybody's intentions.",
            "Track exceptions granted and whether they were reviewed, since "
            "an exception that quietly became permanent is a control that no "
            "longer exists.",
        ]),
        desc(
            "These are deliberately measures of the PROCESS rather than "
            "counts of blocked attacks. A firewall reporting millions of "
            "blocked probes is reporting internet background noise, and it "
            "says nothing about whether the organisation would notice a real "
            "compromise."
        ),
    ]),

    ("Audit and Independent Review", [
        desc(
            "The people running a process are poorly placed to judge whether "
            "it works, so review is separated from operation."
        ),
        compare_grid(
            "INTERNAL AGAINST EXTERNAL REVIEW",
            "Both examine the same system for different audiences.",
            [("Internal audit",
              ["Performed by the organisation, independently of operations",
               "Frequent, and cheaper",
               "Aimed at improvement",
               "Its independence is a matter of reporting lines"]),
             ("External audit",
              ["Performed by a party outside the organisation",
               "Periodic, and expensive",
               "Aimed at assurance for others",
               "Its independence is structural"])]),
        desc(
            "The examinable point is what independence actually requires: "
            "somebody who does not report to the person responsible for what "
            "is being examined. An internal auditor reporting to the manager "
            "whose controls they assess is not independent, however "
            "conscientious they are, which is why reporting lines rather than "
            "job titles decide it."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where management items are lost."),
        ul([
            "Treating acceptance as inaction. It is a documented decision by "
            "somebody with authority.",
            "Believing transfer moves accountability. Insurance and "
            "outsourcing move loss and work, not answerability.",
            "Forgetting residual risk, and reading 'mitigated' as "
            "'impossible'.",
            "Placing eradication before containment. Stopping the spread is "
            "the urgent part.",
            "Confusing RTO with RPO. One is time to restore, the other is "
            "data that may be lost.",
            "Trusting an untested continuity plan or an unverified backup.",
            "Writing procedures into a policy, so it needs reapproval "
            "constantly.",
            "Treating quantitative figures as more reliable than their "
            "inputs.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An organisation outsources its payroll processing to a "
            "supplier, and stipulates in the contract that the supplier is "
            "liable for any data breach. The supplier suffers a breach "
            "exposing employee data. What is the organisation's position?\""
        ),
        ol([
            "Identify the treatment applied: risk TRANSFER, through a "
            "contractual liability clause.",
            "Establish what transfer moves: the financial consequence, and "
            "the operational work.",
            "Establish what it does not move: accountability to the people "
            "whose data it was, and any regulatory obligation.",
            "So the organisation remains answerable for the breach, whatever "
            "it may recover from the supplier.",
            "The controls that would have mattered are the ones applying "
            "before the incident: assessing the supplier, limiting the data "
            "shared, and requiring notification of incidents.",
        ]),
        desc(
            "Step five is what separates a full answer from a correct one. "
            "The contractual clause addresses the aftermath, and supplier "
            "assessment addresses whether the breach happens -- and the "
            "examination is testing whether the candidate distinguishes "
            "recovering a loss from preventing one."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Security management overlaps several later categories."),
        ul([
            "The risk cycle is the same shape as the quality processes in "
            "Development Technology.",
            "RTO and RPO are Service Management continuity measures.",
            "Supplier assessment is procurement, covered in Corporate "
            "Activities.",
            "Policy and enforcement are governance from the same category.",
            "Independent verification of the process is System Audit.",
            "Breach notification obligations are Legal Affairs.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("The four risk treatments",
              "Mitigate, transfer, avoid, accept",
              "Acceptance is a documented decision by somebody with "
              "authority, not a failure to act."),
             ("What transfer does not move",
              "Accountability",
              "Insurance moves the loss and outsourcing moves the work; the "
              "organisation still answers for it."),
             ("Why containment precedes eradication",
              "Stopping the spread is urgent; removing every trace is slow",
              "Reversing them lets the incident grow throughout the "
              "analysis."),
             ("RTO against RPO",
              "How fast service returns, against how much data may be lost",
              "Independent requirements buying entirely different things."),
             ("What only detective controls provide",
              "Knowing a preventive control failed",
              "Which is how a breach goes unnoticed for months without "
              "them."),
             ("Why reporting must be blame-free",
              "A person who realises their mistake is the fastest detector",
              "Punishing the report converts that detector into a "
              "delay.")]),
    ]),
]

_isms_quiz = [
    mcq("HARD",
        "An organisation outsources processing to a supplier and contracts "
        "that the supplier is liable for any breach. A breach occurs at the "
        "supplier.\n\nWhat is the organisation's position?",
        [("It remains accountable for the breach, whatever it recovers "
          "contractually", True),
         ("It is no longer responsible, since liability was transferred by "
          "the contract before the incident", False),
         ("It shares responsibility equally with the supplier in proportion "
          "to the contract's terms", False),
         ("It is responsible only if it failed to assess the supplier before "
          "engaging them", False)],
        "Transferring risk moves the financial consequence and the work, and "
        "moves neither accountability to the people whose data it was nor any "
        "regulatory obligation. The contract governs recovery afterwards; it "
        "does not change who answers for the breach. The controls that would "
        "have mattered are the ones applied beforehand -- assessing the "
        "supplier, limiting the data shared, requiring incident "
        "notification."),

    mcq("AVERAGE",
        "In incident response, why does containment precede eradication?",
        [("Stopping the spread is urgent while removing every trace is "
          "slow", True),
         ("Eradication destroys the evidence needed to identify the "
          "attacker", False),
         ("Containment can be performed without management authorisation "
          "whereas eradication cannot", False),
         ("The cause cannot be identified until the affected systems are "
          "isolated from the network", False)],
        "Containment limits the damage immediately, while identifying and "
        "removing every trace of a cause takes time and investigation. "
        "Reversing the order lets the incident continue spreading throughout "
        "the analysis, which is why the sequence matters. Evidence "
        "preservation is a real consideration and is handled during "
        "containment rather than being the reason for the ordering."),

    mcq("AVERAGE",
        "What does accepting a risk mean in a security management system?",
        [("Knowingly deciding to live with it, recorded and authorised", True),
         ("Postponing treatment until budget becomes available in a later "
          "period", False),
         ("Reducing it to a level considered acceptable by adding "
          "controls", False),
         ("Concluding that the risk assessment overstated the likelihood "
          "involved", False)],
        "Acceptance is a legitimate treatment, correct whenever a control "
        "would cost more than the risk it addresses. What makes it acceptance "
        "rather than negligence is entirely that somebody with the authority "
        "made the decision knowingly and it is recorded -- so that it can be "
        "reviewed when circumstances change. Reducing it with controls is "
        "mitigation."),

    mcq("HARD",
        "A recovery plan specifies a four-hour RTO and a five-minute RPO.\n\n"
        "What do these require?",
        [("Standby capacity able to restore service in four hours, and "
          "replication no more than five minutes behind", True),
         ("Backups taken every four hours and restored within five "
          "minutes", False),
         ("A four-hour maximum outage per year, with five minutes of "
          "acceptable data loss per event", False),
         ("Failover completing within four hours of a five-minute detection "
          "window", False)],
        "The recovery TIME objective says how quickly service must return, "
        "which is bought with standby arrangements. The recovery POINT "
        "objective says how much recent data may be lost, which is bought "
        "with replication frequency. They are independent requirements "
        "driving entirely different investments, and confusing them produces "
        "a plan meeting neither."),

    mcq("AVERAGE",
        "What does an organisation lack if its controls are entirely "
        "preventive?",
        [("Any means of knowing when a control has failed", True),
         ("Sufficient coverage of the risks identified in its "
          "assessment", False),
         ("A documented basis for accepting residual risk", False),
         ("The ability to recover data after an incident occurs", False)],
        "Preventive controls stop things happening and report nothing when "
        "they do not work, so a compromise passes silently -- which is how "
        "breaches go undiscovered for months. Detective controls are what "
        "turn a silent compromise into an incident somebody handles. "
        "Recovering data afterwards is what CORRECTIVE controls provide, and "
        "a full programme needs all three."),

    mcq("HARD",
        "Why can a quantitative risk assessment be misleading?",
        [("A figure computed from estimated inputs carries authority its "
          "inputs do not deserve", True),
         ("Monetary values cannot be compared against the cost of the "
          "controls being considered", False),
         ("It produces an ordering rather than absolute values for each "
          "risk", False),
         ("It requires more time to perform than most organisations can "
          "allocate to it", False),
         ],
        "Expressing a risk as an expected annual loss makes it directly "
        "comparable with a control's cost, which is genuinely valuable -- and "
        "only as sound as the probabilities it was computed from. A guess "
        "presented as a currency figure is harder to challenge than the "
        "honest 'high' it replaced, which is the trap. Comparability with "
        "control costs is its advantage, not its weakness."),

    mcq("AVERAGE",
        "What is residual risk?",
        [("The risk that remains after controls have been applied", True),
         ("The risk an organisation has explicitly decided to accept", False),
         ("The risk transferred to an insurer or a supplier", False),
         ("The risk arising from controls that have not yet been "
          "implemented", False)],
        "No control reduces a risk to zero, so something always remains after "
        "treatment. Recording it explicitly prevents 'we mitigated that' from "
        "being read as 'that cannot happen' -- a misunderstanding that "
        "surfaces at the worst moment. Accepted risk is a treatment decision, "
        "which may or may not be about the residue of a mitigated risk."),

    mcq("HARD",
        "Why should incident reporting by employees be blame-free?",
        [("A person who realises their own mistake is the fastest detection "
          "available", True),
         ("Attributing blame is prohibited under most data protection "
          "regimes", False),
         ("Employees cannot be expected to identify what constitutes an "
          "incident", False),
         ("Blame reduces the accuracy of the technical details a reporter "
          "provides", False)],
        "Somebody who has just clicked something and realised it reports "
        "within minutes, which is faster than any monitoring system. A "
        "culture that punishes the report converts that detector into "
        "concealment, and concealment is what turns a containable incident "
        "into a serious one. The design principle is making the fastest "
        "detection channel safe to use."),

    mcq("AVERAGE",
        "Why should a security policy avoid containing detailed "
        "configuration steps?",
        [("Steps change often and each change would require the policy to be "
          "reapproved", True),
         ("Policies are published externally while configuration details are "
          "confidential", False),
         ("Configuration steps are guidelines rather than mandatory "
          "requirements", False),
         ("Policies apply to all staff while configuration concerns only "
          "administrators", False)],
        "A policy states what the organisation requires and why, and it "
        "changes rarely, which is what lets it carry senior approval. "
        "Procedures state how a task is performed and change whenever the "
        "software does. Mixing them forces the policy through its approval "
        "process on every technical change, which is how security "
        "documentation becomes stale and unread."),

    mcq("HARD",
        "An organisation has a documented continuity plan that has never been "
        "exercised.\n\nWhat is the concern?",
        [("Every step in it is an untested assumption discovered at the worst "
          "moment", True),
         ("The plan cannot be certified against the relevant management "
          "standard without evidence", False),
         ("Staff will not have memorised the plan's contents when an incident "
          "occurs", False),
         ("The recovery objectives may have been set higher than the business "
          "actually requires", False)],
        "Backups nobody has restored, sites nobody has failed over to and "
        "contracts nobody has invoked are each found to be broken precisely "
        "when they are needed. Testing is what converts the document into "
        "capability, which is why it belongs in the plan rather than being an "
        "optional extra -- and why the first real invocation of an untested "
        "plan so often fails."),
]

LESSON_SEC_ISMS = lesson(
    MAJOR, MIDDLE,
    "Information Security Management: ISMS, Risk and Policy",
    _isms_quiz,
    lesson_structure(
        "Information Security Management: ISMS, Risk and Policy",
        "Buying controls does not produce security, so this lesson covers the "
        "management system that decides which controls and why: the cycle of "
        "identifying assets and their owners, assessing risk to produce an "
        "ORDER rather than a spurious precision, and treating it by "
        "mitigation, transfer, avoidance or acceptance -- with acceptance a "
        "legitimate documented decision and transfer moving loss but never "
        "accountability. It then covers policy and its levels, controls "
        "classified by when they act, the incident response sequence that "
        "puts containment before eradication, the continuity objectives that "
        "drive different investments, and why blame-free reporting is a "
        "detection mechanism.",
        [
            "Explain why security is managed as a continuing cycle",
            "Describe asset inventory, ownership and classification",
            "Perform the steps of a risk assessment and explain what its "
            "output is for",
            "Contrast qualitative with quantitative assessment",
            "Apply the four risk treatments and explain what transfer does "
            "not move",
            "Distinguish policy, standard, procedure and guideline",
            "Classify controls by timing and identify gaps",
            "Sequence incident response, and distinguish RTO from RPO",
        ],
        80,
        _isms_sections,
        [
            ("ISMS",
             "A continuing management system for information security -- "
             "assess, treat, implement, review. ISO 27001 is the named "
             "standard."),
            ("Asset owner",
             "The person accountable for decisions about an asset, with the "
             "authority to accept risk or fund controls."),
            ("Classification",
             "Grading information by sensitivity so controls are "
             "proportionate. Needs few enough levels to be applied "
             "consistently."),
            ("Qualitative assessment",
             "Bands and judgement. Fast, workable with imperfect information, "
             "and subjective."),
            ("Quantitative assessment",
             "Monetary values, comparable with control costs, and only as "
             "sound as the estimates behind them."),
            ("Mitigate",
             "Add controls that reduce likelihood or impact. The default "
             "treatment."),
            ("Transfer",
             "Insurance or outsourcing. Moves financial loss and work, never "
             "accountability."),
            ("Accept",
             "A knowing, recorded, authorised decision to live with a risk. "
             "Not the same as ignoring it."),
            ("Residual risk",
             "What remains after treatment. Never zero, and recorded so that "
             "'mitigated' is not read as 'impossible'."),
            ("Policy, standard, procedure, guideline",
             "Requirement and rationale; mandatory specifics; how a task is "
             "done; recommended practice."),
            ("Preventive, detective, corrective",
             "Controls acting before, during and after. Only detective "
             "controls reveal that a preventive one failed."),
            ("Incident response phases",
             "Prepare, detect and analyse, contain, eradicate, recover, "
             "review -- with containment before eradication."),
            ("RTO",
             "Recovery time objective: how quickly service must return. "
             "Bought with standby capacity."),
            ("RPO",
             "Recovery point objective: how much recent data may be lost. "
             "Bought with replication frequency."),
            ("Business impact analysis",
             "Establishes which processes matter and what outages cost, "
             "setting the recovery objectives from the business."),
        ],
        "Security is a management system rather than a purchase: assets are "
        "identified and given OWNERS with authority to decide, risk is "
        "assessed to produce an order to spend in rather than a spurious "
        "precision, and the cycle repeats because nothing announces a control "
        "becoming obsolete. Assessment may be qualitative or quantitative, "
        "and a monetary figure computed from invented probabilities carries "
        "an authority its inputs do not deserve. Four treatments follow -- "
        "mitigate, transfer, avoid, accept -- and two of them are widely "
        "misread: acceptance is a documented decision by somebody with "
        "authority rather than inaction, and transfer moves financial loss "
        "and operational work while leaving accountability exactly where it "
        "was. Residual risk always remains, and recording it stops "
        "'mitigated' being heard as 'impossible'. Policy states requirement "
        "and rationale and must not contain procedures, or every technical "
        "change drags it through reapproval. Controls act before, during or "
        "after, and a programme of only preventive ones cannot tell when one "
        "failed -- which is how breaches go unnoticed for months. Incident "
        "response prepares first and CONTAINS before eradicating, because "
        "stopping the spread is urgent and removing every trace is slow. "
        "Continuity is driven by RTO and RPO, independent objectives buying "
        "different things, and any plan nobody has exercised is a set of "
        "assumptions due to be discovered at the worst moment.",
        exam_notes=[
            desc(
                "These items are process questions: which treatment is this, "
                "which phase comes next, who remains accountable."
            ),
            ul([
                "Identifying a risk treatment from a described decision.",
                "Stating what transfer does and does not move.",
                "Sequencing incident response phases.",
                "Distinguishing RTO from RPO.",
                "Explaining what acceptance requires to be legitimate.",
                "Identifying a gap in a control programme by timing.",
                "Explaining why an untested plan is not a capability.",
            ]),
            desc(
                "When an item describes a decision, ask who made it and "
                "whether it was recorded. Most of the wrong answers in this "
                "lesson describe the same action taken without authority or "
                "documentation, which is exactly what separates management "
                "from improvisation."
            ),
        ],
    ))

# ==========================================================================
# Lesson 4: Evaluation and certification schemes
# ==========================================================================

_eval_sections = [
    ("Why Independent Evaluation Exists", [
        desc(
            "A supplier asserting their product is secure is making a claim "
            "the buyer cannot verify, and evaluation schemes exist to close "
            "that gap."
        ),
        desc(
            "The problem is structural rather than one of honesty. Security "
            "properties are not visible from outside a product, every "
            "supplier claims them, and each buyer independently assessing "
            "each product would duplicate enormous effort -- so an "
            "independent party evaluates once against a published standard "
            "and everybody relies on the result."
        ),
        table(
            ["Without evaluation", "With it"],
            [["Every buyer assesses independently",
              "One assessment, relied on by many"],
             ["Claims are not comparable between products",
              "A common yardstick"],
             ["Depth of assessment varies with the buyer's skill",
              "A defined and stated depth"],
             ["No basis for a procurement requirement",
              "A level can be specified in a tender"]],
            caption="What a scheme actually provides.",
            footer="The last row is why governments drove these schemes. A "
                   "requirement that a product be 'secure' is unenforceable "
                   "in a contract; a requirement for a stated evaluation "
                   "level is not."),
    ]),

    ("The Common Criteria", [
        desc(
            "The international scheme the syllabus names, and the vocabulary "
            "matters because the examination uses its terms precisely."
        ),
        image(fig("cc-terms")),
        table(
            ["Term", "Means"],
            [["TOE -- target of evaluation",
              "The specific product, version and configuration examined"],
             ["PP -- protection profile",
              "A statement of security requirements for a CLASS of product"],
             ["ST -- security target",
              "What THIS product claims to do, which is what gets evaluated"],
             ["EAL -- evaluation assurance level",
              "How rigorously the claim was checked, from 1 to 7"]],
            caption="Four terms, and the relationships between them.",
            footer="The security target is written by the developer, and the "
                   "evaluation checks the product against it. So a "
                   "certificate says 'this product does what it claimed', "
                   "which is a different statement from 'this product is "
                   "secure'."),
        desc(
            "That distinction carries the whole lesson. A product may hold a "
            "certificate at a high assurance level for a security target that "
            "does not cover what a particular buyer needs -- and the "
            "certificate is perfectly valid and entirely unhelpful to them."
        ),
    ]),

    ("Assurance Levels", [
        desc(
            "The EAL scale runs from 1 to 7 and measures the DEPTH of "
            "examination rather than the strength of the product."
        ),
        image(fig("eal-scale")),
        table(
            ["Level", "Roughly", "Suits"],
            [["EAL1", "Functionally tested",
              "Some confidence wanted, threat considered low"],
             ["EAL2-3", "Structurally tested, methodically checked",
              "Commercial products in ordinary use"],
             ["EAL4", "Methodically designed, tested and reviewed",
              "The highest level commonly achieved commercially"],
             ["EAL5-7", "Semi-formally to formally verified",
              "Where failure is catastrophic, and cost is accepted"]],
            caption="Seven levels, grouped by what they realistically mean.",
            footer="EAL4 is the practical ceiling for commercial software "
                   "because higher levels demand formal methods whose cost "
                   "rises far faster than the assurance does -- which is an "
                   "economic boundary rather than a technical one."),
        desc(
            "The most examined misreading is treating a higher EAL as a more "
            "secure product. It means the claim was checked more rigorously, "
            "so an EAL5 product with a narrow security target may protect a "
            "buyer far less than an EAL2 product whose target matches their "
            "actual requirement."
        ),
    ]),

    ("Management System Certification", [
        desc(
            "Products are not the only thing certified. Organisations certify "
            "their PROCESSES, which is a different claim entirely."
        ),
        compare_grid(
            "PRODUCT CERTIFICATION AGAINST MANAGEMENT CERTIFICATION",
            "Two schemes answering two questions.",
            [("Common Criteria -- a product",
              ["Examines one product, version and configuration",
               "Asks whether it does what its target claims",
               "Says nothing about how the buyer operates it",
               "A snapshot of that version"]),
             ("ISO 27001 -- an organisation",
              ["Examines the management system, not any product",
               "Asks whether risk is assessed and treated properly",
               "Says nothing about any specific control's strength",
               "Maintained by surveillance audits over time"])]),
        desc(
            "The distinction is examined because both are called "
            "certification and neither substitutes for the other. An "
            "organisation certified to ISO 27001 has a working process for "
            "deciding about security, which is not a statement that any "
            "particular system is well protected -- and a certified product "
            "badly deployed is badly protected."
        ),
    ]),

    ("Related Schemes and Standards", [
        desc(
            "Several other frameworks appear in items, and knowing what each "
            "one is FOR is sufficient."
        ),
        table(
            ["Standard", "Covers", "Applies to"],
            [["ISO 27001", "The management system requirements",
              "An organisation, certifiable"],
             ["ISO 27002", "A catalogue of controls and guidance",
              "Guidance, not certifiable"],
             ["ISO 15408", "The Common Criteria",
              "A product"],
             ["Cryptographic module standards",
              "Implementation of cryptography specifically",
              "A module within a product"],
             ["Payment card standards", "Handling of cardholder data",
              "Anyone processing card payments, contractually"]],
            caption="Five standards, distinguished by scope.",
            footer="The 27001/27002 pair is the one confused. One states what "
                   "a management system must do and can be certified; the "
                   "other is a menu of controls to choose from and cannot."),
        desc(
            "The payment card row is worth noting as a different kind of "
            "obligation. It is imposed by contract with the card networks "
            "rather than by law or by choice, which makes compliance a "
            "condition of doing business rather than a voluntary "
            "demonstration of quality."
        ),
    ]),

    ("What a Certificate Does Not Tell You", [
        desc(
            "The examination reliably includes an item about the limits of "
            "certification, and the limits are specific."
        ),
        ul([
            "It applies to the exact version and configuration evaluated. A "
            "later version is not covered by it.",
            "It reflects the state at evaluation. A vulnerability discovered "
            "afterwards does not revoke the certificate and does affect the "
            "product.",
            "It says nothing about deployment. A certified product configured "
            "carelessly is not secure.",
            "It is bounded by the security target. Anything outside it was "
            "not examined at all.",
            "It does not assess the operational environment the product "
            "depends on.",
        ]),
        desc(
            "So a certificate is evidence rather than a guarantee, and the "
            "correct use of it is as one input to a risk assessment -- which "
            "is why this lesson sits beside the management lesson rather than "
            "replacing any part of it."
        ),
    ]),

    ("Who Performs an Evaluation", [
        desc(
            "A scheme's value rests on the evaluator being both competent and "
            "independent, so the schemes govern the evaluators as well as the "
            "products."
        ),
        table(
            ["Party", "Does", "Overseen by"],
            [["The developer", "Writes the security target and supplies "
                               "evidence", "The evaluator"],
             ["The evaluation laboratory", "Performs the examination",
              "An accreditation body"],
             ["The certification body", "Issues the certificate",
              "The national scheme"],
             ["Other nations", "Recognise the certificate",
              "A mutual recognition arrangement"]],
            caption="Four parties, and what keeps each honest.",
            footer="MUTUAL RECOGNITION is what makes the scheme "
                   "international: a certificate issued in one participating "
                   "country is accepted in the others, so a supplier "
                   "evaluates once rather than per market."),
        desc(
            "The developer paying for their own evaluation is a structural "
            "tension the accreditation regime exists to manage. It is the "
            "same arrangement as a financial audit, and it works for the same "
            "reason: the laboratory's own accreditation is worth more to it "
            "than any single customer."
        ),
    ]),

    ("Reading a Certificate Correctly", [
        desc(
            "Given a certificate, there are four questions to ask before it "
            "means anything for a particular decision."
        ),
        ol([
            "WHAT was evaluated -- which product, which version, in which "
            "configuration.",
            "WHAT was claimed -- the security target, and whether it covers "
            "the requirement at hand.",
            "HOW rigorously -- the assurance level, which only matters once "
            "the first two are satisfactory.",
            "WHEN -- since the evaluation reflects a moment, and "
            "vulnerabilities discovered afterwards are not covered.",
        ]),
        desc(
            "The order matters as much as the questions. Starting with the "
            "assurance level, which is the most visible part and the easiest "
            "to compare, is what produces the standard error of buying a "
            "thoroughly verified answer to the wrong question."
        ),
        desc(
            "The fourth question is the one that ages a certificate. A "
            "product certified three years ago against a security target that "
            "still fits may nonetheless have accumulated known "
            "vulnerabilities in the versions since -- and the certificate has "
            "no mechanism for saying so."
        ),
    ]),

    ("Specifying Assurance in a Procurement", [
        desc(
            "The practical use of these schemes is in buying, and the "
            "syllabus expects the requirement to be expressible."
        ),
        ul([
            "State the protection profile the product must conform to, which "
            "specifies the requirements rather than trusting each supplier's "
            "own claim.",
            "State the minimum assurance level, which sets how rigorously "
            "conformance must have been checked.",
            "Require the certificate to cover the version being supplied, not "
            "an earlier one.",
            "Require the supplier's guidance for the evaluated "
            "configuration, since deploying outside it forfeits the "
            "assurance.",
            "Treat all of this as one input beside price, support and the "
            "supplier's own viability.",
        ]),
        desc(
            "Requiring a protection profile rather than merely a level is "
            "what makes the requirement meaningful. A level alone lets a "
            "supplier satisfy it with a narrow security target, which is "
            "compliant with the tender and useless to the buyer."
        ),
    ]),

    ("The Cost of Being Evaluated", [
        desc(
            "Evaluation is expensive and slow, and understanding why explains "
            "several features of the market the syllabus describes."
        ),
        ul([
            "The evidence required -- design documentation, test results, "
            "development process records -- must be produced to the scheme's "
            "standard rather than the developer's own.",
            "Evaluation takes months, so a product's certified version is "
            "routinely behind the version being sold.",
            "Each new version needs re-evaluation, though schemes offer "
            "cheaper maintenance routes for small changes.",
            "The cost is justified where buyers require certification and "
            "not otherwise, which is why it concentrates in government and "
            "regulated markets.",
        ]),
        desc(
            "The second point is the practically important one and it "
            "connects directly to the patching discipline. A buyer insisting "
            "on running only the certified version may be running one with "
            "known unpatched vulnerabilities -- so the requirement has to be "
            "written to permit security updates, or it makes the buyer less "
            "safe rather than more."
        ),
    ]),

    ("Vulnerability Disclosure and Ratings", [
        desc(
            "Alongside the formal schemes sits a working system for "
            "describing individual vulnerabilities, which the syllabus "
            "expects in outline."
        ),
        table(
            ["Mechanism", "Provides"],
            [["A common identifier", "One reference every party can use for "
                                     "the same vulnerability"],
             ["A severity score", "A comparable measure of how serious it "
                                  "is"],
             ["A public database",
              "A searchable record of what is known and what is fixed"],
             ["Coordinated disclosure",
              "Time for a fix before the details are published"]],
            caption="Four parts of the disclosure system.",
            footer="A shared identifier is the unglamorous part that makes "
                   "the rest work. Without it, a supplier's advisory and a "
                   "scanner's finding cannot be matched, and an organisation "
                   "cannot tell whether it has already addressed something."),
        desc(
            "A severity score describes the vulnerability rather than the "
            "organisation's exposure to it. A critical rating in software "
            "nobody has deployed is not urgent, and a moderate one in an "
            "internet-facing system holding personal data may be -- which is "
            "why the score is an input to prioritisation and not the "
            "prioritisation itself."
        ),
    ]),

    ("Testing Rather Than Certifying", [
        desc(
            "Certification examines a product against a claim. The syllabus "
            "also names two activities that examine a real deployment."
        ),
        compare_grid(
            "SCANNING AGAINST PENETRATION TESTING",
            "Both look for weaknesses in what is actually running.",
            [("Vulnerability scanning",
              ["Automated, against a database of known weaknesses",
               "Broad coverage, run frequently and cheaply",
               "Reports what MIGHT be exploitable",
               "Produces findings that need confirming"]),
             ("Penetration testing",
              ["Performed by people attempting actual exploitation",
               "Narrower, periodic, and considerably more expensive",
               "Demonstrates what IS exploitable, and how far",
               "Finds logic flaws no scanner recognises"])]),
        desc(
            "They answer different questions and neither replaces the other. "
            "A scan says what is known to be missing; a test says what an "
            "attacker could actually achieve, including chains of individually "
            "minor weaknesses that no automated tool assembles."
        ),
        desc(
            "Both require explicit written authorisation before they begin. "
            "The activities are indistinguishable from an attack while "
            "underway, so the scope, the timing and the permission are agreed "
            "in advance -- which is a legal necessity rather than a "
            "courtesy."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where evaluation items are lost."),
        ul([
            "Reading a higher EAL as a more secure product. It means a more "
            "rigorous examination of the claim made.",
            "Assuming a certificate covers the current version. It covers the "
            "version evaluated.",
            "Confusing ISO 27001 with 27002. One is certifiable requirements, "
            "the other is guidance.",
            "Treating organisational certification as evidence about a "
            "specific system.",
            "Forgetting the security target bounds what was examined.",
            "Believing certification accounts for how a product is deployed.",
            "Assuming payment card compliance is a legal requirement rather "
            "than a contractual one.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A supplier offers a product certified at EAL5 and a competitor "
            "offers one at EAL2. A buyer concludes the first is more secure. "
            "Evaluate that conclusion.\""
        ),
        ol([
            "Establish what EAL measures: the rigour with which the product's "
            "claim was examined.",
            "Establish what the claim itself is: the SECURITY TARGET, written "
            "by the developer.",
            "So EAL5 means a narrower or broader claim was checked very "
            "thoroughly -- it says nothing about how much the claim covers.",
            "An EAL2 product whose target matches the buyer's actual "
            "requirement may protect them considerably better than an EAL5 "
            "product whose target does not.",
            "The correct comparison is therefore of the security targets "
            "against the buyer's requirement first, and the assurance levels "
            "second.",
        ]),
        desc(
            "The reasoning generalises to every certification item in the "
            "syllabus: establish WHAT was certified before considering how "
            "rigorously. A scheme measures confidence in a claim, and a claim "
            "that does not cover your requirement is not made relevant by "
            "being thoroughly verified."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Evaluation schemes appear in several other contexts."),
        ul([
            "Certification as an input to risk assessment is the previous "
            "lesson.",
            "Specifying an assurance level in a tender is procurement, in "
            "Corporate Activities.",
            "Independent examination of a process is System Audit.",
            "Standards conformance generally is covered in Business "
            "Strategy.",
            "Payment card obligations connect to the transaction systems of "
            "Business Industry.",
            "Version-specific certification interacts with the patching "
            "discipline of the Threats lesson.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What an EAL measures",
              "The rigour of the examination, not the product's strength",
              "So an EAL5 certificate for a narrow target may help a buyer "
              "less than an EAL2 for the right one."),
             ("What a security target is",
              "The developer's claim, which is what gets evaluated",
              "Which is why a certificate says the product does what it "
              "claimed, not that it is secure."),
             ("ISO 27001 against 27002",
              "Certifiable requirements, against a catalogue of guidance",
              "Only the first is something an organisation is certified "
              "against."),
             ("Product against organisational certification",
              "One product's claim, against a working risk process",
              "Neither substitutes for the other, and both are called "
              "certification."),
             ("What a certificate does not cover",
              "Later versions, deployment, and anything outside the target",
              "Which makes it evidence for a risk assessment rather than a "
              "guarantee."),
             ("Why EAL4 is the commercial ceiling",
              "Higher levels need formal methods whose cost rises faster than "
              "the assurance",
              "An economic boundary rather than a technical one.")]),
    ]),
]

_eval_quiz = [
    mcq("HARD",
        "One product is certified at EAL5 and a competitor at EAL2. A buyer "
        "concludes the first is more secure for their purpose.\n\n"
        "Is this sound?",
        [("No -- the level measures examination rigour, not what the product "
          "claims to do", True),
         ("Yes -- a higher assurance level always indicates stronger security "
          "functions in the product", False),
         ("No -- assurance levels above EAL4 are not comparable with those "
          "below it", False),
         ("Yes -- provided both products were evaluated under the same "
          "national scheme", False)],
        "An assurance level says how rigorously a product's claim was checked, "
        "and the claim itself is the security target written by the "
        "developer. An EAL2 product whose target matches the buyer's "
        "requirement may protect them far better than an EAL5 product whose "
        "target does not cover it at all. Compare the targets against the "
        "requirement first and the levels second."),

    mcq("AVERAGE",
        "In the Common Criteria, what is the security target?",
        [("The developer's statement of what this product claims to "
          "do", True),
         ("The security requirements defined for a whole class of "
          "products", False),
         ("The level of rigour applied during the evaluation "
          "process", False),
         ("The specific product, version and configuration being "
          "examined", False)],
        "The security target states what THIS product claims, and the "
        "evaluation checks the product against it -- so a certificate asserts "
        "'this product does what it claimed', a different statement from "
        "'this product is secure'. Requirements for a class of products form "
        "a PROTECTION PROFILE, and the product and configuration examined is "
        "the TARGET OF EVALUATION."),

    mcq("AVERAGE",
        "What is the difference between ISO 27001 and ISO 27002?",
        [("27001 states certifiable management system requirements; 27002 is "
          "a catalogue of guidance", True),
         ("27001 covers products while 27002 covers organisational "
          "processes", False),
         ("27001 applies to the private sector and 27002 to public "
          "bodies", False),
         ("27001 defines controls and 27002 defines how to audit "
          "them", False)],
        "27001 states what a management system must do and is what an "
        "organisation is certified against. 27002 is a menu of controls with "
        "guidance on applying them, and nothing is certified against it. The "
        "pair is confused frequently, and the practical distinction is "
        "whether a certificate can be issued -- only the first supports one."),

    mcq("HARD",
        "A product's certification was issued two years ago and a serious "
        "vulnerability has since been discovered in it.\n\n"
        "What is the certificate's status?",
        [("It remains valid, since it reflects the product's state at "
          "evaluation", True),
         ("It is automatically withdrawn once a vulnerability is "
          "published", False),
         ("It remains valid only for deployments configured as they were at "
          "evaluation", False),
         ("It is suspended until the supplier submits the corrected version "
          "for re-evaluation", False)],
        "A certificate records the outcome of an examination at a point in "
        "time and does not revoke itself when the world changes. This is "
        "precisely why it is evidence for a risk assessment rather than a "
        "guarantee -- along with covering only the version evaluated, and "
        "saying nothing about how the buyer deploys it. Configuration matters "
        "to security and does not affect the certificate's validity."),

    mcq("AVERAGE",
        "What does certification of an organisation to a security management "
        "standard establish?",
        [("That it has a working process for assessing and treating "
          "risk", True),
         ("That its systems have been examined and found adequately "
          "protected", False),
         ("That its products meet a stated assurance level", False),
         ("That it has implemented every control listed in the "
          "standard", False)],
        "Management system certification examines the PROCESS -- whether "
        "risks are identified, decisions made by people with authority, "
        "controls implemented and the whole thing reviewed. It makes no claim "
        "about any specific system being well protected, and the standard "
        "does not require every possible control, since which controls apply "
        "follows from the organisation's own risk assessment."),

    mcq("HARD",
        "Why is EAL4 generally the highest level pursued for commercial "
        "software?",
        [("Higher levels require formal methods whose cost rises faster than "
          "the assurance gained", True),
         ("Levels above EAL4 are restricted to systems handling classified "
          "government information", False),
         ("Commercial products cannot satisfy the design documentation "
          "requirements above EAL4", False),
         ("Evaluation bodies are not accredited to assess commercial software "
          "above EAL4", False)],
        "Levels above 4 demand semi-formal and then formal specification and "
        "verification, and the effort escalates sharply while the additional "
        "confidence does not. It is an economic boundary rather than a "
        "regulatory or technical one -- higher levels are pursued where "
        "failure would be catastrophic and the cost is therefore justified."),

    mcq("AVERAGE",
        "Why do independent evaluation schemes exist at all?",
        [("Security properties are invisible from outside, so every buyer "
          "would otherwise assess independently", True),
         ("Suppliers cannot legally make security claims about their own "
          "products without one", False),
         ("They are required before a product may be sold in most "
          "jurisdictions", False),
         ("They provide a means of assigning liability when a product "
          "fails", False)],
        "A buyer cannot see a product's security properties, every supplier "
        "claims them, and independent assessment by each buyer would "
        "duplicate enormous effort at wildly varying depth. One evaluation "
        "against a published standard, relied on by many, solves that -- and "
        "it makes a procurement requirement expressible, since 'secure' is "
        "unenforceable in a contract and a stated level is not."),

    mcq("HARD",
        "What does a protection profile specify?",
        [("Security requirements for a class of products rather than one "
          "product", True),
         ("The configuration in which a specific product was "
          "evaluated", False),
         ("The controls an organisation must implement to be "
          "certified", False),
         ("The assurance activities an evaluator performs at each "
          "level", False)],
        "A protection profile states what products of a given kind -- "
        "firewalls, smart cards, database systems -- should provide, so "
        "buyers can require conformance to it rather than reading individual "
        "security targets. A specific product's own claim is its SECURITY "
        "TARGET, and the product and configuration examined is the target of "
        "evaluation."),

    mcq("AVERAGE",
        "Payment card data security requirements are imposed by what "
        "means?",
        [("Contract with the card networks, as a condition of processing "
          "payments", True),
         ("National legislation in the jurisdictions where cards are "
          "issued", False),
         ("An international standards body, as voluntary guidance", False),
         ("Certification schemes operated by national evaluation "
          "bodies", False)],
        "The requirements are contractual, imposed by the card networks on "
        "anyone processing card payments -- which makes compliance a "
        "condition of doing business rather than a legal obligation or a "
        "voluntary demonstration of quality. That distinction matters "
        "because the consequence of failing is losing the ability to take "
        "payments rather than a legal penalty."),

    mcq("HARD",
        "A certified product is deployed with default credentials and "
        "permissive settings.\n\nWhat does the certification establish about "
        "this deployment?",
        [("Nothing -- certification does not assess how a product is "
          "configured in use", True),
         ("That the deployment meets the assurance level, since the product "
          "does", False),
         ("That the risks arising are the supplier's responsibility rather "
          "than the operator's", False),
         ("That the configuration falls within the evaluated target of "
          "evaluation", False)],
        "Evaluation examines a product in a defined configuration and says "
        "nothing about how a buyer subsequently deploys it. A certified "
        "product configured carelessly is insecure, and the certificate "
        "remains perfectly valid -- which is one of the specific limits that "
        "make certification an input to a risk assessment rather than a "
        "substitute for one."),
]

LESSON_SEC_EVAL = lesson(
    MAJOR, MIDDLE,
    "Security Technology Evaluation and Certification Schemes",
    _eval_quiz,
    lesson_structure(
        "Security Technology Evaluation and Certification Schemes",
        "A supplier's claim that a product is secure is one a buyer cannot "
        "verify, and evaluation schemes exist to close that structural gap "
        "rather than to police honesty. This lesson covers the Common "
        "Criteria vocabulary the examination uses precisely -- target of "
        "evaluation, protection profile, security target and assurance level "
        "-- and the misreading it builds items around: an assurance level "
        "measures how rigorously a CLAIM was checked, not how secure a "
        "product is. It then separates product certification from management "
        "system certification, since both are called certification and "
        "neither substitutes for the other, and closes with the specific "
        "limits that make a certificate evidence rather than a guarantee.",
        [
            "Explain why independent evaluation schemes exist",
            "Define target of evaluation, protection profile and security "
            "target",
            "Explain what an evaluation assurance level does and does not "
            "measure",
            "Explain why EAL4 is the commercial ceiling",
            "Distinguish product certification from management system "
            "certification",
            "Distinguish ISO 27001 from ISO 27002",
            "State the limits of what a certificate establishes",
            "Use certification correctly as an input to a risk assessment",
        ],
        70,
        _eval_sections,
        [
            ("Target of evaluation",
             "The specific product, version and configuration that was "
             "examined."),
            ("Protection profile",
             "Security requirements for a CLASS of product, which buyers can "
             "require conformance to."),
            ("Security target",
             "What this product claims to do, written by the developer. What "
             "the evaluation checks against."),
            ("Evaluation assurance level",
             "How rigorously the claim was examined, from 1 to 7. Not a "
             "measure of the product's strength."),
            ("EAL4",
             "The practical ceiling commercially, because higher levels need "
             "formal methods whose cost outruns the assurance."),
            ("ISO 27001",
             "Certifiable requirements for a security management system, "
             "applied to an organisation."),
            ("ISO 27002",
             "A catalogue of controls and guidance. Not certifiable."),
            ("Management system certification",
             "Establishes a working risk process, not that any particular "
             "system is well protected."),
            ("Certificate limits",
             "Covers the version and configuration evaluated, at the time "
             "evaluated, bounded by the security target."),
            ("Payment card requirements",
             "Imposed contractually by the card networks as a condition of "
             "processing payments, not by law."),
        ],
        "Evaluation schemes exist because security properties are invisible "
        "from outside a product, every supplier claims them, and independent "
        "assessment by each buyer would duplicate enormous effort at varying "
        "depth -- one evaluation against a published standard solves that and "
        "makes a procurement requirement expressible. The Common Criteria "
        "vocabulary is examined precisely: the TARGET OF EVALUATION is the "
        "exact product and configuration, a PROTECTION PROFILE states "
        "requirements for a class of product, and the SECURITY TARGET is what "
        "this product claims, written by its developer. The assurance level "
        "then measures how rigorously that CLAIM was checked -- which is the "
        "lesson's central point, since an EAL2 product whose target matches a "
        "buyer's requirement may protect them far better than an EAL5 product "
        "whose target does not. EAL4 is the commercial ceiling for economic "
        "rather than technical reasons. Organisations certify processes "
        "instead of products, and ISO 27001 certification establishes a "
        "working risk process rather than any claim about a particular system "
        "-- with 27002 being guidance nothing is certified against. And every "
        "certificate has the same limits: it covers the version and "
        "configuration evaluated, at the moment it was evaluated, bounded by "
        "the target, and says nothing about deployment -- which makes it one "
        "input to a risk assessment rather than a substitute for one.",
        exam_notes=[
            desc(
                "Items here nearly always turn on the difference between what "
                "was certified and how rigorously."
            ),
            ul([
                "Explaining what an assurance level measures.",
                "Identifying the security target or protection profile.",
                "Distinguishing ISO 27001 from 27002.",
                "Stating what organisational certification establishes.",
                "Identifying a limit of a certificate.",
                "Explaining why EAL4 is the commercial ceiling.",
                "Explaining why the schemes exist at all.",
            ]),
            desc(
                "Before comparing two certifications, establish WHAT each one "
                "certified. A claim thoroughly verified is not made relevant "
                "by the thoroughness, and every distractor in this lesson "
                "invites treating the level as though it described the "
                "product."
            ),
        ],
    ))

LESSONS = [LESSON_SEC_ISMS, LESSON_SEC_EVAL]

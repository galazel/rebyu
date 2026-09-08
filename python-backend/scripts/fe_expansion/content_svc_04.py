"""Service Management -> System Audit, lesson 2.

Internal control and IT governance.

The lesson is built around the control environment, since that is the layer
determining whether every other control is operating or merely documented --
which is what audit tests and what the examination asks about.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Service Management"
MIDDLE = "System Audit"

_sections = [
    ("Why Organisations Need Controls", [
        desc(
            "An organisation delegates authority to many people, and internal "
            "control is how it obtains reasonable assurance that what they do "
            "is what was intended."
        ),
        image(fig("internal-control")),
        table(
            ["Control provides assurance about", "Against"],
            [["Effective and efficient operations",
              "Waste, and work that achieves nothing"],
             ["Reliable reporting",
              "Decisions taken on figures that were wrong"],
             ["Compliance with law and policy",
              "Penalties, and obligations nobody met"],
             ["Safeguarding of assets",
              "Loss, theft and unauthorised use"]],
            caption="Four objectives internal control serves.",
            footer="Control provides REASONABLE rather than absolute "
                   "assurance. Absolute assurance would cost more than the "
                   "losses it prevents, and every control system is therefore "
                   "a deliberate judgement about how much is enough."),
        desc(
            "That last point is the one the examination presses. Somebody "
            "asking why a control did not prevent an incident may be "
            "describing a control failure or a deliberate decision that the "
            "control was not worth its cost -- and the two require entirely "
            "different responses."
        ),
    ]),

    ("The Components of Internal Control", [
        desc(
            "Control is layered, and the syllabus names five components whose "
            "order matters."
        ),
        ol([
            "CONTROL ENVIRONMENT: the tone, the values, and whether rules are "
            "actually enforced.",
            "RISK ASSESSMENT: what could go wrong, and how much it would "
            "matter.",
            "CONTROL ACTIVITIES: the specific measures -- authorisation, "
            "segregation, reconciliation, access control.",
            "INFORMATION AND COMMUNICATION: who knows what, and when.",
            "MONITORING: whether any of it still works.",
        ]),
        desc(
            "The CONTROL ENVIRONMENT comes first because it determines "
            "whether the rest are real. Controls that senior people routinely "
            "bypass are documented rather than operating, and an organisation "
            "where that is normal has weak control however complete its "
            "procedures look."
        ),
        desc(
            "MONITORING comes last and is the component most often absent. "
            "Controls decay -- people leave, systems change, workarounds "
            "accumulate -- and nothing announces that a control has stopped "
            "working, so a system nobody checks drifts silently into being "
            "documentation."
        ),
    ]),

    ("Control Activities", [
        desc(
            "The specific measures fall into recognisable kinds, and each "
            "addresses a different way things go wrong."
        ),
        table(
            ["Activity", "Prevents"],
            [["Authorisation", "Actions taken by people not entitled to "
                               "take them"],
             ["Segregation of duties",
              "One person completing a sensitive activity alone"],
             ["Reconciliation", "Errors persisting undetected"],
             ["Physical and logical access control",
              "Reaching what should not be reached"],
             ["Documentation and record-keeping",
              "Activity that cannot be reconstructed afterwards"],
             ["Review and supervision", "Errors and omissions accumulating"]],
            caption="Six kinds of control activity.",
            footer="SEGREGATION OF DUTIES is the one with the widest reach, "
                   "because it addresses both error and dishonesty with the "
                   "same measure -- a second person involved catches mistakes "
                   "as well as deterring deliberate acts."),
        desc(
            "The classic segregation is separating AUTHORISING a transaction "
            "from EXECUTING it and from RECORDING it. Where one person does "
            "all three, nothing in the process itself would reveal a problem "
            "-- which is why the finding concerns a possibility rather than "
            "an event."
        ),
    ]),

    ("Preventive, Detective and Corrective", [
        desc(
            "Controls are also classified by when they act, which is the same "
            "framing the Security category uses."
        ),
        compare_grid(
            "THREE TIMINGS",
            "Before, during, and after.",
            [("Preventive",
              ["Stops the thing happening",
               "Authorisation, access control, training",
               "Cheapest when it works",
               "Reports nothing when it fails"]),
             ("Detective and corrective",
              ["Notices it happened, and puts it right",
               "Reconciliation, review, exception reports, backups",
               "Necessary because preventive controls fail",
               "The only way anybody learns a preventive control failed"])]),
        desc(
            "A programme of purely preventive controls cannot tell when one "
            "has stopped working, which is why detective controls are not "
            "optional. The reconciliation that finds nothing for months is "
            "still doing its job -- it is establishing that the preventive "
            "controls are holding."
        ),
    ]),

    ("Compensating Controls", [
        desc(
            "Sometimes the ideal control is impossible, and something else "
            "must reduce the risk instead."
        ),
        ul([
            "A small organisation may be unable to segregate duties, because "
            "there are not enough people.",
            "The response is a COMPENSATING control -- typically review by "
            "somebody outside the process, such as an owner or a manager.",
            "It must address the same risk, rather than being an unrelated "
            "control that feels reassuring.",
            "It should be documented as compensating, so nobody later removes "
            "it as redundant.",
            "The residual risk is usually higher than proper segregation "
            "would leave, which is accepted deliberately.",
        ]),
        desc(
            "The fourth point matters more than it appears. A compensating "
            "control whose purpose nobody recorded looks like an unnecessary "
            "extra step to whoever next reviews the process for efficiency, "
            "and removing it reinstates the original exposure invisibly."
        ),
    ]),

    ("IT Governance", [
        desc(
            "Governance is about who decides, and whether those decisions "
            "serve the organisation rather than any part of it."
        ),
        table(
            ["Governance decides", "Rather than"],
            [["Whether an investment should be made",
              "How to implement it"],
             ["What risk the organisation will accept",
              "Which controls to install"],
             ["How performance will be judged",
              "Whether a particular figure is good"],
             ["Who has authority over what",
              "Whether a particular decision was right"]],
            caption="Governance against management, in four pairs.",
            footer="The right-hand column is MANAGEMENT. Governance sets "
                   "direction and holds management accountable for pursuing "
                   "it -- and an organisation where the same people do both "
                   "has nobody holding anybody accountable."),
        desc(
            "The distinction is examined because the words are used "
            "interchangeably in ordinary speech. Governance DIRECTS and "
            "MONITORS; management PLANS and EXECUTES -- and separating them "
            "is what makes accountability meaningful rather than "
            "self-assessed."
        ),
    ]),

    ("What IT Governance Covers", [
        desc(
            "The syllabus names the areas boards are answerable for, and each "
            "is a decision nobody below them can make."
        ),
        content_accordion(
            "FIVE GOVERNANCE AREAS",
            "Each is a direction-setting responsibility.",
            [("Strategic alignment",
              "Whether the technology investment serves the business "
              "strategy, rather than being technically excellent and "
              "commercially irrelevant."),
             ("Value delivery",
              "Whether the benefits promised were actually obtained -- which "
              "is measurable only after the project has gone, and therefore "
              "asked only if somebody was assigned to ask."),
             ("Risk management",
              "How much risk the organisation is willing to carry, which is a "
              "board decision expressed as an appetite."),
             ("Resource management",
              "Whether people, funding and infrastructure are being applied "
              "where they produce most."),
             ("Performance measurement",
              "What the organisation measures, since that determines what it "
              "manages.")]),
        desc(
            "VALUE DELIVERY is the area most consistently neglected. The "
            "benefits justifying an investment are realised long after the "
            "project ends, and unless a named person and a date exist, "
            "nobody ever establishes whether the investment achieved what it "
            "was funded for."
        ),
    ]),

    ("Compliance", [
        desc(
            "Some requirements are imposed rather than chosen, and the "
            "syllabus separates them from risk-based decisions."
        ),
        table(
            ["Source", "If not met"],
            [["Law and regulation",
              "Penalties, and personal liability in some regimes"],
             ["Contractual obligation", "Breach, and loss of the business"],
             ["Industry scheme", "Exclusion from the activity"],
             ["Internal policy", "Whatever the organisation enforces"]],
            caption="Four sources of obligation.",
            footer="An imposed requirement is NOT open to the acceptance "
                   "treatment. A risk assessment concluding a control costs "
                   "more than the risk does not authorise breaking a law, "
                   "which is why compliance is tracked separately from "
                   "risk."),
        desc(
            "Compliance and control also overlap without being the same. A "
            "compliant organisation has met a checklist written for a general "
            "case; a well-controlled one has addressed its own risks -- and "
            "being compliant while poorly controlled is entirely possible."
        ),
    ]),

    ("Governance Structures", [
        desc(
            "Governance is exercised through defined bodies, since a "
            "responsibility everybody shares is one nobody discharges."
        ),
        ul([
            "A BOARD or its committee holds ultimate accountability and "
            "cannot delegate it, whatever it delegates operationally.",
            "A STEERING or investment committee decides which initiatives "
            "proceed and reviews whether they should continue.",
            "An AUDIT committee receives audit findings independently of the "
            "management being audited.",
            "A RISK function maintains the view of what the organisation is "
            "exposed to.",
            "Each needs the authority to act on what it learns, or it is a "
            "reporting forum rather than a governing one.",
        ]),
        desc(
            "The last point recurs throughout the certification. A body that "
            "receives information and cannot act on it is consuming time "
            "rather than governing -- and the test is whether stopping "
            "something is genuinely available to it."
        ),
    ]),

    ("Control Over Outsourced Activity", [
        desc(
            "Work performed by a supplier still needs controlling, and the "
            "organisation remains accountable for it."
        ),
        ul([
            "The controls must be specified in the CONTRACT, since the "
            "organisation cannot direct the supplier's staff.",
            "The right to audit, or to receive independent assurance, must be "
            "agreed before it is needed.",
            "An independent assurance report from the supplier's own auditor "
            "is the usual mechanism at scale.",
            "The organisation must still operate its own controls over what "
            "it receives, since the supplier's controls address the "
            "supplier's risks.",
            "Accountability does not transfer, whatever the contract says "
            "about liability.",
        ]),
        desc(
            "The fourth point is the one organisations get wrong. A "
            "supplier's controls protect the supplier's process; whether what "
            "arrives is complete, accurate and timely for the receiving "
            "organisation is that organisation's own control to operate."
        ),
    ]),

    ("Control in Automated Systems", [
        desc(
            "Controls implemented in software behave differently from manual "
            "ones, in ways that cut both ways."
        ),
        compare_grid(
            "AUTOMATED AGAINST MANUAL CONTROLS",
            "Consistency against judgement.",
            [("Automated",
              ["Applied identically every time",
               "Cannot be forgotten or skipped when busy",
               "Fails silently and completely if wrongly configured",
               "Only as good as the logic somebody specified"]),
             ("Manual",
              ["Judgement can catch what no rule anticipated",
               "Skipped under pressure, and applied inconsistently",
               "Failure is usually partial rather than total",
               "Depends on training and attention"])]),
        desc(
            "The third entry in the left column is why automated controls are "
            "tested rather than assumed. A manual control performed badly "
            "still catches some cases; an automated one configured wrongly "
            "catches none, consistently, and reports that it ran."
        ),
    ]),

    ("Reporting on Control", [
        desc(
            "Somebody outside the organisation frequently needs to know "
            "whether its controls work, and the arrangements are standardised."
        ),
        table(
            ["Report says", "Which means"],
            [["The controls are suitably DESIGNED",
              "They would address the risks if they operated"],
             ["The controls OPERATED effectively over a period",
              "They were tested, repeatedly, across time"],
             ["Exceptions were identified",
              "Instances found where a control did not operate"],
             ["The report covers stated controls only",
              "Anything outside its scope was not examined"]],
            caption="Four things such a report actually asserts.",
            footer="DESIGN and OPERATION are separate assertions, and a "
                   "report covering design alone says the controls would work "
                   "if performed -- which is a considerably weaker statement "
                   "than most readers assume it to be."),
        desc(
            "The last row is what recipients skip. A report's scope is chosen "
            "by whoever commissioned it, and the areas outside it were not "
            "examined -- so an assurance report about the wrong controls is "
            "reassuring and irrelevant."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where control and governance items are lost."),
        ul([
            "Treating documented controls as operating controls. The control "
            "environment determines which they are.",
            "Expecting absolute rather than reasonable assurance, so a "
            "deliberate cost decision is read as a failure.",
            "Omitting monitoring, so control decay goes unnoticed.",
            "Relying only on preventive controls, which report nothing when "
            "they fail.",
            "Introducing a compensating control without recording why, so it "
            "is later removed as redundant.",
            "Confusing governance with management. Directing and monitoring "
            "against planning and executing.",
            "Treating a compliance obligation as a risk that could be "
            "accepted.",
            "Assuming compliance implies good control.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An organisation has comprehensive documented controls, and an "
            "audit finds that senior managers routinely bypass them without "
            "consequence. How should the control system be assessed?\""
        ),
        ol([
            "Note what exists: control activities, documented and apparently "
            "complete.",
            "Note what is happening: they are bypassed, and bypassing carries "
            "no consequence.",
            "A control that can be bypassed without consequence is not "
            "operating, whatever the documentation says.",
            "The deficiency is in the CONTROL ENVIRONMENT -- the component "
            "determining whether the others are real.",
            "So the finding is not about any individual control but about the "
            "layer beneath all of them, and remediating individual controls "
            "would change nothing.",
        ]),
        desc(
            "The item works because everything documented is correct. A "
            "control system can be complete on paper and absent in practice, "
            "and the environment is what decides which -- which is why it is "
            "listed first among the components."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Control and governance run through the certification."),
        ul([
            "Segregation of duties is the Security category's control of the "
            "same name.",
            "The preventive, detective and corrective classification is that "
            "category's timing framework.",
            "Audit tests whether these controls operate, from the previous "
            "lesson.",
            "Risk appetite set by governance bounds the risk decisions of "
            "Project Management.",
            "Value delivery is the benefits realisation of System Strategy.",
            "Compliance obligations are developed in the Legal Affairs "
            "lessons.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Which control component comes first",
              "The control environment",
              "It determines whether all the others are operating or merely "
              "documented."),
             ("What control provides",
              "REASONABLE assurance, not absolute",
              "So a control that was not installed may be a decision rather "
              "than a failure."),
             ("What only detective controls provide",
              "Knowledge that a preventive control failed",
              "A reconciliation finding nothing is still doing its job."),
             ("The classic segregation",
              "Authorising, executing and recording, held separately",
              "One person doing all three means nothing in the process "
              "reveals a problem."),
             ("Governance against management",
              "Directs and monitors, against plans and executes",
              "The same people doing both means nobody holds anybody "
              "accountable."),
             ("Why compliance is tracked separately from risk",
              "An imposed requirement cannot be accepted as a risk",
              "A cost-benefit conclusion does not authorise breaking a "
              "law.")]),
    ]),
]

_quiz = [
    mcq("HARD",
        "An organisation's controls are comprehensively documented, and "
        "senior managers routinely bypass them without consequence.\n\n"
        "How should the control system be assessed?",
        [("Deficient in the control environment, which determines whether the "
          "others operate", True),
         ("Adequate, since the documented controls address the identified "
          "risks", False),
         ("Deficient in its control activities, which should be strengthened "
          "individually", False),
         ("Deficient in monitoring, since the bypassing was not "
          "detected", False)],
        "A control that can be bypassed without consequence is not operating "
        "however completely it is documented, and the component determining "
        "whether controls are real is the control ENVIRONMENT -- tone, "
        "values, and whether rules are enforced. Remediating individual "
        "controls changes nothing while the layer beneath them permits their "
        "bypass."),

    mcq("AVERAGE",
        "What level of assurance does internal control provide?",
        [("Reasonable assurance, since absolute assurance would cost more "
          "than it saves", True),
         ("Absolute assurance, provided every control operates as "
          "designed", False),
         ("Assurance proportionate to the organisation's "
          "size", False),
         ("Assurance about compliance, but not about operations", False)],
        "Absolute assurance would require controls costing more than the "
        "losses they prevent, so every control system embodies a deliberate "
        "judgement about how much is enough. That matters when something goes "
        "wrong: the absence of a control may be a failure or may be a "
        "decision somebody took knowingly, and the two need different "
        "responses."),

    mcq("HARD",
        "Which internal control component is most often absent, and what "
        "follows?",
        [("Monitoring -- controls decay and nothing announces it", True),
         ("Risk assessment -- controls are installed without a "
          "reason", False),
         ("Control activities -- the specific measures are never "
          "defined", False),
         ("Information and communication -- staff do not know their "
          "responsibilities", False),
         ],
        "People leave, systems change and workarounds accumulate, so a "
        "control that worked stops working without any signal. A control "
        "system nobody checks drifts silently into being documentation, which "
        "is why monitoring is a component in its own right rather than an "
        "administrative afterthought."),

    mcq("AVERAGE",
        "What is the classic segregation of duties in a transaction "
        "process?",
        [("Authorising, executing and recording are performed by different "
          "people", True),
         ("Technical and business staff approve changes "
          "separately", False),
         ("Requesting and approving access are performed by different "
          "people", False),
         ("Development and operations responsibilities are held by different "
          "teams", False)],
        "Where one person authorises a transaction, carries it out and "
        "records it, nothing in the process itself would reveal an error or a "
        "deliberate act. Separating the three means a second person is "
        "necessarily involved -- which is why segregation addresses mistakes "
        "and dishonesty with the same measure."),

    mcq("HARD",
        "A small organisation cannot segregate duties because it has too few "
        "people.\n\nWhat should it do?",
        [("Introduce a compensating control addressing the same risk, and "
          "record why", True),
         ("Accept the risk, since segregation is impossible in small "
          "organisations", False),
         ("Rotate the responsibilities among staff at "
          "intervals", False),
         ("Document the exception and continue without further "
          "measures", False)],
        "A compensating control -- typically review by somebody outside the "
        "process, such as an owner -- reduces the same risk by other means. "
        "Recording its PURPOSE matters, because an undocumented compensating "
        "control looks like an unnecessary step to whoever next reviews the "
        "process for efficiency, and removing it reinstates the exposure "
        "invisibly."),

    mcq("AVERAGE",
        "What distinguishes governance from management?",
        [("Governance directs and monitors; management plans and "
          "executes", True),
         ("Governance concerns strategy and management concerns "
          "operations", False),
         ("Governance is performed by external parties and management "
          "internally", False),
         ("Governance addresses risk and management addresses "
          "delivery", False)],
        "Governance sets direction and holds management accountable for "
        "pursuing it; management plans and carries out the work. The "
        "separation is what makes accountability meaningful rather than "
        "self-assessed -- an organisation where the same people do both has "
        "nobody holding anybody to account, however diligent they are."),

    mcq("HARD",
        "Why can a compliance obligation not be handled by accepting the "
        "risk?",
        [("An imposed requirement is not open to a cost-benefit "
          "decision", True),
         ("Compliance risks always have higher impact than other "
          "risks", False),
         ("Regulators do not permit risk assessments of statutory "
          "obligations", False),
         ("Acceptance requires an authority the organisation does not "
          "hold", False)],
        "Risk acceptance is a judgement that a control costs more than the "
        "exposure it removes, and that reasoning does not extend to "
        "obligations imposed by law, contract or an industry scheme. This is "
        "why compliance is tracked separately from risk: the two are managed "
        "by different logic and confusing them produces indefensible "
        "decisions."),

    mcq("AVERAGE",
        "Which governance area is most consistently neglected?",
        [("Value delivery -- confirming the promised benefits were "
          "obtained", True),
         ("Strategic alignment between investment and business "
          "strategy", False),
         ("Risk management and the organisation's stated appetite", False),
         ("Performance measurement of the technology function", False)],
        "Benefits are realised months after a project ends, by which time the "
        "team has dispersed and attention has moved on -- so unless a named "
        "person and a date exist, nobody ever establishes whether the "
        "investment achieved what justified it. It is the question a "
        "governing body exists to ask and the one it most reliably does not."),

    mcq("HARD",
        "Why are detective controls necessary alongside preventive ones?",
        [("A preventive control reports nothing when it fails", True),
         ("Preventive controls cannot address every identified "
          "risk", False),
         ("Detective controls are cheaper to implement and "
          "operate", False),
         ("Auditors require evidence that controls were exercised", False)],
        "When a preventive control works, nothing happens; when it stops "
        "working, nothing happens either -- and the two are "
        "indistinguishable from outside. Detective controls such as "
        "reconciliation are how anybody learns the difference, which is why a "
        "reconciliation finding nothing for months is still doing its job."),

    mcq("AVERAGE",
        "A governing body receives reports and has no authority to stop an "
        "initiative.\n\nWhat is it?",
        [("A reporting forum rather than a governing body", True),
         ("A steering committee operating within its mandate", False),
         ("An appropriate structure, since stopping is a management "
          "decision", False),
         ("An audit committee, whose role is oversight without "
          "authority", False)],
        "Governance directs and holds to account, and both require the "
        "ability to act on what is learned -- most sharply the ability to "
        "stop something. A body that can only receive information consumes "
        "time and changes nothing, which is the same point the project "
        "category makes about stage gates nobody would ever fail."),
]

LESSON_SVC_GOV = lesson(
    MAJOR, MIDDLE,
    "Internal Control and IT Governance",
    _quiz,
    lesson_structure(
        "Internal Control and IT Governance",
        "An organisation delegates authority widely, and internal control is "
        "how it obtains REASONABLE assurance -- not absolute, since that "
        "would cost more than it saves -- that what people do is what was "
        "intended. This lesson is built around the CONTROL ENVIRONMENT, the "
        "component listed first because it determines whether every other "
        "control is operating or merely documented. It covers the control "
        "activities with segregation of duties as the widest-reaching, the "
        "preventive and detective pairing where only the second reveals that "
        "the first failed, compensating controls and why their purpose must "
        "be recorded, and the governance-against-management distinction that "
        "makes accountability something other than self-assessment.",
        [
            "State what internal control provides and why it is reasonable "
            "rather than absolute",
            "Name the five components and explain the environment's primacy",
            "Describe the control activities and the classic segregation",
            "Explain why detective controls are necessary alongside "
            "preventive ones",
            "Apply compensating controls and record their purpose",
            "Distinguish governance from management",
            "Name the governance areas and identify the neglected one",
            "Explain why compliance obligations are not risk decisions",
        ],
        75,
        _sections,
        [
            ("Reasonable assurance",
             "What control provides -- absolute assurance would cost more "
             "than the losses it prevents."),
            ("Control environment",
             "Tone, values and whether rules are enforced. Determines whether "
             "the other components are real."),
            ("Segregation of duties",
             "Authorising, executing and recording held separately, "
             "addressing error and dishonesty together."),
            ("Compensating control",
             "Something addressing the same risk where the ideal control is "
             "impossible. Its purpose must be recorded."),
            ("Detective controls",
             "The only way anybody learns a preventive control has stopped "
             "working."),
            ("Monitoring",
             "The component most often absent. Controls decay and nothing "
             "announces it."),
            ("Governance",
             "Directs and monitors, and holds management accountable. "
             "Management plans and executes."),
            ("Value delivery",
             "Confirming promised benefits were obtained -- the governance "
             "area most consistently neglected."),
            ("Compliance obligation",
             "Imposed rather than chosen, and therefore not open to the risk "
             "acceptance treatment."),
        ],
        "Internal control gives an organisation REASONABLE assurance that "
        "delegated authority is exercised as intended -- reasonable rather "
        "than absolute, since absolute assurance costs more than the losses "
        "it prevents, which means an absent control may be a deliberate "
        "decision rather than a failure. Five components build on one "
        "another, and the CONTROL ENVIRONMENT comes first because it decides "
        "whether the rest operate or merely exist on paper: controls that "
        "senior people bypass without consequence are documentation. "
        "MONITORING comes last and is most often absent, since controls decay "
        "as people leave and systems change and nothing announces it. Among "
        "the activities, SEGREGATION OF DUTIES reaches furthest by "
        "addressing error and dishonesty with one measure -- authorising, "
        "executing and recording held apart -- and where too few people exist "
        "for it, a COMPENSATING control must address the same risk and have "
        "its purpose recorded, or somebody later removes it as a redundant "
        "step. Preventive controls report nothing when they fail, which is "
        "why detective ones are how anybody learns. And GOVERNANCE directs "
        "and monitors while management plans and executes -- a separation "
        "that makes accountability real, and that requires the governing body "
        "to be genuinely able to stop things.",
        exam_notes=[
            desc(
                "Items describe a control system and ask what is actually "
                "deficient about it."
            ),
            ul([
                "Identifying a control environment deficiency behind bypassed "
                "controls.",
                "Stating what assurance control provides.",
                "Applying segregation of duties.",
                "Choosing a compensating control.",
                "Explaining why detective controls are necessary.",
                "Distinguishing governance from management.",
                "Explaining why compliance is not a risk decision.",
            ]),
            desc(
                "When controls exist and fail anyway, look beneath them. The "
                "control environment decides whether documented controls "
                "operate, and a finding there cannot be remediated by "
                "strengthening any individual control -- which is exactly "
                "what the distractors will propose."
            ),
        ],
    ))

LESSONS = [LESSON_SVC_GOV]

"""Business Strategy -> Business Industry, lessons 1 to 3.

Business systems and administrative applications, engineering systems and
production management, and e-business.

These lessons cover where information systems are actually applied, so each
is organised around what the application domain requires rather than around
the technology, which is what the examination asks about.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Business Strategy"
MIDDLE = "Business Industry"

# ==========================================================================
# Lesson 1: Business and administrative systems
# ==========================================================================

_admin_sections = [
    ("Systems That Run an Organisation", [
        desc(
            "Every organisation runs administrative systems whose failure "
            "stops it working, and which nobody notices while they function."
        ),
        image(fig("business-systems")),
        table(
            ["System", "Handles", "If it fails"],
            [["Financial accounting",
              "Recording transactions and producing statements",
              "The organisation cannot report or be audited"],
             ["Payroll", "Paying staff, correctly and on time",
              "The most immediately visible failure available"],
             ["Human resources",
              "Records, recruitment, and employment obligations",
              "Legal exposure, and decisions made without information"],
             ["Purchasing", "Ordering, receiving and paying suppliers",
              "Supply stops, or money is spent without control"],
             ["Sales and billing", "Recording sales and collecting money",
              "Revenue is not collected, whatever was sold"]],
            caption="Five administrative systems and what their failure "
                    "produces.",
            footer="PAYROLL is the one with no tolerance for error. A "
                   "one-day delay affects everybody personally and "
                   "immediately, which is why it receives operational "
                   "attention out of proportion to its complexity."),
    ]),

    ("What Administrative Systems Have in Common", [
        desc(
            "The domain shapes what these systems must do, and the "
            "requirements recur across all of them."
        ),
        ul([
            "ACCURACY matters more than speed, since a wrong figure is worse "
            "than a slow one.",
            "AUDITABILITY is required: who did what, when, and to which "
            "record.",
            "They are governed by law and regulation rather than only by the "
            "organisation's preferences.",
            "They handle personal or financial data, so security "
            "requirements come with them.",
            "Periodic processing -- month end, year end, pay runs -- creates "
            "load peaks nothing else produces.",
        ]),
        desc(
            "The PERIODIC pattern shapes these systems more than anything "
            "else. A system idle for twenty-eight days and saturated for two "
            "must be sized for the two, which is the capacity question the "
            "Service Management category describes in its purest form."
        ),
    ]),

    ("Financial Systems", [
        desc(
            "Accounting systems record what happened financially, and their "
            "requirements come from accounting rules rather than from "
            "software design."
        ),
        table(
            ["Requirement", "Because"],
            [["Every entry balances",
              "Double entry is the accounting model itself"],
             ["Entries are never deleted, only reversed",
              "The record must show what was recorded and corrected"],
             ["Periods close, and closed periods do not change",
              "Reported figures must stay reported"],
             ["Every figure traces to its source transactions",
              "An auditor must be able to follow it"],
             ["Access is segregated",
              "One person should not raise and approve a payment"]],
            caption="Five requirements peculiar to financial systems.",
            footer="The second row surprises people from other domains. "
                   "Correcting an error means recording a REVERSING entry "
                   "rather than editing the original, because the history of "
                   "what was believed matters as much as the current "
                   "figure."),
        desc(
            "These requirements come from outside the organisation, which is "
            "why financial systems are configured rather than designed. An "
            "organisation cannot decide it prefers a different accounting "
            "model, so the software embodies rules nobody involved may "
            "change."
        ),
    ]),

    ("Human Resources and Payroll", [
        desc(
            "Systems handling people carry obligations that other "
            "administrative systems do not."
        ),
        ul([
            "Payroll calculations follow tax and social insurance rules that "
            "change, frequently annually.",
            "Those rules are external, so the system must be updated whether "
            "or not the organisation wants to change anything.",
            "Personal data protection applies fully, including to records of "
            "people who have left.",
            "Retention obligations frequently outlast employment by years.",
            "Errors are personal: somebody paid incorrectly experiences it "
            "immediately and directly.",
        ]),
        desc(
            "The second point is what makes payroll systems distinctive. "
            "Most systems change when the organisation wants something "
            "different; a payroll system changes because a government "
            "changed a rate, on a deadline nobody negotiated."
        ),
    ]),

    ("Office and Workflow Systems", [
        desc(
            "Beyond the transactional systems sit those supporting how "
            "administrative work is performed."
        ),
        compare_grid(
            "DOCUMENT AND WORKFLOW SYSTEMS",
            "Holding things, and moving them.",
            [("Document management",
              ["Storing, finding and versioning documents",
               "Controlling who may see and change each",
               "Retaining and disposing according to policy",
               "The problem is finding, not storing"]),
             ("Workflow",
              ["Routing work through defined steps",
               "Enforcing approvals and their order",
               "Recording who did what and when",
               "The problem is processes that change"])]),
        desc(
            "Workflow's difficulty is the one the process lesson predicts. "
            "Encoding a process in software makes it consistent and makes "
            "every subsequent change a software change -- so a process "
            "expected to evolve is automated more lightly than one that must "
            "not vary."
        ),
    ]),

    ("Reporting and Compliance", [
        desc(
            "Administrative systems exist partly to produce reports the "
            "organisation is obliged to produce."
        ),
        table(
            ["Report", "Required by", "Consequence of error"],
            [["Statutory financial statements", "Company law",
              "Restatement, penalties, and lost confidence"],
             ["Tax returns", "Tax authorities",
              "Penalties and interest"],
             ["Payroll returns", "Tax and social insurance authorities",
              "Penalties, and employees' own positions affected"],
             ["Regulatory returns", "Sector regulators",
              "Sanctions, and sometimes licence conditions"],
             ["Management reports", "The organisation itself",
              "Decisions taken on wrong figures"]],
            caption="Five reporting obligations.",
            footer="The last row has no external penalty and the largest "
                   "cumulative cost. Nobody fines an organisation for "
                   "reporting wrong figures to itself, and every decision "
                   "taken on them is affected."),
        desc(
            "Reporting deadlines are external and unmovable, which is what "
            "produces the period-end pressure -- and why a system unavailable "
            "during a closing period is a considerably more serious incident "
            "than the same outage a fortnight earlier."
        ),
    ]),

    ("Data Quality in Administrative Systems", [
        desc(
            "These systems' output is only as good as what was entered, which "
            "makes input control a design concern rather than a training "
            "one."
        ),
        ul([
            "Validate at entry, since a wrong value costs far more to correct "
            "after it has propagated.",
            "Use references rather than free text wherever a defined set of "
            "values exists.",
            "Reconcile between systems regularly, since divergence is silent "
            "until somebody compares.",
            "Prefer entering something once and sharing it over entering it "
            "in several systems.",
            "Record who entered and changed what, since correcting an error "
            "requires understanding it.",
        ]),
        desc(
            "The third point catches a specific failure. Two systems holding "
            "the same fact drift apart through ordinary use, and nothing "
            "signals it -- so the divergence is discovered when somebody "
            "produces two reports that disagree, by which time neither can be "
            "trusted."
        ),
    ]),

    ("Integrating Administrative Systems", [
        desc(
            "Administrative systems exchange information constantly, and how "
            "they do it determines how much manual work surrounds them."
        ),
        compare_grid(
            "INTEGRATED AGAINST SEPARATE SYSTEMS",
            "One record, or several reconciled.",
            [("Integrated",
              ["A transaction entered once appears everywhere",
               "No reconciliation between functions",
               "Requires agreement on definitions",
               "One system's problems affect everybody"]),
             ("Separate, with interfaces",
              ["Each function chooses what suits it",
               "Reconciliation is continuous work",
               "Definitions can differ, and will",
               "A failure is contained to one function"])]),
        desc(
            "The reconciliation in the second column is the hidden cost. "
            "People comparing figures between systems and correcting the "
            "differences are performing work that integration removes "
            "entirely -- and it rarely appears in any comparison of the two "
            "approaches."
        ),
    ]),

    ("Retention and Disposal", [
        desc(
            "Administrative records are kept for periods set outside the "
            "organisation, and disposing of them is an obligation rather than "
            "an option."
        ),
        ol([
            "Establish what must be retained and for how long, which differs "
            "by record type and by jurisdiction.",
            "Ensure retained records remain READABLE for the whole period, "
            "which outlasts most systems.",
            "Dispose of what is beyond its period, since retaining data "
            "unnecessarily is exposure without benefit.",
            "Dispose properly, since deletion leaves the contents "
            "recoverable.",
            "Record what was disposed of and when, since the disposal itself "
            "may need to be demonstrated.",
        ]),
        desc(
            "The second step is the one that catches organisations. A "
            "seven-year retention obligation outlasts most systems, so the "
            "records must be migrated to something that will still be running "
            "-- and discovering that at the end of a system's life is far too "
            "late."
        ),
    ]),

    ("Batch and Online Processing", [
        desc(
            "Administrative work divides between what happens as it arrives "
            "and what accumulates for periodic processing."
        ),
        compare_grid(
            "ONLINE AGAINST BATCH",
            "As it happens, or all at once.",
            [("Online",
              ["Processed as each transaction arrives",
               "The result is available immediately",
               "Load follows the working day",
               "A failure affects whoever is working now"]),
             ("Batch",
              ["Accumulated and processed together",
               "Efficient, since overheads are shared across many items",
               "Runs when nobody needs the system",
               "A failure affects an entire run, and the window may "
               "close"])]),
        desc(
            "The last entry on the right is what makes batch failures "
            "serious. A run that must complete before the working day and "
            "fails halfway has a fixed window to be diagnosed, corrected and "
            "restarted -- which is why restartability is designed in rather "
            "than assumed."
        ),
    ]),

    ("Access Control in Administrative Systems", [
        desc(
            "These systems hold money and personal data, which makes who may "
            "do what a design concern rather than an afterthought."
        ),
        ul([
            "Roles reflect what people's jobs require, not what would be "
            "convenient.",
            "Segregation is enforced by the system where the process "
            "requires it, since relying on people to abstain does not "
            "work.",
            "Approval limits are held in the system, so an approval beyond "
            "somebody's authority is impossible rather than discouraged.",
            "Access is reviewed periodically, since roles change and "
            "permissions accumulate.",
            "Everything is logged, since detecting misuse depends on the "
            "record existing.",
        ]),
        desc(
            "The third point is worth noting as a design principle. A limit "
            "enforced by the system cannot be exceeded; one stated in a "
            "policy can be, and the difference appears precisely when "
            "somebody is under pressure to exceed it."
        ),
    ]),

    ("Replacing an Administrative System", [
        desc(
            "These systems are replaced eventually, and their characteristics "
            "make the replacement unusually constrained."
        ),
        ol([
            "The timing is constrained: a financial system changes at a "
            "period boundary rather than when it suits the project.",
            "Historical data must remain accessible, since retention "
            "obligations outlast the system.",
            "Parallel running is common here and expensive, since it means "
            "processing everything twice.",
            "The rules the old system encoded must be understood before they "
            "can be reproduced -- and they are frequently documented nowhere "
            "else.",
            "Reconciliation between old and new is how correctness is "
            "demonstrated rather than asserted.",
        ]),
        desc(
            "The fourth point is what makes these replacements slow. Years of "
            "accumulated rules -- exceptions, local practices, corrections "
            "for situations nobody remembers -- exist only in the software, "
            "and discovering them is archaeology rather than analysis."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where administrative system items are lost."),
        ul([
            "Prioritising speed over accuracy, when a wrong figure is worse "
            "than a slow one.",
            "Permitting deletion in a financial system, where corrections are "
            "reversing entries.",
            "Sizing capacity for the average rather than for the period-end "
            "peak.",
            "Treating regulatory changes as optional, when the deadline is "
            "external.",
            "Omitting segregation of duties in systems handling money.",
            "Encoding a volatile process rigidly in workflow.",
            "Forgetting that personal data obligations continue after people "
            "leave.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A financial system permits users to correct an incorrect "
            "entry by editing it. An auditor objects. Why?\""
        ),
        ol([
            "Establish what an audit trail must show: what was recorded, when, "
            "and what was subsequently done about it.",
            "An edited entry leaves no evidence that anything was ever "
            "different.",
            "So an error and a deliberate alteration become "
            "indistinguishable, and both are invisible.",
            "The accounting model requires corrections to be REVERSING "
            "entries: the original stands, and a further entry cancels it.",
            "That preserves the history of what was believed at each point, "
            "which is what makes the record auditable at all.",
        ]),
        desc(
            "The general point applies beyond finance. Where a record must be "
            "evidence, it is appended to rather than edited -- because a "
            "record that can be changed is evidence only of what somebody was "
            "willing to leave in it."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Administrative systems apply many earlier lessons."),
        ul([
            "Segregation of duties is the internal control lesson.",
            "Audit trails are what System Audit examines.",
            "Personal data obligations come from Legal Affairs.",
            "Period-end peaks are the capacity planning of Service "
            "Management.",
            "Workflow rigidity is the process automation warning of System "
            "Strategy.",
            "These systems are the transaction sources feeding business "
            "intelligence.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What administrative systems prioritise",
              "Accuracy over speed",
              "A wrong figure is worse than a slow one, which reverses the "
              "usual emphasis."),
             ("How a financial error is corrected",
              "A reversing entry, not an edit",
              "The history of what was believed matters as much as the "
              "current figure."),
             ("What shapes administrative system capacity",
              "Periodic peaks -- month end, year end, pay runs",
              "A system idle for twenty-eight days and saturated for two is "
              "sized for the two."),
             ("What makes payroll distinctive",
              "It changes because a government changed a rule",
              "On a deadline nobody negotiated, whether or not the "
              "organisation wanted anything."),
             ("Why financial systems are configured rather than designed",
              "The rules come from outside the organisation",
              "Nobody involved may decide they prefer a different accounting "
              "model."),
             ("Workflow's characteristic difficulty",
              "Encoding a process makes changing it a software change",
              "So volatile processes are automated lightly.")]),
    ]),
]

_admin_quiz = [
    mcq("HARD",
        "A financial system lets users correct an entry by editing it, and an "
        "auditor objects.\n\nWhy?",
        [("An edited entry leaves no evidence anything was different, so "
          "error and alteration are indistinguishable", True),
         ("Edits cannot be attributed to the user who made "
          "them", False),
         ("Editing risks unbalancing the double entry", False),
         ("Corrections must be approved by a second person before being "
          "applied", False)],
        "An audit trail must show what was recorded and what was "
        "subsequently done about it, and editing destroys the first half. "
        "Corrections are made by REVERSING entries: the original stands and a "
        "further entry cancels it, preserving the history of what was "
        "believed at each point. Attribution and approval matter and are "
        "separate concerns."),

    mcq("AVERAGE",
        "Administrative systems prioritise something most other systems "
        "do not.\n\nWhat?",
        [("Accuracy over speed", True),
         ("Availability over correctness", False),
         ("Flexibility over consistency", False),
         ("Usability over auditability", False)],
        "A wrong figure in a financial or payroll system is worse than a slow "
        "one, which reverses the emphasis most systems apply. It follows from "
        "the domain: these systems produce records that are reported, "
        "audited and relied on, so being right matters more than being "
        "quick."),

    mcq("HARD",
        "What shapes capacity planning for administrative systems more than "
        "anything else?",
        [("Periodic peaks at month end, year end and pay runs", True),
         ("Steady growth in transaction volume over time", False),
         ("The number of concurrent users during working hours", False),
         ("The volume of historical data being retained", False)],
        "A system idle for twenty-eight days and saturated for two must be "
        "sized for the two, which makes average utilisation almost "
        "meaningless. It is the capacity argument of Service Management in "
        "its purest form -- users experience the peak, and the peak here is "
        "both predictable and severe."),

    mcq("AVERAGE",
        "Why must a payroll system be updated whether or not the organisation "
        "wants changes?",
        [("Tax and social insurance rules change externally, on external "
          "deadlines", True),
         ("Employees expect improvements to be delivered "
          "regularly", False),
         ("Payroll data volumes grow faster than other administrative "
          "data", False),
         ("Security patches are more urgent for payroll than for other "
          "systems", False)],
        "Most systems change because the organisation wants something "
        "different; payroll changes because a government changed a rate or a "
        "threshold, on a date nobody negotiated. That makes maintenance "
        "non-optional and schedule-driven in a way other administrative "
        "systems are not."),

    mcq("HARD",
        "Why are financial systems configured rather than designed to an "
        "organisation's preferences?",
        [("The accounting rules they embody come from outside the "
          "organisation", True),
         ("Financial software is too complex to develop "
          "internally", False),
         ("Auditors require certified software to be used", False),
         ("Accounting processes are identical across all "
          "organisations", False)],
        "Double entry, period closure, reversing corrections and traceability "
        "are requirements of accounting itself, so an organisation cannot "
        "decide it prefers something else. The software embodies rules nobody "
        "involved may change, which is why the work is configuration within "
        "them rather than design of them."),

    mcq("AVERAGE",
        "What is workflow automation's characteristic difficulty?",
        [("Encoding a process makes every subsequent change a software "
          "change", True),
         ("Workflow systems cannot enforce approval sequences "
          "reliably", False),
         ("Routing rules become slower as the volume of work "
          "grows", False),
         ("Users bypass the workflow when it is inconvenient", False)],
        "Enforcing a process in software guarantees it is followed and "
        "converts every process change into a development project. That makes "
        "it right for processes that must not vary and expensive for those "
        "expected to evolve, which is the trade the process analysis lesson "
        "describes."),

    mcq("AVERAGE",
        "Which administrative system's failure is most immediately visible to "
        "everybody?",
        [("Payroll", True),
         ("Financial accounting", False),
         ("Purchasing", False),
         ("Document management", False)],
        "A payroll failure affects every member of staff personally and on a "
        "date they know, which produces an immediate and universal reaction "
        "no other administrative system generates. That is why payroll "
        "receives operational attention out of proportion to its technical "
        "complexity."),

    mcq("HARD",
        "Personal data obligations for a former employee's records "
        "continue.\n\nFor how long?",
        [("For whatever retention period the applicable obligations "
          "specify", True),
         ("Until the employee requests that the records be "
          "deleted", False),
         ("Until the end of the financial year in which they "
          "left", False),
         ("Only while any legal dispute remains outstanding", False)],
        "Employment records are frequently subject to retention requirements "
        "lasting years after employment ends, and the data protection "
        "obligations apply throughout -- so the records must be kept, kept "
        "secure, and disposed of properly at the end. A departure does not "
        "end either the retention duty or the protection duty."),

    mcq("AVERAGE",
        "Why is segregation of duties particularly important in purchasing "
        "systems?",
        [("One person should not be able to raise and approve a payment "
          "alone", True),
         ("Purchasing systems handle larger data volumes than other "
          "systems", False),
         ("Suppliers require evidence of authorisation "
          "procedures", False),
         ("Purchasing processes involve more steps than other "
          "administrative processes", False)],
        "Where one person can both initiate a payment and authorise it, "
        "nothing in the process itself would reveal either an error or a "
        "deliberate act. Separating the two means a second person is "
        "necessarily involved, which addresses mistake and dishonesty with "
        "the same control."),

    mcq("HARD",
        "What is the recurring problem with document management systems?",
        [("Finding documents rather than storing them", True),
         ("Storage capacity for accumulated documents", False),
         ("Converting documents between formats", False),
         ("Controlling which users may create documents", False)],
        "Storing documents is straightforward and finding the right one among "
        "many is not, which is why classification, metadata and search matter "
        "more than capacity. A document nobody can find has been retained "
        "without being available, which achieves the cost of keeping it and "
        "none of the benefit."),
]

LESSON_BIZ_ADMIN = lesson(
    MAJOR, MIDDLE,
    "Business Systems and Administrative Applications",
    _admin_quiz,
    lesson_structure(
        "Business Systems and Administrative Applications",
        "Administrative systems stop an organisation working when they fail "
        "and are invisible while they function, and their domain shapes them: "
        "ACCURACY matters more than speed, auditability is required, external "
        "law governs them, and PERIODIC peaks at month end and pay runs make "
        "average utilisation almost meaningless. This lesson covers the "
        "financial requirements that come from accounting rather than from "
        "software design -- including corrections as reversing entries rather "
        "than edits -- payroll changing because a government changed a rule, "
        "and the workflow trade between consistency and the cost of every "
        "future change.",
        [
            "Name the administrative systems and what each failure produces",
            "State the requirements the administrative domain imposes",
            "Explain why financial systems are configured rather than "
            "designed",
            "Explain corrections as reversing entries",
            "Explain what makes payroll maintenance distinctive",
            "Explain the capacity implication of periodic peaks",
            "Distinguish document management from workflow",
            "Explain workflow's characteristic difficulty",
        ],
        70,
        _admin_sections,
        [
            ("Administrative priority",
             "Accuracy over speed, since a wrong figure is worse than a slow "
             "one."),
            ("Reversing entry",
             "How a financial error is corrected -- the original stands and a "
             "further entry cancels it."),
            ("Period closure",
             "Closed accounting periods do not change, so reported figures "
             "stay reported."),
            ("Periodic peaks",
             "Month end, year end and pay runs, which is what capacity must "
             "be sized for."),
            ("Externally driven maintenance",
             "Payroll changing because tax rules changed, on a deadline "
             "nobody negotiated."),
            ("Document management",
             "Storing, finding, versioning and disposing -- where finding is "
             "the actual problem."),
            ("Workflow",
             "Routing and enforcing steps, which makes every process change a "
             "software change."),
        ],
        "Administrative systems stop an organisation functioning when they "
        "fail and receive attention only then. Their domain imposes "
        "requirements that reverse the usual emphasis: ACCURACY over speed, "
        "auditability throughout, external legal governance, and PERIODIC "
        "load peaks that make average utilisation nearly meaningless -- a "
        "system idle for twenty-eight days and saturated for two is sized for "
        "the two. Financial systems are configured rather than designed, "
        "since double entry, period closure and traceability come from "
        "accounting rather than from any organisation's preference; and their "
        "most distinctive rule is that errors are corrected by REVERSING "
        "entries rather than edits, because the history of what was believed "
        "matters as much as the current figure. Payroll is distinctive in "
        "changing because a government changed a rule, on a date nobody "
        "negotiated, and in being the failure everybody experiences "
        "personally. Document management's real problem is finding rather "
        "than storing, and workflow's is that encoding a process makes it "
        "consistent while making every future change a software change -- so "
        "volatile processes are automated lightly and invariant ones firmly.",
        exam_notes=[
            desc(
                "Items describe an administrative system requirement and ask "
                "why it exists."
            ),
            ul([
                "Explaining why editing a financial entry is unacceptable.",
                "Stating what administrative systems prioritise.",
                "Explaining period-end capacity implications.",
                "Explaining externally driven payroll maintenance.",
                "Explaining why financial systems are configured.",
                "Identifying workflow's difficulty.",
                "Identifying document management's real problem.",
            ]),
            desc(
                "For any administrative system item, ask where the "
                "requirement comes from. Most come from outside the "
                "organisation -- accounting rules, tax law, data protection "
                "-- which is why they are non-negotiable and why the systems "
                "are configured within them rather than designed."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Engineering and production systems
# ==========================================================================

_prod_sections = [
    ("Systems That Make Things", [
        desc(
            "Manufacturing and engineering apply information systems to "
            "physical production, where the constraints are different from "
            "any office application."
        ),
        table(
            ["System", "Supports"],
            [["CAD -- computer aided design",
              "Designing the product itself"],
             ["CAM -- computer aided manufacturing",
              "Driving the machinery that makes it"],
             ["CAE -- computer aided engineering",
              "Analysing and simulating before anything is built"],
             ["MRP and production planning",
              "Deciding what to make, when, and what materials it needs"],
             ["Process control", "Running the equipment in real time"]],
            caption="Five system families in engineering and production.",
            footer="The integration between them is where the value is. A "
                   "design in CAD driving CAM directly removes the "
                   "transcription that was a whole class of error, which is "
                   "the argument for CAD/CAM integration."),
    ]),

    ("Planning Production", [
        desc(
            "Deciding what to make and what to order is the calculation these "
            "systems perform, and it works backwards from demand."
        ),
        ol([
            "Start from the demand: orders received and forecast.",
            "Explode it through the BILL OF MATERIALS -- what each product "
            "consists of, at every level.",
            "Subtract what is already in stock or on order.",
            "Offset by the LEAD TIME for each item, since ordering late is "
            "the same as not ordering.",
            "Produce the schedule: what to make and what to order, and "
            "when.",
        ]),
        desc(
            "MATERIAL REQUIREMENTS PLANNING is that calculation. Its "
            "correctness depends entirely on the bill of materials, the stock "
            "figures and the lead times being right -- and an error in any of "
            "them propagates through the whole schedule."
        ),
        desc(
            "MANUFACTURING RESOURCE PLANNING extends it to capacity, people "
            "and money, so the plan is achievable rather than merely "
            "arithmetically correct. A material plan requiring more machine "
            "hours than exist is not a plan."
        ),
    ]),

    ("Approaches to Production", [
        desc(
            "How production relates to demand is a strategic choice with "
            "consequences throughout."
        ),
        image(fig("production-systems")),
        table(
            ["", "Make to stock", "Make to order"],
            [["Sequence", "Produce, then sell", "Sell, then produce"],
             ["Customer waits", "No", "Yes"],
             ["Inventory risk", "Carried, and may not sell", "None"],
             ["Suits", "Predictable demand, standard products",
              "Variety, and unpredictable demand"]],
            caption="Two approaches, trading availability against inventory "
                    "risk.",
            footer="Many organisations do both, holding components to stock "
                   "and assembling to order -- which gives short lead times "
                   "on variety without carrying finished goods that may not "
                   "sell."),
        desc(
            "JUST IN TIME removes the inventory that was absorbing "
            "variability throughout, which requires the variability to have "
            "been removed first. Applied to an unstable process, it converts "
            "a hidden problem into a visible stoppage -- which is a feature "
            "when improvement is intended and a disaster when it is not."
        ),
    ]),

    ("Quality in Production", [
        desc(
            "Production quality has techniques of its own, and the syllabus "
            "expects the statistical ones."
        ),
        ul([
            "Every process varies, so the question is whether variation is "
            "normal or signals something changed.",
            "CONTROL CHARTS distinguish the two by plotting measurements "
            "against limits derived from the process itself.",
            "Reacting to normal variation as though it signalled a problem "
            "produces interference that makes things worse.",
            "SAMPLING inspects a portion, sized by the consequence of a "
            "defect escaping.",
            "Building quality in beats inspecting it, exactly as in software "
            "-- inspection finds defects and does not prevent them.",
        ]),
        desc(
            "The third point is a specific and expensive error. An operator "
            "adjusting a machine in response to ordinary fluctuation moves it "
            "away from where it was correctly set, which increases variation "
            "rather than reducing it."
        ),
    ]),

    ("Automation and Control", [
        desc(
            "Systems controlling physical equipment operate under constraints "
            "office systems do not."
        ),
        compare_grid(
            "CONTROL SYSTEMS AGAINST BUSINESS SYSTEMS",
            "Physical consequences change the requirements.",
            [("Control systems",
              ["Must respond within a bounded time, always",
               "A failure can damage equipment or injure people",
               "Run continuously, with maintenance windows negotiated",
               "Change is risky, so systems run for decades"]),
             ("Business systems",
              ["Slower response is inconvenient",
               "A failure is disruptive rather than dangerous",
               "Downtime is scheduled more freely",
               "Change is expected and frequent"])]),
        desc(
            "The last row explains a recurring situation. Control systems "
            "remain in service far longer than business systems, so an "
            "industrial site frequently runs equipment whose control software "
            "predates every security practice in this certification -- which "
            "is the problem the industrial devices lesson addresses."
        ),
    ]),

    ("Product Data Through the Life Cycle", [
        desc(
            "A product's definition is created in design and used everywhere "
            "afterwards, which makes managing it a distinct concern."
        ),
        table(
            ["Used by", "For"],
            [["Engineering", "The design itself, and its revisions"],
             ["Production planning",
              "What each product consists of, at every level"],
             ["Purchasing", "What must be bought, and to what "
                            "specification"],
             ["Manufacturing", "How it is made, and to what tolerances"],
             ["Service", "What the customer has, and what parts fit it"]],
            caption="Five consumers of the same product data.",
            footer="The last row is what makes revision control matter for "
                   "decades. A part supplied to a customer eight years ago "
                   "was built to a revision that must still be identifiable "
                   "when they need a replacement."),
        desc(
            "PRODUCT LIFECYCLE MANAGEMENT is the discipline of keeping that "
            "definition consistent across every function and every revision. "
            "Its difficulty is the same as ERP's: the functions must agree "
            "what a product IS before any system can hold one answer."
        ),
    ]),

    ("Measuring Production", [
        desc(
            "Production is measured continuously, and which measures are "
            "chosen determines what gets optimised."
        ),
        ul([
            "Throughput -- how much is actually produced in a period.",
            "Utilisation -- how much of the available capacity is used, which "
            "can be improved by producing things nobody wants.",
            "Yield -- what proportion is right first time, which exposes "
            "rework.",
            "Cycle time -- how long a unit takes end to end, most of which is "
            "usually waiting.",
            "Cost per unit, which depends on volume and therefore misleads "
            "when volume changes.",
        ]),
        desc(
            "UTILISATION is the measure that produces the worst behaviour. "
            "Keeping every machine busy looks efficient and produces "
            "inventory nobody ordered, which is why throughput against actual "
            "demand matters more than how busy anything is."
        ),
    ]),

    ("Maintenance of Production Equipment", [
        desc(
            "Equipment fails, and how maintenance is arranged decides whether "
            "that is an event or a crisis."
        ),
        compare_grid(
            "REACTIVE AGAINST PLANNED MAINTENANCE",
            "Fixing what broke, or preventing it.",
            [("Reactive",
              ["Repair after failure",
               "No cost until something breaks",
               "Failure occurs at the worst time, by definition",
               "Consequential damage and unplanned stoppage"]),
             ("Planned and predictive",
              ["Service on a schedule, or on measured condition",
               "Continuous cost, and scheduled downtime",
               "Failures prevented rather than repaired",
               "Requires knowing what condition to measure"])]),
        desc(
            "PREDICTIVE maintenance -- acting on measured condition rather "
            "than on a calendar -- is where instrumented equipment has "
            "changed practice, since servicing on a schedule replaces parts "
            "that were fine and misses ones that were not."
        ),
    ]),

    ("Safety in Production Systems", [
        desc(
            "Systems controlling machinery can injure people, which imposes "
            "requirements no business system carries."
        ),
        ul([
            "Safety functions are separated from control functions, so a "
            "control failure does not disable the safety system.",
            "Safety systems FAIL SAFE, bringing equipment to a safe state "
            "rather than an undefined one.",
            "Physical safeguards operate independently of software, since "
            "software can fail.",
            "Changes are assessed for safety consequences before anything "
            "else, and by somebody qualified to.",
            "The obligations are legal, so they are not subject to a "
            "cost-benefit judgement by the organisation.",
        ]),
        desc(
            "The first point is the design principle. A safety system that "
            "depends on the control system working has no independence, and "
            "the failure it exists to protect against is exactly the "
            "circumstance in which it would be needed."
        ),
    ]),

    ("Traceability in Production", [
        desc(
            "Knowing what went into each unit produced is required in some "
            "industries and useful in all of them."
        ),
        table(
            ["Recorded", "Enables"],
            [["Which batch of each material was used",
              "Recalling only affected units when a material is faulty"],
             ["Which machine and settings produced it",
              "Locating a process problem rather than guessing"],
             ["Who performed each operation",
              "Identifying a training or procedure gap"],
             ["When it was made", "Correlating with anything else that "
                                  "changed"],
             ["Which revision of the design",
              "Knowing what the unit actually is, years later"]],
            caption="Five traceability records and what each enables.",
            footer="The first row is what makes a recall proportionate. "
                   "Without batch traceability, a fault in one material "
                   "batch means recalling everything produced in a period, "
                   "which may be orders of magnitude more units."),
        desc(
            "In regulated industries this is a legal requirement rather than "
            "a convenience, and the records must be retained for periods "
            "measured in years -- which brings the retention and readability "
            "obligations of the administrative lesson with it."
        ),
    ]),

    ("Simulation and Digital Models", [
        desc(
            "Analysing a design or a process before building it is what "
            "engineering computing chiefly makes possible."
        ),
        ul([
            "Structural and thermal analysis establishes whether a design "
            "works before anything is manufactured.",
            "Process simulation establishes how a production line would "
            "behave before it is built or rearranged.",
            "Both replace experiments that would be slow, expensive or "
            "impossible.",
            "A model is only as good as its assumptions, which are chosen by "
            "somebody.",
            "A confident wrong answer from a model is more dangerous than no "
            "answer, since it is believed.",
        ]),
        desc(
            "The last point is the caution the syllabus attaches. "
            "Simulation output arrives with the appearance of precision "
            "whatever the quality of its inputs, so validating a model "
            "against reality where that is possible is what makes its "
            "unvalidated predictions worth anything."
        ),
    ]),

    ("Production Systems and the Wider Organisation", [
        desc(
            "Production does not operate alone, and its systems connect to "
            "everything the organisation does commercially."
        ),
        table(
            ["Connects to", "For"],
            [["Sales and order management",
              "What has been promised, and by when"],
             ["Purchasing", "What must be bought to make it"],
             ["Finance", "What it cost, and what stock is worth"],
             ["Distribution", "Where finished output must go"],
             ["Service", "What was supplied, to whom, in which "
                         "configuration"]],
            caption="Five connections a production system requires.",
            footer="The first row is the one whose failure customers feel. A "
                   "promise made by sales without visibility of what "
                   "production can actually do is a promise the organisation "
                   "will break, and the customer experiences it as a single "
                   "organisation failing."),
        desc(
            "This integration is what ERP exists to provide, and it is why "
            "manufacturing organisations were among the earliest to adopt "
            "it -- the coordination between these functions is the whole "
            "problem rather than a refinement of it."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where production system items are lost."),
        ul([
            "Expecting a material plan to be achievable when capacity was not "
            "considered.",
            "Trusting a requirements calculation whose bill of materials or "
            "stock figures are wrong.",
            "Adopting just-in-time before removing the variability inventory "
            "was absorbing.",
            "Adjusting a process in response to normal variation, which "
            "increases it.",
            "Relying on inspection to produce quality rather than to detect "
            "defects.",
            "Applying business system change practices to control systems.",
            "Transcribing designs between systems where integration would "
            "remove the error class.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A manufacturer adopts just-in-time and suffers frequent "
            "stoppages that did not occur before. What happened?\""
        ),
        ol([
            "Establish what just-in-time removes: the inventory held between "
            "steps.",
            "Establish what that inventory was doing: absorbing variability "
            "-- late deliveries, machine failures, quality problems.",
            "The variability did not disappear; only what was hiding it "
            "did.",
            "So every disruption that was previously absorbed now stops "
            "production immediately.",
            "The stoppages are therefore evidence of problems that already "
            "existed, and just-in-time requires them to be removed FIRST "
            "rather than revealing them afterwards.",
        ]),
        desc(
            "The item rewards understanding what inventory was for. It looks "
            "like waste and is partly insurance, so removing it without "
            "removing what it insured against converts a hidden cost into a "
            "visible failure."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Production systems connect to several categories."),
        ul([
            "MRP is the calculation ERP systems perform, from the business "
            "systems lesson.",
            "Just-in-time depends on the supply chain coordination of that "
            "lesson.",
            "Control charts are the quality technique of Project "
            "Management.",
            "Real-time constraints come from the Computer System category.",
            "Long-lived control systems raise the security concerns of the "
            "industrial devices lesson.",
            "Building quality in rather than inspecting is the development "
            "category's argument.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What MRP calculates from",
              "Demand, exploded through the bill of materials, less stock, "
              "offset by lead time",
              "And its correctness depends entirely on those inputs being "
              "right."),
             ("What MRP does not consider",
              "Capacity",
              "Which is what manufacturing resource planning adds -- a plan "
              "needing more hours than exist is not a plan."),
             ("What just-in-time requires first",
              "The variability inventory was absorbing to have been removed",
              "Otherwise it converts a hidden problem into a visible "
              "stoppage."),
             ("What a control chart distinguishes",
              "Normal variation from a genuine change",
              "Reacting to the first produces interference that increases "
              "variation."),
             ("Make to stock against make to order",
              "Produce then sell, against sell then produce",
              "Availability against inventory risk, and many organisations do "
              "both."),
             ("Why control systems run for decades",
              "Change is risky where failure can injure",
              "Which is why industrial sites run software predating every "
              "modern security practice.")]),
    ]),
]

_prod_quiz = [
    mcq("HARD",
        "A manufacturer adopts just-in-time and suffers frequent stoppages "
        "that did not previously occur.\n\nWhat happened?",
        [("Inventory was absorbing variability that has not been "
          "removed", True),
         ("Suppliers cannot deliver reliably enough to support the "
          "approach at all", False),
         ("The production schedule was calculated "
          "incorrectly", False),
         ("Demand became less predictable after the change", False)],
        "Inventory between steps absorbs late deliveries, machine failures "
        "and quality problems, so removing it exposes every disruption "
        "immediately. The variability did not appear -- only what was hiding "
        "it disappeared. Just-in-time requires that variability to be removed "
        "FIRST, which is why it is an outcome of improvement rather than a "
        "route to it."),

    mcq("AVERAGE",
        "Material requirements planning derives its schedule from "
        "specific inputs.\n\nWhich?",
        [("Demand exploded through the bill of materials, less stock, offset "
          "by lead times", True),
         ("The machine capacity that is available in each of the "
          "planning periods", False),
         ("Historical consumption of each component", False),
         ("Supplier delivery performance over recent periods", False)],
        "The calculation works backwards from what is wanted, through what "
        "each product consists of at every level, subtracting what already "
        "exists and shifting each order earlier by its lead time. Its "
        "correctness therefore depends entirely on the bill of materials, the "
        "stock figures and the lead times -- an error in any one propagates "
        "through the whole schedule."),

    mcq("HARD",
        "What does manufacturing resource planning add to material "
        "requirements planning?",
        [("Capacity, people and money, so the plan is achievable", True),
         ("Forecasting of demand rather than reliance on "
          "orders", False),
         ("Integration with the organisation's financial "
          "systems", False),
         ("Tracking of work in progress through the production "
          "process", False)],
        "A material plan can be arithmetically correct and impossible -- "
        "requiring more machine hours or more people than exist. Extending "
        "the calculation to those constraints produces a plan that can "
        "actually be executed, which is the difference between knowing what "
        "is needed and knowing what can be done."),

    mcq("AVERAGE",
        "An operator adjusts a machine in response to ordinary "
        "fluctuation.\n\nWhat is the effect?",
        [("Variation increases, since the machine was correctly "
          "set", True),
         ("Variation decreases, since the adjustment corrects the "
          "drift", False),
         ("Nothing measurable, since the adjustment is within "
          "tolerance", False),
         ("Output quality improves at the cost of throughput", False)],
        "Every process varies, and adjusting in response to normal variation "
        "moves the machine away from where it was correctly set -- so the "
        "next measurement is further out and prompts another adjustment. "
        "Distinguishing normal variation from a genuine change is exactly "
        "what a control chart exists to do."),

    mcq("HARD",
        "Why do industrial control systems remain in service far longer than "
        "business systems?",
        [("Change is risky where a failure can damage equipment or injure "
          "people", True),
         ("Control system hardware is considerably more durable than "
          "business computing equipment", False),
         ("Suppliers of control systems support them for longer "
          "periods", False),
         ("Control systems perform simpler functions requiring fewer "
          "updates", False)],
        "A failure in a control system has physical consequences, so changing "
        "one carries a risk business systems do not, and organisations "
        "reasonably avoid it. The result is industrial sites running control "
        "software predating every modern security practice -- which is a "
        "consequence of a sound safety judgement rather than of neglect."),

    mcq("AVERAGE",
        "What does integrating CAD with CAM remove?",
        [("The transcription of a design between systems, and its "
          "errors", True),
         ("The need for engineering analysis to be performed before "
          "production", False),
         ("Inventory held between design and manufacture", False),
         ("The requirement for quality inspection of output", False)],
        "A design re-entered into a manufacturing system by hand introduces a "
        "whole class of error that direct integration eliminates entirely. "
        "That is the argument for CAD/CAM integration and it is the same "
        "reasoning that makes any manual transcription between systems worth "
        "removing."),

    mcq("AVERAGE",
        "Which production approach carries no finished inventory risk?",
        [("Make to order", True),
         ("Make to stock", False),
         ("Batch production against a forecast", False),
         ("Continuous production", False)],
        "Producing only after a sale means nothing is made that has not been "
        "bought, so nothing unsold accumulates. The cost is that the customer "
        "waits, which is why many organisations hold components to stock and "
        "assemble to order -- short lead times on variety without finished "
        "goods that may not sell."),

    mcq("HARD",
        "Why does inspection not produce quality in production?",
        [("It detects defects that already exist rather than preventing "
          "them", True),
         ("Sampling means that most of the defects present escape "
          "detection", False),
         ("Inspection occurs too late in the process to be "
          "corrected", False),
         ("Inspectors cannot assess every quality "
          "characteristic", False)],
        "Inspecting a defective product more thoroughly produces a "
        "better-understood defective product, and the defect was created "
        "earlier by the process. Quality is built in by controlling that "
        "process -- which is the same argument the development category makes "
        "about testing not producing software quality."),

    mcq("AVERAGE",
        "What determines how large a production sample should be?",
        [("The consequence of a defect escaping detection", True),
         ("The total volume of units being produced", False),
         ("The time available for inspection", False),
         ("The historical defect rate of the process", False)],
        "Where an escaped defect would be catastrophic, complete inspection "
        "is justified whatever it costs; where the consequence is minor, a "
        "small sample gives most of the assurance for a fraction of the "
        "effort. Volume and defect rate inform the calculation and the "
        "consequence is what settles how much assurance is needed."),

    mcq("HARD",
        "A material requirements calculation produces a schedule that cannot "
        "be met.\n\nWhat is the most likely cause?",
        [("Wrong inputs -- the bill of materials, stock figures or lead "
          "times", True),
         ("The calculation method being fundamentally unsuitable for "
          "this kind of product", False),
         ("Demand exceeding what the market will actually "
          "buy", False),
         ("The planning period being too short for the lead "
          "times", False)],
        "The calculation is arithmetic and is only as good as what it "
        "consumes: a bill of materials missing a component, a stock figure "
        "that does not match what is physically there, or an optimistic lead "
        "time each propagates through the whole schedule. Data accuracy is "
        "what makes these systems work rather than the calculation itself."),
]

LESSON_BIZ_PROD = lesson(
    MAJOR, MIDDLE,
    "Engineering Systems and Production Management",
    _prod_quiz,
    lesson_structure(
        "Engineering Systems and Production Management",
        "Applying information systems to physical production introduces "
        "constraints no office application has. This lesson covers the design "
        "and manufacturing system families and the integration that removes a "
        "whole class of transcription error, the material requirements "
        "calculation whose correctness depends entirely on its inputs, the "
        "production approaches trading availability against inventory risk -- "
        "with JUST IN TIME requiring the variability inventory was absorbing "
        "to have been removed FIRST -- and control systems whose physical "
        "consequences make change risky enough that they run for decades.",
        [
            "Name the engineering and production system families",
            "Explain what CAD/CAM integration removes",
            "Describe the material requirements calculation and its "
            "dependencies",
            "Explain what manufacturing resource planning adds",
            "Compare make to stock with make to order",
            "Explain what just-in-time requires before adoption",
            "Explain control charts and the cost of over-adjustment",
            "Explain why control systems remain in service for decades",
        ],
        70,
        _prod_sections,
        [
            ("CAD, CAM and CAE",
             "Designing, driving the machinery, and analysing before "
             "building. Integration removes transcription."),
            ("Bill of materials",
             "What each product consists of at every level -- the structure "
             "the requirements calculation explodes."),
            ("Material requirements planning",
             "Demand through the bill of materials, less stock, offset by "
             "lead times. Only as good as its inputs."),
            ("Manufacturing resource planning",
             "Adds capacity, people and money, so the plan is achievable "
             "rather than merely correct."),
            ("Make to stock and make to order",
             "Produce then sell, or sell then produce -- availability against "
             "inventory risk."),
            ("Just in time",
             "Removes the inventory absorbing variability, so the variability "
             "must be removed first."),
            ("Control chart",
             "Distinguishes normal variation from a genuine change, "
             "preventing adjustment that increases variation."),
            ("Control system longevity",
             "Change is risky where failure has physical consequences, so "
             "systems run for decades."),
        ],
        "Applying systems to physical production brings constraints office "
        "applications do not have. CAD, CAM and CAE support design, "
        "manufacture and analysis, and integrating them removes the "
        "transcription that was a whole class of error. MATERIAL "
        "REQUIREMENTS PLANNING calculates what to make and order by exploding "
        "demand through the bill of materials, subtracting stock and "
        "offsetting lead times -- and it is only as good as those inputs, "
        "since an error in any propagates through the schedule. Manufacturing "
        "resource planning extends it to CAPACITY, people and money, since a "
        "plan needing more hours than exist is not a plan. Production is made "
        "to stock or to order, trading availability against inventory risk, "
        "and JUST IN TIME removes the inventory absorbing variability "
        "throughout -- which requires that variability to have been removed "
        "first, or a hidden problem becomes a visible stoppage. Quality uses "
        "CONTROL CHARTS to separate normal variation from a genuine change, "
        "since adjusting in response to ordinary fluctuation moves a "
        "correctly-set machine and increases variation. And control systems "
        "run for decades because change is risky where failure has physical "
        "consequences -- which is why industrial sites run software older "
        "than every security practice in this certification.",
        exam_notes=[
            desc(
                "Items describe a production problem and ask what its cause "
                "was."
            ),
            ul([
                "Diagnosing just-in-time stoppages as unremoved variability.",
                "Stating what MRP calculates from.",
                "Stating what MRP II adds.",
                "Explaining the effect of over-adjusting a process.",
                "Explaining what CAD/CAM integration removes.",
                "Explaining why control systems are long-lived.",
                "Sizing an inspection sample.",
            ]),
            desc(
                "When a production change made things worse, ask what the "
                "removed element was doing. Inventory looks like waste and is "
                "partly insurance, and removing insurance without removing "
                "the risk it covered is the shape of most of these items."
            ),
        ],
    ))

LESSONS = [LESSON_BIZ_ADMIN, LESSON_BIZ_PROD]

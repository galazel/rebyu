"""Corporate and Legal Affairs -> Legal Affairs, lessons 3 and 4.

Laws on labour and commercial transactions, and other laws, guidelines and
engineer ethics.

The labour lesson matters to engineers chiefly because of how IT work is
actually staffed -- contractors, dispatch, outsourcing -- and because the
label on an arrangement does not determine what the law calls it.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Corporate and Legal Affairs"
MIDDLE = "Legal Affairs"


# ==========================================================================
# Lesson 1: Laws on labour and commercial transactions
# ==========================================================================

_lab_sections = [
    ("How IT Work Is Actually Staffed", [
        desc(
            "Software is built by mixtures of employees, contractors, "
            "dispatched staff and outsourced suppliers, and each arrangement "
            "carries different obligations. The syllabus tests whether an "
            "engineer can tell which is which, because the label the parties "
            "used does not decide it."
        ),
        image(fig("employment-contract-forms")),
        table(
            ["Arrangement", "Who directs the work", "Who carries the "
             "obligations"],
            [["Employment", "The employer, day to day",
              "The employer, under employment law"],
             ["Contract for services", "Nobody -- the supplier decides how",
              "Commercial terms only"],
             ["Worker dispatch", "The client, day to day",
              "The dispatching company, mostly"],
             ["Outsourcing of a function", "The supplier",
              "The supplier, for a defined result"],
             ["Secondment", "The host organisation",
              "Shared, and defined by agreement"]],
            caption="Five staffing arrangements and where direction sits.",
            footer="DIRECTION is the test the law actually applies. Where a "
                   "client directs somebody's daily work, an arrangement "
                   "labelled outsourcing is treated as dispatch or "
                   "employment, whatever the contract calls it."),
    ]),

    ("The Employment Relationship", [
        desc(
            "Employment attaches a body of protections that commercial "
            "contracts do not."
        ),
        ul([
            "Terms must generally be stated in writing, within a defined "
            "period.",
            "Working hours are limited, and overtime is regulated and "
            "usually paid at a premium.",
            "Leave, rest periods and public holidays are entitlements rather "
            "than concessions.",
            "Dismissal requires a valid reason and a fair procedure.",
            "None of these can be signed away by agreement, since they are "
            "protections rather than default terms.",
        ]),
        desc(
            "The last point is what makes misclassification serious. A "
            "protection that cannot be waived is not waived by calling "
            "somebody a contractor, so an organisation that got the "
            "classification wrong owes everything it did not provide."
        ),
    ]),

    ("Employee or Contractor", [
        desc(
            "The distinction is decided by the substance of the "
            "relationship, and the tests are consistent across "
            "jurisdictions even where the details differ."
        ),
        ol([
            "Who controls how the work is done, as opposed to what result is "
            "required.",
            "Whether the person must perform it personally or may send a "
            "substitute.",
            "Who provides the equipment and bears the cost of doing the "
            "work.",
            "Whether the person carries financial risk -- can they profit or "
            "lose on the engagement.",
            "How integrated they are into the organisation: a desk, a team, "
            "a manager, a schedule.",
        ]),
        desc(
            "No single factor decides it, and control is the heaviest. "
            "Somebody told when to arrive, what to work on and how to do it "
            "is being employed, and the invoice they submit does not alter "
            "the analysis."
        ),
    ]),

    ("Worker Dispatch", [
        desc(
            "Dispatch is a three-party arrangement common in IT and "
            "regulated specifically because of its structure."
        ),
        compare_grid(
            "DISPATCH AGAINST OUTSOURCING",
            "Two arrangements that look alike on an invoice.",
            [("Worker dispatch",
              ["The client directs the daily work",
               "The dispatcher employs the person",
               "Regulated, frequently with time limits",
               "Health and safety duties fall on the client too"]),
             ("Outsourcing",
              ["The supplier directs its own people",
               "The supplier is responsible for the result",
               "A commercial contract, less regulated",
               "The client specifies the outcome, not the method"])]),
        desc(
            "The mistake organisations make is contracting for outsourcing "
            "and then directing the supplier's staff daily. That is DISGUISED "
            "DISPATCH, and it is treated as dispatch with all the "
            "obligations that carries, whatever the contract says."
        ),
    ]),

    ("Working Time and Overtime", [
        desc(
            "IT work has a poor record here, and the obligations are not "
            "discretionary."
        ),
        ul([
            "Statutory limits on weekly hours apply, with defined "
            "exceptions.",
            "Overtime is generally paid at a premium rate, and the rate is "
            "set by law rather than by the employer.",
            "Rest periods between shifts and weekly rest days are "
            "requirements.",
            "Records of hours worked must generally be kept by the "
            "employer.",
            "Agreements to work beyond the limits are void where the limits "
            "are protective.",
        ]),
        desc(
            "Release crunches are where this is breached routinely. Hours "
            "worked to meet a date are hours worked, and the obligation to "
            "record and pay for them is unaffected by anybody's willingness "
            "to do them."
        ),
    ]),

    ("Health, Safety and Welfare", [
        desc(
            "Obligations to protect people at work extend to office and "
            "software environments, not only to industrial ones."
        ),
        ul([
            "The employer must assess risks and act on what the assessment "
            "finds.",
            "Display screen work carries specific requirements in many "
            "jurisdictions.",
            "Mental health and excessive workload are increasingly treated "
            "as workplace risks.",
            "Where staff are dispatched, the client carries duties for the "
            "environment they control.",
            "Remote workers remain covered, which surprises organisations "
            "that assumed otherwise.",
        ]),
        desc(
            "The fourth point matters in mixed teams. An organisation "
            "directing dispatched staff cannot treat their safety as "
            "somebody else's responsibility, because the duty attaches to "
            "whoever controls the workplace."
        ),
    ]),

    ("Discrimination and Harassment", [
        desc(
            "Protection against unfair treatment applies throughout the "
            "employment relationship, including before it starts."
        ),
        ul([
            "Protected characteristics vary by jurisdiction and always "
            "include several.",
            "Direct discrimination is treating somebody worse because of "
            "one.",
            "Indirect discrimination is a neutral rule that disadvantages a "
            "group without justification.",
            "Harassment is conduct creating a hostile environment, judged on "
            "effect rather than intention.",
            "Employers are generally liable for what their staff do to each "
            "other unless they took reasonable steps to prevent it.",
        ]),
        desc(
            "Indirect discrimination is the one that reaches system design. "
            "A recruitment tool trained on past hiring reproduces past "
            "patterns, and a neutral-looking rule that disadvantages a "
            "protected group is unlawful unless it can be justified."
        ),
    ]),

    ("Contracts of Sale and Supply", [
        desc(
            "Commercial transaction law governs agreements between "
            "businesses, and the syllabus expects its skeleton."
        ),
        ol([
            "OFFER -- a definite proposal capable of being accepted.",
            "ACCEPTANCE -- agreement to those terms, without variation.",
            "CONSIDERATION or its equivalent -- something given by each "
            "side, in systems that require it.",
            "INTENTION to create legal relations, presumed in commercial "
            "dealings.",
            "CERTAINTY -- terms definite enough to be enforced.",
        ]),
        desc(
            "Acceptance without variation is where system-generated "
            "agreements go wrong. A reply that changes a term is a "
            "counter-offer rather than acceptance, so an exchange of "
            "documents each on its own standard terms may not have formed "
            "the contract anybody assumed."
        ),
    ]),

    ("Contract Terms", [
        desc(
            "The terms of a commercial agreement determine what happens when "
            "something goes wrong, which is their entire purpose."
        ),
        table(
            ["Term", "Governs"],
            [["Scope and specification",
              "What is actually being supplied, which is where most "
              "disputes start"],
             ["Acceptance criteria",
              "How it is decided that the supplier has performed"],
             ["Liability and its limits",
              "What may be recovered, and what is excluded"],
             ["Termination",
              "How the relationship ends, and what happens to the work"],
             ["Governing law and forum",
              "Whose law applies and where a dispute is heard"]],
            caption="Five terms an engineer should read.",
            footer="ACCEPTANCE CRITERIA are the term engineers are competent "
                   "to write and are rarely asked to. A specification with "
                   "no objective test of completion produces a dispute that "
                   "no lawyer can settle from the document."),
    ]),

    ("Contract Forms in IT Procurement", [
        desc(
            "How a development contract allocates risk is the practical "
            "question behind its form."
        ),
        compare_grid(
            "FIXED PRICE AGAINST TIME AND MATERIALS",
            "Who carries the risk of it taking longer.",
            [("Fixed price",
              ["The supplier carries the overrun risk",
               "The scope must be defined precisely first",
               "Changes require variations, and cost",
               "Priced to include the supplier's risk"]),
             ("Time and materials",
              ["The client carries the overrun risk",
               "Scope can evolve as understanding improves",
               "Requires the client to manage actively",
               "Cheaper if it goes well, unbounded if it does not"])]),
        desc(
            "Neither is safer in general. A fixed price on a poorly "
            "understood requirement buys a dispute rather than certainty, "
            "since every clarification becomes a variation and the "
            "relationship becomes an argument about scope."
        ),
    ]),

    ("Liability and Its Limits", [
        desc(
            "What a supplier owes when things go wrong is negotiated, within "
            "limits the law imposes."
        ),
        ul([
            "Direct losses are generally recoverable; consequential losses "
            "are frequently excluded.",
            "Liability is usually capped, often by reference to the contract "
            "value.",
            "Some liabilities cannot be excluded -- death and personal "
            "injury caused by negligence being the standard example.",
            "Exclusions must be reasonable in many systems, and "
            "unreasonable ones are struck out.",
            "Indemnities shift specific risks entirely, and are read "
            "carefully for that reason.",
        ]),
        desc(
            "The first point is where clients are surprised. A supplier "
            "whose defect stopped a business for a week may be liable for a "
            "sum related to the contract's value rather than to the loss, "
            "which is the ordinary commercial position."
        ),
    ]),

    ("Consumer Protection", [
        desc(
            "Where the other party is a consumer rather than a business, "
            "additional protections apply automatically."
        ),
        ul([
            "Information must be given before the contract is made, not "
            "buried afterwards.",
            "Distance contracts carry cancellation rights for a defined "
            "period.",
            "Goods and digital content must be as described and of "
            "satisfactory quality.",
            "Unfair terms in standard consumer contracts are not "
            "enforceable.",
            "These protections cannot be excluded by agreement, which is the "
            "point of them.",
        ]),
        desc(
            "Digital content is now covered explicitly in most regimes. "
            "Software sold to consumers must work as described and continue "
            "to, which converts several quality questions into legal "
            "obligations."
        ),
    ]),

    ("Electronic Contracting", [
        desc(
            "Contracts formed through systems raise questions the paper "
            "process did not."
        ),
        content_accordion(
            "QUESTIONS AN ELECTRONIC CONTRACT RAISES",
            "Each has an established answer worth knowing.",
            [("When is the contract formed",
              "Generally when acceptance is communicated and accessible, "
              "which for automated systems means the confirmation rather "
              "than the order."),
             ("Are the terms incorporated",
              "Only if the other party had a genuine opportunity to read "
              "them before agreeing. Terms reachable only after purchase "
              "are frequently not incorporated."),
             ("Who bears a pricing error",
              "Depends on whether the error was obvious. A price so wrong "
              "that no reasonable buyer could believe it may not bind the "
              "seller."),
             ("What counts as a signature",
              "A range of electronic forms, with assurance increasing from "
              "simple to qualified signatures."),
             ("What record must be kept",
              "Enough to establish what was agreed and when, for the "
              "applicable retention period.")]),
    ]),

    ("Subcontracting", [
        desc(
            "Suppliers subcontract, and the client's position depends on "
            "what the contract said about it."
        ),
        ul([
            "The supplier generally remains responsible to the client for "
            "the whole result.",
            "The client usually has no direct claim against the "
            "subcontractor.",
            "Consent to subcontract may be required, and is frequently "
            "given generally rather than specifically.",
            "Obligations such as confidentiality and data protection must be "
            "passed down, and demonstrably so.",
            "Where a subcontractor holds data, the chain of responsibility "
            "must still reach back to the client.",
        ]),
        desc(
            "The fourth point is a compliance requirement rather than good "
            "practice. Data protection obligations must flow down the whole "
            "chain, and an organisation that cannot show they did remains "
            "answerable for what a subcontractor's subcontractor did."
        ),
    ]),

    ("Dispute Resolution", [
        desc(
            "How a disagreement will be resolved is chosen in advance, and "
            "the choice has consequences."
        ),
        table(
            ["Route", "Characterised by"],
            [["Negotiation",
              "Cheapest and fastest, and preserves the relationship"],
             ["Mediation",
              "A neutral helps the parties agree; non-binding"],
             ["Arbitration",
              "A private decision that binds; limited appeal"],
             ["Litigation",
              "Public, slow, expensive, and fully appealable"],
             ["Expert determination",
              "A specialist decides a technical question, quickly"]],
            caption="Five routes, roughly by cost.",
            footer="ARBITRATION is chosen in international contracts chiefly "
                   "because awards are easier to enforce across borders than "
                   "court judgments, and because the proceedings are "
                   "private."),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc(
            "Labour and commercial law shape how projects are staffed and "
            "how suppliers behave."
        ),
        content_tabs(
            "WHERE THIS APPEARS ELSEWHERE",
            "Each tab is a category constrained by this lesson.",
            [("Project management", "Contract form and risk",
              "Whether a project is fixed price or time and materials "
              "determines who carries the overrun, and therefore how change "
              "control actually behaves."),
             ("Service management", "Supplier management",
              "Service agreements, subcontracting, liability caps and "
              "termination are the terms service management is responsible "
              "for holding suppliers to."),
             ("Corporate activities", "Organisation and direction",
              "Who directs whose daily work is both an organisational and a "
              "legal question, and the second decides which obligations "
              "attach."),
             ("Security", "Flow-down obligations",
              "Confidentiality and data protection duties must reach every "
              "subcontractor, which is a contractual mechanism enforcing a "
              "technical requirement."),
             ("Development technology", "Acceptance criteria",
              "The engineer's contribution to a contract is a definition of "
              "done that can be tested, which is what prevents an "
              "unresolvable dispute.")]),
    ]),

    ("Common Mistakes", [
        desc("Where labour and commercial items are lost."),
        review_cards(
            "MISTAKES THAT COST MARKS HERE",
            "Each is a plausible answer that is wrong.",
            [("Believing the contract's label decides the arrangement",
              "Direction of daily work decides it. Outsourcing with the "
              "client directing staff is disguised dispatch.",
              "Substance over form, always."),
             ("Thinking protections can be waived by agreement",
              "Employment protections exist precisely so they cannot be, so "
              "misclassification produces a retrospective liability.",
              "The agreement does not save the employer."),
             ("Assuming a fixed price removes risk",
              "It transfers overrun risk and creates scope disputes where "
              "the requirement was poorly understood.",
              "Certainty requires a defined scope first."),
             ("Expecting to recover full losses from a supplier",
              "Liability is usually capped by reference to contract value, "
              "and consequential loss commonly excluded.",
              "Read the cap before relying on the remedy."),
             ("Assuming a reply accepting with changes forms the contract",
              "A variation makes it a counter-offer, which is how competing "
              "standard terms fail to agree.",
              "Acceptance must be unqualified.")]),
    ]),

    ("Review", [
        desc("The points items are built on."),
        review_cards(
            "WHAT TO CARRY OUT OF THIS LESSON",
            "Answer each before moving on.",
            [("What test distinguishes employment from a service contract?",
              "Direction and control of how the work is done, with "
              "substitution, equipment, risk and integration supporting.",
              "The invoice proves nothing."),
             ("What is disguised dispatch?",
              "An outsourcing contract under which the client actually "
              "directs the supplier's staff daily.",
              "It carries dispatch obligations regardless."),
             ("Why does misclassification cost so much?",
              "The protections could never be waived, so everything not "
              "provided is owed retrospectively.",
              "Agreement is no defence."),
             ("Who carries overrun risk under each contract form?",
              "The supplier under fixed price, the client under time and "
              "materials.",
              "Neither is safer in general."),
             ("What usually limits recovery from a supplier?",
              "A liability cap tied to contract value, and exclusion of "
              "consequential loss.",
              "Some liabilities cannot be excluded at all."),
             ("What must flow down to subcontractors?",
              "Confidentiality and data protection obligations, "
              "demonstrably.",
              "The chain must reach back to the client.")]),
    ]),
]


_lab_quiz = [
    mcq("HARD",
        "Under a contract labelled outsourcing, the client's manager assigns "
        "daily tasks to the supplier's staff.\n\nHow is the "
        "arrangement treated?",
        [("As dispatch, because the client directs the work", True),
         ("As outsourcing, because that is what the parties agreed in the "
          "contract they both signed", False),
         ("As employment of the staff by the client, since it directs them "
          "in the same way it directs employees", False),
         ("As outsourcing unless the supplier's staff work at the client's "
          "own premises rather than remotely", False)],
        "The law looks at who directs the daily work rather than at the "
        "label the parties used. An arrangement in which the client assigns "
        "tasks is disguised dispatch and carries dispatch obligations, which "
        "is one of the most common compliance failures in how IT work is "
        "staffed."),

    mcq("AVERAGE",
        "Somebody engaged as a contractor is found on the tests to have been "
        "an employee.\n\nWhat is the consequence?",
        [("The protections not provided are owed retrospectively", True),
         ("The arrangement continues as a contract for services until it is "
          "formally converted to employment", False),
         ("The engagement is void, and payments made under it may be "
          "recovered by whichever party overpaid", False),
         ("Nothing follows, provided both parties genuinely intended a "
          "contract for services at the outset", False)],
        "Employment protections exist precisely because they cannot be "
        "waived by agreement, so classifying somebody wrongly does not "
        "remove them -- it defers them. The organisation owes the leave, the "
        "overtime and everything else it did not provide, generally with "
        "penalties, and the parties' intentions do not alter the analysis."),

    mcq("AVERAGE",
        "Which factor weighs most heavily in distinguishing employment from "
        "a contract for services?",
        [("Control over how the work is performed", True),
         ("Whether the person submits invoices rather than receiving pay "
          "through the employer's payroll system", False),
         ("Whether the engagement is for a fixed period or continues "
          "indefinitely until terminated", False),
         ("Whether the person works for other clients during the same "
          "period as the engagement", False)],
        "Control is the heaviest of the several factors, supported by "
        "substitution, who provides equipment, financial risk and "
        "integration into the organisation. Somebody told when to arrive, "
        "what to work on and how to do it is being employed, and the payment "
        "mechanism is a consequence of the classification rather than "
        "evidence of it."),

    mcq("HARD",
        "Two businesses exchange documents, each on its own standard terms, "
        "and begin performing.\n\nWhat is the difficulty?",
        [("A reply varying terms is a counter-offer, not "
          "acceptance", True),
         ("Neither party can rely on any terms at all, since no written "
          "agreement was ever concluded between them", False),
         ("The terms of whichever document was sent first govern, because "
          "it constituted the offer", False),
         ("Both sets of terms apply together, with any conflict resolved in "
          "favour of the buyer", False)],
        "Acceptance must be unqualified, so each document that varies the "
        "previous one is a fresh counter-offer rather than an acceptance. "
        "Which terms govern then depends on what was last sent before "
        "performance began, which is a poor way to discover what a contract "
        "says."),

    mcq("AVERAGE",
        "Fixed price terms are agreed for a requirement that is poorly "
        "understood.\n\nWhat is the likely outcome?",
        [("Repeated variation disputes about scope", True),
         ("The supplier absorbs the additional work, since the price was "
          "agreed as fixed before it started", False),
         ("The contract converts to time and materials once the original "
          "estimate has been exceeded materially", False),
         ("The client obtains cost certainty, which is the purpose of "
          "choosing the fixed price form", False)],
        "A fixed price transfers overrun risk to the supplier and requires a "
        "defined scope to do so. Where the requirement was not understood, "
        "every clarification becomes a variation with a price attached, and "
        "the relationship becomes an argument about what was included rather "
        "than a delivery."),

    mcq("HARD",
        "The contract caps liability at contract value, and a supplier's "
        "defect stops the client's business for a week.\n\nWhat can the "
        "client generally recover?",
        [("An amount limited by the cap, not the loss suffered", True),
         ("The full business loss, because a liability cap cannot exclude "
          "losses caused by the supplier's own defect", False),
         ("The full business loss, because caps apply only to indirect "
          "losses and not to direct ones", False),
         ("Nothing, because business interruption is a consequential loss "
          "and is excluded in every case", False)],
        "Caps tied to contract value and exclusions of consequential loss "
        "are the ordinary commercial position, and they mean recovery bears "
        "little relation to the harm. Some liabilities -- death and personal "
        "injury from negligence being the standard example -- cannot be "
        "excluded, but business interruption is not among them."),

    mcq("AVERAGE",
        "Standard terms are made available only after a purchase is "
        "completed online.\n\nWhat is the position?",
        [("They are frequently not incorporated into the "
          "contract", True),
         ("They are incorporated, because completing the purchase "
          "constitutes agreement to the seller's usual terms", False),
         ("They are incorporated only where the buyer is another business "
          "rather than a consumer", False),
         ("They are incorporated once the buyer has been given a reasonable "
          "opportunity to return the goods", False)],
        "Terms bind only where the other party had a genuine opportunity to "
        "read them before agreeing. Terms first shown afterwards are "
        "generally not incorporated, which is why the acceptance step in a "
        "purchase flow is placed where the terms are actually reachable."),

    mcq("HARD",
        "A recruitment tool trained on past hiring decisions "
        "disproportionately rejects a protected group.\n\nWhat does this "
        "engage?",
        [("Indirect discrimination", True),
         ("Direct discrimination, because the tool treats members of that "
          "group less favourably than others", False),
         ("No discrimination provision, because the tool does not consider "
          "the protected characteristic at all", False),
         ("Data protection obligations only, since the issue arises from "
          "how the training data was processed", False)],
        "A neutral rule that disadvantages a protected group without "
        "objective justification is indirect discrimination, and a model "
        "reproducing past patterns is exactly such a rule. That the "
        "characteristic is not an input makes no difference: the effect is "
        "what the provision addresses."),

    mcq("AVERAGE",
        "Part of the work is subcontracted, and the subcontractor mishandles "
        "personal data.\n\nWhat is the client's position?",
        [("The obligations must have flowed down, and the chain reaches "
          "back", True),
         ("Responsibility rests entirely with the subcontractor, which "
          "handled the data directly and negligently", False),
         ("Responsibility rests entirely with the supplier, since the "
          "client has no relationship with the subcontractor", False),
         ("The client has no exposure, provided it did not consent to the "
          "subcontracting arrangement specifically", False)],
        "Data protection duties must be passed down the whole chain and the "
        "organisation deciding how and why the data is used remains "
        "answerable. Being unable to demonstrate that the obligations flowed "
        "down is itself a failure, which is why consent to subcontract is "
        "normally conditioned on it."),

    mcq("AVERAGE",
        "Arbitration is specified in an international supply "
        "contract.\n\nWhat is the principal reason?",
        [("Awards are easier to enforce across borders", True),
         ("Arbitration is consistently faster and cheaper than litigation "
          "in the courts of either country", False),
         ("Arbitrators are required to have technical expertise in the "
          "subject matter of the dispute", False),
         ("Arbitration decisions may be appealed more readily than "
          "judgments given by a national court", False)],
        "Cross-border enforcement of arbitral awards is well established by "
        "international convention, while enforcing one country's court "
        "judgment in another is considerably harder. Privacy is the "
        "secondary reason; speed and cost advantages are frequently claimed "
        "and not always realised."),
]


LESSON_LAB = lesson(
    MAJOR, MIDDLE,
    "Laws on Labour and Commercial Transactions",
    _lab_quiz,
    lesson_structure(
        "Laws on Labour and Commercial Transactions",
        "IT work is staffed through employment, contracting, DISPATCH and "
        "outsourcing, and the law decides which is which by who DIRECTS the "
        "daily work rather than by what the contract is called -- so "
        "outsourcing with the client assigning tasks is disguised dispatch. "
        "Employment protections cannot be waived, which makes "
        "misclassification a retrospective liability. On the commercial "
        "side: acceptance must be unqualified, FIXED PRICE transfers overrun "
        "risk and requires defined scope, liability is capped by reference "
        "to contract value rather than to loss, and obligations must flow "
        "down to every subcontractor.",
        [
            "Distinguish the staffing arrangements by who directs the work",
            "Apply the employment tests to an engagement",
            "Explain what disguised dispatch is",
            "Explain why misclassification is costly",
            "State the elements of a commercial contract",
            "Compare fixed price with time and materials",
            "Explain how liability limits work",
            "State what must flow down to subcontractors",
        ],
        75,
        _lab_sections,
        [
            ("The direction test",
             "Who controls the daily work decides the arrangement, whatever "
             "the contract is labelled."),
            ("Disguised dispatch",
             "Outsourcing in name, with the client assigning tasks -- treated "
             "as dispatch."),
            ("Unwaivable protections",
             "Employment rights cannot be signed away, so misclassification "
             "is owed retrospectively."),
            ("Acceptance",
             "Must be unqualified; a variation is a counter-offer, which is "
             "how standard terms collide."),
            ("Fixed price",
             "Transfers overrun risk to the supplier and requires a defined "
             "scope to be workable."),
            ("Liability caps",
             "Recovery is limited by the cap and by exclusions, not by the "
             "loss actually suffered."),
            ("Indirect discrimination",
             "A neutral rule disadvantaging a protected group -- which is "
             "what a model trained on past decisions produces."),
            ("Flow-down",
             "Confidentiality and data protection duties must reach every "
             "subcontractor, demonstrably."),
        ],
        "How IT work is staffed carries legal consequences the contract's "
        "label does not control: the law asks who DIRECTS the daily work, so "
        "an outsourcing agreement under which the client assigns tasks is "
        "DISGUISED DISPATCH. Employment is distinguished by control, "
        "supported by substitution, equipment, financial risk and "
        "integration, and its protections cannot be waived -- which is why "
        "misclassifying somebody defers the obligations rather than removing "
        "them. Working time, safety and non-discrimination duties apply to "
        "software organisations as much as to industrial ones, with INDIRECT "
        "discrimination the form that reaches system design. On the "
        "commercial side, acceptance must be UNQUALIFIED, so competing "
        "standard terms may never have agreed anything; FIXED PRICE "
        "transfers overrun risk and demands a defined scope; liability is "
        "capped by reference to CONTRACT VALUE rather than to the loss "
        "suffered, with consequential loss commonly excluded; and "
        "confidentiality and data protection obligations must flow down to "
        "every subcontractor in a way the organisation can demonstrate.",
        exam_notes=[
            desc(
                "Items describe an arrangement or a contract and ask what "
                "the law makes of it."
            ),
            ul([
                "Identifying disguised dispatch from who assigns tasks.",
                "Stating the consequence of misclassification.",
                "Naming control as the heaviest employment factor.",
                "Recognising a counter-offer in exchanged terms.",
                "Predicting scope disputes under a fixed price.",
                "Applying a liability cap to a large loss.",
                "Identifying indirect discrimination in a model.",
                "Tracing data obligations down a subcontract chain.",
            ]),
            desc(
                "For any item here, ask who was actually directing the work "
                "and what the agreement actually said. Substance decides the "
                "first and the document decides the second, and neither is "
                "decided by what the parties called it."
            ),
        ],
    ))


# ==========================================================================
# Lesson 2: Other laws, guidelines and engineer ethics
# ==========================================================================

_eth_sections = [
    ("What an Engineer Owes", [
        desc(
            "Beyond the specific laws already covered, an engineer works "
            "under a set of obligations that are partly legal, partly "
            "professional and partly ethical. The certification treats them "
            "as one subject because in practice they arrive together."
        ),
        image(fig("engineer-obligations")),
        table(
            ["Owed to", "Consists of"],
            [["The public",
              "Safety and welfare first, above every other obligation"],
             ["The employer",
              "Diligence, confidentiality, and honest effort"],
             ["The client",
              "Honesty about what is possible and what it will cost"],
             ["The profession",
              "Competence, and not claiming more than one has"],
             ["Colleagues",
              "Credit where it is due, and fair treatment"]],
            caption="Five obligations and to whom each is owed.",
            footer="The first outranks the rest when they conflict, and "
                   "every professional code says so explicitly. This is the "
                   "point of having a code at all: the ordering is decided "
                   "in advance rather than under pressure."),
    ]),

    ("Why Codes of Ethics Exist", [
        desc(
            "A professional code is not decoration, and its function is "
            "specific."
        ),
        ul([
            "It settles the priority ordering before anybody is under "
            "pressure to reorder it.",
            "It gives an individual something external to point at when "
            "refusing.",
            "It states what the profession will not tolerate, which protects "
            "those who comply.",
            "It supplies a standard against which conduct is judged "
            "afterwards.",
            "It is not law, and it becomes enforceable where membership or "
            "licensing depends on it.",
        ]),
        desc(
            "The second point is the practical value. An engineer refusing "
            "on their own judgement is in a personal argument; one refusing "
            "by reference to a professional standard is invoking something "
            "the organisation also recognises."
        ),
    ]),

    ("Competence", [
        desc(
            "Undertaking work one is not competent to do is treated as an "
            "ethical failure rather than merely a commercial risk."
        ),
        ul([
            "Work only in areas where you have the competence, or where "
            "somebody competent is supervising.",
            "Say so when a task exceeds what you can do, which requires more "
            "courage than knowledge.",
            "Keep competence current, since a qualification describes what "
            "was true once.",
            "Do not represent qualifications or experience you do not have.",
            "Recognise that competence is specific: expertise in one area "
            "implies nothing about another.",
        ]),
        desc(
            "The last point is where engineers most often overreach in good "
            "faith. Deep knowledge of one field produces confidence that "
            "transfers to neighbouring fields far more readily than the "
            "knowledge does."
        ),
    ]),

    ("Conflicts of Interest", [
        desc(
            "A conflict of interest is a situation rather than a wrongdoing, "
            "and how it is handled decides whether it becomes one."
        ),
        ol([
            "Recognise it -- any interest that could affect, or appear to "
            "affect, your judgement.",
            "Disclose it to whoever relies on that judgement, promptly.",
            "Withdraw from the decision where the conflict is material.",
            "Record the disclosure, since an undocumented one is difficult "
            "to demonstrate later.",
            "Note that APPEARANCE matters: a conflict that looks capable of "
            "influencing a decision damages trust whether or not it did.",
        ]),
        desc(
            "Step five is the point most often missed. The obligation is not "
            "to remain uninfluenced but to avoid a situation in which "
            "influence could reasonably be suspected, because the "
            "reassurance of the person involved is not evidence."
        ),
    ]),

    ("Whistleblowing", [
        desc(
            "Where an engineer discovers something seriously wrong, the "
            "route matters as much as the disclosure."
        ),
        ol([
            "Raise it internally first, through the defined route, unless "
            "doing so is futile or dangerous.",
            "Put it in writing, since an unrecorded concern is "
            "indistinguishable from none.",
            "Escalate within the organisation where the first response is "
            "inadequate.",
            "Disclose externally to a regulator where internal routes have "
            "failed and the matter is serious.",
            "Understand what protection the law provides, since it "
            "frequently depends on having followed the route.",
        ]),
        desc(
            "The last step is why the sequence is worth knowing. Legal "
            "protection for whistleblowers is generally conditional on the "
            "disclosure being made in the prescribed way, so the same "
            "information disclosed differently may leave the person "
            "unprotected."
        ),
    ]),

    ("Professional Judgement Under Pressure", [
        desc(
            "The situations that test ethics are not the ones with obvious "
            "villains."
        ),
        compare_grid(
            "WHAT THE PRESSURE LOOKS LIKE AGAINST WHAT IT IS",
            "Ordinary requests with a defect in them.",
            [("How it is presented",
              ["Just this once, for the deadline",
               "Everybody does it this way here",
               "The customer accepted the risk",
               "It is not your decision to make"]),
             ("What it actually is",
              ["A precedent, which will be cited next time",
               "An appeal to practice rather than to correctness",
               "Acceptance by somebody who was not told the whole risk",
               "True, and it is your decision whether to record your "
               "advice"])]),
        desc(
            "The last row is the practical resolution. An engineer rarely "
            "controls the decision and always controls whether their "
            "assessment was stated clearly and recorded, which is both the "
            "professional obligation and the individual's protection."
        ),
    ]),

    ("Ethics in Data and Automated Decisions", [
        desc(
            "Systems now make or shape decisions about people, which extends "
            "these obligations into design."
        ),
        ul([
            "A model reproduces the patterns in its training data, including "
            "the unjust ones.",
            "A decision affecting somebody should be explicable to them in "
            "terms they can act on.",
            "Automated decisions with significant effects carry specific "
            "legal requirements in some jurisdictions.",
            "Collecting data because it is available is not a reason for "
            "collecting it.",
            "The person affected is rarely the person who chose the system, "
            "which is what makes this an ethical question.",
        ]),
        desc(
            "The last point is the general principle behind all of these. "
            "Where the benefit falls to one party and the consequence falls "
            "to another who did not choose it, the design decision has an "
            "ethical dimension whatever its technical merits."
        ),
    ]),

    ("Accessibility Obligations", [
        desc(
            "Designing systems that some people cannot use is increasingly a "
            "legal failure rather than an omission."
        ),
        ul([
            "Public sector systems are required to meet accessibility "
            "standards in many jurisdictions.",
            "Equality legislation reaches private services where "
            "inaccessibility disadvantages disabled people.",
            "Recognised guidelines supply the practical standard that "
            "regulations point at.",
            "Accessibility is cheapest when designed in and expensive when "
            "retrofitted.",
            "It benefits considerably more people than those it is required "
            "for.",
        ]),
        desc(
            "The fourth point is the one to carry into a project. "
            "Accessibility is a set of decisions about structure and "
            "markup that cost almost nothing at design time and require "
            "rebuilding interfaces afterwards."
        ),
    ]),

    ("Environmental Obligations", [
        desc(
            "Computing consumes energy and produces waste, and both are "
            "regulated."
        ),
        ul([
            "Electrical equipment disposal is regulated, with obligations on "
            "producers and holders.",
            "Restrictions apply to hazardous substances in equipment.",
            "Energy reporting obligations apply to larger organisations, "
            "increasingly including data centres.",
            "Equipment containing data must be disposed of in a way that "
            "addresses the data as well as the hardware.",
            "Extending equipment life is generally the largest available "
            "environmental improvement.",
        ]),
        desc(
            "The fourth point combines two obligations that are usually "
            "handled by different people. Equipment sent for recycling with "
            "readable storage in it satisfies the environmental requirement "
            "and breaches the data one."
        ),
    ]),

    ("Sector-Specific Regulation", [
        desc(
            "Some industries impose rules on their systems that general law "
            "does not."
        ),
        table(
            ["Sector", "Typical additional requirements"],
            [["Financial services",
              "Record keeping, resilience, reporting, and supervision of "
              "outsourcing"],
             ["Healthcare",
              "Patient data rules, and device regulation where software is "
              "a device"],
             ["Telecommunications",
              "Interception capability, availability, and continuity "
              "obligations"],
             ["Critical infrastructure",
              "Security requirements and incident reporting to national "
              "authorities"],
             ["Public sector",
              "Procurement rules, accessibility, transparency, and records "
              "obligations"]],
            caption="Five sectors with additional obligations.",
            footer="Software that DIAGNOSES or treats can be regulated as a "
                   "medical device, which brings certification requirements "
                   "that ordinary software development is not organised "
                   "to meet."),
    ]),

    ("Guidelines and Their Force", [
        desc(
            "Much of what governs practice is not law, and treating it as "
            "optional is a mistake."
        ),
        ul([
            "Regulator guidance describes how a regulator will interpret the "
            "law it enforces.",
            "Industry codes may be conditions of trading rather than of "
            "legality.",
            "Contractual requirements bind whoever signed, with commercial "
            "consequences for breach.",
            "Internal policy is binding on staff through the employment "
            "relationship.",
            "Departing from published guidance is possible and requires "
            "being able to justify it.",
        ]),
        desc(
            "The last point describes how guidance actually operates. "
            "Following it is rarely mandatory and is always safe; departing "
            "from it puts the burden of justification on the organisation, "
            "which is a meaningful practical difference."
        ),
    ]),

    ("Professional Bodies", [
        desc(
            "Membership of a professional body carries obligations and "
            "supplies support."
        ),
        content_accordion(
            "WHAT A PROFESSIONAL BODY PROVIDES",
            "Each has a practical use.",
            [("A code of conduct",
              "An external standard an individual can invoke, and against "
              "which their conduct is assessed."),
             ("Disciplinary machinery",
              "Consequences for members who breach the code, which is what "
              "gives it force."),
             ("Continuing development",
              "A structure for keeping competence current, which the code "
              "requires."),
             ("Guidance on difficult situations",
              "Advice for members facing pressure, from people who are not "
              "their employer."),
             ("A collective voice",
              "Representation of the profession's position to regulators "
              "and to the public.")]),
    ]),

    ("Records and Evidence", [
        desc(
            "The recurring practical theme of this whole legal category is "
            "that the record is what survives."
        ),
        ul([
            "Advice given and not recorded is difficult to demonstrate "
            "afterwards.",
            "Decisions taken against advice should record both the advice "
            "and the decision.",
            "Risks accepted should record who accepted them and on what "
            "information.",
            "Records must be retained for the period the obligation "
            "requires, and remain readable.",
            "Records created contemporaneously carry weight that later "
            "reconstructions do not.",
        ]),
        desc(
            "The last point explains why the timing matters as much as the "
            "content. A note written at the time is evidence; the same "
            "account written after a dispute has begun is a position, and "
            "everybody involved knows the difference."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc(
            "Professional obligations touch every category, usually as a "
            "constraint on what may be done rather than what can be."
        ),
        content_tabs(
            "WHERE THIS APPEARS ELSEWHERE",
            "Each tab is a category shaped by this lesson.",
            [("Security", "Refusing and reporting",
              "The obligation to raise a concern in writing and to report a "
              "breach promptly is a professional duty before it is a "
              "regulatory one."),
             ("Development technology", "Accessibility and quality",
              "Accessible markup, explicable behaviour and honest estimates "
              "are engineering practices with obligations attached."),
             ("Project management", "Honest reporting",
              "Reporting status accurately under pressure to report it "
              "favourably is the most common ethical test a project "
              "engineer meets."),
             ("Business strategy", "Sector regulation",
              "What an organisation may build is constrained by the sector "
              "it operates in, which belongs in strategy rather than in "
              "compliance."),
             ("Service management", "Guidance and policy",
              "Much of service management is internal policy and industry "
              "guidance, binding through employment and contract rather "
              "than through law.")]),
    ]),

    ("Common Mistakes", [
        desc("Where ethics and guideline items are lost."),
        review_cards(
            "MISTAKES THAT COST MARKS HERE",
            "Each is a plausible answer that is wrong.",
            [("Ranking the employer's interest above public safety",
              "Every professional code puts public safety first, and says "
              "so explicitly for exactly this situation.",
              "The ordering is decided in advance."),
             ("Treating a conflict of interest as wrong only if it "
              "influenced something",
              "The obligation is to disclose and withdraw, because the "
              "appearance itself damages trust.",
              "Your own reassurance is not evidence."),
             ("Disclosing externally before exhausting internal routes",
              "Legal protection generally depends on having followed the "
              "prescribed sequence.",
              "The route matters as much as the disclosure."),
             ("Treating guidance as optional",
              "Departing from it is possible and shifts the burden of "
              "justification onto the organisation.",
              "Following it is always defensible."),
             ("Assuming a model without a protected input cannot "
              "discriminate",
              "It reproduces the patterns in its training data, and effect "
              "is what the provisions address.",
              "Indirect discrimination needs no explicit input.")]),
    ]),

    ("Review", [
        desc("The points items are built on."),
        review_cards(
            "WHAT TO CARRY OUT OF THIS LESSON",
            "Answer each before moving on.",
            [("What ranks first among an engineer's obligations?",
              "The safety and welfare of the public, above the employer and "
              "the client.",
              "Every code states this explicitly."),
             ("What does a code of ethics actually do?",
              "It settles the ordering in advance and gives an individual "
              "something external to invoke.",
              "That is its practical value under pressure."),
             ("How is a conflict of interest handled?",
              "Recognise, disclose, withdraw where material, and record it.",
              "Appearance matters as much as influence."),
             ("Why does the whistleblowing route matter?",
              "Legal protection is generally conditional on having followed "
              "the prescribed sequence.",
              "Same information, different protection."),
             ("What does departing from guidance cost?",
              "The burden of justifying the departure moves to the "
              "organisation.",
              "Following it is always defensible."),
             ("Why do contemporaneous records matter?",
              "A note written at the time is evidence; one written after a "
              "dispute is a position.",
              "Everybody involved knows the difference.")]),
    ]),
]


_eth_quiz = [
    mcq("AVERAGE",
        "The duty an engineer owes their employer conflicts with a risk to "
        "public safety.\n\nWhat do professional codes require?",
        [("Public safety takes precedence", True),
         ("The engineer must escalate within the organisation and abide by "
          "whatever decision management reaches", False),
         ("The two duties are balanced according to the severity of the "
          "risk and the size of the commercial harm", False),
         ("The duty to the employer prevails unless a specific legal "
          "obligation displaces it in the circumstances", False)],
        "Every professional code states the ordering explicitly, and that "
        "explicitness is the point of having a code: the priority is settled "
        "in advance rather than under commercial pressure. Escalating is the "
        "right first step, but accepting a decision that leaves the public "
        "at risk is not what the obligation permits."),

    mcq("HARD",
        "There is a financial interest in a supplier being evaluated, and the "
        "engineer holding it is confident their judgement is unaffected.\n\nWhat is required?",
        [("Disclosure and withdrawal, because appearance itself "
          "matters", True),
         ("Nothing, provided the engineer's assessment can be shown to be "
          "objectively justified on the merits", False),
         ("Disclosure alone, since withdrawal is required only where the "
          "interest is a controlling one", False),
         ("Disposal of the interest, after which the engineer may take part "
          "in the evaluation normally", False)],
        "The obligation is not to remain uninfluenced but to avoid a "
        "situation in which influence could reasonably be suspected, since "
        "the engineer's own confidence is not evidence available to anybody "
        "else. Disclosure, withdrawal where material, and a record of both "
        "is the required handling."),

    mcq("AVERAGE",
        "Serious wrongdoing is discovered, and an engineer discloses it "
        "directly to the press without raising it internally.\n\nWhat is the "
        "risk?",
        [("Legal protection frequently depends on the route "
          "followed", True),
         ("The disclosure itself becomes unlawful once it has been made to "
          "a party outside the organisation", False),
         ("The wrongdoing cannot subsequently be investigated by a "
          "regulator because it is already public", False),
         ("The engineer loses any professional standing regardless of "
          "whether the allegation proves correct", False)],
        "Whistleblower protection is generally conditional on the disclosure "
        "having been made in the prescribed way -- internally first, then "
        "escalated, then to a regulator where internal routes fail. The same "
        "information disclosed outside that sequence may leave the person "
        "without the protection the law otherwise provides."),

    mcq("HARD",
        "With the deadline close, an engineer is asked to omit a known risk "
        "from a status report.\n\nWhat is the professional "
        "position?",
        [("State the assessment clearly and record it", True),
         ("Comply, because deciding what to report is a management "
          "responsibility rather than an engineering one", False),
         ("Refuse to produce the report at all until the risk has been "
          "resolved to the engineer's satisfaction", False),
         ("Report the matter externally, since concealing a known risk is a "
          "form of serious wrongdoing", False)],
        "An engineer rarely controls the decision and always controls "
        "whether their assessment was stated and recorded, which is both the "
        "obligation and their own protection. Refusing to produce anything "
        "and escalating externally are both disproportionate to a disagreement "
        "that has not yet been recorded, let alone overruled."),

    mcq("AVERAGE",
        "Equipment is sent for environmentally compliant recycling with its "
        "storage devices still readable.\n\nWhat has gone wrong?",
        [("The data obligation has been breached", True),
         ("The environmental obligation has been breached, since storage "
          "devices require separate disposal routes", False),
         ("Nothing, provided the recycling contractor is certified and "
          "contractually bound to destroy the media", False),
         ("Nothing, because equipment leaving the organisation ceases to be "
          "its responsibility on collection", False)],
        "Disposal has to satisfy both obligations, and they are typically "
        "handled by different people. A contractor's commitment to destroy "
        "media does not discharge the duty, since the organisation deciding "
        "how personal data is used remains answerable and must be able to "
        "demonstrate the data was addressed."),

    mcq("AVERAGE",
        "Published regulator guidance is departed from deliberately.\n\nWhat "
        "is the consequence?",
        [("The organisation must be able to justify the "
          "departure", True),
         ("The departure is unlawful, because guidance issued by a "
          "regulator has the same force as the legislation", False),
         ("There is no consequence, because guidance is advisory and "
          "carries no weight in any assessment", False),
         ("The regulator must be notified in advance of any intended "
          "departure from its published guidance", False)],
        "Guidance describes how a regulator will interpret the law it "
        "enforces, so following it is defensible and departing from it "
        "shifts the burden of justification onto the organisation. It is not "
        "itself law, and it is not without weight either -- which is the "
        "distinction the syllabus tests."),

    mcq("HARD",
        "Software is developed that assists clinicians in diagnosing a "
        "condition.\n\nWhat additional regime may apply?",
        [("Medical device regulation", True),
         ("Consumer protection law, because the software affects the "
          "individuals whose conditions it assesses", False),
         ("Professional licensing rules applying to the clinicians who rely "
          "on the software's output", False),
         ("Financial services resilience rules, which extend to any system "
          "whose failure causes harm", False)],
        "Software intended to diagnose or treat is regulated as a medical "
        "device in many jurisdictions, bringing certification, clinical "
        "evaluation and post-market surveillance requirements. Ordinary "
        "software development is not organised to meet these, which is why "
        "the classification question has to be asked at the start."),

    mcq("AVERAGE",
        "Work in a neighbouring field is accepted by an engineer with deep "
        "expertise in one field.\n\nWhat does the competence obligation "
        "require?",
        [("Working only where competent or properly supervised", True),
         ("Declining the work outright, since competence in one field never "
          "transfers to any other", False),
         ("Accepting it, provided the engineer discloses their limited "
          "experience to the client beforehand", False),
         ("Accepting it and obtaining a relevant qualification before the "
          "work is delivered to the client", False)],
        "Competence is specific, and confidence transfers between "
        "neighbouring fields far more readily than knowledge does. The "
        "obligation permits working under competent supervision, which is "
        "how engineers legitimately extend their range, and disclosure alone "
        "does not make somebody competent to perform the work."),

    mcq("HARD",
        "Decisions affecting individuals who did not choose to use it are "
        "made by an automated system.\n\nWhy is this treated as an ethical "
        "question?",
        [("The benefit and the consequence fall on different "
          "parties", True),
         ("Automated systems are inherently less accurate than the human "
          "decisions that they replace", False),
         ("The individuals affected have not consented to the processing of "
          "their data by the system", False),
         ("Decisions made by software cannot be explained to the people "
          "they affect in any meaningful way", False)],
        "Where whoever gains from a design is not whoever bears its "
        "consequences, and the second party did not choose it, the decision "
        "has an ethical dimension regardless of its technical merits. This "
        "is the general principle behind explicability requirements, "
        "minimisation and the rules on automated decisions."),

    mcq("AVERAGE",
        "Advice was given verbally, the decision went the other way, and a "
        "dispute follows.\n\nWhat is the engineer's difficulty?",
        [("Advice not recorded is hard to demonstrate afterwards", True),
         ("Verbal advice carries no professional weight and does not "
          "discharge the obligation to give it", False),
         ("The engineer becomes jointly responsible for a decision they did "
          "not record their objection to", False),
         ("The dispute cannot be resolved without testimony from everybody "
          "who was present at the discussion", False)],
        "The professional obligation is discharged by giving the advice; the "
        "practical difficulty is proving it. A note made at the time is "
        "evidence, and the same account written after a dispute begins is a "
        "position -- which is why recording advice and the decision taken "
        "against it protects the engineer as much as the organisation."),
]


LESSON_ETH = lesson(
    MAJOR, MIDDLE,
    "Other Laws, Guidelines and Engineer Ethics",
    _eth_quiz,
    lesson_structure(
        "Other Laws, Guidelines and Engineer Ethics",
        "An engineer's obligations run to the public, the employer, the "
        "client, the profession and colleagues, and PUBLIC SAFETY outranks "
        "the rest when they conflict -- which is the point of a code stating "
        "the ordering in advance. This lesson covers competence as a "
        "specific rather than general property, conflicts of interest where "
        "APPEARANCE matters as much as influence, whistleblowing where legal "
        "protection depends on the ROUTE, accessibility and environmental "
        "obligations, sector regulation including software that becomes a "
        "medical device, and the recurring practical theme that a "
        "contemporaneous RECORD is what survives.",
        [
            "State the ordering of an engineer's obligations",
            "Explain what a code of ethics does",
            "Apply the competence obligation to unfamiliar work",
            "Handle a conflict of interest correctly",
            "Explain why the whistleblowing route matters",
            "State accessibility and environmental obligations",
            "Recognise sector-specific regulation",
            "Explain the force of guidance",
        ],
        75,
        _eth_sections,
        [
            ("Public safety first",
             "It outranks the employer and the client, and every code says "
             "so explicitly."),
            ("What a code does",
             "Settles the ordering before the pressure, and gives an "
             "individual something external to invoke."),
            ("Competence",
             "Specific rather than general; work supervised where it "
             "exceeds what you have."),
            ("Conflicts of interest",
             "Disclose, withdraw where material, record -- because "
             "appearance itself damages trust."),
            ("Whistleblowing",
             "Protection is generally conditional on following the "
             "prescribed route."),
            ("Guidance",
             "Not law; departing from it moves the burden of justification "
             "onto the organisation."),
            ("Sector regulation",
             "Software that diagnoses or treats can be regulated as a "
             "medical device."),
            ("Records",
             "A contemporaneous note is evidence; the same account after a "
             "dispute is a position."),
        ],
        "An engineer works under obligations to the PUBLIC, the employer, "
        "the client, the profession and colleagues, and public safety "
        "outranks the rest when they conflict -- which is why codes state "
        "the ordering explicitly rather than leaving it to be worked out "
        "under pressure. COMPETENCE is specific: expertise in one field "
        "implies nothing about a neighbouring one, and the obligation "
        "permits working supervised rather than pretending. A CONFLICT OF "
        "INTEREST is handled by disclosing, withdrawing where material and "
        "recording it, because appearance damages trust whether or not "
        "anything was influenced. Whistleblowing protection generally "
        "depends on having followed the prescribed ROUTE, so the sequence "
        "matters as much as the disclosure. Accessibility and environmental "
        "duties are legal rather than optional, and equipment disposal "
        "carries a data obligation alongside the environmental one. Sector "
        "rules add requirements general law does not -- software that "
        "diagnoses can be a regulated medical device. And guidance, while "
        "not law, moves the burden of justification onto whoever departs "
        "from it. Throughout, the CONTEMPORANEOUS RECORD is what survives.",
        exam_notes=[
            desc(
                "Items describe a pressured situation and ask what the "
                "obligation requires."
            ),
            ul([
                "Ranking public safety above the employer's interest.",
                "Handling a conflict the engineer believes is harmless.",
                "Identifying the risk of disclosing outside the route.",
                "Responding to a request to omit a risk from a report.",
                "Spotting the data obligation in equipment disposal.",
                "Stating the effect of departing from guidance.",
                "Recognising software as a medical device.",
                "Explaining why unrecorded advice is a difficulty.",
            ]),
            desc(
                "For any item here, ask who bears the consequence and "
                "whether anything was written down. The first settles the "
                "ethical question and the second settles what can be shown "
                "afterwards, which is frequently what the item is really "
                "testing."
            ),
        ],
    ))


LESSONS = [LESSON_LAB, LESSON_ETH]

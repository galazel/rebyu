"""Project Management, lessons 10 and 11.

Procurement management and communications management.

The procurement lesson is organised around contract type as a decision about
WHO CARRIES THE RISK, since that is what the examination's items turn on --
and the communications lesson around the channel arithmetic that explains why
large teams need structure rather than goodwill.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Project Management"
MIDDLE = "Project Management"

# ==========================================================================
# Lesson 10: Procurement management
# ==========================================================================

_proc_sections = [
    ("Buying Rather Than Building", [
        desc(
            "Projects obtain some of what they need from outside the "
            "organisation, and procurement manages that from the decision to "
            "buy through to closing the contract."
        ),
        table(
            ["Activity", "Produces"],
            [["Plan procurement", "What to buy, how, and on what terms"],
             ["Conduct procurement",
              "Suppliers selected and contracts agreed"],
             ["Control procurement",
              "Performance managed against the contract"],
             ["Close procurement",
              "Obligations discharged and the contract ended"]],
            caption="Four procurement activities.",
            footer="The MAKE-OR-BUY decision precedes all of them, and it is "
                   "the same reasoning as build-against-buy in Development "
                   "Technology: build what differentiates the organisation "
                   "and buy what every competitor also has."),
        desc(
            "Procurement introduces a party outside the project's authority. "
            "Everything the project can normally direct becomes something it "
            "must specify, agree and enforce -- which is why the contract "
            "does work that management would otherwise do."
        ),
    ]),

    ("Specifying What Is Wanted", [
        desc(
            "A supplier delivers what was specified, so the specification "
            "carries far more weight than an internal one would."
        ),
        ul([
            "A STATEMENT OF WORK describes what is required, in enough detail "
            "that a supplier can price it and be held to it.",
            "It states the acceptance criteria, since acceptance is a "
            "contractual event rather than a conversation.",
            "It states what the buyer will provide, since a supplier delayed "
            "by the buyer has a claim.",
            "It states the standards that apply, because a supplier's normal "
            "practice may not be the buyer's.",
            "Ambiguity favours neither party predictably, which is why it is "
            "worth removing before signature rather than arguing about "
            "afterwards.",
        ]),
        desc(
            "The third point is the one buyers forget. Many contracts include "
            "buyer obligations -- access, information, decisions, sign-offs -- "
            "and a project failing to meet them converts its own delay into "
            "the supplier's claim for costs."
        ),
    ]),

    ("Contract Types", [
        desc(
            "The contract decides who carries the risk of the work costing "
            "more than expected, which is what the examination asks about."
        ),
        image(fig("procurement-contracts")),
        table(
            ["Type", "Supplier is paid", "Risk carried by"],
            [["Fixed price", "An agreed sum for defined work",
              "The SUPPLIER"],
             ["Time and materials", "For effort and materials expended",
              "The BUYER"],
             ["Cost reimbursable", "Costs, plus an agreed fee",
              "The BUYER, with the fee arrangement sharing it"]],
            caption="Three contract families and where the risk falls.",
            footer="Risk does not disappear; it is allocated and priced. A "
                   "supplier carrying it prices for it, so a fixed price "
                   "includes a margin for uncertainty that a buyer pays "
                   "whether or not the uncertainty materialises."),
        desc(
            "The rule the syllabus expects: use FIXED PRICE where the scope "
            "is genuinely well defined, and TIME AND MATERIALS where it is "
            "not. A fixed price for undefined work is the worst combination "
            "-- the supplier prices the uncertainty heavily, and every "
            "clarification becomes a change request."
        ),
    ]),

    ("Selecting a Supplier", [
        desc(
            "Selection is a structured process, and its structure is what "
            "makes the decision defensible."
        ),
        ol([
            "Define the evaluation criteria BEFORE seeing any responses, so "
            "they are not shaped by what arrived.",
            "Weight them according to what actually matters, which is rarely "
            "price alone.",
            "Invite responses from suppliers capable of doing the work.",
            "Evaluate against the criteria, recording the reasoning for "
            "each.",
            "Negotiate and award, and tell the unsuccessful suppliers why.",
        ]),
        desc(
            "Step one is what distinguishes evaluation from justification. "
            "Criteria written after responses arrive tend to describe the "
            "preferred response, and the process then documents a decision "
            "already made rather than making one."
        ),
        desc(
            "Criteria beyond price include technical capability, relevant "
            "experience, financial stability, capacity to deliver alongside "
            "existing commitments, and cultural fit -- with FINANCIAL "
            "STABILITY mattering more than it appears, since a supplier that "
            "fails mid-contract costs far more than a higher price would "
            "have."
        ),
    ]),

    ("Managing a Supplier", [
        desc(
            "A signed contract is the beginning of the relationship rather "
            "than the end of the work."
        ),
        ul([
            "Monitor performance against the contract's terms, not against "
            "expectations that were never written into it.",
            "Meet the buyer's own obligations, since failing to do so "
            "weakens every claim the buyer might make.",
            "Handle changes formally, because a contract change is a "
            "contract amendment rather than an agreement in a meeting.",
            "Address problems early, since a supplier's difficulty becomes "
            "the buyer's delay whatever the contract says.",
            "Keep records, since a dispute is settled on evidence rather "
            "than on recollection.",
        ]),
        desc(
            "The fourth point is worth stating plainly. A contract allocates "
            "who PAYS for a failure, and it does not deliver the project -- "
            "so a buyer whose supplier is struggling has a commercial remedy "
            "and still has no system, which is why early engagement beats "
            "later enforcement."
        ),
    ]),

    ("Closing a Procurement", [
        desc(
            "Contracts end, and ending them properly protects the "
            "organisation after the project."
        ),
        table(
            ["Confirmed at closure", "Because"],
            [["All deliverables received and accepted",
              "Acceptance is contractual, not informal"],
             ["All payments made and invoices settled",
              "Outstanding obligations survive the project"],
             ["Warranties and support arrangements understood",
              "They continue after the contract's main term"],
             ["Intellectual property position confirmed",
              "Ownership of what was produced follows the contract's terms"],
             ["Records archived",
              "Disputes can arise after everybody has moved on"]],
            caption="Five things confirmed when a procurement closes.",
            footer="The INTELLECTUAL PROPERTY row is the one that surprises "
                   "organisations. Work by a contractor belongs to the "
                   "contractor unless the contract assigns it, which is the "
                   "reverse of what buyers assume."),
    ]),

    ("Incentives and Penalties", [
        desc(
            "A contract can do more than allocate risk; it can align a "
            "supplier's interests with the buyer's."
        ),
        table(
            ["Mechanism", "Encourages", "Watch for"],
            [["A fee tied to early delivery", "Speed",
              "Corners cut elsewhere to earn it"],
             ["A fee tied to quality measures", "Quality",
              "Optimising the measure rather than the outcome"],
             ["Penalties for late delivery", "Meeting the date",
              "Padded estimates at bidding time"],
             ["Shared savings against target cost", "Efficiency",
              "Disputes about what the target should have been"]],
            caption="Four incentive mechanisms and their side effects.",
            footer="Every incentive is optimised for, including in ways "
                   "nobody intended. The third column is not a reason to "
                   "avoid incentives; it is a reason to design them against "
                   "the outcome wanted rather than a proxy for it."),
        desc(
            "The most reliable alignment is a supplier who wants the next "
            "contract. A relationship expected to continue produces "
            "behaviour no clause compels, which is why a purely adversarial "
            "procurement posture is frequently more expensive than the "
            "concessions it avoids."
        ),
    ]),

    ("Procurement Documents", [
        desc(
            "The syllabus names the documents by which a buyer approaches "
            "the market, distinguished by what is being asked."
        ),
        ul([
            "A REQUEST FOR INFORMATION asks what is available, before the "
            "buyer knows enough to specify.",
            "A REQUEST FOR QUOTATION asks for a price against a "
            "specification the buyer has already written.",
            "A REQUEST FOR PROPOSAL asks suppliers how they would meet a "
            "stated need, so the solution is part of what is evaluated.",
            "An INVITATION TO TENDER is a formal competitive process, usually "
            "where regulation or policy requires one.",
        ]),
        desc(
            "The choice follows from how well the buyer knows what they want. "
            "Asking for quotations against a specification the buyer is "
            "unsure of buys exactly that specification; asking for proposals "
            "invites suppliers to contribute the expertise they were being "
            "engaged for."
        ),
    ]),

    ("Supplier Relationships Over Time", [
        desc(
            "Procurement is treated as a transaction and is usually a "
            "relationship, which changes what good management looks like."
        ),
        compare_grid(
            "TRANSACTIONAL AGAINST RELATIONAL PROCUREMENT",
            "Two postures towards the same supplier.",
            [("Transactional",
              ["Each engagement priced and negotiated separately",
               "Maximum pressure on price",
               "Suits commodity purchases",
               "Produces guarded behaviour on both sides"]),
             ("Relational",
              ["A continuing relationship with shared expectations",
               "Value over the relationship rather than per transaction",
               "Suits complex or long-running work",
               "Produces early warning and flexibility"])]),
        desc(
            "The right-hand column's last entry is the practical benefit. A "
            "supplier expecting future work tells a buyer about a problem "
            "early; one in a purely adversarial relationship discloses it "
            "when the contract compels them to, which is considerably later."
        ),
    ]),

    ("Managing Multiple Suppliers", [
        desc(
            "Where several suppliers contribute to one outcome, the "
            "integration between them becomes the buyer's problem."
        ),
        ol([
            "Establish who is accountable for the whole, since each supplier "
            "is accountable only for their part.",
            "Define the interfaces between them explicitly, as carefully as "
            "any technical interface.",
            "Decide how a problem spanning two suppliers is resolved, before "
            "one occurs.",
            "Avoid contractual arrangements where each can reasonably blame "
            "the other.",
            "Consider a prime contractor arrangement, which transfers the "
            "integration problem along with a margin for it.",
        ]),
        desc(
            "The fourth point describes the failure this arrangement produces "
            "characteristically. Two suppliers whose contracts each exclude "
            "the interface between them leave the buyer holding a defect "
            "neither is obliged to fix, and the commercial position is worse "
            "than the technical one."
        ),
    ]),

    ("Outsourcing and Offshoring", [
        desc(
            "The syllabus distinguishes two decisions that are frequently "
            "taken together and are separate."
        ),
        table(
            ["", "Outsourcing", "Offshoring"],
            [["Decides", "WHO does the work", "WHERE it is done"],
             ["Motivated by", "Capability, capacity, focus",
              "Cost, and access to skills"],
             ["Introduces", "A supplier relationship",
              "Distance, time zones and culture"],
             ["Can be combined", "With offshoring, or not",
              "With outsourcing, or not"]],
            caption="Two independent decisions.",
            footer="They are independent: work can be outsourced locally, or "
                   "performed offshore by the organisation's own staff. "
                   "Treating them as one decision means the difficulties of "
                   "each are attributed to the other."),
        desc(
            "The recurring finding is that cost savings are frequently "
            "smaller than expected, because coordination, specification and "
            "rework absorb much of the difference -- and those costs fall on "
            "the buyer rather than on the supplier's rate card."
        ),
    ]),

    ("Disputes", [
        desc(
            "Contracts are written partly for the situation where the parties "
            "disagree, and the syllabus expects the escalation sequence."
        ),
        ol([
            "Resolve it between the working parties, which settles the "
            "overwhelming majority.",
            "Escalate within both organisations, to people with authority the "
            "working parties lack.",
            "Use whatever the contract specifies -- mediation or a defined "
            "dispute procedure -- which exists to avoid the next step.",
            "Arbitrate, if the contract provides for it, which is faster and "
            "more private than the alternative.",
            "Litigate, which is slow, expensive and public, and which nobody "
            "involved will regard as a good outcome.",
        ]),
        desc(
            "The sequence's point is that each step is dearer and slower than "
            "the last, so the effort belongs at the top. A dispute that "
            "reaches litigation has usually cost both parties more than the "
            "amount in question, whatever the judgment says."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where procurement items are lost."),
        ul([
            "Using a fixed price for work whose scope is not defined.",
            "Believing risk transferred by contract has disappeared, when it "
            "has been priced and returned.",
            "Writing evaluation criteria after seeing the responses.",
            "Selecting on price without weighting capability and financial "
            "stability.",
            "Overlooking the buyer's own contractual obligations.",
            "Agreeing contract changes informally rather than as "
            "amendments.",
            "Assuming the buyer owns what a contractor produced.",
            "Believing a commercial remedy substitutes for a delivered "
            "system.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A buyer awards a fixed-price contract for work whose "
            "requirements are still being defined. What happens?\""
        ),
        ol([
            "Establish what fixed price means: the supplier carries the risk "
            "of the work costing more than expected.",
            "A supplier carrying uncertainty prices for it, so the quoted "
            "price includes a substantial margin the buyer pays regardless.",
            "As requirements are defined, anything not in the original "
            "specification is outside the fixed scope.",
            "Each becomes a CHANGE REQUEST, priced individually and without "
            "competitive pressure, since the supplier is already appointed.",
            "So the buyer pays a premium for uncertainty AND pays again for "
            "every clarification -- which is why time and materials suits "
            "undefined work.",
        ]),
        desc(
            "The reasoning generalises to every contract item: ask who "
            "carries the risk of the work being larger than expected, and "
            "whether the scope is defined well enough for that party to have "
            "priced it sensibly."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Procurement connects to several other areas."),
        ul([
            "Make-or-buy is the architecture lesson's build-against-buy "
            "decision.",
            "Contract risk allocation is the risk lesson's transfer "
            "response.",
            "Supplier dependency is a secondary risk created by that "
            "transfer.",
            "Intellectual property ownership comes from the Development "
            "Technology lesson.",
            "Supplier security assessment belongs to the Security "
            "category.",
            "Corporate procurement policy is covered in Corporate "
            "Activities.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What a contract type decides",
              "Who carries the risk of the work costing more",
              "Fixed price puts it on the supplier; time and materials on "
              "the buyer."),
             ("Why a fixed price for undefined work is the worst option",
              "The uncertainty is priced in, and every clarification is a "
              "change request",
              "The buyer pays a premium and then pays again, without "
              "competitive pressure."),
             ("Whether transferred risk disappears",
              "No -- it is priced and returned in the price",
              "Which is why transfer suits risks somebody else can genuinely "
              "manage better."),
             ("When evaluation criteria are written",
              "Before any responses are seen",
              "Otherwise they describe the preferred response and the process "
              "documents a decision already made."),
             ("The obligation buyers forget",
              "Their own -- access, information, decisions",
              "Failing them converts the buyer's delay into the supplier's "
              "claim."),
             ("Who owns a contractor's work",
              "The contractor, unless the contract assigns it",
              "Which is the reverse of what buyers assume.")]),
    ]),
]

_proc_quiz = [
    mcq("HARD",
        "A buyer awards a fixed-price contract for work whose requirements "
        "are still being defined.\n\nWhat is the likely outcome?",
        [("A premium for the uncertainty, plus a change request for every "
          "clarification", True),
         ("A lower total cost, since the supplier must absorb any "
          "overrun", False),
         ("The supplier will renegotiate to time and materials once work "
          "begins", False),
         ("The contract will be unenforceable because the scope is not "
          "defined", False)],
        "The supplier carries the risk under a fixed price, so they price the "
        "uncertainty into the quote and the buyer pays that margin whether or "
        "not it materialises. Anything subsequently defined is outside the "
        "original scope and becomes a change request, priced without "
        "competition since the supplier is already appointed. Time and "
        "materials suits undefined work."),

    mcq("AVERAGE",
        "Under a time and materials contract, who carries the risk of the "
        "work taking longer than expected?",
        [("The buyer", True),
         ("The supplier, who has quoted a rate", False),
         ("Both equally, in proportion to the overrun", False),
         ("Neither, since the rate covers the variation", False)],
        "Payment follows effort expended, so more effort means more cost to "
        "the buyer -- which places the risk with them. A fixed price places "
        "it on the supplier, who therefore prices for it. Risk does not "
        "disappear under any contract type; it is allocated, and the party "
        "carrying it charges for doing so."),

    mcq("HARD",
        "Why must supplier evaluation criteria be defined before responses "
        "are received?",
        [("Criteria written afterwards tend to describe the preferred "
          "response", True),
         ("Suppliers are entitled to know the criteria before "
          "bidding", False),
         ("Later definition prevents the responses being compared "
          "consistently", False),
         ("Procurement regulations require published criteria in most "
          "jurisdictions", False),
         ],
        "Once responses are visible, criteria drift towards whichever one "
        "seems best -- and the evaluation then documents a decision already "
        "made rather than making one. Defining them in advance is what makes "
        "the process an evaluation. Publication requirements exist in some "
        "settings and are a separate matter from the reasoning."),

    mcq("AVERAGE",
        "Which selection criterion matters more than its prominence "
        "suggests?",
        [("The supplier's financial stability", True),
         ("The supplier's proposed project methodology", False),
         ("The supplier's geographic proximity to the buyer", False),
         ("The supplier's willingness to negotiate on price", False)],
        "A supplier that fails partway through a contract leaves the buyer "
        "with incomplete work, no ready alternative and a recovery costing "
        "far more than the higher price of a stable supplier would have. It "
        "is easy to overlook because it says nothing about capability -- and "
        "capability is irrelevant from an organisation that has ceased "
        "trading."),

    mcq("HARD",
        "A project fails to provide information a contract required it to "
        "supply, delaying the supplier.\n\nWhat follows?",
        [("The supplier may claim for the delay, and the buyer's own claims "
          "are weakened", True),
         ("The delay is absorbed by the supplier under the contract's "
          "terms", False),
         ("The contract is suspended until the information is "
          "provided", False),
         ("The buyer may recover the cost from the supplier's "
          "contingency", False)],
        "Contracts impose obligations on buyers as well as suppliers -- "
        "access, information, decisions, sign-offs -- and failing them "
        "converts the buyer's own delay into the supplier's claim. It also "
        "undermines any claim the buyer later makes about the supplier's "
        "performance, since the buyer contributed to it."),

    mcq("AVERAGE",
        "What does closing a procurement confirm about intellectual "
        "property?",
        [("The ownership position established by the contract's terms", True),
         ("That the buyer owns everything produced under the "
          "contract", False),
         ("That the supplier retains ownership of all deliverables", False),
         ("That ownership passes to the buyer on final payment", False)],
        "Ownership follows the contract, and the default is that a "
        "contractor's work belongs to the contractor unless the contract "
        "assigns it -- the reverse of what buyers assume. Closure confirms "
        "which applies, which is far better done then than when somebody "
        "later wants to reuse or modify what was delivered."),

    mcq("HARD",
        "A supplier is struggling and the contract gives the buyer strong "
        "remedies.\n\nWhy is that insufficient?",
        [("A remedy allocates who pays for failure and does not deliver the "
          "project", True),
         ("Remedies cannot be enforced until the contract "
          "completes", False),
         ("Invoking remedies terminates the contract "
          "automatically", False),
         ("The remedies will be disputed and take years to "
          "resolve", False)],
        "A contract decides who bears the cost of a failure; it does not "
        "produce a working system. A buyer with excellent remedies and a "
        "failing supplier still has no delivery, which is why engaging early "
        "with a supplier's difficulties is more valuable than enforcing "
        "afterwards -- the commercial position is a consolation, not an "
        "outcome."),

    mcq("AVERAGE",
        "How should a change to a contract's scope be agreed?",
        [("As a formal contract amendment", True),
         ("As a record in the project's change log", False),
         ("As an agreement minuted at a supplier meeting", False),
         ("As an instruction issued by the project manager", False)],
        "The contract is the agreement between two organisations, so changing "
        "what it requires means amending it. Informal agreement leaves both "
        "parties with different understandings and no enforceable position, "
        "and it is discovered when something goes wrong -- at which point the "
        "written contract governs regardless of what was said."),

    mcq("HARD",
        "What does transferring a risk to a supplier by contract actually "
        "achieve?",
        [("The financial exposure moves and is returned in the price", True),
         ("The risk is eliminated for both parties", False),
         ("The buyer's accountability for the outcome is "
          "removed", False),
         ("The supplier absorbs the risk at no additional cost", False)],
        "A supplier asked to carry uncertainty prices for it, so the buyer "
        "pays a margin whether or not the risk materialises. That is a "
        "reasonable trade where the supplier can manage the risk better than "
        "the buyer, and poor value where they cannot -- and accountability "
        "for the outcome stays with the buyer either way."),

    mcq("AVERAGE",
        "What determines whether something should be procured rather than "
        "produced internally?",
        [("Whether it differentiates the organisation from its "
          "competitors", True),
         ("Whether the internal team currently has spare "
          "capacity", False),
         ("Whether an external supplier can produce it more "
          "cheaply", False),
         ("Whether the work falls outside the project's core "
          "deliverables", False)],
        "Internal effort is finite and belongs where it creates advantage, so "
        "what every competitor also has is bought and what distinguishes the "
        "organisation is built. Cost and capacity inform the decision without "
        "settling it -- building something cheaply that produces no "
        "advantage still spends effort that had a better use."),
]

LESSON_PM_PROC = lesson(
    MAJOR, MIDDLE,
    "Project Procurement Management",
    _proc_quiz,
    lesson_structure(
        "Project Procurement Management",
        "Procurement introduces a party outside the project's authority, so "
        "everything that would otherwise be directed must instead be "
        "specified, agreed and enforced -- which is why the contract does "
        "work that management would otherwise do. The lesson is organised "
        "around contract type as a decision about WHO CARRIES THE RISK of the "
        "work costing more than expected, since risk does not disappear when "
        "it is transferred but is priced and returned. It also covers "
        "specification including the buyer's own obligations, structured "
        "selection with criteria written before responses arrive, supplier "
        "management, and closure including the intellectual property position "
        "buyers routinely assume wrongly.",
        [
            "Describe the procurement activities and the make-or-buy "
            "decision",
            "Specify work adequately, including buyer obligations",
            "Match contract type to how well the scope is defined",
            "Explain what transferring risk by contract actually achieves",
            "Run a structured selection with criteria defined in advance",
            "Weight selection criteria beyond price",
            "Manage a supplier and handle contract changes correctly",
            "Close a procurement, including the intellectual property "
            "position",
        ],
        75,
        _proc_sections,
        [
            ("Make-or-buy",
             "Build what differentiates the organisation; buy what every "
             "competitor also has."),
            ("Statement of work",
             "What is required, in enough detail to be priced and enforced, "
             "with acceptance criteria."),
            ("Buyer obligations",
             "Access, information and decisions the contract requires -- and "
             "whose absence becomes the supplier's claim."),
            ("Fixed price",
             "Supplier carries the cost risk and prices for it. Suits well "
             "defined scope."),
            ("Time and materials",
             "Buyer carries the cost risk. Suits uncertain or evolving work."),
            ("Cost reimbursable",
             "Costs repaid plus a fee, used where the work cannot be scoped "
             "in advance."),
            ("Evaluation criteria",
             "Defined and weighted BEFORE responses are seen, or the "
             "evaluation documents a decision already made."),
            ("Financial stability",
             "A selection criterion mattering more than it appears, since a "
             "failed supplier costs more than a higher price."),
            ("Contract amendment",
             "How a scope change is agreed -- informal agreement leaves "
             "nothing enforceable."),
            ("Intellectual property at closure",
             "Ownership follows the contract; a contractor's work is theirs "
             "unless assigned."),
        ],
        "Procurement brings in a party the project cannot direct, so what "
        "would be managed internally must be specified, agreed and enforced. "
        "Contract type is the central decision and it allocates WHO CARRIES "
        "THE RISK of the work costing more than expected: fixed price puts it "
        "on the supplier, time and materials on the buyer. Risk does not "
        "disappear when transferred -- the party carrying it prices for it, "
        "so the buyer pays that margin regardless -- which makes a FIXED "
        "PRICE FOR UNDEFINED WORK the worst combination available, since the "
        "uncertainty is priced heavily and every subsequent clarification "
        "becomes a change request negotiated without competitive pressure. "
        "Specification carries unusual weight because a supplier delivers "
        "what was written, and it must include the BUYER's own obligations, "
        "whose absence turns the buyer's delay into the supplier's claim. "
        "Selection defines and weights criteria before responses arrive, or "
        "the evaluation merely documents a decision already made -- and "
        "financial stability matters more than its prominence suggests, since "
        "capability is irrelevant from a supplier that has ceased trading. "
        "Changes are contract amendments rather than meeting agreements. And "
        "a strong remedy is not a delivered system, which is why engaging "
        "early with a struggling supplier beats enforcing afterwards.",
        exam_notes=[
            desc(
                "Items describe a procurement arrangement and ask what will "
                "follow from it."
            ),
            ul([
                "Predicting the outcome of a fixed price with undefined "
                "scope.",
                "Identifying who carries risk under each contract type.",
                "Explaining what risk transfer actually achieves.",
                "Explaining why criteria precede responses.",
                "Identifying the buyer's own obligations.",
                "Handling a contract change correctly.",
                "Stating the default intellectual property position.",
            ]),
            desc(
                "For any contract item, ask two questions: who carries the "
                "risk of the work being larger than expected, and is the "
                "scope defined well enough for them to have priced it. Nearly "
                "every item in this lesson is answered by that pair."
            ),
        ],
    ))

# ==========================================================================
# Lesson 11: Communications management
# ==========================================================================

_comm_sections = [
    ("Most of the Job", [
        desc(
            "Communication occupies the majority of a project manager's time, "
            "and treating it as time taken from real work misunderstands what "
            "the role is."
        ),
        image(fig("communication-channels")),
        desc(
            "The reason is structural. The number of possible communication "
            "channels in a group of n people is n(n-1)/2, so it grows with "
            "the SQUARE of the team size: five people have ten channels, "
            "twenty have 190, and fifty have 1,225."
        ),
        table(
            ["Team size", "Channels"],
            [["5", "10"], ["10", "45"], ["20", "190"], ["50", "1,225"]],
            caption="Channel growth with team size.",
            footer="This is why large teams need STRUCTURE rather than "
                   "goodwill. A group where everybody talks to everybody "
                   "stops functioning at a size that surprises people, and no "
                   "amount of effort compensates for the arithmetic."),
    ]),

    ("Planning Communication", [
        desc(
            "Who needs to know what, when, and how, is planned rather than "
            "improvised."
        ),
        ol([
            "Identify each stakeholder's information NEEDS, which the "
            "stakeholder analysis already established.",
            "Decide what information satisfies each need, at what level of "
            "detail.",
            "Decide the frequency, since too often is ignored and too rarely "
            "arrives after decisions.",
            "Decide the medium, which follows from urgency, complexity and "
            "whether a record is needed.",
            "Decide who is responsible for each communication, so it happens "
            "rather than being everybody's job.",
        ]),
        desc(
            "The plan's value is that it makes gaps visible. A stakeholder "
            "with no entry receives nothing, and noticing that during "
            "planning costs a moment -- while noticing it when they object at "
            "deployment costs the project weeks."
        ),
    ]),

    ("Choosing a Medium", [
        desc(
            "Different messages suit different channels, and mismatching them "
            "is a recognisable failure."
        ),
        table(
            ["Medium", "Suits", "Fails at"],
            [["A conversation", "Complexity, disagreement, sensitivity",
              "Leaving a record anybody can consult"],
             ["A meeting", "Reaching a decision several people affect",
              "Conveying information one document would carry"],
             ["A written report", "Detail, and evidence for later",
              "Conveying urgency, or resolving disagreement"],
             ["A short message", "Urgency and coordination",
              "Anything requiring nuance"],
             ["A shared dashboard", "Status anybody can consult when they "
                                    "want", "Anything requiring a response"]],
            caption="Five media, each with a mismatch worth avoiding.",
            footer="The classic mismatch is using a meeting to convey "
                   "information. If nobody needs to respond, a document "
                   "respects everybody's time -- and a meeting where one "
                   "person talks has spent a room's hour to deliver a page."),
        desc(
            "PUSH communication sends information to recipients; PULL makes "
            "it available for them to retrieve. Push suits anything requiring "
            "action or awareness; pull suits reference material, and using "
            "push for everything produces the volume that makes people stop "
            "reading."
        ),
    ]),

    ("What Makes Communication Work", [
        desc(
            "Sending a message is not the same as being understood, and the "
            "difference has identifiable causes."
        ),
        content_accordion(
            "FIVE THINGS THAT INTERFERE",
            "Each explains a message that was sent and not received.",
            [("Too much volume",
              "A recipient receiving more than they can attend to reads "
              "none of it carefully. Volume is the commonest cause of "
              "important information being missed."),
             ("The wrong level of detail",
              "A sponsor sent an engineering report and an engineer sent a "
              "summary each receive something they cannot use."),
             ("Assumed shared context",
              "Terminology and background obvious to the sender may be "
              "opaque, and the recipient often will not ask."),
             ("Bad news being unwelcome",
              "Where reporting problems is punished, reports become "
              "optimistic -- which is a management failure appearing as a "
              "communication one."),
             ("No feedback path",
              "One-way communication cannot tell whether it was understood, "
              "so misunderstandings persist until they surface as "
              "something else.")]),
        desc(
            "The fourth is the one worth acting on. A project reported green "
            "until the week it fails was misreported for months, and the "
            "cause is nearly always that earlier honest reporting would have "
            "been unwelcome."
        ),
    ]),

    ("Reporting Performance", [
        desc(
            "Status reporting is the most regular communication a project "
            "produces, and most of it is done badly."
        ),
        ul([
            "Report against the BASELINE, since a status without a "
            "comparison means nothing.",
            "Report what CHANGED since the last report, which is what a "
            "regular reader actually needs.",
            "Report the projected outcome rather than the original plan, once "
            "they differ.",
            "State what decision, if any, is being requested -- a report "
            "requesting nothing invites no action.",
            "Match the detail to the audience, since one report for everybody "
            "serves nobody well.",
        ]),
        desc(
            "The third point is where reporting becomes dishonest without "
            "anybody lying. Continuing to report an original end date that "
            "stopped being achievable is technically accurate about the plan "
            "and misleading about the project -- and the correction gets "
            "harder every week it is deferred."
        ),
    ]),

    ("Meetings", [
        desc(
            "Meetings consume more project time than any other communication "
            "and are the least examined."
        ),
        ol([
            "Establish the PURPOSE: a decision, a problem to solve, or "
            "information genuinely needing discussion.",
            "Invite the people the purpose requires, since attendance is a "
            "cost multiplied by everybody present.",
            "Circulate what people need in advance, so the meeting is spent "
            "on what a document cannot do.",
            "Record the decisions and the actions, with owners and dates.",
            "Cancel it if the purpose has evaporated, which is a service "
            "rather than a failure.",
        ]),
        desc(
            "The second point is the one with measurable cost. A recurring "
            "hour with twelve attendees consumes a day and a half of "
            "organisational time every week, and half of them may be there "
            "because they were on the original invitation."
        ),
    ]),

    ("Communicating Bad News", [
        desc(
            "The communication that matters most is the one people are least "
            "willing to make, and doing it well is a skill rather than a "
            "temperament."
        ),
        ol([
            "Report it EARLY, since the value of the information decays "
            "faster than the problem improves.",
            "State the situation plainly before the explanation, so the "
            "recipient knows what they are hearing.",
            "Separate what is known from what is estimated, since a "
            "recipient will otherwise treat both alike.",
            "Bring options rather than only the problem, since a decision is "
            "usually what is being asked for.",
            "Say what is being requested -- a decision, resources, or simply "
            "awareness.",
        ]),
        desc(
            "The first step is the one that costs credibility to defer. A "
            "problem reported when it appears is a problem being managed; the "
            "same problem reported when it can no longer be concealed is a "
            "problem plus a question about what else has not been mentioned."
        ),
    ]),

    ("Communication Across Organisations", [
        desc(
            "Projects spanning organisations lose the shared context that "
            "makes internal communication efficient."
        ),
        table(
            ["Lost", "Consequence"],
            [["Shared terminology",
              "The same word means different things, undetected"],
             ["Shared assumptions about process",
              "Each expects the other to do something"],
             ["Informal escalation routes",
              "Problems travel slowly and formally"],
             ["Knowledge of who decides what",
              "Requests reach people without the authority"]],
            caption="Four things lost when a project crosses an "
                    "organisational boundary.",
            footer="The first row is the most insidious because nothing "
                   "signals it. Two parties using the same term differently "
                   "proceed confidently until the difference produces "
                   "something visible, usually at integration."),
        desc(
            "The remedies are unglamorous: define the terms that matter, "
            "agree the process explicitly rather than assuming it, and "
            "establish who decides what on each side before anything needs "
            "deciding."
        ),
    ]),

    ("Documentation as Communication", [
        desc(
            "Written material is communication with people the author will "
            "never meet, which changes how it should be written."
        ),
        ul([
            "The reader cannot ask a question, so anything they need must be "
            "present.",
            "They arrive with different context, so what is obvious to the "
            "author may not be.",
            "They read under pressure, frequently looking for one specific "
            "thing rather than reading through.",
            "They will trust it, which is why documentation that has become "
            "wrong is worse than none.",
        ]),
        desc(
            "The last point is the one that changes behaviour. A document "
            "known to be unreliable still gets believed by somebody who does "
            "not know that -- so removing an obsolete document is a positive "
            "act rather than a loss, and updating it is part of every change "
            "rather than a separate task."
        ),
    ]),

    ("Escalation", [
        desc(
            "Some communication exists to move a decision to somebody with "
            "the authority to make it, and doing that well is a defined "
            "skill."
        ),
        compare_grid(
            "ESCALATING BADLY AND WELL",
            "The same problem, raised two ways.",
            [("Badly",
              ["Raised late, when options have closed",
               "The problem without any analysis",
               "Escalated past the person who could have resolved it",
               "Framed as a complaint about somebody"]),
             ("Well",
              ["Raised while a decision still changes the outcome",
               "With options and their consequences",
               "To the lowest level with the authority to decide",
               "Framed as a decision that is needed"])]),
        desc(
            "Escalation spends credibility, which is why it is used where the "
            "issue genuinely exceeds the project's authority -- and why doing "
            "it well matters. A manager given a problem and three options "
            "makes a decision; one given a complaint acquires a task."
        ),
    ]),

    ("Information Overload", [
        desc(
            "The commonest communication failure in a well-run project is not "
            "too little information but too much."
        ),
        ul([
            "A recipient receiving more than they can attend to reads none of "
            "it carefully, which is worse than receiving less.",
            "Copying everybody on everything transfers the filtering cost "
            "from the sender to every recipient.",
            "Volume also conceals: a genuinely important message arriving "
            "among fifty routine ones is not distinguishable.",
            "The remedy is deciding who NEEDS each item, which is what the "
            "communications plan was for.",
        ]),
        desc(
            "The second point is worth stating as the economics it is. "
            "Copying twenty people costs the sender nothing and costs the "
            "organisation twenty people's attention -- which makes it the "
            "cheapest thing to do and frequently the most expensive."
        ),
    ]),

    ("Communication and the Project's Record", [
        desc(
            "Some communication exists to inform now and some to be found "
            "later, and the two are managed differently."
        ),
        table(
            ["Purpose", "Needs"],
            [["Informing a decision now",
              "Reaching the right person promptly"],
             ["Recording a decision taken",
              "Being findable by somebody who was not there"],
             ["Establishing what was agreed",
              "Being unambiguous, and dated"],
             ["Supporting a later investigation",
              "Being complete, and retained long enough"]],
            caption="Four purposes with four different requirements.",
            footer="The second row is the one projects handle worst. A "
                   "decision taken in a conversation and never written down "
                   "is a decision that will be made again differently, "
                   "usually by somebody who was not in the room."),
        desc(
            "The practical rule is that a decision is not made until it is "
            "recorded somewhere the people affected by it will encounter it. "
            "Everything else is a discussion that felt conclusive to the "
            "people present."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where communications items are lost."),
        ul([
            "Treating communication as overhead rather than as most of the "
            "role.",
            "Ignoring the channel arithmetic, so a large team is expected to "
            "coordinate informally.",
            "Using a meeting to convey information nobody needs to respond "
            "to.",
            "Pushing everything, which produces the volume that makes people "
            "stop reading.",
            "Reporting status without a baseline to compare against.",
            "Continuing to report an original date after it stopped being "
            "achievable.",
            "Sending the same report to every audience.",
            "Treating optimistic reporting as a reporting problem rather "
            "than a culture one.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A project of forty people finds that decisions are duplicated "
            "and information is inconsistent. Adding more meetings has not "
            "helped. Why?\""
        ),
        ol([
            "Establish the arithmetic: forty people have 780 possible "
            "channels, which no informal arrangement covers.",
            "Information flows along whichever channels happen to be used, so "
            "different people hold different versions.",
            "More meetings add channels rather than replacing them, and they "
            "consume the time that would be spent working.",
            "What is needed is STRUCTURE: defined information flows, a single "
            "authoritative source for shared facts, and clear decision "
            "ownership.",
            "That reduces the number of channels that must carry anything "
            "important, which is the only thing that scales.",
        ]),
        desc(
            "The general principle is that communication problems in large "
            "groups are structural rather than behavioural. Asking people to "
            "communicate better does not change the arithmetic, and reducing "
            "the number of channels that matter does."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Communication runs through the whole category."),
        ul([
            "Information needs come from the stakeholder analysis.",
            "Reporting against a baseline uses the integration lesson's "
            "baselines and the cost lesson's earned value.",
            "Risk reporting is covered in the risk lesson.",
            "Channel growth is why distributed teams need explicit "
            "arrangements, from resource management.",
            "Honest reporting is the ethical obligation from the foundations "
            "lesson.",
            "Communication with suppliers is governed by the contract.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("The channel formula",
              "n(n-1)/2",
              "Growth with the SQUARE of team size, which is why large teams "
              "need structure rather than goodwill."),
             ("Push against pull communication",
              "Sent to recipients, against made available",
              "Pushing everything produces the volume that makes people stop "
              "reading."),
             ("The classic medium mismatch",
              "A meeting used to convey information",
              "If nobody needs to respond, a document respects everybody's "
              "time."),
             ("What a status report needs",
              "A baseline to compare against, and what changed",
              "A status with no comparison conveys nothing."),
             ("Why projects report green until they fail",
              "Honest earlier reporting would have been unwelcome",
              "Which makes it a culture failure appearing as a communication "
              "one."),
             ("Why more meetings do not fix a large project",
              "They add channels rather than reducing what must be carried",
              "The remedy is structure, which is the only thing that "
              "scales.")]),
    ]),
]

_comm_quiz = [
    mcq("HARD",
        "Duplicated decisions and inconsistent information affect a "
        "forty-person project, and adding meetings has not helped.\n\nWhy?",
        [("The channel count is structural, and meetings add channels rather "
          "than reducing them", True),
         ("The meetings do not include the right people to resolve the "
          "inconsistencies", False),
         ("Information is being pushed when it should be made available to "
          "pull", False),
         ("The team lacks the discipline to communicate what they have "
          "decided", False)],
        "Forty people have 780 possible channels, and information travels "
        "along whichever happen to be used -- so different people hold "
        "different versions. More meetings add more channels and consume the "
        "time that would otherwise be spent working. The remedy is structure: "
        "defined flows, one authoritative source, clear decision ownership. "
        "Asking people to communicate better does not change arithmetic."),

    mcq("AVERAGE",
        "How many communication channels exist in a team of ten people?",
        [("45", True),
         ("90", False),
         ("100", False),
         ("10", False)],
        "The formula is n(n-1)/2, so 10 x 9 / 2 = 45. The point of the "
        "formula is the growth rate rather than any individual figure: "
        "channels grow with the SQUARE of team size, so doubling a team more "
        "than triples the potential communication paths -- which is why large "
        "groups need explicit structure rather than goodwill."),

    mcq("HARD",
        "Green status is reported on a project until the week it fails.\n\n"
        "What does this most likely indicate?",
        [("Earlier honest reporting would have been unwelcome", True),
         ("The reporting frequency was too low to detect the "
          "problem", False),
         ("The status was measured against the wrong "
          "baseline", False),
         ("The project manager lacked the data to report "
          "accurately", False)],
        "A project does not become critical in a week; it was in difficulty "
        "for months and reported otherwise. That pattern reflects a culture "
        "where bad news is punished, so reports become optimistic and arrive "
        "too late to be acted on -- which makes it a management failure "
        "appearing in the form of a communication problem."),

    mcq("AVERAGE",
        "What is the classic mismatch between message and medium?",
        [("Using a meeting to convey information nobody needs to respond "
          "to", True),
         ("Using a written report to record a decision that was "
          "taken", False),
         ("Using a conversation to resolve a disagreement between two "
          "people", False),
         ("Using a dashboard to make status available on demand", False)],
        "A meeting is expensive -- an hour multiplied by everybody present -- "
        "and its value is in what a document cannot do: reaching a decision "
        "several people affect, or resolving something contested. Where "
        "nobody needs to respond, a document conveys the same information and "
        "respects everybody's time. The other three are appropriate uses."),

    mcq("AVERAGE",
        "What distinguishes push from pull communication?",
        [("Push sends information to recipients; pull makes it available for "
          "retrieval", True),
         ("Push is used for urgent matters and pull for routine "
          "ones", False),
         ("Push is initiated by the project and pull by "
          "stakeholders", False),
         ("Push requires acknowledgement while pull does not", False)],
        "Push suits anything requiring action or awareness; pull suits "
        "reference material somebody consults when they need it. The "
        "practical consequence is that pushing everything produces volume, "
        "and a recipient receiving more than they can attend to reads none of "
        "it carefully -- which is the commonest reason important information "
        "is missed."),

    mcq("HARD",
        "A status report states progress without reference to the "
        "baseline.\n\nWhat is the problem?",
        [("A status with no comparison conveys nothing about "
          "performance", True),
         ("The report cannot be audited against the project's "
          "records", False),
         ("Stakeholders will assume the project is behind "
          "schedule", False),
         ("The baseline may have changed since the last report", False)],
        "Reporting that fourteen tasks are complete and 320 hours spent is "
        "raw data: neither good nor bad until compared with what was planned "
        "for the work actually done. Without the baseline, every recipient "
        "supplies their own comparison, usually inconsistently -- which is "
        "the step between data and information."),

    mcq("AVERAGE",
        "Why should a project stop reporting its original end date once it is "
        "no longer achievable?",
        [("It is accurate about the plan and misleading about the "
          "project", True),
         ("The baseline should be updated whenever a variance is "
          "detected", False),
         ("Stakeholders will hold the project to the original "
          "date", False),
         ("Reporting a projected date removes the need for corrective "
          "action", False),
         ],
        "Repeating a date that stopped being achievable is technically true "
        "about what was planned and conveys something false about what will "
        "happen -- and the correction becomes harder every week it is "
        "deferred. Reporting the projected outcome is what lets somebody act "
        "while options remain; the baseline itself changes only through "
        "change control."),

    mcq("HARD",
        "A recurring one-hour meeting has twelve attendees, half of whom "
        "contribute nothing.\n\nWhat does this cost?",
        [("Twelve hours of organisational time each week, half of it "
          "wasted", True),
         ("One hour of project time, since the meeting runs "
          "regardless", False),
         ("Nothing measurable, since the attendees have other work "
          "available", False),
         ("Six hours, counting only the attendees who "
          "contribute", False)],
        "A meeting's cost is its duration multiplied by everybody present, "
        "whether or not they speak -- so twelve people for an hour is twelve "
        "hours weekly. Attendance is frequently inherited from an original "
        "invitation nobody revisits, which makes reviewing the list one of "
        "the cheapest available savings."),

    mcq("AVERAGE",
        "What should a status report state beyond the current position?",
        [("What decision, if any, is being requested", True),
         ("The full detail of every work package's status", False),
         ("The names of everybody who contributed during the "
          "period", False),
         ("The complete risk register as an appendix", False)],
        "A report that requests nothing invites no action, so a reader with "
        "authority reads it and does nothing -- which may be correct or may "
        "mean a needed decision was never asked for. Stating explicitly what "
        "is wanted is what turns reporting into part of the control process "
        "rather than a record of it."),

    mcq("HARD",
        "Why does the syllabus treat communication as most of a project "
        "manager's role rather than as overhead?",
        [("Coordination is what the role consists of, and channels grow with "
          "the square of team size", True),
         ("Project managers are not expected to contribute technical "
          "work", False),
         ("Stakeholders require frequent reassurance about "
          "progress", False),
         ("Documentation standards require extensive written "
          "records", False)],
        "The role exists to make many people's separate work into one "
        "coherent project, and that is done by communicating -- which is why "
        "measurement consistently finds it occupying most of the time. The "
        "channel arithmetic explains why: coordination effort grows far "
        "faster than team size, so it dominates as projects get larger."),
]

LESSON_PM_COMM = lesson(
    MAJOR, MIDDLE,
    "Project Communications Management",
    _comm_quiz,
    lesson_structure(
        "Project Communications Management",
        "Communication occupies most of a project manager's time for a "
        "structural reason: the number of channels in a group of n people is "
        "n(n-1)/2, so coordination effort grows with the SQUARE of team size "
        "and dominates as projects get larger. This lesson covers planning "
        "who needs what and when, choosing a medium and the classic mismatch "
        "of using a meeting to convey information, the five things that "
        "interfere with a message being understood -- including bad news "
        "being unwelcome, which is a culture failure appearing as a "
        "communication one -- and reporting against a baseline with the "
        "projected outcome rather than the original plan.",
        [
            "Explain the channel formula and its consequence for team size",
            "Plan communication from stakeholder information needs",
            "Choose an appropriate medium and distinguish push from pull",
            "Identify what interferes with a message being understood",
            "Report performance against a baseline",
            "Explain why an original date must not continue to be reported",
            "Run meetings that justify their cost",
            "Explain why large-group communication problems are structural",
        ],
        75,
        _comm_sections,
        [
            ("Channel formula",
             "n(n-1)/2 -- channels grow with the square of team size, which "
             "is why large teams need structure."),
            ("Communications plan",
             "Who needs what information, when, in what form, and who is "
             "responsible for sending it."),
            ("Push communication",
             "Sent to recipients. Suits anything requiring action or "
             "awareness."),
            ("Pull communication",
             "Made available for retrieval. Suits reference material, and "
             "prevents volume."),
            ("Medium mismatch",
             "Using a meeting for information nobody must respond to, which "
             "spends a room's hour on a page."),
            ("Barriers to understanding",
             "Volume, wrong detail level, assumed context, unwelcome bad "
             "news, and no feedback path."),
            ("Reporting against baseline",
             "Status without a comparison conveys nothing -- and what CHANGED "
             "is what a regular reader needs."),
            ("Projected outcome",
             "Reported once it differs from the plan, since repeating an "
             "unachievable date misleads while being accurate."),
        ],
        "Communication is most of a project manager's job for a reason that "
        "is arithmetic rather than temperament: a group of n people has "
        "n(n-1)/2 channels, so five people have ten and fifty have 1,225 -- "
        "and coordination effort therefore grows far faster than team size. "
        "That is why large-group communication problems are STRUCTURAL, and "
        "why adding meetings to a struggling large project adds channels "
        "rather than reducing what must be carried. Communication is planned "
        "from the stakeholder analysis: who needs what, at what detail, how "
        "often, by what medium, and whose job it is to send. Media are matched "
        "to messages, with the classic mismatch being a meeting used to "
        "convey information nobody must respond to; PUSH suits what requires "
        "action and PULL suits reference, since pushing everything produces "
        "the volume that stops people reading. Understanding fails through "
        "volume, wrong detail, assumed context, absent feedback and -- most "
        "consequentially -- bad news being unwelcome, which is why projects "
        "report green until the week they fail. And performance reporting "
        "compares against a BASELINE, states what changed, requests a "
        "specific decision, and reports the PROJECTED outcome rather than an "
        "original date that stopped being achievable.",
        exam_notes=[
            desc(
                "Items describe a communication failure and ask for its cause "
                "or its remedy."
            ),
            ul([
                "Applying the channel formula.",
                "Diagnosing a large project's coordination failure as "
                "structural.",
                "Identifying a medium mismatch.",
                "Distinguishing push from pull.",
                "Explaining why status needs a baseline.",
                "Explaining optimistic reporting as a culture problem.",
                "Costing a meeting correctly.",
            ]),
            desc(
                "When a communication problem appears in a large group, "
                "suspect structure before behaviour. Asking people to "
                "communicate better cannot change how many channels exist, "
                "and reducing the number that must carry anything important "
                "is the only response that scales."
            ),
        ],
    ))

LESSONS = [LESSON_PM_PROC, LESSON_PM_COMM]

"""System Strategy -> System Planning, lesson 3.

Procurement planning: RFI, RFP and supplier selection.

The lesson is organised around which document asks which question, since the
examination's items give a situation and ask which approach to the market
fits it -- and that follows from how well the buyer already knows what they
want.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "System Strategy"
MIDDLE = "System Planning"

_sections = [
    ("Approaching the Market", [
        desc(
            "An organisation that has decided to buy must approach suppliers, "
            "and which document it sends depends on how much it already "
            "knows."
        ),
        table(
            ["Document", "Asks", "Suits"],
            [["Request for information",
              "What exists, and who provides it",
              "The buyer does not yet know what is available"],
             ["Request for quotation",
              "What would this cost",
              "The buyer has a specification and wants a price"],
             ["Request for proposal",
              "How would you meet this need",
              "The buyer knows the need and wants the solution proposed"],
             ["Invitation to tender",
              "A formal competitive submission",
              "Regulation or policy requires a defined process"]],
            caption="Four ways of approaching the market.",
            footer="The choice follows from how well the buyer knows what "
                   "they want. Asking for quotations against a specification "
                   "the buyer is unsure of buys exactly that specification, "
                   "including its errors."),
        desc(
            "A REQUEST FOR PROPOSAL is what buys expertise. The buyer states "
            "the need and the suppliers propose how to meet it, which lets "
            "the response itself be evaluated -- and which is the right "
            "instrument whenever the supplier knows more about the solution "
            "than the buyer does."
        ),
    ]),

    ("Preparing to Go to Market", [
        desc(
            "The work that determines a procurement's outcome is done before "
            "any supplier is contacted."
        ),
        ol([
            "Confirm the requirement is stated well enough to be responded "
            "to, since ambiguity is priced or exploited.",
            "Decide the evaluation criteria and their weights, BEFORE any "
            "response is seen.",
            "Decide the contract type, since it determines who carries the "
            "risk of the work being larger than expected.",
            "Decide who will evaluate, and secure their availability for the "
            "period.",
            "Decide the timetable, allowing suppliers enough time to respond "
            "properly.",
        ]),
        desc(
            "Step five is a self-interested courtesy. A supplier given ten "
            "days for a substantial proposal either declines or submits "
            "something generic, so a compressed timetable reduces the quality "
            "of what the buyer receives rather than the effort they spend."
        ),
    ]),

    ("Evaluation Criteria", [
        desc(
            "How responses will be judged is decided in advance, and the "
            "reason is the same one that makes audit evidence work."
        ),
        table(
            ["Criterion", "Assesses"],
            [["Functional fit", "How much of the need it meets"],
             ["Technical suitability",
              "Whether it works in this environment"],
             ["Supplier capability",
              "Whether they can actually deliver it"],
             ["Financial stability",
              "Whether they will still exist to support it"],
             ["Cost of ownership",
              "The whole life rather than the purchase"],
             ["Contractual terms",
              "What is committed, and what happens when it is not"]],
            caption="Six evaluation criteria.",
            footer="COST OF OWNERSHIP appears here rather than 'price' "
                   "deliberately. A cheaper product with higher licence, "
                   "support and integration costs is dearer, and comparing "
                   "purchase prices selects it reliably."),
        desc(
            "WEIGHTING matters as much as the criteria. Assigning the weights "
            "before responses arrive prevents them being adjusted to suit "
            "whichever proposal is preferred -- which is the same reasoning "
            "that requires audit criteria to precede evidence."
        ),
    ]),

    ("Evaluating Responses", [
        desc(
            "Evaluation applies the criteria consistently, and its structure "
            "is what makes the decision defensible."
        ),
        ul([
            "Score each response against each criterion separately, with the "
            "reasoning recorded.",
            "Use more than one evaluator where judgement is involved, and "
            "reconcile differences by discussion rather than by averaging.",
            "Keep cost evaluation separate from the qualitative assessment "
            "until both are complete.",
            "Verify claims rather than accepting them, through references, "
            "demonstrations or proofs of concept.",
            "Record why each response scored as it did, since unsuccessful "
            "suppliers may ask and the organisation should be able to "
            "answer.",
        ]),
        desc(
            "Separating cost from quality until both are done is what "
            "prevents the price anchoring the judgement. An evaluator who "
            "knows one proposal is cheapest assesses its quality "
            "differently, without intending to."
        ),
    ]),

    ("Verifying What Suppliers Claim", [
        desc(
            "A proposal is a supplier's account of themselves, and the "
            "syllabus expects it to be checked rather than believed."
        ),
        compare_grid(
            "WHAT A PROPOSAL ESTABLISHES AND WHAT IT DOES NOT",
            "The document, against the evidence.",
            [("The proposal establishes",
              ["What the supplier says they can do",
               "How well they write proposals",
               "That they understood the requirement, or appeared to",
               "Their stated price"]),
             ("Verification establishes",
              ["Whether comparable customers found it worked",
               "Whether the product does what was claimed, demonstrated",
               "Whether the named people are actually available",
               "Whether the price holds under the real conditions"])]),
        desc(
            "REFERENCES are worth taking properly. A supplier offers "
            "references who will speak well of them, so the useful questions "
            "are about specifics -- what went wrong, how it was handled, what "
            "they would do differently -- rather than whether the referee was "
            "satisfied."
        ),
        desc(
            "A PROOF OF CONCEPT resolves what neither documents nor "
            "references can: whether the product works in this "
            "organisation's actual environment with its actual data. It costs "
            "time and settles the question that would otherwise be discovered "
            "after contract."
        ),
    ]),

    ("Deciding and Awarding", [
        desc(
            "The evaluation produces a recommendation, and the award is a "
            "decision somebody with authority makes on it."
        ),
        ol([
            "Present the evaluation with its reasoning rather than only its "
            "conclusion.",
            "Confirm the recommended supplier's terms are acceptable before "
            "awarding, since negotiation after award has no leverage.",
            "Award, and record why.",
            "Tell unsuccessful suppliers, with enough explanation to be "
            "useful, since they will bid again.",
            "Keep the evaluation record, since a challenge may come "
            "afterwards.",
        ]),
        desc(
            "Step two carries the commercial weight. A buyer who has "
            "announced a preferred supplier has lost the alternative that "
            "gave them negotiating position, so terms are settled while the "
            "competition is still live."
        ),
    ]),

    ("Where Procurements Go Wrong", [
        desc(
            "The failures are recognisable and mostly occur before any "
            "response arrives."
        ),
        table(
            ["Failure", "Produces"],
            [["An unclear requirement",
              "Responses that cannot be compared, and priced ambiguity"],
             ["Criteria written after responses arrive",
              "An evaluation documenting a decision already made"],
             ["Price weighted above everything",
              "The cheapest supplier, which is a different thing from the "
              "best value"],
             ["Claims accepted without verification",
              "Discovering the gap after contract"],
             ["A compressed timetable",
              "Generic responses from suppliers who could not do better"],
             ["Terms negotiated after award",
              "Whatever the supplier is now willing to offer"]],
            caption="Six procurement failures.",
            footer="Every row happens before or at award, and each is "
                   "cheaper to prevent than to live with. A procurement's "
                   "outcome is mostly determined by preparation rather than "
                   "by negotiation."),
    ]),

    ("Contract Type in the Procurement Decision", [
        desc(
            "The contract chosen at procurement decides who carries the risk "
            "of the work being larger than expected, which is settled before "
            "suppliers respond rather than afterwards."
        ),
        image(fig("procurement-contracts")),
        desc(
            "A FIXED PRICE places that risk on the supplier, so it requires a "
            "specification the supplier can price with confidence. TIME AND "
            "MATERIALS places it on the buyer and suits work whose extent is "
            "genuinely uncertain."
        ),
        desc(
            "The combination to avoid is a fixed price against an uncertain "
            "specification: the supplier prices the uncertainty heavily, and "
            "every clarification afterwards is a change request. Deciding the "
            "contract type therefore depends on the same judgement that "
            "decides which document to send."
        ),
    ]),

    ("Shortlisting", [
        desc(
            "Evaluating every response in full is expensive, so procurements "
            "usually reduce the field before examining anything in depth."
        ),
        ol([
            "Apply the mandatory requirements first -- anything failing one "
            "cannot be selected however good the rest is.",
            "Score the remainder against the weighted criteria at a level "
            "the written responses support.",
            "Take forward a small number, since detailed evaluation costs "
            "the buyer and the suppliers.",
            "Tell those not shortlisted promptly, so they can redeploy their "
            "own effort.",
            "Examine the shortlist properly -- demonstrations, references, "
            "and a proof of concept where it matters.",
        ]),
        desc(
            "The MANDATORY requirements must be genuinely mandatory. Marking "
            "something essential that the organisation would actually accept "
            "without excludes suppliers unnecessarily, and marking something "
            "desirable that it genuinely cannot do without lets an unusable "
            "proposal through."
        ),
    ]),

    ("Fairness in the Process", [
        desc(
            "A competitive process only produces a defensible outcome if "
            "every participant was treated the same way."
        ),
        ul([
            "Every supplier receives the same information, including answers "
            "to any one supplier's question.",
            "Every supplier has the same deadline, and extensions apply to "
            "all of them.",
            "The criteria applied are the ones published, without additions "
            "afterwards.",
            "Existing suppliers get no advantage from what they already know "
            "that others were not told.",
            "The record shows how each response was assessed, since a "
            "challenge may follow.",
        ]),
        desc(
            "The fourth point is the hardest in practice. An incumbent "
            "genuinely knows more about the environment, and the remedy is "
            "putting that knowledge into the specification so everybody has "
            "it -- rather than pretending the advantage does not exist."
        ),
    ]),

    ("What Follows the Award", [
        desc(
            "Procurement does not end at signature, and what was agreed has "
            "to survive into delivery."
        ),
        table(
            ["Carried forward", "So that"],
            [["The specification",
              "Acceptance is judged against what was actually agreed"],
             ["The supplier's proposal",
              "Commitments made in it are not quietly forgotten"],
             ["The evaluation record",
              "Why this supplier was chosen remains answerable"],
             ["The agreed service levels",
              "Performance can be managed against them"],
             ["The exit provisions",
              "Leaving remains possible on known terms"]],
            caption="Five things that outlive the procurement.",
            footer="The second row matters more than it appears. Proposals "
                   "contain commitments -- named staff, methods, timescales "
                   "-- that are frequently not repeated in the contract, and "
                   "incorporating the proposal by reference is what keeps "
                   "them binding."),
        desc(
            "Handing all of this to whoever will manage the supplier is part "
            "of the procurement rather than an afterthought. A contract "
            "managed by somebody who never saw the evaluation cannot hold the "
            "supplier to what persuaded the buyer to choose them."
        ),
    ]),

    ("Buying From an Existing Supplier", [
        desc(
            "Extending an existing relationship avoids a competitive process, "
            "and the syllabus expects the trade to be seen clearly."
        ),
        compare_grid(
            "EXTENDING AGAINST COMPETING AGAIN",
            "Convenience against price discovery.",
            [("Extending",
              ["No procurement cost, and no delay",
               "The supplier already knows the environment",
               "No price discovery, so the price is whatever is offered",
               "Dependence deepens with each extension"]),
             ("Competing",
              ["Establishes what the market would charge",
               "Brings alternative approaches into view",
               "Costs both parties time and effort",
               "May produce the same supplier, now priced"])]),
        desc(
            "The decisive question is whether the organisation would "
            "genuinely switch. A competition run by a buyer who cannot "
            "realistically move consumes everybody's effort and produces no "
            "price discovery, because the incumbent knows it as well as the "
            "buyer does."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where procurement planning items are lost."),
        ul([
            "Sending a request for quotation when the buyer is unsure of the "
            "specification.",
            "Writing evaluation criteria after seeing responses.",
            "Comparing purchase prices rather than cost of ownership.",
            "Accepting proposal claims without verification.",
            "Letting price anchor the qualitative assessment by evaluating "
            "both together.",
            "Compressing the timetable, which reduces response quality rather "
            "than buyer effort.",
            "Announcing a preferred supplier before terms are agreed.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A buyer issues a request for quotation against a specification "
            "it is unsure of. Responses are priced and one is selected. What "
            "follows?\""
        ),
        ol([
            "A request for quotation asks for a price against a stated "
            "specification, so suppliers priced exactly what was written.",
            "Where the specification was uncertain, they priced the buyer's "
            "uncertainty -- including whichever readings were cheapest.",
            "As the buyer's understanding improves, the differences become "
            "changes to what was contracted.",
            "Each is a change request, priced by an appointed supplier "
            "without competitive pressure.",
            "A request for PROPOSAL would have asked suppliers how to meet "
            "the need, letting their expertise contribute and letting the "
            "buyer evaluate the approach as well as the price.",
        ]),
        desc(
            "The general rule is that the instrument follows the buyer's "
            "certainty. Quotations suit a specification the buyer is "
            "confident in; proposals suit a need the buyer understands "
            "without knowing how to meet it -- and using the first for the "
            "second buys the buyer's own uncertainty at a price."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Procurement planning links the categories."),
        ul([
            "The specification comes from the previous lesson.",
            "Contract type and risk allocation are Project Procurement.",
            "Criteria before responses is the same discipline audit applies "
            "to evidence.",
            "Cost of ownership comes from the investment appraisal lesson.",
            "Supplier assessment includes the security review of that "
            "category.",
            "The award begins the supplier management of Service "
            "Management.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What decides which document to send",
              "How well the buyer already knows what they want",
              "Quotations for a confident specification; proposals for a need "
              "without a solution."),
             ("When evaluation criteria are set",
              "Before any response is seen",
              "Otherwise they describe the preferred proposal and document a "
              "decision already made."),
             ("What is compared rather than price",
              "Cost of ownership",
              "A cheap product with high support and integration costs is "
              "dearer."),
             ("Why cost is evaluated separately from quality",
              "Knowing which is cheapest anchors the quality judgement",
              "Without the evaluator intending it."),
             ("What a proposal establishes",
              "What the supplier says, and how well they write",
              "Verification establishes whether any of it is so."),
             ("When terms are agreed",
              "Before the award is announced",
              "A buyer with a preferred supplier has lost their negotiating "
              "position.")]),
    ]),
]

_quiz = [
    mcq("HARD",
        "A buyer issues a request for quotation against a specification it is "
        "unsure of.\n\nWhat follows?",
        [("Suppliers price the buyer's uncertainty, and clarifications become "
          "priced change requests", True),
         ("Suppliers raise clarification questions before pricing the "
          "work", False),
         ("The lowest price will reflect the most efficient "
          "approach", False),
         ("The specification will be corrected during contract "
          "negotiation", False)],
        "A quotation prices what was written, so an uncertain specification "
        "is priced including whichever readings are cheapest. As the buyer's "
        "understanding improves, the differences become changes negotiated "
        "with an appointed supplier and no competitive pressure. A request "
        "for PROPOSAL would have asked how to meet the need and let the "
        "supplier's expertise contribute."),

    mcq("AVERAGE",
        "Which document asks suppliers how they would meet a stated need?",
        [("A request for proposal", True),
         ("A request for quotation", False),
         ("A request for information", False),
         ("An invitation to tender", False)],
        "A request for proposal states the need and invites suppliers to "
        "propose a solution, so the approach itself is part of what is "
        "evaluated -- which is the right instrument whenever the supplier "
        "knows more about the solution than the buyer. A quotation prices a "
        "specification the buyer has already written."),

    mcq("HARD",
        "Why should cost be evaluated separately from the qualitative "
        "assessment?",
        [("Knowing which proposal is cheapest anchors the quality "
          "judgement", True),
         ("Cost evaluation requires different expertise from technical "
          "evaluation", False),
         ("Combining them prevents the weightings being applied "
          "correctly", False),
         ("Suppliers may submit revised prices during the "
          "evaluation", False),
         ],
        "An evaluator who knows a proposal is cheapest assesses its quality "
        "differently without intending to, and the effect works in both "
        "directions. Completing the qualitative assessment before the prices "
        "are opened means the quality judgement stands on its own, which is "
        "what makes combining them afterwards meaningful."),

    mcq("AVERAGE",
        "Why must evaluation criteria be fixed before responses are "
        "received?",
        [("Criteria set afterwards tend to describe the preferred "
          "response", True),
         ("Suppliers must be told the criteria in the invitation", False),
         ("Late criteria cannot be weighted consistently", False),
         ("Procurement regulations mandate published criteria "
          "everywhere", False)],
        "Once responses are visible, criteria drift towards whichever one "
        "seems best, and the evaluation then documents a decision already "
        "made rather than making one. It is the same discipline that requires "
        "audit criteria to precede the evidence, and for the same reason: an "
        "assessment against a standard chosen afterwards proves nothing."),

    mcq("HARD",
        "What does comparing purchase prices rather than cost of ownership "
        "reliably select?",
        [("A product that is cheap to buy and expensive to own", True),
         ("The supplier with the most efficient delivery "
          "approach", False),
         ("The option with the shortest implementation "
          "timescale", False),
         ("The proposal offering the fewest optional extras", False)],
        "Licence renewals, support charges, integration effort and the cost "
        "of eventually leaving all continue after purchase and frequently "
        "exceed it. Comparing what is paid on day one therefore favours "
        "whatever front-loads least and charges most afterwards, which is why "
        "the criterion is cost of OWNERSHIP."),

    mcq("AVERAGE",
        "What does a supplier's proposal establish?",
        [("What they say they can do, and how well they write "
          "proposals", True),
         ("Their technical capability to deliver the work", False),
         ("Their financial stability over the contract term", False),
         ("Whether their product works in the buyer's "
          "environment", False)],
        "A proposal is a supplier's account of themselves, produced by "
        "people who write proposals for a living. Capability, stability and "
        "whether the product actually works here are established by "
        "verification -- references asked specific questions, demonstrations, "
        "financial checks and a proof of concept."),

    mcq("HARD",
        "How should supplier references be used?",
        [("By asking specific questions about what went wrong and how it was "
          "handled", True),
         ("By confirming that the referee was satisfied with the "
          "supplier", False),
         ("By checking the reference organisations are comparable in "
          "size", False),
         ("By contacting references the supplier did not "
          "nominate", False)],
        "A supplier offers references who will speak well of them, so asking "
        "whether they were satisfied confirms only that the supplier chose "
        "well. What went wrong, how the supplier responded and what the "
        "referee would do differently are answerable honestly and tell you "
        "how the supplier behaves when a project is difficult."),

    mcq("AVERAGE",
        "Why should contract terms be agreed before a supplier is announced "
        "as preferred?",
        [("Announcing a preference removes the alternative that provided "
          "leverage", True),
         ("Terms cannot be varied once an award has been "
          "recorded", False),
         ("Unsuccessful suppliers must be informed of the final "
          "terms", False),
         ("The evaluation cannot be completed until terms are "
          "settled", False)],
        "A buyer negotiating with a supplier who knows they have already been "
        "chosen has no credible alternative, and the supplier knows it. "
        "Settling the terms while the competition is still live is what "
        "preserves the position that the competitive process created."),

    mcq("HARD",
        "A procurement compresses its timetable, giving suppliers ten days "
        "for a substantial proposal.\n\nWhat is the effect?",
        [("Capable suppliers decline or submit generic responses", True),
         ("Suppliers submit the same proposals more quickly", False),
         ("Prices rise to cover the compressed preparation", False),
         ("Only suppliers with existing relationships can "
          "respond", False),
         ],
        "A supplier who cannot prepare a proper response either does not bid "
        "-- which removes them from consideration -- or submits something "
        "generic that does not address the specific requirement. Either way "
        "the buyer receives worse options, so compressing the timetable "
        "reduces the quality of what arrives rather than the buyer's own "
        "effort."),

    mcq("AVERAGE",
        "What question does a proof of concept answer that references and "
        "documents cannot?",
        [("Whether the product works in this environment with this "
          "data", True),
         ("Whether the supplier has delivered similar work "
          "before", False),
         ("Whether the price is competitive against alternatives", False),
         ("Whether the supplier's staff are suitably "
          "qualified", False)],
        "Documents describe what a product does in general and references "
        "describe how it worked somewhere else. Whether it works with this "
        "organisation's data volumes, integrations and constraints is "
        "answerable only by trying it -- and it is the question otherwise "
        "discovered after the contract is signed."),
]

LESSON_SYS_PROC = lesson(
    MAJOR, MIDDLE,
    "Procurement Planning: RFI, RFP and Supplier Selection",
    _quiz,
    lesson_structure(
        "Procurement Planning: RFI, RFP and Supplier Selection",
        "Which document a buyer sends to the market follows from how well "
        "they already know what they want -- a quotation prices a "
        "specification the buyer is confident in, while a PROPOSAL asks "
        "suppliers how to meet a need and lets their expertise contribute. "
        "This lesson covers preparing before any supplier is contacted, "
        "setting evaluation criteria and weights BEFORE responses arrive, "
        "comparing cost of ownership rather than purchase price, verifying "
        "what proposals claim rather than believing it, and settling terms "
        "while the competition is still live -- since a buyer with an "
        "announced preferred supplier has lost the leverage the process "
        "created.",
        [
            "Choose the right market instrument for a stated situation",
            "Prepare a procurement before approaching suppliers",
            "Set evaluation criteria and weights in advance",
            "Compare cost of ownership rather than purchase price",
            "Evaluate responses consistently and separate cost from quality",
            "Verify supplier claims through references and proofs of concept",
            "Explain why terms are settled before award",
            "Identify the recurring procurement failures",
        ],
        75,
        _sections,
        [
            ("Request for information",
             "Asks what exists and who provides it, before the buyer knows "
             "what is available."),
            ("Request for quotation",
             "Asks for a price against a specification the buyer has already "
             "written."),
            ("Request for proposal",
             "Asks suppliers how they would meet a need, so the approach is "
             "evaluated too."),
            ("Evaluation criteria",
             "Set and weighted before responses are seen, or the evaluation "
             "documents a decision already made."),
            ("Cost of ownership",
             "The whole life rather than the purchase. Comparing prices "
             "selects what is cheap to buy and dear to own."),
            ("Separating cost from quality",
             "Assessing quality before prices are opened, since price anchors "
             "the judgement otherwise."),
            ("Verification",
             "References asked specific questions, demonstrations, and a "
             "proof of concept in this environment."),
            ("Settling terms before award",
             "While the competition is live, since announcing a preference "
             "removes the leverage."),
        ],
        "Which instrument a buyer sends follows from how much they already "
        "know: a request for INFORMATION when they do not know what exists, a "
        "QUOTATION when they have a specification they are confident in, a "
        "PROPOSAL when they know the need and want suppliers to say how they "
        "would meet it, and a formal tender where regulation requires one. "
        "Using a quotation for an uncertain specification buys the buyer's "
        "own uncertainty at a price, since every later clarification becomes "
        "a change negotiated without competition. Preparation determines the "
        "outcome: the requirement stated clearly, the criteria and weights "
        "fixed BEFORE any response is seen, the contract type chosen, and a "
        "timetable long enough that capable suppliers can respond properly -- "
        "since compressing it reduces the quality of what arrives rather than "
        "the buyer's effort. Evaluation compares COST OF OWNERSHIP rather "
        "than price, keeps cost separate from the qualitative assessment "
        "until both are complete, and VERIFIES what proposals claim through "
        "specific reference questions and a proof of concept in this "
        "environment. And terms are settled before a preference is announced, "
        "because a buyer with no alternative has none of the leverage the "
        "competition created.",
        exam_notes=[
            desc(
                "Items describe a procurement approach and ask what will "
                "follow from it."
            ),
            ul([
                "Choosing the instrument for a stated level of certainty.",
                "Explaining why criteria precede responses.",
                "Explaining what comparing prices selects.",
                "Explaining why cost is separated from quality.",
                "Stating what a proposal establishes and what it does not.",
                "Using references properly.",
                "Explaining why terms precede the award.",
            ]),
            desc(
                "For any procurement item, ask what the buyer knew when they "
                "approached the market. The instrument, the criteria and the "
                "eventual disputes all follow from that, and using an "
                "instrument that assumes more certainty than the buyer had is "
                "the commonest failure."
            ),
        ],
    ))

LESSONS = [LESSON_SYS_PROC]

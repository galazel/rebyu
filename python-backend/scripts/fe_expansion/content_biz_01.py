"""Business Strategy -> Business Strategy Management, lessons 1 and 2.

Business strategy techniques and competitive analysis, and marketing.

The strategy lesson treats the analytical frameworks as prompts for decisions
rather than as answers, since the examination asks what each one is FOR --
and a framework filled in and not acted on has described a situation rather
than decided anything.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Business Strategy"
MIDDLE = "Business Strategy Management"

# ==========================================================================
# Lesson 1: Strategy techniques
# ==========================================================================

_strat_sections = [
    ("What a Strategy Decides", [
        desc(
            "A business strategy decides what the organisation will do, for "
            "whom, and how it will be different from the alternatives -- and "
            "its hardest part is deciding what it will NOT do."
        ),
        table(
            ["A strategy states", "Which rules out"],
            [["Which customers it serves",
              "Serving everybody, which serves nobody particularly"],
             ["What it offers them",
              "Offering whatever any customer requests"],
             ["Why they should choose it",
              "Competing on nothing in particular"],
             ["Where it will not compete",
              "Pursuing every opportunity that appears"]],
            caption="Four statements a strategy makes.",
            footer="The last row is what gives a strategy its force. A "
                   "statement of everything the organisation might pursue "
                   "permits everything and therefore decides nothing, which "
                   "is why exclusions matter as much as intentions."),
    ]),

    ("Analysing the Position", [
        desc(
            "Strategy begins with an honest description of where the "
            "organisation stands, internally and externally."
        ),
        image(fig("swot-grid")),
        desc(
            "SWOT separates the internal -- strengths and weaknesses, which "
            "the organisation can change -- from the external, which it "
            "cannot. Both are assessed RELATIVE to competitors rather than "
            "absolutely, since being good at something everybody is good at "
            "is not a strength."
        ),
        desc(
            "The technique's value is the MATCHING rather than the lists. "
            "Which strength addresses which opportunity, and which weakness "
            "is exposed to which threat -- a completed grid with no such "
            "pairing has described a situation and decided nothing."
        ),
    ]),

    ("Analysing the Industry", [
        desc(
            "How much profit an industry can sustain depends on its "
            "structure, and the syllabus expects the five forces that shape "
            "it."
        ),
        image(fig("competitive-forces")),
        table(
            ["Force", "Reduces profitability when"],
            [["Rivalry among existing firms",
              "Competitors are numerous and similar"],
             ["Threat of new entrants",
              "Entry is easy and requires little investment"],
             ["Threat of substitutes",
              "Buyers can meet the need another way entirely"],
             ["Buyer power",
              "Buyers are few, large, or can switch easily"],
             ["Supplier power",
              "Suppliers are few, or what they provide is essential"]],
            caption="Five forces and what makes each one stronger.",
            footer="SUBSTITUTES are the force analysis most often misses, "
                   "because they come from outside the industry. A "
                   "competitor makes a similar product; a substitute meets "
                   "the same need in a way nobody in the industry "
                   "recognised."),
        desc(
            "The purpose is deciding where to compete and how to position. An "
            "industry where every force is strong sustains little profit for "
            "anybody, and recognising that before entering is more valuable "
            "than any amount of competing well within it."
        ),
    ]),

    ("Generic Strategies", [
        desc(
            "The syllabus names three ways of competing, and the point is "
            "that they are alternatives rather than a menu."
        ),
        compare_grid(
            "THREE WAYS OF COMPETING",
            "Each requires different capabilities and excludes the others.",
            [("Cost leadership and differentiation",
              ["COST: be the lowest-cost producer, and price accordingly",
               "Requires scale, efficiency and relentless cost discipline",
               "DIFFERENTIATION: offer something buyers value and will pay "
               "for",
               "Requires investment in whatever creates that difference"]),
             ("Focus, and the trap",
              ["FOCUS: serve one segment better than generalists can",
               "Either on cost or on differentiation, within that segment",
               "The TRAP is pursuing cost and differentiation together",
               "Which produces neither, at the cost of both"])]),
        desc(
            "STUCK IN THE MIDDLE is the syllabus's term for that trap. An "
            "organisation investing in differentiation while trying to "
            "undercut on price carries the cost of one and the margins of the "
            "other, and loses to specialists at both ends."
        ),
    ]),

    ("Managing a Portfolio", [
        desc(
            "An organisation with several products must decide where to "
            "invest, and the growth-share framework is the prompt the "
            "syllabus names."
        ),
        image(fig("product-portfolio")),
        table(
            ["Position", "Typically", "Decision"],
            [["High growth, high share",
              "Consumes cash and earns it", "Invest -- it is the future"],
             ["High growth, low share",
              "Consumes cash", "Invest heavily, or exit"],
             ["Low growth, high share",
              "Generates cash", "Harvest, and fund the others"],
             ["Low growth, low share",
              "Little of either", "Divest, releasing the resources"]],
            caption="Four positions and what each argues for.",
            footer="The framework's purpose is FUNDING: cash from mature "
                   "products pays for growing ones. A portfolio entirely of "
                   "mature products has no future and one entirely of growing "
                   "products has no money."),
        desc(
            "Its weakness is treating market share as the only measure of "
            "position, which is why the syllabus presents it as a prompt to "
            "decide rather than a conclusion. A small share of a market the "
            "organisation dominates a niche within is not the same as a small "
            "share generally."
        ),
    ]),

    ("Where Value Is Created", [
        desc(
            "An organisation's activities can be examined to find where it "
            "actually adds value competitors do not."
        ),
        image(fig("value-chain")),
        desc(
            "The VALUE CHAIN separates primary activities -- inbound "
            "logistics, operations, outbound logistics, marketing and sales, "
            "service -- from the support activities that enable them: "
            "procurement, technology development, human resources and "
            "infrastructure."
        ),
        desc(
            "The purpose is locating the few activities where the "
            "organisation is genuinely better, since those are where "
            "investment belongs and where technology should be applied "
            "first. They are rarely where the costs are highest, which is why "
            "the analysis is worth doing rather than assuming."
        ),
    ]),

    ("Growing", [
        desc(
            "Growth comes from products and markets, and the combinations "
            "differ enormously in risk."
        ),
        table(
            ["", "Existing market", "New market"],
            [["Existing product", "Sell more of it -- lowest risk",
              "New markets for what you have -- moderate"],
             ["New product", "New products for existing customers -- "
                             "moderate",
              "New products in new markets -- highest risk"]],
            caption="Four growth directions by risk.",
            footer="The bottom right corner changes BOTH variables at once, "
                   "so the organisation is learning a market and a product "
                   "simultaneously with nothing familiar to fall back on. It "
                   "is where diversification failures come from."),
        desc(
            "Growth can also come from acquiring or partnering rather than "
            "building. Each buys speed and pays in integration difficulty and "
            "in acquiring things the organisation did not want alongside what "
            "it did."
        ),
    ]),

    ("The External Environment", [
        desc(
            "Beyond the industry sit forces the organisation shares with "
            "everybody, and scanning them systematically is what stops them "
            "being noticed late."
        ),
        table(
            ["Factor", "Example of a change that matters"],
            [["Political", "A change of government policy or trade "
                           "arrangement"],
             ["Economic", "Interest rates, exchange rates, a recession"],
             ["Social", "Demographics, working patterns, what people "
                        "expect"],
             ["Technological",
              "A capability that makes something previously impossible "
              "routine"],
             ["Legal", "New obligations, or new liabilities"],
             ["Environmental", "Resource costs, and regulation of impact"]],
            caption="Six categories of external factor.",
            footer="The purpose is systematic COVERAGE rather than insight. "
                   "Organisations notice changes in the areas they already "
                   "watch, and the categories exist to prompt attention "
                   "where nobody is looking."),
        desc(
            "The technological row deserves particular attention in this "
            "certification, since a capability becoming cheap enough to be "
            "routine reshapes industries that had nothing to do with "
            "technology -- and it does so from outside, exactly as a "
            "substitute does."
        ),
    ]),

    ("Core Competence", [
        desc(
            "An organisation's durable advantage comes from what it can do "
            "that others cannot easily acquire."
        ),
        ul([
            "It must contribute meaningfully to what customers value.",
            "It must be difficult for competitors to imitate or buy.",
            "It should be applicable across more than one product or "
            "market.",
            "It is usually a combination of skills and processes rather than "
            "any single asset.",
            "Anything purchasable is available to competitors on the same "
            "terms, so it is not one.",
        ]),
        desc(
            "The last point is the practical test and it connects directly to "
            "the sourcing decisions of System Strategy: an organisation "
            "outsourcing a core competence has transferred what "
            "distinguished it to somebody who will also sell it to others."
        ),
    ]),

    ("Turning Strategy Into Action", [
        desc(
            "A strategy that changes nothing about what people do has not "
            "been implemented, whatever was written."
        ),
        ol([
            "Translate it into objectives somebody is accountable for.",
            "Align the measures, since people work towards what is "
            "measured.",
            "Allocate resources consistently with it, since a strategy "
            "unfunded is an aspiration.",
            "Communicate it in a form the people making daily decisions can "
            "apply.",
            "Review whether it is being followed, and whether it is still "
            "right.",
        ]),
        desc(
            "The second step causes the most damage when it is skipped. "
            "Measures inconsistent with the strategy defeat it reliably, "
            "since people respond to what they are judged on rather than to "
            "what the document says."
        ),
    ]),

    ("Alliances and Partnerships", [
        desc(
            "An organisation can obtain capability by working with another "
            "rather than by building or buying it."
        ),
        table(
            ["Arrangement", "Suits", "Risks"],
            [["A supply relationship", "A clearly defined input",
              "Dependence, and the supplier's own priorities"],
             ["A joint venture", "Sharing a substantial investment",
              "Divided control, and unwinding it later"],
             ["A licensing arrangement",
              "Using somebody's technology or brand",
              "The terms, and what happens at renewal"],
             ["An acquisition", "Speed, and taking the capability outright",
              "Integration, and acquiring what you did not want"]],
            caption="Four arrangements, with what each suits and risks.",
            footer="Every one shares a difficulty: the partner's interests "
                   "are their own, and an arrangement depending on them "
                   "coinciding indefinitely will eventually be tested by "
                   "circumstances neither party planned for."),
        desc(
            "The judgement is what each party contributes and what each "
            "extracts. An alliance where one side learns the other's "
            "capability and the other learns nothing ends when the learning "
            "is complete -- which is a foreseeable outcome rather than a "
            "betrayal."
        ),
    ]),

    ("Measuring Strategic Performance", [
        desc(
            "Financial results describe what already happened, so strategy "
            "needs measures that indicate where things are going."
        ),
        compare_grid(
            "LAGGING AGAINST LEADING MEASURES",
            "What happened, against what is about to.",
            [("Lagging",
              ["Revenue, profit, market share",
               "Unambiguous and comparable",
               "Report a period that has closed",
               "Nothing can now be done about them"]),
             ("Leading",
              ["Customer satisfaction, pipeline, staff retention",
               "Indicate what the lagging measures will show later",
               "Noisier, and open to interpretation",
               "Something can still be done"])]),
        desc(
            "A BALANCED set is what the syllabus recommends: financial "
            "results alongside customer, internal process and learning "
            "measures, so that improving this quarter's figures at the "
            "expense of next year's capability is visible rather than "
            "rewarded."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where strategy items are lost."),
        ul([
            "Completing a SWOT without matching strengths to opportunities, "
            "which describes rather than decides.",
            "Assessing strengths absolutely rather than relative to "
            "competitors.",
            "Missing substitutes, since they come from outside the "
            "industry.",
            "Pursuing cost leadership and differentiation together, which "
            "achieves neither.",
            "Treating the portfolio grid as a conclusion rather than a prompt "
            "to decide.",
            "Investing where costs are highest rather than where value is "
            "created.",
            "Diversifying into a new product and a new market at once.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A company invests heavily in product features while running a "
            "price-cutting campaign against a low-cost competitor. Margins "
            "fall and it loses share at both ends. What happened?\""
        ),
        ol([
            "Identify what it is doing: differentiating through features, and "
            "competing on price simultaneously.",
            "Differentiation requires investment, which raises cost per "
            "unit.",
            "Cost leadership requires the lowest cost base, which the "
            "investment prevents.",
            "So it carries a differentiator's costs and a cost leader's "
            "prices, which is the worst combination available.",
            "This is STUCK IN THE MIDDLE: specialists at each end beat it, "
            "since each is optimised for what it is only half doing.",
        ]),
        desc(
            "The item is constructed so that both activities look sensible "
            "individually. Investing in the product is good and competing on "
            "price is good, and the strategic error is that they require "
            "opposite things and cannot both be pursued."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Business strategy sits above the technology categories."),
        ul([
            "Information systems strategy derives from this, which is what "
            "alignment means.",
            "The value chain identifies where technology investment should "
            "go.",
            "Portfolio decisions are the level above project selection.",
            "Competitive analysis informs the make-or-buy decision.",
            "Strategy is what governance holds management accountable "
            "for pursuing.",
            "Business systems in a later lesson support these activities.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What gives a strategy its force",
              "What it rules out",
              "A statement permitting everything decides nothing."),
             ("What makes a SWOT useful",
              "Matching strengths to opportunities and weaknesses to threats",
              "Four lists without pairing have described a situation."),
             ("The force most often missed",
              "Substitutes",
              "They come from outside the industry, meeting the need a way "
              "nobody in it recognised."),
             ("What stuck in the middle means",
              "Pursuing cost leadership and differentiation together",
              "Carrying one's costs and the other's prices, losing to "
              "specialists at both ends."),
             ("What the portfolio grid is for",
              "Funding -- mature products paying for growing ones",
              "A portfolio of only one kind has either no future or no "
              "money."),
             ("The riskiest growth direction",
              "A new product in a new market",
              "Both variables change at once, with nothing familiar to fall "
              "back on.")]),
    ]),
]

_strat_quiz = [
    mcq("HARD",
        "A company invests heavily in features while cutting prices against a "
        "low-cost rival, and loses share at both ends.\n\n"
        "What is this?",
        [("Stuck in the middle -- pursuing differentiation and cost "
          "leadership together", True),
         ("A failure of market segmentation, targeting two segments at "
          "once", False),
         ("An inappropriate response to a price war it should have "
          "avoided", False),
         ("Diversification into a market it did not understand", False)],
        "Differentiation requires investment that raises unit cost; cost "
        "leadership requires the lowest cost base. Pursuing both means "
        "carrying a differentiator's costs and charging a cost leader's "
        "prices, which loses to specialists optimised for each. Both "
        "activities look sensible alone, and the error is that they require "
        "opposite things."),

    mcq("AVERAGE",
        "A SWOT analysis becomes useful rather than merely descriptive "
        "through one thing.\n\nWhich?",
        [("Matching strengths to opportunities and weaknesses to "
          "threats", True),
         ("Listing every factor the organisation can identify", False),
         ("Distinguishing internal factors from external ones", False),
         ("Ranking each factor by its likely impact", False)],
        "Four populated lists describe a situation; the analysis is which "
        "strength could address which opportunity and which weakness is "
        "exposed to which threat. That pairing is what produces a course of "
        "action. Separating internal from external is a prerequisite for the "
        "matching rather than the point of it."),

    mcq("HARD",
        "Which of the five competitive forces is most often overlooked?",
        [("The threat of substitutes", True),
         ("The bargaining power of suppliers", False),
         ("Rivalry among existing competitors", False),
         ("The threat of new entrants", False)],
        "Substitutes come from outside the industry: they meet the same "
        "customer need by a route nobody within it is watching. Competitors, "
        "entrants and suppliers are all visible from inside, which is exactly "
        "why they get analysed and a substitute arrives without anybody "
        "having modelled it."),

    mcq("AVERAGE",
        "Why must strengths be assessed relative to competitors?",
        [("Being good at something everybody is good at is not a "
          "strength", True),
         ("Absolute assessments cannot be quantified "
          "consistently", False),
         ("Competitors' weaknesses define the available "
          "opportunities", False),
         ("Relative assessment reveals which weaknesses matter "
          "most", False)],
        "A strength is something the organisation does better than the "
        "alternatives, and a capability everybody in the industry has is a "
        "requirement for participating rather than an advantage. Assessing "
        "absolutely produces a flattering list of competences that provide no "
        "competitive position at all."),

    mcq("HARD",
        "What is the growth-share portfolio framework actually for?",
        [("Allocating cash from mature products to growing ones", True),
         ("Identifying which products to discontinue", False),
         ("Measuring each product's profitability", False),
         ("Comparing the organisation's position against "
          "competitors", False)],
        "The framework's purpose is FUNDING: products generating cash in slow "
        "markets pay for those consuming it in growing ones. A portfolio "
        "entirely of mature products has no future and one entirely of "
        "growing products has no money. Discontinuation is one decision it "
        "prompts rather than the reason for it."),

    mcq("AVERAGE",
        "Which growth direction carries the highest risk?",
        [("A new product in a new market", True),
         ("An existing product in a new market", False),
         ("A new product for existing customers", False),
         ("Selling more of an existing product to existing "
          "customers", False)],
        "Changing both variables at once means learning a market and a "
        "product simultaneously with nothing familiar to fall back on -- so "
        "when something goes wrong, it is not clear whether the product or "
        "the market was the problem. It is where diversification failures "
        "come from, and it is undertaken deliberately rather than by "
        "drift."),

    mcq("HARD",
        "A value chain analysis identifies something specific.\n\n"
        "What?",
        [("The few activities where the organisation adds value competitors "
          "do not", True),
         ("The activities consuming the largest share of "
          "costs", False),
         ("The sequence in which products move through the "
          "organisation", False),
         ("Which activities could be outsourced most easily", False)],
        "The purpose is locating where the organisation is genuinely better, "
        "since that is where investment and technology belong. Those "
        "activities are rarely the most expensive ones -- which is why the "
        "analysis is done rather than assumed, and why it frequently "
        "redirects investment away from where instinct sends it."),

    mcq("AVERAGE",
        "What does a strategy's statement of what it will NOT do "
        "provide?",
        [("Force, since a statement permitting everything decides "
          "nothing", True),
         ("Protection against competitors entering those "
          "areas", False),
         ("A basis for measuring performance against the "
          "plan", False),
         ("Clarity for regulators about the organisation's "
          "scope", False)],
        "A strategy listing everything the organisation might pursue rules "
        "out nothing, so every opportunity remains arguable and effort "
        "spreads. Stating where it will not compete is what makes the "
        "strategy decide something -- and it is the part organisations find "
        "hardest to write, for exactly that reason."),

    mcq("HARD",
        "An industry has many similar competitors, easy entry, powerful "
        "buyers and available substitutes.\n\nWhat does this indicate?",
        [("Little sustainable profit for anybody in it", True),
         ("An opportunity for a well-executed differentiation "
          "strategy", False),
         ("A market approaching maturity and consolidation", False),
         ("A need for the organisation to reduce its cost base", False)],
        "Each force reduces the profit an industry can sustain, and several "
        "strong at once means competitive pressure from every direction. "
        "Recognising that before committing is more valuable than competing "
        "well inside it -- which is what the analysis exists to support, "
        "since the alternative is discovering it after investing."),

    mcq("AVERAGE",
        "What does focus as a generic strategy mean?",
        [("Serving one segment better than generalists can, on cost or "
          "differentiation", True),
         ("Concentrating investment on the organisation's strongest "
          "product", False),
         ("Pursuing both cost leadership and differentiation in a narrow "
          "market", False),
         ("Reducing the range of activities to control costs", False)],
        "Focus applies one of the other two strategies within a narrow "
        "segment, where a specialist can serve a particular need better than "
        "an organisation serving everybody. It does not escape the choice "
        "between cost and differentiation -- pursuing both within a segment "
        "produces the same stuck-in-the-middle result."),
]

LESSON_BIZ_STRAT = lesson(
    MAJOR, MIDDLE,
    "Business Strategy Techniques and Competitive Analysis",
    _strat_quiz,
    lesson_structure(
        "Business Strategy Techniques and Competitive Analysis",
        "A strategy decides what an organisation does, for whom, and how it "
        "differs -- and its hardest part is stating what it will NOT do, "
        "since a statement permitting everything decides nothing. This lesson "
        "treats the analytical frameworks as prompts for decisions rather "
        "than as answers: SWOT is useful only through the MATCHING, the five "
        "forces expose the substitutes that come from outside the industry, "
        "the generic strategies are alternatives whose combination produces "
        "the stuck-in-the-middle failure, and the portfolio grid exists to "
        "allocate cash from mature products to growing ones rather than to "
        "classify anything.",
        [
            "State what a strategy decides, including its exclusions",
            "Apply SWOT and explain what makes it useful",
            "Analyse an industry with the five forces",
            "Explain why substitutes are the force most often missed",
            "Distinguish the generic strategies and explain the middle trap",
            "Use the portfolio framework for its funding purpose",
            "Locate value creation with a value chain analysis",
            "Compare growth directions by risk",
        ],
        80,
        _strat_sections,
        [
            ("Strategic exclusion",
             "What the organisation will not do -- what gives a strategy its "
             "force."),
            ("SWOT matching",
             "Pairing strengths with opportunities and weaknesses with "
             "threats. The lists alone decide nothing."),
            ("Five forces",
             "Rivalry, entrants, substitutes, buyer power, supplier power -- "
             "shaping sustainable profitability."),
            ("Substitutes",
             "Meeting the same need from outside the industry. The force most "
             "often missed."),
            ("Cost leadership",
             "Competing as the lowest-cost producer, requiring scale and cost "
             "discipline."),
            ("Differentiation",
             "Offering something buyers value and will pay for, requiring "
             "investment."),
            ("Stuck in the middle",
             "Pursuing both -- a differentiator's costs and a cost leader's "
             "prices, beaten at both ends."),
            ("Growth-share portfolio",
             "A prompt to decide where to invest, funding growth from mature "
             "products."),
            ("Value chain",
             "Primary and support activities, examined to find where the "
             "organisation genuinely adds value."),
        ],
        "A strategy states which customers, what offering, why they should "
        "choose it, and -- most importantly -- where it will NOT compete, "
        "since a statement permitting everything decides nothing. The "
        "analytical frameworks are prompts rather than answers. SWOT "
        "separates internal from external and earns its value through the "
        "MATCHING: which strength addresses which opportunity, which weakness "
        "faces which threat -- with strengths assessed RELATIVE to "
        "competitors, since a capability everybody has is a requirement "
        "rather than an advantage. The five forces shape how much profit an "
        "industry sustains, and SUBSTITUTES are the one most often missed "
        "because they come from outside it. The generic strategies -- cost "
        "leadership, differentiation, focus -- are alternatives, and pursuing "
        "the first two together produces STUCK IN THE MIDDLE, carrying one's "
        "costs while charging the other's prices and losing to specialists at "
        "each end. The portfolio grid exists to move cash from mature "
        "products to growing ones rather than to classify them. The value "
        "chain locates where the organisation is genuinely better, which is "
        "rarely where costs are highest. And growth is riskiest where both "
        "the product and the market are new at once.",
        exam_notes=[
            desc(
                "Items describe a competitive situation or a strategic "
                "decision and ask what it amounts to."
            ),
            ul([
                "Identifying the stuck-in-the-middle failure.",
                "Explaining what makes a SWOT useful.",
                "Naming the force most often missed.",
                "Explaining why strengths are relative.",
                "Stating what the portfolio framework is for.",
                "Explaining what a value chain analysis identifies.",
                "Ranking growth directions by risk.",
            ]),
            desc(
                "When an organisation is doing two sensible things and losing "
                "anyway, check whether the two require opposite capabilities. "
                "Cost and differentiation is the classic pair, and the item "
                "is usually constructed so each activity looks correct in "
                "isolation."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Marketing
# ==========================================================================

_mkt_sections = [
    ("Understanding the Buyer", [
        desc(
            "Marketing begins with who is being sold to and what they "
            "actually want, which is a question about them rather than about "
            "the product."
        ),
        table(
            ["Established", "Because"],
            [["Who the customers are",
              "Different groups want different things"],
             ["What need the product meets for them",
              "People buy outcomes, not features"],
             ["What alternatives they consider",
              "Including doing nothing, which is always available"],
             ["What they are willing to pay",
              "Which is about perceived value rather than cost"],
             ["How they decide", "Which determines where and how to reach "
                                 "them"]],
            caption="Five things established before anything is offered.",
            footer="The second row is the reframing that matters. A customer "
                   "buying a drill wants a hole, and understanding the need "
                   "rather than the product is what reveals the substitutes "
                   "and the actual competition."),
    ]),

    ("Segmentation", [
        desc(
            "A market is not uniform, and dividing it lets an organisation "
            "serve part of it well rather than all of it approximately."
        ),
        ol([
            "SEGMENT: divide the market into groups whose needs and "
            "behaviour genuinely differ.",
            "Check each segment is reachable, measurable and large enough to "
            "be worth serving.",
            "TARGET: choose which segments to serve, and which not to.",
            "POSITION: decide how the offering should be perceived within "
            "each, relative to alternatives.",
            "Build the offering and the communication consistently with that "
            "position.",
        ]),
        desc(
            "Segments are divided by whatever actually predicts behaviour: "
            "geography, demographics, how the product is used, what the buyer "
            "values. A division that produces groups behaving identically has "
            "segmented on something irrelevant, however easy it was to "
            "measure."
        ),
        desc(
            "POSITIONING is a statement about perception rather than about "
            "the product. It is what a buyer would say the offering is FOR "
            "compared with the alternatives -- and where the buyer's "
            "perception differs from the intended one, the perception is what "
            "governs their decision."
        ),
    ]),

    ("The Marketing Mix", [
        desc(
            "Four decisions carry a position into the market, and their "
            "consistency is what makes it credible."
        ),
        image(fig("marketing-mix")),
        table(
            ["Element", "Decides"],
            [["Product", "What is offered, and what it does for the buyer"],
             ["Price", "What is charged, and what that signals"],
             ["Place", "How it reaches the buyer"],
             ["Promotion", "How the buyer learns it exists and why it "
                           "matters"]],
            caption="Four elements that must agree with one another.",
            footer="CONSISTENCY is what the mix is for. A premium product "
                   "sold cheaply through discount channels contradicts "
                   "itself, and buyers read the contradiction as information "
                   "about the quality rather than as a bargain."),
        desc(
            "For services the syllabus extends this with PEOPLE, PROCESS and "
            "PHYSICAL EVIDENCE -- because a service is produced as it is "
            "consumed, so the people delivering it and the process they "
            "follow are part of what is bought."
        ),
    ]),

    ("Pricing", [
        desc(
            "Price is the element that most directly affects profit and the "
            "one most often set by the wrong reasoning."
        ),
        content_accordion(
            "FOUR APPROACHES TO PRICING",
            "Each takes its reference from somewhere different.",
            [("Cost-based",
              "Add a margin to what it cost. Simple, guarantees a margin per "
              "sale, and ignores what buyers would pay -- which leaves money "
              "on the table or prices above what anybody will pay."),
             ("Competition-based",
              "Price relative to the alternatives. Reflects the market, and "
              "gives away the initiative to whoever moves first."),
             ("Value-based",
              "Price on what the buyer perceives it is worth. Captures the "
              "most value, and requires understanding the buyer far better "
              "than the other two."),
             ("Strategic pricing",
              "Penetration prices low to gain share, skimming prices high to "
              "capture early buyers before falling. Both are deliberate "
              "trajectories rather than a single figure.")]),
        desc(
            "VALUE-BASED pricing is the one the syllabus treats as correct in "
            "principle. Cost determines whether a price is viable and does "
            "not determine what buyers will pay -- so cost sets a floor, and "
            "the buyer's perceived value sets the ceiling."
        ),
    ]),

    ("Channels", [
        desc(
            "How a product reaches buyers shapes cost, control and the "
            "relationship with them."
        ),
        compare_grid(
            "DIRECT AGAINST INTERMEDIATED CHANNELS",
            "Reach against control.",
            [("Direct",
              ["The relationship with the buyer is yours",
               "Margin is not shared with anybody",
               "You bear the cost of reaching every buyer",
               "Growth requires building the reach yourself"]),
             ("Through intermediaries",
              ["Immediate reach through somebody else's presence",
               "Margin shared, and sometimes substantially",
               "The intermediary owns the customer relationship",
               "Their priorities are their own"])]),
        desc(
            "Electronic channels changed this by making direct reach "
            "affordable at scale, which is why DISINTERMEDIATION -- removing "
            "the middle -- became possible in industries where it never had "
            "been. The intermediary survives where they add something beyond "
            "reach: selection, trust, or aggregation."
        ),
    ]),

    ("Promotion and the Product Life Cycle", [
        desc(
            "What a product needs from marketing changes as it ages, which is "
            "the framework the syllabus uses."
        ),
        table(
            ["Stage", "Characterised by", "Marketing emphasis"],
            [["Introduction", "Few buyers, high cost per sale",
              "Making the product known at all"],
             ["Growth", "Rising sales, competitors appearing",
              "Differentiating from the arrivals"],
             ["Maturity", "Sales level, competition on price",
              "Defending share, and finding new uses"],
             ["Decline", "Sales falling", "Harvest, or withdraw"]],
            caption="Four stages and what each requires.",
            footer="The stages have no fixed durations, and a product's stage "
                   "is inferred from its behaviour rather than its age. "
                   "Treating a maturity plateau as decline withdraws support "
                   "from something still earning."),
        desc(
            "The examinable use is matching the marketing response to the "
            "stage. Heavy awareness spending on a mature product, or price "
            "competition during introduction, applies the wrong response to "
            "the situation -- and both are common."
        ),
    ]),

    ("Marketing Research", [
        desc(
            "Marketing decisions rest on what is known about buyers, and "
            "where that knowledge comes from determines how far it can be "
            "trusted."
        ),
        compare_grid(
            "PRIMARY AGAINST SECONDARY RESEARCH",
            "Gathered for this question, or gathered for another.",
            [("Primary",
              ["Collected for this specific question",
               "Surveys, interviews, observation, trials",
               "Expensive and slow",
               "Answers exactly what was asked"]),
             ("Secondary",
              ["Already exists -- published data, internal records",
               "Cheap and immediate",
               "Collected for somebody else's purpose",
               "May not quite answer the question being asked"])]),
        desc(
            "The usual sequence is secondary first, since it is cheap and "
            "frequently sufficient, followed by primary research on whatever "
            "remains uncertain. Beginning with primary research spends money "
            "answering questions somebody may already have answered."
        ),
        desc(
            "What people SAY and what they DO diverge here as everywhere. "
            "Stated intentions to buy consistently overstate actual purchase, "
            "which is why observation and trials carry more weight than "
            "surveys about hypothetical products."
        ),
    ]),

    ("Customer Relationships and Retention", [
        desc(
            "Acquiring a customer costs considerably more than keeping one, "
            "which changes where marketing effort belongs."
        ),
        table(
            ["Measure", "Reveals"],
            [["Acquisition cost per customer",
              "What winning each new one costs"],
             ["Retention rate",
              "How many stay, which compounds over years"],
             ["Lifetime value",
              "What a customer is worth across the whole relationship"],
             ["Share of a customer's spending",
              "How much of their need is met here"],
             ["Referral rate",
              "Whether satisfied customers bring others"]],
            caption="Five customer measures.",
            footer="LIFETIME VALUE is what makes acquisition cost "
                   "interpretable. Spending a large sum to win a customer is "
                   "sound if they stay for years and unsound if they leave "
                   "after one purchase, and the acquisition figure alone "
                   "cannot say which."),
        desc(
            "The compounding in the second row is what people underestimate. "
            "A small improvement in retention increases the customer base "
            "every year it persists, which is why retention frequently returns "
            "more than the same effort spent on acquisition."
        ),
    ]),

    ("Digital and Data in Marketing", [
        desc(
            "Electronic channels changed what marketing can measure, which "
            "changed what it can do."
        ),
        ul([
            "Response is measurable per message rather than estimated across "
            "a campaign.",
            "Targeting can use behaviour rather than only demographics.",
            "Testing alternatives against real audiences replaces arguing "
            "about which is better.",
            "The same data raises obligations under privacy law, which apply "
            "regardless of what is technically possible.",
            "Measurability biases attention towards what is easy to measure, "
            "which is not the same as what matters.",
        ]),
        desc(
            "The last point is the caution worth carrying. Immediate "
            "response is measurable and long-term brand effect is not, so an "
            "organisation optimising purely for measured response will "
            "gradually stop doing the things whose benefit it cannot see."
        ),
    ]),

    ("Brand", [
        desc(
            "A brand is what a name means to a buyer, and it does work no "
            "individual campaign can."
        ),
        ul([
            "It reduces the buyer's risk, since a known name carries "
            "expectations a new one cannot.",
            "It supports a price premium where the expectations are "
            "favourable.",
            "It is built slowly through consistent experience and damaged "
            "quickly by an inconsistent one.",
            "It extends to new products, which is why organisations launch "
            "under existing names.",
            "It can also constrain, since a name meaning one thing cannot "
            "easily be attached to something contradicting it.",
        ]),
        desc(
            "The asymmetry in the third point is what makes brand management "
            "cautious. Years of consistent experience build an expectation "
            "that a single visible failure can undo -- which is why "
            "protecting a brand frequently means declining opportunities that "
            "would be profitable in themselves."
        ),
    ]),

    ("Marketing and the Rest of the Organisation", [
        desc(
            "Marketing makes promises that other functions must keep, which "
            "is what makes it an organisational activity rather than a "
            "departmental one."
        ),
        table(
            ["Promise made", "Kept by"],
            [["Availability by a stated date",
              "Operations and the supply chain"],
             ["A quality or performance claim",
              "Whoever designed and built it"],
             ["Support after purchase", "The service function"],
             ["A price", "Whoever controls the cost base"],
             ["An experience", "Everybody the customer meets"]],
            caption="Five promises and who must deliver each.",
            footer="The last row is the one that cannot be delegated. A "
                   "customer's experience is produced by every interaction "
                   "they have, so a promise about it commits people who never "
                   "saw the campaign."),
        desc(
            "A promise the organisation cannot keep does more damage than "
            "making none, since it creates an expectation the experience then "
            "contradicts -- which is worse than an absent expectation and "
            "harder to recover from."
        ),
    ]),

    ("Business and Consumer Markets", [
        desc(
            "Selling to organisations differs from selling to individuals in "
            "ways that change every element of the mix."
        ),
        table(
            ["", "Consumer", "Business"],
            [["Who decides", "Usually one person",
              "Several, with different concerns"],
             ["What drives it", "Need, preference, sometimes impulse",
              "A stated business case"],
             ["Transaction size", "Small, and frequent",
              "Large, and infrequent"],
             ["The sale", "Largely impersonal at scale",
              "A relationship, often over years"],
             ["Legal position", "Consumer protection applies",
              "Generally negotiated between equals"]],
            caption="Five differences between the two markets.",
            footer="The first row changes the marketing entirely. A "
                   "business purchase involves a user, a technical assessor, "
                   "somebody who pays and somebody who can veto -- and each "
                   "needs different information to say yes."),
        desc(
            "The last row has practical force. Consumer protection rules "
            "constrain what may be claimed, how contracts may be formed and "
            "what rights a buyer retains -- and they generally do not apply "
            "between businesses, so the same transaction carries different "
            "obligations depending on who is buying."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where marketing items are lost."),
        ul([
            "Describing the product rather than the need it meets, which "
            "hides the real competition.",
            "Segmenting on something measurable that does not predict "
            "behaviour.",
            "Treating positioning as what the organisation says rather than "
            "what buyers perceive.",
            "Setting price from cost, which ignores what buyers would pay.",
            "Making the mix inconsistent, which buyers read as a signal about "
            "quality.",
            "Assuming an intermediary's priorities match the "
            "manufacturer's.",
            "Applying the wrong marketing response for the life cycle "
            "stage.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A company prices a product by adding a fixed margin to its "
            "cost. A competitor sells a similar product at twice the price "
            "and outsells it. What is the pricing error?\""
        ),
        ol([
            "Identify the method: cost-based pricing, which takes its "
            "reference from what the product cost to make.",
            "Cost is a fact about the seller and tells nobody what a buyer "
            "would pay.",
            "The competitor is pricing on perceived VALUE, and buyers are "
            "evidently willing to pay it.",
            "So the company is leaving value uncaptured on every sale, and "
            "the low price may itself be signalling lower quality.",
            "Cost properly sets a FLOOR -- below which selling is not viable "
            "-- and the buyer's perceived value sets the ceiling.",
        ]),
        desc(
            "The item also illustrates price as a signal. Buyers unable to "
            "assess quality directly use price as evidence of it, so a low "
            "price can reduce demand rather than increase it -- which "
            "cost-based reasoning cannot anticipate."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Marketing connects to strategy and to systems."),
        ul([
            "Segmentation and positioning implement the strategy of the "
            "previous lesson.",
            "Understanding the need rather than the product is what reveals "
            "substitutes.",
            "Customer relationship systems support this work, in a later "
            "lesson.",
            "Electronic channels are the e-business lesson.",
            "Pricing decisions rest on the cost understanding of the "
            "accounting lesson.",
            "Consumer protection obligations come from Legal Affairs.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What customers actually buy",
              "An outcome, not a product",
              "Understanding the need is what reveals the real competition "
              "and the substitutes."),
             ("What makes a segmentation valid",
              "The groups behave differently",
              "Dividing on something measurable that predicts nothing has "
              "segmented on the wrong thing."),
             ("What positioning is",
              "What buyers perceive the offering is FOR",
              "Where perception differs from intention, perception governs "
              "the decision."),
             ("What cost determines about price",
              "The floor, not the price",
              "Perceived value sets the ceiling, and cost-based pricing "
              "leaves value uncaptured."),
             ("What an inconsistent mix signals",
              "Information about quality",
              "A premium product sold cheaply reads as a contradiction rather "
              "than a bargain."),
             ("How a product's life cycle stage is identified",
              "From its behaviour, not its age",
              "Treating a maturity plateau as decline withdraws support from "
              "something still earning.")]),
    ]),
]

_mkt_quiz = [
    mcq("HARD",
        "A company prices by adding a margin to cost. A competitor charges "
        "twice as much for a similar product and outsells it.\n\n"
        "What is the error?",
        [("Cost sets a floor; what buyers will pay is set by perceived "
          "value", True),
         ("The margin applied is too low for the market "
          "segment", False),
         ("The competitor is selling to a different segment "
          "entirely", False),
         ("The company's costs are higher than they should be", False)],
        "Cost is a fact about the seller and says nothing about what a buyer "
        "would pay, so cost-based pricing leaves value uncaptured whenever "
        "buyers value the product more than it cost. The low price may also "
        "be signalling lower quality, since buyers who cannot assess quality "
        "directly use price as evidence of it."),

    mcq("AVERAGE",
        "A market segmentation is valid on one condition.\n\nWhich?",
        [("The groups it produces behave differently", True),
         ("The groups can be measured accurately", False),
         ("The groups are of approximately equal size", False),
         ("The groups correspond to distinct geographic areas", False)],
        "The purpose is serving groups whose needs and behaviour genuinely "
        "differ, so a division producing groups that behave identically has "
        "segmented on something irrelevant however easy it was to measure. "
        "Measurability and reachability are necessary conditions for acting "
        "on a segment, and they do not make it a real one."),

    mcq("HARD",
        "Positioning describes one thing in particular.\n\nWhat?",
        [("What buyers perceive the offering is for, relative to "
          "alternatives", True),
         ("Where the product sits in the organisation's "
          "portfolio", False),
         ("The distribution channels through which it "
          "reaches buyers", False),
         ("The features that distinguish it from competing "
          "products", False)],
        "Positioning is a statement about PERCEPTION rather than about the "
        "product, and where the buyer's perception differs from the intended "
        "one it is the perception that governs their decision. Features "
        "support a position and are not it, since two products with identical "
        "features can be positioned entirely differently."),

    mcq("AVERAGE",
        "Why must the elements of the marketing mix be consistent?",
        [("Buyers read inconsistency as information about quality", True),
         ("Inconsistency increases the cost of reaching each "
          "buyer", False),
         ("Regulators require consistent claims across "
          "channels", False),
         ("Intermediaries will not carry inconsistently positioned "
          "products", False)],
        "A premium product sold cheaply through discount channels contradicts "
        "itself, and buyers resolve the contradiction by concluding the "
        "product is not premium after all. The mix communicates a position "
        "collectively, so an element inconsistent with the others undermines "
        "the whole rather than being ignored."),

    mcq("HARD",
        "What does a customer buying a drill actually want?",
        [("A hole -- the outcome rather than the product", True),
         ("A reliable tool that will last several years", False),
         ("The lowest price available for that specification", False),
         ("A recognised brand that signals quality", False)],
        "People buy outcomes, and framing the offering around the need rather "
        "than the product reveals both the real competition and the "
        "substitutes -- anything else producing a hole competes, whether or "
        "not it is a drill. Reliability, price and brand are attributes of a "
        "solution rather than the need it meets."),

    mcq("AVERAGE",
        "What distinguishes penetration pricing from skimming?",
        [("Penetration prices low to gain share; skimming prices high "
          "initially", True),
         ("Penetration applies to new markets and skimming to "
          "existing ones", False),
         ("Penetration is cost-based and skimming is value-based", False),
         ("Penetration is used for services and skimming for "
          "products", False)],
        "Both are deliberate price trajectories rather than single figures. "
        "Penetration accepts low margin to build share quickly; skimming "
        "captures buyers willing to pay most before reducing the price to "
        "reach the rest. Which suits a product depends on how price-sensitive "
        "the market is and how quickly competitors can arrive."),

    mcq("HARD",
        "What does an intermediary in a distribution channel own that a "
        "manufacturer selling direct does not give up?",
        [("The relationship with the customer", True),
         ("The right to set the final selling price", False),
         ("Responsibility for product quality", False),
         ("The obligation to hold inventory", False),
         ],
        "The intermediary meets the buyer, knows who they are and what they "
        "bought, and is who the buyer contacts. That relationship is what a "
        "manufacturer gives up in exchange for reach -- and it is why "
        "electronic channels making direct reach affordable prompted "
        "disintermediation in industries where it had never been possible."),

    mcq("AVERAGE",
        "A mature product's sales have levelled off.\n\n"
        "What marketing emphasis does the stage suggest?",
        [("Defending share, and finding new uses or segments", True),
         ("Heavy spending on making the product known", False),
         ("Withdrawing support and harvesting the remaining "
          "sales", False),
         ("Reducing the price to match new competitors", False)],
        "Maturity means the market is no longer growing and competition "
        "concentrates on share, so the response is defending position and "
        "extending the product's life through new uses or segments. Awareness "
        "spending suits introduction; harvesting suits decline -- and "
        "treating a plateau as decline withdraws support from something still "
        "earning."),

    mcq("HARD",
        "Why does a value-based approach require more understanding than "
        "cost-based pricing?",
        [("It requires knowing what buyers perceive the product is worth to "
          "them", True),
         ("It requires more accurate cost information than the "
          "alternative", False),
         ("It must be recalculated whenever competitors change their "
          "prices", False),
         ("It requires segmentation to have been completed "
          "first", False)],
        "Cost is known internally and needs no research; perceived value "
        "exists in the buyer's mind and has to be discovered. That is why "
        "cost-based pricing is popular and why it systematically prices "
        "wrongly -- it uses the information that is easy to obtain rather "
        "than the information that determines the answer."),

    mcq("AVERAGE",
        "Which three elements does the marketing mix add for services?",
        [("People, process and physical evidence", True),
         ("Positioning, packaging and partnerships", False),
         ("Performance, personalisation and proximity", False),
         ("Planning, pricing structure and payment terms", False)],
        "A service is produced as it is consumed, so the people delivering "
        "it, the process they follow and the tangible evidence surrounding it "
        "are part of what the customer buys rather than surrounding it. That "
        "is why service marketing extends the four elements rather than "
        "applying them unchanged."),
]

LESSON_BIZ_MKT = lesson(
    MAJOR, MIDDLE,
    "Marketing: Segmentation, Mix and Pricing",
    _mkt_quiz,
    lesson_structure(
        "Marketing: Segmentation, Mix and Pricing",
        "Marketing starts from the buyer rather than the product, and the "
        "reframing that matters is that people buy OUTCOMES -- a customer "
        "buying a drill wants a hole, which is what reveals the real "
        "competition. This lesson covers segmentation valid only when the "
        "groups behave differently, positioning as what buyers PERCEIVE "
        "rather than what the organisation says, the mix whose consistency is "
        "read as information about quality, and pricing -- where cost sets a "
        "floor and perceived value sets the ceiling, so cost-based pricing "
        "leaves value uncaptured on every sale.",
        [
            "Establish what a buyer actually needs rather than what the "
            "product is",
            "Segment, target and position a market",
            "Explain what makes a segmentation valid",
            "Describe the marketing mix and why consistency matters",
            "Compare pricing approaches and explain what cost determines",
            "Distinguish penetration from skimming",
            "Compare direct and intermediated channels",
            "Match marketing emphasis to the product life cycle stage",
        ],
        75,
        _mkt_sections,
        [
            ("Buying an outcome",
             "People buy what a product does for them, which is what reveals "
             "the substitutes and the real competition."),
            ("Segmentation",
             "Dividing a market into groups whose needs and behaviour "
             "genuinely differ."),
            ("Positioning",
             "What buyers perceive the offering is for. Perception governs "
             "the decision where it differs from intention."),
            ("Marketing mix",
             "Product, price, place and promotion -- consistent, since "
             "contradiction is read as a quality signal."),
            ("Service extension",
             "People, process and physical evidence, since a service is "
             "produced as it is consumed."),
            ("Cost-based pricing",
             "Adds a margin to cost. Simple, and ignores what buyers would "
             "pay."),
            ("Value-based pricing",
             "Prices on perceived worth. Cost sets the floor; perceived value "
             "sets the ceiling."),
            ("Penetration and skimming",
             "Price low for share, or high to capture early buyers before "
             "reducing. Both are trajectories."),
            ("Product life cycle",
             "Introduction, growth, maturity, decline -- inferred from "
             "behaviour rather than age."),
        ],
        "Marketing begins with the buyer, and the reframing that does the "
        "work is that people buy OUTCOMES rather than products -- somebody "
        "buying a drill wants a hole, and understanding that reveals both the "
        "substitutes and the actual competition. Markets are segmented, "
        "targeted and positioned, with a segmentation valid only when the "
        "groups genuinely BEHAVE differently, and positioning being what "
        "buyers PERCEIVE the offering is for -- since where perception "
        "differs from intention, perception governs the decision. The mix "
        "carries the position into the market through product, price, place "
        "and promotion, extended for services by people, process and physical "
        "evidence; its CONSISTENCY is what makes it credible, because buyers "
        "read a contradiction as information about quality rather than as a "
        "bargain. Pricing may be cost-based, competition-based or "
        "value-based, and the last is right in principle: cost is a fact "
        "about the seller that sets a FLOOR, while perceived value sets the "
        "ceiling -- so cost-based pricing systematically leaves value "
        "uncaptured, and a low price can reduce demand by signalling lower "
        "quality. Channels trade reach against the customer relationship. And "
        "the life cycle matches marketing emphasis to a stage inferred from "
        "behaviour rather than from age.",
        exam_notes=[
            desc(
                "Items describe a marketing decision and ask what is wrong "
                "with the reasoning behind it."
            ),
            ul([
                "Diagnosing cost-based pricing against a value-based "
                "competitor.",
                "Explaining what makes a segmentation valid.",
                "Defining positioning correctly.",
                "Explaining why mix consistency matters.",
                "Distinguishing penetration from skimming.",
                "Identifying what an intermediary owns.",
                "Matching emphasis to a life cycle stage.",
            ]),
            desc(
                "For any pricing item, ask what the price was derived FROM. "
                "Cost tells you whether a price is viable and nothing about "
                "what buyers will pay, and nearly every pricing item in this "
                "lesson turns on that distinction."
            ),
        ],
    ))

LESSONS = [LESSON_BIZ_STRAT, LESSON_BIZ_MKT]

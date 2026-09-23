"""IT Passport lesson content: Business Strategy (715-720)."""

import sys

sys.path.insert(0, "/app/scripts/fe_expansion")

from builders import (  # noqa: E402
    accordion, compare_grid, content_tabs, desc, flip_cards, image, image_text,
    lesson_structure, media_text, ol, review_cards, sub, table, tabs, ul,
)

FIG = "/lesson-media/%s.svg"

CERTIFICATION_ID = 4

LESSONS = {}


LESSONS[715] = lesson_structure(
    name="Business strategy techniques",
    intro=(
        "Strategy is the set of choices about where a company competes and how it "
        "intends to win. This lesson covers the analytical frameworks used to make "
        "those choices -- SWOT, the portfolio matrix, competitive forces and core "
        "competence -- and what each is actually good for."
    ),
    objectives=[
        "Classify factors correctly in a SWOT analysis.",
        "Interpret a product portfolio matrix.",
        "Describe the generic competitive strategies.",
        "Explain what a core competence is.",
        "Describe alliances, mergers and outsourcing as strategic options.",
        "Explain what benchmarking contributes.",
    ],
    minutes=40,
    sections=[
        ("SWOT", [
            desc(
                "SWOT sorts factors on two axes: internal or external, favourable or "
                "unfavourable. The sorting is the discipline, and getting it wrong "
                "produces analysis that leads nowhere."
            ),
            table(
                ["", "Favourable", "Unfavourable"],
                [["Internal", "Strengths", "Weaknesses"],
                 ["External", "Opportunities", "Threats"]],
                caption="Internal means an attribute of the company; external means a condition of the market.",
            ),
            desc(
                "A strong brand is internal, so it is a strength. Growing demand is a "
                "market condition, so it is an opportunity -- not a strength, however "
                "welcome. Misfiling here is the most common examination error."
            ),
        ]),
        ("Product portfolio management", [
            desc(
                "The portfolio matrix places each product by market growth and relative "
                "market share, and each quadrant implies a different decision."
            ),
            accordion([
                ("Star -- high growth, high share", "Leading in a growing market. Consumes cash to hold position and is expected to become a cash cow as growth slows."),
                ("Cash cow -- low growth, high share", "Strong position in a mature market. Generates more cash than it needs, funding investment elsewhere."),
                ("Question mark -- high growth, low share", "An attractive market and a weak position. Forces an explicit choice: invest heavily to gain share, or exit."),
                ("Dog -- low growth, low share", "Weak position in a mature market. Usually a candidate for withdrawal."),
            ]),
            desc(
                "The framework's value is that it forbids treating every product the "
                "same. A cash cow starved of investment survives; a star starved of it "
                "becomes a question mark."
            ),
        ]),
        ("Competitive forces", [
            desc(
                "An industry's profitability is shaped by five forces, and understanding "
                "them explains why some markets are attractive and others are not."
            ),
            ul([
                "Rivalry among existing competitors.",
                "Threat of new entrants -- how easily others can start competing.",
                "Threat of substitutes -- different products meeting the same need.",
                "Bargaining power of buyers -- how easily customers can go elsewhere.",
                "Bargaining power of suppliers -- how dependent you are on them.",
            ]),
            desc(
                "Power follows alternatives. Buyers are powerful when switching is easy "
                "and suppliers are plentiful, which is exactly the situation a "
                "differentiated product is meant to avoid."
            ),
        ]),
        ("Generic strategies", [
            compare_grid(
                "Three broad ways to compete",
                "Attempting all three at once is the classic way to achieve none.",
                [("Cost leadership",
                  "Compete on being the lowest-cost producer across a broad market. "
                  "Requires scale and relentless efficiency."),
                 ("Differentiation",
                  "Compete on being distinctively better in ways customers will pay for "
                  "-- brand, quality, service, design."),
                 ("Focus",
                  "Narrow the market deliberately and serve one segment better than "
                  "broad competitors can, on cost or differentiation.")],
            ),
        ]),
        ("Core competence", [
            desc(
                "A core competence is a capability that is valuable to customers, hard "
                "for competitors to imitate, and usable across more than one market."
            ),
            desc(
                "It is a test with three parts, and most things a company is good at "
                "fail at least one. Being efficient at something every competitor also "
                "does is not a core competence, however well it is done."
            ),
            desc(
                "The practical consequence is what to keep in-house: activities built on "
                "a core competence, and outsource the rest."
            ),
        ]),
        ("Growth and restructuring", [
            table(
                ["Option", "What it is", "Main risk"],
                [["Alliance", "Cooperation while staying independent", "Divergent interests over time"],
                 ["Joint venture", "A jointly owned new entity", "Governance and control disputes"],
                 ["M&A", "Acquiring or merging with another company", "Culture and integration, which fail more often than the finances"],
                 ["Outsourcing", "Contracting an activity to a provider", "Losing the capability to specify and oversee it"],
                 ["Divestiture", "Selling a business unit", "Stranded costs left behind"]],
            ),
        ]),
        ("Benchmarking", [
            desc(
                "Benchmarking compares your processes and results against recognised "
                "strong performers -- competitors, or organisations in other industries "
                "doing something comparable well."
            ),
            desc(
                "Its value is the outward look. Internal targets set from last year's "
                "figures can improve steadily while the company falls further behind, "
                "and only an external reference reveals that."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Growing market demand is which SWOT element?", "Opportunity",
                 "It is external. Strengths and weaknesses are internal attributes."),
                ("High share, low growth -- which quadrant?", "Cash cow",
                 "It funds investment elsewhere."),
                ("What makes a competence 'core'?", "Valuable, inimitable, transferable",
                 "Failing any of the three disqualifies it."),
                ("Buyers are powerful when?", "Switching is easy and alternatives exist",
                 "Power follows the availability of alternatives."),
            ]),
        ]),
    ],
    key_terms=[
        ("SWOT", "Sorting factors by internal/external and favourable/unfavourable."),
        ("Cash cow", "High share in a low-growth market; generates surplus cash."),
        ("Question mark", "Low share in a high-growth market; demands an invest-or-exit decision."),
        ("Core competence", "A capability that is valuable, hard to imitate and transferable."),
        ("Cost leadership", "Competing as the lowest-cost producer across a broad market."),
        ("Benchmarking", "Comparing performance against recognised strong performers."),
    ],
    summary=(
        "SWOT sorts factors as internal or external and favourable or unfavourable, and "
        "misfiling them is the usual error. The portfolio matrix assigns a different "
        "decision to each combination of growth and share, forcing an explicit choice "
        "on question marks. Five forces explain an industry's profitability, with power "
        "following the availability of alternatives. Generic strategies are cost "
        "leadership, differentiation and focus, and core competences -- valuable, "
        "inimitable, transferable -- decide what stays in-house."
    ),
    exam_notes=[
        desc(
            "SWOT classification appears constantly. Ask one question: is this an "
            "attribute of the COMPANY or a condition of the MARKET? That settles it."
        ),
        ul([
            "Internal: strengths and weaknesses. External: opportunities and threats.",
            "Cash cow funds; star consumes; question mark demands a decision.",
            "A core competence must pass all three parts of the test.",
        ]),
    ],
)


LESSONS[716] = lesson_structure(
    name="Marketing",
    intro=(
        "Marketing decides what is offered, to whom, at what price and through what "
        "channel. This lesson covers segmentation and targeting, the marketing mix, "
        "pricing approaches, and how digital channels changed what can be measured."
    ),
    objectives=[
        "Explain segmentation, targeting and positioning.",
        "Describe the four elements of the marketing mix.",
        "Compare pricing strategies and say when each suits.",
        "Explain the product life cycle and its implications.",
        "Describe common digital marketing methods.",
        "Explain why customer retention is valued.",
    ],
    minutes=35,
    sections=[
        ("Segmentation, targeting, positioning", [
            ol([
                "Segment -- divide the market into groups with distinct needs.",
                "Target -- choose which segments to serve.",
                "Position -- decide how the offering should be understood within them.",
            ]),
            desc(
                "Segments may be defined geographically, demographically, by behaviour "
                "or by need. A segment is only useful if it is measurable, reachable, "
                "large enough to be worth serving, and genuinely different in what it "
                "wants."
            ),
        ]),
        ("The marketing mix", [
            desc(
                "The four Ps are the levers available, and they must be consistent with "
                "each other -- a premium product sold cheaply through a discount channel "
                "confuses everybody."
            ),
            table(
                ["Element", "Decides", "Example decision"],
                [["Product", "What is offered", "Features, quality, support, warranty"],
                 ["Price", "What is charged", "List price, discounts, subscription or one-off"],
                 ["Place", "How it reaches customers", "Direct, retail, online, partners"],
                 ["Promotion", "How it is communicated", "Advertising, content, sales, PR"]],
            ),
            desc(
                "Services add three more -- people, process and physical evidence -- "
                "because in a service the delivery IS the product."
            ),
        ]),
        ("Pricing", [
            accordion([
                ("Cost-plus", "Add a margin to cost. Simple, and ignores what customers will actually pay."),
                ("Value-based", "Price on the value delivered to the customer. Harder to establish and usually more profitable."),
                ("Penetration", "Price low to win share quickly, intending to raise it later or profit at volume."),
                ("Skimming", "Price high at launch to capture early adopters, then lower it to reach broader demand."),
                ("Freemium", "A free tier converting a minority to paid. Viable only if conversion revenue exceeds the cost of serving everyone."),
                ("Subscription", "Recurring payment for continued access. Predictable revenue; requires ongoing value to prevent churn."),
            ]),
        ]),
        ("Product life cycle", [
            desc(
                "Products pass through stages, and what marketing should do differs at "
                "each."
            ),
            table(
                ["Stage", "Sales", "Focus"],
                [["Introduction", "Low, growing slowly", "Awareness; costs exceed revenue"],
                 ["Growth", "Rising quickly", "Scaling capacity; competitors arrive"],
                 ["Maturity", "Peak, flattening", "Defending share; price competition"],
                 ["Decline", "Falling", "Harvest, reposition or withdraw"]],
            ),
            desc(
                "Treating a mature product as though it were still growing -- investing "
                "for share that is no longer available -- is a recognisable and "
                "expensive error."
            ),
        ]),
        ("Digital marketing", [
            ul([
                "SEO -- improving visibility in unpaid search results through content and structure.",
                "Paid search and display -- buying placement, billed by click or impression.",
                "Content marketing -- publishing material that attracts an audience over time.",
                "Social media -- reach and interaction, with reputation risk attached.",
                "E-mail -- direct and cheap, and subject to consent rules.",
                "Affiliate -- partners paid a commission for referred sales.",
            ]),
            desc(
                "Digital channels are measurable in ways traditional ones are not, which "
                "is their real advantage: spend can be attributed to outcomes rather "
                "than assumed to work."
            ),
        ]),
        ("Measuring what matters", [
            compare_grid(
                "Activity against outcome",
                "The first is easy to count and easy to mistake for success.",
                [("Activity measures",
                  "Visitors, impressions, followers, e-mails sent. Cheap to inflate and "
                  "only loosely connected to revenue."),
                 ("Outcome measures",
                  "Conversion rate, cost per acquisition, customer lifetime value, "
                  "retention. Connect spending to results.")],
            ),
            desc(
                "Retaining a customer is generally far cheaper than acquiring a new one, "
                "which is why churn is watched as closely as growth -- a business adding "
                "customers and losing them faster is shrinking while looking busy."
            ),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("High launch price, lowered later?", "Skimming",
                 "Penetration is the opposite: low first to win share."),
                ("What are the four Ps?", "Product, price, place, promotion",
                 "Services add people, process and physical evidence."),
                ("Which stage brings price competition?", "Maturity",
                 "Sales have peaked and competitors are established."),
                ("Visitors or conversion rate -- which measures success?", "Conversion rate",
                 "Traffic without conversion is cost."),
            ]),
        ]),
    ],
    key_terms=[
        ("Segmentation", "Dividing a market into groups with distinct needs."),
        ("Marketing mix", "Product, price, place and promotion, which must be consistent."),
        ("Skimming", "Launching at a high price and lowering it over time."),
        ("Penetration pricing", "Pricing low initially to win market share."),
        ("Product life cycle", "Introduction, growth, maturity and decline."),
        ("Churn", "The rate at which existing customers are lost."),
    ],
    summary=(
        "Marketing segments a market, targets chosen segments and positions the "
        "offering within them, then sets product, price, place and promotion "
        "consistently. Pricing may follow cost, value, penetration, skimming, freemium "
        "or subscription, each suiting different circumstances. Products move through "
        "introduction, growth, maturity and decline, and each stage calls for different "
        "action. Digital channels are valuable chiefly because they are measurable, and "
        "outcome measures such as conversion and retention matter more than activity "
        "counts."
    ),
    exam_notes=[
        desc(
            "The skimming-versus-penetration pair is examined often, as is identifying "
            "a life-cycle stage from a description of sales and competition."
        ),
        ul([
            "Skimming starts high; penetration starts low.",
            "Four Ps: product, price, place, promotion.",
            "Retention is usually cheaper than acquisition.",
        ]),
    ],
)


LESSONS[717] = lesson_structure(
    name="Business strategy and goal/evaluation",
    intro=(
        "A strategy that is not measured is an intention. This lesson covers how goals "
        "are expressed so progress can be judged -- KGI and KPI, the balanced scorecard, "
        "critical success factors -- and the ways measurement goes wrong."
    ),
    objectives=[
        "Distinguish a KGI from a KPI.",
        "Choose an appropriate KPI for a stated goal.",
        "Describe the balanced scorecard's four perspectives.",
        "Explain what a critical success factor is.",
        "Describe how measurement distorts behaviour.",
        "Explain the difference between leading and lagging indicators.",
    ],
    minutes=35,
    sections=[
        ("Goals and the measures beneath them", [
            desc(
                "A key goal indicator states the destination. Key performance indicators "
                "are the intermediate measures showing whether it is being approached in "
                "time to act."
            ),
            table(
                ["", "KGI", "KPI"],
                [["Expresses", "The outcome wanted", "Progress toward it"],
                 ["Timing", "Judged at the end", "Watched throughout"],
                 ["Example", "Increase annual sales by 20%", "New qualified leads per month"],
                 ["Use", "Defines success", "Steers the work"]],
            ),
            desc(
                "Restating the goal as its own indicator -- measuring annual sales "
                "growth monthly -- gives the team nothing they can act on during the "
                "year."
            ),
        ]),
        ("Choosing a KPI", [
            ol([
                "It must plausibly DRIVE the goal, not merely correlate with it.",
                "Somebody must be able to influence it through their decisions.",
                "It must be measurable reliably and often enough to act on.",
                "It should be hard to improve in ways that do not help the goal.",
            ]),
            desc(
                "The fourth is the one most often skipped, and it is why a single "
                "measure is rarely enough."
            ),
        ]),
        ("Leading and lagging", [
            compare_grid(
                "Two kinds of indicator",
                "A dashboard of only the second leaves nothing to steer by.",
                [("Leading",
                  "Predicts future performance -- pipeline, training completed, defects "
                  "found in review. There is still time to change the outcome."),
                 ("Lagging",
                  "Reports what already happened -- revenue, churn, incidents. Reliable "
                  "and too late to influence.")],
            ),
        ]),
        ("The balanced scorecard", [
            desc(
                "The scorecard sets three non-financial perspectives alongside the "
                "financial one, so that current profit is not improved at the cost of "
                "everything that produces future profit."
            ),
            accordion([
                ("Financial", "Revenue, profit, return on investment. What shareholders see."),
                ("Customer", "Satisfaction, retention, share. Whether the market is being served."),
                ("Internal process", "Quality, cycle time, efficiency. Whether the work is done well."),
                ("Learning and growth", "Skills, systems, culture. Whether capability is being built."),
            ]),
            desc(
                "Cutting training improves this year's financial perspective and damages "
                "learning and growth, which shows up in the other three later. The "
                "scorecard exists to make that visible while it is still a choice."
            ),
        ]),
        ("Critical success factors", [
            desc(
                "A critical success factor is something that must go right for the "
                "strategy to succeed. Identifying them tells you where measurement and "
                "management attention belong."
            ),
            desc(
                "For an online retailer, reliable delivery may be critical; for a "
                "consultancy, retaining senior staff. Anything not critical can be "
                "managed with less scrutiny, which is how attention is allocated "
                "sensibly."
            ),
        ]),
        ("How measurement distorts", [
            desc(
                "People optimise what is measured, including in ways nobody intended. "
                "This is not dishonesty; it is the predictable result of telling someone "
                "what they will be judged on."
            ),
            ul([
                "Measure calls handled and calls get shorter, not better.",
                "Measure tickets closed and tickets get closed prematurely -- watch the reopen rate.",
                "Measure lines of code and more code appears, which is worse.",
                "Measure only local targets and the whole can still miss, because local optima do not sum.",
            ]),
            desc(
                "The remedy is to pair a throughput measure with a quality measure, so "
                "that improving one at the other's expense is visible."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("KGI or KPI: annual revenue target?", "KGI",
                 "It states the destination; KPIs measure progress toward it."),
                ("Which indicator still allows you to act?", "Leading",
                 "Lagging indicators report what already happened."),
                ("Tickets closed rises, reopens rise too -- meaning?", "Premature closure",
                 "The throughput measure is being met at quality's expense."),
                ("Which scorecard perspective covers skills?", "Learning and growth",
                 "It is the one most easily sacrificed for short-term financials."),
            ]),
        ]),
    ],
    key_terms=[
        ("KGI", "Key goal indicator: the outcome that defines success."),
        ("KPI", "Key performance indicator: a measure of progress toward the goal."),
        ("Leading indicator", "Predicts future performance, leaving time to act."),
        ("Lagging indicator", "Reports what has already happened."),
        ("Balanced scorecard", "Financial, customer, internal process and learning perspectives."),
        ("Critical success factor", "Something that must go right for the strategy to succeed."),
    ],
    summary=(
        "A KGI states the destination while KPIs measure progress toward it, and a good "
        "KPI is one somebody can influence and cannot easily game. Leading indicators "
        "leave time to act where lagging ones only report. The balanced scorecard sets "
        "customer, process and capability alongside financial results so that future "
        "performance is not traded for current profit. Critical success factors direct "
        "attention, and every measure changes behaviour, which is why throughput "
        "measures are paired with quality ones."
    ),
    exam_notes=[
        desc(
            "Expect a goal and four candidate KPIs, where the wrong answers either "
            "restate the goal or measure something nobody can influence."
        ),
        ul([
            "A KPI must drive the goal and be actionable.",
            "The four scorecard perspectives are financial, customer, process, learning.",
            "Any single measure will eventually be gamed; pair it.",
        ]),
    ],
)


LESSONS[718] = lesson_structure(
    name="Planning of technology development strategy and technology development plan",
    intro=(
        "Technology strategy decides which capabilities a company builds, when, and why. "
        "This lesson covers technology roadmaps, how innovation is managed and funded, "
        "and why organisations invest in capabilities whose return is uncertain."
    ),
    objectives=[
        "Explain what a technology roadmap communicates.",
        "Describe how research and development is organised and funded.",
        "Explain the idea of disruptive innovation.",
        "Describe open innovation and its trade-offs.",
        "Explain what a stage-gate process controls.",
        "Describe how intellectual property fits a technology strategy.",
    ],
    minutes=35,
    sections=[
        ("Technology roadmaps", [
            desc(
                "A roadmap sets out how technical capability will develop over time and "
                "ties it to the products and markets it serves. Its value is that "
                "dependent plans can be made with some confidence."
            ),
            ul([
                "Which capabilities are needed, and by when.",
                "What must be built, bought or partnered for.",
                "Which existing technology is being retired, and when.",
                "What each step depends on.",
            ]),
        ]),
        ("Research and development", [
            compare_grid(
                "Two different activities under one heading",
                "Funding and judging them the same way damages both.",
                [("Research",
                  "Investigating what is possible. Uncertain by nature, long horizon, "
                  "and judged by what is learned as much as by what is produced."),
                 ("Development",
                  "Turning a known possibility into a product. Plannable, shorter "
                  "horizon, judged by delivery.")],
            ),
            desc(
                "Applying development's schedule discipline to research kills it, "
                "because the honest answer to 'when will this work' is often unknown. "
                "Applying research's tolerance to development produces projects that "
                "never ship."
            ),
        ]),
        ("Disruptive innovation", [
            desc(
                "A disruptive innovation begins by underperforming on the measures "
                "mainstream customers care about, while serving an overlooked segment "
                "well, and then improves until it displaces the incumbent."
            ),
            desc(
                "The reason incumbents lose is not incompetence. Listening to their best "
                "customers, who do not want the inferior product, is rational -- right "
                "up until the entrant is good enough for those customers too."
            ),
            desc(
                "Sustaining innovation, by contrast, improves an existing product along "
                "the dimensions customers already value. Incumbents are usually very "
                "good at that."
            ),
        ]),
        ("Open innovation", [
            desc(
                "Open innovation draws ideas and technology from outside the "
                "organisation -- universities, start-ups, suppliers, customers -- rather "
                "than relying only on internal research."
            ),
            table(
                ["Approach", "Gains", "Costs"],
                [["Internal R&D", "Full control and ownership", "Slow, expensive, limited to your own ideas"],
                 ["Licensing in", "Fast access to proven technology", "Ongoing fees; no exclusivity"],
                 ["Partnership", "Shared cost and risk", "Shared control and divergent interests"],
                 ["Acquisition", "Capability and its people at once", "Expensive; integration frequently fails"]],
            ),
        ]),
        ("Controlling the spend", [
            desc(
                "A stage-gate process reviews a development at defined points and "
                "decides whether to continue, change direction or stop."
            ),
            ol([
                "Define what each gate requires as evidence.",
                "Review honestly against it, not against the effort already spent.",
                "Be willing to stop -- a process that never kills anything is a budgeting ritual.",
                "Record why a decision was taken, so it can be revisited sensibly.",
            ]),
            desc(
                "Money already spent is a sunk cost and is not a reason to continue. "
                "Continuing because of it is the commonest failure a gate exists to "
                "prevent."
            ),
        ]),
        ("Protecting what is built", [
            desc(
                "Technology strategy and intellectual property strategy belong together. "
                "The choice between patenting and secrecy shapes what can be shared and "
                "with whom."
            ),
            ul([
                "Patent where the invention would be visible in a product anyway.",
                "Keep secret where it is a process nobody outside can observe.",
                "Settle ownership before joint development begins, not after it succeeds.",
                "Record what you use from others, and under what licence.",
            ]),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Why do incumbents miss disruption?", "Listening to their best customers",
                 "Who rationally do not want the initially inferior product."),
                ("What must a stage gate be willing to do?", "Stop a project",
                 "Otherwise it is a budgeting ritual, not a control."),
                ("Is money already spent a reason to continue?", "No",
                 "It is sunk. Only future costs and benefits matter."),
                ("Research or development: judged by delivery date?", "Development",
                 "Research is judged substantially by what is learned."),
            ]),
        ]),
    ],
    key_terms=[
        ("Technology roadmap", "How capability will develop over time against business need."),
        ("Research", "Investigating what is possible; uncertain and long-horizon."),
        ("Development", "Turning a known possibility into a product; plannable."),
        ("Disruptive innovation", "Initially inferior on mainstream measures, serving an overlooked segment, then improving."),
        ("Open innovation", "Drawing ideas and technology from outside the organisation."),
        ("Stage-gate", "Reviewing a development at defined points and deciding whether to continue."),
    ],
    summary=(
        "A roadmap ties capability development to the products and markets it serves, "
        "letting dependent plans be made. Research and development are different "
        "activities and judging them identically damages both. Disruptive innovations "
        "start inferior on mainstream measures and displace incumbents who rationally "
        "listened to their best customers. Open innovation trades control for speed, "
        "and stage-gate reviews control spend only if they are willing to stop a "
        "project despite what has already been spent."
    ),
    exam_notes=[
        desc(
            "Disruptive innovation is examined by description rather than by name -- "
            "look for an entrant that is worse on the usual measures and better for an "
            "ignored group."
        ),
        ul([
            "Sunk costs are never a reason to continue.",
            "Sustaining innovation improves what customers already value.",
            "Research is judged by learning; development by delivery.",
        ]),
    ],
)


LESSONS[719] = lesson_structure(
    name="Business system",
    intro=(
        "This lesson covers the systems businesses run to manage their own operations -- "
        "enterprise resource planning, supply chain, customer relationship and the "
        "administrative systems underneath them -- and what each is actually for."
    ),
    objectives=[
        "Describe what ERP integrates and why that matters.",
        "Distinguish SCM, CRM and SFA.",
        "Explain what business intelligence adds to reporting.",
        "Describe common administrative systems.",
        "Explain why these implementations often fail.",
        "Describe what workflow and groupware provide.",
    ],
    minutes=35,
    sections=[
        ("Enterprise resource planning", [
            desc(
                "ERP integrates the major business functions -- finance, procurement, "
                "manufacturing, human resources, sales -- around a single shared data "
                "store."
            ),
            desc(
                "That single store is the point. A purchase order and its accounting "
                "entry become the same record rather than two records that have to be "
                "reconciled, and every function sees the same figures."
            ),
            desc(
                "The cost is intrusiveness: ERP embeds a way of working, and the "
                "implementation is usually as much a change programme as a technical "
                "project."
            ),
        ]),
        ("Facing suppliers and customers", [
            table(
                ["System", "Faces", "Optimises"],
                [["SCM", "Suppliers and logistics", "Flow of goods and the information about it"],
                 ["CRM", "Customers, across their whole relationship", "Marketing, sales and service against one view"],
                 ["SFA", "The selling process itself", "Leads, opportunities, quotes, visits"],
                 ["ERP", "Inward, across functions", "Integration of the company's own operations"]],
                caption="Overlaps exist at the edges; the differences are in what each is built around.",
            ),
            desc(
                "CRM implementations most often disappoint because sales staff do not "
                "enter data reliably. The system depends on work that benefits someone "
                "other than the person doing it, and no amount of software resolves that "
                "on its own."
            ),
        ]),
        ("Business intelligence", [
            compare_grid(
                "Reporting against analysis",
                "They answer different kinds of question.",
                [("Operational reporting",
                  "Describes the current state of one system -- today's orders, this "
                  "week's stock."),
                 ("Business intelligence",
                  "Integrates data across systems and time, so trends, comparisons and "
                  "unexpected patterns become answerable.")],
            ),
            desc(
                "BI usually reads from a data warehouse rather than from operational "
                "databases, because the two workloads are opposite: many small "
                "transactions against large historical scans."
            ),
        ]),
        ("Administrative systems", [
            accordion([
                ("Accounting", "Ledger, payables, receivables and reporting; the system of record for money."),
                ("Payroll", "Pay, deductions and statutory reporting against a fixed cut-off, which makes it a batch problem."),
                ("Human resources", "Records, recruitment, appraisal and training history."),
                ("Inventory", "Stock levels, reorder points and movements."),
                ("Asset management", "What is owned, where it is, and where it sits in its life."),
            ]),
        ]),
        ("Workflow and collaboration", [
            desc(
                "Workflow systems route work between people according to defined rules -- "
                "a purchase requisition passing through approval, for instance -- and "
                "record where each item is."
            ),
            ul([
                "Makes progress visible, so bottlenecks are identifiable rather than felt.",
                "Enforces the approval path, which is an internal control.",
                "Leaves an audit trail of who did what and when.",
                "Groupware adds shared calendars, documents and communication around it.",
            ]),
        ]),
        ("Why these projects fail", [
            ol([
                "The system is treated as a technical project rather than a change of working practice.",
                "Processes are customised to match existing habits, making every upgrade expensive.",
                "Data from the old system is migrated without being cleaned.",
                "Training is cut when the schedule slips, which is precisely when it matters most.",
                "Nobody owns the data quality the system depends on.",
            ]),
            desc(
                "The technology is rarely the cause. These are organisational failures "
                "that a system implementation exposes."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("What defines ERP architecturally?", "One integrated data store",
                 "Shared across functions, so figures reconcile by construction."),
                ("Why do CRM projects disappoint?", "Data is not entered reliably",
                 "The work benefits someone other than the person doing it."),
                ("SCM or CRM for supplier replenishment?", "SCM",
                 "CRM faces the customer, not the supplier."),
                ("Why does BI read from a warehouse?", "Opposite workloads",
                 "Small transactions versus large historical scans."),
            ]),
        ]),
    ],
    key_terms=[
        ("ERP", "Integrated management of business functions around one shared data store."),
        ("SCM", "Coordinating the flow of goods and information across the supply chain."),
        ("CRM", "Managing the whole customer relationship against a single view."),
        ("SFA", "Supporting the selling process: leads, opportunities, quotes."),
        ("Business intelligence", "Analysis across integrated historical data to support decisions."),
        ("Workflow", "Routing work between people by defined rules, with an audit trail."),
    ],
    summary=(
        "ERP integrates business functions around one data store, which removes "
        "reconciliation and embeds a way of working. SCM faces suppliers, CRM the whole "
        "customer relationship and SFA the selling process itself. Business intelligence "
        "reads integrated history from a warehouse to answer questions operational "
        "reporting cannot. Workflow routes and records approvals as an internal control. "
        "These implementations fail for organisational reasons far more often than "
        "technical ones."
    ),
    exam_notes=[
        desc(
            "Expect a described need and four system acronyms. Ask who the system faces "
            "-- inward, upstream to suppliers, or downstream to customers."
        ),
        ul([
            "ERP = integration inward; SCM = suppliers; CRM = customers.",
            "BI integrates across systems and time; reporting describes one system now.",
            "Heavy customisation makes every future upgrade expensive.",
        ]),
    ],
)


LESSONS[720] = lesson_structure(
    name="Consumer appliances and industrial devices",
    intro=(
        "Computers are embedded in far more things than they are visible in. This lesson "
        "covers embedded systems in consumer appliances and industrial equipment, what "
        "makes their requirements different, and the security problem that connecting "
        "them created."
    ),
    objectives=[
        "Describe what an embedded system is.",
        "Explain what real-time control requires.",
        "Describe industrial control equipment and its constraints.",
        "Explain what IoT adds to devices and what it risks.",
        "Describe how smart appliances and homes are built.",
        "Explain why patching industrial systems is difficult.",
    ],
    minutes=30,
    sections=[
        ("Embedded systems", [
            desc(
                "An embedded system is a computer built into a device to perform a "
                "specific function -- a washing machine controller, an engine management "
                "unit, a lift controller. The user does not think of it as a computer."
            ),
            ul([
                "Dedicated to one purpose rather than general-purpose.",
                "Constrained in power, memory and cost.",
                "Expected to run unattended for years.",
                "Often with real-time requirements.",
            ]),
        ]),
        ("Real-time requirements", [
            desc(
                "A real-time system must respond within a guaranteed time. This is a "
                "different property from speed: a fast system that occasionally takes "
                "much longer is not real-time."
            ),
            compare_grid(
                "Hard and soft real-time",
                "The difference is what a missed deadline costs.",
                [("Hard real-time",
                  "A missed deadline is a failure, possibly a dangerous one. Airbag "
                  "deployment, engine timing, medical devices."),
                 ("Soft real-time",
                  "A missed deadline degrades quality without failing. Video playback "
                  "dropping a frame.")],
            ),
        ]),
        ("Industrial control", [
            accordion([
                ("PLC", "A programmable logic controller running control logic on a fixed scan cycle, which is what makes its timing predictable."),
                ("SCADA", "Supervisory control and data acquisition: monitoring and controlling distributed equipment from a central point."),
                ("Sensor", "Converts a physical quantity -- temperature, pressure, position -- into a signal."),
                ("Actuator", "Converts a signal into physical action: opening a valve, turning a motor."),
                ("Feedback control", "Measuring the output and correcting the difference from the target, continuously."),
            ]),
        ]),
        ("Connecting devices", [
            desc(
                "Connecting embedded devices turns their state into data that can be "
                "collected, analysed and acted on remotely -- which is the whole "
                "proposition of the internet of things."
            ),
            ul([
                "Predictive maintenance -- servicing by condition rather than by calendar.",
                "Remote monitoring -- knowing a machine's state without visiting it.",
                "Usage data -- how products are actually used, informing the next design.",
                "Automation -- devices reacting to each other without a person.",
            ]),
        ]),
        ("The security problem", [
            desc(
                "Connecting devices that were designed to be isolated created a "
                "predictable problem: thousands of units with default credentials, no "
                "update path and permanent connectivity."
            ),
            ol([
                "Change default credentials before deployment, without exception.",
                "Put devices on a segregated network, not the main one.",
                "Prefer devices whose manufacturer commits to firmware updates.",
                "Sign and verify firmware, since the update channel is the most privileged interface a device has.",
                "Monitor for devices behaving unusually -- that is often the first sign.",
            ]),
        ]),
        ("Why industrial patching is hard", [
            desc(
                "The usual advice to patch promptly does not transfer cleanly to "
                "industrial systems, for reasons that are real rather than excuses."
            ),
            ul([
                "The process may not be able to stop for a reboot.",
                "Vendor certification may be tied to an exact configuration.",
                "Equipment lifetimes of twenty years outlast software support.",
                "A failed patch on a production line is far costlier than on a desktop.",
            ]),
            desc(
                "The practical response is compensating controls: segmentation, strict "
                "access control and monitoring around systems that cannot be patched on "
                "the usual schedule."
            ),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("What makes a system real-time?", "A guaranteed response deadline",
                 "Not raw speed; a late answer counts as wrong in hard real-time."),
                ("What does a PLC provide?", "Deterministic control logic",
                 "A fixed scan cycle makes timing predictable."),
                ("First step before deploying an IoT device?", "Change default credentials",
                 "Defaults are published and are how botnets are assembled."),
                ("Why can't industrial systems just be patched?", "Availability and certification",
                 "Compensating controls -- segmentation, monitoring -- are the answer."),
            ]),
        ]),
    ],
    key_terms=[
        ("Embedded system", "A computer built into a device to perform one specific function."),
        ("Hard real-time", "A missed deadline constitutes failure."),
        ("PLC", "A controller executing control logic on a deterministic scan cycle."),
        ("SCADA", "Central monitoring and control of distributed industrial equipment."),
        ("Actuator", "A device converting a signal into physical action."),
        ("Segmentation", "Separating devices onto their own network to contain compromise."),
    ],
    summary=(
        "Embedded systems are dedicated, constrained computers expected to run "
        "unattended for years, often with real-time requirements where a late answer is "
        "a wrong one. Industrial control uses PLCs, SCADA, sensors and actuators in "
        "feedback loops. Connecting such devices enables predictive maintenance and "
        "remote monitoring while concentrating weak, rarely patched endpoints, which is "
        "why default credentials must be changed and devices segregated. Industrial "
        "patching is genuinely constrained, so compensating controls take its place."
    ),
    exam_notes=[
        desc(
            "Real-time is examined as a guarantee rather than as speed. IoT questions "
            "usually reward segregation and credential change over any technical "
            "cleverness."
        ),
        ul([
            "Hard real-time: a missed deadline is a failure.",
            "A PLC's fixed scan cycle is what makes it deterministic.",
            "Segment IoT; never leave default credentials.",
        ]),
    ],
)

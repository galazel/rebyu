"""Corporate and Legal Affairs -> Corporate Activities, lesson 3.

Accounting and financial affairs for engineers.

Engineers are not asked to prepare accounts. They are asked to justify
spending, to understand why a proposal was rejected, and to recognise that
profit and cash are different things -- which is what this lesson supplies.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Corporate and Legal Affairs"
MIDDLE = "Corporate Activities"


_fin_sections = [
    ("Why Engineers Need This", [
        desc(
            "An engineer proposing anything expensive is making a financial "
            "argument whether they intend to or not. The syllabus expects "
            "enough of the vocabulary to make that argument, and enough of "
            "the reasoning to understand the answer."
        ),
        image(fig("financial-statements")),
        table(
            ["Situation", "What the engineer needs to understand"],
            [["Proposing a new system",
              "Whether it is capital or operating spending, and why that "
              "matters"],
             ["A proposal rejected despite a good return",
              "That the organisation may not have the cash"],
             ["Being asked for a payback period",
              "What it measures, and what it deliberately ignores"],
             ["Choosing between buying and subscribing",
              "The different effect each has on the accounts"],
             ["Being told a project is over budget",
              "Which costs are sunk and therefore irrelevant to what "
              "happens next"]],
            caption="Five situations where the vocabulary is required.",
            footer="The last row is the one that changes decisions. Money "
                   "already spent cannot be recovered by any choice made "
                   "now, so it should play no part in deciding whether to "
                   "continue -- and it almost always does."),
    ]),

    ("The Three Statements", [
        desc(
            "An organisation's position is reported in three statements, "
            "each answering a different question."
        ),
        ul([
            "The BALANCE SHEET reports what is owned and owed at one "
            "instant.",
            "The INCOME STATEMENT reports revenue less costs over a period, "
            "producing profit.",
            "The CASH FLOW STATEMENT reports money actually moving over that "
            "period.",
            "Profit is an accounting result reached by judgement; cash is a "
            "fact.",
            "A profitable organisation with no cash cannot pay anybody, "
            "which is why the third statement exists separately.",
        ]),
        desc(
            "The distinction between the last two is the most useful thing "
            "in this lesson. Revenue is recognised when it is earned rather "
            "than when it is received, so a company can report a good year "
            "and be unable to meet its payroll in the same month."
        ),
    ]),

    ("Reading a Balance Sheet", [
        desc(
            "The balance sheet is a snapshot, and its structure is fixed by "
            "an identity that always holds."
        ),
        table(
            ["Element", "Consists of"],
            [["Assets",
              "What the organisation owns or is owed -- cash, receivables, "
              "stock, equipment"],
             ["Liabilities",
              "What it owes -- payables, loans, obligations falling due"],
             ["Equity",
              "What remains for the owners, which is assets less "
              "liabilities"],
             ["Current against non-current",
              "Whether an item will turn into cash, or fall due, within a "
              "year"],
             ["The identity",
              "Assets equal liabilities plus equity, by construction"]],
            caption="The balance sheet's five structural elements.",
            footer="The current distinction is what indicates whether an "
                   "organisation can meet what falls due soon. Substantial "
                   "assets that are all long-term, against liabilities due "
                   "next month, is a problem the totals conceal."),
    ]),

    ("Reading an Income Statement", [
        desc(
            "The income statement works down from revenue to profit through "
            "named stages, and the stages matter."
        ),
        ol([
            "REVENUE -- what was earned in the period.",
            "Less cost of sales, giving GROSS PROFIT -- what the product "
            "itself earns.",
            "Less operating expenses, giving OPERATING PROFIT -- what the "
            "business earns from operating.",
            "Less interest and tax, giving NET PROFIT -- what is actually "
            "left.",
            "Each level answers a different question, which is why a single "
            "profit figure is not enough.",
        ]),
        desc(
            "Gross profit is the one engineers should notice. It reveals "
            "whether the thing being sold earns anything at all before any "
            "overhead is considered, and a product with poor gross margin "
            "cannot be rescued by selling more of it."
        ),
    ]),

    ("Profit Is Not Cash", [
        desc(
            "The single most common misunderstanding in this area deserves "
            "its own treatment."
        ),
        compare_grid(
            "PROFIT AGAINST CASH",
            "An accounting result, against money in the account.",
            [("Profit",
              ["Revenue recognised when earned",
               "Costs matched to the revenue they produced",
               "Depreciation reduces it without money moving",
               "A judgement, made within rules"]),
             ("Cash",
              ["Recorded when money actually moves",
               "Timing follows payment terms, not activity",
               "Buying equipment consumes it entirely, at once",
               "A fact, verifiable against a bank"])]),
        desc(
            "Both directions occur. A growing company can be profitable and "
            "running out of cash, because it pays for materials and staff "
            "before customers pay it -- and a loss-making one can hold plenty "
            "of cash for a while, which is why neither statement alone "
            "describes a business."
        ),
    ]),

    ("Capital and Operating Spending", [
        desc(
            "How a purchase is classified changes how it appears in the "
            "accounts, and organisations care about this a great deal."
        ),
        ul([
            "CAPITAL spending buys something with a life beyond the current "
            "period, and appears as an asset.",
            "Its cost reaches the income statement gradually, as "
            "depreciation over the asset's life.",
            "OPERATING spending is consumed in the period and reduces this "
            "period's profit entirely.",
            "Cash leaves at purchase in both cases, whatever the accounting "
            "treatment says.",
            "Which budget something falls under frequently decides whether "
            "it is approved, independently of whether it is a good idea.",
        ]),
        desc(
            "This is why the choice between buying servers and subscribing "
            "to a service is a financial question as much as a technical "
            "one. The same capability appears as an asset depreciated over "
            "years, or as an expense reducing profit immediately, and "
            "different organisations prefer different answers."
        ),
    ]),

    ("Depreciation", [
        desc(
            "Spreading an asset's cost across the period it is used is the "
            "mechanism behind most capital accounting."
        ),
        table(
            ["Method", "Spreads cost", "Suits"],
            [["Straight line", "Equally across the useful life",
              "Assets used evenly, and most IT equipment"],
             ["Reducing balance", "More in early years, less later",
              "Assets losing value quickly at first"],
             ["Usage based", "In proportion to how much it was used",
              "Machinery whose wear follows output"],
             ["Useful life", "The period the estimate assumes",
              "An estimate, revised if it proves wrong"],
             ["Residual value", "What is expected at the end",
              "Deducted before the cost is spread"]],
            caption="Depreciation methods and what each suits.",
            footer="Depreciation moves no money. It allocates a cost already "
                   "paid across the periods that benefit, which is why "
                   "profit falls without the bank balance changing -- and why "
                   "cash flow adds it back."),
    ]),

    ("Fixed and Variable Costs", [
        desc(
            "Whether a cost changes with volume determines almost every "
            "decision made about it."
        ),
        ul([
            "FIXED costs do not change with volume within a range -- rent, "
            "salaries, licences.",
            "VARIABLE costs change with each unit -- materials, transaction "
            "fees, usage charges.",
            "Semi-variable costs have both, such as a subscription with a "
            "usage component.",
            "Fixed costs make high volume profitable and low volume "
            "dangerous.",
            "Variable costs make the outcome predictable at any volume, and "
            "cap the upside.",
        ]),
        desc(
            "This is the whole shape of the on-premises against cloud "
            "argument. Buying capacity converts a variable cost into a fixed "
            "one, which is better when the volume is high and predictable "
            "and worse when it is neither."
        ),
    ]),

    ("Break-Even", [
        desc(
            "The point at which revenue covers all costs is the standard "
            "test of whether a proposal is viable."
        ),
        ol([
            "Establish fixed costs for the period.",
            "Establish the CONTRIBUTION per unit -- price less variable "
            "cost.",
            "Divide fixed costs by contribution per unit to get the "
            "break-even volume.",
            "Compare that volume against what can realistically be sold or "
            "used.",
            "Note how sensitive the answer is to the price and volume "
            "assumptions, since both are estimates.",
        ]),
        desc(
            "Step four is where proposals fail honestly. A break-even volume "
            "that exceeds anything the organisation has ever achieved is a "
            "clear answer, and computing it early saves considerable effort "
            "later."
        ),
    ]),

    ("Sunk Costs", [
        desc(
            "Money already spent is irrelevant to what happens next, and "
            "almost nobody behaves as though it were."
        ),
        ul([
            "A sunk cost cannot be recovered by any decision available now.",
            "The only question is whether the remaining cost is justified by "
            "the remaining benefit.",
            "How much has been spent so far does not appear in that "
            "question.",
            "Continuing because of what has been invested is the sunk cost "
            "fallacy.",
            "It is reinforced by the fact that abandoning a project makes "
            "the loss visible, while continuing conceals it.",
        ]),
        desc(
            "The last point explains why this error persists among people "
            "who know the principle. Cancellation converts an unacknowledged "
            "loss into a recorded one attributable to somebody, and "
            "continuing defers that -- which is an incentive rather than a "
            "misunderstanding."
        ),
    ]),

    ("Investment Appraisal", [
        desc(
            "Deciding whether a proposal is worth funding uses a small set "
            "of standard methods."
        ),
        table(
            ["Method", "Measures", "Ignores"],
            [["Payback period", "How long until the outlay is recovered",
              "Everything after that point, and the value of time"],
             ["Accounting rate of return",
              "Average profit against the investment",
              "The timing of the returns"],
             ["Net present value",
              "Value today of all future flows, discounted",
              "Nothing structural -- but depends on the discount rate"],
             ["Internal rate of return",
              "The discount rate at which value is zero",
              "The size of the project"],
             ["Total cost of ownership",
              "Everything a decision costs over its life",
              "Benefits, which must be assessed separately"]],
            caption="Five appraisal methods and their blind spots.",
            footer="PAYBACK is the most used and the least complete. It "
                   "answers how soon the money comes back and says nothing "
                   "about how much comes back, so a project repaying quickly "
                   "and then stopping beats one repaying slowly and then "
                   "continuing for a decade."),
    ]),

    ("The Time Value of Money", [
        desc(
            "Money available now is worth more than the same amount later, "
            "and appraisal methods differ chiefly in whether they admit it."
        ),
        ul([
            "Money now can be invested, so it grows.",
            "Money later is uncertain, and the further away the more so.",
            "DISCOUNTING converts future amounts into their value today.",
            "The discount rate reflects what the organisation could earn "
            "otherwise, and the risk of this particular proposal.",
            "A higher rate penalises distant returns heavily, which is why "
            "the rate chosen can decide the answer.",
        ]),
        desc(
            "The last point is worth carrying into any discussion of a "
            "discounted appraisal. The discount rate is chosen by somebody, "
            "and a long-payback project can be made to look good or bad by a "
            "defensible choice at either end of a reasonable range."
        ),
    ]),

    ("Net Present Value in Practice", [
        desc(
            "The most complete of the standard methods is also the one most "
            "often misapplied."
        ),
        ol([
            "Estimate the cash flows -- not profits -- for every period.",
            "Discount each back to today at the chosen rate.",
            "Sum them, including the initial outlay as a negative.",
            "A positive result means the proposal earns more than the rate "
            "demanded of it.",
            "Compare alternatives on their results, being careful that they "
            "cover the same period.",
        ]),
        desc(
            "Step one is where errors enter. Using profit rather than cash "
            "flow includes depreciation, which moves no money, and excludes "
            "the capital outlay, which moves a great deal -- so the answer "
            "describes something that is not the decision being made."
        ),
    ]),

    ("Total Cost of Ownership", [
        desc(
            "The purchase price of a system is a minority of what it will "
            "cost, which is the point of this measure."
        ),
        ul([
            "Acquisition -- the price, and everything needed to make it "
            "work.",
            "Implementation -- migration, integration, and the time of "
            "people who have other jobs.",
            "Operation -- hosting, licences, support, and the staff "
            "required.",
            "Change -- the ongoing cost of keeping it current.",
            "Retirement -- migrating away, and the data obligations that "
            "outlive the system.",
        ]),
        desc(
            "Retirement is routinely omitted and is routinely expensive. A "
            "system holding records with a retention obligation cannot "
            "simply be switched off, and discovering that at the end of its "
            "life is far too late to have budgeted for it."
        ),
    ]),

    ("Budgets", [
        desc(
            "Spending is authorised in advance through a budget, and how it "
            "is set determines what an engineer can actually do."
        ),
        ul([
            "A budget is a plan and an authorisation at the same time.",
            "Variance analysis compares actual spending against it, and asks "
            "why they differ.",
            "A favourable variance is not automatically good, since it may "
            "mean necessary work was not done.",
            "Budgets are usually annual, which is why timing a proposal "
            "matters as much as its merit.",
            "Capital and operating budgets are separate, and moving between "
            "them is generally not permitted.",
        ]),
        desc(
            "The fourth point is practical advice rather than theory. A "
            "sound proposal arriving after the budget is set waits a year "
            "unless something is displaced, which is why engineers who "
            "understand the cycle get more of their proposals funded."
        ),
    ]),

    ("Costing a System", [
        desc(
            "Attributing costs to what caused them is what makes charging "
            "and comparison possible."
        ),
        compare_grid(
            "DIRECT AGAINST INDIRECT COSTS",
            "Attributable, or shared.",
            [("Direct",
              ["Traceable to one system or project",
               "Licences bought for it, staff assigned to it",
               "Easy to attribute, and generally uncontested",
               "Usually a minority of the total"]),
             ("Indirect",
              ["Shared across everything -- premises, networks, management",
               "Allocated by some rule, which is a judgement",
               "The rule chosen changes which system looks expensive",
               "Usually a majority of the total"])]),
        desc(
            "The allocation rule is where these arguments actually happen. "
            "Charging shared infrastructure by headcount, by usage, or "
            "equally produces three different answers about which system "
            "costs the most, all defensible."
        ),
    ]),

    ("Financial Ratios", [
        desc(
            "Ratios turn absolute figures into comparisons, which is what "
            "makes them meaningful."
        ),
        content_accordion(
            "RATIOS THE SYLLABUS NAMES",
            "Each answers a question about a different aspect.",
            [("Current ratio",
              "Current assets against current liabilities. It answers "
              "whether what falls due within a year can be met from what "
              "becomes cash within a year."),
             ("Gross and net margin",
              "Profit at each level as a proportion of revenue. Gross "
              "margin describes the product; net margin describes the whole "
              "business."),
             ("Return on investment",
              "What was gained against what was put in. Its weakness is "
              "that it says nothing about how long the gain took."),
             ("Debt to equity",
              "How much of the organisation is funded by borrowing. Higher "
              "borrowing raises returns when things go well and raises the "
              "risk of not surviving when they do not."),
             ("Inventory and receivable turnover",
              "How quickly stock is sold and customers pay. Both convert "
              "directly into how much cash the business needs to "
              "operate.")]),
    ]),

    ("Financing Choices", [
        desc(
            "Where an organisation's money comes from affects what it can "
            "commit to."
        ),
        ul([
            "Retained profit -- no obligation attached, and limited by past "
            "performance.",
            "Borrowing -- must be repaid on a schedule regardless of how the "
            "year goes.",
            "Equity -- no repayment obligation, and the owners' share is "
            "diluted.",
            "Leasing -- spreads the cost, and generally costs more in "
            "total.",
            "Grants and subsidies -- attached to conditions that must "
            "actually be met.",
        ]),
        desc(
            "The obligation attached to borrowing is what makes it risky "
            "rather than the interest. Repayments continue during a poor "
            "year when revenue does not, which is why heavily borrowed "
            "organisations fail in downturns that others survive."
        ),
    ]),

    ("Cost Reduction Against Cost Avoidance", [
        desc(
            "Two claims are made about savings and only one of them shows in "
            "the accounts."
        ),
        table(
            ["Claim", "Means", "Visible where"],
            [["Cost reduction",
              "Spending falls below what it was",
              "The accounts, unambiguously"],
             ["Cost avoidance",
              "Spending that would have risen did not",
              "Nowhere -- it requires believing a counterfactual"],
             ["Productivity gain",
              "The same people produce more",
              "Only if the extra capacity is actually used"],
             ["Risk reduction",
              "A loss becomes less likely",
              "Only in its absence, which proves nothing"],
             ["Revenue enablement",
              "Something becomes possible that was not",
              "Revenue, if it materialises"]],
            caption="Five benefit claims and where each can be seen.",
            footer="The second and fourth are the ones finance functions "
                   "discount heavily, and they are right to. Both rest on a "
                   "claim about what would otherwise have happened, which "
                   "nobody can verify afterwards."),
    ]),

    ("Building a Business Case", [
        desc(
            "The engineer's practical output in this area is a case somebody "
            "else will decide on."
        ),
        ol([
            "State the problem in the organisation's terms, not technical "
            "ones.",
            "State the options, including doing nothing, and what each "
            "costs over its life.",
            "State the benefits, distinguishing those that will show in the "
            "accounts from those that will not.",
            "State the assumptions explicitly, since they are what the "
            "reader must judge.",
            "State the risks, and what would be done about each.",
        ]),
        desc(
            "Including the do-nothing option is what makes a case credible. "
            "It gives the decision maker the baseline against which "
            "everything else is compared, and its cost is rarely zero -- "
            "which is frequently the strongest argument available."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc(
            "Financial reasoning appears throughout the certification, "
            "usually without being named."
        ),
        content_tabs(
            "WHERE THIS REAPPEARS",
            "Each tab is a category that relies on this lesson.",
            [("Project management", "Cost management and sunk costs",
              "Earned value, budget variance and the decision whether to "
              "continue a struggling project all rest on the distinction "
              "between money spent and money still to spend."),
             ("Service management", "Charging and total cost",
              "Service costing, charge-back and supplier agreements are the "
              "direct and indirect cost allocation of this lesson applied "
              "to running services."),
             ("System strategy", "Investment appraisal",
              "Deciding between building, buying and subscribing is a "
              "capital-against-operating question with a discounted "
              "comparison behind it."),
             ("Business strategy", "Margins and viability",
              "Gross margin determines whether a product is worth selling "
              "at all, which is where product and portfolio decisions "
              "start."),
             ("Business industry", "Fixed against variable",
              "The economics of platforms, subscriptions and per-unit "
              "manufacturing are all the fixed-variable distinction applied "
              "to different industries.")]),
    ]),

    ("Common Mistakes", [
        desc("Where financial items are lost."),
        review_cards(
            "MISTAKES THAT COST MARKS HERE",
            "Each is a plausible answer that is wrong.",
            [("Treating profit and cash as the same thing",
              "Revenue is recognised when earned and cash arrives when it "
              "arrives, so a profitable company can fail to pay its staff.",
              "Items describe good results and a payment problem "
              "simultaneously."),
             ("Letting money already spent affect a continue decision",
              "Sunk costs are unrecoverable, so only remaining cost against "
              "remaining benefit matters.",
              "The item usually states how much has been spent, as bait."),
             ("Choosing on payback period alone",
              "It ignores everything after the payback point and the value "
              "of time, so it can prefer a worse project.",
              "Look for a project that repays slowly and then continues."),
             ("Using profit rather than cash flow in a discounted appraisal",
              "That includes depreciation, which moves no money, and "
              "excludes the outlay, which moves a great deal.",
              "The method requires cash flows specifically."),
             ("Presenting cost avoidance as a saving",
              "It rests on what would otherwise have happened, which cannot "
              "be verified, and finance functions discount it.",
              "Distinguish it clearly rather than blending it in.")]),
    ]),

    ("Review", [
        desc("The points items are built on."),
        review_cards(
            "WHAT TO CARRY OUT OF THIS LESSON",
            "Answer each before moving on.",
            [("Why do profit and cash differ?",
              "Revenue is recognised when earned rather than received, and "
              "depreciation reduces profit without moving money.",
              "Which is why the cash flow statement exists separately."),
             ("What does capitalising a purchase do?",
              "It puts the cost on the balance sheet and spreads it through "
              "depreciation rather than hitting this period's profit.",
              "Cash still leaves at purchase."),
             ("What is the only question about a struggling project?",
              "Whether the remaining cost is justified by the remaining "
              "benefit.",
              "What has been spent is irrelevant to it."),
             ("What does payback ignore?",
              "Everything after the payback point, and the time value of "
              "money.",
              "Which is why it can prefer the worse project."),
             ("What goes into a net present value calculation?",
              "Cash flows, discounted at a chosen rate, with the outlay as "
              "a negative.",
              "Not profits."),
             ("Which benefit claims does finance discount?",
              "Cost avoidance and risk reduction, since both rest on "
              "unverifiable counterfactuals.",
              "State them separately from real savings.")]),
    ]),
]


_fin_quiz = [
    mcq("HARD",
        "The best profit in years is reported, and next month's payroll "
        "cannot be met.\n\nHow is this possible?",
        [("Revenue is recognised when earned rather than when it is "
          "received", True),
         ("The profit figure was calculated before interest and taxation "
          "had been deducted from it", False),
         ("Depreciation on recently purchased equipment has consumed the "
          "available cash balance", False),
         ("Payroll is an operating expense and is therefore excluded from "
          "the profit calculation", False)],
        "Profit is an accounting result and cash is a fact. A company that "
        "has earned revenue its customers have not yet paid, while paying "
        "its own suppliers and staff on time, is profitable and short of "
        "cash simultaneously. This is the ordinary condition of a rapidly "
        "growing business and it is why the cash flow statement exists."),

    mcq("AVERAGE",
        "Equipment is purchased and capitalised rather than expensed.\n\nWhat "
        "is the effect on this period?",
        [("Profit falls by the depreciation only, not the full "
          "price", True),
         ("Profit is unaffected, because the purchase appears entirely on "
          "the balance sheet instead", False),
         ("Cash is unaffected, because the cost is spread across the "
          "asset's whole useful life", False),
         ("Both profit and cash fall by the full purchase price in the "
          "period of acquisition", False)],
        "Capitalising records the purchase as an asset and charges its cost "
        "to profit gradually as depreciation, so only this period's "
        "depreciation reduces profit. Cash, however, left in full at "
        "purchase regardless of the accounting treatment -- which is the "
        "distinction the treatment does not change."),

    mcq("AVERAGE",
        "Four million has been spent on a project, and completing it will "
        "cost two million more for a benefit worth one and a half "
        "million.\n\nWhat should happen?",
        [("It should be stopped", True),
         ("It should be completed, because abandoning it would waste the "
          "four million already committed", False),
         ("It should be completed if the remaining benefit and the total "
          "spending are close enough to justify it", False),
         ("It should be reassessed once the four million already spent has "
          "been recovered from the benefits", False)],
        "The four million is sunk and cannot be recovered by any available "
        "decision, so it has no place in the comparison. Two million spent "
        "for one and a half million of benefit destroys half a million of "
        "value, and completing the project does not recover anything -- it "
        "merely adds a further loss to the one already incurred."),

    mcq("HARD",
        "Two proposals are compared, and the one with the shorter payback "
        "period is chosen.\n\nWhat may this have missed?",
        [("Returns continuing long after the payback point", True),
         ("The proportion of each proposal's cost that falls in the first "
          "year of its operation", False),
         ("Whether the initial outlay for each proposal was calculated on "
          "a comparable basis", False),
         ("The risk that the projected returns for either proposal fail to "
          "materialise at all", False)],
        "Payback measures how soon the outlay returns and stops asking "
        "questions at that point. A project repaying in two years and then "
        "ending can therefore beat one repaying in four and returning "
        "steadily for a decade, which is why payback is used as a screen "
        "rather than as the decision."),

    mcq("AVERAGE",
        "Projected profits are used to prepare a net present value "
        "calculation.\n\nWhat is wrong with this?",
        [("The method requires cash flows, which differ from "
          "profits", True),
         ("Profits are stated after taxation and the calculation must be "
          "performed on a pre-tax basis", False),
         ("Profits are reported annually and the calculation requires "
          "figures for shorter periods", False),
         ("Profits include revenue that may not be collected within the "
          "period being examined", False)],
        "Profit includes depreciation, which moves no money, and excludes "
        "the capital outlay, which moves a great deal. Discounting profits "
        "therefore values something other than the decision being made. The "
        "method operates on cash flows precisely because those are what the "
        "organisation actually experiences."),

    mcq("HARD",
        "The discount rate used in an appraisal is raised.\n\nWhich "
        "proposals suffer most?",
        [("Those whose returns arrive furthest in the future", True),
         ("Those with the largest initial outlay relative to their expected "
          "total return", False),
         ("Those with returns that vary considerably from one period to the "
          "next during their life", False),
         ("Those funded by borrowing rather than from the organisation's "
          "own retained profits", False)],
        "Discounting reduces a future amount by more the further away it is, "
        "and raising the rate steepens that effect. A proposal returning "
        "steadily for ten years is penalised far more than one returning "
        "within two -- which is why the rate chosen, itself a judgement, can "
        "decide between proposals."),

    mcq("AVERAGE",
        "Capacity is bought outright instead of being subscribed to.\n\nHow "
        "does the cost structure change?",
        [("A variable cost becomes a fixed one", True),
         ("A fixed cost becomes a variable one, because usage now "
          "determines what the capacity delivers", False),
         ("The total cost falls, because purchasing avoids the margin a "
          "provider adds to a subscription", False),
         ("Costs become easier to attribute, because the purchase relates "
          "to one identifiable system", False)],
        "Purchased capacity costs the same whether it is used heavily or "
        "barely at all, which is the definition of a fixed cost. This is "
        "advantageous where volume is high and predictable and dangerous "
        "where it is neither, and it is the actual shape of the argument "
        "between owning and subscribing."),

    mcq("AVERAGE",
        "Shared infrastructure cost is allocated across systems by "
        "headcount rather than by usage.\n\nWhat does this change?",
        [("Which system appears to be the expensive one", True),
         ("The total indirect cost that must be recovered from the systems "
          "between them", False),
         ("Whether the cost is classified as a direct or an indirect one "
          "for accounting purposes", False),
         ("The accuracy of the total, because headcount is measured more "
          "reliably than usage", False)],
        "The allocation rule redistributes a fixed total, so it changes "
        "which system carries what without changing the sum. Since the rule "
        "is a judgement rather than a fact, several defensible rules produce "
        "several different answers about which system costs most -- which is "
        "where these arguments actually occur."),

    mcq("HARD",
        "Large savings from cost avoidance are claimed in a proposal.\n\nWhy do "
        "finance functions discount such claims?",
        [("They rest on what would otherwise have happened", True),
         ("They are usually estimated by the people proposing the project "
          "rather than independently", False),
         ("They arise too far in the future to be discounted to a "
          "meaningful present value", False),
         ("They relate to operating spending, which is not permitted to "
          "justify capital investment", False)],
        "Cost avoidance asserts that spending which would have risen did "
        "not, and no accounting record can ever confirm it because the "
        "alternative history did not occur. Cost reduction, by contrast, "
        "appears as spending that is lower than it was, which is verifiable "
        "-- which is why the two are stated separately in a credible case."),

    mcq("AVERAGE",
        "The option of doing nothing is omitted from a business case.\n\nWhy does this "
        "weaken it?",
        [("The baseline for comparison is missing", True),
         ("Regulations require every option to be documented before an "
          "investment decision can be taken", False),
         ("Doing nothing is normally the least expensive option and "
          "therefore the most likely choice", False),
         ("Decision makers cannot assess risk without an option carrying no "
          "implementation risk at all", False)],
        "Every option's cost and benefit are meaningful only against what "
        "happens if nothing changes, and that baseline is rarely free -- "
        "existing costs continue, problems worsen, and obligations still "
        "arrive. Stating it explicitly is frequently the strongest argument "
        "the proposal has."),
]


LESSON_FIN = lesson(
    MAJOR, MIDDLE,
    "Accounting and Financial Affairs for Engineers",
    _fin_quiz,
    lesson_structure(
        "Accounting and Financial Affairs for Engineers",
        "Engineers are not asked to prepare accounts; they are asked to "
        "justify spending and to understand the answer. The central "
        "distinction is that PROFIT is an accounting judgement and CASH is a "
        "fact, so a profitable organisation can fail to meet its payroll. "
        "This lesson covers the three statements, capital against operating "
        "spending and why classification decides approvals, fixed against "
        "variable costs which is the real shape of the owning-against-"
        "subscribing argument, SUNK COSTS and why the fallacy persists among "
        "people who know it, and the appraisal methods with what each "
        "ignores.",
        [
            "Explain why profit and cash differ",
            "Read the three financial statements",
            "Distinguish capital from operating spending",
            "Explain what depreciation does and does not move",
            "Distinguish fixed from variable costs",
            "Apply the sunk cost principle to a continue decision",
            "State what each appraisal method ignores",
            "Distinguish cost reduction from cost avoidance",
        ],
        75,
        _fin_sections,
        [
            ("Profit against cash",
             "Revenue is recognised when earned, so a profitable "
             "organisation can run out of money."),
            ("Capital against operating",
             "Capitalising spreads the cost through depreciation; cash still "
             "leaves at purchase."),
            ("Depreciation",
             "Allocates a cost already paid across periods -- it moves no "
             "money."),
            ("Fixed against variable",
             "Buying capacity makes a variable cost fixed, which suits high "
             "predictable volume."),
            ("Sunk costs",
             "Only remaining cost against remaining benefit matters; what "
             "was spent is irrecoverable."),
            ("Payback",
             "Ignores everything after the payback point and the time value "
             "of money."),
            ("Net present value",
             "Operates on CASH FLOWS discounted at a chosen rate, not on "
             "profits."),
            ("Cost avoidance",
             "Rests on an unverifiable counterfactual, so finance functions "
             "discount it heavily."),
        ],
        "The distinction to carry out of this lesson is that PROFIT is an "
        "accounting result reached by judgement and CASH is a fact: revenue "
        "is recognised when earned rather than received, and depreciation "
        "reduces profit without money moving -- so a company can report its "
        "best year and be unable to pay its staff. CAPITAL spending buys "
        "something lasting and reaches the income statement gradually, while "
        "OPERATING spending reduces this period's profit entirely, and which "
        "budget a proposal falls under frequently decides whether it is "
        "approved. FIXED costs do not change with volume and VARIABLE ones "
        "do, which is the actual shape of the argument between owning "
        "capacity and subscribing to it. SUNK costs are irrecoverable, so "
        "only remaining cost against remaining benefit decides whether to "
        "continue -- and the fallacy persists because cancelling makes a "
        "loss visible and attributable while continuing conceals it. Of the "
        "appraisal methods, PAYBACK ignores everything after the payback "
        "point, and NET PRESENT VALUE operates on cash flows rather than "
        "profits, at a discount rate somebody chose. And cost avoidance is "
        "discounted by finance functions because it rests on a "
        "counterfactual nobody can verify.",
        exam_notes=[
            desc(
                "Items describe a financial situation and ask which "
                "principle explains or resolves it."
            ),
            ul([
                "Explaining profit alongside a cash shortage.",
                "Stating the effect of capitalising a purchase.",
                "Applying sunk costs to a continue decision.",
                "Identifying what payback ignores.",
                "Correcting a discounted appraisal built on profits.",
                "Explaining who a higher discount rate penalises.",
                "Recognising a variable cost made fixed.",
                "Explaining why cost avoidance is discounted.",
            ]),
            desc(
                "For any item here, ask whether the question is about money "
                "moving or about an accounting result, and whether the "
                "amount mentioned is still recoverable. Those two "
                "distinctions decide most of the answers in this area."
            ),
        ],
    ))


LESSONS = [LESSON_FIN]

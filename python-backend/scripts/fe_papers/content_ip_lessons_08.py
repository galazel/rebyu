"""IT Passport lesson content: Corporate Activities and Legal Affairs (709-714)."""

import sys

sys.path.insert(0, "/app/scripts/fe_expansion")

from builders import (  # noqa: E402
    accordion, compare_grid, content_tabs, desc, flip_cards, image, image_text,
    lesson_structure, media_text, ol, review_cards, sub, table, tabs, ul,
)

FIG = "/lesson-media/%s.svg"

CERTIFICATION_ID = 4

LESSONS = {}


LESSONS[709] = lesson_structure(
    name="OR and IE",
    intro=(
        "Operations research and industrial engineering apply quantitative methods to "
        "business decisions: how to allocate limited resources, how to schedule work, "
        "and how to read the numbers that describe a process. This lesson covers the "
        "techniques the IT Passport examination asks about, each with a worked example."
    ),
    objectives=[
        "Calculate a break-even point and interpret it.",
        "Use a decision table to express combinations of conditions.",
        "Read an arrow diagram and identify the critical path.",
        "Apply inventory concepts such as ABC analysis.",
        "Use simple probability and expected value in a decision.",
        "Interpret the quality charts used in process improvement.",
    ],
    minutes=40,
    sections=[
        ("Break-even analysis", [
            desc(
                "The break-even point is the volume at which revenue exactly covers "
                "cost. Below it the business loses money on the product; above it, each "
                "additional unit contributes profit."
            ),
            ol([
                "Contribution per unit = selling price - variable cost per unit.",
                "Break-even volume = fixed costs / contribution per unit.",
            ]),
            desc(
                "A product selling for 500 with variable cost 300 contributes 200 per "
                "unit. Against fixed costs of 400,000 the break-even volume is 400,000 / "
                "200 = 2,000 units."
            ),
            desc(
                "The lesson the figure teaches is about structure: high fixed costs and "
                "high contribution mean a business that loses heavily below break-even "
                "and profits steeply above it."
            ),
        ]),
        ("Decision tables", [
            desc(
                "A decision table lists conditions and the action to take for each "
                "combination. Its value is completeness -- every combination appears, so "
                "none is overlooked."
            ),
            table(
                ["Member?", "Order over 5,000?", "Discount"],
                [["Yes", "Yes", "15%"],
                 ["Yes", "No", "10%"],
                 ["No", "Yes", "5%"],
                 ["No", "No", "0%"]],
                caption="Two conditions give four rows; three would give eight.",
            ),
            desc(
                "Decision tables are used in requirements work precisely because they "
                "expose the combination nobody thought about, which is usually where the "
                "defect lives."
            ),
        ]),
        ("Scheduling and the critical path", [
            desc(
                "An arrow diagram shows activities, their durations and what must finish "
                "before each can start. The critical path is the longest route through "
                "it, and it fixes the shortest possible project duration."
            ),
            ul([
                "Activities on the critical path have zero float -- any delay delays the project.",
                "Activities off it have float, and can slip by that much harmlessly.",
                "Shortening the project means shortening the critical path; speeding anything else changes nothing.",
            ]),
        ]),
        ("Inventory", [
            desc(
                "Holding stock costs money and running out costs more. Inventory "
                "technique is about deciding where attention belongs."
            ),
            accordion([
                ("ABC analysis", "Rank items by value. A small number of items account for most of the value; they deserve tight control, while the many low-value items do not."),
                ("Reorder point", "The stock level at which a new order is placed, set so that delivery arrives before stock runs out."),
                ("Safety stock", "A buffer held against demand or delivery varying more than expected."),
                ("Economic order quantity", "The order size balancing the cost of ordering against the cost of holding."),
            ]),
        ]),
        ("Probability in decisions", [
            desc(
                "Expected value weighs each outcome by its likelihood, turning an "
                "uncertain choice into a comparable number."
            ),
            desc(
                "A project with a 30% chance of earning 1,000,000 and a 70% chance of "
                "earning 200,000 has an expected value of 0.3 x 1,000,000 + 0.7 x "
                "200,000 = 440,000. That figure is what can be compared against an "
                "alternative -- while remembering no single outcome ever equals it."
            ),
        ]),
        ("Quality charts", [
            desc(
                "Several charts appear repeatedly in process improvement, each answering "
                "a different question."
            ),
            image(FIG % "ip-chart-choice"),
            table(
                ["Chart", "Answers", "Typical use"],
                [["Pareto", "Which few causes dominate?", "Aiming effort at the biggest contributors"],
                 ["Fishbone", "What could be causing this?", "Structuring a cause hunt"],
                 ["Control chart", "Is this variation normal?", "Separating ordinary variation from a special cause"],
                 ["Histogram", "What shape is the distribution?", "Seeing what an average conceals"],
                 ["Scatter", "Do these two move together?", "Examining a suspected relationship"]],
            ),
        ]),
        ("Linear programming", [
            desc(
                "Linear programming finds the best achievable value of an objective -- "
                "maximum profit, minimum cost -- subject to constraints such as available "
                "materials, hours or capacity."
            ),
            desc(
                "The examination asks for recognition rather than solution: given a "
                "problem about allocating limited resources between competing uses, the "
                "technique named is linear programming."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Fixed 300,000, contribution 150 -- break-even?", "2,000 units",
                 "300,000 / 150. Contribution is price minus variable cost."),
                ("Zero float means?", "On the critical path",
                 "Any delay to it delays the whole project."),
                ("Which chart shows the vital few causes?", "Pareto",
                 "Bars ordered by frequency with a cumulative line."),
                ("Three conditions in a decision table -- how many rows?", "Eight",
                 "2^3. Every combination must appear."),
            ]),
        ]),
    ],
    key_terms=[
        ("Break-even point", "The volume at which revenue exactly covers total cost."),
        ("Contribution", "Selling price minus variable cost per unit."),
        ("Critical path", "The longest route through a project network; it has zero float."),
        ("ABC analysis", "Ranking inventory by value so control matches importance."),
        ("Expected value", "Each outcome weighted by its probability, summed."),
        ("Linear programming", "Optimising an objective subject to linear constraints."),
    ],
    summary=(
        "Break-even divides fixed costs by contribution per unit and reveals how a cost "
        "structure behaves either side of it. Decision tables enumerate every "
        "combination of conditions, which is how overlooked cases are found. The "
        "critical path fixes the shortest project duration and has zero float. ABC "
        "analysis directs inventory control at the items carrying most value, expected "
        "value compares uncertain outcomes, and each quality chart answers a distinct "
        "question about a process."
    ),
    exam_notes=[
        desc(
            "Break-even is examined by calculation nearly every sitting. Remember "
            "contribution is price minus VARIABLE cost -- subtracting the fixed cost "
            "here is the usual error."
        ),
        ul([
            "Break-even = fixed costs / (price - variable cost).",
            "Critical path activities have zero float.",
            "Pareto ranks causes; fishbone structures the search for them.",
        ]),
    ],
)


LESSONS[710] = lesson_structure(
    name="Accounting and financial affairs",
    intro=(
        "Every IT decision is eventually a financial one. This lesson covers the "
        "financial statements a company publishes, the vocabulary of cost and profit, "
        "depreciation, and the methods used to judge whether an investment is worth "
        "making."
    ),
    objectives=[
        "Distinguish the balance sheet from the income statement.",
        "Explain the difference between fixed and variable costs.",
        "Calculate depreciation on the straight-line method.",
        "Distinguish profit from cash flow.",
        "Apply payback period and describe what it ignores.",
        "Explain total cost of ownership.",
    ],
    minutes=40,
    sections=[
        ("The financial statements", [
            desc(
                "Three statements together describe a company's finances, and they "
                "answer different questions."
            ),
            table(
                ["Statement", "Answers", "Covers"],
                [["Balance sheet", "What do we own and owe?", "A single point in time"],
                 ["Income statement", "Did we make a profit?", "A period"],
                 ["Cash flow statement", "Did cash come in or go out?", "A period"]],
                caption="A snapshot and two films; confusing them is the usual mistake.",
            ),
            desc(
                "The balance sheet balances because assets equal liabilities plus "
                "equity: everything owned was funded either by borrowing or by owners."
            ),
        ]),
        ("Fixed and variable costs", [
            compare_grid(
                "Two ways a cost behaves",
                "The distinction drives break-even, pricing and capacity decisions.",
                [("Fixed cost",
                  "Does not change with volume: rent, salaries, licences. Per unit it "
                  "falls as volume rises."),
                 ("Variable cost",
                  "Changes in proportion to volume: materials, transaction fees, usage "
                  "billing. Per unit it stays roughly constant.")],
            ),
            desc(
                "Cloud services convert fixed cost into variable cost. That is often "
                "described as a saving and is more precisely a change in shape -- "
                "attractive when demand is uncertain, and not automatically cheaper over "
                "a steady multi-year load."
            ),
        ]),
        ("Profit and its layers", [
            ol([
                "Revenue -- what was earned from sales.",
                "Gross profit -- revenue minus the direct cost of what was sold.",
                "Operating profit -- gross profit minus running costs such as salaries and rent.",
                "Net profit -- operating profit after interest and tax.",
            ]),
            desc(
                "Each layer answers a different question. Gross profit says whether the "
                "product itself is viable; operating profit says whether the business "
                "around it is."
            ),
        ]),
        ("Depreciation", [
            desc(
                "Equipment is not charged entirely to the year it was bought. Its cost "
                "is spread across the years it will be used, which matches the expense "
                "to the benefit."
            ),
            desc(
                "Straight-line depreciation = (cost - residual value) / useful life. "
                "Equipment costing 1,200,000 with a residual value of 200,000 and a "
                "five-year life depreciates by (1,200,000 - 200,000) / 5 = 200,000 a "
                "year."
            ),
            desc(
                "Forgetting to subtract the residual value first is the commonest error "
                "in this calculation."
            ),
        ]),
        ("Profit is not cash", [
            desc(
                "A company can be profitable and still fail, because profit is recorded "
                "when a sale is made and cash arrives when the customer pays."
            ),
            desc(
                "A business selling on 90-day terms records profit immediately and waits "
                "three months for the money, while paying staff and suppliers throughout. "
                "Running out of cash ends a company regardless of its profit."
            ),
        ]),
        ("Judging an investment", [
            accordion([
                ("Payback period", "How long until cumulative returns equal the cost. Simple and ignores both the time value of money and anything happening after payback."),
                ("Return on investment", "Gain relative to cost, as a percentage. Comparable across options of different sizes."),
                ("Net present value", "Future cash flows discounted to today's value. Recognises that money now is worth more than money later."),
                ("Internal rate of return", "The discount rate at which NPV is zero; compared against the cost of capital."),
            ]),
            desc(
                "A 300,000 investment returning 100,000 a year has a three-year payback. "
                "That figure says nothing about whether it returns anything in year four, "
                "which is exactly why NPV exists."
            ),
        ]),
        ("Total cost of ownership", [
            desc(
                "Purchase price is the visible fraction of a multi-year commitment. TCO "
                "gathers everything: acquisition, installation, migration, training, "
                "support, power, and disposal."
            ),
            desc(
                "Comparing on purchase price alone systematically favours options that "
                "are cheap to buy and expensive to keep -- which is how organisations "
                "acquire systems they cannot afford to run."
            ),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Which statement is a point in time?", "The balance sheet",
                 "Income and cash flow statements cover a period."),
                ("Cost 900,000, residual 100,000, 4 years?", "200,000 a year",
                 "(900,000 - 100,000) / 4. Subtract residual first."),
                ("Can a profitable company fail?", "Yes",
                 "Profit is recorded on sale; cash arrives when the customer pays."),
                ("What does payback ignore?", "Everything after payback",
                 "And the time value of money."),
            ]),
        ]),
    ],
    key_terms=[
        ("Balance sheet", "Assets, liabilities and equity at a single point in time."),
        ("Fixed cost", "A cost that does not vary with volume."),
        ("Depreciation", "Spreading an asset's cost across its useful life."),
        ("Cash flow", "Money actually moving in and out, distinct from profit."),
        ("Payback period", "Time until cumulative returns equal the investment."),
        ("TCO", "Total cost of ownership across the whole life of an asset."),
    ],
    summary=(
        "The balance sheet is a snapshot while income and cash flow statements cover a "
        "period. Fixed costs are independent of volume and variable costs move with it, "
        "which drives break-even and makes cloud a change in cost shape rather than an "
        "automatic saving. Depreciation spreads an asset's cost over its life after "
        "removing residual value. Profit and cash are different, and running out of the "
        "second ends a company regardless of the first. Payback is simple and blind "
        "beyond its own horizon, which is why NPV and TCO exist."
    ),
    exam_notes=[
        desc(
            "Depreciation and payback are both examined by calculation. For "
            "depreciation, subtract the residual value before dividing; for payback, "
            "divide the investment by the annual return."
        ),
        ul([
            "Straight-line = (cost - residual) / useful life.",
            "Profit is not cash. A profitable company can still run out.",
            "Purchase price is not TCO.",
        ]),
    ],
)


LESSONS[711] = lesson_structure(
    name="Intellectual property rights",
    intro=(
        "Intellectual property is the set of rights protecting creations of the mind. "
        "This lesson covers which right protects what, how each arises, what it permits "
        "and forbids, and the questions that arise routinely in IT -- software licences, "
        "work created by employees, and material found online."
    ),
    objectives=[
        "Distinguish copyright, patent, trademark and trade secret.",
        "State what copyright protects and what it does not.",
        "Explain who owns work created by an employee or a contractor.",
        "Describe what a software licence grants.",
        "Explain the risks of using material found online.",
        "Describe what a trade secret requires to remain protected.",
    ],
    minutes=40,
    sections=[
        ("Four different rights", [
            desc(
                "They are not interchangeable. Each protects a different kind of thing, "
                "arises differently and lasts a different length of time."
            ),
            table(
                ["Right", "Protects", "Arises", "Duration"],
                [["Copyright", "The expression of a work", "Automatically on creation", "Decades after the author's death"],
                 ["Patent", "A technical invention", "Only by application and grant", "About 20 years"],
                 ["Trademark", "A sign distinguishing goods", "By use and registration", "Renewable indefinitely"],
                 ["Trade secret", "Confidential business information", "By keeping it secret", "As long as secrecy holds"]],
            ),
        ]),
        ("Copyright", [
            desc(
                "Copyright protects the particular EXPRESSION of an idea, not the idea "
                "itself. Two developers who independently write programs implementing the "
                "same published algorithm each hold copyright in their own code."
            ),
            ul([
                "Arises automatically -- no registration, no notice required.",
                "Covers source code, documentation, images, music, text, video.",
                "Grants exclusive rights to copy, adapt, distribute and publish.",
                "Independent creation is a complete defence.",
            ]),
            desc(
                "Because it is automatic, everything on the internet is copyrighted by "
                "default. The absence of a notice grants nothing; permission is required "
                "unless a licence says otherwise."
            ),
        ]),
        ("Patents and trade secrets", [
            compare_grid(
                "Two ways to protect an invention",
                "They are opposite bargains, and only one can be chosen.",
                [("Patent",
                  "Publish exactly how it works, in exchange for a time-limited monopoly. "
                  "Enforceable against independent inventors."),
                 ("Trade secret",
                  "Tell nobody, and protection lasts indefinitely -- until the "
                  "information escapes or somebody independently discovers it, at which "
                  "point nothing remains.")],
            ),
            desc(
                "A trade secret must be actively protected to stay one: restricted "
                "access, confidentiality agreements, and evidence that the organisation "
                "treated it as secret."
            ),
        ]),
        ("Who owns what was created", [
            accordion([
                ("Employee work", "Work created in the course of employment generally belongs to the employer, subject to local law and contract."),
                ("Contractor work", "Ownership does NOT automatically pass to the paying party. Without a clause assigning it, the contractor may retain the rights."),
                ("Joint work", "Ambiguous unless agreed in advance, and disputed precisely when it becomes valuable."),
                ("Commissioned work", "Depends on the contract; assuming payment transfers ownership is a frequent and expensive error."),
            ]),
            desc(
                "The practical rule: settle ownership in writing before creation, not "
                "after. Ambiguity costs nothing until the work succeeds."
            ),
        ]),
        ("Software licences", [
            desc(
                "Buying software almost never means buying its copyright. A licence "
                "grants permission to use it within stated limits, and the copyright "
                "stays with the licensor."
            ),
            table(
                ["Licence type", "Permits", "Watch for"],
                [["Per seat / per user", "A stated number of named users", "Counting actual installations"],
                 ["Site licence", "Use within an organisation or location", "The defined boundary"],
                 ["Subscription", "Use while payments continue", "What happens to your data if you stop"],
                 ["Open source permissive", "Use, including commercially", "Preserving the copyright notice"],
                 ["Open source copyleft", "Use and modification", "Distribution obliges you to share source"]],
            ),
            desc(
                "Deploying more copies than purchased is a licence breach regardless of "
                "intent. The remedy is to true up -- buy the shortfall or remove the "
                "excess -- not to conceal it."
            ),
        ]),
        ("Using material found online", [
            ol([
                "Assume everything is protected unless a licence states otherwise.",
                "Read the licence; 'free to download' is not 'free to use commercially'.",
                "Creative Commons licences vary -- some forbid commercial use or modification.",
                "Attribute where the licence requires it, in the form it requires.",
                "Keep a record of where the material came from and under what terms.",
            ]),
            desc(
                "Using an image found by a search is the routine failure here, and the "
                "usual consequence is an invoice from a rights holder long afterwards."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Two developers, same algorithm, own code -- who infringes?", "Neither",
                 "Copyright protects expression; independent creation is a defence."),
                ("Which right needs an application?", "Patent",
                 "Copyright is automatic; a trade secret needs only secrecy."),
                ("Does paying a contractor transfer copyright?", "Not automatically",
                 "It needs an assignment clause in the contract."),
                ("What ends a trade secret?", "Disclosure",
                 "Or independent discovery. Protection lasts only while secrecy does."),
            ]),
        ]),
    ],
    key_terms=[
        ("Copyright", "Automatic protection for the expression of a work."),
        ("Patent", "A granted, time-limited monopoly over an invention, requiring disclosure."),
        ("Trademark", "A registered sign distinguishing goods or services in trade."),
        ("Trade secret", "Confidential information protected only while it remains secret."),
        ("Licence", "Permission to use protected work within stated conditions."),
        ("Work for hire", "Work created in employment, generally owned by the employer."),
    ],
    summary=(
        "Copyright arises automatically and protects expression rather than ideas, so "
        "independent creation is a defence and everything online is protected by "
        "default. Patents require application and disclosure in exchange for a "
        "time-limited monopoly, while trade secrets last indefinitely and end the "
        "moment secrecy does. Employee work generally belongs to the employer, whereas "
        "contractor work does not pass without a clause. Software licences grant use, "
        "not ownership, and over-deployment is a breach however unintentional."
    ),
    exam_notes=[
        desc(
            "The examination tests the copyright/patent boundary directly: ideas and "
            "algorithms are not protected by copyright, only their expression is. The "
            "contractor-ownership question is also a favourite."
        ),
        ul([
            "Copyright: automatic, expression only, independent creation is a defence.",
            "Patent: application required, disclosure in exchange for monopoly.",
            "A licence grants use; copyright stays with the licensor.",
        ]),
    ],
)


LESSONS[712] = lesson_structure(
    name="Laws on security",
    intro=(
        "Information security is a legal obligation as well as a technical practice. "
        "This lesson covers the laws that govern unauthorised access, personal data and "
        "electronic signatures, what they require of an organisation, and what must "
        "happen when something goes wrong."
    ),
    objectives=[
        "Describe what unauthorised access law prohibits.",
        "State what counts as personal information.",
        "Describe the principles governing personal data handling.",
        "Explain breach notification obligations.",
        "Describe what an electronic signature law provides.",
        "Explain why authorisation is bounded by purpose.",
    ],
    minutes=35,
    sections=[
        ("Unauthorised access", [
            desc(
                "Laws against unauthorised computer access prohibit reaching a system or "
                "data without permission, and typically also prohibit obtaining or "
                "supplying another person's credentials."
            ),
            desc(
                "Authorisation is bounded by PURPOSE, not only by credentials. An "
                "employee with a valid login who browses records unrelated to their "
                "duties is acting without authorisation, and that is why access logging "
                "and periodic review exist alongside authentication."
            ),
        ]),
        ("Personal information", [
            desc(
                "Personal information is data identifying a specific living individual, "
                "directly or in combination with other data held."
            ),
            table(
                ["Is personal information", "Is not, by itself"],
                [["Name with address", "Aggregate regional sales totals"],
                 ["Customer number linked to a person", "A company registration number"],
                 ["Photograph of an identifiable person", "Average age of all customers"],
                 ["Device identifier tied to an individual", "Fully anonymised statistics"]],
                caption="Combination matters: two harmless fields together may identify someone.",
            ),
            desc(
                "Some categories -- health, beliefs, biometrics, criminal history -- are "
                "treated as especially sensitive and carry stricter conditions."
            ),
        ]),
        ("The principles", [
            ol([
                "Collect for a specified, legitimate purpose, and say what it is.",
                "Collect only what that purpose needs.",
                "Use it only for that purpose; a new purpose needs a fresh lawful basis.",
                "Keep it accurate and up to date.",
                "Keep it only as long as the purpose requires.",
                "Protect it with measures proportionate to its sensitivity.",
                "Honour individuals' rights to see, correct and, in many regimes, erase it.",
            ]),
            desc(
                "Purpose limitation is the principle most often breached inadvertently: "
                "data gathered for delivery is later used for marketing, which is a new "
                "purpose and needs a new basis obtained BEFORE the use."
            ),
        ]),
        ("Sharing and transferring", [
            desc(
                "Passing personal data to another organisation -- including a cloud "
                "provider -- does not transfer responsibility for it. The original "
                "controller remains accountable."
            ),
            ul([
                "A processor acts on the controller's instructions, under a written contract.",
                "Transfers to other countries may require specific safeguards.",
                "Sub-processors -- a provider's own suppliers -- must be known and permitted.",
            ]),
        ]),
        ("When there is a breach", [
            desc(
                "A personal data breach is unauthorised access, disclosure, alteration "
                "or loss. Most regimes require notification to a regulator within a "
                "short deadline, and to affected individuals where the risk to them is "
                "high."
            ),
            desc(
                "The clock usually starts on BECOMING AWARE, not on fully understanding "
                "what happened. That is why an incident plan has to exist beforehand: "
                "there is no time to invent a process while the deadline runs."
            ),
            ol([
                "Contain and assess what data was involved and whose.",
                "Notify the regulator within the deadline.",
                "Notify individuals where the risk to them is high.",
                "Record the breach and the decisions taken, whether or not it was notifiable.",
            ]),
        ]),
        ("Electronic signatures", [
            desc(
                "Electronic signature law gives a qualifying electronic signature legal "
                "effect comparable to a handwritten one, which is what makes contracting "
                "without paper practical."
            ),
            desc(
                "A digital signature provides authentication and integrity: it shows the "
                "private key was used and the document is unaltered. Binding that key to "
                "a person is a matter of key management and certification -- which is why "
                "prompt reporting of a compromised key matters legally as well as "
                "technically."
            ),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Valid login, unrelated records -- authorised?", "No",
                 "Authorisation is bounded by purpose, not only by credentials."),
                ("When does the breach clock usually start?", "On becoming aware",
                 "Not on fully understanding it -- which is why a plan must pre-exist."),
                ("Does using a cloud provider transfer responsibility?", "No",
                 "The controller remains accountable for the data."),
                ("New purpose for existing data -- what is needed?", "A fresh lawful basis",
                 "Obtained before the new use, not notified afterwards."),
            ]),
        ]),
    ],
    key_terms=[
        ("Unauthorised access", "Reaching a system or data without permission, including beyond one's purpose."),
        ("Personal information", "Data identifying a specific living individual, alone or in combination."),
        ("Purpose limitation", "Using data only for the purpose it was collected for."),
        ("Controller", "The party deciding why and how personal data is processed, and accountable for it."),
        ("Breach notification", "The duty to report a qualifying breach within a set deadline."),
        ("Digital signature", "Cryptographic evidence of origin and integrity."),
    ],
    summary=(
        "Unauthorised access law covers exceeding one's purpose as well as breaking in, "
        "which is why logging and review accompany authentication. Personal information "
        "identifies a living individual, sometimes only in combination, and is governed "
        "by principles of purpose, minimisation, accuracy, retention, security and "
        "individual rights. Responsibility cannot be outsourced with the data. Breach "
        "notification runs on a short clock starting at awareness, and electronic "
        "signature law gives qualifying signatures legal effect."
    ),
    exam_notes=[
        desc(
            "Expect a scenario asking whether something is personal information -- watch "
            "for combinations that identify someone -- and one on whether an employee's "
            "access was authorised."
        ),
        ul([
            "Credentials do not equal authorisation; purpose bounds it.",
            "A new purpose needs a new lawful basis BEFORE use.",
            "Using a processor does not transfer accountability.",
        ]),
    ],
)


LESSONS[713] = lesson_structure(
    name="Laws on labor and transaction",
    intro=(
        "IT work is carried out under contracts and employment arrangements whose form "
        "decides who directs the work, who carries the risk, and what protections apply. "
        "This lesson covers the distinctions that matter in practice and the transaction "
        "law affecting how systems are bought and sold."
    ),
    objectives=[
        "Distinguish an employment contract from a contract for work.",
        "Explain what worker dispatch is and who directs the worker.",
        "Describe what a non-disclosure agreement does.",
        "Explain subcontracting and where accountability sits.",
        "Describe consumer protection relevant to e-commerce.",
        "Explain what product liability covers.",
    ],
    minutes=35,
    sections=[
        ("Employment and contracting", [
            compare_grid(
                "Two ways to engage someone",
                "The difference is direction and what is promised.",
                [("Employment contract",
                  "The worker works under the employer's direction, for agreed hours, "
                  "with employment protections. The employer carries the risk that work "
                  "takes longer."),
                 ("Contract for work",
                  "The contractor promises a RESULT and directs their own methods. They "
                  "carry the risk of overrun, and employment protections do not apply.")],
            ),
            desc(
                "The label on the document does not decide which it is; the substance "
                "does. An arrangement called a contract for work in which the client "
                "directs the worker daily may be treated as something else entirely."
            ),
        ]),
        ("Worker dispatch", [
            desc(
                "Under a dispatch arrangement a worker is employed by an agency but "
                "works at and is DIRECTED BY the client. This is the distinguishing "
                "feature, and it is what separates dispatch from subcontracting."
            ),
            table(
                ["Arrangement", "Employs the worker", "Directs the daily work"],
                [["Employment", "The company", "The company"],
                 ["Dispatch", "The agency", "The client"],
                 ["Subcontract", "The subcontractor", "The subcontractor"]],
                caption="A subcontract where the client directs the staff is disguised dispatch, which is a legal problem.",
            ),
        ]),
        ("Confidentiality", [
            desc(
                "A non-disclosure agreement defines what information is confidential, "
                "what the recipient may do with it, and how long the duty lasts."
            ),
            ul([
                "Define the information precisely; 'everything discussed' is hard to enforce.",
                "State the permitted purpose -- confidentiality without purpose limits is weak.",
                "Agree what happens to the material at the end.",
                "Remember it binds only the parties; it does not make public information secret again.",
            ]),
        ]),
        ("Subcontracting", [
            desc(
                "A prime contractor may subcontract part of a delivery. Doing so "
                "delegates the WORK, not the accountability: the client's contract is "
                "with the prime, who answers for the whole."
            ),
            desc(
                "Back-to-back terms pass the head contract's obligations down to the "
                "subcontractor. Without them the prime can owe the client more than the "
                "subcontractor owes the prime, and funds the difference itself."
            ),
            desc(
                "Laws protecting subcontractors against late payment and unfair terms "
                "also apply, and are examined."
            ),
        ]),
        ("Selling to consumers", [
            accordion([
                ("Misleading representation", "Claims about quality, price or terms that mislead are prohibited, whether or not they are literally true."),
                ("Cooling-off", "Many distance and door-to-door sales allow cancellation within a stated period."),
                ("Clear terms", "Price, delivery, cancellation and contact details must be presented before purchase, not buried afterwards."),
                ("Specified commercial transactions", "Rules covering mail order, online sales and telemarketing, aimed at the distance between buyer and seller."),
            ]),
        ]),
        ("Product liability", [
            desc(
                "Product liability holds a maker responsible for harm caused by a "
                "defective product, without the injured party having to prove "
                "negligence."
            ),
            desc(
                "Whether software counts as a product varies by jurisdiction and is "
                "increasingly answered yes, particularly for embedded software in "
                "physical goods. For a system that controls machinery or a vehicle, the "
                "question is not academic."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Who directs a dispatched worker?", "The client",
                 "The agency employs them; the client directs the daily work."),
                ("Subcontracting delegates what?", "The work, not the accountability",
                 "The client's contract remains with the prime contractor."),
                ("What promises a result rather than hours?", "A contract for work",
                 "The contractor directs their own methods and carries overrun risk."),
                ("Does an NDA re-secure public information?", "No",
                 "It binds the parties; it cannot make public information secret."),
            ]),
        ]),
    ],
    key_terms=[
        ("Employment contract", "Work under the employer's direction, with employment protections."),
        ("Contract for work", "A promise to deliver a result, with methods directed by the contractor."),
        ("Worker dispatch", "Employment by an agency with daily direction by the client."),
        ("NDA", "An agreement defining confidential information and its permitted use."),
        ("Back-to-back terms", "Passing head-contract obligations down to a subcontractor."),
        ("Product liability", "Responsibility for harm caused by a defective product."),
    ],
    summary=(
        "Employment means working under direction with protections, while a contract "
        "for work promises a result and leaves methods and overrun risk with the "
        "contractor. Worker dispatch is distinguished by the client directing daily "
        "work, and a subcontract in which the client directs staff is disguised "
        "dispatch. Subcontracting delegates work but never accountability, which is why "
        "back-to-back terms matter. Consumer protection governs representations and "
        "cancellation in distance selling, and product liability attaches without proof "
        "of negligence."
    ),
    exam_notes=[
        desc(
            "The dispatch-versus-subcontract question turns entirely on who directs the "
            "daily work. The substance of the arrangement decides, not its title."
        ),
        ul([
            "Dispatch: agency employs, client directs.",
            "Subcontracting never transfers accountability to the client.",
            "A contract for work promises a result, not hours.",
        ]),
    ],
)


LESSONS[714] = lesson_structure(
    name="Other laws, guidelines, and engineer ethics",
    intro=(
        "Beyond specific statutes, IT work is governed by standards, internal rules and "
        "professional ethics. This lesson covers compliance as a practice, the "
        "guidelines organisations adopt, and the ethical obligations that apply when "
        "doing what is asked conflicts with what is right."
    ),
    objectives=[
        "Explain what compliance means in practice.",
        "Describe the role of internal rules and guidelines.",
        "Explain what corporate governance and internal control provide.",
        "Describe the purpose of a whistle-blowing system.",
        "Apply professional ethics to a conflict.",
        "Describe obligations around accessibility and environmental responsibility.",
    ],
    minutes=35,
    sections=[
        ("What compliance means", [
            desc(
                "Compliance is adhering to the laws, regulations, standards and internal "
                "rules that apply to the business. It is broader than obeying statutes: "
                "an organisation's own policies bind it too."
            ),
            desc(
                "Selecting only the obligations that carry criminal penalties is exactly "
                "the failure mode compliance programmes exist to prevent, because "
                "reputational and contractual consequences are frequently the larger "
                "ones."
            ),
        ]),
        ("Internal rules", [
            ul([
                "Code of conduct -- the behaviour expected of everybody.",
                "Information security policy -- how information must be handled.",
                "Acceptable use policy -- what company systems and resources may be used for.",
                "Procedures -- the steps for carrying particular work out.",
            ]),
            desc(
                "Rules are effective only when communicated and enforced consistently. "
                "An unenforced policy is worse than none: it documents a standard the "
                "organisation is demonstrably failing to meet."
            ),
        ]),
        ("Governance and internal control", [
            compare_grid(
                "Two related but distinct ideas",
                "Confusing them is why oversight sometimes disappears.",
                [("Corporate governance",
                  "How a company is directed and controlled, and how it answers to "
                  "stakeholders. Sets direction and allocates decision rights."),
                 ("Internal control",
                  "The processes giving reasonable assurance that operations are "
                  "effective, reporting reliable and laws followed. Operates within "
                  "governance.")],
            ),
            desc(
                "Segregation of duties is the most examined internal control: no "
                "individual should be able to initiate AND approve the same sensitive "
                "transaction, so that wrongdoing requires collusion."
            ),
        ]),
        ("Whistle-blowing", [
            desc(
                "An internal reporting system lets employees raise misconduct so that it "
                "can be corrected before it becomes a public failure."
            ),
            ol([
                "Provide a route that does not run through the person being reported.",
                "Protect the reporter from retaliation, and be seen to.",
                "Investigate properly and record the outcome.",
                "Act on what is found, or the system will not be used again.",
            ]),
        ]),
        ("Professional ethics", [
            desc(
                "Professional codes place public safety and welfare above an employer's "
                "preferences and above personal interest. They apply most when they are "
                "inconvenient."
            ),
            accordion([
                ("Public safety first", "Where a defect threatens safety, it must be escalated through proper channels even when management would prefer silence."),
                ("Competence", "Undertake only work you are competent to do, and say so when you are not."),
                ("Honesty", "Do not misrepresent capability, progress or risk -- including by optimistic reporting."),
                ("Conflict of interest", "Disclose it. The problem is never the interest itself but the undisclosed one."),
                ("Confidentiality", "Respect information obtained through the work, including after leaving."),
            ]),
            desc(
                "Escalating responsibly is the obligation -- not staying silent, and not "
                "acting unilaterally in ways that cause harm of their own."
            ),
        ]),
        ("Wider responsibilities", [
            ul([
                "Accessibility -- systems serving the public must be usable by people with disabilities.",
                "Environmental -- electronic equipment is regulated waste and must be recycled appropriately.",
                "Green IT -- reducing energy use through efficiency, virtualisation and sensible replacement cycles.",
                "Data ethics -- lawful is not always defensible; ask whether a use would survive being described publicly.",
            ]),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Serious safety defect, management says nothing -- do what?", "Escalate through proper channels",
                 "Public safety outranks employer preference; escalate responsibly."),
                ("What does segregation of duties prevent?", "One person completing a sensitive process alone",
                 "Wrongdoing then requires collusion."),
                ("Is an unenforced policy harmless?", "No",
                 "It documents a standard the organisation is failing to meet."),
                ("Conflict of interest -- what is required?", "Disclosure",
                 "The undisclosed interest is the problem, not the interest itself."),
            ]),
        ]),
    ],
    key_terms=[
        ("Compliance", "Adhering to applicable laws, regulations, standards and internal rules."),
        ("Code of conduct", "The behaviour an organisation expects of its people."),
        ("Corporate governance", "How a company is directed, controlled and held accountable."),
        ("Internal control", "Processes giving assurance over operations, reporting and compliance."),
        ("Segregation of duties", "Splitting a sensitive process so no one person completes it alone."),
        ("Whistle-blowing", "A protected internal route for reporting misconduct."),
    ],
    summary=(
        "Compliance covers statutes, standards and an organisation's own rules, and "
        "selecting only the parts with criminal penalties is the failure it exists to "
        "prevent. Governance sets direction and internal control provides assurance "
        "within it, with segregation of duties the most examined example. Whistle-"
        "blowing surfaces misconduct early and depends on protection from retaliation. "
        "Professional ethics place public safety above employer preference and require "
        "responsible escalation, competence, honesty and disclosure of conflicts."
    ),
    exam_notes=[
        desc(
            "Ethics questions present a conflict and reward the answer that escalates "
            "through proper channels. Neither silence nor unilateral disclosure to "
            "outsiders is the expected response."
        ),
        ul([
            "Public safety outranks employer preference.",
            "Segregation of duties makes collusion necessary for wrongdoing.",
            "Disclose a conflict of interest; the concealment is the offence.",
        ]),
    ],
)

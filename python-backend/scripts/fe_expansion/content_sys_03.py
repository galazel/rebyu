"""System Strategy -> System Planning, lessons 1 to 3.

Computerisation planning and investment appraisal, requirements definition
from the client side, and procurement planning.

The appraisal lesson carries the category's arithmetic -- payback, return on
investment and net present value -- and the point that only the last accounts
for WHEN money arrives, which is why the other two favour the wrong projects
in predictable ways.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "System Strategy"
MIDDLE = "System Planning"

# ==========================================================================
# Lesson 1: Computerisation planning and investment appraisal
# ==========================================================================

_plan_sections = [
    ("Deciding What to Build", [
        desc(
            "Before a project exists, somebody decides that it should -- and "
            "that decision is made on figures whose quality determines "
            "everything afterwards."
        ),
        table(
            ["Established", "Answers"],
            [["What business problem or opportunity exists",
              "Why anything should be done"],
             ["What options address it",
              "Whether this is the only way, or the best one"],
             ["What each would cost, over its life",
              "What is actually being committed"],
             ["What each would return, and when",
              "Whether it is worth committing"],
             ["What each risks", "What could make the return not "
                                 "materialise"]],
            caption="Five things established before a project is "
                    "authorised.",
            footer="The second row is the one that gets skipped. A proposal "
                   "arriving as a single option has removed the comparison "
                   "that makes an appraisal an appraisal, and 'do nothing' is "
                   "an option that must always be among those considered."),
        desc(
            "The DO NOTHING option is included precisely because it is "
            "sometimes right, and because it establishes the baseline the "
            "others are compared against. An option that beats doing nothing "
            "by very little is a large commitment for a small gain."
        ),
    ]),

    ("Costs Over a System's Life", [
        desc(
            "Appraisals fail most often through incomplete costs rather than "
            "through arithmetic."
        ),
        ul([
            "The build cost is the visible one and frequently the smaller "
            "part of the total.",
            "OPERATING costs -- hosting, licences, support, people -- "
            "continue every year the system exists.",
            "MAINTENANCE and change absorb most of the effort after "
            "delivery.",
            "TRANSITION costs -- migration, training, running two systems "
            "in parallel -- are real and routinely omitted.",
            "DISPOSAL costs, including data retention obligations, arrive at "
            "the end.",
        ]),
        desc(
            "TOTAL COST OF OWNERSHIP is the term for the whole of that, and "
            "comparing options on build cost alone reliably chooses the one "
            "that is cheapest to build and dearest to own -- which is why the "
            "appraisal covers the system's life rather than the project."
        ),
    ]),

    ("Benefits", [
        desc(
            "Benefits are what justify the cost, and they divide by whether "
            "anybody can put a figure on them."
        ),
        compare_grid(
            "TANGIBLE AGAINST INTANGIBLE BENEFITS",
            "Both are real; only one arrives with a number.",
            [("Tangible",
              ["Cost reduced, revenue increased, time saved",
               "Expressible in money",
               "Comparable directly with the cost",
               "What appraisal arithmetic uses"]),
             ("Intangible",
              ["Better decisions, improved reputation, reduced risk",
               "Real, and resistant to a figure",
               "Frequently the actual reason for the investment",
               "Excluded from the arithmetic and stated alongside it"])]),
        desc(
            "The temptation is to invent figures for intangible benefits so "
            "they enter the calculation. That produces an appraisal whose "
            "conclusion rests on a number somebody chose, and it is worse "
            "than stating the benefit honestly as a judgement the decision "
            "must weigh separately."
        ),
    ]),

    ("Comparing Investments", [
        desc(
            "Three techniques compare a cost against a return, and they "
            "differ in what they account for."
        ),
        image(fig("investment-appraisal")),
        table(
            ["Technique", "Computes", "Ignores"],
            [["Payback period",
              "How long until the return equals the cost",
              "Everything after that point"],
             ["Return on investment",
              "The gain as a proportion of the cost",
              "WHEN the returns arrive"],
             ["Net present value",
              "Future returns valued at today's money",
              "Nothing material -- it is the correct comparison"]],
            caption="Three techniques, in increasing order of correctness.",
            footer="PAYBACK systematically favours short projects, since a "
                   "project repaying in two years and then stopping beats one "
                   "repaying in three and continuing for ten. It is popular "
                   "because it is easy, and it answers a question about risk "
                   "rather than about value."),
        desc(
            "NET PRESENT VALUE accounts for the fact that money arriving in "
            "five years is worth less than money arriving now -- because the "
            "money available now could have been used for something else "
            "meanwhile. Discounting future amounts back to today's terms is "
            "what makes options with different timing genuinely comparable."
        ),
    ]),

    ("Working an Appraisal", [
        desc(
            "\"An option costs 100,000 and returns 30,000 a year for five "
            "years. What do the three techniques say?\""
        ),
        ol([
            "Payback: 100,000 divided by 30,000 is 3.33, so it repays part "
            "way through the fourth year.",
            "Total return over five years is 150,000, so the net gain is "
            "50,000.",
            "Return on investment is 50,000 divided by 100,000, which is 50 "
            "per cent over the period.",
            "Net present value discounts each year's 30,000 back to today's "
            "value and subtracts the 100,000 -- and because later returns "
            "count for less, it will be below 50,000.",
            "If the discounted total falls below 100,000, the net present "
            "value is negative and the option destroys value despite the "
            "positive return on investment.",
        ]),
        desc(
            "Step five is the reason the technique matters. A project with a "
            "healthy return on investment and a negative net present value is "
            "one whose returns arrive too late to be worth waiting for -- and "
            "only the discounting reveals that."
        ),
    ]),

    ("Feasibility", [
        desc(
            "Worth doing and possible are different questions, and the "
            "syllabus expects the dimensions of the second."
        ),
        table(
            ["Feasibility", "Asks"],
            [["Technical", "Can it be built with what exists and what we "
                           "have"],
             ["Economic", "Do the benefits exceed the costs"],
             ["Operational", "Will it be used, and can it be run"],
             ["Schedule", "Can it arrive in time to matter"],
             ["Legal", "Is it permitted, and what does compliance cost"]],
            caption="Five feasibility dimensions.",
            footer="OPERATIONAL feasibility sinks technically successful "
                   "projects. A system that works and nobody uses has "
                   "delivered nothing, and the reasons are predictable enough "
                   "to be assessed in advance rather than discovered."),
        desc(
            "SCHEDULE feasibility carries a specific consequence. A system "
            "arriving after the opportunity has closed produces no benefit "
            "however good it is, so a late delivery is not a delayed benefit "
            "-- it is frequently no benefit at all."
        ),
    ]),

    ("Risk in an Appraisal", [
        desc(
            "Costs and benefits are estimates, and an appraisal that presents "
            "them as certainties has concealed the thing a decision-maker "
            "most needs."
        ),
        ul([
            "Present ranges rather than single figures where the uncertainty "
            "is material.",
            "State the assumptions each figure rests on, since those are what "
            "will turn out to be wrong.",
            "Test the sensitivity: what would have to change for the "
            "conclusion to reverse.",
            "Identify which risks would prevent the benefits, since those "
            "matter more than risks to the build.",
            "Compare options on their risk as well as their return, since a "
            "smaller certain return may beat a larger uncertain one.",
        ]),
        desc(
            "SENSITIVITY analysis is the most useful of these. Establishing "
            "that a conclusion holds unless benefits fall by half, or fails "
            "if they fall by ten per cent, tells a decision-maker how much "
            "confidence the recommendation actually deserves."
        ),
    ]),

    ("Prioritising Between Proposals", [
        desc(
            "More proposals arrive than can be funded, so appraisal produces "
            "a ranking rather than a verdict on each."
        ),
        table(
            ["Consideration", "Why it enters the ranking"],
            [["Contribution to the strategy",
              "A high return on something the organisation is leaving is "
              "not attractive"],
             ["Value, by a consistent measure",
              "Options must be comparable to be ranked"],
             ["Risk", "Two equal returns are not equal if one is far less "
                      "certain"],
             ["Dependency", "Some proposals are worthless until another "
                            "completes"],
             ["Capacity to deliver",
              "An organisation can fund more change than it can absorb"]],
            caption="Five considerations in ranking proposals.",
            footer="The last row is the constraint organisations exceed most "
                   "often. Approving everything that shows a positive return "
                   "produces initiatives competing for the same people and "
                   "all arriving late."),
        desc(
            "A BALANCED portfolio also matters: entirely keeping things "
            "running means the organisation never improves, and entirely new "
            "initiatives means what exists degrades. The mix is a decision "
            "rather than an outcome."
        ),
    ]),

    ("Presenting an Appraisal", [
        desc(
            "An appraisal is read by people deciding rather than analysing, "
            "which shapes how it should be written."
        ),
        ol([
            "State the recommendation and the reasoning before the detail, "
            "since a reader deciding needs the conclusion first.",
            "Show the options compared on the same basis, so the comparison "
            "is visible rather than asserted.",
            "State the assumptions prominently rather than in an appendix, "
            "since they are what the decision actually rests on.",
            "Say what would change the recommendation, which is the "
            "sensitivity analysis made useful.",
            "Say what is being asked for -- a decision, funding, or "
            "permission to proceed to the next stage.",
        ]),
        desc(
            "The third point is the one that distinguishes an honest "
            "appraisal. Assumptions buried where nobody reads them let a "
            "recommendation appear more certain than it is, and the reader "
            "cannot weigh what they were not shown."
        ),
    ]),

    ("Funding and Approval", [
        desc(
            "An approved appraisal becomes a funded commitment, and how that "
            "is arranged affects how the project behaves."
        ),
        table(
            ["Arrangement", "Effect"],
            [["Full funding approved at the outset",
              "Certainty for the project, and commitment before much is "
              "known"],
             ["Stage funding, released at gates",
              "Each release is a decision, and stopping stays available"],
             ["Funding tied to demonstrated benefit",
              "Strong incentive to realise benefits, and hard to arrange"],
             ["Operational rather than capital funding",
              "Rented services fit; owned assets do not"]],
            caption="Four funding arrangements.",
            footer="STAGE FUNDING is what keeps the stop decision real. A "
                   "project funded entirely in advance has removed the "
                   "governing body's principal lever, and every later review "
                   "is advisory."),
        desc(
            "The last row has grown in importance. Renting services converts "
            "a capital purchase into an operating cost, which changes how it "
            "is approved, how it is budgeted, and sometimes whether the "
            "organisation can do it at all under its own financial rules."
        ),
    ]),

    ("Revisiting the Business Case", [
        desc(
            "A business case approved once describes a world that then "
            "changes, and it is reviewed rather than filed."
        ),
        ol([
            "Review it at each stage gate, since the costs are now better "
            "known and the benefits may not be.",
            "Check whether the problem it addressed still exists, since "
            "circumstances move.",
            "Check whether the benefits are still available, since a "
            "competitor or a regulation may have taken them.",
            "Compare the current estimate to complete against the remaining "
            "benefit, ignoring what has been spent.",
            "Recommend stopping where that comparison says so, which is what "
            "makes the review worth holding.",
        ]),
        desc(
            "Step four is the sunk cost discipline stated as a procedure. "
            "Money already spent cannot be recovered by continuing, so it "
            "belongs in no comparison -- and the only question is whether "
            "finishing is worth what finishing costs from here."
        ),
    ]),

    ("Who Decides", [
        desc(
            "An appraisal informs a decision, and who makes it depends on "
            "what is being committed."
        ),
        ul([
            "Small proposals are decided within a delegated authority, which "
            "is what keeps the process usable.",
            "Large ones go to a governing body with the authority to commit "
            "the organisation.",
            "Anything strategic goes higher still, since it changes what the "
            "organisation is doing rather than how.",
            "The thresholds are stated in advance, so nobody negotiates which "
            "route a proposal takes.",
            "The person deciding must be able to say no, or the appraisal was "
            "a formality.",
        ]),
        desc(
            "The last point recurs across the certification. A decision "
            "nobody could have made differently is not a decision, and an "
            "appraisal feeding one has documented a conclusion rather than "
            "informed a choice."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where planning items are lost."),
        ul([
            "Appraising a single option, which removes the comparison an "
            "appraisal consists of.",
            "Omitting the do-nothing baseline the others are measured "
            "against.",
            "Comparing on build cost rather than total cost of ownership.",
            "Inventing figures for intangible benefits so they enter the "
            "arithmetic.",
            "Using payback alone, which favours short projects "
            "systematically.",
            "Treating return on investment as accounting for timing. It does "
            "not.",
            "Assessing economic feasibility and not operational "
            "feasibility.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"Two options are compared. One repays in two years and stops "
            "returning after three. The other repays in four years and "
            "continues for ten. Payback selects the first. Evaluate that.\""
        ),
        ol([
            "Payback measures only how long until the cost is recovered, and "
            "the first option is faster.",
            "It ignores everything after that point entirely, which is where "
            "the second option's value is.",
            "The second returns for six more years after repaying, and none "
            "of that enters the payback calculation.",
            "So payback has answered a question about how soon the money is "
            "at risk rather than about how much value each produces.",
            "Net present value would account for the whole period with later "
            "returns discounted, and would very likely select the second.",
        ]),
        desc(
            "Payback is not wrong -- it answers a legitimate question about "
            "risk exposure. It is wrong as a measure of VALUE, and using it "
            "alone means an organisation systematically selects short "
            "projects over more valuable long ones."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Investment appraisal precedes everything a project does."),
        ul([
            "The business case is what the project charter's justification "
            "rests on.",
            "Operational feasibility is the adoption concern of the previous "
            "lesson.",
            "Total cost of ownership includes the maintenance dominance of "
            "Development Technology.",
            "Benefits realisation is confirmed by the post-implementation "
            "review.",
            "Governance holds management accountable for value delivery.",
            "Options analysis parallels the build-or-buy decision.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What payback ignores",
              "Everything after the repayment point",
              "Which systematically favours short projects over more valuable "
              "long ones."),
             ("What return on investment ignores",
              "When the returns arrive",
              "A gain in ten years counts the same as a gain next year."),
             ("What net present value accounts for",
              "The timing of returns, by discounting them",
              "Money arriving in five years is worth less than money arriving "
              "now."),
             ("What an appraisal must compare against",
              "The do-nothing option",
              "It is sometimes right and always the baseline."),
             ("What comparing on build cost selects",
              "Whatever is cheapest to build and dearest to own",
              "Which is why total cost of ownership covers the system's "
              "life."),
             ("Why intangible benefits stay out of the arithmetic",
              "An invented figure makes the conclusion rest on it",
              "Stating them honestly alongside is better than quantifying "
              "them badly.")]),
    ]),
]

_plan_quiz = [
    mcq("HARD",
        "One option repays in two years then stops returning; another repays "
        "in four and continues for ten. Payback selects the first.\n\n"
        "What is wrong?",
        [("Payback ignores everything after the repayment point, which is "
          "where the second's value is", True),
         ("Payback should have been calculated on discounted rather than "
          "nominal returns", False),
         ("The second option's returns are too uncertain to be "
          "compared", False),
         ("Payback periods cannot be compared between options of different "
          "durations", False)],
        "Payback measures how long until the cost is recovered and stops "
        "there, so six further years of returns count for nothing. It answers "
        "a legitimate question about how long money is at risk and is wrong "
        "as a measure of VALUE -- and an organisation using it alone "
        "systematically prefers short projects to more valuable long ones."),

    mcq("AVERAGE",
        "What does net present value account for that return on investment "
        "does not?",
        [("The timing of the returns", True),
         ("The total magnitude of the returns", False),
         ("The risk that the returns will not materialise", False),
         ("The operating costs incurred after implementation", False)],
        "Return on investment expresses gain as a proportion of cost and "
        "treats a gain arriving in ten years identically to one arriving next "
        "year. Net present value discounts future amounts back to today's "
        "terms, because money available now could have been used for "
        "something else meanwhile -- which is what makes options with "
        "different timing comparable."),

    mcq("HARD",
        "A project costs 100,000, returns 30,000 a year for five years, and "
        "has a negative net present value.\n\nWhat does that mean?",
        [("The returns arrive too late to be worth waiting for", True),
         ("The total returns are smaller than the total cost", False),
         ("The project will not repay its cost within its life", False),
         ("The operating costs were excluded from the calculation", False)],
        "The nominal total is 150,000 against a cost of 100,000, so it repays "
        "and shows a positive return on investment. A negative net present "
        "value means that once the later returns are discounted to today's "
        "terms the total falls below the cost -- the money arrives too far in "
        "the future to justify committing it now, which only discounting "
        "reveals."),

    mcq("AVERAGE",
        "Why must a do-nothing option be included in an appraisal?",
        [("It is sometimes right, and it is the baseline the others are "
          "measured against", True),
         ("Governance procedures require a minimum number of options to be "
          "considered", False),
         ("It establishes the earliest date by which action must be "
          "taken", False),
         ("It identifies the risks of the current situation", False),
         ],
        "Without a baseline there is nothing to compare against, so an option "
        "beating nothing by very little looks the same as one transforming "
        "the situation. Doing nothing is also occasionally the right answer, "
        "and an appraisal structured so that it cannot be chosen has decided "
        "something before it began."),

    mcq("HARD",
        "Why does comparing options on build cost alone mislead?",
        [("It selects whatever is cheapest to build and dearest to "
          "own", True),
         ("Build costs are estimated less accurately than operating "
          "costs", False),
         ("Build costs exclude the risk contingency each option "
          "requires", False),
         ("Build costs are incurred before the benefits are "
          "confirmed", False)],
        "Operating, maintenance, transition and disposal costs continue for "
        "the system's whole life and frequently exceed the build cost. "
        "Comparing only what is spent to create it therefore favours the "
        "option that is cheap once and expensive every year afterwards, which "
        "is why total cost of ownership covers the life rather than the "
        "project."),

    mcq("AVERAGE",
        "How should intangible benefits be handled in an appraisal?",
        [("Stated honestly alongside the arithmetic rather than assigned "
          "invented figures", True),
         ("Converted to monetary values using a standard "
          "factor", False),
         ("Excluded entirely, since they cannot be verified", False),
         ("Weighted according to the sponsor's assessment of their "
          "importance", False)],
        "Assigning a number to better decisions or improved reputation makes "
        "the appraisal's conclusion rest on a figure somebody chose, which is "
        "less honest than a judgement stated as one. Excluding them entirely "
        "is also wrong -- they are frequently the actual reason for the "
        "investment -- so they sit beside the calculation for the decision to "
        "weigh."),

    mcq("HARD",
        "Which feasibility dimension most often defeats technically "
        "successful projects?",
        [("Operational -- whether it will be used and can be run", True),
         ("Economic -- whether the benefits exceed the costs", False),
         ("Technical -- whether it can be built at all", False),
         ("Legal -- whether it is permitted", False)],
        "A system that works and nobody uses has delivered nothing, and the "
        "reasons -- poor fit with the work, harder than the previous method, "
        "no awareness, a surviving alternative -- are predictable enough to "
        "be assessed in advance. Technical and economic feasibility receive "
        "attention because they are easier to analyse."),

    mcq("AVERAGE",
        "What does a payback period actually measure?",
        [("How long the invested money remains at risk", True),
         ("How much value the investment produces overall", False),
         ("How quickly the system can be delivered", False),
         ("How the returns compare with alternative uses of the "
          "money", False)],
        "Payback tells you when the cost has been recovered, which is a "
        "statement about exposure rather than about value -- and understanding "
        "it that way explains both why it is popular and why it should not be "
        "the only measure. Comparing against alternative uses of the money is "
        "what discounting does in net present value."),

    mcq("HARD",
        "A system will arrive after the commercial opportunity it addresses "
        "has closed.\n\nWhat does this indicate?",
        [("Schedule infeasibility -- the benefit is not delayed but "
          "absent", True),
         ("An economic feasibility problem requiring the costs to be "
          "reduced", False),
         ("A project management problem requiring schedule "
          "compression", False),
         ("A technical feasibility problem with the delivery "
          "approach", False)],
        "Some benefits are time-bound: a system supporting a product launch, "
        "a regulatory deadline or a market window produces nothing once the "
        "moment passes. Treating late delivery as a deferred benefit "
        "misunderstands that, and schedule feasibility exists to establish "
        "whether the timing is achievable before anybody commits."),

    mcq("AVERAGE",
        "Which costs are most often omitted from an appraisal?",
        [("Transition costs -- migration, training and parallel "
          "running", True),
         ("The cost of the development effort itself", False),
         ("Hardware and licence acquisition costs", False),
         ("The cost of the project management overhead", False)],
        "Build costs are visible and estimated carefully. Migration, "
        "training and running two systems in parallel during changeover are "
        "real, substantial and routinely absent from the figures -- which is "
        "the same omission the scope category describes as decomposing "
        "product scope instead of project scope."),
]

LESSON_SYS_PLAN = lesson(
    MAJOR, MIDDLE,
    "Computerisation Planning and Investment Appraisal",
    _plan_quiz,
    lesson_structure(
        "Computerisation Planning and Investment Appraisal",
        "Before a project exists somebody decides that it should, on figures "
        "whose quality determines everything afterwards -- and the commonest "
        "failures are appraising a single option and comparing on build cost "
        "rather than TOTAL COST OF OWNERSHIP. This lesson covers the costs "
        "that continue for a system's life, the tangible and intangible "
        "benefit distinction and why inventing figures for the second is "
        "worse than stating them, and the three appraisal techniques -- with "
        "payback ignoring everything after repayment, return on investment "
        "ignoring WHEN money arrives, and net present value the only one "
        "accounting for timing.",
        [
            "State what must be established before a project is authorised",
            "Explain why a do-nothing option is always included",
            "Identify the costs comprising total cost of ownership",
            "Distinguish tangible from intangible benefits and handle each",
            "Compute and interpret payback, return on investment and net "
            "present value",
            "Explain what each technique ignores",
            "Assess the five feasibility dimensions",
            "Explain why schedule infeasibility removes a benefit rather than "
            "delaying it",
        ],
        80,
        _plan_sections,
        [
            ("Do-nothing option",
             "The baseline every other option is measured against, and "
             "occasionally the right answer."),
            ("Total cost of ownership",
             "Build, operate, maintain, transition and dispose -- the whole "
             "life rather than the project."),
            ("Transition costs",
             "Migration, training and parallel running. Real, substantial and "
             "routinely omitted."),
            ("Tangible benefits",
             "Expressible in money, and therefore usable in the arithmetic."),
            ("Intangible benefits",
             "Real and resistant to a figure. Stated alongside rather than "
             "quantified badly."),
            ("Payback period",
             "How long until the cost is recovered. Measures risk exposure, "
             "and ignores everything afterwards."),
            ("Return on investment",
             "Gain as a proportion of cost. Ignores when the returns "
             "arrive."),
            ("Net present value",
             "Future returns discounted to today's terms. The only technique "
             "accounting for timing."),
            ("Feasibility dimensions",
             "Technical, economic, operational, schedule and legal -- with "
             "operational the one that sinks working systems."),
        ],
        "A project is authorised on an appraisal, and the appraisal fails "
        "most often before any arithmetic: by considering a single option, by "
        "omitting the DO-NOTHING baseline the others are measured against, "
        "and by comparing build costs when operating, maintenance, transition "
        "and disposal costs continue for the system's life. Benefits divide "
        "into tangible ones that carry figures and intangible ones that do "
        "not -- and inventing a number for the second makes the conclusion "
        "rest on somebody's choice, which is worse than stating the judgement "
        "honestly beside the calculation. Three techniques then compare cost "
        "against return: PAYBACK says how long until the cost is recovered "
        "and ignores everything after, which favours short projects "
        "systematically; RETURN ON INVESTMENT gives gain as a proportion and "
        "ignores when the money arrives; and NET PRESENT VALUE discounts "
        "future returns to today's terms, which is what makes options with "
        "different timing genuinely comparable -- and why a project can show "
        "a healthy return on investment and a negative net present value. "
        "Finally feasibility is technical, economic, operational, schedule "
        "and legal, with OPERATIONAL the dimension that defeats technically "
        "successful projects and SCHEDULE the one where lateness removes a "
        "benefit rather than deferring it.",
        exam_notes=[
            desc(
                "This lesson supplies calculation items and one recurring "
                "judgement about which technique answers which question."
            ),
            ul([
                "Computing a payback period.",
                "Explaining what payback and ROI each ignore.",
                "Interpreting a negative net present value.",
                "Explaining why a do-nothing option is included.",
                "Identifying omitted costs.",
                "Handling intangible benefits.",
                "Identifying the feasibility dimension at issue.",
            ]),
            desc(
                "When two options are compared and a technique picks the "
                "shorter one, check what that technique ignores. Payback "
                "discards everything after repayment and ROI discards timing "
                "-- and both discards are exactly where the item's answer "
                "lives."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Requirements definition from the client side
# ==========================================================================

_creq_sections = [
    ("Stating What Is Needed", [
        desc(
            "An organisation buying a system must state what it needs clearly "
            "enough for suppliers to respond -- which is harder than "
            "specifying for an internal team, because nothing can be "
            "clarified informally later."
        ),
        table(
            ["Internal development", "Buying from a supplier"],
            [["Ambiguity is resolved in conversation",
              "Ambiguity is resolved by the supplier, in their favour"],
             ["Requirements evolve as understanding improves",
              "Changes after contract are change requests with a price"],
             ["The team shares the organisation's context",
              "The supplier knows only what was written"],
             ["Priorities can be adjusted continuously",
              "Priorities were fixed when the contract was signed"]],
            caption="Why a client-side specification carries more weight.",
            footer="The first row is the practical difference. A supplier "
                   "encountering an ambiguity does not stop to ask; they "
                   "interpret it in whichever way is cheapest, which is "
                   "entirely legitimate and entirely unhelpful."),
    ]),

    ("What the Client Specifies", [
        desc(
            "The client states the NEED, and the syllabus is clear that "
            "specifying the solution instead is a distinct error."
        ),
        ul([
            "State what the business must be able to do, and to what "
            "standard.",
            "State the constraints -- platforms, standards, deadlines, "
            "regulation -- that genuinely bind.",
            "State the quality requirements as figures, since they are what "
            "acceptance will test.",
            "State the interfaces to systems that will remain.",
            "Do NOT specify how, unless the how is genuinely a requirement.",
        ]),
        desc(
            "The last point is the discipline. A client specifying the "
            "solution has removed the supplier's expertise from the "
            "transaction and taken responsibility for the design -- so when "
            "the specified approach does not work, the client owns the "
            "consequence."
        ),
    ]),

    ("Distinguishing Needs From Wants", [
        desc(
            "Everything a stakeholder mentions arrives at the same volume, "
            "and prioritising is what makes a specification affordable."
        ),
        compare_grid(
            "A NEED AGAINST A WANT",
            "Both are stated the same way.",
            [("A need",
              ["The organisation cannot operate without it",
               "Or a regulation requires it",
               "Its absence blocks the business outcome",
               "Non-negotiable, and worth paying for"]),
             ("A want",
              ["It would be better with it",
               "Somebody prefers it, sometimes strongly",
               "Its absence is inconvenient rather than blocking",
               "Negotiable, and priced individually"])]),
        desc(
            "The practical test is asking what happens without it. A "
            "requirement whose absence produces a workaround somebody can "
            "live with is a want however firmly it was stated -- and "
            "distinguishing them before going to market is what stops the "
            "budget being consumed by preferences."
        ),
    ]),

    ("Making Requirements Testable", [
        desc(
            "Anything the client cannot test is something the client cannot "
            "insist on, which makes testability a commercial concern rather "
            "than a technical one."
        ),
        ol([
            "For each requirement, state what evidence would demonstrate it "
            "met.",
            "Convert every quality adjective into a figure -- how fast, how "
            "many, how available.",
            "State the conditions under which the figure applies, since "
            "performance at ten users is not performance at a thousand.",
            "Agree who will test it and when, since acceptance is where these "
            "figures are used.",
            "Discard requirements nobody can test, or rewrite them until "
            "somebody can.",
        ]),
        desc(
            "The last step is uncomfortable and correct. A requirement that "
            "cannot be tested cannot be enforced, so leaving it in the "
            "specification creates an expectation the contract does not "
            "support -- which is discovered at acceptance, when the "
            "disagreement is expensive."
        ),
    ]),

    ("Involving the Right People", [
        desc(
            "A specification written by the wrong people describes a system "
            "the organisation does not need."
        ),
        table(
            ["Contributor", "Supplies", "If omitted"],
            [["Business users", "What the work actually requires",
              "A system fitting the described process, not the real one"],
             ["Operations", "What running it requires",
              "Something nobody can monitor, back up or restart"],
             ["Compliance", "Obligations stated as constraints",
              "A system that cannot legally be used as intended"],
             ["Technical staff", "What will integrate with what exists",
              "Interfaces discovered during implementation"],
             ["Finance", "What can actually be committed",
              "A specification nobody can afford"]],
            caption="Five contributors and the consequence of omitting "
                    "each.",
            footer="OPERATIONS is the omission with the longest tail, exactly "
                   "as in the development category. A system meeting every "
                   "business requirement and unrunnable costs money every day "
                   "for years."),
    ]),

    ("Structuring the Specification", [
        desc(
            "A specification is read by suppliers pricing it and by everybody "
            "later comparing what arrived against what was asked, so its "
            "organisation matters."
        ),
        image(fig("as-is-to-be")),
        table(
            ["Section", "Contains"],
            [["Context and objectives",
              "Why the organisation is buying, which shapes every judgement "
              "a supplier makes"],
             ["Scope and exclusions",
              "What is included and, explicitly, what is not"],
             ["Functional requirements",
              "What the system must do, each separately identified"],
             ["Quality requirements",
              "Performance, availability, security and usability as figures"],
             ["Constraints and interfaces",
              "What binds, and what must be integrated with"],
             ["Evaluation criteria",
              "How responses will be judged, stated in advance"]],
            caption="Six sections of a client specification.",
            footer="Each requirement is separately IDENTIFIED so it can be "
                   "referenced -- by a supplier in their response, by the "
                   "evaluation, and by acceptance testing. Requirements "
                   "buried in prose cannot be traced through any of that."),
        desc(
            "The CONTEXT section earns more than its length. A supplier who "
            "understands why the organisation is buying makes better "
            "judgements on the hundred small questions the specification does "
            "not address -- and every specification leaves hundreds of them."
        ),
    ]),

    ("Prototypes and Demonstrations", [
        desc(
            "Written requirements are hard to evaluate, and seeing something "
            "concrete changes what stakeholders can tell you."
        ),
        compare_grid(
            "SPECIFYING IN WRITING AGAINST SHOWING SOMETHING",
            "Two ways of establishing what is wanted.",
            [("Written specification",
              ["Precise, contractual and referenceable",
               "Requires stakeholders to imagine the result",
               "Ambiguity is invisible until it matters",
               "What the contract is built on"]),
             ("Prototype or demonstration",
              ["People react to what they see",
               "Reveals misunderstandings immediately",
               "Not contractual by itself",
               "Feeds the written specification"])]),
        desc(
            "The two are complementary rather than alternatives. A "
            "demonstration establishes what people actually want and a "
            "written specification records it enforceably -- and a project "
            "using only the first has agreed something nobody can point to "
            "later."
        ),
    ]),

    ("Managing the Specification Over Time", [
        desc(
            "A specification is written before the market responds and lives "
            "through evaluation, contract and delivery."
        ),
        ul([
            "Version it, since suppliers must all be responding to the same "
            "document.",
            "Issue clarifications to every supplier, not only to the one who "
            "asked, or the process is not fair and may not be lawful.",
            "Record what changed between versions, since a supplier who "
            "priced an earlier one needs to know.",
            "Keep it after contract, since it is what acceptance is judged "
            "against.",
            "Trace each requirement forward into the contract, the tests and "
            "the delivered system.",
        ]),
        desc(
            "The second point is a fairness requirement with legal force in "
            "many procurement regimes. Answering one supplier's question "
            "privately gives them information the others priced without, "
            "which distorts the comparison the process exists to make."
        ),
    ]),

    ("Requirements That Constrain Rather Than Describe", [
        desc(
            "Some entries in a specification are not descriptions of wanted "
            "behaviour but limits on the solution, and mixing them causes "
            "confusion."
        ),
        table(
            ["Constraint", "Origin"],
            [["Must run on the existing platform",
              "The estate the organisation already has"],
             ["Must comply with a named standard",
              "Regulation, or an industry obligation"],
             ["Must integrate with a named system",
              "Something that is staying"],
             ["Must be delivered before a fixed date",
              "An external deadline nothing can move"],
             ["Must not exceed a stated budget",
              "What the organisation can commit"]],
            caption="Five constraints and where each comes from.",
            footer="Constraints bound the solution space before design "
                   "begins, so a genuine one must be stated. The error is "
                   "stating a PREFERENCE as a constraint, which rules out "
                   "options nobody decided to rule out."),
        desc(
            "Testing whether something is genuinely a constraint is worth "
            "doing explicitly: asking what would happen if it were not met "
            "distinguishes an external deadline from a date somebody hoped "
            "for, and a regulatory obligation from a habit."
        ),
    ]),

    ("From Specification to Acceptance", [
        desc(
            "The specification's real test comes at acceptance, which is why "
            "it is written with that moment in view."
        ),
        ol([
            "Each requirement is identified, so it can be traced to a test.",
            "Each has criteria stating what would demonstrate it met.",
            "The tests are agreed with the supplier before contract, rather "
            "than devised afterwards.",
            "The evidence each test needs is available -- data, environments, "
            "and people to perform it.",
            "The consequences of failing a test are defined, since discovering "
            "them during acceptance is too late.",
        ]),
        desc(
            "Agreeing the tests before contract is what prevents the "
            "characteristic dispute. Two parties who each devise their own "
            "tests from the same requirement will produce different ones, and "
            "the disagreement arrives when the delivery is complete and "
            "everybody is committed."
        ),
    ]),

    ("Common Requirement Defects", [
        desc(
            "Client specifications fail in recognisable ways, and knowing "
            "them makes a review productive."
        ),
        table(
            ["Defect", "Consequence"],
            [["Ambiguous wording",
              "The supplier's cheapest reading prevails"],
             ["An untestable quality statement",
              "Nothing to enforce at acceptance"],
             ["Two requirements that contradict",
              "Whichever is implemented, the other is breached"],
             ["A requirement stated twice, differently",
              "One is updated and the other is not"],
             ["A solution stated as a requirement",
              "Design responsibility transfers to the client"],
             ["A want stated as a need",
              "Budget consumed by preferences"]],
            caption="Six recurring defects in client specifications.",
            footer="Reading the table as a REVIEW CHECKLIST is how it is "
                   "used. Each defect is findable by somebody reading with it "
                   "in mind, and each is far cheaper to correct before the "
                   "specification goes to market."),
        desc(
            "The fourth row is the one that survives review most easily, "
            "since both statements look correct in isolation. Stating each "
            "requirement exactly once is what prevents the two from drifting "
            "apart."
        ),
    ]),

    ("Reviewing the Specification", [
        desc(
            "The specification is reviewed before it reaches the market, "
            "which is the last point at which correcting it is free."
        ),
        ol([
            "Have each contributor check the part they are answerable for, "
            "rather than everybody skimming the whole.",
            "Read it as a supplier would, looking for what could be "
            "interpreted cheaply.",
            "Check every quality statement carries a figure and its "
            "conditions.",
            "Check every requirement could be tested, and remove or rewrite "
            "the ones that cannot.",
            "Check the whole set for contradictions, which is the defect no "
            "individual reader finds.",
        ]),
        desc(
            "Step two is the reading that finds most defects and the one "
            "nobody performs naturally. Authors read what they meant; a "
            "supplier reads what will be cheapest to deliver, and "
            "deliberately adopting that view exposes the ambiguities before "
            "they are priced."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where client requirement items are lost."),
        ul([
            "Specifying the solution rather than the need, which transfers "
            "design responsibility to the client.",
            "Leaving ambiguity, which a supplier resolves in whichever way is "
            "cheapest.",
            "Treating every stated requirement as a need.",
            "Leaving quality requirements as adjectives, so acceptance has "
            "nothing to test against.",
            "Omitting the conditions under which a figure applies.",
            "Keeping requirements nobody can test.",
            "Writing the specification without operations or compliance.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A client's specification says the system shall have "
            "'acceptable response times'. The delivered system is slower than "
            "the client expected. What is the position?\""
        ),
        ol([
            "Establish what the requirement states: an adjective, with no "
            "figure and no conditions.",
            "The supplier delivered something whose response times they "
            "consider acceptable, which the requirement permits.",
            "The client cannot demonstrate a breach, because there is nothing "
            "to measure against.",
            "So the client has an expectation the contract does not support, "
            "and any remedy is a change request they will pay for.",
            "The requirement should have stated a figure and its conditions "
            "-- a response time, at a stated concurrent load, for a stated "
            "proportion of requests.",
        ]),
        desc(
            "The reasoning generalises to every client-side specification "
            "item. What cannot be tested cannot be enforced, and an "
            "untestable requirement is not a weak requirement but an absent "
            "one."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Client-side requirements connect the categories."),
        ul([
            "The techniques are the requirements elicitation of Development "
            "Technology, applied from the buying side.",
            "Testable quality figures become the acceptance criteria of that "
            "category.",
            "Omitting operations is the same stakeholder failure it "
            "describes.",
            "The specification becomes the statement of work in Project "
            "Procurement.",
            "Needs against wants is the MoSCoW prioritisation of that "
            "category.",
            "The specification feeds the supplier selection of the next "
            "lesson.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What a supplier does with an ambiguity",
              "Interprets it in whichever way is cheapest",
              "Legitimately, and without stopping to ask."),
             ("What the client should not specify",
              "The solution",
              "Doing so removes the supplier's expertise and transfers design "
              "responsibility."),
             ("The test for a need against a want",
              "What happens without it",
              "A workaround somebody can live with means it was a want."),
             ("Why testability is a commercial concern",
              "What cannot be tested cannot be enforced",
              "An untestable requirement is absent rather than weak."),
             ("What a quality figure needs beside it",
              "The conditions it applies under",
              "Performance at ten users is not performance at a thousand."),
             ("Which contributor is most often omitted",
              "Operations",
              "Producing something meeting every business requirement and "
              "unrunnable.")]),
    ]),
]

_creq_quiz = [
    mcq("HARD",
        "The phrase 'acceptable response times' appears in a client "
        "specification, and the delivered system is slower than expected.\n\n"
        "What is the client's position?",
        [("No enforceable claim, since there is nothing measurable to "
          "demonstrate a breach against", True),
         ("A valid claim, since the response times are evidently not "
          "acceptable", False),
         ("A claim depending on what a reasonable person would consider "
          "acceptable", False),
         ("A warranty claim, since performance is an implied "
          "requirement", False)],
        "The requirement contains an adjective and no figure, so the supplier "
        "delivered something they consider acceptable and the specification "
        "permits it. What cannot be tested cannot be enforced, and any remedy "
        "becomes a change request the client pays for. The requirement needed "
        "a response time, a concurrent load and a proportion of requests."),

    mcq("AVERAGE",
        "A client buying a system should specify one thing rather than "
        "another.\n\nWhich?",
        [("What the business must be able to do, and to what standard", True),
         ("How the supplier should design and build the "
          "solution", False),
         ("Which technologies the supplier should use", False),
         ("The internal structure the delivered system should have", False)],
        "Specifying the need lets the supplier apply the expertise being "
        "bought; specifying the solution removes it and transfers "
        "responsibility for the design to the client -- so when the specified "
        "approach fails, the client owns the consequence. The how is stated "
        "only where it is genuinely a constraint, such as an integration or a "
        "regulatory requirement."),

    mcq("HARD",
        "A supplier encountering an ambiguous specification does "
        "something predictable.\n\nWhat?",
        [("Interpret it in whichever way is cheapest, legitimately", True),
         ("Raise a clarification request before submitting a "
          "proposal", False),
         ("Price both interpretations and let the client "
          "choose", False),
         ("Decline to bid until the ambiguity is resolved", False),
         ],
        "A supplier pricing competitively cannot afford to assume the "
        "expensive reading, and nothing obliges them to. The interpretation "
        "is entirely legitimate and entirely unhelpful to the client, which "
        "is why ambiguity is removed before going to market rather than "
        "discussed afterwards -- when it becomes a change request."),

    mcq("AVERAGE",
        "What distinguishes a need from a want in a specification?",
        [("What happens without it -- blocked, or merely "
          "inconvenienced", True),
         ("Whether it was stated by a senior stakeholder", False),
         ("Whether it appears in the business case", False),
         ("Whether the supplier can provide it easily", False)],
        "Everything a stakeholder mentions arrives at the same volume, and "
        "the test is consequence: a requirement whose absence produces a "
        "workaround somebody can live with is a want however firmly it was "
        "expressed. Making the distinction before going to market is what "
        "stops the budget being consumed by preferences."),

    mcq("HARD",
        "Why is requirement testability a commercial concern rather than a "
        "technical one?",
        [("A requirement that cannot be tested cannot be "
          "enforced", True),
         ("Testing effort must be included in the contract "
          "price", False),
         ("Testable requirements are cheaper for suppliers to "
          "implement", False),
         ("Acceptance testing is performed by the client at their own "
          "cost", False)],
        "The specification is a contractual document, and a requirement with "
        "no measurable criterion gives the client nothing to demonstrate a "
        "breach with. It creates an expectation the contract does not "
        "support, which surfaces at acceptance when disagreement is most "
        "expensive -- so untestable requirements are rewritten or removed."),

    mcq("AVERAGE",
        "Conditions are omitted from a stated performance figure.\n\nWhy is that inadequate?",
        [("Performance at ten users is not performance at a "
          "thousand", True),
         ("Suppliers cannot price a requirement without the "
          "conditions", False),
         ("Test environments differ from production "
          "environments", False),
         ("The figure cannot be compared with competing "
          "proposals", False)],
        "A response time is meaningless without the load it applies at, and a "
        "supplier meeting it under light load has satisfied the requirement "
        "as written. The conditions -- concurrent users, data volume, "
        "proportion of requests -- are what make the figure a commitment "
        "rather than a demonstration."),

    mcq("HARD",
        "Which contributor's omission from a client specification produces "
        "costs lasting the system's whole life?",
        [("Operations, who state what running it requires", True),
         ("Finance, who state what can be committed", False),
         ("Technical staff, who know the existing estate", False),
         ("Compliance, who state the regulatory obligations", False)],
        "A system meeting every business requirement that nobody can monitor, "
        "back up or restart cleanly generates cost every day it runs -- and "
        "the omission is easy because operations are not part of specifying "
        "or delivering. It is the same stakeholder failure the development "
        "category identifies, arriving at the buying stage."),

    mcq("AVERAGE",
        "Why does a client-side specification carry more weight than an "
        "internal one?",
        [("Nothing can be clarified informally later; changes become priced "
          "change requests", True),
         ("Suppliers are less capable than internal development "
          "teams", False),
         ("Contracts require greater precision than internal "
          "agreements", False),
         ("Clients understand their requirements less well than "
          "suppliers", False)],
        "An internal team shares the organisation's context and resolves "
        "ambiguity in conversation as understanding improves. A supplier "
        "knows only what was written, and every clarification after contract "
        "is a commercial event -- which means precision that would be "
        "unnecessary internally becomes essential."),

    mcq("HARD",
        "A client specifies the technical approach the supplier must "
        "take.\n\nWhat has the client assumed?",
        [("Responsibility for the design, including when the approach does "
          "not work", True),
         ("The supplier's agreement to the approach specified", False),
         ("A lower price, since the design work is already "
          "done", False),
         ("Compatibility with the client's existing systems", False),
         ],
        "Specifying how removes the supplier's expertise from the "
        "transaction and makes the client the designer, so a failure of the "
        "specified approach is the client's problem rather than a supplier "
        "shortfall. Constraints that genuinely bind should be stated; a "
        "preferred design should not."),

    mcq("AVERAGE",
        "What should be done with a requirement nobody can devise a test "
        "for?",
        [("Rewrite it until somebody can, or remove it", True),
         ("Retain it as guidance for the supplier's design", False),
         ("Convert it into an evaluation criterion for supplier "
          "selection", False),
         ("Include it with a note that it will not be formally "
          "tested", False)],
        "An untestable requirement cannot be enforced, so retaining it "
        "creates an expectation the contract does not support and a "
        "disagreement at acceptance. Rewriting is usually possible -- most "
        "untestable requirements are testable ones stated as adjectives -- "
        "and where it is not, the requirement was not clear enough to be "
        "bought."),
]

LESSON_SYS_CREQ = lesson(
    MAJOR, MIDDLE,
    "Requirements Definition from the Client Side",
    _creq_quiz,
    lesson_structure(
        "Requirements Definition from the Client Side",
        "Specifying for a supplier is harder than specifying for an internal "
        "team, because nothing can be clarified informally afterwards -- a "
        "supplier encountering ambiguity interprets it in whichever way is "
        "cheapest, legitimately and unhelpfully. This lesson covers stating "
        "the NEED rather than the solution, distinguishing needs from wants "
        "by what happens without them, and making every requirement TESTABLE "
        "-- which is a commercial concern rather than a technical one, since "
        "what cannot be tested cannot be enforced and an untestable "
        "requirement is absent rather than weak.",
        [
            "Explain why client-side specification carries more weight",
            "State the need rather than the solution, and know the exception",
            "Distinguish needs from wants by consequence",
            "Make requirements testable and quantify quality figures",
            "State the conditions a quality figure applies under",
            "Identify the contributors a specification requires",
            "Explain what happens to untestable requirements at acceptance",
        ],
        75,
        _creq_sections,
        [
            ("Ambiguity in a specification",
             "Resolved by the supplier in whichever way is cheapest -- "
             "legitimately, since nothing obliges otherwise."),
            ("Specifying the need",
             "What the business must be able to do and to what standard, "
             "rather than how it should be built."),
            ("Needs against wants",
             "Tested by what happens without it: blocked, or merely "
             "inconvenienced."),
            ("Testability",
             "A commercial property, since what cannot be tested cannot be "
             "enforced."),
            ("Quality figures with conditions",
             "A response time means nothing without the load, volume and "
             "proportion it applies at."),
            ("Contributors",
             "Business users, operations, compliance, technical staff and "
             "finance -- with operations most often omitted."),
        ],
        "Specifying for a supplier differs from specifying internally, "
        "because ambiguity cannot be resolved in conversation and every later "
        "clarification is a priced change. A supplier meeting an ambiguity "
        "interprets it in whichever way is cheapest -- entirely legitimately "
        "-- so precision that would be unnecessary internally becomes "
        "essential. The client states the NEED and not the solution, since "
        "specifying how removes the expertise being bought and transfers "
        "design responsibility to the client. Everything a stakeholder "
        "mentions arrives at the same volume, so needs are separated from "
        "wants by what happens WITHOUT them: blocked, or merely inconvenient. "
        "And every requirement must be TESTABLE, which is commercial rather "
        "than technical -- a requirement with no measurable criterion gives "
        "the client nothing to demonstrate a breach with, so it creates an "
        "expectation the contract does not support and a dispute at "
        "acceptance. Quality figures need their CONDITIONS attached, since "
        "performance at ten users is not performance at a thousand. And the "
        "specification needs business users, operations, compliance, "
        "technical staff and finance -- with operations the omission whose "
        "cost lasts the system's whole life.",
        exam_notes=[
            desc(
                "Items describe a specification that failed to protect the "
                "client and ask what was wrong with it."
            ),
            ul([
                "Identifying an untestable requirement's consequence.",
                "Explaining what a supplier does with ambiguity.",
                "Distinguishing needs from wants.",
                "Explaining why specifying the solution harms the client.",
                "Identifying missing conditions on a quality figure.",
                "Identifying the omitted contributor.",
                "Deciding what to do with an untestable requirement.",
            ]),
            desc(
                "For any client-side item, ask what the client could actually "
                "prove. A requirement stated as an adjective proves nothing, "
                "and the supplier's interpretation stands -- which is the "
                "shape of nearly every item in this lesson."
            ),
        ],
    ))

LESSONS = [LESSON_SYS_PLAN, LESSON_SYS_CREQ]

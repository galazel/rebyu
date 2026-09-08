"""Business Strategy -> Business Strategy Management, lessons 3 and 4.

Business strategy goals and evaluation, and business management systems.

The systems lesson is organised around what each family is FOR, since the
examination gives a described need and asks which system addresses it -- and
the families are distinguished by whether they look inward, outward, or
backward at what already happened.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Business Strategy"
MIDDLE = "Business Strategy Management"

# ==========================================================================
# Lesson 3: Goals and evaluation
# ==========================================================================

_goal_sections = [
    ("From Intention to Objective", [
        desc(
            "A strategy states a direction, and objectives are what turn it "
            "into something anybody can act on or be judged against."
        ),
        table(
            ["Level", "States", "Timescale"],
            [["Mission", "Why the organisation exists", "Enduring"],
             ["Vision", "What it intends to become", "Years"],
             ["Strategic objectives",
              "What must be achieved to get there", "Years"],
             ["Operational objectives",
              "What each part must do this period", "Months"],
             ["Individual objectives",
              "What each person is accountable for", "Months"]],
            caption="Five levels, each derived from the one above.",
            footer="Each level must derive from the one above it, or the "
                   "organisation's daily activity serves objectives nobody "
                   "connected to the strategy -- which is how an organisation "
                   "works hard in a direction it did not choose."),
        desc(
            "A MISSION says why the organisation exists and for whom; a "
            "VISION says what it is trying to become. Both are dismissed as "
            "decorative and both do real work when they are specific enough "
            "to rule anything out."
        ),
    ]),

    ("What Makes an Objective Usable", [
        desc(
            "An objective that cannot be judged achieved is an aspiration, "
            "and the syllabus lists the properties that separate them."
        ),
        ul([
            "SPECIFIC: it says what will be different, not merely that "
            "something will improve.",
            "MEASURABLE: somebody can determine objectively whether it "
            "happened.",
            "ACHIEVABLE: it is possible with the resources available, or it "
            "demotivates rather than directs.",
            "RELEVANT: it contributes to the objective above it, which is "
            "what makes the hierarchy hold.",
            "TIME-BOUND: it states by when, since an objective with no date "
            "is never late.",
        ]),
        desc(
            "The last point is the one that quietly matters. An objective "
            "with no deadline is never overdue, so it is never escalated and "
            "never abandoned -- it simply persists, absorbing attention "
            "without ever being resolved."
        ),
    ]),

    ("Measuring Performance", [
        desc(
            "What an organisation measures determines what it manages, which "
            "makes the choice of measures a strategic decision."
        ),
        image(fig("financial-statements")),
        compare_grid(
            "FINANCIAL AGAINST BALANCED MEASUREMENT",
            "One perspective, or four.",
            [("Financial only",
              ["Revenue, profit, return on capital",
               "Unambiguous and comparable",
               "Reports periods that have already closed",
               "Improvable by decisions that damage the future"]),
             ("A balanced set",
              ["Financial, customer, internal process, learning and growth",
               "Includes leading as well as lagging indicators",
               "Makes trade-offs between now and later visible",
               "Harder to compile, and harder to game"])]),
        desc(
            "The fourth entry on the left is the problem the balanced "
            "approach addresses. Cutting training, maintenance and product "
            "development improves this year's financial measures and damages "
            "every later year -- and a purely financial scorecard rewards "
            "that."
        ),
    ]),

    ("Key Performance Indicators", [
        desc(
            "A measure becomes an indicator when it is chosen deliberately to "
            "show whether an objective is being met."
        ),
        ol([
            "Derive each indicator from an objective, so it measures "
            "something somebody decided mattered.",
            "Keep the number small, since a scorecard of forty indicators "
            "directs attention to none of them.",
            "Choose measures that cannot easily be improved without improving "
            "the thing itself.",
            "State the target, and where the current position sits relative "
            "to it.",
            "Review the indicators themselves, since a measure that stops "
            "reflecting the objective keeps being reported.",
        ]),
        desc(
            "Step three is the discipline that limits the damage. Any measure "
            "becomes a target and then stops measuring what it did, so "
            "choosing measures that are hard to improve dishonestly is what "
            "keeps them useful for longer."
        ),
        desc(
            "CRITICAL SUCCESS FACTORS are the related idea: the few things "
            "that must go right for an objective to be achieved. Indicators "
            "measure them, and identifying them first is what stops the "
            "indicator set from measuring whatever is convenient."
        ),
    ]),

    ("Evaluating a Strategy", [
        desc(
            "A strategy is assessed both before it is adopted and while it is "
            "being pursued, against different questions."
        ),
        table(
            ["Question", "Asks"],
            [["Is it SUITABLE",
              "Does it address the organisation's actual position"],
             ["Is it ACCEPTABLE",
              "Do the returns and risks suit the stakeholders"],
             ["Is it FEASIBLE",
              "Can the organisation actually do it, with what it has"],
             ["Is it still right",
              "Have the circumstances it assumed changed"]],
            caption="Four questions in evaluating a strategy.",
            footer="FEASIBILITY is where ambitious strategies fail. A "
                   "strategy requiring capabilities, funding or people the "
                   "organisation cannot obtain describes a destination "
                   "without a route, and stating it changes nothing about "
                   "whether it can be reached."),
        desc(
            "The last row makes evaluation continuous. A strategy assumed "
            "conditions when it was written, and a strategy defended after "
            "those conditions changed is being pursued for its own sake -- "
            "which is why review asks whether it is still right rather than "
            "only whether it is being followed."
        ),
    ]),

    ("When a Strategy Is Not Working", [
        desc(
            "Distinguishing a strategy that is wrong from one that is merely "
            "not yet working is a genuinely difficult judgement."
        ),
        ul([
            "Establish whether it was actually IMPLEMENTED, since most "
            "strategies fail in execution rather than in conception.",
            "Establish whether enough time has passed for results to be "
            "expected at all.",
            "Establish whether the assumptions still hold, since a sound "
            "strategy for changed circumstances is now unsound.",
            "Distinguish a leading indicator moving the wrong way from a "
            "lagging one, since the first is evidence and the second is "
            "history.",
            "Decide deliberately, since drifting between strategies achieves "
            "neither.",
        ]),
        desc(
            "The first point is the commonest finding. A strategy nobody "
            "translated into objectives, funded consistently or measured "
            "against was never tested -- so abandoning it concludes something "
            "the evidence does not support."
        ),
    ]),

    ("Setting Targets", [
        desc(
            "An objective needs a target, and where the target comes from "
            "determines whether it directs anything."
        ),
        table(
            ["Target derived from", "Effect"],
            [["Last period, plus an increment",
              "Easy to set, and unconnected to what is possible or needed"],
             ["What competitors achieve",
              "Grounded externally, and only as relevant as the "
              "comparison"],
             ["What the strategy requires",
              "Connected to the objective, and possibly unachievable"],
             ["What the process is capable of",
              "Achievable, and possibly insufficient"],
             ["Negotiation between manager and team",
              "Accepted, and biased towards what is comfortable"]],
            caption="Five sources of a target, and what each produces.",
            footer="A target set from last year plus a percentage is the "
                   "commonest and the least informative. It says nothing "
                   "about whether the figure is achievable or whether "
                   "achieving it would matter."),
        desc(
            "A target that is unachievable demotivates and one that is "
            "certain directs nothing, so the useful range is uncomfortable "
            "and possible -- which requires knowing what the process can "
            "actually do, and that is a measurement question rather than a "
            "negotiation."
        ),
    ]),

    ("Reviewing Performance", [
        desc(
            "Measurement produces figures, and reviews are where they become "
            "decisions -- or fail to."
        ),
        ol([
            "Compare against the target, and against the trend, since a "
            "single figure says less than a direction.",
            "Establish whether a variance is signal or normal variation, "
            "before responding to it.",
            "Ask what caused it, rather than who is responsible for it.",
            "Decide what will change, and who will do it.",
            "Check at the next review whether that happened, since a review "
            "producing decisions nobody tracks produces nothing.",
        ]),
        desc(
            "Step two prevents the commonest waste. Reacting to ordinary "
            "fluctuation produces interference that makes performance worse, "
            "which is the control chart argument of the quality lesson "
            "applied to management reporting."
        ),
    ]),

    ("Cascading Objectives", [
        desc(
            "Getting from a strategic objective to what an individual does "
            "next week is a translation performed at each level."
        ),
        ol([
            "Each level states how it will contribute to the objective "
            "above.",
            "Contributions are checked against one another, since two parts "
            "can each contribute and conflict.",
            "Everything the level does should map to one of its objectives, "
            "or it is activity nobody asked for.",
            "The translation is agreed rather than imposed, since somebody "
            "who did not agree cannot be held to it.",
            "It is revisited when the level above changes.",
        ]),
        desc(
            "Step two catches the failure cascading produces. A sales "
            "objective to grow volume and an operations objective to reduce "
            "inventory each serve the strategy and pull against each other -- "
            "and neither team can resolve it, because the conflict is above "
            "both of them."
        ),
    ]),

    ("Benchmarking", [
        desc(
            "Comparing performance against others turns an internal figure "
            "into a judgement about whether it is any good."
        ),
        table(
            ["Compared against", "Reveals"],
            [["The organisation's own past", "Whether it is improving"],
             ["Competitors", "Whether it is competitive"],
             ["Others in the same industry",
              "What the industry generally achieves"],
             ["The best performers anywhere",
              "What is actually possible, whoever does it"]],
            caption="Four comparisons of increasing ambition.",
            footer="The last row is where benchmarking finds most. A process "
                   "performed better by an organisation in an entirely "
                   "different industry is still evidence about what the "
                   "process could achieve here."),
        desc(
            "Its limit is that a comparison assumes the circumstances are "
            "comparable. A cost per transaction that is higher than another "
            "organisation's may reflect a different service, a different "
            "market or a deliberate choice, so the comparison prompts an "
            "investigation rather than concluding one."
        ),
    ]),

    ("Communicating Strategy and Objectives", [
        desc(
            "Objectives influence behaviour only where people know them, "
            "which makes communication part of setting them."
        ),
        ul([
            "State them in terms the audience can act on, rather than in the "
            "terms they were written in.",
            "Explain how each contributes to the one above it, since that is "
            "what makes it worth doing.",
            "Repeat them, since people join, leave and forget.",
            "Show progress against them, or people conclude nobody is "
            "watching.",
            "Say what has changed when they change, since silent revision "
            "teaches everybody the objectives are decorative.",
        ]),
        desc(
            "The fourth point is the one that decides whether objectives are "
            "believed. An objective set and never mentioned again is one "
            "everybody correctly infers nobody is monitoring -- and behaviour "
            "follows the inference rather than the objective."
        ),
    ]),

    ("Objectives and Behaviour", [
        desc(
            "Objectives change what people do, including in ways nobody "
            "intended, which is why they are chosen carefully."
        ),
        compare_grid(
            "WHAT AN OBJECTIVE INTENDS AND WHAT IT PRODUCES",
            "The same objective, two effects.",
            [("Intended",
              ["Effort directed at what matters",
               "Clarity about what success looks like",
               "A basis for judging performance fairly",
               "Coordination between people pursuing the same end"]),
             ("Also produced",
              ["Effort withdrawn from whatever is not measured",
               "Optimisation of the measure rather than the outcome",
               "Reluctance to help with anything outside one's own objective",
               "Targets negotiated down where they are set by agreement"])]),
        desc(
            "The right-hand column is not a reason to avoid objectives; it is "
            "a reason to choose them knowing they will produce both. The most "
            "reliable protection is objectives few enough to be understood "
            "and measures hard to improve without improving the outcome."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where goal and evaluation items are lost."),
        ul([
            "Setting objectives that do not derive from the level above, so "
            "daily work serves nothing strategic.",
            "Omitting the deadline, which means the objective is never "
            "overdue and never resolved.",
            "Measuring financially only, which rewards damaging the future "
            "for this period.",
            "Reporting so many indicators that attention goes to none.",
            "Choosing measures that can be improved without improving "
            "anything.",
            "Judging a strategy that was never actually implemented.",
            "Defending a strategy after the conditions it assumed have "
            "changed.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An organisation's financial results improved for two years and "
            "then declined sharply. Investigation finds training, maintenance "
            "and product development were reduced throughout. What went "
            "wrong?\""
        ),
        ol([
            "Note what improved: financial measures, which report periods "
            "that have closed.",
            "Note what produced the improvement: reductions in spending whose "
            "benefit is future rather than current.",
            "Those reductions improve this year's figures and remove "
            "capability that later years depended on.",
            "A purely financial scorecard rewarded exactly that, since "
            "nothing it measured captured what was being given up.",
            "A BALANCED set including customer, internal process and learning "
            "measures would have shown capability declining while the "
            "financial figures improved.",
        ]),
        desc(
            "The item works because nobody behaved dishonestly. The measures "
            "were accurate, the decisions improved them, and the "
            "organisation's measurement system was rewarding the destruction "
            "of its own future -- which is what balanced measurement exists "
            "to prevent."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Goals and measurement run through the certification."),
        ul([
            "Objectives derive from the strategy of the previous lesson.",
            "Measures determining behaviour recurs in Service Management and "
            "in quality.",
            "Benefits realisation is the System Strategy question of whether "
            "objectives were met.",
            "Governance holds management accountable against these "
            "measures.",
            "Critical success factors inform which risks matter most.",
            "Balanced measurement parallels the technical and business "
            "evaluation distinction.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What each objective level must do",
              "Derive from the one above it",
              "Otherwise daily work serves objectives nobody connected to the "
              "strategy."),
             ("What an objective with no date is",
              "Never overdue, and therefore never resolved",
              "It persists, absorbing attention without ever being "
              "escalated."),
             ("What purely financial measurement rewards",
              "Improving this period at the expense of later ones",
              "Cutting training, maintenance and development does exactly "
              "that."),
             ("What makes an indicator durable",
              "Being hard to improve without improving the thing itself",
              "Any measure becomes a target and then stops measuring what it "
              "did."),
             ("The three evaluation questions",
              "Suitable, acceptable, feasible",
              "Feasibility is where ambitious strategies fail, since a "
              "destination is not a route."),
             ("Where most strategies actually fail",
              "In execution rather than conception",
              "A strategy never translated, funded or measured was never "
              "tested.")]),
    ]),
]

_goal_quiz = [
    mcq("HARD",
        "Financial results improve for two years then fall sharply, after "
        "training, maintenance and development were reduced throughout.\n\n"
        "What failed?",
        [("Measurement was purely financial, so it rewarded damaging the "
          "future", True),
         ("The reductions in spending were larger than the organisation "
          "could absorb", False),
         ("The strategy was not communicated to those making the "
          "reductions", False),
         ("The financial results were misreported during the two "
          "years", False)],
        "The measures were accurate and the decisions genuinely improved "
        "them -- by removing spending whose benefit was future rather than "
        "current. A balanced set including customer, internal process and "
        "learning measures would have shown capability declining while the "
        "financial figures rose, which is exactly the trade a financial-only "
        "scorecard conceals."),

    mcq("AVERAGE",
        "An objective stated with no deadline has a specific "
        "consequence.\n\nWhich?",
        [("It is never overdue, so it is never escalated or "
          "abandoned", True),
         ("It cannot be assigned to an individual as their own "
          "responsibility", False),
         ("Progress against it cannot be measured", False),
         ("It will be given lower priority than dated "
          "objectives", False)],
        "Without a date nothing ever indicates the objective is late, so it "
        "is never reviewed as a problem and never deliberately dropped -- it "
        "simply persists, absorbing attention indefinitely. Being time-bound "
        "is what makes an objective capable of being either achieved or "
        "recognised as failed."),

    mcq("HARD",
        "What makes a performance indicator durable as a measure?",
        [("It cannot easily be improved without improving the thing it "
          "measures", True),
         ("It was derived from a stated objective rather than chosen "
          "freely by somebody", False),
         ("It can be measured automatically without manual "
          "effort", False),
         ("It is reported at the same interval as the financial "
          "results", False)],
        "Any measure becomes a target and then stops measuring what it "
        "originally did, since people optimise what they are judged on. "
        "Choosing measures whose only route to improvement runs through the "
        "underlying outcome limits that -- which is why some measures survive "
        "as indicators and others degrade into activities."),

    mcq("AVERAGE",
        "Why must each level of objective derive from the level above?",
        [("Otherwise daily work serves objectives nobody connected to the "
          "strategy", True),
         ("Otherwise the objectives at each level cannot be measured "
          "consistently against each other", False),
         ("Otherwise accountability cannot be assigned to "
          "individuals", False),
         ("Otherwise the objectives will conflict with one "
          "another", False)],
        "The hierarchy exists so that what each person does contributes to "
        "what the organisation is trying to achieve. Broken at any level, the "
        "organisation works hard on objectives that were never traced to the "
        "strategy -- which is how effort and direction come apart without "
        "anybody noticing."),

    mcq("HARD",
        "A strategy has produced no results after two years.\n\n"
        "What must be established before abandoning it?",
        [("Whether it was actually implemented", True),
         ("Whether competitors adopted a similar approach", False),
         ("Whether the original analysis was performed "
          "correctly", False),
         ("Whether the measures chosen reflect the strategy", False)],
        "Most strategies fail in execution rather than conception, so a "
        "strategy nobody translated into objectives, funded consistently or "
        "measured against was never actually tested. Abandoning it concludes "
        "something the evidence does not support -- and the replacement will "
        "very likely meet the same fate for the same reason."),

    mcq("AVERAGE",
        "What does the feasibility question ask about a strategy?",
        [("Whether the organisation can actually do it with what it has or "
          "can obtain", True),
         ("Whether it adequately addresses the organisation's current "
          "competitive position", False),
         ("Whether the returns justify the risks to "
          "stakeholders", False),
         ("Whether it remains appropriate as circumstances "
          "change", False)],
        "Feasibility is about capability, funding and people -- whether the "
        "route exists rather than whether the destination is desirable. "
        "Suitability asks whether it addresses the position and acceptability "
        "whether stakeholders will bear the risk and return, and ambitious "
        "strategies fail on feasibility more than on either."),

    mcq("HARD",
        "Why does a scorecard of forty indicators direct attention to "
        "none?",
        [("Attention is finite, so measuring everything prioritises "
          "nothing", True),
         ("The indicators will contradict one another", False),
         ("Compiling them consumes the effort improvement would have "
          "required", False),
         ("Some of them will not be derived from objectives", False)],
        "A small set says what matters most; a large set says everything "
        "matters, which is the same as saying nothing does. People then "
        "attend to whichever indicators are easiest to move or most visible "
        "to their manager, and the prioritisation happens by accident rather "
        "than by the decision the scorecard was meant to express."),

    mcq("AVERAGE",
        "Critical success factors are one particular thing.\n\n"
        "What?",
        [("The few things that must go right for an objective to be "
          "achieved", True),
         ("The measures used to track progress against each stated "
          "objective", False),
         ("The risks most likely to prevent an objective being "
          "met", False),
         ("The resources an objective requires to be achievable", False)],
        "Identifying what must go right comes before deciding what to "
        "measure, since indicators should track those factors rather than "
        "whatever is convenient to collect. Without them, an indicator set "
        "tends to measure what is easy, which is reliably not the same as "
        "what determines success."),

    mcq("HARD",
        "A strategy assumed market conditions that have since changed, and "
        "is being defended.\n\nWhat is happening?",
        [("It is being pursued for its own sake rather than for its "
          "purpose", True),
         ("The organisation is deliberately maintaining consistency of "
          "strategic direction", False),
         ("Implementation is being given time to produce "
          "results", False),
         ("Stakeholder commitments are being honoured", False)],
        "A strategy is a means to an end under stated conditions, and when "
        "those conditions change the means may no longer serve the end. "
        "Continuing because it was decided is defending the decision rather "
        "than pursuing the objective -- which is why evaluation asks whether "
        "the strategy is still right and not only whether it is being "
        "followed."),

    mcq("AVERAGE",
        "What distinguishes a mission from a vision?",
        [("Why the organisation exists, against what it intends to "
          "become", True),
         ("A statement intended for staff, against one intended for "
          "customers", False),
         ("A long-term goal, against an annual objective", False),
         ("A financial ambition, against a market ambition", False)],
        "The mission describes the organisation's purpose and who it serves, "
        "and endures; the vision describes a future state it is working "
        "towards, and changes as that state is approached or reconsidered. "
        "Both are frequently dismissed as decorative and both do work when "
        "specific enough to rule something out."),
]

LESSON_BIZ_GOAL = lesson(
    MAJOR, MIDDLE,
    "Business Strategy Goals and Evaluation",
    _goal_quiz,
    lesson_structure(
        "Business Strategy Goals and Evaluation",
        "A strategy states a direction and objectives turn it into something "
        "anybody can act on -- provided each level DERIVES from the one "
        "above, or daily work serves objectives nobody connected to the "
        "strategy. This lesson covers what makes an objective usable, with "
        "the deadline as the property whose absence means it is never overdue "
        "and never resolved; measurement as a strategic decision, since a "
        "purely financial scorecard rewards improving this period at the "
        "expense of later ones; indicators chosen to be hard to improve "
        "dishonestly; and evaluating a strategy for suitability, "
        "acceptability and feasibility -- and for whether it is still right.",
        [
            "Describe the hierarchy from mission to individual objectives",
            "Explain why each level must derive from the one above",
            "State what makes an objective usable",
            "Explain the consequence of an objective with no deadline",
            "Contrast financial with balanced measurement",
            "Choose durable performance indicators",
            "Evaluate a strategy for suitability, acceptability and "
            "feasibility",
            "Distinguish a wrong strategy from an unimplemented one",
        ],
        75,
        _goal_sections,
        [
            ("Mission and vision",
             "Why the organisation exists, and what it intends to become."),
            ("Objective hierarchy",
             "Strategic, operational and individual objectives, each derived "
             "from the level above."),
            ("Time-bound",
             "An objective with no date is never overdue, so it is never "
             "escalated or abandoned."),
            ("Balanced measurement",
             "Financial, customer, internal process and learning -- making "
             "trade-offs between now and later visible."),
            ("Durable indicator",
             "One that cannot easily be improved without improving what it "
             "measures."),
            ("Critical success factors",
             "The few things that must go right, identified before deciding "
             "what to measure."),
            ("Suitability, acceptability, feasibility",
             "Does it address the position, do stakeholders accept it, can "
             "the organisation actually do it."),
        ],
        "Objectives turn a strategy into something people can act on, "
        "arranged from mission and vision down to individual objectives with "
        "each level DERIVING from the one above -- broken anywhere, the "
        "organisation works hard on objectives nobody traced to the strategy. "
        "A usable objective is specific, measurable, achievable, relevant and "
        "TIME-BOUND, and the deadline matters most quietly: without one an "
        "objective is never overdue, so it is never escalated and never "
        "abandoned. What is measured determines what is managed, which makes "
        "a purely financial scorecard dangerous -- it rewards cutting "
        "training, maintenance and development, since those improve this "
        "period and damage every later one, and only a BALANCED set makes "
        "that trade visible. Indicators are derived from critical success "
        "factors, kept few enough to direct attention, and chosen to be hard "
        "to improve without improving the underlying thing, since any measure "
        "becomes a target and then stops measuring what it did. And a "
        "strategy is evaluated for SUITABILITY, ACCEPTABILITY and "
        "FEASIBILITY -- with feasibility where ambitious ones fail -- and "
        "reviewed for whether it is still right, since most strategies that "
        "fail were never actually implemented.",
        exam_notes=[
            desc(
                "Items describe a measurement or objective-setting failure "
                "and ask what produced it."
            ),
            ul([
                "Diagnosing financial-only measurement behind a later "
                "decline.",
                "Explaining the effect of an undated objective.",
                "Explaining what makes an indicator durable.",
                "Explaining why objectives must derive downward.",
                "Distinguishing suitability, acceptability and feasibility.",
                "Establishing whether a strategy was implemented.",
                "Distinguishing mission from vision.",
            ]),
            desc(
                "When measures improved and the outcome worsened, look for "
                "what the measures did not capture. Nobody in these items "
                "behaved dishonestly -- the measurement system rewarded "
                "exactly what happened, which is the failure being tested."
            ),
        ],
    ))

# ==========================================================================
# Lesson 4: Business management systems
# ==========================================================================

_sys_sections = [
    ("Systems That Run a Business", [
        desc(
            "Several families of enterprise system recur, and each is "
            "distinguished by what it is FOR rather than by its technology."
        ),
        image(fig("business-systems")),
        table(
            ["Family", "Concerns", "Looks"],
            [["ERP", "The organisation's own operations and records",
              "Inward"],
             ["SCM", "Suppliers, inventory and distribution", "Upstream"],
             ["CRM", "Customers and every interaction with them",
              "Downstream"],
             ["BI", "What the data collected by the others means",
              "Backward, and then forward"]],
            caption="Four families and the direction each faces.",
            footer="The third column is the quickest way to identify which "
                   "system an item is describing. A described need concerning "
                   "suppliers is SCM, one concerning customers is CRM, and "
                   "one concerning understanding what happened is BI."),
    ]),

    ("Enterprise Resource Planning", [
        desc(
            "ERP integrates an organisation's core functions around one set "
            "of records, and its defining property is that integration."
        ),
        ul([
            "Finance, manufacturing, procurement, human resources and more, "
            "sharing data rather than exchanging it.",
            "ONE version of each fact -- one customer record, one product "
            "definition, one stock figure.",
            "A transaction entered once is visible everywhere it is "
            "relevant, without reconciliation.",
            "Implementation normally means changing PROCESSES to fit the "
            "product rather than the reverse.",
            "Customisation is expensive at purchase and expensive at every "
            "upgrade thereafter.",
        ]),
        desc(
            "The fourth point is where ERP implementations succeed or fail. "
            "The product embodies a way of working, and an organisation "
            "insisting on its existing processes pays to rebuild them in "
            "software -- and pays again every time the product is updated."
        ),
        desc(
            "The integration is also the difficulty. One version of each fact "
            "requires the whole organisation to agree how things are "
            "recorded, which is an organisational negotiation rather than a "
            "technical exercise -- and it is where the effort actually goes."
        ),
    ]),

    ("Supply Chain Management", [
        desc(
            "SCM coordinates the flow of materials, information and money "
            "from suppliers through to the customer."
        ),
        table(
            ["Concern", "Addressed by"],
            [["Knowing what will be needed", "Demand forecasting"],
             ["Having it without holding too much",
              "Inventory management and replenishment"],
             ["Suppliers knowing what is coming",
              "Sharing forecasts and schedules with them"],
             ["Getting it where it is needed",
              "Distribution and logistics planning"],
             ["Knowing where things are", "Tracking across the chain"]],
            caption="Five supply chain concerns.",
            footer="SHARING information upstream is what distinguishes a "
                   "managed chain from a series of separate transactions. A "
                   "supplier who sees actual demand plans against it; one who "
                   "sees only orders plans against a distorted signal."),
        desc(
            "The BULLWHIP effect is that distortion made concrete: small "
            "variations in end demand amplify at each step upstream, because "
            "every party adds a margin of safety to what it observes. Sharing "
            "the actual demand rather than the orders is what dampens it."
        ),
    ]),

    ("Customer Relationship Management", [
        desc(
            "CRM records and coordinates every interaction with a customer, "
            "so the organisation behaves as one."
        ),
        ul([
            "Every contact -- sale, enquiry, complaint, service call -- "
            "recorded in one place.",
            "So anybody dealing with a customer knows what has already "
            "happened, whichever department it happened in.",
            "It supports retention, since it makes a customer's history and "
            "value visible.",
            "It supports targeted marketing, since behaviour is recorded "
            "rather than assumed.",
            "It holds personal data, which brings the obligations of the "
            "Legal Affairs category with it.",
        ]),
        desc(
            "The second point is what customers actually experience. Being "
            "asked to repeat something already told to another department is "
            "the failure CRM removes, and it is why the system's value "
            "depends on everybody using it rather than on its features."
        ),
    ]),

    ("Business Intelligence", [
        desc(
            "BI turns the data the other systems collect into something "
            "somebody can decide on."
        ),
        compare_grid(
            "TRANSACTION SYSTEMS AGAINST BI",
            "Recording what happens, against understanding it.",
            [("Transaction systems",
              ["Record events as they occur",
               "Optimised for many small writes",
               "Hold current state",
               "Answer questions about one thing"]),
             ("Business intelligence",
              ["Analyse what was recorded",
               "Optimised for large reads across history",
               "Hold accumulated history",
               "Answer questions about patterns"])]),
        desc(
            "This is the OLTP and OLAP distinction of the Database category, "
            "arriving from the business side -- and it is why analysis "
            "normally runs against a separate store rather than against the "
            "operational systems, whose performance it would otherwise "
            "destroy."
        ),
        desc(
            "BI's quality is bounded entirely by what feeds it. Inconsistent "
            "customer records, differing product definitions and missing data "
            "produce analysis that is confidently wrong -- which is why "
            "integration and data quality matter more to BI's usefulness than "
            "any analytical capability."
        ),
    ]),

    ("Knowledge and Groupware", [
        desc(
            "Some systems support how people work together rather than any "
            "particular transaction."
        ),
        table(
            ["System", "Supports"],
            [["Groupware and collaboration",
              "People working on the same thing, in different places"],
             ["Document management",
              "Finding, versioning and controlling documents"],
             ["Knowledge management",
              "Making what the organisation knows findable and reusable"],
             ["Workflow", "Routing work through defined steps and "
                          "approvals"]],
            caption="Four supporting system families.",
            footer="KNOWLEDGE management is the one that fails most often, "
                   "because the difficulty is not storing knowledge but "
                   "capturing what people know and making somebody encounter "
                   "it when it is relevant."),
        desc(
            "The tacit and explicit distinction from Project Integration "
            "applies directly here. Systems store explicit knowledge well, "
            "and tacit knowledge transfers by working alongside somebody -- "
            "so a knowledge system replacing that transfer rather than "
            "supporting it captures the wrong half."
        ),
    ]),

    ("Choosing and Implementing a System", [
        desc(
            "Selecting an enterprise system is a large commitment, and the "
            "decisions that determine the outcome are made before any "
            "software arrives."
        ),
        ol([
            "Establish what the organisation actually needs, in business "
            "terms rather than as a feature list.",
            "Decide how much process change is acceptable, since packages "
            "embody ways of working.",
            "Evaluate the fit against that, rather than against how many "
            "features each product has.",
            "Plan the data migration and the organisational agreement it "
            "requires, which is the largest part.",
            "Plan adoption, since a system nobody uses delivers nothing "
            "however well it was chosen.",
        ]),
        desc(
            "Step two settles most of what follows. An organisation "
            "unwilling to change its processes will customise heavily, pay "
            "for that at every upgrade, and lose the integration that "
            "justified the purchase -- so the willingness is established "
            "before the product is chosen rather than discovered during "
            "implementation."
        ),
    ]),

    ("Integration Between Systems", [
        desc(
            "Few organisations run one system, so how the separate ones "
            "exchange information determines how well any of them work."
        ),
        compare_grid(
            "POINT-TO-POINT AGAINST MEDIATED INTEGRATION",
            "Connecting each pair, or connecting through something.",
            [("Point to point",
              ["Each pair connected directly",
               "Simple for the first few connections",
               "Connections grow with the square of the systems",
               "Replacing one system means touching every connection"]),
             ("Through a middle layer",
              ["Each system connects once, to the middle",
               "More initial effort, and more to operate",
               "Adding a system is one connection rather than many",
               "Replacing one affects only its own connection"])]),
        desc(
            "The growth in the third row is the same arithmetic as "
            "communication channels: connecting n systems pairwise needs "
            "n(n-1)/2 links, which is manageable at four systems and "
            "unmanageable at twenty."
        ),
    ]),

    ("Data Across Systems", [
        desc(
            "Enterprise systems are only as useful as the agreement between "
            "them about what things are."
        ),
        table(
            ["Problem", "Consequence"],
            [["The same customer recorded differently in two systems",
              "Neither system can say what that customer is worth"],
             ["Product definitions differing between functions",
              "Sales and production figures cannot be compared"],
             ["No agreed authoritative source for a fact",
              "Every report disagrees, and each is defensible"],
             ["Codes and identifiers assigned independently",
              "Combining data requires mapping that must be maintained"]],
            caption="Four data problems and what each prevents.",
            footer="MASTER DATA MANAGEMENT is the discipline addressing "
                   "these: deciding what the authoritative source for each "
                   "kind of fact is and keeping the others consistent with "
                   "it. It is organisational agreement supported by "
                   "technology rather than the reverse."),
        desc(
            "The third row produces the most visible symptom: two reports "
            "giving different figures for the same thing, each correct "
            "according to its own source. The argument that follows cannot be "
            "resolved by examining either report."
        ),
    ]),

    ("Systems in Small and Large Organisations", [
        desc(
            "The same system families serve organisations of very different "
            "sizes, and what suits one does not suit the other."
        ),
        compare_grid(
            "LARGE AGAINST SMALL ORGANISATIONS",
            "The same need, different constraints.",
            [("Large",
              ["Can afford integration and specialist administration",
               "Needs the integration, since functions are separate",
               "Implementation takes years and changes the organisation",
               "Customisation is possible and usually regretted"]),
             ("Small",
              ["Cannot afford a long implementation or dedicated staff",
               "Functions overlap, so integration matters less",
               "Rented services suit, since nothing must be operated",
               "Adopting the product's processes is easier, since fewer "
               "exist"])]),
        desc(
            "Rented enterprise services changed what is available to smaller "
            "organisations, since the capability no longer requires owning "
            "and operating it. The trade is the one the cloud lesson "
            "describes: less control, and no infrastructure to run."
        ),
    ]),

    ("Systems and Process Change", [
        desc(
            "Installing a system changes how people work, and treating that "
            "as a side effect is what produces the characteristic failure."
        ),
        ol([
            "Decide what the process should be, using the product's approach "
            "as a starting point rather than an obstacle.",
            "Change the process deliberately, with the people who perform "
            "it.",
            "Configure the system to support the agreed process.",
            "Train against the PROCESS rather than against the screens.",
            "Retire the previous way, since leaving it available means people "
            "under pressure return to it.",
        ]),
        desc(
            "The fourth point distinguishes training that works. Showing "
            "somebody the screens teaches them the system; showing them how "
            "to do their job with it teaches them what they actually need -- "
            "and the difference decides whether adoption happens."
        ),
    ]),

    ("Measuring Whether a System Delivered", [
        desc(
            "Enterprise systems are expensive and their benefits are claimed "
            "confidently, which makes measuring the outcome worth arranging."
        ),
        ul([
            "Measure the BEFORE state, since the benefit is a difference and "
            "nobody can reconstruct it afterwards.",
            "Measure the business outcome rather than the system's usage, "
            "though usage is a necessary condition for it.",
            "Allow time, since enterprise systems disrupt before they "
            "improve.",
            "Distinguish benefits from the system from benefits from the "
            "process change it accompanied, since the second could sometimes "
            "have been had alone.",
            "Record the answer, since the organisation's next business case "
            "will be built on what this one turned out to be worth.",
        ]),
        desc(
            "The fourth point is uncomfortable and worth asking. Many "
            "enterprise system benefits come from finally agreeing a process "
            "and a set of definitions -- and where that is so, the "
            "organisation should know it, because agreeing is considerably "
            "cheaper than implementing."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where business system items are lost."),
        ul([
            "Confusing SCM with CRM. One faces suppliers, the other "
            "customers.",
            "Treating ERP as software rather than as an organisational "
            "agreement about how things are recorded.",
            "Customising an ERP product to preserve existing processes, which "
            "is paid for at every upgrade.",
            "Expecting BI to be useful when what feeds it is "
            "inconsistent.",
            "Running analysis against operational systems, which destroys "
            "their performance.",
            "Sharing only orders upstream, which produces the bullwhip "
            "effect.",
            "Expecting a knowledge system to capture tacit knowledge.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A manufacturer's suppliers hold large safety stocks and their "
            "orders fluctuate far more than end customer demand does. What is "
            "happening, and what addresses it?\""
        ),
        ol([
            "Note the pattern: variation amplifying at each step further from "
            "the customer.",
            "Each party sees only the orders from the party below, and adds a "
            "safety margin to what it observes.",
            "Those margins compound, so a small change in end demand becomes "
            "a large swing several steps upstream.",
            "This is the BULLWHIP effect, and it is a consequence of the "
            "information available rather than of anybody's error.",
            "The remedy is sharing ACTUAL demand up the chain, so each party "
            "plans against the real signal rather than against an already "
            "distorted one.",
        ]),
        desc(
            "The item rewards recognising that every party behaved sensibly. "
            "Adding a safety margin to an uncertain signal is prudent, and "
            "the aggregate effect is destructive -- which is why the remedy "
            "changes the information rather than the behaviour."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Business systems support the activities of this category."),
        ul([
            "CRM supports the segmentation and retention of the marketing "
            "lesson.",
            "BI is the OLAP side of the Database category's warehouse "
            "lesson.",
            "ERP implementation is the process-fitting decision of the "
            "process analysis lesson.",
            "Customisation cost at upgrade is the maintenance argument of "
            "Development Technology.",
            "Personal data in CRM brings the Legal Affairs obligations.",
            "Knowledge management uses the tacit and explicit distinction "
            "from Project Integration.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("How to identify which system an item describes",
              "Which direction the need faces",
              "Suppliers is SCM, customers is CRM, understanding what "
              "happened is BI."),
             ("ERP's defining property",
              "Integration -- one version of each fact",
              "Which is its value and its difficulty, since the organisation "
              "must agree how things are recorded."),
             ("What ERP implementation normally requires",
              "Changing processes to fit the product",
              "Customising to preserve existing processes is paid for at "
              "every upgrade."),
             ("What the bullwhip effect is",
              "Demand variation amplifying upstream",
              "Because each party adds a margin to an already distorted "
              "signal."),
             ("What bounds BI's usefulness",
              "The quality of what feeds it",
              "Inconsistent records produce analysis that is confidently "
              "wrong."),
             ("Why knowledge management fails",
              "The difficulty is capture and encounter, not storage",
              "And tacit knowledge does not transfer through a system at "
              "all.")]),
    ]),
]

_sys_quiz = [
    mcq("HARD",
        "A manufacturer's suppliers hold large safety stocks, and orders "
        "upstream fluctuate far more than end demand.\n\n"
        "What is this?",
        [("The bullwhip effect, addressed by sharing actual demand "
          "upstream", True),
         ("Poor inventory management practice by the suppliers "
          "themselves", False),
         ("Seasonal demand that the forecasting does not "
          "capture", False),
         ("Excessive lead times causing orders to be "
          "batched", False)],
        "Each party sees only the orders from the party below and adds a "
        "safety margin, so margins compound and small end-demand changes "
        "become large upstream swings. Everybody behaved sensibly -- adding a "
        "margin to an uncertain signal is prudent -- which is why the remedy "
        "changes the INFORMATION rather than the behaviour."),

    mcq("AVERAGE",
        "What is ERP's defining property?",
        [("Integration around one set of records shared by every "
          "function", True),
         ("Comprehensive coverage of an organisation's business "
          "processes", False),
         ("Support for planning production and material "
          "requirements", False),
         ("Configurability to match an organisation's existing "
          "processes", False)],
        "One version of each fact -- one customer, one product definition, "
        "one stock figure -- used by finance, manufacturing, procurement and "
        "the rest without reconciliation. That is its value and its "
        "difficulty, since it requires the whole organisation to agree how "
        "things are recorded, which is a negotiation rather than a technical "
        "task."),

    mcq("HARD",
        "Why is customising an ERP product to preserve existing processes "
        "costly beyond the initial work?",
        [("The customisation must be reapplied or reworked at every "
          "upgrade", True),
         ("Customised systems cannot be supported by the "
          "supplier", False),
         ("Customisation prevents the integration ERP "
          "provides", False),
         ("The organisation loses the ability to change the processes "
          "later", False)],
        "A customised product diverges from what the supplier maintains, so "
        "every update requires the changes to be reapplied and retested -- a "
        "cost paid indefinitely. The product embodies a way of working, and "
        "the usual judgement is that adopting it costs less than rebuilding "
        "existing processes in software."),

    mcq("AVERAGE",
        "An organisation needs to coordinate suppliers, inventory and "
        "distribution.\n\nWhich system family?",
        [("Supply chain management", True),
         ("Enterprise resource planning", False),
         ("Customer relationship management", False),
         ("Business intelligence", False)],
        "The need faces upstream, towards suppliers and the flow of materials "
        "towards the customer, which is SCM. The direction a described need "
        "faces is the quickest way to identify the family -- suppliers is "
        "SCM, customers is CRM, the organisation's own records is ERP, and "
        "understanding what happened is BI."),

    mcq("HARD",
        "Business intelligence has one binding limit on its "
        "usefulness.\n\nWhich?",
        [("The quality and consistency of the data feeding it", True),
         ("The analytical techniques that the available tools "
          "support", False),
         ("The volume of history that has been retained", False),
         ("The speed at which reports can be generated", False)],
        "Inconsistent customer records, differing product definitions and "
        "missing values produce analysis that is confidently wrong, and no "
        "analytical capability corrects for it. That is why integration and "
        "data quality determine BI's value more than any feature of the "
        "tools -- and why a warehouse's transform step is where the effort "
        "goes."),

    mcq("AVERAGE",
        "Why is analysis normally run against a separate store rather than "
        "the operational systems?",
        [("Analytical queries scan enormous ranges and would degrade "
          "operations", True),
         ("Operational systems do not retain enough historical data to "
          "analyse usefully", False),
         ("Separate stores can hold data from systems that are not "
          "integrated", False),
         ("Analysts should not have access to live operational "
          "data", False)],
        "The two workloads want opposite things: many small transactions "
        "against few enormous reads. Running analysis against the operational "
        "system means a query scanning years of history holds resources the "
        "transactions need. This is the OLTP and OLAP distinction of the "
        "Database category, arriving from the business side."),

    mcq("HARD",
        "What does a CRM system remove from the customer's experience?",
        [("Being asked to repeat what they already told another "
          "department", True),
         ("Waiting an extended period for a response to an "
          "enquiry", False),
         ("Receiving marketing they did not ask for", False),
         ("Dealing with more than one person about the same "
          "issue", False)],
        "One record of every interaction means anybody dealing with a "
        "customer knows what has already happened, whichever department it "
        "happened in. That is what customers actually experience, and it is "
        "why the system's value depends on everybody using it rather than on "
        "its features."),

    mcq("AVERAGE",
        "Why does knowledge management fail more often than document "
        "management?",
        [("The difficulty is capturing what people know and making it "
          "encountered, not storing it", True),
         ("Knowledge changes considerably more frequently than documents "
          "do", False),
         ("Knowledge cannot be versioned or controlled", False),
         ("Knowledge systems require more storage than document "
          "systems", False)],
        "Storing knowledge is easy; getting people to record what they know, "
        "and getting somebody else to encounter it at the moment it would "
        "help, is the actual problem. And tacit knowledge -- judgement, "
        "context, what normal looks like -- does not transfer through a "
        "system at all, which is the half that matters most."),

    mcq("HARD",
        "An ERP implementation faces resistance because departments record "
        "the same information differently.\n\nWhat does this indicate?",
        [("The organisational agreement ERP requires has not been "
          "reached", True),
         ("The product's data model is fundamentally unsuitable for this "
          "organisation", False),
         ("The implementation should be customised to accommodate "
          "both", False),
         ("Training has not addressed the new recording "
          "conventions", False),
         ],
        "One version of each fact requires everybody to agree what a customer "
        "is, how a product is defined and when a sale is recognised -- which "
        "is an organisational negotiation rather than a configuration "
        "question. It is where the implementation effort actually goes, and "
        "customising to preserve both definitions abandons the integration "
        "that was the point."),

    mcq("AVERAGE",
        "What distinguishes a managed supply chain from a series of separate "
        "transactions?",
        [("Information is shared upstream rather than only "
          "orders", True),
         ("Contracts are agreed to run for longer periods with each "
          "supplier", False),
         ("Inventory is held centrally rather than at each "
          "stage", False),
         ("A single system is used by every party in the chain", False)],
        "A supplier who sees actual end demand plans against the real signal; "
        "one who sees only the orders placed on them plans against a signal "
        "already distorted by everybody between. Sharing forecasts and "
        "schedules upstream is what makes the chain managed, and it is what "
        "dampens the bullwhip effect."),
]

LESSON_BIZ_SYS = lesson(
    MAJOR, MIDDLE,
    "Business Management Systems: ERP, SCM, CRM and BI",
    _sys_quiz,
    lesson_structure(
        "Business Management Systems: ERP, SCM, CRM and BI",
        "Four families of enterprise system recur, each distinguished by what "
        "it is FOR rather than by its technology -- and the quickest way to "
        "identify which an item describes is the direction the need faces: "
        "inward to the organisation's own records, upstream to suppliers, "
        "downstream to customers, or backward at what already happened. This "
        "lesson covers ERP's defining INTEGRATION and the organisational "
        "agreement it demands, the bullwhip effect that arises from every "
        "party behaving sensibly on distorted information, CRM's real value "
        "in what customers stop experiencing, and BI's usefulness being "
        "bounded entirely by what feeds it.",
        [
            "Identify which system family a described need concerns",
            "Explain ERP's integration and what it demands of an "
            "organisation",
            "Explain why customising an ERP product is costly indefinitely",
            "Describe supply chain concerns and the bullwhip effect",
            "Explain what CRM removes from the customer experience",
            "Distinguish transaction systems from business intelligence",
            "Explain what bounds BI's usefulness",
            "Explain why knowledge management fails more often than document "
            "management",
        ],
        75,
        _sys_sections,
        [
            ("ERP",
             "Integration around one set of records shared by every function. "
             "Requires an organisational agreement about recording."),
            ("ERP customisation",
             "Preserving existing processes in software, paid for again at "
             "every upgrade."),
            ("SCM",
             "Coordinating materials, information and money from suppliers "
             "through to the customer."),
            ("Bullwhip effect",
             "Demand variation amplifying upstream, because each party adds a "
             "margin to an already distorted signal."),
            ("CRM",
             "Every customer interaction in one place, so the organisation "
             "behaves as one."),
            ("Business intelligence",
             "Analysis of accumulated history, run separately since the two "
             "workloads want opposite things."),
            ("Knowledge management",
             "Hard because capture and encounter are the problem, and tacit "
             "knowledge does not transfer through a system."),
        ],
        "Four enterprise families recur, and the direction a described need "
        "faces identifies which: ERP looks INWARD at the organisation's own "
        "records, SCM UPSTREAM at suppliers, CRM DOWNSTREAM at customers, and "
        "BI BACKWARD at what the others recorded. ERP's defining property is "
        "integration -- one version of each fact, used everywhere -- which is "
        "both its value and its difficulty, since it requires the whole "
        "organisation to agree how things are recorded, and that negotiation "
        "is where the effort goes. Implementing it normally means changing "
        "PROCESSES to fit the product, because customising to preserve "
        "existing ones is paid for again at every upgrade. SCM coordinates "
        "the flow towards the customer, and its characteristic failure is the "
        "BULLWHIP effect: each party sees only the orders below it and adds a "
        "safety margin, so small end-demand changes become large upstream "
        "swings -- everybody behaving sensibly on distorted information, "
        "remedied by sharing actual demand. CRM's value is what customers "
        "stop experiencing, namely repeating themselves to each department in "
        "turn. And BI analyses accumulated history in a separate store, with "
        "its usefulness bounded entirely by the quality of what feeds it.",
        exam_notes=[
            desc(
                "Items describe a business need or a symptom and ask which "
                "system addresses it."
            ),
            ul([
                "Identifying the bullwhip effect and its remedy.",
                "Naming ERP's defining property.",
                "Explaining ERP customisation's recurring cost.",
                "Matching a described need to a system family.",
                "Explaining what bounds BI's usefulness.",
                "Explaining why analysis runs separately.",
                "Explaining why knowledge management is hard.",
            ]),
            desc(
                "To identify a system family, ask which way the need faces. "
                "Suppliers and materials is SCM, customers and interactions "
                "is CRM, the organisation's own integrated records is ERP, "
                "and understanding patterns in what happened is BI."
            ),
        ],
    ))

LESSONS = [LESSON_BIZ_GOAL, LESSON_BIZ_SYS]

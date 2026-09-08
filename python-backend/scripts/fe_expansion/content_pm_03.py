"""Project Management, lessons 6 and 7.

Time management with critical path and PERT, and cost management with earned
value.

These are the two lessons carrying the category's arithmetic, so both are
worked step by step -- the critical path because float is what distinguishes
an activity that matters from one that does not, and earned value because
schedule and cost variance are unanswerable without it.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Project Management"
MIDDLE = "Project Management"

# ==========================================================================
# Lesson 6: Time management
# ==========================================================================

_time_sections = [
    ("From Work Packages to a Schedule", [
        desc(
            "The WBS says what must be done. Scheduling establishes in what "
            "order, how long each takes, and therefore when the project "
            "finishes."
        ),
        ol([
            "Define the ACTIVITIES needed to produce each work package.",
            "Sequence them by identifying which must precede which.",
            "Estimate the DURATION of each, using the resources actually "
            "assigned.",
            "Calculate the schedule, which produces the earliest and latest "
            "each can occur.",
            "Compress it if the resulting end date is unacceptable, "
            "deliberately and with known consequences.",
        ]),
        desc(
            "Step two is the one that determines everything afterwards. "
            "Duration estimates matter, and the DEPENDENCIES matter more, "
            "because they decide which durations add up and which happen "
            "alongside one another."
        ),
    ]),

    ("Dependencies", [
        desc(
            "Not every dependency is the same kind, and distinguishing them "
            "reveals which are negotiable."
        ),
        table(
            ["Kind", "Means", "Negotiable"],
            [["Mandatory", "Physically or contractually unavoidable",
              "No -- code cannot be tested before it is written"],
             ["Discretionary", "A preference or a convention",
              "Yes -- and worth examining when the schedule is tight"],
             ["External", "Depends on something outside the project",
              "Not by the project alone"],
             ["Internal", "Between activities the project controls",
              "Yes"]],
            caption="Four kinds of dependency and which can be challenged.",
            footer="DISCRETIONARY dependencies are where schedule compression "
                   "usually finds room. A sequence adopted because it is how "
                   "the team normally works may be re-orderable at no cost, "
                   "and nobody examines it unless somebody asks."),
        desc(
            "The commonest relationship is FINISH TO START: the next activity "
            "begins when the previous one ends. The others -- start to start, "
            "finish to finish, start to finish -- appear where work genuinely "
            "overlaps, and modelling them accurately is what makes a schedule "
            "reflect how the work will really proceed."
        ),
    ]),

    ("Estimating Duration", [
        desc(
            "Duration estimates carry uncertainty, and the syllabus expects "
            "the techniques that acknowledge it."
        ),
        image(fig("pert-estimate")),
        desc(
            "A THREE-POINT estimate gives an optimistic, a most likely and a "
            "pessimistic duration. The PERT formula weights the most likely "
            "case four times: (O + 4M + P) / 6 -- which produces an expected "
            "duration accounting for the pessimistic tail without letting it "
            "dominate."
        ),
        ol([
            "An activity is estimated at 4 days optimistic, 6 most likely, 14 "
            "pessimistic.",
            "A simple average would give 8 days, which overweights the "
            "unlikely bad case.",
            "PERT gives (4 + 24 + 14) / 6 = 42 / 6 = 7 days.",
            "The result sits above the most likely value, reflecting that "
            "things go wrong more often than they go unusually well.",
            "The spread between optimistic and pessimistic is itself "
            "information: a wide spread signals an activity worth "
            "investigating before it is scheduled.",
        ]),
        desc(
            "Step five is the part usually ignored. Two activities may have "
            "the same expected duration and completely different uncertainty, "
            "and the one with the wide range is where the schedule risk "
            "actually lives."
        ),
    ]),

    ("The Critical Path", [
        desc(
            "Given activities, durations and dependencies, the critical path "
            "is what determines the project's length."
        ),
        image(fig("critical-path")),
        desc(
            "It is the LONGEST path through the network, and therefore the "
            "shortest possible project duration. Every activity on it has "
            "zero float: delay any one by a day and the project finishes a "
            "day later."
        ),
        table(
            ["Term", "Means"],
            [["Earliest start", "The soonest an activity can begin, given "
                                "its predecessors"],
             ["Earliest finish", "Earliest start plus duration"],
             ["Latest finish", "The latest it can end without delaying the "
                               "project"],
             ["Latest start", "Latest finish minus duration"],
             ["Float", "Latest start minus earliest start"],
             ["Critical path", "The activities with zero float"]],
            caption="Six terms, and the last one follows from the fifth.",
            footer="FLOAT is the whole point of the calculation. It "
                   "distinguishes an activity where a day's delay costs the "
                   "project a day from one where four days can be lost and "
                   "nothing changes -- and the two are managed completely "
                   "differently."),
    ]),

    ("Working a Critical Path Question", [
        desc(
            "\"Activities A(3) and B(5) can start immediately. C(4) follows "
            "A. D(2) follows B and C. What is the project duration and which "
            "activities are critical?\""
        ),
        ol([
            "Forward pass. A: starts 0, finishes 3. B: starts 0, finishes 5. "
            "C follows A, so starts 3, finishes 7.",
            "D follows both B and C, so it starts when the LATER of them "
            "finishes: B finishes 5, C finishes 7, so D starts 7 and finishes "
            "9.",
            "The project duration is 9 -- the earliest finish of the last "
            "activity.",
            "Backward pass. D must finish by 9, so it starts by 7. C must "
            "finish by 7, so it starts by 3. A must finish by 3, so it starts "
            "by 0. B must finish by 7, so it starts by 2.",
            "Float. A: 0 - 0 = 0. C: 3 - 3 = 0. D: 7 - 7 = 0. B: 2 - 0 = 2. "
            "So the critical path is A, C, D, and B has two days of float.",
        ]),
        desc(
            "The step people get wrong is the second: an activity with "
            "several predecessors waits for the LATEST of them. Taking the "
            "earlier one produces a duration that is too short and a critical "
            "path that is wrong."
        ),
        desc(
            "The result also shows why float matters practically. B can slip "
            "two days with no effect on the project; A, C and D cannot slip "
            "at all -- so attention and contingency belong on those three."
        ),
    ]),

    ("Presenting a Schedule", [
        desc(
            "The same schedule is shown two ways, and each answers a question "
            "the other cannot."
        ),
        image(fig("gantt-view")),
        compare_grid(
            "NETWORK DIAGRAM AGAINST GANTT CHART",
            "Dependencies against calendar time.",
            [("Network diagram",
              ["Shows what depends on what",
               "Reveals the critical path",
               "Shows the effect of a delay propagating",
               "Says little about calendar dates"]),
             ("Gantt chart",
              ["Shows what happens when, against dates",
               "Reveals overlaps and resource clashes",
               "Communicates readily to anybody",
               "Hides why an activity sits where it does"])]),
        desc(
            "The last line of each column is the reason both are used. A "
            "Gantt chart is what most people are shown and it does not "
            "explain WHY a bar cannot move -- which is exactly what somebody "
            "asking for a date change needs to know."
        ),
    ]),

    ("Compressing a Schedule", [
        desc(
            "When the calculated end date is unacceptable, two techniques "
            "shorten it -- and both have costs the examination asks about."
        ),
        table(
            ["Technique", "Does", "Costs"],
            [["Crashing", "Adds resources to critical path activities",
              "Money, and diminishing returns as coordination rises"],
             ["Fast tracking", "Overlaps activities that were sequential",
              "RISK -- work begins on assumptions that may change"]],
            caption="Two compression techniques and what each buys with.",
            footer="Both apply only to the CRITICAL PATH. Shortening an "
                   "activity with float changes nothing about the project's "
                   "duration, which is the most common error in these items."),
        desc(
            "FAST TRACKING is the riskier of the two because it removes the "
            "reason the dependency existed. Starting construction before "
            "design is complete means building against a design that may "
            "change -- so the rework is not a risk of the technique but its "
            "expected cost."
        ),
        desc(
            "Compressing also MOVES the critical path. Shortening the "
            "critical activities enough makes another path the longest, and "
            "compressing further requires recalculating rather than "
            "continuing on the original path."
        ),
    ]),

    ("Controlling the Schedule", [
        desc(
            "A schedule is a prediction, and controlling it means noticing "
            "the divergence early enough to act."
        ),
        ul([
            "Measure progress at the activity level against the baseline "
            "schedule.",
            "Watch the CRITICAL PATH activities most closely, since only "
            "those affect the end date directly.",
            "Watch activities with little float too, since consumed float "
            "makes a path critical.",
            "Update the schedule when reality diverges, and assess whether "
            "the critical path has moved.",
            "Report the projected end date rather than the original one, "
            "since the original stopped being a prediction some time ago.",
        ]),
        desc(
            "The third point is what surprises projects. An activity with "
            "three days of float that slips four days has become critical, "
            "and the critical path is now somewhere nobody was watching -- "
            "which is why float consumption is monitored rather than only "
            "float existence."
        ),
    ]),

    ("Milestones", [
        desc(
            "A milestone is a point in the schedule with no duration, marking "
            "that something significant has been reached."
        ),
        ul([
            "It marks a completion, a decision point or an external "
            "commitment, rather than a piece of work.",
            "It has zero duration, which is what distinguishes it from an "
            "activity.",
            "Its value is that it is unambiguous: a milestone is reached or "
            "it is not, with no partial credit.",
            "Milestones are what most stakeholders actually track, since they "
            "are comprehensible without reading the schedule.",
        ]),
        desc(
            "That last property makes them useful and misusable. A project "
            "reporting milestones only is reporting a coarse signal, and a "
            "milestone missed by a day looks identical to one missed by two "
            "months -- so they supplement detailed tracking rather than "
            "replacing it."
        ),
    ]),

    ("Buffers and Contingency in a Schedule", [
        desc(
            "Estimates are uncertain, so a schedule built entirely from "
            "expected durations will be late more often than not."
        ),
        compare_grid(
            "PADDING EACH ACTIVITY AGAINST A SHARED BUFFER",
            "The same contingency, held two ways.",
            [("Padding each activity",
              ["Every estimate carries its own margin",
               "The margin is invisible and unmanaged",
               "Work expands to fill the padded estimate",
               "Early finishes are absorbed rather than banked"]),
             ("A shared buffer at the end",
              ["Activities estimated honestly, contingency held once",
               "The buffer is visible and its consumption measurable",
               "A late activity draws on it explicitly",
               "Total contingency is smaller, since not all slip at once"])]),
        desc(
            "The shared approach is more efficient for a statistical reason: "
            "activities do not all overrun simultaneously, so contingency "
            "held once covers what individually padded estimates cover many "
            "times over. It also makes the contingency VISIBLE, which is what "
            "lets its consumption be a warning signal."
        ),
    ]),

    ("Schedule Realism", [
        desc(
            "A schedule can be arithmetically correct and still be a work of "
            "fiction, and the syllabus expects the checks."
        ),
        ol([
            "Check the durations were estimated by the people who will do the "
            "work, not assigned to them.",
            "Check the resource assumptions -- does the plan assume anybody "
            "is available more than they are.",
            "Check for the omitted activities: integration, rework, waiting "
            "for approvals, holidays and handovers.",
            "Check the dependencies reflect how the work will really proceed "
            "rather than an idealised order.",
            "Check that the end date was calculated rather than chosen and "
            "worked backwards from.",
        ]),
        desc(
            "The fifth check is the one that matters most and is hardest to "
            "raise. A schedule constructed backwards from a required date "
            "will fit that date exactly, because every duration was adjusted "
            "until it did -- and it contains no information about when the "
            "work will actually finish."
        ),
    ]),

    ("Calendars and Working Time", [
        desc(
            "A duration in days becomes a date only against a calendar, and "
            "the calendar is where schedules quietly go wrong."
        ),
        ul([
            "Working days are not calendar days: a ten-day activity spans two "
            "weeks, and longer across a public holiday.",
            "Different resources may have different calendars -- part-time "
            "staff, other countries, shift patterns.",
            "Leave and training are known absences and belong in the plan "
            "rather than surfacing as slippage.",
            "External parties have their own calendars, and a supplier's "
            "shutdown is not negotiable by the project.",
        ]),
        desc(
            "The last point is the one that catches long projects. A "
            "dependency on an external party during their annual shutdown is "
            "a delay nothing in the project can compress -- and it is "
            "entirely foreseeable, which makes discovering it late a planning "
            "failure rather than bad luck."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where scheduling items are lost."),
        ul([
            "Taking the earliest predecessor rather than the latest when an "
            "activity has several.",
            "Compressing an activity that has float, which changes nothing.",
            "Forgetting that compression moves the critical path.",
            "Treating fast tracking's rework as a risk rather than as its "
            "expected cost.",
            "Ignoring float consumption, so a near-critical path becomes "
            "critical unnoticed.",
            "Accepting discretionary dependencies as fixed when the schedule "
            "is tight.",
            "Reporting the original end date after it stopped being "
            "achievable.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A project is late. The manager assigns extra staff to an "
            "activity with five days of float. Why does the end date not "
            "improve?\""
        ),
        ol([
            "Establish what float means: the amount an activity can slip "
            "without delaying the project.",
            "An activity with five days of float is not on the critical "
            "path, since critical activities have zero float.",
            "The project's duration is set by the LONGEST path through the "
            "network, which does not include this activity.",
            "Shortening an activity that is not on that path shortens a path "
            "that was not the constraint.",
            "The end date therefore does not move, and the extra staff have "
            "been spent producing float that was already sufficient.",
        ]),
        desc(
            "The general rule is worth memorising: compression only helps on "
            "the critical path, and after compressing the critical path must "
            "be recalculated because it may now be somewhere else."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Scheduling depends on and feeds other areas."),
        ul([
            "Activities are derived from the work packages of the scope "
            "lesson.",
            "Effort becomes duration using the resource decisions of the "
            "previous lesson.",
            "Resource levelling may extend the critical path.",
            "Schedule variance is calculated using earned value in the next "
            "lesson.",
            "Fast tracking's rework risk belongs in the risk register.",
            "Three-point estimating is the estimation practice of "
            "Development Technology.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What the critical path is",
              "The longest path, and the shortest possible duration",
              "Its activities have zero float, so any delay delays the "
              "project."),
             ("What float measures",
              "How much an activity can slip without affecting the end date",
              "Which is what separates activities that matter from those "
              "that do not."),
             ("The PERT formula",
              "(O + 4M + P) / 6",
              "Weighting the most likely case four times, so the pessimistic "
              "tail counts without dominating."),
             ("When an activity has several predecessors",
              "It starts when the LATEST of them finishes",
              "Taking the earliest is the commonest arithmetic error in these "
              "items."),
             ("Crashing against fast tracking",
              "Adds resources, against overlaps activities",
              "One costs money; the other costs rework risk, which is "
              "expected rather than possible."),
             ("Why compressing may not help",
              "It only works on the critical path",
              "And after compressing, the critical path may have moved "
              "elsewhere.")]),
    ]),
]

_time_quiz = [
    mcq("HARD",
        "A late project assigns extra staff to an activity that has five days "
        "of float.\n\nWhy does the end date not improve?",
        [("The activity is not on the critical path, which is what determines "
          "the duration", True),
         ("The additional staff need time to become productive on the "
          "activity", False),
         ("Float must be consumed before additional resources have any "
          "effect", False),
         ("The activity's duration cannot be reduced below its optimistic "
          "estimate", False)],
        "Float means an activity can slip without affecting the end date, so "
        "an activity with five days of it is not on the critical path. The "
        "project's duration is set by the LONGEST path, and shortening "
        "something not on that path shortens a path that was never the "
        "constraint. Compression only helps on the critical path -- and after "
        "it, the path must be recalculated."),

    mcq("HARD",
        "Activities A(3) and B(5) start immediately. C(4) follows A. D(2) "
        "follows both B and C.\n\nWhat is the project duration?",
        [("9", True),
         ("7, since B and C run in parallel", False),
         ("14, adding every activity's duration", False),
         ("11, following A then C then B then D", False)],
        "A finishes at 3, so C runs 3 to 7. B finishes at 5. D follows BOTH, "
        "so it waits for the LATER of them -- C at 7, not B at 5 -- and runs "
        "7 to 9. Taking the earlier predecessor is the commonest error and "
        "gives 7. The critical path is A, C, D, and B carries two days of "
        "float."),

    mcq("AVERAGE",
        "An activity is estimated at 4 days optimistic, 6 most likely and 14 "
        "pessimistic.\n\nWhat is the PERT expected duration?",
        [("7 days", True),
         ("6 days, the most likely value", False),
         ("8 days, the average of the three estimates", False),
         ("9 days, the midpoint of the range", False)],
        "PERT is (O + 4M + P) / 6, so (4 + 24 + 14) / 6 = 42 / 6 = 7. It "
        "weights the most likely case four times, which accounts for the "
        "pessimistic tail without letting it dominate as a simple average "
        "would -- the simple average of 8 gives the unlikely bad case the "
        "same weight as the realistic one."),

    mcq("AVERAGE",
        "What does float tell you about an activity?",
        [("How much it can slip without delaying the project", True),
         ("How much of its duration estimate is contingency", False),
         ("How much resource capacity is spare while it runs", False),
         ("How much it could be shortened by adding resources", False)],
        "Float is latest start minus earliest start, and it separates "
        "activities where a day's delay costs the project a day from those "
        "where several days can be lost harmlessly. That distinction decides "
        "where attention and contingency belong -- and an activity with zero "
        "float is by definition on the critical path."),

    mcq("HARD",
        "A schedule is compressed by fast tracking.\n\n"
        "What is the characteristic cost?",
        [("Rework, since later work begins on assumptions that may "
          "change", True),
         ("Additional expenditure on resources for critical "
          "activities", False),
         ("Reduced quality, since activities are given less time", False),
         ("Resource conflicts, since more work happens "
          "simultaneously", False)],
        "Fast tracking overlaps activities that were sequential, which "
        "removes the reason the dependency existed. Starting construction "
        "before design completes means building against something that may "
        "change, so rework is the expected cost rather than a possible risk. "
        "Adding money to shorten activities is CRASHING, the other "
        "compression technique."),

    mcq("AVERAGE",
        "Which kind of dependency is worth challenging when a schedule needs "
        "compressing?",
        [("Discretionary, since it reflects preference rather than "
          "necessity", True),
         ("Mandatory, since it usually contains contingency", False),
         ("External, since suppliers can generally accelerate", False),
         ("Internal, since the project controls both activities", False)],
        "A discretionary dependency exists because it is how the team "
        "normally works rather than because the sequence is unavoidable, so "
        "re-ordering may cost nothing -- and nobody examines it unless "
        "somebody asks. Mandatory dependencies are physically or "
        "contractually unavoidable, and code genuinely cannot be tested "
        "before it is written."),

    mcq("HARD",
        "An activity with three days of float slips by four days.\n\n"
        "What has happened to the schedule?",
        [("Its path has become critical, and the project is a day "
          "late", True),
         ("Nothing, since the slippage is within the same order as the "
          "float", False),
         ("The critical path has absorbed the delay through its own "
          "float", False),
         ("The project end date is unchanged but the risk has "
          "increased", False),
         ],
        "Three days of float absorbs three days of delay; the fourth day has "
        "nothing to absorb it and passes to the end date. The path is now "
        "critical, which means the critical path has MOVED to somewhere "
        "nobody was watching. This is why float consumption is monitored "
        "rather than merely float existence."),

    mcq("AVERAGE",
        "What does a network diagram show that a Gantt chart does not?",
        [("Why an activity sits where it does, through its "
          "dependencies", True),
         ("The calendar dates on which each activity occurs", False),
         ("Which resources are assigned to each activity", False),
         ("The proportion of each activity that is complete", False)],
        "A Gantt chart shows what happens when and communicates readily, and "
        "it does not explain why a bar cannot simply be moved. The network "
        "diagram shows the dependencies, reveals the critical path, and shows "
        "how a delay propagates -- which is exactly what somebody asking for "
        "a date change needs to understand."),

    mcq("HARD",
        "Two activities have the same PERT expected duration, and one has a "
        "far wider spread between optimistic and pessimistic.\n\n"
        "What does that indicate?",
        [("The wider spread carries more schedule risk and deserves "
          "investigation", True),
         ("The wider spread was estimated less carefully and should be "
          "redone", False),
         ("The two activities will behave identically, since the expected "
          "values match", False),
         ("The wider spread should use the pessimistic value as its "
          "duration", False)],
        "The expected value is one number describing a distribution, and two "
        "activities with the same expectation can carry very different "
        "uncertainty. A wide range says the estimator does not know what will "
        "happen, which is where schedule risk actually lives -- and it is "
        "information worth acting on before the activity is scheduled."),

    mcq("AVERAGE",
        "After crashing several critical path activities, what must be done?",
        [("Recalculate, since another path may now be the longest", True),
         ("Apply the same compression to the remaining "
          "activities", False),
         ("Re-estimate the durations of the crashed activities", False),
         ("Update the resource plan to reflect the additional staff", False)],
        "Compression shortens the critical path, and shortening it enough "
        "makes some other path the longest -- at which point further "
        "compression of the original activities changes nothing. Continuing "
        "to compress the original path without recalculating spends resources "
        "on activities that have stopped being the constraint."),
]

LESSON_PM_TIME = lesson(
    MAJOR, MIDDLE,
    "Project Time Management: Scheduling, Critical Path and PERT",
    _time_quiz,
    lesson_structure(
        "Project Time Management: Scheduling, Critical Path and PERT",
        "The WBS says what must be done and scheduling establishes in what "
        "order and therefore when the project finishes -- with the "
        "DEPENDENCIES mattering more than the durations, since they decide "
        "which durations add up and which happen alongside. This lesson works "
        "the category's arithmetic rather than describing it: three-point and "
        "PERT estimating, the forward and backward passes that produce float, "
        "and the critical path as the activities where float is zero. It "
        "closes with the two compression techniques, both of which apply only "
        "to the critical path and one of which moves it.",
        [
            "Sequence activities and distinguish the kinds of dependency",
            "Apply three-point and PERT estimating",
            "Interpret the spread between optimistic and pessimistic "
            "estimates",
            "Calculate a critical path, including float, by forward and "
            "backward pass",
            "Explain what float means and how it is managed",
            "Distinguish a network diagram from a Gantt chart",
            "Apply crashing and fast tracking and state each one's cost",
            "Explain why compression may not shorten a project",
        ],
        90,
        _time_sections,
        [
            ("Mandatory dependency",
             "Physically or contractually unavoidable -- code cannot be "
             "tested before it is written."),
            ("Discretionary dependency",
             "A preference or convention, and therefore worth challenging "
             "when a schedule is tight."),
            ("Three-point estimate",
             "Optimistic, most likely and pessimistic durations, whose spread "
             "is itself information."),
            ("PERT formula",
             "(O + 4M + P) / 6, weighting the most likely case four times."),
            ("Forward pass",
             "Earliest start and finish for each activity -- taking the "
             "LATEST predecessor where there are several."),
            ("Backward pass",
             "Latest finish and start without delaying the project."),
            ("Float",
             "Latest start minus earliest start: how much an activity can "
             "slip without affecting the end date."),
            ("Critical path",
             "The longest path through the network, whose activities have "
             "zero float."),
            ("Crashing",
             "Adding resources to critical activities. Costs money, with "
             "diminishing returns."),
            ("Fast tracking",
             "Overlapping sequential activities. Costs rework, which is "
             "expected rather than possible."),
        ],
        "Scheduling turns work packages into activities, sequences them, "
        "estimates durations and calculates when the project finishes -- and "
        "the DEPENDENCIES do more of that work than the durations, since they "
        "decide what adds up and what runs alongside. Dependencies are "
        "mandatory, discretionary, internal or external, and DISCRETIONARY "
        "ones are where compression usually finds free room. Duration is "
        "estimated with three points, combined by PERT as (O + 4M + P) / 6 so "
        "the pessimistic tail counts without dominating -- and the SPREAD is "
        "itself information, since two activities with the same expectation "
        "can carry very different risk. The forward pass gives earliest "
        "times, taking the LATEST predecessor where an activity has several; "
        "the backward pass gives latest times; the difference is FLOAT; and "
        "the activities with zero float form the critical path, the longest "
        "route through the network and therefore the shortest possible "
        "project. Float is what separates activities that matter from those "
        "that do not, and float CONSUMPTION is monitored because a "
        "near-critical path can quietly become critical. Finally, "
        "compression: crashing buys time with money and fast tracking buys it "
        "with rework -- both only on the critical path, and both requiring "
        "recalculation afterwards because the path may have moved.",
        exam_notes=[
            desc(
                "This lesson supplies calculation items, which are the most "
                "reliably answerable in the category if the method is "
                "practised."
            ),
            ul([
                "Calculating project duration and the critical path.",
                "Calculating float for a given activity.",
                "Applying the PERT formula.",
                "Explaining why compressing a non-critical activity fails.",
                "Distinguishing crashing from fast tracking.",
                "Identifying a challengeable dependency.",
                "Interpreting float consumption.",
            ]),
            desc(
                "On any network calculation, the error to guard against is "
                "the merge point: an activity with several predecessors "
                "starts when the LATEST of them finishes. Taking the earliest "
                "gives a duration that is too short and a critical path that "
                "is wrong, and both errors look plausible."
            ),
        ],
    ))

# ==========================================================================
# Lesson 7: Cost management and earned value
# ==========================================================================

_cost_sections = [
    ("Estimating and Budgeting", [
        desc(
            "Cost management establishes what the project will cost, obtains "
            "that funding, and controls spending against it."
        ),
        table(
            ["Activity", "Produces"],
            [["Estimate costs", "What each work package will cost"],
             ["Determine the budget", "An authorised cost baseline over time"],
             ["Control costs", "Variance identified, and acted on"]],
            caption="Three cost activities.",
            footer="The BUDGET is not the estimate. It is the estimate "
                   "aggregated, plus contingency for identified risks, "
                   "spread across time -- so it says not only how much but "
                   "when it will be needed."),
        desc(
            "Costs are estimated bottom-up from the WBS wherever possible, "
            "since a total built from packages can be examined and corrected "
            "where a single top-down figure cannot. Top-down estimates are "
            "faster and appropriate early, when the WBS does not yet exist."
        ),
    ]),

    ("Kinds of Cost", [
        desc(
            "The syllabus distinguishes cost types, because they behave "
            "differently when the project changes."
        ),
        table(
            ["Type", "Means", "Behaviour"],
            [["Direct", "Attributable to this project",
              "Rises and falls with the project"],
             ["Indirect", "Shared overhead allocated to it",
              "Continues regardless"],
             ["Fixed", "Does not vary with the amount of work",
              "Unchanged by doing more or less"],
             ["Variable", "Varies with the amount of work",
              "Scales with the work"],
             ["Sunk", "Already spent and unrecoverable",
              "Irrelevant to any future decision"]],
            caption="Five cost types and how each behaves.",
            footer="SUNK COST is the row with a decision consequence. Money "
                   "already spent cannot be recovered by continuing, so it is "
                   "not a reason to continue -- however strongly it feels "
                   "like one, and it reliably does."),
        desc(
            "The sunk cost point is examined because acting on it is "
            "counter-intuitive. A project that will cost more to finish than "
            "the remaining benefit is worth should stop, and the amount "
            "already invested changes nothing about that comparison."
        ),
    ]),

    ("Contingency and Management Reserve", [
        desc(
            "A budget covering only the expected case will be exceeded, so "
            "two kinds of reserve are provided for two kinds of uncertainty."
        ),
        compare_grid(
            "CONTINGENCY RESERVE AGAINST MANAGEMENT RESERVE",
            "Known unknowns against unknown unknowns.",
            [("Contingency reserve",
              ["For risks that were identified",
               "Part of the cost baseline",
               "Spent by the project manager as risks occur",
               "Sized from the risk analysis"]),
             ("Management reserve",
              ["For what nobody anticipated",
               "Outside the baseline, in the total budget",
               "Released by management, not by the project",
               "Sized by judgement about the project's uncertainty"])]),
        desc(
            "The distinction is examined and it matters practically. "
            "Contingency belongs to the project because the risks it covers "
            "were analysed; management reserve does not, because using it is "
            "a statement that something unforeseen has occurred -- which "
            "somebody above the project should know about."
        ),
    ]),

    ("Why Spending Says Nothing About Progress", [
        desc(
            "The central insight of cost control, and the reason earned value "
            "exists."
        ),
        desc(
            "A project has spent 40 per cent of its budget. That figure is "
            "neither good nor bad, because it says nothing about how much "
            "work has been done -- 40 per cent spent for 60 per cent complete "
            "is excellent, and for 20 per cent complete it is alarming."
        ),
        table(
            ["Spent against budget", "Could mean", "Or could mean"],
            [["Under budget", "The work cost less than expected",
              "Less work has been done than planned"],
             ["On budget", "Everything is proceeding as planned",
              "Overspending on the work actually done, and behind"],
             ["Over budget", "The work cost more than expected",
              "More work has been completed than planned"]],
            caption="Three spending positions, each with two opposite "
                    "explanations.",
            footer="Every row has a favourable and an unfavourable "
                   "reading, and the figure cannot distinguish them. "
                   "What separates them is how much work has actually "
                   "been completed -- which is exactly what earned value "
                   "measures."),
        desc(
            "Comparing planned spending against actual spending has the same "
            "problem in a subtler form. A project under budget may be behind "
            "schedule and therefore not spending; a project over budget may "
            "be ahead. Both comparisons need a third number: how much work "
            "has actually been completed."
        ),
    ]),

    ("Earned Value", [
        desc(
            "The technique that supplies that third number, and makes both "
            "schedule and cost performance measurable."
        ),
        image(fig("earned-value")),
        table(
            ["Measure", "Is", "Answers"],
            [["Planned value (PV)", "Budgeted cost of the work SCHEDULED",
              "Where the plan said we would be"],
             ["Earned value (EV)", "Budgeted cost of the work PERFORMED",
              "How much has actually been done"],
             ["Actual cost (AC)", "What was really spent",
              "What getting here cost"]],
            caption="Three measures, all expressed in money.",
            footer="EARNED VALUE is the one that makes the others useful. It "
                   "measures progress in the same unit as the budget, which "
                   "is what lets progress and spending be compared at all."),
        desc(
            "Expressing progress in money is the trick that makes this work. "
            "A work package budgeted at 10,000 and completed has earned "
            "10,000 of value regardless of what it cost -- so progress "
            "becomes a fact rather than a percentage somebody estimated."
        ),
    ]),

    ("The Variances", [
        desc(
            "Two subtractions answer the two questions every status report "
            "attempts."
        ),
        ol([
            "SCHEDULE VARIANCE = EV - PV. Negative means less work has been "
            "done than was planned by now.",
            "COST VARIANCE = EV - AC. Negative means the work done cost more "
            "than it was budgeted to.",
            "SCHEDULE PERFORMANCE INDEX = EV / PV. Below 1 is behind "
            "schedule.",
            "COST PERFORMANCE INDEX = EV / AC. Below 1 is over cost.",
            "The indices are ratios, so they compare projects of different "
            "sizes and support forecasting.",
        ]),
        desc(
            "Both variances subtract from EARNED VALUE, which is the pattern "
            "worth memorising: earned minus planned is schedule, earned minus "
            "actual is cost. Negative is bad in both cases."
        ),
    ]),

    ("Working an Earned Value Question", [
        desc(
            "\"A project budgeted at 100,000 is halfway through its planned "
            "duration. PV is 50,000, EV is 40,000 and AC is 45,000. What is "
            "the position?\""
        ),
        ol([
            "Schedule variance = EV - PV = 40,000 - 50,000 = -10,000. "
            "Negative, so the project is BEHIND schedule.",
            "Cost variance = EV - AC = 40,000 - 45,000 = -5,000. Negative, so "
            "it is OVER cost.",
            "SPI = EV / PV = 40,000 / 50,000 = 0.8. Work is proceeding at 80 "
            "per cent of the planned rate.",
            "CPI = EV / AC = 40,000 / 45,000 = 0.89. Every unit of value cost "
            "about 1.12 units to produce.",
            "So the project is behind and overspending simultaneously, which "
            "is the worst of the four combinations and is not visible from "
            "the spending figures alone.",
        ]),
        desc(
            "Note what a simple budget comparison would have shown: 45,000 "
            "spent of 100,000 at the halfway point, which looks like an "
            "underspend. Only earned value reveals that the underspend "
            "reflects work not done, and that what was done cost more than it "
            "should have."
        ),
    ]),

    ("Forecasting", [
        desc(
            "The indices support projecting the outcome, which is what "
            "management actually needs."
        ),
        ul([
            "ESTIMATE AT COMPLETION projects the total cost, most simply as "
            "the budget divided by the cost performance index.",
            "In the worked example that is 100,000 / 0.89 = about 112,000, "
            "assuming performance continues as it has.",
            "ESTIMATE TO COMPLETE is what remains: the projection minus what "
            "has been spent.",
            "The projection assumes past performance continues, which is the "
            "assumption to state rather than hide.",
            "A projection that is unacceptable is the trigger for a decision "
            "rather than for a more optimistic assumption.",
        ]),
        desc(
            "The last point is where cost control either functions or does "
            "not. A forecast showing the project will exceed its budget "
            "exists so that somebody can decide what to do -- reduce scope, "
            "obtain funding, or stop -- and revising the forecast to be "
            "acceptable simply defers the same decision to a worse moment."
        ),
    ]),

    ("Funding Over Time", [
        desc(
            "A budget is not a single figure but a profile, since money is "
            "needed when the work happens."
        ),
        table(
            ["Concern", "Why it matters"],
            [["The spending profile",
              "Funding must be available when the work occurs, not on "
              "average"],
             ["Funding limits per period",
              "An organisation may cap what can be spent in a quarter"],
             ["Commitments against expenditure",
              "An order placed is money committed before it is spent"],
             ["Currency and price changes",
              "A long project's costs move under it"]],
            caption="Four things a budget profile must account for.",
            footer="COMMITMENTS are the row projects track least well. Money "
                   "committed by a purchase order is no longer available, and "
                   "a budget tracking only what has been PAID overstates what "
                   "remains."),
        desc(
            "Funding limits can reshape a schedule. Where an organisation "
            "caps spending per period, work may have to be moved regardless "
            "of what the critical path says -- which is resource levelling "
            "applied to money rather than to people."
        ),
    ]),

    ("Measuring Progress Objectively", [
        desc(
            "Earned value requires knowing how much work is complete, which "
            "means agreeing in advance how completion will be counted."
        ),
        compare_grid(
            "TWO WAYS OF CLAIMING PROGRESS",
            "One is a judgement; the other is a rule agreed beforehand.",
            [("By opinion",
              ["Somebody estimates a percentage complete",
               "Optimistic by default, and unfalsifiable",
               "The last ten per cent takes half the time",
               "Produces the 'ninety per cent done' project"]),
             ("By an agreed rule",
              ["Nothing until started, then a fixed share, then complete",
               "Or credit only on completion of small packages",
               "Or milestones with defined evidence",
               "The same answer whoever is asked"])]),
        desc(
            "The rule matters more than which rule is chosen. Any consistent "
            "convention makes earned value comparable over time, whereas "
            "percentage judgements produce a figure that varies with who is "
            "asked and how the week has gone."
        ),
    ]),

    ("Cost Control in Practice", [
        desc(
            "The measurements only matter if something is done with them, "
            "and the response depends on what the variance means."
        ),
        ol([
            "Establish whether the variance is real or an artefact of "
            "measurement timing.",
            "Establish whether it is a one-off or a trend, since a trend "
            "projects forward and a one-off does not.",
            "Identify the cause, which is usually a specific work package "
            "rather than the project generally.",
            "Decide the response: absorb it, correct it, replan, or escalate "
            "for a scope or funding decision.",
            "Update the forecast, and report the projected outcome rather "
            "than the original budget.",
        ]),
        desc(
            "The second step is what separates useful cost control from "
            "monthly reporting. A single overspending month may be timing; "
            "three consecutive months at the same performance index is a "
            "trend, and it projects to a total that somebody must act on now "
            "rather than at the end."
        ),
    ]),

    ("Cost and the Other Constraints", [
        desc(
            "Cost is one of the three constraints, so a cost problem is "
            "frequently a scope or schedule decision in disguise."
        ),
        table(
            ["Response to a cost overrun", "Consequence"],
            [["Reduce scope", "Less is delivered, deliberately and "
                              "visibly"],
             ["Extend the schedule",
              "Often reduces monthly spend and raises the total"],
             ["Obtain more funding", "The decision goes to the sponsor"],
             ["Reduce quality", "Cheaper now, and more expensive later"],
             ["Absorb it in the team", "Not a plan, and not sustainable"]],
            caption="Five responses, of which two are decisions and three are "
                    "consequences.",
            footer="EXTENDING a schedule to reduce cost usually raises the "
                   "total, since fixed and indirect costs continue for "
                   "longer. It reduces spending per period, which is a "
                   "different thing and sometimes the actual constraint."),
        desc(
            "Presenting these as a set is the useful management action. A "
            "sponsor shown one option chooses between accepting it and "
            "refusing; a sponsor shown the alternatives with their "
            "consequences makes an informed decision -- which is the whole "
            "purpose of measuring cost performance accurately."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where cost items are lost."),
        ul([
            "Reading spending against budget as progress, when it says "
            "nothing without earned value.",
            "Confusing the variance formulas. Both subtract FROM earned "
            "value.",
            "Reading a positive variance as good without checking which "
            "variance it is.",
            "Confusing contingency reserve with management reserve. Only the "
            "first is in the baseline.",
            "Treating sunk cost as a reason to continue.",
            "Estimating top-down when a WBS exists to estimate from.",
            "Revising an unwelcome forecast rather than acting on it.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A project reports that it has spent less than budgeted at the "
            "halfway point. The sponsor concludes it is performing well. "
            "Evaluate that conclusion.\""
        ),
        ol([
            "Establish what the figure shows: actual cost against planned "
            "cost, and nothing else.",
            "Spending less than planned has two possible explanations: the "
            "work cost less, or less work was done.",
            "Nothing in the figure distinguishes them, so the conclusion is "
            "unsupported rather than wrong.",
            "The missing number is EARNED VALUE -- how much of the planned "
            "work has actually been completed.",
            "With it, both variances are computable: EV - PV for schedule and "
            "EV - AC for cost, and only then does 'performing well' mean "
            "anything.",
        ]),
        desc(
            "This is the most common reasoning error the topic exists to "
            "correct. An underspend is the expected signature of a project "
            "that is behind schedule, so the sponsor's conclusion may be "
            "exactly backwards -- and the figure they were shown cannot tell "
            "them either way."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Cost management depends on the other areas."),
        ul([
            "Estimates are built bottom-up from the WBS of the scope "
            "lesson.",
            "Contingency is sized from the risk analysis of the risk "
            "lesson.",
            "Schedule variance measures the same thing the critical path "
            "lesson calculates, in money.",
            "The cost baseline is one of the three integration baselines.",
            "Sunk cost reasoning appears in the governance decision to "
            "continue or stop.",
            "Cost of quality is the quality lesson's conformance argument.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Why spending says nothing alone",
              "It does not say how much work was done",
              "An underspend is the expected signature of being behind "
              "schedule."),
             ("The three earned value measures",
              "Planned value, earned value, actual cost",
              "Earned value is progress expressed in money, which is what "
              "makes comparison possible."),
             ("The two variance formulas",
              "SV = EV - PV; CV = EV - AC",
              "Both subtract FROM earned value, and negative is bad in "
              "both."),
             ("Contingency against management reserve",
              "Identified risks, against the unanticipated",
              "Contingency is in the baseline and the project spends it; "
              "reserve is not and management releases it."),
             ("Why sunk cost is irrelevant",
              "It cannot be recovered by continuing",
              "So the only question is whether remaining benefit exceeds "
              "remaining cost."),
             ("What an unacceptable forecast is for",
              "Triggering a decision",
              "Revising it to be acceptable defers the same decision to a "
              "worse moment.")]),
    ]),
]

_cost_quiz = [
    mcq("HARD",
        "Spending is below budget at a project's halfway point, and the "
        "sponsor concludes it is performing well.\n\n"
        "Is that supported?",
        [("No -- an underspend is also the signature of being behind "
          "schedule", True),
         ("Yes -- spending below budget indicates efficient use of "
          "resources", False),
         ("Yes, provided the schedule baseline has not been "
          "revised", False),
         ("No -- the comparison should have used the management reserve "
          "as well", False)],
        "Spending less than planned has two explanations: the work cost less, "
        "or less work was done -- and the figure cannot distinguish them. The "
        "missing number is EARNED VALUE, the budgeted cost of work actually "
        "performed, without which neither schedule nor cost variance can be "
        "computed. The sponsor's conclusion may be exactly backwards."),

    mcq("HARD",
        "Reported figures are PV 50,000, EV 40,000 and AC 45,000.\n\n"
        "What is its position?",
        [("Behind schedule and over cost", True),
         ("Ahead of schedule and under cost", False),
         ("Behind schedule and under cost", False),
         ("On schedule and over cost", False)],
        "Schedule variance is EV - PV = 40,000 - 50,000 = -10,000, so behind. "
        "Cost variance is EV - AC = 40,000 - 45,000 = -5,000, so over cost. "
        "Both negative is the worst combination and is invisible from "
        "spending alone -- 45,000 of a 100,000 budget at halfway looks like "
        "an underspend, and it reflects work not done."),

    mcq("AVERAGE",
        "How is schedule variance calculated in earned value analysis?",
        [("Earned value minus planned value", True),
         ("Planned value minus actual cost", False),
         ("Earned value minus actual cost", False),
         ("Actual cost minus planned value", False)],
        "Both variances subtract FROM earned value: earned minus planned "
        "gives schedule, earned minus actual gives cost. Negative is "
        "unfavourable in both cases. Earned value minus actual cost is the "
        "COST variance, and any formula not involving earned value cannot "
        "measure progress at all."),

    mcq("AVERAGE",
        "What does a cost performance index below 1 indicate?",
        [("The work performed cost more than it was budgeted to", True),
         ("Less work has been completed than was scheduled", False),
         ("The project will finish later than planned", False),
         ("The contingency reserve has been exhausted", False)],
        "CPI is EV / AC -- value earned per unit of cost incurred -- so below "
        "1 means each unit of budgeted value cost more than one unit to "
        "produce. Progress against the schedule is measured by SPI, which is "
        "EV / PV. The two indices are independent: a project can be behind on "
        "one and ahead on the other."),

    mcq("HARD",
        "What distinguishes contingency reserve from management reserve?",
        [("Contingency covers identified risks and sits in the baseline; "
          "management reserve does not", True),
         ("Contingency is for cost overruns and management reserve for "
          "schedule delays", False),
         ("Contingency is calculated as a percentage while management "
          "reserve is estimated", False),
         ("Contingency is released by the sponsor and management reserve by "
          "the project manager", False)],
        "Contingency covers risks that were analysed, so it is sized from "
        "that analysis, sits inside the cost baseline, and the project "
        "manager spends it as risks occur. Management reserve covers what "
        "nobody anticipated, sits outside the baseline, and its release is a "
        "management decision -- because using it means something unforeseen "
        "has happened, which somebody above the project should know."),

    mcq("HARD",
        "A project has spent a large sum and will now cost more to complete "
        "than the remaining benefit is worth.\n\nWhat should happen?",
        [("It should stop, since the amount already spent cannot be "
          "recovered by continuing", True),
         ("It should continue, since abandoning it wastes the investment "
          "made", False),
         ("It should continue at reduced scope until the investment is "
          "recovered", False),
         ("It should be paused until the benefit case can be "
          "improved", False)],
        "Money already spent is SUNK -- unrecoverable whether the project "
        "continues or stops -- so it is irrelevant to the decision. The only "
        "comparison that matters is remaining cost against remaining benefit. "
        "Continuing to justify past spending is the sunk cost fallacy, and it "
        "converts a bounded loss into a larger one."),

    mcq("AVERAGE",
        "What does earned value actually measure?",
        [("The budgeted cost of the work that has been performed", True),
         ("The amount spent on the work performed to date", False),
         ("The value the delivered work will produce for the "
          "business", False),
         ("The budgeted cost of the work scheduled by this point", False)],
        "Earned value expresses PROGRESS in money: a package budgeted at "
        "10,000 and completed has earned 10,000 whatever it actually cost. "
        "That is what makes progress comparable with both the plan and the "
        "spending. What was spent is ACTUAL COST, and what was scheduled by "
        "now is PLANNED VALUE."),

    mcq("HARD",
        "A cost forecast projects an overrun, and the project manager revises "
        "the assumptions to produce an acceptable figure.\n\n"
        "What is the effect?",
        [("The same decision is deferred to a point where fewer options "
          "remain", True),
         ("The forecast becomes more accurate by reflecting intended "
          "improvements", False),
         ("The project baseline is updated to the revised "
          "projection", False),
         ("The variance is eliminated without further corrective "
          "action", False)],
        "A forecast exists so that somebody can decide -- reduce scope, "
        "obtain more funding, or stop -- while those options are still "
        "available. Revising it to be acceptable removes the trigger and "
        "leaves the underlying performance unchanged, so the overrun arrives "
        "later, larger, and with fewer courses of action remaining."),

    mcq("AVERAGE",
        "Why is bottom-up cost estimation preferred once a WBS exists?",
        [("A total built from packages can be examined and corrected where a "
          "single figure cannot", True),
         ("It produces a lower estimate than top-down "
          "approaches", False),
         ("It is faster to perform than estimating the project as a "
          "whole", False),
         ("It removes the need for contingency reserve", False)],
        "Estimating each work package and aggregating produces a figure whose "
        "components can be challenged individually, so an error is locatable "
        "and correctable. A single top-down number can only be accepted or "
        "disputed as a whole. Top-down is faster and appropriate early, "
        "before a WBS exists to estimate from."),

    mcq("AVERAGE",
        "Which cost type continues regardless of how much work the project "
        "performs?",
        [("Fixed cost", True),
         ("Variable cost, which is committed at the outset", False),
         ("Direct cost, which is attributable to the project", False),
         ("Sunk cost, which has already been incurred", False)],
        "Fixed costs do not vary with the amount of work, while variable "
        "costs scale with it. Direct and indirect describe whether a cost is "
        "attributable to this project or shared overhead, which is a "
        "different distinction. Sunk cost describes money already spent, "
        "whose defining property is that it is irrelevant to future "
        "decisions."),
]

LESSON_PM_COST = lesson(
    MAJOR, MIDDLE,
    "Project Cost Management and Earned Value",
    _cost_quiz,
    lesson_structure(
        "Project Cost Management and Earned Value",
        "Cost management estimates, budgets and controls, and its central "
        "insight is that SPENDING SAYS NOTHING ABOUT PROGRESS -- forty per "
        "cent of the budget spent is excellent at sixty per cent complete and "
        "alarming at twenty, and the figure alone cannot tell you which. "
        "Earned value supplies the missing number by expressing progress in "
        "money, which makes both variances computable: earned minus planned "
        "for schedule and earned minus actual for cost. The lesson also "
        "covers the cost types including sunk cost and why it is irrelevant "
        "to any decision, the two reserves for two kinds of uncertainty, and "
        "forecasting as something that exists to trigger decisions.",
        [
            "Distinguish estimating from budgeting and prefer bottom-up "
            "estimation",
            "Classify costs and explain why sunk cost is irrelevant",
            "Distinguish contingency reserve from management reserve",
            "Explain why spending against budget does not indicate progress",
            "Define planned value, earned value and actual cost",
            "Calculate schedule and cost variance and the performance indices",
            "Forecast an estimate at completion",
            "Explain what an unacceptable forecast is for",
        ],
        90,
        _cost_sections,
        [
            ("Cost baseline",
             "The aggregated estimate plus contingency, spread over time, "
             "against which spending is controlled."),
            ("Sunk cost",
             "Already spent and unrecoverable, and therefore irrelevant to "
             "any decision about continuing."),
            ("Contingency reserve",
             "For identified risks. Inside the baseline, spent by the project "
             "manager."),
            ("Management reserve",
             "For the unanticipated. Outside the baseline, released by "
             "management."),
            ("Planned value",
             "The budgeted cost of the work SCHEDULED by now."),
            ("Earned value",
             "The budgeted cost of the work PERFORMED -- progress expressed "
             "in money."),
            ("Actual cost",
             "What was really spent to reach the current point."),
            ("Schedule variance",
             "EV - PV. Negative means less work done than planned."),
            ("Cost variance",
             "EV - AC. Negative means the work done cost more than "
             "budgeted."),
            ("Performance indices",
             "SPI = EV / PV and CPI = EV / AC. Below 1 is unfavourable, and "
             "both support forecasting."),
            ("Estimate at completion",
             "Most simply the budget divided by CPI, assuming performance "
             "continues as it has."),
        ],
        "Cost management estimates from the WBS, aggregates into a budget "
        "spread over time, and controls spending against it -- and its "
        "central insight is that spending figures say NOTHING about progress. "
        "An underspend is equally the signature of efficiency and of being "
        "behind schedule, and no comparison of planned against actual cost "
        "distinguishes them. EARNED VALUE supplies the missing number by "
        "expressing completed work in money: a package budgeted at ten "
        "thousand and finished has earned ten thousand whatever it cost. From "
        "the three measures both variances follow, each subtracting FROM "
        "earned value -- schedule variance EV minus PV, cost variance EV "
        "minus AC, negative unfavourable in both -- along with the indices "
        "that support forecasting an estimate at completion. Alongside this "
        "sit the cost types, of which SUNK cost carries the decision "
        "consequence: money already spent cannot be recovered by continuing, "
        "so it is irrelevant to whether the project should, however strongly "
        "it argues otherwise. Two reserves cover two kinds of uncertainty -- "
        "contingency for analysed risks, inside the baseline and spent by the "
        "project; management reserve for the unforeseen, outside it and "
        "released above. And a forecast exists to trigger a decision while "
        "options remain, so revising an unwelcome one defers the same "
        "decision to a worse moment.",
        exam_notes=[
            desc(
                "This lesson supplies calculation items and one recurring "
                "reasoning trap about spending figures."
            ),
            ul([
                "Calculating schedule and cost variance from PV, EV and AC.",
                "Interpreting SPI and CPI.",
                "Explaining why an underspend is not good news by itself.",
                "Distinguishing contingency from management reserve.",
                "Applying sunk cost reasoning to a continue-or-stop "
                "decision.",
                "Forecasting an estimate at completion.",
                "Classifying a cost.",
            ]),
            desc(
                "Whenever an item gives spending figures without earned "
                "value, the answer is that no conclusion about performance "
                "follows. That is the single most reliable pattern in this "
                "lesson, and the distractors are always the two opposite "
                "conclusions the figure cannot support."
            ),
        ],
    ))

LESSONS = [LESSON_PM_TIME, LESSON_PM_COST]

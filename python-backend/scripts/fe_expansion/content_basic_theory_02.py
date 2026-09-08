"""Basic Theory -> Basic Theory, lesson 2 of 5: Applied mathematics.

Covers syllabus minor category 2 in full: probability and statistics, numeric
calculation, numerical analysis, formula manipulation, graph theory, queueing
theory and optimisation problems.

The through-line is that all of it is applied. Probability is here because
reliability calculations need it; statistics because performance measurements
need it; queueing theory because capacity planning is the single most common
place an engineer's intuition is wrong; graph theory because routing, PERT
and dependency analysis are the same problem three times. Each topic is
taught from the engineering question it answers rather than from its
mathematics, because that is how the examination frames it.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Basic Theory"
MIDDLE = "Basic Theory"

_sections = [
    ("Why an Engineer Needs This Mathematics", [
        desc(
            "Nothing in this lesson is here for its own sake. Each topic "
            "earns its place by answering a question that comes up while "
            "building or running a system, and the examination asks it in "
            "exactly that framing -- as a system with numbers attached, not "
            "as an equation to solve."
        ),
        compare_grid(
            "THE ENGINEERING QUESTION BEHIND EACH TOPIC",
            "Read the right-hand side first. The mathematics is the tool; the "
            "question is the reason it is on the syllabus.",
            [("Probability",
              "What is the chance this redundant pair both fail? Reliability "
              "and availability figures are probabilities combined."),
             ("Statistics",
              "This service responded in 40ms on average -- is that good? "
              "Summarising a measurement without misleading yourself."),
             ("Queueing theory",
              "The server is at 90% utilisation. How long is the queue? The "
              "answer is far worse than intuition suggests."),
             ("Graph theory",
              "Which path is shortest, and which task delays the project if "
              "it slips? Routing and scheduling are one problem.")]),
        desc(
            "No calculator is permitted, so every quantity in an examination "
            "item is chosen to work out cleanly. If your arithmetic is "
            "producing something ugly, you have almost certainly picked the "
            "wrong formula rather than made a slip -- which is a useful "
            "signal, and it is deliberate on the examiner's part."
        ),
    ]),

    ("Counting Before Probability", [
        desc(
            "Most probability questions are counting questions wearing a "
            "disguise. The probability of an event, when every outcome is "
            "equally likely, is the number of favourable outcomes divided by "
            "the total number of outcomes -- so the work is in the two "
            "counts, not in the division."
        ),
        content_tabs(
            "THE THREE COUNTING TOOLS",
            "Choosing between them turns on one question: does order matter, "
            "and may items repeat?",
            [("Factorial", "n! -- arranging everything",
              "The number of ways to arrange n distinct items in order is "
              "n factorial: n x (n-1) x ... x 1. Five servers can be placed "
              "in a rack in 5! = 120 orders. By convention 0! = 1, which is "
              "not a trick -- there is exactly one way to arrange nothing."),
             ("Permutation", "nPr -- ordered selection",
              "Choosing r items from n where the ORDER matters: "
              "nPr = n! / (n-r)!. Picking a primary and a secondary from five "
              "servers gives 5P2 = 5 x 4 = 20, because primary A with "
              "secondary B differs from the reverse."),
             ("Combination", "nCr -- unordered selection",
              "Choosing r from n where order does NOT matter: "
              "nCr = n! / (r! x (n-r)!). Picking any two of five servers for "
              "a cluster gives 5C2 = 10 -- exactly half of 20, because each "
              "pair was counted in both orders. The extra r! in the "
              "denominator is that correction.")]),
        desc(
            "The test to apply under time pressure: if swapping two chosen "
            "items produces a different outcome, it is a permutation; if it "
            "produces the same outcome, it is a combination. Reaching for a "
            "permutation where a combination was meant overcounts by exactly "
            "r factorial, which is why wrong answers to these items are so "
            "often a neat multiple of the right one."
        ),
    ]),

    ("The Two Rules of Probability", [
        desc(
            "Every probability calculation on this examination is built from "
            "two rules, plus the corrections that stop them double-counting."
        ),
        table(
            ["Rule", "When it applies", "Formula", "Worked value"],
            [["Addition", "P of A or B", "P(A) + P(B) - P(A and B)",
              "0.5 + 0.4 - 0.2 = 0.7"],
             ["Addition, exclusive", "A and B cannot both occur",
              "P(A) + P(B)", "0.5 + 0.4 = 0.9"],
             ["Multiplication", "P of A and B", "P(A) x P(B given A)",
              "0.5 x 0.6 = 0.3"],
             ["Multiplication, independent", "A tells you nothing about B",
              "P(A) x P(B)", "0.5 x 0.4 = 0.2"]],
            caption="Or means add, and means multiply. The corrections are "
                    "what the examination is actually testing.",
            footer="Subtracting the joint probability from the addition rule "
                   "is the same double-count correction as "
                   "inclusion-exclusion on sets."),
        desc(
            "The addition theorem handles OR. The probability of A or B is "
            "P(A) + P(B) - P(A and B): the joint case has been counted in "
            "both terms, so it is subtracted once. This is the "
            "inclusion-exclusion principle from the previous lesson in "
            "probability clothing. When A and B are mutually exclusive their "
            "joint probability is zero and the correction vanishes, which is "
            "why the simple form is only valid for exclusive events."
        ),
        desc(
            "The multiplication theorem handles AND. The probability of A and "
            "B is P(A) x P(B given A). When the events are independent -- "
            "when A occurring tells you nothing about B -- the conditional "
            "collapses to P(B) and the rule becomes a plain product."
        ),
        desc(
            "Independence is where examination items lay their trap, and it "
            "is a genuine engineering trap too. Two disks in a mirror fail "
            "independently only if nothing can take both out at once; a "
            "shared power supply, a shared controller, or a manufacturing "
            "batch defect makes the failures correlated, and the true "
            "probability of a double failure is then far higher than the "
            "product of the individual ones."
        ),
    ]),

    ("Complement: The Shortcut Worth Reaching For", [
        desc(
            "The probability of an event not happening is 1 minus the "
            "probability that it does. Trivial to state and constantly "
            "decisive, because 'at least one' problems are almost always "
            "easier to solve backwards."
        ),
        ol([
            "A component has a 1% chance of failing during a run. What is the "
            "probability that at least one of four independent components "
            "fails?",
            "Counting forwards means summing the cases for exactly one, "
            "exactly two, exactly three and exactly four failures.",
            "Counting backwards, the only excluded case is that none fails, "
            "which has probability 0.99 to the fourth power.",
            "0.99^4 is about 0.961, so the answer is about 3.9%.",
        ]),
        desc(
            "The engineering reading of that number matters more than the "
            "arithmetic: four components each 99% reliable give a system that "
            "is only about 96% reliable. Reliability degrades as components "
            "are added in series, which is the whole argument for redundancy "
            "and the calculation behind the System Component lesson's "
            "availability figures."
        ),
    ]),

    ("Distributions the Syllabus Names", [
        desc(
            "A distribution describes how likely each outcome is across the "
            "whole range of them. Three are named in the syllabus, and they "
            "are related more closely than their names suggest."
        ),
        image(fig("distributions")),
        desc(
            "The NORMAL distribution is the symmetric bell curve that "
            "measurement error and natural variation tend towards. Its shape "
            "is fixed by two numbers, the mean and the standard deviation, "
            "and the useful facts to carry are that roughly 68% of values lie "
            "within one standard deviation of the mean and roughly 95% within "
            "two."
        ),
        desc(
            "The POISSON distribution counts events in a fixed interval: "
            "requests arriving at a server in a second, defects found per "
            "module, faults per kilometre of cable. It is discrete, and its "
            "mean and variance are equal -- an identity worth knowing because "
            "it lets an examination item give you one and expect the other."
        ),
        desc(
            "The EXPONENTIAL distribution describes the waiting time until "
            "the next event, and it is the natural partner of the Poisson: if "
            "arrivals are Poisson, the gaps between them are exponential. Its "
            "defining property is memorylessness -- having already waited ten "
            "minutes does not make the next arrival any sooner. That is a "
            "genuinely counter-intuitive statement, and it is the assumption "
            "under the queueing model later in this lesson."
        ),
    ]),

    ("Describing Measured Data", [
        desc(
            "Statistics answers two separate questions about a set of "
            "measurements: where is the centre, and how spread out is it? "
            "Reporting one without the other is how performance figures "
            "mislead."
        ),
        table(
            ["Measure", "What it reports", "Moved by outliers?", "Use when"],
            [["Mean", "The arithmetic average", "Yes, strongly",
              "The data is roughly symmetric"],
             ["Median", "The middle value once sorted", "No",
              "The data is skewed"],
             ["Mode", "The most frequent value", "No",
              "The data is categorical"],
             ["Variance", "The mean squared deviation", "Yes",
              "Comparing spread numerically"],
             ["Standard deviation", "The square root of the variance", "Yes",
              "You need spread in the data's own units"]],
            caption="Centre and spread are two separate questions about the "
                    "same data.",
            footer="Response times are skewed by a long tail, which is why "
                   "service levels quote a median or a percentile and never "
                   "a mean."),
        desc(
            "The MEAN is the arithmetic average, and it moves with every "
            "outlier. The MEDIAN is the middle value once the data is sorted, "
            "and a single enormous value barely shifts it. The MODE is the "
            "most frequent value, and it is the only one of the three that "
            "works on categorical data such as error codes."
        ),
        desc(
            "Which to use is decided by the shape of the data. Response times "
            "have a long right tail -- most requests are fast and a few are "
            "very slow -- so the mean sits above the typical experience and "
            "flatters nobody. This is precisely why service level agreements "
            "are written against a median or a 95th percentile rather than an "
            "average, and it is a favourite examination scenario."
        ),
        desc(
            "For spread, VARIANCE is the mean of the squared deviations from "
            "the mean, and STANDARD DEVIATION is its square root. The squaring "
            "is what stops positive and negative deviations cancelling; the "
            "square root is what returns the figure to the units of the "
            "original data, which is why standard deviation is the one "
            "quoted."
        ),
    ]),

    ("Correlation and Regression", [
        desc(
            "A correlation coefficient measures how tightly two variables "
            "move together, on a scale from -1 to +1. At +1 they rise "
            "together perfectly, at -1 one falls exactly as the other rises, "
            "and at 0 there is no linear relationship at all."
        ),
        desc(
            "A regression line is the straight line fitted through the "
            "points, used to predict one variable from the other. Correlation "
            "says how well the line describes the data; regression is the "
            "line itself."
        ),
        content_accordion(
            "THE THREE MISREADINGS TO AVOID",
            "Each of these is examined, usually as a scenario where the "
            "conclusion drawn is the wrong one.",
            [("Correlation is not causation",
              "Two variables can move together because one causes the other, "
              "because both are caused by a third, or by coincidence in a "
              "small sample. Deployment frequency and incident count may "
              "correlate because both rise with team size, and changing "
              "either directly would then achieve nothing."),
             ("A coefficient near zero does not mean unrelated",
              "It means no LINEAR relationship. A strong curved relationship "
              "-- response time against load, which is flat then explodes -- "
              "can produce a correlation close to zero while being entirely "
              "predictable. Plot the data before trusting the number."),
             ("Extrapolating beyond the data",
              "A regression line fitted over 100 to 500 concurrent users says "
              "nothing reliable about 5,000. The relationship that held in "
              "the measured range need not continue, and in capacity work it "
              "almost never does -- something saturates.")]),
    ]),

    ("Numerical Calculation and Its Errors", [
        desc(
            "Numerical methods find approximate answers to problems that "
            "have no convenient exact solution, and their central concern is "
            "how wrong the approximation is."
        ),
        table(
            ["Error", "Definition", "Example"],
            [["Absolute error", "Approximation minus the true value",
              "3.14 for pi is out by 0.0016"],
             ["Relative error", "Absolute error divided by the true value",
              "0.0016 / 3.1416 is about 0.05%"],
             ["Rounding error", "Introduced by finite precision",
              "Storing one third as 0.3333"],
             ["Truncation error", "From stopping an infinite process early",
              "Cutting a series off after five terms"]],
            caption="Absolute error carries units; relative error does not.",
            footer="Relative error is the one that matters when magnitudes "
                   "vary: an absolute error of one millimetre is negligible "
                   "on a bridge and fatal on a chip mask."),
        desc(
            "ABSOLUTE ERROR is the difference between the approximation and "
            "the true value, expressed in the same units as the quantity. "
            "RELATIVE ERROR is that difference divided by the true value, "
            "expressed as a proportion or percentage. The distinction is not "
            "pedantic: an absolute error of one millimetre is irrelevant on a "
            "bridge span and catastrophic on a semiconductor mask, and only "
            "the relative error tells you which situation you are in."
        ),
        desc(
            "ROUNDING ERROR arises from finite precision, as the previous "
            "lesson established. TRUNCATION ERROR arises from stopping an "
            "infinite process early -- cutting a series off after five terms, "
            "or halting an iteration once it looks close enough. The two have "
            "different cures: rounding error is reduced by a wider type, "
            "truncation error by more iterations, and confusing them wastes "
            "effort on the wrong one."
        ),
    ]),

    ("Iterative Methods", [
        desc(
            "The syllabus names two ways of closing in on a root, and both "
            "follow the same pattern: guess, measure the error, improve the "
            "guess, repeat until the change is small enough."
        ),
        content_tabs(
            "TWO WAYS TO FIND A ROOT",
            "The trade between them is the classic one in numerical work: "
            "guaranteed but slow, against fast but conditional.",
            [("Bisection", "Halve the interval each step",
              "Start with two points where the function has opposite signs, "
              "so a root lies between them. Evaluate the midpoint, keep "
              "whichever half still brackets the root, and repeat. Each step "
              "halves the uncertainty, so convergence is slow but absolutely "
              "guaranteed -- it cannot fail or diverge."),
             ("Newton's method", "Follow the tangent to the axis",
              "From a guess, follow the tangent line at that point down to "
              "where it crosses the axis, and use that as the next guess. "
              "Convergence is far faster than bisection when it works, "
              "roughly doubling the correct digits each step. But it needs "
              "the derivative, and a poor starting guess or a near-flat "
              "tangent can send it far away or into an endless cycle."),
             ("Interpolation", "Estimate between known points",
              "Rather than finding a root, estimate a value between two "
              "measured points -- linearly, by drawing a straight line "
              "between them, or with a curve through several. Used wherever "
              "a table gives values at intervals and one is needed in "
              "between.")]),
        desc(
            "Formula manipulation is the counterpart the syllabus mentions "
            "alongside these: rather than computing a number, a computer "
            "algebra system manipulates the symbols themselves, performing "
            "factorisation, differentiation and integration exactly. The "
            "distinction to hold is numeric versus symbolic -- one produces "
            "0.7071, the other produces the square root of two over two."
        ),
    ]),

    ("Graph Theory", [
        desc(
            "A graph is a set of vertices joined by edges. That definition is "
            "almost content-free, which is exactly why graphs turn up "
            "everywhere: any relationship between things is a graph, and the "
            "same algorithms then solve problems that look unrelated."
        ),
        image(fig("graph-basics")),
        desc(
            "The distinction that matters most is direction. In an UNDIRECTED "
            "graph an edge joins two vertices symmetrically, which models a "
            "network cable or a mutual relationship. In a DIRECTED graph the "
            "edge is an arc pointing one way, which models a dependency, a "
            "one-way link, or a state transition. A task that must finish "
            "before another can start is a directed edge, and a cycle in such "
            "a graph is a circular dependency -- a scheduling impossibility "
            "the examination will ask you to spot."
        ),
        desc(
            "Weights turn a graph into a map. Once each edge carries a "
            "distance, a latency or a cost, the shortest-path problem becomes "
            "meaningful, and it is the same problem a routing protocol solves "
            "for packets and a project manager solves for a schedule."
        ),
        desc(
            "Two representations are examined. An ADJACENCY MATRIX is an "
            "n-by-n table where the cell at row i, column j records the edge "
            "from i to j; it answers 'is there an edge between these two?' "
            "instantly but always occupies n-squared space. An ADJACENCY LIST "
            "stores, for each vertex, the list of its neighbours; it is far "
            "smaller when the graph is sparse, which real networks almost "
            "always are, but answering the same question means scanning a "
            "list."
        ),
    ]),

    ("Queueing Theory", [
        desc(
            "Queueing theory answers the question that capacity planning "
            "keeps getting wrong: given a rate of arrivals and a rate of "
            "service, how long do things wait? The examination uses the "
            "simplest model, M/M/1, and the arithmetic is small enough to do "
            "by hand."
        ),
        media_text(
            fig("queueing-model"),
            "THE M/M/1 MODEL",
            "The name encodes the assumptions: Markovian (random, "
            "exponentially distributed) arrivals, Markovian service times, "
            "and one server.",
            "Utilisation is the whole story",
            "Write the mean arrival rate as lambda and the mean service rate "
            "as mu. Utilisation, written rho, is lambda divided by mu -- the "
            "fraction of time the server is busy. If rho is 1 or more, "
            "arrivals come at least as fast as they can be served and the "
            "queue grows without limit, so every useful formula assumes rho "
            "is below 1."),
        desc(
            "The mean number of jobs waiting in the queue is rho / (1 - rho), "
            "and the mean number in the system, including the one being "
            "served, is one more than that. The shape of that expression is "
            "the entire lesson: as rho approaches 1, the denominator "
            "approaches zero and the queue length approaches infinity."
        ),
        table(
            ["Utilisation", "Jobs waiting", "Jobs in the system",
             "Wait against service time"],
            [["50%", "0.5", "1.0", "1x"],
             ["80%", "3.2", "4.0", "4x"],
             ["90%", "8.1", "9.0", "9x"],
             ["95%", "18.1", "19.0", "19x"]],
            caption="M/M/1 response time rises without bound as utilisation "
                    "approaches 1.",
            footer="This is the arithmetic behind capacity planning. A server "
                   "held at 95% is not efficient; it is one arrival away from "
                   "a queue nobody will wait through."),
        desc(
            "Read the figure carefully, because it contradicts intuition. "
            "Going from 50% to 80% utilisation adds three jobs to the queue. "
            "Going from 80% to 90% -- a smaller increase in load -- adds five "
            "more. Going from 90% to 95% adds ten. A server run at 95% is not "
            "efficiently loaded; it is one arrival away from a queue nobody "
            "will wait through."
        ),
        desc(
            "This is why capacity is planned to a target utilisation well "
            "below saturation, why an autoscaling threshold of 90% CPU is too "
            "late, and why adding a second server helps far more than "
            "doubling the speed of the first. It also explains a phenomenon "
            "every operator has seen: a system that is fine at 70% load and "
            "unusable at 85%, with nothing having changed but the traffic."
        ),
    ]),

    ("Optimisation Problems", [
        desc(
            "An optimisation problem asks for the best choice subject to "
            "constraints. The syllabus names four approaches, and each "
            "matches a recognisable shape of question."
        ),
        content_accordion(
            "FOUR NAMED APPROACHES",
            "The examination usually gives a scenario and asks which "
            "technique applies, so learn them by the shape of the problem "
            "rather than by the method.",
            [("Linear programming",
              "Maximise or minimise a linear quantity -- profit, cost, "
              "throughput -- subject to linear constraints such as limited "
              "materials, hours or capacity. With two variables it can be "
              "solved graphically: the constraints bound a region, and the "
              "optimum always sits at one of its corners."),
             ("Shortest path",
              "Find the cheapest route through a weighted graph. Solved by "
              "Dijkstra's algorithm when weights are non-negative. The same "
              "machinery routes packets, plans deliveries and finds the "
              "cheapest sequence of operations."),
             ("PERT and the critical path",
              "Given tasks with durations and dependencies, find the longest "
              "path through the network -- which is the shortest possible "
              "project duration, and the set of tasks where any slip delays "
              "the whole project. Covered in full in Project Time "
              "Management."),
             ("Dynamic programming",
              "For problems that decompose into overlapping sub-problems, "
              "solve each sub-problem once and store the result rather than "
              "recomputing it. The knapsack problem and the shortest path in "
              "a layered network are the standard examples; the trade is "
              "memory for time.")]),
    ]),

    ("Common Mistakes", [
        desc(
            "The errors below account for most of the marks lost on this "
            "material, and every one of them is a misreading rather than a "
            "miscalculation."
        ),
        ul([
            "Using a permutation where order does not matter. The answer "
            "comes out r! times too large.",
            "Applying the simple addition rule to events that can co-occur, "
            "which double-counts the overlap.",
            "Assuming independence when a shared cause exists. Two mirrored "
            "disks on one controller do not fail independently.",
            "Quoting a mean for skewed data such as response times, where the "
            "median describes the typical case and the mean does not.",
            "Reading a near-zero correlation as 'no relationship' when the "
            "relationship is curved.",
            "Treating 90% utilisation as comfortable. The queue at 90% is "
            "nine jobs deep, and at 95% it is nineteen.",
            "Confusing rounding error with truncation error, and so applying "
            "the wrong remedy.",
            "Extrapolating a regression line beyond the range of the data it "
            "was fitted to.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"Requests arrive at a single-server system at a mean rate of 8 "
            "per second, and the server processes a request in a mean time of "
            "0.1 seconds. What is the mean number of requests waiting in the "
            "queue?\""
        ),
        ol([
            "Extract the rates. Arrivals lambda = 8 per second. Service time "
            "is 0.1 seconds, so the service RATE mu is 1 / 0.1 = 10 per "
            "second. Converting the time into a rate is the step most "
            "candidates skip.",
            "Compute utilisation: rho = lambda / mu = 8 / 10 = 0.8.",
            "Sanity check that rho is below 1. It is, so the queue is stable "
            "and the formula applies.",
            "Apply the queue-length formula: rho / (1 - rho) = 0.8 / 0.2 = 4.",
            "Answer: four requests waiting on average, with a fifth in "
            "service.",
        ]),
        desc(
            "Note the two places the item is testing comprehension rather "
            "than arithmetic. It gives a service TIME where the formula needs "
            "a RATE, and it asks for the number WAITING rather than the "
            "number in the system -- so 5 will be among the options, and so "
            "will 0.8. Reading the question is worth more marks here than "
            "the division is."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc(
            "This lesson supplies the arithmetic that several later ones "
            "assume you already have."
        ),
        ul([
            "System evaluation indexes compute availability and MTBF, which "
            "are the probability rules applied to component failure.",
            "Queueing theory is the model behind performance testing, "
            "capacity planning and autoscaling thresholds.",
            "Graph theory reappears as routing algorithms in Network, as "
            "the critical path in Project Time Management, and as the "
            "dependency graph in Configuration Management.",
            "Statistics underpins the quality control charts of Project "
            "Quality Management and the sampling in System Audit.",
            "Optimisation reappears as linear programming in Operations "
            "Research and as scheduling in Project Time Management.",
            "Numerical error is the applied face of the precision effects the "
            "previous lesson introduced.",
        ]),
    ]),

    ("Recall Check", [
        desc(
            "Work each one before turning it over. These are the facts the "
            "examination expects instantly."
        ),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects you to produce without "
            "rederiving them.",
            [("Choosing r of n, order irrelevant",
              "nCr = n! / (r! (n-r)!)",
              "If order matters it is nPr = n! / (n-r)!, which is r! times "
              "larger. Swapping two chosen items is the test: different "
              "outcome means permutation."),
             ("P(A or B)",
              "P(A) + P(B) - P(A and B)",
              "The joint term is subtracted because it was counted in both. "
              "It vanishes only when the events are mutually exclusive."),
             ("Probability of at least one",
              "1 - P(none)",
              "Almost always faster than summing the cases. Four components "
              "at 99% give 1 - 0.99^4, about 3.9% chance of at least one "
              "failure."),
             ("Utilisation in M/M/1",
              "rho = lambda / mu",
              "Arrival rate over service rate. If the question gives a "
              "service TIME, invert it first -- that is the step most "
              "candidates miss."),
             ("Mean queue length",
              "rho / (1 - rho)",
              "At 80% utilisation, 4 jobs. At 90%, 9. At 95%, 19. The "
              "denominator approaching zero is why the last few percent of "
              "capacity costs so much."),
             ("Median over mean",
              "When the data is skewed",
              "Response times have a long right tail, so the mean sits above "
              "the typical experience. Service levels quote medians and "
              "percentiles for exactly this reason.")]),
    ]),
]

_exam_notes = [
    desc(
        "Applied mathematics is reliably present on Subject A, and the items "
        "are formulaic once the right formula is identified -- which is what "
        "they are really testing."
    ),
    ul([
        "Permutation and combination counts, usually embedded in a scenario "
        "about arrangements or selections.",
        "The addition and multiplication rules, with independence or "
        "exclusivity as the hidden condition.",
        "An 'at least one' probability, solvable through the complement.",
        "Mean, median and standard deviation from a small data set, or a "
        "judgement about which is appropriate.",
        "An M/M/1 utilisation or queue-length calculation, frequently with "
        "the service rate given as a time.",
        "Identifying which optimisation technique fits a described problem.",
        "Absolute against relative error, or rounding against truncation.",
    ]),
    desc(
        "Every quantity is chosen to divide cleanly without a calculator. "
        "Ugly arithmetic is a signal that the wrong formula has been picked, "
        "so stop and re-read rather than pressing on."
    ),
]

_key_terms = [
    ("Permutation",
     "An ordered selection of r items from n, counted as n! / (n-r)!. "
     "Swapping two chosen items gives a different permutation."),
    ("Combination",
     "An unordered selection of r items from n, counted as "
     "n! / (r! (n-r)!). It is the permutation count divided by r!, "
     "correcting for the orderings that are the same selection."),
    ("Addition theorem",
     "P(A or B) = P(A) + P(B) - P(A and B). The joint term corrects the "
     "double count and is zero only for mutually exclusive events."),
    ("Multiplication theorem",
     "P(A and B) = P(A) x P(B given A), which reduces to a plain product "
     "when the events are independent."),
    ("Independence",
     "The property that one event's occurrence gives no information about "
     "another's. Assumed far more often than it holds: a shared power "
     "supply or controller correlates failures that look independent."),
    ("Normal distribution",
     "The symmetric bell curve described by a mean and a standard "
     "deviation, with about 68% of values within one standard deviation and "
     "95% within two."),
    ("Poisson distribution",
     "A discrete distribution counting events in a fixed interval, whose "
     "mean and variance are equal. Models arrivals and defect counts."),
    ("Exponential distribution",
     "A continuous distribution of waiting times between Poisson events. "
     "Memoryless: time already waited does not shorten the remaining wait."),
    ("Mean, median, mode",
     "Three measures of centre. The mean is the average and moves with "
     "outliers; the median is the middle value and resists them; the mode is "
     "the most frequent value and works on categorical data."),
    ("Variance and standard deviation",
     "Measures of spread. Variance is the mean squared deviation from the "
     "mean; standard deviation is its square root, returning the figure to "
     "the data's own units."),
    ("Correlation coefficient",
     "A value from -1 to +1 measuring how tightly two variables move "
     "together LINEARLY. Near zero rules out a straight-line relationship, "
     "not any relationship, and never implies causation."),
    ("Regression line",
     "The straight line fitted through a set of points, used to predict one "
     "variable from another. Reliable only within the range of the data it "
     "was fitted to."),
    ("Absolute and relative error",
     "The difference between an approximation and the true value, and that "
     "difference expressed as a proportion of the true value. Relative error "
     "is the meaningful one when magnitudes vary."),
    ("Truncation error",
     "The error introduced by stopping an infinite process early -- cutting "
     "a series short or halting an iteration. Cured by more iterations, not "
     "by more precision."),
    ("Bisection method",
     "Root-finding by repeatedly halving an interval known to bracket a "
     "root. Slow but guaranteed to converge."),
    ("Newton's method",
     "Root-finding by following the tangent to the axis. Much faster than "
     "bisection when it converges, but needs the derivative and can diverge "
     "from a poor starting point."),
    ("M/M/1 model",
     "A queueing model with random arrivals, random service times and one "
     "server. Utilisation rho = lambda / mu, and the mean queue length is "
     "rho / (1 - rho)."),
    ("Utilisation (rho)",
     "The fraction of time a server is busy, arrival rate divided by "
     "service rate. At or above 1 the queue grows without limit."),
    ("Linear programming",
     "Optimising a linear objective subject to linear constraints. With two "
     "variables the optimum lies at a corner of the feasible region."),
    ("Dynamic programming",
     "Solving a problem by solving each overlapping sub-problem once and "
     "storing the result, trading memory for time."),
]

_summary = (
    "Probability questions are usually counting questions: decide whether "
    "order matters, then use a permutation or a combination, and remember "
    "that the two differ by exactly r factorial. Or means add, with the "
    "joint case subtracted to stop it being counted twice; and means "
    "multiply, with the second probability conditional unless the events are "
    "genuinely independent -- an assumption that shared hardware quietly "
    "breaks. 'At least one' is nearly always fastest through the complement. "
    "Statistics asks two separate questions, where the centre is and how "
    "wide the spread is, and skewed data such as response times needs a "
    "median rather than a mean, which is why service levels are written "
    "against percentiles. Correlation measures only linear association and "
    "never establishes cause. Numerical methods trade guaranteed slow "
    "convergence, as in bisection, against fast conditional convergence, as "
    "in Newton's method, and their errors divide into rounding, cured by "
    "precision, and truncation, cured by more iterations. Graphs model any "
    "relationship, and direction, weight and the choice between an adjacency "
    "matrix and an adjacency list are what the examination asks about them. "
    "Queueing theory carries the lesson's most useful single result: with "
    "utilisation rho, the mean queue is rho / (1 - rho), so 80% utilisation "
    "queues four jobs, 90% queues nine and 95% queues nineteen -- the "
    "response time explodes long before the server is full, which is the "
    "arithmetic behind every capacity plan worth having."
)

_quiz = [
    mcq("EASY",
        "A team must choose three of its eight members to attend a review. "
        "The three attend in the same capacity, so the order of selection "
        "carries no meaning.\n\n"
        "How many different groups are possible?",
        [("24", False),
         ("56", True),
         ("336", False),
         ("512", False)],
        "Order does not matter, so this is a combination: 8C3 = "
        "(8 x 7 x 6) / (3 x 2 x 1) = 336 / 6 = 56. The value 336 is 8P3, the "
        "permutation count, which is six times too large because it counts "
        "each group once for every ordering of its three members. 24 is 8 x 3 "
        "and 512 is 8 cubed, neither of which corresponds to a selection."),

    mcq("EASY",
        "Two events have probabilities P(A) = 0.5 and P(B) = 0.3, and they "
        "cannot both occur.\n\n"
        "What is the probability that at least one of them occurs?",
        [("0.15", False),
         ("0.65", False),
         ("0.35", False),
         ("0.8", True)],
        "Mutually exclusive events have a joint probability of zero, so the "
        "addition theorem's correction term vanishes and P(A or B) is simply "
        "0.5 + 0.3 = 0.8. The value 0.15 is the product, which would answer "
        "'both occur' and is impossible here anyway. 0.65 subtracts a "
        "correction that does not apply, and 0.35 has no interpretation in "
        "this scenario."),

    mcq("AVERAGE",
        "Four independent components each have a 2% probability of failing "
        "during a mission.\n\n"
        "What is the approximate probability that at least one fails?",
        [("Approximately 7.8%", True),
         ("Approximately 0.5%", False),
         ("Exactly 8%", False),
         ("Approximately 92%", False)],
        "Work through the complement: the probability that none fails is "
        "0.98^4, which is about 0.922, so at least one fails with probability "
        "about 0.078, or 7.8%. Answering exactly 8% comes from adding the four "
        "individual probabilities, which double-counts the cases where more "
        "than one fails and is therefore always slightly too high. 92% is the "
        "complement itself -- the probability that none fails."),

    mcq("AVERAGE",
        "Response times for a web service are measured over a day. Most "
        "requests complete quickly, but a small number take many seconds, "
        "producing a long right tail.\n\n"
        "Which measure best describes the experience of a typical user?",
        [("The mean, since it uses every measurement", False),
         ("The variance, since it captures the spread", False),
         ("The median, since it is not distorted by the slow tail", True),
         ("The mode, since it is the most frequent value", False)],
        "A long right tail pulls the mean above the typical case, so a mean "
        "response time can exceed what most users actually experience. The "
        "median is the middle value once sorted, and a handful of very slow "
        "requests barely move it -- which is exactly why service level "
        "agreements are written against medians and percentiles. Variance "
        "describes spread rather than a typical value, and the mode of a "
        "continuous measurement is rarely meaningful."),

    mcq("AVERAGE",
        "Jobs arrive at a single-server system at a mean rate of 6 per "
        "second. The server takes a mean of 0.125 seconds per job.\n\n"
        "What is the server's utilisation?",
        [("0.048", False),
         ("0.75", True),
         ("1.33", False),
         ("0.125", False)],
        "The service RATE is the reciprocal of the service time: 1 / 0.125 = "
        "8 jobs per second. Utilisation is then lambda / mu = 6 / 8 = 0.75. "
        "The value 1.33 comes from dividing the rates the wrong way round, "
        "and would imply an unstable queue; 0.048 comes from multiplying the "
        "arrival rate by the service time incorrectly scaled; and 0.125 is "
        "simply the service time restated."),

    mcq("HARD",
        "An operations team reports that a server currently sits at 90% "
        "utilisation and proposes leaving it, since 10% of capacity remains "
        "free.\n\n"
        "Using the M/M/1 model, what is the mean number of jobs waiting in "
        "the queue?",
        [("0.9", False),
         ("1.1", False),
         ("10", False),
         ("9", True)],
        "The mean queue length is rho / (1 - rho) = 0.9 / 0.1 = 9, with a "
        "tenth job in service. The proposal misreads spare capacity as spare "
        "headroom: raising utilisation to 95% would take the queue to 19, "
        "because the denominator is approaching zero. Answering 0.9 or 1.1 "
        "confuses utilisation itself with a count, and 10 is the number in "
        "the system rather than the number waiting."),

    mcq("HARD",
        "A regression line fitted to measurements taken between 100 and 500 "
        "concurrent users predicts a response time of 180ms at 5,000 users. "
        "The correlation coefficient over the measured range is 0.97.\n\n"
        "What is the principal problem with this prediction?",
        [("A correlation of 0.97 is too weak to support any prediction.",
          False),
         ("The prediction extrapolates far outside the range the line was "
          "fitted to.", True),
         ("Correlation cannot be used for prediction, only regression can.",
          False),
         ("The correlation should have been computed after the prediction "
          "was made.", False)],
        "A regression line describes the relationship only within the range "
        "of data it was fitted to. At ten times the highest measured load "
        "something will saturate -- a connection pool, a thread limit, memory "
        "-- and the relationship will change shape, so the strong fit over "
        "100 to 500 users says nothing about 5,000. A correlation of 0.97 is "
        "in fact very strong, and regression is indeed the predictive tool "
        "here; the flaw is the range, not the technique."),

    mcq("AVERAGE",
        "Two disks are configured as a mirrored pair. Each has a 1% "
        "probability of failing in a given year, and an engineer calculates "
        "the probability of losing both as 0.01 x 0.01 = 0.0001.\n\n"
        "Which assumption most threatens this calculation?",
        [("That the failure probabilities are equal for both disks", False),
         ("That a year is the appropriate measurement period", False),
         ("That the two failures are independent events", True),
         ("That the multiplication theorem applies to probabilities", False)],
        "Multiplying the probabilities is valid only if the two failures are "
        "independent, and mirrored disks frequently are not: a shared "
        "controller, a shared power supply, a common firmware defect or "
        "disks from the same manufacturing batch all create a cause that can "
        "take out both at once. The real probability of a double failure is "
        "then substantially higher than 0.0001. Equal probabilities are not "
        "required by the theorem, the period is a modelling choice, and the "
        "multiplication theorem itself is entirely sound."),

    mcq("HARD",
        "A calculation approximates the value 250 as 249.5.\n\n"
        "What are the absolute and relative errors?",
        [("Absolute 0.5 and relative 0.5%", False),
         ("Absolute 0.2% and relative 0.5", False),
         ("Absolute 0.5 and relative 0.2%", True),
         ("Absolute 249.5 and relative 0.5", False)],
        "Absolute error is the plain difference, 250 - 249.5 = 0.5, carrying "
        "the same units as the quantity. Relative error divides that by the "
        "true value: 0.5 / 250 = 0.002, which is 0.2%. Reporting 0.5% "
        "mistakenly divides by 100 rather than by 250. The two are never "
        "interchangeable -- absolute error has units and relative error does "
        "not, which is why only the relative figure is comparable across "
        "quantities of different magnitude."),

    mcq("AVERAGE",
        "Tasks in a project are modelled as vertices, with an arc from each "
        "task to the tasks that cannot begin until it finishes.\n\n"
        "What does a cycle in this graph indicate?",
        [("The project contains repeated work that should be factored out.",
          False),
         ("A set of tasks each waiting on another, so no valid schedule "
          "exists.", True),
         ("The critical path passes through every task in the cycle.", False),
         ("The graph should be redrawn as undirected to remove the cycle.",
          False)],
        "In a directed dependency graph an arc means 'must finish before', so "
        "a cycle asserts that each task in it must finish before itself -- a "
        "circular dependency, which no ordering can satisfy. The schedule is "
        "impossible until a dependency is removed or relaxed. Redrawing the "
        "graph as undirected would discard the very information that makes "
        "the contradiction visible, and the critical path is defined only on "
        "a graph with no cycles."),
]

LESSON_APPLIED_MATHS = lesson(
    MAJOR, MIDDLE,
    "Applied Mathematics: Probability, Statistics and Optimisation",
    _quiz,
    lesson_structure(
        "Applied Mathematics: Probability, Statistics and Optimisation",
        "This lesson covers the mathematics an engineer actually uses to "
        "reason about a system: probability for reliability, statistics for "
        "measurement, queueing theory for capacity, graph theory for routing "
        "and scheduling, and numerical methods for problems with no tidy "
        "answer. Each topic is introduced through the engineering question it "
        "settles, because that is how the examination frames it -- and one "
        "result in particular, the way a queue explodes as utilisation "
        "approaches full, contradicts intuition so sharply that it is worth "
        "the lesson on its own.",
        [
            "Choose correctly between permutations and combinations, and "
            "compute each",
            "Apply the addition and multiplication theorems, including the "
            "complement shortcut for 'at least one'",
            "Distinguish the normal, Poisson and exponential distributions "
            "and say which models a given situation",
            "Select and compute an appropriate measure of centre and spread "
            "for a given data set",
            "Compute utilisation and mean queue length in the M/M/1 model and "
            "interpret the result for capacity planning",
            "Read a directed, undirected or weighted graph and choose between "
            "matrix and list representations",
            "Distinguish absolute from relative error and rounding from "
            "truncation error",
            "Identify which optimisation technique suits a described problem",
        ],
        70,
        _sections,
        _key_terms,
        _summary,
        exam_notes=_exam_notes,
    ))

LESSONS = [LESSON_APPLIED_MATHS]

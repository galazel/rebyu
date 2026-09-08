"""Corporate and Legal Affairs -> Corporate Activities, lessons 1 and 2.

Management and organisation theory, and operations research and industrial
engineering.

These lessons are the certification's answer to a question engineers ask
implicitly: why is the organisation shaped the way it is, and how are
decisions made numerically rather than by whoever argues hardest.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Corporate and Legal Affairs"
MIDDLE = "Corporate Activities"


# ==========================================================================
# Lesson 1: Management and organisation theory
# ==========================================================================

_mgmt_sections = [
    ("Why an Engineer Studies Organisation", [
        desc(
            "Systems are built inside organisations, and the shape of the "
            "organisation determines who can decide what, how long a "
            "decision takes, and which problems nobody owns. The syllabus "
            "treats this as engineering context rather than management "
            "theory for its own sake."
        ),
        image(fig("org-structures")),
        table(
            ["Organisational fact", "What it does to a project"],
            [["Who holds budget authority",
              "Determines how long an approval takes, and from whom"],
             ["Whether functions or divisions dominate",
              "Determines whether a cross-cutting project has an owner"],
             ["How many levels there are",
              "Determines how far a decision travels before it is made"],
             ["Whether reporting lines are single or dual",
              "Determines who resolves a conflict of priorities"],
             ["What the organisation measures people on",
              "Determines what they will actually do"]],
            caption="Five structural facts and their project consequences.",
            footer="The last row overrides every other. People do what they "
                   "are measured on, so a structure that measures functions "
                   "on their own efficiency will produce functions "
                   "optimising themselves at a project's expense, whatever "
                   "the organisation chart implies."),
    ]),

    ("Functional Organisation", [
        desc(
            "The oldest arrangement groups people by the work they do, and "
            "most organisations start here."
        ),
        ul([
            "Engineers sit with engineers, accountants with accountants, and "
            "each group has a head.",
            "Skill deepens, since people work alongside others doing the "
            "same thing.",
            "Career paths are clear, since progression is within a "
            "discipline.",
            "Anything requiring several functions has to cross boundaries, "
            "and nobody below the top owns it.",
            "Each function is measured on its own performance, which is not "
            "the same as the organisation's.",
        ]),
        desc(
            "The fourth point is what makes this structure awkward for "
            "projects. A system touching sales, operations and finance has "
            "no single owner beneath the level where all three report, so "
            "decisions travel a long way to be made."
        ),
    ]),

    ("Divisional Organisation", [
        desc(
            "Larger organisations frequently group by what they sell, where "
            "they sell it, or whom they sell it to."
        ),
        compare_grid(
            "FUNCTIONAL AGAINST DIVISIONAL",
            "Grouped by discipline, or grouped by result.",
            [("Functional",
              ["Deep skill, shared across everything",
               "One of each function, so no duplication",
               "Cross-function work has no owner",
               "Suits a narrow range of products"]),
             ("Divisional",
              ["Each division owns its own result",
               "Decisions made close to the market",
               "Every function duplicated in every division",
               "Skill fragments, and practice diverges"])]),
        desc(
            "The duplication is the price and it is deliberate. A division "
            "with its own finance and its own engineering can act without "
            "waiting for anybody, and the organisation pays for several "
            "smaller functions rather than one large one."
        ),
    ]),

    ("Matrix Organisation", [
        desc(
            "A matrix attempts both at once, and the difficulty it creates "
            "is structural rather than accidental."
        ),
        ol([
            "Each person belongs to a function, which develops them and "
            "holds their discipline.",
            "Each person is also assigned to projects, which direct their "
            "work.",
            "They therefore have two managers wanting different things from "
            "the same hours.",
            "Somebody above both must resolve the conflicts, and the matrix "
            "works only if that person actually does.",
            "Where nobody resolves them, the conflict is pushed down to the "
            "individual, who cannot resolve it.",
        ]),
        desc(
            "The last step is the common failure. A matrix without an "
            "explicit route for settling priority conflicts leaves the least "
            "powerful person deciding which manager to disappoint, weekly, "
            "which is neither their job nor sustainable."
        ),
    ]),

    ("Other Structures the Syllabus Names", [
        desc(
            "Several further arrangements appear in exam items and are "
            "distinguished by what they are for."
        ),
        content_accordion(
            "ORGANISATIONAL FORMS",
            "Each solves a specific problem and creates another.",
            [("Project organisation",
              "People are assigned wholly to a project and report to its "
              "manager. Focus is complete and skill development suffers, "
              "since nobody is developing the discipline. Suited to large, "
              "long projects."),
             ("Company within a company",
              "A unit given its own authority and its own results, in order "
              "to move faster than the parent. It duplicates what the "
              "parent already has, deliberately."),
             ("Network organisation",
              "A small core that coordinates work performed by others. It "
              "is flexible, and depends entirely on the relationships and "
              "contracts holding it together."),
             ("Flat organisation",
              "Few levels, so decisions travel a short distance. It relies "
              "on people coordinating without being told to, and does not "
              "scale indefinitely."),
             ("Committee or cross-functional team",
              "Representatives of several functions decide together. It "
              "produces agreement across boundaries and is slower than any "
              "one person deciding.")]),
    ]),

    ("What Managers Actually Do", [
        desc(
            "The classical account divides management into functions, and "
            "the syllabus expects them by name."
        ),
        table(
            ["Function", "Consists of"],
            [["Planning", "Deciding what will be done, and by when"],
             ["Organising", "Arranging people and resources to do it"],
             ["Staffing", "Getting the right people, and developing them"],
             ["Directing", "Guiding the work as it happens"],
             ["Controlling",
              "Comparing what happened against the plan, and acting on the "
              "difference"]],
            caption="Five classical management functions.",
            footer="CONTROLLING is the one engineers recognise: it is a "
                   "feedback loop. Measure, compare against intended, act on "
                   "the difference -- and a plan with no measurement against "
                   "it is not being managed, merely announced."),
    ]),

    ("The Management Cycle", [
        desc(
            "Improvement in this syllabus is almost always described as a "
            "repeating cycle rather than a project."
        ),
        ol([
            "PLAN -- decide what to do and what result is expected.",
            "DO -- carry it out, generally on a small scale first.",
            "CHECK -- measure what actually happened against what was "
            "expected.",
            "ACT -- adopt it, adjust it, or abandon it, and begin again.",
            "Repeat, since the point is accumulation rather than a single "
            "pass.",
        ]),
        desc(
            "CHECK is the step that is skipped, and skipping it removes the "
            "cycle's entire value. Without measuring the result, an "
            "organisation cannot distinguish a change that worked from one "
            "that was merely made, and it repeats both."
        ),
    ]),

    ("Motivation Theories", [
        desc(
            "The syllabus names several accounts of why people work, and "
            "items ask which one a described situation illustrates."
        ),
        content_tabs(
            "THEORIES OF MOTIVATION",
            "Each tab is a named theory and what distinguishes it.",
            [("Hierarchy of needs", "Needs in order",
              "Physiological, safety, belonging, esteem and "
              "self-actualisation, with lower needs said to dominate until "
              "they are met. Its use here is the ordering rather than its "
              "empirical standing."),
             ("Two-factor theory", "Satisfaction and dissatisfaction differ",
              "Hygiene factors -- pay, conditions, security -- cause "
              "dissatisfaction when absent and do not motivate when "
              "present. Motivators are achievement, recognition and "
              "responsibility. Fixing hygiene removes complaints without "
              "producing enthusiasm."),
             ("Theory X and Theory Y", "Assumptions about people",
              "Theory X assumes people avoid work and must be directed; "
              "Theory Y assumes they will take responsibility given the "
              "conditions. The assumption tends to produce the behaviour it "
              "expects."),
             ("Expectancy", "People act on expected outcomes",
              "Effort is applied where somebody believes it will produce "
              "performance, that performance will produce a reward, and "
              "that the reward is worth having. Any of the three failing "
              "removes the motivation."),
             ("Goal setting", "Specific goals outperform vague ones",
              "A defined, difficult and accepted goal produces more than "
              "an instruction to do one's best -- which is why 'improve "
              "quality' achieves less than a measurable target.")]),
    ]),

    ("Leadership Styles", [
        desc(
            "How decisions are taken within a team is described by a small "
            "vocabulary the syllabus uses directly."
        ),
        ul([
            "Directive -- the leader decides and instructs, which is fast "
            "and depends on the leader being right.",
            "Consultative -- the leader gathers views and then decides, "
            "which is slower and better informed.",
            "Participative -- the group decides together, which produces "
            "commitment and takes time.",
            "Delegative -- the leader hands the decision over, which "
            "develops people and requires them to be capable of it.",
            "Situational -- the style is chosen to suit the task and the "
            "team's readiness, rather than being fixed.",
        ]),
        desc(
            "The last point is the one items test. No style is correct in "
            "general: an emergency requires direction, a decision needing "
            "commitment requires participation, and applying either "
            "everywhere produces predictable failures."
        ),
    ]),

    ("Corporate Governance", [
        desc(
            "Governance is the arrangement by which an organisation is "
            "directed and held to account, and it reaches IT directly."
        ),
        ul([
            "It separates those who direct from those who manage, so the "
            "second can be held to account by the first.",
            "It requires reporting that is accurate and timely enough to be "
            "acted on.",
            "It requires internal controls that work, and evidence that "
            "they work.",
            "It assigns responsibility explicitly, so that a failure has an "
            "owner.",
            "It is enforced externally, by law and by auditors, rather than "
            "left to preference.",
        ]),
        desc(
            "Internal controls are where governance meets systems. A control "
            "requiring two people to approve a payment is implemented in "
            "software, and whether it can be circumvented is a technical "
            "question with a legal consequence."
        ),
    ]),

    ("Compliance and Internal Control", [
        desc(
            "The syllabus expects the mechanism by which an organisation "
            "assures itself that its rules are actually followed."
        ),
        table(
            ["Control type", "Acts", "Example"],
            [["Preventive", "Before", "A limit that cannot be exceeded"],
             ["Detective", "After",
              "A reconciliation that finds a discrepancy"],
             ["Corrective", "After",
              "A process that puts right what was found"],
             ["Directive", "Before",
              "A policy telling people what to do"],
             ["Compensating", "Alongside",
              "Something else, where the intended control is not "
              "practicable"]],
            caption="Five control types by when they act.",
            footer="PREVENTIVE controls are stronger than directive ones for "
                   "the same reason a system-enforced limit beats a written "
                   "one: the first cannot be exceeded, and the second can be "
                   "by anybody willing to."),
    ]),

    ("Segregation of Duties", [
        desc(
            "The single control that appears most often in exam items "
            "separates the parts of a transaction between people."
        ),
        ol([
            "Whoever requests something does not approve it.",
            "Whoever approves does not execute it.",
            "Whoever executes does not record it.",
            "Whoever records does not reconcile it.",
            "Where one person must hold two of these, something else "
            "compensates -- review, or logging examined by somebody else.",
        ]),
        desc(
            "The purpose is that fraud requires collusion rather than one "
            "person's decision. Small organisations cannot separate all four, "
            "which is exactly when compensating controls stop being optional."
        ),
    ]),

    ("Risk Management as Management Practice", [
        desc(
            "Organisations manage risk the same way projects do, and the "
            "vocabulary is shared."
        ),
        ul([
            "Identify what could go wrong, systematically rather than when "
            "somebody remembers.",
            "Assess each by likelihood and by consequence, since neither "
            "alone ranks anything.",
            "Decide a response: avoid, reduce, transfer, or accept.",
            "Assign an owner, since a risk belonging to everybody belongs to "
            "nobody.",
            "Review, since both likelihood and consequence change.",
        ]),
        desc(
            "ACCEPT is a legitimate response and is frequently mistaken for "
            "negligence. A risk consciously accepted, recorded and owned is "
            "managed; the same risk unrecorded is merely unnoticed, and the "
            "difference appears when it occurs."
        ),
    ]),

    ("Human Resource Development", [
        desc(
            "Developing people is treated as a management responsibility "
            "rather than an individual's own affair."
        ),
        ul([
            "Establish what skills the organisation needs, which follows "
            "from where it is going.",
            "Establish what it has, which requires actually assessing rather "
            "than assuming.",
            "Close the gap by developing people, recruiting, or engaging "
            "others.",
            "Support learning on the job, which is where most capability is "
            "actually built.",
            "Retain people, since developing somebody who then leaves has "
            "trained a competitor.",
        ]),
        desc(
            "The fourth point is worth stating plainly. Formal training "
            "supplies vocabulary and structure; capability comes from doing "
            "the work with somebody more experienced nearby, which is an "
            "arrangement rather than a course."
        ),
    ]),

    ("Performance Measurement", [
        desc(
            "What an organisation measures determines what it gets, which "
            "makes choosing measures a serious act."
        ),
        table(
            ["Measure chosen", "Behaviour it produces"],
            [["Lines of code written",
              "More code, which is the opposite of the aim"],
             ["Defects found by testers",
              "Testers rewarded for defects developers were rewarded for "
              "avoiding"],
             ["Tickets closed",
              "Quick closures, and reopened tickets"],
             ["Utilisation of staff time",
              "Everybody busy, on whatever is available"],
             ["Delivered outcomes agreed in advance",
              "Work on what was agreed to matter"]],
            caption="Five measures and the behaviour each produces.",
            footer="A measure that becomes a target stops measuring what it "
                   "measured, because people optimise it directly. This is "
                   "why the last row is the only one that survives being "
                   "used as a target."),
    ]),

    ("The Balanced View", [
        desc(
            "Financial results alone describe the past, so the syllabus "
            "expects measurement across several perspectives."
        ),
        ul([
            "Financial -- what the results were.",
            "Customer -- how those the organisation serves see it.",
            "Internal process -- whether the work itself is being done "
            "well.",
            "Learning and growth -- whether capability is increasing.",
            "The last three are leading, and the first is lagging.",
        ]),
        desc(
            "That distinction is the point of the whole arrangement. "
            "Financial results report what already happened and cannot be "
            "changed; the other three are the things that will produce next "
            "year's financial results and can still be acted on."
        ),
    ]),

    ("Decision Making in Organisations", [
        desc(
            "How a decision is reached affects both its quality and whether "
            "it is carried out."
        ),
        compare_grid(
            "DECIDING QUICKLY AGAINST DECIDING TOGETHER",
            "Speed against commitment.",
            [("One person decides",
              ["Fast, and consistent",
               "Limited to what that person knows",
               "Others may not carry it out willingly",
               "Suits urgency and reversible choices"]),
             ("The group decides",
              ["Slow, sometimes very",
               "Draws on what everybody knows",
               "Those who decided will implement it",
               "Suits choices that are hard to reverse"])]),
        desc(
            "The practical rule the syllabus implies is to match the method "
            "to the decision. A reversible choice decided slowly has wasted "
            "the difference; an irreversible one decided alone has bought "
            "speed with exactly the wrong currency."
        ),
    ]),

    ("Communication in Organisations", [
        desc(
            "Information moves through an organisation in defined directions "
            "and is degraded differently in each."
        ),
        ul([
            "Downward -- instructions and context, which lose detail at each "
            "level.",
            "Upward -- reporting, which loses bad news at each level.",
            "Lateral -- between functions, which is where most real "
            "coordination happens and which no chart shows.",
            "External -- with customers, suppliers and regulators, which "
            "carries obligations.",
            "Informal -- fast, unrecorded, and frequently more accurate than "
            "the official channel.",
        ]),
        desc(
            "The upward loss is the one with consequences. Each level has "
            "some reason to soften what it passes up, so a problem visible on "
            "the ground can arrive at the top as a minor note -- which is why "
            "structures that shorten that path are valued."
        ),
    ]),

    ("Organisational Change", [
        desc(
            "Introducing a system is introducing a change, and the syllabus "
            "treats resistance as predictable rather than unreasonable."
        ),
        ol([
            "Establish why the change is needed, in terms the people "
            "affected recognise.",
            "Involve them in how it is done, since being done to produces "
            "resistance that being part of does not.",
            "Provide the capability the new way requires, rather than "
            "assuming it.",
            "Change what people are measured on at the same time, or the old "
            "behaviour will continue correctly.",
            "Sustain it, since a change that is not reinforced reverts.",
        ]),
        desc(
            "Step four is the one that quietly defeats system "
            "implementations. If the measures still reward the old process, "
            "people continue it, and they are behaving rationally within the "
            "organisation they are actually in."
        ),
    ]),

    ("Corporate Social Responsibility", [
        desc(
            "Organisations are held to account for effects beyond their "
            "financial results, and parts of this are now legal rather than "
            "voluntary."
        ),
        ul([
            "Environmental effect, which is increasingly reported under "
            "obligation.",
            "Working conditions, including throughout the supply chain.",
            "Honest dealing with customers, which overlaps consumer law.",
            "Contribution to the communities the organisation operates in.",
            "Transparency about all of it, since claims without evidence are "
            "themselves a risk.",
        ]),
        desc(
            "For engineers, the supply chain point reaches practice directly. "
            "An organisation is answerable for conditions at its suppliers, "
            "which means knowing who they are -- a data and traceability "
            "problem before it is an ethical one."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc(
            "Organisation theory is the background against which several "
            "other categories make sense."
        ),
        content_tabs(
            "WHERE THIS APPEARS ELSEWHERE",
            "Each tab is a category this lesson underpins.",
            [("Project management", "Authority and structure",
              "Whether a project manager can direct people at all depends on "
              "the structure. Functional, matrix and project organisations "
              "give the same role entirely different authority."),
             ("Service management", "Controls and accountability",
              "Change management, segregation of duties and audit trails are "
              "internal controls in the governance sense, implemented as "
              "service processes."),
             ("System strategy", "Alignment",
              "Aligning IT with the business is a governance question about "
              "who decides what, before it is a technical one."),
             ("Business strategy", "Structure follows strategy",
              "How an organisation is arranged is chosen to suit what it is "
              "trying to do, which is why a change of strategy is usually "
              "followed by a reorganisation."),
             ("Security", "Segregation and least privilege",
              "Separating request, approval, execution and recording is the "
              "same principle as least privilege, expressed in an "
              "organisational rather than a technical vocabulary.")]),
    ]),

    ("Common Mistakes", [
        desc("Where organisation theory items are lost."),
        review_cards(
            "MISTAKES THAT COST MARKS HERE",
            "Each is a plausible answer that is wrong.",
            [("Treating the matrix's dual reporting as an accident",
              "It is the design. The question is whether conflicts are "
              "resolved above the individual or pushed down to them.",
              "Items describe a person caught between two managers."),
             ("Assuming hygiene factors motivate",
              "Pay and conditions remove dissatisfaction when adequate; "
              "achievement, recognition and responsibility motivate.",
              "An item describing a pay rise that changed nothing is testing "
              "this."),
             ("Treating accepting a risk as failing to manage it",
              "An accepted, recorded and owned risk is managed. Only an "
              "unrecorded one is unmanaged.",
              "Look for whether it was a decision or an omission."),
             ("Confusing directive controls with preventive ones",
              "A policy tells people what to do; a preventive control makes "
              "the alternative impossible.",
              "The distinction is whether it can be ignored."),
             ("Forgetting to change the measures when changing the process",
              "People follow what they are measured on, so old measures "
              "sustain the old behaviour perfectly rationally.",
              "This is the most common cause of a correct system being used "
              "wrongly.")]),
    ]),

    ("Review", [
        desc("The points items are built on."),
        review_cards(
            "WHAT TO CARRY OUT OF THIS LESSON",
            "Answer each before moving on.",
            [("What does a divisional structure buy, and pay?",
              "Ownership of a result and decisions near the market, paid for "
              "by duplicating every function.",
              "Functional structures reverse both."),
             ("What is the matrix's structural difficulty?",
              "Two managers wanting the same hours, which must be resolved "
              "above the individual.",
              "Where it is not, the least powerful person decides."),
             ("Which management function is a feedback loop?",
              "Controlling -- measure, compare against plan, act on the "
              "difference.",
              "A plan never measured against is not being managed."),
             ("What do hygiene factors do?",
              "Remove dissatisfaction when adequate, without motivating.",
              "Motivators are achievement, recognition, responsibility."),
             ("What does segregation of duties achieve?",
              "It makes fraud require collusion rather than one person's "
              "decision.",
              "Request, approve, execute, record -- separated."),
             ("Why change the measures when changing the process?",
              "Because people follow the measures, and old ones sustain the "
              "old behaviour.",
              "This defeats more implementations than any technical "
              "fault.")]),
    ]),
]


_mgmt_quiz = [
    mcq("AVERAGE",
        "An organisation groups people by discipline, and a project touching "
        "three functions keeps stalling.\n\nWhat explains it structurally?",
        [("No single owner exists below the level where all three "
          "report", True),
         ("The functions lack the specialist skills that the project "
          "actually requires from them", False),
         ("Project management methods have not been adopted formally "
          "anywhere within the organisation", False),
         ("The functions are competing with each other for the same "
          "limited budget allocation", False)],
        "A functional structure gives every discipline an owner and gives "
        "cross-function work none, so each decision travels up to the level "
        "where all the affected functions report before it can be made. This "
        "is exactly the problem matrix and project structures were devised "
        "to address, each at its own cost."),

    mcq("AVERAGE",
        "Divisional structures duplicate finance, engineering and other "
        "functions in each division.\n\nWhat is bought with that cost?",
        [("Each division can decide without waiting for anybody", True),
         ("Deeper specialist skill, because practitioners are grouped with "
          "others in the same discipline", False),
         ("Lower total cost, because smaller functions are considerably "
          "more efficient than large ones", False),
         ("Consistency of practice, because each division follows the same "
          "established procedures", False)],
        "Ownership of a result and speed of decision are what the duplication "
        "buys. The other options describe what a functional structure "
        "provides and a divisional one gives up: skill fragments across "
        "divisions and practice diverges, which is the recognised price."),

    mcq("HARD",
        "In a matrix organisation, an engineer is repeatedly asked for the "
        "same hours by a function head and a project manager.\n\nWhat has "
        "gone wrong?",
        [("Nobody above them is resolving the conflict", True),
         ("The matrix structure is inherently unworkable and should be "
          "replaced with something simpler", False),
         ("The engineer has been assigned to too many projects at the same "
          "time by the function head", False),
         ("The project manager lacks the formal authority to make requests "
          "of functional staff at all", False)],
        "Dual reporting is the matrix's design rather than its failure, and "
        "it works only where somebody with authority over both settles "
        "competing priorities. Where that does not happen, the conflict "
        "falls to the person least able to resolve it, who must choose which "
        "manager to disappoint."),

    mcq("AVERAGE",
        "Which management function corresponds to a feedback loop?",
        [("Controlling", True),
         ("Planning, because it establishes the expected result in advance "
          "of the work", False),
         ("Directing, because it guides the work continuously while it is "
          "being performed", False),
         ("Organising, because it arranges resources in response to what is "
          "required", False)],
        "Controlling measures what happened, compares it against what was "
        "intended, and acts on the difference -- which is a feedback loop in "
        "the engineering sense. Planning supplies the reference value the "
        "comparison is made against, but performs no measurement itself."),

    mcq("HARD",
        "Staff receive a substantial pay rise, and enthusiasm for the work "
        "is unchanged.\n\nWhich account explains this?",
        [("Pay is a hygiene factor and does not motivate", True),
         ("The rise was insufficient to overcome the dissatisfaction that "
          "had already accumulated", False),
         ("Financial rewards motivate only where they are linked "
          "explicitly to individual performance", False),
         ("Motivation depends on the timing of a reward rather than on its "
          "magnitude at all", False)],
        "Two-factor theory separates the causes of dissatisfaction from the "
        "causes of motivation. Pay, conditions and security produce "
        "dissatisfaction when inadequate and produce no enthusiasm when put "
        "right; achievement, recognition and responsibility are what "
        "motivate, and no amount of the first supplies the second."),

    mcq("AVERAGE",
        "A control requires two people to approve any payment above a "
        "threshold, enforced by the system.\n\nHow is it "
        "classified?",
        [("Preventive", True),
         ("Detective, because it identifies payments that exceed the "
          "threshold as they are being made", False),
         ("Corrective, because it puts right an approval that should not "
          "have been given alone", False),
         ("Compensating, because it substitutes for a separation that "
          "cannot otherwise be achieved", False)],
        "It acts before the event and makes the unwanted outcome impossible "
        "rather than visible, which is what preventive means. A "
        "reconciliation finding an improper payment afterwards would be "
        "detective, and a policy instructing people to seek two approvals "
        "would be directive."),

    mcq("HARD",
        "A risk is assessed, consciously accepted, recorded and given an "
        "owner.\n\nHas it been managed?",
        [("Yes -- acceptance is a legitimate response", True),
         ("No, because a risk that has not been reduced remains an "
          "exposure to the organisation", False),
         ("No, because acceptance is permissible only for risks with a "
          "negligible consequence", False),
         ("Only if the acceptance is reviewed by somebody outside the team "
          "that proposed it", False)],
        "Avoid, reduce, transfer and accept are the four responses, and "
        "acceptance is a decision rather than an omission. What "
        "distinguishes a managed accepted risk from an unmanaged one is "
        "precisely that it was assessed, recorded, owned and will be "
        "reviewed as circumstances change."),

    mcq("AVERAGE",
        "Support staff are measured on tickets closed per day, and reopened "
        "tickets rise sharply.\n\nWhat does this illustrate?",
        [("A measure used as a target stops measuring what it "
          "measured", True),
         ("The staff concerned require further training in diagnosing "
          "problems properly before closing them", False),
         ("The ticketing system permits closure without any verification "
          "that the issue was resolved", False),
         ("Volume of incoming work exceeded what the team was staffed to "
          "handle in the period", False)],
        "People optimise directly whatever they are judged on, so a count of "
        "closures produces closures rather than resolutions. The other "
        "options may all be true and none of them explains why the behaviour "
        "changed when the measure was introduced."),

    mcq("AVERAGE",
        "Which perspectives in a balanced set of measures are leading rather "
        "than lagging?",
        [("Customer, internal process, and learning and growth", True),
         ("Financial, because results determine what the organisation is "
          "able to invest next", False),
         ("Internal process alone, because it is the only one the "
          "organisation directly controls", False),
         ("Learning and growth alone, because capability precedes every "
          "other kind of result", False)],
        "Financial results report what has already happened and cannot be "
        "changed. The other three describe conditions that will produce "
        "future financial results and can still be acted on, which is the "
        "whole reason for measuring across perspectives rather than on "
        "money alone."),

    mcq("HARD",
        "A new process is introduced, training is given, and staff continue "
        "the old way.\n\nWhat is the most likely cause?",
        [("They are still measured on what the old process "
          "produced", True),
         ("The training provided was insufficient to establish confidence "
          "in the new way of working", False),
         ("The new process is slower in practice than the process it was "
          "intended to replace", False),
         ("Insufficient time has passed for a change of this magnitude to "
          "become established", False),
         ],
        "Measures determine behaviour more reliably than instructions do. "
        "Where the reward still follows the old process, continuing it is "
        "rational within the organisation people are actually in, and no "
        "amount of training changes that -- which is why the measures are "
        "changed at the same time as the process."),
]


LESSON_MGMT = lesson(
    MAJOR, MIDDLE,
    "Management and Organisation Theory",
    _mgmt_quiz,
    lesson_structure(
        "Management and Organisation Theory",
        "Systems are built inside organisations, and the organisation's "
        "shape decides who can settle what. FUNCTIONAL structures deepen "
        "skill and leave cross-function work without an owner; DIVISIONAL "
        "ones buy ownership and speed by duplicating every function; a "
        "MATRIX attempts both and gives people two managers, which works "
        "only where somebody above them resolves the conflict. This lesson "
        "also covers the management functions with CONTROLLING as a feedback "
        "loop, the motivation theories items name directly, governance and "
        "internal control including segregation of duties, and the "
        "measurement problem that defeats more implementations than any "
        "technical fault.",
        [
            "Distinguish functional, divisional and matrix structures",
            "Explain the matrix's structural difficulty",
            "Name the classical management functions",
            "Explain controlling as a feedback loop",
            "Distinguish hygiene factors from motivators",
            "Classify internal controls by when they act",
            "Explain what segregation of duties achieves",
            "Explain why measures must change with a process",
        ],
        75,
        _mgmt_sections,
        [
            ("Functional structure",
             "Deep skill and clear paths; cross-function work has no owner "
             "below the top."),
            ("Divisional structure",
             "Ownership of a result and local decisions, paid for by "
             "duplicating every function."),
            ("Matrix",
             "Two managers by design; it works only where conflicts are "
             "resolved above the individual."),
            ("Controlling",
             "Measure, compare against plan, act on the difference -- a "
             "feedback loop."),
            ("Hygiene against motivators",
             "Pay and conditions remove dissatisfaction; achievement, "
             "recognition and responsibility motivate."),
            ("Preventive against directive controls",
             "One makes the alternative impossible; the other instructs, and "
             "can be ignored."),
            ("Segregation of duties",
             "Request, approve, execute, record -- separated, so fraud "
             "requires collusion."),
            ("Measures drive behaviour",
             "A measure used as a target stops measuring; old measures "
             "sustain old processes."),
        ],
        "An organisation's shape determines who may decide what, and every "
        "structure trades the same things. FUNCTIONAL grouping deepens skill "
        "and leaves anything crossing functions without an owner below the "
        "level where they all report. DIVISIONAL grouping gives each unit "
        "its own result and its own decisions, paid for by duplicating every "
        "function and fragmenting skill. A MATRIX attempts both and gives "
        "each person two managers wanting the same hours, which is its "
        "design rather than its fault -- and it fails wherever nobody above "
        "the individual settles the conflict. Of the classical management "
        "functions, CONTROLLING is the feedback loop: measure, compare "
        "against intended, act on the difference. Motivation divides between "
        "HYGIENE factors, which remove dissatisfaction without motivating, "
        "and MOTIVATORS. Governance reaches systems through internal "
        "controls, where PREVENTIVE beats DIRECTIVE because the first cannot "
        "be ignored, and through SEGREGATION OF DUTIES, which makes fraud "
        "require collusion. And measures drive behaviour more reliably than "
        "instructions: a measure used as a target stops measuring what it "
        "measured, and a process changed without changing its measures will "
        "not actually change.",
        exam_notes=[
            desc(
                "Items describe an organisational situation and ask which "
                "structure or principle explains it."
            ),
            ul([
                "Diagnosing a stalled cross-function project.",
                "Stating what divisional duplication buys.",
                "Locating the failure in a matrix conflict.",
                "Identifying controlling as the feedback loop.",
                "Explaining a pay rise that changed nothing.",
                "Classifying a system-enforced approval limit.",
                "Recognising an accepted risk as managed.",
                "Explaining behaviour produced by a measure.",
            ]),
            desc(
                "For any item here, ask what the person described is "
                "measured on and who can settle their conflicts. Most "
                "answers in this area follow from those two facts rather "
                "than from anything on the organisation chart."
            ),
        ],
    ))


# ==========================================================================
# Lesson 2: Operations research and industrial engineering
# ==========================================================================

_or_sections = [
    ("Deciding With Numbers", [
        desc(
            "Operations research is the practice of representing a decision "
            "as a model and solving it, rather than settling it by argument. "
            "The syllabus expects the named techniques and, more "
            "importantly, what each is for."
        ),
        image(fig("or-techniques")),
        table(
            ["Technique", "Answers"],
            [["Linear programming",
              "How to allocate limited resources for the best result"],
             ["Queueing theory",
              "How long people or work will wait, given arrivals and service"],
             ["Inventory models",
              "How much to hold and when to reorder"],
             ["Scheduling and critical path",
              "What determines the finish date"],
             ["Decision analysis",
              "Which choice is best when outcomes are uncertain"]],
            caption="Five families of technique and their questions.",
            footer="Each answers its question exactly as well as its "
                   "assumptions hold. The mathematics is rarely the weak "
                   "part of an analysis; the numbers and assumptions fed "
                   "into it usually are."),
    ]),

    ("Linear Programming", [
        desc(
            "The most widely used technique allocates limited resources "
            "among competing uses."
        ),
        ol([
            "State an objective as a quantity to be maximised or minimised "
            "-- profit, cost, time.",
            "State the decision variables: what quantities are actually "
            "being chosen.",
            "State the constraints: the limits that cannot be exceeded.",
            "Solve, which for a linear model has established and efficient "
            "methods.",
            "Examine which constraints are BINDING, since those are the ones "
            "limiting the result.",
        ]),
        desc(
            "Step five is where the practical value sits and it is routinely "
            "skipped. Knowing which constraint is binding tells the "
            "organisation exactly what to relax to improve the outcome, "
            "which is more useful than the optimal answer itself."
        ),
    ]),

    ("What a Model Assumes", [
        desc(
            "Every technique here rests on assumptions, and items test "
            "whether they are recognised."
        ),
        ul([
            "Linearity -- doubling the input doubles the effect, which "
            "reality frequently declines to do.",
            "Certainty -- the coefficients are known exactly, which they "
            "generally are not.",
            "Divisibility -- fractional answers are meaningful, which they "
            "are not when the answer is a number of machines.",
            "Independence -- the variables do not interact except as "
            "modelled.",
            "Stability -- the situation does not change while the analysis "
            "is being carried out.",
        ]),
        desc(
            "Divisibility is the assumption that produces visibly wrong "
            "answers. An allocation calling for 2.7 machines must be solved "
            "as an integer problem, which is a genuinely harder computation "
            "and not a matter of rounding the answer."
        ),
    ]),

    ("Queueing", [
        desc(
            "Waiting is a system property rather than a service failure, and "
            "the syllabus expects the relationship that governs it."
        ),
        table(
            ["Quantity", "What it is"],
            [["Arrival rate", "How often work arrives"],
             ["Service rate", "How fast one server handles it"],
             ["Utilisation", "Arrival rate divided by service capacity"],
             ["Queue length", "How much is waiting"],
             ["Waiting time", "How long each item waits before service"]],
            caption="Five quantities in a queueing model.",
            footer="Waiting time rises without limit as utilisation "
                   "approaches one. This is why a system run at ninety "
                   "percent utilisation has far worse than ten percent more "
                   "delay than one run at fifty, and why capacity planning "
                   "never targets full utilisation."),
    ]),

    ("Why Full Utilisation Is a Mistake", [
        desc(
            "The most useful result in this whole area is that queues grow "
            "non-linearly as a system fills."
        ),
        ul([
            "At low utilisation, arriving work generally finds a free "
            "server.",
            "As utilisation rises, arrivals increasingly find the server "
            "busy.",
            "The queue lengthens far faster than utilisation rises, not in "
            "proportion to it.",
            "Variability makes this worse, since irregular arrivals produce "
            "queues even below capacity.",
            "Some spare capacity is therefore not waste; it is what keeps "
            "waiting times finite.",
        ]),
        desc(
            "This applies to processors, networks, help desks and factory "
            "machines identically. It is also why an organisation measuring "
            "staff utilisation and pushing it towards one hundred percent "
            "will find everything taking longer."
        ),
    ]),

    ("Inventory Models", [
        desc(
            "Holding stock costs money and running out costs more, so the "
            "question is where between them to sit."
        ),
        compare_grid(
            "HOLDING MORE AGAINST HOLDING LESS",
            "Two costs pulling in opposite directions.",
            [("Holding more",
              ["Capital tied up in stock",
               "Storage, insurance and handling",
               "Risk of obsolescence and spoilage",
               "Rarely runs out"]),
             ("Holding less",
              ["Little capital tied up",
               "Frequent ordering, and its overhead",
               "Vulnerable to any supply interruption",
               "Stockouts, and what they cost"])]),
        desc(
            "The economic order quantity is the point where ordering cost "
            "and holding cost together are least. Its usefulness is the "
            "shape rather than the number: the total cost curve is flat near "
            "the optimum, so being somewhat wrong costs very little."
        ),
    ]),

    ("Reorder Point and Safety Stock", [
        desc(
            "How much to order is one question; when to order is a separate "
            "one with a different answer."
        ),
        ol([
            "Establish the lead time -- how long between ordering and "
            "receiving.",
            "Establish the demand during that lead time.",
            "Set the reorder point at that demand, so stock arrives as the "
            "last is used.",
            "Add SAFETY STOCK to cover variation in demand and in lead "
            "time.",
            "Set the safety stock from the service level wanted, since "
            "covering every case requires unlimited stock.",
        ]),
        desc(
            "Step five contains the real decision. Safety stock is bought "
            "protection, and the cost of covering the last few percent of "
            "cases rises steeply -- so the question is which stockout "
            "probability the organisation is willing to accept."
        ),
    ]),

    ("Forecasting", [
        desc(
            "Almost every technique in this area needs a forecast, and the "
            "forecast is usually the weakest element."
        ),
        ul([
            "A moving average smooths noise and lags any genuine change.",
            "Exponential smoothing weights recent observations more, and how "
            "much is a choice somebody makes.",
            "Trend and seasonal components are separated where they exist, "
            "since treating a season as a trend misleads badly.",
            "Every forecast has error, and stating the error is part of "
            "stating the forecast.",
            "A forecast without an accuracy history cannot be relied on, "
            "because nobody knows how wrong it usually is.",
        ]),
        desc(
            "The last point is the practical discipline. Recording what was "
            "forecast against what occurred turns forecasting into something "
            "that improves, and its absence is why forecasts are trusted "
            "exactly as much as whoever produced them."
        ),
    ]),

    ("Scheduling and the Critical Path", [
        desc(
            "Determining when work will finish is the technique this "
            "certification uses most, and it appears in project management "
            "as well."
        ),
        ul([
            "Break work into activities with durations and dependencies.",
            "The CRITICAL PATH is the longest chain of dependent activities, "
            "and it sets the finish date.",
            "Activities off the path have FLOAT -- they can slip without "
            "affecting the end.",
            "Shortening the project means shortening the critical path, and "
            "nothing else.",
            "Shortening it may move the critical path to a different chain, "
            "which must then be recalculated.",
        ]),
        desc(
            "The last point catches people. Accelerating the critical path "
            "far enough makes another chain the longest, and further "
            "acceleration of the first buys nothing at all."
        ),
    ]),

    ("Decision Analysis Under Uncertainty", [
        desc(
            "Where outcomes depend on things nobody controls, the syllabus "
            "expects a structured comparison rather than intuition."
        ),
        table(
            ["Criterion", "Chooses"],
            [["Expected value",
              "The option with the best average outcome over "
              "probabilities"],
             ["Maximin",
              "The option whose worst outcome is least bad"],
             ["Maximax",
              "The option with the best possible outcome"],
             ["Minimax regret",
              "The option minimising how much is lost by choosing wrongly"],
             ["Decision tree",
              "A structure for sequences of decisions and events"]],
            caption="Five ways to choose among uncertain outcomes.",
            footer="MAXIMIN is the appropriate criterion when a bad outcome "
                   "would be unsurvivable, since expected value happily "
                   "accepts a small chance of ruin in exchange for a good "
                   "average."),
    ]),

    ("Simulation", [
        desc(
            "Where a system is too complex or too variable to solve "
            "analytically, it is run instead."
        ),
        ol([
            "Build a model of how the system behaves, including its random "
            "elements.",
            "Run it many times with randomly drawn inputs.",
            "Observe the distribution of results rather than a single "
            "answer.",
            "Compare alternatives by running each under the same "
            "conditions.",
            "Validate the model against reality wherever any real data "
            "exists.",
        ]),
        desc(
            "Step three is the advantage over an analytical answer. "
            "Simulation reports how often a bad outcome occurs as well as "
            "the average, which is precisely what a decision maker needs and "
            "an expected value conceals."
        ),
    ]),

    ("Industrial Engineering", [
        desc(
            "Where operations research models decisions, industrial "
            "engineering improves how work is actually performed."
        ),
        ul([
            "It studies the method -- what steps are performed, in what "
            "order, by whom.",
            "It measures the work, establishing how long each step actually "
            "takes.",
            "It removes what contributes nothing, which is usually most of "
            "the elapsed time.",
            "It standardises what remains, so the improvement holds.",
            "It repeats, since the standard is a baseline for the next "
            "improvement rather than an endpoint.",
        ]),
        desc(
            "The order matters. Measuring before establishing the method "
            "measures the current muddle precisely, and standardising before "
            "improving fixes the muddle in place."
        ),
    ]),

    ("Method Study and Work Measurement", [
        desc(
            "The two halves of industrial engineering answer different "
            "questions and are frequently confused."
        ),
        compare_grid(
            "METHOD STUDY AGAINST WORK MEASUREMENT",
            "How the work is done, against how long it takes.",
            [("Method study",
              ["Records what is actually done, step by step",
               "Questions why each step exists",
               "Eliminates, combines, rearranges, simplifies",
               "Produces a better method"]),
             ("Work measurement",
              ["Establishes how long the method takes",
               "Supports capacity planning and costing",
               "Provides a baseline to improve against",
               "Measures the method it is given"])]),
        desc(
            "ELIMINATE is the first and most productive of the improvement "
            "actions. A step removed entirely cannot be done badly, cannot "
            "be delayed, and needs no measurement -- which is why questioning "
            "whether a step should exist precedes making it faster."
        ),
    ]),

    ("Waste", [
        desc(
            "Improvement traditions in this area organise themselves around "
            "identifying what adds no value."
        ),
        table(
            ["Waste", "Appears as"],
            [["Waiting", "Work sitting idle between steps"],
             ["Overproduction",
              "Producing more or sooner than is needed"],
             ["Transport and movement",
              "Moving things, or people, for no benefit"],
             ["Excess processing",
              "Doing more to something than anybody requires"],
             ["Defects and rework", "Doing it again because it was wrong"]],
            caption="Five categories of waste.",
            footer="WAITING is usually the largest by elapsed time and the "
                   "least visible, because nobody is doing anything wrong "
                   "while it happens. Most of a work item's life is spent "
                   "waiting rather than being worked on."),
    ]),

    ("Cycle Time and Throughput", [
        desc(
            "Two measures describe a process's performance and they answer "
            "different questions."
        ),
        ul([
            "Cycle time is how long one item takes from start to finish.",
            "Throughput is how many items complete per period.",
            "Work in progress relates them: more work in progress means "
            "longer cycle times at the same throughput.",
            "Limiting work in progress therefore shortens cycle time without "
            "anybody working faster.",
            "Most of a typical cycle time is waiting rather than work.",
        ]),
        desc(
            "The fourth point is the counter-intuitive result that matters. "
            "Starting fewer things at once finishes them sooner, because "
            "each item spends less of its life queued behind the others."
        ),
    ]),

    ("Quality Techniques", [
        desc(
            "The syllabus names the seven basic quality tools, and items ask "
            "which suits a described situation."
        ),
        content_accordion(
            "TOOLS FOR FINDING A CAUSE",
            "Each answers a different question about a defect.",
            [("Pareto chart",
              "Ranks causes by frequency or cost, showing that a small "
              "number account for most of the problem. It answers which "
              "cause to attack first."),
             ("Cause and effect diagram",
              "Organises possible causes of one effect into categories. It "
              "answers what could be responsible, before anything is "
              "measured."),
             ("Control chart",
              "Plots a measure over time against limits derived from the "
              "process itself. It distinguishes ordinary variation from a "
              "genuine change."),
             ("Histogram",
              "Shows the distribution of a measured value. It answers "
              "whether the process is centred where it should be and how "
              "much it varies."),
             ("Scatter diagram",
              "Plots two variables against each other. It answers whether "
              "they move together, which is not the same as one causing the "
              "other."),
             ("Check sheet and stratification",
              "Structured collection of occurrences, and splitting them by "
              "some factor. They answer what is actually happening before "
              "anybody theorises about why.")]),
    ]),

    ("Statistical Process Control", [
        desc(
            "The control chart deserves separate treatment because it "
            "answers a question people answer wrongly by instinct."
        ),
        ul([
            "Every process varies, and most variation is ordinary.",
            "COMMON CAUSE variation is inherent in the process as it "
            "stands.",
            "SPECIAL CAUSE variation comes from something that was not "
            "there before.",
            "Reacting to common cause variation as if it were special makes "
            "the process worse.",
            "Reducing common cause variation requires changing the process, "
            "not investigating individual points.",
        ]),
        desc(
            "The fourth point is the practical warning. Adjusting a process "
            "in response to ordinary variation adds the adjustments to the "
            "variation, so a well-meant correction on every reading "
            "reliably produces a less stable process than leaving it alone."
        ),
    ]),

    ("Capacity and Bottlenecks", [
        desc(
            "A process's output is set by its slowest stage, and everything "
            "else follows from that."
        ),
        ol([
            "Identify the constraint -- the stage limiting the whole "
            "process.",
            "Exploit it: make sure it is never idle and never works on "
            "anything defective.",
            "Subordinate everything else to it, since running other stages "
            "faster only builds inventory.",
            "Elevate it -- add capacity where it is, once the first three "
            "are done.",
            "Repeat, because the constraint will have moved somewhere else.",
        ]),
        desc(
            "Step three is where organisations resist. Deliberately running "
            "non-constraint stages below their capacity looks like waste and "
            "is the correct action, since output cannot exceed the "
            "constraint however busy anything else is."
        ),
    ]),

    ("Where These Techniques Fail", [
        desc(
            "The syllabus expects an engineer to know a technique's limits "
            "as well as its use."
        ),
        ul([
            "The model's assumptions do not hold, and nobody checked.",
            "The input data is wrong, which no amount of correct "
            "mathematics repairs.",
            "The objective chosen is not what the organisation actually "
            "wants.",
            "The situation changes faster than the analysis can be "
            "completed.",
            "The answer is precise and confidently wrong, which is more "
            "dangerous than no answer.",
        ]),
        desc(
            "The last point is the one to carry. A number produced by a "
            "model arrives with an authority its inputs did not earn, and "
            "people act on it more readily than on a judgement stated as a "
            "judgement."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc(
            "These techniques appear throughout the certification under "
            "other names."
        ),
        content_tabs(
            "WHERE THESE TECHNIQUES REAPPEAR",
            "Each tab is a category using something from this lesson.",
            [("Project management", "Critical path and estimation",
              "Scheduling, float and the critical path are the same "
              "technique applied to a project, and the caution about the "
              "path moving after acceleration applies identically."),
             ("System strategy", "Capacity planning",
              "Sizing a system is a queueing problem, which is why "
              "targeting full utilisation produces response times nobody "
              "predicted."),
             ("Service management", "Cycle time and waste",
              "Reducing the time an incident spends waiting rather than "
              "being worked on is the same analysis applied to support."),
             ("Business strategy", "Bottlenecks and inventory",
              "Production planning, just-in-time and constraint management "
              "are this lesson's techniques applied to a factory."),
             ("Development technology", "Limiting work in progress",
              "Starting fewer things at once to finish them sooner is the "
              "same relationship between work in progress and cycle time, "
              "which is why iterative methods limit what is in "
              "flight.")]),
    ]),

    ("Common Mistakes", [
        desc("Where operations research items are lost."),
        review_cards(
            "MISTAKES THAT COST MARKS HERE",
            "Each is a plausible answer that is wrong.",
            [("Assuming queue length rises in proportion to load",
              "It rises without limit as utilisation approaches one, which "
              "is why spare capacity is not waste.",
              "Items describe a system slowing far more than its load "
              "rose."),
             ("Treating an accepted stockout probability as a failure",
              "Covering every case requires unlimited stock, so safety "
              "stock is set from a chosen service level.",
              "The question is which probability was accepted."),
             ("Accelerating a non-critical activity",
              "Only the critical path sets the finish date; float elsewhere "
              "means the saving is not realised.",
              "And accelerating the path far enough moves it."),
             ("Reacting to every variation on a control chart",
              "Adjusting for common cause variation adds the adjustments to "
              "the variation and destabilises the process.",
              "Investigate special causes; change the process for common "
              "ones."),
             ("Running non-constraint stages at full capacity",
              "Output is set by the constraint, so everything else running "
              "faster produces inventory rather than output.",
              "Subordinate, do not maximise.")]),
    ]),

    ("Review", [
        desc("The points items are built on."),
        review_cards(
            "WHAT TO CARRY OUT OF THIS LESSON",
            "Answer each before moving on.",
            [("What does examining binding constraints tell you?",
              "Exactly what to relax to improve the result, which is more "
              "useful than the optimum itself.",
              "It is the step most often skipped."),
             ("What happens to waiting as utilisation approaches one?",
              "It rises without limit, not in proportion.",
              "Which is why full utilisation is never the target."),
             ("What sets a project's finish date?",
              "The critical path -- the longest chain of dependent "
              "activities.",
              "Shorten it far enough and it moves elsewhere."),
             ("When is maximin the right criterion?",
              "When a bad outcome would be unsurvivable, since expected "
              "value accepts small chances of ruin.",
              "Match the criterion to the consequence."),
             ("What is the first improvement action?",
              "ELIMINATE. A step removed cannot be done badly or delayed.",
              "Question whether a step should exist before speeding it "
              "up."),
             ("How does limiting work in progress shorten cycle time?",
              "Each item spends less of its life queued behind others, with "
              "nobody working faster.",
              "Start fewer things to finish them sooner.")]),
    ]),
]


_or_quiz = [
    mcq("HARD",
        "A linear programme has been solved and the optimum is "
        "known.\n\nWhat further information do the binding constraints "
        "supply?",
        [("Which limits to relax in order to improve the result", True),
         ("How much confidence can be placed in the accuracy of the "
          "optimal solution obtained", False),
         ("Whether the objective function was formulated correctly for the "
          "problem being solved", False),
         ("How long the solution will remain valid before the situation "
          "changes materially", False)],
        "A binding constraint is one holding the solution back, so relaxing "
        "it is the only change that improves the objective. This is "
        "frequently more valuable than the optimum itself: it tells the "
        "organisation precisely where additional capacity or budget would "
        "produce a return."),

    mcq("AVERAGE",
        "Utilisation of a shared server rises from fifty to ninety percent, "
        "and response times increase far more than proportionately.\n\nWhy?",
        [("Waiting time rises without limit as utilisation approaches "
          "one", True),
         ("The server's processing capacity degrades measurably once it is "
          "under sustained heavy load", False),
         ("The additional requests are systematically larger than the ones "
          "arriving previously were", False),
         ("Queue management overhead grows in proportion to the number of "
          "items being held", False)],
        "This is the central result of queueing theory and it applies to "
        "processors, help desks and factory machines identically. As "
        "utilisation approaches capacity, arriving work increasingly finds "
        "the server busy, and the queue grows without bound rather than in "
        "proportion -- which is why spare capacity is a requirement rather "
        "than waste."),

    mcq("AVERAGE",
        "Safety stock is set to cover only ninety-five percent of "
        "cases.\n\nIs this a defect in the calculation?",
        [("No -- covering every case would require unlimited stock", True),
         ("Yes, because a stockout represents a failure to meet demand that "
          "the organisation had accepted", False),
         ("Yes, because the calculation should be based on the maximum "
          "observed demand during lead time", False),
         ("Only where the lead time itself varies as well as the demand "
          "during that lead time", False)],
        "Safety stock is bought protection and the cost of covering the "
        "final few percent of cases rises very steeply, because it must "
        "cover increasingly unlikely combinations of high demand and long "
        "lead time. The service level is therefore a deliberate commercial "
        "decision about which stockout probability is acceptable."),

    mcq("HARD",
        "An activity with two weeks of float is accelerated by one "
        "week.\n\nWhat is the effect on the finish date?",
        [("The finish date does not move at all", True),
         ("It advances by one week, since every activity shortened "
          "contributes to the overall duration", False),
         ("It advances by less than one week, because the saving is "
          "partially absorbed by the float", False),
         ("It cannot be determined without knowing the durations of the "
          "activities that follow it", False)],
        "The finish date is set by the critical path, and an activity with "
        "float is by definition not on it. Shortening it consumes float that "
        "already existed and changes nothing. Only shortening the critical "
        "path advances the finish -- and doing so far enough will make some "
        "other chain critical instead."),

    mcq("AVERAGE",
        "One option offers the best average outcome and a small chance of "
        "an unsurvivable loss.\n\nWhich criterion rejects it?",
        [("Maximin", True),
         ("Expected value, because it weights each outcome by the "
          "probability of that outcome occurring", False),
         ("Maximax, because it selects on the strength of the best "
          "achievable outcome available", False),
         ("Minimax regret, because it minimises what is lost by having "
          "chosen wrongly", False)],
        "Maximin selects the option whose worst outcome is least bad, which "
        "is the appropriate criterion when a bad outcome cannot be absorbed. "
        "Expected value would accept the option, since a small probability "
        "of ruin barely affects an average -- which is exactly why it is the "
        "wrong criterion for a survival question."),

    mcq("AVERAGE",
        "Improving a work process begins with one action before all "
        "others.\n\nWhich?",
        [("Eliminating steps that need not exist", True),
         ("Measuring how long each of the existing steps currently takes "
          "to complete", False),
         ("Standardising the steps so that everybody performs them in the "
          "same way", False),
         ("Automating the steps that are performed most frequently within "
          "the process", False)],
        "A step removed cannot be done badly, delayed, measured or "
        "automated, so questioning whether each step should exist precedes "
        "everything else. Measuring first records the current muddle "
        "precisely, and standardising or automating first fixes it in "
        "place -- which is the most expensive of the three errors."),

    mcq("HARD",
        "An operator adjusts a machine after every reading that departs "
        "from target, and variation increases.\n\nWhat has "
        "happened?",
        [("Common cause variation was treated as special cause", True),
         ("The adjustments were made in the wrong direction relative to the "
          "measured departure from target", False),
         ("The machine requires recalibration, which the adjustments have "
          "been compensating for temporarily", False),
         ("The control limits in use were calculated from too small a "
          "sample of readings to be reliable", False)],
        "Ordinary variation is inherent in a stable process, and each "
        "adjustment made in response to it adds a further movement to the "
        "variation that was already there. Special causes are investigated "
        "individually; common cause variation is reduced only by changing "
        "the process itself."),

    mcq("AVERAGE",
        "Non-constraint stages in a process are run at full capacity.\n\nWhat "
        "does this produce?",
        [("Inventory, rather than additional output", True),
         ("A measurable increase in total throughput across the process as "
          "a whole", False),
         ("Better utilisation of equipment, which reduces the unit cost of "
          "what is produced", False),
         ("Earlier identification of the constraint, because work "
          "accumulates in front of it", False)],
        "Output is set by the constraint, so every other stage producing "
        "faster than the constraint can consume merely accumulates work in "
        "front of it. This is why non-constraint stages are deliberately "
        "subordinated and run below capacity, which looks wasteful and is "
        "the correct action."),

    mcq("HARD",
        "Work in progress is halved while throughput is unchanged.\n\nWhat "
        "happens to cycle time?",
        [("It roughly halves", True),
         ("It is unaffected, since the same amount of work is being "
          "completed in each period", False),
         ("It rises, because fewer items are available to keep every stage "
          "of the process occupied", False),
         ("It falls only where the reduction is concentrated at the "
          "constraint stage of the process", False)],
        "Cycle time, throughput and work in progress are related directly: "
        "with throughput held constant, halving the work in progress halves "
        "the time each item spends in the system. Nobody works faster -- each "
        "item simply spends less of its life queued behind the others, which "
        "is why limiting what is started is an effective intervention."),

    mcq("AVERAGE",
        "A model produces a precise answer from inputs nobody "
        "verified.\n\nWhy is this described as dangerous rather than merely "
        "unhelpful?",
        [("A precise answer is believed more readily than a "
          "judgement", True),
         ("The computation consumes resources that could have been directed "
          "towards gathering better data", False),
         ("Models of this kind cannot be validated once they have produced "
          "a result that appears reasonable", False),
         ("Precision in the output implies that the model itself was "
          "formulated more carefully than it was", False)],
        "A number arriving from a model carries an authority its inputs did "
        "not earn, and people act on it more readily than on a stated "
        "judgement. An absent answer prompts somebody to think; a confidently "
        "wrong one prompts them to act, which is why validating inputs and "
        "assumptions is part of the analysis rather than optional."),
]


LESSON_OR = lesson(
    MAJOR, MIDDLE,
    "Operations Research and Industrial Engineering",
    _or_quiz,
    lesson_structure(
        "Operations Research and Industrial Engineering",
        "This lesson covers deciding numerically rather than by argument. "
        "LINEAR PROGRAMMING allocates limited resources, and its binding "
        "constraints tell an organisation what to relax. QUEUEING supplies "
        "the result that governs capacity everywhere: waiting rises without "
        "limit as utilisation approaches one, so spare capacity is not "
        "waste. Inventory models trade holding cost against stockout, the "
        "CRITICAL PATH sets a finish date and nothing off it does, and "
        "decision criteria are matched to consequence. Industrial "
        "engineering then improves how work is performed, beginning with "
        "ELIMINATE, subordinating everything to the constraint, and "
        "distinguishing common from special cause variation.",
        [
            "State what each named technique answers",
            "Explain what binding constraints reveal",
            "Explain why waiting rises non-linearly with utilisation",
            "Explain how safety stock is set",
            "Explain what the critical path determines",
            "Match a decision criterion to a consequence",
            "State the first improvement action and why",
            "Distinguish common from special cause variation",
        ],
        75,
        _or_sections,
        [
            ("Binding constraints",
             "The limits holding the solution back -- relaxing them is what "
             "improves the result."),
            ("Queueing",
             "Waiting rises without limit as utilisation approaches one, so "
             "spare capacity is a requirement."),
            ("Safety stock",
             "Set from a chosen service level, since covering every case "
             "needs unlimited stock."),
            ("Critical path",
             "The longest chain of dependent activities; float elsewhere "
             "means acceleration there buys nothing."),
            ("Maximin",
             "The criterion for unsurvivable outcomes, since expected value "
             "accepts small chances of ruin."),
            ("Eliminate first",
             "A step removed cannot be done badly, delayed, measured or "
             "automated."),
            ("Common against special cause",
             "Adjusting for ordinary variation adds to it; only a process "
             "change reduces it."),
            ("Work in progress",
             "Halving it halves cycle time at the same throughput, with "
             "nobody working faster."),
        ],
        "Operations research represents a decision as a model and solves it. "
        "LINEAR PROGRAMMING allocates limited resources, and its most useful "
        "output is which constraints BIND, since those are what to relax. "
        "QUEUEING supplies the result that governs capacity planning "
        "everywhere: waiting time rises without limit as utilisation "
        "approaches one, which is why targeting full utilisation makes "
        "everything slower. Inventory models balance holding cost against "
        "stockout cost, with SAFETY STOCK set from a chosen service level "
        "because covering every case requires unlimited stock. The CRITICAL "
        "PATH sets the finish date, so accelerating anything with float "
        "changes nothing -- and accelerating the path far enough moves it. "
        "Decision criteria are matched to consequence, with MAXIMIN "
        "appropriate where a bad outcome is unsurvivable. Industrial "
        "engineering improves the work itself: ELIMINATE before anything "
        "else, subordinate every stage to the CONSTRAINT since output cannot "
        "exceed it, limit work in progress because that shortens cycle time "
        "without anybody working faster, and never adjust a process in "
        "response to COMMON CAUSE variation, which only adds to it.",
        exam_notes=[
            desc(
                "Items describe an operational situation and ask which "
                "technique or result explains it."
            ),
            ul([
                "Stating what binding constraints reveal.",
                "Explaining a non-linear rise in response time.",
                "Justifying an accepted stockout probability.",
                "Recognising that float means no saving.",
                "Selecting maximin for an unsurvivable outcome.",
                "Naming elimination as the first improvement action.",
                "Diagnosing over-adjustment of a stable process.",
                "Relating work in progress to cycle time.",
            ]),
            desc(
                "For any item here, ask what the constraint is and what is "
                "being assumed. Almost every wrong answer in this area "
                "either optimises something that is not the constraint or "
                "relies on an assumption the situation has already "
                "broken."
            ),
        ],
    ))


LESSONS = [LESSON_MGMT, LESSON_OR]

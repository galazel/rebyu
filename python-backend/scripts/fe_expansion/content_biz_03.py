"""Business Strategy -> Technological Strategy Management, lessons 1 and 2.

Planning a technology development strategy, and technology development plans
and innovation management.

Both lessons rest on the same distinction the examination presses: an
INVENTION is a new capability and an INNOVATION is one that reached use --
and organisations reliably produce more of the first than the second.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Business Strategy"
MIDDLE = "Technological Strategy Management"

# ==========================================================================
# Lesson 1: Planning a technology strategy
# ==========================================================================

_tech_sections = [
    ("Deciding What to Be Good At", [
        desc(
            "A technology strategy decides which technical capabilities the "
            "organisation will develop, acquire or leave to others."
        ),
        table(
            ["Decision", "Follows from"],
            [["Which capabilities to build internally",
              "Which ones differentiate the organisation"],
             ["Which to acquire or license",
              "Which are needed and not distinguishing"],
             ["Which to leave entirely",
              "Which the organisation has no reason to hold"],
             ["When to adopt something new",
              "Whether early advantage outweighs instability"],
             ["When to abandon something existing",
              "Whether maintaining it costs more than it returns"]],
            caption="Five technology strategy decisions.",
            footer="The first row is where the strategy exists at all. "
                   "Capability worth building is capability competitors "
                   "cannot simply buy -- and anything purchasable is "
                   "available to them on the same terms."),
        desc(
            "The last row is the decision organisations avoid. Technology "
            "accumulates, each piece defensible when adopted, and nothing "
            "prompts its removal -- so deliberate retirement is a strategic "
            "act rather than housekeeping."
        ),
    ]),

    ("Watching What Is Coming", [
        desc(
            "A technology strategy needs to know what is changing, which "
            "requires looking deliberately rather than noticing."
        ),
        ol([
            "Scan systematically, since organisations see developments in "
            "areas they already watch.",
            "Assess maturity, since an unproven technology and an "
            "established one carry entirely different risks.",
            "Assess relevance to what the organisation actually does, since "
            "most developments are irrelevant to any particular "
            "organisation.",
            "Assess what adopting would require -- skills, investment, "
            "process change.",
            "Decide deliberately whether to act, watch, or ignore, and record "
            "which.",
        ]),
        desc(
            "Step five matters because the alternative is drift. A "
            "development neither adopted nor deliberately declined stays "
            "under discussion indefinitely, consuming attention and producing "
            "no decision either way."
        ),
    ]),

    ("Adopting Early or Late", [
        desc(
            "When to adopt a technology is a strategic choice with a real "
            "trade rather than a question of enthusiasm."
        ),
        image(fig("adoption-timing")),
        compare_grid(
            "EARLY AGAINST LATE ADOPTION",
            "Advantage against certainty.",
            [("Adopting early",
              ["Advantage while competitors do not have it",
               "Influence over how it develops",
               "Instability, immature tools, few people who know it",
               "The cost of learning what does not work"]),
             ("Adopting late",
              ["Proven, documented and supported",
               "Skills available in the market",
               "No advantage, since everybody has it",
               "Sometimes no choice, if it became a requirement"])]),
        desc(
            "The judgement is whether the advantage available is worth the "
            "instability, which depends on what the organisation is competing "
            "on. A technology differentiating the product may justify early "
            "adoption; one supporting an administrative function almost never "
            "does."
        ),
        desc(
            "The syllabus also names the CHASM between early adopters and the "
            "mainstream: a technology that early users value can fail to "
            "reach the larger market that wants different things -- proven "
            "reliability, support, and no obligation to become an expert."
        ),
    ]),

    ("Building Capability", [
        desc(
            "Deciding to develop a capability internally is the beginning of "
            "an obligation rather than a purchase."
        ),
        ul([
            "It takes time, and the organisation is worse at it during that "
            "time.",
            "It requires people who will need to be found, developed and "
            "retained.",
            "It requires continued investment, since a capability not "
            "maintained decays.",
            "It requires the work to keep coming, since a capability with "
            "nothing to apply it to loses the people who held it.",
            "Retaining it is harder than acquiring it, since the people can "
            "leave.",
        ]),
        desc(
            "The last point is what makes capability different from "
            "equipment. An organisation's technical capability walks out of "
            "the building every evening, and whether it returns depends on "
            "conditions the strategy has to address rather than assume."
        ),
    ]),

    ("Obtaining Technology From Outside", [
        desc(
            "Not everything is built, and the syllabus names the routes and "
            "what each costs."
        ),
        table(
            ["Route", "Provides", "Costs"],
            [["Licensing", "Use of somebody's technology, quickly",
              "Terms, renewal risk, and no ownership"],
             ["Joint development", "Shared cost and shared risk",
              "Divided control, and shared results"],
             ["Acquisition", "The capability and its people outright",
              "Price, integration, and what came with it"],
             ["Research collaboration",
              "Access to work the organisation could not fund alone",
              "Slower, and results shared with participants"]],
            caption="Four routes to external technology.",
            footer="ACQUISITION appears simplest and is not. Buying an "
                   "organisation buys its capability along with its "
                   "obligations, its culture and its people's willingness to "
                   "stay -- and the capability frequently rests on the people "
                   "rather than on anything transferable."),
        desc(
            "Each route also raises the intellectual property questions of "
            "the Development Technology category: who owns what results, what "
            "each party may do with them, and what happens when the "
            "arrangement ends."
        ),
    ]),

    ("Standards and Interoperability", [
        desc(
            "A technology strategy has to decide how much it commits to "
            "standards, which is a question about future freedom."
        ),
        table(
            ["Choosing", "Buys", "Costs"],
            [["A widely adopted standard",
              "Interoperability, skills, and alternatives",
              "The constraints the standard imposes"],
             ["A proprietary technology",
              "Whatever it does better than the standard",
              "Dependence on one supplier's decisions"],
             ["Participating in setting a standard",
              "Influence over what it becomes",
              "Time, and results shared with everybody"]],
            caption="Three positions on standards.",
            footer="ALTERNATIVES are what a standard actually buys. Committing "
                   "to one means several suppliers can meet the need, which "
                   "is the negotiating position that proprietary adoption "
                   "gives away."),
        desc(
            "The syllabus also notes that a standard may be formal, agreed by "
            "a recognised body, or DE FACTO, established by widespread "
            "adoption. The second binds an organisation's choices as firmly "
            "as the first, without anybody having agreed it."
        ),
    ]),

    ("Skills and People", [
        desc(
            "A technology strategy is a statement about what the "
            "organisation's people will be able to do, which makes skills "
            "part of it rather than a consequence."
        ),
        ol([
            "Establish what skills the strategy requires, and by when.",
            "Establish what exists, honestly rather than from job titles.",
            "Decide for each gap whether to develop, recruit or contract.",
            "Allow time, since developing a capability in people takes "
            "considerably longer than acquiring the technology.",
            "Plan retention, since a strategy depending on skills the "
            "organisation cannot keep is not achievable.",
        ]),
        desc(
            "Step four is where technology strategies become unrealistic. "
            "Acquiring a platform takes weeks and becoming good at it takes "
            "far longer, so a plan sequencing the technology and assuming the "
            "capability arrives with it has planned only half the work."
        ),
    ]),

    ("Technical Debt at the Strategic Level", [
        desc(
            "The accumulated cost of decisions taken for speed exists at the "
            "organisational scale as well as in individual systems."
        ),
        compare_grid(
            "WHAT ACCUMULATES, AND WHAT IT COSTS",
            "Individually reasonable decisions, compounding.",
            [("Accumulates as",
              ["Systems on platforms nobody supports",
               "Integrations nobody can explain",
               "Skills held by one person",
               "Technology chosen for a project that outlived it"]),
             ("Costs as",
              ["Every change taking longer than it should",
               "Options unavailable because something cannot be moved",
               "Effort spent maintaining rather than improving",
               "Estimates that stop being reliable"])]),
        desc(
            "The second entry on the right is what makes this strategic. "
            "Accumulated technical debt does not merely cost money -- it "
            "removes choices, so the organisation's strategy is constrained "
            "by decisions nobody made deliberately."
        ),
    ]),

    ("Reviewing the Technology Strategy", [
        desc(
            "A technology strategy is reviewed like any other, and the "
            "questions are specific to it."
        ),
        ul([
            "Are the capabilities we chose still the ones that "
            "differentiate us?",
            "Has anything we decided to watch become something we should "
            "act on?",
            "Has anything we adopted stopped earning its cost?",
            "Are the skills we assumed still available to us?",
            "Has anything we ignored turned into a requirement rather than "
            "an option?",
        ]),
        desc(
            "The last question is the one that catches organisations out. A "
            "technology declined reasonably as optional can become something "
            "customers, regulators or partners expect -- at which point the "
            "earlier decision was correct and is no longer."
        ),
    ]),

    ("Technology and Competitive Position", [
        desc(
            "Technology creates advantage in specific ways, and knowing which "
            "one is at work decides how long the advantage lasts."
        ),
        table(
            ["Advantage from", "Lasts"],
            [["Being first to use something available to everybody",
              "Until competitors adopt it, which is usually soon"],
             ["Using it better than others can",
              "As long as the capability difference persists"],
             ["Owning it exclusively",
              "As long as the protection does"],
             ["Building it into how the organisation works",
              "Longest, since copying it requires copying the "
              "organisation"]],
            caption="Four sources of technology advantage, by durability.",
            footer="The last row is what makes technology advantage durable. "
                   "A competitor can buy the same system and cannot easily "
                   "acquire the processes, data and habits that make it "
                   "productive here."),
        desc(
            "The first row is where most claimed technology advantage sits, "
            "and it explains why so much of it evaporates. Adopting something "
            "available on the market ahead of competitors buys a period "
            "rather than a position."
        ),
    ]),

    ("Risk in Technology Decisions", [
        desc(
            "Technology choices carry risks distinct from project risks, and "
            "they belong in the strategy rather than in a project plan."
        ),
        ul([
            "The technology does not mature as expected, and remains "
            "unstable.",
            "The supplier withdraws it, is acquired, or changes its "
            "direction.",
            "The skills do not become available, or become expensive.",
            "A different approach becomes standard, leaving this one "
            "isolated.",
            "The organisation cannot change the decision later without "
            "considerable cost.",
        ]),
        desc(
            "The last is the one that compounds. A technology decision "
            "becomes harder to reverse as more is built on it, so the "
            "reversibility of a choice is itself worth weighing at the point "
            "it is made rather than discovered when the reversal is needed."
        ),
    ]),

    ("Communicating a Technology Strategy", [
        desc(
            "A technology strategy is read by people who make technology "
            "decisions daily, and it succeeds by influencing those rather "
            "than by being comprehensive."
        ),
        ul([
            "State the few capabilities the organisation is investing in, and "
            "why.",
            "State what is standard, so that departing from it becomes a "
            "decision somebody has to justify.",
            "State what is being retired, and by when, so nothing new is "
            "built on it.",
            "Express it as principles people can apply, since most relevant "
            "decisions never reach an architect.",
            "Keep it short enough to be read by somebody who was not asked "
            "to.",
        ]),
        desc(
            "The third point does work nothing else does. A technology "
            "marked for retirement stops attracting new dependencies, which "
            "is what eventually makes retiring it possible -- and without "
            "that statement, the dependencies keep accumulating on something "
            "everybody privately knows is going."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where technology strategy items are lost."),
        ul([
            "Building capability that competitors can simply buy.",
            "Adopting a technology for currency rather than for a problem it "
            "addresses.",
            "Treating early adoption as universally better, when it buys "
            "advantage with instability.",
            "Never deciding about a development, so it stays under discussion "
            "indefinitely.",
            "Treating capability as acquired once rather than requiring "
            "continued investment and work.",
            "Assuming an acquisition transfers capability that actually rests "
            "on people.",
            "Accumulating technology and never retiring any of it.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An organisation acquires a company for its technical "
            "capability. Within eighteen months most of the technical staff "
            "have left and the capability is gone. What was misjudged?\""
        ),
        ol([
            "Establish what was bought: an organisation, its assets and its "
            "obligations.",
            "Establish where the capability actually resided: in people, "
            "their knowledge and how they worked together.",
            "People are not assets and cannot be acquired -- their continued "
            "presence is voluntary.",
            "So the acquisition transferred what was transferable and left "
            "the essential part dependent on the staff choosing to stay.",
            "What was needed was attention to retention as part of the "
            "acquisition: why they would want to stay, what changes, and what "
            "the acquisition means for them.",
        ]),
        desc(
            "The general point applies to every capability decision. "
            "Technical capability is held by people, and a strategy treating "
            "it as an asset that can be bought and owned has misunderstood "
            "what it is acquiring."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Technology strategy sits between business and delivery."),
        ul([
            "Core competence from the strategy lesson determines what to "
            "build internally.",
            "Build-against-buy is the same decision at the capability "
            "level.",
            "Licensing arrangements carry the intellectual property "
            "obligations of Development Technology.",
            "Capability retention is the knowledge concern of Project "
            "Integration.",
            "Retiring technology connects to the disposal stage of the "
            "development category.",
            "Adoption timing informs the information systems strategy.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What capability is worth building",
              "What competitors cannot simply buy",
              "Anything purchasable is available to them on the same "
              "terms."),
             ("What early adoption buys and costs",
              "Advantage, paid for in instability",
              "Worth it where the technology differentiates the product, "
              "rarely elsewhere."),
             ("What the chasm describes",
              "A technology valued by early users failing to reach the "
              "mainstream",
              "Which wants reliability and support rather than possibility."),
             ("Why capability is unlike equipment",
              "It walks out of the building every evening",
              "Whether it returns depends on conditions the strategy must "
              "address."),
             ("What an acquisition may not transfer",
              "The capability, where it rests on people",
              "Assets and obligations transfer; continued presence is "
              "voluntary."),
             ("The decision organisations avoid",
              "Retiring technology",
              "It accumulates, each piece defensible, and nothing prompts "
              "removal.")]),
    ]),
]

_tech_quiz = [
    mcq("HARD",
        "An organisation acquires a company for its technical capability, and "
        "most technical staff leave within eighteen months.\n\n"
        "What was misjudged?",
        [("The capability resided in people, whose continued presence is "
          "voluntary", True),
         ("The acquisition price was too high for what was "
          "obtained", False),
         ("The two organisations' technologies proved "
          "incompatible", False),
         ("The acquired company's processes were not documented "
          "adequately", False)],
        "An acquisition transfers assets and obligations; technical "
        "capability is held by people, their knowledge and how they work "
        "together, and none of that is acquired. Retention therefore had to "
        "be part of the acquisition -- why they would want to stay, what "
        "changes for them -- rather than assumed to follow from the "
        "transaction."),

    mcq("AVERAGE",
        "Which technical capability is worth developing internally?",
        [("One competitors cannot simply buy", True),
         ("One the organisation's staff are most interested in", False),
         ("One that would be expensive to license", False),
         ("One that supports the largest number of systems", False)],
        "A capability available for purchase is available to competitors on "
        "the same terms, so building it internally spends effort creating no "
        "advantage. Internal development belongs where the capability "
        "distinguishes the organisation -- which is the same reasoning the "
        "build-or-buy decision applies at the component level."),

    mcq("HARD",
        "Adopting a technology early involves a trade.\n\n"
        "Which?",
        [("Advantage while competitors lack it, paid for in "
          "instability", True),
         ("Lower licensing costs, paid for in reduced "
          "functionality", False),
         ("Influence over standards, paid for in longer "
          "implementation", False),
         ("Access to skilled staff, paid for in higher "
          "salaries", False)],
        "Early adoption offers advantage while others do not have the "
        "capability, and some influence over how it develops, in exchange for "
        "immature tools, scarce skills and the cost of learning what does not "
        "work. Whether that trade is worth making depends on whether the "
        "technology differentiates what the organisation sells."),

    mcq("AVERAGE",
        "What does the chasm between early adopters and the mainstream "
        "describe?",
        [("A technology early users value failing to reach the larger "
          "market", True),
         ("The delay between a technology's invention and its "
          "availability", False),
         ("The skills gap between specialists and general "
          "practitioners", False),
         ("The cost difference between early and late adoption", False)],
        "Early adopters value possibility and tolerate difficulty; the "
        "mainstream wants proven reliability, support and no obligation to "
        "become an expert. A technology succeeding with the first group can "
        "fail to cross to the second, because the second is buying something "
        "different from the same product."),

    mcq("HARD",
        "Why is technical capability unlike equipment as an organisational "
        "asset?",
        [("It is held by people, whose continued presence is not "
          "guaranteed", True),
         ("It depreciates faster than physical assets do", False),
         ("It cannot be valued on the organisation's balance "
          "sheet", False),
         ("It requires continuous licensing to remain usable", False),
         ],
        "An organisation's technical capability leaves the building every "
        "evening, and whether it returns depends on conditions -- work worth "
        "doing, development, how people are treated -- that a strategy must "
        "address rather than assume. Equipment stays where it was put; "
        "capability is a relationship rather than a possession."),

    mcq("AVERAGE",
        "What happens to a capability the organisation has no work to "
        "apply?",
        [("The people holding it leave, and it is lost", True),
         ("It remains available until it is needed again", False),
         ("It becomes cheaper to maintain than to acquire", False),
         ("It transfers naturally to adjacent areas of work", False)],
        "Capability is maintained by practising it, and people who cannot "
        "practise what they are good at go somewhere they can. That makes a "
        "flow of relevant work part of retaining a capability rather than a "
        "consequence of having one -- and it is why building a capability "
        "commits the organisation to using it."),

    mcq("HARD",
        "Which technology decision do organisations most consistently avoid "
        "making?",
        [("Retiring technology they no longer need", True),
         ("Adopting a technology before competitors do", False),
         ("Licensing rather than developing internally", False),
         ("Collaborating with other organisations on research", False)],
        "Technology accumulates because each adoption was defensible and "
        "nothing subsequently prompts removal -- there is no moment at which "
        "a system announces it is no longer worth its cost. Retirement is "
        "therefore a deliberate strategic act rather than housekeeping, and "
        "one nobody's role naturally requires."),

    mcq("AVERAGE",
        "What is the risk of never deciding about an emerging technology?",
        [("It stays under discussion indefinitely, consuming attention "
          "without a decision", True),
         ("Competitors adopt it and gain an unassailable "
          "advantage", False),
         ("The organisation's staff lose interest in "
          "innovation", False),
         ("The technology matures beyond the organisation's ability to "
          "adopt", False)],
        "Acting and deliberately declining are both decisions; leaving it "
        "open is neither, and it recurs in every planning discussion without "
        "ever resolving. Recording that the organisation has decided to watch "
        "-- or to ignore -- costs nothing and stops the same conversation "
        "happening indefinitely."),

    mcq("HARD",
        "An organisation licenses a technology rather than developing "
        "it.\n\nWhat has it accepted?",
        [("Renewal risk, the licensor's terms, and no ownership of the "
          "capability", True),
         ("Higher total cost than developing it would have "
          "required", False),
         ("Responsibility for maintaining the licensed "
          "technology", False),
         ("An obligation to share its own developments with the "
          "licensor", False),
         ],
        "Licensing provides use quickly and provides nothing the "
        "organisation owns, so the terms, the renewal and the licensor's "
        "future decisions all sit outside its control. That is an acceptable "
        "trade for capability that does not differentiate it, and a poor one "
        "for capability it competes on."),

    mcq("AVERAGE",
        "Why is systematic scanning necessary rather than noticing "
        "developments as they arise?",
        [("Organisations notice developments in areas they already "
          "watch", True),
         ("Developments occur faster than any organisation can "
          "follow", False),
         ("Suppliers do not announce developments to existing "
          "customers", False),
         ("Noticing is unreliable in organisations without a research "
          "function", False)],
        "Attention follows existing interest, so an organisation reliably "
        "sees what happens in its own field and misses what arrives from "
        "elsewhere -- which is precisely where substitutes and disruptive "
        "capabilities come from. Systematic categories exist to prompt "
        "attention where nobody is currently looking."),
]

LESSON_BIZ_TECH = lesson(
    MAJOR, MIDDLE,
    "Planning a Technology Development Strategy",
    _tech_quiz,
    lesson_structure(
        "Planning a Technology Development Strategy",
        "A technology strategy decides which capabilities to build, acquire "
        "or leave -- and capability worth building internally is capability "
        "competitors cannot simply buy, since anything purchasable is "
        "available to them on the same terms. This lesson covers systematic "
        "scanning, since organisations notice developments only in areas they "
        "already watch; the early-against-late adoption trade of advantage "
        "against instability; capability as something held by PEOPLE, which "
        "makes it unlike equipment and makes an acquisition transfer less "
        "than it appears; and the retirement decision organisations "
        "consistently avoid.",
        [
            "State the decisions a technology strategy makes",
            "Explain which capabilities are worth building internally",
            "Scan for developments systematically and decide about each",
            "Compare early and late adoption and their trade",
            "Explain the chasm between early adopters and the mainstream",
            "Explain why capability requires continued work and investment",
            "Compare the routes to external technology",
            "Explain why retirement is a strategic decision",
        ],
        75,
        _tech_sections,
        [
            ("Capability worth building",
             "What competitors cannot simply buy. Anything purchasable is "
             "available to them too."),
            ("Systematic scanning",
             "Looking deliberately, since organisations notice developments "
             "only where they already look."),
            ("Early adoption",
             "Advantage and influence, paid for in instability, immature "
             "tools and scarce skills."),
            ("The chasm",
             "A technology valued by early users failing to reach a "
             "mainstream that wants different things."),
            ("Capability retention",
             "Requires work to apply it and conditions people will stay for. "
             "It leaves the building each evening."),
            ("External routes",
             "Licensing, joint development, acquisition and research "
             "collaboration, each with its own cost."),
            ("Technology retirement",
             "The decision organisations avoid, since nothing prompts "
             "removing what was defensible when adopted."),
        ],
        "A technology strategy decides which capabilities the organisation "
        "builds, acquires or leaves, and the one worth BUILDING is the one "
        "competitors cannot simply buy -- since anything purchasable is "
        "available to them on identical terms. Knowing what is coming "
        "requires SYSTEMATIC scanning, because attention follows existing "
        "interest and an organisation reliably misses what arrives from "
        "outside its field; and each development is then decided about -- "
        "act, watch or ignore -- since one left open recurs in every planning "
        "discussion without resolving. Adoption timing trades advantage "
        "against certainty, and is justified where the technology "
        "differentiates the product and rarely elsewhere -- with the CHASM "
        "describing a technology early users valued that never reached a "
        "mainstream wanting reliability rather than possibility. Building "
        "capability is an obligation rather than a purchase: it takes time, "
        "needs continued investment, needs work to apply it, and rests on "
        "PEOPLE who leave every evening -- which is why an acquisition buys "
        "assets and obligations while the capability's essential part remains "
        "voluntary. And retiring technology is the decision organisations "
        "avoid, since each piece was defensible when adopted and nothing "
        "afterwards prompts its removal.",
        exam_notes=[
            desc(
                "Items describe a technology decision and ask what was "
                "misjudged about it."
            ),
            ul([
                "Explaining why an acquisition failed to transfer "
                "capability.",
                "Identifying which capability is worth building.",
                "Stating what early adoption buys and costs.",
                "Explaining the chasm.",
                "Explaining why capability needs work to apply it.",
                "Explaining what licensing accepts.",
                "Explaining why scanning must be systematic.",
            ]),
            desc(
                "For any capability item, ask where the capability actually "
                "resides. If it is in people, then acquiring, contracting or "
                "restructuring around it does considerably less than it "
                "appears to -- which is what these items are built on."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Development plans and innovation
# ==========================================================================

_inno_sections = [
    ("Invention and Innovation", [
        desc(
            "The distinction the syllabus presses hardest, because "
            "organisations reliably produce more of one than the other."
        ),
        image(fig("invention-innovation")),
        table(
            ["", "Invention", "Innovation"],
            [["Is", "A new capability", "A new capability that reached use"],
             ["Succeeds when", "It works", "Somebody adopts it"],
             ["Bounded by", "Technical difficulty",
              "Everything between the laboratory and the customer"],
             ["Organisations produce",
              "More than they can commercialise",
              "Less than they invent"]],
            caption="Two things routinely conflated.",
            footer="The third row is why the distinction matters. Getting "
                   "from a working idea to something people use involves "
                   "production, distribution, support, pricing and "
                   "persuasion -- none of which is technical, and all of "
                   "which the invention did not address."),
        desc(
            "An organisation good at invention and poor at innovation "
            "produces capability that competitors commercialise. That is a "
            "recognisable and expensive pattern, and it is a management "
            "failure rather than a technical one."
        ),
    ]),

    ("Where Innovation Comes From", [
        desc(
            "Innovation is not confined to research, and the syllabus expects "
            "the range."
        ),
        ul([
            "PRODUCT innovation: something new offered to customers.",
            "PROCESS innovation: doing what is already done, differently -- "
            "which frequently returns more and attracts less attention.",
            "BUSINESS MODEL innovation: changing how value is created and "
            "captured rather than what is sold.",
            "INCREMENTAL innovation: many small improvements, which "
            "cumulatively exceed most single advances.",
            "RADICAL innovation: something that changes what is possible, "
            "and is rare.",
        ]),
        desc(
            "INCREMENTAL innovation is undervalued because each step is "
            "unremarkable. An organisation improving continuously outpaces "
            "one waiting for a breakthrough, and the accumulated difference "
            "is difficult for a competitor to close in one move."
        ),
    ]),

    ("Managing Innovation", [
        desc(
            "Innovation is uncertain by definition, which makes managing it "
            "different from managing anything predictable."
        ),
        ol([
            "Generate more ideas than will be pursued, since most will not "
            "work.",
            "Assess them against what the organisation is trying to achieve "
            "rather than on novelty.",
            "Fund a portfolio rather than one bet, since individual outcomes "
            "cannot be predicted.",
            "Stage the funding, so each continuation is a decision informed "
            "by what the previous stage learned.",
            "Stop things deliberately, since the resources released are what "
            "funds the next ones.",
        ]),
        desc(
            "Step five is the one organisations find hardest and need most. "
            "An innovation portfolio where nothing is ever stopped consists "
            "of everything ever started, each consuming a little and none "
            "receiving enough."
        ),
    ]),

    ("Why Innovation Fails Inside Organisations", [
        desc(
            "The obstacles are organisational rather than technical, and they "
            "are consistent enough to be anticipated."
        ),
        compare_grid(
            "WHAT AN ESTABLISHED ORGANISATION IS BUILT FOR",
            "The same properties that make it efficient obstruct innovation.",
            [("Optimised for",
              ["Doing the current thing reliably and cheaply",
               "Predictable returns on investment",
               "Serving existing customers well",
               "Avoiding mistakes"]),
             ("Which obstructs",
              ["Anything requiring a different way of working",
               "Anything whose return cannot be forecast",
               "Anything existing customers do not yet want",
               "Anything that will mostly fail"])]),
        desc(
            "The third row is the recognisable trap. Listening carefully to "
            "existing customers produces improvements they want and misses "
            "what a different market wants -- which is where a competitor "
            "with nothing to protect enters."
        ),
        desc(
            "The usual response is separating the innovation activity so it "
            "is not judged by the same measures. That helps and creates its "
            "own problem, since a separated activity has difficulty getting "
            "its results adopted by the organisation it was separated from."
        ),
    ]),

    ("Technology Development Plans", [
        desc(
            "Turning a technology strategy into activity requires a plan with "
            "the properties uncertainty allows."
        ),
        table(
            ["A development plan states", "Which is possible because"],
            [["What capability is being pursued, and why",
              "The objective is known even when the route is not"],
             ["What is planned in detail for the near term",
              "Enough is known about the next stage"],
             ["What is outlined for the longer term",
              "The information does not exist to plan it in detail"],
             ["What decision each stage informs",
              "Every stage is funded to reduce a specific uncertainty"],
             ["What would cause it to stop",
              "Stopping must be available or the stages are ceremonial"]],
            caption="Five things a technology development plan states.",
            footer="The fourth row is what distinguishes a development plan "
                   "from a project plan. A stage exists to answer a question, "
                   "so its success is measured by whether the question was "
                   "answered rather than by whether the technology "
                   "worked."),
        desc(
            "A ROADMAP is the common form: what capability is expected when, "
            "and what depends on what. Its usefulness comes from showing "
            "DEPENDENCIES, since a capability required by three initiatives "
            "is more urgent than its own importance suggests."
        ),
    ]),

    ("Protecting and Exploiting Results", [
        desc(
            "Development produces results, and what happens to them is "
            "decided rather than left to circumstance."
        ),
        ul([
            "Decide whether to PATENT, which protects in exchange for "
            "publication and a fixed term.",
            "Decide whether to keep it SECRET, which lasts indefinitely and "
            "ends completely on disclosure.",
            "Decide whether to license it out, which produces revenue and "
            "arms competitors.",
            "Decide whether to publish, which builds reputation and gives it "
            "away.",
            "Decide who owns results from collaborations, before the "
            "collaboration rather than after.",
        ]),
        desc(
            "The last point is where collaborations end badly. Ownership of "
            "results is straightforward to agree while nobody knows what the "
            "results will be, and contested afterwards when everybody does."
        ),
    ]),

    ("Sources of Ideas", [
        desc(
            "Innovation begins with ideas, and where an organisation looks "
            "for them determines what it finds."
        ),
        table(
            ["Source", "Produces"],
            [["Customers", "Improvements to what they already have"],
             ["Staff doing the work",
              "Process improvements nobody outside would see"],
             ["Suppliers and partners",
              "Capabilities the organisation did not know existed"],
             ["Other industries",
              "Approaches nobody in this one has tried"],
             ["Formal research", "Capability that did not previously "
                                 "exist"]],
            caption="Five sources and what each characteristically yields.",
            footer="CUSTOMERS produce improvements and rarely produce "
                   "departures, since they describe what they want in terms "
                   "of what they know. That is why listening to them "
                   "carefully is necessary and insufficient."),
        desc(
            "Staff doing the work are the source organisations most "
            "underuse. They see the waste, the workarounds and the "
            "frustrations daily, and whether any of it reaches anybody "
            "depends entirely on whether a route exists and whether "
            "suggestions visibly produce anything."
        ),
    ]),

    ("Measuring Innovation", [
        desc(
            "Innovation is measured badly by activity and well by outcome, "
            "and choosing which decides what an organisation gets."
        ),
        compare_grid(
            "ACTIVITY MEASURES AGAINST OUTCOME MEASURES",
            "What was done, against what it produced.",
            [("Activity",
              ["Ideas submitted, projects started, spending",
               "Easy to collect and easy to improve",
               "Improvable without producing anything",
               "Rewards starting rather than finishing"]),
             ("Outcome",
              ["Revenue from products introduced recently",
               "Cost reduced by process changes adopted",
               "Time from idea to something in use",
               "Harder to attribute, and far harder to game"])]),
        desc(
            "TIME FROM IDEA TO USE is the measure that most directly "
            "addresses the invention-innovation gap, since it measures "
            "exactly the distance organisations struggle to cross rather "
            "than either end of it."
        ),
    ]),

    ("Open Innovation", [
        desc(
            "Ideas and capability need not come from inside, and the "
            "syllabus recognises the arrangements that use outside sources."
        ),
        ul([
            "Collaborating with universities or research institutes, which "
            "gives access to work no single organisation would fund.",
            "Working with smaller companies whose capability is specific and "
            "whose scale is not.",
            "Licensing in what somebody else developed, rather than "
            "recreating it.",
            "Licensing out what the organisation will not commercialise "
            "itself, which is otherwise pure loss.",
            "Participating in shared or open development, contributing to "
            "something several parties depend on.",
        ]),
        desc(
            "The fourth point addresses a specific waste. An organisation "
            "with capability it has decided not to pursue can license it "
            "rather than shelving it -- and shelving is the default, which "
            "produces nothing for anybody."
        ),
    ]),

    ("Adoption Inside the Organisation", [
        desc(
            "An innovation must be adopted by the organisation before it can "
            "be adopted by anybody else, and that is its own obstacle."
        ),
        ol([
            "Establish who must adopt it and what it asks of them.",
            "Establish what it displaces, since something usually has to "
            "stop.",
            "Demonstrate it working somewhere small and real, since a "
            "demonstration persuades where a description does not.",
            "Support the people adopting it, since they carry the "
            "disruption.",
            "Retire the alternative, or people under pressure return to it.",
        ]),
        desc(
            "This is the utilisation problem of System Strategy applied "
            "internally, and it explains why innovations developed in a "
            "separated unit struggle: they must be adopted by an organisation "
            "that did not develop them and is measured on doing something "
            "else."
        ),
    ]),

    ("Culture and Innovation", [
        desc(
            "An organisation's habits determine whether ideas surface at all, "
            "before any process can act on them."
        ),
        compare_grid(
            "WHAT ENCOURAGES IDEAS AND WHAT SUPPRESSES THEM",
            "Both are produced by how the organisation treats attempts.",
            [("Encourages",
              ["Failure treated as information when the attempt was sound",
               "Ideas visibly acted on, or visibly declined with a reason",
               "Time and permission to try something",
               "Credit given to the people who contributed"]),
             ("Suppresses",
              ["Failure treated as a personal shortcoming",
               "Suggestions received and never mentioned again",
               "Every hour accounted for against existing work",
               "Ideas absorbed without attribution"])]),
        desc(
            "The second entry on the right does more damage than an outright "
            "refusal. Somebody whose suggestion disappeared silently "
            "concludes that suggesting is pointless, and that conclusion "
            "spreads considerably faster than any encouragement to "
            "contribute."
        ),
    ]),

    ("Innovation and the Customer",[
        desc(
            "An innovation is only an innovation once somebody adopts it, "
            "which makes the customer's perspective part of the work rather "
            "than the last step."
        ),
        ol([
            "Establish what problem it solves for somebody, in their terms "
            "rather than in the technology's.",
            "Establish what they currently do instead, since that is what it "
            "must beat.",
            "Establish what adopting would cost them -- money, effort, "
            "learning, and risk.",
            "Reduce that cost, since adoption fails on it more often than on "
            "the benefit being insufficient.",
            "Test with real users early, since what they do reveals what "
            "asking them does not.",
        ]),
        desc(
            "Step three is what technically-led innovation omits. A "
            "capability offering a genuine improvement can still be declined "
            "because adopting it means changing how people work -- and that "
            "cost is real, is borne by the adopter, and is invisible to "
            "whoever built it."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where innovation items are lost."),
        ul([
            "Confusing invention with innovation. The second requires "
            "somebody to adopt it.",
            "Treating innovation as product innovation only, when process and "
            "business model innovation frequently return more.",
            "Undervaluing incremental improvement, which accumulates into "
            "advantage.",
            "Funding one bet rather than a portfolio, when individual "
            "outcomes cannot be predicted.",
            "Never stopping anything, so everything is underfunded.",
            "Judging innovation by the measures that govern existing "
            "operations.",
            "Agreeing collaboration ownership after the results exist.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A research group produces a working prototype of a valuable "
            "capability. Three years later a competitor is selling a product "
            "based on the same idea and the organisation has nothing. What "
            "happened?\""
        ),
        ol([
            "Establish what the organisation achieved: an INVENTION -- a new "
            "capability that works.",
            "Establish what it did not achieve: getting it into use, which is "
            "INNOVATION.",
            "The gap between them contains production, distribution, "
            "support, pricing and persuasion, none of which is technical.",
            "The competitor succeeded at that gap rather than at the "
            "invention, which they may not even have made first.",
            "The failure is managerial: nothing carried the result from a "
            "working prototype through to something customers could buy.",
        ]),
        desc(
            "This pattern is common enough that the syllabus names it. Being "
            "good at invention and poor at commercialisation means "
            "systematically funding capability that competitors "
            "commercialise, which is worse than not having invented it."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Innovation connects to strategy and to delivery."),
        ul([
            "The capability decisions come from the previous lesson.",
            "Patent-or-secret is the Development Technology intellectual "
            "property decision.",
            "Staged funding is the governance principle of stage gates.",
            "Portfolio funding parallels project portfolio management.",
            "Incremental improvement is the continual improvement of Service "
            "Management.",
            "Getting results adopted is the utilisation concern of System "
            "Strategy.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Invention against innovation",
              "A new capability, against one that reached use",
              "The gap between them is production, distribution, support and "
              "persuasion -- none of it technical."),
             ("The undervalued kind of innovation",
              "Incremental, and process rather than product",
              "Each step is unremarkable and the accumulation outpaces "
              "waiting for a breakthrough."),
             ("Why a portfolio rather than one bet",
              "Individual outcomes cannot be predicted",
              "Which is what makes uncertainty manageable in aggregate."),
             ("The hardest step in managing innovation",
              "Stopping things deliberately",
              "Otherwise the portfolio is everything ever started, each "
              "underfunded."),
             ("Why established organisations obstruct innovation",
              "The properties making them efficient are the obstacles",
              "Including listening carefully to existing customers."),
             ("What a development stage's success means",
              "The question it existed to answer was answered",
              "Not that the technology worked, which is a different "
              "result.")]),
    ]),
]

_inno_quiz = [
    mcq("HARD",
        "A research group produces a working prototype. Three years later a "
        "competitor sells a product based on the same idea and the "
        "organisation has nothing.\n\nWhat happened?",
        [("It achieved invention and not innovation -- nothing carried the "
          "result into use", True),
         ("The competitor's technical implementation of the same idea was "
          "superior", False),
         ("The intellectual property was inadequately "
          "protected", False),
         ("The research was funded for too short a period", False)],
        "An invention is a new capability; an innovation is one that reached "
        "use, and the gap between them contains production, distribution, "
        "support, pricing and persuasion -- none of it technical. The "
        "competitor succeeded at that gap, possibly without inventing first. "
        "Being strong at invention and weak at commercialisation funds "
        "capability that others commercialise."),

    mcq("AVERAGE",
        "What distinguishes an innovation from an invention?",
        [("An innovation has reached use; an invention need only "
          "work", True),
         ("An innovation is protected by intellectual property "
          "rights", False),
         ("An innovation is incremental while an invention is "
          "radical", False),
         ("An innovation arises from research while an invention arises from "
          "practice", False)],
        "The test is adoption. A capability that works and that nobody uses "
        "is an invention; one somebody has adopted is an innovation -- and "
        "everything between them is production, distribution, support and "
        "persuasion, which is why the second is harder and why organisations "
        "produce more of the first."),

    mcq("HARD",
        "Why is incremental innovation undervalued relative to what it "
        "produces?",
        [("Each step is unremarkable, though the accumulation outpaces "
          "waiting for a breakthrough", True),
         ("It requires considerably less technical skill than radical "
          "innovation does", False),
         ("Its benefits appear only in long-term financial "
          "results", False),
         ("It cannot be protected by patents or other rights", False),
         ],
        "No individual improvement is impressive enough to be noticed, so "
        "attention and funding go to the search for something dramatic. An "
        "organisation improving continuously accumulates a difference that is "
        "difficult for a competitor to close in one move -- which is exactly "
        "what makes it valuable and invisible."),

    mcq("AVERAGE",
        "Why should innovation be funded as a portfolio rather than as a "
        "single project?",
        [("Individual outcomes cannot be predicted, so the aggregate is what "
          "is manageable", True),
         ("Portfolios attract more organisational funding than individual "
          "projects can", False),
         ("A portfolio allows resources to be shared between "
          "projects", False),
         ("Individual projects cannot be assessed against strategic "
          "objectives", False)],
        "Innovation is uncertain by definition and most attempts will not "
        "work, so betting on one is betting on an outcome nobody can "
        "forecast. Funding several accepts that most will fail and manages "
        "the uncertainty in aggregate -- which is only sustainable if the "
        "failures are stopped, releasing resources for the next ones."),

    mcq("HARD",
        "Why do the properties that make an established organisation "
        "efficient obstruct innovation?",
        [("Reliability, predictable returns and existing customers all argue "
          "against uncertain new things", True),
         ("Efficient organisations employ fewer dedicated research staff "
          "than others do", False),
         ("Established processes cannot accommodate new "
          "technology", False),
         ("Efficiency measures penalise experimental spending "
          "specifically", False)],
        "An organisation optimised for doing the current thing reliably, "
        "forecasting its returns and serving existing customers is optimised "
        "against anything uncertain, unforecastable and wanted by somebody "
        "else. Listening carefully to existing customers is the trap, since "
        "it produces what they want and misses what a different market "
        "does."),

    mcq("AVERAGE",
        "What does the success of a technology development stage actually "
        "measure?",
        [("Whether the question the stage existed to answer was "
          "answered", True),
         ("Whether the technology worked as it was intended to", False),
         ("Whether the stage completed within its budget", False),
         ("Whether the next stage can now proceed", False)],
        "Each stage is funded to reduce a specific uncertainty, so "
        "establishing that an approach does NOT work is a successful stage -- "
        "it answered the question, and cheaply. Judging stages by whether the "
        "technology worked means every negative result is a failure, which "
        "makes nobody willing to test the risky assumptions first."),

    mcq("HARD",
        "Which kind of innovation frequently returns more than product "
        "innovation while attracting less attention?",
        [("Process innovation -- doing what is already done, "
          "differently", True),
         ("Radical innovation that changes what is possible "
          "altogether", False),
         ("Innovation arising from formal research programmes", False),
         ("Innovation in how products are marketed", False)],
        "Changing how something is done affects every unit produced from then "
        "on, and it is invisible to customers so it attracts none of the "
        "attention a new product does. Business model innovation -- changing "
        "how value is created and captured -- is the other undervalued kind "
        "for the same reason."),

    mcq("AVERAGE",
        "When should ownership of results from a collaboration be agreed?",
        [("Before the collaboration begins", True),
         ("When the first results are produced", False),
         ("When one party wishes to commercialise something", False),
         ("At the end of the collaboration's agreed term", False)],
        "Ownership is straightforward to agree while nobody knows what the "
        "results will be and contested the moment everybody does. Agreeing it "
        "in advance costs a conversation; agreeing it afterwards is a "
        "negotiation between parties who now know exactly what is at stake."),

    mcq("HARD",
        "An innovation portfolio contains everything ever started, and each "
        "receives a small amount of funding.\n\nWhat is wrong?",
        [("Nothing is being stopped, so nothing receives enough to "
          "succeed", True),
         ("The portfolio has become too diverse to be managed "
          "coherently at all", False),
         ("Insufficient total funding has been allocated to "
          "innovation", False),
         ("The projects were not assessed against strategic "
          "objectives", False)],
        "Stopping is what releases resources for the next attempts, so a "
        "portfolio where nothing stops accumulates indefinitely and spreads "
        "its funding thinner each year. Every item is then underfunded, which "
        "guarantees the failures the reluctance to stop was meant to avoid."),

    mcq("AVERAGE",
        "What does a technology roadmap's value chiefly come from?",
        [("Showing dependencies between capabilities", True),
         ("Committing the organisation to delivery dates", False),
         ("Communicating the technology strategy to staff", False),
         ("Recording which technologies have been evaluated", False)],
        "A capability three initiatives depend on is more urgent than its own "
        "importance suggests, and that is invisible without seeing what "
        "depends on what. Dates in a technology roadmap are necessarily "
        "uncertain, which is why the dependencies rather than the timing "
        "carry the value."),
]

LESSON_BIZ_INNO = lesson(
    MAJOR, MIDDLE,
    "Technology Development Plans and Innovation Management",
    _inno_quiz,
    lesson_structure(
        "Technology Development Plans and Innovation Management",
        "An INVENTION is a new capability and an INNOVATION is one that "
        "reached use, and the gap between them contains production, "
        "distribution, support, pricing and persuasion -- none of it "
        "technical, which is why organisations produce far more of the first. "
        "This lesson covers where innovation comes from including the process "
        "and incremental kinds that return most and attract least attention, "
        "managing it as a PORTFOLIO with staged funding and deliberate "
        "stopping, why established organisations obstruct it through the "
        "properties that make them efficient, and development plans whose "
        "stages succeed by answering a question rather than by the technology "
        "working.",
        [
            "Distinguish invention from innovation and explain the gap",
            "Describe the kinds of innovation and identify the undervalued "
            "ones",
            "Manage innovation as a portfolio with staged funding",
            "Explain why deliberate stopping is necessary",
            "Explain why established organisations obstruct innovation",
            "State what a technology development plan contains",
            "Explain what a development stage's success measures",
            "Decide how to protect and exploit development results",
        ],
        75,
        _inno_sections,
        [
            ("Invention against innovation",
             "A new capability, against one that reached use. The gap is "
             "everything non-technical."),
            ("Process innovation",
             "Doing what is already done differently. Frequently returns more "
             "and attracts less attention."),
            ("Incremental innovation",
             "Many small improvements, accumulating into a difference hard to "
             "close in one move."),
            ("Portfolio funding",
             "Several attempts rather than one bet, since individual outcomes "
             "cannot be predicted."),
            ("Deliberate stopping",
             "What releases resources for the next attempts. Its absence "
             "leaves everything underfunded."),
            ("The incumbent's obstacle",
             "Reliability, forecastable returns and existing customers all "
             "argue against uncertain new things."),
            ("Development stage success",
             "The question the stage existed to answer was answered -- "
             "including negatively."),
            ("Technology roadmap",
             "What capability when, and what depends on what. The "
             "dependencies carry the value."),
        ],
        "An INVENTION works; an INNOVATION reached use -- and everything "
        "between them is production, distribution, support, pricing and "
        "persuasion, none of it technical, which is why organisations "
        "reliably produce more inventions than innovations and sometimes fund "
        "capability their competitors commercialise. Innovation is not only "
        "in products: PROCESS and business model innovation frequently return "
        "more while attracting less attention, and INCREMENTAL improvement "
        "accumulates into a difference a competitor cannot close in one move. "
        "It is managed as a PORTFOLIO with staged funding, since individual "
        "outcomes cannot be forecast -- and the hardest and most necessary "
        "discipline is stopping things, because a portfolio where nothing "
        "stops contains everything ever started, each underfunded. "
        "Established organisations obstruct innovation through exactly the "
        "properties that make them efficient, including listening carefully "
        "to existing customers, which produces what those customers want and "
        "misses what a different market does. And a development plan's stages "
        "succeed by ANSWERING their question -- including negatively, which "
        "is a cheap and valuable result -- rather than by the technology "
        "working.",
        exam_notes=[
            desc(
                "Items describe a technology outcome and ask which part of "
                "the process failed."
            ),
            ul([
                "Distinguishing invention from innovation in a described "
                "failure.",
                "Identifying the undervalued kinds of innovation.",
                "Explaining portfolio funding.",
                "Explaining why stopping matters.",
                "Explaining the incumbent's obstacle.",
                "Stating what a development stage measures.",
                "Timing collaboration ownership agreements.",
            ]),
            desc(
                "When something worked technically and produced nothing "
                "commercially, the failure is in the gap between invention "
                "and innovation. Nothing in that gap is technical, which is "
                "why organisations strong at the first are frequently poor at "
                "the second."
            ),
        ],
    ))

LESSONS = [LESSON_BIZ_TECH, LESSON_BIZ_INNO]

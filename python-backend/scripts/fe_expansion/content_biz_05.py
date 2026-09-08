"""Business Strategy -> Business Industry, lessons 3 to 5.

e-Business, consumer appliances and embedded consumer systems, and industrial
devices and IoT.

The embedded lessons carry a constraint the rest of the certification does
not: a device shipped to a customer cannot be visited, so everything about
updating, failing and being secured has to work without anybody attending it.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Business Strategy"
MIDDLE = "Business Industry"

# ==========================================================================
# Lesson 1: e-Business
# ==========================================================================

_ec_sections = [
    ("Trading Electronically", [
        desc(
            "Electronic commerce is trade conducted over networks, and the "
            "syllabus classifies it by who the parties are -- because the "
            "parties determine the obligations."
        ),
        image(fig("ec-models")),
        table(
            ["Model", "Between", "Characterised by"],
            [["B2C", "A business and consumers",
              "Many small transactions, and consumer protection law"],
             ["B2B", "Businesses",
              "Fewer, larger, negotiated, with system integration"],
             ["C2C", "Consumers, through a platform",
              "The platform provides trust rather than goods"],
             ["G2C and G2B", "Government and citizens or businesses",
              "Obligation rather than choice on one side"]],
            caption="Four models, distinguished by the parties.",
            footer="The LAW follows the parties. Consumer protection rules "
                   "apply to B2C and generally not to B2B, so the same "
                   "transaction carries different obligations depending "
                   "entirely on who is buying."),
    ]),

    ("What Changed", [
        desc(
            "Electronic trading altered specific economics, and the syllabus "
            "expects the mechanisms rather than enthusiasm."
        ),
        ul([
            "REACH became affordable, so a small seller can address a market "
            "that previously required scale.",
            "SEARCH became cheap for buyers, which increased price "
            "transparency and competition.",
            "INTERMEDIARIES became removable where their only contribution "
            "was reach -- and new ones appeared where trust or aggregation "
            "was needed.",
            "The LONG TAIL became viable: products selling rarely are worth "
            "stocking when the storefront is not physical.",
            "Transaction costs fell, which made small transactions "
            "economically possible.",
        ]),
        desc(
            "DISINTERMEDIATION and re-intermediation happened together. "
            "Intermediaries whose value was distribution were bypassed, and "
            "new ones providing search, trust and payment appeared -- which "
            "is why the middle did not disappear so much as change what it "
            "was for."
        ),
    ]),

    ("Electronic Payment", [
        desc(
            "Trading requires paying, and the mechanisms differ in who "
            "carries the risk of the payment failing or being disputed."
        ),
        table(
            ["Method", "Characterised by"],
            [["Card payment",
              "Familiar, with chargeback rights favouring the buyer"],
             ["Bank transfer",
              "Cheap, and generally irreversible once made"],
             ["Payment intermediary",
              "The buyer's details are not given to the seller"],
             ["Digital and mobile wallets",
              "Convenience, and a further party in the chain"],
             ["Invoice and credit terms",
              "Normal in B2B, and the seller carries the credit risk"]],
            caption="Five payment mechanisms.",
            footer="CHARGEBACK is the mechanism that shapes card commerce. A "
                   "buyer disputing a transaction can have it reversed, "
                   "which protects them and places the risk of dispute on "
                   "the seller -- and it is why sellers care about evidence "
                   "of delivery."),
        desc(
            "All of it depends on the security of the Security category: "
            "encryption in transit, authentication of the parties, and "
            "protection of stored card data under the payment card "
            "obligations that lesson describes."
        ),
    ]),

    ("Trust", [
        desc(
            "Trading with somebody unseen requires trust that physical "
            "presence supplied, and it has to be constructed."
        ),
        ol([
            "Identity: evidence the seller is who they claim, of which a "
            "certificate proves only the domain.",
            "Reputation: what previous buyers experienced, which platforms "
            "exist substantially to provide.",
            "Payment protection: mechanisms letting a buyer recover if "
            "something goes wrong.",
            "Clear terms: what is being bought, what happens if it is wrong, "
            "and what rights the buyer has.",
            "Data protection: what the seller does with what they collect.",
        ]),
        desc(
            "REPUTATION systems are what many platforms actually sell. A "
            "marketplace's contribution is frequently not distribution but "
            "the accumulated record that makes strangers willing to transact "
            "-- which is why the platform, rather than the seller, is what "
            "buyers trust."
        ),
    ]),

    ("Digital Marketing", [
        desc(
            "Electronic channels changed marketing by making response "
            "measurable, which changed what could be done and what gets "
            "over-weighted."
        ),
        compare_grid(
            "WHAT MEASURABILITY ENABLED AND WHAT IT DISTORTS",
            "The same property, two consequences.",
            [("Enabled",
              ["Response measured per message rather than estimated",
               "Targeting by behaviour rather than only demographics",
               "Testing alternatives against real audiences",
               "Spending directed to what demonstrably works"]),
             ("Distorts",
              ["Attention towards what is easy to measure",
               "Immediate response valued over long-term effect",
               "Attribution claimed by whichever channel was last",
               "Optimisation of the measure rather than the outcome"])]),
        desc(
            "The right-hand column's second entry is the one with lasting "
            "consequences. Brand effect is real and hard to measure, so an "
            "organisation optimising purely for measured response gradually "
            "stops doing what it cannot see working."
        ),
    ]),

    ("Obligations in Electronic Trade", [
        desc(
            "Trading electronically attracts obligations that the syllabus "
            "expects to be recognised."
        ),
        ul([
            "Consumer protection: information before purchase, cancellation "
            "rights, and remedies where goods are faulty.",
            "Data protection: lawful basis for collecting, security, and the "
            "rights of the people whose data it is.",
            "Payment card obligations, imposed contractually by the card "
            "networks on anyone processing cards.",
            "Distance selling rules, which frequently give buyers rights "
            "that in-person purchases do not.",
            "Jurisdiction, since a seller reachable from anywhere may be "
            "subject to more than one country's law.",
        ]),
        desc(
            "The last point is the one electronic trade created. A shop "
            "serves whoever walks in; a website is reachable from everywhere, "
            "and which law applies to a dispute is a genuine question rather "
            "than an obvious one."
        ),
    ]),

    ("Fulfilment and Logistics", [
        desc(
            "An electronic sale ends with something arriving, and that half "
            "is physical however electronic the transaction was."
        ),
        table(
            ["Concern", "Why it decides the outcome"],
            [["Availability accuracy",
              "Selling what is not there produces the worst customer "
              "experience available"],
             ["Delivery speed and cost",
              "Frequently the deciding factor between sellers"],
             ["Tracking visibility",
              "Customers tolerate waiting far better than not knowing"],
             ["Returns handling",
              "Distance selling gives rights that make returns "
              "routine"],
             ["Cross-border complications",
              "Duties, taxes and customs, which surprise buyers"]],
            caption="Five fulfilment concerns.",
            footer="The third row is the cheapest improvement available. A "
                   "customer who can see where their order is complains far "
                   "less than one waiting the same time without "
                   "information."),
        desc(
            "RETURNS are a structural cost of distance selling rather than an "
            "exception. Buyers cannot examine goods beforehand and have "
            "rights to change their minds, so the return rate is a "
            "characteristic of the channel that must be designed and priced "
            "for."
        ),
    ]),

    ("Platforms and Marketplaces", [
        desc(
            "A large share of electronic trade happens through platforms "
            "rather than directly, which changes the seller's position."
        ),
        compare_grid(
            "SELLING DIRECTLY AGAINST SELLING THROUGH A PLATFORM",
            "Reach and trust, against control and margin.",
            [("Directly",
              ["The customer relationship is yours",
               "The full margin, and the full cost of reaching buyers",
               "Your terms, your data, your presentation",
               "Building trust from nothing"]),
             ("Through a platform",
              ["Immediate reach and inherited trust",
               "Commission, and rules you did not write",
               "The platform owns the customer relationship",
               "Competing against others on the same page, including the "
               "platform"])]),
        desc(
            "The last entry on the right is the position sellers "
            "underestimate. A platform sees what sells well and can compete "
            "with its own sellers, which is a dependency created by using it "
            "and not removable afterwards."
        ),
    ]),

    ("Analytics in Electronic Trade", [
        desc(
            "Electronic channels record what visitors did, which supports "
            "improvement in ways physical retail cannot."
        ),
        ul([
            "What proportion of visitors buy, and where the others stopped.",
            "Which routes through the site lead to purchases, and which "
            "lead nowhere.",
            "Which changes improve outcomes, established by testing "
            "alternatives against real visitors.",
            "What people searched for and did not find, which is a "
            "requirement nobody submitted.",
            "All of it collected under obligations about personal data that "
            "apply whatever is technically possible.",
        ]),
        desc(
            "The fourth point is the most productive and least used. Searches "
            "returning nothing record exactly what customers wanted and the "
            "seller did not have -- a demand signal available nowhere else "
            "and free to collect."
        ),
    ]),

    ("Trust and Reputation Online", [
        desc(
            "A buyer who cannot handle the goods or meet the seller is "
            "deciding on substitutes for both."
        ),
        ul([
            "Reviews from other buyers, which carry weight precisely because "
            "the seller did not write them -- and are therefore worth faking.",
            "Ratings accumulated over time, which a new seller cannot have "
            "and an established one cannot quickly lose.",
            "Visible identity: a real address, a company number, a way to "
            "reach a person.",
            "Clear terms on returns and complaints, stated before purchase "
            "rather than discovered after it.",
            "Recognised payment methods, which carry their own protections "
            "and lend them to the seller.",
        ]),
        desc(
            "The last point is the one sellers underestimate. Offering a "
            "familiar payment method is partly a trust decision rather than a "
            "convenience one: the buyer is relying on the payment provider's "
            "protection, which lets them buy from a seller they have no "
            "reason to trust yet."
        ),
    ]),

    ("Pricing in Electronic Channels", [
        desc(
            "Prices online are visible to everybody at once, including "
            "competitors, which changes how they behave."
        ),
        compare_grid(
            "PHYSICAL PRICING AGAINST ONLINE PRICING",
            "Occasionally revised, against continuously contested.",
            [("Physical",
              ["Changing a price is a physical task",
               "Comparison requires visiting several shops",
               "Local competition only",
               "Prices are stable for long periods"]),
             ("Online",
              ["Changing a price costs nothing",
               "Comparison takes seconds, and is automated",
               "Competition is anyone who can deliver",
               "Prices move constantly, sometimes automatically"])]),
        desc(
            "Automatic repricing against competitors is where this becomes a "
            "systems problem rather than a commercial one. Two sellers each "
            "undercutting the other by rule will race each other to the "
            "floor, so the rules need limits that a person set deliberately."
        ),
    ]),

    ("Accessibility and Reach", [
        desc(
            "An electronic shop that some people cannot use has excluded "
            "customers rather than merely inconvenienced them."
        ),
        ul([
            "The site works with assistive technology, which is a legal "
            "requirement in many jurisdictions and not only good practice.",
            "It works on the devices people actually have, which are mostly "
            "phones on imperfect connections.",
            "It does not depend on a particular browser or a plug-in.",
            "Language and currency suit the customers being sold to.",
            "Pages are usable when they load slowly, rather than only when "
            "everything has arrived.",
        ]),
        desc(
            "The second point outranks the others commercially. A checkout "
            "that is awkward on a phone is awkward for the majority of "
            "visitors, and the abandoned purchases never appear as complaints "
            "-- they appear as a conversion rate nobody can explain."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where e-business items are lost."),
        ul([
            "Assuming consumer protection applies to B2B transactions.",
            "Treating disintermediation as the whole story, when new "
            "intermediaries appeared providing trust.",
            "Assuming a certificate establishes that a seller is "
            "trustworthy.",
            "Ignoring chargeback risk, which places dispute risk on the "
            "seller.",
            "Optimising purely for measured response, which abandons what "
            "cannot be measured.",
            "Assuming one jurisdiction applies to a site reachable "
            "everywhere.",
            "Treating a platform's value as distribution when it is "
            "frequently reputation.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An online retailer disputes a chargeback, arguing the goods "
            "were despatched. What determines the outcome, and what should "
            "the retailer have done?\""
        ),
        ol([
            "Establish what a chargeback is: a buyer's dispute reversing a "
            "card transaction, with the risk falling on the seller.",
            "The dispute turns on EVIDENCE -- what the seller can demonstrate "
            "about what was sent and received.",
            "Despatching is not the same as delivery being demonstrable, and "
            "an assertion is not evidence.",
            "So the retailer needed proof of delivery to the address the "
            "card was billed to, retained and retrievable.",
            "Which means the evidence had to be collected as a matter of "
            "course, before any dispute existed -- since it cannot be "
            "obtained afterwards.",
        ]),
        desc(
            "The general point applies throughout electronic trade. The "
            "mechanisms protecting buyers place evidential burdens on "
            "sellers, and those are met by routine record-keeping rather than "
            "by argument when a dispute arises."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("e-Business draws on several categories."),
        ul([
            "The web request, TLS and certificates come from the network "
            "applications lesson.",
            "Payment card obligations are the contractual scheme of the "
            "Security category.",
            "Data protection obligations come from Legal Affairs.",
            "Channel choice and disintermediation are the marketing "
            "lesson.",
            "Measurable response is the digital marketing caution of that "
            "lesson.",
            "Platform reputation systems are a trust mechanism rather than a "
            "technology.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What the commerce model determines",
              "Which obligations apply",
              "Consumer protection applies to B2C and generally not to B2B."),
             ("What happened to intermediaries",
              "Some were removed and new ones appeared",
              "Those whose value was distribution went; those providing trust "
              "and aggregation arrived."),
             ("What chargeback places on the seller",
              "The risk of a dispute, and an evidential burden",
              "Which is met by routine record-keeping rather than by argument "
              "afterwards."),
             ("What measurability distorts",
              "Attention towards what is easy to measure",
              "Immediate response is measurable and brand effect is not, so "
              "one gradually displaces the other."),
             ("What a platform frequently actually sells",
              "Reputation, rather than distribution",
              "The accumulated record is what makes strangers willing to "
              "transact."),
             ("What electronic reach created legally",
              "A jurisdiction question",
              "A site reachable everywhere may be subject to more than one "
              "country's law.")]),
    ]),
]

_ec_quiz = [
    mcq("HARD",
        "An online retailer disputes a chargeback, arguing the goods were "
        "despatched.\n\nWhat determines the outcome?",
        [("The evidence the seller can produce about delivery", True),
         ("Whether the retailer's terms excluded chargeback "
          "rights", False),
         ("Whether the buyer contacted the retailer before "
          "disputing", False),
         ("Whether the payment was processed through a card or a "
          "transfer", False)],
        "A chargeback places the risk of a dispute on the seller, and the "
        "dispute turns on what can be demonstrated rather than asserted -- "
        "despatch is not the same as demonstrable delivery. The evidence has "
        "to be collected routinely, before any dispute exists, since it "
        "cannot be obtained afterwards."),

    mcq("AVERAGE",
        "Which commerce model does consumer protection law generally apply "
        "to?",
        [("B2C", True),
         ("B2B", False),
         ("Both equally, since the transaction is the same", False),
         ("Neither, since electronic transactions are governed "
          "separately", False)],
        "Consumer protection exists because an individual buyer is presumed "
        "to be in a weaker position than a business seller. Between two "
        "businesses that presumption does not hold, so the parties are "
        "treated as negotiating on more equal terms -- which means the same "
        "transaction carries different obligations depending on who is "
        "buying."),

    mcq("HARD",
        "What happened to intermediaries as electronic trade grew?",
        [("Those whose value was distribution were bypassed; new ones "
          "providing trust appeared", True),
         ("They were eliminated as sellers reached buyers "
          "directly", False),
         ("Their margins increased as transaction volumes "
          "rose", False),
         ("They shifted from consumer to business markets", False)],
        "Disintermediation and re-intermediation happened together. Reaching "
        "buyers directly became affordable, so intermediaries contributing "
        "only reach lost their function -- and new ones appeared providing "
        "search, reputation, payment and aggregation, which is why the middle "
        "changed what it was for rather than disappearing."),

    mcq("AVERAGE",
        "Marketplace platforms frequently provide something other than "
        "what sellers assume.\n\nWhat?",
        [("Reputation, making strangers willing to transact", True),
         ("Distribution that sellers could not achieve", False),
         ("Lower prices through negotiated supplier terms", False),
         ("Legal protection against fraudulent sellers", False)],
        "Reaching buyers is no longer the difficult part; being trusted by "
        "somebody who has never heard of you is. The accumulated record of "
        "previous transactions is what a platform supplies, which is why "
        "buyers trust the platform rather than the individual seller and why "
        "sellers pay to be on it."),

    mcq("HARD",
        "Why does optimising purely for measured response distort marketing "
        "over time?",
        [("Effects that cannot be measured are gradually stopped, whatever "
          "their value", True),
         ("Measurement systems overstate the response they "
          "record", False),
         ("Measured channels are more expensive than unmeasured "
          "ones", False),
         ("Response measurement requires personal data that becomes "
          "restricted", False)],
        "Immediate response is measurable and long-term brand effect is not, "
        "so an organisation directing spending by measured return "
        "progressively withdraws from activities whose benefit it cannot see. "
        "The benefit does not stop being real, and the measurement system "
        "cannot represent it."),

    mcq("AVERAGE",
        "The long tail describes something specific in electronic "
        "commerce.\n\nWhat?",
        [("Products selling rarely become viable to stock when the storefront "
          "is not physical", True),
         ("The extended period over which online customers make "
          "decisions", False),
         ("The delay between an order being placed and being "
          "delivered", False),
         ("The continuing costs of supporting a product after "
          "sale", False)],
        "Physical shelf space forces a retailer to stock only what sells "
        "often. Without that constraint, a product selling a handful of times "
        "a year can be listed profitably, and the aggregate of many such "
        "products becomes substantial -- which is a market that simply did "
        "not exist before."),

    mcq("HARD",
        "What legal question did electronic reach create that physical "
        "trading did not?",
        [("Which country's law applies, since a site is reachable from "
          "everywhere", True),
         ("Whether an electronic contract is legally "
          "binding", False),
         ("Whether digital goods attract the same protections as "
          "physical ones", False),
         ("Whether a seller must disclose its physical "
          "location", False),
         ],
        "A shop serves whoever walks in and is plainly subject to its own "
        "jurisdiction. A site reachable from everywhere may be subject to the "
        "law of any country whose residents it serves, so which applies to a "
        "dispute is a genuine question -- and one a seller has to consider "
        "before it arises."),

    mcq("AVERAGE",
        "What does a TLS certificate on a retail site establish?",
        [("That the connection is to the domain named in it", True),
         ("That the seller is a legitimate business", False),
         ("That payment details are handled securely by the "
          "seller", False),
         ("That the site complies with consumer protection "
          "obligations", False)],
        "The certificate binds a key to a domain and enables encryption to "
        "it, which is exactly what it establishes and no more. A convincing "
        "fraudulent site can hold a perfectly valid certificate -- so the "
        "padlock proves which domain you reached rather than whether that "
        "domain deserves your money."),

    mcq("HARD",
        "In B2B electronic commerce, what matters more than in B2C?",
        [("Integration between the two organisations' systems", True),
         ("Convenience of the payment mechanism", False),
         ("The visual design of the purchasing interface", False),
         ("The speed at which orders are confirmed", False)],
        "B2B transactions are fewer, larger and repeated between the same "
        "parties, so exchanging orders, confirmations and invoices between "
        "systems removes work on both sides. Consumers transact once and "
        "value convenience; organisations transact continuously and value "
        "the removal of re-keying."),

    mcq("AVERAGE",
        "Which payment method places the credit risk on the seller?",
        [("Invoice with credit terms", True),
         ("Card payment", False),
         ("Bank transfer in advance", False),
         ("A payment intermediary holding funds", False)],
        "Supplying goods against an invoice payable later means the seller "
        "has delivered and is waiting to be paid, carrying the risk that "
        "payment does not arrive. It is normal in business trade, where the "
        "parties have a continuing relationship -- and it is why credit "
        "assessment is part of B2B selling."),
]

LESSON_BIZ_EC = lesson(
    MAJOR, MIDDLE,
    "e-Business: EC, Electronic Payment and Digital Marketing",
    _ec_quiz,
    lesson_structure(
        "e-Business: EC, Electronic Payment and Digital Marketing",
        "Electronic commerce is classified by the PARTIES, because the "
        "parties determine the obligations -- consumer protection applies to "
        "B2C and generally not between businesses. This lesson covers what "
        "electronic trade actually changed: affordable reach, cheap search, "
        "the removal of intermediaries whose value was distribution alongside "
        "the arrival of new ones providing TRUST, and the long tail that "
        "physical shelf space had made impossible. It also covers payment "
        "mechanisms and the chargeback that places an evidential burden on "
        "sellers, and digital marketing's measurability -- which distorts as "
        "reliably as it enables.",
        [
            "Classify electronic commerce by the parties and state what "
            "follows",
            "Explain what electronic trade changed economically",
            "Explain disintermediation and re-intermediation together",
            "Compare payment mechanisms and explain chargeback",
            "Describe how trust is constructed between strangers",
            "Explain what measurability enables and distorts",
            "Identify the obligations electronic trade attracts",
            "Explain the jurisdiction question electronic reach created",
        ],
        75,
        _ec_sections,
        [
            ("B2C and B2B",
             "Business to consumer and business to business. Consumer "
             "protection applies to the first and generally not the second."),
            ("Disintermediation",
             "Removing intermediaries whose value was distribution, which "
             "affordable direct reach made possible."),
            ("Re-intermediation",
             "New intermediaries providing search, reputation, payment and "
             "aggregation."),
            ("Long tail",
             "Rarely-selling products becoming viable without physical shelf "
             "space."),
            ("Chargeback",
             "A buyer's dispute reversing a card payment, placing dispute "
             "risk and an evidential burden on the seller."),
            ("Reputation systems",
             "What many platforms actually sell -- the record that makes "
             "strangers willing to transact."),
            ("Measurability's distortion",
             "Attention moves to what is easy to measure, so unmeasurable "
             "benefits are gradually abandoned."),
            ("Jurisdiction",
             "A site reachable everywhere may be subject to several "
             "countries' law -- a question physical trading did not raise."),
        ],
        "Electronic commerce is classified by its PARTIES, because they "
        "determine the obligations: consumer protection applies to B2C and "
        "generally not to B2B, so an identical transaction carries different "
        "duties depending on who is buying. What electronic trade changed is "
        "specific -- reach became affordable, search became cheap, "
        "transaction costs fell, and the LONG TAIL of rarely-selling products "
        "became viable without physical shelf space. Intermediaries whose "
        "value was distribution were bypassed and new ones providing search, "
        "reputation and payment appeared, so the middle changed what it was "
        "for rather than disappearing -- and what many platforms actually "
        "sell is REPUTATION, the accumulated record that makes strangers "
        "willing to transact. Payment mechanisms differ in who carries which "
        "risk, and CHARGEBACK shapes card commerce by placing dispute risk "
        "and an evidential burden on sellers, met by routine record-keeping "
        "rather than argument afterwards. Digital marketing's measurability "
        "enables targeting and testing and distorts as reliably, since "
        "immediate response is measurable and brand effect is not. And "
        "reachability created a JURISDICTION question a shop never faced.",
        exam_notes=[
            desc(
                "Items describe an electronic trading situation and ask what "
                "governs the outcome."
            ),
            ul([
                "Explaining what determines a chargeback dispute.",
                "Identifying which model consumer protection applies to.",
                "Explaining disintermediation and re-intermediation.",
                "Identifying what a platform actually provides.",
                "Explaining measurability's distortion.",
                "Stating what a certificate establishes.",
                "Identifying the jurisdiction question.",
            ]),
            desc(
                "For any e-business item, establish the PARTIES first. "
                "Consumer or business determines which protections apply, "
                "which evidence matters and which risks fall where -- and "
                "several items turn on nothing else."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Consumer appliances and embedded systems
# ==========================================================================

_emb_sections = [
    ("Computers Inside Other Things", [
        desc(
            "Most computers are not recognisable as computers. They are "
            "inside appliances, vehicles and equipment, and their constraints "
            "differ from anything else in this certification."
        ),
        image(fig("embedded-constraints")),
        table(
            ["Constraint", "Consequence"],
            [["Nobody administers it",
              "It must work without anybody attending it, for years"],
             ["It cannot be visited",
              "Every fix must reach it remotely, or not at all"],
             ["Resources are limited by cost",
              "Memory, processing and power are all constrained"],
             ["It is manufactured in volume",
              "A per-unit saving of pennies is worth engineering effort"],
             ["It has physical consequences",
              "A failure can be dangerous rather than inconvenient"]],
            caption="Five constraints on embedded consumer systems.",
            footer="The second row governs everything else. A device in "
                   "somebody's home cannot be logged into, restarted by an "
                   "administrator or reconfigured -- so whatever it does when "
                   "something goes wrong is what it will do."),
    ]),

    ("Designing for Constraint", [
        desc(
            "Limited resources change how these systems are built, in ways "
            "the rest of the certification does not require."
        ),
        ul([
            "MEMORY is fixed and small, so allocation is frequently static "
            "and dynamic allocation avoided.",
            "PROCESSING is limited, so algorithms are chosen for what the "
            "hardware can actually do.",
            "POWER matters where the device runs on a battery, which changes "
            "the design more than anything else.",
            "COST per unit multiplies by production volume, so pennies "
            "matter in a way they never do for a server.",
            "STORAGE is limited, so what is logged and retained is a "
            "deliberate decision.",
        ]),
        desc(
            "POWER is the constraint that most reshapes a design. A device "
            "expected to run for years on a battery spends most of its time "
            "asleep, waking briefly, doing as little as possible and "
            "returning -- which affects every decision about what it "
            "measures, when it communicates and how it is programmed."
        ),
    ]),

    ("Real-Time Requirements", [
        desc(
            "Many embedded systems must respond within a bounded time, which "
            "is a correctness requirement rather than a performance goal."
        ),
        compare_grid(
            "HARD AGAINST SOFT REAL-TIME",
            "What happens when a deadline is missed.",
            [("Hard real-time",
              ["Missing a deadline is a failure",
               "The system is incorrect, not merely slow",
               "Airbag deployment, engine control, braking",
               "Worst case matters; average is irrelevant"]),
             ("Soft real-time",
              ["Missing a deadline degrades quality",
               "Late is worse and still usable",
               "Media playback, user interface response",
               "Average matters, and occasional misses are tolerated"])]),
        desc(
            "The distinction determines how the system is engineered. A hard "
            "real-time system is designed and analysed against its WORST "
            "case, since an average response time says nothing about whether "
            "the deadline is ever missed -- and one miss is the failure."
        ),
    ]),

    ("Updating a Device in the Field", [
        desc(
            "Software in shipped devices has defects, and getting corrections "
            "to them is a problem with no equivalent in server systems."
        ),
        ol([
            "The update must reach the device, over whatever connection it "
            "has -- possibly intermittent, possibly none.",
            "It must verify the update is genuine, since a device accepting "
            "any update accepts a malicious one.",
            "It must apply it without being able to recover if the process "
            "is interrupted -- or hold two versions so it can.",
            "It must be able to return to the previous version if the new "
            "one fails, since nobody can visit it.",
            "All of that must work for the device's whole life, which may be "
            "a decade or more.",
        ]),
        desc(
            "The last point is the constraint manufacturers underestimate. A "
            "device sold today may be running in fifteen years, and the "
            "obligation to supply updates lasts as long as it is in use -- "
            "which is considerably longer than most product lines."
        ),
    ]),

    ("Security in Consumer Devices", [
        desc(
            "Devices in homes are attacked, and their constraints make "
            "securing them harder than securing anything in a data centre."
        ),
        ul([
            "DEFAULT CREDENTIALS are the classic failure: identical across "
            "every unit, published, and never changed by the owner.",
            "Owners are not administrators and cannot be expected to "
            "configure, patch or monitor anything.",
            "A compromised device is on a home network with everything else "
            "the household owns.",
            "Compromised devices are valuable in aggregate, since thousands "
            "of them make a network capable of substantial attacks.",
            "The device may outlive its manufacturer's support, after which "
            "known vulnerabilities are never fixed.",
        ]),
        desc(
            "The last point has no technical remedy. A device still working "
            "after support ends carries every vulnerability discovered "
            "afterwards, permanently -- which is why support lifetimes are "
            "increasingly treated as a consumer protection question rather "
            "than a commercial choice."
        ),
    ]),

    ("Testing Embedded Systems", [
        desc(
            "Testing something that will not be attended has requirements "
            "server testing does not."
        ),
        ol([
            "Test on the actual hardware, since behaviour on a development "
            "machine proves little about a constrained device.",
            "Test the failure paths deliberately -- power loss, "
            "interrupted communication, sensor failure -- since the device "
            "must handle them alone.",
            "Test over long periods, since resource leaks that are "
            "irrelevant in a process restarted daily accumulate over years.",
            "Test the update mechanism, including its failure, since it is "
            "the only route to fixing anything later.",
            "Test at the environmental extremes the device will actually "
            "meet.",
        ]),
        desc(
            "The third point is the one that distinguishes embedded testing. "
            "A slow memory leak in a server is absorbed by a nightly restart "
            "that nobody thinks about; in a device expected to run for years "
            "without restarting, it is a failure with a delivery date."
        ),
    ]),

    ("Safety-Critical Consumer Devices", [
        desc(
            "Some consumer devices can injure people, which adds obligations "
            "to everything else in this lesson."
        ),
        ul([
            "The safety function is separated from the general control "
            "function, so one failing does not disable the other.",
            "The device FAILS SAFE, reaching a defined harmless state rather "
            "than an undefined one.",
            "Physical protection operates independently of software wherever "
            "possible.",
            "Changes are assessed for safety consequences by somebody "
            "qualified, before anything else is considered.",
            "The obligations are legal, and are not subject to the "
            "manufacturer's own cost-benefit judgement.",
        ]),
        desc(
            "FAIL SAFE is the property that requires the most design "
            "attention. A device must have a defined behaviour for every "
            "failure it can experience, including ones nobody anticipated -- "
            "which means defaulting to safe rather than to whatever state the "
            "software happened to be in."
        ),
    ]),

    ("The Product Lifetime Problem", [
        desc(
            "A consumer device's working life and its software support life "
            "are set by different considerations, and they rarely match."
        ),
        compare_grid(
            "PHYSICAL LIFE AGAINST SUPPORT LIFE",
            "How long it works, against how long it is maintained.",
            [("Physical life",
              ["Set by materials and use",
               "Frequently a decade or more",
               "The owner keeps it while it functions",
               "Nothing signals when support ended"]),
             ("Support life",
              ["Set by the manufacturer's commercial judgement",
               "Frequently much shorter",
               "Ends without the device stopping",
               "After it, vulnerabilities are permanent"])]),
        desc(
            "The mismatch has no technical solution and is increasingly "
            "treated as something manufacturers must declare -- so a buyer "
            "knows how long the device will be maintained before buying it "
            "rather than discovering it afterwards."
        ),
    ]),

    ("Sensors and Actuators", [
        desc(
            "An embedded system exists to observe something physical and act "
            "on it, and both halves are imperfect."
        ),
        table(
            ["Element", "What goes wrong"],
            [["Sensor accuracy",
              "Readings carry error, and the error is not always constant"],
             ["Sensor drift",
              "Accuracy degrades with age, silently"],
             ["Sensor failure",
              "A failed sensor may report a plausible value rather than "
              "nothing"],
             ["Actuator wear",
              "The physical response to a command changes over the "
              "device's life"],
             ["Timing between them",
              "The world moves between reading and acting"]],
            caption="Five ways the physical interface misleads software.",
            footer="The third row is the dangerous one. Software can detect a "
                   "sensor reporting nothing; it cannot easily detect one "
                   "reporting a value that is wrong but believable, which is "
                   "why important readings are cross-checked against "
                   "something else."),
        desc(
            "This is why control software is written to distrust its own "
            "inputs -- range checks, rate-of-change checks and comparison "
            "between independent sensors are all defences against a reading "
            "that looks fine and is not."
        ),
    ]),

    ("Real-Time Operating Systems", [
        desc(
            "Where timing must be guaranteed, the operating system itself is "
            "chosen for that property."
        ),
        ul([
            "Scheduling is by priority, and a higher-priority task displaces "
            "a lower one immediately.",
            "The time between an event and the code responding to it is "
            "BOUNDED and known, rather than merely usually short.",
            "The kernel is small, since every path through it contributes to "
            "that bound.",
            "Memory is generally allocated once at start-up, since "
            "allocation at run time has unpredictable duration.",
            "Throughput is deliberately sacrificed for predictability, which "
            "is the whole trade.",
        ]),
        desc(
            "The last point is what separates these systems from general "
            "purpose ones. A desktop operating system optimises for average "
            "responsiveness and accepts occasional long pauses; a real-time "
            "one accepts lower average performance in exchange for a ceiling "
            "that is never exceeded."
        ),
    ]),

    ("Human Interfaces on Devices", [
        desc(
            "A consumer device's interface is used by people who did not read "
            "anything and will not learn it."
        ),
        ol([
            "Make the common action obvious and everything else secondary, "
            "since almost all use is the common action.",
            "Show the current state plainly, since a device that gives no "
            "feedback is assumed broken.",
            "Make destructive actions difficult to perform accidentally.",
            "Assume no manual will be read, because it will not be.",
            "Provide a way back to a known state, since a confused owner has "
            "no other recovery available.",
        ]),
        desc(
            "The last step is the one that prevents support calls. A device "
            "that can be returned to its factory state by a person who does "
            "not understand what went wrong recovers from every configuration "
            "mistake without anybody being contacted."
        ),
    ]),

    ("Manufacturing and Firmware", [
        desc(
            "Software for a device has to reach the device during "
            "manufacture, which is a step server software never has."
        ),
        table(
            ["Manufacturing concern", "Why it constrains the software"],
            [["Programming time per unit",
              "Seconds per device multiply across a production run"],
             ["Per-device identity and keys",
              "Each unit needs its own, generated and stored securely"],
             ["Factory test coverage",
              "Faults not caught here are caught by customers"],
             ["Version control across runs",
              "Units built months apart carry different firmware"],
             ["Field update from any shipped version",
              "The update must work from whatever was installed"]],
            caption="Five manufacturing concerns that shape firmware.",
            footer="The last row is the one that is discovered late. An "
                   "update tested only from the current version will meet "
                   "devices that have been in a cupboard since the first "
                   "production run."),
        desc(
            "Per-device keys deserve particular attention. A product line "
            "sharing one key across every unit means compromising a single "
            "device compromises all of them, which is exactly the failure "
            "that has produced the largest incidents in this category."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where embedded system items are lost."),
        ul([
            "Applying server assumptions -- somebody administers it, it can "
            "be visited, resources are plentiful.",
            "Confusing hard with soft real-time. One is a correctness "
            "requirement.",
            "Designing a hard real-time system against average rather than "
            "worst-case timing.",
            "Providing updates with no way back if one fails.",
            "Accepting updates without verifying they are genuine.",
            "Shipping identical default credentials across every unit.",
            "Assuming a support lifetime shorter than the device's actual "
            "life.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"Thousands of home devices from one manufacturer are used to "
            "conduct a large attack. All shipped with the same default "
            "password. What made this possible?\""
        ),
        ol([
            "Establish what the credential was: identical across every unit "
            "and therefore publicly known.",
            "Establish who could have changed it: the owner, who is not an "
            "administrator and had no reason to.",
            "So every unit was accessible to anybody who knew the default, "
            "which was everybody.",
            "Aggregation is what made it valuable: one device is negligible "
            "and thousands are a substantial attack capability.",
            "The remedies are per-unit credentials set at manufacture, or "
            "forcing a change at first use -- both of which are design "
            "decisions rather than owner responsibilities.",
        ]),
        desc(
            "The reasoning generalises: security that depends on a "
            "non-administrator taking an action will not happen. Anything "
            "left to the owner in a consumer device is effectively not done, "
            "which has to be designed around rather than documented."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Embedded systems apply the technical categories directly."),
        ul([
            "Real-time scheduling comes from the Operating Systems lesson.",
            "Resource constraints are the Computer System category's "
            "concerns.",
            "Signed updates use the digital signatures of the Cryptography "
            "lesson.",
            "Default credentials are the Security category's access "
            "control.",
            "Devices outliving support is the maintenance concern of "
            "Development Technology.",
            "Aggregated devices in attacks are the distributed denial of "
            "service of the Security category.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("The constraint governing embedded design",
              "Nobody attends it and it cannot be visited",
              "Whatever it does when something goes wrong is what it will "
              "do."),
             ("Hard against soft real-time",
              "A missed deadline is a failure, or a degradation",
              "Hard real-time is analysed against WORST case; average says "
              "nothing."),
             ("What a field update must include",
              "A way back if the new version fails",
              "Since nobody can visit the device to recover it."),
             ("Why updates must be verified",
              "A device accepting any update accepts a malicious one",
              "Which is what digital signatures are for."),
             ("Why identical default credentials fail",
              "They are published, and owners are not administrators",
              "Security depending on an owner acting is effectively not "
              "done."),
             ("Why support lifetime is a consumer question",
              "A device outliving support carries every later vulnerability "
              "permanently",
              "And there is no technical remedy for it.")]),
    ]),
]

_emb_quiz = [
    mcq("HARD",
        "Thousands of home devices sharing one default password are used to "
        "conduct a large attack.\n\nWhat made it possible?",
        [("The credential was identical across units and owners are not "
          "administrators", True),
         ("The devices lacked encryption on their outbound network "
          "connections entirely", False),
         ("The manufacturer had stopped issuing security "
          "updates", False),
         ("Home networks provide no protection against external "
          "access", False)],
        "An identical default is a published one, and the only person who "
        "could change it is an owner with no reason or ability to. "
        "Aggregation supplies the value: one device is negligible and "
        "thousands are substantial. The remedies -- per-unit credentials at "
        "manufacture, or forcing a change at first use -- are design "
        "decisions rather than owner responsibilities."),

    mcq("AVERAGE",
        "What distinguishes hard from soft real-time requirements?",
        [("A missed deadline is a failure rather than a "
          "degradation", True),
         ("Hard real-time systems have shorter deadlines", False),
         ("Hard real-time systems run on dedicated hardware", False),
         ("Hard real-time systems cannot tolerate any variation in "
          "timing", False)],
        "In a hard real-time system, responding late is as wrong as "
        "responding incorrectly -- an airbag deploying after the collision "
        "has failed. In a soft real-time system, lateness degrades quality "
        "and the result remains usable. That difference decides whether the "
        "system is engineered against its worst case or its average."),

    mcq("HARD",
        "Hard real-time systems are analysed against worst-case rather "
        "than average timing.\n\nOn what grounds?",
        [("An average says nothing about whether the deadline is ever "
          "missed", True),
         ("Worst-case analysis is considerably simpler to perform than "
          "average-case analysis", False),
         ("Hard real-time systems have no average behaviour to "
          "measure", False),
         ("Certification standards require worst-case figures", False)],
        "One missed deadline is a failure, so the question is whether the "
        "deadline can ever be missed rather than how the system usually "
        "performs. A system averaging well within its deadline and "
        "occasionally exceeding it is incorrect, and only worst-case analysis "
        "establishes whether that can happen."),

    mcq("AVERAGE",
        "What must a field update mechanism include that a server update does "
        "not need?",
        [("A way to return to the previous version without anybody visiting "
          "the device", True),
         ("Compression to reduce the transmitted size of each update "
          "package", False),
         ("Scheduling to apply updates outside working hours", False),
         ("Confirmation from the device's owner before "
          "applying", False)],
        "A server that fails to start after an update can be attended to; a "
        "device in somebody's home cannot. The mechanism must therefore be "
        "able to detect a failed update and return to the working version by "
        "itself, which is normally achieved by holding two versions and "
        "switching between them."),

    mcq("HARD",
        "Why must a device verify that an update is genuine?",
        [("A device accepting any update accepts a malicious one", True),
         ("Corrupted updates would leave the device "
          "unrecoverable", False),
         ("Verification confirms the update matches the device "
          "model", False),
         ("Regulations require update provenance to be "
          "recorded", False)],
        "An update mechanism is a route to replacing the device's software "
        "entirely, so one that accepts anything offered is a route an "
        "attacker can use. Verifying a signature made with the manufacturer's "
        "private key establishes that the update came from them, which is "
        "exactly what digital signatures provide."),

    mcq("AVERAGE",
        "Which constraint most reshapes the design of a battery-powered "
        "device?",
        [("Power, since it determines that the device sleeps most of the "
          "time", True),
         ("Memory, since dynamic allocation must generally be avoided "
          "altogether", False),
         ("Processing, since algorithms must suit the "
          "hardware", False),
         ("Cost, since per-unit savings multiply by volume", False)],
        "A device expected to run for years on a battery spends most of its "
        "existence asleep, waking briefly to do as little as possible. That "
        "governs what it measures, how often it communicates and how it is "
        "programmed -- reshaping the design far more than the other "
        "constraints, which limit it without restructuring it."),

    mcq("HARD",
        "A device remains in use after its manufacturer ends support.\n\n"
        "What is the position?",
        [("It carries every vulnerability discovered afterwards, "
          "permanently", True),
         ("It continues to function safely until it eventually fails "
          "physically", False),
         ("Its owner becomes responsible for applying "
          "updates", False),
         ("Its vulnerabilities are disclosed and can be "
          "mitigated", False)],
        "No further fixes will be produced, so any vulnerability found from "
        "that point remains present for as long as the device runs -- and "
        "there is no technical remedy. That is why support lifetimes are "
        "increasingly treated as a consumer protection question rather than a "
        "purely commercial decision."),

    mcq("AVERAGE",
        "Per-unit cost engineering is worthwhile in consumer devices and "
        "not for servers.\n\nWhat accounts for that?",
        [("A small saving multiplies by the production volume", True),
         ("Consumer devices are generally sold at considerably lower "
          "margins", False),
         ("Component prices vary more for consumer hardware", False),
         ("Consumer devices are replaced more frequently", False)],
        "Saving a few pennies of component cost is negligible on one unit and "
        "substantial across millions, so engineering effort to remove it is "
        "justified in a way it never is for a server produced in dozens. It "
        "is why embedded systems are so resource-constrained: the constraint "
        "is deliberate."),

    mcq("HARD",
        "Why does security that depends on the owner configuring a consumer "
        "device fail?",
        [("Owners are not administrators and have no reason or ability to "
          "do it", True),
         ("Configuration interfaces on such devices are generally too "
          "complex to use", False),
         ("Owners lack the credentials required to make "
          "changes", False),
         ("Device documentation does not explain the settings", False)],
        "Somebody who bought an appliance is not managing an estate: they "
        "want it to work, they will not read about its security settings and "
        "they have no way to know what should be changed. Anything left to "
        "them is effectively not done, which is a fact to design around "
        "rather than a failing to document."),

    mcq("AVERAGE",
        "What is the defining constraint on embedded consumer systems?",
        [("Nobody administers them and they cannot be visited", True),
         ("They have severely limited memory and processing power "
          "available", False),
         ("They must operate continuously without restarting", False),
         ("They are produced in very high volumes", False)],
        "Every other constraint follows from this one. Because nobody attends "
        "it, whatever the device does when something goes wrong is what it "
        "will do; because it cannot be visited, every correction must reach "
        "it remotely; and because its owner is not an administrator, nothing "
        "can depend on them acting."),
]

LESSON_BIZ_EMB = lesson(
    MAJOR, MIDDLE,
    "Consumer Appliances and Embedded Consumer Systems",
    _emb_quiz,
    lesson_structure(
        "Consumer Appliances and Embedded Consumer Systems",
        "Most computers are not recognisable as computers, and the constraint "
        "governing all of them is that NOBODY ATTENDS THEM and they cannot be "
        "visited -- so whatever a device does when something goes wrong is "
        "what it will do. This lesson covers designing under fixed resources "
        "with POWER reshaping a battery device more than anything else, the "
        "hard-against-soft real-time distinction that decides whether a "
        "system is analysed against its worst case, updating devices in the "
        "field including the way back nobody can supply manually, and "
        "security where anything left to an owner is effectively not done.",
        [
            "State the constraints on embedded consumer systems",
            "Explain how limited resources change the design",
            "Explain why power dominates battery-powered design",
            "Distinguish hard from soft real-time",
            "Explain why hard real-time is analysed against worst case",
            "State what a field update mechanism must provide",
            "Explain why updates must be verified",
            "Explain why owner-dependent security fails",
        ],
        75,
        _emb_sections,
        [
            ("The governing constraint",
             "Nobody administers it and it cannot be visited, so it must work "
             "unattended for years."),
            ("Power as a design driver",
             "A battery device sleeps most of the time, which governs what it "
             "measures and when it communicates."),
            ("Hard real-time",
             "A missed deadline is a failure, so the system is analysed "
             "against its WORST case."),
            ("Soft real-time",
             "A missed deadline degrades quality; the result remains usable."),
            ("Field update",
             "Must reach the device, be verified as genuine, and be "
             "reversible without anybody attending."),
            ("Default credentials",
             "Identical across units means published, and owners will not "
             "change them."),
            ("Support lifetime",
             "A device outliving support carries every later vulnerability "
             "permanently, with no technical remedy."),
        ],
        "Most computers sit inside appliances and equipment, and one "
        "constraint governs the rest: NOBODY ATTENDS THEM and they cannot be "
        "visited, so whatever a device does when something goes wrong is what "
        "it will do. Resources are constrained deliberately, since a penny "
        "saved multiplies by production volume -- and POWER reshapes a "
        "battery-powered design more than any other limit, because such a "
        "device spends its life asleep and wakes to do as little as possible. "
        "Timing requirements divide into HARD real-time, where a missed "
        "deadline is a failure and the system must be analysed against its "
        "worst case, and SOFT, where lateness degrades a result that remains "
        "usable. Updating a shipped device must reach it, VERIFY that the "
        "update is genuine -- since a mechanism accepting anything is a route "
        "an attacker can use -- and be reversible without anybody attending, "
        "for a device life that may exceed a decade. And security fails "
        "wherever it depends on an owner, since somebody who bought an "
        "appliance is not an administrator: identical default credentials are "
        "published credentials, and a device outliving its support carries "
        "every subsequent vulnerability permanently.",
        exam_notes=[
            desc(
                "Items describe a device failure and ask what the design "
                "assumption was."
            ),
            ul([
                "Diagnosing default credentials behind a device compromise.",
                "Distinguishing hard from soft real-time.",
                "Explaining worst-case analysis.",
                "Stating what a field update must provide.",
                "Explaining why updates are verified.",
                "Identifying power as the dominant constraint.",
                "Explaining why owner-dependent security fails.",
            ]),
            desc(
                "For any embedded item, ask whether the design assumed "
                "somebody would be there. Administration, configuration, "
                "recovery and patching all assume an attendant, and a "
                "consumer device has none -- which is what these items are "
                "constructed on."
            ),
        ],
    ))

LESSONS = [LESSON_BIZ_EC, LESSON_BIZ_EMB]

"""System Strategy, lessons 3 and 4.

Solution business -- cloud, outsourcing and service models -- and system
utilisation promotion and evaluation.

The cloud lesson is organised around the responsibility ladder, since every
item in the area turns on what transfers to the provider and what never does.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "System Strategy"
MIDDLE = "System Strategy"

# ==========================================================================
# Lesson 3: Solution business
# ==========================================================================

_sol_sections = [
    ("Obtaining Capability Without Owning It", [
        desc(
            "An organisation can build a capability, buy it, or rent it -- "
            "and renting has become the default for a widening range of "
            "things."
        ),
        table(
            ["Approach", "The organisation owns", "And carries"],
            [["Build and run internally",
              "Everything, including the decisions",
              "All the cost and all the risk"],
             ["Buy a product and run it",
              "The operation, not the product",
              "Operating cost, and the supplier's release decisions"],
             ["Rent a service", "Nothing but its data and its use",
              "Dependence, and a recurring charge"],
             ["Outsource the operation",
              "The systems, not the people running them",
              "Coordination cost, and accountability regardless"]],
            caption="Four ways of obtaining a capability.",
            footer="The third column is what the decision is actually about. "
                   "Each arrangement exchanges one kind of cost and risk for "
                   "another rather than removing any, which is what makes it "
                   "a judgement rather than a trend to follow."),
    ]),

    ("Cloud Service Models", [
        desc(
            "Cloud services divide by how much of the stack the provider "
            "manages, and the ladder is what almost every item in this area "
            "turns on."
        ),
        image(fig("cloud-service-models")),
        table(
            ["Model", "Provider manages", "You manage"],
            [["On premises", "Nothing", "Everything"],
             ["Infrastructure as a service", "Hardware and virtualisation",
              "Operating system, middleware, applications, data"],
             ["Platform as a service",
              "The above plus the operating system and runtime",
              "Applications and data"],
             ["Software as a service", "Everything technical",
              "Your data, your users, your configuration"]],
            caption="A ladder of responsibility transferred upward.",
            footer="Responsibility for the DATA never transfers, at any level. "
                   "Whatever the model, the organisation remains accountable "
                   "for the information it holds -- which is the row every "
                   "item in this area is built on."),
        desc(
            "Each step up removes work and removes control in the same "
            "movement. A platform service removes operating system "
            "administration and removes the ability to configure the "
            "operating system, and whether that is a gain depends entirely on "
            "whether the organisation needed that configuration."
        ),
    ]),

    ("Deployment Models", [
        desc(
            "Where a cloud service runs, and who else uses the same "
            "infrastructure, is a separate question from the service model."
        ),
        content_accordion(
            "FOUR DEPLOYMENT MODELS",
            "Distinguished by who shares the infrastructure.",
            [("Public cloud",
              "Infrastructure shared among many unrelated customers. Cheapest "
              "at any given capability, since the cost is spread, and it "
              "requires accepting a shared environment."),
             ("Private cloud",
              "Infrastructure dedicated to one organisation, whether it owns "
              "it or a provider operates it. Control and isolation, at a cost "
              "closer to owning."),
             ("Community cloud",
              "Shared among organisations with common requirements -- often a "
              "regulatory regime that makes public sharing difficult."),
             ("Hybrid",
              "A combination, with workloads placed according to their "
              "requirements. The common arrangement, and it requires the "
              "parts to interoperate.")]),
        desc(
            "The commonest hybrid pattern places workloads by their DATA "
            "rather than by their technology: regulated or highly sensitive "
            "data stays private, and everything else goes public. That places "
            "the decision where the constraint actually is."
        ),
    ]),

    ("What Cloud Actually Changes", [
        desc(
            "The syllabus expects the characteristics rather than "
            "enthusiasm, and each has a consequence."
        ),
        table(
            ["Characteristic", "Means", "Consequence"],
            [["On-demand self-service", "Capacity obtained without asking",
              "Provisioning stops being a procurement exercise"],
             ["Elasticity", "Capacity scales with demand",
              "Peaks are served without owning peak capacity"],
             ["Measured service", "You pay for what you use",
              "Waste becomes visible, and so does uncontrolled growth"],
             ["Resource pooling", "Infrastructure shared among customers",
              "Cheaper, and you do not choose your neighbours"],
             ["Broad network access", "Reachable from anywhere",
              "The network becomes a dependency for everything"]],
            caption="Five defining characteristics and what each produces.",
            footer="ELASTICITY is the characteristic with the strongest "
                   "economic case, since it removes the need to own capacity "
                   "for a peak that lasts an hour a day -- which was "
                   "unavoidable when capacity had to be purchased in "
                   "advance."),
        desc(
            "MEASURED SERVICE cuts both ways. Paying for consumption makes "
            "waste visible for the first time, and it also means anybody able "
            "to provision resources can incur cost -- so the control that "
            "used to be a purchase order now has to be an explicit one."
        ),
    ]),

    ("What Does Not Transfer", [
        desc(
            "The most examined point in this area is what stays with the "
            "organisation whatever it rents."
        ),
        ul([
            "ACCOUNTABILITY for the data, to customers and to regulators.",
            "The obligation to know WHERE data is held, which some regimes "
            "constrain.",
            "The decision about what the organisation does, which no provider "
            "makes.",
            "The consequence of a provider's failure, which is felt by the "
            "organisation's customers.",
            "The exit problem: whatever it would take to leave.",
        ]),
        desc(
            "VENDOR LOCK-IN is the last of these made concrete. A service "
            "adopted deeply enough becomes difficult to leave -- data in "
            "proprietary formats, processes built around its behaviour, "
            "skills specific to it -- and the cost of leaving is what "
            "determines the organisation's negotiating position at every "
            "renewal."
        ),
        desc(
            "The practical response is planning the exit at entry: knowing "
            "how data would be extracted, in what format, and what would "
            "replace the service. That knowledge costs little at the start "
            "and cannot be obtained cheaply later."
        ),
    ]),

    ("Outsourcing", [
        desc(
            "Outsourcing transfers who does the work rather than what "
            "technology is used, and the two decisions are independent."
        ),
        compare_grid(
            "WHAT OUTSOURCING BUYS AND COSTS",
            "Capability and focus, against coordination and distance.",
            [("Buys",
              ["Capability the organisation lacks or cannot retain",
               "Capacity that flexes without hiring",
               "Focus on what actually differentiates the organisation",
               "A cost that becomes predictable and contractual"]),
             ("Costs",
              ["Coordination, specification and contract management",
               "Knowledge leaving the organisation permanently",
               "Slower response than an internal team",
               "Dependence on a supplier whose priorities are their own"])]),
        desc(
            "The second cost on the right is the one that compounds. "
            "Outsourcing an activity means nobody internally continues "
            "learning it, and after a few years the organisation cannot "
            "assess the supplier's work or bring it back -- which changes the "
            "relationship permanently."
        ),
        desc(
            "OFFSHORING is a separate decision about WHERE work is done, and "
            "it can apply to internal staff as readily as to a supplier. "
            "Treating the two as one decision means each one's difficulties "
            "get attributed to the other."
        ),
    ]),

    ("Choosing an Arrangement", [
        desc(
            "The examination gives a situation and asks which arrangement "
            "fits, and the reasoning is short."
        ),
        table(
            ["When", "Prefer", "Because"],
            [["The capability differentiates the organisation",
              "Build and keep internally", "It is what you are competing on"],
             ["The need is standard and well understood",
              "A rented service", "Somebody else has already solved it"],
             ["Demand varies sharply",
              "A rented, elastic service",
              "Owning for the peak wastes most of the time"],
             ["Regulation constrains where data may sit",
              "Private or community", "The constraint is not negotiable"],
             ["The activity is necessary and undistinguishing",
              "Outsource it", "Attention is better spent elsewhere"]],
            caption="Five situations and what each argues for.",
            footer="The first row is the constant. Whatever the economics of "
                   "renting, an organisation does not rent the thing it "
                   "competes on -- because it then competes on something "
                   "available to everybody."),
    ]),

    ("Assessing a Provider", [
        desc(
            "Choosing a provider is a procurement decision with additional "
            "questions the ordinary ones do not cover."
        ),
        table(
            ["Question", "Why it matters"],
            [["What service levels are actually committed",
              "A published target is not a contractual commitment"],
             ["What happens when they are missed",
              "A credit against fees is not the same as service"],
             ["Where the data will be held, and by whom",
              "Some jurisdictions constrain this absolutely"],
             ["What independent assurance exists over their controls",
              "You cannot audit most providers yourself"],
             ["What happens if they cease trading",
              "Your data, and your ability to continue operating"]],
            caption="Five questions specific to a service provider.",
            footer="The second row is where expectations diverge. Service "
                   "credits compensate for a failure and do not prevent it, "
                   "so a business needing continuity needs a design that "
                   "survives the provider rather than a clause about it."),
        desc(
            "Independent assurance reports are the practical answer to the "
            "audit question at scale -- a provider serving thousands cannot "
            "be audited by each of them, so one examination is performed and "
            "the report shared. Its SCOPE is what determines whether it "
            "answers your question."
        ),
    ]),

    ("Multi-Provider Arrangements", [
        desc(
            "Organisations rarely use one provider, which introduces "
            "integration and accountability questions between them."
        ),
        ul([
            "Each provider is accountable for their own service and for none "
            "of the connections between them.",
            "The organisation retains the integration problem, or pays "
            "somebody to hold it.",
            "A failure spanning two providers can be attributed to neither "
            "without evidence the organisation must gather.",
            "Data moving between providers crosses boundaries that each "
            "one's controls stop at.",
            "Consistent identity and access management across providers is "
            "difficult and is what makes leaving any of them possible.",
        ]),
        desc(
            "The third point produces the characteristic dispute. Two "
            "providers each demonstrating that their own service met its "
            "levels leaves the organisation with an outage nobody is "
            "responsible for -- which is why end-to-end monitoring the "
            "organisation controls is worth its cost."
        ),
    ]),

    ("Managing Cost in a Rented Model", [
        desc(
            "Consumption pricing changes cost from something decided once "
            "into something accumulating continuously."
        ),
        ol([
            "Attribute cost to whoever incurs it, or nobody has a reason to "
            "reduce it.",
            "Set alerts on unexpected growth, since a change in configuration "
            "can multiply a bill silently.",
            "Remove what is not being used, since idle resources cost the "
            "same as busy ones.",
            "Size resources to actual demand rather than to the estimate made "
            "before anything ran.",
            "Review commitments, since discounts for committed capacity are "
            "only savings if the capacity is used.",
        ]),
        desc(
            "The third point is where most waste sits. Resources provisioned "
            "for a project that ended, environments created for a test nobody "
            "cleaned up, and capacity sized for a launch that has passed all "
            "continue charging -- and none of them announces itself."
        ),
    ]),

    ("Security in a Rented Model", [
        desc(
            "Security responsibilities are divided between provider and "
            "customer, and the division follows the service model exactly."
        ),
        table(
            ["Concern", "Whose"],
            [["Physical security of the facility", "The provider's"],
             ["Patching the infrastructure", "The provider's"],
             ["Patching the operating system",
              "Yours under infrastructure services, theirs above it"],
             ["Configuring the service securely", "YOURS, at every level"],
             ["Who has access to your data", "YOURS, at every level"]],
            caption="Five concerns and where each falls.",
            footer="The last two rows are where breaches actually occur. "
                   "Providers secure their platforms competently; customers "
                   "misconfigure services and grant access too widely, and "
                   "that is the customer's responsibility under every "
                   "model."),
        desc(
            "The SHARED RESPONSIBILITY model is the term for this division, "
            "and its practical importance is that customers assume more "
            "transfers than does. A publicly readable storage container is a "
            "customer configuration decision, whatever the provider's own "
            "security is like."
        ),
    ]),

    ("Service Continuity With a Provider", [
        desc(
            "A rented service's availability depends on somebody else, which "
            "changes what continuity planning has to consider."
        ),
        ul([
            "The provider's own resilience is what their service level "
            "reflects, and it is not necessarily what your business "
            "requires.",
            "A provider outage affects every customer at once, so their "
            "support is least available exactly when you need it.",
            "Your continuity plan cannot assume actions the provider "
            "controls, since you cannot perform them.",
            "Data held only by the provider is data you cannot restore "
            "yourself unless you also hold a copy.",
            "Multi-region or multi-provider arrangements exist for this, and "
            "each adds cost and complexity that must be justified.",
        ]),
        desc(
            "The fourth point is the one organisations discover during an "
            "incident. Relying entirely on a provider's backups means "
            "recovery happens on their timetable and by their procedures -- "
            "which is acceptable if it was decided deliberately and is a "
            "surprise if it was assumed."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where solution business items are lost."),
        ul([
            "Believing accountability for data transfers with the service. It "
            "never does.",
            "Confusing service models with deployment models.",
            "Treating a step up the ladder as purely a gain, when it removes "
            "control as well as work.",
            "Adopting a service without knowing what leaving would take.",
            "Assuming measured service controls cost, when it also lets "
            "anybody incur it.",
            "Treating outsourcing and offshoring as one decision.",
            "Outsourcing the capability the organisation actually competes "
            "on.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An organisation moves a system to a software-as-a-service "
            "provider and states that responsibility for protecting the "
            "personal data now rests with the provider. Evaluate that.\""
        ),
        ol([
            "Establish what the model transfers: everything technical -- "
            "infrastructure, platform, application, and their operation.",
            "Establish what it does not: the data itself, and the "
            "organisation's relationship with the people it concerns.",
            "The organisation remains accountable to those people and to any "
            "regulator, whatever the contract allocates between the parties.",
            "The provider's obligations are contractual and run to the "
            "organisation, not to the data subjects.",
            "So the statement is wrong: what transferred is the technical "
            "work and some financial liability, and accountability stayed "
            "exactly where it was.",
        ]),
        desc(
            "This is the same conclusion the Security category reaches about "
            "risk transfer, arriving from a different direction. Outsourcing "
            "and renting move work and money and leave answerability where it "
            "started."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Solution business connects to several categories."),
        ul([
            "The service models extend the network applications lesson's "
            "distributed patterns.",
            "Accountability not transferring is the Security category's "
            "risk transfer limit.",
            "Supplier selection and contracts are Project Procurement.",
            "Elasticity changes the capacity planning of Service "
            "Management.",
            "Data location constraints come from Legal Affairs.",
            "Build-against-buy is the architecture lesson's decision, at "
            "organisational scale.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What never transfers to a provider",
              "Accountability for the data",
              "Whatever the model, and whatever the contract says about "
              "liability."),
             ("What each step up the cloud ladder does",
              "Removes work and removes control together",
              "Whether that is a gain depends on whether the control was "
              "needed."),
             ("Service models against deployment models",
              "How much the provider manages, against who shares the "
              "infrastructure",
              "Two independent questions frequently conflated."),
             ("What elasticity removes the need for",
              "Owning capacity for a peak",
              "Which was unavoidable when capacity had to be bought in "
              "advance."),
             ("What lock-in actually determines",
              "The negotiating position at every renewal",
              "Which is why the exit is planned at entry, when it costs "
              "little."),
             ("What you never rent",
              "The capability you compete on",
              "Renting it means competing on something available to "
              "everybody.")]),
    ]),
]

_sol_quiz = [
    mcq("HARD",
        "An organisation moves a system to a software-as-a-service provider "
        "and states that data protection responsibility now rests with the "
        "provider.\n\nIs that correct?",
        [("No -- accountability for the data remains with the "
          "organisation", True),
         ("Yes -- the provider operates every technical layer of the "
          "service", False),
         ("Yes, provided the contract allocates the responsibility "
          "explicitly", False),
         ("Only for data the provider stores rather than merely "
          "processes", False)],
        "The model transfers everything technical and some financial "
        "liability; the organisation's relationship with the people whose data "
        "it is remains, as does any regulatory obligation. The provider's "
        "duties are contractual and run to the organisation rather than to "
        "the data subjects -- the same conclusion the Security category "
        "reaches about risk transfer."),

    mcq("AVERAGE",
        "In platform as a service, what does the customer remain responsible "
        "for?",
        [("The applications and the data", True),
         ("The operating system, applications and data", False),
         ("The data and user configuration only", False),
         ("Everything above the physical hardware", False)],
        "The provider manages the infrastructure, virtualisation, operating "
        "system and runtime; the customer builds and runs applications on it "
        "and owns the data. Retaining the operating system as well describes "
        "INFRASTRUCTURE as a service, and retaining only data and "
        "configuration describes SOFTWARE as a service."),

    mcq("HARD",
        "What does each step up the cloud service model ladder involve?",
        [("Removing work and removing control in the same movement", True),
         ("Reducing cost while retaining the same degree of "
          "control", False),
         ("Transferring accountability progressively to the "
          "provider", False),
         ("Increasing the customisation available to the customer", False)],
        "A platform service removes operating system administration and "
        "removes the ability to configure the operating system, which is one "
        "movement rather than two. Whether that is a gain depends entirely on "
        "whether the organisation needed that configuration -- and "
        "accountability for data transfers at no level."),

    mcq("AVERAGE",
        "Deployment models and service models answer different "
        "questions.\n\nWhich distinction is it?",
        [("Who shares the infrastructure, against how much the provider "
          "manages", True),
         ("Where the data is stored, against who owns the "
          "hardware", False),
         ("The contract term, against the pricing arrangement", False),
         ("Public availability, against internal availability", False)],
        "Service models -- infrastructure, platform, software -- describe how "
        "far up the stack the provider's responsibility reaches. Deployment "
        "models -- public, private, community, hybrid -- describe who else "
        "uses the same infrastructure. They are independent, so a private "
        "platform service and a public one are both coherent."),

    mcq("HARD",
        "Why should the exit from a cloud service be planned at the point of "
        "adoption?",
        [("The cost of leaving determines the negotiating position at every "
          "renewal", True),
         ("Providers require an exit plan before a contract can be "
          "signed", False),
         ("Data extraction is technically impossible once a service is "
          "populated", False),
         ("Exit planning is a regulatory requirement for outsourced "
          "services", False)],
        "A service adopted deeply becomes hard to leave -- proprietary "
        "formats, processes built around it, specific skills -- and a "
        "customer who cannot leave negotiates from a position everybody "
        "understands. Knowing how data would be extracted and what would "
        "replace the service costs little at the start and cannot be obtained "
        "cheaply afterwards."),

    mcq("AVERAGE",
        "Which cloud characteristic makes owning capacity for a peak "
        "unnecessary?",
        [("Elasticity", True),
         ("Resource pooling across multiple customers", False),
         ("Measured service and consumption-based charging", False),
         ("On-demand self-service provisioning", False)],
        "Elasticity means capacity scales with demand, so a peak lasting an "
        "hour a day is served without owning capacity that sits idle for the "
        "other twenty-three. Pooling is what makes elasticity economically "
        "possible for the provider, and measured service is how it is "
        "charged -- but elasticity is the property that removes the need."),

    mcq("HARD",
        "Measured service is described as cutting both ways.\n\n"
        "What is the second effect?",
        [("Anybody able to provision resources can incur cost", True),
         ("Usage data is visible to the provider as well as the "
          "customer", False),
         ("Charges vary month to month, complicating "
          "budgeting", False),
         ("Small workloads become disproportionately expensive", False)],
        "Paying for consumption makes waste visible for the first time, and "
        "it also removes the purchase order that used to stand between "
        "somebody and a new server. The control that was procurement has to "
        "become an explicit one, or cost grows through many individually "
        "small and entirely unreviewed decisions."),

    mcq("AVERAGE",
        "Something compounds over the years when an activity is "
        "outsourced.\n\nWhat?",
        [("Nobody internally continues learning it, so it cannot be assessed "
          "or brought back", True),
         ("The supplier's charges rise faster than internal costs would "
          "have", False),
         ("The contract becomes progressively harder to "
          "renegotiate", False),
         ("The activity diverges from the organisation's other "
          "processes", False)],
        "Knowledge leaves permanently rather than temporarily: after a few "
        "years nobody internally can judge whether the supplier's work is "
        "good, or take the activity back if the relationship fails. That "
        "changes the relationship regardless of what either party intends, "
        "and it is why some capability is retained deliberately."),

    mcq("AVERAGE",
        "What should an organisation avoid renting or outsourcing whatever "
        "the economics?",
        [("The capability it competes on", True),
         ("Any activity involving personal data", False),
         ("Anything requiring specialist technical skills", False),
         ("Activities whose demand varies unpredictably", False)],
        "A capability available for rent is available to competitors on the "
        "same terms, so an organisation renting what distinguishes it is "
        "competing on something anybody can buy. Personal data, specialist "
        "skills and variable demand all point towards rented services rather "
        "than away from them."),

    mcq("HARD",
        "A hybrid deployment places workloads in public or private "
        "environments.\n\nWhat usually decides the placement?",
        [("The data, since regulated or sensitive data constrains where it "
          "may sit", True),
         ("The technology, since some workloads require specific "
          "platforms", False),
         ("The cost, with expensive workloads placed privately", False),
         ("The age of the system, with newer systems placed "
          "publicly", False)],
        "Where regulation or sensitivity constrains data location, that "
        "constraint is not negotiable and everything else is arranged around "
        "it -- so the data decides and the technology follows. Placing "
        "workloads by technology or cost produces an arrangement that has to "
        "be revisited the moment a compliance question is asked."),
]

LESSON_SYS_SOL = lesson(
    MAJOR, MIDDLE,
    "Solution Business: Cloud, Outsourcing and Service Models",
    _sol_quiz,
    lesson_structure(
        "Solution Business: Cloud, Outsourcing and Service Models",
        "An organisation can build a capability, buy it, or rent it, and each "
        "arrangement exchanges one kind of cost and risk for another rather "
        "than removing any. This lesson is organised around the cloud "
        "responsibility ladder, since every item in the area turns on what "
        "transfers to the provider -- with the answer that ACCOUNTABILITY FOR "
        "DATA never does, at any level and whatever the contract allocates. "
        "It covers the deployment models as a separate question from the "
        "service models, the characteristics and their consequences including "
        "measured service cutting both ways, lock-in as what determines every "
        "renewal negotiation, and outsourcing's compounding loss of internal "
        "knowledge.",
        [
            "Compare building, buying, renting and outsourcing a capability",
            "Place the cloud service models on the responsibility ladder",
            "State what never transfers to a provider",
            "Distinguish deployment models from service models",
            "Describe the cloud characteristics and their consequences",
            "Explain lock-in and why the exit is planned at entry",
            "Distinguish outsourcing from offshoring",
            "Match an arrangement to a described situation",
        ],
        75,
        _sol_sections,
        [
            ("Infrastructure as a service",
             "Provider manages hardware and virtualisation; customer manages "
             "the operating system and above."),
            ("Platform as a service",
             "Provider adds the operating system and runtime; customer "
             "manages applications and data."),
            ("Software as a service",
             "Provider manages everything technical; customer manages its "
             "data, users and configuration."),
            ("What never transfers",
             "Accountability for the data, the obligation to know where it "
             "sits, and the consequence of a provider's failure."),
            ("Deployment models",
             "Public, private, community and hybrid -- who shares the "
             "infrastructure, independent of the service model."),
            ("Elasticity",
             "Capacity scaling with demand, which removes the need to own "
             "capacity for a peak."),
            ("Measured service",
             "Paying for consumption. Makes waste visible, and lets anybody "
             "able to provision incur cost."),
            ("Vendor lock-in",
             "The cost of leaving, which determines the negotiating position "
             "at every renewal."),
            ("Outsourcing against offshoring",
             "Who does the work, against where it is done. Independent "
             "decisions."),
        ],
        "Capability can be built, bought, rented or outsourced, and each "
        "arrangement exchanges one kind of cost and risk for another rather "
        "than removing any. The cloud service models form a ladder -- "
        "infrastructure, platform, software -- transferring progressively "
        "more of the technical stack, and each step removes work and removes "
        "CONTROL in the same movement, so whether it is a gain depends on "
        "whether that control was needed. What never transfers at any level "
        "is ACCOUNTABILITY for the data: the provider's obligations are "
        "contractual and run to the organisation, while the organisation's "
        "run to the people the data concerns and to any regulator. Deployment "
        "models are a separate question about who shares the infrastructure, "
        "and hybrid placements are usually decided by the DATA rather than by "
        "the technology. Among the characteristics, elasticity removes the "
        "need to own peak capacity and measured service cuts both ways -- "
        "making waste visible while removing the purchase order that used to "
        "stand between somebody and a new server. Lock-in determines every "
        "renewal negotiation, which is why the exit is planned at entry when "
        "it costs little. And outsourcing compounds: nobody internally keeps "
        "learning the activity, so after a few years it can be neither "
        "assessed nor brought back.",
        exam_notes=[
            desc(
                "Items describe a sourcing arrangement and ask what actually "
                "changed as a result."
            ),
            ul([
                "Stating what accountability transfers to a provider.",
                "Placing responsibilities on the service model ladder.",
                "Distinguishing deployment from service models.",
                "Explaining what elasticity removes.",
                "Explaining lock-in and exit planning.",
                "Distinguishing outsourcing from offshoring.",
                "Identifying what should not be rented.",
            ]),
            desc(
                "For any sourcing item, ask what transferred and what did "
                "not. Work and money move; accountability does not -- and the "
                "distractors are built from treating a contractual "
                "reallocation of liability as a transfer of answerability."
            ),
        ],
    ))

# ==========================================================================
# Lesson 4: System utilisation and evaluation
# ==========================================================================

_util_sections = [
    ("Systems That Nobody Uses", [
        desc(
            "A system delivered, working, and not used has produced nothing "
            "-- and it happens often enough that the syllabus treats "
            "promoting use as a discipline."
        ),
        table(
            ["Reason for non-use", "What it actually indicates"],
            [["It does not fit how the work is done",
              "The as-is process was never understood"],
             ["It is harder than what people did before",
              "Usability was not a requirement anybody stated"],
             ["Nobody knows it exists or what it does",
              "Communication was treated as a launch event"],
             ["It exists and the old way still works",
              "Nothing required anybody to change"],
             ["People do not trust its output",
              "Data quality, or a visible early failure"]],
            caption="Five reasons systems go unused.",
            footer="None of these is a technical fault, and none is fixed by "
                   "improving the system. That is why adoption is planned "
                   "alongside delivery rather than assumed to follow it."),
        desc(
            "The fourth row is the one organisations handle worst. Where the "
            "previous method remains available, people under pressure use "
            "what they already know -- so retiring the old way is part of "
            "delivering the new one."
        ),
    ]),

    ("Promoting Use", [
        desc(
            "Adoption is influenced deliberately, and the measures are "
            "unglamorous."
        ),
        ol([
            "Involve users during design, since a system people helped shape "
            "is one they have reason to want.",
            "Train at the right moment -- shortly before use, with support "
            "afterwards.",
            "Make the new way easier than the old, which sometimes means "
            "improving the system and sometimes means retiring the "
            "alternative.",
            "Identify people whose adoption others follow, and support them "
            "first.",
            "Measure use, since an assumption about adoption is not "
            "evidence.",
        ]),
        desc(
            "The last point is where organisations discover the problem too "
            "late. Nobody reports not using a system, so non-adoption is "
            "silent -- and it surfaces months later when the benefits that "
            "justified the investment fail to appear."
        ),
    ]),

    ("Evaluating a System in Use", [
        desc(
            "Once running, a system is evaluated against what it was supposed "
            "to achieve rather than against whether it works."
        ),
        compare_grid(
            "TECHNICAL EVALUATION AGAINST BUSINESS EVALUATION",
            "Two questions, and only one is what the money was for.",
            [("Technical",
              ["Does it meet its specifications",
               "Is it available, fast and correct",
               "Measurable within days",
               "Answerable by the technology function"]),
             ("Business",
              ["Did the expected benefits materialise",
               "Is the process actually better",
               "Measurable only after months of use",
               "Answerable only by the business"])]),
        desc(
            "The right-hand column is what the investment was justified by "
            "and what is measured least. It requires somebody who remains "
            "after the project, a date on which the question will be asked, "
            "and a baseline from before -- and without all three, the "
            "question is never answered."
        ),
    ]),

    ("Measuring Benefits", [
        desc(
            "Benefits are claimed in business cases and confirmed far less "
            "often, largely because measuring them requires preparation."
        ),
        ol([
            "State the benefit in terms that could be observed -- a figure "
            "that would move.",
            "Measure the BEFORE state, since a benefit is a difference and a "
            "difference needs two measurements.",
            "Name somebody accountable for realising it, who will still be "
            "there.",
            "Set the date on which it will be assessed, allowing for the time "
            "it takes to materialise.",
            "Assess it, and record the answer whichever way it comes out.",
        ]),
        desc(
            "Step two is the one whose omission makes everything after it "
            "impossible. Without a baseline, the post-implementation figure "
            "can be compared only with an estimate of what things were like "
            "-- and estimates made after the fact reliably favour whatever "
            "conclusion is wanted."
        ),
    ]),

    ("Post-Implementation Review", [
        desc(
            "A formal review after a system has settled asks what was "
            "achieved and what should be done differently."
        ),
        ul([
            "Held after enough time for real usage patterns to emerge, "
            "typically months rather than weeks.",
            "Covers the benefits, the costs actually incurred, and how the "
            "project itself went.",
            "Distinguishes 'we delivered what we planned' from 'it produced "
            "what we expected', which are different findings.",
            "Feeds the organisation's estimating and its future business "
            "cases, since a pattern of overstated benefits is itself "
            "information.",
            "Records the answer even when it is unwelcome, since a review "
            "producing only favourable findings is not one.",
        ]),
        desc(
            "The fourth point is the compounding benefit. An organisation "
            "that never checks its business cases against outcomes cannot "
            "improve them, and its estimates of benefit stay as optimistic as "
            "they were the first time -- which means every investment "
            "decision is made on figures nobody has ever tested."
        ),
    ]),

    ("Improving Utilisation", [
        desc(
            "A system in use can be used better, and the opportunities are "
            "usually visible in how it is actually being operated."
        ),
        table(
            ["Observed", "Suggests"],
            [["Features nobody uses",
              "They were unnecessary, or nobody knows about them"],
             ["Data exported and manipulated elsewhere",
              "The system does not do something people need"],
             ["Workarounds recurring across users",
              "A gap between the design and the work"],
             ["Wide variation in how people use it",
              "Training or convention is missing"],
             ["Support contacts clustering on one function",
              "That function is confusing or wrong"]],
            caption="Five observations and what each points to.",
            footer="EXPORTED DATA is the most informative signal available. "
                   "Whatever people do to it after exporting is something "
                   "they need and the system does not provide, and it is "
                   "recorded nowhere as a requirement."),
        desc(
            "All of these are observations about USE rather than opinions "
            "about the system, which is what makes them reliable. Asking "
            "people what should be improved produces preferences; watching "
            "what they do produces evidence."
        ),
    ]),

    ("Training and Support for Adoption", [
        desc(
            "Training is the intervention organisations reach for first, and "
            "it works only under conditions that are frequently absent."
        ),
        image(fig("as-is-to-be")),
        table(
            ["Training fails when", "Because"],
            [["Delivered months before the system arrives",
              "It is forgotten before it can be applied"],
             ["Delivered during the cutover",
              "It competes with everything else happening"],
             ["It demonstrates the system rather than the work",
              "People need to do their job, not tour the screens"],
             ["No support exists afterwards",
              "The first real difficulty has nowhere to go"],
             ["The system does not fit the work",
              "Training cannot fix a mismatch"]],
            caption="Five ways training fails to produce adoption.",
            footer="The last row is the important one. Training is frequently "
                   "proposed as the remedy for a system people are avoiding, "
                   "and where the avoidance is rational the training changes "
                   "nothing and confirms that nobody was listening."),
        desc(
            "The most effective arrangement is training shortly before use, "
            "framed around the tasks people actually perform, with support "
            "available afterwards for the difficulties that only appear in "
            "real work."
        ),
    ]),

    ("Data Quality and Trust", [
        desc(
            "A system people do not trust is a system people work around, and "
            "trust is lost far more easily than it is regained."
        ),
        ul([
            "Migrated data that was wrong at launch teaches people the system "
            "cannot be relied on.",
            "A visible early failure has an effect out of proportion to its "
            "severity.",
            "Where the system and a previous source disagree, people believe "
            "the one they have always used.",
            "Trust is rebuilt by consistent correctness over time, not by "
            "explaining that the problem was fixed.",
            "So data quality before launch is an adoption measure as much as "
            "a technical one.",
        ]),
        desc(
            "The third point is why migration accuracy matters "
            "disproportionately. A single visible discrepancy between the new "
            "system and a familiar report is enough for a whole department to "
            "keep using the old report -- and the parallel use then makes "
            "both sets of figures unreliable."
        ),
    ]),

    ("Retiring a System", [
        desc(
            "Utilisation ends, and retiring a system properly is part of "
            "managing the estate rather than an afterthought."
        ),
        ol([
            "Confirm nothing still depends on it, including reports and "
            "interfaces nobody mentioned.",
            "Decide what happens to the data, including what must be retained "
            "and for how long.",
            "Ensure retained data remains READABLE, which may mean migrating "
            "it somewhere that will still be running.",
            "Revoke access, licences and interfaces that other systems still "
            "hold.",
            "Recover the capacity, the licence cost and the support effort, "
            "which is the benefit of retiring it at all.",
        ]),
        desc(
            "The first step is where retirement projects stall. Systems "
            "acquire dependants nobody recorded -- a monthly report, a feed "
            "into another system, a spreadsheet somebody built -- and finding "
            "them requires asking rather than inspecting."
        ),
    ]),

    ("Measuring Utilisation", [
        desc(
            "Use is measured rather than assumed, and what is measured "
            "determines what can be acted on."
        ),
        table(
            ["Measure", "Reveals"],
            [["Active users against intended users",
              "Whether adoption happened at all"],
             ["Frequency of use per user",
              "Whether it became part of the work or stayed occasional"],
             ["Which functions are used",
              "Which parts of the investment produced anything"],
             ["Where use is concentrated",
              "Whether whole groups never adopted it"],
             ["Trend over time",
              "Whether adoption is growing, plateaued or declining"]],
            caption="Five utilisation measures.",
            footer="The fourth row is the one that changes the response. Even "
                   "adoption across groups suggests a system people are "
                   "learning; adoption concentrated in one department "
                   "suggests something specific about the others that can be "
                   "found and addressed."),
        desc(
            "A DECLINING trend is the most urgent signal, because it means "
            "people who adopted the system have stopped -- which indicates "
            "something they discovered through use rather than something "
            "about the introduction."
        ),
    ]),

    ("Feeding Improvement Back", [
        desc(
            "What utilisation measurement finds is only worth gathering if "
            "something acts on it."
        ),
        ol([
            "Route the findings to whoever can change the system, the process "
            "or the training.",
            "Distinguish what needs a system change from what needs a process "
            "or training change, since they have different owners.",
            "Prioritise by how many people are affected and how often, rather "
            "than by who complained.",
            "Feed unstated requirements -- exported data, recurring "
            "workarounds -- into the change process as candidates.",
            "Measure again after acting, to establish whether it helped.",
        ]),
        desc(
            "The second step prevents the commonest misdirection. A usability "
            "problem sent to a training team produces training for a system "
            "that remains difficult, and a training gap sent to developers "
            "produces changes nobody needed -- and both consume effort "
            "without addressing anything."
        ),
    ]),

    ("Superusers and Local Support", [
        desc(
            "Adoption spreads through people rather than through "
            "announcements, and identifying who those people are is a "
            "deliberate act."
        ),
        ul([
            "Every group contains somebody others ask when they are stuck, "
            "whatever the organisation chart says.",
            "Supporting those people first means each of them supports "
            "several others.",
            "They also report problems the formal channel never receives, "
            "since colleagues tell them things nobody would raise a ticket "
            "about.",
            "Their endorsement carries weight the project's own "
            "communication cannot.",
            "Recognising the role costs little and is frequently not done at "
            "all.",
        ]),
        desc(
            "The third point makes this a measurement channel as well as a "
            "support one. Problems people find too small to report are "
            "exactly the friction that determines whether a system becomes "
            "part of the work -- and the person everybody asks hears all of "
            "them."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where utilisation items are lost."),
        ul([
            "Assuming adoption follows delivery, when nothing requires "
            "anybody to change.",
            "Leaving the previous method available, so people under pressure "
            "use what they know.",
            "Evaluating only technically, when the investment was justified "
            "by business benefit.",
            "Failing to measure the before state, which makes the benefit "
            "unmeasurable.",
            "Holding a review too early, before real usage patterns have "
            "formed.",
            "Recording only favourable review findings.",
            "Asking users what to improve rather than watching what they "
            "do.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A system met every specification and is used by a third of the "
            "intended users a year later. The business case's benefits have "
            "not appeared. What went wrong?\""
        ),
        ol([
            "Note what succeeded: the technical evaluation, since every "
            "specification was met.",
            "Note what failed: adoption, and consequently the benefits, which "
            "depended on the system being used.",
            "The benefits in the business case assumed full adoption, which "
            "was treated as automatic rather than as something to be "
            "achieved.",
            "Non-adoption is SILENT -- nobody reports not using a system -- "
            "so a year passed before the gap became visible.",
            "What was missing is adoption planning during delivery and "
            "measurement of use afterwards, either of which would have "
            "surfaced it within weeks.",
        ]),
        desc(
            "The item works because the delivery was faultless. A project can "
            "meet every specification and produce nothing, and the "
            "distinction between delivering a system and obtaining a benefit "
            "is exactly what this lesson exists to make."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Utilisation closes the loop the investment opened."),
        ul([
            "Non-adoption is the operational feasibility of the investment "
            "lesson.",
            "Involving users during design is the requirements category's "
            "elicitation.",
            "Benefits realisation is what the governance lesson holds "
            "management accountable for.",
            "Baseline measurement parallels the process analysis lesson.",
            "Watching use rather than asking is the observation technique of "
            "requirements work.",
            "Post-implementation review feeds the estimating of Project "
            "Management.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Why systems go unused",
              "Reasons that are never technical faults",
              "Fit, usability, awareness, the old way still working, and "
              "trust."),
             ("Why non-adoption is discovered late",
              "Nobody reports not using something",
              "It surfaces when the benefits fail to appear, months "
              "afterwards."),
             ("What makes a benefit measurable",
              "A BEFORE measurement",
              "A benefit is a difference, and a difference needs two "
              "figures."),
             ("Technical against business evaluation",
              "Does it work, against did it achieve anything",
              "Only the second is what the money was for, and it is measured "
              "least."),
             ("When a post-implementation review is held",
              "After real usage patterns emerge -- months",
              "Held too early it measures the transition rather than the "
              "system."),
             ("The most informative usage signal",
              "Data exported and manipulated elsewhere",
              "Whatever people do to it afterwards is a requirement recorded "
              "nowhere.")]),
    ]),
]

_util_quiz = [
    mcq("HARD",
        "A system met every specification and is used by a third of intended "
        "users a year later, with no benefits realised.\n\n"
        "What went wrong?",
        [("Adoption was treated as automatic rather than as something to be "
          "achieved and measured", True),
         ("The specifications did not reflect what users actually "
          "needed", False),
         ("The benefits stated in the business case were "
          "overstated", False),
         ("The system's technical quality was insufficient for daily "
          "use", False),
         ],
        "Every specification was met, so the technical work succeeded. The "
        "benefits assumed full adoption, and nothing planned or measured it "
        "-- and because nobody reports NOT using a system, the gap stayed "
        "invisible for a year. Adoption planning during delivery, or usage "
        "measurement afterwards, would each have surfaced it within weeks."),

    mcq("AVERAGE",
        "A before measurement is essential to demonstrating a "
        "benefit.\n\nOn what grounds?",
        [("A benefit is a difference, which requires two "
          "measurements", True),
         ("Auditors require a baseline for investment "
          "appraisal", False),
         ("It establishes whether the system was needed at all", False),
         ("It determines the target the project should aim for", False)],
        "Without a baseline, the figure after implementation can be compared "
        "only with an estimate of how things were -- and estimates made after "
        "the fact reliably favour whatever conclusion is wanted. The before "
        "measurement must be taken before the change, which means planning "
        "it while everybody is focused on delivery."),

    mcq("HARD",
        "Non-adoption of a delivered system goes undetected for a long "
        "time.\n\nWhat accounts for that?",
        [("Nobody reports not using something, so it produces no "
          "signal", True),
         ("Usage statistics are not collected by most business "
          "systems", False),
         ("Users conceal non-use to avoid appearing "
          "uncooperative", False),
         ("Adoption is expected to take time, so early figures are "
          "ignored", False)],
        "Incidents, complaints and requests all generate contacts; not using "
        "something generates nothing at all. The absence surfaces when the "
        "benefits that depended on use fail to appear -- typically months "
        "later, when correcting it is hardest -- which is why usage is "
        "measured deliberately rather than assumed."),

    mcq("AVERAGE",
        "A new system is introduced and the previous method remains "
        "available.\n\nWhat usually happens?",
        [("People under pressure use the method they already know", True),
         ("Users migrate gradually as they become comfortable", False),
         ("Both methods are used, producing inconsistent data", False),
         ("The new system is adopted for new work only", False)],
        "Under time pressure people do what is fastest for them right now, "
        "which is the thing they already know how to do. Retiring the "
        "alternative is therefore part of delivering the new system rather "
        "than a subsequent tidying exercise -- and leaving it available is "
        "among the commonest causes of low adoption."),

    mcq("HARD",
        "Which observation about system use is most informative about "
        "unstated requirements?",
        [("Data being exported and manipulated elsewhere", True),
         ("Features that no user has ever accessed", False),
         ("Wide variation in how different users operate it", False),
         ("Support contacts clustering on one function", False)],
        "Whatever people do to data after exporting it is something they need "
        "and the system does not provide -- and it appears in no requirements "
        "document because nobody asked. Unused features, usage variation and "
        "clustered support contacts each indicate something and none of them "
        "reveals a missing capability so directly."),

    mcq("AVERAGE",
        "When should a post-implementation review be held?",
        [("After enough time for real usage patterns to emerge", True),
         ("Immediately after go-live, while events are "
          "remembered", False),
         ("At the point the project team is released", False),
         ("When the first significant defect is reported", False)],
        "Held too early, a review measures the transition -- the incident "
        "spike, the learning curve, the temporary support arrangements -- "
        "rather than the system in normal use. Benefits also take months to "
        "materialise, so a review timed for convenience answers a different "
        "question from the one it was meant to."),

    mcq("HARD",
        "What distinguishes technical evaluation from business evaluation of "
        "a system?",
        [("Whether it works, against whether it achieved what it was funded "
          "for", True),
         ("Who performs the evaluation within the "
          "organisation", False),
         ("Whether it is performed before or after go-live", False),
         ("Whether it examines the system or the project that built "
          "it", False)],
        "Technical evaluation asks whether the system meets its "
        "specifications and is answerable within days. Business evaluation "
        "asks whether the expected benefits materialised, is answerable only "
        "after months, and is what the investment was justified by -- which "
        "is also why it is the one most often never performed."),

    mcq("AVERAGE",
        "What does a pattern of overstated benefits across past projects "
        "provide?",
        [("Information that should improve future business cases", True),
         ("Grounds for rejecting future investment "
          "proposals", False),
         ("Evidence that the benefits were not properly "
          "measured", False),
         ("A reason to increase the rigour of technical "
          "evaluation", False)],
        "An organisation that never checks business cases against outcomes "
        "keeps estimating benefits as optimistically as it did the first "
        "time, so every investment decision rests on figures nobody has "
        "tested. Recording what actually happened -- including when it "
        "disappoints -- is what allows the next estimate to be better."),

    mcq("HARD",
        "Why is watching how a system is used more reliable than asking users "
        "what to improve?",
        [("Watching produces evidence about behaviour; asking produces "
          "preferences", True),
         ("Users are reluctant to criticise a system the organisation "
          "purchased", False),
         ("Users cannot articulate technical improvements "
          "accurately", False),
         ("Observation covers more users than interviews can "
          "reach", False)],
        "What people do reveals what the system fails to support, and what "
        "they say reveals what comes to mind when asked -- which is "
        "influenced by recent frustrations rather than by frequency or cost. "
        "It is the same distinction the requirements category draws between "
        "observation and interview."),

    mcq("AVERAGE",
        "Why do the reasons systems go unused rarely have technical "
        "remedies?",
        [("They concern fit, awareness, effort and trust rather than "
          "function", True),
         ("Technical faults are corrected before a system is "
          "released", False),
         ("Users do not report technical problems with unused "
          "systems", False),
         ("Improving a system further increases the training "
          "burden", False)],
        "A system that does not fit how work is done, is harder than what "
        "people did before, is unknown, has a surviving alternative, or is "
        "not trusted has no defect to fix. Each requires understanding the "
        "work, planning adoption, retiring the old way or repairing "
        "confidence -- none of which is a change to the software."),
]

LESSON_SYS_UTIL = lesson(
    MAJOR, MIDDLE,
    "System Utilisation Promotion and Evaluation",
    _util_quiz,
    lesson_structure(
        "System Utilisation Promotion and Evaluation",
        "A system delivered, working and unused has produced nothing, and the "
        "reasons systems go unused are never technical faults -- fit, "
        "usability, awareness, a surviving alternative, and trust. This "
        "lesson treats adoption as something planned rather than assumed, "
        "since non-adoption is SILENT and surfaces only when the benefits "
        "fail to appear months later. It covers evaluating against what the "
        "investment was justified by rather than against whether the system "
        "works, the BEFORE measurement without which a benefit cannot be "
        "demonstrated, the post-implementation review that must record "
        "unwelcome answers, and the usage observations that reveal "
        "requirements nobody stated.",
        [
            "Explain why delivered systems go unused and why the causes are "
            "not technical",
            "Plan adoption alongside delivery",
            "Explain why non-adoption is discovered late",
            "Distinguish technical from business evaluation",
            "Measure benefits, including the baseline requirement",
            "Time and conduct a post-implementation review",
            "Interpret usage observations as unstated requirements",
            "Explain why watching beats asking",
        ],
        75,
        _util_sections,
        [
            ("Reasons for non-use",
             "Fit, effort, awareness, a surviving alternative, and trust -- "
             "none of them technical faults."),
            ("Silent non-adoption",
             "Nobody reports not using something, so it produces no signal "
             "until benefits fail."),
            ("Retiring the old way",
             "Part of delivering the new one, since people under pressure use "
             "what they know."),
            ("Technical evaluation",
             "Does it meet its specifications. Answerable within days."),
            ("Business evaluation",
             "Did the expected benefits materialise. Answerable only after "
             "months, and measured least."),
            ("Baseline measurement",
             "The before figure, without which a benefit cannot be "
             "demonstrated at all."),
            ("Post-implementation review",
             "Held after usage patterns emerge, recording unwelcome findings "
             "and feeding future business cases."),
            ("Exported data",
             "The most informative usage signal -- whatever happens to it "
             "afterwards is an unrecorded requirement."),
        ],
        "A system delivered and unused has produced nothing, and the reasons "
        "are never technical: it does not fit how the work is done, it is "
        "harder than what people did before, nobody knows about it, the old "
        "way still works, or people do not trust its output. None is fixed by "
        "improving the system, which is why adoption is planned alongside "
        "delivery -- and why the surviving alternative must be retired, since "
        "people under pressure use what they already know. Non-adoption is "
        "SILENT: nobody reports not using something, so it surfaces only when "
        "the benefits that assumed use fail to appear, by which time a year "
        "may have passed. Evaluation therefore has two halves, and the "
        "TECHNICAL one -- does it meet its specifications -- is answerable in "
        "days while the BUSINESS one is answerable in months and is what the "
        "money was for. Measuring a benefit requires a BEFORE figure, since a "
        "benefit is a difference, and taking it means planning while "
        "everybody is focused on delivery. The post-implementation review "
        "waits until real usage has settled, records unwelcome answers, and "
        "feeds the organisation's future business cases -- without which "
        "every investment decision rests on benefit estimates nobody has ever "
        "tested.",
        exam_notes=[
            desc(
                "Items describe a delivered system that produced nothing and "
                "ask what was missing."
            ),
            ul([
                "Diagnosing unplanned adoption behind unrealised benefits.",
                "Explaining why non-adoption is found late.",
                "Explaining why a baseline is essential.",
                "Distinguishing technical from business evaluation.",
                "Timing a post-implementation review.",
                "Interpreting exported data as a requirement.",
                "Explaining why watching beats asking.",
            ]),
            desc(
                "When a system works and produced no benefit, look for "
                "adoption before looking for anything else. The delivery is "
                "usually faultless in these items, and the gap between "
                "delivering a system and obtaining a benefit is what they "
                "exist to test."
            ),
        ],
    ))

LESSONS = [LESSON_SYS_SOL, LESSON_SYS_UTIL]

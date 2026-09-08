"""Service Management, lessons 1 to 3.

Foundations and the service lifecycle, service design and transition, and the
operational processes.

The processes lesson carries the distinction the examination presses hardest
-- incident against problem management -- so it is treated as two different
questions rather than two names for handling failures.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Service Management"
MIDDLE = "Service Management"

# ==========================================================================
# Lesson 1: Foundations
# ==========================================================================

_found_sections = [
    ("Delivering Value Continuously", [
        desc(
            "A project delivers something once. A service delivers value "
            "continuously, and is judged every day rather than at the end."
        ),
        image(fig("project-vs-service")),
        desc(
            "Most of a system's life and most of its cost belong to the "
            "service rather than to the project that built it -- which is why "
            "a project handing over something unrunnable has optimised the "
            "smaller half of the problem."
        ),
        table(
            ["", "Project", "Service"],
            [["Duration", "Temporary", "Continuing"],
             ["Succeeds by", "Delivering the objective",
              "Meeting agreed levels, every day"],
             ["Measured", "At the end", "Continuously"],
             ["Ends", "When delivered", "When retired"]],
            caption="Two ways of being accountable for the same system.",
            footer="The second row is the practical difference. A project can "
                   "succeed once; a service has to succeed repeatedly, and a "
                   "single day's failure is visible in a way a project's "
                   "internal difficulties never were."),
    ]),

    ("What a Service Actually Is", [
        desc(
            "The syllabus defines a service by what the customer gets rather "
            "than by what is provided."
        ),
        desc(
            "A service delivers VALUE to customers by facilitating outcomes "
            "they want, without them owning the specific costs and risks. "
            "That framing matters: a customer buys an outcome -- orders "
            "processed, staff paid, information available -- rather than "
            "servers, software or people."
        ),
        ul([
            "UTILITY is fitness for purpose: does it do what is needed?",
            "WARRANTY is fitness for use: is it available, sufficient, "
            "continuous and secure enough to be relied on?",
            "Both are required. Something that does the right thing "
            "unreliably delivers no value, and neither does something "
            "reliable that does the wrong thing.",
            "Value is judged by the customer rather than by the provider, "
            "which is why service perception matters alongside measurement.",
        ]),
        desc(
            "The utility and warranty pair is examined because it separates "
            "two complaints that sound alike. 'It does not do what we need' "
            "and 'it keeps failing' require completely different responses, "
            "and the second is what service management mostly concerns."
        ),
    ]),

    ("The Service Lifecycle", [
        desc(
            "Services are managed across a cycle rather than a sequence, "
            "because a service outlives every change made to it."
        ),
        image(fig("service-lifecycle")),
        table(
            ["Stage", "Decides"],
            [["Strategy", "Which services to offer, to whom, and why"],
             ["Design", "How each will meet its requirements"],
             ["Transition", "How it moves into live operation safely"],
             ["Operation", "How it is delivered day to day"],
             ["Continual improvement", "What is measured, and what changes"]],
            caption="Five stages, applied and reapplied throughout a "
                    "service's life.",
            footer="CONTINUAL IMPROVEMENT is not a final stage. It runs "
                   "alongside the others, because a service that is never "
                   "reassessed against changing needs becomes gradually less "
                   "suitable without anything visibly failing."),
    ]),

    ("Service Strategy", [
        desc(
            "Before designing a service, somebody decides whether it should "
            "exist and what it is for."
        ),
        ol([
            "Understand what outcomes the customers actually need, which is "
            "not the same as what they currently receive.",
            "Decide which services the organisation will provide, and which "
            "it will not.",
            "Establish how each will be funded, since a service with no "
            "funding model is a cost nobody owns.",
            "Define what value each delivers, in terms the customer "
            "recognises.",
            "Decide how demand will be managed, since capacity costs money "
            "whether it is used or not.",
        ]),
        desc(
            "DEMAND MANAGEMENT deserves attention because capacity must be "
            "provided in advance of the demand it serves. Influencing demand "
            "-- moving batch work off peak hours, pricing to spread usage -- "
            "is frequently cheaper than providing capacity for a peak that "
            "lasts an hour a day."
        ),
    ]),

    ("Service Providers and Customers", [
        desc(
            "The syllabus distinguishes the parties, since the relationship "
            "differs with the arrangement."
        ),
        table(
            ["Provider type", "Serves", "Characteristic tension"],
            [["Internal", "One business unit within the organisation",
              "Priorities set by the unit rather than the organisation"],
             ["Shared services", "Several units of one organisation",
              "Competing priorities and allocated cost"],
             ["External", "Other organisations, under contract",
              "The contract defines the relationship"]],
            caption="Three provider arrangements.",
            footer="SHARED SERVICES carry the tension most visibly. Each "
                   "customer wants their priority served first, and the "
                   "arrangement's value depends on somebody having the "
                   "authority to decide between them."),
        desc(
            "The distinction between CUSTOMER and USER is examined: the "
            "customer agrees and pays for the service, and the user consumes "
            "it. They are frequently different people with different "
            "concerns, and a service satisfying only one of them is failing."
        ),
    ]),

    ("Service Assets", [
        desc(
            "A provider delivers services using two kinds of asset, and "
            "distinguishing them explains why capability is harder to acquire "
            "than equipment."
        ),
        compare_grid(
            "RESOURCES AGAINST CAPABILITIES",
            "What a provider has, against what it can do.",
            [("Resources",
              ["Infrastructure, applications, money, people as headcount",
               "Can be bought",
               "Countable, and comparable between providers",
               "Necessary and not sufficient"]),
             ("Capabilities",
              ["Management, processes, knowledge, experience",
               "Developed over time rather than purchased",
               "Difficult to observe from outside",
               "What actually distinguishes providers"])]),
        desc(
            "The distinction explains a recurring disappointment. Two "
            "providers with identical equipment deliver very different "
            "services, because the difference sits in capabilities that "
            "cannot be inspected in a proposal -- which is why references and "
            "track record matter more than specifications."
        ),
    ]),

    ("Service Level Management", [
        desc(
            "The process that connects what customers need to what the "
            "provider delivers, and keeps the two aligned."
        ),
        ol([
            "Establish what levels the business actually requires, in "
            "measurable terms.",
            "Negotiate what can realistically be provided at what cost, since "
            "the two rarely coincide at first.",
            "Agree and document them, with the definitions that make each "
            "figure meaningful.",
            "Monitor actual performance against them, continuously rather "
            "than at review time.",
            "Review regularly, since both the business need and the "
            "provider's capability change.",
        ]),
        desc(
            "Step two is where the process earns its existence. A business "
            "asked what availability it wants answers 'complete', and asked "
            "what it will pay answers differently -- so the negotiation "
            "surfaces a trade the business must actually make rather than one "
            "the provider makes silently."
        ),
    ]),

    ("Measuring a Service", [
        desc(
            "What is measured determines what is managed, and choosing badly "
            "produces confident reporting about the wrong things."
        ),
        table(
            ["Measure", "Reveals", "Fails to reveal"],
            [["Availability percentage", "Total downtime",
              "Whether it fell at a critical moment"],
             ["Incident volume", "How much goes wrong",
              "Whether the same cause keeps recurring"],
             ["Average resolution time", "Typical performance",
              "The long tail where users actually suffer"],
             ["Customer satisfaction", "Perception",
              "Whether the underlying service improved"]],
            caption="Four common measures and each one's blind spot.",
            footer="AVERAGE RESOLUTION TIME is the most misleading. Most "
                   "incidents resolved in minutes and a few taking days "
                   "produce a comfortable average, and the few are what "
                   "people remember."),
        desc(
            "Measures also change behaviour, which is the second reason to "
            "choose carefully. A team measured on closure rate closes "
            "incidents; whether the user's problem was solved is a different "
            "question, and only asking it prevents the measure from replacing "
            "the objective."
        ),
    ]),

    ("Service Catalogue and Portfolio", [
        desc(
            "An organisation needs a record of what it provides and what it "
            "could provide, and the syllabus distinguishes the two."
        ),
        table(
            ["", "Service portfolio", "Service catalogue"],
            [["Contains", "Everything -- planned, live and retired",
              "Only what is currently available"],
             ["Audience", "The provider, for planning",
              "Customers, for choosing and requesting"],
             ["Describes", "Investment and lifecycle status",
              "What the customer gets, and how to obtain it"]],
            caption="Two records serving two different audiences.",
            footer="The CATALOGUE is what customers see, so it is written in "
                   "their terms rather than the provider's. A catalogue "
                   "listing servers and platforms describes the provider's "
                   "assets rather than the outcomes anybody is trying to "
                   "buy."),
        desc(
            "A service nobody can find in a catalogue is a service people "
            "route around, usually by asking somebody they know -- which is "
            "how shadow arrangements form and why the catalogue's usability "
            "matters more than its completeness."
        ),
    ]),

    ("Financial Management for Services", [
        desc(
            "Services cost money continuously, and how that cost is handled "
            "shapes behaviour throughout the organisation."
        ),
        ul([
            "BUDGETING forecasts what the service will cost over a period.",
            "ACCOUNTING establishes what it actually costs, and where the "
            "money goes.",
            "CHARGING recovers cost from customers, which is optional and "
            "changes behaviour when it is applied.",
            "Charging makes demand visible and discourages waste, and it also "
            "makes customers optimise for their own bill rather than for the "
            "organisation.",
        ]),
        desc(
            "The last point is the genuine trade. A department charged for "
            "storage deletes what it does not need, which is the intended "
            "effect -- and may also avoid a shared service in favour of "
            "something cheaper for them and worse for the organisation, which "
            "is not."
        ),
    ]),

    ("Improving a Service", [
        desc(
            "Continual improvement is a discipline with a method rather than "
            "an aspiration, and the syllabus gives the sequence."
        ),
        ol([
            "Establish what the improvement is FOR -- which business outcome "
            "it serves.",
            "Establish where things stand now, by measuring rather than "
            "assuming.",
            "Define where they should be, in terms the same measurement can "
            "confirm.",
            "Make the change, and keep it small enough to attribute an effect "
            "to.",
            "Measure again, and decide whether it helped, before moving to "
            "the next thing.",
        ]),
        desc(
            "Steps two and five bracket the whole exercise, and skipping "
            "either turns improvement into change. Without a baseline nobody "
            "can say whether it helped; without a follow-up measurement, an "
            "adjustment that made things worse becomes established practice."
        ),
    ]),

    ("Service Ownership", [
        desc(
            "Every service needs somebody answerable for it, distinct from "
            "the teams that operate its parts."
        ),
        table(
            ["Role", "Answerable for"],
            [["Service owner",
              "The service as a whole, end to end, to the customer"],
             ["Process owner",
              "One process working consistently across every service"],
             ["Technical owner",
              "One component, which several services may depend on"],
             ["Customer relationship",
              "Whether the customer's needs are being understood"]],
            caption="Four ownership roles, easily conflated.",
            footer="A SERVICE OWNER is needed because customers experience "
                   "the whole. Component owners each doing their part "
                   "correctly can still deliver a service nobody is "
                   "accountable for, and the gaps between them are exactly "
                   "where it fails."),
        desc(
            "This is the same reasoning as integration management in the "
            "project category: separate parts optimised correctly do not "
            "assemble themselves into a coherent whole, and somebody has to "
            "own the whole for it to exist."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where foundation items are lost."),
        ul([
            "Treating a service as a project that has not finished, rather "
            "than as a different kind of accountability.",
            "Confusing utility with warranty. Fit for purpose against fit for "
            "use.",
            "Treating continual improvement as a final stage rather than a "
            "continuous one.",
            "Providing capacity for peaks without considering whether demand "
            "can be influenced.",
            "Confusing the customer with the user.",
            "Defining a service by what is provided rather than by the "
            "outcome the customer obtains.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"Users report that a system does exactly what they need and is "
            "unavailable for several hours most weeks. Which service "
            "characteristic is deficient?\""
        ),
        ol([
            "Establish what the users confirm: it does what is needed, which "
            "is UTILITY -- fitness for purpose.",
            "Establish what fails: it is not available when required, which "
            "is WARRANTY -- fitness for use.",
            "Both are required for value to be delivered, so a service with "
            "utility and no warranty delivers none.",
            "The distinction determines the response: a utility problem needs "
            "new functionality, and a warranty problem needs availability, "
            "capacity, continuity or security work.",
            "Here the work belongs in availability and probably problem "
            "management, since repeated unavailability suggests an "
            "uninvestigated underlying cause.",
        ]),
        desc(
            "The item rewards separating two complaints that sound similar. "
            "'It is not good enough' can mean either, and the response to "
            "each is entirely different -- which is why the syllabus insists "
            "on the vocabulary."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Service management begins where the project ends."),
        ul([
            "Handover from a project is where the service lifecycle takes "
            "over, from Development Technology.",
            "Availability and continuity requirements were captured as "
            "non-functional requirements.",
            "Operations as an omitted stakeholder is why services inherit "
            "unrunnable systems.",
            "Security's availability property is a warranty characteristic.",
            "Capacity planning uses the System Evaluation techniques.",
            "Service strategy connects to the System Strategy category.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Project against service",
              "Succeeds once, against succeeds every day",
              "Most of a system's life and cost belong to the service."),
             ("Utility against warranty",
              "Fit for purpose, against fit for use",
              "Both are required; either alone delivers no value."),
             ("What warranty covers",
              "Availability, capacity, continuity and security",
              "Which is most of what service management concerns itself "
              "with."),
             ("Customer against user",
              "Agrees and pays, against consumes",
              "Frequently different people, and a service must satisfy "
              "both."),
             ("Where continual improvement sits",
              "Alongside every stage, not after them",
              "A service never reassessed becomes unsuitable without "
              "visibly failing."),
             ("Why demand management matters",
              "Capacity costs money whether used or not",
              "Influencing demand is often cheaper than serving an hourly "
              "peak.")]),
    ]),
]

_found_quiz = [
    mcq("HARD",
        "A system does exactly what users need and is unavailable for several "
        "hours most weeks.\n\nWhich characteristic is deficient?",
        [("Warranty -- fitness for use", True),
         ("Utility -- fitness for purpose", False),
         ("Both equally, since value requires them together", False),
         ("Neither -- the service meets its functional "
          "specification", False)],
        "Utility is whether it does what is needed, and the users confirm it "
        "does. Warranty is whether it is available, sufficient, continuous "
        "and secure enough to be relied on, which is what fails. Both are "
        "required for value, so utility alone delivers none -- and the "
        "distinction decides the response, since warranty work is "
        "availability and continuity rather than new functionality."),

    mcq("AVERAGE",
        "What most fundamentally distinguishes a service from a project?",
        [("A service is continuing and judged every day; a project is "
          "temporary and judged at the end", True),
         ("A service is operated by a different team from the one that built "
          "it", False),
         ("A service has no defined objective while a project "
          "does", False),
         ("A service is funded operationally while a project is funded as "
          "capital", False),
         ],
        "The accountability differs in kind: a project succeeds once by "
        "delivering, while a service must succeed repeatedly against agreed "
        "levels. That also explains why most of a system's cost belongs to "
        "the service -- and why a project delivering something unrunnable has "
        "optimised the smaller half of the problem."),

    mcq("AVERAGE",
        "What does the warranty of a service cover?",
        [("Availability, capacity, continuity and security", True),
         ("The functions the service performs for its users", False),
         ("The period during which defects are corrected free of "
          "charge", False),
         ("The provider's contractual liability for service "
          "failures", False)],
        "Warranty is fitness for USE -- whether the service can be relied on "
        "-- and it comprises the four characteristics that determine that. "
        "Utility is fitness for purpose, covering what it does. Despite the "
        "word's ordinary meaning, warranty here has nothing to do with a "
        "defect correction period or with liability."),

    mcq("HARD",
        "Why is influencing demand often preferable to providing capacity for "
        "a peak?",
        [("Capacity costs money whether it is used or not", True),
         ("Demand can be reduced permanently by influencing user "
          "behaviour", False),
         ("Peak capacity cannot be provisioned reliably in "
          "advance", False),
         ("Providing capacity requires approval that influencing demand does "
          "not", False)],
        "Capacity must be provided ahead of the demand it serves and is paid "
        "for continuously, so provisioning for a peak lasting an hour a day "
        "means most of it is idle most of the time. Moving batch work off "
        "peak or spreading usage achieves the same outcome by reshaping "
        "demand -- which is frequently far cheaper."),

    mcq("AVERAGE",
        "What distinguishes a customer from a user of a service?",
        [("The customer agrees and pays for it; the user consumes it", True),
         ("The customer is external and the user internal", False),
         ("The customer defines requirements and the user tests "
          "them", False),
         ("The customer receives reports and the user receives "
          "support", False)],
        "They are frequently different people with different concerns -- a "
        "department head agreeing a service level and the staff who use it "
        "daily. A service satisfying only the customer meets its agreement "
        "and frustrates its users; one satisfying only users may not meet "
        "what was agreed or paid for."),

    mcq("HARD",
        "Why is continual improvement described as running alongside the "
        "other lifecycle stages rather than following them?",
        [("A service never reassessed becomes less suitable without visibly "
          "failing", True),
         ("Improvement activities are performed by the operations team "
          "continuously", False),
         ("The lifecycle has no defined end at which improvement could "
          "occur", False),
         ("Improvements identified during design cannot wait until "
          "operation", False)],
        "Business needs move, volumes grow and alternatives appear, so a "
        "service meeting its original requirements drifts out of alignment "
        "gradually and nothing fails to announce it. Improvement therefore "
        "has to be a continuous discipline of measuring and adjusting, rather "
        "than something reached after operation."),

    mcq("AVERAGE",
        "How does the syllabus define a service?",
        [("A means of delivering value by facilitating outcomes customers "
          "want, without them owning the costs and risks", True),
         ("A system operated on behalf of users by a dedicated support "
          "function", False),
         ("A set of processes for maintaining an information system in "
          "operation", False),
         ("An agreement to provide defined levels of system "
          "availability", False)],
        "The definition is framed around the customer's OUTCOME rather than "
        "around what is provided. A customer buys orders processed or staff "
        "paid, not servers and software -- and the specific costs and risks "
        "of achieving that stay with the provider, which is much of what they "
        "are paying for."),

    mcq("HARD",
        "A shared services provider serves several business units whose "
        "priorities conflict.\n\nWhat does the arrangement require?",
        [("Somebody with the authority to decide between competing "
          "priorities", True),
         ("Separate infrastructure for each business unit", False),
         ("Cost allocation proportionate to each unit's usage", False),
         ("Service levels identical across all the units served", False)],
        "Each customer reasonably wants their own priority served first, and "
        "the shared arrangement's value depends on that being resolvable. "
        "Without an authority above the units, the provider is left "
        "arbitrating between customers -- which they cannot do legitimately, "
        "and which makes every decision a dispute."),

    mcq("AVERAGE",
        "Which lifecycle stage decides which services the organisation will "
        "offer?",
        [("Service strategy", True),
         ("Service design, which specifies each service", False),
         ("Service transition, which introduces them", False),
         ("Continual improvement, which reassesses them", False)],
        "Strategy decides what to provide, to whom, why, and how it will be "
        "funded -- the questions that precede designing anything. Design then "
        "establishes how a chosen service will meet its requirements, and "
        "transition moves it into operation. Improvement reassesses services "
        "that already exist."),

    mcq("HARD",
        "A service is described as delivering utility without warranty.\n\n"
        "What value does it deliver?",
        [("None, since both are required", True),
         ("Partial value, proportionate to its availability", False),
         ("Full value when it is available, and none when it is "
          "not", False),
         ("Value to users but not to the customer who pays", False)],
        "Value requires both fitness for purpose and fitness for use: "
        "something that does the right thing unreliably cannot be depended "
        "on, and a business process built on it cannot function. The pairing "
        "is stated as an absolute in the syllabus precisely because "
        "organisations otherwise treat availability as a refinement rather "
        "than a requirement."),
]

LESSON_SVC_FOUND = lesson(
    MAJOR, MIDDLE,
    "Service Management Foundations and the Service Lifecycle",
    _found_quiz,
    lesson_structure(
        "Service Management Foundations and the Service Lifecycle",
        "A project delivers once and a service delivers continuously, which "
        "is a different kind of accountability -- and since most of a "
        "system's life and cost belong to the service, a project handing over "
        "something unrunnable has optimised the smaller half. This lesson "
        "covers the definition of a service by the customer's OUTCOME, the "
        "utility and warranty pair that separates two complaints sounding "
        "alike, the five lifecycle stages with continual improvement running "
        "alongside rather than after, service strategy including the demand "
        "management that is often cheaper than capacity, and the provider "
        "arrangements with their characteristic tensions.",
        [
            "Distinguish a service from a project by the accountability each "
            "carries",
            "Define a service in terms of customer outcomes",
            "Distinguish utility from warranty and identify which is "
            "deficient",
            "Name the lifecycle stages and explain why improvement is "
            "continuous",
            "Describe service strategy decisions including funding and demand",
            "Explain why influencing demand can beat providing capacity",
            "Distinguish provider types and their tensions",
            "Distinguish a customer from a user",
        ],
        75,
        _found_sections,
        [
            ("Service",
             "A means of delivering value by facilitating customer outcomes, "
             "without the customer owning the costs and risks."),
            ("Utility",
             "Fitness for purpose -- whether it does what is needed."),
            ("Warranty",
             "Fitness for use -- availability, capacity, continuity and "
             "security. Both are required for value."),
            ("Service lifecycle",
             "Strategy, design, transition, operation, and continual "
             "improvement running alongside."),
            ("Demand management",
             "Influencing when demand occurs, since capacity costs money "
             "whether used or not."),
            ("Shared services",
             "One provider serving several units, requiring an authority able "
             "to decide between their priorities."),
            ("Customer against user",
             "The party agreeing and paying, against the party consuming. "
             "Frequently different, and both must be satisfied."),
        ],
        "A service delivers value continuously and is judged every day, which "
        "differs in kind from a project's single success -- and since most of "
        "a system's life and cost sit on the service side, a project "
        "delivering something operations cannot run has optimised the smaller "
        "half. A service is defined by the customer's OUTCOME rather than by "
        "what is provided, and it requires both UTILITY, fitness for purpose, "
        "and WARRANTY, fitness for use through availability, capacity, "
        "continuity and security. Either alone delivers no value, and the "
        "pair separates two complaints that sound alike: 'it does not do what "
        "we need' and 'it keeps failing' need entirely different responses. "
        "The lifecycle runs strategy, design, transition and operation, with "
        "continual improvement ALONGSIDE rather than after -- because a "
        "service never reassessed drifts out of alignment without anything "
        "visibly failing. Strategy decides which services exist, how they are "
        "funded, and how demand is managed, since capacity is paid for "
        "whether used or not and reshaping demand is frequently cheaper than "
        "serving a peak. And the vocabulary distinguishes CUSTOMER from USER "
        "-- the party who agrees and pays from the party who consumes -- "
        "since a service satisfying only one of them is failing.",
        exam_notes=[
            desc(
                "Items describe a service complaint and ask which "
                "characteristic or stage it concerns."
            ),
            ul([
                "Identifying whether utility or warranty is deficient.",
                "Distinguishing service from project accountability.",
                "Naming what warranty comprises.",
                "Explaining why demand management can beat capacity.",
                "Distinguishing customer from user.",
                "Placing a decision in the right lifecycle stage.",
                "Explaining why improvement is continuous.",
            ]),
            desc(
                "For any service complaint, ask whether it does the wrong "
                "thing or does the right thing badly. The first is utility "
                "and needs functionality; the second is warranty and needs "
                "availability, capacity, continuity or security work -- and "
                "almost every item in this category is the second."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Service design and transition
# ==========================================================================

_des_sections = [
    ("Designing a Service", [
        desc(
            "Service design produces everything needed for a service to be "
            "delivered, which is considerably more than the system itself."
        ),
        table(
            ["Designed", "Because"],
            [["The service itself", "It must meet the agreed requirements"],
             ["The management systems and tools",
              "It cannot be run without monitoring and control"],
             ["The architecture", "It must fit what already exists"],
             ["The processes", "Somebody must know how it is operated"],
             ["The measurements", "What is not measured cannot be managed"]],
            caption="Five things service design produces.",
            footer="The last two rows are what a project focused on the "
                   "system omits. A service delivered without defined "
                   "operational procedures and without measurement is one "
                   "nobody can run or improve, whatever its functionality."),
        desc(
            "The SERVICE LEVEL requirements come from the customer and shape "
            "everything else -- availability, capacity, continuity and "
            "security targets each drive design decisions that are expensive "
            "to retrofit."
        ),
    ]),

    ("Availability Management", [
        desc(
            "Availability is what most service agreements are written around, "
            "and measuring it requires more definition than it appears."
        ),
        image(fig("availability-measures")),
        desc(
            "Availability is the proportion of the AGREED SERVICE PERIOD "
            "during which the service is usable. Every term in that sentence "
            "has to be defined: what counts as the service period, what "
            "counts as usable, and whether planned maintenance counts against "
            "it."
        ),
        table(
            ["Measure", "Means"],
            [["Availability", "Uptime as a proportion of the agreed period"],
             ["Reliability", "How long it runs before failing"],
             ["Maintainability", "How quickly it is restored after a "
                                 "failure"],
             ["Serviceability", "What external suppliers contribute to the "
                                "above"]],
            caption="Four related measures.",
            footer="Availability is improved by raising RELIABILITY or "
                   "MAINTAINABILITY, and the two are different investments. "
                   "Failing less often and recovering faster produce the same "
                   "figure by different means."),
        desc(
            "The commonest dispute is whether planned downtime counts. It is "
            "a definitional matter settled in the agreement, and two parties "
            "with different assumptions can compute genuinely different "
            "availability figures from identical events."
        ),
    ]),

    ("Capacity Management", [
        desc(
            "Capacity must be sufficient for the demand and is paid for "
            "whether used or not, which makes it a continuous balancing act."
        ),
        ol([
            "Establish current utilisation, measured rather than assumed.",
            "Establish the trend, by hour and day rather than as an average.",
            "Project when the trend meets the limit.",
            "Work back through procurement and installation lead times.",
            "Act with margin, rather than at the point the limit is reached.",
        ]),
        desc(
            "AVERAGES are the recurring trap. A link averaging 40 per cent "
            "may be saturated for two hours every weekday, and users "
            "experience the peak -- so capacity is planned against the busy "
            "period and an average is evidence of very little."
        ),
        desc(
            "Capacity planning also has to anticipate CHANGE rather than only "
            "growth. A new business initiative or a system consolidation "
            "shifts demand faster than any trend predicts, which is why "
            "capacity management belongs alongside business planning rather "
            "than after it."
        ),
    ]),

    ("Continuity Management", [
        desc(
            "Some disruptions exceed what normal operation handles, and "
            "recovering from those is planned separately."
        ),
        image(fig("continuity-measures")),
        table(
            ["Measure", "Answers", "Bought with"],
            [["RTO -- recovery time objective",
              "How quickly must service return",
              "Standby capacity and rehearsed procedures"],
             ["RPO -- recovery point objective",
              "How much recent data may be lost",
              "Backup or replication frequency"]],
            caption="Two objectives driving entirely different investments.",
            footer="RPO looks BACKWARD from the failure to the last usable "
                   "copy; RTO looks FORWARD to service resuming. Confusing "
                   "them produces a plan that satisfies neither."),
        desc(
            "A BUSINESS IMPACT ANALYSIS sets both figures by establishing "
            "which processes matter and what an outage of each costs -- so "
            "the objectives come from the business rather than from what the "
            "technology happens to make convenient."
        ),
        desc(
            "And a plan that has never been exercised is a set of "
            "assumptions. Backups nobody has restored, sites nobody has "
            "failed over to, and contracts nobody has invoked are each "
            "discovered to be broken at the moment they are needed."
        ),
    ]),

    ("Service Transition", [
        desc(
            "Transition moves a new or changed service into operation, and "
            "its purpose is that the move does not itself cause a failure."
        ),
        ul([
            "Confirm the service meets its design and its agreed levels "
            "before it goes live.",
            "Confirm operations can actually run it -- monitoring, backup, "
            "restart and documented procedures.",
            "Train everybody who will operate, support or use it.",
            "Update the configuration records, so what is now running is "
            "known.",
            "Have a way back, tested, in case the transition itself fails.",
        ]),
        desc(
            "The second point is where transition earns its existence. A "
            "service that works and that nobody can operate is a service "
            "generating incidents from its first day -- which is the "
            "operational acceptance the Development Technology category said "
            "projects skip."
        ),
    ]),

    ("Knowledge in Transition", [
        desc(
            "The people who built a service understand it, and the people who "
            "will run it do not -- which transition exists partly to "
            "correct."
        ),
        compare_grid(
            "WHAT TRANSFERS EASILY AND WHAT DOES NOT",
            "Two kinds of knowledge needing two approaches.",
            [("Transfers by documentation",
              ["Procedures, configurations, contacts",
               "Known error workarounds",
               "Architecture and interfaces",
               "Anything somebody thought to write"]),
             ("Transfers only by working together",
              ["Which parts are fragile and why",
               "What the symptoms of common problems look like",
               "Why an odd-looking arrangement was necessary",
               "Judgement about what is normal"])]),
        desc(
            "The right-hand column is why a transition period with overlap "
            "matters more than a document handover. Operations staff involved "
            "before go-live acquire the second kind; those handed a manual on "
            "the day acquire the first only."
        ),
    ]),

    ("Information Security in Service Design", [
        desc(
            "Security is one of the warranty characteristics, so it is "
            "designed into a service rather than added to it."
        ),
        ul([
            "The security requirements come from the organisation's risk "
            "assessment rather than from the service's own preferences.",
            "Access control, monitoring and incident handling are "
            "operational processes needing design, not merely technology.",
            "The service's own management interfaces are a target, and are "
            "frequently the least protected part.",
            "Suppliers contributing to the service inherit its security "
            "obligations, which the contract must carry.",
        ]),
        desc(
            "The third point recurs across the certification. Administrative "
            "and monitoring interfaces are built for convenience during "
            "construction and reach production configured that way, which "
            "makes them a reliable weakness in an otherwise well-designed "
            "service."
        ),
    ]),

    ("Supplier Management", [
        desc(
            "Most services depend on suppliers, and the service's levels "
            "cannot exceed what those suppliers provide."
        ),
        image(fig("sla-structure")),
        desc(
            "Three layers must be consistent: the SLA with the business, the "
            "OLA with internal teams, and the underpinning CONTRACTS with "
            "suppliers. An SLA promising four-hour restoration supported by a "
            "next-business-day contract cannot be met, and nothing in the "
            "service's own operation can compensate."
        ),
        ol([
            "Derive the supplier requirements from the service levels, rather "
            "than agreeing levels and hoping suppliers can support them.",
            "Check every layer supports the one above it, arithmetically "
            "rather than approximately.",
            "Monitor supplier performance against the contract, since a "
            "supplier failure becomes a service failure.",
            "Maintain the relationship, since a supplier who wants the next "
            "contract responds differently in a crisis.",
        ]),
    ]),

    ("Designing for Operation", [
        desc(
            "A service is operated far longer than it is built, so decisions "
            "are judged by what they do to running it."
        ),
        table(
            ["Design decision", "Operational consequence"],
            [["What is monitored", "Whether a problem is noticed before "
                                   "users report it"],
             ["How it is restarted",
              "Whether recovery takes minutes or an afternoon"],
             ["How it is backed up",
              "Whether recovery is possible at all"],
             ["How errors are logged",
              "Whether diagnosis is possible after the fact"],
             ["How it is configured", "Whether a change is safe or "
                                      "frightening"]],
            caption="Five design decisions with operational consequences.",
            footer="Each row is decided during design, paid for during "
                   "operation, and invisible to anybody evaluating the "
                   "service on its functionality -- which is why operations "
                   "have to be involved before the design is fixed."),
        desc(
            "The first row is the one with the widest effect. A service whose "
            "problems are reported by users rather than detected by "
            "monitoring is a service permanently reacting, and no amount of "
            "operational effort compensates for not knowing."
        ),
    ]),

    ("Service Validation and Testing", [
        desc(
            "Transition tests the SERVICE rather than only the system, which "
            "covers things system testing does not."
        ),
        ul([
            "The operational procedures: can somebody actually follow them "
            "and get the intended result.",
            "The support arrangements: does an incident reach somebody who "
            "can act on it.",
            "The monitoring: does it detect the failures it was designed to "
            "detect.",
            "The recovery: does the backup restore, and does the failover "
            "work.",
            "The service levels: are they achievable in the real "
            "environment.",
        ]),
        desc(
            "The second point is examined as a specific failure. A service "
            "can be technically sound and unsupportable, because nobody "
            "defined who is called, when, and with what authority -- and that "
            "is discovered by the first incident rather than by any test of "
            "the system."
        ),
    ]),

    ("Early Life Support", [
        desc(
            "The period immediately after a service goes live has a character "
            "of its own, and it is planned for rather than absorbed."
        ),
        compare_grid(
            "WHY THE FIRST WEEKS DIFFER",
            "The same service, under different conditions.",
            [("Immediately after go-live",
              ["Everybody meets it at once, so incidents spike",
               "Support staff are learning alongside users",
               "Undiscovered defects surface under real usage",
               "Monitoring thresholds have no baseline yet"]),
             ("In steady state",
              ["Incident volume settles to a normal rate",
               "Support has seen the common problems",
               "The remaining defects are rare ones",
               "Thresholds are set from observed behaviour"])]),
        desc(
            "Keeping the project team available during that period is what "
            "makes it survivable. They know what changed and why, and "
            "reassigning them on the go-live date guarantees the first "
            "problems are diagnosed by people meeting the service for the "
            "first time."
        ),
    ]),

    ("Change Evaluation Before Go-Live", [
        desc(
            "The final check before a service enters operation asks whether "
            "it should, which is a decision rather than a formality."
        ),
        table(
            ["Assessed", "Question"],
            [["Performance against design",
              "Does it do what the design said it would"],
             ["Operational readiness",
              "Can it be run, monitored, backed up and restored"],
             ["Residual risk", "What remains unresolved, and is that "
                               "acceptable"],
             ["The way back",
              "If this fails, can the previous state be restored"],
             ["Timing", "Is this a sensible moment, given what else is "
                        "happening"]],
            caption="Five questions asked before a service goes live.",
            footer="The last row is the one skipped under schedule pressure. "
                   "A technically ready service deployed during the business's "
                   "busiest week is a decision somebody should make rather "
                   "than a date somebody inherited."),
        desc(
            "The decision must be genuinely available for the evaluation to "
            "mean anything. A go-live nobody would postpone under any "
            "circumstances passes every check regardless of what they find, "
            "which is the governance point applied to transition."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where design and transition items are lost."),
        ul([
            "Designing the system and omitting the operational processes and "
            "measurements.",
            "Leaving planned downtime's treatment undefined, so availability "
            "is disputed.",
            "Confusing reliability with maintainability. Failing less often "
            "against recovering faster.",
            "Planning capacity against averages rather than peaks.",
            "Confusing RTO with RPO. Time to restore against data that may be "
            "lost.",
            "Treating an untested continuity plan as a capability.",
            "Handing over documentation instead of arranging overlap.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A provider reports 99.5 per cent availability and the customer "
            "calculates 98.2 per cent from the same events. What explains "
            "the difference?\""
        ),
        ol([
            "Note that both are computing the same quantity from the same "
            "outages, so the difference is definitional.",
            "The likeliest cause is PLANNED maintenance: the provider "
            "excludes it from the agreed service period and the customer "
            "counts it as unavailability.",
            "A second possibility is the service period itself -- whether "
            "availability is measured across the whole week or only during "
            "business hours.",
            "A third is what counts as unavailable: total failure, or "
            "degradation severe enough to prevent work.",
            "All three are defined in the service level agreement, and the "
            "dispute exists because at least one of them was not.",
        ]),
        desc(
            "The generalisable point is that a service level figure is only "
            "meaningful with its definitions attached. A target of 99.9 per "
            "cent with undefined terms is a number both parties can compute "
            "honestly and differently."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Design and transition sit between project and operation."),
        ul([
            "Service level requirements originate as non-functional "
            "requirements in Development Technology.",
            "Transition is where that category's handover arrives.",
            "Operational acceptance is the omitted testing this stage "
            "requires.",
            "Continuity objectives are the RTO and RPO of the security "
            "management lesson.",
            "Capacity planning uses System Evaluation techniques.",
            "Configuration records come from that category's configuration "
            "management.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What availability is measured against",
              "The AGREED service period",
              "Whose definition -- including planned downtime -- is where "
              "disputes come from."),
             ("Reliability against maintainability",
              "How long before failing, against how fast restored",
              "Both raise availability, by entirely different investments."),
             ("Why averages mislead in capacity planning",
              "Users experience the peak, not the mean",
              "A link averaging 40 per cent may be saturated for two hours "
              "daily."),
             ("RTO against RPO",
              "Forward to service resuming, backward to the last usable copy",
              "Standby capacity against replication frequency."),
             ("What transition must confirm beyond function",
              "That operations can actually run it",
              "Monitoring, backup, restart and documented procedures."),
             ("What documentation cannot transfer",
              "Which parts are fragile, and what normal looks like",
              "Which is why overlap matters more than a manual.")]),
    ]),
]

_des_quiz = [
    mcq("HARD",
        "A provider reports 99.5 per cent availability and the customer "
        "calculates 98.2 per cent from identical events.\n\n"
        "What explains this?",
        [("The parties are applying different definitions, most likely of "
          "planned downtime", True),
         ("The provider is measuring availability at a different point in "
          "the infrastructure entirely", False),
         ("The customer is including incidents that were resolved within the "
          "target time", False),
         ("One of the two calculations contains an arithmetic "
          "error", False)],
        "Both figures can be computed honestly from the same outages if the "
        "terms differ -- whether planned maintenance counts, what the agreed "
        "service period is, and what counts as unavailable rather than "
        "degraded. All three belong in the agreement, and the dispute exists "
        "because at least one was left undefined. A target without "
        "definitions is not a target."),

    mcq("AVERAGE",
        "What distinguishes reliability from maintainability?",
        [("How long a service runs before failing, against how quickly it is "
          "restored", True),
         ("Whether the failures concerned were caused internally or by "
          "external suppliers", False),
         ("Whether the measure applies to hardware or to "
          "software", False),
         ("Whether downtime was planned or unplanned", False)],
        "Both contribute to availability by different means: failing less "
        "often and recovering faster produce the same figure and require "
        "entirely different investments. Serviceability is what external "
        "suppliers contribute to either. Knowing which one is deficient is "
        "what makes an availability improvement targeted rather than "
        "speculative."),

    mcq("HARD",
        "Why is average utilisation a poor basis for capacity planning?",
        [("Users experience the peak, and a low average can conceal daily "
          "saturation", True),
         ("Average figures cannot be projected forward to identify a "
          "growth trend reliably", False),
         ("Average figures exclude the effect of planned "
          "maintenance", False),
         ("Utilisation should be measured in transactions rather than "
          "percentages", False),
         ],
        "A link averaging 40 per cent may be saturated for two hours every "
        "weekday, and the people affected experience those two hours rather "
        "than the mean. Capacity is therefore planned against the busy "
        "period, and an average is evidence of very little -- which is why "
        "utilisation is examined by hour and day."),

    mcq("AVERAGE",
        "A continuity plan specifies a four-hour RTO.\n\nWhat does that "
        "require?",
        [("The ability to restore service within four hours of a "
          "disruption", True),
         ("Backups to be taken at intervals of no more than four "
          "hours", False),
         ("A maximum of four hours of data loss", False),
         ("Detection of a disruption within four hours", False)],
        "The recovery TIME objective states how quickly service must return, "
        "which is bought with standby capacity and rehearsed procedures. How "
        "much data may be lost is the recovery POINT objective, bought with "
        "backup or replication frequency. They are independent requirements "
        "and confusing them produces a plan satisfying neither."),

    mcq("HARD",
        "What must service transition confirm beyond the service meeting its "
        "functional design?",
        [("That operations can run it -- monitoring, backup, restart and "
          "procedures", True),
         ("That the project team has been formally released from its "
          "remaining commitments", False),
         ("That the service level agreement has been signed by the "
          "customer", False),
         ("That the original requirements were correctly "
          "captured", False)],
        "A service that works and that nobody can operate generates incidents "
        "from its first day, which is why operational readiness is confirmed "
        "before go-live rather than discovered afterwards. It is the "
        "operational acceptance that projects skip -- and its absence costs "
        "every day of the service's life rather than once."),

    mcq("AVERAGE",
        "Which knowledge does documentation fail to transfer at handover?",
        [("Which parts are fragile, and what normal behaviour looks "
          "like", True),
         ("The service's architecture and the interfaces between its "
          "components", False),
         ("Known error workarounds recorded during testing", False),
         ("Configuration details and supplier contacts", False)],
        "Judgement about what is normal, which components are delicate and "
        "why, and what the early symptoms of common problems look like resist "
        "articulation -- they transfer by working alongside somebody. That is "
        "why an overlap period matters more than a manual, and why operations "
        "involvement before go-live is worth arranging."),

    mcq("AVERAGE",
        "What sets the recovery objectives for a service?",
        [("A business impact analysis establishing what an outage "
          "costs", True),
         ("The capabilities of the backup technology the provider has "
          "available", False),
         ("The provider's standard service level offerings", False),
         ("The recovery times achieved during previous incidents", False)],
        "The objectives should come from what the business actually needs -- "
        "which processes matter and what each hour of outage costs -- rather "
        "than from what the technology conveniently provides. Deriving them "
        "from current capability produces objectives the organisation happens "
        "to meet rather than ones it requires."),

    mcq("HARD",
        "Why does the syllabus insist that service design produces "
        "measurements as well as the service?",
        [("What is not measured cannot be managed or improved", True),
         ("Measurements are required evidence for service level "
          "reporting", False),
         ("Measurement data is needed to size the service's "
          "capacity", False),
         ("Auditors require measurement records for operational "
          "services", False)],
        "A service without defined measurements cannot demonstrate whether it "
        "meets its levels, cannot show a trend, and gives continual "
        "improvement nothing to work with. Retrofitting measurement to a "
        "running service is considerably harder than designing it in, which "
        "is why it belongs among the design outputs."),

    mcq("AVERAGE",
        "A continuity plan exists and has never been exercised.\n\n"
        "How should it be regarded?",
        [("As a set of assumptions rather than a capability", True),
         ("As adequate, provided the procedures were reviewed", False),
         ("As compliant, since documentation is what standards "
          "require", False),
         ("As sufficient for low-impact services only", False)],
        "Backups nobody has restored, sites nobody has failed over to and "
        "contracts nobody has invoked are each discovered to be broken "
        "precisely when they are needed. Testing is what converts the "
        "document into capability, which is why exercising the plan belongs "
        "in it rather than being an optional refinement."),

    mcq("HARD",
        "An availability target is agreed as 99.9 per cent with no further "
        "definition.\n\nWhat is the problem?",
        [("Both parties can compute different figures honestly from the same "
          "events", True),
         ("The target is more demanding than most services of this kind "
          "can realistically achieve", False),
         ("Availability cannot be measured without agreed monitoring "
          "tools", False),
         ("Percentages conceal the duration of individual "
          "outages", False)],
        "Availability is uptime over the agreed service PERIOD, and whether "
        "planned maintenance counts, what hours are covered, and what "
        "constitutes unavailable are all definitional. Two parties assuming "
        "differently will produce different figures without either being "
        "wrong -- so a target without its definitions attached settles "
        "nothing."),
]

LESSON_SVC_DES = lesson(
    MAJOR, MIDDLE,
    "Service Design and Service Transition",
    _des_quiz,
    lesson_structure(
        "Service Design and Service Transition",
        "Service design produces considerably more than the system: the "
        "management tools, the operational processes and the measurements "
        "without which nothing can be managed or improved. This lesson covers "
        "availability and the definitions that make a percentage meaningful, "
        "reliability against maintainability as two different investments "
        "producing the same figure, capacity planned against peaks rather "
        "than averages, continuity's RTO and RPO measured forward and "
        "backward from the failure, and transition -- whose real work is "
        "confirming operations can RUN the thing, and arranging the overlap "
        "that transfers the knowledge documentation cannot.",
        [
            "State what service design produces beyond the service itself",
            "Define availability and identify the definitions a target needs",
            "Distinguish reliability, maintainability and serviceability",
            "Plan capacity against peaks and anticipate change",
            "Distinguish RTO from RPO and explain what each buys",
            "Explain what a business impact analysis contributes",
            "State what service transition must confirm",
            "Explain what knowledge documentation cannot transfer",
        ],
        80,
        _des_sections,
        [
            ("Service design outputs",
             "The service, its management tools, its architecture, its "
             "processes and its measurements."),
            ("Availability",
             "Uptime as a proportion of the AGREED SERVICE PERIOD -- every "
             "term of which needs defining."),
            ("Reliability",
             "How long a service runs before failing."),
            ("Maintainability",
             "How quickly it is restored afterwards. Both raise availability "
             "differently."),
            ("Serviceability",
             "What external suppliers contribute to reliability and "
             "maintainability."),
            ("Capacity planning",
             "Measured against PEAKS by hour and day, anticipating change as "
             "well as growth."),
            ("RTO and RPO",
             "Time to restore service, and how much recent data may be lost. "
             "Forward and backward from the failure."),
            ("Business impact analysis",
             "Establishes what an outage costs, and therefore sets the "
             "recovery objectives from the business."),
            ("Service transition",
             "Confirms the service works AND that operations can run it, with "
             "records updated and a tested way back."),
        ],
        "Service design produces the service and everything needed to run it "
        "-- management tools, architecture, operational processes and "
        "MEASUREMENTS, without which nothing can be managed or improved. "
        "Availability is uptime over the AGREED SERVICE PERIOD, and every "
        "term needs defining: two parties assuming differently about planned "
        "maintenance, covered hours or what counts as unavailable will "
        "compute different figures from identical events, both honestly. It "
        "is raised either by RELIABILITY, failing less often, or by "
        "MAINTAINABILITY, recovering faster -- two different investments "
        "producing one number. Capacity is planned against peaks rather than "
        "averages, since users experience the busy hour, and against change "
        "as well as growth. Continuity is driven by RTO and RPO, which look "
        "forward to service resuming and backward to the last usable copy and "
        "buy entirely different things -- with a business impact analysis "
        "setting both from what an outage actually costs, and an unexercised "
        "plan remaining a set of assumptions. And transition's real work is "
        "confirming operations can RUN the service, updating the "
        "configuration records, testing the way back, and arranging the "
        "OVERLAP that transfers the knowledge documentation cannot.",
        exam_notes=[
            desc(
                "Items describe a service level dispute or a transition "
                "failure and ask what was undefined or omitted."
            ),
            ul([
                "Explaining differing availability calculations.",
                "Distinguishing reliability from maintainability.",
                "Explaining why averages mislead in capacity planning.",
                "Distinguishing RTO from RPO.",
                "Stating what transition confirms beyond function.",
                "Explaining what an untested continuity plan is worth.",
                "Explaining what documentation cannot transfer.",
            ]),
            desc(
                "When two parties disagree about a service level figure, look "
                "for the undefined term rather than the arithmetic. Planned "
                "downtime, the service period and the definition of "
                "unavailable are the three, and each supports two honest and "
                "different answers."
            ),
        ],
    ))

LESSONS = [LESSON_SVC_FOUND, LESSON_SVC_DES]

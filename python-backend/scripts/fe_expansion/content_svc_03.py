"""Service Management, lessons 5 to 7.

Facility management and data centre infrastructure, then the two System Audit
lessons.

The audit lessons are written around independence and evidence, since those
are what the examination distinguishes -- an auditor tests whether a control
OPERATES rather than whether it is documented.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Service Management"

# ==========================================================================
# Lesson 5: Facility management
# ==========================================================================

_fac_sections = [
    ("What Everything Else Assumes", [
        desc(
            "Every control, process and system in this certification assumes "
            "the equipment has power, is cool enough to run, and is where "
            "somebody put it."
        ),
        image(fig("data-centre-facilities")),
        desc(
            "Facility management provides those conditions. It is invisible "
            "when it works, and when it fails the failure is total rather "
            "than partial -- which is why it receives attention "
            "disproportionate to how rarely it is discussed."
        ),
    ]),

    ("Power", [
        desc(
            "Computing equipment stops immediately when power does, so "
            "continuity of supply is engineered in layers."
        ),
        table(
            ["Layer", "Covers", "Duration"],
            [["Dual supply feeds", "One feed failing",
              "Indefinitely, if the feeds are genuinely independent"],
             ["Uninterruptible power supply",
              "The seconds between a failure and generators starting",
              "Minutes"],
             ["Generators", "A prolonged mains failure",
              "As long as the fuel lasts"],
             ["Fuel contracts", "A very prolonged failure",
              "Whatever was arranged in advance"]],
            caption="Four layers, each covering what the previous one cannot.",
            footer="The UPS exists to bridge to the generators rather than to "
                   "run the site. Its minutes are the window in which "
                   "generators must start -- so a UPS that works and "
                   "generators that do not is a slightly delayed outage."),
        desc(
            "DUAL FEEDS are only redundant if they are genuinely independent. "
            "Two supplies from the same substation, or entering the building "
            "through the same duct, fail together -- which is the same "
            "diverse routing point the network category makes about carrier "
            "links."
        ),
        desc(
            "Everything in the chain must also be TESTED under load. A "
            "generator that starts monthly for ten minutes has demonstrated "
            "starting rather than running, and the difference emerges during "
            "the outage it was bought for."
        ),
    ]),

    ("Cooling", [
        desc(
            "Equipment converts electricity into heat, and heat that is not "
            "removed accumulates until things shut down or fail."
        ),
        ul([
            "Cooling capacity must match the heat load, which rises whenever "
            "equipment is added.",
            "HOT AND COLD AISLE arrangement separates intake from exhaust, so "
            "equipment does not draw in air another machine just heated.",
            "Cooling needs redundancy exactly as power does, since a single "
            "unit failing on a hot day is an outage.",
            "Cooling systems carry water, which is why water detection sits "
            "under raised floors.",
            "Airflow matters as much as capacity: blanking panels and cable "
            "management prevent air taking the easy route rather than the "
            "useful one.",
        ]),
        desc(
            "COOLING failure takes a facility down faster than power failure "
            "does, and it is the failure planned for least. Batteries and "
            "generators cover a power loss for hours; equipment in a room "
            "with no cooling reaches shutdown temperature in minutes."
        ),
    ]),

    ("Physical Security", [
        desc(
            "Physical access defeats most technical controls, which makes "
            "controlling it a security measure rather than a facilities "
            "convenience."
        ),
        table(
            ["Control", "Addresses"],
            [["Layered access -- site, building, room, rack",
              "A single breach reaching everything"],
             ["Authenticated entry, logged",
              "Who was present, and when"],
             ["Escorting visitors",
              "Legitimate presence for an illegitimate purpose"],
             ["Camera coverage of access points",
              "Evidence after the fact"],
             ["Reviewing the access list",
              "People retaining access after they no longer need it"]],
            caption="Five physical controls.",
            footer="The last row is the one that decays silently. Access "
                   "granted for a project continues indefinitely unless "
                   "somebody reviews it, which is the same privilege creep "
                   "the Security category describes, applied to doors."),
    ]),

    ("Fire and Environmental Protection", [
        desc(
            "Fire suppression in a computer room has requirements an ordinary "
            "building's does not."
        ),
        ol([
            "Detect early, since smoke detection above and below the floor "
            "buys time that flame detection does not.",
            "Suppress without destroying the equipment, which is why gas or "
            "mist systems are used rather than sprinklers where possible.",
            "Protect the people first, which is why suppression systems have "
            "evacuation delays and manual holds.",
            "Detect water, since the cooling system and any sprinklers above "
            "are both sources.",
            "Test all of it, because a suppression system nobody has "
            "exercised is an assumption.",
        ]),
        desc(
            "The third point is a genuine tension worth naming. A suppression "
            "system optimised purely for equipment protection can be "
            "dangerous to people in the room, so life safety takes precedence "
            "-- which is a legal requirement as well as an ethical one."
        ),
    ]),

    ("Layout and Capacity", [
        desc(
            "A data centre's physical arrangement constrains what it can hold "
            "and how easily it can be worked in."
        ),
        compare_grid(
            "WHAT LIMITS A FACILITY",
            "Space is rarely the binding constraint.",
            [("Often assumed to limit",
              ["Floor space",
               "Number of racks",
               "Physical room for expansion"]),
             ("Usually actually limits",
              ["Power available to the site",
               "Cooling capacity for the heat produced",
               "Floor loading, since racks are extremely heavy",
               "Cable routes, which fill before the racks do"])]),
        desc(
            "POWER DENSITY is the modern constraint. Equipment has become "
            "more powerful per unit of space faster than facilities have "
            "become able to power and cool it, so a half-empty room can be "
            "entirely full in the sense that matters."
        ),
    ]),

    ("Cabling and Physical Organisation", [
        desc(
            "A facility's cabling determines how easily it can be changed, "
            "and disorder accumulates faster than anything else."
        ),
        ul([
            "STRUCTURED cabling routes everything through defined patch "
            "points rather than directly between devices.",
            "Labelling at both ends is what makes a cable removable, since an "
            "unlabelled cable is one nobody dares disconnect.",
            "Cable management preserves airflow, which is why untidy cabling "
            "is a cooling problem as well as an aesthetic one.",
            "Records must match reality, since the diagram is what somebody "
            "works from at three in the morning.",
            "Cable routes fill before racks do, which surprises people "
            "planning capacity by rack count.",
        ]),
        desc(
            "The second point compounds over years. Every unlabelled cable "
            "nobody removes stays, obstructing airflow and adding to the "
            "confusion that makes the next one equally hard to remove -- so "
            "the discipline is cheap continuously and impossible to apply "
            "retrospectively."
        ),
    ]),

    ("Environmental Monitoring", [
        desc(
            "Facility conditions are measured continuously, because the "
            "failures they warn of develop before they become visible."
        ),
        table(
            ["Monitored", "Warns of"],
            [["Temperature, at several points",
              "Cooling degrading, or an airflow problem"],
             ["Humidity", "Condensation when high, static when low"],
             ["Water beneath the floor", "A cooling leak, before it "
                                         "spreads"],
             ["Power draw per circuit",
              "Approaching a circuit's limit before it trips"],
             ["Physical access events", "Presence nobody expected"]],
            caption="Five environmental measurements and what each warns "
                    "about.",
            footer="TEMPERATURE AT SEVERAL POINTS rather than one is the "
                   "detail that matters. A room average within tolerance can "
                   "contain a rack running dangerously hot, and a single "
                   "sensor in the wrong place reports comfort while equipment "
                   "fails."),
        desc(
            "Humidity is the measurement people omit. Too high and moisture "
            "condenses on cold surfaces; too low and static discharge damages "
            "components -- and both develop slowly enough that only "
            "continuous measurement catches them."
        ),
    ]),

    ("Facilities and Continuity", [
        desc(
            "A continuity plan's alternative site is a facilities question "
            "before it is a technology one."
        ),
        compare_grid(
            "WHAT AN ALTERNATIVE SITE MUST ALSO PROVIDE",
            "The obvious requirement, and the ones behind it.",
            [("Usually specified",
              ["Equipment capable of running the services",
               "Network connectivity",
               "Current data, within the recovery point objective"]),
             ("Equally necessary",
              ["Power and cooling sized for the load",
               "Physical space and access for staff who must be there",
               "Distance far enough not to share the original's disaster",
               "Somewhere for people to work, not only for machines"])]),
        desc(
            "DISTANCE is the requirement that gets compromised. A secondary "
            "site close enough to be convenient may share a power grid, a "
            "flood plain or a transport disruption with the primary -- which "
            "means the event that takes out one takes out both, and the "
            "arrangement was never redundant."
        ),
    ]),

    ("Green Considerations", [
        desc(
            "Data centres consume substantial energy, which makes efficiency "
            "both a cost and an environmental question the syllabus "
            "recognises."
        ),
        ol([
            "Measure how much of the total power actually reaches computing "
            "equipment rather than cooling and losses.",
            "Improve airflow before adding cooling capacity, since much "
            "cooling is spent on air that bypassed the equipment.",
            "Raise the operating temperature where equipment tolerates it, "
            "since cooling to unnecessarily low temperatures is expensive.",
            "Consolidate underused equipment, since an idle server draws a "
            "large share of its full power.",
            "Consider the heat produced as something usable rather than "
            "purely as waste.",
        ]),
        desc(
            "The fourth point has the largest effect in most facilities. "
            "Equipment running at low utilisation consumes far more power per "
            "unit of work than equipment running efficiently, so "
            "consolidation reduces both the power drawn and the heat that "
            "must then be removed."
        ),
    ]),

    ("Asset Management", [
        desc(
            "A facility contains equipment somebody paid for and somebody is "
            "accountable for, and tracking it is a facilities discipline as "
            "well as a financial one."
        ),
        table(
            ["Recorded", "Used for"],
            [["What it is, and where",
              "Finding it, and knowing what a failure affects"],
             ["What it supports",
              "Assessing the impact of taking it out of service"],
             ["When it was acquired, and its expected life",
              "Planning replacement before failure forces it"],
             ["Its maintenance and support status",
              "Knowing whether a fault can be fixed at all"],
             ["Its disposal, when retired",
              "Confirming the data on it was destroyed"]],
            caption="Five things an asset record holds.",
            footer="The last row connects to the Security category. "
                   "Equipment leaving a facility carries whatever was on it, "
                   "and an asset record that stops at disposal has lost track "
                   "of the data rather than only of the hardware."),
        desc(
            "The third row is what turns maintenance from reactive to "
            "planned. Equipment approaching the end of its supported life is "
            "predictable, and replacing it deliberately is considerably "
            "cheaper than replacing it during an outage."
        ),
    ]),

    ("Working Safely in a Facility", [
        desc(
            "Data centres contain hazards ordinary offices do not, and safe "
            "working is part of how they are managed."
        ),
        ul([
            "Electrical work carries obvious risk, which is why it is "
            "restricted to competent people under defined procedures.",
            "Equipment is heavy, and racking and moving it injures people who "
            "improvise.",
            "Suppression systems can be dangerous when discharged, which is "
            "why holds and alarms exist.",
            "Noise levels are high enough in some rooms to require "
            "protection.",
            "Nobody should work alone on anything hazardous, since the "
            "response to an accident depends on somebody noticing it.",
        ]),
        desc(
            "The last point is the rule most often bent, because the work "
            "frequently happens outside normal hours when few people are "
            "present. That is precisely when the consequence of an accident "
            "is worst, which is what makes the rule apply most strongly at "
            "exactly the time it is least convenient."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where facility items are lost."),
        ul([
            "Treating dual power feeds as redundant when they share a "
            "substation or a duct.",
            "Assuming a UPS runs the site rather than bridging to "
            "generators.",
            "Testing generators by starting them rather than running them "
            "under load.",
            "Planning power redundancy carefully and cooling redundancy not "
            "at all.",
            "Forgetting that cooling failure produces shutdown faster than "
            "power failure does.",
            "Never reviewing the physical access list.",
            "Measuring capacity in floor space when power and cooling are "
            "what bind.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A data centre has dual power feeds, a UPS and generators. A "
            "cooling unit fails on a hot afternoon and equipment shuts down "
            "within twenty minutes. What was inadequate?\""
        ),
        ol([
            "Note what was provided: three layers of power redundancy, all of "
            "which functioned.",
            "Note what failed: cooling, which had no equivalent redundancy.",
            "Equipment produces heat continuously and reaches shutdown "
            "temperature in minutes without cooling -- faster than any power "
            "failure would have taken effect.",
            "So the facility was engineered against the failure people plan "
            "for and not against the one that happens faster.",
            "The remedy is cooling redundancy sized like the power "
            "redundancy: capacity to lose a unit on the hottest day and "
            "continue.",
        ]),
        desc(
            "The item works because the power arrangements are exemplary. A "
            "facility can be well designed against the failure everybody "
            "thinks about and undefended against the one that actually takes "
            "it down."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Facilities underpin everything operational."),
        ul([
            "Availability targets depend on facilities nobody mentions in "
            "the service level agreement.",
            "Physical security is the bottom layer of the Security "
            "category's attack surface.",
            "Access list review is that category's privilege creep.",
            "Diverse routing is the network category's redundancy "
            "argument.",
            "Capacity limited by power rather than space is a System "
            "Evaluation constraint.",
            "Facilities are what a continuity plan's alternative site must "
            "also provide.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What a UPS is for",
              "Bridging the seconds until generators start",
              "Not running the site. Working batteries with failed generators "
              "is a delayed outage."),
             ("When dual feeds are not redundant",
              "When they share a substation or a duct",
              "Diverse routing means physically diverse, not two "
              "contracts."),
             ("Why cooling failure is worse than power failure",
              "Equipment overheats in minutes; batteries last longer",
              "And cooling is the redundancy people plan for least."),
             ("What testing a generator means",
              "Running it under load, not starting it",
              "Starting monthly demonstrates starting, which is a different "
              "claim."),
             ("What usually limits a data centre",
              "Power and cooling, not floor space",
              "A half-empty room can be full in the sense that matters."),
             ("The physical control that decays silently",
              "The access list",
              "Access granted for a project continues indefinitely unless "
              "reviewed.")]),
    ]),
]

_fac_quiz = [
    mcq("HARD",
        "A data centre with dual feeds, a UPS and generators loses equipment "
        "twenty minutes after a cooling unit fails.\n\n"
        "What was inadequate?",
        [("Cooling redundancy, which had no equivalent to the power "
          "arrangements", True),
         ("The uninterruptible power supply's battery capacity for the "
          "affected racks", False),
         ("Generator capacity, which could not support the additional "
          "cooling load", False),
         ("The temperature monitoring, which failed to alert staff in "
          "time", False)],
        "Three layers of power redundancy all functioned; cooling had none. "
        "Equipment produces heat continuously and reaches shutdown "
        "temperature within minutes, which is faster than any power failure "
        "would take effect -- so the facility was engineered against the "
        "failure everybody plans for and undefended against the one that "
        "happens fastest."),

    mcq("AVERAGE",
        "An uninterruptible power supply exists for one specific "
        "purpose.\n\nWhich?",
        [("Bridging the seconds between a mains failure and generators "
          "starting", True),
         ("Running the facility during a prolonged mains failure", False),
         ("Smoothing voltage variations in the incoming supply", False),
         ("Providing power to critical systems while others shut "
          "down", False)],
        "The UPS covers the interval in which generators must start and reach "
        "load, which is measured in seconds. It is not sized to run a site, "
        "so a working UPS with generators that fail to start produces a "
        "slightly delayed outage rather than a survivable one -- which is why "
        "generator testing matters as much as battery capacity."),

    mcq("HARD",
        "When are dual power feeds not genuinely redundant?",
        [("When they share a substation or enter through the same "
          "duct", True),
         ("When they are supplied under a single contract with the same "
          "provider", False),
         ("When they carry different voltages requiring separate "
          "equipment", False),
         ("When one is used continuously and the other only on "
          "failure", False)],
        "Redundancy requires the failure modes to be independent, and two "
        "feeds sharing physical infrastructure fail together whatever the "
        "contracts say. It is the same diverse routing point the network "
        "category makes about carrier links -- diversity means physically "
        "diverse, and confirming that requires looking rather than reading a "
        "specification."),

    mcq("AVERAGE",
        "Testing a generator properly involves more than most "
        "organisations do.\n\nWhat?",
        [("Running it under load for a meaningful period", True),
         ("Starting it monthly to confirm it starts", False),
         ("Checking the fuel level and the battery charge", False),
         ("Simulating a mains failure at the transfer switch", False)],
        "Starting demonstrates starting, and running under load demonstrates "
        "the thing that is actually needed -- sustained supply while the site "
        "draws power. Generators that start reliably and fail after twenty "
        "minutes under load are a documented failure mode, and the difference "
        "emerges precisely during the outage they were bought for."),

    mcq("AVERAGE",
        "What is the purpose of hot and cold aisle arrangement?",
        [("Equipment draws cool intake air rather than another machine's "
          "exhaust", True),
         ("It separates critical equipment from less critical "
          "equipment", False),
         ("It allows cooling capacity to be reduced in the cold "
          "aisles", False),
         ("It provides physical separation for security zoning", False)],
        "Racks are arranged so intakes face one aisle and exhausts the other, "
        "which keeps hot exhaust from being drawn straight back in. Without "
        "it, cooling capacity is spent cooling air that has already been "
        "heated, and equipment at the wrong end of a row runs considerably "
        "hotter than the room average suggests."),

    mcq("HARD",
        "What usually limits how much equipment a modern data centre can "
        "hold?",
        [("Power and cooling capacity rather than floor space", True),
         ("The number of racks that fit within the available "
          "area", False),
         ("Network capacity into and out of the facility", False),
         ("The physical space required for maintenance access", False)],
        "Equipment has become more powerful per unit of space faster than "
        "facilities have become able to power and cool it, so a half-empty "
        "room can be entirely full in the sense that matters. Floor loading "
        "and cable routes are the other constraints that bind before space "
        "does, and all three surprise people planning by area."),

    mcq("AVERAGE",
        "Why is water detection installed beneath raised floors?",
        [("Cooling systems carry water, and leaks collect at the lowest "
          "point", True),
         ("Fire suppression discharges water that must be "
          "detected", False),
         ("Groundwater ingress is the commonest source of flooding", False),
         ("Condensation forms on cold surfaces beneath the floor", False)],
        "The cooling infrastructure is the nearest large source of water to "
        "the equipment, and any leak runs to the lowest point -- which is "
        "under the floor, where cables and power distribution also are. "
        "Detecting it there gives warning before it reaches anything, which "
        "is why it is a standard rather than a precaution."),

    mcq("HARD",
        "Why does life safety take precedence over equipment protection in "
        "fire suppression design?",
        [("It is a legal and ethical requirement, and suppression agents can "
          "endanger people", True),
         ("Equipment can be replaced through insurance more easily than "
          "recovered", False),
         ("Fire regulations prohibit gas-based suppression in occupied "
          "rooms", False),
         ("People in the room are needed to perform the emergency "
          "shutdown", False)],
        "A system optimised purely for protecting equipment can be dangerous "
        "to anybody present, which is why suppression systems have evacuation "
        "delays and manual holds. It is a genuine tension in the design "
        "rather than a formality, and the resolution is fixed by law as well "
        "as by ethics."),

    mcq("AVERAGE",
        "Which physical security control most reliably decays without "
        "anybody noticing?",
        [("The list of who has access", True),
         ("The camera coverage of entry points", False),
         ("The requirement to escort visitors", False),
         ("The layering of access from site to rack", False)],
        "Access granted for a project, a secondment or an incident continues "
        "indefinitely unless somebody actively removes it, and nothing "
        "prompts removal the way a need prompts granting. It is the same "
        "privilege creep the Security category describes, applied to doors -- "
        "and periodic review is the only thing that reverses it."),

    mcq("HARD",
        "Why is cooling failure treated as more urgent than power failure in "
        "a data centre?",
        [("Equipment overheats within minutes, while batteries and generators "
          "cover power for hours", True),
         ("Cooling systems fail more frequently than power "
          "systems", False),
         ("Cooling failures damage equipment permanently while power failures "
          "do not", False),
         ("Power failures are detected automatically while cooling failures "
          "are not", False)],
        "The layered power arrangements buy hours, and equipment in a room "
        "with no cooling reaches shutdown temperature in minutes -- so the "
        "response window is far shorter for the failure that receives less "
        "planning. That asymmetry between how fast each failure bites and how "
        "much redundancy each receives is the point."),
]

LESSON_SVC_FAC = lesson(
    MAJOR, "Service Management",
    "Facility Management and Data Centre Infrastructure",
    _fac_quiz,
    lesson_structure(
        "Facility Management and Data Centre Infrastructure",
        "Every control and system in this certification assumes the equipment "
        "has power, is cool enough to run, and is where somebody put it -- "
        "and facility management provides those conditions invisibly until "
        "they fail totally. This lesson covers the layered power arrangements "
        "with the UPS bridging to generators rather than running the site, "
        "COOLING as the failure that bites fastest and is planned for least, "
        "physical security including the access list that decays silently, "
        "fire suppression where life safety takes precedence over equipment, "
        "and the capacity constraints that turn out to be power and cooling "
        "rather than floor space.",
        [
            "Explain what facility management provides and why its failures "
            "are total",
            "Describe the layers of power continuity and each one's role",
            "Explain when dual feeds are not genuinely redundant",
            "Explain why generators must be tested under load",
            "Describe cooling arrangements and why cooling failure is most "
            "urgent",
            "Describe physical security controls and their decay",
            "Explain fire suppression requirements and the life safety "
            "precedence",
            "Identify what actually limits a facility's capacity",
        ],
        70,
        _fac_sections,
        [
            ("Uninterruptible power supply",
             "Bridges the seconds until generators start. Not sized to run "
             "the site."),
            ("Diverse feeds",
             "Redundant only if physically independent -- not two contracts "
             "for the same substation."),
            ("Generator testing",
             "Running under load, since starting monthly demonstrates only "
             "starting."),
            ("Hot and cold aisles",
             "Intakes face one aisle and exhausts the other, so equipment "
             "does not draw in heated air."),
            ("Cooling urgency",
             "Equipment overheats in minutes while power redundancy buys "
             "hours -- and cooling gets less redundancy."),
            ("Water detection",
             "Beneath raised floors, because cooling carries water and leaks "
             "run to the lowest point."),
            ("Life safety precedence",
             "Suppression systems have evacuation delays and manual holds, by "
             "law as well as ethics."),
            ("Power density",
             "The modern capacity constraint -- a half-empty room can be full "
             "in the sense that matters."),
        ],
        "Facility management supplies what everything else assumes: power, "
        "cooling and physical control of where equipment sits. Power "
        "continuity is layered -- diverse feeds, a UPS bridging the SECONDS "
        "until generators start, generators for a prolonged failure, and fuel "
        "arrangements beyond that -- with two traps: feeds sharing a "
        "substation or duct are not redundant, and a generator started "
        "monthly has demonstrated starting rather than running. COOLING is "
        "the failure that bites fastest, since equipment reaches shutdown "
        "temperature in minutes while power redundancy buys hours, and it is "
        "consistently the redundancy people plan for least. Hot and cold "
        "aisle arrangement keeps exhaust out of intakes, and water detection "
        "sits under the floor because cooling carries water. Physical "
        "security is layered from site to rack, and the control that decays "
        "silently is the ACCESS LIST, since access granted for a reason "
        "outlives the reason unless somebody reviews it. Fire suppression "
        "protects equipment where it can and puts LIFE SAFETY first by law. "
        "And capacity is bounded by power, cooling, floor loading and cable "
        "routes long before it is bounded by floor space.",
        exam_notes=[
            desc(
                "Items describe a facility failure and ask which provision "
                "was inadequate."
            ),
            ul([
                "Identifying missing cooling redundancy behind a shutdown.",
                "Stating what a UPS is for.",
                "Explaining when dual feeds are not redundant.",
                "Explaining what generator testing must involve.",
                "Explaining hot and cold aisle arrangement.",
                "Identifying what limits facility capacity.",
                "Identifying the decaying physical control.",
            ]),
            desc(
                "When a facility fails despite good provision, check which "
                "provision was NOT duplicated. Power redundancy is designed "
                "carefully and cooling redundancy is frequently an "
                "afterthought -- which is the asymmetry these items are built "
                "on."
            ),
        ],
    ))

# ==========================================================================
# Lesson 6: System audit
# ==========================================================================

_aud_sections = [
    ("Why Independent Examination Exists", [
        desc(
            "The people running a process are poorly placed to judge whether "
            "it works, and audit exists to supply the judgement they cannot."
        ),
        image(fig("audit-process")),
        desc(
            "This is structural rather than a comment on anybody's honesty. "
            "Somebody who designed a control believes in it, knows the "
            "reasoning, and cannot see what an outsider notices -- which is "
            "why independence is audit's defining property rather than a "
            "procedural nicety."
        ),
        table(
            ["Audit examines", "Asks"],
            [["Whether controls exist", "Was anything designed for this "
                                        "risk"],
             ["Whether they OPERATE", "Does it actually happen, in practice"],
             ["Whether they are effective",
              "Does it address the risk it was designed for"],
             ["Whether evidence exists",
              "Can any of this be demonstrated afterwards"]],
            caption="Four questions an audit answers.",
            footer="The second row is what separates audit from review. A "
                   "documented control that nobody performs is a control that "
                   "does not exist, and only testing operation rather than "
                   "reading documentation reveals that."),
    ]),

    ("Independence", [
        desc(
            "An audit's value rests entirely on the auditor being able to "
            "report what they find."
        ),
        compare_grid(
            "INTERNAL AGAINST EXTERNAL AUDIT",
            "Both examine the same organisation for different audiences.",
            [("Internal audit",
              ["Performed by the organisation's own function",
               "Reports to the board or audit committee, not to management",
               "Frequent, cheaper, aimed at improvement",
               "Independence rests on reporting lines"]),
             ("External audit",
              ["Performed by a party outside the organisation",
               "Reports to shareholders, regulators or customers",
               "Periodic, expensive, aimed at assurance for others",
               "Independence is structural"])]),
        desc(
            "The examinable definition of independence is REPORTING LINES "
            "rather than intention. An internal auditor reporting to the "
            "manager whose controls they examine is not independent however "
            "conscientious they are, because an unwelcome finding threatens "
            "the person writing it."
        ),
        desc(
            "An auditor must also not audit work they performed themselves, "
            "which is why audit functions do not implement the controls they "
            "later examine -- a rule that is inconvenient in small "
            "organisations and is not therefore optional."
        ),
    ]),

    ("The Audit Process", [
        desc(
            "Audits follow a defined sequence, and each stage produces "
            "something the next depends on."
        ),
        ol([
            "PLAN: what is in scope, against what criteria, and why this "
            "area.",
            "GATHER EVIDENCE: observe, inspect, test, re-perform, interview.",
            "EVALUATE the evidence against the stated criteria, rather than "
            "against the auditor's preferences.",
            "REPORT the findings, each supported by the evidence behind it.",
            "FOLLOW UP: was anything actually done about them.",
        ]),
        desc(
            "Step five is what makes the other four worth doing. An audit "
            "whose findings are never followed up has documented problems "
            "rather than corrected them, and it teaches the organisation that "
            "findings can be safely ignored -- which makes the next audit "
            "worth less than this one."
        ),
        desc(
            "Step three matters for a subtler reason. An auditor evaluating "
            "against their own view rather than the stated criteria produces "
            "findings the organisation can legitimately dispute, and the "
            "disagreement obscures the findings that were sound."
        ),
    ]),

    ("Evidence", [
        desc(
            "A finding is only as good as what supports it, and the syllabus "
            "grades kinds of evidence."
        ),
        table(
            ["Evidence", "Obtained by", "Strength"],
            [["Re-performance",
              "The auditor performing the control themselves",
              "Strongest"],
             ["Observation", "Watching the control being performed",
              "Strong, and the observed occasion may be atypical"],
             ["Inspection", "Examining records the control produced",
              "Good, if the records are reliable"],
             ["Enquiry", "Asking somebody what happens",
              "Weakest -- it establishes what they believe"]],
            caption="Four evidence types, in decreasing strength.",
            footer="ENQUIRY alone supports no finding. It is where an audit "
                   "begins, because it points at what to examine -- and a "
                   "conclusion resting on it has established what somebody "
                   "said rather than what occurs."),
        desc(
            "Evidence must also be SUFFICIENT and RELEVANT: enough of it to "
            "support the conclusion drawn, and about the thing actually being "
            "concluded. A single instance rarely demonstrates that a control "
            "operates consistently, which is why sampling is designed rather "
            "than convenient."
        ),
    ]),

    ("Sampling", [
        desc(
            "Auditors cannot examine everything, so how a sample is chosen "
            "determines what the conclusion is worth."
        ),
        ul([
            "The sample must REPRESENT the population, rather than being what "
            "was easy to reach.",
            "Its size follows from the confidence required and the "
            "consequence of being wrong.",
            "Selecting only recent items or only from one source produces a "
            "conclusion about that subset.",
            "A failure in a sample means wider examination rather than "
            "another sample.",
            "The basis for the selection is recorded, since a conclusion's "
            "validity depends on it.",
        ]),
        desc(
            "The fourth point is where sampling logic is most often "
            "misapplied. A failed sample has demonstrated that the control "
            "does not always operate, and drawing a second sample in the hope "
            "of a better result is looking for the answer rather than "
            "testing."
        ),
    ]),

    ("Reporting Findings", [
        desc(
            "A finding has a structure, and stating it fully is what makes it "
            "actionable rather than arguable."
        ),
        table(
            ["Element", "States"],
            [["Condition", "What was found"],
             ["Criteria", "What should have been the case, and by whose "
                          "standard"],
             ["Cause", "Why the difference exists"],
             ["Effect", "What it risks, or has already cost"],
             ["Recommendation", "What would address the cause"]],
            caption="Five elements of a complete finding.",
            footer="The CAUSE is the element most often missing, and its "
                   "absence produces recommendations that treat symptoms. A "
                   "control not performed because nobody was trained needs a "
                   "different remedy from one not performed because it "
                   "obstructs the work."),
        desc(
            "Findings are also RANKED, since an organisation given thirty "
            "findings of equal weight addresses whichever is easiest. Ranking "
            "by the risk each represents is what directs the response to what "
            "matters."
        ),
    ]),

    ("What Auditors Examine in Systems", [
        desc(
            "Systems audit has recurring subject areas, and knowing them "
            "makes the process concrete."
        ),
        table(
            ["Area", "Typical question"],
            [["Access control",
              "Do the people with access still need it"],
             ["Change management",
              "Were changes assessed and authorised before being made"],
             ["Backup and recovery",
              "Has a restore actually been performed successfully"],
             ["Segregation of duties",
              "Can one person complete a sensitive activity alone"],
             ["Data integrity",
              "Do the controls prevent or detect incorrect data"],
             ["Continuity", "Has the plan been exercised"]],
            caption="Six areas a systems audit reliably examines.",
            footer="Each row is answerable only by testing. Whether people "
                   "still need their access, whether a restore works, whether "
                   "a plan was exercised -- all are matters of fact that "
                   "documentation asserts and only examination "
                   "establishes."),
        desc(
            "SEGREGATION OF DUTIES is the area with the widest consequence, "
            "because it addresses the failure a single person's error or "
            "dishonesty can cause. An audit finding that one role can both "
            "raise and approve a payment is a finding about a possibility "
            "rather than about anything that has happened."
        ),
    ]),

    ("Auditing Around, Through and With the Computer", [
        desc(
            "The syllabus names three approaches to auditing a computerised "
            "system, distinguished by how much of the processing is "
            "examined."
        ),
        content_accordion(
            "THREE APPROACHES",
            "Each looks at a different part of the system.",
            [("Around the computer",
              "Inputs and outputs are compared without examining the "
              "processing. Simple, and it establishes only that the results "
              "look right for the cases examined -- which says nothing about "
              "cases nobody tried."),
             ("Through the computer",
              "The processing itself is examined, by test data or by "
              "inspecting the logic. Stronger, and it requires the auditor to "
              "understand the system."),
             ("With the computer",
              "Software is used to examine the data itself -- recalculating "
              "totals, finding exceptions, testing every record rather than a "
              "sample.")]),
        desc(
            "WITH the computer removes the sampling problem entirely for many "
            "tests. Where every transaction can be examined, the conclusion "
            "concerns the population rather than a sample -- which is the "
            "strongest position available and one that only automation makes "
            "affordable."
        ),
    ]),

    ("Audit Trails", [
        desc(
            "A system that records what happened is auditable; one that does "
            "not cannot be examined however well designed it is."
        ),
        ul([
            "The trail records WHO did WHAT, WHEN, and to which record.",
            "It must be complete for the activities that matter, since a "
            "partial trail supports no conclusion about the rest.",
            "It must be tamper-resistant, or it records what somebody was "
            "willing to leave in it.",
            "It must be retained long enough for the examinations that will "
            "use it, which is frequently longer than operational need.",
            "Clocks must agree, since a trail across systems whose "
            "timestamps disagree cannot establish an order of events.",
        ]),
        desc(
            "The third point is what separates an audit trail from a log. A "
            "record the administrators being examined can edit is evidence "
            "about what they permitted to remain, and the whole value of the "
            "trail rests on that not being possible."
        ),
    ]),

    ("The Auditor's Relationship With the Organisation", [
        desc(
            "An audit's practical effectiveness depends on a relationship "
            "that is neither adversarial nor comfortable."
        ),
        compare_grid(
            "TWO WAYS AN AUDIT RELATIONSHIP FAILS",
            "Opposite failures with the same result.",
            [("Too adversarial",
              ["Information is withheld or minimised",
               "Findings are contested rather than considered",
               "The auditor sees only what must be shown",
               "Effort goes into defence rather than correction"]),
             ("Too comfortable",
              ["Findings are softened to preserve the relationship",
               "Problems are discussed and not recorded",
               "Independence erodes without anybody deciding it should",
               "The report reassures rather than informs"])]),
        desc(
            "The workable position treats findings as facts about the "
            "organisation rather than as criticism of individuals, which "
            "makes them discussable -- and it requires the auditor to record "
            "what they found regardless of how the conversation went."
        ),
    ]),

    ("Audit Planning and Scope", [
        desc(
            "An audit's usefulness is largely decided before any evidence is "
            "gathered, by what it chooses to examine."
        ),
        ol([
            "Identify what matters -- the risks whose materialisation would "
            "hurt most.",
            "Assess where controls are most likely to be weak, from prior "
            "findings and from what has changed.",
            "Set the scope so it covers something worth examining rather than "
            "something convenient to examine.",
            "Agree the criteria in advance, so findings are measured against "
            "a standard both parties accepted.",
            "Allocate enough time for the evidence the conclusions will "
            "need.",
        ]),
        desc(
            "The third step is where audits are quietly weakened. Scoping "
            "around what is easy to examine produces a report full of "
            "well-evidenced findings about things that did not matter, and "
            "the areas nobody looked at remain the ones carrying the risk."
        ),
    ]),

    ("Continuous Auditing", [
        desc(
            "Periodic audit examines a moment; continuous techniques examine "
            "activity as it happens."
        ),
        compare_grid(
            "PERIODIC AGAINST CONTINUOUS AUDITING",
            "Same questions, different timing.",
            [("Periodic",
              ["A sample examined at intervals",
               "Findings arrive after the period they concern",
               "Cheaper, and established practice",
               "A control failing between audits goes unnoticed"]),
             ("Continuous",
              ["Automated testing against every transaction",
               "Exceptions surface within days or hours",
               "Requires investment in the tooling",
               "Detects a control failing while it is still failing"])]),
        desc(
            "The right-hand column changes what an audit is for. A finding "
            "arriving six months after the control lapsed documents history; "
            "one arriving the same week lets somebody act -- which is closer "
            "to monitoring than to traditional audit, and is why the two "
            "disciplines are converging."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where audit items are lost."),
        ul([
            "Treating documented controls as operating controls. Audit tests "
            "operation.",
            "Regarding independence as an attitude rather than a matter of "
            "reporting lines.",
            "Auditing work the auditor performed themselves.",
            "Supporting a finding with enquiry alone.",
            "Drawing a sample from what was convenient rather than what "
            "represents the population.",
            "Taking a second sample after the first failed.",
            "Omitting the cause from a finding, so the recommendation treats "
            "the symptom.",
            "Never following up, which teaches the organisation that findings "
            "can be ignored.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An auditor asks the operations manager whether backups are "
            "verified, is told they are, and reports the control as "
            "effective. What is wrong?\""
        ),
        ol([
            "Identify the evidence obtained: ENQUIRY, which establishes what "
            "the manager believes.",
            "Enquiry is the weakest form of evidence and supports no finding "
            "on its own.",
            "The manager may be right, mistaken, or describing the intended "
            "process rather than the actual one.",
            "Stronger evidence is available: inspecting verification records, "
            "observing a verification, or re-performing a restore.",
            "The last of these is strongest, since it demonstrates the "
            "outcome the control exists to guarantee rather than that an "
            "activity took place.",
        ]),
        desc(
            "The item is constructed so that nothing looks obviously wrong. "
            "The auditor asked a knowledgeable person a direct question and "
            "received an honest answer -- and has established what somebody "
            "believes rather than what occurs, which is exactly the "
            "distinction the evidence hierarchy exists for."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Audit examines what the other categories build."),
        ul([
            "Configuration audit is the Development Technology discipline of "
            "the same name.",
            "Control effectiveness is what the Security category's management "
            "system claims.",
            "Evidence and retention requirements come from Legal Affairs.",
            "Sampling reasoning parallels the testing techniques of "
            "Development Technology.",
            "Following up findings is the corrective action of project "
            "monitoring.",
            "Independence by reporting line recurs in the governance lesson "
            "that follows.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What audit tests",
              "Whether controls OPERATE, not whether they are documented",
              "A documented control nobody performs does not exist."),
             ("What independence actually requires",
              "Reporting lines that do not run to the audited manager",
              "Conscientiousness is not independence."),
             ("The evidence hierarchy",
              "Re-performance, observation, inspection, enquiry",
              "Enquiry alone supports no finding -- it establishes what "
              "somebody believes."),
             ("What a failed sample means",
              "Wider examination, not another sample",
              "Drawing again is looking for the answer rather than testing."),
             ("The missing element in most findings",
              "The cause",
              "Without it the recommendation treats a symptom."),
             ("Why follow-up matters most",
              "Without it, findings are documented rather than corrected",
              "And the organisation learns they can be ignored.")]),
    ]),
]

_aud_quiz = [
    mcq("HARD",
        "An auditor asks whether backups are verified, is told they are, and "
        "reports the control as effective.\n\nWhat is wrong?",
        [("Enquiry alone establishes what somebody believes, not what "
          "occurs", True),
         ("The operations manager is not the appropriate person to ask about "
          "backups", False),
         ("The finding should have been reported as a "
          "recommendation", False),
         ("Backup verification is outside the normal scope of a systems "
          "audit", False)],
        "Enquiry is the weakest evidence: the manager may be right, mistaken, "
        "or describing the intended process rather than the actual one. "
        "Inspecting verification records, observing a verification, or "
        "best of all re-performing a restore would demonstrate the outcome "
        "the control exists to guarantee. Nothing about the exchange looks "
        "wrong, which is what makes it the standard error."),

    mcq("AVERAGE",
        "What does an audit test that a review of documentation does not?",
        [("Whether the controls actually operate in practice", True),
         ("Whether the controls address the risks identified", False),
         ("Whether the documentation is complete and current", False),
         ("Whether the controls comply with external standards", False)],
        "A documented control nobody performs is a control that does not "
        "exist, and reading the documentation cannot reveal that. Testing "
        "operation -- observing, inspecting the records it should produce, "
        "re-performing it -- is what distinguishes audit from review, and it "
        "is where the findings that matter come from."),

    mcq("HARD",
        "What does an internal auditor's independence actually depend on?",
        [("Reporting to the board or audit committee rather than to the "
          "audited manager", True),
         ("Being professionally qualified and bound by a code of "
          "conduct", False),
         ("Having no prior working relationship with the area being "
          "examined", False),
         ("Rotating between audit areas on a defined schedule", False)],
        "An auditor whose career is influenced by the manager whose controls "
        "they examine faces a structural conflict, and no amount of "
        "conscientiousness removes it -- an unwelcome finding threatens the "
        "person writing it. Independence is therefore a matter of reporting "
        "lines rather than of character, which is why it is defined that "
        "way."),

    mcq("AVERAGE",
        "Which form of audit evidence is strongest?",
        [("Re-performance by the auditor", True),
         ("Observation of the control being performed", False),
         ("Inspection of the records the control produced", False),
         ("Enquiry of the person responsible for the control", False)],
        "Re-performing the control establishes directly that it produces the "
        "intended result, with no reliance on records being accurate or on an "
        "observed occasion being typical. Observation is strong and may catch "
        "an unrepresentative instance; inspection depends on record "
        "reliability; enquiry establishes only what somebody believes."),

    mcq("HARD",
        "A sample of transactions reveals that a control was not performed on "
        "three occasions.\n\nWhat should the auditor do?",
        [("Examine more widely, since the control demonstrably does not "
          "always operate", True),
         ("Draw a second sample to establish whether the result was "
          "typical", False),
         ("Report the three instances as isolated exceptions", False),
         ("Increase the sample size and recalculate the failure "
          "rate", False),
         ],
        "The first sample has already established that the control does not "
        "operate consistently, which is the finding. Drawing again in hope of "
        "a cleaner result is looking for an answer rather than testing, and "
        "the correct response is examining more widely to establish the "
        "extent -- which is what determines how serious the finding is."),

    mcq("AVERAGE",
        "Which element is most often missing from an audit finding?",
        [("The cause of the difference", True),
         ("The condition that was found", False),
         ("The criteria the condition was measured against", False),
         ("The effect the difference could produce", False)],
        "Condition, criteria and effect are what an auditor observes and "
        "assesses; the CAUSE requires understanding why the difference "
        "exists, and without it the recommendation treats a symptom. A "
        "control not performed because nobody was trained needs a different "
        "remedy from one not performed because it obstructs the work."),

    mcq("HARD",
        "Why does failing to follow up audit findings damage more than the "
        "individual findings?",
        [("The organisation learns that findings can be safely ignored", True),
         ("The findings become obsolete before they can be "
          "addressed", False),
         ("Auditors cannot report the same finding twice", False),
         ("Follow-up is required for the audit to be considered "
          "complete", False)],
        "An audit whose findings produce no action has documented problems "
        "rather than corrected them, and the lesson everybody draws is that "
        "the next set can also be ignored. That makes every subsequent audit "
        "worth less than the last, which is a compounding cost far exceeding "
        "the unaddressed findings themselves."),

    mcq("AVERAGE",
        "Why must an auditor not examine work they performed themselves?",
        [("They cannot independently judge their own work", True),
         ("Professional standards prohibit auditors from performing "
          "operational work", False),
         ("They would already know the outcome of the "
          "examination", False),
         ("It would duplicate effort already expended", False),
         ],
        "The structural problem is the same one that makes reporting lines "
        "matter: somebody assessing their own work has an interest in the "
        "conclusion. This is why audit functions do not implement the "
        "controls they later examine -- a rule that is inconvenient in small "
        "organisations and is not therefore optional."),

    mcq("HARD",
        "An auditor evaluates a control against their own view of good "
        "practice rather than the stated criteria.\n\n"
        "What is the consequence?",
        [("The finding can be legitimately disputed, obscuring the sound "
          "ones", True),
         ("The finding will be more useful because it reflects current "
          "practice", False),
         ("The audit exceeds its agreed scope and must be "
          "repeated", False),
         ("The organisation may adopt a standard higher than it "
          "requires", False),
         ],
        "Findings are evaluated against criteria agreed in advance -- policy, "
        "standard, regulation or contract -- and one measured against "
        "something else is a matter of opinion the organisation can "
        "reasonably reject. The resulting argument absorbs attention that the "
        "well-founded findings in the same report needed."),

    mcq("AVERAGE",
        "How should audit findings be presented to be acted on?",
        [("Ranked by the risk each represents", True),
         ("Grouped by the department responsible for each", False),
         ("In the order the evidence was gathered", False),
         ("Separated into technical and procedural categories", False)],
        "An organisation handed thirty findings of apparently equal weight "
        "addresses whichever are easiest, which is unlikely to be the ones "
        "that matter. Ranking by risk directs limited remediation capacity to "
        "the exposures that justify it -- and it also communicates the "
        "auditor's judgement about severity, which the findings alone do "
        "not."),
]

LESSON_SVC_AUD = lesson(
    MAJOR, "System Audit",
    "System Audit: Purpose, Process and Evidence",
    _aud_quiz,
    lesson_structure(
        "System Audit: Purpose, Process and Evidence",
        "The people running a process cannot judge whether it works, which is "
        "structural rather than a comment on honesty -- and audit exists to "
        "supply that judgement. Its defining question is whether controls "
        "OPERATE rather than whether they are documented, since a control "
        "nobody performs does not exist. This lesson covers independence as a "
        "matter of REPORTING LINES rather than character, the audit process "
        "whose follow-up stage makes the other four worth doing, the evidence "
        "hierarchy in which enquiry alone supports nothing, sampling that "
        "represents rather than convenient, and findings whose most commonly "
        "missing element is the cause.",
        [
            "Explain why independent examination is structurally necessary",
            "Explain what audit tests beyond documentation",
            "Define independence in terms of reporting lines",
            "Describe the audit process and the importance of follow-up",
            "Rank the forms of audit evidence",
            "Design and interpret a sample correctly",
            "State the elements of a complete finding",
            "Explain why findings are ranked by risk",
        ],
        75,
        _aud_sections,
        [
            ("Audit's central question",
             "Whether controls OPERATE, not whether they are documented."),
            ("Independence",
             "Reporting lines that do not run to the audited manager. Not a "
             "matter of conscientiousness."),
            ("Audit process",
             "Plan, gather evidence, evaluate against criteria, report, and "
             "FOLLOW UP."),
            ("Re-performance",
             "The auditor performing the control themselves. The strongest "
             "evidence."),
            ("Enquiry",
             "Asking somebody what happens. The weakest, and supports no "
             "finding alone."),
            ("Representative sampling",
             "Chosen to represent the population rather than for "
             "convenience, with the basis recorded."),
            ("A finding's elements",
             "Condition, criteria, cause, effect and recommendation -- with "
             "cause most often missing."),
            ("Follow-up",
             "What makes the other stages worth doing, since unaddressed "
             "findings teach that findings can be ignored."),
        ],
        "Audit exists because the people running a process cannot judge it -- "
        "somebody who designed a control believes in it and cannot see what "
        "an outsider notices. Its distinguishing question is whether controls "
        "OPERATE, since a documented control nobody performs does not exist, "
        "and only testing operation reveals that. INDEPENDENCE is defined by "
        "reporting lines rather than character: an internal auditor reporting "
        "to the manager whose controls they examine faces a conflict no "
        "conscientiousness removes, and no auditor examines their own work. "
        "The process plans, gathers evidence, evaluates against the STATED "
        "criteria rather than the auditor's preferences, reports, and FOLLOWS "
        "UP -- with the last stage being what makes the others worth doing, "
        "since unaddressed findings teach an organisation that findings can "
        "be ignored. Evidence runs from re-performance down to ENQUIRY, which "
        "establishes what somebody believes and supports no finding alone. "
        "Samples must represent the population rather than be convenient, and "
        "a failed sample means examining more widely rather than drawing "
        "again. And a complete finding states condition, criteria, CAUSE, "
        "effect and recommendation -- with cause the element most often "
        "missing and its absence producing recommendations that treat "
        "symptoms.",
        exam_notes=[
            desc(
                "Items describe an audit step and ask what was inadequate "
                "about it."
            ),
            ul([
                "Identifying enquiry used as sufficient evidence.",
                "Stating what audit tests beyond documentation.",
                "Defining independence correctly.",
                "Ranking evidence types.",
                "Responding correctly to a failed sample.",
                "Identifying the missing element of a finding.",
                "Explaining why follow-up matters most.",
            ]),
            desc(
                "For any audit item, ask what the auditor actually "
                "established. Asking somebody establishes what they believe, "
                "reading a document establishes what was intended, and only "
                "testing establishes what happens -- and the distractors are "
                "built from treating the first two as the third."
            ),
        ],
    ))

LESSONS = [LESSON_SVC_FAC, LESSON_SVC_AUD]

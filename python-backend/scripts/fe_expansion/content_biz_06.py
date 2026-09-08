"""Business Strategy -> Business Industry, lesson 6.

Industrial devices, IoT and control equipment.

The industrial case differs from the consumer one in the direction of the
consequence: a consumer device failing inconveniences its owner, and a
control system failing can stop production or injure somebody. Everything
conservative about this field follows from that.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Business Strategy"
MIDDLE = "Business Industry"


_iot_sections = [
    ("Machines That Report", [
        desc(
            "Industrial equipment has been controlled by computers for "
            "decades. What changed recently is that the equipment now "
            "reports what it is doing to something outside the factory, and "
            "that connection is the whole subject of this lesson."
        ),
        image(fig("iot-layers")),
        table(
            ["Layer", "What sits there", "What it is limited by"],
            [["Devices", "Sensors and actuators on the equipment",
              "Power, cost, and physical conditions"],
             ["Edge", "Local processing and control near the machine",
              "Whatever fits in a cabinet on a factory floor"],
             ["Network", "The link back to everything else",
              "Availability, bandwidth, and frequently cost"],
             ["Platform", "Storage, analysis, device management",
              "The number of devices, which is large"],
             ["Applications", "What people look at and decide on",
              "Whether anybody acts on what it shows"]],
            caption="Five layers of an industrial IoT system.",
            footer="The last row is the one that determines whether any of "
                   "the rest was worth building. A system producing "
                   "information nobody uses to change a decision has cost "
                   "money and delivered nothing."),
    ]),

    ("Why Industrial Is Not Consumer", [
        desc(
            "The devices look similar and the engineering priorities are "
            "almost opposite, which is the distinction the syllabus tests."
        ),
        compare_grid(
            "CONSUMER DEVICES AGAINST INDUSTRIAL EQUIPMENT",
            "Convenience against consequence.",
            [("Consumer",
              ["Failure inconveniences one owner",
               "Replaced every few years",
               "Updated often, and remotely",
               "Bought on features and price"]),
             ("Industrial",
              ["Failure stops production, or injures somebody",
               "Runs for twenty years or more",
               "Changed rarely, and only after assessment",
               "Bought on reliability and support commitments"])]),
        desc(
            "The third entry explains most of what puzzles people arriving "
            "from ordinary software. A control system is not patched promptly "
            "because a change to it is a change to a running process, and the "
            "risk of the change frequently exceeds the risk of the "
            "vulnerability it addresses."
        ),
    ]),

    ("Operational Technology and Information Technology", [
        desc(
            "Two engineering cultures meet at the factory boundary, and they "
            "were built on different assumptions."
        ),
        compare_grid(
            "OT AGAINST IT",
            "Keeping a process running, against keeping data correct.",
            [("Operational technology",
              ["Availability comes first, always",
               "Deterministic timing is a requirement",
               "Lifetimes measured in decades",
               "A restart may mean stopping production"]),
             ("Information technology",
              ["Confidentiality and integrity come first",
               "Timing is best-effort",
               "Lifetimes measured in years",
               "A restart is a routine remedy"])]),
        desc(
            "The priority ordering is the practical difference. Ordinary "
            "security advice assumes confidentiality first and availability "
            "last; on a production line the ordering reverses, and advice "
            "that ignores this is rejected by the people running the plant "
            "for reasons that are correct."
        ),
    ]),

    ("Industrial Control Systems", [
        desc(
            "The syllabus expects the standard vocabulary of plant control, "
            "since exam items name these components directly."
        ),
        table(
            ["Component", "What it does"],
            [["PLC",
              "A programmable controller running a control loop on the "
              "equipment, deterministically"],
             ["DCS",
              "A distributed control system coordinating a whole process "
              "plant"],
             ["SCADA",
              "Supervision and data acquisition across geographically spread "
              "equipment"],
             ["HMI",
              "The interface an operator watches and acts through"],
             ["Historian",
              "A store of process values over time, used for analysis and "
              "for proving what happened"]],
            caption="Five components of a plant control system.",
            footer="SCADA supervises and a PLC controls. That distinction is "
                   "worth holding: losing the supervisory link degrades "
                   "visibility, and losing the controller stops the "
                   "process."),
    ]),

    ("What SCADA Actually Provides", [
        desc(
            "SCADA sits above the controllers and is frequently "
            "misunderstood as being the control itself."
        ),
        ul([
            "It collects values from equipment that may be spread across a "
            "site, a pipeline, or a national grid.",
            "It presents them to operators in a form somebody can act on.",
            "It raises alarms when values leave their expected ranges.",
            "It allows operators to issue supervisory commands -- setpoints "
            "rather than moment-to-moment control.",
            "It records history, which is what makes investigating an "
            "incident possible afterwards.",
        ]),
        desc(
            "The fourth point contains the design principle. The control "
            "loop stays with the local controller so that it continues when "
            "the supervisory link is lost, which happens routinely over long "
            "distances and unreliable connections."
        ),
    ]),

    ("Industrial Communication", [
        desc(
            "Factory networks were designed before general networking "
            "arrived, and much of what they were designed for is still "
            "required."
        ),
        table(
            ["Property", "Why plant networks need it"],
            [["Determinism",
              "A control message that arrives late is worse than useless"],
             ["Noise tolerance",
              "Industrial environments are electrically hostile"],
             ["Physical robustness",
              "Cabling meets vibration, temperature, and oil"],
             ["Simple devices",
              "Endpoints may have very little processing available"],
             ["Long life",
              "Equipment installed decades ago must still communicate"]],
            caption="Five requirements of industrial communication.",
            footer="The last row explains why obsolete protocols persist. "
                   "Equipment that works and cost a great deal is not "
                   "replaced because its protocol is old, so newer systems "
                   "are made to speak to it."),
    ]),

    ("Protocols Without Security", [
        desc(
            "Most established industrial protocols were designed for "
            "isolated networks and carry no authentication at all."
        ),
        ul([
            "A command on such a protocol is obeyed because it arrived, not "
            "because the sender proved anything.",
            "Values can be read by anybody with access to the network "
            "segment.",
            "Messages can be altered in transit with nothing detecting it.",
            "This was reasonable when the network was physically separate "
            "and is not reasonable now.",
            "Replacing the protocols is generally impossible, so protection "
            "is placed around them instead.",
        ]),
        desc(
            "The last point is the practical answer the syllabus expects. "
            "Since the protocol cannot be made to authenticate, the network "
            "segment carrying it is separated and controlled -- security "
            "supplied by the surroundings because it cannot be supplied by "
            "the protocol."
        ),
    ]),

    ("Edge Computing", [
        desc(
            "Where the processing happens is the central architectural "
            "decision in an industrial IoT system."
        ),
        compare_grid(
            "PROCESSING AT THE EDGE AGAINST IN THE PLATFORM",
            "Near the machine, or centrally.",
            [("At the edge",
              ["Responds within milliseconds",
               "Continues working when the link is down",
               "Sends conclusions rather than raw data",
               "Limited by what fits on site, and harder to update"]),
             ("In the platform",
              ["Unlimited processing and storage",
               "Sees every site at once, so patterns emerge",
               "Updated centrally and easily",
               "Useless when the connection is unavailable"])]),
        desc(
            "Real installations do both, and the dividing line is "
            "consequence. Anything the process depends on runs at the edge; "
            "anything that informs a decision somebody makes later runs "
            "centrally."
        ),
    ]),

    ("Choosing a Connection", [
        desc(
            "Industrial devices are frequently placed where good "
            "connectivity is not available, which constrains the design more "
            "than anything else."
        ),
        table(
            ["Option", "Suits", "Costs"],
            [["Wired site network", "Fixed equipment inside a building",
              "Installation, and it cannot move"],
             ["Industrial wireless", "Equipment that moves within a site",
              "Interference and coverage planning"],
             ["Low-power wide-area", "Sparse sensors over a wide area",
              "Very small messages, very infrequently"],
             ["Cellular", "Vehicles and remote installations",
              "A running charge per device, times many devices"],
             ["Satellite", "Genuinely remote assets",
              "Expensive, and slow to respond"]],
            caption="Five connectivity options.",
            footer="The third row is the one people size wrongly. Low-power "
                   "wide-area links carry a few dozen bytes a few times an "
                   "hour, which suits a meter reading and cannot carry "
                   "anything resembling continuous monitoring."),
    ]),

    ("Power and Placement", [
        desc(
            "Where a sensor can be put is determined mostly by how it will "
            "be powered."
        ),
        ul([
            "Mains power is available on fixed equipment and nowhere else.",
            "A battery determines the service interval, and visiting a "
            "sensor may cost more than the sensor did.",
            "Energy harvesting -- vibration, heat difference, light -- "
            "removes the visit and supplies very little power.",
            "Transmission dominates the energy budget, so how often a device "
            "reports is the main design lever.",
            "The reporting interval therefore decides both battery life and "
            "how quickly anything can be noticed.",
        ]),
        desc(
            "The last point is the trade the whole design turns on. A sensor "
            "reporting every minute detects a problem quickly and needs "
            "servicing yearly; the same sensor reporting hourly lasts a "
            "decade and will not notice a fast-developing fault."
        ),
    ]),

    ("Predictive Maintenance", [
        desc(
            "The commercial case for instrumenting equipment usually rests "
            "on servicing it before it fails rather than after."
        ),
        ol([
            "Measure something that changes before failure -- vibration, "
            "temperature, current draw, acoustic signature.",
            "Establish what normal looks like for this specific machine, "
            "since machines differ.",
            "Detect departure from normal, which is usually gradual rather "
            "than sudden.",
            "Give enough warning that the intervention can be scheduled, "
            "which is the entire benefit.",
            "Confirm afterwards whether the prediction was right, since "
            "otherwise nobody learns whether the system works.",
        ]),
        desc(
            "Step four is where the value sits. Predicting a failure an hour "
            "before it happens is barely better than the failure; predicting "
            "it three weeks ahead converts an unplanned stoppage into a "
            "planned service during a shift the plant was not running "
            "anyway."
        ),
    ]),

    ("Digital Twins", [
        desc(
            "A digital twin is a model of a physical asset kept current from "
            "that asset's own data."
        ),
        ul([
            "It reflects the actual machine rather than the design, "
            "including its wear and its history.",
            "It supports asking what would happen without doing it to the "
            "real equipment.",
            "It supports comparing measured behaviour against modelled "
            "behaviour, and the gap is the diagnosis.",
            "It depends entirely on the data feeding it being accurate and "
            "current.",
            "A twin that has drifted from its asset is worse than none, "
            "because it is believed.",
        ]),
        desc(
            "The third point is the useful mechanism. A model saying the "
            "machine should be drawing a certain current, against a "
            "measurement saying it is drawing more, localises a problem far "
            "faster than either number alone."
        ),
    ]),

    ("Managing Devices at Scale", [
        desc(
            "One device is an engineering exercise. Fifty thousand devices "
            "is an operations problem, and it is a different problem."
        ),
        table(
            ["Concern", "What it means at scale"],
            [["Provisioning",
              "Each device needs identity and credentials without anybody "
              "typing them"],
             ["Monitoring",
              "Knowing which devices stopped reporting, out of very many"],
             ["Updating",
              "Staged rollout, since an update that fails must not reach "
              "all of them"],
             ["Configuration",
              "Changing settings across a fleet without visiting any of it"],
             ["Decommissioning",
              "Removing credentials when a device is retired or stolen"]],
            caption="Five fleet management concerns.",
            footer="The third row is the one that limits the damage. An "
                   "update pushed to every device at once turns a single "
                   "defect into a total outage, which is why rollouts are "
                   "staged and monitored between stages."),
    ]),

    ("Industrial Security", [
        desc(
            "Connecting production equipment to anything gave attackers a "
            "route to consequences that are physical rather than "
            "informational."
        ),
        ul([
            "The consequence of compromise is damaged equipment, stopped "
            "production, or injury -- not disclosed data.",
            "The equipment cannot be patched on an ordinary schedule, so "
            "vulnerabilities persist for years by design.",
            "Remote access for maintenance is the most common route in, "
            "because it is the route that exists.",
            "Suppliers' own connections into the plant are frequently "
            "outside the plant's control.",
            "Detection is harder because normal behaviour is repetitive and "
            "abnormal behaviour may look like a process fault.",
        ]),
        desc(
            "The third point deserves attention because it is created by a "
            "genuine need. Equipment suppliers require access to support what "
            "they sold, and the access is arranged for convenience unless "
            "somebody deliberately arranges it otherwise."
        ),
    ]),

    ("Separation, and Why Air Gaps Fail", [
        desc(
            "Plant networks are described as isolated far more often than "
            "they actually are."
        ),
        compare_grid(
            "THE CLAIMED SEPARATION AGAINST THE ACTUAL ONE",
            "What the diagram shows, against what exists.",
            [("Claimed",
              ["No connection to any other network",
               "Nothing enters except through the door",
               "Attackers have no route",
               "Therefore no protection needed inside"]),
             ("Actual",
              ["Maintenance laptops connect to both",
               "Removable media carries files in",
               "Supplier links were added and not recorded",
               "Somebody needed data out, and arranged it"])]),
        desc(
            "This is why SEGMENTATION replaces isolation as the governing "
            "idea. The plant network is assumed to be reachable, divided into "
            "zones with controlled crossings between them, so a compromise "
            "in one zone does not reach the controllers in another."
        ),
    ]),

    ("Safety Instrumented Systems", [
        desc(
            "Where a process can injure people, a separate system exists "
            "solely to prevent it, and its independence is the point."
        ),
        ul([
            "It is separate from the control system, with its own sensors "
            "and its own logic.",
            "It does nothing during normal operation, and acts only to bring "
            "the process to a safe state.",
            "It FAILS SAFE, so its own failure produces the safe state "
            "rather than an undefined one.",
            "It is certified to a defined integrity level, and changes to it "
            "are formally assessed.",
            "It is not connected to anything that could be used to disable "
            "it remotely.",
        ]),
        desc(
            "Independence is what makes it worth having. A safety function "
            "sharing sensors or logic with the control system would be "
            "disabled by exactly the failure that makes it necessary, which "
            "is why it duplicates equipment that already exists."
        ),
    ]),

    ("How Much Data To Keep", [
        desc(
            "Instrumented equipment produces far more data than anybody will "
            "look at, and deciding what to retain is a design decision rather "
            "than an afterthought."
        ),
        table(
            ["Approach", "Keeps", "Loses"],
            [["Everything, at full rate",
              "Every detail available for later analysis",
              "Storage and transmission cost, growing forever"],
             ["Aggregated over intervals",
              "Trends, cheaply", "Short events between samples"],
             ["Only on change", "Storage, and most information is retained",
              "Nothing much, if the threshold is chosen well"],
             ["Only on exception",
              "Almost all cost", "Any ability to see what preceded a fault"],
             ["Full rate briefly, aggregated afterwards",
              "Detail when it matters, cheap history",
              "Requires deciding in advance what matters"]],
            caption="Five retention strategies.",
            footer="The fourth row is the trap. Recording only exceptions "
                   "means the data explaining why the exception occurred was "
                   "the data that was discarded."),
    ]),

    ("Standards and Interoperability", [
        desc(
            "Industrial equipment comes from many suppliers over many years, "
            "so agreeing how it describes itself matters more than in most "
            "fields."
        ),
        ul([
            "A common information model lets a system understand equipment "
            "it was not written for.",
            "Standard interfaces let one supplier's device be replaced by "
            "another's without rewriting everything above it.",
            "Proprietary protocols create dependence on a supplier for the "
            "whole life of the equipment, which is decades.",
            "Certification schemes give buyers some evidence that a claim of "
            "conformance is true.",
            "Standards lag practice, so the newest capabilities are "
            "generally proprietary first.",
        ]),
        desc(
            "The third point is the commercial consequence engineers are "
            "asked about. Choosing a proprietary protocol is choosing a "
            "supplier for twenty years, and the price of everything "
            "afterwards is negotiated from that position."
        ),
    ]),

    ("Smart Factory Concepts", [
        desc(
            "The syllabus names several ideas grouped under the "
            "industrial-modernisation heading, and expects them to be "
            "distinguished."
        ),
        content_accordion(
            "TERMS IN THE SMART MANUFACTURING AREA",
            "Related ideas that are not the same idea.",
            [("Industry 4.0",
              "The general programme of connecting production equipment, "
              "collecting its data, and using that data to change how "
              "production is planned and run. It is a direction rather than "
              "a technology."),
             ("Industrial IoT",
              "The specific practice of instrumenting equipment and "
              "connecting it. It is the mechanism most of the rest depends "
              "on."),
             ("Cyber-physical system",
              "A system in which computation and physical process are "
              "coupled, each affecting the other continuously. A control "
              "loop is the simplest example."),
             ("Smart factory",
              "A plant in which production decisions respond to current "
              "conditions rather than to a plan made earlier."),
             ("Mass customisation",
              "Producing individually varied output at close to mass "
              "production cost, which flexible automation and good data "
              "make possible.")]),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc(
            "Industrial IoT sits on top of most of the certification, which "
            "is why items here reach into other categories."
        ),
        content_tabs(
            "WHAT THIS LESSON DEPENDS ON",
            "Each tab is a category this one draws from.",
            [("Network", "Connectivity and its limits",
              "Which connection a device uses determines what it can report "
              "and how often, and the plant network's segmentation is "
              "ordinary network design applied where the consequence of "
              "getting it wrong is physical."),
             ("Security", "Consequences that are not informational",
              "Everything about authentication, segmentation and remote "
              "access applies here, with availability promoted above "
              "confidentiality and patching constrained in a way ordinary "
              "systems are not."),
             ("Database", "What to keep and for how long",
              "A historian is a time-series store with retention rules, and "
              "the aggregation strategies here are the same trade between "
              "detail and cost that storage design always makes."),
             ("Project management", "Installing into a running plant",
              "Work on production equipment has to fit around production, so "
              "the schedule is constrained by shutdown windows rather than "
              "by how long the work takes."),
             ("Service management", "Supporting equipment for decades",
              "Support commitments, spare parts and change assessment are "
              "service management applied over a lifetime much longer than "
              "any software service agreement.")]),
    ]),

    ("Common Mistakes", [
        desc("Where industrial IoT items are lost."),
        review_cards(
            "MISTAKES THAT COST MARKS HERE",
            "Each is a plausible answer that is wrong.",
            [("Treating industrial security as ordinary IT security",
              "The priority order reverses: availability comes first, and "
              "patching is constrained by the process rather than by "
              "policy.",
              "If an answer recommends prompt patching of a controller "
              "without qualification, it has missed the constraint."),
             ("Confusing SCADA with control",
              "SCADA supervises and records; the controller runs the loop. "
              "Losing SCADA degrades visibility rather than stopping the "
              "process.",
              "Items describe a lost link and ask what continues."),
             ("Assuming an air gap exists because a diagram shows one",
              "Maintenance laptops, removable media and supplier links cross "
              "it routinely, which is why segmentation replaced isolation.",
              "The correct answer usually assumes the network is "
              "reachable."),
             ("Putting time-critical control in the cloud",
              "Anything the process depends on must survive the link being "
              "unavailable, which means it runs at the edge.",
              "Decide by consequence: does the process stop if this is "
              "late?"),
             ("Treating predictive maintenance as failure detection",
              "The value is in the warning period, not the detection. A "
              "prediction arriving too late to schedule around is worth "
              "little.",
              "Ask how much notice the answer provides.")]),
    ]),

    ("Review", [
        desc("The points items are built on."),
        review_cards(
            "WHAT TO CARRY OUT OF THIS LESSON",
            "Answer each before moving on.",
            [("What distinguishes OT from IT priorities?",
              "OT puts availability first and requires deterministic timing, "
              "over lifetimes of decades.",
              "This single reversal explains most industrial practice."),
             ("What does SCADA provide?",
              "Supervision, data acquisition, alarms, history and setpoint "
              "commands -- not the control loop itself.",
              "The loop stays local so it survives the link."),
             ("Why do insecure industrial protocols persist?",
              "They cannot be replaced without replacing equipment that "
              "works, so protection is placed around them instead.",
              "Segmentation supplies what the protocol cannot."),
             ("What decides whether processing goes at the edge?",
              "Whether the process depends on it, since the edge keeps "
              "working when the connection does not.",
              "Consequence, not convenience."),
             ("What is the main lever on a battery sensor's life?",
              "How often it transmits, since transmission dominates the "
              "energy budget.",
              "And it trades directly against how fast anything is "
              "noticed."),
             ("Why must a safety instrumented system be independent?",
              "Otherwise the failure that makes it necessary is the failure "
              "that disables it.",
              "It duplicates equipment deliberately.")]),
    ]),
]


_iot_quiz = [
    mcq("AVERAGE",
        "Operational technology and information technology order their "
        "priorities differently.\n\nHow does OT order them?",
        [("Availability first, with deterministic timing required", True),
         ("Confidentiality first, because process data is commercially "
          "sensitive information", False),
         ("Integrity first, because incorrect readings mislead the "
          "operators watching them", False),
         ("Cost first, because industrial equipment is considerably more "
          "expensive to replace", False)],
        "A production process that stops has an immediate physical and "
        "commercial cost, and a control loop that acts late has failed even "
        "if it acts correctly. This reversal is why ordinary security "
        "guidance, which assumes confidentiality first, is rejected by plant "
        "engineers for reasons that are sound rather than obstructive."),

    mcq("AVERAGE",
        "The supervisory link between a control room and a remote pumping "
        "station is lost.\n\nWhat happens to the pump?",
        [("It continues under its local controller", True),
         ("It stops immediately, because its instructions can no longer "
          "reach it from the control room", False),
         ("It continues but ignores every safety limit that was configured "
          "for it centrally", False),
         ("It reverts to whatever manual setting was last applied by an "
          "engineer on site", False)],
        "SCADA supervises; the local controller runs the loop. The control "
        "logic and its limits are held on the controller precisely so that "
        "the process continues when the supervisory connection is lost, "
        "which over long distances is a routine event. What is lost is "
        "visibility and the ability to change setpoints."),

    mcq("HARD",
        "Established industrial protocols generally carry no "
        "authentication.\n\nWhat is the usual response?",
        [("Segmenting the network that carries them", True),
         ("Replacing the protocols with modern authenticated equivalents "
          "throughout the plant", False),
         ("Encrypting every message at the application layer above the "
          "existing protocol", False),
         ("Requiring operators to authenticate before issuing any command "
          "from the interface", False)],
        "The protocols cannot be changed without replacing equipment that "
        "works and cost a great deal, and much of it has a remaining life "
        "measured in decades. Since security cannot come from the protocol, "
        "it comes from the surroundings: the segment is separated, crossings "
        "are controlled, and what can reach the controllers is limited."),

    mcq("AVERAGE",
        "Some control function must respond within milliseconds, and the "
        "site's connection is unreliable.\n\nWhere should it run?",
        [("At the edge, on site", True),
         ("In the central platform, which has considerably more processing "
          "power available to it", False),
         ("Split between both, with the platform holding the authoritative "
          "copy of the logic", False),
         ("In the central platform, with a local cache holding recent "
          "instructions in case of loss", False)],
        "Anything the process depends on must keep working when the link "
        "does not, and a millisecond response cannot survive a round trip in "
        "any case. The dividing line is consequence: process-critical logic "
        "runs locally, and analysis informing a decision somebody makes later "
        "runs centrally where the processing is cheap."),

    mcq("HARD",
        "One battery sensor is specified to report every minute, and its "
        "expected life proves far too short.\n\nWhat is the "
        "principal lever?",
        [("The reporting interval", True),
         ("The processing performed on the device before each reading is "
          "transmitted onward", False),
         ("The accuracy of the sensing element, which draws current "
          "continuously while measuring", False),
         ("The amount of memory the device holds readings in between "
          "transmissions", False)],
        "Transmission dominates the energy budget of a low-power device by a "
        "wide margin, so how often it sends is the main determinant of "
        "battery life. The trade is direct and unavoidable: a longer interval "
        "buys years of life and delays how quickly any developing fault can "
        "be noticed."),

    mcq("AVERAGE",
        "Predictive maintenance is valued for something other than "
        "detecting failures.\n\nWhat?",
        [("The warning period, which allows the work to be scheduled", True),
         ("The accuracy of its predictions, which exceeds that of "
          "scheduled inspection by qualified staff", False),
         ("The reduction in the number of sensors that must be installed "
          "on each machine", False),
         ("The elimination of unplanned maintenance work from the "
          "organisation altogether", False)],
        "Detecting a failure as it happens is barely better than the failure "
        "itself. The benefit is converting an unplanned stoppage into planned "
        "work during a period the plant was not producing anyway, and that "
        "requires enough notice to arrange parts, people and a window."),

    mcq("HARD",
        "A plant network is described as air-gapped, and an investigation "
        "finds malware on a controller.\n\nWhat is the most likely "
        "explanation?",
        [("Something crossed the gap -- a laptop, media, or a supplier "
          "link", True),
         ("The malware was present in the controller's firmware when the "
          "equipment was originally delivered", False),
         ("The gap was breached by an attacker with physical access to the "
          "building and its cabinets", False),
         ("A wireless interface on the controller was enabled by default "
          "and nobody had noticed it", False)],
        "Claimed air gaps are crossed routinely by maintenance laptops that "
        "connect to both sides, removable media carrying files in, and "
        "supplier connections added for support and not recorded anywhere. "
        "This is why segmentation, which assumes the network is reachable, "
        "replaced isolation as the governing idea."),

    mcq("AVERAGE",
        "A safety instrumented system duplicates sensors and logic the "
        "control system already has.\n\nWhy is that deliberate?",
        [("Sharing them would let one failure disable both", True),
         ("The safety system requires readings at a considerably higher "
          "rate than the control system takes them", False),
         ("Certification bodies require a specific manufacturer's equipment "
          "for safety functions", False),
         ("The control system's sensors are not accurate enough for safety "
          "decisions to be based on them", False)],
        "Independence is the entire property being bought. A safety function "
        "depending on the control system would be unavailable in exactly the "
        "circumstance it exists for, so the duplication is the requirement "
        "rather than an oversight, and it is why these systems also fail "
        "safe rather than into an undefined state."),

    mcq("AVERAGE",
        "Retention is set so that only exception values are stored.\n\nWhat "
        "does this lose?",
        [("The data explaining what led up to the exception", True),
         ("The ability to report on overall equipment availability across "
          "the reporting period", False),
         ("Any record that the exception occurred at all once the alarm has "
          "been acknowledged", False),
         ("The capacity to compare one machine's behaviour against another "
          "of the same type", False)],
        "An exception is the moment a problem became visible, and diagnosing "
        "it depends on the ordinary readings that preceded it. Keeping only "
        "exceptions discards precisely the record that would explain them, "
        "which is why full-rate retention over a recent window with "
        "aggregation afterwards is the common compromise."),

    mcq("HARD",
        "Equipment is selected that uses a supplier's proprietary "
        "protocol.\n\nWhat is the principal long-term consequence?",
        [("Dependence on that supplier for the equipment's whole life", True),
         ("Higher running costs, because proprietary protocols use "
          "bandwidth considerably less efficiently", False),
         ("Reduced security, because proprietary protocols receive far less "
          "external scrutiny than open ones", False),
         ("Difficulty recruiting engineers who have experience of that "
          "particular supplier's equipment", False)],
        "Industrial equipment lives for decades, so a protocol choice is a "
        "supplier choice for that whole period. Everything afterwards -- "
        "additions, replacements, support terms, price -- is negotiated from "
        "a position where changing supplier means replacing working "
        "equipment."),
]


LESSON_BIZ_IOT = lesson(
    MAJOR, MIDDLE,
    "Industrial Devices, IoT and Control Equipment",
    _iot_quiz,
    lesson_structure(
        "Industrial Devices, IoT and Control Equipment",
        "Industrial equipment has been computer-controlled for decades, and "
        "what changed is that it now reports outside the plant. The "
        "governing difference from consumer devices is CONSEQUENCE: a "
        "failure stops production or injures somebody, which is why "
        "operational technology puts AVAILABILITY first, requires "
        "deterministic timing, and cannot be patched on an ordinary "
        "schedule. This lesson covers the control components and what each "
        "does, why insecure protocols persist and what is placed around "
        "them, the edge-against-platform decision that is settled by "
        "consequence rather than capability, power as the limit on what can "
        "be sensed, and why claimed air gaps are crossed routinely.",
        [
            "Distinguish OT priorities from IT priorities",
            "Name the components of an industrial control system",
            "State what SCADA provides and what it does not",
            "Explain why insecure industrial protocols persist",
            "Decide what belongs at the edge",
            "Explain what limits a battery-powered sensor",
            "Explain where predictive maintenance's value lies",
            "Explain why air gaps fail in practice",
        ],
        75,
        _iot_sections,
        [
            ("OT priorities",
             "Availability first, deterministic timing required, lifetimes "
             "of decades."),
            ("SCADA against control",
             "SCADA supervises, records and alarms; the local controller "
             "runs the loop and survives the link being lost."),
            ("Insecure protocols",
             "Designed for isolated networks, unreplaceable, so segmentation "
             "supplies the protection instead."),
            ("Edge against platform",
             "Anything the process depends on runs at the edge, because the "
             "connection is the part that fails."),
            ("Battery sensors",
             "Transmission dominates the energy budget, so the reporting "
             "interval trades life against how fast a fault is noticed."),
            ("Predictive maintenance",
             "The value is the WARNING PERIOD, which converts unplanned "
             "stoppage into scheduled work."),
            ("Air gaps",
             "Crossed by laptops, media and supplier links, which is why "
             "segmentation assumes the network is reachable."),
            ("Safety instrumented systems",
             "Independent by design and fail safe, since shared equipment "
             "would fail together."),
        ],
        "Industrial computing differs from everything else in this "
        "certification by the direction of its consequences: equipment "
        "failing stops production or injures somebody, so OPERATIONAL "
        "TECHNOLOGY puts availability first, requires deterministic timing, "
        "and lives for decades rather than years. The control stack runs "
        "from PLCs and DCS through SCADA supervision to historians, and the "
        "distinction that matters is that SCADA supervises while the local "
        "controller runs the loop -- so losing the link costs visibility "
        "rather than the process. Established protocols carry no "
        "authentication because they were designed for isolated networks, "
        "and since replacing them means replacing working equipment, "
        "SEGMENTATION is placed around them instead. Processing is divided "
        "by consequence, with anything the process depends on running at the "
        "EDGE where it survives the connection. Battery sensors are limited "
        "by TRANSMISSION, so the reporting interval trades service life "
        "against detection speed. And the air gap on the diagram is crossed "
        "routinely by maintenance laptops, removable media and supplier "
        "links, which is why modern practice assumes the plant network is "
        "reachable and controls the crossings between zones.",
        exam_notes=[
            desc(
                "Items describe an industrial situation and ask which "
                "constraint explains it."
            ),
            ul([
                "Ordering OT priorities against IT ones.",
                "Deciding what continues when a supervisory link is lost.",
                "Explaining what is done about unauthenticated protocols.",
                "Placing a time-critical function at the edge.",
                "Identifying the reporting interval as the battery lever.",
                "Explaining where predictive maintenance's value lies.",
                "Diagnosing how something crossed a claimed air gap.",
            ]),
            desc(
                "For any item in this area, ask what the consequence of "
                "failure is. Almost every answer that distinguishes "
                "industrial practice from ordinary IT practice follows from "
                "the consequence being physical and the equipment being "
                "unreplaceable for twenty years."
            ),
        ],
    ))


LESSONS = [LESSON_BIZ_IOT]

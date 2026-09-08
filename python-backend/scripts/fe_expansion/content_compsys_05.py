"""Computer System -> System Component.

Syllabus minor categories 1 (system configuration) and 2 (system evaluation
indexes).

Disproportionately valuable material. Availability, MTBF and MTTR arithmetic
appears on Subject A every sitting, and the same formulas reappear as service
level targets in Service Management and as impact estimates in Project Risk
Management -- so every calculation here is worked on numbers rather than
stated as a formula.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Computer System"
MIDDLE = "System Component"

# ==========================================================================
# Lesson 1: System configuration
# ==========================================================================

_config_sections = [
    ("Why More Than One Machine", [
        desc(
            "A single machine has two problems that no amount of improving it "
            "solves. It can only be made so fast, and when it stops, "
            "everything stops. Multiple machines address both, and which "
            "problem you are solving decides how they are arranged."
        ),
        image(fig("system-configurations")),
        compare_grid(
            "TWO DIFFERENT GOALS, OFTEN CONFUSED",
            "A configuration chosen for one does not automatically deliver "
            "the other, and examination items exploit the confusion.",
            [("Availability",
              "The system keeps serving when a component fails. Achieved by "
              "REDUNDANCY -- having a spare that can take over -- and "
              "measured as the fraction of time the service is usable."),
             ("Performance",
              "The system serves more work, or serves it faster. Achieved by "
              "adding CAPACITY and distributing work across it, and measured "
              "as throughput or response time.")]),
        desc(
            "The two overlap but are not the same. A hot standby doubles the "
            "hardware and adds no capacity at all, because the spare does "
            "nothing until the primary fails. A load-sharing cluster adds "
            "both -- and only if it is sized so the survivors can carry the "
            "load when one is lost, which is a design decision people "
            "routinely omit."
        ),
    ]),

    ("Standby Configurations", [
        desc(
            "The syllabus names three arrangements of a spare, and they "
            "differ in how ready the spare is and therefore how quickly it "
            "takes over."
        ),
        table(
            ["Arrangement", "State of the spare", "Switchover time",
             "Cost"],
            [["Hot standby", "Running, synchronised, ready to take over",
              "Seconds or less", "Highest -- full duplicate, kept current"],
             ["Warm standby", "Running but not fully synchronised",
              "Minutes", "Moderate"],
             ["Cold standby", "Powered off, or not yet configured",
              "Hours", "Lowest -- the hardware may even be shared"]],
            caption="Three degrees of readiness, and what each costs.",
            footer="The choice follows directly from the acceptable outage. "
                   "There is no point paying for hot standby if the business "
                   "tolerates an hour, and no point buying cold standby if it "
                   "does not."),
        desc(
            "DUAL SYSTEM is the syllabus's separate term for a configuration "
            "where two machines process the SAME work and their results are "
            "compared. A disagreement reveals a fault immediately rather than "
            "producing a wrong answer, which is why it appears in "
            "safety-critical and financial settings. It is the most expensive "
            "arrangement here, because the second machine does no additional "
            "work at all."
        ),
        desc(
            "DUPLEX SYSTEM is the term for a primary and a standby that can "
            "swap roles, with the standby often performing lower-priority "
            "work meanwhile. It is the compromise: the spare capacity is not "
            "entirely wasted, and the secondary work is abandoned when a "
            "failover happens."
        ),
    ]),

    ("Clustering and Load Distribution", [
        desc(
            "A cluster is several machines presenting themselves as one "
            "service. Unlike a standby arrangement, every node does real work "
            "all the time, so the redundancy is not idle."
        ),
        content_accordion(
            "WHAT A CLUSTER HAS TO SOLVE",
            "Each of these is a genuine design problem, and getting any of "
            "them wrong produces a cluster that is less reliable than one "
            "machine.",
            [("Distributing the work",
              "A load balancer spreads requests across the nodes -- by "
              "rotation, by current load, or by a hash of some request "
              "attribute. Hashing matters when a client's requests must keep "
              "reaching the same node."),
             ("Detecting failure",
              "Nodes monitor one another with a heartbeat. The judgement is "
              "how long silence must last before a node is declared dead: too "
              "short and a busy node is evicted needlessly, too long and "
              "requests are sent into a void."),
             ("Avoiding split brain",
              "If the network between nodes fails but both keep running, each "
              "may conclude the other has died and both act as primary -- so "
              "two nodes write conflicting data. Prevented by requiring a "
              "QUORUM, a majority, before a node may act, which is why "
              "clusters are built with an odd number of members."),
             ("Sharing state",
              "Nodes must agree on data. Either they share storage, which "
              "makes the storage the single point of failure, or they "
              "replicate between themselves, which raises the question of "
              "what happens when replicas disagree."),
             ("Sizing for failure",
              "A cluster of four nodes at 80% utilisation cannot survive "
              "losing one: the remaining three would need 107% of their "
              "capacity. Sizing must leave room for the load a failed node's "
              "share represents.")]),
        desc(
            "That last point is the one most often missed, and it is a "
            "favourite examination scenario. Redundancy that cannot carry the "
            "load after a failure is not redundancy -- it merely converts a "
            "single failure into a cascading one, as each surviving node is "
            "overwhelmed in turn."
        ),
    ]),

    ("Processing Modes", [
        desc(
            "Separately from how machines are arranged, the syllabus "
            "classifies how work reaches them. These terms appear in "
            "examination items without explanation."
        ),
        table(
            ["Mode", "How work arrives", "Response expectation"],
            [["Batch processing", "Accumulated and processed as a group",
              "Hours; results are not needed immediately"],
             ["Online / interactive", "Individually, as users submit them",
              "Sub-second; a person is waiting"],
             ["Real-time processing", "As events occur",
              "A deadline that is part of correctness"],
             ["Time sharing", "Many users, each given slices of the machine",
              "Each user perceives a responsive machine"],
             ["Distributed processing", "Split across several machines",
              "Depends on what is distributed and why"]],
            caption="Five processing modes the syllabus names.",
            footer="Batch survives because it is efficient: no user is "
                   "waiting, so work can be scheduled when capacity is cheap "
                   "and grouped so overheads are paid once for many items."),
        desc(
            "The distinction the examination presses on is between batch and "
            "online, and it is genuinely a design fork rather than a "
            "preference. Batch processing achieves far higher throughput per "
            "unit of hardware because it amortises setup costs across many "
            "records and can run when the machine is otherwise idle. Online "
            "processing gives an immediate answer and pays for it with "
            "capacity that must be sized for the peak rather than the "
            "average."
        ),
    ]),

    ("Client-Server and Tiered Architectures", [
        desc(
            "Where processing happens between the user's machine and the "
            "central one has swung back and forth for decades, and the "
            "syllabus expects the arrangements by name."
        ),
        content_tabs(
            "WHERE THE WORK HAPPENS",
            "Each arrangement moves the boundary, and each trades "
            "responsiveness against manageability.",
            [("Centralised", "Everything on one machine",
              "Terminals with no processing of their own. Simple to manage "
              "and to secure because there is one place to do it, and "
              "entirely dependent on that one machine and on the network to "
              "it."),
             ("Client-server (two-tier)", "Split between client and server",
              "The client handles presentation and some logic; the server "
              "handles data. Responsive, and it puts business logic on "
              "machines you do not control -- so every change must be "
              "deployed to every client."),
             ("Three-tier", "Presentation, logic and data separated",
              "A middle tier holds the business logic, so it can be changed "
              "in one place, and each tier can be scaled independently. The "
              "standard arrangement for business systems, and the reason web "
              "applications look the way they do."),
             ("Thin client", "Almost everything on the server",
              "The client renders and accepts input and nothing else. "
              "Centralised management and security return, at the cost of "
              "total dependence on the network.")]),
        desc(
            "The pattern worth noticing is that this is a pendulum rather "
            "than a progression. Processing moved to the desktop when "
            "desktops became capable, back to the server when managing "
            "thousands of desktops became the dominant cost, and out to the "
            "browser and back again since. Each swing was driven by which "
            "cost dominated at the time, not by one arrangement being "
            "correct."
        ),
    ]),

    ("Virtualisation and Consolidation", [
        desc(
            "One physical machine can present itself as several, each running "
            "its own operating system. This is now the default way servers "
            "are deployed, and it changes several of the arguments above."
        ),
        table(
            ["Approach", "What is virtualised", "Isolation", "Overhead"],
            [["Full virtualisation", "The whole machine, including hardware",
              "Strong -- separate kernels", "A hypervisor layer"],
             ["Containers", "The operating system's view of itself",
              "Weaker -- one shared kernel", "Very little"],
             ["No virtualisation", "Nothing", "Physical separation",
              "None, and the machine is usually underused"]],
            caption="Three points on the isolation-against-overhead trade.",
            footer="Containers start in milliseconds and share a kernel; "
                   "virtual machines start in seconds and do not. The choice "
                   "is usually about how much you trust what is running."),
        desc(
            "CONSOLIDATION is the immediate benefit: most servers use a small "
            "fraction of their capacity, so running many as virtual machines "
            "on fewer physical ones cuts hardware, power and cooling "
            "substantially. That is the Facility Management lesson's green "
            "computing argument, arriving from the architecture side."
        ),
        desc(
            "The consequence for availability is worth stating carefully, "
            "because it cuts both ways. Virtualisation makes a failed machine "
            "far easier to replace -- a virtual machine can be restarted on "
            "other hardware in minutes rather than rebuilt. It also puts many "
            "services on one physical host, so a host failure now takes down "
            "everything it carried. Anti-affinity rules, which keep the "
            "members of a redundant pair on different hosts, exist precisely "
            "because people forget this."
        ),
    ]),

    ("Load Balancing Methods", [
        desc(
            "A cluster needs work distributed across it, and how that "
            "distribution is decided has consequences the examination asks "
            "about."
        ),
        table(
            ["Method", "How the node is chosen", "Suits"],
            [["Round robin", "Each node in turn",
              "Requests of similar cost, nodes of similar capacity"],
             ["Weighted round robin", "In turn, proportional to capacity",
              "A cluster of unequal machines"],
             ["Least connections", "The node with fewest active requests",
              "Requests of very unequal duration"],
             ["Least response time", "The node currently answering fastest",
              "Nodes whose performance varies"],
             ["Hash of an attribute", "Determined by client address or "
                                      "session id",
              "When a client must keep reaching the same node"]],
            caption="Five distribution methods and where each fits.",
            footer="Round robin is the default and is wrong whenever request "
                   "costs differ widely: a node that happens to receive "
                   "several expensive requests is overwhelmed while others "
                   "idle."),
        desc(
            "The last row exists because of SESSION STATE. If a node holds "
            "something about a client in memory, subsequent requests must "
            "return to that node -- called session affinity, or sticky "
            "sessions. It works, and it undermines the cluster: a failed node "
            "loses its clients' sessions, and load cannot be rebalanced "
            "freely."
        ),
        desc(
            "The better answer is to remove the reason for affinity by "
            "holding session state somewhere shared, so any node can serve "
            "any request. That is a software design decision made long before "
            "the load balancer is configured, and it is the same "
            "statelessness argument that decides whether a system can scale "
            "out at all."
        ),
    ]),

    ("Single Points of Failure", [
        desc(
            "A single point of failure is any component whose loss stops the "
            "whole service. Finding them is the first thing to do with any "
            "architecture diagram, and it is examined by giving you one and "
            "asking where the weakness is."
        ),
        table(
            ["Apparently redundant", "The hidden single point"],
            [["Two servers behind one load balancer", "The load balancer"],
             ["A cluster on shared storage", "The storage array"],
             ["Two power supplies on one circuit", "The circuit"],
             ["Two network cards to one switch", "The switch"],
             ["Two data centres on one provider", "The provider"],
             ["Two virtual machines on one host", "The host"]],
            caption="Redundancy that is not, and the component it still "
                    "depends on.",
            footer="Every row has the same shape: the redundant pair converges "
                   "on something that was not duplicated, so the failure it "
                   "was meant to survive still ends the service."),
        desc(
            "The method for finding them is mechanical and worth practising. "
            "Take each component in turn, assume it has failed, and ask "
            "whether the service continues. Anything that fails that test is "
            "a single point of failure, whether or not the diagram looks "
            "redundant -- and diagrams routinely look redundant while hiding "
            "one, because the duplicated boxes are drawn and the shared "
            "dependency is not."
        ),
        desc(
            "Eliminating every one is rarely the right answer. Each removal "
            "costs money and adds complexity, and complexity has its own "
            "failure modes -- an automatic failover mechanism can itself "
            "fail, or trigger wrongly. The judgement is which failures are "
            "worth what, which is exactly the risk analysis of Project Risk "
            "Management applied to architecture."
        ),
    ]),

    ("Scaling Up and Scaling Out", [
        desc(
            "When a system needs more capacity there are two directions to "
            "grow in, and the choice constrains everything afterwards."
        ),
        compare_grid(
            "TWO DIRECTIONS",
            "The examination asks which a described approach is, and which "
            "suits a stated constraint.",
            [("Scaling up (vertical)",
              "A bigger machine -- more processors, more memory, faster "
              "disks. Requires no change to the software, which is its great "
              "advantage, and runs into a hard ceiling at the largest machine "
              "available. Usually needs downtime to perform."),
             ("Scaling out (horizontal)",
              "More machines working together. No ceiling in principle, and "
              "capacity can be added and removed while running -- but the "
              "software must be written to distribute work and share state, "
              "which is a substantial requirement rather than a "
              "configuration change.")]),
        desc(
            "Scaling out also delivers availability as a side effect, since "
            "several machines are already present, while scaling up "
            "concentrates the service on one machine and makes the single "
            "point of failure worse. That is often the deciding argument "
            "rather than the capacity ceiling."
        ),
        desc(
            "The constraint people meet in practice is that scaling out is a "
            "software property, not a purchasing decision. A system holding "
            "state in one process cannot be scaled out by adding machines, "
            "however much money is available -- which is why the decision "
            "belongs in the design phase and is expensive to revisit."
        ),
    ]),

    ("Fault Tolerance and Degradation", [
        desc(
            "What a system does when a component fails is a design choice, "
            "and the Basic Theory lesson's vocabulary applies directly here."
        ),
        content_accordion(
            "FOUR RESPONSES TO A FAILURE",
            "Examination items describe the behaviour and ask for the term.",
            [("Fault tolerance",
              "The system continues correctly and at full capability, because "
              "redundant components take over. The most expensive answer, and "
              "the only one acceptable where neither stopping nor degrading "
              "is tolerable."),
             ("Fail-soft (graceful degradation)",
              "The system continues with reduced function or capacity. An "
              "online service that disables search while its index rebuilds, "
              "or a cluster running slower on fewer nodes."),
             ("Fail-safe",
              "The system moves to a state that is safe even though it is not "
              "useful. A payment terminal that declines every transaction "
              "when it cannot reach the authorisation service is failing "
              "safe."),
             ("Fail-secure",
              "The system moves to a state that preserves security, which may "
              "be the opposite of what safety would require. A door that "
              "locks on power failure is fail-secure; one that unlocks is "
              "fail-safe. Which is correct depends entirely on whether fire "
              "or intrusion is the greater risk.")]),
        desc(
            "That last pair is the one worth remembering, because it shows "
            "these are not synonyms and the right choice is a judgement about "
            "consequences rather than a technical default. The same door, in "
            "a server room and in a stairwell, should behave in opposite ways "
            "on a power failure."
        ),
    ]),

    ("Backup Sites and Disaster Recovery", [
        desc(
            "Redundancy within one building answers a component failure. It "
            "answers nothing about the building, which is what a backup site "
            "is for -- and the terminology parallels the standby "
            "configurations above."
        ),
        table(
            ["Site type", "State", "Recovery time", "Cost"],
            [["Hot site", "Fully equipped, data current, staffed", "Hours",
              "Highest -- a duplicate facility"],
             ["Warm site", "Equipped, data periodically refreshed",
              "A day or two", "Moderate"],
             ["Cold site", "Space and power only; equipment must be brought",
              "Weeks", "Lowest"],
             ["Mutual aid", "An agreement with another organisation",
              "Uncertain", "Very low, and least dependable"]],
            caption="Backup site options, and what each delivers.",
            footer="Mutual aid looks attractive and fails exactly when it is "
                   "needed: a regional event affects both parties, and the "
                   "partner's own recovery takes priority over yours."),
        desc(
            "Two targets drive the choice, and Service Management defines "
            "them formally. The RECOVERY TIME OBJECTIVE is how long the "
            "service may be down; the RECOVERY POINT OBJECTIVE is how much "
            "data may be lost, measured backwards from the failure. A "
            "four-hour RTO rules out a cold site immediately, and a "
            "five-minute RPO rules out nightly backups."
        ),
    ]),

    ("Reading an Architecture Diagram", [
        desc(
            "Examination items present a configuration and ask a question "
            "about it. A short reading procedure answers most of them."
        ),
        ol([
            "Trace the request path from the user to the data and back. "
            "Anything on that path can stop the service.",
            "Mark every component that appears exactly once. Those are the "
            "candidate single points of failure.",
            "Look for shared dependencies behind duplicated components -- one "
            "switch, one power feed, one storage array, one provider.",
            "Ask whether the survivors could carry the load, using the "
            "(n-1)/n rule.",
            "Ask what the system does while a component is being replaced, "
            "which is where fail-soft and fail-safe become relevant.",
            "Only then consider performance, because an unavailable system's "
            "response time is not a meaningful quantity.",
        ]),
        desc(
            "Step three catches the most items. A diagram showing two of "
            "everything is drawn to look redundant, and the question is "
            "almost always about the one component the duplication converges "
            "on -- which is drawn once, in the middle, and easy to read past."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where configuration items are lost."),
        ul([
            "Treating redundancy and capacity as the same thing. A hot "
            "standby adds no capacity at all.",
            "Sizing a cluster so that the survivors cannot carry the load "
            "after a failure.",
            "Building a cluster with an even number of nodes, so no majority "
            "exists and split brain becomes possible.",
            "Overlooking that shared storage under a cluster is a single "
            "point of failure.",
            "Placing both members of a redundant pair on the same physical "
            "host.",
            "Choosing hot standby when the business tolerates an hour's "
            "outage, or cold standby when it does not.",
            "Assuming containers isolate as strongly as virtual machines. "
            "They share a kernel.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A service runs on a four-node cluster, each node at 70% "
            "utilisation. Can it survive the loss of one node without "
            "degradation, and what if utilisation were 80%?\""
        ),
        ol([
            "Compute the total load: 4 nodes x 70% = 280% of one node's "
            "capacity.",
            "After losing one, three nodes remain, offering 300%.",
            "280% of load on 300% of capacity is about 93% utilisation each "
            "-- high, but the service continues.",
            "At 80%: total load is 320%, and three nodes offer 300%. The "
            "load exceeds the surviving capacity, so the service degrades or "
            "fails regardless of the redundancy being present.",
            "The general rule: with n nodes, each may run at no more than "
            "(n-1)/n of capacity to survive one loss. For four nodes that is "
            "75%.",
        ]),
        desc(
            "That final formula is worth carrying, because it converts a "
            "vague instinct about headroom into a number. It also shows why "
            "larger clusters are more efficient: eight nodes may each run at "
            "87.5%, and two nodes may each run at only 50% -- so a redundant "
            "PAIR wastes half its capacity by construction."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("System configuration is where several later topics originate."),
        ul([
            "Availability arithmetic is the next lesson and returns as "
            "service level targets in Service Management.",
            "Clustering and failover are the technical basis of business "
            "continuity planning.",
            "Load balancing reappears in Network as a service and in System "
            "Strategy as a cloud capability.",
            "Virtualisation reappears in Software, in Solution Business as "
            "cloud infrastructure, and in Facility Management as "
            "consolidation.",
            "Batch against online processing is a recurring decision in "
            "System Development Technology.",
            "Split brain and quorum are the distributed-consensus problem "
            "that reappears in Database as replication.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Redundancy against capacity",
              "A hot standby adds availability, not throughput",
              "The spare does nothing until the primary fails. A load-sharing "
              "cluster adds both, if it is sized for the failure."),
             ("Maximum utilisation to survive one node loss",
              "(n-1)/n of capacity per node",
              "Four nodes may run at 75%, eight at 87.5%, and a redundant "
              "pair at only 50%."),
             ("Split brain",
              "Both nodes believe the other has died",
              "Each acts as primary and they write conflicting data. "
              "Prevented by requiring a quorum, which is why node counts are "
              "odd."),
             ("Hot, warm and cold standby",
              "Seconds, minutes, hours to switch over",
              "The choice follows from the acceptable outage, not from "
              "preference."),
             ("Dual system",
              "Two machines doing the same work, results compared",
              "A disagreement reveals a fault immediately. The most expensive "
              "arrangement, for safety-critical work."),
             ("Containers against virtual machines",
              "Shared kernel against separate kernels",
              "Containers start in milliseconds and isolate less. The choice "
              "is about how much you trust what runs inside.")]),
    ]),
]

_config_quiz = [
    mcq("EASY",
        "In which configuration does a second machine remain powered and "
        "synchronised, ready to take over within seconds?",
        [("Cold standby", False),
         ("Hot standby", True),
         ("Batch processing", False),
         ("Thin client", False)],
        "Hot standby keeps the spare running and current, so switchover takes "
        "seconds at most -- and it is the most expensive arrangement, because "
        "a full duplicate is maintained while contributing no capacity. Cold "
        "standby leaves the spare powered off, giving a switchover measured "
        "in hours. Batch processing and thin client describe how work arrives "
        "and where it runs, not how a spare is held."),

    mcq("HARD",
        "A service runs across four nodes, each at 80% utilisation.\n\n"
        "What happens if one node fails?",
        [("The remaining nodes absorb the load, each rising to about 93%",
          False),
         ("The offered load exceeds the surviving capacity, so the service "
          "degrades", True),
         ("The load balancer prevents overload by queueing requests "
          "indefinitely", False),
         ("Nothing changes, since each node was operating below capacity",
          False)],
        "Total load is 4 x 80% = 320% of one node's capacity, while three "
        "surviving nodes offer only 300%. The load simply does not fit, so "
        "the service degrades or fails despite the redundancy existing. To "
        "survive one loss, each of n nodes must run at no more than (n-1)/n "
        "of capacity -- 75% for four nodes. Queueing does not create "
        "capacity; it converts overload into unbounded delay."),

    mcq("AVERAGE",
        "Network connectivity between two cluster nodes is lost while both "
        "continue running, and each concludes the other has failed.\n\n"
        "What is this condition called, and how is it prevented?",
        [("Thrashing, prevented by increasing memory", False),
         ("Split brain, prevented by requiring a quorum", True),
         ("Cascading failure, prevented by rate limiting", False),
         ("Starvation, prevented by priority ageing", False)],
        "Split brain is two nodes both acting as primary, which lets each "
        "accept writes the other does not see and produces conflicting data "
        "that must later be reconciled by hand. Requiring a majority -- a "
        "quorum -- before a node may act means the minority side stands down, "
        "which is why clusters are built with an odd number of members. "
        "Thrashing is a paging condition and starvation is a scheduling one."),

    mcq("AVERAGE",
        "Which characteristic distinguishes a dual system from a duplex "
        "system?",
        [("A dual system uses different hardware for each machine", False),
         ("In a dual system both machines process the same work and results "
          "are compared", True),
         ("A duplex system requires the two machines to be in different "
          "locations", False),
         ("A dual system shares one processor between two operating "
          "systems", False)],
        "A dual system runs the same work on both machines and compares the "
        "results, so a disagreement reveals a fault immediately rather than "
        "letting a wrong answer through -- which is why it appears in "
        "safety-critical settings and why it is the most expensive "
        "arrangement. A duplex system has a primary and a standby that can "
        "swap roles, with the standby often doing lower-priority work "
        "meanwhile."),

    mcq("AVERAGE",
        "Payroll is processed once a fortnight, with all records handled "
        "together overnight and no user awaiting an individual result.\n\n"
        "Which processing mode is this?",
        [("Online transaction processing", False),
         ("Batch processing", True),
         ("Real-time processing", False),
         ("Time sharing", False)],
        "Work accumulated and processed as a group, with no user waiting, is "
        "batch processing -- and it survives because it is efficient: setup "
        "costs are amortised across many records and the work can be "
        "scheduled when capacity is cheap. Online processing handles "
        "transactions individually as they are submitted, real-time carries a "
        "deadline that is part of correctness, and time sharing divides a "
        "machine among concurrent users."),

    mcq("HARD",
        "Both members of a redundant pair of virtual machines are found to be "
        "running on the same physical host.\n\n"
        "What is the consequence?",
        [("Performance improves, since the two can communicate locally",
          False),
         ("The redundancy is defeated by any failure of that host", True),
         ("The hypervisor automatically migrates one of them elsewhere",
          False),
         ("Nothing, provided the host has sufficient capacity for both",
          False)],
        "The pair exists so that one failure does not take out the service, "
        "and placing both on one host reintroduces exactly the single point "
        "of failure the redundancy was meant to remove -- a host failure ends "
        "both. Anti-affinity rules exist to prevent precisely this, and they "
        "are needed because a hypervisor placing machines by available "
        "capacity has no idea the two are meant to be independent."),

    mcq("AVERAGE",
        "Business logic is placed in a middle tier, separate from the "
        "presentation layer and from the database.\n\n"
        "What is the principal benefit?",
        [("The database can be replaced without changing the clients", False),
         ("Logic changes are deployed in one place rather than to every "
          "client", True),
         ("Network traffic between client and server is eliminated", False),
         ("The presentation layer no longer requires a network "
          "connection", False)],
        "In a two-tier arrangement the business logic lives on client "
        "machines, so every rule change must be deployed to all of them -- "
        "which is the dominant maintenance cost of that architecture. Moving "
        "logic to a middle tier means one deployment, and it lets each tier "
        "be scaled independently. Network traffic is not eliminated; if "
        "anything the three-tier arrangement adds a hop."),

    mcq("AVERAGE",
        "Containers and virtual machines both allow several workloads to "
        "share one physical machine.\n\n"
        "What is the essential difference?",
        [("Containers share the host's kernel; virtual machines each run "
          "their own", True),
         ("Containers can only run one process, while virtual machines run "
          "many", False),
         ("Virtual machines cannot be migrated between physical hosts", False),
         ("Containers provide stronger isolation than virtual machines",
          False)],
        "A container virtualises the operating system's view of itself while "
        "sharing the host kernel, which is why it starts in milliseconds and "
        "carries almost no overhead. A virtual machine virtualises the whole "
        "machine and runs a separate kernel, which is heavier and isolates "
        "more strongly -- the reverse of the last option. Live migration is a "
        "standard virtual machine capability rather than an impossibility."),

    mcq("HARD",
        "A cluster's heartbeat timeout is set very short so that failures are "
        "detected quickly.\n\n"
        "What risk does this introduce?",
        [("Failed nodes will not be detected at all", False),
         ("A momentarily busy or slow node will be wrongly evicted", True),
         ("The quorum requirement can no longer be satisfied", False),
         ("Requests will be queued rather than distributed", False)],
        "A heartbeat timeout is a judgement about how long silence must last "
        "before a node is declared dead. Too short, and a node that is merely "
        "busy, garbage collecting or briefly delayed by the network is "
        "evicted needlessly -- which removes working capacity and, under "
        "load, can cascade as the remaining nodes are overwhelmed and "
        "themselves time out. Too long, and requests are sent to a node that "
        "is genuinely gone."),

    mcq("EASY",
        "Consolidating many underused servers onto fewer physical machines "
        "through virtualisation delivers which benefit set?",
        [("Reduced hardware, power and cooling costs", True),
         ("Stronger isolation between the workloads than physical separation "
          "gives", False),
         ("Elimination of the need for redundancy", False),
         ("Guaranteed improvement in each workload's response time", False)],
        "Most servers use a small fraction of their capacity, so running them "
        "as virtual machines on fewer hosts cuts the hardware bought and the "
        "power and cooling it consumes -- which is the green computing "
        "argument arriving from the architecture side. Physical separation "
        "isolates more strongly than any hypervisor, redundancy is still "
        "required, and sharing a host can worsen response times through "
        "contention."),
]

LESSON_CONFIG = lesson(
    MAJOR, MIDDLE,
    "System Configuration: Redundancy, Clustering and Processing Modes",
    _config_quiz,
    lesson_structure(
        "System Configuration: Redundancy, Clustering and Processing Modes",
        "A single machine can only be made so fast, and when it stops "
        "everything stops. This lesson covers the arrangements that answer "
        "those two problems and the constant confusion between them -- "
        "redundancy buys availability and capacity buys performance, and a "
        "hot standby delivers only the first. It works through standby "
        "configurations and what each costs, what a cluster must actually "
        "solve including the sizing rule people omit, the processing modes "
        "the syllabus names, where work sits between client and server, and "
        "how virtualisation changes every one of those arguments.",
        [
            "Distinguish redundancy from capacity and say which a "
            "configuration delivers",
            "Compare hot, warm and cold standby, and dual against duplex "
            "systems",
            "Explain what a cluster must solve, including quorum and split "
            "brain",
            "Compute the utilisation ceiling that lets a cluster survive one "
            "node loss",
            "Identify the processing mode a described workload uses",
            "Compare centralised, client-server, three-tier and thin-client "
            "architectures",
            "Compare containers with virtual machines and state the "
            "availability consequence of consolidation",
        ],
        65,
        _config_sections,
        [
            ("Availability",
             "The fraction of time a service is usable. Bought with "
             "redundancy -- a spare that can take over."),
            ("Hot standby",
             "A spare kept running and synchronised, switching over in "
             "seconds. The most expensive, and it contributes no capacity."),
            ("Cold standby",
             "A spare powered off or unconfigured, taking hours to bring into "
             "service. Cheapest, and appropriate only where a long outage is "
             "tolerable."),
            ("Dual system",
             "Two machines processing the same work with results compared, so "
             "a disagreement reveals a fault immediately. Used where a wrong "
             "answer is unacceptable."),
            ("Duplex system",
             "A primary and a standby able to swap roles, with the standby "
             "often doing lower-priority work that is abandoned on "
             "failover."),
            ("Cluster",
             "Several machines presenting as one service, all doing real "
             "work. Must solve distribution, failure detection, quorum and "
             "shared state."),
            ("Split brain",
             "Two nodes each believing the other has failed, so both act as "
             "primary and write conflicting data. Prevented by requiring a "
             "quorum, which is why node counts are odd."),
            ("Quorum",
             "A majority of members, required before a node may act. The "
             "minority side stands down."),
            ("Cluster sizing rule",
             "To survive the loss of one of n nodes, each may run at no more "
             "than (n-1)/n of capacity: 75% for four nodes, 50% for a pair."),
            ("Batch processing",
             "Work accumulated and processed as a group with no user waiting. "
             "Efficient because setup costs amortise and it can run when "
             "capacity is cheap."),
            ("Online (interactive) processing",
             "Transactions handled individually as submitted, sized for the "
             "peak because a person is waiting."),
            ("Three-tier architecture",
             "Presentation, business logic and data separated, so logic "
             "changes deploy in one place and each tier scales "
             "independently."),
            ("Thin client",
             "A client that renders and accepts input only, returning "
             "management and security to the centre at the cost of total "
             "network dependence."),
            ("Virtualisation",
             "Presenting one physical machine as several, each with its own "
             "operating system. Enables consolidation and makes a failed "
             "machine far easier to replace."),
            ("Container",
             "Virtualisation of the operating system's view of itself, "
             "sharing the host kernel. Starts in milliseconds and isolates "
             "less strongly than a virtual machine."),
            ("Anti-affinity rule",
             "A placement constraint keeping the members of a redundant pair "
             "on different physical hosts, so one host failure cannot end "
             "both."),
        ],
        "Multiple machines answer two different problems and the confusion "
        "between them costs marks and outages alike: redundancy buys "
        "availability, capacity buys performance, and a hot standby delivers "
        "the first while adding nothing to the second. Standby arrangements "
        "run from hot through warm to cold, switching over in seconds, "
        "minutes or hours, and the right choice follows from the outage the "
        "business tolerates rather than from preference -- with dual systems "
        "comparing two machines' results where a wrong answer is "
        "unacceptable. A cluster puts every node to work, and must solve "
        "distribution, failure detection, shared state, and the quorum that "
        "prevents split brain -- which is why node counts are odd. It must "
        "also be SIZED for failure: with n nodes each may run at no more than "
        "(n-1)/n of capacity, so four nodes cap at 75% and a redundant pair "
        "wastes half its capacity by construction. Redundancy that cannot "
        "carry the load after a failure merely turns one failure into a "
        "cascade. Above that sit the processing modes -- batch trading "
        "immediacy for efficiency, online trading capacity for response -- "
        "and the client-server pendulum, which has swung with whichever cost "
        "dominated rather than towards any correct answer. And virtualisation "
        "changes all of it twice over: it makes a failed machine replaceable "
        "in minutes, and it puts many services on one host, which is why "
        "anti-affinity rules exist.",
        exam_notes=[
            desc(
                "Configuration items on Subject A are scenario-based: a "
                "described arrangement to name, or a capacity judgement to "
                "make."
            ),
            ul([
                "Naming a standby arrangement from its switchover time.",
                "Judging whether a cluster survives a node loss at a stated "
                "utilisation.",
                "Identifying split brain and naming quorum as the remedy.",
                "Distinguishing dual from duplex systems.",
                "Classifying a workload's processing mode.",
                "Comparing containers with virtual machines.",
                "Spotting a redundant pair placed on one physical host.",
            ]),
            desc(
                "The single most productive habit here is to ask, of any "
                "described redundancy, whether the survivors could actually "
                "carry the load. That question is what most of these items "
                "are really testing, and (n-1)/n answers it in one step."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: System evaluation indexes
# ==========================================================================

_eval_sections = [
    ("Measuring a System Rather Than Guessing", [
        desc(
            "'The system is slow' and 'the system is unreliable' are "
            "complaints, not measurements. This lesson supplies the figures "
            "that turn them into something that can be compared, targeted and "
            "contracted for -- which is why the same formulas reappear in "
            "Service Management as service level agreements."
        ),
        table(
            ["Question", "The index that answers it"],
            [["How much work does it get through?", "Throughput"],
             ["How long does one piece of work take?",
              "Response time or turnaround time"],
             ["How often does it break?", "MTBF, and failure rate"],
             ["How long is it broken for?", "MTTR"],
             ["What fraction of the time is it usable?", "Availability"],
             ["Is it worth what it costs?",
              "Total cost of ownership, and cost-benefit"]],
            caption="Six questions and the index each one asks for.",
            footer="Note that the first two are performance and the next "
                   "three are reliability. Conflating them is the most common "
                   "error on this material -- a system can be fast and "
                   "unreliable, or slow and never fail."),
    ]),

    ("Performance Indexes", [
        desc(
            "Two measures, and they are not interchangeable -- improving one "
            "can worsen the other, which is exactly what makes the "
            "distinction worth drawing."
        ),
        compare_grid(
            "THROUGHPUT AND RESPONSE TIME",
            "One is about the system's total output; the other is about one "
            "user's experience.",
            [("Throughput",
              "Work completed per unit time -- transactions per second, jobs "
              "per hour. What capacity planning is about, and what batching "
              "improves."),
             ("Response time",
              "The interval from submitting a request to receiving the "
              "answer. What a waiting user experiences, and what batching "
              "makes worse."),
             ("Turnaround time",
              "The interval from submitting a JOB to its completion, used for "
              "batch work where no one waits interactively."),
             ("Why they conflict",
              "Batching raises throughput by amortising overhead across many "
              "items, and raises response time because each item waits for "
              "the batch. It is the same trade a queue makes.")]),
        desc(
            "The syllabus's benchmark vocabulary belongs here too. A "
            "BENCHMARK measures a fixed workload so systems can be compared, "
            "and its value depends entirely on how closely that workload "
            "resembles yours. MONITORING measures the real system in "
            "production, which is the only honest answer and the one that "
            "costs effort to obtain."
        ),
    ]),

    ("Reliability Indexes", [
        desc(
            "Three figures, and the relationships between them are simple "
            "enough to be examined directly."
        ),
        image(fig("availability-timeline")),
        table(
            ["Index", "Means", "Computed as"],
            [["MTBF", "Mean time BETWEEN failures",
              "Total operating time / number of failures"],
             ["MTTR", "Mean time TO repair",
              "Total repair time / number of repairs"],
             ["Availability", "Fraction of time usable",
              "MTBF / (MTBF + MTTR)"],
             ["Failure rate", "Failures per unit time", "1 / MTBF"]],
            caption="The reliability indexes and how each is obtained.",
            footer="MTBF measures RELIABILITY -- how long it runs before "
                   "failing. Availability measures USABILITY -- what fraction "
                   "of the time it works. A system can have poor MTBF and "
                   "excellent availability, if it recovers instantly."),
        desc(
            "That final observation is the one worth understanding rather "
            "than memorising, and it drives real engineering decisions. There "
            "are two ways to raise availability: fail less often, which means "
            "raising MTBF, or recover faster, which means lowering MTTR. "
            "Chasing the last few failures is usually expensive and "
            "uncertain; automating recovery is usually cheaper and more "
            "predictable -- which is why modern systems invest so heavily in "
            "failover and so much less in perfect components."
        ),
    ]),

    ("Working the Availability Formula", [
        desc(
            "The calculation appears on Subject A most sittings, and it is "
            "arithmetic once the two figures are identified correctly."
        ),
        ol([
            "A system runs 480 hours between failures and takes 4 hours to "
            "repair. MTBF = 480, MTTR = 4.",
            "Availability = MTBF / (MTBF + MTTR) = 480 / 484.",
            "That is 0.99174, or about 99.17%.",
            "Now halve the repair time to 2 hours: 480 / 482 = 0.99585, about "
            "99.59%.",
            "Halving MTTR halved the downtime, without touching the failure "
            "rate at all.",
        ]),
        desc(
            "It is worth seeing what those percentages mean in time, because "
            "the numbers are less reassuring than they look. Over a year, "
            "99% availability permits about 3.65 days of downtime; 99.9% "
            "permits about 8.8 hours; 99.99% permits about 53 minutes; and "
            "99.999% -- 'five nines' -- permits about 5 minutes."
        ),
        table(
            ["Availability", "Downtime per year", "Downtime per month"],
            [["99%", "About 3.65 days", "About 7.3 hours"],
             ["99.9%", "About 8.8 hours", "About 44 minutes"],
             ["99.99%", "About 53 minutes", "About 4.4 minutes"],
             ["99.999%", "About 5.3 minutes", "About 26 seconds"]],
            caption="What each availability target actually permits.",
            footer="Each additional nine costs roughly ten times as much and "
                   "removes nine tenths of the remaining downtime, which is "
                   "why the right target is a business decision rather than "
                   "an engineering aspiration."),
    ]),

    ("Combining Components", [
        desc(
            "A system is built from parts, and its reliability follows from "
            "theirs -- by two rules that are the probability theory of the "
            "Applied Mathematics lesson applied directly."
        ),
        content_accordion(
            "SERIES AND PARALLEL",
            "The distinction is whether the system needs ALL the components "
            "or ANY of them.",
            [("Components in series -- all must work",
              "System availability is the PRODUCT of the components'. Three "
              "components each 99% available give 0.99 x 0.99 x 0.99 = "
              "0.9703, about 97%. Reliability falls as components are added, "
              "which is why a long dependency chain is fragile however good "
              "each link is."),
             ("Components in parallel -- any one suffices",
              "The system fails only if ALL fail, so compute the probability "
              "of that and subtract from 1. Two components each 99% available "
              "give 1 - (0.01 x 0.01) = 0.9999, about 99.99%. Redundancy "
              "turns two nines into four."),
             ("Why the parallel figure is optimistic",
              "It assumes the failures are INDEPENDENT, and they often are "
              "not: shared power, a shared network, a shared bug, or a shared "
              "operator error takes out both. This is the same independence "
              "trap the Applied Mathematics lesson identified for mirrored "
              "disks, and it is why real availability falls short of the "
              "arithmetic."),
             ("Combining the two",
              "Real systems are series chains of parallel groups. Compute "
              "each redundant group's availability first, then multiply the "
              "groups together -- and the weakest non-redundant link "
              "dominates the result.")]),
    ]),

    ("Economic Indexes", [
        desc(
            "The syllabus expects the cost side too, because a technically "
            "superior system that cannot be justified is not the right "
            "answer."
        ),
        table(
            ["Index", "What it covers"],
            [["Initial cost", "Purchase, licences, installation, migration"],
             ["Running cost", "Power, cooling, space, support, licences, "
                              "staff"],
             ["Total cost of ownership", "Both, across the system's whole "
                                         "life"],
             ["Return on investment", "The benefit obtained relative to the "
                                      "cost"],
             ["Cost-benefit analysis", "Whether the benefits justify the "
                                       "costs at all"]],
            caption="The economic indexes the syllabus names.",
            footer="Total cost of ownership is the one that changes "
                   "decisions. Running costs usually exceed the purchase "
                   "price over a system's life, so comparing purchase prices "
                   "alone reliably picks the wrong option."),
        desc(
            "The examination's favourite scenario is a cheaper system with "
            "higher running costs, and the correct approach is always the "
            "same: sum both over the stated life and compare the totals. A "
            "system costing half as much to buy and twice as much to run is "
            "more expensive within a few years, and the calculation says "
            "exactly when."
        ),
    ]),

    ("Capacity Planning", [
        desc(
            "Evaluation indexes exist to support a decision, and the decision "
            "is usually how much capacity to provide. The method follows from "
            "everything above."
        ),
        ol([
            "Measure the current load and the current utilisation, rather "
            "than estimating them.",
            "Establish the growth rate from history, not from optimism.",
            "Identify which resource saturates first -- processor, memory, "
            "disk, network or a bus. Only that one matters.",
            "Apply the queueing result: response time rises sharply well "
            "before utilisation reaches 100%, so plan to a target well below "
            "it.",
            "Leave headroom for failure as the previous lesson's (n-1)/n rule "
            "requires.",
            "Re-measure after the change, because the bottleneck usually "
            "moves rather than disappearing.",
        ]),
        desc(
            "Step six is the one experience teaches and plans omit. Relieving "
            "the processor bottleneck does not make a system infinitely "
            "faster; it makes the disk the bottleneck. Capacity planning is "
            "therefore iterative, and a plan that predicts a single upgrade "
            "will deliver a proportional improvement has almost certainly not "
            "identified the constraint correctly."
        ),
    ]),

    ("Benchmarks and Their Limits", [
        desc(
            "A benchmark runs a fixed workload so that two systems can be "
            "compared on the same terms. The syllabus names the idea and "
            "expects you to know what it is and is not evidence of."
        ),
        compare_grid(
            "WHAT A BENCHMARK CAN AND CANNOT TELL YOU",
            "The value of a proxy depends entirely on how closely it "
            "resembles the thing it stands for.",
            [("What it establishes",
              "A comparable figure across systems, measured under stated and "
              "repeatable conditions. Useful for eliminating options that are "
              "clearly unsuitable."),
             ("What it does not establish",
              "How YOUR workload will perform, unless it resembles the "
              "benchmark. A system optimised for the benchmark may do "
              "noticeably worse on anything else."),
             ("Why vendors quote them",
              "Because the figure is comparable and favourable, and because a "
              "system can be tuned specifically for a well-known benchmark -- "
              "which is a real and documented practice."),
             ("What to do instead",
              "Run a workload of your own on a trial system where the "
              "decision justifies it. Expensive, and the only measurement "
              "that answers the actual question.")]),
        desc(
            "The recurring examination point is that a benchmark figure "
            "quoted WITHOUT its conditions is not evidence at all. The same "
            "system measured with a warm cache and a cold one, or loaded and "
            "idle, produces numbers differing by more than the gap between "
            "competing products."
        ),
    ]),

    ("Utilisation and What It Hides", [
        desc(
            "Utilisation is the fraction of time a resource is busy, and it "
            "is the most reported and most misread figure in system "
            "evaluation."
        ),
        table(
            ["Reading", "What people conclude", "What it may actually mean"],
            [["CPU at 20%", "Plenty of headroom",
              "The system may be I/O bound and the processors idle waiting"],
             ["CPU at 95%", "Fully utilised, efficient",
              "Queueing is severe; response time is already poor"],
             ["Disk at 100%", "The disk is the bottleneck",
              "Often true, and worth confirming against queue depth"],
             ["Memory at 90%", "Nearly out of memory",
              "Often just cache; free memory is wasted memory"],
             ["Network at 40%", "Fine",
              "Bursts may saturate it briefly while the average looks calm"]],
            caption="Five utilisation readings and how each misleads.",
            footer="An average hides a burst, and a resource at 20% can still "
                   "be the constraint if everything is waiting on it. "
                   "Utilisation is where an investigation starts, not where "
                   "it ends."),
        desc(
            "The last row deserves emphasis because it recurs. A figure "
            "averaged over five minutes tells you almost nothing about a "
            "system whose load arrives in one-second bursts, and users "
            "experience the bursts rather than the average. This is the same "
            "point the Applied Mathematics lesson made about response-time "
            "medians: a summary statistic chosen carelessly can conceal "
            "exactly the behaviour being investigated."
        ),
    ]),

    ("Reliability Beyond the Mean", [
        desc(
            "MTBF is a mean, and a mean says nothing about how failures are "
            "distributed. Two systems with identical MTBF can behave very "
            "differently, which the syllabus captures through the failure "
            "pattern over a system's life."
        ),
        content_accordion(
            "THE BATHTUB CURVE",
            "Failure rate is not constant: it is high at first, low in the "
            "middle, and rises again at the end. Each phase has a different "
            "cause and a different response.",
            [("Early failures (infant mortality)",
              "A high initial rate from manufacturing defects and "
              "installation errors. Addressed by burn-in testing before "
              "delivery, and by a warranty period -- which is why equipment "
              "that survives its first weeks is likely to last."),
             ("Random failures (useful life)",
              "A low, roughly constant rate from chance events. This is the "
              "period MTBF actually describes, and the only one in which "
              "treating the failure rate as constant is reasonable."),
             ("Wear-out failures",
              "A rising rate as components reach the end of their physical "
              "life -- bearings, fans, batteries, flash cells. Addressed by "
              "planned replacement BEFORE the rise, which is why equipment is "
              "retired on a schedule rather than run to failure."),
             ("Why this matters for a quoted MTBF",
              "A manufacturer's MTBF figure describes the flat middle of the "
              "curve. Applying it to equipment well past its design life "
              "predicts a reliability the hardware no longer has, which is a "
              "genuine and common planning error.")]),
    ]),

    ("Choosing What to Measure", [
        desc(
            "An index that is easy to collect and irrelevant to the decision "
            "is worse than no index, because it creates confidence without "
            "information."
        ),
        ul([
            "Measure what the USER experiences where you can. Server-side "
            "response time excludes the network and the browser, which is "
            "often most of what the user waits through.",
            "Prefer PERCENTILES to averages for anything a person waits for. "
            "A mean response time is dominated by the fast majority and hides "
            "the slow tail that generates complaints.",
            "Measure over a period that includes the PEAK, since capacity "
            "must serve the peak rather than the average.",
            "Record the CONDITIONS alongside the figure -- load, "
            "configuration, what else was running -- because a measurement "
            "without them cannot be compared with another.",
            "Prefer a small number of indexes that drive decisions to a large "
            "dashboard nobody reads.",
        ]),
        desc(
            "The general principle is that a measurement exists to support a "
            "decision. Before collecting an index, it is worth being able to "
            "say what you would do differently depending on its value -- and "
            "if there is no such answer, the index is decoration."
        ),
    ]),

    ("Reliability of the Whole Service", [
        desc(
            "The indexes above describe components and systems. A user "
            "experiences a SERVICE, which usually depends on many systems "
            "plus a network, plus people -- and its availability is worse "
            "than any single figure suggests."
        ),
        ol([
            "List everything the user's request depends on: client, network, "
            "load balancer, application servers, database, authentication, "
            "and any external service called during the request.",
            "That list is a SERIES chain, so multiply the availabilities.",
            "Six components each at 99.9% give 0.999 to the sixth power, "
            "about 99.4% -- which permits roughly 52 hours of annual downtime "
            "rather than the 8.8 that 99.9% suggests.",
            "Add the human element: detection time, escalation, and the "
            "decision to act are all part of MTTR and are frequently longer "
            "than the technical repair.",
        ]),
        desc(
            "The two conclusions this produces are the practical ones. First, "
            "a service-level target must be set on the SERVICE and then "
            "apportioned to components, rather than the reverse -- each "
            "component needs to be considerably better than the target. "
            "Second, since detection and escalation dominate MTTR in most "
            "organisations, monitoring and alerting improve availability more "
            "than better hardware does."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where evaluation items are lost."),
        ul([
            "Confusing MTBF with availability. One is how long it runs, the "
            "other what fraction of time it works.",
            "Reading MTBF as 'mean time before failure'. It is BETWEEN "
            "failures, which is why repair time is excluded from it.",
            "Computing series availability by averaging rather than "
            "multiplying.",
            "Assuming redundant components fail independently when they share "
            "power, network or software.",
            "Comparing systems on purchase price rather than total cost of "
            "ownership.",
            "Planning capacity to 100% utilisation, where queueing theory "
            "says response time is already unbounded.",
            "Expecting one upgrade to give a proportional improvement, when "
            "the bottleneck simply moves.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A system comprises three components in series with "
            "availabilities of 0.99, 0.98 and 0.995. A fourth component, "
            "0.97, is added in parallel with an identical unit. What is the "
            "overall availability?\""
        ),
        ol([
            "Handle the parallel pair first. It fails only if both fail: "
            "0.03 x 0.03 = 0.0009, so its availability is 1 - 0.0009 = "
            "0.9991.",
            "Now every group is in series, so multiply: 0.99 x 0.98 x 0.995 x "
            "0.9991.",
            "0.99 x 0.98 = 0.9702. Times 0.995 = 0.96535. Times 0.9991 = "
            "0.96448.",
            "So overall availability is about 96.4%.",
            "Note that the redundant pair contributes almost nothing to the "
            "loss -- 0.9991 is nearly 1 -- while the 0.98 component alone "
            "costs two percentage points.",
        ]),
        desc(
            "Step five is the engineering insight the arithmetic delivers. "
            "Adding redundancy to a component that is already 97% available "
            "improved the system by a fraction of a percent, while the "
            "unredundant 98% component remains the dominant loss. Redundancy "
            "is worth adding to the WEAKEST non-redundant link, and spending "
            "it anywhere else is expensive decoration."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("These indexes are used in four later majors."),
        ul([
            "Availability targets become service level agreements in Service "
            "Management.",
            "MTTR is what incident management exists to reduce.",
            "Series and parallel availability is the probability theory of "
            "Applied Mathematics applied.",
            "The utilisation ceiling comes from the same lesson's queueing "
            "result.",
            "Total cost of ownership drives Computerisation Planning and "
            "procurement decisions.",
            "Capacity planning reappears in Service Design and in "
            "performance testing.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results the examination expects immediately.",
            [("Availability",
              "MTBF / (MTBF + MTTR)",
              "Two ways to raise it: fail less often, or recover faster. "
              "Recovering faster is usually the cheaper of the two."),
             ("What MTBF actually stands for",
              "Mean time BETWEEN failures",
              "Not 'before'. Repair time is excluded, which is why "
              "availability needs MTTR as a separate term."),
             ("Availability of components in series",
              "The product of their availabilities",
              "Three components at 99% give 97%, so a long dependency chain "
              "is fragile however good each link is."),
             ("Availability of components in parallel",
              "1 minus the product of their unavailabilities",
              "Two at 99% give 99.99% -- if the failures are independent, "
              "which shared power and shared software break."),
             ("Downtime permitted by 99.9%",
              "About 8.8 hours a year",
              "99% permits 3.65 days, 99.99% about 53 minutes, and five nines "
              "about 5 minutes."),
             ("Where redundancy is worth adding",
              "To the weakest non-redundant link",
              "Adding it elsewhere improves the total by a fraction of a "
              "percent while the weak link still dominates.")]),
    ]),
]

_eval_quiz = [
    mcq("AVERAGE",
        "A system operates for 480 hours between failures and requires 4 "
        "hours to repair.\n\n"
        "What is its availability?",
        [("About 99.17%", True),
         ("About 99.99%", False),
         ("About 0.83%", False),
         ("About 92.00%", False)],
        "Availability is MTBF / (MTBF + MTTR) = 480 / 484 = 0.99174, about "
        "99.17%. The value 0.83% is the UNAVAILABILITY, 4 / 484, which is the "
        "complement. Note that halving the repair time to two hours would "
        "give 480 / 482 = 99.59% -- halving the downtime without reducing the "
        "failure rate at all, which is why lowering MTTR is usually cheaper "
        "than raising MTBF."),

    mcq("AVERAGE",
        "Three components are connected in series, each with an availability "
        "of 0.99.\n\n"
        "What is the availability of the whole system?",
        [("0.99", False),
         ("About 0.970", True),
         ("About 0.999", False),
         ("About 0.333", False)],
        "In series every component must work, so the system's availability is "
        "the product: 0.99 x 0.99 x 0.99 = 0.970299, about 97%. Availability "
        "therefore FALLS as components are added, which is why a long "
        "dependency chain is fragile however good each link is. Answering "
        "0.99 averages rather than multiplies, and 0.999 would be the result "
        "for components in parallel."),

    mcq("HARD",
        "Two components, each 99% available, are placed in parallel so that "
        "either alone can carry the service.\n\n"
        "What is the theoretical availability, and what most threatens it in "
        "practice?",
        [("99.99%, threatened by correlated failures with a shared cause",
          True),
         ("99.99%, threatened by the added complexity of the load balancer",
          False),
         ("98.01%, threatened by the components failing at different times",
          False),
         ("99.00%, threatened by the components being identical models",
          False)],
        "The pair fails only if both fail, so availability is 1 - (0.01 x "
        "0.01) = 0.9999. That arithmetic assumes the failures are "
        "INDEPENDENT, and a shared power supply, shared network, shared "
        "software defect or shared operator error takes out both at once -- "
        "which is why measured availability of redundant pairs falls short of "
        "the calculation. The value 98.01% is the SERIES result, which would "
        "apply if both were required."),

    mcq("EASY",
        "What does MTBF stand for, and what does it exclude?",
        [("Mean time before failure, excluding scheduled maintenance", False),
         ("Mean time between failures, excluding repair time", True),
         ("Maximum time between faults, excluding minor incidents", False),
         ("Mean time between faults, excluding the first failure", False)],
        "MTBF is the mean time BETWEEN failures -- the operating interval "
        "from one failure to the next, which does not include the time spent "
        "repairing. That exclusion is precisely why availability needs MTTR "
        "as a separate term: MTBF alone says how long the system runs, and "
        "says nothing about how long it is down when it stops."),

    mcq("AVERAGE",
        "A service level agreement specifies 99.9% availability.\n\n"
        "Approximately how much downtime does this permit per year?",
        [("About 3.65 days", False),
         ("About 8.8 hours", True),
         ("About 53 minutes", False),
         ("About 5 minutes", False)],
        "A year is about 8,760 hours, and 0.1% of that is roughly 8.8 hours. "
        "The other options are the neighbouring targets: 99% permits about "
        "3.65 days, 99.99% about 53 minutes and 99.999% about 5 minutes. Each "
        "additional nine removes nine tenths of the remaining downtime and "
        "costs roughly ten times as much, which is why the target is a "
        "business decision rather than an engineering aspiration."),

    mcq("HARD",
        "System A costs 100,000 to purchase and 40,000 a year to run. System "
        "B costs 160,000 to purchase and 20,000 a year to run.\n\n"
        "Over a five-year life, which is cheaper and by how much?",
        [("System A, by 60,000", False),
         ("System B, by 40,000", True),
         ("System A, by 20,000", False),
         ("They cost the same over five years", False)],
        "System A totals 100,000 + (5 x 40,000) = 300,000. System B totals "
        "160,000 + (5 x 20,000) = 260,000. System B is cheaper by 40,000 "
        "despite costing 60% more to buy, and the break-even falls at three "
        "years. This is why total cost of ownership rather than purchase "
        "price is the basis for comparison -- running costs usually exceed "
        "the purchase price over a system's life."),

    mcq("AVERAGE",
        "Batching transactions rather than processing each one as it arrives "
        "raises throughput.\n\n"
        "What is the effect on response time?",
        [("It improves, since the system does less work overall", False),
         ("It worsens, since each item waits for its batch", True),
         ("It is unaffected, since the two measure different things", False),
         ("It improves for small batches and worsens for large ones", False)],
        "Batching amortises setup costs across many items, so more work "
        "completes per unit time -- and each individual item now waits for "
        "the batch to fill and to be processed, so the interval from "
        "submission to answer lengthens. Throughput and response time are "
        "genuinely in tension here, which is the same trade a queue makes and "
        "the reason batch and online processing are separate design choices."),

    mcq("HARD",
        "A system has components in series at 0.99, 0.98 and 0.995 "
        "availability. An engineer proposes adding a redundant partner to the "
        "0.995 component.\n\n"
        "What is the principal objection?",
        [("Redundancy cannot be applied to a component above 99% "
          "availability", False),
         ("The 0.98 component remains the dominant source of unavailability",
          True),
         ("Adding components in parallel reduces overall availability", False),
         ("The calculation would require the components to be identical",
          False)],
        "The 0.995 component contributes 0.5% of unavailability and the 0.98 "
        "component contributes 2% -- four times as much. Making the strongest "
        "link redundant improves the total by a fraction of a percent while "
        "the weakest non-redundant link continues to dominate. Redundancy "
        "should be spent on the WEAKEST unprotected component, and spending "
        "it elsewhere is expensive decoration."),

    mcq("AVERAGE",
        "Capacity planning identifies the processor as a bottleneck, and it "
        "is upgraded. Throughput improves, but by far less than expected.\n\n"
        "What is the most likely explanation?",
        [("The processor was not actually the bottleneck", False),
         ("The bottleneck has moved to another resource", True),
         ("Throughput cannot be improved by hardware changes", False),
         ("The measurement was taken before the upgrade took effect", False)],
        "Relieving one constraint does not make a system unbounded; it makes "
        "the next resource the constraint, and the improvement stops there. "
        "This is why capacity planning is iterative and why a plan predicting "
        "a proportional gain from a single upgrade has usually not modelled "
        "the system properly. The processor genuinely was the bottleneck -- "
        "it simply is not any more."),

    mcq("EASY",
        "Which pair of indexes measures RELIABILITY rather than performance?",
        [("Throughput and response time", False),
         ("MTBF and MTTR", True),
         ("Turnaround time and utilisation", False),
         ("Total cost of ownership and return on investment", False)],
        "MTBF and MTTR describe how often a system fails and how long it "
        "takes to restore, which together give availability -- the "
        "reliability picture. Throughput, response time, turnaround time and "
        "utilisation describe performance, and the last pair are economic "
        "indexes. Conflating reliability with performance is the most common "
        "error on this material: a system can be fast and unreliable, or slow "
        "and never fail."),
]

LESSON_EVALUATION = lesson(
    MAJOR, MIDDLE,
    "System Evaluation Indexes: Performance, Reliability and Economics",
    _eval_quiz,
    lesson_structure(
        "System Evaluation Indexes: Performance, Reliability and Economics",
        "'The system is slow' is a complaint, not a measurement. This lesson "
        "supplies the figures that turn complaints into something comparable, "
        "targetable and contractable -- which is why every formula here "
        "reappears as a service level agreement later in the certification. "
        "It separates performance from reliability, works the availability "
        "calculation on real numbers and shows what each additional nine "
        "actually permits, combines components in series and parallel and "
        "explains why the parallel figure is optimistic, and closes on the "
        "economic indexes that decide whether a technically superior system "
        "is the right one.",
        [
            "Distinguish performance indexes from reliability indexes",
            "Compare throughput with response time and explain why they "
            "conflict",
            "Compute MTBF, MTTR, failure rate and availability",
            "Convert an availability target into permitted downtime",
            "Compute the availability of components in series and in "
            "parallel",
            "Explain why the parallel calculation overstates real "
            "availability",
            "Compare systems on total cost of ownership rather than purchase "
            "price",
            "Describe the capacity planning method and why it is iterative",
        ],
        70,
        _eval_sections,
        [
            ("Throughput",
             "Work completed per unit time. What capacity planning targets, "
             "and what batching improves."),
            ("Response time",
             "The interval from submitting a request to receiving the answer. "
             "What a waiting user experiences, and what batching worsens."),
            ("Turnaround time",
             "The interval from submitting a job to its completion, used for "
             "batch work where nobody waits interactively."),
            ("MTBF",
             "Mean time BETWEEN failures: total operating time divided by the "
             "number of failures. Excludes repair time."),
            ("MTTR",
             "Mean time to repair: total repair time divided by the number of "
             "repairs. Reducing it is usually cheaper than raising MTBF."),
            ("Availability",
             "MTBF / (MTBF + MTTR): the fraction of time a system is usable. "
             "Distinct from reliability, which is how long it runs before "
             "failing."),
            ("Failure rate",
             "Failures per unit time, the reciprocal of MTBF."),
            ("Series availability",
             "The product of the components' availabilities, since all must "
             "work. Falls as components are added."),
            ("Parallel availability",
             "1 minus the product of the components' unavailabilities, since "
             "the group fails only if all fail. Assumes independence, which "
             "shared power and shared software break."),
            ("Benchmark",
             "A fixed workload run to compare systems. Useful only in "
             "proportion to how closely it resembles the real workload."),
            ("Total cost of ownership",
             "Initial plus running costs across a system's whole life. "
             "Running costs usually exceed the purchase price, so comparing "
             "purchase prices picks the wrong option."),
            ("Return on investment",
             "The benefit obtained relative to the cost incurred."),
            ("Capacity planning",
             "Measuring current load and growth, identifying which resource "
             "saturates first, and providing capacity to a target well below "
             "saturation with headroom for failure."),
        ],
        "Evaluation indexes turn complaints into figures that can be compared "
        "and contracted for, and the first discipline is keeping performance "
        "and reliability apart -- a system can be fast and unreliable, or "
        "slow and never fail. Throughput and response time are themselves in "
        "tension, since batching raises the first by making each item wait, "
        "which is the trade a queue makes. On the reliability side, MTBF is "
        "the mean time BETWEEN failures and therefore excludes repair, MTTR "
        "is how long restoration takes, and availability is MTBF over MTBF "
        "plus MTTR -- which yields the lesson's most useful consequence: "
        "there are two ways to raise availability, and recovering faster is "
        "usually far cheaper than failing less often. Converting a target "
        "into time is sobering, with 99% permitting three and a half days of "
        "annual downtime and each further nine removing nine tenths of what "
        "remains at roughly ten times the cost. Components in series multiply "
        "their availabilities, so a long dependency chain is fragile however "
        "good each link is; components in parallel fail only together, which "
        "turns two nines into four -- provided the failures are independent, "
        "which shared power, shared networks and shared software defects "
        "routinely break. And the arithmetic delivers a design rule worth "
        "more than the formula: redundancy belongs on the weakest "
        "unprotected link, because adding it anywhere else improves the total "
        "by a fraction of a percent while the weak link still dominates.",
        exam_notes=[
            desc(
                "This is among the most reliably calculable material on "
                "Subject A, and the same formulas return in the management "
                "papers."
            ),
            ul([
                "Computing availability from MTBF and MTTR.",
                "Converting an availability percentage into downtime.",
                "Computing series and parallel availability for a component "
                "diagram.",
                "Comparing two systems on total cost of ownership over a "
                "stated life.",
                "Distinguishing throughput from response time.",
                "Identifying why measured availability falls below the "
                "calculated figure.",
            ]),
            desc(
                "On any component-diagram item, resolve every parallel group "
                "first and then multiply the results together. Attempting it "
                "in one pass is where the arithmetic goes wrong, and the "
                "distractors are built from multiplying a parallel group as "
                "though it were in series."
            ),
        ],
    ))

LESSONS = [LESSON_CONFIG, LESSON_EVALUATION]

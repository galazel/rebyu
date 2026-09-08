"""Technology Element -> Network, lessons 1 and 2.

Syllabus minor categories 1 (network architecture) and 2 (data communication
and control).

The layer model does most of the work in this category: a very large share of
the examination's network items are answerable from knowing which layer
something belongs to, so both lessons keep returning to it rather than
treating it as an opening formality.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Technology Element"
MIDDLE = "Network"

# ==========================================================================
# Lesson 1: Network architecture
# ==========================================================================

_arch_sections = [
    ("Why Layers", [
        desc(
            "A network has to solve several unrelated problems at once: "
            "putting signals on a wire, delivering a frame across one link, "
            "finding a route across the world, and presenting the result to "
            "an application. Layering separates them so each can be solved, "
            "and replaced, on its own."
        ),
        image(fig("osi-layers")),
        desc(
            "The value of the arrangement is that a layer only needs to know "
            "the interface of the layer below. Wi-Fi replaced Ethernet cable "
            "underneath applications that were never changed, and IP carried "
            "on unchanged above it -- which is the whole argument for "
            "layering, demonstrated."
        ),
    ]),

    ("The Seven Layers", [
        desc(
            "The OSI model is a reference rather than an implementation, and "
            "the examination expects the layers by number and by "
            "responsibility."
        ),
        table(
            ["Layer", "Responsible for", "Examples"],
            [["7 Application", "What the program wants",
              "HTTP, SMTP, DNS, FTP"],
             ["6 Presentation", "Encoding, encryption, compression",
              "Character sets, TLS in part"],
             ["5 Session", "Establishing and managing conversations",
              "Session setup and recovery"],
             ["4 Transport", "End-to-end delivery", "TCP, UDP"],
             ["3 Network", "Addressing and routing between networks",
              "IP, ICMP, routers"],
             ["2 Data link", "Frames across one link", "Ethernet, switches"],
             ["1 Physical", "Signals on a medium", "Cable, radio, hubs"]],
            caption="Seven layers, with what each is answerable for.",
            footer="Layers 2 and 3 are the pair worth separating carefully. "
                   "Layer 2 delivers across ONE link using local addresses; "
                   "layer 3 delivers BETWEEN networks using addresses that "
                   "mean something globally."),
        desc(
            "ENCAPSULATION is how the layers cooperate. Each layer wraps what "
            "it received from above with its own header, so a web request "
            "travels the wire as an Ethernet frame containing an IP packet "
            "containing a TCP segment containing the request. The receiver "
            "unwraps them in reverse, each layer removing its own header and "
            "passing the rest up."
        ),
        desc(
            "That also explains why headers cost throughput. Every layer adds "
            "bytes that carry no application data, so a protocol sending very "
            "small payloads spends a large fraction of the link on headers -- "
            "which is a real effect at layer 4 and the reason small packets "
            "are inefficient."
        ),
    ]),

    ("TCP/IP Against OSI", [
        desc(
            "OSI is the vocabulary; TCP/IP is what actually runs. The two are "
            "aligned in every syllabus and the mapping is examined."
        ),
        image(fig("tcp-ip-stack")),
        table(
            ["TCP/IP layer", "OSI layers", "Holds"],
            [["Application", "5, 6 and 7", "HTTP, DNS, SMTP, SSH"],
             ["Transport", "4", "TCP and UDP"],
             ["Internet", "3", "IP, ICMP, ARP"],
             ["Link", "1 and 2", "Ethernet, Wi-Fi, the medium"]],
            caption="Four practical layers against seven reference ones.",
            footer="TCP/IP collapses OSI's top three into one, because in "
                   "practice applications handle their own sessions and "
                   "encoding. The OSI numbers survive as shared vocabulary "
                   "rather than as an implemented stack."),
        desc(
            "This mapping is worth memorising because it converts many "
            "otherwise separate facts into one. Knowing that a protocol is at "
            "the transport layer tells you it is end-to-end, that it does not "
            "route, and that it identifies applications by port -- none of "
            "which needs recalling separately."
        ),
    ]),

    ("Networks by Scale", [
        desc(
            "The syllabus classifies networks by the ground they cover, and "
            "the classification matters because scale changes what a design "
            "can assume."
        ),
        image(fig("network-scale")),
        table(
            ["Type", "Covers", "Typically"],
            [["PAN", "A person and their devices", "Bluetooth, a few metres"],
             ["LAN", "A building or floor",
              "Owned outright, fast, cheap per metre"],
             ["MAN", "A city", "Campus or metropolitan links"],
             ["WAN", "Regions or countries",
              "Carrier-provided, rented, slower"]],
            caption="Four scales, and what each implies about ownership and "
                    "speed.",
            footer="The distinction that matters is LAN against WAN, and it "
                   "is not chiefly about speed. A LAN is yours to change; a "
                   "WAN link is rented, shared and outside your control."),
        desc(
            "LATENCY is the property that separates them in practice, and it "
            "cannot be bought away. Bandwidth can always be increased; the "
            "time a signal takes to cross a continent is bounded by physics. "
            "So a protocol making many small round trips works acceptably on "
            "a LAN and becomes unusable over a WAN however wide the link -- "
            "which is why WAN designs batch requests rather than repeating "
            "them."
        ),
    ]),

    ("Topologies", [
        desc(
            "Topology describes how nodes are connected, and each arrangement "
            "fails differently -- which is the part the examination asks "
            "about."
        ),
        image(fig("topologies")),
        content_accordion(
            "FIVE TOPOLOGIES",
            "How each is arranged, and what happens when part of it fails.",
            [("Star",
              "Every node connects to one central device. A failed link "
              "affects one node; a failed centre affects everything. Easy to "
              "extend and diagnose, and what essentially every modern LAN "
              "actually is."),
             ("Bus",
              "Every node shares one cable. Cheap and simple, and a break "
              "splits the network in two. Contention rises sharply with "
              "traffic since everyone shares the medium."),
             ("Ring",
              "Each node connects to the next, with traffic circulating one "
              "way. Access is orderly rather than contended. A single break "
              "stops it unless the ring is doubled."),
             ("Mesh",
              "Nodes connect to several others, so any one link can fail "
              "without partitioning anything. Expensive in links, and what "
              "the internet's core uses."),
             ("Tree",
              "Stars connected hierarchically, which is how a building's "
              "floors are joined. Inherits the star's failure behaviour at "
              "each level.")]),
        desc(
            "A distinction worth holding: physical topology is how the cables "
            "run, and logical topology is how the traffic behaves. A network "
            "wired as a star can behave as a bus if its centre is a hub, "
            "which is exactly what a hub does and why a switch replacing it "
            "changes the network's behaviour without changing a cable."
        ),
    ]),

    ("Devices and Their Layers", [
        desc(
            "Network devices are classified by the layer they operate at, and "
            "that classification predicts everything they can and cannot do."
        ),
        image(fig("network-devices")),
        table(
            ["Device", "Layer", "Decides using", "Stops"],
            [["Repeater / hub", "1", "Nothing -- it copies signals",
              "Nothing"],
             ["Bridge / switch", "2", "MAC addresses",
              "Collisions, per port"],
             ["Router", "3", "IP addresses",
              "Broadcasts, and separates networks"],
             ["Gateway", "Up to 7", "Protocol translation",
              "Differences between systems"]],
            caption="Four device classes and what each can see.",
            footer="The last column is the one items turn on. A switch "
                   "confines collisions but forwards broadcasts, so every "
                   "device on a switched LAN is in ONE broadcast domain -- "
                   "and only a router divides that."),
        desc(
            "A COLLISION DOMAIN is the set of devices whose transmissions can "
            "interfere; a BROADCAST DOMAIN is the set that receives one "
            "another's broadcasts. A switch gives each port its own collision "
            "domain and leaves the broadcast domain intact. This is the "
            "distinction that explains why a large flat network degrades: "
            "broadcast traffic reaches every device on it."
        ),
        desc(
            "A VLAN divides one physical switch into several logical "
            "networks, so broadcast domains can be separated without separate "
            "hardware. It is why a modern building can put finance and "
            "engineering on different networks over the same cabling."
        ),
    ]),

    ("Transmission Media", [
        desc(
            "The physical layer's options differ in bandwidth, distance and "
            "immunity to interference."
        ),
        table(
            ["Medium", "Strength", "Limitation"],
            [["Twisted pair", "Cheap and easy to install",
              "Distance, and susceptible to interference"],
             ["Coaxial", "Better shielding than twisted pair",
              "Bulky, and largely superseded"],
             ["Optical fibre", "Enormous bandwidth, long distance, immune to "
              "electrical interference", "Costlier, and less tolerant of "
              "bending"],
             ["Radio", "No cabling at all, mobility",
              "Shared medium, interference, and security exposure"]],
            caption="Four media and where each is the right answer.",
            footer="Fibre's immunity to ELECTRICAL interference is the "
                   "examinable property. It carries light, so motors, "
                   "fluorescent lighting and power cabling do not affect it "
                   "-- which is why it is specified in industrial "
                   "environments regardless of the bandwidth needed."),
        desc(
            "Wireless deserves separate treatment because it is a SHARED "
            "medium. Every device within range contends for the same air, so "
            "throughput falls as devices are added in a way a switched wired "
            "network's does not. And because the signal leaves the building, "
            "its security cannot rest on physical access -- which is the "
            "argument for encrypting it that the Security lessons develop."
        ),
    ]),

    ("Addressing at Two Layers", [
        desc(
            "Two kinds of address appear in every network item, and confusing "
            "them makes the routing lessons impossible."
        ),
        table(
            ["", "MAC address", "IP address"],
            [["Layer", "2", "3"],
             ["Assigned by", "The interface's manufacturer", "The network"],
             ["Means", "Which device this is", "Where the device currently "
                                               "is"],
             ["Scope", "One link -- it does not cross a router",
              "End to end, across the whole path"],
             ["Changes when", "Never, in normal use",
              "The device moves to another network"]],
            caption="Two addresses answering two different questions.",
            footer="'Which device' cannot be routed, because it says nothing "
                   "about location -- a routing table organised by "
                   "manufacturer-assigned identity would need an entry per "
                   "device on earth. Addressing by LOCATION is what makes "
                   "routing tractable."),
        desc(
            "ARP is the bridge between them: given an IP address on the local "
            "network, it asks the network which MAC address holds it. That is "
            "why ARP is confined to one link -- an address on another network "
            "is not something the local network can answer for, and the frame "
            "is sent to the router instead."
        ),
    ]),

    ("Access Control on a Shared Medium", [
        desc(
            "Where several devices share a medium, something must decide who "
            "transmits, and the syllabus names the two approaches."
        ),
        compare_grid(
            "CONTENTION AGAINST CONTROLLED ACCESS",
            "Two ways of arbitrating a shared medium.",
            [("Contention -- CSMA/CD, CSMA/CA",
              ["Listen, and transmit when the medium is quiet",
               "Collisions happen and are recovered from",
               "Very efficient at low load",
               "Degrades sharply as load rises"]),
             ("Controlled -- token passing, polling",
              ["Permission circulates or is granted",
               "Collisions are impossible by construction",
               "Overhead is paid even when idle",
               "Performance stays predictable under load"])]),
        desc(
            "CSMA/CD -- collision detection -- is classic Ethernet: a station "
            "detects a collision while transmitting, stops, and retries after "
            "a random interval. CSMA/CA -- collision AVOIDANCE -- is the "
            "wireless variant, needed because a radio station cannot listen "
            "while transmitting and so cannot detect a collision at all."
        ),
        desc(
            "That difference is worth carrying. It is not that wireless chose "
            "a different scheme for convenience; detection is physically "
            "unavailable there, so avoidance is the only option -- and the "
            "extra handshaking it requires is part of why wireless throughput "
            "trails a wired link of the same nominal rate."
        ),
    ]),

    ("Ethernet and Wireless Standards", [
        desc(
            "Two families dominate the link layer, and the examination "
            "expects their basic characteristics rather than their details."
        ),
        table(
            ["", "Ethernet", "Wireless LAN"],
            [["Medium", "Twisted pair or fibre", "Radio, shared with anyone "
                                                 "in range"],
             ["Access", "CSMA/CD, largely irrelevant on switches",
              "CSMA/CA, always relevant"],
             ["Addressing", "48-bit MAC address", "48-bit MAC address"],
             ["Typical failure", "A cable or port",
              "Interference, range, contention"],
             ["Security posture", "Physical access is the boundary",
              "The signal leaves the building"]],
            caption="Two link technologies, compared where they differ.",
            footer="On a switched Ethernet, each port is its own collision "
                   "domain running full duplex, so CSMA/CD has almost nothing "
                   "to do -- which is why the collision counters on a modern "
                   "LAN read zero and a non-zero one signals a fault."),
        desc(
            "A MAC ADDRESS is assigned to the interface by its manufacturer "
            "and is globally unique, while an IP address is assigned by the "
            "network and describes where the device currently is. That is why "
            "moving a laptop between buildings changes its IP address and "
            "never its MAC -- and why one is used for routing and the other "
            "cannot be."
        ),
    ]),

    ("How a Frame Actually Reaches a Host", [
        desc(
            "Bringing the layers together, it is worth tracing one delivery "
            "end to end, because the interaction between addresses is where "
            "the model becomes concrete."
        ),
        ol([
            "The sender compares the destination IP against its own address "
            "and mask to decide whether the destination is local.",
            "If local, it needs the destination's MAC address, and ARP asks "
            "the local network for it.",
            "If not local, it needs the ROUTER's MAC address instead, since "
            "the frame's job is only to reach the router.",
            "The frame is sent with that MAC as its destination and the "
            "original IP unchanged inside it.",
            "The router strips the frame, consults its table, and builds a "
            "new frame for the next hop.",
            "This repeats until a router finds the destination on a network "
            "it is directly attached to.",
        ]),
        desc(
            "The point worth extracting is that the MAC address changes at "
            "every hop and the IP address does not. Layer 2 addressing is "
            "local and consumed by each link; layer 3 addressing is "
            "end-to-end and survives the whole journey -- which is the "
            "clearest single illustration of what separates the two layers."
        ),
    ]),

    ("Designing a Small Network", [
        desc(
            "The syllabus expects the architecture to be applied, not only "
            "described, and a small office is the standard scenario."
        ),
        ul([
            "Wire in a star to switches, with a tree of switches if several "
            "floors are involved -- this is what every modern LAN does.",
            "Separate broadcast domains by department using VLANs, since one "
            "flat network of any size floods everyone with broadcasts.",
            "Put a router between the VLANs and between the site and the "
            "outside, since that is where a network's real boundary is.",
            "Use fibre for uplinks between floors, where distance and "
            "electrical noise both argue for it.",
            "Provide wireless as an addition rather than a replacement, "
            "remembering its capacity is shared among everyone in range.",
            "Duplicate the links that would partition the network if they "
            "failed, which is the mesh argument applied selectively.",
        ]),
        desc(
            "The last point is where cost is decided. Full redundancy is "
            "rarely justified; identifying the few links whose failure would "
            "isolate a whole floor, and doubling only those, delivers most of "
            "the availability for a fraction of the expense."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where architecture items are lost."),
        ul([
            "Placing a router at layer 2 or a switch at layer 3. Switches "
            "read MAC addresses, routers read IP addresses.",
            "Assuming a switch divides broadcast domains. It divides "
            "collision domains only; a router divides broadcasts.",
            "Confusing physical with logical topology. A star wired network "
            "with a hub behaves as a bus.",
            "Treating WAN as merely 'slower LAN'. The difference that matters "
            "is latency, which bandwidth cannot fix.",
            "Naming fibre's advantage as speed alone. Immunity to electrical "
            "interference is the property usually being asked about.",
            "Forgetting that TCP/IP merges OSI's top three layers.",
            "Assuming wireless throughput is per-device. The medium is shared "
            "among everyone in range.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A department's network runs slowly. All 200 machines are on "
            "switches, and monitoring shows heavy broadcast traffic. Adding "
            "another switch has not helped. What is the problem, and what "
            "would fix it?\""
        ),
        ol([
            "Establish what a switch does: it forwards a frame to the right "
            "port, so each port is its own collision domain.",
            "Establish what it does NOT do: it forwards broadcasts to every "
            "port, so all 200 machines share one broadcast domain.",
            "Broadcast traffic therefore reaches every machine regardless of "
            "how many switches there are.",
            "Adding switches adds collision domains, which were not the "
            "constraint -- so it changes nothing, which matches the symptom.",
            "The fix is dividing the BROADCAST domain, using a router or "
            "VLANs on the existing switches.",
        ]),
        desc(
            "Step four is what makes this a good item. The action taken was "
            "reasonable and ineffective, and explaining WHY it was ineffective "
            "requires knowing exactly which domain a switch divides. That "
            "single distinction is worth more marks across this category than "
            "any other fact in the lesson."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Network architecture reaches across the certification."),
        ul([
            "Layering is the abstraction argument the Software lessons made "
            "about operating systems.",
            "Encapsulation resembles the nesting of protocols in Middleware.",
            "Mesh topology for survivability is redundancy from System "
            "Configuration.",
            "Wireless being a shared, escaping medium sets up the Security "
            "lessons.",
            "WAN latency shaping protocol design recurs in distributed "
            "databases.",
            "Media selection appears again in Service Management facilities "
            "planning.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Layer 2 against layer 3",
              "One link with local addresses, against between networks",
              "Switches at 2, routers at 3, and nearly every device item "
              "follows from this."),
             ("What a switch divides",
              "Collision domains only",
              "Broadcasts still reach every port. Only a router or a VLAN "
              "divides a broadcast domain."),
             ("How TCP/IP maps to OSI",
              "Four layers; OSI's top three become one",
              "Transport is 4, internet is 3, link is 1 and 2."),
             ("The real LAN/WAN difference",
              "Latency, which bandwidth cannot fix",
              "So a chatty protocol works on one and fails on the other."),
             ("Physical against logical topology",
              "How it is wired, against how traffic behaves",
              "A star wired around a hub behaves as a bus."),
             ("Fibre's examinable advantage",
              "Immunity to electrical interference",
              "It carries light, so motors and power cabling do not affect "
              "it.")]),
    ]),
]

_arch_quiz = [
    mcq("HARD",
        "A LAN of 200 machines on switches performs poorly, with monitoring "
        "showing heavy broadcast traffic. Adding another switch changed "
        "nothing.\n\nWhy, and what would help?",
        [("Switches do not divide broadcast domains; a router or VLANs "
          "would", True),
         ("The additional switch was configured with an incorrect duplex "
          "setting on its uplink ports", False),
         ("Broadcast traffic requires more bandwidth than the switches can "
          "provide on their backplanes", False),
         ("The machines are contending for a single collision domain shared "
          "across all of the switches", False)],
        "A switch gives each port its own collision domain and forwards "
        "broadcasts to every port, so all 200 machines remain in ONE "
        "broadcast domain however many switches are added. That is exactly "
        "why the action taken was reasonable and ineffective. Dividing the "
        "broadcast domain needs a router, or VLANs configured on the switches "
        "already present."),

    mcq("AVERAGE",
        "At which OSI layer does a router operate?",
        [("Layer 2, the data link layer", False),
         ("Layer 3, the network layer", True),
         ("Layer 4, the transport layer", False),
         ("Layer 1, the physical layer", False)],
        "A router forwards using IP addresses, which are network-layer "
        "addresses meaning something between networks -- so it operates at "
        "layer 3. A switch forwards using MAC addresses, which are "
        "meaningful on one link only, placing it at layer 2. That single "
        "difference determines which device separates two networks and which "
        "merely organises one."),

    mcq("AVERAGE",
        "In the TCP/IP model, which OSI layers correspond to its application "
        "layer?",
        [("Layers 5, 6 and 7", True),
         ("Layer 7 only, since the others have no equivalent", False),
         ("Layers 6 and 7, with sessions handled at the transport "
          "layer", False),
         ("Layers 4 through 7, since transport is part of the "
          "application", False)],
        "TCP/IP collapses OSI's session, presentation and application layers "
        "into one, because in practice applications manage their own "
        "conversations and encoding rather than delegating to separate "
        "layers. Transport remains distinct and maps to OSI layer 4. The OSI "
        "numbers survive as shared vocabulary rather than as an implemented "
        "seven-layer stack."),

    mcq("HARD",
        "A protocol makes many small request-response exchanges. It performs "
        "acceptably on a LAN and unusably over a WAN link of the same "
        "bandwidth.\n\nWhy?",
        [("The WAN link has a smaller maximum frame size than the LAN "
          "does", False),
         ("Each exchange pays the WAN's much greater latency, which bandwidth "
          "does not reduce", True),
         ("WAN links discard small packets in favour of larger ones during "
          "periods of congestion", False),
         ("The carrier applies compression, which is ineffective on very "
          "small payloads", False)],
        "Latency is bounded by distance and cannot be bought away, so every "
        "round trip costs far more over a WAN than a LAN -- and a protocol "
        "with many exchanges pays that cost repeatedly. Widening the link "
        "raises how much can be in flight and not how long each trip takes. "
        "The remedy is batching requests so fewer round trips are needed."),

    mcq("EASY",
        "Which transmission medium is immune to electrical interference?",
        [("Optical fibre", True),
         ("Shielded twisted pair cable", False),
         ("Coaxial cable with a braided outer conductor", False),
         ("Radio, provided a licensed frequency band is used", False)],
        "Fibre carries light rather than electricity, so motors, fluorescent "
        "lighting and power cabling have no effect on it -- which is why it "
        "is specified in industrial environments regardless of the bandwidth "
        "required. Shielding reduces interference in copper media without "
        "eliminating it, and radio is exposed to interference by its nature "
        "as a shared open medium."),

    mcq("HARD",
        "A network is wired so that every machine connects to one central "
        "device, which repeats every signal it receives to all its "
        "ports.\n\nWhat is its logical topology?",
        [("Star, matching the physical wiring", False),
         ("Bus, because every machine shares one medium", True),
         ("Ring, because signals circulate through the centre", False),
         ("Mesh, because every machine can reach every other one", False)],
        "The central device described is a hub, which repeats signals to "
        "every port -- so all machines share one medium and contend with one "
        "another exactly as they would on a bus. The physical topology is a "
        "star and the logical topology is a bus, which is precisely the "
        "distinction the item is testing. Replacing the hub with a switch "
        "changes the behaviour without changing any cable."),

    mcq("AVERAGE",
        "What is encapsulation in a layered network model?",
        [("Hiding a network's internal addresses from external "
          "networks", False),
         ("Each layer adding its own header to what it received from "
          "above", True),
         ("Combining several small packets into one larger transmission "
          "unit", False),
         ("Restricting each layer to communicating only with its immediate "
          "neighbours", False)],
        "Each layer wraps the data it received with its own header, so a "
        "request crosses the wire as a frame containing a packet containing a "
        "segment containing the request -- and the receiver unwraps them in "
        "reverse. It also explains why very small payloads are inefficient: "
        "the headers are a fixed cost paid regardless of how little data they "
        "carry."),

    mcq("AVERAGE",
        "Which topology allows any single link to fail without partitioning "
        "the network?",
        [("Mesh", True),
         ("Bus, provided terminators are fitted at both ends", False),
         ("Star, because each node has an independent connection", False),
         ("Ring, because traffic can circulate in either direction", False)],
        "A mesh connects nodes to several others, so an alternative path "
        "always exists -- which is why the internet's core is meshed and why "
        "it is expensive in links. A star survives a link failure losing only "
        "that node but fails entirely if the centre does. A single break "
        "splits a bus, and stops a ring unless it has been deliberately "
        "doubled."),

    mcq("HARD",
        "Why does throughput per device fall as more devices join a wireless "
        "network, in a way it does not on a switched wired network?",
        [("Wireless devices must retransmit every frame at least once to "
          "confirm delivery", False),
         ("The radio medium is shared among everyone in range, while each "
          "switch port is not", True),
         ("Encryption overhead increases in proportion to the number of "
          "connected devices", False),
         ("Wireless access points forward broadcasts that a wired switch "
          "would suppress", False)],
        "Every device within range contends for the same air, so the "
        "available capacity is divided among them. A switch gives each port "
        "its own dedicated path, so adding a device on another port does not "
        "reduce what an existing one gets. This is the same contention "
        "problem a bus topology has, which is why wireless behaves like a "
        "shared medium however modern the equipment."),

    mcq("AVERAGE",
        "What does a VLAN provide?",
        [("Separate broadcast domains on shared physical switch "
          "hardware", True),
         ("Encrypted communication between two networks across a public "
          "link", False),
         ("Automatic assignment of addresses to devices as they "
          "connect", False),
         ("Additional bandwidth by combining several physical links into "
          "one", False)],
        "A VLAN divides one physical switch into several logical networks, so "
        "broadcast domains can be separated without buying separate hardware "
        "or recabling -- which is how a building puts different departments "
        "on different networks over the same infrastructure. Encrypting "
        "traffic across a public link is a VPN, a different mechanism "
        "answering a different problem."),
]

LESSON_NET_ARCH = lesson(
    MAJOR, MIDDLE,
    "Network Architecture: LAN, WAN, Topologies and Devices",
    _arch_quiz,
    lesson_structure(
        "Network Architecture: LAN, WAN, Topologies and Devices",
        "Networks solve several unrelated problems at once, and layering is "
        "what lets each be solved separately -- which is why the layer model "
        "answers a very large share of this category's examination items on "
        "its own. This lesson covers the seven OSI layers and the four TCP/IP "
        "ones they map onto, encapsulation and why headers cost throughput, "
        "the scales from PAN to WAN and why latency rather than bandwidth "
        "separates them, the topologies and how each one fails, the devices "
        "classified by the layer they work at, and the media, with fibre's "
        "immunity to electrical interference as the property most often "
        "asked about.",
        [
            "Explain why networks are layered and what encapsulation does",
            "Name the seven OSI layers and their responsibilities",
            "Map the TCP/IP model onto OSI and place common protocols",
            "Distinguish network scales and explain the LAN/WAN latency "
            "difference",
            "Describe the topologies and how each fails",
            "Distinguish physical from logical topology",
            "Classify devices by layer and identify what each domain they "
            "divide",
            "Select transmission media for a stated environment",
        ],
        75,
        _arch_sections,
        [
            ("Layering",
             "Separating a network's problems so each can be solved and "
             "replaced independently of the others."),
            ("Encapsulation",
             "Each layer wrapping what it received with its own header, "
             "unwrapped in reverse at the receiver."),
            ("OSI model",
             "Seven reference layers: physical, data link, network, "
             "transport, session, presentation, application."),
            ("TCP/IP model",
             "Four practical layers -- link, internet, transport, application "
             "-- with OSI's top three collapsed into one."),
            ("LAN against WAN",
             "Owned and local against rented and distant. The difference that "
             "matters is latency, which bandwidth cannot fix."),
            ("Physical topology",
             "How the cabling actually runs -- star, bus, ring, mesh, tree."),
            ("Logical topology",
             "How traffic actually behaves, which may differ: a star wired "
             "around a hub behaves as a bus."),
            ("Collision domain",
             "The set of devices whose transmissions can interfere. A switch "
             "gives each port its own."),
            ("Broadcast domain",
             "The set of devices receiving one another's broadcasts. Only a "
             "router or a VLAN divides one."),
            ("Switch",
             "A layer 2 device forwarding by MAC address to the correct port "
             "only."),
            ("Router",
             "A layer 3 device forwarding between IP networks, and the real "
             "boundary of a network."),
            ("VLAN",
             "Logical networks on shared switch hardware, separating "
             "broadcast domains without separate equipment."),
            ("Optical fibre",
             "Carries light, so it is immune to electrical interference and "
             "spans long distances at high bandwidth."),
        ],
        "Layering lets a network's unrelated problems be solved separately, "
        "and it is what allowed Wi-Fi to replace cable underneath "
        "applications nobody changed. OSI names seven layers and TCP/IP "
        "implements four, collapsing OSI's top three -- and knowing which "
        "layer something belongs to answers most protocol and device items "
        "without recalling anything else. Encapsulation wraps each layer's "
        "data in the next one's header, which is also why very small payloads "
        "waste a link. Scale runs from PAN to WAN, and the LAN/WAN difference "
        "that matters is LATENCY rather than bandwidth: a chatty protocol "
        "works on one and is unusable on the other, however wide the link. "
        "Topologies fail in characteristic ways -- a star loses everything "
        "with its centre, a break splits a bus, a mesh survives any single "
        "link -- and physical topology can differ from logical, as a star "
        "wired around a hub demonstrates. Devices are classified by layer, "
        "and the distinction worth most is that a switch divides COLLISION "
        "domains while only a router or VLAN divides BROADCAST domains, which "
        "is why adding switches to a broadcast-saturated LAN changes nothing. "
        "Among media, fibre's examinable property is immunity to electrical "
        "interference, and wireless is a shared medium whose capacity divides "
        "among everyone in range.",
        exam_notes=[
            desc(
                "Most items in this lesson are answerable by identifying a "
                "layer, so establish the layer before anything else."
            ),
            ul([
                "Placing a device or protocol at its layer.",
                "Distinguishing collision from broadcast domains.",
                "Explaining why a LAN design fails over a WAN.",
                "Identifying a logical topology from a described "
                "arrangement.",
                "Selecting a medium for a described environment.",
                "Mapping TCP/IP onto OSI.",
                "Explaining encapsulation.",
            ]),
            desc(
                "When an item describes an action that did not help, work out "
                "what the action actually changes and confirm it was not the "
                "constraint. Adding switches, adding bandwidth and adding "
                "access points are the three that recur, and each addresses "
                "something the symptom usually rules out."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Data communication and control
# ==========================================================================

_comm_sections = [
    ("Getting Data Across a Medium", [
        desc(
            "Beneath the layers of the previous lesson sits a physical "
            "problem: representing bits as something a medium can carry, and "
            "recovering them at the other end without the two ends drifting "
            "apart."
        ),
        image(fig("encoding-schemes")),
        desc(
            "BASEBAND transmission puts the digital signal directly onto the "
            "medium, which is what a LAN cable does and why it carries one "
            "signal at a time. BROADBAND modulates the data onto a carrier "
            "wave, so several channels at different frequencies share the "
            "medium -- which is how cable and radio carry many services at "
            "once."
        ),
    ]),

    ("Encoding and Clocking", [
        desc(
            "An encoding is not merely a convention for which voltage means "
            "one. It has to keep the receiver synchronised, and that "
            "requirement drives its design."
        ),
        desc(
            "A receiver recovers its clock from TRANSITIONS in the signal. If "
            "a long run of identical bits produces no transition, the "
            "receiver's clock drifts and it begins sampling at the wrong "
            "moments -- so an encoding that guarantees regular transitions is "
            "buying synchronisation at the cost of efficiency."
        ),
        table(
            ["Approach", "How", "Cost"],
            [["NRZ", "One level per bit value",
              "No transitions during a long run -- drift"],
             ["Manchester", "A transition in the middle of every bit",
              "Two signal changes per bit, halving efficiency"],
             ["Scrambling", "Transform the data so runs are unlikely",
              "Complexity, and no absolute guarantee"]],
            caption="Three answers to the same synchronisation problem.",
            footer="Manchester encoding is the clearest illustration: it "
                   "guarantees a transition per bit and therefore needs twice "
                   "the signalling rate for the same data rate. Nothing is "
                   "free at this layer either."),
    ]),

    ("Synchronous and Asynchronous Transmission", [
        desc(
            "The syllabus distinguishes two ways of framing a stream of bits, "
            "and the terms are examined."
        ),
        compare_grid(
            "ASYNCHRONOUS AGAINST SYNCHRONOUS",
            "How the receiver knows where a unit of data starts.",
            [("Asynchronous",
              ["Each character framed by start and stop bits",
               "Sender and receiver clocks are independent",
               "Overhead per character, so inefficient in bulk",
               "Simple, and fine at low rates"]),
             ("Synchronous",
              ["Blocks framed and clocked together",
               "The clock is shared or recovered from the data",
               "Overhead per block, so efficient in bulk",
               "More complex, and what high rates require"])]),
        desc(
            "The trade is the same one that appears throughout: per-unit "
            "overhead against complexity. Asynchronous transmission spends "
            "framing bits on every character and needs no clock agreement; "
            "synchronous transmission amortises the framing across a whole "
            "block and must keep the two ends in step to do it."
        ),
    ]),

    ("Direction of Transmission", [
        desc(
            "Three terms describe which directions a link can carry data, and "
            "they are examined by definition."
        ),
        table(
            ["Mode", "Directions", "Example"],
            [["Simplex", "One only, always", "Broadcast radio, a sensor "
                                             "feed"],
             ["Half duplex", "Both, one at a time", "A walkie-talkie, a hub "
                                                    "port"],
             ["Full duplex", "Both, simultaneously",
              "A switched Ethernet port, a telephone call"]],
            caption="Three modes, distinguished by simultaneity rather than "
                    "capability.",
            footer="Half and full duplex are the pair confused. Both carry "
                   "data in both directions; only full duplex does so at the "
                   "same time -- which is precisely what a switch enables and "
                   "a hub does not."),
        desc(
            "This connects directly to the previous lesson. A hub's shared "
            "medium forces half duplex, since a transmission in one direction "
            "occupies the medium. A switch gives each port a dedicated path, "
            "permitting full duplex and doubling effective throughput -- one "
            "of the concrete reasons switches replaced hubs."
        ),
    ]),

    ("Multiplexing", [
        desc(
            "Several conversations frequently have to share one link, and the "
            "syllabus names three ways of arranging that."
        ),
        image(fig("multiplexing")),
        content_tabs(
            "THREE MULTIPLEXING SCHEMES",
            "What each divides, and what each wastes.",
            [("Frequency division",
              "divide the spectrum",
              "Each channel is allocated a frequency band and all transmit "
              "simultaneously. Used by radio and cable television. Guard "
              "bands between channels are spectrum spent on preventing "
              "interference rather than carrying data."),
             ("Time division",
              "divide the clock",
              "Each channel is allocated a repeating time slot. Simple and "
              "predictable, and a slot belonging to an idle channel is wasted "
              "-- the capacity cannot be given to a busy one."),
             ("Statistical",
              "slots on demand",
              "Capacity is given to whichever channel has data ready, so "
              "nothing is wasted on idle ones. This is how packet networks "
              "work, and it explains why they offer no guarantee: when "
              "everyone transmits at once there is not enough for all.")]),
        desc(
            "Statistical multiplexing is the one worth understanding as a "
            "principle rather than a term. It achieves its efficiency by "
            "assuming users are not all busy simultaneously -- and congestion "
            "is simply that assumption failing, which is a predictable "
            "consequence of the design rather than a fault in it."
        ),
    ]),

    ("Circuit and Packet Switching", [
        desc(
            "How a network delivers data between two points divides into two "
            "approaches with opposite properties."
        ),
        image(fig("switching-methods")),
        table(
            ["", "Circuit switching", "Packet switching"],
            [["Before sending", "A path is established end to end",
              "Nothing"],
             ["Capacity", "Reserved, and yours even when idle",
              "Shared, and contended for"],
             ["Delay", "Constant once established", "Variable, and unbounded "
                                                    "under congestion"],
             ["Failure of a link", "The call drops",
              "Packets take another route"],
             ["Efficiency", "Poor -- silence wastes the reservation",
              "High -- nothing is reserved"]],
            caption="Guaranteed quality against efficient sharing.",
            footer="Neither is better. A network carrying constant-rate "
                   "conversations wants reservation; a network carrying "
                   "bursty data would waste most of a reservation, which is "
                   "the trade the internet made."),
        desc(
            "The syllabus also names two packet modes. A DATAGRAM network "
            "routes each packet independently, so packets may take different "
            "paths and arrive out of order. A VIRTUAL CIRCUIT establishes a "
            "path first and sends all packets along it, which preserves order "
            "and still shares capacity -- a middle position between the two "
            "columns above."
        ),
    ]),

    ("Detecting and Correcting Errors", [
        desc(
            "Media corrupt data, and the syllabus expects the detection "
            "schemes and their relative strengths."
        ),
        table(
            ["Scheme", "Detects", "Weakness"],
            [["Parity bit", "Any odd number of flipped bits",
              "Two flipped bits cancel out and pass"],
             ["Checksum", "Most accidental corruption",
              "Some rearrangements produce the same sum"],
             ["CRC", "Burst errors reliably, which is what media produce",
              "Detects, and cannot correct"],
             ["Hamming code", "And CORRECTS a single-bit error",
              "Needs more redundant bits to do it"]],
            caption="Four schemes, in increasing order of strength and cost.",
            footer="CRC is the one used on real links, because errors on a "
                   "medium arrive in BURSTS rather than singly -- which is "
                   "exactly the pattern a parity bit is worst at and CRC is "
                   "designed for."),
        desc(
            "The choice between detecting and correcting is a round-trip "
            "argument. Where retransmission is cheap, detecting an error and "
            "asking again is more efficient than carrying enough redundancy "
            "to repair it. Where a round trip is expensive or impossible -- a "
            "deep-space link, a stored medium -- forward error correction "
            "carries the redundancy up front."
        ),
    ]),

    ("Flow and Congestion Control", [
        desc(
            "Two problems sound similar and are distinct, and the examination "
            "separates them."
        ),
        compare_grid(
            "FLOW CONTROL AGAINST CONGESTION CONTROL",
            "Both slow a sender down, for different reasons.",
            [("Flow control",
              ["Protects the RECEIVER",
               "The receiver cannot keep up with the sender",
               "Handled by a window the receiver advertises",
               "A conversation between two endpoints"]),
             ("Congestion control",
              ["Protects the NETWORK",
               "The path between them cannot carry the load",
               "Inferred from loss and delay, not advertised",
               "A response to conditions nobody reports directly"])]),
        desc(
            "SLIDING WINDOW is the mechanism the syllabus names for flow "
            "control. Rather than acknowledging each unit and waiting, the "
            "sender may have a window of unacknowledged data in flight -- so "
            "throughput no longer collapses as latency grows. It is why "
            "window size matters enormously on high-latency links."
        ),
        desc(
            "Congestion control is harder because nothing reports congestion "
            "directly; the sender infers it from packets being lost or "
            "delayed and slows down. That inference is why a lossy wireless "
            "link can be mistaken for a congested one, with the sender "
            "reducing its rate in response to corruption rather than load."
        ),
    ]),

    ("Compression on a Link", [
        desc(
            "Reducing what has to be sent is an alternative to sending it "
            "faster, and the syllabus treats it alongside the other "
            "communication controls."
        ),
        ul([
            "Compressing before transmission trades processing at both ends "
            "for time on the link, which is worthwhile whenever the link is "
            "the slower of the two.",
            "Already-compressed data -- images, video, archives -- compresses "
            "no further, and attempting it spends processing for nothing.",
            "Encrypted data is indistinguishable from random and does not "
            "compress, which is why compression must happen BEFORE "
            "encryption, never after.",
            "Header compression matters separately on links carrying many "
            "small packets, where headers are a large share of the traffic.",
        ]),
        desc(
            "The ordering rule is the examinable one. Compress then encrypt "
            "is the only sequence that works, because encryption destroys "
            "exactly the redundancy compression depends on -- and a design "
            "that encrypts first will appear to work while transmitting far "
            "more than it needs to."
        ),
    ]),

    ("Bandwidth, Throughput and Latency", [
        desc(
            "Three terms are used loosely in conversation and precisely in "
            "the examination, and separating them is what makes the "
            "throughput items tractable."
        ),
        table(
            ["Term", "Means", "Bounded by"],
            [["Bandwidth", "The link's nominal capacity",
              "What was bought or built"],
             ["Throughput", "What is actually achieved",
              "The weakest element in the whole path"],
             ["Latency", "Time for one unit to cross",
              "Distance, and processing at each hop"],
             ["Jitter", "Variation in that latency",
              "Queueing, which varies with load"]],
            caption="Four measurements, frequently confused.",
            footer="Throughput is bounded by the WEAKEST element, which may "
                   "be a slow link, a busy router, a small window or a slow "
                   "endpoint -- so measuring which one before changing "
                   "anything is what separates a fix from a guess."),
        desc(
            "JITTER deserves separate attention because it matters to a class "
            "of application that average latency does not describe. A voice "
            "call tolerates consistent delay and not varying delay, since the "
            "receiver must play audio at a steady rate and a late packet has "
            "missed its moment. That is why quality-of-service mechanisms "
            "prioritise such traffic rather than merely giving it more "
            "bandwidth."
        ),
    ]),

    ("Quality of Service", [
        desc(
            "When a shared network carries traffic with different "
            "requirements, treating every packet identically serves some of "
            "it badly."
        ),
        content_accordion(
            "FOUR QUALITY-OF-SERVICE MECHANISMS",
            "Each addresses a different aspect of unfair or inadequate "
            "treatment.",
            [("Classification and marking",
              "Traffic is identified and labelled so later devices can treat "
              "it differently. Everything else depends on this step, and "
              "marking that downstream devices ignore accomplishes nothing."),
             ("Priority queueing",
              "Marked traffic is served first at each congested point. "
              "Effective, and capable of starving unmarked traffic entirely "
              "if the priority class is not bounded."),
             ("Traffic shaping",
              "Smooths a bursty sender to a steady rate by buffering, which "
              "adds delay in exchange for predictability."),
             ("Policing",
              "Discards or demotes traffic exceeding an agreed rate. Unlike "
              "shaping it does not buffer, so it enforces the limit without "
              "adding delay -- by losing data.")]),
        desc(
            "The examinable judgement is that quality of service redistributes "
            "capacity and does not create it. On a link with ample capacity "
            "it changes nothing; on a saturated one it decides who suffers. "
            "So an answer proposing it as a remedy for insufficient bandwidth "
            "is answering the wrong question."
        ),
    ]),

    ("Where Time Actually Goes", [
        desc(
            "A transmission's total delay is the sum of four components, and "
            "knowing which dominates tells you what would help."
        ),
        table(
            ["Component", "Caused by", "Reduced by"],
            [["Propagation", "Distance and the speed of signal",
              "Nothing available -- it is physics"],
             ["Transmission", "Pushing the bits onto the link",
              "More bandwidth, or less data"],
             ["Queueing", "Waiting behind other traffic at a hop",
              "Less congestion, or higher priority"],
             ["Processing", "Each device examining the packet",
              "Faster or fewer devices in the path"]],
            caption="Four delays, and what each responds to.",
            footer="Only the transmission component responds to bandwidth, "
                   "which is the whole reason 'buy a wider link' so often "
                   "disappoints -- it addresses one term of four, and rarely "
                   "the dominant one."),
        desc(
            "This table is worth carrying into any item asking why an "
            "improvement did not help. If the dominant term was propagation "
            "or queueing, a wider link was never going to change the answer, "
            "and the reasoning is the same one the sliding-window item "
            "rewards."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where communication items are lost."),
        ul([
            "Confusing half with full duplex. Both carry both directions; "
            "only full duplex does so simultaneously.",
            "Assuming statistical multiplexing guarantees capacity. Its "
            "efficiency comes precisely from not reserving any.",
            "Treating packet switching as simply better. Circuit switching "
            "guarantees what packet switching cannot.",
            "Thinking a parity bit catches any error. Two flipped bits pass "
            "undetected.",
            "Expecting CRC to correct errors. It detects; Hamming codes "
            "correct.",
            "Confusing flow with congestion control. One protects a receiver, "
            "the other the network.",
            "Forgetting that encoding exists partly for clock recovery, not "
            "only for representation.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A link with high latency and ample bandwidth achieves far "
            "lower throughput than expected. Increasing bandwidth does not "
            "help. What limits it?\""
        ),
        ol([
            "Note that bandwidth is not the constraint, since adding it "
            "changed nothing.",
            "Consider what else bounds throughput: how much data may be in "
            "flight before an acknowledgement is required.",
            "That is the sliding WINDOW. A sender with a small window sends a "
            "window's worth, then waits a full round trip.",
            "On a high-latency link that wait dominates, so the link sits "
            "idle for most of every round trip regardless of its width.",
            "The fix is a larger window, sized to the bandwidth-delay product "
            "-- enough data in flight to keep the link busy for a whole round "
            "trip.",
        ]),
        desc(
            "This item recurs in several disguises, and the reasoning "
            "transfers. Whenever adding capacity does not help, the "
            "constraint is something that does not scale with capacity -- "
            "usually a round trip somewhere, which is the same shape as the "
            "WAN protocol item in the previous lesson."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("The communication layer underpins much of the certification."),
        ul([
            "Modulation and A/D conversion were covered in Basic Theory.",
            "Parity and Hamming codes are the error-detection mathematics of "
            "that same category.",
            "Statistical multiplexing's overcommitment is the assumption "
            "behind capacity planning in System Evaluation.",
            "Full duplex explains one concrete gain from switches in the "
            "previous lesson.",
            "Flow control by window resembles the buffering of the "
            "Input/Output lesson.",
            "Congestion inferred from loss is why a lossy wireless link "
            "misleads TCP, revisited in Network Management.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Half against full duplex",
              "Both directions, one at a time or simultaneously",
              "A hub's shared medium forces half duplex; a switch's dedicated "
              "port permits full."),
             ("What statistical multiplexing trades",
              "Efficiency for any guarantee",
              "It assumes users are not all busy at once, and congestion is "
              "that assumption failing."),
             ("Circuit against packet switching",
              "Reserved capacity against shared capacity",
              "One wastes silence and guarantees quality; the other wastes "
              "nothing and guarantees nothing."),
             ("Why CRC rather than parity",
              "Real errors arrive in bursts",
              "Which is what CRC is designed for and what a parity bit is "
              "worst at."),
             ("Detecting against correcting",
              "A round-trip argument",
              "Retransmit where a round trip is cheap; carry redundancy where "
              "it is not."),
             ("Flow against congestion control",
              "Protecting the receiver against protecting the network",
              "One is advertised by the receiver; the other is inferred from "
              "loss.")]),
    ]),
]

_comm_quiz = [
    mcq("HARD",
        "A link has high latency and ample bandwidth, and throughput is far "
        "below the link's capacity. Adding bandwidth does not help.\n\n"
        "What is most likely limiting it?",
        [("The transmission window is too small for the round-trip "
          "time", True),
         ("The medium is introducing burst errors that force frequent "
          "retransmission of data", False),
         ("The link is operating in half duplex, so the two directions cannot "
          "transmit together", False),
         ("Frequency division multiplexing is reserving guard bands that "
          "reduce usable capacity", False)],
        "Throughput is bounded by how much data may be in flight before an "
        "acknowledgement is required. With a small window the sender "
        "transmits a window's worth and then waits a full round trip, leaving "
        "the link idle for most of it however wide it is. Sizing the window "
        "to the bandwidth-delay product keeps the link busy across a whole "
        "round trip, which is the fix."),

    mcq("AVERAGE",
        "What distinguishes full duplex from half duplex transmission?",
        [("Full duplex carries data in both directions and half duplex in "
          "one", False),
         ("Full duplex carries both directions simultaneously; half duplex "
          "alternates", True),
         ("Full duplex requires two separate physical media and half duplex "
          "one", False),
         ("Full duplex uses synchronous framing while half duplex uses "
          "asynchronous", False)],
        "Both modes carry data in both directions; only full duplex does so "
        "at the same time. Carrying one direction only is SIMPLEX. The "
        "practical consequence appears in the previous lesson: a hub's shared "
        "medium forces half duplex because a transmission occupies it, while "
        "a switch's dedicated port permits full duplex and roughly doubles "
        "effective throughput."),

    mcq("HARD",
        "Why is a cyclic redundancy check preferred to a parity bit on a "
        "communication link?",
        [("It corrects errors as well as detecting them, avoiding "
          "retransmission", False),
         ("It reliably detects burst errors, which is the pattern media "
          "actually produce", True),
         ("It requires fewer redundant bits than a parity bit for the same "
          "block of data", False),
         ("It operates at the network layer rather than the data link layer, "
          "covering more", False)],
        "Errors on a physical medium arrive in bursts -- several adjacent "
        "bits corrupted by one disturbance -- which is exactly the pattern a "
        "single parity bit handles worst, since two flipped bits cancel and "
        "pass undetected. CRC detects such bursts reliably. It detects only, "
        "however: correcting an error requires a Hamming code and its "
        "additional redundant bits."),

    mcq("AVERAGE",
        "What is the essential difference between flow control and congestion "
        "control?",
        [("Flow control protects the receiver; congestion control protects "
          "the network", True),
         ("Flow control operates at the data link layer and congestion "
          "control at the physical layer", False),
         ("Flow control applies to reliable protocols while congestion "
          "control applies to unreliable ones", False),
         ("Flow control prevents errors in transmission while congestion "
          "control repairs them afterwards", False)],
        "Flow control stops a fast sender overwhelming a slow receiver, and "
        "the receiver advertises what it can take. Congestion control stops "
        "senders overwhelming the PATH between them, and nothing reports "
        "congestion directly -- so it is inferred from loss and delay. That "
        "inference is why a lossy wireless link can be mistaken for a "
        "congested one."),

    mcq("HARD",
        "Statistical multiplexing carries more traffic on a link than time "
        "division multiplexing.\n\nWhat does it give up to do so?",
        [("Any guarantee of capacity for a particular channel", True),
         ("The ability to carry more than one channel on a single "
          "medium", False),
         ("Compatibility with links whose two ends have independent "
          "clocks", False),
         ("Immunity to burst errors, which time division multiplexing "
          "retains", False)],
        "Time division reserves a repeating slot per channel, so a slot "
        "belonging to an idle channel is wasted and a busy one cannot use it. "
        "Statistical multiplexing gives capacity to whoever has data, wasting "
        "nothing -- by assuming not everyone is busy at once. Congestion is "
        "simply that assumption failing, which makes it a predictable "
        "consequence of the design rather than a fault."),

    mcq("AVERAGE",
        "In circuit switching, what happens to reserved capacity while "
        "neither party is transmitting?",
        [("It is wasted, since the reservation is held regardless", True),
         ("It is temporarily reallocated to other calls needing "
          "capacity", False),
         ("It is used to carry error-correcting information for the "
          "call", False),
         ("The circuit is torn down automatically and re-established on "
          "demand", False)],
        "The reservation is held for the duration of the call whether or not "
        "data flows, which is exactly why circuit switching is inefficient "
        "for bursty traffic and why it guarantees constant delay for "
        "constant-rate traffic. Packet switching reserves nothing and "
        "therefore wastes nothing during silence -- and guarantees nothing "
        "when everyone transmits at once."),

    mcq("HARD",
        "Why does an encoding scheme guarantee regular signal transitions?",
        [("To let the receiver recover its clock and stay synchronised", True),
         ("To spread the signal across several frequencies and reduce "
          "interference", False),
         ("To let the receiver detect corrupted bits without a separate "
          "checksum", False),
         ("To keep the average voltage on the medium close to zero over "
          "time", False)],
        "A receiver recovers timing from transitions in the signal, so a long "
        "run of identical bits with no transition lets its clock drift and it "
        "begins sampling at the wrong moments. Manchester encoding guarantees "
        "a transition in every bit and pays for it with twice the signalling "
        "rate for the same data rate -- an explicit trade of efficiency for "
        "synchronisation."),

    mcq("AVERAGE",
        "Which error-handling scheme can correct a single-bit error rather "
        "than only detecting it?",
        [("Hamming code", True),
         ("Cyclic redundancy check, using its remainder", False),
         ("A parity bit appended to each transmitted character", False),
         ("A checksum computed over the whole transmitted block", False)],
        "A Hamming code carries enough redundancy to identify WHICH bit is "
        "wrong, so it can be corrected without retransmission -- at the cost "
        "of more redundant bits. The others detect only. The choice is a "
        "round-trip argument: where retransmission is cheap, detecting and "
        "asking again is more efficient than carrying redundancy on every "
        "transmission."),

    mcq("AVERAGE",
        "How does asynchronous transmission frame data?",
        [("With start and stop bits around each character", True),
         ("With a shared clock signal carried on a separate line", False),
         ("With a length field at the beginning of each block sent", False),
         ("With a fixed time slot allocated to each transmitting "
          "device", False)],
        "Each character is delimited by start and stop bits, so the two ends "
        "need no clock agreement -- which is simple and spends framing "
        "overhead on every single character. Synchronous transmission frames "
        "whole blocks and keeps the ends in step, amortising the overhead "
        "across far more data, which is why high rates require it."),

    mcq("HARD",
        "In a datagram packet network, packets of one conversation may arrive "
        "out of order.\n\nWhy?",
        [("Each packet is routed independently and may take a different "
          "path", True),
         ("Routers deliberately reorder packets to balance load across their "
          "interfaces", False),
         ("Statistical multiplexing assigns later packets to earlier time "
          "slots", False),
         ("Packets are reassembled at each hop, which changes their relative "
          "ordering", False)],
        "A datagram network makes a forwarding decision per packet, so two "
        "packets of the same conversation can follow different routes of "
        "different lengths and arrive in a different order from the one they "
        "were sent in. A virtual circuit establishes one path first and sends "
        "everything along it, preserving order while still sharing capacity "
        "-- a middle position between datagram and circuit switching."),
]

LESSON_NET_COMM = lesson(
    MAJOR, MIDDLE,
    "Data Communication and Control: Encoding, Multiplexing and Switching",
    _comm_quiz,
    lesson_structure(
        "Data Communication and Control: Encoding, Multiplexing and Switching",
        "Beneath the layer model sits the physical problem of representing "
        "bits on a medium and recovering them without the two ends drifting "
        "apart, and this lesson works through it: baseband against broadband, "
        "encodings that exist partly to keep a receiver's clock in step, the "
        "framing and duplex terms the examination defines, the three "
        "multiplexing schemes and what each wastes, circuit against packet "
        "switching as guaranteed quality against efficient sharing, the error "
        "schemes and why CRC suits real media, and the two controls that "
        "sound alike -- flow protecting a receiver, congestion protecting the "
        "network.",
        [
            "Distinguish baseband from broadband transmission",
            "Explain why an encoding must produce transitions for clock "
            "recovery",
            "Contrast synchronous with asynchronous transmission",
            "Distinguish simplex, half duplex and full duplex",
            "Describe the three multiplexing schemes and what each wastes",
            "Contrast circuit with packet switching, and datagram with "
            "virtual circuit",
            "Compare error detection schemes and explain CRC's suitability",
            "Distinguish flow control from congestion control",
        ],
        75,
        _comm_sections,
        [
            ("Baseband",
             "The digital signal placed directly on the medium, which then "
             "carries one signal at a time."),
            ("Broadband",
             "Data modulated onto carrier waves, so several channels share "
             "one medium at different frequencies."),
            ("Clock recovery",
             "The receiver deriving its timing from transitions in the "
             "signal, which is why encodings guarantee them."),
            ("Manchester encoding",
             "A transition in every bit, guaranteeing synchronisation at "
             "twice the signalling rate."),
            ("Asynchronous transmission",
             "Each character framed by start and stop bits, needing no clock "
             "agreement and spending overhead per character."),
            ("Synchronous transmission",
             "Blocks framed and clocked together, amortising overhead and "
             "requiring the ends to stay in step."),
            ("Simplex, half and full duplex",
             "One direction; both alternately; both simultaneously. A hub "
             "forces half, a switch permits full."),
            ("Frequency division multiplexing",
             "Channels allocated frequency bands, transmitting "
             "simultaneously, with guard bands spent on separation."),
            ("Time division multiplexing",
             "Channels allocated repeating time slots, with an idle channel's "
             "slot wasted."),
            ("Statistical multiplexing",
             "Capacity given to whoever has data. Efficient, guarantees "
             "nothing, and congestion is its assumption failing."),
            ("Circuit switching",
             "A path reserved end to end: constant delay, guaranteed "
             "capacity, and silence wasted."),
            ("Packet switching",
             "Packets routed independently over shared capacity: efficient, "
             "with variable and unbounded delay."),
            ("Virtual circuit",
             "A path established first with all packets following it, "
             "preserving order while sharing capacity."),
            ("CRC",
             "Detects burst errors reliably, which is the pattern media "
             "produce. Detects only -- it does not correct."),
            ("Hamming code",
             "Carries enough redundancy to identify and correct a single-bit "
             "error without retransmission."),
            ("Sliding window",
             "Unacknowledged data permitted in flight, so throughput does not "
             "collapse as latency grows."),
            ("Flow control",
             "Protecting a receiver from a faster sender, using a window the "
             "receiver advertises."),
            ("Congestion control",
             "Protecting the network from overload, inferred from loss and "
             "delay because nothing reports it."),
        ],
        "Bits become signals at the physical layer, either baseband -- the "
        "signal itself on the medium -- or broadband, modulated onto carriers "
        "so many channels share it. Encodings exist partly for clock "
        "recovery, since a receiver derives timing from transitions and a "
        "long run of identical bits lets it drift; Manchester guarantees a "
        "transition per bit and pays twice the signalling rate for it. "
        "Asynchronous framing spends start and stop bits per character and "
        "needs no clock agreement; synchronous framing amortises overhead "
        "across a block and requires the ends to stay in step. Simplex, half "
        "and full duplex differ by SIMULTANEITY, which is what a switch "
        "permits and a hub does not. The three multiplexing schemes each "
        "waste something different, and statistical multiplexing achieves its "
        "efficiency precisely by guaranteeing nothing -- congestion being that "
        "assumption failing rather than a fault. Circuit switching reserves "
        "capacity and wastes silence; packet switching shares everything and "
        "guarantees nothing, with virtual circuits sitting between. Among "
        "error schemes, CRC is used because real errors arrive in BURSTS, and "
        "the choice between detecting and correcting is a round-trip "
        "argument. And flow control protects a receiver while congestion "
        "control protects the network -- one advertised, the other inferred "
        "from loss, which is why a lossy wireless link misleads a sender into "
        "slowing down.",
        exam_notes=[
            desc(
                "This lesson supplies definitions the examination asks for "
                "directly, plus one reasoning pattern about throughput "
                "limits."
            ),
            ul([
                "Distinguishing the duplex modes.",
                "Naming a multiplexing scheme and what it wastes.",
                "Contrasting circuit with packet switching.",
                "Choosing between detecting and correcting errors.",
                "Distinguishing flow from congestion control.",
                "Explaining why throughput is low despite ample bandwidth.",
                "Explaining what an encoding does beyond representing bits.",
            ]),
            desc(
                "When adding capacity does not improve throughput, look for "
                "something that does not scale with capacity -- almost always "
                "a round trip. The window item here and the WAN protocol item "
                "in the previous lesson are the same reasoning wearing "
                "different clothes."
            ),
        ],
    ))

LESSONS = [LESSON_NET_ARCH, LESSON_NET_COMM]

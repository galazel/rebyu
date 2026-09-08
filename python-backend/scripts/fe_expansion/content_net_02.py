"""Technology Element -> Network, lessons 3 and 4.

Syllabus minor categories 3 (communications protocols) and 4 (network
management).

The protocol lesson carries the only arithmetic in the network category --
subnetting -- so it is worked rather than stated. The management lesson is
built around the layered isolation procedure, which is the one thing that
turns a vague "the network is slow" into a locatable fault.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Technology Element"
MIDDLE = "Network"

# ==========================================================================
# Lesson 3: Protocols, addressing and routing
# ==========================================================================

_proto_sections = [
    ("What a Protocol Has to Agree", [
        desc(
            "A protocol is an agreement between two parties about how to "
            "communicate, and the syllabus breaks that agreement into three "
            "parts worth naming."
        ),
        table(
            ["Element", "Settles", "Example"],
            [["Syntax", "The format and encoding of messages",
              "Where the header ends and the data begins"],
             ["Semantics", "What each field means and what to do about it",
              "This field is a destination; forward accordingly"],
             ["Timing", "When to send, and how fast",
              "Wait for an acknowledgement before sending more"]],
            caption="Three things every protocol must fix.",
            footer="Two implementations agreeing on syntax and differing on "
                   "semantics interoperate until something unusual happens, "
                   "which is why protocol defects surface at the edges rather "
                   "than in normal use."),
        desc(
            "Protocols are also layered, as the architecture lesson "
            "described. Each provides a service to the layer above using the "
            "one below, which is why HTTP need not know whether it is running "
            "over Ethernet or Wi-Fi and why replacing either changed nothing "
            "for it."
        ),
    ]),

    ("IP: Best Effort by Design", [
        desc(
            "IP delivers packets between networks and promises remarkably "
            "little, which is deliberate rather than a shortcoming."
        ),
        ul([
            "It is CONNECTIONLESS: each packet is routed independently, with "
            "no established path.",
            "It is BEST EFFORT: packets may be lost, duplicated, delayed or "
            "delivered out of order, and IP does not detect or repair any of "
            "it.",
            "It provides addressing and fragmentation, and nothing about "
            "reliability.",
            "Anything requiring reliability builds it at the transport layer "
            "instead.",
        ]),
        desc(
            "This is the END-TO-END argument, and it is the single most "
            "consequential design decision in the certification's networking "
            "material. Reliability implemented in the network would be paid "
            "for by every application including those that do not want it, "
            "and it would still be insufficient, since only the endpoints can "
            "confirm that data arrived where it was actually needed. So the "
            "network stays simple and the endpoints take responsibility."
        ),
        desc(
            "The practical result is a network that scales and a transport "
            "layer that comes in two varieties -- one that adds reliability "
            "and one that does not -- which is precisely the choice the next "
            "section describes."
        ),
    ]),

    ("TCP and UDP", [
        desc(
            "Both transport protocols identify applications by PORT number; "
            "they differ entirely in what else they promise."
        ),
        image(fig("tcp-vs-udp")),
        table(
            ["", "TCP", "UDP"],
            [["Connection", "Established before data", "None"],
             ["Lost data", "Detected and retransmitted",
              "Neither detected nor repaired"],
             ["Ordering", "Restored at the receiver", "Not guaranteed"],
             ["Flow control", "Yes, by advertised window", "None"],
             ["Overhead", "Larger header, and setup round trips",
              "Minimal"],
             ["Suits", "Files, web pages, mail",
              "Live voice and video, DNS queries, telemetry"]],
            caption="Two contracts, and the traffic each fits.",
            footer="The last row is the reasoning, not a list to memorise. "
                   "For live media a retransmitted packet arrives after the "
                   "moment it was needed, so TCP's reliability costs delay "
                   "and buys nothing usable."),
        image(fig("tcp-handshake")),
        desc(
            "The three-way handshake -- SYN, SYN-ACK, ACK -- costs a full "
            "round trip before any data moves, which is why connection setup "
            "dominates the cost of many small requests and why applications "
            "reuse connections rather than opening one per request."
        ),
    ]),

    ("Ports and Sockets", [
        desc(
            "An IP address identifies a machine; a PORT identifies which "
            "application on it, which is how one host runs many services at "
            "once."
        ),
        table(
            ["Port", "Service", "Transport"],
            [["22", "SSH", "TCP"],
             ["25", "SMTP -- sending mail", "TCP"],
             ["53", "DNS", "UDP mostly, TCP for large answers"],
             ["80", "HTTP", "TCP"],
             ["443", "HTTPS", "TCP"]],
            caption="The well-known ports the examination expects.",
            footer="Port 53 using both is worth remembering as an "
                   "illustration rather than a special case: DNS uses UDP for "
                   "speed on small queries and falls back to TCP when the "
                   "answer will not fit."),
        desc(
            "A SOCKET is the combination of an address and a port, and a "
            "connection is identified by the pair of them -- source address, "
            "source port, destination address, destination port. That "
            "four-part identity is how a server distinguishes thousands of "
            "simultaneous connections that all arrive at the same port."
        ),
    ]),

    ("IP Addressing and Subnet Masks", [
        desc(
            "An IPv4 address is 32 bits, written as four decimal numbers, and "
            "it divides into a network part and a host part."
        ),
        image(fig("ip-addressing")),
        desc(
            "The SUBNET MASK says where that division falls. A mask of "
            "255.255.255.0 -- written /24 -- means the first 24 bits identify "
            "the network and the remaining 8 identify a host on it. Moving "
            "the boundary right gives more hosts per network and fewer "
            "networks; moving it left does the reverse."
        ),
        table(
            ["Prefix", "Mask", "Total addresses", "Usable hosts"],
            [["/24", "255.255.255.0", "256", "254"],
             ["/25", "255.255.255.128", "128", "126"],
             ["/26", "255.255.255.192", "64", "62"],
             ["/27", "255.255.255.224", "32", "30"],
             ["/28", "255.255.255.240", "16", "14"]],
            caption="Five common prefixes, with the arithmetic worked out.",
            footer="Usable is always total MINUS TWO. The all-zeros host part "
                   "is the network address itself and the all-ones is the "
                   "broadcast address, so neither can be assigned to a "
                   "machine."),
        desc(
            "That subtraction is the most reliably examined arithmetic in the "
            "whole network category. An item asking how many hosts a /26 "
            "supports wants 62, not 64, and the two available choices will "
            "both appear."
        ),
    ]),

    ("Working a Subnetting Question", [
        desc(
            "\"A site needs six subnets of at most 25 hosts each, from a /24. "
            "Which prefix, and how many addresses are wasted?\""
        ),
        ol([
            "Size for the HOSTS first. 25 hosts needs 27 addresses including "
            "the network and broadcast, so the host part must hold at least "
            "27 -- and 2^5 = 32 is the smallest power of two that does.",
            "Five host bits leaves 32 - 5 = 27 network bits, so the prefix is "
            "/27.",
            "Check the subnet count. A /24 split into /27 gives 2^3 = 8 "
            "subnets, which covers the six required.",
            "Each /27 has 32 addresses, of which 30 are usable and 25 are "
            "needed, so 5 are spare in each of the six -- 30 addresses.",
            "Two entire subnets are also unused, at 32 each, so 64 more. The "
            "total unused is 94 addresses of the original 256.",
        ]),
        desc(
            "Step one is where these are won or lost. Sizing by hosts and "
            "then checking the subnet count works; sizing by subnet count "
            "first frequently produces a prefix with too few host addresses, "
            "and the error is not visible until the subnets are populated."
        ),
    ]),

    ("Private Addresses and NAT", [
        desc(
            "There are not enough IPv4 addresses for every device, and the "
            "syllabus covers the two mechanisms that made that survivable."
        ),
        ul([
            "Certain ranges -- 10.x, 172.16-31.x, 192.168.x -- are PRIVATE "
            "and are not routed on the public internet, so any organisation "
            "may use them internally.",
            "NAT translates private addresses to a public one at the network "
            "boundary, so many internal devices share few public addresses.",
            "The translation table remembers which internal conversation each "
            "translated port belongs to, so replies can be returned "
            "correctly.",
            "A device behind NAT can start a conversation outward and cannot "
            "be reached inward unless something is configured to forward it.",
        ]),
        desc(
            "That last property is worth being precise about. NAT is "
            "frequently described as a security measure, and its inbound "
            "obstruction is a side effect of address translation rather than "
            "a security policy -- it makes no decisions about what traffic "
            "should be allowed, so a firewall is still required and NAT is "
            "not a substitute for one."
        ),
        desc(
            "IPv6, with its 128-bit addresses, removes the shortage entirely "
            "and therefore removes the need for NAT. The transition is slow "
            "because both stacks must be supported during it, which is why "
            "dual-stack operation appears in the syllabus at all."
        ),
    ]),

    ("Routing", [
        desc(
            "Routers forward packets between networks, and no router knows "
            "the whole path -- only the next hop."
        ),
        image(fig("routing-decision")),
        desc(
            "The forwarding decision applies each table entry's mask to the "
            "destination and takes the LONGEST matching prefix, because a "
            "more specific route describes a smaller and better-known region "
            "of the address space. A DEFAULT ROUTE is the shortest possible "
            "match and is used when nothing more specific applies."
        ),
        desc(
            "Because each router decides independently, a set of inconsistent "
            "tables can send a packet in a circle. The TIME TO LIVE field is "
            "decremented at every hop and the packet is discarded at zero, "
            "which bounds the damage a routing loop can do without preventing "
            "the loop itself."
        ),
        compare_grid(
            "STATIC AGAINST DYNAMIC ROUTING",
            "Who maintains the table.",
            [("Static",
              ["Entries configured by an administrator",
               "Entirely predictable",
               "No protocol overhead at all",
               "Does not react to a failed link"]),
             ("Dynamic",
              ["Routers exchange reachability information",
               "Adapts automatically to failures",
               "Costs bandwidth and processing",
               "Can converge slowly, misrouting meanwhile"])]),
    ]),

    ("Routing Protocols", [
        desc(
            "The syllabus names two families of dynamic protocol, "
            "distinguished by what each router actually knows."
        ),
        table(
            ["", "Distance vector", "Link state"],
            [["Each router knows", "Distances reported by neighbours",
              "The whole topology"],
             ["Shares", "Its table, with neighbours",
              "Link status, with everyone"],
             ["Computes", "By trusting neighbours' totals",
              "Shortest paths itself"],
             ["Converges", "Slowly, and can loop meanwhile", "Quickly"],
             ["Example", "RIP", "OSPF"]],
            caption="Two approaches, and why one replaced the other in large "
                    "networks.",
            footer="A distance-vector router believes what its neighbours "
                   "tell it without knowing why, so bad information "
                   "propagates before it can be contradicted. A link-state "
                   "router holds the map and recomputes, which is why it "
                   "converges without looping."),
        desc(
            "The syllabus also distinguishes INTERIOR from EXTERIOR "
            "protocols. Interior protocols route within one organisation and "
            "optimise for shortest path; exterior protocols -- BGP -- route "
            "between organisations and optimise for policy, since which "
            "carrier's network traffic crosses is a commercial question "
            "rather than a distance one."
        ),
    ]),

    ("Address Assignment", [
        desc(
            "Addresses have to reach the devices that use them, and the "
            "syllabus names two ways with different consequences."
        ),
        compare_grid(
            "STATIC AGAINST DYNAMIC ASSIGNMENT",
            "Configured by hand, or handed out on request.",
            [("Static",
              ["Configured on the device itself",
               "The address never changes, so it can be relied on",
               "Every change is manual work",
               "Right for servers, printers and network equipment"]),
             ("Dynamic -- DHCP",
              ["Requested from a server as the device joins",
               "The address may differ each time",
               "Nothing to configure per device",
               "Right for laptops, phones and anything transient"])]),
        desc(
            "DHCP supplies more than an address. It also provides the subnet "
            "mask, the default gateway and the DNS servers, which is why a "
            "failure of the DHCP service presents as devices that appear "
            "configured and can reach nothing -- they have an address from a "
            "fallback range with no gateway to use it through."
        ),
        desc(
            "A RESERVATION is the useful middle position: the device uses "
            "DHCP and the server always gives it the same address, so the "
            "address is predictable and still administered centrally rather "
            "than on each machine."
        ),
    ]),

    ("IPv6", [
        desc(
            "IPv4's 32-bit address space is exhausted, and IPv6 is the "
            "replacement the syllabus expects in outline."
        ),
        table(
            ["", "IPv4", "IPv6"],
            [["Address length", "32 bits", "128 bits"],
             ["Written as", "Four decimal numbers",
              "Eight groups of hexadecimal"],
             ["Address supply", "Exhausted", "Effectively unlimited"],
             ["NAT", "Necessary", "Unnecessary"],
             ["Configuration", "DHCP or manual",
              "Can configure itself from the network prefix"],
             ["Broadcast", "Yes", "Replaced by multicast"]],
            caption="Six differences the examination draws on.",
            footer="The address length is the answer to most IPv6 items, and "
                   "the second-most useful fact is that abundant addresses "
                   "remove the NEED for NAT -- which removes the inbound "
                   "obstruction people had come to rely on, making the "
                   "firewall's role explicit again."),
        desc(
            "Transition is slow because the two protocols do not interoperate "
            "directly: an IPv6-only host cannot speak to an IPv4-only one "
            "without translation. DUAL STACK -- running both at once -- is "
            "the usual approach, and it means carrying the complexity of both "
            "for as long as the transition lasts."
        ),
    ]),

    ("ICMP and the Supporting Protocols", [
        desc(
            "Alongside IP sit several small protocols that carry no user data "
            "and without which nothing works."
        ),
        table(
            ["Protocol", "Does", "Seen as"],
            [["ARP", "Finds the MAC address for a local IP address",
              "Silent, until an address conflict"],
             ["ICMP", "Reports delivery problems and tests reachability",
              "ping and traceroute output"],
             ["DHCP", "Supplies address, mask, gateway and DNS servers",
              "Devices that join and simply work"],
             ["DNS", "Resolves names to addresses",
              "Everything, since almost nothing uses addresses directly"]],
            caption="Four protocols that carry no payload and enable all of "
                    "it.",
            footer="ICMP is a REPORTING protocol rather than a transport one. "
                   "It tells a sender that a destination was unreachable or a "
                   "TTL expired, which is what ping and traceroute exploit "
                   "rather than what it exists for."),
        desc(
            "Because ICMP is frequently filtered, several useful messages are "
            "lost along with the ones people intend to block -- most "
            "notably the one reporting that a packet was too large to "
            "forward. Blocking ICMP wholesale therefore produces "
            "connections that establish and then hang on larger transfers, "
            "which is a genuinely difficult fault to trace back to a "
            "firewall rule."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where protocol items are lost."),
        ul([
            "Forgetting to subtract two when counting usable hosts. A /26 "
            "supports 62, not 64.",
            "Sizing a subnet by the number of subnets before the number of "
            "hosts.",
            "Expecting IP to provide reliability. It is best effort by "
            "design, and TCP supplies the rest.",
            "Choosing TCP for live media. A retransmission arrives after the "
            "moment it was needed.",
            "Treating NAT as a firewall. Its inbound obstruction is a side "
            "effect, and it makes no policy decisions.",
            "Assuming a router knows the whole path. It knows the next hop, "
            "which is why TTL exists.",
            "Confusing distance vector with link state. Only link state holds "
            "the topology.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A video conferencing application uses UDP. A network engineer "
            "proposes switching it to TCP so that lost packets are "
            "retransmitted. Evaluate the proposal.\""
        ),
        ol([
            "Establish what TCP would add: detection of loss, retransmission, "
            "and restored ordering.",
            "Establish the application's requirement: audio and video must be "
            "played at a steady rate, in real time.",
            "A retransmitted packet arrives at least one round trip late, by "
            "which point its moment in the stream has passed.",
            "So the retransmitted data is unusable, and the delay waiting for "
            "it disrupts the packets that did arrive on time.",
            "The proposal would therefore make quality worse, not better. The "
            "correct response to loss here is concealment in the codec, or "
            "quality-of-service marking to reduce loss in the first place.",
        ]),
        desc(
            "The general form is worth extracting: reliability is only "
            "valuable where late data is still useful. That single test "
            "decides every TCP-against-UDP item in the syllabus, and it "
            "explains why the choice is about the application's tolerance "
            "rather than about the network's quality."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Protocols tie the network category to several others."),
        ul([
            "Layering and encapsulation come from the architecture lesson.",
            "Binary and masks are the number-base work of Basic Theory.",
            "The end-to-end argument is the same separation of concerns the "
            "Software lessons apply to layered design.",
            "Ports as service identifiers are what a firewall filters on in "
            "the Security lessons.",
            "NAT's address exhaustion motivation recurs in System Planning.",
            "Routing convergence time is an availability figure in Service "
            "Management.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Usable hosts in a /26",
              "62 -- total minus two",
              "The network address and the broadcast address cannot be "
              "assigned, and both 62 and 64 will be offered."),
             ("What IP guarantees",
              "Almost nothing -- best effort, connectionless",
              "Deliberately, so the network stays simple and endpoints add "
              "what they need."),
             ("When UDP beats TCP",
              "When late data is useless",
              "A retransmission for live media arrives after its moment, so "
              "reliability costs delay and buys nothing."),
             ("How a router chooses an entry",
              "Longest matching prefix",
              "A more specific route describes a better-known region; the "
              "default route is the shortest match."),
             ("Why TTL exists",
              "To bound a routing loop",
              "No router knows the whole path, so inconsistent tables can "
              "circulate a packet."),
             ("Distance vector against link state",
              "Trusting neighbours' totals, against holding the map",
              "Which is why one converges slowly and can loop and the other "
              "does not.")]),
    ]),
]

_proto_quiz = [
    mcq("HARD",
        "A site is allocated a /24 and must be divided into subnets of at "
        "least 25 usable hosts each.\n\nWhat is the smallest suitable prefix?",
        [("/26", False),
         ("/27", True),
         ("/28", False),
         ("/25", False)],
        "Twenty-five hosts requires 27 addresses once the network and "
        "broadcast addresses are added, so the host part needs 5 bits giving "
        "32 addresses and 30 usable. That leaves 27 network bits, a /27. A "
        "/28 offers only 14 usable and is too small; a /26 works and is not "
        "the SMALLEST suitable, which is what the item asks for. Always size "
        "by hosts before checking the subnet count."),

    mcq("AVERAGE",
        "How many usable host addresses does a /26 subnet provide?",
        [("64", False),
         ("62", True),
         ("of the 64 total, all but the gateway address, so 63", False),
         ("30", False)],
        "A /26 leaves 6 host bits, giving 64 total addresses. The all-zeros "
        "host part is the network address and the all-ones is the broadcast "
        "address, and neither can be assigned to a machine -- so 62 remain. "
        "Subtracting two is the most reliably examined arithmetic in this "
        "category, and both 62 and 64 will appear among the options."),

    mcq("HARD",
        "A video conferencing application uses UDP. Switching it to TCP is "
        "proposed so lost packets are retransmitted.\n\n"
        "What is the effect?",
        [("Quality improves, since no audio or video data is lost any "
          "more", False),
         ("Quality worsens, since retransmitted data arrives after the moment "
          "it was needed", True),
         ("Quality is unchanged, because the loss rate on the path stays the "
          "same either way", False),
         ("Quality improves only if the network's round-trip time is below "
          "the frame interval", False)],
        "Real-time media must be played at a steady rate, so a packet "
        "retransmitted a round trip later has already missed its slot and is "
        "unusable -- while waiting for it disrupts the packets that arrived "
        "on time. Reliability is worth having only where late data is still "
        "useful, which is the test that decides every TCP-against-UDP item. "
        "Loss here is better handled by codec concealment or QoS marking."),

    mcq("AVERAGE",
        "What guarantees does IP provide about packet delivery?",
        [("Reliable, ordered delivery between two hosts", False),
         ("None -- it is connectionless and best effort", True),
         ("Ordered delivery, with loss detection left to the "
          "application", False),
         ("Reliable delivery, provided every router on the path supports "
          "it", False)],
        "IP routes each packet independently and does not detect or repair "
        "loss, duplication, delay or reordering. This is deliberate: putting "
        "reliability in the network would charge every application for it "
        "including those that do not want it, and only the endpoints can "
        "confirm data arrived where it was needed. That end-to-end argument "
        "is why the network stays simple and TCP exists."),

    mcq("AVERAGE",
        "How does a router select an entry when several match a destination "
        "address?",
        [("The longest matching prefix", True),
         ("The entry that was most recently added to the routing "
          "table", False),
         ("The entry whose next hop has the lowest measured round-trip "
          "time", False),
         ("The default route, since it matches every destination", False)],
        "A longer prefix is a more specific route describing a smaller and "
        "better-known region of the address space, so it is preferred over "
        "any broader match. The default route is the shortest possible prefix "
        "and is therefore chosen only when nothing more specific applies, "
        "which is exactly the behaviour wanted from a route of last resort."),

    mcq("HARD",
        "Why does an IP packet carry a time-to-live field?",
        [("To discard a packet circulating in a routing loop", True),
         ("To ensure real-time traffic is discarded once it is too late to "
          "use", False),
         ("To limit how long a router may hold a packet in its output "
          "queue", False),
         ("To let the receiver reassemble fragments arriving over an extended "
          "period", False)],
        "No router knows the whole path -- each knows only its next hop -- so "
        "inconsistent tables can send a packet in a circle. TTL is "
        "decremented at every hop and the packet discarded at zero, bounding "
        "the damage a loop causes without preventing the loop itself. It "
        "counts HOPS rather than measuring time, despite the name."),

    mcq("AVERAGE",
        "What is a socket in TCP/IP terms?",
        [("The combination of an IP address and a port number", True),
         ("The physical connector into which a network cable is "
          "inserted", False),
         ("A buffer holding data waiting to be sent by an application", False),
         ("The table mapping internal addresses to external ones under "
          "NAT", False)],
        "An address identifies a machine and a port identifies which "
        "application on it, so the pair identifies one endpoint of a "
        "conversation. A connection is identified by BOTH endpoints -- source "
        "address, source port, destination address, destination port -- which "
        "is how a server distinguishes thousands of simultaneous connections "
        "all arriving at the same port."),

    mcq("HARD",
        "Why is NAT not a substitute for a firewall?",
        [("It encrypts nothing, so traffic can still be read in "
          "transit", False),
         ("It obstructs inbound connections as a side effect and makes no "
          "policy decisions", True),
         ("It operates at the transport layer, while firewalls operate at the "
          "network layer", False),
         ("It can be disabled remotely by an attacker who reaches the "
          "translating device", False)],
        "NAT exists to share scarce public addresses, and its obstruction of "
        "unsolicited inbound traffic falls out of having no translation entry "
        "for it. It applies no rules about which traffic should be permitted, "
        "inspects nothing, and does not restrict outbound traffic at all -- "
        "so a firewall is still required. The security benefit is incidental "
        "rather than designed."),

    mcq("AVERAGE",
        "What distinguishes a link-state routing protocol from a distance "
        "vector one?",
        [("Link state routers hold the whole topology and compute paths "
          "themselves", True),
         ("Link state protocols operate between organisations rather than "
          "within one", False),
         ("Link state protocols use static entries configured by an "
          "administrator", False),
         ("Link state routers exchange their complete routing tables with "
          "neighbours", False)],
        "A link-state router learns the status of every link and computes "
        "shortest paths from that map, so it converges quickly and without "
        "looping. A distance-vector router knows only the distances its "
        "neighbours report and trusts them without knowing why -- which lets "
        "bad information propagate before anything can contradict it. "
        "Exchanging complete tables with neighbours describes distance "
        "vector."),

    mcq("AVERAGE",
        "Which port does HTTPS use by default?",
        [("443", True),
         ("80, with encryption negotiated after the connection opens", False),
         ("22, which it shares with other encrypted protocols", False),
         ("53, using TCP rather than UDP for the exchange", False)],
        "HTTPS uses TCP port 443 and plain HTTP uses 80. Port 22 is SSH, and "
        "53 is DNS -- which is worth noting as the illustration it is, since "
        "DNS uses UDP for small queries and falls back to TCP when an answer "
        "will not fit. Knowing the well-known ports is what lets a firewall "
        "item be answered at all."),
]

LESSON_NET_PROTO = lesson(
    MAJOR, MIDDLE,
    "Communications Protocols: TCP/IP, Addressing and Routing",
    _proto_quiz,
    lesson_structure(
        "Communications Protocols: TCP/IP, Addressing and Routing",
        "This lesson works through the protocols the examination names and "
        "the only arithmetic the network category contains. IP promises "
        "almost nothing on purpose, which is the end-to-end argument and the "
        "reason the transport layer comes in two varieties: TCP adding "
        "reliability at the cost of round trips, UDP adding nothing and "
        "therefore suiting traffic where late data is useless. Addressing "
        "covers masks, the subtraction of two that decides most subnetting "
        "items, a fully worked subnetting question, and the private "
        "addresses and NAT that made IPv4 survivable -- followed by routing "
        "by longest prefix, why TTL exists, and the two families of dynamic "
        "routing protocol.",
        [
            "Name the three elements every protocol must agree",
            "Explain IP's best-effort model and the end-to-end argument",
            "Choose between TCP and UDP for a described application",
            "Explain ports, sockets and the well-known port numbers",
            "Calculate usable hosts and select a prefix for a stated "
            "requirement",
            "Explain private addressing, NAT, and why NAT is not a firewall",
            "Describe the forwarding decision and the purpose of TTL",
            "Distinguish distance vector from link state routing",
        ],
        85,
        _proto_sections,
        [
            ("Syntax, semantics and timing",
             "The three things every protocol must agree: message format, "
             "field meaning, and when to send."),
            ("Best effort",
             "IP's contract: packets may be lost, duplicated, delayed or "
             "reordered, and IP repairs none of it."),
            ("End-to-end argument",
             "Reliability belongs at the endpoints, since only they can "
             "confirm delivery and not every application wants the cost."),
            ("TCP",
             "Connection-oriented, reliable, ordered and flow-controlled, at "
             "the cost of setup round trips and header size."),
            ("UDP",
             "Connectionless and unchecked. Right wherever late data is "
             "useless, such as live media."),
            ("Three-way handshake",
             "SYN, SYN-ACK, ACK -- a full round trip before data moves, which "
             "is why connections are reused."),
            ("Port",
             "Identifies which application on a host. A socket is address "
             "plus port; a connection is identified by both endpoints."),
            ("Subnet mask",
             "Marks where an address divides into network and host parts. "
             "/24 is 255.255.255.0."),
            ("Usable hosts",
             "Total addresses minus two -- the network address and the "
             "broadcast address cannot be assigned."),
            ("Private addresses",
             "10.x, 172.16-31.x and 192.168.x, not routed publicly, so any "
             "organisation may use them internally."),
            ("NAT",
             "Translating private addresses to public ones at the boundary. "
             "Its inbound obstruction is a side effect, not a policy."),
            ("Longest prefix match",
             "The forwarding rule: the most specific matching route wins, "
             "with the default route as the shortest match."),
            ("Time to live",
             "Decremented at each hop and discarded at zero, bounding a "
             "routing loop's damage."),
            ("Distance vector",
             "Routers trust distances reported by neighbours. Converges "
             "slowly and can loop meanwhile. RIP."),
            ("Link state",
             "Routers hold the whole topology and compute paths themselves. "
             "Converges quickly. OSPF."),
        ],
        "A protocol fixes syntax, semantics and timing, and IP fixes "
        "remarkably little else: it is connectionless and best effort, "
        "repairing no loss, duplication or reordering. That is the end-to-end "
        "argument -- reliability in the network would charge every "
        "application for it and still be insufficient, since only endpoints "
        "can confirm arrival -- and it is why the transport layer offers a "
        "choice. TCP adds reliability, ordering and flow control at the cost "
        "of a handshake and larger headers; UDP adds nothing, which is right "
        "wherever late data is useless, because a retransmitted media packet "
        "has already missed its moment. Ports identify applications, a socket "
        "is address plus port, and a connection is identified by both "
        "endpoints. Addressing divides at the subnet mask, and usable hosts "
        "is always total MINUS TWO -- so a /26 supports 62 -- with subnetting "
        "questions sized by hosts first and checked against the subnet count "
        "afterwards. Private ranges plus NAT postponed IPv4 exhaustion, and "
        "NAT's obstruction of inbound traffic is a side effect rather than a "
        "policy, so it does not replace a firewall. Routers forward by "
        "longest matching prefix knowing only the next hop, which is why TTL "
        "bounds a loop; and dynamic routing divides into distance vector, "
        "trusting neighbours' totals, and link state, holding the map and "
        "converging without looping.",
        exam_notes=[
            desc(
                "This lesson supplies the category's arithmetic and its most "
                "reusable judgement -- when reliability is worth paying for."
            ),
            ul([
                "Calculating usable hosts for a prefix.",
                "Selecting the smallest prefix meeting a host requirement.",
                "Choosing TCP or UDP for a described application.",
                "Explaining what IP does and does not guarantee.",
                "Explaining longest prefix match or TTL.",
                "Distinguishing distance vector from link state.",
                "Explaining what NAT does and does not provide.",
            ]),
            desc(
                "On any subnetting item, size for HOSTS first and check the "
                "subnet count afterwards, then subtract two. Working the "
                "other way round produces a prefix with too few host "
                "addresses, and the error is invisible until the answer is "
                "already chosen."
            ),
        ],
    ))

# ==========================================================================
# Lesson 4: Network management and troubleshooting
# ==========================================================================

_mgmt_sections = [
    ("What Managing a Network Involves", [
        desc(
            "Once a network exists, somebody is answerable for it continuing "
            "to work, and the syllabus organises that responsibility into "
            "five areas."
        ),
        table(
            ["Area", "Concerns", "Typical activity"],
            [["Fault", "Detecting and fixing failures",
              "Alerting, diagnosis, repair"],
             ["Configuration", "What the devices are set to",
              "Recording, changing, and reverting"],
             ["Accounting", "Who used what",
              "Usage measurement and chargeback"],
             ["Performance", "Whether it is fast enough",
              "Baselining, trending, capacity planning"],
             ["Security", "Who may do what",
              "Access control, monitoring, response"]],
            caption="The five functional areas of network management.",
            footer="The mnemonic FCAPS names them in this order. They overlap "
                   "in practice -- a configuration error is discovered as a "
                   "fault and may be a security incident -- which is why the "
                   "areas are responsibilities rather than teams."),
    ]),

    ("Monitoring", [
        desc(
            "Managing a network requires knowing its state, and the syllabus "
            "names the mechanisms by which that is gathered."
        ),
        content_accordion(
            "WHAT MONITORING ACTUALLY COLLECTS",
            "Four sources, answering different questions.",
            [("SNMP polling",
              "A manager periodically asks each device for counters held in "
              "its management information base -- interface throughput, "
              "errors, uptime. Regular, predictable, and only as current as "
              "the polling interval."),
             ("SNMP traps",
              "A device reports an event without being asked, so a failure is "
              "known immediately rather than at the next poll. A trap that is "
              "lost is simply never delivered, which is why polling is not "
              "abandoned."),
             ("Flow records",
              "Summaries of which conversations crossed a device and how much "
              "each carried. Answers 'what is using the capacity', which "
              "counters cannot."),
             ("Logs",
              "What devices and services recorded about their own behaviour. "
              "Essential for diagnosis and for security investigation, and "
              "useless if the clocks disagree.")]),
        desc(
            "The clock point is not incidental. Correlating events across "
            "devices requires their timestamps to be comparable, so "
            "synchronising time across the estate is a prerequisite for "
            "diagnosis rather than a refinement of it -- which is why a time "
            "protocol is standard infrastructure."
        ),
    ]),

    ("Baselines", [
        desc(
            "Almost every performance question is comparative, and a "
            "comparison requires something to compare against."
        ),
        desc(
            "A BASELINE records what normal looks like -- typical utilisation "
            "by hour and day, typical latency, typical error rates. Without "
            "one, a report that the network is slow cannot be evaluated at "
            "all, because nobody can say whether the current figures are "
            "unusual."
        ),
        ul([
            "Baselines make a gradual degradation visible, which is exactly "
            "the kind nobody notices day to day.",
            "They convert capacity planning from opinion into extrapolation, "
            "since growth can be measured rather than guessed.",
            "They are what an alerting threshold should be derived from, "
            "rather than from a round number somebody liked.",
            "They must be refreshed, since a baseline taken before a major "
            "change describes a network that no longer exists.",
        ]),
        desc(
            "The examinable point is the first one. A failure is noticed "
            "immediately and a slow decline is not, so the value of a "
            "baseline is mostly in detecting the second kind -- and a "
            "monitoring regime with no baseline detects only outages."
        ),
    ]),

    ("Isolating a Fault", [
        desc(
            "A report that 'the network is down' describes a symptom with a "
            "dozen possible causes, and the layered model turns it into a "
            "sequence of tests."
        ),
        image(fig("net-troubleshooting")),
        ol([
            "Is the interface up at all? A physical problem invalidates every "
            "test above it.",
            "Does the host have a correct address, mask and gateway? A wrong "
            "mask makes local destinations look remote.",
            "Can it reach its own gateway? This separates the local network "
            "from everything beyond.",
            "Can it reach something past the gateway by address? This tests "
            "routing without involving names.",
            "Can it resolve a name? A failure only here is DNS, not the "
            "network.",
            "Can it reach the service's port? The path works; the question is "
            "now the service or a firewall.",
        ]),
        desc(
            "Working upward is what makes this efficient. Each passing test "
            "eliminates a whole layer of possible causes, whereas starting at "
            "the application tests something with a dozen causes underneath it "
            "and tells you almost nothing when it fails."
        ),
    ]),

    ("The Diagnostic Tools", [
        desc(
            "The syllabus expects a handful of tools by name and, more "
            "importantly, by what each one actually proves."
        ),
        table(
            ["Tool", "Tests", "A failure means"],
            [["ping", "Reachability and round-trip time",
              "No path, or ICMP is blocked -- not necessarily no service"],
             ["traceroute", "The path, hop by hop",
              "Where the path stops, though later hops may simply not "
              "reply"],
             ["nslookup / dig", "Name resolution only",
              "DNS, and nothing about connectivity"],
             ["netstat", "Local connections and listening ports",
              "The service is not listening where expected"],
             ["Packet capture", "What is actually on the wire",
              "The last resort, and the only unambiguous evidence"]],
            caption="Five tools and the exact scope of what each proves.",
            footer="The middle column is narrower than people assume. A "
                   "failed ping does not prove a host is down -- many hosts "
                   "and firewalls decline ICMP by policy while serving "
                   "traffic normally."),
        desc(
            "That caveat generalises into the most useful habit in "
            "diagnosis: know what a negative result actually excludes. A tool "
            "reporting failure has told you one specific thing failed, and "
            "concluding more than that is where diagnosis goes wrong."
        ),
    ]),

    ("Reading a Traceroute", [
        desc(
            "Traceroute output is examined because interpreting it requires "
            "understanding how it works rather than merely what it prints."
        ),
        desc(
            "It sends packets with increasing TTL values, so each router in "
            "turn discards one and reports doing so -- which is how the path "
            "is discovered without any router being asked directly. It is the "
            "one place TTL is used deliberately rather than as a safeguard."
        ),
        ul([
            "A hop showing no reply is often a router configured not to "
            "respond, and if later hops reply the path is fine.",
            "A jump in latency at one hop is normal if it crosses a long "
            "link; what matters is whether it persists at every later hop.",
            "Latency that rises and falls between hops reflects different "
            "routers' willingness to generate replies, not a network fault.",
            "The path may differ in each direction, so a problem visible one "
            "way may be invisible from the other end.",
        ]),
        desc(
            "The second and third points prevent the usual misreading. "
            "Traceroute measures the round trip to each hop independently, "
            "and a router deprioritising the replies it generates can look "
            "slow while forwarding traffic perfectly -- so only a delay that "
            "persists through subsequent hops indicates a real problem."
        ),
    ]),

    ("Change and Configuration Management", [
        desc(
            "Most network incidents follow a change, which is why controlling "
            "changes is a management discipline rather than an "
            "administrative one."
        ),
        ul([
            "Keep configurations under version control, so what changed and "
            "when is answerable rather than reconstructed.",
            "Have a tested way back before making a change, since discovering "
            "one is needed during an outage is too late.",
            "Change one thing at a time where possible, because two "
            "simultaneous changes make attribution impossible.",
            "Schedule disruptive work for known windows, and tell people.",
            "Record the actual state, not the intended state -- documentation "
            "describing what was planned is worse than none, because it is "
            "trusted.",
        ]),
        desc(
            "The last point is where most documentation fails. A diagram "
            "showing the network as designed, diverged from over two years, "
            "actively misleads the person diagnosing an outage at three in "
            "the morning -- which is the specific circumstance documentation "
            "exists for."
        ),
    ]),

    ("Alerting", [
        desc(
            "Monitoring that nobody looks at is not monitoring, so the "
            "collected data has to become notification -- and notification "
            "has its own failure mode."
        ),
        ul([
            "A threshold should come from the baseline, since a round number "
            "somebody liked is not evidence of anything.",
            "An alert that fires routinely trains people to ignore it, which "
            "is worse than not having it at all.",
            "Alerts should describe an impact rather than a measurement, "
            "because 'the interface is at 80%' does not say whether anything "
            "is wrong.",
            "Suppress the symptoms of a known cause: one failed link "
            "generating fifty alerts buries the one that matters.",
            "Every alert needs somebody who will act on it, or it should not "
            "exist.",
        ]),
        desc(
            "ALERT FATIGUE is the examinable failure. A monitoring system "
            "that cries wolf is reliably ignored, so the real outage arrives "
            "amid noise nobody reads -- which means tuning thresholds down is "
            "a safety measure rather than a convenience."
        ),
    ]),

    ("Capacity Management", [
        desc(
            "Performance management looks forward as well as backward, and "
            "the syllabus expects the forward-looking half."
        ),
        ol([
            "Measure current utilisation against the baseline, by hour and "
            "day rather than as an average.",
            "Identify the trend, since growth is usually steady enough to "
            "extrapolate.",
            "Project when the trend meets the capacity limit.",
            "Work back from that date through procurement and installation "
            "lead times.",
            "Act at the point that leaves enough margin, not at the point the "
            "limit is reached.",
        ]),
        desc(
            "Averages are the trap here. A link averaging 40 per cent may be "
            "saturated for two hours every weekday, and users experience the "
            "peak rather than the mean -- so capacity is planned against the "
            "busy period, and an average is evidence of very little."
        ),
        desc(
            "Growth is also not the only driver. A change in how the network "
            "is used -- a move to hosted applications, a new video system -- "
            "shifts demand faster than any trend predicts, which is why "
            "capacity planning belongs alongside the planning of those "
            "changes rather than after them."
        ),
    ]),

    ("Redundancy and Recovery", [
        desc(
            "Some failures should not become outages, and designing for that "
            "is a management decision about cost as much as a technical one."
        ),
        table(
            ["Failure", "Mitigation", "Recovers in"],
            [["A single cable or port", "A second path, automatically used",
              "Seconds, if routing converges"],
             ["A whole device", "A standby device taking over",
              "Seconds to minutes"],
             ["A carrier link", "A second link, ideally another carrier",
              "Depends on routing policy"],
             ["A site", "A second site with its own connectivity",
              "Hours, and only if planned"]],
            caption="Four failure scopes, and what covers each.",
            footer="Redundancy only helps if the failure is actually "
                   "independent. Two links from the same carrier in the same "
                   "duct fail together, which is why 'diverse routing' means "
                   "physically diverse and not merely two contracts."),
        desc(
            "The examinable judgement is that redundancy must be TESTED. An "
            "untested standby is an assumption, and the moment of a real "
            "failure is when its configuration drift, expired certificate or "
            "stale routing table is discovered."
        ),
    ]),

    ("Wireless Troubleshooting", [
        desc(
            "Wireless problems present differently from wired ones, and the "
            "syllabus treats them separately because the usual reasoning does "
            "not transfer."
        ),
        content_tabs(
            "THREE WIRELESS SYMPTOMS",
            "What each usually means when a wired network would suggest "
            "otherwise.",
            [("Slow for everyone in one area",
              "shared medium, not a slow link",
              "Capacity is shared among everyone in range, so an area that is "
              "fine at nine and unusable at eleven is contended rather than "
              "faulty. Adding an access point on a different channel helps; "
              "adding one on the same channel makes it worse."),
             ("Intermittent for one user",
              "signal strength or interference",
              "Distance, walls and other equipment on the same frequencies "
              "all reduce the usable rate. The device may hold its "
              "association while the effective rate collapses, so it appears "
              "connected and works badly."),
             ("Connects then drops repeatedly",
              "roaming or authentication",
              "A device at the boundary between two access points may "
              "reassociate repeatedly, and each reassociation interrupts "
              "traffic. Authentication failing intermittently produces the "
              "same visible symptom from an entirely different cause.")]),
        desc(
            "The unifying point is that a wireless client can be associated "
            "and effectively unusable, so 'it says it is connected' excludes "
            "far less here than on a wired link -- which is the same "
            "principle as the ping caveat, applied to a different piece of "
            "evidence."
        ),
    ]),

    ("Recording an Incident", [
        desc(
            "Diagnosis produces knowledge, and knowledge that is not written "
            "down is rediscovered at the same cost the next time."
        ),
        ul([
            "Record the symptom as reported, since the report is what the "
            "next similar case will resemble.",
            "Record what was tested and what each test excluded, which is "
            "more reusable than the conclusion alone.",
            "Record the actual cause, distinguishing it from the trigger -- a "
            "change may reveal a weakness rather than create one.",
            "Record what was changed to resolve it, including anything "
            "changed and reverted along the way.",
            "Feed durable fixes back into configuration and monitoring, so "
            "the same fault is detected sooner or prevented.",
        ]),
        desc(
            "The distinction between cause and trigger is where these records "
            "earn their value. Recording that a change broke something "
            "invites banning the change; recording that the change exposed a "
            "missing redundant path invites fixing the network -- and only "
            "the second prevents the next incident from a different trigger."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where management items are lost."),
        ul([
            "Concluding a host is down from a failed ping. Many hosts and "
            "firewalls decline ICMP by policy.",
            "Starting diagnosis at the application layer, where a failure has "
            "a dozen causes below it.",
            "Reading a non-replying traceroute hop as the fault, when later "
            "hops reply normally.",
            "Treating a latency spike at one hop as significant when it does "
            "not persist.",
            "Setting alert thresholds from round numbers instead of from a "
            "baseline.",
            "Relying only on traps, which are lost silently, or only on "
            "polling, which lags.",
            "Correlating logs across devices whose clocks disagree.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"Users report that a web application is unreachable. Ping to "
            "the server fails, but other users on a different site reach the "
            "application normally. What can be concluded?\""
        ),
        ol([
            "Note what the working users prove: the server, the application "
            "and its own network are functioning.",
            "So the fault is specific to the reporting site or to the path "
            "between it and the server.",
            "Note what the failed ping does NOT prove: ICMP may be filtered "
            "on that path while the application's own port is permitted.",
            "So test the application's PORT from the failing site rather than "
            "relying on ping, which tests a different thing.",
            "Then work up the layers from the failing site -- link, address, "
            "gateway, routing -- to locate where the path stops.",
        ]),
        desc(
            "Step three is the one that separates answers. The instinct is to "
            "treat a failed ping as proof of unreachability, and the item is "
            "constructed precisely to reward knowing that ICMP and the "
            "application's traffic can be treated differently by the same "
            "path."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Network management overlaps several other categories."),
        ul([
            "FCAPS's fault and configuration areas are the incident and "
            "change processes of Service Management.",
            "Baselining and trending are capacity planning from System "
            "Evaluation.",
            "TTL, used deliberately by traceroute, comes from the previous "
            "lesson.",
            "Log correlation and clock synchronisation underpin the Security "
            "lessons' monitoring.",
            "Configuration under version control is the same discipline the "
            "Development lessons apply to code.",
            "Documented actual state is what an audit examines in System "
            "Audit.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("The five management areas",
              "Fault, configuration, accounting, performance, security",
              "FCAPS. They are responsibilities rather than teams, and they "
              "overlap constantly."),
             ("Why a baseline matters",
              "It makes gradual degradation visible",
              "Outages are noticed anyway; a slow decline is not, and "
              "thresholds should derive from it."),
             ("What a failed ping proves",
              "That ICMP did not get a reply",
              "Not that the host is down -- many hosts and firewalls decline "
              "ICMP while serving normally."),
             ("Why isolate upward through the layers",
              "Each passing test eliminates a whole class of cause",
              "Starting at the application tests something with a dozen "
              "causes beneath it."),
             ("Polling against traps",
              "Regular but lagging, against immediate but losable",
              "Which is why both are used rather than either alone."),
             ("A silent traceroute hop",
              "Usually a router declining to reply",
              "If later hops answer, the path through it is fine.")]),
    ]),
]

_mgmt_quiz = [
    mcq("HARD",
        "Users at one site cannot reach a web application, and ping to the "
        "server fails. Users at another site use the application "
        "normally.\n\nWhat does the failed ping establish?",
        [("That the server is down and must be restarted before service "
          "resumes", False),
         ("Only that no ICMP reply was received, which may be filtered on "
          "that path", True),
         ("That routing between the two sites has failed in both "
          "directions", False),
         ("That the application's port is blocked somewhere along the "
          "path", False)],
        "ICMP is frequently filtered by policy while application traffic is "
        "permitted, so a failed ping establishes only that no ICMP reply "
        "came back. The other site working proves the server and application "
        "are fine, so the fault is local to the reporting site or its path -- "
        "and the next test should be the application's own PORT rather than "
        "ping, which measures something different."),

    mcq("AVERAGE",
        "Network diagnosis proceeds upward through the layers rather "
        "than starting at the application.\n\nWhat makes this more "
        "efficient?",
        [("Applications cannot be tested until the network is fully "
          "operational", False),
         ("Each passing lower-layer test eliminates a whole class of "
          "cause", True),
         ("Lower layers fail far more frequently than higher ones do in "
          "practice", False),
         ("Diagnostic tools for the lower layers report results more quickly", False)],
        "A failure at the application layer has a dozen possible causes "
        "beneath it, so observing it narrows almost nothing. Confirming the "
        "link, then the address, then the gateway, then routing eliminates an "
        "entire layer of possibilities at each step -- which is what turns "
        "'the network is down' from a symptom into a locatable fault."),

    mcq("AVERAGE",
        "What is the main value of a performance baseline?",
        [("It makes gradual degradation visible against what was "
          "normal", True),
         ("It records the configuration of each device so changes can be "
          "reverted", False),
         ("It guarantees the network will meet its agreed service "
          "levels", False),
         ("It identifies which conversations are consuming the most "
          "capacity", False)],
        "An outage is noticed whether or not anybody measured anything; a "
        "slow decline over months is not, because each day resembles the "
        "last. A baseline of normal utilisation, latency and error rates "
        "makes that trend visible and gives alert thresholds something to "
        "derive from other than a round number. Identifying heavy "
        "conversations is what flow records do."),

    mcq("HARD",
        "In traceroute output, one hop shows no reply while every later hop "
        "responds normally.\n\nWhat does this indicate?",
        [("A router configured not to generate replies, with the path "
          "working", True),
         ("Packet loss at that hop which the later hops are "
          "retransmitting", False),
         ("A routing loop that the time-to-live field has interrupted at "
          "that point", False),
         ("An asymmetric route where the return path differs from the "
          "outbound one", False)],
        "Later hops replying proves packets traverse the silent one "
        "successfully, so it is forwarding normally and simply declining to "
        "generate the reply traceroute relies on -- which many routers do by "
        "policy. Reading such a hop as the fault is the standard misreading. "
        "A genuine problem shows as a delay or loss that PERSISTS through all "
        "subsequent hops."),

    mcq("AVERAGE",
        "Why are SNMP traps and polling both used rather than one or the "
        "other?",
        [("Traps report immediately but can be lost; polling lags but is "
          "regular", True),
         ("Traps carry performance counters while polling carries fault "
          "notifications", False),
         ("Traps operate over UDP and polling over TCP, so their reliability "
          "differs", False),
         ("Traps are sent by the manager and polling is initiated by the "
          "managed device", False)],
        "A trap tells the manager about an event the moment it occurs rather "
        "than at the next poll, and a lost trap is simply never delivered "
        "with nothing to indicate it was sent. Polling is predictable and "
        "only as current as its interval. Each covers the other's weakness, "
        "which is why a monitoring design that relies on either alone has a "
        "known gap."),

    mcq("AVERAGE",
        "Which of the five FCAPS areas covers recording device settings and "
        "reverting changes?",
        [("Configuration management", True),
         ("Fault management, since incorrect settings cause faults", False),
         ("Performance management, which tracks how devices are "
          "tuned", False),
         ("Accounting management, which records what each device is "
          "used for", False)],
        "Configuration management covers what devices are set to, recording "
        "it, changing it in a controlled way and reverting when necessary. "
        "The areas overlap constantly in practice -- a configuration error is "
        "discovered as a fault and may turn out to be a security incident -- "
        "which is why FCAPS names responsibilities rather than describing "
        "separate teams."),

    mcq("HARD",
        "Clocks must be synchronised across network devices before "
        "their logs are useful for diagnosis.\n\nWhat makes this "
        "necessary?",
        [("Because events cannot be correlated across devices without "
          "comparable timestamps", True),
         ("Because devices discard log entries whose timestamps predate their "
          "own clock", False),
         ("Because SNMP polling intervals are calculated from each device's "
          "local clock", False),
         ("Because log files are rotated on a schedule that depends on "
          "agreed time", False)],
        "Diagnosis usually means establishing the ORDER of events across "
        "several devices, and timestamps from clocks that disagree cannot "
        "establish order at all -- they can put an effect before its cause. "
        "That makes time synchronisation a prerequisite for investigation "
        "rather than a refinement of it, which is why a time protocol is "
        "standard infrastructure."),

    mcq("AVERAGE",
        "Which monitoring source answers the question 'what is consuming the "
        "link's capacity'?",
        [("Flow records", True),
         ("Interface counters retrieved by SNMP polling", False),
         ("Traps generated by the device when thresholds are "
          "exceeded", False),
         ("System logs written by the devices along the path", False)],
        "Interface counters report HOW MUCH traffic crossed an interface and "
        "say nothing about what it was. Flow records summarise the individual "
        "conversations -- who talked to whom, over which protocol, carrying "
        "how much -- which is the only one of these sources that can "
        "attribute the utilisation. Traps report events, and logs report what "
        "devices did."),

    mcq("HARD",
        "Why is network documentation describing the intended design, rather "
        "than the actual state, considered worse than none?",
        [("It is trusted during an incident and misleads the person "
          "diagnosing", True),
         ("It takes longer to produce than documentation of the actual "
          "state", False),
         ("It cannot be kept under version control alongside device "
          "configurations", False),
         ("It omits the addressing detail that diagnosis "
          "requires", False)],
        "Documentation is consulted precisely when somebody is under pressure "
        "and lacks other information, and a diagram of a design diverged from "
        "over two years is believed rather than questioned. Having none at "
        "least forces investigation of the real network. This is why the "
        "discipline is recording what IS, and why the record must be updated "
        "with every change."),

    mcq("AVERAGE",
        "How does traceroute discover the routers along a path?",
        [("By sending packets with increasing time-to-live values", True),
         ("By querying each router's routing table using SNMP as it "
          "goes", False),
         ("By reading the list of hops each router appends to the "
          "packet", False),
         ("By resolving the reverse DNS entries for the destination "
          "network", False)],
        "Each packet is sent with a TTL one greater than the last, so each "
        "router in turn is the one that decrements it to zero, discards it "
        "and reports having done so. This is the one place TTL is used "
        "deliberately rather than as a safeguard against loops -- the same "
        "mechanism from the previous lesson, exploited for a purpose it was "
        "not designed for."),
]

LESSON_NET_MGMT = lesson(
    MAJOR, MIDDLE,
    "Network Management, Monitoring and Troubleshooting",
    _mgmt_quiz,
    lesson_structure(
        "Network Management, Monitoring and Troubleshooting",
        "Once a network exists somebody is answerable for it continuing to "
        "work, and this lesson covers that responsibility: the five FCAPS "
        "areas, the monitoring sources and what each can and cannot answer, "
        "the baseline that makes gradual degradation visible, and above all "
        "the layered isolation procedure that turns 'the network is down' "
        "into a locatable fault. The diagnostic tools are covered by what "
        "each one actually proves rather than by what it is assumed to prove "
        "-- a distinction the examination builds items around, since a failed "
        "ping and an unreachable host are not the same claim.",
        [
            "Name the five functional areas of network management",
            "Distinguish the monitoring sources and what each answers",
            "Explain why a baseline is needed and what it makes visible",
            "Isolate a fault by working upward through the layers",
            "State precisely what each diagnostic tool proves",
            "Interpret traceroute output, including silent hops",
            "Explain why clock synchronisation precedes log correlation",
            "Describe change and configuration management practice",
        ],
        75,
        _mgmt_sections,
        [
            ("FCAPS",
             "Fault, configuration, accounting, performance and security -- "
             "the five functional areas of network management."),
            ("SNMP polling",
             "A manager asking devices for counters at intervals. Regular, "
             "and only as current as the interval."),
            ("SNMP trap",
             "A device reporting an event unprompted. Immediate, and lost "
             "silently if it does not arrive."),
            ("Flow records",
             "Summaries of individual conversations, which is the only source "
             "that can attribute utilisation."),
            ("Baseline",
             "A record of what normal looks like, making gradual degradation "
             "visible and giving thresholds a basis."),
            ("Layered isolation",
             "Testing link, address, gateway, routing, name and port in "
             "order, each pass eliminating a class of cause."),
            ("What ping proves",
             "That an ICMP reply was or was not received -- not that a host "
             "is up or down, since ICMP is often filtered."),
            ("Traceroute",
             "Discovers a path by sending increasing TTL values, so each "
             "router in turn discards a packet and reports it."),
            ("Silent traceroute hop",
             "Usually a router declining to generate replies. If later hops "
             "answer, the path through it is working."),
            ("Clock synchronisation",
             "A prerequisite for correlating logs, since disagreeing clocks "
             "cannot establish the order of events."),
            ("Configuration management",
             "Recording device settings, controlling changes and being able "
             "to revert them."),
            ("Documenting actual state",
             "Recording what is, not what was intended -- since stale "
             "documentation is trusted during an incident."),
        ],
        "Network management divides into five areas -- fault, configuration, "
        "accounting, performance and security -- which overlap constantly "
        "because they are responsibilities rather than teams. Monitoring "
        "gathers state from polling, which is regular and lags, from traps, "
        "which are immediate and lost silently, from flow records, which "
        "alone can say what is consuming capacity, and from logs, which are "
        "useless if clocks disagree. A baseline is what makes a comparison "
        "possible at all, and its real value is exposing the gradual decline "
        "nobody notices, since outages announce themselves. Fault isolation "
        "works UPWARD through the layers -- link, address, gateway, routing, "
        "name, port -- because each passing test eliminates a whole class of "
        "cause, while starting at the application tests something with a "
        "dozen causes beneath it. The tools prove less than they are assumed "
        "to: a failed ping means no ICMP reply came back, not that a host is "
        "down, and a silent traceroute hop is usually a router declining to "
        "answer rather than a fault, which later hops replying confirms. And "
        "since most incidents follow a change, configuration belongs under "
        "version control with a tested way back -- documented as the network "
        "actually IS, because a stale diagram is believed at three in the "
        "morning rather than questioned.",
        exam_notes=[
            desc(
                "Items here describe a symptom and a piece of evidence, and "
                "ask what may legitimately be concluded from it."
            ),
            ul([
                "Stating what a failed ping does and does not prove.",
                "Interpreting a silent or slow traceroute hop.",
                "Choosing the next diagnostic step from a described "
                "symptom.",
                "Naming the FCAPS area covering a described activity.",
                "Explaining the purpose of a baseline.",
                "Choosing the monitoring source that answers a question.",
                "Explaining why clocks must agree before logs are "
                "correlated.",
            ]),
            desc(
                "For every piece of evidence, ask what it EXCLUDES rather "
                "than what it suggests. A tool reporting failure has "
                "established one narrow fact, and the distractors in these "
                "items are almost always conclusions that go one step further "
                "than the evidence permits."
            ),
        ],
    ))

LESSONS = [LESSON_NET_PROTO, LESSON_NET_MGMT]

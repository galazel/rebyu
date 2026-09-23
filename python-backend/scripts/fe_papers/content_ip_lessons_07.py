"""IT Passport lesson content: Network and Security (756-759)."""

import sys

sys.path.insert(0, "/app/scripts/fe_expansion")

from builders import (  # noqa: E402
    accordion, compare_grid, content_tabs, desc, flip_cards, image, image_text,
    lesson_structure, media_text, ol, review_cards, sub, table, tabs, ul,
)

FIG = "/lesson-media/%s.svg"

CERTIFICATION_ID = 4

LESSONS = {}


LESSONS[756] = lesson_structure(
    name="Network architecture",
    intro=(
        "A network connects computers so they can exchange data. This lesson covers how "
        "networks are classified by the area they cover, the devices that join them "
        "together, the difference between wired and wireless, and what decides whether a "
        "connection feels fast."
    ),
    objectives=[
        "Distinguish LAN, WAN, intranet and the internet.",
        "Describe what hubs, switches and routers each do.",
        "Compare wired and wireless connections.",
        "Distinguish bandwidth from latency.",
        "Describe common network topologies.",
        "Explain what a VPN provides.",
    ],
    minutes=35,
    sections=[
        ("Networks by reach", [
            desc(
                "Networks are classified by the area they span and by who owns them, "
                "rather than by the technology inside."
            ),
            image(FIG % "ip-network-types"),
            desc(
                "An intranet uses the same technology as the internet but is private to "
                "one organisation. An extranet extends part of it to selected outside "
                "partners -- suppliers, say -- without opening it to everyone."
            ),
        ]),
        ("Devices that join networks", [
            table(
                ["Device", "Works on", "What it does"],
                [["Hub", "Electrical signals", "Repeats everything to every port. Obsolete."],
                 ["Switch", "MAC addresses", "Sends a frame only to the port where the destination is"],
                 ["Router", "IP addresses", "Forwards between different networks; chooses a path"],
                 ["Access point", "Radio", "Connects wireless devices to a wired network"],
                 ["Firewall", "Rules", "Permits or blocks traffic at a boundary"],
                 ["Modem", "Signals", "Converts between digital data and a carrier medium"]],
            ),
            desc(
                "The key distinction: a switch works INSIDE one network, a router works "
                "BETWEEN networks. Traffic leaving your building passes through a router "
                "because the destination is on another network."
            ),
        ]),
        ("Wired and wireless", [
            compare_grid(
                "Cable against radio",
                "The trade is mobility against consistency.",
                [("Wired (Ethernet)",
                  "Consistent speed, low latency, hard to intercept without physical "
                  "access. Requires cabling and fixes the device in place."),
                 ("Wireless (Wi-Fi)",
                  "Mobility and no cabling. Shared airtime, so speed drops with more "
                  "users; walls attenuate it, and anyone in range can hear it, which is "
                  "why encryption matters.")],
            ),
            ul([
                "Wi-Fi security: WPA2 or WPA3. An open network is readable by anyone nearby.",
                "Bluetooth: short range, low power, for pairing devices rather than networking.",
                "Mobile data: 4G and 5G, with 5G adding very low latency and high device density.",
            ]),
        ]),
        ("Bandwidth and latency", [
            desc(
                "These are different measures and they fail differently, which is why a "
                "connection can be fast and still feel slow."
            ),
            compare_grid(
                "Two ways to describe speed",
                "Users notice latency; marketing sells bandwidth.",
                [("Bandwidth",
                  "How much data can flow per second. Decides how long a large download "
                  "takes."),
                 ("Latency",
                  "How long one packet takes to arrive. Decides how responsive a call, "
                  "a game or a remote desktop feels.")],
            ),
            desc(
                "A satellite link may have generous bandwidth and half a second of "
                "latency: files transfer well and conversation is painful. Adding "
                "bandwidth never fixes a latency problem."
            ),
        ]),
        ("Topologies", [
            accordion([
                ("Star", "Every device connects to a central switch. One cable fault affects one device; the centre is a single point of failure."),
                ("Bus", "All devices share one cable. Cheap, and a break anywhere affects everybody. Largely historical."),
                ("Ring", "Each device connects to two neighbours, forming a loop. A break can be routed around if the ring is dual."),
                ("Mesh", "Many devices interconnect directly. Highly resilient and expensive in links."),
            ]),
            desc(
                "Star is the practical default for wired local networks, because "
                "concentrating faults at one device is easier to diagnose and repair "
                "than tracing a shared medium."
            ),
        ]),
        ("Reaching a network remotely", [
            desc(
                "A VPN creates an encrypted tunnel across a public network, so a remote "
                "worker's traffic is protected from anyone between them and the office."
            ),
            desc(
                "What a VPN protects is the data in transit. It does nothing about "
                "malware already on the laptop, and it does not make an untrusted device "
                "trustworthy -- which is why remote access usually requires device "
                "checks as well."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Switch or router: between two networks?", "Router",
                 "A switch forwards within one network using MAC addresses."),
                ("Adding bandwidth fixes a laggy call?", "No",
                 "That is latency; bandwidth is volume per second."),
                ("What does a VPN protect?", "Data in transit",
                 "Not the endpoint, and not against malware already present."),
                ("Which topology is standard for wired LANs?", "Star",
                 "Faults are isolated to one device and easy to diagnose."),
            ]),
        ]),
    ],
    key_terms=[
        ("LAN", "A network covering one site, such as an office."),
        ("WAN", "A network spanning cities or countries."),
        ("Switch", "Forwards frames within one network using MAC addresses."),
        ("Router", "Forwards packets between networks using IP addresses."),
        ("Bandwidth", "How much data can flow per unit of time."),
        ("Latency", "The delay before a packet arrives."),
    ],
    summary=(
        "Networks are classified by reach and ownership -- LAN, WAN, intranet, extranet "
        "and the internet. Switches forward within a network by MAC address while "
        "routers forward between networks by IP address. Wired links give consistency "
        "and wireless gives mobility at the cost of shared airtime and exposure, which "
        "is why WPA2 or WPA3 matters. Bandwidth and latency describe different things, "
        "and adding bandwidth never cures latency. A VPN encrypts traffic in transit "
        "and does nothing about a compromised endpoint."
    ),
    exam_notes=[
        desc(
            "The switch-versus-router distinction appears in nearly every sitting. So "
            "does the bandwidth-versus-latency one, usually as a scenario where the link "
            "is fast and the application still feels slow."
        ),
        ul([
            "Switch = within a network. Router = between networks.",
            "Latency is delay; bandwidth is volume. They are not interchangeable.",
            "An open Wi-Fi network is readable by anyone in range.",
        ]),
    ],
)


LESSONS[757] = lesson_structure(
    name="Communications protocol",
    intro=(
        "A protocol is an agreed set of rules for exchanging data. This lesson covers "
        "the layered model that organises them, the protocols the IT Passport "
        "examination names, and how an address typed into a browser becomes a connection "
        "to a server."
    ),
    objectives=[
        "Explain why protocols are arranged in layers.",
        "Describe what IP, TCP and UDP each provide.",
        "Distinguish TCP from UDP and say when each suits.",
        "Explain what DNS does.",
        "Name common application protocols and their purposes.",
        "Describe what an IP address and a port number identify.",
    ],
    minutes=35,
    sections=[
        ("Why layers", [
            desc(
                "Networking is divided into layers, each solving one problem and using "
                "the layer below. The benefit is substitutability: the same web browser "
                "works over Ethernet, Wi-Fi or mobile data, because only the bottom "
                "layer changes."
            ),
            image(FIG % "ip-protocol-layers"),
        ]),
        ("Addresses and ports", [
            desc(
                "Three identifiers appear constantly and are easily confused."
            ),
            table(
                ["Identifier", "Identifies", "Scope"],
                [["MAC address", "A network interface", "One local link; rewritten at every hop"],
                 ["IP address", "A host on a network", "End to end; unchanged across the journey"],
                 ["Port number", "An application on that host", "Within one host"]],
                caption="Address plus port identifies a conversation endpoint.",
            ),
            desc(
                "A private address such as 192.168.x.x is usable only inside a local "
                "network. Network address translation lets many such devices share one "
                "public address, which is how a household with a dozen devices appears "
                "as one on the internet."
            ),
        ]),
        ("TCP and UDP", [
            compare_grid(
                "Two ways to carry data",
                "Both sit on IP; they differ in what they promise.",
                [("TCP",
                  "Establishes a connection, numbers the data, retransmits what is lost "
                  "and delivers in order. Used where every byte must arrive -- web "
                  "pages, e-mail, file transfer."),
                 ("UDP",
                  "Sends without a connection and without guarantees. Lower overhead and "
                  "no retransmission delay, which suits live audio, video and DNS "
                  "lookups.")],
            ),
            desc(
                "For live media, a packet that arrives late is useless, so retransmitting "
                "it adds delay without value. That is precisely why UDP's lack of "
                "guarantees is an advantage there rather than a shortcoming."
            ),
        ]),
        ("DNS", [
            desc(
                "People use names; the network needs addresses. DNS is the directory "
                "that translates one into the other."
            ),
            ol([
                "A name is typed, and the resolver is asked for its address.",
                "If the answer is cached, it is returned immediately.",
                "Otherwise the query walks the hierarchy until an authoritative server answers.",
                "The answer is cached for a stated time, its TTL.",
                "The browser then connects to that address.",
            ]),
            desc(
                "Caching is why a DNS change takes time to take effect everywhere, and "
                "why the TTL is lowered in advance of a planned migration."
            ),
        ]),
        ("Application protocols", [
            accordion([
                ("HTTP / HTTPS", "Fetching web pages. HTTPS adds TLS encryption, so traffic cannot be read in transit and the server's certificate is verified."),
                ("SMTP", "Sending mail between servers."),
                ("POP3 / IMAP", "Retrieving mail. POP3 typically downloads and removes; IMAP keeps it on the server and syncs across devices."),
                ("FTP / SFTP", "Transferring files. Plain FTP sends credentials unencrypted; SFTP does not."),
                ("DHCP", "Assigning IP addresses automatically to devices as they join."),
                ("NTP", "Synchronising clocks, which matters more than it sounds -- correlating logs across machines depends on it."),
            ]),
        ]),
        ("What happens when you open a page", [
            ol([
                "DNS resolves the name to an IP address.",
                "TCP establishes a connection to that address on port 443.",
                "TLS negotiates encryption and verifies the server's certificate.",
                "HTTP requests the page.",
                "The server responds, and the browser requests the further resources the page references.",
            ]),
            desc(
                "Knowing this sequence makes diagnosis straightforward: if the address "
                "works and the name does not, the fault is DNS; if the certificate "
                "warning appears, the fault is at the TLS step, not in the page."
            ),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("TCP or UDP for a live video call?", "UDP",
                 "A late packet is useless; retransmission would only add delay."),
                ("What does DNS translate?", "Names to IP addresses",
                 "Caching, controlled by TTL, is why changes propagate slowly."),
                ("What does a port number identify?", "An application on a host",
                 "The IP address identifies the host itself."),
                ("Ping works, the name does not resolve. Fault?", "DNS",
                 "IP connectivity is proven; only name resolution is failing."),
            ]),
        ]),
    ],
    key_terms=[
        ("Protocol", "An agreed set of rules for exchanging data."),
        ("IP address", "Identifies a host; unchanged end to end."),
        ("Port number", "Identifies an application endpoint on a host."),
        ("TCP", "Connection-oriented, reliable, ordered delivery."),
        ("UDP", "Connectionless, no guarantees, low overhead."),
        ("DNS", "The directory translating names into IP addresses."),
    ],
    summary=(
        "Protocols are layered so that each solves one problem and the layers above are "
        "insulated from changes below. MAC addresses identify interfaces on a link, IP "
        "addresses identify hosts end to end, and port numbers identify applications. "
        "TCP guarantees ordered delivery while UDP trades guarantees for low delay, "
        "which is why live media prefers it. DNS translates names to addresses and "
        "caches answers under a TTL, and opening a web page chains DNS, TCP, TLS and "
        "HTTP in a sequence that makes faults straightforward to locate."
    ),
    exam_notes=[
        desc(
            "The TCP-versus-UDP choice is examined by scenario. The rule: if a late "
            "arrival is worse than a missing one, the answer is UDP."
        ),
        ul([
            "IP identifies the host; the port identifies the application.",
            "DNS caching under TTL is why changes are not instant.",
            "HTTPS proves the server's identity and encrypts traffic -- nothing more.",
        ]),
    ],
)


LESSONS[758] = lesson_structure(
    name="Network application",
    intro=(
        "This lesson covers what networks are used for: the web, e-mail, messaging, file "
        "sharing and the cloud services built on them -- together with the practical "
        "risks each brings and the etiquette and controls that go with them."
    ),
    objectives=[
        "Describe how the web works from a user's point of view.",
        "Explain how e-mail travels and where it can be read.",
        "Describe the risks in e-mail and how to reduce them.",
        "Explain the cloud service models.",
        "Describe collaboration and messaging tools and their trade-offs.",
        "Explain what IoT adds to a network.",
    ],
    minutes=35,
    sections=[
        ("The web", [
            desc(
                "A browser requests a page from a web server by URL, receives HTML, and "
                "then requests the images, stylesheets and scripts that page references. "
                "What appears is assembled locally from many separate responses."
            ),
            ul([
                "A search engine indexes pages in advance so queries can be answered quickly.",
                "Cookies let a site recognise a returning browser -- which is how a login persists.",
                "A cache stores fetched resources so they need not be requested again.",
            ]),
        ]),
        ("E-mail", [
            desc(
                "Mail is passed between servers by SMTP and retrieved by the recipient "
                "using POP3 or IMAP. It is stored at several points along the way, which "
                "has consequences."
            ),
            compare_grid(
                "POP3 against IMAP",
                "The difference is where the mail actually lives.",
                [("POP3",
                  "Downloads to one device and typically removes it from the server. "
                  "Works offline; awkward across several devices."),
                 ("IMAP",
                  "Leaves mail on the server and synchronises. The same mailbox appears "
                  "on every device; requires a connection to browse.")],
            ),
            desc(
                "Ordinary mail is not private in transit unless encryption is applied "
                "end to end, and a copy remains on servers you do not control. Sensitive "
                "material needs more than an e-mail's implicit assumptions."
            ),
        ]),
        ("The risks in e-mail", [
            accordion([
                ("Phishing", "A message impersonating a trusted sender, aiming to obtain credentials or payment. Check the actual sender address and never act on urgency alone."),
                ("Attachments", "Executable content disguised as a document. A file named invoice.pdf.exe is a program."),
                ("Reply-all", "A misdirected reply can disclose a whole thread. Check recipients before sending."),
                ("Bcc and Cc", "Putting many external addresses in Cc discloses every one of them to everybody. Use Bcc."),
                ("Business e-mail compromise", "A convincing request from an apparent executive to transfer money. Verify through a separate channel, never by replying."),
            ]),
        ]),
        ("Cloud services", [
            desc(
                "Cloud means computing consumed as a service, scaled on demand and "
                "billed by use. The three models differ in how much the provider manages."
            ),
            table(
                ["Model", "Provider manages", "You manage", "Example"],
                [["SaaS", "Everything", "Your data and users", "Web mail, online office"],
                 ["PaaS", "Platform and below", "Your application and data", "An application hosting platform"],
                 ["IaaS", "Hardware and virtualisation", "OS upward -- patching included", "A rented virtual machine"]],
                caption="Assuming the provider patches your IaaS guest OS is a common and costly error.",
            ),
        ]),
        ("Working together", [
            desc(
                "Collaboration tools moved much work from files passed around to "
                "documents edited in place."
            ),
            ul([
                "Shared documents remove the question of which version is current.",
                "Chat is fast and poor as a record; decisions should be written down elsewhere.",
                "Video conferencing collapses distance; it also removes the informal contact around a meeting.",
                "Shared calendars make scheduling possible and expose availability to colleagues.",
            ]),
        ]),
        ("The internet of things", [
            desc(
                "IoT connects physical objects -- sensors, appliances, machinery -- so "
                "their state becomes data a system can act on."
            ),
            desc(
                "The security problem is scale and neglect: thousands of devices, often "
                "with default credentials and no update path, permanently connected. "
                "That combination is how large botnets are assembled, and it is why IoT "
                "devices belong on a segregated network."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("POP3 or IMAP for three devices?", "IMAP",
                 "Mail stays on the server and synchronises everywhere."),
                ("Who patches the OS on IaaS?", "You do",
                 "The provider manages hardware and virtualisation, not your guest OS."),
                ("Many external recipients -- Cc or Bcc?", "Bcc",
                 "Cc discloses every address to everyone."),
                ("Why segregate IoT devices?", "Weak, rarely patched, always connected",
                 "A compromised device should not reach the main network."),
            ]),
        ]),
    ],
    key_terms=[
        ("SMTP", "The protocol carrying mail between servers."),
        ("IMAP", "Retrieval keeping mail on the server and synchronising devices."),
        ("Phishing", "A message impersonating a trusted sender to obtain credentials or payment."),
        ("SaaS", "Finished software consumed as a service."),
        ("IaaS", "Rented infrastructure where the customer manages the OS upward."),
        ("IoT", "Physical objects connected so their state becomes usable data."),
    ],
    summary=(
        "The web assembles a page from many requests, with cookies and caches shaping "
        "the experience. Mail travels by SMTP and is retrieved by POP3 or IMAP, is "
        "stored on servers outside your control, and carries the phishing and "
        "attachment risks that account for most successful attacks. Cloud models divide "
        "responsibility differently, and assuming the provider patches an IaaS guest "
        "operating system is a costly error. IoT instruments the physical world and "
        "concentrates weak, rarely patched devices, which is why it is segregated."
    ),
    exam_notes=[
        desc(
            "Cloud model questions turn on who is responsible for what. Phishing "
            "questions reward verifying through a separate channel rather than replying."
        ),
        ul([
            "IaaS: you patch the guest OS.",
            "Bcc for many external recipients; Cc discloses them all.",
            "IMAP syncs across devices; POP3 downloads to one.",
        ]),
    ],
)


LESSONS[759] = lesson_structure(
    name="Information security",
    intro=(
        "Information security protects data from being read, altered or made unavailable "
        "by anyone who should not be able to. This lesson covers the three goals that "
        "define it, the threats it defends against, and the controls -- technical, "
        "human and physical -- that organisations actually use."
    ),
    objectives=[
        "State the three goals of information security.",
        "Describe common threats and how each operates.",
        "Explain authentication factors and what multi-factor means.",
        "Describe what encryption protects and what it does not.",
        "Explain the principle of least privilege.",
        "Describe how an organisation should respond to an incident.",
    ],
    minutes=40,
    sections=[
        ("The three goals", [
            desc(
                "Every security control serves one or more of three goals, and naming "
                "which one is at stake is usually the first step in choosing a response."
            ),
            image(FIG % "ip-cia-triad"),
            ul([
                "Confidentiality -- only those authorised can read it.",
                "Integrity -- it is correct and has not been altered without authority.",
                "Availability -- it can be used when it is needed.",
            ]),
            desc(
                "They pull against each other. Encrypting everything and losing the key "
                "protects confidentiality perfectly and destroys availability, which is "
                "exactly what ransomware does to a victim."
            ),
        ]),
        ("Threats", [
            accordion([
                ("Malware", "Software intended to harm. Viruses attach to files, worms spread by themselves, trojans pose as something wanted."),
                ("Ransomware", "Encrypts data and demands payment. An attack on availability, which is why offline backups matter more against it than anything else."),
                ("Phishing", "Impersonation to obtain credentials or payment. Targets people, so technical controls alone do not stop it."),
                ("Social engineering", "Manipulating a person into granting access -- often by inventing urgency or authority."),
                ("Unauthorised access", "Using credentials or a weakness to reach what you should not, including by an employee exceeding their purpose."),
                ("Denial of service", "Overwhelming a system so legitimate users cannot reach it."),
                ("Insider threat", "Harm from someone who already has legitimate access, whether deliberate or careless."),
            ]),
        ]),
        ("Authentication", [
            desc(
                "Authentication establishes who is asking. It rests on three kinds of "
                "evidence, and combining kinds is what makes it strong."
            ),
            image(FIG % "ip-auth-factors"),
            desc(
                "Multi-factor authentication means factors of DIFFERENT kinds. A password "
                "plus a security question is two things you know -- still one factor, and "
                "still defeated by the same theft."
            ),
            ul([
                "Use long passphrases rather than short complex strings.",
                "Never reuse a password across services; one breach then opens many accounts.",
                "A password manager makes unique passwords practical.",
                "Biometrics cannot be reissued -- a stolen fingerprint is stolen permanently.",
            ]),
        ]),
        ("Encryption", [
            compare_grid(
                "Two kinds of encryption",
                "Real systems use both, each for what it is good at.",
                [("Symmetric",
                  "One shared key encrypts and decrypts. Fast, and the key must somehow "
                  "be shared securely first."),
                 ("Asymmetric",
                  "A public key encrypts and only the matching private key decrypts. "
                  "Solves key distribution; far slower.")],
            ),
            desc(
                "A connection typically uses asymmetric cryptography to agree a session "
                "key and then symmetric encryption for the traffic, paying the slow cost "
                "once."
            ),
            desc(
                "Encryption protects confidentiality. It does not stop data being "
                "deleted, does not prove who sent something -- that is a digital "
                "signature -- and does nothing if the key is stored beside the data."
            ),
        ]),
        ("Access control", [
            desc(
                "Least privilege means each account holds only the access its role "
                "genuinely requires, so a compromised account reaches as little as "
                "possible."
            ),
            ol([
                "Grant access by role rather than by individual.",
                "Review access when someone changes role -- not only when they leave.",
                "Remove access immediately on departure.",
                "Separate duties so one person cannot complete a sensitive process alone.",
                "Log privileged actions so they can be attributed.",
            ]),
            desc(
                "Privilege accumulation -- rights gathered across years of role changes "
                "and never removed -- is the commonest real-world failure here, and the "
                "mover case is the one most often missed."
            ),
        ]),
        ("Other controls", [
            table(
                ["Control", "Protects against", "Note"],
                [["Firewall", "Unwanted traffic at a boundary", "Decides by address and port, not content"],
                 ["Antivirus", "Known malware", "Signatures must be current to be useful"],
                 ["Patching", "Known vulnerabilities", "The gap between disclosure and exploitation is short"],
                 ["Backup", "Loss of availability", "Offline or immutable, or ransomware reaches it too"],
                 ["Encryption at rest", "Theft of media or a device", "Only if the key is held separately"],
                 ["Awareness training", "Attacks aimed at people", "The only control phishing respects"]],
            ),
        ]),
        ("Responding to an incident", [
            ol([
                "Detect and report -- staff must know how, and must not fear doing so.",
                "Contain -- limit the damage before investigating.",
                "Preserve evidence -- do not rebuild the machine immediately.",
                "Eradicate and recover -- remove the cause, restore service.",
                "Review -- establish what to change, without blaming individuals.",
            ]),
            desc(
                "A blameless review produces honest information and therefore usable "
                "improvements. A blame-focused one produces defensive accounts and "
                "teaches people to conceal the next incident."
            ),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Which goal does ransomware attack?", "Availability",
                 "The data is not disclosed or subtly altered -- it is made unusable."),
                ("Password plus security question -- how many factors?", "One",
                 "Both are things you know. Multi-factor needs different KINDS."),
                ("What does encryption not provide?", "Proof of sender",
                 "That is a digital signature. Encryption protects confidentiality."),
                ("First action on detecting an incident?", "Contain it",
                 "Limit damage first, preserving evidence rather than rebuilding."),
            ]),
        ]),
    ],
    key_terms=[
        ("Confidentiality", "Only those authorised can read the information."),
        ("Integrity", "The information is correct and has not been altered without authority."),
        ("Availability", "The information can be used when needed."),
        ("Multi-factor authentication", "Evidence of two or more DIFFERENT kinds."),
        ("Least privilege", "Each account holds only the access its role requires."),
        ("Social engineering", "Manipulating a person rather than defeating a system."),
    ],
    summary=(
        "Security protects confidentiality, integrity and availability, and these pull "
        "against one another -- ransomware is an availability attack. Threats range "
        "from malware to social engineering, which targets people and therefore resists "
        "technical controls. Authentication rests on what you know, have or are, and "
        "multi-factor requires different kinds. Encryption protects confidentiality "
        "alone. Least privilege bounds what a compromised account reaches, and incident "
        "response contains before it investigates and reviews without blame."
    ),
    exam_notes=[
        desc(
            "Expect a scenario and a question about which security goal it threatens. "
            "Expect also a multi-factor question where the distractor is two things the "
            "user knows."
        ),
        ul([
            "Ransomware attacks availability, not confidentiality.",
            "Two passwords is one factor. Different KINDS are required.",
            "Contain first, preserve evidence, and never rebuild immediately.",
        ]),
    ],
)

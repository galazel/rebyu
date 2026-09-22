"""FE Exam: new questions for Technology Element.

Lessons 450-468, two items each: human interface, multimedia, database,
network, and security. Database and network items here are calculation and
trace questions where the syllabus supports one, since those are what the
morning paper actually asks.
"""

import sys

sys.path.insert(0, "/app/scripts/bank_expansion")
from builders import mcq  # noqa: E402

CERTIFICATION_ID = 14

QUESTIONS = {

    # 450 -- Human Interface Technology and Interaction Models
    450: [
        mcq("MEDIUM",
            "What does Fitts's law predict about pointing at a target on screen?",
            [("Time to acquire it grows with distance and shrinks with target size", True),
             ("Time depends only on the user's typing speed", False),
             ("Time is constant regardless of target size", False),
             ("Time grows with the number of colours used", False)],
            "The law is why screen edges and corners are valuable: they are effectively infinite in one dimension, so the pointer cannot overshoot them."),
        mcq("HARD",
            "An interface responds to input after about 4 seconds with no feedback. What does research on response time suggest?",
            [("Beyond about one second the user's flow of thought is interrupted, so feedback is required", True),
             ("Users do not notice delays below ten seconds", False),
             ("Feedback is only needed for delays over one minute", False),
             ("Response time has no effect on perceived usability", False)],
            "The usual thresholds are roughly 0.1 s for instantaneous, 1 s for uninterrupted flow, and 10 s for holding attention. A 4-second wait needs a progress indicator."),
    ],

    # 451 -- Interface Design, Screen Design and Accessibility
    451: [
        mcq("HARD",
            "Why is colour alone an inadequate way to indicate an error in a form?",
            [("Users with colour vision deficiency or a monochrome display receive no signal", True),
             ("Colour cannot be rendered by modern browsers", False),
             ("Coloured text always fails to load", False),
             ("Colour indicators slow the page down measurably", False)],
            "Accessibility guidance requires that colour never be the sole carrier of information. An icon or text label alongside the colour makes the signal redundant and therefore robust."),
        mcq("MEDIUM",
            "What does consistency in interface design primarily reduce?",
            [("The learning the user must redo in each part of the system", True),
             ("The amount of memory the application consumes", False),
             ("The number of screens required", False),
             ("The time needed to compile the application", False)],
            "Consistency lets knowledge transfer between screens. Every inconsistency is a small relearning cost paid by every user, every time."),
    ],

    # 452 -- Multimedia Technology: Encoding and Compression
    452: [
        mcq("HARD",
            "Uncompressed stereo audio sampled at 44.1 kHz with 16 bits per sample requires what data rate?",
            [("About 1.41 Mbit/s", True),
             ("About 705 kbit/s", False),
             ("About 88.2 kbit/s", False),
             ("About 2.82 Mbit/s", False)],
            "44,100 x 16 x 2 = 1,411,200 bit/s. Halving the channels or the sample depth halves the rate, which is the arithmetic behind every audio format decision."),
        mcq("MEDIUM",
            "What distinguishes lossy from lossless compression?",
            [("Lossy discards information that cannot be recovered on decompression", True),
             ("Lossy always produces larger files than lossless", False),
             ("Lossless cannot be applied to images", False),
             ("Lossy compression is reversible with the right key", False)],
            "The trade is ratio against fidelity. Lossy suits perceptual media where the discarded detail is hard to notice, and is unacceptable for executables or archival records."),
    ],

    # 453 -- Multimedia Applications: Graphics, Audio, Video and VR
    453: [
        mcq("MEDIUM",
            "What is the key difference between raster and vector graphics?",
            [("Raster stores a grid of pixels; vector stores shapes that scale without loss", True),
             ("Raster images always use fewer bytes", False),
             ("Vector images cannot represent colour", False),
             ("Raster images scale without any quality loss", False)],
            "Vectors are resolution-independent, which suits logos and diagrams. Photographs have no underlying shapes to describe, which is why they stay raster."),
        mcq("HARD",
            "Why does video compression rely heavily on inter-frame prediction?",
            [("Consecutive frames are highly similar, so only the differences need coding", True),
             ("Each frame must be stored independently for playback", False),
             ("Audio and video must use the same compression method", False),
             ("Inter-frame coding removes the need for key frames", False)],
            "Temporal redundancy is the largest source of compression in video. Key frames are still needed periodically so that playback can start and recover without decoding from the beginning."),
    ],

    # 454 -- Database Architecture and the Three-Schema Approach
    454: [
        mcq("HARD",
            "In the three-schema architecture, what does logical data independence allow?",
            [("The conceptual schema to change without altering external schemas", True),
             ("The physical storage to change without altering the conceptual schema", False),
             ("Users to bypass the DBMS entirely", False),
             ("Two databases to share one physical file", False)],
            "Logical independence insulates applications from conceptual change; physical independence insulates the conceptual schema from storage change. The two are routinely swapped in answers."),
        mcq("MEDIUM",
            "What is the purpose of a database view?",
            [("To present a derived, restricted picture of the underlying tables", True),
             ("To store a second physical copy of the data", False),
             ("To index a column for faster access", False),
             ("To enforce referential integrity between tables", False)],
            "Views serve both simplification and access control, exposing only the rows and columns a user should see without duplicating the data."),
    ],

    # 455 -- Database Design: E-R Modelling, Normalisation and Keys
    455: [
        mcq("HARD",
            "A table has composite key (order_id, product_id) and stores product_name, which depends only on product_id. Which normal form is violated?",
            [("Second normal form, because of a partial key dependency", True),
             ("First normal form, because of a repeating group", False),
             ("Third normal form, because of a transitive dependency", False),
             ("Boyce-Codd normal form only", False)],
            "Depending on part of a composite key is precisely the 2NF violation. It admits rows where the same product carries two different names."),
        mcq("MEDIUM",
            "What is a candidate key?",
            [("Any attribute set that uniquely identifies a row and contains no unnecessary attribute", True),
             ("The first column defined in the table", False),
             ("Any column with an index on it", False),
             ("A foreign key referencing another table", False)],
            "A table may have several candidate keys; the designer chooses one as primary, and the rest become alternate keys with uniqueness still enforced."),
    ],

    # 456 -- Data Manipulation: Relational Algebra and SQL
    456: [
        mcq("HARD",
            "A LEFT OUTER JOIN between orders and shipments returns what for an order with no shipment?",
            [("The order's row, with nulls in the shipment columns", True),
             ("No row at all for that order", False),
             ("The order's row duplicated once per shipment table row", False),
             ("An error, because the join cannot be satisfied", False)],
            "The left side is preserved in full. That is what makes the outer join the standard way to find rows lacking a match -- filter afterwards for a null on the right."),
        mcq("MEDIUM",
            "What is the effect of GROUP BY in a SQL query?",
            [("Rows sharing the grouped values collapse into one, over which aggregates are computed", True),
             ("Rows are returned in sorted order without aggregation", False),
             ("Duplicate rows are removed from the result", False),
             ("The query result is written to a new table", False)],
            "Sorting is ORDER BY and duplicate removal is DISTINCT. GROUP BY exists to define the sets that SUM, COUNT and AVG operate over."),
    ],

    # 457 -- Transaction Processing: ACID, Concurrency and Recovery
    457: [
        mcq("HARD",
            "Two transactions each hold a lock the other needs and neither can proceed. What is the DBMS's usual response?",
            [("Detect the deadlock and abort one transaction as the victim", True),
             ("Wait indefinitely until an administrator intervenes", False),
             ("Commit both transactions partially", False),
             ("Escalate both to table-level locks and continue", False)],
            "Detection and victim selection is standard, with the aborted transaction rolled back and usually retried. Indefinite waiting would stall the whole system."),
        mcq("MEDIUM",
            "Which ACID property guarantees that a committed transaction survives a subsequent crash?",
            [("Durability", True),
             ("Atomicity", False),
             ("Consistency", False),
             ("Isolation", False)],
            "Durability is what write-ahead logging implements: the commit record reaches stable storage before the commit is acknowledged."),
    ],

    # 458 -- Database Applications: Distribution, Warehousing and NoSQL
    458: [
        mcq("HARD",
            "Under the CAP theorem, what must a distributed system sacrifice during a network partition?",
            [("Either consistency or availability, because partition tolerance is not optional", True),
             ("Partition tolerance, keeping consistency and availability", False),
             ("All three properties simultaneously", False),
             ("Nothing, if the hardware is reliable enough", False)],
            "Partitions happen in any real network, so the practical choice is between refusing requests to stay consistent and serving possibly stale data to stay available."),
        mcq("MEDIUM",
            "Which workload characteristic favours a document-oriented NoSQL store over a relational database?",
            [("Records with varying structure, queried mostly by their own identifier", True),
             ("Complex multi-table joins with strict referential integrity", False),
             ("Workloads requiring serializable cross-entity transactions", False),
             ("Highly normalized data with many relationships", False)],
            "Document stores trade join and transaction capability for schema flexibility and horizontal scale. Where the relational strengths are the requirement, the trade is a poor one."),
    ],

    # 459 -- Network Architecture: LAN, WAN, Topologies and Devices
    459: [
        mcq("MEDIUM",
            "What is the main advantage of a star topology over a bus topology?",
            [("A single cable fault affects only one node rather than the whole segment", True),
             ("It requires less cabling in total", False),
             ("It needs no central device", False),
             ("It has no maximum cable length", False)],
            "The star concentrates fault domains at the hub or switch. It uses more cable than a bus, which is the cost paid for that isolation."),
        mcq("HARD",
            "Why does adding a switch rather than a hub improve throughput on a busy LAN?",
            [("Each port becomes its own collision domain, so transfers proceed in parallel", True),
             ("The switch increases the speed of each cable", False),
             ("The switch compresses every frame before forwarding", False),
             ("The switch removes the need for MAC addresses", False)],
            "A hub makes every port share one collision domain, so contention rises with traffic. Switching removes that contention without changing the link speed at all."),
    ],

    # 460 -- Data Communication and Control
    460: [
        mcq("HARD",
            "Time-division multiplexing allocates the channel how?",
            [("Each source is given the full bandwidth during its own recurring time slot", True),
             ("Each source is given a separate frequency band continuously", False),
             ("Each source transmits whenever the channel is idle", False),
             ("Each source is given a distinct spreading code", False)],
            "TDM divides time; FDM divides frequency; CSMA is contention-based; CDMA uses codes. The distinction is a standard FE item."),
        mcq("MEDIUM",
            "What is the purpose of flow control in data communication?",
            [("To stop a fast sender overwhelming a slower receiver", True),
             ("To detect corrupted bits in a frame", False),
             ("To choose the route a packet takes", False),
             ("To encrypt data before transmission", False)],
            "Flow control matches the sender's rate to the receiver's capacity. Error detection and routing are separate mechanisms with separate fields."),
    ],

    # 461 -- Communications Protocols: TCP/IP, Addressing and Routing
    461: [
        mcq("HARD",
            "Which sequence describes the TCP three-way handshake?",
            [("SYN, SYN-ACK, ACK", True),
             ("ACK, SYN, SYN-ACK", False),
             ("SYN, ACK, FIN", False),
             ("SYN-ACK, SYN, ACK", False)],
            "The exchange synchronizes sequence numbers in both directions before data flows, which is what UDP omits and why UDP has no connection to establish."),
        mcq("MEDIUM",
            "Which situation makes UDP a better choice than TCP?",
            [("Real-time media where a late retransmission is worse than a lost packet", True),
             ("File transfer where every byte must arrive intact", False),
             ("A database replication link requiring ordered delivery", False),
             ("Any application needing guaranteed delivery", False)],
            "In live audio, a packet that arrives after its playback moment is useless, so retransmission adds delay without value. That is precisely where UDP's lack of guarantees is an advantage."),
    ],

    # 462 -- Network Management, Monitoring and Troubleshooting
    462: [
        mcq("MEDIUM",
            "What does an SNMP trap represent?",
            [("An unsolicited notification sent by an agent when an event occurs", True),
             ("A request from the manager polling a device", False),
             ("A firewall rule blocking management traffic", False),
             ("A cached routing table entry", False)],
            "Traps invert the polling model so that a device reports an event immediately rather than waiting to be asked, which matters for conditions that would be missed between polls."),
        mcq("HARD",
            "A host can ping an IP address but cannot open the same host by name. Where does the fault most likely lie?",
            [("Name resolution, since IP connectivity is demonstrably working", True),
             ("The physical cabling to the host", False),
             ("The routing table on the default gateway", False),
             ("The host's network interface driver", False)],
            "Reaching the address proves the lower layers work end to end. The failure is isolated to the step that turns a name into that address."),
    ],

    # 463 -- Network Applications: DNS, Mail, Web
    463: [
        mcq("MEDIUM",
            "Which DNS record type maps a domain name to an IPv4 address?",
            [("A", True),
             ("MX", False),
             ("CNAME", False),
             ("TXT", False)],
            "A records hold IPv4 addresses and AAAA records IPv6. MX designates mail servers, CNAME creates an alias, and TXT carries arbitrary text such as SPF policy."),
        mcq("HARD",
            "Why does lowering a DNS record's TTL before a planned migration help?",
            [("Resolvers cache the record for less time, so the change propagates sooner", True),
             ("It increases the authority of the DNS server", False),
             ("It encrypts the DNS response in transit", False),
             ("It prevents any caching of the record at all", False)],
            "The TTL must be lowered well before the change, because resolvers may still hold the old value for the duration of the previous TTL."),
    ],

    # 464 -- Information Security: Threats, Attacks and Vulnerabilities
    464: [
        mcq("HARD",
            "An attacker submits input that is stored and later rendered in another user's browser, executing script in their session. Which attack is this?",
            [("Stored cross-site scripting", True),
             ("SQL injection", False),
             ("Cross-site request forgery", False),
             ("Directory traversal", False)],
            "The payload persists on the server and fires in a victim's browser. CSRF instead abuses an existing session to make the victim issue a request they did not intend."),
        mcq("MEDIUM",
            "What is a zero-day vulnerability?",
            [("One exploited before a patch is available from the vendor", True),
             ("One that has been patched for less than a day", False),
             ("One affecting only newly installed systems", False),
             ("One discovered by automated scanning only", False)],
            "The defining feature is the absence of a fix at the time of exploitation, which is why detection and containment matter more than patching against it."),
    ],

    # 465 -- Cryptography, Authentication and Digital Signatures
    465: [
        mcq("HARD",
            "In a TLS handshake, what is the role of the server's certificate?",
            [("It lets the client verify the server's identity and obtain its public key", True),
             ("It encrypts all subsequent application data directly", False),
             ("It proves the server's software is free of vulnerabilities", False),
             ("It authenticates the client to the server", False)],
            "The certificate authenticates the server and carries the key used to establish the session. Bulk traffic is then protected by a symmetric key derived during the handshake."),
        mcq("MEDIUM",
            "What does a challenge-response authentication scheme avoid that a plain password exchange does not?",
            [("Transmitting the secret itself, so a captured exchange cannot be replayed", True),
             ("The need for the user to remember any secret", False),
             ("The need for the server to store any credential data", False),
             ("The possibility of the user choosing a weak secret", False)],
            "The response proves knowledge of the secret without revealing it, and the changing challenge is what defeats replay of a captured exchange."),
    ],

    # 466 -- Information Security Management: ISMS, Risk and Policy
    466: [
        mcq("MEDIUM",
            "What does risk acceptance formally require?",
            [("A decision by someone with authority to carry the consequences", True),
             ("Confirmation that the risk cannot occur", False),
             ("Removal of the risk from the register", False),
             ("Purchase of insurance covering the loss", False)],
            "Acceptance is a decision, not an omission, and it belongs to whoever answers for the outcome. Insurance is transfer, a different response."),
        mcq("HARD",
            "Why must information assets be classified before controls are selected?",
            [("The control strength must be proportionate to the asset's sensitivity and value", True),
             ("Classification determines which vendor to purchase from", False),
             ("Controls cannot be installed on unclassified systems", False),
             ("Classification is required by every software licence", False)],
            "Without classification, an organization either protects everything at the highest level, which is unaffordable, or protects nothing adequately."),
    ],

    # 467 -- Security Technology Evaluation and Certification Schemes
    467: [
        mcq("MEDIUM",
            "What does an ISO/IEC 15408 Common Criteria evaluation assess?",
            [("Whether a product meets a defined security functional and assurance specification", True),
             ("Whether an organization's management system conforms to a standard", False),
             ("Whether a company's financial controls are adequate", False),
             ("Whether a network has been penetration tested", False)],
            "Common Criteria evaluates products against a security target at a stated assurance level. Organizational management systems are ISO/IEC 27001's territory."),
        mcq("HARD",
            "Why does a Common Criteria certificate not guarantee a product is secure in a given deployment?",
            [("It certifies behaviour within a stated target and assumed environment, which may differ", True),
             ("Certificates expire the day they are issued", False),
             ("Evaluation deliberately excludes all security functions", False),
             ("Certification only applies to hardware", False)],
            "The security target and its environmental assumptions are the scope. A deployment that breaks those assumptions is outside what the certificate says anything about."),
    ],

    # 468 -- Information Security Measures and Implementation Technology
    468: [
        mcq("HARD",
            "Which control most directly limits the damage of a stolen database backup?",
            [("Encryption of the backup at rest with keys stored separately", True),
             ("A stronger password policy for application users", False),
             ("More frequent backup scheduling", False),
             ("Additional monitoring of the production network", False)],
            "Once the media is out of the organization's control, only encryption still protects the contents -- provided the key did not travel with it."),
        mcq("MEDIUM",
            "What does a web application firewall inspect that a network firewall does not?",
            [("The content and structure of HTTP requests, such as injection payloads", True),
             ("The physical condition of network cabling", False),
             ("The CPU utilization of the web server", False),
             ("The licensing status of the application", False)],
            "A network firewall decides on addresses and ports and will happily pass a malicious request to an open port 443. The WAF works at the application layer where that payload is visible."),
    ],
}

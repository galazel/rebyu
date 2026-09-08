"""Technology Element -> Security, lesson 5.

Syllabus minor category 5 (information security measures and implementation
technology): the controls themselves -- network, host, application and human
-- and how they are combined.

This is where the previous four lessons' abstractions become products and
configurations, so each control is presented with the specific attack it
addresses and, more importantly, the ones it does not.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Technology Element"
MIDDLE = "Security"

_sections = [
    ("From Principle to Product", [
        desc(
            "The previous lessons named threats, properties and processes. "
            "This one covers the controls that implement them, and each is "
            "introduced with what it addresses and what it leaves untouched."
        ),
        image(fig("defence-layers")),
        desc(
            "The organising idea remains defence in depth. No control here is "
            "sufficient alone, and every one has a specific gap -- which is "
            "why examination items so often offer a real control that does "
            "not address the described attack."
        ),
    ]),

    ("Firewalls", [
        desc(
            "A firewall enforces a policy about which traffic may cross a "
            "boundary, and the kinds differ in how much they can see."
        ),
        image(fig("firewall-placement")),
        table(
            ["Type", "Decides using", "Cannot"],
            [["Packet filter", "Addresses, ports, protocol",
              "Tell a legitimate connection from a forged packet"],
             ["Stateful inspection", "The above, plus connection state",
              "Understand what the traffic actually contains"],
             ["Application gateway", "The content of the protocol itself",
              "Keep up as cheaply, and must understand each protocol"],
             ["Next-generation", "Application identity and user identity",
              "Inspect traffic it cannot decrypt"]],
            caption="Four kinds, in increasing order of what they "
                    "understand.",
            footer="The last cell is increasingly the practical limit. Most "
                   "traffic is encrypted, so a firewall either decrypts it -- "
                   "which has its own consequences -- or judges it by "
                   "metadata alone."),
        desc(
            "A DMZ is the standard arrangement: public-facing servers sit in "
            "a segment reachable from the internet, and the internal network "
            "sits behind a further boundary. So compromising a public server "
            "does not place the attacker inside, which is segmentation "
            "applied to the layout rather than to the traffic."
        ),
        desc(
            "The default policy is the configuration decision that matters "
            "most. DEFAULT DENY permits only what is explicitly allowed, so "
            "anything unanticipated is blocked; default permit blocks only "
            "what somebody thought of, which is a list that is never "
            "complete."
        ),
    ]),

    ("Detecting Intrusion", [
        desc(
            "A firewall enforces policy on traffic crossing it. Detection "
            "asks a different question: is what is happening here "
            "legitimate?"
        ),
        compare_grid(
            "DETECTION AGAINST PREVENTION",
            "The same analysis, with different authority to act.",
            [("Intrusion detection",
              ["Observes and reports",
               "A false alarm costs investigation time",
               "Cannot stop an attack in progress",
               "Placed out of the traffic's path"]),
             ("Intrusion prevention",
              ["Observes and blocks",
               "A false alarm blocks legitimate work",
               "Stops an attack as it happens",
               "Must sit in the path, so it can fail closed"])]),
        desc(
            "The methods matter as much as the placement. SIGNATURE-based "
            "detection matches known attack patterns -- accurate, and blind "
            "to anything new. ANOMALY-based detection flags departures from a "
            "learned baseline -- capable of finding the unknown, and prone to "
            "false alarms whenever normal behaviour changes."
        ),
        desc(
            "That trade decides the deployment. Prevention with anomaly "
            "detection blocks legitimate work whenever the business does "
            "something new, which is why prevention tends to run on "
            "signatures and anomaly detection tends to alert rather than act."
        ),
    ]),

    ("Protecting the Host", [
        desc(
            "Controls at the network boundary do nothing about a threat "
            "already inside, so each machine is defended in its own right."
        ),
        ul([
            "HARDENING removes what is not needed -- services, accounts, "
            "software -- because the smallest attack surface is the one that "
            "was never installed.",
            "PATCHING closes known weaknesses, and the interval between "
            "release and installation is the exposure window.",
            "ANTIMALWARE detects known malicious software, and is a "
            "signature-based control with the same blind spot as any other.",
            "HOST FIREWALLS restrict what a machine accepts, which matters "
            "precisely because an internal network cannot be assumed "
            "friendly.",
            "DISK ENCRYPTION protects data if the device leaves the "
            "building, which no network control addresses at all.",
        ]),
        desc(
            "Hardening deserves the emphasis it gets. Every service running "
            "is something that could be exploited, needs patching and must be "
            "monitored -- so removing it eliminates all three obligations at "
            "once, which no other control does."
        ),
    ]),

    ("Securing an Application", [
        desc(
            "The Threats lesson showed the injection family sharing one "
            "cause. The controls follow from that cause rather than from the "
            "attack names."
        ),
        table(
            ["Practice", "Addresses", "Because"],
            [["Validate input against what is expected",
              "Unexpected data reaching logic",
              "Accepting only known-good is bounded; rejecting known-bad is "
              "not"],
             ["Parameterise queries", "SQL injection",
              "Values can never become query structure"],
             ["Encode output for its context", "Cross-site scripting",
              "Data is rendered as data wherever it lands"],
             ["Authenticate every request", "Broken access control",
              "Hiding a link is not restricting it"],
             ["Handle errors without detail", "Information disclosure",
              "A stack trace tells an attacker how it works"]],
            caption="Five practices, each tied to a specific failure.",
            footer="The first row states the general principle: define what "
                   "IS acceptable rather than enumerating what is not. A list "
                   "of forbidden inputs is a list somebody has to keep "
                   "complete, and attackers are the ones testing it."),
        desc(
            "SECURE DEVELOPMENT places these earlier than testing. Threat "
            "modelling during design, code review, dependency scanning and "
            "security testing before release each cost far less than the same "
            "defect found afterwards -- which is the same argument the "
            "Development lessons make about defects generally."
        ),
    ]),

    ("Protecting Data", [
        desc(
            "Some controls attach to the data rather than to the systems "
            "holding it, which is what keeps them effective as it moves."
        ),
        content_accordion(
            "FOUR DATA-CENTRED CONTROLS",
            "Each addresses a different point in a life cycle.",
            [("Encryption at rest and in transit",
              "Covered in the cryptography lesson, and worth repeating "
              "because they are separate problems: one protects a stolen "
              "disk, the other protects traffic, and neither does the "
              "other's job."),
             ("Masking and anonymisation",
              "Replacing real values with plausible substitutes so that test "
              "systems and analytics do not hold production personal data. "
              "The strongest form of protection is not holding the data at "
              "all."),
             ("Backup",
              "The only control that answers deletion, corruption and "
              "ransomware. Its value rests entirely on restoration having "
              "been tested, and on at least one copy being beyond an "
              "attacker's reach."),
             ("Retention and disposal",
              "Data kept beyond its usefulness is exposure with no benefit, "
              "and disposal must overwrite or destroy -- deleting leaves the "
              "contents recoverable.")]),
        desc(
            "The backup entry carries the point the examination presses. "
            "Ransomware encrypts what it can reach, including network "
            "backups, so an OFFLINE or immutable copy is what distinguishes a "
            "recoverable incident from a catastrophic one -- and it is a "
            "design decision made long before the incident."
        ),
    ]),

    ("Logging and Monitoring", [
        desc(
            "Detective controls only work if what they produce is collected "
            "somewhere it can be examined."
        ),
        ol([
            "Generate logs at each system, recording who did what and when.",
            "Send them to a central collector, because logs left on a "
            "compromised machine can be altered by whoever compromised it.",
            "Synchronise clocks, or events across systems cannot be "
            "ordered.",
            "Correlate related events, since one attack appears as unrelated "
            "entries across several systems.",
            "Alert on what matters, and retain the rest for investigation.",
        ]),
        desc(
            "Step two is the security-specific reason for centralisation. An "
            "attacker with control of a machine can edit its logs, so a copy "
            "sent elsewhere in real time is the only record that can be "
            "trusted afterwards -- which is why forwarding matters more than "
            "local retention."
        ),
        desc(
            "Retention has to be decided deliberately. Investigations "
            "frequently begin months after the events they examine, and logs "
            "discarded after a fortnight cannot answer them -- while "
            "retaining everything forever is both costly and its own "
            "disclosure risk."
        ),
    ]),

    ("Controlling Access in Practice", [
        desc(
            "The models from the cryptography lesson become specific "
            "administrative practices here."
        ),
        table(
            ["Practice", "Prevents"],
            [["Unique accounts per person",
              "Actions nobody can be attributed to"],
             ["Privileged accounts used only for privileged work",
              "A routine web page compromising an administrator session"],
             ["Regular access review",
              "Permissions accumulating as people change roles"],
             ["Prompt removal on departure",
              "Accounts remaining active for people who left"],
             ["Approval for exceptions, with an expiry",
              "A temporary exception becoming permanent"]],
            caption="Five practices and the specific failure each "
                    "prevents.",
            footer="PRIVILEGE CREEP -- the third row -- is the one that "
                   "accumulates silently. Somebody who has held four roles "
                   "over ten years holds the permissions of all four unless "
                   "somebody actively removed them."),
        desc(
            "Separating privileged from routine accounts addresses a specific "
            "mechanism. Administrative rights held while reading mail or "
            "browsing mean any compromise of those activities is a compromise "
            "with administrative rights -- so the separation bounds what an "
            "ordinary mistake can cost."
        ),
    ]),

    ("Securing the Endpoint and the Mobile Estate", [
        desc(
            "Devices that leave the building carry data past every control "
            "installed inside it, which the syllabus treats separately."
        ),
        ul([
            "Full-disk encryption is what makes a lost device a lost asset "
            "rather than a disclosure.",
            "Remote wipe removes data from a device reported lost, provided "
            "it can be reached.",
            "Separating work from personal data on a device allows one to be "
            "removed without the other.",
            "Requiring a screen lock addresses the most mundane exposure "
            "there is.",
            "Restricting which applications may handle work data limits where "
            "it can be copied to.",
        ]),
        desc(
            "Devices the organisation does not own complicate every line "
            "above. The organisation needs to protect its data and cannot "
            "reasonably control a personal device entirely, which is why the "
            "usual answer is containing work data in a managed area rather "
            "than managing the whole device."
        ),
    ]),

    ("Segmenting the Network", [
        desc(
            "A flat network lets anything that gets in reach everything, so "
            "dividing it bounds what a compromise reaches."
        ),
        table(
            ["Segment", "Holds", "Reachable from"],
            [["Public", "Internet-facing servers",
              "The internet, on specific ports"],
             ["Internal", "Workstations and business systems",
              "Not from the public segment"],
             ["Restricted", "Systems holding the most sensitive data",
              "Specific internal systems only"],
             ["Management", "Device administration interfaces",
              "Administrator workstations only"]],
            caption="Four segments, defined by what may reach each.",
            footer="The management row is the one most often left flat, and "
                   "it is the most consequential: administrative interfaces "
                   "reachable from an ordinary workstation mean any "
                   "workstation compromise reaches the infrastructure."),
        desc(
            "The reasoning behind segmentation is that a boundary is only "
            "worth having where an attacker would otherwise cross freely. "
            "Segmenting by department achieves little if every department "
            "needs the same systems; segmenting by SENSITIVITY of what a "
            "segment holds is what bounds the damage."
        ),
        desc(
            "ZERO TRUST extends this to its conclusion: rather than trusting "
            "anything by virtue of where it is, every request is "
            "authenticated and authorised regardless of origin. It is the "
            "recognition that an internal network stopped being a meaningful "
            "boundary once devices, staff and services all moved outside it."
        ),
    ]),

    ("Securing Remote Access", [
        desc(
            "People working outside the building need access to systems "
            "inside it, and the controls are examined as a set."
        ),
        ul([
            "A VPN encrypts the traffic across the public network, which "
            "provides confidentiality and grants no authorisation by "
            "itself.",
            "Multi-factor authentication belongs on remote access before "
            "anywhere else, since a stolen password is otherwise sufficient "
            "from anywhere in the world.",
            "Access should be limited to the systems actually needed, rather "
            "than the whole internal network -- a VPN that grants everything "
            "is a hole in the boundary rather than a control.",
            "The connecting device's own state matters, since a compromised "
            "personal machine on a VPN is a compromised machine on the "
            "internal network.",
        ]),
        desc(
            "The third point is the one designs get wrong. A VPN placing a "
            "remote laptop on the internal network makes every internal "
            "system reachable from wherever that laptop is, which converts a "
            "carefully segmented network into a flat one for anybody holding "
            "valid credentials."
        ),
    ]),

    ("Choosing Between Controls", [
        desc(
            "Given a described incident and four plausible controls, the "
            "reasoning that picks correctly is short and worth practising."
        ),
        ol([
            "Name the property that was broken -- confidentiality, integrity "
            "or availability.",
            "Identify the path the attack actually took, and at which layer.",
            "Ask what the attacker could REACH, since that is what a control "
            "must change.",
            "Eliminate controls acting at a different layer, however sound "
            "they are.",
            "Among the rest, prefer the one that removes the possibility "
            "rather than detecting the occurrence.",
        ]),
        desc(
            "Step three does most of the work and is the step candidates skip. "
            "The ransomware item earlier is the model: every option was a "
            "reasonable control, and only one changed what the malware could "
            "write to -- which was the entire question."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where implementation items are lost."),
        ul([
            "Expecting a firewall to stop an attack carried inside permitted "
            "traffic. It enforces policy about connections.",
            "Confusing detection with prevention. One reports, the other "
            "blocks and can block legitimate work.",
            "Expecting signature-based tools to catch new attacks. They match "
            "what is known.",
            "Blocking known-bad input instead of accepting only known-good.",
            "Assuming network backups survive ransomware. An offline or "
            "immutable copy is what does.",
            "Leaving logs only on the machine that produced them, where an "
            "attacker can alter them.",
            "Using an administrative account for routine work.",
            "Treating deletion as disposal. The contents remain until "
            "overwritten.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An organisation is hit by ransomware. Files on workstations "
            "and on the network file server are encrypted, and so is the "
            "backup share the server replicated to. What failed, and what "
            "would have prevented the loss?\""
        ),
        ol([
            "Identify the property broken: availability, and integrity of the "
            "files.",
            "Note what the malware could reach: everything the compromised "
            "account or machine could write to.",
            "The backup share was writable from the network, so it was within "
            "reach and was encrypted along with everything else.",
            "So the failure is not the absence of backups but their "
            "REACHABILITY from the environment they were meant to protect.",
            "The control needed is an offline or immutable copy -- one that "
            "cannot be modified from the network even with valid credentials "
            "-- plus tested restoration.",
        ]),
        desc(
            "Step four is what the item is constructed to test. Every option "
            "offered will be a reasonable control, and the reasoning that "
            "picks the right one is asking what the attacker could REACH "
            "rather than what the organisation had bought."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Implementation draws the whole security category together."),
        ul([
            "Firewalls and segmentation implement the network lessons' "
            "broadcast and routing boundaries.",
            "Parameterised queries are the database lesson's SQL, written "
            "safely.",
            "Hardening and patching answer the vulnerability window from the "
            "Threats lesson.",
            "Backup and tested restoration are the continuity objectives of "
            "the Management lesson.",
            "Log centralisation and clock synchronisation come from Network "
            "Management.",
            "Secure development practices belong to the Development "
            "Technology category.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Default deny against default permit",
              "Allow only what is listed, against block only what is",
              "The second requires a complete list of everything bad, which "
              "nobody has."),
             ("Detection against prevention",
              "Reports, against blocks",
              "A false alarm costs investigation in one case and blocks "
              "legitimate work in the other."),
             ("Signature against anomaly detection",
              "Accurate and blind to the new, against the reverse",
              "Which is why prevention runs on signatures and anomaly "
              "detection alerts."),
             ("Why hardening is disproportionately valuable",
              "A removed service needs no patching or monitoring either",
              "It eliminates three obligations at once, which no other "
              "control does."),
             ("What survives ransomware",
              "A copy the attacker cannot reach or alter",
              "Network backup shares are within reach and get encrypted "
              "too."),
             ("Why logs are forwarded immediately",
              "An attacker on the machine can edit what is stored there",
              "Only the copy sent elsewhere can be trusted "
              "afterwards.")]),
    ]),
]

_quiz = [
    mcq("HARD",
        "Ransomware encrypts workstations, a file server, and the backup "
        "share the server replicated to.\n\nWhat would have prevented the "
        "loss?",
        [("An offline or immutable backup copy that cannot be modified from "
          "the network", True),
         ("More frequent replication to the backup share so less data was "
          "outstanding at the time", False),
         ("Antimalware software installed on the file server as well as the "
          "workstations", False),
         ("Encrypting the backup share so its contents could not be read by "
          "the malware", False)],
        "The malware encrypted everything the compromised account could write "
        "to, and a network backup share is within that reach. The failure is "
        "not the absence of backups but their reachability from the "
        "environment they existed to protect -- so a copy that cannot be "
        "modified from the network, even with valid credentials, is what "
        "distinguishes a recoverable incident from a catastrophic one."),

    mcq("AVERAGE",
        "What does a default-deny firewall policy mean?",
        [("Only traffic explicitly permitted is allowed through", True),
         ("Traffic is blocked whenever the firewall cannot inspect its "
          "contents", False),
         ("Connections are denied until the user has authenticated to the "
          "firewall", False),
         ("Any traffic matching a known attack signature is dropped "
          "automatically", False)],
        "Default deny permits only what somebody deliberately allowed, so "
        "anything unanticipated is blocked. Default permit blocks only what "
        "somebody thought to forbid, and that list is never complete -- which "
        "is the same reasoning that makes accepting known-good input better "
        "than rejecting known-bad. It is the configuration decision that "
        "matters most on a firewall."),

    mcq("HARD",
        "What is the practical consequence of deploying an intrusion "
        "PREVENTION system rather than a detection system?",
        [("A false positive blocks legitimate traffic rather than raising an "
          "alert", True),
         ("It can identify attacks that a detection system's signatures would "
          "miss entirely", False),
         ("It examines traffic after the fact rather than as it "
          "passes", False),
         ("It requires the traffic to be decrypted before any analysis is "
          "possible", False)],
        "Prevention sits in the traffic's path and acts on its own analysis, "
        "so a wrong conclusion stops real work rather than merely costing "
        "somebody an investigation. That is why prevention tends to run on "
        "signatures, which are accurate about known attacks, while anomaly "
        "detection -- prone to flagging any change in normal behaviour -- "
        "usually alerts rather than blocks."),

    mcq("AVERAGE",
        "Why is validating input against what is expected preferred to "
        "rejecting known-dangerous input?",
        [("A list of dangerous inputs must be kept complete, and attackers "
          "test it", True),
         ("Rejecting dangerous input requires more processing than accepting "
          "valid input", False),
         ("Valid input can be checked at the database while dangerous input "
          "cannot", False),
         ("Dangerous input is usually encoded so that a filter cannot "
          "recognise it", False)],
        "Defining what IS acceptable produces a bounded rule that stays "
        "correct. Enumerating what is unacceptable requires anticipating "
        "every variation an attacker might try, and they are the ones testing "
        "the list -- which is exactly why filtering fails against injection "
        "while parameterisation, a structural separation, succeeds."),

    mcq("HARD",
        "Security logs are forwarded to a central collector immediately "
        "rather than retained on each machine.\n\nWhat makes this "
        "necessary?",
        [("An attacker controlling a machine can alter the logs stored on "
          "it", True),
         ("Individual machines have insufficient storage for long log "
          "retention", False),
         ("Log formats differ between systems and must be converted "
          "centrally", False),
         ("Clock synchronisation can only be applied to centrally stored "
          "logs", False),
         ],
        "Whoever compromises a machine can edit what it recorded about them, "
        "so the local copy cannot be trusted after exactly the event it was "
        "meant to document. A copy sent elsewhere as events occur is the only "
        "record with evidential value. Clock synchronisation matters "
        "enormously for correlation and is applied at each machine rather "
        "than centrally."),

    mcq("AVERAGE",
        "Hardening a host is considered disproportionately valuable "
        "among the host controls.\n\nWhat accounts for that?",
        [("A removed service requires no patching, monitoring or protection "
          "at all", True),
         ("Hardening is applied once and does not need reviewing "
          "afterwards", False),
         ("It replaces the need for host-based firewalls and antimalware "
          "software", False),
         ("It is the only control that protects a machine from an internal "
          "attacker", False)],
        "Every running service is something that can be exploited, must be "
        "patched and should be monitored -- so removing it eliminates all "
        "three obligations at once, which no other control achieves. It still "
        "needs reviewing as software changes, and it complements rather than "
        "replaces the other host controls, which is defence in depth."),

    mcq("HARD",
        "An administrator uses their privileged account for routine work "
        "including email and browsing.\n\nWhat is the risk?",
        [("Any compromise during routine activity is a compromise with "
          "administrative rights", True),
         ("Privileged accounts are excluded from the organisation's access "
          "review process", False),
         ("Routine activity generates log entries that obscure genuine "
          "administrative actions", False),
         ("The account's password is exposed more frequently and becomes "
          "easier to guess", False)],
        "Reading mail and browsing are where compromises usually begin, and "
        "holding administrative rights while doing them means an ordinary "
        "mistake immediately becomes an administrative one. Separating "
        "privileged from routine accounts bounds what such a mistake costs, "
        "which is why it is standard practice rather than merely tidy "
        "administration."),

    mcq("AVERAGE",
        "What is the purpose of a DMZ in a network design?",
        [("Public-facing servers are separated so their compromise does not "
          "reach the internal network", True),
         ("Traffic entering it is decrypted so that it can be inspected by "
          "the firewall", False),
         ("Internal users are given unrestricted outbound access from a "
          "controlled segment", False),
         ("Backup systems are isolated so that they cannot be reached by "
          "malware", False)],
        "Servers that must be reachable from the internet are the most likely "
        "to be compromised, so they are placed in a segment with a further "
        "boundary between them and internal systems. Compromising one then "
        "gains a foothold rather than internal access -- segmentation applied "
        "to the network's layout rather than to individual flows."),

    mcq("HARD",
        "An employee changes roles several times over a decade and retains "
        "the permissions of every previous role.\n\nWhat is this called, and "
        "what addresses it?",
        [("Privilege creep, addressed by regular access review", True),
         ("Privilege escalation, addressed by separating administrative "
          "accounts", False),
         ("Excessive delegation, addressed by role-based access "
          "control", False),
         ("Standing access, addressed by requiring approval for each "
          "use", False)],
        "Permissions accumulate because granting them is prompted by a need "
        "and removing them is prompted by nothing at all, so the only remedy "
        "is periodically reviewing what each person actually holds. "
        "Escalation is an attacker gaining rights they were not granted, "
        "which is a different problem addressed by different controls."),

    mcq("AVERAGE",
        "Why is deleting files an inadequate method of disposing of a "
        "storage device?",
        [("The contents remain recoverable until they are overwritten or the "
          "medium destroyed", True),
         ("Deleted files are retained in the operating system's recycle bin "
          "indefinitely", False),
         ("File deletion does not remove copies held in backups of the same "
          "device", False),
         ("Encrypted files cannot be deleted without the key that protects "
          "them", False),
         ],
        "Deletion removes the directory entry and leaves the data in place, "
        "so a discarded disk holds recoverable information. Disposal requires "
        "overwriting, physical destruction, or the medium having been "
        "encrypted from the start so that destroying the key suffices. It is "
        "the disclosure risk most often overlooked because the intuition "
        "about deletion is simply wrong."),
]

LESSON_SEC_IMPL = lesson(
    MAJOR, MIDDLE,
    "Information Security Measures and Implementation Technology",
    _quiz,
    lesson_structure(
        "Information Security Measures and Implementation Technology",
        "This lesson turns the previous four into products and "
        "configurations, and presents every control with the specific attack "
        "it addresses and the ones it does not -- because examination items "
        "so reliably offer a real control that does not answer the described "
        "problem. It covers firewalls and the default-deny decision, "
        "detection against prevention and signatures against anomalies, "
        "hardening and patching at the host, the application practices that "
        "follow from injection's single cause, the data controls including "
        "the backup property that survives ransomware, log centralisation as "
        "an evidential requirement, and the access practices that stop "
        "permissions accumulating.",
        [
            "Distinguish the firewall types by what each can see",
            "Explain default deny and the purpose of a DMZ",
            "Contrast intrusion detection with prevention, and signature with "
            "anomaly methods",
            "Explain host hardening, patching and disk encryption",
            "Apply the application security practices and their underlying "
            "principle",
            "Describe the data protection controls and what survives "
            "ransomware",
            "Explain why logs are centralised immediately",
            "Describe access practices and identify privilege creep",
        ],
        80,
        _sections,
        [
            ("Packet filter",
             "Decides on addresses, ports and protocol alone, without "
             "connection context."),
            ("Stateful inspection",
             "Tracks connection state, so a packet claiming to belong to a "
             "conversation can be checked against one."),
            ("Application gateway",
             "Understands the protocol's content, at a higher cost and one "
             "protocol at a time."),
            ("Default deny",
             "Permit only what is explicitly allowed. The alternative "
             "requires a complete list of everything bad."),
            ("DMZ",
             "A segment for public-facing servers, so their compromise does "
             "not place an attacker inside."),
            ("Detection against prevention",
             "Reporting against blocking. A false positive costs "
             "investigation in one case and real work in the other."),
            ("Signature detection",
             "Matches known patterns: accurate, and blind to anything new."),
            ("Anomaly detection",
             "Flags departures from a baseline: finds the unknown, and alarms "
             "whenever normal behaviour changes."),
            ("Hardening",
             "Removing unneeded services, accounts and software. A removed "
             "service needs no patching or monitoring either."),
            ("Input validation principle",
             "Accept only known-good rather than rejecting known-bad, since "
             "the second list is never complete."),
            ("Offline or immutable backup",
             "A copy that cannot be modified from the network, which is what "
             "survives ransomware."),
            ("Log centralisation",
             "Forwarding logs immediately, because an attacker on a machine "
             "can alter what it stored."),
            ("Privilege creep",
             "Permissions accumulating as people change roles, since granting "
             "is prompted and removing is not."),
            ("Privileged account separation",
             "Administrative rights used only for administrative work, "
             "bounding what an ordinary compromise costs."),
            ("Disposal",
             "Overwriting or destroying, since deletion leaves the contents "
             "recoverable."),
        ],
        "Every control here answers a specific attack and leaves specific "
        "gaps, which is why items so often offer a real control that does not "
        "address the problem described. Firewalls differ by what they can "
        "see, from addresses and ports up to application and user identity -- "
        "with encryption increasingly the limit on all of them -- and the "
        "configuration that matters most is DEFAULT DENY, since the "
        "alternative needs a complete list of everything bad. Detection "
        "reports and prevention blocks, so a false positive costs an "
        "investigation in one case and real work in the other; signatures are "
        "accurate about the known and blind to the new, while anomaly methods "
        "reverse both. At the host, hardening is disproportionately valuable "
        "because a service removed needs no patching or monitoring either. "
        "Application controls follow from injection's single cause: accept "
        "only known-good, parameterise queries, encode output for its "
        "context. Among data controls, the one the examination presses is "
        "backup -- ransomware encrypts everything the compromised account can "
        "reach, INCLUDING a network backup share, so an offline or immutable "
        "copy is what separates recovery from catastrophe. Logs are forwarded "
        "immediately because an attacker on a machine can edit what it "
        "stored. And access practices exist to stop permissions accumulating "
        "silently, since granting is prompted by a need and removing is "
        "prompted by nothing.",
        exam_notes=[
            desc(
                "Items describe an incident or a design and ask which control "
                "applies. Several plausible controls will be offered."
            ),
            ul([
                "Identifying what would have prevented a ransomware loss.",
                "Explaining default deny.",
                "Distinguishing detection from prevention.",
                "Explaining why validation accepts rather than rejects.",
                "Explaining why logs are centralised.",
                "Identifying privilege creep and its remedy.",
                "Explaining why deletion is not disposal.",
            ]),
            desc(
                "When several controls are offered, ask what the attacker "
                "could actually REACH. The correct answer is nearly always "
                "the one that puts something outside that reach, and the "
                "distractors are controls the organisation could reasonably "
                "have had and that would not have helped."
            ),
        ],
    ))

LESSONS = [LESSON_SEC_IMPL]

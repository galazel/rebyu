"""Technology Element -> Security, lessons 1 and 2.

Syllabus minor categories 1 (threats, attacks and vulnerabilities) and 2
(cryptography, authentication and digital signatures).

Security items are almost always answerable by naming which property was
broken or which property a tool provides, so both lessons are organised
around that mapping rather than around lists of attack names.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Technology Element"
MIDDLE = "Security"

# ==========================================================================
# Lesson 1: Threats, attacks and vulnerabilities
# ==========================================================================

_threat_sections = [
    ("What Security Actually Protects", [
        desc(
            "Security is not a single property, and nearly every item in this "
            "category begins by establishing which one an incident broke."
        ),
        image(fig("cia-triad")),
        table(
            ["Property", "Means", "Broken when"],
            [["Confidentiality", "Only authorised parties can read it",
              "Data is disclosed"],
             ["Integrity", "It has not been altered without authority",
              "Data is modified, or a modification cannot be detected"],
             ["Availability", "It is there when it is needed",
              "Service is denied, or hardware simply fails"]],
            caption="The CIA triad, with what breaks each.",
            footer="AVAILABILITY is the property people forget is a security "
                   "concern. A failed disk with no backup breaks it exactly "
                   "as effectively as an attacker does, and with no attacker "
                   "involved at all."),
        desc(
            "The syllabus adds two more properties that matter in specific "
            "contexts. AUTHENTICITY is knowing who something came from, and "
            "NON-REPUDIATION is the sender being unable to deny having sent "
            "it -- which is a stronger claim, and the one digital signatures "
            "exist to support."
        ),
    ]),

    ("Threat, Vulnerability and Risk", [
        desc(
            "Three words are used interchangeably in conversation and "
            "precisely in the examination, and getting them straight makes "
            "the risk lessons possible."
        ),
        table(
            ["Term", "Is", "Example"],
            [["Asset", "Something with value worth protecting",
              "A customer database"],
             ["Threat", "Something that could cause harm",
              "An attacker, a fire, a careless employee"],
             ["Vulnerability", "A weakness a threat could exploit",
              "An unpatched server, an untrained user"],
             ["Risk", "The chance of harm, and how bad it would be",
              "Likelihood combined with impact"]],
            caption="Four terms that build on one another.",
            footer="A threat with no matching vulnerability produces no risk, "
                   "and so does a vulnerability nothing threatens. Risk needs "
                   "an asset, a threat AND a vulnerability, which is why "
                   "removing any one of the three is a valid treatment."),
        desc(
            "That last observation explains why security work takes such "
            "different forms. Patching removes a vulnerability, a firewall "
            "keeps a threat away from it, and deleting data nobody needs "
            "removes the asset -- and the third is frequently the cheapest "
            "and least considered."
        ),
    ]),

    ("Where Threats Come From", [
        desc(
            "Defences aimed at one kind of adversary leave the others "
            "unaddressed, so the syllabus classifies sources rather than "
            "assuming one."
        ),
        image(fig("threat-sources")),
        desc(
            "INSIDERS are the source most consistently underestimated. Their "
            "access is legitimate, so nothing has to be broken into; the "
            "misuse looks like ordinary work until somebody examines it. And "
            "the majority of insider incidents involve no malice at all -- a "
            "file sent to the wrong address, a laptop left on a train, a "
            "password reused on a site that was breached."
        ),
        desc(
            "That is why the controls in this category are not all technical. "
            "Separation of duties, job rotation, mandatory leave and access "
            "review are administrative controls aimed squarely at a threat "
            "that a firewall by definition cannot see."
        ),
    ]),

    ("The Attack Surface", [
        desc(
            "An attacker chooses where to attack, so a defence has to cover "
            "every layer rather than the one it understands best."
        ),
        image(fig("attack-surface")),
        desc(
            "DEFENCE IN DEPTH is the principle: controls at every layer, so "
            "that any single failure is contained rather than decisive. It is "
            "an admission that individual controls fail, and designing as "
            "though they will is what distinguishes a security architecture "
            "from a collection of products."
        ),
        ul([
            "LEAST PRIVILEGE gives every user and process the minimum access "
            "needed, bounding what a compromise reaches.",
            "SEPARATION OF DUTIES splits a sensitive activity so no single "
            "person can complete it alone.",
            "FAIL SECURE means a failing control denies rather than permits "
            "-- a locked door that opens when power is lost has failed the "
            "wrong way.",
            "COMPLETE MEDIATION checks every access rather than caching the "
            "decision, since permissions change.",
        ]),
    ]),

    ("Malicious Software", [
        desc(
            "Malware is classified two ways, and confusing the axes is the "
            "commonest error in this part of the syllabus."
        ),
        image(fig("malware-types")),
        compare_grid(
            "TWO WAYS OF CLASSIFYING MALWARE",
            "How it arrives, against what it does.",
            [("By propagation",
              ["Virus -- attaches to a host, needs it to be run",
               "Worm -- self-propagating, needs no user action",
               "Trojan -- installed willingly under a false description"]),
             ("By purpose",
              ["Ransomware -- encrypts data and demands payment",
               "Spyware -- observes and reports",
               "Bot -- enlists the machine into a controlled network",
               "Rootkit -- hides its own presence from the system"])]),
        desc(
            "An item naming a worm is asking about propagation; one naming "
            "ransomware is asking about purpose. Both can describe the same "
            "piece of software, which is why a question with 'worm' and "
            "'ransomware' in different options usually turns on which axis it "
            "asked about."
        ),
        desc(
            "The worm's defining property is worth stating plainly because it "
            "explains the speed: it needs no user action, so its spread is "
            "bounded by network reachability and vulnerable hosts rather than "
            "by anybody clicking anything."
        ),
    ]),

    ("Attacks on People", [
        desc(
            "The syllabus treats social engineering seriously, because it "
            "bypasses technical controls rather than defeating them."
        ),
        content_accordion(
            "FIVE APPROACHES",
            "Each exploits a normal human response rather than a technical "
            "flaw.",
            [("Phishing",
              "A message impersonating a trusted party, asking for "
              "credentials or a click. Effective at scale because it costs "
              "nothing to send to thousands and needs one response."),
             ("Spear phishing",
              "The same, tailored to one person using details about them. Far "
              "more convincing, and aimed at people with valuable access."),
             ("Pretexting",
              "Inventing a scenario that makes a request seem legitimate -- a "
              "caller from the help desk who needs to verify something "
              "urgently."),
             ("Baiting and tailgating",
              "Leaving infected media to be found, or following an authorised "
              "person through a door. Both rely on ordinary helpfulness."),
             ("Business email compromise",
              "Impersonating an executive to authorise a payment. Exploits "
              "authority and urgency together, which is why it defeats "
              "procedure so reliably.")]),
        desc(
            "The common structure is authority plus urgency plus a plausible "
            "reason not to check. Recognising that pattern is more useful "
            "than recognising any particular scam, because the pattern "
            "survives while the details change with every campaign."
        ),
    ]),

    ("Attacks on Systems", [
        desc(
            "Technical attacks appear repeatedly in items, and each has a "
            "specific mechanism worth knowing."
        ),
        table(
            ["Attack", "Exploits", "Prevented by"],
            [["SQL injection", "Input treated as query structure",
              "Parameterised queries, not filtering"],
             ["Cross-site scripting", "Input treated as page markup",
              "Encoding output for its context"],
             ["Buffer overflow", "Writing past an allocated region",
              "Bounds checking, and safer languages"],
             ["Denial of service", "Consuming a finite resource",
              "Capacity, filtering and rate limiting"],
             ["Man in the middle", "Traffic passing through an attacker",
              "Encryption with authenticated identity"],
             ["Brute force", "Weak or reused credentials",
              "Rate limiting, and multi-factor authentication"]],
            caption="Six attacks the examination names.",
            footer="The injection rows share one cause: data being "
                   "interpreted as INSTRUCTIONS. That is why the fix is "
                   "keeping the two separate rather than trying to detect "
                   "dangerous-looking input, which attackers work around "
                   "endlessly."),
        desc(
            "A DISTRIBUTED denial of service uses many compromised machines "
            "at once, which defeats the obvious defence of blocking the "
            "source -- there are thousands of sources and they are victims "
            "too. It is also why availability is the property hardest to "
            "defend by any single measure."
        ),
    ]),

    ("Attacks on Networks", [
        desc(
            "The network lessons built shared media and trusted protocols, "
            "and several attacks exploit exactly those properties."
        ),
        table(
            ["Attack", "How", "Countered by"],
            [["Sniffing", "Reading traffic on a shared medium",
              "Encryption, and switched rather than shared media"],
             ["Spoofing", "Forging a source address or identity",
              "Authentication rather than address-based trust"],
             ["Session hijacking", "Stealing or guessing a session token",
              "Unguessable tokens over encrypted connections"],
             ["ARP poisoning", "Claiming another host's address locally",
              "Monitoring, and network segmentation"],
             ["DNS poisoning", "Injecting a false name-to-address record",
              "Signed DNS responses, and validation"]],
            caption="Five network attacks and their remedies.",
            footer="The pattern is that early protocols assumed a trusted "
                   "network, so identity is asserted rather than proved. "
                   "Every remedy in the third column adds the proof the "
                   "protocol left out."),
        desc(
            "This is why wireless deserved the emphasis it got in the network "
            "category. Its medium is shared with everyone in range and the "
            "signal leaves the building, so sniffing needs no access to any "
            "premises -- which makes encryption a requirement rather than a "
            "precaution."
        ),
    ]),

    ("Vulnerabilities in Software", [
        desc(
            "Most incidents exploit a known weakness in software somebody has "
            "already published a fix for, which is what makes patching a "
            "security control rather than housekeeping."
        ),
        ol([
            "A vulnerability is discovered, ideally reported to the vendor "
            "rather than published.",
            "A fix is produced and released, and the vulnerability becomes "
            "publicly known in the process.",
            "The window opens: the weakness is now documented and most "
            "systems are unpatched.",
            "Automated exploitation follows quickly, because the fix "
            "described what to attack.",
            "The window closes for each organisation only when it actually "
            "applies the patch.",
        ]),
        desc(
            "Step three is counter-intuitive and important. Publishing a fix "
            "makes exploitation EASIER in the short term, which is why the "
            "interval between release and installation is the most dangerous "
            "period and why patching speed matters more than patching "
            "thoroughness."
        ),
        desc(
            "A ZERO-DAY is a vulnerability with no available fix, being "
            "exploited before the vendor can respond. Nothing in the patch "
            "process helps, which is exactly why defence in depth exists -- "
            "the other layers are what remain when the patch does not."
        ),
    ]),

    ("Physical and Environmental Threats", [
        desc(
            "The syllabus includes physical security because every technical "
            "control assumes the hardware is not simply carried away."
        ),
        ul([
            "Physical access to a machine usually defeats its software "
            "controls, which is why data on portable devices is encrypted at "
            "rest.",
            "Environmental failures -- power, cooling, water, fire -- break "
            "availability with no attacker at all.",
            "Media disposal is a disclosure risk: deleted files remain "
            "recoverable until the medium is overwritten or destroyed.",
            "Visitor control and clear-desk practice address information "
            "gathered simply by being present.",
            "Shoulder surfing and unattended unlocked screens require no "
            "technical skill whatsoever.",
        ]),
        desc(
            "Media disposal is the item that recurs, because the intuition is "
            "wrong. Deleting a file removes its directory entry and leaves "
            "the contents in place, so a discarded disk holds recoverable "
            "data unless it was overwritten, encrypted from the start, or "
            "physically destroyed."
        ),
    ]),

    ("Choosing Controls", [
        desc(
            "Security items frequently offer several controls that would all "
            "help, and the reasoning that picks between them is worth "
            "stating."
        ),
        compare_grid(
            "THREE QUESTIONS THAT NARROW THE FIELD",
            "Applied in this order, they eliminate most options.",
            [("What property is at risk",
              ["Confidentiality points at encryption and access control",
               "Integrity points at hashing, signatures and validation",
               "Availability points at redundancy and capacity"]),
             ("Where does the attack act",
              ["Against a person -- procedural controls, not technical ones",
               "Against a known weakness -- patching",
               "Against a protocol's assumption -- add the missing proof"])]),
        desc(
            "The second question is the one that eliminates plausible wrong "
            "answers. An attack exploiting a decision somebody is authorised "
            "to make cannot be prevented by better authentication, and an "
            "attack on an unpatched system is not addressed by user training "
            "-- so the option matching the attack's own layer is nearly "
            "always correct."
        ),
    ]),

    ("Attacks on the Supply Chain", [
        desc(
            "An organisation's security includes software and services it did "
            "not write, and the syllabus treats that dependency as a threat "
            "in its own right."
        ),
        ul([
            "Compromised software from a legitimate vendor arrives trusted, "
            "signed, and installed deliberately -- which defeats controls "
            "aimed at unauthorised installation.",
            "A supplier with network access into your systems extends your "
            "attack surface to include theirs.",
            "Components reused in software carry their vulnerabilities into "
            "everything that includes them.",
            "Outsourcing a service transfers the work and not the "
            "accountability, which remains with the organisation.",
        ]),
        desc(
            "The controls are contractual and procedural more than technical: "
            "assessing suppliers before engaging them, requiring notification "
            "of their own incidents, limiting the access they hold to what "
            "they need, and knowing which components a system actually "
            "contains."
        ),
        desc(
            "That last item is what makes a newly published component "
            "vulnerability answerable at all. An organisation that cannot "
            "list what its software includes cannot say whether it is "
            "affected, which turns a patching decision into an "
            "investigation."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where threat items are lost."),
        ul([
            "Forgetting availability is a security property. An outage breaks "
            "it with no attacker involved.",
            "Using threat, vulnerability and risk interchangeably. Risk needs "
            "an asset, a threat and a vulnerability together.",
            "Confusing the malware axes. Virus, worm and trojan describe "
            "arrival; ransomware and spyware describe purpose.",
            "Believing a worm needs a user to run something. It does not, "
            "which is why it spreads so fast.",
            "Proposing input filtering against injection. Parameterisation "
            "separates data from instructions; filtering plays catch-up.",
            "Designing only against external attackers, when insiders and "
            "accidents are more common.",
            "Assuming a control that fails will fail safely. It must be "
            "designed to.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An employee receives an email appearing to come from the "
            "finance director, marked urgent, asking for a payment to a new "
            "supplier account before the end of the day. What is this, and "
            "what control addresses it?\""
        ),
        ol([
            "Identify the mechanism: impersonation of a trusted authority to "
            "cause an action.",
            "Note the urgency, which exists to prevent the recipient "
            "verifying anything.",
            "This is business email compromise, a targeted form of social "
            "engineering.",
            "The property at risk is integrity of a business process, and the "
            "loss is financial rather than informational.",
            "The effective control is procedural: verifying payment changes "
            "through a separate channel, and separating the authorisation of "
            "a payment from its execution.",
        ]),
        desc(
            "Step five is what these items reward. A technical control -- "
            "filtering, authentication of mail -- helps and cannot be "
            "sufficient, because the attack targets a decision a person is "
            "authorised to make. Separation of duties addresses it directly, "
            "which is why the syllabus classes administrative controls "
            "alongside technical ones."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Threats reach into most of the certification."),
        ul([
            "Injection begins where a query is built by concatenating "
            "strings, from the Database lessons.",
            "Buffer overflow is the memory model of the Programming "
            "lessons.",
            "Denial of service is a capacity question from System "
            "Evaluation.",
            "Man in the middle is why the network lessons encrypt anything "
            "crossing a shared medium.",
            "Insider threat controls are Corporate Activities governance.",
            "Availability as a security property is Service Management "
            "continuity.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("The three properties",
              "Confidentiality, integrity, availability",
              "Naming which one an incident broke is the first step in nearly "
              "every item."),
             ("Threat against vulnerability",
              "Something that could harm, against a weakness it could use",
              "Risk requires an asset, a threat and a vulnerability -- so "
              "removing any one treats it."),
             ("Virus against worm",
              "Needs a host and a user action, against neither",
              "Which is exactly why a worm spreads at network speed."),
             ("Why filtering fails against injection",
              "The cause is data being read as instructions",
              "Parameterisation separates them; filtering tries to guess what "
              "is dangerous."),
             ("The social engineering pattern",
              "Authority, urgency, and a reason not to check",
              "The pattern outlives every individual scam, which is what "
              "makes it worth recognising."),
             ("Why DDoS defeats source blocking",
              "There are thousands of sources, and they are victims",
              "Which is why availability resists any single defensive "
              "measure.")]),
    ]),
]

_threat_quiz = [
    mcq("HARD",
        "An employee receives an urgent email appearing to come from a "
        "director, requesting a payment to a new account before the day "
        "ends.\n\nWhich control addresses this most directly?",
        [("Verifying payment changes through a separate channel, with "
          "authorisation separated from execution", True),
         ("Requiring longer and more frequently changed passwords for all "
          "finance staff accounts", False),
         ("Encrypting all internal mail so that messages cannot be read in "
          "transit by outsiders", False),
         ("Installing antivirus software that scans every incoming message "
          "for malicious attachments", False)],
        "The attack targets a decision the recipient is authorised to make, "
        "so it defeats controls aimed at unauthorised access. Verification "
        "through an independent channel breaks the impersonation, and "
        "separating authorisation from execution means no single person can "
        "complete the payment alone. Technical mail controls help and cannot "
        "be sufficient against an attack on a legitimate process."),

    mcq("AVERAGE",
        "Which property of information security does a denial of service "
        "attack breach?",
        [("Availability", True),
         ("Confidentiality, since service records may be exposed during the "
          "disruption", False),
         ("Integrity, because the affected data can no longer be relied "
          "upon", False),
         ("Non-repudiation, as the source of the traffic cannot be "
          "established", False)],
        "A denial of service makes a system unusable to the people entitled "
        "to use it, without reading or altering anything. Availability is the "
        "property most often forgotten as a security concern -- a failed disk "
        "with no backup breaks it just as effectively, which is why "
        "continuity planning is part of a security programme rather than "
        "separate from it."),

    mcq("HARD",
        "What distinguishes a worm from a virus?",
        [("A worm spreads without needing any user action or host "
          "file", True),
         ("A worm encrypts data for ransom while a virus only "
          "damages it", False),
         ("A worm hides its presence from the operating system's "
          "process list", False),
         ("A worm is installed deliberately by a user who believes it "
          "is useful software", False)],
        "A virus attaches to a host file or program and spreads when that "
        "host is run or shared, so a user action is required somewhere. A "
        "worm is self-propagating across a network, bounded only by "
        "reachability and vulnerable hosts -- which is precisely why it "
        "spreads so much faster. Encrypting for ransom describes PURPOSE, and "
        "installing under a false description is a trojan."),

    mcq("HARD",
        "Why is filtering dangerous-looking input an inadequate defence "
        "against SQL injection?",
        [("The underlying cause is data being interpreted as query "
          "structure, which filtering does not change", True),
         ("Filtering rejects valid input containing apostrophes, making the "
          "application unusable for some users", False),
         ("Injection occurs at the database rather than the application, so "
          "the input is never inspected", False),
         ("Encrypted input cannot be inspected by a filter before it reaches "
          "the query", False),
         ],
        "The vulnerability exists because input is concatenated into a "
        "statement and therefore read as instructions. A filter attempts to "
        "guess which inputs are dangerous, and attackers have endlessly "
        "worked around such guesses. Parameterised queries send the "
        "statement and the values separately, so a value can never become "
        "structure -- which removes the cause instead of policing the "
        "symptom."),

    mcq("AVERAGE",
        "In risk terms, what is a vulnerability?",
        [("A weakness that a threat could exploit", True),
         ("An event with the potential to cause harm to an "
          "organisation", False),
         ("The combination of how likely harm is and how bad it would "
          "be", False),
         ("Anything of value that an organisation needs to protect", False)],
        "A vulnerability is the weakness -- an unpatched server, an untrained "
        "user -- while the THREAT is what might exploit it and the RISK is "
        "likelihood combined with impact. Risk requires an asset, a threat "
        "and a vulnerability together, which is why removing any one of the "
        "three is a valid treatment: patching, blocking, or deleting data "
        "nobody needs."),

    mcq("HARD",
        "Why does blocking the source address fail as a defence against a "
        "distributed denial of service attack?",
        [("The traffic originates from thousands of compromised machines "
          "which are themselves victims", True),
         ("The source addresses are encrypted and cannot be read by "
          "filtering equipment", False),
         ("Blocking addresses requires more processing than the attack "
          "traffic itself consumes", False),
         ("Legitimate users share addresses with attackers because of network "
          "address translation", False)],
        "A distributed attack draws on many compromised hosts, so there is no "
        "small set of addresses to block and the ones sending traffic belong "
        "to innocent parties. This is exactly why availability resists any "
        "single defensive measure and needs capacity, upstream filtering and "
        "rate limiting together rather than one control."),

    mcq("AVERAGE",
        "What does the principle of least privilege require?",
        [("Every user and process has only the access its work "
          "requires", True),
         ("Administrative accounts are used only during scheduled "
          "windows", False),
         ("Access decisions are reviewed by two people before being "
          "granted", False),
         ("Permissions are granted to roles rather than to individual "
          "users", False)],
        "Least privilege bounds the damage a compromise can do: an account "
        "with only the access its work needs is an account whose theft "
        "reaches only that far. Granting to roles rather than individuals is "
        "role-based access CONTROL, which is what makes least privilege "
        "administrable at scale -- a related idea rather than the definition "
        "of this one."),

    mcq("HARD",
        "A control is described as failing secure.\n\n"
        "What does this mean?",
        [("When the control fails, it denies access rather than granting "
          "it", True),
         ("The control continues operating correctly when a component "
          "fails", False),
         ("Failures of the control are logged for later investigation and "
          "audit", False),
         ("The control cannot fail without an administrator being alerted "
          "immediately", False)],
        "A failing control must default to denial, because a door that "
        "unlocks when power is lost has failed in the direction that helps an "
        "attacker. It is a design decision rather than a property that "
        "appears by itself, and it sometimes conflicts with safety -- a fire "
        "exit must open when power fails, which is why the choice is made "
        "deliberately per control."),

    mcq("AVERAGE",
        "Which category of threat source is most often underestimated in "
        "security design?",
        [("Insiders, whose access is legitimate and whose misuse resembles "
          "ordinary work", True),
         ("External attackers who target the organisation deliberately rather "
          "than opportunistically", False),
         ("Automated scanning tools that probe for known vulnerabilities "
          "continuously", False),
         ("Suppliers with network connections into the organisation's "
          "systems", False)],
        "An insider does not have to break in, and their activity looks like "
        "the work they are employed to do until somebody examines it. Most "
        "insider incidents also involve no malice -- a misaddressed file, a "
        "lost laptop, a reused password. This is why separation of duties, "
        "access review and rotation exist as controls a firewall cannot "
        "provide."),

    mcq("AVERAGE",
        "What does defence in depth assume?",
        [("That individual controls will fail, so a single failure must not "
          "be decisive", True),
         ("That attackers will always target the least protected layer of a "
          "system", False),
         ("That controls are more effective when several are applied at the "
          "same layer", False),
         ("That the cost of a breach justifies duplicating every control in "
          "the environment", False)],
        "The principle exists because any single control can fail, be "
        "misconfigured, or be bypassed -- so controls are placed at every "
        "layer and a failure is contained rather than decisive. Designing as "
        "though controls will fail is what separates a security architecture "
        "from a collection of products, each individually reasonable."),
]

LESSON_SEC_THREATS = lesson(
    MAJOR, MIDDLE,
    "Information Security: Threats, Attacks and Vulnerabilities",
    _threat_quiz,
    lesson_structure(
        "Information Security: Threats, Attacks and Vulnerabilities",
        "Security items are almost always answerable by naming which property "
        "an incident broke, so this lesson begins with confidentiality, "
        "integrity and availability and returns to them throughout. It "
        "separates threat from vulnerability from risk precisely enough for "
        "the risk lessons to build on, classifies threat sources so that "
        "insiders and accidents are not designed out of consideration, and "
        "covers malware on both its axes -- how it arrives and what it does "
        "-- before working through attacks on people and on systems, where "
        "the injection family turns out to share one cause with one fix.",
        [
            "Name the security properties and identify which an incident "
            "breaks",
            "Distinguish asset, threat, vulnerability and risk",
            "Classify threat sources and explain why insiders are "
            "underestimated",
            "Explain defence in depth, least privilege and separation of "
            "duties",
            "Classify malware by propagation and by purpose",
            "Recognise the social engineering pattern behind specific scams",
            "Explain the mechanism of the named technical attacks",
            "Explain why parameterisation rather than filtering prevents "
            "injection",
        ],
        80,
        _threat_sections,
        [
            ("Confidentiality",
             "Only authorised parties can read the information. Broken by "
             "disclosure."),
            ("Integrity",
             "The information has not been altered without authority, or "
             "alteration is detectable."),
            ("Availability",
             "It is there when needed. Broken by a denial of service and "
             "equally by a failed disk."),
            ("Non-repudiation",
             "The sender cannot deny having sent something -- a stronger "
             "claim than authenticity, and what signatures support."),
            ("Threat",
             "Something that could cause harm: an attacker, a fire, a "
             "careless employee."),
            ("Vulnerability",
             "A weakness a threat could exploit, such as an unpatched server "
             "or an untrained user."),
            ("Risk",
             "Likelihood combined with impact. Requires an asset, a threat "
             "and a vulnerability together."),
            ("Defence in depth",
             "Controls at every layer, on the assumption that any individual "
             "control will fail."),
            ("Least privilege",
             "Minimum access for every user and process, bounding what a "
             "compromise reaches."),
            ("Separation of duties",
             "Splitting a sensitive activity so no single person can complete "
             "it alone."),
            ("Fail secure",
             "A failing control denies rather than permits -- a deliberate "
             "design decision, sometimes conflicting with safety."),
            ("Virus, worm, trojan",
             "Propagation classes: needs a host and a user action; "
             "self-propagating; installed willingly under a false "
             "description."),
            ("SQL injection",
             "Input interpreted as query structure. Prevented by "
             "parameterised queries, not by filtering."),
            ("Social engineering",
             "Attacking the person rather than the system, using authority, "
             "urgency and a reason not to verify."),
            ("Distributed denial of service",
             "Many compromised hosts at once, which defeats source blocking "
             "since the sources are victims."),
        ],
        "Security protects three properties, and naming which one an incident "
        "broke is the first step in nearly every item -- with AVAILABILITY "
        "the one people forget, since a failed disk breaks it as effectively "
        "as an attacker. Threat, vulnerability and risk are distinct: risk "
        "needs an asset, a threat and a vulnerability together, which is why "
        "patching, blocking and deleting unneeded data are all valid "
        "treatments. Threat sources include insiders, whose legitimate access "
        "makes misuse look like work and whose incidents are mostly careless "
        "rather than malicious -- which is why separation of duties and "
        "access review exist as controls no firewall provides. Defence in "
        "depth assumes individual controls fail, so a single failure is "
        "contained rather than decisive. Malware classifies two ways at once, "
        "by propagation -- virus, worm, trojan -- and by purpose, and a worm "
        "needs no user action, which is exactly why it spreads at network "
        "speed. Social engineering follows one pattern under every name: "
        "authority, urgency, and a reason not to check. And among technical "
        "attacks the injection family shares a single cause, data being read "
        "as INSTRUCTIONS, which is why parameterisation removes it and "
        "filtering only tries to guess what an attacker will send next.",
        exam_notes=[
            desc(
                "Items describe an incident and ask what it was, what it "
                "broke, or what would have prevented it."
            ),
            ul([
                "Naming which security property an incident breached.",
                "Distinguishing threat from vulnerability from risk.",
                "Distinguishing a virus from a worm from a trojan.",
                "Identifying a social engineering technique.",
                "Choosing the effective control for a described attack.",
                "Explaining why injection is prevented by parameterisation.",
                "Explaining why distributed attacks resist source blocking.",
            ]),
            desc(
                "When an item asks for the best control, check whether the "
                "attack targets a decision somebody is AUTHORISED to make. If "
                "it does, the answer is procedural -- verification, "
                "separation of duties -- and every technical option is a "
                "distractor."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Cryptography and authentication
# ==========================================================================

_crypto_sections = [
    ("Matching the Tool to the Property", [
        desc(
            "Cryptography is a small set of tools, each providing a specific "
            "property. Most items in this category are answered by matching "
            "them correctly, and most wrong answers come from expecting a "
            "tool to provide something it does not."
        ),
        image(fig("crypto-uses")),
        table(
            ["Tool", "Provides", "Does NOT provide"],
            [["Encryption", "Confidentiality",
              "Integrity -- ciphertext can be altered"],
             ["Hash function", "Integrity",
              "Authenticity -- anyone can hash"],
             ["Message authentication code", "Integrity and authenticity",
              "Non-repudiation -- both parties share the key"],
             ["Digital signature",
              "Integrity, authenticity and non-repudiation",
              "Confidentiality -- the message is not hidden"]],
            caption="Four tools and the exact boundary of each.",
            footer="The last row is examined constantly. A signature does not "
                   "encrypt anything, so a signed message is readable by "
                   "everybody -- signing and encrypting are separate "
                   "operations, applied together when both are wanted."),
    ]),

    ("Symmetric Encryption", [
        desc(
            "The straightforward form: one key, shared between the parties, "
            "used both to encrypt and to decrypt."
        ),
        image(fig("symmetric-asymmetric")),
        ul([
            "It is fast, which is why bulk data is always encrypted this way "
            "in practice.",
            "The key must reach the other party without being intercepted, "
            "which is the entire difficulty.",
            "Every pair of communicating parties needs its own key, so n "
            "parties need n(n-1)/2 keys -- growth that makes large groups "
            "unmanageable.",
            "AES is the algorithm the syllabus names.",
        ]),
        desc(
            "The KEY DISTRIBUTION problem is the reason asymmetric "
            "cryptography exists. Two parties who have never met cannot agree "
            "a shared secret over a channel an attacker is watching, and no "
            "amount of care with the symmetric algorithm addresses that -- it "
            "is a problem about the channel rather than the cipher."
        ),
    ]),

    ("Asymmetric Encryption", [
        desc(
            "Each party holds a PAIR of keys: one published freely, one kept "
            "secret, mathematically related so that what one does the other "
            "undoes."
        ),
        table(
            ["To do this", "Use this key", "Because"],
            [["Send a confidential message",
              "The recipient's PUBLIC key",
              "Only their private key can undo it"],
             ["Read that message", "Your own PRIVATE key",
              "Only you hold it"],
             ["Sign a message", "Your own PRIVATE key",
              "Only you could have produced it"],
             ["Verify a signature", "The sender's PUBLIC key",
              "Anyone may check, and nobody can forge"]],
            caption="Four operations, and which key each uses.",
            footer="This table is the single most valuable thing in the "
                   "lesson. Encryption uses the RECIPIENT's key and signing "
                   "uses the SENDER's, and the examination's distractors are "
                   "built from getting that backwards."),
        desc(
            "RSA is the algorithm named, and asymmetric operations are orders "
            "of magnitude slower than symmetric ones. So real systems use "
            "both: asymmetric cryptography to agree a symmetric key, and "
            "symmetric encryption for the data itself. Each covers exactly "
            "the other's weakness, which is why TLS works the way it does."
        ),
    ]),

    ("Hash Functions", [
        desc(
            "A hash reduces any input to a fixed-size digest, and it is not "
            "encryption -- there is nothing to reverse and no key involved."
        ),
        image(fig("hash-properties")),
        ul([
            "ONE-WAY: the input cannot be recovered from the digest, which is "
            "why passwords are stored this way.",
            "FIXED LENGTH: any input produces the same size of output, so "
            "comparison is always cheap.",
            "COLLISION RESISTANT: finding two inputs with the same digest is "
            "infeasible, which is what makes a matching digest evidence.",
            "DETERMINISTIC: the same input always produces the same digest, "
            "or verification would be impossible.",
        ]),
        desc(
            "Storing passwords as hashes is not sufficient by itself. An "
            "attacker with the hashes can guess candidate passwords and hash "
            "them, and identical passwords produce identical hashes across "
            "every account. A SALT -- a unique random value per password -- "
            "makes each hash unique and forces the guessing to be repeated "
            "per account rather than once for everybody."
        ),
    ]),

    ("Digital Signatures", [
        desc(
            "A signature answers a different question from encryption: not "
            "'who may read this' but 'who produced it, and has it changed'."
        ),
        image(fig("digital-signature")),
        ol([
            "The sender hashes the message, producing a digest.",
            "The sender encrypts that digest with their PRIVATE key -- the "
            "result is the signature.",
            "Message and signature are sent together, with the message "
            "unencrypted unless confidentiality is separately arranged.",
            "The recipient hashes the message they received.",
            "The recipient decrypts the signature with the sender's PUBLIC "
            "key, recovering the original digest.",
            "If the two digests match, the message is unaltered and came from "
            "the holder of that private key.",
        ]),
        desc(
            "The message is hashed first for a practical reason: signing a "
            "small fixed-size digest is far cheaper than applying an "
            "asymmetric operation to a whole document, and the hash's "
            "collision resistance means the digest stands in for the message "
            "reliably."
        ),
        desc(
            "NON-REPUDIATION follows from only one party holding the private "
            "key. A message authentication code proves integrity and origin "
            "too, and cannot support non-repudiation, because BOTH parties "
            "hold the shared key -- so either could have produced it, and "
            "neither can prove the other did."
        ),
    ]),

    ("Certificates and Trust", [
        desc(
            "Asymmetric cryptography solves key distribution only if a public "
            "key can be trusted to belong to who it claims."
        ),
        desc(
            "A CERTIFICATE is a public key plus an identity, signed by an "
            "authority. Verifying it means checking that signature with the "
            "authority's public key -- which is itself in a certificate, "
            "signed by another authority, up to a root the verifier already "
            "trusts. The trust is anchored in that small set of roots and "
            "nowhere else."
        ),
        ul([
            "A certificate has a validity period, and an expired one stops "
            "working completely at a known moment.",
            "REVOCATION exists for a certificate that must stop being trusted "
            "before it expires, which requires the verifier to check.",
            "A PUBLIC KEY INFRASTRUCTURE is the whole arrangement of "
            "authorities, certificates, distribution and revocation.",
            "A SELF-SIGNED certificate is signed by its own key, so it proves "
            "nothing to anybody who did not already have it.",
        ]),
        desc(
            "The examinable limit is what a certificate establishes: that the "
            "key belongs to the named identity. It says nothing about whether "
            "that identity is trustworthy, which is why a phishing site can "
            "hold a perfectly valid certificate."
        ),
    ]),

    ("Authentication", [
        desc(
            "Authentication establishes who somebody is; the syllabus is "
            "precise about the kinds of evidence and how they combine."
        ),
        image(fig("authentication-factors")),
        desc(
            "MULTI-FACTOR authentication requires evidence from DIFFERENT "
            "categories. A password and a security question are both things "
            "you know, so requiring both is not multi-factor -- one theft of "
            "a secret yields both, which is exactly the failure the "
            "arrangement is supposed to prevent."
        ),
        table(
            ["Factor", "Fails when", "Recovery"],
            [["Something you know", "Guessed, phished or reused",
              "Reset it"],
             ["Something you have", "Lost or stolen",
              "Reissue, with an identity check"],
             ["Something you are", "Copied or spoofed",
              "Impossible -- it cannot be changed"]],
            caption="Three factors and how each one fails.",
            footer="The last cell is the reason biometrics are not simply "
                   "the best factor. A compromised fingerprint is compromised "
                   "permanently, so biometrics identify well and make a poor "
                   "sole credential."),
        desc(
            "AUTHORISATION is the separate question of what an authenticated "
            "party may do, and confusing the two produces systems that "
            "identify people carefully and then let them do anything. "
            "ACCOUNTABILITY completes the set: logging who did what, which "
            "requires both of the others to have worked."
        ),
    ]),

    ("Access Control Models", [
        desc(
            "Once identity is established, something decides what is "
            "permitted, and the syllabus names three arrangements."
        ),
        image(fig("access-control-models")),
        content_tabs(
            "THREE MODELS",
            "Who holds the decision, and what that costs.",
            [("Discretionary",
              "the owner decides",
              "Whoever owns a resource grants access to it. Flexible and "
              "familiar -- ordinary file sharing works this way -- and it "
              "produces an estate where nobody can say who has access to "
              "what."),
             ("Mandatory",
              "the system decides",
              "Access follows labels and clearances set centrally, and owners "
              "cannot override the policy. Used where classification is "
              "legally mandated, and rigid by design."),
             ("Role-based",
              "the job decides",
              "Permissions attach to roles and users are assigned roles. "
              "Scales, audits well, and survives people changing jobs -- "
              "which is why it is the usual answer for a business system.")]),
        desc(
            "Role-based control is what makes least privilege actually "
            "administrable. Granting a role rather than a list of individual "
            "permissions is the only version anybody maintains correctly over "
            "years, and it makes the question 'who can approve payments' "
            "answerable rather than requiring a survey."
        ),
    ]),

    ("Key Management", [
        desc(
            "Cryptography fails in practice through key handling far more "
            "often than through the mathematics, and the syllabus treats it "
            "as an operational discipline."
        ),
        ul([
            "A key must be generated with genuine randomness. A predictable "
            "key defeats an unbreakable algorithm entirely.",
            "It must be stored where the data it protects is not -- a key "
            "beside its ciphertext protects nothing.",
            "It must be distributed without interception, which is the "
            "problem asymmetric cryptography exists to solve.",
            "It should be rotated, so that a compromise exposes a bounded "
            "period rather than everything ever encrypted.",
            "It must be destroyed reliably when retired, since old keys "
            "decrypt old archives.",
            "There must be a recovery route, or losing a key destroys the "
            "data as effectively as an attacker would.",
        ]),
        desc(
            "The last two are in tension, and recognising that is the "
            "examinable judgement. A key that can be recovered can be "
            "recovered by the wrong person, and a key that genuinely cannot "
            "be recovered turns a lost key into permanent data loss -- so the "
            "design decides which failure it prefers rather than avoiding "
            "both."
        ),
    ]),

    ("Encrypting Data at Rest and in Transit", [
        desc(
            "The two are separate problems with separate answers, and an item "
            "usually turns on which one a scenario describes."
        ),
        table(
            ["", "In transit", "At rest"],
            [["Protects against", "Interception on the network",
              "A stolen device or disk"],
             ["Typically", "TLS", "Full-disk or field-level encryption"],
             ["Key held by", "Negotiated per session",
              "The system, which must unlock it somehow"],
             ["Fails when", "The certificate is not verified",
              "The key is stored on the same device unprotected"]],
            caption="Two encryption problems that are frequently conflated.",
            footer="Encrypting in transit does nothing for a stolen laptop, "
                   "and encrypting at rest does nothing for traffic on a "
                   "shared network -- so a scenario naming one leaves the "
                   "other entirely unaddressed."),
        desc(
            "There is a third case the syllabus mentions: data IN USE, "
            "decrypted in memory while being processed. It is the hardest to "
            "protect, which is why an attacker with access to a running "
            "system may reach data that is encrypted both in transit and at "
            "rest."
        ),
    ]),

    ("Single Sign-On and Federated Identity", [
        desc(
            "Authenticating separately to every system produces password "
            "reuse and administrative sprawl, so identity is centralised."
        ),
        desc(
            "SINGLE SIGN-ON authenticates once and issues a token other "
            "systems accept, so a user proves themselves one time and an "
            "administrator disables one account to remove all access. "
            "FEDERATION extends this across organisations, letting one "
            "organisation's users access another's systems without accounts "
            "being created there."
        ),
        compare_grid(
            "WHAT CENTRALISING IDENTITY BUYS AND COSTS",
            "The same property produces both.",
            [("Gains",
              ["One credential for a user to protect properly",
               "One place to disable an account estate-wide",
               "Consistent policy, and one audit trail",
               "Fewer passwords, so less reuse"]),
             ("Costs",
              ["One credential's theft reaches everything",
               "The identity service is a single point of failure",
               "Its compromise is total rather than local",
               "Which is why it warrants the strongest controls"])]),
        desc(
            "The consequence is that multi-factor authentication belongs on "
            "the identity service before anywhere else. Concentrating access "
            "into one credential is only sound if that credential is "
            "correspondingly harder to steal."
        ),
    ]),

    ("Where Cryptography Does Not Help", [
        desc(
            "Items sometimes offer encryption as the answer to a problem it "
            "does not address, and knowing the boundary is what rejects "
            "them."
        ),
        table(
            ["Situation", "Why encryption does not help"],
            [["An authorised user misuses their access",
              "They hold the key legitimately"],
             ["A system is unavailable",
              "Confidentiality is untouched by an outage"],
             ["Malware runs on the machine",
              "It sees the data decrypted, as the user does"],
             ["A user is deceived into sending data",
              "The transfer is encrypted and still wrong"],
             ["Data is deleted",
              "Encryption protects secrecy, not existence"]],
            caption="Five problems encryption is not the answer to.",
            footer="The pattern is that encryption controls WHO CAN READ "
                   "something. Any problem that is not about reading -- "
                   "availability, misuse by the authorised, deception -- "
                   "needs a different control entirely."),
        desc(
            "This is worth carrying into every item offering encryption as an "
            "option, because it is the most plausible-sounding distractor in "
            "the category. Naming the property at risk first settles it: if "
            "the property is not confidentiality, encryption is not the "
            "answer."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where cryptography items are lost."),
        ul([
            "Signing with the wrong key. Signing uses the SENDER's private "
            "key; encrypting uses the RECIPIENT's public key.",
            "Expecting a signature to hide the message. It provides no "
            "confidentiality at all.",
            "Expecting encryption to provide integrity. Ciphertext can be "
            "altered without detection.",
            "Calling a hash encryption. There is no key and nothing to "
            "reverse.",
            "Storing password hashes without a salt, so identical passwords "
            "share a hash across accounts.",
            "Treating a MAC as equivalent to a signature. A shared key means "
            "no non-repudiation.",
            "Counting two secrets as two factors. Multi-factor requires "
            "different categories.",
            "Reading a valid certificate as evidence a site is "
            "trustworthy.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A contract is to be sent by email. The recipient must be able "
            "to prove the sender wrote it and that it was not altered, and "
            "the contents must not be readable in transit. What is applied, "
            "and in which order?\""
        ),
        ol([
            "Separate the requirements: proof of origin and integrity is one, "
            "confidentiality is another.",
            "Proof of origin and integrity means a DIGITAL SIGNATURE, using "
            "the sender's private key.",
            "Confidentiality means ENCRYPTION, using the recipient's public "
            "key -- or more practically a symmetric key exchanged that way.",
            "Both are needed, so both are applied: the message is signed and "
            "then encrypted.",
            "Signing first means the signature covers what was actually "
            "written, and is itself protected by the encryption.",
        ]),
        desc(
            "Step five is the part worth reasoning about rather than "
            "memorising. Signing what was written rather than what the "
            "ciphertext happens to be keeps the signature meaningful "
            "independently of how it was transmitted -- and it means the "
            "signature is not visible to anyone intercepting the message."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Cryptography underpins several other lessons."),
        ul([
            "TLS combining asymmetric key agreement with symmetric bulk "
            "encryption is the network applications lesson.",
            "Certificate expiry as an avoidable outage is Service "
            "Management.",
            "Hash functions appeared as a data structure technique in "
            "Algorithms, with different requirements.",
            "Role-based access control is how the least privilege of the "
            "previous lesson is administered.",
            "Non-repudiation supports the legal evidence requirements of "
            "Legal Affairs.",
            "Key management is an operational process, not a mathematical "
            "one, which System Audit examines.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Which key encrypts, which key signs",
              "The recipient's public key; the sender's private key",
              "Getting this backwards is what nearly every distractor in the "
              "category is built from."),
             ("What a signature does not provide",
              "Confidentiality",
              "A signed message is readable by everyone. Signing and "
              "encrypting are separate operations."),
             ("Why both kinds of encryption are used together",
              "Asymmetric distributes the key, symmetric encrypts the data",
              "Each covers exactly the other's weakness, which is what TLS "
              "does."),
             ("Why a salt is added to a password hash",
              "So identical passwords do not share a digest",
              "Which forces an attacker to attack each account separately "
              "rather than all at once."),
             ("MAC against signature",
              "A shared key, so no non-repudiation",
              "Both parties could have produced it, so neither can prove the "
              "other did."),
             ("What multi-factor actually requires",
              "Evidence from DIFFERENT categories",
              "A password and a security question are both things you know, "
              "so they are one factor twice.")]),
    ]),
]

_crypto_quiz = [
    mcq("HARD",
        "A message is to be sent so the recipient can prove who wrote it and "
        "that it is unaltered.\n\nWhich key does the sender use?",
        [("The recipient's public key, so only they can verify it", False),
         ("The sender's own private key", True),
         ("A symmetric key shared in advance between both parties", False),
         ("The recipient's private key, obtained from their "
          "certificate", False)],
        "Signing encrypts a digest of the message with the sender's PRIVATE "
        "key, which only they hold -- so anyone with the corresponding public "
        "key can verify it and nobody can forge it. Encryption for "
        "confidentiality works the other way, using the RECIPIENT's public "
        "key. That reversal is what nearly every distractor in this category "
        "is built from."),

    mcq("AVERAGE",
        "What does a digital signature NOT provide?",
        [("Confidentiality of the message contents", True),
         ("Proof that the message has not been altered in transit", False),
         ("Proof of which party produced the message", False),
         ("Evidence the sender cannot later repudiate", False)],
        "A signature is computed alongside the message and does not hide it, "
        "so a signed message is readable by everyone. Confidentiality "
        "requires separate encryption, and when both are wanted the message "
        "is signed and then encrypted -- so the signature covers what was "
        "actually written and is itself protected in transit."),

    mcq("HARD",
        "Why do real systems combine symmetric and asymmetric encryption "
        "rather than using one alone?",
        [("Asymmetric solves key distribution while symmetric is fast enough "
          "for the data", True),
         ("Symmetric encryption alone can be broken by an attacker who "
          "captures enough ciphertext", False),
         ("Asymmetric encryption cannot operate on messages longer than a "
          "single fixed block", False),
         ("Combining them means an attacker must break two independent "
          "algorithms to succeed", False)],
        "Two parties who have never met cannot agree a shared secret over a "
        "watched channel, which is what asymmetric cryptography solves -- and "
        "it is orders of magnitude slower, which makes it impractical for "
        "bulk data. So asymmetric operations agree a symmetric key and "
        "symmetric encryption carries the traffic, each covering exactly the "
        "other's weakness. This is what TLS does."),

    mcq("HARD",
        "Why is a salt added before hashing a stored password?",
        [("So identical passwords do not produce identical stored "
          "digests", True),
         ("So the original password can be recovered if a user forgets "
          "it", False),
         ("So the hash function produces a digest of a consistent "
          "length", False),
         ("So the hash can be verified without the password being "
          "transmitted", False)],
        "Without a salt, every account using the same password stores the "
        "same digest, so an attacker who guesses one has broken all of them "
        "at once and can precompute candidates for everybody. A unique random "
        "salt per password makes each digest unique and forces the guessing "
        "to be repeated per account. Hashing is one-way, so recovery is never "
        "possible."),

    mcq("AVERAGE",
        "Which of these is genuinely multi-factor authentication?",
        [("A password and a code from a hardware token", True),
         ("A password and the answer to a personal security question", False),
         ("A password that must be entered twice on separate screens", False),
         ("A password and a PIN of a different length", False)],
        "Multi-factor requires evidence from DIFFERENT categories -- "
        "something you know, something you have, something you are. A "
        "password plus a token combines the first two, so stealing the secret "
        "is not enough. A password and a security question are both things "
        "you know, and one phishing message yields both, which is exactly the "
        "failure the arrangement is meant to prevent."),

    mcq("AVERAGE",
        "What property does a cryptographic hash function provide that "
        "encryption does not?",
        [("Integrity, since any change to the input changes the "
          "digest", True),
         ("Confidentiality, because the digest cannot be read by an "
          "attacker", False),
         ("Non-repudiation, because only one party can produce the "
          "digest", False),
         ("Availability, because the digest is smaller than the original "
          "data", False)],
        "A hash detects modification: any change to the input produces a "
        "different digest, and finding two inputs with the same one is "
        "infeasible. Encryption hides content and does not detect alteration "
        "-- ciphertext can be modified. A hash provides no authenticity "
        "either, since anyone can hash an altered file; proving origin "
        "requires a signature."),

    mcq("HARD",
        "Why can a message authentication code not provide "
        "non-repudiation?",
        [("Both parties hold the shared key, so either could have produced "
          "it", True),
         ("It is computed over a hash rather than over the message "
          "itself", False),
         ("It can be recomputed by anyone who intercepts the message in "
          "transit", False),
         ("It does not include a timestamp establishing when the message was "
          "sent", False)],
        "A MAC proves integrity and origin to the two parties sharing the key, "
        "and precisely because both hold it, neither can prove to a third "
        "party that the other produced a message. A digital signature uses a "
        "private key only one party holds, which is what makes repudiation "
        "impossible -- the distinction is about who could have created it, "
        "not about how it is computed."),

    mcq("AVERAGE",
        "In role-based access control, how are permissions granted?",
        [("To roles, with users assigned to the roles they need", True),
         ("To individual users, by whoever owns each resource", False),
         ("According to security labels compared against user "
          "clearances", False),
         ("To groups defined by which department each user belongs to", False)],
        "Permissions attach to roles and users are assigned roles, so someone "
        "changing jobs is reassigned rather than having a list of permissions "
        "edited. This is what makes least privilege administrable over years "
        "and makes 'who can approve payments' answerable. Owners granting "
        "access is DISCRETIONARY control; labels and clearances are "
        "MANDATORY."),

    mcq("HARD",
        "A biometric factor is compromised -- an attacker obtains a usable "
        "copy of a fingerprint.\n\nWhat makes this different from a stolen "
        "password?",
        [("The factor cannot be changed, so it is compromised "
          "permanently", True),
         ("Biometric data cannot be revoked from the authentication system "
          "once enrolled", False),
         ("The attacker gains access to every system rather than only the one "
          "breached", False),
         ("Biometric matching is probabilistic, so the compromise cannot be "
          "detected", False)],
        "A password can be reset and a token reissued; a fingerprint cannot be "
        "replaced. That permanence is why biometrics identify well and make a "
        "poor sole credential -- and why they are normally combined with "
        "another factor rather than relied on alone. It is a property of the "
        "factor rather than of any particular system's enrolment."),

    mcq("AVERAGE",
        "What does verifying a website's certificate establish?",
        [("That the public key belongs to the domain named in it", True),
         ("That the organisation operating the site is reputable and "
          "audited", False),
         ("That the content the site serves has not been tampered "
          "with at source", False),
         ("That the site's operator holds a licence to process personal "
          "data", False)],
        "The certificate binds a key to an identity, signed by an authority "
        "the verifier trusts through a chain reaching a root -- so it "
        "establishes WHICH domain you reached and enables encryption to it. "
        "It says nothing about whether that domain deserves your data, which "
        "is why a convincing phishing site can hold a perfectly valid "
        "certificate and display a padlock."),
]

LESSON_SEC_CRYPTO = lesson(
    MAJOR, MIDDLE,
    "Cryptography, Authentication and Digital Signatures",
    _crypto_quiz,
    lesson_structure(
        "Cryptography, Authentication and Digital Signatures",
        "Cryptography is a small set of tools each providing a specific "
        "property, and most items in this category are answered by matching "
        "them correctly -- while most wrong answers come from expecting a "
        "tool to provide something it does not. So this lesson is organised "
        "around that mapping: symmetric encryption fast but hard to "
        "distribute, asymmetric slow but distributable, the two combined in "
        "every real system, hashes providing integrity without authenticity, "
        "and signatures adding non-repudiation because only one party holds "
        "the key. It closes with authentication factors, what multi-factor "
        "genuinely requires, and the access control models that make least "
        "privilege administrable.",
        [
            "Match each cryptographic tool to the property it provides",
            "Explain symmetric encryption and the key distribution problem",
            "State which key is used for encrypting and which for signing",
            "Explain why real systems combine both kinds of encryption",
            "State the properties of a hash and why salting is necessary",
            "Describe how a signature is produced and verified",
            "Explain certificates, trust chains and their limits",
            "Distinguish the authentication factors and the access control "
            "models",
        ],
        85,
        _crypto_sections,
        [
            ("Symmetric encryption",
             "One shared key for both operations. Fast, and its whole "
             "difficulty is distributing the key."),
            ("Key distribution problem",
             "Two parties who have never met cannot agree a secret over a "
             "watched channel -- which is why asymmetric cryptography "
             "exists."),
            ("Asymmetric encryption",
             "A public and a private key, mathematically paired. Slow, and "
             "distributable."),
            ("Encrypting for confidentiality",
             "Uses the RECIPIENT's public key, so only their private key "
             "undoes it."),
            ("Signing",
             "Uses the SENDER's private key, so anyone may verify and nobody "
             "may forge."),
            ("Hybrid encryption",
             "Asymmetric operations agree a symmetric key and symmetric "
             "encryption carries the data. What TLS does."),
            ("Hash function",
             "One-way, fixed-length, collision-resistant and deterministic. "
             "Provides integrity, not authenticity."),
            ("Salt",
             "A unique random value per password, so identical passwords do "
             "not share a digest."),
            ("Digital signature",
             "A hash encrypted with the sender's private key. Provides "
             "integrity, authenticity and non-repudiation -- never "
             "confidentiality."),
            ("Message authentication code",
             "Integrity and authenticity from a shared key, and therefore no "
             "non-repudiation."),
            ("Certificate",
             "A public key plus an identity, signed by an authority. Proves "
             "which domain, not whether it is trustworthy."),
            ("Public key infrastructure",
             "The authorities, certificates, distribution and revocation that "
             "make certificates usable."),
            ("Authentication factors",
             "Something you know, have, or are. Multi-factor requires "
             "different categories, not two secrets."),
            ("Authentication against authorisation",
             "Establishing who somebody is, against deciding what they may "
             "do."),
            ("Access control models",
             "Discretionary -- the owner decides; mandatory -- the system "
             "does; role-based -- the job does."),
        ],
        "Each cryptographic tool provides specific properties and lacks "
        "others, and matching them is most of this category: encryption gives "
        "confidentiality without integrity, a hash gives integrity without "
        "authenticity, a MAC adds authenticity without non-repudiation, and "
        "only a signature gives all three -- while providing no "
        "confidentiality at all. Symmetric encryption is fast and its entire "
        "difficulty is distributing the key; asymmetric encryption solves "
        "that and is far slower, so every real system uses asymmetric "
        "operations to agree a symmetric key and symmetric encryption for the "
        "data. The key direction is what distractors are built from: "
        "encrypting uses the RECIPIENT's public key and signing uses the "
        "SENDER's private key. Hashes are one-way and collision-resistant, "
        "which is why passwords are stored as digests -- with a SALT, or "
        "identical passwords share a digest and one guess breaks every "
        "account holding it. Certificates bind a key to an identity through a "
        "chain reaching a trusted root, and establish which domain rather "
        "than whether it deserves trust. Authentication draws on three "
        "factors and multi-factor means DIFFERENT categories, so two secrets "
        "are one factor twice; biometrics identify well and make a poor sole "
        "credential because a compromised one cannot be replaced. And access "
        "control is discretionary, mandatory or role-based, with the last "
        "being what makes least privilege administrable over years.",
        exam_notes=[
            desc(
                "Nearly every item here is answered by knowing which property "
                "a tool provides, or which key an operation uses."
            ),
            ul([
                "Stating which key signs and which key encrypts.",
                "Identifying what a signature does not provide.",
                "Explaining why both encryption types are combined.",
                "Explaining the purpose of a salt.",
                "Distinguishing a MAC from a signature.",
                "Identifying genuine multi-factor authentication.",
                "Stating what a certificate establishes.",
            ]),
            desc(
                "Before choosing an option, name the property the scenario "
                "actually needs -- confidentiality, integrity, authenticity "
                "or non-repudiation. The distractors are almost always tools "
                "that provide a DIFFERENT one of the four, and naming the "
                "requirement first eliminates them without further work."
            ),
        ],
    ))

LESSONS = [LESSON_SEC_THREATS, LESSON_SEC_CRYPTO]

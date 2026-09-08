"""Technology Element -> Network, lesson 5.

Syllabus minor category 5 (network applications): the services that run on
top of the stack -- naming, mail, the web, and the distributed-service
patterns built from them.

Every service here is a worked example of the layers below, so the lesson
keeps pointing back at them: DNS caching explains a change that does not take
effect, mail's separate protocols explain where a message can be stuck, and
HTTP's statelessness explains why sessions exist at all.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Technology Element"
MIDDLE = "Network"

_sections = [
    ("Services on Top of the Stack", [
        desc(
            "The previous lessons built a network that moves bytes between "
            "applications. This lesson covers what runs on it, and each "
            "service turns out to be a worked example of the layers "
            "underneath."
        ),
        table(
            ["Service", "Solves", "Depends on"],
            [["DNS", "Nobody can remember addresses",
              "UDP, and caching"],
             ["Mail", "Asynchronous messages between people",
              "TCP, and store-and-forward"],
             ["Web", "Documents and applications on demand",
              "TCP, DNS and TLS"],
             ["File and directory services", "Shared resources and identity",
              "The local network, mostly"]],
            caption="Four service families, and what each rests on.",
            footer="The third column is why this lesson belongs last in the "
                   "category. Almost every problem with these services is a "
                   "problem in something they depend on, which the previous "
                   "lesson's layered isolation locates."),
    ]),

    ("The Domain Name System", [
        desc(
            "DNS translates names into addresses, and it is a distributed "
            "hierarchical database rather than a lookup table anywhere in "
            "particular."
        ),
        image(fig("dns-resolution")),
        desc(
            "No single server holds the whole namespace. Root servers know "
            "which servers are authoritative for each top-level domain, those "
            "know which are authoritative for each domain beneath them, and "
            "the walk continues until a server holding the actual record is "
            "reached. A RESOLVER performs that walk on a client's behalf and "
            "caches what it learns."
        ),
        table(
            ["Record", "Holds", "Used for"],
            [["A", "An IPv4 address", "The ordinary name lookup"],
             ["AAAA", "An IPv6 address", "The same, over IPv6"],
             ["CNAME", "Another name", "An alias, resolved again"],
             ["MX", "A mail server's name", "Where to deliver mail"],
             ["NS", "A name server", "Delegating a zone"],
             ["TXT", "Free text", "Verification and policy records"]],
            caption="Six record types the examination names.",
            footer="An MX record is why mail for a domain can be delivered to "
                   "servers that have nothing to do with the domain's web "
                   "site -- the two are separate records answering separate "
                   "questions."),
    ]),

    ("Caching, TTL and Why a Change Does Not Take Effect", [
        desc(
            "The single most examined DNS behaviour is not resolution but "
            "caching, because it explains an outcome that otherwise looks "
            "like a fault."
        ),
        desc(
            "Every record carries a TIME TO LIVE saying how long a resolver "
            "may reuse it. Until that expires, the resolver answers from "
            "cache without consulting anyone -- so a changed record takes "
            "effect gradually across the internet as each cached copy "
            "expires, rather than everywhere at once."
        ),
        ol([
            "Some users reach the new address immediately, having had nothing "
            "cached.",
            "Others continue reaching the old one for up to the full TTL.",
            "Both are working correctly, which is what makes the symptom "
            "confusing.",
            "The remedy is applied BEFORE the change: lower the TTL well in "
            "advance, make the change, then raise it again.",
        ]),
        desc(
            "Step four is the examinable one and it cannot be applied "
            "retroactively. Lowering the TTL after the change has no effect "
            "on copies already cached under the old, longer value -- so the "
            "planning has to happen at least one old-TTL period before the "
            "cutover."
        ),
    ]),

    ("Electronic Mail", [
        desc(
            "Mail is the syllabus's clearest example of a store-and-forward "
            "system, and its protocols divide cleanly by direction."
        ),
        table(
            ["Protocol", "Direction", "Notes"],
            [["SMTP", "Sending, and server to server",
              "Port 25 between servers; submission uses another port"],
             ["POP3", "Retrieving", "Traditionally downloads and deletes"],
             ["IMAP", "Retrieving",
              "Leaves messages on the server, syncing state"]],
            caption="Three protocols, split by what they are for.",
            footer="POP against IMAP is the examined pair, and the difference "
                   "is WHERE the mailbox lives. POP moves it to one device; "
                   "IMAP keeps it on the server, which is what makes the same "
                   "mailbox usable from a phone and a laptop at once."),
        desc(
            "STORE AND FORWARD is what distinguishes mail from a conversation "
            "protocol. Each server accepts responsibility for a message, "
            "stores it, and passes it on when it can -- so a destination "
            "being unavailable delays delivery rather than failing it, and a "
            "message can sit in a queue for hours legitimately."
        ),
        desc(
            "That also decides where a delivery problem is located. If the "
            "sending server accepted the message, the sender's side worked; "
            "the question is which hop is holding it, and the answer is in "
            "the message's own received headers."
        ),
    ]),

    ("The Web", [
        desc(
            "HTTP is a request-response protocol over TCP, and its most "
            "consequential property is what it does NOT keep."
        ),
        image(fig("web-request")),
        desc(
            "HTTP is STATELESS: each request is independent and the server "
            "remembers nothing between them. That is what allows any server "
            "in a pool to answer any request, which is the entire basis of "
            "web scalability -- and it is why anything resembling a logged-in "
            "session has to be reconstructed on every request from something "
            "the client sends."
        ),
        table(
            ["Method", "Means", "Should be"],
            [["GET", "Retrieve a resource",
              "Safe -- it changes nothing"],
             ["POST", "Submit data for processing",
              "Not repeatable safely"],
             ["PUT", "Store a resource at a location",
              "Idempotent -- repeating it changes nothing further"],
             ["DELETE", "Remove a resource", "Idempotent"]],
            caption="Four methods and the guarantees each is expected to "
                    "honour.",
            footer="A GET that changes something violates the contract, and "
                   "the consequences are real: browsers, caches and crawlers "
                   "all assume a GET is safe to repeat, so such a design "
                   "gets its state changed by things merely looking at it."),
        desc(
            "The STATUS CODE families are examined by their first digit: 2xx "
            "succeeded, 3xx redirects elsewhere, 4xx says the CLIENT's "
            "request was wrong, and 5xx says the SERVER failed while handling "
            "an acceptable request. Distinguishing 4xx from 5xx locates a "
            "fault immediately, which is why the split exists."
        ),
    ]),

    ("Sessions, Cookies and State", [
        desc(
            "Since HTTP keeps no state, everything that behaves as though it "
            "does is built on top of it, and how is worth knowing precisely."
        ),
        ol([
            "The server creates a session and gives it an identifier.",
            "The identifier is returned to the client, normally as a cookie.",
            "The client sends that cookie with every subsequent request.",
            "The server looks up the session by identifier and behaves as if "
            "it remembered.",
        ]),
        desc(
            "The security consequence follows directly: whoever holds the "
            "identifier IS the session, as far as the server can tell. That "
            "is why session identifiers must be unguessable, sent only over "
            "an encrypted connection, and invalidated on logout -- and it is "
            "the mechanism the Security lessons return to."
        ),
        desc(
            "Where the session data is stored also decides how a system "
            "scales. Keeping it in one server's memory ties each user to that "
            "server, which undoes the statelessness that made a pool possible "
            "-- so sessions are held in a shared store instead, which is the "
            "same reasoning that makes any server able to answer any request."
        ),
    ]),

    ("Encrypting the Web", [
        desc(
            "HTTPS is HTTP carried over TLS, and the syllabus expects what "
            "TLS actually provides rather than the handshake's details."
        ),
        table(
            ["Provides", "By", "Prevents"],
            [["Confidentiality", "Encrypting the traffic",
              "Reading it in transit"],
             ["Integrity", "Authenticating each message",
              "Modifying it undetected"],
             ["Authentication", "A certificate signed by a trusted authority",
              "Impersonating the site"],
             ["Nothing about", "The site's own trustworthiness",
              "A padlock is not an endorsement"]],
            caption="Three guarantees, and one common misreading.",
            footer="The last row matters. A certificate proves you are "
                   "talking to the domain named in it and says nothing about "
                   "whether that domain deserves your data -- which is "
                   "precisely how a convincing phishing site can be served "
                   "over HTTPS."),
        desc(
            "The CERTIFICATE chain is what makes this work at scale. A "
            "browser trusts a small set of root authorities, each of which "
            "vouches for intermediates, which vouch for sites -- so a browser "
            "can verify a site it has never encountered by following the "
            "chain back to a root it already trusts."
        ),
    ]),

    ("Distributed Service Patterns", [
        desc(
            "Applications assembled across a network follow a few recurring "
            "shapes, and the syllabus names them."
        ),
        content_accordion(
            "FOUR ARRANGEMENTS",
            "Where the work happens, and what that costs.",
            [("Client-server",
              "One party requests and one provides. Simple, centrally "
              "managed, and limited by the server -- which is also the single "
              "point of failure."),
             ("Three-tier",
              "Presentation, application logic and data separated onto "
              "different tiers, each scalable and replaceable "
              "independently. The standard shape for a business system."),
             ("Peer-to-peer",
              "Every participant is both client and server. Scales with its "
              "users rather than against them, and makes central control and "
              "consistency hard."),
             ("Cloud services",
              "Capacity rented rather than owned, in the layers System "
              "Strategy covers as infrastructure, platform and software as a "
              "service.")]),
        desc(
            "A LOAD BALANCER is what makes a pool of servers behave as one, "
            "distributing requests and removing failed members from "
            "rotation. It depends entirely on requests being answerable by "
            "any member, which is HTTP's statelessness again -- and it is why "
            "session state in a single server's memory breaks the whole "
            "arrangement."
        ),
        desc(
            "A CDN applies the same idea geographically, serving copies from "
            "locations near the user. It reduces the propagation delay that "
            "no amount of bandwidth addresses, which is the one component of "
            "latency the earlier lesson said nothing could reduce -- unless "
            "the distance itself is shortened."
        ),
    ]),

    ("Other Services Worth Knowing", [
        desc(
            "Several more services appear in items without deserving sections "
            "of their own."
        ),
        table(
            ["Service", "Provides", "Watch for"],
            [["FTP", "File transfer",
              "Unencrypted, including credentials -- SFTP instead"],
             ["SSH", "Encrypted remote access",
              "Replaced telnet, which sent passwords in clear"],
             ["NTP", "Time synchronisation",
              "A prerequisite for log correlation and certificates"],
             ["Directory services", "Central identity and resource lookup",
              "One place to disable an account estate-wide"],
             ["VPN", "An encrypted tunnel across a public network",
              "Confidentiality only -- it grants no authorisation"]],
            caption="Five services and the point most often examined about "
                    "each.",
            footer="The pattern in the first two rows is worth naming: "
                   "several early protocols sent credentials in clear because "
                   "the networks they were built for were trusted, and each "
                   "has an encrypted successor."),
        desc(
            "NTP's presence in this list is not filler. Certificates have "
            "validity periods and logs need comparable timestamps, so a "
            "machine whose clock is badly wrong fails TLS connections and "
            "produces unusable evidence -- two symptoms that look unrelated "
            "and share one cause."
        ),
    ]),

    ("Caching Throughout the Web", [
        desc(
            "DNS is not the only thing caching, and knowing where the copies "
            "are is what makes an inconsistent symptom interpretable."
        ),
        table(
            ["Cache", "Holds", "Cleared by"],
            [["Browser", "Pages, images, scripts already fetched",
              "The user, or an expiry the server set"],
             ["Proxy", "Responses on behalf of many users",
              "Its own expiry rules"],
             ["CDN", "Copies distributed near users",
              "An expiry, or an explicit purge"],
             ["DNS resolver", "Name-to-address records", "The record's TTL"]],
            caption="Four caches between a user and an origin server.",
            footer="A change that some users see and others do not can be "
                   "held at any of these, which is why 'clear your browser "
                   "cache' resolves some reports and not others -- it "
                   "addresses only the first row."),
        desc(
            "The server controls most of this through the expiry information "
            "it sends with each response, and that control is a design "
            "decision rather than a default worth accepting. Long expiry "
            "makes a site fast and a correction slow to reach people; short "
            "expiry does the reverse, which is the same trade the DNS TTL "
            "makes."
        ),
    ]),

    ("When a Service Is Slow", [
        desc(
            "'The web site is slow' is the application-layer equivalent of "
            "'the network is down', and it decomposes the same way."
        ),
        ol([
            "Time the name resolution. A slow or failing resolver delays "
            "everything before a connection is even attempted.",
            "Time the connection. A slow TCP handshake or TLS negotiation "
            "points at the network or the server's load rather than the "
            "application.",
            "Time the first byte of the response. A long wait here is the "
            "server generating the page -- application code or a database.",
            "Time the rest of the transfer. Slow here is bandwidth, or a "
            "response far larger than it needs to be.",
            "Count the additional resources. Fifty small files each cost a "
            "request, which dominates on a high-latency link.",
        ]),
        desc(
            "Each step has an entirely different remedy, which is why "
            "measuring which one is slow comes before changing anything. "
            "Adding server capacity when the delay is in resolution, or "
            "widening a link when the delay is in page generation, is the "
            "familiar mistake in its application-layer form."
        ),
    ]),

    ("Making Services Available", [
        desc(
            "The services in this lesson are the ones an organisation is "
            "judged on, so the syllabus expects their availability to be "
            "designed rather than hoped for."
        ),
        ul([
            "Publish more than one name server for a domain, since a domain "
            "nobody can resolve is a domain that does not exist.",
            "Publish more than one MX record, so mail has somewhere to go "
            "when the first server is down -- and store-and-forward makes "
            "this genuinely effective.",
            "Put web servers behind a load balancer that removes failed "
            "members, which requires the statelessness discussed earlier.",
            "Hold session state in a shared store, or losing one server logs "
            "out everybody it was serving.",
            "Watch certificate expiry, which is a scheduled outage nobody "
            "scheduled.",
        ]),
        desc(
            "The certificate point earns its place because it is the failure "
            "most often met and least often anticipated. A certificate "
            "expires at a known moment, takes a site down completely, and is "
            "prevented entirely by monitoring a date -- which is why it "
            "appears in items as an example of an avoidable outage."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where application items are lost."),
        ul([
            "Expecting a DNS change to take effect immediately. Cached "
            "records are served until their TTL expires.",
            "Lowering a TTL after a change rather than before it, which "
            "affects nothing already cached.",
            "Confusing POP with IMAP. The difference is where the mailbox "
            "lives.",
            "Treating a queued mail message as a failure. Store-and-forward "
            "means delay is normal.",
            "Forgetting HTTP is stateless, and that sessions are "
            "reconstructed from what the client sends.",
            "Using GET for something that changes state, which caches and "
            "crawlers will then trigger.",
            "Reading a padlock as evidence a site is trustworthy. It "
            "identifies the domain, nothing more.",
            "Confusing 4xx with 5xx status codes. One blames the request, the "
            "other the server.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A company moves its web site to a new server and updates the "
            "DNS record. Some users reach the new server immediately, while "
            "others continue reaching the old one for the rest of the day. "
            "Explain, and state what should have been done.\""
        ),
        ol([
            "Establish the mechanism: resolvers cache records for the "
            "duration of each record's TTL.",
            "A user whose resolver had nothing cached queries afresh and gets "
            "the new address.",
            "A user whose resolver cached the old record keeps receiving it "
            "until the TTL expires -- and it is answering correctly.",
            "So both behaviours are correct, and the difference is which "
            "resolver had cached what and when.",
            "The remedy is applied in advance: lower the TTL to a few minutes "
            "at least one old-TTL period before the change, cut over, then "
            "restore the TTL.",
        ]),
        desc(
            "The 'at least one old-TTL period before' is the part that turns "
            "a partial answer into a complete one. Reducing the TTL only "
            "affects records handed out afterwards, so copies cached under "
            "the old value are unaffected -- which is why the preparation "
            "must begin before the change is even scheduled."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Network applications draw on nearly every earlier lesson."),
        ul([
            "DNS choosing UDP and falling back to TCP is the transport "
            "decision of the protocols lesson.",
            "TLS certificates and the trust chain are developed in the "
            "Cryptography lesson.",
            "Session identifiers as bearer credentials are a Security "
            "concern.",
            "Three-tier architecture is the layering of the Software "
            "lessons.",
            "Load balancing across a stateless pool is the availability "
            "argument from System Configuration.",
            "CDN placement addresses propagation delay, the one latency "
            "component bandwidth cannot touch.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Why a DNS change is not immediate",
              "Cached records are served until their TTL expires",
              "So the TTL is lowered at least one old-TTL period BEFORE the "
              "change, never after."),
             ("POP against IMAP",
              "The mailbox on one device, against on the server",
              "Which is what lets IMAP serve a phone and a laptop from the "
              "same mailbox."),
             ("What HTTP being stateless allows",
              "Any server in a pool to answer any request",
              "Which is the basis of web scaling, and why session state must "
              "not live in one server's memory."),
             ("Why GET must not change state",
              "Caches, browsers and crawlers assume it is safe to repeat",
              "So a GET that changes something gets triggered by things "
              "merely looking."),
             ("What a certificate proves",
              "That this is the domain named in it",
              "Nothing about trustworthiness -- a phishing site can hold a "
              "valid certificate."),
             ("4xx against 5xx",
              "The request was wrong, against the server failed",
              "Which locates the fault before any other investigation.")]),
    ]),
]

_quiz = [
    mcq("HARD",
        "A web site is moved and its DNS record updated. Some users reach the "
        "new server at once while others reach the old one for hours.\n\n"
        "What explains this?",
        [("Resolvers serve cached records until each record's TTL "
          "expires", True),
         ("The change propagated to some root name servers before it reached "
          "the remaining ones", False),
         ("The old server continues answering because its address remains in "
          "the zone as a secondary", False),
         ("Users reaching the old server have resolvers configured to query a "
          "different authority", False)],
        "A resolver holding a cached record answers from it without "
        "consulting anyone until the TTL expires, so both groups of users are "
        "being served correctly and simply hold copies of different ages. The "
        "remedy is applied in advance: lower the TTL at least one old-TTL "
        "period before the change, cut over, then restore it -- lowering it "
        "afterwards cannot affect what is already cached."),

    mcq("AVERAGE",
        "What distinguishes IMAP from POP3?",
        [("IMAP encrypts messages in transit while POP3 does not", False),
         ("IMAP leaves messages on the server; POP3 traditionally downloads "
          "and removes them", True),
         ("IMAP is used for sending mail while POP3 is used for "
          "retrieving", False),
         ("IMAP transfers a whole mailbox at once while POP3 transfers "
          "individual messages", False)],
        "The difference is where the mailbox lives. POP3 moves messages to "
        "one device, so a message read on a laptop is not on the phone; IMAP "
        "keeps them on the server and synchronises state, which is what makes "
        "one mailbox usable from several devices. Neither is about "
        "encryption, and both are retrieval protocols -- sending is SMTP."),

    mcq("HARD",
        "Why does HTTP being stateless make web applications easier to "
        "scale?",
        [("Any server in a pool can answer any request, since none holds "
          "context", True),
         ("Servers need less memory because no request data is held during "
          "processing", False),
         ("Requests can be processed out of order without affecting the "
          "result", False),
         ("Connections are reused between requests, reducing the handshake "
          "cost", False)],
        "Because a request carries everything needed to serve it, a load "
        "balancer may send it to any member of a pool and remove failed "
        "members freely. That is the entire basis of web scaling. It also "
        "explains the corollary: keeping session state in one server's memory "
        "ties each user to that server and destroys the property the design "
        "depends on."),

    mcq("HARD",
        "An application uses a GET request to delete a record.\n\n"
        "What problem does this create?",
        [("The deletion may be triggered by caches, browsers and crawlers "
          "that assume GET is safe", True),
         ("The request cannot carry enough data to identify the record being "
          "removed", False),
         ("Firewalls block GET requests that modify data on the destination "
          "server", False),
         ("The server cannot return a status code indicating the deletion "
          "succeeded", False)],
        "GET is defined as safe, and the whole ecosystem relies on that: "
        "browsers prefetch links, caches store responses, and crawlers follow "
        "everything they find. A GET that changes state gets triggered by "
        "things merely looking at the page, with no user having asked for it. "
        "The method contract is not a convention but an assumption other "
        "software acts on."),

    mcq("AVERAGE",
        "What does a valid TLS certificate on a web site establish?",
        [("That the site is operated by a reputable organisation", False),
         ("That the connection is to the domain named in the "
          "certificate", True),
         ("That the content served by the site has been checked for "
          "malware", False),
         ("That the site's operator has been verified by a government "
          "authority", False)],
        "The certificate binds a public key to a domain name and is signed by "
        "an authority the browser trusts, so it establishes identity and "
        "enables encryption -- and says nothing whatever about whether that "
        "domain deserves your data. This is exactly how a convincing phishing "
        "site is served over HTTPS with a padlock displayed, which is why the "
        "padlock is not an endorsement."),

    mcq("AVERAGE",
        "An HTTP response returns a status code in the 5xx range.\n\n"
        "What does this indicate?",
        [("The server failed while handling an acceptable request", True),
         ("The client sent a request the server could not understand or "
          "authorise", False),
         ("The requested resource has moved to a different location "
          "permanently", False),
         ("The request succeeded but returned no content to display", False)],
        "The first digit locates the fault: 4xx says the CLIENT's request was "
        "at fault -- malformed, unauthorised, or for something absent -- "
        "while 5xx says the request was acceptable and the SERVER failed "
        "handling it. That single distinction says immediately whether to "
        "investigate the caller or the service, which is why the split "
        "exists. 3xx redirects and 2xx succeeded."),

    mcq("HARD",
        "Which DNS record type determines where mail for a domain is "
        "delivered?",
        [("MX", True),
         ("A, since mail is delivered to the domain's own address", False),
         ("CNAME, which aliases the domain to its mail provider", False),
         ("TXT, which holds the mail policy for the domain", False)],
        "The MX record names the mail servers for a domain, which is why mail "
        "can be delivered to a provider entirely unrelated to where the web "
        "site is hosted -- the two are separate records answering separate "
        "questions. TXT records do hold mail policy information, and they "
        "state how mail should be validated rather than where it should be "
        "sent."),

    mcq("AVERAGE",
        "Why can a mail message legitimately remain undelivered for several "
        "hours?",
        [("Mail uses store-and-forward, so each server retries until the next "
          "accepts", True),
         ("SMTP transfers messages only during scheduled delivery "
          "windows", False),
         ("The receiving server must complete a virus scan before "
          "accepting", False),
         ("Messages wait until the recipient's client connects to collect "
          "them", False)],
        "Each server accepts responsibility for a message, stores it, and "
        "forwards it when the next hop is available -- so a destination being "
        "temporarily unreachable delays delivery rather than failing it. That "
        "is the design rather than a fault, and it is why locating a stuck "
        "message means reading the received headers to find which hop is "
        "holding it."),

    mcq("HARD",
        "A session identifier is stolen from a user's browser.\n\n"
        "What can the holder do?",
        [("Act as that user until the session is invalidated or "
          "expires", True),
         ("Read the user's stored password from the server's session "
          "store", False),
         ("Nothing, since the identifier is only valid from the user's own "
          "address", False),
         ("Nothing, unless they also obtain the user's authentication "
          "credentials", False)],
        "The server has no memory between requests and identifies a session "
        "solely by the identifier presented, so whoever holds it IS the "
        "session as far as the server can tell. That is why identifiers must "
        "be unguessable, carried only over encrypted connections and "
        "invalidated at logout. Address restriction is not standard and would "
        "break every user on a changing network."),

    mcq("AVERAGE",
        "What does a content delivery network reduce that additional "
        "bandwidth cannot?",
        [("Propagation delay, by serving from a location nearer the "
          "user", True),
         ("The number of requests each page requires to load "
          "completely", False),
         ("The processing time the origin server spends generating each "
          "page", False),
         ("The queueing delay caused by congestion at the origin's own "
          "link", False)],
        "Propagation delay is bounded by distance and the speed of the "
        "signal, so no amount of bandwidth reduces it -- the only remedy is "
        "shortening the distance, which is exactly what serving from a nearby "
        "location does. It is the one component of delay the communication "
        "lesson said nothing could address, and a CDN is the answer the "
        "syllabus gives to it."),
]

LESSON_NET_APPS = lesson(
    MAJOR, MIDDLE,
    "Network Applications: DNS, Mail, Web and Distributed Services",
    _quiz,
    lesson_structure(
        "Network Applications: DNS, Mail, Web and Distributed Services",
        "The earlier lessons built a network that moves bytes between "
        "applications; this one covers what runs on it, and every service "
        "turns out to be a worked example of the layers underneath. DNS is "
        "covered through its caching, which explains the change that does not "
        "take effect; mail through store-and-forward, which explains where a "
        "message can legitimately sit; the web through statelessness, which "
        "explains both how it scales and why sessions have to be "
        "reconstructed on every request; and the distributed patterns through "
        "what each does with the work -- ending with the CDN, which addresses "
        "the one component of delay that bandwidth cannot.",
        [
            "Describe the DNS hierarchy and the common record types",
            "Explain TTL caching and plan a change around it",
            "Distinguish SMTP, POP3 and IMAP and explain store-and-forward",
            "Explain HTTP's statelessness and what it makes possible",
            "Apply the method contracts and interpret status code families",
            "Explain how sessions are built on a stateless protocol, and the "
            "security consequence",
            "State what TLS provides and what a certificate does not prove",
            "Describe the distributed service patterns and what a CDN "
            "addresses",
        ],
        80,
        _sections,
        [
            ("DNS hierarchy",
             "A distributed database walked from root to authoritative "
             "server; no single server holds the namespace."),
            ("Resolver",
             "Performs the walk on a client's behalf and caches what it "
             "learns."),
            ("TTL",
             "How long a record may be reused from cache, which is why a "
             "change takes effect gradually rather than at once."),
            ("MX record",
             "Names a domain's mail servers, independently of where its web "
             "site is hosted."),
            ("SMTP, POP3, IMAP",
             "Sending; retrieving to one device; retrieving while leaving the "
             "mailbox on the server."),
            ("Store and forward",
             "Each server accepting responsibility and passing a message on "
             "when it can, so delay is normal rather than failure."),
            ("Stateless HTTP",
             "Each request independent, which lets any server in a pool "
             "answer any request -- the basis of web scaling."),
            ("HTTP method contracts",
             "GET is safe and changes nothing; PUT and DELETE are idempotent. "
             "Other software acts on these assumptions."),
            ("Status code families",
             "2xx succeeded, 3xx redirects, 4xx blames the request, 5xx "
             "blames the server."),
            ("Session identifier",
             "Reconstructs state on a stateless protocol, and functions as a "
             "bearer credential -- whoever holds it is the session."),
            ("TLS",
             "Provides confidentiality, integrity and identification of the "
             "domain. It says nothing about the site's trustworthiness."),
            ("Certificate chain",
             "Roots vouch for intermediates which vouch for sites, letting a "
             "browser verify a site it has never seen."),
            ("Load balancer",
             "Distributes requests across a pool and removes failed members, "
             "which requires requests to be answerable by any of them."),
            ("CDN",
             "Serves copies from locations near users, reducing propagation "
             "delay -- the one component bandwidth cannot address."),
        ],
        "The services running on a network are each a worked example of the "
        "layers below. DNS is a hierarchy walked from root to authoritative "
        "server, and its most examined behaviour is CACHING: a record is "
        "reused until its TTL expires, so a change takes effect gradually and "
        "the TTL must be lowered at least one old-TTL period BEFORE a "
        "cutover, never after. Mail divides into SMTP for sending and POP3 or "
        "IMAP for retrieving -- the difference between them being where the "
        "mailbox lives -- and store-and-forward makes hours of delay normal "
        "rather than a failure. HTTP is stateless, which is what lets any "
        "server in a pool answer any request and therefore what makes the web "
        "scale; sessions are reconstructed from an identifier the client "
        "returns, which makes that identifier a bearer credential worth "
        "protecting. The method contracts are assumptions other software "
        "acts on, so a GET that changes state is triggered by caches and "
        "crawlers merely looking; and the status families locate a fault "
        "before anything else, 4xx blaming the request and 5xx the server. "
        "TLS provides confidentiality, integrity and proof of WHICH domain "
        "you reached -- and nothing about whether that domain deserves your "
        "data. Finally the distributed patterns run from client-server to "
        "peer-to-peer, with a load balancer depending on statelessness and a "
        "CDN shortening the distance itself, which is the only thing that "
        "reduces propagation delay.",
        exam_notes=[
            desc(
                "These items describe an observed behaviour and ask for the "
                "mechanism. Most of the mechanisms are caching, "
                "statelessness or store-and-forward."
            ),
            ul([
                "Explaining a DNS change that has not taken effect "
                "everywhere.",
                "Distinguishing POP from IMAP.",
                "Explaining what statelessness makes possible.",
                "Identifying the problem with a GET that changes state.",
                "Interpreting a status code family.",
                "Stating what a certificate does and does not prove.",
                "Explaining what a CDN reduces.",
            ]),
            desc(
                "When a service behaves inconsistently for different users, "
                "suspect a cache before suspecting a fault. DNS TTLs, browser "
                "caches and CDN copies all produce exactly that symptom, and "
                "in each case both users are being served correctly."
            ),
        ],
    ))

LESSONS = [LESSON_NET_APPS]

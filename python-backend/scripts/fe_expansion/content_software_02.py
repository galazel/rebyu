"""Computer System -> Software, lessons 2 and 3.

Syllabus minor categories 2 (middleware) and 3 (file system).

Middleware is a vague word in ordinary use and a precise one in the syllabus:
software that sits between the operating system and applications, providing
services too general to belong in any one application and too specific to
belong in the kernel. The file system lesson is the more calculable of the
two, and its backup material recurs in Service Management.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Computer System"
MIDDLE = "Software"

# ==========================================================================
# Lesson 2: Middleware
# ==========================================================================

_mw_sections = [
    ("The Layer Between", [
        desc(
            "Middleware is software sitting between the operating system and "
            "the applications above it, providing services that are too "
            "general to write into each application and too specific to put "
            "in the kernel."
        ),
        image(fig("os-layers")),
        desc(
            "The test for whether something is middleware is whether several "
            "unrelated applications would otherwise each build it. A database "
            "management system, a web server, a message broker and a "
            "transaction monitor all pass that test: every business "
            "application needs to store data, serve requests, pass messages "
            "and keep operations consistent, and none of those belongs inside "
            "the operating system."
        ),
        table(
            ["Kind of middleware", "The service it provides"],
            [["Database management system",
              "Storing, querying and protecting shared data"],
             ["Web and application server",
              "Accepting requests and running application code to answer "
              "them"],
             ["Message broker / queue",
              "Passing messages between components that need not be running "
              "at the same time"],
             ["Transaction monitor",
              "Making a group of operations succeed or fail together"],
             ["Runtime environment",
              "Executing intermediate code and managing its memory"],
             ["API gateway",
              "One entry point to many services, with routing and policy"]],
            caption="Six kinds of middleware and what each removes from every "
                    "application.",
            footer="Each row is work that would otherwise be repeated, "
                   "inconsistently, in every application that needed it."),
    ]),

    ("Runtime Environments", [
        desc(
            "A runtime environment executes intermediate code and provides "
            "the services that code assumes: memory management, threading, "
            "type checking and a standard library. It is the middleware most "
            "developers interact with without naming."
        ),
        compare_grid(
            "WHAT A RUNTIME GIVES AND TAKES",
            "The trade is the same one the Programming Languages lesson "
            "identified, seen from the deployment side.",
            [("What it provides",
              "Portability, since only the runtime is platform-specific. "
              "Automatic memory management, removing a class of defects. "
              "Security enforcement, since the runtime mediates what code may "
              "do."),
             ("What it costs",
              "A layer to install, version and patch. Start-up time before "
              "any application work happens. Unpredictable pauses for memory "
              "reclamation, which is why hard real-time work avoids "
              "managed runtimes.")]),
        desc(
            "The operational consequence people meet is version management. "
            "An application depends on a runtime version, several "
            "applications on one machine may need different ones, and the "
            "runtime must be patched independently of the applications for "
            "security reasons. Containers largely resolved this by packaging "
            "each application with the runtime it expects, which is a "
            "substantial part of why they were adopted."
        ),
    ]),

    ("Transaction Processing Monitors", [
        desc(
            "A transaction is a group of operations that must succeed or fail "
            "as a unit. A transaction monitor provides that guarantee to "
            "applications, and the properties it delivers are examined here "
            "and again in Database."
        ),
        content_accordion(
            "THE ACID PROPERTIES",
            "Four guarantees, and the examination asks which one a described "
            "failure violates.",
            [("Atomicity",
              "All the operations happen, or none does. A transfer that "
              "debits one account and fails before crediting the other must "
              "leave neither change in place -- the money cannot be nowhere."),
             ("Consistency",
              "The data satisfies its integrity rules before and after. A "
              "transaction may pass through invalid intermediate states "
              "internally, but must not leave one visible."),
             ("Isolation",
              "Concurrent transactions do not see one another's partial work. "
              "The result is as if they had run one after another, even "
              "though they overlapped."),
             ("Durability",
              "Once a transaction is committed, its effects survive a crash. "
              "This is why a commit waits for a write to persistent storage "
              "rather than returning as soon as memory is updated.")]),
        desc(
            "The syllabus also names the TWO-PHASE COMMIT protocol, which "
            "extends atomicity across several independent systems. A "
            "coordinator first asks every participant whether it CAN commit "
            "and each replies and prepares; only if all agree does the "
            "coordinator tell them to commit. The weakness is the "
            "coordinator: if it fails after the prepare phase, participants "
            "are left holding locks and unable to decide alone."
        ),
    ]),

    ("Message-Oriented Middleware", [
        desc(
            "A message queue lets one component send to another without both "
            "running at the same time. That single property changes the "
            "shape of a system substantially."
        ),
        compare_grid(
            "SYNCHRONOUS CALL AGAINST ASYNCHRONOUS MESSAGE",
            "The examination asks which suits a described requirement, and "
            "the answer turns on whether the caller needs the answer now.",
            [("Direct call",
              "The caller waits for the answer and both must be available. "
              "Simple, and it couples the two: if the callee is down or slow, "
              "the caller is down or slow."),
             ("Queued message",
              "The sender hands the message to a queue and continues. The "
              "receiver processes it whenever it can, so a slow or absent "
              "receiver delays work rather than failing it -- and the sender "
              "no longer learns the outcome directly.")]),
        desc(
            "Two patterns are named. POINT-TO-POINT delivers each message to "
            "exactly one consumer, which is how work is distributed across "
            "several workers. PUBLISH-SUBSCRIBE delivers each message to every "
            "interested subscriber, which is how an event is announced to "
            "components the publisher does not know about."
        ),
        desc(
            "The property that makes queues valuable operationally is "
            "BUFFERING under load. A burst of requests that would overwhelm a "
            "synchronous system accumulates in the queue instead, and the "
            "consumers work through it at their own rate -- so the system "
            "degrades by getting slower rather than by falling over. The "
            "queue depth then becomes the metric to monitor, because a queue "
            "growing without bound means consumers are permanently too slow "
            "rather than briefly behind."
        ),
    ]),

    ("Web and Application Servers", [
        desc(
            "The middleware most systems are built on now accepts network "
            "requests and runs application code to answer them, which "
            "removes a great deal from every application that would otherwise "
            "have to do it."
        ),
        ul([
            "Accepting connections, parsing requests and forming responses, "
            "so the application deals in structured objects rather than "
            "bytes.",
            "Managing a POOL of threads or processes, so a burst of requests "
            "does not create unbounded work.",
            "Managing CONNECTION POOLS to databases, since establishing a "
            "connection costs far more than using one.",
            "Handling sessions, authentication hooks, compression, encryption "
            "termination and logging.",
            "Serving static content directly, without invoking application "
            "code at all.",
        ]),
        desc(
            "Pooling is the idea worth extracting, because it recurs "
            "everywhere. A resource that is expensive to create and cheap to "
            "reuse should be created once and lent out -- and the pool's SIZE "
            "then becomes a capacity decision, since a pool too small "
            "throttles throughput and one too large overwhelms whatever sits "
            "behind it. A database with a hundred connections from each of "
            "ten servers is receiving a thousand, which it may not survive."
        ),
    ]),

    ("Integration and Coupling", [
        desc(
            "Middleware's larger purpose is letting systems built separately "
            "work together. How tightly they end up bound is the design "
            "question."
        ),
        table(
            ["Integration style", "How systems connect", "Coupling"],
            [["Shared database", "Both read and write the same tables",
              "Very tight -- a schema change breaks both"],
             ["File transfer", "One writes a file, the other reads it",
              "Loose, and delayed by the transfer schedule"],
             ["Remote procedure call", "One calls the other directly",
              "Tight in time: both must be up"],
             ["Messaging", "One sends, the other consumes when able",
              "Loose in time; both must agree on the message format"],
             ["Shared service / API", "Both call a third system that owns the "
                                      "data",
              "Loose, with the contract in one place"]],
            caption="Five integration styles, in roughly increasing "
                    "independence.",
            footer="The first row is the one to be wary of. Sharing a "
                   "database is the quickest integration to build and the "
                   "hardest to unpick, because every table becomes a public "
                   "interface nobody agreed to."),
        desc(
            "The general principle is the Programming lesson's coupling "
            "argument at system scale: two systems should depend on the "
            "smallest agreed contract that does the job. A shared database "
            "makes every column a contract, so a change intended for one "
            "system silently breaks another -- and nobody can tell which "
            "columns matter without reading both."
        ),
    ]),

    ("API Gateways and Service Composition", [
        desc(
            "When a system is built from many services rather than one "
            "application, a client would otherwise have to know where each "
            "one is and how to talk to it. A gateway is the middleware that "
            "removes that."
        ),
        table(
            ["The gateway does", "So that each service need not"],
            [["Route a request to the right service",
              "Be known individually to every client"],
             ["Authenticate the caller",
              "Implement authentication separately and inconsistently"],
             ["Enforce rate limits and quotas",
              "Defend itself against a misbehaving client"],
             ["Terminate encryption",
              "Manage certificates of its own"],
             ["Log and trace requests",
              "Produce its own incompatible record"],
             ["Present one version and shape",
              "Expose its internal structure to the outside"]],
            caption="Six concerns lifted out of every service.",
            footer="The last row is the strategic one: with a gateway in "
                   "front, services can be split, merged or rewritten without "
                   "the clients noticing, because the published shape stays "
                   "put."),
        desc(
            "The cost is the one every shared component carries. The gateway "
            "is on the path of every request, so it is both a single point of "
            "failure and a capacity limit -- and it accumulates logic that "
            "belongs to nobody, since it is the convenient place to put any "
            "rule that spans services. Keeping it to routing and policy "
            "rather than business logic is a discipline that erodes without "
            "attention."
        ),
    ]),

    ("Directory and Naming Services", [
        desc(
            "In a system of many components, something must answer 'where is "
            "the thing called X?' and 'who is this user, and what may they "
            "do?'. Directory services are the middleware that answers both."
        ),
        table(
            ["Service", "Answers", "Typical use"],
            [["DNS", "Which address does this name resolve to?",
              "Reaching a host by name"],
             ["LDAP directory", "Who is this user, and what groups are they "
                                "in?",
              "Central authentication and authorisation"],
             ["Service registry", "Which instances of this service are alive?",
              "Finding a service that moves or scales"],
             ["Configuration service", "What settings apply here?",
              "Changing behaviour without redeploying"]],
            caption="Four lookup services, each removing a hard-coded value.",
            footer="Every row replaces something that would otherwise be "
                   "written into each application -- an address, a user list, "
                   "a setting -- and would then have to be changed in every "
                   "one of them."),
        desc(
            "The property they share is INDIRECTION: instead of naming a "
            "thing, a component names a lookup that resolves to it. That is "
            "what allows the thing to move, scale or be replaced without any "
            "caller changing -- and it is why the same idea appears as "
            "virtual memory in hardware, as a symbolic link in a file system, "
            "and as a service registry here."
        ),
        desc(
            "The cost is a new dependency. The lookup service is now on the "
            "path of everything, so its availability becomes the system's "
            "availability -- which is exactly the single point of failure the "
            "System Configuration lesson warned about, and why directory "
            "services are among the most carefully replicated components in "
            "any estate."
        ),
    ]),

    ("Caching Middleware", [
        desc(
            "The caching idea from the Memory lesson appears again as a "
            "distinct middleware tier, and the reasons are the same at every "
            "scale: something is expensive to obtain and likely to be wanted "
            "again."
        ),
        content_accordion(
            "WHAT A CACHE TIER MUST DECIDE",
            "Three questions, and the third is the one that makes caching "
            "genuinely difficult.",
            [("What to cache",
              "Data read far more often than it changes, and expensive to "
              "produce. Caching something written as often as it is read "
              "achieves nothing and adds a consistency problem."),
             ("What to evict",
              "A cache has finite capacity, so it needs a policy -- least "
              "recently used is the usual choice, for the same temporal "
              "locality reason a processor cache uses it."),
             ("When a cached copy is stale",
              "The hard one. A processor cache is told when its memory "
              "changes; an application cache usually is not. The answers are "
              "expiry, where a copy is trusted for a stated time, and "
              "invalidation, where the writer tells the cache -- which is "
              "correct and requires every writer to remember."),
             ("What a cache does to failure",
              "It changes it. A system that performs acceptably with a warm "
              "cache may be unable to serve at all with a cold one, so a "
              "restart after an outage can fail under load that was fine "
              "before -- which is why cache warming exists as an operational "
              "step.")]),
        desc(
            "The last point is worth carrying into operations. Capacity "
            "measured with a warm cache is not the capacity available "
            "immediately after a restart, and a system whose steady-state "
            "load depends on a high cache hit ratio has a recovery problem "
            "nobody notices until the first cold start under real traffic."
        ),
    ]),

    ("Buying Middleware Against Building It", [
        desc(
            "Every service in this lesson can be written rather than adopted, "
            "and the decision is a recurring one that Software Development "
            "Management treats formally."
        ),
        compare_grid(
            "THE HONEST COMPARISON",
            "The argument is rarely about whether it CAN be built. It is "
            "about what happens over the following five years.",
            [("What building looks like at first",
              "A small amount of code doing exactly what is needed, with no "
              "licence cost and no unused features. Genuinely attractive, and "
              "usually accurate for the first version."),
             ("What it becomes",
              "The edge cases arrive -- retries, ordering, failure recovery, "
              "monitoring, upgrades -- and each is a problem the established "
              "product solved years ago. The maintenance is permanent and "
              "falls on a team whose job is something else."),
             ("When building is right",
              "When the requirement is genuinely unusual, when the "
              "alternative does not fit, or when this capability IS the "
              "product's differentiator."),
             ("When adopting is right",
              "When the problem is well understood and widely solved, which "
              "describes messaging, caching, databases and web serving almost "
              "without exception.")]),
        desc(
            "The examination frames this as a make-or-buy decision and "
            "expects total cost of ownership to be the basis -- the System "
            "Evaluation lesson's index, applied. The recurring error is "
            "comparing a licence fee against zero rather than against the "
            "engineering time the alternative consumes indefinitely."
        ),
    ]),

    ("Standards, Portability and Lock-In", [
        desc(
            "Adopting middleware creates a dependency, and how easily it "
            "could later be replaced is a decision made at adoption time "
            "whether or not anyone makes it deliberately."
        ),
        ul([
            "A STANDARD INTERFACE -- SQL, JMS, JDBC, POSIX -- means several "
            "products can satisfy the same code, so one can be exchanged for "
            "another at moderate cost.",
            "A PROPRIETARY EXTENSION is usually better than the standard at "
            "something, which is why it exists and why it gets used. Each use "
            "raises the cost of leaving.",
            "VENDOR LOCK-IN is the state where the cost of changing exceeds "
            "the benefit, at which point the vendor's pricing and roadmap are "
            "no longer negotiable.",
            "The mitigation is not avoiding extensions but CONFINING them: "
            "keep the non-standard usage behind an interface of your own, so "
            "the eventual replacement touches one component rather than every "
            "one.",
        ]),
        desc(
            "It is worth being honest that lock-in is a trade rather than a "
            "failure. Using a product's distinctive capabilities is often "
            "exactly why it was chosen, and refusing every extension in the "
            "name of portability buys an option that is frequently never "
            "exercised. The judgement is whether the capability is worth the "
            "future cost, and that is a decision to make consciously rather "
            "than by accumulation."
        ),
    ]),

    ("Operating Middleware", [
        desc(
            "Middleware is infrastructure, and it brings the operational "
            "obligations the Service Management lessons formalise."
        ),
        table(
            ["Obligation", "Why middleware makes it harder"],
            [["Patching", "Many applications depend on it, so an upgrade "
                          "affects all of them at once"],
             ["Capacity", "Its limits -- connections, queue depth, memory -- "
                          "are shared across every consumer"],
             ["Monitoring", "A problem here appears as a symptom in every "
                            "application above it"],
             ["Configuration", "Defaults are rarely right, and the right "
                               "values depend on the workload"],
             ["Version compatibility", "Applications may require different "
                                       "versions of the same component"]],
            caption="Five obligations, each amplified by being shared.",
            footer="The amplification is the point. Middleware concentrates "
                   "both the benefit -- solve it once -- and the risk: one "
                   "misconfiguration or one failed upgrade reaches "
                   "everything that depends on it."),
        desc(
            "This is also why a middleware failure is so often diagnosed "
            "slowly. Every application reports its own symptom, several teams "
            "investigate their own code, and the shared component beneath "
            "them is the last place anyone looks -- which is precisely the "
            "argument for monitoring middleware directly rather than "
            "inferring its health from the applications above it."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where middleware items are lost."),
        ul([
            "Treating middleware as anything that is not an application. It "
            "specifically provides general services BETWEEN the operating "
            "system and applications.",
            "Assuming a message queue guarantees delivery order or exactly-"
            "once processing. Both are configurable and neither is free.",
            "Sizing a connection pool per server without considering the "
            "total the database will receive.",
            "Choosing a shared database for integration because it is "
            "quickest, without noticing every table becomes a contract.",
            "Expecting two-phase commit to be safe against coordinator "
            "failure. Participants can be left blocked.",
            "Forgetting that a runtime's garbage collection pauses rule it "
            "out for hard real-time work.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An order service must notify a warehouse system when an order "
            "is placed. The warehouse system is periodically unavailable for "
            "maintenance, and no order may be lost. Which integration style "
            "is appropriate?\""
        ),
        ol([
            "Extract the requirements: the receiver is sometimes down, and "
            "nothing may be lost.",
            "A direct remote call fails while the receiver is down, so the "
            "order would either be lost or the sender would have to implement "
            "its own retry and storage -- which is a message queue, written "
            "badly.",
            "A shared database would couple the two systems' schemas and "
            "still needs a mechanism to signal new work.",
            "A durable message queue accepts the message while the receiver "
            "is down and delivers it when the receiver returns, which is "
            "exactly the stated requirement.",
            "Answer: message-oriented middleware, with a persistent queue.",
        ]),
        desc(
            "The word doing the work in the stem is 'periodically "
            "unavailable'. Any requirement in which sender and receiver need "
            "not be available at the same moment points at queuing, and the "
            "examination signals it with exactly that kind of phrase."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Middleware is where several later majors meet."),
        ul([
            "ACID and two-phase commit are treated in full in Transaction "
            "Processing.",
            "Web and application servers are the three-tier architecture of "
            "System Configuration.",
            "Coupling between systems is the Programming lesson's argument at "
            "system scale.",
            "Message queues reappear in Network as asynchronous "
            "communication and in Software Architecture Design.",
            "Runtime environments come from Programming Languages and return "
            "in Development Environment Management as a versioning problem.",
            "Connection pooling is capacity planning, and queue depth is a "
            "monitoring index from System Evaluation.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Five results this lesson expects immediately.",
            [("What makes something middleware",
              "General services between the OS and applications",
              "The test is whether several unrelated applications would "
              "otherwise each build it."),
             ("The ACID properties",
              "Atomicity, Consistency, Isolation, Durability",
              "All or none; rules still hold; concurrent work is invisible; "
              "committed work survives a crash."),
             ("The weakness of two-phase commit",
              "Coordinator failure after prepare",
              "Participants hold locks and cannot decide alone, so they "
              "block."),
             ("Point-to-point against publish-subscribe",
              "One consumer against every subscriber",
              "The first distributes work; the second announces an event to "
              "components the publisher does not know about."),
             ("Why a shared database is poor integration",
              "Every table becomes an unagreed contract",
              "Quickest to build and hardest to unpick, because a change for "
              "one system silently breaks another.")]),
    ]),
]

_mw_quiz = [
    mcq("EASY",
        "Which description best defines middleware?",
        [("Any software that is neither an operating system nor an "
          "application", False),
         ("Software providing general services between the operating system "
          "and applications", True),
         ("Software that runs on a server rather than on a client machine",
          False),
         ("Software supplied by a vendor rather than written in house", False)],
        "Middleware provides services too general to write into each "
        "application and too specific to put in the kernel -- data "
        "management, request handling, messaging, transactions. The useful "
        "test is whether several unrelated applications would otherwise each "
        "build it. Where the software runs and who wrote it are unrelated to "
        "the classification."),

    mcq("AVERAGE",
        "An order service must notify a warehouse system that is periodically "
        "unavailable for maintenance, and no notification may be lost.\n\n"
        "Which integration approach fits?",
        [("A synchronous remote procedure call with retries", False),
         ("A durable message queue between the two systems", True),
         ("A shared database that both systems read and write", False),
         ("A nightly file transfer of the day's orders", False)],
        "A persistent queue accepts the message while the receiver is down "
        "and delivers it on return, which is precisely the stated "
        "requirement. A synchronous call fails during the outage, and adding "
        "retries and local storage amounts to reimplementing a queue badly. A "
        "shared database couples the schemas and still needs a signalling "
        "mechanism, and a nightly transfer loses timeliness the phrase "
        "'notify when an order is placed' implies."),

    mcq("AVERAGE",
        "A funds transfer debits one account and the system fails before the "
        "corresponding credit is applied. On recovery, neither change is "
        "present.\n\n"
        "Which ACID property has been upheld?",
        [("Atomicity", True),
         ("Consistency", False),
         ("Isolation", False),
         ("Durability", False)],
        "Atomicity means all the operations of a transaction happen or none "
        "does, so an incomplete transfer must leave neither change -- the "
        "money cannot be nowhere. Consistency concerns integrity rules "
        "holding at the boundaries, isolation concerns concurrent "
        "transactions not seeing partial work, and durability concerns "
        "committed effects surviving a crash, which is the opposite situation "
        "from this one."),

    mcq("HARD",
        "In two-phase commit, the coordinator fails after all participants "
        "have replied that they are prepared but before it issues the commit "
        "instruction.\n\nWhat is the consequence?",
        [("Each participant independently commits, since all agreed", False),
         ("Participants remain blocked, holding locks and unable to decide",
          True),
         ("The transaction automatically aborts after a fixed timeout with no "
          "further effect", False),
         ("Participants roll back, since no commit instruction arrived",
          False)],
        "A prepared participant has promised it CAN commit and must therefore "
        "wait for the decision -- it cannot commit unilaterally, because "
        "another participant might have failed, and it cannot abort, because "
        "the coordinator may have already decided to commit. So it holds its "
        "locks and blocks, which is the well-known weakness of the protocol "
        "and the reason three-phase variants and consensus protocols exist."),

    mcq("AVERAGE",
        "A message is delivered to every component that has registered an "
        "interest in it, rather than to exactly one consumer.\n\n"
        "Which messaging pattern is this?",
        [("Point-to-point", False),
         ("Publish-subscribe", True),
         ("Request-reply", False),
         ("Two-phase commit", False)],
        "Publish-subscribe delivers each message to all interested "
        "subscribers, which lets a publisher announce an event without "
        "knowing who consumes it -- and lets new consumers be added without "
        "changing the publisher. Point-to-point delivers each message to "
        "exactly one consumer, which is how work is distributed across "
        "workers. Request-reply is a conversation pattern and two-phase "
        "commit is a transaction protocol."),

    mcq("HARD",
        "Ten application servers each maintain a connection pool of 100 "
        "connections to one database.\n\n"
        "What is the risk?",
        [("The pools will be underused, wasting memory on each server", False),
         ("The database may receive up to 1,000 connections and be "
          "overwhelmed", True),
         ("Connection pooling prevents transactions from being isolated",
          False),
         ("Each server will be limited to 100 concurrent users", False)],
        "Pool sizing is usually reasoned about per server, and the resource "
        "being protected is shared: ten servers at 100 connections each "
        "present up to 1,000 to a database that may support far fewer, at "
        "which point it degrades or refuses connections. The pool exists to "
        "reuse an expensive resource, and its size is a capacity decision "
        "about the TOTAL rather than about one server."),

    mcq("AVERAGE",
        "Two systems are integrated by having both read and write the same "
        "database tables.\n\n"
        "What is the principal drawback?",
        [("Database performance will be halved by the second system", False),
         ("Every table becomes an interface that neither team agreed to",
          True),
         ("Transactions cannot span both systems", False),
         ("Only one system may write at a time", False)],
        "A shared database is the quickest integration to build and the "
        "hardest to unpick, because each system now depends on the other's "
        "table structure without any stated contract. A schema change made "
        "for one silently breaks the other, and nobody can tell which columns "
        "matter without reading both codebases. Transactions can span the "
        "tables and both systems can write concurrently; the problem is "
        "coupling rather than capability."),

    mcq("EASY",
        "Which property of a runtime environment makes it unsuitable for hard "
        "real-time control?",
        [("It requires more memory than a compiled program", False),
         ("It may pause execution unpredictably to reclaim memory", True),
         ("It cannot access hardware devices directly", False),
         ("It executes intermediate code rather than machine code", False)],
        "A hard real-time deadline is a statement about the WORST case, and "
        "automatic memory reclamation may suspend the program at a moment "
        "determined by allocation history rather than by the schedule. Even a "
        "rare pause exceeding the deadline is a failure. Memory footprint and "
        "the interpretation overhead affect average performance rather than "
        "predictability, which is the property that actually disqualifies "
        "it."),

    mcq("AVERAGE",
        "Placing a message queue between a request source and its processors "
        "changes how the system behaves under a sudden load spike.\n\n"
        "In what way?",
        [("The spike is rejected at the queue, protecting the processors",
          False),
         ("Work accumulates in the queue and the system slows rather than "
          "failing", True),
         ("The processors automatically scale to absorb the spike", False),
         ("The spike is distributed evenly across all subscribers", False)],
        "A queue buffers: a burst that would overwhelm a synchronous system "
        "accumulates instead, and consumers work through it at their own "
        "rate, so the system degrades by getting slower rather than falling "
        "over. This makes QUEUE DEPTH the metric to watch, since a queue "
        "growing without bound means the consumers are permanently too slow "
        "rather than briefly behind. Scaling is a separate mechanism the "
        "queue enables rather than provides."),

    mcq("HARD",
        "Which integration style leaves two systems least dependent on each "
        "other being available at the same moment?",
        [("Remote procedure call", False),
         ("Messaging through a durable queue", True),
         ("A shared database", False),
         ("A synchronous REST API call", False)],
        "A durable queue decouples the two in TIME: the sender deposits a "
        "message and continues, and the receiver consumes it whenever it is "
        "running. Both remote procedure calls and synchronous API calls "
        "require the callee to be up at the moment of the call, and a shared "
        "database requires the database to be up while coupling the two "
        "systems' schemas as well. Note that messaging still requires "
        "agreement on the message format -- decoupling in time is not "
        "decoupling entirely."),
]

LESSON_MIDDLEWARE = lesson(
    MAJOR, MIDDLE,
    "Middleware, Runtimes and Shared Services",
    _mw_quiz,
    lesson_structure(
        "Middleware, Runtimes and Shared Services",
        "Middleware is software between the operating system and "
        "applications, providing services too general to write into each "
        "application and too specific to put in the kernel -- and the test "
        "for whether something qualifies is whether several unrelated "
        "applications would otherwise each build it. This lesson covers "
        "runtime environments and what they give and cost, transaction "
        "monitors and the ACID properties, message queues and how decoupling "
        "in time changes a system's behaviour under load, web and application "
        "servers and the pooling idea that recurs everywhere, and the "
        "integration styles that determine how tightly two systems end up "
        "bound.",
        [
            "Define middleware and identify whether a described component "
            "qualifies",
            "State what a runtime environment provides and what it costs",
            "Explain the ACID properties and identify which a failure "
            "concerns",
            "Describe two-phase commit and its coordinator weakness",
            "Compare point-to-point with publish-subscribe messaging",
            "Explain how queuing changes a system's behaviour under load",
            "Explain resource pooling and size a pool against the shared "
            "resource",
            "Compare integration styles by the coupling each creates",
        ],
        60,
        _mw_sections,
        [
            ("Middleware",
             "Software providing general services between the operating "
             "system and applications -- data management, request handling, "
             "messaging, transactions."),
            ("Runtime environment",
             "Software executing intermediate code and providing memory "
             "management, threading and a standard library. Buys portability "
             "and costs predictability."),
            ("Transaction",
             "A group of operations that must succeed or fail as a unit."),
            ("Atomicity",
             "All a transaction's operations happen or none does, so a "
             "partial failure leaves nothing behind."),
            ("Isolation",
             "Concurrent transactions do not observe one another's partial "
             "work; the result is as if they ran in sequence."),
            ("Durability",
             "A committed transaction's effects survive a crash, which is why "
             "commit waits for persistent storage."),
            ("Two-phase commit",
             "A protocol extending atomicity across systems: prepare, then "
             "commit. A coordinator failure after prepare leaves participants "
             "blocked holding locks."),
            ("Point-to-point messaging",
             "Each message delivered to exactly one consumer, which "
             "distributes work across workers."),
            ("Publish-subscribe",
             "Each message delivered to every interested subscriber, letting "
             "a publisher announce events to components it does not know "
             "about."),
            ("Queue depth",
             "The number of messages waiting. Growing without bound means "
             "consumers are permanently too slow rather than briefly "
             "behind."),
            ("Connection pool",
             "A set of reusable connections lent to callers, because "
             "establishing one costs far more than using it. Its size is a "
             "capacity decision about the shared resource, not the caller."),
            ("Shared database integration",
             "Two systems reading and writing the same tables. Quickest to "
             "build and tightest possible coupling, since every column "
             "becomes an unagreed contract."),
        ],
        "Middleware sits between the operating system and applications, "
        "providing what several unrelated applications would otherwise each "
        "build. Runtime environments deliver portability and automatic memory "
        "management and cost a layer to patch, a start-up delay and pauses "
        "nobody schedules -- which is what rules them out of hard real-time "
        "work. Transaction monitors guarantee ACID: all-or-nothing atomicity, "
        "integrity rules holding at the boundaries, concurrent work invisible "
        "to other transactions, and committed effects surviving a crash -- "
        "with two-phase commit extending that across systems and leaving "
        "participants blocked if the coordinator fails after they have "
        "prepared. Message queues decouple sender from receiver in time, so "
        "one may be down without the other failing, and they buffer bursts so "
        "a system slows instead of collapsing -- which makes queue depth the "
        "index worth watching. Web and application servers remove connection "
        "handling, threading and pooling from every application, and pooling "
        "carries the lesson that generalises furthest: an expensive resource "
        "should be created once and lent out, with the pool sized against the "
        "TOTAL the shared resource will see rather than per caller. And the "
        "integration styles differ mainly in the coupling they create, with a "
        "shared database the quickest to build and the hardest to unpick, "
        "because it turns every column into a contract nobody agreed to.",
        exam_notes=[
            desc(
                "Middleware items on Subject A are mostly identification and "
                "scenario matching, with ACID appearing in both this "
                "category and Database."
            ),
            ul([
                "Deciding whether a described component is middleware.",
                "Naming which ACID property a described failure concerns.",
                "Describing two-phase commit and its blocking weakness.",
                "Choosing an integration style for a stated availability "
                "requirement.",
                "Distinguishing point-to-point from publish-subscribe.",
                "Recognising a pool sizing error against a shared resource.",
            ]),
            desc(
                "Any stem containing a phrase like 'periodically "
                "unavailable', 'need not be running at the same time' or "
                "'must not be lost' is pointing at durable messaging. That is "
                "the signal the examination uses most consistently here."
            ),
        ],
    ))

# ==========================================================================
# Lesson 3: File systems
# ==========================================================================

_fs_sections = [
    ("What a File System Provides", [
        desc(
            "A disk offers numbered blocks and nothing else. A file system is "
            "what turns that into named files in a hierarchy, with sizes, "
            "dates and permissions -- and it is worth remembering that none "
            "of those exists on the medium until the file system puts it "
            "there."
        ),
        image(fig("filesystem-tree")),
        table(
            ["It provides", "Over the top of"],
            [["Names", "Block numbers"],
             ["Hierarchy", "A flat sequence of blocks"],
             ["Variable-size files", "Fixed-size blocks"],
             ["Growth and shrinkage", "A fixed medium"],
             ["Permissions", "A device that will read anything asked of it"],
             ["Consistency after a crash", "Writes that may be interrupted"]],
            caption="Six abstractions, each over something the hardware does "
                    "not offer.",
            footer="The last row is the hardest. A write interrupted by a "
                   "power failure can leave the file system's own bookkeeping "
                   "inconsistent, which is what journalling exists to "
                   "prevent."),
    ]),

    ("Directories and Paths", [
        desc(
            "A directory is a file whose contents are a list of names and the "
            "locations they refer to. Because a directory may contain another "
            "directory, the structure nests without limit."
        ),
        compare_grid(
            "ABSOLUTE AND RELATIVE PATHS",
            "The distinction is examined directly and matters constantly in "
            "practice.",
            [("Absolute path",
              "Names a file from the ROOT, so it means the same thing "
              "wherever it is used. Longer, and unambiguous."),
             ("Relative path",
              "Names a file from the CURRENT directory, so it means different "
              "things depending on where you are. Shorter, and portable "
              "between locations that share a structure.")]),
        desc(
            "Two conventions appear in every path question. A single dot "
            "refers to the current directory, and two dots refer to its "
            "parent -- so a relative path may move upward as well as "
            "downward. The examination gives a current directory and a "
            "relative path and asks which file is meant, which is answered by "
            "walking the path one component at a time."
        ),
        desc(
            "A LINK is a directory entry pointing at a file that has another "
            "name elsewhere. A HARD link is a second name for the same file "
            "data, so deleting one name leaves the data reachable by the "
            "other. A SYMBOLIC link stores a path rather than a reference, so "
            "it breaks if the target is moved or removed -- and can therefore "
            "point at something that does not exist."
        ),
    ]),

    ("How a File's Blocks Are Found", [
        desc(
            "A file occupies blocks scattered across the medium, and the file "
            "system must record which ones. The syllabus names three methods."
        ),
        table(
            ["Method", "How blocks are recorded", "Weakness"],
            [["Contiguous", "A start block and a length",
              "Fast, and the file cannot grow without moving; suffers "
              "external fragmentation"],
             ["Linked", "Each block holds the address of the next",
              "Grows freely, and reaching block n requires reading n blocks"],
             ["Indexed", "An index block lists every block of the file",
              "Random access is fast; a large file may need index blocks that "
              "point to further index blocks"]],
            caption="Three allocation methods and what each costs.",
            footer="Indexed allocation is what real file systems use, because "
                   "it is the only one giving both growth and fast random "
                   "access -- at the cost of an extra read to fetch the "
                   "index."),
        desc(
            "FREE SPACE must also be tracked, usually by a bitmap with one "
            "bit per block. That is compact -- a terabyte of 4 KB blocks "
            "needs a bitmap of about 32 MB -- and it makes finding a run of "
            "free blocks a matter of scanning for consecutive zero bits."
        ),
    ]),

    ("File System Consistency", [
        desc(
            "Creating a file changes several things: the directory entry, the "
            "file's metadata, the free space map and the data blocks. A power "
            "failure between those changes leaves the file system describing "
            "something that is not true."
        ),
        content_accordion(
            "HOW CONSISTENCY IS PROTECTED",
            "Two approaches, and the difference is whether recovery scans or "
            "replays.",
            [("Consistency checking after the fact",
              "On restart, scan the whole file system looking for "
              "contradictions -- blocks marked used that no file claims, "
              "files claiming blocks marked free, directory entries pointing "
              "nowhere. Works, and takes time proportional to the file "
              "system's SIZE, which on a large volume means hours."),
             ("Journalling",
              "Write what is ABOUT to be done to a journal, then do it, then "
              "mark the journal entry complete. On restart, only the journal "
              "needs examining: incomplete entries are replayed or discarded. "
              "Recovery takes seconds regardless of volume size, at the cost "
              "of writing metadata twice."),
             ("Copy-on-write",
              "Never overwrite live data. Write the new version elsewhere and "
              "switch a pointer atomically when it is complete, so the old "
              "version remains valid until the new one is whole. Also gives "
              "cheap snapshots as a side effect."),
             ("What none of them protect",
              "Application-level consistency. A file system can guarantee "
              "that a write either happened or did not; it cannot know that "
              "two files needed to change together.")]),
        desc(
            "Journalling is worth recognising as a general technique rather "
            "than a file system feature. Recording the intention before "
            "acting, so that an interruption can be replayed or undone, is "
            "exactly what a database transaction log does -- and the "
            "recovery argument is identical."
        ),
    ]),

    ("Access Control", [
        desc(
            "A file system decides who may read, write or execute each file, "
            "and the models the syllabus names differ in where that decision "
            "is recorded."
        ),
        table(
            ["Model", "Permissions recorded", "Granularity"],
            [["Owner / group / other", "Three sets of read, write, execute",
              "Coarse: one owner, one group, everyone else"],
             ["Access control list", "A list of principals and their rights",
              "Fine: any number of users and groups, individually"],
             ["Role-based", "Rights attached to roles, users assigned roles",
              "Manageable at scale: change the role, not every file"]],
            caption="Three access control models, in increasing "
                    "manageability.",
            footer="The Unix owner/group/other scheme is compact and fast to "
                   "check; an access control list is far more expressive and "
                   "correspondingly more work to audit."),
        desc(
            "Two principles from the Security lessons apply here and are "
            "examined. LEAST PRIVILEGE means granting the minimum rights "
            "needed, so that a compromised account or program can do little. "
            "And permissions on a DIRECTORY are distinct from permissions on "
            "the files inside it -- execute permission on a directory permits "
            "traversal rather than execution, which is a distinction that "
            "surprises people regularly."
        ),
    ]),

    ("Backup", [
        desc(
            "A file system protects against interruption. It does not protect "
            "against deletion, corruption, or the loss of the machine -- "
            "which is what backup is for, and it is examined numerically."
        ),
        table(
            ["Strategy", "What is copied", "Backup time",
             "What a restore needs"],
            [["Full", "Everything, every time", "Longest", "The one backup"],
             ["Differential", "All changes since the last FULL",
              "Grows each day", "The full, plus the latest differential"],
             ["Incremental", "Changes since the last backup of ANY kind",
              "Shortest", "The full, plus EVERY incremental since"]],
            caption="Three strategies, and the trade between taking and "
                    "restoring.",
            footer="Backup speed and restore speed pull in opposite "
                   "directions. Incremental is fastest to take and slowest to "
                   "restore, and any one unreadable increment breaks the "
                   "chain."),
        ol([
            "A full backup is taken on Sunday, and incrementals every "
            "weekday. To restore on Friday morning, you need Sunday's full "
            "plus Monday, Tuesday, Wednesday and Thursday -- five media, and "
            "all five must be readable.",
            "With differentials instead, you need Sunday's full plus "
            "Thursday's differential -- two media.",
            "The differential is larger and slower to take each night, "
            "because it repeats everything since Sunday.",
        ]),
        desc(
            "The rule that matters more than the arithmetic: a backup that "
            "has never been restored is not known to work. Media degrade, "
            "credentials expire, retention policies delete more than intended "
            "and restore procedures go stale -- so a periodic test restore is "
            "the only evidence the strategy functions, and Service Management "
            "requires it for exactly that reason."
        ),
    ]),

    ("Deleting a File, and Why It Is Not Gone", [
        desc(
            "Deleting a file normally removes its directory entry and marks "
            "its blocks free. It does not overwrite the blocks, because doing "
            "so would take as long as writing the file did -- and that gap "
            "between 'deleted' and 'gone' has two consequences worth knowing."
        ),
        compare_grid(
            "THE SAME FACT, READ TWO WAYS",
            "One is a recovery opportunity and the other is a security "
            "problem, and they are the same property.",
            [("Recovery",
              "Until the blocks are reused, the data is still there and "
              "undelete tools can retrieve it -- which is why the first "
              "advice after an accidental deletion is to stop writing to that "
              "volume immediately."),
             ("Data remanence",
              "A disposed, sold or returned device still holds everything "
              "ever deleted from it. Formatting typically writes only new "
              "file system structures and leaves the data beneath them "
              "intact.")]),
        desc(
            "SECURE ERASURE is therefore a separate operation: overwriting "
            "the data, using the drive's own sanitise command, or physically "
            "destroying the medium. Encryption offers a shortcut worth "
            "knowing -- if a volume was encrypted throughout its life, "
            "destroying the key makes the data unrecoverable without touching "
            "the blocks, which is why full-disk encryption is as much a "
            "disposal strategy as a theft defence."
        ),
        desc(
            "Flash storage complicates this and the syllabus expects "
            "awareness of it. Wear levelling moves data between physical "
            "cells, so overwriting a logical block does not necessarily reach "
            "the cell that held the old copy -- which is why the drive's own "
            "sanitise command, or destruction, is the reliable answer for an "
            "SSD rather than repeated overwriting."
        ),
    ]),

    ("Volumes, Partitions and Mounting", [
        desc(
            "A physical device is divided before a file system is placed on "
            "it, and the resulting pieces are attached into one visible "
            "hierarchy. The vocabulary appears in examination items without "
            "explanation."
        ),
        table(
            ["Term", "Means"],
            [["Partition", "A division of one physical device"],
             ["Volume", "A region holding one file system, possibly spanning "
                        "several devices"],
             ["Formatting", "Writing an empty file system's structures onto a "
                            "volume"],
             ["Mounting", "Attaching a volume's tree at a point in the "
                          "existing hierarchy"],
             ["Mount point", "The directory at which it is attached"]],
            caption="The vocabulary of arranging storage.",
            footer="Mounting is what makes several devices look like one "
                   "tree. A path crossing a mount point moves silently onto a "
                   "different device, which is why one directory can be full "
                   "while the rest of the system has ample space."),
        desc(
            "Separating volumes is an operational choice rather than a "
            "technicality. Putting logs on their own volume means a runaway "
            "log fills that volume and not the one the application needs to "
            "write to -- so a disk-full condition degrades one function "
            "instead of stopping the system. It is the same containment "
            "argument as isolating processes."
        ),
    ]),

    ("Network and Distributed File Systems", [
        desc(
            "A file system need not be on a local device. Several machines "
            "may share one, which introduces problems a local file system "
            "never has."
        ),
        content_accordion(
            "WHAT CHANGES WHEN THE DISK IS ELSEWHERE",
            "Each of these is a consequence of the network sitting between "
            "the program and the storage.",
            [("Latency",
              "Every operation now costs a network round trip, so patterns "
              "that were free locally -- checking whether a file exists in a "
              "loop, reading a byte at a time -- become ruinous."),
             ("Partial failure",
              "A local disk is present or absent. A network file system can "
              "be reachable, slow, or reachable-but-not-responding, and a "
              "program blocked on it may hang indefinitely rather than "
              "receiving an error."),
             ("Concurrent access",
              "Several machines may write the same file. Locking must now be "
              "coordinated across the network, and a client that dies while "
              "holding a lock leaves it held until something times out."),
             ("Caching and consistency",
              "Clients cache to avoid round trips, which means a client may "
              "read a version another has already replaced. Every network "
              "file system chooses a consistency model, and the choices are "
              "genuinely different rather than better and worse.")]),
        desc(
            "The distinction the syllabus draws is between FILE-level access, "
            "where the server understands files and serves them, and "
            "BLOCK-level access, where the client is given raw blocks and "
            "runs its own file system on them. Network attached storage is "
            "the first; a storage area network is the second -- which is why "
            "a SAN volume is normally mounted by exactly one machine, since "
            "two independent file systems writing the same blocks would "
            "destroy each other."
        ),
    ]),

    ("File Metadata and Types", [
        desc(
            "A file system stores more about a file than its contents, and "
            "the extra information is what most tools actually operate on."
        ),
        ul([
            "SIZE, and the blocks actually allocated -- which differ, because "
            "of the last partly used block.",
            "TIMESTAMPS: created, last modified, last accessed. Access time "
            "is often disabled, because updating it turns every read into a "
            "write.",
            "OWNERSHIP and permissions, as the access control section "
            "described.",
            "TYPE, which may be recorded in the metadata, inferred from the "
            "file name's extension, or determined by inspecting the first few "
            "bytes -- the so-called magic number.",
        ]),
        desc(
            "The type question is worth a moment because it has a security "
            "consequence. An extension is part of the NAME and is chosen by "
            "whoever supplied the file, so trusting it to decide how a file "
            "is handled lets an attacker choose that handling. Inspecting the "
            "content is the reliable method, and it is why upload validation "
            "in the Security lessons insists on it."
        ),
    ]),

    ("Storage Efficiency", [
        desc(
            "Storage is cheap and never sufficient, so file systems and "
            "storage systems apply techniques to hold more in the same "
            "space."
        ),
        table(
            ["Technique", "How it saves", "Cost"],
            [["Compression", "Removes redundancy within each file",
              "Processor time on every read and write"],
             ["Deduplication", "Stores one copy of identical blocks",
              "An index of block signatures, and lookup on write"],
             ["Thin provisioning", "Allocates space only as it is used",
              "The volume can run out despite appearing large"],
             ["Snapshots", "Shares unchanged blocks between versions",
              "Space grows as the original diverges from the snapshot"]],
            caption="Four techniques, and what each one costs.",
            footer="Thin provisioning is the one with an operational trap: a "
                   "set of volumes each appearing to have room can "
                   "collectively exhaust the physical storage beneath them, "
                   "and every one of them fails at once."),
        desc(
            "Deduplication interacts with backup in a way worth knowing. It "
            "is extremely effective there, because successive backups of the "
            "same system are mostly identical -- and it means the copies are "
            "no longer independent, so a corrupted shared block damages every "
            "backup that referenced it. Efficiency and redundancy are working "
            "against each other, and which matters more depends on what the "
            "storage is for."
        ),
    ]),

    ("Retention, Archiving and Recovery Objectives", [
        desc(
            "How long data is kept, and how quickly it must come back, are "
            "business decisions that determine the whole storage design. "
            "Service Management defines the terms formally; they belong here "
            "because they decide the backup strategy."
        ),
        table(
            ["Term", "Asks", "What it constrains"],
            [["Recovery point objective (RPO)",
              "How much data may we lose?",
              "How often backups must be taken"],
             ["Recovery time objective (RTO)",
              "How long may recovery take?",
              "Which backup strategy and which site are acceptable"],
             ["Retention period", "How long must we keep this?",
              "Media volume, and cost"],
             ["Archiving", "What moves off primary storage?",
              "Restore speed for old data"]],
            caption="Four questions that decide a storage design.",
            footer="An RPO of five minutes rules out nightly backups "
                   "immediately, and an RTO of one hour rules out restoring "
                   "from a chain of increments held offsite. The objectives "
                   "select the strategy, not the reverse."),
        desc(
            "ARCHIVING is distinct from backup, and the examination "
            "distinguishes them. A backup is a COPY kept so that the original "
            "can be recovered; an archive is where data is MOVED when it is "
            "no longer needed on primary storage but must be retained. A "
            "backup's success is measured by restore speed, an archive's by "
            "cost per byte over years -- which is why tape persists for the "
            "second and rarely for the first."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where file system items are lost."),
        ul([
            "Confusing an absolute path with a relative one. An absolute path "
            "starts at the root and means the same thing everywhere.",
            "Assuming a symbolic link keeps working when its target moves. It "
            "stores a path, not a reference.",
            "Confusing differential with incremental backup. Differential is "
            "since the last FULL; incremental is since the last backup of any "
            "kind.",
            "Expecting an incremental restore to need only the most recent "
            "increment. It needs every one in the chain.",
            "Treating journalling as protection for application data. It "
            "protects the file system's own bookkeeping.",
            "Reading execute permission on a directory as permission to run "
            "something. It permits traversal.",
            "Believing an untested backup works.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A full backup runs on Sunday and incremental backups run each "
            "weekday evening. The system fails on Thursday morning. Which "
            "backup media are required to restore, and what is the risk?\""
        ),
        ol([
            "Incremental backups capture only what changed since the previous "
            "backup of any kind, so each night's tape holds one day's "
            "changes.",
            "Restoring means starting from Sunday's full backup and applying "
            "each subsequent increment in order.",
            "The failure is Thursday morning, so the last completed backup was "
            "Wednesday evening. Required: Sunday's full, plus Monday, Tuesday "
            "and Wednesday -- four media.",
            "The risk is that every one of the four must be readable. A "
            "single unreadable increment breaks the chain, and everything "
            "after it cannot be applied.",
        ]),
        desc(
            "The contrast the item is testing is with differential backup, "
            "where the same restore would need two media -- Sunday's full and "
            "Wednesday's differential -- and would tolerate the loss of any "
            "other. Incremental buys short nightly windows and pays for them "
            "at exactly the moment recovery matters."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("File systems reach into several later majors."),
        ul([
            "Journalling is the transaction log of Database recovery, with "
            "the same argument.",
            "Access control models are developed fully in the Security "
            "lessons.",
            "Backup strategy and test restores are a Service Management "
            "requirement.",
            "Recovery point and recovery time objectives determine which "
            "strategy is acceptable.",
            "Block allocation is the disk-layout side of the Memory lesson's "
            "storage material.",
            "Directory hierarchies are the tree structure of the Data "
            "Structures lesson.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Five results this lesson expects immediately.",
            [("Differential against incremental",
              "Since the last FULL against since the last backup of ANY kind",
              "Differential restores from two media; incremental needs every "
              "increment in the chain."),
             ("What journalling protects",
              "The file system's own metadata",
              "Recording the intention before acting, so an interruption can "
              "be replayed. Not application-level consistency."),
             ("Hard link against symbolic link",
              "A second name for the data against a stored path",
              "Deleting one hard link leaves the data reachable; a symbolic "
              "link breaks when its target moves."),
             ("Indexed allocation",
              "An index block listing the file's blocks",
              "The only method giving both growth and fast random access, "
              "which is why real file systems use it."),
             ("Why an untested backup is not a backup",
              "Media, credentials and procedures all decay",
              "A periodic test restore is the only evidence the strategy "
              "works, which is why Service Management requires it.")]),
    ]),
]

_fs_quiz = [
    mcq("AVERAGE",
        "Sunday brings a full backup, and incremental backups run each "
        "weekday evening. The system fails on Thursday morning.\n\n"
        "Which media are needed to restore?",
        [("Sunday's full backup only", False),
         ("Sunday's full plus Monday, Tuesday and Wednesday's increments",
          True),
         ("Sunday's full plus Wednesday's increment", False),
         ("Wednesday's increment only", False)],
        "An incremental backup captures only changes since the previous "
        "backup of ANY kind, so each evening's media holds one day's changes "
        "and the restore must apply them all in order from the last full "
        "backup. Needing only the full plus the latest media describes "
        "DIFFERENTIAL backup, which repeats everything since the full. The "
        "risk with incremental is that any one unreadable increment breaks "
        "the chain."),

    mcq("EASY",
        "Which statement correctly distinguishes an absolute path from a "
        "relative path?",
        [("An absolute path is shorter and a relative path is longer", False),
         ("An absolute path starts at the root and means the same thing "
          "everywhere", True),
         ("An absolute path may contain directory names and a relative path "
          "may not", False),
         ("An absolute path refers to a directory and a relative path refers "
          "to a file", False)],
        "An absolute path names a file from the root of the hierarchy, so it "
        "identifies the same file regardless of where it is used. A relative "
        "path is interpreted from the current directory and therefore means "
        "different things in different places -- which makes it shorter and "
        "portable between locations that share a structure. Both may name "
        "files or directories and both contain directory names."),

    mcq("AVERAGE",
        "Before performing a metadata change, a journalling file system "
        "records what it is about to do.\n\nWhat does this protect against?",
        [("Application data being written in the wrong order", False),
         ("File system metadata being left inconsistent by an interruption",
          True),
         ("Files being deleted by a user in error", False),
         ("Physical failure of the storage medium", False)],
        "Creating or extending a file changes the directory entry, the "
        "metadata and the free space map, and an interruption between those "
        "changes leaves the file system describing something untrue. The "
        "journal lets recovery replay or discard incomplete operations in "
        "seconds rather than scanning the whole volume. It protects the file "
        "system's OWN bookkeeping -- it knows nothing about which application "
        "files needed to change together, and nothing about deletion or media "
        "failure."),

    mcq("AVERAGE",
        "After a file referenced by a symbolic link is moved to a "
        "different directory, the link is followed.\n\nWhat happens to the link?",
        [("It follows the file automatically to its new location", False),
         ("It breaks, because it stores a path rather than a reference",
          True),
         ("It continues to work, because it references the file's data "
          "directly", False),
         ("It is deleted automatically when the target moves", False)],
        "A symbolic link stores a PATH, which is resolved each time the link "
        "is followed -- so moving the target leaves the link pointing at a "
        "location that no longer holds it. A hard link is a second name for "
        "the same file data and does survive, since it refers to the data "
        "rather than to a path. This is also why a symbolic link can point at "
        "something that has never existed."),

    mcq("HARD",
        "Under indexed allocation, what does the file system store to record "
        "which blocks belong to a file?",
        [("A starting block number and a length", False),
         ("A block containing the addresses of all the file's blocks", True),
         ("A pointer in each block to the following block", False),
         ("A bitmap with one bit per block on the volume", False)],
        "Indexed allocation keeps an index block listing every block of the "
        "file, so any block can be located with one extra read regardless of "
        "position -- which gives both fast random access and free growth, and "
        "is why real file systems use it. A start and length describes "
        "contiguous allocation, per-block pointers describe linked "
        "allocation, and a bitmap tracks FREE space across the volume rather "
        "than one file's blocks."),

    mcq("AVERAGE",
        "Compared with incremental backup, what does differential backup "
        "trade?",
        [("Faster nightly backups for slower restores", False),
         ("Slower nightly backups for faster and more robust restores", True),
         ("Less storage used for a longer retention period", False),
         ("Faster backups and faster restores, at higher media cost", False)],
        "A differential copies everything changed since the last FULL backup, "
        "so it grows each night and takes longer to write -- and a restore "
        "needs only two media, the full and the most recent differential, and "
        "tolerates the loss of any other. Incremental reverses both: the "
        "shortest nightly window, and a restore requiring every increment in "
        "the chain to be present and readable."),

    mcq("EASY",
        "On a directory, what does execute permission actually grant?",
        [("Permission to run programs stored in the directory", False),
         ("Permission to traverse the directory to reach its contents", True),
         ("Permission to list the names of the files it contains", False),
         ("Permission to create new files within it", False)],
        "Execute permission on a directory permits TRAVERSAL -- entering it "
        "to reach something inside by name. Listing its contents requires "
        "read permission, and creating files within it requires write "
        "permission. Whether a program inside can be run depends on that "
        "program's own permissions. This mismatch between the name and the "
        "meaning surprises people regularly and is examined for that reason."),

    mcq("HARD",
        "Nightly backups have run for three years, and no restore has ever "
        "been performed.\n\nWhat is the principal concern?",
        [("The backups will have consumed excessive storage", False),
         ("There is no evidence that a restore would actually succeed", True),
         ("Backup software requires periodic re-licensing to remain valid",
          False),
         ("Backups older than a year cannot legally be retained", False)],
        "A backup is only a means to a restore, and every part of the chain "
        "can decay silently: media degrade, credentials expire, retention "
        "policies delete more than intended, the software changes format, and "
        "the documented procedure goes stale. None of that is visible from "
        "the fact that backup jobs report success. A periodic test restore is "
        "the only evidence the strategy works, which is why Service "
        "Management requires one."),

    mcq("AVERAGE",
        "Which access control model attaches rights to roles and then assigns "
        "users to those roles?",
        [("Owner, group and other permissions", False),
         ("Role-based access control", True),
         ("An access control list per file", False),
         ("Mandatory access control by security label", False)],
        "Role-based access control makes rights a property of a role and "
        "membership a property of a user, so a change to what a job may do is "
        "made once on the role rather than on every affected object -- which "
        "is what makes it manageable at scale. Owner/group/other is a compact "
        "fixed scheme, and an access control list enumerates principals per "
        "object, which is expressive and considerably harder to audit."),

    mcq("HARD",
        "A file system uses copy-on-write, never overwriting live data in "
        "place.\n\nWhich additional capability does this most directly "
        "enable?",
        [("Faster sequential write throughput", False),
         ("Inexpensive point-in-time snapshots", True),
         ("Elimination of the need for access permissions", False),
         ("Automatic deduplication of identical files", False)],
        "Because the previous version of the data is left intact until the "
        "new one is complete and a pointer is switched, retaining the old "
        "pointer costs almost nothing and yields a consistent snapshot of the "
        "file system as it was. That is the property copy-on-write is "
        "typically adopted for. Write throughput is generally worse rather "
        "than better, since data is relocated rather than updated in place, "
        "and permissions and deduplication are unrelated concerns."),
]

LESSON_FILESYSTEM = lesson(
    MAJOR, MIDDLE,
    "File Systems, Directories and Backup",
    _fs_quiz,
    lesson_structure(
        "File Systems, Directories and Backup",
        "A disk offers numbered blocks and nothing else -- no names, no "
        "hierarchy, no sizes, no permissions. A file system builds all of "
        "that on top, and this lesson covers how: directories and the paths "
        "that navigate them, the three ways a file's scattered blocks are "
        "recorded, what happens when a power failure interrupts the file "
        "system's own bookkeeping and how journalling answers it, who is "
        "permitted to do what, and the backup strategies that protect against "
        "everything a file system cannot -- with the arithmetic the "
        "examination asks of them and the rule that an untested backup is not "
        "known to work.",
        [
            "Explain what a file system provides over raw block storage",
            "Distinguish absolute from relative paths and resolve one",
            "Distinguish hard links from symbolic links",
            "Compare contiguous, linked and indexed block allocation",
            "Explain how journalling and copy-on-write protect consistency",
            "Compare access control models and apply least privilege",
            "Compare full, differential and incremental backup and determine "
            "what a restore requires",
        ],
        65,
        _fs_sections,
        [
            ("File system",
             "The layer providing names, hierarchy, variable-size files, "
             "permissions and crash consistency over a medium that offers "
             "only numbered blocks."),
            ("Absolute path",
             "A path from the root of the hierarchy, identifying the same "
             "file wherever it is used."),
            ("Relative path",
             "A path interpreted from the current directory, so it means "
             "different things in different places."),
            ("Hard link",
             "A second directory entry for the same file data. Deleting one "
             "name leaves the data reachable by the other."),
            ("Symbolic link",
             "A directory entry storing a PATH, resolved on each use. Breaks "
             "when the target moves, and may point at nothing."),
            ("Contiguous allocation",
             "Recording a file as a start block and a length. Fast, cannot "
             "grow in place, and fragments externally."),
            ("Indexed allocation",
             "Recording a file's blocks in an index block, giving both growth "
             "and fast random access. What real file systems use."),
            ("Journalling",
             "Recording an intended metadata change before making it, so an "
             "interruption can be replayed or discarded. Recovery in seconds "
             "rather than a full-volume scan."),
            ("Copy-on-write",
             "Writing new data elsewhere and switching a pointer atomically, "
             "so the old version stays valid. Yields cheap snapshots."),
            ("Least privilege",
             "Granting the minimum rights needed, so a compromised account or "
             "program can do little."),
            ("Full backup",
             "A copy of everything. Slowest to take, and a restore needs only "
             "the one set."),
            ("Differential backup",
             "Everything changed since the last FULL backup. Grows nightly; "
             "a restore needs the full plus the latest differential."),
            ("Incremental backup",
             "Everything changed since the last backup of ANY kind. Shortest "
             "to take; a restore needs every increment in the chain, all "
             "readable."),
        ],
        "A file system exists because a disk offers numbered blocks and "
        "nothing more -- names, hierarchy, variable-size files, permissions "
        "and crash consistency are all things it constructs. Directories are "
        "files listing names and locations, navigated by absolute paths that "
        "mean the same thing everywhere or relative ones that do not, with "
        "hard links naming the same data and symbolic links storing a path "
        "that breaks when the target moves. A file's scattered blocks are "
        "recorded contiguously, which is fast and cannot grow; linked, which "
        "grows and makes random access linear; or indexed, which gives both "
        "and is what real systems use. Because creating a file changes "
        "several structures, an interruption can leave the bookkeeping "
        "describing something untrue -- answered either by scanning the whole "
        "volume afterwards, which takes hours, or by journalling the "
        "intention first, which takes seconds and is the same technique a "
        "database transaction log uses. Access control runs from the compact "
        "owner-group-other scheme through access control lists to role-based "
        "control, which is the one that stays manageable at scale. And backup "
        "protects against everything the file system cannot: full, "
        "differential and incremental trade nightly speed against restore "
        "speed, with incremental fastest to take and requiring every "
        "increment in an unbroken chain to restore -- and none of it "
        "demonstrated to work until a restore has actually been tested.",
        exam_notes=[
            desc(
                "File system items on Subject A are a reliable mix of path "
                "resolution, allocation comparison and backup arithmetic."
            ),
            ul([
                "Determining which media a restore requires under a stated "
                "backup schedule.",
                "Distinguishing differential from incremental backup.",
                "Resolving a relative path from a given current directory.",
                "Distinguishing hard from symbolic links.",
                "Explaining what journalling protects and what it does not.",
                "Identifying an access control model from a description.",
            ]),
            desc(
                "On any backup item, write the schedule out as a line of days "
                "and mark what each medium holds. The distinction between "
                "'since the last full' and 'since the last backup' is the "
                "whole question, and it is far clearer on paper than in your "
                "head."
            ),
        ],
    ))

LESSONS = [LESSON_MIDDLEWARE, LESSON_FILESYSTEM]

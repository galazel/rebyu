"""Technology Element -> Database, lesson 5.

Syllabus minor category 5 (database applications): distribution, replication,
warehousing and mining, and the NoSQL families.

The examination treats these as trade-off questions rather than definitions --
which consistency you gave up, which access pattern a store was built for --
so each section names what is being traded and against what.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Technology Element"
MIDDLE = "Database"

_sections = [
    ("Beyond One Database on One Machine", [
        desc(
            "The four previous lessons assumed a single database on a single "
            "machine. Real systems outgrow that, and the ways they outgrow it "
            "are what this lesson covers."
        ),
        table(
            ["Pressure", "Response", "What it costs"],
            [["More data than one machine holds", "Partition across sites",
              "Queries may span sites"],
             ["More reads than one machine serves", "Replicate",
              "Copies can disagree"],
             ["Analysis crippling the operational system",
              "A separate warehouse", "The warehouse lags"],
             ["Data that does not fit tables", "A non-relational store",
              "Usually some of ACID"]],
            caption="Four pressures and the four responses the syllabus "
                    "names.",
            footer="Every row's third column is the examinable part. These "
                   "are not upgrades -- each buys one property by giving up "
                   "another, and an item normally asks which was given up."),
    ]),

    ("Distributed Databases", [
        desc(
            "A distributed database spreads data across several sites and "
            "presents it to applications as one database."
        ),
        image(fig("distributed-db")),
        desc(
            "TRANSPARENCY is the goal and the term the examination uses: the "
            "application should not need to know where data lives. The "
            "syllabus distinguishes several kinds -- location transparency "
            "means not naming a site, fragmentation transparency means not "
            "knowing the data is split, and replication transparency means "
            "not knowing there are copies."
        ),
        table(
            ["Approach", "Means", "Suits"],
            [["Horizontal fragmentation", "Splitting by ROWS across sites",
              "Data naturally divided by region or customer"],
             ["Vertical fragmentation", "Splitting by COLUMNS",
              "Different sites needing different attributes"],
             ["Replication", "Whole copies at several sites",
              "Read-heavy work, and availability"],
             ["Hybrid", "Fragments, some replicated", "Most real systems"]],
            caption="How data is actually placed.",
            footer="Horizontal fragmentation keeps whole rows together, so a "
                   "query for one customer touches one site. Vertical "
                   "fragmentation splits a row, so reassembling it requires a "
                   "join across sites -- which is why horizontal is far more "
                   "common."),
        desc(
            "The cost is that a transaction touching several sites needs the "
            "two-phase commit of the previous lesson, with its blocking "
            "window. A distributed design that keeps each transaction within "
            "one site avoids that entirely, and choosing the fragmentation "
            "key to make that true is the central design decision."
        ),
    ]),

    ("Replication and Its Consistency Problem", [
        desc(
            "Replication is the cheapest way to serve more reads and to "
            "survive a site failure, and it introduces the possibility that "
            "two copies disagree."
        ),
        compare_grid(
            "SYNCHRONOUS AGAINST ASYNCHRONOUS REPLICATION",
            "The choice is about when the write is considered done.",
            [("Synchronous",
              ["The write completes only when every copy has it",
               "Copies never disagree",
               "Every write pays the slowest replica's latency",
               "A failed replica can stall writes entirely"]),
             ("Asynchronous",
              ["The write completes locally and propagates afterwards",
               "Copies briefly disagree -- a reader may see stale data",
               "Writes stay fast regardless of distance",
               "A crash before propagation loses the most recent writes"])]),
        desc(
            "The examination phrases this as a question about a read that "
            "returned old data immediately after a write. Under asynchronous "
            "replication that is expected behaviour rather than a fault: the "
            "read reached a replica the write had not arrived at yet."
        ),
        desc(
            "MASTER-SLAVE replication accepts writes at one node and copies "
            "them outward, which keeps the ordering of writes unambiguous and "
            "makes the master a single point of failure for writing. "
            "MULTI-MASTER accepts writes anywhere, removing that limit and "
            "creating conflicts when two nodes change the same data -- which "
            "then need a resolution rule, and there is no rule that is right "
            "in general."
        ),
    ]),

    ("The CAP Trade-off", [
        desc(
            "One result frames every distributed data decision, and the "
            "syllabus expects it by name."
        ),
        ul([
            "CONSISTENCY: every read sees the most recent write.",
            "AVAILABILITY: every request receives a response.",
            "PARTITION TOLERANCE: the system keeps working when the network "
            "between nodes breaks.",
            "A distributed system can guarantee at most two of the three.",
        ]),
        desc(
            "The way this is usually stated -- 'pick two' -- obscures the "
            "practical point. Networks DO partition, so partition tolerance "
            "is not optional in a genuinely distributed system. The real "
            "choice is what to do during a partition: refuse requests to keep "
            "every copy consistent, or answer them and accept that copies "
            "have diverged."
        ),
        desc(
            "That is why the traditional relational answer and the "
            "distributed-store answer differ so visibly. A banking ledger "
            "would rather be unavailable than wrong; a product catalogue "
            "would rather show a slightly stale price than nothing at all. "
            "Both are correct decisions about different data, which is the "
            "reasoning an examination item is testing."
        ),
    ]),

    ("Data Warehousing", [
        desc(
            "Analytical work and operational work want opposite things from a "
            "database, which is why they are eventually separated."
        ),
        image(fig("warehouse-flow")),
        table(
            ["", "Operational (OLTP)", "Analytical (OLAP)"],
            [["Typical work", "Many small reads and writes",
              "Few enormous reads"],
             ["Touches", "A handful of rows", "Millions of rows"],
             ["Design", "Normalised, to keep writes cheap",
              "Denormalised, to keep reads cheap"],
             ["Data age", "Current", "Historical, spanning years"],
             ["Optimised for", "Throughput of transactions",
              "Response time of one complex query"]],
            caption="Two workloads with genuinely opposite requirements.",
            footer="This is why running analysis against the operational "
                   "database degrades both: a query scanning years of history "
                   "holds resources the transactions need, and the "
                   "normalisation that makes writes cheap makes that query "
                   "join a dozen tables."),
        desc(
            "ETL is the process that moves data between them -- EXTRACT from "
            "the source systems, TRANSFORM to clean and conform it, LOAD into "
            "the warehouse. The transform step is where records from systems "
            "that name the same customer differently are reconciled, and it "
            "is normally the largest part of the work."
        ),
        desc(
            "The syllabus also names ELT, in which raw data is loaded first "
            "and transformed inside the target system. It suits a target with "
            "enough processing power to do the work, and it preserves the raw "
            "data, so a transformation found to be wrong can be redone "
            "without re-extracting."
        ),
    ]),

    ("The Dimensional Model", [
        desc(
            "A warehouse is not normalised, and the shape it takes instead "
            "has names the examination uses."
        ),
        content_accordion(
            "HOW A WAREHOUSE IS STRUCTURED",
            "Three terms that describe one arrangement.",
            [("Fact table",
              "Holds the measurements -- quantities sold, amounts charged -- "
              "one row per event, with keys pointing at the dimensions. It is "
              "the large table, often by several orders of magnitude."),
             ("Dimension table",
              "Holds the descriptive attributes something is analysed BY: "
              "time, product, customer, store. Small, wide, and deliberately "
              "denormalised so a query needs one join rather than five."),
             ("Star schema",
              "One fact table surrounded by dimension tables joined directly "
              "to it. Named for its shape. Simple to query and simple for an "
              "optimiser to plan."),
             ("Snowflake schema",
              "A star whose dimensions are themselves normalised into further "
              "tables. Saves storage, adds joins, and is generally the worse "
              "trade in a warehouse where read speed is the whole point.")]),
        desc(
            "A DATA MART is a subset of a warehouse serving one department, "
            "which is cheaper to build and query. The risk the syllabus notes "
            "is marts built independently drifting apart, so that two "
            "departments report different figures for the same measure and "
            "neither is obviously wrong."
        ),
    ]),

    ("Data Mining and OLAP", [
        desc(
            "Having gathered the data, two distinct activities extract value "
            "from it, and the syllabus distinguishes them clearly."
        ),
        table(
            ["", "OLAP", "Data mining"],
            [["You bring", "A question", "A goal, not a question"],
             ["It returns", "The answer, aggregated",
              "Patterns you had not asked about"],
             ["Example", "Sales by region by quarter",
              "Which products are bought together"],
             ["Driven by", "The analyst", "The algorithm"]],
            caption="Asking a question against being told something.",
            footer="OLAP confirms or refutes what somebody already suspects. "
                   "Mining surfaces relationships nobody proposed -- which "
                   "is also why its results need validating before they are "
                   "believed."),
        desc(
            "OLAP operations have names worth recognising: DRILL DOWN moves "
            "to finer detail, ROLL UP aggregates to a coarser level, SLICE "
            "fixes one dimension to a single value, and DICE selects a range "
            "on several dimensions at once."
        ),
        desc(
            "Mining techniques the syllabus names include ASSOCIATION rules "
            "-- the classic finding of items bought together -- CLUSTERING "
            "into groups that were not defined in advance, CLASSIFICATION "
            "into categories that were, and REGRESSION for predicting a "
            "numeric value. A BIG DATA store, in this framing, is simply one "
            "sized for volume, variety and velocity beyond what a "
            "conventional warehouse absorbs."
        ),
        desc(
            "One caution the examination sometimes reaches for: mining finds "
            "CORRELATION, and a correlation is not a cause. A rule saying two "
            "products sell together is useful for placement and says nothing "
            "about why -- and acting as though it did is the standard "
            "misreading of a mining result."
        ),
    ]),

    ("NoSQL Stores", [
        desc(
            "Not all data suits tables, and not all applications need every "
            "ACID guarantee. The non-relational families each optimise for "
            "one access pattern."
        ),
        content_tabs(
            "FOUR FAMILIES",
            "Each is built for a shape of data and a way of reaching it.",
            [("Key-value",
              "a dictionary at scale",
              "Stores a value against a key, with no visibility into the "
              "value. Extremely fast and trivially partitioned, since the key "
              "decides the node. Suits sessions and caches, and cannot query "
              "by anything but the key."),
             ("Document",
              "self-contained records",
              "Stores structured documents, typically JSON, and can query "
              "inside them. Each document carries its own structure, so "
              "records need not agree -- which suits evolving data and gives "
              "up the schema's guarantees."),
             ("Column-family",
              "wide sparse rows",
              "Groups columns and stores them together, so a query reading "
              "two columns of a billion rows reads only those columns. Built "
              "for enormous analytical scans rather than for retrieving whole "
              "rows."),
             ("Graph",
              "relationships as first-class",
              "Stores nodes and edges, and traverses them directly. A "
              "question like 'who is connected to this person within three "
              "steps' costs a traversal here and an unbounded pile of joins "
              "in a relational store.")]),
        desc(
            "BASE is the term set against ACID: Basically Available, Soft "
            "state, Eventual consistency. It describes accepting temporary "
            "disagreement between copies in exchange for availability and "
            "scale, which is the CAP choice made in the other direction."
        ),
        desc(
            "The judgement the examination wants is not that one family is "
            "better. It is that a store built for one access pattern serves "
            "others badly -- a key-value store cannot answer a question about "
            "the values, a graph store is a poor ledger -- so the question is "
            "always which pattern dominates."
        ),
    ]),

    ("When Relational Remains Right", [
        desc(
            "The alternatives are prominent enough that it is worth stating "
            "plainly when they are the wrong answer."
        ),
        ul([
            "The data genuinely has a stable structure, which a schema then "
            "enforces for free.",
            "Correctness matters more than availability -- anything financial "
            "or legally consequential.",
            "Queries are unpredictable, since SQL answers questions nobody "
            "anticipated and a key-value store answers only the one it was "
            "keyed for.",
            "Transactions must span several records atomically.",
            "The volume genuinely fits one machine, which is a far larger "
            "volume than most estimates assume.",
        ]),
        desc(
            "That last point deserves emphasis, because it is where systems "
            "are most often over-engineered. Modern hardware holds a great "
            "deal, and a distributed store adopted before it is needed pays "
            "all of the complexity for none of the benefit -- while giving up "
            "guarantees the application then reimplements badly."
        ),
    ]),

    ("Sharding and the Choice of Key", [
        desc(
            "Sharding is horizontal fragmentation applied for scale rather "
            "than geography, and the whole outcome rests on one decision."
        ),
        desc(
            "The SHARD KEY decides which node holds a row, and it therefore "
            "decides three things at once: whether load spreads evenly, "
            "whether a typical query reaches one node or all of them, and "
            "whether a typical transaction stays within one node. A key that "
            "gets all three right makes sharding nearly invisible; a key that "
            "gets any of them wrong is expensive to change afterwards, "
            "because changing it means moving data."
        ),
        table(
            ["Key choice", "Load spread", "Typical query"],
            [["Customer identity", "Even, if customers are similar",
              "One node, for anything about one customer"],
             ["Date of creation", "Uneven -- today's node takes every write",
              "One node per period, all nodes for a range"],
             ["A hash of the identity", "Very even",
              "One node by identity, all nodes for a range"],
             ["Geographic region", "As uneven as the regions are",
              "One node, and data stays near its users"]],
            caption="Four shard keys, and what each does to load and to "
                    "queries.",
            footer="The date row shows the classic mistake, a HOTSPOT: "
                   "sharding by creation date sends every new write to the "
                   "same node, so the cluster grows and the write capacity "
                   "does not."),
        desc(
            "REBALANCING is the operational consequence. Adding a node means "
            "moving data onto it, and doing so without stopping the system is "
            "what consistent hashing and similar schemes exist to make "
            "cheaper -- limiting how much data has to move when membership "
            "changes."
        ),
    ]),

    ("Caching in Front of a Database", [
        desc(
            "Before distributing a database, most systems put a cache in "
            "front of it, and it is the same locality argument the memory "
            "hierarchy made in Computer Component."
        ),
        content_accordion(
            "THREE CACHING STRATEGIES",
            "They differ in who writes what, and when.",
            [("Cache-aside",
              "The application checks the cache, and on a miss reads the "
              "database and populates it. Simple and common. The cache can "
              "hold stale data after an update, so entries are invalidated or "
              "expired."),
             ("Write-through",
              "Every write goes to the cache and the database together, so "
              "the cache is never stale. Writes are slower, and data written "
              "but never read occupies the cache for nothing."),
             ("Write-behind",
              "Writes land in the cache and reach the database later. "
              "Fastest, and a crash before the write-out loses data -- which "
              "is the same trade a write-back processor cache makes.")]),
        desc(
            "INVALIDATION is where caching goes wrong, and the failure is "
            "specific: an update that changes the database without clearing "
            "the cache leaves readers seeing the old value indefinitely, with "
            "nothing reporting an error. It is the same class of defect as "
            "asynchronous replication's stale read, except that it does not "
            "resolve itself."
        ),
        desc(
            "A related hazard is the cache STAMPEDE: a popular entry expires "
            "and every request that wanted it hits the database "
            "simultaneously, which can be enough to take it down. It is worth "
            "recognising because the symptom -- sudden load spikes on an "
            "otherwise steady system -- points away from the actual cause."
        ),
    ]),

    ("Data Lakes and Governance", [
        desc(
            "A warehouse assumes the structure is known before loading. A "
            "DATA LAKE stores raw data in its original form and imposes "
            "structure when it is read."
        ),
        compare_grid(
            "WAREHOUSE AGAINST LAKE",
            "Where the structuring effort happens.",
            [("Data warehouse",
              ["Structure decided before loading -- schema on write",
               "Only data somebody planned a use for",
               "Immediately queryable and consistent",
               "A new question may need a new pipeline"]),
             ("Data lake",
              ["Structure imposed at query time -- schema on read",
               "Everything, including data with no known use yet",
               "Cheap to load, and harder to query",
               "Degenerates into an unusable swamp without cataloguing"])]),
        desc(
            "GOVERNANCE is what separates the two outcomes for a lake. A "
            "catalogue recording what each dataset is, where it came from and "
            "who owns it is not optional bureaucracy -- it is the difference "
            "between a resource and an accumulation nobody can safely use."
        ),
        desc(
            "The syllabus connects this to obligations covered in the Legal "
            "Affairs lessons. Personal data retained because it might be "
            "useful is personal data that must still be protected, "
            "inventoried and eventually deleted, so a lake enlarges legal "
            "exposure at the same rate it enlarges analytical possibility."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where application items are lost."),
        ul([
            "Treating CAP as a free choice of two. Partitions happen, so the "
            "real choice is what to do during one.",
            "Reporting stale data after a write as a fault, when asynchronous "
            "replication makes it expected.",
            "Confusing a star with a snowflake schema. The snowflake "
            "normalises the dimensions.",
            "Mixing up the fact and dimension tables. Facts are the "
            "measurements and the large table.",
            "Confusing OLAP with data mining. OLAP answers a question you "
            "brought.",
            "Treating a mined correlation as a cause.",
            "Assuming NoSQL means faster. It means a different trade, "
            "usually giving up consistency or query flexibility.",
            "Believing a schemaless store removes the need for structure. It "
            "moves the enforcement into the application.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An online shop replicates its product catalogue to several "
            "regions asynchronously. A price is updated, and a customer in "
            "another region sees the old price for several seconds. Is this a "
            "fault, and what would eliminate it?\""
        ),
        ol([
            "Identify the mechanism. Asynchronous replication completes the "
            "write locally and propagates afterwards.",
            "So during propagation, replicas legitimately hold different "
            "values -- the behaviour described is expected, not a fault.",
            "What would eliminate it is SYNCHRONOUS replication, where the "
            "write does not complete until every copy has it.",
            "But that makes every price update pay the slowest region's "
            "latency, and a failed region can stall updates entirely.",
            "So the answer is that it is a deliberate trade: the catalogue "
            "has chosen availability and speed over immediate consistency, "
            "which for a price display is very likely correct.",
        ]),
        desc(
            "Steps four and five are what a full answer needs. Naming "
            "synchronous replication answers 'what would eliminate it'; "
            "saying what that costs, and that the original choice was "
            "reasonable FOR THIS DATA, is what these items are actually "
            "assessing."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("This lesson draws the database category together."),
        ul([
            "Two-phase commit and its blocking window come from the previous "
            "lesson and from Middleware.",
            "Replication for availability is redundancy from System "
            "Configuration, with the same reasoning.",
            "Denormalisation for read speed reverses the normalisation of the "
            "design lesson, deliberately.",
            "Column-family storage is a locality argument, like the caching "
            "of Computer Component.",
            "Warehouse content is personal data, which the Legal Affairs "
            "lessons regulate.",
            "Backup and recovery of distributed data are Service Management "
            "continuity concerns.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What CAP actually forces",
              "A choice of behaviour during a partition",
              "Partitions happen, so the choice is refusing requests to stay "
              "consistent, or answering and diverging."),
             ("Synchronous against asynchronous replication",
              "Copies never disagree, against writes never wait",
              "A stale read straight after a write is expected under "
              "asynchronous replication, not a fault."),
             ("OLTP against OLAP design",
              "Normalised for cheap writes, denormalised for cheap reads",
              "Which is why the two workloads are eventually separated -- "
              "each degrades the other."),
             ("Star against snowflake",
              "Snowflake normalises the dimension tables",
              "Saving storage and adding joins, which is the wrong trade "
              "where read speed is the whole point."),
             ("OLAP against data mining",
              "An answer to your question, against a pattern you did not "
              "propose",
              "And a mined pattern is a correlation, which is not a cause."),
             ("What the NoSQL families have in common",
              "Each optimises one access pattern and serves others badly",
              "So the question is never which is better but which pattern "
              "dominates.")]),
    ]),
]

_quiz = [
    mcq("HARD",
        "Under asynchronous replication, a customer reads a product price "
        "seconds after it was updated elsewhere and sees the old value.\n\n"
        "How should this be understood?",
        [("A replication fault that requires the affected replica to be rebuilt from the master", False),
         ("Expected behaviour, since the write completes before it "
          "propagates", True),
         ("A consequence of the read using the wrong isolation level", False),
         ("Evidence that the write was rolled back at the master", False)],
        "Asynchronous replication completes a write locally and propagates it "
        "afterwards, so replicas legitimately hold different values during "
        "propagation. Synchronous replication would eliminate the window by "
        "making every write wait for every copy -- at the cost of the slowest "
        "replica's latency on each write, and a stall if one replica fails. "
        "For a price display that is very likely the worse trade."),

    mcq("HARD",
        "According to the CAP theorem, what must a genuinely distributed "
        "system decide?",
        [("Whether to provide consistency or availability during a network "
          "partition", True),
         ("Which two of the three properties to implement, freely choosing "
          "any pair", False),
         ("Whether to tolerate partitions or avoid them by design", False),
         ("Whether transactions should be atomic or eventually "
          "consistent", False)],
        "Networks partition whether or not a designer wishes them to, so "
        "partition tolerance is not genuinely optional -- which makes the "
        "real decision what the system does DURING a partition: refuse "
        "requests so every copy stays consistent, or answer them and accept "
        "divergence. A ledger prefers the first and a catalogue the second, "
        "and both are correct about different data."),

    mcq("AVERAGE",
        "Why is a data warehouse deliberately denormalised while an "
        "operational database is normalised?",
        [("Warehouses hold considerably less data than operational systems, so redundancy costs little", False),
         ("Analytical queries favour fewer joins; operational writes favour "
          "no redundancy", True),
         ("Warehouses cannot enforce referential integrity", False),
         ("Normalisation is only possible where data changes frequently",
          False)],
        "The two workloads want opposite things. Normalisation stores each "
        "fact once, which makes writes cheap and requires joins to reassemble "
        "-- right for transactions. Analytical queries scan enormous ranges, "
        "where every join is multiplied across millions of rows, so the "
        "warehouse accepts redundancy to avoid them. Neither design is "
        "better; each fits its workload, which is why they are separated."),

    mcq("AVERAGE",
        "In a star schema, what does the fact table contain?",
        [("The descriptive attributes that measurements are analysed by, such as time and product", False),
         ("The measurements, one row per event, with keys to the "
          "dimensions", True),
         ("The normalised versions of the dimension tables", False),
         ("Metadata describing the warehouse's structure", False)],
        "Facts are measurements -- quantities, amounts -- recorded one row per "
        "event and pointing at the dimensions by key, which makes the fact "
        "table the large one, often by orders of magnitude. Descriptive "
        "attributes such as time, product and customer live in the DIMENSION "
        "tables, which are small, wide and deliberately denormalised. "
        "Normalising those dimensions turns the star into a snowflake."),

    mcq("AVERAGE",
        "What distinguishes data mining from OLAP?",
        [("Mining operates on live operational data while OLAP does "
          "not", False),
         ("Mining discovers patterns not asked about; OLAP answers a question "
          "posed", True),
         ("Mining is performed by the database engine and OLAP by the "
          "application", False),
         ("Mining requires a normalised schema and OLAP a denormalised "
          "one", False)],
        "OLAP is analyst-driven: a question is brought and an aggregated "
        "answer returned, confirming or refuting what somebody suspected. "
        "Mining is algorithm-driven and surfaces relationships nobody "
        "proposed. That difference is also why mining results need "
        "validating: what emerges is a CORRELATION, and treating it as a "
        "cause is the standard misreading of one."),

    mcq("HARD",
        "An application must store user session data, retrieved only by "
        "session identifier, at very high volume.\n\n"
        "Which store fits best?",
        [("A key-value store", True),
         ("A graph database", False),
         ("A relational database with a normalised schema", False),
         ("A column-family store", False)],
        "Every access is by a single known key, which is exactly what a "
        "key-value store is built for -- and because the key decides the "
        "node, it partitions trivially as volume grows. Its limitation, that "
        "it cannot query by anything inside the value, costs nothing when "
        "nothing ever queries that way. A graph store suits traversing "
        "relationships, and a column-family store enormous analytical scans."),

    mcq("AVERAGE",
        "What does horizontal fragmentation of a distributed database mean?",
        [("Splitting the table by columns across sites", False),
         ("Splitting the table by rows across sites", True),
         ("Keeping a full copy of the table at every site", False),
         ("Storing indexes separately from the data they cover", False)],
        "Horizontal fragmentation divides the rows, so each site holds whole "
        "rows for part of the population -- and a query about one customer "
        "then touches one site. Vertical fragmentation splits by column, so "
        "reassembling a row means joining across sites, which is why "
        "horizontal is far more common. Keeping a full copy everywhere is "
        "replication, a different mechanism with a different purpose."),

    mcq("HARD",
        "What is the essential trade a document store makes against a "
        "relational database?",
        [("It is faster at every kind of operation, because it avoids the overhead of parsing and planning SQL", False),
         ("It accepts records of differing structure, giving up the schema's "
          "guarantees", True),
         ("It provides stronger transactional guarantees across "
          "records", False),
         ("It removes the need to think about data structure at all", False)],
        "Each document carries its own structure, so records need not agree "
        "-- which suits data whose shape evolves and gives up the enforcement "
        "the schema provided for nothing. The structure does not disappear; "
        "its enforcement moves into the application, where it must be written "
        "and maintained. NoSQL means a different trade rather than uniformly "
        "better performance."),

    mcq("AVERAGE",
        "In ETL, which step reconciles records from systems that describe the "
        "same customer differently?",
        [("Extract", False),
         ("Transform", True),
         ("Load", False),
         ("Analyse", False)],
        "Transform cleans and conforms the data, which includes resolving the "
        "same real entity being represented differently by different source "
        "systems -- and it is normally the largest part of the work. Extract "
        "pulls data out and load writes it in. ELT reverses the last two "
        "steps, loading raw data first so a transformation later found wrong "
        "can be redone without re-extracting."),

    mcq("HARD",
        "Multi-master replication is chosen over master-slave.\n\n"
        "What new problem does this create?",
        [("Every write must still pass through one designated node before reaching the others", False),
         ("Two nodes may change the same data, requiring conflict "
          "resolution", True),
         ("Read performance degrades as replicas are added", False),
         ("The system can no longer tolerate a node failure", False)],
        "Accepting writes at any node removes the master as a write "
        "bottleneck and single point of failure, and allows two nodes to "
        "change the same data independently. Reconciling that needs a "
        "resolution rule -- last write wins, or a merge, or application "
        "judgement -- and no rule is correct in general, which is the cost "
        "master-slave avoids by making write ordering unambiguous."),
]

LESSON_DB_APPS = lesson(
    MAJOR, MIDDLE,
    "Database Applications: Distribution, Warehousing and NoSQL",
    _quiz,
    lesson_structure(
        "Database Applications: Distribution, Warehousing and NoSQL",
        "The earlier database lessons assumed one database on one machine, "
        "and this lesson covers the four ways real systems outgrow that: "
        "distributing data across sites, replicating it for reads and "
        "availability, separating analysis into a warehouse, and reaching for "
        "a non-relational store. None of these is an upgrade -- each buys one "
        "property by giving up another, which is exactly what the examination "
        "asks about. So CAP is treated as a decision about behaviour during a "
        "partition, warehouse denormalisation as the deliberate reversal of "
        "normalisation, and each NoSQL family as an optimisation for one "
        "access pattern that serves the others badly.",
        [
            "Explain fragmentation, replication and transparency in a "
            "distributed database",
            "Contrast synchronous with asynchronous replication and predict "
            "what a reader sees",
            "State the CAP theorem and explain what it actually forces",
            "Contrast OLTP with OLAP requirements and explain the warehouse's "
            "design",
            "Describe ETL and distinguish fact from dimension tables",
            "Distinguish star from snowflake schemas",
            "Distinguish OLAP from data mining and name mining techniques",
            "Select an appropriate NoSQL family for a described access "
            "pattern",
        ],
        80,
        _sections,
        [
            ("Transparency",
             "The property that an application need not know where data lives "
             "-- by location, fragmentation or replication."),
            ("Horizontal fragmentation",
             "Splitting a table by ROWS across sites, keeping whole rows "
             "together. Far more common than vertical."),
            ("Vertical fragmentation",
             "Splitting by COLUMNS, so reassembling a row requires joining "
             "across sites."),
            ("Synchronous replication",
             "The write completes only when every copy holds it. Copies never "
             "disagree; every write pays the slowest replica."),
            ("Asynchronous replication",
             "The write completes locally and propagates afterwards. Fast, "
             "and a reader may legitimately see stale data."),
            ("Multi-master replication",
             "Writes accepted at any node, removing the write bottleneck and "
             "creating conflicts that need a resolution rule."),
            ("CAP theorem",
             "A distributed system guarantees at most two of consistency, "
             "availability and partition tolerance -- so the real decision is "
             "how to behave during a partition."),
            ("BASE",
             "Basically Available, Soft state, Eventual consistency. The CAP "
             "choice made against ACID's direction."),
            ("OLTP against OLAP",
             "Many small transactions against few enormous reads -- opposite "
             "requirements, which is why the workloads are separated."),
            ("ETL",
             "Extract, transform, load. The transform step reconciles source "
             "systems and is normally the largest part."),
            ("Fact table",
             "The measurements, one row per event, keyed to the dimensions. "
             "The large table in a star schema."),
            ("Dimension table",
             "The descriptive attributes data is analysed by. Small, wide and "
             "deliberately denormalised."),
            ("Star and snowflake schemas",
             "A fact table surrounded by dimensions; the snowflake normalises "
             "those dimensions, saving storage and adding joins."),
            ("Data mart",
             "A departmental subset of a warehouse. Cheap, and prone to "
             "drifting away from other marts."),
            ("Data mining",
             "Algorithm-driven discovery of patterns nobody proposed -- "
             "association, clustering, classification, regression."),
            ("NoSQL families",
             "Key-value, document, column-family and graph. Each optimises "
             "one access pattern and serves the others badly."),
        ],
        "Systems outgrow one database on one machine in four ways, and each "
        "response gives something up. Distribution fragments data across "
        "sites -- horizontally by row, which keeps a query on one site, or "
        "vertically by column, which does not -- and a transaction spanning "
        "sites then needs two-phase commit with its blocking window. "
        "Replication serves more reads and survives failure, and the choice "
        "between synchronous and asynchronous is a choice between copies that "
        "never disagree and writes that never wait, so a stale read straight "
        "after a write is expected rather than faulty. CAP frames all of it, "
        "and its real content is not 'pick two' but what to do during a "
        "partition, since partitions happen: refuse requests and stay "
        "consistent, or answer and diverge. Warehousing separates analysis "
        "because OLTP and OLAP want opposite things -- normalised for cheap "
        "writes against denormalised for cheap reads -- with ETL between "
        "them, a fact table of measurements surrounded by denormalised "
        "dimensions, and a snowflake normalising those dimensions in what is "
        "usually the wrong direction. OLAP answers a question somebody "
        "brought; mining surfaces patterns nobody proposed, and a mined "
        "correlation is not a cause. And the NoSQL families each optimise one "
        "access pattern, so the question is never which is better but which "
        "pattern dominates -- with relational remaining right wherever "
        "structure is stable, correctness outranks availability, queries are "
        "unpredictable, or the data simply fits one machine.",
        exam_notes=[
            desc(
                "Items here are trade-off questions. Naming a mechanism is "
                "half an answer; saying what it costs is the other half."
            ),
            ul([
                "Explaining a stale read under replication.",
                "Stating what CAP forces during a partition.",
                "Explaining why a warehouse is denormalised.",
                "Distinguishing fact from dimension, star from snowflake.",
                "Distinguishing OLAP from data mining.",
                "Matching an access pattern to a NoSQL family.",
                "Distinguishing horizontal from vertical fragmentation.",
            ]),
            desc(
                "For any option describing a distributed design, ask what it "
                "gave up. Every technique in this lesson has an answer to "
                "that, and an option that appears to give up nothing is the "
                "distractor."
            ),
        ],
    ))

LESSONS = [LESSON_DB_APPS]

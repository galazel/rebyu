"""IT Passport lesson content: Database (752-755)."""

import sys

sys.path.insert(0, "/app/scripts/fe_expansion")

from builders import (  # noqa: E402
    accordion, compare_grid, content_tabs, desc, flip_cards, image, image_text,
    lesson_structure, media_text, ol, review_cards, sub, table, tabs, ul,
)

FIG = "/lesson-media/%s.svg"

CERTIFICATION_ID = 4

LESSONS = {}


LESSONS[752] = lesson_structure(
    name="Database architecture",
    intro=(
        "A database is an organised collection of data managed so that many people and "
        "programs can use it at once without corrupting it. This lesson covers what a "
        "database management system provides, why the relational model dominates, and "
        "how separating logical design from physical storage protects applications from "
        "change."
    ),
    objectives=[
        "Explain what a DBMS provides beyond storing files.",
        "Describe the relational model in terms of tables, rows and columns.",
        "Explain the three-schema architecture and data independence.",
        "Describe what a view is for.",
        "Distinguish a database from a spreadsheet.",
        "Name alternatives to the relational model and when they suit.",
    ],
    minutes=35,
    sections=[
        ("Why not just use files", [
            desc(
                "Data can be kept in files, and for a single user it often is. Problems "
                "appear as soon as several programs and people share it: the same fact "
                "gets stored in two places and they disagree, two updates collide, and "
                "there is no way to ask a question the file layout did not anticipate."
            ),
            desc(
                "A database management system exists to solve those problems centrally "
                "rather than in every application."
            ),
            ul([
                "Shared access with control over who may do what.",
                "Concurrency -- many users at once without corruption.",
                "Integrity -- rules the data must satisfy, enforced by the system.",
                "Recovery -- restoring a consistent state after a failure.",
                "A query language, so new questions need no new file format.",
            ]),
        ]),
        ("The relational model", [
            desc(
                "A relational database stores data in tables. Each table has named "
                "columns, and each row is one record. Relationships between tables are "
                "expressed by values, not by pointers -- one table holds a value that "
                "matches a key in another."
            ),
            table(
                ["Term", "Means", "Everyday equivalent"],
                [["Table (relation)", "A set of rows with the same columns", "A sheet"],
                 ["Row (tuple)", "One record", "A line"],
                 ["Column (attribute)", "One named field", "A column heading"],
                 ["Primary key", "The column(s) identifying a row uniquely", "A customer number"],
                 ["Foreign key", "A value referring to another table's key", "The customer on an order"]],
            ),
        ]),
        ("Keys", [
            accordion([
                ("Primary key", "Uniquely identifies each row. It cannot be empty and cannot repeat."),
                ("Candidate key", "Any column set that could serve as the primary key; one is chosen and the rest become alternates."),
                ("Foreign key", "A column holding a value that must match a primary key elsewhere, which is how tables are linked."),
                ("Composite key", "A key made of more than one column together, used when no single column is unique."),
            ]),
            desc(
                "Referential integrity is the rule that a foreign key must match an "
                "existing row or be empty. It is what prevents an order line pointing at "
                "an order that does not exist -- a corruption application code alone "
                "rarely prevents reliably."
            ),
        ]),
        ("The three-schema architecture", [
            desc(
                "A database is described at three levels so that a change at one level "
                "does not force changes at the others."
            ),
            image(FIG % "ip-three-schema"),
            ul([
                "External -- what a particular group of users sees, often a restricted view.",
                "Conceptual -- the whole logical design: entities, attributes, relationships.",
                "Internal -- how it is actually stored, indexed and laid out on disk.",
            ]),
            desc(
                "Physical data independence means storage can be reorganised -- an index "
                "added, files moved -- without applications changing. Logical data "
                "independence means the conceptual design can change without every "
                "external view changing. The second is harder and less complete in "
                "practice."
            ),
        ]),
        ("Views", [
            desc(
                "A view is a query given a name and treated as a table. It stores no "
                "data of its own; it presents the underlying tables differently each "
                "time it is used."
            ),
            ul([
                "Simplification -- a complex join presented as one simple table.",
                "Security -- expose only the rows and columns a user should see.",
                "Stability -- applications read the view while the tables beneath it change.",
            ]),
        ]),
        ("Database against spreadsheet", [
            compare_grid(
                "They are not interchangeable",
                "A spreadsheet becoming a shared database is a recognisable failure mode.",
                [("Spreadsheet",
                  "One person, flexible, calculations visible in the cells. No enforced "
                  "structure, easily broken by a sort, no real concurrency."),
                 ("Database",
                  "Many users, enforced types and rules, controlled concurrent change, "
                  "and a query language. More effort to set up, far harder to corrupt.")],
            ),
        ]),
        ("Other models", [
            desc(
                "Relational is the default and not the only option. The alternatives "
                "trade its guarantees for other properties."
            ),
            accordion([
                ("Document store", "Stores records as documents with varying structure. Suits data queried mostly by its own identifier."),
                ("Key-value store", "A simple map from key to value. Extremely fast for caching and sessions."),
                ("Graph database", "Stores entities and the relationships between them. Suits networks -- social connections, routes, dependencies."),
                ("Data warehouse", "A separate analytical store holding history, organised for large scans rather than small transactions."),
            ]),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("What does a foreign key guarantee?", "It matches an existing key or is empty",
                 "That rule is referential integrity."),
                ("Does a view store data?", "No",
                 "It is a named query, evaluated each time it is used."),
                ("Which level does adding an index change?", "Internal",
                 "Applications are unaffected -- that is physical data independence."),
                ("Can a primary key be empty?", "No",
                 "It must uniquely identify every row."),
            ]),
        ]),
    ],
    key_terms=[
        ("DBMS", "Software managing shared, concurrent, protected access to data."),
        ("Relation (table)", "A set of rows sharing the same named columns."),
        ("Primary key", "The column or columns uniquely identifying a row."),
        ("Foreign key", "A value that must match a primary key in another table."),
        ("View", "A named query presented as a table; stores no data itself."),
        ("Data independence", "Insulating applications from changes to storage or design."),
    ],
    summary=(
        "A DBMS provides shared access, concurrency, integrity, recovery and a query "
        "language that files cannot. The relational model stores data in tables linked "
        "by key values, with referential integrity preventing orphaned references. The "
        "three-schema architecture separates what users see, the logical design and "
        "the physical storage, so storage can be reorganised without touching "
        "applications. Views simplify and restrict access without duplicating data, "
        "and non-relational models trade relational guarantees for scale or shape."
    ),
    exam_notes=[
        desc(
            "Key terminology is examined directly. The distinction that catches people "
            "is that a view holds no data of its own."
        ),
        ul([
            "Primary key: unique and never empty. Foreign key: must match or be null.",
            "Physical data independence means storage changes do not reach applications.",
            "A spreadsheet shared by a team is the problem a database solves.",
        ]),
    ],
)


LESSONS[753] = lesson_structure(
    name="Database design",
    intro=(
        "Database design decides what tables exist and what each holds. This lesson "
        "covers entity-relationship modelling, the normalisation that removes ways the "
        "same fact could be stored twice and disagree, and the judgement about when to "
        "stop normalising."
    ),
    objectives=[
        "Identify entities, attributes and relationships from a description.",
        "Read cardinality in an E-R diagram.",
        "Represent a many-to-many relationship in tables.",
        "Explain what first, second and third normal form remove.",
        "Describe the anomalies normalisation prevents.",
        "Explain why a design might be deliberately denormalised.",
    ],
    minutes=40,
    sections=[
        ("Entities, attributes, relationships", [
            desc(
                "Design starts by naming the things the business deals in. An entity is "
                "something you need to keep information about; an attribute is a fact "
                "about it; a relationship is how two entities are connected."
            ),
            ul([
                "Entity -- customer, order, product, employee.",
                "Attribute -- a customer's name, an order's date, a product's price.",
                "Relationship -- a customer PLACES an order; an order CONTAINS products.",
            ]),
            desc(
                "A practical rule: entities tend to be nouns in the description, and "
                "relationships tend to be verbs between them."
            ),
        ]),
        ("Cardinality", [
            desc(
                "Cardinality states how many of one entity may relate to one of "
                "another, and it is read in both directions."
            ),
            table(
                ["Relationship", "Reads as", "Example"],
                [["One-to-one", "Each side has at most one of the other", "Employee and staff locker"],
                 ["One-to-many", "One of A relates to many of B; each B to one A", "Customer and orders"],
                 ["Many-to-many", "Many of each relate to many of the other", "Students and courses"]],
            ),
            desc(
                "Getting cardinality wrong is expensive because it decides the table "
                "structure. Reading it in one direction only is the usual cause."
            ),
        ]),
        ("Turning a model into tables", [
            ol([
                "Each entity becomes a table; each attribute becomes a column.",
                "Choose a primary key for each table.",
                "A one-to-many relationship puts a foreign key on the MANY side.",
                "A many-to-many relationship needs a third table holding both keys.",
                "Attributes of the relationship itself go in that third table.",
            ]),
            desc(
                "The relational model has no direct many-to-many construct, which is why "
                "the junction table is not optional. It is also the only place a fact "
                "about the pairing -- an enrolment date, a quantity ordered -- can "
                "correctly live."
            ),
        ]),
        ("Why normalise", [
            desc(
                "Storing the same fact in more than one place invites the copies to "
                "disagree. Normalisation removes that possibility by design rather than "
                "by discipline."
            ),
            accordion([
                ("Update anomaly", "A customer's address appears on every order; changing it means changing every row, and missing one leaves the data contradicting itself."),
                ("Insert anomaly", "A new product cannot be recorded until somebody orders it, because product details only live on order rows."),
                ("Delete anomaly", "Deleting the last order for a product erases the only record that the product existed."),
            ]),
        ]),
        ("The normal forms", [
            image(FIG % "ip-normalisation"),
            content_tabs(
                "What each form removes",
                "Each builds on the one before it.",
                [("First normal form", "One value per cell",
                  "No repeating groups and no lists inside a column. A column holding "
                  "'red, blue, green' defeats every query and constraint the model offers."),
                 ("Second normal form", "No partial key dependency",
                  "With a composite key, no column may depend on only part of it. A "
                  "product name depending only on product_id, in a table keyed by "
                  "(order_id, product_id), belongs elsewhere."),
                 ("Third normal form", "No transitive dependency",
                  "No non-key column may depend on another non-key column. If city "
                  "determines region, storing both invites a row where they disagree.")],
            ),
        ]),
        ("When to stop", [
            desc(
                "Normalisation is not a virtue pursued to its limit. Each additional "
                "table means another join, and on a read-heavy workload those joins cost."
            ),
            desc(
                "Denormalising -- deliberately keeping some redundancy to avoid joins -- "
                "is a legitimate decision when reads dominate and the duplication is "
                "controlled. It is a decision to be justified and documented, not a "
                "default and not an accident."
            ),
        ]),
        ("Indexes", [
            desc(
                "An index is an additional structure that makes finding rows by a "
                "particular column fast, in the way a book's index beats reading every "
                "page."
            ),
            ul([
                "Speeds up searching and sorting on the indexed column.",
                "Slows down inserts and updates, because the index must be maintained too.",
                "Occupies storage.",
                "Index the columns actually searched, not every column.",
            ]),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("How is many-to-many represented?", "A third junction table",
                 "It holds both keys, plus any attribute of the pairing itself."),
                ("City determines region, both stored -- which form is broken?", "Third normal form",
                 "A transitive dependency between non-key columns."),
                ("A column holding 'red, blue, green' breaks?", "First normal form",
                 "One value per cell is the 1NF requirement."),
                ("What does an index cost?", "Slower writes and storage",
                 "It must be maintained on every insert and update."),
            ]),
        ]),
    ],
    key_terms=[
        ("Entity", "Something the business keeps information about."),
        ("Cardinality", "How many of one entity relate to one of another."),
        ("Junction table", "A table representing a many-to-many relationship."),
        ("Normalisation", "Structuring tables so the same fact is stored once."),
        ("Update anomaly", "Inconsistency caused by a fact being stored in several rows."),
        ("Index", "A structure making searches on a column fast, at a cost to writes."),
    ],
    summary=(
        "Design begins by identifying entities, attributes and relationships, and "
        "cardinality read in both directions decides the table structure. One-to-many "
        "puts a foreign key on the many side; many-to-many requires a junction table, "
        "which is also the only correct home for attributes of the pairing. "
        "Normalisation to third normal form removes update, insert and delete "
        "anomalies by ensuring each fact is stored once, and deliberate denormalisation "
        "trades that guarantee for read speed where it is justified."
    ),
    exam_notes=[
        desc(
            "Normal-form questions give a table and ask which form it breaks. Work "
            "through them in order: repeating values (1NF), dependence on part of a key "
            "(2NF), dependence between non-key columns (3NF)."
        ),
        ul([
            "Many-to-many ALWAYS needs a third table.",
            "1NF: one value per cell. 2NF: partial key dependency. 3NF: transitive.",
            "An index speeds reads and slows writes.",
        ]),
    ],
)


LESSONS[754] = lesson_structure(
    name="Data manipulation",
    intro=(
        "Once data is stored it has to be retrieved, filtered, combined and changed. "
        "This lesson covers the operations a relational database provides and the SQL "
        "used to express them, at the level the IT Passport examination asks: reading a "
        "statement and saying what it returns."
    ),
    objectives=[
        "Describe selection, projection and join.",
        "Read a simple SELECT statement and predict its result.",
        "Use WHERE to filter rows.",
        "Explain what ORDER BY, GROUP BY and aggregate functions do.",
        "Describe INSERT, UPDATE and DELETE and their risks.",
        "Explain what a join combines and why it is needed.",
    ],
    minutes=40,
    sections=[
        ("Three fundamental operations", [
            desc(
                "Everything a query does is built from three operations on tables."
            ),
            table(
                ["Operation", "Takes", "Analogy"],
                [["Selection", "The rows that match a condition", "Filtering a list"],
                 ["Projection", "Only the columns named", "Hiding columns"],
                 ["Join", "Rows from two tables matched on a shared value", "Looking something up"]],
                caption="A typical query is all three at once.",
            ),
        ]),
        ("Reading a SELECT", [
            desc(
                "SQL states WHAT is wanted, not how to fetch it. The clauses always "
                "appear in the same order."
            ),
            ol([
                "SELECT -- which columns (projection).",
                "FROM -- which table or tables.",
                "WHERE -- which rows (selection).",
                "GROUP BY -- how to collapse rows into groups.",
                "HAVING -- which groups to keep.",
                "ORDER BY -- how to sort the result.",
            ]),
            desc(
                "SELECT name, price FROM products WHERE price > 1000 ORDER BY price "
                "returns two columns, only the rows costing more than 1,000, arranged "
                "from cheapest to dearest."
            ),
        ]),
        ("Filtering", [
            desc(
                "WHERE takes a condition, and conditions combine with AND, OR and NOT. "
                "Bracketing changes the meaning, exactly as in arithmetic."
            ),
            table(
                ["Operator", "Matches", "Example"],
                [["=, <>, <, >", "Comparison", "price > 1000"],
                 ["BETWEEN", "A range, inclusive", "price BETWEEN 100 AND 500"],
                 ["IN", "Any of a list", "city IN ('Tokyo', 'Osaka')"],
                 ["LIKE", "A text pattern", "name LIKE 'A%' -- starts with A"],
                 ["IS NULL", "No value recorded", "phone IS NULL"]],
            ),
            desc(
                "NULL means no value was recorded, which is not the same as zero or an "
                "empty string. Comparing anything to NULL with = never matches, which is "
                "why IS NULL exists."
            ),
        ]),
        ("Grouping and aggregates", [
            desc(
                "Aggregate functions collapse many rows into one value, and GROUP BY "
                "says which rows belong together."
            ),
            ul([
                "COUNT -- how many rows.",
                "SUM -- total of a numeric column.",
                "AVG -- mean of a numeric column.",
                "MAX and MIN -- largest and smallest.",
            ]),
            desc(
                "SELECT city, COUNT(*) FROM customers GROUP BY city returns one row per "
                "city with the number of customers in each. Without GROUP BY, COUNT(*) "
                "returns a single number for the whole table."
            ),
        ]),
        ("Joins", [
            desc(
                "Data is deliberately split across tables during design, so most useful "
                "questions require putting it back together. A join matches rows from "
                "two tables on a shared value -- almost always a foreign key meeting its "
                "primary key."
            ),
            compare_grid(
                "Inner and outer joins",
                "The difference is what happens to rows with no match.",
                [("Inner join",
                  "Returns only rows that match on both sides. A customer with no orders "
                  "disappears from the result."),
                 ("Left outer join",
                  "Returns every row from the left table, with nulls where the right has "
                  "no match. This is how you find customers who have never ordered.")],
            ),
        ]),
        ("Changing data", [
            desc(
                "Three statements change stored data, and two of them are dangerous in "
                "the same way."
            ),
            accordion([
                ("INSERT", "Adds new rows. Fails if it would breach a key or a constraint, which is the database protecting itself."),
                ("UPDATE", "Changes existing rows. Without a WHERE clause it changes EVERY row in the table."),
                ("DELETE", "Removes rows. Without a WHERE clause it removes every row in the table."),
            ]),
            desc(
                "The professional habit is to write the WHERE clause first, run it as a "
                "SELECT to see exactly which rows are affected, and only then turn it "
                "into an UPDATE or DELETE."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("UPDATE with no WHERE affects?", "Every row",
                 "Same for DELETE. Check with a SELECT first."),
                ("Which join keeps unmatched left rows?", "Left outer join",
                 "Inner join drops rows with no match on either side."),
                ("Does = NULL ever match?", "No",
                 "NULL means unknown; use IS NULL."),
                ("What does GROUP BY do?", "Collapses rows into groups",
                 "Aggregates such as COUNT then apply per group."),
            ]),
        ]),
    ],
    key_terms=[
        ("Selection", "Choosing rows that meet a condition."),
        ("Projection", "Choosing which columns appear."),
        ("Join", "Combining rows from two tables matched on a shared value."),
        ("Aggregate function", "COUNT, SUM, AVG, MAX, MIN -- collapsing rows to one value."),
        ("NULL", "No value recorded; not zero and not an empty string."),
        ("Outer join", "A join preserving unmatched rows from one side, padded with nulls."),
    ],
    summary=(
        "Queries are built from selection, projection and join, expressed in SQL, which "
        "states what is wanted rather than how to get it. WHERE filters rows, GROUP BY "
        "collapses them into groups for aggregate functions, and ORDER BY sorts the "
        "result. Joins reassemble data that design deliberately separated, with outer "
        "joins preserving rows that have no match. INSERT, UPDATE and DELETE change "
        "data, and an UPDATE or DELETE without a WHERE clause affects every row."
    ),
    exam_notes=[
        desc(
            "Expect a small table and a SELECT statement, with the question being what "
            "comes back. Work through the clauses in order, and watch for NULL, which "
            "never matches an equality test."
        ),
        ul([
            "No WHERE means every row -- for UPDATE and DELETE alike.",
            "Inner join drops unmatched rows; outer join keeps them.",
            "COUNT(*) without GROUP BY returns one number for the whole table.",
        ]),
    ],
)


LESSONS[755] = lesson_structure(
    name="Transaction processing",
    intro=(
        "A transaction is a group of operations that must all succeed or all fail "
        "together. This lesson covers the ACID properties that make a database "
        "trustworthy for money, how concurrent transactions are kept from interfering, "
        "and how a database recovers after a crash."
    ),
    objectives=[
        "Define a transaction and give an example.",
        "Explain each of the ACID properties.",
        "Describe commit and rollback.",
        "Explain why concurrent access needs locking.",
        "Describe deadlock and how a DBMS resolves it.",
        "Explain how a log allows recovery after a failure.",
    ],
    minutes=35,
    sections=[
        ("What a transaction is", [
            desc(
                "A transaction is a unit of work that must happen completely or not at "
                "all. A bank transfer is the standard example: subtract from one account, "
                "add to another. Either both happen or neither does."
            ),
            desc(
                "Without that guarantee a crash between the two steps destroys money. "
                "The transaction is what makes the pair inseparable from every other "
                "observer's point of view."
            ),
        ]),
        ("The ACID properties", [
            image(FIG % "ip-acid"),
            accordion([
                ("Atomicity", "All operations commit or none do. A partially applied transaction is impossible."),
                ("Consistency", "The database moves from one valid state to another; declared rules are never left broken."),
                ("Isolation", "Concurrent transactions behave as though they ran one at a time; none sees another's partial work."),
                ("Durability", "Once committed, the change survives a crash, because it reached stable storage first."),
            ]),
        ]),
        ("Commit and rollback", [
            desc(
                "A transaction ends in one of two ways. Commit makes every change "
                "permanent and visible to others. Rollback undoes everything since the "
                "transaction began, leaving no trace."
            ),
            ol([
                "Begin the transaction.",
                "Perform the operations.",
                "If everything succeeded, commit.",
                "If anything failed, roll back -- returning to exactly the prior state.",
            ]),
        ]),
        ("Concurrency", [
            desc(
                "Many users work at once, and without control their transactions "
                "interfere in ways that corrupt data silently."
            ),
            accordion([
                ("Lost update", "Two transactions read the same value, each modifies it, and the second overwrites the first's change as though it never happened."),
                ("Dirty read", "One transaction reads another's uncommitted change, then that change is rolled back -- so the value read never really existed."),
                ("Non-repeatable read", "The same query run twice in one transaction returns different results because another committed in between."),
            ]),
        ]),
        ("Locking", [
            desc(
                "The usual mechanism is locking: a transaction takes a lock on what it "
                "is using, and others wait."
            ),
            compare_grid(
                "Two kinds of lock",
                "The difference is whether others may read at the same time.",
                [("Shared (read) lock",
                  "Several transactions may hold one simultaneously. Everyone can read; "
                  "nobody can write."),
                 ("Exclusive (write) lock",
                  "Only one holder at a time. Nobody else may read or write until it is "
                  "released.")],
            ),
            desc(
                "Locking correctly is a trade: locking more guarantees more isolation "
                "and reduces how much work can proceed at once."
            ),
        ]),
        ("Deadlock", [
            desc(
                "Deadlock occurs when two transactions each hold a lock the other needs. "
                "Neither can proceed, and neither will release, so they would wait "
                "forever."
            ),
            desc(
                "Databases detect this and resolve it by choosing a victim: one "
                "transaction is aborted and rolled back, freeing its locks, and is "
                "usually retried automatically. Waiting for an administrator is not an "
                "option, because the whole system would stall behind them."
            ),
        ]),
        ("Recovery", [
            desc(
                "A database writes a log of changes before applying them. After a crash "
                "it reads that log and repairs itself."
            ),
            ul([
                "Roll forward (redo) -- reapply committed transactions whose changes had not reached the data files.",
                "Roll back (undo) -- reverse transactions that were in progress and never committed.",
                "Checkpoint -- a recorded consistent point, so recovery need not read the whole log.",
            ]),
            desc(
                "Writing the log before the data is what makes durability real: the "
                "commit is acknowledged only once the log record is safely stored."
            ),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Which property means all-or-nothing?", "Atomicity",
                 "Durability is about surviving a crash after commit."),
                ("Two transactions each hold what the other needs?", "Deadlock",
                 "The DBMS aborts one as a victim and rolls it back."),
                ("Reading another transaction's uncommitted change?", "Dirty read",
                 "If that change rolls back, the value read never existed."),
                ("Why write the log before the data?", "So a commit can be trusted",
                 "The change is recoverable even if the data files lag."),
            ]),
        ]),
    ],
    key_terms=[
        ("Transaction", "A unit of work that must complete entirely or not at all."),
        ("Commit", "Making a transaction's changes permanent and visible."),
        ("Rollback", "Undoing everything a transaction did, back to its start."),
        ("Lock", "A claim on data preventing conflicting concurrent access."),
        ("Deadlock", "Two transactions each holding a lock the other needs."),
        ("Write-ahead log", "A record of changes written before the data, enabling recovery."),
    ],
    summary=(
        "A transaction groups operations that must succeed or fail together, and the "
        "ACID properties -- atomicity, consistency, isolation, durability -- are what "
        "make a database trustworthy for money. A transaction ends by committing or "
        "rolling back. Concurrent access risks lost updates and dirty reads, which "
        "locking prevents at the cost of parallelism, and deadlock is resolved by "
        "aborting a victim. Writing a log before the data is what lets a crashed "
        "database redo committed work and undo the rest."
    ),
    exam_notes=[
        desc(
            "ACID is examined by scenario: a description is given and you name the "
            "property at stake. Atomicity and durability are the pair most often "
            "confused -- atomicity is all-or-nothing, durability is surviving a crash "
            "afterwards."
        ),
        ul([
            "Deadlock is resolved by aborting one transaction, not by waiting.",
            "A dirty read is reading UNCOMMITTED data.",
            "The log is written before the data; that is what makes commit meaningful.",
        ]),
    ],
)

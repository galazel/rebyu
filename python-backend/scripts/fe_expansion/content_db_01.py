"""Technology Element -> Database, lessons 1 and 2.

Syllabus minor categories 1 (database architecture) and 2 (database design).

Normalisation is the most reliably examined single topic in this middle
category, and it is examined by DOING it -- given a table, which normal form
is it in and what breaks it. So the forms are worked through on one running
example rather than defined abstractly.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Technology Element"
MIDDLE = "Database"

# ==========================================================================
# Lesson 1: Database architecture
# ==========================================================================

_arch_sections = [
    ("What a Database Management System Is For", [
        desc(
            "Data can be kept in files. A database management system exists "
            "because doing so stops working as soon as more than one program "
            "and more than one person are involved."
        ),
        table(
            ["Problem with files", "What a DBMS provides instead"],
            [["Each program defines its own format",
              "One shared definition every program uses"],
             ["The same fact stored in several files",
              "Stored once, referenced from everywhere"],
             ["Two programs writing at once corrupt each other",
              "Concurrency control"],
             ["A crash mid-write leaves a half-written file",
              "Transactions and recovery"],
             ["Anyone with file access reads everything",
              "Access control per table and column"],
             ["Finding records means writing code",
              "A query language"]],
            caption="Six problems, and the six services that answer them.",
            footer="Notice the second row. Redundancy is not merely wasteful "
                   "-- it means the same fact can disagree with itself, which "
                   "is the failure normalisation exists to prevent."),
        desc(
            "DATA INDEPENDENCE is the underlying idea and the one worth "
            "naming early. Programs should not have to change when the "
            "storage changes, and they should not have to change when parts "
            "of the logical design they do not use change. The architecture "
            "in the next section exists to deliver exactly those two "
            "guarantees."
        ),
    ]),

    ("The Three-Schema Architecture", [
        desc(
            "The standard architecture separates a database into three "
            "levels, and the examination asks which level a described concern "
            "belongs to."
        ),
        image(fig("three-schema")),
        table(
            ["Level", "Describes", "Who it serves"],
            [["External (view)", "One application's slice of the data",
              "Each application, seeing only what it needs"],
             ["Conceptual (logical)", "The whole logical design -- entities, "
                                      "attributes, relationships, constraints",
              "The organisation, once"],
             ["Internal (physical)", "How data is actually stored: files, "
                                     "indexes, layout",
              "The database engine"]],
            caption="Three levels, described once each.",
            footer="Two mappings connect them, and each mapping is what makes "
                   "one kind of change invisible to the level above."),
        desc(
            "LOGICAL DATA INDEPENDENCE is the ability to change the "
            "conceptual schema -- adding a table or a column, splitting an "
            "entity -- without changing the applications above it. PHYSICAL "
            "DATA INDEPENDENCE is the ability to change the internal schema "
            "-- adding an index, reorganising storage, moving to different "
            "hardware -- without changing the logical design."
        ),
        desc(
            "The examination asks which of the two a described change "
            "requires, and the discriminating question is simple: was the "
            "LOGICAL design altered, or only how it is stored? Adding an "
            "index changes performance and nothing about what the data means, "
            "so it needs only physical independence -- which is why it can be "
            "done to a running system."
        ),
    ]),

    ("Data Models", [
        desc(
            "A data model is the way a database organises what it holds. The "
            "syllabus names several, and the relational model dominates "
            "because of a property the others lack."
        ),
        content_accordion(
            "THE MODELS THE SYLLABUS NAMES",
            "Listed roughly historically, since each answered a limitation of "
            "the one before.",
            [("Hierarchical",
              "Records in a tree, each with one parent. Fast for the "
              "relationships built into the structure and incapable of "
              "expressing anything else -- a part belonging to two assemblies "
              "must be stored twice."),
             ("Network",
              "Records with explicit pointers, allowing many-to-many "
              "relationships the hierarchy could not express. More capable, "
              "and navigating it meant following pointers in code, so "
              "programs were written against the physical structure."),
             ("Relational",
              "Data as TABLES of rows and columns, with relationships "
              "expressed by matching VALUES rather than by pointers. The "
              "consequence is decisive: because there are no navigation paths "
              "to follow, a query says WHAT is wanted and the system chooses "
              "how -- which is what made a query optimiser possible."),
             ("Object-oriented and object-relational",
              "Storing objects with their behaviour, or adding complex types "
              "to a relational system. Suits domains whose data does not "
              "decompose neatly into tables, and it never displaced the "
              "relational model for general business data."),
             ("NoSQL families",
              "Key-value, document, column-family and graph stores, each "
              "relaxing something the relational model guarantees in exchange "
              "for scale or flexibility. Treated in the Database "
              "Applications lesson.")]),
        desc(
            "The relational model's advantage is worth stating plainly "
            "because it explains why it won. Relationships by value rather "
            "than by pointer means the physical arrangement is entirely the "
            "system's business -- so it can be changed, indexed and optimised "
            "without any program noticing, which is physical data "
            "independence actually delivered rather than merely intended."
        ),
    ]),

    ("Relational Terminology", [
        desc(
            "The relational model has formal terms and everyday equivalents, "
            "and the examination uses both."
        ),
        table(
            ["Formal term", "Everyday term", "Means"],
            [["Relation", "Table", "A set of rows with the same columns"],
             ["Tuple", "Row / record", "One instance of the entity"],
             ["Attribute", "Column / field", "One property of it"],
             ["Domain", "Data type and permitted values",
              "What may legally appear in a column"],
             ["Degree", "Number of columns", "A property of the design"],
             ["Cardinality", "Number of rows", "A property of the data"]],
            caption="Six pairs of terms for the same six things.",
            footer="Degree and cardinality are easily swapped. Degree counts "
                   "COLUMNS and changes only when the design changes; "
                   "cardinality counts ROWS and changes constantly."),
        desc(
            "One property of a relation is worth emphasising because "
            "everyday use obscures it: a relation is a SET, so it has no "
            "inherent row order and no duplicate rows. A query result appears "
            "in some order only because the engine produced it that way, "
            "which is why relying on unordered results is a defect that works "
            "until the day the execution plan changes."
        ),
    ]),

    ("Keys", [
        desc(
            "Keys are how rows are identified and how tables are related, and "
            "the distinctions between them are examined directly."
        ),
        table(
            ["Key", "Means", "Note"],
            [["Candidate key", "Any minimal set of columns uniquely "
                               "identifying a row",
              "A table may have several"],
             ["Primary key", "The candidate key chosen as THE identifier",
              "Exactly one per table; never null"],
             ["Alternate key", "A candidate key not chosen as primary",
              "Still unique, still enforceable"],
             ["Foreign key", "A column referencing another table's primary "
                             "key",
              "How relationships are expressed"],
             ["Composite key", "A key made of more than one column",
              "What makes second normal form meaningful"],
             ["Surrogate key", "An artificial identifier with no business "
                               "meaning",
              "Stable, because business values change"]],
            caption="Six kinds of key, and what each is for.",
            footer="The last row is a real design decision. A natural key "
                   "carries meaning and can change -- people change names, "
                   "companies change registration numbers -- and a changing "
                   "primary key must be updated everywhere it is "
                   "referenced."),
        desc(
            "ENTITY INTEGRITY is the rule that a primary key may not be null: "
            "a row that cannot be identified cannot be referenced or updated "
            "reliably. REFERENTIAL INTEGRITY is the rule that a foreign key "
            "must either be null or match an existing primary key -- so a "
            "row cannot reference something that does not exist."
        ),
        desc(
            "Referential integrity raises a question the examination asks: "
            "what happens when the referenced row is deleted? The options are "
            "RESTRICT, refusing the deletion while references exist; CASCADE, "
            "deleting the referencing rows too; and SET NULL, leaving them "
            "orphaned but valid. Cascade is convenient and can delete far "
            "more than intended, which is why restrict is the safer default."
        ),
    ]),

    ("Integrity Constraints", [
        desc(
            "Beyond keys, a database enforces rules about what data is "
            "acceptable -- and enforcing them in the database rather than in "
            "each application is the point."
        ),
        ul([
            "DOMAIN constraints restrict a column to a type and a permitted "
            "range or set of values.",
            "NOT NULL requires a value, distinguishing 'unknown' from a "
            "legitimate blank.",
            "UNIQUE enforces that no two rows share a value, which is how an "
            "alternate key is declared.",
            "CHECK constraints express a rule about a row -- that an end date "
            "is not before a start date, say.",
            "TRIGGERS run code on insert, update or delete, expressing rules "
            "too complex for a constraint.",
        ]),
        desc(
            "The argument for putting constraints in the database is that "
            "there is usually more than one route to the data: several "
            "applications, an import job, a support engineer with a query "
            "tool. A rule enforced in one application is enforced on one "
            "route, and the data is only as consistent as the least careful "
            "path into it."
        ),
        desc(
            "The counter-argument the examination also expects is that "
            "constraints in the database are harder to change and harder to "
            "give good error messages for. The usual resolution is both: the "
            "application validates for the user's benefit, and the database "
            "enforces for the data's -- which is exactly the client-side "
            "validation argument from Human Interface, one layer down."
        ),
    ]),

    ("Schemas, Users and Access Control", [
        desc(
            "A database serves many applications and many people, and it "
            "controls what each may do."
        ),
        table(
            ["Concept", "Means"],
            [["Schema", "A named collection of tables and other objects"],
             ["View", "A stored query presented as if it were a table"],
             ["Privilege", "Permission to perform one operation on one "
                           "object"],
             ["Role", "A named set of privileges granted to users together"],
             ["Grant and revoke", "The statements that assign and withdraw "
                                  "them"]],
            caption="The vocabulary of database access control.",
            footer="A VIEW is the external schema of the three-schema "
                   "architecture made concrete: it presents one application's "
                   "slice, and it is also an access control tool, since a "
                   "user can be granted the view without the table beneath."),
        desc(
            "Views deserve that second use being stated explicitly, because "
            "it is examined. Granting access to a view that selects three "
            "columns of a ten-column table gives exactly those three, and "
            "granting a view with a WHERE clause gives exactly those rows -- "
            "which is how column-level and row-level restrictions are "
            "achieved without the base table ever being exposed."
        ),
    ]),

    ("Database Languages", [
        desc(
            "SQL is usually spoken of as one language and the syllabus "
            "divides it into three sublanguages by what each does. The "
            "examination asks which one a described statement belongs to."
        ),
        table(
            ["Sublanguage", "Defines or does", "Statements"],
            [["DDL -- data definition", "The structure itself",
              "CREATE, ALTER, DROP"],
             ["DML -- data manipulation", "The data within it",
              "SELECT, INSERT, UPDATE, DELETE"],
             ["DCL -- data control", "Who may do what",
              "GRANT, REVOKE"],
             ["TCL -- transaction control", "Transaction boundaries",
              "COMMIT, ROLLBACK, SAVEPOINT"]],
            caption="Four sublanguages, distinguished by what they act on.",
            footer="The discriminating question is what the statement "
                   "changes: the SHAPE of the database, the DATA in it, the "
                   "PERMISSIONS on it, or the boundaries of a unit of work."),
        desc(
            "One consequence catches people out and is worth knowing. DDL "
            "statements in many systems commit implicitly, so a CREATE or "
            "ALTER cannot be rolled back as part of a surrounding "
            "transaction -- which is why a migration mixing schema changes "
            "and data changes may leave half its work in place after a "
            "failure."
        ),
    ]),

    ("The Data Dictionary", [
        desc(
            "A database describes itself. The DATA DICTIONARY, or system "
            "catalogue, holds the metadata: which tables exist, their "
            "columns and types, the keys and constraints, the indexes, the "
            "views and the privileges."
        ),
        ul([
            "It is maintained by the system rather than by users, and it is "
            "updated as a side effect of every DDL statement.",
            "It is queryable in the same way as any other data, which is what "
            "lets tools discover a schema they were never told about.",
            "The query OPTIMISER reads it constantly -- table sizes, index "
            "availability and value distributions are what it plans "
            "against.",
            "It is where an auditor looks to establish what actually exists, "
            "as opposed to what the documentation claims.",
        ]),
        desc(
            "That third point explains a behaviour that otherwise looks like "
            "a fault. Statistics in the dictionary go stale as data changes, "
            "and a plan chosen against stale statistics can be badly wrong -- "
            "which is why a query that was fast for months can suddenly "
            "become slow with no change to the query or the data volume, and "
            "why refreshing statistics is routine maintenance."
        ),
    ]),

    ("Stored Procedures, Functions and Triggers", [
        desc(
            "Logic can live in the database as well as in applications, and "
            "the syllabus names the forms it takes."
        ),
        compare_grid(
            "CODE INSIDE THE DATABASE",
            "Each is called differently and the distinction is examined.",
            [("Stored procedure",
              "A named block of statements invoked explicitly. Runs close to "
              "the data, so it avoids round trips, and it is shared by every "
              "application that calls it."),
             ("Function",
              "Like a procedure but returning a value and usable inside an "
              "expression -- so it can appear in a SELECT list or a WHERE "
              "clause."),
             ("Trigger",
              "Code invoked AUTOMATICALLY by an insert, update or delete. "
              "Nobody calls it, which is its value for enforcing rules and "
              "its danger: an effect with no visible cause in the "
              "application."),
             ("The trade throughout",
              "Logic in the database is enforced on every route to the data "
              "and is harder to version, test and debug than application "
              "code. The usual resolution is integrity rules in the database "
              "and business process in the application.")]),
        desc(
            "Triggers deserve the specific warning. Because they fire "
            "invisibly, a chain of triggers -- one firing another -- produces "
            "behaviour that cannot be understood by reading the application "
            "at all, and a performance problem in one appears as a slow "
            "INSERT with no explanation. They are a legitimate tool used "
            "sparingly and a well-documented source of unmaintainable "
            "systems used freely."
        ),
    ]),

    ("Database Administration", [
        desc(
            "Somebody must own the database as a shared resource, and the "
            "syllabus distinguishes two roles that are often conflated."
        ),
        table(
            ["Role", "Responsible for", "Concerned with"],
            [["Data administrator", "The organisation's data as an asset",
              "What data means, who owns it, how it is governed"],
             ["Database administrator", "The database systems themselves",
              "Availability, performance, backup, security, upgrades"]],
            caption="Two roles, one strategic and one operational.",
            footer="The first is a governance role and may sit outside IT "
                   "entirely; the second is technical. A small organisation "
                   "combines them and a large one should not."),
        desc(
            "The database administrator's routine work maps directly onto "
            "earlier lessons: backup and recovery from the File Systems "
            "lesson, capacity planning and index tuning from System "
            "Evaluation, and access control from Security. What is specific "
            "here is that all of it applies to a resource many applications "
            "share, so a change made for one affects every other -- which is "
            "the middleware amplification argument again."
        ),
    ]),

    ("Choosing a Database", [
        desc(
            "The examination asks which kind of database suits a described "
            "requirement, and the criteria are consistent."
        ),
        ul([
            "What is the DATA like? Highly structured and relational, "
            "document-shaped, or a network of relationships?",
            "What are the ACCESS PATTERNS? Many small transactions, or few "
            "enormous analytical scans?",
            "What CONSISTENCY is required? Some domains cannot tolerate a "
            "stale read at all; others tolerate it happily.",
            "What SCALE, and in which direction -- more data, more "
            "concurrent users, or wider geographic distribution?",
            "What does the team already OPERATE competently? An unfamiliar "
            "system introduces operational risk that rarely appears in the "
            "comparison.",
        ]),
        desc(
            "The default answer for business data remains a relational "
            "database, and the examination expects the reason rather than the "
            "preference: decades of tooling, a standard query language, "
            "mature transactional guarantees, and a model that fits data "
            "which genuinely does decompose into entities and relationships. "
            "Alternatives are chosen where a specific one of those "
            "assumptions does not hold, which the Database Applications "
            "lesson treats."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where architecture items are lost."),
        ul([
            "Confusing logical with physical data independence. Adding an "
            "index needs only physical.",
            "Swapping degree and cardinality. Degree counts columns; "
            "cardinality counts rows.",
            "Assuming query results have a reliable order without one being "
            "requested.",
            "Treating a primary key as nullable. Entity integrity forbids "
            "it.",
            "Choosing a natural key that can change, and then having to "
            "update every reference.",
            "Using cascade delete without noticing how far it reaches.",
            "Enforcing rules only in one application when several routes into "
            "the data exist.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An index is added to a large table to speed up a frequently "
            "run query. No application code is changed. Which form of data "
            "independence does this rely on?\""
        ),
        ol([
            "Establish what changed. An index is a storage structure -- it "
            "affects how rows are found, not what data exists or what it "
            "means.",
            "So the INTERNAL schema changed and the conceptual schema did "
            "not.",
            "Insulating applications from a change to the internal schema is "
            "PHYSICAL data independence.",
            "Check the alternative: logical independence would be required "
            "had a table been split or a column added -- a change to the "
            "conceptual schema.",
        ]),
        desc(
            "The reason this item works is that both options sound "
            "plausible. The reliable discriminator is whether the change "
            "altered what the data MEANS or only how it is kept, and an index "
            "is the clearest case of the second -- which is precisely why it "
            "can be added to a running production system."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Database architecture rests on and supports several other "
             "lessons."),
        ul([
            "Indexes are B-trees, the balanced trees of the Data Structures "
            "lesson.",
            "Transactions and ACID come from the Middleware lesson and are "
            "developed in Transaction Processing.",
            "Views as an access control mechanism connect to the Security "
            "lessons.",
            "Data independence is the coupling argument of the Programming "
            "lesson applied to storage.",
            "Constraints in the database rather than the application repeat "
            "the client-side validation argument from Human Interface.",
            "The relational model's declarative query language is the "
            "fourth-generation language of Programming Languages.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("The three schema levels",
              "External, conceptual, internal",
              "One application's view, the whole logical design, and how it "
              "is physically stored."),
             ("Logical against physical independence",
              "Conceptual schema changed against internal schema changed",
              "Adding an index needs only physical; splitting a table needs "
              "logical."),
             ("Degree against cardinality",
              "Columns against rows",
              "Degree changes when the design changes; cardinality changes "
              "constantly."),
             ("Why the relational model displaced the others",
              "Relationships by value, not by pointer",
              "No navigation paths means the physical arrangement is the "
              "system's business, which is what allows a query optimiser."),
             ("Entity against referential integrity",
              "Primary key not null against foreign key must match",
              "One says a row must be identifiable; the other says a "
              "reference must point at something real."),
             ("A view as an access control",
              "Grant the view without the base table",
              "Selecting columns gives column-level restriction; a WHERE "
              "clause gives row-level.")]),
    ]),
]

_arch_quiz = [
    mcq("AVERAGE",
        "An index is added to a large table to improve query performance, and "
        "no application code changes.\n\n"
        "Which form of data independence does this depend on?",
        [("Logical data independence", False),
         ("Physical data independence", True),
         ("Referential integrity", False),
         ("External schema mapping", False)],
        "An index changes how rows are located -- the internal schema -- "
        "without altering what data exists or what it means. Insulating "
        "applications from internal schema changes is physical data "
        "independence, and it is precisely why an index can be added to a "
        "running system. Logical independence would be needed for a change to "
        "the conceptual schema, such as splitting a table or adding a "
        "column."),

    mcq("EASY",
        "In relational terminology, what do degree and cardinality count?",
        [("Degree counts rows; cardinality counts columns", False),
         ("Degree counts columns; cardinality counts rows", True),
         ("Degree counts keys; cardinality counts constraints", False),
         ("Degree counts tables; cardinality counts relationships", False)],
        "Degree is the number of attributes -- columns -- and is a property "
        "of the DESIGN, changing only when the schema changes. Cardinality is "
        "the number of tuples -- rows -- and is a property of the DATA, "
        "changing with every insert and delete. The two are easily swapped, "
        "and the distinction that keeps them apart is design against data."),

    mcq("AVERAGE",
        "What most fundamentally distinguishes the relational model from the "
        "hierarchical and network models?",
        [("It stores data on disk rather than in memory", False),
         ("Relationships are expressed by matching values rather than by "
          "pointers", True),
         ("It permits many-to-many relationships, which the others "
          "forbid", False),
         ("It requires every table to have a primary key", False)],
        "Expressing relationships by value rather than by navigable pointer "
        "means there is no physical path for a program to follow -- so a "
        "query can state WHAT is wanted and leave the system to choose how, "
        "which is what makes a query optimiser possible and delivers genuine "
        "physical data independence. The network model already permitted "
        "many-to-many relationships; what it lacked was this separation."),

    mcq("HARD",
        "Deleting a row that a foreign key references is attempted by an "
        "administrator.\n\n"
        "Which referential action is the safest default, and why?",
        [("CASCADE, because it keeps the database internally consistent "
          "automatically", False),
         ("RESTRICT, because it refuses the deletion while references "
          "exist", True),
         ("SET NULL, because it preserves the referencing rows unchanged",
          False),
         ("No action, because referential integrity applies only to "
          "inserts", False)],
        "RESTRICT refuses the deletion and forces a deliberate decision about "
        "the dependent rows. CASCADE does maintain consistency, and it does "
        "so by deleting everything that references the row -- which can reach "
        "far further than intended through chains of relationships, and does "
        "so silently. SET NULL preserves the rows while discarding the "
        "relationship, which is valid and quietly loses information."),

    mcq("AVERAGE",
        "Which statement about a relation in the formal relational model is "
        "correct?",
        [("Rows have a defined order that queries preserve", False),
         ("A relation is a set, so it has no row order and no duplicates",
          True),
         ("Columns must be ordered alphabetically by attribute name", False),
         ("A relation may contain duplicate rows if they have different "
          "keys", False)],
        "A relation is a SET of tuples, which means no inherent ordering and "
        "no duplicates. A query result appears in some order only because the "
        "engine happened to produce it that way, so code relying on unordered "
        "results works until the execution plan changes -- which it will, as "
        "the data grows or an index is added. Ordering must be requested "
        "explicitly."),

    mcq("AVERAGE",
        "Only three columns of a ten-column table should be visible to a "
        "user, and only the rows for their own department.\n\n"
        "Which mechanism achieves both restrictions?",
        [("Granting a privilege on the base table", False),
         ("Granting access to a view with those columns and a WHERE "
          "clause", True),
         ("Adding a CHECK constraint to the table", False),
         ("Creating an index on the department column", False)],
        "A view is a stored query presented as a table, so selecting three "
        "columns gives column-level restriction and a WHERE clause gives "
        "row-level restriction -- and granting the view without the base "
        "table means the underlying data is never exposed. This is the "
        "external schema of the three-schema architecture used as an access "
        "control. A CHECK constraint restricts what may be WRITTEN, not what "
        "may be read."),

    mcq("EASY",
        "Which rule does entity integrity state?",
        [("A foreign key must match an existing primary key value", False),
         ("A primary key may not contain a null value", True),
         ("Every table must contain at least one row", False),
         ("An attribute must belong to exactly one domain", False)],
        "Entity integrity requires that a primary key is never null, because "
        "a row that cannot be identified cannot be referenced or reliably "
        "updated. The first option states REFERENTIAL integrity, which "
        "governs foreign keys. Tables may legitimately be empty, and domain "
        "membership is a separate constraint category."),

    mcq("HARD",
        "The primary key of a customer table is the customer's email "
        "address.\n\n"
        "What is the principal risk?",
        [("Email addresses are too long to index efficiently", False),
         ("A customer changing address forces updates everywhere it is "
          "referenced", True),
         ("Email addresses are not guaranteed to be unique", False),
         ("Text primary keys violate entity integrity", False)],
        "A natural key carries business meaning and business meaning changes. "
        "When it does, every foreign key referencing it must be updated in "
        "step, and any external record of the old value becomes wrong. A "
        "surrogate key -- an artificial identifier with no meaning -- cannot "
        "change, which is why it is preferred for anything whose natural "
        "identifier is mutable. Length affects efficiency rather than "
        "correctness."),

    mcq("AVERAGE",
        "Why are integrity constraints generally enforced in the database "
        "rather than only in the application?",
        [("Database constraints produce clearer error messages for users",
          False),
         ("There is usually more than one route to the data", True),
         ("Application code cannot express range or uniqueness rules", False),
         ("Constraints in the database execute faster than application "
          "checks", False)],
        "Several applications, an import job and a support engineer with a "
        "query tool are all routes to the same data, and a rule enforced in "
        "one application applies only to that one -- so the data is only as "
        "consistent as the least careful path into it. Database constraints "
        "in fact produce WORSE error messages, which is why applications "
        "usually validate as well: the application for the user's benefit, "
        "the database for the data's."),

    mcq("HARD",
        "A column is added to a table, and existing applications that do not "
        "reference it continue to work unchanged.\n\n"
        "Which property is being relied upon?",
        [("Physical data independence", False),
         ("Logical data independence", True),
         ("Entity integrity", False),
         ("Domain constraint enforcement", False)],
        "Adding a column changes the CONCEPTUAL schema -- what the data is, "
        "rather than how it is stored -- and insulating applications from "
        "conceptual schema changes is logical data independence. Physical "
        "independence covers storage changes such as indexes and file "
        "reorganisation. The discriminating question throughout is whether "
        "the logical design altered or only its implementation."),
]

LESSON_DB_ARCH = lesson(
    MAJOR, MIDDLE,
    "Database Architecture, Models and the Three-Schema Approach",
    _arch_quiz,
    lesson_structure(
        "Database Architecture, Models and the Three-Schema Approach",
        "Data can be kept in files, and doing so stops working as soon as "
        "more than one program and more than one person are involved. This "
        "lesson covers what a database management system supplies instead: "
        "the three-schema architecture and the two kinds of data independence "
        "it delivers, the data models and why the relational one displaced "
        "the others by expressing relationships as values rather than "
        "pointers, the formal vocabulary the examination uses, the six kinds "
        "of key and the integrity rules that govern them, and the constraints "
        "and views that decide what is acceptable and who may see it.",
        [
            "State what a DBMS provides over file-based storage",
            "Describe the three schema levels and place a concern at the "
            "right one",
            "Distinguish logical from physical data independence",
            "Compare the data models and explain the relational model's "
            "advantage",
            "Use the formal relational terminology, including degree and "
            "cardinality",
            "Distinguish the kinds of key and apply entity and referential "
            "integrity",
            "Explain integrity constraints and why they belong in the "
            "database",
            "Use views for column-level and row-level access restriction",
        ],
        70,
        _arch_sections,
        [
            ("Data independence",
             "The insulation of applications from changes below them. Logical "
             "independence covers conceptual schema changes; physical "
             "independence covers storage changes."),
            ("External schema (view)",
             "One application's slice of the data. Also an access control "
             "mechanism, since a user may be granted the view without the "
             "base table."),
            ("Conceptual schema",
             "The whole logical design -- entities, attributes, "
             "relationships and constraints -- stated once for the "
             "organisation."),
            ("Internal schema",
             "How data is physically stored: files, indexes and layout."),
            ("Relational model",
             "Data as tables, with relationships expressed by matching values "
             "rather than pointers -- which is what allows a declarative "
             "query language and a query optimiser."),
            ("Relation",
             "A table, formally a SET of tuples: no inherent row order and no "
             "duplicates."),
            ("Degree and cardinality",
             "The number of columns and the number of rows. Degree is a "
             "property of the design; cardinality of the data."),
            ("Candidate key",
             "Any minimal set of columns uniquely identifying a row. A table "
             "may have several."),
            ("Primary key",
             "The candidate key chosen as the identifier. Exactly one per "
             "table, and never null."),
            ("Foreign key",
             "A column referencing another table's primary key. How "
             "relationships are expressed in the relational model."),
            ("Surrogate key",
             "An artificial identifier with no business meaning, preferred "
             "where the natural identifier can change."),
            ("Entity integrity",
             "A primary key may not be null, because an unidentifiable row "
             "cannot be referenced or reliably updated."),
            ("Referential integrity",
             "A foreign key must be null or match an existing primary key. "
             "Deletion is governed by RESTRICT, CASCADE or SET NULL."),
            ("View",
             "A stored query presented as a table. Delivers column-level and "
             "row-level restriction without exposing the base table."),
        ],
        "A database management system exists because file-based storage fails "
        "as soon as several programs and several people share data: each "
        "defines its own format, the same fact is stored twice and disagrees "
        "with itself, concurrent writes corrupt one another, and anyone with "
        "file access reads everything. The three-schema architecture answers "
        "the deepest of those problems by separating what each application "
        "sees, what the organisation's design says, and how the data is "
        "actually stored -- giving logical independence from conceptual "
        "changes and physical independence from storage ones, with the "
        "discriminating question always whether the meaning changed or only "
        "the implementation. The relational model displaced its predecessors "
        "by expressing relationships as matching VALUES rather than as "
        "pointers to follow, which removes the navigation path from the "
        "program and hands the physical arrangement entirely to the system -- "
        "the precondition for a declarative query language and an optimiser. "
        "A relation is formally a set, so it has no row order and no "
        "duplicates. Keys identify and relate: candidate keys are the "
        "possibilities, the primary key is the choice and may never be null, "
        "foreign keys carry the relationships, and a surrogate key is "
        "preferred wherever the natural one can change. And constraints "
        "belong in the database rather than in one application, because there "
        "is always more than one route to the data.",
        exam_notes=[
            desc(
                "Database architecture appears on Subject A as terminology "
                "and classification, and the data independence distinction "
                "recurs every sitting."
            ),
            ul([
                "Deciding whether a change needs logical or physical data "
                "independence.",
                "Distinguishing degree from cardinality.",
                "Naming the schema level a described concern belongs to.",
                "Distinguishing entity from referential integrity.",
                "Choosing a referential action for a deletion.",
                "Recognising a view as an access control mechanism.",
                "Identifying the risk in a natural primary key.",
            ]),
            desc(
                "For any data independence item, ask whether the change "
                "altered what the data MEANS or only how it is kept. An "
                "index, a file reorganisation and a hardware move are all the "
                "second; a new column or a split table is the first."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Database design
# ==========================================================================

_design_sections = [
    ("From Requirements to Tables", [
        desc(
            "Database design turns a description of a business into a set of "
            "tables, and it proceeds in stages so that each decision is made "
            "with the right information."
        ),
        table(
            ["Stage", "Produces", "Independent of"],
            [["Conceptual design", "An entity-relationship model of the "
                                   "business",
              "Any database product"],
             ["Logical design", "Tables, keys and constraints, normalised",
              "Any physical storage decision"],
             ["Physical design", "Indexes, storage layout, partitioning",
              "Nothing -- it is product-specific"]],
            caption="Three stages, each deciding less and committing more.",
            footer="The order matters. Deciding indexes before knowing the "
                   "tables, or tables before understanding the business, "
                   "produces a design that fits the first idea rather than "
                   "the requirement."),
        desc(
            "The examination's interest is mostly in the middle stage, "
            "because that is where the reasoning is checkable. A conceptual "
            "model can be argued about; a normalised table either satisfies a "
            "normal form or does not, and the question of which one is "
            "decidable from the data alone."
        ),
    ]),

    ("Entity-Relationship Modelling", [
        desc(
            "An E-R model describes a business as entities, the attributes "
            "that describe them, and the relationships between them. It is "
            "deliberately independent of any database product, which is what "
            "makes it a conversation with the business rather than with the "
            "system."
        ),
        table(
            ["Element", "Is", "Becomes, in the logical design"],
            [["Entity", "A thing the business keeps data about",
              "A table"],
             ["Attribute", "A property of an entity", "A column"],
             ["Identifier", "The attribute that distinguishes instances",
              "The primary key"],
             ["Relationship", "An association between entities",
              "A foreign key, or a new table"],
             ["Cardinality", "How many of one relate to how many of the "
                             "other",
              "Which side the foreign key goes on"]],
            caption="Five modelling elements and what each turns into.",
            footer="The last two rows are where the design work is. "
                   "Everything else translates mechanically."),
        desc(
            "CARDINALITY is examined constantly and decides the "
            "implementation. A ONE-TO-MANY relationship puts a foreign key on "
            "the MANY side, which is the ordinary case -- an order references "
            "its customer. A ONE-TO-ONE relationship can go on either side or "
            "be merged into one table. A MANY-TO-MANY relationship cannot be "
            "represented by a foreign key at all and requires a separate "
            "table."
        ),
        desc(
            "That third case is the one the examination presses on. A "
            "student may take many courses and a course may hold many "
            "students, so neither table can hold a foreign key to the other "
            "-- an ASSOCIATIVE or junction table holds pairs, with a "
            "composite key of both foreign keys. And once it exists, it is "
            "usually where attributes of the relationship itself belong: the "
            "enrolment date and grade describe neither the student nor the "
            "course, but the pairing."
        ),
    ]),

    ("Functional Dependency", [
        desc(
            "Normalisation is defined in terms of functional dependency, so "
            "the term has to come first. Attribute B is functionally "
            "dependent on A when each value of A determines exactly one value "
            "of B."
        ),
        desc(
            "Written A determines B. If you know the order number you know "
            "the order date, so the order number determines the order date. "
            "If you know the order number you do NOT know which product line "
            "-- there are several -- so it does not determine the product."
        ),
        content_accordion(
            "THREE KINDS OF DEPENDENCY",
            "Each normal form removes one of these, which is why the "
            "definitions are worth having before the forms.",
            [("Full functional dependency",
              "An attribute depends on the WHOLE key. Given a key of (order "
              "number, product code), the quantity ordered depends on both -- "
              "neither alone determines it."),
             ("Partial dependency",
              "An attribute depends on only PART of a composite key. With the "
              "same key, the product name depends on the product code alone, "
              "so it is partially dependent. Second normal form removes "
              "these."),
             ("Transitive dependency",
              "A non-key attribute determines another non-key attribute. If "
              "the customer number determines the customer's city, and the "
              "key is the order number, then the city depends on the key only "
              "THROUGH the customer number. Third normal form removes "
              "these.")]),
        desc(
            "Notice that partial dependency requires a COMPOSITE key -- there "
            "is no part of a single-column key for something to depend on. "
            "That is why a table in first normal form with a single-column "
            "key is automatically in second normal form, which the "
            "examination tests directly."
        ),
    ]),

    ("Normalisation", [
        desc(
            "Normalisation removes redundancy by decomposing tables, and each "
            "normal form removes one specific kind. It is the most reliably "
            "examined topic in this middle category."
        ),
        image(fig("normalisation-steps")),
        table(
            ["Form", "Requires", "Removes"],
            [["1NF", "Atomic values; no repeating groups",
              "Multiple values in one cell"],
             ["2NF", "1NF, and no partial dependencies",
              "Attributes depending on part of a composite key"],
             ["3NF", "2NF, and no transitive dependencies",
              "Non-key attributes determining other non-key attributes"],
             ["BCNF", "3NF, and every determinant is a candidate key",
              "The remaining anomalies 3NF permits"]],
            caption="Four forms, each requiring the previous one.",
            footer="Each form is defined in terms of the one before, so a "
                   "table cannot be in third normal form without being in "
                   "second -- which means identifying the HIGHEST form a "
                   "table satisfies means finding the first rule it breaks."),
        desc(
            "The reason to normalise is not tidiness but ANOMALIES. A table "
            "storing the customer's city alongside every order has three "
            "problems: updating the city means updating every order (update "
            "anomaly), a customer with no orders cannot be recorded at all "
            "(insertion anomaly), and deleting their last order loses their "
            "city (deletion anomaly). Each is a way for the data to become "
            "wrong or lost, and normalisation removes all three by storing "
            "each fact once."
        ),
    ]),

    ("Normalising a Table, Worked", [
        desc(
            "One example carried through all three forms, since the "
            "examination asks you to identify which form a given table "
            "satisfies."
        ),
        ol([
            "Start with an order table holding: order number, order date, "
            "customer number, customer city, product code, product name, "
            "quantity. Several products per order are listed in one row.",
            "NOT 1NF: multiple products in one row is a repeating group. Fix "
            "by giving each product its own row, making the key (order "
            "number, product code).",
            "NOT 2NF: order date and customer number depend on the order "
            "number alone, and product name depends on the product code "
            "alone -- both partial dependencies on a composite key. Fix by "
            "splitting into ORDERS (order number, date, customer number), "
            "PRODUCTS (product code, name) and ORDER LINES (order number, "
            "product code, quantity).",
            "NOT 3NF: in ORDERS, customer city depends on customer number, "
            "which is not a key -- a transitive dependency. Fix by moving "
            "city into a CUSTOMERS table.",
            "Result: four tables, each fact stored once, and all three "
            "anomalies gone.",
        ]),
        desc(
            "The procedure for an examination item is the reverse and takes "
            "about a minute. Check for repeating groups; if none, it is at "
            "least 1NF. Identify the key -- if it is a single column, 2NF is "
            "automatic. Look for a non-key attribute determined by another "
            "non-key attribute; if there is one, it stops at 2NF. The answer "
            "is the last form before the first rule it breaks."
        ),
    ]),

    ("When Not to Normalise", [
        desc(
            "Normalisation is the default and it is not free. The "
            "examination expects awareness of the cost as well as the "
            "benefit."
        ),
        compare_grid(
            "WHAT NORMALISATION TRADES",
            "The gain is on writes and the correctness of the data; the cost "
            "is on reads.",
            [("What it buys",
              "Each fact stored once, so it cannot disagree with itself. "
              "Updates touch one row. Insertion and deletion anomalies "
              "disappear. The design reflects the business rather than a "
              "particular query."),
             ("What it costs",
              "Data that belonged together is now spread across tables, so "
              "reassembling it means joins -- and a report drawing on six "
              "normalised tables is measurably slower than one reading a "
              "single wide row.")]),
        desc(
            "DENORMALISATION is the deliberate reintroduction of redundancy "
            "for read performance, and the word 'deliberate' is carrying the "
            "weight. It is a considered decision made after measuring, with "
            "the accepted consequence that the duplicated data must now be "
            "kept in step -- which is work that did not previously exist and "
            "which is where the anomalies return."
        ),
        desc(
            "The examination's position, and the sound engineering one, is to "
            "normalise first and denormalise only where a measured problem "
            "requires it. A design that was never normalised has the "
            "anomalies without having chosen them, and cannot say which "
            "redundancy is intentional."
        ),
    ]),

    ("Physical Design and Indexes", [
        desc(
            "Once the tables are settled, physical design decides how they "
            "are stored and accessed -- and this is where the Data "
            "Structures lesson reappears directly."
        ),
        ul([
            "An INDEX is a separate structure mapping a column's values to "
            "the rows holding them, so a query can find rows without scanning "
            "the table. Almost always a B-tree, which is the balanced tree "
            "of the Data Structures lesson generalised to many children per "
            "node.",
            "An index makes matching reads dramatically faster and makes "
            "every write SLOWER, because the index must be maintained too. A "
            "table with eight indexes pays that cost eight times on every "
            "insert.",
            "A COMPOSITE index covers several columns in a stated order, and "
            "it helps a query filtering on a leading subset of them -- an "
            "index on (surname, forename) helps a search by surname and does "
            "not help one by forename alone.",
            "The PRIMARY KEY is normally indexed automatically, since "
            "uniqueness must be checked on every insert anyway.",
        ]),
        desc(
            "The judgement is which columns to index, and it follows from "
            "the queries rather than from the schema. Columns used in WHERE "
            "clauses, join conditions and ORDER BY are candidates; columns "
            "with few distinct values are usually not, since an index "
            "selecting half the table saves nothing over reading it."
        ),
    ]),

    ("Extended E-R Concepts", [
        desc(
            "Beyond entities and simple relationships, the syllabus names "
            "several constructs that appear in real models and in "
            "examination diagrams."
        ),
        content_accordion(
            "FOUR CONSTRUCTS WORTH RECOGNISING",
            "Each names a situation the basic model handles awkwardly.",
            [("Weak entity",
              "An entity that cannot be identified without its parent -- an "
              "order LINE has no meaning apart from its order, and its key "
              "includes the order's. Deleting the parent necessarily deletes "
              "it, which is one of the few places CASCADE is clearly "
              "right."),
             ("Generalisation and specialisation",
              "A supertype with subtypes: an EMPLOYEE that may be a MANAGER "
              "or an ENGINEER, sharing common attributes and adding their "
              "own. Implemented as one table with nullable columns, a table "
              "per subtype, or a table for the supertype plus one per "
              "subtype -- each trading storage against join count."),
             ("Recursive relationship",
              "An entity related to itself -- an employee managing other "
              "employees, a part composed of other parts. Implemented as a "
              "foreign key referencing the same table's primary key."),
             ("Ternary relationship",
              "One genuinely involving three entities at once, such as a "
              "supplier providing a part for a project. It is not the same as "
              "three binary relationships, and decomposing it into them loses "
              "information about which combinations actually occur.")]),
        desc(
            "The recursive case is the one most often mishandled. A "
            "self-referencing foreign key is the correct implementation, and "
            "querying an arbitrary depth of it -- every employee under a "
            "manager, at any level -- needs a recursive query rather than a "
            "fixed number of joins, which is why organisation-chart questions "
            "are harder than they look."
        ),
    ]),

    ("Beyond Third Normal Form", [
        desc(
            "Third normal form is where practical design usually stops, and "
            "the syllabus names what lies beyond so that the boundary is "
            "understood rather than assumed."
        ),
        table(
            ["Form", "Requires", "Addresses"],
            [["BCNF", "Every determinant is a candidate key",
              "The anomalies 3NF still permits when candidate keys overlap"],
             ["4NF", "No multi-valued dependencies",
              "Two independent multi-valued facts in one table"],
             ["5NF", "No join dependencies",
              "Tables decomposable into three or more without loss"]],
            caption="Three further forms, in decreasing order of how often "
                    "they matter.",
            footer="Almost every table in 3NF is already in BCNF. The "
                   "difference arises only where a table has several "
                   "overlapping candidate keys, which is uncommon enough "
                   "that 3NF is the practical target."),
        desc(
            "The general point is more useful than the forms themselves. "
            "Normalisation is a sequence of increasingly strict conditions, "
            "each removing a rarer kind of redundancy at a rising cost in "
            "joins -- so the right stopping point is a judgement rather than "
            "a rule, and 3NF is where the benefit stops obviously exceeding "
            "the cost for typical business data."
        ),
    ]),

    ("Data Types and Domains", [
        desc(
            "Choosing a column's type is a design decision with consequences "
            "the examination touches, and several of them come straight from "
            "the Discrete Mathematics lesson."
        ),
        ul([
            "NUMERIC types divide into exact and approximate. Money must use "
            "an exact decimal type -- never a floating-point one -- for "
            "precisely the reason that lesson gave: one tenth has no finite "
            "binary representation.",
            "CHARACTER types choose between fixed and variable length. Fixed "
            "wastes space on short values and is marginally faster; variable "
            "is the usual choice, and both need a declared maximum that must "
            "accommodate the longest real value rather than the longest "
            "expected one.",
            "DATE and TIME types should be used rather than storing dates as "
            "text, because only then can the database compare, sort and "
            "arithmetic them correctly -- and only then does it reject 31 "
            "February.",
            "A TIME ZONE decision must be made explicitly. Storing local "
            "times without their zone makes durations across a daylight "
            "saving change uncomputable.",
        ]),
        desc(
            "NULL deserves its own note because it behaves unlike any value. "
            "It means UNKNOWN rather than empty or zero, so any comparison "
            "with it is neither true nor false but unknown -- which is why "
            "a WHERE clause testing equality against null matches nothing, "
            "including other nulls, and why a special IS NULL test exists at "
            "all."
        ),
    ]),

    ("Designing for Change", [
        desc(
            "A schema outlives the application built on it, frequently by "
            "years, so the design decisions that matter most are the ones "
            "that determine what can be changed later."
        ),
        compare_grid(
            "WHAT MAKES A SCHEMA CHANGEABLE",
            "The theme is the same as everywhere else in the certification: "
            "adding is cheap and removing is expensive.",
            [("Adding is usually safe",
              "A new nullable column, a new table, a new index. Existing "
              "queries continue to work because they do not mention it -- "
              "provided nothing does SELECT *, which breaks that guarantee "
              "immediately."),
             ("Changing and removing are not",
              "Renaming a column, narrowing a type, dropping a table. Every "
              "query, report, integration and stored procedure referencing it "
              "must be found first, and nothing in the database tells you who "
              "reads it.")]),
        desc(
            "MIGRATION is how a schema changes in a system that cannot stop, "
            "and the technique is worth knowing: add the new structure, write "
            "to both old and new, migrate the existing data, switch reads to "
            "the new, and only then remove the old. Each step is individually "
            "reversible, which is what makes the sequence safe -- and it is "
            "the same expand-and-contract shape as the format versioning in "
            "the Markup lesson."
        ),
    ]),

    ("Documenting a Design", [
        desc(
            "A schema is read far more often than it is designed, and what "
            "makes it readable is decided at design time."
        ),
        ul([
            "NAMES carry most of the documentation. A column called "
            "`status_code` needs an explanation somewhere; one called "
            "`payment_status` needs less; consistent naming across tables "
            "means a reader learns the convention once.",
            "The E-R DIAGRAM shows relationships that the table definitions "
            "state only as foreign keys, and it is what a newcomer reads "
            "first.",
            "The DATA DICTIONARY entry for each column -- its meaning, its "
            "permitted values, its source -- is what stops two people "
            "interpreting the same column differently.",
            "COMMENTS in the schema itself travel with it, unlike a document "
            "that will be separated from the database within a year.",
        ]),
        desc(
            "The recurring failure is documenting the structure and not the "
            "MEANING. That a column is a five-character string is visible "
            "from the definition; what its values signify, which system owns "
            "them and what happens when a new one appears is not -- and it is "
            "exactly what the next person needs."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where design items are lost."),
        ul([
            "Forgetting that a many-to-many relationship needs its own table.",
            "Putting the foreign key on the wrong side of a one-to-many "
            "relationship. It goes on the MANY side.",
            "Looking for partial dependencies in a table with a "
            "single-column key. There are none by definition.",
            "Confusing a transitive dependency with a partial one. Partial is "
            "on part of the KEY; transitive is through another NON-key "
            "attribute.",
            "Naming a normal form without checking the ones below it. The "
            "forms are cumulative.",
            "Denormalising before measuring, or without accepting the "
            "consistency work it creates.",
            "Adding indexes freely without noticing the write cost.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A table has the key (student number, course code) and the "
            "columns: student name, course title, grade. In which normal form "
            "is it, and why?\""
        ),
        ol([
            "Check 1NF. Every value is atomic and there are no repeating "
            "groups, so it is in first normal form.",
            "Check 2NF. The key is composite, so partial dependencies are "
            "possible. Student name depends on student number alone; course "
            "title depends on course code alone. Both are partial.",
            "So the table is in 1NF and NOT in 2NF.",
            "The answer is first normal form -- the highest form it "
            "satisfies.",
            "The fix, if asked: split into STUDENTS, COURSES and a junction "
            "table holding (student number, course code, grade), since the "
            "grade is the only attribute genuinely dependent on the whole "
            "key.",
        ]),
        desc(
            "Step four is where marks are lost. The question asks which form "
            "the table IS in, and candidates who spot the partial dependency "
            "sometimes answer 2NF -- naming the form it VIOLATES rather than "
            "the highest one it satisfies. Read which is being asked, because "
            "both appear among the options."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Design decisions here are felt across the certification."),
        ul([
            "Indexes are B-trees from Data Structures, and their write cost "
            "is the trade that lesson describes.",
            "E-R modelling reappears in Software Requirements Definition as a "
            "way of capturing a domain.",
            "Normalisation's anomalies are data quality problems in Business "
            "Analysis.",
            "Denormalisation for reads is the same trade as the data "
            "warehouse in Database Applications.",
            "The conceptual, logical and physical stages mirror the "
            "three-schema architecture of the previous lesson.",
            "Deciding indexes from the queries rather than the schema is "
            "capacity planning applied to storage.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What 1NF, 2NF and 3NF each remove",
              "Repeating groups, partial dependencies, transitive "
              "dependencies",
              "Cumulative: a table cannot be in 3NF without being in 2NF."),
             ("When 2NF is automatic",
              "When the key is a single column",
              "There is no part of a one-column key for anything to depend "
              "on partially."),
             ("Partial against transitive dependency",
              "On part of the KEY against through another NON-key attribute",
              "2NF removes the first, 3NF the second."),
             ("Implementing a many-to-many relationship",
              "A junction table with a composite key",
              "Neither side can hold a foreign key, and attributes of the "
              "relationship itself belong in the junction table."),
             ("The three anomalies",
              "Update, insertion, deletion",
              "Updating a fact in many rows, being unable to record "
              "something, and losing a fact when deleting a row about "
              "something else."),
             ("What an index costs",
              "Slower writes, on every insert and update",
              "So indexes follow from the queries, and a column with few "
              "distinct values is usually not worth one.")]),
    ]),
]

_design_quiz = [
    mcq("HARD",
        "A table has the composite key (student number, course code) and the "
        "columns student name, course title and grade.\n\n"
        "What is the highest normal form it satisfies?",
        [("First normal form", True),
         ("Second normal form", False),
         ("Third normal form", False),
         ("Boyce-Codd normal form", False)],
        "Values are atomic with no repeating groups, so it reaches 1NF. It "
        "fails 2NF because student name depends on student number alone and "
        "course title on course code alone -- both partial dependencies on a "
        "composite key. The trap is answering 2NF, which names the form it "
        "VIOLATES rather than the highest it satisfies, and the question asks "
        "the latter."),

    mcq("AVERAGE",
        "Students may enrol in many courses, and each course may hold "
        "many students.\n\nHow is this implemented relationally?",
        [("A foreign key in the student table referencing the course", False),
         ("A junction table holding pairs of student and course keys", True),
         ("A foreign key in the course table referencing the student", False),
         ("A single table containing both students and courses", False)],
        "Neither side can hold a foreign key, because a single column can "
        "reference only one row and each side relates to many. A junction "
        "table holds the pairs, with a composite key of both foreign keys -- "
        "and it is also where attributes of the RELATIONSHIP belong, such as "
        "the enrolment date and grade, which describe neither the student nor "
        "the course but the pairing."),

    mcq("AVERAGE",
        "In first normal form, a table has a single-column primary key.\n\n"
        "What follows about second normal form?",
        [("It cannot be in 2NF until the key is made composite", False),
         ("It is automatically in 2NF, since partial dependency is "
          "impossible", True),
         ("It is in 2NF only if it also has no transitive dependencies",
          False),
         ("2NF cannot be assessed without knowing the functional "
          "dependencies", False)],
        "A partial dependency is a dependency on PART of the key, and a "
        "single-column key has no proper part -- so no partial dependency can "
        "exist and 2NF follows from 1NF automatically. Transitive "
        "dependencies concern 3NF and may well be present. This is a "
        "shortcut worth having: identify the key first, because a "
        "single-column key eliminates one whole check."),

    mcq("AVERAGE",
        "An orders table stores each customer's city alongside every order. A "
        "customer moves, and the city must be changed in fifty rows.\n\n"
        "What is this called?",
        [("An insertion anomaly", False),
         ("An update anomaly", True),
         ("A deletion anomaly", False),
         ("A transitive constraint violation", False)],
        "An update anomaly is having to change the same fact in many places, "
        "with the risk that some are missed and the data then disagrees with "
        "itself. An insertion anomaly would be being unable to record a "
        "customer who has no orders; a deletion anomaly would be losing the "
        "city when their last order is deleted. All three arise from the same "
        "transitive dependency and all three are removed by the same "
        "decomposition."),

    mcq("EASY",
        "In a one-to-many relationship between customers and orders, where "
        "does the foreign key belong?",
        [("In the customer table, referencing the order", False),
         ("In the order table, referencing the customer", True),
         ("In a junction table referencing both", False),
         ("In either table, since the relationship is symmetrical", False)],
        "The foreign key goes on the MANY side: each order references one "
        "customer, which a single column can express. Putting it on the "
        "customer side would require one column to reference many orders, "
        "which is impossible. A junction table is needed only for "
        "many-to-many relationships, and the relationship here is not "
        "symmetrical."),

    mcq("HARD",
        "In a table keyed on order number, the customer's city depends on the "
        "customer number, which is itself a non-key column.\n\n"
        "Which normal form does this violate?",
        [("First normal form", False),
         ("Second normal form", False),
         ("Third normal form", True),
         ("It violates none of them", False)],
        "A non-key attribute determining another non-key attribute is a "
        "transitive dependency, which is exactly what third normal form "
        "forbids -- the city depends on the key only THROUGH the customer "
        "number. Second normal form concerns dependencies on part of a "
        "composite key, and the key here is a single column, so 2NF is "
        "automatically satisfied and cannot be the answer."),

    mcq("AVERAGE",
        "Indexes are added to eight columns of a heavily written table.\n\n"
        "What is the principal consequence?",
        [("Reads on unindexed columns become slower", False),
         ("Every insert and update must maintain eight index structures",
          True),
         ("The table can no longer enforce its primary key", False),
         ("Query results are returned in index order automatically", False)],
        "An index is a separate structure that must be kept in step with the "
        "table, so each one adds work to every insert, update and delete "
        "touching its column -- eight indexes means paying that eight times. "
        "This is why indexes follow from the queries actually run rather than "
        "being added to every column, and why a write-heavy table is indexed "
        "sparingly."),

    mcq("HARD",
        "A team denormalises a reporting table to improve read performance.\n\n"
        "What obligation does this create?",
        [("The table must be re-normalised before any schema change", False),
         ("The duplicated data must now be kept consistent deliberately",
          True),
         ("Referential integrity can no longer be enforced anywhere", False),
         ("All indexes on the table must be removed", False)],
        "Denormalisation reintroduces redundancy on purpose, which means the "
        "same fact now exists in more than one place and the anomalies "
        "normalisation removed come back -- so keeping the copies in step "
        "becomes ongoing work that did not previously exist. That cost is "
        "acceptable when it has been chosen after measuring; the failure is "
        "denormalising without accepting it, or never normalising and so "
        "having the anomalies without having chosen them."),

    mcq("AVERAGE",
        "Creating a composite index on (surname, forename) is proposed.\n\n"
        "Which query does it help?",
        [("A search by forename alone", False),
         ("A search by surname alone", True),
         ("A search by any column of the table", False),
         ("A search by forename combined with date of birth", False)],
        "A composite index is ordered by its columns in sequence, so it "
        "supports queries filtering on a LEADING subset -- surname alone, or "
        "surname and forename together. A search by forename alone cannot use "
        "it, because the index is sorted by surname first and the forenames "
        "are scattered throughout. This is why column order in a composite "
        "index is a design decision rather than an arbitrary one."),

    mcq("EASY",
        "Which stage of database design produces an entity-relationship model "
        "independent of any database product?",
        [("Conceptual design", True),
         ("Logical design", False),
         ("Physical design", False),
         ("Normalisation", False)],
        "Conceptual design describes the business in terms of entities, "
        "attributes and relationships, deliberately without reference to any "
        "product -- which is what makes it a conversation with the business "
        "rather than with the system. Logical design turns it into normalised "
        "tables and keys, and physical design decides indexes and storage, "
        "which is product-specific. Normalisation is an activity within "
        "logical design rather than a stage of its own."),
]

LESSON_DB_DESIGN = lesson(
    MAJOR, MIDDLE,
    "Database Design: E-R Modelling, Normalisation and Keys",
    _design_quiz,
    lesson_structure(
        "Database Design: E-R Modelling, Normalisation and Keys",
        "Database design turns a description of a business into a set of "
        "tables, and normalisation is the most reliably examined topic in "
        "this middle category -- examined by DOING it, so it is worked here "
        "on one example carried through every form. The lesson covers the "
        "three design stages, entity-relationship modelling and the "
        "cardinality that decides how each relationship is implemented, the "
        "functional dependencies the normal forms are defined in terms of, "
        "the anomalies that make normalisation worth doing, when "
        "denormalisation is a legitimate decision rather than an omission, "
        "and how indexes are chosen from the queries rather than the schema.",
        [
            "Distinguish conceptual, logical and physical design",
            "Build an E-R model and translate its elements into tables and "
            "keys",
            "Implement one-to-many and many-to-many relationships correctly",
            "Identify partial and transitive functional dependencies",
            "Determine the highest normal form a given table satisfies",
            "Explain the update, insertion and deletion anomalies",
            "Explain when denormalisation is justified and what it costs",
            "Choose indexes from the queries and state their write cost",
        ],
        80,
        _design_sections,
        [
            ("Conceptual design",
             "An entity-relationship model of the business, independent of "
             "any database product."),
            ("Entity, attribute, relationship",
             "A thing data is kept about, a property of it, and an "
             "association between things -- becoming tables, columns and "
             "foreign keys."),
            ("Cardinality of a relationship",
             "How many instances of one entity relate to how many of the "
             "other, which decides where the foreign key goes."),
            ("Junction (associative) table",
             "The table implementing a many-to-many relationship, with a "
             "composite key of both foreign keys, and the natural home for "
             "attributes of the relationship itself."),
            ("Functional dependency",
             "A determines B when each value of A fixes exactly one value of "
             "B."),
            ("Partial dependency",
             "An attribute depending on only part of a composite key. "
             "Impossible with a single-column key, and removed by 2NF."),
            ("Transitive dependency",
             "A non-key attribute determined by another non-key attribute, "
             "so it depends on the key only indirectly. Removed by 3NF."),
            ("First normal form",
             "Atomic values with no repeating groups."),
            ("Second normal form",
             "First normal form with no partial dependencies. Automatic when "
             "the key is a single column."),
            ("Third normal form",
             "Second normal form with no transitive dependencies."),
            ("Update anomaly",
             "Having to change one fact in many rows, with the risk that some "
             "are missed and the data disagrees with itself."),
            ("Insertion anomaly",
             "Being unable to record a fact because another, unrelated fact "
             "is not yet known."),
            ("Deletion anomaly",
             "Losing a fact as a side effect of deleting a row about "
             "something else."),
            ("Denormalisation",
             "Deliberately reintroducing redundancy for read performance, "
             "accepting the obligation to keep the copies consistent."),
            ("Index",
             "A structure mapping column values to rows, usually a B-tree. "
             "Speeds matching reads and slows every write."),
            ("Composite index",
             "An index over several columns in order, supporting queries "
             "that filter on a leading subset of them."),
        ],
        "Design proceeds from a product-independent conceptual model, through "
        "normalised tables and keys, to indexes and storage -- each stage "
        "deciding less and committing more. An E-R model's entities become "
        "tables and attributes become columns mechanically; the design work "
        "is in the relationships, where cardinality decides everything. A "
        "one-to-many relationship puts the foreign key on the MANY side, and "
        "a many-to-many one cannot use a foreign key at all and needs a "
        "junction table -- which is also where the relationship's own "
        "attributes belong. Normalisation is defined by functional "
        "dependency: first normal form demands atomic values, second removes "
        "attributes depending on part of a composite key, and third removes "
        "attributes determined by other non-key attributes. The forms are "
        "cumulative, so identifying the highest one a table satisfies means "
        "finding the first rule it breaks -- and a single-column key makes "
        "second normal form automatic, since there is no part of it to depend "
        "on. The purpose is not tidiness but the update, insertion and "
        "deletion anomalies, each a way for data to become wrong or lost. "
        "Denormalisation reverses this deliberately for read performance and "
        "brings the anomalies back as ongoing consistency work, which is "
        "acceptable when chosen after measurement and not otherwise. And "
        "indexes follow from the queries rather than the schema, because each "
        "one makes matching reads faster and every write slower.",
        exam_notes=[
            desc(
                "Normalisation is examined every sitting, almost always by "
                "presenting a table and asking which form it satisfies."
            ),
            ul([
                "Determining the highest normal form of a given table.",
                "Identifying a partial or transitive dependency.",
                "Implementing a many-to-many relationship.",
                "Placing the foreign key in a one-to-many relationship.",
                "Naming an anomaly from its description.",
                "Explaining what denormalisation costs.",
                "Reasoning about a composite index and column order.",
            ]),
            desc(
                "Identify the KEY before anything else. A single-column key "
                "eliminates the whole second-normal-form check, and knowing "
                "whether the key is composite is what makes the partial "
                "against transitive distinction decidable rather than a "
                "guess."
            ),
        ],
    ))

LESSONS = [LESSON_DB_ARCH, LESSON_DB_DESIGN]

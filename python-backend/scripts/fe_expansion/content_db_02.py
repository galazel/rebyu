"""Technology Element -> Database, lessons 3 and 4.

Syllabus minor categories 3 (data manipulation) and 4 (transaction
processing).

Both are examined by being read rather than recalled: a query and a result to
predict, or an interleaving of two transactions and an outcome to work out. So
the joins are shown against actual rows, and each concurrency anomaly is
traced as a specific sequence.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Technology Element"
MIDDLE = "Database"

# ==========================================================================
# Lesson 3: Data manipulation
# ==========================================================================

_sql_sections = [
    ("Saying What, Not How", [
        desc(
            "SQL is the fourth-generation language the Programming Languages "
            "lesson named. A query states which rows are wanted; it does not "
            "state how to find them, and the query optimiser decides that "
            "from the indexes and statistics available."
        ),
        desc(
            "This has a consequence worth carrying from the start: two "
            "queries that return identical results may perform completely "
            "differently, and the same query may perform differently next "
            "month as the data grows. Performance is a property of the query "
            "PLUS the data PLUS the available indexes, not of the query "
            "alone."
        ),
        table(
            ["You write", "The system decides"],
            [["Which tables to draw from", "In which order to read them"],
             ["Which rows qualify", "Whether to use an index or scan"],
             ["Which columns to return", "Whether to sort or use an ordered "
                                         "index"],
             ["How tables relate", "Which join algorithm to use"]],
            caption="The division of labour that makes SQL declarative.",
            footer="Everything in the right column can change without the "
                   "query changing, which is physical data independence in "
                   "daily operation rather than in principle."),
    ]),

    ("Relational Algebra", [
        desc(
            "SQL rests on relational algebra, a small set of operations on "
            "relations. The examination names them, and knowing them makes "
            "SQL's behaviour predictable rather than idiomatic."
        ),
        table(
            ["Operation", "Does", "SQL equivalent"],
            [["Selection", "Chooses ROWS satisfying a condition",
              "WHERE"],
             ["Projection", "Chooses COLUMNS", "The SELECT list"],
             ["Union", "All rows from either relation", "UNION"],
             ["Intersection", "Rows in both", "INTERSECT"],
             ["Difference", "Rows in the first and not the second", "EXCEPT"],
             ["Cartesian product", "Every row paired with every row",
              "A join with no condition"],
             ["Join", "Product then selection on a matching condition",
              "JOIN ... ON"]],
            caption="Seven operations, and where each appears in SQL.",
            footer="Selection and projection are the pair most often "
                   "confused, and the terminology is counter-intuitive: "
                   "SELECTION takes rows, and it is the WHERE clause rather "
                   "than the SELECT list."),
        desc(
            "The set operations require UNION COMPATIBILITY -- the same "
            "number of columns, in the same order, with compatible types. "
            "That constraint is why UNION is used for combining like with "
            "like, and why combining unlike things is a join instead."
        ),
        desc(
            "The Cartesian product is worth understanding as a hazard. "
            "Joining a thousand-row table to another thousand-row table with "
            "no matching condition produces a million rows, and the usual "
            "cause is a join condition omitted by accident -- which is why an "
            "unexpectedly enormous result set is nearly always a missing ON "
            "clause rather than unexpected data."
        ),
    ]),

    ("The Shape of a SELECT", [
        desc(
            "One statement does most of the work, and its clauses execute in "
            "an order that differs from the order they are written -- which "
            "explains several behaviours that otherwise look arbitrary."
        ),
        table(
            ["Written order", "Clause", "Executed"],
            [["1", "SELECT columns", "5th"],
             ["2", "FROM tables", "1st"],
             ["3", "WHERE row condition", "2nd"],
             ["4", "GROUP BY", "3rd"],
             ["5", "HAVING group condition", "4th"],
             ["6", "ORDER BY", "6th"]],
            caption="Written order against execution order.",
            footer="Because SELECT runs FIFTH, a column alias defined there "
                   "cannot be used in WHERE -- it does not exist yet. Because "
                   "ORDER BY runs LAST, an alias can be used there. That is "
                   "the whole explanation for a rule that otherwise seems "
                   "inconsistent."),
        desc(
            "WHERE and HAVING are the pair the examination presses on, and "
            "the execution order settles it. WHERE filters individual ROWS "
            "before any grouping happens; HAVING filters GROUPS after "
            "aggregation. So a condition on a raw column belongs in WHERE, "
            "and a condition on an aggregate -- a count, a sum -- can only "
            "be in HAVING, because the aggregate does not exist until "
            "grouping has occurred."
        ),
        desc(
            "That ordering also explains why filtering in WHERE is generally "
            "faster where both would work: rows removed before grouping are "
            "rows the grouping never has to process."
        ),
    ]),

    ("Joins", [
        desc(
            "A join combines rows from two tables on a matching condition, "
            "and which join is used decides which rows survive."
        ),
        image(fig("join-types")),
        table(
            ["Join", "Keeps", "Unmatched rows"],
            [["INNER", "Rows matching on both sides", "Discarded silently"],
             ["LEFT OUTER", "Every left row, plus matches",
              "Left kept with nulls on the right"],
             ["RIGHT OUTER", "Every right row, plus matches",
              "Right kept with nulls on the left"],
             ["FULL OUTER", "Every row from either side",
              "Both kept, with nulls opposite"],
             ["CROSS", "Every combination", "Not applicable -- no condition"]],
            caption="Five joins, distinguished by what they do with rows that "
                    "do not match.",
            footer="The word 'silently' in the first row is the point. An "
                   "inner join between customers and orders reports only "
                   "customers who have ordered, so a customer count from it "
                   "is wrong in a way nothing announces."),
        desc(
            "The examination's favourite item gives a report that undercounts "
            "and asks why. The answer is almost always an inner join where an "
            "outer was needed -- and the reasoning to apply is to ask which "
            "side is the POPULATION being reported on, then keep all of it."
        ),
        desc(
            "A SELF JOIN joins a table to itself, which is how a recursive "
            "relationship is queried: joining employees to employees on "
            "manager identity produces each employee beside their manager. It "
            "requires aliasing the table twice, since the two roles must be "
            "distinguishable."
        ),
    ]),

    ("Aggregation and Grouping", [
        desc(
            "Aggregate functions reduce many rows to one value, and GROUP BY "
            "decides which rows are reduced together."
        ),
        ul([
            "COUNT, SUM, AVG, MAX and MIN are the functions the syllabus "
            "names.",
            "GROUP BY partitions the rows, and one output row is produced per "
            "group.",
            "Every column in the SELECT list must either be grouped by or "
            "aggregated -- otherwise the system is being asked which of "
            "several values to show, and there is no answer.",
            "HAVING filters the resulting groups, using conditions on the "
            "aggregates.",
        ]),
        desc(
            "NULL handling in aggregates is examined and is genuinely "
            "surprising. Aggregate functions IGNORE nulls, so AVG over a "
            "column with nulls averages only the rows that have values -- it "
            "does not treat them as zero. And COUNT(*) counts rows while "
            "COUNT(column) counts non-null values in that column, so the two "
            "differ by exactly the number of nulls."
        ),
        desc(
            "That distinction is the most commonly examined null behaviour "
            "in the whole category, because both readings look reasonable "
            "and only one is right: an average that treated nulls as zero "
            "would be answering a different question, and the system declines "
            "to guess which was meant."
        ),
    ]),

    ("Subqueries", [
        desc(
            "A query may contain another query, and the syllabus distinguishes "
            "the forms by what the inner query returns and whether it depends "
            "on the outer one."
        ),
        content_accordion(
            "FOUR KINDS OF SUBQUERY",
            "Each is used differently and behaves differently.",
            [("Scalar subquery",
              "Returns a single value, usable anywhere a value is expected. "
              "Fails at run time if it returns more than one row, which is "
              "the standard defect: it worked on the test data and the "
              "production data had two matches."),
             ("Row-set subquery with IN",
              "Returns a column of values, tested against with IN or NOT IN. "
              "NOT IN has a genuine trap: if the inner query returns any "
              "null, NOT IN matches nothing at all, because a comparison with "
              "null is unknown rather than false."),
             ("EXISTS",
              "Tests whether the inner query returns any row at all, without "
              "caring what it contains. Often clearer and frequently faster "
              "than IN, since it can stop at the first match -- and it does "
              "not have the NOT IN null problem."),
             ("Correlated subquery",
              "References a column from the outer query, so it must be "
              "evaluated once per outer row. Expressive and potentially very "
              "slow, and usually rewritable as a join.")]),
        desc(
            "The NOT IN behaviour deserves the warning it gets. It is not a "
            "quirk but a consequence of null meaning UNKNOWN: asking whether "
            "a value is not among a set containing an unknown cannot be "
            "answered true, so the whole condition is unknown and no rows "
            "qualify. NOT EXISTS behaves as expected and is the safe "
            "alternative."
        ),
    ]),

    ("Modifying Data", [
        desc(
            "Three statements change data, and each has a hazard the "
            "examination knows about."
        ),
        table(
            ["Statement", "Does", "The hazard"],
            [["INSERT", "Adds rows",
              "Violating a constraint, or omitting a column with no default"],
             ["UPDATE", "Changes existing rows",
              "A missing WHERE clause updates EVERY row"],
             ["DELETE", "Removes rows",
              "A missing WHERE clause removes every row"]],
            caption="Three statements and the omission that makes each "
                    "catastrophic.",
            footer="The WHERE clause is optional in the syntax and mandatory "
                   "in practice. Running the equivalent SELECT first, and "
                   "checking the row count, is the habit that prevents the "
                   "whole class of accident."),
        desc(
            "DELETE and TRUNCATE are distinguished in the syllabus. DELETE "
            "removes rows one at a time, fires triggers, can be filtered by a "
            "WHERE clause and can be rolled back. TRUNCATE removes everything "
            "by deallocating storage, which is far faster and typically "
            "cannot be filtered, does not fire triggers and in many systems "
            "cannot be undone."
        ),
    ]),

    ("Set Operations in Practice", [
        desc(
            "UNION, INTERSECT and EXCEPT combine whole result sets rather "
            "than columns, and each has a behaviour worth knowing before it "
            "surprises you."
        ),
        table(
            ["Operation", "Returns", "Duplicates"],
            [["UNION", "Rows in either set", "Removed, which costs a sort"],
             ["UNION ALL", "Rows in either set", "Kept, and much faster"],
             ["INTERSECT", "Rows in both sets", "Removed"],
             ["EXCEPT", "Rows in the first and not the second", "Removed"]],
            caption="Four set operations and how each treats duplicates.",
            footer="UNION against UNION ALL is the performance item. UNION "
                   "must sort or hash the whole result to find duplicates, so "
                   "when duplicates are impossible -- combining this year's "
                   "orders with last year's, say -- UNION ALL does the same "
                   "job without that work."),
        desc(
            "EXCEPT answers 'what is in this set and missing from that one', "
            "which is the same question a LEFT JOIN with a null test answers. "
            "Both appear in examination options and both are correct; the set "
            "operation is usually the clearer expression, and the join is "
            "usually the one the optimiser plans better."
        ),
    ]),

    ("Views", [
        desc(
            "A view is a stored query given a name, and it behaves like a "
            "table to anything that reads it. The previous lesson introduced "
            "views as a security mechanism; here they matter as a "
            "manipulation tool."
        ),
        ul([
            "A view simplifies a complicated join so applications need not "
            "repeat it, and repeat it inconsistently.",
            "It provides logical data independence: the underlying tables can "
            "be restructured while the view continues to present the old "
            "shape.",
            "It restricts what a user sees, by column or by row, without "
            "granting access to the base table.",
            "A view is NOT normally stored data -- it is re-evaluated on "
            "every reference, so a view over an expensive query is expensive "
            "every time.",
        ]),
        desc(
            "UPDATABILITY is the examined subtlety. A simple view over one "
            "table can usually be written through, and the write reaches the "
            "base table. A view involving a join, an aggregate, a DISTINCT or "
            "a GROUP BY generally cannot, because there is no single "
            "unambiguous base row a change should land on. A MATERIALIZED "
            "view is the exception to the previous point: it does store its "
            "result, trading freshness for speed, and must be refreshed."
        ),
    ]),

    ("Null and Three-Valued Logic", [
        desc(
            "Null is not a value; it means 'unknown'. Every surprising null "
            "behaviour follows from that one sentence, so it is worth "
            "deriving them rather than memorising them."
        ),
        table(
            ["Expression", "Result", "Because"],
            [["null = null", "Unknown", "Two unknowns may or may not be "
                                        "equal"],
             ["null = 5", "Unknown", "The unknown might be 5"],
             ["x IS NULL", "True or false", "This tests presence, not value"],
             ["null + 10", "Null", "Arithmetic on an unknown is unknown"],
             ["'abc' || null", "Null", "Concatenation propagates it too"]],
            caption="Why comparison with null needs its own operator.",
            footer="WHERE keeps only rows where the condition is TRUE, so "
                   "unknown behaves like false there -- which is why "
                   "'WHERE x = null' silently returns nothing rather than "
                   "raising an error."),
        desc(
            "COALESCE substitutes a value for null, and is how a report "
            "avoids blank cells after an outer join. NULLIF does the "
            "opposite, converting a specific value to null -- most often to "
            "protect against division by zero."
        ),
    ]),

    ("Ordering and Limiting", [
        desc(
            "Result order is not guaranteed unless it is asked for, and "
            "assuming otherwise is a defect that hides until the data or the "
            "plan changes."
        ),
        ul([
            "ORDER BY takes columns, expressions or positions, ascending by "
            "default.",
            "Without ORDER BY, the order reflects whatever the plan happened "
            "to produce -- and may differ tomorrow with the same query and "
            "the same data.",
            "Nulls sort together at one end, and which end differs between "
            "systems, so an ordered report over a nullable column needs "
            "explicit handling.",
            "Row-limiting clauses return the first N rows, and are only "
            "meaningful together with ORDER BY -- 'the top ten' of an "
            "unordered set is ten arbitrary rows.",
        ]),
        desc(
            "That last point is the examinable one. A query limiting rows "
            "with no ordering is not returning the largest or the newest; it "
            "is returning whichever ten the plan produced first, which is a "
            "different thing that happens to look right in testing."
        ),
    ]),

    ("Reading an Unfamiliar Query", [
        desc(
            "Subject B presents queries longer than anything written from "
            "scratch here, and reading them methodically is a skill worth "
            "practising deliberately."
        ),
        ol([
            "Start at FROM and establish which tables are involved and how "
            "they are joined -- and note the join TYPE for each.",
            "Read WHERE, and work out roughly how much it removes.",
            "Look for GROUP BY. If it is present, the result has one row per "
            "group, not one per source row, which changes what everything "
            "afterwards means.",
            "Read HAVING as a filter on those groups.",
            "Read the SELECT list last, and check each column is either "
            "grouped or aggregated.",
            "Check ORDER BY and any row limit against what the question "
            "claims the query returns.",
        ]),
        desc(
            "Working in execution order rather than written order is what "
            "makes a long query tractable. The most common misreading is "
            "treating a grouped result as if it still had one row per source "
            "row, and reaching GROUP BY at step three rather than stumbling "
            "over it at the end prevents exactly that."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where SQL items are lost."),
        ul([
            "Confusing selection with projection. Selection takes ROWS and is "
            "the WHERE clause.",
            "Putting an aggregate condition in WHERE. It belongs in HAVING, "
            "because the aggregate does not exist yet.",
            "Using a SELECT alias in WHERE. SELECT runs after WHERE, so the "
            "alias does not exist.",
            "Using an inner join where the report needs every row of one "
            "side, which undercounts silently.",
            "Expecting AVG to treat nulls as zero. Aggregates ignore them "
            "entirely.",
            "Using NOT IN with a subquery that can return null, which matches "
            "nothing.",
            "Omitting a WHERE clause on UPDATE or DELETE.",
            "Assuming result order without ORDER BY.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A report counts customers and their orders. It joins CUSTOMERS "
            "to ORDERS with an inner join and reports 340 customers, while "
            "the customers table holds 500 rows. What has happened, and how "
            "is it fixed?\""
        ),
        ol([
            "Establish what an inner join does: it keeps only rows matching "
            "on BOTH sides.",
            "So a customer with no orders has nothing to match, and "
            "disappears from the result entirely.",
            "The 160 missing customers are therefore customers who have never "
            "ordered -- which is very likely exactly the group the report "
            "should be highlighting.",
            "The fix is a LEFT OUTER join from CUSTOMERS, keeping every "
            "customer and supplying nulls where there is no order.",
            "One further step: with an outer join, COUNT(order_id) rather "
            "than COUNT(*) must be used to count orders per customer, since "
            "COUNT(*) would count the null-filled row as one.",
        ]),
        desc(
            "Step five is what separates a complete answer. Switching to an "
            "outer join introduces nulls, and COUNT(*) counts rows while "
            "COUNT(column) counts non-null values -- so a customer with no "
            "orders would otherwise be reported as having one. The two "
            "corrections belong together."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("SQL is where several earlier ideas become concrete."),
        ul([
            "SQL as a declarative fourth-generation language comes from "
            "Programming Languages.",
            "Union, intersection and difference are the set operations of "
            "Discrete Mathematics.",
            "The optimiser choosing a plan is physical data independence in "
            "operation.",
            "Null as unknown is three-valued logic, extending the "
            "propositional logic of Discrete Mathematics.",
            "Building a query by concatenating strings is where SQL injection "
            "begins, in the Security lessons.",
            "Join performance depends on the indexes chosen in the previous "
            "lesson.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Selection against projection",
              "Rows against columns",
              "Selection is the WHERE clause despite the name; projection is "
              "the SELECT list."),
             ("WHERE against HAVING",
              "Rows before grouping against groups after it",
              "An aggregate condition can only be in HAVING, because the "
              "aggregate does not exist until grouping has happened."),
             ("Why an alias works in ORDER BY and not WHERE",
              "SELECT executes fifth, WHERE second",
              "The alias does not exist when WHERE runs, and does by the time "
              "ORDER BY does."),
             ("What an inner join loses",
              "Every row without a match, silently",
              "A report undercounting is nearly always this. Keep the whole "
              "population with an outer join."),
             ("COUNT(*) against COUNT(column)",
              "Rows against non-null values",
              "They differ by exactly the number of nulls, which matters "
              "immediately after switching to an outer join."),
             ("The NOT IN trap",
              "A null in the subquery makes it match nothing",
              "Because a comparison with unknown is unknown. NOT EXISTS "
              "behaves as expected.")]),
    ]),
]

_sql_quiz = [
    mcq("HARD",
        "A report joins CUSTOMERS to ORDERS with an inner join and returns "
        "340 rows, although CUSTOMERS holds 500.\n\n"
        "What is the most likely explanation?",
        [("The orders table is missing 160 rows", False),
         ("160 customers have no orders and are excluded by the inner "
          "join", True),
         ("The join condition matches on the wrong column", False),
         ("Duplicate customers have been collapsed by the join", False)],
        "An inner join keeps only rows matching on both sides, so a customer "
        "with no orders has nothing to match and disappears -- silently, "
        "which is what makes this defect survive review. A left outer join "
        "from CUSTOMERS keeps every customer with nulls where there is no "
        "order. Note that switching also requires COUNT(order_id) rather than "
        "COUNT(*), or the null-filled rows are counted as orders."),

    mcq("AVERAGE",
        "In a query using GROUP BY, where must a condition on an aggregate "
        "value be placed?",
        [("In the WHERE clause", False),
         ("In the HAVING clause", True),
         ("In the SELECT list", False),
         ("In the ORDER BY clause", False)],
        "WHERE executes before grouping and filters individual rows, so the "
        "aggregate does not exist when it runs. HAVING executes after "
        "aggregation and filters the resulting groups, which is the only "
        "point at which a count or sum can be tested. Conditions on raw "
        "columns should still go in WHERE, since rows removed before grouping "
        "are rows the grouping never processes."),

    mcq("AVERAGE",
        "In relational algebra, what does the SELECTION operation do?",
        [("Chooses which columns appear in the result", False),
         ("Chooses which rows satisfy a condition", True),
         ("Combines two relations with matching values", False),
         ("Removes duplicate rows from a result", False)],
        "Selection filters ROWS by a condition and corresponds to SQL's WHERE "
        "clause -- which is counter-intuitive, since SQL's keyword SELECT "
        "introduces the column list. Choosing columns is PROJECTION, and it "
        "corresponds to the SELECT list. This mismatch between the algebraic "
        "term and the SQL keyword is exactly why the examination asks about "
        "it."),

    mcq("HARD",
        "Of the 100 rows in a column, 30 are null. AVG is applied to "
        "the column.\n\nHow is the average computed?",
        [("The sum divided by 100, treating nulls as zero", False),
         ("The sum divided by 70, ignoring the nulls entirely", True),
         ("Null, because the column contains nulls", False),
         ("The sum divided by 30, using only the null rows", False)],
        "Aggregate functions ignore nulls, so AVG divides by the count of "
        "rows that actually have a value -- 70 here. Treating nulls as zero "
        "would answer a different question and the system declines to guess "
        "which was meant. The same principle explains COUNT(*) counting rows "
        "while COUNT(column) counts non-null values, the two differing by "
        "exactly the number of nulls."),

    mcq("HARD",
        "NOT IN is used with a subquery whose result set includes a "
        "null.\n\nWhat is returned?",
        [("All rows, since null matches nothing", False),
         ("No rows at all", True),
         ("The rows that do not match the non-null values", False),
         ("An error, since NOT IN rejects nulls", False)],
        "Null means UNKNOWN, so asking whether a value is not among a set "
        "containing an unknown cannot be answered true -- the condition "
        "evaluates to unknown for every row and none qualifies. It is a "
        "consequence of three-valued logic rather than a quirk, and it "
        "produces an empty result with no error at all. NOT EXISTS behaves as "
        "expected and is the safe alternative."),

    mcq("AVERAGE",
        "Why can a column alias defined in the SELECT list be used in ORDER "
        "BY but not in WHERE?",
        [("ORDER BY is evaluated before WHERE", False),
         ("SELECT executes after WHERE and before ORDER BY", True),
         ("WHERE cannot reference computed values of any kind", False),
         ("Aliases are only valid outside the query's main block", False)],
        "The clauses execute FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY "
        "-- so the alias is created at the fifth step. WHERE ran at the "
        "second, when the alias did not yet exist; ORDER BY runs at the "
        "sixth, when it does. That execution order explains a rule that "
        "otherwise looks inconsistent, and it also explains why WHERE is "
        "generally faster than HAVING for the same filter."),

    mcq("EASY",
        "Two tables of 1,000 rows each are joined with no join condition.\n\n"
        "How many rows does the result contain?",
        [("1,000", False),
         ("1,000,000", True),
         ("2,000", False),
         ("Zero, since no rows match", False)],
        "With no condition the operation is a Cartesian product: every row of "
        "one table paired with every row of the other, giving 1,000 x 1,000 = "
        "1,000,000 rows. In practice this is nearly always an accident -- a "
        "join condition omitted -- which is why an unexpectedly enormous "
        "result set should send you to look for a missing ON clause before "
        "anything else."),

    mcq("AVERAGE",
        "Which statement correctly distinguishes DELETE from TRUNCATE?",
        [("DELETE removes the table; TRUNCATE removes only its rows", False),
         ("DELETE can be filtered and rolled back; TRUNCATE generally "
          "cannot", True),
         ("DELETE is faster because it deallocates storage directly", False),
         ("TRUNCATE fires triggers while DELETE does not", False)],
        "DELETE removes rows individually, so it accepts a WHERE clause, "
        "fires triggers and can be rolled back. TRUNCATE deallocates the "
        "storage wholesale, which makes it far faster and typically means it "
        "cannot be filtered, does not fire triggers and in many systems "
        "cannot be undone -- so the speed comes at the cost of every "
        "safeguard DELETE offers."),

    mcq("HARD",
        "A subquery references a column from the outer query, so it is "
        "evaluated once for every outer row.\n\nWhat is this called, and what "
        "is the concern?",
        [("A scalar subquery, which fails if it returns several rows", False),
         ("A correlated subquery, which can be very slow on large "
          "results", True),
         ("A union subquery, which requires compatible column types", False),
         ("A recursive subquery, which may not terminate", False)],
        "A correlated subquery depends on the outer row, so it cannot be "
        "evaluated once and reused -- it runs per row, and on a large outer "
        "result that becomes very expensive. It is often rewritable as a "
        "join, which the optimiser can plan far better. A scalar subquery is "
        "one returning a single value, and its failure mode is returning more "
        "than one."),

    mcq("AVERAGE",
        "Which relational operation requires the two relations to have the "
        "same number of columns with compatible types?",
        [("Join", False),
         ("Union", True),
         ("Projection", False),
         ("Cartesian product", False)],
        "Union combines the rows of two relations into one result, so the "
        "rows must have the same shape -- the same number of columns, in the "
        "same order, with compatible types. This is union compatibility, and "
        "it applies to intersection and difference too. A join deliberately "
        "combines relations of DIFFERENT shapes, which is exactly why it "
        "exists alongside union."),
]

LESSON_DB_SQL = lesson(
    MAJOR, MIDDLE,
    "Data Manipulation: Relational Algebra and SQL",
    _sql_quiz,
    lesson_structure(
        "Data Manipulation: Relational Algebra and SQL",
        "SQL states which rows are wanted and leaves the system to decide how "
        "to find them, which is what makes it declarative and what makes "
        "performance a property of the query plus the data plus the indexes "
        "rather than of the query alone. This lesson covers the relational "
        "algebra underneath, the clause execution order that explains several "
        "otherwise arbitrary rules, the joins and which rows each one "
        "silently discards, aggregation and the null handling that surprises "
        "everyone, the subquery forms including the NOT IN trap, and the "
        "modification statements whose optional WHERE clause is optional only "
        "in the syntax.",
        [
            "Explain why SQL is declarative and what follows for performance",
            "Name the relational algebra operations and their SQL "
            "equivalents",
            "State the clause execution order and explain what it determines",
            "Distinguish WHERE from HAVING and place a condition correctly",
            "Choose the right join and diagnose a report that undercounts",
            "Apply aggregate functions and predict their null behaviour",
            "Distinguish the subquery forms and avoid the NOT IN null trap",
            "Distinguish DELETE from TRUNCATE",
        ],
        75,
        _sql_sections,
        [
            ("Selection",
             "The relational operation choosing ROWS by a condition. "
             "Corresponds to SQL's WHERE clause, despite the name."),
            ("Projection",
             "The relational operation choosing COLUMNS. Corresponds to the "
             "SELECT list."),
            ("Union compatibility",
             "The requirement that relations combined by union, intersection "
             "or difference have the same number of columns with compatible "
             "types."),
            ("Cartesian product",
             "Every row of one relation paired with every row of another. "
             "Nearly always an accident, caused by an omitted join "
             "condition."),
            ("Clause execution order",
             "FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY -- which is why "
             "a SELECT alias works in ORDER BY and not in WHERE."),
            ("HAVING",
             "Filters GROUPS after aggregation, and is the only place a "
             "condition on an aggregate can go."),
            ("Inner join",
             "Keeps only rows matching on both sides, discarding unmatched "
             "rows silently. The usual cause of a report that undercounts."),
            ("Outer join",
             "Keeps every row of one side or both, supplying nulls where "
             "there is no match."),
            ("Self join",
             "A table joined to itself, with aliases distinguishing the two "
             "roles. How a recursive relationship is queried."),
            ("Aggregate null handling",
             "Aggregate functions ignore nulls rather than treating them as "
             "zero, and COUNT(*) counts rows while COUNT(column) counts "
             "non-null values."),
            ("Correlated subquery",
             "A subquery referencing the outer query, so it is evaluated once "
             "per outer row. Expressive and potentially very slow."),
            ("The NOT IN trap",
             "A NOT IN whose subquery returns any null matches no rows at "
             "all, because a comparison with unknown is unknown. NOT EXISTS "
             "is the safe alternative."),
            ("TRUNCATE",
             "Removes all rows by deallocating storage. Far faster than "
             "DELETE, and typically unfilterable, trigger-free and "
             "irreversible."),
        ],
        "SQL says what is wanted and leaves how to the optimiser, so two "
        "queries returning identical results can perform completely "
        "differently and the same query can change behaviour as the data "
        "grows. Underneath sits relational algebra, where selection takes "
        "rows -- the WHERE clause, despite the name -- and projection takes "
        "columns. The clauses execute FROM, WHERE, GROUP BY, HAVING, SELECT, "
        "ORDER BY, and that single fact explains why an alias works in ORDER "
        "BY and not WHERE, why an aggregate condition can only be in HAVING, "
        "and why filtering early is faster. Joins decide which rows survive, "
        "and an inner join discards unmatched rows SILENTLY -- which is why a "
        "report that undercounts is nearly always an inner join where the "
        "whole population was needed. Aggregates ignore nulls rather than "
        "treating them as zero, so COUNT(*) and COUNT(column) differ by "
        "exactly the number of nulls, which matters immediately after "
        "switching to an outer join. Subqueries divide by what they return "
        "and whether they depend on the outer query, with NOT IN carrying a "
        "genuine trap: a single null in its result set makes it match nothing "
        "at all, because unknown is not false. And on the modification side, "
        "the WHERE clause is optional in the syntax and mandatory in "
        "practice.",
        exam_notes=[
            desc(
                "SQL items are read rather than recalled: a query and a "
                "result to predict, or a described symptom to diagnose."
            ),
            ul([
                "Diagnosing a report that returns fewer rows than expected.",
                "Placing a condition in WHERE or HAVING.",
                "Predicting an aggregate's behaviour with nulls.",
                "Identifying selection against projection.",
                "Predicting the size of a Cartesian product.",
                "Explaining the NOT IN null behaviour.",
                "Distinguishing DELETE from TRUNCATE.",
            ]),
            desc(
                "When a query returns the wrong NUMBER of rows, check the "
                "join type first and the null handling second. Between them "
                "they account for most of the items in this category, and "
                "both fail silently rather than raising an error."
            ),
        ],
    ))

# ==========================================================================
# Lesson 4: Transaction processing
# ==========================================================================

_txn_sections = [
    ("Why Transactions Exist", [
        desc(
            "A single business operation frequently requires several database "
            "changes, and any of them can fail. A transaction is the "
            "mechanism that makes a group of changes behave as one -- either "
            "all of them happen, or none does."
        ),
        image(fig("transaction-states")),
        desc(
            "The Middleware lesson introduced ACID; this lesson is about how "
            "a database actually delivers it, because the mechanisms are "
            "examined directly and each solves a specific problem."
        ),
        table(
            ["Property", "Delivered by", "Against"],
            [["Atomicity", "The log, and rollback",
              "A failure part-way through"],
             ["Consistency", "Constraints and the application's own rules",
              "Invalid states"],
             ["Isolation", "Locking or multiversion concurrency control",
              "Other transactions running at the same time"],
             ["Durability", "Write-ahead logging to persistent storage",
              "A crash after commit"]],
            caption="Four properties, four mechanisms, four distinct "
                    "threats.",
            footer="Notice that isolation and durability defend against "
                   "completely different things -- concurrency and failure -- "
                   "which is why a system can be strong at one and weak at "
                   "the other."),
    ]),

    ("Commit and Rollback", [
        desc(
            "A transaction ends in one of two ways, and the boundary is "
            "explicit rather than incidental."
        ),
        ul([
            "COMMIT makes every change permanent and visible to other "
            "transactions. It does not return until the log has reached "
            "persistent storage, which is why a commit is slower than the "
            "writes it confirms -- and is exactly what durability means.",
            "ROLLBACK abandons every change since the transaction began, "
            "leaving the database as if it had never started.",
            "A SAVEPOINT marks a position within a transaction that can be "
            "rolled back to without abandoning the whole thing.",
            "A transaction that is neither committed nor rolled back holds "
            "its locks indefinitely, which is how one careless session blocks "
            "an application.",
        ]),
        desc(
            "That last point is worth stating as an operational warning. An "
            "open transaction left by a query tool or a crashed application "
            "continues to hold every lock it acquired, and the symptom is "
            "unrelated work timing out -- so a database that appears "
            "mysteriously blocked is very often waiting on one forgotten "
            "session."
        ),
    ]),

    ("What Goes Wrong Without Isolation", [
        desc(
            "If transactions run concurrently with no control, specific and "
            "well-named things go wrong. The examination describes a sequence "
            "and asks for the name."
        ),
        image(fig("concurrency-anomalies")),
        content_accordion(
            "THE FOUR ANOMALIES",
            "Each is a specific interleaving, and each is traced here as a "
            "sequence rather than defined abstractly.",
            [("Lost update",
              "T1 reads a balance of 100. T2 reads 100. T1 writes 150 and "
              "commits. T2 writes 120 and commits. T1's update has vanished "
              "with nothing having failed -- the same race condition the "
              "Operating Systems lesson described, at database scale."),
             ("Dirty read",
              "T1 updates a row and has not committed. T2 reads the new "
              "value. T1 then rolls back. T2 has read and acted on a value "
              "that never officially existed."),
             ("Non-repeatable read",
              "T2 reads a row. T1 updates that row and commits. T2 reads the "
              "same row again within the same transaction and gets a "
              "different value -- so a report summing a column twice "
              "disagrees with itself."),
             ("Phantom read",
              "T2 runs a query returning ten rows. T1 inserts an eleventh "
              "matching row and commits. T2 runs the same query again and "
              "gets eleven. The rows it already read are unchanged; new ones "
              "have APPEARED, which is why it needs a separate name.")]),
        desc(
            "The distinction between non-repeatable and phantom reads is the "
            "one the examination tests. A non-repeatable read is an existing "
            "row CHANGING; a phantom read is a new row APPEARING. They "
            "require different prevention -- locking the rows you read stops "
            "the first and cannot stop the second, since the new row was not "
            "there to lock."
        ),
    ]),

    ("Isolation Levels", [
        desc(
            "Preventing every anomaly costs concurrency, so databases offer a "
            "choice. The levels are named for which anomalies they still "
            "permit."
        ),
        table(
            ["Level", "Dirty read", "Non-repeatable read", "Phantom read"],
            [["Read uncommitted", "Possible", "Possible", "Possible"],
             ["Read committed", "Prevented", "Possible", "Possible"],
             ["Repeatable read", "Prevented", "Prevented", "Possible"],
             ["Serializable", "Prevented", "Prevented", "Prevented"]],
            caption="Four levels, each preventing one more anomaly than the "
                    "last.",
            footer="Read the table as a ladder of cost. Higher isolation "
                   "means fewer anomalies and less concurrency, so the "
                   "correct level is a throughput decision informed by what "
                   "the application can actually tolerate."),
        desc(
            "SERIALIZABLE is the strongest and means the result is as if the "
            "transactions had run one after another, in some order. It is the "
            "only level that is unconditionally correct, and it is not the "
            "default anywhere, because the concurrency it costs is "
            "substantial and most applications genuinely tolerate less."
        ),
        desc(
            "The examination asks which level is required to prevent a "
            "described anomaly, and the table answers it directly -- but the "
            "reasoning worth carrying is that choosing a level is choosing "
            "which incorrect results you are willing to accept in exchange "
            "for throughput. Stated that way it becomes a decision somebody "
            "should make deliberately rather than inherit from a default."
        ),
    ]),

    ("Locking", [
        desc(
            "The classic mechanism for isolation is locking: a transaction "
            "acquires a lock before touching data and holds it until it "
            "finishes."
        ),
        table(
            ["", "Shared (read) lock", "Exclusive (write) lock"],
            [["Held for", "Reading", "Writing"],
             ["Others may read", "Yes", "No"],
             ["Others may write", "No", "No"],
             ["Compatible with", "Other shared locks", "Nothing"]],
            caption="Two lock modes and what each permits.",
            footer="Several transactions may read the same data "
                   "simultaneously; a writer excludes everyone. That is the "
                   "whole compatibility rule, and every locking behaviour "
                   "follows from it."),
        desc(
            "GRANULARITY is the second decision. A lock may cover a row, a "
            "page, a table or the whole database, and the trade is exact: "
            "fine granularity permits more concurrency and costs more "
            "bookkeeping, because thousands of row locks must each be "
            "tracked. Systems therefore ESCALATE -- converting many row locks "
            "into one table lock when a transaction touches enough of it, "
            "which suddenly blocks everybody and is a classic cause of a "
            "system that degrades sharply under load."
        ),
        desc(
            "TWO-PHASE LOCKING is the protocol that makes locking produce "
            "serialisable results. A transaction acquires locks in a growing "
            "phase and releases them in a shrinking phase, and once it has "
            "released any lock it may acquire no more. Holding every lock "
            "until commit -- strict two-phase locking -- is what also "
            "prevents dirty reads of uncommitted data."
        ),
    ]),

    ("Deadlock in a Database", [
        desc(
            "Locking creates the same hazard the Operating Systems lesson "
            "described, and databases handle it differently from operating "
            "systems."
        ),
        image(fig("deadlock-db")),
        desc(
            "Two transactions acquiring the same two resources in opposite "
            "orders will eventually block each other permanently. Because a "
            "database cannot know in advance what a transaction will need, "
            "prevention by avoidance is impractical -- so databases DETECT "
            "deadlock instead, by looking for a cycle in the wait-for graph, "
            "and break it by rolling one transaction back as the victim."
        ),
        desc(
            "That has a consequence applications must handle: a transaction "
            "can fail through no fault of its own, having been chosen as a "
            "deadlock victim. The correct response is to retry it, and code "
            "that treats every failure as fatal will surface deadlocks to "
            "users as errors that would have succeeded on a second attempt."
        ),
        desc(
            "The cheap prevention is the same as in the operating system "
            "case: acquire locks in a CONSISTENT ORDER across the "
            "application. Deadlock needs a cycle, a consistent order makes a "
            "cycle impossible, and it costs nothing at run time -- which is "
            "why it is a design rule rather than a tuning option."
        ),
    ]),

    ("Recovery", [
        desc(
            "A database must survive a crash without losing committed work or "
            "retaining uncommitted work, and the mechanism is the log."
        ),
        image(fig("db-recovery")),
        desc(
            "WRITE-AHEAD LOGGING is the rule that makes recovery possible: "
            "the log record describing a change reaches persistent storage "
            "BEFORE the changed data does. So after a crash, the log always "
            "contains at least as much as the data files -- and never less, "
            "which would leave a change with no record of it."
        ),
        ol([
            "On restart, scan the log from the last checkpoint.",
            "REDO every change belonging to a transaction that committed, "
            "since its data may not have reached the data files.",
            "UNDO every change belonging to a transaction that did not "
            "commit, since its data may have reached them.",
            "The database is then exactly as it was at the moment of the last "
            "commit.",
        ]),
        desc(
            "A CHECKPOINT bounds that work. It periodically writes dirty "
            "pages out and records the position, so recovery need only scan "
            "from the checkpoint rather than from the beginning of time -- "
            "which is what keeps restart time bounded regardless of how long "
            "the database has been running."
        ),
        desc(
            "The syllabus distinguishes recovery from BACKUP, and the "
            "distinction matters. Logging and checkpointing recover from a "
            "CRASH using data that is still present; a backup recovers from "
            "the media being lost or the data being wrong, which no amount of "
            "logging addresses. ROLL-FORWARD recovery combines them: restore "
            "the backup, then apply the logs since it was taken."
        ),
    ]),

    ("Multiversion Concurrency Control", [
        desc(
            "Locking is not the only way to isolate transactions, and the "
            "alternative most widely deployed today is worth knowing because "
            "it changes what readers experience."
        ),
        desc(
            "Under MULTIVERSION CONCURRENCY CONTROL the system keeps several "
            "versions of a row. A reader is shown the version that was "
            "current when its transaction began, so it never sees another "
            "transaction's uncommitted work and never has to wait for one. "
            "The slogan is that READERS DO NOT BLOCK WRITERS AND WRITERS DO "
            "NOT BLOCK READERS, and it is the reason a system using it "
            "sustains far more concurrent reporting than a purely locking "
            "one."
        ),
        compare_grid(
            "TWO APPROACHES TO ISOLATION",
            "Both deliver the same guarantees by different means.",
            [("Locking",
              ["A reader waits for a writer to finish",
               "Storage holds one version of each row",
               "Contention appears as waiting",
               "Deadlock is the characteristic failure"]),
             ("Multiversion",
              ["A reader sees an older version and proceeds",
               "Old versions accumulate and must be cleaned up",
               "Contention appears as version churn and storage growth",
               "Write conflicts at commit are the characteristic failure"])]),
        desc(
            "Neither is free. Multiversion control moves the cost from "
            "waiting to storage and cleanup: the old versions must be "
            "removed once no transaction can still need them, and a "
            "long-running transaction holds that cleanup back for everyone -- "
            "so a reporting query left open for hours can bloat a database "
            "that has nothing wrong with it."
        ),
    ]),

    ("Optimistic and Pessimistic Control", [
        desc(
            "Underneath both mechanisms lies a single assumption about how "
            "often transactions actually conflict, and the syllabus names the "
            "two positions."
        ),
        table(
            ["", "Pessimistic", "Optimistic"],
            [["Assumes", "Conflict is likely", "Conflict is rare"],
             ["Acts", "Lock before touching data",
              "Proceed, and check before committing"],
             ["Cost when right", "Lock overhead on every access",
              "Almost nothing"],
             ["Cost when wrong", "Waiting and deadlock",
              "Work discarded and redone"],
             ["Suits", "Heavy contention on the same rows",
              "Mostly disjoint work, and long think times"]],
            caption="The same problem, approached from opposite "
                    "expectations.",
            footer="Neither is correct in general. The right choice follows "
                   "from measured contention, which is why this is a tuning "
                   "decision rather than a design principle."),
        desc(
            "The optimistic approach is what an application implements as a "
            "VERSION NUMBER on a row: read the row with its version, and on "
            "update require that the version still matches. If it does not, "
            "somebody else changed the row in the meantime and the update is "
            "rejected rather than silently overwriting -- which is precisely "
            "the lost update anomaly, prevented without holding a lock across "
            "a user's thinking time."
        ),
    ]),

    ("Transactions Across Systems", [
        desc(
            "When one operation must change data in two databases, a single "
            "database's commit is not enough, and the Middleware lesson's "
            "two-phase commit is what fills the gap."
        ),
        image(fig("distributed-db")),
        ol([
            "A coordinator asks every participant whether it can commit.",
            "Each participant does the work, secures it, and answers prepared "
            "or refuses.",
            "If all answered prepared, the coordinator instructs everyone to "
            "commit.",
            "If any refused, the coordinator instructs everyone to roll "
            "back.",
        ]),
        desc(
            "The weakness is examined directly. Between answering 'prepared' "
            "and receiving the decision, a participant is BLOCKED -- it holds "
            "its locks and cannot decide alone, because committing when "
            "another refused would break atomicity. If the coordinator fails "
            "in that window, the participant waits, and this is why "
            "distributed transactions are avoided in designs that can "
            "tolerate anything looser."
        ),
        desc(
            "The looser alternative the syllabus mentions is EVENTUAL "
            "CONSISTENCY: each system commits locally and the systems "
            "reconcile afterwards, accepting a period during which they "
            "disagree. It removes the blocking problem entirely and hands the "
            "application the work of coping with temporary disagreement, "
            "which is a trade rather than an improvement."
        ),
    ]),

    ("Designing Transactions in an Application", [
        desc(
            "Most transaction problems in real systems are design problems "
            "rather than database problems, and the rules are short."
        ),
        ul([
            "Keep transactions SHORT. Every lock is held until commit, so "
            "duration is contention.",
            "Never wait for a human inside a transaction. A form on screen "
            "with an open transaction behind it holds locks for as long as "
            "somebody stares at it.",
            "Do external work -- calling a service, sending a message -- "
            "outside the transaction where possible, since it cannot be "
            "rolled back and it lengthens the transaction unpredictably.",
            "Acquire locks in a consistent order everywhere, which makes "
            "deadlock impossible rather than merely rare.",
            "Expect and retry deadlock victims and serialisation failures.",
            "Choose the isolation level deliberately, per transaction where "
            "the system allows it, rather than inheriting a default.",
        ]),
        desc(
            "The second rule is the one violated most often, and it converts "
            "a database sized for its workload into one that appears to be "
            "failing under trivial load -- because the limiting resource has "
            "quietly become how long users take to fill in forms."
        ),
    ]),

    ("Diagnosing Contention", [
        desc(
            "When an application slows under load, distinguishing the "
            "possible causes is what makes the fix targeted rather than "
            "speculative."
        ),
        content_tabs(
            "THREE SYMPTOMS, THREE CAUSES",
            "What each looks like from outside, and what it means.",
            [("Everything slows together",
              "a coarse lock held somewhere",
              "Requests that touch unrelated data are also slow, and the "
              "database shows sessions waiting on locks. Something long-lived "
              "is holding a coarse lock -- an escalation, or a forgotten open "
              "transaction. Find the blocking session rather than tuning the "
              "blocked queries."),
             ("One operation fails intermittently",
              "a deadlock victim",
              "The same operation succeeds most of the time and occasionally "
              "reports a failure with no bad input. This is a deadlock victim "
              "or a serialisation failure, and the fix is a retry plus a "
              "consistent lock order -- not a change to the data."),
             ("Reads got slower and storage grew",
              "version accumulation",
              "Under multiversion control this is version accumulation, "
              "usually held back by one long-running transaction. Reads have "
              "more versions to skip past. The fix is closing the "
              "long-running session, not adding indexes.")]),
        desc(
            "The common thread is that the visible symptom is usually not "
            "where the cause is. Tuning the queries that are slow, when "
            "something else is blocking them, is the wasted effort this "
            "section exists to prevent."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where transaction items are lost."),
        ul([
            "Confusing a non-repeatable read with a phantom read. The first "
            "is a row CHANGING; the second is a row APPEARING.",
            "Assuming serializable is the default. It rarely is, because of "
            "what it costs in concurrency.",
            "Expecting locking to prevent deadlock. It creates the "
            "possibility; consistent lock ordering prevents it.",
            "Treating a deadlock victim's failure as fatal instead of "
            "retrying.",
            "Leaving a transaction open, which holds every lock it acquired.",
            "Assuming lock escalation is always beneficial. It suddenly "
            "blocks everyone.",
            "Confusing recovery with backup. Logging cannot restore lost "
            "media or wrong data.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"Transaction A reads a row, and before A reads it again, "
            "transaction B updates that row and commits. A's second read "
            "returns a different value. Which anomaly is this, and which "
            "isolation level prevents it?\""
        ),
        ol([
            "Identify what changed. A row A had already read now holds a "
            "different value -- an existing row CHANGED.",
            "That is a NON-REPEATABLE READ. It is not a dirty read, because B "
            "committed; it is not a phantom, because no new row appeared.",
            "Consult the levels. Read committed prevents dirty reads and "
            "permits this one.",
            "REPEATABLE READ is the lowest level that prevents it, which is "
            "what its name states.",
            "Serializable would also prevent it, and at a higher cost in "
            "concurrency -- so repeatable read is the correct answer to "
            "'which level prevents it', where the question implies the "
            "minimum.",
        ]),
        desc(
            "Step five is worth noticing because both answers are technically "
            "true. These items normally ask for the LOWEST sufficient level, "
            "since choosing more isolation than necessary is exactly the "
            "throughput mistake the topic is about -- and serializable will "
            "always be among the options for that reason."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Transaction mechanisms recur throughout the certification."),
        ul([
            "ACID and two-phase commit were introduced in the Middleware "
            "lesson.",
            "Deadlock and its four conditions come from Operating Systems, "
            "with the same consistent-ordering remedy.",
            "Lost update is the race condition of that lesson at database "
            "scale.",
            "Write-ahead logging is the journalling of the File Systems "
            "lesson, with an identical argument.",
            "Backup and roll-forward recovery are Service Management "
            "continuity requirements.",
            "Isolation level as a throughput decision is capacity planning "
            "from System Evaluation.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Non-repeatable against phantom read",
              "A row changing against a row appearing",
              "Locking rows you read prevents the first and cannot prevent "
              "the second -- the new row was not there to lock."),
             ("The four isolation levels in order",
              "Read uncommitted, read committed, repeatable read, "
              "serializable",
              "Each prevents one more anomaly and costs more concurrency. "
              "Serializable is correct and is nobody's default."),
             ("Shared against exclusive locks",
              "Many readers, or one writer",
              "Shared locks are compatible with each other; an exclusive "
              "lock is compatible with nothing."),
             ("How databases handle deadlock",
              "Detect a cycle and roll back a victim",
              "So an application must RETRY -- a transaction can fail through "
              "no fault of its own."),
             ("Write-ahead logging",
              "The log reaches storage before the data does",
              "Which guarantees the log always holds at least as much as the "
              "data files, making redo and undo possible."),
             ("Recovery against backup",
              "A crash against lost media or wrong data",
              "Logging recovers using data still present; only a backup "
              "restores a point in the past.")]),
    ]),
]

_txn_quiz = [
    mcq("HARD",
        "Transaction A reads a row. Transaction B then updates that row and "
        "commits. A reads the row again and sees a different value.\n\n"
        "Which anomaly has occurred?",
        [("Dirty read", False),
         ("Non-repeatable read", True),
         ("Phantom read", False),
         ("Lost update", False)],
        "An existing row that A had already read now holds a different value "
        "-- a non-repeatable read. It is not a dirty read, because B "
        "committed before A read again, so nothing uncommitted was seen. It "
        "is not a phantom, because no NEW row appeared; that distinction is "
        "the one the examination tests, since locking read rows prevents this "
        "and cannot prevent a phantom."),

    mcq("AVERAGE",
        "Which is the lowest isolation level that prevents non-repeatable "
        "reads?",
        [("Read uncommitted", False),
         ("Repeatable read", True),
         ("Read committed", False),
         ("Serializable", False)],
        "Repeatable read prevents dirty and non-repeatable reads while still "
        "permitting phantoms, which is precisely what its name states. "
        "Serializable also prevents it and costs considerably more "
        "concurrency, so it is not the LOWEST sufficient level -- and these "
        "items normally ask for the minimum, since choosing more isolation "
        "than necessary is the throughput mistake the topic exists to "
        "highlight."),

    mcq("AVERAGE",
        "Two transactions each read a balance of 100, each add an amount, and "
        "each write the result. One update is silently lost.\n\n"
        "What is this called?",
        [("Dirty read", False),
         ("Lost update", True),
         ("Deadlock", False),
         ("Phantom read", False)],
        "Both transactions read before either wrote, so the second write "
        "overwrites the first and one update disappears with nothing having "
        "failed. This is the lost update anomaly, and it is the race "
        "condition of the Operating Systems lesson at database scale -- the "
        "same read-modify-write sequence, the same silent outcome, and the "
        "same need for something to make it atomic."),

    mcq("HARD",
        "A database detects a deadlock between two transactions and rolls one "
        "of them back.\n\n"
        "How should the application respond?",
        [("Report the failure to the user as a data error", False),
         ("Retry the rolled-back transaction", True),
         ("Reduce the isolation level and continue without retrying", False),
         ("Increase the lock timeout so deadlocks cannot occur", False)],
        "A deadlock victim did nothing wrong -- it was chosen arbitrarily to "
        "break a cycle -- so the operation would very likely succeed on a "
        "second attempt. Code treating every database failure as fatal "
        "surfaces these to users as errors that need not have been. The "
        "durable prevention is acquiring locks in a consistent order across "
        "the application, which makes the cycle impossible and costs nothing "
        "at run time."),

    mcq("AVERAGE",
        "What does write-ahead logging guarantee?",
        [("Data is written to the data files before the log record", False),
         ("The log record reaches persistent storage before the data "
          "does", True),
         ("Every transaction is written to a separate log file", False),
         ("Committed transactions are written before uncommitted ones", False)],
        "The log describing a change reaches durable storage before the "
        "changed data, so after a crash the log always holds at least as much "
        "as the data files and never less. That ordering is what makes both "
        "recovery operations possible: REDO for committed transactions whose "
        "data had not been written, and UNDO for uncommitted ones whose data "
        "had. Reversing the order would allow a change with no record of it."),

    mcq("EASY",
        "Which lock combination is permitted on the same data at the same "
        "time?",
        [("Two shared locks", True),
         ("Two exclusive locks", False),
         ("One shared and one exclusive lock", False),
         ("Any combination, provided the transactions are in different "
          "sessions", False)],
        "Shared locks are compatible with each other, so several transactions "
        "may read the same data simultaneously. An exclusive lock is "
        "compatible with nothing, so a writer excludes both other writers and "
        "all readers. That single compatibility rule is what every locking "
        "behaviour in the topic follows from."),

    mcq("HARD",
        "A transaction takes many row locks on one table, and the system "
        "converts them into a single table lock.\n\n"
        "What is this, and what is the consequence?",
        [("Lock escalation, which suddenly blocks other transactions", True),
         ("Two-phase locking, which guarantees serialisability", False),
         ("Deadlock detection, which prevents a wait cycle", False),
         ("Lock granularity tuning, which improves concurrency", False)],
        "Lock escalation trades bookkeeping for concurrency: tracking "
        "thousands of row locks is expensive, so the system replaces them "
        "with one coarse lock -- which then blocks every other transaction "
        "needing that table. It is a classic cause of a system that performs "
        "acceptably until a threshold and then degrades sharply, and it "
        "reduces concurrency rather than improving it."),

    mcq("AVERAGE",
        "What is the essential difference between database recovery and "
        "database backup?",
        [("Recovery is automatic while backup is manual", False),
         ("Recovery uses data still present; backup restores a point in the "
          "past", True),
         ("Recovery applies to committed data and backup to uncommitted "
          "data", False),
         ("Recovery is performed by the DBA and backup by the system", False)],
        "Crash recovery uses the log and data files that are still there to "
        "restore consistency at the last commit. It cannot help when the "
        "media is lost or the data is wrong, because both mean the present "
        "state is unusable -- which only a copy from a previous point can "
        "address. Roll-forward recovery combines the two: restore the backup, "
        "then apply the logs taken since."),

    mcq("HARD",
        "A query tool is left with an uncommitted transaction open "
        "overnight.\n\nWhat is the likely effect?",
        [("The transaction commits automatically after a timeout", False),
         ("Locks it acquired are held, blocking other work", True),
         ("The database rejects new connections until it is closed", False),
         ("Its changes become visible to other transactions gradually",
          False)],
        "An open transaction holds every lock it acquired until it commits or "
        "rolls back, so unrelated work needing that data waits indefinitely "
        "and eventually times out. The symptom appears far from the cause -- "
        "applications failing with no obvious reason -- which is why a "
        "database that seems mysteriously blocked is very often waiting on "
        "one forgotten session. Uncommitted changes are not visible to others "
        "at any normal isolation level."),

    mcq("AVERAGE",
        "Under two-phase locking, what happens once a transaction releases "
        "its first lock?",
        [("It may acquire no further locks", True),
         ("It must immediately release all remaining locks", False),
         ("It must commit before performing any further reads", False),
         ("Its remaining locks are automatically escalated", False)],
        "Two-phase locking divides a transaction into a growing phase, in "
        "which locks are acquired, and a shrinking phase, in which they are "
        "released -- and the rule is that no lock may be acquired after any "
        "has been released. That constraint is what guarantees serialisable "
        "results. Strict two-phase locking goes further by holding every lock "
        "until commit, which also prevents dirty reads."),
]

LESSON_DB_TXN = lesson(
    MAJOR, MIDDLE,
    "Transaction Processing: ACID, Concurrency and Recovery",
    _txn_quiz,
    lesson_structure(
        "Transaction Processing: ACID, Concurrency and Recovery",
        "A business operation usually needs several database changes and any "
        "of them can fail, which is what a transaction exists to handle. This "
        "lesson covers how a database actually delivers ACID rather than "
        "merely promising it: the commit that waits for persistent storage, "
        "the four concurrency anomalies traced as specific interleavings, the "
        "isolation levels named for which of them they still permit, the "
        "locking that provides isolation and the deadlock it inevitably "
        "creates, and the write-ahead log that makes a crash recoverable -- "
        "along with the distinction between recovering and restoring, which "
        "are answers to different disasters.",
        [
            "Explain which mechanism delivers each ACID property",
            "Describe commit, rollback and savepoints, and the cost of an "
            "open transaction",
            "Identify each concurrency anomaly from a described interleaving",
            "Distinguish non-repeatable reads from phantom reads",
            "Select the lowest isolation level preventing a stated anomaly",
            "Explain shared and exclusive locks, granularity and escalation",
            "Explain how databases handle deadlock and how applications must "
            "respond",
            "Explain write-ahead logging, checkpoints, and recovery against "
            "backup",
        ],
        80,
        _txn_sections,
        [
            ("Transaction",
             "A group of changes treated as one unit: all of them happen or "
             "none does."),
            ("Commit",
             "Making changes permanent and visible. Does not return until the "
             "log reaches persistent storage, which is what durability "
             "costs."),
            ("Savepoint",
             "A marked position within a transaction that can be rolled back "
             "to without abandoning the whole."),
            ("Lost update",
             "Two transactions read the same value, both write, and one "
             "update disappears with nothing having failed."),
            ("Dirty read",
             "Reading a value another transaction wrote and then rolled back "
             "-- acting on something that never officially existed."),
            ("Non-repeatable read",
             "An existing row holding a different value when read again "
             "within one transaction."),
            ("Phantom read",
             "New rows appearing in a repeated query. Distinct from a "
             "non-repeatable read because the new row was never there to "
             "lock."),
            ("Isolation levels",
             "Read uncommitted, read committed, repeatable read, "
             "serializable -- each preventing one more anomaly at a cost in "
             "concurrency."),
            ("Shared and exclusive locks",
             "Read locks compatible with each other; a write lock compatible "
             "with nothing."),
            ("Lock granularity",
             "How much data one lock covers. Fine granularity permits more "
             "concurrency and costs more bookkeeping."),
            ("Lock escalation",
             "Converting many fine locks into one coarse lock, which suddenly "
             "blocks other transactions and degrades a system sharply."),
            ("Two-phase locking",
             "Acquiring locks in a growing phase and releasing in a shrinking "
             "one, with no acquisition after any release. Guarantees "
             "serialisability."),
            ("Deadlock detection",
             "Finding a cycle in the wait-for graph and rolling back a "
             "victim, since a database cannot know in advance what a "
             "transaction will need."),
            ("Write-ahead logging",
             "Writing the log record before the data, so the log always holds "
             "at least as much as the data files."),
            ("Checkpoint",
             "A periodic flush and recorded position, bounding how much log "
             "recovery must scan."),
            ("Roll-forward recovery",
             "Restoring a backup and applying the logs taken since, which is "
             "how a lost medium is recovered from."),
        ],
        "A transaction makes several changes behave as one, and each ACID "
        "property is delivered by a distinct mechanism against a distinct "
        "threat -- the log and rollback for atomicity, constraints for "
        "consistency, locking for isolation, and write-ahead logging for "
        "durability. Commit does not return until the log is durable, which "
        "is why it is slower than the writes it confirms, and a transaction "
        "left open holds every lock it took, which is why a mysteriously "
        "blocked database is usually waiting on one forgotten session. "
        "Without isolation, four specific things go wrong: a lost update "
        "where one write overwrites another, a dirty read of data later "
        "rolled back, a non-repeatable read where an existing row CHANGES, "
        "and a phantom read where a new row APPEARS -- and that last "
        "distinction matters because locking what you read stops one and "
        "cannot stop the other. The isolation levels form a ladder, each "
        "preventing one more anomaly and costing more concurrency, with "
        "serializable unconditionally correct and nobody's default. Locking "
        "delivers isolation and creates deadlock, which databases detect "
        "rather than prevent -- so applications must RETRY, and consistent "
        "lock ordering is the free prevention. Recovery rests on the log "
        "reaching storage before the data, redoing committed work and undoing "
        "uncommitted, bounded by checkpoints -- and it is a different thing "
        "from backup, which is the only answer to lost media or wrong data.",
        exam_notes=[
            desc(
                "Transaction items describe an interleaving and ask for the "
                "anomaly, or ask which isolation level prevents one. Both are "
                "answered from the same two tables."
            ),
            ul([
                "Naming an anomaly from a described sequence.",
                "Distinguishing non-repeatable from phantom reads.",
                "Choosing the lowest isolation level preventing an anomaly.",
                "Explaining lock compatibility or escalation.",
                "Stating how a database handles deadlock and how an "
                "application should respond.",
                "Explaining write-ahead logging, redo and undo.",
                "Distinguishing recovery from backup.",
            ]),
            desc(
                "On an anomaly item, ask exactly one question: did an "
                "existing row CHANGE, or did a new row APPEAR? That single "
                "distinction separates the two anomalies candidates most "
                "often confuse, and it determines the isolation level the "
                "answer requires."
            ),
        ],
    ))

LESSONS = [LESSON_DB_SQL, LESSON_DB_TXN]

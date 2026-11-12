"""Explanation shown after submission for each rewritten question: (approach, common mistake)."""

EXPLANATIONS = {
    # ---------------------------------------------------------------- C
    2852: ("Walk the array once and write 'V' for each 1 and '-' for each 0, then terminate the string; decoding is the "
           "reverse mapping, returning how many bits were written.",
           "Forgetting the terminating '\\0', so the printed signal runs into leftover characters."),
    2854: ("Validate in the order the rules give: exactly four '|' separators with 'S' first and 'E' last, then a "
           "6-character uppercase hex MAC, then the checksum -- the sum of DATA's character codes modulo 256 printed "
           "as two uppercase hex digits.",
           "Checking the checksum before the frame shape, or comparing it in lowercase hex."),
    2881: ("Count the '1' characters in the frame's data; the frame passes when that count modulo 2 equals its parity "
           "bit, otherwise the error names its source and destination.",
           "Treating parity 1 as 'even', which flips every verdict."),
    2879: ("Compare position by position up to the longer stream: a missing value or a difference greater than the "
           "tolerance is the first mismatch; only if none is found are the streams synchronized.",
           "Stopping at the shorter stream, so a missing timestamp at the end is never reported."),
    2464: ("Fewer than three records are trivially consistent; otherwise take the first gap and check every later "
           "gap equals it.",
           "Comparing timestamps instead of the gaps between them."),
    2450: ("A code is accepted when its length is 1 to 6; anything else -- including the empty code -- is logged as "
           "'Invalid shipment code: <code>' and rejected.",
           "Accepting the empty code because its length is not more than 6."),
    2452: ("Sum the sales and track the largest in one pass; the average is the total divided by the count, and an "
           "empty array gives all zeros.",
           "Integer division for the average, which prints 18.00 instead of 18.33."),
    3103: ("For every day from the earliest start to the latest end, add the resources of the phases running that day "
           "(both ends inclusive) and fail as soon as a day exceeds the limit.",
           "Comparing each phase's resources with the limit on its own instead of adding up every phase running on "
           "the same day."),
    3106: ("Keep a running day starting at 1; each phase runs from that day to day + days - 1 and the next starts the "
           "day after. Phases of 0 days are skipped.",
           "Starting the next phase on the previous end day, so phases overlap by one day."),
    2880: ("Look up the cable's limits and accept when both the rate and the length are within one of them; Cat6 has "
           "two limits, so 80 m works only at 1000 Mbps.",
           "Checking only the maximum rate of Cat6 and ignoring its 55 m limit at 10 Gbps."),
    23572: ("0/1 knapsack over capacity: dp[c] is the best value using exactly c CPU. The answer is the best dp value, "
            "and scanning c upwards finds the smallest CPU that achieves it.",
            "A greedy pick by value per CPU, which is not optimal for 0/1 selection."),
    23573: ("Patience sorting: keep the smallest tail of each subsequence length and binary-search each sample -- the "
            "first tail >= x for strictly increasing, the first tail > x for non-decreasing.",
            "Using the same comparison for both, which makes the two lengths equal."),
    # ---------------------------------------------------------------- Java
    2241: ("Keep the balance private; deposit adds only positive amounts and returns the balance, withdraw subtracts "
           "only when the balance covers the amount and reports whether it did.",
           "Letting withdraw take the balance negative, or depositing a negative amount."),
    2291: ("Store each description in order; the version of a description is its position plus one, the current "
           "description is the last one, and the history lists them all as 'v<n>: <text>'.",
           "Overwriting the description instead of appending, which loses the history."),
    2466: ("Keep the set of users with an active session: establishing twice replaces the session (with the "
           "'Previous session terminated.' prefix), authentication needs an active session and the right password, "
           "and terminating removes it.",
           "Authenticating a user who has the right password but no active session."),
    2856: ("Keep a set of registered devices and a log; send checks the sender first, then the receiver, and only "
           "logs and delivers when both are registered.",
           "Checking the receiver first, which gives the wrong error when both are unregistered."),
    2462: ("Start every warehouse with an empty list in the given order, then add each shipment to its warehouse with "
           "the names of its drivers; a shipment for an unknown warehouse is dropped.",
           "Building the map from the shipments, so a warehouse with no shipments disappears."),
    2517: ("Start every requirement with an empty list, then go through the features in order adding each feature id "
           "to the requirements it covers, once; ids not in the requirement list are ignored.",
           "Listing F4 twice for REQ-1 because the feature names it twice."),
    2521: ("Copy the list first, then apply each change in order -- add only new ids, modify and remove only existing "
           "ones -- so the caller's original list is untouched.",
           "Modifying the original requirements instead of a copy."),
    2492: ("One pass with a set of ids seen so far: a transaction is rejected when a field is missing or its id was "
           "already used, and every id that exists joins the set whether approved or not.",
           "Adding only approved ids to the set, so the second id 2 is wrongly approved."),
    3131: ("Reject the whole input if any requirement lacks a field; otherwise split by type and sort each list by "
           "priority, highest first, with a stable sort so ties keep input order.",
           "Sorting ascending, or with an unstable order for equal priorities."),
    2784: ("Sort the departments by priority, highest first, keeping input order for ties, then give each the smaller "
           "of its request and what is left.",
           "Allocating in input order, so IT's higher priority is ignored."),
    23261: ("A hash map that keeps access order (LinkedHashMap with access order, or a map plus a doubly linked list) "
            "moves a hit to the end and evicts the eldest on a miss when full -- O(1) per request.",
            "Counting an eviction on every miss, even before the cache is full."),
    23571: ("Kahn's algorithm with a min-heap of ready modules gives the lexicographically smallest order; modules "
            "never reaching in-degree 0 are on, or behind, a cycle.",
            "Using a plain queue, which gives a valid order but not the smallest one."),
    # ---------------------------------------------------------------- C#
    2468: ("Compare the password with the stored one (a missing user fails), add '<user>: <result>' to the log, and "
           "return the result.",
           "Only logging failures, so the log no longer shows every attempt."),
    2495: ("Trim each username, then accept it only if it is non-empty, not already taken (existing or accepted "
           "earlier) and the password has 8+ characters including a digit.",
           "Checking duplicates before trimming, so ' alice ' and 'alice' are both accepted."),
    2497: ("Book only when the user is logged in and the seat is available, then mark the seat taken so a second "
           "booking of the same seat fails.",
           "Leaving the seat available after booking, so Dee also gets 12A."),
    2581: ("Build both URIs from the device id, refuse a device id that is already registered, and store both "
           "resources in the registry.",
           "Registering sensorA a second time with a new type instead of returning the error."),
    2704: ("Keep a set of registered ids and accept a request only the first time its id appears, preserving order.",
           "Deduplicating whole requests, so ('dev1', 'camera') is accepted as different."),
    2558: ("Start every entity with an empty list, then add each relationship to both of its entities in relationship "
           "order.",
           "Adding the relationship only to Entity1, so Order never shows Customer."),
    2556: ("Group entries by stakeholder in order of first appearance, then order each group by priority, highest "
           "first, with a stable sort so equal priorities keep their input order.",
           "Sorting all entries first, which reorders the stakeholders themselves."),
    2936: ("Sort by value per budget unit, highest first, and take each project that still fits both the remaining "
           "personnel and budget.",
           "Sorting by business value alone, which picks CRM first."),
    3133: ("Check the five sections in the given order and collect those that are missing or blank.",
           "Treating a section of spaces as present."),
    3066: ("Check the five required keys in the fixed order; a key that is present with an empty list still counts "
           "as present.",
           "Reporting empty sections as missing."),
    3157: ("Return the five categories in the fixed order whose exact names are not keys of the document.",
           "Matching case-insensitively, so 'interface' wrongly counts as 'Interface'."),
    23575: ("Safety check: repeatedly run the lowest-numbered process whose remaining need fits in the free "
            "resources and release its allocation. A request is granted only if it is within need and available and "
            "the state after granting it is still safe.",
            "Granting a request because it fits the available resources without checking it stays within the "
            "process's remaining need."),
    # ---------------------------------------------------------------- JavaScript
    2264: ("Split each key on '_', lowercase the first part, capitalise the rest and join; skip one-letter keys "
           "except i and j, keeping the original order.",
           "Lowercasing every part, which turns first_name into firstname."),
    2316: ("Validate the amount first (a number above 0), then each card field; only when both pass is the result "
           "'Success'.",
           "Accepting the string '40' as an amount."),
    2318: ("Check the keyword groups in the given order and stop at the first match, so 'Payment report export' is a "
           "PaymentModule, not a ReportModule.",
           "Checking 'user' before 'auth', so 'User authentication' becomes UserModule."),
    2891: ("Take the text after the last '.', lowercased, and accept pdf, docx or xlsx unless the name contains '../'.",
           "Using the first '.', so 'archive.tar.docx' and 'budget.xlsx.exe' are judged by the wrong extension."),
    3093: ("Count the words of technicalCapabilities by splitting on runs of whitespace after trimming; a missing or "
           "empty field counts 0.",
           "Splitting on single spaces, so repeated spaces add empty words."),
    3095: ("Build the lines in order -- title, blank line, introduction -- then a blank line, the name and the "
           "placeholder for each of the four sections, and join them with newlines.",
           "Missing the blank line before each section."),
    3159: ("Write the title, a blank line and the prompt, then one numbered line per field ending in exactly 23 "
           "underscores.",
           "Numbering the fields from 0."),
    3101: ("Look the type up exactly as given; only 'project', 'investment' and 'decision' are valid, so 'Project' "
           "is an error.",
           "Lowercasing the input first, which accepts 'Project'."),
    3068: ("Keep only lines that begin with 'FR:' at the very start, then remove the prefix and trim.",
           "Trimming the line before checking, which wrongly includes the indented line."),
    2536: ("For each of the three keys, join its items with ', ' or write 'not specified' when it is missing or "
           "empty.",
           "Printing an empty string for an empty list instead of 'not specified'."),
    2557: ("Keep readings whose value is a finite number: typeof 'number' and not NaN; null, strings, booleans and "
           "missing values are dropped.",
           "Keeping NaN, which is typeof 'number' too."),
    23260: ("Sweep line: sort the start (+1) and end (-1) events, ends before starts at the same second. Track the "
            "count after each second; the first time the maximum is reached gives FIRST and the end of the latest "
            "stretch at the maximum gives LAST.",
            "Processing starts before ends at the same second, counting touching sessions as overlapping."),
    # ---------------------------------------------------------------- C++
    2344: ("For each line take the text after the last ':', trim it, and count only PASS, FAIL or SKIP; the total is "
           "the sum of those three.",
           "Counting every line in the total, including the broken and PENDING ones."),
    2701: ("Keep the latest timestamp per device (reports are out of order), then report devices whose latest report "
           "is more than 900 seconds old, sorted.",
           "Using >= 900, which wrongly flags C at exactly 900 seconds."),
    2757: ("Validate each line (4 fields, a real timestamp), convert the time to seconds and flag times before "
           "08:00:00 or after 18:00:00; a set gives sorted unique users.",
           "Comparing only the hour, which treats 18:00:01 as inside business hours."),
    2755: ("Split each row on ',', trim the fields, skip rows without exactly three non-empty fields, then count by "
           "type in alphabetical order and count 'High' separately.",
           "Not trimming, so ' Software ' becomes its own type."),
    2759: ("Put the implemented controls in a set, then walk the required list adding each missing control once, in "
           "first-appearance order.",
           "Reporting Backups twice because it is required twice."),
    2895: ("Skip lines without exactly one ':' or without an integer value; keep the rest in order, then list the "
           "names whose value is above 100000.",
           "Treating 100000 as above 100000."),
    3184: ("Walk the categories in order and append each requirement the first time it is seen.",
           "Collecting into a set and printing it, which loses the first-appearance order."),
    3185: ("Look up the phase's document types and keep the input documents that are among them, in input order; an "
           "unknown phase has none.",
           "Returning the phase's list instead of filtering the input."),
    2534: ("Group readings by the first 10 characters of the timestamp in order of first appearance and average each "
           "group.",
           "Grouping by the whole timestamp, so every reading becomes its own day."),
    23259: ("Dijkstra from router 0 with a binary heap over the undirected links; unreachable routers keep infinity "
            "and print -1. The second line counts distances of at most 40.",
            "Treating links as one-way, or counting hops instead of latency."),
    23574: ("Prim's algorithm on the complete graph with Manhattan distances, O(V^2): repeatedly add the closest "
            "unconnected building and track the largest link added.",
            "Using Euclidean distance instead of Manhattan."),
    23576: ("Edmonds-Karp: BFS for shortest augmenting paths in the residual capacity matrix until none remain. The "
            "source side is what BFS still reaches; count original links from it to the sink side.",
            "Counting cut edges in the merged capacity matrix, which undercounts parallel links."),
    # ---------------------------------------------------------------- Python
    2293: ("Lowercase each requirement and flag it when any of the four vague words appears anywhere in it, "
           "returning the indices in order.",
           "Matching case-sensitively, which misses 'EFFICIENTLY'."),
    2341: ("Run the steps in order, adding one message per step attempted, and stop after the first failure.",
           "Continuing after a failed step, so later steps still report success."),
    2454: ("Check every statement against every category's keywords, adding it to each category it matches, in input "
           "order.",
           "Stopping at the first matching category, so a statement belongs to only one."),
    2456: ("Validate the method first, then map each stakeholder to the method and their requirement, with 'No "
           "requirement' giving an empty list.",
           "Listing 'No requirement' as a real requirement."),
    2519: ("A missing text fails all four criteria; otherwise vague words fail unambiguous and testable and fewer than "
           "4 words fails complete, listed in the fixed order.",
           "Listing the failed criteria in the order they were found instead of the fixed order."),
    2727: ("Hold a threading.Lock around opening and appending to the file, so concurrent calls never interleave and "
           "every attempt becomes exactly one line.",
           "Writing without a lock, which can mix or lose lines under concurrency."),
    2730: ("General records are open to everyone; financial records only to admin and finance_manager; any other "
           "type to no one, with exact, case-sensitive role names.",
           "Matching roles case-insensitively, which lets 'Admin' through."),
    2916: ("Start all four phases at 0 so every phase is present, then count each action's phase.",
           "Building the counts from the actions only, so 'Act' is missing."),
    2933: ("Average resolution over closed tickets only, count the open ones, and average satisfaction over all "
           "tickets, using 0.0 when there is nothing to average.",
           "Including open tickets in the resolution average."),
    3155: ("Check ambiguity first (a vague word and no digit), then the non-functional keywords, otherwise "
           "functional.",
           "Checking non-functional first, which hides the ambiguity of a vague statement."),
    3183: ("Check that each of the four exact section names is in the list; other sections may also be present.",
           "Comparing case-insensitively, which accepts 'executive summary'."),
    3248: ("Lowercase, strip punctuation and use the set of words as the key; keep groups in order of their first "
           "member and print only groups of two or more.",
           "Comparing word lists instead of sets, so reordered requirements are not grouped."),
    # ---------------------------------------------------------------- SQL
    2807: ("Filter with WHERE current_value < 0.9 * target and order by kpi_id.",
           "Using <=, which wrongly includes First Response at exactly 90%."),
    2808: ("One row of conditional counts: SUM(CASE WHEN ... THEN 1 ELSE 0 END) for each band.",
           "Using GROUP BY, which returns several rows instead of one."),
    2830: ("Group by category and average a 1/0 flag for status = 'resolved', rounded to 2 places, then order by the "
           "rate and the category.",
           "Dividing with integers (SUM(...) / COUNT(*) on whole numbers), which truncates every rate to 0 or 1."),
    2782: ("Keep the breaching services with WHERE actual_uptime < sla_target, compute the rounded shortfall and order "
           "by it descending, then by name.",
           "Using <=, which wrongly lists VPN at exactly its target."),
    2828: ("Filter to delayed orders, group by department, order by the average delay descending and the name, and "
           "take LIMIT 1.",
           "Including completed orders in the average."),
    2960: ("Keep projects failing either check with OR, compute the number of failed checks, and order by it, then "
           "by project_id.",
           "Using AND, which lists only projects that fail both checks."),
    2961: ("Use conditional aggregates: SUM of personnel for allocated rows, SUM of 1 for unallocated rows, and AVG "
           "of a CASE that yields NULL for unallocated rows so they are not averaged.",
           "Averaging with ELSE 0, which counts unallocated rows as zero people."),
    2535: ("Filter role = 'manager', use DISTINCT and ORDER BY requirement.",
           "Forgetting DISTINCT, so 'fast reporting' appears twice."),
    2914: ("CASE with NOT EXISTS: effective only if the control is active and no incident row for it has a non-NULL "
           "incident.",
           "A plain JOIN to incident, which drops Backups (no incident rows) and duplicates Firewall."),
    2915: ("ORDER BY a CASE that ranks Critical, High, Medium, Low, then by finding.",
           "ORDER BY severity, which sorts the severity names alphabetically."),
    2893: ("Compute likelihood * impact as risk_score and order by it descending, then by name.",
           "Ordering ties by risk_id instead of by name."),
    2939: ("Group by incident_type with COUNT(*), COUNT(DISTINCT user_id) and ROUND(AVG(severity), 2), then order by "
           "the count descending and the type.",
           "COUNT(user_id) instead of COUNT(DISTINCT user_id), which counts u2's two phishing incidents twice."),
}

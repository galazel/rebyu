"""Champions Cup question set: 30 scenario MCQs, ten per bracket stage.

Quarterfinal = applied professional knowledge, semifinal = multi-step reasoning,
final = the kind of question that separates senior engineers. Every numeric answer
was computed in code before it was written here. Each item: (stem, explanation,
[(choice, correct, why), ...]); exactly one choice is correct.
"""

QUARTERFINAL = [
    ("A single-page app keeps its JWT access token in localStorage. An attacker finds an unescaped "
     "comment field and injects <script>. What is the MOST effective change to protect the session?",
     "Any script running in the page can read localStorage, so XSS exfiltrates the token. An HttpOnly, "
     "Secure, SameSite cookie is invisible to JavaScript, and a strict Content-Security-Policy plus "
     "output encoding stops the injected script from running at all.",
     [("Move the token to an HttpOnly, Secure, SameSite cookie and enforce output encoding plus a strict CSP", True,
       "Correct: script cannot read an HttpOnly cookie, and CSP plus encoding blocks the XSS itself."),
      ("Encrypt the token with AES before putting it in localStorage", False,
       "The key must also be in the page, so the injected script can decrypt it or simply reuse the encrypted token."),
      ("Move the token to sessionStorage", False,
       "sessionStorage is just as readable by injected script; it only changes the token's lifetime."),
      ("Shorten the token lifetime to 15 minutes", False,
       "That limits the damage window but the attacker still steals and uses the token immediately.")]),
    ("A network team splits 10.20.0.0/22 into equal /26 subnets. How many subnets result, and how many "
     "usable host addresses does each have?",
     "Going from /22 to /26 borrows 4 bits, giving 2^4 = 16 subnets. Each /26 has 32 - 26 = 6 host bits: "
     "2^6 = 64 addresses minus the network and broadcast addresses = 62 usable hosts.",
     [("16 subnets, 62 usable hosts each", True, "Correct: 2^(26-22) = 16 and 2^6 - 2 = 62."),
      ("16 subnets, 64 usable hosts each", False, "64 counts the network and broadcast addresses, which hosts cannot use."),
      ("4 subnets, 254 usable hosts each", False, "That splits the /22 into /24s, not /26s."),
      ("8 subnets, 126 usable hosts each", False, "That is the result for /25 subnets (3 borrowed bits).")]),
    ("A reporting job runs SELECT COUNT(*) FROM orders WHERE status='NEW' twice in one transaction under "
     "REPEATABLE READ (ANSI semantics). Between the reads another transaction inserts and commits a NEW "
     "order. The second count is one higher. Which isolation level is guaranteed to prevent this?",
     "Rows inserted by others that match a repeated range query are phantoms. ANSI REPEATABLE READ "
     "protects rows already read but not new rows entering the range; only SERIALIZABLE forbids phantoms.",
     [("SERIALIZABLE", True, "Correct: only SERIALIZABLE is defined to prevent phantom reads."),
      ("READ COMMITTED", False, "READ COMMITTED is weaker than REPEATABLE READ and allows phantoms too."),
      ("READ UNCOMMITTED", False, "The weakest level; it even allows dirty reads."),
      ("REPEATABLE READ with a longer lock timeout", False,
       "Lock timeouts do not change which anomalies the level allows; new matching rows can still appear.")]),
    ("A request passes through a load balancer (availability 99.9%) and then to either of two identical "
     "application servers in an active-active pair (each 99% available, failures independent). What is the "
     "overall availability?",
     "Parallel servers fail only if both fail: 1 - 0.01^2 = 0.9999. In series with the load balancer: "
     "0.999 x 0.9999 = 0.9989, about 99.89%.",
     [("About 99.89%", True, "Correct: 0.999 x (1 - 0.01^2) = 0.9989."),
      ("About 98.90%", False, "That multiplies 0.999 by a single server's 0.99, ignoring the redundancy."),
      ("99.99%", False, "That is the server pair alone; the load balancer in series lowers it."),
      ("About 99.90%", False, "That treats the pair as perfect; 0.9999 still costs a little.")]),
    ("At a project checkpoint, planned value (PV) is 100, earned value (EV) is 80 and actual cost (AC) is "
     "90 (in thousands). What is the project's status?",
     "SPI = EV/PV = 0.80 (< 1, behind schedule) and CPI = EV/AC = 0.89 (< 1, over budget). The team has "
     "done 80% of the planned work and paid 90 for work worth 80.",
     [("Behind schedule and over budget", True, "Correct: SPI 0.80 and CPI 0.89 are both below 1."),
      ("Behind schedule but under budget", False, "AC (90) exceeds EV (80), so it is over budget, not under."),
      ("Ahead of schedule and over budget", False, "EV (80) is below PV (100), so it is behind schedule."),
      ("On schedule, because AC is close to PV", False, "Schedule is judged by EV against PV, not AC against PV.")]),
    ("A trading system needs a symbol lookup with guaranteed O(log n) worst-case search AND fast in-order "
     "iteration over symbols. Which structure fits?",
     "A self-balancing binary search tree (red-black or AVL) keeps height O(log n) in the worst case and "
     "supports in-order traversal. A hash table is O(1) on average but O(n) in the worst case and unordered.",
     [("A self-balancing BST such as a red-black tree", True, "Correct: worst-case O(log n) and naturally ordered."),
      ("A hash table", False, "Average O(1) but worst case O(n) under collisions, and no ordering."),
      ("An unbalanced binary search tree", False, "Sorted inserts degrade it to a linked list: O(n) worst case."),
      ("A sorted array with binary search", False, "Search is O(log n), but each insert shifts elements: O(n).")]),
    ("A service uses cache-aside with Redis. On update it currently writes the new value to the cache "
     "first, then to the database. Under concurrent updates users sometimes see stale data for hours. "
     "What is the recommended write path?",
     "Update the database (the source of truth) first, then DELETE the cache entry so the next read "
     "reloads fresh data. Writing the cache first, or setting it after the DB write, lets an interleaved "
     "request leave an older value cached indefinitely. Combine with a TTL as a safety net.",
     [("Write the database first, then invalidate (delete) the cache key, with a TTL as backup", True,
       "Correct: invalidation after the DB commit lets the next read repopulate from the truth."),
      ("Write the cache first and the database second, inside a retry loop", False,
       "Retrying does not fix the ordering race; the cache can still hold a value the DB never kept."),
      ("Write the database, then overwrite the cache with the new value", False,
       "Two concurrent updates can finish in the opposite order and leave the older value cached."),
      ("Disable the TTL so cached values never expire", False, "This makes any stale entry permanent.")]),
    ("Alice must send Bob a contract that only Bob can read AND that Bob can prove came from Alice "
     "unchanged. Which combination of keys achieves both?",
     "Signing uses the SENDER's private key (anyone can verify it with Alice's public key), giving "
     "authenticity and integrity. Confidentiality comes from encrypting with the RECIPIENT's public key, "
     "in practice a symmetric key wrapped with it, so only Bob's private key can decrypt.",
     [("Sign with Alice's private key, encrypt with Bob's public key", True,
       "Correct: Alice's private key proves origin; Bob's public key ensures only Bob can read it."),
      ("Sign with Bob's public key, encrypt with Alice's private key", False,
       "Anyone has Bob's public key, so it cannot prove Alice's identity, and 'encrypting' with a private key hides nothing."),
      ("Encrypt with Alice's public key and sign with Bob's private key", False,
       "Alice cannot use Bob's private key, and Bob could not decrypt something encrypted for Alice."),
      ("Sign and encrypt with a shared password", False,
       "A shared secret gives no non-repudiation; Bob could have produced the same 'signature'.")]),
    ("A process has 3 page frames and the reference string 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2. How "
     "many page faults occur under LRU replacement (frames start empty)?",
     "Simulating LRU: 7, 0, 1 fault (3); 2 faults and evicts 7 (4); 0 hits; 3 evicts 1 (5); 0 hits; 4 evicts "
     "2 (6); 2 evicts 3 (7); 3 evicts 0 (8); 0 evicts 4 (9); then 3 and 2 hit. Total: 9 faults.",
     [("9", True, "Correct: the LRU simulation gives 9 faults."),
      ("10", False, "10 is the FIFO result, which evicts the oldest-loaded page, not the least recently used."),
      ("7", False, "Too few: the compulsory faults alone account for 5."),
      ("13", False, "That counts every reference as a fault, ignoring the hits.")]),
    ("A firm's product holds the leading market share in a market that has stopped growing, and it "
     "generates more cash than it needs. In the BCG matrix (product portfolio management), what is it, "
     "and what is the usual strategy?",
     "High relative share in a low-growth market is a Cash Cow. The usual strategy is to harvest: maintain "
     "it efficiently and use its cash to fund Question Marks and Stars.",
     [("Cash Cow: harvest it and invest its cash in Stars and Question Marks", True,
       "Correct: high share, low growth means a cash generator to milk, not to expand."),
      ("Star: invest heavily to grow share", False, "A Star needs a HIGH-growth market."),
      ("Question Mark: decide whether to invest or divest", False, "A Question Mark has LOW share in a high-growth market."),
      ("Dog: divest immediately", False, "A Dog has LOW share; this product leads its market.")]),
]

SEMIFINAL = [
    ("During a network partition, a geo-replicated shopping-cart service keeps accepting writes in both "
     "regions and reconciles the carts afterwards. In CAP terms, what has it chosen, and what must it "
     "accept?",
     "Accepting writes on both sides of a partition favours Availability over Consistency (AP). It must "
     "accept that reads can be stale and replicas diverge, needing a merge strategy (e.g. CRDTs or "
     "last-writer-wins) when the partition heals.",
     [("Availability over consistency; stale reads and divergent replicas that must be merged", True,
       "Correct: an AP system stays writable and resolves conflicts later."),
      ("Consistency over availability; some writes are rejected during the partition", False,
       "A CP system would refuse writes on the minority side; this one accepts them."),
      ("Both consistency and availability, because reconciliation happens later", False,
       "CAP says you cannot have both during a partition; reconciling later means it was inconsistent."),
      ("Partition tolerance is avoided by using two regions", False,
       "Partitions are a fact of networks, not something two regions remove.")]),
    ("A mobile client retries POST /payments when its request times out. Customers are occasionally "
     "charged twice. What is the robust fix?",
     "The client generates an idempotency key per logical payment and resends it on every retry. The "
     "server stores the key with the result and returns the stored result for a repeated key instead of "
     "charging again.",
     [("Send a client-generated idempotency key; the server stores it and replays the first result on retry", True,
       "Correct: the same key always maps to one charge, however many times it is retried."),
      ("Turn off client retries", False, "Timeouts then leave customers unsure whether they paid; the duplicate risk just moves."),
      ("Make the timeout longer", False, "That reduces but cannot remove retries after a lost response."),
      ("Reject a payment whose amount equals the previous one", False, "This blocks legitimate repeat purchases and is not tied to the retry.")]),
    ("SELECT c.id FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.year = 2024; "
     "The analyst expects every customer, with or without 2024 orders, but customers with no 2024 orders "
     "are missing. Why, and what is the fix?",
     "For customers without a matching order, the LEFT JOIN produces NULL in o.year, and WHERE o.year = 2024 "
     "filters those rows out, turning the query into an inner join. Move the condition into the ON clause: "
     "ON o.customer_id = c.id AND o.year = 2024.",
     [("The WHERE filter discards the NULL rows; move o.year = 2024 into the ON clause", True,
       "Correct: conditions on the right table belong in ON to keep unmatched left rows."),
      ("LEFT JOIN should be RIGHT JOIN", False, "That would keep all orders instead, still not all customers."),
      ("Add DISTINCT to the SELECT", False, "DISTINCT removes duplicates; it cannot bring filtered rows back."),
      ("Use WHERE o.year = 2024 OR o.year = NULL", False,
       "'= NULL' is never true in SQL; it would need IS NULL, and even then it wrongly keeps customers who only have orders in other years.")]),
    ("A public web server is hit by a flood of TCP SYN packets from spoofed addresses. Its backlog of "
     "half-open connections fills, and real users cannot connect. Which server-side technique lets it "
     "keep accepting legitimate connections without storing state for each SYN?",
     "SYN cookies encode the connection state in the initial sequence number of the SYN-ACK, so the "
     "server keeps no backlog entry until a valid final ACK returns. Spoofed SYNs never complete the "
     "handshake and cost no memory.",
     [("SYN cookies", True, "Correct: stateless SYN-ACKs keep the backlog free under a SYN flood."),
      ("Increasing the keep-alive timeout", False, "Keep-alive affects established connections, not half-open ones."),
      ("Blocking the source IP addresses of the SYNs", False, "The sources are spoofed, so blocking them is ineffective and can block real users."),
      ("Switching the service to UDP", False, "That changes the protocol and breaks clients; it is not a defence.")]),
    ("A team wants to release a new checkout service by sending 5% of real production traffic to it, "
     "watching error rates, and widening exposure gradually. Which deployment strategy is this?",
     "A canary release routes a small, growing share of real traffic to the new version and rolls back on "
     "bad metrics. Blue-green switches ALL traffic between two environments at once.",
     [("Canary release", True, "Correct: a small, monitored, gradually increasing share of live traffic."),
      ("Blue-green deployment", False, "Blue-green cuts over all traffic at once; it has no gradual share."),
      ("Recreate (big-bang) deployment", False, "Recreate stops the old version and starts the new one for everyone."),
      ("Shadow (dark) deployment", False, "Shadowing copies traffic to the new version but never serves its responses to users.")]),
    ("A single-server API is modelled as an M/M/1 queue. Mean service time is 40 ms and the server is "
     "80% utilised. What is the mean response time (waiting plus service)?",
     "For M/M/1, the mean response time is R = S / (1 - p) = 40 ms / (1 - 0.8) = 200 ms. At high "
     "utilisation the waiting time dominates, which is why latency rises steeply near saturation.",
     [("200 ms", True, "Correct: 40 / 0.2 = 200 ms."),
      ("40 ms", False, "That is service time alone, ignoring queueing."),
      ("50 ms", False, "40 / 0.8 divides by utilisation instead of (1 - utilisation)."),
      ("160 ms", False, "160 ms is only the waiting time (pS / (1 - p)); the response time adds the 40 ms service.")]),
    ("A login endpoint builds SQL as \"... WHERE user = '\" + name + \"'\" and has been exploited. "
     "Which fix is correct?",
     "Parameterised queries (prepared statements) send the SQL text and the values separately, so input is "
     "never parsed as SQL. Escaping and blacklists are bypassable; least privilege limits damage but does "
     "not stop injection.",
     [("Use parameterised queries / prepared statements for every input", True,
       "Correct: values are bound as data and never become part of the SQL text."),
      ("Strip quote characters and the words SELECT and DROP from input", False,
       "Blacklists miss encodings and other payloads such as OR 1=1 or comments."),
      ("Validate input only in client-side JavaScript", False, "An attacker sends requests directly and skips the client."),
      ("Run the database user with read-only rights", False, "That limits damage but still lets the attacker read every table.")]),
    ("Table Employee(empId PK, name, deptId, deptName, deptManager). deptName and deptManager depend on "
     "deptId, not directly on empId. Which normal form does it violate, and what is the fix?",
     "empId -> deptId -> deptName is a transitive dependency of a non-key attribute on another non-key "
     "attribute, which violates 3NF. Move deptName and deptManager into Department(deptId PK, ...), "
     "referenced by Employee.deptId.",
     [("3NF; move the department attributes into a separate Department table keyed by deptId", True,
       "Correct: it removes the transitive dependency through deptId."),
      ("1NF; split deptName into atomic parts", False, "All values are already atomic; 1NF is satisfied."),
      ("2NF; the key is composite", False, "The key is the single column empId, so partial dependency cannot occur."),
      ("It is already in BCNF", False, "deptId -> deptName holds while deptId is not a candidate key, so it is not even 3NF.")]),
    ("A storage controller has an MTBF of 480 hours and an MTTR of 20 hours. What is its steady-state "
     "availability?",
     "Availability = MTBF / (MTBF + MTTR) = 480 / 500 = 0.96, or 96%.",
     [("96%", True, "Correct: 480 / (480 + 20)."),
      ("95.8%", False, "That is 1 - 20/480, which uses the wrong denominator."),
      ("24%", False, "MTBF / MTTR is a ratio, not an availability."),
      ("99.96%", False, "That would need far shorter repairs relative to MTBF.")]),
    ("Two worker threads deadlock: T1 holds lock A and waits for B, and T2 holds B and waits for A. Which "
     "change removes the possibility of this deadlock with the least impact on concurrency?",
     "Deadlock needs mutual exclusion, hold-and-wait, no preemption and circular wait. Making every thread "
     "acquire locks in one global order (always A then B) makes circular wait impossible while still "
     "allowing parallel work.",
     [("Impose a global lock order: every thread takes A before B", True,
       "Correct: a consistent order makes a cycle of waits impossible."),
      ("Replace both locks with one global lock", False, "That also prevents deadlock but serialises all the work."),
      ("Add Thread.sleep() between the two lock calls", False, "Timing changes make the deadlock rarer, not impossible."),
      ("Raise both threads' priority", False, "Priority does not break circular wait.")]),
]

FINAL = [
    ("A cache cluster uses consistent hashing with many virtual nodes per server and currently has N "
     "servers. One server is added. Roughly what fraction of keys must move?",
     "With consistent hashing only the keys that now fall on the new server's ring ranges move, about "
     "1/(N+1) of all keys. Plain modulo hashing (key mod N) would remap almost every key.",
     [("About 1/(N+1) of the keys", True, "Correct: only the new server's share of the ring moves."),
      ("About N/(N+1) of the keys", False, "That is close to what modulo hashing causes, which consistent hashing avoids."),
      ("Exactly half of the keys", False, "The moved share shrinks as the cluster grows; it is not a fixed half."),
      ("None, because virtual nodes absorb the change", False, "Virtual nodes even out the load, but the new server must still receive keys.")]),
    ("A Raft cluster has 5 voting members: 3 in data centre A and 2 in data centre B. Data centre A loses "
     "power entirely. What happens to writes?",
     "Raft commits a write only with a majority (3 of 5). With A down, only 2 members remain, so no leader "
     "can be elected and writes stop until A returns or membership is changed. Placing a majority in one "
     "site makes that site a single point of failure.",
     [("Writes stop: the 2 survivors are not a majority of 5", True, "Correct: no quorum, so no leader and no commits."),
      ("Writes continue on data centre B with eventual consistency", False, "Raft never commits without a majority."),
      ("Writes continue, because Raft tolerates 2 failures", False, "It tolerates 2 failed nodes, but here 3 are lost."),
      ("B automatically shrinks the cluster to 2 members and continues", False,
       "A membership change itself needs a majority to commit, so B cannot make it alone.")]),
    ("90% of a batch job's runtime can be parallelised perfectly. What is the maximum speedup on 10 "
     "processors, according to Amdahl's law?",
     "Speedup = 1 / ((1 - P) + P / N) = 1 / (0.1 + 0.9 / 10) = 1 / 0.19, about 5.26. Even with infinite "
     "processors the limit is 1 / 0.1 = 10.",
     [("About 5.3x", True, "Correct: 1 / 0.19 = 5.26."),
      ("9x", False, "That applies 10 processors to the 90% and ignores the serial 10%."),
      ("10x", False, "10x is the limit with infinitely many processors, not with 10."),
      ("About 1.9x", False, "That misreads the formula; the parallel part shrinks to 0.09.")]),
    ("A web crawler uses a Bloom filter to skip URLs it has already fetched. Which statement is TRUE?",
     "A Bloom filter can report 'maybe present' for an item never inserted (a false positive), but never "
     "'absent' for an inserted item. So the crawler may wrongly skip a few new URLs but never re-fetches a "
     "URL it recorded. Standard Bloom filters cannot delete items.",
     [("It may skip some never-seen URLs (false positives), but it never re-fetches a recorded URL", True,
       "Correct: false positives are possible; false negatives are not."),
      ("It may re-fetch some recorded URLs (false negatives), but never skips a new one", False,
       "This reverses the guarantee: false negatives cannot happen."),
      ("Its error rate falls as more URLs are inserted", False, "More insertions set more bits, so false positives INCREASE."),
      ("Removing a URL clears its bits safely", False, "Clearing bits can erase other items' bits and cause false negatives.")]),
    ("Under snapshot isolation, two on-call doctors each check 'at least 2 doctors on call', see 2, and "
     "each sign themselves off in separate transactions. Both commit, and nobody is on call. What is this "
     "anomaly, and what prevents it?",
     "This is write skew: each transaction read the same snapshot and updated a DIFFERENT row, so no "
     "write-write conflict was detected. SERIALIZABLE isolation (e.g. SSI) or an explicit lock on the rows "
     "read (SELECT ... FOR UPDATE) prevents it.",
     [("Write skew; use SERIALIZABLE isolation or lock the rows that were read (SELECT ... FOR UPDATE)", True,
       "Correct: the conflict is between reads and others' writes, which snapshot isolation does not check."),
      ("Lost update; snapshot isolation already prevents it", False, "They updated different rows, so this is not a lost update, and snapshot isolation allowed it."),
      ("Dirty read; use READ COMMITTED", False, "No uncommitted data was read; both saw committed state."),
      ("Phantom read; add an index on the on-call column", False, "Indexes do not change isolation guarantees.")]),
    ("A server's RSA private key is leaked a year after deployment. An attacker has recorded all past TLS "
     "traffic. Which past sessions remain safe?",
     "Sessions that used ephemeral Diffie-Hellman key exchange (DHE/ECDHE) have forward secrecy: their "
     "session keys were never encrypted with the RSA key and the ephemeral secrets were discarded. Sessions "
     "using static RSA key exchange can be decrypted with the leaked key. TLS 1.3 allows only ephemeral "
     "exchanges.",
     [("Only sessions that used ephemeral (EC)DHE key exchange", True,
       "Correct: forward secrecy protects past sessions even if the long-term key leaks."),
      ("All sessions, because they used AES-256", False, "The AES session key can be recovered from RSA key-exchange sessions."),
      ("None of them", False, "ECDHE sessions remain safe; the RSA key only signed them."),
      ("Only sessions shorter than the certificate's validity", False, "Certificate validity is unrelated to key-exchange secrecy.")]),
    ("An API uses a token bucket with capacity 10 tokens, refilled at 2 tokens per second, and it is full "
     "at t = 0. A client sends 15 requests at t = 0 and 5 more at t = 2.5 s. Each request costs one token. "
     "How many of the 20 are accepted?",
     "At t = 0 the bucket holds 10 tokens: 10 requests are accepted and 5 rejected, leaving 0 tokens. By "
     "t = 2.5 s, 2.5 x 2 = 5 tokens have refilled, so all 5 later requests are accepted. Total: 15.",
     [("15", True, "Correct: 10 at t = 0, plus 5 refilled tokens by t = 2.5 s."),
      ("10", False, "That ignores the refill before the second burst."),
      ("20", False, "The bucket only holds 10 tokens, so the first burst cannot all pass."),
      ("12", False, "That assumes only 2 tokens refilled (one second), not 2.5 seconds x 2 per second.")]),
    ("Solve the recurrence T(n) = 2T(n/2) + n log n for a divide-and-conquer algorithm.",
     "Here a = 2 and b = 2, so n^(log_b a) = n. The combine cost n log n exceeds n by exactly one log "
     "factor, which is the extended case 2 of the master theorem: T(n) = Theta(n log^2 n). Each of the "
     "log n levels costs about n log n.",
     [("Theta(n log^2 n)", True, "Correct: log n levels each costing Theta(n log n)."),
      ("Theta(n log n)", False, "That is the result for combine cost n (as in merge sort), not n log n."),
      ("Theta(n^2)", False, "The combine cost is far below n^2, and the recursion only halves the problem."),
      ("Theta(n)", False, "The combine step alone already costs n log n.")]),
    ("A 'fetch image from URL' feature on a cloud VM lets users submit http://169.254.169.254/latest/"
     "meta-data/iam/security-credentials/. What is the vulnerability, and what is the strongest mitigation?",
     "This is server-side request forgery (SSRF): the server fetches internal addresses on the attacker's "
     "behalf, here the cloud metadata service that hands out IAM credentials. Mitigate with an allowlist of "
     "destinations, blocking private and link-local ranges after DNS resolution, and requiring token-based "
     "metadata access (IMDSv2).",
     [("SSRF; allowlist destinations, block internal and link-local ranges after resolution, and enforce IMDSv2", True,
       "Correct: it stops the server being used as a proxy into the internal network."),
      ("XSS; encode the URL before displaying it", False, "Nothing is rendered to a browser; the server makes the request itself."),
      ("CSRF; add an anti-CSRF token to the form", False, "A CSRF token does not stop a legitimate user submitting a malicious URL."),
      ("Open redirect; validate the redirect parameter", False, "No redirect occurs; the server fetches the URL itself.")]),
    ("Table orders has a composite B-tree index on (customer_id, created_at). Which query can use the "
     "index to avoid a full scan?",
     "A composite index is usable by its leftmost prefix. customer_id = ? with a range on created_at "
     "matches the prefix, then a range on the second column. Filtering only on created_at skips the leading "
     "column, and a function on the column, or a leading wildcard, prevents an index seek.",
     [("WHERE customer_id = 42 AND created_at >= '2026-01-01'", True,
       "Correct: equality on the first column, then a range on the second."),
      ("WHERE created_at >= '2026-01-01'", False, "The leading column is missing, so the index cannot be seeked."),
      ("WHERE YEAR(created_at) = 2026 AND customer_id + 0 = 42", False, "Functions on the indexed columns prevent a seek."),
      ("WHERE CAST(customer_id AS CHAR) LIKE '%42'", False, "The cast plus a leading wildcard force a scan.")]),
]

STAGES = {"quarterfinal": QUARTERFINAL, "semifinal": SEMIFINAL, "final": FINAL}

for name, items in STAGES.items():
    assert len(items) == 10, name
    for stem, _, choices in items:
        assert sum(1 for _, ok, _ in choices if ok) == 1, stem[:60]

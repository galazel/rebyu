"""CodeStrike problem set: nine competitive problems, three per roadmap node.

Each problem embeds its own data in the starter code, because a CodeStrike answer is
graded by running the learner's program once with NO input and comparing its stdout
with `expected_output`. The expected output is never typed by hand: it is produced by
running the reference solution on exactly the starter-code data (see `build()`).

Data is generated from fixed seeds so it is large enough that working it out by hand
is not realistic, yet identical every time this file is run.
"""
from __future__ import annotations

import contextlib
import io
import random
import textwrap

NO_INPUT_NOTE = (
    "\n\nYour program receives no input: the data is already defined in the starter code. "
    "Keep it as given, and print exactly the output described above -- the judge compares "
    "your output with the expected output character for character (trailing spaces ignored)."
)


def _r(seed: int) -> random.Random:
    return random.Random(seed)


# ---------------------------------------------------------------- node 1
def p1_conference_rooms():
    rng = _r(101)
    meetings = []
    for _ in range(60):
        start = rng.randrange(8 * 60, 18 * 60, 5)
        length = rng.choice([15, 30, 30, 45, 60, 60, 90, 120])
        meetings.append((start, min(start + length, 20 * 60)))
    data = f"meetings = {meetings!r}  # (start_minute, end_minute), half-open [start, end)"
    stub = textwrap.dedent("""
        def plan_rooms(meetings):
            # Return (rooms_needed, first_peak_start, first_peak_end)
            pass

        rooms, peak_start, peak_end = plan_rooms(meetings)
        print(rooms)
        print(f"{peak_start // 60:02d}:{peak_start % 60:02d}-{peak_end // 60:02d}:{peak_end % 60:02d}")
    """)
    ref = textwrap.dedent("""
        def plan_rooms(meetings):
            events = []
            for s, e in meetings:
                events.append((s, 1))
                events.append((e, -1))
            events.sort(key=lambda x: (x[0], x[1]))   # end (-1) before start (+1) at the same minute
            cur = best = 0
            best_start = best_end = None
            for i, (t, d) in enumerate(events):
                cur += d
                if cur > best:
                    best, best_start, best_end = cur, t, None
                if best_end is None and best_start is not None and cur < best:
                    best_end = t
            return best, best_start, best_end

        rooms, peak_start, peak_end = plan_rooms(meetings)
        print(rooms)
        print(f"{peak_start // 60:02d}:{peak_start % 60:02d}-{peak_end // 60:02d}:{peak_end % 60:02d}")
    """)
    return dict(
        title="Conference room planner",
        statement=(
            "A company books 60 meetings in its conference centre. Each meeting is a half-open interval "
            "[start, end) in minutes after midnight, so a meeting ending at 10:00 and one starting at 10:00 "
            "do not overlap.\n\n"
            "Write `plan_rooms(meetings)` and print two lines:\n"
            "1. The minimum number of rooms needed so that no two overlapping meetings share a room.\n"
            "2. The FIRST time window in which that maximum is reached, as HH:MM-HH:MM: from the moment "
            "the number of simultaneous meetings first reaches the maximum, until the first moment it drops "
            "below it again.\n\n"
            "Expected complexity: O(n log n). Comparing every pair of meetings does not find the window."),
        data=data, stub=stub, ref=ref,
        explanation=(
            "Turn every meeting into a +1 event at its start and a -1 event at its end, sort them by time "
            "with ends before starts at the same minute (half-open intervals), and sweep while keeping a "
            "running count. The maximum running count is the number of rooms; the window opens at the event "
            "where the count first reaches that maximum and closes at the next event that lowers it."),
        mistake=(
            "Sorting starts before ends at equal times, which counts back-to-back meetings as overlapping "
            "and over-reports rooms; or reporting the last peak window instead of the first."),
    )


def p2_lru_cache():
    rng = _r(202)
    keys = [f"user:{n}" for n in range(1, 13)]
    ops = []
    for _ in range(90):
        k = rng.choice(keys[:6]) if rng.random() < 0.6 else rng.choice(keys)
        ops.append(("get", k) if rng.random() < 0.65 else ("put", k))
    data = f"capacity = 5\nops = {ops!r}"
    stub = textwrap.dedent("""
        def simulate(capacity, ops):
            # Return (hits, misses, evicted_keys_in_order)
            pass

        hits, misses, evicted = simulate(capacity, ops)
        print(f"hits={hits} misses={misses}")
        print(",".join(evicted) if evicted else "none")
    """)
    ref = textwrap.dedent("""
        from collections import OrderedDict

        def simulate(capacity, ops):
            cache = OrderedDict()
            hits = misses = 0
            evicted = []
            for op, key in ops:
                if key in cache:
                    cache.move_to_end(key)
                    if op == "get":
                        hits += 1
                    continue
                if op == "get":
                    misses += 1          # a miss loads the value into the cache
                cache[key] = True
                if len(cache) > capacity:
                    old, _ = cache.popitem(last=False)
                    evicted.append(old)
            return hits, misses, evicted

        hits, misses, evicted = simulate(capacity, ops)
        print(f"hits={hits} misses={misses}")
        print(",".join(evicted) if evicted else "none")
    """)
    return dict(
        title="LRU cache in front of a user service",
        statement=(
            "A service puts an LRU cache of capacity 5 in front of its user database and replays 90 "
            "operations against it:\n"
            "- (\"get\", key): if the key is cached it is a HIT and becomes most recently used. Otherwise it "
            "is a MISS: the value is loaded from the database and inserted as most recently used.\n"
            "- (\"put\", key): the key is written; it becomes (or is inserted as) most recently used. A put "
            "is neither a hit nor a miss.\n"
            "Whenever an insertion makes the cache exceed its capacity, the least recently used key is "
            "evicted.\n\n"
            "Print `hits=H misses=M` on the first line and, on the second, the evicted keys in eviction "
            "order separated by commas (or `none`).\n\n"
            "Each operation must be O(1); a solution that scans the cache to find the oldest key passes "
            "here but would not survive production traffic."),
        data=data, stub=stub, ref=ref,
        explanation=(
            "Keep the keys in an ordered map (or a hash map plus a doubly linked list). Every access moves "
            "the key to the most-recent end; an insertion beyond capacity removes the key at the "
            "least-recent end. A get miss is also an insertion, because the value is loaded into the cache."),
        mistake=(
            "Forgetting that a put on an existing key refreshes its recency, or not inserting the key on a "
            "get miss, which changes every later eviction."),
    )


def p3_longest_prefix_match():
    rng = _r(303)
    routes = [("0.0.0.0/0", "ISP")]
    for _ in range(18):
        a, b = rng.choice([10, 172, 192]), rng.randrange(0, 32)
        length = rng.choice([8, 12, 16, 16, 20, 24, 24, 28])
        ip = (a << 24) | (b << 16) | (rng.randrange(0, 256) << 8)
        mask = (0xFFFFFFFF << (32 - length)) & 0xFFFFFFFF
        net = ip & mask
        routes.append((f"{net >> 24}.{(net >> 16) & 255}.{(net >> 8) & 255}.{net & 255}/{length}",
                       rng.choice(["eth0", "eth1", "eth2", "vpn0", "vpn1"])))
    packets = []
    for _ in range(25):
        a, b = rng.choice([10, 172, 192, 8]), rng.randrange(0, 32)
        packets.append(f"{a}.{b}.{rng.randrange(256)}.{rng.randrange(256)}")
    data = f"routes = {routes!r}\npackets = {packets!r}"
    stub = textwrap.dedent("""
        from collections import Counter

        def route(routes, packets):
            # Return the outgoing interface for each packet, in order
            pass

        out = route(routes, packets)
        for interface, count in sorted(Counter(out).items()):
            print(f"{interface} {count}")
    """)
    ref = textwrap.dedent("""
        from collections import Counter

        def to_int(ip):
            a, b, c, d = map(int, ip.split("."))
            return (a << 24) | (b << 16) | (c << 8) | d

        def route(routes, packets):
            table = []
            for cidr, iface in routes:
                net, length = cidr.split("/")
                length = int(length)
                mask = (0xFFFFFFFF << (32 - length)) & 0xFFFFFFFF if length else 0
                table.append((length, to_int(net) & mask, mask, iface))
            out = []
            for p in packets:
                ip = to_int(p)
                best = max((t for t in table if ip & t[2] == t[1]), key=lambda t: t[0])
                out.append(best[3])
            return out

        out = route(routes, packets)
        for interface, count in sorted(Counter(out).items()):
            print(f"{interface} {count}")
    """)
    return dict(
        title="Longest-prefix-match router",
        statement=(
            "A router has a routing table of (CIDR prefix, interface) entries, including a default route "
            "0.0.0.0/0. For each packet's destination address it must choose the entry whose prefix "
            "contains the address with the LONGEST prefix length (longest-prefix match).\n\n"
            "Route all 25 packets and print, for each interface used, `interface count`, sorted by "
            "interface name.\n\n"
            "Convert addresses to 32-bit integers and compare them under each prefix's mask. String "
            "matching on the dotted form is wrong for any prefix length that is not a multiple of 8."),
        data=data, stub=stub, ref=ref,
        explanation=(
            "Convert each address to a 32-bit integer and build a mask of `length` leading 1 bits for "
            "every prefix. A route matches when (address & mask) == network. Among all matches, the "
            "longest prefix wins, and the /0 default route matches everything as the fallback."),
        mistake=(
            "Comparing the dotted strings, which only works for /8, /16 and /24 and misroutes the /12, /20 "
            "and /28 entries; or taking the first matching route instead of the longest."),
    )


# ---------------------------------------------------------------- node 2
def p4_grid_with_breaks():
    rng = _r(404)
    rows, cols = 14, 18
    grid = []
    for r in range(rows):
        line = "".join("#" if rng.random() < 0.34 else "." for _ in range(cols))
        grid.append(line)
    grid[0] = "S" + grid[0][1:]
    grid[-1] = grid[-1][:-1] + "E"
    data = f"k = 2  # walls you may break\ngrid = {grid!r}"
    stub = textwrap.dedent("""
        def shortest(grid, k):
            # Return the minimum number of moves from S to E, or -1
            pass

        print(shortest(grid, k))
    """)
    ref = textwrap.dedent("""
        from collections import deque

        def shortest(grid, k):
            rows, cols = len(grid), len(grid[0])
            start = next((r, c) for r in range(rows) for c in range(cols) if grid[r][c] == "S")
            seen = {(start[0], start[1], 0)}
            queue = deque([(start[0], start[1], 0, 0)])
            while queue:
                r, c, used, dist = queue.popleft()
                if grid[r][c] == "E":
                    return dist
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < rows and 0 <= nc < cols:
                        nu = used + (grid[nr][nc] == "#")
                        if nu <= k and (nr, nc, nu) not in seen:
                            seen.add((nr, nc, nu))
                            queue.append((nr, nc, nu, dist + 1))
            return -1

        print(shortest(grid, k))
    """)
    return dict(
        title="Evacuation route with breachable walls",
        statement=(
            "A building floor is a grid: `S` is the start, `E` the exit, `.` open floor and `#` a wall. "
            "Each move goes one cell up, down, left or right. Rescuers may break through at most k = 2 "
            "walls; moving into a wall cell breaks it (that move still counts as one move).\n\n"
            "Print the minimum number of moves from S to E, or -1 if it is impossible.\n\n"
            "Plain BFS on cells is not enough: the same cell reached with fewer walls broken is a "
            "different, better state."),
        data=data, stub=stub, ref=ref,
        explanation=(
            "Run BFS over states (row, col, walls_broken). Moving into `#` increases walls_broken, and a "
            "state is only valid while walls_broken <= k. Because every move costs 1, the first time BFS "
            "reaches E is the shortest route."),
        mistake=(
            "Marking a cell visited regardless of how many walls were broken to reach it, which discards a "
            "later path that arrives with walls to spare and returns a longer route or -1."),
    )


def p5_critical_path():
    rng = _r(505)
    n = 18
    tasks = {}
    for i in range(n):
        name = f"T{i + 1:02d}"
        deps = sorted(rng.sample([f"T{j + 1:02d}" for j in range(i)], k=min(i, rng.choice([0, 1, 2, 2, 3]))))
        tasks[name] = (rng.randrange(2, 12), deps)
    data = f"tasks = {tasks!r}  # name: (duration_days, prerequisites)"
    stub = textwrap.dedent("""
        def critical_path(tasks):
            # Return (project_days, [task names on the critical path, in order])
            pass

        days, path = critical_path(tasks)
        print(days)
        print(" -> ".join(path))
    """)
    ref = textwrap.dedent("""
        def critical_path(tasks):
            order, seen = [], set()
            def visit(t):
                if t in seen:
                    return
                seen.add(t)
                for d in tasks[t][1]:
                    visit(d)
                order.append(t)
            for t in sorted(tasks):
                visit(t)
            finish, prev = {}, {}
            for t in order:
                dur, deps = tasks[t]
                start, best = 0, None
                for d in sorted(deps):
                    if finish[d] > start:
                        start, best = finish[d], d
                finish[t] = start + dur
                prev[t] = best
            end = max(sorted(tasks), key=lambda t: finish[t])
            path = []
            while end is not None:
                path.append(end)
                end = prev[end]
            return max(finish.values()), path[::-1]

        days, path = critical_path(tasks)
        print(days)
        print(" -> ".join(path))
    """)
    return dict(
        title="Release plan critical path",
        statement=(
            "A release has 18 tasks. Each task has a duration in days and a list of prerequisite tasks "
            "that must finish before it can start. There are enough engineers to run any number of tasks "
            "in parallel.\n\n"
            "Print the minimum number of days to finish everything on the first line. On the second, "
            "print the critical path (the chain of tasks that sets that length) as `T01 -> T05 -> ...`.\n\n"
            "Tie-breaks, so the path is unique: the path ends at the task with the latest finish, choosing "
            "the alphabetically smallest name on a tie; walking backwards, each task's predecessor is the "
            "prerequisite that finishes latest, again choosing the alphabetically smallest on a tie."),
        data=data, stub=stub, ref=ref,
        explanation=(
            "Process tasks in topological order. A task starts when its latest prerequisite finishes, so "
            "finish = duration + max(finish of prerequisites). The project length is the largest finish "
            "time, and following each task's latest-finishing prerequisite backwards traces the critical "
            "path."),
        mistake=(
            "Adding up all durations, which assumes no parallel work, or computing finish times in input "
            "order instead of topological order so a task is scheduled before its prerequisites."),
    )


def p6_nested_containers():
    rng = _r(606)
    boxes = [(rng.randrange(10, 200), rng.randrange(10, 200)) for _ in range(70)]
    data = f"boxes = {boxes!r}  # (width_cm, depth_cm); boxes cannot be rotated"
    stub = textwrap.dedent("""
        def max_nesting(boxes):
            # Return the length of the longest chain of boxes that nest inside each other
            pass

        print(max_nesting(boxes))
    """)
    ref = textwrap.dedent("""
        from bisect import bisect_left

        def max_nesting(boxes):
            ordered = sorted(set(boxes), key=lambda b: (b[0], -b[1]))
            tails = []
            for _, d in ordered:
                i = bisect_left(tails, d)
                if i == len(tails):
                    tails.append(d)
                else:
                    tails[i] = d
            return len(tails)

        print(max_nesting(boxes))
    """)
    return dict(
        title="Shipping container nesting",
        statement=(
            "A logistics company wants to nest empty containers inside each other for return shipping. "
            "Box A fits inside box B only if A's width < B's width AND A's depth < B's depth (strictly; "
            "boxes cannot be rotated).\n\n"
            "Print the maximum number of boxes in a single nested chain.\n\n"
            "Target O(n log n). Sorting by width alone and counting, or a greedy pass, gives the wrong "
            "answer when widths are equal."),
        data=data, stub=stub, ref=ref,
        explanation=(
            "Sort by width ascending and, for equal widths, by depth descending. Equal widths can then "
            "never chain. The answer is the longest strictly increasing subsequence of the depths, found "
            "in O(n log n) with patience sorting (binary search over the smallest tail of each length)."),
        mistake=(
            "Sorting equal widths by depth ascending, which lets two boxes of the same width appear to "
            "nest and over-counts the chain."),
    )


# ---------------------------------------------------------------- node 3
def p7_max_flow():
    rng = _r(707)
    nodes = ["DC"] + [f"R{i}" for i in range(1, 9)] + ["EDGE"]
    links = {}
    for i, a in enumerate(nodes[:-1]):
        for b in rng.sample(nodes[i + 1:], k=min(3, len(nodes) - i - 1)):
            links[(a, b)] = rng.choice([10, 20, 25, 40, 50, 100])
    for _ in range(4):
        a, b = rng.sample(nodes[1:-1], 2)
        links[(a, b)] = rng.choice([10, 15, 30])
    links = [(a, b, c) for (a, b), c in links.items()]
    data = f"links = {links!r}  # (from, to, capacity_gbps), one-directional\nsource, sink = 'DC', 'EDGE'"
    stub = textwrap.dedent("""
        def max_throughput(links, source, sink):
            # Return (max_flow_gbps, number_of_saturated_links_in_your_min_cut)
            pass

        flow, cut = max_throughput(links, source, sink)
        print(flow)
        print(cut)
    """)
    ref = textwrap.dedent("""
        from collections import defaultdict, deque

        def max_throughput(links, source, sink):
            cap = defaultdict(int)
            adj = defaultdict(set)
            for a, b, c in links:
                cap[(a, b)] += c
                adj[a].add(b)
                adj[b].add(a)
            flow = 0
            while True:
                parent = {source: None}
                q = deque([source])
                while q and sink not in parent:
                    u = q.popleft()
                    for v in sorted(adj[u]):
                        if v not in parent and cap[(u, v)] > 0:
                            parent[v] = u
                            q.append(v)
                if sink not in parent:
                    break
                v, push = sink, float("inf")
                while parent[v] is not None:
                    push = min(push, cap[(parent[v], v)])
                    v = parent[v]
                v = sink
                while parent[v] is not None:
                    cap[(parent[v], v)] -= push
                    cap[(v, parent[v])] += push
                    v = parent[v]
                flow += push
            reach = set(parent)
            cut = sum(1 for a, b, c in links if a in reach and b not in reach)
            return flow, cut

        flow, cut = max_throughput(links, source, sink)
        print(flow)
        print(cut)
    """)
    return dict(
        title="Backbone throughput (max flow / min cut)",
        statement=(
            "A data centre (DC) reaches the edge network (EDGE) through a mesh of routers. Every link is "
            "one-directional with a capacity in Gbps, and traffic may be split across any number of "
            "paths.\n\n"
            "Line 1: the maximum total throughput from DC to EDGE.\n"
            "Line 2: the number of links in the minimum cut, taking as the cut every link that goes from "
            "the set of routers still reachable from DC in the final residual network to a router outside "
            "that set.\n\n"
            "This is a maximum-flow problem (Ford-Fulkerson with BFS, i.e. Edmonds-Karp). Summing the "
            "capacities leaving DC, or taking the best single path, gives the wrong number."),
        data=data, stub=stub, ref=ref,
        explanation=(
            "Repeatedly find an augmenting path in the residual graph with BFS, push its bottleneck "
            "capacity, and add reverse residual edges so flow can be rerouted later. When no path remains, "
            "the flow is maximal. The routers still reachable from DC define the minimum cut, and by the "
            "max-flow min-cut theorem its capacity equals the flow."),
        mistake=(
            "Not adding reverse residual capacity, so an early greedy path can never be undone and the "
            "result falls short of the true maximum."),
    )


def p8_weighted_jobs():
    rng = _r(808)
    jobs = []
    for i in range(50):
        start = rng.randrange(0, 200)
        jobs.append((f"J{i + 1:02d}", start, start + rng.randrange(5, 40), rng.randrange(10, 120)))
    data = f"jobs = {jobs!r}  # (id, start_hour, end_hour, profit); a job may start when another ends"
    stub = textwrap.dedent("""
        def best_schedule(jobs):
            # Return (max_profit, sorted list of chosen job ids)
            pass

        profit, chosen = best_schedule(jobs)
        print(profit)
        print(" ".join(chosen))
    """)
    ref = textwrap.dedent("""
        from bisect import bisect_right

        def best_schedule(jobs):
            js = sorted(jobs, key=lambda j: (j[2], j[1], j[0]))
            ends = [j[2] for j in js]
            n = len(js)
            dp = [0] * (n + 1)
            take = [False] * (n + 1)
            prev = [0] * (n + 1)
            for i in range(1, n + 1):
                _, s, e, p = js[i - 1]
                k = bisect_right(ends, s, 0, i - 1)
                prev[i] = k
                if dp[k] + p > dp[i - 1]:
                    dp[i], take[i] = dp[k] + p, True
                else:
                    dp[i] = dp[i - 1]
            chosen, i = [], n
            while i > 0:
                if take[i]:
                    chosen.append(js[i - 1][0])
                    i = prev[i]
                else:
                    i -= 1
            return dp[n], sorted(chosen)

        profit, chosen = best_schedule(jobs)
        print(profit)
        print(" ".join(chosen))
    """)
    return dict(
        title="Render farm job selection",
        statement=(
            "A render farm machine can run one job at a time. There are 50 job offers, each with a start "
            "hour, end hour and profit. A job may start exactly when the previous one ends.\n\n"
            "Print the maximum total profit on the first line and, on the second, the ids of a set of jobs "
            "that achieves it, sorted and separated by spaces.\n\n"
            "Rule for a unique answer: sort jobs by (end, start, id). For each job in that order, take it "
            "only when taking it is STRICTLY better than skipping it.\n\n"
            "Greedy by profit or by earliest end does not maximise profit; this needs dynamic programming "
            "with binary search (O(n log n))."),
        data=data, stub=stub, ref=ref,
        explanation=(
            "Sort jobs by end time. dp[i] is the best profit using the first i jobs: either skip job i "
            "(dp[i-1]) or take it and add its profit to dp[k], where k counts the jobs ending no later "
            "than job i starts, found by binary search. Backtracking through the 'take' decisions recovers "
            "the chosen jobs."),
        mistake=(
            "Using the earliest-finish greedy, which maximises the NUMBER of jobs, not the profit; or using "
            "a strict comparison on end <= start and wrongly forbidding back-to-back jobs."),
    )


def p9_mst_with_existing():
    rng = _r(909)
    sites = [f"S{i:02d}" for i in range(1, 21)]
    existing = [tuple(rng.sample(sites, 2)) for _ in range(6)]
    offers = []
    for _ in range(55):
        a, b = rng.sample(sites, 2)
        offers.append((a, b, rng.randrange(5, 90)))
    data = (f"sites = {sites!r}\nexisting = {existing!r}  # links already owned (free)\n"
            f"offers = {offers!r}  # (site_a, site_b, cost_k_usd)")
    stub = textwrap.dedent("""
        def connect(sites, existing, offers):
            # Return (minimum extra cost, number of offers bought), or (-1, -1) if impossible
            pass

        cost, bought = connect(sites, existing, offers)
        print(cost)
        print(bought)
    """)
    ref = textwrap.dedent("""
        def connect(sites, existing, offers):
            parent = {s: s for s in sites}
            def find(x):
                while parent[x] != x:
                    parent[x] = parent[parent[x]]
                    x = parent[x]
                return x
            def union(a, b):
                ra, rb = find(a), find(b)
                if ra == rb:
                    return False
                parent[ra] = rb
                return True
            groups = len(sites)
            for a, b in existing:
                if union(a, b):
                    groups -= 1
            cost = bought = 0
            for a, b, c in sorted(offers, key=lambda o: (o[2], o[0], o[1])):
                if union(a, b):
                    cost += c
                    bought += 1
                    groups -= 1
            return (cost, bought) if groups == 1 else (-1, -1)

        cost, bought = connect(sites, existing, offers)
        print(cost)
        print(bought)
    """)
    return dict(
        title="Connecting branch offices at minimum cost",
        statement=(
            "A company must connect 20 branch sites into one network. Some links are already owned and "
            "cost nothing. A carrier offers further links between pairs of sites, each with a cost.\n\n"
            "Print the minimum additional cost to make every site reachable from every other on line 1, "
            "and the number of offered links bought on line 2. If it cannot be done, print -1 twice.\n\n"
            "Treat the owned links as already merged components before choosing offers; this is a "
            "minimum spanning tree (Kruskal with union-find) over the remaining components."),
        data=data, stub=stub, ref=ref,
        explanation=(
            "Union all owned links first, so the sites they connect form free components. Then run "
            "Kruskal: sort the offers by cost and buy each one that joins two different components "
            "(union-find detects this in near-constant time) until a single component remains."),
        mistake=(
            "Running Kruskal on the offers alone and ignoring the owned links, which buys links that "
            "duplicate existing connectivity and overstates the cost."),
    )


PROBLEMS = [
    (1, p1_conference_rooms), (1, p2_lru_cache), (1, p3_longest_prefix_match),
    (2, p4_grid_with_breaks), (2, p5_critical_path), (2, p6_nested_containers),
    (3, p7_max_flow), (3, p8_weighted_jobs), (3, p9_mst_with_existing),
]


def _run(code: str) -> str:
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        exec(compile(code, "<reference>", "exec"), {"__name__": "__main__"})
    return buffer.getvalue().rstrip()


def build() -> list[dict]:
    """Every problem with its starter code and the expected output its reference prints."""
    built = []
    for node, make in PROBLEMS:
        p = make()
        expected = _run(p["data"] + "\n" + p["ref"])
        stub_output = None
        try:
            stub_output = _run(p["data"] + "\n" + p["stub"])
        except Exception:
            pass
        assert stub_output != expected, f"{p['title']}: the empty stub already prints the answer"
        built.append(dict(
            node=node,
            title=p["title"],
            question=f"{p['title']}\n\n{p['statement']}{NO_INPUT_NOTE}",
            starter=p["data"] + "\n" + p["stub"].lstrip("\n"),
            reference=p["data"] + "\n" + p["ref"].lstrip("\n"),
            expected=expected,
            explanation=p["explanation"] + "\n\nCommon mistake: " + p["mistake"],
        ))
    return built


if __name__ == "__main__":
    for item in build():
        print(f"--- node {item['node']}: {item['title']}")
        print(item["expected"])

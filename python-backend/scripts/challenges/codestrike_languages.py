"""CodeStrike in eight languages: each live problem keeps its data and its answer,
but is posed in a different language from the learner editor.

    1 JavaScript  2 Java  3 C  4 C++  5 SQL  6 Pseudocode  7 C#  8 Python  9 Java

`build(problem_number, live_starter)` returns (language, starter_code, reference) with
the data lifted out of the live Python starter, so data and expected output stay
identical. The reference is run on Judge0 (Pseudocode: the existing Python reference)
and must print the live expected output exactly -- see `verify_codestrike_languages.py`.
"""
from __future__ import annotations

import json

LANGUAGE = {1: "JAVASCRIPT", 2: "JAVA", 3: "C", 4: "C++", 5: "SQL", 6: "PSEUDOCODE", 7: "C#", 8: "PYTHON", 9: "JAVA"}
LABEL = {"JAVASCRIPT": "JavaScript", "JAVA": "Java", "C": "C", "C++": "C++", "SQL": "SQL",
         "PSEUDOCODE": "Pseudocode", "C#": "C#", "PYTHON": "Python"}


def data_of(live_starter: str) -> dict:
    """Runs only the data lines of the live Python starter (everything before the first def)."""
    head = live_starter.split("\ndef ", 1)[0]
    head = "\n".join(line for line in head.splitlines() if not line.startswith(("from ", "import ")))
    scope: dict = {}
    exec(head, scope)
    return {k: v for k, v in scope.items() if not k.startswith("__")}


def q(s: str) -> str:
    return json.dumps(s)


# ---------------------------------------------------------------- 1 JavaScript
def p1(d):
    data = "const meetings = [\n  " + ",\n  ".join(f"[{s}, {e}]" for s, e in d["meetings"]) + \
           "\n]; // [startMinute, endMinute], half-open [start, end)\n"
    tail = """
const [rooms, peakStart, peakEnd] = planRooms(meetings);
const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
console.log(rooms);
console.log(hhmm(peakStart) + "-" + hhmm(peakEnd));
"""
    starter = data + """
function planRooms(meetings) {
  // Return [roomsNeeded, firstPeakStart, firstPeakEnd]
}
""" + tail
    ref = data + """
function planRooms(meetings) {
  const events = [];
  for (const [s, e] of meetings) { events.push([s, 1]); events.push([e, -1]); }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // an end (-1) before a start (+1) at the same minute
  let cur = 0, best = 0, bestStart = null, bestEnd = null;
  for (const [t, delta] of events) {
    cur += delta;
    if (cur > best) { best = cur; bestStart = t; bestEnd = null; }
    if (bestEnd === null && bestStart !== null && cur < best) bestEnd = t;
  }
  return [best, bestStart, bestEnd];
}
""" + tail
    return starter, ref


# ---------------------------------------------------------------- 2 Java
def p2(d):
    ops = ",\n            ".join(f"{{{q(op)}, {q(key)}}}" for op, key in d["ops"])
    head = f"""import java.util.*;

public class Main {{
    static final int CAPACITY = {d['capacity']};
    static final String[][] OPS = {{
            {ops}
    }}; // {{operation, key}}
"""
    tail = """
    public static void main(String[] args) {
        List<String> evicted = new ArrayList<>();
        int[] counts = simulate(CAPACITY, OPS, evicted); // {hits, misses}
        System.out.println("hits=" + counts[0] + " misses=" + counts[1]);
        System.out.println(evicted.isEmpty() ? "none" : String.join(",", evicted));
    }
}
"""
    starter = head + """
    /** Replays OPS against an LRU cache; returns {hits, misses} and fills evicted in eviction order. */
    static int[] simulate(int capacity, String[][] ops, List<String> evicted) {
        // Each operation must be O(1).
        return new int[] {0, 0};
    }
""" + tail
    ref = head + """
    static int[] simulate(int capacity, String[][] ops, List<String> evicted) {
        LinkedHashMap<String, Boolean> cache = new LinkedHashMap<>(16, 0.75f, true); // access order
        int hits = 0, misses = 0;
        for (String[] op : ops) {
            String kind = op[0], key = op[1];
            if (cache.containsKey(key)) {
                cache.get(key); // refresh recency
                if (kind.equals("get")) hits++;
                continue;
            }
            if (kind.equals("get")) misses++;
            cache.put(key, Boolean.TRUE);
            if (cache.size() > capacity) {
                String oldest = cache.keySet().iterator().next();
                cache.remove(oldest);
                evicted.add(oldest);
            }
        }
        return new int[] {hits, misses};
    }
""" + tail
    return starter, ref


# ---------------------------------------------------------------- 3 C
def p3(d):
    routes = ",\n    ".join(f"{{{q(c)}, {q(i)}}}" for c, i in d["routes"])
    packets = ",\n    ".join(q(p) for p in d["packets"])
    head = f"""#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define ROUTE_COUNT {len(d['routes'])}
#define PACKET_COUNT {len(d['packets'])}

static const char *ROUTES[ROUTE_COUNT][2] = {{
    {routes}
}}; /* {{CIDR prefix, interface}} */

static const char *PACKETS[PACKET_COUNT] = {{
    {packets}
}};
"""
    main = """
int main(void) {
    const char *chosen[PACKET_COUNT];
    route_all(chosen);
    print_counts(chosen); /* "interface count" per interface used, sorted by interface name */
    return 0;
}
"""
    starter = head + """
/* Fill chosen[i] with the outgoing interface for PACKETS[i] (longest-prefix match). */
void route_all(const char *chosen[PACKET_COUNT]) {
    /* Convert each address to a 32-bit unsigned integer and compare under each prefix's mask. */
}

/* Print "interface count" for each interface used, sorted by interface name. */
void print_counts(const char *chosen[PACKET_COUNT]) {
}
""" + main
    ref = head + """
static unsigned int to_int(const char *ip) {
    unsigned int a, b, c, d;
    sscanf(ip, "%u.%u.%u.%u", &a, &b, &c, &d);
    return (a << 24) | (b << 16) | (c << 8) | d;
}

void route_all(const char *chosen[PACKET_COUNT]) {
    unsigned int net[ROUTE_COUNT], mask[ROUTE_COUNT];
    int len[ROUTE_COUNT];
    for (int r = 0; r < ROUTE_COUNT; r++) {
        char buf[32];
        strcpy(buf, ROUTES[r][0]);
        char *slash = strchr(buf, '/');
        *slash = '\\0';
        len[r] = atoi(slash + 1);
        mask[r] = len[r] == 0 ? 0u : (0xFFFFFFFFu << (32 - len[r]));
        net[r] = to_int(buf) & mask[r];
    }
    for (int p = 0; p < PACKET_COUNT; p++) {
        unsigned int ip = to_int(PACKETS[p]);
        int best = -1;
        for (int r = 0; r < ROUTE_COUNT; r++)
            if ((ip & mask[r]) == net[r] && (best < 0 || len[r] > len[best]))
                best = r;
        chosen[p] = ROUTES[best][1];
    }
}

static int by_name(const void *a, const void *b) {
    return strcmp(*(const char *const *)a, *(const char *const *)b);
}

void print_counts(const char *chosen[PACKET_COUNT]) {
    const char *sorted[PACKET_COUNT];
    memcpy(sorted, chosen, sizeof(sorted));
    qsort(sorted, PACKET_COUNT, sizeof(sorted[0]), by_name);
    for (int i = 0; i < PACKET_COUNT;) {
        int j = i;
        while (j < PACKET_COUNT && strcmp(sorted[j], sorted[i]) == 0) j++;
        printf("%s %d\\n", sorted[i], j - i);
        i = j;
    }
}
""" + main
    return starter, ref


# ---------------------------------------------------------------- 4 C++
def p4(d):
    grid = ",\n    ".join(q(row) for row in d["grid"])
    head = f"""#include <iostream>
#include <queue>
#include <string>
#include <tuple>
#include <vector>
using namespace std;

const int K = {d['k']}; // walls you may break
const vector<string> GRID = {{
    {grid}
}};
"""
    main = """
int main() {
    cout << shortest(GRID, K) << endl;
    return 0;
}
"""
    starter = head + """
// Minimum number of moves from S to E breaking at most k walls, or -1.
int shortest(const vector<string>& grid, int k) {
    return -1;
}
""" + main
    ref = head + """
int shortest(const vector<string>& grid, int k) {
    int rows = grid.size(), cols = grid[0].size();
    int sr = 0, sc = 0;
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++)
            if (grid[r][c] == 'S') { sr = r; sc = c; }
    vector<vector<vector<bool>>> seen(rows, vector<vector<bool>>(cols, vector<bool>(k + 1, false)));
    queue<tuple<int, int, int, int>> q;
    seen[sr][sc][0] = true;
    q.push({sr, sc, 0, 0});
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        auto [r, c, used, dist] = q.front();
        q.pop();
        if (grid[r][c] == 'E') return dist;
        for (int i = 0; i < 4; i++) {
            int nr = r + dr[i], nc = c + dc[i];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            int nu = used + (grid[nr][nc] == '#' ? 1 : 0);
            if (nu <= k && !seen[nr][nc][nu]) {
                seen[nr][nc][nu] = true;
                q.push({nr, nc, nu, dist + 1});
            }
        }
    }
    return -1;
}
""" + main
    return starter, ref


# ---------------------------------------------------------------- 5 SQL (SQLite)
def p5(d):
    tasks = d["tasks"]
    rows = ",\n  ".join(f"('{n}', {dur})" for n, (dur, _) in sorted(tasks.items()))
    reqs = ",\n  ".join(f"('{n}', '{r}')" for n, (_, deps) in sorted(tasks.items()) for r in deps)
    schema = f"""-- SQLite. A task can start only when all of its prerequisites have finished.
CREATE TABLE task (name TEXT PRIMARY KEY, duration_days INTEGER NOT NULL);
CREATE TABLE prerequisite (task TEXT NOT NULL, requires TEXT NOT NULL);

INSERT INTO task (name, duration_days) VALUES
  {rows};

INSERT INTO prerequisite (task, requires) VALUES
  {reqs};
"""
    starter = schema + """
-- Write TWO queries:
--   1. one row, one column: the minimum number of days to finish every task;
--   2. one row, one column: the critical path as 'T01 -> T05 -> ...'.
-- Tie-breaks are in the problem statement. Hint: WITH RECURSIVE.
"""
    ref = schema + """
WITH RECURSIVE
  finish_path(name, finish) AS (
    SELECT name, duration_days FROM task
    WHERE name NOT IN (SELECT task FROM prerequisite)
    UNION ALL
    SELECT p.task, fp.finish + t.duration_days
    FROM finish_path fp
    JOIN prerequisite p ON p.requires = fp.name
    JOIN task t ON t.name = p.task
  ),
  finish AS (SELECT name, MAX(finish) AS finish FROM finish_path GROUP BY name)
SELECT MAX(finish) FROM finish;

WITH RECURSIVE
  finish_path(name, finish) AS (
    SELECT name, duration_days FROM task
    WHERE name NOT IN (SELECT task FROM prerequisite)
    UNION ALL
    SELECT p.task, fp.finish + t.duration_days
    FROM finish_path fp
    JOIN prerequisite p ON p.requires = fp.name
    JOIN task t ON t.name = p.task
  ),
  finish AS (SELECT name, MAX(finish) AS finish FROM finish_path GROUP BY name),
  ranked_prev AS (
    SELECT p.task, p.requires,
           ROW_NUMBER() OVER (PARTITION BY p.task ORDER BY f.finish DESC, p.requires ASC) AS rn
    FROM prerequisite p JOIN finish f ON f.name = p.requires
  ),
  prev AS (SELECT task, requires FROM ranked_prev WHERE rn = 1),
  last_task AS (SELECT name FROM finish ORDER BY finish DESC, name ASC LIMIT 1),
  walk(name, path) AS (
    SELECT name, name FROM last_task
    UNION ALL
    SELECT pv.requires, pv.requires || ' -> ' || w.path
    FROM walk w JOIN prev pv ON pv.task = w.name
  )
SELECT path FROM walk WHERE name NOT IN (SELECT task FROM prev);
"""
    return starter, ref


# ---------------------------------------------------------------- 6 Pseudocode
def p6(d):
    boxes = d["boxes"]
    widths = ", ".join(str(w) for w, _ in boxes)
    depths = ", ".join(str(dp) for _, dp in boxes)
    starter = f"""// Pseudocode. Arrays are indexed from 1.
// Box i has width W[i] and depth D[i] (cm). Boxes cannot be rotated.
integer: N <- {len(boxes)}
integer array: W <- {{{widths}}}
integer array: D <- {{{depths}}}

// Write the algorithm that prints the maximum number of boxes in one nested chain,
// where box A fits in box B only if W[A] < W[B] and D[A] < D[B].
// Target O(N log N).
"""
    from codestrike_problems import p6_nested_containers  # the Python reference prints the answer
    made = p6_nested_containers()
    ref = made["data"] + "\n" + made["ref"].lstrip("\n")
    return starter, ref


# ---------------------------------------------------------------- 7 C#
# Judge0 compiles C# with Mono's mcs, so this sticks to C# 5: no tuples, no local functions.
def p7(d):
    links = ",\n        ".join(f"new Link({q(a)}, {q(b)}, {c})" for a, b, c in d["links"])
    head = f"""using System;
using System.Collections.Generic;

class Link
{{
    public string From, To;
    public int Gbps;
    public Link(string from, string to, int gbps) {{ From = from; To = to; Gbps = gbps; }}
}}

class Program
{{
    static readonly Link[] Links =
    {{
        {links}
    }}; // one-directional links
    const string Source = {q(d['source'])}, Sink = {q(d['sink'])};
"""
    main = """
    static void Main()
    {
        int cut;
        int flow = MaxThroughput(Links, Source, Sink, out cut);
        Console.WriteLine(flow);
        Console.WriteLine(cut);
    }
}
"""
    starter = head + """
    // Return the maximum flow in Gbps; set cut to the number of links in the minimum cut.
    static int MaxThroughput(Link[] links, string source, string sink, out int cut)
    {
        cut = 0;
        return 0;
    }
""" + main
    ref = head + """
    static Dictionary<string, int> cap = new Dictionary<string, int>();
    static Dictionary<string, SortedSet<string>> adj = new Dictionary<string, SortedSet<string>>();

    static string Key(string a, string b) { return a + "->" + b; }

    static int Cap(string a, string b)
    {
        int c;
        return cap.TryGetValue(Key(a, b), out c) ? c : 0;
    }

    static void Neighbour(string a, string b)
    {
        if (!adj.ContainsKey(a)) adj[a] = new SortedSet<string>(StringComparer.Ordinal);
        adj[a].Add(b);
    }

    static int MaxThroughput(Link[] links, string source, string sink, out int cut)
    {
        foreach (Link l in links)
        {
            cap[Key(l.From, l.To)] = Cap(l.From, l.To) + l.Gbps;
            Neighbour(l.From, l.To);
            Neighbour(l.To, l.From);
        }
        int flow = 0;
        Dictionary<string, string> parent;
        while (true)
        {
            parent = new Dictionary<string, string>();
            parent[source] = null;
            Queue<string> queue = new Queue<string>();
            queue.Enqueue(source);
            while (queue.Count > 0 && !parent.ContainsKey(sink))
            {
                string u = queue.Dequeue();
                foreach (string v in adj[u])
                    if (!parent.ContainsKey(v) && Cap(u, v) > 0)
                    {
                        parent[v] = u;
                        queue.Enqueue(v);
                    }
            }
            if (!parent.ContainsKey(sink)) break;
            int push = int.MaxValue;
            for (string v = sink; parent[v] != null; v = parent[v]) push = Math.Min(push, Cap(parent[v], v));
            for (string v = sink; parent[v] != null; v = parent[v])
            {
                cap[Key(parent[v], v)] = Cap(parent[v], v) - push;
                cap[Key(v, parent[v])] = Cap(v, parent[v]) + push;
            }
            flow += push;
        }
        cut = 0;
        foreach (Link l in links)
            if (parent.ContainsKey(l.From) && !parent.ContainsKey(l.To)) cut++;
        return flow;
    }
""" + main
    return starter, ref


# ---------------------------------------------------------------- 9 Java
def p9(d):
    sites = ", ".join(q(s) for s in d["sites"])
    existing = ", ".join(f"{{{q(a)}, {q(b)}}}" for a, b in d["existing"])
    offers = ",\n            ".join(f"{{{q(a)}, {q(b)}, \"{c}\"}}" for a, b, c in d["offers"])
    head = f"""import java.util.*;

public class Main {{
    static final String[] SITES = {{{sites}}};
    static final String[][] EXISTING = {{{existing}}}; // links already owned (free)
    static final String[][] OFFERS = {{
            {offers}
    }}; // {{siteA, siteB, costKUsd}}
"""
    main = """
    public static void main(String[] args) {
        int[] result = connect(SITES, EXISTING, OFFERS); // {cost, bought} or {-1, -1}
        System.out.println(result[0]);
        System.out.println(result[1]);
    }
}
"""
    starter = head + """
    /** Minimum extra cost to connect every site, and how many offers are bought; {-1, -1} if impossible. */
    static int[] connect(String[] sites, String[][] existing, String[][] offers) {
        return new int[] {-1, -1};
    }
""" + main
    ref = head + """
    static Map<String, String> parent = new HashMap<>();

    static String find(String x) {
        while (!parent.get(x).equals(x)) {
            parent.put(x, parent.get(parent.get(x)));
            x = parent.get(x);
        }
        return x;
    }

    static boolean union(String a, String b) {
        String ra = find(a), rb = find(b);
        if (ra.equals(rb)) return false;
        parent.put(ra, rb);
        return true;
    }

    static int[] connect(String[] sites, String[][] existing, String[][] offers) {
        for (String s : sites) parent.put(s, s);
        int groups = sites.length;
        for (String[] e : existing) if (union(e[0], e[1])) groups--;
        String[][] sorted = offers.clone();
        Arrays.sort(sorted, Comparator.<String[]>comparingInt(o -> Integer.parseInt(o[2]))
                .thenComparing(o -> o[0]).thenComparing(o -> o[1]));
        int cost = 0, bought = 0;
        for (String[] o : sorted) {
            if (union(o[0], o[1])) {
                cost += Integer.parseInt(o[2]);
                bought++;
                groups--;
            }
        }
        return groups == 1 ? new int[] {cost, bought} : new int[] {-1, -1};
    }
""" + main
    return starter, ref


BUILDERS = {1: p1, 2: p2, 3: p3, 4: p4, 5: p5, 6: p6, 7: p7, 9: p9}


def build(number: int, live_starter: str):
    """(language, starter, reference). Problem 8 stays Python and is returned unchanged."""
    if number == 8:
        return "PYTHON", None, None
    starter, ref = BUILDERS[number](data_of(live_starter))
    return LANGUAGE[number], starter, ref

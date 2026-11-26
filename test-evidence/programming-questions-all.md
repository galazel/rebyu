# Programming questions (every one in the bank)

Pulled live from `programming_question_configs` on 95 rows.

- **IT Passport Exam** (cert 4) - 18 total: C++ 4, JAVA 4, C 3, C# 2, JAVASCRIPT 2, PYTHON 2, SQL 1
- **TOPCIT** (cert 13) - 75 total: PYTHON 12, SQL 12, C# 11, JAVASCRIPT 11, C 10, JAVA 10, C++ 9
- **FE Exam** (cert 14) - 2 total: PYTHON 2

---

# IT Passport Exam (certification 4)

## C

### Q23572 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Cluster Job Packing

A batch cluster has 1,000 CPU units free. The starter code builds `jobs`: 60 jobs as (cpu, value) pairs. Each job runs entirely or not at all.

Write `pack(jobs, capacity)` that returns `BEST MIN_CPU`: BEST is the maximum total value that fits in the capacity, and MIN_CPU is the smallest total CPU among all selections that achieve BEST.

Expected complexity: O(n * capacity). Greedy by value-per-CPU is not optimal.

The starter code generates the input; do not change it. Your program must print exactly the required output.

Rules for this question: implement pack(cpu, value, n, capacity, best, min_cpu): set *best to the maximum total value of jobs whose CPU fits in the capacity (each job all or nothing) and *min_cpu to the smallest total CPU among the selections that achieve it. main prints "BEST MIN_CPU".

Language: C. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```c
#include <stdio.h>

static unsigned long long lcg_state;

/* Deterministic generator used to build the input. Do not change it. */
static unsigned long long next_rand(void) {
    lcg_state = (lcg_state * 1103515245ULL + 12345ULL) % 2147483648ULL;
    return lcg_state;
}

void pack(const int *cpu, const int *value, int n, int capacity, int *best, int *min_cpu) {
    // Your code here
    *best = 0; *min_cpu = 0;
}

int main(void) {
    int cpu[60], value[60];
    lcg_state = 4242;
    for (int i = 0; i < 60; i++) {
        cpu[i] = 20 + (int) (next_rand() % 130);
        value[i] = 30 + (int) (next_rand() % 470);
    }
    int best, min_cpu;
    pack(cpu, value, 60, 1000, &best, &min_cpu);
    printf("%d %d\n", best, min_cpu);
    return 0;
}
```

**Expected output**

```
7588 997
```

**Explanation**: 0/1 knapsack over capacity: dp[c] is the best value using exactly c CPU. The answer is the best dp value, and scanning c upwards finds the smallest CPU that achieves it.

Common mistake: A greedy pick by value per CPU, which is not optimal for 0/1 selection.

### Q23573 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Latency Trend Detection

A monitoring system recorded 200,000 p99 latency samples. The starter code builds `samples`.

Write `trend(samples)` that returns two numbers on one line: the length of the longest STRICTLY increasing subsequence, and the length of the longest NON-DECREASING subsequence (elements need not be contiguous).

Expected complexity: O(n log n). An O(n^2) dynamic programme will time out.

The starter code generates the input; do not change it. Your program must print exactly the required output.

Rules for this question: implement trend(samples, n, strict, non_decreasing): set *strict to the length of the longest strictly increasing subsequence and *non_decreasing to the length of the longest non-decreasing subsequence (elements need not be contiguous). main prints both on one line.

Language: C. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```c
#include <stdio.h>
#include <stdlib.h>

static unsigned long long lcg_state;

/* Deterministic generator used to build the input. Do not change it. */
static unsigned long long next_rand(void) {
    lcg_state = (lcg_state * 1103515245ULL + 12345ULL) % 2147483648ULL;
    return lcg_state;
}

void trend(const int *samples, int n, int *strict, int *non_decreasing) {
    // Your code here
    *strict = 0; *non_decreasing = 0;
}

int main(void) {
    static int samples[200000];
    lcg_state = 555;
    for (int i = 0; i < 200000; i++) samples[i] = (int) (next_rand() % 50000);
    int strict, non_decreasing;
    trend(samples, 200000, &strict, &non_decreasing);
    printf("%d %d\n", strict, non_decreasing);
    return 0;
}
```

**Expected output**

```
881 888
```

**Explanation**: Patience sorting: keep the smallest tail of each subsequence length and binary-search each sample -- the first tail >= x for strictly increasing, the first tail > x for non-decreasing.

Common mistake: Using the same comparison for both, which makes the two lengths equal.

### Q23630 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Longest-prefix-match router

Language: C. Complete the function in the starter code; the data and the printing are already there.

A router has a routing table of (CIDR prefix, interface) entries, including a default route 0.0.0.0/0. For each packet's destination address it must choose the entry whose prefix contains the address with the LONGEST prefix length (longest-prefix match).

Route all 25 packets and print, for each interface used, `interface count`, sorted by interface name.

Convert addresses to 32-bit integers and compare them under each prefix's mask. String matching on the dotted form is wrong for any prefix length that is not a multiple of 8.

Your program receives no input: the data is already defined in the starter code. Keep it as given, and print exactly the output described above -- the judge compares your output with the expected output character for character (trailing spaces ignored).

**Starter code / given tables**

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define ROUTE_COUNT 19
#define PACKET_COUNT 25

static const char *ROUTES[ROUTE_COUNT][2] = {
    {"0.0.0.0/0", "ISP"},
    {"10.15.0.0/16", "vpn1"},
    {"192.16.80.0/24", "vpn0"},
    {"172.5.16.0/20", "vpn1"},
    {"10.25.0.0/16", "eth2"},
    {"10.26.16.0/20", "eth1"},
    {"10.21.0.0/16", "eth1"},
    {"192.16.0.0/12", "vpn1"},
    {"192.16.0.0/16", "eth2"},
    {"172.8.36.0/24", "vpn0"},
    {"10.17.0.0/16", "eth1"},
    {"172.5.0.0/16", "eth0"},
    {"172.15.0.0/16", "vpn0"},
    {"10.6.69.0/24", "eth1"},
    {"172.0.0.0/8", "eth2"},
    {"192.0.0.0/12", "eth1"},
    {"192.11.20.0/24", "vpn0"},
    {"192.9.0.0/16", "eth0"},
    {"172.26.0.0/16", "vpn1"}
}; /* {CIDR prefix, interface} */

static const char *PACKETS[PACKET_COUNT] = {
    "8.22.215.174",
    "10.30.239.215",
    "10.18.203.221",
    "10.12.234.81",
    "192.31.43.131",
    "172.9.174.138",
    "192.15.184.237",
    "192.2.131.113",
    "192.18.79.164",
    "192.25.13.79",
    "10.5.131.139",
    "10.26.199.99",
    "10.19.83.136",
    "172.25.162.62",
    "172.30.141.185",
    "172.27.174.94",
    "8.4.10.24",
    "172.31.168.193",
    "172.28.38.237",
    "192.19.69.203",
    "8.29.69.73",
    "172.0.51.252",
    "172.7.57.232",
    "192.26.173.2",
    "10.7.137.234"
};

/* Fill chosen[i] with the outgoing interface for PACKETS[i] (longest-prefix match). */
void route_all(const char *chosen[PACKET_COUNT]) {
    /* Convert each address to a 32-bit unsigned integer and compare under each prefix's mask. */
}

/* Print "interface count" for each interface used, sorted by interface name. */
void print_counts(const char *chosen[PACKET_COUNT]) {
}

int main(void) {
    const char *chosen[PACKET_COUNT];
    route_all(chosen);
    print_counts(chosen); /* "interface count" per interface used, sorted by interface name */
    return 0;
}
```

**Expected output**

```
ISP 10
eth1 2
eth2 8
vpn1 5
```

**Explanation**: Convert each address to a 32-bit integer and build a mask of `length` leading 1 bits for every prefix. A route matches when (address & mask) == network. Among all matches, the longest prefix wins, and the /0 default route matches everything as the fallback.

Common mistake: Comparing the dotted strings, which only works for /8, /16 and /24 and misroutes the /12, /20 and /28 entries; or taking the first matching route instead of the longest.

## C#

### Q23575 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Deadlock Avoidance (Banker's Algorithm)

An OS manages 4 resource types. The starter code builds `allocation` and `maximum` (one row per process, 10 processes) and the free vector `available`.

Write `banker(available, allocation, maximum, pid, request)` that returns two lines:
1. For the CURRENT state: `SAFE` followed by the safe sequence (when several processes can run, always pick the lowest-numbered one), or `UNSAFE` followed by the processes that can never finish.
2. For the request vector `request` from process `pid`: `GRANT` if it is within the process's remaining need and the currently available resources AND the state after granting it is safe; otherwise `DENY`.

The starter code generates the input; do not change it. Your program must print exactly the required output.

Rules for this question: complete Banker(available, allocation, maximum, pid, request), returning two lines: (1) for the current state, "SAFE" followed by the safe sequence (when several processes can run, always pick the lowest-numbered one), or "UNSAFE" followed by the processes that can never finish; (2) for the request from process pid, "GRANT" if it is within the process's remaining need and the available resources and the state after granting it is safe, otherwise "DENY".

Language: C#. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```csharp
using System;
using System.Collections.Generic;

class Program
{
    // Deterministic generator used to build the input. Do not change it.
    static long state;
    static long Next()
    {
        state = (state * 1103515245L + 12345L) % 2147483648L;
        return state;
    }

    static string Banker(int[] available, int[][] allocation, int[][] maximum, int pid, int[] request)
    {
        // Your code here
        return "";
    }

    static string SafetyCheck(int[] available, int[][] allocation, int[][] maximum)
    {
        // Your code here
        return "";
    }

    static void Main()
    {
        state = 1983;
        int procs = 10, kinds = 4;
        int[][] maximum = new int[procs][];
        for (int p = 0; p < procs; p++)
        {
            maximum[p] = new int[kinds];
            for (int k = 0; k < kinds; k++) maximum[p][k] = 2 + (int) (Next() % 9);
        }
        int[][] allocation = new int[procs][];
        for (int p = 0; p < procs; p++)
        {
            allocation[p] = new int[kinds];
            for (int k = 0; k < kinds; k++) allocation[p][k] = (int) (Next() % (maximum[p][k] + 1));
        }
        int[] available = new int[kinds];
        for (int k = 0; k < kinds; k++) available[k] = 3 + (int) (Next() % 4);
        Console.WriteLine(Banker(available, allocation, maximum, 0, new[] { 0, 2, 5, 0 }));
    }
}
```

**Expected output**

```
SAFE 3 0 1 2 4 5 6 7 8 9
DENY
```

**Explanation**: Safety check: repeatedly run the lowest-numbered process whose remaining need fits in the free resources and release its allocation. A request is granted only if it is within need and available and the state after granting it is still safe.

Common mistake: Granting a request because it fits the available resources without checking it stays within the process's remaining need.

### Q23634 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Backbone throughput (max flow / min cut)

Language: C#. Complete the function in the starter code; the data and the printing are already there.

A data centre (DC) reaches the edge network (EDGE) through a mesh of routers. Every link is one-directional with a capacity in Gbps, and traffic may be split across any number of paths.

Line 1: the maximum total throughput from DC to EDGE.
Line 2: the number of links in the minimum cut, taking as the cut every link that goes from the set of routers still reachable from DC in the final residual network to a router outside that set.

This is a maximum-flow problem (Ford-Fulkerson with BFS, i.e. Edmonds-Karp). Summing the capacities leaving DC, or taking the best single path, gives the wrong number.

Your program receives no input: the data is already defined in the starter code. Keep it as given, and print exactly the output described above -- the judge compares your output with the expected output character for character (trailing spaces ignored).

**Starter code / given tables**

```csharp
using System;
using System.Collections.Generic;

class Link
{
    public string From, To;
    public int Gbps;
    public Link(string from, string to, int gbps) { From = from; To = to; Gbps = gbps; }
}

class Program
{
    static readonly Link[] Links =
    {
        new Link("DC", "R1", 100),
        new Link("DC", "R6", 50),
        new Link("DC", "R5", 40),
        new Link("R1", "R2", 50),
        new Link("R1", "R6", 100),
        new Link("R1", "R8", 25),
        new Link("R2", "R3", 10),
        new Link("R2", "R6", 100),
        new Link("R2", "R8", 10),
        new Link("R3", "R6", 50),
        new Link("R3", "R7", 100),
        new Link("R3", "R4", 25),
        new Link("R4", "R8", 100),
        new Link("R4", "R7", 40),
        new Link("R4", "EDGE", 40),
        new Link("R5", "R7", 25),
        new Link("R5", "R8", 50),
        new Link("R5", "EDGE", 25),
        new Link("R6", "R8", 40),
        new Link("R6", "EDGE", 50),
        new Link("R6", "R7", 40),
        new Link("R7", "R8", 40),
        new Link("R7", "EDGE", 40),
        new Link("R8", "EDGE", 10),
        new Link("R8", "R6", 30),
        new Link("R6", "R3", 30),
        new Link("R5", "R1", 15),
        new Link("R5", "R4", 15)
    }; // one-directional links
    const string Source = "DC", Sink = "EDGE";

    // Return the maximum flow in Gbps; set cut to the number of links in the minimum cut.
    static int MaxThroughput(Link[] links, string source, string sink, out int cut)
    {
        cut = 0;
        return 0;
    }

    static void Main()
    {
        int cut;
        int flow = MaxThroughput(Links, Source, Sink, out cut);
        Console.WriteLine(flow);
        Console.WriteLine(cut);
    }
}
```

**Expected output**

```
165
5
```

**Explanation**: Repeatedly find an augmenting path in the residual graph with BFS, push its bottleneck capacity, and add reverse residual edges so flow can be rerouted later. When no path remains, the flow is maximal. The routers still reachable from DC define the minimum cut, and by the max-flow min-cut theorem its capacity equals the flow.

Common mistake: Not adding reverse residual capacity, so an early greedy path can never be undone and the result falls short of the true maximum.

## C++

### Q23259 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Latency-Aware Routing

A backbone network has 60 routers (0-59) joined by bidirectional links, each with a latency in ms. The starter code builds the link list `links` as (a, b, latency) tuples; parallel links may exist.

Write `route(n, links)` that returns two lines of text:
1. The minimum total latency from router 0 to each of routers 55, 56, 57, 58 and 59, space-separated (print -1 for an unreachable router).
2. How many routers (including router 0) are reachable from router 0 within a total latency of at most 40 ms.

Expected complexity: O((V + E) log V). Hop count does not matter, only total latency.

The starter code generates the input; do not change it. Your program must print exactly the required output.

Rules for this question: complete route(n, links), where each link is {a, b, latency} and links are bidirectional. Return two lines: the minimum total latency from router 0 to each of routers 55, 56, 57, 58 and 59, space-separated (-1 for an unreachable router); then how many routers (including router 0) are reachable from router 0 within a total latency of at most 40 ms.

Language: C++. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```cpp
#include <functional>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

// Deterministic generator used to build the input. Do not change it.
static unsigned long long lcg_state;
static unsigned long long next_rand() {
    lcg_state = (lcg_state * 1103515245ULL + 12345ULL) % 2147483648ULL;
    return lcg_state;
}

struct Link { int a, b, latency; };

string route(int n, const vector<Link>& links) {
    // Your code here
    return "";
}

int main() {
    lcg_state = 2024;
    int n = 60;
    vector<Link> links;
    for (int i = 0; i < 150; i++) {
        int a = (int) (next_rand() % n);
        int b = (int) (next_rand() % n);
        if (a != b) links.push_back(Link{a, b, 1 + (int) (next_rand() % 20)});
    }
    cout << route(n, links) << endl;
    return 0;
}
```

**Expected output**

```
34 40 19 23 10
58
```

**Explanation**: Dijkstra from router 0 with a binary heap over the undirected links; unreachable routers keep infinity and print -1. The second line counts distances of at most 40.

Common mistake: Treating links as one-way, or counting hops instead of latency.

### Q23574 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Campus Fibre Backbone

A university will connect 400 buildings with fibre. The starter code places them at integer coordinates in `buildings`. Laying fibre between two buildings costs their Manhattan distance, and any building may connect to any other.

Write `backbone(buildings)` that returns `TOTAL LONGEST`: the minimum total cost to connect every building (directly or indirectly), and the length of the single longest link in such a minimum network.

Expected complexity: O(V^2) (Prim) or O(E log E) with union-find (Kruskal).

The starter code generates the input; do not change it. Your program must print exactly the required output.

Rules for this question: complete backbone(buildings), where buildings are (x, y) points and linking two costs their Manhattan distance. Return "TOTAL LONGEST": the minimum total cost to connect every building (directly or indirectly) and the length of the single longest link in such a minimum network.

Language: C++. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```cpp
#include <cstdlib>
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

// Deterministic generator used to build the input. Do not change it.
static unsigned long long lcg_state;
static unsigned long long next_rand() {
    lcg_state = (lcg_state * 1103515245ULL + 12345ULL) % 2147483648ULL;
    return lcg_state;
}

string backbone(const vector<pair<int, int>>& buildings) {
    // Your code here
    return "";
}

int main() {
    lcg_state = 8080;
    vector<pair<int, int>> buildings;
    for (int i = 0; i < 400; i++) {
        int x = (int) (next_rand() % 2000);
        int y = (int) (next_rand() % 2000);
        buildings.push_back(make_pair(x, y));
    }
    cout << backbone(buildings) << endl;
    return 0;
}
```

**Expected output**

```
34704 200
```

**Explanation**: Prim's algorithm on the complete graph with Manhattan distances, O(V^2): repeatedly add the closest unconnected building and track the largest link added.

Common mistake: Using Euclidean distance instead of Manhattan.

### Q23576 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Data Centre Bandwidth

Traffic flows from an ingress router (node 0) to a storage cluster (node 39) across a directed network of 40 nodes. The starter code builds `links`, (u, v, capacity in Gbps) tuples; parallel links add their capacities.

Write `bandwidth(n, links, s, t)` that returns `FLOW CUT`: the maximum throughput from s to t, and the number of directed links that cross a minimum cut, meaning links from the source side to the sink side of the residual graph after the maximum flow (count parallel links individually).

Expected complexity: Edmonds-Karp, O(V E^2).

The starter code generates the input; do not change it. Your program must print exactly the required output.

Rules for this question: complete bandwidth(n, links, s, t), where each link is a directed {u, v, capacity} and parallel links add their capacities. Return "FLOW CUT": the maximum throughput from s to t, and the number of directed links that cross a minimum cut -- links from the source side to the sink side of the residual graph after the maximum flow (count parallel links individually). Expected: Edmonds-Karp.

Language: C++. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```cpp
#include <algorithm>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

// Deterministic generator used to build the input. Do not change it.
static unsigned long long lcg_state;
static unsigned long long next_rand() {
    lcg_state = (lcg_state * 1103515245ULL + 12345ULL) % 2147483648ULL;
    return lcg_state;
}

struct Link { int u, v, capacity; };

string bandwidth(int n, const vector<Link>& links, int s, int t) {
    // Your code here
    return "";
}

int main() {
    lcg_state = 4096;
    int n = 40;
    vector<Link> links;
    for (int i = 0; i < 220; i++) {
        int u = (int) (next_rand() % n);
        int v = (int) (next_rand() % n);
        if (u != v && v != 0 && u != n - 1) links.push_back(Link{u, v, 1 + (int) (next_rand() % 25)});
    }
    cout << bandwidth(n, links, 0, n - 1) << endl;
    return 0;
}
```

**Expected output**

```
29 3
```

**Explanation**: Edmonds-Karp: BFS for shortest augmenting paths in the residual capacity matrix until none remain. The source side is what BFS still reaches; count original links from it to the sink side.

Common mistake: Counting cut edges in the merged capacity matrix, which undercounts parallel links.

### Q23631 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Evacuation route with breachable walls

Language: C++. Complete the function in the starter code; the data and the printing are already there.

A building floor is a grid: `S` is the start, `E` the exit, `.` open floor and `#` a wall. Each move goes one cell up, down, left or right. Rescuers may break through at most k = 2 walls; moving into a wall cell breaks it (that move still counts as one move).

Print the minimum number of moves from S to E, or -1 if it is impossible.

Plain BFS on cells is not enough: the same cell reached with fewer walls broken is a different, better state.

Your program receives no input: the data is already defined in the starter code. Keep it as given, and print exactly the output described above -- the judge compares your output with the expected output character for character (trailing spaces ignored).

**Starter code / given tables**

```cpp
#include <iostream>
#include <queue>
#include <string>
#include <tuple>
#include <vector>
using namespace std;

const int K = 2; // walls you may break
const vector<string> GRID = {
    "S.##.#.#....#..##.",
    "#.###..###.....#..",
    "#.#.##.###.##..#.#",
    "........#...##...#",
    "..#..#.#.##.....#.",
    "..............#...",
    ".#..##...#.###.##.",
    ".#.#.#.#...##....#",
    "...............#..",
    "....##.#...##.###.",
    ".##.##..#....#....",
    "......##.#..#....#",
    ".............###..",
    "....#..#...#..#..E"
};

// Minimum number of moves from S to E breaking at most k walls, or -1.
int shortest(const vector<string>& grid, int k) {
    return -1;
}

int main() {
    cout << shortest(GRID, K) << endl;
    return 0;
}
```

**Expected output**

```
30
```

**Explanation**: Run BFS over states (row, col, walls_broken). Moving into `#` increases walls_broken, and a state is only valid while walls_broken <= k. Because every move costs 1, the first time BFS reaches E is the shortest route.

Common mistake: Marking a cell visited regardless of how many walls were broken to reach it, which discards a later path that arrives with walls to spare and returns a longer route or -1.

## JAVA

### Q23261 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

LRU Cache Audit

A web tier puts an LRU cache of capacity 64 in front of a database. The starter code builds `requests`, 20,000 key lookups over 400 keys with a skewed (hot-key) distribution.

Simulate the cache. On a hit the key becomes most recently used; on a miss it is loaded, and if the cache is full the least recently used key is evicted first. Write `audit(requests, capacity)` that returns `HITS MISSES EVICTIONS` on the first line and the five most recently used keys, most recent first and space-separated, on the second.

Expected complexity: O(1) per request.

The starter code generates the input; do not change it. Your program must print exactly the required output.

Rules for this question: complete audit(requests, capacity), returning two lines: "HITS MISSES EVICTIONS", then the five most recently used keys, most recent first, separated by spaces.

Language: Java. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```java
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

public class Main {
    // Deterministic generator used to build the input. Do not change it.
    static long state;

    static long next() {
        state = (state * 1103515245L + 12345L) % 2147483648L;
        return state;
    }

    static String audit(List<Integer> requests, int capacity) {
        // Your code here
        return "";
    }

    public static void main(String[] args) {
        state = 99;
        List<Integer> requests = new ArrayList<>();
        for (int i = 0; i < 20000; i++) {
            long r = next() % 1000;
            if (r < 700) {
                requests.add((int) (next() % 40));
            } else {
                requests.add(40 + (int) (next() % 360));
            }
        }
        System.out.println(audit(requests, 64));
    }
}
```

**Expected output**

```
15281 4719 4655
3 109 359 153 347
```

**Explanation**: A hash map that keeps access order (LinkedHashMap with access order, or a map plus a doubly linked list) moves a hit to the end and evicts the eldest on a miss when full -- O(1) per request.

Common mistake: Counting an eviction on every miss, even before the cache is full.

### Q23571 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Deterministic Build Order

A monorepo has two dependency graphs over modules 0-49. In each, an edge (a, b) means module a must be built before module b. The starter code builds `graph_a` (acyclic) and `graph_b` (graph_a plus a few extra edges, which may introduce cycles).

Write `plan(n, edges)` returning, for a graph:
- the lexicographically smallest valid build order, space-separated, if every module can be built; or
- `CYCLE k`, where k is the number of modules that can NEVER be built because they sit on, or depend on, a cycle.

Print the result for graph_a on the first line and for graph_b on the second.
Expected complexity: O((V + E) log V).

The starter code generates the input; do not change it. Your program must print exactly the required output.

Rules for this question: complete plan(n, edges), where each edge {a, b} means module a must be built before module b. Return the lexicographically smallest valid build order, space-separated, if every module can be built; otherwise "CYCLE k", where k is the number of modules that can never be built because they sit on, or depend on, a cycle. main prints the result for graph A, then graph B.

Language: Java. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```java
import java.util.ArrayList;
import java.util.List;
import java.util.PriorityQueue;
import java.util.TreeSet;

public class Main {
    // Deterministic generator used to build the input. Do not change it.
    static long state;

    static long next() {
        state = (state * 1103515245L + 12345L) % 2147483648L;
        return state;
    }

    static String plan(int n, List<int[]> edges) {
        // Your code here
        return "";
    }

    public static void main(String[] args) {
        int n = 50;
        state = 31337;
        int[] order = new int[n];
        for (int i = 0; i < n; i++) order[i] = i;
        for (int i = n - 1; i > 0; i--) {
            int j = (int) (next() % (i + 1));
            int t = order[i]; order[i] = order[j]; order[j] = t;
        }
        TreeSet<Integer> set = new TreeSet<>();
        for (int k = 0; k < 90; k++) {
            int i = (int) (next() % n), j = (int) (next() % n);
            if (i < j) set.add(order[i] * 100 + order[j]);
        }
        List<int[]> graphA = new ArrayList<>();
        for (int code : set) graphA.add(new int[] {code / 100, code % 100});
        List<int[]> graphB = new ArrayList<>(graphA);
        for (int k = 0; k < 3; k++) {
            int i = (int) (next() % n), j = (int) (next() % n);
            if (i < j) { int t = i; i = j; j = t; }
            if (i != j) graphB.add(new int[] {order[i], order[j]});
        }
        System.out.println(plan(n, graphA));
        System.out.println(plan(n, graphB));
    }
}
```

**Expected output**

```
0 2 6 7 8 10 11 12 14 17 20 21 22 24 25 26 27 28 30 31 32 4 33 1 3 18 23 34 35 36 5 15 38 19 29 39 40 42 43 44 9 13 41 45 16 37 46 47 48 49
CYCLE 2
```

**Explanation**: Kahn's algorithm with a min-heap of ready modules gives the lexicographically smallest order; modules never reaching in-degree 0 are on, or behind, a cycle.

Common mistake: Using a plain queue, which gives a valid order but not the smallest one.

### Q23629 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

LRU cache in front of a user service

Language: Java. Complete the function in the starter code; the data and the printing are already there.

A service puts an LRU cache of capacity 5 in front of its user database and replays 90 operations against it:
- ("get", key): if the key is cached it is a HIT and becomes most recently used. Otherwise it is a MISS: the value is loaded from the database and inserted as most recently used.
- ("put", key): the key is written; it becomes (or is inserted as) most recently used. A put is neither a hit nor a miss.
Whenever an insertion makes the cache exceed its capacity, the least recently used key is evicted.

Print `hits=H misses=M` on the first line and, on the second, the evicted keys in eviction order separated by commas (or `none`).

Each operation must be O(1); a solution that scans the cache to find the oldest key passes here but would not survive production traffic.

Your program receives no input: the data is already defined in the starter code. Keep it as given, and print exactly the output described above -- the judge compares your output with the expected output character for character (trailing spaces ignored).

**Starter code / given tables**

```java
import java.util.*;

public class Main {
    static final int CAPACITY = 5;
    static final String[][] OPS = {
            {"get", "user:11"},
            {"put", "user:4"},
            {"get", "user:7"},
            {"get", "user:5"},
            {"get", "user:6"},
            {"get", "user:9"},
            {"get", "user:4"},
            {"put", "user:6"},
            {"get", "user:9"},
            {"put", "user:4"},
            {"put", "user:1"},
            {"put", "user:6"},
            {"get", "user:3"},
            {"get", "user:2"},
            {"put", "user:2"},
            {"put", "user:7"},
            {"get", "user:6"},
            {"put", "user:3"},
            {"put", "user:4"},
            {"get", "user:10"},
            {"put", "user:5"},
            {"get", "user:4"},
            {"put", "user:3"},
            {"get", "user:2"},
            {"put", "user:6"},
            {"get", "user:3"},
            {"get", "user:3"},
            {"put", "user:4"},
            {"put", "user:6"},
            {"get", "user:9"},
            {"get", "user:2"},
            {"get", "user:3"},
            {"put", "user:8"},
            {"get", "user:4"},
            {"get", "user:2"},
            {"put", "user:11"},
            {"get", "user:4"},
            {"put", "user:6"},
            {"get", "user:4"},
            {"get", "user:5"},
            {"put", "user:2"},
            {"put", "user:6"},
            {"get", "user:3"},
            {"put", "user:5"},
            {"get", "user:2"},
            {"get", "user:1"},
            {"get", "user:6"},
            {"get", "user:7"},
            {"get", "user:3"},
            {"get", "user:1"},
            {"get", "user:5"},
            {"get", "user:5"},
            {"get", "user:4"},
            {"get", "user:4"},
            {"put", "user:5"},
            {"get", "user:4"},
            {"get", "user:4"},
            {"get", "user:9"},
            {"put", "user:3"},
            {"get", "user:10"},
            {"put", "user:3"},
            {"put", "user:4"},
            {"put", "user:2"},
            {"get", "user:6"},
            {"get", "user:3"},
            {"put", "user:2"},
            {"get", "user:1"},
            {"get", "user:6"},
            {"get", "user:1"},
            {"get", "user:8"},
            {"put", "user:3"},
            {"get", "user:4"},
            {"put", "user:5"},
            {"get", "user:4"},
            {"get", "user:6"},
            {"get", "user:4"},
            {"get", "user:11"},
            {"put", "user:2"},
            {"get", "user:3"},
            {"get", "user:1"},
            {"get", "user:10"},
            {"get", "user:3"},
            {"get", "user:4"},
            {"get", "user:6"},
            {"get", "user:10"},
            {"put", "user:1"},
            {"put", "user:6"},
            {"put", "user:4"},
            {"get", "user:12"},
            {"get", "user:2"}
    }; // {operation, key}

    /** Replays OPS against an LRU cache; returns {hits, misses} and fills evicted in eviction order. */
    static int[] simulate(int capacity, String[][] ops, List<String> evicted) {
        // Each operation must be O(1).
        return new int[] {0, 0};
    }

    public static void main(String[] args) {
        List<String> evicted = new ArrayList<>();
        int[] counts = simulate(CAPACITY, OPS, evicted); // {hits, misses}
        System.out.println("hits=" + counts[0] + " misses=" + counts[1]);
        System.out.println(evicted.isEmpty() ? "none" : String.join(",", evicted));
    }
}
```

**Expected output**

```
hits=25 misses=33
user:11,user:7,user:5,user:9,user:4,user:1,user:2,user:7,user:6,user:10,user:5,user:4,user:6,user:9,user:3,user:8,user:11,user:4,user:3,user:5,user:2,user:6,user:7,user:1,user:5,user:9,user:10,user:4,user:2,user:6,user:1,user:8,user:3,user:5,user:6,user:4,user:11,user:2,user:3,user:10
```

**Explanation**: Keep the keys in an ordered map (or a hash map plus a doubly linked list). Every access moves the key to the most-recent end; an insertion beyond capacity removes the key at the least-recent end. A get miss is also an insertion, because the value is loaded into the cache.

Common mistake: Forgetting that a put on an existing key refreshes its recency, or not inserting the key on a get miss, which changes every later eviction.

### Q23636 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Connecting branch offices at minimum cost

Language: Java. Complete the function in the starter code; the data and the printing are already there.

A company must connect 20 branch sites into one network. Some links are already owned and cost nothing. A carrier offers further links between pairs of sites, each with a cost.

Print the minimum additional cost to make every site reachable from every other on line 1, and the number of offered links bought on line 2. If it cannot be done, print -1 twice.

Treat the owned links as already merged components before choosing offers; this is a minimum spanning tree (Kruskal with union-find) over the remaining components.

Your program receives no input: the data is already defined in the starter code. Keep it as given, and print exactly the output described above -- the judge compares your output with the expected output character for character (trailing spaces ignored).

**Starter code / given tables**

```java
import java.util.*;

public class Main {
    static final String[] SITES = {"S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20"};
    static final String[][] EXISTING = {{"S07", "S13"}, {"S07", "S08"}, {"S01", "S10"}, {"S13", "S14"}, {"S17", "S16"}, {"S08", "S15"}}; // links already owned (free)
    static final String[][] OFFERS = {
            {"S20", "S14", "76"},
            {"S03", "S13", "34"},
            {"S05", "S20", "72"},
            {"S02", "S03", "5"},
            {"S19", "S12", "85"},
            {"S05", "S02", "39"},
            {"S07", "S04", "32"},
            {"S05", "S02", "42"},
            {"S16", "S09", "54"},
            {"S01", "S08", "71"},
            {"S19", "S07", "23"},
            {"S20", "S05", "22"},
            {"S01", "S20", "48"},
            {"S07", "S09", "57"},
            {"S13", "S01", "39"},
            {"S19", "S10", "55"},
            {"S01", "S09", "39"},
            {"S09", "S20", "69"},
            {"S14", "S01", "67"},
            {"S19", "S16", "47"},
            {"S01", "S07", "85"},
            {"S05", "S18", "17"},
            {"S02", "S04", "71"},
            {"S14", "S13", "46"},
            {"S18", "S08", "46"},
            {"S16", "S07", "44"},
            {"S02", "S15", "33"},
            {"S05", "S20", "40"},
            {"S03", "S16", "79"},
            {"S12", "S04", "80"},
            {"S15", "S14", "35"},
            {"S14", "S15", "22"},
            {"S04", "S05", "77"},
            {"S03", "S01", "88"},
            {"S10", "S16", "77"},
            {"S05", "S10", "78"},
            {"S14", "S02", "52"},
            {"S19", "S04", "64"},
            {"S16", "S19", "38"},
            {"S09", "S20", "31"},
            {"S10", "S03", "38"},
            {"S07", "S09", "40"},
            {"S14", "S16", "47"},
            {"S12", "S11", "68"},
            {"S03", "S07", "42"},
            {"S20", "S01", "17"},
            {"S20", "S14", "23"},
            {"S14", "S18", "88"},
            {"S05", "S06", "59"},
            {"S19", "S15", "50"},
            {"S09", "S01", "36"},
            {"S18", "S14", "52"},
            {"S19", "S17", "8"},
            {"S16", "S01", "21"},
            {"S17", "S15", "23"}
    }; // {siteA, siteB, costKUsd}

    /** Minimum extra cost to connect every site, and how many offers are bought; {-1, -1} if impossible. */
    static int[] connect(String[] sites, String[][] existing, String[][] offers) {
        return new int[] {-1, -1};
    }

    public static void main(String[] args) {
        int[] result = connect(SITES, EXISTING, OFFERS); // {cost, bought} or {-1, -1}
        System.out.println(result[0]);
        System.out.println(result[1]);
    }
}
```

**Expected output**

```
416
13
```

**Explanation**: Union all owned links first, so the sites they connect form free components. Then run Kruskal: sort the offers by cost and buy each one that joins two different components (union-find detects this in near-constant time) until a single component remains.

Common mistake: Running Kruskal on the offers alone and ignoring the owned links, which buys links that duplicate existing connectivity and overstates the cost.

## JAVASCRIPT

### Q23260 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Peak Concurrent Sessions

A load balancer logged 5,000 user sessions as [start, end) intervals in seconds: a session is active at time t when start <= t < end, so a session ending at t and another starting at t do not overlap. The starter code builds `sessions`.

Write `peak(sessions)` that returns `PEAK FIRST LAST` where PEAK is the maximum number of sessions active at the same time, FIRST is the earliest time that peak is reached, and LAST is the latest time at which the peak is still being held (the last second before it drops).

Expected complexity: O(n log n) with a sweep line. An O(n * T) per-second scan is too slow.

The starter code generates the input; do not change it. Your program must print exactly the required output.

Rules for this question: complete peak(sessions), where each session is [start, end) in seconds: active at time t when start <= t < end, so a session ending at t and one starting at t do not overlap. Return "PEAK FIRST LAST": PEAK is the maximum number of sessions active at the same time, FIRST the earliest second at which it is reached, and LAST the final second of the latest stretch during which it is held (the peak may be reached more than once). Expected complexity: O(n log n) with a sweep line.

Language: JavaScript. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```javascript
// Deterministic generator used to build the input. Do not change it.
let state = 7n;
function next() {
  state = (state * 1103515245n + 12345n) % 2147483648n;
  return Number(state);
}

function peak(sessions) {
  // Your code here
  return '';
}

const sessions = [];
for (let i = 0; i < 5000; i++) {
  const start = next() % 86000;
  sessions.push([start, start + 1 + (next() % 900)]);
}
console.log(peak(sessions));
```

**Expected output**

```
47 21178 21217
```

**Explanation**: Sweep line: sort the start (+1) and end (-1) events, ends before starts at the same second. Track the count after each second; the first time the maximum is reached gives FIRST and the end of the latest stretch at the maximum gives LAST.

Common mistake: Processing starts before ends at the same second, counting touching sessions as overlapping.

### Q23628 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Conference room planner

Language: JavaScript. Complete the function in the starter code; the data and the printing are already there.

A company books 60 meetings in its conference centre. Each meeting is a half-open interval [start, end) in minutes after midnight, so a meeting ending at 10:00 and one starting at 10:00 do not overlap.

Write `planRooms(meetings)` and print two lines:
1. The minimum number of rooms needed so that no two overlapping meetings share a room.
2. The FIRST time window in which that maximum is reached, as HH:MM-HH:MM: from the moment the number of simultaneous meetings first reaches the maximum, until the first moment it drops below it again.

Expected complexity: O(n log n). Comparing every pair of meetings does not find the window.

Your program receives no input: the data is already defined in the starter code. Keep it as given, and print exactly the output described above -- the judge compares your output with the expected output character for character (trailing spaces ignored).

**Starter code / given tables**

```javascript
const meetings = [
  [850, 895],
  [1060, 1120],
  [775, 790],
  [900, 945],
  [865, 910],
  [1065, 1125],
  [790, 835],
  [690, 810],
  [525, 585],
  [600, 630],
  [535, 655],
  [970, 1030],
  [600, 720],
  [980, 1040],
  [630, 720],
  [750, 795],
  [520, 610],
  [775, 835],
  [615, 645],
  [895, 955],
  [905, 965],
  [730, 820],
  [625, 715],
  [525, 615],
  [955, 1045],
  [480, 600],
  [615, 645],
  [700, 715],
  [715, 775],
  [485, 545],
  [840, 870],
  [500, 590],
  [595, 655],
  [520, 550],
  [735, 795],
  [1050, 1170],
  [585, 705],
  [1020, 1080],
  [1035, 1065],
  [920, 935],
  [530, 560],
  [500, 560],
  [820, 940],
  [1015, 1045],
  [910, 1030],
  [985, 1015],
  [915, 945],
  [1070, 1115],
  [950, 1070],
  [1045, 1075],
  [530, 560],
  [1045, 1105],
  [695, 785],
  [520, 535],
  [830, 890],
  [775, 790],
  [600, 660],
  [910, 970],
  [535, 595],
  [1075, 1105]
]; // [startMinute, endMinute], half-open [start, end)

function planRooms(meetings) {
  // Return [roomsNeeded, firstPeakStart, firstPeakEnd]
}

const [rooms, peakStart, peakEnd] = planRooms(meetings);
const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
console.log(rooms);
console.log(hhmm(peakStart) + "-" + hhmm(peakEnd));
```

**Expected output**

```
12
08:55-09:05
```

**Explanation**: Turn every meeting into a +1 event at its start and a -1 event at its end, sort them by time with ends before starts at the same minute (half-open intervals), and sweep while keeping a running count. The maximum running count is the number of rooms; the window opens at the event where the count first reaches that maximum and closes at the next event that lowers it.

Common mistake: Sorting starts before ends at equal times, which counts back-to-back meetings as overlapping and over-reports rooms; or reporting the last peak window instead of the first.

## PYTHON

### Q23633 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Shipping container nesting

Language: Python. Complete the function in the starter code; the data and the printing are already there.

A logistics company wants to nest empty containers inside each other for return shipping. Box A fits inside box B only if A's width < B's width AND A's depth < B's depth (strictly; boxes cannot be rotated).

Print the maximum number of boxes in a single nested chain.

Target O(n log n). Sorting by width alone and counting, or a greedy pass, gives the wrong answer when widths are equal.

Your program receives no input: the data is already defined in the starter code. Keep it as given, and print exactly the output described above -- the judge compares your output with the expected output character for character (trailing spaces ignored).

**Starter code / given tables**

```python
boxes = [(198, 24), (102, 180), (121, 178), (99, 44), (126, 131), (125, 51), (180, 56), (177, 87), (14, 95), (115, 96), (34, 109), (33, 116), (147, 27), (136, 64), (139, 18), (153, 64), (46, 175), (119, 119), (166, 173), (92, 197), (195, 43), (170, 119), (157, 10), (29, 55), (146, 121), (38, 103), (103, 30), (101, 28), (22, 93), (87, 67), (93, 97), (69, 137), (59, 91), (34, 176), (123, 170), (164, 124), (138, 16), (15, 24), (22, 126), (53, 196), (10, 162), (24, 143), (86, 96), (16, 27), (119, 148), (16, 45), (194, 101), (69, 123), (189, 45), (11, 83), (161, 190), (91, 129), (110, 153), (127, 106), (73, 116), (32, 144), (164, 56), (115, 144), (117, 191), (101, 168), (28, 64), (101, 176), (143, 109), (49, 186), (92, 179), (96, 179), (15, 18), (12, 69), (17, 145), (161, 168)]  # (width_cm, depth_cm); boxes cannot be rotated

def max_nesting(boxes):
    # Return the length of the longest chain of boxes that nest inside each other
    pass

print(max_nesting(boxes))
```

**Expected output**

```
11
```

**Explanation**: Sort by width ascending and, for equal widths, by depth descending. Equal widths can then never chain. The answer is the longest strictly increasing subsequence of the depths, found in O(n log n) with patience sorting (binary search over the smallest tail of each length).

Common mistake: Sorting equal widths by depth ascending, which lets two boxes of the same width appear to nest and over-counts the chain.

### Q23635 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

Render farm job selection

Language: Python. Complete the function in the starter code; the data and the printing are already there.

A render farm machine can run one job at a time. There are 50 job offers, each with a start hour, end hour and profit. A job may start exactly when the previous one ends.

Print the maximum total profit on the first line and, on the second, the ids of a set of jobs that achieves it, sorted and separated by spaces.

Rule for a unique answer: sort jobs by (end, start, id). For each job in that order, take it only when taking it is STRICTLY better than skipping it.

Greedy by profit or by earliest end does not maximise profit; this needs dynamic programming with binary search (O(n log n)).

Your program receives no input: the data is already defined in the starter code. Keep it as given, and print exactly the output described above -- the judge compares your output with the expected output character for character (trailing spaces ignored).

**Starter code / given tables**

```python
jobs = [('J01', 93, 126, 93), ('J02', 72, 85, 66), ('J03', 194, 214, 54), ('J04', 99, 135, 109), ('J05', 62, 101, 90), ('J06', 46, 51, 44), ('J07', 17, 44, 15), ('J08', 148, 159, 86), ('J09', 53, 91, 44), ('J10', 144, 153, 96), ('J11', 150, 187, 14), ('J12', 9, 24, 116), ('J13', 156, 176, 82), ('J14', 129, 142, 108), ('J15', 146, 182, 115), ('J16', 2, 21, 29), ('J17', 194, 223, 89), ('J18', 193, 230, 94), ('J19', 27, 42, 75), ('J20', 83, 114, 21), ('J21', 151, 164, 76), ('J22', 138, 170, 75), ('J23', 49, 86, 82), ('J24', 164, 190, 82), ('J25', 1, 40, 65), ('J26', 146, 181, 18), ('J27', 119, 132, 103), ('J28', 58, 69, 36), ('J29', 79, 118, 97), ('J30', 147, 173, 117), ('J31', 57, 86, 57), ('J32', 166, 205, 51), ('J33', 112, 148, 49), ('J34', 146, 181, 28), ('J35', 4, 31, 118), ('J36', 105, 121, 36), ('J37', 186, 198, 17), ('J38', 78, 89, 33), ('J39', 1, 10, 73), ('J40', 186, 208, 82), ('J41', 88, 115, 26), ('J42', 172, 192, 80), ('J43', 86, 91, 56), ('J44', 147, 167, 13), ('J45', 157, 168, 92), ('J46', 23, 60, 93), ('J47', 153, 186, 32), ('J48', 157, 176, 101), ('J49', 98, 112, 75), ('J50', 125, 153, 20)]  # (id, start_hour, end_hour, profit); a job may start when another ends
def best_schedule(jobs):
    # Return (max_profit, sorted list of chosen job ids)
    pass

profit, chosen = best_schedule(jobs)
print(profit)
print(" ".join(chosen))
```

**Expected output**

```
956
J01 J02 J06 J10 J12 J14 J18 J19 J28 J42 J43 J45
```

**Explanation**: Sort jobs by end time. dp[i] is the best profit using the first i jobs: either skip job i (dp[i-1]) or take it and add its profit to dp[k], where k counts the jobs ending no later than job i starts, found by binary search. Backtracking through the 'take' decisions recovers the chosen jobs.

Common mistake: Using the earliest-finish greedy, which maximises the NUMBER of jobs, not the profit; or using a strict comparison on end <= start and wrongly forbidding back-to-back jobs.

## SQL

### Q23632 - Management Principles and Organizational Structures

*type CRITICAL_THINKING | difficulty HARD*

October meeting-room revenue

Language: SQL. Write ONE SQL statement (SQLite dialect) in the editor. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described below. Formatting, letter case and aliases inside the query do not matter.

A coworking company is replacing its spreadsheet of meeting-room bookings with a booking management system. The tables are shown with the problem:

- `room` -- every meeting room, its type, floor and hourly rate in KRW.
- `booking` -- each booking of a room: the date it starts (`start_date`, YYYY-MM-DD), how many hours it was booked for, and its `status` (CONFIRMED or CANCELLED).
- `extra_charge` -- additional items billed on a booking (catering, equipment).

The room charge of a booking is hours x the room's hourly rate. Cancelled bookings earn nothing.

Write a SQL statement to list the rooms whose total room charges for October 2026, based on the booking start date, came to more than 1,000,000 KRW. Exclude additional costs (extra charges).

Return one row per room with these columns, in this order: `room_no`, `room_type`, `total_revenue` (the total room charge). Order the rows by `total_revenue` from highest to lowest, and by `room_no` on a tie.

**Starter code / given tables**

```sql
CREATE TABLE room (
  room_no TEXT PRIMARY KEY,
  room_type TEXT NOT NULL,
  floor INTEGER NOT NULL,
  hourly_rate INTEGER NOT NULL
);
CREATE TABLE booking (
  booking_id INTEGER PRIMARY KEY,
  room_no TEXT NOT NULL,
  member_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  hours INTEGER NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE extra_charge (
  charge_id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  item TEXT NOT NULL,
  amount INTEGER NOT NULL
);

INSERT INTO room (room_no, room_type, floor, hourly_rate) VALUES
  ('R101', 'Small', 1, 40000),
  ('R102', 'Small', 1, 40000),
  ('R201', 'Medium', 2, 70000),
  ('R202', 'Medium', 2, 70000),
  ('R301', 'Boardroom', 3, 120000);

INSERT INTO booking (booking_id, room_no, member_id, start_date, hours, status) VALUES
  (1, 'R301', 11, '2026-10-02', 4, 'CONFIRMED'),
  (2, 'R301', 12, '2026-10-09', 3, 'CONFIRMED'),
  (3, 'R301', 13, '2026-10-20', 5, 'CANCELLED'),
  (4, 'R301', 11, '2026-10-27', 2, 'CONFIRMED'),
  (5, 'R201', 14, '2026-09-30', 3, 'CONFIRMED'),
  (6, 'R201', 15, '2026-10-05', 8, 'CONFIRMED'),
  (7, 'R201', 14, '2026-10-22', 6, 'CONFIRMED'),
  (8, 'R202', 16, '2026-10-01', 10, 'CONFIRMED'),
  (9, 'R202', 12, '2026-10-15', 5, 'CONFIRMED'),
  (10, 'R101', 17, '2026-10-06', 10, 'CONFIRMED'),
  (11, 'R101', 18, '2026-10-19', 15, 'CONFIRMED'),
  (12, 'R101', 17, '2026-11-01', 4, 'CONFIRMED'),
  (13, 'R102', 19, '2026-10-03', 12, 'CONFIRMED'),
  (14, 'R102', 13, '2026-10-14', 10, 'CONFIRMED'),
  (15, 'R102', 19, '2026-10-31', 8, 'CONFIRMED');

INSERT INTO extra_charge (charge_id, booking_id, item, amount) VALUES
  (1, 6, 'Catering', 50000),
  (2, 8, 'Projector', 30000),
  (3, 8, 'Catering', 45000),
  (4, 11, 'Whiteboard kit', 20000);
```

**Expected output**

```
SELECT r.room_no,
       r.room_type,
       SUM(b.hours * r.hourly_rate) AS total_revenue
FROM booking b
JOIN room r ON r.room_no = b.room_no
WHERE b.status = 'CONFIRMED'
  AND b.start_date >= '2026-10-01'
  AND b.start_date < '2026-11-01'
GROUP BY r.room_no, r.room_type
HAVING SUM(b.hours * r.hourly_rate) > 1000000
ORDER BY total_revenue DESC, r.room_no;
```

**Explanation**: Join booking to room to price each booking (hours x hourly_rate), keep only CONFIRMED bookings whose start_date falls in October 2026 (>= '2026-10-01' and < '2026-11-01'), group by room, and filter the groups with HAVING SUM(...) > 1000000 -- a condition on a total belongs in HAVING, not WHERE. extra_charge is not joined at all: the question excludes additional costs, and joining it would also repeat a booking once per charge. R101 totals exactly 1,000,000 and is not 'more than'; R201 only passes if its September booking or its catering charge is wrongly counted.

Common mistake: Putting the SUM condition in WHERE, forgetting to drop CANCELLED bookings, using BETWEEN '2026-10-01' AND '2026-11-01' (which takes in the 1 November booking), or joining extra_charge and so double-counting bookings with several charges.

# TOPCIT (certification 13)

## C

### Q2450 - Software Maintenance Strategies

*type CRITICAL_THINKING | difficulty AVERAGE*

A company operates a logistics management system that is now experiencing failures whenever a new type of shipment code is entered. The system was originally designed to accept shipment codes of up to 4 characters, but business requirements have evolved and codes up to 6 characters are now being used. Write a function that adapts the system to accept shipment codes of up to 6 characters, and rejects any longer codes, while logging an error message for invalid entries. Input: a string representing the shipment code. Output: 'Accepted' if valid, otherwise log an error and output 'Rejected'.

Rules for this question: implement check_shipment_code(code), using the global error log (error_log and error_count). A code of 1 to 6 characters is valid: return "Accepted". Any other code (empty, or longer than 6 characters) appends "Invalid shipment code: <code>" to the log and returns "Rejected". main prints each result and then the log, one entry per line.

Language: C. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```c
#include <stdio.h>
#include <string.h>

char error_log[16][64];
int error_count = 0;

const char *check_shipment_code(const char *code) {
    // Your code here
    return "";
}

int main(void) {
    const char *codes[] = {"ABCD", "ABCDEF", "ABCDEFG", "", "X1"};
    for (int i = 0; i < 5; i++) {
        printf("%s\n", check_shipment_code(codes[i]));
    }
    printf("Log (%d):\n", error_count);
    for (int i = 0; i < error_count; i++) {
        printf("%s\n", error_log[i]);
    }
    return 0;
}
```

**Expected output**

```
Accepted
Accepted
Rejected
Rejected
Accepted
Log (2):
Invalid shipment code: ABCDEFG
Invalid shipment code:
```

**Explanation**: A code is accepted when its length is 1 to 6; anything else -- including the empty code -- is logged as 'Invalid shipment code: <code>' and rejected.

Common mistake: Accepting the empty code because its length is not more than 6.

### Q2452 - Data, Information, and Knowledge

*type CRITICAL_THINKING | difficulty AVERAGE*

You are tasked with creating a simple data processing script for a retail company. The company collects daily sales figures as a list of numbers (e.g., [120, 150, 90, 200, 130]). Write a function that takes this list of raw sales data and returns a summary dictionary containing (a) the total sales, (b) the highest single-day sale, and (c) the average daily sale, rounded to two decimal places. Input: A list of integers representing daily sales. Output: A dictionary with keys 'total', 'max', and 'average'.

Rules for this question: implement summarize_sales(sales, n) returning a struct Summary with the total, the highest single-day sale and the average daily sale. For an empty array every field is 0. main prints "total=<t> max=<m> average=<a>" with the average to 2 decimal places.

Language: C. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```c
#include <stdio.h>

struct Summary {
    int total;
    int max;
    double average;
};

struct Summary summarize_sales(const int *sales, int n) {
    // Your code here
    struct Summary s = {0, 0, 0.0}; return s;
}

static void show(const int *sales, int n) {
    struct Summary s = summarize_sales(sales, n);
    printf("total=%d max=%d average=%.2f\n", s.total, s.max, s.average);
}

int main(void) {
    int week[] = {120, 150, 90, 200, 130};
    int three[] = {10, 20, 25};
    show(week, 5);
    show(three, 3);
    show(week, 0);
    return 0;
}
```

**Expected output**

```
total=690 max=200 average=138.00
total=55 max=25 average=18.33
total=0 max=0 average=0.00
```

**Explanation**: Sum the sales and track the largest in one pass; the average is the total divided by the count, and an empty array gives all zeros.

Common mistake: Integer division for the average, which prints 18.00 instead of 18.33.

### Q2464 - Physical Layer and Media

*type CRITICAL_THINKING | difficulty AVERAGE*

A network diagnostics tool must verify that the physical layer between two devices is operational. The tool receives a stream of bits from the sender and must check for bit synchronization errors by comparing timing intervals between received bits. Write a function that takes a list of tuples, each containing a bit (0 or 1) and its timestamp (in milliseconds), and returns True if all intervals are consistent (difference between timestamps is constant), False otherwise.

Rules for this question: implement intervals_consistent(bits, n), where bits is an array of {bit, timestamp} records in order. Return 1 if every gap between consecutive timestamps is the same (fewer than 3 records is always 1), otherwise 0. main prints true or false for each stream.

Language: C. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```c
#include <stdio.h>

struct Bit {
    int bit;
    int timestamp;
};

int intervals_consistent(const struct Bit *bits, int n) {
    // Your code here
    return 0;
}

int main(void) {
    struct Bit two[] = {{1, 0}, {0, 10}};
    struct Bit even[] = {{1, 0}, {0, 10}, {1, 20}, {1, 30}};
    struct Bit uneven[] = {{1, 0}, {0, 10}, {1, 25}, {0, 35}};
    printf("%s\n", intervals_consistent(two, 0) ? "true" : "false");
    printf("%s\n", intervals_consistent(two, 2) ? "true" : "false");
    printf("%s\n", intervals_consistent(even, 4) ? "true" : "false");
    printf("%s\n", intervals_consistent(uneven, 4) ? "true" : "false");
    return 0;
}
```

**Expected output**

```
true
true
true
false
```

**Explanation**: Fewer than three records are trivially consistent; otherwise take the first gap and check every later gap equals it.

Common mistake: Comparing timestamps instead of the gaps between them.

### Q2852 - Physical Layer and Media

*type CRITICAL_THINKING | difficulty HARD*

You are tasked with simulating a simple physical layer transmission between two devices. Each device sends a sequence of bits (0s and 1s) through a copper cable. Implement a function that takes a list of bits as input and simulates transmission by converting every '1' into a voltage pulse (represented as 'V') and every '0' into no pulse (represented as '-'). The function should then reconstruct the original bit sequence from the received signal, accounting for possible inversion errors (where a 'V' might be received as '-') in up to one position. If an error is detected, correct it and output the corrected bit sequence. Input: a list of bits (e.g., [1,0,1,1,0]), Output: corrected list of bits.

Rules for this question: implement encode_bits(bits, n, out), which writes the signal for bits[0..n-1] into out ('V' for 1, '-' for 0, then '\0'), and decode_signal(signal, bits), which writes the bits of the signal into bits and returns how many there are. main prints the results.

Language: C. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```c
#include <stdio.h>
#include <string.h>

/* Writes the signal for bits[0..n-1] into out: 'V' for 1, '-' for 0, then '\0'. */
void encode_bits(const int *bits, int n, char *out) {
    // Your code here
    out[0] = '\0';
}

/* Writes the bits of signal into bits and returns how many there are. */
int decode_signal(const char *signal, int *bits) {
    // Your code here
    return 0;
}

static void print_bits(const int *bits, int n) {
    printf("[");
    for (int i = 0; i < n; i++) printf(i ? " %d" : "%d", bits[i]);
    printf("]\n");
}

int main(void) {
    int a[] = {1, 0, 1, 1, 0};
    int b[] = {0, 0, 1};
    char out[64];
    int bits[64];
    encode_bits(a, 5, out);
    printf("%s\n", out);
    print_bits(bits, decode_signal("V--VV-V", bits));
    encode_bits(b, 3, out);
    print_bits(bits, decode_signal(out, bits));
    encode_bits(a, 0, out);
    printf("[%s]\n", out);
    return 0;
}
```

**Expected output**

```
V-VV-
[1 0 0 1 1 0 1]
[0 0 1]
[]
```

**Explanation**: Walk the array once and write 'V' for each 1 and '-' for each 0, then terminate the string; decoding is the reverse mapping, returning how many bits were written.

Common mistake: Forgetting the terminating '\0', so the printed signal runs into leftover characters.

### Q2854 - Data Link Layer

*type CRITICAL_THINKING | difficulty HARD*

Write a program that parses a network frame at the data link layer. Each frame consists of a start delimiter, a 6-character MAC address, a data segment of variable length, a 2-character error detection field (checksum), and an end delimiter. The program should validate the MAC address format, check the checksum for data integrity, and return the data segment if all checks pass. If any check fails, return an appropriate error message.

Rules for this question: implement parse_frame(frame, data). A frame is 'S|MAC|DATA|CHECKSUM|E'. If it does not have exactly those 5 parts starting with 'S' and ending with 'E', return "Error: Invalid frame". The MAC must be exactly 6 characters of 0-9 or A-F, otherwise return "Error: Invalid MAC address". The checksum is the sum of the character codes of DATA modulo 256, written as 2 uppercase hex digits; if it does not match return "Error: Checksum mismatch". Otherwise copy DATA into data and return data. main prints each result.

Language: C. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```c
#include <stdio.h>
#include <string.h>

const char *parse_frame(const char *frame, char *data) {
    // Your code here
    data[0] = '\0'; return data;
}

int main(void) {
    const char *frames[] = {"S|A1B2C3|hello|14|E", "S|A1B2C3|hello|15|E", "S|A1B2G3|hello|14|E",
                            "S|A1B2C3|hello|14", "S|00FF00|OK|9A|E"};
    char data[256];
    for (int i = 0; i < 5; i++) {
        printf("%s\n", parse_frame(frames[i], data));
    }
    return 0;
}
```

**Expected output**

```
hello
Error: Checksum mismatch
Error: Invalid MAC address
Error: Invalid frame
OK
```

**Explanation**: Validate in the order the rules give: exactly four '|' separators with 'S' first and 'E' last, then a 6-character uppercase hex MAC, then the checksum -- the sum of DATA's character codes modulo 256 printed as two uppercase hex digits.

Common mistake: Checking the checksum before the frame shape, or comparing it in lowercase hex.

### Q2879 - Physical Layer and Media

*type CRITICAL_THINKING | difficulty AVERAGE*

Write a program that simulates bit synchronization at the physical layer. Given two lists representing the timing of sent and received bits (each as a sequence of timestamps in milliseconds), determine if the receiver is synchronized with the sender within a specified tolerance (e.g., ±2 ms). If not, output the first index where synchronization fails. If all bits are synchronized, output "Synchronized".

Rules for this question: implement first_mismatch(sent, ns, received, nr, tolerance). Compare timestamps position by position; a position is out of sync when the absolute difference is greater than tolerance, or when one array has no value there. Return the first such index, or -1 when the streams are synchronized. main prints "First mismatch at index <i>" or "Synchronized".

Language: C. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```c
#include <stdio.h>
#include <stdlib.h>

int first_mismatch(const int *sent, int ns, const int *received, int nr, int tolerance) {
    // Your code here
    return -1;
}

static void report(const int *sent, int ns, const int *received, int nr, int tolerance) {
    int i = first_mismatch(sent, ns, received, nr, tolerance);
    if (i < 0) printf("Synchronized\n");
    else printf("First mismatch at index %d\n", i);
}

int main(void) {
    int s1[] = {10, 20, 30, 40}, r1[] = {11, 21, 29, 41};
    int s2[] = {10, 20, 30, 40}, r2[] = {10, 23, 30, 49};
    int s3[] = {10, 20, 30}, r3[] = {10, 20};
    int s4[] = {10, 20, 30}, r4[] = {12, 18, 32};
    report(s1, 4, r1, 4, 2);
    report(s2, 4, r2, 4, 2);
    report(s3, 3, r3, 2, 2);
    report(s4, 3, r4, 3, 2);
    return 0;
}
```

**Expected output**

```
Synchronized
First mismatch at index 1
First mismatch at index 2
Synchronized
```

**Explanation**: Compare position by position up to the longer stream: a missing value or a difference greater than the tolerance is the first mismatch; only if none is found are the streams synchronized.

Common mistake: Stopping at the shorter stream, so a missing timestamp at the end is never reported.

### Q2880 - Physical Layer and Media

*type CRITICAL_THINKING | difficulty AVERAGE*

Develop a script to validate whether a given physical connection between two network devices is suitable for high-speed data transmission. The input includes the type of cable (e.g., 'Cat5e', 'Cat6', 'Single-mode fiber'), its length in meters, and the required data rate in Mbps. The script should output either 'Suitable' or 'Not Suitable', considering cable type limitations and maximum recommended lengths.

Rules for this question: implement cable_suitable(cable_type, length_m, data_rate_mbps) returning 1 when the cable can carry the data rate over that length, otherwise 0, using these limits: "Cat5e" supports up to 1000 Mbps within 100 m; "Cat6" up to 10000 Mbps within 55 m, or up to 1000 Mbps within 100 m; "Single-mode fiber" up to 10000 Mbps within 10000 m. Any other cable type is not suitable. main prints Suitable or Not Suitable for each case.

Language: C. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```c
#include <stdio.h>
#include <string.h>

int cable_suitable(const char *cable_type, int length_m, int data_rate_mbps) {
    // Your code here
    return 0;
}

int main(void) {
    const char *types[] = {"Cat5e", "Cat5e", "Cat6", "Cat6", "Cat6", "Single-mode fiber", "Coax"};
    int lengths[] = {90, 120, 50, 80, 80, 9000, 10};
    int rates[] = {1000, 100, 10000, 10000, 1000, 10000, 10};
    for (int i = 0; i < 7; i++) {
        printf("%s %dm %dMbps: %s\n", types[i], lengths[i], rates[i],
               cable_suitable(types[i], lengths[i], rates[i]) ? "Suitable" : "Not Suitable");
    }
    return 0;
}
```

**Expected output**

```
Cat5e 90m 1000Mbps: Suitable
Cat5e 120m 100Mbps: Not Suitable
Cat6 50m 10000Mbps: Suitable
Cat6 80m 10000Mbps: Not Suitable
Cat6 80m 1000Mbps: Suitable
Single-mode fiber 9000m 10000Mbps: Suitable
Coax 10m 10Mbps: Not Suitable
```

**Explanation**: Look up the cable's limits and accept when both the rate and the length are within one of them; Cat6 has two limits, so 80 m works only at 1000 Mbps.

Common mistake: Checking only the maximum rate of Cat6 and ignoring its 55 m limit at 10 Gbps.

### Q2881 - Data Link Layer

*type CRITICAL_THINKING | difficulty AVERAGE*

Create a function that simulates a frame relay at the data link layer. The function should accept a list of frames, where each frame includes a source MAC address, destination MAC address, data payload, and a simple parity bit for error checking. The function must verify the parity, deliver the frame if the parity is correct, and return an error message if not. Output a list of successfully delivered data payloads.

Rules for this question: implement relay_frame(frame, out) using even parity: a frame's parity must equal the number of '1' characters in its data, modulo 2. Write the frame's data into out when the parity is correct, or "Error: Parity check failed for frame from <src> to <dst>" when it is not. main relays each frame in order and prints one line per frame.

Language: C. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```c
#include <stdio.h>
#include <string.h>

struct Frame {
    const char *src;
    const char *dst;
    const char *data;
    int parity;
};

void relay_frame(const struct Frame *frame, char *out) {
    // Your code here
    out[0] = '\0';
}

int main(void) {
    struct Frame frames[] = {
        {"AA:BB:CC:DD:EE:FF", "11:22:33:44:55:66", "1011", 1},
        {"AA:BB:CC:DD:EE:FF", "11:22:33:44:55:66", "1001", 1},
        {"11:22:33:44:55:66", "AA:BB:CC:DD:EE:FF", "0000", 0},
        {"11:22:33:44:55:66", "AA:BB:CC:DD:EE:FF", "1110111", 0},
    };
    char out[256];
    for (int i = 0; i < 4; i++) {
        relay_frame(&frames[i], out);
        printf("%s\n", out);
    }
    return 0;
}
```

**Expected output**

```
1011
Error: Parity check failed for frame from AA:BB:CC:DD:EE:FF to 11:22:33:44:55:66
0000
1110111
```

**Explanation**: Count the '1' characters in the frame's data; the frame passes when that count modulo 2 equals its parity bit, otherwise the error names its source and destination.

Common mistake: Treating parity 1 as 'even', which flips every verdict.

### Q3103 - Project Scheduling and Resources

*type CRITICAL_THINKING | difficulty HARD*

You are working with a project management tool that tracks the allocation of resources for each phase of a project. Write a function that, given a list of project phases (each with a start date, end date, and required resource count), and a total available resource pool, determines whether the resource allocation plan is feasible. The function should return True if, at any point, the total required resources across overlapping phases exceed the available pool, and False otherwise.

Input: List of phases (each with start_date, end_date, resources_needed), total_resources (integer)
Output: Boolean indicating if the plan is feasible

Constraints:
- Phases may overlap in time.
- Resources are not released until the end_date of each phase.
- Dates are given as integers (e.g., day numbers).

Example:
phases = [ {'start': 1, 'end': 5, 'resources': 3}, {'start': 4, 'end': 7, 'resources': 4} ]
total_resources = 6
Expected output: False (because on days 4-5, total needed is 7 > 6)

Rules for this question: implement is_feasible(phases, n, total_resources). The plan is feasible when, on every day, the resources of all phases running that day (start and end days included) add up to no more than total_resources. Return 1 when feasible, 0 as soon as any day needs more. main prints feasible or not feasible.

Language: C. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```c
#include <stdio.h>

struct Phase {
    int start;
    int end;
    int resources;
};

int is_feasible(const struct Phase *phases, int n, int total_resources) {
    // Your code here
    return 0;
}

int main(void) {
    struct Phase overlap[] = {{1, 5, 3}, {4, 7, 4}};
    struct Phase apart[] = {{1, 5, 3}, {6, 7, 4}};
    struct Phase exact[] = {{1, 5, 3}, {5, 7, 3}};
    printf("%s\n", is_feasible(overlap, 2, 6) ? "feasible" : "not feasible");
    printf("%s\n", is_feasible(apart, 2, 6) ? "feasible" : "not feasible");
    printf("%s\n", is_feasible(exact, 2, 6) ? "feasible" : "not feasible");
    printf("%s\n", is_feasible(overlap, 0, 6) ? "feasible" : "not feasible");
    return 0;
}
```

**Expected output**

```
not feasible
feasible
feasible
feasible
```

**Explanation**: For every day from the earliest start to the latest end, add the resources of the phases running that day (both ends inclusive) and fail as soon as a day exceeds the limit.

Common mistake: Comparing each phase's resources with the limit on its own instead of adding up every phase running on the same day.

### Q3106 - Project Scheduling and Resources

*type CRITICAL_THINKING | difficulty AVERAGE*

Write a function to generate a schedule for a project using the waterfall methodology. The function takes a list of phases (each with a duration in days) and returns a list of tuples with each phase's start and end day, assuming work starts on day 1 and each phase begins immediately after the previous one ends.

Input: List of tuples (phase_name, duration)
Output: List of tuples (phase_name, start_day, end_day)

Example:
phases = [('Requirements', 5), ('Design', 3), ('Implementation', 7)]
Expected output: [('Requirements', 1, 5), ('Design', 6, 8), ('Implementation', 9, 15)]

Rules for this question: implement waterfall_schedule(phases, n, slots), where phases is an array of {name, days}. Work starts on day 1 and each phase begins the day after the previous one ends; a phase of 0 days or fewer is skipped. Fill slots with {name, start, end} and return how many there are. main prints one line per slot as "<name>: day <start> to day <end>".

Language: C. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```c
#include <stdio.h>

struct Phase {
    const char *name;
    int days;
};

struct Slot {
    const char *name;
    int start;
    int end;
};

int waterfall_schedule(const struct Phase *phases, int n, struct Slot *slots) {
    // Your code here
    return 0;
}

int main(void) {
    struct Phase phases[] = {{"Requirements", 5}, {"Design", 3}, {"Review", 0}, {"Implementation", 7},
                             {"Testing", 1}};
    struct Slot slots[8];
    int count = waterfall_schedule(phases, 5, slots);
    for (int i = 0; i < count; i++) {
        printf("%s: day %d to day %d\n", slots[i].name, slots[i].start, slots[i].end);
    }
    return 0;
}
```

**Expected output**

```
Requirements: day 1 to day 5
Design: day 6 to day 8
Implementation: day 9 to day 15
Testing: day 16 to day 16
```

**Explanation**: Keep a running day starting at 1; each phase runs from that day to day + days - 1 and the next starts the day after. Phases of 0 days are skipped.

Common mistake: Starting the next phase on the previous end day, so phases overlap by one day.

## C#

### Q2468 - Network Service Architecture

*type CRITICAL_THINKING | difficulty AVERAGE*

Design a simple function  that simulates the authentication process for a network service architecture. The function should accept a user identity, password, and a list of valid credentials. It should return whether the authentication is successful or failed. Additionally, modify your function to log every authentication attempt (user, result) to an in-memory log list. Show how the log can be used to identify failed authentication attempts for a specific user.

Rules for this question: complete Authenticate(user, password, validCredentials, log). validCredentials maps users to passwords. Add "<user>: Success" or "<user>: Failed" to log and return "Success" or "Failed".

Language: C#. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static string Authenticate(string user, string password, Dictionary<string, string> validCredentials,
                               List<string> log)
    {
        // Your code here
        return "";
    }

    static void Main()
    {
        var valid = new Dictionary<string, string> { { "alice", "pw123" }, { "bob", "pw456" } };
        var log = new List<string>();
        Console.WriteLine(Authenticate("alice", "pw123", valid, log));
        Console.WriteLine(Authenticate("bob", "wrong", valid, log));
        Console.WriteLine(Authenticate("carol", "pw123", valid, log));
        Console.WriteLine(Authenticate("bob", "pw456", valid, log));
        Console.WriteLine("Log:");
        foreach (string entry in log) Console.WriteLine(entry);
    }
}
```

**Expected output**

```
Success
Failed
Failed
Success
Log:
alice: Success
bob: Failed
carol: Failed
bob: Success
```

**Explanation**: Compare the password with the stored one (a missing user fails), add '<user>: <result>' to the log, and return the result.

Common mistake: Only logging failures, so the log no longer shows every attempt.

### Q2495 - Requirements Specification

*type CRITICAL_THINKING | difficulty AVERAGE*

You are given a requirements specification for a user registration system. The requirement states: 'The system must not allow duplicate usernames, and the password must be at least 8 characters long and contain at least one digit.' Implement a function that receives a list of registration attempts (each with 'username' and 'password') and a list of existing usernames, and returns a list of accepted usernames. The function should reject attempts that violate either requirement. Include comments and handle edge cases, such as empty input and usernames with leading/trailing spaces.

Rules for this question: complete AcceptedUsernames(attempts, existingUsernames), where each attempt has a Username and a Password. Trim spaces from each username first. Accept an attempt only if the username is not empty, is not in existingUsernames, has not already been accepted earlier in the list, and the password is at least 8 characters long and contains at least one digit. Return the accepted (trimmed) usernames in order; main prints them separated by ", " (or "(none)").

Language: C#. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Attempt
{
    public string Username;
    public string Password;
    public Attempt(string username, string password) { Username = username; Password = password; }
}

class Program
{
    static List<string> AcceptedUsernames(List<Attempt> attempts, List<string> existingUsernames)
    {
        // Your code here
        return new List<string>();
    }

    static void Show(List<string> names)
    {
        Console.WriteLine(names.Count == 0 ? "(none)" : string.Join(", ", names));
    }

    static void Main()
    {
        var attempts = new List<Attempt> {
            new Attempt(" alice ", "secret123"), new Attempt("bob", "short1"), new Attempt("carol", "nodigitshere"),
            new Attempt("alice", "another99"), new Attempt("dave", "password8"), new Attempt("   ", "blank1234"),
            new Attempt("erin", "erinpass1")
        };
        Show(AcceptedUsernames(attempts, new List<string> { "dave" }));
        Show(AcceptedUsernames(new List<Attempt>(), new List<string>()));
    }
}
```

**Expected output**

```
alice, erin
(none)
```

**Explanation**: Trim each username, then accept it only if it is non-empty, not already taken (existing or accepted earlier) and the password has 8+ characters including a digit.

Common mistake: Checking duplicates before trimming, so ' alice ' and 'alice' are both accepted.

### Q2497 - Requirements Collection and Analysis

*type CRITICAL_THINKING | difficulty AVERAGE*

A requirements engineer receives a set of informal requirements for an online booking system. One requirement reads: 'The system should allow users to book a ticket if they are logged in and the seat is available.' Write a function that, given a user object ('is_logged_in'), a seat object ('is_available'), and a booking list, books the seat for the user if both conditions are met. The function should update the booking list and return the updated list. Include comments and handle the case where the user is not logged in or the seat is not available.

Rules for this question: complete BookSeat(user, seat, bookings). If the user is logged in and the seat is available, add the booking "<user name> -> <seat code>" to bookings and mark the seat unavailable. Return true when a booking was made, otherwise false. main prints each result and then the bookings.

Language: C#. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```csharp
using System;
using System.Collections.Generic;

class User
{
    public string Name;
    public bool IsLoggedIn;
    public User(string name, bool isLoggedIn) { Name = name; IsLoggedIn = isLoggedIn; }
}

class Seat
{
    public string Code;
    public bool IsAvailable;
    public Seat(string code, bool isAvailable) { Code = code; IsAvailable = isAvailable; }
}

class Program
{
    static bool BookSeat(User user, Seat seat, List<string> bookings)
    {
        // Your code here
        return false;
    }

    static void Main()
    {
        var bookings = new List<string>();
        var seat12A = new Seat("12A", true);
        Console.WriteLine(BookSeat(new User("Ana", true), seat12A, bookings));
        Console.WriteLine(BookSeat(new User("Ben", false), new Seat("12B", true), bookings));
        Console.WriteLine(BookSeat(new User("Cy", true), new Seat("12C", false), bookings));
        Console.WriteLine(BookSeat(new User("Dee", true), seat12A, bookings));
        Console.WriteLine(BookSeat(new User("Eve", true), new Seat("14F", true), bookings));
        Console.WriteLine("Bookings: " + bookings.Count);
        foreach (string b in bookings) Console.WriteLine(b);
    }
}
```

**Expected output**

```
True
False
False
False
True
Bookings: 2
Ana -> 12A
Eve -> 14F
```

**Explanation**: Book only when the user is logged in and the seat is available, then mark the seat taken so a second booking of the same seat fails.

Common mistake: Leaving the seat available after booking, so Dee also gets 12A.

### Q2556 - Database Requirements Collection

*type CRITICAL_THINKING | difficulty AVERAGE*

You are developing a system to manage stakeholder feedback during database requirements collection. The input is a list of feedback entries, each as a dictionary with 'stakeholder', 'feedback', and 'priority' fields. Write a function that returns a dictionary mapping each stakeholder to a list of their feedback entries, ordered by priority (highest first). If a stakeholder has no feedback, they should not appear in the result.

Rules for this question: complete GroupFeedback(entries), where each entry has a Stakeholder, a Feedback text and a Priority. Return, for each stakeholder in order of first appearance, their feedback texts ordered by priority from highest to lowest (equal priorities keep their input order). main prints one line per stakeholder.

Language: C#. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Entry
{
    public string Stakeholder, Feedback;
    public int Priority;
    public Entry(string s, string f, int p) { Stakeholder = s; Feedback = f; Priority = p; }
}

class Program
{
    static List<KeyValuePair<string, List<string>>> GroupFeedback(List<Entry> entries)
    {
        // Your code here
        return new List<KeyValuePair<string, List<string>>>();
    }

    static void Main()
    {
        var entries = new List<Entry> {
            new Entry("Finance", "Monthly totals", 2), new Entry("Sales", "Track leads", 5),
            new Entry("Finance", "Invoice audit trail", 5), new Entry("Finance", "Export to CSV", 2),
            new Entry("Sales", "Mobile access", 3)
        };
        foreach (var group in GroupFeedback(entries))
            Console.WriteLine(group.Key + ": " + string.Join(" | ", group.Value));
        Console.WriteLine("Groups for no feedback: " + GroupFeedback(new List<Entry>()).Count);
    }
}
```

**Expected output**

```
Finance: Invoice audit trail | Monthly totals | Export to CSV
Sales: Track leads | Mobile access
Groups for no feedback: 0
```

**Explanation**: Group entries by stakeholder in order of first appearance, then order each group by priority, highest first, with a stable sort so equal priorities keep their input order.

Common mistake: Sorting all entries first, which reorders the stakeholders themselves.

### Q2558 - Conceptual Database Design

*type CRITICAL_THINKING | difficulty HARD*

Create a function that takes as input a conceptual ER model represented by a list of entities (each with a name and a list of attributes) and a list of relationships (each with two entity names and a relationship type). The function should output a summary mapping each entity to its directly connected entities and the relationship type. If an entity has no relationships, it should map to an empty list.

Rules for this question: complete SummarizeEr(entities, relationships). Return, for every entity in the order given, its list of connections "<other entity> (<relationship type>)". Each relationship {Entity1, Entity2, Type} is added to both entities, in relationship order; an entity with none has an empty list. main prints one line per entity.

Language: C#. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```csharp
using System;
using System.Collections.Generic;

class Relationship
{
    public string Entity1, Entity2, Type;
    public Relationship(string e1, string e2, string type) { Entity1 = e1; Entity2 = e2; Type = type; }
}

class Program
{
    static Dictionary<string, List<string>> SummarizeEr(List<string> entities, List<Relationship> relationships)
    {
        // Your code here
        return new Dictionary<string, List<string>>();
    }

    static void Main()
    {
        var entities = new List<string> { "Customer", "Order", "Product", "Supplier" };
        var relationships = new List<Relationship> {
            new Relationship("Customer", "Order", "one-to-many"),
            new Relationship("Order", "Product", "many-to-many")
        };
        var summary = SummarizeEr(entities, relationships);
        foreach (string e in entities)
        {
            List<string> links;
            summary.TryGetValue(e, out links);
            Console.WriteLine(e + ": " + (links == null || links.Count == 0 ? "-" : string.Join(", ", links)));
        }
    }
}
```

**Expected output**

```
Customer: Order (one-to-many)
Order: Customer (one-to-many), Product (many-to-many)
Product: Order (many-to-many)
Supplier: -
```

**Explanation**: Start every entity with an empty list, then add each relationship to both of its entities in relationship order.

Common mistake: Adding the relationship only to Entity1, so Order never shows Customer.

### Q2581 - Internet of Things Standards

*type CRITICAL_THINKING | difficulty HARD*

Write a function that simulates the registration of a new device in a oneM2M system. The function should accept a device ID and device type, create a <node> and <device> resource representation, and return the URIs for both. Assume the resources are stored in a tree under a CSEBase root and that each resource is uniquely identified by a URI constructed as '/CSEBase/{resource_type}/{device_id}'.

Rules for this question: complete RegisterDevice(deviceId, deviceType). Keep the static Registry, which maps each URI to its resource description "<node|device> <deviceId> <deviceType>". Register both '/CSEBase/node/<deviceId>' and '/CSEBase/device/<deviceId>' and return "<nodeUri> <deviceUri>". Registering a deviceId that is already registered returns "Error: <deviceId> already registered" and changes nothing.

Language: C#. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static Dictionary<string, string> Registry = new Dictionary<string, string>();

    static string RegisterDevice(string deviceId, string deviceType)
    {
        // Your code here
        return "";
    }

    static void Main()
    {
        Console.WriteLine(RegisterDevice("sensorA", "temperature"));
        Console.WriteLine(RegisterDevice("valve7", "actuator"));
        Console.WriteLine(RegisterDevice("sensorA", "humidity"));
        Console.WriteLine("Resources: " + Registry.Count);
        Console.WriteLine(Registry.ContainsKey("/CSEBase/device/valve7") ? Registry["/CSEBase/device/valve7"] : "missing");
    }
}
```

**Expected output**

```
/CSEBase/node/sensorA /CSEBase/device/sensorA
/CSEBase/node/valve7 /CSEBase/device/valve7
Error: sensorA already registered
Resources: 4
device valve7 actuator
```

**Explanation**: Build both URIs from the device id, refuse a device id that is already registered, and store both resources in the registry.

Common mistake: Registering sensorA a second time with a new type instead of returning the error.

### Q2704 - Machine-to-Machine Communications

*type CRITICAL_THINKING | difficulty AVERAGE*

Write a function that simulates the registration of devices in an M2M system following the ETSI M2M architecture. Each device sends a registration request with its ID and type. The system must maintain a registry and reject duplicate registrations. Input: a list of registration requests in the form (device_id, device_type). Output: a list of accepted registrations (device_id, device_type), ignoring duplicates.

Rules for this question: complete RegisterDevices(requests), where each request is a device id and a device type. Return the accepted registrations in order as "<id> (<type>)", ignoring any request whose device id was already registered.

Language: C#. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static List<string> RegisterDevices(List<string[]> requests)
    {
        // Your code here
        return new List<string>();
    }

    static void Main()
    {
        var requests = new List<string[]> {
            new[] { "dev1", "sensor" }, new[] { "dev2", "actuator" }, new[] { "dev1", "camera" },
            new[] { "dev3", "gateway" }, new[] { "dev2", "actuator" }
        };
        foreach (string r in RegisterDevices(requests)) Console.WriteLine(r);
    }
}
```

**Expected output**

```
dev1 (sensor)
dev2 (actuator)
dev3 (gateway)
```

**Explanation**: Keep a set of registered ids and accept a request only the first time its id appears, preserving order.

Common mistake: Deduplicating whole requests, so ('dev1', 'camera') is accepted as different.

### Q2936 - IT Business Operations

*type CRITICAL_THINKING | difficulty HARD*

Your company wants to improve its IT resource allocation process. Write a program that receives as input a list of projects, each with required personnel, budget, and business value score (1-10). The program must allocate available IT personnel and budget to maximize total business value, without exceeding limits. Output the selected projects and the total business value achieved. Assume greedy selection by highest business value per resource unit. Handle cases where not all projects can be funded.

Rules for this question: complete SelectProjects(projects, availablePersonnel, availableBudget). Consider projects from the highest business value per budget unit (BusinessValue / Budget) to the lowest, ties in input order, and select each one that still fits in the remaining personnel and budget. Return the selected projects in selection order; main prints their names and the total business value.

Language: C#. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

class Project
{
    public string Name;
    public int Personnel, Budget, BusinessValue;
    public Project(string name, int personnel, int budget, int value)
    {
        Name = name; Personnel = personnel; Budget = budget; BusinessValue = value;
    }
}

class Program
{
    static List<Project> SelectProjects(List<Project> projects, int availablePersonnel, int availableBudget)
    {
        // Your code here
        return new List<Project>();
    }

    static void Main()
    {
        var projects = new List<Project> {
            new Project("CRM", 2, 100, 8), new Project("Portal", 1, 50, 5),
            new Project("BI", 3, 60, 6), new Project("Mobile", 1, 40, 2)
        };
        var chosen = SelectProjects(projects, 4, 160);
        Console.WriteLine("Selected: " + string.Join(", ", chosen.Select(p => p.Name)));
        Console.WriteLine("Total business value: " + chosen.Sum(p => p.BusinessValue));
    }
}
```

**Expected output**

```
Selected: Portal, BI
Total business value: 11
```

**Explanation**: Sort by value per budget unit, highest first, and take each project that still fits both the remaining personnel and budget.

Common mistake: Sorting by business value alone, which picks CRM first.

### Q3066 - Requirements Documentation

*type CRITICAL_THINKING | difficulty AVERAGE*

You are tasked with creating a tool that checks the completeness of a requirements document for a software project. The requirements document is represented as a JSON object with the following possible keys: 'functional_requirements', 'interface_requirements', 'user_attributes', 'product_features', and 'design_constraints'. Write a function that takes such a JSON object as input and returns a list of any missing required sections. If all sections are present, return an empty list.

Rules for this question: complete MissingSections(document), where document maps section keys to their items. Return the required keys not present in the document, in this order: 'functional_requirements', 'interface_requirements', 'user_attributes', 'product_features', 'design_constraints' (a present but empty section counts as present).

Language: C#. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static List<string> MissingSections(Dictionary<string, List<string>> document)
    {
        // Your code here
        return null;
    }

    static void Show(Dictionary<string, List<string>> document)
    {
        var missing = MissingSections(document) ?? new List<string> { "?" };
        Console.WriteLine(missing.Count == 0 ? "Complete" : "Missing: " + string.Join(", ", missing));
    }

    static void Main()
    {
        var empty = new List<string>();
        Show(new Dictionary<string, List<string>> {
            { "functional_requirements", empty }, { "interface_requirements", empty }, { "user_attributes", empty },
            { "product_features", empty }, { "design_constraints", empty } });
        Show(new Dictionary<string, List<string>> {
            { "user_attributes", new List<string> { "Admins" } }, { "functional_requirements", new List<string> { "Login" } },
            { "notes", empty } });
    }
}
```

**Expected output**

```
Complete
Missing: interface_requirements, product_features, design_constraints
```

**Explanation**: Check the five required keys in the fixed order; a key that is present with an empty list still counts as present.

Common mistake: Reporting empty sections as missing.

### Q3133 - System Requirements Management

*type CRITICAL_THINKING | difficulty AVERAGE*

Write a function that takes as input a System Requirements Specification (SRS) document represented as a dictionary with keys 'purpose', 'scope', 'stakeholders', 'features', and 'performance'. The function should validate the SRS by ensuring all required keys are present and that each field is non-empty. Return True if valid, otherwise return a list of missing or empty fields.

Rules for this question: complete MissingSrsFields(srs), where srs maps section names to their text. Return the sections among 'purpose', 'scope', 'stakeholders', 'features' and 'performance' (in that order) that are missing or empty. main prints "Valid" when none are, otherwise "Missing: " and the list.

Language: C#. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static List<string> MissingSrsFields(Dictionary<string, string> srs)
    {
        // Your code here
        return null;
    }

    static void Show(Dictionary<string, string> srs)
    {
        var missing = MissingSrsFields(srs);
        Console.WriteLine(missing != null && missing.Count == 0 ? "Valid" : "Missing: " + string.Join(", ", missing ?? new List<string>()));
    }

    static void Main()
    {
        Show(new Dictionary<string, string> {
            { "purpose", "Order processing" }, { "scope", "E-commerce site" }, { "stakeholders", "admin, user" },
            { "features", "login, cart" }, { "performance", "500ms response" } });
        Show(new Dictionary<string, string> {
            { "purpose", "Payroll" }, { "scope", "" }, { "features", "  " }, { "performance", "Batch in 1 hour" } });
    }
}
```

**Expected output**

```
Valid
Missing: scope, stakeholders, features
```

**Explanation**: Check the five sections in the given order and collect those that are missing or blank.

Common mistake: Treating a section of spaces as present.

### Q3157 - Requirements Documentation

*type CRITICAL_THINKING | difficulty AVERAGE*

A project manager needs a tool to check if a requirements document is missing any major requirement categories. Given a requirements document structured as a dictionary with keys: 'Functional', 'Interface', 'User Attributes', 'Product Features', and 'Design Constraints', write a function that returns a list of missing categories (if any).

Rules for this question: complete MissingCategories(document), where document maps category names to their items. Return the categories not present as keys, in this order: 'Functional', 'Interface', 'User Attributes', 'Product Features', 'Design Constraints'. Names must match exactly.

Language: C#. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static List<string> MissingCategories(Dictionary<string, List<string>> document)
    {
        // Your code here
        return null;
    }

    static void Show(Dictionary<string, List<string>> document)
    {
        var missing = MissingCategories(document) ?? new List<string> { "?" };
        Console.WriteLine(missing.Count == 0 ? "All categories present" : string.Join(", ", missing));
    }

    static void Main()
    {
        Show(new Dictionary<string, List<string>> {
            { "Functional", new List<string> { "Login" } }, { "User Attributes", new List<string> { "Admins" } },
            { "Product Features", new List<string> { "Export" } }, { "interface", new List<string> { "REST" } } });
        Show(new Dictionary<string, List<string>>());
    }
}
```

**Expected output**

```
Interface, Design Constraints
Functional, Interface, User Attributes, Product Features, Design Constraints
```

**Explanation**: Return the five categories in the fixed order whose exact names are not keys of the document.

Common mistake: Matching case-insensitively, so 'interface' wrongly counts as 'Interface'.

## C++

### Q2344 - Software Testing and Quality Assurance

*type CRITICAL_THINKING | difficulty AVERAGE*

Write a program that parses a test report file and summarizes the number of passed, failed, and skipped tests. The input file contains lines in the format: 'TestName: PASS', 'TestName: FAIL', or 'TestName: SKIP'. Your program should output a summary report showing the total number of tests, and counts for each status. Handle cases where the file is empty or contains unexpected formats.

Rules for this question: complete summarizeTestReport(lines), where each line looks like 'LoginTest: PASS'. Count only lines whose status (the text after the last ':', trimmed) is PASS, FAIL or SKIP; ignore every other line, including blank ones. Return "Total: <n>, PASS: <p>, FAIL: <f>, SKIP: <s>".

Language: C++. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string summarizeTestReport(const vector<string>& lines) {
    // Your code here
    return "";
}

int main() {
    cout << summarizeTestReport({"LoginTest: PASS", "SignupTest: FAIL", "ProfileTest: SKIP", "BrokenLine", "",
                                 "CheckoutTest: PASS", "Search: Edge: FAIL", "CartTest: PENDING"}) << endl;
    cout << summarizeTestReport({}) << endl;
    return 0;
}
```

**Expected output**

```
Total: 5, PASS: 2, FAIL: 2, SKIP: 1
Total: 0, PASS: 0, FAIL: 0, SKIP: 0
```

**Explanation**: For each line take the text after the last ':', trim it, and count only PASS, FAIL or SKIP; the total is the sum of those three.

Common mistake: Counting every line in the total, including the broken and PENDING ones.

### Q2534 - Data, Information, and Knowledge

*type CRITICAL_THINKING | difficulty AVERAGE*

You are tasked with developing a script that can process raw data collected from a temperature sensor. The input is a list of tuples, each containing a timestamp and a raw temperature value (e.g., [("2024-05-01T10:00:00", 23.4), ...]). The requirements are:
- Organize the data by day (group all readings from the same date)
- For each day, compute the average temperature
- Return a dictionary mapping each date to its average temperature
If the input is empty, return an empty dictionary.

Rules for this question: complete dailyAverageTemperatures(readings), where each reading is an ISO timestamp such as '2024-05-01T10:00:00' and a value. Return each date ('2024-05-01'), in order of first appearance, with its average value; main prints the averages to 2 decimal places.

Language: C++. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```cpp
#include <cstdio>
#include <string>
#include <utility>
#include <vector>
using namespace std;

vector<pair<string, double>> dailyAverageTemperatures(const vector<pair<string, double>>& readings) {
    // Your code here
    return {};
}

int main() {
    vector<pair<string, double>> readings = {
        {"2024-05-01T10:00:00", 20.0}, {"2024-05-01T14:00:00", 22.5}, {"2024-05-02T10:00:00", 18.0},
        {"2024-05-01T20:00:00", 19.0}, {"2024-05-02T15:00:00", 21.1}, {"2024-05-03T09:00:00", -1.5}};
    for (const auto& day : dailyAverageTemperatures(readings)) printf("%s %.2f\n", day.first.c_str(), day.second);
    printf("days without readings: %d\n", (int) dailyAverageTemperatures({}).size());
    return 0;
}
```

**Expected output**

```
2024-05-01 20.50
2024-05-02 19.55
2024-05-03 -1.50
days without readings: 0
```

**Explanation**: Group readings by the first 10 characters of the timestamp in order of first appearance and average each group.

Common mistake: Grouping by the whole timestamp, so every reading becomes its own day.

### Q2701 - Machine-to-Machine Communications

*type CRITICAL_THINKING | difficulty HARD*

A manufacturing plant uses an M2M system to monitor and control its equipment. Each device periodically sends its status to a central server via LTE or 5G. Write a program that processes a stream of device status reports, each formatted as: device_id,timestamp,status. The server must detect any device that fails to report for more than 15 minutes and output an alert for those devices. Input is a list of status reports (not in order), and the current timestamp. Output a list of device_ids that are overdue for reporting.

Rules for this question: complete overdueDevices(reports, now). Each report is 'device_id,timestamp,status' (timestamps in seconds, not in order) and now is the current timestamp. A device is overdue when now minus its latest report timestamp is more than 900 seconds (15 minutes). Return the overdue device ids sorted alphabetically; main prints them space-separated, or "none".

Language: C++. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```cpp
#include <iostream>
#include <map>
#include <string>
#include <vector>
using namespace std;

vector<string> overdueDevices(const vector<string>& reports, long long now) {
    // Your code here
    return {};
}

int main() {
    vector<string> overdue = overdueDevices({"A,1650000000,OK", "B,1650000600,OK", "A,1650001200,OK",
                                             "C,1650001200,FAIL", "D,1650001199,OK"}, 1650002100LL);
    if (overdue.empty()) cout << "none";
    for (size_t i = 0; i < overdue.size(); i++) cout << (i ? " " : "") << overdue[i];
    cout << endl;
    return 0;
}
```

**Expected output**

```
B D
```

**Explanation**: Keep the latest timestamp per device (reports are out of order), then report devices whose latest report is more than 900 seconds old, sorted.

Common mistake: Using >= 900, which wrongly flags C at exactly 900 seconds.

### Q2755 - Security Risk Analysis

*type CRITICAL_THINKING | difficulty AVERAGE*

Your organization maintains an asset inventory in a CSV file. Each row contains the asset name, asset type, and its criticality rating (High, Medium, Low). Write a program that reads this file and outputs a summary report listing the number of assets by type and the count of High criticality assets. The program should handle files with missing or malformed rows by skipping those rows and logging a warning. Input: path to the CSV file. Output: printed summary report as described.

Rules for this question: complete summarizeAssets(csv), where csv holds rows 'name,type,criticality' separated by newlines. A row counts only if it has exactly 3 fields and none is empty after trimming; other rows are skipped. Return one line '<type>: <count>' per asset type in alphabetical order, followed by 'High criticality: <count>'.

Language: C++. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```cpp
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

static string trim(const string& s) {
    size_t a = s.find_first_not_of(" \t");
    if (a == string::npos) return "";
    size_t b = s.find_last_not_of(" \t");
    return s.substr(a, b - a + 1);
}

string summarizeAssets(const string& csv) {
    // Your code here
    return "";
}

int main() {
    cout << summarizeAssets("Server,Hardware,High\nDatabase,Software,Medium\n,Hardware,Low\nRouter,Hardware,High\n"
                            "Laptop,Hardware\nCRM, Software ,High\nVPN,Network,Low,extra\nFirewall,Network,High")
         << endl;
    return 0;
}
```

**Expected output**

```
Hardware: 2
Network: 1
Software: 2
High criticality: 4
```

**Explanation**: Split each row on ',', trim the fields, skip rows without exactly three non-empty fields, then count by type in alphabetical order and count 'High' separately.

Common mistake: Not trimming, so ' Software ' becomes its own type.

### Q2757 - ISMS Monitoring and Improvement

*type CRITICAL_THINKING | difficulty AVERAGE*

A company wants to automate the monitoring of access logs for its information assets as part of its ISMS continuous improvement process. Write a program that reads a log file containing user access records in the format 'timestamp,user_id,resource,action' (e.g., '2024-05-10T08:32:00Z,alice,server01,login') and outputs a report listing all users who have attempted to access any resource outside of business hours (before 08:00 or after 18:00). The program should handle an empty log file and ignore malformed lines.

Rules for this question: complete afterHoursUsers(log). Each line is 'timestamp,user_id,resource,action' with a timestamp like '2024-05-10T08:32:00Z'. An access is outside business hours when its time is before 08:00 or after 18:00 (18:00:00 exactly is inside). Ignore lines that do not have 4 fields or a valid timestamp (YYYY-MM-DDTHH:MM:SSZ with real ranges). Return the users with at least one out-of-hours access, sorted alphabetically without duplicates.

Language: C++. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```cpp
#include <cctype>
#include <iostream>
#include <set>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

static bool digits(const string& s, size_t from, size_t count) {
    for (size_t i = from; i < from + count; i++) if (!isdigit((unsigned char) s[i])) return false;
    return true;
}

vector<string> afterHoursUsers(const string& log) {
    // Your code here
    return {};
}

int main() {
    string log = "2024-05-10T07:59:00Z,bob,server01,login\n2024-05-10T09:00:00Z,alice,server01,login\n"
                 "2024-05-10T18:30:00Z,charlie,db01,read\n2024-05-10T18:00:00Z,alice,db01,logout\n"
                 "not-a-time,mallory,db01,read\n2024-05-10T23:10:00Z,bob,vpn,login\n"
                 "2024-05-10T08:00:00Z,dave,server01,login\n2024-05-10T25:00:00Z,eve,db01,read\n"
                 "2024-05-10T18:00:01Z,frank,db01,read\nbroken line";
    vector<string> users = afterHoursUsers(log);
    for (size_t i = 0; i < users.size(); i++) cout << (i ? " " : "") << users[i];
    cout << endl;
    return 0;
}
```

**Expected output**

```
bob charlie frank
```

**Explanation**: Validate each line (4 fields, a real timestamp), convert the time to seconds and flag times before 08:00:00 or after 18:00:00; a set gives sorted unique users.

Common mistake: Comparing only the hour, which treats 18:00:01 as inside business hours.

### Q2759 - ISMS Implementation and Operation

*type CRITICAL_THINKING | difficulty AVERAGE*

As part of ISMS operation, an organization needs a tool to check whether all required security controls have been implemented according to a given checklist. Write a program that takes as input a list of required controls (one per line) and a list of implemented controls (one per line), and outputs the names of all required controls that are missing from the implementation. The lists may contain duplicates, and the program should handle them appropriately.

Rules for this question: complete missingControls(required, implemented), where both lists may contain duplicates. Return the required controls that are not implemented, without duplicates, in the order they first appear in required; main prints them space-separated, or "none".

Language: C++. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```cpp
#include <algorithm>
#include <iostream>
#include <set>
#include <string>
#include <vector>
using namespace std;

vector<string> missingControls(const vector<string>& required, const vector<string>& implemented) {
    // Your code here
    return {};
}

static void show(const vector<string>& controls) {
    if (controls.empty()) cout << "none";
    for (size_t i = 0; i < controls.size(); i++) cout << (i ? " " : "") << controls[i];
    cout << endl;
}

int main() {
    show(missingControls({"MFA", "Backups", "Encryption", "Backups", "Logging", "MFA"}, {"MFA", "Encryption", "Encryption"}));
    show(missingControls({"MFA"}, {"MFA"}));
    return 0;
}
```

**Expected output**

```
Backups Logging
none
```

**Explanation**: Put the implemented controls in a set, then walk the required list adding each missing control once, in first-appearance order.

Common mistake: Reporting Backups twice because it is required twice.

### Q2895 - Security Risk Analysis

*type CRITICAL_THINKING | difficulty AVERAGE*

Write a function to parse a plain-text asset inventory. Each line of the input string contains an asset name and a value (integer), separated by a colon. The function should return a dictionary mapping asset names to their values, and a list of asset names whose value is above 100,000. Example input: 'CustomerDB:120000\nHRRecords:90000\nWebServer:500000'

Rules for this question: complete parseInventory(text). Each line holds 'name:value'. Skip blank lines and lines without exactly one ':' or without an integer value. Return the assets in input order; main prints them as '<name>=<value>' and then the names whose value is above 100000.

Language: C++. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```cpp
#include <cctype>
#include <iostream>
#include <sstream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

vector<pair<string, long long>> parseInventory(const string& text) {
    // Your code here
    return {};
}

int main() {
    vector<pair<string, long long>> assets = parseInventory(
        "CustomerDB:120000\nHRRecords:90000\n\nWebServer:500000\nBackupNAS:100000\nBroken line\nLaptops:abc\nMail:server:5");
    string high;
    for (const auto& asset : assets) {
        cout << asset.first << "=" << asset.second << endl;
        if (asset.second > 100000) high += (high.empty() ? "" : " ") + asset.first;
    }
    cout << "High value: " << (high.empty() ? "none" : high) << endl;
    return 0;
}
```

**Expected output**

```
CustomerDB=120000
HRRecords=90000
WebServer=500000
BackupNAS=100000
High value: CustomerDB WebServer
```

**Explanation**: Skip lines without exactly one ':' or without an integer value; keep the rest in order, then list the names whose value is above 100000.

Common mistake: Treating 100000 as above 100000.

### Q3184 - Requirements Documentation

*type CRITICAL_THINKING | difficulty AVERAGE*

Implement a function  that takes as input a requirements document (as a dictionary with lists for each category) and returns a flat list of all unique requirements, regardless of their category. Provide at least three test cases: one with overlapping requirements across categories, one with no overlap, and one with empty categories.

Rules for this question: complete uniqueRequirements(document), where document is a list of (category, requirements) pairs. Return every requirement once, in the order it first appears going through the categories in order.

Language: C++. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

typedef vector<pair<string, vector<string>>> Document;

vector<string> uniqueRequirements(const Document& document) {
    // Your code here
    return {};
}

static void show(const vector<string>& items) {
    cout << "[";
    for (size_t i = 0; i < items.size(); i++) cout << (i ? ", " : "") << items[i];
    cout << "]" << endl;
}

int main() {
    show(uniqueRequirements({{"Functional", {"A", "B"}}, {"Product Features", {"B", "C"}}}));
    show(uniqueRequirements({{"Interface", {"Z", "A"}}, {"Functional", {"A", "Y", "Z"}}, {"Design", {}}}));
    show(uniqueRequirements({{"Functional", {}}, {"Product Features", {}}}));
    return 0;
}
```

**Expected output**

```
[A, B, C]
[Z, A, Y]
[]
```

**Explanation**: Walk the categories in order and append each requirement the first time it is seen.

Common mistake: Collecting into a set and printing it, which loses the first-appearance order.

### Q3185 - Technical Document Types and Processes

*type CRITICAL_THINKING | difficulty HARD*

Create a function that takes a list of technical document types and a project phase (e.g., 'Design', 'Deployment') and returns which types are typically required for that phase, based on the spectrum of technical documents described in the lesson. Provide a mapping for at least three phases. Include a test case for each phase, including an unrecognized phase.

Rules for this question: complete requiredDocuments(documentTypes, phase) using this mapping: 'Requirements' -> Requirements Documents; 'Design' -> Design and Specification Documents; 'Development' -> Design and Specification Documents, Reference Documentation; 'Deployment' -> Process and Procedure Documents, User-Facing Documentation. Return the document types from the input that belong to the phase, in input order; an unknown phase gives an empty list.

Language: C++. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```cpp
#include <iostream>
#include <map>
#include <string>
#include <vector>
using namespace std;

vector<string> requiredDocuments(const vector<string>& documentTypes, const string& phase) {
    // Your code here
    return {};
}

int main() {
    vector<string> docs = {"Requirements Documents", "Design and Specification Documents", "User-Facing Documentation",
                           "Reference Documentation", "Process and Procedure Documents"};
    for (const string& phase : {"Design", "Development", "Deployment", "Requirements", "Testing"}) {
        vector<string> found = requiredDocuments(docs, phase);
        cout << phase << ": ";
        if (found.empty()) cout << "none";
        for (size_t i = 0; i < found.size(); i++) cout << (i ? "; " : "") << found[i];
        cout << endl;
    }
    return 0;
}
```

**Expected output**

```
Design: Design and Specification Documents
Development: Design and Specification Documents; Reference Documentation
Deployment: User-Facing Documentation; Process and Procedure Documents
Requirements: Requirements Documents
Testing: none
```

**Explanation**: Look up the phase's document types and keep the input documents that are among them, in input order; an unknown phase has none.

Common mistake: Returning the phase's list instead of filtering the input.

## JAVA

### Q2241 - Software Design Fundamentals

*type CRITICAL_THINKING | difficulty AVERAGE*

Design a simple class that represents a BankAccount. The class should encapsulate the balance as a private attribute and provide public methods for deposit and withdraw. The withdraw method should only allow withdrawals if the balance is sufficient. Briefly explain how this design demonstrates encapsulation.

Rules for this question: complete class BankAccount, which keeps its balance in a private field. deposit(amount) adds a positive amount and returns the new balance (a zero or negative amount changes nothing). withdraw(amount) subtracts the amount and returns true when the balance covers it; otherwise it leaves the balance unchanged and returns false. getBalance() returns the balance.

Language: Java. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```java
public class Main {
    static class BankAccount {
        private int balance;

        BankAccount(int initialBalance) {
            // Your code here
        }

        int deposit(int amount) {
            // Your code here
            return 0;
        }

        boolean withdraw(int amount) {
            // Your code here
            return false;
        }

        int getBalance() {
            // Your code here
            return 0;
        }
    }

    public static void main(String[] args) {
        BankAccount account = new BankAccount(100);
        System.out.println(account.deposit(50));
        System.out.println(account.deposit(-20));
        System.out.println(account.withdraw(120));
        System.out.println(account.withdraw(100));
        System.out.println(account.getBalance());
    }
}
```

**Expected output**

```
150
150
true
false
30
```

**Explanation**: Keep the balance private; deposit adds only positive amounts and returns the balance, withdraw subtracts only when the balance covers the amount and reports whether it did.

Common mistake: Letting withdraw take the balance negative, or depositing a negative amount.

### Q2291 - Requirements Management and Change Control

*type CRITICAL_THINKING | difficulty HARD*

You are working on a requirements management tool for a medium-sized software development project. The tool must track changes to requirements and maintain a history of all modifications. Implement a class called `Requirement` that supports the following operations:

- Creating a requirement with a unique ID and initial description
- Updating the requirement description (each update should store a versioned history)
- Retrieving the current description
- Retrieving the full modification history as a list of (version_number, description) tuples

Write the `Requirement` class. Your implementation should ensure that version numbers increment with each update and that the history is preserved correctly.

Rules for this question: complete class Requirement(id, description). The initial description is version 1; updateDescription(text) records the next version; getCurrentDescription() returns the latest description; getHistory() returns the versions oldest first, each as "v<number>: <description>".

Language: Java. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    static class Requirement {
        private final String id;
        private final List<String> history = new ArrayList<>();

        Requirement(String id, String description) {
            this.id = id;
            // Your code here
        }

        void updateDescription(String text) {
            // Your code here
        }

        String getCurrentDescription() {
            // Your code here
            return "";
        }

        List<String> getHistory() {
            // Your code here
            return new ArrayList<>();
        }
    }

    public static void main(String[] args) {
        Requirement r = new Requirement("R-1", "Initial desc");
        r.updateDescription("Second version");
        r.updateDescription("Third version");
        System.out.println(r.getCurrentDescription());
        for (String version : r.getHistory()) {
            System.out.println(version);
        }
    }
}
```

**Expected output**

```
Third version
v1: Initial desc
v2: Second version
v3: Third version
```

**Explanation**: Store each description in order; the version of a description is its position plus one, the current description is the last one, and the history lists them all as 'v<n>: <text>'.

Common mistake: Overwriting the description instead of appending, which loses the history.

### Q2462 - Conceptual Database Design

*type CRITICAL_THINKING | difficulty HARD*

A logistics company wants to store data about its warehouses, shipments, and drivers. Each warehouse can store multiple shipments, and each driver may deliver shipments from more than one warehouse over time. Write a function that takes as input a list of warehouse, shipment, and driver records (as dictionaries), and returns a data structure that groups shipments by the warehouse and associates each shipment with its assigned driver(s). Ensure your function can handle cases where a shipment has multiple drivers or a warehouse has no shipments.

Rules for this question: complete groupShipments(warehouses, shipments, drivers). Return a map from every warehouse id, in the order the warehouses are given, to the list of its shipments in input order; each listed shipment is written as "<shipmentId> [<driver names>]" with the names of the drivers whose ids are in its driverIds, in that order, joined by ", ". A warehouse with no shipments maps to an empty list. main prints one line per warehouse.

Language: Java. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```java
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Main {
    static class Warehouse {
        final int id; final String name;
        Warehouse(int id, String name) { this.id = id; this.name = name; }
    }

    static class Shipment {
        final int id; final int warehouseId; final int[] driverIds;
        Shipment(int id, int warehouseId, int... driverIds) {
            this.id = id; this.warehouseId = warehouseId; this.driverIds = driverIds;
        }
    }

    static class Driver {
        final int id; final String name;
        Driver(int id, String name) { this.id = id; this.name = name; }
    }

    static Map<Integer, List<String>> groupShipments(List<Warehouse> warehouses, List<Shipment> shipments,
                                                     List<Driver> drivers) {
        // Your code here
        return new LinkedHashMap<>();
    }

    public static void main(String[] args) {
        List<Warehouse> warehouses = List.of(new Warehouse(1, "North"), new Warehouse(2, "South"),
                new Warehouse(3, "East"));
        List<Shipment> shipments = List.of(new Shipment(101, 1, 201), new Shipment(102, 1, 201, 202),
                new Shipment(103, 2), new Shipment(104, 9, 202));
        List<Driver> drivers = List.of(new Driver(201, "Alice"), new Driver(202, "Bob"));
        for (Map.Entry<Integer, List<String>> e : groupShipments(warehouses, shipments, drivers).entrySet()) {
            System.out.println("Warehouse " + e.getKey() + ": " + String.join(", ", e.getValue()));
        }
    }
}
```

**Expected output**

```
Warehouse 1: 101 [Alice], 102 [Alice, Bob]
Warehouse 2: 103 []
Warehouse 3:
```

**Explanation**: Start every warehouse with an empty list in the given order, then add each shipment to its warehouse with the names of its drivers; a shipment for an unknown warehouse is dropped.

Common mistake: Building the map from the shipments, so a warehouse with no shipments disappears.

### Q2466 - Network Service Architecture

*type CRITICAL_THINKING | difficulty AVERAGE*

A network operator needs to implement a simple session management system for a messaging service that operates over both wired and wireless networks. The system must support establishing a session, authenticating a user, and terminating the session. Write a class `SessionManager` with methods to establish a session (given a user ID), authenticate a session (given a user ID and password), and terminate a session. The system should maintain session state for multiple users and ensure that users can only have one active session at a time. If a user tries to establish a second session, the previous one must be terminated automatically. Provide your implementation.

Rules for this question: complete class SessionManager(passwords), where passwords maps user IDs to passwords. establishSession(userId) returns "Session established for <userId>.", or "Previous session terminated. Session established for <userId>." if that user already had an active session. authenticate(userId, password) returns "Authentication successful." when the user has an active session and the password matches, otherwise "Authentication failed.". terminateSession(userId) returns "Session terminated for <userId>." or "No active session for <userId>.".

Language: Java. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```java
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class Main {
    static class SessionManager {
        private final Map<String, String> passwords;
        private final Set<String> active = new HashSet<>();

        SessionManager(Map<String, String> passwords) {
            this.passwords = passwords;
        }

        String establishSession(String userId) {
            // Your code here
            return "";
        }

        String authenticate(String userId, String password) {
            // Your code here
            return "";
        }

        String terminateSession(String userId) {
            // Your code here
            return "";
        }
    }

    public static void main(String[] args) {
        Map<String, String> passwords = new HashMap<>();
        passwords.put("alice", "password123");
        passwords.put("bob", "hunter22");
        SessionManager sm = new SessionManager(passwords);
        System.out.println(sm.establishSession("alice"));
        System.out.println(sm.establishSession("alice"));
        System.out.println(sm.authenticate("alice", "wrong"));
        System.out.println(sm.authenticate("bob", "hunter22"));
        System.out.println(sm.authenticate("alice", "password123"));
        System.out.println(sm.terminateSession("alice"));
        System.out.println(sm.terminateSession("alice"));
    }
}
```

**Expected output**

```
Session established for alice.
Previous session terminated. Session established for alice.
Authentication failed.
Authentication failed.
Authentication successful.
Session terminated for alice.
No active session for alice.
```

**Explanation**: Keep the set of users with an active session: establishing twice replaces the session (with the 'Previous session terminated.' prefix), authentication needs an active session and the right password, and terminating removes it.

Common mistake: Authenticating a user who has the right password but no active session.

### Q2492 - Requirements Specification

*type CRITICAL_THINKING | difficulty HARD*

A financial services company needs a system to process customer transactions. Requirements specify that each transaction must be validated for completeness, checked for duplicate transaction IDs, and assigned a status of 'approved' or 'rejected' based on validation results. Write a function that takes a list of transaction records (each with an 'id', 'amount', and 'customer_id') and returns a new list where each record contains a 'status' field. Transactions with missing fields or duplicate IDs must be rejected. Provide clear comments and handle edge cases, such as empty input and duplicate IDs appearing non-consecutively.

Rules for this question: complete validateTransactions(transactions). Each transaction should have an id, an amount and a customerId (null means missing). Return one status per transaction, in order: "rejected" if any of the three is missing or its id was already used by an earlier transaction in the list (approved or not), otherwise "approved". main prints "<id>: <status>".

Language: Java. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```java
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class Main {
    static class Transaction {
        final Integer id; final Double amount; final String customerId;
        Transaction(Integer id, Double amount, String customerId) {
            this.id = id; this.amount = amount; this.customerId = customerId;
        }
    }

    static List<String> validateTransactions(List<Transaction> transactions) {
        // Your code here
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        List<Transaction> transactions = List.of(
                new Transaction(1, 50.0, "C1"), new Transaction(2, null, "C2"), new Transaction(2, 30.0, "C2"),
                new Transaction(1, 20.0, "C3"), new Transaction(3, 10.0, null), new Transaction(4, 75.0, "C4"),
                new Transaction(null, 5.0, "C5"));
        List<String> statuses = validateTransactions(transactions);
        for (int i = 0; i < transactions.size(); i++) {
            System.out.println(transactions.get(i).id + ": " + statuses.get(i));
        }
    }
}
```

**Expected output**

```
1: approved
2: rejected
2: rejected
1: rejected
3: rejected
4: approved
null: rejected
```

**Explanation**: One pass with a set of ids seen so far: a transaction is rejected when a field is missing or its id was already used, and every id that exists joins the set whether approved or not.

Common mistake: Adding only approved ids to the set, so the second id 2 is wrongly approved.

### Q2517 - Requirements Management and Change Control

*type CRITICAL_THINKING | difficulty HARD*

You are tasked with implementing a requirements traceability matrix generator. Given a list of requirements (each with a unique 'id' and 'description') and a list of features (each with a unique 'feature_id' and 'requirement_ids' it implements), write a function that outputs a dictionary mapping each requirement ID to a list of feature IDs that implement it. Ensure that requirements with no implementing features are included with an empty list. Handle edge cases such as empty input and requirements that are implemented by multiple features.

Rules for this question: complete buildTraceabilityMatrix(requirements, features). Return a map from every requirement id, in the order given, to the list of feature ids (in feature order, without repeats) whose requirementIds include it. Requirement ids that appear only in features are ignored. main prints one line per requirement.

Language: Java. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```java
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Main {
    static class Feature {
        final String featureId; final List<String> requirementIds;
        Feature(String featureId, String... requirementIds) {
            this.featureId = featureId; this.requirementIds = List.of(requirementIds);
        }
    }

    static Map<String, List<String>> buildTraceabilityMatrix(List<String> requirements, List<Feature> features) {
        // Your code here
        return new LinkedHashMap<>();
    }

    public static void main(String[] args) {
        List<String> requirements = List.of("REQ-1", "REQ-2", "REQ-3");
        List<Feature> features = List.of(new Feature("F1", "REQ-1"), new Feature("F2", "REQ-2", "REQ-1"),
                new Feature("F3", "REQ-9"), new Feature("F4", "REQ-1", "REQ-1"));
        for (Map.Entry<String, List<String>> e : buildTraceabilityMatrix(requirements, features).entrySet()) {
            System.out.println(e.getKey() + ": " + (e.getValue().isEmpty() ? "-" : String.join(", ", e.getValue())));
        }
    }
}
```

**Expected output**

```
REQ-1: F1, F2, F4
REQ-2: F2
REQ-3: -
```

**Explanation**: Start every requirement with an empty list, then go through the features in order adding each feature id to the requirements it covers, once; ids not in the requirement list are ignored.

Common mistake: Listing F4 twice for REQ-1 because the feature names it twice.

### Q2521 - Requirements Management and Change Control

*type CRITICAL_THINKING | difficulty HARD*

Develop a function that simulates change control for requirements. The function receives a list of requirements, a list of change requests (each specifying a requirement ID and change type: 'add', 'modify', or 'remove'), and returns the updated requirements list. Ensure changes are applied in order and handle invalid operations (e.g., removing a non-existent requirement). Include comments and handle edge cases, such as conflicting change requests.

Rules for this question: complete applyChangeRequests(requirements, changes). Apply the changes in order to a copy of the list: "add" appends a requirement with that id and text unless the id already exists; "modify" sets the text of an existing requirement; "remove" deletes an existing requirement. A modify or remove for an id that does not exist, or an add for an id that does, is ignored. Return the updated list; main prints "<id>: <text>" per requirement.

Language: Java. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    static class Requirement {
        final String id; String text;
        Requirement(String id, String text) { this.id = id; this.text = text; }
    }

    static class Change {
        final String requirementId; final String type; final String newText;
        Change(String requirementId, String type, String newText) {
            this.requirementId = requirementId; this.type = type; this.newText = newText;
        }
    }

    static List<Requirement> applyChangeRequests(List<Requirement> requirements, List<Change> changes) {
        // Your code here
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        List<Requirement> requirements = List.of(new Requirement("R1", "User login required"),
                new Requirement("R3", "Nightly backup"));
        List<Change> changes = List.of(new Change("R2", "add", "Audit logging required"),
                new Change("R1", "remove", null),
                new Change("R2", "modify", "Audit logging for all admin actions"),
                new Change("R9", "remove", null),
                new Change("R3", "add", "Duplicate id"));
        for (Requirement r : applyChangeRequests(requirements, changes)) {
            System.out.println(r.id + ": " + r.text);
        }
        System.out.println("Original still has " + requirements.size() + " requirements, first: "
                + requirements.get(0).text);
    }
}
```

**Expected output**

```
R3: Nightly backup
R2: Audit logging for all admin actions
Original still has 2 requirements, first: User login required
```

**Explanation**: Copy the list first, then apply each change in order -- add only new ids, modify and remove only existing ones -- so the caller's original list is untouched.

Common mistake: Modifying the original requirements instead of a copy.

### Q2784 - IT Business Operations

*type CRITICAL_THINKING | difficulty HARD*

Write a program to help IT resource managers allocate a fixed IT budget across multiple departments based on their requested funding and strategic priority scores (1-10, with 10 being most critical to business goals). The allocation should prioritize higher-priority departments while ensuring no department receives more than its requested funding. Input: a list of departments with 'name', 'requested', and 'priority'. Output: the allocated amount per department. Edge cases: total requested less than budget, some departments have the same priority, budget insufficient for all requests.

Rules for this question: complete allocateBudget(departments, budget). Go through the departments from highest to lowest priority (equal priorities keep their input order) and give each min(requested, remaining budget). Return the allocations in that order; main prints "<name>: <amount>" (a department may get 0).

Language: Java. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```java
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Main {
    static class Department {
        final String name; final int requested; final int priority;
        Department(String name, int requested, int priority) {
            this.name = name; this.requested = requested; this.priority = priority;
        }
    }

    static Map<String, Integer> allocateBudget(List<Department> departments, int budget) {
        // Your code here
        return new LinkedHashMap<>();
    }

    public static void main(String[] args) {
        List<Department> departments = List.of(new Department("HR", 5000, 8), new Department("IT", 10000, 10),
                new Department("Legal", 3000, 8), new Department("Ops", 4000, 2));
        for (Map.Entry<String, Integer> e : allocateBudget(departments, 16000).entrySet()) {
            System.out.println(e.getKey() + ": " + e.getValue());
        }
    }
}
```

**Expected output**

```
IT: 10000
HR: 5000
Legal: 1000
Ops: 0
```

**Explanation**: Sort the departments by priority, highest first, keeping input order for ties, then give each the smaller of its request and what is left.

Common mistake: Allocating in input order, so IT's higher priority is ignored.

### Q2856 - Internet of Things Standards

*type CRITICAL_THINKING | difficulty HARD*

Implement a function that simulates a simplified oneM2M service layer for IoT devices. The function should register devices, allow devices to send messages to each other, and keep a log of all messages exchanged. Devices are identified by unique IDs. The service must ensure that only registered devices can send or receive messages. Input: a sequence of registration and messaging events; Output: the message log.

Rules for this question: complete class M2MService with register(deviceId); send(sender, receiver, message), which returns "Error: Sender not registered" or "Error: Receiver not registered" (checking the sender first) or, when both are registered, records the message and returns "Delivered"; and getLog(), which returns the delivered messages in order, each as "<sender> -> <receiver>: <message>".

Language: Java. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```java
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class Main {
    static class M2MService {
        private final Set<String> devices = new HashSet<>();
        private final List<String> log = new ArrayList<>();

        void register(String deviceId) {
            // Your code here
        }

        String send(String sender, String receiver, String message) {
            // Your code here
            return "";
        }

        List<String> getLog() {
            // Your code here
            return new ArrayList<>();
        }
    }

    public static void main(String[] args) {
        M2MService svc = new M2MService();
        svc.register("A");
        svc.register("B");
        System.out.println(svc.send("A", "B", "temp=22"));
        System.out.println(svc.send("C", "B", "temp=23"));
        System.out.println(svc.send("A", "D", "temp=24"));
        System.out.println(svc.send("C", "D", "temp=25"));
        System.out.println(svc.send("B", "A", "ack"));
        for (String entry : svc.getLog()) {
            System.out.println(entry);
        }
    }
}
```

**Expected output**

```
Delivered
Error: Sender not registered
Error: Receiver not registered
Error: Sender not registered
Delivered
A -> B: temp=22
B -> A: ack
```

**Explanation**: Keep a set of registered devices and a log; send checks the sender first, then the receiver, and only logs and delivers when both are registered.

Common mistake: Checking the receiver first, which gives the wrong error when both are unregistered.

### Q3131 - System Requirements Management

*type CRITICAL_THINKING | difficulty AVERAGE*

You are developing a requirements management tool for an IT project. Implement a function that takes as input a list of stakeholder requirements, each as a dictionary with 'requirement', 'type' (either 'functional' or 'non-functional'), and 'priority' (integer), and returns two lists: one with all functional requirements sorted by priority descending, and one with all non-functional requirements sorted by priority descending. Raise an error if any requirement does not include all three fields.

Rules for this question: complete splitRequirements(requirements). Each requirement has a text, a type ("functional" or "non-functional") and a priority (null means missing). If any requirement is missing a field, return null. Otherwise return two lists -- functional, then non-functional -- each sorted by priority from highest to lowest (equal priorities keep their input order). main prints the result.

Language: Java. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Main {
    static class Requirement {
        final String text; final String type; final Integer priority;
        Requirement(String text, String type, Integer priority) {
            this.text = text; this.type = type; this.priority = priority;
        }
    }

    static List<List<Requirement>> splitRequirements(List<Requirement> requirements) {
        // Your code here
        return null;
    }

    static void show(List<Requirement> requirements) {
        List<List<Requirement>> split = splitRequirements(requirements);
        if (split == null) {
            System.out.println("Error: Missing required field(s)");
            return;
        }
        String[] titles = {"Functional", "Non-functional"};
        for (int i = 0; i < 2; i++) {
            System.out.println(titles[i] + ":");
            for (Requirement r : split.get(i)) {
                System.out.println("  " + r.priority + " " + r.text);
            }
        }
    }

    public static void main(String[] args) {
        show(List.of(new Requirement("Support for mobile devices", "functional", 1),
                new Requirement("System must respond within 2 seconds", "non-functional", 2),
                new Requirement("System must authenticate users", "functional", 3),
                new Requirement("Encrypt data at rest", "non-functional", 5),
                new Requirement("Export reports", "functional", 3)));
        show(List.of(new Requirement("Export reports", "functional", null)));
    }
}
```

**Expected output**

```
Functional:
  3 System must authenticate users
  3 Export reports
  1 Support for mobile devices
Non-functional:
  5 Encrypt data at rest
  2 System must respond within 2 seconds
Error: Missing required field(s)
```

**Explanation**: Reject the whole input if any requirement lacks a field; otherwise split by type and sort each list by priority, highest first, with a stable sort so ties keep input order.

Common mistake: Sorting ascending, or with an unstable order for equal priorities.

## JAVASCRIPT

### Q2264 - Software Implementation Practices

*type CRITICAL_THINKING | difficulty HARD*

Your team has adopted a coding standard that requires all variable names to use camelCase and prohibits single-letter variable names except for loop counters. Write a function that takes an object with potentially non-standard property names and returns a new object with all properties renamed to camelCase, skipping any property with a single-letter name except for 'i' or 'j'.

Rules for this question: complete toCamelCaseKeys(data), where data is an object. Convert each key to camelCase: split the key on '_', lowercase the first part and capitalise the first letter of every later part; a key with no '_' just has its first letter lowercased. Leave out any key that is a single letter, except 'i' and 'j'. Return a new object with the keys in their original order; main prints "<key>=<value>" pairs.

Language: JavaScript. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```javascript
function toCamelCaseKeys(data) {
  // Your code here
  return {};
}

function show(obj) {
  console.log(Object.keys(obj).map((k) => k + '=' + obj[k]).join(' '));
}

show(toCamelCaseKeys({ first_name: 'John', LastName: 'Doe', x: 5, i: 1, j: 2 }));
show(toCamelCaseKeys({ ORDER_total_amount: 99.5, Q: 'skip', shipping_address_line_1: 'Main St', id: 7 }));
```

**Expected output**

```
firstName=John lastName=Doe i=1 j=2
orderTotalAmount=99.5 shippingAddressLine1=Main St id=7
```

**Explanation**: Split each key on '_', lowercase the first part, capitalise the rest and join; skip one-letter keys except i and j, keeping the original order.

Common mistake: Lowercasing every part, which turns first_name into firstname.

### Q2316 - Software Design Fundamentals

*type CRITICAL_THINKING | difficulty AVERAGE*

You are building a payment processing system. Write a function that abstracts away the internal steps of payment handling, exposing only a simple interface for the caller. The function should be called 'process_payment' and receive two parameters: amount and card_details. Internally, your function should (a) validate the card, (b) simulate communication with a bank, (c) log the transaction, and (d) handle possible errors. The internal steps should not be visible to the caller. Return 'Success' if all steps pass, otherwise return an appropriate error message.

Rules for this question: complete processPayment(amount, card). amount must be a number greater than 0, otherwise return "Error: Invalid amount". card must have non-empty number, expiry and cvv; if any is missing or empty, return "Error: Invalid card details". Otherwise return "Success". Keep the validation, bank call and logging steps as private helper functions so callers only see processPayment.

Language: JavaScript. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```javascript
function processPayment(amount, card) {
  // Your code here
  return '';
}

const card = { number: '4111111111111111', expiry: '12/30', cvv: '123' };
console.log(processPayment(100, card));
console.log(processPayment(0, card));
console.log(processPayment(-5, card));
console.log(processPayment('40', card));
console.log(processPayment(40, { number: '4111111111111111', expiry: '', cvv: '123' }));
console.log(processPayment(40, { number: '4111111111111111', cvv: '123' }));
```

**Expected output**

```
Success
Error: Invalid amount
Error: Invalid amount
Error: Invalid amount
Error: Invalid card details
Error: Invalid card details
```

**Explanation**: Validate the amount first (a number above 0), then each card field; only when both pass is the result 'Success'.

Common mistake: Accepting the string '40' as an amount.

### Q2318 - Software Design Fundamentals

*type CRITICAL_THINKING | difficulty AVERAGE*

A company needs to transform a list of business requirements into a set of software design specifications. Write a function that takes a list of requirement strings and outputs a dictionary mapping each requirement to a design component (e.g., 'User authentication' -> 'AuthModule'). Each requirement should be assigned to a component based on keywords. For example, requirements containing 'payment' go to 'PaymentModule', 'user' to 'UserModule', and so on. Return the mapping.

Rules for this question: complete mapRequirementsToComponents(requirements), returning an object from each requirement to its component. Match keywords case-insensitively, checking in this order (the first match wins): 'auth' or 'login' -> 'AuthModule'; 'payment' -> 'PaymentModule'; 'report' -> 'ReportModule'; 'user' -> 'UserModule'; anything else -> 'GeneralModule'. main prints "<requirement> -> <component>".

Language: JavaScript. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```javascript
function mapRequirementsToComponents(requirements) {
  // Your code here
  return {};
}

const mapping = mapRequirementsToComponents(['User authentication', 'Process payment', 'Generate report',
  'Admin login page', 'User profile page', 'Backup database', 'Payment report export']);
for (const requirement of Object.keys(mapping)) console.log(requirement + ' -> ' + mapping[requirement]);
```

**Expected output**

```
User authentication -> AuthModule
Process payment -> PaymentModule
Generate report -> ReportModule
Admin login page -> AuthModule
User profile page -> UserModule
Backup database -> GeneralModule
Payment report export -> PaymentModule
```

**Explanation**: Check the keyword groups in the given order and stop at the first match, so 'Payment report export' is a PaymentModule, not a ReportModule.

Common mistake: Checking 'user' before 'auth', so 'User authentication' becomes UserModule.

### Q2536 - Conceptual Database Design

*type CRITICAL_THINKING | difficulty HARD*

Write a function that, given a requirements specification in the form of a dictionary with keys 'entities', 'operations', and 'constraints', generates a textual summary suitable for use in a conceptual design workshop. The summary should list each entity, the operations associated with it, and any constraints. If a section is missing, it should note it as 'not specified'.

Rules for this question: complete summarizeSpec(spec) and return a string of three lines: "Entities: ...", "Operations: ..." and "Constraints: ...", each listing that key's items joined by ', ', or "not specified" when the key is missing or its array is empty.

Language: JavaScript. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```javascript
function summarizeSpec(spec) {
  // Your code here
  return '';
}

console.log(summarizeSpec({ entities: ['Customer', 'Order'], operations: ['create', 'delete'],
  constraints: ['Order ID unique'] }));
console.log(summarizeSpec({ entities: ['User'], operations: [] }));
```

**Expected output**

```
Entities: Customer, Order
Operations: create, delete
Constraints: Order ID unique
Entities: User
Operations: not specified
Constraints: not specified
```

**Explanation**: For each of the three keys, join its items with ', ' or write 'not specified' when it is missing or empty.

Common mistake: Printing an empty string for an empty list instead of 'not specified'.

### Q2557 - Data, Information, and Knowledge

*type CRITICAL_THINKING | difficulty AVERAGE*

Write a function that, given a list of data points representing sensor readings (each as a dictionary with 'timestamp' and 'value'), filters out any readings where 'value' is None or not a number. Return a cleaned list of valid readings, preserving their original order. If all readings are invalid, return an empty list.

Rules for this question: complete cleanReadings(readings). Keep, in their original order, only the readings whose value is a finite number (not null, not a string, not a boolean, not NaN). Return the new array; main prints "<timestamp>=<value>" pairs.

Language: JavaScript. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```javascript
function cleanReadings(readings) {
  // Your code here
  return [];
}

function show(readings) {
  console.log(readings.length ? readings.map((r) => r.timestamp + '=' + r.value).join(' ') : '(none)');
}

show(cleanReadings([
  { timestamp: 1, value: 20.5 }, { timestamp: 2, value: null }, { timestamp: 3, value: '21' },
  { timestamp: 4, value: 19 }, { timestamp: 5, value: true }, { timestamp: 6, value: 0 },
  { timestamp: 7, value: NaN }, { timestamp: 8 },
]));
show(cleanReadings([{ timestamp: 1, value: null }]));
```

**Expected output**

```
1=20.5 4=19 6=0
(none)
```

**Explanation**: Keep readings whose value is a finite number: typeof 'number' and not NaN; null, strings, booleans and missing values are dropped.

Common mistake: Keeping NaN, which is typeof 'number' too.

### Q2891 - Information Security Principles

*type CRITICAL_THINKING | difficulty AVERAGE*

Your company operates a customer portal where users can upload sensitive documents. As part of a security audit, you are tasked with writing a function that checks uploaded files for two risks: (1) the file extension must be one of a permitted set (pdf, docx, xlsx), and (2) the file name must not contain any directory traversal patterns (such as '../'). Write a function that receives a list of file names and returns a list of the files that are safe to accept. If a file fails either check, it should not be included in the returned list.

Rules for this question: complete safeUploads(fileNames). A file is safe when its extension (the text after the last '.', compared in lowercase) is pdf, docx or xlsx and its name does not contain '../'. Return the safe names in input order.

Language: JavaScript. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```javascript
function safeUploads(fileNames) {
  // Your code here
  return [];
}

const safe = safeUploads(['report.pdf', '../secrets.docx', 'invoice.xlsx', 'data.csv', 'notes../.pdf',
  'SCAN.PDF', 'archive.tar.docx', 'nodot', 'budget.xlsx.exe']);
console.log(safe.length + ' safe');
for (const name of safe) console.log(name);
```

**Expected output**

```
4 safe
report.pdf
invoice.xlsx
SCAN.PDF
archive.tar.docx
```

**Explanation**: Take the text after the last '.', lowercased, and accept pdf, docx or xlsx unless the name contains '../'.

Common mistake: Using the first '.', so 'archive.tar.docx' and 'budget.xlsx.exe' are judged by the wrong extension.

### Q3068 - Requirements Documentation

*type CRITICAL_THINKING | difficulty AVERAGE*

Write a script that parses a plain text requirements document and extracts all lines that define functional requirements. Assume that functional requirements are always prefixed with 'FR:' at the start of the line. The script should return a list of all functional requirement statements, without the 'FR:' prefix.

Rules for this question: complete extractFunctionalRequirements(text). Return, in order, every line that starts with 'FR:' (at the very start of the line), with that prefix removed and surrounding spaces trimmed.

Language: JavaScript. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```javascript
function extractFunctionalRequirements(text) {
  // Your code here
  return [];
}

const found = extractFunctionalRequirements('FR: The system shall allow user login.\nThe system shall log all activity.\n'
  + 'FR:   The system shall support password reset.  \n  FR: indented, not counted\nNFR: Pages load in 2 seconds.\n');
console.log(found.length + ' functional requirement(s)');
for (const fr of found) console.log('- ' + fr);
```

**Expected output**

```
2 functional requirement(s)
- The system shall allow user login.
- The system shall support password reset.
```

**Explanation**: Keep only lines that begin with 'FR:' at the very start, then remove the prefix and trim.

Common mistake: Trimming the line before checking, which wrongly includes the indented line.

### Q3093 - Request for Information (RFI)

*type CRITICAL_THINKING | difficulty AVERAGE*

You are part of the IT procurement team for a large organization. Your task is to automate the process of extracting key vendor information from RFI responses submitted as structured JSON files. Each response contains fields for 'vendor_name', 'technical_capabilities', 'company_background', and 'support_offerings'. Write a function that takes a list of these JSON objects and returns a summary report listing each vendor and the length (number of words) of their 'technical_capabilities' section. The function should handle cases where 'technical_capabilities' is missing or empty by reporting a word count of zero for that vendor.

Rules for this question: complete technicalWordCounts(responses). Return one "<vendorName>: <count>" line per response, in input order, where count is the number of whitespace-separated words in technicalCapabilities (0 when it is missing or empty).

Language: JavaScript. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```javascript
function technicalWordCounts(responses) {
  // Your code here
  return [];
}

const lines = technicalWordCounts([
  { vendorName: 'AlphaTech', technicalCapabilities: 'Cloud hosting, 24/7 support.' },
  { vendorName: 'BetaSys', companyBackground: 'Established 2015.' },
  { vendorName: 'GammaIT', technicalCapabilities: '' },
  { vendorName: 'DeltaSoft', technicalCapabilities: '  ERP   integration  and data migration ' },
]);
for (const line of lines) console.log(line);
```

**Expected output**

```
AlphaTech: 4
BetaSys: 0
GammaIT: 0
DeltaSoft: 5
```

**Explanation**: Count the words of technicalCapabilities by splitting on runs of whitespace after trimming; a missing or empty field counts 0.

Common mistake: Splitting on single spaces, so repeated spaces add empty words.

### Q3095 - Request for Information (RFI)

*type CRITICAL_THINKING | difficulty AVERAGE*

Write a script that generates a template for an RFI (Request for Information) document for an IT project. The template should include the following sections: Introduction, Company Background, Technical Capabilities, Implementation Experience, and Support Offerings. The script should allow the user to specify the project name and automatically insert it into the Introduction section. Output the resulting template as a formatted string.

Rules for this question: complete rfiTemplate(projectName) and return this text exactly (lines separated by '\n'): "Request for Information (RFI): <projectName>", an empty line, "Introduction", "This RFI is issued for the <projectName> project.", and then for each of Company Background, Technical Capabilities, Implementation Experience and Support Offerings: an empty line, the section name, and "[Provide details here]".

Language: JavaScript. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```javascript
function rfiTemplate(projectName) {
  // Your code here
  return '';
}

console.log(rfiTemplate('Data Center Upgrade'));
```

**Expected output**

```
Request for Information (RFI): Data Center Upgrade

Introduction
This RFI is issued for the Data Center Upgrade project.

Company Background
[Provide details here]

Technical Capabilities
[Provide details here]

Implementation Experience
[Provide details here]

Support Offerings
[Provide details here]
```

**Explanation**: Build the lines in order -- title, blank line, introduction -- then a blank line, the name and the placeholder for each of the four sections, and join them with newlines.

Common mistake: Missing the blank line before each section.

### Q3101 - Technical Presentations

*type CRITICAL_THINKING | difficulty AVERAGE*

You are developing a web application that helps professionals structure their technical presentations based on their intended purpose. Write a function that, given the presentation type ('project', 'investment', or 'decision'), returns a list of the key content areas that must be emphasized in the presentation according to best practices. The function should raise an error if an invalid presentation type is given. Content areas:
- Project: scope, timeline, resource needs, risks, expected outcomes
- Investment: market opportunity, business model, competitive advantage, financial projections, return potential
- Decision: decision needed, options considered, trade-offs, recommendation

Input: String representing presentation type.
Output: List of content areas (strings) to emphasize.

Constraints:
- Only the three specified types are valid.
- Return an error message if the input is not one of these three.

Implement the function and provide at least three test cases, including an invalid input.

Rules for this question: complete emphasisAreas(presentationType), returning the content areas as an array of lowercase strings in this order -- 'project': scope, timeline, resource needs, risks, expected outcomes; 'investment': problem, solution, market opportunity, business model, financials, return on investment; 'decision': background, options, analysis, recommendation, next steps. For any other type return the string "Error: Invalid presentation type".

Language: JavaScript. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```javascript
function emphasisAreas(presentationType) {
  // Your code here
  return [];
}

for (const type of ['project', 'investment', 'decision', 'webinar', 'Project']) {
  const result = emphasisAreas(type);
  console.log(type + ': ' + (Array.isArray(result) ? result.join(', ') : result));
}
```

**Expected output**

```
project: scope, timeline, resource needs, risks, expected outcomes
investment: problem, solution, market opportunity, business model, financials, return on investment
decision: background, options, analysis, recommendation, next steps
webinar: Error: Invalid presentation type
Project: Error: Invalid presentation type
```

**Explanation**: Look the type up exactly as given; only 'project', 'investment' and 'decision' are valid, so 'Project' is an error.

Common mistake: Lowercasing the input first, which accepts 'Project'.

### Q3159 - Request for Information (RFI)

*type CRITICAL_THINKING | difficulty AVERAGE*

Write a script that generates a template for a Request for Information (RFI) document. The script should take as input the company name, project name, and a list of information fields (e.g., 'Vendor Experience', 'Technical Capabilities'). The output should be a formatted RFI template as a string, with placeholders for each field.

Rules for this question: complete rfiTemplateFor(companyName, projectName, fields) and return this text exactly (lines separated by '\n'): "RFI Template for <companyName> - Project: <projectName>", an empty line, "Please provide information for the following fields:", then one line per field numbered from 1 as "<n>. <field>: " followed by 23 underscores.

Language: JavaScript. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```javascript
function rfiTemplateFor(companyName, projectName, fields) {
  // Your code here
  return '';
}

console.log(rfiTemplateFor('Acme Corp', 'ERP Upgrade', ['Vendor Experience', 'Technical Capabilities', 'Support Offerings']));
```

**Expected output**

```
RFI Template for Acme Corp - Project: ERP Upgrade

Please provide information for the following fields:
1. Vendor Experience: _______________________
2. Technical Capabilities: _______________________
3. Support Offerings: _______________________
```

**Explanation**: Write the title, a blank line and the prompt, then one numbered line per field ending in exactly 23 underscores.

Common mistake: Numbering the fields from 0.

## PYTHON

### Q2293 - Requirements Specification

*type CRITICAL_THINKING | difficulty AVERAGE*

Suppose you are developing a requirements validation tool for a software project. The tool must check a list of requirement statements and flag any that are ambiguous. For simplicity, consider a requirement ambiguous if it contains any of the following words: 'fast', 'user-friendly', 'robust', 'efficient', without further qualification.

Write a function `find_ambiguous_requirements(requirements: list)` that takes a list of requirement strings and returns a list of indices for the ambiguous ones.

Rules for this question: implement find_ambiguous_requirements(requirements) in Python. A requirement is ambiguous when it contains (case-insensitively, anywhere in the text) any of: fast, user-friendly, robust, efficient. Return the indices of the ambiguous requirements in ascending order.

Language: Python. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```python
def find_ambiguous_requirements(requirements):
    # Your code here
    pass


# Runs your code on the question's data and prints the result -- keep these lines.
ambiguous = find_ambiguous_requirements([
    'The system must be fast.',
    'Generate monthly reports.',
    'The interface should be user-friendly.',
    'Allow up to 1000 users.',
    'System must be robust.',
    'Batch jobs must run EFFICIENTLY overnight.',
])
print(' '.join(str(i) for i in ambiguous))
```

**Expected output**

```
0 2 4 5
```

**Explanation**: Lowercase each requirement and flag it when any of the four vague words appears anywhere in it, returning the indices in order.

Common mistake: Matching case-sensitively, which misses 'EFFICIENTLY'.

### Q2341 - Software Implementation Practices

*type CRITICAL_THINKING | difficulty HARD*

Your team is developing a web application using a version control system. Write a script that automates the following workflow: (1) Clones a repository from a given remote URL, (2) creates a new branch called 'feature/QA-improvements', (3) adds a file named 'test_plan.md' with sample content, (4) commits and pushes the change to the remote. The script should handle errors at each step and output a message indicating success or failure for each operation.

Rules for this question: implement run_workflow(results) in Python. results is a dictionary saying whether each step succeeds, with the keys 'clone', 'branch', 'add', 'commit' and 'push' (True or False). Run the steps in that order and return a list with one message per step attempted, in the form '<step>: success' or '<step>: failed'. Stop after the first failed step.

Language: Python. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```python
def run_workflow(results):
    # Your code here
    pass


# Runs your code on the question's data and prints the result -- keep these lines.
for results in ({'clone': True, 'branch': True, 'add': True, 'commit': True, 'push': True},
                {'clone': True, 'branch': True, 'add': False, 'commit': True, 'push': True},
                {'clone': False}):
    print(', '.join(run_workflow(results)))
```

**Expected output**

```
clone: success, branch: success, add: success, commit: success, push: success
clone: success, branch: success, add: failed
clone: failed
```

**Explanation**: Run the steps in order, adding one message per step attempted, and stop after the first failure.

Common mistake: Continuing after a failed step, so later steps still report success.

### Q2454 - Database Requirements Collection

*type CRITICAL_THINKING | difficulty HARD*

You are tasked with building an automated tool for requirements collection in a medium-sized company. The tool should accept a list of stakeholders and a set of their raw textual input describing their data needs. Implement a function that processes this input to extract and categorize requirements into 'Data to be Stored', 'Business Rules', and 'Performance Needs'. The function should return a dictionary with these three categories as keys and lists of relevant stakeholder statements as values. 

Input: 
- A list of stakeholder responses (strings)
- Each response may contain statements related to any or all of the three requirement categories

Output:
- A dictionary: {'Data to be Stored': [...], 'Business Rules': [...], 'Performance Needs': [...]}  

Constraints:
- The function should use keyword-based matching (you may define simple keyword lists per category)
- Statements not matching any category should be ignored
- At least one test case must include statements that match multiple categories or none at all.

Rules for this question: implement categorize_requirements(responses) in Python, using these keywords (matched as lowercase substrings): 'Data to be Stored': store, record, archive; 'Business Rules': policy, rule, must; 'Performance Needs': fast, quick, daily, within. A statement is added, in input order, to every category whose keywords it contains; statements matching none are ignored. Return a dictionary with the three categories as keys in that order (a list may be empty).

Language: Python. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```python
def categorize_requirements(responses):
    # Your code here
    pass


# Runs your code on the question's data and prints the result -- keep these lines.
result = categorize_requirements(['The system must store employee records', 'Data entry should be fast',
                                  'There is a policy to retain data for 5 years',
                                  'We want to record customer purchases quickly', 'Backup should happen daily',
                                  'No requirement'])
for category, statements in result.items():
    print(category + ': ' + (' | '.join(statements) if statements else '-'))
```

**Expected output**

```
Data to be Stored: The system must store employee records | We want to record customer purchases quickly
Business Rules: The system must store employee records | There is a policy to retain data for 5 years
Performance Needs: Data entry should be fast | We want to record customer purchases quickly | Backup should happen daily
```

**Explanation**: Check every statement against every category's keywords, adding it to each category it matches, in input order.

Common mistake: Stopping at the first matching category, so a statement belongs to only one.

### Q2456 - Database Requirements Collection

*type CRITICAL_THINKING | difficulty AVERAGE*

Create a script that simulates the process of collecting requirements from stakeholders using both interviews and workshops. The script should (1) prompt the user to select a method (interview or workshop), (2) simulate gathering requirements from multiple stakeholders, and (3) output a structured requirements document listing each stakeholder, the method used, and their key requirements. The script should handle at least three stakeholders and allow for different requirements per method.

Rules for this question: implement build_requirements_document(method, stakeholders) in Python. method must be 'interview' or 'workshop' (otherwise raise ValueError). stakeholders is a dictionary of stakeholder name to their stated requirement. Return a dictionary mapping each stakeholder, in order, to {'method': method, 'requirements': [requirement]}; a requirement of 'No requirement' gives an empty list.

Language: Python. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```python
def build_requirements_document(method, stakeholders):
    # Your code here
    pass


# Runs your code on the question's data and prints the result -- keep these lines.
for method, stakeholders in (('interview', {'User1': 'Needs fast access', 'Manager': 'Wants daily reports',
                                             'IT Staff': 'Requires secure backups'}),
                              ('workshop', {'Ops': 'No requirement', 'CFO': 'Monthly cost report'})):
    for name, item in build_requirements_document(method, stakeholders).items():
        print(name + ': ' + item['method'] + ' -> ' + (', '.join(item['requirements']) or 'none'))
try:
    build_requirements_document('survey', {})
    print('no error')
except ValueError:
    print('ValueError')
```

**Expected output**

```
User1: interview -> Needs fast access
Manager: interview -> Wants daily reports
IT Staff: interview -> Requires secure backups
Ops: workshop -> none
CFO: workshop -> Monthly cost report
ValueError
```

**Explanation**: Validate the method first, then map each stakeholder to the method and their requirement, with 'No requirement' giving an empty list.

Common mistake: Listing 'No requirement' as a real requirement.

### Q2519 - Requirements Verification and Validation

*type CRITICAL_THINKING | difficulty HARD*

Write a function that takes a requirements specification as a list of requirement statements and checks each one against the following quality criteria: correct, unambiguous, complete, and testable. The function should return a report indicating which requirements fail which criteria. Assume each requirement is a dictionary with 'id' and 'text'. Define helper functions for each criterion, and include comments to explain your logic. Handle edge cases, such as empty input and requirements missing fields.

Rules for this question: implement check_requirements(requirements) in Python. Return a dictionary mapping each requirement's id, in order, to the list of criteria it fails, always in the order 'correct', 'unambiguous', 'complete', 'testable'. A requirement with a missing or empty 'text' fails all four. Otherwise it fails 'unambiguous' and 'testable' if the text contains any of fast, user-friendly, robust, efficient, easy (case-insensitive), and fails 'complete' if the text has fewer than 4 words. Requirements without an 'id' are skipped.

Language: Python. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```python
def check_requirements(requirements):
    # Your code here
    pass


# Runs your code on the question's data and prints the result -- keep these lines.
report = check_requirements([
    {'id': 'R1', 'text': 'The system shall be fast.'},
    {'id': 'R2', 'text': 'The system shall log all transactions.'},
    {'id': 'R3', 'text': ''},
    {'id': 'R4', 'text': 'Easy login'},
    {'text': 'No id here at all'},
])
for requirement_id, fails in report.items():
    print(requirement_id + ': ' + (', '.join(fails) if fails else 'meets all criteria'))
```

**Expected output**

```
R1: unambiguous, testable
R2: meets all criteria
R3: correct, unambiguous, complete, testable
R4: unambiguous, complete, testable
```

**Explanation**: A missing text fails all four criteria; otherwise vague words fail unambiguous and testable and fewer than 4 words fails complete, listed in the fixed order.

Common mistake: Listing the failed criteria in the order they were found instead of the fixed order.

### Q2727 - Information Security Principles

*type CRITICAL_THINKING | difficulty AVERAGE*

A company maintains a web application that stores customer data. You are tasked with writing a function that logs each access attempt to sensitive information, including the user ID, timestamp, and success or failure. The log must help detect unauthorized access attempts and support future audits. 

Write a function `log_access_attempt(user_id, timestamp, success)` that appends each attempt to a log file called `access_log.txt` in the format: `user_id,timestamp,success`. The function should ensure that each log entry is written even if multiple users access the system at the same time. 

Constraints:
- The function must be thread-safe.
- The log file should not lose any entries, even under concurrent writes.
- Input values are strings for `user_id` and `timestamp`, and a boolean for `success`.

Rules for this question: use Python. Write log_access_attempt(user_id, timestamp, success): each call appends exactly one line 'user_id,timestamp,success' (success written as True or False) to access_log.txt, creating the file if needed. Protect the write with a module-level threading.Lock named log_lock so concurrent calls never lose or mix entries.

Language: Python. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```python
import threading

log_lock = threading.Lock()


def log_access_attempt(user_id, timestamp, success):
    # Your code here
    pass


# Runs your code on the question's data and prints the result -- keep these lines.
import os
if os.path.exists('access_log.txt'):
    os.remove('access_log.txt')
threads = [threading.Thread(target=log_access_attempt, args=('user%02d' % i, '2023-05-01T12:00:00', i % 2 == 0))
           for i in range(20)]
for t in threads:
    t.start()
for t in threads:
    t.join()
log_access_attempt('user123', '2023-05-01T12:05:00', True)
lines = open('access_log.txt').read().splitlines()
print(len(lines))
for line in sorted(lines)[:3]:
    print(line)
print(lines[-1])
```

**Expected output**

```
21
user00,2023-05-01T12:00:00,True
user01,2023-05-01T12:00:00,False
user02,2023-05-01T12:00:00,True
user123,2023-05-01T12:05:00,True
```

**Explanation**: Hold a threading.Lock around opening and appending to the file, so concurrent calls never interleave and every attempt becomes exactly one line.

Common mistake: Writing without a lock, which can mix or lose lines under concurrency.

### Q2730 - Information Security Principles

*type CRITICAL_THINKING | difficulty AVERAGE*

An organization must ensure that only authorized users can modify its sensitive financial records. Write a function `can_modify_record(user_role, record_type)` that returns `True` if the user is allowed to modify the specified record type and `False` otherwise. The function should enforce the following policy:
- Only users with the role 'admin' or 'finance_manager' can modify records of type 'financial'.
- All other users cannot modify 'financial' records.
- Any user can modify records of type 'general'.

Input: `user_role` and `record_type` are strings.

Rules for this question: implement can_modify_record(user_role, record_type) in Python. Only 'admin' and 'finance_manager' may modify 'financial' records; anyone may modify 'general' records; any other record type may not be modified by anyone. Roles and record types are compared exactly (case-sensitive). Return True or False.

Language: Python. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```python
def can_modify_record(user_role, record_type):
    # Your code here
    pass


# Runs your code on the question's data and prints the result -- keep these lines.
for role, record in [('admin', 'financial'), ('finance_manager', 'financial'), ('clerk', 'financial'),
                     ('clerk', 'general'), ('Admin', 'financial'), ('admin', 'payroll')]:
    print(role, record, can_modify_record(role, record))
```

**Expected output**

```
admin financial True
finance_manager financial True
clerk financial False
clerk general True
Admin financial False
admin payroll False
```

**Explanation**: General records are open to everyone; financial records only to admin and finance_manager; any other type to no one, with exact, case-sensitive role names.

Common mistake: Matching roles case-insensitively, which lets 'Admin' through.

### Q2916 - ISMS Monitoring and Improvement

*type CRITICAL_THINKING | difficulty AVERAGE*

Write a function  that models the PDCA cycle for ISMS improvement. The function receives a list of actions, each with a 'phase' key ('Plan', 'Do', 'Check', 'Act'). The function should return a dictionary counting how many actions fall into each phase. Ensure that all four phases are represented in the output, even if a phase has zero actions.

Rules for this question: implement count_pdca(actions) in Python. Return {'Plan': n, 'Do': n, 'Check': n, 'Act': n} counting the actions in each phase; every phase is present even when its count is 0.

Language: Python. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```python
def count_pdca(actions):
    # Your code here
    pass


# Runs your code on the question's data and prints the result -- keep these lines.
for actions in ([{'phase': 'Plan'}, {'phase': 'Do'}, {'phase': 'Plan'}, {'phase': 'Check'}], []):
    print(' '.join(phase + '=' + str(count) for phase, count in count_pdca(actions).items()))
```

**Expected output**

```
Plan=2 Do=1 Check=1 Act=0
Plan=0 Do=0 Check=0 Act=0
```

**Explanation**: Start all four phases at 0 so every phase is present, then count each action's phase.

Common mistake: Building the counts from the actions only, so 'Act' is missing.

### Q2933 - Key Performance Indicators

*type CRITICAL_THINKING | difficulty AVERAGE*

A large retail organization tracks the performance of its IT service desk using several KPIs, such as average resolution time, number of open tickets, and customer satisfaction score. Write a program that takes as input a list of dictionaries, each representing a ticket with fields: 'resolution_time' (in hours), 'customer_satisfaction' (0-100), and 'status' ('open' or 'closed'). The program should output: (1) the average resolution time for closed tickets, (2) the number of open tickets, and (3) the average customer satisfaction score for all tickets. Handle the case where there are no closed tickets or no tickets at all.

Rules for this question: implement service_desk_kpis(tickets) in Python, where each ticket is a dictionary with 'resolution_time' (hours), 'customer_satisfaction' (0-100) and 'status' ('open' or 'closed'). Return a tuple (average resolution time of closed tickets, number of open tickets, average customer satisfaction of all tickets), with both averages rounded to 2 decimal places and 0.0 when there is nothing to average.

Language: Python. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```python
def service_desk_kpis(tickets):
    # Your code here
    pass


# Runs your code on the question's data and prints the result -- keep these lines.
for tickets in ([{'resolution_time': 4, 'customer_satisfaction': 90, 'status': 'closed'},
                 {'resolution_time': 7, 'customer_satisfaction': 70, 'status': 'closed'},
                 {'resolution_time': 0, 'customer_satisfaction': 55, 'status': 'open'},
                 {'resolution_time': 2.5, 'customer_satisfaction': 88, 'status': 'closed'}],
                [{'resolution_time': 0, 'customer_satisfaction': 40, 'status': 'open'}],
                []):
    resolution, open_count, satisfaction = service_desk_kpis(tickets)
    print('avg resolution %.2f h, open %d, avg satisfaction %.2f' % (resolution, open_count, satisfaction))
```

**Expected output**

```
avg resolution 4.50 h, open 1, avg satisfaction 75.75
avg resolution 0.00 h, open 1, avg satisfaction 40.00
avg resolution 0.00 h, open 0, avg satisfaction 0.00
```

**Explanation**: Average resolution over closed tickets only, count the open ones, and average satisfaction over all tickets, using 0.0 when there is nothing to average.

Common mistake: Including open tickets in the resolution average.

### Q3155 - Requirements Documentation

*type CRITICAL_THINKING | difficulty HARD*

You are working for a software company that has received ambiguous requirements from a client. The requirements document includes both clear user needs and several vague statements such as "the system should be fast" and "the interface must be user-friendly." Write a function that parses a list of requirement statements and categorizes each as either 'Functional', 'Non-functional', or 'Ambiguous.' The function should return a dictionary with the categories as keys and lists of statements as values. For this exercise, treat requirements mentioning performance, reliability, or usability without specific metrics as 'Ambiguous.'

Rules for this question: implement categorize_statements(statements) in Python and return {'Functional': [...], 'Non-functional': [...], 'Ambiguous': [...]} with statements in input order. Check each statement in this order, in lowercase: it is 'Ambiguous' if it contains fast, user-friendly, scalable, intuitive, reliable or robust and has no digit; otherwise 'Non-functional' if it contains second, encrypt, uptime or load; otherwise 'Functional'.

Language: Python. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```python
def categorize_statements(statements):
    # Your code here
    pass


# Runs your code on the question's data and prints the result -- keep these lines.
result = categorize_statements(['The system must allow users to reset their password.', 'The system should be fast.',
                                'The interface must be user-friendly.', 'The database must store up to 100,000 records.',
                                'Pages must load within 2 seconds.', 'All backups must be encrypted.',
                                'The service must be reliable with 99.9% uptime.'])
for category, statements in result.items():
    print(category + ': ' + (' | '.join(statements) if statements else '-'))
```

**Expected output**

```
Functional: The system must allow users to reset their password. | The database must store up to 100,000 records.
Non-functional: Pages must load within 2 seconds. | All backups must be encrypted. | The service must be reliable with 99.9% uptime.
Ambiguous: The system should be fast. | The interface must be user-friendly.
```

**Explanation**: Check ambiguity first (a vague word and no digit), then the non-functional keywords, otherwise functional.

Common mistake: Checking non-functional first, which hides the ambiguity of a vague statement.

### Q3183 - Business Plan Development

*type CRITICAL_THINKING | difficulty AVERAGE*

Write a function that takes a list of sections required for a business plan and checks if the plan includes all of the following core sections: 'Executive Summary', 'Company Description', 'Market Analysis', and 'Organization and Management'. The function should return True if all are present, otherwise return False. Include at least one test case demonstrating a missing section.

Rules for this question: name the function has_core_sections(sections). Return True when the list contains all of 'Executive Summary', 'Company Description', 'Market Analysis' and 'Organization and Management' (exact names; other sections may also be present), otherwise False.

Language: Python. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```python
def has_core_sections(sections):
    # Your code here
    pass


# Runs your code on the question's data and prints the result -- keep these lines.
print(has_core_sections(['Executive Summary', 'Company Description', 'Market Analysis', 'Organization and Management']))
print(has_core_sections(['Executive Summary', 'Company Description', 'Market Analysis']))
print(has_core_sections(['Market Analysis', 'Financial Projections', 'Organization and Management',
                         'Company Description', 'Executive Summary']))
print(has_core_sections(['executive summary', 'Company Description', 'Market Analysis', 'Organization and Management']))
```

**Expected output**

```
True
False
True
False
```

**Explanation**: Check that each of the four exact section names is in the list; other sections may also be present.

Common mistake: Comparing case-insensitively, which accepts 'executive summary'.

### Q3248 - Requirements Collection and Analysis

*type CRITICAL_THINKING | difficulty HARD*

Requirements are often written with duplicated intent: two stakeholders raise the same need in different words, and both end up in the backlog.

Write a function `duplicate_groups(requirements)` that takes a list of requirement strings and returns the groups of requirements that are duplicates of one another.

Two requirements are duplicates when, after lowercasing and removing punctuation, they contain exactly the same set of words (order and repetition do not matter).

Return a list of groups. Each group is the list of duplicate requirements in the order they appeared in the input. Include only groups with two or more members, and order the groups by the position of their first member. Return an empty list when there are no duplicates.

Rules for this question: implement duplicate_groups(requirements) in Python as described above and return the list of groups. The starter prints each group on its own line as its requirements joined by ' | ' (nothing at all when there are no duplicates).

Language: Python. Your program reads no input: the starter code already holds the data and prints the result. Complete the parts marked "Your code here" and keep everything else as it is -- the printed output must match the expected output exactly (trailing spaces ignored).

**Starter code / given tables**

```python
import string


def duplicate_groups(requirements):
    # Your code here
    pass


# Runs your code on the question's data and prints the result -- keep these lines.
requirements = [
    'The system must log every failed login.',
    'Users can reset their password by email.',
    'Every failed login the system must log.',
    'Password reset: users can, by email!',
    'Admins can export the audit log.',
    'The system must log every failed login, every failed login.',
]
for group in duplicate_groups(requirements):
    print(' | '.join(group))
```

**Expected output**

```
The system must log every failed login. | Every failed login the system must log. | The system must log every failed login, every failed login.
```

**Explanation**: Lowercase, strip punctuation and use the set of words as the key; keep groups in order of their first member and print only groups of two or more.

Common mistake: Comparing word lists instead of sets, so reordered requirements are not grouped.

## SQL

### Q2535 - Database Requirements Collection

*type CRITICAL_THINKING | difficulty AVERAGE*

Manager Requirements

During requirements gathering, every interview answer was recorded in the table `interview` with the interviewee's role and the requirement they raised. Several managers raised the same requirement.

Rules for this question: Write a SELECT that returns each requirement raised by someone whose `role` is 'manager', once, sorted alphabetically. One column, `requirement`.

Language: SQL. Write ONE SQL statement (SQLite dialect) using the tables shown with the problem. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described. Formatting, letter case and aliases do not matter.

**Starter code / given tables**

```sql
CREATE TABLE interview (interview_id INTEGER PRIMARY KEY, role TEXT NOT NULL, requirement TEXT NOT NULL);
INSERT INTO interview (interview_id, role, requirement) VALUES
  (1, 'manager', 'fast reporting'),
  (2, 'end user', 'easy search'),
  (3, 'manager', 'fast reporting'),
  (4, 'manager', 'audit trail'),
  (5, 'end user', 'audit trail'),
  (6, 'manager', 'secure access'),
  (7, 'Manager', 'mobile app');
```

**Expected output**

```
SELECT DISTINCT requirement
FROM interview
WHERE role = 'manager'
ORDER BY requirement;
```

**Explanation**: Filter role = 'manager', use DISTINCT and ORDER BY requirement.

Common mistake: Forgetting DISTINCT, so 'fast reporting' appears twice.

### Q2782 - IT Business Operations

*type CRITICAL_THINKING | difficulty AVERAGE*

SLA Breaches

An IT department records, for each service in the table `service`, its SLA uptime target and the uptime actually achieved this month (both percentages). The service manager needs the list of breaches, worst first.

Rules for this question: A service breaches its SLA when `actual_uptime < sla_target`. Write a SELECT that returns the breaching services with two columns, `name` and `shortfall` (sla_target - actual_uptime, rounded to 2 decimal places), ordered by `shortfall` from largest to smallest, ties by `name`.

Language: SQL. Write ONE SQL statement (SQLite dialect) using the tables shown with the problem. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described. Formatting, letter case and aliases do not matter.

**Starter code / given tables**

```sql
CREATE TABLE service (service_id INTEGER PRIMARY KEY, name TEXT NOT NULL, sla_target REAL NOT NULL, actual_uptime REAL NOT NULL);
INSERT INTO service (service_id, name, sla_target, actual_uptime) VALUES
  (1, 'Email', 99.9, 99.95),
  (2, 'CRM', 99.5, 98.7),
  (3, 'VPN', 99.0, 99.0),
  (4, 'Payroll', 99.9, 99.1),
  (5, 'Intranet', 98.0, 97.2),
  (6, 'Web Shop', 99.95, 99.9);
```

**Expected output**

```
SELECT name, ROUND(sla_target - actual_uptime, 2) AS shortfall
FROM service
WHERE actual_uptime < sla_target
ORDER BY shortfall DESC, name;
```

**Explanation**: Keep the breaching services with WHERE actual_uptime < sla_target, compute the rounded shortfall and order by it descending, then by name.

Common mistake: Using <=, which wrongly lists VPN at exactly its target.

### Q2807 - Key Performance Indicators

*type CRITICAL_THINKING | difficulty AVERAGE*

KPIs Needing Attention

A service desk tracks its key performance indicators in the table `kpi`: each row has the KPI's name, its target and its current value. Management wants a list of the KPIs that are falling well short of target.

Rules for this question: Write a SELECT that returns the `name` of every KPI whose `current_value` is less than 90% of its `target` (current_value < 0.9 * target), in `kpi_id` order. One column, `name`.

Language: SQL. Write ONE SQL statement (SQLite dialect) using the tables shown with the problem. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described. Formatting, letter case and aliases do not matter.

**Starter code / given tables**

```sql
CREATE TABLE kpi (kpi_id INTEGER PRIMARY KEY, name TEXT NOT NULL, target REAL NOT NULL, current_value REAL NOT NULL);
INSERT INTO kpi (kpi_id, name, target, current_value) VALUES
  (1, 'Customer Satisfaction', 85, 76),
  (2, 'Server Uptime', 99.9, 99.8),
  (3, 'Tickets Closed', 200, 150),
  (4, 'First Response', 100, 90),
  (5, 'Knowledge Articles', 40, 35.9),
  (6, 'Escalation Rate Met', 50, 51);
```

**Expected output**

```
SELECT name
FROM kpi
WHERE current_value < 0.9 * target
ORDER BY kpi_id;
```

**Explanation**: Filter with WHERE current_value < 0.9 * target and order by kpi_id.

Common mistake: Using <=, which wrongly includes First Response at exactly 90%.

### Q2808 - Key Performance Indicators

*type CRITICAL_THINKING | difficulty HARD*

KPI Summary

The performance dashboard needs one summary row counting how the KPIs in the table `kpi` stand against their targets.

Rules for this question: A KPI is on target when `current_value >= target_value`, slightly below when it is below target but at least 90% of it, and well below otherwise. Write a SELECT that returns ONE row with three columns, in this order: `on_target`, `slightly_below`, `well_below` -- the number of KPIs in each band.

Language: SQL. Write ONE SQL statement (SQLite dialect) using the tables shown with the problem. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described. Formatting, letter case and aliases do not matter.

**Starter code / given tables**

```sql
CREATE TABLE kpi (kpi_id INTEGER PRIMARY KEY, name TEXT NOT NULL, current_value REAL NOT NULL, target_value REAL NOT NULL);
INSERT INTO kpi (kpi_id, name, current_value, target_value) VALUES
  (1, 'Sales', 110, 100),
  (2, 'Support Tickets', 90, 100),
  (3, 'Response Time', 85, 100),
  (4, 'Renewals', 100, 100),
  (5, 'Churn', 89.9, 100),
  (6, 'NPS', 45, 50);
```

**Expected output**

```
SELECT SUM(CASE WHEN current_value >= target_value THEN 1 ELSE 0 END) AS on_target,
       SUM(CASE WHEN current_value < target_value AND current_value >= 0.9 * target_value THEN 1 ELSE 0 END) AS slightly_below,
       SUM(CASE WHEN current_value < 0.9 * target_value THEN 1 ELSE 0 END) AS well_below
FROM kpi;
```

**Explanation**: One row of conditional counts: SUM(CASE WHEN ... THEN 1 ELSE 0 END) for each band.

Common mistake: Using GROUP BY, which returns several rows instead of one.

### Q2828 - Business Problem Solving

*type CRITICAL_THINKING | difficulty HARD*

Worst Delayed Department

A warehouse logs every order in the table `orders` with the time it was received, the time processing finished, the department that handled it and its status. Operations wants to know which department causes the longest delays.

Rules for this question: For orders whose status is 'delayed', the delay is processing_time - time_received. Write a SELECT that returns ONE row: the department with the highest average delay, with two columns `department` and `average_delay` (rounded to 2 decimal places). If two departments tie, return the one whose name comes first alphabetically.

Language: SQL. Write ONE SQL statement (SQLite dialect) using the tables shown with the problem. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described. Formatting, letter case and aliases do not matter.

**Starter code / given tables**

```sql
CREATE TABLE orders (order_id TEXT PRIMARY KEY, time_received REAL NOT NULL, processing_time REAL NOT NULL, department TEXT NOT NULL, status TEXT NOT NULL);
INSERT INTO orders (order_id, time_received, processing_time, department, status) VALUES
  ('A01', 10, 15, 'Packing', 'delayed'),
  ('A02', 12, 30, 'Shipping', 'completed'),
  ('A03', 9, 17, 'Packing', 'delayed'),
  ('A04', 11, 12, 'Shipping', 'delayed'),
  ('A05', 3, 9.5, 'Billing', 'delayed'),
  ('A06', 20, 21, 'Shipping', 'delayed');
```

**Expected output**

```
SELECT department, ROUND(AVG(processing_time - time_received), 2) AS average_delay
FROM orders
WHERE status = 'delayed'
GROUP BY department
ORDER BY AVG(processing_time - time_received) DESC, department
LIMIT 1;
```

**Explanation**: Filter to delayed orders, group by department, order by the average delay descending and the name, and take LIMIT 1.

Common mistake: Including completed orders in the average.

### Q2830 - Business Problem Solving

*type CRITICAL_THINKING | difficulty AVERAGE*

Complaint Resolution Rates

An online retailer logs every customer complaint in the table `complaint` with its category and its status ('resolved', 'open', 'escalated', ...). The customer-care manager wants to see, per category, what share of complaints has been resolved.

Rules for this question: Write a SELECT that returns one row per category with two columns, `category` and `resolution_rate` -- the fraction of that category's complaints whose status is 'resolved', rounded to 2 decimal places (0.0 to 1.0). Order by `resolution_rate` from highest to lowest, ties by `category`.

Language: SQL. Write ONE SQL statement (SQLite dialect) using the tables shown with the problem. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described. Formatting, letter case and aliases do not matter.

**Starter code / given tables**

```sql
CREATE TABLE complaint (complaint_id INTEGER PRIMARY KEY, category TEXT NOT NULL, date_received TEXT NOT NULL, date_resolved TEXT, status TEXT NOT NULL);
INSERT INTO complaint (complaint_id, category, date_received, date_resolved, status) VALUES
  (1, 'Delivery', '2023-01-01', '2023-01-03', 'resolved'),
  (2, 'Product', '2023-01-02', NULL, 'open'),
  (3, 'Delivery', '2023-01-04', '2023-01-05', 'resolved'),
  (4, 'Product', '2023-01-05', '2023-01-07', 'resolved'),
  (5, 'Product', '2023-01-06', NULL, 'open'),
  (6, 'Billing', '2023-01-08', NULL, 'escalated'),
  (7, 'Website', '2023-01-09', '2023-01-09', 'resolved'),
  (8, 'Delivery', '2023-01-10', NULL, 'open');
```

**Expected output**

```
SELECT category,
       ROUND(AVG(CASE WHEN status = 'resolved' THEN 1.0 ELSE 0.0 END), 2) AS resolution_rate
FROM complaint
GROUP BY category
ORDER BY resolution_rate DESC, category;
```

**Explanation**: Group by category and average a 1/0 flag for status = 'resolved', rounded to 2 places, then order by the rate and the category.

Common mistake: Dividing with integers (SUM(...) / COUNT(*) on whole numbers), which truncates every rate to 0 or 1.

### Q2893 - Security Risk Analysis

*type CRITICAL_THINKING | difficulty AVERAGE*

Risk Prioritization

The security team keeps its risk register in the table `risk`, rating each risk's likelihood and impact from 1 to 5.

Rules for this question: The risk score is likelihood x impact. Write a SELECT that returns every risk with two columns, `name` and `risk_score`, ordered by `risk_score` from highest to lowest, ties alphabetically by `name`.

Language: SQL. Write ONE SQL statement (SQLite dialect) using the tables shown with the problem. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described. Formatting, letter case and aliases do not matter.

**Starter code / given tables**

```sql
CREATE TABLE risk (risk_id INTEGER PRIMARY KEY, name TEXT NOT NULL, likelihood INTEGER NOT NULL, impact INTEGER NOT NULL);
INSERT INTO risk (risk_id, name, likelihood, impact) VALUES
  (1, 'Insider Threat', 4, 5),
  (2, 'Phishing', 3, 4),
  (3, 'Data Breach', 4, 5),
  (4, 'DDoS', 2, 3),
  (5, 'Ransomware', 5, 4),
  (6, 'Lost Laptop', 4, 3);
```

**Expected output**

```
SELECT name, likelihood * impact AS risk_score
FROM risk
ORDER BY risk_score DESC, name;
```

**Explanation**: Compute likelihood * impact as risk_score and order by it descending, then by name.

Common mistake: Ordering ties by risk_id instead of by name.

### Q2914 - ISMS Monitoring and Improvement

*type CRITICAL_THINKING | difficulty AVERAGE*

Control Effectiveness

An auditor reviews the security controls in the table `control` (each with its status) against the incident log in `incident`, where `incident` is NULL when a review found nothing.

Rules for this question: A control is 'effective' when its status is 'active' and no row in `incident` for that control has a non-NULL `incident`; otherwise it is 'needs improvement'. Write a SELECT that returns every control with two columns, `control_name` and `result`, in `control_id` order.

Language: SQL. Write ONE SQL statement (SQLite dialect) using the tables shown with the problem. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described. Formatting, letter case and aliases do not matter.

**Starter code / given tables**

```sql
CREATE TABLE control (control_id INTEGER PRIMARY KEY, control_name TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE incident (incident_id INTEGER PRIMARY KEY, control_name TEXT NOT NULL, incident TEXT);
INSERT INTO control (control_id, control_name, status) VALUES
  (1, 'Firewall', 'active'),
  (2, 'Encryption', 'inactive'),
  (3, 'MFA', 'active'),
  (4, 'Backups', 'active');
INSERT INTO incident (incident_id, control_name, incident) VALUES
  (1, 'Firewall', NULL),
  (2, 'Encryption', 'breach'),
  (3, 'MFA', 'bypass'),
  (4, 'Firewall', NULL);
```

**Expected output**

```
SELECT c.control_name,
       CASE WHEN c.status = 'active'
                 AND NOT EXISTS (SELECT 1 FROM incident i
                                 WHERE i.control_name = c.control_name AND i.incident IS NOT NULL)
            THEN 'effective' ELSE 'needs improvement' END AS result
FROM control c
ORDER BY c.control_id;
```

**Explanation**: CASE with NOT EXISTS: effective only if the control is active and no incident row for it has a non-NULL incident.

Common mistake: A plain JOIN to incident, which drops Backups (no incident rows) and duplicates Firewall.

### Q2915 - ISMS Monitoring and Improvement

*type CRITICAL_THINKING | difficulty HARD*

Audit Findings by Severity

An internal audit stored its findings in the table `finding`, each with a severity of 'Critical', 'High', 'Medium' or 'Low'. The remediation plan must tackle them in severity order.

Rules for this question: Write a SELECT that returns the `finding` texts ordered by severity -- Critical, then High, Medium, Low (not alphabetical) -- and alphabetically by finding within the same severity. One column, `finding`.

Language: SQL. Write ONE SQL statement (SQLite dialect) using the tables shown with the problem. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described. Formatting, letter case and aliases do not matter.

**Starter code / given tables**

```sql
CREATE TABLE finding (finding_id INTEGER PRIMARY KEY, finding TEXT NOT NULL, severity TEXT NOT NULL);
INSERT INTO finding (finding_id, finding, severity) VALUES
  (1, 'Weak password policy', 'High'),
  (2, 'Unpatched server', 'Critical'),
  (3, 'Outdated procedure', 'Low'),
  (4, 'Missing MFA', 'High'),
  (5, 'Default credentials', 'Critical'),
  (6, 'Verbose errors', 'Medium');
```

**Expected output**

```
SELECT finding
FROM finding
ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
         finding;
```

**Explanation**: ORDER BY a CASE that ranks Critical, High, Medium, Low, then by finding.

Common mistake: ORDER BY severity, which sorts the severity names alphabetically.

### Q2939 - IT Business Operations

*type CRITICAL_THINKING | difficulty AVERAGE*

Policy Incident Report

IT logs every breach of its usage policy in the table `incident`: who did it, the type of incident, the date and a severity from 1 to 5.

Rules for this question: Write a SELECT that returns one row per incident type with four columns, in this order: `incident_type`, `incidents` (how many), `users` (how many different users) and `average_severity` (rounded to 2 decimal places). Order by `incidents` from most to fewest, ties alphabetically by `incident_type`.

Language: SQL. Write ONE SQL statement (SQLite dialect) using the tables shown with the problem. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described. Formatting, letter case and aliases do not matter.

**Starter code / given tables**

```sql
CREATE TABLE incident (incident_id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, incident_type TEXT NOT NULL, incident_date TEXT NOT NULL, severity INTEGER NOT NULL);
INSERT INTO incident (incident_id, user_id, incident_type, incident_date, severity) VALUES
  (1, 'u1', 'USB', '2024-01-02', 2),
  (2, 'u2', 'Phishing', '2024-01-03', 4),
  (3, 'u1', 'Phishing', '2024-01-05', 3),
  (4, 'u3', 'USB', '2024-01-06', 1),
  (5, 'u2', 'Shadow IT', '2024-01-07', 5),
  (6, 'u2', 'Phishing', '2024-01-09', 2),
  (7, 'u3', 'USB', '2024-01-10', 2);
```

**Expected output**

```
SELECT incident_type,
       COUNT(*) AS incidents,
       COUNT(DISTINCT user_id) AS users,
       ROUND(AVG(severity), 2) AS average_severity
FROM incident
GROUP BY incident_type
ORDER BY incidents DESC, incident_type;
```

**Explanation**: Group by incident_type with COUNT(*), COUNT(DISTINCT user_id) and ROUND(AVG(severity), 2), then order by the count descending and the type.

Common mistake: COUNT(user_id) instead of COUNT(DISTINCT user_id), which counts u2's two phishing incidents twice.

### Q2960 - IT Business Operations

*type CRITICAL_THINKING | difficulty AVERAGE*

Project Compliance

The PMO tracks, in the table `project`, whether each project passes the internal compliance check and the regulatory compliance check (1 = passes, 0 = fails).

Rules for this question: Write a SELECT that lists the non-compliant projects -- those failing at least one check -- with two columns, `name` and `failed_checks` (how many of the two checks it fails), ordered by `failed_checks` from most to fewest, then by `project_id`.

Language: SQL. Write ONE SQL statement (SQLite dialect) using the tables shown with the problem. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described. Formatting, letter case and aliases do not matter.

**Starter code / given tables**

```sql
CREATE TABLE project (project_id INTEGER PRIMARY KEY, name TEXT NOT NULL, internal_compliance INTEGER NOT NULL, regulatory_compliance INTEGER NOT NULL);
INSERT INTO project (project_id, name, internal_compliance, regulatory_compliance) VALUES
  (1, 'Project A', 1, 0),
  (2, 'Project B', 1, 1),
  (3, 'Project C', 0, 0),
  (4, 'Project D', 0, 1),
  (5, 'Project E', 1, 1);
```

**Expected output**

```
SELECT name, (1 - internal_compliance) + (1 - regulatory_compliance) AS failed_checks
FROM project
WHERE internal_compliance = 0 OR regulatory_compliance = 0
ORDER BY failed_checks DESC, project_id;
```

**Explanation**: Keep projects failing either check with OR, compute the number of failed checks, and order by it, then by project_id.

Common mistake: Using AND, which lists only projects that fail both checks.

### Q2961 - IT Business Operations

*type CRITICAL_THINKING | difficulty AVERAGE*

Personnel Allocation Report

Resource planning keeps every staffing assignment in the table `assignment`, with the project, the number of people and whether the assignment is 'allocated' or 'unallocated'.

Rules for this question: Write a SELECT that returns ONE row with three columns, in this order: `total_allocated` (the personnel of all 'allocated' assignments added up), `unallocated_projects` (how many assignments are 'unallocated') and `average_allocated` (the average personnel per 'allocated' assignment, rounded to 2 decimal places).

Language: SQL. Write ONE SQL statement (SQLite dialect) using the tables shown with the problem. You cannot run it: when you submit, it is compared with the correct statement, so it must return exactly the result described. Formatting, letter case and aliases do not matter.

**Starter code / given tables**

```sql
CREATE TABLE assignment (assignment_id INTEGER PRIMARY KEY, project_id INTEGER NOT NULL, personnel_count INTEGER NOT NULL, allocation_status TEXT NOT NULL);
INSERT INTO assignment (assignment_id, project_id, personnel_count, allocation_status) VALUES
  (1, 1, 5, 'allocated'),
  (2, 2, 3, 'unallocated'),
  (3, 3, 2, 'allocated'),
  (4, 4, 0, 'unallocated'),
  (5, 5, 4, 'allocated');
```

**Expected output**

```
SELECT SUM(CASE WHEN allocation_status = 'allocated' THEN personnel_count ELSE 0 END) AS total_allocated,
       SUM(CASE WHEN allocation_status = 'unallocated' THEN 1 ELSE 0 END) AS unallocated_projects,
       ROUND(AVG(CASE WHEN allocation_status = 'allocated' THEN personnel_count END), 2) AS average_allocated
FROM assignment;
```

**Explanation**: Use conditional aggregates: SUM of personnel for allocated rows, SUM of 1 for unallocated rows, and AVG of a CASE that yields NULL for unallocated rows so they are not averaged.

Common mistake: Averaging with ELSE 0, which counts unallocated rows as zero people.

# FE Exam (certification 14)

## PYTHON

### Q24418 - Markup and Other Languages: HTML, XML, JSON and Notation

*type CRITICAL_THINKING | difficulty AVERAGE*

A manufacturing facility logs equipment maintenance records in a simple format. Each record contains a date (YYYY-MM-DD), equipment ID, maintenance type (Preventive or Corrective), and duration in hours.

Your program must process the following maintenance log and calculate the total corrective maintenance hours for each piece of equipment, then output the results sorted by equipment ID in ascending order. Equipment with zero corrective maintenance hours should not appear in the output.

Maintenance log:
2025-01-15,EQ-001,Preventive,2
2025-01-16,EQ-003,Corrective,3
2025-01-17,EQ-001,Corrective,1
2025-01-18,EQ-002,Preventive,1
2025-01-19,EQ-001,Corrective,2
2025-01-20,EQ-003,Corrective,4
2025-01-21,EQ-002,Corrective,1
2025-01-22,EQ-004,Preventive,3

The output must list each equipment ID with corrective maintenance hours in the format:
EQ-XXX: Y hours

Rules for this question: Parse each record by splitting on comma. Filter records where maintenance type is 'Corrective'. Sum the duration (hours) for each equipment ID. Sort equipment IDs in ascending alphanumeric order. Output each equipment ID with its total corrective maintenance hours in the format 'EQ-XXX: Y hours'. Do not include equipment with zero corrective maintenance hours.

**Starter code / given tables**

```python
# Process maintenance records and calculate corrective maintenance hours
# Input data is hardcoded below

maintenance_records = [
    "2025-01-15,EQ-001,Preventive,2",
    "2025-01-16,EQ-003,Corrective,3",
    "2025-01-17,EQ-001,Corrective,1",
    "2025-01-18,EQ-002,Preventive,1",
    "2025-01-19,EQ-001,Corrective,2",
    "2025-01-20,EQ-003,Corrective,4",
    "2025-01-21,EQ-002,Corrective,1",
    "2025-01-22,EQ-004,Preventive,3"
]

# TODO: Parse records, filter for Corrective maintenance, aggregate by equipment ID,
# and output in sorted order
```

**Expected output**

```
EQ-001: 3 hours
EQ-002: 1 hours
EQ-003: 7 hours
```

**Explanation**: This task requires parsing structured data, filtering records by a specific criterion (Corrective maintenance type), aggregating totals by equipment ID, and outputting results in a specified format and order. The learner must handle string parsing, conditional logic, dictionary aggregation, and sorting—practical skills for processing real operational logs.

Common mistake: Including equipment with zero corrective hours, or forgetting to filter for 'Corrective' type and summing all maintenance hours instead. Another common error is failing to sort the equipment IDs correctly or using incorrect output formatting.

### Q24436 - Markup and Other Languages: HTML, XML, JSON and Notation

*type CRITICAL_THINKING | difficulty AVERAGE*

A logistics company processes shipment records to analyze delivery performance. Each record contains a shipment ID, origin warehouse code, destination warehouse code, weight in kilograms, and delivery status (On-Time, Late, or Cancelled).

Your program must read the following shipment data and calculate the total weight of shipments that were delivered on time from each origin warehouse. Output the results sorted by warehouse code in ascending order, showing only warehouses that had at least one on-time delivery.

Shipment data:
SHP-001,WH-A,WH-B,250,On-Time
SHP-002,WH-C,WH-A,180,Late
SHP-003,WH-A,WH-D,420,On-Time
SHP-004,WH-B,WH-C,310,Cancelled
SHP-005,WH-A,WH-C,150,On-Time
SHP-006,WH-C,WH-B,200,On-Time
SHP-007,WH-B,WH-D,175,On-Time
SHP-008,WH-A,WH-B,90,Late

The output must display each warehouse code with its total on-time delivery weight in the format:
WH-X: Y kg

Warehouses with no on-time deliveries must not appear in the output.

Rules for this question: Parse each record by splitting on comma. Filter records where delivery status is 'On-Time'. Sum the weight (third field) for each origin warehouse (second field). Sort warehouse codes in ascending alphanumeric order. Output each warehouse with its total on-time weight in the format 'WH-X: Y kg'. Do not include warehouses with zero on-time deliveries.

**Starter code / given tables**

```python
# Read shipment records and calculate total on-time delivery weight by origin warehouse
# Data is embedded below; do not read from input

data = """SHP-001,WH-A,WH-B,250,On-Time
SHP-002,WH-C,WH-A,180,Late
SHP-003,WH-A,WH-D,420,On-Time
SHP-004,WH-B,WH-C,310,Cancelled
SHP-005,WH-A,WH-C,150,On-Time
SHP-006,WH-C,WH-B,200,On-Time
SHP-007,WH-B,WH-D,175,On-Time
SHP-008,WH-A,WH-B,90,Late"""

# TODO: Parse records, filter on-time deliveries, sum by warehouse, sort and output
```

**Expected output**

```
WH-A: 820 kg
WH-B: 175 kg
WH-C: 200 kg
```

**Explanation**: Review the lesson section this question is drawn from.

Common mistake: A common mistake is answering from a related idea instead of the one asked. Review the lesson section this question is drawn from.

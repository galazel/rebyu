"""C versions. In `ref`, the code between a `//<<` line and a `//>> <stub>` line is the part the
learner writes; the starter replaces it with "// Your code here" and the stub line."""

LCG = '''static unsigned long long lcg_state;

/* Deterministic generator used to build the input. Do not change it. */
static unsigned long long next_rand(void) {
    lcg_state = (lcg_state * 1103515245ULL + 12345ULL) % 2147483648ULL;
    return lcg_state;
}
'''

QUESTIONS = {
    2852: dict(
        rules="implement encode_bits(bits, n, out), which writes the signal for bits[0..n-1] into out ('V' for 1, '-' "
              "for 0, then '\\0'), and decode_signal(signal, bits), which writes the bits of the signal into bits and "
              "returns how many there are. main prints the results.",
        ref=r'''#include <stdio.h>
#include <string.h>

/* Writes the signal for bits[0..n-1] into out: 'V' for 1, '-' for 0, then '\0'. */
void encode_bits(const int *bits, int n, char *out) {
    //<<
    for (int i = 0; i < n; i++) {
        out[i] = bits[i] == 1 ? 'V' : '-';
    }
    out[n] = '\0';
    //>> out[0] = '\0';
}

/* Writes the bits of signal into bits and returns how many there are. */
int decode_signal(const char *signal, int *bits) {
    //<<
    int n = (int) strlen(signal);
    for (int i = 0; i < n; i++) {
        bits[i] = signal[i] == 'V' ? 1 : 0;
    }
    return n;
    //>> return 0;
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
'''),

    2854: dict(
        rules="implement parse_frame(frame, data). A frame is 'S|MAC|DATA|CHECKSUM|E'. If it does not have exactly those "
              "5 parts starting with 'S' and ending with 'E', return \"Error: Invalid frame\". The MAC must be exactly 6 "
              "characters of 0-9 or A-F, otherwise return \"Error: Invalid MAC address\". The checksum is the sum of the "
              "character codes of DATA modulo 256, written as 2 uppercase hex digits; if it does not match return "
              "\"Error: Checksum mismatch\". Otherwise copy DATA into data and return data. main prints each result.",
        ref=r'''#include <stdio.h>
#include <string.h>

const char *parse_frame(const char *frame, char *data) {
    //<<
    char copy[256];
    char *parts[5];
    int bars = 0;
    for (const char *p = frame; *p; p++) {
        if (*p == '|') bars++;
    }
    if (bars != 4) return "Error: Invalid frame";
    strncpy(copy, frame, sizeof copy - 1);
    copy[sizeof copy - 1] = '\0';
    int count = 1;
    parts[0] = copy;
    for (char *p = copy; *p; p++) {
        if (*p == '|') {
            *p = '\0';
            parts[count++] = p + 1;
        }
    }
    if (strcmp(parts[0], "S") != 0 || strcmp(parts[4], "E") != 0) return "Error: Invalid frame";
    if (strlen(parts[1]) != 6) return "Error: Invalid MAC address";
    for (int i = 0; i < 6; i++) {
        if (!strchr("0123456789ABCDEF", parts[1][i])) return "Error: Invalid MAC address";
    }
    int sum = 0;
    for (const char *p = parts[2]; *p; p++) sum += (unsigned char) *p;
    char expected[3];
    sprintf(expected, "%02X", sum % 256);
    if (strcmp(expected, parts[3]) != 0) return "Error: Checksum mismatch";
    strcpy(data, parts[2]);
    return data;
    //>> data[0] = '\0'; return data;
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
'''),

    2881: dict(
        rules="implement relay_frame(frame, out) using even parity: a frame's parity must equal the number of '1' "
              "characters in its data, modulo 2. Write the frame's data into out when the parity is correct, or "
              "\"Error: Parity check failed for frame from <src> to <dst>\" when it is not. main relays each frame in "
              "order and prints one line per frame.",
        ref=r'''#include <stdio.h>
#include <string.h>

struct Frame {
    const char *src;
    const char *dst;
    const char *data;
    int parity;
};

void relay_frame(const struct Frame *frame, char *out) {
    //<<
    int ones = 0;
    for (const char *p = frame->data; *p; p++) {
        if (*p == '1') ones++;
    }
    if (ones % 2 == frame->parity) {
        strcpy(out, frame->data);
    } else {
        sprintf(out, "Error: Parity check failed for frame from %s to %s", frame->src, frame->dst);
    }
    //>> out[0] = '\0';
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
'''),

    2879: dict(
        rules="implement first_mismatch(sent, ns, received, nr, tolerance). Compare timestamps position by position; a "
              "position is out of sync when the absolute difference is greater than tolerance, or when one array has no "
              "value there. Return the first such index, or -1 when the streams are synchronized. main prints "
              "\"First mismatch at index <i>\" or \"Synchronized\".",
        ref=r'''#include <stdio.h>
#include <stdlib.h>

int first_mismatch(const int *sent, int ns, const int *received, int nr, int tolerance) {
    //<<
    int longest = ns > nr ? ns : nr;
    for (int i = 0; i < longest; i++) {
        if (i >= ns || i >= nr || abs(sent[i] - received[i]) > tolerance) return i;
    }
    return -1;
    //>> return -1;
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
'''),

    2464: dict(
        rules="implement intervals_consistent(bits, n), where bits is an array of {bit, timestamp} records in order. "
              "Return 1 if every gap between consecutive timestamps is the same (fewer than 3 records is always 1), "
              "otherwise 0. main prints true or false for each stream.",
        ref=r'''#include <stdio.h>

struct Bit {
    int bit;
    int timestamp;
};

int intervals_consistent(const struct Bit *bits, int n) {
    //<<
    if (n < 3) return 1;
    int gap = bits[1].timestamp - bits[0].timestamp;
    for (int i = 2; i < n; i++) {
        if (bits[i].timestamp - bits[i - 1].timestamp != gap) return 0;
    }
    return 1;
    //>> return 0;
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
'''),

    2450: dict(
        rules="implement check_shipment_code(code), using the global error log (error_log and error_count). A code of "
              "1 to 6 characters is valid: return \"Accepted\". Any other code (empty, or longer than 6 characters) "
              "appends \"Invalid shipment code: <code>\" to the log and returns \"Rejected\". main prints each result "
              "and then the log, one entry per line.",
        ref=r'''#include <stdio.h>
#include <string.h>

char error_log[16][64];
int error_count = 0;

const char *check_shipment_code(const char *code) {
    //<<
    size_t length = strlen(code);
    if (length >= 1 && length <= 6) return "Accepted";
    sprintf(error_log[error_count++], "Invalid shipment code: %s", code);
    return "Rejected";
    //>> return "";
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
'''),

    2452: dict(
        rules="implement summarize_sales(sales, n) returning a struct Summary with the total, the highest single-day "
              "sale and the average daily sale. For an empty array every field is 0. main prints "
              "\"total=<t> max=<m> average=<a>\" with the average to 2 decimal places.",
        ref=r'''#include <stdio.h>

struct Summary {
    int total;
    int max;
    double average;
};

struct Summary summarize_sales(const int *sales, int n) {
    //<<
    struct Summary s = {0, 0, 0.0};
    if (n == 0) return s;
    s.max = sales[0];
    for (int i = 0; i < n; i++) {
        s.total += sales[i];
        if (sales[i] > s.max) s.max = sales[i];
    }
    s.average = (double) s.total / n;
    return s;
    //>> struct Summary s = {0, 0, 0.0}; return s;
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
'''),

    3103: dict(
        rules="implement is_feasible(phases, n, total_resources). The plan is feasible when, on every day, the resources "
              "of all phases running that day (start and end days included) add up to no more than total_resources. "
              "Return 1 when feasible, 0 as soon as any day needs more. main prints feasible or not feasible.",
        ref=r'''#include <stdio.h>

struct Phase {
    int start;
    int end;
    int resources;
};

int is_feasible(const struct Phase *phases, int n, int total_resources) {
    //<<
    if (n == 0) return 1;
    int first = phases[0].start, last = phases[0].end;
    for (int i = 1; i < n; i++) {
        if (phases[i].start < first) first = phases[i].start;
        if (phases[i].end > last) last = phases[i].end;
    }
    for (int day = first; day <= last; day++) {
        int used = 0;
        for (int i = 0; i < n; i++) {
            if (phases[i].start <= day && day <= phases[i].end) used += phases[i].resources;
        }
        if (used > total_resources) return 0;
    }
    return 1;
    //>> return 0;
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
'''),

    3106: dict(
        rules="implement waterfall_schedule(phases, n, slots), where phases is an array of {name, days}. Work starts "
              "on day 1 and each phase begins the day after the previous one ends; a phase of 0 days or fewer is "
              "skipped. Fill slots with {name, start, end} and return how many there are. main prints one line per "
              "slot as \"<name>: day <start> to day <end>\".",
        ref=r'''#include <stdio.h>

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
    //<<
    int count = 0;
    int day = 1;
    for (int i = 0; i < n; i++) {
        if (phases[i].days <= 0) continue;
        slots[count].name = phases[i].name;
        slots[count].start = day;
        slots[count].end = day + phases[i].days - 1;
        day += phases[i].days;
        count++;
    }
    return count;
    //>> return 0;
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
'''),

    2880: dict(
        rules="implement cable_suitable(cable_type, length_m, data_rate_mbps) returning 1 when the cable can carry the "
              "data rate over that length, otherwise 0, using these limits: \"Cat5e\" supports up to 1000 Mbps within "
              "100 m; \"Cat6\" up to 10000 Mbps within 55 m, or up to 1000 Mbps within 100 m; \"Single-mode fiber\" up "
              "to 10000 Mbps within 10000 m. Any other cable type is not suitable. main prints Suitable or Not Suitable "
              "for each case.",
        ref=r'''#include <stdio.h>
#include <string.h>

int cable_suitable(const char *cable_type, int length_m, int data_rate_mbps) {
    //<<
    if (strcmp(cable_type, "Cat5e") == 0) {
        return data_rate_mbps <= 1000 && length_m <= 100;
    }
    if (strcmp(cable_type, "Cat6") == 0) {
        return (data_rate_mbps <= 10000 && length_m <= 55) || (data_rate_mbps <= 1000 && length_m <= 100);
    }
    if (strcmp(cable_type, "Single-mode fiber") == 0) {
        return data_rate_mbps <= 10000 && length_m <= 10000;
    }
    return 0;
    //>> return 0;
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
'''),

    23572: dict(
        rules="implement pack(cpu, value, n, capacity, best, min_cpu): set *best to the maximum total value of jobs whose "
              "CPU fits in the capacity (each job all or nothing) and *min_cpu to the smallest total CPU among the "
              "selections that achieve it. main prints \"BEST MIN_CPU\".",
        ref=r'''#include <stdio.h>

''' + LCG + r'''
void pack(const int *cpu, const int *value, int n, int capacity, int *best, int *min_cpu) {
    //<<
    static int dp[100001];
    for (int c = 0; c <= capacity; c++) dp[c] = -1;
    dp[0] = 0;
    for (int i = 0; i < n; i++) {
        for (int c = capacity; c >= cpu[i]; c--) {
            if (dp[c - cpu[i]] >= 0 && dp[c - cpu[i]] + value[i] > dp[c]) dp[c] = dp[c - cpu[i]] + value[i];
        }
    }
    *best = 0;
    *min_cpu = 0;
    for (int c = 0; c <= capacity; c++) {
        if (dp[c] > *best) {
            *best = dp[c];
            *min_cpu = c;
        }
    }
    //>> *best = 0; *min_cpu = 0;
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
'''),

    23573: dict(
        rules="implement trend(samples, n, strict, non_decreasing): set *strict to the length of the longest strictly "
              "increasing subsequence and *non_decreasing to the length of the longest non-decreasing subsequence "
              "(elements need not be contiguous). main prints both on one line.",
        ref=r'''#include <stdio.h>
#include <stdlib.h>

''' + LCG + r'''
void trend(const int *samples, int n, int *strict, int *non_decreasing) {
    //<<
    int *tails = malloc(sizeof(int) * (n + 1));
    int length = 0;
    for (int i = 0; i < n; i++) {
        int lo = 0, hi = length;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (tails[mid] < samples[i]) lo = mid + 1; else hi = mid;
        }
        tails[lo] = samples[i];
        if (lo == length) length++;
    }
    *strict = length;
    length = 0;
    for (int i = 0; i < n; i++) {
        int lo = 0, hi = length;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (tails[mid] <= samples[i]) lo = mid + 1; else hi = mid;
        }
        tails[lo] = samples[i];
        if (lo == length) length++;
    }
    *non_decreasing = length;
    free(tails);
    //>> *strict = 0; *non_decreasing = 0;
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
'''),
}

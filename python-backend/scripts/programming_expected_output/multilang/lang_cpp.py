"""C++ versions (Judge0: GCC 9, C++14 -- no structured bindings). Learner parts between //<< and //>> stub."""

LCG = '''// Deterministic generator used to build the input. Do not change it.
static unsigned long long lcg_state;
static unsigned long long next_rand() {
    lcg_state = (lcg_state * 1103515245ULL + 12345ULL) % 2147483648ULL;
    return lcg_state;
}
'''

QUESTIONS = {
    2344: dict(
        rules="complete summarizeTestReport(lines), where each line looks like 'LoginTest: PASS'. Count only lines whose "
              "status (the text after the last ':', trimmed) is PASS, FAIL or SKIP; ignore every other line, including "
              "blank ones. Return \"Total: <n>, PASS: <p>, FAIL: <f>, SKIP: <s>\".",
        ref='''#include <iostream>
#include <string>
#include <vector>
using namespace std;

string summarizeTestReport(const vector<string>& lines) {
    //<<
    int pass = 0, fail = 0, skip = 0;
    for (const string& line : lines) {
        size_t colon = line.rfind(':');
        if (colon == string::npos) continue;
        string status = line.substr(colon + 1);
        size_t a = status.find_first_not_of(" \\t");
        size_t b = status.find_last_not_of(" \\t");
        status = a == string::npos ? "" : status.substr(a, b - a + 1);
        if (status == "PASS") pass++;
        else if (status == "FAIL") fail++;
        else if (status == "SKIP") skip++;
    }
    return "Total: " + to_string(pass + fail + skip) + ", PASS: " + to_string(pass) + ", FAIL: " + to_string(fail)
        + ", SKIP: " + to_string(skip);
    //>> return "";
}

int main() {
    cout << summarizeTestReport({"LoginTest: PASS", "SignupTest: FAIL", "ProfileTest: SKIP", "BrokenLine", "",
                                 "CheckoutTest: PASS", "Search: Edge: FAIL", "CartTest: PENDING"}) << endl;
    cout << summarizeTestReport({}) << endl;
    return 0;
}
'''),

    2701: dict(
        rules="complete overdueDevices(reports, now). Each report is 'device_id,timestamp,status' (timestamps in seconds, "
              "not in order) and now is the current timestamp. A device is overdue when now minus its latest report "
              "timestamp is more than 900 seconds (15 minutes). Return the overdue device ids sorted alphabetically; "
              "main prints them space-separated, or \"none\".",
        ref='''#include <iostream>
#include <map>
#include <string>
#include <vector>
using namespace std;

vector<string> overdueDevices(const vector<string>& reports, long long now) {
    //<<
    map<string, long long> latest;
    for (const string& report : reports) {
        size_t first = report.find(',');
        size_t second = report.find(',', first + 1);
        string device = report.substr(0, first);
        long long timestamp = stoll(report.substr(first + 1, second - first - 1));
        if (!latest.count(device) || timestamp > latest[device]) latest[device] = timestamp;
    }
    vector<string> overdue;
    for (const auto& entry : latest) {
        if (now - entry.second > 900) overdue.push_back(entry.first);
    }
    return overdue;
    //>> return {};
}

int main() {
    vector<string> overdue = overdueDevices({"A,1650000000,OK", "B,1650000600,OK", "A,1650001200,OK",
                                             "C,1650001200,FAIL", "D,1650001199,OK"}, 1650002100LL);
    if (overdue.empty()) cout << "none";
    for (size_t i = 0; i < overdue.size(); i++) cout << (i ? " " : "") << overdue[i];
    cout << endl;
    return 0;
}
'''),

    2757: dict(
        rules="complete afterHoursUsers(log). Each line is 'timestamp,user_id,resource,action' with a timestamp like "
              "'2024-05-10T08:32:00Z'. An access is outside business hours when its time is before 08:00 or after 18:00 "
              "(18:00:00 exactly is inside). Ignore lines that do not have 4 fields or a valid timestamp "
              "(YYYY-MM-DDTHH:MM:SSZ with real ranges). Return the users with at least one out-of-hours access, sorted "
              "alphabetically without duplicates.",
        ref='''#include <cctype>
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
    //<<
    set<string> users;
    stringstream lines(log);
    string line;
    while (getline(lines, line)) {
        vector<string> fields;
        stringstream parts(line);
        string field;
        while (getline(parts, field, ',')) fields.push_back(field);
        if (fields.size() != 4) continue;
        const string& t = fields[0];
        if (t.size() != 20 || t[4] != '-' || t[7] != '-' || t[10] != 'T' || t[13] != ':' || t[16] != ':'
            || t[19] != 'Z' || !digits(t, 0, 4) || !digits(t, 5, 2) || !digits(t, 8, 2) || !digits(t, 11, 2)
            || !digits(t, 14, 2) || !digits(t, 17, 2)) continue;
        int month = stoi(t.substr(5, 2)), day = stoi(t.substr(8, 2));
        int hour = stoi(t.substr(11, 2)), minute = stoi(t.substr(14, 2)), second = stoi(t.substr(17, 2));
        if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) continue;
        int seconds = hour * 3600 + minute * 60 + second;
        if (seconds < 8 * 3600 || seconds > 18 * 3600) users.insert(fields[1]);
    }
    return vector<string>(users.begin(), users.end());
    //>> return {};
}

int main() {
    string log = "2024-05-10T07:59:00Z,bob,server01,login\\n2024-05-10T09:00:00Z,alice,server01,login\\n"
                 "2024-05-10T18:30:00Z,charlie,db01,read\\n2024-05-10T18:00:00Z,alice,db01,logout\\n"
                 "not-a-time,mallory,db01,read\\n2024-05-10T23:10:00Z,bob,vpn,login\\n"
                 "2024-05-10T08:00:00Z,dave,server01,login\\n2024-05-10T25:00:00Z,eve,db01,read\\n"
                 "2024-05-10T18:00:01Z,frank,db01,read\\nbroken line";
    vector<string> users = afterHoursUsers(log);
    for (size_t i = 0; i < users.size(); i++) cout << (i ? " " : "") << users[i];
    cout << endl;
    return 0;
}
'''),

    2755: dict(
        rules="complete summarizeAssets(csv), where csv holds rows 'name,type,criticality' separated by newlines. A row "
              "counts only if it has exactly 3 fields and none is empty after trimming; other rows are skipped. Return "
              "one line '<type>: <count>' per asset type in alphabetical order, followed by 'High criticality: <count>'.",
        ref='''#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

static string trim(const string& s) {
    size_t a = s.find_first_not_of(" \\t");
    if (a == string::npos) return "";
    size_t b = s.find_last_not_of(" \\t");
    return s.substr(a, b - a + 1);
}

string summarizeAssets(const string& csv) {
    //<<
    map<string, int> counts;
    int high = 0;
    stringstream rows(csv);
    string row;
    while (getline(rows, row)) {
        vector<string> fields;
        size_t start = 0;
        while (true) {
            size_t comma = row.find(',', start);
            fields.push_back(trim(row.substr(start, comma == string::npos ? string::npos : comma - start)));
            if (comma == string::npos) break;
            start = comma + 1;
        }
        if (fields.size() != 3 || fields[0].empty() || fields[1].empty() || fields[2].empty()) continue;
        counts[fields[1]]++;
        if (fields[2] == "High") high++;
    }
    string out;
    for (const auto& entry : counts) out += entry.first + ": " + to_string(entry.second) + "\\n";
    return out + "High criticality: " + to_string(high);
    //>> return "";
}

int main() {
    cout << summarizeAssets("Server,Hardware,High\\nDatabase,Software,Medium\\n,Hardware,Low\\nRouter,Hardware,High\\n"
                            "Laptop,Hardware\\nCRM, Software ,High\\nVPN,Network,Low,extra\\nFirewall,Network,High")
         << endl;
    return 0;
}
'''),

    2759: dict(
        rules="complete missingControls(required, implemented), where both lists may contain duplicates. Return the "
              "required controls that are not implemented, without duplicates, in the order they first appear in "
              "required; main prints them space-separated, or \"none\".",
        ref='''#include <algorithm>
#include <iostream>
#include <set>
#include <string>
#include <vector>
using namespace std;

vector<string> missingControls(const vector<string>& required, const vector<string>& implemented) {
    //<<
    set<string> done(implemented.begin(), implemented.end());
    vector<string> missing;
    for (const string& control : required) {
        if (!done.count(control) && find(missing.begin(), missing.end(), control) == missing.end()) {
            missing.push_back(control);
        }
    }
    return missing;
    //>> return {};
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
'''),

    2895: dict(
        rules="complete parseInventory(text). Each line holds 'name:value'. Skip blank lines and lines without exactly "
              "one ':' or without an integer value. Return the assets in input order; main prints them as "
              "'<name>=<value>' and then the names whose value is above 100000.",
        ref='''#include <cctype>
#include <iostream>
#include <sstream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

vector<pair<string, long long>> parseInventory(const string& text) {
    //<<
    vector<pair<string, long long>> assets;
    stringstream lines(text);
    string line;
    while (getline(lines, line)) {
        size_t colon = line.find(':');
        if (colon == string::npos || line.find(':', colon + 1) != string::npos) continue;
        string name = line.substr(0, colon), value = line.substr(colon + 1);
        bool numeric = !value.empty();
        for (size_t i = 0; i < value.size(); i++) {
            if (!isdigit((unsigned char) value[i]) && !(i == 0 && value[i] == '-' && value.size() > 1)) numeric = false;
        }
        if (name.empty() || !numeric) continue;
        assets.push_back(make_pair(name, stoll(value)));
    }
    return assets;
    //>> return {};
}

int main() {
    vector<pair<string, long long>> assets = parseInventory(
        "CustomerDB:120000\\nHRRecords:90000\\n\\nWebServer:500000\\nBackupNAS:100000\\nBroken line\\nLaptops:abc\\nMail:server:5");
    string high;
    for (const auto& asset : assets) {
        cout << asset.first << "=" << asset.second << endl;
        if (asset.second > 100000) high += (high.empty() ? "" : " ") + asset.first;
    }
    cout << "High value: " << (high.empty() ? "none" : high) << endl;
    return 0;
}
'''),

    3184: dict(
        rules="complete uniqueRequirements(document), where document is a list of (category, requirements) pairs. "
              "Return every requirement once, in the order it first appears going through the categories in order.",
        ref='''#include <algorithm>
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

typedef vector<pair<string, vector<string>>> Document;

vector<string> uniqueRequirements(const Document& document) {
    //<<
    vector<string> seen;
    for (const auto& category : document) {
        for (const string& requirement : category.second) {
            if (find(seen.begin(), seen.end(), requirement) == seen.end()) seen.push_back(requirement);
        }
    }
    return seen;
    //>> return {};
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
'''),

    3185: dict(
        rules="complete requiredDocuments(documentTypes, phase) using this mapping: 'Requirements' -> Requirements "
              "Documents; 'Design' -> Design and Specification Documents; 'Development' -> Design and Specification "
              "Documents, Reference Documentation; 'Deployment' -> Process and Procedure Documents, User-Facing "
              "Documentation. Return the document types from the input that belong to the phase, in input order; an "
              "unknown phase gives an empty list.",
        ref='''#include <iostream>
#include <map>
#include <string>
#include <vector>
using namespace std;

vector<string> requiredDocuments(const vector<string>& documentTypes, const string& phase) {
    //<<
    map<string, vector<string>> mapping = {
        {"Requirements", {"Requirements Documents"}},
        {"Design", {"Design and Specification Documents"}},
        {"Development", {"Design and Specification Documents", "Reference Documentation"}},
        {"Deployment", {"Process and Procedure Documents", "User-Facing Documentation"}},
    };
    vector<string> result;
    auto wanted = mapping.find(phase);
    if (wanted == mapping.end()) return result;
    for (const string& doc : documentTypes) {
        for (const string& w : wanted->second) {
            if (doc == w) { result.push_back(doc); break; }
        }
    }
    return result;
    //>> return {};
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
'''),

    2534: dict(
        rules="complete dailyAverageTemperatures(readings), where each reading is an ISO timestamp such as "
              "'2024-05-01T10:00:00' and a value. Return each date ('2024-05-01'), in order of first appearance, with "
              "its average value; main prints the averages to 2 decimal places.",
        ref='''#include <cstdio>
#include <string>
#include <utility>
#include <vector>
using namespace std;

vector<pair<string, double>> dailyAverageTemperatures(const vector<pair<string, double>>& readings) {
    //<<
    vector<string> days;
    vector<double> sums;
    vector<int> counts;
    for (const auto& reading : readings) {
        string day = reading.first.substr(0, 10);
        size_t i = 0;
        while (i < days.size() && days[i] != day) i++;
        if (i == days.size()) {
            days.push_back(day);
            sums.push_back(0);
            counts.push_back(0);
        }
        sums[i] += reading.second;
        counts[i]++;
    }
    vector<pair<string, double>> result;
    for (size_t i = 0; i < days.size(); i++) result.push_back(make_pair(days[i], sums[i] / counts[i]));
    return result;
    //>> return {};
}

int main() {
    vector<pair<string, double>> readings = {
        {"2024-05-01T10:00:00", 20.0}, {"2024-05-01T14:00:00", 22.5}, {"2024-05-02T10:00:00", 18.0},
        {"2024-05-01T20:00:00", 19.0}, {"2024-05-02T15:00:00", 21.1}, {"2024-05-03T09:00:00", -1.5}};
    for (const auto& day : dailyAverageTemperatures(readings)) printf("%s %.2f\\n", day.first.c_str(), day.second);
    printf("days without readings: %d\\n", (int) dailyAverageTemperatures({}).size());
    return 0;
}
'''),

    23259: dict(
        rules="complete route(n, links), where each link is {a, b, latency} and links are bidirectional. Return two "
              "lines: the minimum total latency from router 0 to each of routers 55, 56, 57, 58 and 59, space-separated "
              "(-1 for an unreachable router); then how many routers (including router 0) are reachable from router 0 "
              "within a total latency of at most 40 ms.",
        ref='''#include <functional>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

''' + LCG + '''
struct Link { int a, b, latency; };

string route(int n, const vector<Link>& links) {
    //<<
    vector<vector<pair<int, int>>> adj(n);
    for (const Link& l : links) {
        adj[l.a].push_back(make_pair(l.b, l.latency));
        adj[l.b].push_back(make_pair(l.a, l.latency));
    }
    const int INF = 1 << 30;
    vector<int> dist(n, INF);
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
    dist[0] = 0;
    pq.push(make_pair(0, 0));
    while (!pq.empty()) {
        pair<int, int> top = pq.top();
        pq.pop();
        if (top.first > dist[top.second]) continue;
        for (const auto& edge : adj[top.second]) {
            if (top.first + edge.second < dist[edge.first]) {
                dist[edge.first] = top.first + edge.second;
                pq.push(make_pair(dist[edge.first], edge.first));
            }
        }
    }
    string first;
    for (int r = 55; r <= 59; r++) first += (r > 55 ? " " : "") + to_string(dist[r] == INF ? -1 : dist[r]);
    int within = 0;
    for (int d : dist) if (d <= 40) within++;
    return first + "\\n" + to_string(within);
    //>> return "";
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
'''),

    23574: dict(
        rules="complete backbone(buildings), where buildings are (x, y) points and linking two costs their Manhattan "
              "distance. Return \"TOTAL LONGEST\": the minimum total cost to connect every building (directly or "
              "indirectly) and the length of the single longest link in such a minimum network.",
        ref='''#include <cstdlib>
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

''' + LCG + '''
string backbone(const vector<pair<int, int>>& buildings) {
    //<<
    int n = (int) buildings.size();
    const long long INF = 1LL << 60;
    vector<long long> best(n, INF);
    vector<bool> used(n, false);
    best[0] = 0;
    long long total = 0, longest = 0;
    for (int step = 0; step < n; step++) {
        int u = -1;
        for (int i = 0; i < n; i++) if (!used[i] && (u < 0 || best[i] < best[u])) u = i;
        used[u] = true;
        total += best[u];
        if (best[u] > longest) longest = best[u];
        for (int v = 0; v < n; v++) {
            if (used[v]) continue;
            long long d = abs(buildings[u].first - buildings[v].first) + abs(buildings[u].second - buildings[v].second);
            if (d < best[v]) best[v] = d;
        }
    }
    return to_string(total) + " " + to_string(longest);
    //>> return "";
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
'''),

    23576: dict(
        rules="complete bandwidth(n, links, s, t), where each link is a directed {u, v, capacity} and parallel links add "
              "their capacities. Return \"FLOW CUT\": the maximum throughput from s to t, and the number of directed links "
              "that cross a minimum cut -- links from the source side to the sink side of the residual graph after the "
              "maximum flow (count parallel links individually). Expected: Edmonds-Karp.",
        ref='''#include <algorithm>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

''' + LCG + '''
struct Link { int u, v, capacity; };

string bandwidth(int n, const vector<Link>& links, int s, int t) {
    //<<
    vector<vector<int>> cap(n, vector<int>(n, 0));
    for (const Link& l : links) cap[l.u][l.v] += l.capacity;
    int flow = 0;
    while (true) {
        vector<int> parent(n, -1);
        parent[s] = s;
        queue<int> q;
        q.push(s);
        while (!q.empty() && parent[t] < 0) {
            int u = q.front();
            q.pop();
            for (int v = 0; v < n; v++) {
                if (parent[v] < 0 && cap[u][v] > 0) {
                    parent[v] = u;
                    q.push(v);
                }
            }
        }
        if (parent[t] < 0) break;
        int push = 1 << 30;
        for (int v = t; v != s; v = parent[v]) push = min(push, cap[parent[v]][v]);
        for (int v = t; v != s; v = parent[v]) {
            cap[parent[v]][v] -= push;
            cap[v][parent[v]] += push;
        }
        flow += push;
    }
    vector<bool> source(n, false);
    queue<int> q;
    q.push(s);
    source[s] = true;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v = 0; v < n; v++) {
            if (!source[v] && cap[u][v] > 0) {
                source[v] = true;
                q.push(v);
            }
        }
    }
    int cut = 0;
    for (const Link& l : links) if (source[l.u] && !source[l.v]) cut++;
    return to_string(flow) + " " + to_string(cut);
    //>> return "";
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
'''),
}

"""C# versions (Judge0: Mono -- stay at C# 5: no $"" strings, no tuples, no expression-bodied members)."""

QUESTIONS = {
    2468: dict(
        rules="complete Authenticate(user, password, validCredentials, log). validCredentials maps users to passwords. "
              "Add \"<user>: Success\" or \"<user>: Failed\" to log and return \"Success\" or \"Failed\".",
        ref='''using System;
using System.Collections.Generic;

class Program
{
    static string Authenticate(string user, string password, Dictionary<string, string> validCredentials,
                               List<string> log)
    {
        //<<
        string stored;
        string result = validCredentials.TryGetValue(user, out stored) && stored == password ? "Success" : "Failed";
        log.Add(user + ": " + result);
        return result;
        //>> return "";
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
'''),

    2495: dict(
        rules="complete AcceptedUsernames(attempts, existingUsernames), where each attempt has a Username and a "
              "Password. Trim spaces from each username first. Accept an attempt only if the username is not empty, is "
              "not in existingUsernames, has not already been accepted earlier in the list, and the password is at "
              "least 8 characters long and contains at least one digit. Return the accepted (trimmed) usernames in "
              "order; main prints them separated by \", \" (or \"(none)\").",
        ref='''using System;
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
        //<<
        var taken = new HashSet<string>(existingUsernames);
        var accepted = new List<string>();
        foreach (var attempt in attempts)
        {
            string name = attempt.Username.Trim();
            string password = attempt.Password;
            if (name.Length > 0 && !taken.Contains(name) && password.Length >= 8 && password.Any(char.IsDigit))
            {
                accepted.Add(name);
                taken.Add(name);
            }
        }
        return accepted;
        //>> return new List<string>();
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
'''),

    2497: dict(
        rules="complete BookSeat(user, seat, bookings). If the user is logged in and the seat is available, add the "
              "booking \"<user name> -> <seat code>\" to bookings and mark the seat unavailable. Return true when a "
              "booking was made, otherwise false. main prints each result and then the bookings.",
        ref='''using System;
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
        //<<
        if (!user.IsLoggedIn || !seat.IsAvailable) return false;
        bookings.Add(user.Name + " -> " + seat.Code);
        seat.IsAvailable = false;
        return true;
        //>> return false;
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
'''),

    2581: dict(
        rules="complete RegisterDevice(deviceId, deviceType). Keep the static Registry, which maps each URI to its "
              "resource description \"<node|device> <deviceId> <deviceType>\". Register both '/CSEBase/node/<deviceId>' "
              "and '/CSEBase/device/<deviceId>' and return \"<nodeUri> <deviceUri>\". Registering a deviceId that is "
              "already registered returns \"Error: <deviceId> already registered\" and changes nothing.",
        ref='''using System;
using System.Collections.Generic;

class Program
{
    static Dictionary<string, string> Registry = new Dictionary<string, string>();

    static string RegisterDevice(string deviceId, string deviceType)
    {
        //<<
        string nodeUri = "/CSEBase/node/" + deviceId;
        string deviceUri = "/CSEBase/device/" + deviceId;
        if (Registry.ContainsKey(nodeUri)) return "Error: " + deviceId + " already registered";
        Registry[nodeUri] = "node " + deviceId + " " + deviceType;
        Registry[deviceUri] = "device " + deviceId + " " + deviceType;
        return nodeUri + " " + deviceUri;
        //>> return "";
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
'''),

    2704: dict(
        rules="complete RegisterDevices(requests), where each request is a device id and a device type. Return the "
              "accepted registrations in order as \"<id> (<type>)\", ignoring any request whose device id was already "
              "registered.",
        ref='''using System;
using System.Collections.Generic;

class Program
{
    static List<string> RegisterDevices(List<string[]> requests)
    {
        //<<
        var seen = new HashSet<string>();
        var accepted = new List<string>();
        foreach (var r in requests)
        {
            if (seen.Add(r[0])) accepted.Add(r[0] + " (" + r[1] + ")");
        }
        return accepted;
        //>> return new List<string>();
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
'''),

    2558: dict(
        rules="complete SummarizeEr(entities, relationships). Return, for every entity in the order given, its list "
              "of connections \"<other entity> (<relationship type>)\". Each relationship {Entity1, Entity2, Type} is "
              "added to both entities, in relationship order; an entity with none has an empty list. main prints one "
              "line per entity.",
        ref='''using System;
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
        //<<
        var summary = new Dictionary<string, List<string>>();
        foreach (string e in entities) summary[e] = new List<string>();
        foreach (var r in relationships)
        {
            if (summary.ContainsKey(r.Entity1)) summary[r.Entity1].Add(r.Entity2 + " (" + r.Type + ")");
            if (summary.ContainsKey(r.Entity2)) summary[r.Entity2].Add(r.Entity1 + " (" + r.Type + ")");
        }
        return summary;
        //>> return new Dictionary<string, List<string>>();
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
'''),

    2556: dict(
        rules="complete GroupFeedback(entries), where each entry has a Stakeholder, a Feedback text and a Priority. "
              "Return, for each stakeholder in order of first appearance, their feedback texts ordered by priority from "
              "highest to lowest (equal priorities keep their input order). main prints one line per stakeholder.",
        ref='''using System;
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
        //<<
        var order = new List<string>();
        var groups = new Dictionary<string, List<Entry>>();
        foreach (var e in entries)
        {
            if (!groups.ContainsKey(e.Stakeholder))
            {
                groups[e.Stakeholder] = new List<Entry>();
                order.Add(e.Stakeholder);
            }
            groups[e.Stakeholder].Add(e);
        }
        var result = new List<KeyValuePair<string, List<string>>>();
        foreach (string name in order)
        {
            var texts = groups[name].OrderByDescending(e => e.Priority).Select(e => e.Feedback).ToList();
            result.Add(new KeyValuePair<string, List<string>>(name, texts));
        }
        return result;
        //>> return new List<KeyValuePair<string, List<string>>>();
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
'''),

    2936: dict(
        rules="complete SelectProjects(projects, availablePersonnel, availableBudget). Consider projects from the highest "
              "business value per budget unit (BusinessValue / Budget) to the lowest, ties in input order, and select "
              "each one that still fits in the remaining personnel and budget. Return the selected projects in "
              "selection order; main prints their names and the total business value.",
        ref='''using System;
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
        //<<
        var chosen = new List<Project>();
        foreach (var p in projects.OrderByDescending(p => (double) p.BusinessValue / p.Budget))
        {
            if (p.Personnel <= availablePersonnel && p.Budget <= availableBudget)
            {
                chosen.Add(p);
                availablePersonnel -= p.Personnel;
                availableBudget -= p.Budget;
            }
        }
        return chosen;
        //>> return new List<Project>();
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
'''),

    3133: dict(
        rules="complete MissingSrsFields(srs), where srs maps section names to their text. Return the sections among "
              "'purpose', 'scope', 'stakeholders', 'features' and 'performance' (in that order) that are missing or "
              "empty. main prints \"Valid\" when none are, otherwise \"Missing: \" and the list.",
        ref='''using System;
using System.Collections.Generic;

class Program
{
    static List<string> MissingSrsFields(Dictionary<string, string> srs)
    {
        //<<
        var missing = new List<string>();
        foreach (string key in new[] { "purpose", "scope", "stakeholders", "features", "performance" })
        {
            string value;
            if (!srs.TryGetValue(key, out value) || string.IsNullOrWhiteSpace(value)) missing.Add(key);
        }
        return missing;
        //>> return null;
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
'''),

    3066: dict(
        rules="complete MissingSections(document), where document maps section keys to their items. Return the required "
              "keys not present in the document, in this order: 'functional_requirements', 'interface_requirements', "
              "'user_attributes', 'product_features', 'design_constraints' (a present but empty section counts as "
              "present).",
        ref='''using System;
using System.Collections.Generic;

class Program
{
    static List<string> MissingSections(Dictionary<string, List<string>> document)
    {
        //<<
        var missing = new List<string>();
        foreach (string key in new[] { "functional_requirements", "interface_requirements", "user_attributes",
                                       "product_features", "design_constraints" })
        {
            if (!document.ContainsKey(key)) missing.Add(key);
        }
        return missing;
        //>> return null;
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
'''),

    3157: dict(
        rules="complete MissingCategories(document), where document maps category names to their items. Return the "
              "categories not present as keys, in this order: 'Functional', 'Interface', 'User Attributes', 'Product "
              "Features', 'Design Constraints'. Names must match exactly.",
        ref='''using System;
using System.Collections.Generic;

class Program
{
    static List<string> MissingCategories(Dictionary<string, List<string>> document)
    {
        //<<
        var missing = new List<string>();
        foreach (string category in new[] { "Functional", "Interface", "User Attributes", "Product Features",
                                            "Design Constraints" })
        {
            if (!document.ContainsKey(category)) missing.Add(category);
        }
        return missing;
        //>> return null;
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
'''),

    23575: dict(
        rules="complete Banker(available, allocation, maximum, pid, request), returning two lines: (1) for the current "
              "state, \"SAFE\" followed by the safe sequence (when several processes can run, always pick the "
              "lowest-numbered one), or \"UNSAFE\" followed by the processes that can never finish; (2) for the request "
              "from process pid, \"GRANT\" if it is within the process's remaining need and the available resources and "
              "the state after granting it is safe, otherwise \"DENY\".",
        ref='''using System;
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
        //<<
        string current = SafetyCheck(available, allocation, maximum);
        int kinds = available.Length;
        bool ok = true;
        for (int k = 0; k < kinds; k++)
        {
            if (request[k] > maximum[pid][k] - allocation[pid][k] || request[k] > available[k]) ok = false;
        }
        if (ok)
        {
            int[] avail = (int[]) available.Clone();
            int[][] alloc = new int[allocation.Length][];
            for (int p = 0; p < allocation.Length; p++) alloc[p] = (int[]) allocation[p].Clone();
            for (int k = 0; k < kinds; k++)
            {
                avail[k] -= request[k];
                alloc[pid][k] += request[k];
            }
            ok = SafetyCheck(avail, alloc, maximum).StartsWith("SAFE");
        }
        return current + "\\n" + (ok ? "GRANT" : "DENY");
        //>> return "";
    }

    static string SafetyCheck(int[] available, int[][] allocation, int[][] maximum)
    {
        //<<
        int procs = allocation.Length, kinds = available.Length;
        int[] work = (int[]) available.Clone();
        bool[] done = new bool[procs];
        var sequence = new List<string>();
        bool progress = true;
        while (progress)
        {
            progress = false;
            for (int p = 0; p < procs; p++)
            {
                if (done[p]) continue;
                bool canRun = true;
                for (int k = 0; k < kinds; k++)
                {
                    if (maximum[p][k] - allocation[p][k] > work[k]) canRun = false;
                }
                if (!canRun) continue;
                for (int k = 0; k < kinds; k++) work[k] += allocation[p][k];
                done[p] = true;
                sequence.Add(p.ToString());
                progress = true;
                break;
            }
        }
        if (sequence.Count == procs) return "SAFE " + string.Join(" ", sequence);
        var stuck = new List<string>();
        for (int p = 0; p < procs; p++) if (!done[p]) stuck.Add(p.ToString());
        return "UNSAFE " + string.Join(" ", stuck);
        //>> return "";
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
'''),
}

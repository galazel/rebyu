"""Java versions (Judge0: OpenJDK 13, the class must be Main). Learner parts sit between //<< and //>> stub."""

LCG = '''    // Deterministic generator used to build the input. Do not change it.
    static long state;

    static long next() {
        state = (state * 1103515245L + 12345L) % 2147483648L;
        return state;
    }
'''

QUESTIONS = {
    2241: dict(
        rules="complete class BankAccount, which keeps its balance in a private field. deposit(amount) adds a positive "
              "amount and returns the new balance (a zero or negative amount changes nothing). withdraw(amount) "
              "subtracts the amount and returns true when the balance covers it; otherwise it leaves the balance "
              "unchanged and returns false. getBalance() returns the balance.",
        ref='''public class Main {
    static class BankAccount {
        private int balance;

        BankAccount(int initialBalance) {
            //<<
            balance = initialBalance;
            //>>
        }

        int deposit(int amount) {
            //<<
            if (amount > 0) {
                balance += amount;
            }
            return balance;
            //>> return 0;
        }

        boolean withdraw(int amount) {
            //<<
            if (amount > balance) {
                return false;
            }
            balance -= amount;
            return true;
            //>> return false;
        }

        int getBalance() {
            //<<
            return balance;
            //>> return 0;
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
'''),

    2291: dict(
        rules="complete class Requirement(id, description). The initial description is version 1; "
              "updateDescription(text) records the next version; getCurrentDescription() returns the latest "
              "description; getHistory() returns the versions oldest first, each as \"v<number>: <description>\".",
        ref='''import java.util.ArrayList;
import java.util.List;

public class Main {
    static class Requirement {
        private final String id;
        private final List<String> history = new ArrayList<>();

        Requirement(String id, String description) {
            this.id = id;
            //<<
            history.add(description);
            //>>
        }

        void updateDescription(String text) {
            //<<
            history.add(text);
            //>>
        }

        String getCurrentDescription() {
            //<<
            return history.get(history.size() - 1);
            //>> return "";
        }

        List<String> getHistory() {
            //<<
            List<String> versions = new ArrayList<>();
            for (int i = 0; i < history.size(); i++) {
                versions.add("v" + (i + 1) + ": " + history.get(i));
            }
            return versions;
            //>> return new ArrayList<>();
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
'''),

    2466: dict(
        rules="complete class SessionManager(passwords), where passwords maps user IDs to passwords. "
              "establishSession(userId) returns \"Session established for <userId>.\", or \"Previous session "
              "terminated. Session established for <userId>.\" if that user already had an active session. "
              "authenticate(userId, password) returns \"Authentication successful.\" when the user has an active "
              "session and the password matches, otherwise \"Authentication failed.\". terminateSession(userId) "
              "returns \"Session terminated for <userId>.\" or \"No active session for <userId>.\".",
        ref='''import java.util.HashMap;
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
            //<<
            if (!active.add(userId)) {
                return "Previous session terminated. Session established for " + userId + ".";
            }
            return "Session established for " + userId + ".";
            //>> return "";
        }

        String authenticate(String userId, String password) {
            //<<
            if (active.contains(userId) && password.equals(passwords.get(userId))) {
                return "Authentication successful.";
            }
            return "Authentication failed.";
            //>> return "";
        }

        String terminateSession(String userId) {
            //<<
            if (active.remove(userId)) {
                return "Session terminated for " + userId + ".";
            }
            return "No active session for " + userId + ".";
            //>> return "";
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
'''),

    2856: dict(
        rules="complete class M2MService with register(deviceId); send(sender, receiver, message), which returns "
              "\"Error: Sender not registered\" or \"Error: Receiver not registered\" (checking the sender first) or, "
              "when both are registered, records the message and returns \"Delivered\"; and getLog(), which returns "
              "the delivered messages in order, each as \"<sender> -> <receiver>: <message>\".",
        ref='''import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class Main {
    static class M2MService {
        private final Set<String> devices = new HashSet<>();
        private final List<String> log = new ArrayList<>();

        void register(String deviceId) {
            //<<
            devices.add(deviceId);
            //>>
        }

        String send(String sender, String receiver, String message) {
            //<<
            if (!devices.contains(sender)) {
                return "Error: Sender not registered";
            }
            if (!devices.contains(receiver)) {
                return "Error: Receiver not registered";
            }
            log.add(sender + " -> " + receiver + ": " + message);
            return "Delivered";
            //>> return "";
        }

        List<String> getLog() {
            //<<
            return new ArrayList<>(log);
            //>> return new ArrayList<>();
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
'''),

    2462: dict(
        rules="complete groupShipments(warehouses, shipments, drivers). Return a map from every warehouse id, in the "
              "order the warehouses are given, to the list of its shipments in input order; each listed shipment is "
              "written as \"<shipmentId> [<driver names>]\" with the names of the drivers whose ids are in its "
              "driverIds, in that order, joined by \", \". A warehouse with no shipments maps to an empty list. main "
              "prints one line per warehouse.",
        ref='''import java.util.ArrayList;
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
        //<<
        Map<Integer, String> names = new LinkedHashMap<>();
        for (Driver d : drivers) {
            names.put(d.id, d.name);
        }
        Map<Integer, List<String>> result = new LinkedHashMap<>();
        for (Warehouse w : warehouses) {
            result.put(w.id, new ArrayList<>());
        }
        for (Shipment s : shipments) {
            List<String> list = result.get(s.warehouseId);
            if (list == null) {
                continue;
            }
            List<String> assigned = new ArrayList<>();
            for (int id : s.driverIds) {
                if (names.containsKey(id)) {
                    assigned.add(names.get(id));
                }
            }
            list.add(s.id + " [" + String.join(", ", assigned) + "]");
        }
        return result;
        //>> return new LinkedHashMap<>();
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
'''),

    2517: dict(
        rules="complete buildTraceabilityMatrix(requirements, features). Return a map from every requirement id, in the "
              "order given, to the list of feature ids (in feature order, without repeats) whose requirementIds "
              "include it. Requirement ids that appear only in features are ignored. main prints one line per "
              "requirement.",
        ref='''import java.util.ArrayList;
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
        //<<
        Map<String, List<String>> matrix = new LinkedHashMap<>();
        for (String id : requirements) {
            matrix.put(id, new ArrayList<>());
        }
        for (Feature f : features) {
            for (String id : f.requirementIds) {
                List<String> list = matrix.get(id);
                if (list != null && !list.contains(f.featureId)) {
                    list.add(f.featureId);
                }
            }
        }
        return matrix;
        //>> return new LinkedHashMap<>();
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
'''),

    2521: dict(
        rules="complete applyChangeRequests(requirements, changes). Apply the changes in order to a copy of the list: "
              "\"add\" appends a requirement with that id and text unless the id already exists; \"modify\" sets the "
              "text of an existing requirement; \"remove\" deletes an existing requirement. A modify or remove for an "
              "id that does not exist, or an add for an id that does, is ignored. Return the updated list; main prints "
              "\"<id>: <text>\" per requirement.",
        ref='''import java.util.ArrayList;
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
        //<<
        List<Requirement> result = new ArrayList<>();
        for (Requirement r : requirements) {
            result.add(new Requirement(r.id, r.text));
        }
        for (Change c : changes) {
            Requirement existing = null;
            for (Requirement r : result) {
                if (r.id.equals(c.requirementId)) {
                    existing = r;
                }
            }
            if (c.type.equals("add") && existing == null) {
                result.add(new Requirement(c.requirementId, c.newText));
            } else if (c.type.equals("modify") && existing != null) {
                existing.text = c.newText;
            } else if (c.type.equals("remove") && existing != null) {
                result.remove(existing);
            }
        }
        return result;
        //>> return new ArrayList<>();
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
'''),

    2492: dict(
        rules="complete validateTransactions(transactions). Each transaction should have an id, an amount and a "
              "customerId (null means missing). Return one status per transaction, in order: \"rejected\" if any of "
              "the three is missing or its id was already used by an earlier transaction in the list (approved or "
              "not), otherwise \"approved\". main prints \"<id>: <status>\".",
        ref='''import java.util.ArrayList;
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
        //<<
        Set<Integer> seen = new HashSet<>();
        List<String> statuses = new ArrayList<>();
        for (Transaction t : transactions) {
            boolean missing = t.id == null || t.amount == null || t.customerId == null;
            boolean duplicate = t.id != null && seen.contains(t.id);
            statuses.add(missing || duplicate ? "rejected" : "approved");
            if (t.id != null) {
                seen.add(t.id);
            }
        }
        return statuses;
        //>> return new ArrayList<>();
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
'''),

    3131: dict(
        rules="complete splitRequirements(requirements). Each requirement has a text, a type (\"functional\" or "
              "\"non-functional\") and a priority (null means missing). If any requirement is missing a field, return "
              "null. Otherwise return two lists -- functional, then non-functional -- each sorted by priority from "
              "highest to lowest (equal priorities keep their input order). main prints the result.",
        ref='''import java.util.ArrayList;
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
        //<<
        List<Requirement> functional = new ArrayList<>();
        List<Requirement> nonFunctional = new ArrayList<>();
        for (Requirement r : requirements) {
            if (r.text == null || r.type == null || r.priority == null) {
                return null;
            }
            if (r.type.equals("functional")) {
                functional.add(r);
            } else if (r.type.equals("non-functional")) {
                nonFunctional.add(r);
            }
        }
        Comparator<Requirement> byPriority = (a, b) -> Integer.compare(b.priority, a.priority);
        functional.sort(byPriority);
        nonFunctional.sort(byPriority);
        return List.of(functional, nonFunctional);
        //>> return null;
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
'''),

    2784: dict(
        rules="complete allocateBudget(departments, budget). Go through the departments from highest to lowest priority "
              "(equal priorities keep their input order) and give each min(requested, remaining budget). Return the "
              "allocations in that order; main prints \"<name>: <amount>\" (a department may get 0).",
        ref='''import java.util.ArrayList;
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
        //<<
        List<Department> order = new ArrayList<>(departments);
        order.sort((a, b) -> Integer.compare(b.priority, a.priority));
        Map<String, Integer> allocation = new LinkedHashMap<>();
        for (Department d : order) {
            int give = Math.min(d.requested, budget);
            allocation.put(d.name, give);
            budget -= give;
        }
        return allocation;
        //>> return new LinkedHashMap<>();
    }

    public static void main(String[] args) {
        List<Department> departments = List.of(new Department("HR", 5000, 8), new Department("IT", 10000, 10),
                new Department("Legal", 3000, 8), new Department("Ops", 4000, 2));
        for (Map.Entry<String, Integer> e : allocateBudget(departments, 16000).entrySet()) {
            System.out.println(e.getKey() + ": " + e.getValue());
        }
    }
}
'''),

    23261: dict(
        rules="complete audit(requests, capacity), returning two lines: \"HITS MISSES EVICTIONS\", then the five most "
              "recently used keys, most recent first, separated by spaces.",
        ref='''import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

public class Main {
''' + LCG + '''
    static String audit(List<Integer> requests, int capacity) {
        //<<
        LinkedHashMap<Integer, Boolean> cache = new LinkedHashMap<>(16, 0.75f, true);
        int hits = 0, misses = 0, evictions = 0;
        for (int key : requests) {
            if (cache.containsKey(key)) {
                hits++;
                cache.get(key);
            } else {
                misses++;
                if (cache.size() == capacity) {
                    Integer eldest = cache.keySet().iterator().next();
                    cache.remove(eldest);
                    evictions++;
                }
                cache.put(key, true);
            }
        }
        List<Integer> keys = new ArrayList<>(cache.keySet());
        StringBuilder recent = new StringBuilder();
        for (int i = keys.size() - 1; i >= Math.max(0, keys.size() - 5); i--) {
            if (recent.length() > 0) recent.append(' ');
            recent.append(keys.get(i));
        }
        return hits + " " + misses + " " + evictions + "\\n" + recent;
        //>> return "";
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
'''),

    23571: dict(
        rules="complete plan(n, edges), where each edge {a, b} means module a must be built before module b. Return the "
              "lexicographically smallest valid build order, space-separated, if every module can be built; otherwise "
              "\"CYCLE k\", where k is the number of modules that can never be built because they sit on, or depend on, "
              "a cycle. main prints the result for graph A, then graph B.",
        ref='''import java.util.ArrayList;
import java.util.List;
import java.util.PriorityQueue;
import java.util.TreeSet;

public class Main {
''' + LCG + '''
    static String plan(int n, List<int[]> edges) {
        //<<
        List<List<Integer>> next = new ArrayList<>();
        for (int i = 0; i < n; i++) next.add(new ArrayList<>());
        int[] indegree = new int[n];
        for (int[] e : edges) {
            next.get(e[0]).add(e[1]);
            indegree[e[1]]++;
        }
        PriorityQueue<Integer> ready = new PriorityQueue<>();
        for (int i = 0; i < n; i++) if (indegree[i] == 0) ready.add(i);
        StringBuilder order = new StringBuilder();
        int built = 0;
        while (!ready.isEmpty()) {
            int m = ready.poll();
            if (built++ > 0) order.append(' ');
            order.append(m);
            for (int b : next.get(m)) if (--indegree[b] == 0) ready.add(b);
        }
        return built == n ? order.toString() : "CYCLE " + (n - built);
        //>> return "";
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
'''),
}

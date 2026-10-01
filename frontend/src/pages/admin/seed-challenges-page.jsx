import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import { Loader2, Play, Trophy, Code2, Network } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAllCertifications } from "@/services/certificationService.js"
import { base } from "@/services/base.js"
import {
  saveArenaProblems,
  createWorldCupEdition,
  saveWorldCupEditionStages,
  publishWorldCupEdition,
} from "@/services/challengeService.js"

const NODES = 3
const QUESTIONS_PER_NODE = 3

const PROGRAMMING_TEMPLATES = [
  {
    lang: "PYTHON",
    q: "A network monitoring tool receives a stream of packet logs as a list of strings. Each log has the format \"TIMESTAMP PROTOCOL SRC_IP DST_IP SIZE_BYTES STATUS\" separated by spaces. Write a function `analyze_traffic` that takes the list of log strings and returns a dictionary with three keys:\n\n- \"total_bytes\": the total size across all packets with STATUS \"OK\"\n- \"failed_count\": the number of packets with STATUS \"FAIL\" or \"TIMEOUT\"\n- \"top_protocol\": the protocol that appears most frequently (break ties alphabetically)\n\nConstraints: 1 ≤ len(logs) ≤ 10000. SIZE_BYTES is always a non-negative integer. PROTOCOL is uppercase letters only.",
    starter: "def analyze_traffic(logs):\n    # Parse each log line and compute the three metrics\n    pass",
    cases: [
      { i: 'analyze_traffic(["1000 TCP 10.0.0.1 10.0.0.2 500 OK", "1001 UDP 10.0.0.1 10.0.0.3 200 FAIL", "1002 TCP 10.0.0.4 10.0.0.2 300 OK"])', o: "{'total_bytes': 800, 'failed_count': 1, 'top_protocol': 'TCP'}" },
      { i: 'analyze_traffic(["1000 HTTP 1.1.1.1 2.2.2.2 100 TIMEOUT", "1001 HTTP 1.1.1.1 2.2.2.2 50 TIMEOUT"])', o: "{'total_bytes': 0, 'failed_count': 2, 'top_protocol': 'HTTP'}" },
      { i: 'analyze_traffic(["1000 DNS 8.8.8.8 1.1.1.1 64 OK", "1001 TCP 8.8.8.8 1.1.1.1 128 OK", "1002 DNS 8.8.8.8 1.1.1.1 64 OK"])', o: "{'total_bytes': 256, 'failed_count': 0, 'top_protocol': 'DNS'}" },
    ],
  },
  {
    lang: "JAVA",
    q: "A warehouse inventory tracker processes shipment records. Each line of input has the format \"PRODUCT_CODE QUANTITY OPERATION\" where OPERATION is either IN or OUT. Write a program `InventoryTracker` that reads N (number of records) on the first line, then N records, and prints the final inventory count for each product code in alphabetical order, one per line as \"PRODUCT_CODE: COUNT\". If a product goes to zero or below, print it as 0.\n\nConstraints: 1 ≤ N ≤ 10000. QUANTITY is a positive integer. PRODUCT_CODE contains only uppercase letters and digits.",
    starter: "import java.util.*;\n\npublic class InventoryTracker {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read records and compute final inventory\n    }\n}",
    cases: [
      { i: "4\nWDG-001 50 IN\nGDG-002 20 IN\nWDG-001 15 OUT\nGDG-002 25 OUT", o: "GDG-002: 0\nWDG-001: 35" },
      { i: "2\nBOLT-A 100 IN\nBOLT-A 30 OUT", o: "BOLT-A: 70" },
      { i: "3\nX1 10 IN\nX2 5 IN\nX1 10 OUT", o: "X1: 0\nX2: 5" },
    ],
  },
  {
    lang: "PYTHON",
    q: "A scheduling system must detect time conflicts. Each meeting is represented as a tuple (start_hour, end_hour) using 24-hour integers (0–23), where start < end. Write a function `find_conflicts` that takes a list of meetings and returns a list of tuples, where each tuple contains the indices (0-based) of two meetings that overlap. Return them sorted by first index, then by second index. Two meetings conflict if one starts strictly before the other ends and vice versa.",
    starter: "def find_conflicts(meetings):\n    # Compare all pairs and return conflicting index pairs\n    pass",
    cases: [
      { i: "find_conflicts([(9, 11), (10, 12), (13, 15)])", o: "[(0, 1)]" },
      { i: "find_conflicts([(8, 10), (10, 12), (11, 14), (14, 16)])", o: "[(1, 2)]" },
      { i: "find_conflicts([(9, 17), (10, 11), (12, 13), (16, 18)])", o: "[(0, 1), (0, 2), (0, 3)]" },
      { i: "find_conflicts([(8, 9), (9, 10), (10, 11)])", o: "[]" },
    ],
  },
  {
    lang: "C++",
    q: "A log analysis tool processes server logs. Each log line has the format \"DATE LEVEL MODULE MESSAGE\" separated by spaces (MESSAGE may contain spaces). LEVEL is one of INFO, WARN, ERROR, FATAL. Write a program `log_aggregator` that reads N (number of log lines) on the first line, then N log lines, and prints how many times each LEVEL appeared across all logs. Output one line per level that appeared, in alphabetical order, as \"LEVEL: COUNT\".",
    starter: "#include <iostream>\n#include <string>\n#include <map>\nusing namespace std;\n\nint main() {\n    // Read logs and count by level\n    return 0;\n}",
    cases: [
      { i: "4\n2026-01-15 ERROR auth Failed login\n2026-01-15 ERROR auth Token expired\n2026-01-15 WARN auth Slow response\n2026-01-15 INFO db Connection opened", o: "ERROR: 2\nINFO: 1\nWARN: 1" },
      { i: "1\n2026-03-01 FATAL core Out of memory", o: "FATAL: 1" },
      { i: "3\n2026-01-01 INFO x a\n2026-01-01 INFO y b\n2026-01-01 INFO z c", o: "INFO: 3" },
    ],
  },
  {
    lang: "PYTHON",
    q: "A task dependency resolver receives a dictionary mapping each task name (string) to a list of task names it depends on. Write a function `execution_order` that returns a list of task names in a valid execution order (dependencies before dependents). If there is a circular dependency, return the string \"CYCLE_DETECTED\" instead. When multiple orders are valid, break ties alphabetically.",
    starter: "def execution_order(tasks):\n    # Topological sort with cycle detection\n    pass",
    cases: [
      { i: 'execution_order({"build": ["compile"], "compile": ["parse"], "parse": [], "test": ["build"]})', o: "['parse', 'compile', 'build', 'test']" },
      { i: 'execution_order({"a": ["b"], "b": ["a"]})', o: "'CYCLE_DETECTED'" },
      { i: 'execution_order({"x": [], "y": [], "z": ["x", "y"]})', o: "['x', 'y', 'z']" },
    ],
  },
  {
    lang: "JAVASCRIPT",
    q: "A CSV data pipeline processes records. The first line is the header. Write a program `csvFilter` that reads N (number of lines including header) on the first line, then N lines of comma-separated values, then a column name and a filter value on the last two lines. Print each matching row as \"col1=val1 col2=val2 ...\" with columns in header order. If the column doesn't exist or no rows match, print \"NO_MATCHES\".",
    starter: "const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on('line', l => lines.push(l));\nrl.on('close', () => {\n    // Parse and filter CSV\n});",
    cases: [
      { i: "4\nname,age,city\nAlice,30,Tokyo\nBob,25,Tokyo\nCarol,30,Osaka\ncity\nTokyo", o: "name=Alice age=30 city=Tokyo\nname=Bob age=25 city=Tokyo" },
      { i: "3\nid,status\n1,active\n2,inactive\nstatus\npending", o: "NO_MATCHES" },
      { i: "2\nid,status\n1,active\nmissing_col\nx", o: "NO_MATCHES" },
    ],
  },
  {
    lang: "C#",
    q: "A permission system uses role-based access control. Input: first line is N (number of roles). Each role is described by three lines: role name, comma-separated permissions, comma-separated parent role names (or NONE). Last line is the target role name. Write a program `RbacResolver` that prints all unique permissions the target role has (including inherited ones, recursively), sorted alphabetically, one per line. If the role is not found, print \"ROLE_NOT_FOUND\".",
    starter: "using System;\nusing System.Collections.Generic;\nusing System.Linq;\n\nclass RbacResolver {\n    static void Main() {\n        // Read roles and resolve permissions\n    }\n}",
    cases: [
      { i: "3\nviewer\nread\nNONE\neditor\nwrite\nviewer\nadmin\ndelete\neditor\nadmin", o: "delete\nread\nwrite" },
      { i: "1\nbasic\nview\nNONE\nunknown", o: "ROLE_NOT_FOUND" },
      { i: "2\na\np1\nb\nb\np1,p2\nNONE\na", o: "p1\np2" },
    ],
  },
  {
    lang: "PYTHON",
    q: "A text processor must normalize and validate email addresses from user input. Write a function `validate_emails` that takes a list of strings and returns a dictionary with two keys:\n\n- \"valid\": a list of valid emails, lowercased and stripped of whitespace\n- \"invalid\": a list of the original strings that are not valid emails\n\nA valid email must match: one or more alphanumeric/dot/underscore/hyphen characters, then @, then one or more alphanumeric/hyphen characters, then a dot, then 2-4 alphabetic characters. Preserve the input order in both lists.",
    starter: "def validate_emails(inputs):\n    # Validate each string against the email pattern\n    pass",
    cases: [
      { i: 'validate_emails(["  Alice@Example.COM ", "bob@", "carol.d@test.co", "not-an-email"])', o: "{'valid': ['alice@example.com', 'carol.d@test.co'], 'invalid': ['bob@', 'not-an-email']}" },
      { i: 'validate_emails([])', o: "{'valid': [], 'invalid': []}" },
      { i: 'validate_emails(["a@b.toolongext", "ok@domain.org"])', o: "{'valid': ['ok@domain.org'], 'invalid': ['a@b.toolongext']}" },
    ],
  },
  {
    lang: "C",
    q: "A warehouse routing system finds the shortest path on a grid. The first line contains ROWS and COLS. The next ROWS lines each contain COLS space-separated integers (0 = walkable, 1 = obstacle). The last line has four integers: startRow startCol endRow endCol. Write a program `shortest_path` that prints the minimum number of steps to reach the end from the start (moving up/down/left/right), or -1 if no path exists.",
    starter: "#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    // BFS shortest path on grid\n    return 0;\n}",
    cases: [
      { i: "3 3\n0 0 0\n0 1 0\n0 0 0\n0 0 2 2", o: "4" },
      { i: "2 2\n0 1\n1 0\n0 0 1 1", o: "-1" },
      { i: "3 4\n0 0 0 0\n0 1 1 0\n0 0 0 0\n0 0 0 3", o: "3" },
      { i: "1 1\n0\n0 0 0 0", o: "0" },
    ],
  },
]

const DIAGRAM_TEMPLATES = [
  {
    diagramType: "ERD",
    q: "A regional power utility tracks electricity generation, transmission, and billing. Each PowerPlant has a capacity rating and fuel type. Plants connect to Substations through TransmissionLines that have a voltage level and maximum load. Substations serve one or more ServiceZones. Each CustomerAccount belongs to exactly one ServiceZone, has a meter ID, and accumulates MonthlyReadings (kWh consumed, peak demand, billing period). The utility also records MaintenanceEvents on transmission lines, each with a crew ID, scheduled date, and completion status.\n\nModel the entities, their attributes, primary keys, and all relationships with correct cardinality.",
    instructions: "1. Identify at least six entities from the scenario.\n2. Assign meaningful primary keys and at least two non-key attributes to each entity.\n3. Show all relationships with correct cardinality notation.\n4. Indicate which relationships are identifying vs non-identifying.",
    refJson: { title: "Regional Power Utility", nodes: [{ key: "plant", label: "PowerPlant", shape: "box", lines: ["- plantId: int «PK»", "- name: varchar", "- capacityMW: decimal", "- fuelType: varchar"] }, { key: "line", label: "TransmissionLine", shape: "box", lines: ["- lineId: int «PK»", "- voltageKV: int", "- maxLoadMW: decimal", "- lengthKm: decimal"] }, { key: "substation", label: "Substation", shape: "box", lines: ["- substationId: int «PK»", "- name: varchar", "- location: varchar"] }, { key: "zone", label: "ServiceZone", shape: "box", lines: ["- zoneId: int «PK»", "- zoneName: varchar", "- region: varchar"] }, { key: "account", label: "CustomerAccount", shape: "box", lines: ["- accountId: int «PK»", "- meterId: varchar", "- customerName: varchar"] }, { key: "reading", label: "MonthlyReading", shape: "box", lines: ["- readingId: int «PK»", "- kwhConsumed: decimal", "- peakDemand: decimal", "- billingPeriod: date"] }, { key: "maint", label: "MaintenanceEvent", shape: "box", lines: ["- eventId: int «PK»", "- crewId: varchar", "- scheduledDate: date", "- completed: boolean"] }], edges: [{ source: "plant", target: "line", kind: "association", label: "feeds", source_multiplicity: "1", target_multiplicity: "1..*" }, { source: "line", target: "substation", kind: "association", label: "connects to", source_multiplicity: "1..*", target_multiplicity: "1" }, { source: "substation", target: "zone", kind: "association", label: "serves", source_multiplicity: "1", target_multiplicity: "1..*" }, { source: "zone", target: "account", kind: "association", label: "contains", source_multiplicity: "1", target_multiplicity: "0..*" }, { source: "account", target: "reading", kind: "composition", label: "records", source_multiplicity: "1", target_multiplicity: "0..*" }, { source: "line", target: "maint", kind: "association", label: "has", source_multiplicity: "1", target_multiplicity: "0..*" }] },
    refXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="PowerPlant\n─────────\nplantId «PK»\nname\ncapacityMW\nfuelType" style="shape=table;startSize=28;fontStyle=1;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="50" y="50" width="180" height="120" as="geometry"/></mxCell><mxCell id="3" value="TransmissionLine\n─────────\nlineId «PK»\nvoltageKV\nmaxLoadMW\nlengthKm" style="shape=table;startSize=28;fontStyle=1;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="300" y="50" width="180" height="120" as="geometry"/></mxCell><mxCell id="4" value="Substation\n─────────\nsubstationId «PK»\nname\nlocation" style="shape=table;startSize=28;fontStyle=1;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="550" y="50" width="180" height="100" as="geometry"/></mxCell><mxCell id="5" value="ServiceZone\n─────────\nzoneId «PK»\nzoneName\nregion" style="shape=table;startSize=28;fontStyle=1;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="550" y="220" width="180" height="100" as="geometry"/></mxCell><mxCell id="6" value="CustomerAccount\n─────────\naccountId «PK»\nmeterId\ncustomerName" style="shape=table;startSize=28;fontStyle=1;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="300" y="220" width="180" height="100" as="geometry"/></mxCell><mxCell id="7" value="MonthlyReading\n─────────\nreadingId «PK»\nkwhConsumed\npeakDemand\nbillingPeriod" style="shape=table;startSize=28;fontStyle=1;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="50" y="220" width="180" height="120" as="geometry"/></mxCell><mxCell id="8" value="MaintenanceEvent\n─────────\neventId «PK»\ncrewId\nscheduledDate\ncompleted" style="shape=table;startSize=28;fontStyle=1;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="300" y="400" width="180" height="120" as="geometry"/></mxCell><mxCell id="20" value="1" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="2" target="3" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="21" value="1..*" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="3" target="4" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="22" value="1..*" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="4" target="5" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="23" value="0..*" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="5" target="6" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="24" value="0..*" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="6" target="7" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell><mxCell id="25" value="0..*" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="3" target="8" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel>',
  },
  {
    diagramType: "UML_CLASS",
    q: "A logistics company operates a fleet management system. Each Vehicle has a registration number, type (truck, van, motorcycle), and current mileage. Vehicles are assigned to Routes, each defined by a list of Waypoints (latitude, longitude, sequence order). A Driver is assigned to exactly one vehicle at a time but can be reassigned. Each Trip records the driver, vehicle, route taken, departure time, arrival time, and cargo weight. The system tracks FuelLogs per vehicle (date, litres, cost, odometer reading) and generates MaintenanceAlerts when mileage thresholds are crossed.\n\nModel this as a UML class diagram showing attributes, key methods, and relationships.",
    instructions: "1. Show all classes with their attributes and at least one method each.\n2. Use correct UML relationship types (composition for waypoints in a route, association for driver-vehicle assignment).\n3. Include multiplicity on all relationships.\n4. Mark abstract classes or interfaces if applicable.",
    refJson: { title: "Fleet Management System", nodes: [{ key: "vehicle", label: "Vehicle", shape: "box", lines: ["- registrationNo: String", "- type: VehicleType", "- currentMileage: int", "+ needsMaintenance(): boolean"] }, { key: "driver", label: "Driver", shape: "box", lines: ["- driverId: String", "- name: String", "- licenseClass: String", "+ isAvailable(): boolean"] }, { key: "route", label: "Route", shape: "box", lines: ["- routeId: String", "- name: String", "- totalDistanceKm: double", "+ waypointCount(): int"] }, { key: "waypoint", label: "Waypoint", shape: "box", lines: ["- latitude: double", "- longitude: double", "- sequenceOrder: int"] }, { key: "trip", label: "Trip", shape: "box", lines: ["- departureTime: DateTime", "- arrivalTime: DateTime", "- cargoWeightKg: double", "+ durationHours(): double"] }, { key: "fuellog", label: "FuelLog", shape: "box", lines: ["- date: Date", "- litres: double", "- cost: double", "- odometerReading: int"] }, { key: "alert", label: "MaintenanceAlert", shape: "box", lines: ["- alertType: String", "- thresholdKm: int", "- triggered: boolean", "+ dismiss(): void"] }], edges: [{ source: "driver", target: "vehicle", kind: "association", label: "drives", source_multiplicity: "0..1", target_multiplicity: "1" }, { source: "route", target: "waypoint", kind: "composition", label: "contains", source_multiplicity: "1", target_multiplicity: "2..*" }, { source: "trip", target: "driver", kind: "association", label: "driven by", source_multiplicity: "0..*", target_multiplicity: "1" }, { source: "trip", target: "vehicle", kind: "association", label: "uses", source_multiplicity: "0..*", target_multiplicity: "1" }, { source: "trip", target: "route", kind: "association", label: "follows", source_multiplicity: "0..*", target_multiplicity: "1" }, { source: "vehicle", target: "fuellog", kind: "composition", label: "records", source_multiplicity: "1", target_multiplicity: "0..*" }, { source: "vehicle", target: "alert", kind: "association", label: "triggers", source_multiplicity: "1", target_multiplicity: "0..*" }] },
    refXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="Vehicle\n─────────\n- registrationNo: String\n- type: VehicleType\n- currentMileage: int\n+ needsMaintenance(): boolean" style="shape=table;startSize=28;fontStyle=1;align=left;" vertex="1" parent="1"><mxGeometry x="300" y="50" width="200" height="130" as="geometry"/></mxCell><mxCell id="3" value="Driver\n─────────\n- driverId: String\n- name: String\n- licenseClass: String\n+ isAvailable(): boolean" style="shape=table;startSize=28;fontStyle=1;align=left;" vertex="1" parent="1"><mxGeometry x="50" y="50" width="200" height="130" as="geometry"/></mxCell><mxCell id="4" value="Route\n─────────\n- routeId: String\n- name: String\n- totalDistanceKm: double\n+ waypointCount(): int" style="shape=table;startSize=28;fontStyle=1;align=left;" vertex="1" parent="1"><mxGeometry x="570" y="50" width="200" height="130" as="geometry"/></mxCell><mxCell id="5" value="Waypoint\n─────────\n- latitude: double\n- longitude: double\n- sequenceOrder: int" style="shape=table;startSize=28;fontStyle=1;align=left;" vertex="1" parent="1"><mxGeometry x="570" y="240" width="200" height="100" as="geometry"/></mxCell><mxCell id="6" value="Trip\n─────────\n- departureTime: DateTime\n- arrivalTime: DateTime\n- cargoWeightKg: double\n+ durationHours(): double" style="shape=table;startSize=28;fontStyle=1;align=left;" vertex="1" parent="1"><mxGeometry x="300" y="240" width="200" height="130" as="geometry"/></mxCell><mxCell id="7" value="FuelLog\n─────────\n- date: Date\n- litres: double\n- cost: double\n- odometerReading: int" style="shape=table;startSize=28;fontStyle=1;align=left;" vertex="1" parent="1"><mxGeometry x="50" y="240" width="200" height="120" as="geometry"/></mxCell><mxCell id="8" value="MaintenanceAlert\n─────────\n- alertType: String\n- thresholdKm: int\n- triggered: boolean\n+ dismiss(): void" style="shape=table;startSize=28;fontStyle=1;align=left;" vertex="1" parent="1"><mxGeometry x="50" y="420" width="200" height="120" as="geometry"/></mxCell></root></mxGraphModel>',
  },
  {
    diagramType: "SEQUENCE_DIAGRAM",
    q: "An online payment gateway processes a transaction as follows:\n(a) The Merchant sends a payment request to the PaymentGateway with the order amount and card token.\n(b) The PaymentGateway validates the card token with the TokenService.\n(c) If validation passes, the PaymentGateway sends an authorization request to the AcquiringBank.\n(d) The AcquiringBank forwards the request to the CardNetwork (e.g., Visa).\n(e) The CardNetwork checks with the IssuingBank whether the cardholder has sufficient funds.\n(f) The IssuingBank responds with approved or declined.\n(g) The response propagates back through CardNetwork → AcquiringBank → PaymentGateway → Merchant.\n(h) If approved, the PaymentGateway logs the transaction in the AuditLog.\n\nModel the full interaction as a sequence diagram showing all messages in order, including the conditional (approved/declined) path.",
    instructions: "1. Include all six actors/participants.\n2. Show the full message flow in both the approved and declined paths.\n3. Use an alt fragment for the approved/declined branch.\n4. Label each message with a descriptive name.",
    refJson: { title: "Payment Transaction Flow", nodes: [{ key: "merchant", label: "Merchant", shape: "actor", lines: [] }, { key: "gateway", label: "PaymentGateway", shape: "box", lines: [] }, { key: "token", label: "TokenService", shape: "box", lines: [] }, { key: "acquirer", label: "AcquiringBank", shape: "box", lines: [] }, { key: "network", label: "CardNetwork", shape: "box", lines: [] }, { key: "issuer", label: "IssuingBank", shape: "box", lines: [] }, { key: "audit", label: "AuditLog", shape: "box", lines: [] }], edges: [{ source: "merchant", target: "gateway", kind: "association", label: "1: paymentRequest(amount, token)", source_multiplicity: "", target_multiplicity: "" }, { source: "gateway", target: "token", kind: "association", label: "2: validateToken(token)", source_multiplicity: "", target_multiplicity: "" }, { source: "token", target: "gateway", kind: "association", label: "3: tokenValid", source_multiplicity: "", target_multiplicity: "" }, { source: "gateway", target: "acquirer", kind: "association", label: "4: authorize(amount)", source_multiplicity: "", target_multiplicity: "" }, { source: "acquirer", target: "network", kind: "association", label: "5: forwardAuth(amount)", source_multiplicity: "", target_multiplicity: "" }, { source: "network", target: "issuer", kind: "association", label: "6: checkFunds(amount)", source_multiplicity: "", target_multiplicity: "" }, { source: "issuer", target: "network", kind: "association", label: "7: approved/declined", source_multiplicity: "", target_multiplicity: "" }, { source: "network", target: "acquirer", kind: "association", label: "8: authResult", source_multiplicity: "", target_multiplicity: "" }, { source: "acquirer", target: "gateway", kind: "association", label: "9: authResult", source_multiplicity: "", target_multiplicity: "" }, { source: "gateway", target: "audit", kind: "association", label: "10: logTransaction", source_multiplicity: "", target_multiplicity: "" }, { source: "gateway", target: "merchant", kind: "association", label: "11: paymentResult", source_multiplicity: "", target_multiplicity: "" }] },
    refXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="Merchant" style="shape=umlActor;" vertex="1" parent="1"><mxGeometry x="50" y="30" width="30" height="50" as="geometry"/></mxCell><mxCell id="3" value="PaymentGateway" style="shape=box;" vertex="1" parent="1"><mxGeometry x="150" y="30" width="120" height="40" as="geometry"/></mxCell><mxCell id="4" value="TokenService" style="shape=box;" vertex="1" parent="1"><mxGeometry x="320" y="30" width="100" height="40" as="geometry"/></mxCell><mxCell id="5" value="AcquiringBank" style="shape=box;" vertex="1" parent="1"><mxGeometry x="470" y="30" width="110" height="40" as="geometry"/></mxCell><mxCell id="6" value="CardNetwork" style="shape=box;" vertex="1" parent="1"><mxGeometry x="630" y="30" width="100" height="40" as="geometry"/></mxCell><mxCell id="7" value="IssuingBank" style="shape=box;" vertex="1" parent="1"><mxGeometry x="780" y="30" width="100" height="40" as="geometry"/></mxCell><mxCell id="8" value="AuditLog" style="shape=box;" vertex="1" parent="1"><mxGeometry x="930" y="30" width="80" height="40" as="geometry"/></mxCell></root></mxGraphModel>',
  },
  {
    diagramType: "ACTIVITY_DIAGRAM",
    q: "A continuous integration pipeline works as follows:\n(a) A developer pushes code to the repository.\n(b) The CI server detects the push and starts a build.\n(c) In parallel, the system runs unit tests and static analysis.\n(d) If either fails, the pipeline sends a failure notification to the developer and stops.\n(e) If both pass, the system builds a Docker image and pushes it to the registry.\n(f) The system then deploys to a staging environment.\n(g) Integration tests run against the staging deployment.\n(h) If integration tests pass, a manual approval gate is presented.\n(i) If approved, the system deploys to production; if rejected, it rolls back staging and notifies.\n\nModel the complete pipeline as an activity diagram with proper fork/join for parallel activities, decision nodes, and the manual approval gate.",
    instructions: "1. Use fork and join bars for the parallel unit test / static analysis step.\n2. Use decision diamonds for pass/fail checks and the approval gate.\n3. Show the notification and rollback paths.\n4. Include start and end nodes.",
    refJson: { title: "CI/CD Pipeline", nodes: [{ key: "start", label: "Start", shape: "start", lines: [] }, { key: "push", label: "Push Code", shape: "action", lines: [] }, { key: "detect", label: "Detect Push", shape: "action", lines: [] }, { key: "fork1", label: "", shape: "bar", lines: [] }, { key: "unittest", label: "Run Unit Tests", shape: "action", lines: [] }, { key: "static", label: "Run Static Analysis", shape: "action", lines: [] }, { key: "join1", label: "", shape: "bar", lines: [] }, { key: "check1", label: "All Pass?", shape: "decision", lines: [] }, { key: "notify_fail", label: "Send Failure Notification", shape: "action", lines: [] }, { key: "build_image", label: "Build Docker Image", shape: "action", lines: [] }, { key: "deploy_stg", label: "Deploy to Staging", shape: "action", lines: [] }, { key: "int_test", label: "Run Integration Tests", shape: "action", lines: [] }, { key: "check2", label: "Tests Pass?", shape: "decision", lines: [] }, { key: "approval", label: "Manual Approval Gate", shape: "action", lines: [] }, { key: "check3", label: "Approved?", shape: "decision", lines: [] }, { key: "deploy_prod", label: "Deploy to Production", shape: "action", lines: [] }, { key: "rollback", label: "Rollback Staging", shape: "action", lines: [] }, { key: "end", label: "End", shape: "end", lines: [] }], edges: [{ source: "start", target: "push", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "push", target: "detect", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "detect", target: "fork1", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "fork1", target: "unittest", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "fork1", target: "static", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "unittest", target: "join1", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "static", target: "join1", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "join1", target: "check1", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "check1", target: "notify_fail", kind: "association", label: "fail", source_multiplicity: "", target_multiplicity: "" }, { source: "check1", target: "build_image", kind: "association", label: "pass", source_multiplicity: "", target_multiplicity: "" }, { source: "build_image", target: "deploy_stg", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "deploy_stg", target: "int_test", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "int_test", target: "check2", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "check2", target: "notify_fail", kind: "association", label: "fail", source_multiplicity: "", target_multiplicity: "" }, { source: "check2", target: "approval", kind: "association", label: "pass", source_multiplicity: "", target_multiplicity: "" }, { source: "approval", target: "check3", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "check3", target: "deploy_prod", kind: "association", label: "approved", source_multiplicity: "", target_multiplicity: "" }, { source: "check3", target: "rollback", kind: "association", label: "rejected", source_multiplicity: "", target_multiplicity: "" }, { source: "deploy_prod", target: "end", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "rollback", target: "notify_fail", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "notify_fail", target: "end", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }] },
    refXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="" style="ellipse;fillColor=#000000;" vertex="1" parent="1"><mxGeometry x="370" y="10" width="30" height="30" as="geometry"/></mxCell><mxCell id="3" value="Push Code" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="330" y="60" width="120" height="40" as="geometry"/></mxCell><mxCell id="4" value="Detect Push" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="330" y="120" width="120" height="40" as="geometry"/></mxCell><mxCell id="5" value="" style="shape=line;strokeWidth=3;" vertex="1" parent="1"><mxGeometry x="300" y="180" width="180" height="5" as="geometry"/></mxCell><mxCell id="6" value="Run Unit Tests" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="200" y="210" width="140" height="40" as="geometry"/></mxCell><mxCell id="7" value="Run Static Analysis" style="rounded=1;" vertex="1" parent="1"><mxGeometry x="420" y="210" width="160" height="40" as="geometry"/></mxCell></root></mxGraphModel>',
  },
  {
    diagramType: "UML_COMPONENT",
    q: "A microservices-based food production monitoring system consists of:\n(a) A SensorGateway component that receives telemetry from IoT temperature and humidity sensors on the factory floor.\n(b) A DataIngestion component that buffers and validates incoming sensor readings via a message queue.\n(c) An AlertEngine component that evaluates rules (temperature thresholds, rate-of-change limits) and triggers alerts.\n(d) A DashboardAPI component that serves real-time and historical data to the front-end.\n(e) A ComplianceReporter component that generates daily PDF reports for food safety auditors.\n(f) A shared PostgreSQL database used by DataIngestion, DashboardAPI, and ComplianceReporter.\n(g) A Redis cache used by DashboardAPI for real-time metric aggregation.\n\nModel the components, their provided and required interfaces, and all dependencies.",
    instructions: "1. Show each component with its provided (lollipop) and required (socket) interfaces.\n2. Include the database and cache as separate components or artifacts.\n3. Label all dependency arrows with what is exchanged.\n4. Group related components if appropriate.",
    refJson: { title: "Food Production Monitoring", nodes: [{ key: "sensor", label: "SensorGateway", shape: "component", lines: ["«provides» TelemetryIn"] }, { key: "ingest", label: "DataIngestion", shape: "component", lines: ["«requires» TelemetryIn", "«provides» ValidatedReadings"] }, { key: "alert", label: "AlertEngine", shape: "component", lines: ["«requires» ValidatedReadings", "«provides» AlertNotifications"] }, { key: "dashboard", label: "DashboardAPI", shape: "component", lines: ["«requires» ValidatedReadings", "«provides» REST API"] }, { key: "compliance", label: "ComplianceReporter", shape: "component", lines: ["«provides» PDF Reports"] }, { key: "postgres", label: "PostgreSQL", shape: "box", lines: [] }, { key: "redis", label: "Redis Cache", shape: "box", lines: [] }, { key: "queue", label: "MessageQueue", shape: "box", lines: [] }], edges: [{ source: "sensor", target: "queue", kind: "dependency", label: "publishes telemetry", source_multiplicity: "", target_multiplicity: "" }, { source: "queue", target: "ingest", kind: "dependency", label: "delivers messages", source_multiplicity: "", target_multiplicity: "" }, { source: "ingest", target: "postgres", kind: "dependency", label: "stores readings", source_multiplicity: "", target_multiplicity: "" }, { source: "ingest", target: "alert", kind: "dependency", label: "forwards validated data", source_multiplicity: "", target_multiplicity: "" }, { source: "dashboard", target: "postgres", kind: "dependency", label: "queries history", source_multiplicity: "", target_multiplicity: "" }, { source: "dashboard", target: "redis", kind: "dependency", label: "caches aggregates", source_multiplicity: "", target_multiplicity: "" }, { source: "compliance", target: "postgres", kind: "dependency", label: "reads daily data", source_multiplicity: "", target_multiplicity: "" }] },
    refXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="«component»\nSensorGateway" style="shape=component;" vertex="1" parent="1"><mxGeometry x="50" y="50" width="160" height="60" as="geometry"/></mxCell><mxCell id="3" value="«component»\nDataIngestion" style="shape=component;" vertex="1" parent="1"><mxGeometry x="300" y="50" width="160" height="60" as="geometry"/></mxCell><mxCell id="4" value="«component»\nAlertEngine" style="shape=component;" vertex="1" parent="1"><mxGeometry x="300" y="180" width="160" height="60" as="geometry"/></mxCell><mxCell id="5" value="«component»\nDashboardAPI" style="shape=component;" vertex="1" parent="1"><mxGeometry x="550" y="50" width="160" height="60" as="geometry"/></mxCell><mxCell id="6" value="«component»\nComplianceReporter" style="shape=component;" vertex="1" parent="1"><mxGeometry x="550" y="180" width="160" height="60" as="geometry"/></mxCell><mxCell id="7" value="PostgreSQL" style="shape=cylinder;" vertex="1" parent="1"><mxGeometry x="430" y="320" width="100" height="60" as="geometry"/></mxCell><mxCell id="8" value="Redis Cache" style="shape=cylinder;" vertex="1" parent="1"><mxGeometry x="600" y="320" width="100" height="60" as="geometry"/></mxCell><mxCell id="9" value="MessageQueue" style="shape=cylinder;" vertex="1" parent="1"><mxGeometry x="160" y="180" width="100" height="60" as="geometry"/></mxCell></root></mxGraphModel>',
  },
  {
    diagramType: "FLOWCHART",
    q: "A credit risk assessment engine processes a loan application through the following steps:\n(a) Receive the application with the applicant's income, credit score, debt-to-income ratio, and employment status.\n(b) Check if the credit score is below 580. If yes, auto-reject.\n(c) If credit score is 580–699, route to manual underwriter review.\n(d) If credit score is 700+, check the debt-to-income ratio.\n(e) If DTI > 0.43, flag as high-risk and route to senior underwriter.\n(f) If DTI ≤ 0.43 and employment is verified, auto-approve.\n(g) If DTI ≤ 0.43 but employment is not verified, request employment verification documents and wait.\n(h) After documents are received, re-evaluate from step (d).\n(i) Manual and senior underwriter reviews result in either approve or reject.\n\nModel the full decision flow as a flowchart.",
    instructions: "1. Use proper flowchart shapes (rectangles for processes, diamonds for decisions, rounded rectangles for start/end).\n2. Label all decision branches with their conditions.\n3. Show the document-request loop clearly.\n4. Include all terminal states (auto-approve, auto-reject, underwriter approve/reject).",
    refJson: { title: "Credit Risk Assessment", nodes: [{ key: "start", label: "Start", shape: "terminator", lines: [] }, { key: "receive", label: "Receive Application", shape: "action", lines: [] }, { key: "check_score", label: "Credit Score?", shape: "decision", lines: [] }, { key: "reject", label: "Auto-Reject", shape: "action", lines: [] }, { key: "manual", label: "Manual Underwriter Review", shape: "action", lines: [] }, { key: "check_dti", label: "DTI > 0.43?", shape: "decision", lines: [] }, { key: "senior", label: "Senior Underwriter Review", shape: "action", lines: [] }, { key: "check_emp", label: "Employment Verified?", shape: "decision", lines: [] }, { key: "approve", label: "Auto-Approve", shape: "action", lines: [] }, { key: "req_docs", label: "Request Employment Docs", shape: "action", lines: [] }, { key: "uw_decision", label: "Underwriter Decision", shape: "decision", lines: [] }, { key: "uw_approve", label: "Approve", shape: "action", lines: [] }, { key: "uw_reject", label: "Reject", shape: "action", lines: [] }, { key: "end", label: "End", shape: "terminator", lines: [] }], edges: [{ source: "start", target: "receive", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "receive", target: "check_score", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "check_score", target: "reject", kind: "association", label: "< 580", source_multiplicity: "", target_multiplicity: "" }, { source: "check_score", target: "manual", kind: "association", label: "580-699", source_multiplicity: "", target_multiplicity: "" }, { source: "check_score", target: "check_dti", kind: "association", label: "700+", source_multiplicity: "", target_multiplicity: "" }, { source: "check_dti", target: "senior", kind: "association", label: "yes", source_multiplicity: "", target_multiplicity: "" }, { source: "check_dti", target: "check_emp", kind: "association", label: "no", source_multiplicity: "", target_multiplicity: "" }, { source: "check_emp", target: "approve", kind: "association", label: "yes", source_multiplicity: "", target_multiplicity: "" }, { source: "check_emp", target: "req_docs", kind: "association", label: "no", source_multiplicity: "", target_multiplicity: "" }, { source: "req_docs", target: "check_dti", kind: "association", label: "docs received", source_multiplicity: "", target_multiplicity: "" }, { source: "manual", target: "uw_decision", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "senior", target: "uw_decision", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "uw_decision", target: "uw_approve", kind: "association", label: "approve", source_multiplicity: "", target_multiplicity: "" }, { source: "uw_decision", target: "uw_reject", kind: "association", label: "reject", source_multiplicity: "", target_multiplicity: "" }] },
    refXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="Start" style="rounded=1;arcSize=50;" vertex="1" parent="1"><mxGeometry x="340" y="10" width="100" height="40" as="geometry"/></mxCell><mxCell id="3" value="Receive Application" style="rounded=0;" vertex="1" parent="1"><mxGeometry x="320" y="70" width="140" height="40" as="geometry"/></mxCell><mxCell id="4" value="Credit Score?" style="rhombus;" vertex="1" parent="1"><mxGeometry x="330" y="130" width="120" height="80" as="geometry"/></mxCell><mxCell id="5" value="Auto-Reject" style="rounded=0;" vertex="1" parent="1"><mxGeometry x="100" y="145" width="120" height="40" as="geometry"/></mxCell><mxCell id="6" value="Manual Review" style="rounded=0;" vertex="1" parent="1"><mxGeometry x="550" y="145" width="120" height="40" as="geometry"/></mxCell><mxCell id="7" value="DTI > 0.43?" style="rhombus;" vertex="1" parent="1"><mxGeometry x="330" y="240" width="120" height="80" as="geometry"/></mxCell></root></mxGraphModel>',
  },
  {
    diagramType: "USE_CASE",
    q: "A municipal waste management system involves three actors:\n(a) Residents: report missed pickups, request bulky-item collection, view their collection schedule, and pay waste levy online.\n(b) Collection Crew: view assigned routes, mark pickups as completed, report bin damage, and log vehicle maintenance issues.\n(c) Operations Manager: assign crews to routes, generate monthly collection reports, approve bulky-item requests, manage route schedules, and handle resident complaints.\n\nThe system includes these relationships:\n- \"Pay waste levy\" includes \"Verify payment\" as a sub-flow.\n- \"Report missed pickup\" extends \"Log complaint\" when the issue is recurring.\n- \"Generate monthly report\" includes \"Aggregate collection data\".\n\nModel the complete use case diagram with system boundary, all actors, use cases, and include/extend relationships.",
    instructions: "1. Draw a system boundary containing all use cases.\n2. Place actors outside the boundary with association lines to their use cases.\n3. Show «include» and «extend» relationships with dashed arrows.\n4. Group use cases logically within the boundary.",
    refJson: { title: "Municipal Waste Management", nodes: [{ key: "resident", label: "Resident", shape: "actor", lines: [] }, { key: "crew", label: "Collection Crew", shape: "actor", lines: [] }, { key: "manager", label: "Operations Manager", shape: "actor", lines: [] }, { key: "boundary", label: "Waste Management System", shape: "boundary", lines: [] }, { key: "report_missed", label: "Report Missed Pickup", shape: "usecase", lines: [] }, { key: "req_bulky", label: "Request Bulky-Item Collection", shape: "usecase", lines: [] }, { key: "view_schedule", label: "View Collection Schedule", shape: "usecase", lines: [] }, { key: "pay_levy", label: "Pay Waste Levy", shape: "usecase", lines: [] }, { key: "verify_pay", label: "Verify Payment", shape: "usecase", lines: [] }, { key: "view_routes", label: "View Assigned Routes", shape: "usecase", lines: [] }, { key: "mark_pickup", label: "Mark Pickup Completed", shape: "usecase", lines: [] }, { key: "report_damage", label: "Report Bin Damage", shape: "usecase", lines: [] }, { key: "log_maint", label: "Log Vehicle Maintenance", shape: "usecase", lines: [] }, { key: "assign_crew", label: "Assign Crews to Routes", shape: "usecase", lines: [] }, { key: "gen_report", label: "Generate Monthly Report", shape: "usecase", lines: [] }, { key: "approve_bulky", label: "Approve Bulky-Item Request", shape: "usecase", lines: [] }, { key: "manage_routes", label: "Manage Route Schedules", shape: "usecase", lines: [] }, { key: "handle_complaint", label: "Handle Resident Complaints", shape: "usecase", lines: [] }, { key: "log_complaint", label: "Log Complaint", shape: "usecase", lines: [] }, { key: "agg_data", label: "Aggregate Collection Data", shape: "usecase", lines: [] }], edges: [{ source: "resident", target: "report_missed", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "resident", target: "req_bulky", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "resident", target: "view_schedule", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "resident", target: "pay_levy", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "pay_levy", target: "verify_pay", kind: "dependency", label: "«include»", source_multiplicity: "", target_multiplicity: "" }, { source: "report_missed", target: "log_complaint", kind: "dependency", label: "«extend»", source_multiplicity: "", target_multiplicity: "" }, { source: "crew", target: "view_routes", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "crew", target: "mark_pickup", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "crew", target: "report_damage", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "crew", target: "log_maint", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "manager", target: "assign_crew", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "manager", target: "gen_report", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "manager", target: "approve_bulky", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "manager", target: "manage_routes", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "manager", target: "handle_complaint", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "gen_report", target: "agg_data", kind: "dependency", label: "«include»", source_multiplicity: "", target_multiplicity: "" }] },
    refXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="Waste Management System" style="shape=mxgraph.sysml.package;" vertex="1" parent="1"><mxGeometry x="150" y="20" width="500" height="500" as="geometry"/></mxCell><mxCell id="3" value="Resident" style="shape=umlActor;" vertex="1" parent="1"><mxGeometry x="30" y="100" width="30" height="50" as="geometry"/></mxCell><mxCell id="4" value="Collection Crew" style="shape=umlActor;" vertex="1" parent="1"><mxGeometry x="30" y="300" width="30" height="50" as="geometry"/></mxCell><mxCell id="5" value="Operations Manager" style="shape=umlActor;" vertex="1" parent="1"><mxGeometry x="720" y="200" width="30" height="50" as="geometry"/></mxCell></root></mxGraphModel>',
  },
  {
    diagramType: "ERD",
    q: "A clinical trials management system tracks the following:\n(a) Each ClinicalTrial has a protocol number, title, phase (I–IV), start date, and status (recruiting, active, completed, suspended).\n(b) A Trial has one PrincipalInvestigator (a Doctor) and multiple SiteLocations.\n(c) Each SiteLocation has an address, capacity, and a local ethics committee approval number.\n(d) Participants are enrolled at a specific site. Each enrollment records consent date, arm assignment (treatment vs placebo), and withdrawal date if applicable.\n(e) VisitRecords track each participant visit: date, vitals (blood pressure, heart rate, weight), adverse events noted, and the clinician who conducted the visit.\n(f) The system logs DrugDispensations: which drug batch, dosage, and timestamp per participant per visit.\n\nModel all entities, attributes, keys, and relationships with cardinality.",
    instructions: "1. Identify at least seven entities.\n2. Each entity must have a primary key and at least two non-key attributes.\n3. Show all relationships with cardinality (one-to-many, many-to-many where applicable).\n4. Indicate weak entities if any exist.",
    refJson: { title: "Clinical Trials Management", nodes: [{ key: "trial", label: "ClinicalTrial", shape: "box", lines: ["- protocolNo: varchar «PK»", "- title: varchar", "- phase: varchar", "- startDate: date", "- status: varchar"] }, { key: "doctor", label: "Doctor", shape: "box", lines: ["- doctorId: int «PK»", "- name: varchar", "- specialization: varchar"] }, { key: "site", label: "SiteLocation", shape: "box", lines: ["- siteId: int «PK»", "- address: varchar", "- capacity: int", "- ethicsApprovalNo: varchar"] }, { key: "participant", label: "Participant", shape: "box", lines: ["- participantId: int «PK»", "- name: varchar", "- dateOfBirth: date", "- gender: varchar"] }, { key: "enrollment", label: "Enrollment", shape: "box", lines: ["- enrollmentId: int «PK»", "- consentDate: date", "- armAssignment: varchar", "- withdrawalDate: date"] }, { key: "visit", label: "VisitRecord", shape: "box", lines: ["- visitId: int «PK»", "- visitDate: date", "- bloodPressure: varchar", "- heartRate: int", "- weight: decimal", "- adverseEvents: text"] }, { key: "dispensation", label: "DrugDispensation", shape: "box", lines: ["- dispensationId: int «PK»", "- drugBatch: varchar", "- dosage: varchar", "- timestamp: datetime"] }], edges: [{ source: "trial", target: "doctor", kind: "association", label: "led by", source_multiplicity: "0..*", target_multiplicity: "1" }, { source: "trial", target: "site", kind: "association", label: "conducted at", source_multiplicity: "1", target_multiplicity: "1..*" }, { source: "enrollment", target: "participant", kind: "association", label: "enrolls", source_multiplicity: "0..*", target_multiplicity: "1" }, { source: "enrollment", target: "site", kind: "association", label: "at site", source_multiplicity: "0..*", target_multiplicity: "1" }, { source: "enrollment", target: "trial", kind: "association", label: "for trial", source_multiplicity: "0..*", target_multiplicity: "1" }, { source: "visit", target: "enrollment", kind: "association", label: "under", source_multiplicity: "0..*", target_multiplicity: "1" }, { source: "visit", target: "doctor", kind: "association", label: "conducted by", source_multiplicity: "0..*", target_multiplicity: "1" }, { source: "dispensation", target: "visit", kind: "composition", label: "during", source_multiplicity: "0..*", target_multiplicity: "1" }] },
    refXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="ClinicalTrial\n─────────\nprotocolNo «PK»\ntitle\nphase\nstartDate\nstatus" style="shape=table;startSize=28;fontStyle=1;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="50" y="50" width="180" height="140" as="geometry"/></mxCell><mxCell id="3" value="Doctor\n─────────\ndoctorId «PK»\nname\nspecialization" style="shape=table;startSize=28;fontStyle=1;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="300" y="50" width="160" height="100" as="geometry"/></mxCell><mxCell id="4" value="SiteLocation\n─────────\nsiteId «PK»\naddress\ncapacity\nethicsApprovalNo" style="shape=table;startSize=28;fontStyle=1;align=left;spacingLeft=8;" vertex="1" parent="1"><mxGeometry x="520" y="50" width="180" height="120" as="geometry"/></mxCell></root></mxGraphModel>',
  },
  {
    diagramType: "UML_CLASS",
    q: "A smart building access control system manages the following:\n(a) Each Building has a name, address, and security level (low, medium, high).\n(b) Buildings contain multiple Floors, each with a floor number and wing designation.\n(c) Each Floor has multiple AccessPoints (doors, turnstiles, elevators) with a type and location description.\n(d) An AccessCard is issued to a Person (employee or visitor). Cards have a unique card number, issue date, expiry date, and status (active, suspended, expired).\n(e) AccessRules define which card types can use which access points during specific time windows (start time, end time, days of week).\n(f) Every access attempt is logged in an AccessLog: timestamp, card used, access point, and result (granted, denied, error).\n(g) The system supports AccessGroups — named groups of access points that can be assigned to cards in bulk.\n\nModel this as a class diagram with attributes, methods, and all relationships.",
    instructions: "1. Show all classes with typed attributes and visibility markers.\n2. Use composition for Building→Floor→AccessPoint hierarchy.\n3. Show the many-to-many between AccessCard and AccessGroup.\n4. Include at least one method per class.",
    refJson: { title: "Smart Building Access Control", nodes: [{ key: "building", label: "Building", shape: "box", lines: ["- name: String", "- address: String", "- securityLevel: SecurityLevel", "+ floorCount(): int"] }, { key: "floor", label: "Floor", shape: "box", lines: ["- floorNumber: int", "- wing: String", "+ accessPointCount(): int"] }, { key: "accesspoint", label: "AccessPoint", shape: "box", lines: ["- type: PointType", "- locationDesc: String", "- enabled: boolean", "+ isAccessible(): boolean"] }, { key: "card", label: "AccessCard", shape: "box", lines: ["- cardNumber: String", "- issueDate: Date", "- expiryDate: Date", "- status: CardStatus", "+ isValid(): boolean"] }, { key: "person", label: "Person", shape: "box", lines: ["- name: String", "- email: String", "- personType: PersonType", "+ getActiveCards(): List<AccessCard>"] }, { key: "rule", label: "AccessRule", shape: "box", lines: ["- startTime: Time", "- endTime: Time", "- daysOfWeek: Set<DayOfWeek>", "+ isCurrentlyActive(): boolean"] }, { key: "log", label: "AccessLog", shape: "box", lines: ["- timestamp: DateTime", "- result: AccessResult", "+ wasGranted(): boolean"] }, { key: "group", label: "AccessGroup", shape: "box", lines: ["- groupName: String", "- description: String", "+ memberCount(): int"] }], edges: [{ source: "building", target: "floor", kind: "composition", label: "contains", source_multiplicity: "1", target_multiplicity: "1..*" }, { source: "floor", target: "accesspoint", kind: "composition", label: "has", source_multiplicity: "1", target_multiplicity: "0..*" }, { source: "person", target: "card", kind: "association", label: "holds", source_multiplicity: "1", target_multiplicity: "0..*" }, { source: "card", target: "group", kind: "association", label: "belongs to", source_multiplicity: "0..*", target_multiplicity: "0..*" }, { source: "group", target: "accesspoint", kind: "association", label: "grants access to", source_multiplicity: "0..*", target_multiplicity: "0..*" }, { source: "rule", target: "accesspoint", kind: "association", label: "governs", source_multiplicity: "0..*", target_multiplicity: "1" }, { source: "rule", target: "card", kind: "association", label: "applies to", source_multiplicity: "0..*", target_multiplicity: "1" }, { source: "log", target: "card", kind: "association", label: "used", source_multiplicity: "0..*", target_multiplicity: "1" }, { source: "log", target: "accesspoint", kind: "association", label: "at", source_multiplicity: "0..*", target_multiplicity: "1" }] },
    refXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="Building\n─────────\n- name: String\n- address: String\n- securityLevel: SecurityLevel\n+ floorCount(): int" style="shape=table;startSize=28;fontStyle=1;align=left;" vertex="1" parent="1"><mxGeometry x="50" y="50" width="220" height="130" as="geometry"/></mxCell></root></mxGraphModel>',
  },
  {
    diagramType: "FLOWCHART",
    q: "An automated resume screening system processes applications as follows:\n(a) Receive resume and job posting ID.\n(b) Extract text from the resume (PDF or DOCX).\n(c) If extraction fails, mark as \"manual review needed\" and stop.\n(d) Parse the text into structured sections: education, experience, skills, certifications.\n(e) Score each section against the job posting requirements using weighted matching.\n(f) If the total score is above 80%, move to the \"shortlisted\" pool.\n(g) If between 50% and 80%, flag for recruiter review with the breakdown.\n(h) If below 50%, send an auto-rejection email to the candidate.\n(i) For shortlisted candidates, check for duplicate applications (same email in the last 6 months).\n(j) If a duplicate is found, merge with the existing application record.\n(k) Notify the hiring manager of all shortlisted candidates daily at 9 AM.\n\nModel the complete flow with all decision points and outcomes.",
    instructions: "1. Use standard flowchart shapes for each step type.\n2. Show all three scoring outcomes clearly.\n3. Include the duplicate-check sub-flow for shortlisted candidates.\n4. Mark the daily batch notification as a separate triggered process.",
    refJson: { title: "Resume Screening Pipeline", nodes: [{ key: "start", label: "Start", shape: "terminator", lines: [] }, { key: "receive", label: "Receive Resume + Job ID", shape: "action", lines: [] }, { key: "extract", label: "Extract Text", shape: "action", lines: [] }, { key: "extract_ok", label: "Extraction OK?", shape: "decision", lines: [] }, { key: "manual", label: "Mark Manual Review", shape: "action", lines: [] }, { key: "parse", label: "Parse Sections", shape: "action", lines: [] }, { key: "score", label: "Score Against Requirements", shape: "action", lines: [] }, { key: "check_score", label: "Score Range?", shape: "decision", lines: [] }, { key: "shortlist", label: "Move to Shortlisted Pool", shape: "action", lines: [] }, { key: "recruiter", label: "Flag for Recruiter Review", shape: "action", lines: [] }, { key: "reject", label: "Send Auto-Rejection Email", shape: "action", lines: [] }, { key: "dup_check", label: "Duplicate Application?", shape: "decision", lines: [] }, { key: "merge", label: "Merge with Existing Record", shape: "action", lines: [] }, { key: "notify", label: "Daily 9 AM: Notify Hiring Manager", shape: "action", lines: [] }, { key: "end", label: "End", shape: "terminator", lines: [] }], edges: [{ source: "start", target: "receive", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "receive", target: "extract", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "extract", target: "extract_ok", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "extract_ok", target: "manual", kind: "association", label: "no", source_multiplicity: "", target_multiplicity: "" }, { source: "extract_ok", target: "parse", kind: "association", label: "yes", source_multiplicity: "", target_multiplicity: "" }, { source: "parse", target: "score", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "score", target: "check_score", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "check_score", target: "shortlist", kind: "association", label: "> 80%", source_multiplicity: "", target_multiplicity: "" }, { source: "check_score", target: "recruiter", kind: "association", label: "50-80%", source_multiplicity: "", target_multiplicity: "" }, { source: "check_score", target: "reject", kind: "association", label: "< 50%", source_multiplicity: "", target_multiplicity: "" }, { source: "shortlist", target: "dup_check", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }, { source: "dup_check", target: "merge", kind: "association", label: "yes", source_multiplicity: "", target_multiplicity: "" }, { source: "dup_check", target: "notify", kind: "association", label: "no", source_multiplicity: "", target_multiplicity: "" }, { source: "merge", target: "notify", kind: "association", label: "", source_multiplicity: "", target_multiplicity: "" }] },
    refXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="Start" style="rounded=1;arcSize=50;" vertex="1" parent="1"><mxGeometry x="340" y="10" width="100" height="40" as="geometry"/></mxCell><mxCell id="3" value="Receive Resume" style="rounded=0;" vertex="1" parent="1"><mxGeometry x="310" y="70" width="160" height="40" as="geometry"/></mxCell><mxCell id="4" value="Extract Text" style="rounded=0;" vertex="1" parent="1"><mxGeometry x="330" y="130" width="120" height="40" as="geometry"/></mxCell><mxCell id="5" value="Extraction OK?" style="rhombus;" vertex="1" parent="1"><mxGeometry x="330" y="190" width="120" height="80" as="geometry"/></mxCell></root></mxGraphModel>',
  },
  {
    diagramType: "SEQUENCE_DIAGRAM",
    q: "A ride-sharing platform handles a ride request through the following interactions:\n(a) The Rider opens the app and sends a ride request to the MatchingService with pickup and destination coordinates.\n(b) The MatchingService queries the DriverLocationService for available drivers within a 5 km radius.\n(c) The DriverLocationService returns a ranked list of nearby drivers.\n(d) The MatchingService sends ride offers to the top 3 drivers simultaneously via the NotificationService.\n(e) The first driver to accept is confirmed. The MatchingService cancels the offers to the other drivers.\n(f) The MatchingService notifies the Rider with the driver's details and ETA.\n(g) The PricingService calculates the estimated fare based on distance, time, and surge multiplier.\n(h) The Rider confirms the fare.\n(i) The MatchingService creates a Trip record in the TripService.\n(j) The TripService starts tracking the driver's location in real-time.\n\nModel the full message sequence including the parallel driver notifications and the cancellation flow.",
    instructions: "1. Include all six participants.\n2. Show the parallel notification to 3 drivers using a par fragment.\n3. Show the cancellation messages to non-accepting drivers.\n4. Number all messages sequentially.",
    refJson: { title: "Ride Request Flow", nodes: [{ key: "rider", label: "Rider", shape: "actor", lines: [] }, { key: "matching", label: "MatchingService", shape: "box", lines: [] }, { key: "location", label: "DriverLocationService", shape: "box", lines: [] }, { key: "notification", label: "NotificationService", shape: "box", lines: [] }, { key: "pricing", label: "PricingService", shape: "box", lines: [] }, { key: "trip", label: "TripService", shape: "box", lines: [] }], edges: [{ source: "rider", target: "matching", kind: "association", label: "1: requestRide(pickup, dest)", source_multiplicity: "", target_multiplicity: "" }, { source: "matching", target: "location", kind: "association", label: "2: findNearbyDrivers(pickup, 5km)", source_multiplicity: "", target_multiplicity: "" }, { source: "location", target: "matching", kind: "association", label: "3: rankedDrivers[]", source_multiplicity: "", target_multiplicity: "" }, { source: "matching", target: "notification", kind: "association", label: "4: sendOffers(top3Drivers)", source_multiplicity: "", target_multiplicity: "" }, { source: "notification", target: "matching", kind: "association", label: "5: driverAccepted(driverId)", source_multiplicity: "", target_multiplicity: "" }, { source: "matching", target: "notification", kind: "association", label: "6: cancelOffers(otherDrivers)", source_multiplicity: "", target_multiplicity: "" }, { source: "matching", target: "rider", kind: "association", label: "7: rideConfirmed(driverDetails, ETA)", source_multiplicity: "", target_multiplicity: "" }, { source: "matching", target: "pricing", kind: "association", label: "8: calculateFare(distance, time, surge)", source_multiplicity: "", target_multiplicity: "" }, { source: "pricing", target: "matching", kind: "association", label: "9: estimatedFare", source_multiplicity: "", target_multiplicity: "" }, { source: "matching", target: "rider", kind: "association", label: "10: showFareEstimate", source_multiplicity: "", target_multiplicity: "" }, { source: "rider", target: "matching", kind: "association", label: "11: confirmFare", source_multiplicity: "", target_multiplicity: "" }, { source: "matching", target: "trip", kind: "association", label: "12: createTrip(rider, driver, route)", source_multiplicity: "", target_multiplicity: "" }, { source: "trip", target: "location", kind: "association", label: "13: startTracking(driverId)", source_multiplicity: "", target_multiplicity: "" }] },
    refXml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="Rider" style="shape=umlActor;" vertex="1" parent="1"><mxGeometry x="50" y="30" width="30" height="50" as="geometry"/></mxCell><mxCell id="3" value="MatchingService" style="shape=box;" vertex="1" parent="1"><mxGeometry x="170" y="30" width="130" height="40" as="geometry"/></mxCell><mxCell id="4" value="DriverLocationService" style="shape=box;" vertex="1" parent="1"><mxGeometry x="350" y="30" width="150" height="40" as="geometry"/></mxCell><mxCell id="5" value="NotificationService" style="shape=box;" vertex="1" parent="1"><mxGeometry x="550" y="30" width="140" height="40" as="geometry"/></mxCell><mxCell id="6" value="PricingService" style="shape=box;" vertex="1" parent="1"><mxGeometry x="740" y="30" width="120" height="40" as="geometry"/></mxCell><mxCell id="7" value="TripService" style="shape=box;" vertex="1" parent="1"><mxGeometry x="910" y="30" width="100" height="40" as="geometry"/></mxCell></root></mxGraphModel>',
  },
]

const MCQ_QUESTIONS = [
  { q: "A web application stores session tokens in localStorage and sends them via custom HTTP headers. An attacker injects a script through an unescaped comment field. Which vulnerability class does this exploit, and why is localStorage particularly dangerous here?", choices: ["XSS — scripts in the same origin can read localStorage and exfiltrate the token", "CSRF — the browser automatically attaches the token to cross-origin requests", "SQL injection — the comment field directly queries the database", "Clickjacking — the attacker overlays a hidden iframe to capture clicks"], correct: 0 },
  { q: "A database query plan shows a sequential scan on a table with 2 million rows, even though an index exists on the filtered column. The WHERE clause uses WHERE UPPER(email) = 'TEST@EXAMPLE.COM'. What is the most likely reason the index is not used?", choices: ["The function UPPER() prevents the planner from matching the B-tree index on the raw column", "The table statistics are outdated and the planner underestimates selectivity", "The index was created as a partial index that excludes uppercase values", "PostgreSQL always prefers sequential scans on tables under 5 million rows"], correct: 0 },
  { q: "In a microservices architecture, Service A calls Service B synchronously. Service B's response time degrades from 50ms to 12 seconds under load. Service A has no timeout configured. What failure pattern will most likely cascade through the system?", choices: ["Thread pool exhaustion in Service A as all threads block waiting for Service B", "Service A will automatically fail fast due to TCP keepalive defaults", "The load balancer will detect the latency and reroute traffic instantly", "Service B's slowdown is isolated and cannot affect Service A's throughput"], correct: 0 },
  { q: "A Docker container runs as root inside the container. An attacker exploits an RCE vulnerability in the application. Which of the following is the most significant security risk if no additional protections are configured?", choices: ["Container escape — root in the container maps to root on the host with default seccomp/AppArmor profiles", "The attacker can only access files inside the container's filesystem layer", "Docker's default network isolation prevents any lateral movement", "The container automatically restarts, eliminating persistent access"], correct: 0 },
  { q: "A team uses optimistic locking with a version column. Two users load the same record (version 5), make different edits, and submit simultaneously. User A's update succeeds (version becomes 6). What happens when User B's update arrives?", choices: ["The update fails with an OptimisticLockException because the WHERE clause checks version = 5, which no longer matches", "User B's changes silently overwrite User A's because the primary key still matches", "The database merges both changes automatically using the version column as a conflict marker", "The transaction deadlocks because both users hold read locks on the same row"], correct: 0 },
  { q: "A REST API returns paginated results using offset-based pagination (LIMIT/OFFSET). When a new record is inserted while a client is paginating through results, what data integrity issue can occur?", choices: ["The client may see duplicate records because the inserted row shifts subsequent pages forward", "The client will receive an error on the next page request", "The API automatically adjusts offsets to account for new insertions", "Offset pagination is immune to concurrent modifications due to MVCC"], correct: 0 },
  { q: "A Python application uses a global list as a cache shared between threads. Multiple threads append to and read from this list without any synchronization. In CPython, which statement is most accurate?", choices: ["Individual append operations are thread-safe due to the GIL, but check-then-act patterns (e.g., if not in list: append) are still racy", "The list is fully thread-safe because the GIL prevents all data races", "List operations will corrupt memory and cause segmentation faults", "Only read operations are safe; any write operation requires explicit locking"], correct: 0 },
  { q: "A CI pipeline runs unit tests in parallel across 4 workers. Tests pass individually but intermittently fail when run together. The failures always involve tests that write to a shared temp directory using fixed filenames. What type of test quality issue is this?", choices: ["Test pollution — shared mutable state between tests creates order-dependent behavior", "Flaky network — the tests depend on an external service that is intermittently unavailable", "Resource exhaustion — parallel execution exceeds the system's file descriptor limit", "Non-deterministic assertion — the test logic relies on random number generation"], correct: 0 },
  { q: "A React component fetches data in useEffect and stores it in state. When the component unmounts before the fetch completes, a \"Can't perform a React state update on an unmounted component\" warning appears. What is the correct fix?", choices: ["Use an AbortController to cancel the fetch in the useEffect cleanup function", "Wrap the setState call in a try-catch to suppress the warning", "Move the fetch call to componentDidMount instead of useEffect", "Add the state setter to the useEffect dependency array"], correct: 0 },
  { q: "A Kubernetes pod has a liveness probe configured with an HTTP GET to /health, initialDelaySeconds: 5, and periodSeconds: 3. The application takes 30 seconds to start. What will happen?", choices: ["Kubernetes will kill and restart the pod repeatedly because the liveness probe fails during startup before the app is ready", "Kubernetes waits for the readiness probe before checking liveness", "The initialDelaySeconds prevents any probe checks for the first 5 seconds, then the app has unlimited time to respond", "Liveness probes only run after the first successful readiness probe by default"], correct: 0 },
  { q: "A distributed system uses eventual consistency. Service A writes a record, then immediately reads it from a replica. The read returns stale data. Which consistency guarantee would prevent this specific issue with the least performance impact?", choices: ["Read-your-writes consistency — ensures a process always sees its own writes", "Strong consistency — all reads see the latest write globally", "Causal consistency — all causally related operations are seen in order by all nodes", "Linearizability — every operation appears to execute atomically at some point between invocation and response"], correct: 0 },
  { q: "A Java application under load shows increasing GC pause times. Heap dumps reveal that 80% of the old generation is occupied by cached String objects from HTTP response parsing. What is the most effective solution?", choices: ["Introduce a bounded cache with an eviction policy (e.g., LRU with a max size) and use weak references for cache entries", "Increase the heap size to accommodate the growing cache", "Switch from CMS to G1 garbage collector for better pause time management", "Call System.gc() periodically to force collection of unused strings"], correct: 0 },
  { q: "A team implements a JWT-based authentication system. The access token is stored in an httpOnly cookie, and the refresh token is stored in localStorage. Which security weakness does this design introduce?", choices: ["The refresh token in localStorage is vulnerable to XSS — a malicious script can steal it and obtain new access tokens indefinitely", "The access token in an httpOnly cookie is vulnerable to CSRF attacks when used with same-site=None", "Both tokens are equally protected because they use the same encryption algorithm", "The refresh token is safe in localStorage because it cannot be accessed by browser extensions"], correct: 0 },
  { q: "A PostgreSQL query joins three tables and takes 8 seconds. The EXPLAIN ANALYZE output shows a nested loop join with an inner sequential scan processing 500,000 rows per outer row. What optimization would most likely have the greatest impact?", choices: ["Add an index on the inner table's join column so the nested loop uses an index scan instead of a sequential scan", "Rewrite the query to use subqueries instead of joins", "Increase work_mem to allow the planner to use a hash join", "Add LIMIT 1000 to reduce the result set"], correct: 0 },
  { q: "In a Git repository, a developer runs `git rebase main` on their feature branch. During the rebase, they encounter merge conflicts in 3 files. After resolving conflicts, they accidentally run `git rebase --skip` instead of `git rebase --continue`. What is the consequence?", choices: ["The current commit is discarded entirely — all changes in that commit, including the resolved conflicts, are lost", "The conflicts are marked as resolved using the main branch's version automatically", "The rebase pauses again to re-prompt for conflict resolution", "The skip command only skips the conflicting hunks while preserving non-conflicting changes in the commit"], correct: 0 },
  { q: "A load-balanced web application uses sticky sessions (session affinity) based on client IP. A corporate client reports that some users are randomly logged out. Investigation reveals the corporation uses a NAT gateway with 4 public IP addresses. What is happening?", choices: ["Consecutive requests from the same user may route to different servers because the source IP changes between the 4 NAT addresses", "The session timeout is too short for corporate networks with higher latency", "Sticky sessions based on IP always work correctly with NAT because the gateway IP is consistent", "The load balancer is ignoring the session affinity configuration"], correct: 0 },
  { q: "A Node.js Express application handles file uploads. The endpoint reads the entire file into memory before writing it to disk. During a load test with 100 concurrent 50MB uploads, the application crashes. What is the root cause and the correct architectural fix?", choices: ["Memory exhaustion from buffering all files simultaneously — use streams to pipe the upload directly to disk without loading it into memory", "The event loop blocks during file writes, causing a timeout cascade", "Node.js has a hard limit of 10 concurrent file operations that causes queuing failures", "The Express body parser rejects files over 10MB by default"], correct: 0 },
  { q: "A team deploys a canary release: 5% of traffic goes to the new version. Monitoring shows the canary has a 2% error rate vs 0.1% for the stable version. The errors are all 500s from a null pointer in a code path that only executes for premium users. What is the correct action?", choices: ["Roll back the canary immediately — a 20x error rate increase indicates a regression, even though it only affects a subset of users", "Keep the canary running to gather more data since 5% traffic is statistically insignificant", "Increase canary traffic to 50% to confirm the issue affects premium users consistently", "Ignore the error rate difference because 2% is within acceptable SLA thresholds"], correct: 0 },
  { q: "A SQL query uses SELECT * FROM orders WHERE status IN ('pending', 'processing') ORDER BY created_at DESC LIMIT 20. The orders table has 10 million rows, a composite index on (status, created_at), and 95% of rows have status 'completed'. Why does this query perform well despite the large table?", choices: ["The composite index allows an index-only backward scan: it seeks to the two status values and walks created_at in descending order, stopping after 20 rows", "The query performs a full table scan but filters quickly because 'pending' and 'processing' are short strings", "The LIMIT 20 causes PostgreSQL to use a top-N heap sort regardless of the index", "IN clauses always trigger a sequential scan because the planner cannot merge multiple index ranges"], correct: 0 },
  { q: "A developer notices that a Python dictionary comprehension {k: v for k, v in pairs} preserves insertion order, and relies on this in production logic. Which statement is correct about the reliability of this behavior?", choices: ["Safe from Python 3.7+ — insertion order preservation is part of the language specification, not just a CPython implementation detail", "Unsafe — dictionary ordering is an implementation detail of CPython and is not guaranteed by any Python version", "Safe only in CPython — other implementations like PyPy do not guarantee ordering", "Ordering was guaranteed starting from Python 3.0 as part of the dict rewrite"], correct: 0 },
  { q: "A Terraform plan shows that modifying a security group's ingress rules will trigger a destroy-and-recreate of the security group. Other resources reference this security group by ID. What is the risk, and how should the team mitigate it?", choices: ["All referencing resources will lose their security group association during the recreate window — use lifecycle { create_before_destroy = true } to create the new group before destroying the old one", "Terraform automatically updates all references to point to the new security group ID", "The destroy-and-recreate is instantaneous so there is no downtime risk", "Security groups cannot be destroyed while they are referenced by other resources"], correct: 0 },
  { q: "A message queue consumer processes messages and acknowledges them after completing the work. If the consumer crashes between completing the work and sending the acknowledgment, what problem occurs, and what is the standard solution?", choices: ["The message is redelivered, causing duplicate processing — design the consumer to be idempotent so reprocessing the same message produces the same result", "The message is lost permanently because the broker assumes it was processed", "The broker automatically detects the crash and marks the message as completed", "The message remains in the queue indefinitely and blocks all subsequent messages"], correct: 0 },
  { q: "A team migrates a monolith to microservices. The monolith used database transactions to ensure consistency between orders and inventory. In the microservices version, these are separate services with separate databases. What pattern should replace the database transaction?", choices: ["The Saga pattern — a sequence of local transactions with compensating actions to undo completed steps if a later step fails", "Distributed two-phase commit (2PC) across both databases for strong consistency", "Eventually consistent reads with no coordination, relying on the UI to refresh", "A shared database between the two services to maintain transactional guarantees"], correct: 0 },
  { q: "A REST API endpoint accepts a JSON body with a nested object. The server-side DTO uses @NotNull validation on a field that is always overwritten by the server (e.g., createdBy from the JWT). Clients that omit this field receive a 400 error. What is the architectural issue?", choices: ["The validation runs before the server-side enrichment — the @NotNull annotation rejects the request before the field can be populated from the JWT", "The client should always send the field even though the server overwrites it", "The @NotNull annotation only validates on database persistence, not on request binding", "The issue is in the JSON deserializer, not the validation layer"], correct: 0 },
  { q: "An application uses connection pooling with a maximum of 20 database connections. Under load, threads start timing out waiting for a connection. Monitoring shows all 20 connections are \"in use\" but the database reports them as idle. What is the most likely cause?", choices: ["Connection leaks — application code acquires connections but fails to release them back to the pool (e.g., missing finally/try-with-resources blocks)", "The database is throttling connections to 20 as a protective measure", "The connection pool is misconfigured to never reclaim idle connections", "Network latency between the application and database prevents connection reuse"], correct: 0 },
  { q: "A frontend SPA fetches user data from /api/users/me on every page navigation. The API response includes sensitive fields (SSN, salary) that are only displayed on the profile settings page. What is the security concern with this approach?", choices: ["Over-fetching sensitive data exposes it in browser dev tools, network logs, and browser extensions on every page — serve a minimal DTO and a separate endpoint for sensitive fields", "There is no concern because HTTPS encrypts the data in transit", "The browser automatically redacts sensitive fields from the network tab", "Client-side filtering of the response before rendering is sufficient protection"], correct: 0 },
  { q: "A CI/CD pipeline runs database migrations before deploying the new application version. A migration adds a NOT NULL column without a default value to a table with 5 million rows. What will happen in PostgreSQL?", choices: ["The migration acquires an ACCESS EXCLUSIVE lock on the entire table, blocking all reads and writes for the duration of the rewrite — use ADD COLUMN with a DEFAULT to avoid the table rewrite in PG 11+", "PostgreSQL adds the column instantly regardless of the NOT NULL constraint", "The migration runs in the background without blocking other operations", "Only INSERT operations are blocked; SELECT and UPDATE continue normally"], correct: 0 },
  { q: "A distributed caching layer uses a write-through strategy: every write updates both the cache and the database. Under high write throughput, the system experiences increased latency. What is the primary performance bottleneck of write-through caching?", choices: ["Every write operation incurs the latency of both the cache update and the database write synchronously, doubling write latency", "The cache evicts entries too aggressively under write pressure", "Write-through caching causes cache stampede when multiple writers update the same key", "The database rejects writes that come from the cache layer due to connection limits"], correct: 0 },
  { q: "A Kubernetes deployment has replicas: 3 and a PodDisruptionBudget with minAvailable: 2. During a node drain for maintenance, what behavior does the PDB enforce?", choices: ["The drain evicts at most 1 pod at a time, ensuring at least 2 replicas remain running — if no other node can schedule the pod, the drain blocks", "The drain ignores the PDB and evicts all pods on the node simultaneously", "The PDB only affects voluntary disruptions like scaling down, not node drains", "Kubernetes automatically scales the deployment to 4 replicas before draining"], correct: 0 },
  { q: "A Python function uses a mutable default argument: def add_item(item, items=[]). A developer calls add_item('a'), then add_item('b') without providing the items argument. What does the second call return?", choices: ["['a', 'b'] — the default list is created once at function definition time and shared across all calls that use the default", "['b'] — each call creates a fresh empty list as the default", "An error because the list was already modified by the first call", "['a'] — the second call overwrites the list with only the new item"], correct: 0 },
]

async function createQuestion(text, type, lessonId, certificationId) {
  return base("questions", {
    method: "POST",
    data: {
      questionType: type,
      difficultyLevel: "average",
      questionText: text,
      lessonId,
      certificationId,
    },
  })
}

async function createProgrammingConfig(questionId, starter, testCases, language) {
  return base("programming-question-configs", {
    method: "POST",
    data: {
      questionId,
      starterCode: starter,
      language: language || "PYTHON",
      testCases: testCases.map((tc) => ({
        inputData: tc.i,
        expectedOutput: tc.o,
      })),
    },
  })
}

async function createDiagramConfig(questionId, template) {
  return base("diagram-question-configs", {
    method: "POST",
    data: {
      questionId,
      diagramType: template.diagramType,
      instructions: template.instructions,
      referenceDiagramXml: template.refXml,
      referenceDiagramJson: JSON.stringify(template.refJson),
    },
  })
}

async function createChoices(questionId, choices, correctIndex) {
  for (let i = 0; i < choices.length; i++) {
    await base("choices", {
      method: "POST",
      data: {
        questionId,
        choiceText: choices[i],
        correct: i === correctIndex,
        explanation: i === correctIndex ? "This is the correct answer." : "",
      },
    })
  }
}

export default function SeedChallengesPage() {
  const [certificationId, setCertificationId] = useState("")
  const [seeding, setSeeding] = useState(null)
  const [progress, setProgress] = useState({ done: 0, total: 0, label: "" })

  const { data: certifications = [] } = useQuery({
    queryKey: ["admin-certifications"],
    queryFn: () => getAllCertifications(),
    staleTime: 60_000,
  })

  const lessons = useMemo(() => {
    const cert = certifications.find(
      (c) => String(c.certificationId) === String(certificationId),
    )
    return (cert?.majorCategory ?? []).flatMap((major) =>
      (major.middleCategory ?? []).flatMap((middle) => middle.lessons ?? []),
    )
  }, [certifications, certificationId])

  const lessonId = lessons[0]?.lessonId ?? null

  const seedCodeStrike = useCallback(async () => {
    if (!certificationId || !lessonId) return
    setSeeding("codestrike")
    const total = NODES * QUESTIONS_PER_NODE
    setProgress({ done: 0, total, label: "Creating programming questions..." })
    const batch = Date.now()

    try {
      const problems = []
      for (let node = 1; node <= NODES; node++) {
        for (let i = 0; i < QUESTIONS_PER_NODE; i++) {
          const qi = ((node - 1) * QUESTIONS_PER_NODE + i) % PROGRAMMING_TEMPLATES.length
          const template = PROGRAMMING_TEMPLATES[qi]
          const text = `[CS-${batch}-N${node}-P${i + 1}] ${template.q}`

          const saved = await createQuestion(text, "CRITICAL_THINKING", lessonId, Number(certificationId))
          await createProgrammingConfig(saved.questionId, template.starter, template.cases, template.lang)

          problems.push({
            questionId: saved.questionId,
            nodeIndex: node,
            points: 10,
          })
          setProgress((p) => ({ ...p, done: p.done + 1 }))
        }
      }

      setProgress((p) => ({ ...p, label: "Saving arena..." }))
      await saveArenaProblems("codestrike", {
        certificationId: Number(certificationId),
        problems,
      })
      toast.success(`CodeStrike seeded with ${total} problems`)
    } catch (err) {
      toast.error("CodeStrike seed failed", {
        description: err?.response?.data?.message ?? err?.message,
      })
    } finally {
      setSeeding(null)
    }
  }, [certificationId, lessonId])

  const seedBlueprint = useCallback(async () => {
    if (!certificationId || !lessonId) return
    setSeeding("blueprint")
    const total = NODES * QUESTIONS_PER_NODE
    setProgress({ done: 0, total, label: "Creating diagram questions..." })
    const batch = Date.now()

    try {
      const problems = []
      for (let node = 1; node <= NODES; node++) {
        for (let i = 0; i < QUESTIONS_PER_NODE; i++) {
          const si = ((node - 1) * QUESTIONS_PER_NODE + i) % DIAGRAM_TEMPLATES.length
          const template = DIAGRAM_TEMPLATES[si]
          const text = `[BP-${batch}-N${node}-P${i + 1}] ${template.q}`

          const saved = await createQuestion(text, "CRITICAL_THINKING", lessonId, Number(certificationId))
          await createDiagramConfig(saved.questionId, template)

          problems.push({
            questionId: saved.questionId,
            nodeIndex: node,
            points: 10,
          })
          setProgress((p) => ({ ...p, done: p.done + 1 }))
        }
      }

      setProgress((p) => ({ ...p, label: "Saving arena..." }))
      await saveArenaProblems("blueprint", {
        certificationId: Number(certificationId),
        problems,
      })
      toast.success(`Blueprint Arena seeded with ${total} problems`)
    } catch (err) {
      toast.error("Blueprint seed failed", {
        description: err?.response?.data?.message ?? err?.message,
      })
    } finally {
      setSeeding(null)
    }
  }, [certificationId, lessonId])

  const seedChampionsCup = useCallback(async () => {
    if (!certificationId || !lessonId) return
    setSeeding("worldcup")
    const questionsPerStage = 10
    const stageCount = 3
    const total = questionsPerStage * stageCount
    setProgress({ done: 0, total, label: "Creating MCQ questions..." })
    const batch = Date.now()

    try {
      const allIds = []
      for (let i = 0; i < total; i++) {
        const template = MCQ_QUESTIONS[i % MCQ_QUESTIONS.length]
        const text = `[CC-${batch}-Q${i + 1}] ${template.q}`

        const saved = await createQuestion(text, "MCQ", lessonId, Number(certificationId))
        await createChoices(saved.questionId, template.choices, template.correct)
        allIds.push(saved.questionId)
        setProgress((p) => ({ ...p, done: p.done + 1 }))
      }

      setProgress((p) => ({ ...p, label: "Creating weekly edition..." }))
      const today = new Date()
      const monday = new Date(today)
      monday.setDate(today.getDate() - today.getDay() + 1)
      const weekStart = monday.toISOString().split("T")[0]

      const edition = await createWorldCupEdition({
        weekStart,
        certificationId: Number(certificationId),
        lessonId,
      })

      setProgress((p) => ({ ...p, label: "Assigning stages..." }))
      await saveWorldCupEditionStages(edition.editionId ?? edition.id, {
        quarterfinal: allIds.slice(0, questionsPerStage),
        semifinal: allIds.slice(questionsPerStage, questionsPerStage * 2),
        final: allIds.slice(questionsPerStage * 2, questionsPerStage * 3),
      })

      setProgress((p) => ({ ...p, label: "Publishing edition..." }))
      await publishWorldCupEdition(edition.editionId ?? edition.id)

      toast.success(`Champions Cup seeded with ${total} MCQ questions and published`)
    } catch (err) {
      toast.error("Champions Cup seed failed", {
        description: err?.response?.data?.message ?? err?.message,
      })
    } finally {
      setSeeding(null)
    }
  }, [certificationId, lessonId])

  const seedAll = useCallback(async () => {
    await seedCodeStrike()
    await seedBlueprint()
    await seedChampionsCup()
  }, [seedCodeStrike, seedBlueprint, seedChampionsCup])

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto pb-10">
      <div className="border-b border-border pb-4">
        <h1 className="font-rb-display text-2xl font-extrabold lowercase">
          seed challenges
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Auto-generate test questions for all three arenas. Pick a certification, then seed.
        </p>
      </div>

      <div className="max-w-md space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Certification</label>
          <Select value={certificationId} onValueChange={setCertificationId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a certification" />
            </SelectTrigger>
            <SelectContent>
              {certifications.map((cert) => (
                <SelectItem
                  key={cert.certificationId}
                  value={String(cert.certificationId)}
                >
                  {cert.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {certificationId && lessonId ? (
          <p className="text-sm text-muted-foreground">
            Using lesson: <span className="font-medium">{lessons[0]?.name}</span> (id: {lessonId})
          </p>
        ) : certificationId ? (
          <p className="text-sm text-destructive">
            This certification has no lessons. Pick another.
          </p>
        ) : null}
      </div>

      {seeding ? (
        <div className="max-w-md space-y-2 rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="size-4 animate-spin" />
            {progress.label}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {progress.done} / {progress.total} ({pct}%)
          </p>
        </div>
      ) : null}

      <div className="grid max-w-3xl gap-4 md:grid-cols-2">
        <button
          onClick={seedCodeStrike}
          disabled={!certificationId || !lessonId || seeding}
          className="flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rb-macaw-wash text-rb-macaw-lip">
            <Code2 className="size-5" />
          </div>
          <div>
            <div className="font-semibold">Seed CodeStrike</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {NODES * QUESTIONS_PER_NODE} programming problems across {NODES} nodes
            </div>
          </div>
        </button>

        <button
          onClick={seedBlueprint}
          disabled={!certificationId || !lessonId || seeding}
          className="flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rb-beetle-wash text-rb-beetle-lip">
            <Network className="size-5" />
          </div>
          <div>
            <div className="font-semibold">Seed Blueprint Arena</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {NODES * QUESTIONS_PER_NODE} diagram problems ({DIAGRAM_TEMPLATES.length} types) across {NODES} nodes
            </div>
          </div>
        </button>

        <button
          onClick={seedChampionsCup}
          disabled={!certificationId || !lessonId || seeding}
          className="flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rb-bee-wash text-rb-bee-ink">
            <Trophy className="size-5" />
          </div>
          <div>
            <div className="font-semibold">Seed Champions Cup</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              30 MCQ questions (10 per stage), create and publish this week&rsquo;s edition
            </div>
          </div>
        </button>

        <button
          onClick={seedAll}
          disabled={!certificationId || !lessonId || seeding}
          className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Play className="size-5" />
          </div>
          <div>
            <div className="font-semibold">Seed All Arenas</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              Run all three in sequence — {NODES * QUESTIONS_PER_NODE * 2 + 30} questions total
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

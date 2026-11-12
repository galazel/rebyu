"""SQL versions: a scenario, its tables (CREATE TABLE + INSERT), and ONE statement the learner writes. The statement
is never run for the learner; it is compared with `statement` (see SqlStatementGrading). Here it is executed on the
tables and must return `rows` exactly."""

QUESTIONS = {
    2807: dict(
        intro="KPIs Needing Attention\n\nA service desk tracks its key performance indicators in the table `kpi`: each "
              "row has the KPI's name, its target and its current value. Management wants a list of the KPIs that are "
              "falling well short of target.",
        rules="Write a SELECT that returns the `name` of every KPI whose `current_value` is less than 90% of its "
              "`target` (current_value < 0.9 * target), in `kpi_id` order. One column, `name`.",
        tables='''CREATE TABLE kpi (kpi_id INTEGER PRIMARY KEY, name TEXT NOT NULL, target REAL NOT NULL, current_value REAL NOT NULL);
INSERT INTO kpi (kpi_id, name, target, current_value) VALUES
  (1, 'Customer Satisfaction', 85, 76),
  (2, 'Server Uptime', 99.9, 99.8),
  (3, 'Tickets Closed', 200, 150),
  (4, 'First Response', 100, 90),
  (5, 'Knowledge Articles', 40, 35.9),
  (6, 'Escalation Rate Met', 50, 51);''',
        statement='''SELECT name
FROM kpi
WHERE current_value < 0.9 * target
ORDER BY kpi_id;''',
        rows=[('Customer Satisfaction',), ('Tickets Closed',), ('Knowledge Articles',)]),

    2808: dict(
        intro="KPI Summary\n\nThe performance dashboard needs one summary row counting how the KPIs in the table `kpi` "
              "stand against their targets.",
        rules="A KPI is on target when `current_value >= target_value`, slightly below when it is below target but at "
              "least 90% of it, and well below otherwise. Write a SELECT that returns ONE row with three columns, in "
              "this order: `on_target`, `slightly_below`, `well_below` -- the number of KPIs in each band.",
        tables='''CREATE TABLE kpi (kpi_id INTEGER PRIMARY KEY, name TEXT NOT NULL, current_value REAL NOT NULL, target_value REAL NOT NULL);
INSERT INTO kpi (kpi_id, name, current_value, target_value) VALUES
  (1, 'Sales', 110, 100),
  (2, 'Support Tickets', 90, 100),
  (3, 'Response Time', 85, 100),
  (4, 'Renewals', 100, 100),
  (5, 'Churn', 89.9, 100),
  (6, 'NPS', 45, 50);''',
        statement='''SELECT SUM(CASE WHEN current_value >= target_value THEN 1 ELSE 0 END) AS on_target,
       SUM(CASE WHEN current_value < target_value AND current_value >= 0.9 * target_value THEN 1 ELSE 0 END) AS slightly_below,
       SUM(CASE WHEN current_value < 0.9 * target_value THEN 1 ELSE 0 END) AS well_below
FROM kpi;''',
        rows=[(2, 2, 2)]),

    2830: dict(
        intro="Complaint Resolution Rates\n\nAn online retailer logs every customer complaint in the table `complaint` "
              "with its category and its status ('resolved', 'open', 'escalated', ...). The customer-care manager wants "
              "to see, per category, what share of complaints has been resolved.",
        rules="Write a SELECT that returns one row per category with two columns, `category` and `resolution_rate` -- "
              "the fraction of that category's complaints whose status is 'resolved', rounded to 2 decimal places "
              "(0.0 to 1.0). Order by `resolution_rate` from highest to lowest, ties by `category`.",
        tables='''CREATE TABLE complaint (complaint_id INTEGER PRIMARY KEY, category TEXT NOT NULL, date_received TEXT NOT NULL, date_resolved TEXT, status TEXT NOT NULL);
INSERT INTO complaint (complaint_id, category, date_received, date_resolved, status) VALUES
  (1, 'Delivery', '2023-01-01', '2023-01-03', 'resolved'),
  (2, 'Product', '2023-01-02', NULL, 'open'),
  (3, 'Delivery', '2023-01-04', '2023-01-05', 'resolved'),
  (4, 'Product', '2023-01-05', '2023-01-07', 'resolved'),
  (5, 'Product', '2023-01-06', NULL, 'open'),
  (6, 'Billing', '2023-01-08', NULL, 'escalated'),
  (7, 'Website', '2023-01-09', '2023-01-09', 'resolved'),
  (8, 'Delivery', '2023-01-10', NULL, 'open');''',
        statement='''SELECT category,
       ROUND(AVG(CASE WHEN status = 'resolved' THEN 1.0 ELSE 0.0 END), 2) AS resolution_rate
FROM complaint
GROUP BY category
ORDER BY resolution_rate DESC, category;''',
        rows=[('Website', 1.0), ('Delivery', 0.67), ('Product', 0.33), ('Billing', 0.0)]),

    2782: dict(
        intro="SLA Breaches\n\nAn IT department records, for each service in the table `service`, its SLA uptime target "
              "and the uptime actually achieved this month (both percentages). The service manager needs the list of "
              "breaches, worst first.",
        rules="A service breaches its SLA when `actual_uptime < sla_target`. Write a SELECT that returns the breaching "
              "services with two columns, `name` and `shortfall` (sla_target - actual_uptime, rounded to 2 decimal "
              "places), ordered by `shortfall` from largest to smallest, ties by `name`.",
        tables='''CREATE TABLE service (service_id INTEGER PRIMARY KEY, name TEXT NOT NULL, sla_target REAL NOT NULL, actual_uptime REAL NOT NULL);
INSERT INTO service (service_id, name, sla_target, actual_uptime) VALUES
  (1, 'Email', 99.9, 99.95),
  (2, 'CRM', 99.5, 98.7),
  (3, 'VPN', 99.0, 99.0),
  (4, 'Payroll', 99.9, 99.1),
  (5, 'Intranet', 98.0, 97.2),
  (6, 'Web Shop', 99.95, 99.9);''',
        statement='''SELECT name, ROUND(sla_target - actual_uptime, 2) AS shortfall
FROM service
WHERE actual_uptime < sla_target
ORDER BY shortfall DESC, name;''',
        rows=[('CRM', 0.8), ('Intranet', 0.8), ('Payroll', 0.8), ('Web Shop', 0.05)]),

    2828: dict(
        intro="Worst Delayed Department\n\nA warehouse logs every order in the table `orders` with the time it was "
              "received, the time processing finished, the department that handled it and its status. Operations wants "
              "to know which department causes the longest delays.",
        rules="For orders whose status is 'delayed', the delay is processing_time - time_received. Write a SELECT that "
              "returns ONE row: the department with the highest average delay, with two columns `department` and "
              "`average_delay` (rounded to 2 decimal places). If two departments tie, return the one whose name comes "
              "first alphabetically.",
        tables='''CREATE TABLE orders (order_id TEXT PRIMARY KEY, time_received REAL NOT NULL, processing_time REAL NOT NULL, department TEXT NOT NULL, status TEXT NOT NULL);
INSERT INTO orders (order_id, time_received, processing_time, department, status) VALUES
  ('A01', 10, 15, 'Packing', 'delayed'),
  ('A02', 12, 30, 'Shipping', 'completed'),
  ('A03', 9, 17, 'Packing', 'delayed'),
  ('A04', 11, 12, 'Shipping', 'delayed'),
  ('A05', 3, 9.5, 'Billing', 'delayed'),
  ('A06', 20, 21, 'Shipping', 'delayed');''',
        statement='''SELECT department, ROUND(AVG(processing_time - time_received), 2) AS average_delay
FROM orders
WHERE status = 'delayed'
GROUP BY department
ORDER BY AVG(processing_time - time_received) DESC, department
LIMIT 1;''',
        rows=[('Billing', 6.5)]),

    2960: dict(
        intro="Project Compliance\n\nThe PMO tracks, in the table `project`, whether each project passes the internal "
              "compliance check and the regulatory compliance check (1 = passes, 0 = fails).",
        rules="Write a SELECT that lists the non-compliant projects -- those failing at least one check -- with two "
              "columns, `name` and `failed_checks` (how many of the two checks it fails), ordered by `failed_checks` "
              "from most to fewest, then by `project_id`.",
        tables='''CREATE TABLE project (project_id INTEGER PRIMARY KEY, name TEXT NOT NULL, internal_compliance INTEGER NOT NULL, regulatory_compliance INTEGER NOT NULL);
INSERT INTO project (project_id, name, internal_compliance, regulatory_compliance) VALUES
  (1, 'Project A', 1, 0),
  (2, 'Project B', 1, 1),
  (3, 'Project C', 0, 0),
  (4, 'Project D', 0, 1),
  (5, 'Project E', 1, 1);''',
        statement='''SELECT name, (1 - internal_compliance) + (1 - regulatory_compliance) AS failed_checks
FROM project
WHERE internal_compliance = 0 OR regulatory_compliance = 0
ORDER BY failed_checks DESC, project_id;''',
        rows=[('Project C', 2), ('Project A', 1), ('Project D', 1)]),

    2961: dict(
        intro="Personnel Allocation Report\n\nResource planning keeps every staffing assignment in the table "
              "`assignment`, with the project, the number of people and whether the assignment is 'allocated' or "
              "'unallocated'.",
        rules="Write a SELECT that returns ONE row with three columns, in this order: `total_allocated` (the personnel "
              "of all 'allocated' assignments added up), `unallocated_projects` (how many assignments are "
              "'unallocated') and `average_allocated` (the average personnel per 'allocated' assignment, rounded to 2 "
              "decimal places).",
        tables='''CREATE TABLE assignment (assignment_id INTEGER PRIMARY KEY, project_id INTEGER NOT NULL, personnel_count INTEGER NOT NULL, allocation_status TEXT NOT NULL);
INSERT INTO assignment (assignment_id, project_id, personnel_count, allocation_status) VALUES
  (1, 1, 5, 'allocated'),
  (2, 2, 3, 'unallocated'),
  (3, 3, 2, 'allocated'),
  (4, 4, 0, 'unallocated'),
  (5, 5, 4, 'allocated');''',
        statement='''SELECT SUM(CASE WHEN allocation_status = 'allocated' THEN personnel_count ELSE 0 END) AS total_allocated,
       SUM(CASE WHEN allocation_status = 'unallocated' THEN 1 ELSE 0 END) AS unallocated_projects,
       ROUND(AVG(CASE WHEN allocation_status = 'allocated' THEN personnel_count END), 2) AS average_allocated
FROM assignment;''',
        rows=[(11, 2, 3.67)]),

    2535: dict(
        intro="Manager Requirements\n\nDuring requirements gathering, every interview answer was recorded in the table "
              "`interview` with the interviewee's role and the requirement they raised. Several managers raised the "
              "same requirement.",
        rules="Write a SELECT that returns each requirement raised by someone whose `role` is 'manager', once, sorted "
              "alphabetically. One column, `requirement`.",
        tables='''CREATE TABLE interview (interview_id INTEGER PRIMARY KEY, role TEXT NOT NULL, requirement TEXT NOT NULL);
INSERT INTO interview (interview_id, role, requirement) VALUES
  (1, 'manager', 'fast reporting'),
  (2, 'end user', 'easy search'),
  (3, 'manager', 'fast reporting'),
  (4, 'manager', 'audit trail'),
  (5, 'end user', 'audit trail'),
  (6, 'manager', 'secure access'),
  (7, 'Manager', 'mobile app');''',
        statement='''SELECT DISTINCT requirement
FROM interview
WHERE role = 'manager'
ORDER BY requirement;''',
        rows=[('audit trail',), ('fast reporting',), ('secure access',)]),

    2914: dict(
        intro="Control Effectiveness\n\nAn auditor reviews the security controls in the table `control` (each with its "
              "status) against the incident log in `incident`, where `incident` is NULL when a review found nothing.",
        rules="A control is 'effective' when its status is 'active' and no row in `incident` for that control has a "
              "non-NULL `incident`; otherwise it is 'needs improvement'. Write a SELECT that returns every control with "
              "two columns, `control_name` and `result`, in `control_id` order.",
        tables='''CREATE TABLE control (control_id INTEGER PRIMARY KEY, control_name TEXT NOT NULL, status TEXT NOT NULL);
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
  (4, 'Firewall', NULL);''',
        statement='''SELECT c.control_name,
       CASE WHEN c.status = 'active'
                 AND NOT EXISTS (SELECT 1 FROM incident i
                                 WHERE i.control_name = c.control_name AND i.incident IS NOT NULL)
            THEN 'effective' ELSE 'needs improvement' END AS result
FROM control c
ORDER BY c.control_id;''',
        rows=[('Firewall', 'effective'), ('Encryption', 'needs improvement'), ('MFA', 'needs improvement'),
              ('Backups', 'effective')]),

    2915: dict(
        intro="Audit Findings by Severity\n\nAn internal audit stored its findings in the table `finding`, each with a "
              "severity of 'Critical', 'High', 'Medium' or 'Low'. The remediation plan must tackle them in severity "
              "order.",
        rules="Write a SELECT that returns the `finding` texts ordered by severity -- Critical, then High, Medium, Low "
              "(not alphabetical) -- and alphabetically by finding within the same severity. One column, `finding`.",
        tables='''CREATE TABLE finding (finding_id INTEGER PRIMARY KEY, finding TEXT NOT NULL, severity TEXT NOT NULL);
INSERT INTO finding (finding_id, finding, severity) VALUES
  (1, 'Weak password policy', 'High'),
  (2, 'Unpatched server', 'Critical'),
  (3, 'Outdated procedure', 'Low'),
  (4, 'Missing MFA', 'High'),
  (5, 'Default credentials', 'Critical'),
  (6, 'Verbose errors', 'Medium');''',
        statement='''SELECT finding
FROM finding
ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
         finding;''',
        rows=[('Default credentials',), ('Unpatched server',), ('Missing MFA',), ('Weak password policy',),
              ('Verbose errors',), ('Outdated procedure',)]),

    2893: dict(
        intro="Risk Prioritization\n\nThe security team keeps its risk register in the table `risk`, rating each risk's "
              "likelihood and impact from 1 to 5.",
        rules="The risk score is likelihood x impact. Write a SELECT that returns every risk with two columns, `name` "
              "and `risk_score`, ordered by `risk_score` from highest to lowest, ties alphabetically by `name`.",
        tables='''CREATE TABLE risk (risk_id INTEGER PRIMARY KEY, name TEXT NOT NULL, likelihood INTEGER NOT NULL, impact INTEGER NOT NULL);
INSERT INTO risk (risk_id, name, likelihood, impact) VALUES
  (1, 'Insider Threat', 4, 5),
  (2, 'Phishing', 3, 4),
  (3, 'Data Breach', 4, 5),
  (4, 'DDoS', 2, 3),
  (5, 'Ransomware', 5, 4),
  (6, 'Lost Laptop', 4, 3);''',
        statement='''SELECT name, likelihood * impact AS risk_score
FROM risk
ORDER BY risk_score DESC, name;''',
        rows=[('Data Breach', 20), ('Insider Threat', 20), ('Ransomware', 20), ('Lost Laptop', 12), ('Phishing', 12),
              ('DDoS', 6)]),

    2939: dict(
        intro="Policy Incident Report\n\nIT logs every breach of its usage policy in the table `incident`: who did it, "
              "the type of incident, the date and a severity from 1 to 5.",
        rules="Write a SELECT that returns one row per incident type with four columns, in this order: "
              "`incident_type`, `incidents` (how many), `users` (how many different users) and `average_severity` "
              "(rounded to 2 decimal places). Order by `incidents` from most to fewest, ties alphabetically by "
              "`incident_type`.",
        tables='''CREATE TABLE incident (incident_id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, incident_type TEXT NOT NULL, incident_date TEXT NOT NULL, severity INTEGER NOT NULL);
INSERT INTO incident (incident_id, user_id, incident_type, incident_date, severity) VALUES
  (1, 'u1', 'USB', '2024-01-02', 2),
  (2, 'u2', 'Phishing', '2024-01-03', 4),
  (3, 'u1', 'Phishing', '2024-01-05', 3),
  (4, 'u3', 'USB', '2024-01-06', 1),
  (5, 'u2', 'Shadow IT', '2024-01-07', 5),
  (6, 'u2', 'Phishing', '2024-01-09', 2),
  (7, 'u3', 'USB', '2024-01-10', 2);''',
        statement='''SELECT incident_type,
       COUNT(*) AS incidents,
       COUNT(DISTINCT user_id) AS users,
       ROUND(AVG(severity), 2) AS average_severity
FROM incident
GROUP BY incident_type
ORDER BY incidents DESC, incident_type;''',
        rows=[('Phishing', 3, 2, 3.0), ('USB', 3, 2, 1.67), ('Shadow IT', 1, 1, 5.0)]),
}

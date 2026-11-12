"""Reference solutions for the 74 legacy Python programming questions (2026-11-12).

These questions were converted from test cases to one expected output, but their starter
code predated the "Rules for this question" that name the function: 51 called a function
the starter never defined, several starters already held the answer or printed extra
example lines, and a dozen ran on empty input so an empty stub scored full marks.

Each entry gives:
  ref   -- a correct solution written to the question's rules (never shown to learners);
  run   -- the lines that run it on the question's data and print the result. These end
           the learner's starter too, so the learner only implements the code above them;
  rules -- replacement rules, for questions whose rules were missing or incomplete.

The learner's starter is the reference with every function body emptied (see rebuild.py),
and the expected output is what ref + run actually prints on Judge0.
"""

FIXES = {
    2241: dict(
        rules="implement class BankAccount(initial_balance=0) in Python, keeping the balance in a private "
              "attribute. deposit(amount) adds a positive amount and returns the new balance (a zero or negative "
              "amount changes nothing). withdraw(amount) subtracts the amount and returns True when the balance "
              "covers it; otherwise it leaves the balance unchanged and returns False. get_balance() returns the "
              "balance.",
        ref='''
class BankAccount:
    def __init__(self, initial_balance=0):
        self.__balance = initial_balance

    def deposit(self, amount):
        if amount > 0:
            self.__balance += amount
        return self.__balance

    def withdraw(self, amount):
        if amount > self.__balance:
            return False
        self.__balance -= amount
        return True

    def get_balance(self):
        return self.__balance
''',
        run='''acct = BankAccount(100)
print(acct.deposit(50))
print(acct.deposit(-20))
print(acct.withdraw(120))
print(acct.withdraw(100))
print(acct.get_balance())'''),

    2264: dict(
        replace=[("Write a function in JavaScript that takes an object", "Write a function that takes an object")],
        ref='''
def to_camel_case_keys(data):
    result = {}
    for key, value in data.items():
        if len(key) == 1 and key not in ('i', 'j'):
            continue
        parts = key.split('_')
        first = parts[0][:1].lower() + parts[0][1:] if len(parts) == 1 else parts[0].lower()
        result[first + ''.join(p[:1].upper() + p[1:] for p in parts[1:])] = value
    return result
''',
        run='''print(to_camel_case_keys({'first_name': 'John', 'LastName': 'Doe', 'x': 5, 'i': 1, 'j': 2}))
print(to_camel_case_keys({'ORDER_total_amount': 99.5, 'Q': 'skip', 'shipping_address_line_1': 'Main St', 'id': 7}))'''),

    2291: dict(
        rules="implement class Requirement(req_id, description) in Python. The initial description is version 1; "
              "update_description(text) records the next version; get_current_description() returns the latest "
              "description; get_history() returns the list of (version_number, description) tuples, oldest first.",
        ref='''
class Requirement:
    def __init__(self, req_id, description):
        self.req_id = req_id
        self._history = [(1, description)]

    def update_description(self, text):
        self._history.append((len(self._history) + 1, text))

    def get_current_description(self):
        return self._history[-1][1]

    def get_history(self):
        return list(self._history)
''',
        run='''r = Requirement('R-1', 'Initial desc')
r.update_description('Second version')
r.update_description('Third version')
print(r.get_current_description())
print(r.get_history())'''),

    2293: dict(
        rules="implement find_ambiguous_requirements(requirements) in Python. A requirement is ambiguous when it "
              "contains (case-insensitively, anywhere in the text) any of: fast, user-friendly, robust, efficient. "
              "Return the indices of the ambiguous requirements in ascending order.",
        ref='''
def find_ambiguous_requirements(requirements):
    words = ('fast', 'user-friendly', 'robust', 'efficient')
    return [i for i, text in enumerate(requirements) if any(w in text.lower() for w in words)]
''',
        run='''print(find_ambiguous_requirements([
    'The system must be fast.',
    'Generate monthly reports.',
    'The interface should be user-friendly.',
    'Allow up to 1000 users.',
    'System must be robust.',
    'Batch jobs must run EFFICIENTLY overnight.',
]))'''),

    2316: dict(ref='''
def process_payment(amount, card_details):
    if isinstance(amount, bool) or not isinstance(amount, (int, float)) or amount <= 0:
        return 'Error: Invalid amount'
    for key in ('number', 'expiry', 'cvv'):
        if not card_details.get(key):
            return 'Error: Invalid card details'
    return 'Success'
''',
        run='''card = {'number': '4111111111111111', 'expiry': '12/30', 'cvv': '123'}
print(process_payment(100, card))
print(process_payment(0, card))
print(process_payment(-5, card))
print(process_payment(40, {'number': '4111111111111111', 'expiry': '', 'cvv': '123'}))
print(process_payment(40, {'number': '4111111111111111', 'cvv': '123'}))'''),

    2318: dict(ref='''
def map_requirements_to_components(requirements):
    rules = [(('auth', 'login'), 'AuthModule'), (('payment',), 'PaymentModule'),
             (('report',), 'ReportModule'), (('user',), 'UserModule')]
    mapping = {}
    for requirement in requirements:
        text = requirement.lower()
        mapping[requirement] = next((module for words, module in rules if any(w in text for w in words)),
                                    'GeneralModule')
    return mapping
''',
        run='''print(map_requirements_to_components(['User authentication', 'Process payment', 'Generate report',
                                      'Admin login page', 'User profile page', 'Backup database']))'''),

    2341: dict(ref='''
def run_workflow(results):
    messages = []
    for step in ('clone', 'branch', 'add', 'commit', 'push'):
        if results.get(step):
            messages.append(step + ': success')
        else:
            messages.append(step + ': failed')
            break
    return messages
''',
        run='''print(run_workflow({'clone': True, 'branch': True, 'add': True, 'commit': True, 'push': True}))
print(run_workflow({'clone': True, 'branch': True, 'add': False, 'commit': True, 'push': True}))'''),

    2344: dict(ref='''
def summarize_test_report(lines):
    counts = {'PASS': 0, 'FAIL': 0, 'SKIP': 0}
    for line in lines:
        if ':' not in line:
            continue
        status = line.rsplit(':', 1)[1].strip()
        if status in counts:
            counts[status] += 1
    total = sum(counts.values())
    return f"Total: {total}, PASS: {counts['PASS']}, FAIL: {counts['FAIL']}, SKIP: {counts['SKIP']}"
''',
        run='''print(summarize_test_report(['LoginTest: PASS', 'SignupTest: FAIL', 'ProfileTest: SKIP', 'BrokenLine',
                            '', 'CheckoutTest: PASS', 'Search: Edge: FAIL', 'CartTest: PENDING']))
print(summarize_test_report([]))'''),

    2450: dict(ref='''
error_log = []


def check_shipment_code(code):
    if 1 <= len(code) <= 6:
        return 'Accepted'
    error_log.append('Invalid shipment code: ' + code)
    return 'Rejected'
''',
        run='''print(check_shipment_code('ABCD'))
print(check_shipment_code('ABCDEF'))
print(check_shipment_code('ABCDEFG'))
print(check_shipment_code(''))
print(error_log)'''),

    2452: dict(ref='''
def summarize_sales(sales):
    if not sales:
        return {'total': 0, 'max': 0, 'average': 0.0}
    return {'total': sum(sales), 'max': max(sales), 'average': round(sum(sales) / len(sales), 2)}
''',
        run='''print(summarize_sales([120, 150, 90, 200, 130]))
print(summarize_sales([10, 20, 25]))
print(summarize_sales([]))'''),

    2454: dict(ref='''
def categorize_requirements(responses):
    keywords = {
        'Data to be Stored': ('store', 'record', 'archive'),
        'Business Rules': ('policy', 'rule', 'must'),
        'Performance Needs': ('fast', 'quick', 'daily', 'within'),
    }
    result = {category: [] for category in keywords}
    for response in responses:
        text = response.lower()
        for category, words in keywords.items():
            if any(w in text for w in words):
                result[category].append(response)
    return result
''',
        run='''print(categorize_requirements(['The system must store employee records', 'Data entry should be fast',
                              'There is a policy to retain data for 5 years',
                              'We want to record customer purchases quickly', 'Backup should happen daily',
                              'No requirement']))'''),

    2456: dict(ref='''
def build_requirements_document(method, stakeholders):
    if method not in ('interview', 'workshop'):
        raise ValueError('method must be interview or workshop')
    return {name: {'method': method, 'requirements': [] if need == 'No requirement' else [need]}
            for name, need in stakeholders.items()}
''',
        run='''print(build_requirements_document('interview', {'User1': 'Needs fast access', 'Manager': 'Wants daily reports',
                                                'IT Staff': 'Requires secure backups'}))
print(build_requirements_document('workshop', {'Ops': 'No requirement', 'CFO': 'Monthly cost report'}))
try:
    build_requirements_document('survey', {})
except ValueError:
    print('ValueError')'''),

    2462: dict(ref='''
def group_shipments(warehouses, shipments, drivers):
    by_id = {d['id']: d for d in drivers}
    result = {w['id']: [] for w in warehouses}
    for shipment in shipments:
        if shipment['warehouse_id'] in result:
            copy = dict(shipment)
            copy['drivers'] = [by_id[i] for i in shipment['driver_ids'] if i in by_id]
            result[shipment['warehouse_id']].append(copy)
    return result
''',
        run='''print(group_shipments([{'id': 1, 'name': 'North'}, {'id': 2, 'name': 'South'}, {'id': 3, 'name': 'East'}],
                      [{'id': 101, 'warehouse_id': 1, 'driver_ids': [201]},
                       {'id': 102, 'warehouse_id': 1, 'driver_ids': [201, 202]},
                       {'id': 103, 'warehouse_id': 2, 'driver_ids': []}],
                      [{'id': 201, 'name': 'Alice'}, {'id': 202, 'name': 'Bob'}]))'''),

    2464: dict(ref='''
def intervals_consistent(bits):
    if len(bits) < 3:
        return True
    gaps = {bits[i + 1][1] - bits[i][1] for i in range(len(bits) - 1)}
    return len(gaps) == 1
''',
        run='''print(intervals_consistent([]))
print(intervals_consistent([(1, 0), (0, 10)]))
print(intervals_consistent([(1, 0), (0, 10), (1, 20), (1, 30)]))
print(intervals_consistent([(1, 0), (0, 10), (1, 25), (0, 35)]))'''),

    2466: dict(ref='''
class SessionManager:
    def __init__(self, passwords):
        self.passwords = passwords
        self.active = set()

    def establish_session(self, user_id):
        if user_id in self.active:
            return 'Previous session terminated. Session established for ' + user_id + '.'
        self.active.add(user_id)
        return 'Session established for ' + user_id + '.'

    def authenticate(self, user_id, password):
        if user_id in self.active and self.passwords.get(user_id) == password:
            return 'Authentication successful.'
        return 'Authentication failed.'

    def terminate_session(self, user_id):
        if user_id in self.active:
            self.active.remove(user_id)
            return 'Session terminated for ' + user_id + '.'
        return 'No active session for ' + user_id + '.'
''',
        run='''sm = SessionManager({'alice': 'password123', 'bob': 'hunter22'})
print(sm.establish_session('alice'))
print(sm.establish_session('alice'))
print(sm.authenticate('alice', 'wrong'))
print(sm.authenticate('bob', 'hunter22'))
print(sm.authenticate('alice', 'password123'))
print(sm.terminate_session('alice'))
print(sm.terminate_session('alice'))'''),

    2468: dict(ref='''
def authenticate(user, password, valid_credentials, log):
    result = 'Success' if valid_credentials.get(user) == password else 'Failed'
    log.append((user, result))
    return result
''',
        run='''valid_credentials = {'alice': 'pw123', 'bob': 'pw456'}
log = []
print(authenticate('alice', 'pw123', valid_credentials, log))
print(authenticate('bob', 'wrong', valid_credentials, log))
print(authenticate('carol', 'pw123', valid_credentials, log))
print(log)'''),

    2492: dict(ref='''
def validate_transactions(transactions):
    seen = set()
    result = []
    for transaction in transactions:
        copy = dict(transaction)
        missing = any(transaction.get(key) is None for key in ('id', 'amount', 'customer_id'))
        duplicate = transaction.get('id') in seen
        copy['status'] = 'rejected' if missing or duplicate else 'approved'
        if transaction.get('id') is not None:
            seen.add(transaction['id'])
        result.append(copy)
    return result
''',
        run='''print(validate_transactions([
    {'id': 1, 'amount': 50, 'customer_id': 'C1'},
    {'id': 2, 'amount': None, 'customer_id': 'C2'},
    {'id': 2, 'amount': 30, 'customer_id': 'C2'},
    {'id': 1, 'amount': 20, 'customer_id': 'C3'},
    {'id': 3, 'amount': 10},
    {'id': 4, 'amount': 75, 'customer_id': 'C4'},
]))
print(validate_transactions([]))'''),

    2495: dict(
        rules="implement accepted_usernames(attempts, existing_usernames) in Python, where each attempt is a "
              "dictionary with 'username' and 'password'. Strip spaces from each username first. Accept an attempt "
              "only if the username is not empty, is not in existing_usernames, has not already been accepted earlier "
              "in the list, and the password is at least 8 characters long and contains at least one digit. Return "
              "the accepted (stripped) usernames in order.",
        ref='''
def accepted_usernames(attempts, existing_usernames):
    taken = set(existing_usernames)
    accepted = []
    for attempt in attempts:
        name = attempt.get('username', '').strip()
        password = attempt.get('password', '')
        if (name and name not in taken and len(password) >= 8
                and any(ch.isdigit() for ch in password)):
            accepted.append(name)
            taken.add(name)
    return accepted
''',
        run='''print(accepted_usernames([
    {'username': ' alice ', 'password': 'secret123'},
    {'username': 'bob', 'password': 'short1'},
    {'username': 'carol', 'password': 'nodigitshere'},
    {'username': 'alice', 'password': 'another99'},
    {'username': 'dave', 'password': 'password8'},
    {'username': '   ', 'password': 'blank1234'},
    {'username': 'erin', 'password': 'erinpass1'},
], ['dave']))
print(accepted_usernames([], []))'''),

    2497: dict(ref='''
def book_seat(user, seat, bookings):
    if user.get('is_logged_in') is True and seat.get('is_available') is True:
        bookings.append({'user': user, 'seat': seat})
    return bookings
''',
        run='''bookings = []
print(book_seat({'name': 'Ana', 'is_logged_in': True}, {'seat': '12A', 'is_available': True}, bookings))
print(book_seat({'name': 'Ben', 'is_logged_in': False}, {'seat': '12B', 'is_available': True}, bookings))
print(book_seat({'name': 'Cy', 'is_logged_in': True}, {'seat': '12C', 'is_available': False}, bookings))
print(len(bookings))'''),

    2517: dict(ref='''
def build_traceability_matrix(requirements, features):
    matrix = {r['id']: [] for r in requirements}
    for feature in features:
        for req_id in feature['requirement_ids']:
            if req_id in matrix and feature['feature_id'] not in matrix[req_id]:
                matrix[req_id].append(feature['feature_id'])
    return matrix
''',
        run='''print(build_traceability_matrix(
    [{'id': 'REQ-1', 'description': 'Login required'}, {'id': 'REQ-2', 'description': 'Audit logs'},
     {'id': 'REQ-3', 'description': 'Export to CSV'}],
    [{'feature_id': 'F1', 'requirement_ids': ['REQ-1']}, {'feature_id': 'F2', 'requirement_ids': ['REQ-2', 'REQ-1']},
     {'feature_id': 'F3', 'requirement_ids': ['REQ-9']}]))'''),

    2519: dict(ref='''
def check_requirements(requirements):
    vague = ('fast', 'user-friendly', 'robust', 'efficient', 'easy')
    report = {}
    for requirement in requirements:
        if 'id' not in requirement:
            continue
        text = requirement.get('text') or ''
        if not text.strip():
            report[requirement['id']] = ['correct', 'unambiguous', 'complete', 'testable']
            continue
        is_vague = any(w in text.lower() for w in vague)
        short = len(text.split()) < 4
        fails = []
        if is_vague:
            fails.append('unambiguous')
        if short:
            fails.append('complete')
        if is_vague:
            fails.append('testable')
        report[requirement['id']] = fails
    return report
''',
        run='''print(check_requirements([
    {'id': 'R1', 'text': 'The system shall be fast.'},
    {'id': 'R2', 'text': 'The system shall log all transactions.'},
    {'id': 'R3', 'text': ''},
    {'id': 'R4', 'text': 'Easy login'},
    {'text': 'No id here at all'},
]))'''),

    2521: dict(ref='''
def apply_change_requests(requirements, change_requests):
    result = [dict(r) for r in requirements]
    for change in change_requests:
        req_id = change['requirement_id']
        existing = next((r for r in result if r['id'] == req_id), None)
        kind = change['change_type']
        if kind == 'add' and existing is None:
            result.append({'id': req_id, 'text': change['new_text']})
        elif kind == 'modify' and existing is not None:
            existing['text'] = change['new_text']
        elif kind == 'remove' and existing is not None:
            result.remove(existing)
    return result
''',
        run='''print(apply_change_requests(
    [{'id': 'R1', 'text': 'User login required'}, {'id': 'R3', 'text': 'Nightly backup'}],
    [{'requirement_id': 'R2', 'change_type': 'add', 'new_text': 'Audit logging required'},
     {'requirement_id': 'R1', 'change_type': 'remove'},
     {'requirement_id': 'R2', 'change_type': 'modify', 'new_text': 'Audit logging for all admin actions'},
     {'requirement_id': 'R9', 'change_type': 'remove'},
     {'requirement_id': 'R3', 'change_type': 'add', 'new_text': 'Duplicate id'}]))'''),

    2534: dict(ref='''
def daily_average_temperatures(readings):
    days = {}
    for timestamp, value in readings:
        days.setdefault(timestamp[:10], []).append(value)
    return {day: round(sum(values) / len(values), 2) for day, values in days.items()}
''',
        run='''print(daily_average_temperatures([('2024-05-01T10:00:00', 20.0), ('2024-05-01T14:00:00', 22.5),
                                  ('2024-05-02T10:00:00', 18.0), ('2024-05-01T20:00:00', 19.0),
                                  ('2024-05-02T15:00:00', 21.1)]))
print(daily_average_temperatures([]))'''),

    2535: dict(ref='''
def manager_requirements(interviews):
    return sorted({i['requirement'] for i in interviews if i.get('role') == 'manager'})
''',
        run='''print(manager_requirements([{'role': 'manager', 'requirement': 'fast reporting'},
                            {'role': 'end user', 'requirement': 'easy search'},
                            {'role': 'manager', 'requirement': 'fast reporting'},
                            {'role': 'manager', 'requirement': 'audit trail'},
                            {'role': 'manager', 'requirement': 'secure access'}]))
print(manager_requirements([{'role': 'end user', 'requirement': 'easy search'}]))'''),

    2536: dict(ref='''
def summarize_spec(spec):
    lines = []
    for key, title in (('entities', 'Entities'), ('operations', 'Operations'), ('constraints', 'Constraints')):
        items = spec.get(key) or []
        lines.append(title + ': ' + (', '.join(items) if items else 'not specified'))
    return '\\n'.join(lines)
''',
        run='''print(summarize_spec({'entities': ['Customer', 'Order'], 'operations': ['create', 'delete'],
                      'constraints': ['Order ID unique']}))
print(summarize_spec({'entities': ['User'], 'operations': []}))'''),

    2556: dict(
        rules="implement group_feedback(entries) in Python, where each entry is a dictionary with 'stakeholder', "
              "'feedback' and 'priority' (a number). Return a dictionary mapping each stakeholder, in order of first "
              "appearance, to the list of their feedback texts ordered by priority from highest to lowest (equal "
              "priorities keep their input order). An empty list gives {}.",
        ref='''
def group_feedback(entries):
    grouped = {}
    for entry in entries:
        grouped.setdefault(entry['stakeholder'], []).append(entry)
    return {name: [e['feedback'] for e in sorted(items, key=lambda e: -e['priority'])]
            for name, items in grouped.items()}
''',
        run='''print(group_feedback([
    {'stakeholder': 'Finance', 'feedback': 'Monthly totals', 'priority': 2},
    {'stakeholder': 'Sales', 'feedback': 'Track leads', 'priority': 5},
    {'stakeholder': 'Finance', 'feedback': 'Invoice audit trail', 'priority': 5},
    {'stakeholder': 'Finance', 'feedback': 'Export to CSV', 'priority': 2},
    {'stakeholder': 'Sales', 'feedback': 'Mobile access', 'priority': 3},
]))
print(group_feedback([]))'''),

    2557: dict(ref='''
def clean_readings(readings):
    return [r for r in readings
            if isinstance(r.get('value'), (int, float)) and not isinstance(r.get('value'), bool)]
''',
        run='''print(clean_readings([
    {'timestamp': 1, 'value': 20.5},
    {'timestamp': 2, 'value': None},
    {'timestamp': 3, 'value': '21'},
    {'timestamp': 4, 'value': 19},
    {'timestamp': 5, 'value': True},
    {'timestamp': 6, 'value': 0},
]))
print(clean_readings([{'timestamp': 1, 'value': None}]))'''),

    2558: dict(ref='''
def summarize_er(entities, relationships):
    summary = {e['name']: [] for e in entities}
    for rel in relationships:
        if rel['entity1'] in summary:
            summary[rel['entity1']].append((rel['entity2'], rel['type']))
        if rel['entity2'] in summary:
            summary[rel['entity2']].append((rel['entity1'], rel['type']))
    return summary
''',
        run='''print(summarize_er(
    [{'name': 'Customer', 'attributes': ['ID', 'Name']}, {'name': 'Order', 'attributes': ['ID', 'Date']},
     {'name': 'Product', 'attributes': ['ID', 'Price']}, {'name': 'Supplier', 'attributes': ['ID']}],
    [{'entity1': 'Customer', 'entity2': 'Order', 'type': 'one-to-many'},
     {'entity1': 'Order', 'entity2': 'Product', 'type': 'many-to-many'}]))'''),

    2581: dict(
        rules="name the function register_device(device_id, device_type). Keep a module-level dictionary "
              "registry = {} that maps each URI to its resource ({'type': 'node' or 'device', 'device_id': ..., "
              "'device_type': ...}). Return a tuple of the two URIs: ('/CSEBase/node/<device_id>', "
              "'/CSEBase/device/<device_id>'). Registering a device_id that is already registered returns "
              "'Error: <device_id> already registered' and changes nothing.",
        ref='''
registry = {}


def register_device(device_id, device_type):
    node_uri = '/CSEBase/node/' + device_id
    device_uri = '/CSEBase/device/' + device_id
    if node_uri in registry:
        return 'Error: ' + device_id + ' already registered'
    registry[node_uri] = {'type': 'node', 'device_id': device_id, 'device_type': device_type}
    registry[device_uri] = {'type': 'device', 'device_id': device_id, 'device_type': device_type}
    return (node_uri, device_uri)
''',
        run='''print(register_device('sensorA', 'temperature'))
print(register_device('valve7', 'actuator'))
print(register_device('sensorA', 'humidity'))
print(len(registry))'''),

    2701: dict(ref='''
def overdue_devices(reports, now):
    latest = {}
    for report in reports:
        device, timestamp, _status = report.split(',')
        latest[device] = max(latest.get(device, 0), int(timestamp))
    return sorted(d for d, t in latest.items() if now - t > 900)
''',
        run='''print(overdue_devices(['A,1650000000,OK', 'B,1650000600,OK', 'A,1650001200,OK',
                       'C,1650001200,FAIL', 'D,1650001199,OK'], 1650002100))'''),

    2704: dict(ref='''
def register_devices(requests):
    seen = set()
    accepted = []
    for device_id, device_type in requests:
        if device_id not in seen:
            seen.add(device_id)
            accepted.append((device_id, device_type))
    return accepted
''',
        run='''print(register_devices([('dev1', 'sensor'), ('dev2', 'actuator'), ('dev1', 'camera'), ('dev3', 'gateway'),
                        ('dev2', 'actuator')]))'''),

    2727: dict(
        rules="use Python. Write log_access_attempt(user_id, timestamp, success): each call appends exactly one line "
              "'user_id,timestamp,success' (success written as True or False) to access_log.txt, creating the file "
              "if needed. Protect the write with a module-level threading.Lock named log_lock so concurrent calls "
              "never lose or mix entries.",
        ref='''
import threading

log_lock = threading.Lock()


def log_access_attempt(user_id, timestamp, success):
    with log_lock:
        with open('access_log.txt', 'a') as log:
            log.write(f'{user_id},{timestamp},{success}\\n')
''',
        run='''import os
if os.path.exists('access_log.txt'):
    os.remove('access_log.txt')
threads = [threading.Thread(target=log_access_attempt, args=(f'user{i}', '2023-05-01T12:00:00', i % 2 == 0))
           for i in range(20)]
for t in threads:
    t.start()
for t in threads:
    t.join()
log_access_attempt('user123', '2023-05-01T12:05:00', True)
lines = open('access_log.txt').read().splitlines()
print(len(lines))
print(sorted(lines)[:3])
print(lines[-1])'''),

    2730: dict(
        rules="implement can_modify_record(user_role, record_type) in Python. Only 'admin' and 'finance_manager' "
              "may modify 'financial' records; anyone may modify 'general' records; any other record type may not be "
              "modified by anyone. Roles and record types are compared exactly (case-sensitive). Return True or False.",
        ref='''
def can_modify_record(user_role, record_type):
    if record_type == 'general':
        return True
    if record_type == 'financial':
        return user_role in ('admin', 'finance_manager')
    return False
''',
        run='''for role, record in [('admin', 'financial'), ('finance_manager', 'financial'), ('clerk', 'financial'),
                     ('clerk', 'general'), ('Admin', 'financial'), ('admin', 'payroll')]:
    print(role, record, can_modify_record(role, record))'''),

    2755: dict(ref='''
def summarize_assets(csv_text):
    counts = {}
    high = 0
    for row in csv_text.split('\\n'):
        fields = [f.strip() for f in row.split(',')]
        if len(fields) != 3 or any(not f for f in fields):
            continue
        name, kind, criticality = fields
        counts[kind] = counts.get(kind, 0) + 1
        if criticality == 'High':
            high += 1
    lines = [f'{kind}: {counts[kind]}' for kind in sorted(counts)]
    lines.append(f'High criticality: {high}')
    return '\\n'.join(lines)
''',
        run='''print(summarize_assets('Server,Hardware,High\\nDatabase,Software,Medium\\n,Hardware,Low\\nRouter,Hardware,High\\n'
                       'Laptop,Hardware\\nCRM, Software ,High\\nVPN,Network,Low,extra\\nFirewall,Network,High'))'''),

    2757: dict(ref='''
from datetime import datetime


def after_hours_users(log_text):
    users = set()
    for line in log_text.split('\\n'):
        fields = line.split(',')
        if len(fields) != 4:
            continue
        try:
            moment = datetime.strptime(fields[0].strip(), '%Y-%m-%dT%H:%M:%SZ')
        except ValueError:
            continue
        minutes = moment.hour * 60 + moment.minute + moment.second / 60
        if minutes < 8 * 60 or minutes > 18 * 60:
            users.add(fields[1].strip())
    return sorted(users)
''',
        run='''print(after_hours_users('2024-05-10T07:59:00Z,bob,server01,login\\n2024-05-10T09:00:00Z,alice,server01,login\\n'
                        '2024-05-10T18:30:00Z,charlie,db01,read\\n2024-05-10T18:00:00Z,alice,db01,logout\\n'
                        'not-a-time,mallory,db01,read\\n2024-05-10T23:10:00Z,bob,vpn,login\\n'
                        '2024-05-10T08:00:00Z,dave,server01,login\\nbroken line'))'''),

    2759: dict(ref='''
def missing_controls(required, implemented):
    done = set(implemented)
    missing = []
    for control in required:
        if control not in done and control not in missing:
            missing.append(control)
    return missing
''',
        run='''print(missing_controls(['A', 'B', 'C', 'B', 'D', 'A'], ['A', 'C', 'C']))
print(missing_controls(['A'], ['A']))'''),

    2782: dict(
        rules="implement sla_report(services) in Python, where each service is a dictionary with 'name', "
              "'sla_target' and 'actual_uptime' (percentages). A service is compliant when actual_uptime >= "
              "sla_target. Return a tuple (non_compliant_names, compliance_rate): the names in input order, and the "
              "percentage of compliant services rounded to 1 decimal place. An empty list gives ([], 0.0).",
        ref='''
def sla_report(services):
    if not services:
        return ([], 0.0)
    failing = [s['name'] for s in services if s['actual_uptime'] < s['sla_target']]
    rate = round((len(services) - len(failing)) / len(services) * 100, 1)
    return (failing, rate)
''',
        run='''print(sla_report([{'name': 'Email', 'sla_target': 99.9, 'actual_uptime': 99.95},
                  {'name': 'CRM', 'sla_target': 99.5, 'actual_uptime': 98.7},
                  {'name': 'VPN', 'sla_target': 99.0, 'actual_uptime': 99.0}]))
print(sla_report([{'name': 'Web', 'sla_target': 99.9, 'actual_uptime': 99.0}]))
print(sla_report([]))'''),

    2784: dict(ref='''
def allocate_budget(departments, budget):
    order = sorted(departments, key=lambda d: -d['priority'])
    allocation = {}
    for department in order:
        give = min(department['requested'], budget)
        allocation[department['name']] = give
        budget -= give
    return allocation
''',
        run='''print(allocate_budget([{'name': 'HR', 'requested': 5000, 'priority': 8},
                       {'name': 'IT', 'requested': 10000, 'priority': 10},
                       {'name': 'Legal', 'requested': 3000, 'priority': 8},
                       {'name': 'Ops', 'requested': 4000, 'priority': 2}], 16000))'''),

    2807: dict(ref='''
def kpis_needing_attention(kpis):
    return [k['name'] for k in kpis if k['current'] < 0.9 * k['target']]
''',
        run='''print(kpis_needing_attention([{'name': 'Customer Satisfaction', 'target': 85, 'current': 76},
                              {'name': 'Server Uptime', 'target': 99.9, 'current': 99.8},
                              {'name': 'Tickets Closed', 'target': 200, 'current': 150},
                              {'name': 'First Response', 'target': 100, 'current': 90}]))'''),

    2808: dict(ref='''
def kpi_summary(kpis):
    summary = {'on_target': 0, 'slightly_below': 0, 'well_below': 0}
    for kpi in kpis:
        if kpi['current_value'] >= kpi['target_value']:
            summary['on_target'] += 1
        elif kpi['current_value'] >= 0.9 * kpi['target_value']:
            summary['slightly_below'] += 1
        else:
            summary['well_below'] += 1
    return summary
''',
        run='''print(kpi_summary([{'name': 'Sales', 'current_value': 110, 'target_value': 100},
                   {'name': 'Support Tickets', 'current_value': 90, 'target_value': 100},
                   {'name': 'Response Time', 'current_value': 85, 'target_value': 100},
                   {'name': 'Renewals', 'current_value': 100, 'target_value': 100},
                   {'name': 'Churn', 'current_value': 89.9, 'target_value': 100}]))'''),

    2828: dict(ref='''
def worst_department(orders):
    delays = {}
    for order in orders:
        if order['status'] == 'delayed':
            delays.setdefault(order['department'], []).append(order['processing_time'] - order['time_received'])
    if not delays:
        return ('', 0.0)
    averages = {d: sum(v) / len(v) for d, v in delays.items()}
    worst = min(averages, key=lambda d: (-averages[d], d))
    return (worst, round(averages[worst], 2))
''',
        run='''print(worst_department([
    {'order_id': 'A01', 'time_received': 10, 'processing_time': 15, 'department': 'Packing', 'status': 'delayed'},
    {'order_id': 'A02', 'time_received': 12, 'processing_time': 30, 'department': 'Shipping', 'status': 'completed'},
    {'order_id': 'A03', 'time_received': 9, 'processing_time': 17, 'department': 'Packing', 'status': 'delayed'},
    {'order_id': 'A04', 'time_received': 11, 'processing_time': 12, 'department': 'Shipping', 'status': 'delayed'},
    {'order_id': 'A05', 'time_received': 3, 'processing_time': 9.5, 'department': 'Billing', 'status': 'delayed'},
]))
print(worst_department([]))'''),

    2830: dict(ref='''
def resolution_rates(complaints):
    totals = {}
    for complaint in complaints:
        counts = totals.setdefault(complaint['category'], [0, 0])
        counts[1] += 1
        if complaint['status'] == 'resolved':
            counts[0] += 1
    return {category: round(done / total, 2) for category, (done, total) in totals.items()}
''',
        run='''print(resolution_rates([
    {'complaint_id': '001', 'category': 'Delivery', 'date_received': '2023-01-01', 'date_resolved': '2023-01-03', 'status': 'resolved'},
    {'complaint_id': '002', 'category': 'Product', 'date_received': '2023-01-02', 'date_resolved': '', 'status': 'open'},
    {'complaint_id': '003', 'category': 'Delivery', 'date_received': '2023-01-04', 'date_resolved': '2023-01-05', 'status': 'resolved'},
    {'complaint_id': '004', 'category': 'Product', 'date_received': '2023-01-05', 'date_resolved': '2023-01-07', 'status': 'resolved'},
    {'complaint_id': '005', 'category': 'Product', 'date_received': '2023-01-06', 'date_resolved': '', 'status': 'open'},
    {'complaint_id': '006', 'category': 'Billing', 'date_received': '2023-01-08', 'date_resolved': '', 'status': 'escalated'},
]))
print(resolution_rates([]))'''),

    2852: dict(ref='''
def encode_bits(bits):
    return ''.join('V' if bit == 1 else '-' for bit in bits)


def decode_signal(signal):
    return [1 if ch == 'V' else 0 for ch in signal]
''',
        run='''print(encode_bits([1, 0, 1, 1, 0]))
print(decode_signal('V--VV-V'))
print(decode_signal(encode_bits([0, 0, 1])))
print(encode_bits([]))'''),

    2854: dict(ref='''
def parse_frame(frame):
    parts = frame.split('|')
    if len(parts) != 5 or parts[0] != 'S' or parts[4] != 'E':
        return 'Error: Invalid frame'
    _, mac, data, checksum, _ = parts
    if len(mac) != 6 or any(ch not in '0123456789ABCDEF' for ch in mac):
        return 'Error: Invalid MAC address'
    if checksum != format(sum(ord(ch) for ch in data) % 256, '02X'):
        return 'Error: Checksum mismatch'
    return data
''',
        run='''print(parse_frame('S|A1B2C3|hello|14|E'))
print(parse_frame('S|A1B2C3|hello|15|E'))
print(parse_frame('S|A1B2G3|hello|14|E'))
print(parse_frame('S|A1B2C3|hello|14'))
print(parse_frame('S|00FF00|OK|9A|E'))'''),

    2856: dict(ref='''
class M2MService:
    def __init__(self):
        self.devices = set()
        self.log = []

    def register(self, device_id):
        self.devices.add(device_id)

    def send(self, sender, receiver, message):
        if sender not in self.devices:
            return 'Error: Sender not registered'
        if receiver not in self.devices:
            return 'Error: Receiver not registered'
        self.log.append((sender, receiver, message))
        return 'Delivered'

    def get_log(self):
        return list(self.log)
''',
        run='''svc = M2MService()
svc.register('A')
svc.register('B')
print(svc.send('A', 'B', 'temp=22'))
print(svc.send('C', 'B', 'temp=23'))
print(svc.send('A', 'D', 'temp=24'))
print(svc.send('C', 'D', 'temp=25'))
print(svc.send('B', 'A', 'ack'))
print(svc.get_log())'''),

    2879: dict(ref='''
def sync_check(sent, received, tolerance):
    for i in range(max(len(sent), len(received))):
        if i >= len(sent) or i >= len(received) or abs(sent[i] - received[i]) > tolerance:
            return 'First mismatch at index ' + str(i)
    return 'Synchronized'
''',
        run='''print(sync_check([10, 20, 30, 40], [11, 21, 29, 41], 2))
print(sync_check([10, 20, 30, 40], [10, 23, 30, 49], 2))
print(sync_check([10, 20, 30], [10, 20], 2))
print(sync_check([10, 20, 30], [12, 18, 32], 2))'''),

    2880: dict(ref='''
def cable_suitable(cable_type, length_m, data_rate_mbps):
    limits = {
        'Cat5e': [(1000, 100)],
        'Cat6': [(10000, 55), (1000, 100)],
        'Single-mode fiber': [(10000, 10000)],
    }
    for rate, length in limits.get(cable_type, []):
        if data_rate_mbps <= rate and length_m <= length:
            return 'Suitable'
    return 'Not Suitable'
''',
        run='''for args in [('Cat5e', 90, 1000), ('Cat5e', 120, 100), ('Cat6', 50, 10000), ('Cat6', 80, 10000),
             ('Cat6', 80, 1000), ('Single-mode fiber', 9000, 10000), ('Coax', 10, 10)]:
    print(args, cable_suitable(*args))'''),

    2881: dict(ref='''
def relay_frames(frames):
    out = []
    for frame in frames:
        if frame['data'].count('1') % 2 == frame['parity']:
            out.append(frame['data'])
        else:
            out.append('Error: Parity check failed for frame from ' + frame['src'] + ' to ' + frame['dst'])
    return out
''',
        run='''print(relay_frames([
    {'src': 'AA:BB:CC:DD:EE:FF', 'dst': '11:22:33:44:55:66', 'data': '1011', 'parity': 1},
    {'src': 'AA:BB:CC:DD:EE:FF', 'dst': '11:22:33:44:55:66', 'data': '1001', 'parity': 1},
    {'src': '11:22:33:44:55:66', 'dst': 'AA:BB:CC:DD:EE:FF', 'data': '0000', 'parity': 0},
]))'''),

    2891: dict(ref='''
def safe_uploads(file_names):
    safe = []
    for name in file_names:
        extension = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
        if extension in ('pdf', 'docx', 'xlsx') and '../' not in name:
            safe.append(name)
    return safe
''',
        run='''print(safe_uploads(['report.pdf', '../secrets.docx', 'invoice.xlsx', 'data.csv', 'notes../.pdf',
                    'SCAN.PDF', 'archive.tar.docx', 'nodot']))'''),

    2893: dict(
        rules="name the function prioritize_risks(risks). The risk score is likelihood x impact. Return the risk "
              "names sorted by score from highest to lowest; equal scores are sorted alphabetically by name.",
        ref='''
def prioritize_risks(risks):
    ordered = sorted(risks, key=lambda r: (-r['likelihood'] * r['impact'], r['name']))
    return [r['name'] for r in ordered]
''',
        run='''print(prioritize_risks([{'name': 'Insider Threat', 'likelihood': 4, 'impact': 5},
                        {'name': 'Phishing', 'likelihood': 3, 'impact': 4},
                        {'name': 'Data Breach', 'likelihood': 4, 'impact': 5},
                        {'name': 'DDoS', 'likelihood': 2, 'impact': 3},
                        {'name': 'Ransomware', 'likelihood': 5, 'impact': 4}]))'''),

    2895: dict(
        rules="name the function parse_inventory(text) and return a tuple (assets, high_value): the dictionary of "
              "asset name to integer value, in input order, and the list of names whose value is above 100000, in "
              "input order. Skip blank lines and lines without exactly one ':' or without an integer value.",
        ref='''
def parse_inventory(text):
    assets = {}
    for line in text.split('\\n'):
        if line.count(':') != 1:
            continue
        name, value = (part.strip() for part in line.split(':'))
        if not name or not value.lstrip('-').isdigit():
            continue
        assets[name] = int(value)
    return (assets, [name for name, value in assets.items() if value > 100000])
''',
        run='''print(parse_inventory('CustomerDB:120000\\nHRRecords:90000\\n\\nWebServer:500000\\nBackupNAS:100000\\n'
                      'Broken line\\nLaptops:abc\\nMail:server:5'))'''),

    2914: dict(ref='''
def evaluate_controls(controls, incidents):
    hit = {i['control'] for i in incidents if i.get('incident') is not None}
    return {c['control']: 'effective' if c['status'] == 'active' and c['control'] not in hit
            else 'needs improvement' for c in controls}
''',
        run='''print(evaluate_controls(
    [{'control': 'Firewall', 'status': 'active'}, {'control': 'Encryption', 'status': 'inactive'},
     {'control': 'MFA', 'status': 'active'}, {'control': 'Backups', 'status': 'active'}],
    [{'control': 'Firewall', 'incident': None}, {'control': 'Encryption', 'incident': 'breach'},
     {'control': 'MFA', 'incident': 'bypass'}]))'''),

    2915: dict(ref='''
def prioritize_findings(findings):
    rank = {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3}
    return [f['finding'] for f in sorted(findings, key=lambda f: (rank[f['severity']], f['finding']))]
''',
        run='''print(prioritize_findings([{'finding': 'Weak password policy', 'severity': 'High'},
                           {'finding': 'Unpatched server', 'severity': 'Critical'},
                           {'finding': 'Outdated procedure', 'severity': 'Low'},
                           {'finding': 'Missing MFA', 'severity': 'High'},
                           {'finding': 'Default credentials', 'severity': 'Critical'},
                           {'finding': 'Verbose errors', 'severity': 'Medium'}]))'''),

    2916: dict(ref='''
def count_pdca(actions):
    counts = {'Plan': 0, 'Do': 0, 'Check': 0, 'Act': 0}
    for action in actions:
        if action['phase'] in counts:
            counts[action['phase']] += 1
    return counts
''',
        run='''print(count_pdca([{'phase': 'Plan'}, {'phase': 'Do'}, {'phase': 'Plan'}, {'phase': 'Check'}]))
print(count_pdca([]))'''),

    2933: dict(
        rules="implement service_desk_kpis(tickets) in Python, where each ticket is a dictionary with "
              "'resolution_time' (hours), 'customer_satisfaction' (0-100) and 'status' ('open' or 'closed'). Return "
              "a tuple (average resolution time of closed tickets, number of open tickets, average customer "
              "satisfaction of all tickets), with both averages rounded to 2 decimal places and 0.0 when there is "
              "nothing to average.",
        ref='''
def service_desk_kpis(tickets):
    closed = [t['resolution_time'] for t in tickets if t['status'] == 'closed']
    open_count = sum(1 for t in tickets if t['status'] == 'open')
    avg_resolution = round(sum(closed) / len(closed), 2) if closed else 0.0
    avg_satisfaction = round(sum(t['customer_satisfaction'] for t in tickets) / len(tickets), 2) if tickets else 0.0
    return (avg_resolution, open_count, avg_satisfaction)
''',
        run='''print(service_desk_kpis([{'resolution_time': 4, 'customer_satisfaction': 90, 'status': 'closed'},
                         {'resolution_time': 7, 'customer_satisfaction': 70, 'status': 'closed'},
                         {'resolution_time': 0, 'customer_satisfaction': 55, 'status': 'open'},
                         {'resolution_time': 2.5, 'customer_satisfaction': 88, 'status': 'closed'}]))
print(service_desk_kpis([{'resolution_time': 0, 'customer_satisfaction': 40, 'status': 'open'}]))
print(service_desk_kpis([]))'''),

    2936: dict(ref='''
def select_projects(projects, available_personnel, available_budget):
    order = sorted(projects, key=lambda p: -(p['business_value'] / p['budget']))
    chosen = []
    total = 0
    for project in order:
        if project['personnel'] <= available_personnel and project['budget'] <= available_budget:
            chosen.append(project)
            available_personnel -= project['personnel']
            available_budget -= project['budget']
            total += project['business_value']
    return (chosen, total)
''',
        run='''print(select_projects([{'name': 'CRM', 'personnel': 2, 'budget': 100, 'business_value': 8},
                       {'name': 'Portal', 'personnel': 1, 'budget': 50, 'business_value': 5},
                       {'name': 'BI', 'personnel': 3, 'budget': 60, 'business_value': 6},
                       {'name': 'Mobile', 'personnel': 1, 'budget': 40, 'business_value': 2}], 4, 160))'''),

    2939: dict(
        rules="implement incident_report(incidents) in Python, where each incident is a dictionary with "
              "'user_id', 'incident_type', 'date' and 'severity' (1-5). Return a tuple (number of unique user_ids, "
              "most common incident_type, average severity rounded to 2 decimal places). When several types are "
              "equally common, use the one that comes first alphabetically. An empty list gives (0, None, 0.0).",
        ref='''
def incident_report(incidents):
    if not incidents:
        return (0, None, 0.0)
    counts = {}
    for incident in incidents:
        counts[incident['incident_type']] = counts.get(incident['incident_type'], 0) + 1
    common = min(counts, key=lambda t: (-counts[t], t))
    users = len({i['user_id'] for i in incidents})
    return (users, common, round(sum(i['severity'] for i in incidents) / len(incidents), 2))
''',
        run='''print(incident_report([
    {'user_id': 'u1', 'incident_type': 'USB', 'date': '2024-01-02', 'severity': 2},
    {'user_id': 'u2', 'incident_type': 'Phishing', 'date': '2024-01-03', 'severity': 4},
    {'user_id': 'u1', 'incident_type': 'Phishing', 'date': '2024-01-05', 'severity': 3},
    {'user_id': 'u3', 'incident_type': 'USB', 'date': '2024-01-06', 'severity': 1},
    {'user_id': 'u2', 'incident_type': 'Shadow IT', 'date': '2024-01-07', 'severity': 5},
]))
print(incident_report([]))'''),

    2960: dict(ref='''
def compliance_report(projects):
    failing = []
    failures = {'internal': 0, 'regulatory': 0}
    for project in projects:
        ok = True
        if not project['internal_compliance']:
            failures['internal'] += 1
            ok = False
        if not project['regulatory_compliance']:
            failures['regulatory'] += 1
            ok = False
        if not ok:
            failing.append(project['name'])
    rate = round((len(projects) - len(failing)) / len(projects) * 100, 1) if projects else 0.0
    return (failing, rate, failures)
''',
        run='''print(compliance_report([
    {'name': 'Project A', 'internal_compliance': True, 'regulatory_compliance': False},
    {'name': 'Project B', 'internal_compliance': True, 'regulatory_compliance': True},
    {'name': 'Project C', 'internal_compliance': False, 'regulatory_compliance': False},
]))
print(compliance_report([]))'''),

    2961: dict(ref='''
def allocation_report(assignments):
    allocated = [a['personnel_count'] for a in assignments if a['allocation_status'] == 'allocated']
    unallocated = [a['project_id'] for a in assignments if a['allocation_status'] == 'unallocated']
    average = round(sum(allocated) / len(allocated), 2) if allocated else 0.0
    return (sum(allocated), unallocated, average)
''',
        run='''print(allocation_report([
    {'project_id': 1, 'personnel_count': 5, 'allocation_status': 'allocated'},
    {'project_id': 2, 'personnel_count': 3, 'allocation_status': 'unallocated'},
    {'project_id': 3, 'personnel_count': 2, 'allocation_status': 'allocated'},
    {'project_id': 4, 'personnel_count': 0, 'allocation_status': 'unallocated'},
]))
print(allocation_report([]))'''),

    3066: dict(ref='''
def missing_sections(document):
    required = ['functional_requirements', 'interface_requirements', 'user_attributes',
                'product_features', 'design_constraints']
    return [key for key in required if key not in document]
''',
        run='''print(missing_sections({'functional_requirements': [], 'interface_requirements': [], 'user_attributes': [],
                        'product_features': [], 'design_constraints': []}))
print(missing_sections({'user_attributes': ['Admins'], 'functional_requirements': ['Login'], 'notes': []}))'''),

    3068: dict(ref='''
def extract_functional_requirements(text):
    return [line[3:].strip() for line in text.split('\\n') if line.startswith('FR:')]
''',
        run='''print(extract_functional_requirements('FR: The system shall allow user login.\\nThe system shall log all activity.\\n'
                                      'FR:   The system shall support password reset.  \\n  FR: indented, not counted\\n'
                                      'NFR: Pages load in 2 seconds.\\n'))'''),

    3093: dict(ref='''
def technical_word_counts(responses):
    return [(r['vendor_name'], len((r.get('technical_capabilities') or '').split())) for r in responses]
''',
        run='''print(technical_word_counts([
    {'vendor_name': 'AlphaTech', 'technical_capabilities': 'Cloud hosting, 24/7 support.'},
    {'vendor_name': 'BetaSys', 'company_background': 'Established 2015.'},
    {'vendor_name': 'GammaIT', 'technical_capabilities': ''},
    {'vendor_name': 'DeltaSoft', 'technical_capabilities': '  ERP   integration  and data migration '},
]))'''),

    3095: dict(ref='''
def rfi_template(project_name):
    lines = ['Request for Information (RFI): ' + project_name, '', 'Introduction',
             'This RFI is issued for the ' + project_name + ' project.']
    for section in ('Company Background', 'Technical Capabilities', 'Implementation Experience',
                    'Support Offerings'):
        lines += ['', section, '[Provide details here]']
    return '\\n'.join(lines)
''',
        run='''print(rfi_template('Data Center Upgrade'))'''),

    3101: dict(ref='''
def emphasis_areas(presentation_type):
    areas = {
        'project': ['scope', 'timeline', 'resource needs', 'risks', 'expected outcomes'],
        'investment': ['problem', 'solution', 'market opportunity', 'business model', 'financials', 'return on investment'],
        'decision': ['background', 'options', 'analysis', 'recommendation', 'next steps'],
    }
    return areas.get(presentation_type, 'Error: Invalid presentation type')
''',
        run='''print(emphasis_areas('project'))
print(emphasis_areas('webinar'))'''),

    3103: dict(ref='''
def is_feasible(phases, total_resources):
    if not phases:
        return True
    first = min(p['start'] for p in phases)
    last = max(p['end'] for p in phases)
    for day in range(first, last + 1):
        if sum(p['resources'] for p in phases if p['start'] <= day <= p['end']) > total_resources:
            return False
    return True
''',
        run='''print(is_feasible([{'start': 1, 'end': 5, 'resources': 3}, {'start': 4, 'end': 7, 'resources': 4}], 6))
print(is_feasible([{'start': 1, 'end': 5, 'resources': 3}, {'start': 6, 'end': 7, 'resources': 4}], 6))
print(is_feasible([{'start': 1, 'end': 5, 'resources': 3}, {'start': 5, 'end': 7, 'resources': 3}], 6))'''),

    3106: dict(
        rules="name the function waterfall_schedule(phases), where phases is a list of (phase_name, duration_days). "
              "Work starts on day 1 and each phase begins the day after the previous one ends. Return a list of "
              "(phase_name, start_day, end_day) tuples; a phase with a duration of 0 or less is skipped.",
        ref='''
def waterfall_schedule(phases):
    schedule = []
    day = 1
    for name, duration in phases:
        if duration <= 0:
            continue
        schedule.append((name, day, day + duration - 1))
        day += duration
    return schedule
''',
        run='''print(waterfall_schedule([('Requirements', 5), ('Design', 3), ('Review', 0), ('Implementation', 7), ('Testing', 1)]))'''),

    3131: dict(ref='''
def split_requirements(requirements):
    for r in requirements:
        if not all(key in r for key in ('requirement', 'type', 'priority')):
            return 'Error: Missing required field(s)'
    functional = sorted((r for r in requirements if r['type'] == 'functional'), key=lambda r: -r['priority'])
    non_functional = sorted((r for r in requirements if r['type'] == 'non-functional'), key=lambda r: -r['priority'])
    return (functional, non_functional)
''',
        run='''print(split_requirements([
    {'requirement': 'Support for mobile devices', 'type': 'functional', 'priority': 1},
    {'requirement': 'System must respond within 2 seconds', 'type': 'non-functional', 'priority': 2},
    {'requirement': 'System must authenticate users', 'type': 'functional', 'priority': 3},
    {'requirement': 'Encrypt data at rest', 'type': 'non-functional', 'priority': 5},
]))
print(split_requirements([{'requirement': 'Export reports', 'type': 'functional'}]))'''),

    3133: dict(ref='''
def validate_srs(srs):
    keys = ['purpose', 'scope', 'stakeholders', 'features', 'performance']
    missing = [key for key in keys if not srs.get(key)]
    return True if not missing else missing
''',
        run='''print(validate_srs({'purpose': 'Order processing', 'scope': 'E-commerce site', 'stakeholders': ['admin', 'user'],
                    'features': ['login', 'cart'], 'performance': '500ms response'}))
print(validate_srs({'purpose': 'Payroll', 'scope': '', 'features': [], 'performance': 'Batch in 1 hour'}))'''),

    3155: dict(ref='''
def categorize_statements(statements):
    result = {'Functional': [], 'Non-functional': [], 'Ambiguous': []}
    vague = ('fast', 'user-friendly', 'scalable', 'intuitive', 'reliable', 'robust')
    quality = ('second', 'encrypt', 'uptime', 'load')
    for statement in statements:
        text = statement.lower()
        if any(w in text for w in vague) and not any(ch.isdigit() for ch in text):
            result['Ambiguous'].append(statement)
        elif any(w in text for w in quality):
            result['Non-functional'].append(statement)
        else:
            result['Functional'].append(statement)
    return result
''',
        run='''print(categorize_statements(['The system must allow users to reset their password.', 'The system should be fast.',
                             'The interface must be user-friendly.', 'The database must store up to 100,000 records.',
                             'Pages must load within 2 seconds.', 'All backups must be encrypted.',
                             'The service must be reliable with 99.9% uptime.']))'''),

    3157: dict(ref='''
def missing_categories(document):
    order = ['Functional', 'Interface', 'User Attributes', 'Product Features', 'Design Constraints']
    return [category for category in order if category not in document]
''',
        run='''print(missing_categories({'Functional': ['Login'], 'User Attributes': ['Admins'], 'Product Features': ['Export']}))
print(missing_categories({}))'''),

    3159: dict(ref='''
def rfi_template_for(company_name, project_name, fields):
    lines = ['RFI Template for ' + company_name + ' - Project: ' + project_name, '',
             'Please provide information for the following fields:']
    for n, field in enumerate(fields, start=1):
        lines.append(f'{n}. {field}: ' + '_' * 23)
    return '\\n'.join(lines)
''',
        run='''print(rfi_template_for('Acme Corp', 'ERP Upgrade', ['Vendor Experience', 'Technical Capabilities', 'Support Offerings']))'''),

    3183: dict(
        rules="name the function has_core_sections(sections). Return True when the list contains all of "
              "'Executive Summary', 'Company Description', 'Market Analysis' and 'Organization and Management' "
              "(exact names; other sections may also be present), otherwise False.",
        ref='''
def has_core_sections(sections):
    required = {'Executive Summary', 'Company Description', 'Market Analysis', 'Organization and Management'}
    return required.issubset(sections)
''',
        run='''print(has_core_sections(['Executive Summary', 'Company Description', 'Market Analysis', 'Organization and Management']))
print(has_core_sections(['Executive Summary', 'Company Description', 'Market Analysis']))
print(has_core_sections(['Market Analysis', 'Financial Projections', 'Organization and Management',
                         'Company Description', 'Executive Summary']))
print(has_core_sections(['executive summary', 'Company Description', 'Market Analysis', 'Organization and Management']))'''),

    3184: dict(ref='''
def unique_requirements(document):
    seen = []
    for items in document.values():
        for requirement in items:
            if requirement not in seen:
                seen.append(requirement)
    return seen
''',
        run='''print(unique_requirements({'Functional': ['A', 'B'], 'Product Features': ['B', 'C']}))
print(unique_requirements({'Interface': ['Z', 'A'], 'Functional': ['A', 'Y', 'Z'], 'Design': []}))
print(unique_requirements({'Functional': [], 'Product Features': []}))'''),

    3185: dict(ref='''
def required_documents(document_types, phase):
    mapping = {
        'Requirements': ['Requirements Documents'],
        'Design': ['Design and Specification Documents'],
        'Development': ['Design and Specification Documents', 'Reference Documentation'],
        'Deployment': ['Process and Procedure Documents', 'User-Facing Documentation'],
    }
    wanted = mapping.get(phase, [])
    return [doc for doc in document_types if doc in wanted]
''',
        run='''docs = ['Requirements Documents', 'Design and Specification Documents', 'User-Facing Documentation',
        'Reference Documentation', 'Process and Procedure Documents']
for phase in ('Design', 'Development', 'Deployment', 'Requirements', 'Testing'):
    print(phase, required_documents(docs, phase))'''),

    3248: dict(
        rules="implement duplicate_groups(requirements) in Python as described above and return the list of "
              "groups. The starter prints each group on its own line as its requirements joined by ' | ' (nothing "
              "at all when there are no duplicates).",
        ref='''
import string


def duplicate_groups(requirements):
    groups = {}
    order = []
    for requirement in requirements:
        cleaned = requirement.lower().translate(str.maketrans('', '', string.punctuation))
        key = frozenset(cleaned.split())
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(requirement)
    return [groups[key] for key in order if len(groups[key]) >= 2]
''',
        run='''requirements = [
    'The system must log every failed login.',
    'Users can reset their password by email.',
    'Every failed login the system must log.',
    'Password reset: users can, by email!',
    'Admins can export the audit log.',
    'The system must log every failed login, every failed login.',
]
for group in duplicate_groups(requirements):
    print(' | '.join(group))'''),
}

# The rule sentence some questions carried about reading standard input, replaced above.
STDIN_SENTENCE = "Input is one requirement per line. Print each group on its own line as the requirements joined by ' | '. Print nothing when there are no duplicate groups."

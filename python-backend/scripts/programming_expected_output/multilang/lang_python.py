"""Python versions: the verified references from legacy_python_fixes.py, each function body marked as the
learner's part, with print lines that write plain text instead of Python's repr of lists and dicts."""
import ast
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from legacy_python_fixes import FIXES  # noqa: E402

RUN = {
    2293: '''ambiguous = find_ambiguous_requirements([
    'The system must be fast.',
    'Generate monthly reports.',
    'The interface should be user-friendly.',
    'Allow up to 1000 users.',
    'System must be robust.',
    'Batch jobs must run EFFICIENTLY overnight.',
])
print(' '.join(str(i) for i in ambiguous))''',
    2341: '''for results in ({'clone': True, 'branch': True, 'add': True, 'commit': True, 'push': True},
                {'clone': True, 'branch': True, 'add': False, 'commit': True, 'push': True},
                {'clone': False}):
    print(', '.join(run_workflow(results)))''',
    2454: '''result = categorize_requirements(['The system must store employee records', 'Data entry should be fast',
                                  'There is a policy to retain data for 5 years',
                                  'We want to record customer purchases quickly', 'Backup should happen daily',
                                  'No requirement'])
for category, statements in result.items():
    print(category + ': ' + (' | '.join(statements) if statements else '-'))''',
    2456: '''for method, stakeholders in (('interview', {'User1': 'Needs fast access', 'Manager': 'Wants daily reports',
                                             'IT Staff': 'Requires secure backups'}),
                              ('workshop', {'Ops': 'No requirement', 'CFO': 'Monthly cost report'})):
    for name, item in build_requirements_document(method, stakeholders).items():
        print(name + ': ' + item['method'] + ' -> ' + (', '.join(item['requirements']) or 'none'))
try:
    build_requirements_document('survey', {})
    print('no error')
except ValueError:
    print('ValueError')''',
    2519: '''report = check_requirements([
    {'id': 'R1', 'text': 'The system shall be fast.'},
    {'id': 'R2', 'text': 'The system shall log all transactions.'},
    {'id': 'R3', 'text': ''},
    {'id': 'R4', 'text': 'Easy login'},
    {'text': 'No id here at all'},
])
for requirement_id, fails in report.items():
    print(requirement_id + ': ' + (', '.join(fails) if fails else 'meets all criteria'))''',
    2727: '''import os
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
print(lines[-1])''',
    2916: '''for actions in ([{'phase': 'Plan'}, {'phase': 'Do'}, {'phase': 'Plan'}, {'phase': 'Check'}], []):
    print(' '.join(phase + '=' + str(count) for phase, count in count_pdca(actions).items()))''',
    2933: '''for tickets in ([{'resolution_time': 4, 'customer_satisfaction': 90, 'status': 'closed'},
                 {'resolution_time': 7, 'customer_satisfaction': 70, 'status': 'closed'},
                 {'resolution_time': 0, 'customer_satisfaction': 55, 'status': 'open'},
                 {'resolution_time': 2.5, 'customer_satisfaction': 88, 'status': 'closed'}],
                [{'resolution_time': 0, 'customer_satisfaction': 40, 'status': 'open'}],
                []):
    resolution, open_count, satisfaction = service_desk_kpis(tickets)
    print('avg resolution %.2f h, open %d, avg satisfaction %.2f' % (resolution, open_count, satisfaction))''',
    3155: '''result = categorize_statements(['The system must allow users to reset their password.', 'The system should be fast.',
                                'The interface must be user-friendly.', 'The database must store up to 100,000 records.',
                                'Pages must load within 2 seconds.', 'All backups must be encrypted.',
                                'The service must be reliable with 99.9% uptime.'])
for category, statements in result.items():
    print(category + ': ' + (' | '.join(statements) if statements else '-'))''',
}


def marked(reference):
    """The reference with every function body wrapped in #<< / #>> pass markers."""
    lines = reference.strip("\n").split("\n")
    tree = ast.parse("\n".join(lines))
    functions = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
    for fn in sorted(functions, key=lambda n: n.lineno, reverse=True):
        first, last = fn.body[0].lineno, fn.body[-1].end_lineno
        indent = re.match(r"\s*", lines[first - 1]).group(0)
        lines[first - 1:last] = [indent + "#<<"] + lines[first - 1:last] + [indent + "#>> pass"]
    return "\n".join(lines)


QUESTIONS = {}
for qid in (2293, 2341, 2454, 2456, 2519, 2727, 2730, 2916, 2933, 3155, 3183, 3248):
    fix = FIXES[qid]
    run = RUN.get(qid, fix["run"]).strip()
    QUESTIONS[qid] = dict(
        rules=fix.get("rules"),
        replace=fix.get("replace", []),
        ref=marked(fix["ref"]) + "\n\n\n# Runs your code on the question's data and prints the result -- keep these lines.\n"
            + run + "\n",
    )

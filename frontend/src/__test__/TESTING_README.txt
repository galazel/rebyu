REBYU AUTOMATED TESTS - TC-001 THROUGH TC-206
Proponent: Cortes, Ivan Justine

Each numbered case has its own file in this directory:
  TC-001.test.jsx
  TC-002.test.jsx
  ...
  TC-206.test.jsx

The test title and opening comment retain the catalog ID. Read the test's
Arrange/Act/Assert code and any Scope note before using it as capstone evidence.
Catalog: frontend/REBYU_UNIT_TEST_CASES.txt

RUN FROM POWERSHELL
  cd D:\capstone\frontend
  npm.cmd test

Run one case:
  npm.cmd test -- TC-001

Watch the frontend cases while editing:
  npm.cmd run test:watch

On shells without the Windows npm.ps1 execution-policy restriction, npm can be
used instead of npm.cmd. Dependencies are recorded in package.json/package-lock.json.
For a fresh checkout, install the frontend dependencies before running tests.

WHAT THE DEFAULT COMMAND RUNS
124 frontend/component or standalone Python-math cases are enabled by default.
The seven mastery-math cases TC-116 through TC-122 invoke the ACTUAL bkt_math.py
module with Python's standard library. Python must be available as 'python', or
set REBYU_PYTHON to your interpreter path. They do not require pytest.

81 native backend cases are explicitly SKIPPED in the default command. Their
files contain an executable adapter to the actual JUnit/pytest assertions, or a
new native assertion overlaid onto an existing fixture under frontend. A skipped
backend case is NOT a passed test and does NOT prove backend functionality.

TC-179 is separately BLOCKED: the industry-eligibility unit described in the
earlier catalog was not found in the inspected arena implementation. Its test
reports that missing implementation/requirement instead of inventing a function.

RUN THE NATIVE BACKEND CASES
After preparing the Java/Python test toolchains:
  npm.cmd run test:native

Or select an exact native case ID, for example:
  npm.cmd run test:native -- TC-050

Native prerequisites:
- Java 21 and the backend's Maven dependencies. The existing Maven wrapper is
  used by default. REBYU_MAVEN can name a compatible Maven executable/wrapper.
- A Python interpreter with the dependencies needed by python-backend tests,
  including pytest and the backend's development requirements. REBYU_PYTHON can
  select an already prepared environment. The interpreter here did not have
  pytest, so the opt-in Python suites were not executed during this task.
- Dependency downloads may need network access. Native execution is serial and
  may take substantially longer than frontend execution.

The native runner reads backend source but writes generated POMs, fixture copies,
compiled output and its Maven cache only under frontend/.native-test-output/.
Python runs with bytecode generation and pytest caching disabled. Existing
Python API/registry fixtures use an in-memory SQLite database. Backend application
and configuration files were not edited.

TEST LEVEL AND COVERAGE LIMITS
Most cases are isolated unit/component tests. TC-124 is an existing in-memory
API/database integration test and TC-139 is a registry/database test; their files
state this correction to the earlier catalog's unit-test label.

Some broad catalog descriptions cover more than one unit. The following files
explicitly document narrower automated coverage rather than claiming the whole
description passed:
- TC-043: heading/text/list rendering; media/tab/accordion fixtures remain extra.
- TC-044: completion-hook failure; full lesson-query error rendering is extra.
- TC-066: preservation of arena configuration; a full retake path is extra.
- TC-095, TC-097: client payload/results; page cache/display updates are extra.
- TC-104: live-controller cancellation; chat transport cancellation is extra.
- TC-123: completion-service bookkeeping; cross-service mastery isolation is extra.
- TC-135, TC-136: current AI page-reader normalization, with the reader mocked.
- TC-139: workflow identity reuse; actual broker redelivery is extra.
- TC-154: transfer request contract; native persistence/authorization are extra.
- TC-155, TC-200: institution data derivation; full dashboard rendering is extra.
- TC-157: announcement client error propagation; editor rendering is extra.
- TC-185: no false read state; the current single-item hook has no error toast.
- TC-194, TC-195: server-upload client; the file-selection hook does not upload.
- TC-201: administrative reference editor failure; other editor variants are extra.

TC-001 and TC-002 follow the currently rendered learner signup fields. First/last
name inputs currently belong to the department signup flow. They are not invented
as required learner fields by the tests.

KNOWN FAILURES FOUND DURING VALIDATION
TC-196: useFileUpload creates a preview URL but does not revoke it when unmounted.
The assertion remains enabled and failing so the issue is visible.
TC-031: the retry assertions pass, but the API client's ignored Promise.finally
result causes an unhandled rejection after a failed GET. Vitest reports an
unhandled error and exits nonzero. This must not be treated as a clean pass.

Production behavior was not changed to make these tests green. See TEST_RESULTS.txt
for the recorded run. Native assertions have not been compiled/executed here;
source-selector checks alone are not evidence that they pass.

SUPPORT FILES
support/: mocks, synthetic fixtures, browser shims and native launchers.
support/native-cases.json: identifies the opt-in backend cases.
../../vitest.config.js (from frontend root: vitest.config.js): test-only config.
The test config exposes a few internal parsing functions during testing only;
those extra exports are not added to the production application build.

Do not mark skipped, blocked, partially covered or unexecuted cases Passed in
the capstone catalog. Record actual execution dates and observed results.

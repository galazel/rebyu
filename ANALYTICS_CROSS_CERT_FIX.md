# Analytics Cross-Certification Data Leak - Diagnosis & Fix

## Problem

When you take a mock exam in **IT Passport (cert 4)**, the attempt appears in **TOPCIT's (cert 13) analytics** instead of IT Passport's. This is a cross-certification data leak.

### Root Cause

The analytics query joins assessment attempts through exams' certification foreign keys:

```sql
SELECT attempts FROM assessment_attempts aa
WHERE aa.learner_id = ?
AND aa.exam_id IN (SELECT id FROM exams WHERE certification_id = ?)
```

If a mock exam record has the **wrong `certification_id`** in the database, all attempts on that exam will appear under the wrong certification in analytics.

### Why It Happened

Both certifications have a "Mock Exam" with the same title. If the exam record for IT Passport's mock somehow got `certification_id = 13` (TOPCIT), attempts taken on it will show up in TOPCIT's analytics.

## Diagnosis

Run the diagnostic endpoint to see the current state:

```bash
# See all mock exams and their assignments
curl http://localhost:8080/api/admin/diagnostics/mock-exams

# Get a plain-text report
curl http://localhost:8080/api/admin/diagnostics/exam-certifications/report

# See duplicates grouped by title
curl http://localhost:8080/api/admin/diagnostics/exam-certifications
```

Or query the database directly:

```sql
-- File: backend-java/src/main/resources/db/diagnose-exam-certification-mismatch.sql
SELECT e.exam_id, e.title, e.certification_id, c.title as cert_title
FROM exams e
JOIN certifications c ON c.certification_id = e.certification_id
JOIN exam_types et ON et.exam_type_id = e.exam_type_id
WHERE et.exam_type_text = 'MOCK_EXAM'
ORDER BY e.title, e.certification_id;
```

**Expected output (good):**
```
exam_id | title       | certification_id | cert_title
--------|-------------|------------------|----------
  1000  | Mock Exam   | 4                | IT Passport
  2000  | Mock Exam   | 13               | TOPCIT
```

**Actual output if broken (bad):**
```
exam_id | title       | certification_id | cert_title
--------|-------------|------------------|----------
  1000  | Mock Exam   | 13               | TOPCIT    <-- WRONG! Should be 4
  2000  | Mock Exam   | 13               | TOPCIT
```

## Fix

### Step 1: Identify the Problem

```bash
curl -s http://localhost:8080/api/admin/diagnostics/exam-certifications/report
```

Look for duplicate titles pointing to different certifications.

### Step 2: Find the Correct Exam IDs

From the diagnostic output or SQL query above, note which exam_id is wrong.

Example:
- Exam 1000 ("Mock Exam") currently has `certification_id = 13` but should have `certification_id = 4` (IT Passport)

### Step 3: Repair the Assignment

```bash
curl -X POST http://localhost:8080/api/admin/diagnostics/exam-certifications/1000/move-to/4
```

Response:
```json
{
  "examId": 1000,
  "targetCertificationId": 4,
  "changed": true,
  "message": "Exam reassigned successfully. Analytics will now show attempts under the correct certification."
}
```

### Step 4: Verify the Fix

```bash
# Check that the exam is now correctly assigned
curl http://localhost:8080/api/admin/diagnostics/mock-exams

# Reload your analytics page to confirm attempts now show up correctly
# http://localhost:3000/learner/analytics?certification=4
```

## Files Added

### Diagnostic Tools
- `backend-java/src/main/resources/db/diagnose-exam-certification-mismatch.sql` — SQL diagnostic query
- `backend-java/src/main/java/.../ExamCertificationRepairService.java` — Core repair logic
- `backend-java/src/main/java/.../ExamDiagnosticsController.java` — Admin API endpoints

### Tests
- `backend-java/src/test/.../ExamCertificationIntegrityTest.java` — Automated test to prevent regression

## Impact on Learners

After the fix:
- Attempts taken on IT Passport's mock exam will now appear under IT Passport's analytics
- TOPCIT's analytics will only show attempts on TOPCIT's assessments
- No learner data is lost; we're just fixing the certification assignment

## Security Note

The `/api/admin/diagnostics` endpoints should be:
1. Protected to admins only (add `@Secured("ROLE_ADMIN")` or similar)
2. Not exposed to production unless needed for debugging
3. Removed after the issue is fixed, since they're diagnostic-only

## Related Issues

- **[[rebyu-jwt-derived-identity-pattern]]**: Similar cross-certification leaks have been found in other parts of the codebase (Bkt, File controllers had zero-auth)
- **[[rebyu-tenant-scoping-global-fetch-antipattern]]**: Frontend fetched global lists and filtered client-side, causing cross-tenant leaks

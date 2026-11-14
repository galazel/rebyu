REBYU TEST CASES (TC-001 TO TC-040)

Proponent: Cortes, Ivan Justine

Each feature has a positive and a negative test case. Record the date, action
result, and result only after executing the case. “Negative” cases verify that
invalid or unsuccessful conditions are handled correctly; a correctly rejected
input can still Pass. Capture screenshots of the observed result and hide
passwords, OTP codes, and personal information.

Proponent: Cortes, Ivan Justine
Unit Name: Sign Up
Test Case Description: Submit account registration with valid required details and a valid password.
Expected Results: Account registration is accepted and a verification code is sent to the registered email.
Action Result: Not tested
Module Name: Account Registration
Test Case: TC-001
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Sign Up
Test Case Description: Submit account registration with invalid or missing required details, such as an invalid email, weak password, or mismatched password confirmation.
Expected Results: Registration is rejected, a useful validation error is displayed, and no account is created.
Action Result: Not tested
Module Name: Account Registration
Test Case: TC-002
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Email OTP Verification
Test Case Description: Enter the current valid six-digit email verification code for the registered account.
Expected Results: Email is verified, a success message appears, and the user can proceed to sign in.
Action Result: Not tested
Module Name: Account Registration
Test Case: TC-003
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Email OTP Verification
Test Case Description: Submit an incorrect or expired verification code.
Expected Results: Verification is rejected, an error is displayed, and the account remains unverified.
Action Result: Not tested
Module Name: Account Registration
Test Case: TC-004
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Login Account
Test Case Description: Sign in with valid credentials after verifying the account.
Expected Results: Sign-in succeeds and the learner is taken to the appropriate authenticated page.
Action Result: Not tested
Module Name: Account Validation
Test Case: TC-005
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Login Account
Test Case Description: Attempt to sign in with an incorrect password or an unverified account.
Expected Results: Sign-in is rejected with an appropriate message and protected learner pages remain inaccessible.
Action Result: Not tested
Module Name: Account Validation
Test Case: TC-006
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Forgot Password
Test Case Description: Request password recovery using a registered email address.
Expected Results: The recovery request is accepted and the configured recovery email or link is sent.
Action Result: Not tested
Module Name: Password Recovery
Test Case: TC-007
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Forgot Password
Test Case Description: Request password recovery using an invalid email address or an address not registered in the system.
Expected Results: The request is handled safely with an appropriate message and no password is changed for another account.
Action Result: Not tested
Module Name: Password Recovery
Test Case: TC-008
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Certification and Module View
Test Case Description: Open the learner curriculum and view an enrolled certification and its modules.
Expected Results: The enrolled certification, modules, and available lessons are displayed with their relevant progress and status.
Action Result: Not tested
Module Name: Curriculum
Test Case: TC-009
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Certification and Module View
Test Case Description: Open the curriculum when the learner has no enrollment or requests a certification that is unavailable.
Expected Results: The system shows an appropriate empty or unavailable state and does not display incorrect enrollment information.
Action Result: Not tested
Module Name: Curriculum
Test Case: TC-010
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Lesson Content
Test Case Description: Open an available lesson containing supported text, lists, media, tabs, or accordions.
Expected Results: The lesson loads and its available content blocks render without missing content or broken layout.
Action Result: Not tested
Module Name: Lesson Delivery
Test Case: TC-011
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Lesson Content
Test Case Description: Attempt to open a nonexistent, unavailable, or unauthorized lesson.
Expected Results: The lesson is not shown as successfully loaded; the learner receives an appropriate unavailable or access message.
Action Result: Not tested
Module Name: Lesson Delivery
Test Case: TC-012
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Start Assessment
Test Case Description: Start an available assessment for which the learner is eligible.
Expected Results: The attempt opens with its questions and required assessment controls, using a stable question snapshot for that attempt.
Action Result: Not tested
Module Name: Assessment Engine
Test Case: TC-013
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Start Assessment
Test Case Description: Attempt to start an unavailable assessment or access an assessment without permission.
Expected Results: The attempt does not start and an appropriate unavailable or access message is shown.
Action Result: Not tested
Module Name: Assessment Engine
Test Case: TC-014
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Multiple Choice Grading
Test Case Description: Submit a multiple-choice question with the correct option.
Expected Results: The answer is graded as correct and the corresponding score is applied.
Action Result: Not tested
Module Name: Assessment Engine
Test Case: TC-015
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Multiple Choice Grading
Test Case Description: Submit a multiple-choice question with an incorrect option.
Expected Results: The answer is graded as incorrect and the score follows the configured grading rule.
Action Result: Not tested
Module Name: Assessment Engine
Test Case: TC-016
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Short Answer Grading
Test Case Description: Submit a configured accepted variation for a short-answer question.
Expected Results: The accepted answer variation is graded according to the question's configured accepted answers.
Action Result: Not tested
Module Name: Assessment Engine
Test Case: TC-017
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Short Answer Grading
Test Case Description: Submit an answer that does not match any configured accepted answer.
Expected Results: The answer is graded as incorrect according to the configured grading rules.
Action Result: Not tested
Module Name: Assessment Engine
Test Case: TC-018
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Descriptive Answer Grading
Test Case Description: Submit a descriptive response that satisfies the configured rubric criteria.
Expected Results: The response is evaluated using the rubric and receives the appropriate score or feedback.
Action Result: Not tested
Module Name: Assessment Engine
Test Case: TC-019
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Descriptive Answer Grading
Test Case Description: Submit an empty descriptive response or a response that does not satisfy the rubric criteria.
Expected Results: The response is handled according to required-field and rubric rules; it is not incorrectly awarded full marks.
Action Result: Not tested
Module Name: Assessment Engine
Test Case: TC-020
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Code Execution
Test Case Description: Submit a valid programming solution that passes the configured test cases.
Expected Results: The solution is evaluated and reported as passing the applicable test cases.
Action Result: Not tested
Module Name: Programming Assessment
Test Case: TC-021
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Code Execution
Test Case Description: Submit a programming solution with incorrect output or a compile/runtime error.
Expected Results: The solution is not reported as passing; the evaluation provides the available failure or error status.
Action Result: Not tested
Module Name: Programming Assessment
Test Case: TC-022
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Diagram Grading
Test Case Description: Submit a diagram with the expected structure for a diagram question.
Expected Results: The diagram is evaluated by structural comparison and receives the appropriate matching result or score.
Action Result: Not tested
Module Name: Diagram Assessment
Test Case: TC-023
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Diagram Grading
Test Case Description: Submit an empty or structurally incorrect diagram response.
Expected Results: The response is not incorrectly treated as a full match and receives the appropriate grading outcome.
Action Result: Not tested
Module Name: Diagram Assessment
Test Case: TC-024
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Mastery and Priority Update
Test Case Description: Answer lesson questions correctly and review mastery or topic priority afterward.
Expected Results: The adaptive result reflects the correct answers and updates mastery or priority according to the configured model.
Action Result: Not tested
Module Name: Adaptive Learning
Test Case: TC-025
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Mastery and Priority Update
Test Case Description: Answer lesson questions incorrectly and review mastery or topic priority afterward.
Expected Results: The adaptive result reflects the incorrect answers and does not incorrectly report the topic as mastered.
Action Result: Not tested
Module Name: Adaptive Learning
Test Case: TC-026
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Plan Activities
Test Case Description: Open or generate a study plan for an enrolled certification with a valid target exam date.
Expected Results: The plan displays scheduled activities for the selected certification and target date, using supported study techniques when applicable.
Action Result: Not tested
Module Name: Study Plans
Test Case: TC-027
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Plan Activities
Test Case Description: Try to create or update a study plan with a missing or invalid target exam date.
Expected Results: The invalid date is rejected or safely handled, and no misleading schedule is displayed.
Action Result: Not tested
Module Name: Study Plans
Test Case: TC-028
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Arena Availability
Test Case Description: Open a challenge arena that has configured problems and is available to the learner.
Expected Results: The arena and its available problems can be viewed or started by the learner.
Action Result: Not tested
Module Name: Challenges
Test Case: TC-029
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Arena Availability
Test Case Description: Attempt to open an arena with no configured problems or one unavailable to the learner.
Expected Results: The arena remains locked or unavailable and the learner cannot start an invalid challenge.
Action Result: Not tested
Module Name: Challenges
Test Case: TC-030
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Question Bank
Test Case Description: As an authorized admin, create a valid question and view the saved item.
Expected Results: The question is saved and appears in the question bank with the entered details.
Action Result: Not tested
Module Name: Administration
Test Case: TC-031
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Question Bank
Test Case Description: Attempt to save a question with missing or invalid required fields.
Expected Results: The invalid question is not saved and validation feedback identifies the issue.
Action Result: Not tested
Module Name: Administration
Test Case: TC-032
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Learner Invitation and Seats
Test Case Description: As an authorized institution user, invite a learner using valid details when a seat is available.
Expected Results: The invitation or seat assignment is recorded and its status is visible in the institution portal.
Action Result: Not tested
Module Name: Institutions
Test Case: TC-033
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Learner Invitation and Seats
Test Case Description: Attempt to invite a learner using invalid details or when no seat is available.
Expected Results: The invitation or assignment is rejected or marked unavailable with an appropriate message; no incorrect seat assignment is recorded.
Action Result: Not tested
Module Name: Institutions
Test Case: TC-034
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Progress and Assessment History
Test Case Description: Review learner analytics after completing an assessment.
Expected Results: The analytics page displays the available assessment and progress data consistently with the completed activity.
Action Result: Not tested
Module Name: Learner Analytics
Test Case: TC-035
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Progress and Assessment History
Test Case Description: Review analytics for a learner with no completed assessments or no recorded progress.
Expected Results: The page displays an appropriate empty state or zero progress without errors or misleading results.
Action Result: Not tested
Module Name: Learner Analytics
Test Case: TC-036
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Lesson Knowledge Check
Test Case Description: Submit a valid response to a lesson knowledge check.
Expected Results: The response is accepted, evaluated, and the result or progress update is displayed.
Action Result: Not tested
Module Name: Knowledge Checks
Test Case: TC-037
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Lesson Knowledge Check
Test Case Description: Submit an empty or invalid response to a required lesson knowledge check.
Expected Results: The response is not incorrectly accepted as complete; the learner receives appropriate validation feedback.
Action Result: Not tested
Module Name: Knowledge Checks
Test Case: TC-038
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Learner Notifications
Test Case Description: Open a learner account with an applicable reminder or notification.
Expected Results: The applicable notification is displayed to the correct learner.
Action Result: Not tested
Module Name: Notifications
Test Case: TC-039
Date Tested: <MM/DD/YY>
Result: Pending

Proponent: Cortes, Ivan Justine
Unit Name: Learner Notifications
Test Case Description: Open notifications when there are no applicable reminders or notification events.
Expected Results: An appropriate empty state is displayed and no unrelated learner notification is shown.
Action Result: Not tested
Module Name: Notifications
Test Case: TC-040
Date Tested: <MM/DD/YY>
Result: Pending

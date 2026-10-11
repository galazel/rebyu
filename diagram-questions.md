# Diagram questions

112 questions, graded against each question's reference diagram.

| Type | Questions |
|---|---|
| ER Diagram | 41 |
| Component Diagram | 21 |
| Activity Diagram | 17 |
| Flowchart | 17 |
| Class Diagram | 10 |
| Sequence Diagram | 4 |
| Use Case Diagram | 2 |


## Activity Diagram (17)

### Q2204 — Helios" Expense Management - Claim Approval Process

- **Certification:** TOPCIT  
- **Lesson:** Requirements Specification  
- **Used in exams:** Requirements Specification Quiz

<details><summary>Full question</summary>

"Helios" Expense Management - Claim Approval Process

Helios is automating the approval of employee expense claims. The process must be modelled before it is built.

a) An employee submits a claim. The system validates it against the receipt rules and the policy limits.
b) If any receipt is missing or unreadable the claim is returned to the employee, who may correct and resubmit it. A claim may go round this loop any number of times.
c) A claim of 500 or less needs the line manager's approval only.
d) A claim over 500 needs the line manager's AND the finance officer's approval. Those two reviews are independent: they may happen in either order or at the same time, and the claim proceeds only once both are in.
e) If every required approval is given the reimbursement is scheduled. If any approver rejects it, no reimbursement is scheduled.
f) In both cases the employee is notified of the outcome, and the process then ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every action in requirements (a) to (f) as an activity.
3. Model (b) as a loop returning to submission, not as a branch that terminates.
4. Model (d) with a fork and a join. Explain in one sentence why a decision node would model it incorrectly.
5. Label EVERY decision branch with its guard, and state which guard makes the two-approval path the exception rather than the default.

</details>

### Q2460 — Database Requirements Collection Process

- **Certification:** TOPCIT  
- **Lesson:** Database Requirements Collection  
- **Used in exams:** Database Requirements and Analysis Exam

<details><summary>Full question</summary>

Database Requirements Collection Process

A data architect is documenting how requirements for a new database are collected, so that no project skips a source of truth.

a) The team first agrees the scope and identifies the stakeholders.
b) Three fact-finding activities then run: interviewing stakeholders, examining the existing forms and reports, and observing current working practice. They are independent -- they may happen in any order or at the same time -- and the work proceeds only when all three are complete.
c) The findings are consolidated into a data dictionary.
d) If two sources define the same item differently, the conflict is resolved with the data owners and consolidation is redone. This may happen any number of times.
e) Once the dictionary is consistent, a conceptual model is drafted and validated with the stakeholders.
f) If the stakeholders do not accept the model, it is revised and validated again -- fact-finding is not repeated.
g) When they accept it, the model is signed off and baselined, and the process ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every action in requirements (a) to (g) as an activity.
3. Model requirement (b) with a fork and a join. Explain in one sentence what the join guarantees that three sequential activities would not, and why a decision node would be the wrong notation here.
4. Label EVERY decision branch with its guard.
5. Requirements (d) and (f) loop to different places. Show both, and state in one sentence why a rejected model must not send the team back to interviewing stakeholders.

</details>

### Q2500 — Software Design Process - Architecture to Detailed Design

- **Certification:** TOPCIT  
- **Lesson:** Software Design Fundamentals  
- **Used in exams:** Software Development Exam; Study plan mock exam · 2026-09-28

<details><summary>Full question</summary>

Software Design Process - Architecture to Detailed Design

A design authority is writing down the route from baselined requirements to a baselined design.

a) The designer reviews the baselined requirements, then chooses an architectural style.
b) The chosen style is checked against the quality attributes. If it does not satisfy them, an alternative is evaluated and the choice is made again. This may happen any number of times.
c) Once a style is accepted, three design activities run: designing the data model, designing the interfaces, and decomposing the system into components. They are independent and may proceed in parallel; detailed design starts only when all three are complete.
d) The detailed component design is produced, then put through a design review.
e) If the review passes, the design is baselined and the process ends.
f) If the review fails, the team asks whether the architecture itself is at fault. If it is, the process returns to choosing the architectural style. If it is only a local defect, the detailed design is reworked and reviewed again.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every action in requirements (a) to (f) as an activity.
3. Model requirement (c) with a fork and a join, and explain in one sentence what the join guarantees.
4. Label EVERY decision branch with its guard. Requirement (f) needs a decision whose two branches return to different points -- show both.
5. Requirement (f) makes rework cost depend on where the fault is. State in one sentence which of the two branches is the expensive one and why, and what requirement (b) is trying to do about it.

</details>

### Q2525 — Modular Design - Decomposition, Cohesion and Coupling

- **Certification:** TOPCIT  
- **Lesson:** Software Design Fundamentals  
- **Used in exams:** Active recall · 2026-09-19; Active recall · 2026-09-19; Active recall · 2026-09-19; Active recall · 2026-09-19; Active recall · 2026-09-19; Active recall · 2026-09-19; Active recall · 2026-09-23; Active recall · 2026-09-23; Active recall · 2026-09-23; Active recall · 2026-09-23; Active recall · 2026-09-23; Software Development Exam; TOPCIT Diagnostic Exam

<details><summary>Full question</summary>

Modular Design - Decomposition, Cohesion and Coupling

A design authority is documenting how a system is broken into modules and how that decomposition is judged.

a) The designer reads the design requirements, then decomposes the system into candidate modules.
b) Two assessments then run: measuring the cohesion of each module and measuring the coupling between modules. They are independent and may be done in either order or at the same time; judgement waits until both are complete.
c) If any module's cohesion is unacceptable, that module is split and the decomposition is done again.
d) If coupling between modules is unacceptable, an interface is introduced to decouple them and the decomposition is done again.
e) When both are acceptable, each module's interface contract is specified.
f) The decomposition is peer reviewed. If the review fails, the team returns to decomposition. If it passes, the module structure is baselined and the process ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every action in requirements (a) to (f) as an activity.
3. Model requirement (b) with a fork and a join, and explain in one sentence why the two assessments must both complete before either decision is taken.
4. Label EVERY decision branch with its guard, and show all three loops returning to the correct activity.
5. Requirements (c) and (d) pull in opposite directions: splitting a module to raise cohesion tends to raise coupling. State in one sentence what a designer is actually optimising, and why the process loops rather than running once.

</details>

### Q2541 — Normalisation - From Unnormalised Data to Third Normal Form

- **Certification:** TOPCIT  
- **Lesson:** Data Modeling Techniques  
- **Used in exams:** Database Construction and Management Exam

<details><summary>Full question</summary>

Normalisation - From Unnormalised Data to Third Normal Form

A data architect is documenting the normalisation procedure so that every schema is derived the same way.

a) The architect collects the unnormalised relation, then identifies the candidate keys and the functional dependencies.
b) While any repeating group remains, it is removed into a new relation. When none remains the relation is in first normal form.
c) While any non-key attribute depends on only part of a composite key, that partial dependency is removed into a new relation. When none remains the relation is in second normal form.
d) While any non-key attribute depends on another non-key attribute, that transitive dependency is removed into a new relation. When none remains the relation is in third normal form.
e) The resulting set of relations is checked for the lossless-join property and for dependency preservation. If either fails, the architect returns to identifying the dependencies and decomposes differently.
f) If measured performance requires it, a specific denormalisation may then be made deliberately, and the reason recorded. Otherwise none is made.
g) The logical schema is published and the process ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every step in requirements (a) to (g) as an activity.
3. Requirements (b), (c) and (d) each say "while any remains". Model each as a loop that re-tests its own condition, not as a single pass, and label every guard.
4. Requirement (e) loops back further than requirements (b) to (d) do. Show that, and explain in one sentence why a failed lossless-join check cannot be repaired by simply removing one more dependency.
5. Requirement (f) comes AFTER normalisation, not instead of it. State in one sentence why the order matters, and what the recorded reason protects the next architect from.

</details>

### Q2559 — Denormalisation Decision for a Reporting Warehouse

- **Certification:** TOPCIT  
- **Lesson:** Data Modeling Techniques  
- **Used in exams:** Database Construction and Management Exam

<details><summary>Full question</summary>

Denormalisation Decision for a Reporting Warehouse

A data architect is documenting when denormalisation is justified, so that it is a measured decision rather than a habit.

a) The architect starts from the normalised schema and measures the slow query workload against the performance target.
b) If the target is already met, nothing is changed and the reason is recorded.
c) If it is not met, three cheaper remedies are tried: adding an index, rewriting the query, and building a materialised view. They are independent and may be tried in any order or at the same time; the decision waits until all three have been evaluated.
d) If the target is now met without changing the schema, the reason is recorded and the process ends.
e) Only if it is still not met is a denormalisation chosen, applied, and the logic that keeps the duplicated data consistent added with it.
f) The write cost is then checked. If it is unacceptable, the denormalisation is reverted and the workload is measured again.
g) If it is acceptable, the reason and the trade-off are recorded, and the process ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every step in requirements (a) to (g) as an activity.
3. Model requirement (c) with a fork and a join, and explain in one sentence what the join guarantees about the decision that follows it.
4. Label EVERY decision branch with its guard. Three different branches reach the recording step -- show all three converging on one activity rather than drawing it three times.
5. Requirement (e) attaches maintaining logic to the denormalisation. State in one sentence what fails if that logic is omitted, and name the property that normalisation was protecting in the first place.

</details>

### Q2649 — ISMS Monitoring and Continual Improvement

- **Certification:** TOPCIT  
- **Lesson:** ISMS Monitoring and Improvement  
- **Used in exams:** ISMS Monitoring and Improvement Quiz

<details><summary>Full question</summary>

ISMS Monitoring and Continual Improvement

An information security manager is documenting the check-and-act half of the management system cycle.

a) The manager plans the monitoring programme for the period.
b) Three monitoring activities then run: collecting control performance metrics, conducting the internal audit, and reviewing security incidents. They are independent and may run in any order or at the same time; analysis waits until all three are complete.
c) The results are analysed against the security objectives.
d) If a nonconformity is found, a root cause analysis is performed, a corrective action is raised, and the action is implemented.
e) The corrective action's effectiveness is then checked. If it was not effective, the root cause analysis is done again -- raising a second action without re-analysing the cause is not permitted.
f) Whether or not there was a nonconformity, a management review is held.
g) The review asks whether the ISMS is still suitable. If it is not, the objectives or the scope are changed.
h) In both cases the monitoring programme is updated for the next period, and the cycle ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every action in requirements (a) to (h) as an activity.
3. Model requirement (b) with a fork and a join, and explain in one sentence what the join guarantees about the analysis that follows.
4. Label EVERY decision branch with its guard. Requirement (f) means two different branches converge on the management review -- show them converging on one activity rather than drawing it twice.
5. Requirement (e) sends an ineffective action back to root cause analysis, not to raising another action. Explain in one sentence why, and name the two phases of the plan-do-check-act cycle that this diagram covers.

</details>

### Q2761 — ISMS Control Implementation

- **Certification:** TOPCIT  
- **Lesson:** ISMS Implementation and Operation  
- **Used in exams:** Information Security Management Systems Exam

<details><summary>Full question</summary>

ISMS Control Implementation

A security manager is documenting how a control moves from the statement of applicability to being declared implemented.

a) The manager reads the statement of applicability for the control.
b) If the control is not applicable, the justification for excluding it is recorded and the process ends there.
c) An applicable control is assigned a control owner, and a gap analysis is performed against current practice.
d) Three implementation activities then run: writing the procedure, configuring the technical control, and training the affected staff. They are independent and may be done in any order or at the same time; operation starts only when all three are complete.
e) The control is operated for one period, operating evidence is collected, and its effectiveness is tested.
f) If it is not operating effectively, the deficiency is remediated and the team asks whether the control's DESIGN was at fault.
g) If the design was at fault, the process returns to the gap analysis. If it was only an operating fault, it returns to operating the control for another period.
h) When the control is operating effectively it is declared implemented and the process ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node -- requirement (b) also terminates, so route it to the same final node.
2. Show every action in requirements (a) to (h) as an activity.
3. Model requirement (d) with a fork and a join, and explain in one sentence what the join guarantees before the control is operated.
4. Label EVERY decision branch with its guard, and show both loops in requirement (g) returning to their correct activities.
5. Requirement (f) distinguishes a design fault from an operating fault. Explain in one sentence what separates them, and why the two are sent to different places in the process.

</details>

### Q2834 — Oakhaven Manufacturing" - DMAIC Improvement Cycle

- **Certification:** TOPCIT  
- **Lesson:** Business Problem Solving  
- **Used in exams:** Business Analysis and Strategy Exam

<details><summary>Full question</summary>

"Oakhaven Manufacturing" - DMAIC Improvement Cycle

Oakhaven's improvement projects jump straight from a complaint to a solution. Model the five-phase cycle they are adopting instead.

a) The team defines the problem and its scope, and puts a business case. If the case is not approved the project is closed without proceeding.
b) If it is approved, two measurement activities run: measuring the current baseline and assessing whether the measurement system itself is trustworthy. They are independent and may run in either order or at the same time; analysis waits until both are complete.
c) The team analyses for root causes.
d) If a root cause is not evidenced by the data, more data is gathered and the analysis is repeated. This may happen any number of times.
e) Once a root cause is evidenced, an improvement is designed and piloted.
f) If the pilot does not meet the target, the improvement is redesigned and piloted again.
g) If it does, the improvement is rolled out fully, then handed over with ongoing monitoring.
h) If the gains are not held, the reaction plan is applied and monitoring continues.
i) When the gains hold, the project is closed and the lessons recorded.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node -- requirement (a) also terminates, so route it to the same final node.
2. Show every action in requirements (a) to (i) as an activity, and mark which of the five DMAIC phases each belongs to.
3. Model requirement (b) with a fork and a join, and explain in one sentence why the measurement system must be assessed before any conclusion is drawn from the baseline.
4. Label EVERY decision branch with its guard, and show all three loops returning to the correct activity.
5. Requirement (h) loops back to monitoring rather than to the improvement design. Explain in one sentence why, and state what the opening paragraph's "straight to a solution" approach skips.

</details>

### Q2901 — ISMS Internal Audit

- **Certification:** TOPCIT  
- **Lesson:** ISMS Implementation and Operation  
- **Used in exams:** Understanding of Security Exam

<details><summary>Full question</summary>

ISMS Internal Audit

An information security manager is documenting how an internal audit is conducted, so that an external assessor can see it is systematic and impartial.

a) The audit is planned and its scope agreed, then the auditor's independence is confirmed.
b) An auditor who is not independent of the area being audited is replaced, and independence is confirmed again.
c) Three evidence-gathering activities then run: reviewing the documentation, interviewing the control owners, and observing the control in operation. They are independent and may run in any order or at the same time; assessment waits until all three are complete.
d) The evidence is assessed against the audit criteria.
e) If a nonconformity is found it is raised, and classified as major or minor. A major nonconformity is additionally escalated to management; a minor one is not.
f) Whether or not a nonconformity was found, the audit report is issued.
g) The auditee's proposed corrective actions are reviewed. If they are not accepted, revised actions are agreed and reviewed again.
h) Once accepted, the audit is closed and a follow-up is scheduled.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every action in requirements (a) to (h) as an activity.
3. Model requirement (c) with a fork and a join, and explain in one sentence what the join guarantees before the assessment is made.
4. Label EVERY decision branch with its guard. Requirements (e) and (f) mean three different branches converge on the report -- show them converging on one activity rather than drawing it three times.
5. Requirement (b) is about impartiality, not competence. Explain in one sentence why independence is confirmed BEFORE any evidence is gathered, and what an external assessor would conclude if it were confirmed afterwards.

</details>

### Q2943 — Drummond Telecom" - Month-End Billing Close

- **Certification:** TOPCIT  
- **Lesson:** IT Business Operations  
- **Used in exams:** Understanding of IT Business Exam

<details><summary>Full question</summary>

"Drummond Telecom" - Month-End Billing Close

Drummond's billing close overruns because rating exceptions are chased indefinitely. Model the process, including what happens when they cannot be fixed in time.

a) The usage collection window is frozen.
b) Three preparation activities then run: mediating and deduplicating the usage, loading the tariff effective for the period, and refreshing customer account status. They are independent and may run in any order or at the same time; rating starts only when all three are complete.
c) The usage is rated.
d) If rating exceptions arise they are resolved, and the team asks whether they can be resolved before the cutoff.
e) If they can, the usage is re-rated. If they cannot, the affected usage is parked to the next billing period and the close continues without it.
f) Bills are generated and reconciled against the ledger.
g) If they do not reconcile, the variance is investigated and reconciliation is attempted again -- rating is NOT repeated.
h) Once reconciled, invoices are issued and customers notified, the period is closed, and the process ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every action in requirements (a) to (h) as an activity.
3. Model requirement (b) with a fork and a join, and explain in one sentence what the join guarantees before any usage is rated.
4. Label EVERY decision branch with its guard, and show both loops returning to their correct activities.
5. Requirement (e) is what stops the overrun described in the opening paragraph. Explain in one sentence what parking the usage costs the business, and why that is preferable to holding the close open.

</details>

### Q2966 — Defining a New Key Performance Indicator

- **Certification:** TOPCIT  
- **Lesson:** Key Performance Indicators  
- **Used in exams:** TOPCIT Diagnostic Exam; Understanding of IT Business Exam

<details><summary>Full question</summary>

Defining a New Key Performance Indicator

A performance manager is documenting how a new KPI is created, so that no measure reaches the scorecard without a target, an owner and a data source.

a) The objective the KPI serves is identified.
b) If the objective is not measurable as stated, it is restated and identified again. This may happen any number of times.
c) Once it is measurable, the metric and its formula are defined.
d) Three activities then run: identifying the data source, establishing a baseline, and appointing a metric owner. They are independent and may be done in any order or at the same time; the target is set only when all three are complete.
e) The target and its threshold are set.
f) If the target is not achievable, it is renegotiated with the objective owner and set again.
g) The metric is piloted for one period.
h) If it does not behave as expected, the formula or the data source is adjusted, and the definition step is repeated.
i) When it behaves as expected it is published to the scorecard, and the process ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every action in requirements (a) to (i) as an activity.
3. Model requirement (d) with a fork and a join, and explain in one sentence what the join guarantees before a target is set.
4. Label EVERY decision branch with its guard, and show all three loops returning to the correct activity.
5. Requirement (h) loops back further than requirement (f) does. Explain in one sentence why an unachievable target is a cheaper problem than a misbehaving metric, and what requirement (g) is protecting the scorecard from.

</details>

### Q3073 — Thornbury Engineering" - Translation and Localisation

- **Certification:** TOPCIT  
- **Lesson:** Technical Document Types and Processes  
- **Used in exams:** Technical Documentation Exam

<details><summary>Full question</summary>

"Thornbury Engineering" - Translation and Localisation

Thornbury translates manuals into eleven languages, and errors in the English source have twice been translated eleven times before anyone noticed. Model the process so that cannot happen.

a) The source revision is frozen. If it is not yet approved for translation, the work is held until it is.
b) The translatable content is extracted, and the translation memory is applied to reuse previously translated segments.
c) Three activities then run: translating the new segments, checking against the terminology glossary, and adapting the layout for the target locale. They are independent and may run in any order or at the same time; review waits until all three are complete.
d) An in-country native speaker reviews the translation for language.
e) If it is not linguistically accepted, the translation is corrected and reviewed again.
f) A technical review then checks it against the source.
g) If it is not technically faithful, the team asks whether the SOURCE itself is at fault. If it is, the process returns to freezing a corrected source. If it is not, it is a translation error and goes back to correction.
h) Once technically faithful it is published and the translation memory updated, and the process ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every action in requirements (a) to (h) as an activity.
3. Model requirement (c) with a fork and a join, and explain in one sentence what the join guarantees before the in-country review.
4. Label EVERY decision branch with its guard, and show all three loops returning to the correct activity.
5. Requirement (g) is what stops the failure in the opening paragraph. Explain in one sentence why a source fault must return to the source rather than be patched in the translation, and what that costs when eleven languages are already in progress.

</details>

### Q3097 — Evaluating Responses to a Request for Information

- **Certification:** TOPCIT  
- **Lesson:** Request for Information (RFI)  
- **Used in exams:** Business Proposals and RFI/RFP Exam

<details><summary>Full question</summary>

Evaluating Responses to a Request for Information

A procurement lead is documenting how RFI responses are evaluated, so that the scoring cannot be shaped by what the responses happen to say.

a) The response window is closed.
b) The scoring model is agreed BEFORE any response is opened.
c) The responses are opened.
d) An incomplete response gets one clarification request. If it is clarified in time it proceeds; if not, that response is excluded from scoring but is still recorded.
e) Three scoring activities then run for each remaining response: scoring the technical fit, the commercial indicators and supplier risk. They are independent and may be done in any order or at the same time; weighting waits until all three are complete.
f) The agreed weightings are applied, and scores are moderated across evaluators.
g) If the evaluators' scores have not converged, they discuss and re-score.
h) Once converged, the market findings report is produced.
i) If the requirement is still not understood, a further market engagement is run and the cycle repeats.
j) If it is understood, proceeding to an RFP is recommended, and the process ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every action in requirements (a) to (j) as an activity.
3. Model requirement (e) with a fork and a join, and explain in one sentence what the join guarantees before weightings are applied.
4. Label EVERY decision branch with its guard. Requirement (d) has two branches that both continue -- show the excluded response reaching the weighting step rather than terminating.
5. Requirement (b) is the control the whole process depends on. Explain in one sentence what agreeing the scoring model first prevents, and what an auditor would look for to confirm the order was followed.

</details>

### Q3111 — Resolving a Resource Conflict

- **Certification:** TOPCIT  
- **Lesson:** Project Scheduling and Resources  
- **Used in exams:** Project Planning and Strategy Exam

<details><summary>Full question</summary>

Resolving a Resource Conflict

A project manager is documenting how an over-allocated resource is dealt with, so that the end date is only moved by a decision rather than by drift.

a) The over-allocation is detected, and the overload and its dates are quantified.
b) If the affected task is NOT on the critical path, it is delayed within its float and the schedule is updated. No escalation is needed.
c) If it IS on the critical path, three options are evaluated: rescheduling the task, adding a resource, and reducing scope. They are independent and may be evaluated in any order or at the same time; the comparison waits until all three are done.
d) The options are compared on cost, time and quality.
e) If an option is within the project manager's authority it is applied.
f) If none is, the decision is escalated to the sponsor. If the sponsor approves an option it is applied; if not, the delay is accepted and the schedule re-baselined.
g) The schedule is updated and stakeholders informed.
h) If the conflict is not resolved, detection begins again. When it is resolved the process ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every action in requirements (a) to (h) as an activity.
3. Model requirement (c) with a fork and a join, and explain in one sentence what the join guarantees before the options are compared.
4. Label EVERY decision branch with its guard. Three different branches reach the "apply the chosen option" and "update the schedule" steps -- show them converging rather than drawn repeatedly.
5. Requirement (b) turns on float. Explain in one sentence what float is and why its absence is what forces the escalation, and state which of the three options in requirement (c) changes the project's scope baseline.

</details>

### Q3135 — Assessing the Impact of a Requirement Change

- **Certification:** TOPCIT  
- **Lesson:** System Requirements Management  
- **Used in exams:** Project Management Major Exam; Requirements and System Specifications Exam

<details><summary>Full question</summary>

Assessing the Impact of a Requirement Change

A requirements manager is documenting how a change request is assessed, so that its cost is known before it is approved rather than after.

a) The change request is received and checked for being well-formed. If it is not, it is returned for clarification and received again.
b) The affected requirements are located.
c) Three impact traces then run: on the design, on the code and interfaces, and on the test assets. They are independent and may be done in any order or at the same time; estimation waits until all three are complete.
d) The cost, effort and schedule impact are estimated, and the risk of making the change is assessed.
e) The assessment is presented to the change board.
f) The board reaches one of three decisions: approved, deferred to a future release, or rejected with the rationale recorded.
g) If approved, the requirements are updated and re-baselined.
h) In all three cases every affected stakeholder is informed, and the process ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node.
2. Show every action in requirements (a) to (h) as an activity.
3. Model requirement (c) with a fork and a join, and explain in one sentence what the join guarantees before the estimate is produced.
4. Requirement (f) is a single decision with THREE outgoing branches, not two. Draw it that way and label every guard.
5. Requirement (h) means all three branches converge. Show them reaching one "inform stakeholders" activity, and explain in one sentence why a rejected change still requires stakeholders to be told.

</details>

### Q3188 — Preparing a Supplier Response to an RFI

- **Certification:** TOPCIT  
- **Lesson:** Request for Information (RFI)  
- **Used in exams:** Technical Communications Exam

<details><summary>Full question</summary>

Preparing a Supplier Response to an RFI

A supplier's last RFI response promised a delivery date nobody had approved. Model the response process so that cannot recur.

a) The RFI is received and logged.
b) The team decides whether it is worth responding to. If not, it declines politely, records why, and the process ends there.
c) A response owner is appointed, and every question is read and mapped to the person who will answer it.
d) Three drafting activities then run: the technical answers, the commercial answers, and assembling references and case studies. They are independent and may be done in any order or at the same time; consolidation waits until all three are complete.
e) The answers are consolidated into one voice.
f) If any question is unanswered, the gap is filled or a clarification requested, and consolidation is redone.
g) The response is reviewed for accuracy AND for any commitment it makes.
h) If it contains a commitment nobody has approved, that commitment is removed or escalated for approval, and the review is repeated.
i) The response is submitted before the deadline, and the process ends.

Tasks
1. Draw the activity diagram with exactly one initial node and one final node -- requirement (b) also terminates, so route it to the same final node.
2. Show every action in requirements (a) to (i) as an activity.
3. Model requirement (d) with a fork and a join, and explain in one sentence what the join guarantees before consolidation.
4. Label EVERY decision branch with its guard, and show both loops returning to the correct activity.
5. Requirement (h) is the control that answers the opening paragraph. Explain in one sentence why the check sits AFTER consolidation rather than during drafting, and what a commitment in an RFI response can legally become.

</details>


## ER Diagram (41)

### Q23248 — [BP-1790804150394-N1] Draw an ERD for a student enrollment system with these entities and attributes: Student (PK studen

- **Certification:** IT Passport Exam  
- **Lesson:** Management Principles and Organizational Structures  
- **Used in exams:** none (question bank only)

<details><summary>Full question</summary>

[BP-1790804150394-N1] Draw an ERD for a student enrollment system with these entities and attributes: Student (PK studentId, name, email, yearLevel); Course (PK courseCode, FK instructorId, title, units); Instructor (PK instructorId, name, department); Enrollment (PK enrollmentId, FK studentId, FK courseCode, semester, grade). An instructor teaches courses, a student makes enrollments, and each enrollment is for one course. Show every relationship with its cardinality.

</details>

### Q23250 — [BP-1790804150394-N2] Draw an ERD for a library management system with these entities and attributes: Member (PK memberI

- **Certification:** IT Passport Exam  
- **Lesson:** Management Principles and Organizational Structures  
- **Used in exams:** none (question bank only)

<details><summary>Full question</summary>

[BP-1790804150394-N2] Draw an ERD for a library management system with these entities and attributes: Member (PK memberId, name, email, joinDate); Book (PK isbn, title, author, publishedYear); BookCopy (PK copyId, FK isbn, shelfLocation, status); Loan (PK loanId, FK memberId, FK copyId, loanDate, dueDate, returnDate). A book has physical copies, a member borrows through loans, and each loan is for one copy. Show every relationship with its cardinality.

</details>

### Q23252 — [BP-1790804150394-N3] Draw an ERD for an e-commerce platform with these entities and attributes: Customer (PK customerId

- **Certification:** IT Passport Exam  
- **Lesson:** Management Principles and Organizational Structures  
- **Used in exams:** none (question bank only)

<details><summary>Full question</summary>

[BP-1790804150394-N3] Draw an ERD for an e-commerce platform with these entities and attributes: Customer (PK customerId, name, email, shippingAddress); Product (PK productId, name, price, stockQty); CustomerOrder (PK orderId, FK customerId, orderDate, status, totalAmount); OrderItem (PK orderItemId, FK orderId, FK productId, quantity, unitPrice); Payment (PK paymentId, FK orderId, method, amount, paidAt). A customer places orders, an order contains order items, each item is for one product, and an order is settled by a payment. Show every relationship with its cardinality.

</details>

### Q23262 — A regional power utility tracks electricity generation, transmission, and billing. Each PowerPlant has a capacity rating

- **Certification:** IT Passport Exam  
- **Lesson:** Management Principles and Organizational Structures  
- **Used in exams:** Blueprint Arena

<details><summary>Full question</summary>

A regional power utility tracks electricity generation, transmission, and billing. Each PowerPlant has a capacity rating and fuel type. Plants connect to Substations through TransmissionLines that have a voltage level and maximum load. Substations serve one or more ServiceZones. Each CustomerAccount belongs to exactly one ServiceZone, has a meter ID, and accumulates MonthlyReadings (kWh consumed, peak demand, billing period). The utility also records MaintenanceEvents on transmission lines, each with a crew ID, scheduled date, and completion status.

Model the entities, their attributes, primary keys, and all relationships with correct cardinality.

</details>

### Q2181 — Northwind Logistics" Inventory Accuracy Study

- **Certification:** TOPCIT  
- **Lesson:** Introduction to Requirements Engineering  
- **Used in exams:** Introduction to Requirements Engineering Quiz

<details><summary>Full question</summary>

"Northwind Logistics" Inventory Accuracy Study

Northwind Logistics runs several warehouses and cannot trust its stock figures: counts are done on paper, entered days later, and disagree with what the system says is on the shelf. Before any technical solution is proposed, the problem domain must be modelled as it exists today.

a) Each warehouse has an ID, name, address and capacity in cubic metres. A warehouse is divided into one or more storage zones; a zone has no meaning apart from the warehouse it sits in, and closing a warehouse closes its zones with it.
b) Every inventory item has a SKU, description, unit of measure and reorder level. The same item may be stocked in many zones, and a zone stocks many items; the quantity on hand is a property of that pairing, not of either side.
c) An inventory count is carried out at one warehouse on one date by exactly one member of staff, and has a status. A member of staff may carry out any number of counts.
d) A count consists of one or more count lines, each naming an item, the quantity counted and the quantity the system expected. A count line cannot exist outside its count.
e) A count line raises at most one discrepancy, recording the variance and the date it was resolved. An item appears in many count lines over time.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Resolve the many-to-many in requirement (b) correctly, and explain in one sentence why the quantity on hand cannot live on either entity.
4. Justify in one sentence each: why Warehouse-StorageZone and InventoryCount-CountLine are identifying (existence-dependent) relationships, while Staff-InventoryCount is not.
5. Which entity would become orphaned if a count were deleted without cascading, and what does that tell you about the relationship?

</details>

### Q2193 — Meridian University Library" Catalogue

- **Certification:** TOPCIT  
- **Lesson:** Requirements Collection and Analysis  
- **Used in exams:** Requirements Collection and Analysis Quiz; Study plan mock exam · 2026-09-28

<details><summary>Full question</summary>

"Meridian University Library" Catalogue

Meridian University is replacing the catalogue that runs its branch libraries. Model the static structure of the domain -- the things the system stores and how they relate -- before any screens or processes are considered.

a) The university has several branches, each with an ID, name and address. A branch holds physical copies of books; if a branch closes, its copies are withdrawn from the catalogue with it.
b) A title is identified by its ISBN and has a name and year of publication. A title is published by exactly one publisher, and a publisher publishes many titles.
c) A title exists in the catalogue whether or not any branch holds it, but a copy is always a copy OF a title. One title may have many copies across the branches; each copy records its condition and the date it was acquired.
d) A title is credited to one or more authors, and an author is credited on any number of titles. Each credit records the author's role -- author, editor, translator.
e) A member borrows a copy, not a title. A loan records the borrow date, due date and return date; a member may hold many loans over time and a copy is lent many times.
f) A loan that is returned late incurs at most one fine, recording the amount and when it was settled. A fine has no meaning apart from its loan.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Resolve the many-to-many in requirement (d) with an associative entity that carries the role.
4. Explain in one sentence why requirement (e) means Loan must reference Copy rather than Title.
5. Justify in one sentence each why Branch-Copy and Loan-Fine are existence-dependent, while Publisher-Title is not.

</details>

### Q2228 — Cascade" Warehouse Management System - Requirements Traceability

- **Certification:** TOPCIT  
- **Lesson:** Requirements Management and Change Control  
- **Used in exams:** Requirements Management and Change Control Quiz

<details><summary>Full question</summary>

"Cascade" Warehouse Management System - Requirements Traceability

Cascade's warehouse management project must show, at audit, where every requirement came from and how it was verified. Model the domain that records it.

a) A project has an ID, name and start date, and is baselined any number of times. A baseline records its version and approval date and cannot exist without its project.
b) A baseline fixes one or more requirements. A requirement belongs to exactly one baseline and disappears with it; each has an ID, text, priority and status.
c) A stakeholder has an ID, name and organisation, and exists independently of any project.
d) Every requirement originates from one or more stakeholders, and a stakeholder may be the source of many requirements. The date each origin was captured must be recorded.
e) A requirement may be subject to any number of change requests. A change request is submitted by exactly one stakeholder and records the reason, the decision and when it was raised.
f) A requirement is verified by any number of test cases, and a test case may verify several requirements. Each link records its type -- verifies, partially verifies, derived from. Test cases exist whether or not they are yet linked to anything.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Resolve BOTH many-to-many relationships -- (d) and (f) -- with associative entities that carry their own attributes.
4. Justify in one sentence each why Project-Baseline and Baseline-Requirement are identifying relationships, while Stakeholder-ChangeRequest is not.
5. Requirement (f) says test cases exist before they are linked. State what that rules out about the cardinality on the TestCase end, and why.

</details>

### Q2295 — St Aidan's Hospital" Admissions and Discharge

- **Certification:** TOPCIT  
- **Lesson:** Requirements Collection and Analysis  
- **Used in exams:** Software Requirements Engineering Exam; Study plan mock exam · 2026-09-28

<details><summary>Full question</summary>

"St Aidan's Hospital" Admissions and Discharge

St Aidan's is replacing the system that tracks patients through the hospital. Model the domain.

a) A patient has an ID, NHS number, full name and date of birth, and exists on the system whether or not they are currently in hospital.
b) A patient is admitted any number of times over their life. An admission records the admission and discharge dates and belongs to exactly one patient.
c) An admission is received by exactly one ward. A ward has an ID, name, specialty and bed count, and receives many admissions.
d) A ward contains one or more beds. A bed has no meaning apart from its ward: closing a ward removes its beds.
e) Every admission records one or more diagnoses, each with a code, description and a flag marking the primary one. A diagnosis belongs to its admission and is removed with it.
f) During an admission a patient may be transferred between beds any number of times. A transfer records the bed moved from, the bed moved to, and the date.
g) An admission is managed through one or more care episodes, each led by exactly one clinician and recording that clinician's role. Clinicians are employed by the hospital and remain on the system after an admission ends.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (f) has two foreign keys to the same entity. Show both, and name them so their roles are distinguishable.
4. Justify in one sentence each why Ward-Bed, Admission-Diagnosis and Admission-CareEpisode are identifying relationships, while Clinician-CareEpisode is not.
5. Requirement (a) says a patient exists whether or not they are in hospital. State what that fixes about the cardinality on the Patient end of Admission, and why.

</details>

### Q2355 — Corvus Analytics" Knowledge Base

- **Certification:** TOPCIT  
- **Lesson:** Data, Information, and Knowledge  
- **Used in exams:** Data, Information, and Knowledge Quiz; Database Fundamentals Exam; Study plan mock exam · 2026-09-28

<details><summary>Full question</summary>

"Corvus Analytics" Knowledge Base

Corvus turns raw operational data into published insight, and wants the relationship between data, information and knowledge recorded in one model.

a) A data source has an ID, name, system of record and a last-refreshed date, and supplies any number of datasets. A dataset belongs to exactly one source, but survives if that source is decommissioned -- the rows are still there.
b) A dataset is described by one or more data fields, each with a name, data type and a sensitivity flag. A field has no meaning apart from its dataset.
c) An analyst has an ID, name, e-mail and team, and authors any number of reports. A report has exactly one author.
d) A report states one or more insights, each with a statement and a confidence value. An insight is deleted with its report.
e) A report draws on one or more datasets, and a dataset may be used in many reports. Each such use records the role the dataset played in that report.
f) A glossary term has a term and a definition and is stewarded by exactly one analyst. Terms outlive the reports that use them.
g) A data field may be tagged with any number of glossary terms, and a term may label any number of fields. Each tagging records the date it was applied.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirements (e) and (g) are many-to-many. Resolve each into an associative entity, and explain in one sentence why requirement (e) could not be resolved by a simple foreign key.
4. Justify in one sentence each why Dataset-DataField and Report-Insight are identifying relationships, while DataSource-Dataset is not.
5. Requirement (a) says a dataset survives its source. State what that fixes about the foreign key on Dataset, and name the referential action the database should take when a source is deleted.

</details>

### Q2365 — Ironside Gyms" - Requirements Gathering Outcome

- **Certification:** TOPCIT  
- **Lesson:** Database Requirements Collection  
- **Used in exams:** Database Requirements and Analysis Exam; Database Requirements Collection Quiz

<details><summary>Full question</summary>

"Ironside Gyms" - Requirements Gathering Outcome

A requirements workshop with Ironside's operations team produced the statements below. They are written as the stakeholders said them; your job is to turn them into a model.

a) "Every member has a name, e-mail and the date they joined. We keep members on file after they leave."
b) "A member takes out a membership. Someone can have several over the years -- they leave and come back -- but only one is active at a time."
c) "A membership is on one of our plans. A plan has a monthly fee and a number of class credits. Plans are set centrally and don't disappear when nobody's on them."
d) "A membership is based at one branch. Branches have a name, address and capacity."
e) "Payments are against the membership, not the person. If we delete a membership record its payments go with it."
f) "Classes run at a branch and are led by one trainer. A trainer works across branches and stays on the books between classes."
g) "Members book classes through their membership. We record when they booked and whether they turned up."
h) "Equipment belongs to the branch it's installed at. If we close a branch, those asset records go too.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (g) is many-to-many between memberships and classes. Resolve it into an associative entity carrying its own attributes.
4. Justify in one sentence each why Membership-Payment and Branch-Equipment are identifying relationships, while Trainer-FitnessClass is not.
5. Requirement (b) says only one membership is active at a time. State in one sentence why that is a business rule your ERD cannot express, and where it would have to be enforced instead.

</details>

### Q2376 — Aurora" Academic Conference - Conceptual Design

- **Certification:** TOPCIT  
- **Lesson:** Conceptual Database Design  
- **Used in exams:** Conceptual Database Design Quiz

<details><summary>Full question</summary>

"Aurora" Academic Conference - Conceptual Design

Aurora runs an annual research conference. Produce the conceptual data model, independent of any particular database product.

a) A conference has a name, year and venue, and is divided into one or more tracks. A track belongs to exactly one conference and does not outlive it.
b) A track schedules one or more sessions. A session belongs to exactly one track.
c) A conference provides one or more rooms. A session is hosted in exactly one room, and a room hosts many sessions across the programme.
d) A session presents one or more papers. Each paper is presented in exactly one session.
e) A person has a name, e-mail and affiliation. The same person may be an author, a reviewer and a delegate; the system holds one record per person, not three.
f) A paper is credited to one or more people. Each authorship records the position in the author list and whether that author is the corresponding one.
g) A paper receives any number of reviews. Each review is given by exactly one person and records a score and comments. A person may review many papers.
h) A person makes a registration for a conference, recording the date and the ticket type. Registrations are deleted when the conference record is purged; people are not.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK). Use conceptual data types only -- do not choose column lengths or index types.
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirements (f) and (g) are many-to-many between Person and Paper. Resolve both, and explain in one sentence why they must become two separate associative entities rather than one.
4. Requirement (e) says one record per person. State what modelling error you have avoided by following it, and what would go wrong on an e-mail change if you had not.
5. Identify which relationships are identifying and which are not, and state in one sentence what distinguishes the two at the conceptual level.

</details>

### Q2389 — Northwind Supply" - Order Fulfilment Model

- **Certification:** TOPCIT  
- **Lesson:** Data Modeling Techniques  
- **Used in exams:** Data Modeling Techniques Quiz

<details><summary>Full question</summary>

"Northwind Supply" - Order Fulfilment Model

Northwind distributes goods from several warehouses. Model the data supporting order fulfilment.

a) A customer has a name, credit limit and an on-hold flag, and places any number of sales orders. An order belongs to exactly one customer; customers remain on file after their orders are archived.
b) An order consists of one or more order lines, each naming a product with a quantity and the unit price at the time of the order. A line has no meaning apart from its order.
c) A product has an SKU, name and unit weight, and appears on many order lines.
d) A supplier offers products under supply agreements, each recording the cost and a minimum order quantity. A supplier offers many products, and a product may be offered by many suppliers.
e) A warehouse holds a stock level per product, recording the quantity on hand and a reorder point. A stock level cannot exist without its warehouse.
f) An order is fulfilled by any number of shipments -- a partial delivery is normal. Each shipment is despatched from exactly one warehouse and records the despatch date and carrier.
g) A shipment carries one or more shipment lines. Each shipment line refers to exactly one order line and records how many units of it were shipped. One order line may be shipped across several shipments.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirements (d), (e) and (g) each produce an associative entity. Draw all three and name the attributes that justify each one's existence.
4. Requirement (b) stores the unit price on the order line rather than reading it from the product. Explain in one sentence why, and what would be wrong with an invoice reprinted a year later if you had not.
5. Requirement (g) allows one order line to be shipped across several shipments. State the cardinality that expresses this, and what business question becomes unanswerable if you instead put a single shipmentId directly on OrderLine.

</details>

### Q2400 — Sentinel Insurance" - Policy Model with Subtypes

- **Certification:** TOPCIT  
- **Lesson:** Advanced Data Modeling  
- **Used in exams:** Advanced Data Modeling Quiz; Database Design Exam

<details><summary>Full question</summary>

"Sentinel Insurance" - Policy Model with Subtypes

Sentinel writes motor and home insurance for individuals and companies. Their current model repeats the same columns in several tables; you are to produce one that does not.

a) Every customer, company and broker on the system is a party, with an ID, a type discriminator, a name and a creation date.
b) A party is either a person -- with a date of birth and a national ID -- or an organisation, with a registration number and a sector. No party is only a party, and none is both.
c) A policy has a start date, end date and premium, and is held by exactly one party. A party may hold many policies over time.
d) A policy is either a motor policy -- with a vehicle registration and no-claims years -- or a home policy, with a property address and a rebuild value. The shared attributes must not be repeated in both.
e) A policy provides one or more cover items, each naming a peril with a sum insured and an excess. Cover items are deleted with the policy.
f) A policy is claimed against any number of times. A claim records the report date, a status and a reserve, and settles through any number of claim payments.
g) Some parties act as agents, holding an agency code and a commission rate. A party acts as at most one agent, and most parties are not agents at all.
h) A policy is placed by one or more agents, each placement recording the date it was placed.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw the two supertype/subtype hierarchies of requirements (b) and (d), showing the shared attributes on the supertype only.
3. State whether each hierarchy is complete or partial, and disjoint or overlapping, quoting the sentence in the requirements that decides it.
4. Requirement (g) is a role, not a subtype. Model it as a 1-to-0..1 relationship and explain in one sentence why making Agent a subtype of Party would be wrong given requirements (b) and (g) together.
5. Requirement (h) is many-to-many. Resolve it, and justify in one sentence why Policy-CoverItem is an identifying relationship but Agent-Placement is not.

</details>

### Q2411 — Halden Campus" - Physical Network Plant Records

- **Certification:** TOPCIT  
- **Lesson:** Physical Layer and Media  
- **Used in exams:** Physical Layer and Media Quiz

<details><summary>Full question</summary>

"Halden Campus" - Physical Network Plant Records

Halden's network team keeps no reliable record of what is cabled to what. Model the physical layer so that any socket can be traced back to a switch port.

a) A site has a name, address and region, and contains one or more buildings. A building belongs to exactly one site and does not survive it in the records.
b) A building houses one or more communications rooms, identified by room number and floor. A comms room cannot exist without its building.
c) A comms room contains one or more racks, each with a label and a height in rack units.
d) A rack mounts any number of network devices, each with a hostname, model and the rack unit it starts at. A device may be moved to another rack, so it is not destroyed when a rack is decommissioned.
e) A device exposes one or more ports, each with a port number, media type and speed. A port has no existence apart from its device.
f) A rack also holds any number of patch panels, each with a label and a port count. A panel is deleted with its rack.
g) A building provides any number of wall outlets, each with a label and a floor.
h) A cable run connects exactly one patch panel to exactly one wall outlet, and records the cable type, length in metres and the date it was last tested. An outlet is fed by at most one cable run; a panel terminates many.
i) A switch port may be patched to a panel. A port carries at most one such connection at a time, and the date it was patched is recorded.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirements (a), (b), (c), (e), (f) and (g) are containment. Show them as identifying relationships, and explain in one sentence why requirement (d) is NOT one despite also being containment.
4. Requirements (h) and (i) both use "at most one". Show the 0..1 cardinality in both places, and state what physical fact about a wall socket requirement (h) is recording.
5. Trace on your diagram the path from a wall outlet to the switch port serving it, naming every entity crossed. State how many joins that path costs, and one thing you would denormalise if that query had to run on every helpdesk ticket.

</details>

### Q2458 — Wren Public Library" - Requirements Gathering Outcome

- **Certification:** TOPCIT  
- **Lesson:** Database Requirements Collection  
- **Used in exams:** Database Requirements and Analysis Exam

<details><summary>Full question</summary>

"Wren Public Library" - Requirements Gathering Outcome

Interviews with Wren's librarians produced the statements below, in their own words. Turn them into a model.

a) "We have several branches. Each one has a name, address and opening hours."
b) "A title is the work -- ISBN, name, year. A copy is the physical book on the shelf, with its own barcode and a condition. Scrap the title and every copy of it goes."
c) "A copy sits at one branch. Copies do get transferred between branches, so that isn't fixed forever."
d) "A title has one or more authors and we care about the order they're listed in. An author writes many titles and stays on file even after we withdraw everything they wrote."
e) "Borrowers have a name, e-mail, join date and a suspended flag. We keep them after they stop using us."
f) "A loan is one borrower taking one copy. We record when it went out, when it's due, and when it came back -- that's empty while it's still out."
g) "Fines are raised against a loan, not against a person. Delete the loan and the fine goes with it. A loan can pick up more than one fine."
h) "A reservation is against the title, not a specific copy -- the borrower just wants the next one free. They choose which branch to collect from, and we keep their place in the queue.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (d) is many-to-many and carries its own attribute. Resolve it into an associative entity and state what that attribute is.
4. Requirement (b) draws a distinction between a title and a copy. Explain in one sentence why they must be two entities, and what requirement (h) would be impossible to express if they were one.
5. Requirement (f) says the return date is empty while the book is out. State what that means for the column's nullability, and name one query the librarians can answer from that single nullable column.

</details>

### Q2472 — Halden Campus" - Addressing and Routing Plan

- **Certification:** TOPCIT  
- **Lesson:** Network Service Architecture  
- **Used in exams:** Network Protocols and Services Exam

<details><summary>Full question</summary>

"Halden Campus" - Addressing and Routing Plan

Halden's addressing is recorded in spreadsheets that disagree with each other. Model it properly.

a) A site has a name and a region, and defines one or more VLANs. A VLAN belongs to exactly one site and is meaningless without it.
b) A VLAN carries one or more subnets, each with a network address, prefix length and gateway. A subnet cannot exist apart from its VLAN.
c) A subnet allocates from any number of DHCP pools, each with a start address, an end address and a lease time. Deleting a subnet deletes its pools.
d) A pool issues any number of leases. A lease records the IP address, the time issued and the time it expires, and belongs to exactly one pool.
e) A host has a hostname, MAC address and OS type, and holds any number of leases over time. Hosts survive the expiry of their leases.
f) A subnet may reserve a static address for a host. A host is pinned by at most one such reservation; a subnet may hold many.
g) A router device has a hostname and a model, and is hosted at exactly one site. Devices are relocated, so they are not destroyed with a site.
h) A router advertises any number of routes. A route names exactly one destination subnet with a next hop and a metric, and disappears when the router is decommissioned.
i) A host is named by any number of DNS records, each with a name, a record type and a TTL. Records are deleted with the host.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Identify every identifying relationship and justify one of them in a sentence, contrasting it with Site-RouterDevice in requirement (g).
4. Requirement (f) says "at most one". Show the 0..1 cardinality and explain in one sentence what network fault the database is preventing by enforcing it.
5. Requirements (d) and (f) both assign an IP address to a host, by different routes. State in one sentence what integrity rule the database cannot express here, and where it would have to be enforced instead.

</details>

### Q2498 — Vantage Systems" - Requirements Traceability

- **Certification:** TOPCIT  
- **Lesson:** Requirements Collection and Analysis  
- **Used in exams:** Software Development Exam; Study plan mock exam · 2026-09-28; Study plan mock exam · 2026-09-28

<details><summary>Full question</summary>

"Vantage Systems" - Requirements Traceability

Vantage has been asked by an auditor to show that every requirement came from a stakeholder and is verified by a test. Their current tooling cannot answer either question. Model the data that would.

a) A project has a name, start date and status, and raises one or more business needs. A need has no meaning outside its project.
b) A stakeholder has a name, organisation and influence rating. Stakeholders work across projects and remain on file after a project closes.
c) A business need is held by one or more stakeholders, and a stakeholder declares an interest in many needs. Each interest records the date it was raised.
d) A need is refined into one or more requirements, each with a reference, text, a type and a status. A requirement belongs to exactly one need.
e) A requirement is accepted by one or more acceptance criteria, each with text and a mandatory flag. Criteria are deleted with their requirement.
f) A design element has a name and a kind and is produced by exactly one project. Design elements survive requirement changes.
g) A requirement is satisfied by any number of design elements, and a design element may satisfy many requirements. Each trace link records the type of link.
h) An acceptance criterion is verified by one or more test cases, each with a name and steps. A test case is deleted with its criterion.
i) A test case is executed as any number of test runs, each recording the date and the outcome.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirements (c) and (g) are many-to-many. Resolve both into associative entities and name the attribute that justifies each.
4. The auditor asks: "show me every test run that verifies requirement R-104." Trace that path on your diagram, naming every entity crossed.
5. The auditor also asks: "show me any requirement with no design element against it." State which relationship's cardinality makes that question answerable, and what you would have had to change if requirement (g) had said "exactly one" instead.

</details>

### Q2523 — Halcyon Rail" - Requirements Specification Records

- **Certification:** TOPCIT  
- **Lesson:** Requirements Specification  
- **Used in exams:** none (question bank only)

<details><summary>Full question</summary>

"Halcyon Rail" - Requirements Specification Records

Halcyon must show an auditor which version of the specification a given requirement appeared in, and who approved it. Model the specification document itself.

a) A specification has a title and a status and belongs to exactly one project.
b) A specification is issued as one or more versions, each with a version number, an issue date and a flag saying whether it is a baseline. A version has no meaning apart from its specification.
c) A version is structured into one or more sections, each with a heading and an ordinal. A section belongs to exactly one version.
d) A section may nest within another section of the same version, to any depth. A top-level section nests within none.
e) A section states any number of requirement statements, each with a reference, its text and the modal verb used ("shall", "should", "may"). A statement is deleted with its section.
f) A requirement kind -- functional, performance, security, and so on -- classifies many statements. Kinds are defined once for the organisation and outlive any specification.
g) A version defines any number of glossary terms. A requirement statement may refer to any number of terms, and a term may be referred to by many statements.
h) A version records any number of assumptions, each flagged as an assumption or a constraint.
i) A version receives approvals. Each approval is given by exactly one author and records the date and the decision. Authors stay on file between projects.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (d) is a relationship from an entity to itself. Draw it, and state the cardinality that allows a top-level section to have no parent.
4. Requirement (g) is many-to-many. Resolve it, and explain in one sentence why storing a list of term IDs in a column on the statement would break the auditor's query.
5. Requirement (b) says versions, not edits in place. State in one sentence what question the auditor can answer because of that, and what would be lost if the specification were simply overwritten each time.

</details>

### Q2529 — Vantage Systems" - Requirements Change Control

- **Certification:** TOPCIT  
- **Lesson:** Requirements Management and Change Control  
- **Used in exams:** Software Development Exam

<details><summary>Full question</summary>

"Vantage Systems" - Requirements Change Control

Vantage cannot currently answer "what did the specification look like when we signed the contract?" Model the change control data that would let them.

a) A configuration item has a name and a type and belongs to exactly one project.
b) An item is revised as one or more item versions, each with a version number, a creation date and a checksum. A version has no meaning apart from its item.
c) A baseline has a label and a freeze date and freezes one or more specific item versions. An item version may be frozen in many baselines.
d) A change request is raised by exactly one person against exactly one configuration item, recording the date, the reason and a status. People remain on file after a request is closed.
e) A change request is assessed by any number of impact assessments, each recording effort in days, a risk level and the assessment date. Assessments are deleted with the request.
f) A review board has a name and a quorum, and is composed of one or more board memberships. Each membership links exactly one person to that board and records when they joined.
g) A change request receives any number of board decisions. Each decision is issued by exactly one board and records the date and the outcome.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirements (c) and (f) are many-to-many. Resolve both into associative entities.
4. Requirement (c) says a baseline freezes item VERSIONS, not items. Explain in one sentence why, and what the contract question at the top would become unanswerable without it.
5. Requirement (g) allows a request to receive several decisions. State in one sentence what real situation that cardinality is modelling, and how you would find the decision that currently stands.

</details>

### Q2537 — Ashgrove Veterinary" - Conceptual Design

- **Certification:** TOPCIT  
- **Lesson:** Conceptual Database Design  
- **Used in exams:** Database Construction and Management Exam; Database Design Exam

<details><summary>Full question</summary>

"Ashgrove Veterinary" - Conceptual Design

Ashgrove is replacing a paper day-book. Produce the conceptual data model, independent of any database product.

a) An owner has a name, phone and address. Owners are kept on file after their animals have gone.
b) An animal has a name and a date of birth, belongs to exactly one owner, and is classified by exactly one species. Species are a reference list maintained by the practice and outlive any animal.
c) An animal attends any number of visits. A visit records the date and the presenting sign, and is deleted with the animal's record.
d) A visit is conducted by exactly one veterinarian. Vets have a registration number and a specialism and remain on file between visits.
e) A visit yields any number of diagnoses, each with a code and a description.
f) A visit delivers any number of treatments. Each treatment applies exactly one procedure from a standing list, and records when it was performed and any notes.
g) A visit issues any number of prescriptions. Each names exactly one drug with a dosage and a days' supply. Drugs are a reference list with a controlled-drug flag.
h) A visit is billed by at most one invoice, recording the issue date, total and settlement date.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK). Use conceptual data types only -- do not choose column lengths or index types.
2. Draw every relationship with its cardinality at BOTH ends.
3. Identify every identifying relationship, and justify one of them in a sentence by contrasting it with Species-Animal in requirement (b).
4. Requirement (f) stores a link to a standing procedure rather than free text. Explain in one sentence what that buys the practice, and why the fee still belongs on Procedure and not on Treatment at the conceptual level.
5. Requirement (h) says "at most one". Show the 0..1 cardinality, and state what real situation the zero case represents.

</details>

### Q2539 — Brightwell Group" - Employment History

- **Certification:** TOPCIT  
- **Lesson:** Advanced Data Modeling  
- **Used in exams:** Database Construction and Management Exam

<details><summary>Full question</summary>

"Brightwell Group" - Employment History

Brightwell's HR system overwrites a salary when it changes, so nobody can say what an employee was paid in a given month. Model it so that history is kept.

a) A person has a name, date of birth and national ID, and exists on the system independently of any job.
b) A person holds any number of employments over time -- they may leave and return, or work for two group companies. An employment records a hire date and a leaving date, which is empty while they are still employed.
c) A company has a name and a registration number and is organised into one or more departments. A department cannot exist without its company.
d) A department establishes one or more posts, each with a title and a grade. A post is a position in the structure and is removed with its department.
e) An employment is assigned by one or more post assignments. Each assignment records the post held and the dates it was valid from and to. An employment always has at least one; a post may be filled by many assignments over time.
f) An employment is paid under one or more salary records, each with an amount, a currency and the dates it was valid from and to. Salary records are never overwritten -- a change closes the current row and opens a new one.
g) A reporting line links a subordinate post to a manager post, and is itself effective-dated.
h) An employment records any number of absences, each classified by exactly one absence type with a paid flag.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (g) is a relationship between two rows of the SAME entity. Draw it, and name the two foreign keys so their roles are distinguishable.
4. Requirement (f) is the point of the model. Explain in one sentence how the validFrom/validTo pair answers "what was this person paid last March", and what the validTo value is for the row that is current.
5. Requirements (e), (f) and (g) are all effective-dated. State the one integrity rule that must hold across each set of rows, and why the database alone cannot enforce it.

</details>

### Q2561 — Kestrel Retail" - Sales Reporting Warehouse

- **Certification:** TOPCIT  
- **Lesson:** Advanced Data Modeling  
- **Used in exams:** Database Construction and Management Exam

<details><summary>Full question</summary>

"Kestrel Retail" - Sales Reporting Warehouse

Kestrel's reports take minutes to run against the normalised order tables, and a product moved to a new category last year has silently rewritten two years of history. Model a dimensional schema that fixes both.

a) The grain of the fact table is one row per product per sale transaction. Each row records the quantity, the net amount and the tax amount.
b) The fact table is dated by a date dimension holding the calendar date, month name, quarter, fiscal year and a holiday flag. Dates are generated in advance, so a date row exists whether or not any sale used it.
c) A product dimension describes each fact row, holding the product's business ID, name and category.
d) A store dimension locates each fact row, and a customer dimension identifies it. A store holds a region; a customer holds a segment.
e) A promotion dimension attributes each fact row, holding a promotion code, name and discount percentage.
f) Product, store and customer must keep history: when a product's category changes, sales before the change must still report under the old category. Each of those three carries a validFrom, a validTo and a current-row flag, and a new row is inserted rather than the old one updated.
g) The promotion dimension does not keep history -- a corrected promotion name should apply everywhere.
h) A basket-level bridge breaks each sale out across the products in it, carrying a weighting factor so that basket-level measures are not double counted.

Tasks
1. Identify the fact table and the dimension tables, marking primary keys (PK) and foreign keys (FK). Say explicitly what the grain of the fact table is.
2. Draw every relationship with its cardinality at BOTH ends, arranging the dimensions around the fact table.
3. Requirement (f) describes a slowly changing dimension. Name its type, show the three columns that implement it, and explain in one sentence how a query finds the row that was current on the date of a sale.
4. Requirement (g) is a different type from requirement (f). Name it, and state in one sentence why a promotion NAME and a product CATEGORY are treated differently.
5. Requirement (b) says a date row exists whether or not any sale used it. State in one sentence what report that makes possible, and what would be wrong with a zero-sales day if dates were only inserted when a sale occurred.

</details>

### Q2563 — Fairmont Engineering" - Bill of Materials

- **Certification:** TOPCIT  
- **Lesson:** Advanced Data Modeling  
- **Used in exams:** Database Construction and Management Exam

<details><summary>Full question</summary>

"Fairmont Engineering" - Bill of Materials

Fairmont builds assemblies from sub-assemblies, which are themselves built from parts, to no fixed depth. Their current spreadsheet has one column per level and breaks whenever a design gets deeper. Model it properly.

a) A part has a part number, name, unit of measure and a flag saying whether it is purchased or made. Every item -- finished product, sub-assembly and raw component -- is a part. There is no separate assembly entity.
b) A BOM line says that one part is used inside another, with a quantity per unit and the dates the line is valid from and to. A part may be the parent in many lines and the child in many others.
c) A part is revised as one or more part revisions, each with a revision code, release date and status. A revision has no meaning apart from its part.
d) A supplier offers parts under sourcing agreements, each with a unit cost and a lead time. A supplier offers many parts and a part may be offered by many suppliers.
e) A plant holds stock of any number of parts, recording the quantity on hand and a safety stock level. A stock row cannot exist without its plant.
f) A works order builds a quantity of one part at one plant by a due date.
g) A works order consumes any number of material issues, each recording the part issued, the quantity and the date. Issues are deleted with the order.
h) A BOM line may permit substitutions, each naming an alternate part with a priority.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (b) is a many-to-many relationship from Part to ITSELF. Resolve it, and name the two foreign keys so the parent role and the child role are distinguishable.
4. Explain in one sentence why requirement (a) insists that an assembly is just a part, and what would go wrong in requirement (b) if assemblies and components were separate entities.
5. A part appears at three levels of one product. State in one sentence how you would compute the total quantity required, and why that query is recursive rather than a fixed number of joins.

</details>

### Q2603 — Sentinel Insurance" - Risk Assessment Records

- **Certification:** TOPCIT  
- **Lesson:** Risk Assessment Methodologies  
- **Used in exams:** Risk Assessment Methodologies Quiz; Risk Management and Assessment Exam

<details><summary>Full question</summary>

"Sentinel Insurance" - Risk Assessment Records

Sentinel's risk register is a spreadsheet in which the same risk appears three times with three different scores and no history. Model it properly.

a) An asset has a name, a type and a business value, and is owned by exactly one asset owner. Owners have a name and a department and remain on file after an asset is disposed of.
b) An asset exposes any number of vulnerabilities, each with a reference, a description and a severity. A vulnerability has no meaning apart from its asset.
c) A threat has a name, a source and a description. Threats are held in a central catalogue and outlive any particular risk.
d) A risk arises where a threat can exploit a vulnerability. A risk records the date identified and a status, and belongs to exactly one vulnerability and one threat.
e) A risk is scored as one or more risk scores, each with a likelihood, an impact, the date scored and a current-row flag. Scores are never overwritten -- a rescore inserts a new row.
f) A control has a reference, a name and a type, and is held in a central catalogue.
g) A risk is mitigated by any number of control applications. Each records the control applied, the date and an effectiveness rating. A control may be applied to many risks.
h) A risk receives one or more treatment decisions, each accepted by exactly one asset owner and recording the strategy and the rationale.
i) A risk is reviewed any number of times, each review recording a date and an outcome.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (d) makes a risk depend on a threat AND a vulnerability. Explain in one sentence why a risk is not simply an attribute of an asset, and what requirement (g) would be impossible to record if it were.
4. Requirement (e) keeps every score. State in one sentence what management question that answers, and how you would find the score that currently stands.
5. Requirement (g) is many-to-many. Resolve it, and name the attribute that justifies the associative entity rather than a plain foreign key.

</details>

### Q2615 — Sentinel Insurance" - Quantitative Risk Analysis

- **Certification:** TOPCIT  
- **Lesson:** Security Risk Analysis  
- **Used in exams:** Security Risk Analysis Quiz

<details><summary>Full question</summary>

"Sentinel Insurance" - Quantitative Risk Analysis

Sentinel's board wants risk expressed in money, and wants to see the workings. Model the data behind a quantitative analysis.

a) An asset has a name and a replacement value.
b) An asset is at risk through any number of loss scenarios, each with a name and a description. A scenario has no meaning apart from its asset.
c) A scenario is quantified by one or more loss estimates. Each estimate records the exposure factor, the single loss expectancy, the annual rate of occurrence, the resulting annual loss expectancy, and the date estimated.
d) An analysis method has a name and a flag saying whether it is quantitative. Methods are a standing list and outlive any estimate.
e) An estimate rests on any number of assumptions, each with a statement and a confidence rating, and cites any number of data sources, each with a citation and a source type. Both are deleted with the estimate.
f) A safeguard has a name, an annual cost and an expected reduction. Safeguards are catalogued centrally.
g) A scenario is treated by any number of safeguard evaluations. Each names one safeguard and records the residual annual loss expectancy and the net benefit. A safeguard may be evaluated in many scenarios.
h) An estimate receives any number of sign-offs, each given by exactly one analyst with a date and a verdict.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (c) stores the annual loss expectancy even though it can be computed from two other columns on the same row. State the formula, and give one argument for storing it and one against.
4. Requirement (g) is many-to-many. Resolve it, and name the two attributes that justify the associative entity.
5. Requirement (e) exists so the board can see the workings. Explain in one sentence why assumptions belong on the ESTIMATE rather than on the scenario, and what a re-estimate next year would do to the old assumptions.

</details>

### Q2637 — Sentinel Insurance" - ISMS Implementation Records

- **Certification:** TOPCIT  
- **Lesson:** ISMS Implementation and Operation  
- **Used in exams:** ISMS Implementation and Operation Quiz

<details><summary>Full question</summary>

"Sentinel Insurance" - ISMS Implementation Records

An auditor will ask Sentinel to show, for any control in the standard, whether it applies, who owns it, how it is implemented and what evidence exists. Model the data that answers that.

a) A standard has a name and a version and is composed of one or more clauses. A clause has no meaning apart from its standard.
b) A clause specifies one or more controls, each with a reference and an objective. A control belongs to exactly one clause.
c) A control is decided in any number of applicability entries -- one per assessment cycle -- each recording whether it applies, a justification and the decision date. An entry is deleted with its control.
d) Each applicability entry is owned by exactly one control owner. Owners have a name and a role and remain on file when an entry is superseded.
e) An applicable entry is realised by at most one implementation, recording a status, an implementation date and a procedure reference. A non-applicable entry has none.
f) An implementation is supported by any number of pieces of evidence, each with an artefact reference, a collection date and who collected it.
g) An applicability entry may carry exceptions, each approved by exactly one owner and recording a reason and an expiry date.
h) An implementation is tested by any number of control tests, each with a date, a method and a result.
i) A control test raises any number of findings, each with a severity, a description and a closure date.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (e) says "at most one". Show the 0..1 cardinality, and state what real situation the zero case represents.
4. Justify in one sentence each why Standard-Clause and Implementation-Evidence are identifying relationships, while ControlOwner-ApplicabilityEntry is not.
5. Trace on your diagram the path from a clause of the standard to a piece of evidence, naming every entity crossed. State in one sentence what an auditor concludes when that path exists but the implementation status is still "planned".

</details>

### Q2672 — Brightwell Group" - Performance Measurement

- **Certification:** TOPCIT  
- **Lesson:** Key Performance Indicators  
- **Used in exams:** Key Performance Indicators Quiz

<details><summary>Full question</summary>

"Brightwell Group" - Performance Measurement

Brightwell's board sees four dashboards that report the same KPI with four different numbers, because each is calculated from a different query. Model the data so a KPI is defined once.

a) A strategic goal has a name and a balanced-scorecard perspective, and is owned by exactly one owner. Owners have a name and a department and remain on file after a goal is retired.
b) A goal is broken into one or more objectives, each with a statement and a time horizon. An objective has no meaning apart from its goal.
c) An objective is measured by one or more KPIs, each with a name, a unit, a direction (whether higher or lower is better) and the formula used.
d) A KPI is targeted by one or more targets, each covering a period with a target value and a threshold value. Targets are deleted with the KPI.
e) A period has a name, a start and end date and a type (month, quarter, year). Periods are generated centrally and exist whether or not anything was measured in them.
f) A KPI is recorded as any number of measurements, each for exactly one period, recording the actual value and when it was captured.
g) A KPI is fed by one or more data sources, each naming the system and the query used.
h) A scorecard has a name and an audience and is published by exactly one owner.
i) A scorecard presents one or more scorecard lines. Each line shows exactly one KPI with an ordinal and a weighting; a KPI may appear on many scorecards.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (i) is many-to-many. Resolve it, and name the two attributes that justify the associative entity.
4. Requirement (c) puts the formula on the KPI and requirement (g) puts the query on the data source. Explain in one sentence how that arrangement fixes the four-different-numbers problem from the opening paragraph.
5. Requirement (e) says periods exist whether or not anything was measured. State in one sentence what report that makes possible, and what a missing measurement would look like if periods were only created when a value arrived.

</details>

### Q2706 — Fenland Water" - Device Fleet and Telemetry Records

- **Certification:** TOPCIT  
- **Lesson:** Machine-to-Machine Communications  
- **Used in exams:** Emerging Network Technologies Exam

<details><summary>Full question</summary>

"Fenland Water" - Device Fleet and Telemetry Records

Fenland cannot currently say which firmware a device was running when a reading looked wrong. Model the fleet data so it can.

a) A site has a name, grid reference and a remote flag, and hosts any number of devices. Devices are relocated between sites, so they are not destroyed with a site.
b) A device has a serial number and a commissioning date, and is specified by exactly one device model. Models have a manufacturer, model name and protocol, and are a catalogue that outlives any device.
c) A model is released as any number of firmware versions, each with a version number and a release date. A firmware version has no meaning apart from its model.
d) A device receives any number of firmware installs. Each names one firmware version and records the install date and the outcome. Installs are deleted with the device.
e) A device exposes one or more channels, each with a name, a unit and a valid range. A channel cannot exist without its device.
f) A channel records any number of readings, each with a timestamp, a value and a quality flag.
g) A channel is watched by any number of alarm rules, each with a comparison, a threshold and a severity.
h) A reading triggers any number of alarms. Each alarm is raised by exactly one rule and records when it was raised and when it was acknowledged, which is empty until someone acknowledges it.
i) A device is sent any number of commands, each issued by exactly one operator with a timestamp, a payload and a state. Operators remain on file after their commands complete.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (d) is many-to-many between devices and firmware versions. Resolve it, and name the two attributes that justify the associative entity.
4. Answer the question in the opening paragraph: trace on your diagram the path from a suspect reading to the firmware the device was running, naming every entity crossed. State in one sentence what extra column requirement (d) would need for that answer to be exact rather than approximate.
5. Requirement (h) says the acknowledged time is empty until someone acknowledges. State what that means for the column's nullability, and one operational report you can write from that single column.

</details>

### Q2732 — Pellworth Bank" - Access Control and Data Classification

- **Certification:** TOPCIT  
- **Lesson:** Information Security Principles  
- **Used in exams:** Information Security Fundamentals Exam

<details><summary>Full question</summary>

"Pellworth Bank" - Access Control and Data Classification

Pellworth's auditor asked who could read a particular customer file last quarter, and nobody could answer. Model the access control data.

a) An employee has a name, a department and a leaving date, which is empty while they are still employed. Employees are never deleted.
b) An employee is issued any number of user accounts over time. An account has a username, a status and a last login time.
c) A role has a name, a description and a privileged flag. Roles are defined centrally and outlive any assignment.
d) A user account holds any number of role assignments. Each names one role and records who granted it, when, and when it expires. Assignments are deleted with the account.
e) A role confers one or more permissions, and a permission may be conferred by many roles. A permission has a name and an action.
f) A resource has a name and a type and is classified by exactly one classification. A classification has a label, a rank and a handling rule, and is a standing list.
g) A role is granted access to any number of resources, each grant recording an access level. A resource may be reachable through many roles.
h) An access log row records that a user account acted on a resource at a time, with the action and whether it was permitted. Log rows are never deleted.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirements (e) and (g) are many-to-many. Resolve both into associative entities.
4. Answer the auditor's question: trace on your diagram the path from a resource to every employee who could reach it, naming every entity crossed. State in one sentence why requirement (d)'s expiry date is what makes "last quarter" answerable.
5. Requirement (a) says employees are never deleted and requirement (h) says log rows are never deleted. State in one sentence what each rule protects, and why requirement (b) separates the account from the person.

</details>

### Q2788 — Larkspur Foods" - Procure to Pay

- **Certification:** TOPCIT  
- **Lesson:** IT Business Operations  
- **Used in exams:** IT Business Fundamentals Exam

<details><summary>Full question</summary>

"Larkspur Foods" - Procure to Pay

Larkspur pays some invoices twice and cannot match others to anything ordered. Model the data that supports a three-way match.

a) A supplier has a name, payment terms and an approved flag, and stays on file after their orders are archived.
b) A purchase requisition is raised by a requester against a cost centre, with a date and a status, and consists of one or more requisition lines. A line names an item with a quantity and an estimated price, and cannot exist without its requisition.
c) A requisition requires any number of approvals, each given by exactly one approver with a date and a decision.
d) A requisition results in any number of purchase orders. A purchase order is placed on exactly one supplier with an order date and a status.
e) A purchase order consists of one or more order lines, each naming an item with a quantity and a unit price.
f) An item has an SKU, a name and a unit of measure, and is a standing catalogue entry.
g) A purchase order is received by any number of goods receipts, each with a receipt date and a delivery note number -- a part delivery is normal.
h) A goods receipt records one or more receipt lines, each referring to exactly one order line and recording the quantity received.
i) A supplier issues invoices, each with an invoice number, date, total and status. An invoice consists of one or more invoice lines, each referring to exactly one order line with an amount.
j) An invoice is settled by any number of payments, each with a date, amount and method.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirements (g) to (i) let one order line be received and invoiced in several pieces. Show the cardinalities that allow that.
4. The three-way match compares what was ordered, what was received and what was invoiced. Name the three entities it compares and the single entity that joins all three, and trace the path on your diagram.
5. Requirement (j) allows several payments against one invoice. State in one sentence what real situation that models, and what query would detect the double payment described in the opening paragraph.

</details>

### Q2809 — Skelton Datacentre" - Cost and Capacity Records

- **Certification:** TOPCIT  
- **Lesson:** Key Performance Indicators  
- **Used in exams:** Performance Management Exam

<details><summary>Full question</summary>

"Skelton Datacentre" - Cost and Capacity Records

Skelton charges departments for IT but cannot show how a charge was derived, and cannot say which service will run out of capacity first. Model the data behind both.

a) An IT service has a name and a criticality and is owned by exactly one service owner. Owners have a name and a department and remain on file after a service is retired.
b) A service is delivered by one or more configuration items, each with a name and a type. A configuration item has no meaning apart from its service.
c) A configuration item is housed at exactly one location. Locations have a name and a rack space figure, and items are relocated, so an item is not destroyed with a location.
d) A configuration item is limited by one or more capacity metrics, each with a metric name, a unit and a capacity limit.
e) A capacity metric is sampled as any number of utilisation samples, each for exactly one period, recording the peak and mean values.
f) A period has a name and a start and end date, and exists whether or not anything was sampled or charged in it.
g) A configuration item incurs any number of cost records, each classified by exactly one cost type and dated to exactly one period, with an amount.
h) A cost type has a name, a capital flag and an allocation basis. Cost types are a standing list.
i) A service is recharged as any number of chargeback lines, each for one period and one cost centre, with an allocated amount.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Answer the first question in the opening paragraph: trace on your diagram the path from a chargeback line back to the individual costs behind it, naming every entity crossed.
4. Answer the second: name the two attributes you would compare to find the service closest to its capacity limit, and say which entities they sit on.
5. Requirement (f) says periods exist whether or not anything happened in them. State in one sentence what report that makes possible, and what a month with no cost records would look like without it.

</details>

### Q2832 — Oakhaven Manufacturing" - Continuous Improvement Records

- **Certification:** TOPCIT  
- **Lesson:** Business Problem Solving  
- **Used in exams:** Business Analysis and Strategy Exam

<details><summary>Full question</summary>

"Oakhaven Manufacturing" - Continuous Improvement Records

Oakhaven runs improvement projects but cannot show which problem any of them was meant to fix, or whether the promised benefit arrived. Model the data.

a) A business process has a name and a department and is owned by exactly one process owner. Owners remain on file after a process is retired.
b) A process exhibits any number of problems, each with a statement, a date raised and a severity. A problem has no meaning apart from its process.
c) A problem is analysed by any number of analyses. Each analysis uses exactly one technique, and records the date performed and a conclusion.
d) A technique has a name and a category and is a standing list.
e) An analysis identifies one or more causes, each with a description and a root-cause flag. Causes are deleted with their analysis.
f) A cause may contribute to another cause within the same analysis. A root cause contributes to none.
g) A solution has a description, an estimated cost and an expected benefit. One solution may address several causes, and one cause may be addressed through several solutions. Each such link records the percentage of the cause it covers.
h) A solution is delivered by any number of initiatives, each with a sponsor, a start date and a status.
i) An initiative breaks into one or more action items, each assigned to one person with a description, due date and status.
j) An initiative is measured by any number of benefit measures, each with a measurement date and the actual benefit realised.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (f) is a relationship from an entity to ITSELF. Draw it with the cardinality that lets a root cause have no parent.
4. Requirement (g) is many-to-many. Resolve it, and name the attribute that justifies the associative entity rather than a plain foreign key.
5. Answer both questions in the opening paragraph: trace the path from an initiative back to the problem it was meant to fix, and name the two attributes you would compare to see whether the promised benefit arrived.

</details>

### Q2886 — Fenland Water" - IoT Platform Records

- **Certification:** TOPCIT  
- **Lesson:** Internet of Things Standards  
- **Used in exams:** Understanding of Network Exam

<details><summary>Full question</summary>

"Fenland Water" - IoT Platform Records

Fenland runs one platform for several water companies and must never let one see another's devices. Model the data.

a) A tenant has a name and a contract reference, and owns one or more fleets. A fleet belongs to exactly one tenant and does not survive it.
b) A fleet contains any number of devices. A device belongs to exactly one fleet.
c) A device type has a manufacturer, a model name and a protocol standard, and is a shared catalogue. A device is specified by exactly one type; types outlive any device.
d) A device is identified by one or more device certificates, each with a serial, an issue date, an expiry date and a revocation date that is empty until it is revoked. Certificates are deleted with the device.
e) A device type declares one or more capabilities, each with a name, a data type and a writable flag. A capability has no meaning apart from its type.
f) A device exposes one or more device resources. Each realises exactly one capability of the device's type and has a URI path.
g) A resource records any number of observations, each with a timestamp and a value.
h) A consumer is authorised by exactly one tenant and has a name and a callback URL.
i) A resource is watched by any number of subscriptions. Each is placed by exactly one consumer and records a creation date and a minimum interval.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Answer the isolation requirement in the opening paragraph: trace on your diagram the path from a consumer to an observation, and name every entity that must be checked to prove the consumer's tenant owns that device.
4. Requirement (f) links a device's resource to its type's capability. Explain in one sentence why the capability is defined on the TYPE rather than on the device, and what would be duplicated if it were not.
5. Requirement (d) keeps expired and revoked certificates rather than deleting them. State in one sentence what question that answers, and how you would find the certificate that is currently valid.

</details>

### Q2897 — Pellworth Bank" - Threat Modelling Records

- **Certification:** TOPCIT  
- **Lesson:** Security Risk Analysis  
- **Used in exams:** Understanding of Security Exam

<details><summary>Full question</summary>

"Pellworth Bank" - Threat Modelling Records

Pellworth threat-models each release but keeps the results in slide decks, so nobody can say which threats from last year are still open. Model the data.

a) A system has a name and a criticality and is owned by exactly one system owner. Owners remain on file after a system is retired.
b) A system is modelled by one or more threat models, each with a version, a production date and the methodology used. A model has no meaning apart from its system.
c) A threat model contains one or more system elements, each with a name and a type (process, data store, external entity). Elements are deleted with the model.
d) A threat model defines any number of trust boundaries, each with a name and a description.
e) A threat model maps one or more data flows. A flow has a source element and a target element -- both from the same model -- a protocol, and a flag saying whether it crosses a trust boundary.
f) A threat category has a code and a name and is a standing list shared across all models.
g) A data flow attracts any number of identified threats. Each is classified by exactly one category and records a description and the date identified.
h) A threat is rated as one or more threat ratings, each with a likelihood, an impact, the date rated and a current-row flag. Ratings are never overwritten.
i) A threat is mitigated by any number of mitigations, each applying exactly one control and recording a status and a residual rating.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (e) has two foreign keys to the SAME entity. Show both, and name them so the source role and the target role are distinguishable.
4. Answer the question in the opening paragraph: name the two entities and the single attribute you would query to list last year's threats that are still open, and trace the path on your diagram.
5. Requirement (h) keeps every rating. Explain in one sentence why a rating belongs to a threat rather than to a data flow, and how you would find the rating that currently stands.

</details>

### Q2920 — Pellworth Bank" - Information Classification and Handling

- **Certification:** TOPCIT  
- **Lesson:** Information Security Principles  
- **Used in exams:** none (question bank only)

<details><summary>Full question</summary>

"Pellworth Bank" - Information Classification and Handling

Pellworth classifies information but cannot show that a confidential file on a laptop was encrypted, or that it was destroyed when its retention expired. Model the data.

a) A classification has a label, a rank and a description. Classifications are a standing list.
b) A storage medium has a name and a portable flag, and is a standing list.
c) A classification prescribes one or more handling rules. Each rule applies to exactly one storage medium and states a requirement and whether it is mandatory. A rule has no meaning apart from its classification.
d) A classification sets one or more retention schedules, each with a retention period in years and a disposal method.
e) An information asset has a name and a creation date, is classified by exactly one classification, and is owned by exactly one information owner. Owners remain on file after an asset is disposed of.
f) An information asset is held as one or more asset holdings. Each records the medium, a location and whether it is encrypted, and is deleted with the asset.
g) An asset holding ends in at most one disposal record, with a disposal date and a certificate reference.
h) An information asset is reviewed by any number of classification reviews, each performed by exactly one owner and recording the date and the new classification.
i) An information asset undergoes any number of transfer events, each recording the recipient, the date and whether it was approved.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Answer the first question in the opening paragraph: name the two entities and the single attribute you would compare to prove a confidential file on a laptop was encrypted, and trace the path on your diagram.
4. Answer the second: name the entities you would join to find holdings past their retention period with no disposal record, and state which cardinality makes "no disposal record" expressible.
5. Requirement (c) makes a handling rule depend on a classification AND a medium. Explain in one sentence why the rule cannot hang off the classification alone.

</details>

### Q2945 — Drummond Telecom" - Service Operations Records

- **Certification:** TOPCIT  
- **Lesson:** IT Business Operations  
- **Used in exams:** TOPCIT Diagnostic Exam; Understanding of IT Business Exam

<details><summary>Full question</summary>

"Drummond Telecom" - Service Operations Records

Drummond cannot tell a customer which of their services a fault affects, or what credit is owed for a missed target. Model the data.

a) A customer has a name, a segment and a join date, and holds one or more accounts. An account belongs to exactly one customer and does not survive it.
b) An account takes any number of subscriptions. A subscription records a start date and an end date, which is empty while it is active, and names exactly one product.
c) A product has a name, a type and a monthly price. Products are a catalogue and outlive any subscription.
d) A customer occupies one or more sites, each with an address and a postcode. A site belongs to exactly one customer.
e) A subscription is provisioned as any number of service instances, each with an identifier and an activation date, and each served at exactly one site.
f) A ticket category has a name and a target resolution time in hours. Categories are a standing list.
g) A service instance attracts any number of service tickets. A ticket is classified by exactly one category and records when it was raised, when it was closed (empty while open) and a priority.
h) A ticket records any number of ticket activities, each performed by exactly one engineer with a timestamp and notes. Engineers remain on file after a ticket closes.
i) A ticket may raise at most one SLA breach, recording the detection date, the hours over target and the credit amount.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Answer the first question in the opening paragraph: trace on your diagram the path from a service ticket to the customer's other affected services, naming every entity crossed.
4. Answer the second: name the entities and attributes you would use to compute the credit owed, and state which cardinality makes "no breach" expressible.
5. Requirements (b) and (g) both have a date that is empty while something is still open. State what that means for those columns, and one report you can write from each.

</details>

### Q3028 — Ravensworth Consulting" - Project Management Records

- **Certification:** TOPCIT  
- **Lesson:** Project Management Fundamentals  
- **Used in exams:** Project Management Fundamentals Quiz

<details><summary>Full question</summary>

"Ravensworth Consulting" - Project Management Records

Ravensworth cannot tell whether a project is late until the end, because planned effort and actual effort are held in different spreadsheets. Model the data.

a) A portfolio has a name and a sponsor, and contains one or more projects. A project belongs to exactly one portfolio and does not survive it.
b) A person has a name, a grade and a day rate. People remain on file after projects close.
c) A project is managed by exactly one person, has a name, planned start and end dates and a status.
d) A project is divided into one or more phases, each with a name and an ordinal. A phase cannot exist without its project.
e) A phase contains one or more tasks, each with a name, planned days and a percentage complete.
f) A task may precede any number of other tasks. Each dependency records its type (finish-to-start and so on) and a lag in days.
g) A task is staffed by any number of assignments. Each names one person with an allocation percentage and a date range.
h) An assignment is booked to any number of timesheet entries, each with a date worked and hours.
i) A phase marks any number of milestones, each with a name, a due date and an achieved date that is empty until it is achieved.
j) A phase produces one or more deliverables, each with a name and an acceptance date.
k) A project carries any number of risks, each owned by exactly one person with a description, likelihood and impact.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (f) is a many-to-many relationship from Task to ITSELF. Resolve it, and name the two foreign keys so the predecessor and successor roles are distinguishable.
4. Answer the problem in the opening paragraph: name the two attributes -- one planned, one actual -- that you would compare to spot a late task, and trace the path between them on your diagram.
5. Requirement (i) has an achieved date that is empty until achieved. State what that means for the column, and one report you can write from that single column.

</details>

### Q3050 — Ravensworth Consulting" - System Requirements Management

- **Certification:** TOPCIT  
- **Lesson:** System Requirements Management  
- **Used in exams:** System Requirements Management Quiz

<details><summary>Full question</summary>

"Ravensworth Consulting" - System Requirements Management

A client has asked Ravensworth to show which version of requirement R-212 was in the contract baseline, and whether it has been verified. Their tool cannot answer either. Model the data that would.

a) A project has a name, a manager and a status.
b) A project specifies one or more system requirements, each with a reference, text and a priority. A requirement has no meaning apart from its project.
c) A requirement type has a name and a functional flag, and is a standing list. Each requirement is classified by exactly one type.
d) A requirement is revised as one or more requirement versions, each with a version number, its text and a creation date. Versions are never overwritten.
e) A project freezes as any number of requirement baselines, each with a label and a freeze date.
f) A baseline includes one or more specific requirement VERSIONS. A version may be included in many baselines.
g) A requirement may be the parent of any number of other requirements, and a child of others. Each link records its type.
h) A requirement is the subject of any number of change requests, each raised by one person with a date, reason and status.
i) A verification method has a name and a rigour level, and is a standing list.
j) A requirement is verified by one or more verification plans, each prescribing exactly one method with acceptance criteria.
k) A verification plan yields any number of verification results, each with an execution date, an outcome and an evidence reference.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirements (f) and (g) are many-to-many. Resolve both, and for requirement (g) name the two foreign keys so the parent and child roles are distinguishable.
4. Answer the client's first question: trace on your diagram the path from a baseline to the exact text of R-212 as it stood then, naming every entity crossed. State in one sentence why requirement (f) links to a version rather than to the requirement.
5. Answer the client's second: name the entities you would join to show R-212 is verified, and state what an outcome of "passed" against an OLD version would tell you.

</details>

### Q3070 — Thornbury Engineering" - Documentation Portfolio

- **Certification:** TOPCIT  
- **Lesson:** Technical Document Types and Processes  
- **Used in exams:** Technical Documentation Exam

<details><summary>Full question</summary>

"Thornbury Engineering" - Documentation Portfolio

Thornbury ships products into eleven countries and cannot say which language versions of a manual are current. Model the data.

a) A product has a name and a model code, and is documented by one or more documents. A document belongs to exactly one product and does not survive it.
b) A document type has a name, an audience and a controlled flag. Types are a standing list and outlive any document. Each document is classified by exactly one type.
c) A document type provides one or more templates, each with a name and a version. A template has no meaning apart from its type.
d) A document is issued as one or more revisions, each with a revision code, an issue date and a status. A revision is shaped by exactly one template.
e) A revision is structured into one or more sections, each with a heading and an ordinal. A section may nest within another section of the same revision, to any depth; a top-level section nests within none.
f) A locale has a language tag and a name, and is a standing list.
g) A revision is translated as any number of translations, each targeting exactly one locale and recording a translation date and a status.
h) A translation is published as any number of distributions, each with a channel, a publication date and a withdrawal date that is empty while it is current.
i) A revision undergoes any number of document reviews, each performed by exactly one reviewer and recording the review type, date and outcome.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (e) is a relationship from an entity to ITSELF. Draw it with the cardinality that lets a top-level section have no parent.
4. Answer the question in the opening paragraph: name the entities and the single attribute you would query to list the currently published language versions of a manual, and trace the path on your diagram.
5. Requirement (g) attaches a translation to a REVISION rather than to a document. Explain in one sentence why, and what would go wrong when the English original is revised if it attached to the document instead.

</details>

### Q3137 — Ravensworth Consulting" - Requirement Allocation and Interfaces

- **Certification:** TOPCIT  
- **Lesson:** System Requirements Management  
- **Used in exams:** Requirements and System Specifications Exam

<details><summary>Full question</summary>

"Ravensworth Consulting" - Requirement Allocation and Interfaces

Ravensworth builds systems from subsystems supplied by different teams, and nobody can say which team owns a given requirement or which subsystems an interface joins. Model the data.

a) A system has a name and belongs to exactly one project.
b) A system is composed of one or more subsystems, each with a name. A subsystem may contain other subsystems to any depth; a top-level subsystem is contained by none. A subsystem does not survive its system.
c) Each subsystem is the responsibility of exactly one owner. Owners have a name and a discipline and remain on file after a subsystem is retired.
d) A system specifies one or more requirements, each with a reference, text and a level (system, subsystem, component).
e) A requirement is allocated by any number of allocations. Each allocates it to exactly one subsystem and records the allocation type and date. A subsystem may receive many allocations.
f) An allocation apportions any number of budget allocations, each naming a parameter with a value and a unit -- mass, power, latency and so on.
g) A requirement may be the parent of any number of other requirements. Each decomposition records the rationale.
h) A system defines any number of interfaces, each with a name and a type.
i) An interface joins two or more interface endpoints. Each endpoint terminates at exactly one subsystem and records that subsystem's role.
j) An interface is governed by any number of interface requirements, each referring to exactly one requirement and recording a protocol and a data format.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirements (b) and (g) are both relationships from an entity to ITSELF. Draw both, and for requirement (g) name the two foreign keys so the parent and child roles are distinguishable.
4. Answer both questions in the opening paragraph: trace the path from a requirement to the team that owns it, and the path from an interface to the subsystems it joins, naming every entity crossed.
5. Requirement (i) says two or MORE endpoints. Explain in one sentence why an interface is not simply two foreign keys on one row, and what requirement (f) would let a systems engineer check across a whole subsystem.

</details>

### Q3190 — Ravensworth Consulting" - Backlog Documentation

- **Certification:** TOPCIT  
- **Lesson:** Requirements Documentation  
- **Used in exams:** Technical Communications Exam

<details><summary>Full question</summary>

"Ravensworth Consulting" - Backlog Documentation

Ravensworth's backlog uses the same word to mean two different things in different stories, and nobody can say which sprint a story slipped from. Model the data.

a) A product has a name and is owned by exactly one product owner. Owners remain on file after a product is retired.
b) A product is delivered through one or more epics, each with a title, an outcome and a status. An epic has no meaning apart from its product.
c) An epic is broken into one or more user stories, each with a reference, a goal, a benefit and an estimate in points.
d) A persona has a name and a description and is a shared list. Each story names exactly one persona as its role; a persona appears in many stories.
e) A story is accepted by one or more acceptance criteria, each with an ordinal, a given-when-then statement and a mandatory flag. Criteria are deleted with the story.
f) A story may block any number of other stories. Each dependency records the reason.
g) A product defines any number of glossary terms, each with a term and a definition.
h) A story may refer to any number of glossary terms, and a term may be referred to by many stories.
i) A sprint has a name and a start and end date and belongs to exactly one product.
j) A sprint commits any number of stories. Each commitment records the points committed and the completion date, which is empty if the story did not finish. One story may be committed to several sprints over time.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (f) is a many-to-many relationship from UserStory to ITSELF. Resolve it, and name the two foreign keys so the blocking and blocked roles are distinguishable.
4. Answer the first problem in the opening paragraph: requirements (g) and (h) are what fix it. Resolve the many-to-many, and explain in one sentence why one shared definition per product beats a definition written into each story.
5. Answer the second: name the entity and the two attributes you would query to find a story that slipped from one sprint to the next, and state which cardinality in requirement (j) makes that history possible.

</details>


## Flowchart (17)

### Q2266 — Meridian Logistics" Code Review and Merge Process

- **Certification:** TOPCIT  
- **Lesson:** Software Implementation Practices  
- **Used in exams:** Software Implementation Practices Quiz

<details><summary>Full question</summary>

"Meridian Logistics" Code Review and Merge Process

Meridian's platform team is writing down the process every change must follow before it reaches main. Model it as a flowchart.

a) A developer creates a feature branch, commits their changes and pushes them.
b) Every push triggers an automated build and the unit test suite.
c) If the build or any test fails, the developer fixes the defects locally and commits again. This may happen any number of times.
d) Once the build is green the developer opens a pull request, which a peer reviews.
e) If the reviewer does not approve, the developer addresses the comments and commits again -- returning to the same build and test step, not straight back to review.
f) A change that touches the payment code requires a second reviewer's approval as well; any other change does not.
g) Once every required approval is in, the change is merged to main and deployed to staging, and the process ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show every step in requirements (a) to (g), using the correct symbol for each: terminator, process step, decision.
3. Label EVERY decision branch with its guard condition.
4. Requirement (e) says rework returns to the build step, not to review. Show that loop correctly and explain in one sentence why returning straight to review would be wrong.
5. Requirement (f) is conditional. Show it as a decision rather than as an always-executed step, and state what the guard is.

</details>

### Q2276 — Software Development Lifecycle with Verification Points

- **Certification:** TOPCIT  
- **Lesson:** Software Testing and Quality Assurance  
- **Used in exams:** Software Testing and Quality Assurance Quiz

<details><summary>Full question</summary>

Software Development Lifecycle with Verification Points

A quality manager is documenting where verification happens across the lifecycle, so that no phase is completed without evidence. Model the process.

a) Requirements are gathered and then reviewed statically -- examined, not executed. If the review does not baseline them, they are gathered again.
b) Once baselined, a design is produced and put through a design walkthrough, which is also static.
c) Code is implemented, then exercised dynamically: unit testing, then integration testing, then system testing, in that order.
d) After system testing the exit criteria are checked. If they are not met, defects are logged and fixed, and the process returns to implementation -- not to design.
e) When the exit criteria are met, acceptance testing is carried out with the customer.
f) If the customer does not accept, the defects are logged and fixed on the same path as (d). If they accept, the software is released and the process ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show every step in requirements (a) to (f) with the correct symbol.
3. Mark which verification steps are static and which are dynamic, and explain in one sentence what distinguishes them.
4. Label EVERY decision branch with its guard, and show both rework loops returning to the correct step.
5. Requirement (c) fixes the order of the three dynamic levels. State in one sentence what each level can find that the one before it cannot.

</details>

### Q2287 — Ledgerline" Accounting System - Responding to a Platform Upgrade

- **Certification:** TOPCIT  
- **Lesson:** Software Maintenance Strategies  
- **Used in exams:** Software Maintenance and Evolution Exam; Software Maintenance Strategies Quiz

<details><summary>Full question</summary>

"Ledgerline" Accounting System - Responding to a Platform Upgrade

Ledgerline's accounting software must keep running as the database and operating system beneath it are upgraded. The maintenance team wants the decision process written down, so that every change is classified before it is scheduled.

a) When a vendor announces a platform upgrade, the team assesses its impact on the accounting system. If the system is not affected, the change is recorded, monitored, and the process ends.
b) If it is affected, the change is classified. A change that repairs a defect in the delivered system is corrective maintenance.
c) A change driven by the environment moving underneath the system -- a new database version, a changed OS API -- while its own requirements are unchanged, is adaptive maintenance.
d) A change that answers a new or refined user requirement is perfective maintenance.
e) A change that is none of those -- refactoring, raising test coverage, addressing technical debt, with no visible change for users -- is preventive maintenance.
f) Whichever it is, the change is then planned and scheduled, implemented, and regression tested. If regression fails, the regression is repaired and retested. Once it passes, the change is released and the process ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show the classification in requirements (b) to (e) as a chain of decisions, each with its guard, reaching exactly one of the four maintenance categories.
3. Show the common path of requirement (f) once, not four times, and explain in one sentence why duplicating it would be a modelling error.
4. Show the regression loop returning to implementation.
5. Requirement (c) says the system's own requirements are unchanged. State in one sentence why that single fact is what separates adaptive from perfective.

</details>

### Q2297 — Requirements Engineering Process at "Northgate Software

- **Certification:** TOPCIT  
- **Lesson:** Introduction to Requirements Engineering  
- **Used in exams:** Software Requirements Engineering Exam; Study plan mock exam · 2026-09-28

<details><summary>Full question</summary>

Requirements Engineering Process at "Northgate Software"

Northgate's process group is documenting how requirements are produced and kept current, so that every project follows the same route. Model it.

a) Requirements are elicited from stakeholders, then analysed and negotiated.
b) If conflicts between stakeholders remain unresolved, the team negotiates and returns to elicitation. This may happen any number of times.
c) Once conflicts are resolved, the requirements are specified -- written up as a requirements document.
d) The specification is validated with the stakeholders. If they do not agree it, the specification is revised and validated again; the team does NOT return to elicitation for this.
e) When the stakeholders agree, the specification is baselined.
f) After baselining, any change request received is assessed for impact and the baseline is updated; the process then waits for the next change request. The process ends only when no further change request is outstanding.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show every step in requirements (a) to (f) with the correct symbol.
3. Label EVERY decision branch with its guard.
4. Requirements (b) and (d) both loop, but to different places. Show both correctly and explain in one sentence why a failed validation must not return to elicitation.
5. Requirement (f) describes requirements MANAGEMENT rather than requirements DEVELOPMENT. State in one sentence what distinguishes the two, and mark on your diagram where one ends and the other begins.

</details>

### Q2543 — Corvus Analytics" - From Raw Data to Decision

- **Certification:** TOPCIT  
- **Lesson:** Data, Information, and Knowledge  
- **Used in exams:** Database Construction and Management Exam; Database Fundamentals Exam

<details><summary>Full question</summary>

"Corvus Analytics" - From Raw Data to Decision

Corvus wants the route from a raw feed to a business decision written down, so that the difference between data, information, knowledge and wisdom is visible in the process rather than argued about.

a) Raw data is captured from the source systems and profiled for completeness.
b) If the quality is not acceptable, the batch is cleansed and deduplicated.
c) After cleansing the team asks whether the batch is recoverable. If it is, it is profiled again. If it is not, the batch is rejected, a data incident is raised, and the process ends there.
d) Acceptable data has context added -- units, time, entity keys -- turning it into information.
e) The information is aggregated and related to other information, then rules and models are applied to produce knowledge.
f) If the resulting insight is not actionable, further evidence is gathered and capture begins again.
g) If it is actionable, a decision is taken and acted on.
h) The outcome is recorded as new evidence, and the process ends.

Tasks
1. Draw the flowchart with one start terminator and exactly two end points -- requirement (c) terminates early. Use the terminator symbol for both.
2. Show every step in requirements (a) to (h) with the correct symbol.
3. Label EVERY decision branch with its guard.
4. Mark on your diagram where data becomes information, where information becomes knowledge, and where knowledge becomes a decision. State in one sentence what is added at each of those three transitions.
5. Requirement (h) feeds the outcome back as evidence. Explain in one sentence why that step is what makes the process a cycle rather than a pipeline, and what is lost if it is skipped.

</details>

### Q2696 — Thornbury Engineering" - Technical Document Lifecycle

- **Certification:** TOPCIT  
- **Lesson:** Technical Document Types and Processes  
- **Used in exams:** Technical Document Types and Processes Quiz

<details><summary>Full question</summary>

"Thornbury Engineering" - Technical Document Lifecycle

Thornbury issues manuals, specifications and work instructions, and an auditor has found two versions of the same procedure in circulation. Model the process a document must follow.

a) The author identifies the need and the audience, then selects the document type and its template.
b) The author writes the draft, which goes to a subject expert for technical review.
c) If it is not technically correct, the content is corrected and reviewed again. This may happen any number of times.
d) Once technically correct, the document goes to editorial review for clarity and style.
e) If it is not editorially acceptable, the wording is revised and it is edited again -- it does NOT return to technical review for a wording change.
f) Controlled documents require an approval signature; uncontrolled ones do not.
g) If approval is refused, the document returns to content correction, not to editorial review.
h) The document is published with a version number and distributed to its audience.
i) When a document is superseded or becomes obsolete it is withdrawn and archived. Until then it remains current.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show every step in requirements (a) to (i) with the correct symbol.
3. Label EVERY decision branch with its guard.
4. Requirements (c), (e) and (g) all loop, but to three different places. Show all three, and explain in one sentence why a refused approval returns further back than a wording change does.
5. Requirement (i) is what fixes the auditor's finding. State in one sentence which step makes two versions distinguishable, and which step removes the old one from circulation.

</details>

### Q2763 — Pellworth Bank" - Security Incident Response

- **Certification:** TOPCIT  
- **Lesson:** ISMS Monitoring and Improvement  
- **Used in exams:** Information Security Management Systems Exam

<details><summary>Full question</summary>

"Pellworth Bank" - Security Incident Response

Pellworth must show a regulator that incidents follow a defined process and that notification decisions are made deliberately. Model the process.

a) The process starts when an alert or a report is received. It is triaged and verified.
b) If it is not a genuine incident, it is recorded as a false positive and the process ends.
c) A genuine incident is classified by severity and category.
d) A major incident additionally invokes the crisis management team; a minor one does not. Both then continue to containment.
e) The incident is contained. If containment fails, it is escalated, containment is widened, and containment is attempted again. This may happen any number of times.
f) Once contained, the root cause is eradicated and services are recovered and verified.
g) If verification fails, the team returns to recovery -- not to eradication.
h) The team then decides whether the incident is a notifiable breach. If it is, the regulator and the affected data subjects are notified.
i) In both cases a lessons learned review is held, and the process ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show every step in requirements (a) to (i) with the correct symbol.
3. Label EVERY decision branch with its guard.
4. Requirements (d), (h) and (i) each have two branches that converge again. Show each pair converging on one activity rather than duplicating the steps that follow.
5. Requirement (f) fixes the order: contain, then eradicate, then recover. State in one sentence what goes wrong if eradication is attempted before containment, and why requirement (g) returns to recovery rather than to eradication.

</details>

### Q2811 — Skelton Datacentre" - Monthly KPI Reporting

- **Certification:** TOPCIT  
- **Lesson:** Key Performance Indicators  
- **Used in exams:** Performance Management Exam

<details><summary>Full question</summary>

"Skelton Datacentre" - Monthly KPI Reporting

Skelton's scorecard is published late every month because one source system always reports last, and variances are noted but never acted on. Model the process that fixes both.

a) The cycle starts when the period closes. Actuals are collected from the source systems.
b) If any source has not reported, it is chased. If the publication deadline has not passed, collection is attempted again; this may repeat.
c) If the deadline has passed, a flagged estimate is used for the missing source and the cycle continues.
d) Each KPI is calculated from its formula, and the actual is compared against its target.
e) If a KPI is within its threshold, nothing further is recorded for it.
f) If it is outside the threshold, a variance and its cause are recorded, and the team decides whether an action is required. If one is, an improvement action is raised.
g) The scorecard is published and the performance review meeting is held.
h) The meeting asks whether the targets are still appropriate. If they are not, targets are revised for the next period.
i) The cycle then ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show every step in requirements (a) to (i) with the correct symbol.
3. Label EVERY decision branch with its guard.
4. Requirement (c) is what stops the late-publication problem in the opening paragraph. Explain in one sentence what the flag on the estimate is for, and what would be wrong with simply waiting.
5. Requirements (e), (f) and (h) all have branches that rejoin. Show each pair converging on one activity rather than duplicating the steps that follow, and state which single decision turns a noted variance into an acted-on one.

</details>

### Q2962 — Drummond Telecom" - Change Deployment to Production

- **Certification:** TOPCIT  
- **Lesson:** IT Business Operations  
- **Used in exams:** Understanding of IT Business Exam

<details><summary>Full question</summary>

"Drummond Telecom" - Change Deployment to Production

Drummond has twice been unable to roll a failed change back because no snapshot was taken. Model the deployment process so that cannot happen.

a) The process starts with an approved change. The change window is confirmed.
b) If the window is not available the change is rescheduled and the window is confirmed again.
c) A rollback snapshot is taken BEFORE anything is deployed.
d) The change is deployed to production and the smoke tests are run.
e) If the smoke tests fail, the team asks whether the fault is fixable within the remaining window. If it is, a hotfix is applied and the smoke tests are run again.
f) If it is not fixable in the window, the change is rolled back to the snapshot.
g) If the smoke tests pass, the change is monitored for a soak period.
h) If it is not stable through the soak, it is rolled back on the same path as requirement (f).
i) If it is stable, the change record is closed.
j) A post-implementation review is held whether the change succeeded or was rolled back, and the process ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show every step in requirements (a) to (j) with the correct symbol.
3. Label EVERY decision branch with its guard.
4. Requirement (c) fixes the problem in the opening paragraph. State where the snapshot step must sit relative to the deployment step, and what requirements (f) and (h) would be unable to do if it sat anywhere else.
5. Requirements (f), (h) and (j) all converge. Show the rollback drawn once with two branches reaching it, and the review drawn once with both outcomes reaching it, rather than duplicating either.

</details>

### Q2982 — Producing a Requirements Document

- **Certification:** TOPCIT  
- **Lesson:** Requirements Documentation  
- **Used in exams:** Requirements Documentation Quiz

<details><summary>Full question</summary>

Producing a Requirements Document

A business analyst is documenting how a requirements document is produced, so that every statement in it is testable and traceable.

a) The audience and the document's purpose are identified, and the standard template selected.
b) The agreed requirements are assembled, and each is written in the standard form.
c) Each statement is checked against three criteria: it must be atomic, testable and unambiguous. Any statement failing one of them is rewritten and checked again. This may happen any number of times.
d) Traceability is added, linking each requirement back to its source.
e) If any requirement has no traceable source, the source is found or recorded, and traceability is checked again.
f) The document is circulated for stakeholder review.
g) If it is not agreed, the document is revised and the statements are written again -- the revision goes back to the writing step, not straight to review.
h) When it is agreed, the document is baselined and a version issued, and the process ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show every step in requirements (a) to (h) with the correct symbol.
3. Label EVERY decision branch with its guard.
4. Requirement (c) names three criteria in one decision. State in one sentence what "atomic" and "testable" each rule out, and give an example statement that fails one of them.
5. Requirements (c), (e) and (g) all loop to different places. Show all three, and explain in one sentence why a rejected review returns to writing rather than to assembling the requirements.

</details>

### Q2994 — Issuing a Request for Information

- **Certification:** TOPCIT  
- **Lesson:** Request for Information (RFI)  
- **Used in exams:** Request for Information (RFI) Quiz

<details><summary>Full question</summary>

Issuing a Request for Information

A procurement lead is documenting when an RFI is used and how it is run, so that it is not confused with a request for proposal.

a) The process starts when a need is identified. The team asks whether the requirement is already understood.
b) If it is already understood, no RFI is needed and the team proceeds directly to an RFP; the process ends there.
c) If it is not, the information needed is defined and the RFI and its questions are drafted.
d) The questions are checked to be non-leading and answerable. Any that are not are rewritten and checked again.
e) The supplier list is identified and the RFI issued with a response deadline.
f) Clarification questions from suppliers are answered in writing so that every supplier sees the same answer.
g) Until the deadline is reached, responses continue to be received and clarifications continue to be answered.
h) At the deadline the team asks whether there are enough usable responses. If not, the deadline is extended or the supplier list widened, and the RFI is issued again.
i) With enough responses, the findings are evaluated and summarised, and a decision is made on whether to proceed to an RFP. The process then ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator -- requirement (b) also terminates, so route it to the same end.
2. Show every step in requirements (a) to (i) with the correct symbol.
3. Label EVERY decision branch with its guard.
4. Requirement (a) is the decision that separates an RFI from an RFP. State in one sentence what each instrument is for, and what it costs a buyer to issue an RFP when the requirement is not yet understood.
5. Requirement (f) says clarifications are answered so every supplier sees the same answer. Explain in one sentence what procurement principle that protects, and what would be at risk if one supplier were answered privately.

</details>

### Q3005 — Developing a Business Plan

- **Certification:** TOPCIT  
- **Lesson:** Business Plan Development  
- **Used in exams:** Business Plan Development Quiz

<details><summary>Full question</summary>

Developing a Business Plan

A founder is documenting how a business plan is built, so that the financial forecast is tested against the business model rather than written to fit it.

a) The business idea and the value it offers are stated.
b) The market and its competitors are researched.
c) If the market is not large enough, the idea is refined or pivoted, and it is stated again. This may happen any number of times.
d) With a large enough market, the business and revenue model is defined, then operations and resources are planned, then the financial forecast is built.
e) If the forecast does not break even within the planning horizon, pricing, cost or scope is adjusted and the business model is defined again -- the forecast is NOT simply rewritten.
f) Once it breaks even, risks and mitigations are assessed.
g) The plan and its executive summary are written and reviewed with mentors or the board.
h) If it is not approved for funding, the plan is revised and written again.
i) Once approved, the plan is executed and monitored against, and the process ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show every step in requirements (a) to (i) with the correct symbol.
3. Label EVERY decision branch with its guard.
4. Requirement (e) is the point of the whole process. Explain in one sentence why a failed forecast sends the founder back to the business model rather than to the forecast, and what the opening paragraph means by "written to fit it".
5. Requirements (c), (e) and (h) loop to three different places. Show all three, and state which of them is the most expensive to hit and why.

</details>

### Q3017 — Preparing and Delivering a Technical Presentation

- **Certification:** TOPCIT  
- **Lesson:** Technical Presentations  
- **Used in exams:** Professional Presentations Exam; Technical Presentations Quiz

<details><summary>Full question</summary>

Preparing and Delivering a Technical Presentation

A team lead is documenting how a technical presentation is prepared, so that it fits its slot and its audience rather than the speaker's material.

a) The audience and its technical level are analysed, and a single objective is stated.
b) If the objective cannot be achieved in the time available, the scope is narrowed and the objective restated.
c) The message and its supporting evidence are structured, and slides and visual aids are built.
d) If the visuals are not readable from the back of the room, they are simplified and rebuilt.
e) The presentation is rehearsed against the clock.
f) If it does not fit the time slot, content is cut -- not rehearsal time -- and the message is structured again.
g) The room and equipment are checked, and the presentation delivered.
h) Questions are taken. A question outside the scope is taken offline with a follow-up rather than answered at length.
i) The presentation closes with the key message, and the process ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show every step in requirements (a) to (i) with the correct symbol.
3. Label EVERY decision branch with its guard.
4. Requirement (f) says cut content, not rehearsal time, and returns to structuring rather than to rehearsing. Explain in one sentence why both of those choices matter.
5. Requirement (h) has two branches that rejoin at the close. Show them converging on one activity, and state in one sentence what taking an out-of-scope question at length costs the audience.

</details>

### Q3039 — Building and Levelling a Project Schedule

- **Certification:** TOPCIT  
- **Lesson:** Project Scheduling and Resources  
- **Used in exams:** Project Scheduling and Resources Quiz

<details><summary>Full question</summary>

Building and Levelling a Project Schedule

A project manager is documenting how a schedule is built, levelled and tracked, so that resource levelling is not allowed to silently move the end date.

a) The scope is decomposed into a work breakdown, each task is estimated, and the tasks are sequenced with their dependencies.
b) The critical path is calculated.
c) If the schedule does not meet the required end date, the critical path is crashed or fast-tracked and the critical path is recalculated.
d) Resources are assigned to tasks.
e) If any resource is over-allocated, that resource is levelled.
f) After levelling, the team asks whether the end date has moved. If it has, the critical path is recalculated from scratch. If it has not, the over-allocation check is repeated for the next resource.
g) When no resource is over-allocated, the schedule is baselined.
h) Progress is tracked against the baseline. If the variance goes beyond tolerance, the remaining work is re-planned, starting again from sequencing.
i) If the variance is within tolerance and the project is not complete, tracking continues.
j) When the project is complete the process ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show every step in requirements (a) to (j) with the correct symbol.
3. Label EVERY decision branch with its guard.
4. Requirement (f) is the point of the process. Explain in one sentence why levelling can move the end date, and what would go unnoticed if the schedule were baselined straight after levelling.
5. Requirement (h) re-plans from sequencing rather than from the work breakdown. State in one sentence what that assumes about the scope, and when that assumption would be wrong.

</details>

### Q3161 — Choosing the Right Technical Document

- **Certification:** TOPCIT  
- **Lesson:** Technical Document Types and Processes  
- **Used in exams:** Technical Communications Exam

<details><summary>Full question</summary>

Choosing the Right Technical Document

Thornbury's engineers write everything as a "report", so readers cannot tell an instruction from a proposal. Model the decision process that picks the document type from what the reader needs to do.

a) The process starts when information needs recording. The reader and what they must do with the information are identified.
b) If the reader must perform a task step by step, a procedure or work instruction is written.
c) Otherwise, if the reader must decide whether something meets a need, a specification is written.
d) Otherwise, if the reader must understand how something works, a design description is written.
e) Otherwise, if the reader must be persuaded to act, a proposal or business case is written.
f) Otherwise, if what is needed is a record of what happened, a report or record is written.
g) If none of those apply, a reference or glossary entry is written.
h) Whichever type is chosen, the matching template is then selected.
i) If no template exists for that type, a new one is raised with the process group and the template is selected again.
j) The document is written and the process ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show the choice in requirements (b) to (g) as a chain of decisions, each with its guard, reaching exactly one document type.
3. Show the common path of requirements (h) to (j) ONCE, with all six document types converging on it, rather than drawing it six times. Explain in one sentence why duplicating it would be a modelling error.
4. Label EVERY decision branch with its guard.
5. Requirement (a) selects on what the reader must DO, not on what the writer knows. Explain in one sentence why that is the right test, and which two document types in this chain are most often confused when it is not applied.

</details>

### Q3163 — Refining a User Story to "Ready

- **Certification:** TOPCIT  
- **Lesson:** Requirements Documentation  
- **Used in exams:** Technical Communications Exam

<details><summary>Full question</summary>

Refining a User Story to "Ready"

A team keeps pulling stories into a sprint that turn out to be too big or untestable. Model the refinement process that decides when a story is ready.

a) The process starts with a story on the backlog. It is written in the role-goal-benefit form.
b) If the value to the user is not clear, it is clarified with the product owner and the story rewritten.
c) Acceptance criteria are added.
d) If the criteria are not testable and complete, they are rewritten and checked again.
e) Dependencies are checked. Any unresolved dependency is recorded and sequenced, and the check is repeated.
f) The team estimates the story.
g) If it is too large for one sprint it is split into smaller vertical slices, and each slice goes back to being written in the role-goal-benefit form.
h) The team then decides whether it is ready. If it is not, it returns to the backlog and the process ends there.
i) If it is ready, it is marked ready and added to the sprint, and the process ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator -- requirement (h) also terminates, so route it to the same end.
2. Show every step in requirements (a) to (i) with the correct symbol.
3. Label EVERY decision branch with its guard.
4. Requirement (g) says vertical slices, and sends each slice back to the beginning. Explain in one sentence what a vertical slice is, and why splitting a story horizontally would not fix the problem in the opening paragraph.
5. Requirement (d) makes testability a gate rather than an afterthought. State in one sentence what an untestable acceptance criterion costs the team at the END of the sprint.

</details>

### Q3165 — Raising a Funding Round

- **Certification:** TOPCIT  
- **Lesson:** Business Plan Development  
- **Used in exams:** Business Proposals and RFI/RFP Exam; Technical Communications Exam

<details><summary>Full question</summary>

Raising a Funding Round

A founder is documenting how a funding round is run, so that the amount asked for is justified by the plan rather than chosen first.

a) The process starts when a funding need is identified. The amount and the runway it buys are determined.
b) If the existing business plan does not support the ask, the plan and forecast are revised and the amount determined again. This may happen any number of times.
c) The funding type and instrument are chosen, the pitch deck and data room prepared, and target investors approached.
d) If no interest is received, the investor list is widened or the ask revised, and investors are approached again.
e) With interest, the company undergoes due diligence.
f) If diligence raises issues they are remedied and diligence is re-submitted.
g) The term sheet is negotiated.
h) If the terms are not acceptable to the founders, the offer is declined and the founders return to approaching investors.
i) If they are acceptable, the legals are completed and the round closed.
j) Investors are then reported to against the plan, and the process ends.

Tasks
1. Draw the flowchart with one start terminator and one end terminator.
2. Show every step in requirements (a) to (j) with the correct symbol.
3. Label EVERY decision branch with its guard.
4. Requirement (b) is the control described in the opening paragraph. Explain in one sentence why a failed check returns to the PLAN rather than simply lowering the ask.
5. Requirements (d) and (h) both loop back to approaching investors, from different places. Show both, and state in one sentence what distinguishes the two situations for the founder.

</details>


## Sequence Diagram (4)

### Q23264 — An online payment gateway processes a transaction as follows:

- **Certification:** IT Passport Exam  
- **Lesson:** Management Principles and Organizational Structures  
- **Used in exams:** Blueprint Arena

<details><summary>Full question</summary>

An online payment gateway processes a transaction as follows:
(a) The Merchant sends a payment request to the PaymentGateway with the order amount and card token.
(b) The PaymentGateway validates the card token with the TokenService.
(c) If validation passes, the PaymentGateway sends an authorization request to the AcquiringBank.
(d) The AcquiringBank forwards the request to the CardNetwork (e.g., Visa).
(e) The CardNetwork checks with the IssuingBank whether the cardholder has sufficient funds.
(f) The IssuingBank responds with approved or declined.
(g) The response propagates back through CardNetwork → AcquiringBank → PaymentGateway → Merchant.
(h) If approved, the PaymentGateway logs the transaction in the AuditLog.

Model the full interaction as a sequence diagram showing all messages in order, including the conditional (approved/declined) path.

</details>

### Q2322 — Kestrel Retail" - Place Order Interaction

- **Certification:** TOPCIT  
- **Lesson:** Software Architecture and Patterns  
- **Used in exams:** Software Design and Architecture Exam

<details><summary>Full question</summary>

"Kestrel Retail" - Place Order Interaction

Kestrel's team needs the runtime interaction for placing an order agreed before the services are built. Model one successful and one failing path in a single diagram.

a) The customer starts checkout in the storefront UI, which calls the order service with the basket identifier.
b) The order service first asks the inventory service to reserve the stock, and waits for the answer before doing anything else.
c) If stock is available, the order service asks the payment service to authorise the amount and waits for the result.
d) A declined authorisation is retried up to three times. The customer is not asked again between retries.
e) On a successful authorisation the order service tells the notification service to send a confirmation. It does NOT wait for the notification to be sent -- the order is complete either way.
f) If stock is not available, or if all three authorisation attempts are declined, the order service releases any reserved stock and no confirmation is sent.
g) In every case the order service returns the outcome to the UI, which displays it to the customer.

Tasks
1. Draw a lifeline for the customer and for each of the five components named in requirements (a) to (f).
2. Number the messages in the order they occur, and show returns as dashed arrows.
3. Use an alt fragment for requirement (f) and a loop fragment for requirement (d), with the guard written in each fragment's bracket.
4. Requirement (e) is asynchronous but requirements (b) and (c) are synchronous. Draw the three differently, and explain in one sentence what the order service does differently in each case.
5. Requirement (f) says stock is released on both failure paths. Show that step where it belongs, and state what would go wrong in the warehouse if it were placed only on the payment-failure branch.

</details>

### Q2565 — Corvus Analytics" - Nightly Warehouse Load

- **Certification:** TOPCIT  
- **Lesson:** Data Modeling Techniques  
- **Used in exams:** Database Construction and Management Exam

<details><summary>Full question</summary>

"Corvus Analytics" - Nightly Warehouse Load

Corvus loads its warehouse overnight. When the load half-completes, nobody can tell what state the warehouse is in. Model the interaction so the ordering and the failure path are explicit.

a) The load scheduler starts the run, passing the run date to the extractor, and waits for it to finish.
b) For each source table in turn, the extractor reads the rows changed since the last run from the source database, waits for the batch, and writes it to the staging area. This repeats until every source table is done.
c) The extractor then reports the total row count back to the scheduler.
d) The scheduler calls the transformer, which reads the staged rows and applies the business rules to itself before deciding anything.
e) If validation passes, the transformer loads the dimensions first and then the facts, waiting for the warehouse to confirm the rows loaded, and finally truncates the staging area.
f) If validation fails, nothing is loaded, staging is NOT truncated, and the transformer raises a load failure to the operations alert service. It does not wait for that alert to be delivered.
g) In both cases the transformer returns the outcome to the scheduler.

Tasks
1. Draw a lifeline for the scheduler and for each of the six participants named in requirements (a) to (f).
2. Number the messages in the order they occur, and show returns as dashed arrows.
3. Use a loop fragment for requirement (b) and an alt fragment for requirements (e) and (f), writing the guard in each fragment's bracket.
4. Requirement (d) has the transformer call itself. Draw that self-message, and explain in one sentence why it is shown rather than left implicit.
5. Requirement (e) fixes dimensions before facts, and requirement (f) leaves staging intact on failure. State in one sentence what each of those two rules protects, and what would break if either were reversed.

</details>

### Q3167 — Technical Presentation - Live Demonstration

- **Certification:** TOPCIT  
- **Lesson:** Technical Presentations  
- **Used in exams:** Professional Presentations Exam; Technical Communications Exam

<details><summary>Full question</summary>

Technical Presentation - Live Demonstration

A presenter's live demo failed in front of a client because there was no fallback. Model the interaction, including what happens when the demo environment is down.

a) The presenter connects the laptop to the AV system and waits for it to confirm the display is ready.
b) The presenter opens the demo on the laptop, which health-checks the demo environment and waits for the answer BEFORE anything is shown.
c) If the environment is healthy, the presenter performs each demo step in turn. For each step the laptop executes the action against the demo environment and waits for the result. This repeats for every step.
d) The laptop renders each result to the AV system.
e) If the environment is NOT healthy, the presenter plays the recorded backup instead, which renders to the AV system. No step is executed against the live environment.
f) In both cases the AV system shows the demonstration to the audience.
g) The presenter narrates and takes questions from the audience.

Tasks
1. Draw a lifeline for the presenter, the audience, and each of the four systems named in requirements (a) to (f).
2. Number the messages in the order they occur, and show returns as dashed arrows.
3. Use an alt fragment for requirements (c) and (e), and a loop fragment for the repetition in requirement (c), writing the guard in each fragment's bracket.
4. Requirement (b) says the health check completes before anything is shown. Explain in one sentence why that ordering is what makes requirement (e) possible, and what the presenter in the opening paragraph was missing.
5. Requirement (f) means both branches converge. Show the AV system receiving from either path, and state which single lifeline the audience ever interacts with directly.

</details>


## Class Diagram (10)

### Q23263 — A logistics company operates a fleet management system. Each Vehicle has a registration number, type (truck, van, motorc

- **Certification:** IT Passport Exam  
- **Lesson:** Management Principles and Organizational Structures  
- **Used in exams:** Blueprint Arena

<details><summary>Full question</summary>

A logistics company operates a fleet management system. Each Vehicle has a registration number, type (truck, van, motorcycle), and current mileage. Vehicles are assigned to Routes, each defined by a list of Waypoints (latitude, longitude, sequence order). A Driver is assigned to exactly one vehicle at a time but can be reassigned. Each Trip records the driver, vehicle, route taken, departure time, arrival time, and cargo weight. The system tracks FuelLogs per vehicle (date, litres, cost, odometer reading) and generates MaintenanceAlerts when mileage thresholds are crossed.

Model this as a UML class diagram showing attributes, key methods, and relationships.

</details>

### Q2217 — Vantage Systems" Requirements Review

- **Certification:** TOPCIT  
- **Lesson:** Requirements Verification and Validation  
- **Used in exams:** Requirements Verification and Validation Quiz

<details><summary>Full question</summary>

"Vantage Systems" Requirements Review

Vantage Systems formalises the inspection of its requirements documents before they are baselined. Model the static structure of that process.

a) A requirements document has an ID, title, version and status, and contains one or more requirements. A requirement has no existence outside its document: deleting the document deletes them.
b) Every requirement has an ID, text and priority.
c) Authors and reviewers are both participants: each has a person ID, full name and e-mail. An author additionally has a department; a reviewer has a field of expertise. No one is ever simply a participant -- every participant is one or the other.
d) A document is reviewed in any number of review sessions over its life; a session reviews exactly one document and records the date and its outcome.
e) A session is attended by one or more reviewers. Reviewers exist independently of any session and continue to exist when it ends.
f) A session records the defects raised in it; a defect has no meaning apart from the session that raised it. Each defect is raised against exactly one requirement, and may be assigned to at most one author to fix.
g) Every session applies one or more checklist items, each stating a criterion and whether it was satisfied.

Tasks
1. Identify the classes and their attributes, with data types and visibility (+ public, - private, # protected).
2. Add at least two operations per class, with parameters and return types.
3. Draw the relationships with multiplicities at BOTH ends, choosing correctly between association, aggregation, composition and generalisation.
4. Justify in one sentence each: why Document-Requirement and Session-Defect are composition, but Session-Reviewer is only aggregation.
5. Which class is abstract, why should it never be instantiated, and what in requirement (c) tells you so?

</details>

### Q2243 — Lumen" Online Learning Platform

- **Certification:** TOPCIT  
- **Lesson:** Software Design Fundamentals  
- **Used in exams:** Software Design Fundamentals Quiz

<details><summary>Full question</summary>

"Lumen" Online Learning Platform

Lumen is designing a platform for university short courses. Model its static structure.

a) Students and instructors are both users: each has a user ID, e-mail and full name. A student additionally has an enrolment date and credits earned; an instructor has a staff number and a specialism. Nobody is only a user.
b) A course has an ID, title, credit value and a published flag. A course is built from one or more modules, and a module from one or more lessons. Neither a module nor a lesson has any meaning outside the course it belongs to: deleting a course deletes both.
c) A course is taught by one or more instructors, and an instructor may teach many courses. Instructors are employed by the university and remain on the system when a course is retired.
d) A student takes a course through an enrolment, which records the start date and a status. A student holds many enrolments over time; a course is taken through many enrolments.
e) A course is assessed by any number of assessments, each with a title and a pass mark. An assessment belongs to exactly one course and is removed with it.
f) A student makes submissions against an assessment. A submission records when it was submitted and its content; an assessment receives many submissions and a student makes many.

Tasks
1. Identify the classes and their attributes, with data types and visibility (+ public, - private, # protected).
2. Add at least two operations per class, with parameters and return types.
3. Draw the relationships with multiplicities at BOTH ends, choosing correctly between association, aggregation, composition and generalisation.
4. Justify in one sentence each: why Course-Module is composition but Instructor-Course is only aggregation.
5. Which class is abstract, why should it never be instantiated, and which sentence in requirement (a) tells you so?

</details>

### Q2253 — Arcus" Payment Processing - Layered Design

- **Certification:** TOPCIT  
- **Lesson:** Software Architecture and Patterns  
- **Used in exams:** Software Architecture and Patterns Quiz

<details><summary>Full question</summary>

"Arcus" Payment Processing - Layered Design

Arcus is a fintech startup building a payment service on a strict layered architecture. Model its static structure.

a) A request enters at the controller layer, which delegates to a service layer; the service layer persists through a repository and authorises through a gateway. Each layer uses the one below it and knows nothing of the one above.
b) Card and wallet gateways are both payment gateways: every gateway has a timeout and can authorise and capture. A card gateway additionally holds an acquirer URL and can tokenise a card; a wallet gateway holds an API key and can report a balance. A bare gateway is never used directly -- one of the two concrete kinds always is.
c) A payment has an ID, amount, currency and status, and consists of one or more payment lines. A line cannot exist apart from its payment.
d) A payment is received on behalf of exactly one merchant. Merchants have an ID, name and settlement account, and remain on the platform after their payments are archived.
e) Every payment records any number of audit entries, each with a timestamp and an action. Audit entries are deleted with the payment they belong to.

Tasks
1. Identify the classes and their attributes, with data types and visibility (+ public, - private, # protected).
2. Add at least two operations per class, with parameters and return types.
3. Draw the relationships with multiplicities at BOTH ends, and show the layer-to-layer relationships of requirement (a) as dependencies rather than associations.
4. Justify in one sentence each: why Payment-PaymentLine is composition, but Merchant-Payment is only aggregation.
5. Which class is abstract, why should it never be instantiated, and what would break in requirement (a) if the service layer depended on CardGateway directly?

</details>

### Q2423 — Data Link Layer - Frame Handling Class Model

- **Certification:** TOPCIT  
- **Lesson:** Data Link Layer  
- **Used in exams:** Data Link Layer Quiz

<details><summary>Full question</summary>

Data Link Layer - Frame Handling Class Model

You are modelling the classes a switch and its interfaces need in order to move frames across a link.

a) Every frame carries a frame ID, a source and destination MAC address, a payload and a frame check sequence, and can compute its FCS and report whether it is corrupt.
b) There are three kinds of frame and nothing is ever just a frame. A data frame adds a sequence number and payload length; an acknowledgement frame adds the sequence number it acknowledges; a control frame adds a control type.
c) A MAC address is six octets and can report whether it is the broadcast address and what its OUI is. A frame addresses exactly two MAC addresses -- source and destination.
d) A network interface has an ID, a hardware address, an MTU and a link state, and transmits any number of frames. Frames are destroyed once transmitted; interfaces are not.
e) An interface runs exactly one link protocol. A protocol has a window size and a timeout, and can transmit a frame and react to a timeout. A protocol is configured on the interface but exists in the protocol stack independently of it.
f) Stop-and-wait and go-back-N are both link protocols; a bare protocol is never used on its own. Stop-and-wait tracks how many frames are outstanding; go-back-N tracks a window base and a next sequence number.
g) A switch has an ID and a MAC table size, and maintains any number of MAC table entries. An entry pairs an address with a port number and an age, and is discarded when the switch is powered off.
h) A switch forwards through two or more network interfaces. Those interfaces are physical hardware and survive a switch being reconfigured.

Tasks
1. Identify the classes and their attributes, with data types and visibility (+ public, - private, # protected).
2. Add at least two operations per class, with parameters and return types.
3. Draw the relationships with multiplicities at BOTH ends, choosing correctly between association, aggregation, composition and generalisation.
4. Justify in one sentence each: why Switch-MacTableEntry is composition, but Switch-NetworkInterface is only aggregation.
5. Two classes are abstract. Name both, quote the sentence in the requirements that makes each one abstract, and state what would go wrong if go-back-N did not override transmit().

</details>

### Q2579 — Fenland Water" - IoT Device Class Model

- **Certification:** TOPCIT  
- **Lesson:** Internet of Things Standards  
- **Used in exams:** Internet of Things Standards Quiz

<details><summary>Full question</summary>

"Fenland Water" - IoT Device Class Model

Fenland's field estate mixes sensors, actuators and gateways speaking different protocols. Model the classes.

a) Every device has a device ID, firmware version, last-seen timestamp and battery percentage, and can report whether it is online and describe itself.
b) There are three kinds of device and nothing is ever just a device. A sensor adds a unit and a sample period; an actuator adds a current state and a safe state; a gateway adds an uplink type and a queue depth.
c) A sensor produces any number of readings. A reading has a timestamp, a value and a quality flag. Readings are meaningless without the sensor that took them and are purged with it.
d) An actuator executes any number of commands. A command has an ID, an issue time and a payload. Commands are issued centrally and are retained for audit after the actuator is replaced.
e) A site has an ID, name and grid reference and hosts one or more devices. Devices are moved between sites, so they are not destroyed when a site closes.
f) A gateway relays for one or more devices. Those devices exist whether or not the gateway does.
g) A gateway speaks one or more protocols. A protocol has a name and a port number and can encode a reading and decode bytes.
h) MQTT and CoAP are both protocols; a bare protocol is never instantiated. MQTT adds a QoS level, CoAP a block size. Both provide their own encoding.

Tasks
1. Identify the classes and their attributes, with data types and visibility (+ public, - private, # protected).
2. Add at least two operations per class, with parameters and return types.
3. Draw the relationships with multiplicities at BOTH ends, choosing correctly between association, aggregation, composition and generalisation.
4. Justify in one sentence each: why Sensor-Reading is composition, but Site-Device and Gateway-Device are only aggregation.
5. Two classes are abstract. Name both, quote the sentence that makes each one abstract, and state what would go wrong if MqttProtocol did not override encode().

</details>

### Q2684 — Brightwell Group" - Structured Problem Solving

- **Certification:** TOPCIT  
- **Lesson:** Business Problem Solving  
- **Used in exams:** Business Problem Solving Quiz

<details><summary>Full question</summary>

"Brightwell Group" - Structured Problem Solving

Brightwell wants problem solving to be a recorded method rather than a meeting. Model the classes.

a) A problem has an ID, a statement, a date raised and a severity, and can report whether it is open and how old it is.
b) A problem is analysed by one or more analyses. An analysis records the date performed and a conclusion, and has no meaning apart from its problem.
c) An analysis uses exactly one analysis technique. A technique has a name and a minimum number of inputs, and can be applied to a problem and judged suitable for one.
d) Fishbone, five-whys and Pareto are all analysis techniques, and a bare technique is never instantiated. Fishbone adds its categories, five-whys the depth reached, Pareto a cumulative cutoff. Each provides its own apply().
e) An analysis identifies one or more causes. A cause has a description, a root-cause flag and an evidence reference, and is deleted with its analysis.
f) A cause may contribute to another cause, forming a chain. A root cause contributes to none.
g) A cause is addressed by any number of solutions, each with a description and an estimated cost.
h) A solution is delivered by one or more action items, each with a description, a due date and a status. Action items are deleted with their solution.
i) A team member owns any number of action items. Team members have a name and a role, and stay on the system after their actions are closed.

Tasks
1. Identify the classes and their attributes, with data types and visibility (+ public, - private, # protected).
2. Add at least two operations per class, with parameters and return types.
3. Draw the relationships with multiplicities at BOTH ends, choosing correctly between association, aggregation, composition and generalisation.
4. Requirement (f) is a relationship from a class to ITSELF. Draw it with the cardinality that lets a root cause have no parent.
5. Justify in one sentence each: why Solution-ActionItem is composition but TeamMember-ActionItem is only aggregation. Then name the abstract class, and state what would go wrong if FiveWhysAnalysis did not override apply().

</details>

### Q2917 — Pellworth Bank" - Security Principles Class Model

- **Certification:** TOPCIT  
- **Lesson:** Information Security Principles  
- **Used in exams:** none (question bank only)

<details><summary>Full question</summary>

"Pellworth Bank" - Security Principles Class Model

Pellworth's code treats a human login, a service account and a device as three unrelated things, so an access check is written three times. Model the classes so it is written once.

a) Every subject has a subject ID, a display name and an active flag, and can authenticate with a credential and describe itself.
b) There are three kinds of subject and nothing is ever just a subject. A human user adds an employee number and a last password change date; a service account adds an owning team and a rotation period; a device identity adds a serial and an attestation reference. Each provides its own authenticate().
c) Every credential has an ID, an issue date and an expiry date, and can report whether it is expired and how strong it is.
d) Password credentials and certificate credentials are both credentials, and a bare credential is never instantiated. A password credential adds a hash and an algorithm; a certificate credential adds a serial and an issuer DN.
e) A subject holds one or more credentials. A credential has no meaning apart from its subject and is destroyed with it.
f) An asset has an ID, a name and a classification, and can report whether it must be encrypted and how long it is retained.
g) An asset is protected by one or more permissions, each with an action and a scope. Permissions are defined centrally and survive the asset being archived.
h) A subject is given any number of grants. Each conveys exactly one permission and records when it was granted and when it expires. Grants are deleted with the subject.
i) A subject generates any number of audit events, each recording a timestamp and an outcome, and each concerning exactly one asset.

Tasks
1. Identify the classes and their attributes, with data types and visibility (+ public, - private, # protected).
2. Add at least two operations per class, with parameters and return types.
3. Draw the relationships with multiplicities at BOTH ends, choosing correctly between association, aggregation, composition and generalisation.
4. Justify in one sentence each: why Subject-Credential and Subject-Grant are composition, but Asset-Permission is only aggregation.
5. Two classes are abstract. Name both, quote the sentence that makes each one abstract, and explain in one sentence how requirement (b) lets the access check in the opening paragraph be written once instead of three times.

</details>

### Q3099 — Verity Ventures" - Business Plan Class Model

- **Certification:** TOPCIT  
- **Lesson:** Business Plan Development  
- **Used in exams:** Business Proposals and RFI/RFP Exam

<details><summary>Full question</summary>

"Verity Ventures" - Business Plan Class Model

Verity reviews business plans for investors. Every plan models subscription and one-off revenue with different code, so the two cannot be totalled. Model the classes so they can.

a) A business plan has an ID, a title, a horizon in years and a status, and can report its break-even month and whether it is fundable.
b) A plan is written as one or more plan sections, each with a heading and an ordinal. A section has no meaning apart from its plan.
c) A plan is supported by one or more financial forecasts, each with a preparation date, able to report net margin and cumulative cash for a given month. Forecasts are deleted with the plan.
d) Every revenue stream has an ID, a name and the month it starts in, and can report its revenue for a given month.
e) Subscription and one-off streams are both revenue streams, and a bare stream is never instantiated. A subscription stream adds a monthly price and a churn rate; a one-off stream adds a unit price and units per month. Each provides its own monthlyRevenue().
f) A forecast projects one or more revenue streams. A stream is meaningless apart from its forecast.
g) Every cost line has an ID and a name and can report its cost for a given month and whether it is discretionary.
h) Fixed and variable costs are both cost lines, and a bare cost line is never instantiated. A fixed cost adds a monthly amount; a variable cost adds a rate per unit.
i) A forecast absorbs one or more cost lines, and rests on one or more assumptions, each with a statement and a confidence rating. Both are deleted with the forecast.
j) A plan carries any number of risks, each with a description, likelihood and impact.

Tasks
1. Identify the classes and their attributes, with data types and visibility (+ public, - private, # protected).
2. Add at least two operations per class, with parameters and return types.
3. Draw the relationships with multiplicities at BOTH ends, choosing correctly between association, aggregation, composition and generalisation.
4. Two classes are abstract. Name both, quote the sentence that makes each one abstract, and explain in one sentence how requirements (d) and (e) let the forecast total the two revenue kinds without knowing which is which.
5. Requirement (c) makes the forecast a composition of the plan. Justify that in one sentence, and state what would be wrong with a forecast that outlived the plan it was written for.

</details>

### Q3109 — Ravensworth Consulting" - Project Class Model

- **Certification:** TOPCIT  
- **Lesson:** Project Management Fundamentals  
- **Used in exams:** Project Planning and Strategy Exam

<details><summary>Full question</summary>

"Ravensworth Consulting" - Project Class Model

Ravensworth's planning tool treats summary tasks, work packages and milestones as three unrelated types, so a rollup has to be written three times. Model the classes so it is written once.

a) A project has an ID, a name, a start date and a budget, and can report its percentage complete and whether it is over budget.
b) Every work element has an ID, a name and planned days, and can report its duration and percentage complete.
c) Summary tasks, work packages and milestones are all work elements, and a bare work element is never instantiated. A summary task adds a rollup method; a work package adds a deliverable reference and a percentage done; a milestone adds a due date and an achieved date. Each provides its own duration().
d) A project is planned as one or more work elements. An element has no meaning apart from its project.
e) A summary task rolls up one or more work elements -- which may themselves be summary tasks, to any depth. Those children are destroyed with their parent.
f) A work element is linked by any number of dependencies, each with a link type and a lag in days.
g) Every resource has an ID, a name and a cost per day, and can report its availability on a date.
h) People and equipment are both resources, and a bare resource is never instantiated. A person adds a grade and skills; equipment adds an asset tag and a service date.
i) A work package is staffed by any number of assignments, each with an allocation percentage and a date range. Assignments are deleted with the work package.
j) A resource supplies any number of assignments. Resources exist on the books whether or not they are assigned.
k) A project carries any number of risks, each with a description, likelihood and impact.

Tasks
1. Identify the classes and their attributes, with data types and visibility (+ public, - private, # protected).
2. Add at least two operations per class, with parameters and return types.
3. Draw the relationships with multiplicities at BOTH ends, choosing correctly between association, aggregation, composition and generalisation.
4. Requirement (e) makes a summary task contain work elements, which may themselves be summary tasks. Draw that, and name the design pattern it implements.
5. Justify in one sentence each: why WorkPackage-Assignment is composition but Resource-Assignment is only aggregation. Then name the two abstract classes, and explain how requirement (c) turns three rollups into one.

</details>


## Component Diagram (21)

### Q2320 — Kestrel Retail" Storefront Component Architecture

- **Certification:** TOPCIT  
- **Lesson:** Software Architecture and Patterns  
- **Used in exams:** Software Design and Architecture Exam

<details><summary>Full question</summary>

"Kestrel Retail" Storefront Component Architecture

Kestrel is splitting a retail monolith into services and needs the component structure agreed before any code is written.

a) Two front ends exist: a web storefront UI and a mobile app backend-for-frontend. Neither talks to a service directly; both go through an API gateway, which is the only component they know about.
b) The gateway provides the IStorefront interface to those two front ends.
c) The gateway depends on three services: a catalog service (ICatalogQuery), a basket service (IBasket) and an order service (IOrderPlacement). Each service provides exactly that one interface to the gateway.
d) The catalog service checks stock through the inventory service's IStockCheck interface.
e) The basket service prices its lines through the catalog service's ICatalogQuery interface -- the same interface the gateway uses, not a second one.
f) The order service authorises payment through the payment service (IPaymentAuth), reserves stock through IStockCheck, tells the notification service to send a dispatch notice (IDispatchNotice), and persists to its own order database. No other component may reach that database.
g) No service calls the gateway, and no service calls a front end.

Tasks
1. Draw every component in requirements (a) to (f) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (e) says the basket service reuses ICatalogQuery. Show that one interface serving two consumers, and explain in one sentence why defining a second interface for the same operation would be a design fault.
5. Requirements (f) and (g) constrain the direction of dependencies. State what architectural property they are protecting, and identify which single component would become a bottleneck if requirement (g) were relaxed.

</details>

### Q2434 — Halden Campus" Core Network Services

- **Certification:** TOPCIT  
- **Lesson:** Network Service Architecture  
- **Used in exams:** Network Service Architecture Quiz

<details><summary>Full question</summary>

"Halden Campus" Core Network Services

Halden is rebuilding the services every device on campus depends on before it can do anything else. Agree the component architecture.

a) A client host obtains its address configuration through a DHCP relay agent on its local subnet; the relay forwards to the central DHCP server. The client never contacts the DHCP server directly.
b) The DHCP server provides ILeaseAllocation, and the relay presents that same interface onward to clients.
c) The DHCP server reads its address pools from an IPAM database. No other component may read that database.
d) A client resolves names through a DNS resolver, which provides INameResolution. The resolver in turn queries the authoritative DNS servers through IZoneQuery.
e) When the DHCP server issues a lease it registers the name through the same IZoneQuery interface the resolver uses.
f) A client synchronises its clock through the NTP server's ITimeSync interface and authenticates through the RADIUS server's IAuthentication interface.
g) The RADIUS server looks users up in the directory service through IIdentityLookup.
h) The DHCP server, DNS resolver, RADIUS server and NTP server all send events to the syslog collector through ILogIngest. Clients do not.
i) No server component depends on a client host.

Tasks
1. Draw every component in requirements (a) to (h) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirements (b) and (e) each involve one interface serving two consumers. Show both, and explain in one sentence what the relay agent in requirement (a) buys you that a direct client-to-server dependency would not.
5. Requirement (i) fixes the direction of every dependency. State the architectural property it protects, and name the single component whose failure would prevent a new client from obtaining an address at all.

</details>

### Q2447 — Fenland Water" Machine-to-Machine Telemetry

- **Certification:** TOPCIT  
- **Lesson:** Machine-to-Machine Communications  
- **Used in exams:** Machine-to-Machine Communications Quiz

<details><summary>Full question</summary>

"Fenland Water" Machine-to-Machine Telemetry

Fenland monitors thousands of unattended water sites over a link that is often down. Agree the component architecture.

a) A field sensor is a constrained device on a serial link. It talks only to the edge gateway on its site and knows nothing else in the system.
b) The edge gateway queues readings through a store-and-forward buffer so that nothing is lost while the uplink is down. The gateway is the only component that uses that buffer.
c) The gateway publishes readings to the MQTT broker through ITelemetryPublish. It never writes to a database directly.
d) The telemetry ingest service subscribes to the broker through ITelemetrySubscribe and writes to the time-series store through ISeriesWrite. No other component may write to that store.
e) Ingest evaluates each reading against the rule engine, which raises alerts through the alert dispatcher's IAlertDispatch interface.
f) Both the gateway and the ingest service verify device identity through the device registry's IDeviceIdentity interface -- the same interface, not two.
g) The gateway pulls firmware updates through the firmware service's IFirmwareDownload interface. The firmware service never pushes to a gateway.
h) No component depends on a field sensor, and the broker depends on nothing.

Tasks
1. Draw every component in requirements (a) to (g) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (b) exists because the uplink is unreliable. Explain in one sentence what the buffer changes about the failure behaviour, and what a sensor reading's fate would be without it.
5. Requirement (g) says pull, not push. State in one sentence why a pull model is the right choice for thousands of intermittently connected devices behind NAT, and identify the one component in your diagram that becomes a single point of failure for all telemetry.

</details>

### Q2470 — Halden Campus" - Network Service Quality Records

- **Certification:** TOPCIT  
- **Lesson:** Network Service Architecture  
- **Used in exams:** Network Protocols and Services Exam

<details><summary>Full question</summary>

"Halden Campus" - Network Service Quality Records

Halden must prove it meets its service commitments. Model the data behind that.

a) A network service has a name, protocol and default port.
b) A service is offered at one or more service levels, each naming a tier with a target latency and a target uptime. A service level has no meaning apart from its service.
c) A traffic class has a name, a DSCP value and a priority. Traffic classes are defined centrally and outlive any service that uses them.
d) A service is classified by one or more traffic classes, and a class may classify many services. Each such binding records the date it was applied.
e) A network device has a hostname and a role, and is hosted at exactly one site. Devices are moved between sites, so a device is not destroyed with a site.
f) A device applies any number of QoS policies. Each policy enforces exactly one traffic class with a bandwidth and burst allowance, and is removed when the device is decommissioned.
g) A device has one or more interfaces, each with a name and a speed. An interface cannot exist apart from its device.
h) An interface is sampled as any number of measurements, each recording a timestamp, a latency and a loss percentage, and each assessed against exactly one service level.
i) A measurement raises at most one SLA breach, recording when it was detected and a severity. A breach is deleted with the measurement that produced it.

Tasks
1. Identify the entities and their attributes, marking primary keys (PK) and foreign keys (FK).
2. Draw every relationship with its cardinality at BOTH ends.
3. Requirement (d) is many-to-many. Resolve it into an associative entity and name the attribute that justifies it.
4. Justify in one sentence each why Service-ServiceLevel and Device-Interface are identifying relationships, while Site-Device is not.
5. Requirement (i) says "at most one". Show the 0..1 cardinality, and explain in one sentence why a breach hangs off a measurement rather than off the service level directly.

</details>

### Q2501 — Arcus Payments" - Ports and Adapters Architecture

- **Certification:** TOPCIT  
- **Lesson:** Software Architecture and Patterns  
- **Used in exams:** Software Development Exam

<details><summary>Full question</summary>

"Arcus Payments" - Ports and Adapters Architecture

Arcus wants its payment logic testable without a database, a bank or a mail server. Model the component structure that makes that possible.

a) The payment domain core holds all the business logic. It provides one inbound interface, IPaymentUseCase.
b) Three inbound adapters drive the core through that one interface: a REST adapter, a batch file adapter and a message adapter. None of them contains business logic, and none knows about any other.
c) The core defines three outbound ports: IPaymentRepository for storage, IAuthorisationPort for card authorisation and INotificationPort for customer notification.
d) Each outbound port has exactly one adapter implementing it: a JPA persistence adapter, an acquirer HTTP adapter and an e-mail notify adapter.
e) The persistence adapter talks to the payment database, the acquirer adapter to the acquirer bank, and the notify adapter to an SMTP relay. The core talks to none of those three directly.
f) The core depends on nothing outside itself except the three port interfaces that it declares.
g) No adapter depends on another adapter.

Tasks
1. Draw every component in requirements (a) to (e) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (f) is the point of the whole architecture. Explain in one sentence how the core can call the database while depending only on an interface it declares itself, and name the principle that describes it.
5. Requirement (b) has three adapters on one interface. State what you would have to change to add a scheduled-job adapter, and what you would have to change in the CORE -- then say what that answer tells you about the design.

</details>

### Q2527 — Meridian Logistics" - Event-Driven Architecture

- **Certification:** TOPCIT  
- **Lesson:** Software Architecture and Patterns  
- **Used in exams:** Software Development Exam

<details><summary>Full question</summary>

"Meridian Logistics" - Event-Driven Architecture

Meridian's shipment tracking is read far more often than it is written, and three departments need to react to the same shipment events without knowing about each other. Model the component architecture.

a) A shipment API accepts changes and passes them to a command handler through ICommandSubmit. The API contains no business logic.
b) The command handler appends events to the event store through IEventAppend. It never writes to any other store.
c) The event store publishes every appended event to the event bus. The bus provides IEventSubscribe.
d) Three subscribers consume events through that one interface: a read-model projector, a tracking notifier and a billing integrator. None of the three knows that the others exist.
e) The projector writes to the read-model store through IReadModelWrite. No other component may write to it.
f) A separate shipment query API reads from the read-model store. It never touches the event store.
g) Any subscriber that fails to process an event sends it to the dead-letter handler through IDeadLetter.
h) No subscriber depends on the command handler, and nothing depends on a subscriber.

Tasks
1. Draw every component in requirements (a) to (g) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (d) has three subscribers on one interface. Explain in one sentence what adding a fourth department would cost, and which existing component you would have to modify.
5. Requirements (e) and (f) separate the write path from the read path. State one thing this design buys you and one thing it costs you, and name the consistency property that is given up.

</details>

### Q2592 — Arcus Payments" - Security Architecture

- **Certification:** TOPCIT  
- **Lesson:** Information Security Principles  
- **Used in exams:** Information Security Principles Quiz

<details><summary>Full question</summary>

"Arcus Payments" - Security Architecture

An assessor has told Arcus that authentication, authorisation and audit are scattered through the application code. Model an architecture in which each is a component with one job.

a) A client application reaches the system only through a web application firewall, which filters traffic and passes it to the API gateway. Nothing bypasses the firewall.
b) The gateway authenticates every request through the identity provider's IAuthenticate interface. No other component authenticates.
c) The gateway and the application service both ask the policy decision point for an authorisation decision through IAuthorisationDecision. That is the only place an access rule is evaluated.
d) The gateway routes authorised requests to the application service.
e) The application service retrieves credentials at run time from the secrets manager through ISecretRetrieval. No component holds a secret in its own configuration.
f) The application service encrypts and decrypts data through the key management service's IEncryptDecrypt interface. No component implements its own cryptography.
g) The gateway, the application service and the identity provider all write to the audit log service through IAuditWrite.
h) The audit log service feeds the SIEM platform through IEventFeed. The SIEM depends on nothing else, and nothing depends on the SIEM.

Tasks
1. Draw every component in requirements (a) to (h) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (c) has two consumers of one decision point. Explain in one sentence what centralising the decision buys you, and name the two roles in the policy-enforcement model that the gateway and the decision point are playing.
5. Requirements (e) and (f) both say "not in the component". State in one sentence what each is protecting against, and identify which single component becomes the highest-value target in this architecture.

</details>

### Q2626 — Sentinel Insurance" - ISMS Tooling Architecture

- **Certification:** TOPCIT  
- **Lesson:** ISMS Frameworks and Standards  
- **Used in exams:** ISMS Frameworks and Standards Quiz

<details><summary>Full question</summary>

"Sentinel Insurance" - ISMS Tooling Architecture

Sentinel is certifying its information security management system and needs the supporting tools to fit together, so that an auditor can trace a control from policy to evidence.

a) Staff reach the system through one ISMS portal. No other component has a user interface.
b) The policy registry provides IPolicyLookup. The control catalogue provides IControlLookup and is the single source of control definitions.
c) The statement of applicability decides which catalogued controls apply. It provides IApplicability and depends on IControlLookup.
d) The risk register provides IRiskQuery and also depends on IControlLookup -- the same interface the statement of applicability uses, not a second one.
e) The portal depends on IPolicyLookup, IApplicability and IRiskQuery. It depends on nothing else.
f) The evidence store provides IEvidenceStore. Both the statement of applicability and the internal audit tool write evidence through it.
g) The internal audit tool also depends on IApplicability, and raises findings through the corrective action tracker's ICorrectiveAction interface.
h) The awareness training component depends only on IPolicyLookup.
i) Management reporting depends on IRiskQuery and ICorrectiveAction, and nothing depends on management reporting.

Tasks
1. Draw every component in requirements (a) to (i) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (b) says the catalogue is the single source of control definitions. Explain in one sentence what an auditor would find if the risk register kept its own copy of the control list.
5. Trace on your diagram the path an auditor follows from a policy to the evidence that a control is operating, naming every component crossed. State which single component's failure would break that trace.

</details>

### Q2660 — Brightwell Group" - IT Service Management Architecture

- **Certification:** TOPCIT  
- **Lesson:** IT Business Operations  
- **Used in exams:** IT Business Operations Quiz

<details><summary>Full question</summary>

"Brightwell Group" - IT Service Management Architecture

Brightwell's incident, problem and change teams each keep their own list of servers, and the three lists disagree. Model an architecture in which they do not.

a) Users raise tickets only through the self-service portal, which depends on the service desk core's ITicketLifecycle interface.
b) The service desk routes tickets to incident management, and looks services up in the service catalogue through IServiceLookup.
c) The configuration management database provides IConfigItemQuery and is the single source of configuration truth. No other component holds its own copy of the configuration data.
d) Incident management, problem management, change management and release management all depend on that one IConfigItemQuery interface.
e) Incident management escalates recurring incidents to problem management.
f) Problem management requests changes through change management's IChangeApproval interface.
g) Change management schedules approved changes through release management.
h) Incident management evaluates breaches through the SLA monitor's ISlaEvaluation interface.
i) Incident management and change management both notify stakeholders through the notification service's INotify interface. The notification service depends on nothing.

Tasks
1. Draw every component in requirements (a) to (i) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (d) has four consumers of one interface. Explain in one sentence what problem from the opening paragraph that solves, and what would happen to an incident record if each team kept its own configuration list.
5. Requirements (e), (f) and (g) form a chain. Trace it on your diagram, naming every component crossed, and state in one sentence what distinguishes an incident from a problem in this design.

</details>

### Q2709 — Calder Industrial" - SCADA Architecture

- **Certification:** TOPCIT  
- **Lesson:** Machine-to-Machine Communications  
- **Used in exams:** Emerging Network Technologies Exam

<details><summary>Full question</summary>

"Calder Industrial" - SCADA Architecture

Calder runs plant equipment that speaks two different field protocols, and the business wants production figures without being able to reach the plant network. Model the component architecture.

a) PLC controllers speak Modbus and remote terminal units speak DNP3. Neither knows anything else in the system.
b) One protocol poller talks to both device kinds. It is the only component that touches field equipment.
c) The poller normalises everything through the protocol translator, so that no component above it knows which field protocol a value came from.
d) The translator provides ITagRead to the SCADA core.
e) The SCADA core writes to the historian through IHistorianWrite. No other component writes to the historian.
f) The SCADA core provides IProcessState. Both the operator HMI and the alarm server read process state through that one interface.
g) The operator HMI receives alarms through the alarm server's IAlarmNotify interface.
h) The SCADA core exports to the data diode gateway through IOneWayExport. Enterprise reporting reads from the gateway through that same interface.
i) Nothing on the enterprise side may reach any component below the gateway, and no component below the gateway depends on enterprise reporting.

Tasks
1. Draw every component in requirements (a) to (h) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (c) is the reason the translator exists. Explain in one sentence what adding a third field protocol would cost in this design, and which components would have to change.
5. Requirement (i) is a security boundary. Mark it on your diagram, state in one sentence what property the one-way gateway enforces, and name the one thing enterprise reporting can never do as a result.

</details>

### Q2735 — Pellworth Bank" - Defence in Depth

- **Certification:** TOPCIT  
- **Lesson:** Information Security Principles  
- **Used in exams:** Information Security Fundamentals Exam

<details><summary>Full question</summary>

"Pellworth Bank" - Defence in Depth

Pellworth's current network is flat: anything that reaches the web server can reach the database. Model a layered architecture in which that is not true.

a) An internet client reaches the bank only through the edge firewall, which provides IFilteredTraffic. Nothing bypasses it.
b) The edge firewall passes traffic to the intrusion prevention system for inspection.
c) The IPS provides IInspectedTraffic to the reverse proxy. The reverse proxy is the only component that terminates a client connection.
d) The reverse proxy reaches the application tier through IApplicationService. An internet client never reaches the application tier directly.
e) The application tier reaches the database tier only by traversing the internal firewall, which provides IDataAccess. The application tier does not connect to the database directly.
f) Administrators reach internal systems only through the admin bastion, which requires strong authentication from the MFA service through IStrongAuth.
g) The bastion also traverses the internal firewall; it is not exempt from it.
h) Every control component -- the edge firewall, the IPS, the reverse proxy, the application tier, the internal firewall and the bastion -- feeds the security monitoring platform through ITelemetryFeed.
i) Nothing depends on security monitoring, and the database tier depends on nothing.

Tasks
1. Draw every component in requirements (a) to (h) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Mark the security zones on your diagram, and count the controls an internet client must pass to reach the database tier. State in one sentence what the flat network in the opening paragraph counted instead.
5. Requirement (g) says the bastion is not exempt from the internal firewall. Explain in one sentence what attack that closes, and name the principle that requirement (h) is implementing.

</details>

### Q2786 — Larkspur Foods" - ERP Integration Architecture

- **Certification:** TOPCIT  
- **Lesson:** IT Business Operations  
- **Used in exams:** IT Business Fundamentals Exam

<details><summary>Full question</summary>

"Larkspur Foods" - ERP Integration Architecture

Larkspur's web shop and its tills each talk directly to four ERP modules, so every ERP upgrade breaks both. Model an architecture that removes those direct links.

a) The e-commerce front end and the store point-of-sale both send traffic through one integration bus, which provides IMessageRoute. Neither front end knows any ERP module exists.
b) The bus routes sales traffic to the ERP sales module through ISalesOrder and stock queries to the ERP inventory module through IStockPosition.
c) The bus looks up customers and products in the master data service through IMasterDataLookup. That service is the only source of master data.
d) The ERP sales, inventory and HR modules all post to the ERP finance module through IPostingEntry. Finance is the only module that holds the ledger.
e) The ERP inventory module instructs the warehouse system through IPickAndPack.
f) Business intelligence reads from the finance and sales modules. Nothing depends on business intelligence.
g) No ERP module depends on the bus or on a front end.

Tasks
1. Draw every component in requirements (a) to (f) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Count the dependencies the front ends have in your diagram, and say what that count would have been in the architecture described in the opening paragraph. State in one sentence what the bus has bought.
5. Requirement (d) has three consumers of one interface. Explain in one sentence why the ledger lives in one module, and what would go wrong in the accounts if each module posted its own.

</details>

### Q2858 — Halden Campus" - Physical Layer Architecture

- **Certification:** TOPCIT  
- **Lesson:** Physical Layer and Media  
- **Used in exams:** Network Fundamentals and OSI Model Exam; Understanding of Network Exam

<details><summary>Full question</summary>

"Halden Campus" - Physical Layer Architecture

Halden runs copper to the desk and fibre between buildings, and wants a host to be unaware of which it is attached to. Model the component architecture.

a) A host NIC depends on one media-independent interface only. It never knows whether the medium is copper or fibre.
b) The media adapter provides IMediaIndependent to the host and hides the medium below it.
c) The copper transceiver provides IPhysicalSignal and the fibre transceiver provides IOpticalSignal. The media adapter depends on both.
d) Both transceivers terminate at a patch panel port through ILinkTermination.
e) The patch panel port presents that same ILinkTermination interface onward to the access switch port.
f) A PoE injector supplies the patch panel port through IInlinePower. Nothing else supplies power.
g) A cable certifier certifies the patch panel port, and an optical monitor reads diagnostics from the fibre transceiver. Neither is in the traffic path.
h) The certifier and the optical monitor both write to plant records through IPlantRecord. Nothing depends on plant records.
i) No component below the media adapter depends on the host NIC.

Tasks
1. Draw every component in requirements (a) to (h) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (b) is the reason the media adapter exists. Explain in one sentence what adding a third medium would cost in this design, and which components would have to change.
5. Requirement (g) says neither tool is in the traffic path. Mark them on your diagram, and state in one sentence why keeping test equipment out of the traffic path matters at the physical layer.

</details>

### Q2860 — Fenland Water" - IoT Standards Stack

- **Certification:** TOPCIT  
- **Lesson:** Internet of Things Standards  
- **Used in exams:** Understanding of Network Exam

<details><summary>Full question</summary>

"Fenland Water" - IoT Standards Stack

Fenland's field devices are battery powered and cannot run a full IP stack, but a cloud application must still address them individually. Model the component architecture that reconciles that.

a) A constrained sensor sends over a low-power radio through IRadioLink. It knows nothing above the radio.
b) The 6LoWPAN adapter provides IIpv6Datagram, compressing IPv6 so it fits the radio's frame size. The radio depends on it.
c) A mesh router provides IMeshForward. The adapter forwards through it, and the router forwards on to the border router through that same interface.
d) The border router is the only component that faces the wider network.
e) The sensor accesses application resources through the CoAP endpoint's IResourceAccess interface.
f) The CoAP endpoint secures its traffic through the DTLS component's ISecureChannel interface. No component implements its own transport security.
g) The CoAP endpoint registers and finds resources through the resource directory's IResourceDiscovery interface.
h) An HTTP-to-CoAP proxy consumes IResourceAccess -- the same interface the sensor uses -- and the cloud application talks plain HTTP to that proxy. The cloud application never speaks CoAP.
i) No component depends on a component above it in this stack.

Tasks
1. Draw every component in requirements (a) to (h) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (h) has two consumers of IResourceAccess. Explain in one sentence what the proxy buys the cloud application, and what would have to change in the cloud application if the proxy were removed.
5. Requirement (b) exists because of a frame-size limit. State in one sentence what 6LoWPAN does to make IPv6 fit, and what the opening paragraph's "individually addressable" requirement would cost without it.

</details>

### Q2862 — Calder Industrial" - Edge Analytics Pipeline

- **Certification:** TOPCIT  
- **Lesson:** Machine-to-Machine Communications  
- **Used in exams:** Understanding of Network Exam

<details><summary>Full question</summary>

"Calder Industrial" - Edge Analytics Pipeline

Calder's plant link drops for hours at a time, and a machine fault must raise an alarm within a second regardless. Model the component architecture.

a) The machine controller provides ITagStream. The edge collector is the only component that reads from it.
b) The collector passes readings to the sampling filter, which provides ISampledStream and reduces the data rate before anything downstream sees it.
c) Edge inference consumes ISampledStream and evaluates the model locally.
d) Edge inference raises alarms directly to the local alarm panel through IInferenceResult. That path does not involve the cloud.
e) Edge inference writes results to the local ring buffer through IBufferWrite. The buffer holds data while the link is down.
f) The cloud sync agent reads from that same IBufferWrite component and forwards to cloud ingest through ITelemetryIngest.
g) The model distributor fetches models from the model registry through IModelFetch and deploys them to edge inference. Edge inference never contacts the registry itself.
h) No component at the edge depends on cloud ingest, and no cloud component depends on the machine controller.

Tasks
1. Draw every component in requirements (a) to (g) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (d) is what meets the one-second alarm target. Trace that path on your diagram, name every component on it, and state in one sentence why routing the alarm through the cloud would fail the target.
5. Requirement (e) is what survives the link outage. Explain in one sentence what the ring buffer does when it fills before the link returns, and what design decision that forces.

</details>

### Q2882 — Halden Campus" - Highly Available Service

- **Certification:** TOPCIT  
- **Lesson:** Network Service Architecture  
- **Used in exams:** Understanding of Network Exam

<details><summary>Full question</summary>

"Halden Campus" - Highly Available Service

Halden's student portal goes down whenever the single application server restarts. Model an architecture that survives losing a server, and then a whole site.

a) A campus client reaches only the global load balancer, which provides ISiteSelection.
b) The global load balancer distributes across two site load balancers, A and B, both providing IRequestDistribution.
c) Each site load balancer serves its own application server pool through IApplicationService. A site load balancer never reaches the other site's pool.
d) Both pools use one shared cache through ICacheAccess.
e) All writes from both pools go to the single database primary through IWriteAccess. There is exactly one primary.
f) Reads may go to the database replica through IReadAccess. The primary replicates to the replica.
g) A health probe probes both application pools and reports to the global load balancer, which stops sending traffic to an unhealthy site.
h) No application pool depends on a load balancer, and nothing depends on the health probe.

Tasks
1. Draw every component in requirements (a) to (g) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (e) says exactly one primary. Mark it on your diagram as the single point of failure, and explain in one sentence why the design accepts one here but not in the application tier.
5. Work through requirement (g): a server in pool A fails, then the whole of site A fails. State which component detects each, and what the client experiences in each case.

</details>

### Q2884 — Fenland Water" - Device Provisioning and Lifecycle

- **Certification:** TOPCIT  
- **Lesson:** Machine-to-Machine Communications  
- **Used in exams:** TOPCIT Mock Exam; Understanding of Network Exam

<details><summary>Full question</summary>

"Fenland Water" - Device Provisioning and Lifecycle

Fenland ships devices to sites with no credentials on them, and must be able to cut a stolen device off the network. Model the component architecture.

a) An unprovisioned device holds no credential. It contacts the bootstrap service through IBootstrapEnrol and nothing else.
b) The bootstrap service obtains a device certificate from the certificate authority through ICertificateIssue. No other component issues certificates.
c) The bootstrap service registers the device with the device registry through IDeviceIdentity, and reads the applicable rules from the provisioning policy through IPolicyLookup.
d) The bootstrap service records every enrolment to the provisioning audit component.
e) Once enrolled, the device fetches its settings from the configuration service through IConfigFetch and its firmware through the firmware service's IFirmwareDownload interface.
f) The device publishes telemetry to the telemetry broker. The broker verifies the device through the registry's IDeviceIdentity interface -- the same one the bootstrap service used.
g) The broker and the certificate authority both check the revocation list through IRevocationCheck.
h) No component depends on a device, and nothing depends on the provisioning audit.

Tasks
1. Draw every component in requirements (a) to (g) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (a) says the device holds no credential before enrolment. Explain in one sentence what the bootstrap service must therefore use to decide the device is genuine, and why that is the weakest point in the design.
5. Answer the second problem in the opening paragraph: trace on your diagram what happens when a stolen device is revoked, naming every component involved, and state which single component stops its telemetry.

</details>

### Q2899 — Pellworth Bank" - Governance, Risk and Compliance Platform

- **Certification:** TOPCIT  
- **Lesson:** ISMS Frameworks and Standards  
- **Used in exams:** Understanding of Security Exam

<details><summary>Full question</summary>

"Pellworth Bank" - Governance, Risk and Compliance Platform

Pellworth is assessed against three overlapping standards, and currently tests the same control three times because each standard names it differently. Model an architecture that tests it once.

a) Staff reach the system only through the GRC portal. No other component has a user interface.
b) The framework library provides IFrameworkLookup and holds each standard's clauses under that standard's own references.
c) The control mapper provides IControlMapping and depends on IFrameworkLookup. It maps one internal control to the clauses of every framework that requires it.
d) The risk module provides IRiskQuery, the compliance module provides IComplianceState, and the policy module provides IPolicyLookup. All three depend on IControlMapping -- the same interface, not three copies.
e) The portal depends on IRiskQuery, IComplianceState and IPolicyLookup, and on nothing else.
f) The assessment engine and the compliance module both write to the evidence repository through IEvidenceStore.
g) The assessment engine and the compliance module both raise findings through the issue tracker's IIssueRaise interface.
h) Regulatory reporting depends on IComplianceState and IRiskQuery. Nothing depends on regulatory reporting.

Tasks
1. Draw every component in requirements (a) to (h) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (c) is what solves the problem in the opening paragraph. Explain in one sentence how mapping one control to three frameworks turns three tests into one, and what piece of evidence is then reused.
5. Requirement (d) has three consumers of IControlMapping. State what you would have to change to add a fourth standard, and what you would have to change in the risk module -- then say what that answer tells you about the design.

</details>

### Q2923 — Pellworth Bank" - Certification Readiness Toolchain

- **Certification:** TOPCIT  
- **Lesson:** ISMS Frameworks and Standards  
- **Used in exams:** Understanding of Security Exam

<details><summary>Full question</summary>

"Pellworth Bank" - Certification Readiness Toolchain

Pellworth failed its last certification audit because the evidence it collected did not match the controls it had declared applicable. Model an architecture where that cannot happen.

a) The scope definition component provides IScopeQuery and is the single statement of what is in scope.
b) The control catalogue provides IControlLookup and holds every control definition.
c) The statement of applicability depends on IScopeQuery and IControlLookup, and provides IApplicability. It is the only component that decides whether a control applies.
d) The evidence collector depends on IApplicability and collects only for controls declared applicable. It writes through the evidence repository's IEvidenceStore interface.
e) The gap analyser depends on both IApplicability and IEvidenceStore, and provides IGapReport. It reports a gap where a control is applicable but has no evidence.
f) The remediation planner depends on IGapReport and provides IRemediationPlan.
g) Management review depends on IGapReport and IRemediationPlan.
h) The audit pack builder depends on IEvidenceStore and IApplicability, and the certification body receives the pack from it.
i) Nothing depends on the certification body, and the control catalogue depends on nothing.

Tasks
1. Draw every component in requirements (a) to (h) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (d) says the collector depends on IApplicability. Explain in one sentence how that single dependency prevents the failure described in the opening paragraph.
5. Requirement (e) defines a gap as applicable-but-no-evidence. Trace on your diagram the two interfaces the gap analyser must combine to detect one, and state what a control with evidence but NOT declared applicable would indicate.

</details>

### Q2941 — Drummond Telecom" - Billing Operations Architecture

- **Certification:** TOPCIT  
- **Lesson:** IT Business Operations  
- **Used in exams:** Understanding of IT Business Exam

<details><summary>Full question</summary>

"Drummond Telecom" - Billing Operations Architecture

Drummond's month-end billing run and its general ledger disagree, because three different components post to the ledger with their own rules. Model an architecture that fixes that.

a) Usage mediation provides IRatedUsage, the cleaned and deduplicated usage records. It is the only component that reads the network's raw files.
b) The rating engine depends on IRatedUsage and on the product catalogue's ITariffLookup interface. The catalogue is the single source of tariffs.
c) The rating engine provides IChargeSet.
d) The billing engine depends on IChargeSet and on the customer account component's IAccountLookup interface.
e) The invoice generator depends on IChargeSet -- the same interface the billing engine uses -- and provides IInvoiceDocument.
f) The invoice generator posts to the general ledger.
g) The collections manager depends on IInvoiceDocument and IAccountLookup.
h) The dispute handler depends on IInvoiceDocument and also posts to the general ledger. Those two are the ONLY components that post to it.
i) The invoice generator and the collections manager both notify customers through INotify. Nothing depends on customer notification.

Tasks
1. Draw every component in requirements (a) to (i) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (h) limits ledger posting to two components. Mark both on your diagram, and explain in one sentence why a dispute must post to the ledger rather than simply amending the invoice.
5. Requirement (e) has two consumers of IChargeSet. State in one sentence what would go wrong at month end if the invoice generator recalculated charges itself instead.

</details>

### Q3063 — Ravensworth Consulting" - Performance Test Architecture

- **Certification:** TOPCIT  
- **Lesson:** Performance and Quality Requirements  
- **Used in exams:** Performance and Quality Requirements Quiz

<details><summary>Full question</summary>

"Ravensworth Consulting" - Performance Test Architecture

Ravensworth's load tests produce numbers nobody can turn into a pass or fail, because the target is remembered rather than recorded. Model an architecture that decides automatically.

a) The test plan repository provides ITestPlan and holds each test's workload profile AND its performance targets. It is the single source of both.
b) The load controller depends on ITestPlan and drives two load generators, A and B, through their ILoadInjection interface.
c) Both generators drive the system under test. Neither knows about the other.
d) An APM agent instruments the system under test. It is not in the load path.
e) Both generators and the APM agent send measurements to the metrics collector through IMetricIngest.
f) The metrics collector writes to the results store through IResultStore. No other component writes to it.
g) The results analyser reads from the results store through that same IResultStore interface and provides IAnalysisReport.
h) The quality gate depends on IAnalysisReport and on ITestPlan, and decides pass or fail by comparing the two.
i) Nothing depends on the quality gate, and the system under test depends on nothing in the test harness.

Tasks
1. Draw every component in requirements (a) to (h) as a UML component.
2. Show each provided interface as a lollipop on the component that provides it, and each required interface as a dependency from the component that needs it.
3. Name every interface on the arrow that uses it. Do not draw an unnamed dependency.
4. Requirement (h) is what solves the problem in the opening paragraph. Explain in one sentence why the quality gate must depend on ITestPlan as well as on the results, and what it could not decide with the results alone.
5. Requirement (i) says the system under test depends on nothing in the harness. State in one sentence why that matters for the validity of the measurements, and what requirement (d) is protecting.

</details>


## Use Case Diagram (2)

### Q2964 — Drummond Telecom" - Service Desk Use Cases

- **Certification:** TOPCIT  
- **Lesson:** IT Business Operations  
- **Used in exams:** none (question bank only)

<details><summary>Full question</summary>

"Drummond Telecom" - Service Desk Use Cases

Drummond is specifying who does what in its new service desk, and who sits outside the system. Model it.

a) A customer raises a fault report and tracks the progress of their ticket.
b) A service desk agent triages the ticket, dispatches an engineer and closes the ticket.
c) A field engineer records a site visit.
d) A service manager reviews SLA performance.
e) Triaging a ticket ALWAYS runs remote diagnostics as part of it. It is never triaged without them.
f) Closing a ticket ALWAYS notifies the customer.
g) Closing a ticket raises an SLA credit ONLY when the resolution target was missed. Most closures do not.
h) Dispatching an engineer ALWAYS results in a site visit being recorded.
i) The billing system is a separate system that receives SLA credits. It is not part of the service desk, and no person uses it here.

Tasks
1. Draw the system boundary and place every use case inside it and every actor outside it.
2. Draw an association line from each actor to the use cases they take part in.
3. Requirements (e), (f) and (h) are always performed; requirement (g) is conditional. Mark the first three <<include>> and the last <<extend>>, with the dashed arrow pointing the correct way in each case.
4. Requirement (i) describes a system, not a person. Explain in one sentence why it is still drawn as an actor, and what it would mean to draw it inside the boundary instead.
5. State in one sentence the difference between <<include>> and <<extend>>, and say what would be wrong with modelling requirement (g) as an <<include>>.

</details>

### Q3186 — Technical Webinar Platform - Use Cases

- **Certification:** TOPCIT  
- **Lesson:** Technical Presentations  
- **Used in exams:** Professional Presentations Exam; Technical Communications Exam

<details><summary>Full question</summary>

Technical Webinar Platform - Use Cases

A team is specifying a platform for technical webinars, and must be clear about who does what and which systems sit outside it. Model it.

a) A host schedules a webinar and moderates questions.
b) A presenter uploads the slide deck and delivers the session.
c) An attendee registers to attend and asks questions.
d) Delivering the session ALWAYS shares the screen and ALWAYS records the session.
e) Delivering the session runs a live poll ONLY when the presenter has prepared one. Most sessions do not.
f) Asking a question ALWAYS goes through moderation before it reaches the presenter.
g) Scheduling a webinar sends follow-up material ONLY when the host has enabled it.
h) The content repository is a separate system that stores uploaded decks. The CRM system is a separate system that receives registrations and follow-up records. Neither is part of the platform and no person uses either here.

Tasks
1. Draw the system boundary and place every use case inside it and every actor outside it.
2. Draw an association line from each actor to the use cases they take part in.
3. Requirements (d) and (f) are always performed; requirements (e) and (g) are conditional. Mark the first group <<include>> and the second <<extend>>, with the dashed arrow pointing the correct way in each case.
4. Requirement (h) describes two systems, not people. Explain in one sentence why they are still drawn as actors, and what distinguishes them from the human actors on your diagram.
5. State in one sentence the difference between <<include>> and <<extend>>, and explain what would be wrong with modelling requirement (e) as an <<include>>.

</details>


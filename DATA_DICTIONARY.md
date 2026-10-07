# REBYU — DATA DICTIONARY

Generated from the live PostgreSQL schema (Supabase, `public` schema) and the JPA entities in `backend-java/src/main/java/com/capstone/rebyu`, so field names, data types, nullability and keys are exactly what the database holds. The LangGraph checkpoint tables (`checkpoints`, `checkpoint_blobs`, `checkpoint_writes`, `checkpoint_migrations`) belong to the Python AI service's workflow engine and are not listed; the BKT service's own tables live in the separate `bkt` schema.

92 tables.

---

## 1. USER MANAGEMENT

### DATA DICTIONARY OF USER_TYPES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| user_type_id | PK, identity | BIGINT | No | Unique identifier for a user type. |
| user_type_text | NOT NULL | VARCHAR(20) | No | Name of the role, such as learner, admin, or institution. |

The USER_TYPES table stores the account role classifications of the platform. Many users can reference each user type.

### DATA DICTIONARY OF USERS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| user_id | PK, identity | BIGINT | No | Unique identifier for a user account. |
| account_status | NOT NULL | VARCHAR(20) | No | Account state: active, inactive, or suspended. Defaults to active. |
| cognito_sub | UNIQUE | VARCHAR(64) | Yes | Stable Amazon Cognito subject linked to this account; null for pre-Cognito accounts until their first federated sign-in. |
| email | UNIQUE, NOT NULL | VARCHAR(254) | No | Login e-mail address of the account. |
| joined_at | NOT NULL | TIMESTAMP | No | Date and time the account was created. |
| password_hash | NOT NULL | VARCHAR(255) | No | Hashed password of the account. |
| phone_number | — | VARCHAR(30) | Yes | Contact number of the user. |
| user_type_id | FK → USER_TYPES, NOT NULL | BIGINT | No | Role of the account (learner, admin, institution). |
| last_seen_at | — | TIMESTAMP | Yes | Date and time the account last made a signed-in request; used to show who is online. |

The USERS table stores every account on the platform. Each user belongs to one user type, and a user can own one learner profile, many notifications, and many audit-log entries.

### DATA DICTIONARY OF LEARNERS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| learner_id | PK, identity | BIGINT | No | Unique identifier for a learner profile. |
| first_name | NOT NULL | VARCHAR(50) | No | Learner's first name. |
| last_name | NOT NULL | VARCHAR(50) | No | Learner's last name. |
| username | UNIQUE, NOT NULL | VARCHAR(50) | No | Public display username of the learner. |
| user_id | FK → USERS, UNIQUE | BIGINT | Yes | Account that owns this learner profile (one-to-one). |
| avatar_key | — | VARCHAR(512) | Yes | Storage (S3) key of the learner's profile picture; null shows the learner's initials instead. |

The LEARNERS table stores the learner profile linked one-to-one with a user account. A learner owns enrollments, attempts, achievements, community activity, and progress records.

### DATA DICTIONARY OF AUDIT_LOG

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| log_id | PK, identity | BIGINT | No | Unique identifier for an audit log. |
| action | — | VARCHAR(255) | Yes | Action performed, such as an account, content, or billing change. |
| details | — | VARCHAR(255) | Yes | Free-text details of what changed. |
| entity_id | — | BIGINT | Yes | Identifier of the record the action was performed on. |
| entity_type | — | VARCHAR(255) | Yes | Kind of record the action was performed on. |
| ip_address | — | VARCHAR(255) | Yes | IP address the action was performed from. |
| timestamp | — | TIMESTAMP | Yes | Date and time the action was performed. |
| user_id | — | BIGINT | Yes | Account that performed the action. |

The AUDIT_LOG table records administrative actions for accountability: who did what, to which kind of record, when, and from where. Many entries belong to one user.

### DATA DICTIONARY OF USER_ACTIVITY_DAYS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| user_activity_day_id | PK, identity | BIGINT | No | Unique identifier for an user activity day. |
| activity_date | NOT NULL | DATE | No | Calendar day on which the user was active. |
| user_id | NOT NULL | BIGINT | No | Account that was active on that day. |

The USER_ACTIVITY_DAYS table stores one row per user per day they used REBYU. users.last_seen_at only knows the present moment; the admin dashboard's weekly, monthly and yearly "active users" lines are counted from these rows.

### DATA DICTIONARY OF USER_DASHBOARD_LAYOUTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| layout_id | PK, identity | BIGINT | No | Unique identifier for an user dashboard layout. |
| board | NOT NULL | VARCHAR(40) | No | Dashboard the layout applies to. |
| tile_order | NOT NULL | TEXT | No | Placement of each dashboard tile (position and size), as a JSON array. |
| updated_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the record was last updated. |
| user_id | FK → USERS, NOT NULL | BIGINT | No | Reference to the user this record belongs to. |

The USER_DASHBOARD_LAYOUTS table: how one person has arranged one dashboard.  Keyed on the user rather than the learner, which is what makes it usable by the admin and institution boards -- neither of those audiences has a learner row

---

## 2. CERTIFICATION CONTENT

### DATA DICTIONARY OF CERTIFICATIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| certification_id | PK, identity | BIGINT | No | Unique identifier for a certification. |
| date_created | — | TIMESTAMP | Yes | Date and time the certification was created. |
| date_updated | — | TIMESTAMP | Yes | Date and time the certification was last updated. |
| description | NOT NULL | TEXT | No | Full description of the certification. |
| exam_structure | — | JSONB | Yes | Structure of the real certification exam (number of items, question types, notes), as JSON; written by the AI curriculum planner. |
| industry | — | VARCHAR(255) | Yes | Industry the certification belongs to. |
| status | — | SMALLINT | Yes | Lifecycle state: 0 = PUBLISHED, 1 = DRAFT. Defaults to DRAFT. |
| title | UNIQUE, NOT NULL | VARCHAR(150) | No | Title of the certification. |
| badge_image_key | — | VARCHAR(500) | Yes | Storage (S3) key of the certification's badge image; null until an admin uploads one. |

The CERTIFICATIONS table stores the review programs offered by the platform. One certification contains many major categories and is referenced by exams, enrollments, orders, awards, and institution allocations.

### DATA DICTIONARY OF MAJOR_CATEGORIES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| major_category_id | PK, identity | BIGINT | No | Unique identifier for a major category. |
| title | NOT NULL | VARCHAR(150) | No | Title of the major category. |
| certification_id | FK → CERTIFICATIONS, NOT NULL | BIGINT | No | Certification this major category belongs to. |
| owner_department_id | FK → DEPARTMENTS | BIGINT | Yes | Group that owns the category; null for official, platform-wide content. |

The MAJOR_CATEGORIES table stores the top-level curriculum divisions of a certification. One major category contains many middle categories.

### DATA DICTIONARY OF MIDDLE_CATEGORIES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| middle_category_id | PK, identity | BIGINT | No | Unique identifier for a middle category. |
| title | NOT NULL | VARCHAR(150) | No | Title of the middle category. |
| major_category_id | FK → MAJOR_CATEGORIES, NOT NULL | BIGINT | No | Major category this middle category belongs to. |

The MIDDLE_CATEGORIES table stores the second-level curriculum divisions. One middle category contains many lessons.

### DATA DICTIONARY OF LESSONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| lesson_id | PK, identity | BIGINT | No | Unique identifier for a lesson. |
| lesson_component_structure | NOT NULL | JSONB | No | JSON structure of the lesson's content components (sections, text, media). Defaults to []. |
| name | NOT NULL | VARCHAR(150) | No | Name of the lesson. |
| middle_category_id | FK → MIDDLE_CATEGORIES, NOT NULL | BIGINT | No | Middle category this lesson belongs to. |

The LESSONS table stores the individual study units of a certification. One lesson owns many questions and is referenced by quizzes, skill-state estimates, review items, and completion records.

### DATA DICTIONARY OF LESSON_IMAGES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| lesson_image_id | PK, identity | BIGINT | No | Unique identifier for a lesson image. |
| image_key | NOT NULL | VARCHAR(500) | No | S3 key of the stored image file. |
| lesson_id | NOT NULL | INTEGER | No | Identifier of the lesson the image belongs to. |
| section_name | NOT NULL | VARCHAR(255) | No | Lesson section where the image is placed. |
| tool_id | NOT NULL | VARCHAR(255) | No | Editor tool/block identifier that references the image. |

The LESSON_IMAGES table stores images embedded inside lesson content. Many images can belong to one lesson.

### DATA DICTIONARY OF LESSON_VIDEOS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| lesson_video_id | PK, identity | BIGINT | No | Unique identifier for a lesson video. |
| lesson_id | NOT NULL | INTEGER | No | Identifier of the lesson the video belongs to. |
| section_name | NOT NULL | VARCHAR(255) | No | Lesson section where the video is placed. |
| tool_id | NOT NULL | VARCHAR(255) | No | Editor tool/block identifier that references the video. |
| video_key | NOT NULL | VARCHAR(500) | No | S3 key of the stored video file. |

The LESSON_VIDEOS table stores videos embedded inside lesson content. Many videos can belong to one lesson.

### DATA DICTIONARY OF REFERENCE_OPTIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| reference_option_id | PK, identity | BIGINT | No | Unique identifier for a reference option. |
| active | NOT NULL | BOOLEAN | No | Whether the option is currently offered in forms. |
| kind | NOT NULL | VARCHAR(40) | No | List the option belongs to, such as industry or institution type. |
| label | NOT NULL | VARCHAR(150) | No | Text shown for the option. |
| sort_order | NOT NULL | INTEGER | No | Position of the option within its list. |

The REFERENCE_OPTIONS table stores one entry of a stored pick-list: an industry a certification belongs to, a department name an institution can group learners under. These were constants in the frontend; stored, an admin can add to them without a release and every select reads the same list.

---

## 3. QUESTION BANK

### DATA DICTIONARY OF QUESTIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| question_id | PK, identity | BIGINT | No | Unique identifier for a question. |
| created_at | — | TIMESTAMP | Yes | Date and time the record was created. |
| difficulty_level | NOT NULL | VARCHAR(10) | No | Difficulty rating of the question (e.g. easy, medium, hard). |
| image_key | — | VARCHAR(255) | Yes | S3 key of an image attached to the question. |
| question_text | NOT NULL | TEXT | No | The question prompt shown to the learner. |
| question_type | NOT NULL | VARCHAR(30) | No | Type of question (multiple choice, short answer, descriptive, programming, diagram, etc.). |
| created_by | FK → USERS | BIGINT | Yes | Account that authored the question; null for questions created before authorship was recorded. |
| lesson_id | FK → LESSONS, NOT NULL | BIGINT | No | Lesson the question belongs to. |
| owner_department_id | FK → DEPARTMENTS | BIGINT | Yes | Group that owns the question; null for official, platform-wide questions. |
| parent_question_id | FK → QUESTIONS | BIGINT | Yes | Parent question when this row is a sub-question (e.g. critical-thinking sets). |
| difficulty_source | — | VARCHAR(20) | Yes | How the difficulty level was set: by the generator, by an author, or calibrated from learner responses. |

The QUESTIONS table stores every question in the question bank. One question owns many choices, optional type-specific configs (text, programming, diagram), rubric criteria, and may parent sub-questions.

### DATA DICTIONARY OF CHOICES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| choice_id | PK, identity | BIGINT | No | Unique identifier for an answer choice. |
| choice_text | NOT NULL | TEXT | No | Text of the answer option. |
| is_correct | NOT NULL | BOOLEAN | No | Whether this choice is the correct answer. |
| explanation | — | TEXT | Yes | Explanation shown when reviewing the answer. |
| image_key | — | VARCHAR(255) | Yes | S3 key of an image attached to the choice. |
| question_id | FK → QUESTIONS, NOT NULL | BIGINT | No | Question this choice belongs to. |

The CHOICES table stores the answer options of multiple-choice questions. Many choices belong to one question.

### DATA DICTIONARY OF TEXT_QUESTION_CONFIGS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| text_question_config_id | PK, identity | BIGINT | No | Unique identifier for a text-question configuration. |
| accepted_variations | — | TEXT | Yes | Optional exact-match alternative answers, one per line. |
| checking_method | NOT NULL | VARCHAR(30) | No | How the answer is checked (e.g. EXACT_MATCH, AI). Defaults to EXACT_MATCH. |
| correct_answer | NOT NULL | TEXT | No | The expected correct answer text. |
| question_id | FK → QUESTIONS, UNIQUE, NOT NULL | BIGINT | No | Question this configuration belongs to (one-to-one). |

The TEXT_QUESTION_CONFIGS table stores the answer key of short-answer and descriptive questions. Each configuration belongs to exactly one question.

### DATA DICTIONARY OF PROGRAMMING_QUESTION_CONFIGS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| programming_question_config_id | PK, identity | BIGINT | No | Unique identifier for a programming-question configuration. |
| starter_code | — | TEXT | Yes | Starter code pre-loaded in the learner's editor. |
| question_id | FK → QUESTIONS, UNIQUE, NOT NULL | BIGINT | No | Question this configuration belongs to (one-to-one). |
| language | — | VARCHAR(255) | Yes | Programming language the learner answers in. |

The PROGRAMMING_QUESTION_CONFIGS table stores the coding setup of programming questions. One configuration owns many programming test cases.

### DATA DICTIONARY OF PROGRAMMING_TEST_CASES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| programming_test_case_id | PK, identity | BIGINT | No | Unique identifier for a test case. |
| expected_output | NOT NULL | TEXT | No | Expected standard output for the test to pass. |
| input_data | NOT NULL | TEXT | No | Standard input fed to the learner's program. |
| is_sample | NOT NULL | BOOLEAN | No | Whether the case is a learner-visible sample; hidden otherwise. Defaults to false. |
| programming_question_config_id | FK → PROGRAMMING_QUESTION_CONFIGS, NOT NULL | BIGINT | No | Programming configuration this test case belongs to. |

The PROGRAMMING_TEST_CASES table stores the input/output pairs used to grade programming answers. Many test cases belong to one programming configuration.

### DATA DICTIONARY OF DIAGRAM_QUESTION_CONFIGS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| diagram_question_config_id | PK, identity | BIGINT | No | Unique identifier for a diagram-question configuration. |
| diagram_type | NOT NULL | VARCHAR(30) | No | Type of diagram expected (e.g. ERD, flowchart, UML). |
| instructions | — | TEXT | Yes | Additional drawing instructions for the learner. |
| reference_diagram_json | NOT NULL | JSONB | No | Reference diagram as structured JSON used for grading. |
| reference_diagram_xml | NOT NULL | TEXT | No | Reference (correct) diagram in XML form. |
| question_id | FK → QUESTIONS, UNIQUE, NOT NULL | BIGINT | No | Question this configuration belongs to (one-to-one). |

The DIAGRAM_QUESTION_CONFIGS table stores the reference solution of diagram questions. Each configuration belongs to exactly one question.

### DATA DICTIONARY OF QUESTION_RUBRIC_CRITERIA

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| rubric_criterion_id | PK, identity | BIGINT | No | Unique identifier for a rubric criterion. |
| display_order | NOT NULL | INTEGER | No | Ordering of the criterion in the rubric. Defaults to 1. |
| max_points | NOT NULL | DECIMAL(5,2) | No | Maximum points awardable for this criterion. Defaults to 1.00. |
| name | NOT NULL | VARCHAR(150) | No | Name of the grading criterion. |
| question_id | FK → QUESTIONS, NOT NULL | BIGINT | No | Question this rubric line belongs to. |

The QUESTION_RUBRIC_CRITERIA table stores the rubric lines of subjectively graded questions (diagram/descriptive). Many criteria belong to one question.

---

## 4. EXAMS AND LEGACY RESULTS

### DATA DICTIONARY OF EXAM_TYPES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| exam_type_id | PK, identity | BIGINT | No | Unique identifier for an exam type. |
| exam_type_text | UNIQUE, NOT NULL | VARCHAR(50) | No | Name of the exam type, such as quiz, diagnostic, or mock exam. |

The EXAM_TYPES table stores the classifications of assessments. Many exams can reference each exam type.

### DATA DICTIONARY OF EXAMS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| exam_id | PK, identity | BIGINT | No | Unique identifier for an exam/assessment. |
| description | — | TEXT | Yes | Description shown to learners. |
| duration_minutes | — | INTEGER | Yes | Time limit in minutes; null means untimed. |
| instructions | — | TEXT | Yes | Instructions shown before starting. |
| is_generated | NOT NULL | BOOLEAN | No | Whether the exam was AI-generated. Defaults to false. |
| passing_score | NOT NULL | DECIMAL(5,2) | No | Passing percentage. Defaults to 70.00. |
| published_at | — | TIMESTAMP | Yes | Date and time the exam was published. |
| release_answers_after_submit | — | BOOLEAN | Yes | Whether answer keys are released after submission; null is treated as true. |
| status | — | VARCHAR(20) | Yes | Lifecycle state: DRAFT, PUBLISHED, or ARCHIVED; null is treated as DRAFT. |
| target_scope | — | VARCHAR(20) | Yes | Scope of the assessment: LESSON, MIDDLE_CATEGORY, MAJOR_CATEGORY, or CERTIFICATION. |
| title | NOT NULL | VARCHAR(150) | No | Title of the exam. |
| total_questions | NOT NULL | INTEGER | No | Number of questions in the exam. |
| updated_at | — | TIMESTAMP | Yes | Date and time the exam was last updated. |
| certification_id | FK → CERTIFICATIONS, NOT NULL | BIGINT | No | Certification the exam belongs to. |
| exam_type_id | FK → EXAM_TYPES, NOT NULL | BIGINT | No | Type of the exam (quiz, diagnostic, mock, etc.). |
| learner_id | FK → LEARNERS | BIGINT | Yes | Learner who generated the exam through the AI tutor; null for authored exams. |
| lesson_id | FK → LESSONS | BIGINT | Yes | Lesson scope; required for QUIZ-type exams. |
| major_category_id | FK → MAJOR_CATEGORIES | BIGINT | Yes | Set for major-category-scoped assessments. |
| middle_category_id | FK → MIDDLE_CATEGORIES | BIGINT | Yes | Set for middle-category-scoped assessments. |
| owner_department_id | FK → DEPARTMENTS | BIGINT | Yes | Group that owns the exam; null for official, platform-wide exams. |

The EXAMS table stores every assessment (quiz, diagnostic, mock exam) of a certification. One exam contains many exam questions and is referenced by attempts and results.

### DATA DICTIONARY OF EXAM_QUESTIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| exam_question_id | PK, identity | BIGINT | No | Unique identifier for an exam–question link. |
| display_order | NOT NULL | INTEGER | No | Position of the question in the exam. |
| points | — | DECIMAL(5,2) | Yes | Per-assessment point override; null falls back to the question's own total points. |
| exam_id | FK → EXAMS, NOT NULL | BIGINT | No | Exam the question is placed in. |
| question_id | FK → QUESTIONS, NOT NULL | BIGINT | No | Question bank item placed in the exam. |

The EXAM_QUESTIONS table is the junction between exams and questions. One exam contains many exam questions, and one question can appear in many exams.

### DATA DICTIONARY OF EXAM_RESULTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| attempt_no | PK | INTEGER | No | Sequence number of the attempt. |
| duration_seconds | NOT NULL | INTEGER | No | Time spent on the exam in seconds. |
| is_passed | NOT NULL | BOOLEAN | No | Whether the score met the passing score. |
| score | NOT NULL | DECIMAL(5,2) | No | Final percentage score of the attempt. |
| taken_at | NOT NULL | TIMESTAMP | No | Date and time the exam was taken. |
| exam_id | PK, FK → EXAMS | BIGINT | No | Exam that was taken. |
| learner_id | PK, FK → LEARNERS | BIGINT | No | Learner who took the exam. |
| rating | — | DECIMAL(5,2) | Yes | Proficiency measured by an adaptive exam, from 0 to 100; null for fixed papers. |

The EXAM_RESULTS table stores the summarized outcome of each exam attempt. A learner can have many results per exam, distinguished by attempt number.

---

## 5. ASSESSMENT ATTEMPT ENGINE

### DATA DICTIONARY OF ASSESSMENT_ATTEMPTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| assessment_attempt_id | PK, identity | BIGINT | No | Unique identifier for an attempt. |
| attempt_number | NOT NULL | INTEGER | No | Sequence number of this attempt per exam and learner. |
| current_question_id | — | BIGINT | Yes | Attempt-question id the learner last viewed, used for resume. |
| duration_seconds | — | INTEGER | Yes | Time spent on the attempt in seconds. |
| earned_points | — | DECIMAL(8,2) | Yes | Points earned by the learner. |
| enrollment_id | — | BIGINT | Yes | LEARNER_CERTIFICATIONS id backing this attempt, when one exists. |
| expires_at | — | TIMESTAMP | Yes | Deadline after which the attempt expires. |
| idempotency_key | UNIQUE | VARCHAR(100) | Yes | Key preventing duplicate attempt creation from retried requests. |
| learner_id | NOT NULL | BIGINT | No | Learner taking the attempt. |
| passed | — | BOOLEAN | Yes | Whether the attempt met the passing score. |
| percentage | — | DECIMAL(5,2) | Yes | Score percentage (0–100) across all snapshot points; pending items score 0. |
| started_at | NOT NULL | TIMESTAMP | No | Date and time the attempt started. |
| status | NOT NULL | VARCHAR(20) | No | Attempt state: IN_PROGRESS, SUBMITTED, EXPIRED, or CANCELLED. |
| submitted_at | — | TIMESTAMP | Yes | Date and time the attempt was submitted. |
| total_points | — | DECIMAL(8,2) | Yes | Total possible points of the attempt. |
| version | NOT NULL | BIGINT | No | Version counter guarding concurrent updates. |
| exam_id | FK → EXAMS, NOT NULL | BIGINT | No | Published exam being attempted. |
| adaptive | NOT NULL | BOOLEAN | No | Whether the attempt is served one item at a time by the adaptive engine. Defaults to false. |
| adaptive_state_json | — | TEXT | Yes | Adaptive engine's in-progress session state, as JSON. |
| final_round_count | — | INTEGER | Yes | Number of items in the attempt's final, batch-graded round. |
| phase | — | VARCHAR(10) | Yes | Phase of an adaptive attempt: MAIN, FINAL, or DONE; null for fixed papers. |
| target_question_count | — | INTEGER | Yes | Number of items the adaptive engine aims to serve in this attempt. |
| theta_current | — | DOUBLE PRECISION | Yes | Current estimate of the learner's ability (IRT theta) during the attempt. |
| theta_se | — | DOUBLE PRECISION | Yes | Standard error of the current ability estimate. |
| theta_start | — | DOUBLE PRECISION | Yes | Ability estimate (IRT theta) at the start of the attempt. |
| grading_pending | NOT NULL | BOOLEAN | No | Whether written, coded, or diagram answers are still being graded; the result is provisional until false. Defaults to false. |
| item_count | — | INTEGER | Yes | Number of items served in the attempt. |
| answered_count | — | INTEGER | Yes | Number of items the learner has answered so far. |
| correct_count | — | INTEGER | Yes | Number of items answered correctly so far. |
| bank_cycle | — | INTEGER | Yes | Pass through the certification's question bank this attempt drew from. |

The ASSESSMENT_ATTEMPTS table stores one learner attempt of a published exam. Questions are snapshotted at start and answers are scored server-side on submit. One attempt owns many attempt questions, answers, and executions.

### DATA DICTIONARY OF ASSESSMENT_ATTEMPT_QUESTIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| attempt_question_id | PK, identity | BIGINT | No | Unique identifier for a snapshotted attempt question. |
| display_order | NOT NULL | INTEGER | No | Position of the question in the attempt. |
| flagged | NOT NULL | BOOLEAN | No | Learner marked this item for review. Defaults to false. |
| lesson_id | — | BIGINT | Yes | Lesson the source question belongs to, for analytics. |
| points | — | DECIMAL(5,2) | Yes | Points this item is worth in the attempt. |
| question_data_snapshot | — | TEXT | Yes | Learner-safe JSON: choices without correct flags, starter code, etc. |
| question_text_snapshot | NOT NULL | TEXT | No | Question text frozen at attempt start. |
| question_type | NOT NULL | VARCHAR(30) | No | Type of the snapshotted question. |
| skipped | NOT NULL | BOOLEAN | No | Learner intentionally moved past this item without answering. Defaults to false. |
| source_question_id | NOT NULL | BIGINT | No | Question bank id the snapshot was taken from. |
| assessment_attempt_id | FK → ASSESSMENT_ATTEMPTS, NOT NULL | BIGINT | No | Attempt this snapshot belongs to. |
| item_information | — | DOUBLE PRECISION | Yes | Fisher information the item contributed at the ability level it was served at. |
| selection_reason | — | TEXT | Yes | Why the adaptive engine chose this item, kept for review. |
| served_at | — | TIMESTAMP | Yes | Date and time the item was shown to the learner. |
| stage | — | VARCHAR(10) | Yes | Stage of an adaptive attempt the item was served in: MAIN or FINAL; null for fixed papers. |
| theta_after | — | DOUBLE PRECISION | Yes | Ability estimate after the learner answered this item. |
| theta_before | — | DOUBLE PRECISION | Yes | Ability estimate when this item was served. |

The ASSESSMENT_ATTEMPT_QUESTIONS table stores the learner-visible snapshot of each question at attempt start; snapshots never contain answer keys, rubrics, or reference diagrams. Many snapshots belong to one attempt.

### DATA DICTIONARY OF ASSESSMENT_ATTEMPT_ANSWERS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| attempt_answer_id | PK, identity | BIGINT | No | Unique identifier for an attempt answer. |
| answered_at | — | TIMESTAMP | Yes | Date and time the answer was first recorded. |
| diagram_grading_result | — | TEXT | Yes | JSON per-element (node/edge) grading breakdown from the diagram grading service. |
| diagram_submission_data | — | TEXT | Yes | Submitted diagram data for diagram items. |
| execution_result | — | TEXT | Yes | JSON Judge0 execution payload: code hash, mode, status, output, error, time/memory, per-test results. |
| feedback | — | TEXT | Yes | AI grading feedback for descriptive/critical-thinking answers (learner-safe). |
| is_correct | — | BOOLEAN | Yes | Correctness set only by server-side scoring; null until scored or while pending manual evaluation. |
| last_saved_at | — | TIMESTAMP | Yes | Date and time the answer was last saved. |
| learner_answer | — | TEXT | Yes | Free-text answer (short answer, descriptive, sub-question JSON). |
| pending_manual_evaluation | NOT NULL | BOOLEAN | No | Whether the answer awaits manual/AI evaluation. Defaults to false. |
| programming_language | — | VARCHAR(30) | Yes | Language of the submitted code. |
| selected_choice_id | — | BIGINT | Yes | Choice id selected for multiple-choice items. |
| sub_answer_scores | — | TEXT | Yes | JSON array of per-sub-question AI scores for critical-thinking answers. |
| submitted_code | — | TEXT | Yes | Code submitted for programming items. |
| assessment_attempt_id | FK → ASSESSMENT_ATTEMPTS, NOT NULL | BIGINT | No | Attempt this answer belongs to. |
| attempt_question_id | FK → ASSESSMENT_ATTEMPT_QUESTIONS, NOT NULL | BIGINT | No | Snapshotted question being answered. |
| credit | — | DECIMAL(5,4) | Yes | Share of the item's credit the answer earned, from 0 to 1; partial credit comes from the AI, code, and diagram graders. |

The ASSESSMENT_ATTEMPT_ANSWERS table stores a learner's answer to one attempt question across all question types. Each attempt question has at most one answer per attempt.

### DATA DICTIONARY OF ASSESSMENT_ATTEMPT_EXECUTIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| execution_id | PK, identity | BIGINT | No | Unique identifier for a code execution. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the execution was triggered. |
| language | — | VARCHAR(30) | Yes | Programming language used. |
| mode | NOT NULL | VARCHAR(10) | No | Execution mode: RUN or CHECK. |
| output | — | TEXT | Yes | Program output or error text. |
| passed_tests | — | INTEGER | Yes | Number of test cases passed. |
| status | NOT NULL | VARCHAR(30) | No | Execution state: UNAVAILABLE, QUEUED, RUNNING, COMPLETED, or ERROR. |
| submitted_code | — | TEXT | Yes | Code that was executed. |
| total_tests | — | INTEGER | Yes | Total number of test cases run. |
| assessment_attempt_id | FK → ASSESSMENT_ATTEMPTS, NOT NULL | BIGINT | No | Attempt the execution belongs to. |
| attempt_question_id | FK → ASSESSMENT_ATTEMPT_QUESTIONS, NOT NULL | BIGINT | No | Programming item the code was run against. |

The ASSESSMENT_ATTEMPT_EXECUTIONS table is the Run/Check history log of programming items, executed via Judge0. Many executions can belong to one attempt question.

### DATA DICTIONARY OF LEARNER_BANK_CYCLES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| learner_bank_cycle_id | PK, identity | BIGINT | No | Unique identifier for a learner bank cycle. |
| certification_id | NOT NULL | BIGINT | No | Certification whose question bank the cycle runs through. |
| cycle_no | NOT NULL | INTEGER | No | Which pass through the question bank the learner is on; questions are not repeated within a pass. |
| learner_id | NOT NULL | BIGINT | No | Learner the cycle belongs to. |
| started_at | NOT NULL | TIMESTAMP | No | Date and time the pass began; questions served since then count as seen. |

The LEARNER_BANK_CYCLES table stores which pass over a certification's bank this learner is on. A learner's sessions draw questions they have not met in the current cycle. When what is left cannot fill a paper -- the bank is used up and no top-up has landed -- the cycle rolls over: everything counts as fresh again and, within the new cycle, nothing repeats until it too is used up. Every attempt records the cycle it drew from.

### DATA DICTIONARY OF LEARNER_SKILL_STATES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| learner_skill_state_id | PK, identity | BIGINT | No | Unique identifier for a learner skill state. |
| evidence_count | NOT NULL | INTEGER | No | Number of graded answers that have updated this estimate. |
| learner_id | NOT NULL | BIGINT | No | Learner the estimate belongs to. |
| lesson_id | NOT NULL | BIGINT | No | Lesson the estimate is for. |
| p_known | NOT NULL | DOUBLE PRECISION | No | Estimated probability that the learner has mastered the lesson (0 to 1). |
| updated_at | NOT NULL | TIMESTAMP | No | Date and time the record was last updated. |

The LEARNER_SKILL_STATES table stores bayesian Knowledge Tracing state: the probability this learner knows this lesson's skill, as the in-session engine last left it. The analytics service keeps its own mastery record from the same evidence; this one is what the next assessment seeds itself from without a network call.

---

## 6. PROGRESS AND GAMIFICATION

### DATA DICTIONARY OF ACHIEVEMENTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| achievement_id | PK, identity | BIGINT | No | Unique identifier for an achievement. |
| description | NOT NULL | TEXT | No | Description of how the achievement is earned. |
| title | UNIQUE, NOT NULL | VARCHAR(100) | No | Title of the achievement badge. |

The ACHIEVEMENTS table stores the badge definitions of the platform. Many learners can earn each achievement through the LEARNER_ACHIEVEMENTS table.

### DATA DICTIONARY OF LEARNER_ACHIEVEMENTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| earned_at | NOT NULL | TIMESTAMP | No | Date and time the achievement was earned. |
| achievement_id | PK, FK → ACHIEVEMENTS | BIGINT | No | Achievement that was earned. |
| learner_id | PK, FK → LEARNERS | BIGINT | No | Learner who earned the achievement. |

The LEARNER_ACHIEVEMENTS table is the junction between learners and achievements, recording when each badge was earned.

### DATA DICTIONARY OF LEARNER_COMPLETED_LESSONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| completed_at | NOT NULL | TIMESTAMP | No | Date and time the lesson was completed. |
| learner_id | PK, FK → LEARNERS | BIGINT | No | Learner who completed the lesson. |
| lesson_id | PK, FK → LESSONS | BIGINT | No | Lesson that was completed. |

The LEARNER_COMPLETED_LESSONS table is the junction between learners and lessons, recording lesson completion for progress tracking.

### DATA DICTIONARY OF LEARNER_READ_SECTIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| section_key | PK | VARCHAR(191) | No | Unique identifier for a learner read section. |
| read_at | NOT NULL | TIMESTAMP | No | Date and time the learner finished reading the section. |
| learner_id | PK, FK → LEARNERS | BIGINT | No | Unique identifier for a learner read section. |
| lesson_id | PK, FK → LESSONS | BIGINT | No | Unique identifier for a learner read section. |

The LEARNER_READ_SECTIONS table records which lesson sections each learner has finished reading, so lesson progress can resume where the learner left off.

### DATA DICTIONARY OF LEARNER_REWARD_BALANCES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| learner_id | PK, identity | BIGINT | No | Unique identifier for a learner reward balance. |
| ai_credit_balance | NOT NULL | INTEGER | No | AI tutor credits the learner can spend. |
| coin_balance | NOT NULL | BIGINT | No | Coins the learner currently holds. |
| updated_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the record was last updated. Defaults to now(). |
| xp_balance | NOT NULL | BIGINT | No | Total experience points the learner has earned. |

The LEARNER_REWARD_BALANCES table: server-authoritative balances; learner_id is the primary key (one row per learner).

### DATA DICTIONARY OF LEARNER_REWARD_LEDGER

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| reward_ledger_id | PK, identity | BIGINT | No | Unique identifier for a learner reward ledger. |
| amount | NOT NULL | INTEGER | No | Amount credited (positive) or spent (negative). |
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the record was created. Defaults to now(). |
| currency | NOT NULL | VARCHAR(16) | No | Which balance changed: XP, coins, or AI credits. |
| learner_id | NOT NULL | BIGINT | No | Learner whose balance changed. |
| reason | NOT NULL | VARCHAR(48) | No | Why the reward was given or spent, such as a completed lesson or a passed exam. |
| source_key | NOT NULL | VARCHAR(180) | No | Identifier of the event that produced the entry; unique, so one event is never rewarded twice. |

The LEARNER_REWARD_LEDGER table stores append-only ledger; the unique (learner_id, source_key, currency) constraint (V31) makes awards idempotent. That constraint is declared here as well as in the migration, and it has to be.

### DATA DICTIONARY OF NOTIFICATION_PREFERENCE

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| pref_id | PK, identity | BIGINT | No | Unique identifier for a notification preference. |
| achievement_notifications | — | BOOLEAN | Yes | Whether the learner is notified about achievements. Defaults to true. |
| daily_reminder | — | BOOLEAN | Yes | Whether the learner receives a daily study reminder. Defaults to true. |
| daily_reminder_time | — | VARCHAR(255) | Yes | Time of day the daily reminder is sent. Defaults to 09:00. |
| social_notifications | — | BOOLEAN | Yes | Whether the learner is notified about community activity. Defaults to true. |
| streak_reminder | — | BOOLEAN | Yes | Whether the learner is reminded before losing a streak. Defaults to true. |
| learner_id | FK → LEARNERS, UNIQUE | BIGINT | Yes | Reference to the learner this record belongs to. |

The NOTIFICATION_PREFERENCE table stores each learner's notification settings: daily study reminders and their time, streak reminders, and community and achievement notifications.

### DATA DICTIONARY OF STREAK

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| streak_id | PK, identity | BIGINT | No | Unique identifier for a streak. |
| best_streak | — | INTEGER | Yes | Longest streak of consecutive study days the learner has reached. |
| current_streak | — | INTEGER | Yes | Number of consecutive study days in the current streak. |
| last_activity_date | — | DATE | Yes | Most recent day the learner studied. |
| streak_start_date | — | DATE | Yes | First day of the current streak. |
| learner_id | FK → LEARNERS, UNIQUE | BIGINT | Yes | Reference to the learner this record belongs to. |

The STREAK table stores each learner's study streak: the current run of consecutive study days, when it started, the last day studied, and the longest streak reached.

### DATA DICTIONARY OF STUDY_PLAN

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| plan_id | PK, identity | BIGINT | No | Unique identifier for a study plan. |
| certification_id | — | BIGINT | Yes | Certification the plan prepares for. |
| completed_at | — | TIMESTAMP | Yes | Date and time the plan was completed. |
| created_at | — | TIMESTAMP | Yes | Date and time the record was created. |
| goal | — | VARCHAR(255) | Yes | Goal the learner set for the plan, such as an exam date or a target score. |
| schedule | — | TEXT | Yes | Scheduled study events of the plan, stored as JSON. |
| status | — | VARCHAR(255) | Yes | Lifecycle status of the plan, such as active or completed. |
| learner_id | FK → LEARNERS | BIGINT | Yes | Reference to the learner this record belongs to. |

The STUDY_PLAN table: the certification this plan reviews for. A plain id rather than a relation: the plan is only ever read back for one certification at a time, and the association would drag a Certification fetch into e

### DATA DICTIONARY OF STUDY_PLAN_TASK_STATUS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| task_status_id | PK, identity | BIGINT | No | Unique identifier for a study plan task statu. |
| completed_at | — | TIMESTAMP | Yes | Date and time the task was completed. |
| event_id | NOT NULL | VARCHAR(255) | No | Identifier of the scheduled event within the plan. |
| started_at | — | TIMESTAMP | Yes | Date and time the learner started the task. |
| status | NOT NULL | VARCHAR(255) | No | Progress of the task, such as pending, started, or done. |
| updated_at | — | TIMESTAMP | Yes | Date and time the record was last updated. |
| learner_id | FK → LEARNERS | BIGINT | Yes | Learner the task belongs to. |
| plan_id | FK → STUDY_PLAN | BIGINT | Yes | Reference to the study plan this record belongs to. |

The STUDY_PLAN_TASK_STATUS table: what has become of one scheduled task on a study plan.  <p>A row per event the learner has actually engaged with, rather than one per event in the plan: a plan runs to dozens of sessions and the overw

---

## 7. ENROLLMENT AND ORDERS (B2C)

### DATA DICTIONARY OF LEARNER_ORDERS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| order_id | PK, identity | BIGINT | No | Unique identifier for a purchase order. |
| discount_amount | NOT NULL | DECIMAL(10,2) | No | Discount applied to the order. Defaults to 0. |
| idempotency_key | UNIQUE | VARCHAR(100) | Yes | Key preventing duplicate purchase transactions from retried requests. |
| order_number | UNIQUE, NOT NULL | VARCHAR(50) | No | Human-readable order number. |
| ordered_at | NOT NULL | TIMESTAMP | No | Date and time the order was placed. |
| paid_at | — | TIMESTAMP | Yes | Date and time payment was confirmed. |
| payment_reference | — | VARCHAR(100) | Yes | External payment reference number. |
| status | NOT NULL | VARCHAR(20) | No | Order state: pending, completed, cancelled, or refunded. Defaults to pending. |
| subtotal | NOT NULL | DECIMAL(10,2) | No | Sum of item prices before discount. |
| total_amount | NOT NULL | DECIMAL(10,2) | No | Final amount charged. |
| learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Learner who placed the order. |

The LEARNER_ORDERS table stores certification purchase orders of individual learners. One order contains many order details.

### DATA DICTIONARY OF LEARNER_ORDER_DETAILS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| order_detail_id | PK, identity | BIGINT | No | Unique identifier for an order line item. |
| price | NOT NULL | DECIMAL(10,2) | No | Price of the certification at purchase time. |
| certification_id | FK → CERTIFICATIONS, NOT NULL | BIGINT | No | Certification being purchased. |
| order_id | FK → LEARNER_ORDERS, NOT NULL | BIGINT | No | Order the line item belongs to. |

The LEARNER_ORDER_DETAILS table stores the line items of a purchase order. Many details belong to one order, each referencing one certification.

### DATA DICTIONARY OF LEARNER_CERTIFICATIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| learner_certification_id | PK, identity | BIGINT | No | Unique identifier for an enrollment. |
| diagnostic_attempt_id | — | BIGINT | Yes | Attempt id of the completed diagnostic. |
| diagnostic_completed_at | — | TIMESTAMP | Yes | Set once the learner submits the certification's diagnostic assessment. |
| enrolled_at | NOT NULL | TIMESTAMP | No | Date and time of enrollment. |
| status | NOT NULL | VARCHAR(20) | No | Enrollment state: active, expired, or revoked. Defaults to active. |
| certification_id | FK → CERTIFICATIONS, NOT NULL | BIGINT | No | Certification enrolled in. |
| learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Enrolled learner. |
| order_detail_id | FK → LEARNER_ORDER_DETAILS, UNIQUE, NOT NULL | BIGINT | No | Order line item that paid for this enrollment (one-to-one). |

The LEARNER_CERTIFICATIONS table stores learner enrollments in certifications. Each enrollment is backed by exactly one order detail and is referenced by assessment attempts.

### DATA DICTIONARY OF INSTITUTION_CERTIFICATION_LEARNERS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| institution_cert_learner_id | PK, identity | BIGINT | No | Unique identifier for an institution certification learner. |
| assigned_at | NOT NULL | TIMESTAMP | No | Date and time the learner was assigned the certification. |
| completed_at | — | TIMESTAMP | Yes | Date and time the learner completed the certification. |
| progress_percentage | NOT NULL | DECIMAL(5,2) | No | Learner's progress through the certification, from 0 to 100. |
| status | NOT NULL | VARCHAR(20) | No | Status of the assignment. Defaults to active. |
| learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Reference to the learner this record belongs to. |
| institution_cert_id | FK → INSTITUTION_CERTIFICATES, NOT NULL | BIGINT | No | Reference to the institution certificate this record belongs to. |

The INSTITUTION_CERTIFICATION_LEARNERS table records which learners an institution has assigned to a purchased certification, with their progress and completion. Each row uses one of the institution's learner slots.

### DATA DICTIONARY OF LEARNER_CERTIFICATION_AWARDS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| award_id | PK, identity | BIGINT | No | Unique identifier for a learner certification award. |
| learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Reference to the learner this record belongs to. |
| certification_id | FK → CERTIFICATIONS, NOT NULL | BIGINT | No | Reference to the certification this record belongs to. |
| assessment_attempt_id | FK → ASSESSMENT_ATTEMPTS | BIGINT | Yes | Reference to the assessment attempt this record belongs to. |
| score_percentage | — | DECIMAL(5,2) | Yes | Mock exam score that earned the award. |
| badge_awarded_at | — | TIMESTAMP | Yes | Date and time the certification badge was awarded. |
| certificate_number | UNIQUE | VARCHAR(40) | Yes | Unique number printed on the certificate of completion. |
| certificate_awarded_at | — | TIMESTAMP | Yes | Date and time the certificate of completion was issued. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the record was created. Defaults to now(). |

The LEARNER_CERTIFICATION_AWARDS table stores what a learner has earned on one certification: its badge and a certificate of completion, both granted by passing the mock exam. One row per learner and certification; the timestamps record which has been granted, so a retake never awards the same thing twice.

---

## 8. BILLING AND SUBSCRIPTIONS

### DATA DICTIONARY OF SUBSCRIPTION_PLANS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| subscription_plan_id | PK, identity | BIGINT | No | Unique identifier for a plan. |
| amount | NOT NULL | DECIMAL(12,2) | No | Price per billing interval. Defaults to 0. |
| billing_interval | NOT NULL | VARCHAR(20) | No | Billing cycle: NONE, MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL, or CUSTOM. Defaults to NONE. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the plan was created. |
| currency | NOT NULL | VARCHAR(3) | No | ISO currency code. Defaults to PHP. |
| customer_type | NOT NULL | VARCHAR(20) | No | Who the plan targets: INDIVIDUAL (B2C) or INSTITUTION (B2B). |
| description | — | TEXT | Yes | Marketing description of the plan. |
| display_order | NOT NULL | INTEGER | No | Ordering of the plan in pricing pages. Defaults to 0. |
| is_custom_pricing | NOT NULL | BOOLEAN | No | Whether pricing is negotiated per contract. Defaults to false. |
| is_free | NOT NULL | BOOLEAN | No | Whether the plan is free. Defaults to false. |
| plan_code | UNIQUE, NOT NULL | VARCHAR(50) | No | Machine-readable code of the plan. |
| plan_name | NOT NULL | VARCHAR(150) | No | Display name of the plan. |
| status | NOT NULL | VARCHAR(20) | No | Plan availability state. Defaults to ACTIVE. |
| updated_at | NOT NULL | TIMESTAMP | No | Date and time the plan was last updated. |

The SUBSCRIPTION_PLANS table stores purchasable B2C and B2B plans. One plan owns many entitlements and is referenced by learner subscriptions and institutional licenses.

### DATA DICTIONARY OF PLAN_ENTITLEMENTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| plan_entitlement_id | PK, identity | BIGINT | No | Unique identifier for an entitlement. |
| enabled | NOT NULL | BOOLEAN | No | Whether the entitlement is switched on. Defaults to true. |
| entitlement_code | NOT NULL | VARCHAR(60) | No | Code of the feature or limit (e.g. SEAT_LIMIT). |
| limit_value | — | INTEGER | Yes | Capacity limit value when the entitlement is a limit (e.g. 75 seats). |
| subscription_plan_id | FK → SUBSCRIPTION_PLANS, NOT NULL | BIGINT | No | Plan granting the entitlement. |

The PLAN_ENTITLEMENTS table stores the feature flags and capacity limits granted by each plan. Many entitlements belong to one subscription plan.

### DATA DICTIONARY OF LEARNER_SUBSCRIPTIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| learner_subscription_id | PK, identity | BIGINT | No | Unique identifier for a subscription. |
| cancel_at_period_end | NOT NULL | BOOLEAN | No | Whether the subscription cancels at the period end. Defaults to false. |
| canceled_at | — | TIMESTAMP | Yes | Date and time cancellation was requested. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the record was created. |
| current_period_end | — | TIMESTAMP | Yes | End of the current billing period. |
| current_period_start | — | TIMESTAMP | Yes | Start of the current billing period. |
| ended_at | — | TIMESTAMP | Yes | Date and time the subscription fully ended. |
| provider | — | VARCHAR(30) | Yes | Payment provider handling the subscription. |
| provider_subscription_id | — | VARCHAR(100) | Yes | Subscription id on the payment provider. |
| started_at | — | TIMESTAMP | Yes | Date and time the subscription started. |
| status | NOT NULL | VARCHAR(20) | No | Lifecycle: PENDING, TRIALING, ACTIVE, PAST_DUE, SUSPENDED, CANCELED, EXPIRED, or PAYMENT_FAILED. Defaults to PENDING. |
| updated_at | NOT NULL | TIMESTAMP | No | Date and time the record was last updated. |
| learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Subscribing learner. |
| subscription_plan_id | FK → SUBSCRIPTION_PLANS, NOT NULL | BIGINT | No | Individual plan subscribed to. |
| amount_paid | — | DECIMAL(12,2) | Yes | Amount the learner paid for the subscription. |
| paid_at | — | TIMESTAMP | Yes | Date and time the payment was received. |
| review_note | — | VARCHAR(500) | Yes | Admin note recorded when the payment was reviewed. |
| reviewed_at | — | TIMESTAMP | Yes | Date and time an admin reviewed the payment. |
| reviewed_by_user_id | — | BIGINT | Yes | Admin account that reviewed the payment. |
| refund_id | — | VARCHAR(100) | Yes | Payment provider's identifier for the refund, if refunded. |
| refunded_at | — | TIMESTAMP | Yes | Date and time the payment was refunded. |

The LEARNER_SUBSCRIPTIONS table stores a learner's personal (B2C) subscription to an individual plan. Many subscriptions can reference one plan.

### DATA DICTIONARY OF INSTITUTIONAL_LICENSES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| institutional_license_id | PK, identity | BIGINT | No | Unique identifier for a license. |
| cancel_at_period_end | NOT NULL | BOOLEAN | No | Whether the license cancels at the period end. Defaults to false. |
| canceled_at | — | TIMESTAMP | Yes | Date and time cancellation was requested. |
| contract_number | — | VARCHAR(60) | Yes | Internal contract reference number. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the record was created. |
| current_period_end | — | TIMESTAMP | Yes | End of the current contract period. |
| current_period_start | — | TIMESTAMP | Yes | Start of the current contract period. |
| custom_authority_limit | — | INTEGER | Yes | Contract override of the plan's authority limit. |
| custom_certification_limit | — | INTEGER | Yes | Contract override of the plan's certification limit. |
| custom_group_limit | — | INTEGER | Yes | Contract override of the plan's group limit. |
| custom_seat_limit | — | INTEGER | Yes | Contract override of the plan's seat limit; null uses the plan's limit. |
| license_status | NOT NULL | VARCHAR(20) | No | Lifecycle: PENDING, TRIALING, ACTIVE, PAST_DUE, SUSPENDED, CANCELED, EXPIRED, or PAYMENT_FAILED. Defaults to PENDING. |
| updated_at | NOT NULL | TIMESTAMP | No | Date and time the record was last updated. |
| institution_id | FK → INSTITUTIONS, NOT NULL | BIGINT | No | Institution holding the license. |
| subscription_plan_id | FK → SUBSCRIPTION_PLANS, NOT NULL | BIGINT | No | Institution plan licensed. |

The INSTITUTIONAL_LICENSES table stores an institution's (B2B) license to an institution plan, with optional per-contract limit overrides. Many licenses can reference one plan.

### DATA DICTIONARY OF AI_GENERATION_USAGE

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| ai_generation_usage_id | PK, identity | BIGINT | No | Unique identifier for an ai generation usage. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the record was created. |
| kind | NOT NULL | VARCHAR(20) | No | Kind of AI generation used, such as a quiz or flashcards. |
| learner_id | NOT NULL | BIGINT | No | Learner who used the AI generation. |
| usage_date | NOT NULL | DATE | No | Day the generation counts against, for daily limits. |

The AI_GENERATION_USAGE table stores one study aid the AI tutor generated for a learner; counted against the daily cap.

---

## 9. INSTITUTIONS AND PARTNERSHIPS (B2B)

### DATA DICTIONARY OF INSTITUTIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| institution_id | PK, identity | BIGINT | No | Unique identifier for an institution. |
| address | — | TEXT | Yes | Physical address of the institution. |
| industry | NOT NULL | VARCHAR(100) | No | Industry the institution operates in. |
| institution_name | UNIQUE, NOT NULL | VARCHAR(150) | No | Registered name of the institution. |
| is_verified | NOT NULL | BOOLEAN | No | Whether the institution has passed verification. Defaults to false. |
| joined_at | — | TIMESTAMP | Yes | Date and time the institution was onboarded. |
| institution_type | NOT NULL | VARCHAR(50) | No | Kind of institution, such as a school, university, or company. |
| primary_contact_email | NOT NULL | VARCHAR(254) | No | E-mail of the primary contact person. |
| primary_contact_name | NOT NULL | VARCHAR(100) | No | Name of the primary contact person. |
| primary_contact_phone | — | VARCHAR(30) | Yes | Phone number of the primary contact person. |

The INSTITUTIONS table stores partner institutions. One institution owns department heads, certificates (slot allocations), groups, files, invoices, and licenses.

### DATA DICTIONARY OF DEPARTMENT_HEADS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| department_head_id | PK, identity | BIGINT | No | Unique identifier for a membership. |
| first_name | — | VARCHAR(100) | Yes | Department head's first name. |
| is_primary_contact | NOT NULL | BOOLEAN | No | Whether this member is the primary contact. Defaults to false. |
| joined_at | NOT NULL | TIMESTAMP | No | Date and time the member joined the institution. |
| last_name | — | VARCHAR(100) | Yes | Department head's last name. |
| head_role | NOT NULL | VARCHAR(20) | No | Role in the institution: owner, manager, or staff. Defaults to manager. |
| institution_id | FK → INSTITUTIONS, NOT NULL | BIGINT | No | Institution the member belongs to. |
| user_id | FK → USERS, NOT NULL | BIGINT | No | User account of the member. |

The DEPARTMENT_HEADS table links user accounts to institutions with a role. A user can belong to an institution only once.

### DATA DICTIONARY OF PARTNERSHIP_REQUESTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| request_id | PK, identity | BIGINT | No | Unique identifier for a partnership request. |
| admin_remarks | — | TEXT | Yes | Admin notes on approval or rejection. |
| business_description | — | TEXT | Yes | Description of the requesting business. |
| contact_number | — | VARCHAR(40) | Yes | Contact phone number on the request. |
| contact_person_name | — | VARCHAR(150) | Yes | Contact person named on the request. |
| idempotency_key | UNIQUE | VARCHAR(64) | Yes | Prevents duplicate submissions of the same request. |
| institution_address | — | TEXT | Yes | Address of the institution requesting the partnership. |
| institution_email | — | VARCHAR(254) | Yes | Contact e-mail of the requesting institution. |
| institution_name | — | VARCHAR(150) | Yes | Name of the requesting institution. |
| reference_number | UNIQUE | VARCHAR(32) | Yes | Public reference number returned to the requester for status lookup. |
| reviewed_at | — | TIMESTAMP | Yes | Date and time an admin reviewed the request. |
| reviewed_by | — | VARCHAR(150) | Yes | Name of the admin who reviewed the request. |
| status | NOT NULL | VARCHAR(25) | No | Request state: PENDING, UNDER_REVIEW, MEETING_SCHEDULED, APPROVED, REJECTED, or CANCELLED. Defaults to PENDING. |
| submitted_at | NOT NULL | TIMESTAMP | No | Date and time the request was submitted. |
| version | NOT NULL | BIGINT | No | Optimistic-locking version, incremented on every update. |
| institution_id | FK → INSTITUTIONS | BIGINT | Yes | Null until the request is approved and an institution record is created. |
| request_type | — | VARCHAR(20) | Yes | Kind of request: a new partnership or a top-up of an existing one. |

The PARTNERSHIP_REQUESTS table stores public partnership applications from institutions, and top-up requests from existing partners. One request owns many request items and may result in one institution and its invoice.

### DATA DICTIONARY OF PARTNERSHIP_REQUEST_ITEMS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| partnership_request_item_id | PK, identity | BIGINT | No | Unique identifier for a request line item. |
| requested_access_end_date | — | DATE | Yes | Requested end of access. |
| requested_access_start_date | — | DATE | Yes | Requested start of access; the admin sets the real window on approval. |
| slots | NOT NULL | INTEGER | No | Number of learner slots requested. |
| certification_id | FK → CERTIFICATIONS, NOT NULL | BIGINT | No | Certification being requested. |
| request_id | FK → PARTNERSHIP_REQUESTS, NOT NULL | BIGINT | No | Partnership request the item belongs to. |

The PARTNERSHIP_REQUEST_ITEMS table stores the certifications and slot counts requested in a partnership application. Many items belong to one request.

### DATA DICTIONARY OF INSTITUTION_INVOICES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| institution_invoice_id | PK, identity | BIGINT | No | Unique identifier for an invoice. |
| institution_id | FK → INSTITUTIONS, NOT NULL | BIGINT | No | Institution being billed. |
| invoice_number | UNIQUE, NOT NULL | VARCHAR(50) | No | Human-readable invoice number. |
| invoice_type | NOT NULL | VARCHAR(30) | No | Reason for the invoice: initial_access or renewal. |
| partnership_request_id | FK → PARTNERSHIP_REQUESTS | BIGINT | Yes | Approved partnership request that generated the invoice. |
| bill_to_name | NOT NULL | VARCHAR(150) | No | Billing contact name. |
| bill_to_email | NOT NULL | VARCHAR(254) | No | Billing contact e-mail. |
| currency | NOT NULL | VARCHAR(3) | No | Currency of the amounts. Defaults to PHP. |
| subtotal | NOT NULL | DECIMAL(12,2) | No | Sum of line items before discount and tax. |
| discount_amount | NOT NULL | DECIMAL(12,2) | No | Discount applied. Defaults to 0. |
| tax_rate | NOT NULL | DECIMAL(5,2) | No | Tax rate applied. Defaults to 0. |
| tax_amount | NOT NULL | DECIMAL(12,2) | No | Tax amount charged. Defaults to 0. |
| total_amount | NOT NULL | DECIMAL(12,2) | No | Final amount due. |
| issued_at | NOT NULL | TIMESTAMP | No | Date and time the invoice was issued. |
| due_at | — | TIMESTAMP | Yes | Date and time payment is due. |
| payment_reference | — | VARCHAR(100) | Yes | Payment reference submitted by the institution. |
| payment_proof_key | — | VARCHAR(500) | Yes | S3 key of the uploaded payment proof. |
| verified_by_user_id | FK → USERS | BIGINT | Yes | Admin who verified the payment. |
| paid_at | — | TIMESTAMP | Yes | Date and time payment was confirmed. |
| status | NOT NULL | VARCHAR(30) | No | Invoice state: draft, issued, payment_submitted, paid, rejected, cancelled, or VOID. Defaults to issued. |
| checkout_session_id | — | VARCHAR(100) | Yes | Payment provider's checkout session identifier. |
| checkout_url | — | TEXT | Yes | Payment page the institution is sent to. |
| provider_payment_id | — | VARCHAR(100) | Yes | Payment provider's identifier for the payment. |
| refund_reference | — | VARCHAR(120) | Yes | Reference number of the refund, if refunded. |
| refunded_amount | — | DECIMAL(12,2) | Yes | Amount refunded to the institution. |
| refunded_at | — | TIMESTAMP | Yes | Date and time the refund was made. |
| refund_status | — | VARCHAR(20) | Yes | Status of the refund, if one was requested. |

The INSTITUTION_INVOICES table stores B2B invoices for initial access and renewals. One invoice contains many invoice items and traces back to the request that produced it.

### DATA DICTIONARY OF INSTITUTION_INVOICE_ITEMS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| institution_invoice_item_id | PK, identity | BIGINT | No | Unique identifier for an invoice line item. |
| institution_invoice_id | FK → INSTITUTION_INVOICES, NOT NULL | BIGINT | No | Invoice the line item belongs to. |
| certification_id | FK → CERTIFICATIONS, NOT NULL | BIGINT | No | Certification being billed. |
| certification_title | NOT NULL | VARCHAR(150) | No | Title of the certification billed, kept as it was at invoicing. |
| learner_slots | NOT NULL | INTEGER | No | Number of learner slots billed. |
| unit_price | NOT NULL | DECIMAL(12,2) | No | Price per learner slot. |
| line_total | NOT NULL | DECIMAL(12,2) | No | Total for the line: slots multiplied by unit price. |
| access_start_date | — | DATE | Yes | First day of the access the line pays for. |
| access_end_date | — | DATE | Yes | Last day of the access the line pays for. |

The INSTITUTION_INVOICE_ITEMS table stores the line items of an institution invoice. Many items belong to one invoice, each referencing one certification.

### DATA DICTIONARY OF LEARNER_INVITATIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| invitation_id | PK, identity | BIGINT | No | Unique identifier for an invitation. |
| accepted_at | — | TIMESTAMP | Yes | Date and time the invitation was accepted. |
| email | NOT NULL | VARCHAR(254) | No | E-mail address the invitation was sent to. |
| expires_at | NOT NULL | TIMESTAMP | No | Date and time the invitation expires. |
| first_name | — | VARCHAR(100) | Yes | Invited learner's first name. |
| last_name | — | VARCHAR(100) | Yes | Invited learner's last name. |
| sent_at | NOT NULL | TIMESTAMP | No | Date and time the invitation was sent. |
| status | NOT NULL | VARCHAR(20) | No | Invitation state: PENDING, ACCEPTED, EXPIRED, or REVOKED. Defaults to PENDING. |
| token_hash | UNIQUE, NOT NULL | VARCHAR(255) | No | Hashed acceptance token of the invitation link. |
| department_id | FK → DEPARTMENTS | BIGINT | Yes | Group the learner joins on accepting the invitation. |
| invited_by | FK → USERS | BIGINT | Yes | Group leader who sent the invitation. |
| learner_id | FK → LEARNERS | BIGINT | Yes | Learner account, once the invitee has one. |
| institution_cert_id | FK → INSTITUTION_CERTIFICATES, NOT NULL | BIGINT | No | Reference to the institution certificate this record belongs to. |
| section_id | FK → INSTITUTION_SECTIONS | BIGINT | Yes | Section the learner joins on accepting, if the invitation was sent for one. |

The LEARNER_INVITATIONS table stores invitations a group leader sends to enroll learners into an institution's sponsored certification slots. Many invitations belong to one institution certificate and one group.

### DATA DICTIONARY OF INSTITUTION_CERTIFICATES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| institution_cert_id | PK, identity | BIGINT | No | Unique identifier for an institution certificate. |
| access_expiry_date | NOT NULL | DATE | No | Last day the institution's learners can access the certification. |
| access_start_date | NOT NULL | DATE | No | First day the institution's learners can access the certification. |
| remaining_slots | — | INTEGER | Yes | Learner slots still free; computed by the database as total minus used. |
| status | NOT NULL | VARCHAR(20) | No | Status of the institution's access. Defaults to active. |
| total_slots | NOT NULL | INTEGER | No | Learner slots the institution purchased. |
| used_slots | NOT NULL | INTEGER | No | Learner slots already assigned. Defaults to 0. |
| version | NOT NULL | BIGINT | No | Optimistic-locking version; prevents two invitation batches from over-allocating slots at the same time. |
| certification_id | FK → CERTIFICATIONS, NOT NULL | BIGINT | No | Reference to the certification this record belongs to. |
| institution_id | FK → INSTITUTIONS, NOT NULL | BIGINT | No | Reference to the institution this record belongs to. |

The INSTITUTION_CERTIFICATES table stores an institution's purchased access to a certification: how many learner slots it bought and has used, and the period the access is valid.

### DATA DICTIONARY OF INSTITUTION_FILES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| institution_file_id | PK, identity | BIGINT | No | Unique identifier for an institution file. |
| content_type | — | VARCHAR(120) | Yes | MIME type of the file. |
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the record was created. |
| file_name | NOT NULL | VARCHAR(255) | No | Original file name. |
| file_size | NOT NULL | BIGINT | No | Size of the file in bytes. |
| storage_key | NOT NULL | VARCHAR(500) | No | Storage (S3) key of the file. |
| institution_id | FK → INSTITUTIONS, NOT NULL | BIGINT | No | Reference to the institution this record belongs to. |
| uploaded_by_user_id | FK → USERS | BIGINT | Yes | Reference to the user this record belongs to. |

The INSTITUTION_FILES table stores the metadata of files an institution has uploaded; the files themselves are kept in S3 storage.

---

## 10. INSTITUTION GROUPS

### DATA DICTIONARY OF DEPARTMENTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| department_id | PK, identity | BIGINT | No | Unique identifier for a group. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the group was created. |
| department_description | — | VARCHAR(500) | Yes | Description of the group. |
| department_name | NOT NULL | VARCHAR(150) | No | Name of the group. |
| status | NOT NULL | VARCHAR(20) | No | Group state: active or archived. Defaults to active. |
| total_slots | NOT NULL | INTEGER | No | Learner slots allocated to the group. Defaults to 0. |
| used_slots | NOT NULL | INTEGER | No | Learner slots the group has assigned. Defaults to 0. |
| created_by | FK → USERS, NOT NULL | BIGINT | No | User who created the group. |
| institution_id | FK → INSTITUTIONS, NOT NULL | BIGINT | No | Institution that owns the group. |
| institution_cert_id | FK → INSTITUTION_CERTIFICATES, NOT NULL | BIGINT | No | Reference to the institution certificate this record belongs to. |

The DEPARTMENTS table stores learner groupings inside an institution's certification allocation. One group has many authorities and many assignees.

### DATA DICTIONARY OF DEPARTMENT_HEAD_ASSIGNMENTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| department_head_assignment_id | PK, identity | BIGINT | No | Unique identifier for an authority assignment. |
| assigned_at | NOT NULL | TIMESTAMP | No | Date and time the authority was granted. |
| removed_at | — | TIMESTAMP | Yes | Date and time the authority was removed. |
| status | NOT NULL | VARCHAR(20) | No | Assignment state: active or archived. Defaults to active. |
| assigned_by | FK → USERS, NOT NULL | BIGINT | No | User who granted the authority. |
| department_id | FK → DEPARTMENTS, NOT NULL | BIGINT | No | Group being managed. |
| user_id | FK → USERS, NOT NULL | BIGINT | No | User granted authority over the group. |

The DEPARTMENT_HEAD_ASSIGNMENTS table stores the users (e.g. instructors) authorized to manage a group. A user can be an authority of a group only once.

### DATA DICTIONARY OF DEPARTMENT_LEARNERS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| department_learner_id | PK, identity | BIGINT | No | Unique identifier for a group membership. |
| assigned_at | NOT NULL | TIMESTAMP | No | Date and time the learner was assigned. |
| removed_at | — | TIMESTAMP | Yes | Date and time the learner was removed from the group. |
| role | NOT NULL | VARCHAR(20) | No | Learner's role within the group. Defaults to member. |
| status | NOT NULL | VARCHAR(20) | No | Membership state: active or archived. Defaults to active. |
| assigned_by | FK → USERS, NOT NULL | BIGINT | No | User who assigned the learner. |
| department_id | FK → DEPARTMENTS, NOT NULL | BIGINT | No | Group the learner is assigned to. |
| institution_cert_learner_id | FK → INSTITUTION_CERTIFICATION_LEARNERS, NOT NULL | BIGINT | No | Reference to the institution certification learner this record belongs to. |
| section_id | FK → INSTITUTION_SECTIONS | BIGINT | Yes | Section within the group the learner belongs to; null if unsectioned. |

The DEPARTMENT_LEARNERS table places sponsored learners into institution groups. A sponsored enrollment can appear in a group only once.

### DATA DICTIONARY OF DEPARTMENT_ANNOUNCEMENTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| department_announcement_id | PK, identity | BIGINT | No | Unique identifier for a department announcement. |
| body | NOT NULL | TEXT | No | Text of the announcement. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the record was created. |
| pinned | NOT NULL | BOOLEAN | No | Whether the announcement is pinned to the top. Defaults to false. |
| status | NOT NULL | VARCHAR(20) | No | Status of the announcement. Defaults to active. |
| title | NOT NULL | VARCHAR(200) | No | Title of the announcement. |
| updated_at | — | TIMESTAMP | Yes | Date and time the record was last updated. |
| created_by | FK → USERS | BIGINT | Yes | Account that wrote the announcement; null if that account was deleted. |
| department_id | FK → DEPARTMENTS, NOT NULL | BIGINT | No | Reference to the department this record belongs to. |

The DEPARTMENT_ANNOUNCEMENTS table stores a message a group's leader posts to that group. Archived rather than deleted.

### DATA DICTIONARY OF INSTITUTION_SECTIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| section_id | PK, identity | BIGINT | No | Unique identifier for an institution section. |
| department_id | FK → DEPARTMENTS, NOT NULL | BIGINT | No | Reference to the department this record belongs to. |
| section_name | NOT NULL | VARCHAR(150) | No | Name of the section within the group. |
| description | — | TEXT | Yes | Description of the section. |
| created_by | FK → USERS | BIGINT | Yes | Reference to the user this record belongs to. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the record was created. Defaults to now(). |
| status | NOT NULL | VARCHAR(20) | No | Status of the section. Defaults to active. |

The INSTITUTION_SECTIONS table stores a section inside a department (institution group): the department head's own subdivision -- a class, a batch, a block -- that learners are invited into and tracked under. Archiving a section keeps its learners in the department; only the grouping goes.

---

## 11. COMMUNITY

### DATA DICTIONARY OF COMMUNITY_CIRCLES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| circle_id | PK, identity | BIGINT | No | Unique identifier for a study circle. |
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the circle was created. |
| description | NOT NULL | VARCHAR(1000) | No | Description of the circle. |
| name | NOT NULL | VARCHAR(120) | No | Name of the circle. |
| topic | NOT NULL | VARCHAR(120) | No | Topic the circle focuses on. |
| owner_learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Learner who created and owns the circle. |
| visibility | — | VARCHAR(16) | Yes | Who can see the circle: PUBLIC or PRIVATE. Defaults to PUBLIC. |

The COMMUNITY_CIRCLES table stores learner-created study circles. One circle has many members and many posts.

### DATA DICTIONARY OF COMMUNITY_CIRCLE_MEMBERS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| joined_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the learner joined. |
| circle_id | PK, FK → COMMUNITY_CIRCLES | BIGINT | No | Circle the learner joined. |
| learner_id | PK, FK → LEARNERS | BIGINT | No | Learner who joined the circle. |

The COMMUNITY_CIRCLE_MEMBERS table is the junction between circles and learners, recording circle membership.

### DATA DICTIONARY OF COMMUNITY_POSTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| post_id | PK, identity | BIGINT | No | Unique identifier for a post. |
| attachment_key | — | VARCHAR(500) | Yes | S3 key of the uploaded attachment; null when the post has none. |
| attachment_name | — | VARCHAR(255) | Yes | Original filename of the attachment. |
| attachment_size | — | BIGINT | Yes | Size of the attached file in bytes. |
| attachment_type | — | VARCHAR(16) | Yes | File type of the attachment (pdf, docx). |
| body | NOT NULL | TEXT | No | Body content of the post. |
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the post was created. |
| moderation_status | NOT NULL | VARCHAR(16) | No | Moderation state of the post: VISIBLE or HIDDEN. |
| post_type | NOT NULL | VARCHAR(24) | No | Kind of post: discussion, quizzes, notes, docx, or circle. |
| title | NOT NULL | VARCHAR(180) | No | Title of the post. |
| updated_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the post was last edited. |
| author_learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Learner who authored the post. |
| circle_id | FK → COMMUNITY_CIRCLES | BIGINT | Yes | Circle the post belongs to; null for public feed posts. |
| shared_library_item_id | FK → LEARNER_LIBRARY_ITEMS | BIGINT | Yes | Generated quiz or flashcard set shared by the post, if any. |
| attachments_json | — | TEXT | Yes | Every file attached to the post (name, storage key, size), as a JSON array. |

The COMMUNITY_POSTS table stores learner posts in the community feed and inside circles. One post has many comments, likes, and saves.

### DATA DICTIONARY OF COMMUNITY_COMMENTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| comment_id | PK, identity | BIGINT | No | Unique identifier for a comment. |
| body | NOT NULL | VARCHAR(2000) | No | Text of the comment. |
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the comment was created. |
| updated_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the comment was last edited. |
| author_learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Learner who wrote the comment. |
| parent_comment_id | FK → COMMUNITY_COMMENTS | BIGINT | Yes | Parent comment when this is a reply. |
| post_id | FK → COMMUNITY_POSTS, NOT NULL | BIGINT | No | Post being commented on. |

The COMMUNITY_COMMENTS table stores comments and threaded replies on posts. Many comments belong to one post, and a comment may parent many replies.

### DATA DICTIONARY OF COMMUNITY_POST_LIKES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the like was made. |
| learner_id | PK, FK → LEARNERS | BIGINT | No | Learner who liked the post. |
| post_id | PK, FK → COMMUNITY_POSTS | BIGINT | No | Post that was liked. |

The COMMUNITY_POST_LIKES table is the junction between posts and learners recording likes; a learner can like a post only once.

### DATA DICTIONARY OF COMMUNITY_SAVED_POSTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the post was saved. |
| learner_id | PK, FK → LEARNERS | BIGINT | No | Learner who saved the post. |
| post_id | PK, FK → COMMUNITY_POSTS | BIGINT | No | Post that was saved. |

The COMMUNITY_SAVED_POSTS table is the junction between posts and learners recording bookmarks; a learner can save a post only once.

### DATA DICTIONARY OF COMMUNITY_POST_REPORTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| report_id | PK, identity | BIGINT | No | Unique identifier for a community post report. |
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the record was created. Defaults to now(). |
| details | — | TEXT | Yes | Reporter's explanation of the problem. |
| reason | NOT NULL | VARCHAR(48) | No | Reason category chosen by the reporter. |
| reviewed_at | — | TIMESTAMP WITH TIME ZONE | Yes | Date and time a moderator reviewed the report. |
| status | NOT NULL | VARCHAR(16) | No | Moderation status of the report. Defaults to OPEN. |
| post_id | FK → COMMUNITY_POSTS, NOT NULL | BIGINT | No | Reference to the community post this record belongs to. |
| reporter_learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Reference to the learner this record belongs to. |
| reviewed_by_user_id | FK → USERS | BIGINT | Yes | Reference to the user this record belongs to. |

The COMMUNITY_POST_REPORTS table: sPAM | HARASSMENT | COPYRIGHT | EXAM_CONTENT | OTHER (see V32 CHECK constraint).

### DATA DICTIONARY OF COMMUNITY_POST_VIEWS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the record was created. |
| last_viewed_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the learner last viewed the post. |
| learner_id | PK, FK → LEARNERS | BIGINT | No | Unique identifier for a community post view. |
| post_id | PK, FK → COMMUNITY_POSTS | BIGINT | No | Unique identifier for a community post view. |

The COMMUNITY_POST_VIEWS table: one learner having opened one shared post: the quiz they attempted, the flashcards they studied, the reviewer they read.  <p>Keyed on (post, learner) rather than appended per open, so the count a post

### DATA DICTIONARY OF LEARNER_COMMUNITY_NOTIFICATIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| notification_id | PK, identity | BIGINT | No | Unique identifier for a learner community notification. |
| body | NOT NULL | TEXT | No | Text of the notification. |
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the record was created. |
| href | — | VARCHAR(240) | Yes | Page the notification links to. |
| read_at | — | TIMESTAMP WITH TIME ZONE | Yes | Date and time the learner read the notification. |
| title | NOT NULL | VARCHAR(180) | No | Title of the notification. |
| learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Reference to the learner this record belongs to. |

The LEARNER_COMMUNITY_NOTIFICATIONS table stores community notifications for learners, such as replies to their posts, with a link to the post and when it was read.

---

## 12. LEARNING TOOLS

### DATA DICTIONARY OF LEARNER_LIBRARY_ITEMS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| library_item_id | PK, identity | BIGINT | No | Unique identifier for a library item. |
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the item was created. |
| description | — | VARCHAR(1000) | Yes | Description or note body of the item. |
| item_type | NOT NULL | VARCHAR(24) | No | Kind of item: quiz, flashcard, file, link, or note. |
| resource_url | — | VARCHAR(1000) | Yes | A pasted URL for link items, or a raw S3 key for file items. |
| title | NOT NULL | VARCHAR(180) | No | Title of the library item. |
| updated_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the item was last updated. |
| certification_id | FK → CERTIFICATIONS | BIGINT | Yes | Certification the item is tagged to. |
| learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Learner who owns the item. |
| lesson_id | FK → LESSONS | BIGINT | Yes | Lesson the item is tagged to. |

The LEARNER_LIBRARY_ITEMS table stores a learner's personal study library (quizzes, flashcards, files, links, notes). Many items belong to one learner and may reference a certification or lesson.

### DATA DICTIONARY OF LEARNER_MISTAKE_REVIEWS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| reviewed_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the mistake was marked as reviewed. |
| learner_id | PK, FK → LEARNERS | BIGINT | No | Learner who reviewed the mistake. |
| source_question_id | PK, FK → QUESTIONS | BIGINT | No | Question the mistake was made on. |

The LEARNER_MISTAKE_REVIEWS table marks one mistake (learner + source question) as reviewed in the mistakes bank. It is a junction between learners and questions.

### DATA DICTIONARY OF GENERATED_STUDY_ITEMS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| study_item_id | PK, identity | BIGINT | No | Unique identifier for a generated study item. |
| accepted_answers_json | — | JSONB | Yes | Accepted answers for a written item, as JSON. |
| choices_json | — | JSONB | Yes | Answer choices for a multiple-choice item, as JSON. |
| correct_answer | — | TEXT | Yes | Correct answer of the item. |
| difficulty | — | VARCHAR(16) | Yes | Difficulty level of the item. |
| display_order | NOT NULL | INTEGER | No | Position of the item within its set. |
| explanation | — | TEXT | Yes | Explanation shown after the item is answered. |
| item_type | NOT NULL | VARCHAR(32) | No | Kind of item, such as a multiple-choice question or a flashcard. |
| question_text | NOT NULL | TEXT | No | Question or flashcard prompt. |
| study_set_id | FK → GENERATED_STUDY_SETS, NOT NULL | BIGINT | No | Reference to the generated study set this record belongs to. |

The GENERATED_STUDY_ITEMS table: mCQ | SHORT_ANSWER | CRITICAL_THINKING | FLASHCARD (see V30 CHECK constraint).

### DATA DICTIONARY OF GENERATED_STUDY_SETS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| study_set_id | PK, identity | BIGINT | No | Unique identifier for a generated study set. |
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the record was created. Defaults to now(). |
| generation_version | — | VARCHAR(64) | Yes | Version of the generator that produced the set. |
| source | NOT NULL | VARCHAR(24) | No | What generated the set. Defaults to TUTOR_AI. |
| study_type | NOT NULL | VARCHAR(24) | No | Kind of set: a quiz or a flashcard deck. |
| title | NOT NULL | VARCHAR(180) | No | Title of the study set. |
| updated_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the record was last updated. Defaults to now(). |
| certification_id | FK → CERTIFICATIONS, NOT NULL | BIGINT | No | Reference to the certification this record belongs to. |
| learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Reference to the learner this record belongs to. |
| lesson_id | FK → LESSONS, NOT NULL | BIGINT | No | Reference to the lesson this record belongs to. |

The GENERATED_STUDY_SETS table: qUIZ | FLASHCARD (see V30 CHECK constraint).

### DATA DICTIONARY OF LEARNER_DASHBOARD_LAYOUTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| layout_id | PK, identity | BIGINT | No | Unique identifier for a learner dashboard layout. |
| tile_order | NOT NULL | TEXT | No | Order the learner arranged their analytics tiles in. |
| updated_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the record was last updated. |
| learner_id | FK → LEARNERS, UNIQUE, NOT NULL | BIGINT | No | Reference to the learner this record belongs to. |

The LEARNER_DASHBOARD_LAYOUTS table: the order a learner has dragged their analytics tiles into.  One row per learner, not per certification: the arrangement is a preference about how they read the page, and having it change under them w

### DATA DICTIONARY OF LEARNER_NOTES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| note_id | PK, identity | BIGINT | No | Unique identifier for a learner note. |
| body | NOT NULL | TEXT | No | Text of the note. |
| certification_id | NOT NULL | BIGINT | No | Certification the note is kept under. |
| completed_at | — | TIMESTAMP WITH TIME ZONE | Yes | Date and time the note was marked done. |
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the record was created. |
| done | NOT NULL | BOOLEAN | No | Whether the note has been marked done. |
| learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Reference to the learner this record belongs to. |

The LEARNER_NOTES table: a learner's own study note -- a checklist line on the analytics page, kept per certification so the list is about whatever they are currently studying.  Stored server-side rather than in the browser:

### DATA DICTIONARY OF LEARNER_PRACTICE_ANSWERS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| practice_answer_id | PK, identity | BIGINT | No | Unique identifier for a learner practice answer. |
| answered_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the answer was given. Defaults to now(). |
| flashcard_rating | — | VARCHAR(16) | Yes | Learner's self-rating of a flashcard: AGAIN, HARD, GOOD, or EASY. |
| is_correct | — | BOOLEAN | Yes | Whether the answer was correct. |
| learner_answer | — | TEXT | Yes | Answer as the learner gave it. |
| normalized_answer | — | TEXT | Yes | Answer normalised for comparison (case and spacing). |
| score | — | DECIMAL(38,2) | Yes | Score the answer earned. |
| attempt_id | FK → LEARNER_PRACTICE_ATTEMPTS, NOT NULL | BIGINT | No | Reference to the learner practice attempt this record belongs to. |
| study_item_id | FK → GENERATED_STUDY_ITEMS | BIGINT | Yes | Reference to the generated study item this record belongs to. |

The LEARNER_PRACTICE_ANSWERS table: aGAIN | HARD | GOOD | EASY.

### DATA DICTIONARY OF LEARNER_PRACTICE_ATTEMPTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| attempt_id | PK, identity | BIGINT | No | Unique identifier for a learner practice attempt. |
| bkt_event_id | — | VARCHAR(128) | Yes | Identifier of the mastery event sent for this attempt, if any. |
| coin_earned | NOT NULL | INTEGER | No | Coins the attempt earned. |
| completed_at | — | TIMESTAMP WITH TIME ZONE | Yes | Date and time the attempt was finished. |
| mastery_eligible | NOT NULL | BOOLEAN | No | Whether the attempt counts as mastery evidence. |
| percentage | — | DECIMAL(38,2) | Yes | Score of the attempt as a percentage. |
| score | — | DECIMAL(38,2) | Yes | Number of items answered correctly. |
| source_id | NOT NULL | BIGINT | No | Identifier of the practiced material, in the table named by source_type. |
| source_type | NOT NULL | VARCHAR(32) | No | Kind of practice: TUTOR_QUIZ, COMMUNITY_QUIZ, FLASHCARD_RECALL, CODING_CHALLENGE, DIAGRAM_CHALLENGE, or OFFICIAL_ASSESSMENT. |
| started_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the attempt began. Defaults to now(). |
| status | NOT NULL | VARCHAR(16) | No | Progress of the attempt: IN_PROGRESS, COMPLETED, or ABANDONED. |
| total_items | NOT NULL | INTEGER | No | Number of items in the attempt. |
| xp_earned | NOT NULL | INTEGER | No | Experience points the attempt earned. |
| certification_id | FK → CERTIFICATIONS | BIGINT | Yes | Reference to the certification this record belongs to. |
| learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Reference to the learner this record belongs to. |
| lesson_id | FK → LESSONS | BIGINT | Yes | Reference to the lesson this record belongs to. |

The LEARNER_PRACTICE_ATTEMPTS table: tUTOR_QUIZ | COMMUNITY_QUIZ | FLASHCARD_RECALL | CODING_CHALLENGE | DIAGRAM_CHALLENGE | OFFICIAL_ASSESSMENT.

### DATA DICTIONARY OF LEARNER_REVIEW_ITEMS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| review_item_id | PK, identity | BIGINT | No | Unique identifier for a learner review item. |
| certification_id | — | BIGINT | Yes | Certification the review item belongs to. |
| created_at | — | TIMESTAMP | Yes | Date and time the record was created. |
| due_on | NOT NULL | DATE | No | Day the item is next due for review. |
| ease_factor | NOT NULL | DOUBLE PRECISION | No | Spaced-repetition ease factor; higher means longer gaps between reviews. |
| interval_days | NOT NULL | INTEGER | No | Days until the next review. |
| lapses | NOT NULL | INTEGER | No | Times the learner has forgotten the item after learning it. |
| last_reviewed_at | — | TIMESTAMP | Yes | Date and time the item was last reviewed. |
| lesson_id | — | BIGINT | Yes | Lesson the reviewed question belongs to. |
| repetitions | NOT NULL | INTEGER | No | Number of successful reviews in a row. |
| updated_at | — | TIMESTAMP | Yes | Date and time the record was last updated. |
| learner_id | FK → LEARNERS, NOT NULL | BIGINT | No | Reference to the learner this record belongs to. |
| source_question_id | FK → QUESTIONS, NOT NULL | BIGINT | No | Reference to the question this record belongs to. |

The LEARNER_REVIEW_ITEMS table stores one thing the learner is keeping in memory, and when it next needs testing. The scheduling state behind spaced repetition, held per learner per question. REBYU had none of this: LearnerMistakeReview is a "I ticked this off" marker with a timestamp and nothing else, and the flashcard self-rating (AGAIN|HARD|GOOD|EASY) was stored but never read by anything — an SM-2 grade with no SM-2 behind it.

---

## 13. AI KNOWLEDGE BASE

### DATA DICTIONARY OF KNOWLEDGE_DOCUMENTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| knowledge_document_id | PK, identity | BIGINT | No | Unique identifier for an ingested document. |
| certification_id | — | BIGINT | Yes | Certification the document's knowledge belongs to. |
| chunk_count | — | INTEGER | Yes | Number of text chunks embedded from the document. |
| content_type | NOT NULL | VARCHAR(255) | No | MIME type of the document (PDF, DOCX). |
| file_size | — | BIGINT | Yes | Size of the file in bytes. |
| filename | NOT NULL | VARCHAR(255) | No | Stored filename of the document. |
| original_filename | NOT NULL | VARCHAR(255) | No | Filename as uploaded by the admin. |
| processed_at | — | TIMESTAMP | Yes | Date and time ingestion finished. |
| s3_key | — | VARCHAR(255) | Yes | S3 key of the stored file. |
| status | NOT NULL | VARCHAR(255) | No | Ingestion state: PROCESSING, READY, or FAILED. Defaults to PROCESSING. |
| uploaded_at | NOT NULL | TIMESTAMP | No | Date and time the document was uploaded. |
| use_case | NOT NULL | VARCHAR(255) | No | What the document is used for in AI generation: LESSON or QUESTION. Defaults to LESSON. |

The KNOWLEDGE_DOCUMENTS table stores reference documents ingested for AI lesson and question generation (RAG). One document owns many extracted images and many embedded text chunks.

### DATA DICTIONARY OF KNOWLEDGE_DOCUMENT_IMAGES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| knowledge_document_image_id | PK, identity | BIGINT | No | Unique identifier for an extracted image. |
| content_type | — | VARCHAR(100) | Yes | MIME type of the image. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the image record was created. |
| image_key | UNIQUE, NOT NULL | VARCHAR(255) | No | S3 key of the image; the same identifier saved as a question or choice image key. |
| nearby_text | — | TEXT | Yes | Short text captured near the image at extraction time (caption/context for the AI prompt). |
| order_in_page | — | INTEGER | Yes | Position of the image within its page. |
| page_number | — | INTEGER | Yes | Page the image was found on. |
| knowledge_document_id | FK → KNOWLEDGE_DOCUMENTS, NOT NULL | BIGINT | No | Document the image was extracted from. |

The KNOWLEDGE_DOCUMENT_IMAGES table stores images extracted from ingested documents during ingestion. Many images belong to one knowledge document; the images are linked from text-chunk metadata, never embedded.

### DATA DICTIONARY OF GENERATION_REQUESTS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| generation_request_id | PK, identity | BIGINT | No | Unique identifier for a generation request. |
| certification_id | NOT NULL | BIGINT | No | Certification the generation is for. |
| completed_at | — | TIMESTAMP | Yes | Date and time the generation finished. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the record was created. |
| error_message | — | TEXT | Yes | Error reported if the generation failed. |
| params_json | — | TEXT | Yes | Parameters of the request, as JSON. |
| request_type | NOT NULL | VARCHAR(20) | No | Kind of generation requested. |
| status | NOT NULL | VARCHAR(20) | No | Progress of the request. Defaults to PENDING. |
| triggered_by_user_id | — | BIGINT | Yes | Admin account that started the generation. |
| updated_at | — | TIMESTAMP | Yes | Date and time the record was last updated. |

The GENERATION_REQUESTS table stores persisted record of an admin-triggered AI generation request. The RabbitMQ trigger message published for this request carries only this row's id -- the consumer re-fetches paramsJson and re-derives everything else from the database, never from the message body itself.

---

## 14. BKT INTEGRATION

### DATA DICTIONARY OF BKT_EVENT_OUTBOX

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| id | PK, identity | BIGINT | No | Unique identifier for an outbox row. |
| attempt_no | — | INTEGER | Yes | Attempt number of the source submission. |
| batch_id | — | VARCHAR(120) | Yes | Groups every event produced by one submitted attempt. |
| certification_id | — | BIGINT | Yes | Certification context of the event. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the event was enqueued. |
| event_id | UNIQUE, NOT NULL | VARCHAR(200) | No | Deterministic identity (attempt + attempt-question + grade version) so re-delivery never duplicates mastery evidence. |
| event_type | NOT NULL | VARCHAR(40) | No | Kind of event. Defaults to MASTERY. |
| exam_id | — | BIGINT | Yes | Exam context of the event. |
| exam_result_id | — | BIGINT | Yes | Attempt id used as the stable result grouping for reconciliation. |
| last_error | — | TEXT | Yes | Last delivery error message. |
| learner_id | NOT NULL | BIGINT | No | Learner the mastery evidence belongs to. |
| locked_at | — | TIMESTAMP | Yes | Time the row was claimed by a dispatcher. |
| locked_by | — | VARCHAR(100) | Yes | Identifier of the dispatcher instance holding the row. |
| next_retry_at | — | TIMESTAMP | Yes | Earliest time the next retry may run (backoff). |
| payload_json | NOT NULL | TEXT | No | Serialized mastery event forwarded verbatim to the FastAPI BKT service. |
| processed_at | — | TIMESTAMP | Yes | Date and time delivery succeeded. |
| retry_count | NOT NULL | INTEGER | No | Number of delivery retries so far. Defaults to 0. |
| status | NOT NULL | VARCHAR(20) | No | Delivery state: PENDING, PROCESSING, PROCESSED, FAILED, or DEAD_LETTER. Defaults to PENDING. |

The BKT_EVENT_OUTBOX table stores durable mastery events awaiting delivery to the FastAPI BKT service. Rows are inserted inside the assessment submission transaction and consumed asynchronously by the dispatcher.

---

## 15. CHALLENGE MODE

### DATA DICTIONARY OF CHALLENGE_ARENA_CONFIGS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| arena_id | PK | VARCHAR(40) | No | Identifier of the arena the settings apply to. |
| node_layout_json | — | TEXT | Yes | Layout of the arena's challenge nodes, as JSON. |
| settings_json | — | TEXT | Yes | Arena settings such as timing and scoring weights, as JSON. |
| updated_at | — | TIMESTAMP | Yes | Date and time the record was last updated. |
| disabled_tracks_json | — | TEXT | Yes | Tracks turned off in the arena, as JSON. |
| live | — | BOOLEAN | Yes | Whether the arena is open to learners. |

The CHALLENGE_ARENA_CONFIGS table stores one arena's admin configuration: its run settings, and how its problem set is grouped. Keyed by the arena's string id: the arenas are built surfaces, not data, so there is no arena row to hang this off. <h3>Settings</h3> A JSON object of numeric knobs -- node count, time limit, scoring weights, lobby size.

### DATA DICTIONARY OF WORLD_CUP_BRACKETS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| bracket_id | PK, identity | BIGINT | No | Unique identifier for a world cup bracket. |
| certification_id | NOT NULL | BIGINT | No | Certification the bracket is played on. |
| completed_at | — | TIMESTAMP | Yes | Date and time the bracket finished. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the record was created. |
| current_round | NOT NULL | VARCHAR(20) | No | Round the bracket is currently in. |
| edition_id | — | BIGINT | Yes | Weekly edition the bracket belongs to. |
| players_json | NOT NULL | TEXT | No | Learners seeded into the bracket, as JSON. |
| winner_learner_id | — | BIGINT | Yes | Learner who won the bracket. |

The WORLD_CUP_BRACKETS table stores the elimination brackets of a weekly World Cup edition: the seeded players, the current round, and the winner.

### DATA DICTIONARY OF WORLD_CUP_EDITIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| edition_id | PK, identity | BIGINT | No | Unique identifier for a world cup edition. |
| certification_id | NOT NULL | BIGINT | No | Certification the edition is played on. |
| created_at | NOT NULL | TIMESTAMP | No | Date and time the record was created. |
| lesson_id | NOT NULL | BIGINT | No | Lesson that questions generated for the edition are filed under. |
| published | NOT NULL | BOOLEAN | No | Whether the edition is open to learners. |
| published_at | — | TIMESTAMP | Yes | Date and time the edition was published. |
| stages_json | — | TEXT | Yes | Stages of the edition and their settings, as JSON. |
| updated_at | — | TIMESTAMP | Yes | Date and time the record was last updated. |
| week_start | UNIQUE, NOT NULL | DATE | No | First day of the week the edition runs. |

The WORLD_CUP_EDITIONS table stores one week of the World Cup: the certification its bracket runs on, and a question set per bracket stage. Weekly because everyone sits the same tournament at once -- by next week this week's questions are out in the world, so each week is authored fresh. Per stage because the same eight players meet at quarterfinals, semis and the final; one shared set would have the finalists answering questions they had already seen.

### DATA DICTIONARY OF WORLD_CUP_MATCHES

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| match_id | PK, identity | BIGINT | No | Unique identifier for a world cup matche. |
| bracket_id | NOT NULL | BIGINT | No | Bracket the match belongs to. |
| completed_at | — | TIMESTAMP | Yes | Date and time the match ended. |
| match_index | NOT NULL | INTEGER | No | Position of the match within its round. |
| player1_attempt_id | — | BIGINT | Yes | First player's assessment attempt for the match. |
| player1_id | — | BIGINT | Yes | First player of the match. |
| player1_score | — | DOUBLE PRECISION | Yes | First player's score. |
| player2_attempt_id | — | BIGINT | Yes | Second player's assessment attempt for the match. |
| player2_id | — | BIGINT | Yes | Second player of the match. |
| player2_score | — | DOUBLE PRECISION | Yes | Second player's score. |
| round | NOT NULL | VARCHAR(20) | No | Round of the bracket the match is in. |
| started_at | — | TIMESTAMP | Yes | Date and time the match started. |
| status | NOT NULL | VARCHAR(20) | No | Progress of the match. |
| winner_learner_id | — | BIGINT | Yes | Learner who won the match. |

The WORLD_CUP_MATCHES table stores the head-to-head matches of a World Cup bracket: the two players, their assessment attempts and scores, and the winner.

### DATA DICTIONARY OF WORLD_CUP_QUEUE

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| queue_id | PK, identity | BIGINT | No | Unique identifier for a world cup queue. |
| certification_id | NOT NULL | BIGINT | No | Certification the learner queued for. |
| joined_at | NOT NULL | TIMESTAMP | No | Date and time the learner joined the queue. |
| learner_id | NOT NULL | BIGINT | No | Learner waiting for a match. |
| points | NOT NULL | DOUBLE PRECISION | No | Points that seed the learner into a bracket. |

The WORLD_CUP_QUEUE table holds learners waiting to be seeded into a World Cup bracket for a certification.

---

## 16. NOTIFICATIONS

### DATA DICTIONARY OF NOTIFICATIONS

| Field Name | Constraints | Data Type | Allow Nulls | Description |
|---|---|---|---|---|
| notification_id | PK, identity | BIGINT | No | Unique identifier for a notification. |
| body | NOT NULL | TEXT | No | Text of the notification. |
| created_at | NOT NULL | TIMESTAMP WITH TIME ZONE | No | Date and time the record was created. |
| href | — | VARCHAR(240) | Yes | Page the notification links to. |
| read_at | — | TIMESTAMP WITH TIME ZONE | Yes | Date and time the user read the notification. |
| title | NOT NULL | VARCHAR(180) | No | Title of the notification. |
| user_id | FK → USERS, NOT NULL | BIGINT | No | Reference to the user this record belongs to. |

The NOTIFICATIONS table stores a generic in-app notification for any User (admin, institution, or learner) -- mirrors community.entity.LearnerCommunityNotification's shape but isn't learner-only, so admin/institution events (partnership requests, invitations) have somewhere to land too.

# Live teaching

Open the lesson tutor's Learning tools menu and select Live tutor. Voice teaching starts automatically, subject to the browser's microphone permission. The sidebar closes. The lesson remains visible through the transparent overlay, compact audio controls appear at the bottom, and the floating tutor button becomes a voice orb. The waveform scrolls using actual microphone or tutor audio samples and settles during silence. The orb opens a small chat bubble. If voice fails or microphone access is unavailable, typing can start a silent ElevenLabs text conversation. Pause mutes microphone and audio while preserving the connection; Resume continues the conversation. The close control ends the teaching session.

## Configuration

Closing Live Tutor suspends an unfinished teaching session and waits for its checkpoint save. Reopening the same lesson restores the saved concept, transcript and section rather than repeating the initial interview. Only a genuinely completed teaching plan is marked completed. Sessions incorrectly marked completed by earlier versions are not reopened automatically.

- API container: `ELEVENLABS_API_KEY` and optional `ELEVENLABS_LIVE_TUTOR_AGENT_ID`.
- Frontend: the existing authenticated API configuration; never a permanent provider key.
- Docker Compose loads the CLI-managed `frontend/.env.local` into the backend environment. The current account's agent is `agent_6001m5hrr384ef1tkgzt1p4s00zr`; use the same ID when configuring the provider. Normal backend recreation preserves this configuration without manually exporting the secret. Manual/non-Compose deployments must explicitly set `ELEVENLABS_LIVE_TUTOR_AGENT_ID` to the current agent.
- `node scripts/configure-live-teacher.mjs --verify-session` checks agent access and signed-session authorization without generating speech. The new account passed this check; real spoken delivery still requires a live session.
- Account rotation: `--create-from-runtime` recreates the teacher and tools in the CLI-onboarded account while preserving the previous runtime agent's voice and duration. It captures the old credential only in memory, never displays or writes it, and enables signed authentication on creation. Update the Compose agent ID before recreating the backend; `--verify-runtime` privately compares the deployed credential/agent with onboarding. Database teaching checkpoints and learner quotas are not reset by account rotation. The latest replacement account on 22 October 2026 reported 10,000 of 10,000 credits available, superseding the earlier depleted-account check below.
- Run `node scripts/configure-live-teacher.mjs` from frontend to apply the checked-in teacher prompt, voice `XrExE9yKIg1WjnnlVkGX` with expressive mode, brief conversational replies, and dynamic lesson/checkpoint variables to the configured project agent. It reads the CLI-created `.env.local` without printing the key. The agent ID in that script must match the API agent configuration.
- Apply backend migration `V76__live_teaching_sessions.sql` using the project's migration process. Development also uses Hibernate schema update; production should apply the migration explicitly.

## Admin controls and daily limits

Admin → AI settings now includes an independent ElevenLabs panel (it remains available if OpenRouter is unavailable). It reads the account's remaining character-credit allowance, cycle usage, reset date and available voices. Missing provider permissions show a warning, not a fabricated balance. It never returns the API key. Only the exact `ADMIN` role can access provider balances or modify global settings.

Administrators can enable/disable new Live Tutor connections, select or enter a provider-accessible voice, set maximum duration (1–30 minutes), and change the daily live-session allowance (default **5**, range 1–1000). The cap applies per learner to Pro and eligible institutional AI access. Personal Pro chat-message daily/weekly limits can also be edited; they update the existing Pro plan entitlements rather than creating a second competing message quota.

The live allowance is separate from tutor chat messages. Every successfully issued provider connection counts once, including text mode, reopening and reconnecting. Pause/resume on the same connection does not count again. Failed signed-URL authorization does not consume an allowance; a URL issued but unused by the browser does count. Checkpoints and lesson actions do not consume more sessions. Allowances reset at midnight in the existing learner quota timezone (UTC+8). Existing use before this feature was introduced is not backfilled.

Quota check, signed-URL issuance and debit run under a PostgreSQL transaction-scoped learner lock, so concurrent tabs cannot all claim the fifth session. A sixth request returns HTTP 429 with a reset explanation. The provider agent requires authentication, and signed URLs request `include_conversation_id=true` to prevent replay: [ElevenLabs signed URL documentation](https://elevenlabs.io/docs/eleven-agents/api-reference/conversations/get-signed-url). Admin preview is not charged to a learner. New voice/duration settings are applied to the provider before saving; existing connections retain their previous voice/duration. The disable switch blocks new sessions, not active ones.

Settings persist in `live_tutor_settings` (migration V77); usage reuses `ai_generation_usage` with kind `tutor-live`. Apply migrations in production. Local development's existing Hibernate schema update can create the settings table; defaults work before its singleton row is first saved. Provider credit verification on 22 October 2026 returned 0 remaining of 10,000; this is independent of each learner's five-session daily allowance.

Tests: `node scripts/tests/live-admin-settings.browser.mjs` exercises the real admin form against mocked APIs, including voice/cap saves, missing-balance warnings and the daily-only learner meter. Backend `LiveTutorQuotaServiceTest`, `ElevenLabsSettingsServiceTest`, and `AiSettingsControllerTest` cover cap enforcement, failure accounting, lock ordering, settings validation and access control. No speech generation is required for these checks.

## Backend contracts

`POST /api/ai/tutor/live/session` accepts `{lessonId}`. It authenticates the caller, enforces AI tutor and lesson entitlements, retrieves the lesson from PostgreSQL, restores an unfinished session, and returns server lesson content, a short-lived ElevenLabs signed URL, checkpoint, and recent transcript. The API does not accept frontend lesson text as its source of curriculum.

`POST /api/ai/tutor/live/sessions/{sessionId}/events` accepts a supported event type, teaching state, bounded context object, and bounded transcript. Ownership is checked server-side. These are conversation records, never assessment scores or claims of course completion. No audio recordings are stored by this implementation.

## Implemented and limits

- Basic teacher prompt: short explanations, why/how, concrete examples, adaptive correction, and understanding checks using supplied curriculum.
- Provider voice interruptions and same-connection pause/resume; saved transcript and UI context are supplied on reconnect. Exact concept mastery is not inferred from scrolling.
- Debounced section tracking, text selection, image metadata, tabs, and annotated lesson-tool clicks. Updates are contextual and do not ask the teacher to speak on every click.
- Full-screen audio controls and floating text chat without a microphone/headset.
- An explicit teaching controller separates diagnostic questions, explanations, demonstrations, recitation, feedback, answer windows, transitions, pause, completion, and error recovery. Ordinary explanations advance after playback; real questions wait 20 seconds, allow one hint, then move to a model answer after another 15 seconds. Silence is never recorded as mastery or agreement.
- Registered ElevenLabs client tools `teaching_step`, `lesson_catalog`, and `lesson_action` plan the next segment and operate only catalogued elements inside the current lesson. Section scrolling, tabs, idempotent accordion expansion/collapse, flip-card front/back selection, tool focus and image focus return verified UI state. Manual wheel/touch exploration temporarily suppresses tutor navigation.
- Checkpoints include the teaching phase, current/finished concepts, unfinished spoken segment, question context, and bounded transition trace. Interrupted-response corrections update the transcript. Reconnect restores that context; it is not a certified mastery record.
- The provider's previous seven-second silence turn is changed to 30 seconds with patient turn-taking; the teaching controller schedules teaching much sooner and manages genuine answer windows. Generic check-ins, permission-to-continue questions and bracketed delivery tags are prohibited in the configured teacher prompt; known tags are stripped from readable transcripts.

Still required for the full hybrid specification: actual image input with authorized retrieval, richer adapters for controls beyond the registered lesson widgets, server-evaluated oral exams integrated with existing assessment records, and end-to-end microphone tests for interruption latency and reconnection. Image metadata alone is explicitly labelled as insufficient to see image pixels. Oral recitation currently uses conversational feedback, not official grades or saved assessment results.

## Checks

- Frontend: `npm run lint -- --quiet`, `npm run typecheck`, `npm run build`.
- Controller regression suite: `node --test scripts/tests/live-teaching-controller.test.mjs` (14 tests: close/reopen checkpoint preservation, continuous teaching, diagnostic listening, bounded silence, answers/feedback, interruptions, pause/resume, completion, checkpoint restoration, response timeout, and transcript correction).
- Real rendered UI integration: `node scripts/tests/live-lesson-actions.browser.mjs` uses an isolated headless browser and actual React lesson components. It verifies tabs, accordion state/idempotency, card flips, scrolling, action validation, and manual exploration.
- Optional live-provider integration: add `--provider` to that browser command. It uses a short-lived signed URL and fictional fixture curriculum, with no permanent key in the browser. Final live-provider verification on 22 October 2026 was blocked by ElevenLabs `quota_exceeded` (no credits). Local controller/UI tests pass; do not treat those as verification of real spoken delivery or autonomous model decisions.
- Backend: `./mvnw -Dtest=LiveTeachingServiceTest test` (Windows: `mvnw.cmd`). Tests cover ownership, bounded payloads, invalid state, transcript persistence, and completed-session protection.
- Manual: open a real lesson; enter live mode; verify voice starts automatically after microphone permission, the sidebar closes, the lesson stays visible, and compact audio controls sit at the bottom; confirm the waveform follows speech and settles in silence; type through the orb with microphone permission denied; interrupt, pause/resume, navigate sections, and reconnect; confirm the tutor uses supplied lesson material and does not claim visual access or official scores.

Teacher quality and live audio behaviour require a real session review; passing compilation or saving an agent prompt does not verify pedagogy or audio latency.

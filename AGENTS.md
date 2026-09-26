# Antigravity IDE Rule: Frontend Work Only

## Code Editing Boundaries

- Only write, create, edit, or delete files inside the `frontend/` directory.
- NEVER edit, refactor, or modify code in:
  - `backend-java/`
  - `python-backend/`
  - Root configuration or orchestration files (e.g., `docker-compose.yml`).

## Local Runtime & Services

- You MAY run `docker compose up -d` and `docker compose ps` at the root solely to run the backend containers needed by the frontend.
- Treat backend APIs as immutable external contracts.
- If a UI feature requires a backend code change, stop and notify the user instead of altering backend code.

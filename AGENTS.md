# Mars Credit Monorepo — Agent Rules

Guidance for AI agents and developers working in this repository.

## Project Overview

- **Mars Credit** — Crypto project, fork of Ethereum proof-of-work (Geth 1.10.18).
- **frontend/** — BlockScout block scanner (blockchain explorer).
- **website-public/** — Public marketing website.
- **miner-apple-silicon/** — macOS miner for Apple Silicon.
- **miner-app/** — Planned cross-OS mining app (e.g. Electron).
- **brandassets/** — Brand assets and images.

---

## Testing

- **All changes must include or update tests** where applicable.
- **Run the relevant test suite before committing:**
  - Frontend: `yarn test` (Jest), `yarn test:e2e` (Playwright).
  - Website: use project test script if present; otherwise add tests for new behavior.
  - Miner (Swift): run tests from Xcode or `swift test` as appropriate.
- Prefer adding or updating tests in the same commit as the feature or fix.

---

## Logging

- **Logging must be clear and sufficient** for debugging and production monitoring.
- Log important events: startup, shutdown, errors, retries, and major state changes.
- Use structured logging where possible (e.g. JSON or consistent key-value fields).
- Avoid logging secrets, tokens, or full user data; redact or omit as needed.
- **Frontend / Website:** Use a consistent logging approach (e.g. console in dev, optional logger in prod).
- **Miner (Swift):** Use `os.log` or project logging helpers with appropriate levels.
- **Future Electron miner:** Log in a way that works across OSes and can be surfaced in UI or logs directory.

---

## Project-Specific Guidelines

### Frontend (BlockScout)

- Use **TypeScript** with strict mode; fix type errors rather than weakening types.
- Tests: **Jest** for unit/integration, **Playwright** for E2E where relevant.
- Follow existing patterns in `frontend/` for components, API usage, and config.

### Website (website-public)

- Follow **Next.js** App Router and project conventions.
- Use **Tailwind CSS** for styling; keep utility usage consistent with the rest of the app.

### Miner (miner-apple-silicon)

- Follow **Swift** and **SwiftUI** best practices.
- Use the project’s existing logging and error-handling patterns.

### Future miner-app (Electron)

- Design for **cross-OS** (macOS, Windows, Linux) where applicable.
- Consider path handling, line endings, and platform-specific build/deploy steps.

---

## Deployment

- **frontend** and **website-public** deploy to **Railway**.
- Root-level Dockerfiles:
  - **Dockerfile.frontend** — BlockScout frontend (build from repo root: `docker build -f Dockerfile.frontend .`).
  - **Dockerfile.web** — Public website (build from repo root: `docker build -f Dockerfile.web .`).
- Do not rely on Dockerfiles inside `frontend/` or `website-public/`; use the root Dockerfiles only.

---

## Prohibited

- **Do not run `meteor reset`** (or any command that wipes local Meteor/DB state) unless explicitly requested and understood.

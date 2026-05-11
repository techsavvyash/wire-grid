# Agent Instructions

- For every completed implementation phase, add or update example app code that exercises the new behavior.
- Add Playwright E2E coverage for each new browser-editing capability.
- Run the relevant checks locally before handing off; prefer `pnpm check` when the change touches runtime, adapters, examples, or E2E.
- Treat CI coverage as required: new E2E tests must run through the existing GitHub Actions workflow.
- Do not call a phase complete until the example app demonstrates it and Playwright verifies it end to end.

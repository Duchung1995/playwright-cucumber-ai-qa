# Toolshop QA framework: project memory for Claude

Playwright + TypeScript + Cucumber BDD suite for the Toolshop demo app:
- UI: https://practicesoftwaretesting.com
- API: https://api.practicesoftwaretesting.com

The `.claude/` folder is an agentic QA harness (orchestrator commands, role subagents, skills, hooks, rules, rubrics). See `docs/ai-harness.md`.

## Commands
- `npm test`, `npm run test:api`, `npm run test:ui`, `npm run test:smoke`
- `npx cucumber-js <file>[:line]` or `npx cucumber-js --tags "<expr>"`
- `npm run typecheck`, `npm run lint`
- `npm run -s report:parse -- --failures-only` (summary of the last run)
- `npm run -s steps:list -- <filter>` (existing step phrases)

## Layout
- `features/{api,ui}/*.feature`: Gherkin, tagged `@api|@ui` + `@REQ-*` (see `docs/requirements.md`)
- `src/steps/{api,ui}`: thin step definitions
- `src/pages`: POM (`PageObjects` registry in `index.ts`)
- `src/api`: typed API clients
- `src/schemas`: zod response schemas
- `src/support/world.ts`: `CustomWorld` (page, pages, api clients, scenario `state`, cleanup lists)
- `src/support/hooks.ts`: browser/context lifecycle, tracing, screenshot on failure, data cleanup
- `src/data`: unique test-data builders

## Non-negotiables (hooks enforce some of these)
- Locators: getByRole > getByLabel > getByTestId (`data-test`). No CSS/XPath in page objects.
- No sleeps or arbitrary timeouts. Use web-first `expect`, `waitForResponse` or API seeding.
- Every scenario is independent. Create unique data and register it for cleanup in the World.
- Never weaken an assertion to make a test pass (`.claude/rules/healing-policy.md`).
- The public demo instance is shared and mutable. Don't depend on the demo accounts' profile data. Seed your own.

## QA workflows
`/qa <goal>` orchestrates. The single pipelines are `/qa-run`, `/qa-triage`, `/qa-heal`, `/qa-generate`, `/qa-coverage` and `/qa-report`.

Path-scoped rules live in `.claude/rules/` and the quality gates in `.claude/rubrics/`.

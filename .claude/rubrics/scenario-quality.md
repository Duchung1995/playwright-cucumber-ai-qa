# Rubric: scenario quality (generated or changed Gherkin + steps + page objects)

Threshold: **16 / 20**, and no **must** criterion at 0.

| ID | Criterion | Must |
|----|-----------|------|
| SQ1 | Declarative business language; no UI mechanics or selectors in steps | |
| SQ2 | One behaviour per scenario; clear Given / When / Then roles | |
| SQ3 | Every Then is an observable, specific assertion (exact text, count, order, status), not just "page loads" | must |
| SQ4 | Tags present: `@api`/`@ui` and a valid `@REQ-*` from docs/requirements.md | must |
| SQ5 | Reuses existing steps where a phrase already exists (checked with `npm run steps:list`) | |
| SQ6 | Independent data: seeded via API or builders, unique on the shared instance, cleaned up | must |
| SQ7 | Locators follow .claude/rules/locators.md (role > label > testid; no CSS/XPath) | must |
| SQ8 | No hard waits; async behaviour handled by web-first assertions or waitForResponse | must |
| SQ9 | New step definitions are typed, thin, and delegate to page objects or API clients | |
| SQ10 | Scenario passes 3 consecutive runs (`npx cucumber-js <file>:<line>`) | must |

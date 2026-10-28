---
name: run-tests
description: Run the Cucumber + Playwright suite (all, by profile, tag, feature file or single scenario) and produce reports/cucumber.json, HTML report, screenshots and traces. Use whenever tests need to be executed or re-run.
---
# Run tests

Pick the narrowest command that answers the question:

| Goal | Command |
|------|---------|
| Everything | `npm test` |
| API layer only (no browser) | `npm run test:api` |
| UI layer only | `npm run test:ui` |
| Smoke subset | `npm run test:smoke` |
| By tag expression | `npx cucumber-js --tags "@catalog and not @wip"` |
| One feature file | `npx cucumber-js features/ui/checkout.feature` |
| One scenario | `npx cucumber-js features/ui/checkout.feature:10` (line of `Scenario:`) |
| Re-run last failures | `npx cucumber-js @reports/@rerun.txt` |
| Stability check (×3) | `for i in 1 2 3; do npx cucumber-js <file>:<line> \|\| break; done` |

Useful environment overrides, which can be combined:
- `HEADLESS=false` to watch the browser
- `TRACE=always` to keep traces for passing scenarios too
- `BROWSER=firefox` or `BROWSER=webkit`
- `PARALLEL=4` to run in parallel workers
- `RETRY=1` to retry failed scenarios (this hides flakiness, so don't use it while triaging)

Outputs, all of which are overwritten on each run:
- `reports/cucumber.json`: machine-readable. Feed it to the `parse-cucumber-report` skill.
- `reports/cucumber.html`: human report with embedded screenshots.
- `reports/screenshots/*.png` and `reports/traces/*.zip`: only for failed UI scenarios (unless `TRACE=always`).
- `reports/@rerun.txt`: locations of the failed scenarios.

After running, always summarise with:
```
npm run -s report:parse -- --failures-only
```
Do not paste raw Cucumber output into the conversation. It is long, and the parser extracts what matters.

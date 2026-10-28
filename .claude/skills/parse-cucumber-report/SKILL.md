---
name: parse-cucumber-report
description: Turn reports/cucumber.json into a compact JSON summary (totals, per-scenario status and duration, failing step, trimmed error, screenshot/trace/URL paths). Use after every test run and before triage or reporting.
---
# Parse the Cucumber report

```bash
npm run -s report:parse                     # all scenarios
npm run -s report:parse -- --failures-only  # only failed/undefined/pending
npm run -s report:failures                  # Markdown failure report (same as the CI job summary)
npx tsx .claude/skills/parse-cucumber-report/scripts/parse-report.ts path/to/other.json
```

Output shape:
```json
{
  "totals": { "total": 20, "passed": 19, "failed": 1 },
  "scenarios": [{
    "feature": "...", "scenario": "...", "location": "features/ui/x.feature:12",
    "tags": ["@ui", "@REQ-UI-01"], "status": "failed", "durationMs": 9123,
    "failedStep": "Then I should see ...", "stepDefinition": "src/steps/ui/x.steps.ts:40",
    "error": "first lines of the assertion error",
    "screenshot": "reports/screenshots/....png", "trace": "reports/traces/....zip",
    "urlAtFailure": "https://...",
    "likelyCause": "ENVIRONMENT: blocked by the Cloudflare bot check ... | TEST or PRODUCT: ...",
    "failureContext": "URL, page title, API calls as curl, failed browser requests, console errors"
  }]
}
```

How to use the fields:
- `location` re-runs exactly that scenario.
- `stepDefinition` is where to start reading code.
- `likelyCause` starting with `ENVIRONMENT` means the public site blocked, rate-limited or dropped the run. Report it; don't heal it.
- `failureContext` holds every API call the test made as a `curl` command. Re-run one to reproduce an API failure.
- `trace` goes to the `inspect-trace` skill. `screenshot` can be opened with the Read tool, which shows images.

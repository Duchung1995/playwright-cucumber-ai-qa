# Healing policy (applies to any agent that changes code after a failure)

A failing test is evidence. Healing restores the test's ability to detect regressions. It never hides them.

Allowed fixes:
- Update a locator when the UI changed but the behaviour is intact (proved by the trace or a page snapshot).
- Replace a race with a deterministic wait (`waitForResponse`, web-first assertion, seeding state through the API).
- Fix test data that became invalid on the shared instance (e.g. use a seeded user).

Forbidden:
- Weakening or deleting an assertion, broadening a regex or adding `.catch(() => {})` just to go green.
- Adding sleeps or raising timeouts as the "fix", unless the trace proves the app is slow-but-correct. In that case raise the timeout only on that single assertion and explain why.
- Changing expected values to whatever the app now returns when that could be a product bug.
- Retrying in code (`toPass`, loops) to mask flakiness without a root cause.

When the failure is a product bug, do not change the test. Report it with evidence (step, expected vs actual, screenshot/trace path, failing network call).

Every healing change must:
1. state the root cause in one sentence
2. pass `rubrics/healing-fix.md`
3. go green when the affected scenario is re-run 3 times in a row

---
name: inspect-trace
description: Extract evidence from a Playwright trace zip (action timeline, failing action, HTTP >= 400 responses, console errors, request/response bodies) to find the root cause of a UI failure. Use during failure triage.
---
# Inspect a Playwright trace

1. **Text summary first**, since it's cheap and fits in context:
   ```bash
   npx tsx .claude/skills/inspect-trace/scripts/trace-summary.ts reports/traces/<name>.zip --last 20
   ```
   Read it in this order:
   - the failing action (`✗`) and the actions just before it
   - backend responses >= 400. A failing API call under a UI failure often points to the product or to data.
   - console errors
2. **Request/response bodies** for a suspicious call: list the entries, then print the body file it references.
   ```bash
   unzip -l reports/traces/<name>.zip | grep resources/
   unzip -p reports/traces/<name>.zip trace.network | grep '<url fragment>'   # find "_file" of postData/content
   unzip -p reports/traces/<name>.zip resources/<sha1>.json
   ```
3. **Screenshot**: open the `screenshot` path from the parsed report with the Read tool to see the final UI state.
4. **Interactive (for humans)**: `npx playwright show-trace reports/traces/<name>.zip`.

Patterns worth recognising:
- An assertion times out but the screenshot shows the expected text. The locator is wrong (test-bug), e.g. an `id` was treated as a `data-test`.
- An action ran before a backend response landed, and later a request carries unexpected data. This is a race (flaky). Fix it with `waitForResponse` or by seeding state.
- A request body contains data the test never typed. Shared demo data or an async prefill overwrote the input.
- 5xx or connection errors on many calls point to the environment.

Worked example from this repo: the checkout failed with `POST /invoices -> 422`. The request body in the trace showed an Austrian address with `billing_postal_code: null`, which the test never entered. The cause was the shared demo customer's profile prefill overwriting the form. The fix was to seed an isolated customer through the API.

---
description: Run tests (optionally by profile/tag/file), summarise results, auto-triage failures and write the run report.
argument-hint: "[api|ui|smoke|@tag expression|features/path.feature[:line]]"
---
Run the RUN pipeline from `/qa` for target: `$ARGUMENTS` (empty = full suite).

1. Pick the command with the `run-tests` skill:
   - `api`/`ui`/`smoke` → `npm run test:<x>`
   - a tag expression → `npx cucumber-js --tags "<expr>"`
   - a path → `npx cucumber-js <path>`
2. Summarise with `npm run -s report:parse -- --failures-only`. Show the totals.
3. If there are failures, delegate each one to the **failure-triage** agent (in parallel when independent). Present the verdict table: scenario | category | confidence | root cause | action.
4. Delegate to **run-reporter** with the verdicts. Return the summary path.
5. If any verdict is test-bug or flaky, offer `/qa-heal`. If any is a product-bug, show the drafted bug report. Do not modify code in this command.

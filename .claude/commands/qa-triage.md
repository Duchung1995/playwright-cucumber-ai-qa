---
description: Triage the failures in the latest test report (no code changes).
argument-hint: "[scenario location filter, e.g. features/ui/checkout.feature]"
---
1. Run `npm run -s report:parse -- --failures-only`. If there are no failures, say so and stop. Filter by `$ARGUMENTS` if given.
2. Delegate each failure to the **failure-triage** agent. Run them in parallel when they're in different features.
3. Send the verdicts to **qa-judge** with rubric `triage-classification`. Re-triage any verdict that comes back `revise` (once).
4. Present a table: scenario | category | confidence | root cause | recommended action. Below it, add product-bug reports in full.

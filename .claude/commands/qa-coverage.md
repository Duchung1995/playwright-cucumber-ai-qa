---
description: Requirement-to-test coverage review with prioritised gaps.
argument-hint: "[REQ prefix filter, e.g. REQ-UI]"
---
1. Delegate to **coverage-reviewer** (filter: `$ARGUMENTS`).
2. Show the coverage matrix, the overall percentage and the top 3 gaps.
3. Ask the user which gaps to fill. For each one they approve, run the GENERATE pipeline (`/qa-generate <REQ>`).

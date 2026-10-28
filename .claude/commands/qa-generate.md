---
description: Generate BDD scenarios (feature + steps + POM) for a user story, REQ ID or page, gated by the scenario-quality rubric.
argument-hint: <REQ-ID | "user story text" | /page/path>
---
1. Resolve the input `$ARGUMENTS`:
   - a REQ ID: read its criteria from `docs/requirements.md`
   - a story: propose a new `REQ-*` entry and add it to `docs/requirements.md`
   - a path: explore it first
2. Delegate to **scenario-generator** with the requirement text and acceptance criteria.
3. Send the result to **qa-judge** with rubric `scenario-quality` and the list of changed files. On `revise`, loop back with `must_fix` (max 2 rounds).
4. Report the scenarios added (locations), steps reused vs new, the judge score, and the run evidence. Do not commit.

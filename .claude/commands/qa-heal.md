---
description: Heal failing tests classified as test-bug or flaky; gated by the healing-fix rubric and 3 green re-runs.
argument-hint: "[scenario location] (default: all healable failures from the latest triage/run)"
---
1. If there are no fresh triage verdicts in this conversation, run `/qa-triage $ARGUMENTS` first.
2. Pick only the verdicts with category `test-bug` or `flaky`. List the skipped ones (product-bug/environment) and the reason.
3. For each healable failure, delegate to **test-healer** with the triage JSON. Run them sequentially when they touch the same files.
4. Send each result to **qa-judge** with rubric `healing-fix`:
   - on `revise`, return `must_fix` to test-healer (max 2 rounds)
   - if it still fails, revert that change (`git checkout -- <files>`) and escalate
5. Finally run the full affected profile once (`npm run test:ui` or `npm run test:api`) and report: fixed, still failing, escalated, plus `git diff --stat`. Do not commit.

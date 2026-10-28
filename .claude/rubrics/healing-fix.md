# Rubric: healing fix

Threshold: **10 / 12**, and no **must** criterion at 0.

| ID | Criterion | Must |
|----|-----------|------|
| HF1 | Fix addresses the stated root cause, not the symptom | must |
| HF2 | No weakened, removed or broadened assertions (diff checked) | must |
| HF3 | No sleeps, blanket timeout increases, or retry loops added | must |
| HF4 | Locator changes follow .claude/rules/locators.md and are verified against a fresh page snapshot | |
| HF5 | Minimal diff: only the files needed; matches surrounding code style | |
| HF6 | Affected scenario green 3 runs in a row, and `npm run typecheck` + `npm run lint` clean | must |

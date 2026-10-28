# Rubric: failure triage

Threshold: **9 / 12**, and no **must** criterion at 0.

Categories:
- `product-bug`: the app behaves wrongly against the requirement
- `test-bug`: a wrong locator, assertion, data or step in our code
- `flaky`: a race or timing problem in our test, nondeterministic
- `environment`: the demo instance is down or rate-limited, there's a network problem, or shared data was changed by others

| ID | Criterion | Must |
|----|-----------|------|
| TC1 | Exactly one category, with a confidence (high/medium/low) | must |
| TC2 | Evidence cited from at least two sources: error message, trace actions, failing network calls, screenshot, page snapshot | must |
| TC3 | Root cause stated as one falsifiable sentence (not "something went wrong") | must |
| TC4 | A product-bug verdict includes expected vs actual and reproduction steps | |
| TC5 | Recommended action matches the category: heal (test-bug/flaky), report (product-bug), retry/wait (environment) | |
| TC6 | Checked whether the failure reproduces on re-run, or explained why it could not | |

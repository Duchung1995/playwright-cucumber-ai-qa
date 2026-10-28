# Rubrics

Rubrics are the quality gates of the harness. Generators (scenario-generator, test-healer, failure-triage) produce work. The **qa-judge** agent, a separate read-only evaluator, scores it against a rubric. Work is accepted only at or above the threshold, and no criterion marked **must** may score 0.

Scoring scale per criterion:
- 0 = not met
- 1 = partially met
- 2 = fully met

The judge returns:

```json
{
  "rubric": "scenario-quality",
  "scores": [{ "id": "SQ1", "score": 2, "evidence": "features/ui/x.feature:12 uses business language" }],
  "total": 17,
  "max": 20,
  "threshold": 16,
  "verdict": "pass | revise",
  "must_fix": ["..."]
}
```

On `revise`, the generator gets `must_fix` and tries again, at most 2 revisions. After that it escalates to the user.

These files are protected: the `protect-files` hook asks a human before any edit.

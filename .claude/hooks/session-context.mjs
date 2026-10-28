#!/usr/bin/env node
// SessionStart: gives Claude a one-glance picture of the last test run and the harness entry points.
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const cwd = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const report = path.join(cwd, 'reports/cucumber.json');
const lines = [
  'QA harness: /qa <goal> orchestrates; /qa-run, /qa-triage, /qa-heal, /qa-generate, /qa-coverage, /qa-report run single workflows.',
];

if (existsSync(report)) {
  try {
    const features = JSON.parse(readFileSync(report, 'utf8'));
    const scenarios = features.flatMap((f) =>
      f.elements.filter((e) => e.type === 'scenario').map((e) => ({ f, e })),
    );
    const failed = scenarios.filter(({ e }) => e.steps.some((s) => s.result.status === 'failed'));
    lines.push(
      `Last run (${statSync(report).mtime.toISOString()}): ${scenarios.length - failed.length}/${scenarios.length} scenarios passed.`,
      ...failed.slice(0, 5).map(({ f, e }) => `  FAILED ${f.uri}:${e.line} ${e.name}`),
    );
  } catch {
    lines.push('Last run report exists but could not be parsed.');
  }
} else {
  lines.push('No test report yet (reports/cucumber.json). Run /qa-run to create one.');
}
console.log(lines.join('\n'));

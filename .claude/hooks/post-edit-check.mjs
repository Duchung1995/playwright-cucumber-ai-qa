#!/usr/bin/env node
// PostToolUse(Edit|Write|MultiEdit): fast feedback loop after every change.
// - *.ts   → `tsc --noEmit` over the project.
// - *.feature → cucumber dry run (strict) to catch undefined or ambiguous steps.
// Failures are returned as {"decision":"block"} so Claude sees the errors and fixes them immediately.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const file = input.tool_input?.file_path ?? '';
const cwd = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const rel = file.replace(`${cwd}/`, '');

const run = (cmd, args) => spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 90_000 });
const block = (reason) => console.log(JSON.stringify({ decision: 'block', reason }));

if (/^(src|\.claude\/skills)\/.*\.ts$/.test(rel)) {
  const r = run('npx', ['tsc', '--noEmit', '--pretty', 'false']);
  if (r.status !== 0)
    block(`TypeScript errors after editing ${rel}:\n${(r.stdout + r.stderr).trim().slice(0, 4000)}`);
} else if (/^features\/.*\.feature$/.test(rel)) {
  const r = run('npx', ['cucumber-js', '--profile', 'dryrun', rel]);
  const output = r.stdout + r.stderr;
  // A dry run exits 0 even with undefined steps, so inspect the summary too.
  if (r.status !== 0 || /\b\d+ (undefined|ambiguous)\b/.test(output)) {
    block(
      `Cucumber dry run failed for ${rel} (undefined/ambiguous steps or a parse error). ` +
        `Reuse existing steps (npm run steps:list) or add definitions:\n${output.trim().slice(0, 4000)}`,
    );
  }
}

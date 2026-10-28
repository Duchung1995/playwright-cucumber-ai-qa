#!/usr/bin/env node
// PreToolUse(Edit|Write|MultiEdit): enforces the framework's non-negotiables before code is written.
// Denies hard waits anywhere in test code, brittle CSS/XPath locators in page objects, and
// "wait N seconds" steps in feature files. The reason is fed back to Claude so it can self-correct.
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const { file_path: file = '', content, new_string, edits } = input.tool_input ?? {};
const rel = file.replace(`${process.env.CLAUDE_PROJECT_DIR ?? process.cwd()}/`, '');
const text = [content, new_string, ...(edits ?? []).map((e) => e.new_string)].filter(Boolean).join('\n');

const violations = [];
if (/^(src|features)\//.test(rel)) {
  if (/\bwaitForTimeout\s*\(|\bsetTimeout\s*\(|\bsleep\s*\(/.test(text)) {
    violations.push(
      'Hard waits (waitForTimeout/setTimeout/sleep) are forbidden. Use web-first expect() assertions or page.waitForResponse(predicate).',
    );
  }
}
if (/^src\/pages\//.test(rel) && /\.locator\(\s*['"`](\/\/|xpath=|css=|[.#[])/.test(text)) {
  violations.push(
    'CSS/XPath locators are forbidden in page objects. Use getByRole > getByLabel > getByTestId (see .claude/rules/locators.md).',
  );
}
if (
  /^features\//.test(rel) &&
  /\b(wait|sleep)s?\b[^"\n]*\b\d+\s*(ms|milliseconds?|s|seconds?)\b/i.test(text)
) {
  violations.push('Gherkin must describe behaviour, not timing. Remove "wait N seconds" steps.');
}

if (violations.length) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `Blocked by .claude/hooks/guard-test-code.mjs for ${rel}:\n- ${violations.join('\n- ')}`,
      },
    }),
  );
}

/**
 * Prints a text summary of a Playwright trace zip: the action timeline, the failing action
 * with its error, console errors and failed network calls. Use it before opening the trace UI.
 *
 * Usage: npx tsx .claude/skills/inspect-trace/scripts/trace-summary.ts <trace.zip> [--last N]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const [zip, ...rest] = process.argv.slice(2);
const lastIdx = rest.indexOf('--last');
const last = lastIdx >= 0 ? Number(rest[lastIdx + 1]) : 15;
if (!zip || !fs.existsSync(zip)) {
  console.error('Usage: trace-summary.ts <trace.zip> [--last N]');
  process.exit(1);
}

const read = (entry: string): string[] => {
  try {
    return execFileSync('unzip', ['-p', zip, entry], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
};
const events = read('trace.trace').map((l) => JSON.parse(l));
const network = read('trace.network').map((l) => JSON.parse(l));

type Call = {
  callId: string;
  method: string;
  params: Record<string, unknown>;
  start: number;
  end?: number;
  error?: string;
};
const calls = new Map<string, Call>();
const consoleErrors: string[] = [];
for (const e of events) {
  if (e.type === 'before') {
    calls.set(e.callId, {
      callId: e.callId,
      method: `${e.class}.${e.method}`,
      params: e.params ?? {},
      start: e.startTime,
    });
  } else if (e.type === 'after' && calls.has(e.callId)) {
    const c = calls.get(e.callId)!;
    c.end = e.endTime;
    if (e.error) c.error = String(e.error.message ?? e.error).split('\n')[0];
  } else if (e.type === 'console' && e.messageType === 'error') {
    consoleErrors.push(String(e.text).slice(0, 200));
  }
}

const describe = (c: Call) => {
  const target = (c.params.selector ?? c.params.url ?? c.params.expression ?? '') as string;
  const extra = c.params.expectedText ?? c.params.value ?? c.params.text ?? '';
  return `${c.method}${target ? ` ${target}` : ''}${extra ? ` ${JSON.stringify(extra).slice(0, 80)}` : ''}`;
};

const ordered = [...calls.values()].filter((c) => !c.method.startsWith('Tracing.'));
console.log(`Trace: ${zip}\nActions recorded: ${ordered.length}\n\nLast ${last} actions:`);
for (const c of ordered.slice(-last)) {
  const ms = c.end ? Math.round(c.end - c.start) : '?';
  console.log(
    `  ${c.error ? '✗' : '✓'} ${describe(c)} (${ms}ms)${c.error ? `\n      error: ${c.error}` : ''}`,
  );
}

const failing = ordered.filter((c) => c.error);
console.log(`\nFailed actions: ${failing.length}`);
failing.forEach((c) => console.log(`  - ${describe(c)}\n    ${c.error}`));

const badResponses = network
  .map((n) => n.snapshot)
  .filter((s) => s && (s.response?.status ?? 0) >= 400)
  .map((s) => `${s.request.method} ${s.request.url} -> ${s.response.status}`);
console.log(`\nHTTP responses >= 400: ${badResponses.length}`);
badResponses.slice(-20).forEach((r) => console.log(`  - ${r}`));

console.log(`\nConsole errors: ${consoleErrors.length}`);
consoleErrors.slice(-10).forEach((m) => console.log(`  - ${m}`));

/**
 * Condenses reports/cucumber.json into a small JSON summary an agent can reason over:
 * totals, per-scenario status/duration, and for failures the failing step, trimmed error
 * and artifact paths (screenshot, trace, URL).
 *
 * Usage: npx tsx .claude/skills/parse-cucumber-report/scripts/parse-report.ts [report.json] [--failures-only]
 */
import fs from 'node:fs';

type Embedding = { mime_type: string; data: string };
type Step = {
  keyword: string;
  name?: string;
  line?: number;
  hidden?: boolean;
  match?: { location?: string };
  result: { status: string; duration?: number; error_message?: string };
  embeddings?: Embedding[];
};
type Scenario = { name: string; line: number; tags?: { name: string }[]; steps: Step[]; type: string };
type Feature = { uri: string; name: string; elements: Scenario[] };

const args = process.argv.slice(2);
const reportPath = args.find((a) => !a.startsWith('--')) ?? 'reports/cucumber.json';
const failuresOnly = args.includes('--failures-only');

if (!fs.existsSync(reportPath)) {
  console.error(`No report at ${reportPath}. Run the suite first (npm test).`);
  process.exit(1);
}

const features = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as Feature[];
const scenarios = features.flatMap((f) =>
  f.elements
    .filter((e) => e.type === 'scenario')
    .map((s) => {
      const failed = s.steps.find((st) => st.result.status === 'failed');
      const status = failed
        ? 'failed'
        : s.steps.some((st) => ['undefined', 'ambiguous'].includes(st.result.status))
          ? 'undefined'
          : s.steps.some((st) => st.result.status === 'pending')
            ? 'pending'
            : 'passed';
      const texts = s.steps.flatMap((st) =>
        (st.embeddings ?? []).filter((e) => e.mime_type === 'text/plain').map((e) => decode(e.data)),
      );
      const artifact = (prefix: string) =>
        texts
          .find((t) => t.startsWith(prefix))
          ?.slice(prefix.length)
          .trim()
          .replace(/^npx playwright show-trace /, '');
      return {
        feature: f.name,
        scenario: s.name,
        location: `${f.uri}:${s.line}`,
        tags: (s.tags ?? []).map((t) => t.name),
        status,
        durationMs: Math.round(s.steps.reduce((sum, st) => sum + (st.result.duration ?? 0), 0) / 1e6),
        ...(failed && {
          failedStep: failed.hidden ? `${failed.keyword} hook` : `${failed.keyword.trim()} ${failed.name}`,
          stepLine: failed.line,
          stepDefinition: failed.match?.location,
          error: trimError(failed.result.error_message ?? ''),
          screenshot: artifact('Screenshot:'),
          trace: artifact('Trace:'),
          urlAtFailure: artifact('URL at failure:'),
        }),
      };
    }),
);

const totals = scenarios.reduce<Record<string, number>>(
  (acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }),
  { total: scenarios.length },
);

console.log(
  JSON.stringify(
    {
      report: reportPath,
      generatedAt: fs.statSync(reportPath).mtime.toISOString(),
      totals,
      scenarios: failuresOnly ? scenarios.filter((s) => s.status !== 'passed') : scenarios,
    },
    null,
    2,
  ),
);

function decode(data: string): string {
  // Cucumber stores text attachments either raw or base64-encoded depending on version.
  const decoded = Buffer.from(data, 'base64').toString('utf8');
  return Buffer.from(decoded, 'utf8').toString('base64') === data ? decoded : data;
}

function trimError(message: string): string {
  const lines = message.split('\n');
  const firstStack = lines.findIndex((l) => /^\s+at /.test(l));
  return (firstStack > 0 ? lines.slice(0, firstStack) : lines).join('\n').trim().slice(0, 1500);
}

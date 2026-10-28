/**
 * Condenses reports/cucumber.json into a small JSON summary an agent can reason over:
 * totals, per-scenario status/duration, and for failures the failing step, trimmed error
 * and artifact paths (screenshot, trace, URL).
 *
 * Usage: npx tsx .claude/skills/parse-cucumber-report/scripts/parse-report.ts [report.json] [--failures-only] [--markdown]
 *   --markdown  human-readable failure report (used for the CI job summary and `npm run report:failures`)
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
const markdown = args.includes('--markdown');

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
          likelyCause: texts.find((t) => t.startsWith('Failure context'))?.match(/Likely cause: (.*)/)?.[1],
          failureContext: texts
            .find((t) => t.startsWith('Failure context'))
            ?.replace(/^Failure context\n/, ''),
        }),
      };
    }),
);

const totals = scenarios.reduce<Record<string, number>>(
  (acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }),
  { total: scenarios.length },
);

const generatedAt = fs.statSync(reportPath).mtime.toISOString();
const listed = failuresOnly || markdown ? scenarios.filter((s) => s.status !== 'passed') : scenarios;

if (markdown) {
  console.log(toMarkdown());
} else {
  console.log(JSON.stringify({ report: reportPath, generatedAt, totals, scenarios: listed }, null, 2));
}

function toMarkdown(): string {
  const counts = Object.entries(totals)
    .filter(([k]) => k !== 'total')
    .map(([k, v]) => `${v} ${k}`)
    .join(', ');
  const out = [`## Test results: ${counts} (of ${totals.total})`, '', `Report generated ${generatedAt}.`];
  if (listed.length === 0) return [...out, '', 'All scenarios passed.'].join('\n');

  const environment = listed.filter((s) => s.likelyCause?.startsWith('ENVIRONMENT')).length;
  if (environment > 0) {
    out.push(
      '',
      `> ${environment} of ${listed.length} failures look environmental (public site blocked, rate limited or unreachable), not test or product bugs.`,
    );
  }
  out.push('', '| Scenario | Failed step | Likely cause |', '|---|---|---|');
  for (const s of listed) {
    out.push(
      `| ${cell(s.scenario)}<br>\`${s.location}\` | ${cell(s.failedStep ?? s.status)} | ${cell(s.likelyCause ?? '-')} |`,
    );
  }
  for (const s of listed) {
    out.push(
      '',
      `### ${s.scenario}`,
      '',
      `- Location: \`${s.location}\``,
      `- Failed step: ${s.failedStep ?? s.status}`,
    );
    if (s.stepDefinition) out.push(`- Step definition: \`${s.stepDefinition}\``);
    if (s.screenshot) out.push(`- Screenshot: \`${s.screenshot}\``);
    if (s.trace) out.push(`- Trace: \`npx playwright show-trace ${s.trace}\``);
    if (s.error) out.push('', '```', s.error, '```');
    if (s.failureContext)
      out.push(
        '',
        '<details><summary>Failure context</summary>',
        '',
        '```',
        s.failureContext,
        '```',
        '</details>',
      );
  }
  return out.join('\n');
}

function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

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

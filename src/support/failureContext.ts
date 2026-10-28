import type { Page } from '@playwright/test';
import type { RecordedCall } from '../api/ApiClient';

/** Network and console problems seen by the browser during one scenario. */
export type BrowserLog = { failedRequests: string[]; consoleErrors: string[] };

const LIMIT = 10;

/** Records what the browser saw so a failure can show it; attach before the first navigation. */
export function watchBrowser(page: Page, log: BrowserLog): void {
  page.on('response', (r) => {
    if (r.status() >= 400) log.failedRequests.push(`${r.request().method()} ${r.url()} -> ${r.status()}`);
  });
  page.on('requestfailed', (r) => {
    log.failedRequests.push(`${r.method()} ${r.url()} -> ${r.failure()?.errorText ?? 'failed'}`);
  });
  page.on('console', (m) => {
    if (m.type() === 'error') log.consoleErrors.push(m.text().split('\n')[0].slice(0, 200));
  });
}

/**
 * Best guess at why a scenario failed, so a reader can tell "the site blocked us" from "the test is wrong"
 * without opening the trace. Environment causes are prefixed ENVIRONMENT so reports can group them.
 */
export async function diagnose(
  page: Page | undefined,
  calls: RecordedCall[],
  log?: BrowserLog,
): Promise<string> {
  if (page) {
    const title = await page.title().catch(() => '');
    const body = await page
      .locator('body')
      .innerText({ timeout: 2000 })
      .catch(() => '');
    if (
      /just a moment|attention required/i.test(title) ||
      /security verification|verify you are human/i.test(body)
    ) {
      return 'ENVIRONMENT: blocked by the Cloudflare bot check on the public site (not a test or product failure)';
    }
  }
  const statuses = [...calls.map((c) => c.status), ...(log?.failedRequests ?? []).map(statusOf)];
  if (statuses.includes(429)) return 'ENVIRONMENT: rate limited by the public site (HTTP 429)';
  if (statuses.includes(423)) {
    return 'ENVIRONMENT: account locked after too many failed logins (HTTP 423); shared demo accounts get locked by other users';
  }
  if (statuses.some((s) => s >= 500)) return 'ENVIRONMENT or PRODUCT: the server returned 5xx';
  if (log?.failedRequests.some((r) => /net::|ERR_|timed out/i.test(r))) {
    return 'ENVIRONMENT: network request failed (site unreachable or slow)';
  }
  return 'TEST or PRODUCT: assertion failed against a reachable site; see the error, screenshot and trace';
}

export function formatFailureContext(opts: {
  hint: string;
  url?: string;
  title?: string;
  calls: RecordedCall[];
  log?: BrowserLog;
}): string {
  const lines = [`Likely cause: ${opts.hint}`];
  if (opts.url) lines.push(`URL at failure: ${opts.url}`);
  if (opts.title !== undefined) lines.push(`Page title: ${opts.title}`);
  if (opts.calls.length) {
    lines.push('', `API calls made by the test (last ${Math.min(LIMIT, opts.calls.length)}):`);
    for (const c of opts.calls.slice(-LIMIT)) {
      lines.push(
        `  ${c.method} ${c.url} -> ${c.status}`,
        `    ${toCurl(c)}`,
        `    response: ${c.responseBody.slice(0, 300)}`,
      );
    }
  }
  if (opts.log?.failedRequests.length) {
    lines.push(
      '',
      'Browser requests that failed or returned >= 400:',
      ...opts.log.failedRequests.slice(-LIMIT).map((r) => `  ${r}`),
    );
  }
  if (opts.log?.consoleErrors.length) {
    lines.push('', 'Browser console errors:', ...opts.log.consoleErrors.slice(-LIMIT).map((e) => `  ${e}`));
  }
  return lines.join('\n');
}

/** A copy-pasteable reproduction of the call. Tokens are shortened: they expire within minutes anyway. */
function toCurl(c: RecordedCall): string {
  const parts = [`curl -i -X ${c.method} '${c.url}'`, `-H 'Accept: application/json'`];
  if (c.token) parts.push(`-H 'Authorization: Bearer ${c.token.slice(0, 12)}…'`);
  if (c.requestBody !== undefined) {
    parts.push(`-H 'Content-Type: application/json'`, `-d '${JSON.stringify(c.requestBody)}'`);
  }
  return parts.join(' ');
}

function statusOf(entry: string): number {
  return Number(entry.match(/-> (\d{3})$/)?.[1] ?? 0);
}

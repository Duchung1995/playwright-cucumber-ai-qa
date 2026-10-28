import fs from 'node:fs';
import path from 'node:path';
import {
  After,
  AfterAll,
  Before,
  BeforeAll,
  setDefaultTimeout,
  Status,
  type ITestCaseHookParameter,
} from '@cucumber/cucumber';
import { chromium, firefox, request, selectors, webkit, type Browser } from '@playwright/test';
import { env } from '../config/env';
import { diagnose, formatFailureContext, watchBrowser } from './failureContext';
import type { CustomWorld } from './world';

const REPORT_DIR = 'reports';
const TRACE_DIR = path.join(REPORT_DIR, 'traces');
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots');

setDefaultTimeout(env.defaultTimeoutMs * 2);

let browser: Browser | undefined;

BeforeAll(async function () {
  // Toolshop exposes stable `data-test` attributes; make getByTestId target them.
  selectors.setTestIdAttribute('data-test');
  fs.mkdirSync(TRACE_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

/** Launched lazily so API-only runs never start a browser. One browser per worker, one context per scenario. */
async function getBrowser(): Promise<Browser> {
  if (!browser) {
    const engines = { chromium, firefox, webkit };
    browser = await engines[env.browser].launch({ headless: env.headless });
  }
  return browser;
}

Before(async function (this: CustomWorld) {
  const ctx = await request.newContext({
    baseURL: env.apiUrl,
    extraHTTPHeaders: { Accept: 'application/json' },
  });
  this.initApi(ctx);
});

Before({ tags: '@ui' }, async function (this: CustomWorld, { pickle }: ITestCaseHookParameter) {
  this.browser = await getBrowser();
  this.context = await this.browser.newContext({
    baseURL: env.baseUrl,
    viewport: { width: 1366, height: 900 },
  });
  this.context.setDefaultTimeout(env.defaultTimeoutMs);
  if (env.trace !== 'off') {
    await this.context.tracing.start({
      title: pickle.name,
      screenshots: true,
      snapshots: true,
      sources: true,
    });
  }
  this.page = await this.context.newPage();
  watchBrowser(this.page, this.browserLog);
});

/**
 * Cucumber runs After hooks in reverse definition order, so the order here is deliberate:
 * @ui evidence capture (defined last) -> data cleanup -> this failure report (defined first).
 */
After(async function (this: CustomWorld, { pickle, result, gherkinDocument }: ITestCaseHookParameter) {
  if (result?.status !== Status.FAILED) return;
  // API scenarios have no page; give them the same context (calls as curl) as UI scenarios get.
  if (!this.failureHint) {
    const calls = this.apiCalls.slice(0, this.callsBeforeCleanup);
    this.failureHint = await diagnose(undefined, calls);
    this.attach(`Failure context\n${formatFailureContext({ hint: this.failureHint, calls })}`, 'text/plain');
  }
  printFailure(
    `${gherkinDocument.uri}:${pickle.location?.line ?? '?'}`,
    pickle.name,
    this.failureHint,
    this.failureArtifacts,
  );
});

/** Removes test data created on the shared public instance, even if the scenario failed midway. */
After(async function (this: CustomWorld) {
  this.callsBeforeCleanup = this.apiCalls.length;
  if (this.createdBrandIds.length > 0 || this.createdUserIds.length > 0) {
    const { email, password } = env.users.admin;
    const token = await this.api.auth.tokenFor(email, password);
    for (const id of this.createdBrandIds) await this.api.brands.delete(id, token);
    for (const id of this.createdUserIds) await this.api.users.delete(id, token);
  }
  await this.request?.dispose();
});

/** Defined last so it runs first: capture evidence before cleanup or reporting touch anything. */
After({ tags: '@ui' }, async function (this: CustomWorld, { pickle, result }: ITestCaseHookParameter) {
  if (!this.context) return;
  const failed = result?.status === Status.FAILED;
  const name = fileSafe(pickle.name);
  const artifacts: string[] = [];

  if (failed) {
    const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
    const png = await this.page.screenshot({ path: screenshotPath, fullPage: true });
    this.attach(png, 'image/png');
    this.attach(`Screenshot: ${screenshotPath}`, 'text/plain');
    artifacts.push(`screenshot: ${screenshotPath}`);

    const hint = await diagnose(this.page, this.apiCalls, this.browserLog);
    const context = formatFailureContext({
      hint,
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
      calls: this.apiCalls,
      log: this.browserLog,
    });
    this.attach(`Failure context\n${context}`, 'text/plain');
    this.attach(`URL at failure: ${this.page.url()}`, 'text/plain');
    this.failureHint = hint;
  }
  if (env.trace !== 'off') {
    const keep = failed || env.trace === 'always';
    const tracePath = path.join(TRACE_DIR, `${name}.zip`);
    await this.context.tracing.stop(keep ? { path: tracePath } : undefined);
    if (keep) this.attach(`Trace: npx playwright show-trace ${tracePath}`, 'text/plain');
    if (failed) artifacts.push(`trace:      npx playwright show-trace ${tracePath}`);
  }
  if (failed) this.failureArtifacts.push(...artifacts);
  await this.context.close();
});

AfterAll(async function () {
  await browser?.close();
});

/** A short block in the run output, so the cause and artifacts are visible without opening the report. */
function printFailure(location: string, name: string, hint: string, artifacts: string[]): void {
  const lines = [
    `\n✖ FAILED ${name}`,
    `  at          ${location}`,
    `  likely:     ${hint}`,
    ...artifacts.map((a) => `  ${a}`),
  ];
  console.error(lines.join('\n'));
}

function fileSafe(name: string): string {
  return `${name
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()}-${Date.now()}`;
}

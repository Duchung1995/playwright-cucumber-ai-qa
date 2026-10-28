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
});

After({ tags: '@ui' }, async function (this: CustomWorld, { pickle, result }: ITestCaseHookParameter) {
  if (!this.context) return;
  const failed = result?.status === Status.FAILED;
  const name = fileSafe(pickle.name);

  if (failed) {
    const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
    const png = await this.page.screenshot({ path: screenshotPath, fullPage: true });
    this.attach(png, 'image/png');
    this.attach(`Screenshot: ${screenshotPath}`, 'text/plain');
    this.attach(`URL at failure: ${this.page.url()}`, 'text/plain');
  }
  if (env.trace !== 'off') {
    const keep = failed || env.trace === 'always';
    const tracePath = path.join(TRACE_DIR, `${name}.zip`);
    await this.context.tracing.stop(keep ? { path: tracePath } : undefined);
    if (keep) this.attach(`Trace: npx playwright show-trace ${tracePath}`, 'text/plain');
  }
  await this.context.close();
});

/** Removes test data created on the shared public instance, even if the scenario failed midway. */
After(async function (this: CustomWorld) {
  if (this.createdBrandIds.length > 0 || this.createdUserIds.length > 0) {
    const { email, password } = env.users.admin;
    const token = await this.api.auth.tokenFor(email, password);
    for (const id of this.createdBrandIds) await this.api.brands.delete(id, token);
    for (const id of this.createdUserIds) await this.api.users.delete(id, token);
  }
  await this.request?.dispose();
});

AfterAll(async function () {
  await browser?.close();
});

function fileSafe(name: string): string {
  return `${name
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()}-${Date.now()}`;
}

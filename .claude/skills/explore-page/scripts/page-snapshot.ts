/**
 * Opens a page of the app under test and prints what a locator author needs: the ARIA snapshot
 * (roles + accessible names for getByRole/getByLabel) and every data-test id (for getByTestId).
 *
 * Usage: npx tsx .claude/skills/explore-page/scripts/page-snapshot.ts <path-or-url> [--login customer|admin] [--scope <data-test id>]
 */
import { chromium, selectors } from '@playwright/test';
import { credentialsFor, env } from '../../../../src/config/env';

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--')) ?? '/';
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

(async () => {
  selectors.setTestIdAttribute('data-test');
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: env.baseUrl });
  try {
    const role = flag('login');
    if (role) {
      const { email, password } = credentialsFor(role);
      await page.goto('/auth/login');
      await page.getByLabel('Email address').fill(email);
      await page.getByTestId('password').fill(password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL(/\/(account|admin)/);
    }
    await page.goto(target);
    await page.waitForLoadState('networkidle');

    const scopeId = flag('scope');
    const scope = scopeId ? page.getByTestId(scopeId) : page.locator('body');
    console.log(`# ${page.url()}\n\n## ARIA snapshot\n${await scope.ariaSnapshot()}`);

    const ids = await scope.locator('[data-test]').evaluateAll((els) =>
      els.map((e) => {
        const tag = e.tagName.toLowerCase();
        const text = (e.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
        return `${e.getAttribute('data-test')} <${tag}>${text ? ` "${text}"` : ''}`;
      }),
    );
    console.log(`\n## data-test ids (getByTestId)\n${[...new Set(ids)].join('\n')}`);
  } finally {
    await browser.close();
  }
})();

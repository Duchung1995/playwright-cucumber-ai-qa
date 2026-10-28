---
name: explore-page
description: Capture the live accessibility tree and data-test ids of any Toolshop page (optionally logged in) to choose or repair locators. Use when writing new page objects or healing a broken locator.
---
# Explore a page for locators

```bash
npx tsx .claude/skills/explore-page/scripts/page-snapshot.ts /auth/register
npx tsx .claude/skills/explore-page/scripts/page-snapshot.ts /checkout --login customer
npx tsx .claude/skills/explore-page/scripts/page-snapshot.ts / --scope filters   # limit to a data-test container
```

The output has two sections:
- **ARIA snapshot**: roles and accessible names. Map a `- button "Login"` line to `getByRole('button', { name: 'Login' })` and a `- textbox "Email address"` line to `getByLabel('Email address')`.
- **data-test ids**: for `getByTestId('<id>')` when no role/label is unique.

To choose a locator:
1. Prefer the role + name pair from the ARIA snapshot when the name is unique on the page.
2. If several elements share it (e.g. two "Password" matches), use the test id.
3. Before committing to a locator, check it's unique and visible:
   ```bash
   npx tsx -e "import {chromium,selectors} from '@playwright/test';(async()=>{selectors.setTestIdAttribute('data-test');const b=await chromium.launch();const p=await b.newPage();await p.goto('https://practicesoftwaretesting.com/auth/login');console.log(await p.getByRole('button',{name:'Login'}).count());await b.close()})()"
   ```

If a Playwright MCP server is configured in the session, `browser_snapshot` gives the same information interactively.

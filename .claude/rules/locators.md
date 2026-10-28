---
paths:
  - "src/pages/**/*.ts"
  - "src/steps/**/*.ts"
---
# Locator rules

Priority, highest first. Use the first one that is unique and stable:
1. `page.getByRole(role, { name })`: what users and assistive tech see.
2. `page.getByLabel(text)`: form controls with a `<label for>`.
3. `page.getByTestId(id)`: Toolshop's `data-test` attributes. The attribute is set globally in `src/support/hooks.ts`.
4. `page.getByText(text | /regex/)`: static copy only. Never use it for dynamic values.

Forbidden in page objects: CSS selectors (`.class`, `#id`, `[attr]`), XPath, `nth()` without a semantic reason, and `$`/`$$`/`waitForSelector`. The `guard-test-code` hook and ESLint enforce this.

Known Toolshop quirks:
- On `/auth/login`, `getByLabel('Password')` also matches the "Forgot your Password?" link. Use `getByTestId('password')`.
- The order confirmation has an `id` and no `data-test`, so use `getByText(/Thanks for your order/)`.
- Country `<option>` labels are ISO names, e.g. "Netherlands (the)".

Waiting:
- Never use sleeps. Use web-first assertions (`await expect(locator).toHaveText(...)`), which retry automatically.
- When an action triggers a backend call whose result you must read, wrap the action with `page.waitForResponse(predicate)`. See `CatalogPage.withCatalogResponse`.

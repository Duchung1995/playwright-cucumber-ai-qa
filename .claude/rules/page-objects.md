---
paths:
  - "src/pages/**/*.ts"
---
# Page Object Model rules

- One class per page or reusable component, in `src/pages`. Extend `BasePage` (it gives `header` and `open()`).
- Locators are `readonly` fields typed `Locator` and assigned in the constructor. Parametrised locators are methods that return `Locator`, e.g. `categoryFilter(name)`.
- Methods express user intent (`search(term)`, `sortBy(label)`, `payWith(method)`), not mechanics (`clickButton3`).
- Page objects do not make test assertions about business outcomes; those belong in step definitions. Only guard assertions that keep an action deterministic are allowed, e.g. `expectPrefilledAddress`.
- Register every new page in `src/pages/index.ts` (`PageObjects`) so steps reach it through `this.pages.<name>`.
- Never put test data or credentials in page objects.

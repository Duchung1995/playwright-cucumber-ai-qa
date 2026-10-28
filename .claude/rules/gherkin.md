---
paths:
  - "features/**/*.feature"
---
# Gherkin rules

- Write steps declaratively, in business language: "I sort the products by "Price (Low - High)"", not "I click the select and choose option 3".
- Each scenario covers one behaviour. Given sets up state, When does one action (or a short chain), Then makes observable assertions.
- Tags:
  - every feature has a layer tag (`@api` or `@ui`) and a requirement tag `@REQ-<AREA>-<NN>` from `docs/requirements.md`
  - optional tags are `@smoke` and `@wip` (excluded from runs)
- Reuse existing steps first: `npm run steps:list -- <keyword>`. Only add a step when no existing phrase fits, and keep its parameters typed (`{int}`, `{string}`).
- Use a Scenario Outline for data variations and a Background only for setup shared by every scenario in the file.
- Scenarios must be independent and order-free. Create the data each scenario needs (API seeding) and never rely on another scenario's leftovers.
- No timing words ("wait 2 seconds"). The `guard-test-code` hook blocks them.

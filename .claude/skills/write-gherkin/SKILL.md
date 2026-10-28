---
name: write-gherkin
description: Author or extend .feature files and step definitions that follow the repo's Gherkin rules and maximise step reuse. Use when turning a user story, bug or requirement into BDD scenarios.
---
# Write Gherkin

1. **Find the requirement ID** in `docs/requirements.md`. Add a new `REQ-*` there if the story is new.
2. **List reusable steps** before writing anything:
   ```bash
   npm run -s steps:list            # all
   npm run -s steps:list -- catalog # filtered
   ```
3. **Draft the feature** in `features/<api|ui>/<kebab-name>.feature`:
   ```gherkin
   @ui @<area> @REQ-UI-NN
   Feature: <capability in business terms>
     As a <role>
     I want <goal>
     So that <value>

     Scenario: <one behaviour, outcome-oriented title>
       Given <state, preferably seeded via API>
       When <single user action>
       Then <specific observable outcome>
   ```
   Use a Scenario Outline + Examples for data variations.
4. **Add only the missing step definitions** under `src/steps/<api|ui>/`. Keep them thin:
   ```ts
   When('I sort the products by {string}', async function (this: CustomWorld, label: string) {
     await this.pages.catalog.sortBy(label);
   });
   ```
   - Assertions use `expect` from `@playwright/test` (web-first for locators).
   - API calls go through `this.api.*` and `await this.remember(res)`.
5. **Validate**: the post-edit hook runs a strict dry run automatically. Then run the scenario 3 times (see `run-tests`).
6. **Judge**: have `qa-judge` score it against `.claude/rubrics/scenario-quality.md`.

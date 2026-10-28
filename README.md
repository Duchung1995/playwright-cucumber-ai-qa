# Toolshop QA: Playwright + TypeScript + Cucumber BDD, with an agentic QA harness

This POC is an end-to-end and integration test framework for a public demo shop. The AI layer is a **Claude Code harness**: an orchestrator, role agents, skills, hooks, rules and rubrics, all checked into `.claude/`.

## 1. Application under test

**Toolshop** ("Practice Software Testing") is an open-source demo shop by Testsmith, with an Angular UI and a Laravel REST API.

| | URL |
|---|---|
| UI | https://practicesoftwaretesting.com |
| API | https://api.practicesoftwaretesting.com |
| API docs (Swagger) | https://api.practicesoftwaretesting.com/api/documentation |

The test accounts are public demo credentials (see `.env.example`):
- `customer@practicesoftwaretesting.com` / `welcome01`
- `admin@practicesoftwaretesting.com` / `welcome01`

## 2. Quick start

Prerequisites: Node.js 22, 24 or ≥ 26 (required by Cucumber 13; `.nvmrc` pins 22) and npm.

```bash
npm install
npx playwright install chromium     # add --with-deps on a fresh Linux box
cp .env.example .env                # defaults work as-is
npm test                            # all 20 scenarios, headless
```

| Command | What it runs |
|---|---|
| `npm test` | all scenarios (default profile, excludes `@wip`) |
| `npm run test:api` | `@api` scenarios only. No browser is launched. |
| `npm run test:ui` | `@ui` scenarios |
| `npm run test:smoke` | `@smoke` subset |
| `npx cucumber-js --tags "@catalog"` | any tag expression |
| `npx cucumber-js features/ui/checkout.feature:10` | a single scenario |
| `npx cucumber-js @reports/@rerun.txt` | re-run the last failures |
| `npm run typecheck` / `npm run lint` | `tsc --noEmit` / ESLint (bans hard waits and ElementHandles) |

Environment overrides:
- `HEADLESS=false` watches the browser.
- `BROWSER=firefox|webkit` switches engine.
- `TRACE=always` keeps traces for passing scenarios too.
- `PARALLEL=4` runs in parallel workers.
- `RETRY=1` retries failed scenarios.

**Reports** go to `reports/`, which is git-ignored:
- `cucumber.html`: human report, with screenshots embedded on failure
- `cucumber.json`: machine-readable
- `screenshots/*.png` and `traces/*.zip`: captured for failed UI scenarios. Open a trace with `npx playwright show-trace <zip>`.

**CI**: `.github/workflows/ci.yml` runs type-check, lint and the suite on every push and PR. It uploads `reports/` as an artifact and writes the failure summary to the job summary.

## 3. Test cases

The assignment's six required test cases map to these scenarios. Extra negative and edge scenarios bring the total to **20 scenarios** (12 API, 8 UI).

### Integration (API): `features/api/`
| # | Assignment requirement | Feature / scenarios | What is asserted |
|---|---|---|---|
| API-1 | Authentication / session | `auth.feature`: valid login; outline × 3 invalid credentials; outline × 2 bad tokens | 200 + JWT format (`login token` zod schema), token works on `GET /users/me` (profile email); 401 + error body + no token for a wrong password, unknown user or empty body; 401 for a missing or forged bearer |
| API-2 | Resource creation & retrieval | `brand-create-retrieve.feature`: create→get; duplicate slug; empty payload | `POST /brands` 201 + schema + payload echo; `GET /brands/{id}` 200 + strict schema + equality; headers `content-type: application/json`, `cache-control: max-age…`, `access-control-allow-origin: *`; 409 duplicate, 422 validation messages |
| API-3 | Update / delete lifecycle | `brand-update-delete.feature`: update→get→delete→get/delete/put; outline × 2 forbidden deletes | `PUT` 200 `{success:true}` + change visible; `DELETE` 204; then GET/DELETE/PUT 404 "Requested item not found"; anonymous delete 401, customer delete 403, brand still retrievable |

### E2E (UI): `features/ui/`
| # | Assignment requirement | Feature / scenarios | What is asserted |
|---|---|---|---|
| UI-1 | Happy path flow | `checkout.feature` | customer **seeded via API** → login → search "Pliers" → open product → qty 2 → add to cart (badge = 2) → cart line + total = unit × qty → billing address **prefilled from the seeded profile** → Cash on Delivery → "Payment was successful" → "Thanks for your order! Your invoice number is INV-…" |
| UI-2 | Validation & edge flow | `form-validation.feature`: empty register form; outline × 3 invalid inputs; wrong-password login | every required-field message; field highlight (`aria-invalid="true"` + `.is-invalid`); field-specific messages for an invalid email, a 5-char password and a non-numeric phone; login error banner and staying on `/auth/login` |
| UI-3 | UI state vs backend sync | `catalog-sync.feature`: category filter + price sort; paging with name sort | UI product names **and** prices equal `GET /products` for the same category/sort, in the same count and order; ascending prices; page 2 in the UI equals API `page=2` |

Every feature carries an `@REQ-*` tag that traces it to `docs/requirements.md`. That file also holds three uncovered requirements as a backlog for the AI generator.

## 4. Framework architecture

```
features/                 Gherkin (.feature) - api/ and ui/
src/
  config/env.ts           typed env + credential lookup
  support/world.ts        CustomWorld: page, page objects, API clients, scenario state, cleanup lists
  support/hooks.ts        lifecycle: lazy browser, context per scenario, tracing, screenshots, cleanup
  pages/                  Page Object Model (BasePage, components/Header, *Page, PageObjects registry)
  api/                    typed API clients over Playwright APIRequestContext
  schemas/                zod response schemas (validated in steps)
  steps/{api,ui}/         thin step definitions
  data/                   unique test-data builders (faker), sort option mapping
  utils/                  assertion helpers
docs/                     requirements + AI harness design
.claude/                  agentic QA harness (see section 5)
cucumber.mjs              profiles: default, api, ui, smoke, dryrun
```

Key design choices:
- **Custom World** (`src/support/world.ts`)
  - holds the Playwright page and lazily built page objects (`this.pages.catalog`)
  - holds typed API clients (`this.api.brands`)
  - keeps a per-scenario `state` bag and lists of created entities
  - `remember(response)` stores API responses, so generic steps like `the response status should be 201` and `the response body should match the "brand" schema` work for any endpoint
- **Hooks** (`src/support/hooks.ts`)
  - The browser launches lazily, once per worker, so the API profile never starts one.
  - A fresh `BrowserContext` per scenario gives isolation.
  - Tracing (screenshots + DOM snapshots + sources) is always recorded. It's saved only on failure (`TRACE=on-failure`) along with a full-page screenshot, and both are attached to the report.
  - An `After` hook deletes brands and users that the scenario created on the shared instance, even when the scenario failed.
- **POM with typed locators**: `readonly` `Locator` fields assigned in the constructor, plus intent-level methods (`search`, `sortBy`, `filterByCategory`, `payWith`). Parametrised locators are methods (`categoryFilter(name)`, `pageButton(n)`).
- **Deterministic locators**: `getByRole` → `getByLabel` → `getByTestId` (Toolshop's `data-test`, set via `selectors.setTestIdAttribute`), plus `getByText` for static copy only. No CSS or XPath.
- **Zero sleeps**:
  - Web-first assertions (`toHaveText([...])` on lists, `toHaveValue`, `toHaveAttribute`) retry until the UI settles.
  - Actions that refetch the catalog wait on `page.waitForResponse(predicate)`.
  - Hard waits are banned by ESLint (`no-restricted-syntax`) and by a Claude hook.
- **Test data isolation on a shared public instance**:
  - Brands get unique slugs and customers unique emails.
  - The checkout scenario registers its own customer through the API, because anyone can edit the shared demo account's profile. The seeded address comes from the app's `/postcode-lookup`, because invoices are validated against it. Both were real flakes found with the harness's trace tooling (see `docs/ai-harness.md`, "Real catches").
- **Schema validation**: zod schemas in `src/schemas`. `api-schema-check` diffs them against the live OpenAPI spec.

## 5. AI integration: agentic QA workflow as a Claude Code harness

The AI layer is not a runtime library. It's a **Claude Code harness in `.claude/`**, used only for this repository: anyone who clones the repo and opens it in Claude Code gets the workflows, and invokes them when needed. Full design, diagram and examples: **[docs/ai-harness.md](docs/ai-harness.md)**.

| Concept | Implementation |
|---|---|
| **Orchestrator** | `/qa <goal>` (`.claude/commands/qa.md`) plans, delegates to role agents, enforces rubric gates and escalates. Focused pipelines: `/qa-run`, `/qa-triage`, `/qa-heal`, `/qa-generate`, `/qa-coverage`, `/qa-report`. |
| **Agent roles** (`.claude/agents/`) | `failure-triage` (read-only diagnosis), `test-healer` (policy-bound fixes), `scenario-generator` (story → Gherkin + steps + POM), `coverage-reviewer` (REQ ↔ test gaps), `run-reporter` (Markdown summary), `qa-judge` (independent rubric evaluator) |
| **Skills / tools** (`.claude/skills/`) | `run-tests`, `parse-cucumber-report`*, `inspect-trace`*, `explore-page`*, `write-gherkin`*, `create-page-object`, `api-schema-check`* (* = includes an executable TypeScript script) |
| **Guardrails** (`.claude/hooks/`) | block sleeps/CSS/XPath before they're written; protect `.env`/lockfile/reports/rubrics; type-check and dry-run Gherkin after each edit; inject the last-run status at session start |
| **Rules** (`.claude/rules/`) | path-scoped conventions: locators, page objects, Gherkin, API tests, healing policy |
| **Rubric evaluation** (`.claude/rubrics/`) | scored gates for scenario quality, triage classification and healing fixes. Generators never grade themselves. |

To try it:
```bash
claude                      # in the repo root
> /qa-run ui                # run → parse → triage failures → write reports/qa-summary.md
> /qa-coverage              # find gaps (REQ-API-04, REQ-UI-04, REQ-UI-05 are open)
> /qa-generate REQ-API-04   # generate + judge new scenarios
```

The skill scripts also work without Claude:
```bash
npm run -s report:parse -- --failures-only
npm run -s steps:list -- brand
npx tsx .claude/skills/inspect-trace/scripts/trace-summary.ts reports/traces/<file>.zip
npx tsx .claude/skills/explore-page/scripts/page-snapshot.ts /auth/register
npx tsx .claude/skills/api-schema-check/scripts/schema-drift.ts
```

## 6. Notes and limitations
- The target is a **shared public instance**. Other users change data concurrently, and it can be slow or briefly unavailable. Tests create their own data and clean it up. Catalog assertions compare the UI with the live API rather than with hard-coded product lists, so they stay valid when the catalog changes.
- The storefront always sends a default price range (`between=price,1,100`). `ProductsApi` mirrors it so UI and API are compared like for like.
- The UI's catalog calls use the HTTP `QUERY` method. The tests' independent API oracle uses the equivalent `GET` with query parameters.
- `.claude/settings.local.json` (personal settings) is git-ignored. The shared `.claude/settings.json` is committed.

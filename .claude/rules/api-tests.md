---
paths:
  - "src/api/**/*.ts"
  - "src/steps/api/**/*.ts"
  - "features/api/**/*.feature"
---
# API test rules

- Make every HTTP call through the typed clients in `src/api` (they wrap Playwright's `APIRequestContext`, never throw on status and add the bearer token). Raw `this.request` is only for deliberately malformed requests.
- Store responses with `await this.remember(res)` so the generic steps in `src/steps/api/common.steps.ts` can assert status, schema, fields and headers.
- Validate response shapes with the zod schemas in `src/schemas`. Add a schema rather than asserting fields one by one.
- Data created on the shared public instance must be unique (`src/data/builders.ts`) and registered for cleanup (`this.createdBrandIds`, `this.createdUserIds`). The After hook deletes it.
- Assert both the status code and the error body for negative cases.
- Seeded addresses must come from `this.api.address.lookup(...)`: the backend rejects invoices whose city does not match its postcode lookup.

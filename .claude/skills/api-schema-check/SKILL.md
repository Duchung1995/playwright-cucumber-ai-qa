---
name: api-schema-check
description: Detect drift between the zod response schemas used by the API tests and the live Toolshop OpenAPI spec. Use when an API schema assertion fails, before adding a new endpoint test, or during coverage review.
---
# API schema check

```bash
npx tsx .claude/skills/api-schema-check/scripts/schema-drift.ts
```

- `✗ asserted but not in spec`: our test expects a field the API no longer documents. Either the spec dropped it (check the live response) or our schema is wrong.
- `in spec, not asserted` is informational. Add it to the zod schema only if the field matters for the requirement under test.

The spec is at `https://api.practicesoftwaretesting.com/docs?api-docs.json` and the human UI at `https://api.practicesoftwaretesting.com/api/documentation`. To look at one component:
```bash
curl -s 'https://api.practicesoftwaretesting.com/docs?api-docs.json' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.stringify(JSON.parse(d).components.schemas.BrandResponse,null,2)))"
```

When adding an endpoint test:
1. Find the path in the spec.
2. Add a zod schema to `src/schemas/index.ts` and register it in `schemas` so `the response body should match the "<name>" schema` works.
3. Add a typed method to the matching client in `src/api/`.
4. Add the mapping to `MAPPING` in `schema-drift.ts`.

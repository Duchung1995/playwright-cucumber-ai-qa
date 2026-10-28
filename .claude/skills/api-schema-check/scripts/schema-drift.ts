/**
 * Compares the zod response schemas in src/schemas with the live OpenAPI spec and reports drift:
 * fields the tests assert that the spec no longer declares, and spec fields the tests ignore.
 *
 * Usage: npx tsx .claude/skills/api-schema-check/scripts/schema-drift.ts
 */
import { brandSchema, productSchema, userSchema } from '../../../../src/schemas';
import { env } from '../../../../src/config/env';

const SPEC_URL = `${env.apiUrl}/docs?api-docs.json`;

/** zod schema → OpenAPI component it should mirror. */
const MAPPING = [
  { zod: 'brandSchema', schema: brandSchema, component: 'BrandResponse' },
  { zod: 'productSchema', schema: productSchema, component: 'ProductResponse' },
  { zod: 'userSchema', schema: userSchema, component: 'UserResponse' },
];

(async () => {
  const spec = (await (await fetch(SPEC_URL)).json()) as {
    components: { schemas: Record<string, { properties?: Record<string, unknown> }> };
  };
  let drift = 0;
  for (const { zod, schema, component } of MAPPING) {
    const specProps = Object.keys(spec.components.schemas[component]?.properties ?? {});
    const zodProps = Object.keys(schema.shape);
    if (specProps.length === 0) {
      console.log(`? ${zod}: component ${component} not found in spec`);
      continue;
    }
    const notInSpec = zodProps.filter((p) => !specProps.includes(p));
    const untested = specProps.filter((p) => !zodProps.includes(p));
    drift += notInSpec.length;
    console.log(`${notInSpec.length ? '✗' : '✓'} ${zod} ↔ ${component}`);
    if (notInSpec.length) console.log(`    asserted but not in spec: ${notInSpec.join(', ')}`);
    if (untested.length) console.log(`    in spec, not asserted:    ${untested.join(', ')}`);
  }
  console.log(`\nSpec: ${SPEC_URL}`);
  process.exit(drift > 0 ? 1 : 0);
})();

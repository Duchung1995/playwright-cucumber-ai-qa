import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from '../../support/world';
import type { SchemaName } from '../../schemas';
import { expectSchema } from '../../utils/assertions';

Then('the response status should be {int}', async function (this: CustomWorld, status: number) {
  expect(this.lastResponse.status(), `Body: ${JSON.stringify(this.state.responseBody)}`).toBe(status);
});

Then(
  'the response body should match the {string} schema',
  async function (this: CustomWorld, schema: string) {
    await expectSchema(this.lastResponse, schema as SchemaName);
  },
);

Then(
  'the response header {string} should contain {string}',
  async function (this: CustomWorld, header: string, expected: string) {
    expect(this.lastResponse.headers()[header.toLowerCase()]).toContain(expected);
  },
);

Then(
  'the response body field {string} should equal {string}',
  function (this: CustomWorld, field: string, expected: string) {
    expect(bodyField(this, field)).toEqual(expected);
  },
);

Then(
  'the response body field {string} should contain {string}',
  function (this: CustomWorld, field: string, expected: string) {
    // Validation errors come back as arrays of messages, e.g. { "slug": ["A brand already exists ..."] }
    const value = bodyField(this, field);
    expect(Array.isArray(value) ? value.join(' ') : String(value)).toContain(expected);
  },
);

function bodyField(world: CustomWorld, field: string): unknown {
  const body = world.state.responseBody as Record<string, unknown> | undefined;
  expect(body, 'response has no JSON body').toBeTruthy();
  expect(body, `response body has no "${field}" field`).toHaveProperty(field);
  return body![field];
}

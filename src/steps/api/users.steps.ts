import { Given } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { buildCustomer } from '../../data/builders';
import type { CustomWorld } from '../../support/world';

/** A throwaway customer, deleted after the scenario. Refer to it as the "new customer" role. */
Given('a new customer is registered via the API', async function (this: CustomWorld) {
  // Invoices are validated against the app's postcode lookup, so seed an address it agrees with.
  const customer = buildCustomer(await this.api.address.lookup('NL', '3511 AA', '1'));
  const res = await this.api.users.register(customer);
  expect(res.status(), `precondition: registration failed: ${await res.text()}`).toBe(201);
  const { id } = (await res.json()) as { id: string };
  this.state.customer = { ...customer, id };
  this.createdUserIds.push(id);
});

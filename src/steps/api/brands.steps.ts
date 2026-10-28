import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { buildBrand } from '../../data/builders';
import { brandSchema } from '../../schemas';
import type { CustomWorld } from '../../support/world';

Given('a unique brand payload', function (this: CustomWorld) {
  this.state.brandPayload = buildBrand();
});

Given('a brand exists', async function (this: CustomWorld) {
  this.state.brandPayload = buildBrand();
  const res = await this.api.brands.create(this.state.brandPayload);
  expect(res.status(), 'precondition: brand should be created').toBe(201);
  this.state.brand = brandSchema.parse(await res.json());
  this.createdBrandIds.push(this.state.brand.id);
});

When('I create the brand via the API', async function (this: CustomWorld) {
  await this.remember(await this.api.brands.create(this.state.brandPayload!));
  const parsed = brandSchema.safeParse(this.state.responseBody);
  if (parsed.success) {
    this.state.brand = parsed.data;
    this.createdBrandIds.push(parsed.data.id);
  }
});

When('I create another brand with the same slug', async function (this: CustomWorld) {
  const duplicate = buildBrand({ slug: this.state.brand!.slug });
  await this.remember(await this.api.brands.create(duplicate));
});

When('I create a brand with an empty payload', async function (this: CustomWorld) {
  await this.remember(await this.api.client.post('/brands', { data: {} }));
});

When('I retrieve the created brand by id', async function (this: CustomWorld) {
  await this.remember(await this.api.brands.get(this.state.brand!.id));
});

When(
  'I update the brand name to {string} as the {string} user',
  async function (this: CustomWorld, name: string, role: string) {
    const token = await tokenFor(this, role);
    const { id, slug } = this.state.brand!;
    await this.remember(await this.api.brands.update(id, { name, slug }, token));
  },
);

When('I delete the brand as the {string} user', async function (this: CustomWorld, role: string) {
  await this.remember(await this.api.brands.delete(this.state.brand!.id, await tokenFor(this, role)));
});

When('I delete the brand without authentication', async function (this: CustomWorld) {
  await this.remember(await this.api.brands.delete(this.state.brand!.id));
});

Then('the response body should echo the brand payload', function (this: CustomWorld) {
  expect(this.state.responseBody).toMatchObject(this.state.brandPayload!);
});

Then('the retrieved brand should equal the created brand', function (this: CustomWorld) {
  expect(this.state.responseBody).toEqual(this.state.brand);
});

async function tokenFor(world: CustomWorld, role: string): Promise<string> {
  const { email, password } = world.credentials(role);
  return world.api.auth.tokenFor(email, password);
}

import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { buildCustomer } from '../../data/builders';
import type { CustomWorld } from '../../support/world';
import { parsePrice } from '../../utils/assertions';

Given('a new customer is registered via the API', async function (this: CustomWorld) {
  const customer = buildCustomer();
  const res = await this.api.users.register(customer);
  expect(res.status(), `precondition: registration failed: ${await res.text()}`).toBe(201);
  const { id } = (await res.json()) as { id: string };
  this.state.customer = { ...customer, id };
  this.createdUserIds.push(id);
});

Given('I am signed in as the new customer', async function (this: CustomWorld) {
  const { email, password } = this.state.customer!;
  await this.pages.login.open();
  await this.pages.login.login(email, password);
  await expect(this.page).toHaveURL(/\/account$/);
});

When('I search the catalog for {string}', async function (this: CustomWorld, term: string) {
  await this.pages.catalog.open();
  await this.pages.catalog.search(term);
  await expect(this.pages.catalog.searchCaption).toContainText(term);
});

Then('the search results should include {string}', async function (this: CustomWorld, name: string) {
  await expect(this.pages.catalog.product(name)).toBeVisible();
});

When('I open the product {string}', async function (this: CustomWorld, name: string) {
  await this.pages.catalog.openProduct(name);
  await expect(this.pages.product.name).toHaveText(name);
});

When('I add {int} of the product to the cart', async function (this: CustomWorld, qty: number) {
  const { product } = this.pages;
  this.state.unitPrice = parsePrice(await product.unitPrice.innerText());
  await product.setQuantity(qty);
  await expect(product.quantity).toHaveValue(String(qty));
  await product.addToCart();
});

Then('the cart badge should show {int} items', async function (this: CustomWorld, count: number) {
  await expect(this.pages.checkout.header.cartQuantity).toHaveText(String(count));
});

When('I open the cart', async function (this: CustomWorld) {
  await this.pages.checkout.header.openCart();
  await expect(this.page).toHaveURL(/\/checkout$/);
});

Then(
  "the cart should contain {int} x {string} priced at the product's unit price",
  async function (this: CustomWorld, qty: number, name: string) {
    const { checkout } = this.pages;
    await expect(checkout.cartItemTitles).toHaveText([name]);
    await expect(checkout.cartItemQuantities).toHaveValue(String(qty));
    const expectedTotal = (this.state.unitPrice! * qty).toFixed(2);
    await expect(checkout.cartTotal).toHaveText(`$${expectedTotal}`);
  },
);

When('I continue past the sign-in step', async function (this: CustomWorld) {
  const { checkout } = this.pages;
  await checkout.proceedFromCart.click();
  await expect(checkout.alreadyLoggedIn).toBeVisible();
  await checkout.proceedFromSignIn.click();
});

Then('the billing address should be prefilled from my profile', async function (this: CustomWorld) {
  const { address } = this.state.customer!;
  await this.pages.checkout.expectPrefilledAddress(
    address.country,
    address.postal_code,
    address.house_number,
  );
});

When('I continue to payment', async function (this: CustomWorld) {
  const { checkout } = this.pages;
  await expect(checkout.proceedFromAddress).toBeEnabled();
  await checkout.proceedFromAddress.click();
});

When('I pay with {string}', async function (this: CustomWorld, method: string) {
  await this.pages.checkout.payWith(method);
});

Then('I should see the payment message {string}', async function (this: CustomWorld, message: string) {
  await expect(this.pages.checkout.paymentSuccess).toHaveText(message);
});

When('I place the order', async function (this: CustomWorld) {
  await this.pages.checkout.confirm.click();
});

Then('I should see an order confirmation with an invoice number', async function (this: CustomWorld) {
  await expect(this.pages.checkout.orderConfirmation).toHaveText(
    /Thanks for your order! Your invoice number is INV-\d+/,
    { timeout: 15_000 },
  );
});

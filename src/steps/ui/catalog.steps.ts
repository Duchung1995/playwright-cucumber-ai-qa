import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { sortParamFor } from '../../data/sortOptions';
import type { CustomWorld } from '../../support/world';
import { expectNonDecreasing, parsePrice } from '../../utils/assertions';

Given('I am on the catalog page', async function (this: CustomWorld) {
  await this.pages.catalog.open();
  await expect(this.pages.catalog.productNames.first()).toBeVisible();
});

When('I sort the products by {string}', async function (this: CustomWorld, label: string) {
  await this.pages.catalog.sortBy(label);
});

When('I filter the products by the {string} category', async function (this: CustomWorld, category: string) {
  await this.pages.catalog.filterByCategory(category);
});

When('I go to catalog page {int}', async function (this: CustomWorld, n: number) {
  await this.pages.catalog.goToPage(n);
});

Then(
  'the listed products should match the API for category {string} sorted by {string}',
  async function (this: CustomWorld, category: string, sortLabel: string) {
    const categoryId = await this.api.products.categoryIdByName(category);
    const apiPage = await this.api.products.list({ categoryId, sort: sortParamFor(sortLabel) });
    await expectCatalogToMatch(this, apiPage.data);
  },
);

Then(
  'the listed products should match API page {int} sorted by {string}',
  async function (this: CustomWorld, page: number, sortLabel: string) {
    const apiPage = await this.api.products.list({ page, sort: sortParamFor(sortLabel) });
    expect(apiPage.current_page).toBe(page);
    await expectCatalogToMatch(this, apiPage.data);
  },
);

Then('the listed prices should be in ascending order', async function (this: CustomWorld) {
  const prices = (await this.pages.catalog.productPrices.allInnerTexts()).map(parsePrice);
  expectNonDecreasing(prices);
});

/** Web-first assertions retry until the re-rendered list matches the backend, so no explicit wait is needed. */
async function expectCatalogToMatch(world: CustomWorld, products: { name: string; price: number }[]) {
  const { catalog } = world.pages;
  await expect(catalog.productNames).toHaveCount(products.length);
  await expect(catalog.productNames).toHaveText(products.map((p) => p.name));
  await expect(catalog.productPrices).toHaveText(products.map((p) => `$${p.price.toFixed(2)}`));
}

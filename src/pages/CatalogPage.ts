import type { Locator, Page, Response } from '@playwright/test';
import { env } from '../config/env';
import { BasePage } from './BasePage';

export class CatalogPage extends BasePage {
  protected readonly path = '/';

  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly searchCaption: Locator;
  readonly sortSelect: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByTestId('search-query');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.searchCaption = page.getByTestId('search-caption');
    this.sortSelect = page.getByTestId('sort');
    this.productNames = page.getByTestId('product-name');
    this.productPrices = page.getByTestId('product-price');
  }

  categoryFilter(name: string): Locator {
    return this.page.getByRole('checkbox', { name, exact: true });
  }

  pageButton(n: number): Locator {
    return this.page.getByRole('button', { name: `Page-${n}`, exact: true });
  }

  product(name: string): Locator {
    return this.productNames.getByText(name, { exact: true });
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }

  /** Each interaction re-queries the catalog; wait for that backend response instead of sleeping. */
  async sortBy(label: string): Promise<void> {
    await this.withCatalogResponse(() => this.sortSelect.selectOption({ label }));
  }

  async filterByCategory(name: string): Promise<void> {
    await this.withCatalogResponse(() => this.categoryFilter(name).check());
  }

  async goToPage(n: number): Promise<void> {
    await this.withCatalogResponse(() => this.pageButton(n).click());
  }

  async openProduct(name: string): Promise<void> {
    await this.product(name).click();
  }

  private async withCatalogResponse(action: () => Promise<unknown>): Promise<Response> {
    const response = this.page.waitForResponse(
      (r) => r.url().startsWith(`${env.apiUrl}/products`) && !r.url().includes('/products/') && r.ok(),
    );
    await action();
    return response;
  }
}

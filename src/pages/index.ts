import type { Page } from '@playwright/test';
import { AccountPage } from './AccountPage';
import { CatalogPage } from './CatalogPage';
import { CheckoutPage } from './CheckoutPage';
import { LoginPage } from './LoginPage';
import { ProductPage } from './ProductPage';
import { RegisterPage } from './RegisterPage';

/** Page objects for one browser page, created on first use. */
export class PageObjects {
  private readonly cache = new Map<string, unknown>();

  constructor(private readonly page: Page) {}

  get login(): LoginPage {
    return this.get('login', () => new LoginPage(this.page));
  }
  get account(): AccountPage {
    return this.get('account', () => new AccountPage(this.page));
  }
  get register(): RegisterPage {
    return this.get('register', () => new RegisterPage(this.page));
  }
  get catalog(): CatalogPage {
    return this.get('catalog', () => new CatalogPage(this.page));
  }
  get product(): ProductPage {
    return this.get('product', () => new ProductPage(this.page));
  }
  get checkout(): CheckoutPage {
    return this.get('checkout', () => new CheckoutPage(this.page));
  }

  private get<T>(key: string, create: () => T): T {
    if (!this.cache.has(key)) this.cache.set(key, create());
    return this.cache.get(key) as T;
  }
}

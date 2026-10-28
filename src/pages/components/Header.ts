import type { Locator, Page } from '@playwright/test';

export class Header {
  readonly signIn: Locator;
  readonly userMenu: Locator;
  readonly cart: Locator;
  readonly cartQuantity: Locator;

  constructor(page: Page) {
    this.signIn = page.getByTestId('nav-sign-in');
    this.userMenu = page.getByTestId('nav-menu');
    this.cart = page.getByTestId('nav-cart');
    this.cartQuantity = page.getByTestId('cart-quantity');
  }

  async openCart(): Promise<void> {
    await this.cart.click();
  }
}

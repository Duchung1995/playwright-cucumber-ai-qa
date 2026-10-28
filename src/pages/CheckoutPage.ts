import { expect, type Locator, type Page } from '@playwright/test';
import type { Address } from '../api/UsersApi';
import { BasePage } from './BasePage';

/** The checkout wizard: cart → sign in → billing address → payment. All steps live under /checkout. */
export class CheckoutPage extends BasePage {
  protected readonly path = '/checkout';

  // Step 1: cart
  readonly cartItemTitles: Locator;
  readonly cartItemQuantities: Locator;
  readonly cartTotal: Locator;
  readonly proceedFromCart: Locator;
  // Step 2: sign in
  readonly alreadyLoggedIn: Locator;
  readonly proceedFromSignIn: Locator;
  // Step 3: billing address
  readonly country: Locator;
  readonly postalCode: Locator;
  readonly houseNumber: Locator;
  readonly street: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly proceedFromAddress: Locator;
  // Step 4: payment
  readonly paymentMethod: Locator;
  readonly confirm: Locator;
  readonly paymentSuccess: Locator;
  readonly orderConfirmation: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItemTitles = page.getByTestId('product-title');
    this.cartItemQuantities = page.getByTestId('product-quantity');
    this.cartTotal = page.getByTestId('cart-total');
    this.proceedFromCart = page.getByTestId('proceed-1');

    this.alreadyLoggedIn = page.getByText(/you are already logged in/i);
    this.proceedFromSignIn = page.getByTestId('proceed-2');

    this.country = page.getByLabel('Country');
    this.postalCode = page.getByLabel('Postal code');
    this.houseNumber = page.getByLabel('House number');
    this.street = page.getByLabel('Street');
    this.city = page.getByLabel('City');
    this.state = page.getByLabel('State');
    this.proceedFromAddress = page.getByTestId('proceed-3');

    this.paymentMethod = page.getByTestId('payment-method');
    this.confirm = page.getByTestId('finish');
    this.paymentSuccess = page.getByTestId('payment-success-message');
    this.orderConfirmation = page.getByText(/Thanks for your order/);
  }

  /**
   * The billing step is prefilled asynchronously from the signed-in customer's profile, and a
   * postcode lookup then rewrites street/city/state. Web-first assertions wait for both to settle.
   */
  async expectPrefilledAddress(address: Address): Promise<void> {
    await expect(this.country).toHaveValue(address.country);
    await expect(this.postalCode).toHaveValue(address.postal_code);
    await expect(this.houseNumber).toHaveValue(address.house_number);
    await expect(this.street).toHaveValue(address.street);
    await expect(this.city).toHaveValue(address.city);
    await expect(this.state).toHaveValue(address.state);
  }

  async payWith(method: string): Promise<void> {
    await this.paymentMethod.selectOption({ label: method });
    await this.confirm.click();
  }
}

import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  protected readonly path = '/auth/login';

  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.email = page.getByLabel('Email address');
    // The "Forgot your Password?" link also matches a "Password" label lookup, so use the test id.
    this.password = page.getByTestId('password');
    this.submit = page.getByRole('button', { name: 'Login' });
    this.error = page.getByTestId('login-error');
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}

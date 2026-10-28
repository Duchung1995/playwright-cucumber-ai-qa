import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { credentialsFor } from '../../config/env';
import type { CustomWorld } from '../../support/world';

Given('I am on the login page', async function (this: CustomWorld) {
  await this.pages.login.open();
});

Given('I am signed in as the {string} user', async function (this: CustomWorld, role: string) {
  const { email, password } = credentialsFor(role);
  await this.pages.login.open();
  await this.pages.login.login(email, password);
  await expect(this.page).toHaveURL(/\/account$/);
  await expect(this.pages.account.title).toHaveText('My account');
});

When(
  'I log in with the {string} email and password {string}',
  async function (this: CustomWorld, role: string, password: string) {
    await this.pages.login.login(credentialsFor(role).email, password);
  },
);

Then('I should see the login error {string}', async function (this: CustomWorld, message: string) {
  await expect(this.pages.login.error).toHaveText(message);
});

Then('I should still be on the login page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/\/auth\/login$/);
  await expect(this.pages.login.submit).toBeVisible();
});

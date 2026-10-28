import { Given, Then, When, type DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { toRegisterField } from '../../pages/RegisterPage';
import type { CustomWorld } from '../../support/world';

Given('I am on the registration page', async function (this: CustomWorld) {
  await this.pages.register.open();
});

When('I submit the registration form', async function (this: CustomWorld) {
  await this.pages.register.submit.click();
});

When(
  'I enter {string} into the {string} registration field',
  async function (this: CustomWorld, value: string, field: string) {
    await this.pages.register.fill(toRegisterField(field), value);
  },
);

Then(
  'the following registration fields should show an error:',
  async function (this: CustomWorld, table: DataTable) {
    for (const { field, message } of table.hashes()) {
      await expect(this.pages.register.errorFor(toRegisterField(field))).toContainText(message);
    }
  },
);

Then(
  'the {string} registration field should show the error {string}',
  async function (this: CustomWorld, field: string, message: string) {
    await expect(this.pages.register.errorFor(toRegisterField(field))).toContainText(message);
  },
);

Then(
  'the {string} registration field should be highlighted as invalid',
  async function (this: CustomWorld, field: string) {
    const input = this.pages.register.field(toRegisterField(field));
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveClass(/is-invalid/);
  },
);

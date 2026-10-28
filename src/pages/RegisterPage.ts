import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Field keys match the form's `data-test` ids, which also name their `<field>-error` messages. */
export const REGISTER_FIELDS = {
  'first name': 'first-name',
  'last name': 'last-name',
  'date of birth': 'dob',
  country: 'country',
  'postal code': 'postal_code',
  'house number': 'house_number',
  street: 'street',
  city: 'city',
  state: 'state',
  phone: 'phone',
  email: 'email',
  password: 'password',
} as const;

export type RegisterField = keyof typeof REGISTER_FIELDS;

export class RegisterPage extends BasePage {
  protected readonly path = '/auth/register';

  readonly submit: Locator;

  constructor(page: Page) {
    super(page);
    this.submit = page.getByRole('button', { name: 'Register' });
  }

  field(name: RegisterField): Locator {
    return this.page.getByTestId(REGISTER_FIELDS[name]);
  }

  errorFor(name: RegisterField): Locator {
    return this.page.getByTestId(`${REGISTER_FIELDS[name]}-error`);
  }

  async fill(name: RegisterField, value: string): Promise<void> {
    await this.field(name).fill(value);
  }
}

export function toRegisterField(name: string): RegisterField {
  if (!(name in REGISTER_FIELDS)) throw new Error(`Unknown register field "${name}"`);
  return name as RegisterField;
}

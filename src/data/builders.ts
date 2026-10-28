import { faker } from '@faker-js/faker';
import type { BrandPayload } from '../api/BrandsApi';
import type { NewUser } from '../api/UsersApi';

/** Unique per run so scenarios never collide on the shared public instance (slug is unique server-side). */
export function buildBrand(overrides: Partial<BrandPayload> = {}): BrandPayload {
  const suffix = `${Date.now().toString(36)}-${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`;
  return {
    name: `QA ${faker.company.name()} ${suffix}`.slice(0, 60),
    slug: `qa-${suffix}`,
    ...overrides,
  };
}

/** A fresh customer with a complete Dutch address, so checkout never depends on the shared demo account's profile. */
export function buildCustomer(): NewUser {
  const first = faker.person.firstName();
  const last = faker.person.lastName();
  return {
    first_name: first,
    last_name: last,
    dob: '1990-01-01',
    phone: faker.string.numeric(10),
    email: `qa-${Date.now().toString(36)}-${faker.string.alphanumeric({ length: 5, casing: 'lower' })}@example.com`,
    password: `Qa!${faker.string.alphanumeric(10)}#9z`,
    address: {
      street: 'Domplein',
      house_number: '1',
      city: 'Utrecht',
      state: 'Utrecht',
      country: 'NL',
      postal_code: '3511 AA',
    },
  };
}

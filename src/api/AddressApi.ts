import { ApiClient } from './ApiClient';
import type { Address } from './UsersApi';

export class AddressApi {
  constructor(private readonly client: ApiClient) {}

  /**
   * The storefront autocompletes street/city/state from this lookup and invoices are validated
   * against it, so seeded addresses must come from here to be accepted at checkout.
   */
  async lookup(country: string, postalCode: string, houseNumber: string): Promise<Address> {
    const res = await this.client.get('/postcode-lookup', {
      params: { country, postcode: postalCode, house_number: houseNumber },
    });
    if (res.status() !== 200) throw new Error(`Postcode lookup failed with ${res.status()}`);
    const body = (await res.json()) as { street: string; city: string; state: string };
    return {
      street: body.street,
      house_number: houseNumber,
      city: body.city,
      state: body.state,
      country,
      postal_code: postalCode,
    };
  }
}

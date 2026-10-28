import type { APIResponse } from '@playwright/test';
import { ApiClient } from './ApiClient';

export type Address = {
  street: string;
  house_number: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
};

export type NewUser = {
  first_name: string;
  last_name: string;
  dob: string;
  phone: string;
  email: string;
  password: string;
  address: Address;
};

export class UsersApi {
  constructor(private readonly client: ApiClient) {}

  register(user: NewUser): Promise<APIResponse> {
    return this.client.post('/users/register', { data: user });
  }

  delete(id: string, token: string): Promise<APIResponse> {
    return this.client.delete(`/users/${id}`, { token });
  }
}

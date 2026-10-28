import type { APIResponse } from '@playwright/test';
import { ApiClient } from './ApiClient';
import { loginTokenSchema } from '../schemas';

export class AuthApi {
  constructor(private readonly client: ApiClient) {}

  login(email: string, password: string): Promise<APIResponse> {
    return this.client.post('/users/login', { data: { email, password } });
  }

  me(token?: string): Promise<APIResponse> {
    return this.client.get('/users/me', { token });
  }

  /** Logs in and returns the access token, failing fast if authentication is not successful. */
  async tokenFor(email: string, password: string): Promise<string> {
    const res = await this.login(email, password);
    if (res.status() !== 200) {
      throw new Error(`Login for ${email} failed with ${res.status()}: ${await res.text()}`);
    }
    return loginTokenSchema.parse(await res.json()).access_token;
  }
}

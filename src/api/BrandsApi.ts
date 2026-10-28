import type { APIResponse } from '@playwright/test';
import { ApiClient } from './ApiClient';

export type BrandPayload = { name: string; slug: string };

export class BrandsApi {
  constructor(private readonly client: ApiClient) {}

  create(payload: BrandPayload, token?: string): Promise<APIResponse> {
    return this.client.post('/brands', { data: payload, token });
  }

  get(id: string): Promise<APIResponse> {
    return this.client.get(`/brands/${id}`);
  }

  update(id: string, payload: BrandPayload, token?: string): Promise<APIResponse> {
    return this.client.put(`/brands/${id}`, { data: payload, token });
  }

  delete(id: string, token?: string): Promise<APIResponse> {
    return this.client.delete(`/brands/${id}`, { token });
  }
}

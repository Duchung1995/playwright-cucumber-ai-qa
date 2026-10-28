import type { APIRequestContext, APIResponse } from '@playwright/test';

export type RequestOptions = {
  token?: string;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
};

/** Thin wrapper over Playwright's APIRequestContext that handles bearer auth and JSON bodies. */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  get(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.request.get(path, this.build(opts));
  }

  post(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.request.post(path, this.build(opts));
  }

  put(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.request.put(path, this.build(opts));
  }

  patch(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.request.patch(path, this.build(opts));
  }

  delete(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.request.delete(path, this.build(opts));
  }

  private build({ token, data, params }: RequestOptions) {
    return {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      data,
      params,
      failOnStatusCode: false,
    };
  }
}

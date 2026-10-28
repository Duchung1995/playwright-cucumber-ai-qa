import type { APIRequestContext, APIResponse } from '@playwright/test';

export type RequestOptions = {
  token?: string;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
};

/** One HTTP exchange, kept so a failing scenario can show exactly what was sent and received. */
export type RecordedCall = {
  method: string;
  url: string;
  token?: string;
  requestBody?: unknown;
  status: number;
  responseBody: string;
};

/** Thin wrapper over Playwright's APIRequestContext that handles bearer auth and JSON bodies. */
export class ApiClient {
  readonly calls: RecordedCall[] = [];

  constructor(private readonly request: APIRequestContext) {}

  get(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('GET', path, opts);
  }

  post(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('POST', path, opts);
  }

  put(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('PUT', path, opts);
  }

  patch(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('PATCH', path, opts);
  }

  delete(path: string, opts: RequestOptions = {}): Promise<APIResponse> {
    return this.send('DELETE', path, opts);
  }

  private async send(
    method: string,
    path: string,
    { token, data, params }: RequestOptions,
  ): Promise<APIResponse> {
    const response = await this.request.fetch(path, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      data,
      params,
      failOnStatusCode: false,
    });
    this.calls.push({
      method,
      url: response.url(),
      token,
      requestBody: data,
      status: response.status(),
      responseBody: await response.text(),
    });
    return response;
  }
}

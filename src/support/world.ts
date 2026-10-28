import { setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber';
import type { APIRequestContext, APIResponse, Browser, BrowserContext, Page } from '@playwright/test';
import { AddressApi } from '../api/AddressApi';
import { ApiClient, type RecordedCall } from '../api/ApiClient';
import { AuthApi } from '../api/AuthApi';
import { BrandsApi } from '../api/BrandsApi';
import { ProductsApi } from '../api/ProductsApi';
import { UsersApi, type NewUser } from '../api/UsersApi';
import type { BrandPayload } from '../api/BrandsApi';
import type { Brand } from '../schemas';
import { credentialsFor } from '../config/env';
import { PageObjects } from '../pages';
import type { BrowserLog } from './failureContext';

/** Data shared between the steps of one scenario. Reset for every scenario. */
export type ScenarioState = {
  response?: APIResponse;
  responseBody?: unknown;
  token?: string;
  brandPayload?: BrandPayload;
  brand?: Brand;
  unitPrice?: number;
  customer?: NewUser & { id: string };
};

export class CustomWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  private _page?: Page;
  private _pages?: PageObjects;

  request!: APIRequestContext;
  api!: {
    /** Raw access for deliberately malformed requests; still recorded for failure reports. */
    client: ApiClient;
    auth: AuthApi;
    brands: BrandsApi;
    products: ProductsApi;
    users: UsersApi;
    address: AddressApi;
  };
  /** Filled by the @ui Before hook; shown in the failure context. */
  readonly browserLog: BrowserLog = { failedRequests: [], consoleErrors: [] };
  /** Set by the After hooks when the scenario failed. */
  failureHint?: string;
  readonly failureArtifacts: string[] = [];
  /** Number of API calls the scenario itself made; later calls are the After hook's cleanup. */
  callsBeforeCleanup?: number;

  state: ScenarioState = {};
  /** Brand ids created during the scenario; deleted in the After hook. */
  readonly createdBrandIds: string[] = [];
  /** User ids registered during the scenario; deleted in the After hook. */
  readonly createdUserIds: string[] = [];

  constructor(options: IWorldOptions) {
    super(options);
  }

  initApi(request: APIRequestContext): void {
    this.request = request;
    const client = new ApiClient(request);
    this.api = {
      client,
      auth: new AuthApi(client),
      brands: new BrandsApi(client),
      products: new ProductsApi(client),
      users: new UsersApi(client),
      address: new AddressApi(client),
    };
  }

  set page(page: Page) {
    this._page = page;
    this._pages = new PageObjects(page);
  }

  get page(): Page {
    if (!this._page) throw new Error('No browser page: tag the scenario or feature with @ui');
    return this._page;
  }

  get pages(): PageObjects {
    if (!this._pages) throw new Error('No browser page: tag the scenario or feature with @ui');
    return this._pages;
  }

  /** Stores an API response and its parsed body so generic assertion steps can inspect it. */
  async remember(response: APIResponse): Promise<APIResponse> {
    this.state.response = response;
    const text = await response.text();
    this.state.responseBody = text ? safeJson(text) : undefined;
    return response;
  }

  /**
   * Credentials for a role. "new customer" is the throwaway account registered in this scenario; use it for
   * anything that logs in as a customer. The shared demo customer is locked by the site after repeated failed
   * logins from anyone, so scenarios must not depend on it.
   */
  credentials(role: string): { email: string; password: string } {
    if (role === 'new customer') {
      if (!this.state.customer) throw new Error('Add "Given a new customer is registered via the API" first');
      return { email: this.state.customer.email, password: this.state.customer.password };
    }
    return credentialsFor(role);
  }

  get apiCalls(): RecordedCall[] {
    return this.api?.client.calls ?? [];
  }

  get lastResponse(): APIResponse {
    if (!this.state.response) throw new Error('No API response recorded in this scenario yet');
    return this.state.response;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

setWorldConstructor(CustomWorld);

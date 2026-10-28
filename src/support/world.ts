import { setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber';
import type { APIRequestContext, APIResponse, Browser, BrowserContext, Page } from '@playwright/test';
import { ApiClient } from '../api/ApiClient';
import { AuthApi } from '../api/AuthApi';
import { BrandsApi } from '../api/BrandsApi';
import { ProductsApi } from '../api/ProductsApi';
import { UsersApi, type NewUser } from '../api/UsersApi';
import type { BrandPayload } from '../api/BrandsApi';
import type { Brand } from '../schemas';
import { PageObjects } from '../pages';

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
  api!: { auth: AuthApi; brands: BrandsApi; products: ProductsApi; users: UsersApi };

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
      auth: new AuthApi(client),
      brands: new BrandsApi(client),
      products: new ProductsApi(client),
      users: new UsersApi(client),
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

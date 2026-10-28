import { ApiClient } from './ApiClient';
import { productPageSchema, type ProductPage } from '../schemas';

export type ProductQuery = {
  page?: number;
  sort?: string;
  categoryId?: string;
};

/** The storefront always sends its default price slider range, so the API query mirrors it. */
const UI_DEFAULT_PRICE_RANGE = 'price,1,100';

export class ProductsApi {
  constructor(private readonly client: ApiClient) {}

  async list({ page = 1, sort, categoryId }: ProductQuery = {}): Promise<ProductPage> {
    const params: Record<string, string | number | boolean> = {
      page,
      between: UI_DEFAULT_PRICE_RANGE,
      is_rental: false,
    };
    if (sort) params.sort = sort;
    if (categoryId) params.by_category = categoryId;

    const res = await this.client.get('/products', { params });
    if (res.status() !== 200) throw new Error(`GET /products failed with ${res.status()}`);
    return productPageSchema.parse(await res.json());
  }

  async categoryIdByName(name: string): Promise<string> {
    const res = await this.client.get('/categories/tree');
    type Node = { id: string; name: string; sub_categories?: Node[] };
    const flatten = (nodes: Node[]): Node[] => nodes.flatMap((n) => [n, ...flatten(n.sub_categories ?? [])]);
    const match = flatten((await res.json()) as Node[]).find((c) => c.name === name);
    if (!match) throw new Error(`Category "${name}" not found`);
    return match.id;
  }
}

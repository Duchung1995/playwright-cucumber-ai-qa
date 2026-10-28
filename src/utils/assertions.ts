import { expect, type APIResponse } from '@playwright/test';
import { schemas, type SchemaName } from '../schemas';

export async function expectSchema(res: APIResponse, name: SchemaName): Promise<void> {
  const body = await res.json();
  const result = schemas[name].safeParse(body);
  expect(
    result.success,
    `Response does not match "${name}" schema: ${result.error?.message}\n${JSON.stringify(body)}`,
  ).toBe(true);
}

export function parsePrice(text: string): number {
  return Number(text.replace(/[^0-9.]/g, ''));
}

export function expectNonDecreasing(values: number[]): void {
  const sorted = [...values].sort((a, b) => a - b);
  expect(values, 'values are not in ascending order').toEqual(sorted);
}

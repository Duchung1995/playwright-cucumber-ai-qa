/** Maps the storefront's sort dropdown labels to the API `sort` parameter. */
export const SORT_OPTIONS = {
  'Name (A - Z)': 'name,asc',
  'Name (Z - A)': 'name,desc',
  'Price (High - Low)': 'price,desc',
  'Price (Low - High)': 'price,asc',
} as const;

export type SortLabel = keyof typeof SORT_OPTIONS;

export function sortParamFor(label: string): string {
  const param = SORT_OPTIONS[label as SortLabel];
  if (!param) throw new Error(`Unsupported sort option "${label}"`);
  return param;
}

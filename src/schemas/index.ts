import { z } from 'zod';

export const loginTokenSchema = z.object({
  access_token: z.string().regex(/^[\w-]+\.[\w-]+\.[\w-]+$/, 'access_token must be a JWT'),
  token_type: z.literal('bearer'),
  expires_in: z.number().int().positive(),
});

export const errorSchema = z.union([z.object({ error: z.string() }), z.object({ message: z.string() })]);

export const userSchema = z.object({
  id: z.string().min(1),
  first_name: z.string(),
  last_name: z.string(),
  email: z.email(),
});

export const brandSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

export const updateResultSchema = z.strictObject({ success: z.literal(true) });

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  in_stock: z.boolean(),
  category: z.object({ id: z.string(), name: z.string() }).loose(),
  brand: z.object({ id: z.string(), name: z.string() }).loose(),
});

export const productPageSchema = z.object({
  current_page: z.number().int().positive(),
  last_page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  data: z.array(productSchema),
});

export type Brand = z.infer<typeof brandSchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductPage = z.infer<typeof productPageSchema>;

export const schemas = {
  'login token': loginTokenSchema,
  error: errorSchema,
  user: userSchema,
  brand: brandSchema,
  'update result': updateResultSchema,
  'product page': productPageSchema,
} as const;

export type SchemaName = keyof typeof schemas;

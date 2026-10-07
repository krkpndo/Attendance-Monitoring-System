import { z } from "zod";

/*
 * Pagination mirror of the backend's buildPaginationMeta shape. Paginated
 * endpoints return { items, pagination }, so `paginated(itemSchema)` builds the
 * matching envelope schema for any item type.
 */
export const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export function paginated<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    pagination: paginationMetaSchema,
  });
}

// Query params every paginated list accepts.
export type PageParams = { page?: number; limit?: number };

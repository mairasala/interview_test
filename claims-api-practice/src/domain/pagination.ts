import { z } from 'zod';
import { invalid } from './errors';

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const pageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  cursor: z.string().optional(),
});

export interface PageParams {
  limit: number;
  cursor?: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

interface SortKey {
  id: string;
  createdAt: string;
}

// Newest first; ties on createdAt are broken by id (descending) so the order is stable.
function newestFirst(a: SortKey, b: SortKey): number {
  if (a.createdAt === b.createdAt) {
    if (a.id === b.id) return 0;
    return a.id < b.id ? 1 : -1;
  }
  return a.createdAt < b.createdAt ? 1 : -1;
}

export function encodeCursor(item: SortKey): string {
  return Buffer.from(`${item.createdAt}|${item.id}`).toString('base64url');
}

export function decodeCursor(cursor: string): SortKey {
  const [createdAt, id] = Buffer.from(cursor, 'base64url').toString().split('|');
  if (!createdAt || !id) {
    throw invalid([{ path: 'cursor', message: 'Malformed cursor' }]);
  }
  return { createdAt, id };
}

export function paginateNewestFirst<T extends SortKey>(all: T[], params: PageParams): Page<T> {
  const sorted = [...all].sort(newestFirst);
  // Decode up front so a malformed cursor is rejected even when there is nothing to page.
  const after = params.cursor ? decodeCursor(params.cursor) : null;
  const remaining = after ? sorted.filter((item) => newestFirst(item, after) > 0) : sorted;
  const items = remaining.slice(0, params.limit);
  const hasMore = remaining.length > params.limit;
  const last = items[items.length - 1];
  return { items, nextCursor: hasMore && last ? encodeCursor(last) : null };
}

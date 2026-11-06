import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor, paginateNewestFirst } from '../src/domain/pagination';

const item = (id: string, createdAt: string) => ({ id, createdAt });

describe('paginateNewestFirst', () => {
  it('orders by createdAt descending', () => {
    const page = paginateNewestFirst(
      [item('a', '2026-01-01T00:00:00Z'), item('b', '2026-01-03T00:00:00Z'), item('c', '2026-01-02T00:00:00Z')],
      { limit: 10 },
    );

    expect(page.items.map((i) => i.id)).toEqual(['b', 'c', 'a']);
    expect(page.nextCursor).toBeNull();
  });

  it('breaks ties on id so the order is stable', () => {
    const same = '2026-01-01T00:00:00Z';
    const page = paginateNewestFirst([item('a', same), item('c', same), item('b', same)], { limit: 10 });

    expect(page.items.map((i) => i.id)).toEqual(['c', 'b', 'a']);
  });

  it('never repeats or skips items across pages, even with identical timestamps', () => {
    const same = '2026-01-01T00:00:00Z';
    const all = ['a', 'b', 'c', 'd', 'e'].map((id) => item(id, same));

    const seen: string[] = [];
    let cursor: string | undefined;
    do {
      const page = paginateNewestFirst(all, { limit: 2, cursor });
      seen.push(...page.items.map((i) => i.id));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);

    expect(seen).toEqual(['e', 'd', 'c', 'b', 'a']);
  });

  it('round-trips a cursor', () => {
    const original = item('clm_1', '2026-01-01T00:00:00Z');

    expect(decodeCursor(encodeCursor(original))).toEqual(original);
  });

  it('rejects a malformed cursor', () => {
    expect(() => decodeCursor('garbage')).toThrow();
  });
});

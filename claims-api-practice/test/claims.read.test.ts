import { describe, expect, it } from 'vitest';
import { as, createTestContext, MINUTE, validClaim } from './helpers';

describe('GET /claims', () => {
  it('lists only the caller’s claims, newest first', async () => {
    const { app, clock } = createTestContext();
    const alice = as(app, 'mem_alice');

    await alice.post('/claims', validClaim());
    clock.advance(MINUTE);
    await as(app, 'mem_bob').post('/claims', validClaim());
    clock.advance(MINUTE);
    await alice.post('/claims', validClaim({ category: 'pharmacy' }));

    const res = await alice.get('/claims');

    expect(res.status).toBe(200);
    expect(res.body.items.map((c: { id: string }) => c.id)).toEqual(['clm_0003', 'clm_0001']);
    expect(res.body.nextCursor).toBeNull();
  });

  it('paginates with a cursor', async () => {
    const { app, clock } = createTestContext();
    const alice = as(app, 'mem_alice');
    for (let i = 0; i < 3; i++) {
      await alice.post('/claims', validClaim());
      clock.advance(MINUTE);
    }

    const first = await alice.get('/claims?limit=2');
    expect(first.body.items).toHaveLength(2);
    expect(first.body.nextCursor).toEqual(expect.any(String));

    const second = await alice.get(`/claims?limit=2&cursor=${first.body.nextCursor}`);
    expect(second.body.items.map((c: { id: string }) => c.id)).toEqual(['clm_0001']);
    expect(second.body.nextCursor).toBeNull();
  });

  it('rejects a malformed cursor', async () => {
    const { app } = createTestContext();

    const res = await as(app, 'mem_alice').get('/claims?cursor=garbage');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('rejects an out-of-range limit', async () => {
    const { app } = createTestContext();

    const res = await as(app, 'mem_alice').get('/claims?limit=1000');

    expect(res.status).toBe(400);
  });

  it('is not available to reviewers', async () => {
    const { app } = createTestContext();

    const res = await as(app, 'rev_1', 'reviewer').get('/claims');

    expect(res.status).toBe(403);
  });
});

describe('GET /claims/:id', () => {
  it('returns the member’s own claim', async () => {
    const { app } = createTestContext();
    await as(app, 'mem_alice').post('/claims', validClaim());

    const res = await as(app, 'mem_alice').get('/claims/clm_0001');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('clm_0001');
  });

  it('answers 404 for another member’s claim', async () => {
    const { app } = createTestContext();
    await as(app, 'mem_alice').post('/claims', validClaim());

    const res = await as(app, 'mem_bob').get('/claims/clm_0001');

    expect(res.status).toBe(404);
  });

  it('lets a reviewer read any claim', async () => {
    const { app } = createTestContext();
    await as(app, 'mem_alice').post('/claims', validClaim());

    const res = await as(app, 'rev_1', 'reviewer').get('/claims/clm_0001');

    expect(res.status).toBe(200);
  });

  it('answers 404 for an unknown claim', async () => {
    const { app } = createTestContext();

    const res = await as(app, 'mem_alice').get('/claims/clm_9999');

    expect(res.status).toBe(404);
  });
});

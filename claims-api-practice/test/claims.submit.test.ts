import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { as, createTestContext, validClaim } from './helpers';

describe('POST /claims', () => {
  it('creates a submitted claim for the authenticated member', async () => {
    const { app } = createTestContext();

    const res = await as(app, 'mem_alice').post('/claims', validClaim());

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 'clm_0001',
      memberId: 'mem_alice',
      status: 'submitted',
      currency: 'EUR',
      amountCents: 4500,
    });
  });

  it('rejects an invalid amount with a validation error', async () => {
    const { app } = createTestContext();

    const res = await as(app, 'mem_alice').post('/claims', validClaim({ amountCents: -5 }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('rejects an unknown category', async () => {
    const { app } = createTestContext();

    const res = await as(app, 'mem_alice').post('/claims', validClaim({ category: 'spa' }));

    expect(res.status).toBe(400);
  });

  it('does not let reviewers submit claims', async () => {
    const { app } = createTestContext();

    const res = await as(app, 'rev_1', 'reviewer').post('/claims', validClaim());

    expect(res.status).toBe(403);
  });

  it('requires authentication', async () => {
    const { app } = createTestContext();

    const res = await request(app).post('/claims').send(validClaim());

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('records the submission in the audit log', async () => {
    const { app, deps } = createTestContext();

    await as(app, 'mem_alice').post('/claims', validClaim());

    expect(deps.auditLog.entries).toEqual([
      expect.objectContaining({
        event: 'claim.submitted',
        claimId: 'clm_0001',
        detail: 'submitted by mem_alice',
      }),
    ]);
  });
});

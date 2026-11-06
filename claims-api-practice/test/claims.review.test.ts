import type { Express } from 'express';
import { describe, expect, it } from 'vitest';
import { as, createTestContext, validClaim } from './helpers';

async function submitClaim(app: Express, memberId = 'mem_alice'): Promise<string> {
  const res = await as(app, memberId).post('/claims', validClaim());
  return res.body.id as string;
}

const reviewer = (app: Express) => as(app, 'rev_1', 'reviewer');

describe('POST /claims/:id/review', () => {
  it('approves a submitted claim', async () => {
    const { app } = createTestContext();
    const id = await submitClaim(app);

    const res = await reviewer(app).post(`/claims/${id}/review`, { decision: 'approve' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, status: 'approved', reviewerId: 'rev_1' });
  });

  it('rejects a claim with a reason', async () => {
    const { app } = createTestContext();
    const id = await submitClaim(app);

    const res = await reviewer(app).post(`/claims/${id}/review`, {
      decision: 'reject',
      reason: 'Not covered by the plan',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'rejected', rejectionReason: 'Not covered by the plan' });
  });

  it('requires a reason to reject', async () => {
    const { app } = createTestContext();
    const id = await submitClaim(app);

    const res = await reviewer(app).post(`/claims/${id}/review`, { decision: 'reject' });

    expect(res.status).toBe(400);
  });

  it('does not let members review claims', async () => {
    const { app } = createTestContext();
    const id = await submitClaim(app);

    const res = await as(app, 'mem_alice').post(`/claims/${id}/review`, { decision: 'approve' });

    expect(res.status).toBe(403);
  });

  it('cannot review the same claim twice', async () => {
    const { app } = createTestContext();
    const id = await submitClaim(app);
    await reviewer(app).post(`/claims/${id}/review`, { decision: 'approve' });

    const res = await reviewer(app).post(`/claims/${id}/review`, { decision: 'approve' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('conflict');
  });

  it('answers 404 for an unknown claim', async () => {
    const { app } = createTestContext();

    const res = await reviewer(app).post('/claims/clm_9999/review', { decision: 'approve' });

    expect(res.status).toBe(404);
  });

  it('records the status change in the audit log', async () => {
    const { app, deps } = createTestContext();
    const id = await submitClaim(app);

    await reviewer(app).post(`/claims/${id}/review`, { decision: 'approve' });

    expect(deps.auditLog.entries).toContainEqual(
      expect.objectContaining({
        event: 'claim.status_changed',
        claimId: id,
        detail: 'submitted → approved',
      }),
    );
  });
});

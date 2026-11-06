import { describe, expect, it } from 'vitest';
import { runPayouts } from '../src/jobs/payoutJob';
import { as, createTestContext, MINUTE, validClaim } from './helpers';

describe('runPayouts', () => {
  it('pays approved claims and leaves the others alone', async () => {
    const { app, deps, clock } = createTestContext();
    const alice = as(app, 'mem_alice');
    await alice.post('/claims', validClaim());
    await alice.post('/claims', validClaim({ category: 'dental' }));
    await as(app, 'rev_1', 'reviewer').post('/claims/clm_0001/review', { decision: 'approve' });

    clock.advance(MINUTE);
    const paid = await runPayouts(deps);

    expect(paid).toBe(1);
    const first = await alice.get('/claims/clm_0001');
    expect(first.body).toMatchObject({ status: 'paid', paidAt: '2026-01-15T10:01:00.000Z' });
    const second = await alice.get('/claims/clm_0002');
    expect(second.body.status).toBe('submitted');
  });

  it('does nothing when nothing is approved', async () => {
    const { deps } = createTestContext();

    expect(await runPayouts(deps)).toBe(0);
  });
});

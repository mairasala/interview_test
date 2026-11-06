import type { Deps } from './container';
import type { AuthUser } from './domain/user';

export const DEMO_USERS = {
  alice: { id: 'mem_alice', role: 'member' } satisfies AuthUser,
  bob: { id: 'mem_bob', role: 'member' } satisfies AuthUser,
  reviewer: { id: 'rev_1', role: 'reviewer' } satisfies AuthUser,
};

export async function seedDemoData({ claimService }: Pick<Deps, 'claimService'>): Promise<void> {
  const first = await claimService.submit(DEMO_USERS.alice, {
    category: 'consultation',
    amountCents: 6000,
    description: 'GP visit',
  });
  await claimService.submit(DEMO_USERS.alice, {
    category: 'pharmacy',
    amountCents: 1850,
    description: 'Prescription refill',
  });
  await claimService.submit(DEMO_USERS.bob, {
    category: 'dental',
    amountCents: 12000,
    description: 'Dental cleaning',
  });
  await claimService.review(DEMO_USERS.reviewer, first.id, { decision: 'approve' });
}

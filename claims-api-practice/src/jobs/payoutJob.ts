import type { Clock } from '../infra/clock';
import type { ClaimRepository } from '../repositories/claimRepository';

interface PayoutDeps {
  claims: ClaimRepository;
  clock: Clock;
}

/**
 * Pays out every approved claim and returns how many were paid.
 * Runs on a timer (see server.ts). Payment itself is out of scope for this exercise.
 */
export async function runPayouts({ claims, clock }: PayoutDeps): Promise<number> {
  const approved = await claims.listByStatus('approved');
  const now = clock.now().toISOString();

  // Batch path: writes straight to the repository instead of going through ClaimService.
  for (const claim of approved) {
    await claims.save({ ...claim, status: 'paid', paidAt: now, updatedAt: now });
  }

  return approved.length;
}

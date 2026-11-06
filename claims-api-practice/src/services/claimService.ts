import {
  assertTransition,
  type Claim,
  type ClaimStatus,
  type ReviewDecision,
  type SubmitClaimInput,
} from '../domain/claim';
import { forbidden, notFound } from '../domain/errors';
import type { EventBus } from '../domain/events';
import type { Page, PageParams } from '../domain/pagination';
import type { AuthUser } from '../domain/user';
import type { Clock } from '../infra/clock';
import type { IdGenerator } from '../infra/ids';
import type { ClaimRepository } from '../repositories/claimRepository';

export interface ClaimServiceDeps {
  claims: ClaimRepository;
  bus: EventBus;
  clock: Clock;
  ids: IdGenerator;
}

export class ClaimService {
  constructor(private readonly deps: ClaimServiceDeps) {}

  async submit(member: AuthUser, input: SubmitClaimInput): Promise<Claim> {
    if (member.role !== 'member') {
      throw forbidden('Only members can submit claims');
    }

    const now = this.deps.clock.now().toISOString();
    const claim: Claim = {
      id: this.deps.ids('clm'),
      memberId: member.id,
      category: input.category,
      amountCents: input.amountCents,
      currency: 'EUR',
      description: input.description,
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
    };

    await this.deps.claims.insert(claim);
    await this.deps.bus.emit('claim.submitted', {
      claimId: claim.id,
      memberId: claim.memberId,
      occurredAt: now,
    });
    return claim;
  }

  async get(user: AuthUser, claimId: string): Promise<Claim> {
    const claim = await this.deps.claims.findById(claimId);
    // Members never learn that someone else's claim exists: 404, not 403.
    if (!claim || (user.role === 'member' && claim.memberId !== user.id)) {
      throw notFound('Claim');
    }
    return claim;
  }

  async listForMember(member: AuthUser, page: PageParams): Promise<Page<Claim>> {
    if (member.role !== 'member') {
      throw forbidden('Only members have a claims list');
    }
    return this.deps.claims.listByMember(member.id, page);
  }

  async review(reviewer: AuthUser, claimId: string, decision: ReviewDecision): Promise<Claim> {
    if (reviewer.role !== 'reviewer') {
      throw forbidden('Only reviewers can review claims');
    }

    const claim = await this.deps.claims.findById(claimId);
    if (!claim) {
      throw notFound('Claim');
    }

    const to: ClaimStatus = decision.decision === 'approve' ? 'approved' : 'rejected';
    assertTransition(claim.status, to);

    const now = this.deps.clock.now().toISOString();
    const updated: Claim = {
      ...claim,
      status: to,
      reviewerId: reviewer.id,
      rejectionReason: decision.decision === 'reject' ? decision.reason : undefined,
      updatedAt: now,
    };

    await this.deps.claims.save(updated);
    await this.deps.bus.emit('claim.status_changed', {
      claimId: claim.id,
      memberId: claim.memberId,
      from: claim.status,
      to,
      occurredAt: now,
    });
    return updated;
  }
}

import { conflict } from './errors';

export const CLAIM_CATEGORIES = ['consultation', 'pharmacy', 'dental', 'optical', 'hospital'] as const;
export type ClaimCategory = (typeof CLAIM_CATEGORIES)[number];

export type ClaimStatus = 'submitted' | 'approved' | 'rejected' | 'paid';

export interface Claim {
  id: string;
  memberId: string;
  category: ClaimCategory;
  amountCents: number;
  currency: 'EUR';
  description: string;
  status: ClaimStatus;
  reviewerId?: string;
  rejectionReason?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitClaimInput {
  category: ClaimCategory;
  amountCents: number;
  description: string;
}

export type ReviewDecision = { decision: 'approve' } | { decision: 'reject'; reason: string };

const ALLOWED_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  submitted: ['approved', 'rejected'],
  approved: ['paid'],
  rejected: [],
  paid: [],
};

export function canTransition(from: ClaimStatus, to: ClaimStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: ClaimStatus, to: ClaimStatus): void {
  if (!canTransition(from, to)) {
    throw conflict(`Claim cannot go from ${from} to ${to}`);
  }
}

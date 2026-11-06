import type { Claim, ClaimStatus } from '../domain/claim';
import { paginateNewestFirst, type Page, type PageParams } from '../domain/pagination';

export interface ClaimRepository {
  insert(claim: Claim): Promise<void>;
  save(claim: Claim): Promise<void>;
  findById(id: string): Promise<Claim | null>;
  listByMember(memberId: string, params: PageParams): Promise<Page<Claim>>;
  listByStatus(status: ClaimStatus): Promise<Claim[]>;
}

export class InMemoryClaimRepository implements ClaimRepository {
  private rows = new Map<string, Claim>();

  async insert(claim: Claim): Promise<void> {
    if (this.rows.has(claim.id)) {
      throw new Error(`Claim ${claim.id} already exists`);
    }
    this.rows.set(claim.id, structuredClone(claim));
  }

  async save(claim: Claim): Promise<void> {
    if (!this.rows.has(claim.id)) {
      throw new Error(`Claim ${claim.id} does not exist`);
    }
    this.rows.set(claim.id, structuredClone(claim));
  }

  async findById(id: string): Promise<Claim | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async listByMember(memberId: string, params: PageParams): Promise<Page<Claim>> {
    const mine = [...this.rows.values()].filter((claim) => claim.memberId === memberId);
    const page = paginateNewestFirst(mine, params);
    return { ...page, items: page.items.map((claim) => structuredClone(claim)) };
  }

  async listByStatus(status: ClaimStatus): Promise<Claim[]> {
    return [...this.rows.values()]
      .filter((claim) => claim.status === status)
      .map((claim) => structuredClone(claim));
  }
}

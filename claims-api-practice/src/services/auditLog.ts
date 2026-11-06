import type { EventBus } from '../domain/events';

export interface AuditEntry {
  at: string;
  event: string;
  claimId: string;
  detail: string;
}

/** Keeps a trail of what happened to claims. Fed by domain events, never called directly. */
export class AuditLog {
  private readonly _entries: AuditEntry[] = [];

  get entries(): AuditEntry[] {
    return [...this._entries];
  }

  attach(bus: EventBus): void {
    bus.on('claim.submitted', (event) => {
      this._entries.push({
        at: event.occurredAt,
        event: 'claim.submitted',
        claimId: event.claimId,
        detail: `submitted by ${event.memberId}`,
      });
    });

    bus.on('claim.status_changed', (event) => {
      this._entries.push({
        at: event.occurredAt,
        event: 'claim.status_changed',
        claimId: event.claimId,
        detail: `${event.from} → ${event.to}`,
      });
    });
  }
}

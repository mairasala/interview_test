import type { ClaimStatus } from './claim';

export interface DomainEventMap {
  'claim.submitted': {
    claimId: string;
    memberId: string;
    occurredAt: string;
  };
  'claim.status_changed': {
    claimId: string;
    memberId: string;
    from: ClaimStatus;
    to: ClaimStatus;
    occurredAt: string;
  };
}

export type DomainEventName = keyof DomainEventMap;

type Handler<K extends DomainEventName> = (payload: DomainEventMap[K]) => void | Promise<void>;

/**
 * Tiny in-process event bus. Services emit domain events after they persist a change;
 * subscribers (see src/subscribers) react to them. A failing handler is logged and does
 * not break the request that emitted the event.
 */
export class EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers = new Map<DomainEventName, Array<Handler<any>>>();

  on<K extends DomainEventName>(event: K, handler: Handler<K>): void {
    const existing = this.handlers.get(event) ?? [];
    existing.push(handler);
    this.handlers.set(event, existing);
  }

  async emit<K extends DomainEventName>(event: K, payload: DomainEventMap[K]): Promise<void> {
    for (const handler of this.handlers.get(event) ?? []) {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`[event-bus] handler for ${event} failed`, error);
      }
    }
  }
}

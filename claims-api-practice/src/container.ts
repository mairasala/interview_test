import { EventBus } from './domain/events';
import { systemClock, type Clock } from './infra/clock';
import { uuidGenerator, type IdGenerator } from './infra/ids';
import { InMemoryClaimRepository, type ClaimRepository } from './repositories/claimRepository';
import { AuditLog } from './services/auditLog';
import { ClaimService } from './services/claimService';
import { registerSubscribers } from './subscribers';

export interface Deps {
  clock: Clock;
  ids: IdGenerator;
  bus: EventBus;
  claims: ClaimRepository;
  claimService: ClaimService;
  auditLog: AuditLog;
}

/** Composition root. Tests override the clock and id generator to stay deterministic. */
export function buildDeps(overrides: { clock?: Clock; ids?: IdGenerator } = {}): Deps {
  const clock = overrides.clock ?? systemClock;
  const ids = overrides.ids ?? uuidGenerator;

  const bus = new EventBus();
  const claims = new InMemoryClaimRepository();
  const claimService = new ClaimService({ claims, bus, clock, ids });
  const auditLog = new AuditLog();

  const deps: Deps = { clock, ids, bus, claims, claimService, auditLog };
  registerSubscribers(deps);
  return deps;
}

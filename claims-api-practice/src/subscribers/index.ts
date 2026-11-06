import type { Deps } from '../container';

/** Single place where event subscribers are wired to the bus. */
export function registerSubscribers({ bus, auditLog }: Pick<Deps, 'bus' | 'auditLog'>): void {
  auditLog.attach(bus);
}

import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../src/domain/events';

const payload = {
  claimId: 'clm_1',
  memberId: 'mem_alice',
  from: 'submitted' as const,
  to: 'approved' as const,
  occurredAt: '2026-01-15T10:00:00.000Z',
};

describe('EventBus', () => {
  it('calls every handler for an event, in registration order', async () => {
    const bus = new EventBus();
    const calls: string[] = [];
    bus.on('claim.status_changed', () => void calls.push('first'));
    bus.on('claim.status_changed', async () => void calls.push('second'));

    await bus.emit('claim.status_changed', payload);

    expect(calls).toEqual(['first', 'second']);
  });

  it('keeps going when a handler throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const bus = new EventBus();
    const later = vi.fn();
    bus.on('claim.status_changed', () => {
      throw new Error('boom');
    });
    bus.on('claim.status_changed', later);

    await expect(bus.emit('claim.status_changed', payload)).resolves.toBeUndefined();

    expect(later).toHaveBeenCalledOnce();
  });

  it('ignores events nobody listens to', async () => {
    const bus = new EventBus();

    await expect(
      bus.emit('claim.submitted', { claimId: 'x', memberId: 'y', occurredAt: payload.occurredAt }),
    ).resolves.toBeUndefined();
  });
});

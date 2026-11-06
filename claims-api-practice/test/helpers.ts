import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app';
import { buildDeps, type Deps } from '../src/container';
import type { Role } from '../src/domain/user';
import type { Clock } from '../src/infra/clock';

export const MINUTE = 60_000;

export class FakeClock implements Clock {
  private current: Date;

  constructor(start = '2026-01-15T10:00:00.000Z') {
    this.current = new Date(start);
  }

  now(): Date {
    return new Date(this.current);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

/** Ids like clm_0001, clm_0002 ... so assertions can name them. */
export function sequentialIds() {
  let n = 0;
  return (prefix: string) => `${prefix}_${String(++n).padStart(4, '0')}`;
}

export interface TestContext {
  app: Express;
  deps: Deps;
  clock: FakeClock;
}

export function createTestContext(): TestContext {
  const clock = new FakeClock();
  const deps = buildDeps({ clock, ids: sequentialIds() });
  return { app: createApp(deps), deps, clock };
}

/** Supertest wrapper that sends the identity headers for one user. */
export function as(app: Express, userId: string, role: Role = 'member') {
  const headers = { 'x-user-id': userId, 'x-user-role': role };
  return {
    get: (url: string) => request(app).get(url).set(headers),
    post: (url: string, body?: object) => request(app).post(url).set(headers).send(body),
  };
}

export function validClaim(overrides: Record<string, unknown> = {}) {
  return { category: 'consultation', amountCents: 4500, description: 'GP visit', ...overrides };
}

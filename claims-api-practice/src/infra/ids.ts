import { randomUUID } from 'node:crypto';

export type IdGenerator = (prefix: string) => string;

export const uuidGenerator: IdGenerator = (prefix) => `${prefix}_${randomUUID()}`;

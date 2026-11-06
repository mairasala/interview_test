import type { Request, RequestHandler } from 'express';
import { unauthorized } from '../domain/errors';
import type { AuthUser } from '../domain/user';

/**
 * Stand-in for real authentication: identity comes from headers.
 *   x-user-id:   required
 *   x-user-role: "member" (default) or "reviewer"
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const id = req.header('x-user-id');
  const role = req.header('x-user-role') ?? 'member';

  if (!id) {
    next(unauthorized());
    return;
  }
  if (role !== 'member' && role !== 'reviewer') {
    next(unauthorized('Unknown role'));
    return;
  }

  req.user = { id, role };
  next();
};

export function requireUser(req: Request): AuthUser {
  if (!req.user) {
    throw unauthorized();
  }
  return req.user;
}

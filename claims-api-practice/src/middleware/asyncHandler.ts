import type { Request, RequestHandler, Response } from 'express';

/** Express 4 does not catch rejected promises, so every async route goes through this. */
export const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

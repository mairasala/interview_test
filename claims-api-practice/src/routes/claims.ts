import { Router } from 'express';
import { z } from 'zod';
import { CLAIM_CATEGORIES } from '../domain/claim';
import { pageQuerySchema } from '../domain/pagination';
import type { Deps } from '../container';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireUser } from '../middleware/auth';
import { parse } from '../middleware/validate';

const submitSchema = z.object({
  category: z.enum(CLAIM_CATEGORIES),
  amountCents: z.number().int().positive().max(500_000), // 5,000 EUR
  description: z.string().trim().min(1).max(500),
});

const reviewSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('approve') }),
  z.object({ decision: z.literal('reject'), reason: z.string().trim().min(1).max(500) }),
]);

export function claimsRouter({ claimService }: Pick<Deps, 'claimService'>): Router {
  const router = Router();

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const user = requireUser(req);
      const input = parse(submitSchema, req.body);
      const claim = await claimService.submit(user, input);
      res.status(201).json(claim);
    }),
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const user = requireUser(req);
      const page = parse(pageQuerySchema, req.query);
      res.json(await claimService.listForMember(user, page));
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const user = requireUser(req);
      res.json(await claimService.get(user, req.params.id as string));
    }),
  );

  router.post(
    '/:id/review',
    asyncHandler(async (req, res) => {
      const user = requireUser(req);
      const decision = parse(reviewSchema, req.body);
      res.json(await claimService.review(user, req.params.id as string, decision));
    }),
  );

  return router;
}

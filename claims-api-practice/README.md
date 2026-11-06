# claims-api-practice

A small health-insurance claims API: members submit reimbursement claims, reviewers
approve or reject them, and a job pays out approved claims.

Practice repo for a live-coding session. The task is in [TASK.md](./TASK.md).

## Run it

```bash
npm install
npm test            # vitest
npm run typecheck   # tsc --noEmit
npm run dev         # http://localhost:3000, seeded with demo data
```

## Identity

There is no real auth; identity comes from headers.

| Header        | Meaning                              |
| ------------- | ------------------------------------ |
| `x-user-id`   | required, e.g. `mem_alice`, `rev_1`  |
| `x-user-role` | `member` (default) or `reviewer`     |

```bash
# a member's claims
curl -H 'x-user-id: mem_alice' localhost:3000/claims

# submit a claim
curl -X POST localhost:3000/claims -H 'x-user-id: mem_alice' -H 'content-type: application/json' \
  -d '{"category":"pharmacy","amountCents":1850,"description":"Refill"}'

# a reviewer approves it
curl -X POST localhost:3000/claims/<id>/review -H 'x-user-id: rev_1' -H 'x-user-role: reviewer' \
  -H 'content-type: application/json' -d '{"decision":"approve"}'
```

## Endpoints

| Method | Path                 | Who      | Notes                                       |
| ------ | -------------------- | -------- | ------------------------------------------- |
| GET    | `/health`            | anyone   |                                             |
| POST   | `/claims`            | member   | creates a claim in `submitted`              |
| GET    | `/claims`            | member   | own claims, newest first, cursor pagination |
| GET    | `/claims/:id`        | both     | members only see their own                  |
| POST   | `/claims/:id/review` | reviewer | `approve`, or `reject` with a `reason`      |

Claim lifecycle: `submitted → approved | rejected`, then `approved → paid`.

## Layout

```
src/
  app.ts            express app (routes + error handling)
  container.ts      composition root: builds every dependency
  server.ts         entry point, seeds demo data, schedules the payout job
  domain/           types, errors, pagination, event bus
  routes/           HTTP layer: validation + calling a service
  services/         business rules
  repositories/     storage (in-memory here, behind an interface)
  subscribers/      reactions to domain events
  jobs/             background work
  middleware/       auth, validation, error handling
test/               vitest + supertest; see test/helpers.ts
```

## Conventions

- Layers: routes → services → repositories. Routes validate with zod (`parse`) and delegate.
- Errors are `AppError`s; the error middleware renders `{ error: { code, message, details? } }`.
- Another member's resource is a 404, never a 403.
- Lists use cursor pagination (`limit`, `cursor`) returning `{ items, nextCursor }`.
- Time and ids are injected (`Clock`, `IdGenerator`), so tests are deterministic.
- Services emit domain events after persisting; subscribers are registered in `src/subscribers`.
- Tests build the app with `createTestContext()` and call it with `as(app, userId, role)`.

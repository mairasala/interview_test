import { createApp } from './app';
import { buildDeps } from './container';
import { runPayouts } from './jobs/payoutJob';
import { seedDemoData } from './seed';

const deps = buildDeps();
await seedDemoData(deps);

const port = Number(process.env.PORT ?? 3000);
createApp(deps).listen(port, () => {
  console.log(`claims-api listening on http://localhost:${port}`);
  console.log('demo identities: x-user-id: mem_alice | mem_bob, x-user-id: rev_1 + x-user-role: reviewer');
});

setInterval(() => {
  runPayouts(deps).catch((error) => console.error('[payouts] failed', error));
}, 60_000).unref();

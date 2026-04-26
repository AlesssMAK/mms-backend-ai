import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import request from 'supertest';

import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
} from '../helpers/db.js';
import { buildTestApp } from '../helpers/app.js';
import { createUser } from '../helpers/factories.js';
import { loginAs } from '../helpers/auth.js';
import { logEvent, ensureTtlIndex } from '../../src/services/auditLog.js';
import { ensureSingleton as ensureSystemSettings } from '../../src/services/systemSettings.js';

let app;

beforeAll(async () => {
  await startInMemoryMongo();
  app = buildTestApp();
});
afterAll(stopInMemoryMongo);
beforeEach(async () => {
  await clearDatabase();
  await ensureSystemSettings();
});

describe('GET /admin/audit-log', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/admin/audit-log');
    expect(res.status).toBe(401);
  });

  it('forbids non-admin', async () => {
    const safety = await createUser({ role: 'safety' });
    const agent = await loginAs(app, safety);
    const res = await agent.get('/admin/audit-log');
    expect(res.status).toBe(403);
  });

  it('returns paginated entries to admin and supports filters', async () => {
    const admin = await createUser({ role: 'admin' });
    const operator = await createUser({ role: 'operator' });

    // Seed three events of different actions/actors
    await logEvent({
      actorId: admin._id,
      actorRole: 'admin',
      action: 'fault.create',
      targetType: 'Fault',
      targetId: admin._id, // any ObjectId
      summary: 'created fault X',
    });
    await logEvent({
      actorId: operator._id,
      actorRole: 'operator',
      action: 'auth.login',
      summary: 'login op',
    });
    await logEvent({
      actorId: null,
      actorRole: 'system',
      action: 'fault.auto_overdue',
      summary: 'cron tagged fault',
    });

    const agent = await loginAs(app, admin);
    const all = await agent.get('/admin/audit-log');
    expect(all.status).toBe(200);
    expect(all.body.total).toBe(3);
    expect(all.body.items).toHaveLength(3);

    const filtered = await agent.get(
      '/admin/audit-log?actorRole=system',
    );
    expect(filtered.status).toBe(200);
    expect(filtered.body.total).toBe(1);
    expect(filtered.body.items[0].action).toBe('fault.auto_overdue');

    const byAction = await agent.get('/admin/audit-log?action=auth.login');
    expect(byAction.body.total).toBe(1);
  });
});

describe('ensureTtlIndex (service)', () => {
  it('creates the TTL index on a fresh DB without throwing', async () => {
    await ensureTtlIndex();
    // Re-running is a no-op (or replaces with same expiry) — both fine
    await expect(ensureTtlIndex()).resolves.not.toThrow();
  });
});

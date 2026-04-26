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

describe('GET /system-settings', () => {
  it('returns the public view to any authenticated user', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00001' });
    const agent = await loginAs(app, op);

    const res = await agent.get('/system-settings');
    expect(res.status).toBe(200);
    expect(res.body.timezone).toBe('Europe/Rome');
    expect(res.body.workHours).toBeDefined();
    expect(res.body.workDays).toBeDefined();
    // Sensitive fields stripped from public view
    expect(res.body.email).toBeUndefined();
    expect(res.body.retention).toBeUndefined();
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/system-settings');
    expect(res.status).toBe(401);
  });
});

describe('GET /system-settings/full (admin)', () => {
  it('returns full settings to admin', async () => {
    const admin = await createUser({ role: 'admin' });
    const agent = await loginAs(app, admin);

    const res = await agent.get('/system-settings/full');
    expect(res.status).toBe(200);
    expect(res.body.email).toBeDefined();
    expect(res.body.retention).toBeDefined();
  });

  it('forbids non-admins (403)', async () => {
    const manager = await createUser({ role: 'manager' });
    const agent = await loginAs(app, manager);
    const res = await agent.get('/system-settings/full');
    expect(res.status).toBe(403);
  });
});

describe('PATCH /system-settings (admin)', () => {
  it('updates timezone', async () => {
    const admin = await createUser({ role: 'admin' });
    const agent = await loginAs(app, admin);

    const res = await agent
      .patch('/system-settings')
      .send({ timezone: 'Europe/Kyiv' });
    expect(res.status).toBe(200);
    expect(res.body.timezone).toBe('Europe/Kyiv');
  });

  it('forbids non-admin', async () => {
    const safety = await createUser({ role: 'safety' });
    const agent = await loginAs(app, safety);
    const res = await agent
      .patch('/system-settings')
      .send({ timezone: 'Europe/Rome' });
    expect(res.status).toBe(403);
  });

  it('rejects empty body via celebrate', async () => {
    const admin = await createUser({ role: 'admin' });
    const agent = await loginAs(app, admin);
    const res = await agent.patch('/system-settings').send({});
    expect(res.status).toBe(400);
  });
});

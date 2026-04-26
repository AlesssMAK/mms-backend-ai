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
import { createUser, TEST_PASSWORD_PLAIN } from '../helpers/factories.js';
import { Session } from '../../src/models/session.js';

let app;

beforeAll(async () => {
  await startInMemoryMongo();
  app = buildTestApp();
});
afterAll(stopInMemoryMongo);
beforeEach(clearDatabase);

describe('POST /auth/login', () => {
  it('logs in staff with email + password and sets cookies', async () => {
    const manager = await createUser({
      role: 'manager',
      email: 'm@test.local',
    });

    const res = await request(app).post('/auth/login').send({
      email: 'm@test.local',
      password: TEST_PASSWORD_PLAIN,
    });

    expect(res.status).toBe(200);
    expect(res.body.user._id).toBe(String(manager._id));
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers['set-cookie']?.join(';')).toMatch(/sessionId=/);
    expect(res.headers['set-cookie']?.join(';')).toMatch(/refreshToken=/);
  });

  it('logs in operator with fullName + personalCode (no password field)', async () => {
    const op = await createUser({
      role: 'operator',
      fullName: 'Olivia Operatore',
      personalCode: 'OP12345',
    });

    const res = await request(app).post('/auth/login').send({
      fullName: 'Olivia Operatore',
      personalCode: 'OP12345',
    });

    expect(res.status).toBe(200);
    expect(res.body.user._id).toBe(String(op._id));
  });

  it('accepts custom-TLD emails like *.local (drive-by fix from A8)', async () => {
    await createUser({ role: 'admin', email: 'admin@company.local' });
    const res = await request(app).post('/auth/login').send({
      email: 'admin@company.local',
      password: TEST_PASSWORD_PLAIN,
    });
    expect(res.status).toBe(200);
  });

  it('rejects bad password with 401', async () => {
    await createUser({ role: 'manager', email: 'm@test.local' });
    const res = await request(app).post('/auth/login').send({
      email: 'm@test.local',
      password: 'wrong-password',
    });
    expect(res.status).toBe(401);
  });

  it('rejects unknown operator with 401', async () => {
    const res = await request(app).post('/auth/login').send({
      fullName: 'Ghost User',
      personalCode: 'OP99999',
    });
    expect(res.status).toBe(401);
  });

  it('rejects malformed payload with 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ what: 'ever' });
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/logout', () => {
  it('deletes the session', async () => {
    const user = await createUser({
      role: 'admin',
      email: 'a@test.local',
    });
    const agent = request.agent(app);
    await agent
      .post('/auth/login')
      .send({ email: 'a@test.local', password: TEST_PASSWORD_PLAIN });

    expect(await Session.countDocuments({ userId: user._id })).toBe(1);

    const res = await agent.post('/auth/logout');
    expect([200, 204]).toContain(res.status);
    expect(await Session.countDocuments({ userId: user._id })).toBe(0);
  });
});

describe('POST /auth/register', () => {
  it('requires authentication (401 without session)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        role: 'manager',
        fullName: 'Mario Rossi',
        email: 'mario@test.local',
        password: 'Password123',
      });
    expect(res.status).toBe(401);
  });

  it('requires admin role (403 for non-admin)', async () => {
    await createUser({ role: 'manager', email: 'm@test.local' });
    const agent = request.agent(app);
    await agent
      .post('/auth/login')
      .send({ email: 'm@test.local', password: TEST_PASSWORD_PLAIN });

    const res = await agent.post('/auth/register').send({
      role: 'safety',
      fullName: 'Sara Sicurezza',
      email: 'sara@test.local',
      password: 'Password123',
    });
    expect(res.status).toBe(403);
  });

  it('creates a new staff user when called by admin', async () => {
    await createUser({ role: 'admin', email: 'admin@test.local' });
    const agent = request.agent(app);
    await agent
      .post('/auth/login')
      .send({ email: 'admin@test.local', password: TEST_PASSWORD_PLAIN });

    const res = await agent.post('/auth/register').send({
      role: 'safety',
      fullName: 'Sara Sicurezza',
      email: 'sara@test.local',
      password: 'Password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('sara@test.local');
    expect(res.body.password).toBeUndefined();
  });
});

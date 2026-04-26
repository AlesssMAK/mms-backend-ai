import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
} from '../helpers/db.js';
import { buildTestApp } from '../helpers/app.js';
import { createUser, createMessage } from '../helpers/factories.js';
import { loginAs } from '../helpers/auth.js';
import { ensureSingleton as ensureSystemSettings } from '../../src/services/systemSettings.js';
import { ensureMessageTtlIndex } from '../../src/services/message.js';
import { Message } from '../../src/models/message.js';
import { MESSAGE_TYPE } from '../../src/constants/message.js';

let app;

beforeAll(async () => {
  await startInMemoryMongo();
  app = buildTestApp();
  await ensureMessageTtlIndex();
});
afterAll(stopInMemoryMongo);
beforeEach(async () => {
  await clearDatabase();
  await ensureSystemSettings();
});

describe('POST /messages/direct', () => {
  it('creates a direct message and triggers email/socket fan-out', async () => {
    const manager = await createUser({ role: 'manager' });
    const worker = await createUser({ role: 'maintenanceWorker' });
    const agent = await loginAs(app, manager);

    const res = await agent.post('/messages/direct').send({
      recipientId: String(worker._id),
      subject: 'Hello',
      body: 'Body of the message',
    });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe('direct');
    expect(res.body.recipientId).toBe(String(worker._id));
    expect(res.body.expireAt).toBeNull();

    // persisted
    expect(await Message.countDocuments({ type: 'direct' })).toBe(1);
  });

  it('forbids operators (403)', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00009' });
    const worker = await createUser({ role: 'maintenanceWorker' });
    const agent = await loginAs(app, op);

    const res = await agent.post('/messages/direct').send({
      recipientId: String(worker._id),
      body: 'Should fail',
    });
    expect(res.status).toBe(403);
  });

  it('rejects sending to yourself (400)', async () => {
    const manager = await createUser({ role: 'manager' });
    const agent = await loginAs(app, manager);
    const res = await agent.post('/messages/direct').send({
      recipientId: String(manager._id),
      body: 'self',
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown recipient', async () => {
    const manager = await createUser({ role: 'manager' });
    const agent = await loginAs(app, manager);
    const res = await agent.post('/messages/direct').send({
      recipientId: '000000000000000000000000',
      body: 'no such user',
    });
    expect(res.status).toBe(404);
  });

  it('rejects invalid payload (400)', async () => {
    const manager = await createUser({ role: 'manager' });
    const agent = await loginAs(app, manager);
    const res = await agent
      .post('/messages/direct')
      .send({ recipientId: 'not-an-id', body: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('POST /messages/broadcast', () => {
  it('creates broadcast_all with expireAt set from settings TTL', async () => {
    const admin = await createUser({ role: 'admin' });
    const agent = await loginAs(app, admin);

    const before = Date.now();
    const res = await agent.post('/messages/broadcast').send({
      target: 'all',
      subject: 'Welcome',
      body: 'Hello team',
    });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('broadcast_all');

    const expireMs = new Date(res.body.expireAt).getTime();
    const days = (expireMs - before) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(29.99);
    expect(days).toBeLessThan(30.01);
  });

  it('creates broadcast_role with targetRole', async () => {
    const admin = await createUser({ role: 'admin' });
    const agent = await loginAs(app, admin);

    const res = await agent.post('/messages/broadcast').send({
      target: 'role',
      targetRole: 'safety',
      body: 'Avviso sicurezza',
    });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('broadcast_role');
    expect(res.body.targetRole).toBe('safety');
  });

  it('rejects role broadcast without targetRole (400)', async () => {
    const admin = await createUser({ role: 'admin' });
    const agent = await loginAs(app, admin);
    const res = await agent.post('/messages/broadcast').send({
      target: 'role',
      body: 'oops',
    });
    expect(res.status).toBe(400);
  });

  it('allows operators to send broadcasts', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00010' });
    const agent = await loginAs(app, op);
    const res = await agent.post('/messages/broadcast').send({
      target: 'all',
      body: 'Operator announcement',
    });
    expect(res.status).toBe(201);
  });
});

describe('GET /messages/inbox', () => {
  it('returns received direct messages by default and supports box=sent', async () => {
    const manager = await createUser({ role: 'manager' });
    const worker = await createUser({ role: 'maintenanceWorker' });

    await createMessage({ author: manager, recipient: worker, body: 'm→w 1' });
    await createMessage({ author: worker, recipient: manager, body: 'w→m 1' });

    const wAgent = await loginAs(app, worker);
    const inbox = await wAgent.get('/messages/inbox');
    expect(inbox.body.total).toBe(1);
    expect(inbox.body.items[0].body).toBe('m→w 1');

    const sent = await wAgent.get('/messages/inbox?box=sent');
    expect(sent.body.total).toBe(1);
    expect(sent.body.items[0].body).toBe('w→m 1');

    const all = await wAgent.get('/messages/inbox?box=all');
    expect(all.body.total).toBe(2);
  });

  it('forbids operators (403)', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00011' });
    const agent = await loginAs(app, op);
    const res = await agent.get('/messages/inbox');
    expect(res.status).toBe(403);
  });
});

describe('GET /messages/announcements', () => {
  it('shows broadcast_all to everyone and broadcast_role only to that role', async () => {
    const admin = await createUser({ role: 'admin' });
    await createMessage({
      author: admin,
      type: MESSAGE_TYPE.BROADCAST_ALL,
      subject: 'Tutti',
      expireAt: new Date(Date.now() + 30 * 86400_000),
    });
    await createMessage({
      author: admin,
      type: MESSAGE_TYPE.BROADCAST_ROLE,
      targetRole: 'safety',
      subject: 'Safety only',
      expireAt: new Date(Date.now() + 30 * 86400_000),
    });

    const op = await createUser({ role: 'operator', personalCode: 'OP00012' });
    const opAgent = await loginAs(app, op);
    const opRes = await opAgent.get('/messages/announcements');
    expect(opRes.body.total).toBe(1); // only broadcast_all

    const safety = await createUser({ role: 'safety' });
    const sAgent = await loginAs(app, safety);
    const sRes = await sAgent.get('/messages/announcements');
    expect(sRes.body.total).toBe(2); // broadcast_all + role:safety
  });
});

describe('GET /messages/unread-count', () => {
  it('counts direct + announcements correctly', async () => {
    const admin = await createUser({ role: 'admin' });
    const manager = await createUser({ role: 'manager' });
    const worker = await createUser({ role: 'maintenanceWorker' });

    await createMessage({ author: manager, recipient: worker, body: 'd1' });
    await createMessage({ author: manager, recipient: worker, body: 'd2' });
    await createMessage({
      author: admin,
      type: MESSAGE_TYPE.BROADCAST_ALL,
      expireAt: new Date(Date.now() + 86400_000),
    });

    const agent = await loginAs(app, worker);
    const res = await agent.get('/messages/unread-count');
    expect(res.body).toEqual({ direct: 2, announcements: 1 });
  });

  it('returns direct=0 for operators (no inbox)', async () => {
    const admin = await createUser({ role: 'admin' });
    await createMessage({
      author: admin,
      type: MESSAGE_TYPE.BROADCAST_ALL,
      expireAt: new Date(Date.now() + 86400_000),
    });
    const op = await createUser({ role: 'operator', personalCode: 'OP00013' });
    const agent = await loginAs(app, op);
    const res = await agent.get('/messages/unread-count');
    expect(res.body.direct).toBe(0);
    expect(res.body.announcements).toBe(1);
  });
});

describe('PATCH /messages/:id/read', () => {
  it('lets the recipient mark a direct message as read (idempotent)', async () => {
    const manager = await createUser({ role: 'manager' });
    const worker = await createUser({ role: 'maintenanceWorker' });
    const msg = await createMessage({
      author: manager,
      recipient: worker,
      body: 'unread',
    });
    const agent = await loginAs(app, worker);

    const res1 = await agent.patch(`/messages/${msg._id}/read`);
    expect(res1.status).toBe(200);
    expect(res1.body.readBy).toContain(String(worker._id));

    // Idempotent — no duplicate entry
    const res2 = await agent.patch(`/messages/${msg._id}/read`);
    expect(res2.body.readBy.filter((id) => id === String(worker._id)).length)
      .toBe(1);
  });

  it('forbids reading someone else\'s direct message', async () => {
    const manager = await createUser({ role: 'manager' });
    const worker = await createUser({ role: 'maintenanceWorker' });
    const safety = await createUser({ role: 'safety' });
    const msg = await createMessage({
      author: manager,
      recipient: worker,
      body: 'private',
    });
    const agent = await loginAs(app, safety);
    const res = await agent.patch(`/messages/${msg._id}/read`);
    expect(res.status).toBe(403);
  });

  it('forbids marking a role-broadcast not addressed to your role', async () => {
    const admin = await createUser({ role: 'admin' });
    const op = await createUser({ role: 'operator', personalCode: 'OP00014' });
    const msg = await createMessage({
      author: admin,
      type: MESSAGE_TYPE.BROADCAST_ROLE,
      targetRole: 'safety',
      expireAt: new Date(Date.now() + 86400_000),
    });
    const agent = await loginAs(app, op);
    const res = await agent.patch(`/messages/${msg._id}/read`);
    expect(res.status).toBe(403);
  });

  it('returns 404 for unknown id', async () => {
    const manager = await createUser({ role: 'manager' });
    const agent = await loginAs(app, manager);
    const res = await agent.patch('/messages/000000000000000000000000/read');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /messages/:id', () => {
  it('lets the author delete their own message', async () => {
    const manager = await createUser({ role: 'manager' });
    const worker = await createUser({ role: 'maintenanceWorker' });
    const msg = await createMessage({
      author: manager,
      recipient: worker,
      body: 'to delete',
    });
    const agent = await loginAs(app, manager);
    const res = await agent.delete(`/messages/${msg._id}`);
    expect(res.status).toBe(204);
    expect(await Message.countDocuments({ _id: msg._id })).toBe(0);
  });

  it('lets admin delete any message', async () => {
    const manager = await createUser({ role: 'manager' });
    const worker = await createUser({ role: 'maintenanceWorker' });
    const admin = await createUser({ role: 'admin' });
    const msg = await createMessage({
      author: manager,
      recipient: worker,
      body: 'to delete',
    });
    const agent = await loginAs(app, admin);
    const res = await agent.delete(`/messages/${msg._id}`);
    expect(res.status).toBe(204);
  });

  it('forbids non-author non-admin (403)', async () => {
    const manager = await createUser({ role: 'manager' });
    const worker = await createUser({ role: 'maintenanceWorker' });
    const safety = await createUser({ role: 'safety' });
    const msg = await createMessage({
      author: manager,
      recipient: worker,
      body: 'protected',
    });
    const agent = await loginAs(app, safety);
    const res = await agent.delete(`/messages/${msg._id}`);
    expect(res.status).toBe(403);
  });
});

describe('Message TTL index', () => {
  it('exists with partialFilterExpression on expireAt', async () => {
    const indexes = await Message.collection.indexes();
    const ttl = indexes.find((i) => i.name === 'message_ttl_expireAt');
    expect(ttl).toBeDefined();
    expect(ttl.expireAfterSeconds).toBe(0);
    expect(ttl.partialFilterExpression).toEqual({
      expireAt: { $type: 'date' },
    });
  });
});

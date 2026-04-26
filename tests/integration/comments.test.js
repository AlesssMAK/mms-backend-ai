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
import {
  createUser,
  createPlant,
  createPart,
  createFault,
} from '../helpers/factories.js';
import { loginAs } from '../helpers/auth.js';
import { ensureSingleton as ensureSystemSettings } from '../../src/services/systemSettings.js';
import { Comment } from '../../src/models/comment.js';

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

describe('POST /faults/:faultId/comments', () => {
  it('lets safety/manager/maintenanceWorker/admin comment', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00021' });
    const plant = await createPlant();
    const part = await createPart(plant);
    const fault = await createFault({ operator: op, plant, part });

    const safety = await createUser({ role: 'safety' });
    const agent = await loginAs(app, safety);

    const res = await agent
      .post(`/faults/${fault._id}/comments`)
      .send({ content: 'Verifica eseguita, OK' });

    expect(res.status).toBe(201);
    expect(await Comment.countDocuments({ faultId: fault._id })).toBe(1);
  });

  it('forbids operators (403)', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00022' });
    const plant = await createPlant();
    const part = await createPart(plant);
    const fault = await createFault({ operator: op, plant, part });
    const agent = await loginAs(app, op);

    const res = await agent
      .post(`/faults/${fault._id}/comments`)
      .send({ content: 'Operators cannot comment' });
    expect(res.status).toBe(403);
  });

  it('returns 404 if fault does not exist', async () => {
    const safety = await createUser({ role: 'safety' });
    const agent = await loginAs(app, safety);
    const res = await agent
      .post('/faults/000000000000000000000000/comments')
      .send({ content: 'no such fault' });
    expect(res.status).toBe(404);
  });
});

describe('GET /faults/:faultId/comments', () => {
  it('returns paginated comments', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00023' });
    const plant = await createPlant();
    const part = await createPart(plant);
    const fault = await createFault({ operator: op, plant, part });

    const safety = await createUser({ role: 'safety' });
    await Comment.create({
      faultId: fault._id,
      authorId: safety._id,
      authorRole: 'safety',
      content: 'first',
    });
    await Comment.create({
      faultId: fault._id,
      authorId: safety._id,
      authorRole: 'safety',
      content: 'second',
    });

    const agent = await loginAs(app, safety);
    const res = await agent.get(`/faults/${fault._id}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.totalComments).toBe(2);
    expect(res.body.comments).toHaveLength(2);
  });
});

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
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
import { Fault } from '../../src/models/fault.js';

// Cloudinary network call short-circuited.
vi.mock('../../src/utils/saveFileToCloudinary.js', () => ({
  saveFileToCloudinary: vi.fn(async () => ({ secure_url: 'http://stub/img' })),
}));

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

const futureDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

describe('POST /faults', () => {
  it('creates a fault with valid payload', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00001' });
    const plant = await createPlant();
    const part = await createPart(plant);
    const agent = await loginAs(app, op);

    const res = await agent
      .post('/faults')
      .field('faultId', 'SEG-2026-04-001')
      .field('dataCreated', futureDate(0))
      .field('timeCreated', '10:00')
      .field('plantId', String(plant._id))
      .field('partId', String(part._id))
      .field('typeFault', 'Production')
      .field('comment', 'Test comment >5 chars');

    expect(res.status).toBe(201);
    expect(res.body.faultId).toBe('SEG-2026-04-001');
    expect(await Fault.countDocuments()).toBe(1);
  });

  it('rejects faultId not matching SEG-YYYY-MM-NNN pattern', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00002' });
    const plant = await createPlant();
    const part = await createPart(plant);
    const agent = await loginAs(app, op);

    const res = await agent
      .post('/faults')
      .field('faultId', 'BADID')
      .field('dataCreated', futureDate(0))
      .field('timeCreated', '10:00')
      .field('plantId', String(plant._id))
      .field('partId', String(part._id))
      .field('comment', 'something');
    expect(res.status).toBe(400);
  });

  it('rejects past dataCreated', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00003' });
    const plant = await createPlant();
    const part = await createPart(plant);
    const agent = await loginAs(app, op);

    const res = await agent
      .post('/faults')
      .field('faultId', 'SEG-2026-04-002')
      .field('dataCreated', futureDate(-2))
      .field('timeCreated', '10:00')
      .field('plantId', String(plant._id))
      .field('partId', String(part._id))
      .field('comment', 'past date should fail');
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate faultId', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00004' });
    const plant = await createPlant();
    const part = await createPart(plant);
    await createFault({
      operator: op,
      plant,
      part,
      faultId: 'SEG-2026-04-003',
    });
    const agent = await loginAs(app, op);

    const res = await agent
      .post('/faults')
      .field('faultId', 'SEG-2026-04-003')
      .field('dataCreated', futureDate(0))
      .field('timeCreated', '10:00')
      .field('plantId', String(plant._id))
      .field('partId', String(part._id))
      .field('comment', 'duplicate id');
    expect(res.status).toBe(409);
  });

  it('rejects part that does not belong to plant', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00005' });
    const plantA = await createPlant();
    const plantB = await createPlant();
    const partB = await createPart(plantB);
    const agent = await loginAs(app, op);

    const res = await agent
      .post('/faults')
      .field('faultId', 'SEG-2026-04-004')
      .field('dataCreated', futureDate(0))
      .field('timeCreated', '10:00')
      .field('plantId', String(plantA._id))
      .field('partId', String(partB._id))
      .field('comment', 'part on wrong plant');
    expect(res.status).toBe(400);
  });
});

describe('GET /faults', () => {
  it('lists faults with pagination', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00006' });
    const plant = await createPlant();
    const part = await createPart(plant);
    await createFault({ operator: op, plant, part });
    await createFault({ operator: op, plant, part });
    await createFault({ operator: op, plant, part });

    const agent = await loginAs(app, op);
    const res = await agent.get('/faults?page=1&perPage=2');
    expect(res.status).toBe(200);
    expect(res.body.totalFault).toBe(3);
    expect(res.body.fault).toHaveLength(2); // page 1 of perPage=2
  });
});

describe('GET /faults/:faultId', () => {
  it('returns 400 for invalid object id', async () => {
    const op = await createUser({ role: 'operator', personalCode: 'OP00007' });
    const agent = await loginAs(app, op);
    const res = await agent.get('/faults/not-an-id');
    expect(res.status).toBe(400);
  });
});

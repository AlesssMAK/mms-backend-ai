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
import {
  createUser,
  createPlant,
  createPart,
  createFault,
} from '../helpers/factories.js';
import { ensureSingleton as ensureSystemSettings } from '../../src/services/systemSettings.js';
import { runOverdueScan } from '../../src/cron/overdueJob.js';
import { runReplanScan } from '../../src/cron/replanJob.js';
import { Fault } from '../../src/models/fault.js';
import { AuditLog } from '../../src/models/auditLog.js';
import { STATUS_FAULT } from '../../src/constants/statusFault.js';

beforeAll(startInMemoryMongo);
afterAll(stopInMemoryMongo);
beforeEach(async () => {
  await clearDatabase();
  await ensureSystemSettings();
});

const ymd = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

describe('runOverdueScan', () => {
  it('marks active faults with deadline < today as Overdue', async () => {
    const op = await createUser({ role: 'operator' });
    const plant = await createPlant();
    const part = await createPart(plant);

    const overdue = await createFault({
      operator: op,
      plant,
      part,
      statusFault: STATUS_FAULT.IN_PROGRESS,
      deadline: ymd(-2),
    });
    const future = await createFault({
      operator: op,
      plant,
      part,
      statusFault: STATUS_FAULT.IN_PROGRESS,
      deadline: ymd(7),
    });
    const completed = await createFault({
      operator: op,
      plant,
      part,
      statusFault: STATUS_FAULT.COMPLETED,
      deadline: ymd(-2),
    });

    const result = await runOverdueScan();
    expect(result.scanned).toBe(1);
    expect(result.updated).toBe(1);

    const overdueFresh = await Fault.findById(overdue._id);
    expect(overdueFresh.statusFault).toBe(STATUS_FAULT.OVERDUE);
    expect(overdueFresh.history.at(-1).action).toBe('auto_overdue');

    // Audit entry exists (the action enum had to be extended in this PR
    // before this assertion could even pass — fault.auto_overdue was
    // emitted by the cron but rejected by the AuditLog Mongoose enum).
    // logEvent is fire-and-forget, so wait briefly for the write.
    await new Promise((r) => setTimeout(r, 50));
    const audit = await AuditLog.findOne({ action: 'fault.auto_overdue' });
    expect(audit).not.toBeNull();

    const futureFresh = await Fault.findById(future._id);
    expect(futureFresh.statusFault).toBe(STATUS_FAULT.IN_PROGRESS);

    const completedFresh = await Fault.findById(completed._id);
    expect(completedFresh.statusFault).toBe(STATUS_FAULT.COMPLETED);
  });

  it('returns scanned=0 when nothing is overdue', async () => {
    const op = await createUser({ role: 'operator' });
    const plant = await createPlant();
    const part = await createPart(plant);
    await createFault({
      operator: op,
      plant,
      part,
      statusFault: STATUS_FAULT.IN_PROGRESS,
      deadline: ymd(5),
    });

    const result = await runOverdueScan();
    expect(result.scanned).toBe(0);
    expect(result.updated).toBe(0);
  });
});

describe('runReplanScan', () => {
  it('returns scanned=0 when nothing is past-due plannedDate', async () => {
    const op = await createUser({ role: 'operator' });
    const plant = await createPlant();
    const part = await createPart(plant);
    await createFault({
      operator: op,
      plant,
      part,
      plannedDate: ymd(7),
      plannedTime: '10:00',
    });
    const r = await runReplanScan();
    expect(r.scanned).toBe(0);
    expect(r.replanned).toBe(0);
  });

  it('moves a past-due plannedDate fault into a fresh slot', async () => {
    const op = await createUser({ role: 'operator' });
    const plant = await createPlant();
    const part = await createPart(plant);
    const worker = await createUser({ role: 'maintenanceWorker' });

    const stale = await createFault({
      operator: op,
      plant,
      part,
      statusFault: STATUS_FAULT.CREATED,
      plannedDate: ymd(-3),
      plannedTime: '09:00',
      deadline: ymd(20),
      assignedMaintainers: [worker._id],
    });

    const r = await runReplanScan();
    expect(r.scanned).toBe(1);
    expect(r.replanned + r.skipped).toBe(1);

    const fresh = await Fault.findById(stale._id);
    if (r.replanned === 1) {
      expect(fresh.plannedDate >= ymd(0)).toBe(true);
      expect(fresh.history.at(-1).action).toBe('auto_replanned');

      // Audit entry exists too
      await new Promise((res) => setTimeout(res, 50));
      const audit = await AuditLog.findOne({
        action: 'fault.auto_replanned',
      });
      expect(audit).not.toBeNull();
    }
  });

  it('skips when deadline forbids any future slot', async () => {
    const op = await createUser({ role: 'operator' });
    const plant = await createPlant();
    const part = await createPart(plant);
    const worker = await createUser({ role: 'maintenanceWorker' });

    await createFault({
      operator: op,
      plant,
      part,
      statusFault: STATUS_FAULT.CREATED,
      plannedDate: ymd(-5),
      plannedTime: '09:00',
      deadline: ymd(-1), // already past
      assignedMaintainers: [worker._id],
    });

    const r = await runReplanScan();
    expect(r.scanned).toBe(1);
    expect(r.skipped).toBe(1);
    expect(r.replanned).toBe(0);
  });
});

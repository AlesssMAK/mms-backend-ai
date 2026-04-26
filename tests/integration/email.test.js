import {
  afterAll,
  afterEach,
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
import { ensureSingleton as ensureSystemSettings } from '../../src/services/systemSettings.js';
import {
  sendNewFaultEmail,
  sendAssignmentEmail,
  sendSicurezzaHseEmail,
  sendDirectMessageEmail,
} from '../../src/services/email/index.js';
import { resetTransporter } from '../../src/services/email/transporter.js';
import { resetRateLimiter } from '../../src/services/email/rateLimiter.js';

beforeAll(startInMemoryMongo);
afterAll(stopInMemoryMongo);
beforeEach(async () => {
  await clearDatabase();
  await ensureSystemSettings();
  resetTransporter();
  resetRateLimiter();
  // EMAIL_DRIVER=stub by default in setupEnv → no real SMTP.
  process.env.EMAIL_DRIVER = 'stub';
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

const fakeFault = {
  _id: '000000000000000000000001',
  faultId: 'SEG-2026-04-001',
  nameOperator: 'op',
  plantId: { namePlant: 'Linea X' },
  partId: { namePlantPart: 'Motore' },
  typeFault: 'Production',
  comment: 'something broke',
};

describe('email: sendNewFaultEmail', () => {
  it('skips when no managers', async () => {
    const r = await sendNewFaultEmail(fakeFault, []);
    expect(r.skipped).toBe(true);
    expect(r.reason).toBe('no_managers');
  });

  it('sends to each manager when feature enabled', async () => {
    const result = await sendNewFaultEmail(fakeFault, [
      { email: 'm1@test.local' },
      { email: 'm2@test.local' },
    ]);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.status === 'fulfilled')).toBe(true);
  });
});

describe('email: sendAssignmentEmail', () => {
  it('skips when no maintainers', async () => {
    const r = await sendAssignmentEmail(fakeFault, []);
    expect(r.skipped).toBe(true);
    expect(r.reason).toBe('no_maintainers');
  });

  it('sends to each maintainer with their personalised context', async () => {
    const result = await sendAssignmentEmail(fakeFault, [
      { email: 'w1@test.local', fullName: 'Worker One' },
    ]);
    expect(result).toHaveLength(1);
  });
});

describe('email: sendSicurezzaHseEmail', () => {
  it('skips when no HSE users', async () => {
    const r = await sendSicurezzaHseEmail(fakeFault, []);
    expect(r.skipped).toBe(true);
    expect(r.reason).toBe('no_hse_users');
  });

  it('sends to each HSE recipient', async () => {
    const result = await sendSicurezzaHseEmail(fakeFault, [
      { email: 'safety@test.local' },
    ]);
    expect(result).toHaveLength(1);
  });
});

describe('email: sendDirectMessageEmail', () => {
  it('skips when recipient has no email', async () => {
    const r = await sendDirectMessageEmail(
      { authorName: 'a', subject: 's', body: 'b', authorId: 'x' },
      {},
    );
    expect(r.skipped).toBe(true);
    expect(r.reason).toBe('no_recipient_email');
  });

  it('sends to recipient with subject prefix [MMS]', async () => {
    const result = await sendDirectMessageEmail(
      {
        authorName: 'Mario',
        authorRole: 'manager',
        subject: 'Hello',
        body: 'Hi',
        authorId: '000000000000000000000007',
      },
      { email: 'r@test.local', fullName: 'Recipient' },
    );
    expect(result).toHaveLength(1);
  });
});

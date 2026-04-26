import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { generatePassword } from '../../src/utils/generators/generatePassword.js';
import generatePersonalCode from '../../src/utils/generators/generatePersonalCode.js';
import generateFaultId from '../../src/utils/generators/generateFaultId.js';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
} from '../helpers/db.js';
import { Fault } from '../../src/models/fault.js';
import { User } from '../../src/models/user.js';

describe('generatePassword', () => {
  it('produces a string of the requested length with all char classes', () => {
    const pw = generatePassword(16);
    expect(pw).toHaveLength(16);
    expect(pw).toMatch(/[A-Z]/);
    expect(pw).toMatch(/[a-z]/);
    expect(pw).toMatch(/\d/);
    expect(pw).toMatch(/[!@#$%^&*()\-_=+[\]{};:,.<>?]/);
  });

  it('defaults to length 12', () => {
    expect(generatePassword()).toHaveLength(12);
  });
});

describe('generators that read from Mongo', () => {
  beforeAll(startInMemoryMongo);
  afterAll(stopInMemoryMongo);

  it('generatePersonalCode returns a unique OPxxxxx and avoids collisions', async () => {
    await clearDatabase();
    const code = await generatePersonalCode();
    expect(code).toMatch(/^OP\d{5}$/);

    // Insert it then ask again — must produce a different one
    await User.create({
      role: 'operator',
      fullName: 'Test Operator',
      email: 'op@test.local',
      personalCode: code,
    });
    const second = await generatePersonalCode();
    expect(second).not.toBe(code);
  });

  it('generateFaultId starts at 001 and increments based on the latest', async () => {
    await clearDatabase();
    const first = await generateFaultId();
    expect(first).toMatch(/^SEG-\d{4}-\d{2}-001$/);

    // Persist a fault with that id and a higher one to test increment.
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    await Fault.create({
      faultId: `SEG-${year}-${month}-042`,
      userId: '000000000000000000000001',
      nameOperator: 'op',
      dataCreated: new Date(),
      timeCreated: '10:00',
      plantId: '000000000000000000000002',
      partId: '000000000000000000000003',
      typeFault: 'Production',
      statusFault: 'Created',
      comment: 'placeholder',
    });
    const next = await generateFaultId();
    expect(next).toBe(`SEG-${year}-${month}-043`);
  });
});

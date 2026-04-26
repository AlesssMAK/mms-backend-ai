import bcrypt from 'bcrypt';
import { User } from '../../src/models/user.js';
import { Plant } from '../../src/models/plant.js';
import { PlantPart } from '../../src/models/part.js';
import { Fault } from '../../src/models/fault.js';
import { Message } from '../../src/models/message.js';

import { USER_STATUS } from '../../src/constants/status.js';
import { TYPE_FAULT } from '../../src/constants/typeFault.js';
import { STATUS_FAULT } from '../../src/constants/statusFault.js';
import { TYPE_PRIORITY } from '../../src/constants/typePriority.js';
import { MESSAGE_TYPE } from '../../src/constants/message.js';

const TEST_PASSWORD = 'TestPass123';

let counter = 1000;
const seq = () => ++counter;

// fullName Joi regex (authValidation.js) requires "two letter-only words"
// — no digits, no single chars. Generate Latin words from the counter.
const wordFromNumber = (n) => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let s = '';
  let x = n;
  while (x > 0) {
    s = letters[x % 26] + s;
    x = Math.floor(x / 26);
  }
  return (s.length < 2 ? s + s : s).padEnd(2, 'a');
};
const uniqFullName = (role) => {
  const w = wordFromNumber(seq());
  // capitalised so it matches `[A-Za-z]` and looks like a real name
  return `${w[0].toUpperCase()}${w.slice(1)} ${role.charAt(0).toUpperCase()}${role.slice(1).replace(/[^A-Za-z]/g, '')}`;
};

/**
 * Create a user with sensible defaults for the chosen role. Pass overrides
 * (email, fullName, status…) to customise. Operator gets a personalCode
 * instead of a password.
 */
export const createUser = async (overrides = {}) => {
  const role = overrides.role ?? 'admin';
  const id = seq();

  const base = {
    role,
    fullName: overrides.fullName ?? uniqFullName(role),
    email: overrides.email ?? `${role}${id}@test.local`,
    status: USER_STATUS.ACTIVE,
    isFirstLogin: false,
  };

  if (role === 'operator') {
    base.personalCode =
      overrides.personalCode ?? `OP${String(id).padStart(5, '0')}`;
  } else {
    base.password = await bcrypt.hash(
      overrides.password ?? TEST_PASSWORD,
      10,
    );
  }

  return User.create({ ...base, ...stripCredentials(overrides) });
};

const stripCredentials = (o) => {
  const { password, personalCode, ...rest } = o;
  return rest;
};

export const TEST_PASSWORD_PLAIN = TEST_PASSWORD;

export const createPlant = (overrides = {}) =>
  Plant.create({
    code: overrides.code ?? `PLT-${seq()}`,
    namePlant: overrides.namePlant ?? 'Linea Test',
    location: overrides.location ?? 'Capannone Test',
    description: overrides.description ?? '',
  });

export const createPart = (plant, overrides = {}) =>
  PlantPart.create({
    plantId: plant._id,
    codePlantPart: overrides.codePlantPart ?? `PRT-${seq()}`,
    namePlantPart: overrides.namePlantPart ?? 'Componente Test',
  });

export const createFault = ({ operator, plant, part, ...overrides } = {}) =>
  Fault.create({
    faultId:
      overrides.faultId ??
      `SEG-2026-04-${String(seq()).padStart(3, '0')}`,
    userId: operator._id,
    nameOperator: operator.fullName,
    dataCreated: overrides.dataCreated ?? new Date(),
    timeCreated: overrides.timeCreated ?? '10:00',
    plantId: plant._id,
    partId: part._id,
    typeFault: overrides.typeFault ?? TYPE_FAULT.PRODUCTION,
    statusFault: overrides.statusFault ?? STATUS_FAULT.CREATED,
    comment: overrides.comment ?? 'Test fault description',
    priority: overrides.priority ?? TYPE_PRIORITY.MEDIUM,
    ...overrides,
  });

export const createMessage = ({ author, recipient, ...overrides } = {}) => {
  const type = overrides.type ?? MESSAGE_TYPE.DIRECT;
  return Message.create({
    type,
    authorId: author._id,
    authorName: author.fullName,
    authorRole: author.role,
    recipientId: type === MESSAGE_TYPE.DIRECT ? recipient?._id : null,
    targetRole:
      type === MESSAGE_TYPE.BROADCAST_ROLE ? overrides.targetRole : null,
    subject: overrides.subject ?? 'Test subject',
    body: overrides.body ?? 'Test body content',
    expireAt: overrides.expireAt ?? null,
  });
};

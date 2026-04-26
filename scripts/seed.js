import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import { connectMongoDB } from '../src/db/connectMongoDB.js';
import { ensureSingleton as ensureSystemSettings } from '../src/services/systemSettings.js';

import { User } from '../src/models/user.js';
import { Plant } from '../src/models/plant.js';
import { PlantPart } from '../src/models/part.js';
import { Fault } from '../src/models/fault.js';
import { Message } from '../src/models/message.js';

import { USER_STATUS } from '../src/constants/status.js';
import { TYPE_FAULT } from '../src/constants/typeFault.js';
import { STATUS_FAULT } from '../src/constants/statusFault.js';
import { TYPE_PRIORITY } from '../src/constants/typePriority.js';
import { MESSAGE_TYPE } from '../src/constants/message.js';
import { computeBroadcastExpireAt } from '../src/services/message.js';

if (process.env.NODE_ENV === 'production') {
  console.error('❌ Refusing to seed: NODE_ENV=production');
  process.exit(1);
}

const STAFF_PASSWORD = 'Password123!';
const OPERATOR_CODE = 'OP00001';

const today = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const todayStr = () => today().toISOString().slice(0, 10);

const upsertUser = async ({ email, fullName, role, password, personalCode }) => {
  const update = {
    fullName,
    role,
    status: USER_STATUS.ACTIVE,
    isFirstLogin: false,
  };
  if (password) update.password = await bcrypt.hash(password, 10);
  if (personalCode) update.personalCode = personalCode;

  return User.findOneAndUpdate(
    { email },
    { $set: update, $setOnInsert: { email } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

const upsertPlant = async ({ code, namePlant, location, description }) =>
  Plant.findOneAndUpdate(
    { code },
    { $set: { namePlant, location, description }, $setOnInsert: { code } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

const upsertPart = async ({ codePlantPart, plantId, namePlantPart }) =>
  PlantPart.findOneAndUpdate(
    { codePlantPart, plantId },
    { $set: { namePlantPart }, $setOnInsert: { codePlantPart, plantId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

const upsertFault = async (data) => {
  const { faultId, ...rest } = data;
  return Fault.findOneAndUpdate(
    { faultId },
    { $set: rest, $setOnInsert: { faultId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

const main = async () => {
  await connectMongoDB();
  await ensureSystemSettings();

  console.log('\n🌱 Seeding users…');
  const admin = await upsertUser({
    email: 'admin@mms.local',
    fullName: 'Admin Demo',
    role: 'admin',
    password: STAFF_PASSWORD,
  });
  const manager = await upsertUser({
    email: 'manager@mms.local',
    fullName: 'Mario Manager',
    role: 'manager',
    password: STAFF_PASSWORD,
  });
  const worker = await upsertUser({
    email: 'worker@mms.local',
    fullName: 'Luigi Manutentore',
    role: 'maintenanceWorker',
    password: STAFF_PASSWORD,
  });
  const safety = await upsertUser({
    email: 'safety@mms.local',
    fullName: 'Sara Sicurezza',
    role: 'safety',
    password: STAFF_PASSWORD,
  });
  const operator = await upsertUser({
    email: 'operator@mms.local',
    fullName: 'Olivia Operatore',
    role: 'operator',
    personalCode: OPERATOR_CODE,
  });

  console.log('🌱 Seeding plants…');
  const plant1 = await upsertPlant({
    code: 'EXT-1',
    namePlant: 'Linea Estrusione 1',
    location: 'Capannone A',
    description: 'Linea principale di estrusione',
  });
  const plant2 = await upsertPlant({
    code: 'PKG-1',
    namePlant: 'Linea Confezionamento',
    location: 'Capannone B',
    description: 'Confezionamento e pallettizzazione',
  });

  console.log('🌱 Seeding parts…');
  const partExt1 = await upsertPart({
    codePlantPart: 'EXT-1-MOT',
    plantId: plant1._id,
    namePlantPart: 'Motore principale',
  });
  const partExt2 = await upsertPart({
    codePlantPart: 'EXT-1-RID',
    plantId: plant1._id,
    namePlantPart: 'Riduttore',
  });
  const partPkg1 = await upsertPart({
    codePlantPart: 'PKG-1-NAS',
    plantId: plant2._id,
    namePlantPart: 'Nastro trasportatore',
  });
  await upsertPart({
    codePlantPart: 'PKG-1-PAL',
    plantId: plant2._id,
    namePlantPart: 'Pallettizzatore',
  });

  console.log('🌱 Seeding faults…');
  const year = new Date().getFullYear();
  await upsertFault({
    faultId: `FA-${year}-001`,
    userId: operator._id,
    nameOperator: operator.fullName,
    dataCreated: today(),
    timeCreated: '09:15',
    plantId: plant1._id,
    partId: partExt1._id,
    typeFault: TYPE_FAULT.PRODUCTION,
    statusFault: STATUS_FAULT.CREATED,
    comment: 'Vibrazione anomala sul motore principale',
    priority: TYPE_PRIORITY.MEDIUM,
  });
  await upsertFault({
    faultId: `FA-${year}-002`,
    userId: operator._id,
    nameOperator: operator.fullName,
    dataCreated: today(),
    timeCreated: '10:30',
    plantId: plant2._id,
    partId: partPkg1._id,
    typeFault: TYPE_FAULT.SAFETY,
    statusFault: STATUS_FAULT.IN_PROGRESS,
    comment: 'Protezione del nastro non chiude correttamente',
    priority: TYPE_PRIORITY.HIGH,
    assignedMaintainers: [worker._id],
    managerId: manager._id,
    plannedDate: todayStr(),
    plannedTime: '14:00',
    estimatedDuration: 60,
    deadline: todayStr(),
  });
  await upsertFault({
    faultId: `FA-${year}-003`,
    userId: operator._id,
    nameOperator: operator.fullName,
    dataCreated: today(),
    timeCreated: '08:00',
    plantId: plant1._id,
    partId: partExt2._id,
    typeFault: TYPE_FAULT.PRODUCTION,
    statusFault: STATUS_FAULT.COMPLETED,
    comment: 'Sostituzione olio riduttore',
    priority: TYPE_PRIORITY.LOW,
    assignedMaintainers: [worker._id],
    managerId: manager._id,
    commentMaintenanceWorker: 'Sostituzione completata, livello OK',
  });

  console.log('🌱 Seeding messages…');
  // Idempotent fixtures: upsert by a stable seedKey stored in subject prefix.
  // We just delete previous fixtures and recreate (cheap, only 2 docs).
  await Message.deleteMany({ subject: { $regex: /^\[seed\]/ } });
  await Message.create({
    type: MESSAGE_TYPE.BROADCAST_ALL,
    authorId: admin._id,
    authorName: admin.fullName,
    authorRole: admin.role,
    subject: '[seed] Benvenuti nel sistema MMS',
    body: 'Questo è un annuncio di esempio visibile a tutti gli utenti.',
    expireAt: computeBroadcastExpireAt(30),
  });
  await Message.create({
    type: MESSAGE_TYPE.DIRECT,
    authorId: manager._id,
    authorName: manager.fullName,
    authorRole: manager.role,
    recipientId: worker._id,
    subject: '[seed] Promemoria intervento',
    body: 'Ciao Luigi, ricordati di controllare il riduttore della linea EXT-1.',
  });

  console.log('\n✅ Seed completed.\n');
  console.log('Credentials (dev only):');
  console.table([
    { role: 'admin', email: admin.email, password: STAFF_PASSWORD },
    { role: 'manager', email: manager.email, password: STAFF_PASSWORD },
    { role: 'maintenanceWorker', email: worker.email, password: STAFF_PASSWORD },
    { role: 'safety', email: safety.email, password: STAFF_PASSWORD },
    { role: 'operator', email: operator.email, personalCode: OPERATOR_CODE },
  ]);
};

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

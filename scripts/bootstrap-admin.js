/**
 * One-shot bootstrap of a single admin user. Safe to run against a
 * production database (unlike seed.js, which loads fixtures and is
 * blocked when NODE_ENV=production).
 *
 * Usage:
 *   BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
 *   BOOTSTRAP_ADMIN_PASSWORD='StrongPass123!' \
 *   BOOTSTRAP_ADMIN_NAME='Admin User' \
 *   MONGO_URL=mongodb+srv://... \
 *   npm run bootstrap-admin
 *
 * Idempotent: if a user with that email already exists, only the
 * password and admin role are updated (so this is also the recovery
 * path if you forget the admin password).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import { connectMongoDB } from '../src/db/connectMongoDB.js';
import { User } from '../src/models/user.js';
import { USER_STATUS } from '../src/constants/status.js';

const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const fullName = process.env.BOOTSTRAP_ADMIN_NAME ?? 'Admin User';

if (!email || !password) {
  console.error(
    '❌ Missing required env vars: BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD',
  );
  process.exit(1);
}
if (password.length < 8) {
  console.error('❌ Password must be at least 8 characters long');
  process.exit(1);
}

const main = async () => {
  await connectMongoDB();

  const hashed = await bcrypt.hash(password, 10);
  const result = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        fullName,
        role: 'admin',
        password: hashed,
        status: USER_STATUS.ACTIVE,
        isFirstLogin: false,
      },
      $setOnInsert: { email },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true },
  );

  const wasInsert = result.lastErrorObject?.updatedExisting === false;
  const user = result.value;

  console.log(
    `\n✅ Admin ${wasInsert ? 'created' : 'updated'}: ${user.email} (id=${user._id})`,
  );
  console.log('   role:', user.role);
  console.log('   fullName:', user.fullName);
  console.log('\nNow log into AdminJS at /admin with this email + password.\n');
};

main()
  .catch((err) => {
    console.error('❌ Bootstrap failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

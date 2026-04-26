import { buildApp } from '../../src/app.js';

/**
 * Test app: no AdminJS (avoids MongoStore + file watcher), no Swagger
 * (saves boot time on every test file).
 */
export const buildTestApp = () =>
  buildApp({ withAdmin: false, withSwagger: false });

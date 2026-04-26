import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { errors } from 'celebrate';
import swaggerUi from 'swagger-ui-express';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import MongoStore from 'connect-mongo';

import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { authenticate } from './middleware/authenticate.js';
import { adminOptions } from './admin/admin.config.js';
import { swaggerSpec } from './swagger/swaggerConfig.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import plantsRoutes from './routes/plantsRoutes.js';
import plantPartRoutes from './routes/plantPartRoutes.js';
import operatorRoutes from './routes/operatorRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import maintenanceWorkerRoutes from './routes/maintenanceWorkerRoutes.js';
import historyFaultRoutes from './routes/historyFaultRoutes.js';
import generatorsRoute from './routes/generatorsRoute.js';
import faultRoutes from './routes/faultRoutes.js';
import systemSettingsRoutes from './routes/systemSettingsRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

/**
 * Build a fresh Express app. No side effects: no DB connect, no listen,
 * no Socket.io, no cron. Tests import this directly via supertest;
 * the production entry (server.js) wires it to a real http.Server.
 *
 * AdminJS is heavy (file watcher in dev, MongoStore session backing) and
 * irrelevant for API tests, so it is opt-in.
 */
export const buildApp = ({ withAdmin = true, withSwagger = true } = {}) => {
  const app = express();

  if (withAdmin) {
    mountAdminJS(app);
  }

  app.use(helmet());
  app.use(logger);
  app.use(express.json());
  app.use(
    cors({
      origin: ['https://http://localhost:3000/'],
      credentials: true,
    }),
  );
  app.use(cookieParser());

  if (withSwagger) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  app.use(authRoutes);
  app.use(userRoutes);
  app.use(plantsRoutes);
  app.use(plantPartRoutes);
  app.use(operatorRoutes);
  app.use(managerRoutes);
  app.use(maintenanceWorkerRoutes);
  app.use(historyFaultRoutes);
  app.use(generatorsRoute);
  app.use(faultRoutes);
  app.use(systemSettingsRoutes);
  app.use(auditLogRoutes);
  app.use(messageRoutes);

  app.use(notFoundHandler);
  app.use(errors());
  app.use(errorHandler);

  return app;
};

const mountAdminJS = (app) => {
  const isProd = process.env.NODE_ENV === 'production';
  const admin = new AdminJS(adminOptions);

  const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    collectionName: 'admin_sessions',
    ttl: 24 * 60 * 60,
  });

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: 'adminjs',
      cookiePassword: process.env.ADMIN_COOKIE_SECRET,
    },
    null,
    {
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      secret: process.env.ADMIN_SESSION_SECRET,
      cookie: {
        httpOnly: true,
        secure: isProd,
        maxAge: 1000 * 60 * 60 * 24,
      },
      name: 'adminjs',
    },
  );
  app.use(admin.options.rootPath, adminRouter);

  if (!isProd) {
    admin.watch();
  }
  console.log('✅ AdminJS mounted at:', admin.options.rootPath);
};

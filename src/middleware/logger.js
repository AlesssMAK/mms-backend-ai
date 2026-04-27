import pino from 'pino-http';

// pino-pretty is a dev-only formatter and lives in devDependencies,
// so it is not installed on production hosts (Render runs `npm install
// --omit=dev` style installs). Fall back to default JSON output there.
const isProd = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
            messageFormat:
              '{req.method} {req.url} {res.statusCode} - {responseTime}ms',
            hideObject: true,
          },
        },
      }),
});

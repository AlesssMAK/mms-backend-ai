// Loaded once per worker before tests run. Sets safe defaults so module
// initialisation (e.g. SystemSettings, AdminJS imports) doesn't blow up
// when env vars are missing in CI.
process.env.NODE_ENV ??= 'test';
process.env.JWT_SECRET ??= 'test-jwt-secret';
process.env.ADMIN_COOKIE_SECRET ??= 'test-admin-cookie';
process.env.ADMIN_SESSION_SECRET ??= 'test-admin-session';
process.env.SOCKET_CORS_ORIGIN ??= 'http://localhost:3000';
process.env.FRONTEND_URL ??= 'http://localhost:3000';
process.env.CRON_ENABLED = 'false';
process.env.EMAIL_DRIVER ??= 'stub';

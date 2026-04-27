import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],

    // Each test file gets its own Mongoose connection state, so we need
    // serial-per-file isolation. Threads pool is fine (Vitest 4 default).
    pool: 'threads',
    // Run test files one at a time. Each file boots its own
    // mongodb-memory-server instance and several files starting in
    // parallel race on the shared mongod binary, producing ETXTBSY
    // on Linux CI runners. Inside a file tests still run concurrently.
    fileParallelism: false,

    // mongodb-memory-server downloads a binary on first run; allow plenty.
    testTimeout: 30_000,
    hookTimeout: 60_000,

    setupFiles: ['./tests/helpers/setupEnv.js'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.js'],
      exclude: [
        'src/swagger/**',
        'src/admin/**',
        'src/server.js',
        'src/app.js', // wiring only; covered transitively by integration tests
        // Excluded by design — would need a live http server / external SDK:
        'src/socket/**',
        'src/db/**',
        'src/utils/saveFileToCloudinary.js',
        // Dead code (not imported anywhere as of A8); kept for future use.
        'src/middleware/audit.js',
        '**/*.config.js',
      ],
      thresholds: {
        // Targets met in A9; branches is the strictest metric and lower
        // here because several legacy controllers (operator/plant/part/
        // generator/history) still lack tests — added in a follow-up PR.
        lines: 70,
        functions: 70,
        branches: 55,
        statements: 70,
      },
    },
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: ['verbose', 'github-actions'],
    logHeapUsage: true,
    setupFiles: ['./src/setup-tests.ts'],
  },
});

import { defineConfig } from 'vitest/config';

// Logic tests only. Browser behavior is covered by the Playwright smoke test.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});

import { defineConfig } from '@playwright/test';

// Uses the installed Chrome. Software WebGL lets the scene run without a GPU.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  use: {
    baseURL: 'http://localhost:5174',
    channel: 'chrome',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: { command: 'npx vite --port 5174 --strictPort', url: 'http://localhost:5174', reuseExistingServer: false, timeout: 60_000 },
});

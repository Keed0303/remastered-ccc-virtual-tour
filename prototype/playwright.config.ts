import { defineConfig } from '@playwright/test';

// Uses the installed Chrome. Software WebGL lets the scene run without a GPU.
export default defineConfig({
  testDir: 'tests/e2e',
  // Software WebGL and two-student tests overload the CPU when run in parallel.
  workers: 1,
  timeout: 90_000,
  // With two students open, one software-drawn frame can take several seconds.
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:5174',
    channel: 'chrome',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: { command: 'npx vite --port 5174 --strictPort', url: 'http://localhost:5174', reuseExistingServer: false, timeout: 60_000 },
});

/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { fileURLToPath } from 'node:url';

const projectSrc = fileURLToPath(new URL('./projects/govpay-console/src', import.meta.url));
const libSrc = fileURLToPath(new URL('./projects/lnk-shared-ui/src', import.meta.url));

export default defineConfig({
  plugins: [
    angular({
      tsconfig: 'projects/govpay-console/tsconfig.spec.json',
      jit: true,
      supportAnalogFormat: false,
    }),
  ],
  resolve: {
    alias: {
      '@core': `${projectSrc}/app/core`,
      '@feature': `${projectSrc}/app/features`,
      '@environment': `${projectSrc}/environments/environment`,
      '@environments': `${projectSrc}/environments`,
      '@assets': `${projectSrc}/assets`,
      '@linkit/shared-ui': `${libSrc}/public_api.ts`,
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['projects/govpay-console/src/test-setup.ts'],
    include: [
      'projects/govpay-console/src/**/*.spec.ts',
      'projects/lnk-shared-ui/src/**/*.spec.ts',
    ],
    reporters: ['default'],
    fileParallelism: false,
    isolate: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['projects/govpay-console/src/app/**/*.ts'],
      exclude: [
        'projects/govpay-console/src/app/**/*.spec.ts',
        'projects/govpay-console/src/app/**/*.routes.ts',
        'projects/govpay-console/src/app/**/*.config.ts',
        'projects/govpay-console/src/main.ts',
      ],
    },
  },
});

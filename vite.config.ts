import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 1420,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // JUnit XML is emitted alongside the default reporter when `make test`
    // sets VITEST_JUNIT (see Makefile). Keeps interactive `npm test` clean.
    reporters: process.env.VITEST_JUNIT
      ? ['default', ['junit', { outputFile: 'reports/testing/frontend.junit.xml' }]]
      : ['default'],
    coverage: {
      provider: 'v8',
      // lcov is required by CONTRIBUTING.md; html + text are for humans.
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'reports/coverage/frontend',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/main.tsx'],
      // Build must fail below 90% total, including branches.
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
})

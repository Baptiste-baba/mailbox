import { playwright } from '@vitest/browser-playwright';
import { defineProject } from 'vitest/config';

// Components run in a real Chromium: keyboard, focus and native controls behave as in the app.
export default defineProject({
  // Bundled before the first test: discovered later, they would reload the run with a second React.
  optimizeDeps: {
    include: ['react', 'react/jsx-dev-runtime', 'vitest-browser-react'],
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false,
    },
  },
});

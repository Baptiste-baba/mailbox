import { playwright } from '@vitest/browser-playwright';
import { defineProject } from 'vitest/config';

// Components run in a real Chromium: keyboard, focus and native controls behave as in the app.
export default defineProject({
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

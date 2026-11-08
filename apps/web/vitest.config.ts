import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineProject } from 'vitest/config';

// Screens run in a real Chromium, styled as in the app: the virtual list needs real sizes.
export default defineProject({
  plugins: [tailwindcss()],
  // Bundled before the first test: discovered later, they would reload the run with a second React.
  optimizeDeps: {
    include: [
      'react',
      'react/jsx-dev-runtime',
      'react-dom/client',
      'vitest-browser-react',
      '@tanstack/react-query',
      '@tanstack/react-router',
      '@tanstack/react-virtual',
      'lucide-react',
      'zod',
    ],
  },
  test: {
    browser: {
      enabled: true,
      // Dates and lists are formatted for a French user in Paris, whatever machine runs the tests.
      provider: playwright({ contextOptions: { locale: 'fr-FR', timezoneId: 'Europe/Paris' } }),
      headless: true,
      instances: [{ browser: 'chromium' }],
      viewport: { width: 1440, height: 900 },
      screenshotFailures: false,
    },
  },
});

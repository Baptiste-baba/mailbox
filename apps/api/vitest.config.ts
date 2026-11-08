import { defineProject } from 'vitest/config';

// The integration tests share one test database and reset the tables they use: one file at a time.
export default defineProject({
  test: {
    fileParallelism: false,
  },
});

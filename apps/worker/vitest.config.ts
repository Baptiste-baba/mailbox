import { defineProject } from 'vitest/config';

// The tests of the copy write mail in the test database the api tests reset: they run one file at
// a time, once the projects of the first group are done.
export default defineProject({
  test: {
    fileParallelism: false,
    sequence: { groupOrder: 1 },
  },
});

import { createInterface } from 'node:readline/promises';
import { runResetCommand } from './auth/reset-command.ts';

// Run on the server, inside the container: docker compose exec api node dist/reset-auth.js
const prompt = createInterface({ input: process.stdin, output: process.stdout });
try {
  const succeeded = await runResetCommand(process.env, {
    ask: (question) => prompt.question(question),
    print: (text) => process.stdout.write(text),
  });
  process.exitCode = succeeded ? 0 : 1;
} finally {
  prompt.close();
}

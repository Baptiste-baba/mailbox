import { createFileRoute } from '@tanstack/react-router';
import { ThreadPlaceholder } from '../../../features/thread/index.ts';

export const Route = createFileRoute('/_shell/$view/')({
  component: ThreadPlaceholder,
});

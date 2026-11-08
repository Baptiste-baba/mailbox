import { createFileRoute } from '@tanstack/react-router';
import { ThreadCrash, ThreadPane } from '../../../features/thread/index.ts';

export const Route = createFileRoute('/_shell/$view/$id')({
  component: ThreadPane,
  errorComponent: ThreadCrash,
});

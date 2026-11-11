import { createFileRoute } from '@tanstack/react-router';
import { ComposeCrash, ComposePane } from '../../../features/compose/index.ts';

export const Route = createFileRoute('/_shell/$view/new')({
  component: ComposePane,
  errorComponent: ComposeCrash,
});

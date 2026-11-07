import { createFileRoute } from '@tanstack/react-router';
import { Shell } from '../shell/shell.tsx';

export const Route = createFileRoute('/_shell')({
  component: Shell,
});

import { createFileRoute } from '@tanstack/react-router';
import { SettingsCrash, SettingsPage } from '../../features/settings/index.ts';

export const Route = createFileRoute('/_shell/settings')({
  component: SettingsPage,
  errorComponent: SettingsCrash,
});

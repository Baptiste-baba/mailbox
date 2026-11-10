import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Stepper } from './stepper.tsx';

describe('Stepper', () => {
  test('lists the steps in order under its name, the current one marked', async () => {
    const screen = await render(
      <Stepper
        label="Étapes de l'installation"
        steps={['Code', 'Compte', 'Application']}
        current={1}
      />,
    );

    const steps = screen
      .getByRole('list', { name: "Étapes de l'installation" })
      .getByRole('listitem');
    await expect.element(steps.nth(0).getByText('Code', { exact: true })).toBeVisible();
    await expect.element(steps.nth(0)).not.toHaveAttribute('aria-current');
    await expect.element(steps.nth(1).getByText('Compte', { exact: true })).toBeVisible();
    await expect.element(steps.nth(1)).toHaveAttribute('aria-current', 'step');
    await expect.element(steps.nth(2).getByText('Application', { exact: true })).toBeVisible();
    await expect.element(steps.nth(2)).not.toHaveAttribute('aria-current');
  });
});

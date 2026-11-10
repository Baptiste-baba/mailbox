import { Meter, Stepper } from '@mailbox/ui';
import { CatalogSection, SampleName } from './catalog-section.tsx';

const steps = ['Code', 'Compte', 'Application', 'Codes de secours'];

export function StepperSection() {
  return (
    <CatalogSection title="Étapes et mesures">
      <div className="flex max-w-100 flex-col gap-8">
        <Stepper label="Étapes, la deuxième en cours" steps={steps} current={1} />
        <Stepper label="Étapes, la dernière en cours" steps={steps} current={3} />
      </div>
      <SampleName name="<Stepper> · faites cochées, en cours entourée, à venir en gris" />
      <div className="flex max-w-100 flex-col gap-3">
        <Meter label="Robustesse, faible" value={1} max={4} valueText="faible" />
        <Meter label="Robustesse, excellente" value={4} max={4} valueText="excellente" />
      </div>
      <SampleName name="<Meter> · une mesure qui se remplit en vert" />
    </CatalogSection>
  );
}

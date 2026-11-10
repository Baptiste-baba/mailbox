import { AvatarSection } from './avatar-section.tsx';
import { ButtonSection } from './button-section.tsx';
import { CatalogPart } from './catalog-section.tsx';
import { ColorSection } from './color-section.tsx';
import { FormSection } from './form-section.tsx';
import { IconButtonSection } from './icon-button-section.tsx';
import { KbdSection } from './kbd-section.tsx';
import { NavigationSection } from './navigation-section.tsx';
import { RadiusSection } from './radius-section.tsx';
import { SearchFieldSection } from './search-field-section.tsx';
import { SegmentedControlSection } from './segmented-control-section.tsx';
import { ShadowSection } from './shadow-section.tsx';
import { StepperSection } from './stepper-section.tsx';
import { SurfacesSection } from './surfaces-section.tsx';
import { TypographySection } from './typography-section.tsx';

const themes = [
  { className: 'light', title: 'Thème clair' },
  { className: 'dark', title: 'Thème sombre' },
];

/** Every token and component, side by side in both themes, to check them against the mockups. */
export function CatalogPage() {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      {themes.map((theme) => (
        <section
          key={theme.className}
          className={`${theme.className} flex flex-col gap-12 bg-chrome p-8 text-ink`}
        >
          <h1 className="text-title font-semibold text-heading">{theme.title}</h1>
          <CatalogPart title="Fondations">
            <ColorSection />
            <TypographySection />
            <ShadowSection />
            <RadiusSection />
          </CatalogPart>
          <CatalogPart title="Composants">
            <KbdSection />
            <ButtonSection />
            <IconButtonSection />
            <AvatarSection />
            <SegmentedControlSection />
            <SearchFieldSection />
            <FormSection />
            <StepperSection />
            <NavigationSection />
            <SurfacesSection />
          </CatalogPart>
        </section>
      ))}
    </div>
  );
}

import { AiSection } from './ai-section.tsx';
import { AvatarSection } from './avatar-section.tsx';
import { ButtonSection } from './button-section.tsx';
import { CatalogPart } from './catalog-section.tsx';
import { ColorSection } from './color-section.tsx';
import { IconButtonSection } from './icon-button-section.tsx';
import { KbdSection } from './kbd-section.tsx';
import { RadiusSection } from './radius-section.tsx';
import { SegmentedControlSection } from './segmented-control-section.tsx';
import { ShadowSection } from './shadow-section.tsx';
import { ToggleChipSection } from './toggle-chip-section.tsx';
import { TypographySection } from './typography-section.tsx';

const themes = [
  { className: 'light', title: 'Thème clair' },
  { className: 'dark', title: 'Thème sombre' },
];

/** Every token and component, side by side in both themes, to check them against the design handoff. */
export function CatalogPage() {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      {themes.map((theme) => (
        <section
          key={theme.className}
          className={`${theme.className} flex flex-col gap-12 bg-paper p-8 text-ink`}
        >
          <h1 className="text-title font-bold">{theme.title}</h1>
          <CatalogPart title="Fondations">
            <ColorSection />
            <TypographySection />
            <ShadowSection />
            <RadiusSection />
            <AiSection />
          </CatalogPart>
          <CatalogPart title="Composants">
            <KbdSection />
            <ButtonSection />
            <IconButtonSection />
            <AvatarSection />
            <SegmentedControlSection />
            <ToggleChipSection />
          </CatalogPart>
        </section>
      ))}
    </div>
  );
}

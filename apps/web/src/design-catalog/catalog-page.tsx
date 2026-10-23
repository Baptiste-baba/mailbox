import { AiSection } from './ai-section.tsx';
import { ColorSection } from './color-section.tsx';
import { RadiusSection } from './radius-section.tsx';
import { ShadowSection } from './shadow-section.tsx';
import { TypographySection } from './typography-section.tsx';

const themes = [
  { className: 'light', title: 'Thème clair' },
  { className: 'dark', title: 'Thème sombre' },
];

/** Every token, side by side in both themes, to check them against the design handoff. */
export function CatalogPage() {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      {themes.map((theme) => (
        <section
          key={theme.className}
          className={`${theme.className} flex flex-col gap-10 bg-paper p-8 text-ink`}
        >
          <h1 className="text-title font-bold">{theme.title}</h1>
          <ColorSection />
          <TypographySection />
          <ShadowSection />
          <RadiusSection />
          <AiSection />
        </section>
      ))}
    </div>
  );
}

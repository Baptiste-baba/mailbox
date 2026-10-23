import { CatalogSection, TokenName } from './catalog-section.tsx';

export function AiSection() {
  return (
    <CatalogSection title="Rendu IA">
      <div className="flex flex-col gap-2">
        <span className="h-3 rounded-full bg-linear-to-r from-g1 via-g2 to-g3" />
        <TokenName name="--g1 → --g2 → --g3" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="ai-text font-semibold">Où en est ce fil</span>
        <TokenName name="ai-text · petits titres et appels de l’IA" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="ai-surface flex flex-col gap-1 rounded-card p-4">
          <span className="ai-text text-label font-semibold">Le reste</span>
          <p className="text-aitx">
            Deux factures, neuf notifications et un e-billet. Rien qui demande ton attention.
          </p>
        </div>
        <TokenName name="ai-surface · encadré de ce que produit l’IA" />
      </div>
    </CatalogSection>
  );
}

import { fr } from './i18n/fr.ts';

/**
 * The logo and the name of the app. In a container narrower than `rail`, the logo stands alone and
 * the name stays for screen readers.
 */
export function Brand({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-none items-center gap-2.5 ${className}`}>
      {/* Decorative: the product name follows it. */}
      <img src="/favicon.svg" alt="" className="size-7.5 flex-none" />
      <span className="text-brand font-semibold text-heading @max-rail:sr-only">
        {fr.common.productName}
      </span>
    </div>
  );
}

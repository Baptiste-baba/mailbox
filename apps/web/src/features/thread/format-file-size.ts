const LOCALE = 'fr-FR';

const kilobytes = new Intl.NumberFormat(LOCALE, {
  style: 'unit',
  unit: 'kilobyte',
  maximumFractionDigits: 0,
});
const megabytes = new Intl.NumberFormat(LOCALE, {
  style: 'unit',
  unit: 'megabyte',
  maximumFractionDigits: 1,
});

/** Size of a file as people read it: "214 ko", "1,4 Mo"; in powers of 1000, as macOS counts. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1_000_000) {
    return kilobytes.format(Math.max(1, Math.round(bytes / 1000)));
  }
  return megabytes.format(bytes / 1_000_000);
}

/** Kind of a file from the extension of its name, "PDF" for "contrat.pdf"; empty without one. */
export function fileKind(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(dot + 1).toUpperCase() : '';
}

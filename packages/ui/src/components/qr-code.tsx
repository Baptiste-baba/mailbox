import { useMemo } from 'react';
import { encode } from 'uqr';
import { joinClassNames } from '../join-class-names.ts';

// The four-module margin the QR code standard asks for, so that scanners find the code's edges.
const QUIET_ZONE = 4;

// One square per dark module, in a single path: light to render at any size.
function modulesPath(modules: boolean[][]): string {
  return modules
    .flatMap((row, y) => row.map((dark, x) => (dark ? `M${x} ${y}h1v1h-1z` : '')))
    .join('');
}

interface QrCodeProps {
  /** The text the code holds, such as a link. */
  value: string;
  /** What the code is, read aloud in its place. */
  label: string;
  className?: string;
}

/** A QR code drawn as an image, sharp at any size. */
export function QrCode({ value, label, className }: QrCodeProps) {
  const { size, data } = useMemo(() => encode(value, { ecc: 'M', border: QUIET_ZONE }), [value]);
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className={joinClassNames('rounded-md bg-qr-background fill-qr-module', className)}
    >
      <path d={modulesPath(data)} />
    </svg>
  );
}

type SwatchColor = 'navy' | 'azur' | 'ciel' | 'glacier' | 'slate';
type SwatchShape = 'circle' | 'square';

const colorClassNames: Record<SwatchColor, string> = {
  navy: 'bg-navy',
  azur: 'bg-azur',
  ciel: 'bg-ciel',
  glacier: 'bg-glacier',
  slate: 'bg-slate',
};

type SwatchSize = 'regular' | 'small';

const shapeClassNames: Record<SwatchShape, string> = {
  circle: 'rounded-full',
  square: 'rounded-3xs',
};

const sizeClassNames: Record<SwatchShape, Record<SwatchSize, string>> = {
  circle: { regular: 'size-2', small: 'size-1.5' },
  square: { regular: 'size-2.25', small: 'size-1.5' },
};

interface SwatchProps {
  color: SwatchColor;
  shape: SwatchShape;
  /** Small inside a line of small text, such as the footer of a list row. */
  size?: SwatchSize;
}

/** A small mark in one of the palette colours, the colour the user gave to something. */
export function Swatch({ color, shape, size = 'regular' }: SwatchProps) {
  return (
    <span
      aria-hidden="true"
      className={`block flex-none ${shapeClassNames[shape]} ${sizeClassNames[shape][size]} ${colorClassNames[color]}`}
    />
  );
}

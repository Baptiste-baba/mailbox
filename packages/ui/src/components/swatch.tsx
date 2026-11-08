type SwatchColor = 'navy' | 'azur' | 'ciel' | 'glacier' | 'slate';
type SwatchShape = 'circle' | 'square';

const colorClassNames: Record<SwatchColor, string> = {
  navy: 'bg-navy',
  azur: 'bg-azur',
  ciel: 'bg-ciel',
  glacier: 'bg-glacier',
  slate: 'bg-slate',
};

const shapeClassNames: Record<SwatchShape, string> = {
  circle: 'size-2 rounded-full',
  square: 'size-2.25 rounded-3xs',
};

interface SwatchProps {
  color: SwatchColor;
  shape: SwatchShape;
  /** Smaller, to sit in a line of small text, such as the footer of a list row. */
  small?: boolean;
}

/** A small mark in one of the palette colours, the colour the user gave to something. */
export function Swatch({ color, shape, small = false }: SwatchProps) {
  return (
    <span
      aria-hidden="true"
      className={`block flex-none ${shapeClassNames[shape]} ${small ? 'size-1.5' : ''} ${colorClassNames[color]}`}
    />
  );
}

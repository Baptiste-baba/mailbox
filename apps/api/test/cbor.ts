/** What the test authenticator writes in CBOR: integers, byte and text strings, and maps of them. */
type CborValue = number | string | Uint8Array | Map<CborValue, CborValue>;

const UNSIGNED = 0;
const NEGATIVE = 1;
const BYTES = 2;
const TEXT = 3;
const MAP = 5;

/** The first bytes of an item: its major type, then its value or length on as few bytes as fit. */
function itemHead(majorType: number, argument: number): Buffer {
  const typeBits = majorType * 32;
  if (argument < 24) {
    return Buffer.from([typeBits + argument]);
  }
  if (argument < 0x100) {
    return Buffer.from([typeBits + 24, argument]);
  }
  const head = Buffer.alloc(3);
  head.writeUInt8(typeBits + 25);
  head.writeUInt16BE(argument, 1);
  return head;
}

/**
 * A minimal CBOR encoder (RFC 8949), written apart from the api's own code, for the public keys
 * and attestations a test passkey hands over. Lengths stay under 65,536 bytes.
 */
export function encodeCbor(value: CborValue): Buffer {
  if (typeof value === 'number') {
    return value >= 0 ? itemHead(UNSIGNED, value) : itemHead(NEGATIVE, -1 - value);
  }
  if (typeof value === 'string') {
    const text = Buffer.from(value, 'utf8');
    return Buffer.concat([itemHead(TEXT, text.length), text]);
  }
  if (value instanceof Uint8Array) {
    return Buffer.concat([itemHead(BYTES, value.length), value]);
  }
  const entries = [...value].flatMap(([key, item]) => [encodeCbor(key), encodeCbor(item)]);
  return Buffer.concat([itemHead(MAP, value.size), ...entries]);
}

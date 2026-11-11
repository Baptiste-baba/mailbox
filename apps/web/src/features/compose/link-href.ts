import { isValidRecipient } from './is-valid-recipient.ts';

const SCHEME = /^[a-z][a-z\d+.-]*:/i;
const MAILTO = /^mailto:/i;
const WEB_PROTOCOLS = ['http:', 'https:'];

/** A web address, kept when it is one: an http or https page on a named host. */
function webHref(address: string): string | undefined {
  const url = URL.parse(address);
  const isWebPage =
    url !== null && WEB_PROTOCOLS.includes(url.protocol) && url.hostname.includes('.');
  return isWebPage ? address : undefined;
}

/**
 * The address of a link as typed, made whole: "exemple.fr" is a web page, "nom@exemple.fr" a mail
 * address. Anything else is refused, so that no link of a mail ever runs code.
 */
export function linkHref(typed: string): string | undefined {
  const address = typed.trim();
  if (address === '' || /\s/.test(address)) {
    return undefined;
  }
  if (MAILTO.test(address)) {
    return isValidRecipient(address.slice('mailto:'.length)) ? address : undefined;
  }
  if (SCHEME.test(address)) {
    return webHref(address);
  }
  return isValidRecipient(address) ? `mailto:${address}` : webHref(`https://${address}`);
}

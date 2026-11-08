import type { MailAddress, Message } from '@mailbox/shared';
import { fr } from '../../i18n/fr.ts';

const nameList = new Intl.ListFormat('fr-FR', { style: 'long', type: 'conjunction' });

function isOwn(person: MailAddress, ownAddress: string | undefined): boolean {
  return person.address.toLowerCase() === ownAddress?.toLowerCase();
}

// Full names: a first name means nothing for a sender such as "Équipe recrutement Nébula".
/** How a person reads in a sentence: "toi" for the owner of the mailbox, their name, else the address. */
export function personName(person: MailAddress, ownAddress: string | undefined): string {
  if (isOwn(person, ownAddress)) {
    return fr.thread.meInSentence;
  }
  return person.name || person.address;
}

function uniqueByAddress(people: MailAddress[]): MailAddress[] {
  const seen = new Set<string>();
  return people.filter((person) => {
    const key = person.address.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/** Everyone in the thread, the others first in order of appearance, the owner last: "Nadia Benali et toi". */
export function participantsLine(messages: Message[], ownAddress: string | undefined): string {
  const everyone = uniqueByAddress(
    messages.flatMap((message) => [message.from, ...message.to, ...message.cc]),
  );
  const others = everyone.filter((person) => !isOwn(person, ownAddress));
  const own = everyone.filter((person) => isOwn(person, ownAddress));
  return nameList.format([...others, ...own].map((person) => personName(person, ownAddress)));
}

/** Who a message went to: "à toi, cc Thomas Leroy". */
export function recipientsLine(message: Message, ownAddress: string | undefined): string {
  const names = (people: MailAddress[]) =>
    nameList.format(people.map((person) => personName(person, ownAddress)));
  const to = fr.thread.to(names(message.to));
  return message.cc.length === 0 ? to : `${to}, ${fr.thread.cc(names(message.cc))}`;
}

/** Who a reply would go to: everyone on the latest message but the owner. */
export function replyRecipients(message: Message, ownAddress: string | undefined): string {
  const people = uniqueByAddress([message.from, ...message.to, ...message.cc]).filter(
    (person) => !isOwn(person, ownAddress),
  );
  return nameList.format(people.map((person) => personName(person, ownAddress)));
}

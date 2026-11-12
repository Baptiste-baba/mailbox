/** The texts of the list of mails. */
export const inbox = {
  listLabel: 'Liste des mails',
  filterLabel: 'Afficher',
  filterAll: 'Tous',
  filterUnread: 'Non lus',
  searchIn: (place: string) => `Rechercher dans ${place}`,
  inboxPlace: 'la réception',
  allMailboxesPlace: 'toutes les boîtes',
  noSubject: '(Sans objet)',
  hasAttachments: 'Pièce jointe',
  empty: 'Aucun mail ici.',
  emptyUnread: 'Aucun mail non lu.',
  error: 'Impossible de charger les mails. Vérifie que le serveur est joignable, puis réessaie.',
  loadMoreError: 'Impossible de charger la suite.',
  crash: 'La liste n’a pas pu s’afficher.',
};

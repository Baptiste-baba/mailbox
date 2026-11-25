/** The texts of the app as a whole: its name, the words found on every screen, dates. */
export const common = {
  productName: 'MailBox',
  comingSoon: 'Bientôt disponible',
  retry: 'Réessayer',
  continue: 'Continuer',
  back: 'Retour',
  cancel: 'Annuler',
  close: 'Fermer',
  serverUnreachable: 'Impossible de joindre le serveur. Vérifie qu’il est démarré, puis réessaie.',
  serverProblem: 'Le serveur a rencontré un problème. Réessaie dans un instant.',
  unreadCount: (count: number) => `${count} non ${count >= 2 ? 'lus' : 'lu'}`,
  reconnect: 'Reconnecter',
  noMailbox: 'Aucune boîte connectée.',
  mailboxesError: 'Impossible de charger tes boîtes.',
};

export const dates = {
  today: 'aujourd’hui',
  yesterday: 'hier',
  onDay: (day: string) => `le ${day}`,
  dayAndTime: (day: string, time: string) => `${day}, ${time}`,
};

export const loading = 'Chargement…';

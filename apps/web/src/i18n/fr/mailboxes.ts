/** The texts of the mailboxes, in the settings: connecting, reconnecting and removing them. */
export const mailboxes = {
  title: 'Boîtes mail',
  intro: 'Les comptes dont MailBox lit les mails. Rien n’est modifié chez ton fournisseur.',
  none: 'Aucune boîte connectée pour l’instant.',
  connected: 'Connectée',
  reconnectRequired: 'Reconnexion nécessaire',
  add: 'Ajouter une boîte',
  notConfigured:
    'Ce serveur n’est pas encore configuré pour Gmail. Suis le guide d’installation, section «\u00a0Connecting Gmail\u00a0».',
  addTitle: 'Ajouter une boîte Gmail',
  addIntro:
    'Choisis son nom et sa couleur, puis connecte-toi chez Google pour autoriser MailBox à lire tes mails.',
  nameLabel: 'Nom de la boîte',
  namePlaceholder: 'ex. Perso, Travail',
  nameMissing: 'Donne un nom à la boîte.',
  colorLabel: 'Couleur',
  colors: {
    navy: 'Bleu nuit',
    azur: 'Azur',
    ciel: 'Ciel',
    glacier: 'Glacier',
    slate: 'Ardoise',
  },
  continueAtGoogle: 'Continuer chez Google',
  confirmIdentityToConnect: 'Pour connecter une boîte, confirme d’abord que c’est toi.',
  connecting: 'Connexion de la boîte…',
  backToSettings: 'Retour aux réglages',
  refusedByUser: 'Tu n’as pas autorisé MailBox à lire cette boîte. Rien n’a été modifié.',
  providerUnavailable: 'Google ne répond pas pour le moment. Réessaie dans quelques minutes.',
  failures: {
    connectionExpired:
      'La connexion a expiré ou a déjà servi. Elle doit être terminée en moins de dix minutes, sur le même appareil. Recommence depuis les réglages.',
    codeRefused: 'Google a refusé de valider la connexion. Recommence depuis les réglages.',
    clientRefused:
      'Google refuse les identifiants de ce serveur. Vérifie GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans sa configuration, puis redémarre-le.',
    accessNotGranted:
      'Google n’a pas accordé la lecture de tes mails. Recommence et accepte l’accès demandé.',
    apiDisabled:
      'L’API Gmail n’est pas activée dans le projet Google de ce serveur. Active-la en suivant le guide d’installation, section «\u00a0Connecting Gmail\u00a0», puis recommence.',
    accountUnreadable:
      'Google n’a pas voulu indiquer quel compte s’est connecté. Recommence dans quelques minutes.',
  },
  providerDetail: (detail: string) => `Détail donné par Google\u00a0: ${detail}`,
  remove: 'Retirer',
  removeLabel: (name: string) => `Retirer la boîte «\u00a0${name}\u00a0»`,
  removeTitle: (name: string) => `Retirer la boîte «\u00a0${name}\u00a0»\u00a0?`,
  removeText:
    'Ses mails disparaîtront de MailBox et l’accès de MailBox sera retiré chez Google. Rien n’est supprimé dans ta boîte Gmail.',
  removeProviderUnavailable:
    'Google ne répond pas, la boîte n’a pas été retirée. Réessaie dans quelques minutes.',
  confirmIdentityToRemove: 'Pour retirer une boîte, confirme d’abord que c’est toi.',
  reconnectMailbox: (name: string) => `Reconnecter la boîte «\u00a0${name}\u00a0»`,
  reconnectIntro: (address: string) =>
    `Google ne laisse plus MailBox lire cette boîte. Connecte-toi chez Google avec ${address} pour lui redonner l’accès.`,
  accountMismatch:
    'Tu t’es connecté avec un autre compte que celui de cette boîte. Recommence avec son adresse.',
  removedMeanwhile:
    'Cette boîte a été retirée entre-temps. Pour la retrouver, ajoute-la de nouveau depuis les réglages.',
};

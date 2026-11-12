/** The texts of signing in, authenticator apps, passkeys, confirming who one is and signing out. */
export const auth = {
  setupTitle: 'Installation',
  loginTitle: 'Connexion',
  loginIntro: 'Ravi de te revoir.',
  usernameLabel: 'Nom d’utilisateur',
  usernamePlaceholder: 'alex',
  passwordLabel: 'Mot de passe',
  passwordPlaceholder: 'Ton mot de passe',
  /** The form of the setup code and of the recovery codes. */
  groupedCodePlaceholder: 'XXXX-XXXX-XXXX',
  revealPassword: 'Afficher le mot de passe',
  sessionEnded: 'Ta session a pris fin. Reconnecte-toi.',
  tooManyAttempts: (wait: string) => `Trop d’essais. Réessaie dans ${wait}.`,
  waitSeconds: (seconds: number) => `${seconds} s`,
  waitMinutes: (minutes: number) => `${minutes} min`,
  unreachable: 'Impossible de joindre le serveur. Vérifie qu’il est démarré, puis réessaie.',
  unexpected: 'Le serveur a rencontré un problème. Réessaie dans un instant.',
};

export const authenticator = {
  qrLabel: 'QR code à scanner avec ton application d’authentification',
  secretLabel: 'Ou saisis cette clé dans l’application',
  copy: 'Copier',
  copied: 'Copié',
  copyFailed: 'Copie impossible',
  codeLabel: 'Code à 6 chiffres affiché par l’application',
  codePlaceholder: '123456',
  codeFormat: 'Le code a 6 chiffres.',
  codeRejected:
    'Code incorrect. Tape le code affiché en ce moment\u00a0; s’il est refusé encore, vérifie l’heure de ton téléphone.',
};

export const passkey = {
  signIn: 'Se connecter avec une passkey',
  use: 'Utiliser une passkey',
  or: 'ou',
  rejected: 'Cette passkey n’est pas reconnue. Elle a peut-être été retirée de MailBox.',
  wrongAddress:
    'Les passkeys ne fonctionnent qu’à l’adresse de MailBox réglée sur le serveur. Ouvre MailBox à cette adresse.',
  failed:
    'La passkey n’a pas pu être utilisée. Réessaie, ou utilise un autre moyen de te connecter.',
  listTitle: 'Passkeys',
  listIntro:
    'Une passkey te connecte d’un geste, avec Face ID, Touch ID ou ton gestionnaire de mots de passe.',
  none: 'Aucune passkey pour l’instant.',
  loadError: 'Impossible de charger tes passkeys.',
  history: (added: string, used: string | undefined) =>
    `Ajoutée ${added} · ${used === undefined ? 'Jamais utilisée' : `Utilisée ${used}`}`,
  add: 'Ajouter une passkey',
  addIntro:
    'Donne-lui un nom pour la reconnaître. Ton navigateur te demandera ensuite où l’enregistrer.',
  nameLabel: 'Nom de la passkey',
  namePlaceholder: 'ex. iPhone, MacBook, 1Password',
  nameMissing: 'Donne un nom à la passkey.',
  create: 'Créer la passkey',
  alreadyThere: 'Ce gestionnaire de mots de passe garde déjà une passkey de MailBox.',
  addFailed: 'La passkey n’a pas pu être ajoutée. Réessaie.',
  notAdded:
    'La passkey n’a pas été ajoutée. Si ton gestionnaire de mots de passe l’a quand même enregistrée, supprime-la de ton gestionnaire.',
  remove: 'Retirer',
  removeLabel: (name: string) => `Retirer la passkey «\u00a0${name}\u00a0»`,
  removeTitle: (name: string) => `Retirer la passkey «\u00a0${name}\u00a0»\u00a0?`,
  removeText:
    'Elle ne pourra plus te connecter. Supprime-la aussi de ton gestionnaire de mots de passe, qui continuera de la proposer.',
};

export const identity = {
  intro: 'Pour modifier ta sécurité, confirme d’abord que c’est toi.',
  withPasskey: 'Confirmer avec une passkey',
  confirm: 'Confirmer',
  passwordMissing: 'Saisis ton mot de passe.',
  wrongPassword: 'Mot de passe incorrect.',
};

export const signOut = {
  action: 'Se déconnecter',
  confirmTitle: 'Se déconnecter\u00a0?',
  confirmText:
    'Pour revenir, il te faudra ton mot de passe et un code de ton application d’authentification, ou une passkey.',
  others: 'Déconnecter les autres appareils',
  othersTitle: 'Déconnecter les autres appareils\u00a0?',
  othersText: 'Tous tes autres appareils devront se reconnecter. Celui-ci reste connecté.',
  othersAction: 'Déconnecter',
  othersDone: 'Tes autres appareils sont déconnectés.',
};

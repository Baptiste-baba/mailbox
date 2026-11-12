/** The texts of the sign-in screen and of the first setup. */
export const login = {
  signIn: 'Se connecter',
  missingCredentials: 'Saisis ton nom d’utilisateur et ton mot de passe.',
  invalidCredentials: 'Nom d’utilisateur ou mot de passe incorrect.',
  codeTitle: 'Vérification',
  codeIntro: 'Tape le code à 6 chiffres affiché par ton application d’authentification.',
  codeRejected: 'Code incorrect ou déjà utilisé. Attends le code suivant dans ton application.',
  useRecoveryCode: 'Utiliser un code de secours',
  recoveryTitle: 'Code de secours',
  recoveryIntro: 'Tape un de tes codes de secours. Chacun ne sert qu’une fois.',
  recoveryLabel: 'Code de secours',
  recoveryFormat: 'Le code a la forme XXXX-XXXX-XXXX.',
  recoveryRejected: 'Code de secours inconnu ou déjà utilisé.',
  useAuthenticator: 'Utiliser l’application d’authentification',
  lostAccess: 'Accès perdu\u00a0?',
  lostAccessHelp:
    'Sans ton application d’authentification, utilise un de tes codes de secours. Sans eux non plus, réinitialise l’accès depuis le serveur, comme l’explique la documentation de MailBox\u00a0: tes mails et tes réglages sont conservés.',
  replaceTitle: 'Nouvelle application d’authentification',
  replaceIntro:
    'Tu t’es connecté avec un code de secours\u00a0: configure une nouvelle application d’authentification pour continuer. Tes autres appareils seront déconnectés.',
  recoveryCodesLeft: (count: number) => {
    if (count === 0) {
      return 'Tu n’as plus de code de secours.';
    }
    return count === 1
      ? 'Il te reste un seul code de secours.'
      : `Il te reste ${count} codes de secours.`;
  },
  replaceDone: 'Enregistrer et continuer',
  replaceLoadError: 'Impossible de préparer la nouvelle application d’authentification.',
};

export const setup = {
  steps: ['Code', 'Compte', 'Application', 'Codes de secours'],
  progressLabel: 'Étapes de l’installation',
  codeTitle: 'Code d’installation',
  codeIntro:
    'Ce code prouve que c’est bien toi qui installes MailBox. Le serveur l’affiche dans ses journaux à chaque démarrage.',
  codeLabel: 'Code d’installation',
  codeHint: 'Avec Docker\u00a0: docker compose logs api',
  codeFormat: 'Le code a la forme XXXX-XXXX-XXXX.',
  codeRejected:
    'Ce code est inconnu ou a expiré. Redémarre le serveur pour en afficher un nouveau.',
  accountTitle: 'Ton compte',
  accountIntro: 'Tu te connecteras avec ce nom d’utilisateur et ce mot de passe.',
  usernameRequired: 'Choisis un nom d’utilisateur.',
  passwordTooShort: (length: number) => `Au moins ${length} caractères.`,
  passwordTooWeak:
    'Trop facile à deviner. Une phrase de plusieurs mots est plus sûre, et plus facile à retenir.',
  strengthLabel: 'Robustesse du mot de passe',
  strengthLevels: ['très faible', 'faible', 'moyenne', 'bonne', 'excellente'],
  requirementsLabel: 'Au moins\u00a0:',
  requirementLength: (length: number) => `${length} caractères`,
  requirementStrength: 'robustesse excellente',
  requirementMet: 'atteint',
  requirementMissing: 'pas encore atteint',
  newPasswordPlaceholder: 'Une phrase de plusieurs mots',
  confirmLabel: 'Confirme le mot de passe',
  confirmPlaceholder: 'Le même mot de passe',
  confirmMismatch: 'Les deux mots de passe sont différents.',
  authenticatorTitle: 'Application d’authentification',
  authenticatorIntro:
    'Scanne ce QR code avec ton application d’authentification\u00a0: celle de ton gestionnaire de mots de passe, Google Authenticator ou une autre.',
  createAccount: 'Créer le compte',
  alreadyDone: 'Le compte vient d’être créé, depuis un autre appareil. Connecte-toi.',
  signIn: 'Se connecter',
  recoveryTitle: 'Codes de secours',
  recoveryIntro:
    'Chaque code te connecte une fois sans ton application d’authentification. Garde-les en lieu sûr, par exemple dans ton gestionnaire de mots de passe\u00a0: ils ne seront plus affichés.',
  recoveryListLabel: 'Tes codes de secours',
  copyCodes: 'Copier les codes',
  download: 'Télécharger',
  downloadFileName: 'mailbox-codes-de-secours.txt',
  downloadHeading: (username: string) =>
    `Codes de secours MailBox de ${username}. Chaque code ne sert qu’une fois.`,
  savedConfirmation: 'Je les ai mis en lieu sûr',
  enter: 'Entrer dans MailBox',
};

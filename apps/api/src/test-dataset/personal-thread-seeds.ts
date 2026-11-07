import { me, people } from './test-mailboxes.ts';
import { days, hours, minutes, type ThreadSeed } from './thread-seed.ts';

const personal = 'mailbox-personal';
const association = 'mailbox-association';

const weekendReplies: [keyof typeof people | 'me', number, string][] = [
  [
    'ines',
    days(12),
    'Salut tout le monde ! On se fait ce week-end à la montagne ? J’ai trouvé un chalet pour six.',
  ],
  ['hugo', days(12) - hours(2), 'Grave partant 🏔️ Quelles dates ?'],
  ['me', days(11) + hours(20), 'Partant aussi. Le premier week-end du mois m’arrange.'],
  ['lea', days(11) + hours(18), 'Pareil pour moi, je peux conduire.'],
  ['ines', days(11), 'Top ! Le chalet coûte 540 € pour deux nuits, soit 90 € chacun.'],
  ['claire', days(10) + hours(5), 'Je suis de la partie, je m’occupe des courses du samedi.'],
  ['hugo', days(9), 'Quelqu’un a des raquettes à prêter ?'],
  ['me', days(8) + hours(4), 'J’en ai deux paires, je les prends.'],
  ['lea', days(6), 'Départ vendredi 18 h depuis la gare ? Il reste trois places dans ma voiture.'],
  ['ines', days(4), 'Réservation confirmée ! Je vous envoie le RIB pour les 90 €.'],
  [
    'claire',
    days(1) + hours(6),
    'Liste de courses en pièce jointe, dites-moi s’il manque quelque chose.',
  ],
  ['hugo', hours(5), 'Parfait. Hâte d’y être !'],
];

const longWeekendThread: ThreadSeed = {
  mailboxId: personal,
  subject: 'Week-end au chalet 🏔️',
  unread: true,
  messages: weekendReplies.map(([author, minutesAgo, body], index) => ({
    from: author === 'me' ? me.personal : people[author],
    to: [me.personal, people.ines, people.hugo, people.lea, people.claire],
    minutesAgo,
    body,
    ...(index === weekendReplies.length - 2
      ? { attachments: [{ fileName: 'courses.txt', mimeType: 'text/plain', size: 1_024 }] }
      : {}),
  })),
};

export const personalThreadSeeds: ThreadSeed[] = [
  longWeekendThread,
  {
    mailboxId: personal,
    subject: 'Dîner samedi ?',
    unread: true,
    messages: [
      {
        from: people.claire,
        to: [me.personal],
        minutesAgo: hours(18),
        body: 'Coucou ! Tu viens dîner samedi à 20 h ? Dis-moi si tu viens avec Hugo, que je prévoie assez.\n\nBisous,\nClaire',
      },
    ],
  },
  {
    mailboxId: personal,
    subject: 'Votre dossier de location',
    messages: [
      {
        from: people.landlord,
        to: [me.personal],
        minutesAgo: days(3) + hours(1),
        body: 'Madame, Monsieur,\n\nNous avons bien reçu votre dossier pour l’appartement de la rue des Lilas. Il manque votre dernier avis d’imposition pour le compléter.\n\nCordialement,\nL’agence Les Tilleuls',
      },
    ],
  },
  {
    mailboxId: personal,
    subject: 'Confirmation de votre rendez-vous',
    archived: true,
    messages: [
      {
        from: people.clinic,
        to: [me.personal],
        minutesAgo: days(20),
        body: 'Bonjour,\n\nVotre rendez-vous du 14 à 9 h 30 avec le docteur Fabre est confirmé. Pensez à apporter votre carte Vitale.\n\nLe secrétariat',
      },
    ],
  },
  {
    mailboxId: personal,
    subject: 'Votre colis arrive demain',
    messages: [
      {
        from: people.noName,
        to: [me.personal],
        minutesAgo: minutes(15),
        body: 'Votre colis n° 7Q2-448-901 sera livré demain entre 9 h et 13 h. Vous pouvez choisir un autre créneau depuis votre espace client.',
      },
    ],
  },
  {
    mailboxId: personal,
    subject: 'Pourquoi tout le monde réécrit son client mail',
    messages: [
      {
        from: people.newsletter,
        to: [me.personal],
        minutesAgo: hours(9),
        body: 'Cette semaine : pourquoi le courrier électronique reste le protocole le plus résistant d’internet, et ce que les nouveaux clients mail changent vraiment. Cinq minutes de lecture.',
      },
    ],
  },
  {
    mailboxId: association,
    subject: 'Assemblée générale : ordre du jour',
    unread: true,
    messages: [
      {
        from: people.marc,
        to: [me.association],
        minutesAgo: days(2),
        body: 'Bonjour à tous,\n\nL’assemblée générale aura lieu le 28 à 19 h à la salle municipale. À l’ordre du jour : bilan de l’année, budget et élection du bureau.\n\nMarc',
        attachments: [
          { fileName: 'Ordre_du_jour_AG.pdf', mimeType: 'application/pdf', size: 88_064 },
        ],
      },
    ],
  },
  {
    mailboxId: association,
    subject: 'Remboursement des frais de la fête de quartier',
    archived: true,
    messages: [
      {
        from: people.lea,
        to: [me.association],
        minutesAgo: days(400),
        body: 'Bonjour,\n\nJe t’envoie les justificatifs pour le remboursement des boissons de la fête de quartier : 86,40 € au total.\n\nMerci !\nLéa',
      },
    ],
  },
];

import { me, people } from './test-mailboxes.ts';
import { days, hours, minutes, type ThreadSeed } from './thread-seed.ts';

const work = 'mailbox-work';

export const workThreadSeeds: ThreadSeed[] = [
  {
    mailboxId: work,
    subject: 'Contrat de prestation : version finale',
    unread: true,
    messages: [
      {
        from: people.nadia,
        to: [me.work],
        minutesAgo: days(9),
        body: 'Bonjour Alex,\n\nComme convenu, voici la première version du contrat de prestation. Le périmètre reprend nos échanges de la semaine dernière.\n\nBonne journée,\nNadia',
        attachments: [
          { fileName: 'Contrat_prestation_v1.pdf', mimeType: 'application/pdf', size: 198_400 },
        ],
      },
      {
        from: me.work,
        to: [people.nadia],
        minutesAgo: days(7),
        body: 'Bonjour Nadia,\n\nMerci ! Deux remarques : la clause de propriété intellectuelle devrait se limiter aux livrables, et le tarif journalier doit être celui de mon devis.\n\nAlex',
      },
      {
        from: people.thomas,
        to: [me.work],
        cc: [people.nadia],
        minutesAgo: days(3),
        body: 'Bonjour Alex,\n\nNous aimerions beaucoup vous avoir à Lyon pour le lancement, la semaine du 17. Dites-nous si c’est envisageable.\n\nThomas',
      },
      {
        from: people.nadia,
        to: [me.work],
        cc: [people.thomas],
        minutesAgo: hours(20),
        body: 'Bonjour Alex,\n\nVous trouverez ci-joint la version finale du contrat. J’ai intégré vos deux remarques : la propriété intellectuelle porte uniquement sur les livrables, et le tarif est celui de votre devis.\n\nPour le démarrage, nous avons deux options : le lundi 3 ou le lundi 10. Pourriez-vous nous renvoyer le contrat signé avant vendredi ?\n\nBonne soirée,\nNadia',
        attachments: [
          { fileName: 'Contrat_prestation_v3.pdf', mimeType: 'application/pdf', size: 214_016 },
        ],
      },
    ],
  },
  {
    mailboxId: work,
    subject: 'Entretien Lead développeur : vos créneaux',
    unread: true,
    messages: [
      {
        from: people.recruiter,
        to: [me.work],
        minutesAgo: minutes(47),
        body: 'Bonjour Alex,\n\nMerci pour votre candidature. Nous vous proposons trois créneaux pour un premier entretien : mardi à 10 h, mardi à 14 h 30 ou mercredi à 9 h. Lequel vous conviendrait ?\n\nL’équipe recrutement',
      },
    ],
  },
  {
    mailboxId: work,
    subject: 'Point hebdo : compte rendu',
    messages: [
      {
        from: people.thomas,
        to: [me.work, people.nadia],
        minutesAgo: days(2) + hours(3),
        body: 'Bonjour à tous,\n\nVoici le compte rendu du point de lundi : la maquette est validée, la recette commence jeudi et la mise en ligne reste prévue fin du mois.\n\nThomas',
        attachments: [
          {
            fileName: 'CR_point_hebdo.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 48_640,
          },
          {
            fileName: 'Planning_recette.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 31_232,
          },
        ],
      },
    ],
  },
  {
    mailboxId: work,
    subject:
      'Re: Re: Fwd: Proposition de partenariat pour la refonte complète de la plateforme de réservation, phase 2 et maintenance évolutive sur trois ans',
    messages: [
      {
        from: people.sophie,
        to: [me.work],
        minutesAgo: days(5),
        body: 'Bonjour Alex,\n\nJe me permets de revenir vers vous au sujet de la phase 2. Avez-vous pu regarder notre proposition ?\n\nSophie',
      },
      {
        from: me.work,
        to: [people.sophie],
        minutesAgo: days(4) + hours(22),
        body: 'Bonjour Sophie,\n\nOui, merci. Je reviens vers vous la semaine prochaine avec un chiffrage.\n\nAlex',
      },
    ],
  },
  {
    mailboxId: work,
    subject: 'Devis signé ✅',
    archived: true,
    messages: [
      {
        from: people.sophie,
        to: [me.work],
        minutesAgo: days(48),
        body: 'Bonjour Alex,\n\nVous trouverez le devis signé en pièce jointe. Nous démarrons quand vous voulez.\n\nSophie',
        attachments: [
          { fileName: 'Devis_2026-014_signé.pdf', mimeType: 'application/pdf', size: 156_672 },
        ],
      },
    ],
  },
  {
    mailboxId: work,
    subject: 'Accès au serveur de recette',
    archived: true,
    messages: [
      {
        from: people.julien,
        to: [me.work],
        minutesAgo: days(65),
        body: 'Salut Alex,\n\nTes accès au serveur de recette sont actifs. Ton identifiant est ton adresse, le mot de passe t’arrive par SMS.\n\nJulien',
      },
    ],
  },
];

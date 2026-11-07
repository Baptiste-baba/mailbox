import { me, people } from './test-mailboxes.ts';
import { days, hours, type ThreadSeed } from './thread-seed.ts';

// Repetitive mail, generated to give the lists volume: deployments, then monthly invoices.

const DEPLOYMENT_COUNT = 14;
const INVOICE_COUNT = 12;

const deploymentSeeds: ThreadSeed[] = Array.from({ length: DEPLOYMENT_COUNT }, (_, index) => {
  const version = `1.${DEPLOYMENT_COUNT - index}.0`;
  const failed = index === 3;
  return {
    mailboxId: 'mailbox-project',
    subject: failed
      ? `Échec du déploiement : version ${version}`
      : `Déploiement réussi : version ${version}`,
    unread: index < 2,
    archived: index > 5,
    messages: [
      {
        from: people.ci,
        to: [me.project],
        minutesAgo: hours(3) + days(index * 2),
        body: failed
          ? `Le déploiement de la version ${version} a échoué à l’étape des tests d’intégration. Consultez le journal pour le détail.`
          : `La version ${version} est en ligne. Durée du déploiement : ${2 + (index % 4)} min ${10 + index} s.`,
      },
    ],
  };
});

const invoiceSeeds: ThreadSeed[] = Array.from({ length: INVOICE_COUNT }, (_, index) => {
  const amount = (54.2 + index * 3.35).toFixed(2).replace('.', ',');
  const reference = `EL-${String(4812 - index).padStart(6, '0')}`;
  return {
    mailboxId: 'mailbox-personal',
    subject: `Votre facture ${reference} est disponible`,
    archived: index > 0,
    messages: [
      {
        from: people.energy,
        to: [me.personal],
        minutesAgo: days(1 + index * 30),
        body: `Bonjour,\n\nVotre facture ${reference} d’un montant de ${amount} € est disponible. Elle sera prélevée dans dix jours.\n\nÉnergie Exemple`,
        attachments: [
          {
            fileName: `Facture_${reference}.pdf`,
            mimeType: 'application/pdf',
            size: 92_160 + index * 512,
          },
        ],
      },
    ],
  };
});

export const generatedThreadSeeds: ThreadSeed[] = [...deploymentSeeds, ...invoiceSeeds];

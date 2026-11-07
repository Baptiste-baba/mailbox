import type { FolderSummary, MailAddress } from '@mailbox/shared';
import type { TestDataset } from './test-dataset.ts';

// Fictitious people and example domains only (RFC 2606): the repository is public.

export const me = {
  personal: { name: 'Alex Moreau', address: 'alex.moreau@example.com' },
  work: { name: 'Alex Moreau', address: 'alex@studio-exemple.example' },
  association: { name: 'Alex Moreau', address: 'tresorerie@asso-exemple.example' },
  project: { name: 'Alex Moreau', address: 'hello@projet-exemple.example' },
} satisfies Record<string, MailAddress>;

export const people = {
  claire: { name: 'Claire Dubois', address: 'claire.dubois@example.com' },
  julien: { name: 'Julien Petit', address: 'julien.petit@example.org' },
  nadia: { name: 'Nadia Benali', address: 'n.benali@agence-exemple.example' },
  thomas: { name: 'Thomas Leroy', address: 'thomas.leroy@agence-exemple.example' },
  ines: { name: 'Inès Garnier', address: 'ines.garnier@example.net' },
  hugo: { name: 'Hugo Martin', address: 'hugo.martin@example.com' },
  sophie: { name: 'Sophie Laurent', address: 'sophie@cabinet-exemple.example' },
  marc: { name: 'Marc Fontaine', address: 'marc.fontaine@asso-exemple.example' },
  lea: { name: 'Léa Rousseau', address: 'lea.rousseau@example.org' },
  recruiter: { name: 'Équipe recrutement Nébula', address: 'jobs@nebula-exemple.example' },
  landlord: { name: 'Agence Les Tilleuls', address: 'gestion@tilleuls-exemple.example' },
  clinic: { name: 'Centre médical Saint-Roch', address: 'rdv@centre-exemple.example' },
  newsletter: { name: 'La Lettre du dev', address: 'bonjour@lettre-exemple.example' },
  ci: { name: 'Intégration continue', address: 'notifications@ci-exemple.example' },
  energy: { name: 'Énergie Exemple', address: 'factures@energie-exemple.example' },
  noName: { name: '', address: 'no-reply@livraison-exemple.example' },
} satisfies Record<string, MailAddress>;

export const testMailboxes: TestDataset['mailboxes'] = [
  {
    id: 'mailbox-personal',
    name: 'Perso',
    address: me.personal.address,
    color: 'azur',
    status: 'connected',
  },
  {
    id: 'mailbox-work',
    name: 'Travail',
    address: me.work.address,
    color: 'navy',
    status: 'connected',
  },
  {
    id: 'mailbox-association',
    name: 'Association',
    address: me.association.address,
    color: 'ciel',
    status: 'reconnectRequired',
  },
  {
    id: 'mailbox-project',
    name: 'Projet',
    address: me.project.address,
    color: 'glacier',
    status: 'connected',
  },
];

export const testFolders: FolderSummary[] = [
  { id: 'folder-invoices', name: 'Factures', color: 'navy' },
  { id: 'folder-contracts', name: 'Contrats', color: 'azur' },
  { id: 'folder-hiring', name: 'Recrutement', color: 'ciel' },
  { id: 'folder-travel', name: 'Voyages', color: 'glacier' },
  { id: 'folder-newsletters', name: 'Newsletters', color: 'slate' },
];

import {
  BareInput,
  Checkbox,
  ChipField,
  CopyButton,
  FieldLine,
  PasswordField,
  QrCode,
  Select,
  Swatch,
  TextField,
} from '@mailbox/ui';
import { useId, useState } from 'react';
import { CatalogSection, SampleName } from './catalog-section.tsx';

const SAMPLE_LINK =
  'otpauth://totp/MailBox:alex?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=MailBox';

export function FormSection() {
  return (
    <CatalogSection title="Formulaires">
      <div className="flex max-w-90 flex-col gap-5">
        <TextField label="Nom d'utilisateur" placeholder="alex" />
        <TextField
          label="Code d'installation"
          placeholder="XXXX-XXXX-XXXX"
          hint="Il est affiché dans les journaux du serveur."
        />
        <TextField
          label="Code à 6 chiffres"
          placeholder="123456"
          defaultValue="000000"
          error="Code incorrect."
        />
        <TextField label="Champ désactivé" placeholder="alex" defaultValue="alex" disabled />
        <PasswordField
          label="Mot de passe"
          placeholder="Ton mot de passe"
          revealLabel="Afficher le mot de passe"
        />
        <SampleName name="TextField, PasswordField : libellé, exemple en gris, aide ou erreur sous le champ" />
      </div>
      <FieldLinesSample />
      <div className="flex flex-col gap-2">
        <Checkbox label="Je les ai mis en lieu sûr" />
        <Checkbox label="Case cochée" defaultChecked />
        <Checkbox label="Case désactivée" disabled />
        <SampleName name="Checkbox" />
      </div>
      <div className="flex flex-col items-start gap-2">
        <CopyButton
          text="GEZD GNBV GY3T QOJQ"
          label="Copier"
          copiedLabel="Copié"
          failedLabel="Copie impossible"
        />
        <SampleName name="CopyButton : dit « Copié » un instant après la copie" />
      </div>
      <div className="flex flex-col gap-2">
        <QrCode value={SAMPLE_LINK} label="QR code d'exemple" className="size-45" />
        <SampleName name="QrCode : foncé sur clair dans les deux thèmes" />
      </div>
    </CatalogSection>
  );
}

const SAMPLE_SENDERS = [
  { value: 'perso', label: 'Perso <alex@example.com>' },
  { value: 'travail', label: 'Travail <alex@studio.example>' },
];

function FieldLinesSample() {
  const id = useId();
  const [sender, setSender] = useState('perso');
  const [recipients, setRecipients] = useState(['camille.roussel@exemple.fr', 'hugo@exemple']);
  return (
    <div className="flex max-w-120 flex-col gap-2">
      <div className="flex flex-col">
        <FieldLine label="De" htmlFor={`${id}-from`}>
          <Select id={`${id}-from`} value={sender} onChange={setSender} options={SAMPLE_SENDERS}>
            <Swatch color={sender === 'perso' ? 'azur' : 'navy'} shape="circle" />
            <span className="font-medium text-ink">{sender === 'perso' ? 'Perso' : 'Travail'}</span>
          </Select>
        </FieldLine>
        <FieldLine label="À" htmlFor={`${id}-to`}>
          <ChipField
            id={`${id}-to`}
            values={recipients}
            onChange={setRecipients}
            isValid={(value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)}
            invalidLabel="Adresse invalide"
            removeLabel={(value) => `Retirer ${value}`}
            placeholder="nom@exemple.fr"
          />
        </FieldLine>
        <FieldLine label="Objet" htmlFor={`${id}-subject`}>
          <BareInput
            id={`${id}-subject`}
            placeholder="De quoi parle ton mail ?"
            className="w-full"
          />
        </FieldLine>
      </div>
      <SampleName name="FieldLine avec Select, ChipField (Entrée, virgule ou point-virgule font une pastille, rouge si invalide) et BareInput" />
    </div>
  );
}

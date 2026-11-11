import { Checkbox, ChipField, CopyButton, PasswordField, QrCode, TextField } from '@mailbox/ui';
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
      <ChipFieldSample />
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

function ChipFieldSample() {
  const id = useId();
  const [values, setValues] = useState(['camille.roussel@exemple.fr', 'hugo@exemple']);
  return (
    <div className="flex max-w-120 flex-col gap-2">
      <div className="flex items-start gap-3 border-b border-line py-3">
        <label htmlFor={id} className="flex h-7 flex-none items-center text-small text-ink-2">
          À
        </label>
        <ChipField
          id={id}
          values={values}
          onChange={setValues}
          isValid={(value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)}
          invalidLabel="Adresse invalide"
          removeLabel={(value) => `Retirer ${value}`}
          placeholder="camille@exemple.fr"
          className="flex-1"
        />
      </div>
      <SampleName name="ChipField : Entrée, virgule ou point-virgule font une pastille, rouge si elle n'est pas valide" />
    </div>
  );
}

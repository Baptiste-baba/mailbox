import { Checkbox, CopyButton, Divider, PasswordField, QrCode, TextField } from '@mailbox/ui';
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
      <div className="flex max-w-100 flex-col gap-2">
        <Divider label="ou" />
        <SampleName name="Divider : un filet, un mot au milieu, entre deux façons de faire" />
      </div>
    </CatalogSection>
  );
}

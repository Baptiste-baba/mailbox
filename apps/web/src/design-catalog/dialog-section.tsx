import { Button, Dialog, DialogConfirmation } from '@mailbox/ui';
import { useState } from 'react';
import { CatalogSection, SampleName } from './catalog-section.tsx';

export function DialogSection() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <CatalogSection title="Dialogue">
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Ouvrir le dialogue
        </Button>
      </div>
      <Dialog
        open={open}
        onClose={close}
        title="Retirer la passkey « iPhone » ?"
        closeLabel="Fermer"
      >
        <DialogConfirmation
          message="Elle ne pourra plus te connecter. Supprime-la aussi de ton gestionnaire de mots de passe, qui continuera de la proposer."
          error={undefined}
          confirmLabel="Retirer"
          cancelLabel="Annuler"
          onConfirm={close}
          onCancel={close}
          pending={false}
        />
      </Dialog>
      <SampleName name="<Dialog> · titre, croix et contenu, sur la page voilée ; <DialogConfirmation> · ce que fait l’action, puis l’action rouge et le retour" />
    </CatalogSection>
  );
}

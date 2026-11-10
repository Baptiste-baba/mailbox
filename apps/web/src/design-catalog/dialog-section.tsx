import { Button, Dialog, DialogActions } from '@mailbox/ui';
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
        <p className="text-center text-ink-2">
          Elle ne pourra plus te connecter. Supprime-la aussi de ton gestionnaire de mots de passe,
          qui continuera de la proposer.
        </p>
        <DialogActions>
          <Button variant="danger" size="lg" onClick={close}>
            Retirer
          </Button>
          <Button variant="secondary" size="lg" onClick={close}>
            Annuler
          </Button>
        </DialogActions>
      </Dialog>
      <SampleName name="<Dialog> · titre, croix et contenu, sur la page voilée ; <DialogActions> · les boutons empilés, le principal d’abord" />
    </CatalogSection>
  );
}

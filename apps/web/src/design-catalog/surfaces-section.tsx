import {
  Avatar,
  BarButton,
  Card,
  ColumnResizeHandle,
  FileChip,
  IconButton,
  PaneHeader,
  ResizableColumn,
  ResizableColumns,
  RowLink,
  StateMessage,
} from '@mailbox/ui';
import { ArchiveIcon, FileTextIcon, ReplyIcon } from 'lucide-react';
import { CatalogSection, SampleName } from './catalog-section.tsx';

const noop = () => undefined;

export function SurfacesSection() {
  return (
    <CatalogSection title="Surfaces et états">
      <div className="flex flex-col gap-2">
        <div className="overflow-hidden rounded-md bg-paper shadow-lift">
          <PaneHeader>
            <span className="text-heading font-bold">Réception</span>
            <div className="ml-auto">
              <IconButton label="Archiver" shortcut="E">
                <ArchiveIcon />
              </IconButton>
            </div>
          </PaneHeader>
        </div>
        <SampleName name="<PaneHeader> · en-tête de colonne, 52 px sur un filet" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1 rounded-md bg-paper p-1.5">
          <RowLink href="#" aria-current="page">
            <Avatar name="Claire Dubois" />
            <span className="flex flex-col">
              <span className="font-semibold">Claire Dubois</span>
              <span>Dîner samedi ?</span>
            </span>
          </RowLink>
          <RowLink href="#">
            <Avatar name="Paul Martin" />
            <span className="flex flex-col">
              <span className="font-medium">Paul Martin</span>
              <span>Compte rendu</span>
            </span>
          </RowLink>
        </div>
        <SampleName name="<RowLink> · ligne de liste, en carte quand elle est la page courante" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="rounded-md bg-well p-4">
          <Card className="flex flex-col gap-3 p-4">
            <p className="text-mail">Vous trouverez ci-joint la version finale du contrat.</p>
            <div>
              <FileChip icon={<FileTextIcon />} name="Contrat_v3.pdf" details="PDF, 214 ko" />
            </div>
            <BarButton icon={<ReplyIcon />} shortcut="R" onClick={noop}>
              Répondre à Claire Dubois
            </BarButton>
          </Card>
        </div>
        <SampleName name="<Card>, <FileChip> et <BarButton> · un message, sa pièce jointe, sa réponse" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-24 overflow-hidden rounded-md shadow-lift">
          <ResizableColumns id="catalog-columns" className="h-full">
            <ResizableColumn
              id="catalog-left"
              defaultSize="35%"
              minSize={80}
              className="bg-mist p-3"
            >
              Liste
            </ResizableColumn>
            <ColumnResizeHandle />
            <ResizableColumn id="catalog-right" minSize={80} className="bg-well p-3">
              Fil
            </ResizableColumn>
          </ResizableColumns>
        </div>
        <SampleName name="<ResizableColumns> · glisser le filet, flèches une fois sélectionné, double-clic pour revenir" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-4 rounded-md bg-paper py-6">
          <StateMessage
            message="Impossible de charger les mails."
            action={{ label: 'Réessayer', onClick: noop }}
          />
          <StateMessage
            message="Impossible de charger la suite."
            action={{ label: 'Réessayer', onClick: noop }}
            layout="inline"
            className="justify-center"
          />
        </div>
        <SampleName name='<StateMessage> · layout="block" pour une zone, layout="inline" en fin de liste' />
      </div>
    </CatalogSection>
  );
}

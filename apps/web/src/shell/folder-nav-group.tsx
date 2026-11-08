import { NavGroup, NavGroupAction, Swatch } from '@mailbox/ui';
import { useQuery } from '@tanstack/react-query';
import { foldersQuery } from '../api/folders-query.ts';
import { comingSoonHint } from '../hint.ts';
import { fr } from '../i18n/fr.ts';
import { ComingSoonNavItem } from './coming-soon-nav-item.tsx';
import { NavItemSkeletons, SidebarError } from './sidebar-message.tsx';

/** "Dossiers": the folders the user created, shown before the feature that opens them exists. */
export function FolderNavGroup() {
  return (
    <NavGroup
      title={fr.sidebar.folders}
      action={
        <NavGroupAction
          disabled
          title={comingSoonHint(fr.sidebar.newFolderLabel)}
          aria-label={fr.sidebar.newFolderLabel}
        >
          {fr.sidebar.newFolder}
        </NavGroupAction>
      }
    >
      <FolderItems />
    </NavGroup>
  );
}

function FolderItems() {
  const folders = useQuery(foldersQuery);
  // What is shown stays when a refresh fails: only a first load that fails shows the error.
  if (folders.data === undefined) {
    return folders.isError ? (
      <SidebarError message={fr.sidebar.foldersError} onRetry={() => folders.refetch()} />
    ) : (
      <NavItemSkeletons count={4} />
    );
  }
  return folders.data.folders.map((folder) => (
    <ComingSoonNavItem
      key={folder.id}
      icon={<Swatch color={folder.color} shape="square" />}
      label={folder.name}
    />
  ));
}

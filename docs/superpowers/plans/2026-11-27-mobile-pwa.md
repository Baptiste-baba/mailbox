# Version téléphone (PWA) — plan d'implémentation

> **Pour l'exécution :** une couche = une livraison validée par le PO puis un commit (CLAUDE.md, « Façon de travailler »). Étapes 6 à 8 (vérification, relecture, compte rendu avec captures clair/sombre) à chaque couche. Cases `- [ ]` pour le suivi.

**But :** l'app passe d'elle-même en disposition téléphone ou paysage selon la taille de la fenêtre, avec les mêmes fonctions qu'au bureau.

**Architecture :** une seule app. Deux requêtes média définissent trois dispositions (`phone`, `landscape`, `desktop`). Le JavaScript choisit la _structure_ (colonnes redimensionnables, pile ou deux colonnes fixes, menu en panneau) via `useLayout()`, le CSS ajuste les _tailles_ via deux variantes Tailwind (`phone:`, `compact:`). La navigation en pile s'appuie sur les routes existantes (`/$view`, `/$view/$id`, `/$view/new`, `/settings`).

**Stack :** React 19, TanStack Router, Tailwind v4 (`@custom-variant`), `<dialog>` natif, Vitest navigateur (Chromium réel, `page.viewport()`), Lucide.

**Conception :** `docs/superpowers/specs/2026-11-27-mobile-pwa-design.md` (validée) · **Maquette :** `docs/redesign/mobile.html` dans le dossier principal (validée, non versionnée).

## Contraintes globales

- Seuils : **téléphone** si largeur < 768 px ; **paysage** si largeur ≥ 768 px et hauteur < 500 px ; **bureau** sinon. Valeurs écrites une seule fois côté CSS (`packages/ui/src/variants.css`) et une seule fois côté TS (`apps/web/src/shell/layout.ts`), chacune avec un commentaire qui renvoie à l'autre.
- Le bureau ne change pas : à 1280 × 820 et 1440 × 900, les captures restent identiques à celles d'avant le chantier.
- Aucun geste de balayage pour ouvrir le menu. Bouton ☰ rond (44 px) en haut à gauche de la liste, seul déclencheur.
- Zones tactiles ≥ 44 px au doigt (`touch:` existant), 360 px de large minimum, clair et sombre, aucun texte en dur hors `apps/web/src/i18n/fr/*.ts`, aucune valeur en dur hors tokens.
- Composants génériques (panneau latéral, bouton flottant) dans `packages/ui`, sans notion de mail.
- Fichiers ≤ 300 lignes, fonctions ≤ 40 lignes, pas de nouvelle dépendance.

## Écart à la conception, à valider

La conception dit « le code du cadre téléphone n'est chargé que s'il sert ». Le cadre téléphone fait quelques Ko (un panneau, un bouton, une disposition) ; le charger à la demande ajouterait un temps de chargement visible au démarrage sur téléphone pour un gain négligeable sur ordinateur. **Proposition : pas de chargement à la demande**, taille du bundle mesurée avant / après en M1 et M2 et reportée dans le compte rendu. Si elle grossit de plus de 5 Ko gzip, on revient au chargement à la demande.

## Points de vigilance (à tester dans la couche indiquée)

1. **Retour à la liste à la même position** après avoir lu un mail : la liste reste montée (cachée) pendant que le mail est affiché, sinon la liste virtualisée repart en haut. → M1.
2. **Rotation ou redimensionnement avec un mail ouvert** : téléphone → paysage garde le mail ouvert à droite ; paysage → téléphone affiche le mail en plein écran ; aucun état perdu (brouillon compris). → M1, M5.
3. **Menu et navigation** : choisir une destination ferme le menu ; le retour système avec le menu ouvert le ferme sans quitter l'écran ; le focus revient au bouton ☰. → M2.
4. **Clavier virtuel** : en rédaction, la barre de mise en forme reste visible au-dessus du clavier sur iPhone (Safari et PWA installée) et sur Android. Non testable en Chromium de test : vérification sur vrai téléphone obligatoire. → M5.
5. **Raccourci `C`** : il marche dans les trois dispositions, une seule fois, que le menu soit ouvert ou non. → M2/M3.

---

### M1 · Les trois dispositions et la pile liste ↔ mail

**Fichiers :**
- Créer : `apps/web/src/shell/layout.ts` (requêtes média + `useLayout`), `apps/web/src/shell/use-go-back.ts`, `apps/web/src/shell/back-button.tsx`
- Modifier : `packages/ui/src/variants.css` (variantes `phone:` et `compact:`), `apps/web/src/shell/shell.tsx` (cadre selon la disposition), `apps/web/src/features/inbox/mail-view.tsx` (pile / deux colonnes / colonnes redimensionnables), `apps/web/src/features/compose/use-close-composer.ts` (s'appuie sur `useGoBack`), `apps/web/src/features/thread/thread-toolbar.tsx` (← au début, en téléphone seulement), `apps/web/src/i18n/fr/app.ts` (« Retour »)
- Tests : `apps/web/src/shell/layout.test.tsx`, `apps/web/src/features/inbox/mail-view-phone.test.tsx`

**Interfaces :**
- Produit : `type Layout = 'phone' | 'landscape' | 'desktop'` ; `useLayout(): Layout` (`useSyncExternalStore` sur `matchMedia`, suit les changements en direct) ; `useGoBack(fallback: () => void): () => void` (revient en arrière dans l'historique s'il y en a, sinon appelle `fallback`) ; `<BackButton onBack={() => void} />` (rond 44 px, comme le ☰ de M2).
- Variantes CSS : `phone:` = `@media (max-width: 767.98px)`, `compact:` = téléphone **ou** paysage = `@media (max-width: 767.98px), (max-height: 499.98px)`.

- [ ] Tests (rouges) : `useLayout` vaut `phone` à 390 × 844, `landscape` à 844 × 390, `desktop` à 1440 × 900 et suit un `page.viewport()` ; à 390 × 844 sur `/inbox` la liste est visible et aucune colonne latérale n'est présente ; un appui sur un mail affiche le mail seul (liste cachée, pas démontée) ; ← revient à la liste **au même défilement** (40 mails, défilement à mi-hauteur, comparaison de `scrollTop`) ; ouvert directement sur `/inbox/<id>`, ← mène à `/inbox` ; à 844 × 390 liste et mail côte à côte sans barre latérale ni poignée de redimensionnement ; passer de 844 × 390 à 390 × 844 avec un mail ouvert le montre en plein écran.
- [ ] `Shell` : en `desktop`, le cadre actuel inchangé ; sinon l'écran seul, sur toute la fenêtre, sans `min-h-160`.
- [ ] `MailView` : `desktop` → colonnes actuelles ; `landscape` → liste à largeur fixe (370 px, token de taille) + mail ; `phone` → les deux montés, celui qui n'est pas affiché a `hidden`, selon que la route enfant est l'index ou non (`useChildMatches`).
- [ ] `useCloseComposer` réécrit sur `useGoBack` (même comportement, ses tests existants passent).
- [ ] Vérification : `pnpm typecheck`, `pnpm lint`, `pnpm test`, captures 390 × 844 et 844 × 390 clair/sombre, captures bureau identiques ; taille du bundle avant/après.

### M2 · Le menu ☰

**Fichiers :**
- Créer : `packages/ui/src/components/side-panel.tsx` (+ test), `apps/web/src/shell/menu-context.tsx`, `apps/web/src/shell/menu-button.tsx`
- Modifier : `packages/ui/src/index.ts`, `apps/web/src/shell/shell.tsx` (fournit le contexte, rend le panneau en `compact`), `apps/web/src/shell/sidebar.tsx` et `new-mail-button.tsx` (bouton masqué par `compact:hidden`), raccourci `newMail` déplacé de `NewMailButton` vers `Shell`, `apps/web/src/features/inbox/mail-list-header.tsx` (☰ avant le titre en `compact`), `apps/web/src/i18n/fr/sidebar.ts` (« Ouvrir le menu »), catalogue `apps/web/src/design-catalog`
- Tests : `packages/ui/src/components/side-panel.test.tsx`, `apps/web/src/shell/menu.test.tsx`

**Interfaces :**
- Produit : `<SidePanel open onClose label children />` sur `<dialog>` natif ouvert avec `showModal()`, venant de la gauche (largeur `min(308px, 85vw)`, coins droits arrondis `xl`), glissement CSS (`@starting-style`, coupé si `prefers-reduced-motion`), fermé par Échap **et** par un appui sur le fond (contrairement à `Dialog` : rien n'y est saisi) ; `useMenu(): { open: () => void }` ; `<MenuButton />`.
- Consomme : `useLayout` (M1).

- [ ] Tests (rouges) : `SidePanel` piège le focus, se ferme sur Échap et sur un clic sur le fond, rend le focus à l'élément d'origine ; à 390 × 844 le ☰ ouvre le menu avec Réception, les boîtes, Dossiers, Réglages et **sans** « Nouveau mail » ; choisir « Réglages » ferme le menu et affiche les réglages ; `C` ouvre la rédaction une seule fois, menu ouvert ou fermé, dans les trois dispositions ; à 1440 × 900 aucun ☰.
- [ ] Le menu reprend `<Sidebar />` tel quel (les évolutions du chantier Gmail s'y retrouveront).
- [ ] Le menu se ferme à chaque changement d'adresse (abonnement au routeur dans `menu-context.tsx`).
- [ ] Vérification + captures menu ouvert clair/sombre, téléphone et paysage.

### M3 · Le bouton « Nouveau » flottant

**Fichiers :**
- Créer : `packages/ui/src/components/floating-button.tsx` (+ test)
- Modifier : `packages/ui/src/index.ts`, `apps/web/src/shell/new-mail-button.tsx` (`NewMailFloatingButton`), `apps/web/src/features/inbox/mail-view.tsx` (rendu au-dessus de la liste en `compact`, seulement quand la liste est affichée), catalogue
- Tests : `apps/web/src/shell/new-mail-floating-button.test.tsx`

**Interfaces :** `<FloatingButton icon label onClick />` : pastille primaire 56 px de haut, rayon `xl`, ombre flottante (nouveau token `shadow-float` dans `packages/ui/tokens`), placée en bas à droite au-dessus de la zone de sécurité (`env(safe-area-inset-bottom)`).
- [ ] Tests (rouges) : à 390 × 844 sur la liste, « Nouveau » ouvre la rédaction en plein écran ; absent sur le mail, la rédaction et les réglages ; en paysage, en bas à droite de la colonne de liste ; la dernière carte de la liste reste atteignable (marge basse de la liste ≥ hauteur du bouton).
- [ ] Vérification + captures.

### M4 · Le mail en plein écran

**Fichiers :**
- Modifier : `packages/ui/src/components/pane-card.tsx` (`compact:` sans marge, sans bord, sans ombre, sans arrondi), `apps/web/src/features/thread/thread-pane.tsx` (marges `compact:px-4`), `thread-messages.tsx` / `message-item.tsx` (cadre des messages remplacé par des traits pleine largeur, corps non décalé en `phone`), `thread-toolbar.tsx` (téléphone : ← puis archiver, plus tard, ranger en icône, plus ; « Traduire » masqué en `compact`, comme la maquette), `reply-bar.tsx` (« Envoyer » en icône seule en `phone`, nom accessible conservé)
- Tests : `apps/web/src/features/thread/thread-pane-phone.test.tsx`

- [ ] Tests (rouges) : à 390 × 844, le mail occupe toute la largeur (largeur de l'article = largeur de la fenêtre) ; le bouton d'envoi garde le nom « Envoyer » ; « Ranger » reste atteignable ; à 1440 × 900 la carte est inchangée.
- [ ] États du mail (chargement, introuvable, erreur) vérifiés à 360 px.
- [ ] Vérification + captures 3 / 13 / 9 / 10 de la maquette.

### M5 · La rédaction au téléphone

**Fichiers :**
- Créer : `apps/web/src/shell/use-visual-viewport-height.ts` (écrit la hauteur visible dans `--app-height` sur `<html>`, via `visualViewport`)
- Modifier : `apps/web/index.html` (`interactive-widget=resizes-content` dans la balise viewport), `apps/web/src/shell/shell.tsx` (hauteur `--app-height` en `compact`), `compose-pane.tsx` (téléphone : ← à gauche, titre, « Envoyer » en haut à droite), `compose-footer.tsx` + `format-bar.tsx` (téléphone : une seule barre en bas, mise en forme repliée + pièce jointe + corbeille)
- Tests : `apps/web/src/features/compose/compose-phone.test.tsx`

- [ ] Tests (rouges) : à 390 × 844, ← ferme en gardant le brouillon (le rouvrir montre le texte) ; « Envoyer » est en haut ; la barre unique contient gras, italique, souligné, liste, lien, pièce jointe, corbeille ; la corbeille jette le brouillon ; passer en 1440 × 900 en pleine rédaction garde le texte.
- [ ] **Vérification sur vrai téléphone** (iPhone Safari + PWA installée, si possible Android) : barre visible au-dessus du clavier, pas de saut de mise en page. Mode d'emploi pour le PO : `tailscale serve` devant `pnpm dev` (le HTTPS est obligatoire), à ajouter au README section développement.

### M6 · Réglages et états de la liste au téléphone

**Fichiers :** `apps/web/src/features/settings/settings-page.tsx` (← en `phone`, marges `phone:px-4`, boutons pleine largeur), `apps/web/src/features/inbox/thread-list-states.tsx` et `empty-thread-list.tsx` si besoin à 360 px.
- [ ] Tests : à 390 × 844, ← des réglages revient à la liste ; aucun défilement horizontal à 360 px sur les réglages et les trois états de la liste.
- [ ] Vérification + captures 5, 6, 7, 8, 15.

### M7 · Finitions doigt et PWA

**Fichiers :** `apps/web/index.html` (`viewport-fit=cover`, `apple-mobile-web-app-status-bar-style`), marges `env(safe-area-inset-*)` sur le cadre `compact`, le panneau et le bouton flottant ; `packages/ui/src/components/kbd.tsx` (`touch:hidden`) ; audit des zones tactiles de chaque écran à 44 px.
- [ ] Tests : `Kbd` masqué en `pointer: coarse` (émulation Chromium) ; aucune cible < 44 px au doigt sur liste, menu, mail, rédaction, réglages (mesure des `getBoundingClientRect` des contrôles).
- [ ] Vérification sur vrai téléphone : encoche, barre d'accueil, barre d'état en clair et sombre, rotation.

### M8 · App Mac

**Fichiers :** `apps/desktop/src-tauri/tauri.conf.json` (`minWidth` 760 → 360).
- [ ] Vérification : la fenêtre de l'app Mac rétrécie passe en disposition téléphone, menu et raccourcis fonctionnent ; README (taille minimale) si elle y figure.

### M9 · Connexion et configuration au téléphone

- [ ] Seconde maquette (connexion, configuration en 4 étapes, accès perdu, nouvelle application d'authentification) à 390 × 844, validée par le PO.
- [ ] Adaptation : `auth-layout.tsx`, `auth-step-layout.tsx`, stepper et mises en page en deux colonnes passées en une colonne en `phone` ; tests de non-défilement horizontal à 360 px.

### M10 · Clôture

- [ ] Recalage sur `main` (chantier Gmail s'il est fusionné : Réglages › Boîtes mail, fenêtres de connexion de boîte, affichage HTML du mail à vérifier au téléphone, couche supplémentaire si nécessaire).
- [ ] Revue de toute la branche, `pnpm audit`, README (tester sur téléphone, installer la PWA), PR prête, fusion avec l'accord du PO.

## Hors chantier

Lecture hors connexion (chantier à part), balayage d'un mail pour archiver ou ranger (avec ces actions), tirer pour actualiser, tests Playwright de bout en bout (le projet n'en a pas encore : les parcours sont couverts par les tests Vitest en navigateur réel).

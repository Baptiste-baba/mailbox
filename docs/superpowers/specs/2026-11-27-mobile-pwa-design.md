# Version téléphone (PWA) — conception

Date : 2026-11-27 · Branche : `feat/mobile` (worktree `.claude/worktrees/mobile`, parti de `main`)

## Intention

Pouvoir gérer, lire, trier et répondre à ses mails depuis son téléphone, y compris en déplacement,
avec les mêmes fonctions qu'au bureau — comme le permettent les apps Gmail et Outlook. Pas d'app
native : publier sur les stores coûte, la PWA suffit. L'interface doit être pensée pour le
téléphone et très rapide, pas un bureau rétréci.

## Objectifs

- Sous une certaine largeur de fenêtre, l'app passe en **mode téléphone**. Le critère est la taille
  de la fenêtre, pas le type d'appareil : un téléphone, une tablette en portrait ou une fenêtre
  d'ordinateur rétrécie basculent de la même façon, et la bascule suit la rotation de l'appareil en
  direct. Un téléphone en paysage a sa propre disposition (voir « Ce qui est décidé »).
- Mode téléphone = navigation en pile, un écran à la fois :
  - **Liste** des mails à l'ouverture, plein écran.
  - **Bouton ☰ rond en haut à gauche** de la liste : ouvre par-dessus le contenu de la colonne de
    gauche actuelle (vues, boîtes, dossiers, Réglages). C'est le seul moyen de l'ouvrir.
  - **Bouton « Nouveau » flottant en bas à droite** de la liste.
  - **Appui sur un mail** : son détail en plein écran, avec un retour vers la liste.
- Mêmes fonctions qu'au bureau : chaque écran existant a sa version téléphone, et chaque fonction
  future est livrée directement avec la sienne.

## Non-objectifs

- Pas d'app native, pas de publication sur les stores.
- **Aucun geste de balayage pour ouvrir le menu** (décision du PO : le bouton ☰ et rien d'autre).
- Le balayage d'un mail dans la liste pour archiver ou ranger (prévu par CLAUDE.md) n'est pas
  construit ici : archiver et ranger n'existent pas encore. Il arrivera avec ces actions.
- Pas de nouvelle fonction : ce chantier adapte l'existant et fixe les règles du mobile.
- **Pas de lecture hors connexion** : garder sur l'appareil les mails déjà vus (stockage local
  prévu par CLAUDE.md, absent aujourd'hui sur ordinateur comme sur téléphone) est un chantier à
  part, de préférence après la synchro Gmail (décision du PO).

## Anti-objectifs (ce qui serait un échec même si « ça marche »)

- Deux versions d'un même écran à maintenir.
- Un bureau qui s'alourdit ou ralentit à cause du mobile.
- Une action accessible au clavier ou à la souris mais pas au doigt.
- Un geste de l'app qui entre en conflit avec le geste « retour » du système.

## Contraintes

- CLAUDE.md : zones tactiles de 44 px minimum, 360 px de large minimum, modes clair et sombre,
  retour visuel < 100 ms, 60 images/s, aucun décalage de mise en page, réseau lent supporté, bundle
  initial ≤ 250 Ko gzip, composants génériques dans `packages/ui` uniquement, textes dans `fr.ts`.
- Style : maquette du redesign (`docs/redesign/direction.html`) et style Domuse, qui n'existent
  qu'en version ordinateur : les écrans téléphone sont à concevoir.
- La PWA exige le HTTPS (déjà documenté via `tailscale serve`) ; les sessions aussi.
- Le chantier Gmail (`feat/gmail-mailboxes`) touche en parallèle la barre latérale, les Réglages et
  bientôt l'affichage HTML des mails : ses écrans auront leur version téléphone une fois fusionnés.

## Approches envisagées

1. **Une seule app qui change de cadre selon la largeur** — retenue par le PO.
   Sous le seuil, le cadre à colonnes redimensionnables est remplacé par un cadre téléphone ; les
   composants des écrans (liste, cartes, mail, rédaction, réglages) restent les mêmes et adaptent
   leurs tailles. Une seule version de chaque écran ; le code du cadre téléphone n'est chargé que
   s'il sert.
2. **Tout en CSS par points de rupture**, en masquant des colonnes. Écartée : les colonnes
   redimensionnables sont pilotées en JavaScript et le menu par-dessus demande un vrai composant
   (focus, fermeture) ; on finirait en contournements.
3. **Une app téléphone séparée** (`/m/...` ou point d'entrée dédié). Écartée : chaque écran et
   chaque fonction future écrits deux fois, écarts inévitables entre les deux versions.

## Ce qui est décidé

- Approche 1. Bascule sur la largeur de la fenêtre uniquement.
- La navigation en pile s'appuie sur l'adresse existante : `/<vue>` montre la liste,
  `/<vue>/<id>` le mail, `/<vue>/new` la rédaction, `/settings` les réglages. Le retour du système
  (bouton ou geste) ramène donc à l'écran précédent sans mécanisme propre.
- Menu : bouton ☰ rond en haut à gauche de la liste, panneau qui s'ouvre par-dessus depuis la
  gauche avec le contenu complet de la barre latérale (jamais la version icônes).
- Bouton « Nouveau » flottant en bas à droite de la liste.
- **Téléphone en paysage** (hauteur faible, largeur au-dessus du seuil) : la liste des mails à
  gauche et l'aperçu du mail sélectionné à droite, sans la colonne de gauche (décision du PO). Le
  cadre doit donc tenir sur ~320 px de haut, sans le minimum de 640 px du cadre actuel.
- **App Mac** : le minimum de largeur de sa fenêtre est abaissé pour qu'elle puisse basculer en
  mode téléphone comme le site (décision du PO) ; le mode téléphone est aussi vérifié dans l'app
  Mac.
- Une maquette téléphone (clair et sombre) est validée par le PO avant tout code.

## Propositions de l'architecte (à corriger par le PO)

- **Seuil de largeur : 768 px.** Conséquences : téléphones en portrait et iPad mini en portrait (744 px)
  en mode téléphone ; iPad standard en portrait (810–834 px) et toutes les tablettes en paysage en
  mode bureau, barre latérale réduite à ses icônes.
- **Les trois cadres** : _téléphone_ (pile, un écran à la fois) sous 768 px de large ; _paysage_
  (liste + aperçu, sans colonne de gauche) à partir de 768 px de large quand la hauteur est sous
  500 px ; _bureau_ (l'actuel) sinon. En paysage, le menu s'ouvre avec le même bouton ☰ rond en
  haut à gauche de la liste, et le bouton « Nouveau » flottant reste en bas à droite de la liste.
- **Largeur minimale de l'app Mac : 360 px**, la plus petite largeur que CLAUDE.md impose de
  supporter.
- **Retour depuis un mail, la rédaction ou les réglages :** flèche ← en haut à gauche, à la place
  du ☰. Le ☰ n'apparaît que sur la liste.
- **Le menu se ferme** dès qu'on choisit une destination, en touchant le fond assombri, ou avec
  Échap ; le focus revient au bouton ☰.
- **Le bouton « Nouveau » flottant** n'apparaît que sur la liste (pas sur le mail, la rédaction ni
  les réglages) et reste au-dessus de la barre d'accueil de l'iPhone.
- **Rédaction et mail en plein écran**, la barre de réponse et le pied de la rédaction restant
  visibles au-dessus du clavier virtuel.
- **Pas de « tirer pour actualiser »** : les nouveaux mails arrivent seuls (temps réel du chantier
  Gmail).
- **Tailles au doigt** pilotées par le type de pointeur (variante `touch:` existante, 44 px), la
  disposition par la largeur : une fenêtre d'ordinateur rétrécie garde des tailles souris.
- Les raccourcis clavier affichés (`Kbd`) et les indications au survol sont masqués au doigt ;
  toute information qu'ils portent reste accessible autrement.
- **Le bouton « Nouveau mail » de la barre latérale disparaît du menu en mode téléphone** : le
  bouton flottant le remplace, deux boutons pour la même action seraient redondants.
- **La maquette est faite par l'architecte**, comme pour le redesign, à partir des références de
  style locales (`docs/redesign`, `docs/Design-Domuse`, lues dans le dossier principal : elles sont
  ignorées par Git). Elle couvre d'abord le cadre et les écrans de l'app (liste avec le menu
  ouvert et fermé, mail, rédaction, réglages, états chargement / vide / erreur), en clair et en
  sombre ; les écrans de connexion et de configuration suivent dans une seconde maquette, au moment
  de leur couche.
- **Ordre de fusion avec le chantier Gmail** : la branche se recale sur `main` à chaque fusion.
  Le menu téléphone réutilise le composant de barre latérale tel quel (il ne le réécrit pas), pour
  que la refonte de la barre latérale par le chantier Gmail se retrouve d'office dans le menu.

## Laissé au constructeur

- Le découpage en couches (maquette d'abord), dans le respect de « Façon de travailler ».
- Le composant de panneau latéral générique dans `packages/ui`, sur le mécanisme de la fenêtre de
  dialogue existante.
- Les zones de sécurité de l'écran (`viewport-fit=cover`, `env(safe-area-inset-*)`), le
  comportement du clavier virtuel, la couleur de la barre d'état en clair et en sombre.
- Le chargement à la demande du cadre téléphone et le respect du budget du bundle.
- Les tests (Vitest avec largeur simulée, Playwright en viewport téléphone) et un moyen de tester
  sur un vrai téléphone en développement (HTTPS obligatoire : `tailscale serve` devant le serveur
  de dev).
- L'audit de chaque écran existant à 360 px : connexion et configuration, liste, mail, rédaction,
  réglages, états chargement / vide / erreur.

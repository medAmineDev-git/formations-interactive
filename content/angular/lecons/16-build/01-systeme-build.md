---
id: systeme-build
chapitre: build-deploiement
ordre: 1
titre: "Le système de build"
termes:
  - terme: "@angular/build:application"
    definition: "Builder par défaut du CLI Angular pour `ng build` et `ng serve` (depuis Angular 17/18, inchangé en v21). Il s'appuie sur **esbuild** pour la compilation et l'empaquetage, et sur **Vite** pour le serveur de développement."
  - terme: esbuild
    definition: "Bundler et minifieur écrit en Go, très rapide. Angular l'utilise pour compiler le TypeScript, empaqueter les modules et minifier le résultat, aussi bien en développement qu'en production."
  - terme: Vite
    definition: "Serveur de développement utilisé par `ng serve`. Il sert les modules à la demande pendant le développement et s'appuie sur esbuild pour leur transformation, ce qui permet un démarrage et un rechargement à chaud rapides."
  - terme: "Empreinte de fichier (hash)"
    definition: "Suffixe calculé à partir du contenu d'un fichier et ajouté à son nom (`main-4F2K9X1A.js`). Un contenu identique produit toujours la même empreinte ; un contenu modifié en produit une autre — ce qui permet de mettre les fichiers en cache très longtemps côté navigateur sans jamais servir une version périmée."
  - terme: "Découpage en chunks (code splitting)"
    definition: "Division du JavaScript de l'application en plusieurs fichiers (chunks) chargés indépendamment, plutôt qu'un seul bundle monolithique. Déclenché par le chargement différé de routes (`loadComponent`, `loadChildren`) et par `@defer`."
  - terme: "Source maps"
    definition: "Fichiers `.map` associant chaque ligne du code compilé et minifié à son emplacement dans le code source original, pour permettre de déboguer (ou de lire une pile d'erreurs de production) avec les noms et la mise en forme d'origine plutôt qu'un code illisible."
  - terme: "Budgets (angular.json)"
    definition: "Seuils de taille, par type de sortie (`initial`, `bundle`, `anyComponentStyle`…), déclarés dans une configuration de build. Un dépassement du seuil `maximumWarning` produit un avertissement, un dépassement de `maximumError` fait échouer le build."
quiz:
  - question: "Dans le système de build par défaut d'Angular 21 (`@angular/build:application`), quel outil est responsable de quoi ?"
    choix:
      - "esbuild compile et empaquette (build et `ng serve`) ; Vite sert les modules à la demande pendant le développement"
      - "Vite compile et minifie en production ; esbuild ne sert qu'au serveur de développement"
      - "webpack reste l'outil de build par défaut en v21, esbuild n'étant utilisé que pour les tests"
      - "TypeScript compile seul, sans intervention d'esbuild ni de Vite"
    reponse: 0
    explication: "esbuild assure la compilation et l'empaquetage (aussi bien pour `ng build` que pour la transformation des modules servis par `ng serve`) ; Vite est la couche serveur de développement qui sert ces modules à la demande et gère le rechargement à chaud. webpack n'est plus le builder par défaut depuis Angular 17."
  - question: "Ce fragment de configuration provoque quoi lors de `ng build --configuration production` ?"
    code: |
      "budgets": [
        { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" }
      ]
    choix:
      - "Rien tant que le bundle initial ne dépasse pas 500kb ; entre 500kb et 1mb un avertissement s'affiche mais le build réussit ; au-delà de 1mb le build échoue"
      - "Le build échoue systématiquement si le bundle dépasse 500kb, sans distinction entre avertissement et erreur"
      - "Angular réduit automatiquement la taille du bundle pour respecter le budget, sans intervention du développeur"
      - "Le budget ne s'applique qu'à `ng serve`, jamais à `ng build`"
    reponse: 0
    explication: "`maximumWarning` et `maximumError` sont deux seuils distincts pour le même budget : entre les deux, seul un avertissement apparaît dans la sortie du build ; au-delà de `maximumError`, le build échoue. Un budget ne réduit rien automatiquement, il se contente de signaler un dépassement."
  - question: "Que produit `ng build` pour une application Angular 21 configurée en SSR, dans le dossier de sortie ?"
    choix:
      - "Un seul fichier `index.html` statique, identique à une application sans SSR"
      - "Un sous-dossier `browser/` (les bundles client, avec empreintes dans les noms de fichiers) et un sous-dossier `server/` (le code exécuté par le serveur Node lors du rendu)"
      - "Uniquement le code serveur, le client étant généré séparément par `ng serve`"
      - "Un dossier par navigateur cible (Chrome, Firefox, Safari)"
    reponse: 1
    explication: "En SSR, `ng build` produit à la fois les bundles destinés au navigateur (sous `browser/`, avec empreinte dans les noms pour le cache) et le code serveur (sous `server/`) qui sera exécuté par le processus Node chargé du rendu. Une application sans SSR ne produit que la partie client."
---

## Essentiel

Le builder par défaut d'Angular 21 est **`@angular/build:application`** : **esbuild** compile le TypeScript et empaquette les modules (en développement comme en production), et **Vite** sert de serveur de développement pour `ng serve`, en s'appuyant lui-même sur esbuild pour transformer les modules à la demande. Ce duo remplace l'ancien pipeline basé sur webpack depuis Angular 17/18 ; rien ne change ici en v21.

`ng build` produit, dans le dossier de sortie (`dist/<nom-du-projet>/` par défaut, configurable via `outputPath`) :

- les fichiers du navigateur (sous `browser/` en SSR), avec une **empreinte** dans chaque nom de fichier (`main-4F2K9X1A.js`) pour un cache long sans risque de version périmée ;
- un **découpage en chunks** : chaque route en `loadComponent`/`loadChildren` et chaque bloc `@defer` produit un fichier séparé, chargé seulement quand nécessaire ;
- en SSR, un dossier `server/` distinct contenant le code exécuté par le processus Node.

En production (`ng build` utilise la configuration `production` par défaut), Angular compile en **AOT** (Ahead-of-Time, toujours actif sauf `--aot false`) et applique l'**optimisation** : minification et élagage du code mort (tree-shaking). Les **source maps** sont désactivées par défaut en production (`sourceMap: false`) et activables explicitement (`--source-map`) pour un outil de suivi d'erreurs.

```json
"configurations": {
  "production": {
    "budgets": [
      { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" }
    ],
    "outputHashing": "all"
  }
}
```

`ng build --watch` reconstruit à chaque changement de fichier sans lancer de serveur (utile en CI pour un pipeline qui surveille la sortie). Les options `--configuration`, `--base-href` et `--stats-json` (voir chapitre suivant et la leçon *Mesurer avant d'optimiser*) complètent la commande.

## Détail

### Comment ça marche

`ng build` et `ng serve` partagent le même builder, mais avec des objectifs différents. Pour `ng build`, esbuild transforme chaque fichier source, résout les imports, élimine le code mort atteignable uniquement par des chemins jamais empruntés (tree-shaking), puis regroupe le résultat en chunks empreints. Pour `ng serve`, Vite ne recompile pas tout le graphe de modules à chaque sauvegarde : il sert chaque module individuellement au navigateur (nativement via les modules ES) et ne retransforme, via esbuild, que le fichier modifié — d'où un rechargement quasi instantané même sur un projet volumineux.

### Exemple 1 — Structure de sortie d'un build SSR

```text
dist/boutique-admin/
├── browser/
│   ├── index.html
│   ├── main-4F2K9X1A.js
│   ├── polyfills-7C1Q2Z0B.js
│   ├── styles-9J3M5T8K.css
│   └── chunk-ADMIN-ROUTES-K2L8P1QX.js
└── server/
    └── server.mjs
```

Le dossier `browser/` est celui à publier sur un hébergeur de fichiers statiques ou un CDN ; `server/server.mjs` est le point d'entrée du processus Node à exécuter pour le rendu côté serveur (voir la leçon *Déployer et automatiser*).

### Exemple 2 — Budgets par type de sortie

```json
"budgets": [
  { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" },
  { "type": "anyComponentStyle", "maximumWarning": "4kb", "maximumError": "8kb" },
  { "type": "bundle", "name": "admin", "maximumWarning": "300kb", "maximumError": "500kb" }
]
```

`initial` couvre le JavaScript chargé au premier affichage ; `anyComponentStyle` surveille chaque feuille de style de composant individuellement (utile pour repérer un CSS de composant qui gonfle anormalement) ; `bundle` cible un chunk nommé précis, par exemple une route lourde chargée en différé.

### Exemple 3 — Remplacer un polyfill

```json
"polyfills": ["zone.js"]
```

Le tableau `polyfills` d'une cible de build liste les fichiers ou modules à injecter avant le code de l'application. Une application zoneless (défaut en Angular 21) n'a plus besoin de `zone.js` : le retirer de ce tableau (et des dépendances) réduit le bundle initial. À l'inverse, un polyfill maison (par exemple pour une API non supportée par les navigateurs ciblés) se déclare en y ajoutant le chemin du fichier, comme `"polyfills": ["src/polyfills-legacy.ts"]`.

### Exemple 4 — Options utiles de `ng build`

```bash
# Build avec une configuration nommée (ex. staging), utile en CI
ng build --configuration staging

# Application servie depuis un sous-chemin (voir la leçon suivante)
ng build --base-href /boutique-admin/

# Génère un stats.json exploitable par un outil d'analyse de bundle
ng build --stats-json

# Reconstruit à chaque changement de fichier, sans serveur
ng build --watch
```

`--configuration` accepte une liste séparée par des virgules (`--configuration staging,fr`) pour combiner plusieurs configurations déclarées dans `angular.json`.

### esbuild contre Vite : qui fait quoi

| | esbuild | Vite |
|---|---|---|
| Rôle | Compilation, empaquetage, minification | Serveur de développement (`ng serve`) |
| Utilisé pour | `ng build` (dev et prod) | Transformation à la demande des modules servis |
| Sortie | Fichiers empreints dans `dist/` | Rien n'est écrit sur disque en développement |

### Pièges courants

> **Confondre `--base-href` et `--deploy-url`.** `--base-href` définit la balise `<base>` de `index.html`, lue à l'exécution par le routeur. `--deploy-url` fige à la compilation le chemin de base des ressources statiques. Les deux se recouvrent partiellement ; la documentation recommande de préférer `--base-href`, modifiable sans reconstruire.

> **Ignorer un avertissement de budget parce que le build réussit encore.** Un `maximumWarning` dépassé n'arrête rien, mais signale une dérive réelle. Le laisser filer jusqu'au `maximumError` transforme un simple avertissement en build cassé, souvent au pire moment (une mise en production urgente).

> **Activer les source maps en production sans réfléchir à leur exposition.** `--source-map` reconstruit le lien vers le code source d'origine — pratique pour un outil de suivi d'erreurs, mais si les fichiers `.map` sont publiés publiquement sur le même hébergeur, n'importe qui peut reconstituer le code source non minifié. La pratique courante est de générer les source maps sans les publier publiquement (upload direct vers l'outil de suivi d'erreurs).

### À retenir

- `@angular/build:application` : esbuild pour la compilation/empaquetage, Vite pour le serveur de développement — inchangé en v21.
- `ng build` produit un dossier de sortie avec fichiers empreints, chunks séparés (routes différées, `@defer`), et un dossier `server/` distinct en SSR.
- AOT est actif par défaut ; l'optimisation (minification, élagage de code mort) et le hashing des noms de fichiers sont appliqués par la configuration `production`.
- Les **budgets** (`initial`, `bundle`, `anyComponentStyle`…) font échouer ou avertir le build au-delà d'un seuil défini par type de sortie.
- `--configuration`, `--base-href`, `--stats-json` et `--watch` couvrent les besoins courants sans modifier `angular.json`.

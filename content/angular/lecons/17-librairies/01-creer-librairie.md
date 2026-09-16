---
id: creer-librairie
chapitre: librairies
ordre: 1
titre: "Créer une librairie Angular"
termes:
  - terme: "ng generate library"
    definition: "Commande CLI (`ng g library <nom>`) qui crée un nouveau projet de type librairie dans un workspace Angular existant, sous `projects/<nom>` par défaut, avec sa propre configuration dans `angular.json`."
  - terme: "public-api.ts"
    definition: "Fichier d'entrée de la librairie. Tout ce qui y est exporté (`export * from './...'`) devient accessible aux applications qui importent la librairie ; tout le reste reste interne."
  - terme: API publique
    definition: "Surface exposée par une librairie à ses consommateurs : composants, directives, pipes, services, types, jetons d'injection destinés à être utilisés en dehors de la librairie. Distincte de l'implémentation interne, qui peut changer sans casser les consommateurs."
  - terme: "ng-package.json"
    definition: "Fichier de configuration lu par ng-packagr : destination de sortie (`dest`), fichier d'entrée de l'API publique (`lib.entryFile`), fichiers à copier tels quels (`assets`), entre autres."
  - terme: ng-packagr
    definition: "Outil de build qui compile une librairie Angular au format de package Angular (APF), utilisé par le builder `@angular/build:ng-packagr` — distinct du builder d'application (`@angular/build:application`, esbuild/Vite) utilisé pour `ng serve`/`ng build` d'une application."
  - terme: peerDependencies
    definition: "Section du `package.json` publié qui déclare une dépendance que le projet consommateur doit fournir lui-même (ex. `@angular/core`), plutôt qu'une dépendance embarquée et installée automatiquement par npm."
  - terme: Point d'entrée secondaire
    definition: "Sous-partie de la librairie importable via un chemin distinct (ex. `acme-ui/testing`), avec son propre `public-api.ts` et son propre `ng-package.json` minimal, dans un sous-dossier de la librairie."
  - terme: Compilation partielle (partial Ivy)
    definition: "Mode de compilation (`\"compilationMode\": \"partial\"`) qui produit un code intermédiaire indépendant de la version exacte d'Angular utilisée à la compilation, recompilé par l'application consommatrice. C'est le mode recommandé pour publier une librairie, par opposition à la compilation complète (full Ivy), liée à une version précise."
quiz:
  - question: "Dans `projects/acme-ui/src/public-api.ts`, une équipe exporte par erreur un service interne non documenté : `export * from './boutons/bouton-charge.service';`. Quelle conséquence directe cela a-t-il pour la librairie ?"
    code: |
      // public-api.ts
      export * from './boutons/bouton-charge';
      export * from './boutons/bouton-charge.service'; // service interne, non documenté
    choix:
      - "Aucune : ng-packagr ignore automatiquement les services qui ne sont pas des composants"
      - "Ce service devient partie de l'API publique de la librairie : des applications consommatrices peuvent commencer à l'importer, et le retirer plus tard devient une rupture (breaking change)"
      - "Le build échoue, car un seul export par fichier est autorisé dans public-api.ts"
      - "Le service reste privé tant qu'il n'est pas déclaré dans ng-package.json"
    reponse: 1
    explication: "public-api.ts est la seule frontière qui distingue l'API publique de l'implémentation interne : tout ce qui y est exporté est accessible aux consommateurs, qu'il soit destiné à l'être ou non. Une fois qu'un élément est importable depuis l'extérieur, le supprimer ou le modifier de façon incompatible devient une rupture pour tous ceux qui l'ont utilisé, même si l'intention initiale était de le garder interne."
  - question: "Le `package.json` de la librairie `acme-ui`, une fois construite, déclare `\"@angular/core\": \"^21.0.0\"` sous `peerDependencies` plutôt que sous `dependencies`. Pourquoi ce choix pour une librairie de composants Angular ?"
    choix:
      - "peerDependencies accélère le téléchargement du package sur un registre privé d'entreprise"
      - "Une dépendance normale (dependencies) serait installée par npm dans le sous-dossier node_modules de la librairie, ce qui ferait coexister deux instances d'Angular dans l'application consommatrice (injection de dépendances cassée, erreurs d'instance dupliquée)"
      - "peerDependencies est obligatoire dès qu'un package contient au moins un composant standalone"
      - "C'est uniquement une convention de style sans effet sur l'installation réelle des paquets"
    reponse: 1
    explication: "Angular doit exister en un seul exemplaire dans l'application finale : c'est elle qui fournit @angular/core, @angular/common, etc. Si la librairie les déclarait en dependencies, npm risquerait d'en installer une copie propre à la librairie, créant potentiellement deux instances d'Angular actives en parallèle — source classique d'erreurs d'injection ou de composants qui ne se mettent pas à jour correctement."
  - question: "Une équipe veut permettre `import { creerHarnaisBouton } from 'acme-ui/testing';` en plus de `import { Bouton } from 'acme-ui';`. Que faut-il faire, en plus d'écrire le code dans un sous-dossier `testing/` de la librairie ?"
    choix:
      - "Rien : ng-packagr détecte automatiquement tout sous-dossier nommé testing et l'expose comme point d'entrée"
      - "Ajouter dans testing/ un public-api.ts propre à ce sous-dossier et un ng-package.json (qui peut être minimal), pour qu'il soit reconnu comme point d'entrée secondaire distinct du point d'entrée principal"
      - "Créer un projet Angular CLI séparé nommé acme-ui-testing dans le workspace"
      - "Renommer le fichier public-api.ts principal en public-api.testing.ts"
    reponse: 1
    explication: "Un point d'entrée secondaire est une structure explicite : son propre public-api.ts définit ce qu'il exporte, et un ng-package.json (même quasiment vide) marque le sous-dossier comme point d'entrée à part entière pour ng-packagr. Sans cette structure, le code du sous-dossier reste de l'implémentation interne, non importable directement."
---

## Essentiel

Une librairie Angular se crée dans un **workspace** existant (créé avec `ng new mon-workspace --no-create-application` s'il n'y a pas déjà d'application), avec :

```bash
ng generate library acme-ui
```

Le CLI ajoute un projet `projects/acme-ui` avec une configuration dédiée dans `angular.json` — un builder différent de celui d'une application : `@angular/build:ng-packagr` au lieu de `@angular/build:application`. C'est **ng-packagr** qui compile la librairie, pas esbuild/Vite directement.

Deux fichiers structurent tout : `src/public-api.ts`, qui définit l'**API publique** (tout ce qu'il exporte devient accessible aux consommateurs, le reste reste interne), et `ng-package.json`, qui configure ng-packagr (dossier de sortie, fichier d'entrée, fichiers à copier tels quels).

```json
// projects/acme-ui/ng-package.json
{
  "$schema": "../../node_modules/ng-packagr/ng-package.schema.json",
  "dest": "../../dist/acme-ui",
  "lib": {
    "entryFile": "src/public-api.ts"
  }
}
```

Dans le `package.json` de la librairie, `@angular/core` et `@angular/common` doivent figurer en **`peerDependencies`**, jamais en `dependencies` : c'est l'application consommatrice qui fournit Angular, pas la librairie. On construit avec `ng build acme-ui` ; le résultat (dans `dist/acme-ui`) est ce qui sera publié ou consommé.

## Détail

### Comment ça marche

Un workspace Angular multi-projets contient plusieurs entrées dans `angular.json`, chacune avec son `projectType` (`application` ou `library`). Une librairie n'a pas de `main.ts` ni de serveur de développement : elle se **construit** en package npm, elle ne se **lance** pas. Pendant le développement, l'application du même workspace peut l'importer directement via le chemin TypeScript ajouté automatiquement par `ng generate library` dans le `tsconfig.json` racine (mapping vers `dist/acme-ui` ou vers les sources selon la configuration), ce qui permet de tester la librairie sans la publier à chaque changement.

### Exemple 1 — Arborescence générée

```
projects/acme-ui/
  src/
    public-api.ts
    boutons/
      bouton-charge.ts
      bouton-charge.spec.ts
  ng-package.json
  package.json
  tsconfig.lib.json
```

```ts
// projects/acme-ui/src/public-api.ts
export * from './boutons/bouton-charge';
export * from './cartes/carte';
export * from './tokens/theme.token';
```

Seuls les trois éléments listés ici sont accessibles depuis l'extérieur du package. Un composant ou un utilitaire non exporté ici, même correctement écrit, reste un détail d'implémentation que la librairie peut modifier librement.

### Exemple 2 — `package.json` d'une librairie de composants d'entreprise

```json
{
  "name": "acme-ui",
  "version": "1.0.0",
  "peerDependencies": {
    "@angular/common": "^21.0.0",
    "@angular/core": "^21.0.0"
  },
  "dependencies": {
    "tslib": "^2.3.0"
  }
}
```

`tslib` (utilitaires générés par le compilateur TypeScript) est une dépendance normale : elle ne pose pas le problème de double instance que poserait Angular lui-même. Avant publication, ce nom peut être ajusté en `@acme-corp/ui` (voir la leçon suivante sur la publication avec une portée d'entreprise).

### Exemple 3 — Point d'entrée secondaire

```
projects/acme-ui/
  src/public-api.ts
  ng-package.json
  testing/
    src/public-api.ts
    ng-package.json        // peut être quasiment vide : {}
```

```ts
// projects/acme-ui/testing/src/public-api.ts
export * from './harnais-bouton';
```

Une fois la librairie construite, deux imports distincts deviennent possibles :

```ts
import { Bouton } from 'acme-ui';
import { creerHarnaisBouton } from 'acme-ui/testing';
```

Ce découpage est utile pour séparer, par exemple, les composants eux-mêmes d'utilitaires de test qu'une application n'a besoin d'importer que dans ses fichiers `.spec.ts`, sans alourdir le bundle de production.

### Exemple 4 — Styles et ressources

Les styles d'un composant de librairie se déclarent comme dans une application (`styleUrl` sur le `@Component`) et sont embarqués dans le composant à la compilation. Pour des fichiers qui doivent être copiés tels quels dans le package publié (polices, fichiers `.scss` de thème destinés à être importés par le consommateur, `CHANGELOG.md`), `ng-package.json` expose la clé `assets` :

```json
{
  "dest": "../../dist/acme-ui",
  "lib": { "entryFile": "src/public-api.ts" },
  "assets": [
    { "input": "src/theme", "glob": "**/*.scss", "output": "theme" }
  ]
}
```

### Pièges courants

> **Exporter trop largement depuis `public-api.ts`.** Un `export * from './boutons';` sur un dossier entier, plutôt que des exports ciblés, expose souvent des classes internes par accident (services d'implémentation, types de configuration non stabilisés). Exporter explicitement ce qui est destiné aux consommateurs limite le risque de figer, par erreur, une API interne comme si elle était publique.

> **Déclarer Angular en `dependencies` plutôt qu'en `peerDependencies`.** Le symptôme est souvent indirect : erreurs d'injection de dépendances, composants qui ne réagissent pas aux changements, messages évoquant une instance différente d'un service censé être un singleton. La cause est fréquemment une deuxième copie d'Angular installée par la librairie elle-même.

> **Confondre le builder d'application et ng-packagr.** Les options de `angular.json` propres à une application (budgets de bundle, `outputPath` d'une SPA, configuration du serveur de développement) ne s'appliquent pas à une librairie : sa configuration de build passe par `ng-package.json`, pas par les mêmes clés que celles d'une application.

### À retenir

- `ng generate library` crée un projet de type librairie dans un workspace, avec le builder `@angular/build:ng-packagr` distinct du builder d'application.
- `public-api.ts` est la seule frontière entre API publique et implémentation interne : n'y exporter que ce qui est destiné aux consommateurs.
- `@angular/core` et les autres packages Angular vont en `peerDependencies`, jamais en `dependencies`, pour éviter une double instance d'Angular chez le consommateur.
- `ng-package.json` configure ng-packagr (destination, fichier d'entrée, assets) ; ce n'est pas la même configuration qu'une application.
- Un point d'entrée secondaire (`acme-ui/testing`) est un sous-dossier avec son propre `public-api.ts` et son propre `ng-package.json`, pas une détection automatique.

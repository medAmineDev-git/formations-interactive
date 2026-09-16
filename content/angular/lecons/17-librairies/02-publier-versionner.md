---
id: publier-versionner
chapitre: librairies
ordre: 2
titre: "Publier et faire évoluer une librairie"
termes:
  - terme: Versionnement sémantique (SemVer)
    definition: "Convention de numérotation `MAJEUR.MINEUR.CORRECTIF` : un correctif ne change pas l'API, un mineur l'étend sans casser l'existant, un majeur peut introduire des ruptures. Appliquée à une librairie de composants, la question centrale est : « qu'est-ce qui compte comme une rupture d'API pour un composant ? »"
  - terme: Rupture d'API (breaking change)
    definition: "Pour un composant, tout changement qui casse la compilation ou le comportement d'un consommateur qui utilisait l'API publique correctement : renommer ou retirer une entrée (`input()`), changer le type d'une sortie, modifier un sélecteur, changer le comportement par défaut d'une option existante."
  - terme: "npm pack"
    definition: "Commande qui construit un tarball `.tgz` du package tel qu'il serait publié, sans le publier sur le registre. Permet d'inspecter son contenu exact ou de l'installer localement dans une application de test avant publication réelle."
  - terme: Registre privé / portée d'entreprise
    definition: "Un `package.json` publié avec un nom `@acme-corp/ui` (portée npm) peut être publié sur le registre public npm sous cette portée, ou sur un registre privé d'entreprise (configuré via `.npmrc` et le champ `publishConfig`), sans changer la façon dont les consommateurs internes l'installent."
  - terme: Journal des modifications (changelog)
    definition: "Fichier `CHANGELOG.md` qui documente, version par version, ce qui a été ajouté, corrigé ou cassé. Pour une librairie de composants consommée par plusieurs équipes, c'est la référence pour savoir si une mise à jour nécessite une adaptation du code consommateur."
  - terme: Dépréciation
    definition: "Signal explicite (commentaire JSDoc `@deprecated`, avec la raison et l'alternative) qu'une partie de l'API publique sera retirée dans une future version majeure, sans encore casser les consommateurs actuels. Donne le temps de migrer avant la rupture réelle."
  - terme: "Schematic ng-add"
    definition: "Schematic exécuté par `ng add nom-librairie`, déclaré dans le package.json de la librairie (`\"ng-add\": {...}`) et dans sa collection de schematics. Automatise l'installation initiale : ajout de providers dans la configuration de l'application, ajout de styles globaux, etc."
  - terme: "Migration ng update"
    definition: "Schematic déclaré via le champ `ng-update` du package.json, exécuté par `ng update nom-librairie`, qui adapte automatiquement le code d'une application lors du passage à une nouvelle version majeure de la librairie (ex. renommage automatique d'un input)."
quiz:
  - question: "Une librairie de composants passe d'un `input()` nommé `libelle` à `texte` sur son composant `Bouton`, sans conserver l'ancien nom ni fournir de migration. La classe interne du composant et son comportement visuel restent identiques. À quel type de changement SemVer cela correspond-il ?"
    code: |
      // Avant (v2.x)
      export class Bouton {
        libelle = input.required<string>();
      }

      // Après
      export class Bouton {
        texte = input.required<string>();
      }
    choix:
      - "Un correctif (PATCH), car le comportement du composant n'a pas changé"
      - "Un changement mineur (MINOR), car aucune classe n'a été supprimée"
      - "Un changement majeur (MAJOR), car tout consommateur qui utilisait <app-bouton [libelle]=\"...\"> voit sa compilation ou son binding cassé, indépendamment du comportement interne"
      - "Aucune règle SemVer ne s'applique aux noms d'input(), seulement aux noms de classes exportées"
    reponse: 2
    explication: "Le comportement interne n'est pas ce qui compte pour SemVer : c'est l'API publique telle que le consommateur l'utilise. Renommer un input() change la façon dont le composant s'utilise dans un template — tout code consommateur qui liait [libelle] cesse de fonctionner. C'est une rupture, donc un changement majeur, même si visuellement rien ne change une fois le template corrigé."
  - question: "Avant de lancer `npm publish` pour de vrai, une équipe exécute `npm pack` puis installe le tarball obtenu (`acme-ui-1.2.0.tgz`) dans une application de test. Quel est l'intérêt principal de cette étape ?"
    choix:
      - "npm pack optimise automatiquement la taille du bundle, ce que npm publish seul ne fait pas"
      - "Le tarball contient exactement ce qui serait publié (mêmes fichiers, même package.json) : l'installer localement permet de détecter un import cassé, une peerDependency manquante ou un point d'entrée mal résolu avant une publication réelle, difficile à corriger après coup"
      - "npm pack est obligatoire : npm publish refuse un package qui n'a pas été préalablement empaqueté avec npm pack"
      - "Cela remplace le besoin d'exécuter les tests unitaires de la librairie avant publication"
    reponse: 1
    explication: "Une fois publiée, une version npm ne peut pas être republiée à l'identique en cas d'erreur (le même numéro de version est définitivement pris). Tester le tarball réel dans une application, plutôt que de se fier au seul résultat de ng build, permet de repérer des problèmes de packaging (fichier manquant, chemin d'export incorrect) avant qu'ils deviennent visibles chez un consommateur."
  - question: "Une équipe fournit un schematic ng-update avec sa librairie `acme-ui`, déclenché par `ng update acme-ui`. Que peut concrètement faire ce schematic lors du passage à une version majeure qui renomme un input ?"
    choix:
      - "Modifier automatiquement le code des applications consommatrices, par exemple réécrire [libelle] en [texte] dans les templates concernés, en plus de mettre à jour package.json"
      - "Se limiter à afficher un message d'avertissement dans la console, sans jamais modifier de fichier du consommateur"
      - "Republier automatiquement l'ancienne version de la librairie en parallèle de la nouvelle"
      - "Forcer la mise à jour de tous les packages npm du projet, pas seulement acme-ui"
    reponse: 0
    explication: "Une migration ng update est un schematic complet : elle peut analyser et réécrire les fichiers du projet consommateur (templates, TypeScript), pas seulement afficher un message. C'est ce qui distingue une migration outillée d'une simple entrée de changelog à lire manuellement — et ce qui rend une rupture d'API plus acceptable pour les équipes consommatrices."
---

## Essentiel

Une librairie se publie avec `ng build acme-ui` (toujours en configuration de production pour la distribution), puis `npm publish` depuis le dossier de sortie (`dist/acme-ui`), où se trouve le `package.json` réellement publié — distinct du `package.json` racine du workspace.

```bash
ng build acme-ui
cd dist/acme-ui
npm publish
# ou, sur un registre privé d'entreprise déjà configuré dans .npmrc :
npm publish --registry https://npm.acme-corp.interne
```

Le nom du package (`@acme-corp/ui`) et sa portée déterminent où il atterrit : portée publique npm, ou portée privée d'entreprise. Ce qui compte le plus pour les consommateurs, c'est la discipline de **versionnement sémantique** : une rupture d'API pour un composant n'est pas seulement « le composant ne marche plus », c'est tout changement qui casse un usage correct existant — un `input()` renommé, un sélecteur modifié, un type de sortie changé. Avant de retirer quelque chose, on le **déprécie** (`@deprecated` avec l'alternative), pour laisser le temps aux consommateurs de migrer. Avant de publier pour de vrai, `npm pack` permet de vérifier le contenu exact du tarball et de le tester dans une application locale.

## Détail

### Pourquoi c'est utile

Une librairie de composants interne, consommée par plusieurs équipes d'une même entreprise, a un coût de rupture multiplié par le nombre d'applications consommatrices. Une discipline claire — SemVer respecté, dépréciations avant suppression, migrations outillées — transforme une mise à jour majeure d'un blocage coordonné entre équipes en une tâche que chaque équipe absorbe à son rythme.

### Exemple 1 — `package.json` publié avec portée d'entreprise

```json
{
  "name": "@acme-corp/ui",
  "version": "3.4.0",
  "publishConfig": {
    "access": "restricted",
    "registry": "https://npm.acme-corp.interne"
  },
  "peerDependencies": {
    "@angular/common": "^21.0.0",
    "@angular/core": "^21.0.0"
  }
}
```

`publishConfig` fixe le registre et la visibilité utilisés par `npm publish`, sans que chaque développeur ait à répéter `--registry` manuellement.

### Exemple 2 — Dépréciation progressive avant suppression

```ts
export class Bouton {
  /**
   * @deprecated Utiliser `texte` à la place. Sera retiré en v4.0.0.
   */
  libelle = input<string>();

  texte = input<string>('');
}
```

En v3.x, les deux entrées coexistent : `libelle` continue de fonctionner (avec un avertissement visible dans l'éditeur via `@deprecated`), pendant que `texte` devient le chemin recommandé. La suppression effective de `libelle` n'intervient qu'en v4.0.0, une version majeure clairement annoncée dans le changelog.

### Exemple 3 — Journal des modifications orienté consommateur

```md
## 4.0.0

### Rupture
- `Bouton` : l'input `libelle` (déprécié depuis 3.2.0) est retiré. Utiliser `texte`.
  Migration automatique disponible via `ng update @acme-corp/ui`.

### Ajouts
- Nouveau composant `Badge` pour les indicateurs de statut.

### Corrections
- `Carte` : l'ombre portée ne débordait plus correctement en mode sombre.
```

Séparer explicitement les ruptures des ajouts et corrections permet à une équipe consommatrice de juger en quelques secondes si une mise à jour est risquée ou non, sans lire tout le détail.

### Exemple 4 — Déclarer un schematic `ng-add` dans le package publié

```json
{
  "name": "@acme-corp/ui",
  "schematics": "./schematics/collection.json",
  "ng-add": {
    "save": "dependencies"
  }
}
```

```json
// schematics/collection.json
{
  "schematics": {
    "ng-add": {
      "description": "Installe et configure @acme-corp/ui dans le projet.",
      "factory": "./ng-add/index#ngAdd"
    },
    "ng-update": {
      "version": "4.0.0",
      "factory": "./ng-update/index#migrateVers4"
    }
  }
}
```

`ng add @acme-corp/ui` exécute la fabrique déclarée sous `ng-add` (par exemple : ajouter un provider de thème dans `app.config.ts`). `ng update @acme-corp/ui` exécute la migration associée à la version cible, qui peut réécrire automatiquement le code consommateur concerné par une rupture.

### Compatibilité avec les versions d'Angular

| Approche de compilation | Comportement |
|---|---|
| Compilation partielle (`"compilationMode": "partial"`) | Format intermédiaire recompilé par l'application consommatrice avec sa propre version d'Angular — stable entre versions mineures/majeures d'Angular, c'est le mode recommandé pour une librairie publiée. |
| Compilation complète (full Ivy) | Code figé pour une version précise d'Angular — la librairie et l'application doivent utiliser exactement la même version, ce qui la rend impropre à une distribution publique ou inter-équipes. |

Les `peerDependencies` de la librairie (`"@angular/core": "^21.0.0"`) définissent la plage de versions d'Angular supportée côté consommateur ; un intervalle trop étroit force des mises à jour synchronisées inutiles, un intervalle trop large risque de couvrir des versions jamais réellement testées.

### Pièges courants

> **Considérer qu'un changement « purement interne » ne casse jamais rien.** Renommer une classe exportée, changer la structure du DOM généré par un composant (si des consommateurs ciblaient ce DOM en CSS global ou via `::ng-deep`), ou changer un comportement par défaut non documenté peuvent tous casser des consommateurs qui dépendaient, à raison ou à tort, du comportement précédent. En cas de doute sur l'impact réel, traiter le changement comme une rupture plutôt que l'inverse.

> **Retirer une API dépréciée trop vite.** Déprécier et supprimer dans la même version majeure suivante, sans laisser au moins une version pour que les équipes consommatrices migrent à leur rythme, revient à ne pas déprécier du tout. Le changelog doit indiquer depuis quand une API est dépréciée, pas seulement qu'elle l'est.

> **Publier depuis la racine du workspace plutôt que depuis `dist/`.** Le `package.json` du workspace n'est pas celui qui doit être publié : il contient des scripts et dépendances de développement propres au monorepo. Publier accidentellement depuis la racine expose un package incorrect (mauvais fichiers, mauvaises dépendances).

### À retenir

- SemVer s'applique à l'API publique telle qu'un consommateur l'utilise, pas au comportement interne : un input renommé est une rupture, même sans changement visuel.
- `npm pack` permet d'inspecter et de tester un tarball avant `npm publish`, pour détecter les erreurs de contenu ou de configuration avant qu'elles soient publiques.
- Déprécier avant de supprimer donne aux consommateurs le temps de migrer ; le changelog doit distinguer clairement les ruptures des ajouts.
- `ng-add` (installation) et `ng-update` (migration) sont des schematics déclarés dans le package.json de la librairie, capables de modifier automatiquement le code consommateur.
- La compilation partielle (`compilationMode: partial`) est le mode recommandé pour publier, car elle reste compatible avec plusieurs versions d'Angular côté consommateur.

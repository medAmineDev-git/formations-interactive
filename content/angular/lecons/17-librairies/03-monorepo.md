---
id: monorepo
chapitre: librairies
ordre: 3
titre: "Organiser un monorepo"
termes:
  - terme: Workspace multi-projets
    definition: "Un même workspace Angular (`angular.json`) peut contenir plusieurs projets — applications et librairies — chacun avec sa propre configuration de build, de test et de service. L'application créée par `ng new` vit à la racine ; les projets ajoutés ensuite (`ng generate application`, `ng generate library`) vivent par défaut sous `projects/`."
  - terme: Chemin TypeScript (path mapping)
    definition: "Entrée dans `compilerOptions.paths` du `tsconfig.json` racine qui fait correspondre le nom d'une librairie du workspace (ex. `acme-ui`) à l'emplacement de ses sources ou de son build, pour que les applications du même workspace puissent l'importer sans passer par npm."
  - terme: Cycle de dépendances entre projets
    definition: "Situation où le projet A dépend du projet B qui dépend, directement ou indirectement, du projet A. Casse la possibilité de construire ou tester les projets indépendamment, et complique la compréhension du graphe de dépendances."
  - terme: Monorepo
    definition: "Un seul dépôt de code source hébergeant plusieurs projets (plusieurs applications, plusieurs librairies) versionnés ensemble, par opposition à un dépôt séparé par projet (polyrepo / multi-dépôts)."
  - terme: Nx
    definition: "Outil de build tiers, très utilisé pour les monorepos Angular, qui s'ajoute au-dessus d'un workspace pour apporter un graphe de dépendances entre projets, un cache de build/test, et des générateurs de code. Angular CLI seul ne fournit pas ces capacités."
  - terme: Graphe de dépendances (project graph)
    definition: "Représentation des dépendances réelles entre projets d'un monorepo (quel projet importe quel autre), utilisée pour déterminer quels projets sont affectés par un changement et dans quel ordre les construire."
  - terme: Cache de build/test
    definition: "Mécanisme qui réutilise le résultat d'un build ou d'une exécution de tests déjà effectuée pour un ensemble de fichiers inchangé, plutôt que de le refaire depuis zéro. Angular CLI seul ne propose pas de cache de ce type entre exécutions pour un workspace multi-projets."
quiz:
  - question: "Dans un workspace à trois projets — une application `boutique`, une librairie `acme-ui` (composants) et une librairie `acme-donnees` (accès API) — `acme-donnees` importe un type d'affichage exporté par `acme-ui`, et `acme-ui` importe une fonction utilitaire de formatage exportée par `acme-donnees`. Quel est le problème ?"
    code: |
      // projects/acme-donnees/src/public-api.ts
      export * from './client-api';
      import { EtiquetteStatut } from 'acme-ui'; // utilisé dans client-api.ts

      // projects/acme-ui/src/public-api.ts
      export * from './boutons/bouton-charge';
      import { formaterMontant } from 'acme-donnees'; // utilisé dans un composant d'affichage
    choix:
      - "Aucun problème : dans un même workspace, les projets peuvent librement s'importer les uns les autres dans les deux sens"
      - "Un cycle de dépendances entre acme-ui et acme-donnees : chacun dépend de l'autre, ce qui empêche de les construire ou de raisonner sur eux indépendamment, et complique tout outil basé sur le graphe de dépendances"
      - "TypeScript refuse de compiler dès qu'un chemin d'import commence par le nom d'un autre projet du même workspace"
      - "Le problème ne concerne que les applications, jamais deux librairies entre elles"
    reponse: 1
    explication: "Un import dans chaque sens entre acme-ui et acme-donnees crée un cycle : impossible de dire lequel des deux doit être construit en premier, et un outil comme Nx ne peut plus déterminer un ordre de build cohérent. La solution habituelle est de faire remonter l'élément partagé (ici, soit le type EtiquetteStatut, soit formaterMontant) dans une troisième librairie dont dépendent les deux autres, sans dépendance retour."
  - question: "Une équipe migre son workspace Angular CLI natif vers Nx pour son monorepo à cinq applications et huit librairies internes. Quel bénéfice concret Nx apporte-t-il que le CLI natif ne fournit pas nativement, en plus des générateurs de code ?"
    choix:
      - "Nx est la seule façon de faire cohabiter plusieurs projets Angular dans un même dépôt ; le CLI natif ne le permet pas du tout"
      - "Un graphe de dépendances entre projets et un cache qui évite de reconstruire ou retester un projet dont les fichiers n'ont pas changé, ce qui accélère fortement l'intégration continue sur un monorepo de cette taille"
      - "Nx remplace ng-packagr : les librairies Nx ne sont plus compilées avec le format de package Angular"
      - "Nx supprime le besoin de déclarer peerDependencies dans les librairies publiées"
    reponse: 1
    explication: "Un workspace Angular CLI natif supporte déjà plusieurs projets (ng generate application / library). Ce que Nx ajoute, c'est l'outillage autour : un graphe de dépendances qui sait quels projets sont affectés par un changement donné, et un cache de build/test qui évite de refaire un travail déjà fait sur du code inchangé — un gain qui devient sensible à mesure que le nombre de projets grandit."
  - question: "Une équipe hésite entre un monorepo (une application et ses librairies internes dans un seul dépôt) et des dépôts séparés (un dépôt par librairie, publiée sur un registre interne). Quel compromis est le plus exact ?"
    choix:
      - "Le monorepo facilite les changements coordonnés entre une librairie et ses consommateurs internes (même commit, mêmes tests) mais demande un outillage capable de ne construire/tester que ce qui a changé à mesure que le dépôt grossit ; des dépôts séparés isolent chaque équipe et son cycle de publication, au prix de versions à synchroniser manuellement entre dépôts"
      - "Un monorepo empêche par construction toute rupture d'API accidentelle entre une librairie et ses consommateurs"
      - "Des dépôts séparés éliminent totalement le besoin de versionnement sémantique, puisque chaque équipe contrôle son propre dépôt"
      - "Le choix entre monorepo et dépôts séparés n'a aucun impact sur l'intégration continue"
    reponse: 0
    explication: "Le monorepo n'empêche pas les ruptures d'API (il les rend juste plus visibles immédiatement, puisque le consommateur est dans le même dépôt), et le versionnement sémantique reste pertinent même en dépôts séparés. Le vrai compromis porte sur la coordination des changements (facile en monorepo, nécessite une synchronisation explicite entre dépôts) contre l'isolation et l'autonomie de chaque équipe (plus forte en dépôts séparés)."
---

## Essentiel

Un **workspace multi-projets** regroupe plusieurs applications et librairies dans un seul `angular.json`. L'application initiale de `ng new` reste à la racine ; les projets ajoutés ensuite vivent sous `projects/` :

```bash
ng generate application boutique
ng generate library acme-ui
ng generate library acme-donnees
```

Dans ce cas, `ng generate library` ajoute un chemin TypeScript dans le `tsconfig.json` racine, pour que `boutique` importe `acme-ui` directement depuis les sources du workspace, sans passer par npm à chaque changement local. Cette proximité a un revers : rien n'empêche techniquement une librairie d'importer une autre librairie, dans les deux sens — créant un **cycle de dépendances** qui rend le projet plus difficile à construire et à raisonner.

À mesure qu'un monorepo grandit (plusieurs applications, plusieurs librairies), tout reconstruire et retester à chaque changement devient coûteux. Le principe à retenir est de ne construire et tester que ce qui a réellement changé, et ce qui en dépend. Angular CLI seul ne fournit pas cet outillage nativement ; c'est ce que des outils tiers comme **Nx** apportent au-dessus d'un workspace Angular : un graphe de dépendances entre projets, un cache de build/test, et des générateurs de code.

## Détail

### Pourquoi c'est utile

Une librairie de composants interne n'a de valeur que si elle est facile à faire évoluer avec ses consommateurs. Le regrouper dans un monorepo avec les applications qui l'utilisent permet de changer une librairie et son usage dans la même modification, testée ensemble avant d'être intégrée — plutôt que de publier une nouvelle version, attendre qu'une autre équipe la consomme, et découvrir un problème d'intégration après coup.

### Exemple 1 — Chemin TypeScript vers une librairie du workspace

```json
// tsconfig.json (racine du workspace)
{
  "compilerOptions": {
    "paths": {
      "acme-ui": ["projects/acme-ui/src/public-api.ts"],
      "acme-donnees": ["projects/acme-donnees/src/public-api.ts"]
    }
  }
}
```

```ts
// projects/boutique/src/app/catalogue/produit-carte.ts
import { Bouton, Carte } from 'acme-ui';
import { ClientApi } from 'acme-donnees';
```

Ce mapping permet à `boutique` d'importer `acme-ui` comme un package normal, alors que le code réside dans le même workspace. C'est ce même mécanisme qui rend possible le développement d'une librairie en parallèle de l'application qui la consomme, avant toute publication npm.

### Exemple 2 — Repérer une dépendance à sens unique correcte

```
acme-ui        (composants de présentation, sans appel réseau)
    ↑
acme-donnees   (accès API, ne dépend d'aucune UI)
    ↑
boutique       (application, dépend des deux librairies)
```

Ici, `acme-donnees` ne dépend pas de `acme-ui`, et aucune des deux librairies ne dépend de `boutique`. Seule l'application dépend des librairies — jamais l'inverse. C'est cette direction unique, de l'application vers les librairies puis entre librairies de façon acyclique, qui garde le graphe de dépendances exploitable.

### Exemple 3 — Nx en une phrase, sans détail de syntaxe

Sur un monorepo à plusieurs applications et librairies, Nx construit un graphe des dépendances réelles entre projets à partir des imports du code, garde en cache le résultat d'un build ou d'une exécution de tests tant que les fichiers concernés n'ont pas changé, et fournit des générateurs de code pour créer applications, librairies et éléments courants de façon cohérente dans tout le monorepo. Le détail des commandes Nx dépend de la version installée et sort du cadre de cette leçon ; ce qui compte ici est le principe : **ne reconstruire et retester que ce qui a changé, et ce qui en dépend**, plutôt que l'intégralité du monorepo à chaque modification.

### Dépôts séparés vs monorepo

| | Monorepo | Dépôts séparés |
|---|---|---|
| Changement librairie + consommateur | Un seul commit, testé ensemble | Publication de la librairie, puis mise à jour séparée dans chaque dépôt consommateur |
| Isolation entre équipes | Plus faible : toutes les équipes partagent le même dépôt et souvent le même pipeline CI | Plus forte : chaque équipe gère son dépôt, son rythme de publication |
| Cohérence des versions entre projets | Naturelle (tout évolue dans le même dépôt) | Doit être gérée explicitement (versions à synchroniser) |
| Coût à l'échelle | Nécessite un outillage capable de cibler ce qui a changé (sinon, tout reconstruire devient lent) | Coût réparti dépôt par dépôt, mais coordination inter-dépôts manuelle |
| Détection d'une rupture d'API | Immédiate : le consommateur est dans le même dépôt, souvent dans la même CI | Différée : détectée seulement quand un consommateur met à jour la dépendance publiée |

### Intégration continue d'un monorepo

Le principe général, indépendant de l'outil précis utilisé : une exécution CI sur un monorepo doit identifier quels projets sont concernés par les fichiers modifiés dans un commit ou une pull request, puis ne construire et tester que ces projets (et ceux qui en dépendent), plutôt que l'ensemble du monorepo à chaque fois. Sans cela, le temps de CI croît avec la taille du monorepo indépendamment de la taille réelle du changement, ce qui devient vite un frein pour les équipes.

### Pièges courants

> **Laisser deux librairies s'importer mutuellement.** Même un import isolé, utile en apparence, suffit à créer un cycle si l'autre librairie importe déjà quelque chose en retour. La solution constante est de faire remonter l'élément partagé dans une librairie commune dont dépendent les deux, sans dépendance de retour.

> **Tout reconstruire et retester à chaque changement, quelle que soit sa taille.** Sur un petit monorepo, l'effet est invisible. Sur un monorepo à plusieurs dizaines de projets, reconstruire l'intégralité du dépôt pour un changement isolé dans une seule librairie ralentit la CI de façon disproportionnée par rapport à l'ampleur réelle du changement.

> **Considérer le monorepo comme une garantie de cohérence en soi.** Regrouper le code dans un seul dépôt facilite la coordination, mais ne remplace pas la discipline de versionnement et de revue de code : une librairie interne mal changée dans un monorepo peut tout de même casser plusieurs applications consommatrices dans le même commit, simplement de façon plus visible immédiatement qu'en dépôts séparés.

### À retenir

- Un workspace Angular multi-projets regroupe applications et librairies avec des chemins TypeScript qui permettent de les importer sans publication npm intermédiaire.
- Une dépendance ne doit circuler que dans un sens entre librairies (jamais de cycle) ; le commun remonte dans une librairie partagée.
- Nx (ou un outil équivalent) ajoute, au-dessus du workspace natif, un graphe de dépendances, un cache de build/test et des générateurs — pas une nécessité pour un petit workspace, mais un gain net à mesure qu'il grandit.
- Monorepo et dépôts séparés sont un compromis entre facilité de coordination (monorepo) et isolation entre équipes (dépôts séparés), pas une solution universellement meilleure.
- Une CI de monorepo efficace cible les projets réellement affectés par un changement, plutôt que de tout reconstruire systématiquement.

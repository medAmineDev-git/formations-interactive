---
id: micro-frontends
chapitre: patterns-avances
ordre: 5
titre: "Micro-frontends (aperçu)"
termes:
  - terme: Micro-frontend
    definition: "Découpage d'une application front-end en plusieurs applications déployables indépendamment, chacune possédée par une équipe distincte, assemblées à l'exécution ou au chargement pour former l'expérience utilisateur finale."
  - terme: "Module Federation"
    definition: "Technique de chargement dynamique permettant à une application de charger, au moment de l'exécution, du code compilé séparément par une autre application (une autre équipe, un autre pipeline de build). En Angular, elle s'appuie sur des outils communautaires (ex. plugins de fédération de modules pour Webpack ou pour le build esbuild d'Angular) — Angular ne fournit pas de solution de fédération de modules intégrée en premier lieu dans le CLI."
  - terme: "Composition côté serveur"
    definition: "Assemblage de plusieurs fragments HTML générés par des applications distinctes au niveau du serveur ou d'un edge/reverse proxy, avant d'envoyer une seule page au navigateur — alternative à la fédération de modules côté client."
  - terme: "Coquille applicative (shell)"
    definition: "Application englobante minimale (navigation commune, authentification, mise en page) qui charge et orchestre les différents micro-frontends, souvent elle-même une petite application Angular ou un simple assembleur HTML."
  - terme: "Contrat d'intégration"
    definition: "Ensemble de règles explicites entre équipes définissant comment les micro-frontends communiquent (état partagé, navigation, thème, authentification) sans se coupler fortement à l'implémentation interne de chacun."
  - terme: "Monorepo (Nx)"
    definition: "Alternative organisationnelle aux micro-frontends : un seul dépôt, plusieurs applications et librairies avec des frontières de module imposées par l'outillage (ex. Nx), un seul build/déploiement — résout le problème de modularité du code sans les coûts d'exécution distribuée."
quiz:
  - question: "Quel est le véritable problème que les micro-frontends cherchent à résoudre ?"
    choix:
      - "Un problème de performance d'exécution : les micro-frontends rendent systématiquement une application plus rapide qu'un monolithe front-end"
      - "Un problème organisationnel : permettre à plusieurs équipes de développer et déployer leur partie de l'application de façon indépendante, sans coordination bloquante sur un unique pipeline de build/déploiement"
      - "Un problème de typage : partager des interfaces TypeScript entre plusieurs projets"
      - "Un problème propre à Angular, qui n'existe pas avec d'autres frameworks front-end"
    reponse: 1
    explication: "Les micro-frontends répondent avant tout à un besoin d'organisation d'équipes et de cycles de déploiement indépendants, pas à un objectif de performance — une architecture micro-frontends ajoute en général de la complexité d'exécution (plusieurs bundles, runtimes potentiellement dupliqués) plutôt que d'en retirer."
  - question: "Une équipe unique de 6 développeurs veut mieux organiser son code en modules réutilisables, avec un seul cycle de déploiement. Que recommander en priorité ?"
    choix:
      - "Une architecture micro-frontends avec fédération de modules, pour préparer une future croissance de l'équipe"
      - "Un monorepo avec des frontières de module imposées par l'outillage (ex. Nx) : ça résout le besoin de modularité et de réutilisation sans payer le coût d'exécution distribuée (bundles dupliqués, versions à aligner, débogage cross-application) que les micro-frontends imposent"
      - "Découper systématiquement chaque fonctionnalité en une application Angular séparée, quelle que soit l'équipe qui la maintient"
      - "Passer en Web Components pour chaque écran de l'application, indépendamment du besoin réel de déploiement séparé"
    reponse: 1
    explication: "Les micro-frontends résolvent un problème d'échelle organisationnelle (plusieurs équipes, déploiements indépendants). Une seule équipe avec un seul cycle de déploiement n'a généralement pas ce problème : un monorepo avec des frontières de module imposées (Nx ou équivalent) apporte la même discipline de code sans la complexité d'exécution distribuée. Un bon candidat senior sait reconnaître ce cas et refuser une architecture plus lourde que nécessaire."
  - question: "Quel coût réel des micro-frontends est le plus souvent sous-estimé lors de la conception ?"
    choix:
      - "Le temps de compilation, systématiquement plus rapide qu'un monolithe"
      - "L'alignement des versions de dépendances partagées (Angular, librairies communes) entre équipes, le risque de duplication de runtime si les versions divergent, le partage d'état/authentification entre applications indépendantes, et la difficulté accrue de débogage cross-application"
      - "Le coût d'hébergement, qui diminue toujours avec un découpage en plusieurs applications"
      - "Aucun coût réel : les micro-frontends n'ajoutent de complexité qu'à la phase de conception initiale, jamais en fonctionnement"
    reponse: 1
    explication: "Les coûts persistent tout au long du cycle de vie du produit : versions de framework à coordonner (ou runtimes dupliqués si on laisse diverger), fuite de styles entre applications indépendantes, authentification/état partagé à concevoir explicitement, et un débogage plus complexe (pile d'appels et bundles répartis entre plusieurs applications). Un candidat senior doit pouvoir les citer concrètement, pas seulement dire que « c'est plus complexe »."
---

## Essentiel

Les micro-frontends découpent une application front-end en plusieurs applications **déployables indépendamment**, chacune possédée par une équipe. Le problème visé n'est **pas technique mais organisationnel** : plusieurs équipes qui doivent livrer sans se bloquer mutuellement sur un unique pipeline de build/déploiement.

Plusieurs approches existent, sans solution officielle unique fournie par Angular :

- **Module Federation** : chargement à l'exécution de code compilé séparément par une autre équipe, via des outils communautaires (plugins de fédération de modules pour Webpack, ou pour le builder esbuild d'Angular) — pas une fonctionnalité intégrée au CLI Angular par défaut.
- **Web Components** : chaque micro-frontend s'expose comme un élément personnalisé (voir la leçon sur Angular Elements), assemblés dans une page HTML commune, indépendamment de la technologie de chaque équipe.
- **Composition côté serveur/edge** : assemblage de fragments HTML générés par des applications distinctes, avant envoi au navigateur.
- **Applications séparées par route** : la solution la plus simple — chaque grande section vit dans sa propre application, reliée par une navigation partagée (liens, sous-domaines), sans partage de runtime à l'exécution.

Coûts réels à anticiper : aligner les versions d'Angular entre équipes (ou accepter des runtimes dupliqués si elles divergent), éviter les fuites de style entre applications indépendantes, concevoir explicitement le partage d'authentification et d'état, et un débogage plus difficile (pile d'appels et bundles répartis).

Les micro-frontends sont justifiés pour de grandes organisations avec des équipes et des cadences de déploiement réellement indépendantes. Pour une seule équipe qui veut surtout organiser son code, un **monorepo** avec des frontières de module imposées (Nx ou équivalent) répond au même besoin de modularité, sans le coût d'exécution distribuée.

## Détail

### Pourquoi c'est utile (et pour qui)

Un monolithe front-end devient difficile à faire évoluer quand plusieurs équipes doivent livrer indépendamment : un seul pipeline de build ralentit tout le monde, un bug dans une fonctionnalité bloque le déploiement d'une autre, et le couplage du code favorise les régressions inter-équipes. Les micro-frontends répondent à ce problème en isolant le déploiement, au prix d'une complexité d'exécution supplémentaire (plusieurs bundles, potentiellement plusieurs runtimes de framework à charger).

### Approche 1 — Module Federation

```ts
// exemple conceptuel — configuration selon l'outil de fédération de modules utilisé
export default {
  name: 'catalogue',
  exposes: {
    './ListeProduits': './src/app/liste-produits/liste-produits.ts',
  },
  shared: ['@angular/core', '@angular/common', '@angular/router'],
};
```

La coquille applicative (shell) charge dynamiquement les composants exposés par chaque équipe à l'exécution. Le point critique : `shared` doit lister les dépendances communes (Angular en premier lieu) pour éviter que chaque micro-frontend embarque sa propre copie du framework — sans quoi le poids total et la mémoire consommée augmentent, et deux instances d'Angular peuvent cohabiter sans le savoir.

### Approche 2 — Web Components

Chaque équipe expose son micro-frontend comme un élément personnalisé (`createCustomElement()`, voir la leçon dédiée), assemblé dans une coquille applicative qui n'a pas besoin de connaître la technologie interne de chaque équipe :

```html
<shell-navigation></shell-navigation>
<catalogue-produits></catalogue-produits>
<panier-achat></panier-achat>
```

Avantage : agnostique côté framework (une équipe pourrait même ne pas utiliser Angular). Inconvénient : chaque widget embarque potentiellement son propre runtime, et la communication entre eux passe par des événements DOM ou un état partagé à construire soi-même.

### Approche 3 — Composition côté serveur

Un reverse proxy ou une couche edge assemble plusieurs fragments HTML générés séparément (chacun par sa propre application, potentiellement son propre serveur Angular SSR) avant de répondre au navigateur avec une seule page. Utile quand l'indépendance de déploiement doit aussi s'étendre au rendu, pas seulement au bundle client.

### Approche 4 — Applications séparées, simplement

Souvent la solution la plus simple et la plus robuste : chaque grande section de l'application vit dans sa propre application Angular, déployée séparément, reliée par la navigation (liens classiques, ou sous-domaines) plutôt que par un partage de runtime à l'exécution. Coût de coordination le plus faible, au prix d'une expérience de navigation entre sections un peu moins transparente (rechargement complet de page entre applications).

### Coûts réels à ne pas sous-estimer

| Coût | Détail |
|---|---|
| Versions d'Angular | Aligner les versions entre équipes, ou accepter plusieurs runtimes chargés (poids, incohérences subtiles de comportement) |
| Styles | Fuite de CSS entre applications indépendantes sans encapsulation stricte (Shadow DOM, conventions de nommage) |
| État partagé / authentification | Session, jeton d'authentification, panier utilisateur : à faire circuler explicitement entre applications indépendantes, rien ne le fait automatiquement |
| Débogage | Pile d'appels et bundles répartis entre plusieurs applications ; un bug visible dans un micro-frontend peut avoir son origine dans un autre |
| CI/CD | Autant de pipelines à maintenir que de micro-frontends, avec leurs propres tests d'intégration inter-applications |

### Quand c'est justifié, et quand un monorepo suffit

Les micro-frontends se justifient quand **plusieurs équipes réellement autonomes** doivent déployer indépendamment, à un rythme différent, sans dépendre du calendrier des autres. Ce n'est pas un problème technique — c'est un problème d'échelle organisationnelle.

Pour une équipe unique (ou plusieurs équipes qui déploient de toute façon ensemble), un **monorepo** avec des frontières de module imposées par l'outillage (Nx et ses `module boundaries`, par exemple) apporte la même modularité de code, la même réutilisation de librairies internes, sans les coûts d'exécution distribuée : un seul build, un seul déploiement, pas de version d'Angular à aligner entre applications séparées.

### Ce qu'on attend d'un candidat senior

- Reconnaître qu'il s'agit d'un compromis organisationnel avant d'être une décision technique, et savoir le formuler ainsi en entretien.
- Citer au moins deux approches concrètes (Module Federation, Web Components, composition serveur, applications séparées) avec leurs différences réelles.
- Nommer des coûts précis (versions à aligner, styles, état partagé, débogage) plutôt que rester sur « c'est plus complexe ».
- Savoir dire non : proposer un monorepo quand le problème réel est la modularité du code, pas l'indépendance de déploiement entre équipes distinctes.

### Pièges courants

> **Adopter les micro-frontends « par anticipation » d'une croissance future de l'équipe.** Le coût d'exécution distribuée (versions à aligner, styles, débogage) se paie dès le premier jour, alors que le bénéfice (déploiements réellement indépendants) ne se matérialise que quand plusieurs équipes existent vraiment.

> **Oublier de partager les dépendances communes en Module Federation.** Sans configuration explicite du partage (`shared` dans l'exemple), chaque micro-frontend peut embarquer sa propre copie d'Angular, ce qui alourdit le chargement et peut provoquer des comportements incohérents entre deux instances du framework coexistant sur la même page.

> **Confondre découpage en librairies et micro-frontends.** Découper le code en librairies réutilisables (dans un monorepo ou non) est une bonne pratique générale ; ça ne nécessite pas, en soi, un déploiement distribué à l'exécution — les deux problèmes sont souvent confondus à tort.

### À retenir

- Les micro-frontends résolvent un problème d'**organisation d'équipes et de déploiement indépendant**, pas un problème de performance.
- Quatre approches principales : Module Federation, Web Components, composition côté serveur, applications séparées par route — sans solution officielle unique fournie par Angular.
- Coûts réels et durables : versions de framework à aligner, fuite de styles, état/authentification partagés à concevoir, débogage cross-application plus difficile.
- Un monorepo avec des frontières de module imposées (Nx) résout le besoin de modularité de code sans les coûts d'exécution distribuée — souvent suffisant pour une seule équipe.
- En entretien, un bon candidat sait dire quand les micro-frontends ne sont **pas** justifiés, pas seulement les décrire.

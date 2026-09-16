---
id: mesurer-performance
chapitre: performance
ordre: 4
titre: "Mesurer avant d'optimiser"
termes:
  - terme: "Angular DevTools"
    definition: "Extension de navigateur officielle qui ajoute un panneau d'inspection propre à Angular : arbre des composants (avec leurs entrées, signaux, état), et un **profileur** qui enregistre les cycles de détection de changements pour repérer les composants re-vérifiés trop souvent ou trop longtemps."
  - terme: "Profileur (Angular DevTools)"
    definition: "Fonctionnalité du panneau Angular DevTools qui enregistre une session d'utilisation et affiche, pour chaque cycle de détection de changements, la durée passée par composant. Permet de repérer visuellement un composant qui se re-rend anormalement souvent."
  - terme: Lighthouse
    definition: "Outil d'audit (intégré aux outils de développement Chrome, aussi disponible en CLI) qui mesure des indicateurs de performance, d'accessibilité et de bonnes pratiques sur une page, et calcule les **Core Web Vitals**."
  - terme: "LCP (Largest Contentful Paint)"
    definition: "Core Web Vital qui mesure le temps avant l'affichage du plus grand élément visible de la page (souvent une image principale ou un titre). Un LCP élevé signale un chargement initial trop lent ou une ressource critique mal priorisée."
  - terme: "INP (Interaction to Next Paint)"
    definition: "Core Web Vital qui mesure le délai entre une interaction utilisateur (clic, frappe) et le prochain rafraîchissement visuel qui en résulte. A remplacé le First Input Delay (FID) comme métrique officielle de réactivité."
  - terme: "CLS (Cumulative Layout Shift)"
    definition: "Core Web Vital qui mesure les décalages visuels inattendus du contenu pendant le chargement de la page (ex. une image sans dimensions qui pousse le texte en dessous d'elle une fois chargée)."
  - terme: "Budgets (angular.json)"
    definition: "Seuils de taille configurés dans `angular.json` (section `budgets` d'une configuration de build) qui font échouer ou avertir le build si un bundle dépasse une taille définie — un garde-fou automatique contre la croissance silencieuse du bundle."
  - terme: "--stats-json"
    definition: "Option de `ng build` (`ng build --stats-json`) qui génère un fichier `stats.json` décrivant la composition détaillée des bundles, exploitable avec un outil d'analyse de bundle (ex. `webpack-bundle-analyzer` ou l'équivalent esbuild) pour voir quels modules pèsent le plus."
quiz:
  - question: "Un développeur pense qu'un composant `ListeProduits` se re-rend trop souvent, sans certitude. Quelle est la bonne première étape ?"
    choix:
      - "Ajouter `ChangeDetectionStrategy.OnPush` partout dans l'application, par précaution"
      - "Ouvrir le profileur d'Angular DevTools, enregistrer une session d'utilisation, et regarder combien de fois `ListeProduits` apparaît dans les cycles de détection de changements et combien de temps il y passe"
      - "Réécrire directement le composant en zoneless, ça résout toujours ce type de problème"
      - "Ajouter des `console.log` dans tous les hooks de cycle de vie du composant et de ses enfants"
    reponse: 1
    explication: "La démarche correcte commence toujours par mesurer avant d'agir : le profileur d'Angular DevTools montre concrètement, cycle par cycle, quels composants sont re-vérifiés et combien de temps ça prend — sans ça, une optimisation (`OnPush`, passage en zoneless...) est un pari, pas une correction basée sur des données."
  - question: "Que mesure le LCP (Largest Contentful Paint), et qu'est-ce qui peut l'améliorer sur une fiche produit ?"
    choix:
      - "Le nombre total de requêtes HTTP effectuées par la page, réduit en fusionnant les appels API"
      - "Le temps avant l'affichage du plus grand élément visible (souvent l'image principale du produit) ; le marquer `priority` avec `NgOptimizedImage` aide à l'améliorer"
      - "Le temps de réponse du serveur uniquement, indépendant de ce qui se passe dans le navigateur"
      - "La quantité de mémoire JavaScript utilisée par la page une fois chargée"
    reponse: 1
    explication: "Le LCP se concentre sur l'élément le plus grand visible à l'écran au chargement — typiquement une image ou un bloc de texte principal. Pour une fiche produit, l'image principale en est souvent responsable : la marquer `priority` (chargement non différé) est un levier direct et mesurable sur ce Core Web Vital."
  - question: "Un budget dans `angular.json` fait échouer le build avec un avertissement de dépassement de taille. Quelle est la démarche recommandée ?"
    choix:
      - "Augmenter directement le seuil du budget pour faire disparaître l'avertissement"
      - "Analyser la composition du bundle (ex. via `ng build --stats-json` et un outil d'analyse) pour identifier ce qui a fait grossir le bundle, corriger le point identifié, puis rebuilder pour vérifier l'effet"
      - "Ignorer l'avertissement s'il ne bloque pas complètement le build"
      - "Retirer le budget du fichier `angular.json` pour éviter que ça se reproduise"
    reponse: 1
    explication: "Un budget dépassé est un signal, pas le problème lui-même : la démarche mesurer → corriger → re-mesurer s'applique aussi au bundle. Augmenter le seuil sans comprendre la cause revient à masquer le symptôme ; analyser la composition réelle du bundle permet de trouver, par exemple, une dépendance importée en double ou un import statique qui annule un découpage prévu."
---

## Essentiel

Optimiser sans mesurer revient à deviner. La démarche à suivre est toujours la même : **mesurer, corriger un point précis, re-mesurer** — jamais changer plusieurs choses à la fois sans savoir laquelle a eu un effet.

**Angular DevTools** (extension de navigateur officielle) donne deux vues utiles : l'arbre des composants (props, signaux, état actuel) et un **profileur**, qui enregistre une session et montre, cycle par cycle, quels composants sont re-vérifiés et combien de temps ça prend. C'est le premier réflexe pour confirmer (ou infirmer) qu'un composant se re-rend trop souvent, avant de toucher au code.

**Lighthouse** (intégré aux outils de développement du navigateur) audite une page chargée et calcule les **Core Web Vitals** :

- **LCP** (Largest Contentful Paint) : temps avant l'affichage du plus grand élément visible ;
- **INP** (Interaction to Next Paint) : délai entre une interaction et le prochain rafraîchissement visuel ;
- **CLS** (Cumulative Layout Shift) : décalages visuels inattendus pendant le chargement.

Pour la taille des bundles, `ng build --stats-json` génère un fichier exploitable par un outil d'analyse de bundle, et les **budgets** dans `angular.json` font échouer ou avertir le build automatiquement au-delà d'un seuil défini :

```json
"budgets": [
  { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" }
]
```

Le coût du SSR et de l'hydratation se mesure avec les mêmes outils, mais son approfondissement relève du chapitre SSR (niveau avancé).

## Détail

### Pourquoi c'est utile

Une optimisation appliquée sans mesure préalable a deux risques : corriger un problème qui n'existe pas (temps perdu), ou masquer un vrai problème par un autre changement simultané, rendant impossible de savoir ce qui a réellement aidé. Mesurer avant et après chaque changement isolé est ce qui transforme une intuition (« ce composant doit se re-rendre trop souvent ») en certitude exploitable.

### Exemple 1 — Repérer un composant qui se re-rend trop avec le profileur

Dans Angular DevTools, onglet **Profiler** : démarrer un enregistrement, interagir avec l'application (filtrer une liste, ouvrir un panneau), arrêter l'enregistrement. Chaque barre du graphique correspond à un cycle de détection de changements ; en la sélectionnant, la liste des composants vérifiés pendant ce cycle apparaît, avec leur durée. Un composant qui apparaît à **chaque** cycle, même quand l'interaction ne le concerne pas, est un candidat pour `OnPush` ou pour une révision de ses entrées.

### Exemple 2 — Lire un rapport Lighthouse

```text
Performance: 78
  - Largest Contentful Paint   3.2 s   (image principale du produit)
  - Interaction to Next Paint    210 ms
  - Cumulative Layout Shift      0.18   (image sans dimensions détectée)
```

Ici, deux pistes concrètes ressortent directement du rapport : l'image principale n'est probablement pas marquée `priority`, et une image sans dimensions explicites cause le décalage de mise en page — corrigible avec `NgOptimizedImage` (`width`/`height` obligatoires, `priority` sur l'image principale).

### Exemple 3 — Analyser la taille des bundles

```bash
ng build --stats-json
```

Le fichier `stats.json` généré dans le dossier de sortie peut ensuite être ouvert avec un outil d'analyse de bundle (visualisation en blocs proportionnels à la taille de chaque module). C'est souvent là qu'apparaissent des surprises : une librairie entière importée pour une seule fonction utilitaire, ou un composant censé être différé (`loadComponent`, `@defer`) qui se retrouve malgré tout dans le bundle principal à cause d'un import statique oublié ailleurs.

### Exemple 4 — Un budget qui échoue au build

```text
Error: budgets: initial exceeded maximum budget. Budget 1.00 MB was not met by 128.40 kB with a total of 1.13 MB.
```

Ce message ne dit pas *quoi* a grossi, seulement que le total dépasse le seuil. L'étape suivante est justement l'exemple précédent : générer un `stats.json` et l'analyser pour identifier la cause précise, plutôt que d'augmenter le budget pour faire disparaître l'erreur.

### Outils selon la question posée

| Question | Outil |
|---|---|
| « Ce composant se re-rend-il trop souvent ? » | Profileur Angular DevTools |
| « Cette page se charge-t-elle assez vite pour l'utilisateur ? » | Lighthouse (LCP, INP, CLS) |
| « Pourquoi le bundle a-t-il grossi ? » | `ng build --stats-json` + outil d'analyse de bundle |
| « Le bundle dépasse-t-il une taille acceptable ? » | Budgets dans `angular.json`, vérifiés automatiquement à chaque build |

### Pièges courants

> **Optimiser en développement (`ng serve`) et tirer des conclusions de performance.** Le mode développement inclut des vérifications et des source maps qui n'existent pas en production. Toujours mesurer sur un `ng build` de production (ou son équivalent servi localement), jamais sur `ng serve`.

> **Changer plusieurs choses à la fois puis mesurer une seule fois.** Passer un composant en `OnPush`, ajouter un `@defer` et optimiser une image dans le même commit, puis constater une amélioration globale, ne dit pas laquelle des trois actions a compté — ni si l'une d'elles a en fait dégradé autre chose. Isoler les changements, ou au moins mesurer entre chaque étape majeure.

> **Confondre un score Lighthouse ponctuel avec une mesure fiable.** Le résultat d'un audit Lighthouse varie selon la charge de la machine, le réseau simulé et d'autres facteurs externes. Une seule mesure isolée, surtout proche d'un seuil, mérite d'être reproduite avant d'en tirer une conclusion.

### À retenir

- La démarche à suivre : **mesurer, corriger un point, re-mesurer** — jamais optimiser à l'aveugle ni changer plusieurs choses en même temps sans mesure intermédiaire.
- Angular DevTools (arbre de composants + profileur) répond à « quel composant se re-rend trop, et quand ? ».
- Lighthouse et les Core Web Vitals (LCP, INP, CLS) répondent à « cette page se charge-t-elle et réagit-elle assez vite pour l'utilisateur ? ».
- `ng build --stats-json` et un outil d'analyse de bundle répondent à « pourquoi le bundle a-t-il grossi ? » ; les budgets dans `angular.json` détectent automatiquement un dépassement à chaque build.
- Le coût du SSR et de l'hydratation se mesure avec les mêmes outils, mais son approfondissement fait l'objet du chapitre SSR (niveau avancé).
</content>

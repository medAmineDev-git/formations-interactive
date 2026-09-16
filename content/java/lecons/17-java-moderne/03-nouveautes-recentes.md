---
id: nouveautes-recentes
chapitre: java-moderne
ordre: 3
titre: "Ce qui a changé depuis Java 17"
termes:
  - terme: Version LTS vs version « feature »
    definition: "Une version **LTS** (Long-Term Support : 17, 21, 25...) bénéficie d'un support étendu sur plusieurs années et sort tous les deux ans (JEP 322, cadence de six mois entre chaque version). Les versions intermédiaires (18 à 20, 22 à 24, 26...) livrent les mêmes nouveautés au même rythme, mais avec un support court : la plupart des équipes en production restent sur une LTS."
  - terme: Collections séquencées (sequenced collections)
    definition: "Interfaces `SequencedCollection`, `SequencedSet` et `SequencedMap`, qui ajoutent à toute collection ordonnée des méthodes uniformes (`getFirst()`, `getLast()`, `addFirst()`, `reversed()`...), auparavant dispersées ou absentes selon l'implémentation (`List` avait `get(0)`, `Deque` avait `getFirst()`, `LinkedHashMap` n'avait rien d'équivalent). Finalisées par le **JEP 431**, directement (sans passer par l'aperçu), en **Java 21**."
  - terme: Gatherers de streams
    definition: "Mécanisme d'opération **intermédiaire personnalisée** pour les streams (`Stream.gather(Gatherer)`), qui comble un manque historique : jusque-là, seules les opérations terminales pouvaient être personnalisées facilement (`Collector`), pas les étapes intermédiaires. Finalisés par le **JEP 485** en **Java 24**."
  - terme: Déclarations d'import de module
    definition: "Syntaxe `import module java.base;` qui importe en une fois tous les paquets exportés par un module, utile en particulier pour les fichiers source compacts et les scripts. Finalisée par le **JEP 511** en **Java 25**."
  - terme: Fichiers source compacts et méthodes main d'instance
    definition: "Simplification permettant d'écrire un petit programme sans classe explicite ni `public static void main(String[] args)` : une méthode `void main()` (sans arguments, sans static, sans modificateur d'accès obligatoire) suffit dans un fichier source lancé directement. Finalisée par le **JEP 512** en **Java 25**."
  - terme: Corps de constructeur flexibles
    definition: "Assouplissement qui autorise du code **avant** l'appel à `super(...)` ou `this(...)` dans un constructeur (validation d'arguments, calculs préparatoires), tant que ce code ne lit ni n'écrit l'état de l'instance en cours de construction. Finalisés par le **JEP 513** en **Java 25**."
  - terme: Modèles de chaînes (string templates)
    definition: "Fonctionnalité qui aurait permis d'interpoler des expressions directement dans une chaîne (`STR.\"Bonjour \\{nom}\"`). **Retirée / abandonnée** : après un 2ᵉ aperçu (JEP 459, Java 22), le 3ᵉ aperçu annoncé (JEP 465) a été **retiré avant la sortie de Java 23**, suite à des critiques sur la conception. Aucun JEP successeur n'existe au 16/09/2026 : à ne **jamais** présenter comme disponible ou en cours de finalisation."
quiz:
  - question: "Une équipe a lu un article expliquant comment utiliser STR.\"Bonjour \\{nom}\" pour interpoler une chaîne. Que faut-il en dire ?"
    choix:
      - "C'est correct, cette fonctionnalité (modèles de chaînes) est disponible depuis Java 21"
      - "Cette fonctionnalité a été retirée avant la sortie de Java 23 et n'a jamais été livrée : elle ne compile sur aucune version actuelle du JDK"
      - "C'est correct, mais uniquement en activant --enable-preview sur Java 25 ou plus récent"
      - "C'est correct depuis Java 17, en même temps que les blocs de texte"
    reponse: 1
    explication: "Les modèles de chaînes (string templates, JEP 465) ont été retirés avant la sortie de Java 23, après deux aperçus (JEP 430 en Java 21, JEP 459 en Java 22) et des critiques substantielles sur la conception. Aucun JEP successeur n'a été déposé au 16/09/2026 : ce code ne compile sur aucune version actuelle, et l'article en question est obsolète ou erroné."
  - question: "Parmi ces fonctionnalités, laquelle reste en aperçu (preview) au 16/09/2026, et ne doit donc pas être présentée comme finalisée ?"
    choix:
      - "Les collections séquencées (SequencedCollection)"
      - "Les valeurs de portée (scoped values)"
      - "La concurrence structurée"
      - "Les déclarations d'import de module"
    reponse: 2
    explication: "La concurrence structurée en est à son 7ᵉ aperçu (JEP 533, Java 27) et n'est toujours pas finalisée ; une finalisation est proposée par le JEP 543 mais seulement au stade candidat pour Java 28, pas encore livré. Les collections séquencées (JEP 431, Java 21), les valeurs de portée (JEP 506, Java 25) et les déclarations d'import de module (JEP 511, Java 25) sont, elles, toutes finalisées."
  - question: "Quelle version de Java a fini par rassembler, en une seule sortie, la finalisation des valeurs de portée, des déclarations d'import de module, des fichiers source compacts avec main d'instance, et des corps de constructeur flexibles ?"
    choix:
      - "Java 17"
      - "Java 21"
      - "Java 24"
      - "Java 25"
    reponse: 3
    explication: "Java 25 (LTS, septembre 2025) a été une version particulièrement dense pour Project Amber : quatre finalisations d'un coup (JEP 506 valeurs de portée, JEP 511 import de module, JEP 512 fichiers source compacts et main d'instance, JEP 513 corps de constructeur flexibles). Java 21 avait, lui, livré threads virtuels, motifs de record, switch sur motifs et collections séquencées."
---

## Essentiel

Beaucoup d'équipes sont encore sur **Java 17** ou **Java 21**. Voici, sans rien inventer, ce qui a changé depuis — avec la version de finalisation de chaque apport.

| Version (LTS) | GA | Apports marquants |
|---|---|---|
| **17** | sept. 2021 | Classes scellées (finalisées, JEP 409) ; filtrage par motif switch (alors en aperçu, JEP 406) |
| **21** | sept. 2023 | Threads virtuels (JEP 444) ; motifs de record (JEP 440) ; switch sur motifs, finalisé (JEP 441) ; collections séquencées (JEP 431) |
| **24** | mars 2025 | Gatherers de streams (JEP 485) |
| **25** | sept. 2025 | Valeurs de portée (JEP 506) ; import de module (JEP 511) ; fichiers source compacts et main d'instance (JEP 512) ; corps de constructeur flexibles (JEP 513) ; en-têtes d'objet compacts, opt-in (JEP 519) |
| **27** (non-LTS) | sept. 2026 | En-têtes d'objet compacts par défaut (JEP 534) ; G1 comme GC par défaut partout, sans exception (JEP 523) |

Deux fonctionnalités très attendues restent **en aperçu** au 16/09/2026, à ne jamais présenter comme acquises : la **concurrence structurée** (JEP 533, 7ᵉ aperçu) et les **motifs sur types primitifs** (JEP 532, 5ᵉ aperçu) — voir la leçon sur le filtrage par motif et le chapitre concurrence.

Une fonctionnalité a en revanche été **retirée** : les **modèles de chaînes** (string templates), abandonnés avant la sortie de Java 23.

## Détail

### Ce que la migration 17 → 21 → 25 apporte concrètement

Passer de Java 17 à Java 21 donne accès, sans flag d'aperçu, au filtrage par motif complet (switch, motifs de record), aux threads virtuels (chapitre concurrence) et aux collections séquencées. Passer de Java 21 à Java 25 ajoute les valeurs de portée (alternative à `ThreadLocal`, également traitée dans le chapitre concurrence) et trois simplifications d'écriture : import de module, fichiers source compacts, corps de constructeur flexibles. Ce sont des ajouts, pas des changements de comportement par défaut (hormis GC et réglages internes, hors périmètre de ce chapitre).

### Exemple 1 — Collections séquencées : une API enfin uniforme

Avant Java 21, obtenir le premier ou le dernier élément dépendait du type concret de la collection :

```java
// Avant Java 21
List<String> liste = new ArrayList<>(List.of("a", "b", "c"));
String premier = liste.get(0);
String dernier = liste.get(liste.size() - 1);

LinkedHashMap<String, Integer> stocks = new LinkedHashMap<>();
// pas d'équivalent direct pour "premier" ou "dernier" sur une Map
```

Depuis Java 21, `List`, `LinkedHashSet`, `LinkedHashMap` (et d'autres) implémentent des interfaces séquencées communes :

```java
// Depuis Java 21
List<String> liste = new ArrayList<>(List.of("a", "b", "c"));
String premier = liste.getFirst();
String dernier = liste.getLast();
List<String> inversee = liste.reversed(); // vue inversée, pas de copie
```

### Exemple 2 — Gatherers : une opération intermédiaire personnalisée

Avant Java 24, personnaliser une étape intermédiaire d'un stream (par exemple regrouper les éléments par lots de taille fixe) demandait souvent de sortir du pipeline de streams. Depuis Java 24 :

```java
List<List<Produit>> lots = produits.stream()
        .gather(Gatherers.windowFixed(50))
        .toList();
```

`Gatherers` fournit des opérations prêtes à l'emploi (`windowFixed`, `windowSliding`, `fold`...) et permet aussi d'en écrire des personnalisées via `Gatherer.of(...)`.

### Exemple 3 — Fichiers source compacts (Java 25+)

Pour un petit script ou un premier exemple pédagogique, plus besoin de classe explicite ni de `public static void main(String[] args)` :

```java
// Fichier Bonjour.java, Java 25+, sans --enable-preview (finalisé)
void main() {
    System.out.println("Bonjour boutique !");
}
```

Ce fichier se lance directement avec `java Bonjour.java`, sans compilation manuelle préalable. Cette simplification vise l'apprentissage et les scripts courts ; un vrai projet applicatif reste organisé en classes et paquets classiques.

### Exemple 4 — Corps de constructeur flexibles (Java 25+)

```java
public class LigneCommande {
    private final int quantite;

    public LigneCommande(int quantite) {
        if (quantite <= 0) {
            throw new IllegalArgumentException("quantité invalide : " + quantite);
        }
        super(); // implicite, mais du code de validation peut désormais précéder l'appel à super()
        this.quantite = quantite;
    }
}
```

Avant Java 25, une instruction (même une simple validation ne touchant pas `this`) ne pouvait pas précéder l'appel à `super(...)` ou `this(...)` : il fallait la déplacer dans une méthode statique appelée en argument du constructeur. Depuis Java 25, ce genre de validation peut s'écrire directement en tête du constructeur.

### Fonctionnalités toujours en aperçu (à ne pas présenter comme disponibles)

| Fonctionnalité | JEP | Dernier aperçu | Finalisation |
|---|---|---|---|
| Concurrence structurée | 533 | 7ᵉ aperçu, Java 27 | Non finalisée ; JEP 543 candidat pour Java 28, pas confirmé |
| Motifs sur types primitifs | 532 | 5ᵉ aperçu, Java 27 | Non finalisée, aucune date annoncée |
| API Vector | 537 | 12ᵉ incubateur, Java 27 | Bloquée sur l'avancement du projet Valhalla, pas de date |

### Fonctionnalité retirée

Les **modèles de chaînes** (string templates, `STR."..."`) ont été proposées en aperçu dans Java 21 (JEP 430) puis Java 22 (JEP 459), avant que le 3ᵉ aperçu prévu (JEP 465) ne soit **retiré avant la sortie de Java 23**. Aucun successeur n'a été déposé à ce jour : tout exemple utilisant `STR.` doit être considéré comme non compilable sur une version actuelle du JDK, quelle que soit la version citée dans l'article ou le tutoriel source.

### Pièges courants

> **Présenter une fonctionnalité en aperçu comme du Java « normal ».** Un aperçu (preview) nécessite `--enable-preview` à la compilation *et* à l'exécution, engage tout le module dans cette expérimentation, et peut encore changer de syntaxe ou disparaître d'une version à l'autre. Ni la concurrence structurée ni les motifs sur types primitifs ne doivent apparaître dans du code de production tant qu'ils ne sont pas finalisés.

> **Croire qu'une ressource en ligne datée de 2023-2024 est à jour.** Beaucoup de contenus publiés avant l'été 2026 présentent encore Java 21 ou 25 comme « la dernière version » : ce n'est plus le cas depuis la sortie de Java 27 (15 septembre 2026, non-LTS). Toujours vérifier la date de publication d'une source avant de s'y fier pour un statut de fonctionnalité.

> **Mélanger version « la plus récente » et version « recommandée en production ».** Java 27 est la version la plus récente, mais c'est une version « feature » (non-LTS) au support court. Pour un projet en production, Java 21 ou Java 25 (les deux LTS les plus récentes) restent les choix par défaut les plus raisonnables.

### À retenir

- Java 21 (LTS) a finalisé le filtrage par motif complet, les threads virtuels et les collections séquencées — souvent la marche la plus rentable depuis Java 17.
- Java 25 (LTS) a finalisé quatre apports Amber d'un coup : valeurs de portée, import de module, fichiers source compacts, corps de constructeur flexibles.
- Java 27 est la version la plus récente (sept. 2026) mais **non-LTS** : ne pas la confondre avec une recommandation de production.
- La **concurrence structurée** et les **motifs sur types primitifs** restent en aperçu au 16/09/2026, malgré des aperçus déjà avancés (7ᵉ et 5ᵉ).
- Les **modèles de chaînes** sont **retirés définitivement** depuis 2024 : aucun code les utilisant ne doit être présenté comme fonctionnel.

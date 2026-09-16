---
id: jpms
chapitre: modules-deploiement
ordre: 1
titre: "Le système de modules"
termes:
  - terme: "module-info.java"
    definition: "Fichier de description placé à la racine des sources d'un module. Il déclare son nom, ses dépendances (`requires`) et ce qu'il expose (`exports`, `opens`), compilé en un fichier `module-info.class` embarqué dans le jar."
  - terme: "requires transitive"
    definition: "Variante de `requires` qui propage la dépendance aux modules qui dépendent du module courant : si `A requires transitive B`, alors tout module qui fait `requires A` lit aussi `B` sans avoir à le déclarer lui-même."
  - terme: "exports"
    definition: "Rend les types **publics** d'un package accessibles en compilation et à l'exécution aux autres modules. Un package non exporté reste invisible depuis l'extérieur du module, même si ses classes sont `public`."
  - terme: "opens"
    definition: "Autorise la **réflexion profonde** (accès aux membres privés via `setAccessible(true)`) sur un package, sans forcément l'exporter pour un usage en compilation normale. Indispensable pour les frameworks qui inspectent des classes par réflexion (sérialisation JSON, injection de dépendances)."
  - terme: "uses / provides"
    definition: "Déclarations du mécanisme de services du module system : `uses Service` indique qu'un module consomme une implémentation via `ServiceLoader`, `provides Service with Impl` indique qu'un module fournit une implémentation, sans lien de compilation direct entre les deux."
  - terme: "Module automatique"
    definition: "Jar **sans** `module-info.java` placé sur le **chemin de modules** (et non le classpath). La JVM lui attribue un nom dérivé du manifeste (`Automatic-Module-Name`) ou du nom de fichier, l'expose en lecture vers tous les autres modules, et lui laisse lire tous les autres modules : étape de migration progressive."
  - terme: "Module non nommé (unnamed module)"
    definition: "Ensemble de tout ce qui est chargé depuis le **classpath** classique. Il lit tous les autres modules, mais aucun module nommé ne peut le lire explicitement : c'est le mode de fonctionnement historique, toujours disponible pour la compatibilité."
  - terme: "InaccessibleObjectException"
    definition: "Exception non vérifiée levée à l'exécution quand du code appelle `setAccessible(true)` sur un membre d'un package qui n'est ni ouvert (`opens`) ni exporté au module appelant. Signale une violation de l'encapsulation forte imposée par le module system."
quiz:
  - question: "Le module `com.boutique.catalogue` exporte le package `com.boutique.catalogue.api`, qui expose des types du package `com.boutique.catalogue.remise` (non exporté). Le module `com.boutique.commande` déclare `requires com.boutique.catalogue;` sans `transitive`. Que se passe-t-il si `com.boutique.commande` compile du code utilisant directement un type de `com.boutique.catalogue.remise` ?"
    code: |
      // module-info.java de com.boutique.catalogue
      module com.boutique.catalogue {
          exports com.boutique.catalogue.api;
          // com.boutique.catalogue.remise n'est pas exporté
      }
    choix:
      - "La compilation échoue : le package remise n'est pas exporté, il reste invisible même via un package exporté qui l'utilise en interne"
      - "La compilation réussit car requires (même sans transitive) donne accès à tous les packages du module requis"
      - "La compilation réussit uniquement si le type non exporté est déclaré public"
      - "Le problème n'apparaît qu'à l'exécution, jamais à la compilation"
    reponse: 0
    explication: "L'encapsulation du module system porte sur les packages, pas sur la visibilité `public` des types. `exports` ne rend visible que les packages listés explicitement ; un type public d'un package non exporté reste inaccessible depuis un autre module, même s'il transite par l'API publique d'un package exporté. Cette erreur est détectée dès la compilation, pas seulement à l'exécution."
  - question: "Une bibliothèque de sérialisation JSON utilise la réflexion pour lire les champs privés des records du module applicatif, et lève `InaccessibleObjectException: Unable to make field ... accessible`. Le module applicatif ne déclare que `exports com.boutique.dto;`. Quelle correction résout le problème sans modifier le code de la bibliothèque ?"
    choix:
      - "Remplacer `exports` par `opens com.boutique.dto;` dans le module-info (ou ajouter `--add-opens` au lancement pour un contournement ponctuel)"
      - "Rendre tous les champs des records public"
      - "Ajouter `requires` vers le module de la bibliothèque de sérialisation"
      - "Passer les records en classes internes du module de la bibliothèque"
    reponse: 0
    explication: "`exports` autorise l'usage normal en compilation, mais pas la réflexion profonde sur les membres non publics : il faut `opens` pour ça, soit déclaré dans module-info.java, soit imposé au lancement avec `--add-opens module/package=ALL-UNNAMED` (ou vers un module précis) comme échappatoire temporaire quand on ne contrôle pas le module-info. Rendre les champs public contournerait le symptôme mais casse l'encapsulation du domaine pour un problème qui concerne la réflexion, pas la compilation."
  - question: "Un jar tiers `gson-2.11.0.jar`, sans `module-info.java`, est placé sur le chemin de modules (`--module-path`) d'une application modulaire. Que devient-il ?"
    choix:
      - "La compilation échoue immédiatement : un jar sans module-info.java ne peut pas être utilisé sur le chemin de modules"
      - "Il devient un module automatique, nommé d'après son manifeste ou son nom de fichier, qui lit tous les autres modules et expose tous ses packages"
      - "Il est automatiquement ignoré et reste accessible uniquement via le classpath"
      - "Il devient le module non nommé de l'application"
    reponse: 1
    explication: "C'est le mécanisme de migration progressive du module system : un jar sans descripteur placé sur le module path devient un **module automatique**. Son nom vient de l'en-tête `Automatic-Module-Name` du manifeste s'il existe, sinon il est dérivé du nom du fichier jar. Il exporte tous ses packages et lit tous les autres modules, contrairement à un module explicite qui doit tout déclarer précisément."
---

## Essentiel

Avant Java 9, tout le code d'une application vivait sur un **classpath plat** : aucune notion de dépendance entre composants, aucun moyen d'exprimer qu'un JAR en dépendait d'un autre, et deux versions différentes de la même bibliothèque pouvaient s'y retrouver sans avertissement (le « JAR hell »). L'encapsulation s'arrêtait au paquet : tout type `public` était accessible depuis n'importe où, y compris les classes internes du JDK jamais censées être utilisées directement.

Le **système de modules** (JPMS, Java Platform Module System, JEP 261, JDK 9) répond à ces deux problèmes. Un module se déclare dans `module-info.java` :

```java
module com.boutique.catalogue {
    requires com.boutique.stock;
    requires transitive java.sql;

    exports com.boutique.catalogue.api;
    opens com.boutique.catalogue.dto to com.fasterxml.jackson.databind;

    uses com.boutique.catalogue.spi.CalculateurRemise;
    provides com.boutique.catalogue.spi.CalculateurRemise
        with com.boutique.catalogue.remise.RemiseStandard;
}
```

`requires` déclare une dépendance explicite ; `exports` rend un package visible aux autres modules ; `opens` autorise en plus la réflexion profonde sur ce package. Le JDK lui-même est entièrement modulaire (`java.base`, `java.sql`, `java.xml`...), ce qui permet une **encapsulation forte** de ses classes internes : tenter d'y accéder par réflexion lève désormais une `InaccessibleObjectException`.

Le **chemin de modules** (`--module-path`) coexiste avec le classpath historique : un jar sans `module-info.java` placé dessus devient un **module automatique** (nommé d'après le manifeste ou le nom de fichier), étape de transition qui permet d'adopter les modules progressivement sans réécrire tout l'écosystème de dépendances d'un coup.

## Détail

### Comment ça marche

À la compilation comme au lancement, la JVM résout un **graphe de modules** : à partir des modules racines demandés, elle suit les `requires` de proche en proche et échoue immédiatement si une dépendance manque ou si deux modules du graphe portent le même nom (conflit détecté tôt, contrairement au classpath qui laissait silencieusement la première classe trouvée l'emporter). Trois catégories de modules coexistent à l'exécution : les **modules nommés** (avec `module-info.java`), les **modules automatiques** (jars sans descripteur sur le module path) et le **module non nommé** (tout ce qui vient du classpath classique). Un module nommé ne peut jamais lire le module non nommé implicitement — c'est précisément ce qui empêche un module applicatif propre de dépendre accidentellement de code non modulaire.

### Exemple 1 — Déclarer et consommer un module

```java
// module-info.java du module com.boutique.catalogue
module com.boutique.catalogue {
    exports com.boutique.catalogue.api;
}
```

```java
// module-info.java du module com.boutique.commande
module com.boutique.commande {
    requires com.boutique.catalogue;
}
```

`com.boutique.commande` peut utiliser les types du package `com.boutique.catalogue.api`, et uniquement ceux-là : les autres packages du module catalogue, même publics, restent invisibles.

### Exemple 2 — requires transitive et le mécanisme de services

```java
module com.boutique.catalogue {
    requires transitive com.boutique.stock;   // propagé aux consommateurs
    exports com.boutique.catalogue.api;

    uses com.boutique.catalogue.spi.CalculateurRemise;
}

module com.boutique.remise.soldes {
    requires com.boutique.catalogue;
    provides com.boutique.catalogue.spi.CalculateurRemise
        with com.boutique.remise.soldes.RemiseSoldes;
}
```

Grâce à `requires transitive`, un module qui fait `requires com.boutique.catalogue` lit aussi `com.boutique.stock` sans le déclarer lui-même. Le mécanisme `uses`/`provides`, chargé via `ServiceLoader.load(CalculateurRemise.class)`, permet d'ajouter une implémentation (ici `RemiseSoldes`) sans que le module consommateur dépende du module qui la fournit — un découplage utile pour des extensions ou des plugins.

### Exemple 3 — Déclaration d'import de module (Java 25)

```java
package q;

import module java.base;   // importe java.lang, java.util, java.io... en une ligne

class Rapport {
    void afficher(List<String> lignes) {
        lignes.forEach(System.out::println);
    }
}
```

Les **déclarations d'import de module** (`import module M;`) sont finalisées par le JEP 511 en **Java 25**. Elles importent en une seule ligne tous les packages exportés par le module cité *et* par les modules qu'il `requires transitive`, à la place d'une longue liste d'imports classiques. C'est purement une commodité d'écriture pour le fichier source qui les utilise : elle n'ajoute aucune dépendance de module supplémentaire au `module-info.java` du projet, et ne fonctionne que pour ce qui est exporté par le module non nommé.

### Exemple 4 — Diagnostiquer avec jdeps

```bash
jdeps --jdk-internals target/classes
```

```
target/classes -> java.base
   com.boutique.util.CacheInterne (target/classes)
      -> sun.misc.Unsafe                       JDK internal API (java.base)
```

`jdeps` analyse les dépendances réelles d'un jar ou d'un dossier de classes compilées, sans avoir besoin de l'exécuter. `--jdk-internals` repère spécifiquement les usages d'API internes du JDK, souvent invisibles jusqu'à ce qu'une montée de version du JDK les supprime ou les encapsule davantage.

### Chemin de modules vs classpath

| | Classpath | Chemin de modules |
|---|---|---|
| Encapsulation | Aucune : tout type `public` est accessible | Forte : seuls les packages `exports`/`opens` sont visibles |
| Détection des conflits | Silencieuse (première classe trouvée gagne) | Immédiate, à la résolution du graphe |
| Jar sans `module-info.java` | Fonctionne normalement (module non nommé) | Devient un module automatique |
| Réflexion sur du privé | Toujours possible | Nécessite `opens` (ou `--add-opens`) |

### Pourquoi peu d'applications se modularisent, contrairement aux bibliothèques et au JDK

Modulariser une application exige que **toutes** ses dépendances soient elles-mêmes des modules nommés ou automatiques cohérents entre eux (pas de « split package », deux jars qui exposent le même nom de package). Dans un écosystème applicatif qui mélange des dizaines de bibliothèques, dont certaines jamais mises à jour vers un vrai `module-info.java`, le coût dépasse souvent le bénéfice pour une application qui n'est de toute façon jamais consommée comme dépendance par un autre module. Les **bibliothèques**, elles, publient un `module-info.java` pour rester de bons citoyens du module system chez leurs consommateurs (accès à `requires transitive`, service loader propre). Le **JDK** lui-même est modulaire depuis toujours pour une raison différente : encapsuler ses classes internes et permettre de construire des images d'exécution réduites avec `jlink` (voir la leçon suivante).

### Pièges courants

> **Confondre `public` et exporté.** Un type `public` dans un package non listé par `exports` reste invisible depuis un autre module — erreur de compilation `package ... is not visible` ou `package ... does not exist`, à ne pas confondre avec une classe absente.

> **`InaccessibleObjectException` sur un framework de réflexion.** Un framework qui inspecte des classes par réflexion (sérialisation, injection) a besoin de `opens`, pas seulement `exports`. `--add-opens module/package=ALL-UNNAMED` au lancement est un contournement acceptable en dépannage ou en migration, pas une solution à généraliser dans le `module-info.java` de production sans réflexion sur ce qu'on ouvre réellement.

> **Split package entre deux jars.** Deux jars qui définissent des classes dans le même nom de package (fréquent avec d'anciennes bibliothèques Java EE éclatées en plusieurs artefacts) ne peuvent pas cohabiter comme modules nommés sur le même chemin de modules : la JVM refuse de résoudre le graphe. Le classpath classique, lui, tolérait ce cas silencieusement.

### À retenir

- `module-info.java` déclare les dépendances (`requires`, `requires transitive`) et ce qui est visible (`exports` en compilation, `opens` en plus pour la réflexion profonde).
- Le mécanisme `uses`/`provides` découple un consommateur de service de son implémentation, chargée via `ServiceLoader`.
- Un jar sans descripteur sur le chemin de modules devient un **module automatique** ; le classpath classique reste le **module non nommé** — deux voies de migration progressive.
- `InaccessibleObjectException` signale une réflexion refusée par l'encapsulation forte ; `--add-opens` est une échappatoire temporaire, pas une solution de conception.
- `jdeps` analyse les dépendances réelles (y compris vers des API internes du JDK) avant de s'engager dans une modularisation.
- Les **déclarations d'import de module** (`import module M;`, JEP 511, finalisées en **Java 25**) simplifient les imports sans changer le graphe de dépendances entre modules.

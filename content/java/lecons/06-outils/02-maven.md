---
id: maven
chapitre: outils
ordre: 2
titre: "Construire avec Maven"
termes:
  - terme: "pom.xml"
    definition: "Fichier XML à la racine du projet qui décrit tout ce dont Maven a besoin : coordonnées du projet, propriétés, dépendances et plugins. C'est le fichier de configuration central d'un projet Maven."
  - terme: "Coordonnées GAV"
    definition: "Triplet **groupId** (organisation, ex. `com.boutique`), **artifactId** (nom du module, ex. `boutique-core`) et **version** qui identifie uniquement un projet ou une dépendance dans un dépôt Maven."
  - terme: "Portée (scope)"
    definition: "Indique à quelle étape une dépendance est nécessaire et si elle finit dans le livrable final : `compile` (défaut), `provided`, `runtime` ou `test`."
  - terme: "Cycle de vie Maven"
    definition: "Suite ordonnée de **phases** (`validate`, `compile`, `test`, `package`, `verify`, `install`…) déclenchées en cascade : lancer une phase exécute automatiquement toutes celles qui la précèdent."
  - terme: "Dépendance transitive"
    definition: "Dépendance apportée automatiquement parce qu'une dépendance déclarée en a elle-même besoin. Maven les résout et les ajoute au classpath sans déclaration explicite de votre part."
  - terme: "mvn dependency:tree"
    definition: "Commande qui affiche l'arbre complet des dépendances (directes et transitives) d'un projet, avec les versions retenues et celles écartées en cas de conflit. Le premier réflexe pour diagnostiquer une version inattendue sur le classpath."
  - terme: Gradle
    definition: "Autre outil de build Java, basé sur un DSL Groovy ou Kotlin plutôt que sur du XML. Plus flexible et souvent plus rapide (démon, cache de build), au prix d'une configuration moins standardisée que celle de Maven."
quiz:
  - question: "Une dépendance est déclarée avec la portée `provided`. Que se passe-t-il concrètement ?"
    code: |
      <dependency>
          <groupId>jakarta.servlet</groupId>
          <artifactId>jakarta.servlet-api</artifactId>
          <version>6.1.0</version>
          <scope>provided</scope>
      </dependency>
    choix:
      - "La dépendance est disponible à la compilation et aux tests, mais absente du jar final : l'environnement d'exécution doit déjà la fournir"
      - "La dépendance n'est utilisée que dans les tests et jamais en production"
      - "Maven refuse de compiler tant que la dépendance n'est pas aussi déclarée en `compile`"
      - "La dépendance est téléchargée mais totalement ignorée par le build"
    reponse: 0
    explication: "`provided` signifie que le code a besoin de cette dépendance pour compiler et s'exécuter, mais qu'elle sera fournie par l'environnement cible (ici, un serveur d'applications qui embarque déjà l'API Servlet) : elle n'est donc pas incluse dans le livrable, contrairement à `compile`."
  - question: "Vous lancez `mvn install` sur un projet. Dans quel ordre les phases du cycle de vie par défaut s'exécutent-elles jusqu'à `install` ?"
    choix:
      - "validate → compile → test → package → verify → install"
      - "compile → validate → test → verify → package → install"
      - "validate → test → compile → package → install → verify"
      - "package → compile → test → validate → verify → install"
    reponse: 0
    explication: "Le cycle de vie par défaut de Maven est strictement ordonné : chaque phase déclenche toutes celles qui la précèdent. `mvn install` exécute donc automatiquement `validate`, `compile`, `test`, `package` et `verify` avant `install` lui-même — c'est pour ça qu'un simple `mvn install` suffit à tout enchaîner."
  - question: "Deux dépendances transitives de votre projet apportent chacune une version différente de la même librairie. Comment Maven choisit-il la version retenue par défaut, et comment le vérifier ?"
    choix:
      - "Il prend toujours la version la plus récente des deux"
      - "Il prend la version la plus proche dans l'arbre des dépendances (chemin le plus court depuis le projet) ; `mvn dependency:tree` permet de voir ce choix et les versions écartées"
      - "Le build échoue automatiquement tant qu'une exclusion n'est pas ajoutée"
      - "Il prend la version déclarée dans le `pom.xml` du projet le plus récemment publié"
    reponse: 1
    explication: "Maven applique la stratégie du **chemin le plus court** (« nearest wins ») : la dépendance la moins profonde dans l'arbre l'emporte ; à profondeur égale, la première déclarée gagne. `mvn dependency:tree` affiche l'arbre entier et marque les versions écartées, ce qui permet de diagnostiquer un conflit avant de forcer une version avec `<dependencyManagement>` ou une `<exclusion>`."
---

## Essentiel

Un projet Maven suit une **structure standard** qui évite toute configuration de chemins :

```
mon-projet/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/          (code source)
    │   └── resources/     (fichiers non-Java : config, templates…)
    └── test/
        ├── java/          (tests)
        └── resources/
```

Le `pom.xml` décrit le projet : ses **coordonnées** (groupId, artifactId, version), ses **dépendances**, et éventuellement des **plugins** qui étendent le build.

```xml
<project>
    <groupId>com.boutique</groupId>
    <artifactId>boutique-core</artifactId>
    <version>1.0.0</version>

    <properties>
        <maven.compiler.release>21</maven.compiler.release>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>6.1.3</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

Maven exécute le build en **phases** ordonnées : `mvn package` compile, teste, puis empaquette (déclenchant automatiquement les phases précédentes). Les dépendances déclarées apportent elles-mêmes des **dépendances transitives** ; `mvn dependency:tree` affiche l'arbre complet pour diagnostiquer un conflit de version.

## Détail

### Comment ça marche

Maven télécharge les dépendances (et les plugins) depuis un **dépôt** — Maven Central par défaut — vers un cache local (`~/.m2/repository`), identifié par les coordonnées GAV. Un build est une suite d'**objectifs** (*goals*) de plugins, rattachés à des **phases** du cycle de vie. Lancer une phase déclenche, dans l'ordre, toutes les phases qui la précèdent : `mvn test` compile d'abord le code, `mvn package` compile et teste avant d'empaqueter.

### Exemple 1 — Les portées de dépendance

| Portée | Disponible à la compilation | Disponible aux tests | Dans le jar/war final | Exemple typique |
|---|---|---|---|---|
| `compile` (défaut) | Oui | Oui | Oui | Une librairie utilisée par le code métier |
| `provided` | Oui | Oui | Non | L'API Servlet fournie par le serveur cible |
| `runtime` | Non | Oui | Oui | Un pilote JDBC, utilisé via une interface sans dépendance directe au code |
| `test` | Non | Oui (uniquement) | Non | JUnit, Mockito |

### Exemple 2 — Le cycle de vie par défaut

```
validate → compile → test → package → verify → install → deploy
```

| Phase | Rôle |
|---|---|
| `validate` | Vérifie que le projet et le `pom.xml` sont corrects |
| `compile` | Compile le code source principal |
| `test` | Exécute les tests unitaires (`src/test/java`) |
| `package` | Produit le livrable (`.jar`, `.war`…) |
| `verify` | Exécute des contrôles supplémentaires (tests d'intégration, qualité) sur le package produit |
| `install` | Copie le livrable dans le dépôt local (`~/.m2`), pour d'autres projets locaux |
| `deploy` | Publie le livrable vers un dépôt distant partagé |

`mvn clean install`, très courant, enchaîne un nettoyage (`target/` supprimé) puis toutes les phases jusqu'à `install`.

### Exemple 3 — Diagnostiquer un conflit de version

```bash
mvn dependency:tree
```

```
com.boutique:boutique-core:jar:1.0.0
├── com.fasterxml.jackson.core:jackson-databind:jar:2.18.0:compile
│   └── com.fasterxml.jackson.core:jackson-core:jar:2.18.0:compile
└── com.boutique:boutique-client:jar:1.0.0:compile
    └── com.fasterxml.jackson.core:jackson-core:jar:2.17.0:compile (omitted for conflict)
```

Ici, `jackson-core` est demandé en deux versions différentes : Maven retient `2.18.0` (chemin le plus court) et écarte `2.17.0`. Pour forcer une version précise, on la déclare explicitement en `<dependencyManagement>`, ou on exclut la version indésirable avec `<exclusions>`.

### Exemple 4 — Configurer la version de Java compilée

```xml
<properties>
    <maven.compiler.release>21</maven.compiler.release>
</properties>
```

La propriété `maven.compiler.release` est la façon recommandée de fixer à la fois la version du langage source et celle du bytecode cible en une seule valeur, en garantissant que l'API utilisée ne dépasse pas cette version (contrairement à l'ancien couple `<source>`/`<target>`, qui pouvait laisser passer une API plus récente que la cible sans avertissement).

### Multi-module et Gradle

Un projet **multi-module** regroupe plusieurs sous-projets (chacun avec son propre `pom.xml`) sous un `pom.xml` parent de type `pom` qui les liste dans une balise `<modules>` et centralise les versions communes.

**Gradle** est l'alternative principale à Maven : configuration en Groovy ou Kotlin (plus concise et programmable que le XML), démon en arrière-plan et cache de build qui accélèrent souvent les builds incrémentaux. Il reste minoritaire face à Maven sur les projets d'entreprise Java classiques, mais domine sur Android et gagne du terrain ailleurs ; le choix dépend surtout des habitudes de l'équipe, les deux étant pleinement viables.

### Pièges courants

> **Oublier la portée `test` sur JUnit ou Mockito.** Sans elle, ces dépendances (et leurs propres dépendances transitives) se retrouvent dans le jar de production, l'alourdissant inutilement.

> **Ne jamais lancer `mvn dependency:tree` avant d'ajouter une exclusion « à l'aveugle ».** Exclure une dépendance transitive sans avoir regardé l'arbre peut casser silencieusement une autre partie du projet qui en avait réellement besoin.

> **Modifier `<source>`/`<target>` sans mettre à jour la version du JDK utilisé pour builder.** `maven.compiler.release` ne change pas le JDK qui exécute Maven lui-même : compiler en `release` 21 avec un JDK 17 installé échoue, il faut bien avoir un JDK 21+ disponible.

### À retenir

- Structure standard : `src/main/java`, `src/main/resources`, `src/test/java`, `src/test/resources`.
- Les coordonnées GAV (groupId, artifactId, version) identifient un projet ou une dépendance sans ambiguïté.
- Les portées `compile`, `provided`, `runtime` et `test` déterminent où une dépendance est disponible et si elle est livrée.
- Le cycle de vie est ordonné : `validate → compile → test → package → verify → install` ; lancer une phase déclenche les précédentes.
- `mvn dependency:tree` révèle les dépendances transitives et les conflits de version résolus par la stratégie du chemin le plus court.

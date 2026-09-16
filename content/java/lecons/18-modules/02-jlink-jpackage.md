---
id: jlink-jpackage
chapitre: modules-deploiement
ordre: 2
titre: "Livrer une application Java"
termes:
  - terme: jlink
    definition: "Outil du JDK qui assemble un sous-ensemble de modules (l'application, ses dépendances, les modules du JDK nécessaires) en une **image d'exécution** autonome : un dossier `bin/`, `lib/`, contenant sa propre JVM, prêt à lancer sans JDK installé sur la machine cible."
  - terme: "Image d'exécution (runtime image)"
    definition: "Résultat de `jlink` : une distribution Java minimale ne contenant que les modules réellement utilisés, au lieu du JDK complet (des centaines de mégaoctets de modules inutiles à l'application)."
  - terme: jpackage
    definition: "Outil du JDK (finalisé par le JEP 392, JDK 16) qui produit un **installeur natif par plateforme** (`.exe`/`.msi` sur Windows, `.dmg`/`.pkg` sur macOS, `.deb`/`.rpm` sur Linux) à partir d'une application et, en option, d'une image d'exécution `jlink`."
  - terme: "app-image"
    definition: "Type de sortie de `jpackage` qui produit un dossier d'application autonome (exécutable + JVM embarquée), sans passer par un format d'installeur système. Sert aussi d'étape intermédiaire avant de construire un vrai installeur."
  - terme: "--print-module-deps"
    definition: "Option de `jdeps` qui liste, au format attendu par `jlink --add-modules`, les modules du JDK réellement utilisés par une application — évite de deviner manuellement quels modules inclure dans l'image d'exécution."
  - terme: "Image native GraalVM"
    definition: "Exécutable compilé en avance de phase (AOT) à partir du bytecode Java, sans JVM embarquée ni JIT au démarrage : startup quasi instantané et empreinte mémoire réduite, au prix d'un monde fermé (réflexion, chargement dynamique de classes) à configurer explicitement et d'un temps de build nettement plus long."
  - terme: "Reproductibilité d'un build"
    definition: "Propriété d'un processus de packaging qui produit un résultat identique (ou au moins fonctionnellement équivalent) à partir des mêmes sources et versions figées de dépendances, indépendamment de la machine ou du moment où il tourne — condition pour qu'une image `jlink`/`jpackage` construite en CI soit fiable à reconstruire en cas d'incident."
quiz:
  - question: "Une application non modulaire (pas de `module-info.java`) dépend de plusieurs jars tiers, eux aussi non modulaires. On veut construire une image d'exécution réduite avec `jlink`. Que se passe-t-il en l'état ?"
    choix:
      - "jlink fonctionne directement : il traite tout jar placé sur le module path comme un module automatique inclus dans l'image"
      - "jlink échoue avec une erreur explicite : il refuse les modules automatiques, il faut d'abord doter l'application et ses dépendances de vrais `module-info.java` (à la main, via `jdeps --generate-module-info`, ou un plugin dédié)"
      - "jlink ignore silencieusement les jars non modulaires et produit une image sans eux"
      - "jlink convertit automatiquement chaque jar non modulaire en module nommé à partir de son nom de fichier"
    reponse: 1
    explication: "Contrairement au lancement classique d'une JVM, jlink refuse explicitement les modules automatiques (« automatic module cannot be used with jlink ») car leurs dépendances réelles ne sont pas déclarées de façon fiable. Il faut un graphe de modules entièrement explicite, obtenu par exemple avec `jdeps --generate-module-info` sur les jars tiers, ou des outils comme les plugins de génération de module-info pour bibliothèques non modulaires."
  - question: "Pour quel type de logiciel l'usage de `jlink`/`jpackage` a-t-il le moins de sens ?"
    choix:
      - "Un outil en ligne de commande distribué à des utilisateurs qui n'ont pas de JDK installé"
      - "Une application de bureau à installer sur des postes Windows/macOS sans prérequis"
      - "Un microservice déployé sur une plateforme d'orchestration où l'image de conteneur est déjà construite à partir d'une base Java existante et redéployée en continu"
      - "Un utilitaire interne distribué en dehors de tout environnement où Java est déjà présent"
    reponse: 2
    explication: "jlink/jpackage ciblent surtout la distribution vers un poste où rien ne garantit la présence d'un JDK : application de bureau, outil en ligne de commande, utilitaire autonome. Un microservice conteneurisé part déjà d'une image de base contenant une JVM et se redéploie via l'orchestrateur ; l'intérêt principal de jlink (réduire ce qu'il faut installer sur la machine cible) est déjà couvert autrement, même si une image jlink minimale peut aussi réduire la taille de l'image de conteneur elle-même."
  - question: "Quelle différence sépare le mieux une image d'exécution `jlink` d'une image native GraalVM ?"
    choix:
      - "Les deux sont strictement identiques, seul le nom de l'outil change"
      - "L'image jlink embarque une JVM complète (bytecode interprété puis compilé à la volée par le JIT au démarrage) ; l'image native GraalVM est un exécutable compilé en avance de phase, sans JIT ni JVM classique, avec un monde fermé à configurer pour la réflexion"
      - "GraalVM ne fait que remplacer le ramasse-miettes utilisé par jlink"
      - "jlink produit toujours un exécutable plus petit que GraalVM, dans tous les cas"
    reponse: 1
    explication: "jlink réduit le nombre de modules embarqués mais la JVM (chargement de classes, JIT, ramasse-miettes classique) reste la même. Une image native GraalVM change de paradigme : compilation ahead-of-time en un exécutable natif, démarrage quasi instantané et empreinte mémoire réduite, mais au prix d'un monde fermé qui exige de déclarer explicitement ce qui utilise la réflexion, le chargement dynamique de classes ou le JNI — un compromis absent avec jlink, qui reste une JVM standard, juste allégée."
---

## Essentiel

Distribuer une application Java, c'est d'abord un **jar exécutable** : une archive dont le manifeste (`META-INF/MANIFEST.MF`) déclare `Main-Class`, lançable par `java -jar app.jar`. Mais cela suppose qu'une JVM soit déjà installée sur la machine cible — un JDK complet pèse plusieurs centaines de mégaoctets, dont l'immense majorité n'est jamais utilisée par une application donnée.

**`jlink`** répond à ce problème en s'appuyant sur le système de modules (voir la leçon précédente) : il assemble uniquement les modules réellement nécessaires — ceux de l'application et les modules du JDK dont elle dépend — en une **image d'exécution** autonome, avec sa propre JVM, prête à lancer sans rien installer d'autre :

```bash
jdeps --print-module-deps mon-app.jar
# java.base,java.sql,java.naming

jlink --module-path mon-app.jar:$JAVA_HOME/jmods \
      --add-modules java.base,java.sql,java.naming,com.boutique.app \
      --output image-app \
      --strip-debug --no-header-files --no-man-pages --compress=2
```

**`jpackage`** va plus loin : à partir d'une application (avec ou sans image `jlink` fournie via `--runtime-image`), il produit un **installeur natif propre à la plateforme** — `.exe`/`.msi` sous Windows, `.dmg`/`.pkg` sous macOS, `.deb`/`.rpm` sous Linux — que l'utilisateur final installe comme n'importe quel logiciel, sans savoir qu'il s'agit de Java.

Ces deux outils ont du sens pour une **application de bureau**, un **outil en ligne de commande** ou une **image de conteneur minimale** ; ils apportent nettement moins pour un microservice classique déployé sur une plateforme déjà équipée d'une JVM. En comparaison plus radicale, une **image native GraalVM** compile le bytecode en avance de phase en un exécutable natif sans JVM embarquée — démarrage quasi instantané, mais un modèle de compilation à monde fermé qui demande une configuration explicite (détaillée dans la formation Spring Boot).

## Détail

### Comment ça marche

`jlink` ne fait pas que copier des fichiers : il exécute la résolution du graphe de modules exactement comme le ferait un lancement classique, puis produit un dossier `bin/`, `lib/`, `conf/` qui *est* une JVM à part entière, réduite aux modules du graphe résolu. L'image obtenue n'est pas un simple zip de dépendances : elle contient un exécutable `java` (ou un lanceur personnalisé via `--launcher`) directement utilisable. `jpackage`, lui, s'appuie en interne sur cette même mécanique (il peut générer sa propre image runtime, ou réutiliser celle fournie via `--runtime-image`) puis l'enveloppe dans le format natif de la plateforme cible — ce qui signifie qu'un installeur `.deb` doit être construit sur Linux, un `.msi` sur Windows : **pas de génération croisée entre plateformes**.

### Exemple 1 — Rappel : jar exécutable et manifeste

```bash
jar --create --file mon-app.jar --main-class com.boutique.app.Main -C target/classes .
java -jar mon-app.jar
```

C'est le point de départ commun à tout ce qui suit : jlink et jpackage packagent toujours, in fine, une application déjà buildable et exécutable de cette façon.

### Exemple 2 — Construire une image d'exécution réduite

```bash
jdeps --print-module-deps mon-app.jar
# java.base,java.logging,java.sql

jlink --add-modules java.base,java.logging,java.sql \
      --output runtime-image \
      --strip-debug --compress=2 --no-header-files --no-man-pages

./runtime-image/bin/java -jar mon-app.jar
```

`jdeps --print-module-deps` évite de deviner manuellement la liste des modules : elle sort directement au format attendu par `--add-modules`. `--strip-debug`, `--no-header-files`, `--no-man-pages` et `--compress=2` réduisent encore la taille de l'image finale.

### Exemple 3 — Produire un installeur avec jpackage

```bash
jpackage --name MonApp \
         --input target/ \
         --main-jar mon-app.jar \
         --main-class com.boutique.app.Main \
         --runtime-image runtime-image \
         --type msi \
         --app-version 1.4.0 \
         --icon mon-app.ico \
         --dest dist/
```

En fournissant l'image `jlink` construite à l'étape précédente via `--runtime-image`, `jpackage` n'a plus qu'à l'envelopper dans l'installeur `.msi` (ici sous Windows), sans regénérer sa propre JVM depuis zéro.

### Exemple 4 — Image native GraalVM en comparaison

```bash
native-image -jar mon-app.jar mon-app-native
./mon-app-native
```

Le résultat démarre en quelques millisecondes, sans phase d'interprétation puis de compilation JIT à chauffer. La contrepartie : tout usage de réflexion, de chargement dynamique de classes ou de proxys dynamiques doit être déclaré explicitement à la construction (fichiers de configuration `reflect-config.json` et équivalents), et le temps de build est nettement plus long qu'une compilation Java classique. Le détail de cette configuration est couvert dans la formation Spring Boot, dont le support GraalVM automatise une bonne partie de cette déclaration.

### Comparatif des options de livraison

| | Jar + JRE existant | Image `jlink` | Installeur `jpackage` | Image native GraalVM |
|---|---|---|---|---|
| JDK/JRE requis sur la cible | Oui | Non (embarqué) | Non (embarqué) | Non (pas de JVM du tout) |
| Démarrage | JIT à chauffer | JIT à chauffer | JIT à chauffer | Quasi instantané |
| Contraintes de build | Aucune | Modules explicites (pas d'automatique) | Idem + build par plateforme cible | Monde fermé à configurer |
| Cas d'usage typique | Serveur déjà équipé d'une JVM | Conteneur minimal, distribution interne | Application de bureau, outil grand public | Démarrage ultra-rapide, CLI, fonctions serverless |

### Pièges courants

> **`jlink` refuse les modules automatiques.** À la différence d'un lancement classique, `jlink` échoue avec « automatic module cannot be used with jlink » si un jar du graphe n'a pas de vrai `module-info.java`. Il faut soit en générer un (`jdeps --generate-module-info`), soit passer par un outil dédié qui ajoute des descripteurs à des bibliothèques tierces non modulaires.

> **Espérer une génération croisée de plateforme.** `jpackage` construit un installeur pour la plateforme sur laquelle il tourne : produire le `.exe` Windows et le `.deb` Linux depuis une seule machine CI nécessite des exécutions séparées sur chaque plateforme cible (ou des runners CI dédiés), pas une seule commande universelle.

> **Considérer jlink/jpackage comme obligatoires pour tout déploiement.** Sur une plateforme conteneurisée où une image de base Java est déjà maîtrisée et redéployée à chaque livraison, le gain de jlink (installer moins de choses sur la machine cible) est marginal comparé au coût de mise en place ; c'est un choix à justifier par un besoin réel (taille d'image, absence de JDK sur la cible), pas un réflexe systématique.

### À retenir

- `jlink` assemble une **image d'exécution** réduite aux modules réellement utilisés, à partir d'un graphe de modules **entièrement explicite** (pas de modules automatiques).
- `jdeps --print-module-deps` évite de deviner la liste des modules à passer à `jlink --add-modules`.
- `jpackage` enveloppe une application (avec sa propre image runtime ou celle fournie par `jlink`) dans un installeur natif par plateforme — à construire séparément sur chaque plateforme cible.
- Ces outils ont le plus de sens pour une application de bureau, un outil en ligne de commande, ou une image de conteneur minimale — moins pour un microservice déjà déployé sur une plateforme équipée d'une JVM.
- L'image native GraalVM change de paradigme (compilation AOT, monde fermé) plutôt que de simplement réduire une JVM classique comme le fait jlink ; le détail de sa mise en œuvre est couvert dans la formation Spring Boot.

---
id: dependances-robustesse
chapitre: securite-robustesse
ordre: 3
titre: "Dépendances et robustesse"
termes:
  - terme: "CVE (Common Vulnerabilities and Exposures)"
    definition: "Identifiant public normalisé (ex. `CVE-2021-44228`) attribué à une vulnérabilité connue et documentée dans un logiciel, y compris dans une bibliothèque tierce utilisée par une application Java. Sert de référence commune entre outils d'analyse, éditeurs et équipes de sécurité."
  - terme: "Dépendance transitive"
    definition: "Bibliothèque qu'un projet utilise indirectement, parce qu'une de ses dépendances directes en dépend elle-même. Le projet peut hériter d'une version vulnérable ou obsolète d'une bibliothèque qu'aucune ligne de son propre `pom.xml`/`build.gradle` ne mentionne explicitement."
  - terme: "Gestion des versions imposées"
    definition: "Mécanisme (`dependencyManagement` en Maven, `constraints`/BOM en Gradle) qui force une version précise pour une dépendance, y compris quand elle n'apparaît que de façon transitive, afin d'écarter explicitement une version connue comme vulnérable ou incompatible."
  - terme: "Nomenclature logicielle (SBOM)"
    definition: "Inventaire structuré (Software Bill of Materials) de tous les composants, avec leurs versions exactes, qui entrent dans la fabrication d'un logiciel livré — de plus en plus demandé pour tracer rapidement l'exposition à une vulnérabilité nouvellement découverte."
  - terme: "Délai d'attente (timeout)"
    definition: "Durée maximale qu'une application s'autorise à attendre la réponse d'un appel distant (base de données, service HTTP, file d'attente) avant d'abandonner explicitement. Son absence transforme la lenteur ou la panne d'une dépendance externe en blocage ou en épuisement de ressources de l'application appelante."
  - terme: "Principe du moindre privilège"
    definition: "Un composant, un processus ou un compte technique ne doit disposer que des droits strictement nécessaires à sa fonction, rien de plus — pour limiter les dégâts possibles si ce composant est compromis ou détourné."
  - terme: SecurityManager
    definition: "Mécanisme historique du JDK conçu pour sandboxer du code (limiter ses accès fichiers, réseau, système). Déprécié pour suppression depuis JDK 17, il est **désactivé et non fonctionnel depuis JDK 24** : activer `-Djava.security.manager` provoque une erreur au lancement, et `System.setSecurityManager()` lève désormais `UnsupportedOperationException`. À ne plus utiliser pour isoler du code dans une application actuelle."
quiz:
  - question: "Une bibliothèque `commons-net` apparaît en version 3.6 dans l'arbre des dépendances Maven du projet, alors qu'aucune ligne du `pom.xml` ne la déclare directement. Comment est-ce possible, et que faire si cette version est connue comme vulnérable ?"
    code: |
      [INFO] +- io.boutique:client-paiement:jar:2.4.0:compile
      [INFO] |  \- commons-net:commons-net:jar:3.6:compile
    choix:
      - "C'est une dépendance transitive apportée par `client-paiement` ; on peut imposer une version corrigée via `dependencyManagement`, même sans dépendre directement de `commons-net`"
      - "C'est une erreur de build, Maven n'inclut jamais de bibliothèque non déclarée explicitement"
      - "Il faut obligatoirement forker le code de `client-paiement` pour changer cette version"
      - "Cette version ne peut pas être changée tant que `client-paiement` n'est pas lui-même mis à jour"
    reponse: 0
    explication: "`client-paiement` dépend de `commons-net` 3.6, qui devient une dépendance transitive du projet. Sans toucher à `client-paiement`, `dependencyManagement` permet d'imposer explicitement une version corrigée de `commons-net` pour tout l'arbre de dépendances — une pratique courante pour écarter une version connue comme vulnérable en attendant une mise à jour de la dépendance directe."
  - question: "Un service `ClientPaiementService` appelle une API bancaire externe via un client HTTP sans aucun délai d'attente configuré. Quel est le risque concret si cette API externe se met à répondre très lentement ?"
    choix:
      - "Les threads qui attendent la réponse restent bloqués indéfiniment ; si l'appel se répète sous forte charge, le pool de threads ou de connexions de l'application appelante finit par être épuisé, ce qui bloque aussi les requêtes qui n'ont rien à voir avec le paiement"
      - "Aucun risque : la JVM interrompt automatiquement tout appel réseau après 30 secondes par défaut"
      - "Le risque ne concerne que l'API externe, jamais l'application appelante"
      - "Le client HTTP du JDK refuse de démarrer un appel sans délai d'attente explicite"
    reponse: 0
    explication: "Sans délai d'attente explicite, la lenteur ou la panne d'une dépendance externe se propage : les threads bloqués en attente d'une réponse ne sont plus disponibles pour d'autres traitements, et une ressource partagée (pool de threads, pool de connexions) peut s'épuiser entièrement, affectant des fonctionnalités sans rapport avec l'appel défaillant. Un délai d'attente explicite sur chaque appel distant transforme une attente indéfinie en échec géré rapidement."
  - question: "Une équipe envisage d'utiliser `SecurityManager` pour isoler l'exécution d'un module tiers dans une application Java 25 nouvellement développée. Est-ce une approche viable ?"
    choix:
      - "Non : `SecurityManager` est désactivé et non fonctionnel depuis JDK 24, son activation provoque une erreur au lancement ; il faut envisager une isolation au niveau du système d'exploitation ou des conteneurs"
      - "Oui, c'est toujours l'approche recommandée par Oracle pour isoler du code dans une application Java moderne"
      - "Oui, à condition d'ajouter la dépendance Maven `java.security.manager` absente du JDK par défaut"
      - "Non, car `SecurityManager` a été entièrement supprimé du code source du JDK depuis JDK 21"
    reponse: 0
    explication: "`SecurityManager` a été dépréciée pour suppression dès JDK 17 (JEP 411), puis rendue non fonctionnelle depuis JDK 24 (JEP 486) : `System.setSecurityManager()` lève désormais `UnsupportedOperationException`, et le lancer via `-Djava.security.manager` échoue au démarrage. Elle n'est pas encore totalement retirée du code source du JDK (un stub minimal subsiste pour compatibilité), mais elle est inutilisable pour un nouveau besoin d'isolation — qui doit se reposer sur des mécanismes au niveau du système d'exploitation ou des conteneurs."
---

## Essentiel

Une application Java moderne s'appuie sur des dizaines, voire des centaines de bibliothèques tierces — directes et **transitives** (celles que ces bibliothèques utilisent elles-mêmes). Chacune fait partie de la surface d'attaque : une vulnérabilité connue (**CVE**) dans une dépendance profondément enfouie dans l'arbre affecte l'application, même si aucune ligne de son propre code n'en parle explicitement.

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>commons-net</groupId>
      <artifactId>commons-net</artifactId>
      <version>3.11.1</version> <!-- version corrigée imposée, même en usage transitif -->
    </dependency>
  </dependencies>
</dependencyManagement>
```

La meilleure protection reste la plus simple : garder les versions à jour et lire les notes de version avant de monter en version, pour repérer les correctifs de sécurité comme les changements de comportement. Un outil d'analyse des dépendances (intégré à la plateforme de forge, ou dédié) signale les CVE connues dans l'arbre de dépendances, y compris transitives. Une **nomenclature logicielle** (SBOM) — l'inventaire exact des composants et versions livrés — accélère la réaction quand une vulnérabilité nouvelle est annoncée dans une bibliothèque largement répandue : la faille de journalisation largement médiatisée fin 2021 a montré à quelle vitesse une bibliothèque de journalisation quasi universelle peut devenir un point d'exposition massif, et pourquoi un inventaire précis des dépendances (directes et transitives) est précieux pour réagir vite.

La robustesse ne s'arrête pas aux dépendances : délais d'attente sur tout appel distant, limites de ressources explicites, ne jamais faire confiance à une valeur par défaut sans l'avoir vérifiée.

## Détail

### Exemple 1 — Délai d'attente sur un appel distant

```java
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(3))
    .build();

HttpRequest requete = HttpRequest.newBuilder(URI.create(urlServicePaiement))
    .timeout(Duration.ofSeconds(5))
    .GET()
    .build();

HttpResponse<String> reponse = client.send(requete, HttpResponse.BodyHandlers.ofString());
```

`connectTimeout` borne l'établissement de la connexion, `timeout` sur la requête borne l'attente de la réponse complète. Sans ces réglages explicites, un service externe qui répond lentement ou plus du tout peut bloquer indéfiniment le thread appelant — et, sous charge, épuiser tout un pool de threads ou de connexions pour une panne qui ne concerne au départ qu'une seule dépendance externe.

### Exemple 2 — Limiter les ressources plutôt que d'espérer qu'elles suffisent

```java
ExecutorService pool = new ThreadPoolExecutor(
    4, 16,
    60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(200),          // file bornée : pas de croissance illimitée
    new ThreadPoolExecutor.CallerRunsPolicy() // dégrade au lieu de perdre silencieusement des tâches
);
```

Un pool de threads non borné, ou une file d'attente sans limite, peut sembler fonctionner en développement et s'effondrer en production sous une charge inattendue (import massif, pic de commandes). Fixer des bornes explicites, avec une politique de repli définie, transforme un effondrement en dégradation contrôlée.

### Exemple 3 — Ne pas faire confiance à une valeur par défaut

```java
// Risqué : si la propriété est absente, la limite par défaut peut être trop permissive, voire absente.
int tailleMaxImport = Integer.parseInt(configuration.getProperty("import.taille-max-lignes"));

// Plus sûr : une valeur par défaut choisie et documentée, pas celle d'un cadre tiers.
int tailleMaxImport = Integer.parseInt(
    configuration.getProperty("import.taille-max-lignes", "10000"));
```

Un cadre applicatif, un pilote de base de données ou une bibliothèque HTTP a presque toujours des valeurs par défaut — délai d'attente, taille de pool, niveau de journalisation. Elles sont choisies pour convenir au plus grand nombre de cas, pas nécessairement pour l'exigence de robustesse ou de sécurité d'une application donnée : mieux vaut les connaître, les fixer explicitement, et les documenter.

### Exemple 4 — Moindre privilège au déploiement

```dockerfile
FROM eclipse-temurin:25-jre
RUN useradd --system --uid 1000 appboutique
USER appboutique
COPY --chown=appboutique target/boutique.jar /app/boutique.jar
ENTRYPOINT ["java", "-jar", "/app/boutique.jar"]
```

Exécuter le processus avec un utilisateur système dédié, sans droit root, limite ce qu'un composant compromis peut faire sur la machine hôte. Le principe s'applique à tous les niveaux : compte de base de données de l'application limité aux opérations dont elle a réellement besoin, jeton d'API restreint au périmètre strict d'un service, et non un compte administrateur partagé par commodité.

### Repères de robustesse

| Pratique | Ce qu'elle évite |
|---|---|
| Délai d'attente sur chaque appel distant | Une dépendance lente ou en panne qui bloque l'application appelante |
| Limites de ressources explicites (pool, file, taille de fichier) | Un pic de charge qui épuise la mémoire ou les threads disponibles |
| Versions à jour, notes de version lues | Une vulnérabilité corrigée ailleurs mais toujours présente localement |
| Versions imposées sur les dépendances transitives | Une bibliothèque vulnérable héritée indirectement, invisible dans les dépendances directes |
| Moindre privilège (compte, jeton, utilisateur système) | L'ampleur des dégâts si un composant est compromis |
| Revue avant mise en production | Une régression de sécurité ou de configuration qui passe inaperçue |

### Pièges courants

Cette section reprend des pièges de robustesse à l'échelle du système, au-delà de la seule dépendance :

> **Monter en version sans lire les notes de version.** Une mise à jour de sécurité peut s'accompagner d'un changement de comportement (valeur par défaut modifiée, API dépréciée retirée). L'appliquer sans lecture préalable échange un risque de sécurité contre un risque de régression fonctionnelle — les deux méritent d'être anticipés, pas subis.

> **Ne scanner les dépendances qu'une fois, au début du projet.** De nouvelles CVE sont publiées en continu sur des bibliothèques déjà en production depuis longtemps. L'analyse des dépendances doit s'intégrer au pipeline de build ou d'intégration continue, de façon répétée, pas être un contrôle ponctuel.

> **Considérer une dépendance transitive comme hors de portée.** « Ce n'est pas nous qui l'avons choisie » n'empêche pas une bibliothèque transitive vulnérable d'affecter l'application. La gestion des versions imposées permet d'agir dessus sans attendre une mise à jour de la dépendance directe qui l'a introduite.

### À retenir

- L'arbre complet des dépendances — directes et transitives — fait partie de la surface d'attaque de l'application, pas seulement ce qui est déclaré explicitement.
- Garder les versions à jour, lire les notes de version, et imposer des versions corrigées sur les dépendances transitives quand c'est nécessaire.
- Une nomenclature logicielle (SBOM) accélère la réaction quand une vulnérabilité est annoncée sur une bibliothèque largement utilisée.
- La robustesse dépasse la sécurité au sens strict : délais d'attente sur tout appel distant, limites de ressources explicites, méfiance envers les valeurs par défaut, principe du moindre privilège, revue avant mise en production.
- `SecurityManager` est désactivé et non fonctionnel depuis JDK 24 : ne pas s'appuyer dessus pour isoler du code, envisager une isolation au niveau du système d'exploitation ou des conteneurs.

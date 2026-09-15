---
id: docker-deploiement
chapitre: production
ordre: 3
titre: "Conteneuriser et déployer"
termes:
  - terme: "spring-boot:build-image"
    definition: "Objectif Maven/Gradle qui construit une **image de conteneur** directement à partir du projet, sans écrire de `Dockerfile`, grâce aux **Cloud Native Buildpacks**. Les buildpacks détectent le type de projet, choisissent une image de base adaptée et découpent automatiquement le résultat en couches."
  - terme: Jar en couches (layered jar)
    definition: "Organisation du jar exécutable en **groupes de fichiers** (dépendances, dépendances « snapshot », ressources de l'application, classes de l'application) plutôt qu'en une archive monolithique. Un `Dockerfile` multi-étapes peut alors copier chaque groupe dans une couche Docker distincte, activé par défaut sur les projets récents ou via le plugin Spring Boot."
  - terme: Dockerfile multi-étapes (multi-stage build)
    definition: "Dockerfile qui enchaîne plusieurs étapes `FROM` : une étape de build (compilation, extraction des couches) dont seul le résultat utile est copié dans l'étape finale, plus légère. Évite d'embarquer l'outillage de build (JDK complet, Maven) dans l'image de production."
  - terme: Arrêt gracieux (graceful shutdown)
    definition: "Comportement où, à réception du signal d'arrêt, le serveur cesse d'accepter de **nouvelles** requêtes mais laisse les requêtes **en cours** se terminer, dans la limite d'un délai configurable (`spring.lifecycle.timeout-per-shutdown-phase`), avant de couper. Contrôlé par `server.shutdown` : `graceful` est la valeur par défaut depuis Spring Boot 3.4 ; avant, il fallait l'activer explicitement (le défaut était `immediate`)."
  - terme: Sondes liveness / readiness
    definition: "Endpoints Actuator (`/actuator/health/liveness` et `/actuator/health/readiness`) interrogés par l'orchestrateur (Kubernetes typiquement) : *liveness* indique si l'instance doit être redémarrée, *readiness* si elle doit recevoir du trafic. Activés automatiquement dans un environnement Kubernetes détecté, ou forcés avec `management.endpoint.health.probes.enabled=true`."
  - terme: "-XX:MaxRAMPercentage"
    definition: "Option JVM qui dimensionne le tas en **pourcentage** de la mémoire détectée du conteneur, plutôt qu'en valeur fixe (`-Xmx`). Elle s'adapte automatiquement si la limite mémoire du conteneur change, contrairement à une valeur figée qui reste correcte ou non selon l'environnement de déploiement."
quiz:
  - question: "Pourquoi un Dockerfile multi-étapes qui copie séparément les couches d'un jar en couches améliore-t-il le temps de build en CI, par rapport à `COPY app.jar` suivi d'un `RUN`?"
    code: |
      FROM eclipse-temurin:21-jre AS build
      COPY app.jar app.jar
      RUN java -Djarmode=tools -jar app.jar extract --destination extracted

      FROM eclipse-temurin:21-jre
      COPY --from=build extracted/dependencies/ ./
      COPY --from=build extracted/spring-boot-loader/ ./
      COPY --from=build extracted/snapshot-dependencies/ ./
      COPY --from=build extracted/application/ ./
      ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
    choix:
      - "Docker recompile toujours l'intégralité de l'image, la structure en couches n'a aucun effet"
      - "Les dépendances (qui changent rarement) occupent une couche distincte du code applicatif (qui change à chaque build) : Docker réutilise le cache des couches inchangées et ne reconstruit que la couche modifiée"
      - "Cela réduit uniquement la taille finale de l'image, sans effet sur la vitesse de build"
      - "Cela permet de builder l'image sans JDK, à partir du seul jar"
    reponse: 1
    explication: "Le cache Docker fonctionne couche par couche : si les dépendances n'ont pas changé depuis le build précédent, Docker réutilise la couche en cache et ne recopie/reconstruit que ce qui a réellement changé (le code applicatif, en général la dernière couche). Sans ce découpage, la moindre modification du code invaliderait une seule grosse couche contenant tout, dépendances comprises."
  - question: "Le conteneur reçoit un signal d'arrêt (SIGTERM) alors que `server.shutdown=graceful` est activé et qu'une requête est en cours de traitement. Que se passe-t-il ?"
    choix:
      - "Le serveur coupe immédiatement toutes les connexions, y compris celle en cours"
      - "Le serveur refuse désormais les nouvelles requêtes, mais laisse la requête en cours se terminer normalement, dans la limite du délai configuré"
      - "Le signal est ignoré tant qu'une requête est en cours, quelle que soit sa durée"
      - "Le serveur redémarre automatiquement pour terminer la requête"
    reponse: 1
    explication: "C'est le principe de l'arrêt gracieux : cesser d'accepter du nouveau trafic tout en laissant le travail en cours se terminer proprement, dans la limite de `spring.lifecycle.timeout-per-shutdown-phase` (au-delà, l'arrêt est forcé). Sans ce réglage, un déploiement (rolling update) peut couper des requêtes en plein traitement, ce qui se traduit par des erreurs côté client au moment même où une nouvelle version est déployée."
  - question: "Pourquoi préférer `-XX:MaxRAMPercentage=75.0` à `-Xmx512m` fixé en dur dans l'image d'un conteneur ?"
    choix:
      - "Les deux options sont strictement équivalentes en pratique"
      - "`-Xmx` fixe ne s'adapte pas si la limite mémoire du conteneur change (environnements différents, mise à l'échelle) ; `MaxRAMPercentage` recalcule le tas en fonction de la mémoire réellement détectée"
      - "`-XX:MaxRAMPercentage` désactive complètement le ramasse-miettes"
      - "`-Xmx` n'est plus supporté par les JVM récentes exécutées en conteneur"
    reponse: 1
    explication: "Une valeur fixe (`-Xmx512m`) reste correcte tant que la limite mémoire du conteneur ne change pas, mais devient soit trop généreuse (gaspillage), soit trop juste (risque d'OOMKill par l'orchestrateur) dès que l'environnement diffère. `MaxRAMPercentage` s'appuie sur la détection de la mémoire allouée au conteneur (limite cgroup) pour dimensionner le tas en proportion, ce qui suit automatiquement les changements de limite entre environnements."
---

## Essentiel

Deux façons courantes de conteneuriser une application Spring Boot :

**Sans Dockerfile**, avec les Cloud Native Buildpacks :

```bash
mvn spring-boot:build-image
```

Cette commande construit une image directement à partir du build, sans écrire de `Dockerfile` : les buildpacks choisissent l'image de base, installent le JDK, et découpent automatiquement le résultat en couches.

**Avec un Dockerfile multi-étapes**, en s'appuyant sur le **jar en couches** :

```dockerfile
FROM eclipse-temurin:21-jre AS build
COPY app.jar app.jar
RUN java -Djarmode=tools -jar app.jar extract --destination extracted

FROM eclipse-temurin:21-jre
COPY --from=build extracted/dependencies/ ./
COPY --from=build extracted/application/ ./
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

L'outil d'extraction des couches (et l'option `-Djarmode=...` exacte) a évolué au fil des versions de Spring Boot 3 : vérifiez la commande recommandée pour la version utilisée. Le principe reste stable : séparer les **dépendances** (qui changent rarement) du **code applicatif** (qui change à chaque build) en couches Docker distinctes, pour que le cache Docker ne reconstruise que ce qui a réellement changé.

En production, penser aussi à : configurer par **variables d'environnement**, activer l'**arrêt gracieux** (`server.shutdown=graceful`), exposer les **sondes** liveness/readiness pour l'orchestrateur, dimensionner la JVM avec `-XX:MaxRAMPercentage`, et **ne jamais faire tourner le conteneur en root**.

## Détail

### Configuration par variables d'environnement

Spring Boot lit les variables d'environnement comme source de configuration (avec la même précédence que les propriétés système) : `SPRING_DATASOURCE_URL` correspond à `spring.datasource.url`. C'est le mécanisme naturel pour faire varier la configuration entre environnements (dev, staging, production) sans reconstruire l'image ni y intégrer de secrets.

```bash
docker run -e SPRING_PROFILES_ACTIVE=production \
           -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/boutique \
           -e SPRING_DATASOURCE_PASSWORD=... \
           mon-image
```

### Exemple 1 — Arrêt gracieux

```yaml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 20s
```

À l'arrêt (SIGTERM envoyé par l'orchestrateur avant de tuer le conteneur), le serveur refuse les nouvelles requêtes mais laisse les requêtes en cours se terminer, dans la limite de 20 secondes ici. Indispensable lors d'un déploiement en continu (rolling update) : sans cela, des requêtes en cours de traitement peuvent être coupées brutalement au moment précis où une nouvelle version prend le relais.

### Exemple 2 — Sondes liveness et readiness

```yaml
management:
  endpoint:
    health:
      probes:
        enabled: true
  endpoints:
    web:
      exposure:
        include: health
```

```yaml
# extrait de manifeste Kubernetes
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
```

*Liveness* répond « l'instance est bloquée, redémarre-la ». *Readiness* répond « l'instance n'est pas encore prête à recevoir du trafic » (par exemple pendant l'initialisation d'un cache). Les confondre est une source classique de redémarrages en boucle : un service temporairement indisponible en aval (base de données injoignable un instant) ne devrait dégrader que la readiness, pas la liveness.

### Exemple 3 — Dimensionner la JVM dans un conteneur

```dockerfile
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
```

La JVM détecte la limite mémoire imposée au conteneur (via les cgroups) et dimensionne le tas en proportion de cette limite plutôt qu'en valeur absolue. Une valeur fixe (`-Xmx512m`) écrite en dur dans l'image doit être révisée chaque fois que la limite mémoire du conteneur change ; un pourcentage s'adapte automatiquement.

### Exemple 4 — Ne pas exécuter en root

```dockerfile
FROM eclipse-temurin:21-jre
RUN useradd --uid 1000 appuser
USER appuser
COPY --chown=appuser:appuser app.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Exécuter le processus applicatif avec un utilisateur non privilégié limite l'impact d'une faille exploitée dans le conteneur (moins de droits pour l'attaquant). Les images générées par `spring-boot:build-image` via les buildpacks appliquent déjà un tel principe par défaut.

### Build-image vs Dockerfile

| | `spring-boot:build-image` | Dockerfile multi-étapes |
|---|---|---|
| Nécessite d'écrire un Dockerfile | non | oui |
| Contrôle fin de chaque couche | limité (délégué aux buildpacks) | total |
| Bonnes pratiques (utilisateur non-root, découpage en couches) | appliquées par défaut | à la charge du projet |
| Personnalisation avancée (paquets système, étapes custom) | plus limité | complet |

### Pièges courants

> **Copier tout le jar en une seule couche Docker.** `COPY app.jar app.jar` suivi d'un `RUN` place tout — dépendances comprises — dans une seule couche : la moindre modification du code invalide le cache de cette couche entière, y compris les dépendances qui n'ont pas changé. Extraire le jar en couches avant de le copier permet à Docker de ne reconstruire que la couche réellement modifiée.

> **Oublier l'arrêt gracieux avant un déploiement en continu.** Sur une version antérieure à Spring Boot 3.4 (ou si `server.shutdown=immediate` a été configuré), chaque déploiement coupe abruptement les requêtes en cours sur les instances arrêtées : des erreurs visibles côté client, précisément au moment où on déploie le plus souvent (donc le plus souvent visibles en production).

> **Fixer `-Xmx` en dur sans tenir compte de la limite du conteneur.** Une valeur trop haute par rapport à la limite mémoire du conteneur mène à un `OOMKilled` par l'orchestrateur (le conteneur dépasse sa limite et est tué, pas la JVM qui lève une `OutOfMemoryError` propre) ; une valeur trop basse gaspille de la mémoire allouée mais inutilisée. `-XX:MaxRAMPercentage` suit automatiquement la limite réelle.

### À retenir

- `spring-boot:build-image` conteneurise sans Dockerfile via les Cloud Native Buildpacks ; un Dockerfile multi-étapes donne plus de contrôle, notamment sur le jar en couches.
- Le **jar en couches** sépare dépendances et code applicatif : le cache Docker ne reconstruit que ce qui a réellement changé entre deux builds.
- **Arrêt gracieux** (`server.shutdown=graceful` + `timeout-per-shutdown-phase`) : indispensable pour des déploiements sans coupure de requêtes en cours.
- **Sondes liveness/readiness** : à ne pas confondre — liveness pour « redémarre-moi », readiness pour « ne m'envoie pas de trafic pour l'instant ».
- `-XX:MaxRAMPercentage` s'adapte à la limite mémoire réelle du conteneur, contrairement à un `-Xmx` fixe ; exécuter le conteneur avec un utilisateur non-root.

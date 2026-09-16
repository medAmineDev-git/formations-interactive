---
id: jvm-conteneur
chapitre: modules-deploiement
ordre: 3
titre: "La JVM dans un conteneur"
termes:
  - terme: "-XX:+UseContainerSupport"
    definition: "Option JVM activée **par défaut** qui fait détecter à la JVM les limites CPU et mémoire imposées par les cgroups Linux du conteneur, plutôt que celles de la machine hôte. Introduite en Java 10 puis rétroportée en Java 8u191."
  - terme: "-XX:MaxRAMPercentage"
    definition: "Option JVM qui dimensionne le tas maximal en **pourcentage** de la mémoire détectée du conteneur, au lieu d'une valeur fixe (`-Xmx`). S'adapte automatiquement si la limite mémoire du conteneur change entre environnements, sans reconstruire l'image."
  - terme: "cgroups v1 / v2"
    definition: "Deux générations du mécanisme Linux de limitation de ressources (CPU, mémoire) utilisé par les conteneurs. La JVM détecte et prend en charge les deux depuis Java 15 (support rétroporté ensuite vers des versions LTS antérieures)."
  - terme: "Mémoire hors tas (off-heap)"
    definition: "Mémoire native utilisée par la JVM en dehors du tas dimensionné par `-Xmx`/`MaxRAMPercentage` : metaspace, piles de threads, code compilé par le JIT, buffers directs (`ByteBuffer.allocateDirect`), structures internes du ramasse-miettes. Non comptée par les options qui dimensionnent seulement le tas."
  - terme: "OOMKilled"
    definition: "Terminaison d'un conteneur par le noyau Linux (OOM killer) ou l'orchestrateur quand sa consommation mémoire totale dépasse la limite fixée, indépendamment de l'état interne du tas Java. Se distingue d'une `OutOfMemoryError` propre levée par la JVM elle-même."
  - terme: "Arrêt propre sur signal"
    definition: "Comportement attendu d'un processus qui, à réception de SIGTERM, termine son travail en cours puis s'arrête de lui-même avant l'expiration du délai de grâce, plutôt que d'être tué abruptement (SIGKILL) par l'orchestrateur."
  - terme: "Runtime.availableProcessors()"
    definition: "Méthode qui reflète, depuis la détection des cgroups, le nombre de processeurs alloués au **conteneur** (quota CPU), pas celui de la machine hôte. Une valeur historiquement source d'erreurs de dimensionnement (pools de threads, `ForkJoinPool.commonPool()`) avant que cette détection n'existe."
quiz:
  - question: "Un `Dockerfile` définit `CMD java -jar app.jar` (forme shell). À la réception d'un SIGTERM par l'orchestrateur lors d'un redéploiement, que se passe-t-il en pratique ?"
    code: |
      FROM eclipse-temurin:25-jre
      COPY app.jar app.jar
      CMD java -jar app.jar
    choix:
      - "Le processus java reçoit directement le SIGTERM et exécute ses shutdown hooks normalement"
      - "Un shell (/bin/sh -c) devient le processus 1 du conteneur et reçoit le SIGTERM ; il ne le transmet pas automatiquement au processus java qu'il a lancé, qui n'est arrêté qu'au SIGKILL forcé après le délai de grâce"
      - "Le conteneur ignore totalement le SIGTERM tant que la JVM tourne"
      - "Docker convertit automatiquement le SIGTERM en un appel propre à System.exit() dans le processus java"
    reponse: 1
    explication: "La forme shell (`CMD java -jar app.jar`, sans crochets) exécute la commande via `/bin/sh -c \"...\"`, qui devient PID 1 et ne relaie pas automatiquement les signaux à ses processus enfants. Le processus java ne voit jamais le SIGTERM, ses shutdown hooks ne s'exécutent pas, et l'orchestrateur finit par envoyer un SIGKILL après le délai de grâce — un arrêt brutal, pas un arrêt propre. La forme exec (`CMD [\"java\", \"-jar\", \"app.jar\"]`) fait de java le PID 1 et évite ce piège."
  - question: "Un conteneur Java est tué (OOMKilled) par l'orchestrateur alors que les métriques internes montrent un tas largement sous la limite fixée par `-Xmx`/`MaxRAMPercentage`. Quelle est l'explication la plus probable ?"
    choix:
      - "Le ramasse-miettes ne fonctionne plus correctement au-delà d'une certaine limite mémoire"
      - "La consommation mémoire totale du conteneur dépasse sa limite à cause de la mémoire hors tas (metaspace, piles de threads, buffers directs, structures natives du GC), que -Xmx ne borne pas"
      - "OOMKilled ne peut jamais se produire tant que le tas Java n'est pas saturé, il s'agit forcément d'un bug de l'orchestrateur"
      - "-Xmx borne toute la mémoire du processus java, y compris la mémoire native, donc ce scénario est impossible"
    reponse: 1
    explication: "-Xmx (ou -XX:MaxRAMPercentage) ne dimensionne que le tas. Le processus java consomme aussi de la mémoire hors tas : metaspace, piles de chaque thread, code compilé par le JIT, buffers directs, structures internes du GC. Si la somme dépasse la limite mémoire du conteneur, le noyau (ou l'orchestrateur) tue le conteneur indépendamment de l'état du tas — d'où l'importance de laisser une marge entre la limite du conteneur et le pourcentage alloué au tas, et de surveiller la mémoire native, pas seulement le tas."
  - question: "Depuis quand la JVM détecte-t-elle les limites CPU et mémoire imposées par les cgroups d'un conteneur, plutôt que celles de la machine hôte ?"
    choix:
      - "Depuis toujours, cette détection existe dans toutes les versions de Java"
      - "Depuis Java 10 (introduction), avec un rétroportage vers Java 8u191 ; le support des deux générations de cgroups (v1 et v2) a suivi, à partir de Java 15"
      - "Seulement depuis Java 21, avec les threads virtuels"
      - "Jamais automatiquement : il faut toujours fixer manuellement -Xmx et le nombre de threads en fonction des limites du conteneur"
    reponse: 1
    explication: "Avant Java 10 (et son rétroportage en 8u191), la JVM voyait les ressources de la machine hôte entière, pas celles allouées au conteneur — un piège classique de dimensionnement (tas ou pools de threads bien trop généreux). -XX:+UseContainerSupport, activé par défaut depuis, corrige cela ; le support de cgroups v2 en plus de v1 est arrivé avec Java 15."
---

## Essentiel

Avant Java 10 (et son rétroportage en Java 8u191), une JVM lancée dans un conteneur voyait les ressources de la **machine hôte entière** : un conteneur limité à 1 Go de mémoire sur un hôte qui en a 64 pouvait voir une JVM dimensionner son tas par défaut bien au-delà de sa limite réelle, menant à un arrêt brutal par le noyau. Depuis, `-XX:+UseContainerSupport` (activé par défaut) fait détecter à la JVM les limites CPU et mémoire des **cgroups** Linux du conteneur — cgroups v1 et v2 sont tous deux pris en charge depuis Java 15.

Cette détection change directement une pratique de dimensionnement : plutôt qu'un `-Xmx512m` fixe à réviser à chaque changement de limite mémoire du conteneur, `-XX:MaxRAMPercentage=75.0` dimensionne le tas en **pourcentage** de la mémoire réellement détectée, et suit automatiquement l'environnement de déploiement.

```dockerfile
FROM eclipse-temurin:25-jre
COPY app.jar app.jar
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70.0", "-jar", "app.jar"]
```

Trois points à ne pas négliger en conteneur : l'**image de base** (un JRE minimal ou une image `jlink` réduite pèse et démarre mieux qu'un JDK complet), l'**arrêt propre** sur SIGTERM (forme exec de `CMD`/`ENTRYPOINT`, pas la forme shell, pour que le processus java soit bien PID 1 et reçoive le signal), et la **journalisation** sur la sortie standard plutôt que dans des fichiers, pour rester compatible avec la collecte de logs de l'orchestrateur. Le démarrage à froid et le préchauffage du JIT sont traités dans le chapitre Performance.

## Détail

### Comment ça marche

`-XX:+UseContainerSupport` lit les fichiers exposés par les cgroups (`/sys/fs/cgroup/memory/...` en v1, `/sys/fs/cgroup/memory.max` en v2, entre autres) pour connaître la limite mémoire et le quota CPU réellement alloués au conteneur, et en déduit à la fois la mémoire disponible pour `MaxRAMPercentage` et la valeur retournée par `Runtime.getRuntime().availableProcessors()`. Cette dernière valeur est utilisée par de nombreux mécanismes internes par défaut — taille du `ForkJoinPool.commonPool()`, nombre de threads GC — ce qui rend la détection correcte des limites du conteneur importante bien au-delà du seul dimensionnement du tas.

### Exemple 1 — Choisir une image de base adaptée

```dockerfile
# Option simple : JRE complet
FROM eclipse-temurin:25-jre
COPY app.jar app.jar
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70.0", "-jar", "app.jar"]
```

```dockerfile
# Option réduite : image jlink construite en amont (voir leçon précédente)
FROM debian:trixie-slim
COPY runtime-image /opt/runtime
COPY app.jar /opt/app.jar
ENTRYPOINT ["/opt/runtime/bin/java", "-XX:MaxRAMPercentage=70.0", "-jar", "/opt/app.jar"]
```

Un JRE complet reste le choix le plus simple et le plus courant ; une image `jlink` réduite aux modules réellement utilisés diminue encore la taille et la surface de l'image, au prix d'un pipeline de build plus élaboré (voir la leçon précédente).

### Exemple 2 — Dimensionner le tas en pourcentage

```dockerfile
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70.0", "-XX:InitialRAMPercentage=50.0", "-jar", "app.jar"]
```

Laisser une marge entre la limite mémoire du conteneur et le pourcentage alloué au tas (ici 70 %, pas 95 %) réserve de la place pour la mémoire hors tas — metaspace, piles de threads, buffers directs — qui n'est pas comptée dans ce pourcentage. Une valeur trop proche de 100 % expose au même risque d'`OOMKilled` qu'un `-Xmx` fixe mal calibré.

### Exemple 3 — Arrêt propre sur signal

```dockerfile
# À éviter : forme shell, /bin/sh devient PID 1
CMD java -jar app.jar

# À privilégier : forme exec, java devient PID 1 et reçoit directement les signaux
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```java
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    executorService.shutdown();
    try {
        if (!executorService.awaitTermination(20, TimeUnit.SECONDS)) {
            executorService.shutdownNow();
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
}));
```

Sans la forme exec, le SIGTERM envoyé par l'orchestrateur n'atteint jamais le processus java : celui-ci n'est arrêté qu'au SIGKILL forcé après le délai de grâce, sans laisser aux shutdown hooks la moindre chance de s'exécuter — connexions coupées net, travail en cours perdu.

### Exemple 4 — Surveiller une JVM en conteneur

```bash
# Métriques ponctuelles depuis l'intérieur du conteneur
jcmd 1 VM.uptime
jcmd 1 GC.heap_info
jcmd 1 Thread.print

# Enregistrement continu avec Java Flight Recorder
java -XX:StartFlightRecording=filename=app.jfr,duration=60s -jar app.jar
```

Au minimum, suivre l'utilisation du tas et des générations, la fréquence et la durée des pauses du ramasse-miettes, et le nombre de threads actifs, en plus de la mémoire **totale** du conteneur (pas seulement celle rapportée par la JVM comme tas) pour repérer une dérive de la mémoire hors tas avant qu'elle ne déclenche un `OOMKilled`.

### Pièges courants

> **`CMD` en forme shell, signal jamais reçu.** `CMD java -jar app.jar` fait d'un shell le PID 1 du conteneur, qui ne relaie pas automatiquement le SIGTERM au processus java lancé en enfant. Utiliser la forme exec (`ENTRYPOINT ["java", "-jar", "app.jar"]`) pour que java soit directement PID 1.

> **`OOMKilled` malgré un tas qui semble correct.** `-Xmx`/`MaxRAMPercentage` ne bornent que le tas, pas le metaspace, les piles de threads, le code JIT ni les buffers directs. Une consommation totale du processus qui dépasse la limite du conteneur se traduit par un `OOMKilled` du noyau, sans qu'aucune `OutOfMemoryError` propre n'apparaisse dans les journaux de l'application — le symptôme le plus trompeur de ce chapitre.

> **JDK ancien (avant 10, ou avant 8u191) qui voit les ressources de l'hôte.** Sans `-XX:+UseContainerSupport`, un dimensionnement par défaut basé sur la mémoire ou le nombre de cœurs de la machine hôte entière peut largement dépasser la limite réelle du conteneur. Ce n'est plus un risque avec une version récente du JDK, où cette option est activée par défaut, mais reste un piège pour du code hérité tournant sur un ancien JDK.

### À retenir

- La JVM détecte les limites cgroup du conteneur (`-XX:+UseContainerSupport`, actif par défaut) depuis **Java 10** (rétroporté en **8u191**) ; le support de cgroups v2 est arrivé en **Java 15**.
- `-XX:MaxRAMPercentage` dimensionne le tas en proportion de la mémoire détectée, et suit automatiquement les changements de limite entre environnements, contrairement à un `-Xmx` fixe.
- La **mémoire hors tas** (metaspace, piles de threads, buffers directs, structures du GC) n'est pas couverte par ces options : c'est la cause la plus fréquente d'`OOMKilled` malgré un tas en apparence sain.
- Un arrêt propre exige la **forme exec** de `CMD`/`ENTRYPOINT` (java en PID 1) et des shutdown hooks qui laissent le travail en cours se terminer dans un délai borné.
- Journaliser sur la sortie standard, surveiller tas/GC/threads via `jcmd` ou Java Flight Recorder, et se référer au chapitre Performance pour le démarrage à froid et le préchauffage.

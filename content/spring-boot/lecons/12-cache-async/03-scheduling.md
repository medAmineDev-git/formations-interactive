---
id: scheduling
chapitre: cache-async
ordre: 3
titre: "Tâches planifiées avec @Scheduled"
termes:
  - terme: "@EnableScheduling"
    definition: "Annotation posée sur une classe `@Configuration` (ou la classe principale) qui active la détection et l'exécution des méthodes `@Scheduled`. Sans elle, `@Scheduled` est **silencieusement ignorée**."
  - terme: "fixedRate"
    definition: "Déclenche l'exécution suivante à intervalle **fixe depuis le début** de l'exécution précédente, en millisecondes. Si le traitement dure plus longtemps que `fixedRate`, la prochaine exécution démarre dès que la précédente se termine (pas de chevauchement avec le `TaskScheduler` par défaut, mono-thread), mais sans attendre le délai complet écoulé."
  - terme: "fixedDelay"
    definition: "Déclenche l'exécution suivante à intervalle fixe depuis la **fin** de l'exécution précédente, en millisecondes. Contrairement à `fixedRate`, la durée du traitement ne raccourcit jamais l'intervalle réel entre deux exécutions."
  - terme: "cron"
    definition: "Attribut qui prend une expression cron à **six champs** (secondes, minutes, heures, jour du mois, mois, jour de la semaine), à la différence du cron Unix classique qui n'en a que cinq (pas de champ secondes). Exemple : `\"0 0 2 * * *\"` s'exécute tous les jours à 2h00."
  - terme: "initialDelay"
    definition: "Délai, en millisecondes, avant la **première** exécution de la tâche après le démarrage de l'application. Se combine avec `fixedRate` ou `fixedDelay` ; utile pour laisser le temps à l'application de finir son démarrage avant la première exécution."
  - terme: TaskScheduler
    definition: "Composant qui déclenche effectivement les méthodes `@Scheduled` aux bons moments. Spring Boot en auto-configure un (`ThreadPoolTaskScheduler`) avec, par défaut, **un seul thread** (`spring.task.scheduling.pool.size = 1`) : toutes les tâches planifiées se partagent ce thread unique, sauf configuration explicite d'un pool plus grand."
  - terme: ShedLock
    definition: "Bibliothèque tierce (pas fournie par Spring) qui empêche une tâche `@Scheduled` de s'exécuter **simultanément sur plusieurs instances** d'une application déployée en cluster, via un verrou partagé (base de données, Redis…) et l'annotation `@SchedulerLock`. Spring ne résout pas ce problème nativement : chaque instance possède son propre planificateur, indépendant des autres."
quiz:
  - question: "Ce traitement dure environ 8 secondes. Avec `fixedRate = 5000`, quel est l'intervalle réel entre deux débuts d'exécution, avec le planificateur mono-thread par défaut ?"
    code: |
      @Scheduled(fixedRate = 5000)
      public void synchroniserCatalogue() {
          // traitement d'environ 8 secondes
      }
    choix:
      - "Exactement 5 secondes, quelle que soit la durée du traitement"
      - "Environ 8 secondes : la prochaine exécution ne peut démarrer qu'à la fin de la précédente, faute de thread disponible"
      - "0 seconde : les exécutions s'enchaînent en boucle sans pause"
      - "`fixedRate` lève une exception si le traitement dépasse l'intervalle configuré"
    reponse: 1
    explication: "`fixedRate` vise un déclenchement toutes les 5 secondes **depuis le début** de l'exécution précédente, mais avec le `TaskScheduler` par défaut (un seul thread), deux exécutions ne peuvent pas se chevaucher : la suivante attend que la précédente se termine. Ici, le traitement dure plus longtemps que l'intervalle visé, donc les exécutions s'enchaînent dès que possible, environ toutes les 8 secondes — dans les faits, `fixedRate` se comporte alors comme `fixedDelay`."
  - question: "Quelle expression cron Spring exécute une tâche toutes les 30 secondes ?"
    choix:
      - "`\"*/30 * * * * *\"`"
      - "`\"0 */30 * * * *\"`"
      - "`\"*/30 * * * *\"`"
      - "`\"30 * * * * *\"`"
    reponse: 0
    explication: "Une expression cron Spring compte **six champs** : secondes, minutes, heures, jour du mois, mois, jour de la semaine. `*/30` sur le premier champ (secondes) signifie « toutes les 30 secondes ». `\"0 */30 * * * *\"` s'exécute toutes les 30 minutes (le champ secondes est fixé à 0), et `\"*/30 * * * *\"` n'a que cinq champs : ce n'est pas une expression valide pour `@Scheduled`."
  - question: "Une application est déployée sur trois instances identiques, chacune avec une méthode `@Scheduled(cron = \"0 0 1 * * *\")` qui facture les commandes du jour. Que se passe-t-il à 1h00 ?"
    choix:
      - "Une seule instance exécute la tâche, Spring élit automatiquement un « leader » parmi les instances"
      - "Les trois instances exécutent chacune la tâche indépendamment, risquant une facturation en triple sans mécanisme supplémentaire"
      - "Seule la première instance démarrée exécute la tâche"
      - "L'application refuse de démarrer si plusieurs instances définissent la même tâche planifiée"
    reponse: 1
    explication: "Chaque instance possède son propre `TaskScheduler`, totalement indépendant des autres : Spring n'a aucune notion de cluster ni d'élection de leader. Sans mécanisme supplémentaire, les trois instances déclenchent la tâche à 1h00, ce qui peut facturer trois fois les mêmes commandes. La solution courante est une bibliothèque comme ShedLock, qui pose un verrou partagé (base de données, Redis) pour garantir qu'une seule instance exécute la tâche à la fois."
---

## Essentiel

`@Scheduled` déclenche une méthode automatiquement, à intervalle régulier ou selon une expression cron.

```java
@Configuration
@EnableScheduling
public class SchedulingConfig { }

@Component
public class RelanceService {

    @Scheduled(fixedRate = 60_000) // toutes les 60 secondes, depuis le début de l'exécution précédente
    public void verifierRelances() { ... }

    @Scheduled(cron = "0 0 2 * * *") // tous les jours à 2h00
    public void nettoyerFichiersTemporaires() { ... }
}
```

Trois façons principales de planifier :

- `fixedRate` : intervalle fixe depuis le **début** de l'exécution précédente.
- `fixedDelay` : intervalle fixe depuis la **fin** de l'exécution précédente.
- `cron` : expression à **six champs** (secondes en premier), pour des horaires précis ou récurrents complexes.

`initialDelay` retarde la toute première exécution. Par défaut, Spring Boot n'utilise qu'**un seul thread** pour toutes les tâches planifiées (`spring.task.scheduling.pool.size = 1`) : deux tâches planifiées se bloquent l'une l'autre si l'une dure longtemps, sauf à augmenter ce pool.

## Détail

### Comment ça marche

Au démarrage, `@EnableScheduling` déclenche un `ScheduledAnnotationBeanPostProcessor` qui repère les méthodes `@Scheduled` et les enregistre auprès d'un `TaskScheduler`. Ce dernier maintient un pool de threads (un seul par défaut avec Spring Boot) chargé de déclencher chaque tâche au bon moment. Une méthode `@Scheduled` doit être `void` et ne prendre **aucun paramètre**.

### Exemple 1 — `fixedDelay` avec délai initial

```java
@Scheduled(initialDelay = 10_000, fixedDelay = 30_000)
public void purgerPaniersAbandonnes() {
    panierRepository.supprimerInactifsDepuis(Duration.ofHours(24));
}
```

La première exécution attend 10 secondes après le démarrage (le temps que le contexte applicatif soit stabilisé), puis chaque exécution attend 30 secondes **après la fin** de la précédente — un traitement plus long décale d'autant l'exécution suivante, sans jamais réduire la pause réelle.

### Exemple 2 — Expression cron avec zone explicite

```java
@Scheduled(cron = "0 0 6 * * MON-FRI", zone = "Europe/Paris")
public void envoyerRapportQuotidien() { ... }
```

Champs, de gauche à droite : secondes, minutes, heures, jour du mois, mois, jour de la semaine. Ici : tous les jours ouvrés, à 6h00, heure de Paris — indépendamment du fuseau horaire du serveur qui exécute l'application.

### Exemple 3 — Valeurs externalisées dans la configuration

```java
@Scheduled(cron = "${app.rapport.cron}")
public void genererRapport() { ... }

@Scheduled(fixedRateString = "${app.synchro.intervalle-ms}")
public void synchroniserStock() { ... }
```

```yaml
app:
  rapport:
    cron: "0 0 7 * * *"
  synchro:
    intervalle-ms: 300000
```

`cron`, `fixedRateString` et `fixedDelayString` acceptent une chaîne résolue depuis la configuration : pratique pour changer la fréquence d'une tâche sans recompiler, ou pour avoir des valeurs différentes selon le profil (plus fréquent en développement, plus espacé en production).

### Exemple 4 — Augmenter le pool de threads planifiés

```yaml
spring:
  task:
    scheduling:
      pool:
        size: 5
      thread-name-prefix: "tache-planifiee-"
```

Sans cela, une tâche `@Scheduled` lente retarde le déclenchement de **toutes** les autres, puisqu'elles se partagent un seul thread par défaut. Augmenter la taille du pool permet une exécution réellement concurrente entre tâches distinctes.

### fixedRate, fixedDelay, cron

| | Base de calcul | Cas d'usage typique |
|---|---|---|
| `fixedRate` | Début de l'exécution précédente | Cadence régulière visée, tant que le traitement reste court |
| `fixedDelay` | Fin de l'exécution précédente | Garantir une vraie pause entre deux exécutions (ex. appel à une API externe) |
| `cron` | Expression calendaire | Horaires précis, jours spécifiques, fréquences irrégulières |

### Pièges courants

> **Un seul thread partagé par défaut.** `spring.task.scheduling.pool.size` vaut `1` : toutes les méthodes `@Scheduled` de l'application se partagent ce thread unique. Une tâche lente retarde le déclenchement de toutes les autres, sans erreur ni avertissement visible — juste des exécutions en retard. Augmenter la taille du pool, ou isoler les tâches lentes, corrige le problème.

> **Une exception dans une tâche planifiée n'arrête pas le planificateur.** Elle est journalisée (par défaut au niveau `ERROR`), l'exécution en cours s'arrête là, mais les exécutions **suivantes** de cette tâche (et des autres) continuent normalement. Le code doit gérer ses propres erreurs récupérables (retry, alerte) : rien d'automatique n'est fourni par `@Scheduled`.

> **Plusieurs instances de l'application exécutent chacune la tâche.** En environnement multi-instances (plusieurs pods, plusieurs serveurs), chaque instance a son propre planificateur, indépendant des autres : une tâche `@Scheduled` s'exécute **sur chaque instance** au même moment, ce qui peut dupliquer un traitement (envoi d'e-mails en double, facturation en double…). Spring ne fournit aucune coordination native entre instances ; une bibliothèque comme **ShedLock** (`@SchedulerLock`), appuyée sur un verrou partagé en base de données ou dans Redis, garantit qu'une seule instance exécute la tâche à un instant donné.

### À retenir

- `fixedRate` vise un intervalle depuis le **début** de l'exécution précédente, `fixedDelay` depuis sa **fin**.
- Une expression `cron` Spring a **six champs**, secondes en premier — à ne pas confondre avec le cron Unix à cinq champs.
- Un seul thread planifié par défaut : les tâches se bloquent entre elles si l'une dure longtemps, sauf à augmenter `spring.task.scheduling.pool.size`.
- Une exception dans une tâche planifiée est journalisée et n'interrompt pas les exécutions futures.
- En déploiement multi-instances, chaque instance exécute la tâche indépendamment : utiliser ShedLock (ou équivalent) pour éviter les doublons.

---
id: metriques-micrometer
chapitre: observabilite
ordre: 2
titre: "Métriques avec Micrometer et Prometheus"
termes:
  - terme: Micrometer
    definition: "Façade de métriques intégrée à Spring Boot, comparable à ce que SLF4J est pour les logs : le code applicatif s'écrit contre une API unique (`MeterRegistry`), et Micrometer traduit vers le format du backend choisi (Prometheus, Datadog, CloudWatch…) sans changer le code métier."
  - terme: MeterRegistry
    definition: "Point d'entrée pour créer et récupérer des métriques (« meters »). Spring Boot en configure automatiquement une instance, injectable dans n'importe quel bean."
  - terme: Counter
    definition: "Métrique qui ne fait qu'**augmenter** (nombre de commandes créées, d'erreurs rencontrées). Se lit en valeur cumulée ; le taux d'évolution (par seconde, par minute) se calcule côté outil de visualisation."
  - terme: Timer
    definition: "Mesure à la fois le **nombre d'appels** et leur **durée** (avec des percentiles côté backend). C'est le type de métrique derrière `http.server.requests`, la métrique HTTP fournie automatiquement par Spring Boot."
  - terme: Gauge
    definition: "Valeur instantanée qui peut monter ou descendre (taille d'une file, nombre de connexions actives). Contrairement au `Counter`, un `Gauge` **ne stocke pas** de valeur : il la relit via une fonction à chaque interrogation."
  - terme: "Tags et cardinalité"
    definition: "Une métrique peut porter des paires clé/valeur (`tag(\"methode\", \"POST\")`). Chaque combinaison unique de tags crée une **série temporelle distincte** côté backend : un tag à forte cardinalité (identifiant, e-mail, UUID) peut multiplier les séries à l'infini et saturer le système de métriques."
  - terme: micrometer-registry-prometheus
    definition: "Dépendance qui ajoute un `MeterRegistry` au format Prometheus et active l'endpoint `/actuator/prometheus`, à exposer via `management.endpoints.web.exposure.include`."
quiz:
  - question: "Cette Gauge est déclarée une fois au démarrage. Que se passe-t-il quand `panier.taille()` change ensuite ?"
    code: |
      int tailleInitiale = panier.taille();
      Gauge.builder("panier.taille", tailleInitiale, t -> t)
           .register(registry);
    choix:
      - "La métrique se met à jour automatiquement à chaque lecture de `panier.taille()`"
      - "La métrique reste bloquée sur la valeur capturée au démarrage : c'est un `int`, une copie immuable, pas une référence vivante vers le panier"
      - "Le démarrage échoue : `Gauge.builder` exige un objet mutable"
      - "La métrique est recalculée automatiquement toutes les secondes par Micrometer"
    reponse: 1
    explication: "Un `Gauge` relit sa valeur via la fonction fournie, appliquée à l'objet passé en second argument. Ici, l'objet est un `int` déjà évalué (`tailleInitiale`) : la fonction `t -> t` renverra toujours cette même valeur figée. Pour une jauge vivante, il faut passer l'objet qui porte l'état (le panier lui-même, ou un `AtomicInteger`) et lire son état réel dans la fonction, ex. `Gauge.builder(\"panier.taille\", panier, Panier::taille)`."
  - question: "Un développeur ajoute `.tag(\"idCommande\", commande.getId().toString())` à un `Counter` incrémenté à chaque commande. Quel est le risque principal ?"
    choix:
      - "Aucun : les tags n'ont pas d'impact sur les performances"
      - "Une explosion de cardinalité : chaque commande crée une série temporelle distincte, ce qui peut saturer la mémoire du backend de métriques"
      - "Le `Counter` refusera de démarrer si le tag change trop souvent"
      - "Le tag sera ignoré automatiquement par Micrometer au-delà de 100 valeurs distinctes"
    reponse: 1
    explication: "Un tag doit décrire une **dimension bornée** (méthode HTTP, code de statut, type de canal…), jamais un identifiant unique. Avec `idCommande`, on crée potentiellement autant de séries que de commandes, ce qui dégrade fortement Prometheus (et peut faire exploser la facture d'un SaaS de métriques). L'identifiant de commande a sa place dans un log ou une trace, pas dans un tag de métrique."
  - question: "Que fournit `micrometer-registry-prometheus`, une fois ajoutée au projet ?"
    choix:
      - "Un serveur Prometheus embarqué dans l'application"
      - "Un `MeterRegistry` qui expose les métriques au format texte Prometheus sur `/actuator/prometheus`, à scraper par un serveur Prometheus externe"
      - "Un tableau de bord Grafana préconfiguré, accessible directement sur l'application"
      - "Le remplacement de Micrometer par l'API native de Prometheus"
    reponse: 1
    explication: "Prometheus fonctionne en *pull* : c'est le serveur Prometheus, externe à l'application, qui vient interroger (« scraper ») périodiquement `/actuator/prometheus`. La dépendance ne fait qu'ajouter ce format d'export ; Grafana se branche ensuite sur Prometheus comme source de données pour construire les tableaux de bord."
---

## Essentiel

**Micrometer** est la façade de métriques intégrée à Spring Boot : le code écrit des compteurs, des temporisateurs ou des jauges contre une API unique, et Micrometer les traduit vers un ou plusieurs backends (Prometheus, Datadog, CloudWatch…). C'est le même principe que SLF4J pour les logs.

Spring Boot configure automatiquement un `MeterRegistry` et l'alimente déjà avec des métriques utiles : requêtes HTTP (`http.server.requests`, avec les tags `method`, `uri`, `status`, `outcome`), mémoire et garbage collector de la JVM, CPU, pool de connexions (`hikaricp.connections.active`…). Ajouter ses propres métriques se fait en injectant le `MeterRegistry` :

```java
@Service
public class CommandeService {
    private final Counter commandesCreees;

    public CommandeService(MeterRegistry registry) {
        this.commandesCreees = Counter.builder("commandes.creees")
                .tag("canal", "web")
                .register(registry);
    }

    public Commande creer(CreationCommandeDto dto) {
        Commande commande = ...;
        commandesCreees.increment();
        return commande;
    }
}
```

Avec `micrometer-registry-prometheus` et `management.endpoints.web.exposure.include: prometheus`, ces métriques deviennent lisibles sur `/actuator/prometheus`, au format texte que Prometheus vient périodiquement « scraper ». Grafana se branche ensuite sur Prometheus comme source de données pour visualiser des courbes et des tableaux de bord.

Le point à surveiller en permanence : la **cardinalité** des tags. Un tag doit décrire une catégorie bornée (méthode HTTP, type de canal, code de statut), jamais un identifiant unique — sous peine de créer une série temporelle par valeur possible, ce qui peut saturer le backend.

## Détail

### Comment ça marche

Un `MeterRegistry` est en réalité, dans une application Spring Boot standard, un **registre composite** : un même appel à `Counter.builder(...).register(registry)` alimente en une fois tous les registres concrets configurés (par exemple Prometheus et un `SimpleMeterRegistry` de diagnostic). Le code métier n'a jamais à connaître le backend final.

Chaque type de métrique répond à un besoin précis :

| Type | Usage typique | Ce qu'il expose |
|---|---|---|
| `Counter` | Événements qui s'accumulent (commandes créées, erreurs) | Une valeur cumulée, toujours croissante |
| `Timer` | Durée **et** nombre d'appels (temps de réponse d'un endpoint) | Compte, somme des durées, percentiles côté backend |
| `Gauge` | Valeur instantanée qui varie dans les deux sens (taille de file, connexions actives) | La valeur lue au moment de l'interrogation |
| `DistributionSummary` | Distribution d'une grandeur qui n'est pas une durée (taille d'un fichier envoyé, montant d'une commande) | Compte, somme, percentiles côté backend |

### Exemple 1 — Chronométrer un traitement avec un Timer

```java
@Service
public class ExportService {
    private final Timer timerExport;

    public ExportService(MeterRegistry registry) {
        this.timerExport = Timer.builder("export.duree")
                .description("Durée de génération d'un export PDF")
                .register(registry);
    }

    public byte[] exporter(Commande commande) {
        return timerExport.record(() -> genererPdf(commande));
    }
}
```

`record(Supplier<T>)` mesure automatiquement la durée d'exécution du bloc et incrémente le compte d'appels, sans code de chronométrage manuel.

### Exemple 2 — Une jauge correctement vivante

```java
@Component
public class FileAttenteMetrics {
    public FileAttenteMetrics(MeterRegistry registry, FileAttenteCommandes file) {
        Gauge.builder("file.commandes.taille", file, FileAttenteCommandes::taille)
             .description("Nombre de commandes en attente de traitement")
             .register(registry);
    }
}
```

Micrometer garde une référence vers `file` et rappelle `FileAttenteCommandes::taille` à chaque lecture : la valeur reflète toujours l'état courant, sans qu'il soit nécessaire de la mettre à jour manuellement.

### Exemple 3 — Tags à cardinalité contrôlée

```java
Counter.builder("paiement.tentatives")
       .tag("moyen", moyenPaiement.name())   // ex. CARTE, VIREMENT — quelques valeurs possibles
       .tag("resultat", resultat ? "succes" : "echec")
       .register(registry)
       .increment();
```

`moyenPaiement` et `resultat` sont des énumérations à faible nombre de valeurs : le nombre de séries temporelles reste borné et prévisible, quel que soit le volume de commandes.

### Exemple 4 — Exposer les métriques au format Prometheus

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, prometheus
  metrics:
    tags:
      application: boutique-api   # tag ajouté à toutes les métriques, utile en multi-instances
```

```bash
curl localhost:8080/actuator/prometheus | head
# HELP http_server_requests_seconds  ...
# TYPE http_server_requests_seconds summary
http_server_requests_seconds_count{method="GET",uri="/produits",status="200",...} 42
```

Prometheus adapte les noms au passage (les points deviennent des underscores, une unité est ajoutée) : `http.server.requests` devient `http_server_requests_seconds`.

### L'API Observation, en un mot

Depuis Micrometer 1.10 (Spring Boot 3), une API `Observation` permet d'instrumenter une seule fois un traitement pour produire **à la fois** une métrique (`Timer`) et une trace distribuée cohérentes, via l'annotation `@Observed` ou l'API `Observation.createNotStarted(...)`. C'est une évolution récente : les détails de configuration (activation de l'aspect, propriétés associées) varient encore selon les versions, mieux vaut vérifier la documentation officielle de la version utilisée avant de s'appuyer dessus en production.

### Pièges courants

> **Tag à forte cardinalité.** Un identifiant unique (commande, utilisateur, requête) en tag multiplie les séries temporelles à l'infini. Symptôme typique : consommation mémoire de Prometheus qui grimpe sans explication après une mise en production. Solution : retirer le tag, ou le remplacer par une catégorie bornée.

> **Gauge alimentée par une valeur figée.** Passer un `int` ou un `Integer` déjà évalué à `Gauge.builder` capture une photo, pas un état vivant : la métrique ne bougera plus jamais. Il faut passer l'objet porteur de l'état (ou un `AtomicInteger`/`AtomicLong` qu'on met à jour) et une fonction qui le relit à chaque appel.

> **Oublier que Prometheus fonctionne en *pull*.** Sans serveur Prometheus configuré pour scraper `/actuator/prometheus` à intervalles réguliers, exposer l'endpoint ne suffit pas : rien n'est collecté ni stocké dans le temps, et Grafana n'a aucune donnée à afficher.

### À retenir

- Micrometer est une façade : le code utilise `MeterRegistry`, le backend (Prometheus, Datadog…) est un détail de configuration.
- `Counter` (cumulatif), `Timer` (durée + compte), `Gauge` (valeur instantanée relue), `DistributionSummary` (distribution non temporelle).
- Les tags décrivent des catégories **bornées** ; jamais d'identifiant unique en tag, sous peine d'explosion de cardinalité.
- `micrometer-registry-prometheus` + exposition de l'endpoint `prometheus` suffisent à alimenter Prometheus, puis Grafana pour la visualisation.
- L'API `Observation` (`@Observed`) unifie métriques et traces, mais reste une fonctionnalité récente à vérifier version par version.

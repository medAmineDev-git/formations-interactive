---
id: reactif-ou-pas
chapitre: reactif
ordre: 4
titre: "Réactif, MVC ou virtual threads : comment choisir"
termes:
  - terme: Virtual threads
    definition: "Threads légers introduits par **Java 21** (JEP 444), gérés par la JVM plutôt que par le système d'exploitation. Ils permettent d'écrire du code **impératif classique** (bloquant en apparence) tout en supportant une très forte concurrence, la JVM « démontant » le thread porteur (*carrier thread*) pendant les I/O bloquantes."
  - terme: "spring.threads.virtual.enabled"
    definition: "Propriété (Spring Boot 3.2+, avec Java 21) qui fait exécuter les requêtes Spring MVC (et Tomcat) sur des virtual threads plutôt que des threads de plateforme classiques, sans changer une ligne de code métier."
  - terme: Thread porteur (carrier thread)
    definition: "Thread de plateforme (système d'exploitation) sur lequel s'exécute temporairement un virtual thread. Quand le virtual thread bloque sur une I/O compatible, la JVM libère le thread porteur pour un autre virtual thread, puis le réattribue à la reprise."
  - terme: "Pinning (épinglage)"
    definition: "Situation où un virtual thread **ne peut pas** être démonté de son thread porteur pendant un blocage — notamment dans un bloc `synchronized`, ou lors de certains appels JNI natifs. Le thread porteur reste alors bloqué, annulant l'avantage des virtual threads pour ce cas précis."
  - terme: Concurrence I/O
    definition: "Nombre de requêtes ou d'opérations simultanées passant le plus clair de leur temps à **attendre** une ressource externe (réseau, disque, base de données) plutôt qu'à consommer du CPU. C'est le facteur qui détermine si un modèle non bloquant (réactif ou virtual threads) apporte un gain réel."
  - terme: Écosystème bloquant
    definition: "Ensemble des bibliothèques construites sur un modèle d'appel bloquant (JDBC, JPA/Hibernate, la plupart des SDK de clients tiers). Le réactif exige leur remplacement (R2DBC, WebClient) ; les virtual threads les rendent utilisables sans changement, puisque le code reste impératif."
quiz:
  - question: "Une équipe migre une application Spring MVC très sollicitée (des milliers de requêtes concurrentes, majoritairement des appels réseau vers des services tiers) vers Java 21 et active `spring.threads.virtual.enabled=true`, sans toucher au code métier bloquant (JDBC, RestTemplate). Que peut-elle raisonnablement attendre ?"
    choix:
      - "Aucun changement : les virtual threads ne s'appliquent qu'au code explicitement réécrit avec `Thread.ofVirtual()`"
      - "Une meilleure capacité à absorber la concurrence, sans réécrire le code en style réactif, car la JVM démonte le thread porteur pendant les I/O bloquantes standards"
      - "Une dégradation des performances car les virtual threads ajoutent une indirection coûteuse à chaque appel"
      - "Le même résultat qu'avec WebFlux, avec exactement les mêmes threads"
    reponse: 1
    explication: "Spring MVC exécute alors chaque requête sur un virtual thread. Les I/O bloquantes standards (JDBC récent, sockets réseau) démontent le thread porteur, qui redevient disponible pour d'autres requêtes. Le code reste inchangé, impératif : c'est tout l'intérêt de cette approche par rapport au réactif, qui aurait exigé de remplacer JDBC par R2DBC et RestTemplate par WebClient."
  - question: "Dans quel cas le passage au réactif (WebFlux + R2DBC) apporte-t-il un bénéfice réel, par rapport à MVC classique avec virtual threads ?"
    choix:
      - "Dans tous les cas : le réactif est systématiquement plus performant"
      - "Jamais : les virtual threads rendent le réactif obsolète"
      - "Pour du streaming continu de données (SSE, flux infinis) et une gestion fine du débit (backpressure) entre producteur et consommateur, que le modèle impératif ne propose pas nativement"
      - "Uniquement pour réduire le nombre de lignes de code"
    reponse: 2
    explication: "Sous forte concurrence I/O pure, les virtual threads couvrent une grande partie des cas où le réactif était auparavant la seule option, avec un code plus simple à écrire et déboguer. Le réactif garde un avantage propre pour le **streaming** et le contrôle explicite du **débit** (backpressure) entre un producteur rapide et un consommateur plus lent — un besoin que le modèle impératif, virtual threads compris, ne couvre pas directement."
  - question: "Pourquoi un bloc `synchronized` est-il un piège pour les virtual threads ?"
    code: |
      public synchronized void reserverStock(Long produitId, int quantite) {
          // opération bloquante sur une ressource externe à l'intérieur du bloc synchronized
          baseDeDonnees.verrouillerEtDecrementer(produitId, quantite);
      }
    choix:
      - "Ce code ne compile pas avec des virtual threads"
      - "Le virtual thread reste « épinglé » à son thread porteur pendant tout le blocage à l'intérieur du bloc `synchronized`, empêchant la JVM de le libérer pour d'autres tâches"
      - "`synchronized` est automatiquement ignoré avec des virtual threads"
      - "Aucun problème particulier, `synchronized` est justement optimisé pour les virtual threads"
    reponse: 1
    explication: "Un virtual thread bloqué à l'intérieur d'un bloc (ou d'une méthode) `synchronized` ne peut pas être démonté de son thread porteur : c'est le phénomène de *pinning*. Si l'opération bloquante à l'intérieur est longue (ici, un appel base de données), le thread porteur reste immobilisé, ce qui peut limiter le gain de concurrence attendu si le motif est fréquent. Remplacer `synchronized` par un `java.util.concurrent.locks.ReentrantLock` évite ce piège."
---

## Essentiel

Trois façons de gérer la concurrence I/O en Spring Boot aujourd'hui : **Spring MVC classique**, **Spring MVC + virtual threads** (Java 21), et **WebFlux réactif**. Le choix dépend surtout d'un facteur : la proportion de temps que l'application passe à **attendre** des I/O (réseau, base de données) plutôt qu'à calculer.

- **MVC classique** : simple, écosystème complet (JPA, JDBC…), mais un thread bloqué par requête lente — limité sous très forte concurrence.
- **MVC + virtual threads** (`spring.threads.virtual.enabled=true`, Java 21) : même code impératif, mais la JVM libère le thread porteur pendant les I/O bloquantes standards. Meilleure concurrence, sans réécrire le code ni changer d'écosystème.
- **WebFlux réactif** : code non bloquant de bout en bout (R2DBC, WebClient), la meilleure absorption de concurrence I/O pure, mais un écosystème plus étroit, une complexité de code plus élevée, et un débogage moins direct (piles d'appels reconstituées par Reactor plutôt que la pile réelle).

Le réactif garde un avantage propre que les virtual threads ne couvrent pas : le **streaming** avec **backpressure** explicite (un `Flux` de données continues où le consommateur contrôle le débit).

```properties
# Basculer une application Spring MVC sur virtual threads, sans changer le code
spring.threads.virtual.enabled=true
```

Pour un projet neuf à très forte concurrence I/O sans besoin de streaming, les virtual threads couvrent aujourd'hui une large part des cas qui, avant Java 21, justifiaient à eux seuls de partir en réactif.

## Détail

### Pourquoi ce choix s'est complexifié

Avant Java 21, le dilemme était binaire : accepter la limite de threads de plateforme (MVC classique) ou adopter le réactif pour gagner en concurrence, au prix d'un changement complet d'écosystème et de style de code. Les virtual threads ajoutent une troisième option : garder le confort du code impératif tout en gagnant une bonne partie du bénéfice de concurrence auparavant réservé au réactif.

### Exemple 1 — Où le réactif apporte un vrai gain

```java
@GetMapping(value = "/cours-bourse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<Cours> flux() {
    return coursBourseService.ecouter() // flux continu, potentiellement infini
            .onBackpressureLatest();     // si le client est plus lent, ne garder que la dernière valeur
}
```

Un flux continu de données (cours de bourse, notifications, mise à jour d'un tableau de bord) avec un consommateur qui peut être plus lent que le producteur est le cas d'usage où le réactif reste préférable : le concept de backpressure n'a pas d'équivalent direct côté impératif, virtual threads compris.

### Exemple 2 — Où les virtual threads suffisent largement

```java
@RestController
public class CommandeController {

    private final CommandeRepository repository; // Spring Data JPA classique
    private final RestClient serviceLivraison;    // client HTTP synchrone

    @PostMapping("/commandes")
    public ResponseEntity<Commande> creer(@RequestBody @Valid CreationCommandeDto dto) {
        Commande commande = repository.save(Commande.depuis(dto));
        InfosLivraison livraison = serviceLivraison.get()
                .uri("/livraison/{id}", commande.getId())
                .retrieve()
                .body(InfosLivraison.class); // appel bloquant classique
        commande.appliquer(livraison);
        return ResponseEntity.ok(repository.save(commande));
    }
}
```

Avec `spring.threads.virtual.enabled=true`, ce code parfaitement classique (JPA, client HTTP synchrone) profite d'un thread virtuel par requête : pendant l'appel réseau bloquant vers le service de livraison, le thread porteur est libéré pour d'autres requêtes. Aucune ligne n'a changé par rapport à une application MVC ordinaire.

### Exemple 3 — Le piège du pinning

```java
// À éviter avec des virtual threads : le bloc synchronized empêche le démontage
public synchronized InfosStock verifierStock(Long produitId) {
    return appelReseauBloquant(produitId);
}

// Préférable : un ReentrantLock ne pose pas ce problème
private final ReentrantLock verrou = new ReentrantLock();

public InfosStock verifierStock(Long produitId) {
    verrou.lock();
    try {
        return appelReseauBloquant(produitId);
    } finally {
        verrou.unlock();
    }
}
```

`synchronized` reste correct fonctionnellement avec des virtual threads, mais un blocage prolongé à l'intérieur immobilise le thread porteur (pinning), réduisant l'avantage de concurrence recherché. Ce n'est un problème réel que si le bloc `synchronized` est à la fois **fréquent** et **contient une opération lente** ; un simple bloc court (incrémenter un compteur) ne pose aucun souci pratique. Ce piège concerne Java 21 à 23 : depuis le JDK 24 (JEP 491), `synchronized` ne provoque plus d'épinglage.

### Tableau de décision

| Situation | Recommandation |
|---|---|
| Application CRUD classique, charge modérée | MVC classique. Le plus simple, le plus documenté, l'écosystème le plus large. |
| Très forte concurrence I/O, Java 21 disponible | MVC + virtual threads. Garde JPA/JDBC/RestClient inchangés, meilleure absorption de charge. |
| Streaming continu, contrôle de débit nécessaire | WebFlux réactif. Aucune alternative impérative équivalente pour la backpressure. |
| Java 17 uniquement, forte concurrence I/O | WebFlux reste la seule option non bloquante native (les virtual threads demandent Java 21). |

### Pièges courants

> **Adopter le réactif « parce que c'est moderne », sans besoin de forte concurrence I/O ni de streaming.** Le coût est réel : complexité accrue, piles d'appels reconstituées par Reactor plus difficiles à lire, obligation de réécrire tout l'accès aux données (JPA → R2DBC) et de bannir tout appel bloquant, y compris dans des bibliothèques tierces qui n'ont pas d'équivalent réactif. Sur une charge modérée, le gain de performance est souvent négligeable face à ce coût.

> **Croire que les virtual threads remplacent totalement le réactif.** Ils résolvent le problème du thread par requête bloqué, mais n'apportent ni backpressure ni opérateurs de composition de flux (`zip`, `merge`, fenêtrage temporel…). Pour du streaming ou une orchestration fine de flux de données, le réactif garde un rôle propre.

> **Mélanger accès bloquant et réactif dans une même application WebFlux, en pensant que ça ne pose pas de problème parce que « ça compile et ça tourne ».** JDBC dans un contrôleur WebFlux fonctionne, mais bloque l'event loop : symptôme classique, une application WebFlux qui n'est pas plus rapide (parfois plus lente) qu'une application MVC équivalente, parce que l'accès aux données bloquant annule le bénéfice du serveur non bloquant.

### À retenir

- MVC classique reste le choix par défaut raisonnable pour une charge modérée : le plus simple à écrire, tester et déboguer.
- Les virtual threads (Java 21, `spring.threads.virtual.enabled=true`) couvrent une large part des besoins de forte concurrence I/O, en gardant du code impératif et l'écosystème JDBC/JPA existant.
- Le réactif (WebFlux + R2DBC) garde un avantage propre pour le streaming et la backpressure, sans équivalent impératif direct.
- Le réactif implique un écosystème entièrement non bloquant : JDBC/JPA n'ont pas leur place dans une application WebFlux.
- Le pinning (`synchronized` prolongé) est le principal piège spécifique aux virtual threads.

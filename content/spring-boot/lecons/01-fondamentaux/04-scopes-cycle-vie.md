---
id: scopes-cycle-vie
chapitre: fondamentaux
ordre: 4
titre: Portée (scope) et cycle de vie des beans
termes:
  - terme: Scope (portée)
    definition: "Règle qui détermine **combien d'instances** d'un bean existent et combien de temps elles vivent. Se déclare avec `@Scope(...)` sur la classe ou la méthode `@Bean`."
  - terme: singleton
    definition: "Le scope **par défaut** : une seule instance par conteneur, créée au démarrage et partagée par tous ceux qui l'injectent. À ne pas confondre avec le patron de conception Singleton (une instance par JVM) : ici c'est une instance **par conteneur Spring**."
  - terme: prototype
    definition: "Une **nouvelle instance** est créée à chaque fois que le bean est demandé au conteneur (injection ou `getBean`). Spring la crée et l'initialise, puis ne s'en occupe plus : sa méthode de destruction n'est **jamais** appelée automatiquement."
  - terme: "Scopes web : request, session, application"
    definition: "Disponibles dans une application web. `request` : une instance par requête HTTP. `session` : une instance par session utilisateur. `application` : une instance pour toute l'application web (`ServletContext`)."
  - terme: "@PostConstruct"
    definition: "Méthode appelée **une fois**, après la création du bean et l'injection de toutes ses dépendances. Sert à initialiser (charger un cache, vérifier une configuration…). Dans Spring Boot 3, elle vient du package `jakarta.annotation`."
  - terme: "@PreDestroy"
    definition: "Méthode appelée à l'**arrêt** du conteneur, avant la destruction du bean. Sert à libérer des ressources (fermer une connexion, arrêter un thread…). Non appelée pour les beans `prototype`."
  - terme: "@Lazy"
    definition: "Retarde la création d'un bean singleton à sa **première utilisation** au lieu du démarrage. Utile pour un bean coûteux rarement utilisé, mais les erreurs de configuration n'apparaissent alors qu'au premier appel."
  - terme: ObjectProvider
    definition: "Interface de Spring qui permet de demander un bean **au moment voulu** (`getObject()`), au lieu de le recevoir une seule fois à la création. Solution classique pour obtenir un nouveau `prototype` à chaque fois depuis un singleton."
quiz:
  - question: "`Compteur` n'a pas d'annotation `@Scope`. Que vaut `a.compteur() == b.compteur()` ?"
    code: |
      @Component
      public class Compteur { private int valeur; ... }

      @Service
      public class ServiceA {
          private final Compteur compteur;
          public ServiceA(Compteur compteur) { this.compteur = compteur; }
          public Compteur compteur() { return compteur; }
      }

      @Service
      public class ServiceB { /* même structure que ServiceA */ }
    choix:
      - "`true` : le scope par défaut est singleton, les deux services partagent la même instance"
      - "`false` : chaque service reçoit sa propre instance"
      - "`false` : Spring crée une instance par thread"
      - "Erreur de compilation"
    reponse: 0
    explication: "Sans `@Scope`, un bean est un **singleton** : une seule instance, partagée. Conséquence importante : si `Compteur` modifie `valeur`, les deux services voient la même valeur, et en cas d'accès simultanés il faut gérer la concurrence."
  - question: "`Panier` est un prototype. Que vaut `caisse.panier() == caisse.panier()` ?"
    code: |
      @Component
      @Scope("prototype")
      public class Panier { ... }

      @Service
      public class CaisseService {
          private final Panier panier;

          public CaisseService(Panier panier) { this.panier = panier; }

          public Panier panier() { return panier; }
      }
    choix:
      - "`false` : un prototype est recréé à chaque appel de méthode"
      - "`true` : le panier a été injecté une seule fois, à la création du singleton"
      - "Le démarrage échoue : on ne peut pas injecter un prototype dans un singleton"
      - "`false` : Spring crée un proxy automatiquement"
    reponse: 1
    explication: "Le prototype est créé **au moment de l'injection**, c'est-à-dire une seule fois, quand le singleton `CaisseService` est construit. Ensuite, c'est toujours le même objet. Pour obtenir un nouveau panier à chaque fois : injecter un `ObjectProvider<Panier>` et appeler `getObject()`, utiliser `@Lookup`, ou déclarer le bean avec un proxy (`proxyMode = ScopedProxyMode.TARGET_CLASS`)."
  - question: "Un bean `@Scope(\"prototype\")` possède une méthode `@PreDestroy`. Quand est-elle appelée ?"
    choix:
      - "À la fin de chaque requête HTTP"
      - "À l'arrêt de l'application, comme pour un singleton"
      - "Jamais automatiquement : Spring ne gère pas la destruction des prototypes"
      - "Dès que l'objet n'est plus référencé"
    reponse: 2
    explication: "Spring crée et initialise un prototype (`@PostConstruct` est bien appelé), puis le remet à celui qui l'a demandé et **l'oublie**. La libération des ressources est donc à la charge du code qui l'utilise."
---

## Essentiel

Le **scope** d'un bean indique combien d'instances existent :

- **singleton** (par défaut) : une seule instance, créée au démarrage et partagée par tous.
- **prototype** : une nouvelle instance à chaque fois que le bean est demandé.
- **request / session** (web) : une instance par requête HTTP ou par session utilisateur.

```java
@Component
@Scope("prototype")
public class Panier { ... }
```

Un bean passe par un **cycle de vie** : création → injection des dépendances → `@PostConstruct` → utilisation → `@PreDestroy` (à l'arrêt).

```java
@Component
public class CacheProduits {

    @PostConstruct
    void charger() { /* après l'injection : on remplit le cache */ }

    @PreDestroy
    void vider() { /* à l'arrêt : on libère les ressources */ }
}
```

## Détail

### Les scopes comparés

| Scope | Instances | Création | Destruction gérée par Spring |
|---|---|---|---|
| `singleton` | 1 par conteneur | Au démarrage (sauf `@Lazy`) | ✅ à l'arrêt |
| `prototype` | 1 par demande | À chaque injection / `getBean` | ❌ jamais |
| `request` | 1 par requête HTTP | Au premier usage dans la requête | ✅ fin de requête |
| `session` | 1 par session | Au premier usage dans la session | ✅ fin de session |
| `application` | 1 par application web | Au premier usage | ✅ à l'arrêt |

En pratique, **la grande majorité des beans sont des singletons** : services, repositories, contrôleurs, configurations.

### Le cycle de vie complet d'un bean

1. **Instanciation** : appel du constructeur (avec injection par constructeur).
2. **Injection** des dépendances restantes (setters, champs).
3. Méthodes `*Aware` (`setBeanName`, `setApplicationContext`…) si le bean les implémente.
4. `BeanPostProcessor` — avant l'initialisation.
5. **Initialisation** : `@PostConstruct`, puis `afterPropertiesSet()` (interface `InitializingBean`), puis `initMethod` de `@Bean`.
6. `BeanPostProcessor` — après l'initialisation. C'est ici que Spring crée les **proxies** (`@Transactional`, `@Async`, `@Cacheable`…).
7. Le bean est **prêt** et utilisé.
8. À l'arrêt : `@PreDestroy`, puis `destroy()` (interface `DisposableBean`), puis `destroyMethod` de `@Bean`.

Pour un usage courant, retenez : **constructeur → injection → `@PostConstruct` → … → `@PreDestroy`**.

### Exemple 1 — Initialiser un cache au démarrage

```java
@Component
public class CacheProduits {
    private final ProduitRepository repo;
    private final Map<Long, Produit> cache = new ConcurrentHashMap<>();

    public CacheProduits(ProduitRepository repo) {
        this.repo = repo;
    }

    @PostConstruct // jakarta.annotation.PostConstruct
    void charger() {
        repo.findAll().forEach(p -> cache.put(p.getId(), p));
    }

    @PreDestroy
    void vider() {
        cache.clear();
    }
}
```

`@PostConstruct` garantit que **toutes** les dépendances sont injectées, quelle que soit la méthode d'injection.

### Exemple 2 — Un nouveau prototype à chaque fois

```java
@Service
public class CaisseService {
    private final ObjectProvider<Panier> paniers;

    public CaisseService(ObjectProvider<Panier> paniers) {
        this.paniers = paniers;
    }

    public void nouvelleVente() {
        Panier panier = paniers.getObject(); // nouvelle instance à chaque appel
        // ...
    }
}
```

### Exemple 3 — Un bean par utilisateur (scope session)

```java
@Component
@SessionScope // raccourci pour @Scope(value = "session", proxyMode = TARGET_CLASS)
public class PanierUtilisateur {
    private final List<Produit> produits = new ArrayList<>();
    // ...
}
```

On peut l'injecter dans un contrôleur singleton : Spring injecte un **proxy** qui redirige chaque appel vers le panier de la session en cours.

### Exemple 4 — Initialisation et destruction avec `@Bean`

```java
@Configuration
public class ConnexionConfig {

    @Bean(initMethod = "ouvrir", destroyMethod = "fermer")
    public ConnexionExterne connexion() {
        return new ConnexionExterne("tcp://serveur:9000");
    }
}
```

Pratique pour une classe externe, sur laquelle on ne peut pas ajouter `@PostConstruct`.

### Pièges courants

> **Singleton avec état modifiable.** Un singleton est partagé par **toutes les requêtes en même temps**. Un attribut comme `private Commande commandeEnCours;` dans un service provoque des mélanges de données entre utilisateurs. Un singleton doit être **sans état**, ou utiliser des structures thread-safe.

> **Prototype injecté dans un singleton.** Il n'est créé qu'une fois : vous obtenez toujours le même objet. Utilisez `ObjectProvider`, `@Lookup` ou un proxy.

> **Utiliser les dépendances dans le constructeur avec l'injection par champ.** Au moment du constructeur, les champs `@Autowired` sont encore `null`. Mettez la logique dans `@PostConstruct`, ou passez à l'injection par constructeur.

### À retenir

- Scope par défaut : **singleton** (1 instance par conteneur, partagée, créée au démarrage).
- **prototype** : nouvelle instance à chaque demande, jamais détruite par Spring.
- Cycle de vie : constructeur → injection → `@PostConstruct` → utilisation → `@PreDestroy`.
- Un singleton doit être **sans état modifiable**.

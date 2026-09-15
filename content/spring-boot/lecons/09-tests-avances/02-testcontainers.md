---
id: testcontainers
chapitre: tests-avances
ordre: 2
titre: "Testcontainers : tester avec une vraie base"
termes:
  - terme: Testcontainers
    definition: "Bibliothèque Java qui démarre de **vrais services** (base de données, message broker…) dans des conteneurs **Docker** jetables, le temps des tests, puis les détruit automatiquement. Le test s'exécute contre le même moteur qu'en production, pas contre un substitut."
  - terme: "Pourquoi pas H2 ?"
    definition: "H2 imite le dialecte SQL de PostgreSQL ou MySQL, mais imparfaitement : types spécifiques (`JSONB`, `UUID` natif…), fonctions SQL, contraintes, comportement de verrouillage ou de tri peuvent différer. Un test qui passe sous H2 peut échouer en production sous le vrai SGBD."
  - terme: "@Testcontainers"
    definition: "Extension JUnit 5 (`org.testcontainers.junit.jupiter.Testcontainers`) qui gère automatiquement le cycle de vie des champs annotés `@Container` : démarrage avant les tests, arrêt après."
  - terme: "@Container"
    definition: "Marque un champ conteneur géré par l'extension. Sur un champ **statique**, le conteneur démarre une seule fois pour toute la classe de test (partagé entre les méthodes) ; sur un champ d'instance, un nouveau conteneur démarre à **chaque méthode** — nettement plus lent, rarement utile."
  - terme: PostgreSQLContainer
    definition: "Conteneur prêt à l'emploi (module `org.testcontainers:postgresql`) qui démarre une instance PostgreSQL réelle : `new PostgreSQLContainer<>(\"postgres:16\")`. Il existe des équivalents pour MySQL, MongoDB, Kafka, RabbitMQ…"
  - terme: "@ServiceConnection"
    definition: "Depuis **Spring Boot 3.1**, annotation posée sur le champ `@Container` qui configure **automatiquement** les propriétés de connexion Spring Boot (URL JDBC, identifiants…) à partir du conteneur démarré. Plus besoin de déclarer ces propriétés à la main."
  - terme: "@DynamicPropertySource"
    definition: "Méthode statique qui enregistre des propriétés Spring **calculées à l'exécution** (ex. `container::getJdbcUrl`), car le port du conteneur n'est connu qu'une fois démarré. Approche antérieure à `@ServiceConnection`, toujours utile pour les services non couverts par elle."
  - terme: Conteneur partagé entre classes
    definition: "Pattern qui évite de redémarrer un conteneur (coûteux, plusieurs secondes) pour chaque classe de test : une classe de base abstraite démarre un conteneur **statique** une seule fois pour tout le processus de test, réutilisé par toutes les classes qui en héritent."
quiz:
  - question: "Que configure `@ServiceConnection` dans ce test ?"
    code: |
      @Testcontainers
      @SpringBootTest
      class ProduitRepositoryIT {

          @Container
          @ServiceConnection
          static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

          @Autowired
          private ProduitRepository repository;
      }
    choix:
      - "Rien : `@ServiceConnection` sert uniquement à documenter le code"
      - "Les propriétés `spring.datasource.url`, `username` et `password` du contexte Spring, à partir du conteneur démarré"
      - "Le nombre de connexions simultanées autorisées vers PostgreSQL"
      - "Le port réseau exposé par le conteneur, qui doit rester fixe entre deux exécutions"
    reponse: 1
    explication: "`@ServiceConnection` détecte le type de conteneur (ici PostgreSQL) et configure automatiquement le `DataSource` de l'application avec l'URL JDBC, l'utilisateur et le mot de passe du conteneur réellement démarré (le port étant choisi dynamiquement). Sans elle, il faudrait enregistrer ces propriétés soi-même avec `@DynamicPropertySource`."
  - question: "Pourquoi ce champ est-il déclaré `static` ?"
    code: |
      @Testcontainers
      class CommandeRepositoryIT {

          @Container
          static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");
      }
    choix:
      - "C'est obligatoire pour que Java compile le champ"
      - "Un champ statique partage le même conteneur pour toutes les méthodes de la classe, démarré une seule fois ; un champ d'instance en démarrerait un nouveau à chaque test"
      - "Cela n'a aucun effet sur le comportement, seulement sur le style"
      - "Cela empêche Testcontainers de démarrer le conteneur"
    reponse: 1
    explication: "Avec `@Container` sur un champ statique, l'extension `@Testcontainers` démarre le conteneur une fois pour toute la classe (avant tous les tests) et l'arrête après le dernier. Sur un champ d'instance, un nouveau conteneur serait démarré et détruit pour chaque méthode de test — correct mais beaucoup plus lent."
  - question: "Que faut-il vérifier en premier si un test Testcontainers échoue avec une erreur du type « Could not find a valid Docker environment » ?"
    choix:
      - "Que la version de PostgreSQL utilisée dans le conteneur correspond à la production"
      - "Que Docker (ou un environnement compatible) est bien installé et démarré sur la machine qui exécute les tests"
      - "Que `@ServiceConnection` est bien présente"
      - "Que le test utilise `@DataJpaTest` plutôt que `@SpringBootTest`"
    reponse: 1
    explication: "Testcontainers a besoin d'un démon Docker accessible (Docker Desktop, Colima, ou un runtime compatible) pour démarrer les conteneurs. Sans lui, aucun test Testcontainers ne peut s'exécuter — un point à anticiper sur les machines de développement et surtout sur les agents CI, qui doivent avoir Docker disponible."
---

## Essentiel

`@DataJpaTest` avec H2 est rapide, mais H2 **n'est pas** PostgreSQL (ni MySQL) : certains comportements SQL diffèrent (types spécifiques, fonctions, contraintes). **Testcontainers** résout ce problème en démarrant une **vraie** base dans un conteneur Docker, le temps du test.

```java
@Testcontainers
@SpringBootTest
class ProduitRepositoryIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    private ProduitRepository repository;

    @Test
    void save_persiste_le_produit() {
        Produit produit = repository.save(new Produit("Clavier", 49.90));
        assertThat(produit.getId()).isNotNull();
    }
}
```

`@Testcontainers` gère le cycle de vie du conteneur ; `@Container` sur un champ **statique** le démarre une seule fois pour toute la classe. `@ServiceConnection` (Spring Boot 3.1+) configure automatiquement le `DataSource` de l'application avec les informations de connexion du conteneur — sans elle, il faudrait les enregistrer manuellement avec `@DynamicPropertySource`.

Deux prérequis : **Docker** doit être disponible sur la machine qui exécute les tests, et le démarrage d'un conteneur prend quelques secondes — un coût à limiter en partageant un conteneur entre plusieurs tests plutôt qu'en le redémarrant à chaque fois.

## Détail

### Pourquoi c'est utile

Un test `@DataJpaTest` sous H2 peut valider une requête JPQL simple, mais rater un vrai bug de production : une fonction PostgreSQL utilisée dans une `@Query` native, un type `JSONB`, une contrainte `CHECK`, ou même un tri différent sur une colonne texte selon la collation. Testcontainers ferme cet écart en testant contre le même moteur que la production, au prix d'un temps d'exécution plus long qu'H2.

### Exemple 1 — Dépendances Maven

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-testcontainers</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
```

`spring-boot-testcontainers` apporte l'intégration Spring Boot (dont `@ServiceConnection`). Le module `postgresql` de Testcontainers apporte la classe `PostgreSQLContainer` ; il existe des modules équivalents pour MySQL, MongoDB, Kafka, RabbitMQ, etc.

### Exemple 2 — Avec @DataJpaTest plutôt qu'un contexte complet

```java
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ProduitRepositoryPostgresTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    private ProduitRepository repository;

    @Test
    void findByReference_utilise_lindex_unique() {
        repository.save(new Produit("Clavier", "REF-001"));

        assertThat(repository.findByReference("REF-001")).isPresent();
    }
}
```

`Replace.NONE` est indispensable ici : sans elle, `@DataJpaTest` remplacerait le `DataSource` fourni par le conteneur par une base H2 embarquée, et Testcontainers deviendrait inutile.

### Exemple 3 — @DynamicPropertySource, l'approche plus ancienne

Avant `@ServiceConnection` (ou pour un service qu'elle ne couvre pas), les propriétés de connexion s'enregistrent manuellement :

```java
@Testcontainers
@SpringBootTest
class ProduitRepositoryIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void proprietesDynamiques(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

Le port du conteneur n'étant connu qu'après son démarrage, ces propriétés ne peuvent pas figurer dans un fichier `application-test.yml` statique : `@DynamicPropertySource` les calcule à l'exécution, juste avant que le contexte Spring ne démarre.

### Exemple 4 — Partager un conteneur entre plusieurs classes de test

Redémarrer un conteneur PostgreSQL pour chaque classe de test (plusieurs secondes à chaque fois) ralentit vite une suite de tests. Un pattern courant consiste à centraliser le conteneur dans une classe de base :

```java
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");
}

@SpringBootTest
class ProduitRepositoryIT extends AbstractIntegrationTest { ... }

@SpringBootTest
class CommandeRepositoryIT extends AbstractIntegrationTest { ... }
```

Le champ `static final` est initialisé une seule fois pour toute l'exécution des tests (au chargement de la JVM) et Testcontainers l'arrête automatiquement à la fin, via son mécanisme de nettoyage (Ryuk) — pas besoin de l'arrêter explicitement.

### @ServiceConnection ou @DynamicPropertySource ?

| | `@ServiceConnection` | `@DynamicPropertySource` |
|---|---|---|
| Disponibilité | Spring Boot 3.1+ | Toutes versions récentes |
| Code à écrire | Aucun, juste l'annotation | Propriétés à lister manuellement |
| Couverture | Types de conteneurs reconnus par Spring Boot (PostgreSQL, MySQL, Kafka, MongoDB, Redis…) | N'importe quelle propriété, y compris personnalisée |
| Cas d'usage | Le cas courant | Service non couvert, propriété applicative spécifique |

### Pièges courants

> **Oublier `Replace.NONE` avec `@DataJpaTest`.** Sans elle, `@AutoConfigureTestDatabase` remplace silencieusement le `DataSource` du conteneur par une base H2 embarquée : le test s'exécute, mais plus du tout contre PostgreSQL.

> **Un conteneur par méthode de test.** Un champ `@Container` d'instance (non statique) redémarre un conteneur complet à chaque test — correct, mais chaque redémarrage coûte plusieurs secondes. Réservez ce mode aux cas où l'isolation totale entre tests est réellement nécessaire.

> **Oublier que Docker doit tourner.** Sur un poste sans Docker (ou en CI sans runtime compatible), tous les tests Testcontainers échouent au démarrage avec une erreur explicite (« Could not find a valid Docker environment »). C'est un prérequis d'environnement, pas une configuration Spring.

### À retenir

- Testcontainers démarre un vrai service (PostgreSQL, Kafka…) dans un conteneur Docker jetable, pour tester contre le moteur réel plutôt qu'un substitut comme H2.
- `@Testcontainers` + `@Container` (champ statique) gèrent le cycle de vie ; `PostgreSQLContainer` est prêt à l'emploi.
- `@ServiceConnection` (Spring Boot 3.1+) configure automatiquement la connexion ; `@DynamicPropertySource` fait la même chose manuellement, pour les cas non couverts.
- Docker doit être disponible sur la machine qui exécute les tests (poste de développement et CI).
- Partager un conteneur entre plusieurs classes (classe de base abstraite) évite de payer le coût de démarrage à chaque classe.

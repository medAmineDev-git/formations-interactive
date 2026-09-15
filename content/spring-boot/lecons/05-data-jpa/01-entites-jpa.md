---
id: entites-jpa
chapitre: data-jpa
ordre: 1
titre: Les entités JPA
termes:
  - terme: JPA
    definition: "*Jakarta Persistence API* : une spécification Java qui définit comment mapper des objets Java à des tables de base de données (ORM, *Object-Relational Mapping*). JPA ne fait rien par elle-même : il faut une implémentation."
  - terme: Hibernate
    definition: "L'implémentation de JPA utilisée par défaut dans Spring Boot. C'est Hibernate qui génère le SQL, gère le cache et traduit les entités en lignes de table."
  - terme: Spring Data JPA
    definition: "Une couche au-dessus de JPA/Hibernate, fournie par Spring, qui génère automatiquement les repositories (voir la leçon suivante) à partir d'interfaces. Elle ne remplace pas JPA, elle simplifie son usage."
  - terme: "@Entity"
    definition: "Annotation qui marque une classe comme entité JPA : chaque instance correspond à une ligne d'une table. La classe doit avoir un **constructeur sans argument** (public ou protégé) et ne peut pas être `final`."
  - terme: "@Id et @GeneratedValue"
    definition: "`@Id` marque l'attribut identifiant (clé primaire). `@GeneratedValue` délègue la génération de sa valeur à la base de données ou à Hibernate, avec une `strategy` : `IDENTITY` (auto-incrément géré par la base) ou `SEQUENCE` (séquence, plus performante en insertions groupées)."
  - terme: "@Table et @Column"
    definition: "`@Table(name = \"...\")` précise le nom de la table si elle diffère du nom de la classe. `@Column(name = \"...\", nullable = false, length = 100)` précise le nom, la nullabilité ou la taille d'une colonne. Sans ces annotations, Hibernate déduit les noms depuis les noms Java."
  - terme: "spring.jpa.hibernate.ddl-auto"
    definition: "Propriété qui contrôle si Hibernate modifie le schéma de la base au démarrage. Valeurs : `none`, `validate`, `update`, `create`, `create-drop`. **Jamais `update` ni `create*` en production.**"
  - terme: "@Enumerated(EnumType.STRING)"
    definition: "Indique que les valeurs d'un `enum` sont stockées sous forme de **texte** dans la base plutôt que d'entier (comportement par défaut `ORDINAL`, à éviter)."
quiz:
  - question: "Pourquoi cette entité échoue-t-elle à l'exécution avec Hibernate ?"
    code: |
      @Entity
      public class Produit {

          @Id
          @GeneratedValue(strategy = GenerationType.IDENTITY)
          private Long id;

          private String nom;

          public Produit(String nom) {
              this.nom = nom;
          }
      }
    choix:
      - "Il manque `@Table` sur la classe"
      - "Il manque un constructeur sans argument"
      - "`Long` n'est pas un type valide pour un identifiant"
      - "`@GeneratedValue` doit obligatoirement utiliser `SEQUENCE`"
    reponse: 1
    explication: "Hibernate instancie l'entité par réflexion, avec un constructeur sans argument, puis remplit les champs. Cette classe n'en a qu'un avec un paramètre : Hibernate lève une exception à l'exécution (`InstantiationException` ou équivalent). Il faut ajouter un constructeur `protected Produit() {}` (ou public), en plus du constructeur métier."
  - question: "Un `enum` `StatutCommande { EN_COURS, VALIDEE, ANNULEE }` est mappé sans `@Enumerated`. Une nouvelle valeur `EXPEDIEE` est insérée entre `EN_COURS` et `VALIDEE`. Que risque-t-il de se passer ?"
    choix:
      - "Rien, les enums sont toujours stockés par leur nom"
      - "Les lignes existantes changent de sens : leur entier stocké pointe maintenant vers une autre constante"
      - "L'application refuse de démarrer"
      - "Hibernate ajoute automatiquement une colonne pour la nouvelle valeur"
    reponse: 1
    explication: "Par défaut (`EnumType.ORDINAL`), Hibernate stocke la **position** de la constante (0, 1, 2…). Insérer une valeur au milieu de l'énumération décale les positions suivantes : une ligne stockée avec `1` (autrefois `VALIDEE`) redevient `EXPEDIEE` après le changement. `@Enumerated(EnumType.STRING)` stocke le nom et évite ce piège, au prix d'un peu plus d'espace."
  - question: "Que se passe-t-il si `spring.jpa.hibernate.ddl-auto=update` est laissé actif sur l'environnement de production ?"
    choix:
      - "Rien, c'est la configuration recommandée en production"
      - "Hibernate peut modifier le schéma de production automatiquement au démarrage, sans validation ni contrôle humain"
      - "L'application refuse de démarrer en production avec cette valeur"
      - "Cela n'a d'effet qu'en base H2"
    reponse: 1
    explication: "`update` fait évoluer le schéma pour qu'il corresponde aux entités : ajout de colonnes ou de tables, sans jamais supprimer ce qui n'est plus utilisé. C'est pratique en développement, mais dangereux en production : un changement de mapping mal maîtrisé peut modifier une table critique sans revue. En production, on utilise `validate` (ou `none`) et un outil de migration dédié (Flyway, Liquibase)."
---

## Essentiel

**JPA** (*Jakarta Persistence API*) est une spécification pour mapper des objets Java à des tables de base de données. **Hibernate** est l'implémentation utilisée par défaut dans Spring Boot. **Spring Data JPA** ajoute une couche par-dessus pour générer les repositories automatiquement (leçon suivante).

Une entité est une classe annotée `@Entity`, avec un identifiant `@Id` :

```java
@Entity
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nom;

    private double prix;

    protected Produit() { } // requis par Hibernate

    public Produit(String nom, double prix) {
        this.nom = nom;
        this.prix = prix;
    }

    // getters...
}
```

Points essentiels :

- **Constructeur sans argument obligatoire** (public ou protégé) : Hibernate l'utilise par réflexion.
- **Un `record` ne peut pas être une entité** : un record est immuable et n'a pas de constructeur sans argument, deux propriétés incompatibles avec le fonctionnement d'Hibernate.
- `@GeneratedValue(strategy = GenerationType.IDENTITY)` délègue la génération de l'identifiant à l'auto-incrément de la base ; `SEQUENCE` utilise une séquence dédiée, souvent plus performante.
- En développement, `spring.jpa.hibernate.ddl-auto=update` fait créer/adapter les tables automatiquement. **Jamais en production.**

## Détail

### Comment ça marche

Hibernate lit les annotations de l'entité pour construire le mapping objet-relationnel : la classe devient une table, chaque attribut devient une colonne, chaque instance devient une ligne. Au démarrage, Spring Boot configure automatiquement un `EntityManagerFactory` à partir du `DataSource` détecté (base H2, PostgreSQL, MySQL…).

### Exemple 1 — Mapping explicite avec `@Table` et `@Column`

```java
@Entity
@Table(name = "produits")
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(name = "nom_produit", nullable = false, length = 150)
    private String nom;

    @Column(unique = true)
    private String reference;
}
```

Sans `@Table`, Hibernate utilise le nom de la classe (`Produit` → `produit` selon la stratégie de nommage). Sans `@Column`, il déduit le nom de la colonne depuis le nom de l'attribut.

### Exemple 2 — Un enum bien mappé

```java
public enum StatutCommande { EN_COURS, VALIDEE, EXPEDIEE, ANNULEE }

@Entity
public class Commande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private StatutCommande statut;
}
```

La colonne `statut` contient le texte `"VALIDEE"` plutôt qu'un entier : lisible en base, et sans risque si l'ordre des constantes change.

### Exemple 3 — Afficher le SQL généré

```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

Utile en développement pour vérifier les requêtes générées par Hibernate (et repérer, plus tard, un problème de performance comme le N+1, abordé dans la leçon sur les relations).

### `ddl-auto` : les valeurs possibles

| Valeur | Effet | Usage |
|---|---|---|
| `none` | Aucune action sur le schéma | Production (avec migrations Flyway/Liquibase) |
| `validate` | Vérifie que le schéma correspond aux entités, sans le modifier | Production |
| `update` | Ajoute les tables/colonnes manquantes, ne supprime rien | Développement local |
| `create` | Supprime puis recrée tout le schéma à chaque démarrage | Tests, prototypage |
| `create-drop` | Comme `create`, et supprime le schéma à l'arrêt de l'application | Tests |

Par défaut, Spring Boot utilise `create-drop` avec une base embarquée (H2) et `none` avec une base externe.

### Pièges courants

> **Classe `final` ou sans constructeur sans argument.** Hibernate a besoin d'instancier l'entité par réflexion et, pour certaines fonctionnalités (proxies de chargement paresseux), de pouvoir en créer une sous-classe. Une classe `final` ou sans constructeur sans argument provoque une erreur au démarrage ou à l'exécution.

> **Un `record` comme entité.** Un `record` est immuable, sans constructeur sans argument et avec des champs `final` : incompatible avec le fonctionnement d'Hibernate, qui doit pouvoir créer l'objet puis remplir ses champs après coup. Utilisez une classe classique pour les entités, et réservez les records aux DTO.

> **`ddl-auto=update` en production.** Pratique en développement, mais aucun contrôle sur ce qu'Hibernate modifie réellement. Utilisez `validate` (ou `none`) en production, avec un outil de migration comme Flyway ou Liquibase pour versionner le schéma.

### À retenir

- JPA est une spécification, Hibernate l'implémente, Spring Data JPA simplifie son usage.
- `@Entity`, `@Id`, `@GeneratedValue` (`IDENTITY` ou `SEQUENCE`) suffisent pour une entité simple.
- Constructeur sans argument obligatoire ; un `record` ne peut pas être une entité.
- `@Enumerated(EnumType.STRING)` plutôt que le défaut `ORDINAL`, plus fragile.
- `ddl-auto` : `update`/`create*` en développement seulement, jamais en production.

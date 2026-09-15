---
id: flyway
chapitre: migrations
ordre: 1
titre: "Migrer le schéma avec Flyway"
termes:
  - terme: Migration versionnée
    definition: "Script SQL (ou Java) nommé `V<version>__<description>.sql`, exécuté **une seule fois**, dans l'ordre des versions. C'est l'unité de base de Flyway : chaque évolution du schéma passe par un nouveau fichier, jamais par la modification d'un fichier existant."
  - terme: flyway_schema_history
    definition: "Table créée automatiquement par Flyway dans le schéma cible. Elle enregistre chaque migration appliquée : version, description, script, **checksum**, date, durée, succès ou échec. C'est elle que Flyway consulte pour savoir quelles migrations restent à jouer."
  - terme: Checksum
    definition: "Empreinte calculée à partir du contenu d'un script de migration, stockée dans `flyway_schema_history`. Au démarrage suivant, Flyway recalcule le checksum du fichier et le compare à celui enregistré : s'ils diffèrent, la migration a été modifiée après coup et Flyway **refuse de démarrer**."
  - terme: Migration répétable (R__)
    definition: "Script nommé `R__<description>.sql`, sans numéro de version. Rejoué à **chaque fois que son contenu change** (nouveau checksum), après toutes les migrations versionnées. Utile pour les vues, fonctions, procédures stockées ou données de référence."
  - terme: spring.flyway.baseline-on-migrate
    definition: "Propriété (défaut `false`) qui permet à Flyway de fonctionner sur un schéma **déjà existant et non vide** (créé avant l'adoption de Flyway). Activée, elle crée une ligne de « baseline » dans l'historique à la version `spring.flyway.baseline-version` (défaut `1`) sans exécuter les scripts antérieurs ou égaux à cette version."
  - terme: flyway-core
    definition: "Dépendance principale de Flyway. Depuis **Flyway 10**, la prise en charge de certains SGBD (par exemple PostgreSQL) a été extraite dans des modules séparés — `flyway-database-postgresql` notamment — à ajouter en plus de `flyway-core` pour ces bases."
  - terme: ddl-auto=validate
    definition: "Réglage Hibernate recommandé quand Flyway (ou Liquibase) gère le schéma : Hibernate ne crée ni ne modifie plus aucune table, il **vérifie seulement** que les entités correspondent au schéma existant, et signale une erreur au démarrage sinon."
quiz:
  - question: "Une équipe utilise `spring.jpa.hibernate.ddl-auto=update` en production. Quel est le principal risque par rapport à Flyway ?"
    choix:
      - "Aucun : `update` et Flyway produisent le même résultat, Flyway est juste plus lent"
      - "`update` n'est pas versionné ni rejouable de façon identique sur chaque environnement, et peut appliquer des changements imprévus (colonnes ajoutées, jamais supprimées) sans trace ni contrôle"
      - "`update` ne fonctionne qu'avec H2, jamais avec PostgreSQL"
      - "`update` empêche complètement le démarrage de l'application en production"
    reponse: 1
    explication: "`ddl-auto=update` déduit le schéma des entités à chaque démarrage : le résultat dépend de la version du code, il n'y a pas d'historique ni de contrôle du DBA, et Hibernate ne supprime jamais une colonne devenue inutile. Flyway rend chaque changement explicite, versionné et identique sur tous les environnements."
  - question: "Une migration `V2__ajouter_colonne_email.sql` a déjà été appliquée en production. Un développeur modifie ce fichier pour corriger une faute de frappe dans un commentaire, puis redéploie. Que se passe-t-il ?"
    choix:
      - "Flyway rejoue la migration corrigée, le commentaire est mis à jour"
      - "Flyway démarre normalement, seul le contenu réellement significatif (hors commentaires) est comparé"
      - "Flyway échoue au démarrage : le checksum du fichier ne correspond plus à celui enregistré dans `flyway_schema_history`"
      - "Flyway ignore silencieusement le fichier modifié et passe à la migration suivante"
    reponse: 2
    explication: "Flyway compare le checksum du contenu **complet** du fichier, commentaires inclus, à celui stocké lors de la première exécution. Toute modification d'une migration déjà appliquée provoque une erreur de validation au démarrage suivant. La bonne pratique est de créer une nouvelle migration, jamais de modifier une migration existante."
  - question: "Que fait une migration répétable `R__rafraichir_vue_statistiques.sql` ?"
    choix:
      - "Elle s'exécute à chaque démarrage de l'application, quel que soit son contenu"
      - "Elle s'exécute une seule fois, comme une migration versionnée, mais sans ordre garanti"
      - "Elle s'exécute (ou se ré-exécute) uniquement quand son contenu change, après toutes les migrations versionnées"
      - "Elle nécessite obligatoirement Flyway Teams (version payante)"
    reponse: 2
    explication: "Une migration `R__` n'a pas de numéro de version : Flyway compare son checksum à chaque exécution et ne la rejoue que si le contenu a changé, toujours après avoir appliqué les migrations versionnées en attente. C'est adapté aux vues, fonctions ou données de référence qu'on veut garder synchronisées avec leur définition."
---

## Essentiel

`spring.jpa.hibernate.ddl-auto=update` (ou `create`) est pratique en développement, mais **inadapté en production** : le schéma généré dépend de la version du code au moment du démarrage, rien n'est versionné, rien n'est rejouable à l'identique d'un environnement à l'autre, et Hibernate ne supprime jamais une colonne devenue inutile. **Flyway** résout ça en traitant le schéma comme du code : chaque évolution est un script SQL numéroté, versionné avec le reste du projet.

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<!-- Depuis Flyway 10, certaines bases (ex. PostgreSQL) demandent en plus : -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

Les scripts vont par défaut dans `src/main/resources/db/migration`, nommés `V<version>__<description>.sql` :

```sql
-- V1__creer_table_produits.sql
CREATE TABLE produits (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prix NUMERIC(10, 2) NOT NULL
);
```

Au démarrage, Flyway compare les scripts présents à une table `flyway_schema_history` qu'il gère lui-même, et exécute uniquement ceux qui n'ont pas encore été appliqués, dans l'ordre des versions. **Une migration déjà appliquée ne doit jamais être modifiée** : Flyway détecterait le changement (via un checksum) et refuserait de démarrer. Pour corriger une erreur, on écrit une nouvelle migration.

## Détail

### Comment ça marche

1. Au démarrage, Flyway lit les fichiers de `spring.flyway.locations` (défaut `classpath:db/migration`).
2. Il consulte `flyway_schema_history` pour savoir quelles versions sont déjà appliquées.
3. Il exécute les migrations manquantes, **dans l'ordre des numéros de version**, chacune dans sa propre transaction (selon le SGBD).
4. Il enregistre chaque exécution (version, checksum, durée, succès) dans l'historique.
5. Enfin, les migrations répétables (`R__`) dont le checksum a changé sont (ré)exécutées.

Ce mécanisme tourne **avant** que le contexte Spring ne finisse de démarrer : si une migration échoue, l'application ne démarre pas.

### Exemple 1 — Convention de nommage

```
src/main/resources/db/migration/
├── V1__creer_table_produits.sql
├── V2__ajouter_colonne_categorie.sql
├── V2.1__corriger_index_categorie.sql
└── R__vue_produits_actifs.sql
```

Le double underscore (`__`) sépare la version de la description. La description devient lisible dans `flyway_schema_history` (les underscores y sont remplacés par des espaces). Les versions peuvent avoir plusieurs niveaux (`V2.1`) pour insérer un correctif entre deux versions déjà publiées.

### Exemple 2 — Propriétés Spring Boot courantes

```yaml
spring:
  flyway:
    enabled: true                         # true par défaut si flyway-core est sur le classpath
    locations: classpath:db/migration     # défaut
    baseline-on-migrate: false            # true si le schéma existant n'est pas vide
    baseline-version: 1                   # version attribuée à la baseline
```

`baseline-on-migrate: true` est nécessaire quand Flyway est introduit sur une base **déjà en production**, non vide et sans historique : Flyway crée une ligne de baseline sans essayer de rejouer les migrations antérieures ou égales à `baseline-version`, en partant du principe que le schéma correspondant existe déjà.

### Exemple 3 — Cohabiter avec Hibernate

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate   # Hibernate ne modifie plus rien, il vérifie seulement
  flyway:
    enabled: true
```

Flyway est alors la **seule** source de vérité sur le schéma. Hibernate compare les entités JPA au schéma existant au démarrage et échoue si une colonne ou une table attendue est absente — ce qui détecte tôt un oubli de migration ou une entité désynchronisée du schéma réel.

### Exemple 4 — Migration Java pour un besoin non exprimable en SQL

```java
public class V3__migrer_statuts_commande extends BaseJavaMigration {
    @Override
    public void migrate(Context context) throws Exception {
        try (Statement stmt = context.getConnection().createStatement()) {
            // logique impossible ou trop lourde à exprimer en SQL pur
            // (parsing, appel d'un service, traitement conditionnel complexe)
        }
    }
}
```

Placée dans un package Java (par défaut `db/migration` du classpath, configurable), une migration Java est numérotée comme une migration SQL et apparaît dans le même historique. Réservée aux cas où le SQL seul ne suffit pas : la grande majorité des migrations restent en SQL, plus simples à relire et à auditer.

### Pièges courants

> **Modifier une migration déjà appliquée en production.** Flyway le détecte via le checksum et refuse de démarrer avec une erreur de validation. La correction se fait toujours par une **nouvelle** migration, même pour corriger une faute de frappe.

> **Oublier le module de base de données depuis Flyway 10.** `flyway-core` seul ne suffit plus pour certaines bases (PostgreSQL notamment) : l'erreur au démarrage mentionne l'absence de support pour le type de base de données détecté. Vérifier la documentation Flyway de la version utilisée pour savoir si un module dédié est requis.

> **Combiner Flyway avec `ddl-auto=update` ou `create`.** Les deux mécanismes se disputent alors la propriété du schéma : Hibernate peut modifier des tables que Flyway pense contrôler entièrement. En présence de Flyway, `ddl-auto` doit être `validate` ou `none`.

### À retenir

- Flyway remplace `ddl-auto` en production : chaque évolution est un script **versionné**, rejouable à l'identique sur tous les environnements.
- Emplacement par défaut : `classpath:db/migration`, nommage `V<version>__description.sql`.
- La table `flyway_schema_history` retient ce qui a été appliqué, avec un **checksum** par script : ne jamais modifier une migration déjà jouée.
- Les migrations `R__` (répétables) se rejouent quand leur contenu change, après les migrations versionnées.
- Associer Flyway à `ddl-auto=validate` : Flyway gère le schéma, Hibernate vérifie seulement la cohérence des entités.

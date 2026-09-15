---
id: liquibase
chapitre: migrations
ordre: 2
titre: "Liquibase et bonnes pratiques de migration"
termes:
  - terme: Changelog maître
    definition: "Fichier racine qui référence tous les changelogs d'un projet, lu au démarrage par Liquibase. Emplacement par défaut avec Spring Boot : `classpath:/db/changelog/db.changelog-master.yaml` (propriété `spring.liquibase.change-log`)."
  - terme: changeSet
    definition: "Unité de changement identifiée par un couple **`id` + `author`** (et le chemin du fichier qui le contient). C'est cette combinaison, pas seulement l'`id`, qui doit être unique : Liquibase l'utilise pour savoir si le changeSet a déjà été appliqué."
  - terme: DATABASECHANGELOG
    definition: "Table créée par Liquibase pour enregistrer chaque `changeSet` exécuté (id, author, chemin du fichier, checksum, date, ordre). Équivalent Liquibase de la `flyway_schema_history` de Flyway."
  - terme: DATABASECHANGELOGLOCK
    definition: "Table utilisée par Liquibase pour empêcher deux instances de l'application d'appliquer les migrations en même temps. Si une instance s'arrête brutalement pendant une migration, le verrou peut rester posé et bloquer les démarrages suivants tant qu'il n'est pas libéré manuellement."
  - terme: rollback
    definition: "Annulation d'un `changeSet`. Pour de nombreux changeTypes (`createTable`, `addColumn`…), Liquibase déduit **automatiquement** l'opération inverse. Pour les autres (ex. une modification de données), un bloc `rollback` explicite doit être écrit."
  - terme: Contexts et labels
    definition: "Deux mécanismes de filtrage des `changeSet` selon l'environnement. Un `context` (ex. `test`) s'associe à des données ou changements propres à un environnement ; un `label` permet un filtrage additionnel, avec des expressions plus riches (`prod & !batch`). Les deux se configurent via `spring.liquibase.contexts` / `spring.liquibase.labels`."
  - terme: spring.liquibase.change-log
    definition: "Propriété qui indique l'emplacement du changelog maître si celui-ci n'est pas à l'emplacement par défaut. D'autres propriétés utiles : `spring.liquibase.enabled`, `spring.liquibase.default-schema`, `spring.liquibase.parameters.*` (valeurs injectées dans le changelog)."
quiz:
  - question: "Deux développeurs créent chacun un changeSet avec `id: 1` dans deux fichiers différents, référencés tous les deux par le changelog maître. Que se passe-t-il ?"
    code: |
      # fichier A
      - changeSet:
          id: 1
          author: alice
          changes: [...]

      # fichier B
      - changeSet:
          id: 1
          author: bob
          changes: [...]
    choix:
      - "Erreur : les deux `id: 1` entrent en conflit, Liquibase refuse de démarrer"
      - "Aucun conflit : Liquibase identifie un changeSet par la combinaison id + author + chemin du fichier, pas par l'`id` seul"
      - "Le second changeSet remplace silencieusement le premier"
      - "Liquibase fusionne les deux changeSets en un seul"
    reponse: 1
    explication: "L'identifiant réel d'un changeSet est le triplet id + author + fichier. Deux fichiers différents peuvent donc réutiliser le même `id` sans collision. Il reste préférable, en pratique, d'utiliser des id lisibles et uniques (numéro de ticket, description) pour éviter toute confusion en le relisant."
  - question: "Quelle est la différence principale entre l'approche de Flyway et celle de Liquibase pour décrire une migration ?"
    choix:
      - "Flyway ne permet que du SQL, Liquibase ne permet que du YAML"
      - "Flyway écrit des scripts SQL natifs exécutés tels quels ; Liquibase peut aussi décrire des changements de façon abstraite (changeTypes comme `createTable`), traduits en SQL adapté au SGBD cible"
      - "Liquibase ne peut pas être utilisé avec Spring Boot"
      - "Flyway génère automatiquement un rollback pour chaque migration, jamais Liquibase"
    reponse: 1
    explication: "Flyway est « SQL-first » : on écrit le SQL qui s'exécutera. Liquibase propose en plus des changeTypes abstraits (createTable, addColumn…) que Liquibase traduit dans le dialecte du SGBD cible, ce qui facilite en théorie le support de plusieurs bases — au prix d'une syntaxe à apprendre. Liquibase accepte aussi du SQL brut (format `sql` ou fichiers `.sql` avec des commentaires de changeSet)."
  - question: "Pourquoi la stratégie « expand/contract » est-elle recommandée pour une migration sans interruption de service ?"
    choix:
      - "Parce qu'elle évite d'écrire des migrations rétrocompatibles"
      - "Parce qu'elle permet de renommer une colonne en une seule migration, exécutée pendant que l'application continue de fonctionner"
      - "Parce qu'elle sépare le changement en plusieurs étapes rétrocompatibles (ajouter le nouveau, faire cohabiter ancien et nouveau, puis retirer l'ancien) pour qu'aucune version déployée de l'application ne se retrouve face à un schéma qu'elle ne comprend pas"
      - "Parce qu'elle n'est utile qu'avec Liquibase, pas avec Flyway"
    reponse: 2
    explication: "Avec un déploiement progressif (rolling deploy), plusieurs versions de l'application tournent en même temps sur des schémas différents pendant la transition. Expand/contract étale le changement : d'abord ajouter (expand) sans rien casser, migrer les données, adapter le code pour utiliser le nouveau schéma, puis seulement supprimer l'ancien (contract) une fois qu'aucune version en production n'en dépend plus. C'est indépendant de l'outil de migration utilisé."
---

## Essentiel

Liquibase est, comme Flyway, un outil de gestion de migrations : il applique des changements de schéma versionnés et garde une trace de ce qui a été exécuté. Sa différence principale est de proposer, en plus du SQL brut, une description **abstraite** des changements (les *changeTypes*), que Liquibase traduit dans le dialecte SQL du SGBD cible.

Avec Spring Boot, le point d'entrée est un **changelog maître**, par défaut `src/main/resources/db/changelog/db.changelog-master.yaml`, qui référence les autres fichiers :

```yaml
databaseChangeLog:
  - include:
      file: db/changelog/changes/001-creer-table-produits.yaml
  - include:
      file: db/changelog/changes/002-ajouter-colonne-categorie.yaml
```

Chaque fichier référencé contient un ou plusieurs `changeSet`, identifiés par `id` + `author` :

```yaml
databaseChangeLog:
  - changeSet:
      id: 001-creer-table-produits
      author: alice
      changes:
        - createTable:
            tableName: produits
            columns:
              - column:
                  name: id
                  type: BIGINT
                  autoIncrement: true
                  constraints:
                    primaryKey: true
              - column:
                  name: nom
                  type: VARCHAR(100)
                  constraints:
                    nullable: false
```

Liquibase accepte aussi le **XML** et le **SQL** (avec des commentaires spéciaux `--changeset author:id`) comme formats de changelog : le YAML est courant dans les projets Spring Boot récents, mais les trois formats sont interchangeables et peuvent même être mélangés via `include`.

## Détail

### Comment ça marche

1. Au démarrage, Liquibase lit le changelog maître et résout tous les `include`.
2. Il consulte `DATABASECHANGELOG` pour connaître les `changeSet` déjà appliqués (identifiés par id + author + fichier).
3. Il pose un verrou dans `DATABASECHANGELOGLOCK` pour empêcher une exécution concurrente.
4. Il exécute les `changeSet` manquants, dans l'ordre du changelog, et enregistre chacun (avec son checksum) dans `DATABASECHANGELOG`.
5. Il libère le verrou.

Comme pour Flyway, un `changeSet` déjà exécuté dont le contenu change fait échouer la validation au démarrage suivant : la règle « ne jamais modifier une migration appliquée » s'applique tout autant.

### Exemple 1 — Rollback automatique vs explicite

```yaml
databaseChangeLog:
  - changeSet:
      id: 010-ajouter-colonne-remise
      author: bob
      changes:
        - addColumn:
            tableName: produits
            columns:
              - column:
                  name: remise
                  type: DECIMAL(5,2)
      # rollback automatique déduit par Liquibase : dropColumn produits.remise

  - changeSet:
      id: 011-migrer-anciens-prix
      author: bob
      changes:
        - sql:
            sql: UPDATE produits SET remise = 0 WHERE remise IS NULL
      rollback:
        - sql:
            sql: UPDATE produits SET remise = NULL WHERE remise = 0
```

`addColumn` a une opération inverse évidente (`dropColumn`), déduite automatiquement. Une mise à jour de données arbitraire n'en a pas : il faut écrire soi-même le `rollback`, quand il est possible d'en écrire un.

### Exemple 2 — Contexts et propriétés Spring Boot

```yaml
databaseChangeLog:
  - changeSet:
      id: 020-donnees-demo
      author: alice
      context: demo
      changes:
        - insert:
            tableName: produits
            columns:
              - column: { name: nom, value: "Produit de démonstration" }
```

```yaml
spring:
  liquibase:
    enabled: true
    change-log: classpath:/db/changelog/db.changelog-master.yaml   # défaut
    contexts: prod          # "demo" n'en fait pas partie
    default-schema: public
```

Le `changeSet` ci-dessus ne s'exécute que si `demo` fait partie des contexts actifs. Ici, `spring.liquibase.contexts: prod` l'exclut : le changeSet est simplement ignoré, sans erreur.

### Tableau comparatif — Flyway vs Liquibase

| | Flyway | Liquibase |
|---|---|---|
| Format principal | SQL natif | YAML / XML / JSON / SQL |
| Abstraction des changements | Non (SQL direct) | Oui (changeTypes traduits par SGBD), ou SQL direct au choix |
| Identifiant d'un changement | Numéro de version dans le nom de fichier | `id` + `author` + fichier |
| Rollback | Manuel (nouvelle migration), *undo scripts* en édition payante | Automatique pour de nombreux changeTypes, sinon manuel |
| Filtrage par environnement | Non natif (organiser les dossiers/`locations`) | `context` et `label` intégrés |
| Historique en base | `flyway_schema_history` | `DATABASECHANGELOG` (+ `DATABASECHANGELOGLOCK`) |
| Courbe d'apprentissage | Faible (c'est du SQL) | Plus élevée (syntaxe des changeTypes) si on utilise l'abstraction |

Les deux outils résolvent le même problème et partagent les mêmes garanties de fond : migrations versionnées, historisées, non modifiables après application. Le choix dépend souvent des habitudes de l'équipe ou de l'écosystème (Liquibase est par exemple très présent dans l'écosystème Java d'entreprise).

### Bonnes pratiques communes aux deux outils

- **Migrations rétrocompatibles.** Une migration ne doit jamais casser la version de l'application actuellement en production : ajouter une colonne `NOT NULL` sans valeur par défaut sur une table déjà utilisée fait échouer les insertions faites par l'ancien code tant qu'il tourne encore.
- **Stratégie expand/contract** pour un déploiement sans interruption : 1) *expand* — ajouter le nouveau sans toucher à l'existant ; 2) faire cohabiter l'ancien et le nouveau le temps que toutes les instances utilisent le nouveau schéma ; 3) *contract* — supprimer l'ancien, une fois qu'aucune version déployée n'en dépend plus. Renommer une colonne se fait ainsi en ajoutant la nouvelle, migrant les données, adaptant le code, puis en supprimant l'ancienne — jamais en un seul `RENAME COLUMN` si un déploiement progressif est en jeu.
- **Tester les migrations sur une vraie base.** Une base en mémoire (H2) ne se comporte pas toujours comme le SGBD de production (types, contraintes, dialecte SQL). Exécuter les migrations contre un **Testcontainers** de la vraie base (PostgreSQL, MySQL…) détecte des problèmes qu'H2 laisserait passer.
- **Séparer données de référence et données de test.** Les données de référence (statuts, pays, catégories) nécessaires au fonctionnement de l'application ont leur place dans les migrations (migration répétable chez Flyway, `changeSet` avec `context` chez Liquibase). Les données de test ou de démo n'ont pas leur place dans les migrations de production : fixtures de test, ou `context`/profil dédié et non-production.

### Pièges courants

> **`DATABASECHANGELOGLOCK` bloqué après un arrêt brutal.** Si l'application est tuée pendant l'exécution des migrations, le verrou peut rester posé : les démarrages suivants attendent un verrou jamais libéré. Il faut alors le déverrouiller explicitement (`mvn liquibase:releaseLocks`, commande `liquibase release-locks` en ligne de commande, ou directement en base) une fois certain qu'aucune migration n'est réellement en cours.

> **Compter sur le rollback automatique pour tout changeType.** Il n'existe que pour les opérations dont l'inverse est évident (`createTable`, `addColumn`…). Pour une modification de données, l'absence de `rollback` explicite fait échouer toute tentative d'annulation.

> **Renommer ou supprimer une colonne encore utilisée par la version précédente de l'application**, en particulier lors d'un déploiement progressif où plusieurs versions coexistent quelques minutes. D'où l'intérêt d'expand/contract plutôt qu'un changement en une seule étape.

### À retenir

- Liquibase organise les migrations autour d'un **changelog maître** (par défaut `db/changelog/db.changelog-master.yaml`) et de `changeSet` identifiés par **id + author** (+ fichier).
- Il propose des changeTypes abstraits (traduits par SGBD) en plus du SQL direct ; Flyway reste, lui, SQL-first.
- Le rollback est automatique pour certains changeTypes, à écrire soi-même pour les autres.
- `context` et `label` filtrent les changeSet par environnement.
- Dans les deux outils : migrations rétrocompatibles, stratégie expand/contract pour un déploiement sans interruption, tests sur une vraie base (Testcontainers), et séparation nette entre données de référence et données de test.

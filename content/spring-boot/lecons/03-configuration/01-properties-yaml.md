---
id: properties-yaml
chapitre: configuration
ordre: 1
titre: "application.properties et application.yml"
termes:
  - terme: application.properties
    definition: "Fichier de configuration au format `clé=valeur`, une propriété par ligne. Placé par défaut dans `src/main/resources`."
  - terme: application.yml
    definition: "Fichier de configuration au format **YAML**, où les propriétés sont organisées en arborescence par indentation. Mêmes propriétés qu'`application.properties`, syntaxe différente."
  - terme: "Placeholder ${...}"
    definition: "Référence à une autre propriété dans une valeur, ex. `${server.port}`. Accepte une **valeur par défaut** avec `${nom:defaut}`, utilisée si la propriété n'existe pas."
  - terme: Relaxed binding
    definition: "Spring Boot accepte plusieurs écritures d'un même nom de propriété (kebab-case, camelCase, majuscules avec underscores…) et les fait correspondre entre elles. Détaillé pour `@ConfigurationProperties` dans la leçon suivante."
  - terme: Ordre de priorité des sources
    definition: "Quand une même propriété est définie à plusieurs endroits, Spring Boot choisit la source la plus prioritaire. Simplifié : **arguments de ligne de commande** > **variables d'environnement** > **fichiers de configuration**."
  - terme: Variable d'environnement
    definition: "Propriété fournie par le système d'exploitation. Spring Boot la fait correspondre automatiquement à son équivalent en point, ex. la variable `SERVER_PORT` alimente la propriété `server.port`."
  - terme: Fichier de configuration externe
    definition: "Un `application.properties` (ou `.yml`) placé à côté du jar, ou dans un sous-dossier `config/`, est chargé et **prend le pas** sur celui packagé à l'intérieur du jar. Pratique pour changer la configuration sans reconstruire l'application."
quiz:
  - question: "Ces deux extraits représentent-ils la même configuration ?"
    code: |
      # application.properties
      server.port=8081
      spring.datasource.url=jdbc:postgresql://localhost/boutique

      # application.yml
      server:
        port: 8081
      spring:
        datasource:
          url: jdbc:postgresql://localhost/boutique
    choix:
      - "Non, YAML ne supporte pas les propriétés imbriquées comme `datasource`"
      - "Oui, les deux formats définissent les mêmes propriétés, seule la syntaxe change"
      - "Non, il faut utiliser `spring.datasource.url` uniquement en `.properties`"
      - "Oui, mais uniquement si le fichier `.yml` est renommé `.yaml`"
    reponse: 1
    explication: "`.properties` et `.yml` sont deux syntaxes pour les mêmes propriétés à points. En YAML, chaque niveau d'indentation correspond à un segment entre deux points (`server.port` devient `server:` puis `port:` indenté). Les deux extensions `.yml` et `.yaml` sont reconnues par Spring Boot."
  - question: "Que vaut `app.nom` si aucune propriété `app.nom` n'est définie ailleurs ?"
    code: |
      # application.properties
      app.nom=${NOM_BOUTIQUE:Ma Boutique}
    choix:
      - "L'application ne démarre pas, la propriété est obligatoire"
      - "`app.nom` vaut la chaîne littérale `${NOM_BOUTIQUE:Ma Boutique}`"
      - "`app.nom` vaut « Ma Boutique », sauf si la variable d'environnement `NOM_BOUTIQUE` est définie"
      - "`app.nom` vaut toujours « Ma Boutique », la variable d'environnement est ignorée"
    reponse: 2
    explication: "`${NOM_BOUTIQUE:Ma Boutique}` cherche d'abord une propriété (ou variable d'environnement) `NOM_BOUTIQUE` ; si elle n'existe pas, la valeur après `:` est utilisée. Sans le `:defaut`, une propriété absente provoquerait une erreur au démarrage."
  - question: "`server.port=9000` est défini dans `application.properties`. L'application est lancée avec `SERVER_PORT=9090 java -jar app.jar --server.port=9091`. Sur quel port démarre-t-elle ?"
    choix:
      - "9000, le fichier de configuration est toujours prioritaire"
      - "9090, la variable d'environnement l'emporte"
      - "9091, l'argument de ligne de commande est la source la plus prioritaire"
      - "L'application ne démarre pas : conflit entre plusieurs sources"
    reponse: 2
    explication: "Dans l'ordre de priorité simplifié, les arguments de ligne de commande passent avant les variables d'environnement, qui passent elles-mêmes avant les fichiers de configuration. `--server.port=9091` gagne donc face à `SERVER_PORT=9090` et au fichier."
---

## Essentiel

Spring Boot lit sa configuration dans `src/main/resources/application.properties` **ou** `application.yml` (un seul suffit). Ce sont deux syntaxes pour les mêmes propriétés :

```properties
server.port=8081
spring.application.name=boutique-api
logging.level.root=INFO
logging.level.com.boutique=DEBUG
spring.datasource.url=jdbc:postgresql://localhost/boutique
```

```yaml
server:
  port: 8081
spring:
  application:
    name: boutique-api
  datasource:
    url: jdbc:postgresql://localhost/boutique
logging:
  level:
    root: INFO
    com.boutique: DEBUG
```

En YAML, chaque niveau d'indentation correspond à un segment entre deux points. `server.port` devient `server:` puis, en dessous et indenté, `port:`.

Une valeur peut référencer une autre propriété avec `${...}`, avec une valeur par défaut optionnelle : `${server.port:8080}`.

Une même propriété peut être définie à plusieurs endroits (fichier, variable d'environnement, ligne de commande). En simplifiant : **ligne de commande > variable d'environnement > fichier de configuration**. C'est ce qui permet de changer `server.port` sans toucher au code, par exemple avec la variable d'environnement `SERVER_PORT`.

## Détail

### Comment ça marche

Au démarrage, Spring Boot construit un `Environment` à partir de plusieurs sources (fichiers, variables d'environnement, arguments…), puis toutes les classes qui en ont besoin (dont vos beans, via `@Value` ou `@ConfigurationProperties`) viennent y lire les propriétés.

### Exemple 1 — Propriétés courantes

| Propriété | Rôle |
|---|---|
| `server.port` | Port HTTP de l'application (par défaut 8080) |
| `spring.application.name` | Nom logique de l'application (logs, Actuator…) |
| `logging.level.root` | Niveau de log global (`TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`) |
| `logging.level.com.boutique` | Niveau de log pour un package précis |
| `spring.datasource.url` | URL JDBC de la base de données |
| `spring.datasource.username` / `spring.datasource.password` | Identifiants de connexion |

### Exemple 2 — Placeholders avec valeur par défaut

```properties
app.nom-boutique=${NOM_BOUTIQUE:Ma Boutique}
app.url-complete=http://localhost:${server.port}/api
```

`app.url-complete` réutilise `server.port` déjà défini plus haut dans le même fichier : les placeholders peuvent référencer n'importe quelle propriété connue de l'`Environment`, pas seulement des variables d'environnement.

### Exemple 3 — Variable d'environnement

```bash
# équivalent à server.port=9090 dans le fichier
SERVER_PORT=9090 java -jar boutique-api.jar
```

Spring Boot fait correspondre automatiquement `SERVER_PORT` (format des variables d'environnement, en majuscules avec underscores) à la propriété `server.port`. C'est la forme la plus simple du *relaxed binding*.

### Exemple 4 — Fichier de configuration externe

```bash
# app.jar contient application.properties avec server.port=8080
# à côté du jar, un fichier config/application.properties avec server.port=8081
java -jar app.jar
# → démarre sur le port 8081 : le fichier externe l'emporte sur celui du jar
```

Utile pour déployer le même jar sur plusieurs environnements sans le reconstruire : on fournit un fichier de configuration externe différent à chaque fois (ou on utilise les profils, voir la leçon dédiée).

### `.properties` ou `.yml` ?

| | `.properties` | `.yml` |
|---|---|---|
| Syntaxe | `clé=valeur`, une ligne par propriété | Arborescence indentée |
| Répétition des préfixes | Oui (`spring.datasource.url`, `spring.datasource.username`…) | Non, factorisés sous `spring: datasource:` |
| Listes | `app.tags[0]=promo`, `app.tags[1]=solde` | `app.tags:` puis des `- promo` |
| Plusieurs profils dans un seul fichier | Non | Oui, avec des documents séparés par `---` |
| Erreurs fréquentes | Peu | Indentation, tabulations interdites |

Les deux sont valides ; le choix est une question de préférence d'équipe. YAML est plus lisible pour une configuration riche et profondément imbriquée.

### Pièges courants

> **Indentation incohérente en YAML.** YAML interdit les tabulations et est sensible aux espaces. Une erreur d'indentation produit une exception au démarrage, parfois peu explicite. Utilisez systématiquement 2 espaces par niveau.

> **Mélanger les deux formats.** Si `application.properties` **et** `application.yml` sont tous les deux présents, ils sont fusionnés, et `.properties` a la priorité en cas de propriété en double. Mieux vaut choisir un seul format pour tout le projet.

> **Oublier qu'une variable d'environnement écrase le fichier.** Un `SERVER_PORT` laissé dans l'environnement d'une machine peut surprendre : l'application ne démarre pas sur le port attendu, alors que le fichier de configuration est pourtant correct.

### À retenir

- `application.properties` et `application.yml` définissent les **mêmes propriétés**, avec une syntaxe différente.
- `${nom:defaut}` référence une propriété avec une valeur de repli.
- Priorité simplifiée : **ligne de commande > variable d'environnement > fichier de configuration**.
- Une variable d'environnement `SERVER_PORT` alimente la propriété `server.port` sans configuration supplémentaire.
- Un fichier de configuration externe (à côté du jar) prend le pas sur celui packagé à l'intérieur.

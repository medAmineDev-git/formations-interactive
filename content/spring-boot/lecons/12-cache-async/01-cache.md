---
id: cache
chapitre: cache-async
ordre: 1
titre: "Le cache avec @Cacheable"
termes:
  - terme: "@EnableCaching"
    definition: "Annotation posée sur une classe `@Configuration` (ou la classe principale) qui active l'abstraction de cache de Spring. Sans elle, `@Cacheable`, `@CachePut` et `@CacheEvict` sont **silencieusement ignorées**, comme `@EnableAsync` pour `@Async`."
  - terme: "@Cacheable"
    definition: "Pose la mise en cache sur une méthode : au premier appel avec un jeu d'arguments donné, la méthode s'exécute et son résultat est stocké ; aux appels suivants avec les **mêmes arguments**, le résultat est renvoyé depuis le cache sans exécuter la méthode."
  - terme: "@CachePut"
    definition: "Exécute **toujours** la méthode, puis range son résultat dans le cache (en écrasant l'entrée existante). Utile pour une méthode de mise à jour dont on veut aussi rafraîchir le cache, contrairement à `@Cacheable` qui n'exécute la méthode que si l'entrée est absente."
  - terme: "@CacheEvict"
    definition: "Retire une entrée du cache (ou toutes, avec `allEntries = true`). Peut s'exécuter avant la méthode (`beforeInvocation = true`) ou après (comportement par défaut, seulement si la méthode ne lève pas d'exception)."
  - terme: Clé de cache
    definition: "Par défaut, la clé est calculée à partir des **arguments** de la méthode (via `SimpleKeyGenerator`). L'attribut `key` (en SpEL, ex. `key = \"#produit.id\"`) permet de la personnaliser ; `condition` décide **avant** l'appel si le cache s'applique ; `unless` décide **après** l'appel si le résultat doit être mis en cache."
  - terme: CacheManager
    definition: "Bean qui fournit et gère les caches nommés utilisés par `@Cacheable` (`@Cacheable(\"produits\")`). Sans dépendance de cache tierce sur le classpath, Spring Boot utilise par défaut un `ConcurrentMapCacheManager` : un simple `ConcurrentHashMap` en mémoire, **sans expiration ni éviction automatique**."
  - terme: Caffeine et Redis
    definition: "Deux fournisseurs de cache courants avec Spring Boot. Caffeine (`spring.cache.type=caffeine`) est un cache local en mémoire, rapide, avec expiration et taille maximale configurables. Redis (`spring.cache.type=redis`) est un cache **partagé** entre plusieurs instances de l'application, avec un TTL configuré côté client Redis. Dans les deux cas, l'abstraction Spring (`@Cacheable`…) ne change pas ; seule la configuration du fournisseur change."
quiz:
  - question: "Que se passe-t-il à chaque appel de `trouver(id)` avec le même `id` ?"
    code: |
      @Service
      public class ProduitService {

          @Cacheable("produits")
          public Produit trouver(Long id) {
              System.out.println("Recherche en base : " + id);
              return repository.findById(id).orElseThrow();
          }
      }
    choix:
      - "\"Recherche en base : ...\" s'affiche à chaque appel, le cache ne sert qu'à accélérer la sérialisation JSON"
      - "\"Recherche en base : ...\" ne s'affiche qu'au premier appel pour cet `id` ; les suivants renvoient le résultat mis en cache sans exécuter la méthode"
      - "La méthode s'exécute toujours, mais son résultat est comparé à la valeur en cache"
      - "Une erreur au démarrage : `@Cacheable` exige un `CacheManager` déclaré explicitement"
    reponse: 1
    explication: "`@Cacheable` intercepte l'appel via un proxy : si une entrée existe déjà dans le cache `produits` pour la clé (ici, `id`), la méthode n'est **pas exécutée** et la valeur en cache est renvoyée directement. Un `CacheManager` par défaut (`ConcurrentMapCacheManager`) est auto-configuré par Spring Boot, aucune déclaration explicite n'est nécessaire pour démarrer."
  - question: "Quelle différence entre l'attribut `condition` et l'attribut `unless` de `@Cacheable` ?"
    choix:
      - "Aucune, ce sont deux synonymes"
      - "`condition` est évaluée avant l'appel de la méthode (arguments), `unless` est évaluée après (sur le résultat) et empêche la mise en cache si elle est vraie"
      - "`condition` s'applique à `@Cacheable`, `unless` uniquement à `@CacheEvict`"
      - "`unless` détermine la clé de cache, `condition` détermine le nom du cache"
    reponse: 1
    explication: "`condition` (évaluée avant l'appel, sur les arguments) décide si le mécanisme de cache s'applique du tout ; si elle est fausse, la méthode s'exécute normalement à chaque fois, sans jamais lire ni écrire le cache. `unless` (évaluée après, sur le résultat, variable `#result`) empêche seulement l'**écriture** en cache d'un résultat précis, par exemple pour ne pas mettre en cache un résultat `null` : `unless = \"#result == null\"`."
  - question: "Ce service est appelé depuis un contrôleur via `service.mettreAJour(...)`. Que se passe-t-il ?"
    code: |
      @Service
      public class ProduitService {

          public Produit mettreAJour(Long id, Produit maj) {
              Produit produit = trouver(id); // appel interne, this.trouver(id)
              // ... modification ...
              return produit;
          }

          @Cacheable("produits")
          public Produit trouver(Long id) {
              return repository.findById(id).orElseThrow();
          }
      }
    choix:
      - "`trouver(id)` bénéficie normalement du cache, comme si elle était appelée depuis un autre bean"
      - "L'appel `trouver(id)` ne passe pas par le proxy Spring : `@Cacheable` est silencieusement ignorée, la base est interrogée à chaque fois"
      - "Une exception est levée au démarrage à cause de cet appel interne"
      - "Le cache est utilisé, mais uniquement pour le premier appel de l'application"
    reponse: 1
    explication: "Comme `@Transactional` ou `@Async`, `@Cacheable` repose sur un proxy créé autour du bean. Un appel interne (`this.trouver(id)`, ou simplement `trouver(id)` depuis une autre méthode du même bean) ne transite pas par ce proxy : l'annotation est ignorée, sans erreur ni avertissement. C'est le même piège d'auto-invocation que pour les autres annotations basées sur l'AOP de Spring."
---

## Essentiel

L'abstraction de cache de Spring évite de réécrire à la main « chercher en cache, sinon exécuter et stocker ». Il suffit d'annoter une méthode.

```java
@Configuration
@EnableCaching
public class CacheConfig { }

@Service
public class ProduitService {

    @Cacheable("produits")           // clé = l'argument id
    public Produit trouver(Long id) {
        return repository.findById(id).orElseThrow();
    }

    @CacheEvict("produits")          // retire l'entrée après la mise à jour
    public Produit modifier(Long id, Produit maj) {
        return repository.save(maj);
    }
}
```

Trois annotations principales : `@Cacheable` (lit le cache, n'exécute la méthode que si absent), `@CachePut` (exécute toujours, met à jour le cache) et `@CacheEvict` (retire une ou toutes les entrées).

Sans dépendance de cache ajoutée au projet, Spring Boot utilise par défaut un `ConcurrentMapCacheManager` : un cache en mémoire, **sans expiration**. En production, on branche généralement Caffeine (cache local avec TTL) ou Redis (cache partagé entre instances) via `spring.cache.type` — l'abstraction (`@Cacheable`…) ne change pas, seule la configuration du fournisseur change.

Comme `@Transactional`, ce mécanisme repose sur un **proxy** : un appel interne au bean (`this.methode()`) le contourne.

## Détail

### Comment ça marche

1. Le proxy intercepte l'appel à une méthode `@Cacheable`.
2. Il calcule la **clé** (par défaut, à partir des arguments).
3. Si une entrée existe pour cette clé dans le cache nommé → elle est renvoyée, la méthode **n'est pas exécutée**.
4. Sinon → la méthode s'exécute, son résultat est stocké sous cette clé, puis renvoyé.

`@CachePut` saute l'étape 3 : la méthode s'exécute systématiquement. `@CacheEvict` ne lit ni n'écrit de résultat, il retire une entrée (ou tout le cache avec `allEntries = true`).

### Exemple 1 — Personnaliser la clé avec SpEL

```java
@Cacheable(value = "produits", key = "#produit.reference")
public Produit rechercherParReference(Produit produit) {
    return repository.findByReference(produit.getReference());
}
```

Par défaut, la clé serait calculée à partir de l'objet `produit` entier (son `equals`/`hashCode`). Avec `key`, on choisit explicitement le champ `reference`, plus stable et plus lisible dans le cache.

### Exemple 2 — Mettre à jour le cache avec `@CachePut`

```java
@CachePut(value = "produits", key = "#produit.id")
public Produit modifier(Produit produit) {
    return repository.save(produit); // s'exécute toujours
}
```

Contrairement à `@Cacheable`, la méthode `modifier()` s'exécute à chaque appel (il faut bien sauvegarder en base), mais son résultat remplace l'entrée en cache : les lectures suivantes via `trouver(id)` obtiennent la version à jour, sans qu'on ait dû l'évincer manuellement.

### Exemple 3 — Vider tout le cache après une opération globale

```java
@CacheEvict(value = "produits", allEntries = true)
public void reindexerCatalogue() {
    // opération qui invalide potentiellement toutes les entrées
}
```

`allEntries = true` vide le cache entier en une seule opération, plus efficace qu'une éviction entrée par entrée quand on ne peut pas déterminer précisément quelles clés sont concernées.

### Exemple 4 — Configurer un fournisseur (Caffeine)

```xml
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
</dependency>
```

```yaml
spring:
  cache:
    type: caffeine
    cache-names: produits
    caffeine:
      spec: maximumSize=500,expireAfterWrite=10m
```

L'abstraction (`@Cacheable("produits")`) ne change pas une seule ligne : seule la configuration du fournisseur diffère. C'est tout l'intérêt de l'abstraction Spring : passer du cache mémoire par défaut à Caffeine (local, avec TTL) ou Redis (partagé) sans toucher au code métier.

### Les trois annotations comparées

| | `@Cacheable` | `@CachePut` | `@CacheEvict` |
|---|---|---|---|
| Exécute toujours la méthode | ❌ si entrée présente | ✅ | ✅ (elle ne lit pas de résultat à mettre en cache) |
| Effet sur le cache | Ajoute si absent | Écrase toujours | Retire une ou toutes les entrées |
| Cas d'usage typique | Lecture (`findById`) | Mise à jour avec rafraîchissement | Suppression, invalidation globale |

### Pièges courants

> **Auto-invocation.** `this.trouver(id)` (ou un simple appel depuis une autre méthode du même bean) ne passe pas par le proxy : `@Cacheable` est **silencieusement ignorée**. Même piège que `@Transactional` ou `@Async`, pour la même raison (mécanisme basé sur un proxy AOP).

> **Cacher un objet mutable, puis le modifier après coup.** Avec le `ConcurrentMapCacheManager` par défaut, le cache stocke la **référence** de l'objet, pas une copie. Si l'appelant modifie l'objet renvoyé sans repasser par `@CachePut`/`@CacheEvict`, il modifie aussi l'entrée en cache — les appels suivants renvoient l'objet déjà altéré, sans qu'aucune requête n'ait été refaite. Préférer renvoyer des DTO immuables, ou un fournisseur qui sérialise (Redis) plutôt que de stocker la référence brute.

> **Cache local non partagé entre plusieurs instances.** Le `ConcurrentMapCacheManager` par défaut et Caffeine sont des caches **en mémoire, par instance**. Avec plusieurs instances de l'application derrière un load-balancer, chaque instance a son propre cache : une mise à jour évincée (`@CacheEvict`) sur une instance ne l'évince pas sur les autres, qui continuent de servir une valeur périmée. Un cache partagé (Redis) est nécessaire dès que plusieurs instances tournent en parallèle.

### À retenir

- `@Cacheable` lit le cache et n'exécute la méthode que si l'entrée est absente ; `@CachePut` exécute toujours et met à jour ; `@CacheEvict` retire une ou toutes les entrées.
- La clé par défaut vient des arguments de la méthode ; `key`, `condition` et `unless` (SpEL) la personnalisent.
- Le `ConcurrentMapCacheManager` par défaut ne gère **aucune expiration** : en production, brancher Caffeine (local, TTL) ou Redis (partagé entre instances).
- Mécanisme basé sur un **proxy** : l'auto-invocation le contourne, comme pour `@Transactional`.
- Un cache en mémoire n'est pas partagé entre plusieurs instances de l'application : penser à l'invalidation dans un déploiement multi-instances.

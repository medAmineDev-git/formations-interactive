---
id: pieges-proxies
chapitre: aop
ordre: 3
titre: "Les pièges des proxies : auto-invocation et méthodes final"
termes:
  - terme: Auto-invocation
    definition: "Un bean qui appelle une de ses propres méthodes via `this.methode()` (ou simplement `methode()`). L'appel reste **interne à l'objet réel** : il ne passe jamais par le proxy, donc aucun advice AOP ne s'applique — `@Transactional`, `@Cacheable`, `@Async`, `@PreAuthorize` sont silencieusement ignorés."
  - terme: Injection à soi-même (self-injection)
    definition: "Technique qui consiste à injecter le **proxy** du bean dans lui-même (souvent avec `@Lazy` pour éviter un cycle de création), afin que les appels internes passent par `this.self.methode()` et déclenchent les advices."
  - terme: AopContext.currentProxy()
    definition: "Méthode statique qui renvoie le proxy du bean en cours d'exécution, utilisable en dernier recours pour un appel interne. Nécessite d'activer l'exposition du proxy (`exposeProxy = true` sur `@EnableAspectJAutoProxy`, ou équivalent XML)."
  - terme: Méthodes final, private, static
    definition: "Non interceptées par Spring AOP : une méthode `private` ou `static` n'est pas accessible en dehors de la classe (donc jamais appelée via le proxy), et une méthode `final` ne peut pas être redéfinie par le proxy CGLIB, qui a besoin d'en créer une sous-classe."
  - terme: Classe final
    definition: "Une classe `final` ne peut pas être sous-classée : CGLIB ne peut pas générer de proxy pour elle. Spring lève une erreur au démarrage si un aspect (ou `@Transactional`…) doit s'appliquer à un bean dont la classe est `final`."
  - terme: "$$SpringCGLIB$$"
    definition: "Suffixe ajouté au nom de la classe générée par CGLIB pour un proxy, visible avec `getClass().getName()` ou dans une pile d'appel (`ex. CommandeService$$SpringCGLIB$$0`). Signale qu'on manipule un proxy et non l'instance d'origine."
quiz:
  - question: "`creer()` appelle `envoyerConfirmation()` en interne. Que se passe-t-il lors de l'appel à `creer()` depuis un autre bean ?"
    code: |
      @Service
      public class CommandeService {

          public Commande creer(Long id) {
              Commande c = ...;
              envoyerConfirmation(c); // appel interne, this. implicite
              return c;
          }

          @Async
          public void envoyerConfirmation(Commande c) { ... }
      }
    choix:
      - "`envoyerConfirmation` s'exécute normalement de façon asynchrone, sur un autre thread"
      - "`envoyerConfirmation` s'exécute, mais de façon synchrone, sur le même thread que `creer` : `@Async` est ignoré"
      - "Une `IllegalStateException` est levée, car `@Async` ne peut pas être appelé depuis la même classe"
      - "Spring intercepte l'appel via la réflexion, quel que soit le chemin d'appel"
    reponse: 1
    explication: "L'appel `envoyerConfirmation(c)` est un appel interne (`this.envoyerConfirmation(c)` implicite) : il ne passe pas par le proxy du bean, donc `@Async` est ignoré, comme le serait `@Transactional` ou `@Cacheable`. La méthode s'exécute, mais de façon parfaitement synchrone — c'est un bug silencieux, sans erreur ni avertissement."
  - question: "Comment corriger le piège d'auto-invocation le plus simplement, sans changer l'architecture des classes ?"
    choix:
      - "Ajouter `synchronized` sur la méthode interne"
      - "Injecter le bean dans lui-même (souvent avec `@Lazy`) et appeler la méthode via cette référence injectée plutôt que via `this`"
      - "Rendre la méthode `static`"
      - "Ajouter `@Primary` sur la classe"
    reponse: 1
    explication: "Injecter le proxy du bean dans lui-même permet à l'appel de repasser par le proxy et donc de déclencher les advices. `@Lazy` évite l'erreur de dépendance circulaire au démarrage. C'est un pis-aller pratique ; la solution la plus propre reste souvent d'extraire la méthode concernée dans un autre bean, ce qui rend le découpage plus explicite."
  - question: "Pourquoi `@Transactional` sur une méthode `private` n'a-t-il aucun effet ?"
    choix:
      - "Parce que `@Transactional` ne s'applique qu'aux classes `@Repository`"
      - "Parce qu'une méthode `private` n'est jamais accessible depuis l'extérieur de la classe, donc jamais appelée à travers le proxy qui intercepte les advices"
      - "Parce que `private` désactive automatiquement toute annotation sur la méthode"
      - "Ce n'est pas vrai : `@Transactional` fonctionne aussi sur les méthodes `private`, y compris avec des proxies CGLIB"
    reponse: 1
    explication: "Un proxy (JDK ou CGLIB) redéfinit ou implémente les méthodes **visibles depuis l'extérieur** de la classe. Une méthode `private` n'est appelable que depuis l'intérieur de la classe elle-même : l'appel ne peut donc jamais transiter par le proxy, et l'advice ne se déclenche jamais, sans erreur ni avertissement au démarrage."
---

## Essentiel

Puisque Spring AOP repose sur des **proxies**, il n'intercepte que les appels reçus **depuis l'extérieur du bean**, via la référence que les autres beans détiennent (le proxy lui-même). Un appel qu'un bean se fait à lui-même (`this.methode()`, ou simplement `methode()`) reste interne à l'objet réel et **ne passe jamais par le proxy** :

```java
@Service
public class CommandeService {

    public Commande creer(Long id) {
        Commande c = ...;
        envoyerConfirmation(c); // appel interne : le proxy n'est jamais sollicité
        return c;
    }

    @Async // ignoré silencieusement lors de cet appel interne
    public void envoyerConfirmation(Commande c) { ... }
}
```

Ce piège, appelé **auto-invocation**, touche tous les advices basés sur une annotation : `@Transactional`, `@Cacheable`, `@Async`, `@PreAuthorize`. Aucune exception n'est levée — le comportement métier fonctionne, mais silencieusement sans transaction, sans cache, sans asynchronisme.

Solutions, de la plus propre à la plus rapide :

1. **Déplacer** la méthode annotée dans un **autre bean**, appelé normalement depuis l'extérieur.
2. **S'injecter soi-même** (souvent avec `@Lazy` pour éviter un cycle) et appeler la méthode via cette référence.
3. En dernier recours, `AopContext.currentProxy()`.

Autre limite à connaître : les méthodes `private`, `static` et `final` ne sont **jamais** interceptées — les deux premières car inaccessibles depuis l'extérieur, la troisième car un proxy CGLIB ne peut pas redéfinir une méthode `final`.

## Détail

### Exemple 1 — Corriger l'auto-invocation en extrayant un bean

```java
@Service
public class CommandeService {
    private final NotificationService notifications;

    public CommandeService(NotificationService notifications) {
        this.notifications = notifications;
    }

    public Commande creer(Long id) {
        Commande c = ...;
        notifications.envoyerConfirmation(c); // appel externe : passe par le proxy de NotificationService
        return c;
    }
}

@Service
public class NotificationService {
    @Async
    public void envoyerConfirmation(Commande c) { ... }
}
```

C'est la solution la plus fiable : l'appel `notifications.envoyerConfirmation(c)` cible le **proxy** du bean `NotificationService`, qui applique correctement `@Async`. Elle a aussi l'avantage de clarifier les responsabilités.

### Exemple 2 — Corriger par auto-injection

```java
@Service
public class CommandeService {

    private final CommandeService self; // le proxy de soi-même

    public CommandeService(@Lazy CommandeService self) {
        this.self = self;
    }

    public Commande creer(Long id) {
        Commande c = ...;
        self.envoyerConfirmation(c); // passe par le proxy : @Async s'applique
        return c;
    }

    @Async
    public void envoyerConfirmation(Commande c) { ... }
}
```

`@Lazy` est indispensable ici : sans lui, Spring tenterait de construire `CommandeService` pour l'injecter dans son propre constructeur, une dépendance circulaire. Avec `@Lazy`, un proxy est injecté immédiatement, et le vrai bean n'est résolu qu'au premier appel.

### Exemple 3 — AopContext.currentProxy() (à éviter sauf besoin ponctuel)

```java
@EnableAspectJAutoProxy(exposeProxy = true) // nécessaire pour que AopContext fonctionne
@Configuration
public class AopConfig { }
```

```java
@Service
public class CommandeService {

    public Commande creer(Long id) {
        Commande c = ...;
        ((CommandeService) AopContext.currentProxy()).envoyerConfirmation(c);
        return c;
    }

    @Async
    public void envoyerConfirmation(Commande c) { ... }
}
```

Cette approche couple fortement le code à Spring AOP (import de classes internes du framework, cast explicite) et exige d'activer `exposeProxy`. Elle rend le service dépendant d'un détail d'implémentation du conteneur ; à réserver aux cas où déplacer la méthode ou s'auto-injecter n'est vraiment pas envisageable.

### Exemple 4 — Reconnaître un proxy CGLIB

```java
CommandeService bean = context.getBean(CommandeService.class);
System.out.println(bean.getClass().getName());
// CommandeService$$SpringCGLIB$$0
```

Depuis Spring Framework 6, le nom généré pour un proxy CGLIB porte le suffixe `$$SpringCGLIB$$` (les versions antérieures utilisaient `$$EnhancerBySpringCGLIB$$`). Ce détail apparaît aussi dans les piles d'appel lors d'un débogage : le voir confirme qu'on manipule bien un proxy.

### Comparatif : ce qui est intercepté ou non

| Situation | Advice appliqué ? |
|---|---|
| Appel depuis un autre bean, méthode publique | ✅ |
| Appel interne (`this.methode()` ou implicite) | ❌ auto-invocation |
| Méthode `private` | ❌ jamais accessible depuis l'extérieur |
| Méthode `static` | ❌ n'appartient pas à l'instance, pas de proxy possible |
| Méthode `final` sur un proxy CGLIB | ❌ CGLIB ne peut pas la redéfinir |
| Classe `final` | ❌ impossible de créer un proxy CGLIB (sous-classe) |

### Pièges courants

> **`@Transactional` (ou `@Cacheable`, `@Async`) sur une méthode appelée en interne, sans erreur au démarrage.** C'est le piège le plus courant : le code compile, l'application démarre, tout semble fonctionner — jusqu'à ce qu'on constate l'absence de transaction ou l'exécution synchrone en production. Toujours vérifier que la méthode annotée est appelée **depuis un autre bean**.

> **Rendre une classe ou une méthode `final` « pour la sécurité » sur un bean qui a besoin de proxies.** Si un aspect (ou `@Transactional`…) doit s'appliquer et qu'aucune interface n'est disponible, Spring échoue à créer le proxy CGLIB. Éviter `final` sur les classes de service, ou passer explicitement par une interface avec un proxy JDK.

> **Tester un aspect en appelant directement une méthode sur une instance créée avec `new`.** Sans passer par le conteneur Spring, il n'y a pas de proxy et donc aucun advice ne s'exécute : le test ne prouve rien sur le comportement réel en production.

### Tester qu'un aspect est bien appliqué

Un test unitaire classique (instance créée avec `new`) ne peut pas vérifier qu'un aspect fonctionne, puisqu'il n'y a pas de proxy. Il faut un test qui charge le contexte Spring, par exemple avec `@SpringBootTest`, récupérer le bean via `context.getBean(...)` (ou l'injecter), et vérifier le comportement attendu (rollback après exception pour `@Transactional`, deuxième appel qui ne recalcule rien pour `@Cacheable`…). Vérifier que `AopUtils.isAopProxy(bean)` renvoie `true` est un bon point de départ pour confirmer qu'un proxy a bien été créé.

### À retenir

- **L'auto-invocation** (`this.methode()`) contourne le proxy : `@Transactional`, `@Cacheable`, `@Async`, `@PreAuthorize` sont alors silencieusement ignorés.
- Solution la plus propre : **déplacer** la méthode annotée dans un autre bean. Solution rapide : **auto-injection avec `@Lazy`**. `AopContext.currentProxy()` en dernier recours seulement.
- Les méthodes **`private`, `static` et `final`** ne sont jamais interceptées ; une classe **`final`** empêche tout proxy CGLIB.
- Un proxy CGLIB se reconnaît à son nom de classe (`$$SpringCGLIB$$`), utile pour comprendre une pile d'appel ou un `getClass()` inattendu.
- Vérifier un aspect exige un test qui passe par le **conteneur Spring** (donc par le proxy), pas une simple instance créée avec `new`.

---
id: aspect-annotations
chapitre: aop
ordre: 2
titre: "Écrire un aspect avec @Aspect"
termes:
  - terme: spring-boot-starter-aop
    definition: "Dépendance qui apporte AspectJ (utilisé uniquement pour sa **syntaxe** de pointcuts et ses annotations, pas pour son tissage) et active automatiquement le support des aspects `@Aspect` via l'auto-configuration de Spring Boot."
  - terme: "@Aspect"
    definition: "Annotation qui marque une classe comme un aspect. À combiner avec `@Component` (ou une déclaration `@Bean`) pour que Spring la détecte et l'enregistre comme bean — `@Aspect` seule ne suffit pas."
  - terme: "@Before, @After"
    definition: "`@Before` exécute l'advice **avant** la méthode ciblée. `@After` l'exécute **après**, que la méthode se termine normalement ou lève une exception (équivalent d'un `finally`)."
  - terme: "@AfterReturning, @AfterThrowing"
    definition: "`@AfterReturning` s'exécute seulement si la méthode se termine **sans exception** (accès possible à la valeur de retour). `@AfterThrowing` s'exécute seulement si elle **lève une exception** (accès possible à l'exception)."
  - terme: "@Around"
    definition: "L'advice le plus puissant : il englobe complètement l'appel. Il reçoit un `ProceedingJoinPoint` et doit appeler `proceed()` explicitement pour exécuter la méthode ciblée — sinon elle ne s'exécute jamais."
  - terme: ProceedingJoinPoint
    definition: "Paramètre reçu par un advice `@Around`, qui représente l'appel intercepté. `proceed()` déclenche la méthode réelle et renvoie son résultat ; `getArgs()` et `getSignature()` donnent accès aux arguments et à la méthode ciblée."
  - terme: "@Pointcut"
    definition: "Permet de nommer une expression de pointcut dans une méthode vide, pour la réutiliser dans plusieurs advices au lieu de la répéter."
  - terme: "@Order"
    definition: "Définit l'ordre d'exécution quand plusieurs aspects s'appliquent au même join point. Une valeur **plus petite** s'exécute en premier (priorité plus haute) et s'imbrique « à l'extérieur » des autres."
quiz:
  - question: "Que fait cet aspect si `proceed()` n'est jamais appelé ?"
    code: |
      @Aspect
      @Component
      public class ChronoAspect {

          @Around("execution(* com.boutique.service.*.*(..))")
          public Object mesurer(ProceedingJoinPoint pjp) throws Throwable {
              long debut = System.currentTimeMillis();
              System.out.println("Durée : " + (System.currentTimeMillis() - debut) + " ms");
              return null;
          }
      }
    choix:
      - "La méthode ciblée s'exécute normalement, puis la durée s'affiche"
      - "La méthode ciblée ne s'exécute jamais : l'advice renvoie `null` sans avoir appelé `proceed()`"
      - "Une exception est levée au démarrage, car `@Around` exige `proceed()` dans le code"
      - "`proceed()` est appelé implicitement par Spring après le corps de la méthode"
    reponse: 1
    explication: "Un advice `@Around` remplace entièrement l'appel : sans `proceed()`, la méthode ciblée (et toute sa logique métier) n'est jamais exécutée. Ici, la durée affichée est aussi fausse : `debut` et l'instant de mesure sont capturés avant même que `proceed()` soit envisagé."
  - question: "Quelle expression de pointcut cible toutes les méthodes publiques de tous les repositories du package `com.boutique.repository`, quels que soient leurs paramètres ?"
    choix:
      - "`execution(public * com.boutique.repository.*.*(..))`"
      - "`within(* com.boutique.repository.*.*(..))`"
      - "`@annotation(com.boutique.repository.*)`"
      - "`execution(com.boutique.repository.*)`"
    reponse: 0
    explication: "`execution(<modificateur> <retour> <package>.<classe>.<méthode>(<params>))` est la syntaxe complète d'un pointcut par signature. `(..)` signifie « n'importe quels arguments, en nombre et en type ». `within(...)` cible un type entier plutôt qu'une signature de méthode et n'a pas cette syntaxe avec parenthèses de méthode ; `@annotation(...)` cible une annotation, pas un package."
  - question: "Deux aspects `@Order(1)` et `@Order(2)` interceptent la même méthode avec des advices `@Around`. Dans quel ordre s'exécutent-ils ?"
    choix:
      - "L'ordre est indéterminé : Spring ne garantit rien sans `@Order`"
      - "L'aspect `@Order(2)` s'exécute entièrement en premier, puis l'aspect `@Order(1)`"
      - "L'aspect `@Order(1)` s'exécute « à l'extérieur » : il commence avant `@Order(2)` et se termine après lui"
      - "Les deux aspects s'exécutent en parallèle sur deux threads distincts"
    reponse: 2
    explication: "Une valeur `@Order` plus petite indique une priorité plus haute : l'aspect s'exécute en premier « à l'entrée » et en dernier « à la sortie », comme des poupées russes. `@Order(1)` enveloppe `@Order(2)`, qui enveloppe la méthode réelle."
---

## Essentiel

Pour écrire ses propres aspects, il faut d'abord ajouter la dépendance dédiée (absente des starters courants) :

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

Un aspect est une classe `@Aspect` **et** `@Component` (sinon Spring ne la détecte pas), avec une ou plusieurs méthodes **advice** annotées selon le moment souhaité :

```java
@Aspect
@Component
public class ChronoAspect {

    @Around("execution(* com.boutique.service.*.*(..))")
    public Object mesurer(ProceedingJoinPoint pjp) throws Throwable {
        long debut = System.currentTimeMillis();
        Object resultat = pjp.proceed(); // exécute la méthode réelle
        long duree = System.currentTimeMillis() - debut;
        System.out.printf("%s : %d ms%n", pjp.getSignature().toShortString(), duree);
        return resultat;
    }
}
```

Ce pointcut, `execution(* com.boutique.service.*.*(..))`, cible toutes les méthodes publiques de toutes les classes du package `service`. `@Around` est le plus flexible : il reçoit un `ProceedingJoinPoint` et doit appeler `proceed()` pour que la méthode ciblée s'exécute réellement — l'oublier revient à supprimer le comportement de la méthode.

Les autres advices sont plus simples pour des cas ciblés : `@Before` (avant), `@After` (après, comme un `finally`), `@AfterReturning` (après un retour normal) et `@AfterThrowing` (après une exception).

## Détail

### Exemple 1 — Les cinq types d'advice

```java
@Aspect
@Component
public class LoggingAspect {

    @Before("execution(* com.boutique.service.CommandeService.*(..))")
    public void avant(JoinPoint jp) {
        System.out.println("Appel : " + jp.getSignature().getName());
    }

    @AfterReturning(pointcut = "execution(* com.boutique.service.CommandeService.*(..))",
                     returning = "resultat")
    public void apresRetour(JoinPoint jp, Object resultat) {
        System.out.println("Retour : " + resultat);
    }

    @AfterThrowing(pointcut = "execution(* com.boutique.service.CommandeService.*(..))",
                    throwing = "ex")
    public void apresErreur(JoinPoint jp, Exception ex) {
        System.out.println("Erreur : " + ex.getMessage());
    }

    @After("execution(* com.boutique.service.CommandeService.*(..))")
    public void toujours(JoinPoint jp) {
        System.out.println("Fin de : " + jp.getSignature().getName());
    }
}
```

`@Before`, `@After`, `@AfterReturning` et `@AfterThrowing` reçoivent un simple `JoinPoint` (lecture seule) — contrairement à `@Around`, qui reçoit un `ProceedingJoinPoint` capable de contrôler l'exécution.

### Exemple 2 — Un pointcut réutilisable avec @Pointcut

```java
@Aspect
@Component
public class ServiceLoggingAspect {

    @Pointcut("execution(* com.boutique.service.*.*(..))")
    public void methodesService() {} // signature vide : sert seulement de nom

    @Before("methodesService()")
    public void avant(JoinPoint jp) { ... }

    @AfterThrowing(pointcut = "methodesService()", throwing = "ex")
    public void surErreur(JoinPoint jp, Exception ex) { ... }
}
```

`@Pointcut` évite de dupliquer la même expression dans chaque advice. On peut aussi combiner des pointcuts nommés avec `&&`, `||` et `!`.

### Exemple 3 — Une annotation personnalisée @Journalise

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Journalise {
}
```

```java
@Aspect
@Component
public class JournalisationAspect {

    @Around("@annotation(com.boutique.aop.Journalise)")
    public Object journaliser(ProceedingJoinPoint pjp) throws Throwable {
        System.out.println("Début : " + pjp.getSignature().toShortString());
        try {
            return pjp.proceed();
        } finally {
            System.out.println("Fin : " + pjp.getSignature().toShortString());
        }
    }
}
```

```java
@Service
public class CommandeService {

    @Journalise
    public Commande valider(Long id) { ... } // journalisée automatiquement
}
```

`@annotation(...)` cible toutes les méthodes portant une annotation donnée, quel que soit leur package. C'est le même principe que `@Transactional` ou `@Cacheable` : une annotation métier, un aspect qui réagit dessus.

### Exemple 4 — Plusieurs aspects et leur ordre avec @Order

```java
@Aspect
@Order(1) // s'exécute en premier, se termine en dernier
@Component
public class SecuriteAspect { ... }

@Aspect
@Order(2)
@Component
public class ChronoAspect { ... }
```

Sans `@Order`, l'ordre entre plusieurs aspects sur le même join point n'est pas garanti. `@Order` le rend explicite et prévisible — utile quand, par exemple, un aspect de sécurité doit s'exécuter avant un aspect de mesure de temps.

### Les types de pointcuts les plus courants

| Expression | Cible |
|---|---|
| `execution(* Repo.save(..))` | Une méthode précise, tous arguments |
| `execution(* com.boutique.service.*.*(..))` | Toutes les méthodes publiques d'un package (non récursif) |
| `execution(* com.boutique.service..*.*(..))` | Idem, y compris les sous-packages (`..`) |
| `within(com.boutique.service.*)` | Toutes les méthodes des classes d'un package |
| `@annotation(com.boutique.aop.Journalise)` | Toutes les méthodes portant cette annotation |
| `@within(org.springframework.stereotype.Service)` | Toutes les méthodes des classes portant cette annotation |

### Pièges courants

> **Oublier `@Component` sur une classe `@Aspect`.** `@Aspect` décrit le comportement, mais ne fait pas de la classe un bean. Sans `@Component` (ou une déclaration `@Bean` explicite dans une `@Configuration`), Spring ignore complètement l'aspect : aucune erreur, aucun effet.

> **Oublier `proceed()` dans un `@Around`, ou l'appeler deux fois.** L'oublier annule le comportement de la méthode ciblée. L'appeler deux fois exécute la méthode deux fois — rarement l'intention.

> **Un pointcut trop large qui intercepte plus que prévu.** `execution(* com.boutique..*.*(..))` cible tout le package et ses sous-packages, y compris des classes qu'on n'avait pas en tête (contrôleurs, configuration…). Préférer un pointcut précis, ou une annotation dédiée comme `@Journalise`.

### À retenir

- La dépendance `spring-boot-starter-aop` est nécessaire pour écrire ses propres aspects.
- Un aspect est `@Aspect` **et** `@Component`.
- `@Around` est le plus puissant (contrôle total via `proceed()`), les autres advices sont plus simples pour des cas ciblés.
- `@Pointcut` évite de répéter une expression dans plusieurs advices.
- `@annotation(...)` permet de créer sa propre annotation métier déclenchant un aspect, sur le modèle de `@Transactional`.
- `@Order` rend explicite l'ordre d'exécution quand plusieurs aspects s'appliquent au même join point.

---
id: aop-concepts
chapitre: aop
ordre: 1
titre: "Les concepts de l'AOP"
termes:
  - terme: Préoccupation transverse
    definition: "Une logique qui traverse plusieurs couches et plusieurs classes sans rapport avec le métier : journalisation, transactions, sécurité, cache, mesure de performance. Sans AOP, ce code est dupliqué ou mélangé au métier dans chaque méthode concernée."
  - terme: Aspect
    definition: "Le module qui regroupe une préoccupation transverse : une classe annotée `@Aspect` qui définit **où** intervenir (pointcut) et **quoi** faire à cet endroit (advice)."
  - terme: Advice (conseil)
    definition: "Le code exécuté par l'aspect : avant, après, autour d'un appel de méthode. Spring propose `@Before`, `@After`, `@AfterReturning`, `@AfterThrowing` et `@Around`."
  - terme: Pointcut (point de coupe)
    definition: "Une expression qui décrit **quelles méthodes** sont concernées par un advice, par exemple toutes les méthodes publiques d'un package (`execution(* com.boutique.service..*(..))`)."
  - terme: Join point (point de jonction)
    definition: "Un point précis d'exécution où un advice peut s'appliquer. En Spring AOP, c'est toujours **l'exécution d'une méthode d'un bean**."
  - terme: Weaving (tissage)
    definition: "L'opération qui relie l'aspect au code métier. Spring AOP tisse à **l'exécution** (runtime), en enveloppant le bean dans un proxy — contrairement à AspectJ, qui peut tisser à la compilation."
  - terme: Proxy JDK dynamique
    definition: "Proxy généré par `java.lang.reflect.Proxy`, qui implémente les **mêmes interfaces** que le bean ciblé. Utilisé par Spring AOP quand le bean implémente au moins une interface et que `proxy-target-class` vaut `false`."
  - terme: Proxy CGLIB
    definition: "Proxy généré en créant une **sous-classe** du bean ciblé à l'exécution. Nécessaire si le bean n'implémente aucune interface. Spring Boot l'utilise **par défaut pour tous les beans** (`spring.aop.proxy-target-class=true`)."
quiz:
  - question: "Sur quoi repose le mécanisme de Spring AOP ?"
    choix:
      - "La modification du bytecode des classes au moment de la compilation, comme AspectJ"
      - "Des proxies créés à l'exécution, qui enveloppent le bean ciblé pour intercepter les appels de méthode"
      - "Un agent Java chargé au démarrage de la JVM"
      - "Une réécriture du fichier `.class` sur le disque"
    reponse: 1
    explication: "Spring AOP est un mécanisme purement **runtime**, basé sur des proxies : Spring crée un objet qui enveloppe le vrai bean et intercepte les appels de méthode pour exécuter les advices avant, après ou autour de l'appel réel. Il n'y a aucune modification de bytecode ni de fichier `.class`, contrairement au tissage à la compilation d'AspectJ."
  - question: "Un bean `ProduitService` n'implémente aucune interface. Quel type de proxy Spring Boot crée-t-il pour appliquer un aspect sur ses méthodes ?"
    code: |
      @Service
      public class ProduitService {
          public Produit creer(Produit p) { ... }
      }
    choix:
      - "Un proxy JDK dynamique, car c'est le comportement par défaut de Spring"
      - "Un proxy CGLIB : c'est obligatoire ici, et c'est de toute façon le choix par défaut de Spring Boot"
      - "Aucun proxy n'est possible sans interface : l'aspect est silencieusement ignoré"
      - "Une erreur de compilation, car AOP exige une interface"
    reponse: 1
    explication: "Sans interface, un proxy JDK dynamique est impossible : Spring génère un proxy CGLIB (une sous-classe de `ProduitService`). De toute façon, Spring Boot configure `spring.aop.proxy-target-class=true` par défaut : même les beans qui implémentent une interface reçoivent un proxy CGLIB, pas un proxy JDK."
  - question: "Quelle annotation Spring, parmi les suivantes, ne repose PAS sur un mécanisme de proxy AOP ?"
    choix:
      - "`@Transactional`"
      - "`@Cacheable`"
      - "`@Async`"
      - "`@Valid` sur un `@RequestBody`"
    reponse: 3
    explication: "`@Transactional`, `@Cacheable` et `@Async` sont des exemples classiques d'aspects fournis par Spring : chacun enveloppe le bean dans un proxy qui exécute une logique autour de l'appel (ouvrir/fermer une transaction, vérifier/alimenter le cache, déléguer à un thread). `@Valid` déclenche la validation via un `HandlerMethodArgumentResolver` de Spring MVC, un mécanisme indépendant des proxies AOP."
---

## Essentiel

Certaines préoccupations traversent toute l'application sans faire partie du métier : journaliser les appels, ouvrir une transaction, vérifier les droits, mettre en cache un résultat. Écrites à la main, elles se répètent dans chaque méthode concernée et se mélangent à la logique métier. La **programmation orientée aspect (AOP)** extrait ce code dans un module séparé, l'**aspect**, appliqué automatiquement là où il faut.

Un aspect définit deux choses : un **pointcut** (où intervenir — quelles méthodes) et un ou plusieurs **advices** (quoi faire — avant, après, autour de l'appel). Le point précis où l'advice s'exécute s'appelle un **join point** ; en Spring AOP, un join point est toujours l'exécution d'une méthode publique d'un bean.

**Spring AOP repose sur des proxies**, créés à l'exécution. Quand un bean est concerné par un aspect, Spring ne modifie pas sa classe : il crée un objet intermédiaire, le **proxy**, qui reçoit les appels à la place du bean réel, exécute les advices, puis délègue (ou non) à l'objet d'origine.

```java
@Service
public class CommandeService {
    // méthode métier normale, sans aucune trace de logique transverse
    public Commande valider(Long id) { ... }
}
```

Vous connaissez déjà des aspects sans le savoir : `@Transactional`, `@Cacheable`, `@Async`, `@PreAuthorize` sont tous implémentés par des proxies Spring AOP qui enveloppent la méthode annotée.

Deux techniques de proxy existent : **proxy JDK dynamique** (basé sur une interface) et **proxy CGLIB** (sous-classe du bean). Spring Boot utilise **CGLIB par défaut**, même quand le bean implémente une interface.

## Détail

### Comment ça marche

1. Au démarrage, Spring repère les beans concernés par un pointcut d'aspect (parmi les beans qu'il gère — pas les objets créés avec `new`).
2. Pour chacun, il crée un **proxy** au lieu d'exposer directement le bean.
3. Ce proxy est celui **injecté partout ailleurs** (dans les autres beans, via `@Autowired`).
4. À chaque appel de méthode sur le proxy, celui-ci exécute les advices applicables, puis délègue l'appel au bean réel (sauf si un advice décide de ne pas continuer, par exemple un `@Around` qui court-circuite l'appel).

Cette étape de création des proxies est une opération de **post-traitement** des beans, réalisée par un `BeanPostProcessor` juste après leur initialisation. C'est pour cela que l'objet que vous manipulez en pratique (via injection) n'est presque jamais l'instance brute de votre classe, mais son proxy.

### Exemple 1 — Proxy JDK dynamique vs proxy CGLIB

```java
public interface NotificationService {
    void envoyer(String message);
}

@Service
public class EmailNotification implements NotificationService {
    @Override
    public void envoyer(String message) { ... }
}
```

Si `spring.aop.proxy-target-class=false` (comportement historique de Spring Framework seul), Spring crée un **proxy JDK dynamique** : un objet qui implémente `NotificationService`, généré par `java.lang.reflect.Proxy`. Il ne peut intercepter que les méthodes de l'**interface** — un appel via une référence de type `EmailNotification` ne passerait pas par le proxy.

Spring Boot configure `spring.aop.proxy-target-class=true` par défaut : même ici, avec une interface disponible, Spring génère un **proxy CGLIB**, une sous-classe de `EmailNotification`.

### Exemple 2 — Sans interface, CGLIB est obligatoire

```java
@Service
public class CommandeService { // aucune interface
    public Commande valider(Long id) { ... }
}
```

Aucune interface n'existe ici : un proxy JDK dynamique est impossible. Spring génère forcément un proxy CGLIB — une classe générée à l'exécution qui hérite de `CommandeService` et redéfinit ses méthodes pour y glisser les advices.

### Exemple 3 — Les limites de Spring AOP

```java
@Service
public class CommandeService {
    public void valider(Long id) {
        this.envoyerConfirmation(id); // appel interne : voir la leçon sur les pièges des proxies
    }

    @Transactional
    public void envoyerConfirmation(Long id) { ... }
}
```

Spring AOP n'intercepte que l'**exécution de méthodes sur des beans gérés par Spring**, appelées **depuis l'extérieur du bean** (via le proxy). Un appel interne (`this.methode()`) contourne le proxy et n'active aucun advice — un piège fréquent, détaillé dans une leçon dédiée.

### Spring AOP vs AspectJ complet

| | Spring AOP | AspectJ |
|---|---|---|
| Tissage | À l'exécution (proxies) | À la compilation, au chargement, ou à l'exécution |
| Join points | Exécution de méthode de bean Spring uniquement | Méthodes, constructeurs, accès aux champs, initialisation d'objet… |
| Cible | Beans du conteneur Spring uniquement | N'importe quelle classe Java |
| Auto-invocation interceptée | ❌ Non | ✅ Oui (le code est réellement modifié) |
| Dépendance | `spring-boot-starter-aop` | Compilateur ou agent AspectJ séparé |
| Performance | Un appel de méthode en plus (proxy) | Pas de surcoût à l'exécution après tissage |
| Usage typique | Cas courants (transactions, cache, logs métier) | Besoins avancés (tissage de code tiers, champs, constructeurs) |

Spring AOP est un **sous-ensemble volontairement simplifié** d'AspectJ : il en réutilise la syntaxe des pointcuts, mais reste limité aux méthodes de beans Spring. Cela couvre la grande majorité des besoins applicatifs sans la complexité d'un vrai tissage AspectJ.

### Pièges courants

> **Croire que tout appel de méthode passe par le proxy.** Seuls les appels reçus **depuis l'extérieur du bean** (par un autre bean qui détient une référence au proxy) déclenchent les advices. Un appel interne à `this` ne passe jamais par le proxy.

> **Confondre le proxy avec la classe d'origine dans un test ou un débogueur.** `getClass()` sur un bean proxifié par CGLIB ne renvoie pas `CommandeService`, mais une sous-classe générée dont le nom contient `$$SpringCGLIB$$`. C'est normal, mais surprenant la première fois.

### À retenir

- L'AOP extrait les **préoccupations transverses** (transactions, cache, logs, sécurité) hors du code métier, dans des **aspects**.
- Un aspect = un **pointcut** (où) + un ou plusieurs **advices** (quoi).
- Spring AOP tisse à **l'exécution**, via des **proxies** qui enveloppent les beans — pas de modification de bytecode.
- Spring Boot utilise des **proxies CGLIB par défaut** (`spring.aop.proxy-target-class=true`), même quand une interface existe.
- Les join points de Spring AOP se limitent à l'**exécution de méthodes de beans Spring** — d'où les pièges liés à l'auto-invocation.

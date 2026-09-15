---
id: conditions-avancees
chapitre: auto-config-avancee
ordre: 1
titre: "Les annotations @Conditional en détail"
termes:
  - terme: "Condition"
    definition: "Interface (`org.springframework.context.annotation.Condition`) avec une seule méthode, `matches(ConditionContext, AnnotatedTypeMetadata)`. Elle renvoie `true` pour activer l'élément conditionné. Toutes les annotations `@ConditionalOnXxx` de Spring Boot sont construites au-dessus de `@Conditional`, associée à une implémentation de cette interface."
  - terme: "@ConditionalOnClass / @ConditionalOnMissingClass"
    definition: "Activent (ou désactivent) une configuration selon la présence d'une classe dans le classpath, identifiée par référence (`ObjectMapper.class`) ou par nom complet en chaîne (utile si la classe elle-même peut être absente sans faire échouer la compilation)."
  - terme: "@ConditionalOnBean / @ConditionalOnMissingBean"
    definition: "Activent (ou désactivent) un bean selon qu'un bean d'un type donné est **déjà enregistré** au moment de l'évaluation. Réservées en pratique aux classes d'auto-configuration : l'ordre de traitement entre vos propres classes `@Configuration` n'est pas garanti, contrairement à l'ordre entre auto-configurations, contrôlable explicitement."
  - terme: "@ConditionalOnProperty"
    definition: "Active une configuration selon une propriété : `prefix` + `name` (ou `name` complet), `havingValue` (valeur attendue, sinon toute valeur non `false` suffit) et `matchIfMissing` (comportement si la propriété est absente, `false` par défaut)."
  - terme: "@ConditionalOnWebApplication"
    definition: "Active une configuration selon le type d'application : `Type.SERVLET` (web classique), `Type.REACTIVE` (WebFlux) ou `Type.ANY`. Son pendant `@ConditionalOnNotWebApplication` cible les applications non web."
  - terme: "@ConditionalOnResource / @ConditionalOnExpression"
    definition: "`@ConditionalOnResource(resources = \"classpath:...\")` teste la présence d'un fichier. `@ConditionalOnExpression` évalue une expression SpEL, la plus générique mais la plus coûteuse et la plus difficile à lire — à réserver aux cas que les autres conditions ne couvrent pas."
  - terme: "@AutoConfiguration(before/after)"
    definition: "Attributs (`before`, `beforeName`, `after`, `afterName`) de l'annotation `@AutoConfiguration` qui imposent un ordre relatif entre classes d'auto-configuration, indispensable dès qu'une condition (`@ConditionalOnBean` notamment) dépend d'un bean défini par une autre auto-configuration."
  - terme: "@AutoConfigureOrder"
    definition: "Donne un ordre global (au sens de `@Order`) à une classe d'auto-configuration, plus large qu'un `before`/`after` ciblé. Influence l'ordre de **définition** des beans, pas l'ordre de leur **création** (piloté par leurs dépendances)."
quiz:
  - question: "Cette configuration personnalisée (hors auto-configuration) tente d'activer `ServiceA` seulement si `ServiceB` est déjà défini. Pourquoi ce code est-il fragile ?"
    code: |
      @Configuration
      public class ConfigA {
          @Bean
          @ConditionalOnBean(ServiceB.class)
          public ServiceA serviceA() { ... }
      }

      @Configuration
      public class ConfigB {
          @Bean
          public ServiceB serviceB() { ... }
      }
    choix:
      - "`@ConditionalOnBean` ne fonctionne que dans une classe annotée `@AutoConfiguration`, jamais dans un `@Configuration` classique"
      - "Rien n'est garanti : si `ConfigA` est traitée avant `ConfigB` par Spring, `ServiceB` n'est pas encore enregistré et `serviceA` n'est pas créé, sans erreur signalée"
      - "Spring lève une exception au démarrage : dépendance entre deux classes `@Configuration`"
      - "`ConfigB` est toujours traitée en premier, car elle ne contient pas de condition"
    reponse: 1
    explication: "`@ConditionalOnBean` fonctionne techniquement en dehors de l'auto-configuration, mais son résultat dépend de l'ordre de traitement des classes `@Configuration`, qui n'est pas garanti par le component scan. Entre auto-configurations, cet ordre se maîtrise avec `@AutoConfiguration(before/after)` ; entre vos propres classes, aucun mécanisme équivalent standard n'existe — d'où le conseil de réserver ces deux conditions aux auto-configurations."
  - question: "Avec `@ConditionalOnProperty(prefix = \"boutique.cache\", name = \"actif\", havingValue = \"true\", matchIfMissing = true)`, que se passe-t-il si la propriété `boutique.cache.actif` est absente de la configuration ?"
    choix:
      - "La configuration ne s'active pas, car aucune valeur n'est fournie"
      - "Le démarrage échoue : `matchIfMissing` exige que la propriété soit présente"
      - "La configuration s'active : `matchIfMissing = true` fait considérer la condition comme remplie en l'absence de la propriété"
      - "`havingValue` est ignoré si la propriété est absente"
    reponse: 2
    explication: "`matchIfMissing` définit le comportement par défaut quand la propriété n'existe pas du tout. Ici, il vaut `true` : l'absence de `boutique.cache.actif` est traitée comme si la condition était remplie. Sans `matchIfMissing` (valeur par défaut `false`), l'absence de la propriété désactiverait la configuration, comme une valeur différente de `\"true\"`."
  - question: "Une auto-configuration `B` doit s'appliquer après une auto-configuration `A`, car elle a besoin d'un bean défini par `A` via `@ConditionalOnBean`. Quelle solution est la plus directe ?"
    choix:
      - "Utiliser `@ConditionalOnMissingBean` à la place de `@ConditionalOnBean`"
      - "Déclarer `@AutoConfiguration(after = A.class)` sur la classe `B`"
      - "Renommer la classe `B` pour qu'elle soit triée alphabétiquement après `A`"
      - "Ajouter `@Order(2)` sur la classe `B`"
    reponse: 1
    explication: "`@AutoConfiguration(after = A.class)` garantit que `A` est traitée avant `B`, donc que le bean attendu par `@ConditionalOnBean` existe déjà. `@Order` classique n'a pas d'effet sur l'ordre des auto-configurations ; c'est `@AutoConfigureOrder` (un ordre global) ou `before`/`after` (un ordre relatif ciblé) qu'il faut utiliser."
---

## Essentiel

Toutes les annotations `@ConditionalOnXxx` de Spring Boot (`@ConditionalOnClass`, `@ConditionalOnBean`, `@ConditionalOnProperty`…) reposent sur la même mécanique Spring : la méta-annotation `@Conditional`, associée à une implémentation de l'interface `Condition`. Une classe de configuration (ou une méthode `@Bean`) n'est retenue que si toutes ses conditions renvoient `true`.

```java
@AutoConfiguration
@ConditionalOnClass(RedisTemplate.class)
@ConditionalOnMissingBean(CacheManager.class)
public class RedisCacheAutoConfiguration {
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) { ... }
}
```

Point clé pour un usage avancé : `@ConditionalOnBean` et `@ConditionalOnMissingBean` interrogent les définitions de beans **déjà enregistrées au moment où la condition est évaluée**, pas l'état final du contexte. Spring Boot garantit que toutes les classes `@Configuration` de l'application (les vôtres) sont traitées avant l'ensemble des classes d'auto-configuration : c'est ce qui permet à `@ConditionalOnMissingBean`, dans une auto-configuration, de voir fiablement vos beans et de s'effacer devant eux. En revanche, rien ne garantit l'ordre de traitement **entre vos propres classes `@Configuration`** : y poser un `@ConditionalOnBean` qui dépend d'une autre de vos classes est fragile. C'est pourquoi ces deux conditions sont réservées, en pratique, aux classes d'auto-configuration, où l'ordre se maîtrise explicitement avec `@AutoConfiguration(before/after)`.

D'autres conditions ciblent le classpath (`@ConditionalOnClass`), la configuration (`@ConditionalOnProperty`), le type d'application (`@ConditionalOnWebApplication`) ou une expression arbitraire (`@ConditionalOnExpression`).

## Détail

### Comment ça marche

Chaque candidate déclarée dans `AutoConfiguration.imports` (plusieurs centaines, dans un projet Spring Boot typique) ne mérite pas d'être pleinement instanciée pour être évaluée. Spring Boot filtre d'abord à moindre coût les candidates dont la classe requise par `@ConditionalOnClass` est absente du classpath, avant d'évaluer les conditions restantes sur celles qui passent ce premier tri : une optimisation notable du temps de démarrage, `@ConditionalOnClass` et `@ConditionalOnWebApplication` étant les conditions les plus fréquentes et les moins coûteuses à vérifier.

Ensuite, pour chaque classe restante, `matches()` est appelé pour chaque `@Conditional` présent (directement ou via une annotation composée comme `@ConditionalOnBean`). `ConditionContext`, passé à `matches()`, donne accès au `BeanFactory` en cours de construction, à l'`Environment`, au `ResourceLoader` et au `ClassLoader` — tout ce dont une condition personnalisée peut avoir besoin.

### Exemple 1 — OnClass et OnMissingClass

```java
@AutoConfiguration
@ConditionalOnClass(name = "com.rabbitmq.client.Channel") // par nom : tolère l'absence de la classe
public class RabbitAutoConfiguration { ... }
```

Référencer une classe par son nom en chaîne (plutôt que `Channel.class`) évite une `ClassNotFoundException` à la lecture même de l'annotation, quand la dépendance qui la fournit peut être totalement absente du projet.

### Exemple 2 — OnBean, et pourquoi l'ordre compte

```java
@AutoConfiguration
@ConditionalOnMissingBean(DataSource.class)
public class DataSourceAutoConfiguration {
    @Bean
    public DataSource dataSource() { ... }
}
```

Ce `@ConditionalOnMissingBean` fonctionne de façon fiable car **toutes** les classes `@Configuration` de l'application (y compris celles où vous définiriez votre propre `DataSource`) sont enregistrées avant que cette auto-configuration ne soit évaluée. Si vous écriviez la même condition dans une de vos propres classes de configuration, en visant un bean défini par une autre de vos classes, le résultat dépendrait d'un ordre de traitement que Spring ne garantit pas.

### Exemple 3 — OnProperty avec ses quatre attributs

```java
@AutoConfiguration
@ConditionalOnProperty(
        prefix = "boutique.notifications",
        name = "canal",
        havingValue = "sms",
        matchIfMissing = false)
public class SmsNotificationAutoConfiguration { ... }
```

`prefix` + `name` forment la clé complète (`boutique.notifications.canal`). Sans `havingValue`, toute valeur différente de `"false"` suffit à activer la condition. `matchIfMissing` décide du comportement quand la propriété est totalement absente — souvent `true` pour une fonctionnalité activée par défaut, `false` (le défaut) pour une fonctionnalité qu'il faut explicitement demander.

### Exemple 4 — Une condition personnalisée

```java
public class SurLinuxCondition implements Condition {
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String os = context.getEnvironment().getProperty("os.name", "");
        return os.toLowerCase().contains("linux");
    }
}

@AutoConfiguration
@Conditional(SurLinuxCondition.class)
public class OptimisationLinuxAutoConfiguration { ... }
```

Utile quand aucune condition standard ne correspond au besoin. `ConditionContext` donne accès à l'`Environment`, au `BeanFactory` et au `ClassLoader` ; en pratique, ce niveau est rarement nécessaire hors de bibliothèques bas niveau.

### Les conditions les plus utilisées, en un coup d'œil

| Condition | Teste | Coût |
|---|---|---|
| `@ConditionalOnClass` | Une classe est dans le classpath | Faible, filtré tôt |
| `@ConditionalOnWebApplication` | Type d'application (servlet/réactif) | Faible |
| `@ConditionalOnProperty` | Une propriété de configuration | Faible |
| `@ConditionalOnMissingBean` | Aucun bean du type n'existe encore | Dépend de l'ordre |
| `@ConditionalOnResource` | Un fichier est présent | Faible |
| `@ConditionalOnExpression` | Une expression SpEL arbitraire | Le plus élevé, à éviter par défaut |

### Ordonner les auto-configurations

Quand une condition dépend d'un bean défini par une autre auto-configuration, l'ordre entre les deux doit être imposé explicitement, sinon il dépend de l'ordre — non spécifié pour l'application — dans lequel les candidates apparaissent dans `AutoConfiguration.imports` :

```java
@AutoConfiguration(after = DataSourceAutoConfiguration.class)
@ConditionalOnBean(DataSource.class)
public class AuditAutoConfiguration { ... }
```

`@AutoConfigureOrder` donne, lui, un ordre global (comme `@Order`) plutôt qu'une relation ciblée avec une autre classe précise — utile pour se positionner « tôt » ou « tard » sans viser une classe particulière. Dans tous les cas, cet ordre ne joue que sur l'ordre de **définition** des beans : l'ordre de leur **création** reste déterminé par leurs dépendances (et un éventuel `@DependsOn`).

### Pièges courants

> **Utiliser `@ConditionalOnBean`/`@ConditionalOnMissingBean` dans une configuration applicative classique.** Le résultat dépend d'un ordre de traitement entre classes `@Configuration` que Spring ne garantit pas. Réservez ces conditions aux classes d'auto-configuration, où l'ordre se contrôle avec `before`/`after`.

> **Abuser de `@ConditionalOnExpression`.** Une expression SpEL est difficile à relire, plus coûteuse à évaluer, et masque souvent une combinaison de conditions plus simples (`@ConditionalOnProperty` + `@ConditionalOnClass`) qui exprimerait la même règle plus clairement.

> **Oublier `matchIfMissing`.** Sa valeur par défaut est `false` : une fonctionnalité qu'on veut activée « par défaut, sauf désactivation explicite » a besoin de `matchIfMissing = true`, sans quoi l'absence de la propriété la désactive silencieusement.

### À retenir

- Toutes les conditions `@ConditionalOnXxx` reposent sur `@Conditional` et l'interface `Condition`.
- `@ConditionalOnClass`/`@ConditionalOnWebApplication`/`@ConditionalOnProperty` sont fiables partout ; `@ConditionalOnBean`/`@ConditionalOnMissingBean` dépendent d'un ordre de traitement, à réserver aux auto-configurations.
- Vos classes `@Configuration` sont toutes traitées avant les auto-configurations : c'est ce qui rend `@ConditionalOnMissingBean` fiable pour vous laisser la priorité.
- `@AutoConfiguration(before/after)` impose un ordre relatif ciblé entre deux auto-configurations ; `@AutoConfigureOrder` donne un ordre global.
- Une condition personnalisée s'écrit en implémentant `Condition` et en l'appliquant avec `@Conditional(MaCondition.class)`.

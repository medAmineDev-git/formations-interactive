---
id: value-injection
chapitre: configuration
ordre: 2
titre: "Injecter une valeur avec @Value"
termes:
  - terme: "@Value"
    definition: "Annotation qui injecte la valeur d'une propriété (ou une expression) dans un champ, un paramètre de constructeur ou de méthode `@Bean`. Syntaxe : `@Value(\"${nom.propriete}\")`."
  - terme: "Valeur par défaut"
    definition: "`@Value(\"${nom:defaut}\")` : si la propriété `nom` n'existe pas, `defaut` est utilisée à la place. Sans `:defaut`, une propriété absente fait échouer le démarrage."
  - terme: Conversion de types
    definition: "Spring convertit automatiquement la propriété (toujours une chaîne de caractères à l'origine) vers le type du champ : `int`, `boolean`, `long`, une énumération, et même `List<String>` à partir d'une valeur séparée par des virgules."
  - terme: "SpEL (Spring Expression Language)"
    definition: "Langage d'expression de Spring, introduit avec `#{...}` (à ne pas confondre avec `${...}`). Permet des calculs, des appels de méthode ou l'accès à d'autres beans directement dans une annotation."
  - terme: "Could not resolve placeholder"
    definition: "Message d'erreur au démarrage quand `@Value(\"${nom}\")` référence une propriété **absente** et sans valeur par défaut : *« Could not resolve placeholder 'nom' in value \"${nom}\" »*."
quiz:
  - question: "L'application démarre-t-elle avec cette configuration ?"
    code: |
      @Service
      public class FraisService {
          @Value("${app.frais-port}")
          private double fraisPort;
      }
      // application.properties ne contient pas app.frais-port
    choix:
      - "Oui, `fraisPort` vaut 0.0 par défaut"
      - "Oui, `fraisPort` reste `null`"
      - "Non, le démarrage échoue avec « Could not resolve placeholder 'app.frais-port' »"
      - "Non, mais seulement en profil `prod`"
    reponse: 2
    explication: "Sans `:defaut` après le nom de la propriété, `@Value` exige que la propriété existe. Absente, Spring lève une erreur au démarrage plutôt que de laisser un champ à `0.0` silencieusement — ce qui évite un bug difficile à repérer en production."
  - question: "Que vaut `tailleMax` ?"
    code: |
      @Value("${app.taille-max:10}")
      private int tailleMax;
      // application.properties : app.taille-max=25
    choix:
      - "10, la valeur par défaut est toujours utilisée"
      - "25, la propriété du fichier l'emporte sur la valeur par défaut"
      - "Erreur de compilation : on ne peut pas mélanger `int` et une valeur par défaut texte"
      - "0, la conversion échoue silencieusement"
    reponse: 1
    explication: "La valeur après `:` n'est qu'un **repli**, utilisé uniquement si la propriété est absente. Ici `app.taille-max=25` existe, elle est donc utilisée, puis convertie automatiquement en `int`."
  - question: "Pourquoi préférer `@ConfigurationProperties` à `@Value` pour un groupe de propriétés liées (ex. 8 propriétés `app.mail.*`) ?"
    choix:
      - "`@Value` ne fonctionne pas avec des propriétés préfixées par `app.mail`"
      - "`@Value` n'accepte que des propriétés numériques"
      - "`@ConfigurationProperties` regroupe les propriétés dans un seul objet typé et validable, alors qu'il faudrait 8 champs `@Value` séparés, sans validation ni structure"
      - "`@Value` ne peut être utilisé que sur des méthodes `@Bean`"
    reponse: 2
    explication: "`@Value` fonctionne propriété par propriété : rien n'empêche techniquement d'écrire 8 champs `@Value`, mais c'est répétitif, sans validation intégrée et sans structure imbriquée. `@ConfigurationProperties` (leçon suivante) résout ces limites pour un groupe de propriétés cohérent."
---

## Essentiel

`@Value` injecte une propriété directement dans un champ, avec la syntaxe `${nom.propriete}` :

```java
@Service
public class FactureService {

    @Value("${app.tva-taux}")
    private double tauxTva;

    @Value("${app.devise:EUR}") // valeur par défaut si absente
    private String devise;
}
```

Sans valeur par défaut, une propriété absente fait **échouer le démarrage** avec *« Could not resolve placeholder »*. Spring convertit automatiquement la valeur (toujours du texte à l'origine) vers le type du champ : `int`, `boolean`, `List<String>` (à partir d'une valeur séparée par des virgules)…

`@Value` peut aussi s'utiliser sur un paramètre de constructeur, ce qui garde la classe testable et le champ `final` :

```java
@Service
public class FactureService {
    private final double tauxTva;

    public FactureService(@Value("${app.tva-taux}") double tauxTva) {
        this.tauxTva = tauxTva;
    }
}
```

`@Value` fonctionne bien pour **une** propriété isolée. Pour un groupe de propriétés liées, préférez `@ConfigurationProperties` (leçon suivante) : structure, validation et autocomplétion IDE.

## Détail

### Exemple 1 — Types simples et listes

```properties
app.tva-taux=0.20
app.mode-maintenance=false
app.pays-livraison=FR,BE,LU,CH
```

```java
@Value("${app.tva-taux}")
private double tauxTva; // 0.20

@Value("${app.mode-maintenance}")
private boolean maintenance; // false

@Value("${app.pays-livraison}")
private List<String> paysLivraison; // [FR, BE, LU, CH]
```

Une valeur séparée par des virgules est convertie en `List<String>` sans configuration supplémentaire.

### Exemple 2 — SpEL avec `#{...}`

`${...}` lit une propriété. `#{...}` évalue une expression **SpEL** : calculs, accès à un autre bean, appel de méthode.

```java
@Value("#{20 + 1}")
private int reponse; // 21, calculé

@Value("#{systemProperties['user.timezone']}")
private String fuseauSysteme;

// combiner les deux : lire une propriété puis la transformer en SpEL
@Value("#{'${app.pays-livraison}'.split(',')}")
private List<String> paysListe;
```

En pratique, `${...}` seul suffit pour la grande majorité des cas ; SpEL est réservé aux besoins ponctuels un peu plus poussés.

### Exemple 3 — Sur un paramètre de constructeur

```java
@Service
public class NotificationService {

    private final String expediteur;
    private final int delaiMs;

    public NotificationService(
            @Value("${app.mail.expediteur}") String expediteur,
            @Value("${app.mail.delai-ms:5000}") int delaiMs) {
        this.expediteur = expediteur;
        this.delaiMs = delaiMs;
    }
}
```

Comme pour l'injection de dépendances, l'injection par constructeur est préférable : la classe reste testable avec un simple `new NotificationService("no-reply@boutique.fr", 5000)`.

### Exemple 4 — Sur une méthode `@Bean`

```java
@Configuration
public class MailConfig {

    @Bean
    public JavaMailSender mailSender(@Value("${app.mail.hote}") String hote) {
        var sender = new JavaMailSenderImpl();
        sender.setHost(hote);
        return sender;
    }
}
```

### Les limites de `@Value`

- **Pas de regroupement** : chaque propriété est un champ ou un paramètre séparé, même quand plusieurs propriétés forment un même concept (`app.mail.hote`, `app.mail.port`, `app.mail.expediteur`…).
- **Pas de validation** intégrée (impossible d'ajouter directement `@Min`, `@NotBlank`… sur la valeur injectée).
- **Relaxed binding limité** : mieux vaut utiliser le nom exact de la propriété tel qu'écrit dans le fichier de configuration plutôt que de compter sur une correspondance automatique entre kebab-case et camelCase.
- **Pas d'autocomplétion IDE** basée sur vos propres propriétés.

### Pièges courants

> **Propriété absente sans valeur par défaut.** *« Could not resolve placeholder 'app.xxx' in value "${app.xxx}" »* au démarrage. Ajoutez `:defaut`, ou assurez-vous que la propriété est bien définie dans tous les environnements.

> **`@Value` sur un champ `static`.** Spring n'injecte jamais de valeur dans un champ statique : il reste à `null` (ou sa valeur par défaut Java), silencieusement, sans erreur.

> **Confondre `${...}` et `#{...}`.** `${app.nom}` lit une propriété. `#{app.nom}` est interprété comme du SpEL et cherche un bean nommé `app` : erreur ou résultat inattendu.

### À retenir

- `@Value("${prop}")` injecte une propriété ; `@Value("${prop:defaut}")` fournit un repli.
- Sans valeur par défaut, une propriété absente empêche le démarrage.
- Spring convertit automatiquement les types simples, y compris les listes séparées par des virgules.
- `#{...}` (SpEL) permet des expressions plus riches que `${...}`.
- Pour un groupe de propriétés liées, préférez `@ConfigurationProperties`.

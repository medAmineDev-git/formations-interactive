---
id: java-time
chapitre: temps-texte
ordre: 1
titre: "L'API java.time"
termes:
  - terme: LocalDate
    definition: "Date calendaire **sans heure ni fuseau horaire** (une année, un mois, un jour). Convient pour une date de naissance, une date de commande sans notion d'instant précis, une échéance."
  - terme: LocalDateTime
    definition: "Date **et** heure, toujours **sans fuseau horaire**. Utile pour un affichage local ou un calcul purement calendaire, mais ambiguë dès qu'on doit comparer des événements produits dans des fuseaux différents."
  - terme: ZonedDateTime
    definition: "Date, heure **et fuseau horaire complet** (`ZoneId`, ex. `Europe/Paris`), avec les règles de passage à l'heure d'été. Le bon type pour représenter « le rendez-vous du 14 mars à 10h à Paris »."
  - terme: Instant
    definition: "Point précis sur la ligne du temps, exprimé en secondes (et nanosecondes) depuis l'epoch UTC (1er janvier 1970). Ne connaît ni fuseau ni calendrier : c'est le bon type pour horodater un événement et le stocker en base."
  - terme: Duration
    definition: "Quantité de temps **basée sur des secondes/nanosecondes** (heures, minutes, secondes) : `Duration.ofMinutes(30)`. S'utilise avec les types qui portent une heure (`Instant`, `LocalDateTime`, `ZonedDateTime`)."
  - terme: Period
    definition: "Quantité de temps **basée sur le calendrier** (années, mois, jours) : `Period.ofDays(5)`. S'utilise avec les types purement calendaires (`LocalDate`) ; mélanger `Duration` et `LocalDate` lève une exception à l'exécution."
  - terme: ZoneId
    definition: "Identifiant d'un fuseau horaire avec ses règles historiques et ses transitions d'heure d'été, par exemple `ZoneId.of(\"Europe/Paris\")`. À distinguer d'un simple décalage fixe (`ZoneOffset`, ex. `+01:00`), qui ne suit pas les changements d'heure."
  - terme: Clock
    definition: "Source du temps courant, injectable à la place d'un appel direct à `now()`. Permet de fixer une horloge de test (`Clock.fixed(...)`) pour rendre le code qui dépend de la date/heure **testable de façon déterministe**."
quiz:
  - question: "Qu'affiche ce code ?"
    code: |
      LocalDate dateCommande = LocalDate.of(2026, 3, 10);
      dateCommande.plusDays(5);
      System.out.println(dateCommande);
    choix:
      - "2026-03-10"
      - "2026-03-15"
      - "Une erreur de compilation"
      - "null"
    reponse: 0
    explication: "Tous les types de java.time sont immuables : plusDays(5) renvoie une NOUVELLE instance sans modifier dateCommande. Comme le résultat n'est pas récupéré, il est simplement perdu. Le bon réflexe est de réaffecter : dateCommande = dateCommande.plusDays(5)."
  - question: "Que renvoie LocalDate.of(2024, 1, 31).plusMonths(1) ?"
    choix:
      - "2024-02-29 (le dernier jour valide de février, 2024 étant bissextile)"
      - "2024-03-02 (le dépassement de 3 jours est reporté sur mars)"
      - "Une DateTimeException, car février n'a pas 31 jours"
      - "2024-02-28, quelle que soit l'année"
    reponse: 0
    explication: "Quand le jour du mois d'origine n'existe pas dans le mois cible, plusMonths ne déborde pas sur le mois suivant : il ramène la date au dernier jour valide de ce mois cible. 2024 est bissextile, donc février compte 29 jours et non 28 — une nuance à vérifier avant d'affirmer '28' par réflexe."
  - question: "Que se passe-t-il à l'exécution de ce code ?"
    code: |
      LocalDate debut = LocalDate.of(2026, 1, 1);
      LocalDate fin = LocalDate.of(2026, 1, 10);
      Duration delai = Duration.between(debut, fin);
    choix:
      - "UnsupportedTemporalTypeException à l'exécution : LocalDate ne porte pas de champ en secondes"
      - "delai vaut 9 jours, converti automatiquement en secondes"
      - "Une erreur de compilation : Duration.between n'accepte pas LocalDate"
      - "delai vaut 0, car LocalDate n'a pas d'heure"
    reponse: 0
    explication: "Duration.between compile avec deux LocalDate car LocalDate implémente Temporal, mais échoue à l'exécution : LocalDate ne supporte pas les champs en secondes qu'exige Duration. Pour une différence entre deux dates calendaires, il faut Period.between (ou ChronoUnit.DAYS.between pour un simple nombre de jours)."
---

## Essentiel

`java.util.Date` et `java.util.Calendar` sont **mutables**, indexent les mois à partir de **0** (janvier = 0) et exposent une API confuse (`Date` mélange date et heure sans fuseau clair, `Calendar` demande des constantes peu lisibles). Elles ne sont pas dépréciées ni promises à la suppression, mais sont **supplantées depuis Java 8** par `java.time` (JSR-310) : tout nouveau code doit utiliser `java.time`.

Les types principaux, tous **immuables** (une opération comme `plusDays` renvoie une nouvelle instance, sans jamais modifier l'original) :

```java
LocalDate dateCommande = LocalDate.of(2026, 3, 10);
LocalDate dateLivraison = dateCommande.plusDays(5);      // nouvelle instance, dateCommande inchangée
LocalDateTime horodatage = LocalDateTime.of(dateCommande, LocalTime.of(14, 30));

ZonedDateTime rdv = ZonedDateTime.of(horodatage, ZoneId.of("Europe/Paris"));
Instant maintenant = Instant.now();                        // instant UTC, pour horodater un événement

Duration attente = Duration.ofMinutes(30);
Period delaiLivraison = Period.ofDays(5);
```

`LocalDate`/`LocalTime`/`LocalDateTime` n'ont **pas de fuseau** : pratiques pour une date calendaire, insuffisantes dès qu'on compare des événements produits dans des fuseaux différents — utiliser alors `ZonedDateTime` (fuseau complet, avec ses règles d'heure d'été) ou `OffsetDateTime` (simple décalage fixe).

## Détail

### Comment ça marche

Toutes les classes de `java.time` sont immuables et thread-safe : les méthodes `with...`, `plus...`, `minus...` renvoient systématiquement une **nouvelle** instance. Oublier de récupérer le résultat (`date.plusDays(1);` sans réaffectation) est le piège numéro un — le code compile, s'exécute, et ne fait rien.

### Exemple 1 — Calculer une date de livraison

```java
LocalDate dateCommande = LocalDate.now();
LocalDate dateLivraisonEstimee = dateCommande.plusDays(5).with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));

System.out.println("Commande le " + dateCommande + ", livraison estimée le " + dateLivraisonEstimee);
```

`with(TemporalAdjusters...)` applique un ajustement prédéfini (ici : le prochain lundi à partir de la date obtenue) sans écrire de logique de calendrier à la main.

### Exemple 2 — Fuseaux horaires et heure d'été

```java
ZoneId paris = ZoneId.of("Europe/Paris");
LocalDateTime heureLocale = LocalDateTime.of(2026, 3, 29, 2, 30); // nuit du passage à l'heure d'été

ZonedDateTime zdt = ZonedDateTime.of(heureLocale, paris);
System.out.println(zdt); // 2026-03-29T03:30+02:00[Europe/Paris] — l'heure inexistante est décalée
```

En Europe, le dernier dimanche de mars, l'horloge saute de 2h00 à 3h00 : 2h30 **n'existe pas** localement. `ZonedDateTime.of` ne lève pas d'exception dans ce cas : il décale l'heure locale de la durée de l'écart (ici, une heure plus tard). À l'automne, c'est l'inverse : une heure locale existe deux fois (ambiguïté), et `ZonedDateTime` retient par défaut le décalage le plus proche du précédent.

### Exemple 3 — Durée entre deux dates

```java
LocalDate dateCommande = LocalDate.of(2026, 3, 1);
LocalDate dateLivraison = LocalDate.of(2026, 3, 8);

long joursDelai = ChronoUnit.DAYS.between(dateCommande, dateLivraison); // 7
Period periode = Period.between(dateCommande, dateLivraison);           // P7D

Instant debutTraitement = Instant.now();
// ... traitement ...
Duration tempsEcoule = Duration.between(debutTraitement, Instant.now());
```

`ChronoUnit.between` renvoie un simple nombre (pratique pour un delai en jours) ; `Period.between`/`Duration.between` renvoient un objet manipulable, mais chacun **avec le type de champ qui lui correspond** — `Period` avec des dates, `Duration` avec de l'heure ou un instant.

### Exemple 4 — Rendre le temps testable avec Clock

```java
public class ServiceCommande {

    private final Clock horloge;

    public ServiceCommande(Clock horloge) {
        this.horloge = horloge;
    }

    public LocalDate dateLivraisonEstimee() {
        return LocalDate.now(horloge).plusDays(5);
    }
}

// Dans un test :
Clock horlogeFixe = Clock.fixed(Instant.parse("2026-03-10T00:00:00Z"), ZoneOffset.UTC);
ServiceCommande service = new ServiceCommande(horlogeFixe);
assertEquals(LocalDate.of(2026, 3, 15), service.dateLivraisonEstimee());
```

Appeler `LocalDate.now()` directement rend le code dépendant de l'horloge système, donc difficile à tester de façon fiable. Injecter un `Clock` (`Clock.systemUTC()` en production, `Clock.fixed(...)` en test) élimine ce problème.

### Quand choisir quel type

| Type | Représente | Porte un fuseau ? |
|---|---|---|
| `LocalDate` | Une date calendaire seule (jour, mois, année) | Non |
| `LocalTime` | Une heure seule, sans date | Non |
| `LocalDateTime` | Date + heure, sans fuseau | Non |
| `ZonedDateTime` | Date + heure + fuseau complet, avec règles d'heure d'été | Oui (`ZoneId`) |
| `OffsetDateTime` | Date + heure + décalage fixe (ex. `+01:00`), sans règles de transition | Oui (`ZoneOffset` fixe) |
| `Instant` | Un point précis sur la ligne du temps, en UTC | Implicitement UTC |
| `Duration` | Durée en heures/minutes/secondes (time-based) | — |
| `Period` | Durée en années/mois/jours (date-based) | — |
| `Year` / `YearMonth` | Une année seule, ou une paire année-mois | Non |

Comparer deux dates ou instants se fait avec `isBefore`, `isAfter`, `isEqual` (plus lisibles que `compareTo` pour un simple test), disponibles sur tous ces types.

### Pièges courants

> **Oublier de réaffecter le résultat d'une opération.** `dateCommande.plusDays(5);` seul ne fait rien : ces classes sont immuables, il faut écrire `dateCommande = dateCommande.plusDays(5);`. C'est le piège le plus fréquent quand on vient de `Calendar`, dont les méthodes modifient l'objet en place.

> **Mélanger Duration et Period avec le mauvais type.** `Duration.between(dateA, dateB)` avec deux `LocalDate` compile (les deux implémentent `Temporal`) mais lève `UnsupportedTemporalTypeException` à l'exécution, car `LocalDate` ne porte pas de champ en secondes. `Duration` va avec l'heure (`Instant`, `LocalDateTime`, `ZonedDateTime`), `Period` va avec la date (`LocalDate`).

> **Stocker un `LocalDateTime` sans préciser de fuseau.** Un `LocalDateTime` seul ne dit pas "où" : « 14h30 » n'est pas le même instant à Paris et à Tokyo. Pour horodater un événement (date de commande, log, création d'un enregistrement), stocker un `Instant` (UTC) et ne convertir vers un fuseau local qu'à l'affichage.

### À retenir

- `java.time` est immuable et thread-safe ; toute opération `with`/`plus`/`minus` renvoie une nouvelle instance, jamais modifiée sur place — contrairement à `Date`/`Calendar`.
- `LocalDate`/`LocalTime`/`LocalDateTime` n'ont pas de fuseau ; `ZonedDateTime` (règles d'heure d'été) et `OffsetDateTime` (décalage fixe) en portent un.
- `Duration` (secondes/nanosecondes) s'utilise avec l'heure, `Period` (années/mois/jours) avec la date — les mélanger avec le mauvais type lève une exception à l'exécution.
- `Instant` représente un point UTC sur la ligne du temps : c'est en général le bon choix pour horodater un événement et le stocker en base, en ne convertissant vers un fuseau local qu'à l'affichage.
- Injecter un `Clock` plutôt qu'appeler `now()` directement rend le code qui dépend de la date/heure testable de façon déterministe.

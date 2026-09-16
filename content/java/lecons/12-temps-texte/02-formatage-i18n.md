---
id: formatage-i18n
chapitre: temps-texte
ordre: 2
titre: "Formater et internationaliser"
termes:
  - terme: DateTimeFormatter
    definition: "Classe immuable et thread-safe qui convertit une date/heure en texte (`format`) et l'inverse (`parse`). Propose des formats prédéfinis (ISO, localisés) et des motifs personnalisés (`ofPattern`) — à réutiliser, jamais à recréer à chaque appel."
  - terme: Locale
    definition: "Représente une langue et/ou un pays (`Locale.FRANCE`, `Locale.forLanguageTag(\"fr-FR\")`). Influence le format des dates, nombres, devises et le contenu des `ResourceBundle` chargés."
  - terme: NumberFormat
    definition: "Classe de base pour formater des nombres selon une locale : `getInstance` (nombre), `getPercentInstance` (pourcentage), `getCurrencyInstance` (devise). `DecimalFormat` en est l'implémentation concrète la plus courante."
  - terme: DecimalFormat
    definition: "Implémentation de `NumberFormat` pilotée par un **motif** (`\"#,##0.00\"`) : `#` chiffre optionnel, `0` chiffre obligatoire (même si zéro), `,` séparateur de groupe, `.` séparateur décimal (symboles adaptés à la locale à l'affichage)."
  - terme: MessageFormat
    definition: "Compose un texte à partir d'un modèle à emplacements numérotés (`\"{0} article(s) pour {1}\"`) et d'arguments. Gère un pluriel basique via `ChoiceFormat`, mais reste limité face à des règles de pluriel complexes (langues à plusieurs formes)."
  - terme: ResourceBundle
    definition: "Charge un ensemble de textes traduits depuis des fichiers `.properties` nommés par locale (`messages_fr.properties`, `messages_en.properties`). `ResourceBundle.getBundle(\"messages\", locale)` sélectionne le bon fichier ; ces fichiers sont lus en UTF-8 par défaut depuis Java 9."
  - terme: "String.formatted"
    definition: "Méthode d'instance équivalente à `String.format(this, args)`, disponible depuis Java 15 : `\"Total : %.2f €\".formatted(montant)`. Mêmes spécificateurs (`%s`, `%d`, `%f`…) que `String.format`, sensibles à la locale par défaut sauf précision explicite."
quiz:
  - question: "Que produit ce code sur une JVM dont la locale par défaut est le français ?"
    code: |
      double prix = 1234.5;
      System.out.println(String.format("%.2f", prix));
    choix:
      - "1234.50 — %f produit toujours un point décimal, quelle que soit la locale"
      - "1234,50 — %f utilise le séparateur décimal de la locale par défaut de la JVM"
      - "1 234,50"
      - "Une IllegalFormatException : il faut obligatoirement préciser une Locale"
    reponse: 1
    explication: "String.format sans Locale explicite utilise la locale par défaut de la JVM (Locale.getDefault(Category.FORMAT)) ; le spécificateur %f est sensible à cette locale et utilise donc la virgule en français. Pour un résultat garanti indépendant de l'environnement (écrire un nombre dans un fichier CSV ou JSON, par exemple), utiliser String.format(Locale.ROOT, \"%.2f\", prix)."
  - question: "Que vaut date.format(DateTimeFormatter.ofPattern(\"YYYY-MM-dd\")) pour le 31 décembre 2018 (un lundi) ?"
    code: |
      LocalDate date = LocalDate.of(2018, 12, 31);
      DateTimeFormatter f = DateTimeFormatter.ofPattern("YYYY-MM-dd");
      System.out.println(date.format(f));
    choix:
      - "2018-12-31"
      - "2019-12-31 — Y désigne l'année de la semaine ISO, pas l'année civile"
      - "Une DateTimeParseException à l'exécution"
      - "2018-52-31"
    reponse: 1
    explication: "Dans un motif DateTimeFormatter, 'Y' (majuscule) représente l'année de semaine ISO-8601 (week-based-year), pas l'année civile ; 'y' (minuscule) est le bon choix pour une date affichée classiquement. Le 31 décembre 2018 appartient, au sens ISO, à la semaine 1 de l'année 2019 (semaine qui contient le premier jeudi de janvier 2019) : l'année affichée devient 2019, en désaccord avec le mois et le jour. Ce piège classique (YYYY au lieu de yyyy) a causé de vrais bugs en production autour du Nouvel An."
  - question: "Que se passe-t-il à l'exécution de ce code ?"
    code: |
      DateTimeFormatter f = DateTimeFormatter.ofPattern("yyyy-MM-dd");
      LocalDate date = LocalDate.parse("2026-3-5", f);
    choix:
      - "date vaut 2026-03-05, les zéros manquants sont ajoutés automatiquement"
      - "DateTimeParseException, car le motif MM/dd exige deux chiffres alors que la chaîne en contient un seul"
      - "Une erreur de compilation"
      - "date vaut null"
    reponse: 1
    explication: "Un DateTimeFormatter basé sur ofPattern est strict pour l'analyse (parse) : le nombre de lettres du motif numérique (MM, dd) impose le nombre de chiffres attendu. \"2026-3-5\" a un mois et un jour à un seul chiffre, ce qui ne correspond pas à MM/dd et lève DateTimeParseException. Pour accepter les deux formes, il faut un motif plus permissif (M/d) ou nettoyer l'entrée avant analyse."
---

## Essentiel

`DateTimeFormatter` convertit une date/heure en texte et inversement. Trois façons de l'obtenir :

```java
DateTimeFormatter iso = DateTimeFormatter.ISO_LOCAL_DATE;                                    // format ISO fixe : 2026-03-10
DateTimeFormatter localise = DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)
        .withLocale(Locale.FRANCE);                                                          // 10 mars 2026
DateTimeFormatter motif = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.FRANCE);     // 10/03/2026 14:30
```

Un `DateTimeFormatter` est **immuable et réutilisable** : le créer une seule fois (champ `static final`) plutôt qu'à chaque appel.

**Attention aux lettres de motif** : `MM` = mois, `mm` = minute ; `HH` = heure 0-23, `hh` = heure 1-12 (nécessite un marqueur `a` pour AM/PM). Confondre `mm` et `MM` produit un format qui compile et s'exécute, mais affiche la mauvaise valeur — aucune erreur ne le signale.

`parse` fait l'inverse et lève `DateTimeParseException` si le texte ne correspond pas exactement au motif :

```java
LocalDate date = LocalDate.parse("10/03/2026", DateTimeFormatter.ofPattern("dd/MM/yyyy"));
```

Pour les nombres et devises, `NumberFormat`/`DecimalFormat` sont sensibles à la `Locale` : le séparateur décimal n'est pas toujours un point (`,` en français). `String.format`/`formatted` héritent de la même sensibilité pour `%f`, sauf `Locale` explicite.

## Détail

### Exemple 1 — Formats prédéfinis et motif personnalisé

```java
LocalDateTime commande = LocalDateTime.of(2026, 3, 10, 14, 30);

System.out.println(commande.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));  // 2026-03-10T14:30:00

DateTimeFormatter court = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.SHORT).withLocale(Locale.FRANCE);
System.out.println(commande.format(court));                                  // 10/03/2026 14:30

DateTimeFormatter facture = DateTimeFormatter.ofPattern("dd MMMM yyyy 'à' HH'h'mm", Locale.FRANCE);
System.out.println(commande.format(facture));                                // 10 mars 2026 à 14h30
```

Les formats `ISO_*` sont fixes (indépendants de la locale) : à privilégier pour un échange entre systèmes (API, fichiers). Les formats `ofLocalizedDate/Time/DateTime` et les motifs personnalisés servent à l'affichage utilisateur.

### Exemple 2 — Les lettres de motif exactes

| Lettre | Signifie | Exemple (10 mars 2026, 14h30, Paris) |
|---|---|---|
| `y` | Année (de l'ère) | `2026` |
| `Y` | Année de semaine ISO — **diffère de `y` en fin/début d'année**, piège classique | `2026` (ou une autre année selon la semaine) |
| `M` / `MM` / `MMM` / `MMMM` | Mois (nombre ou texte selon le nombre de lettres) | `3` / `03` / `mars` (selon nombre de lettres, texte via `MMM`/`MMMM`) |
| `d` | Jour du mois | `10` |
| `E` / `EEEE` | Jour de la semaine (texte court/long) | `mar.` / `mardi` |
| `H` | Heure, 0 à 23 | `14` |
| `h` | Heure, 1 à 12 (utiliser avec `a`) | `02` |
| `m` | Minute | `30` |
| `s` | Seconde | `00` |
| `a` | Marqueur AM/PM | `PM` |
| `z` | Nom du fuseau | `CET` |
| `X` | Décalage ISO-8601 (`Z` si zéro) | `+01:00` |

`MM` (mois) et `mm` (minute) se ressemblent visuellement mais désignent des champs différents ; de même `HH` (0-23) et `hh` (1-12, incomplet sans `a`). Une confusion se voit immédiatement à l'exécution — vérifier systématiquement un motif sur un exemple avant de le figer.

### Exemple 3 — Nombres, pourcentages et devises selon la locale

```java
double montant = 1234.5;

NumberFormat nombreFr = NumberFormat.getInstance(Locale.FRANCE);
System.out.println(nombreFr.format(montant));           // 1 234,5 (virgule décimale, espace de groupement)

NumberFormat deviseFr = NumberFormat.getCurrencyInstance(Locale.FRANCE);
System.out.println(deviseFr.format(montant));            // 1 234,50 €

NumberFormat pourcentage = NumberFormat.getPercentInstance(Locale.FRANCE);
System.out.println(pourcentage.format(0.086));           // 9 % (arrondi, multiplication par 100 automatique)

DecimalFormat motifPersonnalise = new DecimalFormat("#,##0.00");
System.out.println(motifPersonnalise.format(montant));   // 1,234.50 (symboles de la locale par défaut de la JVM)
```

`getPercentInstance` multiplie automatiquement la valeur par 100 et ajoute `%` : passer `0.086` (et non `8.6`) est le piège classique. `DecimalFormat` construit avec un motif littéral utilise les symboles de la locale **courante** à l'affichage — préciser un `DecimalFormatSymbols` si le résultat doit être indépendant de l'environnement d'exécution.

### Exemple 4 — Messages et ressources traduites

```java
// messages_fr.properties : bienvenue=Bonjour {0}, votre panier contient {1} article(s).
// messages_en.properties : bienvenue=Hello {0}, your cart has {1} item(s).

ResourceBundle bundle = ResourceBundle.getBundle("messages", Locale.FRANCE);
String motif = bundle.getString("bienvenue");
String texte = MessageFormat.format(motif, "Camille", 3);
System.out.println(texte); // Bonjour Camille, votre panier contient 3 article(s).
```

`ResourceBundle.getBundle` choisit le fichier `.properties` le plus proche de la locale demandée (repli sur une locale par défaut si aucune correspondance exacte). Depuis Java 9, ces fichiers sont lus en **UTF-8** par défaut (auparavant ISO-8859-1, ce qui exigeait l'outil `native2ascii` pour les caractères accentués).

`MessageFormat` gère un pluriel simple avec `ChoiceFormat` intégré, mais reste limité dès qu'une langue a plusieurs formes plurielles (au-delà de singulier/pluriel) : pour des besoins d'internationalisation poussés, une bibliothèque dédiée aux règles CLDR est souvent préférable.

### Pièges courants

> **`YYYY` (année de semaine ISO) au lieu de `yyyy` (année civile).** `Y` désigne l'année de la semaine ISO-8601, qui peut différer de l'année civile en tout début ou toute fin d'année (ex. 31 décembre 2018, un lundi, appartient à la semaine 1 de 2019). Utiliser `y` pour une date affichée normalement ; réserver `Y` aux formats explicitement basés sur la numérotation de semaine.

> **Confondre `mm`/`MM` ou `hh`/`HH`.** `mm` = minute, `MM` = mois ; `HH` = heure 0-23, `hh` = heure 1-12 (incomplète sans le marqueur `a`). Aucune exception n'est levée : le motif produit juste la mauvaise valeur, à repérer uniquement en relisant la sortie.

> **`parse` strict sur le nombre de chiffres attendu.** Un motif `yyyy-MM-dd` exige exactement deux chiffres pour le mois et le jour ; `"2026-3-5"` lève `DateTimeParseException`, même si la date est valide. Adapter le motif (`M/d`) ou normaliser la chaîne d'entrée avant l'analyse.

### À retenir

- Créer un `DateTimeFormatter` une seule fois et le réutiliser ; privilégier les formats `ISO_*` pour l'échange entre systèmes, les formats localisés ou un motif personnalisé pour l'affichage.
- Vérifier chaque lettre d'un motif personnalisé sur un exemple concret : `MM` ≠ `mm`, `HH` ≠ `hh`, `y` ≠ `Y` — les confusions ne provoquent aucune erreur visible.
- `parse` est strict : le texte doit correspondre exactement au motif (nombre de chiffres compris), sous peine de `DateTimeParseException`.
- `NumberFormat`/`DecimalFormat`/`String.format` sont sensibles à la `Locale` (séparateur décimal, groupement) ; préciser une `Locale` explicite (ou `Locale.ROOT`) dès qu'un résultat doit être indépendant de l'environnement d'exécution.
- `ResourceBundle` + fichiers `.properties` par locale est la base de l'internationalisation des textes ; `MessageFormat` compose des messages paramétrés mais reste limité pour des règles de pluriel complexes.

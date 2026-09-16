---
id: formats-locale
chapitre: i18n-a11y
ordre: 2
titre: "Dates, nombres et devises selon la locale"
termes:
  - terme: "LOCALE_ID"
    definition: "Jeton d'injection qui définit la locale active de l'application (`'fr'`, `'en-US'`…). Les pipes `date`, `number`, `currency` et `percent` l'utilisent par défaut pour choisir leur format."
  - terme: "registerLocaleData"
    definition: "Fonction qui enregistre les données d'une locale (formats de date, séparateurs de nombres, symboles monétaires, pluriel…) auprès d'Angular. Nécessaire pour toute locale autre que `en-US`, qui est incluse par défaut."
  - terme: "DEFAULT_CURRENCY_CODE"
    definition: "Jeton d'injection qui fixe le code devise ISO 4217 (`'EUR'`, `'USD'`…) utilisé par le pipe `currency` quand aucun code n'est passé explicitement."
  - terme: "DatePipe"
    definition: "Pipe `date` qui formate une date selon un format prédéfini (`'short'`, `'medium'`, `'fullDate'`…) ou personnalisé, en tenant compte de la locale et, en option, d'un fuseau horaire."
  - terme: "CurrencyPipe"
    definition: "Pipe `currency` qui formate un nombre en devise, avec le symbole, le nombre de décimales et la position du symbole propres à la locale active."
  - terme: "Intl"
    definition: "API JavaScript native (`Intl.DateTimeFormat`, `Intl.NumberFormat`…) sur laquelle s'appuient en partie les pipes Angular, directement utilisable pour des besoins de formatage non couverts par les pipes."
  - terme: "Fuseau horaire"
    definition: "Décalage horaire appliqué à l'affichage d'une date. Une date stockée en UTC doit être explicitement convertie ou affichée avec le bon paramètre de fuseau, sinon elle apparaît décalée par rapport à l'heure attendue par l'utilisateur."
quiz:
  - question: "Que faut-il faire pour que le pipe `date` affiche correctement les dates en français (mois, jours de la semaine) dans une application dont `LOCALE_ID` vaut `'fr'` ?"
    choix:
      - "Rien, toutes les locales sont incluses par défaut dans Angular"
      - "Enregistrer les données de la locale avec `registerLocaleData(localeFr)` (import depuis `@angular/common/locales/fr`), en plus de fournir `LOCALE_ID: 'fr'`"
      - "Installer un package tiers, Angular ne fournit aucune donnée de locale autre que l'anglais"
      - "Changer la langue du navigateur de l'utilisateur"
    reponse: 1
    explication: "Seule la locale `en-US` est incluse par défaut. Pour toute autre locale, il faut enregistrer ses données avec `registerLocaleData()` (import depuis `@angular/common/locales/<code>`) **et** fournir `LOCALE_ID` avec la bonne valeur ; sans l'enregistrement, Angular lève une erreur au moment du formatage."
  - question: "Une commande a été enregistrée en base avec la date `2024-03-15T23:30:00Z` (UTC). Le pipe `date` l'affiche `15/03/2024 23:30` alors que l'utilisateur, à Paris (UTC+1 en mars), s'attend à voir le lendemain matin. Quelle est la cause la plus probable ?"
    code: |
      {{ commande.dateCreation | date:'short' }}
    choix:
      - "Le pipe `date` ignore toujours le fuseau horaire, il faut utiliser `Intl.DateTimeFormat` à la place"
      - "Sans paramètre de fuseau explicite, le pipe `date` affiche par défaut dans le fuseau horaire local du navigateur — sauf si l'environnement d'exécution (ex. certains contextes serveur) impose UTC, auquel cas l'heure UTC brute apparaît telle quelle"
      - "`dateCreation` doit obligatoirement être une chaîne, pas un objet `Date`"
      - "Le format `'short'` n'affiche jamais l'heure, seulement la date"
    reponse: 1
    explication: "Le piège classique : une date UTC affichée sans tenir compte du fuseau attendu. Le pipe `date` accepte un troisième paramètre de fuseau (`date:'short':'+0100'` ou un identifiant IANA selon le contexte) pour forcer explicitement la conversion — s'y fier sans vérifier le fuseau effectif de l'environnement d'exécution est une source fréquente de décalages d'une heure (ou plus)."
  - question: "Quel est le rôle de `DEFAULT_CURRENCY_CODE` ?"
    choix:
      - "Il traduit automatiquement les montants d'une devise à une autre selon un taux de change"
      - "Il fournit le code devise (ex. `'EUR'`) utilisé par le pipe `currency` quand aucun code n'est passé explicitement dans le template"
      - "Il empêche d'afficher un montant dans une autre devise que celle définie"
      - "Il définit le nombre de décimales affichées, indépendamment de la devise"
    reponse: 1
    explication: "`DEFAULT_CURRENCY_CODE` est juste une valeur par défaut pour `{{ prix | currency }}` sans argument. On peut toujours afficher une autre devise ponctuellement avec `{{ prix | currency:'USD' }}` ; le nombre de décimales et le symbole dépendent de la devise affichée et de la locale active, pas de ce jeton."
---

## Essentiel

Les pipes `date`, `number`, `currency` et `percent` formatent une valeur **selon la locale active**, définie par le jeton `LOCALE_ID` (`'fr'`, `'en-US'`…).

```ts
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr);

// dans les providers de l'application
{ provide: LOCALE_ID, useValue: 'fr' }
```

Seule la locale `en-US` est incluse par défaut : toute autre locale doit être **enregistrée** avec `registerLocaleData()`, sinon Angular lève une erreur au premier formatage.

```html
{{ produit.prix | currency:'EUR' }}      <!-- 49,90 € -->
{{ commande.date | date:'longDate' }}    <!-- 15 mars 2024 -->
{{ stock.tauxRemplissage | percent }}    <!-- 82 % -->
```

`DEFAULT_CURRENCY_CODE` fixe la devise utilisée quand le pipe `currency` est appelé sans argument. Pour les dates, le piège le plus fréquent est le **fuseau horaire** : une date stockée en UTC doit être affichée avec un fuseau explicite si on veut l'heure locale de l'utilisateur, sinon le pipe utilise le fuseau du navigateur (ou de l'environnement d'exécution côté serveur, qui n'est pas toujours le même).

## Détail

### Comment ça marche

`LOCALE_ID` est un jeton d'injection lu par les pipes de formatage (`DatePipe`, `DecimalPipe`, `CurrencyPipe`, `PercentPipe`) au moment de produire leur sortie. Changer sa valeur change l'ensemble des formats de l'application : séparateurs de milliers, ordre jour/mois/année, symbole et position de la devise, pluriel des unités. Les pipes s'appuient en partie sur les données enregistrées par `registerLocaleData()` et, pour certains cas, sur l'API `Intl` du navigateur.

### Exemple 1 — Formats prédéfinis et personnalisés du pipe `date`

```html
<p>{{ commande.date | date:'short' }}</p>        <!-- 15/03/24 14:30 -->
<p>{{ commande.date | date:'fullDate' }}</p>      <!-- vendredi 15 mars 2024 -->
<p>{{ commande.date | date:'dd/MM/yyyy HH:mm' }}</p> <!-- format personnalisé -->
```

Les formats prédéfinis (`'short'`, `'medium'`, `'long'`, `'full'`, et leurs variantes `Date`/`Time`) s'adaptent à la locale active ; un format personnalisé (chaîne de motifs comme `'dd/MM/yyyy'`) garde la même structure quelle que soit la locale — à utiliser avec prudence si l'application est vraiment multilingue.

### Exemple 2 — Devise et pourcentage

```html
{{ produit.prix | currency:'EUR':'symbol':'1.2-2' }}
<!-- 49,90 € : devise EUR, symbole affiché, 2 décimales minimum et maximum -->

{{ produit.prixUsd | currency:'USD':'symbol' }}
<!-- $49.90 avec LOCALE_ID='en-US', 49,90 $US avec LOCALE_ID='fr' -->

{{ stock.tauxRemplissage | percent:'1.0-1' }}
<!-- 82,3 % -->
```

Le même montant en `EUR` s'affiche différemment selon la locale (position du symbole, séparateur décimal) : c'est la locale qui pilote la mise en forme, la devise reste la même donnée.

### Exemple 3 — Piège classique du fuseau horaire

```ts
// Donnée reçue de l'API, en UTC
commande.dateCreation = '2024-03-15T23:30:00Z';
```

```html
{{ commande.dateCreation | date:'short' }}
<!-- Sans fuseau explicite : dépend du fuseau du navigateur (ou du serveur en SSR) -->

{{ commande.dateCreation | date:'short':'Europe/Paris' }}
<!-- Force l'affichage dans le fuseau de Paris, quel que soit l'environnement d'exécution -->
```

Le troisième paramètre du pipe `date` accepte un décalage (`'+0100'`) ou, selon la version d'Angular, un identifiant de fuseau IANA. Le fixer explicitement évite qu'un rendu serveur (souvent en UTC) et un rendu navigateur (fuseau local) n'affichent deux heures différentes pour la même donnée.

### Exemple 4 — Saisie selon la locale et complément avec `Intl`

```ts
// Un <input type="number"> ou type="date"> natif suit déjà les conventions du navigateur.
// Pour parser un nombre saisi au format français ("1 234,56") :
const valeur = Number('1234,56'.replace(',', '.'));

// Intl natif pour un besoin non couvert par les pipes (ex. liste de devises supportées) :
const formateur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
formateur.format(1234.5); // "1 234,50 €"
```

Les pipes Angular couvrent l'essentiel de l'affichage ; `Intl`, natif au navigateur, reste utile pour des besoins plus fins (tri localisé, formats non prévus par les pipes, listes de devises ou de langues disponibles) sans dépendance supplémentaire.

### Pièges courants

> **Oublier `registerLocaleData()`.** Sans elle, Angular lève une erreur du type `Missing locale data for the locale "fr"` dès le premier pipe de formatage exécuté avec cette locale. `LOCALE_ID` seul ne suffit pas : il indique quelle locale utiliser, pas les données de cette locale.

> **Confondre stockage UTC et affichage local.** Stocker des dates en UTC côté serveur est une bonne pratique ; encore faut-il les afficher dans le fuseau attendu par l'utilisateur. Ne pas préciser de fuseau au pipe `date` revient à afficher dans le fuseau de l'environnement qui exécute le rendu — different entre un rendu serveur (SSR) et un rendu client si rien n'est fixé explicitement.

> **Formater une devise sans préciser le nombre de décimales attendu.** Le pipe `currency` applique par défaut le nombre de décimales usuel de la devise (2 pour l'euro, 0 pour le yen…), ce qui peut surprendre pour des montants nécessitant une précision particulière (ex. un prix unitaire à 3 décimales) : le quatrième paramètre (`'1.2-2'`, `'1.3-3'`…) permet de le fixer explicitement.

### À retenir

- `LOCALE_ID` pilote le format des pipes `date`, `number`, `currency`, `percent` ; il doit être accompagné de `registerLocaleData()` pour toute locale autre que `en-US`.
- `DEFAULT_CURRENCY_CODE` ne fait que fournir une devise par défaut au pipe `currency`, jamais une conversion.
- Le piège le plus fréquent : une date UTC affichée sans fuseau explicite, décalée par rapport à l'heure attendue par l'utilisateur — préciser le fuseau au pipe `date` quand c'est important.
- Les formats prédéfinis (`'short'`, `'fullDate'`…) s'adaptent à la locale ; un format personnalisé garde la même structure dans toutes les langues.
- `Intl` (natif) complète les pipes pour des besoins de formatage plus spécifiques, sans dépendance supplémentaire.

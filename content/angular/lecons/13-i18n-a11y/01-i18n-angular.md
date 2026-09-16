---
id: i18n-angular
chapitre: i18n-a11y
ordre: 1
titre: "Traduire une application avec l'i18n d'Angular"
termes:
  - terme: "@angular/localize"
    definition: "Package officiel qui fournit l'infrastructure d'internationalisation d'Angular : la fonction `$localize`, la prise en charge de l'attribut `i18n` par le compilateur, et les outils d'extraction/fusion des traductions."
  - terme: "i18n"
    definition: "Attribut de template qui marque un élément comme traduisible. Angular l'utilise à la fois pour extraire le texte source et pour injecter la bonne traduction au build."
  - terme: "$localize"
    definition: "Fonction *tagged template* utilisée en TypeScript pour marquer une chaîne comme traduisible, en dehors d'un template HTML (messages construits dynamiquement, notifications, `Validators`)."
  - terme: "ng extract-i18n"
    definition: "Commande CLI qui parcourt les templates et le code source à la recherche des marqueurs `i18n` et `$localize`, et génère un fichier de traduction source (`messages.xlf` par défaut)."
  - terme: "Message ICU"
    definition: "Syntaxe `{expression, plural, ...}` ou `{expression, select, ...}` utilisée dans un texte marqué `i18n` pour gérer le pluriel ou choisir un texte selon la valeur d'une variable (genre, statut…)."
  - terme: "Locale"
    definition: "Identifiant d'une langue et d'une région (ex. `fr`, `fr-CA`, `en-US`) utilisé par Angular pour choisir la traduction, le format des nombres/dates, et générer un build dédié."
  - terme: "Build par locale"
    definition: "Résultat de la compilation Angular quand `i18n.locales` est configuré : un dossier de sortie distinct par langue, contenant une application déjà traduite (aucune traduction n'a lieu au chargement)."
quiz:
  - question: "Que fait exactement l'attribut `i18n` posé sur un élément de template ?"
    code: |
      <h1 i18n="Titre de la page d'accueil|">Bienvenue dans la boutique</h1>
    choix:
      - "Il traduit le texte immédiatement dans le navigateur, selon la langue détectée"
      - "Il marque le texte comme traduisible : `ng extract-i18n` l'extrait dans un fichier source, et le texte n'est réellement remplacé qu'au moment du build pour une locale donnée"
      - "Il appelle automatiquement une API de traduction au premier rendu du composant"
      - "Il n'a aucun effet en dehors du mode développement"
    reponse: 1
    explication: "L'attribut `i18n` ne traduit rien par lui-même : c'est un marqueur pour l'outillage Angular. La traduction effective est un remplacement de texte fait au **build**, une fois par locale configurée — il n'y a pas de traduction « à la volée » dans le navigateur avec cette approche."
  - question: "Une équipe utilise l'i18n officielle d'Angular et se plaint de devoir relancer un build complet pour corriger une seule faute dans une traduction en production. Quelle est la cause ?"
    choix:
      - "C'est un bug d'Angular, ce comportement n'est pas voulu"
      - "L'approche officielle traduit au **build** : chaque locale produit un bundle distinct avec le texte déjà remplacé, il n'y a pas de fichier de traduction chargé et interprété au runtime"
      - "L'équipe a mal configuré `ng serve`"
      - "C'est uniquement le cas si le format de traduction choisi est XLIFF ; le format JSON permet de corriger sans rebuild"
    reponse: 1
    explication: "C'est la contrepartie assumée de l'approche : les traductions sont « compilées » dans chaque bundle, ce qui donne d'excellentes performances (pas de texte à charger ni interpréter au runtime) mais impose un rebuild pour tout changement de texte, quel que soit le format de fichier choisi. Une librairie comme Transloco ou ngx-translate, qui charge les traductions au runtime, évite ce problème au prix d'un travail de traduction fait dans le navigateur."
  - question: "Que produit ce message ICU selon la valeur de `nombreArticles` ?"
    code: |
      <span i18n>
        {nombreArticles, plural, =0 {Panier vide} =1 {1 article} other {{{nombreArticles}} articles}}
      </span>
    choix:
      - "Il faut écrire une condition `@if`/`@else` séparée : les messages ICU ne gèrent pas le pluriel"
      - "Angular choisit automatiquement la bonne forme (« Panier vide », « 1 article », ou « N articles ») selon la valeur de `nombreArticles`, sans code TypeScript supplémentaire"
      - "Le message ICU ne fonctionne que dans un fichier `.ts`, pas dans un template"
      - "Seule la forme `other` est utilisée, les cas `=0` et `=1` sont ignorés dans les templates"
    reponse: 1
    explication: "C'est tout l'intérêt de la syntaxe ICU `plural` : Angular sélectionne la bonne branche selon la valeur numérique, avec des cas exacts (`=0`, `=1`) et un cas général `other`, directement dans le template — sans logique conditionnelle à écrire à la main. La syntaxe `select` fait la même chose pour une valeur non numérique (genre, statut, rôle…)."
---

## Essentiel

L'i18n officielle d'Angular repose sur le package **`@angular/localize`** et une idée simple : le texte est marqué dans le code source, extrait par un outil, traduit dans des fichiers séparés, puis **remplacé au moment du build** — une fois par langue.

Dans un template, l'attribut `i18n` marque un élément comme traduisible :

```html
<h1 i18n>Bienvenue dans la boutique</h1>
<img [src]="logo" i18n-alt alt="Logo de la boutique" />
```

En TypeScript, `$localize` marque une chaîne construite dynamiquement :

```ts
const message = $localize`Commande n° ${numero}:numero: confirmée`;
```

La commande `ng extract-i18n` parcourt le projet et génère un fichier source des messages à traduire (`messages.xlf` par défaut). Une fois les traductions fournies (une par locale, dans un fichier séparé), on configure `angular.json` :

```json
"i18n": {
  "sourceLocale": "fr",
  "locales": {
    "en": { "translation": "src/locale/messages.en.xlf" }
  }
}
```

Un `ng build` avec `localize` activé produit alors **un dossier par locale**, chacun contenant une application déjà traduite — sans traduction faite dans le navigateur.

## Détail

### Comment ça marche

Le fonctionnement se déroule en trois temps : **marquer** (`i18n`, `$localize`), **extraire et traduire** (`ng extract-i18n` puis remplissage des fichiers de traduction par locale), **fusionner au build** (Angular recompile le texte marqué avec la traduction correspondante pour chaque locale déclarée). Le résultat est un bundle par langue, sans dépendance runtime à un service de traduction.

### Exemple 1 — Marquer du texte avec description et identifiant

```html
<h1 i18n="Titre affiché en haut de la fiche produit|">Détail du produit</h1>

<p i18n="@@boutique.livraison.gratuite">
  Livraison gratuite à partir de 50 €
</p>
```

La partie après le `|` est une **description** destinée au traducteur (contexte, pas de traduction en soi). L'identifiant `@@boutique.livraison.gratuite` fixe un id stable : sans lui, Angular calcule un id à partir du contenu, qui change si le texte change — ce qui peut casser le lien avec une traduction déjà faite.

### Exemple 2 — Extraire les messages

```bash
ng extract-i18n --output-path src/locale --format=xlf
```

Angular génère `src/locale/messages.xlf`, qui contient chaque texte marqué. On duplique ce fichier par langue cible (`messages.fr.xlf`, `messages.es.xlf`…) et on fait traduire chaque copie — par une personne ou un outil de traduction assistée, en dehors d'Angular.

### Exemple 3 — Configurer les locales et builder

```json
{
  "projects": {
    "boutique": {
      "i18n": {
        "sourceLocale": "fr",
        "locales": {
          "en": { "translation": "src/locale/messages.en.xlf" },
          "es": { "translation": "src/locale/messages.es.xlf" }
        }
      }
    }
  }
}
```

```bash
ng build --localize
```

Ce build produit un dossier par locale (`dist/boutique/fr`, `dist/boutique/en`, `dist/boutique/es`), chacun servable indépendamment — typiquement un chemin ou un sous-domaine par langue derrière un serveur ou une CDN.

### Exemple 4 — Pluriel et sélection avec ICU

```html
<span i18n>
  {statutCommande, select, expediee {Commande expédiée} annulee {Commande annulée} other {Commande en préparation}}
</span>

<span i18n>
  {nombreAvis, plural, =0 {Aucun avis} =1 {1 avis} other {{{nombreAvis}} avis}}
</span>
```

`plural` choisit la forme selon une quantité (cas exacts `=0`, `=1`, sinon `other`), `select` choisit selon une valeur arbitraire (ici un statut). Les deux se combinent dans un même message si besoin.

### Avantages et limites de l'approche officielle

| | Approche officielle (`@angular/localize`) | Alternative runtime (Transloco, ngx-translate…) |
|---|---|---|
| Quand la traduction a lieu | Au **build** (texte déjà remplacé dans le bundle) | Au **runtime**, chargée depuis un fichier JSON et interprétée dans le navigateur |
| Performance | Optimale : aucun texte à charger ni interpréter | Un coût runtime (chargement + résolution des clés) |
| Changer une traduction en production | Nécessite un **rebuild** de la locale concernée | Modifier le fichier de traduction suffit, sans rebuild |
| Changer de langue sans recharger la page | Non : chaque locale est un bundle séparé | Oui, en général (rechargement du dictionnaire) |
| Taille du déploiement | Un dossier par langue (plusieurs bundles) | Un seul bundle, plusieurs fichiers de traduction légers |
| Intégration avec le compilateur Angular | Native, vérifiée à la compilation | Bibliothèque tierce, clés non vérifiées par le compilateur |

Les bibliothèques tierces comme **Transloco** ou **ngx-translate** restent des choix courants quand on a besoin de changer de langue sans recharger l'application, de traductions modifiables sans redéploiement, ou d'un chargement partiel des traductions par fonctionnalité. Le compromis est une vérification plus faible à la compilation (une clé de traduction manquante n'est en général détectée qu'à l'exécution) et un coût runtime.

### Pièges courants

> **Laisser Angular générer l'id automatiquement, puis modifier le texte source.** Sans `@@identifiant` explicite, l'id est dérivé du contenu et de son contexte : changer une virgule dans le texte source change l'id, et la traduction existante n'est plus reliée au nouveau message. Fixer un id stable (`@@boutique.xxx`) sur les textes appelés à évoluer évite de perdre les traductions.

> **Oublier qu'un texte concaténé dynamiquement n'est pas traduisible tel quel.** `$localize` doit envelopper directement le gabarit de chaîne (*tagged template*) : construire d'abord une chaîne avec des `+` puis tenter de la marquer ne fonctionne pas, l'extraction se fait sur la syntaxe `$localize\`...\`` elle-même, pas sur son résultat.

> **Confondre « traduit » et « formaté selon la locale ».** L'i18n officielle traduit le **texte marqué** ; elle ne formate pas automatiquement les dates, nombres ou devises selon la langue choisie. Ce formatage passe par les pipes `date`/`number`/`currency` et `LOCALE_ID` (voir la leçon suivante), indépendamment de l'i18n de texte.

### À retenir

- `i18n` (templates) et `$localize` (TypeScript) **marquent** du texte traduisible ; `ng extract-i18n` l'extrait dans un fichier source (`messages.xlf` par défaut, d'autres formats possibles).
- La traduction est fusionnée **au build** : `angular.json` déclare `sourceLocale` et `locales`, et `ng build --localize` produit un dossier distinct par langue.
- Les messages ICU (`plural`, `select`) gèrent le pluriel et les choix multiples directement dans le texte marqué.
- Avantage : performance maximale, rien à charger ni interpréter au runtime. Limite : traductions figées au build (rebuild nécessaire pour corriger un texte), un bundle par langue, pas de changement de langue sans recharger.
- Transloco et ngx-translate sont des alternatives runtime à connaître quand ces contraintes sont bloquantes, au prix d'un coût d'exécution et d'une vérification plus faible à la compilation.

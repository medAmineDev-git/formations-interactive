---
id: xss-sanitization
chapitre: securite
ordre: 1
titre: "XSS et sanitization"
termes:
  - terme: "XSS (Cross-Site Scripting)"
    definition: "Faille qui permet à un attaquant de faire exécuter du JavaScript arbitraire dans le navigateur d'une victime, via une donnée non fiable injectée dans une page (commentaire, nom de produit, paramètre d'URL…). Ce script s'exécute avec les droits de la page légitime : il peut lire le DOM, voler des jetons de session, agir à la place de l'utilisateur."
  - terme: "Contexte de sécurité"
    definition: "Catégorie que le compilateur Angular attribue à chaque liaison de template selon l'endroit où la valeur atterrit : **HTML** (`[innerHTML]`), **Style** (bindings CSS), **URL** (`href`, `src` d'une image…) et **Resource URL** (`src` d'un `<script>` ou d'un `<iframe>`, code exécuté). La règle de nettoyage appliquée dépend de ce contexte."
  - terme: DomSanitizer
    definition: "Service injectable (`@angular/platform-browser`) qui expose les méthodes `bypassSecurityTrust*`, seul moyen officiel de marquer explicitement une valeur comme sûre pour contourner la sanitization automatique."
  - terme: "bypassSecurityTrustHtml (et les autres bypassSecurityTrust*)"
    definition: "Méthodes de `DomSanitizer` (`bypassSecurityTrustHtml`, `Style`, `Script`, `Url`, `ResourceUrl`) qui déclarent une valeur digne de confiance, sans nettoyage. À utiliser en tout dernier recours, jamais sur une donnée qui contient, même indirectement, de l'entrée utilisateur non maîtrisée."
  - terme: "Content Security Policy (CSP)"
    definition: "En-tête HTTP qui restreint les sources autorisées à exécuter du script, charger des styles, des images, etc. Une CSP stricte bloque l'exécution d'un script injecté même si une faille XSS existe ailleurs dans le code : une couche de défense supplémentaire, pas un remplacement de la sanitization."
  - terme: "Nonce CSP"
    definition: "Jeton aléatoire, unique à chaque requête, associé à une directive `'nonce-...'` de la CSP. Seuls les scripts et styles portant ce nonce exact sont autorisés à s'exécuter, ce qui permet une CSP stricte sans recourir à `'unsafe-inline'`."
  - terme: Trusted Types
    definition: "API navigateur qui oblige tout code assignant du HTML, une URL de script ou de ressource dynamiquement à passer par une fabrique de valeurs validées, plutôt que par une chaîne de caractères brute. Activée via la directive CSP `require-trusted-types-for 'script'`, elle empêche par construction les injections DOM-based XSS qui contournent le template Angular."
  - terme: "Compilation AOT (Ahead-of-Time)"
    definition: "Mode de compilation par défaut des applications Angular CLI, qui transforme les templates en code JavaScript au moment du build plutôt qu'à l'exécution. Elle empêche toute une classe de vulnérabilités dites d'**injection de template** : sans compilation à la volée, il n'y a pas de mécanisme pour interpréter une chaîne fournie par l'utilisateur comme un nouveau template."
quiz:
  - question: "Que produit ce template à l'écran si `commentaire.texte` vaut `<img src=x onerror=alert(1)>` ?"
    code: |
      @Component({
        selector: 'app-commentaire',
        template: `<p>{{ commentaire.texte }}</p>`,
      })
      export class CommentaireCmp {
        commentaire = { texte: '<img src=x onerror=alert(1)>' };
      }
    choix:
      - "Le texte brut `<img src=x onerror=alert(1)>` s'affiche tel quel, sans que l'image ne se charge ni que le script ne s'exécute"
      - "Une image cassée apparaît et l'alerte se déclenche : l'interpolation interprète le HTML reçu"
      - "Angular lève une exception au chargement du composant"
      - "Le contenu est retiré silencieusement et rien ne s'affiche"
    reponse: 0
    explication: "L'interpolation `{{ }}` échappe systématiquement sa valeur en tant que **texte**, jamais en tant que HTML. Le navigateur affiche la chaîne littérale, balises comprises, sans jamais créer d'élément `<img>` ni exécuter `onerror`. C'est `[innerHTML]` qui interpréterait ce contenu comme du HTML — et le nettoierait alors, en retirant l'attribut `onerror`."
  - question: "Un formulaire d'avis produit permet à un utilisateur de saisir une description. Un développeur veut l'afficher avec sa mise en forme (gras, liens) en utilisant `[innerHTML]`, puis, face à un avertissement de la console, appelle `bypassSecurityTrustHtml` sur cette même donnée pour le faire disparaître. Quel est le risque ?"
    choix:
      - "Aucun : bypassSecurityTrustHtml est justement fait pour supprimer les avertissements liés à innerHTML"
      - "La donnée provient directement d'un utilisateur non maîtrisé : contourner la sanitization dessus réintroduit une faille XSS que innerHTML nettoyait automatiquement"
      - "bypassSecurityTrustHtml ralentit uniquement le rendu, sans impact de sécurité"
      - "Le contournement ne fonctionne qu'en mode développement, il est ignoré en production"
    reponse: 1
    explication: "`bypassSecurityTrust*` ne doit s'appliquer qu'à du contenu dont la provenance est maîtrisée et fiable (généré côté serveur par une source de confiance, jamais une saisie utilisateur brute). L'appliquer ici supprime justement le filet de sécurité que la sanitization automatique de `[innerHTML]` fournissait, et rouvre la porte à l'injection de `<script>` ou de gestionnaires d'événements malveillants."
  - question: "Pourquoi ne faut-il jamais construire dynamiquement un template Angular (compilé au runtime) à partir de données saisies par un utilisateur ?"
    choix:
      - "Parce que cela ralentit le rendu par rapport à un template statique"
      - "Parce que cela contourne complètement les protections intégrées d'Angular (sanitization par contexte, compilation AOT) : la donnée n'est plus une valeur affichée, elle devient du code de template interprété"
      - "Parce que les templates dynamiques ne supportent pas les signaux"
      - "Parce que Angular refuse de compiler ce genre de code, l'application ne démarre pas"
    reponse: 1
    explication: "La sanitization par contexte de sécurité protège les *valeurs* insérées dans un template déjà compilé. Générer le template lui-même depuis une entrée utilisateur change complètement de catégorie de risque : l'attaquant ne contrôle plus seulement une valeur affichée, mais la structure du template — liaisons, appels de méthodes, bindings — ce qu'aucune sanitization de valeur ne peut couvrir. C'est l'injection de template, la vulnérabilité que la compilation AOT prévient en interdisant justement l'interprétation de templates à l'exécution."
---

## Essentiel

Une faille **XSS** (Cross-Site Scripting) permet à un attaquant de faire exécuter du JavaScript dans le navigateur d'une victime, en injectant du contenu malveillant dans une donnée affichée par l'application (avis client, nom de produit, paramètre d'URL...). Ce script tourne avec les droits de la page légitime : il peut voler un jeton de session, effectuer des actions à la place de l'utilisateur, exfiltrer des données.

Angular protège par défaut sur plusieurs fronts :

- **L'interpolation `{{ }}` échappe toujours sa valeur en texte.** `<p>{{ avis.texte }}</p>` affiche `<script>...</script>` comme du texte littéral, jamais comme du HTML exécuté.
- **Chaque liaison de propriété est sanitizée selon son contexte de sécurité** : HTML (`[innerHTML]`), Style, URL (`[href]`), Resource URL (`[src]` d'un script ou d'un iframe). `[innerHTML]` retire les éléments et attributs dangereux (`<script>`, `onerror`, `javascript:`...) tout en gardant la mise en forme sûre (`<b>`, `<a>` avec une URL propre...).
- **`DomSanitizer.bypassSecurityTrust*`** permet de contourner ce nettoyage, mais uniquement en dernier recours, sur du contenu dont la provenance est réellement maîtrisée — jamais sur une saisie utilisateur.

```ts
@Component({
  selector: 'app-description-produit',
  template: `<div [innerHTML]="descriptionHtml"></div>`,
})
export class DescriptionProduit {
  // Sanitizée automatiquement : <script> et onerror seraient retirés.
  descriptionHtml = '<b>Garantie 2 ans</b> <script>vol();</script>';
}
```

Ne jamais construire un template à partir de données utilisateur (injection de template) : la **compilation AOT**, par défaut en production, empêche ce genre d'interprétation dynamique. En complément, une **Content Security Policy** et, plus strictement, **Trusted Types** bloquent l'exécution d'un script injecté même si une faille existe ailleurs.

## Détail

### Comment ça marche

Le compilateur Angular détermine, pour chaque liaison de template, un contexte de sécurité selon l'endroit où la valeur est utilisée : afficher du HTML n'a pas les mêmes risques que définir l'URL d'un lien ou charger un script. Une valeur jugée sûre en CSS (une couleur) peut être dangereuse dans une URL (`javascript:...`). En interpolation `{{ }}`, il n'y a même pas de contexte HTML à protéger : la valeur est toujours insérée comme nœud texte, jamais interprétée. C'est seulement dès qu'une liaison de propriété touche au DOM de façon plus riche (`[innerHTML]`, `[src]`, `[href]`...) que la sanitization par contexte entre en jeu, en retirant ce qui est jugé dangereux pour ce contexte précis.

### Exemple 1 — Interpolation : toujours du texte

```ts
@Component({
  selector: 'app-avis-client',
  template: `<p>{{ avis.commentaire }}</p>`,
})
export class AvisClient {
  avis = { commentaire: '<img src=x onerror="document.location=\'https://pirate.example\'">' };
}
```

Même avec un commentaire malveillant, `{{ }}` échappe la chaîne : `<img ...>` s'affiche comme texte visible à l'écran, aucune balise n'est créée, `onerror` ne s'exécute jamais.

### Exemple 2 — `[innerHTML]` : nettoyage automatique, pas suppression totale

```ts
@Component({
  selector: 'app-fiche-produit',
  template: `<div [innerHTML]="fiche"></div>`,
})
export class FicheProduit {
  fiche = 'Livraison <b>gratuite</b> dès 50€ <script>voler();</script>';
}
```

Angular reconnaît la valeur comme non sûre pour le contexte HTML et la nettoie : `<b>gratuite</b>` reste affiché en gras, `<script>voler();</script>` est retiré. La sanitization retire ce qui est dangereux, pas la totalité du balisage.

### Exemple 3 — `DomSanitizer`, dernier recours

```ts
import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-cgv',
  template: `<div [innerHTML]="contenuCgv"></div>`,
})
export class Cgv {
  private sanitizer = inject(DomSanitizer);

  // Contenu généré côté serveur par l'équipe juridique, jamais saisi par un client.
  contenuCgv: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
    '<h2>Conditions générales</h2><p>...</p>',
  );
}
```

Ce contournement n'est défendable que parce que la source du HTML est maîtrisée (contenu éditorial interne), jamais une donnée qui transite, même indirectement, par une saisie d'utilisateur (avis, message, nom de fichier...).

### Exemple 4 — Content Security Policy avec nonce

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-8f3a...'; style-src 'self' 'nonce-8f3a...'
```

Le nonce, unique et imprévisible à chaque requête, doit être régénéré côté serveur et injecté à la fois dans l'en-tête et sur les balises `<script>`/`<style>` autorisées (via l'attribut `ngCspNonce` sur l'élément racine, ou le jeton d'injection `CSP_NONCE`). Même si un attaquant parvient à injecter un `<script>` dans le DOM, ce script n'a pas le nonce attendu : le navigateur refuse de l'exécuter.

### Sanitization par contexte

| Contexte de sécurité | Liaison typique | Ce qui est nettoyé |
|---|---|---|
| HTML | `[innerHTML]` | Balises et attributs dangereux (`<script>`, gestionnaires `on*`) retirés, mise en forme sûre conservée |
| Style | bindings CSS | Constructions dangereuses en style retirées |
| URL | `[href]`, `[src]` d'une image | Schémas dangereux (`javascript:`) neutralisés |
| Resource URL | `[src]` d'un `<script>`/`<iframe>` | **Non nettoyée automatiquement** : contient du code exécuté, doit être fiable par construction |

### Pièges courants

> **Appeler `bypassSecurityTrust*` « pour faire taire » un avertissement.** Le contournement est fait pour du contenu dont la source est prouvée sûre, pas pour supprimer un message gênant dans la console. Sur une donnée qui vient, même partiellement, d'un utilisateur, cela ouvre la faille que la sanitization automatique fermait.

> **Confondre « nettoyé » et « supprimé ».** `[innerHTML]` ne vide pas le contenu suspect : il retire précisément ce qui est dangereux (scripts, gestionnaires d'événements) et garde le reste. Un développeur qui s'attend à un contenu vide peut être surpris de voir le texte s'afficher sans la partie malveillante.

> **Générer un template à partir d'une chaîne construite dynamiquement.** Même en évitant `[innerHTML]`, interpréter une chaîne fournie par l'utilisateur comme un nouveau template (compilation à la volée) contourne toutes les protections vues ici : ce n'est plus une valeur affichée, mais du code de template. La compilation AOT, active par défaut, empêche ce scénario en production.

### À retenir

- L'interpolation `{{ }}` échappe toujours en texte ; seules les liaisons de propriété touchant au DOM riche (`[innerHTML]`, `[src]`, `[href]`...) passent par la sanitization par contexte de sécurité.
- `[innerHTML]` nettoie automatiquement (retire scripts et gestionnaires d'événements), il ne supprime pas tout le contenu.
- `DomSanitizer.bypassSecurityTrust*` est un contournement volontaire, réservé à du contenu dont la provenance est prouvée fiable — jamais à une saisie utilisateur.
- Ne jamais construire un template à partir de données utilisateur : cela contourne toutes les protections intégrées, y compris la sanitization.
- CSP (avec nonce) et Trusted Types ajoutent une couche de défense au niveau du navigateur, en complément de la sanitization Angular, pas à sa place ; la compilation AOT (par défaut) empêche l'injection de template.

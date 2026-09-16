---
id: formulaires-template
chapitre: formulaires
ordre: 4
titre: "Formulaires template et aperçu des Signal Forms"
termes:
  - terme: FormsModule
    definition: "Module à ajouter aux `imports` d'un composant standalone pour utiliser les formulaires **template**, basés sur `ngModel` et les directives de validation posées directement dans le HTML."
  - terme: "ngModel / [(ngModel)]"
    definition: "Directive qui synchronise un champ de formulaire avec une propriété du composant. `[(ngModel)]` (liaison bidirectionnelle) combine lecture (`[ngModel]`) et écriture (`(ngModelChange)`) en une seule syntaxe."
  - terme: "#form=\"ngForm\""
    definition: "Référence de template qui expose l'objet `NgForm` créé automatiquement par Angular pour la balise `<form>`, avec sa validité globale (`form.valid`) et l'état de chaque champ (`form.controls.email`)."
  - terme: Validation dans le template
    definition: "Dans un formulaire template, les règles de validation sont des **attributs HTML** (`required`, `minlength`, `email` via `ngModel` seul suffit pour le type `email`), pas des objets TypeScript comme dans les formulaires réactifs."
  - terme: "Signal Forms (@angular/forms/signals)"
    definition: "API **expérimentale** introduite en Angular 21.0, qui construit un formulaire à partir d'un `signal()` avec `form()`. Statut : aperçu à essayer, non recommandé en production pour l'instant."
  - terme: "[formField]"
    definition: "Directive de liaison des Signal Forms, à poser sur un champ pour le relier à un nœud du formulaire (ex. `[formField]=\"loginForm.email\"`). Nommée `[field]` à la sortie d'Angular 21.0.0, **renommée `[formField]`** dès le correctif 21.0.9."
quiz:
  - question: "Dans ce formulaire template, `nomControl` n'est jamais défini en TypeScript. D'où vient sa validité (`nomControl.invalid`) ?"
    code: |
      <input
        name="nom"
        [(ngModel)]="client.nom"
        required
        minlength="2"
        #nomControl="ngModel"
      />
      @if (nomControl.invalid && nomControl.touched) {
        <p>Nom invalide</p>
      }
    choix:
      - "Angular la crée automatiquement à partir des attributs HTML (`required`, `minlength`) grâce à `FormsModule` et à la directive `ngModel`"
      - "Il faut obligatoirement déclarer un `FormControl` correspondant dans la classe du composant"
      - "C'est une erreur : `#nomControl=\"ngModel\"` ne peut pas être utilisé sans `[formGroup]`"
      - "`nomControl` est `undefined` tant que le formulaire n'est pas soumis"
    reponse: 0
    explication: "Dans un formulaire template, `ngModel` (activé par `FormsModule`) inspecte les attributs de validation HTML posés sur le champ et construit lui-même un `NgModel` (avec sa validité) sans qu'aucun `FormControl` ne soit écrit en TypeScript. `#nomControl=\"ngModel\"` expose cet objet sous ce nom local dans le template."
  - question: "Un formulaire de connexion (2 champs, aucune validation croisée) doit être livré en production cette semaine. Quelle approche choisir en Angular 21 ?"
    choix:
      - "Les Signal Forms (`@angular/forms/signals`), car c'est la nouveauté officielle de la v21"
      - "Un formulaire réactif ou template classique : les Signal Forms sont encore expérimentales en v21 et non recommandées pour une stabilité de production"
      - "Un formulaire sans aucune validation, à valider entièrement côté serveur"
      - "Les Signal Forms, mais uniquement avec la directive `[field]`"
    reponse: 1
    explication: "La documentation officielle est explicite : les Signal Forms sont pensées pour être essayées, mais les formulaires réactifs restent le choix recommandé quand une garantie de stabilité en production est nécessaire. `[field]` est en plus une syntaxe obsolète, renommée `[formField]` dès le correctif 21.0.9."
  - question: "Que signale le renommage de `[field]` en `[formField]` (correctif Angular 21.0.9) pour un rédacteur de cours ou un développeur qui suit la v21 ?"
    choix:
      - "Rien d'important, les deux noms fonctionnent indéfiniment en parallèle"
      - "Que les Signal Forms sont une API expérimentale dont la surface peut encore changer d'un correctif à l'autre, contrairement à une API stable"
      - "Que `@angular/forms/signals` est désormais un module séparé à installer via `ng add`"
      - "Que les formulaires réactifs sont dépréciés au profit des Signal Forms"
    reponse: 1
    explication: "Un changement de nom de directive en cours de ligne de version (21.0.0 → 21.0.9), en dehors d'une version majeure, est typique d'une API encore expérimentale : la documentation et le code doivent être vérifiés contre la version exacte utilisée, et rien ne garantit l'absence d'autres changements avant une éventuelle stabilisation."
---

## Essentiel

Les **formulaires template** décrivent le formulaire directement dans le HTML, avec `ngModel`, plutôt qu'en TypeScript. Il faut ajouter `FormsModule` aux `imports` :

```ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  templateUrl: './contact.html',
})
export class Contact {
  client = { nom: '', email: '' };

  soumettre() {
    console.log(this.client);
  }
}
```

```html
<form #contactForm="ngForm" (ngSubmit)="soumettre()">
  <input name="nom" [(ngModel)]="client.nom" required minlength="2" #nom="ngModel" />
  @if (nom.invalid && nom.touched) {
    <p>Nom invalide</p>
  }

  <input name="email" [(ngModel)]="client.email" required email />

  <button type="submit" [disabled]="contactForm.invalid">Envoyer</button>
</form>
```

`[(ngModel)]` synchronise la propriété avec le champ. La validation se pose en **attributs HTML** (`required`, `minlength`, `email`). `#contactForm="ngForm"` expose l'objet `NgForm` avec sa validité globale.

Ce mode convient à un formulaire **simple et statique**. Pour un formulaire avec beaucoup de logique (validation croisée, champs dynamiques), le formulaire réactif (leçons précédentes) reste plus adapté.

## Détail

### Formulaire template ou réactif : comment choisir

| | Formulaire template | Formulaire réactif |
|---|---|---|
| Où vit la logique | Dans le template (HTML) | Dans la classe (TypeScript) |
| Source de vérité de la valeur | La propriété liée par `[(ngModel)]` | Le `FormGroup`/`FormControl` |
| Validation | Attributs HTML (`required`, `pattern`…) | Fonctions `Validators.*` ou personnalisées |
| Formulaire dynamique (`FormArray`…) | Difficile, peu adapté | Naturel |
| Testabilité sans rendre le template | Faible | Bonne : le formulaire est un objet TypeScript |
| Cas d'usage typique | Petit formulaire, prototypage rapide | Formulaire avec validation riche, structure variable, ou fortement testé |

Les deux approches importent le même package `@angular/forms`, mais des modules différents (`FormsModule` contre `ReactiveFormsModule`) — inutile de mélanger les deux dans un même formulaire.

### Exemple 1 — Validation groupée avec ngModelGroup

```html
<div ngModelGroup="adresseLivraison" #adresseGroup="ngModelGroup">
  <input name="rue" [(ngModel)]="adresse.rue" required />
  <input name="ville" [(ngModel)]="adresse.ville" required />
</div>
@if (adresseGroup.invalid && adresseGroup.touched) {
  <p>Adresse de livraison incomplète</p>
}
```

`ngModelGroup` imbrique plusieurs champs sous un même nom, à la manière d'un `FormGroup` imbriqué côté réactif, sans rien déclarer en TypeScript.

### Exemple 2 — Aperçu des Signal Forms (expérimental, v21.0+)

Angular 21.0 introduit `@angular/forms/signals`, présentée par l'équipe Angular comme *« une librairie expérimentale qui permet de gérer l'état d'un formulaire en s'appuyant sur les fondations réactives des Signals »*. Le formulaire part d'un `signal()` contenant les données, et `form()` construit la structure de validation autour :

```ts
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-connexion',
  imports: [FormField],
  template: `
    <input type="email" [formField]="connexionForm.email" />
    <input type="password" [formField]="connexionForm.motDePasse" />
  `,
})
export class Connexion {
  connexionModel = signal({ email: '', motDePasse: '' });
  connexionForm = form(this.connexionModel);
}
```

Ce qui est prometteur : le formulaire reste un `signal()` ordinaire (compatible `computed`/`effect`), sans dépendre de RxJS ni d'un objet `FormGroup` séparé — cohérent avec le reste d'une application construite autour des signaux.

**Point de vigilance pour l'instant.** La directive de liaison au template s'appelait `[field]` à la sortie de la version 21.0.0, puis a été renommée `[formField]` dès le correctif 21.0.9 : un exemple ou un article écrit dans les toutes premières semaines de la v21 peut donc afficher une syntaxe déjà obsolète. C'est le signe d'une API encore mouvante.

### Signal Forms : à essayer, pas encore à adopter

La documentation officielle est directe sur ce point : *« Signal Forms work best in new applications built with signals. If you're working with an existing application that uses reactive forms, or if you need production stability guarantees, reactive forms remain a solid choice »*. En clair :

- Les Signal Forms sont un **aperçu de la direction future**, pas une recommandation pour du code livré aujourd'hui.
- Leur API peut encore changer (comme le montre déjà le renommage `[field]` → `[formField]`).
- Les **formulaires réactifs restent la référence** pour tout formulaire qui doit tenir dans la durée, notamment en entreprise.
- Un projet existant en formulaires réactifs n'a aucune raison de migrer vers les Signal Forms tant qu'elles restent expérimentales.

### Pièges courants

> **Écrire un formulaire de production avec `@angular/forms/signals`.** L'API est explicitement qualifiée d'expérimentale par l'équipe Angular : elle peut changer sans suivre les règles habituelles de compatibilité d'une API stable, comme l'a montré le renommage `[field]` → `[formField]` en cours de ligne 21.x.

> **Mélanger `FormsModule` et `ReactiveFormsModule` sur le même formulaire.** Les deux approches gèrent la valeur différemment (propriété liée par `ngModel` contre `FormControl`) : les combiner sur les mêmes champs produit des comportements incohérents. Chaque formulaire doit choisir une seule approche.

> **Oublier `name` sur un champ avec `ngModel`.** Dans un `<form>`, `ngModel` exige un attribut `name` unique pour s'enregistrer auprès du `NgForm` parent — sans lui, Angular lève une erreur explicite au lieu de démarrer silencieusement.

### À retenir

- `FormsModule` + `[(ngModel)]` pour un formulaire template ; validation posée en attributs HTML.
- `#xxx="ngModel"` (champ) et `#xxx="ngForm"` (formulaire) exposent l'état pour l'afficher dans le template.
- Formulaire simple et statique → template ; formulaire riche, dynamique ou très testé → réactif.
- Les Signal Forms (`@angular/forms/signals`) sont une API **expérimentale** de la v21, prometteuse mais encore instable (directive renommée en cours de version).
- Pour un formulaire de production aujourd'hui, les formulaires réactifs restent le choix recommandé par l'équipe Angular elle-même.

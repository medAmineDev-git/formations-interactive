---
id: formulaires-reactifs
chapitre: formulaires
ordre: 1
titre: "Les formulaires réactifs"
termes:
  - terme: ReactiveFormsModule
    definition: "Module à ajouter au tableau `imports` d'un composant standalone pour utiliser les formulaires réactifs (`FormGroup`, `FormControl`) et les directives de template `[formGroup]` / `formControlName`."
  - terme: FormControl
    definition: "Représente **un champ** du formulaire : sa valeur, sa validité et son état (`touched`, `dirty`…). C'est la brique de base de tout formulaire réactif."
  - terme: FormGroup
    definition: "Regroupe plusieurs `FormControl` (ou `FormGroup`/`FormArray` imbriqués) sous un seul objet. Sa valeur est un objet, et sa validité est l'agrégat de celle de ses contrôles."
  - terme: FormBuilder
    definition: "Service injectable (`inject(FormBuilder)`) qui simplifie l'écriture d'un `FormGroup` : `fb.group({...})` plutôt qu'un empilement de `new FormControl(...)`."
  - terme: NonNullableFormBuilder
    definition: "Variante de `FormBuilder`, accessible via `fb.nonNullable`, qui type les contrôles comme **non-nullables** : `reset()` revient à la valeur initiale au lieu de `null`."
  - terme: "valueChanges"
    definition: "`Observable` exposé par un `FormControl` ou un `FormGroup`, qui émet à chaque changement de valeur. S'utilise avec les opérateurs RxJS habituels (`debounceTime`, `distinctUntilChanged`…)."
  - terme: "formGroup / formControlName"
    definition: "Directives de liaison au template : `[formGroup]` associe un `FormGroup` TypeScript à une balise `<form>`, `formControlName` associe un contrôle enfant à son nom dans le groupe."
quiz:
  - question: "Ce formulaire a un contrôle désactivé. Que renvoie `inscriptionForm.value` juste après la création ?"
    code: |
      inscriptionForm = this.fb.group({
        email: ['', Validators.required],
        codePromo: [{ value: 'BIENVENUE10', disabled: true }],
      });

      console.log(inscriptionForm.value);
    choix:
      - "{ email: '', codePromo: 'BIENVENUE10' }"
      - "{ email: '' } — les contrôles désactivés sont exclus de `value`"
      - "undefined, car un contrôle désactivé invalide tout le groupe"
      - "Une erreur au moment de l'appel"
    reponse: 1
    explication: "`value` (et donc `valueChanges`) n'inclut **que les contrôles activés**. Pour récupérer aussi `codePromo`, il faut appeler `inscriptionForm.getRawValue()`, qui renvoie tous les contrôles, désactivés compris."
  - question: "Que se passe-t-il quand ce code s'exécute ?"
    code: |
      adresseForm = this.fb.group({
        rue: [''],
        ville: [''],
        codePostal: [''],
      });

      adresseForm.setValue({ ville: 'Lyon' });
    choix:
      - "Seul le champ `ville` est mis à jour, les autres gardent leur valeur"
      - "Une erreur, car `setValue` exige un objet avec **tous** les contrôles du groupe"
      - "Tous les champs sont vidés puis `ville` reçoit 'Lyon'"
      - "Rien ne se passe : `setValue` ne fonctionne pas sur un `FormGroup`"
    reponse: 1
    explication: "`setValue` impose une correspondance stricte et complète avec la structure du groupe : il faut fournir `rue`, `ville` **et** `codePostal`, sinon Angular lève une erreur. `patchValue({ ville: 'Lyon' })` aurait fonctionné, car il accepte un objet partiel."
  - question: "Avec un `FormBuilder` classique (non `nonNullable`), que vaut `emailControl.value` après `emailControl.reset()` si le contrôle a été créé avec `['contact@boutique.fr']` ?"
    choix:
      - "`'contact@boutique.fr'`, la valeur initiale"
      - "`null`, sauf en utilisant `NonNullableFormBuilder` ou en passant explicitement une valeur à `reset()`"
      - "`''`, une chaîne vide"
      - "`undefined`"
    reponse: 1
    explication: "Par défaut, `reset()` remet un `FormControl` à `null` (pas à sa valeur initiale). `NonNullableFormBuilder` change ce comportement pour revenir à la valeur initiale, sinon il faut appeler `reset('contact@boutique.fr')` explicitement."
---

## Essentiel

Un **formulaire réactif** décrit le formulaire entièrement en TypeScript : un `FormGroup` regroupe des `FormControl`, et le template ne fait que s'y **lier**. C'est l'approche recommandée pour un formulaire avec de la validation ou une structure qui évolue dynamiquement.

Il faut d'abord ajouter `ReactiveFormsModule` aux `imports` du composant, puis construire le groupe avec `FormBuilder` :

```ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-inscription',
  imports: [ReactiveFormsModule],
  templateUrl: './inscription.html',
})
export class Inscription {
  private fb = inject(FormBuilder);

  inscriptionForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required],
  });

  soumettre() {
    console.log(this.inscriptionForm.value);
  }
}
```

Dans le template, `[formGroup]` lie le groupe au `<form>`, et `formControlName` lie chaque champ par son nom :

```html
<form [formGroup]="inscriptionForm" (ngSubmit)="soumettre()">
  <input type="email" formControlName="email" />
  <input type="password" formControlName="motDePasse" />
  <button type="submit">S'inscrire</button>
</form>
```

`FormBuilder` **type automatiquement** le groupe d'après les valeurs initiales fournies : `inscriptionForm.value.email` est bien typé `string`. Chaque `FormControl` expose sa `value`, sa validité (`valid`/`invalid`) et un flux `valueChanges` pour réagir en direct.

## Détail

### Comment ça marche

`FormBuilder` (injecté via `inject(FormBuilder)`) évite d'écrire `new FormControl(...)` et `new FormGroup({...})` à la main. `fb.group({...})` accepte, pour chaque champ, soit une valeur seule, soit un tableau `[valeurInitiale, validateurs, validateursAsync]`. Le type du `FormGroup` résultant est inféré à partir de ces valeurs initiales : pas besoin de types génériques explicites dans les cas courants.

### Exemple 1 — Lire la valeur du formulaire

```ts
inscriptionForm.value;          // { email: 'a@b.fr', motDePasse: '••••' } (contrôles activés seulement)
inscriptionForm.getRawValue();  // inclut aussi les contrôles disabled
```

`value` est un objet **partiel** au niveau des types dès qu'un contrôle peut être désactivé, puisqu'un contrôle désactivé n'apparaît pas dedans. `getRawValue()` renvoie toujours la structure complète, ce qui est utile pour envoyer les données au serveur même si un champ est visuellement désactivé (ex. un code promo pré-rempli et verrouillé).

### Exemple 2 — Réagir aux changements avec valueChanges

```ts
import { debounceTime, distinctUntilChanged } from 'rxjs';

constructor() {
  this.inscriptionForm.controls.email.valueChanges
    .pipe(debounceTime(300), distinctUntilChanged())
    .subscribe((email) => this.verifierDisponibilite(email));
}
```

`valueChanges` est un `Observable` RxJS classique : on peut le combiner avec les opérateurs habituels pour, par exemple, ne vérifier la disponibilité d'un e-mail qu'une fois l'utilisateur arrêté de taper.

### Exemple 3 — setValue vs patchValue

```ts
const adresse = this.fb.group({
  rue: [''],
  ville: [''],
  codePostal: [''],
});

// setValue : il faut fournir TOUTES les clés du groupe
adresse.setValue({ rue: '12 rue des Lilas', ville: 'Lyon', codePostal: '69001' });

// patchValue : objet partiel accepté
adresse.patchValue({ ville: 'Lyon' });
```

`setValue` est plus strict : une clé manquante ou en trop lève une erreur, ce qui protège contre les oublis. `patchValue` est plus permissif et pratique pour ne mettre à jour qu'un sous-ensemble de champs, par exemple pour pré-remplir une adresse de livraison avec les données d'un profil existant.

### Exemple 4 — NonNullableFormBuilder

```ts
private fb = inject(NonNullableFormBuilder);

adresseForm = this.fb.group({
  rue: ['', Validators.required],
  ville: ['', Validators.required],
});

reinitialiser() {
  this.adresseForm.reset(); // revient à '' pour chaque champ, pas à null
}
```

Avec un `FormBuilder` classique, chaque `FormControl` accepte `null` comme valeur possible (car `reset()` y ramène par défaut) : le type inféré est `string | null`. `NonNullableFormBuilder` retire ce `null` du type et fait revenir `reset()` à la valeur initiale — pratique pour un formulaire qui ne doit jamais contenir `null`.

### setValue, patchValue, reset — comparaison

| Méthode | Faut-il fournir tous les champs ? | Effet |
|---|---|---|
| `setValue(obj)` | Oui, structure exacte | Remplace toutes les valeurs, erreur si incomplet |
| `patchValue(obj)` | Non, partiel accepté | Met à jour seulement les champs fournis |
| `reset(obj?)` | Non, optionnel | Revient à `null` (ou à la valeur initiale avec `NonNullableFormBuilder`), ou à `obj` si fourni |

### Pièges courants

> **Oublier `ReactiveFormsModule` dans les `imports`.** Sans lui, `[formGroup]` et `formControlName` ne sont pas reconnus par le compilateur de templates : Angular signale une liaison inconnue au build.

> **Utiliser `value` en pensant récupérer tous les champs.** Si un contrôle est `disabled` (par exemple pour verrouiller un champ pendant l'envoi du formulaire), il disparaît de `value`. Le bug est silencieux : le formulaire semble correct, mais un champ manque dans les données envoyées. Utilisez `getRawValue()` dans ce cas.

> **Confondre `setValue` et `patchValue`.** Un objet partiel passé à `setValue` lève une erreur au lieu de mettre à jour partiellement le formulaire — c'est volontaire, mais surprenant la première fois.

### À retenir

- Un formulaire réactif se construit en TypeScript (`FormGroup`/`FormControl`), le template ne fait que s'y lier via `[formGroup]` et `formControlName`.
- `FormBuilder` simplifie l'écriture et infère automatiquement le type du groupe.
- `value` ignore les contrôles désactivés, `getRawValue()` les inclut.
- `setValue` exige tous les champs, `patchValue` accepte un objet partiel.
- `NonNullableFormBuilder` évite le `null` dans les types et fait revenir `reset()` à la valeur initiale.

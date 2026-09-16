---
id: validation-formulaires
chapitre: formulaires
ordre: 2
titre: "Valider un formulaire"
termes:
  - terme: "Validators.required, minLength, email, pattern"
    definition: "Validateurs intégrés (`@angular/forms`) appliqués à un `FormControl`. `required` refuse une valeur vide, `minLength(n)` une chaîne trop courte, `email` un format d'adresse invalide, `pattern(regex)` une chaîne qui ne correspond pas à l'expression régulière."
  - terme: "valid / invalid"
    definition: "États d'un `FormControl` ou `FormGroup` : `valid` vaut `true` si tous les validateurs passent. `invalid` est son opposé. Un `FormGroup` est `invalid` dès qu'un seul de ses contrôles l'est."
  - terme: "touched / dirty / pristine"
    definition: "`touched` : le contrôle a reçu puis perdu le focus au moins une fois. `dirty` : sa valeur a changé depuis sa création (opposé : `pristine`). Servent à décider **quand** afficher une erreur, pas seulement si elle existe."
  - terme: "errors / hasError"
    definition: "`control.errors` est un objet (ou `null` si valide) dont chaque clé est le nom d'un validateur en échec, ex. `{ required: true }`. `control.hasError('required')` est un raccourci pratique dans le template."
  - terme: Validateur personnalisé
    definition: "Fonction `(control: AbstractControl) => ValidationErrors | null` qui applique une règle métier absente des validateurs intégrés, ex. vérifier le format d'une référence produit."
  - terme: Validateur asynchrone
    definition: "Fonction qui renvoie un `Observable<ValidationErrors | null>` (ou une `Promise`), utilisée pour une vérification qui nécessite un appel serveur (ex. un e-mail déjà utilisé). Passée en 3ᵉ position dans `fb.group`."
  - terme: Validateur au niveau du groupe
    definition: "Validateur posé sur un `FormGroup` plutôt que sur un `FormControl`, pour une règle qui compare plusieurs champs entre eux (ex. confirmation de mot de passe). L'erreur apparaît sur `group.errors`, pas sur un contrôle précis."
quiz:
  - question: "Ce champ affiche un message d'erreur dès le chargement de la page, avant toute saisie. Quelle condition manque le plus probablement dans le `@if` du template ?"
    code: |
      <input formControlName="email" />
      @if (form.controls.email.invalid) {
        <p class="erreur">Adresse e-mail invalide</p>
      }
    choix:
      - "Il manque `&& form.controls.email.touched` (ou `.dirty`), pour n'afficher l'erreur qu'après interaction"
      - "Il manque `Validators.required` sur le contrôle"
      - "`invalid` n'existe pas sur un `FormControl`, il faut utiliser `hasError('required')`"
      - "Il faut utiliser `(input)` au lieu de `formControlName`"
    reponse: 0
    explication: "`invalid` est vrai dès la création si le contrôle est requis et vide : sans combiner avec `touched` ou `dirty`, l'erreur s'affiche avant même que l'utilisateur ait pu saisir quoi que ce soit. La pratique courante est `form.controls.email.invalid && form.controls.email.touched`."
  - question: "Que renvoie `motDePasseControl.errors` pour une valeur `'abc'` avec ces validateurs : `[Validators.required, Validators.minLength(8)]` ?"
    code: |
      motDePasse = new FormControl('abc', [
        Validators.required,
        Validators.minLength(8),
      ]);
    choix:
      - "`null`, car le contrôle n'est pas vide"
      - "{ minLength: { requiredLength: 8, actualLength: 3 } }"
      - "{ required: true }"
      - "Un tableau contenant les deux erreurs"
    reponse: 1
    explication: "`required` passe car la valeur n'est pas vide. `minLength(8)` échoue et produit un objet d'erreur détaillant la longueur attendue et la longueur reçue. `errors` est toujours un objet (une clé par validateur en échec), jamais un tableau."
  - question: "Où faut-il poser un validateur qui vérifie que `motDePasse` et `confirmation` ont la même valeur ?"
    choix:
      - "Sur le `FormControl` `confirmation`, en 2ᵉ paramètre"
      - "Sur le `FormGroup` parent, car le validateur doit comparer deux contrôles frères"
      - "Sur le `FormControl` `motDePasse`"
      - "Ce n'est pas possible avec les formulaires réactifs, il faut le vérifier manuellement à la soumission"
    reponse: 1
    explication: "Un validateur posé sur un `FormControl` n'a accès qu'à sa propre valeur. Pour comparer `motDePasse` et `confirmation`, le validateur doit recevoir le `FormGroup` qui les contient tous les deux : il se déclare donc au niveau du groupe, et l'erreur apparaît sur `group.errors`."
---

## Essentiel

Un `FormControl` accepte une liste de **validateurs**, appliqués automatiquement à chaque changement de valeur :

```ts
inscriptionForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  motDePasse: ['', [Validators.required, Validators.minLength(8)]],
});
```

Le contrôle expose ensuite son état : `valid`, `invalid`, et `errors` (un objet détaillant chaque validateur en échec, ou `null` si tout est valide). Il expose aussi son **historique d'interaction** : `pristine`/`dirty` (la valeur a-t-elle changé ?) et `touched`/`untouched` (le champ a-t-il été visité ?).

Ces deux états servent à décider **quand** afficher une erreur : afficher `invalid` seul montrerait une erreur dès le chargement de la page, avant toute saisie. La pratique courante est de combiner les deux :

```html
@if (form.controls.email.invalid && form.controls.email.touched) {
  <p class="erreur">
    @if (form.controls.email.hasError('required')) { L'adresse e-mail est obligatoire }
    @if (form.controls.email.hasError('email')) { Format d'adresse invalide }
  </p>
}
```

Pour désactiver le bouton de soumission tant que le formulaire n'est pas valide : `<button [disabled]="inscriptionForm.invalid">`.

## Détail

### Comment ça marche

Angular réévalue tous les validateurs d'un contrôle à chaque changement de valeur, et propage la validité vers le haut : un `FormGroup` est `invalid` dès qu'un seul de ses contrôles l'est. `errors` reste `null` tant qu'aucun validateur n'échoue ; dès qu'un validateur échoue, `errors` devient un objet avec une clé par validateur en échec (plusieurs validateurs peuvent échouer en même temps sur le même contrôle).

### Exemple 1 — Les validateurs intégrés les plus courants

```ts
produitForm = this.fb.group({
  nom: ['', [Validators.required, Validators.minLength(3)]],
  reference: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}\d{4}$/)]],
  quantite: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
  emailContact: ['', [Validators.email]],
});
```

`min`/`max` s'appliquent à une valeur numérique, `pattern` à une expression régulière (utile pour une référence produit avec un format imposé), `email` vérifie un format d'adresse sans garantir qu'elle existe réellement.

### Exemple 2 — Validateur personnalisé (synchrone)

```ts
import { AbstractControl, ValidationErrors } from '@angular/forms';

function referenceProduitValide(control: AbstractControl): ValidationErrors | null {
  const valeur = control.value as string;
  if (!valeur) {
    return null; // laisser `required` gérer le cas vide
  }
  return /^[A-Z]{2}\d{4}$/.test(valeur) ? null : { referenceInvalide: true };
}

reference = new FormControl('', [Validators.required, referenceProduitValide]);
```

Un validateur personnalisé est une simple fonction : elle reçoit le contrôle, renvoie `null` si tout va bien, ou un objet d'erreur sinon. Utile pour une règle métier absente des validateurs intégrés.

### Exemple 3 — Validateur asynchrone (vérification serveur)

```ts
import { inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { map } from 'rxjs';

function emailDisponibleValidator(clients: ClientService): AsyncValidatorFn {
  return (control: AbstractControl) =>
    clients.verifierEmailDisponible(control.value).pipe(
      map((disponible) => (disponible ? null : { emailDejaUtilise: true })),
    );
}

private clients = inject(ClientService);

email = new FormControl('', {
  validators: [Validators.required, Validators.email],
  asyncValidators: [emailDisponibleValidator(this.clients)],
});
```

Un validateur asynchrone renvoie un `Observable<ValidationErrors | null>` (ou une `Promise`). Pendant l'appel, le contrôle passe à l'état `pending` — utile pour afficher un indicateur de chargement le temps de la réponse. Angular ne relance l'appel qu'une fois l'appel précédent terminé et la valeur à nouveau modifiée.

### Exemple 4 — Validateur au niveau du groupe (confirmation de mot de passe)

```ts
function motsDePasseIdentiques(group: AbstractControl): ValidationErrors | null {
  const motDePasse = group.get('motDePasse')?.value;
  const confirmation = group.get('confirmation')?.value;
  return motDePasse === confirmation ? null : { motsDePasseDifferents: true };
}

inscriptionForm = this.fb.group(
  {
    motDePasse: ['', [Validators.required, Validators.minLength(8)]],
    confirmation: ['', Validators.required],
  },
  { validators: motsDePasseIdentiques },
);
```

```html
@if (inscriptionForm.hasError('motsDePasseDifferents') && inscriptionForm.controls.confirmation.touched) {
  <p class="erreur">Les mots de passe ne correspondent pas</p>
}
```

Ce validateur compare deux contrôles frères : il doit donc être posé sur le `FormGroup` qui les contient, pas sur l'un des deux contrôles. L'erreur apparaît alors sur `group.errors`, pas sur `motDePasse.errors` ni `confirmation.errors`.

### Pièges courants

> **Afficher l'erreur dès le chargement de la page.** `@if (control.invalid)` seul montre une erreur avant même que l'utilisateur ait touché le champ. Combinez toujours avec `touched` ou `dirty` : `control.invalid && control.touched`.

> **Comparer deux champs avec un validateur posé sur l'un d'eux.** Un validateur de `FormControl` n'a accès qu'à sa propre valeur via `control.value` — impossible de lire un contrôle frère depuis là. La comparaison doit se faire au niveau du `FormGroup` parent.

> **Valider un e-mail déjà utilisé de façon synchrone.** La disponibilité d'un e-mail ne peut être connue qu'en interrogeant le serveur : c'est le cas d'usage typique d'un validateur asynchrone, pas d'un validateur synchrone qui ne peut agir que sur les données déjà présentes côté client.

### À retenir

- Les validateurs intégrés (`required`, `minLength`, `email`, `pattern`, `min`/`max`…) couvrent la majorité des besoins courants.
- `invalid` seul ne suffit pas pour afficher une erreur : combiner avec `touched` ou `dirty`.
- `errors` est un objet avec une clé par validateur en échec, ou `null` si le contrôle est valide.
- Un validateur personnalisé synchrone renvoie `ValidationErrors | null` ; un validateur asynchrone renvoie un `Observable`/`Promise` du même type.
- Une règle qui compare plusieurs champs (confirmation de mot de passe…) se pose sur le `FormGroup`, pas sur un `FormControl`.

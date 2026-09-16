---
id: formulaires-dynamiques
chapitre: formulaires
ordre: 3
titre: "Formulaires dynamiques avec FormArray"
termes:
  - terme: FormArray
    definition: "Contrôle qui regroupe une **liste** de contrôles (ou de groupes) de même forme, indexés numériquement. Utile quand le nombre de champs n'est pas connu à l'avance, ex. les lignes d'une commande."
  - terme: "push / removeAt"
    definition: "Méthodes de `FormArray` pour ajouter un contrôle à la fin (`push`) ou retirer le contrôle à l'index donné (`removeAt`). Modifient la liste en place et recalculent la validité du tableau."
  - terme: Groupe imbriqué
    definition: "Un `FormArray` de commande contient typiquement des `FormGroup` (une ligne = un `FormGroup` avec `produit`, `quantite`…), eux-mêmes composés de `FormControl`. Les formulaires réactifs s'imbriquent sans limite de profondeur."
  - terme: updateValueAndValidity
    definition: "Recalcule la valeur et la validité d'un contrôle (et par défaut de ses parents). Nécessaire après avoir changé des validateurs dynamiquement avec `setValidators`/`clearValidators`, qui ne déclenchent pas ce recalcul tout seuls."
  - terme: "enable / disable"
    definition: "Méthodes qui activent ou désactivent un contrôle. Un contrôle désactivé est exclu de la validation du parent et de `value`, mais reste présent dans `getRawValue()`."
  - terme: "@for sur les contrôles"
    definition: "Boucle de template pour afficher chaque contrôle d'un `FormArray` : `@for (ligne of lignesCommande.controls; track ligne)`, avec `[formGroupName]=\"$index\"` pour lier chaque ligne."
quiz:
  - question: "Que se passe-t-il quand `removeAt(1)` est appelé sur ce `FormArray` de 3 lignes ?"
    code: |
      lignes = this.fb.array([
        this.fb.group({ produit: ['Clavier'], quantite: [1] }),
        this.fb.group({ produit: ['Souris'], quantite: [2] }),
        this.fb.group({ produit: ['Écran'], quantite: [1] }),
      ]);

      lignes.removeAt(1);
    choix:
      - "La ligne 'Souris' est retirée, 'Écran' devient l'index 1"
      - "La ligne à l'index 1 est vidée mais reste présente (3 lignes, une vide)"
      - "Toutes les lignes après l'index 1 sont supprimées"
      - "Une erreur, car `FormArray` ne permet pas de retirer un élément au milieu"
    reponse: 0
    explication: "`removeAt(i)` retire réellement le contrôle à l'index donné et décale les suivants : le tableau passe de 3 à 2 éléments, et 'Écran' devient l'élément d'index 1. Le `FormArray` se comporte comme un tableau JavaScript classique pour cette opération."
  - question: "Pourquoi `@for` sur un `FormArray` doit-il utiliser `track ligne` (ou un identifiant stable) plutôt que `track $index` ?"
    choix:
      - "`track $index` est interdit par le compilateur Angular sur un `FormArray`"
      - "Parce que `$index` recalculerait la validité de tout le tableau à chaque changement"
      - "Après une suppression au milieu du tableau, `track $index` réutiliserait le même DOM pour un contrôle différent, ce qui peut faire perdre le focus ou mélanger l'état visuel des lignes"
      - "`FormArray` ne peut pas être itéré avec `@for`, il faut utiliser `*ngFor`"
    reponse: 2
    explication: "Suivre par index fait qu'après une suppression, Angular réutilise l'élément DOM de l'index désormais occupé par une autre ligne (au lieu de le détruire), ce qui peut désynchroniser l'état visuel (focus, animation) du contrôle réel. Suivre par référence de contrôle (ou par un id stable de la donnée) évite ce problème."
  - question: "Ce champ `codePromo` doit devenir obligatoire uniquement si `avecCodePromo` est coché. Quelle méthode faut-il appeler après `setValidators(...)` pour que le changement prenne effet immédiatement ?"
    code: |
      this.form.controls.codePromo.setValidators(
        avecCodePromo ? [Validators.required] : [],
      );
    choix:
      - "`this.form.controls.codePromo.updateValueAndValidity()`"
      - "Rien, `setValidators` recalcule automatiquement la validité"
      - "`this.form.reset()`"
      - "`this.form.controls.codePromo.markAsTouched()`"
    reponse: 0
    explication: "`setValidators` remplace la liste des validateurs mais ne relance pas la validation : sans `updateValueAndValidity()`, l'état `valid`/`invalid` du contrôle reste celui d'avant le changement jusqu'au prochain changement de valeur."
---

## Essentiel

Un `FormArray` regroupe une **liste** de contrôles de même forme, quand leur nombre n'est pas fixé à l'avance — typiquement les lignes d'une commande :

```ts
commandeForm = this.fb.group({
  lignes: this.fb.array([
    this.fb.group({ produit: ['', Validators.required], quantite: [1, Validators.min(1)] }),
  ]),
});

get lignes() {
  return this.commandeForm.controls.lignes;
}

ajouterLigne() {
  this.lignes.push(this.fb.group({ produit: ['', Validators.required], quantite: [1, Validators.min(1)] }));
}

supprimerLigne(index: number) {
  this.lignes.removeAt(index);
}
```

Dans le template, on itère sur `lignes.controls` avec `@for`, et `formGroupName="$index"` relie chaque bloc à sa ligne :

```html
<div [formGroup]="commandeForm">
  <div formArrayName="lignes">
    @for (ligne of lignes.controls; track ligne) {
      <div [formGroupName]="$index">
        <input formControlName="produit" placeholder="Produit" />
        <input type="number" formControlName="quantite" />
        <button type="button" (click)="supprimerLigne($index)">Retirer</button>
      </div>
    }
  </div>
  <button type="button" (click)="ajouterLigne()">Ajouter une ligne</button>
</div>
```

Comme un `FormGroup`, un `FormArray` est `invalid` dès qu'un seul de ses éléments l'est, et sa `value` est un tableau des valeurs de chaque contrôle.

## Détail

### Comment ça marche

`FormArray` fonctionne comme un `FormGroup`, mais indexe ses enfants par position plutôt que par nom. Dans le template, `formArrayName="lignes"` remplace `[formGroup]` pour la partie qui correspond au tableau, et chaque élément se lie avec `[formGroupName]="$index"` (ou `[formControlName]="$index"` si le tableau contient directement des `FormControl` plutôt que des `FormGroup`).

### Exemple 1 — Générer un formulaire à partir d'une configuration

```ts
interface ChampConfig {
  nom: string;
  valeurInitiale: string;
  requis: boolean;
}

construireFormulaire(champs: ChampConfig[]): FormGroup {
  const controles = champs.reduce((acc, champ) => {
    acc[champ.nom] = [champ.valeurInitiale, champ.requis ? Validators.required : []];
    return acc;
  }, {} as Record<string, any>);
  return this.fb.group(controles);
}
```

Utile quand la structure du formulaire dépend de données reçues du serveur (ex. les champs d'une fiche produit variables selon la catégorie).

### Exemple 2 — Activer/désactiver des champs selon d'autres champs

```ts
livraisonForm = this.fb.group({
  memeAdresseQueFacturation: [true],
  adresseLivraison: this.fb.group({
    rue: [{ value: '', disabled: true }],
    ville: [{ value: '', disabled: true }],
  }),
});

constructor() {
  this.livraisonForm.controls.memeAdresseQueFacturation.valueChanges.subscribe((meme) => {
    const adresse = this.livraisonForm.controls.adresseLivraison;
    meme ? adresse.disable() : adresse.enable();
  });
}
```

`disable()`/`enable()` s'appliquent aussi à un `FormGroup` entier : ils désactivent récursivement tous ses contrôles enfants. Un groupe désactivé sort de la validation du parent et de `value`, mais reste lisible via `getRawValue()`.

### Exemple 3 — updateValueAndValidity après un changement de validateurs

```ts
codePromo = new FormControl('');
avecCodePromo = new FormControl(false);

constructor() {
  this.avecCodePromo.valueChanges.subscribe((coche) => {
    if (coche) {
      this.codePromo.setValidators([Validators.required, Validators.minLength(4)]);
    } else {
      this.codePromo.clearValidators();
    }
    this.codePromo.updateValueAndValidity();
  });
}
```

`setValidators`/`clearValidators` remplacent la liste des validateurs mais ne recalculent pas la validité toutes seules : `updateValueAndValidity()` est indispensable pour que `valid`/`invalid` reflète immédiatement le nouvel ensemble de règles.

### Exemple 4 — FormArray typé (Angular 14+)

```ts
lignes: FormArray<FormGroup<{ produit: FormControl<string>; quantite: FormControl<number> }>>;
```

En pratique, ce type est presque toujours **inféré** par `this.fb.array([...])` à partir des groupes qu'on lui passe : l'écrire explicitement n'est utile que pour typer une propriété déclarée à part, avant son initialisation.

### Pièges courants

> **`track $index` sur un `FormArray` modifiable.** Après une suppression au milieu de la liste, Angular réutilise l'élément DOM de l'index désormais occupé par une autre ligne au lieu de le recréer : le focus ou l'état visuel peut se retrouver associé à la mauvaise ligne. Préférez `track ligne` (le contrôle lui-même, stable tant qu'il n'est pas supprimé) ou un identifiant métier stable.

> **Oublier `updateValueAndValidity()` après `setValidators`/`clearValidators`.** Le contrôle garde l'ancien statut de validité jusqu'au prochain changement de valeur, ce qui peut laisser passer une soumission qui ne devrait plus être valide (ou bloquer un formulaire redevenu valide).

> **Confondre l'index du `FormArray` et un id métier.** `[formGroupName]="$index"` lie la position dans le tableau, pas un identifiant de la donnée. Si l'ordre des lignes peut changer (tri, glisser-déposer), il faut garder une référence à part pour retrouver la bonne ligne métier.

### À retenir

- `FormArray` regroupe une liste de contrôles de même forme : `push` ajoute, `removeAt` retire.
- Dans le template : `formArrayName` sur le conteneur, `[formGroupName]="$index"` (ou `[formControlName]="$index"`) sur chaque élément.
- `@for` sur les contrôles d'un `FormArray` doit suivre le contrôle lui-même (ou un id stable), jamais `$index` seul.
- `setValidators`/`clearValidators` exigent un `updateValueAndValidity()` pour prendre effet immédiatement.
- `disable()`/`enable()` s'appliquent récursivement à un groupe entier, utile pour des champs conditionnels.

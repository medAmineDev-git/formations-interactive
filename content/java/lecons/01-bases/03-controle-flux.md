---
id: controle-flux
chapitre: bases
ordre: 3
titre: "Structures de contrôle"
termes:
  - terme: "if / else"
    definition: "Exécute un bloc selon une condition booléenne. Le `else` est optionnel ; on peut enchaîner des `else if` pour plusieurs cas exclusifs."
  - terme: "for-each"
    definition: "Forme de boucle `for (Type element : collection)` qui parcourt chaque élément d'un tableau ou d'une collection, sans gérer d'index. Plus lisible que la boucle indexée quand l'index n'est pas nécessaire."
  - terme: "break / continue"
    definition: "`break` sort immédiatement de la boucle (ou du `switch`) englobante. `continue` passe directement à l'itération suivante, sans exécuter le reste du corps de la boucle."
  - terme: Étiquette (label)
    definition: "Un nom placé avant une boucle (ex. `recherche:`) permettant à `break` ou `continue` de cibler explicitement cette boucle plutôt que la boucle la plus proche, utile pour sortir de boucles imbriquées."
  - terme: "switch classique"
    definition: "Instruction `switch` historique : chaque `case` doit se terminer par `break` (sinon l'exécution continue dans le `case` suivant, comportement appelé *fall-through*, souvent involontaire)."
  - terme: "Expression switch (`->`)"
    definition: "Forme moderne du `switch`, finalisée en **Java 14** (JEP 361) : chaque branche `case ... ->` ne tombe jamais dans la suivante, `switch` peut être utilisé comme une **expression** qui produit une valeur, et le compilateur vérifie l'**exhaustivité** des cas."
  - terme: "yield"
    definition: "Mot-clé qui renvoie une valeur depuis un bloc `{ }` d'une branche d'expression switch, quand la branche a besoin de plusieurs instructions avant de produire son résultat."
  - terme: Exhaustivité
    definition: "Propriété qu'a une expression switch de couvrir tous les cas possibles (toutes les constantes d'un `enum`, par exemple). Le compilateur peut l'exiger, sans quoi il refuse de compiler (sauf ajout d'un `default`)."
quiz:
  - question: "Qu'affiche ce code ?"
    code: |
      int note = 2;
      switch (note) {
          case 1:
              System.out.println("Un");
          case 2:
              System.out.println("Deux");
          case 3:
              System.out.println("Trois");
              break;
          default:
              System.out.println("Autre");
      }
    choix:
      - "Deux"
      - "Deux puis Trois"
      - "Un puis Deux puis Trois"
      - "Autre"
    reponse: 1
    explication: "Le `switch` classique exécute le `case` correspondant (`case 2`) puis **continue** dans les cas suivants tant qu'aucun `break` n'est rencontré (*fall-through*) : `Deux` puis `Trois`, où le `break` arrête enfin l'exécution. C'est un piège classique du `switch` historique ; l'expression switch avec `->` élimine ce comportement."
  - question: "Que produit cette expression switch ?"
    code: |
      String taille = "M";
      int stock = switch (taille) {
          case "S" -> 10;
          case "M" -> 25;
          case "L" -> 8;
          default -> 0;
      };
      System.out.println(stock);
    choix:
      - "25"
      - "0"
      - "Une erreur de compilation : switch ne peut pas produire de valeur"
      - "10 puis 25 puis 8 (fall-through)"
    reponse: 0
    explication: "Depuis sa finalisation en Java 14, `switch` peut être utilisé comme **expression** : chaque branche `->` produit une valeur pour le `case` correspondant, sans fall-through possible. `taille` vaut `\"M\"`, donc `stock` reçoit `25`."
  - question: "Pourquoi ce code ne compile-t-il pas ?"
    code: |
      enum Statut { EN_COURS, VALIDEE, ANNULEE }

      Statut s = Statut.VALIDEE;
      String libelle = switch (s) {
          case EN_COURS -> "En cours";
          case VALIDEE -> "Validée";
      };
    choix:
      - "Il manque des points-virgules après chaque `case`"
      - "L'expression switch n'est pas exhaustive : le cas ANNULEE n'est couvert par aucune branche ni par un default"
      - "Une expression switch ne peut pas porter sur un enum"
      - "Il faut utiliser `break` au lieu de `->`"
    reponse: 1
    explication: "Une expression switch doit couvrir tous les cas possibles : le compilateur vérifie l'exhaustivité. Ici, la constante `ANNULEE` n'est traitée par aucune branche, et il n'y a pas de `default`. Il faut ajouter `case ANNULEE -> ...` ou une branche `default`."
---

## Essentiel

Les structures de contrôle habituelles :

```java
if (stock > 0) {
    System.out.println("Disponible");
} else if (stock == 0) {
    System.out.println("Rupture");
} else {
    System.out.println("Stock invalide");
}

for (int i = 0; i < produits.size(); i++) { ... }      // boucle indexée
for (Produit p : produits) { ... }                      // for-each
while (stock > 0) { stock--; }
do { stock--; } while (stock > 0);                       // corps exécuté au moins une fois
```

`break` sort d'une boucle ou d'un `switch` ; `continue` passe à l'itération suivante.

Java propose deux formes de `switch`. La forme **classique** exige un `break` par `case`, sinon l'exécution continue dans le `case` suivant (*fall-through*, souvent un bug). La forme moderne, l'**expression switch avec `->`** (finalisée en Java 14), élimine ce piège et peut directement produire une valeur :

```java
String taille = "M";
String libelle = switch (taille) {
    case "S" -> "Petit";
    case "M" -> "Moyen";
    case "L" -> "Grand";
    default -> "Inconnu";
};
```

Pour du code moderne, préférez l'expression switch.

## Détail

### Comment ça marche

Une structure de contrôle décide quelles instructions s'exécutent, et combien de fois. `if`/`else` choisit un chemin ; les boucles répètent un bloc ; `switch` choisit une branche parmi plusieurs valeurs possibles d'une même expression. Chaque bloc `{ }` délimite une **portée** : une variable déclarée dans un bloc n'existe pas en dehors.

### Exemple 1 — `break`/`continue` avec étiquette

```java
recherche:
for (int ligne = 0; ligne < grille.length; ligne++) {
    for (int colonne = 0; colonne < grille[ligne].length; colonne++) {
        if (grille[ligne][colonne].equals("produit-cible")) {
            System.out.println("Trouvé en " + ligne + "," + colonne);
            break recherche; // sort des deux boucles, pas seulement la plus interne
        }
    }
}
```

Sans étiquette, `break` ne sortirait que de la boucle sur `colonne`. L'étiquette cible directement la boucle voulue.

### Exemple 2 — `yield` dans une branche à plusieurs instructions

```java
int remise = switch (categorieClient) {
    case "VIP" -> 20;
    case "FIDELE" -> {
        int base = 10;
        System.out.println("Client fidèle, remise de base : " + base);
        yield base;
    }
    default -> 0;
};
```

Quand une branche a besoin de plusieurs instructions avant de produire sa valeur, on utilise un bloc `{ }` terminé par `yield`.

### Exemple 3 — Le piège de l'oubli de `break`

```java
int jour = 6;
switch (jour) {
    case 6:
    case 7:
        System.out.println("Week-end");
        break;
    default:
        System.out.println("Jour ouvré");
}
```

Ici, l'absence volontaire de `break` entre `case 6` et `case 7` regroupe les deux cas (idiome courant et intentionnel). C'est l'oubli **involontaire** d'un `break` ailleurs qui cause des bugs difficiles à repérer — l'expression switch avec `->` supprime ce risque en ne faisant jamais de fall-through implicite.

### `switch` classique vs expression switch

| | `switch` classique | Expression switch (`->`) |
|---|---|---|
| Fall-through | Oui, sans `break` explicite | Jamais |
| Peut produire une valeur | Non (instruction seulement) | Oui (peut s'affecter à une variable) |
| Vérification d'exhaustivité | Non | Oui, si utilisée comme expression |
| Plusieurs valeurs par branche | `case 6: case 7:` | `case 6, 7 ->` |
| Finalisée depuis | Toujours existé | **Java 14** (JEP 361) |

### Pièges courants

> **Fall-through non voulu dans un `switch` classique.** Oublier un `break` fait continuer l'exécution dans le `case` suivant. Le compilateur ne signale rien : c'est un bug silencieux. Préférer l'expression switch avec `->`, qui ne tombe jamais dans le `case` suivant.

> **Expression switch non exhaustive.** Une expression switch doit couvrir tous les cas (toutes les constantes d'un `enum`, par exemple) ou fournir un `default`. Sans cela : erreur de compilation. C'est une contrainte voulue, pas un défaut : elle force à traiter chaque cas explicitement.

> **Redéclarer une variable dans un bloc englobant.** Une variable déclarée dans le corps d'un `for` ou d'un `if` n'existe que dans ce bloc. L'utiliser juste après l'accolade fermante est une erreur de compilation (« cannot find symbol »), pas une valeur `null` ou obsolète.

### À retenir

- `for-each` pour parcourir sans avoir besoin de l'index ; boucle indexée sinon.
- `break`/`continue` avec étiquette pour cibler une boucle englobante précise.
- Le `switch` classique fait du *fall-through* sans `break` explicite : piège fréquent.
- L'expression switch avec `->` (finalisée en **Java 14**) ne fait jamais de fall-through, peut produire une valeur, et vérifie l'exhaustivité.
- `yield` renvoie une valeur depuis un bloc `{ }` d'une branche d'expression switch.

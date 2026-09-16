---
id: computed-effect
chapitre: signaux
ordre: 2
titre: Valeurs calculées et effets
termes:
  - terme: "computed()"
    definition: "Crée un signal en lecture seule (`Signal<T>`) dont la valeur est **dérivée** d'autres signaux. Elle est **paresseuse** (calculée seulement à la lecture) et **mémorisée** (recalculée uniquement si une dépendance a changé)."
  - terme: "effect()"
    definition: "Enregistre une fonction qui s'exécute automatiquement chaque fois qu'un des signaux qu'elle lit change. Réservé aux **effets de bord** : synchronisation avec quelque chose en dehors du système de réactivité d'Angular (stockage local, journalisation, librairie tierce non réactive)."
  - terme: Graphe de dépendances
    definition: "Angular détermine automatiquement les dépendances d'un `computed()` ou d'un `effect()` en observant quels signaux sont **lus pendant son exécution**. Aucune liste de dépendances à déclarer soi-même, contrairement à certains hooks d'autres frameworks."
  - terme: onCleanup
    definition: "Fonction reçue en paramètre par le callback d'un `effect()`, à appeler pour enregistrer une action de nettoyage (annuler un minuteur, se désabonner). Elle s'exécute juste avant la prochaine exécution de l'effet, et à sa destruction."
  - terme: "untracked()"
    definition: "Permet de lire un signal **sans** l'enregistrer comme dépendance dans un `computed()` ou un `effect()`. Utile quand on a besoin d'une valeur ponctuelle qui ne doit pas déclencher un recalcul si elle change seule."
  - terme: "linkedSignal()"
    definition: "Crée un `WritableSignal<T>` dont la valeur **par défaut** se réinitialise automatiquement quand un signal source change, tout en restant modifiable manuellement ensuite (contrairement à `computed()`, qui n'est jamais modifiable)."
  - terme: EffectRef
    definition: "Objet renvoyé par `effect()`, avec une méthode `destroy()` pour arrêter l'effet manuellement (rarement nécessaire : un effet créé dans un contexte d'injection est détruit automatiquement avec son composant)."
quiz:
  - question: "Combien de fois le corps de `totalTTC` s'exécute-t-il pendant ce scénario ?"
    code: |
      const prixHT = signal(100);
      const totalTTC = computed(() => {
        console.log('calcul');
        return prixHT() * 1.2;
      });

      totalTTC();       // lecture 1
      totalTTC();       // lecture 2, prixHT n'a pas changé
      prixHT.set(200);
      totalTTC();       // lecture 3, prixHT a changé
    choix:
      - "3 fois, une par lecture"
      - "2 fois : une fois avant le changement de `prixHT`, une fois après"
      - "1 fois seulement, à la création du signal"
      - "4 fois : 3 lectures plus une exécution automatique à la création"
    reponse: 1
    explication: "`computed()` est paresseux et mémorisé : le calcul ne s'exécute qu'au moment d'une lecture **et** seulement si une dépendance a changé depuis le dernier calcul. Les deux premières lectures renvoient la valeur déjà calculée sans relancer la fonction ; seule la lecture qui suit `prixHT.set(200)` déclenche un nouveau calcul."
  - question: "Quel est le problème principal de ce code ?"
    code: |
      const prixHT = signal(100);
      const tva = signal(0.2);
      const totalTTC = signal(0);

      effect(() => {
        totalTTC.set(prixHT() * (1 + tva()));
      });
    choix:
      - "Le code ne compile pas : un `effect()` ne peut pas lire deux signaux"
      - "`totalTTC` devrait être un `computed()` : utiliser `effect()` pour dériver un état est un usage détourné, déconseillé et source de bugs (ordre d'exécution, boucles)"
      - "`effect()` doit obligatoirement renvoyer une valeur"
      - "Rien : c'est l'usage normal et recommandé d'un `effect()`"
    reponse: 1
    explication: "`effect()` est prévu pour des effets de bord (synchronisation avec l'extérieur), pas pour calculer un état dérivé de signaux : `totalTTC` devrait être `computed(() => prixHT() * (1 + tva()))`. Écrire dans un signal depuis un `effect()` est explicitement déconseillé par la documentation Angular : ça crée des dépendances difficiles à suivre et peut provoquer des boucles de mise à jour."
  - question: "À quoi sert principalement `linkedSignal()` ?"
    choix:
      - "À lier automatiquement deux signaux pour qu'ils partagent toujours la même valeur"
      - "À créer un signal dont la valeur par défaut se réinitialise quand une source change, mais qui reste modifiable manuellement ensuite (ex. réinitialiser une sélection quand la liste change)"
      - "À remplacer `computed()` dans tous les cas, car il est plus performant"
      - "À synchroniser un signal avec le stockage local du navigateur"
    reponse: 1
    explication: "Cas d'usage typique : une sélection (`produitSelectionne`) qui doit se réinitialiser sur le premier élément quand la liste `produits` change, mais que l'utilisateur doit pouvoir modifier ensuite librement. `computed()` ne conviendrait pas : sa valeur n'est jamais modifiable directement."
---

## Essentiel

`computed()` crée une valeur **dérivée** d'autres signaux. Elle est **paresseuse** (le calcul n'a lieu qu'à la lecture) et **mémorisée** (le résultat est mis en cache tant qu'aucune dépendance n'a changé) :

```ts
import { signal, computed } from '@angular/core';

const prixHT = signal(100);
const quantite = signal(2);

const totalHT = computed(() => prixHT() * quantite());

console.log(totalHT()); // 200
quantite.set(3);
console.log(totalHT()); // 300 — recalculé car quantite a changé
```

Angular détecte automatiquement les dépendances : il n'y a rien à déclarer, il suffit de lire les signaux dans la fonction.

`effect()` exécute une fonction chaque fois que ses dépendances changent, mais **pas pour calculer un état** : il sert à synchroniser Angular avec quelque chose en dehors du système de signaux (écrire dans le stockage local, journaliser, piloter une librairie tierce non réactive).

```ts
import { effect } from '@angular/core';

effect(() => {
  localStorage.setItem('panier', JSON.stringify(panier()));
});
```

Règle importante : un `effect()` ne doit **ni** servir à calculer un état dérivé (c'est le rôle de `computed()`), **ni** modifier d'autres signaux — la documentation Angular déconseille explicitement d'écrire dans un signal depuis un effet, car ça complique le graphe de dépendances et peut provoquer des boucles.

Pour lire un signal sans en faire une dépendance, `untracked()` ; pour nettoyer une ressource avant la prochaine exécution, le paramètre `onCleanup` ; pour une valeur par défaut qui se réinitialise quand une source change tout en restant modifiable, `linkedSignal()`.

## Détail

### Comment ça marche

Quand `computed()` ou `effect()` s'exécutent, Angular observe quels signaux sont **lus** pendant l'exécution et construit un **graphe de dépendances**. Au prochain changement d'un de ces signaux, Angular sait exactement quels `computed()` invalider et quels `effect()` reprogrammer — sans avoir à tout réévaluer.

Pour `computed()`, l'invalidation ne relance pas immédiatement le calcul : elle marque juste le résultat comme périmé. Le vrai recalcul n'a lieu qu'à la **prochaine lecture**. C'est ce qui rend `computed()` bon marché même si personne ne le lit entre deux changements.

### Exemple 1 — Un panier avec total dérivé

```ts
interface LigneCommande {
  produit: string;
  prix: number;
  quantite: number;
}

const lignes = signal<LigneCommande[]>([
  { produit: 'Clavier', prix: 49, quantite: 1 },
  { produit: 'Souris', prix: 19, quantite: 2 },
]);

const total = computed(() =>
  lignes().reduce((somme, ligne) => somme + ligne.prix * ligne.quantite, 0),
);

console.log(total()); // 87
```

`total` se recalcule automatiquement dès que `lignes` change (ajout, suppression, modification d'une quantité), et jamais autrement.

### Exemple 2 — Un effect légitime : synchroniser le stockage local

```ts
import { Component, effect, signal } from '@angular/core';

@Component({ /* ... */ })
export class Panier {
  lignes = signal<LigneCommande[]>(this.chargerDepuisStockage());

  constructor() {
    effect(() => {
      // Effet de bord : écrire vers l'extérieur d'Angular
      localStorage.setItem('panier', JSON.stringify(this.lignes()));
    });
  }

  private chargerDepuisStockage(): LigneCommande[] {
    const donnees = localStorage.getItem('panier');
    return donnees ? JSON.parse(donnees) : [];
  }
}
```

C'est un bon usage : `effect()` ne calcule rien, il réagit à un changement pour agir sur quelque chose qu'Angular ne gère pas (ici, le stockage local du navigateur).

### Exemple 3 — Nettoyage avec `onCleanup`

```ts
effect((onCleanup) => {
  const produitId = produitSurvole();
  if (produitId === null) return;

  const minuteur = setTimeout(() => afficherApercu(produitId), 300);

  onCleanup(() => clearTimeout(minuteur));
});
```

À chaque nouvelle exécution de l'effet (ou à sa destruction), la fonction passée à `onCleanup` s'exécute d'abord : ici, on annule le minuteur précédent avant d'en poser un nouveau, pour éviter d'afficher l'aperçu d'un produit qu'on ne survole déjà plus.

### Exemple 4 — `untracked()` et `linkedSignal()`

```ts
// untracked() : lire journalUtilisateur sans en faire une dépendance
effect(() => {
  const total = totalHT();
  console.log(`Total recalculé : ${total}`, untracked(() => journalUtilisateur()));
});

// linkedSignal() : réinitialiser la sélection quand la liste change,
// tout en la laissant modifiable ensuite
const produits = signal<Produit[]>([produitA, produitB, produitC]);
const produitSelectionne = linkedSignal(() => produits()[0]);

produitSelectionne.set(produitB); // choix manuel de l'utilisateur, autorisé
produits.set([produitD, produitE]); // la sélection revient à produitD
```

Sans `linkedSignal()`, il faudrait un `effect()` qui réinitialise manuellement un signal séparé à chaque changement de `produits` — exactement le genre d'écriture croisée entre signaux que la documentation déconseille.

### `computed()` contre `effect()`

| | `computed()` | `effect()` |
|---|---|---|
| Renvoie une valeur | ✅ (`Signal<T>`) | ❌ (`void`) |
| Paresseux (calcul à la lecture) | ✅ | ❌ (s'exécute dès qu'une dépendance change) |
| Bon usage | état dérivé (total, filtre, tri) | effet de bord (stockage, log, DOM, lib externe) |
| Doit écrire dans un signal | jamais (il *est* le résultat) | à éviter |

### Pièges courants

> **Utiliser `effect()` pour dériver un état.** `effect(() => total.set(prix() * quantite()))` fonctionne, mais c'est un anti-pattern documenté par Angular : ça introduit un décalage d'une passe de détection de changements, et ça complique le débogage. Si la valeur peut se calculer directement à partir d'autres signaux, `computed()` est toujours le bon outil.

> **Créer une boucle en écrivant dans un signal lu par le même effect.** Si un `effect()` lit `a` et écrit dans `a` (directement ou via une chaîne d'autres signaux), on obtient une réexécution en cascade, potentiellement infinie. Angular ne l'empêche pas automatiquement : c'est à la conception du code de l'éviter.

> **Oublier que `computed()` est mémorisé.** Une fonction avec un effet de bord (compteur, appel réseau) à l'intérieur d'un `computed()` peut s'exécuter moins souvent qu'attendu, ou de façon imprévisible. `computed()` doit être une fonction **pure**.

### À retenir

- `computed()` : pour un **état dérivé**, pur, paresseux et mémorisé. Jamais d'effet de bord à l'intérieur.
- `effect()` : pour une **synchronisation avec l'extérieur** (stockage, journalisation, DOM, librairie tierce). Jamais pour calculer un état ni écrire dans d'autres signaux.
- `onCleanup` nettoie avant la prochaine exécution ou à la destruction de l'effet.
- `untracked()` lit un signal sans créer de dépendance.
- `linkedSignal()` : une valeur par défaut qui se réinitialise avec sa source, mais reste modifiable — utile pour une sélection liée à une liste.

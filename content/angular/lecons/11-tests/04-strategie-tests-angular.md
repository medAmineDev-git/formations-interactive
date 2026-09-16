---
id: strategie-tests-angular
chapitre: tests-angular
ordre: 4
titre: "Quoi tester, et comment s'organiser"
termes:
  - terme: Pyramide de tests
    definition: "Modèle qui recommande beaucoup de tests unitaires (rapides, ciblés), moins de tests de composants ou d'intégration, et peu de tests de bout en bout (lents, coûteux à maintenir). Sert de repère, pas de règle absolue."
  - terme: Test unitaire
    definition: "Test d'une unité de logique isolée — le plus souvent une méthode de service ou une fonction pure — sans passer par `TestBed` ni le DOM. Le plus rapide à écrire et à exécuter."
  - terme: Test de composant
    definition: "Test qui passe par `TestBed`/`ComponentFixture` pour vérifier le rendu, les interactions DOM ou les entrées/sorties d'un composant. Plus lent et plus fragile qu'un test unitaire, mais nécessaire pour couvrir l'intégration composant-template."
  - terme: Test de bout en bout (E2E)
    definition: "Test qui pilote l'application entière dans un vrai navigateur, comme le ferait un utilisateur (Playwright, Cypress). Le plus fidèle à l'usage réel, mais aussi le plus lent, le plus coûteux à maintenir et le plus sujet aux échecs intermittents."
  - terme: Test fragile
    definition: "Test qui échoue pour une raison sans rapport avec un vrai bug — un sélecteur CSS trop précis, une dépendance au temps réel, un ordre d'exécution supposé entre tests. Coûte cher en maintenance et en confiance."
  - terme: Couverture de code
    definition: "Pourcentage de lignes, branches ou fonctions exécutées par la suite de tests (option `coverage` de la configuration de test). Utile comme indicateur de zones non testées, dangereux comme objectif chiffré en soi."
  - terme: Intégration continue (CI)
    definition: "Exécution automatique de la suite de tests à chaque changement de code (`ng test --no-watch --no-progress` ou équivalent), pour détecter une régression avant qu'elle n'atteigne la production."
quiz:
  - question: "Pour une fonction `calculerRemise(panier, codePromo)` contenant plusieurs règles métier (seuils, cumuls, exclusions), quel type de test apporte le plus de valeur en priorité ?"
    choix:
      - "Un test de bout en bout qui simule un parcours d'achat complet dans un navigateur"
      - "Un test unitaire de la fonction elle-même, avec plusieurs cas (panier sous le seuil, code invalide, cumul de remises, cas limite à zéro)"
      - "Un test de composant qui vérifie que le prix s'affiche bien en gras dans le template"
      - "Aucun test n'est nécessaire si la fonction est courte"
    reponse: 1
    explication: "La logique métier avec plusieurs règles et cas limites est exactement ce qu'un test unitaire couvre le mieux : rapide, ciblé, facile à faire varier sur de nombreux cas. Un test E2E ou de composant vérifierait autre chose (l'affichage, le parcours), pas la justesse du calcul lui-même."
  - question: "Quel est le principal risque d'un test écrit ainsi ?"
    code: |
      it('affiche un message après le chargement', async () => {
        fixture.detectChanges();
        await new Promise((r) => setTimeout(r, 1000));
        expect(fixture.nativeElement.textContent).toContain('Chargé');
      });
    choix:
      - "Le test est parfaitement fiable, ce style est recommandé pour tout code asynchrone"
      - "Le test est fragile : il dépend d'un délai fixe arbitraire (1000ms), trop court sur une machine lente et inutilement long sur une machine rapide, ce qui ralentit ou fait échouer la suite de façon intermittente"
      - "`setTimeout` ne fonctionne pas dans un fichier de test"
      - "Le test échouera systématiquement en mode zoneless"
    reponse: 1
    explication: "Attendre un délai fixe est un classique de test fragile : la valeur choisie est un compromis arbitraire entre rapidité et fiabilité. Il vaut mieux attendre un signal précis (résolution d'une promesse, `fixture.whenStable()`, ou des minuteurs simulés) plutôt qu'un temps réel écoulé."
  - question: "Quel est le principal danger de fixer un objectif chiffré de couverture de code (« 90 % partout ») ?"
    choix:
      - "La couverture de code ne peut techniquement pas dépasser 80 % sur un projet Angular"
      - "Viser un pourcentage précis pousse à écrire des tests qui exécutent du code sans vraiment vérifier de comportement, juste pour faire progresser le chiffre — une fausse impression de sécurité"
      - "Une couverture élevée ralentit systématiquement l'exécution des tests"
      - "La couverture de code n'a aucune utilité, même comme indicateur"
    reponse: 1
    explication: "La couverture indique quelles lignes ne sont *jamais* exécutées par les tests — un signal utile pour repérer des trous. Mais un chiffre cible incite à écrire des tests qui appellent du code sans assertion pertinente, juste pour le marquer comme couvert : la métrique monte sans que la confiance dans le code augmente vraiment."
---

## Essentiel

Toutes les briques vues dans ce chapitre (`TestBed`, `HttpTestingController`, doubles de test) ne servent à rien sans savoir **quoi** tester en priorité. Règle générale : tester en priorité la **logique métier** — calculs, règles, états, cas limites — plutôt que le rendu visuel exact.

- **Tests unitaires** (services, fonctions pures) : rapides, nombreux, ciblés sur des règles précises (calcul de remise, validation, formatage). C'est là que se trouve le meilleur rapport valeur/coût.
- **Tests de composants** : vérifient l'intégration entre un composant et son template (affichage conditionnel, interactions). Utiles mais plus lents et plus fragiles ; on ne teste pas chaque détail visuel, seulement ce qui compte (un montant affiché, un bouton désactivé).
- **Tests de bout en bout** (Playwright, Cypress) : peu nombreux, réservés aux parcours critiques (paiement, connexion) qui traversent plusieurs pages. Précieux mais coûteux à écrire et à maintenir.

Un test **fragile** échoue sans rapport avec un vrai bug : sélecteur CSS trop précis, dépendance à un délai réel (`setTimeout` + attente fixe), ordre supposé entre tests indépendants. Préférer des sélecteurs stables et des signaux d'attente précis (`whenStable()`, résolution d'une promesse) à un temps arbitraire.

La **couverture de code** est un indicateur utile pour repérer des zones jamais exécutées par les tests, jamais un objectif en soi : viser un chiffre pousse à écrire des tests creux. Enfin, la suite de tests doit tourner en **intégration continue** à chaque changement, en mode non interactif (`ng test --no-watch --no-progress`), pour bloquer une régression avant qu'elle n'atteigne la production.

## Détail

### Comment ça marche

La pyramide de tests reste un bon repère mental : beaucoup de tests unitaires (bases, rapides), un nombre raisonnable de tests de composants (intégration composant-template), et peu de tests de bout en bout (parcours utilisateurs critiques). Ce n'est pas une règle rigide — un projet très riche en logique de formulaire aura naturellement plus de tests de composants qu'un projet dominé par des calculs métier — mais l'inverse (beaucoup de tests E2E lents, presque pas de tests unitaires rapides) est presque toujours un signe qu'il faut rééquilibrer.

### Exemple 1 — Prioriser la logique plutôt que le rendu exact

```ts
// Faible valeur : dépend de la mise en page exacte, casse au moindre changement de style
it('affiche le total dans un <span> avec la classe "prix-fort"', () => { /* ... */ });

// Forte valeur : vérifie une règle métier, indépendante du rendu
it('applique 10% de remise à partir de 100€ d\'achat', () => {
  expect(calculerRemise({ total: 120 }, null)).toBe(12);
});
```

Le deuxième test survit à une refonte visuelle complète ; le premier doit être réécrit dès qu'on change une classe CSS, sans que la logique n'ait changé.

### Exemple 2 — Un sélecteur fragile contre un sélecteur stable

```html
<!-- Sélecteur fragile : casse si un <div> est ajouté ou déplacé -->
<div><div><span class="a3">Total : 42€</span></div></div>

<!-- Sélecteur stable : dédié au test, insensible à la mise en page -->
<span data-testid="total-panier">Total : 42€</span>
```

```ts
fixture.nativeElement.querySelector('[data-testid="total-panier"]');
```

Un attribut dédié au test découple la structure visuelle (qui change souvent) de ce que le test doit retrouver.

### Exemple 3 — Données de test réalistes mais maîtrisées

```ts
function creerProduitTest(champs: Partial<Produit> = {}): Produit {
  return {
    id: 1,
    nom: 'Produit test',
    prix: 10,
    stock: 5,
    ...champs,
  };
}

it('refuse une commande si le stock est insuffisant', () => {
    const produit = creerProduitTest({ stock: 0 });
    expect(peutCommander(produit, 1)).toBe(false);
});
```

Une fonction fabrique avec des valeurs par défaut sensées, surchargeables au cas par cas, évite de dupliquer un objet `Produit` complet dans chaque test et rend visible ce qui compte vraiment pour ce cas précis (`stock: 0`).

### Unitaire, composant, E2E — quand choisir quoi

| | Unitaire | Composant | Bout en bout |
|---|---|---|---|
| Vitesse | Très rapide | Rapide à moyen | Lent |
| Ce qu'il vérifie | Une règle, un calcul, un état | Rendu, interactions DOM, entrées/sorties | Un parcours utilisateur complet |
| Fragilité typique | Faible | Moyenne (sélecteurs) | Élevée (réseau, timing, environnement) |
| Volume recommandé | Nombreux | Modéré | Peu, ciblés sur le critique |
| Outils Angular 21 | Vitest, aucune dépendance à `TestBed` si possible | Vitest + `TestBed`/`ComponentFixture` | Playwright ou Cypress (hors Angular CLI) |

### Pièges courants

> **Viser 100% de couverture comme objectif.** Certaines lignes (gestion d'erreurs improbables, code de compatibilité) ne valent pas le coût de test qu'elles imposent. Un chiffre cible pousse à écrire des tests qui exécutent du code sans vérifier de comportement utile.

> **Tester l'implémentation plutôt que le comportement.** Un test qui vérifie qu'une méthode privée précise a été appelée (plutôt que le résultat observable) casse à chaque refactorisation, même quand le comportement reste correct.

> **Dupliquer la logique du code dans le test.** Recalculer la même formule dans l'assertion (`expect(total).toBe(prix * quantite * (1 - remise))`) ne vérifie rien : si la formule du code est fausse, celle du test l'est probablement aussi de la même façon. Utiliser des valeurs attendues fixes et connues à l'avance.

### À retenir

- Prioriser les tests unitaires sur la logique métier (calculs, règles, cas limites) : rapport valeur/coût le plus élevé.
- Réserver les tests de composants à l'intégration composant-template, et les tests E2E (Playwright, Cypress) aux parcours critiques.
- Un test fragile (sélecteur trop précis, délai réel arbitraire) coûte plus cher en maintenance qu'il n'apporte de confiance.
- La couverture de code est un indicateur pour repérer des trous, jamais un objectif chiffré en soi.
- Faire tourner la suite de tests en intégration continue, en mode non interactif, pour bloquer une régression avant qu'elle n'atteigne la production.

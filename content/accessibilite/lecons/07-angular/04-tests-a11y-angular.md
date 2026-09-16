---
id: tests-a11y-angular
chapitre: angular-a11y
ordre: 4
titre: "Tester et maintenir l'accessibilité"
termes:
  - terme: axe-core
    definition: "Moteur d'analyse automatique (bibliothèque open source de Deque) qui inspecte un DOM rendu et retourne une liste de violations de règles d'accessibilité (WCAG, bonnes pratiques). S'utilise aussi bien dans un test de composant que dans un test de bout en bout — le moteur est le même, seul le contexte d'exécution change."
  - terme: "Test de composant (Vitest)"
    definition: "Test qui monte un composant Angular isolé via `TestBed`/`ComponentFixture` (runner par défaut d'un nouveau projet Angular 21 : Vitest) et interroge son DOM rendu — le point d'entrée le plus direct pour lancer `axe-core` sur un fragment d'interface, sans dépendre de tout le reste de l'application."
  - terme: "AxeBuilder (@axe-core/playwright)"
    definition: "Classe fournie par le paquet officiel `@axe-core/playwright` (maintenu par Deque) qui injecte `axe-core` dans une page déjà chargée par un test Playwright et exécute l'analyse avec `.analyze()`, sur une page réellement rendue par le navigateur — routeur, styles et interactions compris."
  - terme: Limites de l'analyse automatique
    definition: "Un outil comme `axe-core` détecte des violations structurelles vérifiables mécaniquement (attribut manquant, contraste insuffisant, rôle ARIA invalide…) mais ne peut pas juger la pertinence d'un texte alternatif, la cohérence de l'ordre de lecture, ni si une interaction clavier fait réellement ce qu'elle est censée faire."
  - terme: "Définition de terminé (Definition of Done)"
    definition: "Liste de critères qu'une fonctionnalité doit remplir avant d'être considérée finie. Y inclure explicitement l'accessibilité (navigation clavier testée, pas de nouvelle violation automatique, libellés vérifiés) évite qu'elle ne soit traitée comme une tâche facultative ajoutée après coup."
quiz:
  - question: "Un test de composant Vitest lance `axe-core` sur le DOM rendu d'un formulaire et n'obtient aucune violation. Que peut-on en conclure ?"
    code: |
      const fixture = TestBed.createComponent(FormulaireLivraison);
      fixture.detectChanges();
      const resultats = await axe.run(fixture.nativeElement);
      expect(resultats.violations).toEqual([]);
    choix:
      - "Le formulaire est intégralement accessible, aucun test manuel supplémentaire n'est nécessaire"
      - "Le formulaire ne présente aucune violation parmi celles qu'axe-core peut détecter mécaniquement (attributs, contrastes, rôles) — cela ne garantit pas que l'ordre de tabulation est logique, que les messages d'erreur sont compréhensibles, ou qu'un lecteur d'écran restitue un parcours cohérent"
      - "Le test ne prouve rien, car axe-core ne fonctionne pas dans un test de composant Vitest"
      - "Cela signifie que le formulaire respecte automatiquement le RGAA dans son intégralité"
    reponse: 1
    explication: "Un résultat « zéro violation » signifie seulement qu'aucune règle vérifiable mécaniquement par axe-core n'a été enfreinte — un sous-ensemble des critères d'accessibilité. La pertinence des textes, la cohérence du parcours clavier de bout en bout, ou l'expérience réelle au lecteur d'écran restent hors de portée d'un outil automatique et demandent un test manuel, complémentaire et non remplaçable."
  - question: "Quelle différence pratique y a-t-il entre lancer `axe-core` dans un test de composant Vitest et le lancer via `AxeBuilder` dans un test Playwright ?"
    choix:
      - "Aucune : les deux vérifient exactement les mêmes règles avec la même portée"
      - "Le test de composant analyse un fragment de DOM isolé (rapide, ciblé) ; le test Playwright analyse une page réellement chargée dans un navigateur, avec routeur, styles appliqués et interactions possibles — il peut détecter des problèmes qui n'existent qu'en contexte (ex. un focus mal géré après une navigation)"
      - "`AxeBuilder` ne fonctionne qu'avec Angular, pas avec les autres frameworks"
      - "Le test de composant Vitest ne peut analyser que le texte, pas les attributs ARIA"
    reponse: 1
    explication: "Un test de composant isole volontairement un fragment d'interface : rapide à exécuter, mais aveugle à tout ce qui dépend du contexte global (navigation, focus après changement de route, superposition d'éléments). Un test Playwright avec `AxeBuilder` s'exécute sur une page réellement rendue par un navigateur, ce qui permet de couvrir des scénarios que le test de composant ne voit pas — les deux sont complémentaires, pas interchangeables."
  - question: "Une équipe intègre `axe-core` en intégration continue et bloque le build sur toute violation. Six mois plus tard, l'application reste largement inutilisable au clavier sur son tunnel de commande. Quelle explication est la plus probable ?"
    choix:
      - "axe-core a un bug qui l'empêche de fonctionner en intégration continue"
      - "L'intégration continue bloque efficacement les régressions qu'axe-core sait détecter, mais des problèmes comme un ordre de tabulation incohérent ou un focus qui ne se restitue pas après une modale ne sont pas du ressort d'une analyse automatique — sans test manuel au clavier, ils passent inaperçus"
      - "Il faut nécessairement remplacer axe-core par un autre outil automatique plus complet"
      - "Le problème vient du fait que l'équipe utilise Vitest plutôt que Karma"
    reponse: 1
    explication: "L'intégration continue avec axe-core empêche les régressions détectables mécaniquement, ce qui est déjà utile. Mais l'ordre de tabulation, la restitution du focus, la cohérence d'un parcours complet au clavier sont des propriétés **fonctionnelles** qu'un outil automatique ne peut pas évaluer : elles demandent un test manuel régulier, en plus de l'automatisation — pas à sa place."
---

## Essentiel

`axe-core` est un moteur d'analyse automatique : il inspecte un DOM rendu et retourne une liste de violations de règles d'accessibilité vérifiables mécaniquement (attribut manquant, contraste insuffisant, rôle ARIA mal utilisé…). Dans une application Angular, il s'utilise à deux niveaux complémentaires : dans un **test de composant** (Vitest, le runner par défaut d'un nouveau projet Angular 21), pour vérifier rapidement un fragment d'interface isolé ; et dans un **test de bout en bout** (Playwright), pour vérifier une page réellement chargée dans un navigateur.

```ts
// Test de composant : un fragment de DOM isolé
const fixture = TestBed.createComponent(FicheProduit);
fixture.detectChanges();
const resultats = await axe.run(fixture.nativeElement);
expect(resultats.violations).toEqual([]);
```

```ts
// Test de bout en bout Playwright : une page réelle, avec @axe-core/playwright
const resultats = await new AxeBuilder({ page }).analyze();
expect(resultats.violations).toEqual([]);
```

Ce que ces tests ne détectent **pas** est au moins aussi important que ce qu'ils détectent : la pertinence d'un texte alternatif, la cohérence d'un ordre de tabulation, ou si une interaction clavier fait réellement ce qu'elle prétend faire restent hors de portée d'une analyse automatique. Un parcours complet testé au clavier reste indispensable, en complément — jamais en remplacement.

Intégrer ces tests en intégration continue empêche les **régressions** détectables mécaniquement ; ça ne dispense pas d'inclure l'accessibilité dans la définition de « terminé » d'une fonctionnalité, avec sa part de vérification manuelle.

## Détail

### Ce qu'axe-core détecte, et ce qu'il ne détecte pas

| Type de problème | Détecté automatiquement | Pourquoi |
|---|---|---|
| `<img>` sans `alt` | ✅ | Absence d'attribut, vérifiable mécaniquement |
| `alt="image123.jpg"` (texte non pertinent) | ❌ | La présence de l'attribut suffit à passer la règle ; sa pertinence demande un jugement humain |
| Contraste texte/fond insuffisant | ✅ (cas courants) | Calcul de rapport de luminosité, automatisable |
| `<div role="button">` sans gestion clavier | ✅ (rôle interactif sans `tabindex`) | Combinaison de règles structurelles vérifiables |
| Le clic clavier (Entrée/Espace) déclenche-t-il vraiment l'action attendue ? | ❌ | Comportement fonctionnel, pas structurel |
| Ordre de tabulation logique dans un parcours complet | ❌ | Dépend du sens du contenu, pas de sa structure isolée |
| Focus restitué correctement après fermeture d'une modale | ❌ (sauf test spécifique écrit à la main) | Comportement dans le temps, pas un état statique du DOM |
| `aria-label` présent mais trompeur | ❌ | Pertinence sémantique, jugement humain |

Cette liste explique pourquoi les deux approches — automatisée et manuelle — sont complémentaires, pas substituables l'une à l'autre : voir le chapitre *Tester l'accessibilité* pour la méthode manuelle générale (navigation clavier, lecteurs d'écran), ce chapitre se concentre sur leur intégration dans l'outillage de test Angular.

### Exemple 1 — Test de composant Vitest avec `axe-core`

```ts
import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { FicheProduit } from './fiche-produit';

describe('FicheProduit', () => {
  it("ne produit aucune violation détectable automatiquement", async () => {
    const fixture = TestBed.createComponent(FicheProduit);
    fixture.componentRef.setInput('produit', produitDeTest);
    fixture.detectChanges();

    const resultats = await axe.run(fixture.nativeElement);
    expect(resultats.violations).toEqual([]);
  });
});
```

`axe.run()` accepte n'importe quel nœud DOM comme contexte d'analyse — ici l'élément racine du composant monté par `TestBed`. Ce test reste rapide (pas de navigateur complet à démarrer) et ciblé sur un seul composant, ce qui en fait un bon filet de sécurité contre les régressions locales (un attribut ARIA supprimé par erreur, un contraste cassé par un changement de style).

### Exemple 2 — Test de bout en bout Playwright avec `@axe-core/playwright`

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('le tunnel de commande ne présente pas de violation critique', async ({ page }) => {
  await page.goto('/panier');
  await page.getByRole('button', { name: 'Passer commande' }).click();

  const resultats = await new AxeBuilder({ page })
    .exclude('#widget-tiers') // ex. un composant tiers hors de portée de l'équipe
    .analyze();

  expect(resultats.violations).toEqual([]);
});
```

Contrairement au test de composant, celui-ci s'exécute sur une page réellement chargée dans un navigateur piloté par Playwright : styles CSS appliqués, routeur ayant navigué, focus dans l'état où l'interaction l'a laissé — plus coûteux à exécuter, mais capable de détecter des problèmes invisibles à l'échelle d'un composant isolé.

### Exemple 3 — Ce qu'axe-core ne remplace pas : le clavier et la CI

Aucun des deux tests précédents ne remplace de parcourir le tunnel de commande **uniquement au clavier** (souris débranchée), du catalogue à la confirmation : ordre de tabulation logique, aucune action piégée, chaque changement de vue perceptible. C'est le seul moyen de vérifier que ce que les leçons précédentes mettent en place (focus après navigation, restitution après modale, formulaire relié) fonctionne bout à bout, pas juste composant par composant.

```yaml
# Extrait illustratif d'un job de CI
- name: Tests unitaires et de composants
  run: npm test
- name: Tests de bout en bout (inclut les vérifications axe-core)
  run: npx playwright test
```

Bloquer le build sur une violation `axe-core` empêche une régression détectable de passer inaperçue. Mais la **définition de terminé** d'une fonctionnalité doit aller au-delà : « le parcours a été testé au clavier », « les nouveaux libellés ont été relus pour leur pertinence », en plus de « aucune nouvelle violation automatique ». Sans ces critères explicites, l'accessibilité reste une tâche informelle, la première sacrifiée sous la pression d'une échéance.

### Maintenir l'accessibilité dans la durée

- **Composants partagés déjà accessibles** : une modale, des onglets ou un champ de formulaire construits une fois selon les leçons précédentes et réutilisés partout évitent de refaire l'audit à chaque nouvel écran — la qualité d'un composant central se propage.
- **Revue de code** : relire un changement de template avec les mêmes réflexes que pour la lisibilité du code — un `(click)` sur un élément non interactif se repère à la lecture, avant même d'exécuter un test.
- **Tests de non-régression** ciblés sur les composants les plus réutilisés : une régression y casse potentiellement toute l'application, un test dessus protège tout le reste.

### Pièges courants

> **Confondre « zéro violation axe-core » et « application accessible ».** Un tableau de bord vert en intégration continue peut coexister avec un parcours réellement impraticable au clavier — les deux mesurent des choses différentes.

> **Réserver les tests d'accessibilité aux composants nouveaux.** Une modification sans rapport apparent (un style, une classe CSS conditionnelle) peut casser un contraste ou masquer un focus visible sur un composant existant ; seuls des tests automatisés en continu couvrent ce cas.

> **Traiter l'accessibilité comme une tâche séparée, ajoutée après la fonctionnalité.** Sans critère explicite dans la définition de terminé, elle finit par ne jamais être traitée — l'inclure dès la conception coûte nettement moins cher que de la rattraper plus tard.

### À retenir

- `axe-core` s'utilise à la fois dans les tests de composants (Vitest, `TestBed`) et dans les tests de bout en bout (`@axe-core/playwright`/`AxeBuilder`) : même moteur, portées différentes et complémentaires.
- Ce qu'un outil automatique détecte reste un sous-ensemble des critères d'accessibilité : jugement sur la pertinence des textes, cohérence du parcours clavier et restitution du focus demandent un test manuel.
- Bloquer le build sur une violation automatique protège contre les régressions détectables ; ça ne remplace pas un test manuel régulier du parcours complet.
- Inclure explicitement l'accessibilité dans la définition de terminé évite qu'elle ne devienne une tâche facultative.
- Des composants partagés déjà accessibles (modale, onglets, champ de formulaire) réduisent le travail à refaire sur chaque nouvel écran qui les réutilise.

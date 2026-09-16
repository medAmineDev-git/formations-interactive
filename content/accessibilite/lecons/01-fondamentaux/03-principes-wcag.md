---
id: principes-wcag
chapitre: fondamentaux
ordre: 3
titre: "WCAG, RGAA, EN 301 549 : qui fait quoi"
termes:
  - terme: WCAG (Web Content Accessibility Guidelines)
    definition: "Recommandations internationales du W3C pour l'accessibilité du contenu web, organisées en **4 principes**, chacun décliné en **critères de succès**. Version en vigueur : **WCAG 2.2**, publiée le 5 octobre 2023 (édition mise à jour le 12 décembre 2024)."
  - terme: "Les 4 principes (POUR)"
    definition: "**P**erceptible, **U**tilisable, **C**ompréhensible, **R**obuste — le cadre organisateur de toutes les WCAG. Chaque critère de succès WCAG se rattache à l'un des quatre."
  - terme: Niveaux A / AA / AAA
    definition: "Trois niveaux d'exigence croissants des WCAG. **AA** inclut les critères A + AA et constitue le **niveau visé par la référence légale européenne** (EN 301 549). **AAA** est le niveau le plus exigeant, rarement imposé dans son ensemble."
  - terme: EN 301 549
    definition: "Norme européenne d'accessibilité des TIC (technologies de l'information et de la communication), qui incorpore par référence des critères de succès WCAG. C'est elle, et non les WCAG directement, qui constitue la **référence légale** citée par la réglementation française et européenne."
  - terme: RGAA
    definition: "Référentiel Général d'Amélioration de l'Accessibilité : la méthode de test **opérationnelle française**, qui transforme les critères de succès WCAG visés par EN 301 549 en critères de contrôle vérifiables, avec une procédure de test propre à chaque technologie. Détaillé dans le chapitre « Appliquer le RGAA »."
  - terme: Critère de succès (WCAG)
    definition: "Exigence testable des WCAG (ex. 1.1.1 Contenu non textuel), rattachée à un principe et à un niveau A/AA/AAA. Le RGAA reprend les critères de succès des niveaux A et AA et les décline en critères de contrôle et tests techniques."
  - terme: WCAG 3.0
    definition: "Future version des WCAG, encore à l'état de **Working Draft** (brouillon de travail) : pas de statut de Candidate Recommendation ni de Recommandation, aucune date cible de publication communiquée. Ne remplace pas WCAG 2.2, qui reste la version en vigueur."
quiz:
  - question: "Un champ de formulaire n'a pas de `<label>` associé, seulement un texte à côté de lui en CSS. À quel principe des WCAG ce problème se rattache-t-il principalement ?"
    choix:
      - "Robuste, parce que le HTML est syntaxiquement invalide"
      - "Perceptible, parce qu'un lecteur d'écran ne peut pas restituer un nom accessible pour ce champ à partir d'un simple texte non associé"
      - "Utilisable, parce que le champ n'est plus atteignable au clavier"
      - "Compréhensible, parce que l'utilisateur ne comprend plus à quoi sert le champ"
    reponse: 1
    explication: "Un texte simplement positionné à côté d'un champ, sans `<label for>` ni `aria-label`/`aria-labelledby`, ne devient jamais son nom accessible : le champ reste perceptible visuellement mais pas pour une technologie d'assistance — c'est le principe Perceptible qui est en cause, pas Robuste (le HTML peut être parfaitement valide) ni Utilisable (le champ reste atteignable au Tab, juste sans libellé annoncé)."
  - question: "Le critère 2.5.8 Target Size (Minimum), qui impose une taille minimale aux cibles cliquables, appartient à quelle version des WCAG ?"
    choix:
      - "Il existe depuis WCAG 2.0"
      - "Il a été ajouté par WCAG 2.1"
      - "Il a été ajouté par WCAG 2.2, au niveau AA"
      - "Il n'existe dans aucune version publiée des WCAG, seulement dans le brouillon WCAG 3.0"
    reponse: 2
    explication: "2.5.8 Target Size (Minimum) fait partie des nouveaux critères de WCAG 2.2 (publiée le 5 octobre 2023), au niveau AA, aux côtés par exemple de 2.4.11 Focus Not Obscured ou 3.3.8 Accessible Authentication. WCAG 2.2 a par ailleurs supprimé le critère 4.1.1 Parsing, devenu obsolète avec le rendu HTML5 des navigateurs modernes."
  - question: "Le RGAA (version 4.1.2) est-il aligné sur WCAG 2.2, la version des WCAG actuellement en vigueur ?"
    choix:
      - "Oui, RGAA 4.1.2 a été mis à jour pour tester les critères de WCAG 2.2 dès sa publication en 2023"
      - "Non : RGAA 4.1.2 vérifie les 50 critères de succès des niveaux A et AA de WCAG 2.1, pas de WCAG 2.2 ; un futur RGAA 5, en cours de rédaction, devrait se rapprocher davantage de WCAG 2.2"
      - "Non, le RGAA ne s'appuie sur aucune version des WCAG, uniquement sur EN 301 549"
      - "Oui, car WCAG 2.2 est rétrocompatible avec 2.1, donc tout test RGAA 2.1 reste valable tel quel pour 2.2"
    reponse: 1
    explication: "Le RGAA opérationnalise explicitement « les 50 critères de succès des niveaux A et AA de la norme internationale WCAG 2.1 », pas WCAG 2.2. RGAA 5, en cours de rédaction (publication annoncée fin 2026, pas encore publiée), est seulement annoncé comme devant se rapprocher de WCAG 2.2 — cela ne doit pas être présenté comme déjà acquis tant que RGAA 5 n'est pas publié."
---

## Essentiel

Les **WCAG** (W3C) organisent l'accessibilité web autour de **4 principes**, retenus par l'acronyme **POUR** :

| Principe | Exemple concret |
|---|---|
| **P**erceptible | Une image porteuse de sens a un texte alternatif |
| **U**tilisable | Toute action à la souris a un équivalent clavier |
| **C**ompréhensible | Les messages d'erreur de formulaire sont explicites, la navigation reste cohérente d'une page à l'autre |
| **R**obuste | Le HTML est valide, compatible avec les technologies d'assistance présentes et futures |

Chaque critère de succès WCAG se classe en niveau **A** (minimal), **AA** (A + AA — le niveau visé par la réglementation) ou **AAA** (le plus exigeant). La version en vigueur est **WCAG 2.2** (5 octobre 2023) ; **WCAG 3.0** existe mais reste un simple brouillon de travail, sans date de publication prévue.

Trois textes se répondent, chacun à son niveau :

```text
WCAG 2.2 (W3C)          → recommandations internationales, 4 principes, niveaux A/AA/AAA
        ↓ référencée par
EN 301 549 (norme UE)   → référence légale, incorpore des critères de succès WCAG
        ↓ opérationnalisée par
RGAA (méthode française) → critères de contrôle et tests techniques vérifiables
```

Ce chapitre reste au niveau des principes ; le référentiel RGAA lui-même — ses 106 critères, ses 13 thématiques, sa méthode d'audit — est détaillé dans le chapitre « Appliquer le RGAA ».

## Détail

### Pourquoi c'est utile

Distinguer ces trois textes évite deux erreurs fréquentes : croire que respecter le RGAA suffit à connaître les WCAG dans leur intégralité (le RGAA ne couvre que les niveaux A et AA), et croire que la version des WCAG « en vigueur » est automatiquement celle que teste le RGAA aujourd'hui — ce n'est actuellement pas le cas, voir plus bas.

### Exemple 1 — Les 4 principes, avec un exemple par principe

```html
<!-- Perceptible : texte alternatif sur une image porteuse de sens -->
<img src="graphique-ventes.png" alt="Ventes en hausse de 12 % au T3">

<!-- Utilisable : élément interactif natif, focusable et activable au clavier -->
<button type="submit">Valider la commande</button>

<!-- Compréhensible : message d'erreur explicite, pas seulement "champ invalide" -->
<p id="erreur-email">L'adresse e-mail doit contenir un @</p>

<!-- Robuste : rôle et état ARIA valides, cohérents avec ce que porte l'élément -->
<button aria-expanded="false" aria-controls="menu-compte">Mon compte</button>
```

### Exemple 2 — Niveaux A, AA, AAA

```text
Niveau A   : minimum incontournable (ex. 1.1.1 Contenu non textuel)
Niveau AA  : A + AA — niveau visé par EN 301 549, donc par la réglementation française
Niveau AAA : A + AA + AAA — le plus exigeant, rarement requis dans son intégralité
             (ex. contraste renforcé 7:1 au lieu de 4.5:1)
```

Le RGAA reprend les 50 critères de succès des niveaux A et AA de WCAG 2.1 ; les critères AAA existent en complément, comme liste optionnelle, sans faire partie de l'exigence de conformité RGAA standard.

### Exemple 3 — Ce que WCAG 2.2 a changé par rapport à 2.1

| Nouveau critère | Niveau |
|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA |
| 2.5.7 Dragging Movements | AA |
| 2.5.8 Target Size (Minimum) | AA |
| 3.2.6 Consistent Help | A |
| 3.3.7 Redundant Entry | A |
| 3.3.8 Accessible Authentication (Minimum) | AA |

Le critère **4.1.1 Parsing** (présent dans WCAG 2.1) a lui été **supprimé** dans WCAG 2.2, marqué « Obsolete and removed » : les navigateurs modernes rendent les erreurs de parsing HTML qu'il visait largement caduques.

### L'articulation WCAG → EN 301 549 → RGAA, en un point de vigilance

EN 301 549 est la norme européenne d'accessibilité des TIC qui constitue la référence légale : c'est elle qui incorpore par référence des critères de succès WCAG, pas les WCAG directement. Le RGAA est la méthode française qui opérationnalise ce que vise EN 301 549 pour le web, en 106 critères de contrôle testables.

Point à connaître, plutôt qu'à considérer comme un détail : la version des WCAG actuellement **testée par le RGAA 4.1.2** est **WCAG 2.1** (niveaux A et AA), pas WCAG 2.2. Une nouvelle version d'EN 301 549 (V4.1.1) a été adoptée fin août 2026 et fait passer la référence de WCAG 2.1 à WCAG 2.2 — mais elle n'est pas encore la version légalement citée en l'absence de publication au Journal officiel de l'UE, et RGAA 5, qui devrait s'en rapprocher, n'est encore que « en cours de rédaction », avec une publication annoncée pour fin 2026, pas encore publiée. Ne pas présenter le RGAA actuel comme testant WCAG 2.2, et ne pas présenter RGAA 5 comme déjà applicable.

### Pièges courants

> **Présenter le RGAA comme équivalent au niveau AAA des WCAG.** Le RGAA couvre les 50 critères de succès des niveaux A et AA de WCAG 2.1. Les critères AAA sont traités à part, comme une liste complémentaire optionnelle.

> **Affirmer que le RGAA teste déjà WCAG 2.2.** À ce jour, le RGAA 4.1.2 reste construit sur WCAG 2.1. Le rapprochement avec 2.2 est annoncé pour RGAA 5, non encore publié.

> **Confondre WCAG (recommandations W3C) et EN 301 549 (norme, référence légale).** Une réglementation française ou européenne cite EN 301 549, qui elle-même incorpore des critères WCAG — on ne cite quasiment jamais directement « les WCAG » comme base légale en France.

### À retenir

- 4 principes WCAG : Perceptible, Utilisable, Compréhensible, Robuste — chaque critère de succès s'y rattache.
- Niveau AA = niveau visé par la réglementation (A + AA) ; AAA est le niveau le plus exigeant, rarement imposé en totalité.
- WCAG 2.2 est la version en vigueur depuis octobre 2023 ; WCAG 3.0 n'est encore qu'un brouillon de travail, sans date de publication prévue.
- EN 301 549 est la référence légale qui incorpore des critères WCAG ; le RGAA est la méthode française qui les opérationnalise pour le web.
- Le RGAA actuel (4.1.2) teste les critères A/AA de WCAG **2.1**, pas 2.2 — ce détail sera précisé plus avant dans le chapitre « Appliquer le RGAA ».

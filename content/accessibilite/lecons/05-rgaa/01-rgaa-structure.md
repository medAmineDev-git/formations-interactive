---
id: rgaa-structure
chapitre: rgaa-methode
ordre: 1
titre: "Le référentiel RGAA"
termes:
  - terme: RGAA
    definition: "Référentiel Général d'Amélioration de l'Accessibilité. Méthode technique française qui opérationnalise l'accessibilité numérique pour le web. **Version en vigueur : 4.1.2**, publiée le 16 septembre 2019 et mise à jour par un erratum le 18 avril 2023 (corrections orthographiques et ajustements ponctuels de critères, sans invalider les audits déjà réalisés). Approuvé par l'arrêté du 20 septembre 2019."
  - terme: Critère de contrôle
    definition: "Exigence de contrôle du RGAA, correspondant à un point de conformité à vérifier. Le référentiel en compte **106 au total**, répartis en 13 thématiques."
  - terme: Test
    definition: "Procédure de vérification opérationnelle **propre à une technologie** (HTML, CSS, JavaScript…), associée à un critère pour réduire la marge d'interprétation. Un critère comporte en moyenne **2,5 tests**."
  - terme: Thématique
    definition: "Regroupement des 106 critères par domaine (Images, Couleurs, Formulaires…). Le RGAA compte **13 thématiques**, qui structurent le référentiel de critères et tests."
  - terme: Critère validé / non validé
    definition: "Le RGAA n'utilise **pas** les niveaux A/AA/AAA de WCAG pour juger la conformité : chaque critère est évalué de façon **binaire**. Un critère n'est validé que s'il l'est sur **toutes** les pages de l'échantillon audité ; il échoue sur une seule page suffit à le rendre non validé."
  - terme: Critère applicable
    definition: "Un critère est applicable dès lors qu'il concerne **au moins une page** de l'échantillon audité (ex. un critère sur les tableaux de données ne s'applique pas à une page qui n'en contient aucun)."
  - terme: "WCAG 2.1 (niveaux A et AA)"
    definition: "Norme internationale dont les 106 critères RGAA sont l'outillage de test français : le RGAA vise à vérifier la conformité aux **50 critères de succès des niveaux A et AA de WCAG 2.1**. Les critères AAA de WCAG sont traités à part, comme une liste complémentaire optionnelle."
  - terme: Méthode technique
    definition: "Seconde composante du RGAA, à côté du référentiel de critères et tests : elle détaille, critère par critère, les procédures de test, la méthodologie à suivre, les cas particuliers et les références vers les critères de succès WCAG correspondants."
quiz:
  - question: "Combien le RGAA 4.1.2 compte-t-il de critères de contrôle ?"
    choix:
      - "50, un par critère de succès WCAG 2.1 A/AA"
      - "106, avec en moyenne 2,5 tests par critère"
      - "13, un par thématique"
      - "258, un par test technique"
    reponse: 1
    explication: "Le RGAA transforme les 50 critères de succès WCAG 2.1 niveaux A et AA en 106 critères de contrôle, avec une moyenne de 2,5 tests techniques par critère. 13 est le nombre de thématiques, pas de critères ; le total exact de tests n'est pas publié comme tel sur les pages officielles (seule la moyenne l'est)."
  - question: "Cette page contient une image porteuse d'information, sans attribut `alt`. À quelle notion du RGAA ce problème se rattache-t-il d'abord ?"
    code: |
      <img src="graphique-ventes-2026.png">
    choix:
      - "À un test, procédure technique associée à un critère de la thématique Images"
      - "À une thématique entière à elle seule, sans critère ni test associé"
      - "À la méthode technique WCAG, qui remplace le RGAA sur ce point"
      - "À aucun critère : le RGAA ne couvre pas les attributs `alt`"
    reponse: 0
    explication: "Un attribut `alt` manquant sur une image porteuse d'information est vérifié par un test, la procédure technique concrète associée à un critère de la thématique Images. Le critère est l'exigence de contrôle ; le test est ce qui permet de la vérifier sur ce cas HTML précis."
  - question: "Quelle affirmation décrit correctement la différence entre un critère et un test dans le RGAA ?"
    choix:
      - "Un critère est l'exigence de contrôle à vérifier ; un test est la procédure de vérification technique associée, propre à une technologie"
      - "Un test regroupe plusieurs critères ; un critère est une simple sous-étape d'un test"
      - "Les deux termes sont strictement synonymes dans la documentation officielle du RGAA"
      - "Un critère s'applique au code source, un test s'applique uniquement au rendu visuel"
    reponse: 0
    explication: "Le critère est le point de conformité à vérifier (106 au total) ; le test est la procédure opérationnelle, propre à une technologie donnée, qui permet de vérifier qu'il est respecté « afin de réduire la marge d'interprétation ». Un critère peut comporter plusieurs tests (2,5 en moyenne)."
---

## Essentiel

Le **RGAA** (Référentiel Général d'Amélioration de l'Accessibilité) est la méthode technique française d'accessibilité numérique. La version actuellement en vigueur est la **4.1.2**, publiée le 16 septembre 2019 et mise à jour par un erratum le 18 avril 2023 — un correctif qui n'invalide pas les audits déjà réalisés. Sa base juridique est l'arrêté du 20 septembre 2019.

Le RGAA se compose de deux éléments : un **référentiel de critères et tests**, et une **méthode technique** qui détaille, pour chaque critère, la procédure de test, la méthodologie, les cas particuliers et les références WCAG correspondantes.

Le référentiel compte **106 critères de contrôle**, avec en moyenne **2,5 tests** par critère, répartis en **13 thématiques** : Images, Cadres, Couleurs, Multimédia, Tableaux, Liens, Scripts, Éléments obligatoires, Structuration de l'information, Présentation de l'information, Formulaires, Navigation, Consultation.

Un **critère** est l'exigence à vérifier ; un **test** est la procédure opérationnelle, propre à une technologie (HTML, CSS, JavaScript…), qui permet de la vérifier concrètement. Contrairement à WCAG, le RGAA n'utilise pas les niveaux A/AA/AAA : chaque critère est jugé de façon binaire, validé ou non validé. Les 106 critères correspondent aux 50 critères de succès WCAG 2.1 niveaux A et AA.

Une version 5 du RGAA est en cours de rédaction, avec une publication annoncée pour fin 2026 : elle n'est **pas encore applicable**.

## Détail

### Comment ça marche

Le RGAA n'invente pas de nouvelles règles d'accessibilité : il prend les 50 critères de succès des niveaux A et AA de WCAG 2.1 — eux-mêmes repris dans la norme européenne EN 301 549 — et les traduit en 106 critères de contrôle, chacun accompagné d'une ou plusieurs procédures de test précises. L'objectif affiché est de « réduire la marge d'interprétation quant au respect des normes d'accessibilité » : là où WCAG énonce un principe général, le RGAA dit exactement comment le vérifier sur du code réel.

Sa portée a une limite explicite : le RGAA 4.1(.2) ne couvre pas les applications mobiles natives, les progiciels, ni le mobilier urbain numérique. Pour ces périmètres, la vérification se fait directement contre la norme EN 301 549.

### Exemple 1 — Les 13 thématiques

Les critères sont regroupés par thématique, ce qui permet de s'orienter rapidement vers la bonne famille de critères face à un problème concret :

| Thématique | Exemple de problème typique |
|---|---|
| 1. Images | Texte alternatif manquant ou non pertinent |
| 2. Cadres | `<iframe>` sans titre |
| 3. Couleurs | Information donnée uniquement par la couleur |
| 4. Multimédia | Vidéo sans sous-titres |
| 5. Tableaux | Tableau de données sans en-têtes associés |
| 6. Liens | Intitulé de lien non explicite hors contexte |
| 7. Scripts | Composant JavaScript inutilisable au clavier |
| 8. Éléments obligatoires | `<title>` de document manquant |
| 9. Structuration de l'information | Hiérarchie de titres incohérente |
| 10. Présentation de l'information | Contraste de texte insuffisant |
| 11. Formulaires | Champ sans étiquette associée |
| 12. Navigation | Absence de lien d'évitement |
| 13. Consultation | Document PDF ouvert sans avertissement |

Cette répartition est le point d'entrée le plus rapide quand on part d'un problème observé plutôt que d'un numéro de critère : on identifie d'abord la thématique concernée, puis on descend vers le ou les critères précis.

### Exemple 2 — Lire une fiche de critère

Chaque critère du RGAA est documenté dans la méthode technique par une fiche qui suit une structure constante : l'énoncé du critère lui-même, une ou plusieurs **procédures de test**, des indications de **méthode** pour les mener, des **cas particuliers** (situations qui ne rentrent pas dans le cas général), et des **références WCAG** qui renvoient vers le ou les critères de succès correspondants. C'est cette fiche, et non le seul énoncé du critère, qu'il faut lire avant de trancher entre « validé » et « non validé » : un cas particulier mal identifié est une source fréquente d'erreur d'audit.

### Exemple 3 — Un même problème, critère et test

```
Problème observé : un bouton "Rechercher" n'est représenté que par une icône,
sans texte visible.

Thématique concernée : 6. Liens (ou 7. Scripts selon l'implémentation du bouton)
Critère : le bouton doit avoir un nom accessible pertinent.
Test associé : vérifier, via l'arbre d'accessibilité ou le code source,
qu'un nom accessible (texte visible, attribut, ou contenu équivalent)
est bien exposé aux technologies d'assistance.
```

Le critère pose l'exigence ; le test dit comment la vérifier sur ce cas HTML précis. Sur un bouton implémenté différemment (`<button>` natif, `<div role="button">`, composant de framework), le test à appliquer change, mais le critère reste le même.

### Pièges courants

> **Confondre thématique et critère.** Une thématique (« Formulaires ») n'est pas elle-même un critère : c'est un regroupement. Citer « le critère Formulaires » dans un audit n'a pas de sens ; il faut identifier le critère précis à l'intérieur de la thématique.

> **Considérer WCAG et RGAA comme deux référentiels concurrents.** Le RGAA n'ajoute pas d'exigences par rapport à WCAG 2.1 A/AA : il les rend testables sur du code réel. Un site conforme au RGAA vise donc la conformité aux mêmes 50 critères de succès, avec une méthode de vérification plus précise.

> **Présenter RGAA 5 comme déjà applicable.** Une version 5 est en cours de rédaction, publication annoncée pour fin 2026, mais elle n'est pas publiée à ce jour : la version en vigueur reste la 4.1.2, et les travaux de mise en accessibilité en cours ne doivent pas être suspendus dans l'attente.

### À retenir

- RGAA 4.1.2 (16 septembre 2019, erratum du 18 avril 2023) est la version en vigueur ; RGAA 5 est en préparation mais pas encore publié.
- 106 critères de contrôle, 13 thématiques, moyenne de 2,5 tests par critère.
- Critère = exigence à vérifier ; test = procédure technique de vérification associée.
- Le RGAA est binaire (validé / non validé par critère), sans niveaux A/AA/AAA — il opérationnalise les 50 critères de succès WCAG 2.1 A/AA.
- Face à un problème concret, partir de la thématique concernée pour retrouver rapidement le bon critère, puis lire la fiche complète (test, méthode, cas particuliers) avant de conclure.

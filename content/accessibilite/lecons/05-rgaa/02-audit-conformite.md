---
id: audit-conformite
chapitre: rgaa-methode
ordre: 2
titre: "Auditer un site"
termes:
  - terme: Échantillon de pages
    definition: "Ensemble des pages sur lesquelles porte l'audit. Le RGAA ne fixe pas de nombre de pages imposé : la règle officielle est que « la sélection des pages auditées ainsi que leur nombre doivent être représentatifs du service de communication au public en ligne »."
  - terme: Statut d'un critère
    definition: "Résultat de la vérification d'un critère sur l'échantillon : **validé** (respecté sur toutes les pages où il s'applique), **non validé** (échoue sur au moins une page), ou **non applicable** (ne concerne aucune page de l'échantillon, donc exclu du calcul)."
  - terme: Taux de conformité d'une page
    definition: "Nombre de critères **validés** divisé par le nombre de critères **applicables** sur cette page, multiplié par 100. Les critères non applicables ne comptent pas dans le calcul."
  - terme: Taux moyen du site
    definition: "Moyenne des taux de conformité de chaque page de l'échantillon audité — pas un recalcul global sur l'ensemble des critères de toutes les pages réunies."
  - terme: Totalement conforme
    definition: "Statut atteint uniquement quand **tous** les critères de contrôle du RGAA applicables sont respectés, soit 100 %. Il n'existe pas de palier de tolérance intermédiaire (comme 95 %) sur le référentiel officiel actuel."
  - terme: Partiellement conforme
    definition: "Statut atteint dès lors qu'**au moins 50 %** des critères de contrôle applicables sont respectés, sans atteindre 100 %."
  - terme: Non conforme
    definition: "Statut appliqué quand **moins de 50 %** des critères sont respectés, **ou** quand aucun résultat d'audit en cours de validité n'existe pour le site."
  - terme: Charge disproportionnée
    definition: "Dérogation applicable au cas par cas, par fonctionnalité ou contenu, quand la mise en accessibilité serait déraisonnable ou compromettrait la mission de service public ou la viabilité économique de l'organisme. Doit être documentée dans la déclaration d'accessibilité (justification, durée, alternative accessible si possible)."
quiz:
  - question: "Sur une page auditée, 40 critères RGAA sont applicables. 32 sont validés, 8 ne le sont pas. Quel est le taux de conformité de cette page ?"
    code: |
      Critères applicables : 40
      Critères validés     : 32
      Critères non validés : 8
    choix:
      - "80 %"
      - "32 %"
      - "92 %"
      - "Impossible à calculer sans connaître les 106 critères du référentiel"
    reponse: 0
    explication: "Le taux de conformité d'une page se calcule en divisant les critères validés par les critères applicables : 32 ÷ 40 = 0,8, soit 80 %. Les critères non applicables à cette page (les 66 restants sur 106) n'entrent pas dans le calcul, il n'est donc pas nécessaire de les connaître."
  - question: "Un site affiche un taux moyen de 96 % sur son échantillon de pages. Quel statut de conformité peut-il afficher ?"
    choix:
      - "Totalement conforme, puisque 96 % dépasse le seuil de tolérance de 95 %"
      - "Partiellement conforme : seul 100 % permet d'afficher « totalement conforme », sans palier intermédiaire à 95 %"
      - "Non conforme, car le seuil de totale conformité est fixé à 99 %"
      - "Le statut ne dépend pas du taux, mais uniquement de la date du dernier audit"
    reponse: 1
    explication: "Le référentiel officiel ne prévoit aucun palier de tolérance à 95 % : la conformité totale exige que 100 % des critères applicables soient respectés. À 96 %, le site reste « partiellement conforme » (le seuil pour ce statut est d'au moins 50 %), même très proche de la conformité totale."
  - question: "Une page contient un contenu vidéo préenregistré publié avant le 23 septembre 2020. Que dit le RGAA sur ce cas ?"
    choix:
      - "Il peut relever d'une dérogation liée à son ancienneté, distincte de la charge disproportionnée"
      - "Il doit obligatoirement être retiré du site avant tout audit"
      - "Il compte automatiquement comme critère non validé, sans dérogation possible"
      - "Il n'a aucun statut particulier : les dérogations ne s'appliquent qu'aux documents bureautiques"
    reponse: 0
    explication: "Le RGAA prévoit plusieurs dérogations liées à des dates de publication : les contenus audio et vidéo préenregistrés publiés avant le 23 septembre 2020 en bénéficient, tout comme les formats bureautiques publiés avant le 23 septembre 2018 ou les contenus archivés non modifiés depuis le 23 septembre 2019. Ces dérogations sont distinctes de la charge disproportionnée, qui s'apprécie au cas par cas."
---

## Essentiel

Un audit RGAA se déroule sur un **échantillon de pages**, pas sur le site entier. Le référentiel ne fixe pas de nombre de pages imposé : la règle officielle demande que la sélection soit **représentative** du service. Doivent y figurer, quand elles existent : la page d'accueil, une page de contact, les mentions légales, la page « accessibilité », le plan du site, une page d'aide, une page d'authentification, au moins une page représentative par type de service, des documents téléchargeables représentatifs, l'intégralité des pages d'un même processus (un tunnel de formulaire, par exemple), des pages représentant des types de contenus distincts, et des pages tirées au hasard représentant au moins 10 % des pages déjà sélectionnées.

Pour chaque page, chaque critère applicable est vérifié via ses tests. Un critère a l'un de ces statuts : **validé** (respecté sur toutes les pages où il s'applique), **non validé** (échoue sur au moins une page), ou **non applicable** (aucune page concernée — exclu du calcul).

**Taux de conformité d'une page = critères validés ÷ critères applicables × 100.** Le taux moyen du site est la moyenne des taux de chaque page de l'échantillon.

Trois statuts, sans palier intermédiaire caché : **totalement conforme** (100 % des critères respectés), **partiellement conforme** (au moins 50 %), **non conforme** (moins de 50 %, ou aucun audit en cours de validité).

## Détail

### Pourquoi c'est utile

Le calcul du taux de conformité paraît simple, mais deux erreurs y sont fréquentes : oublier que les critères non applicables sortent du dénominateur, et confondre le taux moyen du site avec un taux global recalculé sur l'ensemble des critères de toutes les pages réunies. Ce sont deux calculs différents, et seul le second (moyenne des taux page par page) est la méthode officielle.

### Exemple 1 — Du critère non applicable au taux

```
Page "Contact" : 106 critères du référentiel, dont seulement 60 sont
applicables (pas de tableau de données, pas de contenu multimédia sur
cette page → certains critères ne s'appliquent pas).

Sur ces 60 critères applicables : 54 validés, 6 non validés.

Taux de conformité de la page = 54 ÷ 60 × 100 = 90 %
```

Les 46 critères non applicables (sur les 106 du référentiel) ne comptent ni au numérateur ni au dénominateur.

### Exemple 2 — Le taux moyen du site n'est pas un taux global

```
Page A : 90 % de conformité (54 validés / 60 applicables)
Page B : 70 % de conformité (28 validés / 40 applicables)
Page C : 100 % de conformité (35 validés / 35 applicables)

Taux moyen du site = (90 + 70 + 100) ÷ 3 = 86,7 %
```

Ce n'est **pas** la même chose que de sommer tous les critères validés et applicables des trois pages pour en refaire une seule division : la méthode officielle moyenne les taux par page, elle ne les fusionne pas.

### Exemple 3 — Un critère non validé à cause d'une seule page

```
Critère "Formulaire : chaque champ a-t-il une étiquette associée ?"

Page "Contact"      : validé
Page "Inscription"  : validé
Page "Recherche"    : non validé (un champ sans étiquette)

→ Statut du critère sur le site : NON VALIDÉ
```

Il suffit qu'un critère échoue sur une seule page de l'échantillon pour qu'il soit considéré non validé sur l'ensemble du site, même s'il est correctement traité ailleurs.

### Dérogations et contenus exemptés

| Dérogation | Condition |
|---|---|
| Charge disproportionnée | Cas par cas, si la mise en accessibilité est déraisonnable ou menace la mission de service public / la viabilité économique de l'organisme ; à documenter dans la déclaration |
| Contenus de tiers | Ni financés ni développés par l'organisme, et non sous son contrôle |
| Formats bureautiques | Publiés avant le 23 septembre 2018, sauf s'ils sont nécessaires à une démarche administrative en cours |
| Contenus audio et vidéo préenregistrés | Publiés avant le 23 septembre 2020 |
| Intranets et extranets | Publiés avant le 23 septembre 2019, jusqu'à une révision substantielle |
| Contenus archivés | Ni nécessaires à une démarche administrative en cours, ni modifiés après le 23 septembre 2019 |

Ces dates correspondent aux échéances de transposition de la directive européenne (UE) 2016/2102 en droit français.

### Restitution des résultats et priorisation

Un rapport d'audit qui se contente de lister des numéros de critères non validés est peu exploitable pour une équipe de développement. Restituer les résultats par **impact utilisateur réel** (« un utilisateur de lecteur d'écran ne peut pas soumettre ce formulaire » plutôt que « critère 11.x non validé ») aide à prioriser les corrections sur ce qui bloque effectivement un parcours, avant les points plus mineurs. Les critères qui échouent sur un composant réutilisé sur tout le site (un menu de navigation, un pied de page) ont aussi un effet de levier plus important qu'un critère isolé sur une seule page secondaire.

### Auditer en cours de projet

Attendre la fin d'un projet pour auditer revient à découvrir des non-conformités structurelles (un design system entier sans focus visible, par exemple) au moment où elles sont les plus coûteuses à corriger. Vérifier des critères RGAA dès les maquettes et au fil du développement — plutôt que dans un audit unique final — permet de corriger les problèmes pendant qu'ils sont encore isolés à un composant, avant qu'ils ne se propagent à toutes les pages qui le réutilisent.

### Pièges courants

> **Croire à un palier de tolérance à 95 %.** Ce chiffre circule parfois de façon informelle, mais il ne correspond à aucun seuil officiel actuel : la conformité totale exige 100 % des critères respectés, sans marge.

> **Compter les critères non applicables comme des critères respectés.** Un critère non applicable sort entièrement du calcul (ni au numérateur ni au dénominateur) — il ne doit pas être compté comme validé pour gonfler artificiellement un taux.

> **Fusionner les pages avant de calculer le taux.** Le taux moyen du site s'obtient en moyennant les taux calculés page par page, pas en additionnant tous les critères validés et applicables de toutes les pages pour faire une seule division globale.

### À retenir

- L'échantillon doit être représentatif du service ; le RGAA n'impose pas de nombre de pages fixe, mais des règles de composition (pages obligatoires, pages par type de service, tirage aléatoire d'au moins 10 %).
- Un critère est validé seulement s'il l'est sur toutes les pages où il s'applique ; une seule page en échec suffit à le rendre non validé sur tout le site.
- Taux d'une page = validés ÷ applicables × 100 ; taux du site = moyenne des taux de chaque page.
- Totalement conforme = 100 % ; partiellement conforme = au moins 50 % ; non conforme = moins de 50 % ou absence d'audit en cours de validité — sans palier à 95 %.
- Prioriser les corrections par impact utilisateur réel et auditer en continu, pas seulement en fin de projet.

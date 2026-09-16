---
id: cadre-legal
chapitre: fondamentaux
ordre: 2
titre: Le cadre légal en France
termes:
  - terme: Article 47 (loi n° 2005-102)
    definition: "Article de la loi du 11 février 2005 qui fonde l'obligation d'accessibilité numérique en France. Modifié par la loi de 2018 (transposition de la directive (UE) 2016/2102) puis par l'ordonnance n° 2023-859 du 6 septembre 2023 (transposition de l'EAA), il fixe qui est concerné et quelles obligations déclaratives s'appliquent."
  - terme: Directive (UE) 2016/2102
    definition: "Directive européenne sur l'accessibilité des sites internet et applications mobiles du **secteur public**. Transposée en droit français par la loi n° 2018-771 du 5 septembre 2018 (art. 80), qui a étendu l'article 47 aux applications mobiles et introduit le seuil privé de 250 M€."
  - terme: European Accessibility Act (EAA)
    definition: "Directive (UE) 2019/882, qui étend l'obligation d'accessibilité à des **secteurs privés B2C précis** (e-commerce, banque, transport, communications électroniques, médias audiovisuels…), indépendamment de la taille de l'entreprise. Délai de transposition : 28 juin 2022. Date d'application aux opérateurs économiques : **28 juin 2025**."
  - terme: Seuil des 250 millions d'euros
    definition: "Seuil qui rend une entreprise privée soumise à l'obligation de l'article 47 (indépendamment de son secteur), calculé comme la **moyenne du chiffre d'affaires annuel réalisé en France sur les trois derniers exercices clos**. Base légale : décret n° 2019-768 du 24 juillet 2019, art. 2."
  - terme: Déclaration d'accessibilité
    definition: "Document obligatoire, publié sur une page dédiée accessible depuis toutes les pages du site, qui indique le statut de conformité (totalement / partiellement / non conforme), la liste des contenus non accessibles avec leurs motifs, les alternatives proposées et les voies de recours (dont le Défenseur des droits)."
  - terme: Schéma pluriannuel et plan d'action annuel
    definition: "Le schéma pluriannuel de mise en accessibilité couvre **au maximum 3 ans** ; le plan d'action annuel en décline la mise en œuvre année par année. Les deux sont publiés et liés depuis la déclaration d'accessibilité."
  - terme: ARCOM
    definition: "Autorité de régulation de la communication audiovisuelle et numérique. Compétente sur l'obligation de l'article 47 (art. 47-1 de la loi 2005-102) : elle peut mettre en demeure une entité, puis prononcer une sanction pécuniaire à défaut de mise en conformité."
quiz:
  - question: "Une page d'accueil affiche ce pied de page. Qu'est-ce qui ne respecte pas les obligations déclaratives françaises ?"
    code: |
      <footer>
        <p>Accessibilité : non applicable</p>
      </footer>
    choix:
      - "Rien : « non applicable » est l'une des trois mentions officielles prévues par le décret n° 2019-768"
      - "La mention doit être l'une de « totalement conforme », « partiellement conforme » ou « non conforme » — « non applicable » n'est pas une mention valable, et elle doit renvoyer vers la déclaration d'accessibilité complète"
      - "La mention devrait être dans le `<head>`, pas dans le `<footer>`"
      - "Rien : seule l'existence d'une mention compte, son contenu est libre"
    reponse: 1
    explication: "L'article 47-IV de la loi 2005-102 et le décret n° 2019-768 (art. 6-IV) imposent l'une de trois mentions précises en page d'accueil : « totalement conforme », « partiellement conforme » ou « non conforme ». « Non applicable » n'existe pas dans ce référentiel — toute entité concernée doit se positionner sur l'une des trois, avec un lien vers sa déclaration d'accessibilité complète."
  - question: "Quel seuil rend une entreprise privée soumise à l'obligation de l'article 47, indépendamment de son secteur d'activité ?"
    choix:
      - "10 salariés"
      - "2 millions d'euros de chiffre d'affaires annuel"
      - "250 millions d'euros de chiffre d'affaires, en moyenne sur les trois derniers exercices clos réalisés en France"
      - "500 salariés, comme pour le bilan social"
    reponse: 2
    explication: "Le décret n° 2019-768 (art. 2) fixe ce seuil à 250 M€ de chiffre d'affaires, calculé comme une moyenne sur les trois derniers exercices clos. Attention à ne pas confondre ce régime, valable pour tout secteur, avec celui de l'EAA (décret n° 2023-931) qui vise des secteurs B2C précis indépendamment de la taille de l'entreprise, sous réserve d'une exemption « micro-entreprise »."
  - question: "Une collectivité reçoit une mise en demeure de l'ARCOM pour son site non conforme, et ne régularise pas la situation. Que peut-il se passer ensuite, dans le régime en vigueur depuis le 27 août 2026 ?"
    choix:
      - "Une amende de 20 000 € prononcée par le ministre chargé des personnes handicapées"
      - "Une sanction pécuniaire de l'ARCOM pouvant aller jusqu'à 50 000 € pour non-respect de l'obligation d'accessibilité elle-même, renouvelable si le manquement persiste plus de 6 mois après une première sanction"
      - "Aucune sanction financière n'est prévue en droit français pour le secteur public"
      - "Une amende automatique de 7 500 € appliquée sans mise en demeure préalable"
    reponse: 1
    explication: "Le régime des amendes de 2 000 € / 20 000 € prononcées par le ministre (ancien art. 8 du décret n° 2019-768) a été abrogé par le décret n° 2026-816 du 24 août 2026. Depuis le 8 septembre 2023 (ordonnance n° 2023-859), l'article 47-1 confie ce pouvoir à l'ARCOM, avec un plafond de 50 000 € pour l'obligation d'accessibilité elle-même et 25 000 € pour les obligations déclaratives, renouvelable après 6 mois de manquement persistant."
---

## Essentiel

L'obligation d'accessibilité numérique en France repose sur l'**article 47 de la loi n° 2005-102** du 11 février 2005, modifié à plusieurs reprises : par la loi de 2018 qui a transposé la **directive (UE) 2016/2102** (secteur public), puis par l'**ordonnance n° 2023-859** du 6 septembre 2023 qui a transposé l'**European Accessibility Act** (directive (UE) 2019/882, dite EAA).

Deux régimes coexistent, sans s'exclure :

- **Article 47 / seuil 250 M€** : s'applique aux personnes morales de droit public, à leurs délégataires de service public, et aux entreprises privées dont le chiffre d'affaires moyen en France sur trois exercices dépasse **250 000 000 €**, quel que soit leur secteur.
- **EAA** : s'applique à des secteurs privés B2C précis (e-commerce, banque, transport, communications électroniques, médias audiovisuels, liseuses…) **indépendamment de la taille de l'entreprise**, sous réserve d'une exemption « micro-entreprise ». Applicable aux opérateurs économiques depuis le **28 juin 2025**.

Toute entité concernée par l'article 47 doit publier une **déclaration d'accessibilité**, un **schéma pluriannuel** (3 ans maximum) et un **plan d'action annuel**, ainsi qu'une mention de conformité en page d'accueil (« totalement conforme », « partiellement conforme » ou « non conforme »).

```html
<footer>
  <a href="/accessibilite">Accessibilité : partiellement conforme</a>
</footer>
```

L'**ARCOM** contrôle le respect de l'article 47 et peut prononcer des sanctions pécuniaires en cas de manquement persistant après mise en demeure.

## Détail

### Comment ça marche

```text
2005 : Loi n° 2005-102, art. 47              → obligation d'origine (secteur public)
2016 : Directive (UE) 2016/2102               → accessibilité web/mobile du secteur public
2018 : Loi n° 2018-771, art. 80               → transpose 2016/2102, étend l'art. 47,
                                                  introduit le seuil privé 250 M€
2019 : Décret n° 2019-768                      → fixe le seuil (art. 2), le contenu
                                                  de la déclaration (art. 6)
2019 : Arrêté du 20 septembre 2019             → approuve le RGAA
2019 : Directive (UE) 2019/882 (EAA)           → délai de transposition 28 juin 2022
2023 : Ordonnance n° 2023-859                  → transpose l'EAA (services publics),
                                                  réécrit l'art. 47, crée l'art. 47-1
2023 : Décret n° 2023-931 + arrêté             → transpose l'EAA (produits/services privés)
2025 : 28 juin                                 → date d'application de l'EAA aux
                                                  opérateurs économiques
2026 : Décret n° 2026-816 (27 août)            → abroge l'ancien régime de sanctions
```

### Exemple 1 — Qui est concerné, en pratique

L'article 47-I liste quatre catégories : les personnes morales de droit public, leurs délégataires de mission de service public (ou entités créées pour des besoins d'intérêt général financées/contrôlées majoritairement par une entité publique), les entités créées par les deux catégories précédentes pour le même type de besoin, et les entreprises dépassant le seuil de chiffre d'affaires. Sont exclus les organismes privés à but non lucratif qui ne fournissent ni service public essentiel ni service répondant spécifiquement aux besoins des personnes handicapées.

```text
Une mairie                              → concernée (personne morale de droit public)
Une société de VTC, CA France 400 M€    → concernée (seuil de 250 M€ dépassé)
Un site e-commerce de 15 salariés,
CA France 40 M€, vendant en ligne       → concerné par l'EAA (secteur e-commerce),
                                            pas par le seuil de 250 M€
Une association caritative sans mission
de service public déléguée              → en principe hors champ (organisme privé
                                            à but non lucratif)
```

### Exemple 2 — Le contenu de la déclaration d'accessibilité

La déclaration, publiée sur une page dédiée et accessible depuis toutes les pages du site, doit indiquer :

- le statut de conformité (totalement / partiellement / non conforme) ;
- la liste des contenus non accessibles, avec leur motif (non-conformité, charge disproportionnée, ou hors champ) et l'alternative accessible proposée quand elle existe ;
- les modalités permettant à un usager de signaler une difficulté d'accès ;
- les voies de recours, dont le Défenseur des droits.

Pour une application mobile, la déclaration peut être publiée sur le site de l'éditeur ou dans la fiche de téléchargement de l'application elle-même.

### Exemple 3 — Deux régimes privés distincts

| | Article 47 / seuil 250 M€ | European Accessibility Act |
|---|---|---|
| Critère d'application | CA moyen France > 250 M€ sur 3 exercices | Secteur B2C précis (e-commerce, banque, transport…) |
| Taille de l'entreprise | Indifférente une fois le seuil dépassé | Indifférente, sauf exemption « micro-entreprise » |
| Secteur d'activité | Tous secteurs | Secteurs listés uniquement |
| Base légale | Décret n° 2019-768, art. 2 | Décret n° 2023-931 |

Une même entreprise peut relever des deux régimes à la fois si elle dépasse le seuil **et** opère dans un secteur couvert par l'EAA — les deux obligations s'additionnent, elles ne se substituent pas l'une à l'autre.

### Pièges courants

> **Citer encore les amendes de 2 000 € et 20 000 €.** Ce régime, qui existait à l'article 8 du décret n° 2019-768, a été **abrogé** par le décret n° 2026-816 du 24 août 2026 (en vigueur depuis le 27 août 2026). Le régime actuel, porté par l'ARCOM (art. 47-1 de la loi 2005-102), prévoit des plafonds de 50 000 € (obligation d'accessibilité) et 25 000 € (obligations déclaratives).

> **Confondre le seuil de 250 M€ avec le champ d'application de l'EAA.** Ce sont deux régimes cumulatifs et non exclusifs : une entreprise peut être soumise à l'un, à l'autre, aux deux, ou à aucun des deux selon son secteur et son chiffre d'affaires.

> **Traiter le RGAA comme le seul texte à connaître.** Le RGAA (référentiel approuvé par l'arrêté du 20 septembre 2019) est l'outil méthodologique qui sert à évaluer la conformité web à l'obligation de l'article 47 ; l'EAA repose sur un décret et un arrêté distincts, avec ses propres exigences techniques et son propre régime de sanctions (contravention de 5ᵉ classe).

### À retenir

- L'article 47 de la loi de 2005 est la base légale ; il a été réécrit en 2018 (directive 2016/2102) puis en 2023 (EAA).
- Deux régimes privés cumulatifs : le seuil de 250 M€ (art. 47, tout secteur) et l'EAA (secteurs B2C précis, indépendant de la taille, applicable depuis le 28 juin 2025).
- Quatre documents obligatoires : déclaration d'accessibilité, schéma pluriannuel (3 ans max), plan d'action annuel, mention de conformité en page d'accueil.
- L'ARCOM contrôle l'obligation de l'article 47 : jusqu'à 50 000 € pour le fond, 25 000 € pour le déclaratif — l'ancien régime à 2 000 €/20 000 € est obsolète depuis le 27 août 2026.
- Le RGAA (chapitre suivant : « Appliquer le RGAA ») est la méthode qui opérationnalise cette obligation pour le web ; ce n'est qu'un des deux textes à connaître, pas l'unique cadre légal.

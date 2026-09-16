# Accessibilité numérique en France — Fiche de référence factuelle

**Date de rédaction : 16 septembre 2026.** Ce document est une fiche de référence à l'usage de rédacteurs de contenu pédagogique. Chaque affirmation datée ou chiffrée a été vérifiée sur une source officielle ; toute information qui n'a pas pu être confirmée est signalée explicitement dans le corps du texte et récapitulée en fin de document (section « Points non confirmés »). Ne rien affirmer au-delà de ce qui est écrit ici sans revérifier la source.

---

## 1. RGAA — Référentiel Général d'Amélioration de l'Accessibilité

### Version en vigueur

- **Version actuellement en vigueur : RGAA 4.1.2**, publiée le **16 septembre 2019** et mise à jour le **18 avril 2023** (mention affichée sur la page d'accueil officielle).
- La mise à jour du 18 avril 2023 est un **erratum** de la version 4.1 : corrections orthographiques/typographiques et ajustements des critères 1.1.5, 1.6, 4.5.1, 4.5.2, 5.8.1, 10.1.1, 10.1.2, 10.7.1, 10.11, 11.2, 12.8, 13.3.1 et du glossaire. Le texte officiel précise : *« Ils n'invalident pas les audits déjà réalisés. »*
- Base juridique : **Arrêté du 20 septembre 2019** portant référentiel général d'amélioration de l'accessibilité (RGAA), toujours en vigueur au 16 septembre 2026.
- **RGAA 5 est en cours de rédaction**, publication annoncée pour **fin 2026** — donc *pas encore publiée* à la date de rédaction de cette fiche. Le site officiel précise que cette échéance *« ne remet pas en cause la pertinence des travaux de mise en accessibilité en cours ou à venir : ils ne doivent en aucun cas être suspendus ou reportés. »* Ne pas présenter RGAA 5 comme une version applicable tant qu'elle n'est pas publiée.

Sources : https://accessibilite.numerique.gouv.fr/ · https://accessibilite.numerique.gouv.fr/ressources/notes-de-revision-4-1-2/ · https://www.legifrance.gouv.fr/loda/id/JORFTEXT000039120412

### Nombre de critères et de tests

- **106 critères de contrôle**, formulation officielle répétée : *« 106 critères de contrôle RGAA incluant une moyenne de 2,5 tests par critère. »*
- Un **total exact du nombre de tests n'est pas affiché comme tel sur les pages officielles consultées** (seule la moyenne de 2,5 tests/critère est publiée). Des sources tierces avancent un total de 258 tests, mais ce chiffre n'a pas été retrouvé sur une page gouvernementale officielle — à traiter comme non confirmé plutôt qu'à citer comme un fait.

Sources : https://accessibilite.numerique.gouv.fr/methode/introduction/ · https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/

### Les 13 thématiques

1. Images
2. Cadres
3. Couleurs
4. Multimédia
5. Tableaux
6. Liens
7. Scripts
8. Éléments obligatoires
9. Structuration de l'information
10. Présentation de l'information
11. Formulaires
12. Navigation
13. Consultation

Source : https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/

### Critère vs test

Il n'existe pas de définition « glossaire » formelle et littérale distinguant ces deux termes sur la page officielle du glossaire. Ce que la méthode officielle établit clairement :

- Un **critère** est l'exigence de contrôle elle-même (106 au total), correspondant à un point de conformité à vérifier.
- Un **test** est une **procédure de vérification opérationnelle, propre à une technologie** (HTML, CSS, JavaScript…), associée à un critère : *« Pour chacun des tests d'un critère correspond une procédure de test. »* Les tests existent *« pour vérifier que le critère est respecté afin de réduire la marge d'interprétation. »*

Sources : https://accessibilite.numerique.gouv.fr/ressources/methodologie-de-test/ · https://accessibilite.numerique.gouv.fr/methode/introduction/

### Niveaux de conformité

Le RGAA **n'utilise pas les niveaux A/AA/AAA du WCAG** pour la conformité aux 106 critères : chaque critère est évalué de façon **binaire** (validé / non validé).

- Un critère est **validé** seulement s'il l'est sur **toutes** les pages de l'échantillon ; s'il échoue sur une seule page de l'échantillon, il n'est pas considéré comme valide.
- Un critère est **applicable** s'il concerne au moins une page de l'échantillon.
- Les 106 critères correspondent aux **50 critères de succès des niveaux A et AA de WCAG 2.1** : *« vérifier qu'une page web est conforme aux 50 critères de succès des niveaux A et AA de la norme internationale WCAG 2.1. »*
- Les critères **AAA** de WCAG 2.1 sont traités à part, comme une liste complémentaire optionnelle et non comme une exigence de conformité RGAA standard.

Sources : https://accessibilite.numerique.gouv.fr/obligations/evaluation-conformite/ · https://accessibilite.numerique.gouv.fr/ressources/criteres-aaa/

### Ce que le RGAA ajoute par rapport à WCAG

- Le RGAA est la **méthode de test opérationnelle française** des 50 critères de succès A/AA de WCAG 2.1, eux-mêmes repris dans la norme européenne EN 301 549 (référence légale des obligations françaises).
- Il transforme ces 50 critères de succès en **106 critères de contrôle**, avec une moyenne de **2,5 tests techniques par critère**, explicitement destinés à *« réduire la marge d'interprétation quant au respect des normes d'accessibilité. »*
- **Limite de portée explicite** : le RGAA 4.1(.2) *« ne couvre pas les applications mobiles natives, les progiciels et le mobilier urbain numérique »* — pour ces périmètres, la vérification directe contre EN 301 549 est requise.
- (Non confirmé comme contenu publié, uniquement annoncé) : RGAA 5 devrait s'aligner davantage sur WCAG 2.2, ajouter un cadre technique pour l'évaluation des applications mobiles et des documents bureautiques, et reformuler certains critères.

Sources : https://accessibilite.numerique.gouv.fr/methode/introduction/

---

## 2. WCAG — Web Content Accessibility Guidelines

### Version de référence

- **WCAG 2.2** est la Recommandation W3C en vigueur, publiée le **5 octobre 2023**, avec une **édition mise à jour republiée le 12 décembre 2024** (corrections éditoriales).
- WCAG 2.0 (11 déc. 2008) et WCAG 2.1 (5 juin 2018, elle-même mise à jour éditorialement jusqu'au 6 mai 2025) restent des Recommandations valides ; WCAG 2.2 leur est rétrocompatible.

Sources : https://www.w3.org/TR/WCAG22/ · https://www.w3.org/WAI/standards-guidelines/wcag/

### Les 4 principes

| Anglais | Français |
|---|---|
| Perceivable | Perceptible |
| Operable | Utilisable |
| Understandable | Compréhensible |
| Robust | Robuste |

Sources : https://www.w3.org/TR/WCAG22/ · traduction officielle W3C : https://www.w3.org/Translations/WCAG22-fr/

### Niveaux A / AA / AAA

- **Niveau A** : niveau minimal.
- **Niveau AA** : inclut tous les critères A + AA. C'est le **niveau visé par la référence légale européenne** (voir EN 301 549, section 3).
- **Niveau AAA** : niveau le plus exigeant, inclut A + AA + AAA.

Source : https://www.w3.org/WAI/WCAG2AA-Conformance

### Nouveautés de WCAG 2.2 par rapport à 2.1

| Critère | Niveau |
|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA |
| 2.4.12 Focus Not Obscured (Enhanced) | AAA |
| 2.4.13 Focus Appearance | AAA |
| 2.5.7 Dragging Movements | AA |
| 2.5.8 Target Size (Minimum) | AA |
| 3.2.6 Consistent Help | A |
| 3.3.7 Redundant Entry | A |
| 3.3.8 Accessible Authentication (Minimum) | AA |
| 3.3.9 Accessible Authentication (Enhanced) | AAA |

**Suppression confirmée** : le critère **4.1.1 Parsing**, présent dans WCAG 2.1, est marqué **« Obsolete and removed »** dans WCAG 2.2 publié (les navigateurs/HTML5 rendent les erreurs de parsing qu'il visait largement caduques).

Source : https://www.w3.org/TR/WCAG22/

### État de WCAG 3.0

- **Toujours à l'état de Working Draft** (brouillon de travail), pas encore de statut de Candidate Recommendation ni de Recommandation.
- Dernier brouillon publié le **10 septembre 2026**.
- Le document lui-même indique qu'il reste *« several years of work »* et organise ses exigences par niveaux de maturité (Placeholder → Exploratory → Developing → Refining → Mature) ; seules les exigences au stade « developing » figurent dans ce brouillon.
- **Aucune date cible de publication en Recommandation n'est communiquée.**

Source : https://www.w3.org/TR/wcag-3.0/

---

## 3. EN 301 549 — Norme européenne

### Rôle

EN 301 549 est la **norme européenne d'accessibilité des TIC** (technologies de l'information et de la communication) : c'est elle qui constitue la **référence légale citée par la réglementation française et européenne**, en incorporant par référence les critères de succès de WCAG. Le RGAA est l'outillage méthodologique français qui opérationnalise cette référence pour le web (voir section 1).

### Version actuellement citée comme référence légale

- **Statut au 16 septembre 2026** : une **nouvelle version EN 301 549 V4.1.1** a été **adoptée le 24 août 2026** et **publiée le 2 septembre 2026** par l'ETSI. Cette version **fait passer la référence WCAG de 2.1 à 2.2** (niveau AA) et ajoute une annexe de correspondance avec l'European Accessibility Act (EAA).
- **Point crucial** : au moment de la rédaction de cette fiche, **la V4.1.1 n'est pas encore la référence légalement citée** — tant que la Commission européenne ne l'a pas formellement citée au Journal officiel de l'UE, **la référence légale en vigueur reste la version V3.2.1 (approuvée fin 2020, publiée ~mars 2021), fondée sur WCAG 2.1 niveau AA.**
- Le RGAA (arrêté du 20 septembre 2019, décret n° 2019-768) référence quant à lui la norme **EN 301 549 V2.1.2 (août 2018)** — un décalage de version entre le texte réglementaire français historique et la norme européenne la plus récente, qui s'explique par le rythme propre des mises à jour réglementaires françaises face aux révisions techniques de la norme ETSI.
- **Développement réglementaire très récent à noter** : le **décret n° 2026-816 du 24 août 2026** (en vigueur depuis le **27 août 2026**) modifie l'article 1er du décret n° 2019-768 pour faire désormais référence aux **« normes harmonisées européennes publiées au titre de l'article 6 de la directive 2016/2102 »**, plutôt qu'au seul RGAA — une évolution réglementaire qui rapproche explicitement le droit français des versions successives d'EN 301 549.

Sources : https://www.etsi.org/deliver/etsi_en/301500_301599/301549/ · https://accessible-eu-centre.ec.europa.eu/content-corner/news/european-accessibility-standard-en-301-549-has-been-updated-2026-09-07_en · https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054746617

**Non confirmé** : le lien explicite RGAA ↔ EN 301 549 n'a pas pu être vérifié directement sur w3.org/etsi.org/ec.europa.eu (ce sont des sources françaises — accessibilite.numerique.gouv.fr, legifrance.gouv.fr — qui l'établissent, et c'est ce qui est cité ci-dessus).

---

## 4. Obligations en France

### Qui est concerné

Base légale actuelle : **article 47 de la loi n° 2005-102 du 11 février 2005**, dans sa version en vigueur depuis le **8 septembre 2023** (modifiée par l'ordonnance n° 2023-859 du 6 septembre 2023, art. 1). L'article 47-I liste quatre catégories d'entités concernées :

1. Les **personnes morales de droit public** (État, collectivités territoriales, établissements publics).
2. Les **personnes morales de droit privé délégataires d'une mission de service public**, ou les entités privées créées pour satisfaire spécifiquement des besoins d'intérêt général à caractère non industriel ou commercial, dont l'activité est majoritairement financée par un organisme public, ou dont la gestion est contrôlée par lui, ou dont plus de la moitié des membres de l'organe de direction sont désignés par lui.
3. Les entités privées créées par les entités des catégories 1 et 2 pour le même type de besoins d'intérêt général.
4. Les **entreprises dépassant un seuil de chiffre d'affaires** fixé par décret.

Sont exclus : les organismes privés à but non lucratif qui ne fournissent ni service public essentiel, ni service répondant spécifiquement aux besoins des personnes handicapées.

**Seuil pour le secteur privé** : **exactement 250 000 000 € (250 millions d'euros)**, calculé comme la **moyenne du chiffre d'affaires annuel réalisé en France sur les trois derniers exercices clos** précédant l'année considérée.
Base légale : décret n° 2019-768 du 24 juillet 2019, article 2.

**À distinguer clairement — deux régimes privés distincts et non exclusifs l'un de l'autre** :
- Le régime **article 47 / seuil 250 M€** s'applique à tout service de communication au public en ligne d'une grande entreprise, quel que soit son secteur.
- Le régime **European Accessibility Act** (décret n° 2023-931, voir ci-dessous) s'applique à des secteurs B2C précis (e-commerce, banque, transport, communications électroniques, médias audiovisuels, livres numériques, etc.) **quelle que soit la taille de l'entreprise**, sous réserve d'une exemption « micro-entreprise » (voir plus bas).

Sources : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000037388867/ · https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000038956842

### Textes applicables

| Texte | Référence exacte | Rôle |
|---|---|---|
| Loi fondatrice | Loi n° 2005-102 du 11 février 2005, art. 47 | Obligation d'origine (secteur public) |
| Transposition directive (UE) 2016/2102 | Loi n° 2018-771 du 5 septembre 2018, art. 80 | Modifie l'art. 47 ; étend aux applications mobiles ; introduit le seuil privé de 250 M€ |
| Décret d'application | Décret n° 2019-768 du 24 juillet 2019 | Fixe le seuil de 250 M€ (art. 2) ; contenu de la déclaration d'accessibilité (art. 6) |
| Référentiel RGAA | Arrêté du 20 septembre 2019 | Approuve le RGAA (version actuelle : 4.1.2) |
| Loi d'habilitation DDADUE | Loi n° 2023-171 du 9 mars 2023, art. 16 | Habilite le gouvernement à transposer par ordonnance la directive (UE) 2019/882 (EAA) |
| Transposition EAA (services numériques publics) | Ordonnance n° 2023-859 du 6 septembre 2023 | Réécrit l'art. 47 ; crée l'art. 47-1 (sanctions, rôle de l'ARCOM) |
| Transposition EAA (produits et services) | Décret n° 2023-931 du 9 octobre 2023 | Définit les produits/services couverts par l'EAA, l'exemption micro-entreprise, les sanctions |
| Exigences techniques EAA | Arrêté du 9 octobre 2023 | Fixe les exigences d'accessibilité applicables aux produits et services couverts |
| Modification récente | **Décret n° 2026-816 du 24 août 2026** (en vigueur depuis le 27 août 2026) | Modifie le décret n° 2019-768 : référence aux normes harmonisées européennes (art. 1), clause transitoire de 15 ans pour le mobilier urbain numérique (art. 5), **abroge l'ancien régime de sanctions (art. 8)**, réorganise le contrôle (rapports triennaux à la Commission européenne) |

**Directive (UE) 2019/882 — European Accessibility Act (EAA)** :
- Délai de transposition par les États membres : **28 juin 2022**.
- **Date d'application des mesures aux opérateurs économiques : 28 juin 2025** (confirmée).
- Certaines obligations spécifiques de l'article 4§8 peuvent être différées par les États membres jusqu'au **28 juin 2027** au plus tard.

Secteurs privés couverts par l'EAA **indépendamment du seuil de 250 M€** : commerce électronique ; services bancaires et financiers/assurance ; transport de voyageurs (aérien, ferroviaire, autobus/autocar, métro, tramway, trolleybus, voies navigables intérieures — sites, applis, billetterie électronique, information en temps réel, bornes interactives) ; services de communications électroniques ; services d'accès aux médias audiovisuels ; terminaux en libre-service, matériel informatique et systèmes d'exploitation grand public, liseuses numériques ; accès au numéro d'urgence 112.

**Exemption « micro-entreprise »** (décret n° 2023-931, art. D.412-60) : moins de **10 salariés** ET chiffre d'affaires annuel ≤ **2 millions d'euros** (ou total de bilan ≤ 2 M€). *Non confirmé* : l'application exactement uniforme de cette exemption à l'ensemble des opérateurs de services couverts par l'EAA (par opposition aux seuls fabricants de produits) n'a pas pu être vérifiée avec certitude dans le texte consolidé consulté — à revérifier avant publication d'un contenu pédagogique s'appuyant précisément sur ce point.

Sources : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000037388867/ · https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038811937/ · https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000047281814 · https://www.legifrance.gouv.fr/dossierlegislatif/JORFDOLE000048050657/ · https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000048178349 · https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054746617 · https://www.legifrance.gouv.fr/codes/id/LEGIARTI000048180393/2023-10-11

### Documents obligatoires

- **Déclaration d'accessibilité** : doit indiquer le statut de conformité (conforme / non conforme / partiellement conforme), la liste des contenus non accessibles avec leurs motifs (non-conformité, charge disproportionnée, ou hors champ) et les alternatives accessibles proposées, les modalités de signalement de difficultés d'accès pour les usagers, ainsi qu'une mention des voies de recours (dont le Défenseur des droits) ; elle doit être publiée sur une page dédiée et accessible depuis toutes les pages du site (pour les applications : sur le site ou dans la fiche de téléchargement de l'application). Base légale : art. 47-III de la loi 2005-102 ; décret n° 2019-768, art. 6.
- **Schéma pluriannuel de mise en accessibilité** : durée confirmée de **maximum 3 ans**. Base légale : art. 47-III de la loi 2005-102.
- **Plan d'action annuel** : décliné du schéma pluriannuel, publié et lié depuis la déclaration d'accessibilité.
- **Mention de conformité en page d'accueil** : formulation type confirmée — *« Accessibilité : totalement conforme »* / *« partiellement conforme »* / *« non conforme »*. Base légale : art. 47-IV de la loi 2005-102 ; décret n° 2019-768, art. 6-IV, qui renvoie au référentiel RGAA.

Sources : https://accessibilite.numerique.gouv.fr/obligations/declaration-accessibilite/ · https://accessibilite.numerique.gouv.fr/obligations/schema-pluriannuel/ · https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000037388867/

### Sanctions et montants — régime en vigueur depuis le 27 août 2026

**Point important** : le régime de sanctions a changé récemment. Le **décret n° 2026-816 du 24 août 2026** (en vigueur au **27 août 2026**) a **abrogé** l'ancien article 8 du décret n° 2019-768, qui prévoyait des amendes de 2 000 € (communes de moins de 5 000 habitants) et 20 000 € (autres entités) prononcées par le ministre chargé des personnes handicapées. **Ce régime est obsolète** — toute source qui cite encore ces montants (2 000 € / 20 000 €) décrit une réglementation dépassée.

**Régime actuel** — base légale : **article 47-1 de la loi n° 2005-102**, créé par l'ordonnance n° 2023-859 du 6 septembre 2023 (art. 2), en vigueur depuis le **8 septembre 2023** :

- **Autorité compétente : l'ARCOM** (Autorité de régulation de la communication audiovisuelle et numérique), qui peut mettre en demeure et, à défaut de mise en conformité, prononcer une sanction pécuniaire.
- Montant maximal de **50 000 €** pour non-respect de l'obligation d'accessibilité elle-même (art. 47-I).
- Montant maximal de **25 000 €** pour non-respect des obligations déclaratives (déclaration d'accessibilité, schéma pluriannuel/plan d'action, mention en page d'accueil — art. 47-III et 47-IV).
- Sanction renouvelable : une nouvelle sanction peut être prononcée si le manquement persiste plus de **6 mois** après le prononcé d'une première sanction (ce délai était auparavant d'un an, avant l'ordonnance de 2023).
- *Non confirmé* : la répartition exacte de l'application du plafond de 50 000 € entre les catégories d'entités visées à l'article 47-I (en particulier si les entreprises privées de la catégorie 4° — seuil de 250 M€ — sont soumises au plafond de 50 000 € ou seulement à celui de 25 000 €) n'a pas pu être confirmée avec certitude sur le texte consolidé consulté.

**Sanctions spécifiques EAA (produits et services)** : le décret n° 2023-931 qualifie le manquement de **contravention de 5ᵉ classe** (art. R.451-4). *Non confirmé de façon directe* : un montant de l'ordre de **7 500 €** par infraction pour une personne morale est avancé par recoupement avec les règles générales du Code pénal (montant de base 1 500 €, doublé en cas de récidive à 3 000 €, multiplié par 5 pour une personne morale), mais ce chiffre n'a pas été confirmé par une citation directe d'un texte Légifrance dans le cadre de cette recherche — à vérifier avant publication.

Sources : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000048050174 · https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054746617 · https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000048178349

### Autorité de contrôle

- **Secteur public / obligation RGAA (art. 47 et 47-1 de la loi 2005-102)** : **ARCOM**, confirmée directement par le texte de l'article 47-1 sur Légifrance.
- **Secteur privé EAA (produits et services couverts par le décret n° 2023-931)** : le texte du décret ne désigne pas explicitement une autorité unique et renvoie de façon générique aux « autorités de surveillance du marché ». *Non confirmé sur les sources autorisées pour cette recherche* (accessibilite.numerique.gouv.fr, legifrance.gouv.fr, service-public.fr, ec.europa.eu) : une répartition impliquant la **DGCCRF** comme autorité coordinatrice, avec des rôles sectoriels pour l'**ARCEP** (communications électroniques), l'**ARCOM** (audiovisuel/secteur public), l'**ACPR** et l'**AMF** (lisibilité de l'information dans la banque/assurance/investissement) et la **Banque de France** (identification, signature électronique, sécurité des paiements) a été trouvée sur economie.gouv.fr — une source hors du périmètre demandé pour cette fiche, donc à traiter comme non confirmée en l'état.

Source confirmée : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000048050174

---

## 5. Taux de conformité

### Calcul

- **Taux par page** : nombre de critères **validés** ÷ nombre de critères **applicables** (× 100). Un critère est « validé » seulement s'il est respecté sur **toutes** les pages de l'échantillon ; s'il échoue sur une seule page, il n'est pas validé. Un critère est « applicable » s'il concerne au moins une page de l'échantillon.
- **Taux moyen du site/service** : moyenne des taux de conformité de chaque page de l'échantillon.

### Seuils exacts

| Statut | Seuil |
|---|---|
| **Totalement conforme** | Tous les critères de contrôle du RGAA sont respectés (100 %) |
| **Partiellement conforme** | Au moins 50 % des critères de contrôle du RGAA sont respectés |
| **Non conforme** | Moins de 50 % des critères sont respectés, **ou** aucun résultat d'audit en cours de validité n'existe |

**Point à corriger si on le trouve ailleurs** : il n'existe **pas** de palier intermédiaire à 95 % sur le site officiel actuel — la conformité totale exige 100 % des critères, sans marge de tolérance. Toute mention d'un seuil « 95 % = totalement conforme » doit être considérée comme non confirmée / probablement erronée au regard du texte officiel actuel.

Source : https://accessibilite.numerique.gouv.fr/obligations/evaluation-conformite/ · https://accessibilite.numerique.gouv.fr/obligations/mentions-et-pages-obligatoires/

---

## 6. Méthode d'audit RGAA

### Constitution de l'échantillon de pages

Le site officiel ne fixe **pas de nombre fixe de pages** (le chiffre de « 25 pages » parfois cité dans des guides tiers n'a pas été retrouvé sur les pages officielles actuelles consultées — à ne pas présenter comme un chiffre officiel sans vérification supplémentaire, par exemple directement dans le PDF RGAA 4.1.2).

Règle générale énoncée : *« La sélection des pages auditées ainsi que leur nombre doivent être représentatifs du service de communication au public en ligne. »*

Pages devant figurer dans l'échantillon, lorsqu'elles existent :
- Page d'accueil, page de contact, page de mentions légales, page « accessibilité », plan du site, page d'aide, page d'authentification ;
- Au moins une page représentative par type de service proposé ;
- Des documents téléchargeables représentatifs, par type ;
- L'intégralité des pages d'un même processus (par exemple un tunnel de formulaire) ;
- Des pages représentant des types de contenus/mises en page distincts (tableaux, multimédia, formulaires…) ;
- Des pages sélectionnées au hasard représentant **au moins 10 %** des pages déjà sélectionnées ci-dessus.

Source : https://accessibilite.numerique.gouv.fr/obligations/evaluation-conformite/

### Types d'audit

**Non confirmé** : aucune taxonomie officielle nommée (par exemple « audit complet », « audit rapide », « audit de suivi ») n'a été retrouvée sur accessibilite.numerique.gouv.fr. Ce que le site officiel précise :
- Les audits peuvent être réalisés en **autoévaluation** ou par un **tiers**, mais doivent être « fiables » et « représentatifs » du service pour permettre l'établissement d'une déclaration de conformité valable.
- Un statut « non conforme » est explicitement déclenché en l'absence de « résultat d'audit en cours de validité », ce qui suggère une notion de durée de validité de l'audit — mais une **durée exacte n'a pas pu être reconfirmée avec certitude** au cours de cette recherche (des durées de 3 ans / 18 mois après une nouvelle version du RGAA ont été entr'aperçues mais pas revérifiées littéralement — à ne pas citer sans nouvelle vérification directe).

### Dérogations et contenus exemptés

| Dérogation | Condition |
|---|---|
| **Charge disproportionnée** | Applicable au cas par cas, par fonctionnalité/contenu, lorsque la mise en accessibilité est déraisonnable ou compromettrait la mission de service public ou la viabilité économique de l'organisme ; doit être documentée dans la déclaration d'accessibilité (justification, durée, alternative accessible si possible) |
| **Contenus de tiers** | Contenus ni financés ni développés par l'organisme concerné, et non sous son contrôle |
| **Formats bureautiques** | Publiés avant le **23 septembre 2018**, sauf s'ils sont nécessaires à une démarche administrative en cours |
| **Contenus audio et vidéo préenregistrés** | Publiés avant le **23 septembre 2020** |
| **Intranets et extranets** | Publiés avant le **23 septembre 2019** (jusqu'à une révision substantielle) |
| **Contenus archivés** | Ni nécessaires à une démarche administrative en cours, ni modifiés après le **23 septembre 2019** |

Ces trois dates (23 septembre 2018 / 2019 / 2020) correspondent aux échéances de transposition de la directive (UE) 2016/2102 en droit français. Base légale citée sur la page officielle : loi n° 2005-102 du 11 février 2005 (art. 47), loi n° 2004-575 du 21 juin 2004, décret n° 2019-768 du 24 juillet 2019, décret n° 2009-546 du 14 mai 2009, norme EN 301 549 V2.1.2 (2018-08).

Source : https://accessibilite.numerique.gouv.fr/obligations/champ-application/

---

## 7. Technologies d'assistance

### Lecteurs d'écran — parts d'usage

Référence standard du secteur : **WebAIM Screen Reader User Survey**. L'édition la plus récente **publiée** à la date de rédaction (16 septembre 2026) est l'**édition n° 10, publiée le 22 février 2024** (réponses collectées décembre 2023–janvier 2024, 1 539 réponses valides).

**Point de vigilance sur la fraîcheur des données** : une édition n° 11 existe et sa collecte de réponses s'est terminée le **31 août 2026**, mais **ses résultats n'étaient pas encore publiés** au 16 septembre 2026 (la page officielle indiquait encore que les résultats seraient publiés « dans un futur proche »). Ne pas citer de chiffres pour l'édition n° 11 tant qu'ils ne sont pas publiés — vérifier https://webaim.org/projects/screenreadersurvey11/ avant publication du contenu pédagogique final.

**Chiffres de l'édition n° 10 (lecteur d'écran principal, ordinateur de bureau/portable)** :

| Lecteur d'écran | Part en tant que lecteur principal |
|---|---|
| JAWS | 40,5 % |
| NVDA | 37,7 % |
| VoiceOver (macOS) | 9,7 % |
| Narrator | 0,7 % |

(NVDA arrive en tête si l'on considère l'usage « au sens large », toutes fréquences confondues : environ 65,6 % contre environ 60,5 % pour JAWS — la distinction entre « lecteur principal » et « lecteur utilisé au moins occasionnellement » est importante à conserver dans un contenu pédagogique.)

**Chiffres mobiles (édition n° 10)** : 91,3 % des répondants utilisent un lecteur d'écran sur mobile ; VoiceOver (iOS) 70,6 %, TalkBack (Android) 34,7 %.

Source : https://webaim.org/projects/screenreadersurvey10/

**Absence de statistiques françaises officielles** : accessibilite.numerique.gouv.fr ne publie pas de données de parts de marché. La page « environnement de test » du RGAA liste uniquement les **combinaisons officielles de test** (et non des statistiques d'usage) : NVDA+Firefox, JAWS+Firefox/IE, VoiceOver+Safari (bureau) ; TalkBack+Chrome (Android), VoiceOver+Safari (iOS) — combinaisons choisies car établies *« sur la base de la liste des aides techniques dont l'utilisation est suffisamment répandue »*, sans chiffres associés. Cette page mentionne aussi ZoomText et Dragon NaturallySpeaking comme outils complémentaires.

Source : https://accessibilite.numerique.gouv.fr/methode/environnement-de-test/

### Autres aides techniques (liste factuelle, sans données chiffrées)

- Loupes d'écran / logiciels d'agrandissement (ex. ZoomText)
- Logiciels de reconnaissance vocale (ex. Dragon NaturallySpeaking)
- Plages braille éphémères (afficheurs braille), généralement couplées à un lecteur d'écran
- Dispositifs de contacteurs / accès par balayage (switch access)
- Claviers alternatifs, pointeurs de tête, claviers virtuels à l'écran
- Logiciels de synthèse vocale (distincts d'un lecteur d'écran complet)

Source : https://www.w3.org/WAI/people-use-web/tools-techniques/

---

## 8. ARIA

### Version de référence

- **WAI-ARIA 1.2** est la Recommandation W3C en vigueur, publiée le **6 juin 2023**.
- **WAI-ARIA 1.3** existe mais reste à l'état de **Working Draft** (brouillon de travail), dernière publication le **4 juin 2026** — ce n'est pas encore une Recommandation.
- À noter également : la spécification **« ARIA in HTML »** (règles de correspondance ARIA/HTML) a été republiée comme nouvelle Recommandation W3C le **5 août 2025**.

Sources : https://www.w3.org/TR/wai-aria-1.2/ · https://www.w3.org/TR/wai-aria-1.3/ · https://www.w3.org/TR/html-aria/

### Les règles fondamentales d'utilisation d'ARIA

**Changement récent important à signaler explicitement** : le document historiquement cité pour « les cinq règles d'utilisation d'ARIA » — **« Using ARIA »** (https://www.w3.org/TR/using-aria/) — a été **reclassé comme « Discontinued Draft » (brouillon abandonné) le 24 février 2026**. Le document précise désormais lui-même : *« Using ARIA is a Discontinued Draft. The four rules of ARIA are kept for historical purposes and for easier reference, but there are no plans to continue work on this document. For further guidance […] see the ARIA Authoring Practices Guide (APG). »*

**Le document ne contient donc plus que QUATRE règles, et non cinq** — toute source (y compris pédagogique) qui présente encore « les cinq règles d'usage d'ARIA » décrit une version dépassée du document. Formulation actuelle des quatre règles (traduction indicative, à vérifier mot à mot sur la source si citation exacte requise) :

1. **Première règle** : s'il existe un élément ou un attribut HTML natif ayant déjà la sémantique et le comportement requis, l'utiliser plutôt que de détourner un autre élément en lui ajoutant un rôle, un état ou une propriété ARIA.
2. **Deuxième règle** : ne pas modifier la sémantique native d'un élément, sauf nécessité réelle (exemple donné : éviter `<h2 role="tab">`, préférer envelopper l'élément natif : `<div role="tab"><h2>…</h2></div>`).
3. **Troisième règle** : tous les contrôles ARIA interactifs doivent être utilisables au clavier — tout ce qu'un utilisateur peut cliquer, toucher, glisser-déposer ou faire défiler doit pouvoir être atteint et activé de façon équivalente au clavier, avec les combinaisons de touches standards appropriées.
4. **Quatrième règle** : ne pas utiliser `role="presentation"` ni `aria-hidden="true"` sur un élément focalisable — cela conduirait certains utilisateurs à faire le focus sur « rien ».

Source (à citer mot à mot en cas de besoin) : https://www.w3.org/TR/using-aria/

La formule « No ARIA is better than Bad ARIA » n'est plus un intitulé de section dans « Using ARIA » ; elle vit désormais dans la page **« Read Me First »** de l'APG.

### Rôle de l'ARIA Authoring Practices Guide (APG)

- URL de référence : **https://www.w3.org/WAI/ARIA/apg/**
- L'APG fournit des **modèles de conception (design patterns)**, des **exemples fonctionnels** et des **modèles d'interaction clavier** pour appliquer correctement la sémantique ARIA aux composants d'interface courants.
- Il constitue le **guide pratique non normatif** qui accompagne la spécification ARIA elle-même (laquelle définit formellement, de façon normative, les rôles/états/propriétés). Le document « Using ARIA » désormais abandonné renvoie explicitement vers l'APG pour toute guidance à jour.

Source : https://www.w3.org/WAI/ARIA/apg/ · https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/

---

## 9. Outils de test

### Outils reconnus

**Outils français / spécifiques au RGAA**

| Outil | Description | Éditeur |
|---|---|---|
| Assistant RGAA | Extension Firefox/Chrome guidant un **audit manuel** critère par critère sur les 106 critères RGAA 4.1/4.1.2 ; propose une procédure de test par critère et, pour certains tests, une aide à l'évaluation qui met en évidence les éléments DOM concernés | Développé à l'origine pour la DINUM/DISIC (2016), maintenu aujourd'hui par Boscop |
| Asqatasun | Plateforme open source d'audit **automatisé** (application web, robot d'exploration, plugin Jenkins/CI) testant RGAA et WCAG ; origine : EvalAccess (2007) puis Tanaguru, renommée/scindée en Asqatasun en 2014 | Communauté/association Asqatasun |
| Tanaguru | Aujourd'hui une entité commerciale distincte, poursuivant la marque après la cessation d'activité de la structure d'origine en 2014 (lignage historique, source secondaire) | Tanaguru |

**Outils internationaux**

| Outil | Description | Éditeur |
|---|---|---|
| axe DevTools / axe-core | Extension navigateur + moteur de règles open source, largement intégré dans d'autres outils (Lighthouse, Accessibility Insights) | Deque Systems |
| WAVE | Outil web d'évaluation + extension navigateur ; sert de moteur au rapport annuel « WebAIM Million » | WebAIM |
| Google Lighthouse (audit accessibilité) | Intégré à Chrome DevTools/PageSpeed Insights ; ses vérifications reposent sur les règles **axe-core** (adoption annoncée par Google au CSUN 2017), mais sur un sous-ensemble (~50–57 audits contre ~96 règles pour axe DevTools complet) | Google |
| Accessibility Insights | Outil gratuit et open source : « FastPass » (vérifications automatiques rapides) + « Assessment » (revue manuelle guidée structurée) ; également fondé sur axe-core | Microsoft |

**Panneaux d'accessibilité des outils de développement navigateur** : Chrome/Edge DevTools (panneau Accessibility, arbre d'accessibilité, contraste), Firefox DevTools (Accessibility Inspector, vérificateur de contraste, simulation de déficience de vision des couleurs).

### Ce qu'un outil automatique détecte — et ce qu'il ne détecte pas

**Ce que les sources officielles disent réellement sur le taux de couverture** :

- **Le RGAA (méthode officielle)** ne publie **aucun pourcentage** de critères ou de tests automatisables ; les procédures de test sont rédigées sans métadonnées d'« automatisabilité ». Tout chiffre de type « RGAA : X % automatisable » qui circule en ligne **n'est pas issu du texte officiel du RGAA** — à ne pas citer comme officiel.
- **Le rapport WebAIM Million**, édition la plus récente datée de **février 2026**, ne donne qu'une affirmation qualitative : *« All automated tools, including WAVE, have limitations—not all conformance failures can be automatically detected »* et *« Absence of detected errors does not indicate that a page is accessible or conformant. »* **Aucun pourcentage n'est publié.** Le chiffre de « ~30–40 % des erreurs détectées par WAVE » que l'on trouve parfois dans des blogs **n'est pas une affirmation de WebAIM elle-même** — à traiter comme non confirmé.
- **Deque (axe-core)** est la seule source ayant publié un **chiffre daté et sourcé précisément**, avec deux mesures distinctes et non interchangeables, issues d'une étude publiée le **10 mars 2021** :
  - **Mesure par critères** : *« automated issues for 16 out of the 50 Success Criteria under WCAG 2.1 Level AA »* — soit environ **16/50 (~20–30 %)** des critères de succès WCAG 2.1 AA pour lesquels l'automatisation peut détecter au moins un problème.
  - **Mesure par volume de problèmes réels** : *« 57,38 % »* des problèmes totaux identifiés lors de plus de 2 000 audits réels (13 000+ pages, ~300 000 problèmes) ont été détectés par les tests automatisés de Deque.
  - Ces deux chiffres **ne se substituent pas l'un à l'autre** : le premier mesure la part des *critères WCAG* couverts par l'automatisation, le second la part du *volume réel de problèmes* détectés en audit — un contenu pédagogique ne doit pas les confondre.
- **Le W3C WAI** ne publie pas non plus de pourcentage : *« no tool alone can determine if a site meets accessibility standards. Knowledgeable human evaluation is required to determine if a site is accessible. »*

**En résumé pour un contenu pédagogique** : le seul chiffre précis, daté et sourcé de façon fiable est celui de **Deque** (57,38 % du volume de problèmes réels ; 16/50 critères WCAG 2.1 AA touchés par l'automatisation) — RGAA, WebAIM et W3C ne publient aucun pourcentage officiel équivalent.

**Ce qu'un outil automatique détecte de façon fiable** : attributs `alt` manquants (présence, pas pertinence du contenu) ; champs de formulaire sans étiquette ; ratios de contraste de couleur non conformes aux seuils numériques WCAG ; attribut `lang` manquant sur `<html>` ; liens/boutons vides sans nom accessible ; attributs ARIA invalides ou mal utilisés (valeur non autorisée pour le rôle, valeur invalide) ; balise `<title>` de document manquante ; présence/rupture de la hiérarchie des titres (structure uniquement, pas la pertinence du contenu) ; tableaux sans association d'en-têtes/`scope` ; identifiants dupliqués.

**Ce qui exige un jugement humain** : le caractère réellement pertinent et fidèle d'un texte alternatif (au-delà de sa simple présence) ; le caractère logique de l'ordre de lecture dans son contexte ; le fait qu'un piège au clavier constitue un vrai problème d'usage ou une gestion de focus modale intentionnelle et bien conçue ; le fait que la couleur soit réellement le seul moyen de transmettre une information dans un graphique complexe ; la clarté et la pertinence du libellé d'une étiquette ARIA (au-delà de sa validité syntaxique) ; l'exactitude et la synchronisation des sous-titres, la qualité de l'audiodescription d'une vidéo ; la pertinence réelle du nom accessible d'un contrôle par rapport à sa fonction ; l'utilisabilité globale avec une véritable technologie d'assistance (parcours réel au lecteur d'écran).

Sources : https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/ · https://webaim.org/projects/million/ · https://www.deque.com/automated-accessibility-coverage-report/ · https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/ · https://www.w3.org/WAI/test-evaluate/ · https://www.w3.org/WAI/standards-guidelines/act/

---

## Points non confirmés

Cette section récapitule, pour référence rapide, tout ce qui n'a **pas** pu être confirmé avec certitude sur une source officielle au cours de cette recherche (septembre 2026). Ne pas présenter ces points comme des faits établis dans un contenu pédagogique sans vérification complémentaire directe.

1. **Nombre exact de tests RGAA** : seule la moyenne de 2,5 tests/critère est publiée officiellement ; un total exact (souvent cité comme 258 par des sources tierces) n'a pas été retrouvé sur une page gouvernementale officielle.
2. **Lien explicite RGAA ↔ EN 301 549** : établi via des sources françaises (accessibilite.numerique.gouv.fr, legifrance.gouv.fr) mais non retrouvé formulé comme tel sur w3.org, etsi.org ou ec.europa.eu.
3. **Répartition du plafond de sanction de 50 000 € de l'article 47-1** entre les catégories d'entités visées à l'article 47-I (en particulier son application ou non aux entreprises privées de la catégorie 4°, seuil 250 M€) — non confirmée avec certitude sur le texte consolidé consulté.
4. **Montant exact des sanctions EAA pour les produits/services** (contravention de 5ᵉ classe, décret n° 2023-931) : le chiffre d'environ 7 500 € par infraction pour une personne morale est déduit par recoupement avec les règles générales du Code pénal, non cité littéralement sur une page Légifrance consultée directement.
5. **Application uniforme de l'exemption « micro-entreprise »** (moins de 10 salariés, CA ≤ 2 M€, décret n° 2023-931, art. D.412-60) à l'ensemble des opérateurs de services couverts par l'EAA, par opposition aux seuls fabricants de produits.
6. **Répartition des autorités de contrôle pour le volet EAA privé** (DGCCRF, ARCEP, ARCOM, ACPR, AMF, Banque de France selon les secteurs) : trouvée uniquement sur economie.gouv.fr, source hors du périmètre officiel demandé pour cette fiche — à confirmer sur Légifrance ou service-public.fr.
7. **Durée de validité d'un audit RGAA** avant qu'il ne faille en refaire un pour éviter le statut « non conforme » (des durées de 3 ans / 18 mois ont été entr'aperçues mais non revérifiées littéralement).
8. **Nombre minimal fixe de pages dans l'échantillon d'audit** (le chiffre de « 25 pages » couramment cité dans des guides tiers n'apparaît pas sur les pages officielles actuellement consultées ; seules des règles de composition qualitative sont publiées).
9. **Taxonomie officielle des types d'audit** (« audit complet », « audit rapide », « audit de suivi ») : non retrouvée sur accessibilite.numerique.gouv.fr ; seule la distinction autoévaluation / tiers est confirmée.
10. **Chiffres de la WebAIM Screen Reader User Survey n° 11** : collecte terminée le 31 août 2026, résultats non publiés au 16 septembre 2026 — à vérifier avant toute publication finale du contenu pédagogique, ces chiffres pourraient remplacer ceux de l'édition n° 10 citée dans cette fiche.
11. **Contenu exact de la nouvelle norme EN 301 549 V4.1.1** (adoptée le 24 août 2026, publiée le 2 septembre 2026) : les informations rapportées proviennent de la page de l'AccessibleEU Centre de la Commission européenne et des métadonnées du répertoire ETSI, le corps du texte du PDF normatif n'ayant pas pu être extrait et lu directement lors de cette recherche.

---

*Fiche compilée le 16 septembre 2026 à partir de sources officielles uniquement (accessibilite.numerique.gouv.fr, w3.org/WAI, legifrance.gouv.fr, etsi.org, ec.europa.eu, webaim.org, deque.com). En cas de doute sur un point non confirmé ci-dessus, revérifier directement la source avant publication d'un contenu pédagogique s'appuyant sur ce point.*

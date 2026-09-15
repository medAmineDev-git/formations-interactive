# Guide de rédaction des leçons

Ce guide sert à écrire de nouvelles leçons et questions d'entretien avec un style homogène.
Les leçons de référence sont dans `content/spring-boot/lecons/01-fondamentaux/` : **les lire avant d'écrire**.

## Public et ton

- Public : développeur qui apprend la techno pour l'utiliser au travail **et** préparer des entretiens.
- Langue : **français**, clair et direct, vouvoiement. Phrases courtes. Termes techniques anglais conservés quand ils sont d'usage (bean, endpoint, repository…), expliqués à la première apparition.
- Code : noms de classes et variables **en français** quand c'est naturel (`CommandeService`, `ProduitRepository`), dans un domaine métier concret et récurrent (boutique : commandes, produits, clients, paniers).
- Versions : **Spring Boot 3.x, Spring Framework 6, Java 17+**. Imports `jakarta.*` (jamais `javax.*` pour JPA / validation / servlet). Signaler brièvement quand un comportement a changé récemment.
- **Exactitude avant tout.** Ne rien inventer (noms d'annotations, propriétés, messages d'erreur, comportements). En cas de doute sur un détail, ne pas l'affirmer ou le formuler prudemment. Pas de statistiques inventées.

## Fichier de leçon

Emplacement : `content/<techno>/lecons/<NN-chapitre>/<NN-id>.md`

```markdown
---
id: identifiant-unique            # kebab-case, unique dans toute la techno
chapitre: id-du-chapitre          # doit exister dans tech.yaml
ordre: 1                          # position dans le chapitre (1, 2, 3…)
titre: "Titre de la leçon"        # entre guillemets s'il contient « : » ou commence par @
termes:                           # 5 à 8 termes clés
  - terme: "@MonAnnotation"
    definition: "Définition complète, 1 à 3 phrases, Markdown autorisé (`code`, **gras**)."
quiz:                             # exactement 3 questions
  - question: "Question ?"
    code: |                       # optionnel : extrait de code Java (sans ```)
      public class A { }
    choix:                        # 4 choix, un seul correct
      - "Choix A"
      - "Choix B"
      - "Choix C"
      - "Choix D"
    reponse: 1                    # index de la bonne réponse (0 = premier choix)
    explication: "Pourquoi c'est la bonne réponse, et pourquoi le piège est un piège."
---

## Essentiel

## Détail
```

### Partie « Essentiel » (affichée par défaut)

- 150 à 300 mots + 1 ou 2 blocs de code courts.
- Ce qu'il faut absolument savoir pour comprendre et utiliser la notion. Doit se suffire à lui-même.

### Partie « Détail » (bouton « Explication détaillée »)

Les **termes** du frontmatter sont affichés automatiquement en tête du détail : ne pas les répéter dans le Markdown.
Puis, dans cet ordre, avec des titres `###` :

1. `### Pourquoi c'est utile` ou `### Comment ça marche` (au choix, selon la notion) — optionnel.
2. `### Exemple 1 — …`, `### Exemple 2 — …`, `### Exemple 3 — …` : 3 ou 4 exemples, du plus simple au plus réaliste, chacun avec un bloc ```java (ou ```yaml, ```properties, ```bash, ```xml, ```json) et 1 à 3 phrases d'explication.
3. Un tableau comparatif quand la notion s'y prête (options, variantes, avant/après).
4. `### Pièges courants` : 2 ou 3 pièges, **chacun dans une citation** `> **Le piège en gras.** Explication et solution.` (ils s'affichent en encadré orange). Citer le vrai message d'erreur quand il est connu.
5. `### À retenir` : 4 ou 5 puces.

Longueur totale d'une leçon : environ 8 à 11 Ko.

### Quiz

- Exactement **3 questions**, 4 choix chacune, un seul correct.
- L'application **mélange l'ordre des choix** à chaque affichage : un choix ne doit jamais faire référence à un autre par sa position (« toutes les réponses ci-dessus », « A et B »), et l'explication ne cite jamais de lettre.
- Au moins une question du type « Qu'affiche / que se passe-t-il avec ce code ? » (champ `code`).
- Des distracteurs plausibles (erreurs réellement commises), pas des réponses absurdes.
- L'`explication` justifie la bonne réponse ET corrige l'idée fausse la plus probable.

## Questions d'entretien

Emplacement : `content/<techno>/entretien/<NN-chapitre>.yaml`

```yaml
questions:
  - id: dem-starters               # unique dans toute la techno, préfixé par le chapitre
    niveau: junior                 # junior | confirme | senior
    theme: Démarrer un projet      # regroupement affiché dans l'onglet Entretien
    type: ouverte                  # ouverte | qcm
    question: "Question posée en entretien ?"
    reponse: |                     # ouverte : la réponse attendue, en Markdown (puces bienvenues)
      - …
    explication: "Optionnel : ce qui fait la différence en entretien."
    lecon: id-de-la-lecon          # obligatoire : la leçon qui explique la réponse

  - id: dem-springbootapp
    niveau: junior
    theme: Démarrer un projet
    type: qcm
    question: "…"
    code: |                        # optionnel
      …
    choix: ["…", "…", "…", "…"]
    reponse: 2                     # index
    explication: "…"
    lecon: id-de-la-lecon
```

- Environ 1 question par leçon, plus 1 ou 2 questions transverses par chapitre.
- Mélange ~60 % `ouverte` (formuler à l'oral) et ~40 % `qcm` (pièges techniques).
- Répartir les niveaux : questions de définition → junior ; « pourquoi / comment choisir » → confirmé ; fonctionnement interne, pièges subtils, conception → senior.
- Les questions doivent être celles qu'on pose **réellement** en entretien.

## Règles YAML (sources d'erreurs fréquentes)

- Mettre entre **guillemets doubles** toute valeur qui commence par `@`, `` ` ``, `*`, `[`, `{`, `!`, `&`, `%`, ou qui contient `: ` ou ` #`.
- Dans une chaîne entre guillemets doubles, un guillemet interne s'écrit `\"`. Préférer les guillemets français « … » dans le texte.
- Pas de backslash `\` isolé dans une chaîne entre guillemets doubles (utiliser un bloc `|`).
- Blocs `code: |` et `reponse: |` : indentation constante.

## Vérification

Toujours lancer `npm run verifier` après avoir écrit : il contrôle le YAML, les identifiants, les index de réponse, les sections et les liens leçon ↔ entretien.

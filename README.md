# Formations

Parcours d'apprentissage + préparation aux entretiens, par technologie.

```bash
npm install
npm run dev       # http://localhost:5173
npm run verifier  # contrôle la cohérence du contenu
npm run build     # vérifie le contenu puis produit le site statique dans dist/ (GitHub Pages, Vercel…)
```

La progression, les favoris et les révisions sont enregistrés dans le navigateur (localStorage).

## Ajouter du contenu

Tout le contenu est dans `content/<techno>/`, aucun code à modifier :

| Fichier | Rôle |
|---|---|
| `tech.yaml` | Nom, icône, couleur et liste ordonnée des chapitres (avec leur niveau) |
| `lecons/<NN-chapitre>/*.md` | Une leçon par fichier, un dossier par chapitre |
| `entretien/<NN-chapitre>.yaml` | Questions d'entretien (QCM ou ouvertes), liées à une leçon |

Les règles de rédaction complètes (ton, longueur, quiz, questions d'entretien, pièges YAML) sont dans
[`content/GUIDE-REDACTION.md`](content/GUIDE-REDACTION.md).

Structure d'une leçon :

```markdown
---
id: mon-id
chapitre: fondamentaux     # id du chapitre dans tech.yaml
ordre: 1
titre: Mon titre
termes:                     # affichés dans « Explication détaillée » et ajoutés au glossaire
  - terme: ...
    definition: "..."
quiz:
  - question: "..."
    code: |                 # optionnel
      ...
    choix: ["...", "...", "..."]
    reponse: 0              # index de la bonne réponse
    explication: "..."
---

## Essentiel
Ce qui s'affiche par défaut.

## Détail
Exemples, pièges, à retenir… (derrière le bouton « Explication détaillée »)
```

Pour une nouvelle technologie : créer `content/<techno>/tech.yaml`, elle apparaît sur l'accueil.

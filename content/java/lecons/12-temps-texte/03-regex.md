---
id: regex
chapitre: temps-texte
ordre: 3
titre: "Les expressions régulières"
termes:
  - terme: Pattern
    definition: "Représentation **compilée** d'une expression régulière (`Pattern.compile(regex)`), immuable et thread-safe. La compilation a un coût : elle doit être faite **une seule fois** (champ `static final`) et réutilisée, jamais répétée dans une boucle."
  - terme: Matcher
    definition: "Objet, créé par `pattern.matcher(texte)`, qui applique un `Pattern` compilé à un texte précis pour y chercher des correspondances (`find`), tester une correspondance totale (`matches`) ou accéder aux groupes capturés (`group`)."
  - terme: "Groupe (numéroté et nommé)"
    definition: "Portion d'expression entre parenthèses `(...)` capturée pour être réutilisée : par position (`group(1)`) ou par nom avec `(?<nom>...)` puis `group(\"nom\")`. `(?:...)` est un groupe **non capturant**, pour grouper sans réserver de numéro."
  - terme: "Quantificateur possessif"
    definition: "Variante d'un quantificateur (`*+`, `++`, `?+`) qui, une fois une correspondance prise, **ne revient jamais en arrière** (pas de backtracking) — plus rapide, mais peut faire échouer une correspondance qu'un quantificateur gourmand aurait trouvée."
  - terme: Ancre
    definition: "Motif qui ne consomme aucun caractère mais contraint une position : `^` (début), `$` (fin), `\\b` (limite de mot). Indispensable pour éviter qu'une correspondance partielle soit acceptée à tort avec `find`."
  - terme: "Backtracking catastrophique"
    definition: "Explosion du temps de calcul (souvent exponentielle) causée par des quantificateurs imbriqués (`(a+)+`) appliqués à une entrée qui ne correspond pas entièrement : le moteur explore un nombre gigantesque de découpages possibles. Risque de déni de service si le motif est appliqué à une entrée non fiable."
  - terme: "Pattern.quote"
    definition: "Échappe tous les caractères spéciaux d'une chaîne pour l'utiliser comme texte **littéral** dans une expression régulière (`Pattern.quote(\".\")` → motif qui cherche un point, pas « n'importe quel caractère »). `Matcher.quoteReplacement` fait l'équivalent côté remplacement."
quiz:
  - question: "Que renvoient ces deux appels ?"
    code: |
      String texte = "Commande CMD-2026-045 reçue";
      Pattern p = Pattern.compile("CMD-\\d{4}-\\d{3}");

      System.out.println(p.matcher(texte).matches());
      System.out.println(p.matcher(texte).find());
    choix:
      - "false puis true — matches() exige que le motif corresponde à toute la chaîne, find() cherche une correspondance n'importe où"
      - "true puis true, les deux méthodes sont équivalentes"
      - "false puis false, le motif ne correspond jamais dans une chaîne plus longue"
      - "Une PatternSyntaxException, \\d nécessite d'être échappé différemment"
    reponse: 0
    explication: "matches() teste que le motif décrit l'intégralité de la chaîne ; ici le texte contient du texte avant et après le code produit, donc matches() renvoie false. find() cherche une correspondance n'importe où dans la chaîne et la trouve, donc renvoie true. Confondre les deux est une source fréquente de bugs de validation trop permissive ou trop stricte."
  - question: "Quelle correspondance m.group() renvoie-t-il après m.find() ?"
    code: |
      String html = "<b>gras</b> et <i>italique</i>";
      Pattern p = Pattern.compile("<.+>");
      Matcher m = p.matcher(html);
      m.find();
      System.out.println(m.group());
    choix:
      - "<b>"
      - "<b>gras</b> et <i>italique</i> — .+ est gourmand et capture jusqu'au dernier > possible"
      - "<b>gras</b>"
      - "Aucune correspondance : find() renvoie false"
    reponse: 1
    explication: "Le quantificateur + est gourmand par défaut : il consomme le plus de caractères possible, puis recule seulement si nécessaire pour que le reste du motif (ici un simple >) trouve une correspondance. Comme la chaîne contient plusieurs >, le moteur s'arrête au dernier. Pour capturer seulement <b>, il faudrait un quantificateur paresseux (<.+?>) — et pour du HTML réel, un vrai parseur reste préférable à une expression régulière."
  - question: "Quel est le risque de cette expression régulière si elle est appliquée à une entrée fournie par un utilisateur ?"
    code: |
      Pattern p = Pattern.compile("(a+)+b");
      boolean ok = p.matcher("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaac").matches();
    choix:
      - "Aucun risque particulier, matches() renvoie simplement false rapidement"
      - "Backtracking catastrophique : les quantificateurs imbriqués (a+)+ multiplient le nombre de découpages possibles à tester, le temps d'exécution explose (déni de service)"
      - "Une StackOverflowError immédiate et déterministe, sans consommation CPU notable"
      - "PatternSyntaxException à la compilation, les quantificateurs imbriqués sont interdits"
    reponse: 1
    explication: "(a+)+ peut découper une suite de 'a' d'un très grand nombre de façons différentes ; comme la chaîne ne se termine pas par 'b', le moteur teste (dans le pire cas) un nombre de combinaisons exponentiel avant d'échouer. Sur une entrée non contrôlée, un tel motif est une vulnérabilité de déni de service (ReDoS) — il faut éviter les quantificateurs imbriqués sur le même texte, ou utiliser une forme possessive/atomique quand la sémantique le permet."
---

## Essentiel

Une expression régulière décrit un motif de texte. En Java, on **compile** le motif une fois (`Pattern`), puis on l'applique à un texte via un `Matcher` :

```java
Pattern codeProduit = Pattern.compile("^[A-Z]{3}-\\d{4}$"); // compilé une seule fois

Matcher m = codeProduit.matcher("ABC-1234");
boolean valide = m.matches(); // true : correspond à toute la chaîne
```

`matches()` exige que le motif décrive **toute** la chaîne ; `find()` cherche une correspondance n'importe où (et peut être rappelé pour trouver les occurrences suivantes). Compiler un `Pattern` a un coût : le faire une fois et le réutiliser, plutôt qu'appeler `String.matches(regex)` dans une boucle (qui recompile à chaque appel).

Classes de caractères courantes : `\d` (chiffre), `\w` (lettre/chiffre/`_`), `\s` (espace) — et leurs versions inversées `\D`, `\W`, `\S`. Quantificateurs : `*` (0 ou plus), `+` (1 ou plus), `?` (0 ou 1), `{n,m}` (entre n et m fois) — **gourmands** par défaut (le plus de caractères possible), rendus **paresseux** avec un `?` en plus (`+?`) ou **possessifs** avec un `+` en plus (`++`, sans retour en arrière).

Les groupes `(...)` capturent une partie du texte, accessible via `group(1)` ou, avec un nom (`(?<annee>...)`), via `group("annee")`.

## Détail

### Exemple 1 — Valider un code produit avec des groupes nommés

```java
private static final Pattern CODE_PRODUIT =
        Pattern.compile("^(?<categorie>[A-Z]{3})-(?<annee>\\d{4})-(?<sequence>\\d{3})$");

Matcher m = CODE_PRODUIT.matcher("JAR-2026-045");
if (m.matches()) {
    System.out.println(m.group("categorie")); // JAR
    System.out.println(m.group("annee"));      // 2026
} else {
    throw new IllegalArgumentException("Code produit invalide");
}
```

Les ancres `^` et `$` sont essentielles ici : sans elles, `matches()` se comporterait pareil (elle exige déjà toute la chaîne), mais elles documentent l'intention et deviennent indispensables si le motif est un jour réutilisé avec `find()`.

### Exemple 2 — Quantificateurs gourmand, paresseux, possessif

```java
Pattern gourmand = Pattern.compile("<.+>");     // consomme le plus possible, recule si besoin
Pattern paresseux = Pattern.compile("<.+?>");    // consomme le moins possible, avance si besoin
Pattern possessif = Pattern.compile("<.++>");    // consomme le plus possible, ne recule JAMAIS

String texte = "<b>gras</b>";
System.out.println(gourmand.matcher(texte).matches());            // true : .+ accepte n'importe quels caractères au milieu
System.out.println(paresseux.matcher(texte).find());              // true, group() = "<b>"
System.out.println(possessif.matcher(texte).matches());           // false : .++ consomme tout sans jamais reculer pour le > final
```

Le possessif est plus rapide (aucun retour en arrière), mais peut faire **échouer** une correspondance que le gourmand aurait trouvée en reculant : à réserver aux cas où l'absence de chevauchement est garantie par construction.

### Exemple 3 — Pièges de replaceAll, matches et split

```java
String prix = "19.90";
prix.replaceAll(".", "-");        // "-----" : "." veut dire "n'importe quel caractère" en regex, pas un point littéral
prix.replaceAll("\\.", "-");      // "19-90" : point échappé, comportement voulu
prix.replaceAll(Pattern.quote("."), "-"); // équivalent, plus lisible pour un motif entièrement littéral

"a,b,,".split(",");     // ["a", "b"]         : limite 0 par défaut, les vides de fin sont supprimés
"a,b,,".split(",", -1); // ["a", "b", "", ""] : limite négative, tout est conservé
```

`String.replaceAll`/`String.matches`/`String.split` prennent une **expression régulière**, pas une chaîne littérale : tout caractère spécial non échappé (`.`, `*`, `+`, `(`, `$`…) change le sens du motif. `Pattern.quote(texte)` échappe tout en une fois pour un remplacement purement littéral.

### Exemple 4 — Remplacement avec référence de groupe

```java
Pattern date = Pattern.compile("(\\d{2})/(\\d{2})/(\\d{4})"); // jj/mm/aaaa
String texte = "Livraison le 10/03/2026";

String isoDate = date.matcher(texte).replaceAll("$3-$2-$1");
System.out.println(isoDate); // Livraison le 2026-03-10
```

Dans la chaîne de remplacement, `$1`, `$2`, `$3` réinjectent le contenu des groupes capturés par le motif — pratique pour reformater du texte sans le reconstruire manuellement.

### Comparatif des quantificateurs

| Forme | Nom | Comportement |
|---|---|---|
| `X+` | Gourmand (greedy) | Consomme le plus possible, **recule** (backtracking) si la suite du motif échoue |
| `X+?` | Paresseux (lazy) | Consomme le moins possible, **avance** seulement si nécessaire |
| `X++` | Possessif | Consomme le plus possible, **ne recule jamais** — plus rapide, peut faire échouer une correspondance possible |

### Pièges courants

> **Oublier d'échapper un caractère spécial.** `replaceAll(".", "-")` remplace **tous** les caractères, car `.` en regex signifie « n'importe quel caractère », pas un point littéral. Échapper (`"\\."`) ou utiliser `Pattern.quote(...)` pour un motif entièrement littéral.

> **Recompiler un `Pattern` à chaque itération.** `texte.matches(regex)` dans une boucle recompile le motif à chaque appel — coûteux. Compiler une fois dans un champ `static final Pattern`, puis appeler `pattern.matcher(texte).matches()`.

> **Quantificateurs imbriqués sur une entrée non fiable.** Un motif comme `(a+)+b` peut provoquer un **backtracking catastrophique** : le temps d'exécution explose sur certaines entrées qui ne correspondent pas entièrement au motif. Sur des entrées utilisateur, éviter ce genre de construction ou utiliser des quantificateurs possessifs quand la sémantique le permet.

### Quand une expression régulière n'est pas le bon outil

Les expressions régulières traitent du texte **plat**, sans notion de structure imbriquée : elles ne savent pas compter des balises ouvrantes/fermantes en équilibre. Analyser du **HTML** ou du **JSON** avec une regex (par exemple `<.+>` pour extraire des balises) fonctionne sur des cas simples et échoue dès que la structure s'imbrique (balises encapsulées, attributs contenant `>`, chaînes JSON contenant des accolades). Pour ces formats, utiliser un vrai parseur (analyseur HTML, bibliothèque JSON) plutôt qu'une regex — la règle générale : une regex convient pour valider ou extraire un motif **local et plat** (un code produit, une adresse e-mail, une date), pas pour analyser un langage structuré.

### À retenir

- Compiler un `Pattern` une seule fois et le réutiliser ; `matches()` exige toute la chaîne, `find()` cherche n'importe où.
- Les groupes se capturent par position (`group(1)`) ou par nom (`(?<nom>...)`, `group("nom")`) ; `(?:...)` groupe sans capturer.
- Les quantificateurs sont gourmands par défaut ; `?` les rend paresseux, `+` supplémentaire les rend possessifs (sans retour en arrière).
- `replaceAll`/`matches`/`split` prennent une expression régulière, pas un texte littéral : échapper les caractères spéciaux ou utiliser `Pattern.quote`.
- Des quantificateurs imbriqués sur une entrée non fiable exposent à un backtracking catastrophique (déni de service) ; pour du texte structuré (HTML, JSON), préférer un vrai parseur à une regex.

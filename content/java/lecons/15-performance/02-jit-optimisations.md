---
id: jit-optimisations
chapitre: performance
ordre: 2
titre: "Le compilateur à la volée"
termes:
  - terme: JIT (Just-In-Time)
    definition: "Le compilateur **à la volée** de la JVM : il compile en code machine natif, pendant l'exécution, les portions de code exécutées suffisamment souvent (les **points chauds**), plutôt que de tout compiler à l'avance comme un compilateur classique."
  - terme: Compilation par paliers (tiered compilation)
    definition: "Stratégie où la JVM utilise d'abord l'**interpréteur**, puis un compilateur rapide mais peu optimisant (**C1**, avec instrumentation de profilage), puis, pour le code le plus chaud, un compilateur lent mais très optimisant (**C2**). Chaque palier profite du profilage accumulé par le précédent."
  - terme: Point chaud (hot spot)
    definition: "Une méthode ou une boucle exécutée un grand nombre de fois. La JVM cible ses efforts de compilation et d'optimisation sur ces points chauds, plutôt que sur du code exécuté une seule fois, où compiler coûterait plus cher que d'interpréter."
  - terme: Inlining
    definition: "Optimisation qui remplace un appel de méthode par le corps de cette méthode directement à l'endroit de l'appel, évitant le coût de l'appel et ouvrant la porte à d'autres optimisations sur le code ainsi fusionné. C'est l'une des optimisations les plus importantes du JIT."
  - terme: Analyse d'échappement (escape analysis) et remplacement scalaire
    definition: "Technique par laquelle le JIT détermine qu'un objet ne « s'échappe » jamais de la méthode qui le crée (il n'est ni retourné, ni stocké ailleurs, ni passé à un autre thread). Il peut alors décomposer cet objet en ses champs individuels (**remplacement scalaire**) et éviter complètement son allocation sur le tas, réduisant la pression sur le ramasse-miettes."
  - terme: Désoptimisation (deoptimization)
    definition: "Retour en arrière d'une méthode compilée vers l'interprétation quand une hypothèse sur laquelle une optimisation reposait devient fausse (par exemple, une classe chargée plus tard qui invalide un appel monomorphe supposé, ou une branche jamais prise auparavant qui l'est soudain). La JVM peut ensuite recompiler avec un profil à jour."
  - terme: "-XX:+PrintCompilation"
    definition: "Option de diagnostic qui journalise chaque méthode au moment où elle est compilée (ou recompilée, ou désoptimisée), avec le palier de compilation utilisé — un des moyens d'observer concrètement le travail du JIT plutôt que de le supposer."
quiz:
  - question: "Quelle est la différence de rôle entre le compilateur C1 et le compilateur C2 dans la compilation par paliers ?"
    choix:
      - "C1 compile uniquement les méthodes de bibliothèques standard, C2 uniquement le code applicatif"
      - "C1 compile vite avec peu d'optimisations et instrumente le code pour collecter du profilage ; C2 compile plus lentement mais applique des optimisations agressives sur les méthodes qui restent des points chauds une fois profilées"
      - "C1 et C2 sont deux noms pour le même compilateur, selon la version du JDK utilisée"
      - "C1 s'exécute uniquement au démarrage de l'application, C2 uniquement après son arrêt pour préparer la prochaine exécution"
    reponse: 1
    explication: "La compilation par paliers combine la rapidité de mise en route de C1 (compilation légère, avec instrumentation) et la qualité d'optimisation de C2 (compilation plus coûteuse, réservée aux méthodes qui se confirment être de vrais points chauds). Ce compromis évite à la fois un démarrage trop lent (tout compiler agressivement) et des performances de croisière médiocres (ne jamais optimiser)."
  - question: "Un appel de méthode est monomorphe depuis le début de l'exécution (toujours la même implémentation concrète), et le JIT l'a optimisé en conséquence. Que se passe-t-il si une classe chargée dynamiquement plus tard fournit une seconde implémentation à cet appel ?"
    choix:
      - "Rien : le JIT ne peut pas se tromper, l'hypothèse reste valable indéfiniment une fois posée"
      - "La JVM détecte que l'hypothèse d'optimisation est invalidée, désoptimise la méthode concernée (retour à l'interprétation) et peut la recompiler ensuite avec un profil tenant compte des deux implémentations"
      - "L'application plante immédiatement avec une erreur de compilation"
      - "Le JIT ignore silencieusement la nouvelle classe et continue d'appeler l'ancienne implémentation"
    reponse: 1
    explication: "Le JIT optimise parfois de façon spéculative, en pariant sur des hypothèses observées jusqu'ici (comme un appel toujours résolu vers la même implémentation). Quand une hypothèse devient fausse, la JVM désoptimise : elle revient à l'exécution interprétée pour cette méthode, en toute sécurité, puis peut recompiler avec un profil à jour qui tient compte du nouveau cas. Ce mécanisme garantit la correction du programme même quand l'optimiseur avait parié, à tort, sur une situation qui a changé."
  - question: "Pourquoi réécrire à la main une boucle « optimisée » (déroulée, avec des variables locales dupliquées pour éviter de prétendus accès mémoire coûteux) est-il souvent contre-productif en Java ?"
    choix:
      - "Parce que le JIT applique déjà ce type d'optimisations (déroulage de boucle, inlining, analyse d'échappement) automatiquement sur le code chaud, quand elles sont pertinentes, et le code manuel réécrit rend souvent le code plus difficile à analyser et à optimiser pour le compilateur"
      - "Parce que le bytecode Java interdit toute boucle déroulée manuellement"
      - "Parce que cela ralentit systématiquement le compilateur javac à la compilation"
      - "Parce que le JIT ne s'active que si le code source est écrit de façon simple, sans aucune structure de contrôle imbriquée"
    reponse: 0
    explication: "Le JIT applique lui-même le déroulage de boucle, l'inlining et d'autres optimisations sur le code réellement chaud, en se basant sur un profilage réel de l'exécution — quelque chose qu'un développeur ne peut pas reproduire à l'avance de façon fiable. Un code « optimisé à la main » est souvent plus complexe, ce qui peut gêner ces mêmes optimisations automatiques, sans bénéfice mesurable. La bonne pratique reste d'écrire du code clair et de mesurer avant d'intervenir."
---

## Essentiel

La JVM n'exécute pas le bytecode toujours de la même façon. Au démarrage, chaque méthode est **interprétée** — lente, mais immédiatement disponible. Si une méthode s'exécute souvent (elle devient un **point chaud**), le compilateur **JIT** (Just-In-Time) la compile en code machine natif, pendant l'exécution, pour accélérer les appels suivants.

La JVM HotSpot utilise une **compilation par paliers** : d'abord **C1**, rapide mais peu optimisant, qui compile vite et instrumente le code pour observer son comportement réel ; puis, pour le code qui reste chaud, **C2**, plus lent à compiler mais capable d'optimisations bien plus agressives, appuyées sur le profilage accumulé par C1.

Parmi les optimisations que le JIT applique automatiquement sur le code chaud :

- **Inlining** : remplacer un appel de méthode par son corps, pour éviter le coût de l'appel et ouvrir la voie à d'autres optimisations.
- **Élimination de code mort** et **déroulage de boucle**.
- **Analyse d'échappement** : quand un objet ne sort jamais de la méthode qui le crée, le JIT peut éviter complètement son allocation sur le tas (**remplacement scalaire**).

Ces optimisations reposent parfois sur des hypothèses spéculatives (« cet appel a toujours résolu vers la même implémentation »). Quand une hypothèse devient fausse — une classe chargée plus tard, une branche jamais prise auparavant qui l'est soudain — la JVM **désoptimise** : elle revient à l'interprétation pour cette méthode, en toute sécurité, avant de recompiler si nécessaire.

Conséquence pratique : un code « optimisé à la main » (boucles déroulées manuellement, micro-astuces) prive souvent le JIT d'informations claires sans apporter de gain mesurable — il fait déjà ce travail, mieux, sur la base d'un profilage réel.

## Détail

### Comment ça marche

1. **Interprétation** : au premier appel, le bytecode est exécuté par l'interpréteur, sans compilation. C'est immédiat, mais lent à l'exécution.
2. **Compilation C1** (palier client) : dès qu'une méthode s'exécute suffisamment souvent, C1 la compile rapidement, avec peu d'optimisations, mais en insérant une instrumentation qui enregistre des informations de profilage (quelles branches sont prises, quels types concrets circulent réellement à un point d'appel polymorphe).
3. **Compilation C2** (palier serveur) : si la méthode reste un point chaud, C2 la recompile en s'appuyant sur ce profilage, avec des optimisations bien plus agressives — inlining profond, analyse d'échappement, déroulage de boucle.
4. **Désoptimisation éventuelle** : si une hypothèse posée par C2 devient fausse, la JVM revient à l'interprétation pour cette méthode, le temps de recompiler avec un profil à jour.

Ce cycle explique pourquoi une application Java est souvent plus lente dans ses toutes premières secondes (interprétation, compilations C1 en cours) qu'une fois « montée en régime » (code chaud compilé par C2) — un effet directement lié au **préchauffage** évoqué dans la leçon précédente sur JMH.

### Exemple 1 — Observer la compilation avec -XX:+PrintCompilation

```bash
java -XX:+PrintCompilation MonApplication
```

Chaque ligne produite journalise une méthode compilée (ou recompilée, ou désoptimisée), avec un identifiant de palier. C'est un des moyens directs d'observer, plutôt que de supposer, ce que fait réellement le JIT sur une exécution donnée — utile pour vérifier qu'une méthode critique est bien devenue un point chaud compilé, et pas restée interprétée faute d'avoir été assez sollicitée pendant la période observée.

### Exemple 2 — Inlining

```java
private int carre(int x) {
    return x * x;
}

public int sommeDesCarres(int a, int b) {
    return carre(a) + carre(b);
}
```

Une fois `sommeDesCarres` chaude, le JIT peut fusionner le corps de `carre` directement dans `sommeDesCarres`, supprimant deux appels de méthode et exposant `a * a + b * b` à d'autres optimisations (comme le déroulage, si le contexte s'y prête). Ce genre de petites méthodes est un excellent candidat à l'inlining — l'écrire de façon claire, plutôt que de l'« inliner à la main » en dupliquant le calcul, laisse le JIT faire ce travail avec le contexte réel d'exécution.

### Exemple 3 — Analyse d'échappement et remplacement scalaire

```java
public double distance(int x1, int y1, int x2, int y2) {
    Point p1 = new Point(x1, y1);
    Point p2 = new Point(x2, y2);
    return p1.distanceA(p2);
}
```

Si `Point` ne s'échappe jamais de `distance` (ni retourné, ni stocké ailleurs), le JIT peut détecter que ces objets restent purement locaux et les remplacer par leurs champs individuels (`x1`, `y1`, `x2`, `y2` traités comme de simples variables), sans jamais allouer `p1` ni `p2` sur le tas. Le code reste lisible et orienté objet ; c'est au JIT, pas au développeur, de décider s'il peut éviter l'allocation.

### Exemple 4 — Désoptimisation sur hypothèse invalidée

```java
public interface Formatteur {
    String formater(Objet o);
}
// Une seule implémentation chargée et utilisée pendant longtemps : FormatteurDefaut
// Le JIT compile l'appel comme s'il était monomorphe (une seule cible possible)

// Plus tard, une seconde implémentation est chargée dynamiquement (plugin, classe chargée à la demande)
Formatteur f = chargerFormatteurPersonnalise(); // FormatteurPersonnalise, jamais vu avant
f.formater(objet);
```

Le JIT avait pu spéculer que l'appel `formater(...)` résolvait toujours vers `FormatteurDefaut`. L'apparition de `FormatteurPersonnalise` invalide cette hypothèse : la méthode concernée est désoptimisée, l'exécution repasse temporairement par l'interpréteur, puis la JVM peut recompiler en tenant compte des deux implémentations possibles (appel dit « bimorphe »). Ce mécanisme est transparent et sûr — il coûte une pénalité ponctuelle, jamais une incorrection.

### Effet du préchauffage sur le démarrage

Ce cycle interprétation → C1 → C2 a un coût au démarrage : une application qui vient de démarrer tourne sur du code encore peu optimisé, le temps que les points chauds réels se dégagent et soient compilés. C'est un problème connu pour les applications à démarrage court (fonctions serverless, CLI). Les approches de compilation anticipée (AOT) ou d'image native, qui déplacent une partie de ce travail avant l'exécution plutôt que pendant, sont traitées dans le chapitre Modules et déploiement — elles répondent précisément à ce compromis entre démarrage rapide et optimisations du JIT construites sur un profilage réel.

### Pièges courants

> **Réoptimiser à la main ce que le JIT fait déjà.** Dérouler une boucle manuellement, dupliquer du code pour éviter un appel de méthode, ou multiplier les variables locales par prétendue économie d'accès mémoire : le JIT applique déjà ces optimisations sur le code chaud, avec un profilage réel que le développeur n'a pas. Le résultat est souvent un code plus complexe, sans gain mesuré — voire un gain plus faible, si la réécriture gêne l'analyse du compilateur.

> **Juger la performance d'un code sur ses toutes premières exécutions.** Tant qu'une méthode n'est pas devenue un point chaud compilé par C2, elle tourne interprétée ou compilée légèrement par C1 — bien plus lentement qu'en régime stabilisé. Une mesure prise sans préchauffage suffisant (voir la leçon précédente sur JMH) confond ces deux régimes.

> **Supposer qu'un appel polymorphe est toujours aussi coûteux.** Le JIT gère très bien les appels monomorphes (une seule implémentation observée) et raisonnablement bien les appels bimorphes (deux), avec des optimisations spéculatives. Le coût réel dépend du polymorphisme effectivement rencontré à l'exécution, pas du nombre d'implémentations possibles dans le code source.

### À retenir

- La JVM interprète d'abord, puis compile progressivement le code chaud : C1 (rapide, avec profilage) puis C2 (lent, très optimisant) pour les points chauds confirmés.
- Le JIT applique automatiquement inlining, élimination de code mort, déroulage de boucle et analyse d'échappement (avec remplacement scalaire) sur le code réellement chaud, à partir d'un profilage réel.
- La désoptimisation ramène une méthode à l'interprétation quand une hypothèse spéculative devient fausse, sans jamais compromettre la correction du programme.
- Réécrire du code « optimisé à la main » est souvent contre-productif : cela duplique un travail que le JIT fait déjà, avec moins d'informations que lui, et peut gêner ses propres optimisations.
- `-XX:+PrintCompilation` permet d'observer concrètement ce que compile le JIT plutôt que de le supposer ; le compromis démarrage rapide / optimisations du JIT rejoint les questions d'image native traitées au chapitre Modules et déploiement.

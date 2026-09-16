---
id: ramasse-miettes
chapitre: jvm-memoire
ordre: 3
titre: "Le ramasse-miettes"
termes:
  - terme: Atteignabilité (reachability)
    definition: "Principe utilisé par le ramasse-miettes Java pour décider ce qui est vivant : un objet est vivant s'il existe un chemin de références depuis une **racine de collecte** (variable locale sur une pile de thread, champ statique, référence JNI...) jusqu'à lui. Contrairement au comptage de références, ce principe gère naturellement les cycles d'objets qui ne sont plus atteignables depuis aucune racine."
  - terme: Hypothèse générationnelle
    definition: "Observation empirique selon laquelle **la plupart des objets meurent jeunes**, et ceux qui survivent longtemps ont tendance à survivre très longtemps. Elle justifie de séparer le tas en générations et de collecter la jeune génération beaucoup plus souvent que la vieille, pour un coût global bien moindre."
  - terme: Jeune génération / vieille génération
    definition: "Le tas est divisé en une **jeune génération** (où naissent les objets, collectée fréquemment par une collecte **mineure**) et une **vieille génération** (où survivent les objets ayant traversé plusieurs collectes mineures, collectée moins souvent, par une collecte **majeure**, plus coûteuse)."
  - terme: Pause « stop the world »
    definition: "Interruption de tous les threads applicatifs pendant qu'une partie du travail du ramasse-miettes s'exécute, pour garantir que l'état du tas ne change pas pendant cette étape. Les collecteurs modernes cherchent à réduire la fréquence et surtout la **durée** de ces pauses, sans pouvoir toujours les éliminer complètement."
  - terme: G1 (Garbage-First)
    definition: "Ramasse-miettes **par défaut** de la JVM depuis Java 9, qui découpe le tas en régions de taille égale et priorise la collecte des régions contenant le plus de mémoire récupérable (« garbage first »). Bon compromis entre débit et latence pour la grande majorité des applications."
  - terme: ZGC
    definition: "Ramasse-miettes conçu pour des pauses extrêmement courtes (de l'ordre de la milliseconde), quasiment indépendantes de la taille du tas, en réalisant la quasi-totalité de son travail **en parallèle** de l'application. Générationnel **par défaut** depuis Java 24 (le mode non générationnel a été retiré à cette version)."
  - terme: Collecteur Parallel
    definition: "Ramasse-miettes orienté **débit maximal** (throughput) : il utilise plusieurs threads pour collecter le plus vite possible, au prix de pauses stop-the-world plus longues que G1 ou ZGC. Adapté aux traitements par lots où la latence individuelle importe peu."
quiz:
  - question: "Quel est le principe que le ramasse-miettes de la JVM utilise pour décider qu'un objet peut être collecté ?"
    choix:
      - "Un compteur de références par objet : dès qu'il atteint zéro, l'objet est collecté immédiatement"
      - "L'atteignabilité depuis un ensemble de racines (piles de threads, champs statiques...) : un objet devient éligible à la collecte dès qu'aucun chemin de références ne mène plus à lui depuis aucune racine, cycles d'objets compris"
      - "L'ancienneté de l'objet : tout objet vivant depuis plus de 10 secondes est automatiquement collecté"
      - "La taille de l'objet : les objets de plus de 1 Ko sont collectés en priorité"
    reponse: 1
    explication: "Java n'utilise pas de comptage de références (contrairement à d'autres langages) : ce choix évite justement le problème classique des cycles d'objets qui se référencent mutuellement sans être atteignables depuis l'extérieur. Le GC part des racines et marque tout ce qui est atteignable ; ce qui ne l'est pas, cycles inclus, est récupéré."
  - question: "Quel est le ramasse-miettes utilisé par défaut si aucune option -XX:+Use...GC n'est précisée au lancement, sur une JVM récente (Java 25) ?"
    choix:
      - "Serial, car c'est historiquement le premier collecteur du JDK"
      - "G1 (Garbage-First), sélectionné par défaut sur la très large majorité des configurations matérielles et systèmes"
      - "ZGC, car c'est le plus moderne et le plus performant en toute situation"
      - "CMS (Concurrent Mark Sweep), qui reste le choix par défaut pour la compatibilité"
    reponse: 1
    explication: "G1 est le collecteur par défaut depuis Java 9. CMS a été supprimé du JDK (JEP 363, Java 14) : l'utiliser lève un avertissement et retombe sur le collecteur par défaut. ZGC n'est pas le défaut : il vise la latence minimale au prix d'un débit et d'une empreinte mémoire un peu moins favorables pour des charges qui n'en ont pas besoin — le choisir se justifie par un objectif de latence explicite, pas par principe."
  - question: "Une équipe appelle System.gc() explicitement dans son code au moment où elle sait que l'application est peu sollicitée, pour \"nettoyer\" la mémoire. Quel est le problème principal de cette pratique ?"
    code: |
      void apresGrosTraitement() {
          libererRessources();
          System.gc(); // "pour être sûr"
      }
    choix:
      - "System.gc() est une simple suggestion à la JVM, qui reste libre de l'ignorer ou de la retarder ; en dépendre pour la correction ou les performances du programme n'est pas fiable, et un appel systématique peut au contraire dégrader les performances en déclenchant des collectes majeures inutiles"
      - "System.gc() lève une exception si le tas contient encore des objets vivants"
      - "System.gc() ne fonctionne qu'avec le collecteur Serial"
      - "System.gc() libère immédiatement toute la mémoire du métaspace, mais jamais celle du tas"
    reponse: 0
    explication: "System.gc() n'est qu'une suggestion (Runtime.gc() a le même statut) : la JVM peut l'ignorer, et certaines configurations (-XX:+DisableExplicitGC) l'ignorent explicitement. En entretien, la bonne réponse est de ne jamais s'appuyer sur cet appel pour la correction du programme, et de se méfier de son usage répété qui peut provoquer des pauses stop-the-world coûteuses et inutiles plutôt que d'aider."
---

## Essentiel

Le ramasse-miettes (GC) libère automatiquement la mémoire des objets devenus inutiles. Son principe : un objet est vivant s'il est **atteignable** depuis une racine (variable locale sur une pile de thread, champ statique...) ; sinon, il est récupérable — y compris des cycles d'objets qui se référencent mutuellement, contrairement à un simple comptage de références.

La plupart des JVM modernes s'appuient sur l'**hypothèse générationnelle** : la majorité des objets meurent très jeunes. Le tas est donc divisé en une **jeune génération** (créée en continu, collectée souvent par une collecte **mineure**, rapide) et une **vieille génération** (objets ayant survécu à plusieurs collectes mineures, collectée plus rarement par une collecte **majeure**, plus coûteuse).

```java
void traiter(List<Commande> commandes) {
    for (Commande c : commandes) {
        Resume r = new Resume(c); // objet temporaire, mort dès la fin de l'itération
        journal.enregistrer(r.texte());
    }
}
// La grande majorité des objets "Resume" créés ici meurent dans la jeune génération,
// sans jamais atteindre la vieille génération.
```

Une collecte peut nécessiter une pause **stop-the-world**, où tous les threads applicatifs sont suspendus le temps que la JVM garantisse un état stable du tas. **G1** est le collecteur par défaut depuis Java 9, bon compromis débit/latence. Pour une latence minimale, **ZGC** (générationnel par défaut depuis Java 24) vise des pauses de l'ordre de la milliseconde. Pour un débit maximal sans contrainte de latence, **Parallel** reste pertinent. `System.gc()` n'est qu'une **suggestion** : ne jamais s'y fier pour la correction du programme.

## Détail

### Pourquoi c'est utile

Comprendre le fonctionnement du GC permet de choisir le bon collecteur selon l'objectif réel (débit vs latence), d'interpréter des pauses inattendues en production, et d'éviter les fausses bonnes idées comme appeler `System.gc()` par précaution.

### Exemple 1 — Collecte mineure et promotion

```text
Jeune génération : Eden + deux espaces "survivor" (S0, S1)
1. Les nouveaux objets naissent dans Eden.
2. Quand Eden est plein, une collecte mineure copie les objets encore vivants
   vers un espace survivor, et vide Eden entièrement (les objets morts ne sont
   même pas "supprimés" un par un : seuls les survivants sont copiés ailleurs).
3. Un objet qui survit à plusieurs collectes mineures consécutives est
   "promu" vers la vieille génération.
```

Cette stratégie de copie (plutôt qu'un balayage de tout Eden objet par objet) est ce qui rend les collectes mineures rapides : leur coût dépend surtout du nombre d'objets **survivants**, très faible selon l'hypothèse générationnelle — pas du nombre total d'objets alloués.

### Exemple 2 — Choisir un collecteur selon l'objectif

```bash
# Débit maximal (traitement par lots, peu sensible à la latence individuelle)
java -XX:+UseParallelGC -jar traitement-batch.jar

# Compromis par défaut, adapté à la majorité des applications serveur
java -XX:+UseG1GC -jar application.jar

# Latence minimale, tas volumineux, pauses quasi indépendantes de la taille du tas
java -XX:+UseZGC -jar service-temps-reel.jar
```

Sans aucune de ces options, la JVM sélectionne **G1** par défaut sur la grande majorité des configurations matérielles.

### Exemple 3 — ZGC générationnel

```bash
# Java 25 : ZGC est toujours générationnel, aucun flag supplémentaire nécessaire
java -XX:+UseZGC -jar service.jar
```

Ce comportement a évolué en plusieurs étapes : le mode générationnel de ZGC est apparu en Java 21 en option (`-XX:+ZGenerational`), est devenu le défaut en Java 23, puis le mode **non générationnel a été entièrement supprimé en Java 24** — depuis, ZGC est toujours générationnel, et le flag `ZGenerational` n'a plus d'effet.

### Exemple 4 — Lire un journal de GC

```bash
java -Xlog:gc -jar application.jar
```

```text
[0.512s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 48M->12M(256M) 3.201ms
```

Cette ligne se lit : à 0,512 s, une collecte mineure (`Pause Young`) sur G1 a réduit l'occupation du tas de 48 Mo à 12 Mo (sur un tas courant de 256 Mo), en 3,201 ms. Une succession de lignes où la mémoire libérée diminue progressivement, et où la fréquence des pauses augmente, est un signal d'alerte classique de pression mémoire croissante (voir la leçon suivante sur le diagnostic des fuites).

### Les collecteurs disponibles et leur profil

| Collecteur | Option | Profil |
|---|---|---|
| Serial | `-XX:+UseSerialGC` | Un seul thread, pauses les plus longues, empreinte minimale — adapté aux petites JVM ou environnements très contraints |
| Parallel | `-XX:+UseParallelGC` | Plusieurs threads de collecte, optimisé pour le **débit** global, pauses plus longues que G1 |
| G1 (Garbage-First) | `-XX:+UseG1GC` | **Par défaut** depuis Java 9 ; compromis équilibré débit/latence pour la majorité des applications |
| ZGC | `-XX:+UseZGC` | Pauses très courtes, quasi indépendantes de la taille du tas ; générationnel par défaut depuis Java 24 |

Shenandoah (pauses courtes également, approche différente de ZGC) existe dans le code source amont d'OpenJDK, mais n'est **pas distribué par Oracle** dans ses propres builds — il est fourni par d'autres distributions OpenJDK (Red Hat, Eclipse Adoptium, Azul...). Son mode générationnel est devenu une fonctionnalité produit supportée en Java 25.

### Pièges courants

> **Croire que System.gc() force une collecte immédiate.** C'est une suggestion, pas un ordre : la JVM reste libre de la retarder ou de l'ignorer, et certaines configurations l'ignorent explicitement (`-XX:+DisableExplicitGC`). S'appuyer dessus pour la correction du programme est un signal d'alerte en entretien.

> **Choisir ZGC "parce que c'est le plus récent et le plus rapide".** ZGC optimise la **latence**, pas nécessairement le débit global ni l'empreinte mémoire. Pour un traitement par lots sans contrainte de latence, Parallel peut offrir un meilleur débit total ; le bon choix dépend de l'objectif, pas de la nouveauté du collecteur.

> **Interpréter une collecte majeure isolée comme un problème.** Une collecte majeure occasionnelle, rapide, fait partie du fonctionnement normal. Le vrai signal d'alerte est une **fréquence croissante** de collectes qui libèrent de moins en moins de mémoire à chaque fois (voir `-Xlog:gc`) : c'est le symptôme typique d'une fuite mémoire.

### À retenir

- Le GC détermine ce qui est vivant par **atteignabilité** depuis des racines, pas par comptage de références — ce qui gère naturellement les cycles.
- L'hypothèse générationnelle (la plupart des objets meurent jeunes) justifie la séparation jeune/vieille génération et des collectes mineures bien moins coûteuses que les majeures.
- **G1** est le collecteur par défaut depuis Java 9 ; **ZGC** (générationnel par défaut depuis Java 24) vise la latence minimale ; **Parallel** vise le débit maximal.
- Choisir un collecteur, c'est arbitrer entre débit, latence et empreinte mémoire selon l'objectif réel de l'application — jamais "par défaut vers le plus récent".
- `System.gc()` n'est qu'une suggestion ; ne jamais en dépendre. `-Xlog:gc` permet de lire la fréquence et l'efficacité réelle des collectes.

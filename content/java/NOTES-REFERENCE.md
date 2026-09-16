# Java — Fiche de référence factuelle (état au 16 septembre 2026)

> Source unique pour rédacteurs de contenu pédagogique. Sources exclusivement officielles :
> openjdk.org (index des JEP et pages de JEP), dev.java, docs.oracle.com, oracle.com/java,
> education.oracle.com. Chaque affirmation de statut/version est accompagnée d'une URL source.
> Quand une information n'a pas pu être confirmée sur une source officielle, cela est marqué
> explicitement **NON CONFIRMÉ** et repris dans la dernière section.

**Repère de contexte important** : JDK 27 est sorti en disponibilité générale (GA) le **15 septembre 2026**,
soit la veille de la date de rédaction (16 septembre 2026). JDK 27 est donc la version la plus récente,
et JDK 25 (LTS, GA le 16 septembre 2025) est la dernière version LTS. Beaucoup de ressources externes
(non officielles) datées d'avant l'été 2026 peuvent encore présenter Java 21 ou 25 comme « la dernière
version » — ce n'est plus le cas.

---

## 1. Versions

### 1.1 Version la plus récente
**JDK 27** — GA le **15 septembre 2026** (version « feature release », non-LTS).
Source : [openjdk.org/projects/jdk/](https://openjdk.org/projects/jdk/), [openjdk.org/projects/jdk/27/](https://openjdk.org/projects/jdk/27/)

JEP livrées dans JDK 27 :

| JEP | Titre |
|---|---|
| 523 | Make G1 the Default Garbage Collector in All Environments |
| 527 | Post-Quantum Hybrid Key Exchange for TLS 1.3 |
| 531 | Lazy Constants (Third Preview) |
| 532 | Primitive Types in Patterns, instanceof, and switch (Fifth Preview) |
| 533 | Structured Concurrency (Seventh Preview) |
| 534 | Compact Object Headers by Default |
| 536 | JFR In-Process Data Redaction |
| 537 | Vector API (Twelfth Incubator) |
| 538 | PEM Encodings of Cryptographic Objects (Third Preview) |

### 1.2 Dernière version LTS et support
**JDK 25** — GA le **16 septembre 2025**.
Source : [openjdk.org/projects/jdk/25/](https://openjdk.org/projects/jdk/25/)

Dates de support Oracle (voir mise en garde ci-dessous) :

| Version LTS | GA | Fin Premier Support (Oracle) | Fin Extended Support (Oracle) |
|---|---|---|---|
| Java 8 | 18 mars 2014 | Mars 2022 | Décembre 2030 |
| Java 11 | 25 sept. 2018 | ~2023 (dépassé) | Janvier 2032 |
| Java 17 | 14 sept. 2021 | Septembre 2026 | Septembre 2029 |
| Java 21 | 19 sept. 2023 | Septembre 2028 | Septembre 2031 |
| Java 25 | 16 sept. 2025 | Septembre 2030 | Septembre 2033 |

**⚠️ Mise en garde méthodologique** : la page officielle `oracle.com/java/technologies/java-se-support-roadmap.html`
a renvoyé une erreur HTTP 403 lors des tentatives de récupération directe (y compris via le miroir UE). Les
dates ci-dessus proviennent d'extraits de moteur de recherche de cette même page officielle, cohérents entre
eux et avec le schéma connu (Premier Support = GA + 5 ans, Extended Support = fin Premier + 3 ans pour les
LTS depuis Java 17). **À vérifier manuellement sur la page live avant publication finale**, en particulier la
date « Java 17 : fin de Premier Support en septembre 2026 », qui tombe précisément ce mois-ci.

### 1.3 Cadence de publication
Confirmée par le **JEP 322 « Time-Based Release Versioning »** : cadence stricte de six mois, releases en
mars et en septembre de chaque année (ex. : mars 2018 = JDK 10, septembre 2018 = JDK 11...).
Source : [openjdk.org/jeps/322](https://openjdk.org/jeps/322)

Cette cadence s'est maintenue sans interruption jusqu'à JDK 27 (sept. 2026) : JDK 25 (sept. 2025) →
JDK 26 (17 mars 2026) → JDK 27 (15 sept. 2026) → JDK 28 en développement (prévu ~mars 2027).

### 1.4 Versions réellement utilisées en entreprise
Java 8, 11, 17, 21 et désormais 25 sont toutes des versions **LTS**. D'après des enquêtes tierces
(Azul « State of Java », JetBrains, New Relic, Snyk — **sources NON officielles, à utiliser avec prudence
dans un document qui se veut à sources officielles**) : Java 21 est en tête des déploiements en production
(~40-45 %), Java 17 proche derrière (~25-39 % selon l'enquête), Java 8/11 combinés sous ~20 % et en
déclin. Aucune donnée d'usage officielle (Oracle/OpenJDK) n'existe à ce sujet — **NON CONFIRMÉ par une
source officielle**, à présenter comme contexte informel seulement.
Sources (non officielles, à titre indicatif) : [JetBrains State of Java 2025](https://lp.jetbrains.com/the-state-of-java-2025/), [keyholesoftware.com Java Trends 2026](https://keyholesoftware.com/java-trends-2026/)

### 1.5 Tableau des versions marquantes

| Version | GA | LTS ? | Apports majeurs (vérifiés via l'index JEP) |
|---|---|---|---|
| **8** | 18 mars 2014 | Oui (traitée rétroactivement comme LTS) | JEP 126 Lambda Expressions ; JEP 107 Streams API ; JEP 150 nouvelle API Date/Heure (`java.time`) ; JEP 174 moteur JS Nashorn ; suppression de la PermGen |
| **11** | 25 sept. 2018 | Oui | JEP 321 HTTP Client (standard) ; JEP 323 `var` dans les paramètres de lambda ; JEP 181 Nest-Based Access Control ; JEP 333 ZGC (expérimental) ; JEP 318 Epsilon (GC no-op) |
| **17** | 14 sept. 2021 | Oui | JEP 409 Sealed Classes ; JEP 406 Pattern Matching for switch (preview) ; JEP 356 PRNG améliorés ; JEP 415 filtres de désérialisation contextuels ; JEP 411 dépréciation du Security Manager |
| **21** | 19 sept. 2023 | Oui | JEP 444 Threads virtuels ; JEP 440 Record Patterns ; JEP 441 Pattern Matching for switch (final) ; JEP 431 Sequenced Collections ; JEP 439 ZGC générationnel (opt-in) |
| **25** | 16 sept. 2025 | Oui | JEP 506 Scoped Values (final) ; JEP 511 Module Import Declarations (final) ; JEP 512 Compact Source Files & Instance Main Methods (final) ; JEP 513 Flexible Constructor Bodies (final) ; JEP 519 Compact Object Headers ; JEP 521 Shenandoah générationnel |
| **27** (dernière, non-LTS) | 15 sept. 2026 | Non | JEP 523 G1 par défaut partout ; JEP 527 échange de clés post-quantique pour TLS 1.3 ; JEP 534 en-têtes d'objets compacts par défaut ; JEP 536 rédaction des données JFR en cours de processus |

Sources : pages officielles `openjdk.org/projects/jdk/<version>/` pour chaque version listée.

---

## 2. Statut des fonctionnalités modernes

Tableau consolidé — chaque ligne vérifiée sur l'index JEP officiel (`openjdk.org/jeps/0`) et les pages de
JEP individuelles.

| # | Fonctionnalité | JEP(s) (chronologique) | Statut au 16/09/2026 | Version de finalisation (ou dernier preview) | Source |
|---|---|---|---|---|---|
| 1 | Records | 359 (preview, 14) → 384 (2e preview, 15) → **395 (final)** | **Finalisée** | **JDK 16** | [JEP 395](https://openjdk.org/jeps/395) |
| 2 | Classes scellées (sealed) | 360 (preview, 15) → 397 (2e preview, 16) → **409 (final)** | **Finalisée** | **JDK 17** | [JEP 409](https://openjdk.org/jeps/409) |
| 3 | Filtrage par motif pour `instanceof` | 305 (preview, 14) → 375 (2e preview, 15) → **394 (final)** | **Finalisée** | **JDK 16** | [JEP 394](https://openjdk.org/jeps/394) |
| 4 | Filtrage par motif pour `switch` | 406 → 420 → 427 → 433 → **441 (final)** | **Finalisée** | **JDK 21** | [JEP 441](https://openjdk.org/jeps/441) |
| 5 | Motifs de record (record patterns) | 405 (preview, 19) → 432 (2e preview, 20) → **440 (final)** | **Finalisée** | **JDK 21** | [JEP 440](https://openjdk.org/jeps/440) |
| 6 | Blocs de texte (text blocks) | 355 → 368 → **378 (final)** | **Finalisée** | **JDK 15** | [JEP 378](https://openjdk.org/jeps/378) |
| 7 | `var` (inférence de type locale) | **286 (final — sans cycle preview)** | **Finalisée** | **JDK 10** | [JEP 286](https://openjdk.org/jeps/286) |
| 8 | Threads virtuels (virtual threads) | 425 (preview, 19) → 436 (2e preview, 20) → **444 (final)** | **Finalisée** | **JDK 21** | [JEP 444](https://openjdk.org/jeps/444) |
| 9 | Concurrence structurée (structured concurrency) | 428/437 (incubator, 19-20) → 453 → 462 → 480 → 499 → 505 → 525 → **533 (7e preview, JDK 27)** ; finalisation proposée par le **JEP 543 (candidat)** pour JDK 28 | **Toujours en preview — PAS finalisée.** JEP 543 (finalisation « sans changement ») n'a que le statut « Candidate », visant JDK 28 (non encore sorti) | Dernier preview : **JDK 27** (7e preview). Finalisation attendue mais **non confirmée** pour JDK 28 | [JEP 533](https://openjdk.org/jeps/533), [JEP 543](https://openjdk.org/jeps/543) |
| 10 | Valeurs de portée (scoped values) | 429 (incubator, 20) → 446 → 464 → 481 → 487 → **506 (final)** | **Finalisée** | **JDK 25** | [JEP 506](https://openjdk.org/jeps/506) |
| 11 | Collections séquencées (sequenced collections) | **431 (final — sans cycle preview)** | **Finalisée** | **JDK 21** | [JEP 431](https://openjdk.org/jeps/431) |
| 12 | API Vector | 338 → 414 → 417 → 426 → 438 → 448 → 460 → 469 → 489 → 508 → 529 → **537 (12e incubator, JDK 27)** | **Toujours en incubation** — n'est jamais sortie de l'incubateur (JDK 16 → 27) ; explicitement bloquée sur les progrès du projet Valhalla, selon le texte même du JEP | Dernier incubator : **JDK 27**. Aucune date de sortie d'incubation confirmée | [JEP 537](https://openjdk.org/jeps/537) |
| 13 | Gatherers de streams | 461 (preview, 22) → 473 (2e preview, 23) → **485 (final)** | **Finalisée** | **JDK 24** | [JEP 485](https://openjdk.org/jeps/485) |
| 14 | Corps de constructeur flexibles (flexible constructor bodies) | 447 (preview, 22, « Statements before super(...) ») → 482 (2e preview, 23) → 492 (3e preview, 24) → **513 (final)** | **Finalisée** | **JDK 25** | [JEP 513](https://openjdk.org/jeps/513) |
| 15 | Déclarations d'import de module | 476 (preview, 23) → 494 (2e preview, 24) → **511 (final)** | **Finalisée** | **JDK 25** | [JEP 511](https://openjdk.org/jeps/511) |
| 16 | Fichiers source compacts et méthodes `main` d'instance | 445 (preview, 21, « Unnamed Classes and Instance Main Methods ») → 463 (2e preview, 22) → 477 (3e preview, 23) → 495 (4e preview, 24) → **512 (final)** | **Finalisée** | **JDK 25** | [JEP 512](https://openjdk.org/jeps/512) |
| 17 | Motifs sur types primitifs (dans les patterns, `instanceof`, `switch`) | 455 (preview, 23) → 488 (2e preview, 24) → 507 (3e preview, 25) → 530 (4e preview, 26) → **532 (5e preview, JDK 27)** | **Toujours en preview — PAS finalisée.** Nécessite `--enable-preview` même en JDK 27. Aucun JEP de finalisation déposé à ce jour | Dernier preview : **JDK 27** | [JEP 532](https://openjdk.org/jeps/532) |
| 18 | **Modèles de chaînes (string templates)** | 430 (preview, 21) → 459 (2e preview, 22) → 465 (3e preview annoncé, puis **retiré**) | **Retirée / abandonnée.** N'a jamais été livrée en JDK 23 ou après. Aucun JEP successeur déposé au 16/09/2026 | **Retiré avant la sortie de JDK 23** (2024). Statut officiel du JEP 465 : « Closed / Withdrawn » | [JEP 465](https://openjdk.org/jeps/465) |

**Points clés pour les rédacteurs** :
- La **concurrence structurée** et les **motifs sur types primitifs** sont les deux seules fonctionnalités
  « modernes attendues » qui ne sont **toujours pas finalisées** à ce jour (16/09/2026) — ne pas les
  présenter comme acquises, même si elles sont très avancées (7e et 5e previews).
- L'**API Vector** ne doit jamais être présentée comme « bientôt finalisée » : elle est explicitement liée
  à l'avancement du projet Valhalla (types valeurs), qui lui-même n'a pas encore de fonctionnalité cœur
  finalisée (voir section 3).
- Les **modèles de chaînes (string templates)** doivent être présentés comme **retirés définitivement**
  (et non « en pause » ou « en cours de redesign ») — aucune reprise du projet n'est confirmée à ce jour.
- Toutes les fonctionnalités « classiques » modernes (records, sealed classes, pattern matching
  instanceof/switch, record patterns, text blocks, `var`, threads virtuels, sequenced collections) sont
  finalisées depuis JDK 10–21 et n'ont subi aucun changement de statut depuis.
- JDK 25 (LTS) a été une version particulièrement riche pour Project Amber : 4 finalisations d'un coup
  (scoped values, module imports, compact source files, flexible constructor bodies).

---

## 3. Projets en cours (Loom, Valhalla, Panama, Amber)

### 3.1 Project Loom (concurrence)
Source : [openjdk.org/projects/loom](https://openjdk.org/projects/loom)

**Livré (finalisé)** :
- Threads virtuels — JEP 444, **JDK 21**
- Valeurs de portée (scoped values) — JEP 506, **JDK 25**

**En cours (preview)** :
- Concurrence structurée — JEP 533, **7e preview, JDK 27**. Historique complet : JEP 428/437 (incubator,
  19-20), 453 (21), 462 (22), 480 (23), 499 (24), 505 (25), 525 (26), 533 (27).

**Feuille de route** :
- Un JEP candidat (**JEP 543**, ex-draft 8389757) propose de finaliser la concurrence structurée « sans
  changement » dans **JDK 28** — c'est une proposition, pas encore livrée. **À traiter comme « attendu mais
  non confirmé »**.
- Une fois la concurrence structurée finalisée, le trio historique de Loom (threads virtuels + scoped
  values + concurrence structurée) sera complet. L'API de continuation publique n'a jamais été exposée
  publiquement — c'est un mécanisme interne, pas une fonctionnalité livrée.
Sources : [JEP 533](https://openjdk.org/jeps/533), [JEP 543](https://openjdk.org/jeps/543)

### 3.2 Project Valhalla (types valeurs / généricité spécialisée)
Source : [openjdk.org/projects/valhalla](https://openjdk.org/projects/valhalla)

**Livré (finalisé)** — uniquement des JEP préparatoires, pas le cœur du projet :
- JEP 390 Warnings for Value-Based Classes (JDK 16)
- JEP 371 Hidden Classes (JDK 15)
- JEP 334 JVM Constants API (JDK 12)
- JEP 309 Dynamic Class-File Constants (JDK 11)
- JEP 181 Nest-Based Access Control (JDK 11)

**En preview pour la première fois (mais pas encore livré en GA)** :
- **JEP 401 « Value Objects » (preview)** — intégré pour **JDK 28** (attendu ~mars 2027), **absent de
  JDK 27**. C'est le premier preview d'une fonctionnalité cœur de Valhalla après environ 12 ans de
  développement.
- **JEP 539 « Strict Field Initialization in the JVM » (preview)** — également intégré pour JDK 28.
- Des builds « early-access » de JDK 28 permettent déjà d'expérimenter ces fonctionnalités
  (jdk.java.net/28/).

**Pas encore livré, même en preview** :
- « Null-Restricted and Nullable Types » (syntaxe `!`/`?`) — toujours au stade de **JEP draft**
  (8303099), pas encore un JEP candidat numéroté intégré à une version.
- « Enhanced Primitive Boxing » — JEP 402, toujours au stade draft.
- La feuille de route complète (types valeurs, stockage null-restricted, tableaux améliorés,
  unification primitifs/classes, JVM paramétrique) reste très majoritairement non livrée au 16/09/2026.

**Conclusion** : **aucune fonctionnalité cœur de Valhalla n'est finalisée** dans une version livrée au
16/09/2026 ; le premier preview (JEP 401) n'est qu'intégré pour JDK 28, pas encore sorti.
Sources : [openjdk.org/projects/valhalla/value-objects](https://openjdk.org/projects/valhalla/value-objects), [openjdk.org/jeps/8303099](https://openjdk.org/jeps/8303099)

### 3.3 Project Panama (interop native, mémoire, vectorisation)
Source : [openjdk.org/projects/panama](https://openjdk.org/projects/panama)

**Livré (finalisé)** :
- **API Foreign Function & Memory (FFM)** — JEP 454, finalisée en **JDK 22** (mars 2024), après 2
  incubators et 3 previews (JEP 412, 419, 424, 434, 442, puis 454 final).

**En cours (incubation)** :
- **API Vector** — JEP 537, **12e incubator, JDK 27**. Explicitement bloquée sur la disponibilité des
  types valeurs de Project Valhalla, selon le texte du JEP lui-même — ne pas annoncer de date de sortie
  d'incubation.
Sources : [JEP 454](https://openjdk.org/jeps/454), [JEP 537](https://openjdk.org/jeps/537)

### 3.4 Project Amber (évolutions du langage)
Source : [openjdk.org/projects/amber](https://openjdk.org/projects/amber)

**Livré (finalisé)**, JDK 10 à 25 : `var` (JEP 286), lambda params `var` (JEP 323), switch expressions
(JEP 361), text blocks (JEP 378), pattern matching `instanceof` (JEP 394), records (JEP 395), sealed
classes (JEP 409), record patterns (JEP 440), pattern matching `switch` (JEP 441), variables/motifs
non nommés (JEP 456), lancement de programmes multi-fichiers (JEP 458), module import declarations
(JEP 511), compact source files & instance main methods (JEP 512), flexible constructor bodies (JEP 513).

**En preview** :
- Motifs sur types primitifs — JEP 532, **5e preview, JDK 27**.
- « Derived Record Creation » — JEP 468, toujours au stade **Candidate**, pas encore prévisualisé dans
  une version livrée.

**En pause** (selon la page officielle du projet) : JEP 301 Enhanced Enums, JEP 302 Lambda Leftovers,
JEP 348 Java Compiler Intrinsics for JDK APIs.

**Retiré, confirmé** :
- **Modèles de chaînes (string templates)** — JEP 465 (3e preview), retiré avant la sortie de JDK 23,
  après critiques substantielles de la communauté sur la conception. Non réapparu depuis.
- JEP 326 Raw String Literals — retiré plus tôt, remplacé par les text blocks (JEP 378).

**Remarque** : « Lazy Constants » (JEP 531, 3e preview en JDK 27, ex-« Stable Values » JEP 502/526) n'est
**pas listé sur la page officielle du projet Amber** — c'est une API de bibliothèque (`java.lang`), pas
une fonctionnalité de langage Amber, malgré la proximité thématique (immutabilité).

---

## 4. Ramasse-miettes (Garbage Collectors)

### 4.1 GC disponibles aujourd'hui
D'après le guide officiel Oracle GC Tuning pour JDK 25 :
1. **Serial Collector** (`-XX:+UseSerialGC`)
2. **Parallel Collector** (`-XX:+UseParallelGC`)
3. **G1 (Garbage-First)** (`-XX:+UseG1GC`)
4. **ZGC (Z Garbage Collector)** (`-XX:+UseZGC`)

**Shenandoah n'apparaît PAS** dans la documentation officielle Oracle ni dans les builds Oracle
JDK/OpenJDK — Oracle n'a jamais distribué Shenandoah dans ses propres builds. Shenandoah existe dans le
code source amont d'OpenJDK et est distribué par d'autres fournisseurs de builds (Red Hat, Eclipse
Adoptium, Azul, etc.).

**Epsilon** (GC no-op, JEP 318, JDK 11) existe toujours dans le code source mais son statut exact dans
la documentation officielle Oracle pour JDK 25/27 n'a **pas été reconfirmé** — **NON CONFIRMÉ**.
Source : [docs.oracle.com/en/java/javase/25/gctuning/available-collectors.html](https://docs.oracle.com/en/java/javase/25/gctuning/available-collectors.html)

### 4.2 GC par défaut
**G1** est le GC par défaut aujourd'hui (« G1 is selected by default on most hardware and operating
system configurations », selon la documentation Oracle).

Depuis **JDK 27**, ce choix est devenu universel grâce au **JEP 523 « Make G1 the Default Garbage
Collector in All Environments »** : il supprime l'ancienne exception qui faisait de Serial le GC par
défaut sur les environnements très contraints (mono-CPU ou &lt;1792 Mo de RAM), exception qui existait
depuis JDK 9. **Depuis JDK 27, G1 est le GC par défaut partout, sans exception.**
Source : [JEP 523](https://openjdk.org/jeps/523)

### 4.3 ZGC générationnel
- **JEP 439 « Generational ZGC »** — livré en **JDK 21** (sept. 2023), en mode **opt-in**
  (`-XX:+UseZGC -XX:+ZGenerational`). Le mode non-générationnel restait le défaut si seul
  `-XX:+UseZGC` était précisé.
- **JEP 474 « ZGC: Generational Mode by Default »** — livré en **JDK 23** (sept. 2024). Le flag
  `ZGenerational` bascule par défaut de `false` à `true` ; l'option est aussi dépréciée (puisqu'il n'y a
  plus de choix à faire).
- **JEP 490 « ZGC: Remove the Non-Generational Mode »** — livré en **JDK 24** (mars 2025). Le mode
  non-générationnel est **entièrement supprimé** ; le flag `ZGenerational` devient obsolète (ignoré, avec
  avertissement) — seul le mode générationnel s'exécute désormais, quel que soit le flag utilisé.

Séquence à retenir : JDK 21 (introduction, opt-in) → JDK 23 (devient le défaut) → JDK 24 (mode
non-générationnel supprimé).
Sources : [JEP 439](https://openjdk.org/jeps/439), [JEP 474](https://openjdk.org/jeps/474), [JEP 490](https://openjdk.org/jeps/490)

### 4.4 Suppressions récentes
- **CMS (Concurrent Mark Sweep)** — supprimé via **JEP 363**, livré en **JDK 14** (mars 2020). Utiliser
  `-XX:+UseConcMarkSweepGC` aujourd'hui produit un avertissement (« support was removed ») et retombe sur
  le GC par défaut.
  Source : [JEP 363](https://openjdk.org/jeps/363)
- **Mode non-générationnel de ZGC** — supprimé en JDK 24 (voir 4.3, JEP 490).

### 4.5 Shenandoah générationnel (complément)
**JEP 521 « Generational Shenandoah »** — livré en **JDK 25** (sept. 2025) : le mode générationnel de
Shenandoah passe du statut expérimental à celui de fonctionnalité produit supportée (ne nécessite plus
`-XX:+UnlockExperimentalVMOptions`). Cela ne change **pas** le comportement par défaut de Shenandoah
(le mode mono-génération reste son défaut) — et pour rappel, Shenandoah n'est pas distribué par Oracle
lui-même (voir 4.1).
Source : [JEP 521](https://openjdk.org/jeps/521)

---

## 5. Certifications Oracle Java

**⚠️ Note méthodologique** : le domaine `education.oracle.com` était **indisponible** au moment de la
rédaction (page « Our website is currently down for maintenance » sur l'ensemble du site, y compris le
catalogue de certifications et les pages d'examen). Les informations ci-dessous ont donc été vérifiées
sur d'autres propriétés Oracle de premier niveau, elles aussi officielles et interconnectées depuis
`oracle.com` : **oracle.com/education/certification/** et **mylearn.oracle.com** (plateforme
d'apprentissage/examens d'Oracle University, pied de page « © 2026 Oracle University »). **Il est
recommandé de revérifier directement sur education.oracle.com dès que le site sera de nouveau
accessible.**

### 5.1 Réponse à la question clé : existe-t-il un examen plus récent que le 1Z0-830 ?

**Oui.** Oracle a sorti une certification plus récente que « Java SE 21 Developer Professional » (1Z0-830) :

- **Nom de l'examen** : Java SE 25 Developer Professional
- **Code d'examen** : **1Z0-831**
- **Nom du badge/credential** : « Oracle Certified Professional: Java SE 25 Developer »
- **Version Java couverte** : Java SE 25 (JDK 25, LTS, sorti le 16 septembre 2025)
- **Format** : examen en ligne surveillé, choix multiples, 120 minutes, score de réussite 68 %
- **Prérequis** : aucun — examen unique, pas de niveau Associate préalable requis
Sources : [oracle.com/education/certification/](https://www.oracle.com/education/certification/), [mylearn.oracle.com — Java SE 25 Developer Professional (1Z0-831)](https://mylearn.oracle.com/ou/exam/java-se-25-developer-professional-1z0-831/105037/161532/270890), corroboré par recherche web (page listée : [education.oracle.com/products/trackp_JSE25OCP](https://education.oracle.com/products/trackp_JSE25OCP), inaccessible au moment de la vérification directe)

### 5.2 Certifications Java actuellement proposées par Oracle (état au 16/09/2026)

Toutes les certifications « SE Developer » listées ci-dessous sont des **examens uniques** (pas de
structure Associate → Professional en plusieurs examens), niveau Professional :

| Certification | Code d'examen | Version Java couverte | Statut |
|---|---|---|---|
| Java SE 25 Developer Professional | **1Z0-831** | Java SE 25 (LTS) | **Active — la plus récente** |
| Java SE 21 Developer Professional | **1Z0-830** | Java SE 21 (LTS) | Active — aucune date de retrait annoncée à ce jour |
| Java SE 17 Developer | **1Z0-829** | Java SE 17 (LTS) | Active — **retrait annoncé au 28 février 2027** |
| Java SE 11 Developer | **1Z0-819** | Java SE 11 (LTS) | Active — **retrait annoncé au 30 novembre 2026** |
| Java Foundations | 1Z0-811 (variante 1Z0-811-CHS) | Niveau d'entrée, non lié à une version SE précise | Active (palier « Foundations » distinct, pas un prérequis pour les examens SE Professional) |

Ancienne filière Java 8 en deux examens (toujours active mais en fin de vie) :

| Certification | Code d'examen | Statut |
|---|---|---|
| Java SE 8 Programmer I (Associate/OCA) | 1Z0-808 | Active — **retrait annoncé au 30 novembre 2026** |
| Java SE 8 Programmer II (Professional/OCP) | 1Z0-809 | Active — **retrait annoncé au 30 novembre 2026** (nécessite 1Z0-808 en prérequis) |

### 5.3 Certifications retirées / en cours de retrait

- **1Z0-815** (Java SE: Programmer I) et **1Z0-816** (Java SE: Programmer II) — **déjà retirées**,
  remplacées par l'examen Java SE 11 Developer (1Z0-819). Confirmé littéralement sur la page du parcours
  « Become a Java SE 11 Developer » de MyLearn Oracle : *« The Java SE: Programmer I (1Z0-815) and Java SE:
  Programmer II (1Z0-816) exams have been retired. They are replaced by the new exam Java SE 11 Developer
  (1Z0-819). »*
- **1Z0-808 / 1Z0-809** (Java SE 8, Associate/Professional) — pas encore retirés, mais retrait officiel
  annoncé pour le **30 novembre 2026**.
- **1Z0-819** (Java SE 11 Developer) — pas encore retiré, retrait annoncé pour le **30 novembre 2026**.
- **1Z0-829** (Java SE 17 Developer) — pas encore retiré, retrait annoncé pour le **28 février 2027**.
- **1Z0-830** (Java SE 21 Developer Professional) — aucune annonce de retrait constatée à ce jour ; reste
  pleinement actif. **NON CONFIRMÉ** qu'aucune date de retrait future ne soit déjà planifiée en interne
  chez Oracle sans être encore affichée publiquement.

Ces dates de retrait proviennent des bandeaux « Important Update » présents directement sur les pages de
parcours d'apprentissage MyLearn Oracle pour chaque certification — c'est le mécanisme d'annonce officiel
équivalent à ce qui apparaîtrait sur le catalogue education.oracle.com si le site avait été accessible.

### 5.4 Schéma de nommage actuel

Oracle s'est éloigné du branding « OCA »/« OCP » comme nom public principal des examens (ces sigles
subsistent de façon informelle dans certains titres de modules de cours). Le schéma actuel, confirmé sur
les pages Oracle en ligne :

- **Nom de l'examen** : « Java SE `<version>` Developer Professional » (ex. « Java SE 25 Developer
  Professional », « Java SE 21 Developer Professional ») — pour les versions 17 et 11, le titre de la page
  omet le mot « Professional » (« Java SE 17 Developer », « Java SE 11 Developer ») bien qu'il s'agisse
  d'examens de niveau Professional.
- **Nom du badge/credential** : « Oracle Certified Professional: Java SE `<version>` Developer » (ex.
  « Oracle Certified Professional: Java SE 25 Developer », confirmé comme nom de certification associée
  sur la page d'examen MyLearn du 1Z0-831).
- La segmentation actuelle des niveaux de certification Oracle (selon oracle.com/education/certification/)
  est désormais **Foundations / Associate / Professional**, et non plus OCA/OCP.
- Nuance confirmée par une seconde recherche indépendante (résultats d'indexation de
  education.oracle.com) : le sigle **« OCP » subsiste encore dans les URL et titres des pages de
  « parcours » (track)** — ex. `trackp_JSE25OCP`, `trackp_JSE21OCP` — alors que les pages d'examen
  elles-mêmes utilisent le nom sans OCA/OCP (« Java SE 25 Developer Professional »). Les parcours Java 8
  (1Z0-808/1Z0-809) conservent le plus explicitement l'ancien branding « OCA »/« OCP » dans leurs titres.
  La transition de nommage est donc plus nette à partir des parcours Java 17/21/25 que sur les parcours
  Java 8/11, qui gardent des traces de l'ancien système.

Sources consultées pour la section 5 : [oracle.com/education/certification/](https://www.oracle.com/education/certification/), [mylearn.oracle.com/ou/exam/java-se-25-developer-professional-1z0-831/105037/161532/270890](https://mylearn.oracle.com/ou/exam/java-se-25-developer-professional-1z0-831/105037/161532/270890), [mylearn.oracle.com/ou/learning-path/become-a-java-se-21-developer/138845](https://mylearn.oracle.com/ou/learning-path/become-a-java-se-21-developer/138845), [mylearn.oracle.com/ou/learning-path/become-a-java-se-17-developer/99487](https://mylearn.oracle.com/ou/learning-path/become-a-java-se-17-developer/99487), [mylearn.oracle.com/ou/learning-path/become-a-java-se-11-developer/79141](https://mylearn.oracle.com/ou/learning-path/become-a-java-se-11-developer/79141), [mylearn.oracle.com/ou/learning-path/java-se-8-programmer-associate/40821](https://mylearn.oracle.com/ou/learning-path/java-se-8-programmer-associate/40821), [mylearn.oracle.com/ou/learning-path/java-se-8-programmer-professional/40816](https://mylearn.oracle.com/ou/learning-path/java-se-8-programmer-professional/40816)

---

## 6. API dépréciées ou à éviter en 2026

| API | Statut exact au 16/09/2026 | JEP(s) | À utiliser à la place |
|---|---|---|---|
| Sérialisation Java (`Serializable`, `ObjectInputStream`/`ObjectOutputStream`) | **Pas supprimée**, mais officiellement déconseillée pour les données non fiables et renforcée par des filtres. JEP 290 (JDK 9) : filtres globaux JVM. **JEP 415 « Context-Specific Deserialization Filters »**, finalisé en **JDK 17**, ajoute des filtres par flux (`jdk.serialFilterFactory`). Aucun JEP ne supprime la sérialisation elle-même | JEP 290 (9), JEP 415 (17, final) | `ObjectInputFilter` / `jdk.serialFilterFactory` si la sérialisation native est incontournable ; sinon formats non natifs (JSON, Protobuf, etc.) pour tout nouveau code |
| `Object.finalize()` | **Dépréciée pour suppression** depuis **JDK 18** (JEP 421, Closed/Delivered) — annotée `@Deprecated(forRemoval=true)`. **Toujours activée par défaut** au 16/09/2026 (JDK 27) ; aucune date de suppression complète annoncée. Note : `ThreadPoolExecutor.finalize()` (override vide) a lui été **supprimé en JDK 27** | JEP 421 (18) | Try-with-resources, ou `java.lang.ref.Cleaner` |
| `SecurityManager` | **Dépréciée pour suppression depuis JDK 17** (JEP 411). **Désactivée (non fonctionnelle) depuis JDK 24** (JEP 486, Closed/Delivered Release 24) : `-Djava.security.manager` provoque une erreur au lancement, `System.setSecurityManager()` lève `UnsupportedOperationException`. **Pas encore totalement supprimée de l'API** au 16/09/2026 — un stub minimal subsiste pour compatibilité source/binaire ; suppression complète prévue « dans une future version », non planifiée précisément | JEP 411 (17), JEP 486 (24) | Aucun remplacement direct dans le JDK ; repenser l'isolation via des mécanismes OS/conteneurs, ou des solutions applicatives |
| `java.util.Date` / `java.util.Calendar` | **Pas dépréciées comme classes**, pas ciblées par un JEP de suppression. Officiellement supplantées par `java.time` (JSR 310) depuis **Java SE 8**. Statut stable : « déconseillées mais supportées indéfiniment », pas « dépréciées pour suppression » | — | `java.time` (`LocalDate`, `LocalDateTime`, `Instant`, etc.) |
| `Thread.stop()` / `Thread.suspend()` / `Thread.resume()` | Dépréciées depuis JDK 1.2 (1998). **`suspend()`/`resume()` : le comportement a été supprimé (lève désormais `UnsupportedOperationException`) depuis JDK 20** (JDK-8294320). `stop()` (sans argument) a été neutralisé de façon similaire (lève `UnsupportedOperationException` depuis JDK 20), puis **entièrement supprimée en JDK 26** : le code qui l'appelle ne compile plus, et un binaire ancien lève `NoSuchMethodError` sur un JDK 26 ou plus récent (JDK-8368370, vérifié le 16/09/2026 sur bugs.openjdk.org). La surcharge `stop(Throwable)` avait été supprimée plus tôt | JDK-8294320 (20), JDK-8368370 (26) | `java.util.concurrent` (`ExecutorService`), interruption coopérative via `Thread.interrupt()`, `wait`/`notify`, annulation de haut niveau |
| API Applet | Dépréciée pour suppression via **JEP 398** (JDK 17). Suppression effective visée par le **JEP 504 « Remove the Applet API »**, rendue possible par la désactivation de SecurityManager (JEP 486, JDK 24). **Statut exact/version de suppression non vérifié directement sur la page du JEP — NON CONFIRMÉ**, à vérifier sur `openjdk.org/jeps/504` avant publication | JEP 398 (17), JEP 504 (à confirmer) | — (API obsolète, sans remplacement — les applets ne sont plus un modèle web viable) |
| RMI Activation | Rendue optionnelle en Java 8, dépréciée pour suppression via **JEP 385** (JDK 15), **supprimée via JEP 407 en JDK 17** (le reste de RMI n'est pas affecté) | JEP 385 (15), JEP 407 (17) | — |
| `java.lang.Compiler` | Dépréciée pour suppression depuis JDK 9, **supprimée en JDK 21** (JDK-8304458) | — (bug JDK-8304458) | Sans objet (classe legacy non fonctionnelle) |

---

## 7. Outils

| Outil | Version stable actuelle (16/09/2026) | Exigence JDK minimale | Source |
|---|---|---|---|
| JUnit | **JUnit 6.1.3** (sortie le 7 août 2026) — nouvelle génération qui unifie Platform/Jupiter/Vintage sous un seul numéro de version depuis JUnit 6 (sept. 2025). **Ligne JUnit 5 toujours maintenue en LTS** pour les projets bloqués sur Java 8/11 : dernière version confirmée **5.14.2** (6 janvier 2026) | JUnit 6.x nécessite **Java 17+** ; JUnit 5.x LTS reste utilisable avec des JDK plus anciens | [junit.org/junit5](https://junit.org/junit5/), [docs.junit.org](https://docs.junit.org/) |
| Apache Maven | **Maven 3.9.16** (branche 3.x, stable). **Maven 4 n'est pas encore GA** au 16/09/2026 : dernière version candidate **4.0.0-rc-6** | Maven 3.9.x : JDK 8+ pour l'exécution (peut cibler d'autres versions via toolchains). **Maven 4 (à venir) exigera JDK 17+** pour s'exécuter | [maven.apache.org/download.cgi](https://maven.apache.org/download.cgi) |
| Gradle | **Gradle 9.7.1** (sortie le 19 août 2026) | Nécessite un JVM **17 à 26** pour exécuter le démon Gradle. **JDK 27 (tout juste sorti) n'est pas encore supporté pour exécuter Gradle lui-même** — seules les toolchains permettent de compiler/tester en ciblant JDK 27 | [gradle.org/releases](https://gradle.org/releases/), [docs.gradle.org/current/userguide/compatibility.html](https://docs.gradle.org/current/userguide/compatibility.html) |
| JMH (Java Microbenchmark Harness) | **jmh-core 1.37** (publié le 3 août 2023) — **aucune nouvelle version depuis plus de 3 ans** au 16/09/2026 | Pas de plafond JDK officiellement documenté — **NON CONFIRMÉ** | [repo1.maven.org (métadonnées jmh-core)](https://repo1.maven.org/maven2/org/openjdk/jmh/jmh-core/maven-metadata.xml) |

**Points de vigilance de compatibilité avec les JDK récents** :
- **Gradle 9.x ne peut pas encore s'exécuter sur JDK 27** (démon limité à JVM ≤26) — piège classique pour
  qui installe le tout dernier JDK le jour de sa sortie ; utiliser les toolchains Gradle pour cibler JDK 27
  en gardant Gradle lui-même sur un JDK ≤26.
- **Maven 3.9.x** n'a pas de plafond JDK connu pour son exécution ; via toolchains, il peut cibler
  n'importe quelle version indépendamment du JDK qui l'exécute.
- **Maven 4** (encore en RC) relève l'exigence minimale d'exécution de Maven lui-même à **JDK 17+** — un
  changement de palier important une fois la version GA publiée.
- **JUnit 6 / JUnit Jupiter exige désormais Java 17+ au minimum** — tout code/support de cours ciblant
  Java 8/11 doit rester sur la ligne LTS JUnit 5.14.x.
- **JMH 1.37** date d'avant la période récente de renouvellement de l'outillage JDK 17+ ; aucune
  affirmation de plafond JDK précis n'a été trouvée sur une source officielle — à traiter comme
  **NON CONFIRMÉ**.

---

## Points non confirmés

Les éléments suivants n'ont **pas pu être vérifiés directement** sur une source officielle malgré les
tentatives de recherche, et doivent être revérifiés manuellement avant publication finale :

1. **Dates exactes de fin de support Oracle (Premier/Extended)** pour Java 8/11/17/21/25 — la page
   officielle `oracle.com/java/technologies/java-se-support-roadmap.html` a renvoyé une erreur HTTP 403
   lors des tentatives de récupération automatisée ; les dates du tableau en section 1.2 proviennent
   d'extraits de recherche cohérents mais non lus directement sur la page source. **À vérifier
   manuellement dans un navigateur.**
2. **Statut d'Epsilon (GC no-op, JEP 318)** dans la documentation officielle Oracle GC Tuning pour
   JDK 25/27 — non reconfirmé comme « collecteur supporté » ou non dans l'extrait récupéré.
3. **JEP 504 « Remove the Applet API »** — statut exact (« Status: » et « Release: ») non vérifié par
   lecture directe de la page `openjdk.org/jeps/504` ; à confirmer avant publication.
4. **JUnit 5.14.4** — mentionné par un résumé de recherche mais non confirmé par lecture directe d'une
   page officielle docs.junit.org ; seule la version **5.14.2** (6 janvier 2026) a été confirmée
   directement sur docs.junit.org.
5. **Statistiques d'adoption des versions Java en entreprise** (répartition Java 8/11/17/21) — issues
   d'enquêtes tierces (Azul, JetBrains, New Relic, Snyk), **non officielles** ; aucune donnée équivalente
   n'a été trouvée sur une source Oracle/OpenJDK officielle. À présenter uniquement comme contexte
   informel, jamais comme fait vérifié.
6. **Section 5 (Certifications Oracle Java)** — `education.oracle.com` (le catalogue officiel demandé
   comme source primaire) était **indisponible** au moment de la rédaction (page de maintenance sur
   l'ensemble du site). Les données ont été corroborées sur `oracle.com/education/certification/` et
   `mylearn.oracle.com` (propriétés Oracle de premier niveau, mais pas le catalogue education.oracle.com
   lui-même). **À revérifier directement sur education.oracle.com dès que le site sera accessible**,
   notamment : l'absence de date de retrait pour le 1Z0-830 (Java SE 21), et les dates précises de retrait
   du 1Z0-808/809 (30 nov. 2026), du 1Z0-819 (30 nov. 2026) et du 1Z0-829 (28 févr. 2027).
7. **Plafond de version JDK supportée par JMH** — aucune déclaration officielle trouvée ; à vérifier si
   nécessaire directement auprès du projet OpenJDK/JMH.

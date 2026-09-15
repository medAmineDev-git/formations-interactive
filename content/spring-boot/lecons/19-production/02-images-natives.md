---
id: images-natives
chapitre: production
ordre: 2
titre: "Images natives avec GraalVM"
termes:
  - terme: Compilation AOT (ahead-of-time)
    definition: "Compilation du bytecode Java directement en **code machine exécutable**, réalisée au moment du *build* plutôt qu'à l'exécution. C'est le rôle du compilateur natif de GraalVM : le résultat est un binaire autonome, sans JVM embarquée classique ni interprétation de bytecode au démarrage."
  - terme: Traitement AOT de Spring
    definition: "Étape ajoutée par Spring Framework 6 / Spring Boot 3 avant la compilation native : elle **analyse le contexte** de l'application (beans, proxies, configuration) à la place de le faire à l'exécution, et génère du code Java équivalent ainsi que des `RuntimeHints`. Elle remplace une grande partie de la réflexion normalement utilisée par le conteneur Spring."
  - terme: "RuntimeHints"
    definition: "Mécanisme (`org.springframework.aot.hint.RuntimeHints`) qui déclare, pour le compilateur natif, ce qui doit rester accessible par **réflexion**, **proxy dynamique** ou **ressource** dans le binaire final — puisque l'hypothèse de monde fermé empêche GraalVM de le déduire seul. On les enregistre via un `RuntimeHintsRegistrar`, souvent combiné à `@ImportRuntimeHints`."
  - terme: Hypothèse de monde fermé (closed-world assumption)
    definition: "Principe de la compilation native : **tout** le code accessible à l'exécution doit être identifiable au moment du build. Aucune classe chargée dynamiquement après coup, aucun chemin de code atteint uniquement par réflexion non déclarée — sous peine d'échec silencieux ou d'exception au runtime."
  - terme: "native-maven-plugin (org.graalvm.buildtools)"
    definition: "Plugin Maven fourni par GraalVM Buildtools, ajouté par le profil `native` d'un projet Spring Initializr. Sa commande principale, `mvn -Pnative native:compile`, déclenche le traitement AOT de Spring puis la compilation native, en produisant un binaire exécutable."
  - terme: "spring-boot:build-image -Pnative"
    definition: "Alternative qui construit une **image de conteneur contenant un exécutable natif**, sans installer GraalVM localement : le compilateur natif tourne dans un buildpack (Cloud Native Buildpacks), à l'intérieur du build Docker/Podman."
quiz:
  - question: "Quelle commande, lancée depuis un projet généré par Spring Initializr avec le module natif, produit un exécutable natif local ?"
    code: |
      mvn -Pnative native:compile
    choix:
      - "Elle compile un jar classique optimisé, exécutable avec `java -jar`"
      - "Elle déclenche le traitement AOT de Spring puis la compilation native GraalVM, et produit un binaire exécutable autonome dans `target/`"
      - "Elle génère uniquement les `RuntimeHints`, sans compiler de binaire"
      - "Elle nécessite obligatoirement Docker, même en local"
    reponse: 1
    explication: "Le profil `native` ajoute le `native-maven-plugin` (`org.graalvm.buildtools`) ; son objectif `native:compile` exécute le traitement AOT de Spring (analyse du contexte, génération de code et de hints) puis appelle le compilateur natif de GraalVM. Le résultat est un exécutable, pas un jar — `spring-boot:build-image -Pnative` est l'option qui, elle, produit une image de conteneur sans installer GraalVM."
  - question: "Un service utilise `objectMapper.readValue(json, MaConfigDto.class)` pour désérialiser une configuration lue depuis un fichier. En image native, sans déclaration supplémentaire, que risque-t-il de se passer ?"
    choix:
      - "Rien : GraalVM détecte automatiquement tous les usages de réflexion, y compris via Jackson"
      - "Une erreur au moment du build, qui empêche la compilation native de se terminer"
      - "Une erreur à l'exécution (souvent liée à la réflexion manquante sur `MaConfigDto`), car GraalVM applique une hypothèse de monde fermé et n'a pas connaissance de cet usage sans hint"
      - "La désérialisation fonctionne, mais uniquement pour les types primitifs"
    reponse: 2
    explication: "L'hypothèse de monde fermé signifie que tout accès par réflexion doit être **déclaré** au moment du build pour être conservé dans le binaire. Spring génère automatiquement des hints pour ses propres usages internes (les DTO exposés via les contrôleurs REST, par exemple), mais un usage direct et manuel de Jackson en dehors du flux HTTP classique peut nécessiter un `RuntimeHints` explicite (ou `@RegisterReflectionForBinding`) pour éviter une erreur au runtime, potentiellement seulement visible en testant réellement le binaire."
  - question: "Quel cas d'usage bénéficie le plus d'une image native par rapport à une JVM classique ?"
    choix:
      - "Une application monolithique volumineuse, démarrée une fois et gardée en vie plusieurs mois"
      - "Une fonction serverless ou un outil en ligne de commande, démarré fréquemment et devant répondre en quelques dizaines de millisecondes"
      - "Un batch de calcul intensif qui tourne en continu pendant plusieurs heures"
      - "Une application qui change fréquemment de profil Spring actif à l'exécution"
    reponse: 1
    explication: "L'image native gagne surtout au **démarrage** (millisecondes au lieu de secondes) et en **mémoire résidente** — des atouts décisifs pour du serverless (scale-to-zero, cold start) ou une CLI lancée souvent et brièvement. Une application longue durée profite peu de ce gain ponctuel, et le compilateur JIT d'une JVM classique finit par optimiser le code chaud mieux qu'une compilation figée au build. Le dernier distracteur est même un contre-exemple : les profils actifs sont figés au build en image native, pas modifiables dynamiquement."
---

## Essentiel

Une **image native** est un exécutable autonome, produit par compilation **ahead-of-time (AOT)** avec GraalVM : le code Java est traduit en code machine au moment du *build*, et non plus interprété/compilé à la volée par une JVM classique. Le gain principal est le **démarrage** (millisecondes au lieu de secondes) et la **mémoire résidente** réduite.

Spring Boot 3 ajoute une étape de **traitement AOT** avant la compilation native : elle analyse le contexte Spring (beans, configuration, proxies) au moment du build plutôt qu'au démarrage, et génère le code et les hints nécessaires pour que GraalVM sache quoi conserver.

```bash
# compilation native locale (nécessite GraalVM installé)
mvn -Pnative native:compile

# alternative : image de conteneur, sans installer GraalVM
mvn spring-boot:build-image -Pnative
```

Le coût principal est le **temps de build** (souvent plusieurs minutes contre quelques secondes pour un jar classique) et l'**hypothèse de monde fermé** : GraalVM doit connaître, dès la compilation, tout ce qui sera utilisé par réflexion, proxy dynamique ou chargement de ressource. Un code qui fonctionne normalement sur une JVM peut échouer silencieusement en natif s'il utilise de la réflexion non déclarée — d'où l'importance de **tester réellement le binaire natif**, pas seulement le jar classique.

## Détail

### Comment ça marche

1. Le **traitement AOT de Spring** démarre virtuellement le contexte de l'application pendant le build, observe les beans créés et les décisions de configuration, puis génère du code Java qui reproduit ce résultat directement (au lieu de le recalculer par réflexion à chaque démarrage).
2. Cette étape produit aussi des **`RuntimeHints`** : la liste de ce qui doit rester accessible par réflexion, proxy ou ressource dans le binaire final.
3. Le **compilateur natif** de GraalVM prend ce code généré, applique l'hypothèse de monde fermé, élimine le code mort atteignable de façon certaine, et produit un exécutable natif.
4. Conséquence directe : la **configuration conditionnelle** (profils actifs, `@ConditionalOnProperty`…) est en grande partie **figée au moment du build**. Changer de profil à l'exécution d'un binaire natif ne réévalue pas les conditions comme le ferait une JVM classique.

### Exemple 1 — Ajouter le support natif à un projet existant

```xml
<profile>
    <id>native</id>
    <build>
        <plugins>
            <plugin>
                <groupId>org.graalvm.buildtools</groupId>
                <artifactId>native-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</profile>
```

Spring Initializr ajoute automatiquement ce profil quand le module « GraalVM Native Support » est sélectionné. Sans ce profil, `mvn -Pnative ...` échoue simplement faute de plugin correspondant.

### Exemple 2 — Déclarer un hint pour un usage de réflexion

```java
public class MesHints implements RuntimeHintsRegistrar {
    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
        hints.reflection().registerType(MaConfigDto.class,
                MemberCategory.INVOKE_DECLARED_CONSTRUCTORS,
                MemberCategory.DECLARED_FIELDS);
    }
}

@Configuration
@ImportRuntimeHints(MesHints.class)
public class AppConfig { }
```

Ce hint indique explicitement au compilateur natif de conserver l'accès par réflexion à `MaConfigDto`, pour un usage (désérialisation manuelle, bibliothèque tierce) que le traitement AOT de Spring n'a pas pu détecter tout seul.

### Exemple 3 — Raccourci pour un DTO simple

```java
@RegisterReflectionForBinding(MaConfigDto.class)
@Configuration
public class AppConfig { }
```

`@RegisterReflectionForBinding` évite d'écrire un `RuntimeHintsRegistrar` complet pour le cas courant d'un type utilisé pour la (dé)sérialisation.

### Exemple 4 — Construire une image de conteneur native sans GraalVM local

```bash
mvn spring-boot:build-image -Pnative
```

Cette commande s'appuie sur les **Cloud Native Buildpacks** : le compilateur natif tourne à l'intérieur du build, dans un conteneur dédié. Pratique en CI/CD, sans avoir à installer et maintenir GraalVM sur chaque poste ou agent de build.

### Image native vs JVM classique

| | JVM classique (jar) | Image native |
|---|---|---|
| Démarrage | quelques centaines de ms à quelques s | quelques dizaines de ms |
| Mémoire résidente | plus élevée | réduite |
| Temps de build | rapide (quelques secondes) | lent (souvent plusieurs minutes) |
| Optimisation à chaud (JIT) | oui, s'améliore avec le temps | non, code figé au build |
| Réflexion dynamique non déclarée | fonctionne toujours | échoue (hints requis) |
| Profils/conditions modifiables à l'exécution | oui | figés au build, en grande partie |

### Pièges courants

> **Oublier de tester le binaire natif lui-même.** Un test qui passe sur le jar classique peut échouer une fois compilé en natif — typiquement une `NoSuchMethodException` ou une classe introuvable à l'exécution, révélant un usage de réflexion non couvert par un hint. Le module `spring-boot-starter-test` propose des tests AOT/natifs dédiés à faire tourner régulièrement, pas seulement avant une mise en production.

> **Considérer l'image native comme un remplacement systématique.** Le temps de build allongé (CI plus lente, itération plus lourde en développement) et la rigidité de la configuration figée au build ne se justifient que pour des cas précis : serverless, CLI, scale-to-zero, contraintes mémoire fortes. Pour une application monolithique de longue durée, une JVM classique reste souvent un choix plus simple et tout aussi performant une fois « chauffée ».

> **Ne pas tenir compte du build multi-plateforme.** Un exécutable natif compilé sur macOS ne tourne pas sur Linux : contrairement à un jar (portable partout où une JVM existe), l'image native est liée au système et à l'architecture où elle a été construite. En pratique, on la construit toujours pour la cible de déploiement (souvent via `spring-boot:build-image` en CI Linux).

### À retenir

- L'image native gagne au **démarrage** et en **mémoire** ; elle perd au **temps de build** et à la **flexibilité à l'exécution**.
- Le traitement AOT de Spring analyse le contexte au build et génère du code et des `RuntimeHints` pour remplacer une partie de la réflexion utilisée normalement à l'exécution.
- L'**hypothèse de monde fermé** exige de déclarer tout accès par réflexion non détecté automatiquement : `RuntimeHints`, `@RegisterReflectionForBinding`.
- `mvn -Pnative native:compile` compile localement (GraalVM requis) ; `spring-boot:build-image -Pnative` produit une image de conteneur sans installation locale.
- Cas d'usage typiques : serverless, CLI, scale-to-zero. Certaines versions récentes de Spring Boot proposent aussi le **CDS** (Class Data Sharing) comme alternative plus légère pour accélérer le démarrage d'une JVM classique, sans les contraintes de la compilation native — à vérifier selon la version utilisée.

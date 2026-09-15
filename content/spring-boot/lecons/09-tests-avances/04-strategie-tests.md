---
id: strategie-tests
chapitre: tests-avances
ordre: 4
titre: "Stratégie de tests : pyramide et bonnes pratiques"
termes:
  - terme: Pyramide des tests
    definition: "Modèle qui répartit l'effort de test par niveau : **beaucoup** de tests unitaires (rapides, ciblés) à la base, **moins** de tests d'intégration ou de test slices au milieu, et **très peu** de tests bout-en-bout au sommet (lents, fragiles). L'inverse (« pyramide inversée », ou « glace ») donne une suite lente et difficile à maintenir."
  - terme: Test Data Builder
    definition: "Pattern qui construit des objets de test complexes de façon lisible, avec des valeurs par défaut sensées et seulement les champs pertinents à préciser : `unProduit().avecPrix(10.0).build()`. Évite de dupliquer de longs constructeurs dans chaque test et centralise les changements de modèle."
  - terme: "@DirtiesContext"
    definition: "Force Spring à **détruire** le contexte du test après la méthode (ou la classe) annotée, au lieu de le réutiliser via le cache. Utile quand un test modifie un état partagé difficile à annuler autrement, mais coûteux en temps : à réserver aux cas qui le justifient vraiment."
  - terme: "Ce qui invalide le cache de contexte"
    definition: "Le cache de contexte Spring n'est réutilisé que si la configuration est **strictement identique** entre deux classes de test : mêmes `@ActiveProfiles`, mêmes `@MockitoBean` (et sur les mêmes beans), mêmes propriétés (`@TestPropertySource`), même `webEnvironment`. La moindre différence force un nouveau contexte complet."
  - terme: JaCoCo
    definition: "Outil de mesure de la **couverture de code** (Java Code Coverage) : indique quelles lignes et quelles branches du code sont exécutées par la suite de tests. S'intègre comme plugin Maven ou Gradle, produit un rapport HTML et peut faire échouer le build sous un seuil défini."
  - terme: Couverture de code (ligne / branche)
    definition: "Pourcentage du code exécuté par les tests. La couverture de **ligne** compte les lignes exécutées ; la couverture de **branche** compte les chemins conditionnels (`if`/`else`) réellement empruntés. Une couverture élevée ne garantit **pas** l'absence de bugs : elle ne mesure que ce qui est exécuté, pas ce qui est vérifié."
  - terme: Nommage des tests
    definition: "Convention lisible pour les noms de méthode de test, par exemple `methode_condition_resultatAttendu` (`trouver_commandeInexistante_leveException`) ou une phrase avec `@DisplayName`. Un nom clair sert de documentation et facilite le diagnostic d'un échec dans les rapports CI."
quiz:
  - question: "Un projet a beaucoup de tests `@SpringBootTest` et très peu de tests unitaires purs. Quel est le principal risque de cette organisation ?"
    choix:
      - "Aucun risque particulier, tant que la couverture de code reste élevée"
      - "Une suite de tests lente à exécuter, ce qui ralentit le feedback pendant le développement et en intégration continue"
      - "Les tests `@SpringBootTest` ne peuvent pas détecter de bugs de logique métier"
      - "Spring Boot limite le nombre de classes `@SpringBootTest` par projet"
    reponse: 1
    explication: "C'est la « pyramide inversée » : chaque test charge un contexte Spring complet (lent, même avec le cache de contexte), alors qu'un test unitaire s'exécute en quelques millisecondes. Sur une suite de centaines de tests, la différence de temps d'exécution devient un frein réel au développement. Il vaut mieux tester la logique métier en unitaire et réserver `@SpringBootTest` aux scénarios d'intégration qui le justifient."
  - question: "Deux classes de test annotées `@SpringBootTest` déclarent chacune un `@MockitoBean` différent. Quelle conséquence sur le temps d'exécution de la suite ?"
    code: |
      @SpringBootTest
      class CommandeServiceTest {
          @MockitoBean private NotificationService notificationService;
      }

      @SpringBootTest
      class FactureServiceTest {
          @MockitoBean private ServicePaiementExterne paiementExterne;
      }
    choix:
      - "Aucune : le cache de contexte fonctionne dès que l'annotation `@SpringBootTest` est la même"
      - "Spring redémarre un contexte complet pour chacune des deux classes, car leur configuration de test diffère"
      - "Seule la première classe exécutée démarre un contexte ; la seconde réutilise le même"
      - "Les deux classes doivent obligatoirement utiliser le même `@MockitoBean` pour compiler"
    reponse: 1
    explication: "Le cache de contexte compare la configuration complète, `@MockitoBean` compris : un bean remplacé différent change la clé de cache, donc un nouveau contexte est construit pour chaque classe. Regrouper les tests qui partagent les mêmes beans mockés (ou limiter les `@MockitoBean` aux tests qui en ont vraiment besoin) réduit le nombre de contextes différents à démarrer."
  - question: "Une classe atteint 95 % de couverture de code avec JaCoCo, mais un bug métier évident passe inaperçu en production. Quelle affirmation est correcte ?"
    choix:
      - "C'est impossible : une couverture de 95 % garantit l'absence de bugs sur le code couvert"
      - "La couverture de code mesure les lignes exécutées par les tests, pas la pertinence de leurs assertions : du code peut être exécuté sans être vraiment vérifié"
      - "JaCoCo ne fonctionne pas correctement sur les projets Spring Boot"
      - "Un tel écart signifie que la couverture de branche est forcément à 0 %"
    reponse: 1
    explication: "Un test peut appeler une méthode (la ligne est comptée « couverte ») sans faire d'assertion sur le résultat, ou avec une assertion trop faible pour détecter le bug. La couverture est un indicateur utile pour repérer du code jamais exécuté par aucun test, pas une preuve de correction : la qualité des assertions compte au moins autant que le pourcentage."
---

## Essentiel

Une bonne stratégie de tests suit la **pyramide** : beaucoup de tests unitaires (rapides, isolés), moins de test slices (`@WebMvcTest`, `@DataJpaTest`), et très peu de tests d'intégration complets (`@SpringBootTest`, Testcontainers) — réservés aux scénarios qui justifient vraiment leur coût.

```
        /\
       /  \      Peu de tests — lents, réalistes
      / IT \     @SpringBootTest, Testcontainers
     /------\
    / Slices \   Quelques tests — @WebMvcTest, @DataJpaTest
   /----------\
  / Unitaires  \ Beaucoup de tests — rapides, ciblés
 /--------------\
```

| | Unitaire | `@WebMvcTest` | `@DataJpaTest` | `@SpringBootTest` |
|---|---|---|---|
| Contexte Spring | Aucun | Couche web seule | Couche JPA seule | Complet |
| Vitesse | Très rapide | Rapide | Rapide | Plus lent |
| Ce qui est vérifié | Logique d'une classe isolée | Routage, JSON, validation HTTP | Requêtes, mapping JPA | Intégration réelle de toutes les couches |
| Quand l'utiliser | Par défaut, pour la logique métier | Un contrôleur et ses règles HTTP | Une requête dérivée ou `@Query` complexe | Un scénario d'intégration ciblé |

Le **cache de contexte** de Spring réutilise un contexte entre classes de test à configuration identique ; la moindre différence (`@MockitoBean`, profil, propriété) force un redémarrage complet. Regrouper les tests qui partagent la même configuration garde la suite rapide.

## Détail

### Pourquoi c'est utile

Une suite de tests sert deux objectifs : détecter les régressions tôt, et donner confiance pour livrer souvent. Une pyramide déséquilibrée (trop de tests lourds, pas assez de tests unitaires) ralentit la boucle de développement et décourage de lancer les tests localement. À l'inverse, ne tester qu'en unitaire laisse passer des bugs d'intégration (mauvais câblage, requête SQL fausse, règle de sécurité oubliée) qu'aucun mock ne peut révéler.

### Exemple 1 — Répartir les tests d'un même cas d'usage

Pour la fonctionnalité « annuler une commande » :

```java
// Unitaire — la règle métier (la majorité des cas, y compris les cas limites)
class CommandeServiceTest {
    @Test
    void annuler_commandeDejaLivree_leveException() { ... }

    @Test
    void annuler_commandeEnCours_changeLeStatut() { ... }
}

// @WebMvcTest — le contrat HTTP
class CommandeControllerTest {
    @Test
    void annuler_commandeInexistante_renvoie404() { ... }
}

// @DataJpaTest — la requête réelle si elle est un peu complexe
class CommandeRepositoryTest {
    @Test
    void findCommandesAnnulables_exclut_les_commandes_livrees() { ... }
}

// @SpringBootTest ou Testcontainers — un seul scénario bout-en-bout, pas tous les cas
class CommandeApiIT {
    @Test
    void annulerCommande_scenario_complet() { ... }
}
```

Les cas limites et les variantes se testent en unitaire, où c'est rapide. Les niveaux supérieurs vérifient l'assemblage, pas chaque combinaison.

### Exemple 2 — Un Test Data Builder pour des objets complexes

```java
public class CommandeTestBuilder {
    private Long id = 1L;
    private String statut = "EN_COURS";
    private List<LigneCommande> lignes = new ArrayList<>();

    public static CommandeTestBuilder uneCommande() {
        return new CommandeTestBuilder();
    }

    public CommandeTestBuilder avecStatut(String statut) {
        this.statut = statut;
        return this;
    }

    public CommandeTestBuilder avecLigne(LigneCommande ligne) {
        this.lignes.add(ligne);
        return this;
    }

    public Commande build() {
        return new Commande(id, statut, lignes);
    }
}

// Dans un test :
Commande commande = uneCommande().avecStatut("LIVREE").build();
```

Sans builder, chaque test qui a besoin d'une `Commande` avec juste un champ différent recopie un constructeur entier — fragile dès que le modèle évolue. Le builder isole ce changement à un seul endroit.

### Exemple 3 — Nommage et lisibilité

```java
@Test
void trouver_commandeInexistante_leveCommandeIntrouvableException() {
    when(repository.findById(99L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.trouver(99L))
        .isInstanceOf(CommandeIntrouvableException.class);
}

@Test
@DisplayName("Annuler une commande déjà livrée doit échouer")
void annuler_commandeDejaLivree_leveException() { ... }
```

Le nom seul (`methode_condition_resultat`) suffit souvent à comprendre un échec dans un rapport CI, sans ouvrir le code. `@DisplayName` complète avec une phrase, utile pour des règles métier moins évidentes à déduire du nom de méthode.

### Exemple 4 — Configuration JaCoCo (Maven)

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <executions>
        <execution>
            <goals><goal>prepare-agent</goal></goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals><goal>report</goal></goals>
        </execution>
    </executions>
</plugin>
```

Le rapport HTML généré (`target/site/jacoco/index.html`) montre, ligne par ligne, ce qui est exécuté par les tests. Utile pour repérer du code **jamais** exécuté par aucun test — un signal fiable. Beaucoup moins fiable pour juger de la qualité d'une suite déjà couverte : un pourcentage élevé n'indique pas que les assertions sont pertinentes.

### Pièges courants

> **Viser 100 % de couverture comme objectif en soi.** Pousser la couverture sur des getters/setters ou du code trivial consomme du temps pour peu de valeur, et pousse parfois à écrire des tests sans vraie assertion, juste pour « toucher » la ligne. Mieux vaut cibler la logique métier et les cas limites qui comptent réellement.

> **Copier-coller la configuration de test d'une classe à l'autre sans réfléchir.** Un `@ActiveProfiles` ou un `@MockitoBean` ajouté « au cas où » invalide le cache de contexte pour cette classe, même si le test n'en a pas vraiment besoin — un coût caché qui s'accumule sur toute la suite.

> **Utiliser `@DirtiesContext` pour contourner un test mal isolé.** Elle résout le symptôme (un état partagé entre tests) mais force un redémarrage complet du contexte à chaque fois qu'elle s'applique, ce qui peut ralentir fortement la suite si elle est utilisée trop largement. Traiter la cause (données non nettoyées, singleton avec état) est presque toujours préférable.

### À retenir

- La pyramide des tests guide la répartition : beaucoup d'unitaires, quelques test slices, peu de tests d'intégration complets.
- Un même cas d'usage se répartit sur plusieurs niveaux : la logique métier en unitaire, le contrat HTTP en `@WebMvcTest`, les requêtes en `@DataJpaTest`, un scénario global en `@SpringBootTest` ou Testcontainers.
- Le cache de contexte Spring accélère la suite ; toute différence de configuration entre classes de test (`@MockitoBean`, profil, propriété) le désactive.
- Un Test Data Builder et un nommage clair (`methode_condition_resultat`, `@DisplayName`) rendent la suite plus facile à maintenir et à diagnostiquer.
- JaCoCo repère le code jamais testé, mais un pourcentage élevé ne remplace pas des assertions pertinentes : ce n'est pas un objectif absolu.

---
id: spring-boot-test
chapitre: tests
ordre: 2
titre: "Tests d'intégration avec @SpringBootTest"
termes:
  - terme: "@SpringBootTest"
    definition: "Démarre le **vrai contexte Spring** pour le test : tous les beans de l'application sont créés, comme au lancement réel. Contrairement aux tests unitaires, on vérifie que les pièces s'assemblent correctement. Plus lent qu'un test unitaire, car tout le contexte est chargé."
  - terme: "webEnvironment"
    definition: "Attribut de `@SpringBootTest` qui choisit comment le serveur web est simulé. `MOCK` (par défaut) : pas de vrai serveur, un contexte web simulé. `RANDOM_PORT` : un vrai serveur démarre sur un port libre, utile avec `TestRestTemplate` ou `WebTestClient`. `DEFINED_PORT` et `NONE` existent aussi, plus rares."
  - terme: "@AutoConfigureMockMvc"
    definition: "Ajoute un bean `MockMvc` au contexte du test, pour simuler des requêtes HTTP **sans serveur réel** (utilisable avec `webEnvironment = MOCK`, la valeur par défaut)."
  - terme: "TestRestTemplate"
    definition: "Client HTTP fourni par Spring Boot pour appeler l'application via de **vraies requêtes réseau**, quand `webEnvironment = RANDOM_PORT`. Utile pour un test bout-en-bout proche de la réalité."
  - terme: "@MockitoBean"
    definition: "Remplace un bean du contexte Spring par un mock Mockito, le temps du test (package `org.springframework.test.context.bean.override.mockito`). Introduite avec Spring Framework 6.2 / Spring Boot 3.4. Elle **remplace** `@MockBean`, dépréciée mais encore très répandue dans les projets existants — même principe, ancien package (`org.springframework.boot.test.mock.mockito`)."
  - terme: "@ActiveProfiles"
    definition: "Active un ou plusieurs profils Spring pour le test, par exemple `@ActiveProfiles(\"test\")`. Permet de charger une configuration différente (`application-test.yml`), typiquement une base H2 en mémoire à la place de la vraie base."
  - terme: "@Transactional (sur un test)"
    definition: "Sur une méthode ou une classe de test, ouvre une transaction avant chaque test et la **annule (rollback)** à la fin, qu'il réussisse ou échoue. Les données insérées pendant le test ne polluent pas les tests suivants."
  - terme: Cache du contexte Spring
    definition: "Spring **réutilise** un contexte déjà démarré entre plusieurs classes de test si leur configuration est strictement identique (mêmes annotations, mêmes profils, mêmes beans remplacés). Un contexte différent (ex. un `@MockitoBean` différent) force un redémarrage complet, ce qui ralentit la suite de tests."
quiz:
  - question: "Quelle est la principale différence entre un test unitaire (leçon précédente) et un test avec `@SpringBootTest` ?"
    choix:
      - "`@SpringBootTest` est simplement plus rapide"
      - "`@SpringBootTest` démarre le vrai contexte Spring, avec tous ses beans assemblés, alors qu'un test unitaire teste une classe isolée avec des mocks"
      - "Il n'y a aucune différence, ce sont deux noms pour la même chose"
      - "`@SpringBootTest` ne peut tester que les contrôleurs REST"
    reponse: 1
    explication: "Un test unitaire vérifie une classe seule, très vite, sans Spring. `@SpringBootTest` vérifie que l'application entière démarre et que ses beans collaborent correctement — plus proche de la réalité, mais nettement plus lent (chargement complet du contexte)."
  - question: "Pourquoi annoter une classe de test `@Transactional` est-il pratique avec une base de données ?"
    choix:
      - "Cela accélère l'exécution des requêtes SQL"
      - "Chaque test s'exécute dans une transaction annulée (rollback) à la fin : les données insérées ne restent pas d'un test à l'autre"
      - "Cela désactive la base de données pendant le test"
      - "Cela empêche deux tests de s'exécuter en parallèle"
    reponse: 1
    explication: "Sans rollback automatique, un test qui insère une commande la laisserait dans la base pour le test suivant, risquant de fausser ses résultats. `@Transactional` sur le test annule tout à la fin, quel que soit le résultat du test."
  - question: "Deux classes de test utilisent `@SpringBootTest`, mais l'une ajoute `@MockitoBean` sur un bean différent. Quelle conséquence sur le cache de contexte ?"
    choix:
      - "Aucune, le cache est toujours réutilisé"
      - "Spring redémarre un contexte complet pour la classe avec le `@MockitoBean` différent, car la configuration du contexte n'est plus identique"
      - "Le test avec `@MockitoBean` échoue systématiquement"
      - "Le cache est désactivé pour toute la suite de tests"
    reponse: 1
    explication: "Le cache de contexte compare la configuration complète (annotations, profils, beans remplacés). Un `@MockitoBean` différent change cette configuration : Spring doit reconstruire un contexte, ce qui ralentit la suite. D'où l'intérêt de regrouper les tests qui partagent la même configuration."
---

## Essentiel

`@SpringBootTest` démarre **toute l'application**, comme au vrai lancement : tous les beans sont créés et assemblés. Contrairement à un test unitaire (leçon précédente), on vérifie que les différentes couches fonctionnent **ensemble**.

```java
@SpringBootTest
@ActiveProfiles("test")
class CommandeServiceIT {

    @Autowired
    private CommandeService service;

    @MockitoBean
    private NotificationService notificationService; // remplacé par un mock

    @Test
    void confirmerCommande_change_le_statut() {
        Commande resultat = service.confirmer(1L);

        assertThat(resultat.getStatut()).isEqualTo("CONFIRMEE");
        verify(notificationService).envoyer(anyString());
    }
}
```

Par défaut, `webEnvironment = WebEnvironment.MOCK` : pas de vrai serveur HTTP. Avec `RANDOM_PORT`, un serveur démarre réellement sur un port libre, utilisable avec `TestRestTemplate`. `@MockitoBean` remplace un bean gênant (un vrai envoi d'e-mail, un appel à une API externe) par un mock, le temps du test.

Ces tests sont plus lents qu'un test unitaire : Spring doit charger le contexte complet. Spring essaie de le **réutiliser** entre les classes de test qui ont la même configuration, mais chaque configuration différente en force un nouveau.

## Détail

### Pourquoi c'est utile

Un test unitaire garantit qu'une classe fonctionne seule. Il ne garantit pas que le câblage des beans est correct, qu'une requête SQL générée par Spring Data fonctionne, ou qu'une configuration (`application.yml`) est valide. `@SpringBootTest` couvre ces cas, au prix d'un temps d'exécution plus long : on en écrit moins, ciblés sur les scénarios importants.

### Exemple 1 — Les valeurs de `webEnvironment`

```java
// Par défaut : contexte web simulé, pas de port réseau ouvert
@SpringBootTest
class ApplicationContextTest {
    @Autowired
    private ApplicationContext context;

    @Test
    void leContexteDemarreSansErreur() {
        assertThat(context).isNotNull();
    }
}

// Vrai serveur, sur un port aléatoire
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CommandeApiIT {
    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void getCommande_renvoie_200() {
        ResponseEntity<Commande> reponse = restTemplate.getForEntity("/commandes/1", Commande.class);

        assertThat(reponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
```

### Exemple 2 — MockMvc plutôt qu'un vrai serveur

Avec `webEnvironment = MOCK` (par défaut), `@AutoConfigureMockMvc` ajoute un `MockMvc` capable de simuler des requêtes HTTP sans ouvrir de port :

```java
@SpringBootTest
@AutoConfigureMockMvc
class CommandeControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getCommande_renvoie_200() throws Exception {
        mockMvc.perform(get("/commandes/1"))
            .andExpect(status().isOk());
    }
}
```

C'est généralement plus rapide qu'un vrai appel réseau via `TestRestTemplate`, tout en testant la vraie chaîne HTTP (sérialisation JSON, validation, gestion des erreurs).

### Exemple 3 — Remplacer une dépendance externe avec @MockitoBean

```java
@SpringBootTest
class CommandeServiceIT {

    @Autowired
    private CommandeService service;

    @MockitoBean
    private ServicePaiementExterne paiementExterne; // appel HTTP réel évité

    @Test
    void confirmer_appelle_le_service_de_paiement() {
        when(paiementExterne.debiter(any())).thenReturn(true);

        service.confirmer(1L);

        verify(paiementExterne).debiter(any());
    }
}
```

`@MockitoBean` remplace le vrai bean `ServicePaiementExterne` dans le contexte Spring par un mock, pour toute la durée du test. C'est le remplaçant de `@MockBean` (package `org.springframework.boot.test.mock.mockito`), dépréciée depuis Spring Boot 3.4 mais encore courante dans du code existant — les deux fonctionnent de la même façon.

### Exemple 4 — Profil de test et base H2

```yaml
# application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
```

```java
@SpringBootTest
@ActiveProfiles("test")
@Transactional // rollback automatique après chaque test
class CommandeRepositoryIT {

    @Autowired
    private CommandeRepository repository;

    @Test
    void save_persiste_la_commande() {
        Commande commande = repository.save(new Commande("Nouvelle"));

        assertThat(commande.getId()).isNotNull();
    }
}
```

`@ActiveProfiles("test")` charge `application-test.yml` par-dessus `application.yml` : ici, une base H2 en mémoire remplace la vraie base de données. `@Transactional` annule les changements après chaque test.

### Pièges courants

> **Un `@SpringBootTest` par méthode, sur toute la suite.** Charger le contexte complet pour chaque petit test rend la suite très lente. Réservez `@SpringBootTest` aux scénarios d'intégration ; préférez les tests unitaires (leçon précédente) et les test slices comme `@WebMvcTest` (leçon suivante) pour le reste.

> **Changer la configuration d'un test à l'autre sans y penser.** Chaque `@MockitoBean`, `@ActiveProfiles` ou propriété différente invalide le cache de contexte et force un redémarrage complet. Regrouper les tests qui partagent la même configuration accélère nettement la suite.

> **Oublier `@Transactional` avec une vraie insertion en base.** Sans rollback, les données d'un test restent visibles pour les suivants, ce qui peut faire échouer des assertions qui comptent des lignes (`findAll().size()`) de façon imprévisible selon l'ordre d'exécution.

### À retenir

- `@SpringBootTest` charge le contexte Spring complet ; plus réaliste, mais plus lent qu'un test unitaire.
- `webEnvironment` : `MOCK` (défaut, avec `@AutoConfigureMockMvc`) ou `RANDOM_PORT` (avec `TestRestTemplate`).
- `@MockitoBean` remplace un bean du contexte par un mock (remplace l'ancien `@MockBean`, toujours présent dans du code existant).
- `@ActiveProfiles("test")` + base H2 isolent les tests de la vraie base de données ; `@Transactional` annule les changements après chaque test.
- Spring réutilise le contexte entre classes de test à configuration identique : limitez les variations pour garder une suite rapide.

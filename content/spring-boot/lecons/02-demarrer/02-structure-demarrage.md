---
id: structure-demarrage
chapitre: demarrer
ordre: 2
titre: "Structure d'un projet et démarrage de l'application"
termes:
  - terme: Classe principale
    definition: "Classe annotée `@SpringBootApplication`, placée à la **racine** des packages du projet (ex. `com.boutique.BoutiqueApplication`), avec une méthode `main` qui appelle `SpringApplication.run(...)`. Point d'entrée de l'application."
  - terme: "SpringApplication.run(...)"
    definition: "Méthode qui démarre l'application : elle crée l'`ApplicationContext`, prépare l'environnement (propriétés, profils), déclenche le component scan et l'auto-configuration, puis lance le serveur web embarqué s'il y en a un."
  - terme: src/main/resources
    definition: "Dossier des ressources non-Java : `application.properties` (ou `.yml`), `static/` (fichiers servis tels quels : CSS, JS, images) et `templates/` (vues HTML pour un moteur de template comme Thymeleaf)."
  - terme: Serveur embarqué
    definition: "Serveur web inclus dans le jar de l'application (Tomcat par défaut avec `spring-boot-starter-web`, alternatives : Jetty, Undertow). Il démarre avec l'application elle-même, sur le port **8080** par défaut : pas de serveur externe à installer."
  - terme: CommandLineRunner
    definition: "Interface fonctionnelle avec une méthode `run(String... args)`. Un bean qui l'implémente est exécuté automatiquement **juste après** le démarrage complet de l'application, avec les arguments bruts de la ligne de commande."
  - terme: ApplicationRunner
    definition: "Variante de `CommandLineRunner` dont la méthode `run(ApplicationArguments args)` reçoit les arguments déjà découpés en options nommées (`--nom=valeur`) et arguments non nommés."
  - terme: src/test/java
    definition: "Dossier des tests, avec la même arborescence de packages que `src/main/java`. Spring Initializr y génère un test de démarrage (`@SpringBootTest`) qui vérifie que le contexte se charge sans erreur."
quiz:
  - question: "Où doit se trouver la classe annotée `@SpringBootApplication` pour que `CommandeService` (package `com.boutique.commande`) soit détectée ?"
    code: |
      com/boutique/BoutiqueApplication.java     // @SpringBootApplication
      com/boutique/commande/CommandeService.java // @Service
    choix:
      - "N'importe où, le package n'a pas d'importance"
      - "Dans `com.boutique` ou un package parent de tous les autres packages du projet"
      - "Obligatoirement dans le même package que chaque classe à scanner"
      - "Dans `src/main/resources`"
    reponse: 1
    explication: "Le component scan part du package de la classe `@SpringBootApplication` et descend dans les sous-packages. Placée ailleurs (ex. `com.boutique.demarrage`), elle ne verrait pas `com.boutique.commande` et `CommandeService` ne serait pas détectée."
  - question: "Quelle est la différence entre un bean `CommandLineRunner` et un bean `ApplicationRunner` ?"
    choix:
      - "`CommandLineRunner` s'exécute avant le démarrage, `ApplicationRunner` après"
      - "Aucune différence fonctionnelle : seule la forme des arguments reçus change (bruts vs `ApplicationArguments` structuré)"
      - "`ApplicationRunner` ne peut être utilisé qu'en test"
      - "Un seul des deux peut être défini par application"
    reponse: 1
    explication: "Les deux s'exécutent au même moment, juste après le démarrage complet du contexte. `CommandLineRunner` reçoit les arguments bruts (`String... args`), `ApplicationRunner` reçoit un `ApplicationArguments` qui distingue options nommées (`--serveur.port=8081`) et arguments simples. On peut définir plusieurs runners des deux types ; leur ordre se contrôle avec `@Order`."
  - question: "Sur quel port démarre par défaut une application Spring Boot avec `spring-boot-starter-web`, sans configuration particulière ?"
    choix:
      - "80"
      - "8080"
      - "8443"
      - "Un port aléatoire, choisi au démarrage"
    reponse: 1
    explication: "Le serveur Tomcat embarqué démarre sur le port 8080 par défaut. On le change avec la propriété `server.port` (par exemple `server.port=8081`), ou `server.port=0` pour qu'un port libre soit choisi au hasard (utile en test)."
---

## Essentiel

Un projet généré par Spring Initializr suit une arborescence standard :

```
mon-projet/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/boutique/
│   │   │   ├── BoutiqueApplication.java   ← classe principale
│   │   │   └── commande/CommandeService.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── static/                     ← fichiers servis tels quels
│   │       └── templates/                  ← vues (Thymeleaf…)
│   └── test/java/com/boutique/
│       └── BoutiqueApplicationTests.java
```

La classe principale est à la **racine** des packages, et lance l'application :

```java
@SpringBootApplication
public class BoutiqueApplication {
    public static void main(String[] args) {
        SpringApplication.run(BoutiqueApplication.class, args);
    }
}
```

`SpringApplication.run(...)` prépare l'environnement, crée l'`ApplicationContext`, exécute le component scan et l'auto-configuration, puis démarre le serveur **Tomcat embarqué** (port 8080 par défaut) si `spring-boot-starter-web` est présent.

Deux façons de lancer l'application : `mvn spring-boot:run` (pendant le développement) ou `java -jar mon-app.jar` (après `mvn package`, en production).

## Détail

### Comment ça marche

Au démarrage, `SpringApplication.run(...)` déroule plusieurs étapes : détection du type d'application (web ou non), lecture des sources de configuration (`application.properties`, variables d'environnement, arguments), création de l'`ApplicationContext`, exécution du component scan puis de l'auto-configuration, et enfin démarrage du serveur embarqué. Les logs affichent chacune de ces étapes.

### Exemple 1 — Lire les logs de démarrage

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.3.0)

2024-05-10 10:00:01.123  INFO 12345 --- [main] c.b.BoutiqueApplication : Starting BoutiqueApplication
2024-05-10 10:00:01.456  INFO 12345 --- [main] o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat initialized with port 8080 (http)
2024-05-10 10:00:02.789  INFO 12345 --- [main] o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat started on port 8080 (http)
2024-05-10 10:00:02.800  INFO 12345 --- [main] c.b.BoutiqueApplication : Started BoutiqueApplication in 1.677 seconds
```

La ligne « Started … in X seconds » confirme que le contexte est prêt et l'application accessible.

### Exemple 2 — Exécuter du code au démarrage

```java
@Component
public class ChargementInitial implements CommandLineRunner {

    private final ProduitRepository produits;

    public ChargementInitial(ProduitRepository produits) {
        this.produits = produits;
    }

    @Override
    public void run(String... args) {
        if (produits.count() == 0) {
            produits.save(new Produit("Clavier", 49.90));
        }
    }
}
```

Utile pour des jeux de données de démonstration, des vérifications au démarrage, ou des tâches ponctuelles en ligne de commande.

### Exemple 3 — `ApplicationArguments`

```java
@Component
public class ImportRunner implements ApplicationRunner {

    @Override
    public void run(ApplicationArguments args) {
        if (args.containsOption("import")) {
            String fichier = args.getOptionValues("import").get(0);
            // java -jar app.jar --import=produits.csv
        }
    }
}
```

`ApplicationArguments` distingue les options nommées (`--import=produits.csv`) des arguments simples (`getNonOptionArgs()`).

### Exemple 4 — Lancer l'application

```bash
# Développement : recompile et redémarre plus vite (avec devtools)
mvn spring-boot:run

# Production : construire puis exécuter le jar
mvn clean package
java -jar target/boutique-0.0.1-SNAPSHOT.jar

# Changer le port au lancement
java -jar target/boutique-0.0.1-SNAPSHOT.jar --server.port=8081
```

### Pièges courants

> **Classe principale mal placée.** Si `BoutiqueApplication` est dans `com.boutique.demarrage` au lieu de `com.boutique`, les classes des autres sous-packages (`com.boutique.commande`, `com.boutique.client`…) ne sont pas scannées. L'erreur apparaît au démarrage : *« required a bean of type '…' that could not be found »*.

> **Port 8080 déjà utilisé.** Le démarrage échoue avec *« Web server failed to start. Port 8080 was already in use »*. Solution : libérer le port, ou démarrer avec `--server.port=0` (port libre choisi automatiquement, pratique en test) ou une autre valeur.

> **Confondre `static` et `templates`.** Les fichiers dans `static/` sont servis tels quels (une image, un `app.js`) ; ceux dans `templates/` sont traités par un moteur de template (Thymeleaf) et ne sont pas accessibles directement en HTTP.

### À retenir

- La classe principale (`@SpringBootApplication`) doit être à la racine des packages du projet.
- `SpringApplication.run(...)` orchestre tout le démarrage : environnement, contexte, scan, auto-configuration, serveur embarqué.
- Port 8080 par défaut, configurable avec `server.port`.
- `CommandLineRunner` / `ApplicationRunner` exécutent du code juste après le démarrage complet.
- `mvn spring-boot:run` en développement, `java -jar` en production.

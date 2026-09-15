---
id: initializr-starters
chapitre: demarrer
ordre: 1
titre: "Créer un projet : Spring Initializr et les starters"
termes:
  - terme: Spring Initializr
    definition: "Générateur de projet en ligne (start.spring.io), aussi intégré dans les IDE (IntelliJ, VS Code, Eclipse). Il produit une arborescence prête à l'emploi : build Maven ou Gradle, classe principale, et les dépendances choisies."
  - terme: Starter
    definition: "Dépendance Maven/Gradle qui regroupe toutes les librairies nécessaires à une fonctionnalité, avec des versions compatibles entre elles. `spring-boot-starter-web` apporte, entre autres, Spring MVC, Jackson et Tomcat embarqué."
  - terme: "spring-boot-starter-parent"
    definition: "POM parent Maven qui fixe la version de Java, le encodage des sources, et surtout importe le **BOM** de Spring Boot : les dépendances gérées n'ont plus besoin de numéro de version."
  - terme: "BOM (Bill of Materials)"
    definition: "Un POM spécial qui liste, pour un ensemble de librairies, les versions compatibles entre elles. `spring-boot-dependencies` est le BOM de Spring Boot ; l'utiliser évite les conflits de versions entre starters."
  - terme: Dépendance transitive
    definition: "Dépendance apportée automatiquement par une autre dépendance. `spring-boot-starter-web` apporte Tomcat, Jackson et Spring MVC sans que vous les déclariez vous-même."
  - terme: "spring-boot-maven-plugin"
    definition: "Plugin Maven qui empaquette l'application en un **jar exécutable** (« fat jar » ou « uber jar ») contenant le code, les dépendances et un serveur embarqué. Sans lui, `mvn package` produit un jar classique, non exécutable directement."
  - terme: Jar exécutable
    definition: "Archive `.jar` autonome, lançable avec `java -jar`, qui contient toutes les dépendances et un serveur web embarqué (Tomcat par défaut). C'est le format de livraison standard d'une application Spring Boot."
quiz:
  - question: "Pourquoi n'écrit-on pas de numéro de version sur `spring-boot-starter-web` dans le `pom.xml` ?"
    code: |
      <parent>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-starter-parent</artifactId>
          <version>3.3.0</version>
      </parent>

      <dependencies>
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-web</artifactId>
          </dependency>
      </dependencies>
    choix:
      - "Maven choisit automatiquement la dernière version disponible"
      - "`spring-boot-starter-parent` importe le BOM de Spring Boot, qui fixe une version compatible pour chaque dépendance gérée"
      - "La version n'est pas nécessaire pour les starters, seulement pour les autres dépendances"
      - "C'est une erreur : il faut toujours préciser la version"
    reponse: 1
    explication: "Le parent importe `spring-boot-dependencies`, le BOM qui liste une version testée et compatible pour chaque starter et chaque librairie Spring. Omettre la version évite les conflits ; changer la version de Spring Boot dans le `<parent>` suffit à faire évoluer tout le projet de façon cohérente."
  - question: "Que se passe-t-il si vous ajoutez `spring-boot-starter-web` sans indiquer de version, sans utiliser `spring-boot-starter-parent` ni importer le BOM ?"
    choix:
      - "Maven télécharge automatiquement la dernière version stable"
      - "La build échoue : Maven ne sait pas quelle version résoudre"
      - "Spring Boot utilise une version par défaut codée en dur"
      - "Le starter est ignoré silencieusement"
    reponse: 1
    explication: "Sans parent ni BOM, rien ne fixe la version des dépendances gérées : la déclaration sans version est invalide et Maven échoue. C'est pour cela que le parent (ou l'import du BOM en `<dependencyManagement>`, si vous avez déjà un autre parent) est la première chose à mettre en place."
  - question: "Quel plugin permet de générer un jar exécutable avec `mvn package`, et pourquoi en a-t-on besoin ?"
    choix:
      - "`maven-jar-plugin`, car il compile les classes Java"
      - "`spring-boot-maven-plugin`, car il embarque les dépendances et un serveur, sinon le jar produit n'est pas exécutable directement"
      - "Aucun plugin n'est nécessaire, Maven produit un jar exécutable par défaut"
      - "`spring-boot-starter-web`, car il contient Tomcat"
    reponse: 1
    explication: "Un jar Maven classique ne contient que le code compilé de votre projet, pas ses dépendances : `java -jar` échouerait avec `NoClassDefFoundError`. `spring-boot-maven-plugin` réempaquette tout (code, dépendances, serveur embarqué) dans un seul jar autonome, exécutable avec `java -jar`."
---

## Essentiel

**Spring Initializr** (start.spring.io) génère un projet Spring Boot prêt à l'emploi : vous choisissez le langage, la version de Spring Boot, Maven ou Gradle, et les dépendances (« starters »), puis téléchargez une archive avec l'arborescence complète.

Un **starter** est une dépendance qui regroupe tout ce qu'il faut pour une fonctionnalité, avec des versions compatibles entre elles :

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

Remarquez l'absence de numéro de version : le projet hérite de `spring-boot-starter-parent`, qui importe le **BOM** de Spring Boot et fixe une version cohérente pour chaque dépendance gérée.

Au build, `spring-boot-maven-plugin` empaquette le code et toutes les dépendances (y compris un serveur Tomcat embarqué) dans un **jar exécutable** : `java -jar mon-app.jar` suffit à démarrer l'application, sans serveur externe à installer.

## Détail

### Comment ça marche

Spring Initializr est un formulaire (web, ou intégré dans l'IDE) qui produit un projet complet : fichier de build (`pom.xml` ou `build.gradle`), classe principale annotée `@SpringBootApplication`, `application.properties` vide, et un test de démarrage. Vous choisissez le groupId/artifactId, la version de Java, et cochez les starters dont vous avez besoin. Le résultat s'importe directement dans un IDE.

### Exemple 1 — Générer un projet avec curl

```bash
curl https://start.spring.io/starter.zip \
  -d dependencies=web,data-jpa,validation \
  -d type=maven-project \
  -d javaVersion=17 \
  -d bootVersion=3.3.0 \
  -o boutique.zip
```

Utile en CI ou en script ; en pratique, la plupart des développeurs passent par l'interface web ou celle de leur IDE.

### Exemple 2 — Starters courants et leur contenu

```
spring-boot-starter-web          → Spring MVC, Jackson (JSON), Tomcat embarqué
spring-boot-starter-data-jpa     → Spring Data JPA, Hibernate, HikariCP (pool de connexions)
spring-boot-starter-validation   → Bean Validation (Hibernate Validator)
spring-boot-starter-security     → Spring Security
spring-boot-starter-actuator     → Endpoints de supervision (/actuator/health…)
spring-boot-starter-test         → JUnit 5, Mockito, AssertJ, Spring Test (scope test)
```

Chacun tire ses **dépendances transitives** : ajouter `spring-boot-starter-data-jpa` suffit, pas besoin de déclarer Hibernate séparément.

### Exemple 3 — Gradle équivalent

```gradle
plugins {
    id 'org.springframework.boot' version '3.3.0'
    id 'io.spring.dependency-management' version '1.1.5'
    id 'java'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

Avec Gradle, c'est le plugin `io.spring.dependency-management` (ou les BOM Gradle natifs) qui joue le rôle du BOM : même principe, pas de version à écrire sur les dépendances gérées.

### Maven vs Gradle

| | Maven | Gradle |
|---|---|---|
| Fichier de build | `pom.xml` (XML) | `build.gradle` (Groovy/Kotlin DSL) |
| Gestion des versions | `spring-boot-starter-parent` | Plugin `io.spring.dependency-management` |
| Lancer l'application | `mvn spring-boot:run` | `gradle bootRun` |
| Construire le jar | `mvn package` | `gradle build` |

Les deux sont pleinement supportés par Spring Boot ; le choix dépend surtout des habitudes de l'équipe.

### Pièges courants

> **Ajouter une version sur un starter « pour être sûr ».** Cela casse la cohérence garantie par le BOM : la version choisie peut être incompatible avec les autres starters. Laissez le parent (ou le BOM) gérer les versions, sauf besoin précis et documenté.

> **Oublier `spring-boot-starter-parent` (ou l'import du BOM) sur un projet qui a déjà un autre parent d'entreprise.** Dans ce cas, il faut importer `spring-boot-dependencies` explicitement en `<dependencyManagement>`, sinon les dépendances sans version ne se résolvent pas.

> **Construire avec `mvn package` sans `spring-boot-maven-plugin` configuré**, puis s'étonner que `java -jar` échoue avec *« no main manifest attribute »*. Le plugin doit être déclaré dans `<build><plugins>` ; Spring Initializr le fait automatiquement.

### À retenir

- Spring Initializr (start.spring.io) génère un projet Maven ou Gradle prêt à l'emploi.
- Un starter regroupe des dépendances compatibles pour une fonctionnalité (`web`, `data-jpa`, `validation`, `security`, `actuator`, `test`…).
- `spring-boot-starter-parent` importe le BOM : pas de version à écrire sur les dépendances gérées.
- `spring-boot-maven-plugin` produit un jar exécutable, lançable avec `java -jar`, serveur embarqué inclus.

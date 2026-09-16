---
id: exceptions-metier
chapitre: exceptions
ordre: 3
titre: Concevoir ses exceptions
termes:
  - terme: Exception métier
    definition: "Exception propre au domaine de l'application (ex. `StockInsuffisantException`), qui porte un message et parfois des données utiles à celui qui l'attrape, plutôt qu'une exception technique générique (`RuntimeException` brute) ou un retour `null`."
  - terme: Cause (constructeur avec cause)
    definition: "Un constructeur de type `MonException(String message, Throwable cause)` (hérité de `Throwable`) qui conserve l'exception technique d'origine tout en ajoutant un message métier. Récupérable avec `getCause()`, affichée dans la pile sous `Caused by`."
  - terme: "initCause()"
    definition: "Méthode de `Throwable` qui attache une cause **après** la construction, utile quand le constructeur choisi ne l'accepte pas directement. Ne peut être appelée qu'une seule fois par exception."
  - terme: Catch vide
    definition: "Bloc `catch (Exception e) { }` qui n'affiche rien, ne journalise rien, ne relance rien : l'erreur disparaît silencieusement. Un des pièges les plus coûteux à déboguer en production."
  - terme: "@throws"
    definition: "Balise Javadoc qui documente qu'une méthode publique peut lever tel type d'exception, et dans quelles conditions. Fait partie du contrat de l'API, au même titre que les paramètres et la valeur de retour."
  - terme: Optional
    definition: "Type (`java.util.Optional<T>`) qui représente explicitement l'absence possible d'une valeur, sans lever d'exception ni renvoyer `null`. Adapté quand l'absence est un cas normal, pas une erreur."
  - terme: Coût d'une exception
    definition: "Créer une exception capture la pile d'appels (`fillInStackTrace()`), une opération relativement coûteuse comparée à un simple retour de valeur. Négligeable pour un cas d'erreur réel et occasionnel ; problématique si des exceptions sont levées en masse dans un chemin d'exécution normal et fréquent."
quiz:
  - question: "Quel est le principal problème de ce code ?"
    code: |
      try {
          stockService.reserver(produit, quantite);
      } catch (StockInsuffisantException e) {
      }
      confirmerCommande(produit, quantite);
    choix:
      - "Le code ne compile pas : un bloc `catch` ne peut pas être vide"
      - "L'échec de la réservation est totalement silencieux : la commande est confirmée comme si tout s'était bien passé, sans stock réservé"
      - "`StockInsuffisantException` doit obligatoirement être une exception vérifiée"
      - "Il manque un `finally` pour que le code fonctionne"
    reponse: 1
    explication: "Un `catch` vide « avale » l'exception : rien n'est journalisé, rien ne prévient que la réservation a échoué, et le code continue comme si de rien n'était. Au minimum, journaliser l'erreur ; le plus souvent, soit relancer, soit gérer réellement le cas (annuler la commande, prévenir l'utilisateur)."
  - question: "Faut-il rendre `StockInsuffisantException` vérifiée ou non vérifiée ?"
    choix:
      - "Vérifiée : c'est obligatoire pour toute exception métier"
      - "Non vérifiée : c'est obligatoire pour toute exception métier"
      - "Cela dépend : vérifiée si l'appelant a une action corrective réaliste et est censé la traiter explicitement, non vérifiée s'il s'agit plutôt d'une condition exceptionnelle que la plupart des appelants ne peuvent pas gérer au cas par cas"
      - "Le choix n'a aucune conséquence sur le code appelant"
    reponse: 2
    explication: "Il n'y a pas de règle unique. Une exception vérifiée force chaque appelant à y réfléchir (utile si une action de récupération existe, comme proposer un stock partiel) ; une exception non vérifiée évite de polluer des signatures sur plusieurs couches quand la plupart des appelants ne peuvent rien faire d'autre que la laisser remonter jusqu'à un point central de gestion."
  - question: "Que contient la pile affichée si cette exception n'est pas interceptée ?"
    code: |
      try {
          paiementClient.appeler(commande);
      } catch (ConnectException e) {
          throw new PaiementIndisponibleException("Service de paiement injoignable", e);
      }
    choix:
      - "Uniquement `PaiementIndisponibleException` et son message"
      - "`PaiementIndisponibleException` en premier, puis un bloc `Caused by: java.net.ConnectException` avec la pile d'origine"
      - "Uniquement `ConnectException`, `PaiementIndisponibleException` est ignorée"
      - "Une erreur de compilation, car on ne peut pas passer une exception à une autre"
    reponse: 1
    explication: "Le constructeur `PaiementIndisponibleException(String, Throwable)` conserve `e` comme cause. La pile affiche l'exception métier en tête (contexte utile pour l'appelant) puis, sous `Caused by`, la `ConnectException` d'origine (utile pour diagnostiquer la vraie panne) — rien n'est perdu."
---

## Essentiel

Une bonne exception métier remplace une exception technique brute ou un `null` ambigu par quelque chose d'explicite :

```java
public class StockInsuffisantException extends RuntimeException {

    private final String codeProduit;
    private final int quantiteDemandee;

    public StockInsuffisantException(String codeProduit, int quantiteDemandee) {
        super("Stock insuffisant pour " + codeProduit + " (demandé : " + quantiteDemandee + ")");
        this.codeProduit = codeProduit;
        this.quantiteDemandee = quantiteDemandee;
    }
}
```

Trois règles à respecter systématiquement :

1. **Ne jamais avaler une exception** : un `catch` vide fait disparaître l'erreur sans laisser de trace. Au minimum, journaliser.
2. **Ne pas utiliser les exceptions pour un contrôle de flux normal** : si l'absence de résultat ou un refus est un cas courant et attendu (ex. panier vide), préférer `Optional`, un objet résultat, ou une validation en amont.
3. **Conserver la cause** en enveloppant une exception technique : `new PaiementIndisponibleException("Service injoignable", e)` garde `e` accessible via `getCause()`, sans perdre l'information d'origine.

Le choix vérifiée/non vérifiée dépend du contexte : vérifiée si l'appelant a une vraie action corrective à faire et doit y penser ; non vérifiée si la plupart des appelants ne peuvent rien faire d'autre que la laisser remonter.

## Détail

### Exemple 1 — Enrichir le message et garder la cause

```java
public class CatalogueIndisponibleException extends RuntimeException {
    public CatalogueIndisponibleException(String message, Throwable cause) {
        super(message, cause);
    }
}

public List<Produit> chargerCatalogue(Path chemin) {
    try {
        return lireFichier(chemin);
    } catch (IOException e) {
        throw new CatalogueIndisponibleException("Impossible de lire le catalogue : " + chemin, e);
    }
}
```

Le message est utile pour un humain qui lit les logs ; la cause (`e`) reste accessible pour un diagnostic technique précis, sans obliger l'appelant de `chargerCatalogue` à connaître `IOException`.

### Exemple 2 — `initCause()` quand le constructeur ne prend pas de cause

```java
try {
    calculerRemise(commande);
} catch (ArithmeticException e) {
    IllegalStateException erreur = new IllegalStateException("Calcul de remise impossible");
    erreur.initCause(e);
    throw erreur;
}
```

Moins courant que le constructeur avec cause, mais utile avec une classe d'exception existante qui n'a pas de constructeur `(String, Throwable)`.

### Exemple 3 — Où attraper, où laisser remonler

```java
// Couche accès aux données : traduit une erreur technique en exception métier
public Commande chargerCommande(Long id) {
    try {
        return jdbcTemplate.queryForObject(SQL, this::mapCommande, id);
    } catch (EmptyResultDataAccessException e) {
        throw new CommandeIntrouvableException(id);
    }
}

// Couche service : ne fait rien de spécial, laisse remonter
public void annuler(Long id) {
    Commande commande = chargerCommande(id); // CommandeIntrouvableException remonte si besoin
    commande.annuler();
}

// Frontière technique (ex. contrôleur web) : gère et transforme en réponse
public ReponseHttp annulerCommande(Long id) {
    try {
        commandeService.annuler(id);
        return ReponseHttp.ok();
    } catch (CommandeIntrouvableException e) {
        return ReponseHttp.introuvable(e.getMessage());
    }
}
```

Traduire l'erreur technique en exception métier là où l'information technique est disponible (accès aux données) ; la laisser traverser les couches intermédiaires qui n'ont rien à en faire ; ne la traiter réellement qu'à la frontière technique (contrôleur, tâche planifiée, point d'entrée) où une vraie décision peut être prise.

### Exemple 4 — Alternatives aux exceptions pour un cas attendu

```java
// Absence attendue : Optional plutôt qu'une exception
public Optional<Produit> chercherParCode(String code) {
    return catalogue.stream()
            .filter(p -> p.code().equals(code))
            .findFirst();
}

// Échec attendu et fréquent : objet résultat plutôt qu'une exception
public record ResultatValidation(boolean valide, List<String> erreurs) { }

public ResultatValidation validerCommande(Commande commande) {
    List<String> erreurs = new ArrayList<>();
    if (commande.lignes().isEmpty()) {
        erreurs.add("La commande ne contient aucune ligne");
    }
    return new ResultatValidation(erreurs.isEmpty(), erreurs);
}
```

Un panier vide ou une saisie invalide sont des cas **courants**, pas des situations exceptionnelles : les traiter avec `Optional` ou un objet résultat évite de coder un chemin normal du programme avec des exceptions, plus lourdes à créer (capture de la pile d'appels) et moins lisibles pour un cas attendu.

### Choisir vérifiée ou non vérifiée : critères

| Situation | Plutôt vérifiée | Plutôt non vérifiée |
|---|---|---|
| L'appelant a une action corrective concrète et différenciée | ✅ | |
| L'erreur traverse de nombreuses couches avant traitement | | ✅ (évite de polluer chaque signature avec `throws`) |
| C'est une erreur de programmation (argument invalide, état incohérent) | | ✅ |
| L'API doit forcer chaque appelant à y réfléchir explicitement | ✅ | |

En pratique, beaucoup de code métier moderne (frameworks web, couches de service) penche vers des exceptions **non vérifiées**, documentées avec `@throws`, pour éviter la propagation de `throws` sur de nombreuses méthodes intermédiaires.

### Pièges courants

> **`catch (Exception e) { }` vide.** L'erreur disparaît sans laisser de trace ; le bug ne se manifeste que bien plus tard, loin de sa cause réelle. Journaliser au minimum (`logger.error(...)`), et ne relancer silencieusement que si c'est un choix documenté et délibéré.

> **Utiliser une exception pour un flux normal et fréquent.** Lever une exception à chaque produit non trouvé dans une boucle de recherche courante coûte en performance (création de la pile d'appels à chaque fois) et rend le code plus difficile à suivre qu'un simple `Optional` ou un test explicite.

> **Perdre la cause en enveloppant une exception.** `throw new ServiceIndisponibleException("Erreur");` sans passer l'exception d'origine à un constructeur `(message, cause)` fait disparaître la vraie erreur technique (SQL, réseau…) : le diagnostic en production devient beaucoup plus difficile.

### À retenir

- Créer des exceptions métier explicites plutôt que propager des exceptions techniques ou renvoyer `null`.
- Toujours conserver la cause d'origine (`super(message, cause)` ou `initCause()`).
- Ne jamais avaler une exception silencieusement ; ne jamais l'utiliser pour un contrôle de flux normal et fréquent.
- Traduire l'erreur technique en exception métier près de sa source ; la traiter réellement à la frontière technique.
- Pour un cas attendu (absence, validation), préférer `Optional` ou un objet résultat à une exception.

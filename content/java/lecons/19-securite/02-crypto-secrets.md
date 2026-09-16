---
id: crypto-secrets
chapitre: securite-robustesse
ordre: 2
titre: "Cryptographie et secrets"
termes:
  - terme: "Condensat (hash)"
    definition: "Empreinte de taille fixe calculée à partir d'une donnée, non réversible : on ne peut pas retrouver la donnée d'origine à partir du condensat seul. Sert à vérifier une intégrité (un fichier n'a pas changé) ou, sous une forme lente et salée, à stocker un mot de passe sans le conserver en clair."
  - terme: MessageDigest
    definition: "Classe de `java.security` qui calcule un condensat cryptographique (`MessageDigest.getInstance(\"SHA-256\")`, puis `digest(...)`). Adaptée aux vérifications d'intégrité, **pas** au stockage de mots de passe : trop rapide à calculer, ce qui facilite les essais massifs par un attaquant."
  - terme: SecureRandom
    definition: "Générateur de nombres aléatoires de `java.security`, adapté aux usages cryptographiques (clés, jetons, sels, identifiants de session) car imprévisible. `java.util.Random` est prévisible à partir de quelques sorties observées et ne doit jamais servir à produire un secret."
  - terme: "PBKDF2 (dérivation de clé lente et salée)"
    definition: "Fonction de dérivation disponible nativement dans le JDK (`SecretKeyFactory.getInstance(\"PBKDF2WithHmacSHA256\")`) qui applique un condensat un grand nombre de fois, avec un sel propre à chaque mot de passe, pour ralentir délibérément le calcul et rendre les essais massifs coûteux. Argon2, bcrypt et scrypt, non fournis par le JDK, poursuivent le même objectif via une bibliothèque externe."
  - terme: "AES/GCM (chiffrement authentifié)"
    definition: "Mode de chiffrement symétrique (`Cipher.getInstance(\"AES/GCM/NoPadding\")`) qui, en plus de rendre les données illisibles, garantit qu'elles n'ont pas été modifiées : toute altération du texte chiffré fait échouer le déchiffrement plutôt que de produire silencieusement des données corrompues."
  - terme: keytool
    definition: "Outil en ligne de commande fourni avec le JDK pour gérer des magasins de clés et des certificats : générer une paire de clés, créer un certificat, l'importer ou l'exporter d'un keystore."
  - terme: "Validation de certificat TLS"
    definition: "Vérification, effectuée automatiquement par le client TLS, que le certificat présenté par le serveur est signé par une autorité de confiance et correspond au nom d'hôte contacté. Désactiver cette vérification (faux `TrustManager`, `HostnameVerifier` toujours vrai) supprime toute protection contre une interception du trafic."
quiz:
  - question: "Que reproche-t-on à ce code de vérification de mot de passe à la connexion ?"
    code: |
      MessageDigest sha = MessageDigest.getInstance("SHA-256");
      byte[] empreinte = sha.digest(motDePasseSaisi.getBytes());
      boolean valide = Arrays.equals(empreinte, empreinteStockee);
    choix:
      - "SHA-256 nu est trop rapide à calculer et n'utilise pas de sel : un attaquant qui obtient la table des empreintes peut tester des milliards de mots de passe par seconde et repérer les valeurs identiques entre comptes"
      - "SHA-256 ne produit pas un condensat de taille fixe, la comparaison peut échouer à tort"
      - "`MessageDigest` ne peut pas être utilisé pour des mots de passe car il lève une exception sur les caractères accentués"
      - "Le code est correct, SHA-256 est recommandé par l'OWASP pour le stockage de mots de passe"
    reponse: 0
    explication: "Un condensat cryptographique rapide comme SHA-256 seul est conçu pour être calculé vite — exactement l'inverse de ce qu'on veut pour un mot de passe. Sans sel, deux comptes avec le même mot de passe produisent la même empreinte, et des tables précalculées (rainbow tables) deviennent efficaces. Il faut une fonction volontairement lente et salée (PBKDF2 via `SecretKeyFactory`, ou bcrypt/Argon2 via une bibliothèque dédiée)."
  - question: "Pourquoi `java.util.Random` ne doit-il jamais servir à générer un jeton de réinitialisation de mot de passe ?"
    choix:
      - "Sa séquence est prévisible : connaître quelques sorties (ou la graine) permet de reconstituer les suivantes, ce qui rendrait le jeton devinable par un attaquant"
      - "`Random` est plus lent que `SecureRandom`, ce qui ralentirait l'envoi de l'e-mail"
      - "`Random` ne peut générer que des nombres entiers, jamais de chaînes de caractères"
      - "`Random` lève une exception si on l'utilise en dehors d'un thread principal"
    reponse: 0
    explication: "`Random` est un générateur pseudo-aléatoire déterministe, conçu pour la reproductibilité (jeux, simulations), pas pour l'imprévisibilité. `SecureRandom` s'appuie sur une source adaptée aux usages cryptographiques : c'est le seul choix correct dès qu'un nombre aléatoire protège quelque chose (jeton, clé, sel, identifiant de session)."
  - question: "Quel est l'intérêt d'un mode de chiffrement authentifié comme AES/GCM par rapport à un chiffrement symétrique simple sans authentification ?"
    choix:
      - "Il détecte toute donnée chiffrée modifiée après coup : le déchiffrement échoue explicitement plutôt que de produire silencieusement des données corrompues ou manipulées"
      - "Il rend le chiffrement plus rapide, sans autre différence"
      - "Il dispense de gérer une clé secrète, la vérification suffit à elle seule"
      - "Il ne s'applique qu'aux fichiers, jamais à des données réseau"
    reponse: 0
    explication: "Un chiffrement non authentifié rend les données illisibles sans garantir qu'elles n'ont pas été altérées après coup — un attaquant peut parfois manipuler le texte chiffré de façon exploitable. Un mode authentifié comme AES/GCM ajoute une vérification d'intégrité : toute modification du texte chiffré fait échouer le déchiffrement, ce qui protège autant contre la lecture que contre la falsification."
---

## Essentiel

La règle d'or de la cryptographie appliquée : **ne jamais inventer son propre algorithme ni son propre protocole.** Les algorithmes standards (AES, SHA-256, PBKDF2, TLS...) ont été conçus, publiés et attaqués pendant des années par toute la communauté cryptographique ; une construction maison n'a bénéficié d'aucun de ces contrôles, même si elle « a l'air » solide.

Trois notions à ne pas confondre : un **condensat** (hash) transforme une donnée en empreinte non réversible, sans clé (`MessageDigest`) ; le **chiffrement** rend une donnée illisible sans la clé, mais réversible avec elle ; la **signature** garantit qu'une donnée provient bien du détenteur d'une clé privée et n'a pas été modifiée.

Pour un mot de passe, un condensat rapide comme SHA-256 seul ne suffit pas : il faut une fonction délibérément **lente et salée** (PBKDF2, disponible nativement dans le JDK ; ou bcrypt/Argon2 via une bibliothèque dédiée), qui rend les essais massifs coûteux pour un attaquant.

```java
SecureRandom sel = new SecureRandom();
byte[] octetsSel = new byte[16];
sel.nextBytes(octetsSel);

KeySpec spec = new PBEKeySpec(motDePasse, octetsSel, 210_000, 256);
SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
byte[] empreinte = factory.generateSecret(spec).getEncoded();
```

`SecureRandom` (jamais `Random`) produit tout ce qui doit être imprévisible : sel, clé, jeton. Les secrets eux-mêmes (clés, mots de passe de service, jetons d'API) ne se stockent jamais dans le code ni dans le dépôt : variables d'environnement ou coffre-fort de secrets dédié.

## Détail

### Exemple 1 — `MessageDigest` pour une intégrité, pas pour un mot de passe

```java
MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
byte[] empreinteFichier = sha256.digest(Files.readAllBytes(cheminFacture));
// Comparer empreinteFichier à une valeur de référence pour détecter une altération.
```

`MessageDigest` convient très bien pour vérifier qu'un fichier téléchargé n'a pas été corrompu ou modifié : sa rapidité est un avantage ici, contrairement au cas d'un mot de passe. MD5 et SHA-1 nus sont à éviter, y compris pour de l'intégrité non sensible à la sécurité : des collisions pratiques sont connues, et SHA-256 (ou une famille plus récente) est aujourd'hui le choix par défaut.

### Exemple 2 — `SecureRandom` pour un jeton de session

```java
SecureRandom random = new SecureRandom();
byte[] jetonBrut = new byte[32];
random.nextBytes(jetonBrut);
String jeton = Base64.getUrlEncoder().withoutPadding().encodeToString(jetonBrut);
```

Un jeton de session, de réinitialisation de mot de passe ou d'API doit être imprévisible. `SecureRandom` s'appuie sur une source adaptée aux usages cryptographiques ; `Random`, déterministe et reproductible à partir de sa graine, ne doit jamais produire une valeur qui protège quelque chose.

### Exemple 3 — Chiffrement symétrique avec un mode authentifié

```java
Cipher chiffreur = Cipher.getInstance("AES/GCM/NoPadding");
byte[] iv = new byte[12];
new SecureRandom().nextBytes(iv);
GCMParameterSpec parametres = new GCMParameterSpec(128, iv);

chiffreur.init(Cipher.ENCRYPT_MODE, cleAes, parametres);
byte[] texteChiffre = chiffreur.doFinal(numeroCompteClient.getBytes(StandardCharsets.UTF_8));
// iv et texteChiffre sont conservés ensemble ; iv n'est pas secret, il doit juste être unique par chiffrement.
```

AES en mode GCM (Galois/Counter Mode) fournit à la fois la confidentialité et l'authentification : toute modification du texte chiffré fait échouer le déchiffrement, au lieu de produire silencieusement une donnée corrompue. Le vecteur d'initialisation (IV) doit être unique à chaque chiffrement avec la même clé — le régénérer via `SecureRandom` pour chaque opération est la pratique attendue.

### Exemple 4 — `char[]` pour un mot de passe en mémoire

```java
public boolean seConnecter(char[] motDePasse) {
    try {
        boolean ok = verifier(motDePasse);
        return ok;
    } finally {
        Arrays.fill(motDePasse, '\0'); // efface le contenu dès que possible
    }
}
```

Un `String` est immuable : une fois créé, son contenu ne peut pas être effacé explicitement et reste en mémoire tant que le ramasse-miettes ne l'a pas collecté — avec un risque qu'il apparaisse dans un journal, un message d'erreur ou un cliché mémoire (heap dump). Un `char[]` peut être écrasé (`Arrays.fill`) dès qu'il n'est plus nécessaire, ce que les API sensibles du JDK (`JPasswordField.getPassword()`, par exemple) exposent d'ailleurs sous cette forme plutôt qu'en `String`.

### Condensat, chiffrement, signature

| | Réversible ? | Nécessite une clé ? | Usage typique |
|---|---|---|---|
| Condensat (hash) | Non | Non | Intégrité d'un fichier, empreinte de mot de passe (sous forme lente et salée) |
| Chiffrement symétrique | Oui, avec la même clé | Oui (une clé partagée) | Rendre une donnée illisible sans la clé (numéro de compte, contenu d'export) |
| Signature | Non (mais vérifiable) | Oui (paire clé privée/publique) | Garantir l'origine et l'intégrité d'une donnée (certificat, jeton) |

### Pièges courants

> **Utiliser MD5 ou SHA-1 nu pour un mot de passe.** Ces fonctions sont rapides par conception, ce qui est exactement le défaut recherché pour du hachage de mot de passe : un attaquant qui récupère la table peut tester des milliards de combinaisons par seconde sur du matériel courant. Une fonction lente et salée (PBKDF2, bcrypt, Argon2) est indispensable.

> **Désactiver la validation de certificat TLS pour contourner une erreur en développement.** Un faux `TrustManager` qui accepte tout certificat, ou un `HostnameVerifier` qui renvoie toujours vrai, supprime toute protection contre une interception du trafic (attaque de l'intermédiaire). Ce genre de code de contournement se retrouve trop souvent oublié en production ; la bonne réponse à un certificat qui ne valide pas est de corriger la chaîne de certification (`keytool` pour l'importer dans le magasin de confiance), jamais de désactiver la vérification.

> **Coder en dur une clé ou un mot de passe de service dans le code source.** Une clé commise dans un dépôt Git reste dans l'historique même après suppression du fichier. Les secrets doivent venir d'une variable d'environnement ou d'un coffre-fort de secrets dédié (gestionnaire de secrets du fournisseur cloud, Vault...), jamais du code ni d'un fichier de configuration versionné en clair.

### À retenir

- Ne jamais concevoir son propre algorithme ou protocole cryptographique ; utiliser les standards éprouvés du JDK ou d'une bibliothèque reconnue.
- Un mot de passe se hache avec une fonction lente et salée (PBKDF2 nativement, ou bcrypt/Argon2 via une bibliothèque) — jamais avec MD5 ou SHA-1 nus.
- `SecureRandom`, jamais `Random`, pour tout ce qui doit rester imprévisible : clé, sel, jeton.
- Un chiffrement symétrique moderne utilise un mode authentifié (AES/GCM) pour détecter toute altération, pas seulement assurer la confidentialité.
- Les secrets ne vivent ni dans le code ni dans le dépôt ; un `char[]` s'efface explicitement après usage, contrairement à un `String` immuable ; la validation de certificat TLS ne se désactive jamais.

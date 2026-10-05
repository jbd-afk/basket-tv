# Basket TV — version indépendante

Agenda basket avec Betclic Élite, Élite 2, EuroLeague, NBA et WNBA, horaires de Paris, chaînes françaises identifiées et alternatives étrangères lorsqu'aucun direct français n'est trouvé. Installation sur téléphone comme PWA.

Aucun compte ChatGPT, aucune base de données et aucune clé API personnelle ne sont nécessaires au fonctionnement du code. Le programme utilise des sources publiques. La LNB fournit un jeton d'accès public temporaire, récupéré automatiquement, sans connexion à un compte LNB.

## 1. Mettre les fichiers dans GitHub, depuis le navigateur

1. Extraire l'archive ZIP sur l'ordinateur.
2. Sur https://github.com/new, créer un dépôt nommé `basket-tv` et choisir **Private**. Un dépôt privé protège le code, pas l'accès au futur site.
3. Ne pas ajouter de README, licence ou fichier gitignore lors de la création : le dossier les fournit déjà.
4. Dans le dépôt vide, utiliser le lien **uploading an existing file**. On peut aussi utiliser **Add file > Upload files** si le dépôt contient déjà un fichier.
5. Ouvrir le dossier extrait `basket-tv-cloudflare`. Glisser **son contenu** dans GitHub : dossiers `app`, `lib`, `public` et fichiers à la racine. Ne pas déposer le ZIP ni le dossier parent entier.
6. Cliquer sur **Commit changes**.

Contrôle simple : `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `worker.ts` et `wrangler.jsonc` doivent apparaître directement à la racine du dépôt. `README.md` doit s'afficher. Si Windows masque les fichiers qui commencent par un point, les fichiers visibles suffisent au premier déploiement : les versions des outils sont également définies à l'étape suivante. Le `.gitignore` devra être ajouté avant d'utiliser un outil Git local.

## 2. Relier le dépôt à Cloudflare

1. Ouvrir https://dash.cloudflare.com et choisir le compte.
2. Aller dans **Workers & Pages**, puis créer une application/Worker et choisir l'import depuis **GitHub** (les libellés peuvent varier).
3. Autoriser Cloudflare à accéder uniquement au dépôt `basket-tv`, puis le sélectionner.
4. Conserver l'offre gratuite. Ne pas choisir un hébergement Pages par simple dépôt de fichiers : le projet a besoin du serveur Workers.
5. Utiliser ces réglages :

| Réglage | Valeur |
| --- | --- |
| Nom du Worker | `basket-tv` |
| Branche de production | `main`, ou la branche affichée dans GitHub |
| Dossier racine | `/` (racine du dépôt) |
| Commande de construction / Build command | `pnpm run build` |
| Commande de déploiement / Deploy command | `pnpm run deploy` |
| Variable de construction `NODE_VERSION` | `22.13.0` |
| Variable de construction `PNPM_VERSION` | `11.25.0` |

Les deux variables sont des réglages de construction, pas des secrets. Si elles ne sont pas proposées dans la création, les ajouter dans **Settings > Builds > Build Variables and Secrets**, puis relancer la construction. Laisser l'installation automatique des dépendances activée. Aucun dossier de sortie Pages, aucune BDD et aucun secret personnel ne sont à renseigner.

6. Lancer **Save and Deploy** et attendre la fin. Cloudflare installe les outils et construit le site sur ses serveurs : aucun terminal ni logiciel de développement n'est nécessaire sur l'ordinateur.
7. Utiliser l'adresse HTTPS `workers.dev` affichée par Cloudflare. Cette archive n'est pas encore déployée dans votre compte et ne contient pas une adresse préattribuée.

## 3. Choisir qui peut consulter le site

La connexion privée de ChatGPT a été retirée. Sans protection supplémentaire, l'adresse Cloudflare publiée est accessible à toute personne qui la connaît.

Pour réserver Basket TV à vous et à vos amis, activer **Cloudflare Access** pour le Worker et autoriser les adresses e-mail choisies. Chercher **Access / Enable Access** dans les réglages du Worker ou ses domaines. Privilégier la protection du Worker complet lorsqu'elle est proposée, pour couvrir aussi les éventuelles adresses de prévisualisation. Vérifier en navigation privée qu'une connexion est demandée avant de distribuer le lien.

Les options et conditions de Cloudflare Access sont distinctes de Workers. Vérifier l'offre présentée par Cloudflare avant d'activer un abonnement. Aucun accès aux appareils Home Assistant n'est nécessaire.

## 4. Vérifier puis installer

1. Ouvrir le site et tester Aujourd'hui, Demain et les cinq filtres de compétition.
2. Vérifier les sources et leurs dates. Une source indisponible n'est pas la preuve qu'aucun match n'est prévu.
3. Comparer quelques rencontres au calendrier officiel, notamment l'Élite 2, dont l'accès direct n'avait pas pu être vérifié lors de son ajout.
4. Sur téléphone, ouvrir la nouvelle adresse et utiliser **Installer sur mon appareil**. Sur iPhone : Safari > Partager > Sur l'écran d'accueil. Sur Android : menu Chrome > Installer / Ajouter à l'écran d'accueil.
5. Tester également l'installation et la reconnexion si Cloudflare Access est activé. L'application nécessite Internet ; hors connexion, elle affiche un message, sans conserver un calendrier potentiellement ancien.

## Fonctionnement et limites

- Pas de BDD : un cache Cloudflare de cinq minutes réduit les appels aux sources. Le bouton Actualiser peut donc afficher un résultat récupéré jusqu'à cinq minutes auparavant. `updatedAt` et les dates des sources reflètent la récupération, pas nécessairement l'heure de consultation.
- Les fichiers de secours sont des captures datées, pas une actualisation automatique de toute la saison. Ils ne doivent pas être présentés comme des données fraîches.
- Les calendriers et chaînes sont récupérés lors des consultations. Aucune tâche récurrente n'a été créée.
- Le programme traite plusieurs grilles et de gros calendriers. L'offre Workers Free impose notamment 100 000 requêtes par jour, 50 appels externes par requête et une limite CPU de 10 ms. La compilation et l'exécution locale ne prouvent pas le respect de la limite CPU en production. Contrôler **Metrics / Errors** après le premier déploiement ; une erreur 1102 peut nécessiter d'alléger la récupération ou de séparer les mises à jour. Ne pas passer automatiquement à une offre payante.
- L'accès réel aux sources depuis le compte Cloudflare et la consommation en production restent à vérifier après publication.
- Le stockage est petit : les 500 Go pCloud et le Raspberry ne sont pas nécessaires.
- Le framework actuel vinext est une version bêta ; les versions sont verrouillées dans `pnpm-lock.yaml` pour rendre les constructions reproductibles.

## En cas de problème

| Message ou symptôme | Vérification |
| --- | --- |
| `package.json` introuvable | Le contenu du dossier doit être à la racine GitHub ; vérifier le dossier racine de Cloudflare. |
| Worker name mismatch | Le nom doit être `basket-tv`, comme dans `wrangler.jsonc`. |
| Erreur de version Node/pnpm | Vérifier les deux variables de construction, puis relancer. |
| Le déploiement cherche le fichier source au lieu du fichier construit | La commande doit être `pnpm run deploy`, qui cible `dist/server/wrangler.json`. |
| Source temporairement indisponible | Tester plus tard et vérifier la source officielle. |
| Erreur 1102 | Examiner les limites CPU ; le cache n'élimine pas le coût d'une première récupération. |

En cas d'échec, transmettre le message d'erreur ou une capture des réglages, sans mot de passe ni jeton.

## Validation de cette livraison

Compilation de production réussie et vérification TypeScript réussie. Exécution locale dans le moteur Cloudflare : page d'accueil sans connexion ChatGPT, manifeste PWA, service worker et icône servis en HTTP 200 ; date invalide rejetée en HTTP 400. Les appels aux sources et l'installation sur un téléphone n'ont pas été vérifiés depuis votre compte Cloudflare.

## Références

- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/workers/platform/limits/

## Développement facultatif sur un ordinateur personnel

Avec Node.js 22.13 ou supérieur et pnpm 11.25 : `pnpm install --frozen-lockfile`, `pnpm run dev`, `pnpm run check`, `pnpm run build`. Le déploiement local utilise `pnpm exec wrangler login` puis `pnpm run deploy`. Ces commandes ne sont pas nécessaires au parcours dans le navigateur décrit ci-dessus.

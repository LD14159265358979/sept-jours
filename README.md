# Sept Jours

Sept Jours est une petite to-do list personnelle installable sur iPhone et Mac. Elle affiche aujourd’hui et les six jours suivants, synchronise les tâches et les notes, et conserve les données privées derrière une connexion par e-mail et mot de passe.

Le coût normal de cette architecture est de **0 €** : le site statique est publié sur GitHub Pages et les données utilisent l’offre gratuite de Supabase.

## Ce qui est inclus

- fenêtre glissante de sept jours ;
- navigation par périodes de sept jours vers le passé, avec retour direct à aujourd’hui ;
- tâches indépendantes identifiées par UUID, y compris lorsque leurs textes sont identiques ;
- priorités rouge, jaune et verte ;
- ajout, modification, suppression, report au lendemain et réorganisation par glisser-déposer ;
- tâches terminées barrées mais encore visibles ;
- suppression automatique côté application après 7 jours pour une tâche terminée, ou plus de 30 jours après `scheduled_date` ;
- une note synchronisée par jour, sans suppression automatique ;
- vue **Past Notes** avec recherche, modification et suppression ;
- jusqu’à trois compteurs d’événements futurs ;
- jusqu’à trois rendez-vous par jour, avec heure, description, modification et état terminé ;
- extrait biblique hebdomadaire issu de la traduction AELF ;
- authentification Supabase et Row Level Security ;
- synchronisation rapide entre appareils grâce à Supabase Realtime ;
- cache de la dernière consultation et interface PWA disponible hors connexion ;
- thème clair et thème sombre automatique ;
- déploiement automatique sur GitHub Pages après chaque `git push`.

## 1. Ce qu’il faut préparer

Vous aurez besoin de :

1. un compte GitHub gratuit ;
2. un compte Supabase gratuit ;
3. Git et Node.js 22 sur le Mac si vous souhaitez lancer l’application localement.

Le repository GitHub peut être public : il contient le code de l’interface, mais **pas vos tâches**. Les données restent dans Supabase et les règles RLS empêchent un visiteur non connecté d’y accéder.

## 2. Créer la base Supabase

### Créer le projet

1. Ouvrez [supabase.com](https://supabase.com/) et connectez-vous.
2. Cliquez sur **New project**.
3. Choisissez l’organisation gratuite.
4. Donnez un nom au projet, par exemple `sept-jours`.
5. Créez un mot de passe de base de données fort et conservez-le dans votre gestionnaire de mots de passe. Ce mot de passe ne va jamais dans l’application.
6. Choisissez une région proche, par exemple une région européenne.
7. Laissez l’offre **Free** sélectionnée et attendez la création du projet.

### Créer les tables et les règles de sécurité

1. Dans le menu Supabase, ouvrez **SQL Editor**.
2. Cliquez sur **New query**.
3. Ouvrez le fichier [`supabase/migrations/20260907000000_initial_schema.sql`](supabase/migrations/20260907000000_initial_schema.sql) de ce projet.
4. Copiez tout son contenu dans l’éditeur SQL puis cliquez sur **Run** une seule fois.
5. Ouvrez ensuite [`supabase/migrations/20260908000000_daily_appointments.sql`](supabase/migrations/20260908000000_daily_appointments.sql), copiez son contenu et cliquez à nouveau sur **Run**.

Ce script crée :

- `tasks` pour les tâches ;
- `daily_notes` pour les notes ;
- `upcoming_events` pour les compteurs ;
- `daily_appointments` pour les rendez-vous, limités à trois par journée ;
- les contraintes et index ;
- les règles Row Level Security ;
- la diffusion Realtime ;
- la limite de trois événements par utilisatrice.

Les règles utilisent `auth.uid()` : chaque requête ne peut lire ou modifier que les lignes dont `user_id` correspond à la personne connectée.

### Configurer l’authentification

1. Dans Supabase, ouvrez **Authentication** puis **Providers**.
2. Vérifiez que le fournisseur **Email** est activé.
3. Pour le premier démarrage, vous pouvez conserver la confirmation d’e-mail activée.
4. Ouvrez **Authentication → URL Configuration**.
5. Dans **Site URL**, saisissez l’adresse GitHub Pages finale, par exemple :

   `https://mon-compte.github.io/sept-jours/`

6. Dans **Redirect URLs**, ajoutez :

   - `http://localhost:5173/**`
   - `https://mon-compte.github.io/sept-jours/**`

7. Après avoir créé votre propre compte dans l’application, vous pouvez désactiver **Allow new users to sign up** pour empêcher la création d’autres comptes. Les règles RLS protègent déjà chaque compte séparément, mais cette étape est pratique pour une application strictement personnelle.

### Récupérer les deux valeurs publiques

1. Ouvrez **Project Settings → API Keys** — selon la version de l’interface, la rubrique peut simplement s’appeler **API**.
2. Copiez **Project URL**.
3. Copiez la clé **Publishable**. Si l’interface affiche encore l’ancienne appellation, utilisez la clé publique **anon**.

Ces deux valeurs sont prévues pour être utilisées dans un navigateur. Elles ne donnent pas de droits administrateur : la protection réelle est assurée par l’authentification et les règles RLS.

Ne copiez jamais dans ce projet :

- la clé `service_role` ;
- une clé secrète Supabase ;
- le mot de passe de la base ;
- un token personnel GitHub.

## 3. Essayer l’application localement

Dans Terminal, placez-vous dans le dossier du projet puis exécutez :

```bash
npm install
cp .env.example .env.local
```

Ouvrez `.env.local` et remplacez les exemples :

```dotenv
VITE_SUPABASE_URL=https://votre-identifiant.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre-cle-publique
```

Lancez ensuite :

```bash
npm run dev
```

Ouvrez l’adresse indiquée, normalement [http://localhost:5173/](http://localhost:5173/).

Sans fichier `.env.local`, l’application s’ouvre volontairement en mode démonstration. Aucune donnée de démonstration n’est envoyée dans le cloud.

Pour vérifier le projet :

```bash
npm test
npm run build
```

## 4. Créer le repository GitHub

### Depuis le site GitHub

1. Connectez-vous à [github.com](https://github.com/).
2. Cliquez sur **New repository**.
3. Choisissez un nom, par exemple `sept-jours`.
4. Sélectionnez **Public** pour bénéficier gratuitement de GitHub Pages avec un compte GitHub Free.
5. Ne cochez pas l’ajout automatique d’un README, puisque le projet en contient déjà un.
6. Cliquez sur **Create repository**.

### Envoyer le projet depuis le Mac

Dans Terminal, depuis le dossier du projet :

```bash
git init
git add .
git commit -m "Première version de Sept Jours"
git branch -M main
git remote add origin https://github.com/MON-COMPTE/sept-jours.git
git push -u origin main
```

Remplacez `MON-COMPTE` par votre nom d’utilisatrice GitHub et `sept-jours` par le nom réellement choisi.

## 5. Ajouter les valeurs Supabase à GitHub

Les valeurs Vite sont nécessaires pendant la construction du site.

1. Dans le repository GitHub, ouvrez **Settings**.
2. Ouvrez **Secrets and variables → Actions**.
3. Cliquez sur **New repository secret**.
4. Créez le secret `VITE_SUPABASE_URL` et collez l’URL du projet Supabase.
5. Créez le secret `VITE_SUPABASE_PUBLISHABLE_KEY` et collez la clé Publishable ou `anon`.

Il est normal que ces valeurs finissent dans le JavaScript construit : ce sont des identifiants publics du frontend. Les enregistrer comme secrets GitHub évite surtout de les écrire directement dans le repository. La clé `service_role`, elle, ne doit jamais être utilisée ici.

## 6. Activer GitHub Pages

1. Dans le repository, ouvrez **Settings → Pages**.
2. Dans **Build and deployment**, choisissez **GitHub Actions** comme source.
3. Ouvrez ensuite l’onglet **Actions** du repository.
4. Le workflow **Déployer Sept Jours sur GitHub Pages** doit démarrer automatiquement après le `push`.
5. Attendez que les étapes `build` et `deploy` deviennent vertes.
6. L’adresse finale apparaîtra dans le résumé du déploiement :

   `https://MON-COMPTE.github.io/NOM-DU-REPOSITORY/`

La configuration utilise des chemins relatifs ; la PWA fonctionne donc dans un sous-chemin GitHub Pages et pas seulement à la racine d’un domaine.

## 7. Première connexion

1. Ouvrez l’adresse GitHub Pages.
2. Cliquez sur **Première visite ? Créer un compte**.
3. Saisissez votre adresse e-mail et un mot de passe d’au moins huit caractères.
4. Si la confirmation d’e-mail Supabase est activée, ouvrez l’e-mail reçu et cliquez sur le lien de confirmation.
5. Revenez à l’application et connectez-vous.
6. Une fois ce compte créé, désactivez les nouvelles inscriptions dans Supabase si vous souhaitez que personne d’autre ne puisse créer de compte.

La session est conservée localement et automatiquement renouvelée. Vous devrez effectuer cette première connexion séparément sur le Mac et l’iPhone.

## 8. Installer sur iPhone

1. Ouvrez l’adresse GitHub Pages dans **Safari** — pas dans le navigateur intégré d’une autre application.
2. Touchez le bouton **Partager** représenté par un carré avec une flèche vers le haut.
3. Faites défiler la liste et choisissez **Ajouter à l’écran d’accueil**.
4. Conservez le nom **Sept Jours** puis touchez **Ajouter**.
5. Lancez ensuite l’application depuis sa nouvelle icône.
6. Connectez-vous une première fois. La session restera normalement active.

## 9. Utiliser ou installer sur Mac

Vous pouvez simplement garder l’adresse dans vos favoris.

Sur une version récente de Safari :

1. ouvrez l’application ;
2. choisissez **Fichier → Ajouter au Dock** ;
3. confirmez le nom **Sept Jours**.

Dans Chrome ou Edge, utilisez l’icône d’installation située à droite de la barre d’adresse lorsqu’elle apparaît.

## 10. Mettre l’application à jour plus tard

Après une modification du code :

```bash
git add .
git commit -m "Description de la modification"
git push
```

Le `git push` déclenche automatiquement les tests, la construction et le déploiement. La PWA vérifie ensuite les mises à jour de son cache et récupère la nouvelle version.

## 11. Synchronisation et fonctionnement hors connexion

Supabase est la source de vérité. L’application :

- recharge les données au démarrage ;
- écoute les changements Realtime ;
- se resynchronise lorsque la connexion revient ;
- se resynchronise lorsque l’application repasse au premier plan ;
- effectue une vérification périodique pendant son utilisation ;
- conserve localement la dernière copie reçue pour permettre une consultation en cas de coupure.

L’interface et les dernières données chargées restent consultables hors connexion. La V1 n’essaie pas de fusionner des modifications concurrentes effectuées hors ligne : lorsqu’Internet est absent, une modification non confirmée est annulée et l’état **Hors connexion** est affiché.

## 12. Règles de suppression

Le nettoyage s’exécute au lancement, au retour dans l’application et périodiquement.

Une tâche est supprimée lorsque la première des limites suivantes est atteinte :

- elle est terminée depuis au moins 7 jours ;
- sa date `scheduled_date` remonte à plus de 30 jours.

Le nettoyage transmet à Supabase une liste d’UUID. Il ne supprime jamais une tâche à partir de son titre. Deux tâches intitulées « Envoyer le mail » restent donc totalement indépendantes.

Les notes quotidiennes ne font jamais partie du nettoyage automatique.

## 13. Coût et limites de l’offre gratuite

GitHub Pages est gratuit pour un repository public avec GitHub Free. Supabase Free annonce notamment 500 Mo de base, 5 Go de trafic sortant et 50 000 utilisatrices ou utilisateurs actifs mensuels : c’est très supérieur aux besoins d’une seule personne et de petits textes.

Supabase peut mettre en pause un projet gratuit après une semaine d’activité insuffisante. Une utilisation quotidienne génère normalement assez de requêtes. Si le projet est malgré tout mis en pause, Supabase envoie un e-mail et vous pouvez le relancer gratuitement depuis le tableau de bord. Un projet en pause peut actuellement être restauré pendant un an.

Aucune carte bancaire, fonction serveur, tâche cron, abonnement Apple Developer, App Store ou nom de domaine n’est nécessaire.

## 14. Résolution des problèmes courants

### L’application affiche « Mode démonstration » après publication

Vérifiez que les deux secrets GitHub portent exactement les noms suivants, puis relancez le workflow dans l’onglet **Actions** :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### La connexion fonctionne mais aucune donnée ne se charge

Vérifiez que le script SQL complet a été exécuté dans le bon projet Supabase. Dans **Table Editor**, les tables `tasks`, `daily_notes` et `upcoming_events` doivent être présentes.

### Une confirmation d’e-mail renvoie vers une mauvaise adresse

Corrigez **Authentication → URL Configuration** dans Supabase et ajoutez l’adresse GitHub Pages exacte, avec le sous-chemin du repository.

### Les changements n’apparaissent pas immédiatement sur l’autre appareil

Vérifiez que la connexion Internet fonctionne. Fermez puis rouvrez l’application. Le script SQL ajoute les trois tables à `supabase_realtime`, mais un rechargement manuel récupère également toujours l’état distant.

### Le projet Supabase est en pause

Ouvrez le tableau de bord Supabase, sélectionnez le projet puis cliquez sur **Resume project**. Une fois relancé, rouvrez Sept Jours.

## Structure utile du projet

- `src/App.tsx` : assemblage principal de l’application ;
- `components/` : cartes de jours, tâches, connexion, compteurs et Past Notes ;
- `hooks/use-app-data.ts` : état, synchronisation, cache et nettoyage ;
- `services/data-service.ts` : requêtes Supabase ciblées par UUID et utilisatrice ;
- `lib/date-utils.ts` : dates calendaires locales et règles d’expiration ;
- `lib/weekly-verses.ts` : rotation hebdomadaire des extraits AELF ;
- `supabase/migrations/` : schéma SQL et politiques RLS ;
- `.github/workflows/deploy-pages.yml` : tests, build et publication automatiques ;
- `app/globals.css` : direction visuelle principale.

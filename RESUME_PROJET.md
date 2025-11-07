# Résumé du Projet WEB- Plateforme de Gestion des Services d'Immigration

## Vue d'ensemble du Projet

**Nom du Projet:** Patrick Travel Services - Plateforme de Gestion des Services d'Immigration  
**Version:** 0.1.0  
**Type:** Application Web Progressive (PWA)  
**Technologie Principale:** Next.js 15 avec App Router

### Description

Plateforme complète de gestion des services d'immigration permettant aux clients de soumettre des demandes de visa, aux agents de gérer les dossiers et aux administrateurs de superviser l'ensemble du système. L'application offre une expérience utilisateur moderne avec support en temps réel pour la messagerie, gestion des documents et suivi des dossiers.

---

## Fonctionnalités Principales

### 1. Authentification et Autorisation

- **Firebase Authentication** pour la gestion sécurisée des utilisateurs
- Contrôle d'accès basé sur les rôles (Admin, Agent, Client)
- Réinitialisation de mot de passe et vérification par email
- Rafraîchissement automatique des tokens via Firebase SDK
- Compatibilité web et mobile

### 2. Gestion des Dossiers (Cases)

- Cycle de vie complet des dossiers
- Suivi en temps réel du statut des dossiers
- Vérification et gestion des documents
- Attribution des dossiers aux agents
- Notes internes et commentaires
- Historique des changements de statut
- Transfert de dossiers entre agents
- Analytics et rapports sur les dossiers

**Types de Services:**

- Visa étudiant (STUDENT_VISA)
- Permis de travail (WORK_PERMIT)
- Réunification familiale (FAMILY_REUNIFICATION)
- Visa touriste (TOURIST_VISA)
- Visa d'affaires (BUSINESS_VISA)
- Résidence permanente (PERMANENT_RESIDENCY)

**Statuts des Dossiers:**

- SOUMIS (SUBMITTED)
- EN RÉVISION (UNDER_REVIEW)
- DOCUMENTS REQUIS (DOCUMENTS_REQUIRED)
- EN TRAITEMENT (PROCESSING)
- APPROUVÉ (APPROVED)
- REJETÉ (REJECTED)
- FERMÉ (CLOSED)

### 3. Gestion des Clients

- Profils clients complets
- Historique des dossiers
- Gestion des documents
- Historique des communications
- Analytics clients

### 4. Gestion des Documents

- Upload sécurisé et stockage des documents
- Workflow de vérification des documents
- Sélection intuitive des dossiers (affiche les numéros de référence)
- Contrôle de version
- Validation des types et tailles de fichiers
- Statuts: EN ATTENTE (PENDING), APPROUVÉ (APPROVED), REJETÉ (REJECTED)

**Types de Documents Supportés:**

- Passeport, Carte d'identité
- Acte de naissance, Acte de mariage
- Diplôme, Lettre d'emploi
- Relevé bancaire, Preuve de résidence
- Photo, Autres

### 5. Communication et Messagerie

- Chat en temps réel (Firebase Realtime Database)
- Messagerie email avec routage basé sur les dossiers
- Suivi de présence et indicateurs de frappe
- Historique des emails dans PostgreSQL
- Notifications en temps réel
- Pièces jointes (images, PDF)
- Reçus de lecture

### 6. Ressources et Modèles

- Modèles de documents téléchargeables (formulaires, guides, listes de contrôle)
- Groupés par type de service et catégorie
- Gestion des modèles par l'admin
- Analytics de téléchargement
- Indicateurs de documents requis

### 7. Système de Messagerie

- Messagerie en temps réel avec Firebase
- Communication agent-client
- Support des pièces jointes
- Notifications de messages
- Historique des conversations
- Contrôle d'accès basé sur les dossiers

### 8. Tableau de Bord Analytics

- Statistiques et métriques des dossiers
- Suivi des revenus
- Métriques de performance des agents
- Analytics d'acquisition de clients
- Graphiques et rapports visuels (Recharts)

### 9. Système de Codes d'Invitation

- Onboarding sécurisé du personnel avec TanStack Table UI
- Pagination, filtrage et tri côté serveur
- Génération de codes basée sur les rôles (AGENT/ADMIN)
- Suivi d'utilisation et gestion d'expiration
- Tableau avec 8 colonnes et barres de progression

### 10. FAQ (Foire aux Questions)

- Gestion des FAQ par catégories
- Interface admin pour créer/modifier/supprimer
- Affichage public sur le site web
- Recherche et filtrage

### 11. Journalisation d'Audit

- Suivi des activités système pour la conformité
- Historique des actions utilisateur
- Historique des connexions
- Modifications de données
- Export des logs

### 12. Notifications

- Notifications en temps réel
- Types: MESSAGE, CASE_UPDATE, CASE_ASSIGNED, DOCUMENT_UPLOAD, etc.
- Centre de notifications
- Marquage lu/non lu

### 13. Gestion des Utilisateurs

- CRUD complet pour les utilisateurs (Admin uniquement)
- Gestion des rôles et permissions
- Activation/désactivation des comptes
- Historique des activités

### 14. Page d'Accueil Publique

- Section hero avec appel à l'action
- Présentation des services
- Section "À propos"
- Témoignages
- Formulaire de contact
- Statistiques

---

## Workflows par Type d'Utilisateur

### RÔLE: CLIENT

#### Workflow 1: Inscription et Authentification

1. Accès à la page d'inscription
2. Remplissage du formulaire (nom, email, téléphone, mot de passe)
3. Vérification de l'email (optionnel)
4. Connexion avec email/mot de passe
5. Accès au tableau de bord client

#### Workflow 2: Création d'un Nouveau Dossier

1. Accès à la section "Mes Dossiers"
2. Cliquer sur "Nouveau Dossier"
3. Sélectionner le type de service (Visa étudiant, Permis de travail, etc.)
4. Sélectionner la destination (optionnel)
5. Remplir les informations du formulaire multi-étapes:
   - Informations personnelles
   - Questions spécifiques au service
   - Upload de documents initiaux
6. Révision et soumission
7. Réception d'un numéro de référence unique (ex: PT-1234567890-ABC123)
8. Notification de confirmation

#### Workflow 3: Upload de Documents

1. Accéder à un dossier existant
2. Cliquer sur "Ajouter un Document"
3. Sélectionner le type de document
4. Choisir le fichier (PDF, image, Word)
5. Validation automatique (taille, type)
6. Upload vers UploadThing
7. Association avec le dossier
8. Statut initial: EN ATTENTE
9. Notification à l'agent assigné

#### Workflow 4: Suivi de Dossier

1. Accéder à "Mes Dossiers"
2. Voir la liste des dossiers avec leur statut
3. Cliquer sur un dossier pour voir les détails:
   - Numéro de référence
   - Statut actuel avec indicateur visuel
   - Timeline des changements de statut
   - Informations de l'agent assigné
   - Liste des documents requis
   - Liste des documents soumis
4. Recevoir des notifications lors des changements de statut

#### Workflow 5: Communication avec l'Agent

1. Accéder à "Messages" depuis le tableau de bord
2. Sélectionner un dossier pour voir la conversation
3. Envoyer un message texte
4. Joindre des fichiers si nécessaire
5. Recevoir des réponses en temps réel
6. Voir les indicateurs de lecture

#### Workflow 6: Consultation des Ressources

1. Accéder à "Ressources" ou "Templates"
2. Parcourir les modèles par catégorie
3. Filtrer par type de service
4. Télécharger les documents nécessaires
5. Voir les documents requis marqués

#### Workflow 7: Consultation de la FAQ

1. Accéder à la section FAQ
2. Parcourir les questions par catégorie
3. Utiliser la fonction de recherche
4. Lire les réponses détaillées

---

### RÔLE: AGENT

#### Workflow 1: Connexion et Accès

1. Connexion via l'interface web avec email/mot de passe
2. Accès au tableau de bord agent
3. Vue des dossiers assignés

#### Workflow 2: Gestion des Dossiers Assignés

1. Accéder à "Mes Dossiers" ou "Dossiers Assignés"
2. Voir la liste filtrée des dossiers assignés
3. Filtrer par statut, priorité, type de service
4. Rechercher par numéro de référence ou nom de client
5. Cliquer sur un dossier pour voir les détails complets

#### Workflow 3: Mise à Jour du Statut d'un Dossier

1. Ouvrir un dossier assigné
2. Voir le statut actuel
3. Sélectionner le nouveau statut dans le menu déroulant:
   - SOUMIS → EN RÉVISION
   - EN RÉVISION → DOCUMENTS REQUIS / EN TRAITEMENT
   - DOCUMENTS REQUIS → EN TRAITEMENT (après réception des documents)
   - EN TRAITEMENT → APPROUVÉ / REJETÉ
4. Ajouter une note optionnelle
5. Enregistrer
6. Notification automatique au client
7. Historique enregistré dans StatusHistory

#### Workflow 4: Vérification des Documents

1. Accéder à la section "Documents" d'un dossier
2. Voir la liste des documents avec statut EN ATTENTE
3. Cliquer sur un document pour le visualiser
4. Options:
   - **Approuver**: Document conforme
     - Statut → APPROUVÉ
     - Date de vérification enregistrée
     - Notification au client
   - **Rejeter**: Document non conforme
     - Statut → REJETÉ
     - Ajouter une raison de rejet
     - Notification au client avec demande de nouveau document
5. Vérification en lot possible (plusieurs documents)

#### Workflow 5: Demande de Documents Supplémentaires

1. Ouvrir un dossier
2. Section "Documents"
3. Cliquer sur "Demander un Document"
4. Sélectionner le type de document requis
5. Ajouter un message personnalisé
6. Envoyer la demande
7. Notification au client
8. Statut du dossier → DOCUMENTS REQUIS

#### Workflow 6: Communication avec le Client

1. Accéder à "Messages" depuis le tableau de bord
2. Sélectionner une conversation liée à un dossier
3. Voir l'historique des messages
4. Rédiger et envoyer un message
5. Joindre des fichiers si nécessaire
6. Messages en temps réel via Firebase
7. Voir les indicateurs de lecture

#### Workflow 7: Ajout de Notes Internes

1. Ouvrir un dossier
2. Section "Notes Internes" (visible uniquement aux agents/admins)
3. Rédiger une note
4. Enregistrer
5. Notes visibles par tous les agents/admins travaillant sur le dossier

#### Workflow 8: Consultation des Informations Client

1. Ouvrir un dossier
2. Voir la carte "Informations Client"
3. Accéder au profil complet du client
4. Voir l'historique des dossiers du client
5. Voir les communications précédentes

#### Workflow 9: Consultation des Analytics Personnels

1. Accéder au tableau de bord
2. Voir les statistiques personnelles:
   - Nombre de dossiers actifs
   - Dossiers en attente de révision
   - Taux de complétion
   - Documents en attente de vérification

---

### RÔLE: ADMINISTRATEUR

#### Workflow 1: Connexion et Accès Administrateur

1. Connexion via l'interface web
2. Accès au tableau de bord administrateur complet
3. Vue globale de tous les dossiers, utilisateurs et statistiques

#### Workflow 2: Gestion des Utilisateurs

1. Accéder à "Utilisateurs" dans le menu admin
2. Voir la liste de tous les utilisateurs avec filtres:
   - Par rôle (CLIENT, AGENT, ADMIN)
   - Par statut (actif/inactif)
   - Par date d'inscription
3. Actions disponibles:
   - **Créer un nouvel utilisateur** (Agent/Admin)
   - **Voir les détails** d'un utilisateur
   - **Modifier** les informations
   - **Activer/Désactiver** un compte
   - **Voir l'historique d'activité**
   - **Réinitialiser le mot de passe**
4. Export de la liste (CSV/Excel)

#### Workflow 3: Gestion des Codes d'Invitation

1. Accéder à "Codes d'Invitation"
2. Voir la liste des codes avec:
   - Code unique
   - Rôle (AGENT/ADMIN)
   - Nombre d'utilisations
   - Date d'expiration
   - Statut (actif/inactif)
3. Créer un nouveau code:
   - Sélectionner le rôle
   - Définir le nombre maximum d'utilisations
   - Définir la date d'expiration
   - Ajouter un objectif/purpose
4. Désactiver un code existant
5. Suivre l'utilisation en temps réel

#### Workflow 4: Attribution et Réassignation de Dossiers

1. Accéder à "Dossiers" → Voir tous les dossiers
2. **Attribuer un dossier:**
   - Ouvrir un dossier non assigné
   - Cliquer sur "Attribuer à un Agent"
   - Sélectionner un agent dans la liste
   - Ajouter une note optionnelle
   - Confirmer
   - Notification à l'agent
3. **Réassigner un dossier:**
   - Ouvrir un dossier assigné
   - Cliquer sur "Réassigner"
   - Sélectionner le nouvel agent
   - Sélectionner la raison (Réassignation, Couverture, Spécialisation, Charge de travail, Autre)
   - Ajouter des notes de transfert
   - Options de notification (client, ancien agent)
   - Confirmer
   - Historique enregistré dans TransferHistory

#### Workflow 5: Gestion Globale des Dossiers

1. Accéder à "Dossiers"
2. Filtres avancés:
   - Par statut
   - Par agent assigné
   - Par type de service
   - Par date (plage de dates)
   - Par priorité
3. Actions:
   - **Mettre à jour le statut** (même pour les dossiers APPROUVÉS)
   - **Modifier la priorité** (LOW, NORMAL, HIGH, URGENT)
   - **Ajouter des notes internes**
   - **Voir l'historique complet**
   - **Fermer un dossier**
4. Export de rapports

#### Workflow 6: Gestion des Documents

1. Accéder à "Documents"
2. Voir tous les documents avec filtres:
   - Par dossier
   - Par statut
   - Par type
   - Par date d'upload
3. Actions:
   - **Approuver en lot** plusieurs documents
   - **Rejeter** avec raison
   - **Télécharger** les documents
   - **Voir les détails** (uploadé par, date, taille)

#### Workflow 7: Gestion des Modèles de Documents

1. Accéder à "Templates" ou "Modèles"
2. Voir la liste des modèles existants
3. **Créer un nouveau modèle:**
   - Nom et description
   - Catégorie
   - Type de service associé
   - Upload du fichier PDF
   - Marquer comme document requis (optionnel)
4. **Modifier** un modèle existant
5. **Désactiver/Supprimer** un modèle
6. Voir les statistiques de téléchargement

#### Workflow 8: Gestion des FAQ

1. Accéder à "FAQ"
2. Voir la liste des questions/réponses
3. **Créer une nouvelle FAQ:**
   - Question
   - Réponse (éditeur de texte riche)
   - Catégorie
   - Ordre d'affichage
   - Activer/Désactiver
4. **Modifier** une FAQ existante
5. **Supprimer** une FAQ
6. **Réorganiser** l'ordre d'affichage

#### Workflow 9: Analytics et Rapports

1. Accéder à "Analytics" ou "Statistiques"
2. Voir le tableau de bord avec:
   - **Vue d'ensemble:**
     - Total de clients
     - Dossiers actifs
     - Documents en attente
     - Complétés ce mois
   - **Graphiques:**
     - Dossiers par statut (graphique circulaire)
     - Dossiers par type de service (graphique en barres)
     - Tendances temporelles (graphique linéaire)
     - Performance des agents
   - **Métriques:**
     - Taux de conversion
     - Temps moyen de traitement
     - Taux de réussite
3. **Générer des rapports personnalisés:**
   - Sélectionner les critères
   - Période de temps
   - Export PDF/Excel

#### Workflow 10: Gestion des Paramètres Système

1. Accéder à "Paramètres"
2. Sections disponibles:
   - **Informations de l'entreprise**
   - **Coordonnées**
   - **Heures d'ouverture**
   - **Langues supportées**
   - **Paramètres de notification**
   - **Templates d'emails**
3. Modifier et enregistrer les paramètres

#### Workflow 11: Consultation des Logs d'Audit

1. Accéder à "Logs d'Audit"
2. Voir toutes les activités système:
   - Actions utilisateur
   - Historique des connexions
   - Modifications de données
   - Accès aux ressources
3. Filtrer par:
   - Utilisateur
   - Type d'action
   - Plage de dates
4. Export des logs pour conformité

#### Workflow 12: Gestion des Destinations

1. Accéder à "Destinations" (si disponible)
2. Créer/modifier/supprimer des destinations
3. Associer les destinations aux dossiers

#### Workflow 13: Gestion des Messages/Communications

1. Accéder à "Messages"
2. Voir toutes les conversations
3. Filtrer par dossier, client, agent
4. Superviser les communications (si nécessaire)
5. Voir les statistiques de communication

#### Workflow 14: Gestion des Notifications Système

1. Accéder à "Notifications"
2. Voir toutes les notifications du système
3. Créer des notifications système (annonces)
4. Gérer les préférences de notification

---

## Déroulement de l'Implémentation du Projet

### Phase 1: Configuration Initiale et Infrastructure (Semaine 1-2)

#### 1.1 Setup du Projet

- Initialisation du projet Next.js 15 avec TypeScript
- Configuration de Tailwind CSS 4
- Setup de shadcn/ui pour les composants UI
- Configuration de Prisma ORM avec PostgreSQL
- Configuration de Firebase (Authentication + Realtime Database)
- Setup de l'environnement de développement (.env)

#### 1.2 Architecture de Base

- Structure de dossiers (feature-based)
- Configuration des routes API
- Setup du middleware d'authentification
- Configuration de la base de données (Prisma schema)
- Migration initiale de la base de données

#### 1.3 Services de Base

- Service d'authentification Firebase
- Service de base de données (Prisma)
- Service de logging
- Service de gestion des erreurs
- Configuration CORS et rate limiting

### Phase 2: Authentification et Autorisation (Semaine 2-3)

#### 2.1 Système d'Authentification

- Implémentation de l'inscription (register)
- Implémentation de la connexion (login)
- Gestion des sessions Firebase
- Vérification d'email
- Réinitialisation de mot de passe
- Middleware de protection des routes

#### 2.2 Contrôle d'Accès Basé sur les Rôles (RBAC)

- Définition des rôles (CLIENT, AGENT, ADMIN)
- Middleware de vérification des rôles
- Guards de routes par rôle
- Utilitaires de permissions

### Phase 3: Gestion des Dossiers (Semaine 3-5)

#### 3.1 Modèle de Données

- Définition du schéma Case dans Prisma
- Modèles StatusHistory, CaseFormData
- Relations avec User, Document, Message

#### 3.2 API de Gestion des Dossiers

- CRUD complet (/api/cases)
- Endpoints de mise à jour de statut
- Endpoints d'attribution
- Endpoints de transfert
- Endpoints de gestion des priorités
- Endpoints d'historique

#### 3.3 Interface Utilisateur

- Liste des dossiers avec filtres et pagination
- Détails d'un dossier
- Formulaire de création
- Mise à jour de statut
- Timeline des changements
- Attribution/réassignation

### Phase 4: Gestion des Documents (Semaine 5-6)

#### 4.1 Upload de Fichiers

- Intégration d'UploadThing
- Configuration des endpoints d'upload
- Validation des fichiers (taille, type)
- Gestion des erreurs d'upload

#### 4.2 Modèle de Données

- Schéma Document dans Prisma
- Relations avec Case et User
- Statuts des documents

#### 4.3 API de Gestion des Documents

- Upload de documents
- Liste des documents
- Vérification (approbation/rejet)
- Téléchargement
- Suppression

#### 4.4 Interface Utilisateur

- Liste des documents
- Upload de documents
- Visualisation des documents
- Interface de vérification (agent/admin)

### Phase 5: Système de Messagerie (Semaine 6-8)

#### 5.1 Configuration Firebase Realtime Database

- Setup de la structure de données
- Règles de sécurité Firebase
- Service de chat côté serveur

#### 5.2 API de Messagerie

- Envoi de messages
- Récupération des conversations
- Gestion des pièces jointes
- Statuts de lecture

#### 5.3 Interface de Chat en Temps Réel

- Hook React pour le chat en temps réel
- Composant de chat UI
- Liste des conversations
- Support des pièces jointes
- Indicateurs de frappe
- Reçus de lecture

#### 5.4 Optimisations de Performance

- Pagination des messages
- Cache intelligent
- Support offline
- Reconnexion automatique

### Phase 6: Notifications (Semaine 8-9)

#### 6.1 Modèle de Données

- Schéma Notification dans Prisma
- Types de notifications

#### 6.2 Service de Notifications

- Création de notifications
- Notification en temps réel via Firebase
- Marquage lu/non lu
- Batch processing pour performance

#### 6.3 Interface Utilisateur

- Centre de notifications
- Badge de compteur non lu
- Liste des notifications
- Actions sur les notifications

### Phase 7: Gestion des Utilisateurs et Admin (Semaine 9-11)

#### 7.1 API d'Administration

- Gestion des utilisateurs (CRUD)
- Gestion des codes d'invitation
- Statistiques et analytics
- Logs d'audit

#### 7.2 Interface Admin

- Tableau de bord admin
- Gestion des utilisateurs avec table TanStack
- Gestion des codes d'invitation
- Analytics avec graphiques Recharts

### Phase 8: Ressources et Templates (Semaine 11-12)

#### 8.1 Gestion des Templates

- Modèle DocumentTemplate dans Prisma
- Upload de templates
- Association avec types de services
- Statistiques de téléchargement

#### 8.2 Interface Utilisateur

- Liste des templates
- Filtrage par catégorie/service
- Téléchargement
- Interface admin pour gestion

### Phase 9: FAQ (Semaine 12-13)

#### 9.1 Modèle de Données

- Schéma FAQ dans Prisma
- Catégories et ordre

#### 9.2 API FAQ

- CRUD complet
- Endpoints publics et admin

#### 9.3 Interface Utilisateur

- Affichage public avec recherche
- Interface admin pour gestion

### Phase 10: Page d'Accueil Publique (Semaine 13-14)

#### 10.1 Composants de Landing

- Section Hero
- Section Services
- Section À Propos
- Section Témoignages
- Section Contact
- Footer

#### 10.2 Formulaire de Contact

- API endpoint de contact
- Gestion des soumissions
- Notifications

### Phase 11: Optimisations et Améliorations (Semaine 14-15)

#### 11.1 Performance

- Optimisation des requêtes
- Cache avec React Query
- Lazy loading des composants
- Optimisation des images

#### 11.2 Expérience Utilisateur

- Animations et transitions
- Feedback visuel
- Gestion des erreurs améliorée
- Messages de succès/erreur

#### 11.3 Sécurité

- Validation des entrées (Zod)
- Protection CSRF
- Rate limiting
- Hashage des données sensibles dans les logs

### Phase 12: Progressive Web App (PWA) (Semaine 15-16)

#### 12.1 Configuration PWA

- Manifest.json
- Service Worker
- Icônes PWA
- Support offline

#### 12.2 Fonctionnalités PWA

- Installation sur appareil
- Raccourcis d'application
- Mode offline

### Phase 13: Tests et Débogage (Semaine 16-17)

#### 13.1 Tests Fonctionnels

- Test de tous les workflows
- Test des permissions
- Test des cas limites

#### 13.2 Tests de Performance

- Optimisation des temps de chargement
- Optimisation des requêtes DB
- Cache hit rate

#### 13.3 Débogage

- Correction des bugs
- Amélioration des messages d'erreur
- Optimisation des requêtes

### Phase 14: Documentation et Déploiement (Semaine 17-18)

#### 14.1 Documentation

- Documentation technique
- Guide d'utilisation
- Documentation API
- README

#### 14.2 Déploiement

- Configuration de production
- Variables d'environnement
- Déploiement sur Vercel/autre plateforme
- Configuration Docker (optionnel)

#### 14.3 Finalisation

- Revue finale du code
- Tests de production
- Formation des utilisateurs
- Lancement

---

## Stack Technologique

### Frontend

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui
- **Data Tables:** TanStack Table v8
- **State Management:** Zustand + React Context API
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Notifications:** Sonner (shadcn)
- **File Upload:** UploadThing + React Dropzone
- **Date Handling:** date-fns
- **HTTP Client:** Axios avec interceptors

### Backend

- **API:** Next.js API Routes
- **Database:** PostgreSQL avec Prisma ORM
- **Authentication:** Firebase Auth
- **Real-time:** Firebase Realtime Database (Chat/Messaging)
- **File Upload:** UploadThing (web) + Cloudinary (mobile uploads)

### Outils de Développement

- **Code Quality:** ESLint 9, Prettier
- **Git Hooks:** Husky, lint-staged
- **Commit Convention:** Commitlint (Conventional Commits)
- **Type Checking:** TypeScript 5 (strict mode)
- **Package Manager:** pnpm

---

## Structure de la Base de Données

### Modèles Principaux

1. **User** - Utilisateurs du système (clients, agents, admins)
2. **Case** - Dossiers d'immigration
3. **Document** - Documents associés aux dossiers
4. **Message** - Messages email/chat
5. **Notification** - Notifications utilisateur
6. **StatusHistory** - Historique des changements de statut
7. **DocumentTemplate** - Modèles de documents téléchargeables
8. **FAQ** - Questions fréquemment posées
9. **InviteCode** - Codes d'invitation pour le personnel
10. **ActivityLog** - Logs d'audit
11. **TransferHistory** - Historique des transferts de dossiers
12. **Contact** - Soumissions du formulaire de contact
13. **Destination** - Destinations disponibles

---

## Sécurité

### Mesures de Sécurité Implémentées

- Firebase Authentication avec tokens sécurisés
- Vérification des tokens Firebase sur toutes les routes API
- Contrôle d'accès basé sur les rôles (RBAC)
- Protection des routes avec middleware
- Validation des entrées avec Zod
- Prévention des injections SQL via Prisma ORM
- Protection XSS intégrée à Next.js
- Configuration CORS
- Hashage HMAC-SHA256 des données sensibles dans les logs
- Rate limiting sur les endpoints critiques

---

## Métriques de Performance

### Optimisations Implémentées

- **Cache:** React Query + localStorage pour messages
- **Pagination:** Messages chargés par lots de 50
- **Lazy Loading:** Composants chargés à la demande
- **Code Splitting:** Automatique avec Next.js
- **Image Optimization:** Next.js Image component
- **Batch Processing:** Notifications traitées par lots

### Temps de Chargement

- **Initial Load (cached):** < 1 seconde
- **Initial Load (fresh):** < 3 secondes
- **Message Delivery:** < 1 seconde
- **Document Upload:** Dépend de la taille du fichier

---

## Déploiement

### Environnement de Production

- **Plateforme:** Vercel (recommandé) ou Docker
- **Base de Données:** PostgreSQL (Neon, Supabase, ou autre)
- **Storage:** UploadThing pour fichiers
- **Real-time:** Firebase Realtime Database

### Variables d'Environnement Requises

- `DATABASE_URL` - URL de connexion PostgreSQL
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_FIREBASE_*` - Config Firebase client
- `UPLOADTHING_TOKEN` - Token UploadThing
- `PII_HASH_SECRET` - Secret pour hashage des données sensibles
- `NEXT_PUBLIC_APP_URL` - URL de l'application

---

## Conclusion

Cette plateforme offre une solution complète pour la gestion des services d'immigration avec:

- ✅ Gestion complète du cycle de vie des dossiers
- ✅ Communication en temps réel entre clients et agents
- ✅ Gestion sécurisée des documents
- ✅ Analytics et rapports pour les administrateurs
- ✅ Interface utilisateur moderne et intuitive
- ✅ Performance optimisée
- ✅ Sécurité renforcée

Le projet est prêt pour le MVP.

---

**Document redigé par**: Avom brice, Developer.
**Version**: 1.0  
**Projet**: Patrick Travel Services - Plateforme de Gestion des Services d'Immigration, WEB.
**lien github**: https://github.com/frckbrice/patrick-travel-services-web-app

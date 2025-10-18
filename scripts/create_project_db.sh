# #!/bin/bash

# # --------------------------------------------
# # Script interactif pour créer une base projet
# # et un utilisateur PostgreSQL sur macOS
# # --------------------------------------------

# # Superutilisateur PostgreSQL (nom de l'utilisateur macOS)
# PG_SUPERUSER=$(whoami)

# # Étape interactive : demander les infos du projet
# read -p "Nom de la base projet : " PG_PROJECT_DB
# read -p "Nom de l'utilisateur projet : " PG_PROJECT_USER
# read -s -p "Mot de passe pour l'utilisateur projet : " PG_PROJECT_PASSWORD
# echo -e "\n✅ Informations projet :"
# echo "Base : $PG_PROJECT_DB"
# echo "Utilisateur : $PG_PROJECT_USER"

# # Définir les locales
# export LC_ALL=en_US.UTF-8
# export LANG=en_US.UTF-8

# # 1️⃣ Créer la base si elle n'existe pas
# DB_EXISTS=$(psql -tAc "SELECT 1 FROM pg_database WHERE datname='$PG_PROJECT_DB'" postgres)
# if [ "$DB_EXISTS" = "1" ]; then
#     echo "⚠️ Base $PG_PROJECT_DB existe déjà"
# else
#     psql -v ON_ERROR_STOP=1 --username="$PG_SUPERUSER" --dbname=postgres -c "CREATE DATABASE $PG_PROJECT_DB;"
#     echo "✅ Base $PG_PROJECT_DB créée"
# fi

# # 2️⃣ Créer l'utilisateur projet si nécessaire
# USER_EXISTS=$(psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$PG_PROJECT_USER'" postgres)
# if [ "$USER_EXISTS" = "1" ]; then
#     echo "⚠️ Utilisateur $PG_PROJECT_USER existe déjà"
# else
#     psql -v ON_ERROR_STOP=1 --username="$PG_SUPERUSER" --dbname=postgres \
#         -c "CREATE USER $PG_PROJECT_USER WITH ENCRYPTED PASSWORD '$PG_PROJECT_PASSWORD';"
#     echo "✅ Utilisateur $PG_PROJECT_USER créé"
# fi

# # 3️⃣ Accorder les privilèges généraux (inclut CREATEDB)
# psql -v ON_ERROR_STOP=1 --username="$PG_SUPERUSER" --dbname=postgres \
#     -c "ALTER USER $PG_PROJECT_USER CREATEDB;"
# psql -v ON_ERROR_STOP=1 --username="$PG_SUPERUSER" --dbname=postgres \
#     -c "GRANT ALL PRIVILEGES ON DATABASE $PG_PROJECT_DB TO $PG_PROJECT_USER;"

# # 4️⃣ Accorder les privilèges sur le schéma public
# psql -v ON_ERROR_STOP=1 --username="$PG_SUPERUSER" --dbname="$PG_PROJECT_DB" <<-EOSQL
# GRANT CONNECT ON DATABASE $PG_PROJECT_DB TO $PG_PROJECT_USER;
# GRANT USAGE ON SCHEMA public TO $PG_PROJECT_USER;
# GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $PG_PROJECT_USER;
# GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $PG_PROJECT_USER;
# ALTER DEFAULT PRIVILEGES IN SCHEMA public
# GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $PG_PROJECT_USER;
# GRANT ALL ON SCHEMA public TO $PG_PROJECT_USER;
# GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $PG_PROJECT_USER;
# GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $PG_PROJECT_USER;
# ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $PG_PROJECT_USER;
# ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $PG_PROJECT_USER;
# EOSQL

# # 5️⃣ Démarrer PostgreSQL via Homebrew
# # brew services start postgresql@17
# pg_ctl -D /usr/local/var/postgresql@17 start
# sleep 3

# # Vérifier la connexion
# pg_isready -h localhost -p 5432
# if [ $? -eq 0 ]; then
#   echo "✅ PostgreSQL écoute sur localhost:5432"
# else
#   echo "❌ PostgreSQL n'écoute pas sur le port 5432"
#   exit 1
# fi

# echo "✅ Base $PG_PROJECT_DB et utilisateur $PG_PROJECT_USER configurés avec succès pour ce projet."

#!/bin/bash

# --------------------------------------------
# Script interactif pour créer une base projet
# et un utilisateur PostgreSQL sur macOS
# avec vérification intelligente du serveur
# --------------------------------------------

PG_VERSION="17"
PG_DATA_DIR="/usr/local/var/postgresql@${PG_VERSION}"
PG_CTL="/usr/local/opt/postgresql@${PG_VERSION}/bin/pg_ctl"
PG_PORT=5432
PG_SUPERUSER=$(whoami)

echo "🔍 Vérification du statut de PostgreSQL..."

# Vérifie si un fichier PID existe
if [ -f "${PG_DATA_DIR}/postmaster.pid" ]; then
    PID=$(head -1 "${PG_DATA_DIR}/postmaster.pid")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "⚠️ PostgreSQL est déjà en cours d'exécution (PID: $PID)"
    else
        echo "🚨 Fichier PID trouvé mais le processus $PID ne tourne pas."
        echo "🧹 Nettoyage du fichier postmaster.pid..."
        rm -f "${PG_DATA_DIR}/postmaster.pid"
        echo "♻️ Démarrage du serveur PostgreSQL..."
        "$PG_CTL" -D "$PG_DATA_DIR" start
        sleep 3
    fi
else
    echo "🟢 Aucun processus PostgreSQL détecté, démarrage du serveur..."
    "$PG_CTL" -D "$PG_DATA_DIR" start
    sleep 3
fi

# Vérifie la connexion après tentative de démarrage
pg_isready -h localhost -p "$PG_PORT" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ PostgreSQL écoute sur localhost:$PG_PORT"
else
  echo "❌ PostgreSQL ne semble pas démarré correctement"
  exit 1
fi

# Étape interactive : demander les infos du projet
read -p "Nom de la base projet : " PG_PROJECT_DB
read -p "Nom de l'utilisateur projet : " PG_PROJECT_USER
read -s -p "Mot de passe pour l'utilisateur projet : " PG_PROJECT_PASSWORD
echo -e "\n✅ Informations projet :"
echo "Base : $PG_PROJECT_DB"
echo "Utilisateur : $PG_PROJECT_USER"

# Définir les locales
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

# 1️⃣ Créer la base si elle n'existe pas
DB_EXISTS=$(psql -tAc "SELECT 1 FROM pg_database WHERE datname='$PG_PROJECT_DB'" postgres)
if [ "$DB_EXISTS" = "1" ]; then
    echo "⚠️ Base $PG_PROJECT_DB existe déjà"
else
    psql -v ON_ERROR_STOP=1 --username="$PG_SUPERUSER" --dbname=postgres -c "CREATE DATABASE $PG_PROJECT_DB;"
    echo "✅ Base $PG_PROJECT_DB créée"
fi

# 2️⃣ Créer l'utilisateur projet si nécessaire
USER_EXISTS=$(psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$PG_PROJECT_USER'" postgres)
if [ "$USER_EXISTS" = "1" ]; then
    echo "⚠️ Utilisateur $PG_PROJECT_USER existe déjà"
else
    psql -v ON_ERROR_STOP=1 --username="$PG_SUPERUSER" --dbname=postgres \
        -c "CREATE USER $PG_PROJECT_USER WITH ENCRYPTED PASSWORD '$PG_PROJECT_PASSWORD';"
    echo "✅ Utilisateur $PG_PROJECT_USER créé"
fi

# 3️⃣ Accorder les privilèges généraux (inclut CREATEDB)
psql -v ON_ERROR_STOP=1 --username="$PG_SUPERUSER" --dbname=postgres \
    -c "ALTER USER $PG_PROJECT_USER CREATEDB;"
psql -v ON_ERROR_STOP=1 --username="$PG_SUPERUSER" --dbname=postgres \
    -c "GRANT ALL PRIVILEGES ON DATABASE $PG_PROJECT_DB TO $PG_PROJECT_USER;"

# 4️⃣ Accorder les privilèges sur le schéma public
psql -v ON_ERROR_STOP=1 --username="$PG_SUPERUSER" --dbname="$PG_PROJECT_DB" <<-EOSQL
GRANT CONNECT ON DATABASE $PG_PROJECT_DB TO $PG_PROJECT_USER;
GRANT USAGE ON SCHEMA public TO $PG_PROJECT_USER;

-- Droits complets sur les tables existantes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $PG_PROJECT_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $PG_PROJECT_USER;

-- Droits complets sur les séquences existantes
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $PG_PROJECT_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $PG_PROJECT_USER;

-- Droits sur le schéma
GRANT ALL ON SCHEMA public TO $PG_PROJECT_USER;

-- Droits par défaut pour les nouvelles tables et séquences
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $PG_PROJECT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $PG_PROJECT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $PG_PROJECT_USER;
EOSQL


echo "✅ Base $PG_PROJECT_DB et utilisateur $PG_PROJECT_USER configurés avec succès pour ce projet."

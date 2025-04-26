# syntax=docker/dockerfile:1.4   # facultatif (utile pour BuildKit)
FROM node:18-alpine

# Répertoire de travail dans le conteneur
WORKDIR ./

# Copie les fichiers nécessaires au build (en priorité pour le cache Docker)
COPY package.json .
COPY package-lock.json .
COPY .env .
# Installation propre des dépendances (sans les dev si NODE_ENV=production)
RUN npm ci --omit=dev

# Copie le reste des fichiers du projet (index.js, etc.)
COPY . .

# Port exposé (ajuste selon ton app, ici 3000 pour Express par ex.)
EXPOSE 3000

# Commande de démarrage par défaut
CMD ["npm", "start"]
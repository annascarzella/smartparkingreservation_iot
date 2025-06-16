# Usa una versione stabile e compatibile
FROM node:20

WORKDIR /app

# Copia i file di package e installa le dipendenze prima
COPY package*.json ./
RUN npm ci

# Poi copia il resto dell'app
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

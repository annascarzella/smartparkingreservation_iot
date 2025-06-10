FROM node:23.4-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./

# Install dependencies
RUN npm install
RUN npm i nuxt
RUN npm rebuild

CMD ["npm", "run", "dev"]
FROM node:current-alpine

WORKDIR /app

COPY package.json package-lock.json ./

# Install dependencies
RUN npm install
RUN npm i nuxt
RUN npm rebuild

CMD ["npm", "run", "dev"]
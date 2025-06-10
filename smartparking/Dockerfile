FROM node:23.4-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

CMD ["npm", "run", "dev"]

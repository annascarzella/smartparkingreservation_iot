FROM node:current-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm rebuild

EXPOSE 5000

CMD ["node", "app.js"]
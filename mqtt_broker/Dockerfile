FROM node:current-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm rebuild

EXPOSE 8000
EXPOSE 1883

CMD ["node", "mqtt_broker.js"]
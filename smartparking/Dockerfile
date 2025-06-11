FROM node:current-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm rebuild

EXPOSE 3000

CMD ["npm", "run", "dev"]
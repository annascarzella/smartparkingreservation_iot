FROM node:current-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN chmod +x entrypoint.sh
RUN npm rebuild
RUN apk add --no-cache postgresql-client

EXPOSE 5000

ENTRYPOINT [ "/bin/sh" , "entrypoint.sh" ]
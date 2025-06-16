set dotenv-load

switch-branch branch:
    git checkout {{branch}}

stop:
    docker compose stop

down:
    docker compose down --remove-orphans
    docker volume prune -f
    docker network prune -f
    docker system prune -f
    docker builder prune -f
    docker image prune -f
    docker container prune -f

frontend:
    docker compose build --no-cache frontend
    docker compose up frontend

nodered:
    docker compose build --no-cache node-red
    docker compose up node-red

mqtt:
    docker compose build --no-cache mqtt
    docker compose up mqtt

devices:
    docker compose build --no-cache devices
    docker compose up devices

migration:
    docker compose build --no-cache database-migrations
    docker compose up database-migrations -d

postgres:
    docker compose build --no-cache postgres
    docker compose up postgres -d

backend:
    docker compose build --no-cache backend
    docker compose up backend

nuxt:
    cd smartparking && npm i && npm run dev
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

frontend-run:
    docker compose build --no-cache frontend
    docker compose up frontend

node-red:
    docker compose build --no-cache node-red
    docker compose up node-red

mqtt:
    docker compose build --no-cache mqtt
    docker compose up mqtt

devices:
    docker compose build --no-cache devices
    docker compose up devices
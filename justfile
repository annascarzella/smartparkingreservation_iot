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
    docker run -it -p 1880:1880 -v ./node-red:/data --name mynodered nodered/node-red
docker stop $(docker ps -a -q) ; docker-compose build --force-rm --no-cache ; docker-compose up --detach ; docker-compose logs -f

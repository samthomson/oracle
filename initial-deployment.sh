#!bin/bash

SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
source $SCRIPTPATH/.env

# next line doesn't work for some reason, doing it manually does
docker-machine ssh $DOCKER_MACHINE_NAME "cd / && git clone git@github.com:samthomson/oracle.git"

docker-machine scp .env $DOCKER_MACHINE_NAME:/oracle/.env
# oracle

## set up

### initial setup

1. `cp .env.sample .env` and fill in values
`docker-compose build`
2. `docker-compose run api yarn --silent`


## running

`docker-compose up`

api: `//localhost:3100`
phpmyadmin: `//localhost:3100`

## how it works

- call [nomics](https://nomics.com/docs/) every x (five) minutes to get all currency prices, store in db.
- expose gql api containing moving averages. These can be calculated on the fly by looking at the pricing data in db.

## todo

- expose gql endpoint with MAs
- crunch MAs on the fly
- add logging for errors
- download logs script

maybe later:
- replace sequelize with TypeORM

## deploy

1. if not done already:
	- create a VPS as per https://github.com/samthomson/readme/tree/master/docker-machine
	- [generate an ssh key and add to github](https://github.com/samthomson/readme/tree/master/docker-machine#optional)
2. `bash ./initial-deployment.sh`

### update / redeploy

`bash ./remote-redeploy.sh`
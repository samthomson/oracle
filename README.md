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

- call nomics every x (five) minutes to get all currency prices, store in db.
- expose gql api containing moving averages. These can be calculated on the fly by looking at the pricing data in db.

## todo

- pseudo-cron
- expose gql endpoint with MAs
- crunch MAs on the fly
- add logging for errors

maybe later:
- replace sequelize with TypeORM
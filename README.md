# oracle

## 1.0 how it works

- call [nomics](https://nomics.com/docs/) every x (five) minutes to get all currency prices, store in db.
- expose gql api containing moving averages. These can be calculated on the fly by looking at the pricing data in db.

## 2.0 set up

### initial setup

1. `cp .env.sample .env` and fill in values
`docker-compose build`
2. `docker-compose run api yarn --silent`

## 3.0 work on

`docker-compose up`

api: `//localhost:3100`
phpmyadmin: `//localhost:3100`

### 3.1 handy scripts

#### price data grouped in to periods with latest value per period shown

```
select periods.period, periods.created_at periodCreatedAt, log_entry.created_at as logEntryCreatedAt, log_entry.id as logEntryId, currency.symbol, currency_entry.price_BTC from log_entry JOIN (SELECT FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(created_at) - 2400)/3600)*3600 + 2400) AS period, created_at, max(id) as maxId, currencies_saved, count(1) as c from log_entry GROUP BY period ORDER BY period DESC) periods on log_entry.id = periods.maxId JOIN currency_entry on log_entry.id = currency_entry.log_entry_id join currency on currency_entry.currency_id = currency.id WHERE currency.symbol = 'ABBC' 
```

#### latest price values for all currencies
```
SELECT latestLogEntry.logId, latestLogEntry.logDate, currency.symbol, currency_entry.price_BTC FROM (SELECT log_entry.id AS logId, log_entry.created_at AS logDate FROM log_entry ORDER BY created_at DESC LIMIT 1) latestLogEntry JOIN currency_entry ON latestLogEntry.logId = currency_entry.log_entry_id JOIN currency ON currency_entry.currency_id = currency.id LIMIT 5000
```

## 4.0 deploy

### 4.1 initial deploy

1. if not done already:
	- create a VPS as per https://github.com/samthomson/readme/tree/master/docker-machine
	- [generate an ssh key and add to github](https://github.com/samthomson/readme/tree/master/docker-machine#optional)
2. `bash ./initial-deployment.sh`

### 4.2 update / redeploy

`bash ./remote-redeploy.sh`

### 4.3 download log files

The prod docker-compose maps the log directory from the container to the host. So can be downloaded via scp (run command from root):

`bash ./bash/download-logs.sh` (to `/serverlogs`)


## 5.0 todo

- expose gql endpoint
	- moving average for a single currency
	- moving average per multiple currency
	- latest price per currency, single and as one of many
- crunch MAs on the fly
- add logging for errors
- download logs script
- make a month view of number of currencies pulled per day (would be candlestick for min-max)

maybe later:
- replace sequelize with TypeORM
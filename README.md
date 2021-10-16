# oracle

A crypto currency moving average service. It logs prices at frequent intervals, and can then determine a moving average for a frequency and period on demand. It also calculates a short and long moving average constantly, such that a latest moving average can always be queried without the small delay of calculating it fresh (useful when querying many currencies' moving averages.)

Originally built around nomics api data, now it polls exchanges directly (currently bittrex and binance).

## 1.0 how it works

- call exchange every x minutes to get all currency prices, store in db.
- calculate a short and long moving average for each currency every y minutes and store in db.
- expose gql api containing currency data (latest market status from exchange, latest calculated moving averages, on demand moving average). 

### nomics mappings

Find the currency in the db by doing a LIKE query on `currency.name`. Look at prices of returned records and pick one matching market data (bittrex/binance). Then take it's `nomicsId` which can be used in a symbol map.

## 2.0 set up

### initial setup

1. `cp .env.sample .env` and fill in values
2. `docker-compose build`
3. `docker-compose run api yarn --silent`
4. `docker-compose run api yarn run migrate`

## 3.0 work on

`docker-compose up`

- api: `//localhost:3800`
- phpmyadmin: `//localhost:8082`

### 3.1 handy scripts

#### price data grouped in to periods with latest value per period shown

```
select periods.period, periods.created_at periodCreatedAt, log_entry.created_at as logEntryCreatedAt, log_entry.id as logEntryId, currency.symbol, currency_entry.price_quote from log_entry JOIN (SELECT FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(created_at) - 2400)/3600)*3600 + 2400) AS period, created_at, max(id) as maxId, currencies_saved, count(1) as c from log_entry GROUP BY period ORDER BY period DESC) periods on log_entry.id = periods.maxId JOIN currency_entry on log_entry.id = currency_entry.log_entry_id join currency on currency_entry.currency_id = currency.id WHERE currency.symbol = 'ABBC' 
```

#### latest price values for all currencies
```
SELECT latestLogEntry.logId, latestLogEntry.logDate, currency.symbol, currency_entry.price_quote FROM (SELECT log_entry.id AS logId, log_entry.created_at AS logDate FROM log_entry ORDER BY created_at DESC LIMIT 1) latestLogEntry JOIN currency_entry ON latestLogEntry.logId = currency_entry.log_entry_id JOIN currency ON currency_entry.currency_id = currency.id LIMIT 5000
```

### 3.2 migrations

run `yarn run migrate` from the `api` container. (`docker-compose run api yarn run migrate`)

test migration SQL here https://www.eversql.com/sql-syntax-check-validator/

## 4.0 deploy

Due to constant DB writes, it requires a certain level of CPU power. Currently running on Digital Ocean Basic 2GB with 2 vCPUs.

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

# 6.0 Speed optimizing

It's too slow at present and this constraint has prevented adding more exchanges/markets. Data is not being recorded/crunched fast enough, such that crunched MAs for currencies are lagging (by hours in cases).

Data ages are calculated around once a minute, and stored in the `data_ages` table.
When seeking to optimize speeds:
- this `data_ages` table can serve as a benchmark.
- check digital ocean droplet CPU usage
- check `log_entry` table to ensure currencies are being stored per entry.
- check `log_entry` table to see time spent crunching.

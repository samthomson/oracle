# oracle

A crypto currency moving average service. It logs prices at frequent intervals, and can then determine a moving average for a frequency and period on demand. It also calculates a short and long moving average constantly, such that a latest moving average can always be queried without the small delay of calculating it fresh (useful when querying many currencies' moving averages.)

Originally built around nomics api data, now it polls exchanges directly (currently bittrex and binance).


1. [How it works](#10-how-it-works)
2. [Setting up](#20-setting-up)
3. [Working on](#30-working-on)
4. [Deploying](#40-deploying)
5. [Using](#50-using)

## 1.0 How it works

- call exchange every x minutes to get all currency prices, store in db.
- calculate a short and long moving average for each currency every y minutes and store in db.
- expose gql api containing currency data (latest market status from exchange, latest calculated moving averages, on demand moving average). 

### nomics mappings

Find the currency in the db by doing a LIKE query on `currency.name`. Look at prices of returned records and pick one matching market data (bittrex/binance). Then take it's `nomicsId` which can be used in a symbol map.

## 2.0 Setting up

### initial setup

1. `cp .env.sample .env` and fill in values
2. `docker-compose build`
3. `docker-compose run api yarn --silent`
4. `docker-compose run api yarn run migrate`

## 3.0 Working on

`docker-compose up`

- api: `//localhost:3800`
- phpmyadmin: `//localhost:8082`

The docker-compose files start the project differently in development to production. In Production it will automatically acquire data from exchanges and start the api/server, however in development only the api/server is started and so data gathering must be started separately.

To start gathering data run `docker-compose run api yarn run forever`. That will - as in production - run a file that registers several cron like tasks to run on cycles (importing data, and crunching moving averages).

Explore the server package file (`~/oracle/api/package.json`) for other scripts that can be run from the api container (start with `docker-compose run api sh`).

Once the service has started acquiring data it can return moving averages via the API. The service needs to run (and acquire data) for longer than the shortest moving average you want to query. eg a ten hour moving average requires ten hours of samples, otherwise it will use the data it has and give a corresponding low (<100) confidence score.

### 3.1 handy scripts

#### price data grouped in to periods with latest value per period shown

note:
`log_entry.source = 1` and `market.id = '193` correspond to the market.
```
SELECT periods.period, periods.created_at periodCreatedAt, log_entry.created_at AS logEntryCreatedAt, log_entry.id AS logEntryId, market.symbol, market_entry.price_quote 
FROM log_entry 
JOIN 
(
	SELECT FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(created_at) - 3180)/3600)*3600 + 3180) AS period, created_at, max(id) AS maxId, currencies_saved, count(1) AS c
	FROM log_entry 
	WHERE log_entry.source = 1 
	GROUP BY period 
	ORDER BY period DESC
) periods 
	ON log_entry.id = periods.maxId 
JOIN market_entry ON log_entry.id = market_entry.log_entry_id 
JOIN market ON market_entry.market_id = market.id 
WHERE market.id = '193' AND period > NOW() - INTERVAL 600 MINUTE 
ORDER BY period 
DESC LIMIT 10; 
```
#### latest price values for all currencies
```
SELECT latestLogEntry.logId, latestLogEntry.logDate, currency.symbol, currency_entry.price_quote FROM (SELECT log_entry.id AS logId, log_entry.created_at AS logDate FROM log_entry ORDER BY created_at DESC LIMIT 1) latestLogEntry JOIN currency_entry ON latestLogEntry.logId = currency_entry.log_entry_id JOIN currency ON currency_entry.currency_id = currency.id LIMIT 5000
```

#### price data for a currency

```
SELECT market_entry.id, market_entry.market_id, market_entry.price_QUOTE, log_entry.created_at FROM `market_entry` 
JOIN log_entry ON market_entry.log_entry_id = log_entry.id 
WHERE market_entry.market_id=193 
ORDER BY log_entry.created_at DESC; 
```

### 3.2 migrations

run `yarn run migrate` from the `api` container. (`docker-compose run api yarn run migrate`)

test migration SQL here https://www.eversql.com/sql-syntax-check-validator/

## 4.0 Deploying

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

## 5.0 Using

The API can be explored via a graphiql UI at the top level of the API server (`/`).

## single moving average

Here we ask for a ten hour moving average (**10** samples at **60** minute intervals) on the **DOGE/BTC** market.
```
query {
  market( input:{symbol:"DOGE", quote:"BTC", sourceId:1}) {
    movingAverage(movingAverageInput:{samples:10, periodLength:60}) {
      value
      input {
        periodLength
        samples
        algorithm
      }
      confidence
      dataPoints {
        value
        datetime
      }
    }
  }
}
```

There are five required parameters (three to select the market, and two for calculating the moving average):

- **symbol**: the target coin
- **quote**: the market the coin is quoted in
- **sourceId**: what exchange/aggregator (0 = nomics, 1 = bittrex, 2 = binance) to use price data from
- **samples**: how many data points to use for calculating the moving average
- **periodLength**: the interval; how many minutes apart the data points should be

In the above query we get the `value` (the calculated moving average), a summary of the query/input including the algorithm used to calculate the moving average, a confidence score (out of 100, reflecting the number of data points used - can be lower if the oracle is missing data/prices), and the data points (the stored/historic prices used to calculate the moving average).

Note: Since the `movingAverage` query field/resolver is calculated on the fly, if this is queried for within a `markets` (multiple) and not `market` (single) query it will result in very slow queries. In this case you should query for pre-calculated moving averages.

## pre-calculated (crunched) moving averages

The oracle will pre-calculate moving averages as it acquires data, so that these can be queried more quickly - and notably for multiple currencies in one go.

### for one market

```
query {
  market( input:{symbol:"DOGE", quote:"BTC", sourceId:1}) {
    crunched {
      maInstant
      maThirtyMin
      maTenHour
      lastUpdated
    }
  }
}
```

There are just the three required parameters to select the market: 

- symbol: the target coin
- quote: the market the coin is quoted in
- sourceId: on what exchange/aggregator (0 = nomics, 1 = bittrex, 2 = binance)

Three pre-calculated moving averages can be queried:

- instant: three/five minutes
- half hour: between ten and thirty data points at 3 to 1 minute intervals respectively
- ten hour: ten data points taken at 60 minute intervals

Note: This query field/resolver can be used within a `market` and `markets` query all the same. The data is pre-calculated and pulled from the database with a join, so is a performant way to get moving averages for all markets at once.

# 6.0 Speed optimizing

It's too slow at present and this constraint has prevented adding more exchanges/markets. Data is not being recorded/crunched fast enough, such that crunched MAs for currencies are lagging (by hours in cases).

Data ages are calculated around once a minute, and stored in the `data_ages` table.
When seeking to optimize speeds:
- this `data_ages` table can serve as a benchmark.
- check digital ocean droplet CPU usage
- check `log_entry` table to ensure currencies are being stored per entry.
- check `log_entry` table to see time spent crunching.

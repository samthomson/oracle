# oracle

## how it works

- call CMC every x (five) minutes to get all currency prices, store in db.
- expose gql api containing moving averages. These can be calculated on the fly by looking at the pricing data in db.

## todo

- dockerize
- pseudo-cron
- call CMC and get price data
- save data to DB
- expose gql endpoint with MAs
- crunch MAs on the fly
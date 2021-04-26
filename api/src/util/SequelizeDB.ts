import Sequelize from 'sequelize'

import SequelizeDB from '../db/connection'
import * as Models from '../db/models'

import * as Types from '../declarations'

export const createLogEntry: any = (source: Types.ExchangeSource) =>
    Models.LogEntry.create({
        source,
    })

export const ensureBittrexMarketExistsAs: any = async (market: Types.BittrexMarketComposite) => {
    const {
        name,
        symbol,
        quote,
        minTradeSize,
        status,
        high,
        low,
        quoteVolume,
        lastTradeRate,
        bidRate,
        askRate,
        precision,
    } = market

    const sourceId = Types.Constants.Source.Bittrex
    const newData = {
        sourceId,
        name,
        symbol,
        quote,
        minTradeSize,
        status,
        high,
        low,
        quoteVolume,
        lastTradeRate,
        bidRate,
        askRate,
        precision,
    }

    // create or update
    const marketAlreadyExisting = await Models.Market.findOne({ where: { name } })

    if (marketAlreadyExisting) {
        await Models.Market.update(newData, {
            where: {
                name,
            },
        })
        return marketAlreadyExisting.get({ plain: true })
    } else {
        const newMarket = await Models.Market.create(newData)
        return newMarket.get({ plain: true })
    }
}

export const createCurrencyEntry: any = (marketId: number, logEntryId: number, priceQuote: number) => {
    return Models.MarketEntry.create({
        marketId,
        logEntryId,
        priceQuote,
    })
}

export const getCurrency = async ({
    nomicsId,
    quote,
    symbol,
    sourceId,
}: Types.CurrencyQueryInput): Promise<Types.Currency> => {
    let whereQuery: any = { sourceId, quote }

    // we need a numeric sourceId and a quote at a minimum
    if (isNaN(sourceId) || !quote) {
        return undefined
    }

    if (nomicsId) {
        whereQuery = { ...whereQuery, nomicsId }
    }
    if (symbol) {
        whereQuery = { ...whereQuery, symbol }
    }

    const market = await Models.Market.findOne({
        where: whereQuery,
        // include: SequelizeDatabase.CurrencyEntry,
        include: [
            {
                model: Models.MarketEntry,
                // @ts-ignore
                include: Models.LogEntry,
                limit: 1,
                order: [[Models.LogEntry, 'created_at', 'DESC']],
            },
        ],
    })

    return {
        ...market.get(),
        // @ts-ignore
        entries: market.market_entries,
    }
}

export const getCurrencies = async (): Promise<Types.CurrenciesQueryResult[]> => {
    // get latest log entry and associated currency prices
    const logEntry = await Models.LogEntry.findOne({
        include: [
            {
                model: Models.MarketEntry,
                // @ts-ignore
                include: Models.Currency,
                limit: 20, // todo: replace this with pagination logic
            },
        ],
        order: [['created_at', 'DESC']],
    })

    // @ts-ignore
    return (logEntry?.market_entries ?? []).map((marketEntry) => {
        return {
            id: marketEntry.currencyId,
            name: marketEntry.currency.name,
            symbol: marketEntry.currency.symbol,
            nomicsId: marketEntry.currency.nomicsId,
            latestEntry: {
                priceQuote: marketEntry.priceQuote,
                // @ts-ignore
                timeStamp: logEntry.createdAt.toISOString(),
            },
        }
    })
}

export const getForMovingAverage = async (
    periodLength: number, // minutes
    samples: number,
    marketId: number,
): Promise<number[]> => {
    // frequency - the length of each period
    // eg 30 minutes would be 1800 (seconds)
    // offset = current minutes % period length
    const dateNow = new Date()
    const currentMinutes = dateNow.getMinutes()
    const periodLengthSeconds = periodLength * 60
    const offSetSeconds = (currentMinutes % periodLength) * 60
    const sampleSpan = periodLength * samples

    const query = `
    select periods.period, periods.created_at periodCreatedAt, log_entry.created_at as logEntryCreatedAt, log_entry.id as logEntryId, market.symbol, market_entry.price_quote from log_entry JOIN (SELECT FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(created_at) - ${offSetSeconds})/${periodLengthSeconds})*${periodLengthSeconds} + ${offSetSeconds}) AS period, created_at, max(id) as maxId, currencies_saved, count(1) as c from log_entry GROUP BY period ORDER BY period DESC) periods on log_entry.id = periods.maxId JOIN market_entry on log_entry.id = market_entry.log_entry_id join market on market_entry.market_id = market.id WHERE market.id = '${marketId}' AND period > NOW() - INTERVAL ${sampleSpan} MINUTE ORDER BY period DESC LIMIT ${samples} 
    `

    // @ts-ignore
    const result = await SequelizeDB.query(query, { type: Sequelize.QueryTypes.SELECT })

    // @ts-ignore
    return result.map((row) => parseFloat(row.price_quote))
}

export const getMarkets = async (): Promise<Types.APIMarketsQueryResult[]> => {
    // hard coded to bittrex markets for now
    // @ts-ignore
    const markets: Types.DBMarketModelData[] = (
        await Models.Market.findAll({
            where: { sourceId: 1 },
            include: [
                {
                    model: Models.CrunchedMarketData,
                },
            ],
        })
    ).map((instance) => instance.get({ plain: true }))
    return markets.map((market) => {
        // @ts-ignore
        const { crunched_market_datum } = market
        const crunched = crunched_market_datum
            ? {
                  maThirtyMin: crunched_market_datum.maThirtyMin,
                  maTenHour: crunched_market_datum.maTenHour,
                  maInstant: crunched_market_datum.maInstant,
                  lastUpdated: crunched_market_datum.lastUpdated.toISOString(),
              }
            : undefined

        return {
            ...market,
            crunched,
        }
    })
}

export const getHealthData = async (): Promise<Types.HealthQueryResult> => {
    const totalBittrexMarkets = await Models.Market.count({
        where: {
            sourceId: 1,
        },
    })
    const healthyQuery = `SELECT count(market.id) as healthyBittrexMarkets FROM market JOIN crunched_market_data ON crunched_market_data.market_id = market.id WHERE market.source_id = 1 AND crunched_market_data.ma_thirty_min IS NOT NULL AND crunched_market_data.ma_ten_hour IS NOT NULL AND crunched_market_data.last_updated >= NOW() - INTERVAL 5 MINUTE`
    const healthyQueryResult = await SequelizeDB.query(healthyQuery, { type: Sequelize.QueryTypes.SELECT })

    // @ts-ignore
    const recentlyCrunchedBittrexMarkets = healthyQueryResult?.[0]?.healthyBittrexMarkets ?? 0
    const bittrexPercentCrunched =
        totalBittrexMarkets === 0
            ? 0
            : Number(((recentlyCrunchedBittrexMarkets / totalBittrexMarkets) * 100).toFixed(2))

    const latestDataAge = await Models.DataAge.findAll({
        limit: 1,
        order: [['datetime', 'DESC']],
    })

    const latestDataAges: Types.DataAges = latestDataAge?.[0]
        ? {
              // @ts-ignore
              min: latestDataAge[0].crunchedMin,
              // @ts-ignore
              max: latestDataAge[0].crunchedMax,
              // @ts-ignore
              average: latestDataAge[0].crunchedAverage,
              // @ts-ignore
              at: latestDataAge[0].datetime,
          }
        : undefined

    return {
        recentlyCrunchedMarkets: {
            bittrex: bittrexPercentCrunched,
        },
        dataAges: latestDataAges,
    }
}

/*
SELECT market.quote, market.symbol, crunched_market_data.ma_thirty_min, crunched_market_data.ma_ten_hour, crunched_market_data.last_updated FROM market JOIN crunched_market_data ON crunched_market_data.market_id = market.id WHERE market.source_id = 1 AND crunched_market_data.ma_thirty_min IS NOT NULL AND crunched_market_data.ma_ten_hour IS NOT NULL AND crunched_market_data.last_updated >= NOW() - INTERVAL 5 MINUTE LIMIT 1000 

SELECT count(market.id) as healthyBittrexMarkets FROM market JOIN crunched_market_data ON crunched_market_data.market_id = market.id WHERE market.source_id = 1 AND crunched_market_data.ma_thirty_min IS NOT NULL AND crunched_market_data.ma_ten_hour IS NOT NULL AND crunched_market_data.last_updated >= NOW() - INTERVAL 5 MINUTE 
*/

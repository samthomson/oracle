import Sequelize from 'sequelize'

import SequelizeDB from '../db/connection'
import * as Models from '../db/models'
import * as Helper from './helper'

import * as Types from '../declarations'

export const createLogEntry: any = (source: Types.ExchangeSource) =>
    Models.LogEntry.create({
        source,
    })

export const ensureExchangeMarketExistsAs: any = async (market: Types.ExchangeMarketComposite, sourceId) => {
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
        volumeUSD,
    } = market

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
        volumeUSD,
    }

    // create or update
    const marketAlreadyExisting = await Models.Market.findOne({ where: { sourceId, name } })

    if (marketAlreadyExisting) {
        await Models.Market.update(newData, {
            where: {
                sourceId,
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

export const getMarket = async ({
    quote,
    symbol,
    sourceId,
}: Types.CurrencyQueryInput): Promise<Types.APIMarketsQueryResult> => {
    const whereQuery: any = { sourceId, quote, symbol }

    // we need a numeric sourceId and a quote at a minimum
    if (isNaN(sourceId) || !quote) {
        return undefined
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
            {
                model: Models.CrunchedMarketData,
            },
        ],
    })

    return {
        ...market.get(),
        // @ts-ignore
        entries: market.market_entries,
        // @ts-ignore
        crunched: {
            // @ts-ignore
            ...market.crunched_market_datum.dataValues,
            // @ts-ignore
            lastUpdated: market.crunched_market_datum.dataValues.lastUpdated.toISOString(),
        },
    }
}

export const getForMovingAverage = async (
    periodLength: number, // minutes
    samples: number,
    marketId: number,
): Promise<Types.API.MovingAverageDataPoint[]> => {
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

    return result.map((row) => ({
        // @ts-ignore
        datetime: row.logEntryCreatedAt.toISOString(),
        // @ts-ignore
        value: parseFloat(row.price_quote),
    }))
}

export const getMarkets = async (): Promise<Types.APIMarketsQueryResult[]> => {
    // hard coded to bittrex/binance markets for now
    // @ts-ignore
    const markets: Types.DBMarketModelData[] = (
        await Models.Market.findAll({
            where: {
                [Sequelize.Op.or]: [{ sourceId: 1 }, { sourceId: 2 }],
                volumeUSD: { [Sequelize.Op.gte]: 60000 },
            },
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

        const exchange = Helper.sourceIntToString(market.sourceId)

        return {
            ...market,
            crunched,
            exchange,
        }
    })
}

export const getHealthData = async (): Promise<Types.HealthQueryResult> => {
    // todo: update to check source 2
    const totalBittrexMarkets = await Models.Market.count({
        where: {
            sourceId: 1,
        },
    })
    const healthyQuery = `SELECT count(market.id) as healthyBittrexMarkets FROM market JOIN crunched_market_data ON crunched_market_data.market_id = market.id WHERE market.volume_usd > 60000 AND crunched_market_data.ma_instant IS NOT NULL AND crunched_market_data.ma_thirty_min IS NOT NULL AND crunched_market_data.ma_ten_hour IS NOT NULL AND crunched_market_data.last_updated >= NOW() - INTERVAL 5 MINUTE`
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
              at: latestDataAge[0].datetime.toISOString(),
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

export const getOldSuperfluousLogEntries = async (): Promise<Types.OldEntry[]> => {
    const oldExcessQuery = `
    SELECT * FROM (
        SELECT log_entry.id, log_entry.source, date(log_entry.created_at) as date, t2.counted 
        FROM log_entry 
        JOIN (select count(*) as counted, created_at, source from log_entry group by date(created_at), source ) t2 ON date(t2.created_at) = date(log_entry.created_at) AND t2.source = log_entry.source AND id in (SELECT max(id) FROM log_entry 
        WHERE DATE(log_entry.created_at) < DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        GROUP BY DATE(created_at), source) 
        ORDER BY id desc 
        LIMIT 1000 
    ) query WHERE query.counted > 1 LIMIT 1000
    `

    const excessResult: Types.OldEntry[] = await SequelizeDB.query(oldExcessQuery, {
        type: Sequelize.QueryTypes.SELECT,
    })

    return excessResult
}

export const deleteOtherEntriesForDateAndSource = async (idToKeep: number, source: number, date: string) => {
    // select all where source matches, date matches, and id doesn't match.
    const selectQuery = `SELECT id FROM log_entry WHERE DATE(created_at) = '${date}' AND source = ${source} AND id <> ${idToKeep}`
    const excessEntries = (await SequelizeDB.query(selectQuery, { type: Sequelize.QueryTypes.SELECT })).map(
        (obj: { id: number }) => obj.id,
    )

    for (let j = 0; j < excessEntries.length; j++) {
        deleteLogEntryAndAssociatedMarketEntries(excessEntries[j])
    }
}

export const deleteLogEntryAndAssociatedMarketEntries = async (logEntryId: number) => {
    // delete market entries
    await Models.MarketEntry.destroy({
        where: {
            logEntryId,
        },
    })

    // delete log entry
    await Models.LogEntry.destroy({
        where: {
            id: logEntryId,
        },
    })
}

import Sequelize from 'sequelize'

import SequelizeDB from '../db/connection'
import * as Models from '../db/models'

import * as Types from '../declarations'

export const createLogEntry: any = (source: number) =>
    Models.LogEntry.create({
        source,
    })

export const ensureMarketExists: any = async (currency: Types.DraftMarket) => {
    const { symbol, quote, name, sourceId } = currency
    const [record, created] = await Models.Market.findOrCreate({
        where: {
            nomicsId: currency.id,
        },
        defaults: {
            nomicsId: currency?.id ?? null,
            symbol,
            quote,
            name,
            sourceId,
        },
    })
    return record.get({ plain: true })
}

export const createCurrencyEntry: any = (currencyId: number, logEntryId: number, draftMarket: Types.DraftMarket) => {
    const { price } = draftMarket

    return Models.MarketEntry.create({
        currencyId,
        logEntryId,
        priceBTC: price,
    })
}

export const getCurrency = async ({ nomicsId, symbol }: Types.CurrencyQueryInput): Promise<Types.Currency> => {
    let whereQuery = {}

    if (nomicsId) {
        whereQuery = { nomicsId }
    } else if (symbol) {
        whereQuery = { symbol }
    } else {
        return undefined
    }

    const currency = await Models.Market.findOne({
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
        ...currency.get(),
        // @ts-ignore
        entries: currency.currency_entries,
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
    return (logEntry?.currency_entries ?? []).map((currencyEntry) => {
        return {
            id: currencyEntry.currencyId,
            name: currencyEntry.currency.name,
            symbol: currencyEntry.currency.symbol,
            nomicsId: currencyEntry.currency.nomicsId,
            latestEntry: {
                priceBTC: currencyEntry.priceBTC,
                // @ts-ignore
                timeStamp: logEntry.createdAt.toISOString(),
            },
        }
    })
}

export const getForMovingAverage = async (
    periodLength: number,
    samples: number,
    currencyId: number,
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
    select periods.period, periods.created_at periodCreatedAt, log_entry.created_at as logEntryCreatedAt, log_entry.id as logEntryId, currency.symbol, currency_entry.price_BTC from log_entry JOIN (SELECT FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(created_at) - ${offSetSeconds})/${periodLengthSeconds})*${periodLengthSeconds} + ${offSetSeconds}) AS period, created_at, max(id) as maxId, currencies_saved, count(1) as c from log_entry GROUP BY period ORDER BY period DESC) periods on log_entry.id = periods.maxId JOIN currency_entry on log_entry.id = currency_entry.log_entry_id join currency on currency_entry.currency_id = currency.id WHERE currency.id = '${currencyId}' AND period > NOW() - INTERVAL ${sampleSpan} MINUTE ORDER BY period DESC LIMIT ${samples} 
    `

    // @ts-ignore
    const result = await SequelizeDB.query(query, { type: Sequelize.QueryTypes.SELECT })

    // @ts-ignore
    return result.map((row) => parseFloat(row.price_BTC))
}

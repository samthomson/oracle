import moment from 'moment'
import * as Types from '../declarations'
import * as NomicsService from '../services/nomics-data'
import * as BittrexService from '../services/bittrex-data'
import * as MarketData from '../services/market-data'
import * as DBUtil from './SequelizeDB'
import * as HelperUtil from '../util/helper'
import * as DataCruncher from '../util/data-cruncher'
import Logger from '../services/logging'

export const pullBittrexData = async (): Promise<void> => {
    const startTime = moment()
    // pull all currency data
    const bittrexComposites: Types.ExchangeMarketComposite[] = await BittrexService.getValues()

    // create an initial log entry in the db, so we have an id to relate other models against
    const logEntry = await DBUtil.createLogEntry(Types.Constants.Source.Bittrex)
    // for each market, ensure it exists in the db, then store a market rate against it
    for (let i = 0; i < bittrexComposites.length; i++) {
        const market = await DBUtil.ensureExchangeMarketExistsAs(bittrexComposites[i], Types.Constants.Source.Bittrex)
        await DBUtil.createCurrencyEntry(market.id, logEntry.id, bittrexComposites[i].lastTradeRate)
    }

    const endTime = moment()
    const milliseconds = endTime.diff(startTime)
    const perMarket = milliseconds / bittrexComposites.length
    Logger.info(
        `1. time spent importing bittrex markets price data: ${milliseconds.toLocaleString()} ms (${perMarket} per market - ${
            bittrexComposites.length
        }`,
    )

    // wrap up our log entry with the amount of currency entries created
    logEntry.currenciesSaved = bittrexComposites.length
    logEntry.timeSpent = milliseconds
    logEntry.save()
}

export const pullBinanceData = async (): Promise<void> => {
    const startTime = moment()
    // pull all currency data
    const binanceComposites: Types.ExchangeMarketComposite[] = await MarketData.getBinanceMarketComposites()

    const sourceId = Types.Constants.Source.Binance
    // create an initial log entry in the db, so we have an id to relate other models against
    const logEntry = await DBUtil.createLogEntry(sourceId)
    // for each market, ensure it exists in the db, then store a market rate against it
    for (let i = 0; i < binanceComposites.length; i++) {
        const market = await DBUtil.ensureExchangeMarketExistsAs(binanceComposites[i], sourceId)
        await DBUtil.createCurrencyEntry(market.id, logEntry.id, binanceComposites[i].lastTradeRate)
    }

    const endTime = moment()
    const milliseconds = endTime.diff(startTime)
    const perMarket = milliseconds / binanceComposites.length
    Logger.info(
        `1. time spent importing binance markets price data: ${milliseconds.toLocaleString()} ms (${perMarket} per market - ${
            binanceComposites.length
        }`,
    )

    // wrap up our log entry with the amount of currency entries created
    logEntry.currenciesSaved = binanceComposites.length
    logEntry.timeSpent = milliseconds
    logEntry.save()
}

export const importCrunch = async (shortMAsNotLong = true) => {
    try {
        const startTime = moment()
        await pullBittrexData()
        await pullBinanceData()
        await DataCruncher.crunchBittrexMarkets(shortMAsNotLong)

        const endTime = moment()
        const milliseconds = endTime.diff(startTime)

        Logger.info(`3. time spent importing & crunching bittrex markets: ${milliseconds.toLocaleString()} ms`, {
            shortMAsNotLong,
        })
    } catch (err) {
        Logger.error('error importing and crunching bittrex data', err)
    }
}

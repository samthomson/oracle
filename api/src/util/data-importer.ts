import moment from 'moment'
import * as Types from '../declarations'
import * as NomicsService from '../services/nomics-data'
import * as BittrexService from '../services/bittrex-data'
import * as DBUtil from './SequelizeDB'
import * as HelperUtil from '../util/helper'
import Logger from '../services/logging'

export const pullBittrexData = async () => {
    const startTime = moment()
    // pull all currency data
    const bittrexComposites: Types.ExchangeMarketComposite[] = await BittrexService.getValues()

    // create an initial log entry in the db, so we have an id to relate other models against
    const logEntry = await DBUtil.createLogEntry(Types.Constants.Source.Bittrex)
    // for each market, ensure it exists in the db, then store a market rate against it
    for (let i = 0; i < bittrexComposites.length; i++) {
        const market = await DBUtil.ensureBittrexMarketExistsAs(bittrexComposites[i])
        await DBUtil.createCurrencyEntry(market.id, logEntry.id, bittrexComposites[i].lastTradeRate)
    }

    // wrap up our log entry with the amount of currency entries created
    logEntry.currenciesSaved = bittrexComposites.length
    logEntry.save()

    const endTime = moment()
    const milliseconds = endTime.diff(startTime)
    const perMarket = milliseconds / bittrexComposites.length
    Logger.info(
        `1. time spent importing bittrex markets price data: ${milliseconds.toLocaleString()} ms (${perMarket} per market - ${
            bittrexComposites.length
        }`,
    )
}

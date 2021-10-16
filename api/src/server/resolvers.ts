import * as Types from '../declarations'
import * as DBUtil from '../util/SequelizeDB'
import * as BittrexData from '../util/bittrex'
import * as DataCruncher from '../util/data-cruncher'
import * as MarketData from '../services/market-data'
import * as DataAges from '../util/data-ages'
import * as HelperUtil from '../util/helper'

export const getMarket = async (parent: any, args: any, context: any, info: any) => {
    const {
        input: { symbol, quote, sourceId },
    } = args

    const market = await DBUtil.getMarket({ sourceId, quote, symbol })

    return {
        ...market,
        movingAverage: (parent) => resolveMovingAverage(parent, market),
    }
}

export const getMarkets = async () => {
    const markets = await DBUtil.getMarkets()
    const dataAges = DataAges.getDataAgesFromMarkets(markets)
    return {
        items: markets,
        pageInfo: {
            totalItems: markets.length,
        },
        dataAges,
    }
}

const resolveMovingAverage = async (parent, currency): Promise<Types.API.MovingAverage | null> => {
    const {
        movingAverageInput: { periodLength, samples },
    } = parent

    const dataPoints = await DBUtil.getForMovingAverage(periodLength, samples, currency.id)
    const nonNullPrices = dataPoints.map((dataPoint) => dataPoint.value).filter((value) => value !== null)

    const average = nonNullPrices.length > 0 ? HelperUtil.calculateAverage(nonNullPrices) : null

    const confidence = (nonNullPrices.length / samples) * 100

    const movingAverage: Types.API.MovingAverage = {
        value: average,
        input: {
            periodLength,
            samples,
            algorithm: 'SimpleMovingAverage',
        },
        dataPoints,
        confidence,
    }

    return movingAverage
}

export const debug = async () => {
    const output = 'result'
    const data = await MarketData.getBittrexMarketComposites()
    return {
        output,
    }
}

export const health = async () => {
    return await DBUtil.getHealthData()
}

export const requestLogs = async () => {
    const APIStats = await HelperUtil.getAPIRequestStats()
    return {
        total: APIStats.length,
        items: APIStats,
    }
}

export const getGlobals = async () => {
    const markets = await DBUtil.getMarkets()

    // filter markets to find btc and eth prices
    const eth = markets.find((market) => market.quote === 'USDT' && market.symbol === 'ETH')
    const btc = markets.find((market) => market.quote === 'USDT' && market.symbol === 'BTC')

    const btcPriceInUSD = btc.lastTradeRate
    const ethPriceInUSD = eth.lastTradeRate

    return {
        btcPriceInUSD,
        ethPriceInUSD,
    }
}

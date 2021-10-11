import * as Types from '../declarations'
import * as DBUtil from '../util/SequelizeDB'
import * as BittrexData from '../util/bittrex'
import * as DataCruncher from '../util/data-cruncher'
import * as MarketData from '../services/market-data'
import * as DataAges from '../util/data-ages'
import * as HelperUtil from '../util/helper'

export const getCurrencies = async (parent: any, args: any, context: any, info: any) => {
    const rawCurrencies = await DBUtil.getCurrencies()
    const items = rawCurrencies.map((currency) => ({
        ...currency,
        movingAverage: async (parent) => await resolveMovingAverage(parent, currency),
    }))
    return {
        items,
        pageInfo: {
            totalItems: rawCurrencies.length,
        },
    }
}

export const getCurrency = async (parent: any, args: any, context: any, info: any) => {
    const {
        input: { nomicsId, symbol, quote, sourceId: inputSource },
    } = args

    let currency = undefined
    // use provided source or default to nomics
    const sourceId = inputSource ? inputSource : Types.Constants.Source.Nomics

    if (nomicsId || sourceId === Types.Constants.Source.Nomics) {
        currency = await DBUtil.getCurrency({ sourceId: Types.Constants.Source.Nomics, quote: 'BTC', nomicsId })
    }
    if (symbol) {
        currency = await DBUtil.getCurrency({ sourceId, quote, symbol })
    }

    return {
        ...currency,
        movingAverage: (parent) => resolveMovingAverage(parent, currency),
        latestEntry: () => resolveLatestPrice(currency),
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

const resolveMovingAverage = async (parent, currency): Promise<number | null> => {
    const {
        movingAverageInput: { periodLength, samples },
    } = parent

    // @ts-ignore
    const prices = await DBUtil.getForMovingAverage(periodLength, samples, currency.id)
    const average = prices.length > 0 ? HelperUtil.calculateAverage(prices) : null
    return average
}

const resolveLatestPrice = async (currency) => {
    const [latestCurrencyEntry] = currency?.entries ?? []

    if (!latestCurrencyEntry) {
        return null
    } else {
        const {
            priceQuote,
            log_entry: { createdAt: timeStamp },
        } = latestCurrencyEntry

        return {
            timeStamp: timeStamp.toISOString(),
            priceQuote,
        }
    }
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

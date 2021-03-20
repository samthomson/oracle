import * as Types from '../declarations'
import * as DBUtil from '../util/SequelizeDB'
import * as NomicsData from '../services/nomics-data'

const calculateAverage = (list) => list.reduce((prev, curr) => prev + curr) / list.length

export const getCurrencies = async (parent: any, args: any, context: any, info: any) => {
    const rawCurrencies = await DBUtil.getCurrencies()
    return {
        items: rawCurrencies.map((currency) => ({
            ...currency,
            movingAverage: async (parent) => await resolveMovingAverage(parent, currency),
        })),
        pageInfo: {
            totalItems: rawCurrencies.length,
        },
    }
}

export const getCurrency = async (parent: any, args: any, context: any, info: any) => {
    const {
        input: { nomicsId, symbol },
    } = args

    let currency = undefined

    if (nomicsId) {
        currency = await DBUtil.getCurrency({ nomicsId })
    }
    if (symbol) {
        currency = await DBUtil.getCurrency({ symbol })
    }

    return {
        ...currency,
        movingAverage: (parent) => resolveMovingAverage(parent, currency),
        latestEntry: () => resolveLatestPrice(currency),
    }
}

const resolveMovingAverage = async (parent, currency): Promise<number | null> => {
    const {
        movingAverageInput: { periodLength, samples },
    } = parent

    // @ts-ignore
    const prices = await DBUtil.getForMovingAverage(periodLength, samples, currency.id)
    const average = prices.length > 0 ? calculateAverage(prices) : null
    return average
}

const resolveLatestPrice = async (currency) => {
    const [latestCurrencyEntry] = currency?.entries ?? []

    if (!latestCurrencyEntry) {
        return null
    } else {
        const {
            priceBTC,
            log_entry: { createdAt: timeStamp },
        } = latestCurrencyEntry

        return {
            timeStamp: timeStamp.toISOString(),
            priceBTC: priceBTC,
        }
    }
}

export const debug = async () => {
    const output = 'result'
    await NomicsData.getValues()
    return {
        output,
    }
}

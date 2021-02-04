import * as Types from '../declarations'
import * as DBUtil from '../util/SequelizeDB'

const calculateAverage = (list) => list.reduce((prev, curr) => prev + curr) / list.length

export const getCurrencies = async () => {
    const rawCurrencies = await DBUtil.getCurrencies()
    return {
        items: rawCurrencies,
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
        async movingAverage(parent, args, context, info) {
            const {
                movingAverageInput: { periodLength, samples },
            } = parent

            const prices = await DBUtil.getForMovingAverage(periodLength, samples, currency.id)
            const average = prices.length > 0 ? calculateAverage(prices) : null
            return average
        },
        async latestEntry(parent, args, context, info) {
            const [latestCurrencyEntry] = currency.entries

            if (!latestCurrencyEntry) {
                return null
            } else {
                const {
                    priceBTC,
                    log_entry: { createdAt: timeStamp },
                } = latestCurrencyEntry

                return {
                    timeStamp: timeStamp.toISOString(),
                    priceBTC,
                }
            }
        },
    }
}

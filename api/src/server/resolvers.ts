import * as Types from '../declarations'
import * as DBUtil from '../util/SequelizeDB'

// export const getCurrencies = async () => {

// }

const calculateAverage = (list) => list.reduce((prev, curr) => prev + curr) / list.length

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
            const average = prices.length > 0 ? calculateAverage(prices) : undefined
            // console.log(average)
            return average
        },
    }
}

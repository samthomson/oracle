import * as Types from '../declarations'
import * as DBUtil from '../util/SequelizeDB'

// export const getCurrencies = async () => {

// }

export const currency = async (parent: any, args: any, context: any, info: any) => {
    const {
        input: { nomicsId, symbol },
    } = args

    let currrency = undefined

    if (nomicsId) {
        currrency = await DBUtil.getCurrency({ nomicsId })
    }
    if (symbol) {
        currrency = await DBUtil.getCurrency({ symbol })
    }

    return {
        ...currrency,
        movingAverage: (parent, args, context, info) => {
            const {
                movingAverageInput: { period, frequency },
            } = parent
            return period * frequency
        },
    }
}

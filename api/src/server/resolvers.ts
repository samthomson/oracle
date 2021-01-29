import * as Types from '../declarations'
import * as DBUtil from '../util/SequelizeDB'

// export const getCurrencies = async () => {

// }

export const getCurrency = async (input: Types.CurrencyQueryInput) => {
    const { nomicsId, symbol } = input

    if (nomicsId) {
        return DBUtil.getCurrency({ nomicsId })
    }
    if (symbol) {
        return DBUtil.getCurrency({ symbol })
    }
    return undefined
}

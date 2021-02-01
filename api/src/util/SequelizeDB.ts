import * as SequelizeDatabase from '../db/setup'

import * as Types from '../declarations'

export const createLogEntry: any = () => SequelizeDatabase.LogEntry.create()

export const ensureCurrencyExists: any = async (currency: Types.NomicsListing) => {
    const [record, created] = await SequelizeDatabase.Currency.findOrCreate({
        where: {
            nomicsId: currency.id,
        },
        defaults: {
            nomicsId: currency.id,
            symbol: currency.symbol,
            name: currency.name,
        },
    })
    return record.get({ plain: true })
}

export const createCurrencyEntry: any = (currencyId: number, logEntryId: number, currency: Types.NomicsListing) => {
    const { price } = currency

    return SequelizeDatabase.CurrencyEntry.create({
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

    const currency = await SequelizeDatabase.Currency.findOne({
        where: whereQuery,
        include: SequelizeDatabase.CurrencyEntry,
    })

    // @ts-ignore
    return { ...currency.get(), entries: currency.currency_entries }
}

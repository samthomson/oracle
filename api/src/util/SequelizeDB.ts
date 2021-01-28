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

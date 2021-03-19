import { getValues } from './services/nomics-data'
import * as DBUtil from './util/SequelizeDB'
import * as SequelizeDatabase from './db/connection'

export const pullData = async () => {
    // ensure tables exist
    // redundant now using scalp-bot style connections?
    // await SequelizeDatabase.ensureDBSynced()

    // pull all currency data
    const nomicsCurrencies = await getValues()

    // filter down to just the data we need
    const currencies = nomicsCurrencies.map((cur) => ({
        id: cur.id,
        name: cur.name,
        symbol: cur.symbol,
        price: cur.price,
    }))

    // create an initial log entry in the db, so we have an id to relate other models against
    const logEntry = await DBUtil.createLogEntry()

    // for each currency, ensure it exists in the db, then store a currency price against it
    for (let i = 0; i < currencies.length; i++) {
        const currency = await DBUtil.ensureCurrencyExists(currencies[i])
        await DBUtil.createCurrencyEntry(currency.id, logEntry.id, currencies[i])
    }

    // wrap up our log entry with the amount of currency entries created
    logEntry.currenciesSaved = currencies.length
    logEntry.save()

    console.log('\n\nall done')
}

const testRelations = async () => {
    // get currency entries for 'ABBC'
    // redundant now using scalp-bot style connections?
    // await SequelizeDatabase.ensureDBSynced()

    const currencies = await DBUtil.getCurrencies()

    // @ts-ignore
    // console.log(currencies.length)
    // console.log(currencies[0])
}

// console.log('\ndata test stub')
// pullData()
testRelations()

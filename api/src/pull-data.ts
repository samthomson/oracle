import { getValues } from './services/nomics-data'
import * as DB from './util/db'
import * as DBS from './util/SequelizeDB'
import SequelizeDB from './db/setup'
import * as SequelizeDatabaseModels from './db/setup'

const testRun = async () => {
    // ensure tables exist
    await SequelizeDB.sync()

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
    const logEntry = await DBS.createLogEntry()

    // for each currency, ensure it exists in the db, then store a currency price against it
    for (let i = 0; i < currencies.length; i++) {
        const currency = await DBS.ensureCurrencyExists(currencies[i])
        await DBS.createCurrencyEntry(currency.id, logEntry.id, currencies[i])
    }

    // wrap up our log entry with the amount of currency entries created
    logEntry.currenciesSaved = currencies.length
    logEntry.save()

    console.log('\n\nall done')
}

const testRelations = async () => {
    // get currency entries for 'ABBC'
    await SequelizeDB.sync()

    const abbc = await SequelizeDatabaseModels.Currency.findOne({
        where: { nomicsId: 'ABBC' },
        include: SequelizeDatabaseModels.CurrencyEntry,
    })

    const latestLogEntry = await SequelizeDatabaseModels.LogEntry.findOne({
        include: SequelizeDatabaseModels.CurrencyEntry,
    })

    console.log(abbc)
    console.log(abbc.currency_entries.length, 'entries for this currency')
    console.log(latestLogEntry.currency_entries.length, 'entries for this log entry')
    // console.log(latestLogEntry.currency_entries.length, 'entries for this currency')

    // const { entries } = abbc

    // console.log(entries.length)
}

console.log('\ndata test stub')
testRun()
// testRelations()

import { getValues } from './services/nomics-data'
import * as DBUtil from './util/SequelizeDB'
import * as SequelizeDatabase from './db/setup'

export const pullData = async () => {
    // ensure tables exist
    await SequelizeDatabase.ensureDBSynced()

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
    await SequelizeDatabase.ensureDBSynced()

    const abbc = await SequelizeDatabase.Currency.findOne({
        where: { nomicsId: 'ABBC' },
        include: [
            {
                model: SequelizeDatabase.CurrencyEntry,
                // @ts-ignore
                include: SequelizeDatabase.LogEntry,
                limit: 1,
                order: [[SequelizeDatabase.LogEntry, 'created_at', 'DESC']],
            },
        ],
    })

    // @ts-ignore
    console.log('entries', abbc.currency_entries.length)
    // @ts-ignore
    console.log('entry 0 log_entry', abbc.currency_entries[0].log_entry)
    // @ts-ignore
    console.log('entry 0 currency_entry price', abbc.currency_entries[0].priceBTC)

    /*
    const latestLogEntry = await SequelizeDatabaseModels.LogEntry.findOne({
        include: SequelizeDatabaseModels.CurrencyEntry,
    })

    console.log(abbc)
    console.log(abbc.currency_entries.length, 'entries for this currency')
    console.log(latestLogEntry.currency_entries.length, 'entries for this log entry')
    // console.log(latestLogEntry.currency_entries.length, 'entries for this currency')

    // const { entries } = abbc

    // console.log(entries.length)
    */
}

// console.log('\ndata test stub')
// pullData()
testRelations()

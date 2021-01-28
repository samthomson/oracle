// import { getValues } from './services/cmc-data'
import { getValues } from './services/nomics-data'
import * as DB from './util/db'
import * as DBS from './util/SequelizeDB'
import SequelizeDB from './db/setup'
import * as SequelizeDatabaseModels from './db/setup'

const testRun = async () => {
    // ensure tables exist
    await SequelizeDB.sync()

    const values = await getValues()

    // const firstValues = values.filter((v, i) => i < 5000)

    console.log(values.length, ' currencies received')

    const currencies = values.map((cur) => ({ id: cur.id, name: cur.name, symbol: cur.symbol, price: cur.price }))

    /*
    const uniqueItems = [...new Set(firstValues.map((it) => it.symbol))]

    console.log('unique count: ', uniqueItems.length)

    const counts = {}
    firstValues
        .map((it) => it.symbol)
        .forEach(function (x) {
            counts[x] = (counts[x] || 0) + 1
        })

    const duplicates = Object.keys(counts).filter((sym) => counts[sym] > 1)

    console.log(duplicates)
    */
    const logEntry = await DBS.createLogEntry()

    for (let i = 0; i < currencies.length; i++) {
        const currency = await DBS.ensureCurrencyExists(currencies[i])
        await DBS.createCurrencyEntry(currency.id, logEntry.id, currencies[i])
    }

    // const added = await DBS.ensureCurrenciesExistInDB(ensureCurrenciesExistInput)
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
// testRun()
testRelations()

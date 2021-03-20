import * as Types from '../declarations'
import * as NomicsService from '../services/nomics-data'
import * as DBUtil from './SequelizeDB'
// import * as SequelizeDatabase from './db/connection'

export const pullNomicsData = async () => {
    // ensure tables exist

    // pull all currency data
    const nomicsCurrencies = await NomicsService.getValues()

    // filter down to just the data we need
    const draftMarkets: Types.DraftMarket[] = nomicsCurrencies.map((cur) => ({
        id: cur.id,
        name: cur.name,
        symbol: cur.symbol,
        price: cur.price,
        quote: 'BTC',
        sourceId: 0,
    }))

    // create an initial log entry in the db, so we have an id to relate other models against
    const logEntry = await DBUtil.createLogEntry(0)

    // for each currency, ensure it exists in the db, then store a currency price against it
    for (let i = 0; i < draftMarkets.length; i++) {
        const currency = await DBUtil.ensureMarketExists(draftMarkets[i])
        await DBUtil.createCurrencyEntry(currency.id, logEntry.id, draftMarkets[i])
    }

    // wrap up our log entry with the amount of currency entries created
    logEntry.currenciesSaved = draftMarkets.length
    logEntry.save()

    console.log('\n\nall done')
}

export const pullBittrexData = async () => { }

// const testRelations = async () => {
//     // get currency entries for 'ABBC'

//     const currencies = await DBUtil.getCurrencies()

//     // @ts-ignore
//     // console.log(currencies.length)
//     // console.log(currencies[0])
// }

// console.log('\ndata test stub')
// pullData()
// testRelations()

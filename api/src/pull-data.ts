// import { getValues } from './services/cmc-data'
import { getValues } from './services/nomics-data'
import * as DB from './util/db'
import * as DBS from './util/dbS'

const test = async () => {
    const values = await getValues()

    const firstValues = values.filter((v, i) => i < 5000)

    console.log(values.length, ' currencies received')

    // firstValues.forEach((cur) => {
    //     console.log(`sym: ${cur.symbol}, BTC price: ${cur.quote.BTC.price}`)
    // })

    const ensureCurrenciesExistInput = {
        currencies: firstValues.map((cur) => ({ id: cur.id, name: cur.name, symbol: cur.symbol })),
    }

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

    const added = await DBS.ensureCurrenciesExistInDB(ensureCurrenciesExistInput)

    console.log('\n\nall done', added, ' records added')
}

console.log('\ndata test stub')
test()

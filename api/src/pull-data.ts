import { getValues } from './services/cmc-data'
import * as DB from './util/db'

const test = async () => {
    const values = await getValues()

    // console.log(values)
    values.forEach((cur) => {
        console.log(`sym: ${cur.symbol}, BTC price: ${cur.quote.BTC.price}`)
    })

    await DB.ensureCurrenciesExistInDB({currencies: values.map(cur => ({name: cur.name, symbol: cur.symbol}))})

}

console.log('\ndata test stub')
test()

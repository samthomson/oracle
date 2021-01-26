import { getValues } from './services/cmc-data'

const test = async () => {
    const values = await getValues()

    // console.log(values)
    values.forEach((cur) => {
        console.log(`sym: ${cur.symbol}, BTC price: ${cur.quote.BTC.price}`)
    })
}

console.log('\ndata test stub')
test()

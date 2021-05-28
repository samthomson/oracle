import * as DataCruncher from './util/data-cruncher'

const crunchData = async () => {
    await DataCruncher.crunchMarkets()
}

crunchData()

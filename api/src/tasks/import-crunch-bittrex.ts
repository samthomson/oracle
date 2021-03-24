import * as DataImporter from '../util/data-importer'
import * as DataCruncher from '../util/data-cruncher'

export const importCrunch = async () => {
    await DataImporter.pullBittrexData()
    await DataCruncher.crunchBittrexMarkets()
}

importCrunch()

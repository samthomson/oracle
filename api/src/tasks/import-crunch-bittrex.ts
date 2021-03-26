import moment from 'moment'
import * as DataImporter from '../util/data-importer'
import * as DataCruncher from '../util/data-cruncher'
import Logger from '../services/logging'

export const importCrunch = async () => {
    const startTime = moment()
    await DataImporter.pullBittrexData()
    await DataCruncher.crunchBittrexMarkets()

    const endTime = moment()
    const milliseconds = endTime.diff(startTime)

    Logger.info(`3. time spent importing & crunching bittrex markets: ${milliseconds.toLocaleString()} ms`)
}

importCrunch()

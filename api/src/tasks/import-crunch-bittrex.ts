import moment from 'moment'
import * as DataImporter from '../util/data-importer'
import * as DataCruncher from '../util/data-cruncher'
import Logger from '../services/logging'

export const importCrunch = async (shortMAsNotLong = true) => {
    try {
        const startTime = moment()
        await DataImporter.pullBittrexData()
        await DataCruncher.crunchBittrexMarkets(shortMAsNotLong)

        const endTime = moment()
        const milliseconds = endTime.diff(startTime)

        Logger.info(`3. time spent importing & crunching bittrex markets: ${milliseconds.toLocaleString()} ms`, {
            shortMAsNotLong,
        })
    } catch (err) {
        Logger.error('error importing and crunching bittrex data', err)
    }
}

importCrunch()

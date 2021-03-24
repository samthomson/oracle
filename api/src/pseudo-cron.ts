import { CronJob } from 'cron'
import * as DataImporter from './util/data-importer'
import * as DataCruncher from './util/data-cruncher'

// every fifth minute
const cronFrequency = '*/5 * * * *'

new CronJob(cronFrequency, () => DataImporter.pullNomicsData(), undefined, true, 'Europe/London')
new CronJob(
    cronFrequency,
    async () => {
        await DataImporter.pullBittrexData()
        await DataCruncher.crunchBittrexMarkets()
    },
    undefined,
    true,
    'Europe/London',
)

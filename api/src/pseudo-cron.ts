import { CronJob } from 'cron'
import * as DataImporter from './util/data-importer'
// import * as DataCruncher from './util/data-cruncher'
import * as BittrexImporter from './tasks/import-crunch-bittrex'

// every fifth minute
const cronFrequency = '*/5 * * * *'

new CronJob(cronFrequency, () => BittrexImporter.importCrunch(), undefined, true, 'Europe/London')

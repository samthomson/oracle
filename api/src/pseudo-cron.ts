import { CronJob } from 'cron'
import * as DataImporter from './util/data-importer'
// import * as DataCruncher from './util/data-cruncher'
import * as BittrexImporter from './tasks/import-crunch-bittrex'
import * as LogDataAges from './tasks/log-data-ages'

// every three minutes
const cronFrequency = '*/3 * * * *'

new CronJob(cronFrequency, () => BittrexImporter.importCrunch(), undefined, true, 'Europe/London')

// every minute
const everyMinute = '* * * * *'

new CronJob(everyMinute, () => LogDataAges.logDataAges(), undefined, true, 'Europe/London')

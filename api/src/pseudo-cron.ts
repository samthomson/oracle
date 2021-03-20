import { CronJob } from 'cron'
import * as DataImporter from './util/data-importer'

// every fifth minute
const cronFrequency = '*/5 * * * *'

new CronJob(cronFrequency, () => DataImporter.pullNomicsData(), undefined, true, 'Europe/London')

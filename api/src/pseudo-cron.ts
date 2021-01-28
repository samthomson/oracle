import { CronJob } from 'cron'
import { pullData } from './pull-data'

// every fifth minute
const cronFrequency = '*/2 * * * *'

new CronJob(cronFrequency, () => pullData(), undefined, true, 'Europe/London')

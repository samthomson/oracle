import { CronJob } from 'cron'
import { pullData } from './pull-data'

// every fifth minute
const cronFrequency = '*/5 * * * *'

new CronJob(cronFrequency, () => pullData(), undefined, true, 'Europe/London')

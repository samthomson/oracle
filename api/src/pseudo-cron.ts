import { CronJob } from 'cron'
import { pullData } from './pull-data'

// every fifth minute
const cronFrequency = '* * * * *'

new CronJob(cronFrequency, () => pullData(), undefined, true, 'Europe/London')

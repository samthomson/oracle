import { CronJob } from 'cron'
import * as ImportCrunch from './tasks/import-crunch-markets'
import * as LogDataAges from './tasks/log-data-ages'

// every hour: calculate ten hour MA
const hourly = '0 * * * *'
new CronJob(hourly, () => ImportCrunch.importCrunch(false), undefined, true, 'Europe/London')

// every three minutes: calculate half hour and instant MA
const everyFewMinutes = '*/3 * * * *'
new CronJob(everyFewMinutes, () => ImportCrunch.importCrunch(true), undefined, true, 'Europe/London')

// log data ages
const everyMinute = '* * * * *'
new CronJob(everyMinute, () => LogDataAges.logDataAges(), undefined, true, 'Europe/London')

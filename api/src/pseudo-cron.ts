import { CronJob } from 'cron'
import * as ImportCrunch from './util/data-importer'
import * as DataAgesUtil from './util/data-ages'
import * as DataCleanUtil from './util/data-clean'

// every hour: calculate ten hour MA
const hourly = '0 * * * *'
new CronJob(hourly, () => ImportCrunch.importCrunch(false), undefined, true, 'Europe/London')

// every three minutes: calculate half hour and instant MA
const everyFewMinutes = '*/3 * * * *'
new CronJob(everyFewMinutes, () => ImportCrunch.importCrunch(true), undefined, true, 'Europe/London')

// log data ages
const everyMinute = '* * * * *'
new CronJob(everyMinute, () => DataAgesUtil.logDataAges(), undefined, true, 'Europe/London')

// once a day, clear out old data
const everyDay = '0 0 * * *'
new CronJob(everyDay, () => DataCleanUtil.dataClean(), undefined, true, 'Europe/London')

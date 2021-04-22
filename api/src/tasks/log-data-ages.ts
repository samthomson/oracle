import moment from 'moment'
import * as Models from '../db/models'

export const logDataAges = async () => {
    const crunchedMarkets = await Models.CrunchedMarketData.findAll()

    const ages = crunchedMarkets.map((crunched) => {
        // @ts-ignore
        const { lastUpdated } = crunched
        return moment().diff(moment(lastUpdated), 'minutes')
    })

    const crunchedMin = Math.min(...ages)
    const crunchedMax = Math.max(...ages)
    const crunchedAverage = ages.reduce((acc, v) => acc + v) / ages.length

    await Models.DataAge.create({
        crunchedMin,
        crunchedMax,
        crunchedAverage,
    })
}

logDataAges()

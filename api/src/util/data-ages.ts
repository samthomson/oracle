import moment from 'moment'
import * as Types from '../declarations'
import * as Models from '../db/models'

export const getDataAgesFromMarkets = (markets: Types.APIMarketsQueryResult[]): Types.DataAges => {
    const ages = markets
        .filter((market) => market?.crunched?.lastUpdated)
        .map(({ crunched }) => {
            // @ts-ignore
            const { lastUpdated } = crunched
            return moment().diff(moment(lastUpdated), 'minutes')
        })

    const min = Math.min(...ages)
    const max = Math.max(...ages)
    const average = Math.ceil(ages.reduce((acc, v) => acc + v) / ages.length)

    return {
        min,
        max,
        average,
        at: moment().toISOString(),
        missing: markets.length - ages.length,
    }
}

export const logDataAges = async () => {
    const crunchedMarkets = await Models.CrunchedMarketData.findAll()

    const ages = crunchedMarkets.map((crunched) => {
        // @ts-ignore
        const { lastUpdated } = crunched
        return moment().diff(moment(lastUpdated), 'minutes')
    })

    const crunchedMin = Math.min(...ages)
    const crunchedMax = Math.max(...ages)
    const crunchedAverage = Math.ceil(ages.reduce((acc, v) => acc + v) / ages.length)

    await Models.DataAge.create({
        crunchedMin,
        crunchedMax,
        crunchedAverage,
    })
}
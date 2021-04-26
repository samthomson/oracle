import moment from 'moment'
import * as Types from '../declarations'

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
    }
}

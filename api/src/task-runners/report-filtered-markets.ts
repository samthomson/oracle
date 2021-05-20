import * as DataFilter from '../util/data-filter'

export const reportFiltered = async () => {
    await DataFilter.filterMarkets()
}

reportFiltered()

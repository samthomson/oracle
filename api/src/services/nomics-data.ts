import fetch from 'node-fetch'
import * as Types from '../declarations'
import Logger from './logging'
import moment from 'moment'

type NomicsListingPage = {
    listings: Types.NomicsListing[]
    totalItems: number
}

export const getValues = async (): Promise<Types.NomicsListing[]> => {
    try {
        let allListings: Types.NomicsListing[] = []
        let page = 1
        let hasMore = true

        const startTime = moment()
        while (hasMore) {
            const { listings, totalItems } = await getPageOfValues(page)
            hasMore = Math.ceil(totalItems / 100) > page
            allListings = [...allListings, ...listings]
            page++
        }
        const endTime = moment()

        const milliseconds = endTime.diff(startTime)
        Logger.info(`time spent assembling nomics data: ${milliseconds.toLocaleString()} ms`)

        return allListings
    } catch (err) {
        Logger.error('error assembling nomics data', err)
        return []
    }
}

const getPageOfValues = async (page: number): Promise<NomicsListingPage> => {
    const url = `https://api.nomics.com/v1/currencies/ticker?key=${process.env.NOMICS_API_KEY}&convert=BTC&per-page=100&status=active&page=${page}`
    const response = await fetch(url)

    if (response.status !== 200) {
        Logger.error('getPageOfValues error', { response, status: response?.status, url })
        throw new Error('Error fetching Nomics data')
    }
    const totalItems: number = parseInt(response.headers.get('X-Pagination-Total-Items'))

    const listings: Types.NomicsListing[] = await response.json()

    return {
        listings,
        totalItems,
    }
}

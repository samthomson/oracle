import fetch from 'node-fetch'
import * as Types from '../declarations'
import Logger from './logging'

type NomicsListingPage = {
    listings: Types.NomicsListing[]
    totalItems: number
}

export const getValues = async (): Promise<Types.NomicsListing[]> => {
    try {
        let allListings: Types.NomicsListing[] = []
        let page = 1
        let hasMore = true

        while (hasMore) {
            const { listings, totalItems } = await getPageOfValues(page)
            hasMore = Math.ceil(totalItems / 100) > page
            allListings = [...allListings, ...listings]
            page++
        }

        return allListings
    } catch (err) {
        Logger.error('error assembling nomics data', err)
    }
}

const getPageOfValues = async (page: number): Promise<NomicsListingPage> => {
    const response = await fetch(
        `https://api.nomics.com/v1/currencies/ticker?key=${process.env.NOMICS_API_KEY}&convert=BTC&per-page=100&status=active&page=${page}`,
    )

    if (response.status !== 200) {
        Logger.error('getPageOfValues error', response)
        throw new Error('Error fetching Nomics data')
    }
    const totalItems: number = parseInt(response.headers.get('X-Pagination-Total-Items'))

    const listings: Types.NomicsListing[] = await response.json()

    return {
        listings,
        totalItems,
    }
}

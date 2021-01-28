import fetch from 'node-fetch'
import * as Types from '../declarations'

export const getValues = async (): Promise<Types.NomicsListing[]> => {
    try {
        const response = await fetch(
            `https://api.nomics.com/v1/currencies/ticker?key=${process.env.NOMICS_API_KEY}&convert=BTC&per-page=5000&status=active`,
        )

        if (response.status !== 200) {
            console.error(response)
            throw new Error('Error fetching Nomics data')
        }

        const NomicsListings: Types.NomicsListing[] = await response.json()

        return NomicsListings
    } catch (err) {
        console.error(err)
    }
}

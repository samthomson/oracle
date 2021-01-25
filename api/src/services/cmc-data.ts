import fetch from 'node-fetch'
import * as Types from '../declarations'

export const getValues = async (): Promise<Types.CMCListing[]> => {
	try {
		const headers = {
			'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY
		}
		
		const response = await fetch(` https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=5&convert=BTC`, {headers})

		if (response.status !== 200) {
			throw new Error('Error fetching CMC data')
		}

		const CMCListings: Types.CMCListing[] = (await response.json()).data

		return CMCListings
	}
	catch (err) {
		console.error(err)
	}
}
export type CMCListing = {
	id: number,
	name: string,
	symbol: string,
	slug: string,
	num_market_pairs: number,
	date_added: string,
	// tags: [Array],
	max_supply: null,
	circulating_supply: number,
	total_supply: number,
	// platform: [Object],
	cmc_rank: number,
	last_updated: string,
	quote: CMCQuote
}

type CMCQuote = {
	[key: string]: {
		price: number,
		volume_24h: number,
		percent_change_1h: number,
		percent_change_24h: number,
		percent_change_7d: number,
		market_cap: number,
		last_updated: string
	}
}

// {
// 	id: 4679,
// 	name: 'Band Protocol',
// 	symbol: 'BAND',
// 	slug: 'band-protocol',
// 	num_market_pairs: 104,
// 	date_added: '2019-09-18T00:00:00.000Z',
// 	tags: [Array],
// 	max_supply: null,
// 	circulating_supply: 20494032.51749998,
// 	total_supply: 100000000,
// 	platform: [Object],
// 	cmc_rank: 98,
// 	last_updated: '2021-01-25T18:32:06.000Z',
// 	quote: [Object]
//   }
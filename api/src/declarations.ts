export type CMCListing = {
    id: number
    name: string
    symbol: string
    slug: string
    num_market_pairs: number
    date_added: string
    // tags: [Array],
    max_supply: null
    circulating_supply: number
    total_supply: number
    // platform: [Object],
    cmc_rank: number
    last_updated: string
    quote: CMCQuote
}

type CMCQuote = {
    [key: string]: {
        price: number
        volume_24h: number
        percent_change_1h: number
        percent_change_24h: number
        percent_change_7d: number
        market_cap: number
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

export type NomicsListing = {
    id: string
    name: string
    currency: string
    symbol: string
    price: number
}

// "id": "BTC",
// "currency": "BTC",
// "symbol": "BTC",
// "name": "Bitcoin",
// "logo_url": "https://s3.us-east-2.amazonaws.com/nomics-api/static/images/currencies/btc.svg",
// "status": "active",
// "price": "1.00000000",
// "price_date": "2021-01-27T00:00:00Z",
// "price_timestamp": "2021-01-27T17:03:00Z",
// "circulating_supply": "18612012",
// "max_supply": "21000000",
// "market_cap": "18612012",
// "num_exchanges": "377",
// "num_pairs": "52191",
// "num_pairs_unmapped": "5030",
// "first_candle": "2011-08-18T00:00:00Z",
// "first_trade": "2011-08-18T00:00:00Z",
// "first_order_book": "2017-01-06T00:00:00Z",
// "rank": "1",
// "rank_delta": "0",
// "high": "1.00000000",
// "high_timestamp": "2021-01-27T00:00:00Z",
// "1d": {
//     "volume": "1573433.46",
//     "price_change": "0.00000000",
//     "price_change_pct": "0.0000",
//     "volume_change": "-164305.82",
//     "volume_change_pct": "-0.0946",
//     "market_cap_change": "894.00",
//     "market_cap_change_pct": "0.0000"
// },
// "7d": {
//     "volume": "11602795.56",
//     "price_change": "0.00000000",
//     "price_change_pct": "0.0000",
//     "volume_change": "-431837.40",
//     "volume_change_pct": "-0.0359",
//     "market_cap_change": "6287.00",
//     "market_cap_change_pct": "0.0003"
// },
// "30d": {
//     "volume": "57624490.96",
//     "price_change": "0.00000000",
//     "price_change_pct": "0.0000",
//     "volume_change": "7595747.71",
//     "volume_change_pct": "0.1518",
//     "market_cap_change": "28381.00",
//     "market_cap_change_pct": "0.0015"
// },
// "365d": {
//     "volume": "1145050123.67",
//     "price_change": "0.00000000",
//     "price_change_pct": "0.0000",
//     "volume_change": "415531623.30",
//     "volume_change_pct": "0.5696",
//     "market_cap_change": "425412.00",
//     "market_cap_change_pct": "0.0234"
// },
// "ytd": {
//     "volume": "52743246.85",
//     "price_change": "0.00000000",
//     "price_change_pct": "0.0000",
//     "volume_change": "9130218.67",
//     "volume_change_pct": "0.2093",
//     "market_cap_change": "25069.00",
//     "market_cap_change_pct": "0.0013"
// }

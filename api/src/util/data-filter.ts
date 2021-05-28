import * as Types from '../declarations'
import * as MarketData from '../services/market-data'

const filterComposites = (markets: Types.ExchangeMarketComposite[]) => {

	const quotes = ['BTC', 'ETH', 'USDT']

	const quoteFiltered = markets.filter(market => quotes.includes(market.quote))
	const volumeFiltered = quoteFiltered.filter(market => market.volumeUSD > 50000)

	let summary = {
		markets: markets.length,
		quoteFiltered: quoteFiltered.length,
		volFiltered: volumeFiltered.length,
	}
	return summary
}

export const filterMarkets = async () => {

    const bittrexComposites: Types.ExchangeMarketComposite[] = await MarketData.getBittrexMarketComposites()
    const binanceComposites: Types.ExchangeMarketComposite[] = await MarketData.getBinanceMarketComposites()

	console.log(filterComposites(bittrexComposites))
	console.log(filterComposites(binanceComposites))
}
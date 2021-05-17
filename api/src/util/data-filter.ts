import * as Types from '../declarations'
import * as BittrexService from '../services/bittrex-data'
import * as MarketData from '../services/market-data'

const filterComposites = (markets: Types.ExchangeMarketComposite[]) => {

	const quotes = ['BTC', 'ETH', 'USDT']

	const quoteFiltered = markets.filter(market => quotes.includes(market.quote))
	// const volumeFiltered = quoteFiltered.filter(market => market.)


	let summary = {
		markets: markets.length,
		quoteFiltered: quoteFiltered.length,
	}
	return summary
}

export const filterMarkets = async () => {

    const bittrexComposites: Types.ExchangeMarketComposite[] = await BittrexService.getValues()
    const binanceComposites: Types.ExchangeMarketComposite[] = await MarketData.getBinanceMarketComposites()

	console.log(filterComposites(bittrexComposites))
	console.log(filterComposites(binanceComposites))
}
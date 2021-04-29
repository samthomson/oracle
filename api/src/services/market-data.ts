import * as ccxt from 'ccxt'
import * as Types from '../declarations'
import Logger from './logging'

export const getBinanceMarketComposites = async (): Promise<Types.ExchangeMarketComposite[]> => {
    const binanceExchange = new ccxt.binance()

    const markets = await binanceExchange.fetchMarkets()
    const tickers = Object.values(await binanceExchange.fetchTickers())

    const keyedTickers = (() => {
        const keyed = {}
        for (let i = 0; i < tickers.length; i++) {
            const { symbol, high, low, ask, bid, quoteVolume, last } = tickers[i]
            keyed[symbol] = {
                high,
                low,
                ask,
                bid,
                quoteVolume,
                last,
            }
        }
        return keyed
    })()

    const compositeMarkets: Types.ExchangeMarketComposite[] = markets
        .map((market) => {
            const {
                symbol: name,
                base: symbol,
                quote,
                info: { status }, //! binance response object prop
                precision,
            } = market

            const ticker = keyedTickers[name]

            if (!ticker) {
                Logger.warn('ticker not defined', market)
            }

            if (ticker) {
                return {
                    name,
                    symbol,
                    quote,
                    minTradeSize: Number(market.limits.amount.min),
                    status,
                    precision: Number(precision.quote),
                    high: Number(ticker.high),
                    low: Number(ticker.low),
                    quoteVolume: Number(ticker.quoteVolume),
                    lastTradeRate: Number(ticker.last),
                    bidRate: Number(ticker.bid),
                    askRate: Number(ticker.ask),
                }
            }
        })
        // filter out undefined (where summary or ticker was not set)
        .filter((market) => market)

    return compositeMarkets
}

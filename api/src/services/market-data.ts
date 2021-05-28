import * as ccxt from 'ccxt'
import * as Types from '../declarations'
import Logger from './logging'
import * as BittrexUtil from '../util/bittrex'

export const deduceAndAddUSDVolumeToComposites = (compositeMarkets: Types.ExchangeMarketComposite[]) => {
    const usdMarkets = compositeMarkets.filter(market => market.quote === 'USDT' && (market.symbol === 'ETH' || market.symbol === 'BTC'))

    const ethUSD = usdMarkets.find(market => market.symbol === 'ETH')?.lastTradeRate
    const btcUSD = usdMarkets.find(market => market.symbol === 'BTC')?.lastTradeRate

    const compositeMarketsWithUSDVolume = compositeMarkets.map(market => {
        let volumeUSD = undefined
        switch (market.quote) {
            case 'BTC':
                volumeUSD = market.quoteVolume * btcUSD
                    break;
            case 'ETH':
                volumeUSD = market.quoteVolume * ethUSD
                break;
            case 'USDT':
                volumeUSD = market.quoteVolume
                break;
        }
        return {
            ...market,
            volumeUSD
        }
    })

    return compositeMarketsWithUSDVolume
}

export const getBittrexMarketComposites = async (): Promise<Types.ExchangeMarketComposite[]> => {
    try {
        const bittrexMarkets: Types.Bittrex.Market[] = (await BittrexUtil.bittrexRequestV3('markets')).payload
        const bittrexSummaries: Types.Bittrex.MarketSummary[] = (await BittrexUtil.bittrexRequestV3('markets/summaries')).payload
        const bittrexTickers: Types.Bittrex.MarketTicker[] = (await BittrexUtil.bittrexRequestV3('markets/tickers')).payload

        const keyedSummaries = (() => {
            const keyed = {}
            for (let i = 0; i < bittrexSummaries.length; i++) {
                const { symbol, high, low, quoteVolume } = bittrexSummaries[i]
                keyed[symbol] = {
                    high,
                    low,
                    quoteVolume,
                }
            }
            return keyed
        })()

        const keyedTickers = (() => {
            const keyed = {}
            for (let i = 0; i < bittrexTickers.length; i++) {
                const { symbol, lastTradeRate, bidRate, askRate } = bittrexTickers[i]
                keyed[symbol] = {
                    lastTradeRate,
                    bidRate,
                    askRate,
                }
            }
            return keyed
        })()

        const compositeMarkets: Types.ExchangeMarketComposite[] = bittrexMarkets
            // active markets only
            .filter((market) => market.status === 'ONLINE')
            .map((market) => {
                const {
                    symbol: name,
                    baseCurrencySymbol: symbol,
                    quoteCurrencySymbol: quote,
                    minTradeSize,
                    status,
                    precision,
                } = market
                const summary = keyedSummaries[name]
                const ticker = keyedTickers[name]

                if (!summary) {
                    Logger.warn('summary not defined', market)
                }
                if (!ticker) {
                    Logger.warn('ticker not defined', market)
                }

                if (ticker && summary) {
                    return {
                        name,
                        symbol,
                        quote,
                        minTradeSize: Number(minTradeSize),
                        status,
                        precision: Number(precision),
                        high: Number(summary.high),
                        low: Number(summary.low),
                        quoteVolume: Number(summary.quoteVolume),
                        lastTradeRate: Number(ticker.lastTradeRate),
                        bidRate: Number(ticker.bidRate),
                        askRate: Number(ticker.askRate),
                    }
                }
            })
            // filter out undefined (where summary or ticker was not set)
            .filter((market) => market)
            
        return deduceAndAddUSDVolumeToComposites(compositeMarkets)
    } catch (err) {
        Logger.error('error assembling bittrex data', err)
        return []
    }
}


export const getBinanceMarketComposites = async (): Promise<Types.ExchangeMarketComposite[]> => {
    try {
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

        // return compositeMarkets
        return deduceAndAddUSDVolumeToComposites(compositeMarkets)
    } catch (err) {
        Logger.error('error assembling binance data', err)
        return []
    }
}

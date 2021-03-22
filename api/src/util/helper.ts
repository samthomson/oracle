export const delay = async (ms: number): Promise<void> => {
    // return await for better async stack trace support in case of errors.
    return await new Promise((resolve) => setTimeout(resolve, ms))
}

export const bittrexV3MarketSymbolToQuoteSymbolObject = (bittrexV3MarketSymbol: string) => {
    const [symbol, quote] = bittrexV3MarketSymbol.split('-')
    return {
        symbol,
        quote,
    }
}

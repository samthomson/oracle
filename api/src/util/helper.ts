import * as Models from '../db/models'
import * as Types from '../declarations'
import SequelizeDB from '../db/connection'
import moment from 'moment'
import * as Sequelize from 'sequelize'

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

export const calculateAverage = (list: number[]) => {
    if (list?.length > 0) {
        return list.reduce((prev, curr) => prev + curr) / list.length
    }
    return undefined
}

const serviceStringToInt = (service: string): number | null => {
    switch (service) {
        case 'Bittrex':
            return 0
        default:
            return null
    }
}

const serviceIntToString = (service: number): string | undefined => {
    switch (service) {
        case 0:
            return 'Bittrex'
        default:
            return undefined
    }
}

export const sourceStringToInt = (service: string): number | null => {
    switch (service) {
        case 'BITTREX':
            return 1
        case 'BINANCE':
            return 2
        default:
            return null
    }
}

export const sourceIntToString = (service: number): string | undefined => {
    switch (service) {
        case 1:
            return 'BITTREX'
        case 2:
            return 'BINANCE'
        default:
            return undefined
    }
}

export const logRequest = async (
    service: 'Bittrex',
    requestUrl: string,
    params: string | null = null,
): Promise<void> => {
    const url = requestUrl.substring(0, 255)

    const serviceInt = serviceStringToInt(service)

    await Models.RequestLog.create({
        serviceInt,
        url,
        params,
    })
}

export const getAPIRequestStats = async (): Promise<Types.APIRequestStat[]> => {
    // get monthly usage
    const sDateFormat = 'YYYY-MM-DD HH:mm:ss'
    const sOneMonthAgo = moment().add(-1, 'months').format(sDateFormat)
    const sOneDayAgo = moment().add(-1, 'days').format(sDateFormat)
    const oneHourAgo = moment().add(-1, 'hours').format(sDateFormat)

    const sMonthQuery = `SELECT service_int as service, COUNT(*) as lastMonthCount FROM request_logs where datetime > '${sOneMonthAgo}' GROUP BY service_int`
    const oLastMonth: { service: number; lastMonthCount: number }[] = await SequelizeDB.query(sMonthQuery, {
        type: Sequelize.QueryTypes.SELECT,
    })

    // get last 24 hours use
    const sDayQuery = `SELECT service_int as service, COUNT(*) as lastDayCount FROM request_logs where datetime > '${sOneDayAgo}' GROUP BY service_int`
    const oLastDay: {
        service: number
        lastDayCount: number
    }[] = await SequelizeDB.query(sDayQuery, {
        type: Sequelize.QueryTypes.SELECT,
    })

    // get last hours use
    const hourQuery = `SELECT service_int as service, COUNT(*) as lastHourCount FROM request_logs where datetime > '${oneHourAgo}' GROUP BY service_int`
    const lastHour: {
        service: number
        lastHourCount: number
    }[] = await SequelizeDB.query(hourQuery, {
        type: Sequelize.QueryTypes.SELECT,
    })

    const asServices: number[] = oLastMonth.map((oRow: { service: number }) => oRow.service)

    // build stat object
    const aStats: Types.APIRequestStat[] = await asServices.map((sService: number) => {
        const oMatchingLastMonthCounts: Array<{
            lastMonthCount: number
        }> = oLastMonth.filter((oRow: { service: number; lastMonthCount: number }) => {
            return oRow.service === sService
        })

        const oMatchingLastDayCounts: Array<{
            lastDayCount: number
        }> = oLastDay.filter((oRow: { service: number; lastDayCount: number }) => {
            return oRow.service === sService
        })

        const matchingLastHourCounts: Array<{
            lastHourCount: number
        }> = lastHour.filter((row: { service: number; lastHourCount: number }) => {
            return row.service === sService
        })

        const literalService = serviceIntToString(sService)

        return {
            service: literalService,

            lastHourCount: matchingLastHourCounts.length > 0 ? matchingLastHourCounts[0].lastHourCount : 0,

            lastDayCount: oMatchingLastDayCounts.length > 0 ? oMatchingLastDayCounts[0].lastDayCount : 0,
            lastMonthCount: oMatchingLastMonthCounts.length > 0 ? oMatchingLastMonthCounts[0].lastMonthCount : 0,
        }
    })

    return aStats
}

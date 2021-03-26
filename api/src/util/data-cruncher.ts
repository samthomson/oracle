import moment from 'moment'
import * as Types from '../declarations'
import * as DBUtil from './SequelizeDB'
import * as Models from '../db/models'
import * as HelperUtil from '../util/helper'
import Logger from '../services/logging'

export const crunchBittrexMarkets = async () => {
    try {
        const startTime = moment()
        // get all bittrex markets
        const markets = await Models.Market.findAll({ limit: 1000, where: { sourceId: 1 } })

        // for each market crunch an MA
        for (let i = 0; i < markets.length; i++) {
            const market = markets[i]
            // @ts-ignore
            const { id: marketId } = market
            const halfHourPrices = await DBUtil.getForMovingAverage(5, 12, marketId)
            const tenHourPrices = await DBUtil.getForMovingAverage(60, 10, marketId)

            const newData = {
                maThirtyMin: HelperUtil.calculateAverage(halfHourPrices),
                maTenHour: HelperUtil.calculateAverage(tenHourPrices),
                lastUpdated: moment.now(),
            }

            // for all crunched data - find CrunchedMarketData record and update or create new
            const [crunchedData, created] = await Models.CrunchedMarketData.findOrCreate({
                where: { marketId },
                defaults: newData,
            })

            const crunchedMarketIds = (
                await Models.CrunchedMarketData.findAll({
                    attributes: ['marketId'],
                })
            )
                // @ts-ignore
                .map((market) => market.marketId)

            if (!crunchedMarketIds.includes(marketId)) {
                // create it afresh
                await Models.CrunchedMarketData.create({
                    marketId,
                    ...newData,
                })
            } else {
                // update it
                await Models.CrunchedMarketData.update(
                    {
                        ...newData,
                    },
                    {
                        where: { marketId },
                    },
                )
            }

            if (!created) {
                crunchedData.update(newData)
            }
        }

        const endTime = moment()
        const milliseconds = endTime.diff(startTime)
        const perMarket = milliseconds / markets.length
        Logger.info(
            `2. time spent crunching bittrex markets' MAs: ${milliseconds.toLocaleString()} ms (${perMarket} per market - ${
                markets.length
            }`,
        )
    } catch (err) {
        Logger.error(err)
    }
}

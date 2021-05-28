import moment from 'moment'
import Sequelize from 'sequelize'
import * as Types from '../declarations'
import * as DBUtil from './SequelizeDB'
import * as Models from '../db/models'
import * as HelperUtil from '../util/helper'
import Logger from '../services/logging'

export const crunchMarkets = async (shortMAsNotLong = true) => {
    try {
        const startTime = moment()
        // get all bittrex markets
        const markets = await Models.Market.findAll({ 
            limit: 2000,
            where: {
                // sourceId: 1,
                volumeUSD: {
                    [Sequelize.Op.gte]: 60000
                }
            }
        })

        // for each market crunch an MA
        for (let i = 0; i < markets.length; i++) {
            const market = markets[i]
            // @ts-ignore
            const { id: marketId } = market
            const halfHourPrices = shortMAsNotLong ? await DBUtil.getForMovingAverage(3, 10, marketId) : undefined
            const tenHourPrices = shortMAsNotLong ? undefined : await DBUtil.getForMovingAverage(60, 10, marketId)
            // determine instantaneous moving average by taking last prices from already queried half hour price points
            // prob update later when I start querying for prices more frequently - eg just take last ten prices when querying each minute, or 5 at one minute.
            // assuming prices are ordered chronologically
            const fifteenMinutesPrices = shortMAsNotLong ? halfHourPrices.filter((_, index) => index > 4) : undefined // 5,6,7,8,9

            const newData = {
                // maThirtyMin: HelperUtil.calculateAverage(halfHourPrices),
                // maInstant: HelperUtil.calculateAverage(fifteenMinutesPrices),
                ...(shortMAsNotLong ? { maInstant: HelperUtil.calculateAverage(fifteenMinutesPrices) } : {}),

                ...(shortMAsNotLong ? { maThirtyMin: HelperUtil.calculateAverage(halfHourPrices) } : {}),

                ...(shortMAsNotLong ? {} : { maTenHour: HelperUtil.calculateAverage(tenHourPrices) }),

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
            `2. time spent crunching markets' MAs: ${milliseconds.toLocaleString()} ms (${perMarket} per market - ${
                markets.length
            }`,
        )
    } catch (err) {
        Logger.error(err)
    }
}

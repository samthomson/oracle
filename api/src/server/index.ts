import { ApolloServer, gql } from 'apollo-server'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import * as Resolvers from './resolvers'
import * as Types from '../declarations'
import Logger from '../services/logging'

const marketTypeSharedFields = `
    sourceId: Int
    exchange: String
    quote: String
    symbol: String
    minTradeSize: Float
    status: String
    high: Float
    low: Float
    quoteVolume: Float
    lastTradeRate: Float
    bidRate: Float
    askRate: Float
    precision: Float
    crunched: CrunchedMarketData
`

const typeDefs = gql`

    input MarketQueryInput {
        symbol: String!
        quote: String!
        sourceId: Int!
    }

    input MovingAverageInput {
        "How many minutes apart data points used should be spaced."
        periodLength: Int
        "The number of data points to derive an average from."
        samples: Int
    }

    type PaginationInfo {
        totalItems: Int!
    }

    type DebugResult {
        output: String
    }

    type MarketData {
        ${marketTypeSharedFields}
    }

    type SingleMarket {
        ${marketTypeSharedFields}
        movingAverage(movingAverageInput: MovingAverageInput): Float
    }

    type CrunchedMarketData {
        maThirtyMin: Float
        maTenHour: Float
        maInstant: Float
        lastUpdated: String
    }

    type MarketsResult {
        items: [MarketData]!
        pageInfo: PaginationInfo
        dataAges: DataAges
    }

    type GlobalsResult {
        btcPriceInUSD: Float
        ethPriceInUSD: Float
    }

    type RecentlyCrunchedMarkets {
        bittrex: Float
    }

    type DataAges {
        min: Int
        max: Int
        average: Int
        at: String
        missing: Int
    }

    type Health {
        recentlyCrunchedMarkets: RecentlyCrunchedMarkets
        dataAges: DataAges
    }

    type APIRequestsStats {
        service: String
        lastHourCount: Int
        lastDayCount: Int
        lastMonthCount: Int
    }

    type RequestLogs {
        total: Int
        items: [APIRequestsStats]
    }

    type Query {
        market(input: MarketQueryInput): SingleMarket
        debug: DebugResult
        markets: MarketsResult
        globals: GlobalsResult
        health: Health
        requestLogs: RequestLogs
    }
`
const resolvers = {
    Query: {
        market: Resolvers.getMarket,
        markets: Resolvers.getMarkets,
        globals: Resolvers.getGlobals,
        health: Resolvers.health,
        requestLogs: Resolvers.requestLogs,
        debug: Resolvers.debug,
    },
}

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (err) => {
        // log internal - issues with my code - errors
        if (err.extensions.code === 'INTERNAL_SERVER_ERROR') {
            Logger.error(err)
        }
        // return underlying error - to client - either way
        return err
    },
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
})

// needed so that relations are defined since sequelize is awkward

// The `listen` method launches a web server.
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    Logger.info(`Server ready at ${url}`)
})

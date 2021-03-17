import { ApolloServer, gql } from 'apollo-server'
import * as Resolvers from './resolvers'
import * as Types from '../declarations'
import * as DB from '../db/setup'
import Logger from '../services/logging'

const typeDefs = gql`
    type Currency {
        nomicsId: String
        name: String
        symbol: String
        # entries: [CurrencyEntry]
        movingAverage(movingAverageInput: MovingAverageInput): Float
        latestEntry: PriceEntry
    }

    type PriceEntry {
        timeStamp: String
        priceBTC: String
    }

    # type CurrencyEntry {
    #     currencyId: String
    #     logEntryId: String
    #     priceBTC: String
    # }

    input CurrencyQueryInput {
        symbol: String
        nomicsId: String
    }

    input MovingAverageInput {
        "How many seconds apart data points used should be spaced."
        periodLength: Int
        "The number of data points to derive an average from."
        samples: Int
    }

    type PaginationInfo {
        totalItems: Int!
    }

    type CurrenciesResult {
        items: [Currency]!
        pageInfo: PaginationInfo
    }

    type DebugResult {
        output: String
    }

    type Query {
        currencies: CurrenciesResult
        currency(input: CurrencyQueryInput): Currency
        debug: DebugResult
    }
`

const resolvers = {
    Query: {
        currency: Resolvers.getCurrency,
        currencies: Resolvers.getCurrencies,
        debug: Resolvers.debug,
    },
}

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ typeDefs, resolvers })

// needed so that relations are defined since sequelize is awkward
DB.ensureDBSynced()

// The `listen` method launches a web server.
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    Logger.info(`Server ready at ${url}`)
})

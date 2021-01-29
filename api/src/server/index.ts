import { ApolloServer, gql } from 'apollo-server'
import * as Resolvers from './resolvers'
import * as Types from '../declarations'
import * as DB from '../db/setup'

const typeDefs = gql`
    type Currency {
        nomicsId: String
        name: String
        symbol: String
    }

    type CurrencyEntry {
        currencyId: String
        logEntryId: String
        priceBTC: String
    }

    input CurrencyQueryInput {
        symbol: String
        nomicsId: String
    }

    # The "Query" type is special: it lists all of the available queries that
    # clients can execute, along with the return type for each. In this
    # case, the "books" query returns an array of zero or more Books (defined above).
    type Query {
        # currencies: [Currency]
        currency(input: CurrencyQueryInput): Currency
    }
`

const books = [
    {
        title: 'The Awakening',
        author: 'Kate Chopin',
    },
    {
        title: 'City of Glass',
        author: 'Paul Auster',
    },
]

const resolvers = {
    Query: {
        // currencies: () => ,
        currency: async (parent, args, context, info) => await Resolvers.getCurrency(args.input),
    },
}

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ typeDefs, resolvers })

// needed so that relations are defined since sequelize is awkward
DB.ensureDBSynced()

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`)
})

import * as Sequelize from 'sequelize'
import database from './dbSetup'

import * as Types from '../declarations'

const Currency = database.define(
    'Currency',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        nomicsId: Sequelize.STRING(64),
        name: Sequelize.STRING(128),
        symbol: Sequelize.STRING(32),
    },
    {
        timestamps: true,
        freezeTableName: true,
    },
)

// export const ensureCurrenciesExistInDB = async ({
//     currencies,
// }: {
//     currencies: { name: string; symbol: string }[]
// }): Promise<number> => {
//     let added = 0

//     await Promise.all(
//         currencies.map(async ({ name, symbol }) => {
//             try {
//                 await prisma.currency.upsert({
//                     where: { symbol },
//                     update: { name, symbol },
//                     create: { name, symbol },
//                 })

//                 added++
//             } catch (err) {
//                 console.error('err adding', err)
//             }
//         }),
//     )

//     return added
// }

export const ensureCurrenciesExistInDB = async ({
    currencies,
}: {
    currencies: { name: string; symbol: string; id: string }[]
}): Promise<number> => {
    let added = 0

    for (let i = 0; i < currencies.length; i++) {
        try {
            await ensureCurrencyExists(currencies[i])
            added++
        } catch (err) {
            console.log(err)
        }
    }

    return added
}

export const ensureCurrencyExists: any = async (oCurrency: Types.NomicsListing) =>
    Currency.findOrCreate({
        where: {
            nomicsId: oCurrency.id,
        },
        defaults: {
            nomicsId: oCurrency.id,
            symbol: oCurrency.symbol,
            name: oCurrency.name,
        },
    }) //.spread((oCurrency: any) => oCurrency.get({ plain: true }))

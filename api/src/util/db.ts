import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const ensureCurrenciesExistInDB = async ({
    currencies,
}: {
    currencies: { name: string; symbol: string; id: string }[]
}): Promise<number> => {
    const added = 0
    // await currencies.map(async ({ name, symbol }) => {
    //     // await prisma.$connect()

    //     // await prisma.currency.upsert({
    //     //     where: { symbol },
    //     //     update: { name, symbol },
    //     //     create: { name, symbol },
    //     // })
    //     await sleep(1000)

    //     added++
    //     console.log('added')
    //     // await prisma.$disconnect()
    // }, undefined)

    await Promise.all(
        currencies.map(async ({ name, symbol, id: nomicsId }) => {
            try {
                // await prisma.$connect()
                await prisma.currency.upsert({
                    where: { nomicsId },
                    update: { name, symbol },
                    create: { nomicsId, name, symbol },
                })
                // await prisma.$disconnect()
            } catch (err) {
                console.error('err adding', err)
            }
        }),
    )
    await prisma.$disconnect()

    return added
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/*
await arr.reduce(async (memo, i) => {
	await memo;
	await sleep(10 - i);
	console.log(i);
}, undefined);
*/

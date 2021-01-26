import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const ensureCurrenciesExistInDB = async ({
    currencies,
}: {
    currencies: { name: string; symbol: string }[]
}): Promise<void> => {
    currencies.forEach(async ({ name, symbol }) => {
        await prisma.currency.upsert({
            where: { symbol },
            update: { name, symbol },
            create: { name, symbol },
        })
    })
}

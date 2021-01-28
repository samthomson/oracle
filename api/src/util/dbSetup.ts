import * as Sequelize from 'sequelize'

const dbConfig = {
    host: 'mysql',
    database: process.env.MYSQL_DATABASE,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    dialect: 'mysql',
    logging: false,
}

// @ts-ignore
const database = new Sequelize(dbConfig)

database.authenticate().catch(() => {
    console.error('Could not connect to database!')
})

export default database

export const disconnectDatabase = (): void => database.close()

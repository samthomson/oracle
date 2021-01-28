import * as Sequelize from 'sequelize'

const dbConfig = {
    host: 'mysql',
    database: 'oracle',
    username: 'root',
    password: 'admin',
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

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

export const LogEntry = database.define(
    'log_entry',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        currenciesSaved: {
            type: Sequelize.SMALLINT.UNSIGNED,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        updatedAt: false,
        freezeTableName: true,
        underscored: true,
    },
)

export const Currency = database.define(
    'currency',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        nomicsId: {
            type: Sequelize.STRING(64),
            unique: true,
        },
        name: Sequelize.STRING(128),
        symbol: Sequelize.STRING(32),
    },
    {
        timestamps: true,
        freezeTableName: true,
        underscored: true,
    },
)

export const CurrencyEntry = database.define(
    'currency_entry',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        currencyId: Sequelize.SMALLINT.UNSIGNED,
        logEntryId: Sequelize.INTEGER.UNSIGNED,
        priceBTC: { type: Sequelize.DECIMAL(32, 12), field: 'price_BTC' },
    },
    {
        timestamps: false,
        freezeTableName: true,
        underscored: true,
        indexes: [{ fields: ['currency_id'] }, { fields: ['log_entry_id'] }],
    },
)

export const ensureDBSynced = async () => {
    await database.sync()
    Currency.hasMany(CurrencyEntry)
    LogEntry.hasMany(CurrencyEntry)
}

database.authenticate().catch(() => console.error('Could not connect to database!'))

export default database

export const disconnectDatabase = (): void => database.close()

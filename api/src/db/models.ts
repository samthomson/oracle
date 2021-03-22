import * as Sequelize from 'sequelize'
import Database from './connection'

export const LogEntry = Database.define(
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
        source: {
            type: Sequelize.SMALLINT.UNSIGNED,
            allowNull: false,
        },
    },
    {
        timestamps: true,
        updatedAt: false,
        freezeTableName: true,
        underscored: true,
    },
)

export const Market = Database.define(
    'market',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        sourceId: Sequelize.SMALLINT.UNSIGNED,
        nomicsId: {
            type: Sequelize.STRING(64),
            unique: true,
        },
        name: Sequelize.STRING(128),
        symbol: Sequelize.STRING(32),
        quote: Sequelize.STRING(8),
    },
    {
        timestamps: true,
        freezeTableName: true,
        underscored: true,
    },
)

export const MarketEntry = Database.define(
    'market_entry',
    {
        id: {
            type: Sequelize.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        marketId: Sequelize.SMALLINT.UNSIGNED,
        logEntryId: Sequelize.INTEGER.UNSIGNED,
        priceQuote: { type: Sequelize.DECIMAL(32, 12), field: 'price_quote' },
    },
    {
        timestamps: false,
        freezeTableName: true,
        underscored: true,
        indexes: [{ fields: ['market_id'] }, { fields: ['log_entry_id'] }],
    },
)

Market.hasMany(MarketEntry)
LogEntry.hasMany(MarketEntry)
MarketEntry.belongsTo(LogEntry)
MarketEntry.belongsTo(Market)

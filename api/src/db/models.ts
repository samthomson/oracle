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
	},
	{
		timestamps: true,
		updatedAt: false,
		freezeTableName: true,
		underscored: true,
	},
)

export const Currency = Database.define(
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

export const CurrencyEntry = Database.define(
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

Currency.hasMany(CurrencyEntry)
LogEntry.hasMany(CurrencyEntry)
CurrencyEntry.belongsTo(LogEntry)
CurrencyEntry.belongsTo(Currency)

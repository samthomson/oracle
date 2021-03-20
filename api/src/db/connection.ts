import * as Sequelize from 'sequelize'
import Logger from '../services/logging'

const baseConnectionConfig = {
	host: process.env.MYSQL_HOST,
	username: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	dialect: 'mysql',
	logging: (message: string, data: Record<string, unknown>): void => {
		Logger.silly(message, {
			type: 'sequelize',
			data,
		})
	},
}
const DBConnectionConfig = {
	...baseConnectionConfig,
	database: process.env.MYSQL_DATABASE,
}

export const blankConnection = async () => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const blank = new Sequelize.Sequelize(baseConnectionConfig)
	await blank.authenticate().catch(() => Logger.warn('Could not connect to database!'))

	return blank
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const database: Sequelize.Sequelize = new Sequelize.Sequelize(DBConnectionConfig)

database.authenticate().catch(() => Logger.warn('Could not connect to database!'))

export default database

export const disconnect = (): Promise<void> => database.close()

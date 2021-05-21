
import * as Models from '../db/models'
import * as DBUtil from './SequelizeDB'


export const dataClean = async () => {
	/*
	- get log entries older than one day that have multiple corresponding market_entries
	- for each:
		- get the id of the latest on that date.
		- delete all log entries and market_entries that are not of the latest id.
	*/
	const superfluousLogEntries = await DBUtil.getOldSuperfluousLogEntries()
	
	for (let i = 0; i < superfluousLogEntries.length; i++) {
		await DBUtil.deleteOtherEntriesForDateAndSource(
			superfluousLogEntries[i].id,
			superfluousLogEntries[i].source,
			superfluousLogEntries[i].date
		)
	}
}

const Piece = require('./base/Piece');

/**
 * Base class for all Klasa Task pieces. See {@tutorial CreatingTasks} for more information how to use this class
 * to build custom tasks.
 * @tutorial CreatingTasks
 * @extends {Piece}
 */
class Task extends Piece {

	/**
	 * @typedef {PieceOptions} TaskOptions
	 * @memberof Task
	 */

	/**
	 * The run method to be overwritten in actual Task pieces
	 * @since 0.5.0
	 * @param {*} data The data from the ScheduledTask instance
	 * @returns {Promise<void>}
	 * @abstract
	 */
	run() {
		// Defined in extension Classes
	}

}

module.exports = Task;
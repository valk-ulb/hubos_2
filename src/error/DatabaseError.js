import logger from '../utils/logger.js'

/**
 * Class representing a Database error.
 */
export default class DatabaseError extends Error{
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "DatabaseError"
        logger.error(`${this.name} : ${message}`,true);
    }
}
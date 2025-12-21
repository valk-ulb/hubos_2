import logger from '../utils/logger.js'

/**
 * Class representing an IncorrectStructure error.
 */
export default class IncorrectStructureError extends Error{
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "IncorrectStructureError"
        logger.error(`${this.name} : ${message}`,true);
    }
}
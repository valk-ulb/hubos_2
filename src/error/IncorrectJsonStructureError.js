import logger from '../utils/logger.js'

/**
 * Class representing an IncorrectJsonStructure error.
 */
export default class IncorrectJsonStructureError extends Error{
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "IncorrectJsonStructureError"
        logger.error(`${this.name} : ${message}`,true);
    }
}
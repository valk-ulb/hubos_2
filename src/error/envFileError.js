import logger from '../utils/logger.js'

/**
 * Class representing an EnvFile error.
 */
export default class EnvFileError extends Error{
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "EnvFileError"
        logger.error(`${this.name} : ${message}`,true);
    }
}
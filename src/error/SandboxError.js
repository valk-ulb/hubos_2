import logger from '../utils/logger.js'

/**
 * Class representing a Sandbox error.
 */
export default class SandboxError extends Error{
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "SandboxError"
        logger.error(`${this.name} : ${message}`,true);
    }
}
import logger from '../utils/logger.js'

/**
 * Class representing a Tabac error.
 */
export default class TabacError extends Error{
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "TabacError"
        logger.error(`${this.name} : ${message}`,true);
    }
}
import logger from '../utils/logger.js'

export default class OpenhabApiError extends Error{
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "OpenhabApiError"
        logger.error(`${this.name} : ${message}`,true);
    }
}
import logger from '../utils/logger.js'

export default class InconsistencyError extends Error{
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "InconsistencyError"
        logger.error(`${this.name} : ${message}`);
    }
}
import logger from '../utils/logger.js'

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
import logger from '../utils/logger.js'
export default class IncorrectJsonStructureError extends Error{
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "IncorrectJsonStructureError"
        logger.error(`${this.name} : ${message}`);
    }
}
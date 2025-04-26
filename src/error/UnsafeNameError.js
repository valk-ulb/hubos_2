import logger from '../utils/logger.js';
export default class UnsafeNameError extends Error {
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "UnsafeNameError"
        logger.error(`${this.name} : ${message}`);
    }
}

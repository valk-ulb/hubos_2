import logger from '../utils/logger.js'

export default class SandboxError extends Error{
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "SandboxError"
        logger.error(`${this.name} : ${message}`);
    }
}
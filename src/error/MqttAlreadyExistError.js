import logger from '../utils/logger.js'

/**
 * Class representing an MqttAlreadyExist error.
 */
export default class MqttAlreadyExistError extends Error{
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "MqttAlreadyExistError"
        logger.error(`${this.name} : ${message}`,true);
    }
}
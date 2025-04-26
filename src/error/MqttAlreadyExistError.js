import logger from '../utils/logger.js'

export default class MqttAlreadyExistError extends Error{
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "MqttAlreadyExistError"
        logger.error(`${this.name} : ${message}`);
    }
}
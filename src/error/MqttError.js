import logger from '../utils/logger.js'

export default class MqttNotFoundError extends Error{
    constructor(message, error=null){
        if (error){
            message = message + ' ---- ' + error
        }
        super(message);
        this.name = "MqttNotFoundError"
        logger.error(`${this.name} : ${message}`);
    }
}
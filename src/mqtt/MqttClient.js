import mqtt from 'mqtt'
import logger from '../utils/logger.js'
import MqttError from '../error/MqttError.js'

export default class MqttClient{
    
    constructor(){
        this.url = `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;
        this.clientId = "";
        this.username = process.env.MQTT_OPENHAB_CLIENT_USERNAME;
        this.password = process.env.MQTT_OPENHAB_CLIENT_PASSWORD;
        this.client = null;
    }

    connect(){
        return new Promise((resolve, reject) => {
            this.client = mqtt.connect(this.url, {
                clientId: this.clientId,
                username: this.username,
                password: this.password
            });

            this.client.on('connect', () => {
                logger.info(`MQTT connected at ${this.url}`,true);
                resolve();
            })

            this.client.on('error', (err) => {
                logger.error('Error MQTT :',true, err.message);
                reject(err);
            });

            this.client.on('message', (topic, message) => {
                this.manageReceivedMessage(topic, message);
              });
        })
    }

    manageReceivedMessage(topic, message){
        logger.info(`message received on ${topic} : ${message.toString()}`);
    }

    subscribe(topic) {
        if (!this.client) throw new MqttError('Client not connected.');
        this.client.subscribe(topic, (err) => {
            if (err) {
                throw new MqttError(`Error while subscribing to ${topic} :`, err.message);
            } else {
                logger.info(`Subscribed to : ${topic}`,true);
            }
        });
    }

    publish(topic, message) {
        if (!this.client) throw new MqttError('Client not connected.');
        this.client.publish(topic, message, {}, (err) => {
            if (err) {
                throw new MqttError(`Error trying to send a message ${topic} :`, err.message);
            } else {
                logger.info(`Message sended to ${topic}`,true);
            }
        });
    }

    disconnect() {
        if (this.client) {
            this.client.end(() => {
                logger.info('MQTT deconnected',true);
            });
        }
    }

}
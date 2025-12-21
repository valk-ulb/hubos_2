import mqtt from 'mqtt'
import logger from '../utils/logger.js'
import MqttError from '../error/MqttError.js'

/**
 * Class representing an MQTT client.
 * This class handle the connection, subscription and publishing of messages to an MQTT broker.
 * Can be used by devs to have an idea on how to connect to the MQTT broker.
 * Used to connect to the MQTT broker as a HubOS supervisor client.
 */
export default class MqttClient{
    
    /**
     * Constructor of the MqttClient class
     */
    constructor(){
        this.url = `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;
        this.clientId = "";
        this.username = process.env.MQTT_HUBOS_CLIENT_USERNAME;
        this.password = process.env.MQTT_HUBOS_CLIENT_PASSWORD;
        this.client = null;
    }

    /**
     * Connects to the MQTT broker as a HubOS supervisor client.
     * @returns {Promise<any>} a Promise that resolves when the connection is established.
     */
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

    /**
     * Manage received message on the MQTT topic.
     * Used to log received messages.
     * @param {String} topic - topic of the received message.
     * @param {String} message - message received.
     */
    manageReceivedMessage(topic, message){
        logger.info(`message received on ${topic} : ${message.toString()}`);
    }

    /**
     * Subscribe to a topic.
     * @param {String} topic - the topic to subscribe to.
     * @throws {MqttError} if client not connected or an error resulted from the subscribe.
     */
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

    /**
     * Publish a message to a topic.
     * @param {String} topic - the topic to publish to.
     * @param {String} message - the message to publish.
     * @throws {MqttError} if client not connected or an error resulted from the subscribe.
     */
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

    /**
     * Disconnect from the MQTT broker.
     */
    disconnect() {
        if (this.client) {
            this.client.end(() => {
                logger.info('MQTT deconnected',true);
            });
        }
    }

}
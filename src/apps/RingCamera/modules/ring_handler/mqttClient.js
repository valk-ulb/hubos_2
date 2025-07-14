
import mqtt from 'mqtt'
import ringHandler from './ringHandler.js';

export default class MqttClient{
    
    constructor(){
        let mqtt_host = process.env.MQTT_HOST
        if (mqtt_host === "localhost"){
            mqtt_host = "host.docker.internal";
        }
        this.url = `mqtt://${mqtt_host}:${process.env.MQTT_PORT}`;
        this.clientId = "";
        this.username = process.env.MQTT_USERNAME;
        this.password = process.env.MQTT_PASSWORD;
        this.client = null;
    }

    connect(){
        return new Promise((resolve, reject) => {
            console.log(`connecting to : ${this.clientId} --- ${this.username} --- ${this.password}`)
            this.client = mqtt.connect(this.url, {
                clientId: this.clientId,
                username: this.username,
                password: this.password
            });

            this.client.on('connect', () => {
                console.log(`MQTT connected at ${this.url}`,true);
                resolve();
            })

            this.client.on('error', (err) => {
                console.log('Error MQTT :',true, err.message);
                reject(err);
            });

            this.client.on('message', (topic, message) => {
                this.manageReceivedMessage(topic, message);
              });
        })
    }

    manageReceivedMessage(topic, message){
        if (topic === process.env.MODULE_SUPERV_TOPIC){
            ringHandler.handleNewMessage(message);
        }else{
            console.log(`message received on ${topic} : ${message.toString()}`);
        }
    }

    subscribe(topic) {
        if (!this.client) throw new MqttError('Client not connected.');
        this.client.subscribe(topic, (err) => {
            if (err) {
                throw new MqttError(`Error while subscribing to ${topic} :`, err.message);
            } else {
                console.log(`Subscribed to : ${topic}`,true);
            }
        });
    }

    publish(topic, message) {
        if (!this.client) throw new MqttError('Client not connected.');
        this.client.publish(topic, message, {}, (err) => {
            if (err) {
                throw new MqttError(`Error trying to send a message ${topic} :`, err.message);
            } else {
                console.log(`Message sended to ${topic}`,true);
            }
        });
    }

    disconnect() {
        if (this.client) {
            this.client.end(() => {
                console.log('MQTT deconnected',true);
            });
        }
    }

}
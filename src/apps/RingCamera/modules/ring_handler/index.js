import MqttClient from "./mqttClient.js";
import * as dotenv from "dotenv";
dotenv.config({});

const mqttClient = new MqttClient();
await mqttClient.connect();

mqttClient.subscribe(process.env.MODULE_SUPERV_TOPIC);

async function processTriggerEvent() {
    const host = 'google.com'
    setInterval(async () => {
        console.log("ici")
    }, 5000);
}

processTriggerEvent();
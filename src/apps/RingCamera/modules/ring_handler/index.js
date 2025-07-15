import * as dotenv from "dotenv";
import MqttClient from './mqttClient.js'
dotenv.config({});

const mqttClient = new MqttClient();
await mqttClient.connect();

mqttClient.subscribe(process.env.MODULE_SUPERV_TOPIC);

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

async function processTriggerEvent() {
}

processTriggerEvent();
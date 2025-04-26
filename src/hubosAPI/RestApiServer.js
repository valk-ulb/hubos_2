// RestApiServer.js
import express from 'express';
import MqttController from '../Controller/MqttController.js'
export default class RestApiServer {

  /**
   * 
   * @param {MqttController} mqttController 
   */
  constructor(mqttController=null) {
    this.port = process.env.HUBOS_PORT;
    this.app = express();
    this.server = null;
    this.mqttController = mqttController;
    // Built-in middleware to parse JSON
    this.app.use(express.json());

    // Setup basic routes
    this.setupRoutes();
  }

  setupRoutes() {
    const router = express.Router();

    router.get('/', (req, res) => {
      res.send('HubOS is running');
    });

    router.get('/status', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Example POST endpoint
    router.post('/echo', (req, res) => {
      res.json({ received: req.body });
    });

    router.post('/mqtt/createClient', async (req, res) => {
      /*
      try {
        await this.mqttController.createModuleClient()
        await this.mqttManager.sendCreateClientCommand({ username, password, role, group });
        res.status(201).json({ message: `MQTT client "${username}" created.` });
      } catch (err) {
        console.error('❌ Error creating MQTT client:', err.message);
        res.status(500).json({ error: 'Failed to create MQTT client.' });
      }*/
    });

    this.app.use('/api/v1',router)
  }

  async createClient(){

  }


  start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`✅ REST API listening on http://localhost:${this.port}/api/v1`);
        resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (!this.server) return resolve();

      this.server.close((err) => {
        if (err) return reject(err);
        console.log('🛑 REST API stopped');
        resolve();
      });
    });
  }
}

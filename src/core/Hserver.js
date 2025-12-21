import express from 'express';
import path from 'path';
import logger from '../utils/logger.js'
import cors from 'cors'

/**
 * Hserver class.
 * Used to create and start the REST API server.
 * Still in development.
 */
class Hserver{
    /**
     * Constructor of Hserver class.
     * The api will be accessible through the endpoint : http://<HUBOS_HOST>:<HUBOS_PORT>/api/v1
     */
    constructor(){
        this.app = express();
        this.port = process.env.HUBOS_PORT;
        this.hubosServer = `http://host.docker.internal:${this.port}/api/v1`
        this.hubosServerAlternative = `http://localhost:${this.port}/api/v1`
        this.router = express.Router();
    }

    /**
     * Setup the routes of the REST API.
     */
    setupRoutes(){
        this.app.use(express.json());

        this.app.use('/api/v1', this.router);

        this.router.post('/echo', (req, res) => {
            res.json({received: req.body});
        });

        this.router.get('/ec',(req, res) => {
            console.log("request to ec ")
            res.json({ status: 'OK', route: '/ec' });
        })

    }

    /**
     * Start the REST API server.
     */
    start(){
        this.app.listen(this.port, () => {
            logger.info( `API REST listening on http://localhost:${this.port}/api/v1`,true)
        })
    }
}

const hserver = new Hserver();
export default hserver;

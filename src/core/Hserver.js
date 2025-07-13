import express from 'express';
import path from 'path';
import logger from '../utils/logger.js'
import cors from 'cors'
class Hserver{
    constructor(){
        this.app = express();
        this.port = process.env.HUBOS_PORT;
        this.hubosServer = `http://host.docker.internal:${this.port}/api/v1`
        this.hubosServerAlternative = `http://localhost:${this.port}/api/v1`
        this.router = express.Router();
    }

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

    start(){
        this.app.listen(this.port, () => {
            logger.info( `API REST listening on http://localhost:${this.port}/api/v1`,true)
        })
    }
}

//const hserver = new Hserver();
//export default hserver;

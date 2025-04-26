import express from 'express';
import path from 'path';
import logger from '../utils/logger.js'
import {errorHandler} from '../middleware/errorHandler.js'
import adminRouter from '../routes/api/admin.js'
import rootRooter from '../routes/root.js';
import cors from 'cors'
export default class Hserver{
    constructor(viewsPath){
        this.app = express();
        this.port = process.env.HUBOS_PORT;
        this.viewsPath = viewsPath;
        this.adminRouter = new adminRouter(viewsPath);
        this.rootRouter = new rootRooter(viewsPath);
    }

    setupMiddelwares(){
        // logger
        this.app.use((req, res, next) => {
            logger.serverInfo(`Server interaction : ${req.method}\t${req.headers.origin}\t${req.url}`);
            next();
        })
        
        // cross Origin Resource Sharing
        //this.app.use(cors());

        this.app.use(express.urlencoded({
            extended: false
        }));
        this.app.use(express.json());
        this.app.use(express.static(path.join(this.viewsPath,'/public')));
    }

    setupRoutes() {
        this.rootRouter.setRoutes()
        this.adminRouter.setRoutes();
        /*router.get('/*', (req, res) => {
            res.status(404).sendFile(path.join(this.viewsPath, '404.html'));
        });*/

        this.app.use(errorHandler)
        this.app.use('', this.rootRouter.getRouter());
        this.app.use('/admin',this.adminRouter.getRouter())
    }

    async start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                console.log(`✅ REST API listening on http://localhost:${this.port}/api/v1`);
                resolve();
            });
        });
    }
    
    async stop() {
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

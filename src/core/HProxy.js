
import { abort } from 'process';
import {Straightforward, middleware} from 'straightforward'
import { replaceUnderscoresWithDashes } from '../utils/NameUtil.js';
import permissionManager from '../Controller/PermissionManager.js';
import { resolve } from 'path';
import util from 'util'
class Hproxy{
    constructor(){
        //this.target = `http://${process.env.HUBOS_URL}`
        this.port = process.env.HUBOS_PROXY_PORT;
        this.proxy = `http://host.docker.internal:${process.env.HUBOS_PROXY_PORT}`
        this.sf = new Straightforward();
    }

    configureForwardProxy(){
        this.sf.onRequest.use(async ({req, res}, next) => {
            console.log(`http request: ${req.url}`);
            console.log(`http module`)

            let hubos_container_id = req.headers['hubos-container-id'];
            if (!hubos_container_id){
                console.log("zzzz")
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.write('Missing hubos-container-id header');
                res.end();
                return;
            }

            hubos_container_id = replaceUnderscoresWithDashes(hubos_container_id);
            console.log(hubos_container_id);
            console.log(req.url);



            if (!permissionManager.isServerPermitted(req.url, hubos_container_id)){
                console.log('eee')
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                res.write('Access denied');
                res.end();
                return;
            }



            return next();

            //if request to api allow 

            //if request to external ask permission manager
            
        })

        this.sf.onResponse.use(async ({req, res, proxyRes}, next) => {
            console.log("response")
            console.log(res)
            return next();
        })

        this.sf.onConnect.use(async ({req, clientSocket, head}, next) => {
            console.log(`connect request to : ${req.url}`)
            let hubos_container_id = req.headers['hubos-container-id'];
            if (!hubos_container_id){
                clientSocket.destroy();
                return;
            }

            hubos_container_id = replaceUnderscoresWithDashes(hubos_container_id);
            console.log(hubos_container_id);
            console.log(req.url);



            if (!permissionManager.isServerPermitted(req.url, hubos_container_id)){
                clientSocket.destroy();
                return;
            }
            return next();
        })
    }

    async startProxy(){
        await this.sf.listen(this.port).catch(err => {
            console.error(`Error starting the proxy`, err);
        })
        console.log(`Proxy listing on localhost:${this.port}`);

    }
    
}

const hproxy = new Hproxy();

export default hproxy;

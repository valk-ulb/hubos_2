
import { abort } from 'process';
import {Straightforward, middleware} from 'straightforward'
import { replaceUnderscoresWithDashes } from '../utils/NameUtil.js';
import permissionManager from '../Controller/PermissionManager.js';
import { resolve } from 'path';
import util from 'util'
import logger from '../utils/logger.js'
class Hproxy{
    constructor(){
        //this.target = `http://${process.env.HUBOS_URL}`
        this.port = process.env.HUBOS_PROXY_PORT;
        this.proxy = `host.docker.internal:${process.env.HUBOS_PROXY_PORT}`
        this.sf = new Straightforward();
    }

    configureForwardProxy(){
        this.sf.onRequest.use(async ({req, res}, next) => {
            let hubos_container_id = this.decodeBasicAuthHeader(req.headers['proxy-authorization']);
            let host = req.headers['host']
            console.log(`request to : ${host} from : ${hubos_container_id}`)
            if (!hubos_container_id){
                clientSocket.destroy();
                return;
            }

            hubos_container_id = replaceUnderscoresWithDashes(hubos_container_id);

            if (!permissionManager.isServerPermitted(host, hubos_container_id)){
                clientSocket.destroy();
                return;
            }
            return next();          
        })

        this.sf.onConnect.use(async ({req, clientSocket, head}, next) => {
            let hubos_container_id = this.decodeBasicAuthHeader(req.headers['proxy-authorization']).username;
            let host = req.headers['host']
            console.log(`connect request to : ${host} from : ${util.inspect(hubos_container_id, {colors:true, depth:null,showHidden:true})}`)
            if (!hubos_container_id){
                logger.warn(`Error auth header not correct`)
                clientSocket.destroy();
                return;
            }

            hubos_container_id = replaceUnderscoresWithDashes(hubos_container_id);

            if (!permissionManager.isServerPermitted(host, hubos_container_id)){
                logger.warn(`Error request not allowed`)
                clientSocket.destroy();
                return;
            }
            return next();
        }, middleware.auth)
    }

    async startProxy(){
        await this.sf.listen(this.port).catch(err => {
            console.error(`Error starting the proxy`, err);
        })
        console.log(`Proxy listing on localhost:${this.port}`);

    }

    decodeBasicAuthHeader(headerValue){
        if (!headerValue || !headerValue.startsWith('Basic ')) {
            throw new Error('Invalid or missing Basic Auth header');
        }

        const base64Credentials = headerValue.slice(6); // Supprime "Basic "
        const decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    
        const [username, password] = decoded.split(':');
    
        return { username, password };    
    }
    
}

const hproxy = new Hproxy();

export default hproxy;

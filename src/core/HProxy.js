
import { abort } from 'process';
import {Straightforward, middleware} from 'straightforward'
import { replaceUnderscoresWithDashes } from '../utils/NameUtil.js';
import permissionManager from '../Controller/PermissionManager.js';
import { resolve } from 'path';
import util from 'util'
import logger from '../utils/logger.js'
/**
 * Class representing an HTTP Proxy server.
 * Used to forward requests from HubOS (modules) containers to external services.
 */
class Hproxy{
    /**
     * Creates an instance of Hproxy.
     * accessible via <localhost>:<HUBOS_PROXY_PORT>
     */
    constructor(){
        //this.target = `http://${process.env.HUBOS_URL}`
        this.port = process.env.HUBOS_PROXY_PORT;
        this.proxy = `host.docker.internal:${process.env.HUBOS_PROXY_PORT}`
        this.sf = new Straightforward();
    }

    /**
     * Configures the forward proxy with authentication and permission checks.
     * Each request is checked to ensure the requesting container has permission
     * to access the target host.
     * The authentication is done via Basic Auth headers, where the username
     * represents the HubOS container ID.
     * The permissionManager is used to verify if the container is allowed
     * to access the requested host.
     */
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

    /**
     * Starts the proxy server and listens on the configured port.
     */
    async startProxy(){
        await this.sf.listen(this.port).catch(err => {
            console.error(`Error starting the proxy`, err);
        })
        console.log(`Proxy listing on localhost:${this.port}`);

    }

    /**
     * Decodes a Basic Auth header.
     * Auth header format: "Basic base64(username:password)"
     * Username and password are the HubOS container ID.
     * @param {any} headerValue - request.headers['proxy-authorization'] value  
     * @returns {any} - Object containing username and password of the decoded basic auth.
     */
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

export default hproxy; // singleton

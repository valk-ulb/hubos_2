
import { abort } from 'process';
import {Straightforward, middleware} from 'straightforward'
import { replaceUnderscoresWithDashes } from '../utils/NameUtil';
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
            console.log();
            let hubos_container_id = req.headers['hubos-container-id'];
            if (!hubos_container_id){
                return abort();
            }

            hubos_container_id = replaceUnderscoresWithDashes(hubos_container_id);

            //if request to api allow 

            //if request to external ask permission manager
            return next();
        })

        this.sf.onConnect.use(async ({req, clientSocket, head}, next) => {
            console.log(`connect request to : ${req.url}`)
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

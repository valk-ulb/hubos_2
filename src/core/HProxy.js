import {Straightforward, middleware} from 'straightforward'
import e from 'express';
export default class Hproxy{
    constructor(){
        this.target = `http://${process.env.HUBOS_URL}`
        this.port = process.env.HUBOS_PROXY_PORT;
        this.sf = new Straightforward();
        this.app = e()
        this.app.get('/', (req, res) => {
            res.json({message: 'Hello'})
        })
        this.app.listen(`${this.port}`)
    }

    configureForwardProxy(){
        this.sf.onRequest.use(async ({req, res}, next) => {
            console.log(`http request: ${req.url}`);
            return next();
        })

        this.sf.onConnect.use(async ({req, clientSocket, head}, next) => {
            console.log(`connect request to : ${req.url}`)
            return next();
        })
    }

    async startProxy(){
        this.sf.listen(this.port).then(() => {
            console.log(`Proxy listing on ${this.target}:${this.port}`);
        }).catch(err => {
            console.error(`Error starting the proxy`, err);
        })

    }

}
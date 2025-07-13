import net from 'net'

export default class Hproxy2{
    constructor(){
        this.app = net.createServer();
        this.host = process.env.HUBOS_URL
        this.target = `http://${this.host}`
        this.port = process.env.HUBOS_PROXY_PORT;
    }

    configureForwardProxy(){
        this.app.on("connection", (clientToProxySocket) => {
            console.log("Client connected to Proxy");
            clientToProxySocket.once("data", (data) => {
                console.log(data.toString());
                const isConnectionTLS = data.toString().indexOf("CONNECT ") !== 1;
                let serverPort;
                let serverAddress;
                if (isConnectionTLS) {
                    console.log("is tls");
                    console.log(data.toString())
                    serverPort = 443
                    serverAddress = data
                        .toString().split("CONNECT")[1]
                        .split(" ")[1]
                        .split(":")[0]
                }else{
                    serverPort = 80;
                    data.toString().split("Host: ")[1].split("\\n")[0];
                }
                let proxyToServerSocket = net.createConnection(
                    {
                        host: serverAddress,
                        port: serverPort
                    },
                    () => {
                        console.log("Proxy connected to server ", serverAddress)
                    }
                );
                if (isConnectionTLS) {
                    clientToProxySocket.write("HTTP/1.1 200 OK\\r\\n\\n")
                }else{
                    proxyToServerSocket.write(data)
                }
                clientToProxySocket.pipe(proxyToServerSocket);
                proxyToServerSocket.pipe(clientToProxySocket);

                proxyToServerSocket.on("error", (err) => {
                    console.error("Proxy to server error", err);
                });
                clientToProxySocket.on("error", (err) => {
                    console.error("Client to proxy error",err);
                });
            })
        });
        this.app.on('close', () => {
            console.log("connection clossed")
        })
    }

    async startProxy(){
        this.app.listen({host: this.host, port:this.port},  () => {
            console.log(`Proxy server running on http://localhost:${this.port}`);
        });
    }
}
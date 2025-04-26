
export default class Server{
    
    constructor(serverName, host, serverPort, serverDescription, id=null){
        this.id = id;
        this.name = serverName;
        this.host = host;
        this.port = serverPort;
        this.description = serverDescription
    }

    setID(id){
        this.id=id;
    }
}
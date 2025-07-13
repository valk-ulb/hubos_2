
export default class Server{
    
    constructor(serverName, host, serverDescription, id=null){
        this.id = id;
        this.name = serverName;
        this.host = host;
        this.description = serverDescription
    }

    setID(id){
        this.id=id;
    }
}
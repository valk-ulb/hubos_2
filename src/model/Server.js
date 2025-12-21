
/**
 * Class representing a server.
 * used to store server information from the configuration file of an app.
 */
export default class Server{
    
    /**
     * Constructor of the Server class.
     * @param {String} serverName - name of the server.
     * @param {String} host - host of the server (domain name or IP).
     * @param {String} serverDescription - description of the server.
     * @param {String} id - id of the server (represents the ID on the Database).
     */
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
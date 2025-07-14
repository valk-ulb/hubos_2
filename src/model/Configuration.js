
import Device from "./Device.js";
import Server from "./Server.js";

import fs from 'fs/promises'

export default class Configuration{
    
    constructor(){
        this.id = null;
        /** @type {Array<Device>} */
        this.devices = [];
        /** @type {Array<Server>} */
        this.servers = [];
    }

    setId(id){
        this.id = id;
    }

    setDevices(devices){
        this.devices = devices;
    }

    setServers(servers){
        this.servers = servers;
    }

    /**
     * Extract all the defined servers in the configuration file and store them in the db.
     * @param {any} configurationData - JSON parse of configuration file 
     */
    extractDevices(configurationData){
        const devices = configurationData.configuration.devices;
        for (let deviceName of Object.keys(devices)){
            const deviceConfig = devices[deviceName];
            const deviceUID = deviceConfig['UID'];
            const deviceDescription = deviceConfig['description']
            const deviceType = deviceConfig['type'];
            const device = new Device(deviceName, deviceUID, deviceDescription, deviceType);
            this.devices.push(device);
        };
    }

    /**
     * Extract all the defined servers in the configuration file and store them in the db.
     * @param {any} configurationData - JSON parse of configuration file. 
     */
    extractServers(configurationData){
        const servers = configurationData.configuration.servers;
        for (let serverName of Object.keys(servers)){
            const serverConfig = servers[serverName];
            const serverIP = serverConfig['host'];
            const serverPort = serverConfig['port'];
            const serverDescription = serverConfig['description'];
            const server = new Server(serverName, serverIP, serverDescription)
            this.servers.push(server);
        };
    }

}
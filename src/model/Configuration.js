
import Device from "./Device.js";
import Server from "./Server.js";

import fs from 'fs/promises'

/**
 * Class representing a configuration from the configuration file of an app.
 */
export default class Configuration{
    
    /**
     * Constructor of the Configuration class.
     * Contains devices and servers defined in the configuration file.
     */
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

    /**
     * Set the devices of the configuration.
     * Used when retrieving configuration from the database.
     * @param {Array<Device>} devices - array of devices to set.
     */
    setDevices(devices){
        this.devices = devices;
    }

    /**
     * Set the servers of the configuration.
     * Used when retrieving configuration from the database.
     * @param {Array<Server>} servers - array of servers to set.
     */
    setServers(servers){
        this.servers = servers;
    }

    /**
     * Extract all the  devices defined in the configuration file.
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
     * Extract all the  servers defined in the configuration file.
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
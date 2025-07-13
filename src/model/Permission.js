import Device from "./Device.js";
import Server from "./Server.js";

export default class Permission {

    /**
     * Simple constructor
     * @param {any} duration 
     * @param {Server} server 
     * @param {Device} device 
     */
    constructor(duration,server=null,device=null){
        this.start = Date.now();
        this.duration = parseInt(duration);
        this.end = this.start + (this.duration * 1000);
        
        this.isServerAll = false;
        this.isServer = false;
        this.isDevice = false;
        this.server = null;
        this.device = null;
        if (server){
            this.server = server
            this.isServer = true;
            this.isServerAll = this.server.host === 'all'
        } else if (device){
            this.device = device;
            this.isDevice = true;
        }

    }

    setDuration(duration){
        this.start = Date.now();
        this.duration = parseInt(duration);
        this.end = this.start + (duration * 1000);
    }

    compareAuth(auth){
        if (auth.type === "device" && this.isDevice){
            return this.device.deviceUID === auth.deviceUID;
        }else if (auth.type === "service" && auth.access === "NetworkClient" && this.isServer){
            return  (auth.server==='all' && this.isServerAll) || (this.server.host === auth.hostIp && this.server.port === auth.hostPort);
        }
    }

    
}

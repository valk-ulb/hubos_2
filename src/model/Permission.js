import Device from "./Device.js";
import Server from "./Server.js";

/**
 * Class representing a permission.
 * Permission can be for a server or a device.
 * Those permissions are used to allow a module to access a server or a device for a given duration.
 * Those permissions are granted when OpenHAB is publishing an auth request on the auth topic dedicated to a module.
 */
export default class Permission {

    /**
     * Constructor of the Permission class.
     * @param {String} duration - duration of the permission in seconds. If negative, the permission is infinite.
     * @param {Server} server - server associated to the permission.
     * @param {Device} device - device associated to the permission.
     */
    constructor(duration,server=null,device=null){
        this.isInfinite = parseInt(duration) < 0
        this.start = Date.now();
        this.duration = 0;
        this.end = 0;

        if(!this.isInfinite){
            this.start = Date.now();
            this.duration = parseInt(duration);
            this.end = this.start + (this.duration * 1000);
        }
        
        this.isServerAll = false;
        this.isServer = false;
        this.isDevice = false;
        this.server = null;
        this.device = null;
        if (server){
            this.server = server
            this.isServer = true;
            this.isServerAll = this.server.name === 'all'
        } else if (device){
            this.device = device;
            this.isDevice = true;
        }
    }

    /**
     * Check if the given url is permitted by this permission.
     * The permission must be still valid (not expired) and the url must match the server host (or the server host set to 'all').
     * @param {String} url - url or host to check. 
     * @returns {Boolean} True if the url is permitted by this permission, false otherwise.
     */
    isServerPermitted(url){
        const isTimeGood = this.isInfinite || Date.now() <= this.end;
        if (isTimeGood){
            if(this.isServerAll){
                return true;
            }else if ((this.server.host === url) || (this.server.host.endsWith('#') && url.startsWith(this.server.host.slice(0, -1)))){
                return true;
            }
        }
        return  false;
    }

    /**
     * Set the duration of the permission.
     * Useful to extend the duration of an existing permission.
     * @param {String} duration - duration of the permission in seconds.
     */
    setDuration(duration){
        this.start = Date.now();
        this.duration = parseInt(duration);
        this.end = this.start + (duration * 1000);
    }

    /**
     * Check if the end time of the permission has passed.
     * @returns {Boolean} True if the end time has passed, false otherwise.
     */
    isEndTimePassed(){
        return this.isInfinite || Date.now() > this.end;
    }

    /**
     * Compare the given auth with this permission.
     * Check if the type and the identifier (deviceUID or host) match.
     * @param {any} auth - the auth to compare with this permission.
     * @returns {Boolean} True if the auth matches this permission, false otherwise.
     */
    compareAuth(auth){
        if (auth.type === "device" && this.isDevice){
            return this.device.deviceUID === auth.deviceUID;
        }else if (auth.type === "service" && auth.access === "NetworkClient" && this.isServer){
            return  (auth.server==='all' && this.isServerAll) || (this.server.host === auth.hostIp);
        }
    }

    
}

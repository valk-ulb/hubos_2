import Device from "../model/Device.js";
import Permission from "../model/Permission.js";
import Server from "../model/Server.js";

/**
 * Class managing permissions for modules.
 */
class PermissionManager{

    /**
     * Simple constructor.
     * this.permissions is a Map with ModuleUID (key):list of Permission (element)
     */
    constructor(){
        this.moduleIds = null;
        this.permissions = new Map()
    }

    /**
     * Poppulate this.permissions with empty array for each module.
     * @param {Array<String>} moduleIds - list of moduleUIDs
     */
    setModulesIds(moduleIds){
        this.moduleIds = moduleIds;
        for (const moduleId of moduleIds){
            this.permissions.set(moduleId,[])
        }
    }

    /**
     * Verify if a given auth object is already listed in the permission list of a given module.
     * @param {any} auth - JSON Auth object sent by openhab that contain the permission to attribute. 
     * @param {String} moduleId - module UID.
     * @returns {Number} the position in the list if found or -1 if the permission is not already listed, 
     */
    verifyIfAlreadyPermitted(auth, moduleId){
        let i = 0;
        let res = -1;
        for (let permission of this.permissions.get(moduleId)){
            if (permission.compareAuth(auth)){
                res = i;
                if(permission.isServerAll){
                    return i;
                }
            }
            i = i+1;
        }
        return res;
    }

    /**
     * Add a new permission for a given module using the auth object.
     * First, the function verify if this message define a permission already listed for the given module. 
     * If exist: upadte the duration of the permission.
     * If not exist: verify if the permission is about a device or server access and create the correct Permission.
     * @param {String} message - message containing a JSON Auth object.
     * @param {String} moduleId - moduleUID
     */
    addNewPermission(message, moduleId){
        const auths = JSON.parse(message);
        for (const auth of auths){
            const indice = this.verifyIfAlreadyPermitted(auth, moduleId);
            const exist = indice !== -1;
            if (exist){
                this.permissions.get(moduleId)[indice].setDuration(auth.period);
            }else{
                if (auth.type === "device"){
                    const temp = new Device(auth.access,auth.deviceUID,'','deviceForPermission')
                    this.permissions.get(moduleId).push(new Permission(auth.period,null, temp))
                }else if (auth.type === "service" && auth.access === "NetworkClient"){
                    const temp = new Server(auth.server,auth.hostIp,'');
                    this.permissions.get(moduleId).push(new Permission(auth.period, temp));
                }
            }
        }
    }

    /**
     * Verify if a module is permitted to access a given URL.
     * @param {String} url - URL of the web request. 
     * @param {String} moduleId - moduleUID 
     * @returns true if a module has a permission that allow it to access this url.
     */
    isServerPermitted(url, moduleId){
        // if(url.startsWith(hserver.hubosServer) || url.startsWith(hserver.hubosServerAlternative)){
        //     return true;
        // }
        for (let p of this.permissions.get(moduleId)){
            if (p.isServer){
                if(p.isServerPermitted(url)){
                    return true;
                }
            }
        }
        return false;
    }

}

const permissionManager = new PermissionManager();

export default permissionManager; // Singleton

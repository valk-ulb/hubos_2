import Device from "../model/Device.js";
import Permission from "../model/Permission.js";
import Server from "../model/Server.js";

class PermissionManager{


    constructor(){
        this.moduleIds = null;
        this.permissions = new Map()
    }

    /**
     * 
     * @param {Array<String>} moduleIds 
     */
    setModulesIds(moduleIds){
        this.moduleIds = moduleIds;
        for (const moduleId of moduleIds){
            this.permissions.set(moduleId,[])
        }
    }

    verifyIfAlreadyPermitted(auth, moduleId){
        let i = 0;
        for (let permission of this.permissions.get(moduleId)){
                if (permission.compareAuth(auth)){
                    return i;
                }
            i = i+1;
        }
        return -1;
    }

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
                    const temp = new Server(auth.server,auth.hostIp,auth.hostPort,'');
                    this.permissions.get(moduleId).push(new Permission(auth.period, temp));
                }
            }
        }
    }
}

const permissionManager = new PermissionManager();

export default permissionManager;

export default class Device{
    
    constructor(deviceName, deviceUID, deviceDescription, deviceType, id=null){
        this.id = id
        this.name = deviceName;
        this.deviceUID = deviceUID;
        this.description = deviceDescription;
        this.type = deviceType;
    }

    setID(id){
        this.id = id;
    }
}
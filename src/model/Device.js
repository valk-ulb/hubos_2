
/**
 * Class representing a device from the configuration file of an app.
 */
export default class Device{
    
    /**
     * Constructor of the Device class.
     * @param {String} deviceName - name of the device.
     * @param {String} deviceUID - UID of the device.
     * @param {String} deviceDescription - description of the device.
     * @param {String} deviceType - type of the device.
     * @param {String} id - id of the device (represents the ID on the Database).
     */
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
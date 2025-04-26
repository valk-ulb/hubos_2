import App from '../../model/App.js';
import Device from '../../model/Device.js';
import db from '../Database.js'
import DatabaseError from '../../error/DatabaseError.js';

export default class DeviceDao {
    
    /**
     * Return the list of devices configuration listed to the app.
     * @param {App} app 
     * @returns A list of Device objects. 
     */
    async getDevicesFromApp(app){
        try {
            const queryText = `
            SELECT id, app_id, name, deviceUID, description, type
            FROM appDevice
            WHERE app_id = $1
            `;
            const { rows } = await db.pool.query(queryText, [app.appId]);
            let devices = [];
            rows.forEach(row => {
                devices.push(new Device(row.name,row.deviceUID,row.description,row.type,row.id))
            })
            return devices;
        } catch (err) {
            throw new DatabaseError(`Error : while trying to retrieve devices with following appname : ${app.appName}`, err);
        }
    }
}
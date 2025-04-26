import App from '../../model/App.js';
import AppDevice from '../../model/Device.js';
import AppServer from '../../model/Server.js';
import Configuration from '../../model/Configuration.js';
import db from '../Database.js'

export default class ConfigurationDao {

    /**
     * 
     * @param {Configuration} configuration 
     */
    constructor(configuration){
        this.devices = configuration.devices;
        this.servers = configuration.servers;
        this.id = null;
    }
    
    /**
     * Add a new device configuration into the appDevice table.
     * @param {App} app - The device for the app.
     * @param {AppDevice} appDevice - The device to add.
     * @returns The UID of the added line.
     */
    async insertAppDevice(app, appDevice){
        const client = await db.pool.connect();
        try {
            const query = `
                INSERT INTO appDevice (app_id, name, deviceUID, descriptionn, type)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `;
            const { rows } = await client.query(query, [app.appId, appDevice.name, appDevice.uid, appDevice.description, appDevice.type]);
        
            if (rows.length > 0) {
                logger.info(`new module inserted with id=${rows[0].id}`);
                return rows[0].id;
            } else {
                logger.warn(`No line inserted with device name = ${appDevice.name} for app = ${app.appName}`);
                return null;
            }
        } catch (err) {
        logger.error('Error while adding a new module : ', err);
        throw err; 
        } finally {
        client.release();
        }
    }

    /**
     * Add a new server configuration into the appServer table.
     * @param {App} app - The device for the app.
     * @param {AppServer} appServer - The server to add.
     * @returns The UID of the added line.
     */
    async insertAppServer(app, appServer){
        const client = await db.pool.connect();
        try {
            const query = `
                INSERT INTO appServer (app_id, name, ip_address, port, description)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `;
            const { rows } = await client.query(query, [app.appId, appServer.name, appServer.ip, appServer.port, appServer.description]);
        
            if (rows.length > 0) {
                logger.info(`new module inserted with id=${rows[0].id}`);
                return rows[0].id;
            } else {
                logger.warn(`No line inserted with device name = ${deviceName} for app = ${app.appName}`);
                return null;
            }
        } catch (err) {
        logger.error('Error while adding a new module : ', err);
        throw err; 
        } finally {
        client.release();
        }
    }
    
}
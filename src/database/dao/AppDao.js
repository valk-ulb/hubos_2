import DatabaseError from '../../error/DatabaseError.js';
import App from '../../model/App.js';
import db from '../Database.js'
import Module from '../../model/Module.js';
import Device from '../../model/Device.js';
import logger from '../../utils/logger.js'
export default class AppDao {

    /**
     * insert a new app and its configuration into the db.
     * @param {App} app - app to add into the db.
     */
    async insertCompleteApp(app){
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            const app_id = await this.insertApp(app, client);
            app.setID(app_id);
            app.manifestModules.forEach(async module => {
                const moduleId = await this.insertModule(module, app_id, app.appName ,client);
                module.setID(moduleId);
            });
            app.configuration.devices.forEach(async (device) => {
                const appDevicesId = await this.insertAppDevice(device, app_id, app.appName, client);
                device.setID(appDevicesId);
            });
            app.configuration.servers.forEach(async server => {
                const appServersId = await this.insertAppServer(server, app_id, app.appName, client);
                server.setID(appServersId);
            });
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw new DatabaseError('Error while adding a new app : ', err);
        } finally {
            client.release();
        }
    }

    /**
     * add a new app into the app table.
     * @param {App} app - the app to add into the DB.
     * @param {PoolClient} client - postgres pool client. 
     * @returns The uid of the added app.
     */
    async insertApp(app, client){
        const queryInsertApp = `
            INSERT INTO app (name, path, description, type)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;
        const res = await client.query(queryInsertApp, [app.appName, app.appPath, app.appDescription, app.appType]);
        if (res.rows.length > 0) {
            logger.info(`New app added : ${app.appName}`)
            return res.rows[0].id;
        }else{
            throw new DatabaseError(`No line inserted with appName = ${app.appName}`);
        }
    }

    /**
     * Add a new module into the module table
     * @param {Module} module - module to add. 
     * @param {String} app_id - app uid.
     * @param {String} appName - App name.
     * @param {PoolClient} client - Postgres pool client.
     * @returns The uid of the added module.
     */
    async insertModule(module, app_id, appName, client){
        const queryInsertModule = `
            INSERT INTO module (app_id, name, description, type)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;
        const res = await client.query(queryInsertModule, [app_id, module.moduleName, module.moduleDescription, module.moduleType]);

        if (res.rows.length > 0) {
            logger.info(`New module added for app : ${appName}`)
            return res.rows[0].id;
        }else{
            throw new DatabaseError(`No line inserted for module (${module.moduleName}) with appName = ${appName}`);
        }
    }

    /**
     * Add a new device configuration into the device table.
     * @param {Device} device - The device to add.
     * @param {String} app_id - App uid.
     * @param {String} appName - App name.
     * @param {PoolClient} client - Postgres pool client.
     * @returns The uid of the added device. 
     */
    async insertAppDevice(device, app_id, appName, client){
        const queryInsertDevice = `
            INSERT INTO appDevice (app_id, name, deviceUID, description, type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `
        const res = await client.query(queryInsertDevice, [app_id, device.name, device.deviceUID, device.description, device.type]);

        if (res.rows.length > 0) {
            logger.info(`New device configuration added for app : ${appName}`)
            return res.rows[0].id;
        }else{
            throw new DatabaseError(`No line inserted for device (${device.name}) with appName = ${appName}`);
        }
    }

    /**
     * Add a new server configuration into the server table.
     * @param {Server} device - The server to add.
     * @param {String} app_id - App uid.
     * @param {String} appName - App name.
     * @param {PoolClient} client - Postgres pool client.
     * @returns The uid of the added server.

     */
    async insertAppServer(server, app_id, appName, client){
        const queryInsertServer = `
            INSERT INTO appServer (app_id, name, host, port, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `
        const res = await client.query(queryInsertServer, [app_id, server.name, server.host, server.port, server.description]);

        if (res.rows.length > 0) {
            logger.info(`New server configuration added for app : ${appName}`)
            return res.rows[0].id;
        }else{
            throw new DatabaseError(`No line inserted for server (${server.name}) with appName = ${appName}`);
        }
    }

    /**
     * Check if a given app already exist in the db.
     * @param {String} appName - The app name.
     * @param {String} appPath - the app path.
     * @returns True if the app exist
     */
    async appExist(appName, appPath){
        try {
            const query = 
            `
                SELECT EXISTS (
                    SELECT 1 FROM app
                    WHERE name = $1 AND path = $2
                ) AS "found"`;
            const { rows } = await db.pool.query(query, [appName, appPath]);

            return rows.length > 0 && rows[0].found;
        } catch (err) {
            throw new DatabaseError(`Error while selecting an app : ${appName}`, err);
        }
    }

    /**
     * Gets the UID of an app by its name.
     * @param {App} app - The name of the app.
     * @returns The app UID if found, or null if not found.
     */
    async getAppByName(appName) {
        try {
            const queryText = `
            SELECT id, name, path, type, description
            FROM app
            WHERE name = $1
            LIMIT 1
            `;
            const { rows } = await db.pool.query(queryText, [appName]);
            if (rows.length > 0) {
                return new App(rows[0].path, rows[0].id, rows[0].name, rows[0].description, rows[0].type);
            } else {
                throw new DatabaseError(`Error : No App found with following appname : ${appName}`);
            }
        } catch (err) {
            throw new DatabaseError(`Error : while trying to retrieve an App with following appname : ${appName}`, err.message);
        }
    }

    /**
     * Delete an app from the db with its ID.
     * @param {String} appId - UID of App to delete
     */
    async deleteAppWithId(appId){
        try {
            const queryText = `
            DELETE FROM app
            WHERE id = $1;
            `;
            await db.pool.query(queryText, [appId]);
        } catch (err) {
            throw new DatabaseError(`Error : while trying to delete an App with following appId : ${appId}`, err.message);
        }
    }

    async getAllAppsName(){
        try {
            const queryText = `
            SELECT name 
            FROM app;
            `;
            const {rows} = await db.pool.query(queryText);
            if (rows.length > 0){
                var res = []
                rows.forEach((r) => res.push(r.name));
                return res;
            }
            return [];
        }catch(err){
            throw new DatabaseError(`Error : while trying to get all App name`, err.message);
        }
    }

}
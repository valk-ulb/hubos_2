import App from '../../model/App.js';
import Server from '../../model/Server.js';
import db from '../Database.js'
import DatabaseError from '../../error/DatabaseError.js';

/**
 * Server Data Access Object.
 * Used to interact with the server-related tables in the database.
 */
export default class ServerDao {
    
    /**
     * Return the list of server configurations listed to the app.
     * @param {App} app 
     * @returns {Array<Server>} A list of Server objects. 
     */
    async getServersFromApp(app){
        try {
            const queryText = `
            SELECT id, app_id, name, host, description
            FROM appServer
            WHERE app_id = $1
            `;
            const { rows } = await db.pool.query(queryText, [app.appId]);
            let servers = [];
            for (const row of rows){
                servers.push(new Server(row.name, row.host,row.description,row.id));
            }
            return servers;
        } catch (err) {
            throw new DatabaseError(`Error : while trying to retrieve servers with following appname : ${app.appName}`, err);
        }
    }
}
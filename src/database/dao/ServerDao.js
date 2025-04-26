import App from '../../model/App.js';
import Server from '../../model/Server.js';
import db from '../Database.js'
import DatabaseError from '../../error/DatabaseError.js';

export default class ServerDao {
    
    /**
     * Return the list of server configurations listed to the app.
     * @param {App} app 
     * @returns A list of Server objects. 
     */
    async getServersFromApp(app){
        try {
            const queryText = `
            SELECT id, app_id, name, host, port, description
            FROM appServer
            WHERE app_id = $1
            `;
            const { rows } = await db.pool.query(queryText, [app.appId]);
            let servers = [];
            rows.forEach(row => {
                servers.push(new Server(row.name, row.host, row.port,row.description,row.id))
            })
            return servers;
        } catch (err) {
            throw new DatabaseError(`Error : while trying to retrieve servers with following appname : ${app.appName}`, err);
        }
    }
}
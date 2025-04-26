import App from '../../model/App.js';
import Module from '../../model/Module.js';
import db from '../Database.js'
import DatabaseError from '../../error/DatabaseError.js';
export default class ModuleDao {
    
    /**
     * Return the list of modules listed to the app.
     * @param {App} app 
     * @returns A list of Module object. 
     */
    async getModulesFromApp(app){
        try {
            const queryText = `
            SELECT id, app_id, name, type, description
            FROM module
            WHERE app_id = $1
            `;
            const { rows } = await db.pool.query(queryText, [app.appId]);
            if (rows.length > 0) {
                let modules = [];
                rows.forEach(row => {
                    modules.push(new Module(row.name, row.type, row.description, row.id))
                })
                return modules;
            } else {
                throw new DatabaseError(`No Module found with following appname : ${app.appName}`);
            }
        } catch (err) {
            throw new DatabaseError(`Error : while trying to retrieve modules with following appname : ${app.appName}`, err);
        }
    }
}
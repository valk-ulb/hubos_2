import path from 'path';
import { isSafeName } from '../utils/SafetyChecker.js';
import logger from '../utils/logger.js'
import fs from 'fs/promises';  
import App from '../model/App.js';
import AppDao from '../database/dao/AppDao.js';
import ModuleDao from '../database/dao/ModuleDao.js';
import ServerDao from '../database/dao/ServerDao.js';
import DeviceDao from '../database/dao/DeviceDao.js';
import InconsistencyError from '../error/InconsistencyError.js';

import {signFileMD5, checkFileMD5} from '../utils/hashUtil.js';

import UnsafeNameError from '../error/UnsafeNameError.js';
export default class AppManager {

    /**
     * constructor of AppManager
     * @param {String} appsDir - Path to the apps directory
     */
    constructor(appsDir) { // default context value if not provided
        /** @type{String} */
        this.appsDirPath = appsDir;
        /** @type{Array<{name:String, app:App, appExist:Boolean}>} */
        this.apps = [];
    }

    /**
     * Extract all app from the apps/ folder.
     */
    async extractApps(){
        logger.info('Extracting all apps')
        const appsPath = await this.listAppDirectories(this.appsDirPath) 
        logger.info(`Founded apps path : ${JSON.stringify(appsPath)}`,true);
        for (let pair of appsPath){
            try{
                logger.info(`Extracting app : ${pair.path}`,true);
                await this.extractApp(pair.name, pair.path);
                logger.info(`App ${pair.path} extracted`,true);
            }catch(err){
                logger.error(`Error while extracting the app : `,true, err)
            }
        }
        logger.info('All apps extracted')
    }

    /**
     * Extract all app from the apps/ folder for deletion purpose.
     * appExist flag indicate if the app exist in the db or not.
     * @returns {Array<{name:String, app:App, appExist:Boolean}>} - Array of objects containing app name, app instance and appExist boolean.
     */
    async extractAppsForDelete(){
        logger.info('Extracting all apps from db')
        const appsPath = await this.listAppDirectories(this.appsDirPath) 
        logger.info(`Founded apps path : ${JSON.stringify(appsPath)}`,true);
        /** @type{Array<{name:String, app:App, appExist:Boolean}>} */
        let appsTemp = [];
        for (let pair of appsPath){
            try{
                if (await this.doesAppExist(pair.name, pair.path)){
                    let newApp = new App(pair.path);
                    logger.info(`Extracting app : ${pair.path}`,true);

                    newApp = await this.extractAppFromDB(pair.name, newApp);
                    logger.info(`App ${pair.path} extracted from db`,true);
                    appsTemp.push({'name':pair.name,'app': newApp, 'appExist':true});
                }
            }catch(err){
                logger.error(`Error while extracting the app : `,true, err)
            }
        }
        logger.info('All apps extracted')
        return appsTemp
    }

    /**
     * Extract the data from a given app.
     * if the app does not already exist in the DB, verify and extract the app.
     * Add the extracted app into an array of key-element triple with 
     * the name of the app, the App object, and appExist set at true if the app was already extracted and present in the db.   
     * {'name': <string>, 'app':<App>, 'appExist': <Boolean>}
     * @param {String} appName - The app name.
     * @param {String} appPath - The app path.
     */
    async extractApp(appName, appPath){
        let newApp = new App(appPath, appName=appName);
        let appExist = false;
        if (await this.doesAppExist(appName, appPath)){
            appExist = true;
            newApp = await this.extractAppFromDB(appName,newApp);
        }else{
            logger.info('No occurence of the app in the DB. Starting extraction')
            await newApp.checkApp(appName);
            await newApp.extractApp();
            newApp.extractTabacRules();
            newApp = await this.insertAppToDB(newApp);
            await this.updateAppWithRuleMD5(newApp, newApp.tabacFilePath)
            newApp.linkEntityReferences();
            newApp.getDecodedRules(process.env.MQTT_BROKER_THING_UID);
        }
        this.apps.push({'name':appName,'app': newApp, 'appExist':appExist});
    }
    

    /**
     * Get an app from the db using its appName.
     * and check if the tabac file has not been modified since the last execution of this app. 
     * @param {String} appName - name of the app.
     * @param {App} newApp - app object.
     * @returns {App} app object completed with the app data found in the db.
     * @throws {InconsistencyError} if the tabac file hash does not match the stored digest of the app tabac file.
     */
    async extractAppFromDB(appName, newApp){
        logger.info(`App already exist in the DB`,true);
        newApp = await this.getAppFromDB(appName);
        const digest = await this.getAppRuleDigestFromDB(appName);
        logger.info('Checking tabac file integrity')
        if (!checkFileMD5(newApp.tabacFilePath,digest)){
            throw new InconsistencyError(`Error: the content of the rules.json file of ${appName} has changed`)
        }
        else{
            newApp.extractTabacRules();
            newApp.linkEntityReferences();
            logger.info('Everything is ok')
        }
        return newApp
    }

    /**
     * Delete an app from the db.
     * @param {App} app - App to delete.
     * @throws {InconsistencyError} if the app does not exist in the apps directory. 
     */
    async deleteApp(app){
        const appDao = new AppDao();
        const appID = app.appId;
        if (!this.apps.some(entry => entry.app === app && entry.name === app.appName)){
            throw new InconsistencyError('Error: Impossible to delete not listed app.')
        }
        this.apps = this.apps.filter(entry => entry.app !== app && entry.name !== app.appName)
        await appDao.deleteAppWithId(appID);
    }

    /**
     * List all the apps directory inside the 'apps' folder.
     * @param {String} appsDirPath - the path to the 'apps' folder.
     * @throws {UnsafeNameError} if an app name contains unsafe characters.
     */
    async listAppDirectories(appsDirPath){
        let appsPath = [];
        try{
            logger.info("Listing all app directories.",true, appsDirPath)
            const entries = await fs.readdir(appsDirPath, { withFileTypes: true });
            logger.info(entries)
            for (const entry of entries){
                if (entry.isDirectory()){
                    logger.info(`Verifying apps directory : ${entry.name}.`,true)
                    if (isSafeName(entry.name)){
                        const fullDirPath = path.join(appsDirPath, entry.name);
                        appsPath.push({'name':entry.name, 'path':fullDirPath});    
                    }else{
                        throw new UnsafeNameError(`Warning : Apps name contains unsafe characters or directory traversal sequences.`)
                    }
                }
            }
            return appsPath;
        }catch(err){
            logger.error(`Error reading the folder ${appsDirPath}: `, err)
        }
    }

    /**
     * Insert the new app into the db 
     * @param {App} app - app to add.
     * @returns {App} - return the insterted app.
     * @throws {Error} if the insertion has failed
     */
    async insertAppToDB(app){
        logger.info('inserting app to db',true);
        const appDao = new AppDao();
        const res = await appDao.insertCompleteApp(app);
        if (res === null){
            throw new Error(`Error: impossible to insert this app into the db: ${app.appName}`)
        }
        return res;
    }

    /**
     * Update the tabac rule file digest of the app in the db.
     * @param {App} app - app to update. 
     * @param {String} ruleFilePath - Absolute path to the tabac rule file. 
     */
    async updateAppWithRuleMD5(app, ruleFilePath){
        const digest = await signFileMD5(ruleFilePath);
        const appDao = new AppDao();
        await appDao.updateAppRuleFileHash(app.appId,app.appName,digest);
    }

    /**
     * Get the corresponding app from the DB.
     * @param {String} appName - Name of the app to retrieve.
     * @returns {App} - retrieved app.
     */
    async getAppFromDB(appName){
        logger.info('Getting app from DB',true);
        const appDao = new AppDao();
        const moduleDao = new ModuleDao();
        const serverDao = new ServerDao();
        const deviceDao = new DeviceDao();
        const app = await appDao.getAppByName(appName);
        const modules = await moduleDao.getModulesFromApp(app);
        const servers = await serverDao.getServersFromApp(app);
        const devices = await deviceDao.getDevicesFromApp(app);
        app.configuration.setDevices(devices);
        app.configuration.setServers(servers);
        app.setManifestModules(modules);
        return app;
    }

    /**
     * get the stored tabac rule file digest of an app. 
     * @param {String} appName - name of the concerned app. 
     * @returns {String} - digest of the tabac rule file of the specified app.
     */
    async getAppRuleDigestFromDB(appName){
        logger.info('Getting stored rule file signature from DB')
        const appDao = new AppDao();
        const digest = await appDao.getRuleDigestByAppName(appName);
        return digest
    }
    
    /**
     * Verify if an app already exist in the db.
     * @param {String} appName - Name of the app.
     * @param {String} appPath - Path of the app.
     * @returns {Boolean} - True if the app is present and stored in the DB.
     */
    async doesAppExist(appName, appPath){
        const appDao = new AppDao();

        return await appDao.appExist(appName, appPath);
    } 

    /**
     * Get from the db, all modules UID. 
     * @returns {Array<String>} - Array of all modules UID.
     */
    async getAllModulesUID(){
        const moduleDao = new ModuleDao();
        return await moduleDao.getAllModulesUID();
    }
    
}
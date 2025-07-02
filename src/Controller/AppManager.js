import path from 'path';
import { isSafeName } from '../utils/SafetyChecker.js';
import logger from '../utils/logger.js'
import fs from 'fs/promises';  
import App from '../model/App.js';
import AppDao from '../database/dao/AppDao.js';
import ModuleDao from '../database/dao/ModuleDao.js';
import ServerDao from '../database/dao/ServerDao.js';
import DeviceDao from '../database/dao/DeviceDao.js';
import InconsistencyError from '../error/InconsistencyError';

import {signFileMD5, checkFileMD5} from '../utils/hashUtil.js';

import InconsistencyError from '../error/InconsistencyError.js'
import UnsafeNameError from '../error/UnsafeNameError.js';
export default class AppManager {

    /**
     * constructor of AppManager
     * @param {String} appsDir - Path to the apps directory
     */
    constructor(appsDir) { // default context value if not provided
        this.appsDirPath = appsDir;
        this.apps = [];
    }

    /**
     * Extract all app from the apps/ folder.
     */
    async extractApps(){
        const appsPath = await this.listAppDirectories(this.appsDirPath) 
        logger.info(`Founded apps path : ${JSON.stringify(appsPath)}`);
        appsPath.forEach(pair => {
            try{
                logger.info(`Extracting app : ${pair.path}`);
                this.extractApp(pair.name, pair.path);
                logger.info(`App ${pair.path} extracted`);
            }catch(err){
                logger.error(`Error while extracting the app : `, err)
            }
        })
    }

    /**
     * Extract the data from a given app.
     * @param {String} appName - The app name.
     * @param {String} appPath - The app path.
     */
    async extractApp(appName, appPath){
        let newApp = new App(appPath);
        if (await this.doesAppExist(appName, appPath)){
            newApp = await this.getAppFromDB(appName);
            digest = await this.getAppRuleDigestFromDB(appName);
            if (!checkFileMD5(newApp.tabacFilePath,digest)) throw new InconsistencyError(`Error: the content of the rules.json file of ${appName} has changed`)
        }else{
            await newApp.checkApp(appName);
            await newApp.extractApp();
            await newApp.extractTabacRules();
            await this.insertAppToDB(newApp);
            await this.updateAppWithRuleMD5(newApp, newApp.tabacFilePath)
        }
        this.apps.push({'name':appName,'app': newApp});
    }

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
     */
    async listAppDirectories(appsDirPath){
        let appsPath = [];
        try{
            logger.info("Listing all app directories.", appsDirPath)
            const entries = await fs.readdir(appsDirPath, { withFileTypes: true });
            logger.info(entries)
            for (const entry of entries){
                if (entry.isDirectory()){
                    logger.info(`Verifying apps directory : ${entry.name}.`)
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
     */
    async insertAppToDB(app){
        const appDao = new AppDao();
        await appDao.insertCompleteApp(app);
    }

    async updateAppWithRuleMD5(app, ruleFilePath){
        const digest = await signFileMD5(ruleFilePath);
        const appDao = new AppDao();
        await appDao.updateAppRuleFileHash(app.appId,app.appName,digest);
    }

    /**
     * Get the corresponding app from a given app name.
     * @param {String} appName - Name of the app to retrieve.
     * @returns App
     */
    async getAppFromDB(appName){
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

    async getAppRuleDigestFromDB(appName){
        const appDao = new AppDao();
        const digest = await appDao.getRuleDigestByAppName(appName);
        return digest
    }
    
    /**
     * Verify if an app already exist in the db.
     * @param {String} appName - Name of the app.
     * @param {String} appPath - Path of the app.
     * @returns 
     */
    async doesAppExist(appName, appPath){
        const appDao = new AppDao();

        return await appDao.appExist(appName, appPath);
    } 

    async getAllModulesUID(){
        const moduleDao = new ModuleDao();
        return await moduleDao.getAllModulesUID();
    }
    
}
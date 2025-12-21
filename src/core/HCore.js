import path, { join } from 'path';
import logger from '../utils/logger.js'
import AppManager from '../Controller/AppManager.js';
import SandboxManager from '../Controller/SandboxManager.js';
import App from '../model/App.js';
import Module from '../model/Module.js';
import db from '../database/Database.js';
import OpenhabAPI from '../openhabAPI/OpenhabAPI.js';
import MqttAdmin from '../mqtt/MqttAdmin.js'
import * as dotenv from "dotenv";
import { createJWT } from '../utils/jwtUtil.js';
import { getHubosTopicFromModule, getItemNameFromModule, getRoleFromModule, replaceDashesWithUnderscores, getRuleUID, getModuleAuthTopic } from '../utils/NameUtil.js';
import permissionManager from '../Controller/PermissionManager.js';
import hproxy from './HProxy.js';
import hserver from './Hserver.js';
dotenv.config({});

/**
 * Class in charge of the core functionalities of HubOS.
 */
export default class HCore{

    /**
     * Constructor of HCore
     * Instantiates the AppManager, SandboxManager, OpenhabAPI and MqttAdmin.
     * @param {String} rootDirname - The root directory name where HubOS is running. 
     */
    constructor(rootDirname){
        this.rootDirname = rootDirname
        this.appDirPath = path.join(rootDirname, './apps/');
        logger.info(`apps directory path : ${this.appDirPath}`,true);
        this.appManager = new AppManager(this.appDirPath);
        this.sandboxManager = new SandboxManager();
        this.openhabAPI = new OpenhabAPI();
        this.mqttAdmin = new MqttAdmin();
    }

    /**
     * Configures and starts the proxy server.
     */
    async configureProxy(){
        logger.info('Configure proxy')
        hproxy.startProxy();
        hproxy.configureForwardProxy();
        logger.info('Proxy configured')
    }
    /**
     * Configures and starts the REST API server.
     */
    configureRestApi(){
        logger.info('Configure Rest api');
        hserver.setupRoutes();
        hserver.start();
    }

    /**
     * Connect to the MQTT admin client and subscribes to the admin topic.
     */
    async initMqtt(){
        await this.mqttAdmin.connect();
        await this.mqttAdmin.subscribeToAdminTopic();
    }

    /**
     * Extracts all the apps in 'src/apps/' using the AppManager.
     */
    async extractApps(){
        await this.appManager.extractApps();
    }

    /**
     * Extracts all the apps in 'src/apps/' in order to delete them from HubOS and the database.
     * @returns Array of objects containing app name, app instance and appExist boolean
     */
    async extractAppsForDelete(){
        return await this.appManager.extractAppsForDelete();
    }

    /**
     * gets all the apps managed by the AppManager.
     * @returns - An array of key-element triple with 
     * the name of the app, the App object, and appExist set at true if the app was already extracted and present in the db.
     * {appName}
     */
    getApps(){
        return this.appManager.apps;
    }

    /**
     * Reset HubOS and remove everything that was created and related to Apps and Modules.
     * - Remove all Docker Containers and Docker Images.
     * - Remove all the items, links, channels, and rules that was created by HubOS.
     * - Remove all MQTT roles and clients (openhabClient + hubOSClient incl.). 
     * - Drop all the tables on the DB. 
     * @param {String} databaseDir - Absolute Path of the directory containing the migration file of the DB.
     */
    async resetAll(databaseDir){
        await db.setupDatabase().catch(()=>{})
        await this.appManager.getAllModulesUID().then(async (modulesUID) => {
            await this.resetContainers(modulesUID);
        }).catch(()=>{})

        let appsTemp = await this.extractAppsForDelete().catch(() => {return;});
        for (let app of appsTemp){
            /**@type {App} */
            let temp = app.app;
            let appId = temp.appId;
            for (let module of temp.getModules()){
                const itemName = getItemNameFromModule(module.moduleId);
                await this.openhabAPI.removeLink(itemName).catch(() => {});
                await this.openhabAPI.removeItem(itemName).catch(() => {});
                await this.openhabAPI.removeTopicChannel(getItemNameFromModule(module.moduleId))
            }
            for (let tabacRule of temp.tabac.tabacRules.tabacRules){
                const uid = getRuleUID(replaceDashesWithUnderscores(appId),tabacRule.name);
                await this.openhabAPI.removeRule(uid).catch(() => {});
            }

        }
        // remove admin mqtt 
        await this.mqttAdmin.disableClient("hubosClient").catch(() => {});
        await this.mqttAdmin.deleteClient("hubosClient").catch(() => {});
        await this.mqttAdmin.deleteRole(`hubos`).catch(() => {});
        await this.mqttAdmin.disableClient("openhabClient").catch(() => {});
        await this.mqttAdmin.deleteClient("openhabClient").catch(() => {});
        await this.mqttAdmin.deleteRole(`openHab`).catch(() => {});

        // erase db tables
        await db.dropTables();
        //await db.setupDatabase().catch(()=>{});
        //await db.setupExtension().catch(()=>{});
        //await db.initDB(databaseDir).catch(()=>{});
    }

    /**
     * Function in charge to execute HubOS. 
     * If HubOS is run for the first time: 
     * - If some docker containers wasn't closed (maybe due to a crash), stop and destroy them.
     * - Setup the db, add the uuid extension, and init the DB (if not already done).
     * - Configure the proxy and the REST API server and run it. 
     * - Create the supervisor role and client (if not already done).
     * - Iterate over each app in /apps/ and: 
     *      - Validate the app structure. (if not already present in the DB)
     *      - Create for each module a mqtt role and client (if new app) 
     *      - Decode the rules.json and create all the items, links, channels, and rules and sent them to OpenHAB (if new app).
     *      - HubOS Subscribe to the modules MQTT topics.
     *      - For each modules, build the Docker Image and create the Docker Container.
     * @param {String} databaseDir - Absolute Path of the directory containing the migration file of the DB.
     */
    async run(databaseDir){
        try{
            const allModulesUID = await this.appManager.getAllModulesUID();
            for (const modulesUID of allModulesUID){
                await this.resetContainers(modulesUID).catch(() => {});
            }
        }catch(err){
            logger.error('Not necessary a real runtime error: ', true, err)
        }
        
        await db.setupDatabase().catch(()=>{})
        await db.setupExtension().catch(()=>{});
        await db.initDB(databaseDir).catch(()=>{});
        await this.configureProxy();
        this.configureRestApi();

        await this.mqttAdmin.createSupervisorRole('hubos').catch(()=>{});
        await this.mqttAdmin.createSupervisorRole('openHab').catch(()=>{});
        await this.mqttAdmin.createClient('hubosClient','hubosClient','','hubos client',['hubos']).catch(()=>{})
        await this.mqttAdmin.createClient('openhabClient','openhabClient','','openHab client',['openHab']).catch(()=>{})
        await this.extractApps();
        console.log('-e-----')
        let modulesUID = [];
        for (let app of this.getApps()){
            if (!app.app.appExist){
                for (let module of app.app.getModules()){
                    logger.info(`mqtt configuration for module ${module.moduleId}`,true)
                    await this.mqttAdmin.createModuleRole(module.moduleId, getRoleFromModule(module.moduleId));
                    await this.mqttAdmin.createClient(module.moduleId, module.moduleId, '', `client module: ${module.moduleId}`,[getRoleFromModule(module.moduleId)]);

                    logger.info(`openhab configuration for module ${module.moduleId}`,true)
                    const topicItem = await this.openhabAPI.createTopicItem(getItemNameFromModule(module.moduleId),getItemNameFromModule(module.moduleId));
                    const topicChannel = await this.openhabAPI.createTopicChannel(getHubosTopicFromModule(module.moduleId), getItemNameFromModule(module.moduleId));
                    const linkItem = await this.openhabAPI.linkItemToChannel(getItemNameFromModule(module.moduleId))
                }
            
                let openhabRules = app.app.openhabRules;
                for (const openhabRule of openhabRules){
                    await this.openhabAPI.createRule(app.app.appName,app.app.appId,openhabRule.name,openhabRule.openhabRule.triggers,openhabRule.openhabRule.conditions,openhabRule.openhabRule.actions);
                }
            }
            for (let module of app.app.getModules()){
                await this.mqttAdmin.subscribeToAuthTopic(getModuleAuthTopic(module.moduleId)) 
            }
            for (let module of app.app.getModules()){
                modulesUID.push(module.moduleId);
                logger.info(`sanbox creation and run for module ${replaceDashesWithUnderscores(module.moduleId)}`,true);
                const tokens = createJWT(module.moduleId);
                const modulesPath = join(app.app.appPath, 'modules')
                const pack =  await this.sandboxManager.buildTarStream(join(modulesPath, module.moduleName),app.app.configPath, tokens)
                await this.sandboxManager.buildImageWithTar(pack, replaceDashesWithUnderscores(module.moduleId))
                let cont = await this.sandboxManager.createContainer(replaceDashesWithUnderscores(module.moduleId))
                this.sandboxManager.startContainer(cont);
                logger.info('sanbox creation and start is a success',true)
            }
            permissionManager.setModulesIds(modulesUID);
        }
        console.log('petit test')
    }

    /**
     * For each modules listed in modulesUID reset stop their docker container, remove them, and remove the related docker image.
     * @param {String} modulesUID List of module UIDs
     */
    async resetContainers(modulesUID){
        for (let moduleUID of modulesUID){
            logger.info(`removing module with uid : ${moduleUID} from system`,true)
            // stop + remove all container
            await this.sandboxManager.stopAndRemoveContainer(`${replaceDashesWithUnderscores(moduleUID)}:latest`).catch((err) => {logger.error(`error deleting container: `,true, err)});
            //await this.sandboxManager.removeImage(`${replaceDashesWithUnderscores(moduleUID)}:latest`).catch((err) => {logger.error(`error deleting image: `,true, err)});
        }
    }

}
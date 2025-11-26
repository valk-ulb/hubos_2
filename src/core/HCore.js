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
import { getHubosTopicFromModule, getItemNameFromModule, getRoleFromModule, replaceDashesWithUnderscores, replaceUnderscoresWithDashes, getRuleUID, getModuleAuthTopic } from '../utils/NameUtil.js';
import permissionManager from '../Controller/PermissionManager.js';
import hproxy from './HProxy.js';
import hserver from './Hserver.js';
dotenv.config({});


export default class HCore{

    constructor(rootDirname){
        this.rootDirname = rootDirname
        this.appDirPath = path.join(rootDirname, './apps/');
        logger.info(`apps directory path : ${this.appDirPath}`,true);
        this.appManager = new AppManager(this.appDirPath);
        this.sandboxManager = new SandboxManager();
        this.openhabAPI = new OpenhabAPI();
        this.mqttAdmin = new MqttAdmin();
    }

    async configureProxy(){
        logger.info('Configure proxy')
        hproxy.startProxy();
        hproxy.configureForwardProxy();
        logger.info('Proxy configured')
    }

    configureRestApi(){
        logger.info('Configure Rest api');
        hserver.setupRoutes();
        hserver.start();
    }

    async initMqtt(){
        await this.mqttAdmin.connect();
        await this.mqttAdmin.subscribeToAdminTopic();
    }

    async extractApps(){
        await this.appManager.extractApps();
    }

    async extractAppsForDelete(){
        return await this.appManager.extractAppsForDelete();
    }

    /**
     * 
     * @returns {Array<any>}  
     */
    getApps(){
        return this.appManager.apps;
    }

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
                logger.info("Tokens created")
                const modulesPath = join(app.app.appPath, 'modules')
                logger.info("Build tar stream")
                const safeImageName = replaceUnderscoresWithDashes(module.moduleId).toLowerCase();
                const pack =  await this.sandboxManager.buildTarStream(join(modulesPath, module.moduleName),app.app.configPath, tokens)
                logger.info("Build image with tar")
                await this.sandboxManager.buildImageWithTar(pack, safeImageName)
                logger.info("Image built")
                let cont = await this.sandboxManager.createContainer(safeImageName)
                logger.info("Container created")
                this.sandboxManager.startContainer(cont);
                logger.info('sanbox creation and start is a success',true)
            }
            permissionManager.setModulesIds(modulesUID);
        }
        console.log('petit test')
    }

    async resetContainers(modulesUID){
        for (let moduleUID of modulesUID){
            logger.info(`removing module with uid : ${moduleUID} from system`,true)
            // stop + remove all container
            await this.sandboxManager.stopAndRemoveContainer(`${replaceDashesWithUnderscores(moduleUID)}:latest`).catch((err) => {logger.error(`error deleting container: `,true, err)});
            //await this.sandboxManager.removeImage(`${replaceDashesWithUnderscores(moduleUID)}:latest`).catch((err) => {logger.error(`error deleting image: `,true, err)});
        }
    }

}
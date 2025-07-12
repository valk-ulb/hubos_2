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
import { getHubosTopicFromModule, getItemNameFromModule, getRoleFromModule, replaceDashesWithUnderscores, getRuleUID } from '../utils/NameUtil.js';
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

    async initMqtt(){
        await this.mqttAdmin.connect();
        await this.mqttAdmin.subscribeToAdminTopic();
    }

    async extractApps(){
        await this.appManager.extractApps();
    }

    async extractAppsForDelete(){
        await this.appManager.extractAppsForDelete();
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
            modulesUID.forEach(async (moduleUID) => {
                logger.info(`removing module with uid : ${modulesUID} from system`,true)
                // stop + remove all container
                await this.sandboxManager.stopAndRemoveContainer(`${replaceDashesWithUnderscores(moduleUID)}:latest`).catch(() => {});
                await this.sandboxManager.removeImage(`${replaceDashesWithUnderscores(moduleUID)}:latest`).catch(() => {});
                await this.sandboxManager.stopAndRemoveContainer(`${replaceDashesWithUnderscores(moduleUID)}`).catch(() => {});
                await this.sandboxManager.removeImage(`${replaceDashesWithUnderscores(moduleUID)}`).catch(() => {});
                // remove client mqtt
                await this.mqttAdmin.disableClient(moduleUID).catch(() => {});
                await this.mqttAdmin.deleteClient(moduleUID).catch(() => {});
                await this.mqttAdmin.deleteRole(`role-${moduleUID}`).catch(() => {});
            })
        })
        .catch(()=>{});

        await this.extractAppsForDelete();
        for (let app of this.getApps()){
            /**@type {App} */
            let temp = app.app;
            let appId = temp.appId;
            for (let module of temp.getModules()){
                const itemName = getItemNameFromModule(module.moduleId);
                this.openhabAPI.removeItem(itemName);
                this.openhabAPI.removeLink(itemName);
            }
            for (let tabacRule of temp.tabac.tabacRules.tabacRules){
                const uid = getRuleUID(replaceDashesWithUnderscores(appId),tabacRule.name);
                this.openhabAPI.removeRule(uid);
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
        await db.dropTables().catch(()=>{});
        //await db.setupDatabase().catch(()=>{});
        //await db.setupExtension().catch(()=>{});
        //await db.initDB(databaseDir).catch(()=>{});
    }

    async run(databaseDir){
        await db.setupDatabase().catch(()=>{})
        await db.setupExtension().catch(()=>{});
        await db.initDB(databaseDir).catch(()=>{});

        await this.mqttAdmin.createSupervisorRole('hubos').catch(()=>{});
        await this.mqttAdmin.createSupervisorRole('openHab').catch(()=>{});
        await this.mqttAdmin.createClient('hubosClient','hubosClient','','hubos client',['hubos']).catch(()=>{})
        await this.mqttAdmin.createClient('openhabClient','openhabClient','','openHab client',['openHab']).catch(()=>{})
        const brokerThing = await this.openhabAPI.getBrokerThing();
        await this.extractApps();
        for (let app of this.getApps()){
            for (let module of app.app.getModules()){
                logger.info(`mqtt configuration for module ${module.moduleId}`,true)
                await this.mqttAdmin.createModuleRole(module.moduleId, getRoleFromModule(module.moduleId));
                await this.mqttAdmin.createClient(module.moduleId, module.moduleId, module.moduleId, `client module: ${module.moduleId}`,[getRoleFromModule(module.moduleId)]);

                logger.info(`openhab configuration for module ${module.moduleId}`,true)
                const topicItem = await this.openhabAPI.createTopicItem(getItemNameFromModule(module.moduleId),getItemNameFromModule(module.moduleId));
                const topicChannel = await this.openhabAPI.createTopicChannel(getHubosTopicFromModule(module.moduleId), getItemNameFromModule(module.moduleId));
                const linkItem = await this.openhabAPI.linkItemToChannel(getItemNameFromModule(module.moduleId))
                
            }
            if (!app.app.appExist){
                let openhabRules = app.app.openhabRules;
                for (const openhabRule of openhabRules){
                    await this.openhabAPI.createRule(app.app.appName,app.app.appId,openhabRule.name,openhabRule.openhabRule.triggers,openhabRule.openhabRule.conditions,openhabRule.openhabRule.actions);
                }
            }

            for (let module of app.app.getModules()){
                logger.info(`sanbox creation and run for module ${replaceDashesWithUnderscores(module.moduleId)}`,true);
                const tokens = createJWT(module.moduleId);
                const modulesPath = join(app.app.appPath, 'modules')
                const pack = await this.sandboxManager.buildTarStream(join(modulesPath, module.moduleName),app.app.configPath, tokens)
                await this.sandboxManager.buildImageWithTar(pack, replaceDashesWithUnderscores(module.moduleId))
                let cont = await this.sandboxManager.createContainer(replaceDashesWithUnderscores(module.moduleId))
                this.sandboxManager.startContainer(cont);
                logger.info('sanbox creation and start is a success',true)
            }
            
        }
        console.log('petit test')
    }

    async sendOpenhabRule(){
        
    }

    async resetContainers(){
        /**@type{App[]} */
        const apps = this.appManager.apps;
        for (const a of apps){
            /**@type{Module[]} */
            const modules = a.getModules();
            for (const module of modules){
                const modulePath = path.join(a.appPath, module.moduleName);
                const configPath = a.configPath;
                const tokens = createJWT(module.moduleId);
                const tarStream = this.sandboxManager.buildTarStream(modulePath,configPath)
                
                await this.sandboxManager.stopAndRemoveContainer(module.moduleId);
                await this.sandboxManager.removeImage(module.moduleId);
                

                await this.sandboxManager.buildImageWithTar(tarStream, module.moduleId);
                
                let container = await sandboxManager.createContainer(module.moduleId);
                sandboxManager.startContainer(container);
            }
        }
    }

    async stopAllContainers(){
        /**@type{App[]} */
        const apps = this.appManager.apps;
        for (const a of apps){
            /**@type{Module[]} */
            const modules = a.getModules();
            for (const module of modules){                
                await this.sandboxManager.stopContainer(module.moduleId);
            }
        }
    }

    async startAllContainers(){
        /**@type{App[]} */
        const apps = this.appManager.apps;
        for (const a of apps){
            /**@type{Module[]} */
            const modules = a.getModules();
            for (const module of modules){                
                let container = this.sandboxManager.getContainer(module.moduleId)
                sandboxManager.startContainer(container);
            }
        }
    }


}
import path from 'path';
import logger from '../utils/logger.js'
import AppManager from '../Controller/AppManager.js';
import SandboxManager from '../Controller/SandboxManager.js';
import App from '../model/App.js';
import Module from '../model/Module.js';
import {generateSecretKey, verifyJWT, createJWT} from '../utils/jwtUtil.js'
import AppDao from '../database/dao/AppDao.js';
import tar from 'tar-fs'


export default class HCore{

    constructor(rootDirname){
        this.rootDirname = rootDirname
        this.appDirPath = path.join(rootDirname, './apps/');
        logger.info(`apps directory path : ${this.appDirPath}`,true);
        this.appManager = new AppManager(this.appDirPath);
        this.sandboxManager = new SandboxManager()
    }

    async extractApps(){
        this.appManager.extractApps();
    }

    getApps(){
        return this.appManager.apps;
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
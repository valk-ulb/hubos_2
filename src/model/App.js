
import { checkAppModulesDirStructure, checkAppRootStructure, checkAppTabacDirStructure } from '../utils/StructuralChecker.js';
import IncorrectJsonStructureError from '../error/IncorrectJsonStructureError.js'
import AppConfiguration from './Configuration.js';
import Module from './Module.js';
import {join} from 'path'
import { isSafeName, isSafeText, isSafeType, isNumber, isSafeValue, isSafeContext, isSafeUIDWithEmptyStringAcceptance, isHostWithEmptyStringAcceptance, isNumberWithEmptyStringAcceptance, isSafeEvent, isSafeActionType, isSafeContextHost, isSafePassToValue } from '../utils/SafetyChecker.js';
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import { checkFormat } from '../utils/FormatChecker.js';
import TabacManager from '../tabacManager/TabacManager.js';
import { cp } from 'fs';
export default class App {

    /**
     * constructor of App.
     * @param {String} appPath - Path to the app directory.
     * @param {String} id - UID of the app.
     * @param {String} appName - Name of the app.
     * @param {String} appDescription - Description of the app.
     * @param {String} appType - Type of the app.
     */
    constructor(appPath, id=null, appName=null, appDescription=null, appType=null) {
        this.appId=id;      
        this.appPath = appPath;
        this.manifestPath = join(appPath, 'manifest.json');
        this.configPath = join(appPath, 'config.json');
        this.tabacPath = join(appPath, 'tabac-rules');
        this.tabacFilePath = join(this.tabacPath, 'rules.json');
        this.modulesPath = join(this.appPath, 'modules');
        this.tabac = null;
        this.appName = appName;
        this.appDescription = appDescription;
        this.appType = appType;
        this.configuration = new AppConfiguration(this.configPath);

        /** @type{Array<Module>} */
        this.manifestModules = [];

        this.openhabRules = [];
    }

    setConfiguration(configuration){
        this.configuration = configuration;
    }

    setManifestModules(manifestModules){
        this.manifestModules = manifestModules;
    }

    getModules(){
        return this.manifestModules;
    }

    async checkApp(appDirName){
        logger.info(`Checking app ${appDirName}`,true)
        await this.checkAppStructure(this.appPath, this.tabacPath);
        const modulesNames = await this.checkManifestFileStructure(this.manifestPath,appDirName);
        await checkAppModulesDirStructure(this.modulesPath, modulesNames);
        await this.checkAppTabacFileStructure(this.tabacFilePath);
        await this.checkConfigurationFileStructure(this.configPath);
        logger.info(`App Checked`,true)
    }

    async extractApp(){
        logger.info('extracting ddapp',true);
        const manifestFile = await fs.readFile(this.manifestPath);
        const manifestData = JSON.parse(manifestFile);

        this.appName = manifestData.name;
        this.appDescription = manifestData.description;
        this.appType = manifestData.type;
        console.log(this.appName+'-----'+this.appDescription+'----'+this.appType);
        await this.extractConfiguration(this.configPath);
        await this.extractModules(manifestData);
        logger.info('App extracted',true)
    }

    setID(appID){
        this.appId = appID;
    }

    /**
     * Extract all the devices and servers from the configuration file.
     * @param {String} configurationPath - Path to the config.json file.
     */
    async extractConfiguration(configurationPath){
        logger.info('extract configuration',true)
        const configurationFile = await fs.readFile(configurationPath);
        const configurationData = JSON.parse(configurationFile);

        this.configuration.extractDevices(configurationData);
        this.configuration.extractServers(configurationData);
        logger.info('Configuration extracted',true)
    }

    /**
     * Extract the modules informations of the app.
     * @param {any} manifestData - JSON parse of the manifest file.
     */
    async extractModules(manifestData){
        logger.info('Extract modules',true)
        await manifestData.modules.forEach(async module => {
            const tempModule = new Module(module.name,module.type,module.description);
            this.manifestModules.push(tempModule);
        });
        logger.info('Modules extracted',true)
    }

    extractTabacRules(){
        logger.info('Extracting tabac rules',true)
        this.tabac = new TabacManager(this.tabacFilePath, this.configuration);
        this.tabac.extractTabacRules();
        logger.info('Tabac rules extracted',true)
    }

    linkEntityReferences(){
        this.tabac.linkEntityReferences(this.configuration, this.manifestModules);
    }

    getDecodedRules(mqttBrokerUID){
        this.openhabRules = this.tabac.getDecodedRules(mqttBrokerUID);
    }

    /**
     * Check the file structure of the app. 
     * @param {String} appPath - Path of the root file.
     * @param {String} tabacPath - Path of the tabac directory
     */
    async checkAppStructure(appPath, tabacPath){
        logger.info('checking app structure',true)
        await checkAppRootStructure(appPath);
        await checkAppTabacDirStructure(tabacPath);
        logger.info('app structure checked',true)
    }

    /**
     * Check if the manifest file respect the correct format.
     * @param {String} manifestPath - Path to the manifest file.
     */
    async checkManifestFileStructure(manifestPath, appDirName){
        const data = await fs.readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(data);
        const modulesName = []
        if (
            manifest.name === appDirName &&
            checkFormat(manifest.name, isSafeName, IncorrectJsonStructureError, `The name field in the manifest file is incorrectly defined`, this.appPath) &&
            checkFormat(manifest.description, isSafeText, IncorrectJsonStructureError, `The description field in the manifest file is incorrectly defined`, this.appPath) &&
            checkFormat(manifest.type, isSafeType, IncorrectJsonStructureError, `The type field in the manifest file is incorrectly defined`, this.appPath) &&
            manifest.modules){
            manifest.modules.forEach( module => {
                if (
                    checkFormat(module.name, isSafeName, IncorrectJsonStructureError, `The module-name field in the manifest file is incorrectly defined`, this.appPath) &&
                    checkFormat(module.type, isSafeType, IncorrectJsonStructureError, `The module-type field in the manifest file is incorrectly defined`, this.appPath) &&
                    checkFormat(module.description, isSafeText, IncorrectJsonStructureError, `The module-description field in the manifest file is incorrectly defined`, this.appPath)
                ){
                        modulesName.push(module.name);
                }else{
                    throw new IncorrectJsonStructureError(`Error: the manifest file is incorrectly defined : ${this.appPath}`)
                }
                
            });
        }else{
            throw new IncorrectJsonStructureError(`Error: the manifest file is incorrectly defined : ${this.appPath}`)
        }
        logger.info('manifest file ok',true)
        return modulesName;
    }

    
    /**
     * Check if the tabac file respect the correct format.
     * @param {String} tabacFilePath - Path to the rules.json file.
     */
    async checkAppTabacFileStructure(tabacFilePath){
        const data = await fs.readFile(tabacFilePath, 'utf-8');
        const rules = JSON.parse(data);
        for (let rule of rules){
            if(
                checkFormat(rule.name, isSafeName, IncorrectJsonStructureError, `The name field in the tabac-rules file is incorrectly defined`, this.appPath)&&
                checkFormat(rule.description, isSafeText, IncorrectJsonStructureError, `The description field in the tabac-rules/${rule.name} file is incorrectly defined`, this.appPath) &&
                rule.when && 
                checkFormat(rule.when.event, isSafeEvent, IncorrectJsonStructureError, `The when-event field in the tabac-rules/${rule.name} file is incorrectly defined`, this.appPath) &&
                checkFormat(rule.when.context, isSafeContext, IncorrectJsonStructureError, `The when-context field in the tabac-rules/${rule.name} file is incorrectly defined`, this.appPath) &&
                rule.when.value){

                if(rule.when.event.toLowerCase() === 'system.time' && (rule.when.context !== 'GenericCronTrigger' || rule.when.context !== 'TimeOfDayTrigger' || rule.when.context !== 'DateTimeTriggerTimeOnly' || rule.when.context !== 'DateTimeTrigger')){
                    throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined -- see the system.time : ${this.appName}`)
                }

                if(Array.isArray(rule.when.value)){
                    rule.when.value.forEach(value => {
                        checkFormat(value, isSafeValue, IncorrectJsonStructureError, `The when-value field in the tabac-rules/${rule.name} file is incorrectly defined`, this.appPath)
                    })
                }else{
                    checkFormat(rule.when.value, isSafeValue, IncorrectJsonStructureError, `The when-value field in the tabac-rules/${rule.name} file is incorrectly defined`, this.appPath)
                }
                for (let condition of rule.condition){
                    this.checkCondition(condition, rule.name);
                }

                rule.then.forEach(then => {
                    this.checkThen(then, rule.name);
                })
            }else{
                throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined : ${this.appName}`)
            }
        };
        logger.info('Tabac file ok',true)
        return true
    }

    checkCondition(condition, rulename){
        if (
            checkFormat(condition.name, isSafeName, IncorrectJsonStructureError, `The condition field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath) &&
            checkFormat(condition.description, isSafeText, IncorrectJsonStructureError, `The condition field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath) &&
            condition.if &&
            checkFormat(condition.if.event, isSafeEvent, IncorrectJsonStructureError, `The condition field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath) &&
            checkFormat(condition.if.context, isSafeContext, IncorrectJsonStructureError, `The condition field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath)
        ){
            if(condition.if.event.toLowerCase() === 'system.time' && (condition.if.context.toLowerCase() !== 'genericcrontrigger' && condition.if.context.toLowerCase() !== 'timeofdaytrigger' && condition.if.context.toLowerCase() !== 'datetimetriggertimeonly' && condition.if.context.toLowerCase() !== 'datetimetrigger')){
                throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined -- see the system.time : ${this.appName}`)
            }
            if(Array.isArray(condition.if.value)){
                condition.if.value.forEach(value => {
                    checkFormat(value, isSafeValue, IncorrectJsonStructureError, `The condition field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath)
                })
            }else{
                checkFormat(condition.if.value, isSafeValue, IncorrectJsonStructureError, `The condition field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath)
            }
        }else{
            throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined check condition.if : ${this.appName}`)
        }
    }

    checkThen(then, rulename){
        if (
            checkFormat(then.access, isSafeName, IncorrectJsonStructureError, `The then field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath) &&
            checkFormat(then.type, isSafeActionType, IncorrectJsonStructureError, `The then field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath) &&
            then.context
        ){
            if (then.type.toLowerCase() !== 'flow' &&(!then.context.period || !checkFormat(then.context.period, isNumber, IncorrectJsonStructureError, `The then field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath))){
                throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined - check then.context.period : ${this.appName}`);
            }
            // else if (then.type.toLowerCase() === 'flow' && (!then.context.pass_to || !checkFormat(then.context.pass_to, isSafeName,IncorrectJsonStructureError,`The then field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath))){
            //     console.log(then)
            //     throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined - check then.context.pass_to : ${this.appName}`);
            // }
            if ((!then.context.concern || !checkFormat(then.context.concern, isSafeText,IncorrectJsonStructureError,`The then field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath))){
                throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined - check then.context.concern : ${this.appName}`)
            }
            if (then.access.toLowerCase() === 'networkclient' && then.context.host){
                if (Array.isArray(then.context.host)){
                    then.context.host.forEach(value => {
                        checkFormat(value, isSafeContextHost, IncorrectJsonStructureError, `The then field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath)
                    });
                }else if (then.context.host.toLowerCase() !== 'all'){
                    checkFormat(then.context.host, isSafeContextHost, IncorrectJsonStructureError, `The then field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath)
                }
            }
        
        }else{
            throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined - check then.context.host : ${this.appName}`)
        }
    }
    
    /**
     * Check if the configuration file respect the correct format.
     * @param {String} configPath - Path to the config file.
     */
    async checkConfigurationFileStructure(configPath){
        const data = await fs.readFile(configPath, 'utf8');
        const manifest = JSON.parse(data);
        if (manifest.configuration &&
            (manifest.configuration.devices ||
            manifest.configuration.servers)){
            for (const [deviceName, device] of Object.entries(manifest.configuration.devices)) {
                checkFormat(deviceName, isSafeName, IncorrectJsonStructureError, `The device-name field in the config file is incorrectly defined`, this.appPath)
                checkFormat(device.UID, isSafeUIDWithEmptyStringAcceptance, IncorrectJsonStructureError, `The device-UID field in the config file is incorrectly defined`, this.appPath)
                checkFormat(device.type, isSafeType, IncorrectJsonStructureError, `The device-type field in the config file is incorrectly defined`, this.appPath)
                checkFormat(device.description, isSafeText, IncorrectJsonStructureError, `The device-description field in the config file is incorrectly defined`, this.appPath)
            }
            for (const [serverName, server] of Object.entries(manifest.configuration.servers)) {
                checkFormat(serverName, isSafeName, IncorrectJsonStructureError, `The server-name field in the config file is incorrectly defined`, this.appPath)
                checkFormat(server.host, isHostWithEmptyStringAcceptance, IncorrectJsonStructureError, `The server-host field in the config file is incorrectly defined`, this.appPath)
                checkFormat(server.port, isNumberWithEmptyStringAcceptance, IncorrectJsonStructureError, `The server-port field in the config file is incorrectly defined`, this.appPath)
                checkFormat(server.description, isSafeText, IncorrectJsonStructureError, `The server-description field in the config file is incorrectly defined`, this.appPath)
            }
        }else{
            throw new IncorrectJsonStructureError(`Error: the config file is incorrectly defined : ${this.appPath}`)
        }
        logger.info('Configuration file ok', true)
    }

}
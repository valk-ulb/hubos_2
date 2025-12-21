
import { checkAppModulesDirStructure, checkAppRootStructure, checkAppTabacDirStructure } from '../utils/StructuralChecker.js';
import IncorrectJsonStructureError from '../error/IncorrectJsonStructureError.js'
import AppConfiguration from './Configuration.js';
import Module from './Module.js';
import {join} from 'path'
import { isSafeName, isSafeText, isSafeType, isNumber, isSafeValue, isSafeContext, isSafeUIDWithEmptyStringAcceptance, isHostWithEmptyStringAcceptance, isNumberWithEmptyStringAcceptance, isSafeEvent, isSafeActionType, isSafeContextHost, isSafePassToValue, isPeriod } from '../utils/SafetyChecker.js';
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import { checkFormat } from '../utils/FormatChecker.js';
import TabacManager from '../tabacManager/TabacManager.js';
import { cp } from 'fs';
import Configuration from './Configuration.js';

/**
 * Class representing an App.
 * Used to store all the information of an app.
 * Includes methods to extract and check the app structure and files.
 */
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

    /**
     * Set the configuration of the app.
     * Used when retrieving the app from the database.
     * @param {Configuration} configuration - configuration of the app. 
     */
    setConfiguration(configuration){
        this.configuration = configuration;
    }

    /**
     * Set the modules of the app.
     * Used when retrieving the app from the database.
     * @param {Array<Module>} manifestModules - modules of the app.
     */
    setManifestModules(manifestModules){
        this.manifestModules = manifestModules;
    }

    /**
     * Get the modules of the app.
     * @returns {Array<Module>} modules of the app as defined in the manifest.
     */
    getModules(){
        return this.manifestModules;
    }

    /**
     * Check the app structure and files.
     * Verifies that the app respect the correct structure and file formats.
     * if the app structure or files are incorrect, an error is thrown.
     * @param {String} appDirName - Name of the app directory. 
     */
    async checkApp(appDirName){
        logger.info(`Checking app ${appDirName}`,true)
        await this.checkAppStructure(this.appPath, this.tabacPath);
        const modulesNames = await this.checkManifestFileStructure(this.manifestPath,appDirName);
        await checkAppModulesDirStructure(this.modulesPath, modulesNames);
        await this.checkAppTabacFileStructure(this.tabacFilePath);
        await this.checkConfigurationFileStructure(this.configPath);
        logger.info(`App Checked`,true)
    }

    /**
     * Extract and read all the information of the app.
     * including manifest, configuration and modules.
     */
    async extractApp(){
        logger.info('extracting ',true);
        const manifestFile = await fs.readFile(this.manifestPath);
        const manifestData = JSON.parse(manifestFile);

        this.appName = manifestData.name;
        this.appDescription = manifestData.description;
        this.appType = manifestData.type;
        //console.log(this.appName+'-----'+this.appDescription+'----'+this.appType);
        await this.extractConfiguration(this.configPath);
        await this.extractModules(manifestData);
        logger.info('App extracted',true)
    }

    setID(appID){
        this.appId = appID;
    }

    /**
     * Extract all the devices and servers from the configuration file.
     * @param {String} configurationPath - Path to the config.json file of the app.
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
     * Extract all the modules informations from the manifest of the app.
     * @param {any} manifestData - JSON parse of the manifest file.
     */
    async extractModules(manifestData){
        logger.info('Extract modules',true)
        for (const module of manifestData.modules){
            const tempModule = new Module(module.name,module.type,module.description);
            this.manifestModules.push(tempModule);
        };
        logger.info('Modules extracted',true)
    }

    /**
     * Extract all the tabac rules from the rules.json file using the TabacManager.
     */
    extractTabacRules(){
        logger.info('Extracting tabac rules',true)
        this.tabac = new TabacManager(this.tabacFilePath, this.configuration);
        this.tabac.extractTabacRules();
        logger.info('Tabac rules extracted',true)
    }

    /**
     * Link the entity references in the tabac rules with the devices and servers defined in the configuration.
     */
    linkEntityReferences(){
        this.tabac.linkEntityReferences(this.configuration, this.manifestModules);
    }

    /**
     * Decode the tabac rules into openhab rules.
     * @param {String} mqttBrokerUID - UID of the MQTT broker to use in the openhab rules. 
     */
    getDecodedRules(mqttBrokerUID){
        this.openhabRules = this.tabac.getDecodedRules(mqttBrokerUID);
    }

    /**
     * Check the file structure of the app. 
     * Verifies that the root structure and the tabac directory structure are correct.
     * If the app structure or files are incorrect, an error is thrown.
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
     * Check if all the fields of the manifest file respect the correct format.
     * Check the correct definition of name, description, type, module.name, module.type and module.description fields.
     * Modules names are used to determine the modules directories location.
     * @param {String} manifestPath - Path to the manifest file.
     * @param {String} appDirName - Name of the app directory.
     * @returns {Array<String>} names of the modules defined in the manifest file.
     * @throws {IncorrectJsonStructureError} if the manifest file is incorrectly defined.
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
            for (let module of manifest.modules){
                if (
                    checkFormat(module.name, isSafeName, IncorrectJsonStructureError, `The module-name field in the manifest file is incorrectly defined`, this.appPath) &&
                    checkFormat(module.type, isSafeType, IncorrectJsonStructureError, `The module-type field in the manifest file is incorrectly defined`, this.appPath) &&
                    checkFormat(module.description, isSafeText, IncorrectJsonStructureError, `The module-description field in the manifest file is incorrectly defined`, this.appPath)
                ){
                        modulesName.push(module.name);
                }else{
                    throw new IncorrectJsonStructureError(`Error: the manifest file is incorrectly defined : ${this.appPath}`)
                }
                
            };
        }else{
            throw new IncorrectJsonStructureError(`Error: the manifest file is incorrectly defined : ${this.appPath}`)
        }
        logger.info('manifest file ok',true)
        return modulesName;
    }

    
    /**
     * Check if all the fields of the tabac file respect the correct format.
     * Verifies the correct definition of name, description, when-event, when-context, when-value, 
     * all conditions, and all then fields.
     * @param {String} tabacFilePath - Path to the rules.json file.
     * @returns {Boolean} true if the tabac file is correctly defined.
     * @throws {IncorrectJsonStructureError} if the tabac file is incorrectly defined.
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
                    for (const value of rule.when.value){
                        checkFormat(value, isSafeValue, IncorrectJsonStructureError, `The when-value field in the tabac-rules/${rule.name} file is incorrectly defined`, this.appPath)
                    }
                }else{
                    checkFormat(rule.when.value, isSafeValue, IncorrectJsonStructureError, `The when-value field in the tabac-rules/${rule.name} file is incorrectly defined`, this.appPath)
                }
                for (let condition of rule.condition){
                    this.checkCondition(condition, rule.name);
                }
                for (let then of rule.then){
                    this.checkThen(then, rule.name);
                }
            }else{
                throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined : ${this.appName}`)
            }
        };
        logger.info('Tabac file ok',true)
        return true
    }

    /**
     * Check if all the fields of a condition respect the correct format.
     * Verifies the correct definition of condition.name, condition.description, condition.if.event, condition.if.context, condition.if.value fields.
     * @param {any} condition - JSON object representing a condition of the tabac-rules file.
     * @param {String} rulename - name of the rule containing the condition.
     * @throws {IncorrectJsonStructureError} if the condition is incorrectly defined.
     */
    checkCondition(condition, rulename){
        if (
            checkFormat(condition.name, isSafeName, IncorrectJsonStructureError, `The condition field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath) &&
            checkFormat(condition.description, isSafeText, IncorrectJsonStructureError, `The condition field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath) &&
            condition.if &&
            checkFormat(condition.if.event, isSafeEvent, IncorrectJsonStructureError, `The condition field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath) &&
            checkFormat(condition.if.context, isSafeContext, IncorrectJsonStructureError, `The condition field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath)
        ){
            if(condition.if.event.toLowerCase() === 'system.time' && !(condition.if.context.toLowerCase() === 'genericcrontrigger' || condition.if.context.toLowerCase() === 'timeofdaytrigger' || condition.if.context.toLowerCase() === 'datetimetriggertimeonly' || condition.if.context.toLowerCase() === 'datetimetrigger')){
                throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined -- see the system.time : ${this.appName} ---- ${condition.if.event.toLowerCase() === 'system.time'} --- ${!(condition.if.context.toLowerCase() === 'genericcrontrigger' || condition.if.context.toLowerCase() === 'timeofdaytrigger' || condition.if.context.toLowerCase() === 'datetimetriggertimeonly' || condition.if.context.toLowerCase() === 'datetimetrigger')} ----- ${condition.if.context.toLowerCase()}`)
            }
            if(Array.isArray(condition.if.value)){
                for (let value of condition.if.value){
                    checkFormat(value, isSafeValue, IncorrectJsonStructureError, `The condition field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath)
                }
            }else{
                checkFormat(condition.if.value, isSafeValue, IncorrectJsonStructureError, `The condition field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath)
            }
        }else{
            throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined check condition.if : ${this.appName}`)
        }
    }

    /**
     * Check if all the fields of a then respect the correct format.
     * The "then" segment represents the actions to be executed when the "when" and "condition" segments are satisfied.
     * Verifies the correct definition of then.access, then.type, then.context, then.context.concern, 
     * and (then.context.host or then.context.pass_to or then.context.period) fields.
     * @param {any} then - JSON object representing a "then" action of the tabac-rules file.
     * @param {String} rulename - name of the rule containing the "then" action.
     * @throws {IncorrectJsonStructureError} if the "then" action is incorrectly defined.
     */
    checkThen(then, rulename){
        if (
            checkFormat(then.access, isSafeName, IncorrectJsonStructureError, `The then field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath) &&
            checkFormat(then.type, isSafeActionType, IncorrectJsonStructureError, `The then field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath) &&
            then.context
        ){
            if (then.type.toLowerCase() !== 'flow' &&
                (!then.context.period || !checkFormat(then.context.period, isPeriod, IncorrectJsonStructureError, `The then field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath))){
                    throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined - check then.context.period - ${then.context.period} : ${this.appName}`);
            }
            // else if (then.type.toLowerCase() === 'flow' && (!then.context.pass_to || !checkFormat(then.context.pass_to, isSafeName,IncorrectJsonStructureError,`The then field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath))){
            //     console.log(then)
            //     throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined - check then.context.pass_to : ${this.appName}`);
            // }
            if ((!then.context.concern || 
                !checkFormat(then.context.concern, isSafeName,IncorrectJsonStructureError,`The then field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath))
            ){
                throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined - check then.context.concern : ${this.appName}`)
            }
            if (then.access.toLowerCase() === 'networkclient' && then.context.host){
                if (Array.isArray(then.context.host)){
                    for (let value of then.context.host){
                        checkFormat(value, isSafeContextHost, IncorrectJsonStructureError, `The then/host field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath)
                    };
                }else if (then.context.host.toLowerCase() !== 'all'){
                    checkFormat(then.context.host, isSafeContextHost, IncorrectJsonStructureError, `The then field in the tabac-rules/${rulename} file is incorrectly defined`, this.appPath)
                }
            }
        
        }else{
            throw new IncorrectJsonStructureError(`Error: the tabac-rules file is incorrectly defined - check then.context.host : ${this.appName}`)
        }
    }
    
    /**
     * Check if all the fields of the configuration file respect the correct format.
     * Verifies the correct definition of device names, UIDs, types and descriptions.
     * Verifies the correct definition of server names, hosts and descriptions.
     * @param {String} configPath - Path to the config file.
     * @throws {IncorrectJsonStructureError} if the configuration file is incorrectly defined.
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
                //checkFormat(server.port, isNumberWithEmptyStringAcceptance, IncorrectJsonStructureError, `The server-port field in the config file is incorrectly defined`, this.appPath)
                checkFormat(server.description, isSafeText, IncorrectJsonStructureError, `The server-description field in the config file is incorrectly defined`, this.appPath)
            }
        }else{
            throw new IncorrectJsonStructureError(`Error: the config file is incorrectly defined : ${this.appPath}`)
        }
        logger.info('Configuration file ok', true)
    }

}
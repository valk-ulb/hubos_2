import Configuration from '../model/Configuration.js';
import TabacRules from './TabacRules.js'
import Module from '../model/Module.js';
/**
 * Class representing the TABAC manager of an app.
 * This class handle the extraction, linking and decoding of TABAC rules defined in the tabac rules file.
 * It uses the TabacRules class to manage the collection of TABAC rules.
 */
export default class TabacManager {
    /**
     * Constructor of the TabacManager class.
     * @param {String} tabacRulePath - Absolute path to the tabac rules.json file. 
     */
    constructor(tabacRulePath) { // default context value if not provided
        this.tabacRules = new TabacRules(tabacRulePath);
    }

    /**
     * Extract the tabac rules and their components of an app.
     * @param {Configuration} configuration - the configuration containing the servers and devices definitions.
     * @param {Array<Module>} modules - the array of modules of this app.
     */
    extractTabacRules(){
        this.tabacRules.extractTabacRules();
    }

    /**
     * Link the entity references (servers, devices, and modules) used in the TabacRules to their actual references from the configuration.
     * @param {Configuration} configuration - the configuration containing the servers and devices definitions.
     * @param {Array<Module>} modules - the array of modules of this app.
     */
    linkEntityReferences(configuration, modules){
        this.tabacRules.linkEntityReferences(configuration, modules);
    }

    /**
     * Decode all the TabacRules into OpenHAB rules accepted by the OpenHAB API.
     * @param {String} mqttBrokerUID - the UID of the MQTT broker used for mqtt publish.
     * @returns JSON object of the decoded OpenHAB rules.
     */
    getDecodedRules(mqttBrokerUID){
        this.tabacRules.decodeRules(mqttBrokerUID);
        return this.tabacRules.openhabRules;
    }

}
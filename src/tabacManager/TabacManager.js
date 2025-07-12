import Configuration from '../model/Configuration.js';
import TabacRules from './TabacRules.js'
import Module from '../model/Module.js';
export default class TabacManager {
    // CHANGED (ANY TO ANY or X TO Y) - UPDATED - CONTAINS - CONTAINS ANY - EQUALS - HIGHER THAN - HIGHER OR EQUALS THAN - LOWER THAN - LOWER OR EQUAL THAN
    constructor(tabacRulePath) { // default context value if not provided
        this.tabacRules = new TabacRules(tabacRulePath);
    }

    /**
     * Extract the tabac rules of an app.
     * @param {Configuration} configuration 
     * @param {Array<Module>} modules 
     */
    extractTabacRules(){
        this.tabacRules.extractTabacRules();
    }

    linkEntityReferences(configuration, modules){
        this.tabacRules.linkEntityReferences(configuration, modules);
    }

    /**
     * 
     * @param {String} mqttBrokerUID 
     * @returns {TabacRules}
     */
    getDecodedRules(mqttBrokerUID){
        this.tabacRules.decodeRules(mqttBrokerUID);
        return this.tabacRules.openhabRules;
    }

}
import path from 'node:path'
import fs from 'fs'  

import TabacRule from './TabacRule.js';
import Configuration from '../model/Configuration.js';
import Module from '../model/Module.js';

/**
 * Class representing a collection of TABAC rules.
 * This class handle the extraction, linking and decoding of TABAC rules defined in the tabac rules file.
 */
export default class TabacRules {

    /**
     * Constructor of the TabacRules class.
     * @param {String} tabacRulePath - the path to the tabac rules.json file. 
     */
    constructor(tabacRulePath) { // default context value if not provided
        /** @type{Array<TabacRule>} */
        this.tabacRules = [];
        const rulesFilePath = tabacRulePath;
        const rulesFile = fs.readFileSync(rulesFilePath);
        this.appTabacRules = JSON.parse(rulesFile);
        this.openhabRules = [];
    }

    /**
     * Extract the TABAC rules from the appTabacRules JSON object and create TabacRule objects.
     */
    extractTabacRules(){
        for (const rule of this.appTabacRules){
            this.tabacRules.push(new TabacRule(rule['name'], rule['when'],rule['condition'], rule['then']));
        };
    }

    /**
     * Link the entity references (servers, devices, and modules) used in the TabacRules to their actual references from the configuration.
     * @param {Configuration} configuration - the configuration containing the servers and devices definitions.
     * @param {Array<Module>} modules - the array of modules of this app.
     */
    linkEntityReferences(configuration, modules){
        for (let tabacRule of this.tabacRules){
            console.log(`linking : ${tabacRule.name}`)
            tabacRule.linkEntityReferences(configuration, modules);
        }
    }

    /**
     * Decode all the TabacRules into OpenHAB rules accepted by the OpenHAB API.
     * @param {String} mqttBrokerUID - the UID of the MQTT broker used for mqtt publish.
     */
    decodeRules(mqttBrokerUID){
        for (let tabacRule of this.tabacRules){
            this.openhabRules.push(tabacRule.decode(mqttBrokerUID));
        }
    }
}
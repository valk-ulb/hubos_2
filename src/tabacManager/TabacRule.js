import TabacTrigger from './TabacTrigger.js'
import TabacAction from './TabacAction.js'
import { type } from 'node:os';
import TabacError from '../error/TabacError.js';
import Module from '../model/Module.js';
import { getModuleAuthTopic } from '../utils/NameUtil.js';
import Configuration from '../model/Configuration.js';

/**
 * Class representing a TABAC rule.
 * A TABAC rule is composed of a trigger, an array of conditions and an array of actions.
 * The rule is decoded into an OpenHAB rule accepted by the OpenHAB API and that can be executed by the OpenHAB rule engine.
 */
export default class TabacRule {

    /**
     * Constructor of the TabacRule class.
     * @param {String} name - the name of the rule. 
     * @param {any} trigger - JSON object representing the trigger segment of a HubOS rule.
     * @param {Array<any>} conditions - JSON object representing the conditions array of a HubOS rule.
     * @param {Array<any>} actions - JSON object representing the actions array of a HubOS rule.
     */
    constructor(name,trigger,conditions,actions) { // default context value if not provided
        this.name = name;
        this.position = 1;
        this.trigger = new TabacTrigger(trigger['event'],trigger['context'],trigger['value'],this.position);
        this.position = this.position+1;
        /** @type {Array<TabacAction>} */
        this.actions = []
        /** @type {Array<TabacTrigger>} */
        this.conditions = []
        for (const condition of conditions){
            this.conditions.push(new TabacTrigger(condition['if']['event'],condition['if']['context'], condition['if']['value'],this.position));
            this.position = this.position+1;
        };
        
        for(const action of actions){
            this.actions.push(new TabacAction(action['access'],action['type'],action['context'],this.position));
        };

        /** @type{{
         * configuration: {},
         * triggers: {
            * id:Number, 
            * configuration:{
                * cronExpression: String | undefined,
                * time: String | undefined,
                * timeOnly: Boolean | undefined,
                * itemName: String | undefined,
                * previousState: String | undefined,
                * state: String | undefined,
                * operator: String | undefined
                * }, 
            * type:String},
         * conditions: Array<{
            * id:Number, 
            * configuration:{
                * cronExpression: String | undefined,
                * time: String | undefined,
                * timeOnly: Boolean | undefined,
                * itemName: String | undefined,
                * previousState: String | undefined,
                * state: String | undefined,
                * operator: String | undefined
                * }, 
            * type:String}>,
         * actions: Array<{id:Number, 
            * configuration:{
                * topic: String | undefined,
                * value: {
                    * period: String,
                    * type: String,
                    * access: String,
                    * server: Array<String> | String | undefined,
                    * hostIp: Array<String> | String | undefined,
                    * deviceUID: String | undefined
                * },
                * config: String | undefined,
            * }, 
            * type:String}
            * }>
        }} */
        this.openhabRule = null;
    }

    /**
     * Decode this TabacRule into an OpenHAB rule object accepted by the OpenHAB API.
     * Decode the trigger, conditions and actions into OpenHAB rule segments.
     * this.openhabRule is set to the decoded OpenHAB rule object.
     * @param {String} mqttBrokerUID - the UID of the MQTT broker used for mqtt publish.
     * @returns {{name:String, openhabRule:{
         * configuration: {},
         * triggers: {
            * id:Number, 
            * configuration:{
                * cronExpression: String | undefined,
                * time: String | undefined,
                * timeOnly: Boolean | undefined,
                * itemName: String | undefined,
                * previousState: String | undefined,
                * state: String | undefined,
                * operator: String | undefined
                * }, 
            * type:String},
         * conditions: Array<{
            * id:Number, 
            * configuration:{
                * cronExpression: String | undefined,
                * time: String | undefined,
                * timeOnly: Boolean | undefined,
                * itemName: String | undefined,
                * previousState: String | undefined,
                * state: String | undefined,
                * operator: String | undefined
                * }, 
            * type:String}>,
         * actions: Array<{id:Number, 
            * configuration:{
                * topic: String | undefined,
                * value: {
                    * period: String,
                    * type: String,
                    * access: String,
                    * server: Array<String> | String | undefined,
                    * hostIp: Array<String> | String | undefined,
                    * deviceUID: String | undefined
                * },
                * config: String | undefined,
            * }, 
            * type:String}>
            * }}} a JSON object representing the rule name and the decoded OpenHAB rule. {name:String, openhabRule:Object}
     */
    decode(mqttBrokerUID){
        const triggers = this.decodeTriggers();
        const openhabActions = this.decodeActions(mqttBrokerUID);
        this.openhabRule = {
            configuration: {},
            triggers:[triggers.openhabTrigger],
        }
        if (Array.isArray(triggers.openhabConditions)){
            this.openhabRule.conditions = triggers.openhabConditions;
        }else{
            this.openhabRule.conditions = [triggers.openhabConditions];
        }

        if (Array.isArray(openhabActions)){
            this.openhabRule.actions = openhabActions;
        }else{
            this.openhabRule.actions = [openhabActions];
        }

        return {name:this.name,openhabRule:this.openhabRule};
    }

    /**
     * Decode the trigger and conditions of this TabacRule into OpenHAB rule trigger and condition segments accepted by the OpenHAB API.
     * @returns {{
        * openhabTrigger: {
            * id:Number, 
            * configuration:{
                * cronExpression: String | undefined,
                * time: String | undefined,
                * timeOnly: Boolean | undefined,
                * itemName: String | undefined,
                * previousState: String | undefined,
                * state: String | undefined,
                * operator: String | undefined
                * }, 
            * type:String},
        * openhabConditions: Array<{
            * id:Number, 
            * configuration:{
                * cronExpression: String | undefined,
                * time: String | undefined,
                * timeOnly: Boolean | undefined,
                * itemName: String | undefined,
                * previousState: String | undefined,
                * state: String | undefined,
                * operator: String | undefined
                * }, 
            * type:String }>}} a JSON object representing the decoded OpenHAB rule trigger and conditions. 
            */
    decodeTriggers(){
        const openhabTrigger = this.trigger.decodeTabac();
        let openhabConditions = []
        for (const condition of this.conditions){
            openhabConditions.push(condition.decodeTabac())
        }
        return {openhabTrigger:openhabTrigger, openhabConditions:openhabConditions};
    }

    /**
     * Decode the actions of this TabacRule into OpenHAB rule action segments accepted by the OpenHAB API.
     * @param {String} mqttBrokerUID - the UID of the MQTT broker used for mqtt publish. 
     * @returns a JSON object or an array of JSON objects representing the decoded OpenHAB rule actions.
     */
    decodeActions(mqttBrokerUID){
        let auths = []
        let modules = []
        let openhabActions = []

        for (let action of this.actions){
            if (action.isFlow){
                action.position = this.position;
                this.position = this.position+1;
                openhabActions.push(action.passTo(mqttBrokerUID))
            }else{
                let temp = action.getAuth();
                if (!modules.includes(action.concernModuleID)){
                    modules.push(action.concernModuleID)
                    auths.push([])
                }
                if (action.isMultipleHosts){
                    auths[modules.indexOf(action.concernModuleID)] = auths[modules.indexOf(action.concernModuleID)].concat(temp);
                }else{
                    auths[modules.indexOf(action.concernModuleID)].push(temp);
                }
            }
        }
        for (let i=0; i<modules.length;i++){
            let openhabAuths = this.publishMqttAccess(auths[i],getModuleAuthTopic(modules[i]) ,mqttBrokerUID, this.position);
            openhabAuths.configuration.value = JSON.stringify(openhabAuths.configuration.value);
            this.position = this.position+1;
            openhabActions.push(openhabAuths);  
        }
        return openhabActions;
    }

    /**
     * Create the object accepted by openhab rule engine that define the action to publish a message (value) to a topic (hubosAuthTopic) using the given mqttBrokerUID.
     * The message contain the auth object that will be sent to HubOS for permission granting.
     * Especially used for service, device, stream and system actions that require permission granting.
     * @param {String} message - the message to publish (the auth object). 
     * @param {String} hubosTopic - the topic to publish the message to (hubosAuthTopic).
     * @param {String} mqttBrokerUID - the UID of the MQTT broker used for mqtt publish.
     * @param {Number} position - the position of the action in the rule. 
     * @returns 
     */
    publishMqttAccess(message, hubosTopic, mqttBrokerUID, position){
        const res = 
            {
                id:position,
                configuration:{
                    topic: hubosTopic,
                    value: message,
                    config: mqttBrokerUID
                },
                type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
            }
        return res;
    }

    /**
     * Link the entity references (servers, devices, and modules) used in this TabacRule to their actual references from the configuration.
     * @param {Configuration} configuration - the configuration containing the servers and devices definitions.
     * @param {Array<Module>} modules - the array of modules of this app.
     * @throws {TabacError} if impossible to perform link between device or server references.
     * 
     */
    linkEntityReferences(configuration, modules){
        this.trigger.linkEntityReferences(configuration.devices, modules);
        for (let condition of this.conditions){
            try{
                condition.linkEntityReferences(configuration, modules);
            }catch (err){
                 throw new TabacError(`Error while configuring a tabac rule. Please see rule : ${this.name}`,err);
            }   
        }
        for (let action of this.actions){
             try{
               action.linkEntityReferences(configuration,modules); 
            }catch (err){
                throw new TabacError(`Error while configuring a tabac rule. Please see rule : ${this.name}`,err);
            }
        }
    }
}

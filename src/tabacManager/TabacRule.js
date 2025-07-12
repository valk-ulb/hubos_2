import TabacTrigger from './TabacTrigger.js'
import TabacAction from './TabacAction.js'
import { type } from 'node:os';
import TabacError from '../error/TabacError.js';
import Module from '../model/Module.js';
import { getModuleAuthTopic } from '../utils/NameUtil.js';
import Configuration from '../model/Configuration.js';
export default class TabacRule {
    // CHANGED (ANY TO ANY or X TO Y) - UPDATED - CONTAINS - CONTAINS ANY - EQUALS - HIGHER THAN - HIGHER OR EQUALS THAN - LOWER THAN - LOWER OR EQUAL THAN
    constructor(name,trigger,conditions,actions ) { // default context value if not provided
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
        this.openhabRule = null;
    }

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

    decodeTriggers(){
        const openhabTrigger = this.trigger.decodeTabac();
        let openhabConditions = []
        for (const condition of this.conditions){
            openhabConditions.push(condition.decodeTabac())
        }
        return {openhabTrigger:openhabTrigger, openhabConditions:openhabConditions};
    }

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
     * Link device and/or server reference with the correct thing uid/host.
     * @param {Configuration} configuration 
     * @param {Array<Module>} modules 
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

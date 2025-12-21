import TabacError from "../error/TabacError.js";
import Configuration from "../model/Configuration.js";
import Module from "../model/Module.js";
import { getHubosTopicFromModule, getModuleSupervTopic } from "../utils/NameUtil.js";
import TabacTrigger from "./TabacTrigger.js";

/**
 * Class representing a Tabac action.
 * actions are defined in <TABAC_RULE_NAME>/Then/#.
 * An action can be of type flow, service, device, stream or system.
 * This class handles the decoding of the action into an OpenHAB rule Action segment.
 * The majority of thoses OpenHAB Rule Actions will be used by openhab to communicate permissions grant with HubOS. 
 * A flow action is used to forward a value to a module and do not have to pass by HubOS.
 * Other actions (service, device, stream, system) are used to give permissions to a module and have to pass by HubOS.
 */
export default class TabacAction {
    /**
     * Constructor for TabacAction.
     * @param {String} access - Access reference (e.g., NetworkClient, pass_through, device name).
     * @param {String} type - type of the action (flow, service, device, stream, system).
     * @param {any} context - Context of the action (e.g., host for service, period, concern, value for flow).
     * @param {Number} position - Position of the action in the rule list.
     */
    constructor(access, type, context, position) { // default context value if not provided
        this.access = access;
        this.position = position;
        // Determine action type flags
        this.isFlow = type.toLowerCase() === 'flow';
        this.isService = type.toLowerCase() === 'service';
        this.isDevice = type.toLowerCase() === 'device';
        this.isStream = type.toLowerCase() === 'stream';
        this.isSystem = type.toLowerCase() === 'system';
        this.isNetworkClient = access.toLowerCase() === 'networkclient';
        this.type = type;
        this.context = context;
        this.period = 1;
        this.hosts = null;
        this.hostsIsAll = false;
        this.isMultipleHosts = false;
        this.linkedDeviceUID = '';
        this.hostIp = [];
        this.hostPort = [];
        // If the action is not a flow, set period from context (because flows do not have period).
        if (!this.isFlow){
            this.period = context['period'];
        }
        // If the action is a service and access is NetworkClient, set hosts from context.
        if (this.isService && this.isNetworkClient){
            this.hosts = context['host'];
            this.isMultipleHosts = Array.isArray(this.hosts);
            if (!this.isMultipleHosts){
                this.hostsIsAll =  this.hosts.toLowerCase() === 'all';
            }
        }
        // If the action is a flow, set value from context.
        if(this.isFlow){
            this.value = context.value;
        }

        this.concern = context.concern; // module name concerned by the action
        this.concernModuleID = null;
        this.openhabAction = null;
    }

    /**
     * Create the auth object for this action. 
     * The auth object is an object that OpenHAB rule system will send to HubOS to grant access to a module when the rule is triggered.
     * In other words, it encode this TabacAction into an json object containing the permission informations.
     * @returns {any} auth object(s) representing the json object for access attribution.
     */
    getAuth(){
        let auth = {
            period : this.context.period,
            type: this.type,
            access: this.access
        }
        if (this.isService && this.isNetworkClient){
            if (this.isMultipleHosts){
                let res = [];
                for (let i=0; i<this.hosts.length; i++){
                    res.push({
                        period : this.context.period,
                        type: this.type,
                        access: this.access,
                        server: this.hosts[i],
                        hostIp: this.hostIp[i],
                        //hostPort: this.hostPort[i]
                    })
                }
                return res;
            }else{
                auth.server = this.hosts;
                auth.hostIp = this.hostIp[0];
                //auth.hostPort = this.hostPort[0];
            }
        }else if (this.isDevice){
            auth.deviceUID = this.linkedDeviceUID;
        }
        return auth;

    }

    /**
     * Decode the action segment and create the rule object accepted by the API of OpenHAB. 
     * If the action is a flow (an action that passes data to a module), create the openhab Action that will send the pass to message hubosModuleTopic (see passTo function).
     * If the action is else (an action that gives access), create the openhab Action that will publish the MQTT message to the module supervision topic.
     * @param {String} mqttBrokerUID 
     * @param {String} hubosModuleTopic 
     * @param {TabacTrigger} trigger 
     */
    decode(mqttBrokerUID, hubosModuleTopic, trigger){
        if(this.isFlow){
            this.passTo(mqttBrokerUID);
        }else{
            const auth = {
                period: this.context.period,
                type: this.type,

            }
            this.publishMqttAccess(trigger.values, hubosModuleTopic, mqttBrokerUID);
        }
    }


    /**
     * Create the OpenHAB Rule Action that define the action to publish a message (value) to a topic (hubosTopic) using the given mqttBrokerUID.
     * The message contain the auth object that will be sent to HubOS for permission granting.
     * Especially used for service, device, stream and system actions that require permission granting.
     * @param {String} mqttBrokerUID - the mqtt broker uid to use for publishing the message.
     * @param {String} message - the message to publish (the auth object).
     * @param {String} hubosTopic - the topic to publish the message to .
     * @param {String} mqttBrokerUID - the mqtt broker uid to use for publishing the message.
     */
    publishMqttAccess(message, hubosTopic, mqttBrokerUID){
        this.openhabAction = 
            {
                id: this.position,
                configuration:{
                    topic: hubosTopic,
                    value: message,
                    config: mqttBrokerUID
                },
                type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
            }
       return this.openhabAction;
    }


    /**
     * Create the OpenHAB Rule Action that define the action to publish a message (value) to a topic (concerned module supervision topic) using the given mqttBrokerUID.
     * The message contain the value to forward to the module.
     * Especially used for flow/passThrough actions.
     * @param {String} mqttBrokerUID - the mqtt broker uid to use for publishing the message. 
     * @returns {Object} the openhab Rule Action object.
     */
    passTo(mqttBrokerUID){
        this.openhabAction = 
            {
                id: this.position,
                configuration:{
                    topic: getModuleSupervTopic(this.concernModuleID),
                    value: this.value,
                    config: mqttBrokerUID
                },
                type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
            }
        return this.openhabAction;
    }


    /**
     * Link device and/or server reference with the correct thing uid/host.
     * Will set linkedDeviceUID for device actions and hostIp for service actions.
     * @param {Configuration} configuration - the configuration containing devices and servers.
     * @param {Array<Module>} modules - the list of modules of the app to find the concerned module ID.
     * @throws {TabacError} if impossible to perform link between device or server references.
     */
    linkEntityReferences(configuration, modules){
        // If the action give access to a device, link the device name to its deviceUID listed in the configuration object.
        if(this.isDevice){
            let found = false;
            for (const device of configuration.devices){
                if (device.name === this.access){
                    this.linkedDeviceUID = device.deviceUID;
                    found=true;
                }
            }
            if (!found){
                throw new TabacError(`Error while linking the device reference (${this.access}) from a tabac rule [then section].`)
            }
        // If the action give access to a service and is NetworkClient, link the defined server name to its host listed in the configuration object.
        }else if ((this.isService || this.isStream) && !this.hostsIsAll){
            let found = false;
            if (this.isMultipleHosts){
                for (const host of this.hosts) {
                    for (const server of configuration.servers) {
                        if (server.name === host){
                            this.hostIp.push(server.host);
                            //this.hostPort.push(server.port);
                        }
                    }
                }
                // if one host has not been linked throw an error
                if (this.hostIp.length !== this.hosts.length){
                    throw new TabacError(`Error while linking the server references (${this.hosts}) from a tabac rule [then section] - Not all hosts found.`)
                }
            }else{
                for (const server of configuration.servers) {
                    if (server.name === this.hosts){
                        this.hostIp.push(server.host);
                        //this.hostPort.push(server.port);
                        found=true;
                    }
                }
                if(!found){
                    throw new TabacError(`Error while linking the server reference (${this.hosts}) from a tabac rule [then section] - Host not found.`)
                }
            }
        }
        // Link the concern module name to its module ID.
        for(const module of modules) {
            if (module.moduleName === this.concern){
                this.concernModuleID = module.moduleId;
                return;
            }
        }
        throw new TabacError(`Error while linking the module reference (${this.concern}) from a tabac rule [then section].`)
    }

}
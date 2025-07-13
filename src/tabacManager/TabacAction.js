import TabacError from "../error/TabacError.js";
import Configuration from "../model/Configuration.js";
import Module from "../model/Module.js";
import { getHubosTopicFromModule, getModuleSupervTopic } from "../utils/NameUtil.js";
import TabacTrigger from "./TabacTrigger.js";
export default class TabacAction {
    constructor(access, type, context, position) { // default context value if not provided
        this.access = access;
        this.position = position;
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
        if (!this.isFlow){
            this.period = context['period'];
        }
        if (this.isService && this.isNetworkClient){
            this.hosts = context['host'];
            this.isMultipleHosts = Array.isArray(this.hosts);
            if (!this.isMultipleHosts){
                this.hostsIsAll =  this.hosts.toLowerCase() === 'all';
            }
        }
        if(this.isFlow){
            this.value = context.value;
        }

        this.concern = context.concern;
        this.concernModuleID = null;
        this.openhabTrigger = null;
    }

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
                        hostPort: this.hostPort[i]
                    })
                }
                return res;
            }else{
                auth.server = this.hosts;
                auth.hostIp = this.hostIp[0];
                auth.hostPort = this.hostPort[0];
            }
        }else if (this.isDevice){
            auth.deviceUID = this.linkedDeviceUID;
        }
        return auth;

    }

    /**
     * 
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


    publishMqttAccess(message, hubosTopic, mqttBrokerUID){
        this.openhabTrigger = 
            {
                id: this.position,
                configuration:{
                    topic: hubosTopic,
                    value: message,
                    config: mqttBrokerUID
                },
                type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
            }
    }


    passTo(mqttBrokerUID){
        this.openhabTrigger = 
            {
                id: this.position,
                configuration:{
                    topic: getModuleSupervTopic(this.concernModuleID),
                    value: this.value,
                    config: mqttBrokerUID
                },
                type: 'mqtt.publishMQTT#26aa5ea09027ad2b11b752652e808c6a'
            }
        return this.openhabTrigger;
    }


    /**
     * Link device and/or server reference with the correct thing uid/host.
     * @param {Configuration} configuration 
     * @param {Array<Module>} modules 
     * @throws {TabacError} if impossible to perform link between device or server references.
     */
    linkEntityReferences(configuration, modules){
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
        }else if ((this.isService || this.isStream) && !this.hostsIsAll){
            let found = false;
            if (this.isMultipleHosts){
                for (const host of this.hosts) {
                    for (const server of configuration.servers) {
                        if (server.name === host){
                            this.hostIp.push(server.host);
                            this.hostPort.push(server.port);
                        }
                    }
                }
                if (this.hostIp.length !== this.hostPort.length || this.hostIp.length !== this.hosts.length){
                    throw new TabacError(`Error while linking the server references (${this.hosts}) from a tabac rule [then section].`)
                }
            }else{
                for (const server of configuration.servers) {
                    if (server.name === this.hosts){
                        this.hostIp.push(server.host);
                        this.hostPort.push(server.port);
                        found=true;
                    }
                }
                if(!found){
                    throw new TabacError(`Error while linking the server reference (${this.hosts}) from a tabac rule [then section].`)
                }
            }
        }
        for(const module of modules) {
            if (module.moduleName === this.concern){
                this.concernModuleID = module.moduleId;
                return;
            }
        }
        throw new TabacError(`Error while linking the module reference (${this.concern}) from a tabac rule [then section].`)
    }

}
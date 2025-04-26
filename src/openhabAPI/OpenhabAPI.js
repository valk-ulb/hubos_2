import axios from 'axios';
import base64 from 'base-64'
import OpenhabApiError from '../error/OpenhabApiError.js'
import {v4, uuidv4} from 'uuid'
export default class OpenhabAPI {
    constructor() { // default context value if not provided
       this.websocketUrl = `ws[s]://${process.env.OPENHAB_URL}:8443/ws?accessToken=${process.env.API_TOKEN}`
       this.baseUrl = `http://${process.env.OPENHAB_URL}:${process.env.OPENHAB_PORT}/rest`
       this.basicAuth = 'Basic ' + Buffer.from(`${process.env.API_TOKEN}:`).toString('base64');
       this.brokerThingUID = process.env.MQTT_BROKER_THING_UID;
       this.prefix = 'MQTT_Broker_Hubos_';
       this.rulePrefix = 'Hubos_Rule_';
        // this.frame = fr.getImageSample();
    }

    async getItemState(itemName) {
        try {
            const url = `${this.baseUrl}/items/${itemName}/state`
            const response = await axios.get(url, {
                    headers: {
                    'Authorization': this.basicAuth,
                    'Accept': 'text/plain'
                    }
            });
            return response.data
        } catch (error) {
            console.error('Erreur OpenHAB:', error.response?.data || error.message);
        }
    }

    async getBrokerThing(){
        try {
            const url = `${this.baseUrl}/things/${this.brokerThingUID}`
            const response = await axios.get(url, {
                    headers: {
                    'Authorization': this.basicAuth,
                    'Accept': 'application/json'
                    }
            });
            if (!Array.isArray(response.data) && response.data.UID === this.brokerThingUID){
                return response.data
            }else if (Array.isArray(response.data)){
                for (const broker of response.data){
                    if (broker.UID === this.brokerThingUID) return broker
                }
            }
            
            throw new Error('No broker compatible with given broker thing uid found.')
        } catch (error) {
            throw new OpenhabApiError('Error OpenHAB:', error);
        }
    }

    async linkItemToChannel(moduleId){
        try {
            const moduleName = this.replaceDashesWithUnderscores(moduleId);
            const channelUid = `${this.brokerThingUID}:${moduleName}`
            const itemName = `${this.prefix}${moduleName}`
            const url = `${this.baseUrl}/links/${itemName}/${channelUid}`

            const bodyData = JSON.stringify({
                itemName: itemName,
                channelUID: channelUid,
                configuration: {
                    profile: "system:trigger-event-string"
                }
            })

            const response = await axios.put(url, bodyData, {
                    headers: {
                    'Authorization': this.basicAuth,
                    'Accept': '*/*',
                    'Content-Type': 'application/json'
                    }
            });

            return response.data
            
        } catch (error) {
            throw new OpenhabApiError('Error OpenHAB:', error);
        }
    }

    async createTopicChannel(topic, moduleId){
        try {
            const moduleName = this.replaceDashesWithUnderscores(moduleId);
            const url = `${this.baseUrl}/things/${this.brokerThingUID}`;
            const newChannelUID = `${this.brokerThingUID}:${moduleName}`;
            const brokerThing = await this.getBrokerThing();

            const channels = brokerThing.channels;
            
            const newChannel = {
                uid: newChannelUID,
                id: moduleName,
                channelTypeUID: "mqtt:publishTrigger",
                kind: "TRIGGER",
                label: moduleName,
                description: "",
                defaultTags: [],
                properties: {},
                configuration: {
                    stateTopic: topic
                }
            }
            for (let i=0; i< channels.length;i++){
                if (channels[i].uid === newChannelUID){
                    channels.splice(i, 1);
                    break;
                }
            }
            channels.push(newChannel);

            const bodyData = JSON.stringify({channels});

            const response = await axios.put(url,bodyData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.basicAuth,
                    'Accept': '*/*'
                }
            });
            return response.data
        } catch (error) {
            console.error('Erreur OpenHAB:', error.response?.data || error.message);
        }
    }

    async createTopicItem(moduleId, appName){
        try {
            const moduleName= this.replaceDashesWithUnderscores(moduleId);
            const url = `${this.baseUrl}/items`
        
            const item = [{
                type: "String",
                name: `${this.prefix}${moduleName}`,
                label: moduleName,
                category: 'hubos',
                tags: [
                    "Hubos",
                    this.replaceDashesWithUnderscores(appName),
                    'Point'
                ],
                groupNames: [],
                stateDescription: {
                  pattern: "%s",
                  readOnly: false,
                  options: []
                },
                metadata: {
                  semantics: {
                    value: "Hubos"
                  }
                },
                editable: true
            }]
            const bodyData = JSON.stringify(item);
            const response = await axios.put(url,bodyData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.basicAuth,
                    'Accept': '*/*'
                }
            });

            return response.data
        } catch (error) {
            console.error('Error OpenHAB:', error.response?.data || error.message);
        }
    }

    async createRule(appName, moduleId, triggers, conditions, actions){
        const uid = this.generateUID();
        const moduleName = this.replaceDashesWithUnderscores(moduleId);
        try {
            const rule =
                {
                  status: {
                    status: "IDLE",
                    statusDetail: "NONE"
                  },
                  editable: true,
                  triggers: triggers,
                  conditions: conditions,
                  actions:actions,
                  configuration: {},
                  configDescriptions: [],
                  uid: uid,
                  name: moduleName,
                  tags: [
                    appName,
                    "Hubos"
                  ],
                  visibility: "VISIBLE"
                }


            const response = await axios.post(`${this.baseUrl}/rules`, tarRule, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.basicAuth,
                    'Accept': '*/*'
                }
            });
            console.log("Rule created successfully", response.status, response.statusText);
        }catch(error){
            console.log("Error creating rule",error.response ? error.response.data : error.message);
        }

    }

    replaceDashesWithUnderscores(input) {
        return input.replace(/-/g, '_');
    }

    replaceUnderscoresWithDashes(input) {
        return input.replace(/_/g, '-');
    }

    generateUID() {
        const uid = uuidv4().replace(/-/g, '');  // Supprime tous les tirets
        return uid;
    }
}
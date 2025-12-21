import axios from 'axios';
import base64 from 'base-64'
import OpenhabApiError from '../error/OpenhabApiError.js'
import util from 'util'
import { getRuleUID, replaceDashesWithUnderscores, replaceUnderscoresWithDashes } from '../utils/NameUtil.js';
import logger from '../utils/logger.js';
/**
 * Class in charge of the OpenHAB API interactions.
 */
export default class OpenhabAPI {

    /**
     * Constructor of the OpenhabAPI class.
     * the websoketUrl and baseUrl are built using the OpenHAB server URL, port, and API token.
     * OpenHAB API needs basic auth with the API token as username and an empty password.
     * The OpenHAB API documentation is available at http://<openhab_url>:<openhab_port>/developer/api-explorer
     */
    constructor() { 
        this.websocketUrl = `ws[s]://${process.env.OPENHAB_URL}:8443/ws?accessToken=${process.env.API_TOKEN}`
        this.baseUrl = `http://${process.env.OPENHAB_URL}:${process.env.OPENHAB_PORT}/rest`
        this.basicAuth = 'Basic ' + Buffer.from(`${process.env.API_TOKEN}:`).toString('base64');
        this.brokerThingUID = process.env.MQTT_BROKER_THING_UID;
        //this.prefix = 'MQTT_Broker_Hubos_';
        //this.rulePrefix = 'Hubos_Rule_';
        // this.frame = fr.getImageSample();
    }

    /**
     * Get the state of an item.
     * @param {String} itemName OpenHAB item name.
     * @returns {String} The response data containing the item state (see OpenHAB API documentation - GET /items/{itemname}/state).
     */
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
            logger.error('Error OpenHAB:',false, error.response?.data || error.message);
        }
    }

    /**
     * Set the state of an item.
     * @param {String} itemName OpenHAB item name.
     * @param {String} newState The new state to set.
     * @returns {String} The response data (see OpenHAB API documentation - PUT /items/{itemname}/state).
     */
    async setItemState(itemName, newState){
        try {
            const url = `${this.baseUrl}/items/${itemName}/state`

            const response = await axios.put(url, newState, {
                headers: {
                    'Authorization': this.basicAuth,
                    'Accept': '*/*',
                    'Content-Type': 'application/json'
                }
            });

            return response.data
        } catch (error) {
            logger.error('Error OpenHAB:',false, error.response?.data || error.message);
        }
    }

    /**
     * Get the broker thing.
     * @returns {Object} The response data containing the broker thing (see OpenHAB API documentation - GET /things/{thingUID}).
     */
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

    /**
     * Remove an item from the OpenHAB registry.
     * @param {String} itemName - the name of the item to remove
     * @returns {String} The response data (see OpenHAB API documentation - DELETE /items/{itemname}).
     */
    async removeItem(itemName){
        try {
            const url = `${this.baseUrl}/items/${itemName}`
            const response = await axios.delete(url, {
                    headers: {
                    'Authorization': this.basicAuth,
                    'Accept': 'application/json'
                    }
            });
            return response.data;
        } catch (error) {
            throw new OpenhabApiError('Error OpenHAB:', error);
        }
    }

    /**
     * Remove all links that refer to an item or thing.
     * @param {String} itemName - item name or thing UID.
     * @returns {String} The response data (see OpenHAB API documentation - DELETE /links/{object}).
     */
    async removeLink(itemName){
        try {
            const url = `${this.baseUrl}/links/${itemName}`
            //console.log(url)
            const response = await axios.delete(url, {
                    headers: {
                    'Authorization': this.basicAuth,
                    'Accept': 'application/json'
                    }
            });
            return response.data;
        } catch (error) {
            throw new OpenhabApiError('Error OpenHAB:', error);     
        }
    }

    /**
     * Removes an existing rule corresponding to the given ruleUID.
     * @param {String} ruleUID - UID of the rule to remove
     * @returns the response data (see OpenHAB API documentation - DELETE /rules/{ruleUID}).
     */
    async removeRule(ruleUID){
        try {
            const url = `${this.baseUrl}/rules/${ruleUID}`
            const response = await axios.delete(url, {
                    headers: {
                    'Authorization': this.basicAuth,
                    'Accept': 'application/json'
                    }
            });
            return response.data;
        } catch (error) {
            throw new OpenhabApiError('Error OpenHAB:', error);
        }
    }

    /**
     * Links an item to a channel.
     * Especially used for linking an MQTT topic channel to an item.
     * @param {String} moduleId - the module UID
     * @returns response data (see OpenHAB API documentation - PUT /links/{itemname}/{channeluid}).
     */
    async linkItemToChannel(moduleId){
        try {
            const moduleName = replaceDashesWithUnderscores(moduleId);
            const channelUid = `${this.brokerThingUID}:${moduleName}`
            const itemName = moduleName //`${this.prefix}${moduleName}`
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

    /**
     * Creates a new channel for a topic.
     * This function first retrieves the current broker thing configuration, adds a new channel for the given topic,
     * and then updates the broker thing with the new channel configuration.
     * @param {String} topic - the MQTT topic to create the channel for.
     * @param {String} moduleId - the module UID
     * @returns response data (see OpenHAB API documentation - PUT /things/{thingUID}).
     */
    async createTopicChannel(topic, moduleId){
        try {
            const moduleName = replaceDashesWithUnderscores(moduleId);
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
            logger.error('Error OpenHAB:',false, error.response?.data || error.message);
        }
    }

    /**
     * Removes a channel from the MQTT Broker in OpenHAB.
     * This function first retrieves the current broker thing configuration and its list of linked channels, removes the channel corresponding to the given moduleId,
     * and then updates the broker thing with the new channel configuration.
     * @param {String} moduleId - the module UID for which the channel is to be removed
     * @returns response data (see OpenHAB API documentation - PUT /things/{thingUID}).
     */
    async removeTopicChannel(moduleId){
        try {
            const moduleName = replaceDashesWithUnderscores(moduleId);
            const url = `${this.baseUrl}/things/${this.brokerThingUID}`;
            const channelUID = `${this.brokerThingUID}:${moduleName}`;
            const brokerThing = await this.getBrokerThing();

            const channels = brokerThing.channels;
            
            for (let i=0; i< channels.length;i++){
                if (channels[i].uid === channelUID){
                    channels.splice(i, 1);
                    break;
                }
            }

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
            logger.error('Error OpenHAB:',false, error.response?.data || error.message);
        }
    }

    /**
     * Create an item in OpenHAB that will hold the message published to the module's topic.
     * @param {String} moduleId - the module UID
     * @param {String} appName - the application name
     * @returns response data (see OpenHAB API documentation - PUT /items).
     */
    async createTopicItem(moduleId, appName){
        try {
            const moduleName= replaceDashesWithUnderscores(moduleId);
            const url = `${this.baseUrl}/items`
        
            const item = [{
                type: "String",
                name: moduleName,//`${this.prefix}${moduleName}`,
                label: moduleName,
                category: 'hubos',
                tags: [
                    "Hubos",
                    replaceDashesWithUnderscores(appName),
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
            logger.error('Error OpenHAB:',false, error.response?.data || error.message);
        }
    }

    /**
     * Create a new rule in OpenHAB.
     * Especially used for creating rules decoded from TABAC rules.
     * see OpenHAB API documentation - POST /rules
     * @param {String} appName - the application name
     * @param {String} appId - the application ID
     * @param {String} rulename - the rule name
     * @param {any} triggers - JSON object representing the trigger of the rule (decoded from TabacRule). 
     * @param {any} conditions - JSON object representing the array of conditions of the rule (decoded from TabacRule).
     * @param {any} actions - JSON object representing the array of actions of the rule (decoded from TabacRule).
     */
    async createRule(appName, appId,rulename, triggers, conditions, actions){
        const moduleName = replaceDashesWithUnderscores(appId);
        const uid = getRuleUID(moduleName,rulename)
        try {
            const tarRule =
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

            const response = await axios.post(`${this.baseUrl}/rules`, JSON.stringify(tarRule), {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.basicAuth,
                    'Accept': '*/*'
                }
            });
            logger.info("Rule created successfully",false, response.status, response.statusText);
        }catch(error){
            logger.error("Error creating rule",false,error.response ? error.response.data : error.message);
        }

    }
    
}
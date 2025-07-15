import mqtt from 'mqtt'
import logger from '../utils/logger.js'
import MqttError from '../error/MqttError.js'
import MqttAlreadyExistError from '../error/MqttAlreadyExistError.js'
import MqttNotFoundError from '../error/MqttError.js';
import { replaceDashesWithUnderscores, replaceUnderscoresWithDashes } from '../utils/NameUtil.js';
import permissionManager from '../Controller/PermissionManager.js';
import util from 'util'
export default class MqttClient{
    
    constructor(){
        this.adminTopic = '$CONTROL/dynamic-security/v1';
        this.url = `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;
        this.adminId = "";
        this.username = process.env.MQTT_ADMIN_USERNAME;
        this.password = process.env.MQTT_ADMIN_PASSWORD;
        this.admin = null;
    }

    async connect(){
        return new Promise((resolve, reject) => {
            this.admin = mqtt.connect(this.url, {
                clientId: this.adminId,
                username: this.username,
                password: this.password
            });

            this.admin.on('connect', () => {
                logger.info(`MQTT connected at ${this.url}`,true);
                resolve();
            })

            this.admin.on('error', (err) => {
                logger.error('Error MQTT :',true, err.message);
                reject(err);
            });

            this.admin.on('message', (topic, message) => {
                if (topic.startsWith('admin/auth-')){
                    this.manageAuthMessage(topic, message);
                }else{
                    this.manageReceivedMessage(topic, message);
                }
    
            });


        })
    }

    manageReceivedMessage(topic, message){
        if (topic === `${this.adminTopic}/response`){
            const response = JSON.parse(message);
            logger.info(`message received on ${topic} `);
        }
    }

    manageAuthMessage(topic, message){
        logger.info(`auth message received on ${topic} : ${message}`);
        const concernedModuleId = replaceUnderscoresWithDashes(topic.slice(11));
        try{
            permissionManager.addNewPermission(message, concernedModuleId);
        }catch(error){
            logger.error(`Manage Auth message error: `, true, error);
        }
    }

    disconnect() {
        if (this.admin) {
            this.admin.end(() => {
                logger.info('MQTT deconnected',true);
            });
        }
    }

    async subscribeToAdminTopic(){
        if (!this.admin || !this.admin.connected) {
            logger.error('Client MQTT not connected.',true);
            throw new MqttError('Client MQTT not connected');
        }
        await this.admin.subscribe(`${this.adminTopic}/#`);

    }

    async subscribeToAuthTopic(topic){
        logger.info("subscribe to "+ topic,true)
        if (!this.admin || !this.admin.connected) {
            logger.error('Client MQTT not connected.',true);
            throw new MqttError('Client MQTT not connected');
        }
        await this.admin.subscribe(`${topic}/#`);
    }

    /**
     * Send to the mqtt admin topic a request for creating a new mqtt client. 
     * @param {String} moduleId - module id.
     * @param {String} password - password.
     * @param {String} clientId - client id for the mqtt client.
     * @param {String} appName - name of the app for the client.
     * @param {String} description - description for the mqtt client.
     * @param {String[]} groups - List of group names for the mqtt client.
     * @param {String[]} roles - List of role names for the mqtt client.
     */
    async createClient(moduleId, password, clientId,description, roles= null, groups=null) {
        logger.info(`creating client for : ${moduleId}`,true)
        if (!this.admin || !this.admin.connected) {
            logger.error('Client MQTT not connected.',true);
            throw new MqttError('Client MQTT not connected');
        }
    
        const command = {
            command: 'createClient',
            username: moduleId,
            password: password,
            clientid: clientId,
            textname: `Client ${moduleId}`,
            textdescription: description,
            groups:[],
            roles:[]
        };
    
        if (groups) {
            for(const group of groups){
                command.groups.push({groupname:group, priority: 1})
            }
        }
        if (roles){
            for(const role of roles){
                command.roles.push({rolename:role, priority: 1})
            }
        }
    
        const payload = {
            commands: [command]
        };
    
        await this.publish(payload,'createClient');
    }

    /**
     * Set client password
     * @param {String} username - username/moduleId of the client to set. 
     * @param {*} newPassword - New password to set.
     */
    async setClientPassword(username, newPassword){
        logger.info(`set client password : ${username}`,true)
        if (!this.admin || !this.admin.connected) {
            logger.error('Client MQTT not connected.',true);
            throw new MqttError('Client MQTT not connected');
        }
      
        const payload = {
            commands: [
                {
                    command: 'setClientPassword',
                    username: username,
                    password: newPassword
                }
            ]
        };
      
        await this.publish(payload, 'setClientPassword');
    }


    /**
     * Delete a mqtt client with its username.
     * @param {String} username - Username of the client to delete. 
     */
    async deleteClient(username) {
        logger.info(`deleting client : ${username}`,true)
        if (!this.admin || !this.admin.connected) {
            logger.error('Client MQTT not connected.',true);
            throw new MqttError('Client MQTT not connected');
        }
      
        const payload = {
            commands: [
                {
                    command: 'deleteClient',
                    username: username
                }
            ]
        };
      
        await this.publish(payload, 'deleteClient')
    }
    
    /**
     * restart client from being able to log in. 
     * @param {String} username - Client username.
     */
    async enableClient(username) {
        logger.info(`enabling client : ${username}`,true)
        if (!this.admin || !this.admin.connected) {
          logger.error('MQTT client is not connected.');
          throw new MqttError('Client MQTT not connected');
        }
      
        const payload = {
            commands: [
                {
                    command: 'enableClient',
                    username: username
                }
            ]
        };
      
        await this.publish(payload, 'enableClient')
    }

    /**
     * Stop a client from being able to log in, and kick any clients with matching username that are currently connected.
     * @param {String} username Client username. 
     */
    async disableClient(username) {
        logger.info(`disabling client : ${username}`,true)
        if (!this.admin || !this.admin.connected) {
          logger.error('MQTT client is not connected.',true);
          throw new MqttError('Client MQTT not connected');
        }
      
        const payload = {
            commands: [
                {
                    command: 'disableClient',
                    username: username
                }
            ]
        };
      
        await this.publish(payload, 'disableClient')
    }

    /**
     * get mqtt client from username.
     * @param {String} username 
     * @returns 
     */
    async getClient(username){
        logger.info(`get client : ${username}`,true)
        if (!this.admin || !this.admin.connected) {
            logger.error('MQTT client is not connected.',true);
            throw new MqttError('Client MQTT not connected');
        }
        
        const payload = {
            commands: [
                {
                    command: 'getClient',
                    username: username
                }
            ]
        };
        return await this.publish(payload, 'getClient')
    }

    /**
     * Create a role specific for a module. The role only authorize to subscribe to specific topic
     * @param {String} moduleId - Module UID. 
     * @param {String} rolename - name for the created role
     * @returns String of rolename 
     */
    async createModuleRole(moduleId, rolename){
        logger.info(`create role : ${moduleId}`,true)
        if (!this.admin || !this.admin.connected) {
            logger.error('MQTT client is not connected.',true);
            throw new MqttError('Client MQTT not connected');
        }
        const topic = replaceDashesWithUnderscores(moduleId);

        const command = {
            command: 'createRole',
            rolename: rolename,
            textname: "",
            textdescription: "",
            acls: [
                { acltype: "subscribePattern", topic: `hubos/topic-${topic}/#`, priority: -1, allow: true},
                { acltype: "publishClientSend ", topic: `hubos/topic-${topic}/#`, priority: -1, allow: true},
                { acltype: "publishClientReceive", topic: `hubos/topic-${topic}/#`, priority: -1, allow: true},
                { acltype: "subscribePattern", topic: `hubos/topic-${topic}-superv/#`, priority: -1, allow: true},
                { acltype: "publishClientReceive", topic: `hubos/topic-${topic}-superv/#`, priority: -1, allow: true},
            ]
        };
    
        const payload = {
            commands: [command]
        };
    
        await this.publish(payload,'createRole')
    }

    async clientExistWithRole(username, rolename){
        let res = await this.getClient(username);
        return res && res.client && 
            res.client.username === username && 
            res.client.roles && res.client.roles[0] && 
            res.client.roles[0].rolename === rolename;
    }

    //`role_supervisor_${entityName}`
    async createSupervisorRole(rolename){
        logger.info(`create role : ${rolename}`,true)
        if (!this.admin || !this.admin.connected) {
            logger.error('MQTT client is not connected.',true);
            throw new MqttError('Client MQTT not connected');
        }

        const command = {
            command: 'createRole',
            rolename: rolename,
            textname: "",
            textdescription: "",
            acls: [
                { acltype: "publishClientSend", topic: "#", priority: -1, allow: true },
				{ acltype: "publishClientReceive", topic: "#", priority: -1, allow: true },
				{ acltype: "subscribePattern", topic: "#", priority: -1, allow: true },
				{ acltype: "unsubscribePattern", topic: "#", priority: -1, allow: true }
            ]
        };
    
        const payload = {
            commands: [command]
        };
    
        await this.publish(payload,'createRole')
    }

    async deleteRole(rolename){
        logger.info(`delete role : ${rolename}`,true)
        if (!this.admin || !this.admin.connected) {
            logger.error('MQTT client is not connected.',true);
            throw new MqttError('Client MQTT not connected');
        }
        
        const payload = {
            commands: [
                {
                    command: 'deleteRole',
                    rolename: rolename
                }
            ]
        };
    
        await this.publish(payload, 'deleteRole')  
    }

    /*async old_publish(payload, error_message, success_message){
        this.admin.publish(
            this.adminTopic,
            JSON.stringify(payload),
            { qos: 1 },
            (err) => {
                if (err) {
                    throw new MqttError(error_message, err.message);
                } else {
                    logger.info(success_message);
                }
            }
        );
    }    */

    async publish(payload, exceptedCommand){
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.admin.removeListener('message', onMessage);
                reject(new MqttError('Timeout waiting for getClient response'));
            }, 10000);

            const onMessage = (topic, message) => {
                if (topic === `${this.adminTopic}/response`){
                    logger.info(`message received on ${topic}`);
                    const response = JSON.parse(message);
                    if (response.responses && response.responses[0] && response.responses[0].command === exceptedCommand){
                        if (response.responses[0].error ){
                            if (response.responses[0].error.toString().includes('already exists')){
                                logger.error(`Error trying ${exceptedCommand} -- not necessarily a runtime error`, true, response.responses[0].error.toString());
                            }else if (response.responses[0].error.toString().includes('not found')){
                                logger.error(`Error trying ${exceptedCommand} -- not necessarily a runtime error`,true, response.responses[0].error.toString());
                            }
                            else{
                                reject(new MqttError(`Error trying ${exceptedCommand}`, response.responses[0].error.toString()))
                            }
                        }
                        logger.info(`Result received from ${exceptedCommand}`)
                        clearTimeout(timeout);
                        this.admin.removeListener('message',onMessage);
                        resolve(response.responses[0].data);
                    }
                }        
            }
            this.admin.on('message', onMessage);

            this.admin.publish(
                this.adminTopic,
                JSON.stringify(payload),
                { qos: 1 },
                (err) => {
                    if (err) {
                        clearTimeout(timeout);
                        this.admin.removeListener('message', onMessage);
                        reject(new MqttError(`Error trying ${exceptedCommand}`,err));              
                    }else{
                        logger.info(`Command ${exceptedCommand} send`)
                    }
                }
            );
        })
    }

}
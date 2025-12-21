import MqttNotFoundError from '../error/MqttError.js';
import MqttAdmin from '../mqtt/MqttAdmin.js';
import MqttClient from '../mqtt/MqttClient.js';

/**
 * Class in charge of MQTT communication.
 */
export default class MqttController {

    /**
     * Constructor of the class.
     */
    constructor(){
        this.adminMqtt = new MqttAdmin();
        this.openhabSupRoleName = `role_supervisor_${process.env.MQTT_HUBOS_CLIENT_USERNAME}`
        this.hubosSuproleName = `role_supervisor_${process.env.MQTT_HUBOS_CLIENT_USERNAME}`
        this.clientMqtt = new MqttClient();
    }

    /**
     * Init the connecion with the admin account and create the openhab and hubos supervisors client.
     */
    async initMqttClient(){
        this.adminMqtt.connect();
        this.adminMqtt.subscribeToAdminTopic();
        if (!await this.adminMqtt.clientExistWithRole(process.env.MQTT_HUBOS_CLIENT_USERNAME, this.hubosSuproleName)){
            await this.adminMqtt.createSupervisorRole(this.hubosSuproleName).then( () => {
                this.adminMqtt.createClient(process.env.MQTT_HUBOS_CLIENT_USERNAME,process.env.MQTT_HUBOS_CLIENT_PASSWORD, '', '',[this.hubosSuproleName])
            });
        }
        if (!await this.adminMqtt.clientExistWithRole(process.env.MQTT_OPENHAB_CLIENT_USERNAME, this.openhabSupRoleName)){
            await this.adminMqtt.createSupervisorRole(this.openhabSupRoleName).then( () => {
                this.adminMqtt.createClient(process.env.MQTT_OPENHAB_CLIENT_USERNAME,process.env.MQTT_OPENHAB_CLIENT_PASSWORD, '', '',[this.openhabSupRoleName])
            });
        }
    }

    /**
     * Create a mqtt role + client for a module.
     * If a module already has a mqtt client do not create it. 
     * @param {String} moduleId - Module UID 
     * @param {String} password - Password for the module. 
     */
    async createModuleClient(moduleId, password){
        const moduleRoleName = `role_${moduleId}`
        if (!await this.adminMqtt.clientExistWithRole(moduleId, moduleRoleName)){
            await this.adminMqtt.createModuleRole(moduleId, moduleRoleName).then( () => {
                this.adminMqtt.createClient(moduleId, password, '', '',[moduleRoleName]);
            })
        }else{
            await this.adminMqtt.setClientPassword(moduleId, password);
        }
    }

    /**
     * Delete the MQTT Client + Role linked to a module.  
     * @param {String} moduleId - Module UID. 
     */
    async deleteModuleClient(moduleId){
        const moduleRoleName = `role_${moduleId}`
        try {
            await this.adminMqtt.deleteClient(moduleId);
        }catch(err){
            if (err !== MqttNotFoundError){
                throw err
            }
        }
        try {
            await this.adminMqtt.deleteRole(moduleRoleName);
        }catch(err){
            if (err !== MqttNotFoundError){
                throw err
            }
        }
    }
}
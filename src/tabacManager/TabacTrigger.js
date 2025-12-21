import TabacError from '../error/TabacError.js';
import Device from '../model/Device.js';
import Module from '../model/Module.js';
import { getItemNameFromModule } from '../utils/NameUtil.js';
import {isEventMqtt, getEventWithoutPrefix} from '../utils/tabacUtil.js'

/**
 * Class representing a Tabac trigger or condition.
 * Triggers/Conditions are defined in <TABAC_RULE_NAME>/When/# and <TABAC_RULE_NAME>/Condition/#.
 * A trigger/condition can be of type time, device or mqtt event.
 * This class handles the decoding of the trigger/condition into an OpenHAB rule Trigger/Condition segment.
 * At this moment, only Updated, Changed, Equals, Higher, Lower, Higher or Equals, Lower or Equals contexts are supported.
 */
export default class TabacTrigger {
    /**
     * Constructor of a TabacTrigger/Condition.
     * @param {String} event - the event of the trigger/condition (can be mqtt, system, or device).
     * @param {String} context - the context of the trigger/condition (equals, higher, lower, GenericCronTrigger,etc.)
     * @param {Any} values - the values of the trigger/condition used to compare (can be an array or a string).
     * @param {Number} position - the position of the trigger/condition in the rule.
     */
    constructor(event, context, values, position) { // default context value if not provided
        this.position = position;
        this.event = event;
        this.context = context;
        this.isEventMqtt = this.event.toLowerCase().startsWith('mqtt.');
        this.isSystem = this.event.toLowerCase().startsWith('system.');
        this.isEventDevice = this.event.toLowerCase().startsWith('device.')
        this.eventWithoutPrefix =  getEventWithoutPrefix(event, this.isEventMqtt);
        this.values = values;
        
        // if the event is system.time, we have special triggers contexts.
        this.isTime = this.event.toLowerCase() === 'system.time';
        this.isDateTimeTrigger = this.context === 'DateTimeTrigger'; // the rule is triggered at the date and time specified in an item's state. 
        this.isDateTimeTriggerTimeOnly = this.context === 'DateTimeTriggerTimeOnly'; // the rule is triggered at the time specified in an item's state and only the time of the item should be compared.
        this.isTimeOfDayTrigger = this.context === 'TimeOfDayTrigger'; // the rule is triggered at a specific time of the day.
        this.isGenericCronTrigger = this.context === 'GenericCronTrigger'; // The rule is triggered at specific cron times.

        if (this.isTime && Array.isArray(this.values)){
            throw new TabacError('Error: system.timer trigger do not allow array of values.')
        }
        this.openhabTrigger = null;

        this.itemName = null;
    }

    /**
     * Decode this TabacTrigger/Condition into an OpenHAB Rule Trigger/Condition segment.
     * @returns an Object representing the OpenHAB Rule Trigger/Condition segment.
     */
    decodeTabac(){
        if (this.isTime){
            if (this.isDateTimeTrigger || this.isDateTimeTriggerTimeOnly){
                this.scheduleDateTimeTrigger();
            }else if(this.isTimeOfDayTrigger){
                this.scheduleTimeOfDayTrigger();
            }else if(this.isGenericCronTrigger){
                this.scheduleGenericCronTrigger();
            }
        }else if (this.isOperator()) {
            this.itemHasAGivenState(this.itemName, this.values);
        }else if (this.context.toLowerCase() === 'changed'){
            this.hasChanged(this.itemName,this.values[0],this.values[1]);
        }else if (this.context.toLowerCase() === 'updated'){
            this.wasUpdated(this.itemName,this.values);
        }
        return this.openhabTrigger;
    }

    /**
     * Link device and/or server reference with the correct thing uid/host.
     * Will set linkedDeviceUID for device actions and hostIp for service actions.
     * @param {Configuration} configuration - the configuration containing devices and servers.
     * @param {Array<Device>} devices - the list of devices from the configuration of this app. 
     * @param {Array<Module>} modules - the list of modules of the app to find the concerned module ID.
     * @throws {TabacError} if impossible to perform link between device or server references.
     */
    linkEntityReferences(devices, modules){
        if (this.isEventMqtt){
            for (const module of modules){
                if (module.moduleName === this.eventWithoutPrefix){
                    this.itemName = getItemNameFromModule(module.moduleId);
                    return;
                }
            }
            throw new TabacError(`Error no module found for rule referring : ${this.eventWithoutPrefix}`)
        }else if (this.isEventDevice){
            for (const device of devices){
                if (device.name === this.eventWithoutPrefix){
                    this.itemName = device.deviceUID;
                    return;
                }
            }
            throw new TabacError(`Error no device found for rule referring : ${this.eventWithoutPrefix}`)
        }else if (this.isDateTimeTrigger || this.isDateTimeTriggerTimeOnly){
            for (const module of modules){
                if (module.moduleName === this.values){
                    this.itemName = getItemNameFromModule(module.moduleId);
                    return;
                }
            }
            throw new TabacError(`Error no module found for rule referring : ${this.values}`)
        }
    }

    /**
     * Function dedicated to create a GenericCronTrigger OpenHAB Trigger.
     * Used when the TabacTrigger is of context GenericCronTrigger.
     * this.values contain the cron expression.
     */
    scheduleGenericCronTrigger(){
        this.openhabTrigger = 
            {
                id: this.position,
                configuration:{
                    cronExpression: this.values
                },
                type: 'timer.GenericCronTrigger'
            }
    }

    /**
     * Function dedicated to create a TimeOfDayTrigger OpenHAB Trigger.
     * Used when the TabacTrigger is of context TimeOfDayTrigger.
     * this.values contain the time of day to trigger the rule.
     */
    scheduleTimeOfDayTrigger(){
        this.openhabTrigger = 
            {
                id: this.position,
                configuration:{
                    time: this.values
                },
                type: 'timer.TimeOfDayTrigger'
            }
    }

    /**
     * Function dedicated to create a DateTimeTrigger OpenHAB Trigger.
     * Used when the TabacTrigger is of context DateTimeTrigger or DateTimeTriggerTimeOnly.
     * this.values contain the item name containing the date time to trigger the rule.
     * if DateTimeTriggerTimeOnly, only the time of the item is considered.
     */
    scheduleDateTimeTrigger(){
        this.openhabTrigger = 
            {
                id: this.position,
                configuration:{
                    timeOnly: this.isDateTimeTriggerTimeOnly,
                    itemName: this.itemName
                },
                type: 'timer.DateTimeTrigger'
            }
    }

    /**
     * Function dedicated to create an ItemStateUpdateTrigger OpenHAB Trigger.
     * Used when the TabacTrigger is of context Updated.
     * By default, any state update is considered.
     * If newState is provided and not 'any', only updates to that state are considered.
     * ItemStateUpdateTrigger monitors state updates of an item.
     * in the context of HubOS, the item monitored is generally a module supervision item or an OpenHAB (device) item.
     * @param {String} itemName - the item name to monitor for state updates.
     * @param {String} newState - The new state to monitor for updates. If 'any' or empty, any state update is considered.
     */
    wasUpdated(itemName, newState){
        this.openhabTrigger =
        {
            id: this.position,
            configuration: {
                itemName: itemName,
            },
            type: "core.ItemStateUpdateTrigger"
        }
        if (newState !== '' && newState.toLowerCase() !== 'any'){
            this.openhabTrigger.configuration.state = newState;
        }
    }

    /**
     * Function dedicated to create an ItemStateChangeTrigger OpenHAB Trigger.
     * Used when the TabacTrigger is of context Changed.
     * By default, any state change is considered. (from any state to any state)
     * If fromState is provided and not 'any', only changes from that state are considered.
     * If toState is provided and not 'any', only changes to that state are considered.
     * ItemStateChangeTrigger monitors state changes of an item.
     * in the context of HubOS, the item monitored is generally a module supervision item or an OpenHAB (device) item.
     * @param {String} itemName - the item name to monitor for state changes.
     * @param {String} fromState - The previous state to monitor for changes. If 'any' or empty, any previous state is considered.
     * @param {String} toState - The new state to monitor for changes. If 'any' or empty, any new state is considered.
     */
    hasChanged(itemName, fromState, toState){
        this.openhabTrigger =
        {
            id: this.position,
            configuration: {
                itemName: itemName,
            },
            type: "core.ItemStateChangeTrigger"
        }
        if (fromState !== '' && fromState.toLowerCase() !== 'any'){
            this.openhabTrigger.configuration.previousState = fromState;
        }
        if (toState !== '' && toState.toLowerCase() !== 'any'){
            this.openhabTrigger.configuration.state = toState;
        }
    }

    /**
     * Function dedicated to create an ItemStateCondition OpenHAB Trigger.
     * Used when the TabacTrigger is of operator context (Equals, Higher, Lower, Higher or Equals, Lower or Equals, etc.).
     * This.values contain the state to compare with.
     * @param {String} itemName - the item name to monitor for state conditions.
     * @param {String} toState - The new state to compare with.
     */
    itemHasAGivenState(itemName, toState){
        let operator = '>';
        switch(this.context.toLowerCase()){
            case 'equals':
                operator = '=';
                break;
            case 'not equals':
                operator = '!=';
                break;
            case 'higher or equals':
                operator = '>=';
                break;
            case 'higher':
                operator = '>';
                break;
            case 'lower or equals':
                operator = '<=';
                break;
            case 'lower':
                operator = '<';
                break;
            case 'not higher or equals':
                operator = '<';
                break;
            case 'not higher':
                operator = '<=';
                break;
            case 'not lower or equals':
                operator = '>';
                break;
            case 'not lower':
                operator = '>=';
                break;
        }
        this.openhabTrigger =
        {
            inputs:{},
            id: this.position,
            configuration: {
                itemName: itemName,
                state: toState,
                operator: operator
            },
            type: "core.ItemStateCondition"
        }
    }

    /**
     * Check if the context is one of the following:
     * equals, not equals, higher, lower, higher or equals, lower or equals,
     * not higher, not lower, not higher or equals, not lower or equals.
     * @returns True if the context is one of the operators.
     */
    isOperator(){
        const operators = ['equals','not equals','higher','lower','higher or equals','lower or equals',
            'not higher','not lower','not higher or equals','not lower or equals'];
        
        return operators.includes(this.context.toLowerCase());
    }
}
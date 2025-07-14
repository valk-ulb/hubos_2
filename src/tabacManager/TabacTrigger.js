import TabacError from '../error/TabacError.js';
import Device from '../model/Device.js';
import Module from '../model/Module.js';
import { getItemNameFromModule } from '../utils/NameUtil.js';
import {isEventMqtt, getEventWithoutPrefix} from '../utils/tabacUtil.js'
export default class TabacTrigger {
    // CHANGED (ANY TO ANY or X TO Y) - UPDATED - CONTAINS - CONTAINS ANY - EQUALS - HIGHER THAN - HIGHER OR EQUALS THAN - LOWER THAN - LOWER OR EQUAL THAN
    constructor(event, context, values, position) { // default context value if not provided
        this.position = position;
        this.event = event;
        this.context = context;
        this.isEventMqtt = this.event.toLowerCase().startsWith('mqtt.');
        this.isSystem = this.event.toLowerCase().startsWith('system.');
        this.isEventDevice = this.event.toLowerCase().startsWith('device.')
        this.eventWithoutPrefix =  getEventWithoutPrefix(event, this.isEventMqtt);
        this.values = values;
        
        this.isTime = this.event.toLowerCase() === 'system.time';
        this.isDateTimeTriggerTimeOnly = this.context === 'DateTimeTriggerTimeOnly';
        this.isDateTimeTrigger = this.context === 'DateTimeTrigger';
        this.isTimeOfDayTrigger = this.context === 'TimeOfDayTrigger';
        this.isGenericCronTrigger = this.context === 'GenericCronTrigger';

        if (this.isTime && Array.isArray(this.values)){
            throw new TabacError('Error: system.timer trigger do not allow array of values.')
        }
        this.openhabTrigger = null;

        this.itemName = null;
    }

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
     * 
     * @param {Array<Device>} devices 
     * @param {Array<Module>} modules 
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

    isOperator(){
        const operators = ['equals','not equals','higher','lower','higher or equals','lower or equals',
            'not higher','not lower','not higher or equals','not lower or equals'];
        
        return operators.includes(this.context.toLowerCase());
    }
}
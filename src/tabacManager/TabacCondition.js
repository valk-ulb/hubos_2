import {isEventMqtt, getEventWithoutPrefix} from '../utils/tabacUtil.js'

/**
 * Class representing a Tabac condition.
 * Conditions are defined in <TABAC_RULE_NAME>/condition/#.
 * A condition is quite similar to a trigger.
 * Deprecated: use TabacTrigger.js instead.
 */
export default class TabacCondition {
    /**
     * Constructor of a Tabac condition.
     * quite similar to TabacTrigger.js
     * @param {String} name - the name of the condition.
     * @param {String} event - the event of the condition (can be mqtt, system, or device).
     * @param {String} context - the context of the condition (equals, higher, lower, GenericCronTrigger,etc.)
     * @param {String} value 
     */
    constructor(name, event, context, value ) {
        this.name = name;
        this.event = event;
        this.isEventMqtt = isEventMqtt(event);
        this.eventWithoutPrefix =  getEventWithoutPrefix(event, this.isEventMqtt);
        this.context = context;
        this.value = value;
    }


    timeOfDayCondition(){
        this.openhabTrigger = 
            {
                id: this.position,
                configuration:{
                    startTime: this.value[0],
                    endTime: this.value[1]
                },
                type: 'core.TimeOfDayCondition'
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

    /**
     * Link device and/or server reference with the correct thing uid/host.
     * @param {Configuration} configuration 
     */
    linkEntityReferences(configuration){
        // TODO 
    }

}
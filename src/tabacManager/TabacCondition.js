import {isEventMqtt, getEventWithoutPrefix} from '../utils/tabacUtil.js'

export default class TabacCondition {
    constructor(name, event, context, value ) { // default context value if not provided
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
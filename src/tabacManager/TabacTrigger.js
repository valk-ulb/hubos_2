import {isEventMqtt, getEventWithoutPrefix} from '../utils/tabacUtil.js'
export default class TabacTrigger {
    // CHANGED (ANY TO ANY or X TO Y) - UPDATED - CONTAINS - CONTAINS ANY - EQUALS - HIGHER THAN - HIGHER OR EQUALS THAN - LOWER THAN - LOWER OR EQUAL THAN
    constructor(event, context, values) { // default context value if not provided
        this.event = event;
        this.context = context;
        this.isEventMqtt = isEventMqtt(event);
        this.eventWithoutPrefix =  getEventWithoutPrefix(event, this.isEventMqtt);
        this.values = values;
    }

}
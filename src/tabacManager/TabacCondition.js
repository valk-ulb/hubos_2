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

    /**
     * Link device and/or server reference with the correct thing uid/host.
     * @param {Configuration} configuration 
     */
    linkEntityReferences(configuration){

    }

}
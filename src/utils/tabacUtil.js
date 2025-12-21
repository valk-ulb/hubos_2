/**
 * Return true if the given event has a mqtt. prefix.
 * @param {String} event TABAC event field
 */
export function isEventMqtt(event){
    return event.startsWith('mqtt.');
}

/**
 * get event without the prefix mqtt. or system.
 * @param {String} event TABAC event field
 * @param {Boolean} isMqtt Boolean indicating if the event is mqtt or system
 */
export function getEventWithoutPrefix(event,isMqtt){
    if (isMqtt){
        return event.slice(5);
    }else{
        return event.slice(7);
    }
}

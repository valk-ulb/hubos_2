/**
 * is given event string a mqtt entity
 * @param {String} event 
 */
export function isEventMqtt(event){
    return event.startsWith('mqtt.');
}

/**
 * get event without the prefix mqtt. or system.
 * @param {String} event 
 * @param {Boolean} isMqtt 
 */
export function getEventWithoutPrefix(event,isMqtt){
    if (isMqtt){
        return event.slice(5);
    }else{
        return event.slice(7);
    }
}

/**
 * return true if the then.access is a reference to a device or server.
 * @param {String} access then.access
 * @returns true if start with a @ 
 */
export function isActionAccessAReference(access){
    return access.startsWith('@');
}


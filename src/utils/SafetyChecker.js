
/**
 * Checks if the given name is safe name.
 * It allows only alphanumeric characters, hyphens, underscores, and dots.
 * It also disallows any sequence that could lead to directory traversal or injection (like "..").
 * @param {String} name - the name to check
 * @returns {boolean} true if the directory name is safe.
 */
export function isSafeName(name){
    const safeRegex = /^[A-Za-z0-9._\-]+$/;
    return safeRegex.test(name) && !name.includes('..');
}

/**
 * Checks if the given uid represent a correct UID format.
 * In the form of a AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE.
 * @param {String} uid - the uid to check
 * @returns {boolean} true if the uid format is correct.
 */
export function isSafeUID(uid){
    const safeRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
    return safeRegex.test(uid);
}

/**
 * Checks if the given uid represent an UID with empty string acceptance.
 * @param {String} uid - the uid to check
 * @returns {boolean} true if the uid is correct.
 */
export function isSafeUIDWithEmptyStringAcceptance(uid){
    const safeRegex = /^[A-Za-z0-9._:\-]+$/;
    return safeRegex.test(uid) || uid==='';
}

/**
 * Checks if a given type is safe.
 * Especially made for manifest, config and TABAC type field.
 * Accept only letters, underscores and hyphens.
 * @param {String} type - the type to check
 * @returns {boolean} true if the type is safe.
 */
export function isSafeType(type){
    const safeRegex = /^[a-zA-Z_-]+$/;
    return safeRegex.test(type);
}

/**
 * Checks if a given TABAC/action/type is accepted by HubOS.
 * Especially made for TABAC/action/type field.
 * Accept only specific values: service, device, flow, stream, system.
 * @param {String} type - the type to check
 * @returns {boolean} true if the type is accepted.
 */
export function isSafeActionType(type){
    const accessTypes = ['service','device','flow','stream','system'];
    return accessTypes.includes(type.toLowerCase());
}

/**
 * Checks if a given value is safe.
 * Especifically made for TABAC/value field.
 * Allows alphanumeric characters and some special characters.
 * Disallows any sequence that could lead to directory traversal or injection (like "..").
 * @param {String} value - the value to check
 * @returns {boolean} true if the value is safe.
 */
export function isSafeValue(value){
    const safeRegex = /^[a-zA-Z0-9 ?*.\-_,/:]+$/;
    return safeRegex.test(value) && !value.includes('..');
}

/**
 * Checks if a given TABAC/context is accepted by HubOS.
 * Especifically made for TABAC/Trigger/context and TABAC/Condition/context fields.
 * Only specific contexts are allowed (changed, updated, higher, higher or equals, etc.).
 * @param {String} context - the context to check
 * @returns {boolean} true if the context is accepted.
 */
export function isSafeContext(context){
    const contexts = [
        'changed','updated','between','contains',
        'contains any','equals','equals any','higher or equals',
        'higher','lower or equals','lower',
        'not equals','not higher or equals',
        'not higher','not lower or equals','not lower', 'genericcrontrigger', 'timeofdaytrigger', 
        'datetimetriggertimeonly', 'datetimetrigger'
    ];
    return contexts.includes(context.toLowerCase());
}

/**
 * Checks if a givent event is accepted by HubOS and safe.
 * Especifically made for TABAC/Trigger/event and TABAC/Condition/event fields.
 * Allows only events starting with "mqtt.", "system." or "device." followed by alphanumeric characters, underscores or slashes.
 * @param {String} event - the event to check
 * @returns {boolean} true if the event is accepted and safe.
 */
export function isSafeEvent(event){
    const safeRegex = /^(mqtt\.|system\.|device\.)[a-zA-Z0-9_\/]*$/;
    return safeRegex.test(event)
}

/**
 * Check if a given host is safe. 
 * Especifically made for TABAC/then/context/host field.
 * Allows only alphanumeric characters, dots, slashes, underscores and hyphens.
 * @param {String} host - the host to check
 * @returns {boolean} true if the host is safe.
 */
export function isSafeContextHost(host){
    const safeRegex = /^[a-zA-Z0-9./_\-]+$/;
    return safeRegex.test(host)
}

/**
 * Check if a given text is safe.
 * Allows only alphanumeric characters, spaces and some special characters.
 * Disallows any sequence that could lead to directory traversal or injection (like "..").
 * Specially made for names and descriptions fields in manifest.json, config.json and rules.json .
 * @param {String} text - the text to check
 * @returns {boolean} true if the text is safe.
 */
export function isSafeText(text){
    const safeRegex = /^[a-zA-Z0-9 .\-_,()]+$/;
    return safeRegex.test(text) && !text.includes('..');
}

/**
 * Check if a given text is a strictly positivenumber in the integer format.
 * @param {String} text - the text to check
 * @returns {boolean} true if the text is a number.
 */
export function isNumber(text){
    const safeRegex = /^[0-9]+$/;
    return safeRegex.test(text);
}

/**
 * Check if a given text is a number in the integer format.
 * Specially made for TABAC/Then/Context/period field.
 * This value can be either a positive or negative integer.
 * @param {String} text - the text to check
 * @returns {boolean} true if the text is a number.
 */
export function isPeriod(text){
    const safeRegex = /^-?[0-9]+$/;
    return safeRegex.test(text);
}

/**
 * Check if a given text is a strictly positive number in the integer format.
 * @param {String} text - the text to check
 * @returns {boolean} true if the text is a number.
 */
export function isNumberWithEmptyStringAcceptance(text){
    const safeRegex = /^[0-9]+$/;
    return safeRegex.test(text) || text === '';
}

/**
 * Check if a given text is a host.
 * It can be a domain name or an IP address.
 * @param {String} text - the text to check
 * @returns {boolean} true if the text is a host.
 */
export function isHost(text){
    const safeRegex = /^[a-zA-Z0-9.\-/:]+$/;
    return safeRegex.test(text);
}

/**
 * Check if a given text is a host.
 * It can be a domain name or an IP address.
 * Allows also empty string.
 * @param {String} text - the text to check
 * @returns {boolean} true if the text is a host or empty.
 */
export function isHostWithEmptyStringAcceptance(text){
    const safeRegex = /^[a-zA-Z0-9.\-_:/#]+$/;
    return safeRegex.test(text) || text === '';
}

/**
 * Check if a given text is a safe pass_to value.
 * No more in use.
 * @param {String} text - the text to check
 */
export function isSafePassToValue(text){
    const safeRegex = /^[a-zA-Z0-9.\- _\//]+$/;
    return safeRegex.test(text)
}
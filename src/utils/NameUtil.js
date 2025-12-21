/**
 * Create an item name from a module UID by replacing dashes with underscores and prefixing with "item_".
 * Specifically made for openhab item names.
 * @param {String} moduleId - the module UID
 * @returns {String} the item name with the module UID
 */
export function getItemNameFromModule(moduleId){
    return `item_${replaceDashesWithUnderscores(moduleId)}`;
}

/**
 * Create a MQTT topic name from a module UID by replacing dashes with underscores and prefixing with "hubos/topic-".
 * Specifically made for the creation of MQTT topics reserved for the module.
 * @param {String} moduleId - the module UID
 * @returns {String} the MQTT topic name
 */
export function getHubosTopicFromModule(moduleId){
    return `hubos/topic-${replaceDashesWithUnderscores(moduleId)}`
}

/**
 * Create a role name from a module UID by replacing dashes with underscores and prefixing with "role-".
 * Specifically made for the creation of a MQTT ACL role.
 * @param {String} moduleId - the module UID
 * @returns {String} the role name
 */
export function getRoleFromModule(moduleId){
    return `role-${replaceDashesWithUnderscores(moduleId)}`
}

/**
 * Create a supervision topic name from a module UID by replacing dashes with underscores, prefixing with "hubos/topic-" and suffixing with "-superv".
 * Specifically made for the creation of supervision topics reserved for OpenHAB and HubOS.
 * @param {String} moduleId - the module UID
 * @returns {String} the supervision topic name
 */
export function getModuleSupervTopic(moduleId){
    return `hubos/topic-${replaceDashesWithUnderscores(moduleId)}-superv`
}

/**
 * Create an authentication topic name from a module UID by replacing dashes with underscores and prefixing with "admin/auth-".
 * Specifically made for the creation of authentication topics reserved for the communication between OpenHAB and HubOS.
 * @param {String} moduleId - the module UID
 * @returns {String} the authentication topic name
 */
export function getModuleAuthTopic(moduleId){
    return `admin/auth-${replaceDashesWithUnderscores(moduleId)}`;
}

/**
 * Create a rule UID from an app UID and a rule name by replacing dashes with underscores.
 * Specifically made for the creation of rule UIDs in OpenHAB.
 * @param {String} appId - the app UID
 * @param {String} ruleName - the rule name
 * @returns {String} the rule UID
 */
export function getRuleUID(appId,ruleName){
    return `rule_${replaceDashesWithUnderscores(appId)}_${replaceDashesWithUnderscores(ruleName)}`
}

/**
 * Replace all dashes in a string with underscores.
 * @param {String} input - the input string
 * @returns {String} the string with dashes replaced by underscores
 */
export function replaceDashesWithUnderscores(input) {
    return input.replace(/-/g, '_');
}

/**
 * Replace all underscores in a string with dashes.
 * @param {String} input - the input string
 * @returns {String} the string with underscores replaced by dashes
 */
export function replaceUnderscoresWithDashes(input) {
    return input.replace(/_/g, '-');
}
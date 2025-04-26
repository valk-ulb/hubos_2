
/**
 * Check if a given element is not null and respect a given format. If not throw an error.
 * @param {any} element - The element to check.
 * @param {function} safetyCheckerFun - Safety check function. 
 * @param {Error} error - Error class.
 * @param {String} errorDescription - Error description.
 * @param {String} appPath - Path to the app. 
 * @returns True if the given element respect the format. Otherwise throw an error.
 */
export function checkFormat(element, safetyCheckerFun, error, errorDescription, appPath) {
    if (!element || !safetyCheckerFun(element)){
        throw new error(`Error: ${errorDescription} : ${appPath}`);
    }else{
        return true;
    }
}


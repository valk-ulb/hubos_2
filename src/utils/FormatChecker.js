
/**
 * generic function that check if a given element is not null and respect a given format via its check function. If not throw an error.
 * @param {any} element - The element to validate (in most case, a string).
 * @param {function} safetyCheckerFun - Safety check function (see ./SafetyChecker.js). 
 * @param {Error} error - Error class (see error directory).
 * @param {String} errorDescription - A description of the error if throwned.
 * @param {String} appPath - Path to the app (mainly used to print details when an error is thrown). 
 * @returns {Boolean} True if the given element is not empty and respect the format. Otherwise throw an error.
 * @throws {any} if the element fail the safety check process throw an error using the error class given in param.
 */
export function checkFormat(element, safetyCheckerFun, error, errorDescription, appPath) {
    if (!element || !safetyCheckerFun(element)){
        throw new error(`Error: ${errorDescription} : ${appPath}`);
    }else{
        return true;
    }
}



/**
 * Checks if the given directory name is safe.
 * It allows only alphanumeric characters, hyphens, underscores, and dots.
 * It also disallows any sequence that could lead to directory traversal (like "..").
 * @param {String} name, the directory name to check
 * @returns {boolean} true if the directory name is safe.
 */
export function isSafeName(name){
    const safeRegex = /^[A-Za-z0-9._\-]+$/;
    return safeRegex.test(name) && !name.includes('..');
}

export function isSafeUID(uid){
    const safeRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
    return safeRegex.test(uid);
}

export function isSafeUIDWithEmptyStringAcceptance(uid){
    const safeRegex = /^[A-Za-z0-9._:\-]+$/;
    return safeRegex.test(uid) || uid==='';
}

export function isSafeType(type){
    const safeRegex = /^[a-zA-Z]+$/;
    return safeRegex.test(type);
}

export function isSafeActionType(type){
    const accessTypes = ['service','device','flow','stream','system'];
    return accessTypes.includes(type.toLowerCase());
}

export function isSafeValue(value){
    const safeRegex = /^[a-zA-Z0-9 ?*.\-_,/:]+$/;
    return safeRegex.test(value) && !value.includes('..');
}

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

export function isSafeEvent(event){
    const safeRegex = /^(mqtt\.|system\.|device\.)[a-zA-Z0-9_\/]*$/;
    return safeRegex.test(event)
}

export function isSafeCron(cron){
    
}

export function isSafeContextHost(host){
    const safeRegex = /^[a-zA-Z0-9./_\-]+$/;
    return safeRegex.test(host)
}

export function isSafeText(text){
    const safeRegex = /^[a-zA-Z0-9 .\-_,]+$/;
    return safeRegex.test(text) && !text.includes('..');
}

export function isNumber(text){
    const safeRegex = /^[0-9]+$/;
    return safeRegex.test(text);
}

export function isNumberWithEmptyStringAcceptance(text){
    const safeRegex = /^[0-9]+$/;
    return safeRegex.test(text) || text === '';
}

export function isHost(text){
    const safeRegex = /^[a-zA-Z0-9.\-/]+$/;
    return safeRegex.test(text);
}

export function isHostWithEmptyStringAcceptance(text){
    const safeRegex = /^[a-zA-Z0-9.\-/]+$/;
    return safeRegex.test(text) || text === '';
}

export function isSafePassToValue(text){
    const safeRegex = /^[a-zA-Z0-9.\- _\//]+$/;
}
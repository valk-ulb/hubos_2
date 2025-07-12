export function getItemNameFromModule(moduleId){
    return `item_${replaceDashesWithUnderscores(moduleId)}`;
}

export function getHubosTopicFromModule(moduleId){
    return `hubos/topic-${replaceDashesWithUnderscores(moduleId)}`
}

export function getRoleFromModule(moduleId){
    return `role-${replaceDashesWithUnderscores(moduleId)}`
}

export function getModuleSupervTopic(moduleId){
    return `hubos/topic-${replaceDashesWithUnderscores(moduleId)}-superv`
}

export function getModuleAuthTopic(moduleId){
    return `admin/auth-${replaceDashesWithUnderscores(moduleId)}`;
}

export function getRuleUID(appId,ruleName){
    return `rule_${replaceDashesWithUnderscores(appId)}_${replaceDashesWithUnderscores(ruleName)}`
}

export function replaceDashesWithUnderscores(input) {
    return input.replace(/-/g, '_');
}

export function replaceUnderscoresWithDashes(input) {
    return input.replace(/_/g, '-');
}
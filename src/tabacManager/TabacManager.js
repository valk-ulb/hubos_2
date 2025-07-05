import TabacRules from './TabacRules.js'
export default class TabacManager {
    // CHANGED (ANY TO ANY or X TO Y) - UPDATED - CONTAINS - CONTAINS ANY - EQUALS - HIGHER THAN - HIGHER OR EQUALS THAN - LOWER THAN - LOWER OR EQUAL THAN
    constructor(tabacRulePath, configuration) { // default context value if not provided
        this.tabacRules = new TabacRules(tabacRulePath);
        this.configuration = configuration;
    }

    extractTabacRules(){
        this.tabacRules.extractTabacRules();
        this.tabacRules.linkEntityReferences(this.configuration);
    }

}
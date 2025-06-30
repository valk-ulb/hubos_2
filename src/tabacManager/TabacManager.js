const path = require('node:http');
const TabacRules = require('./TabacRules')

module.exports = class TabacManager {
    // CHANGED (ANY TO ANY or X TO Y) - UPDATED - CONTAINS - CONTAINS ANY - EQUALS - HIGHER THAN - HIGHER OR EQUALS THAN - LOWER THAN - LOWER OR EQUAL THAN
    constructor(tabacRulePath) { // default context value if not provided
        this.uid = uid;
        this.tabacRules = new TabacRules(tabacRulePath);
    }

    extractTabacRules(){
        this.tabacRules.extractTabacRules();
    }

}
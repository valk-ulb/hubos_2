const path = require('node:path');
const TabaRule = require('./TabacRule')

module.exports = class TabacRules {
    // CHANGED (ANY TO ANY or X TO Y) - UPDATED - CONTAINS - CONTAINS ANY - EQUALS - HIGHER THAN - HIGHER OR EQUALS THAN - LOWER THAN - LOWER OR EQUAL THAN
    constructor(appDir, tabacRulePath, uid) { // default context value if not provided
        this.tabacRules = [];
        this.uid = uid;
        const rulesFilePath = path.join(appDir, tabacRulePath);
        const rulesFile = fs.readFileSync(rulesFilePath);
        this.appTabacRules = JSON.parse(rulesFile);
    }

    extractTabacRules(){
        this.appTabacRules.array.forEach(rule => {
            this.tabacRules.push(new TabaRule(rule['name'], rule['when'],rule['condition'], rule['then']));
        });
    }
}
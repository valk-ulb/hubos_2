import path from 'node:path'
import fs from 'fs'  

import TabacRule from './TabacRule.js';
export default class TabacRules {
    // CHANGED (ANY TO ANY or X TO Y) - UPDATED - CONTAINS - CONTAINS ANY - EQUALS - HIGHER THAN - HIGHER OR EQUALS THAN - LOWER THAN - LOWER OR EQUAL THAN
    constructor(tabacRulePath) { // default context value if not provided
        this.tabacRules = [];
        const rulesFilePath = tabacRulePath;
        const rulesFile = fs.readFileSync(rulesFilePath);
        this.appTabacRules = JSON.parse(rulesFile);
        console.log(this.appTabacRules)
    }

    extractTabacRules(){
        this.appTabacRules.forEach(rule => {
            this.tabacRules.push(new TabacRule(rule['name'], rule['when'],rule['condition'], rule['then']));
        });
    }
}
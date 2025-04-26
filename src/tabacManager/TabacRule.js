const TabacTrigger = require('./TabacTrigger')
const TabacAction = require('./TabacAction')
const TabacCondition = require('./TabacCondition')

module.exports = class TabacRule {
    // CHANGED (ANY TO ANY or X TO Y) - UPDATED - CONTAINS - CONTAINS ANY - EQUALS - HIGHER THAN - HIGHER OR EQUALS THAN - LOWER THAN - LOWER OR EQUAL THAN
    constructor(name,triggers,conditions,actions ) { // default context value if not provided
        this.name = name;
        this.triggers = new TabacTrigger(triggers['event'],triggers['context'],triggers['value']);
        this.actions = []
        this.conditions = []

        conditions.array.forEach(condition => {
            this.conditions.push(new TabacCondition(condition['access'], condition['type'],condition['context']));
        });
        
        actions.array.forEach(action => {
            this.actions.push( new TabacAction(action['access'],action['type'],action['context']));
        });
    }
}

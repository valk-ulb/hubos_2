import TabacTrigger from './TabacTrigger.js'
import TabacAction from './TabacAction.js'
import TabacCondition from './TabacCondition.js'

export default class TabacRule {
    // CHANGED (ANY TO ANY or X TO Y) - UPDATED - CONTAINS - CONTAINS ANY - EQUALS - HIGHER THAN - HIGHER OR EQUALS THAN - LOWER THAN - LOWER OR EQUAL THAN
    constructor(name,triggers,conditions,actions ) { // default context value if not provided
        this.name = name;
        this.triggers = new TabacTrigger(triggers['event'],triggers['context'],triggers['value']);
        this.actions = []
        this.conditions = []

        conditions.forEach(condition => {
            this.conditions.push(new TabacCondition(condition['name'], condition['if']['event'],condition['if']['context'], condition['if']['value']));
        });
        
        actions.forEach(action => {
            this.actions.push( new TabacAction(action['access'],action['type'],action['context'], action['context']['period']));
        });
    }
}

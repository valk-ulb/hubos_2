module.exports = class TabacCondition {
    constructor(name, event, context, value ) { // default context value if not provided
        this.name = name;
        this.event = event;
        this.context = context;
        this.value = value;
    }

}
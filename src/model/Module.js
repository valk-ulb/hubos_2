export default class Module {

    constructor(moduleName, moduleType,moduleDescription, moduleId=null) { // default context value if not provided
        this.moduleName = moduleName;
        this.moduleType = moduleType;
        this.moduleDescription = moduleDescription;
        this.moduleId = moduleId;
    }

    setID(id){
        this.moduleId=id;
    }

}
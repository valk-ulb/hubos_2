/**
 * Class representing a module of an app from the manifest file.
 */
export default class Module {

    /**
     * Constructor of the Module class.
     * @param {String} moduleName - name of the module.
     * @param {String} moduleType - type of the module.
     * @param {String} moduleDescription - description of the module.
     * @param {String} moduleId - id of the module (represents the ID on the Database).
     */
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
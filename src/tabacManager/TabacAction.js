import { isActionAccessAReference } from "../utils/tabacUtil.js";
export default class TabacAction {
    constructor(access, type, context) { // default context value if not provided
        this.access = access;
        this.isFlow = type.toLowerCase() === 'flow';
        this.isService = type.toLowerCase() === 'service';
        this.device = type.toLowerCase() === 'device';
        this.stream = type.toLowerCase() === 'stream';
        this.system = type.toLowerCase() === 'system';
        this.accessIsRef = isActionAccessAReference(this.access);
        this.type = type;
        this.context = context;
        this.period = 1;
        this.hosts = null;
        this.hostsIsAll = false;
        this.isMultipleHosts = false;
        this.pass_to = null;

        if (!this.isFlow){
            this.period = context.period;
        }else if (this.isService){
            this.hosts = context.host;
            this.isHostAll = this.hosts.toLowerCase() === 'all';
            this.isMultipleHosts = Array.isArray(this.hosts);
        }else if (this.isFlow){
            this.pass_to = context.pass_to;
        }
    }

    /**
     * Link device and/or server reference with the correct thing uid/host.
     * @param {Configuration} configuration 
     */
    linkEntityReferences(configuration){

    }

}
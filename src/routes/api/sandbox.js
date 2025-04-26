import e from "express";
import path from 'path';
import ApiController from "../../Controller/ApiController.js";

export default class SandboxRouter{
    constructor(viewsPath){
        this.sandboxRouter = e.Router();
        this.viewsPath = viewsPath;
        this.apiController = new ApiController();
    }

    setRoutes(){
    }

    getRouter(){
        return this.sandboxRouter;
    }
}



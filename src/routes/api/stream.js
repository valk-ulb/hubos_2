import e from "express";
import path from 'path';
import ApiController from "../../Controller/ApiController.js";

export default class StreamRouter{
    constructor(viewsPath){
        this.streamRouter = e.Router();
        this.viewsPath = viewsPath;
        this.apiController = new ApiController();
    }

    setRoutes(){
    }

    getRouter(){
        return this.streamRouter;
    }
}



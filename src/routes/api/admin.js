import e from "express";
import path from 'path';
import ApiController from "../../Controller/ApiController.js";

export default class AdminRouter{
    constructor(viewsPath){
        this.adminRouter = e.Router();
        this.viewsPath = viewsPath;
        this.apiController = new ApiController();
    }

    setRoutes(){
        this.adminRouter.route('/create')
            .post(this.apiController.createAdmin);

        this.adminRouter.route('/modify')
            .post(this.apiController.modifyAdmin);
    }

    getRouter(){
        return this.adminRouter;
    }
}



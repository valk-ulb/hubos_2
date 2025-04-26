import e from "express";
import path from 'path';

export default class rootRooter{
    constructor(viewsPath){
        this.rootRooter = e.Router();
        this.viewsPath = viewsPath;
    }

    setRoutes(){
        this.rootRooter.route('/').get( (req, res) => {
            res.sendFile(path.join(this.viewsPath, 'index.html'));
        });
    }

    getRouter(){
        return this.rootRooter;
    }
}